/* ══════════════════════════════════════════════════════
   CLANKER'S CARD COLLECTION — cards-logic.js
   Storage, crate opening, collection UI, rendering,
   leaderboard integration, bet hooks.
   ══════════════════════════════════════════════════════ */

/* ── Storage Keys ────────────────────────────────────── */
const CK_COLLECTION = 'cards.collection';   // {[cardId]: {count, firstPulled, season}}
const CK_INVENTORY  = 'cards.inventory';    // {common:0, uncommon:0, rare:0, epic:0, legendary:0}
const CK_SHARDS     = 'cards.shards';       // number (dollar value)
const CK_SHOWCASE   = 'cards.showcase';     // string[] up to 5 cardIds
const CK_DAILY      = 'cards.daily';        // {date, claimed}
const CK_NEWUSER    = 'cards.newuserused';  // 'true' if used
const CK_PROCESSED  = 'cards.lastbet';      // last processed bet id (float)

/* ── Module State ────────────────────────────────────── */
let _cardsCollection = {};   // {cardId: {count, firstPulled, season}}
let _cardsInventory  = {};   // {crateId: count}
let _cardsShards     = 0;
let _cardsShowcase   = [];   // cardId[] up to 5
let _cardsDaily      = null; // {date, claimed}
let _cardsNewUserUsed = false;
let _cardsLoaded     = false;
let _cardsActiveTab  = 'shop';
let _cardsBankroll   = null; // loaded directly from sb.profile; never depends on sportsbook tab

/* ══════════════════════════════════════════════════════
   STORAGE HELPERS
   ══════════════════════════════════════════════════════ */
async function _cGet(key) {
  try { const r = await window.storage.get(key); return JSON.parse(r.value); }
  catch(e) { return null; }
}
async function _cSet(key, val) {
  try { await window.storage.set(key, JSON.stringify(val)); } catch(e) {}
}

async function _cardsLoadBankroll() {
  // Prefer live in-memory _sbProfile if already loaded by the Sportsbook tab
  if (typeof _sbProfile !== 'undefined' && _sbProfile && typeof _sbProfile.bankroll === 'number') {
    _cardsBankroll = _sbProfile.bankroll;
    return;
  }
  // Otherwise read directly from storage — works even if Sportsbook tab was never opened
  try {
    const raw = await window.storage.get('sb.profile');
    const prof = JSON.parse(raw.value);
    _cardsBankroll = typeof prof.bankroll === 'number' ? prof.bankroll : null;
  } catch(e) {
    _cardsBankroll = null;
  }
}

async function _cardsLoad() {
  const [col, inv, shards, showcase, daily, newuser] = await Promise.all([
    _cGet(CK_COLLECTION), _cGet(CK_INVENTORY), _cGet(CK_SHARDS),
    _cGet(CK_SHOWCASE),   _cGet(CK_DAILY),     _cGet(CK_NEWUSER)
  ]);
  _cardsCollection  = col  || {};
  _cardsInventory   = inv  || {};
  _cardsShards      = typeof shards === 'number' ? shards : 0;
  _cardsShowcase    = Array.isArray(showcase) ? showcase.slice(0,5) : [];
  _cardsDaily       = daily || null;
  _cardsNewUserUsed = newuser === true;
  _cardsLoaded      = true;
}

async function _cardsSave() {
  await Promise.all([
    _cSet(CK_COLLECTION, _cardsCollection),
    _cSet(CK_INVENTORY,  _cardsInventory),
    _cSet(CK_SHARDS,     _cardsShards),
    _cSet(CK_SHOWCASE,   _cardsShowcase),
    _cSet(CK_DAILY,      _cardsDaily)
  ]);
  // Publish to shared leaderboard if we have a sportsbook profile
  _cardsPublishLeaderboard();
}

/* ══════════════════════════════════════════════════════
   LEADERBOARD SHARED STORAGE
   ══════════════════════════════════════════════════════ */
async function _cardsPublishLeaderboard() {
  if (typeof _sbProfile === 'undefined' || !_sbProfile) return;
  const safeNick = (_sbProfile.nickname || 'anon')
    .replace(/[^a-zA-Z0-9_-]/g,'_').slice(0,20);
  const gbCount = Object.keys(_cardsCollection).filter(id => {
    const card = CARD_POOL.find(c => c.id === id);
    return card && card.rarity === 'gamebreaker';
  }).length;
  const showcase = _cardsShowcase.map(id => {
    const card = CARD_POOL.find(c => c.id === id);
    return card ? { id: card.id, rarity: card.rarity } : null;
  }).filter(Boolean);
  const entry = { gbCount, showcase };
  try { await window.storage.set('cards.lb.' + safeNick, JSON.stringify(entry), true); }
  catch(e) {}
}

async function _cardsFetchLbEntry(nick) {
  const safeNick = (nick||'anon').replace(/[^a-zA-Z0-9_-]/g,'_').slice(0,20);
  try {
    const r = await window.storage.get('cards.lb.' + safeNick, true);
    return JSON.parse(r.value);
  } catch(e) { return null; }
}

/* ══════════════════════════════════════════════════════
   COLLECTION MANAGEMENT
   ══════════════════════════════════════════════════════ */
function _cardsOwns(cardId) {
  return !!_cardsCollection[cardId];
}

function _cardsCount(cardId) {
  return _cardsCollection[cardId] ? _cardsCollection[cardId].count : 0;
}

/* Add a card to collection; returns true if new, false if duplicate */
function _cardsAddCard(card) {
  if (!_cardsCollection[card.id]) {
    _cardsCollection[card.id] = { count: 1, firstPulled: Date.now(), season: CARDS_SEASON };
    return true;
  } else {
    _cardsCollection[card.id].count++;
    // Convert to shards
    _cardsShards = Math.round((_cardsShards + SHARD_VALUES[card.rarity]) * 100) / 100;
    return false;
  }
}

/* Add a crate to inventory */
function _cardsAddCrate(crateId, n) {
  _cardsInventory[crateId] = (_cardsInventory[crateId] || 0) + (n || 1);
}

/* ══════════════════════════════════════════════════════
   DAILY FREE CRATE
   ══════════════════════════════════════════════════════ */
function _localDateStr() {
  const d = new Date();
  return d.getFullYear() + '-' +
    String(d.getMonth()+1).padStart(2,'0') + '-' +
    String(d.getDate()).padStart(2,'0');
}

function _dailyIsClaimed() {
  if (!_cardsDaily) return false;
  return _cardsDaily.date === _localDateStr() && _cardsDaily.claimed;
}

function _dailyMarkClaimed() {
  _cardsDaily = { date: _localDateStr(), claimed: true };
}

/* Called when a qualifying bet is placed ($1+) */
async function cardsOnBetPlaced(stakeAmount) {
  if (stakeAmount < 1) return;
  if (!_cardsLoaded) await _cardsLoad();
  if (_dailyIsClaimed()) return;
  _dailyMarkClaimed();
  _cardsAddCrate('common');
  await _cardsSave();
  // Refresh shop if cards tab is visible
  if (_cardsActiveTab === 'shop' && document.getElementById('panel-cards')?.classList.contains('active')) {
    _renderCardsShop();
  }
}

/* ══════════════════════════════════════════════════════
   BET SETTLEMENT HOOK — award crates for won bets
   ══════════════════════════════════════════════════════ */
async function _cardsProcessSettledBets() {
  if (!_cardsLoaded) await _cardsLoad();
  let lastId = await _cGet(CK_PROCESSED) || 0;

  // Read sportsbook bets
  let bets = [];
  try {
    const raw = await window.storage.get('sb.bets');
    bets = JSON.parse(raw.value) || [];
  } catch(e) { return; }

  const wonBets = bets.filter(b =>
    b.status === 'settled' &&
    b.result === 'win' &&
    b.id > lastId
  );

  if (!wonBets.length) return;

  let newLastId = lastId;
  for (const bet of wonBets) {
    newLastId = Math.max(newLastId, bet.id);
    let crateId = null;
    if (bet.betType === 'single') {
      crateId = cardsCrateTierForSingleBet(bet.ml);
    } else if (bet.betType === 'parlay') {
      crateId = cardsCrateTierForParlay((bet.legs || []).length, bet.parlayML);
    }
    if (crateId) _cardsAddCrate(crateId);
  }

  await _cSet(CK_PROCESSED, newLastId);
  await _cardsSave();
}

/* ══════════════════════════════════════════════════════
   CRATE OPENING
   ══════════════════════════════════════════════════════ */
function _cardsOpenCrate(crateId) {
  const count = _cardsInventory[crateId] || 0;
  if (count < 1) return;
  const def = CRATE_DEFS.find(c => c.id === crateId);
  if (!def) return;

  _cardsInventory[crateId]--;
  const card = cardsRollCrate(crateId);
  if (!card) { _cardsInventory[crateId]++; return; }

  const isNew = _cardsAddCard(card);
  _cardsSave();
  _showCrateOpening(def, () => _showLotteryReveal(def, card, isNew));
}

/* ── Purchase confirmation modal ─────────────────────── */
function _showBuyConfirm(def, price, onConfirm) {
  const overlay = document.createElement('div');
  overlay.className = 'cards-confirm-overlay';
  overlay.innerHTML = `
    <div class="cards-confirm-modal">
      <div class="cards-confirm-crate-icon">${def.icon}</div>
      <div class="cards-confirm-title">${def.name}</div>
      <div class="cards-confirm-body">Purchase for <strong>$${price.toFixed(2)}</strong>?</div>
      <div class="cards-confirm-actions">
        <button class="cards-confirm-btn cc-confirm" id="ccbtn-confirm">Confirm</button>
        <button class="cards-confirm-btn cc-cancel"  id="ccbtn-cancel">Cancel</button>
      </div>
    </div>
  `;
  document.body.appendChild(overlay);
  overlay.querySelector('#ccbtn-confirm').addEventListener('click', () => {
    overlay.remove();
    onConfirm();
  });
  overlay.querySelector('#ccbtn-cancel').addEventListener('click', () => overlay.remove());
  overlay.addEventListener('click', e => { if (e.target === overlay) overlay.remove(); });
}

/* ── Buy crate from shop ─────────────────────────────── */
async function _cardsBuyCrate(crateId, isNewUserDeal) {
  const def = CRATE_DEFS.find(c => c.id === crateId);
  if (!def) return;

  const price = isNewUserDeal ? def.price * 0.5 : def.price;

  // Pre-confirm checks
  if (isNewUserDeal && _cardsNewUserUsed) {
    alert('You have already used the new user offer.');
    return;
  }

  await _cardsLoadBankroll();
  if (_cardsBankroll === null) {
    alert('You need a Sportsbook profile to buy crates. Open the Sportsbook tab first.');
    return;
  }
  if (_cardsBankroll < price) {
    alert(`Insufficient funds. You need $${price.toFixed(2)} but have $${_cardsBankroll.toFixed(2)}.`);
    return;
  }

  _showBuyConfirm(def, price, async () => {
    if (isNewUserDeal) {
      _cardsNewUserUsed = true;
      await _cSet(CK_NEWUSER, true);
    }
    // Deduct directly from storage so it works whether or not _sbProfile is loaded
    try {
      const raw = await window.storage.get('sb.profile');
      const prof = JSON.parse(raw.value);
      prof.bankroll = Math.round((prof.bankroll - price) * 100) / 100;
      await window.storage.set('sb.profile', JSON.stringify(prof));
      _cardsBankroll = prof.bankroll;
      // Keep in-memory _sbProfile in sync if it exists
      if (typeof _sbProfile !== 'undefined' && _sbProfile) _sbProfile.bankroll = prof.bankroll;
    } catch(e) {}
    try { if (typeof _sbSaveLeaderboard === 'function') await _sbSaveLeaderboard(); } catch(e) {}

    _cardsAddCrate(crateId);
    await _cardsSave();
    _renderCardsShop();
    _cardsOpenCrate(crateId);
  });
}

/* ══════════════════════════════════════════════════════
   CRATE REVEAL UI
   ══════════════════════════════════════════════════════ */
function _showCrateOpening(def, onOpen) {
  const el = document.createElement('div');
  el.className = 'crate-open-overlay';
  el.innerHTML = `
    <div class="crate-open-icon">${def.icon}</div>
    <div class="crate-open-label">Opening ${def.name}</div>
    <button class="crate-open-btn" id="crate-open-now-btn">Tap to Open</button>
  `;
  document.body.appendChild(el);
  const btn = el.querySelector('#crate-open-now-btn');
  const doOpen = () => {
    el.remove();
    onOpen();
  };
  btn.addEventListener('click', doOpen);
  el.addEventListener('click', (e) => { if (e.target === el) doOpen(); });
}

function _showLotteryReveal(def, card, isNew) {
  let skipped = false;
  const ovr = Math.round((card.off + card.def + card.clutch + card.cons + card.ath) / 5);
  const logoMap  = typeof TEAM_LOGO  !== 'undefined' ? TEAM_LOGO  : null;

  // Random pools for each cycling stage
  const rarityPool  = ['Pro','Impact','Clutch','Elite','Superstar','Game-Breaker'];
  const teamPool    = ['BOS','NYK','LAL','GSW','CHI','MIA','PHX','DAL','DEN','MIL',
                       'PHI','ATL','BKN','CHA','CLE','DET','HOU','IND','LAC','MEM',
                       'MIN','NOP','OKC','ORL','POR','SAC','SAS','TOR','UTA','WAS'];
  const posPool     = ['PG','SG','SF','PF','C'];
  const ovrPool     = Array.from({length:20}, (_,i) => String(60 + i * 2)); // 60,62…98
  const namePool    = ['Johnson','Davis','Williams','Brown','Smith','Jones','Green',
                       'Robinson','Thomas','Jackson','Walker','Harris','Mitchell'];

  const renderTeam = v => {
    const url = logoMap ? logoMap[v] : null;
    return url
      ? `<img src="${url}" alt="${v}" class="lottery-team-img" onerror="this.style.display='none'">`
      : `<span>${v}</span>`;
  };

  const stages = [
    { key:'rarity',   label:'RARITY',   real: RARITY_LABELS[card.rarity],
      pool: rarityPool, render: v => `<span>${v}</span>` },
    { key:'team',     label:'TEAM',     real: card.team,
      pool: teamPool,   render: renderTeam },
    { key:'pos',      label:'POSITION', real: card.pos,
      pool: posPool,    render: v => `<span>${v}</span>` },
    { key:'ovr',      label:'OVERALL',  real: String(ovr),
      pool: ovrPool,    render: v => `<span>${v}</span>` },
    { key:'player',   label:'PLAYER',   real: card.name,
      pool: namePool,   render: v => `<span>${v}</span>` }
  ];

  const overlay = document.createElement('div');
  overlay.className = 'lottery-overlay';
  overlay.innerHTML = `
    <div class="lottery-crate-label">${def.icon} Opening ${def.name}…</div>
    <div class="lottery-locked-row" id="lottery-locked-row"></div>
    <div class="lottery-active-stage" id="lottery-active-stage">
      <div class="lottery-stage-label" id="lottery-stage-label"></div>
      <div class="lottery-reel-val"    id="lottery-reel-val"></div>
    </div>
    <div class="lottery-hint">Tap anywhere to skip</div>
  `;
  document.body.appendChild(overlay);
  overlay.addEventListener('click', () => { skipped = true; });

  const lockedRow  = overlay.querySelector('#lottery-locked-row');
  const stageLabel = overlay.querySelector('#lottery-stage-label');
  const reelVal    = overlay.querySelector('#lottery-reel-val');

  function runCycle(stage) {
    return new Promise(resolve => {
      let tick = 0;
      const totalTicks = 14;
      // Exponential slowdown from ~40 ms → ~320 ms
      const delays = Array.from({length: totalTicks}, (_,i) => Math.round(40 * Math.pow(1.24, i)));

      // Reset & re-trigger label animation
      stageLabel.textContent = stage.label;
      stageLabel.className = '';
      void stageLabel.offsetWidth;
      stageLabel.className = 'lottery-stage-label';

      reelVal.classList.remove('locked');

      const doTick = () => {
        if (skipped) { resolve(); return; }
        const isLast = tick === totalTicks;
        const value  = isLast
          ? stage.real
          : stage.pool[Math.floor(Math.random() * stage.pool.length)];

        reelVal.innerHTML = stage.render(value);

        if (isLast) {
          reelVal.classList.add('locked');
          // Add locked badge to the row above
          const item = document.createElement('div');
          item.className = 'lottery-locked-item';
          item.innerHTML = `
            <div class="lottery-locked-label">${stage.label}</div>
            <div class="lottery-locked-value">${stage.render(stage.real)}</div>`;
          lockedRow.appendChild(item);
          void item.offsetWidth;
          item.classList.add('revealed');
          setTimeout(() => { if (!skipped) resolve(); }, 480);
        } else {
          tick++;
          setTimeout(doTick, delays[tick - 1] || 320);
        }
      };
      doTick();
    });
  }

  (async () => {
    for (const stage of stages) {
      if (skipped) break;
      await runCycle(stage);
      if (!skipped) await new Promise(r => setTimeout(r, 180));
    }
    _showFinalReveal(overlay, def, card, isNew);
  })();
}

function _showFinalReveal(overlay, def, card, isNew) {
  const rarityLabel = RARITY_LABELS[card.rarity] || card.rarity;
  const rarityClass = 'rarity-color-' + card.rarity;
  const dupMsg = isNew ? '' :
    `<div class="crate-reveal-dup">DUPLICATE</div>
     <div class="crate-reveal-shard">+$${SHARD_VALUES[card.rarity].toFixed(2)} added to shards</div>`;

  overlay.innerHTML = `
    <div class="crate-reveal-eyebrow">You pulled a…</div>
    <div class="crate-reveal-card-wrap lottery-card-reveal" id="reveal-card-wrap"></div>
    <div class="crate-reveal-rarity ${rarityClass}">${rarityLabel}</div>
    ${dupMsg}
    <div class="crate-reveal-actions">
      <button class="crate-reveal-btn primary" id="reveal-close-btn">
        ${isNew ? 'Add to Collection' : 'Got it'}
      </button>
      <button class="crate-reveal-btn secondary" id="reveal-view-btn">View Collection</button>
    </div>
  `;
  overlay.className = 'crate-reveal-overlay';

  const wrap = overlay.querySelector('#reveal-card-wrap');
  wrap.appendChild(_buildCardElement(card, 0, false));

  overlay.querySelector('#reveal-close-btn').addEventListener('click', () => {
    overlay.remove();
    if (document.getElementById('panel-cards')?.classList.contains('active')) renderCards();
  });
  overlay.querySelector('#reveal-view-btn').addEventListener('click', () => {
    overlay.remove();
    _cardsActiveTab = 'collection';
    renderCards();
  });
}

/* ══════════════════════════════════════════════════════
   CARD DOM BUILDER
   ══════════════════════════════════════════════════════ */
function _buildCardElement(card, dupCount, isLegacy, opts) {
  opts = opts || {};
  const wrap = document.createElement('div');
  wrap.className = 'card-wrap' + (opts.autoFlip ? ' auto-flip' : '');
  wrap.dataset.cardId = card.id;

  const inner = document.createElement('div');
  inner.className = 'card-inner';

  // ── Front ──────────────────────────────────────────────
  const front = document.createElement('div');
  front.className = `card-face card-front card-rarity-${card.rarity}`;

  // Team logo (CDN SVG) or emoji fallback
  const logoMap  = typeof TEAM_LOGO  !== 'undefined' ? TEAM_LOGO  : null;
  const emojiMap = typeof TEAM_EMOJI !== 'undefined' ? TEAM_EMOJI : {};
  const logoUrl  = logoMap ? logoMap[card.team] : null;
  const teamLogoHtml = logoUrl
    ? `<div class="card-team-logo-wrap">
         <img src="${logoUrl}" alt="${card.team}" class="card-team-logo-img"
              onerror="this.style.display='none'">
       </div>`
    : `<div class="card-team-logo-wrap"><span class="card-team-emoji">${emojiMap[card.team] || '🏀'}</span></div>`;

  // Player headshot with gradient fallback on error
  const hsUrl = card.pid
    ? `https://cdn.nba.com/headshots/nba/latest/1040x760/${card.pid}.png`
    : null;
  const hsHtml = hsUrl
    ? `<div class="card-hs-wrap">
         <img src="${hsUrl}" alt="${card.name}" class="card-hs"
              onerror="this.closest('.card-hs-wrap').classList.add('hs-err')">
         <div class="card-bottom-gradient"></div>
       </div>`
    : `<div class="card-hs-wrap hs-err"><div class="card-bottom-gradient"></div></div>`;

  front.innerHTML = `
    <div class="card-rarity-banner">${RARITY_LABELS[card.rarity]}</div>
    <div class="card-number">#${card.no}</div>
    ${teamLogoHtml}
    ${hsHtml}
    <div class="card-player-area">
      <div class="card-name">${card.name}</div>
      <div class="card-pos-team">${card.pos} · ${card.team}</div>
    </div>
    ${isLegacy ? '<div class="card-legacy-stamp">Legacy ' + CARDS_SEASON + '</div>' : ''}
    ${dupCount > 1 ? '<div class="card-dup-badge">×' + dupCount + '</div>' : ''}
  `;

  // Game-Breaker overlays
  if (card.rarity === 'gamebreaker') {
    const scanlines = document.createElement('div');
    scanlines.className = 'card-scanlines';
    front.appendChild(scanlines);
    const rgb = document.createElement('div');
    rgb.className = 'card-rgb-split';
    front.appendChild(rgb);
  }

  // ── Back ───────────────────────────────────────────────
  const back = document.createElement('div');
  back.className = `card-face card-back card-rarity-back-${card.rarity}`;

  const ovr = Math.round((card.off + card.def + card.clutch + card.cons + card.ath) / 5);

  const cbStatRow = (label, val) => {
    const pct = Math.max(2, Math.min(100, val));
    return `<div class="cb-stat">
      <div class="cb-sl">${label}</div>
      <div class="cb-sb-wrap"><div class="cb-sb" style="width:${pct}%"></div></div>
      <div class="cb-sv">${val}</div>
    </div>`;
  };

  const backLogoHtml = logoUrl
    ? `<img src="${logoUrl}" alt="${card.team}" class="cb-team-logo" onerror="this.style.display='none'">`
    : '';

  back.innerHTML = `
    <div class="cb-top">
      <div class="cb-name">${card.name}</div>
      <div class="cb-top-right">
        ${backLogoHtml}
        <div class="cb-ovr-badge">
          <div class="cb-ovr-num">${ovr}</div>
          <div class="cb-ovr-lbl">OVR</div>
        </div>
      </div>
    </div>
    <div class="cb-divider"></div>
    <div class="cb-stats">
      ${cbStatRow('OFF', card.off)}
      ${cbStatRow('DEF', card.def)}
      ${cbStatRow('CLT', card.clutch)}
      ${cbStatRow('CON', card.cons)}
      ${cbStatRow('ATH', card.ath)}
    </div>
    <div class="cb-desc">${card.desc || ''}</div>
  `;

  inner.appendChild(front);
  inner.appendChild(back);
  wrap.appendChild(inner);

  // Flip on click
  wrap.addEventListener('click', () => wrap.classList.toggle('flipped'));

  // Elite holo mouse tracking
  if (card.rarity === 'elite') {
    wrap.addEventListener('mousemove', (e) => {
      const r = front.getBoundingClientRect();
      const mx = ((e.clientX - r.left) / r.width) * 100;
      const my = ((e.clientY - r.top)  / r.height) * 100;
      front.style.setProperty('--mx', mx.toFixed(1));
      front.style.setProperty('--my', my.toFixed(1));
    });
    wrap.addEventListener('mouseleave', () => {
      front.style.removeProperty('--mx');
      front.style.removeProperty('--my');
    });
  }

  // Superstar / Game-Breaker particle canvas
  if (card.rarity === 'superstar' || card.rarity === 'gamebreaker') {
    _attachParticleCanvas(front, card.rarity);
  }

  return wrap;
}

/* ── Particle system ─────────────────────────────────── */
function _attachParticleCanvas(frontEl, rarity) {
  const canvas = document.createElement('canvas');
  canvas.className = 'card-particles';
  canvas.width = 180; canvas.height = 260;
  frontEl.appendChild(canvas);
  const ctx = canvas.getContext('2d');
  const color = rarity === 'gamebreaker' ? '#ff4020' : '#c0c8ff';
  const particles = Array.from({length: rarity === 'gamebreaker' ? 18 : 12}, () => ({
    x: Math.random() * 180,
    y: Math.random() * 260,
    r: Math.random() * 1.5 + 0.5,
    vx: (Math.random() - 0.5) * 0.4,
    vy: -Math.random() * 0.5 - 0.2,
    a: Math.random()
  }));
  let animId;
  const animate = () => {
    ctx.clearRect(0,0,180,260);
    for (const p of particles) {
      p.x += p.vx; p.y += p.vy; p.a += 0.012;
      if (p.y < -5) { p.y = 265; p.x = Math.random() * 180; p.a = 0; }
      const alpha = Math.sin(p.a) * 0.7 + 0.1;
      ctx.globalAlpha = Math.max(0, alpha);
      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r, 0, Math.PI*2);
      ctx.fill();
    }
    animId = requestAnimationFrame(animate);
  };
  animate();
  // Clean up when removed from DOM
  const obs = new MutationObserver(() => {
    if (!document.contains(canvas)) {
      cancelAnimationFrame(animId);
      obs.disconnect();
    }
  });
  obs.observe(document.body, {childList: true, subtree: true});
}

/* ══════════════════════════════════════════════════════
   MAIN RENDER
   ══════════════════════════════════════════════════════ */
async function renderCards() {
  const container = document.getElementById('cards-container');
  if (!container) return;

  if (!_cardsLoaded) {
    container.innerHTML = '<div class="cards-loading">Loading collection…</div>';
    await _cardsLoad();
    await _cardsProcessSettledBets();
  }

  await _cardsLoadBankroll();
  const bankroll = _cardsBankroll !== null ? `$${_cardsBankroll.toFixed(2)}` : '—';

  container.innerHTML = `
    <div class="cards-top-bar">
      <div class="cards-page-title">Clanker's <span>Card Ranker</span></div>
      <div class="cards-wallet-row">
        <div class="cards-wallet-pill">
          <span>Shards</span>
          <span class="wval">$${_cardsShards.toFixed(2)}</span>
        </div>
        <div class="cards-wallet-pill">
          <span>Bankroll</span>
          <span class="wval">${bankroll}</span>
        </div>
      </div>
    </div>

    <div class="cards-subnav">
      <button class="cards-subnav-btn ${_cardsActiveTab==='shop'?'active':''}"
        onclick="_cardsShowTab('shop',this)">🏪 Shop</button>
      <button class="cards-subnav-btn ${_cardsActiveTab==='collection'?'active':''}"
        onclick="_cardsShowTab('collection',this)">📂 Collection</button>
      <button class="cards-subnav-btn ${_cardsActiveTab==='showcase'?'active':''}"
        onclick="_cardsShowTab('showcase',this)">⭐ Showcase</button>
    </div>

    <div id="cards-subpanel-shop"        class="cards-subpanel ${_cardsActiveTab==='shop'?'active':''}"></div>
    <div id="cards-subpanel-collection"  class="cards-subpanel ${_cardsActiveTab==='collection'?'active':''}"></div>
    <div id="cards-subpanel-showcase"    class="cards-subpanel ${_cardsActiveTab==='showcase'?'active':''}"></div>
  `;

  if (_cardsActiveTab === 'shop')       _renderCardsShop();
  if (_cardsActiveTab === 'collection') _renderCardsCollection();
  if (_cardsActiveTab === 'showcase')   _renderCardsShowcase();
}

function _cardsShowTab(tab, btn) {
  _cardsActiveTab = tab;
  document.querySelectorAll('.cards-subnav-btn').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  document.querySelectorAll('.cards-subpanel').forEach(p => p.classList.remove('active'));
  const panel = document.getElementById('cards-subpanel-' + tab);
  if (panel) {
    panel.classList.add('active');
    if (tab === 'shop')       _renderCardsShop();
    if (tab === 'collection') _renderCardsCollection();
    if (tab === 'showcase')   _renderCardsShowcase();
  }
}

/* ══════════════════════════════════════════════════════
   SHOP TAB
   ══════════════════════════════════════════════════════ */
function _renderCardsShop() {
  const panel = document.getElementById('cards-subpanel-shop');
  if (!panel) return;

  const dailyClaimed = _dailyIsClaimed();
  const hasProfile = _cardsBankroll !== null;

  // Inventory section
  const invKeys = Object.keys(_cardsInventory).filter(k => (_cardsInventory[k]||0) > 0);
  const invHtml = invKeys.length
    ? invKeys.map(k => {
        const def = CRATE_DEFS.find(c => c.id === k);
        if (!def) return '';
        return `<div class="inventory-crate-pill" onclick="_cardsOpenCrate('${k}')">
          <span class="ic-icon">${def.icon}</span>
          <span class="ic-name">${def.name}</span>
          <span class="ic-count">${_cardsInventory[k]}</span>
        </div>`;
      }).join('')
    : '<div class="inventory-empty">No crates in inventory. Buy or earn some!</div>';

  // Shop crate cards
  const crateCards = CRATE_DEFS.map(def => {
    const isLegendary = def.id === 'legendary';
    const showNewUser = isLegendary && !_cardsNewUserUsed;
    const discountPrice = (def.price * 0.5).toFixed(2);
    const bankroll = _cardsBankroll !== null ? _cardsBankroll : 0;
    const canAfford = hasProfile && bankroll >= def.price;
    const canAffordDiscount = hasProfile && bankroll >= def.price * 0.5;
    const oddsText = def.odds.map(([r,p]) =>
      `${RARITY_LABELS[r]}: ${(p*100).toFixed(0)}%`).join(' · ');

    return `<div class="shop-crate-card">
      ${showNewUser ? '<div class="shop-new-user-badge">NEW USER OFFER</div>' : ''}
      <div class="shop-crate-icon">${def.icon}</div>
      <div class="shop-crate-name">${def.name}</div>
      <div class="shop-crate-price">$${def.price.toFixed(2)}</div>
      <div class="shop-crate-odds">${oddsText}</div>
      <button class="shop-crate-btn" ${canAfford?'':'disabled'}
        onclick="_cardsBuyCrate('${def.id}', false)">Buy & Open</button>
      ${showNewUser ? `<button class="shop-crate-btn" style="background:var(--green);margin-top:4px" ${canAffordDiscount?'':'disabled'}
        onclick="_cardsBuyCrate('${def.id}', true)">50% Off Deal — $${discountPrice}</button>` : ''}
    </div>`;
  }).join('');

  panel.innerHTML = `
    <div class="daily-crate-bar">
      <span class="dcb-icon">🎁</span>
      <span class="dcb-text ${dailyClaimed?'claimed':''}">
        ${dailyClaimed
          ? 'Daily crate claimed ✓'
          : '⚡ Daily crate ready — place a bet of $1+ to claim'}
      </span>
    </div>

    <div class="shop-section-label">Crate Shop</div>
    <div class="shop-sub">Spend your bankroll on crates. Higher tiers = rarer cards.</div>
    <div class="shop-crates-grid">${crateCards}</div>

    <div class="inventory-label">Your Crate Inventory</div>
    <div class="inventory-grid">${invHtml}</div>
  `;
}

/* ══════════════════════════════════════════════════════
   COLLECTION TAB
   ══════════════════════════════════════════════════════ */
function _renderCardsCollection(filters) {
  const panel = document.getElementById('cards-subpanel-collection');
  if (!panel) return;
  filters = filters || { rarity: '', team: '', pos: '', legacy: '' };

  const teams = [...new Set(CARD_POOL.map(c => c.team))].sort();
  const positions = [...new Set(CARD_POOL.map(c => c.pos))].sort();

  const owned = CARD_POOL.filter(card => _cardsOwns(card.id));
  const legacyOwned = owned.filter(c => _cardsCollection[c.id]?.season !== CARDS_SEASON);
  const currentOwned = owned.filter(c => _cardsCollection[c.id]?.season === CARDS_SEASON);

  let filtered = owned.filter(card => {
    if (filters.rarity && card.rarity !== filters.rarity) return false;
    if (filters.team && card.team !== filters.team) return false;
    if (filters.pos && card.pos !== filters.pos) return false;
    if (filters.legacy === 'yes' && _cardsCollection[card.id]?.season === CARDS_SEASON) return false;
    if (filters.legacy === 'no'  && _cardsCollection[card.id]?.season !== CARDS_SEASON) return false;
    return true;
  });

  // Sort by rarity desc then name
  const rarityOrder = ['gamebreaker','superstar','elite','clutch','impact','pro'];
  filtered.sort((a,b) => rarityOrder.indexOf(a.rarity) - rarityOrder.indexOf(b.rarity) || a.name.localeCompare(b.name));

  const rarityOpts = ['','pro','impact','clutch','elite','superstar','gamebreaker']
    .map(r => `<option value="${r}" ${filters.rarity===r?'selected':''}>${r ? RARITY_LABELS[r] : 'All Rarities'}</option>`).join('');
  const teamOpts = ['', ...teams]
    .map(t => `<option value="${t}" ${filters.team===t?'selected':''}>${t || 'All Teams'}</option>`).join('');
  const posOpts = ['', ...positions]
    .map(p => `<option value="${p}" ${filters.pos===p?'selected':''}>${p || 'All Positions'}</option>`).join('');
  const legacyOpts = [['','All'],['yes','Legacy Only'],['no','Current Only']]
    .map(([v,l]) => `<option value="${v}" ${filters.legacy===v?'selected':''}>${l}</option>`).join('');

  // Cards are mounted via DOM manipulation below after innerHTML is set.

  const legacySection = legacyOwned.length ? `
    <div class="coll-section-label"><span class="gold">⭐ Legacy</span> — ${CARDS_SEASON}</div>
    <div class="coll-grid" id="coll-legacy-grid"></div>
  ` : '';

  panel.innerHTML = `
    <div class="coll-filters">
      <select class="coll-filter-select" onchange="_cardsApplyFilter('rarity',this.value)">${rarityOpts}</select>
      <select class="coll-filter-select" onchange="_cardsApplyFilter('team',this.value)">${teamOpts}</select>
      <select class="coll-filter-select" onchange="_cardsApplyFilter('pos',this.value)">${posOpts}</select>
      <select class="coll-filter-select" onchange="_cardsApplyFilter('legacy',this.value)">${legacyOpts}</select>
      <button class="coll-filter-clear" onclick="_cardsApplyFilter('clear','')">Clear</button>
      <div class="coll-summary">${owned.length} / ${CARD_POOL.length} cards · ${Object.values(_cardsCollection).reduce((s,c)=>s+c.count,0)} total</div>
    </div>

    ${owned.length === 0
      ? '<div class="coll-empty">Your collection is empty. Open some crates in the Shop tab!</div>'
      : `<div class="coll-section-label">Collection <span style="color:var(--muted);font-size:0.9rem">(${filtered.length} shown)</span></div>
         <div class="coll-grid" id="coll-main-grid"></div>
         ${legacySection}`
    }
  `;

  // Mount cards into grids
  const mainGrid = panel.querySelector('#coll-main-grid');
  if (mainGrid) {
    filtered.forEach(card => {
      const cnt = _cardsCount(card.id);
      const isLeg = _cardsCollection[card.id]?.season !== CARDS_SEASON;
      const wrap = document.createElement('div');
      wrap.style.position = 'relative';
      const cardEl = _buildCardElement(card, cnt, isLeg, {autoFlip: true});
      wrap.appendChild(cardEl);
      // Pin button
      const pinBtn = document.createElement('button');
      pinBtn.className = 'showcase-remove-btn';
      pinBtn.style.cssText = 'position:absolute;top:5px;right:5px;background:rgba(255,170,0,0.85);';
      const pinned = _cardsShowcase.includes(card.id);
      pinBtn.textContent = pinned ? '★' : '☆';
      pinBtn.title = pinned ? 'Remove from showcase' : 'Add to showcase';
      pinBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        _cardsToggleShowcase(card.id);
        _renderCardsCollection(_cardsCurrentFilter);
      });
      wrap.appendChild(pinBtn);
      mainGrid.appendChild(wrap);
    });
  }

  const legGrid = panel.querySelector('#coll-legacy-grid');
  if (legGrid) {
    legacyOwned.forEach(card => {
      const cnt = _cardsCount(card.id);
      const cardEl = _buildCardElement(card, cnt, true, {autoFlip: true});
      legGrid.appendChild(cardEl);
    });
  }
}

let _cardsCurrentFilter = { rarity:'', team:'', pos:'', legacy:'' };
function _cardsApplyFilter(key, val) {
  if (key === 'clear') {
    _cardsCurrentFilter = { rarity:'', team:'', pos:'', legacy:'' };
  } else {
    _cardsCurrentFilter[key] = val;
  }
  _renderCardsCollection(_cardsCurrentFilter);
}

/* ══════════════════════════════════════════════════════
   SHOWCASE TAB
   ══════════════════════════════════════════════════════ */
function _cardsToggleShowcase(cardId) {
  const idx = _cardsShowcase.indexOf(cardId);
  if (idx >= 0) {
    _cardsShowcase.splice(idx, 1);
  } else {
    if (_cardsShowcase.length >= 5) {
      alert('Showcase is full (5 cards max). Remove a card first.');
      return;
    }
    if (!_cardsOwns(cardId)) { alert('You don\'t own this card.'); return; }
    _cardsShowcase.push(cardId);
  }
  _cardsSave();
}

function _renderCardsShowcase() {
  const panel = document.getElementById('cards-subpanel-showcase');
  if (!panel) return;

  panel.innerHTML = `
    <div class="showcase-section">
      <div class="showcase-label">Your Showcase</div>
      <div class="showcase-sub">Pin up to 5 cards. Visible on the Sportsbook leaderboard.</div>
      <div class="showcase-slots" id="showcase-slots-row"></div>
    </div>

    <div class="coll-section-label">Choose from your collection</div>
    <div class="coll-grid" id="showcase-pick-grid"></div>
  `;

  const slotsRow = panel.querySelector('#showcase-slots-row');
  for (let i = 0; i < 5; i++) {
    const slot = document.createElement('div');
    const cardId = _cardsShowcase[i] || null;
    if (cardId) {
      const card = CARD_POOL.find(c => c.id === cardId);
      slot.className = 'showcase-slot filled';
      if (card) slot.appendChild(_buildCardElement(card, _cardsCount(cardId), false));
      const rmBtn = document.createElement('button');
      rmBtn.className = 'showcase-remove-btn';
      rmBtn.textContent = '✕';
      rmBtn.addEventListener('click', () => {
        _cardsToggleShowcase(cardId);
        _renderCardsShowcase();
      });
      slot.appendChild(rmBtn);
    } else {
      slot.className = 'showcase-slot';
      slot.innerHTML = `<div class="showcase-slot-placeholder"><span>＋</span>Empty Slot</div>`;
    }
    slotsRow.appendChild(slot);
  }

  // Pick grid — owned cards sorted by rarity desc
  const pickGrid = panel.querySelector('#showcase-pick-grid');
  const owned = CARD_POOL.filter(c => _cardsOwns(c.id));
  const rarityOrder = ['gamebreaker','superstar','elite','clutch','impact','pro'];
  owned.sort((a,b) => rarityOrder.indexOf(a.rarity) - rarityOrder.indexOf(b.rarity));

  if (!owned.length) {
    pickGrid.innerHTML = '<div class="coll-empty">Open crates to build your collection.</div>';
    return;
  }

  owned.forEach(card => {
    const wrap = document.createElement('div');
    wrap.style.position = 'relative';
    const cardEl = _buildCardElement(card, _cardsCount(card.id), false, {autoFlip:true});
    wrap.appendChild(cardEl);
    const pinBtn = document.createElement('button');
    pinBtn.className = 'showcase-remove-btn';
    pinBtn.style.cssText = 'position:absolute;top:5px;right:5px;background:rgba(255,170,0,0.85);';
    const pinned = _cardsShowcase.includes(card.id);
    pinBtn.textContent = pinned ? '★' : '☆';
    pinBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      _cardsToggleShowcase(card.id);
      _renderCardsShowcase();
    });
    wrap.appendChild(pinBtn);
    pickGrid.appendChild(wrap);
  });
}

/* ══════════════════════════════════════════════════════
   LEADERBOARD INJECTION
   Monkey-patches the sportsbook leaderboard rows
   to add card showcase miniatures and GB trophy count
   ══════════════════════════════════════════════════════ */
async function _injectCardDataIntoLeaderboard() {
  const rows = document.querySelectorAll('.sb-lb-row');
  if (!rows.length) return;

  for (const row of rows) {
    if (row.querySelector('.lb-cards-row')) continue; // already injected

    // Find nickname from row — skip header/spacer rows that have no name element
    const nameEl = row.querySelector('.sb-lb-name');
    if (!nameEl) continue;
    const nick = nameEl.textContent.trim();
    if (!nick) continue;

    // Detect self-row: the row itself carries class "you", OR the name element does,
    // OR it matches the loaded sportsbook profile nickname directly
    const sbNick = (typeof _sbProfile !== 'undefined' && _sbProfile)
      ? _sbProfile.nickname : null;
    const isSelf = row.classList.contains('you') ||
                   nameEl.classList.contains('you') ||
                   (sbNick && nick === sbNick);

    let gbCount = 0;
    let showcase = [];

    if (isSelf) {
      // Use in-memory collection data — no async fetch needed
      gbCount = Object.keys(_cardsCollection).filter(id => {
        const card = CARD_POOL.find(c => c.id === id);
        return card && card.rarity === 'gamebreaker';
      }).length;
      showcase = _cardsShowcase.map(id => CARD_POOL.find(c => c.id === id)).filter(Boolean);
    } else {
      const entry = await _cardsFetchLbEntry(nick).catch(() => null);
      if (entry) {
        gbCount = entry.gbCount || 0;
        showcase = (entry.showcase || []).map(s => CARD_POOL.find(c => c.id === s.id)).filter(Boolean);
      }
    }

    if (!gbCount && !showcase.length) {
      // Add view button only
      const viewBtn = `<button class="lb-view-coll-btn" onclick="_cardsShowUserCollection('${_escHtml(nick)}')">Cards</button>`;
      const cardsRow = document.createElement('div');
      cardsRow.className = 'lb-cards-row';
      cardsRow.innerHTML = viewBtn;
      row.appendChild(cardsRow);
      continue;
    }

    const gbHtml = gbCount
      ? `<span class="lb-gb-trophy">🔴 ${gbCount} GB</span>` : '';

    const showcaseMinis = showcase.slice(0,5).map(card => {
      const bg = _cardRarityMiniGradient(card.rarity);
      return `<div class="showcase-mini-pip" style="background:${bg}" title="${card.name}"></div>`;
    }).join('');

    const cardsRow = document.createElement('div');
    cardsRow.className = 'lb-cards-row';
    cardsRow.innerHTML = `
      ${gbHtml}
      ${showcaseMinis ? `<div class="lb-showcase-mini">${showcaseMinis}</div>` : ''}
      <button class="lb-view-coll-btn" onclick="_cardsShowUserCollection('${_escHtml(nick)}')">View Cards</button>
    `;
    row.appendChild(cardsRow);
  }
}

function _cardRarityMiniGradient(rarity) {
  const map = {
    pro: 'linear-gradient(135deg,#2c2620,#5c4c3a)',
    impact: 'linear-gradient(135deg,#192218,#2a5530)',
    clutch: 'linear-gradient(135deg,#1c1c2c,#4050aa)',
    elite: 'linear-gradient(135deg,#200a30,#7030b0)',
    superstar: 'linear-gradient(135deg,#1e1e2c,#b0b8d8)',
    gamebreaker: 'linear-gradient(135deg,#220000,#ff2020)'
  };
  return map[rarity] || '#111';
}

function _escHtml(str) {
  return String(str).replace(/['"<>&]/g, c => ({'\'':'&#39;','"':'&quot;','<':'&lt;','>':'&gt;','&':'&amp;'}[c]));
}

/* ── View another user's collection (read-only modal) ── */
async function _cardsShowUserCollection(nick) {
  const overlay = document.createElement('div');
  overlay.className = 'coll-view-overlay';
  overlay.innerHTML = `
    <div class="coll-view-modal">
      <button class="coll-view-close" onclick="this.closest('.coll-view-overlay').remove()">✕</button>
      <div class="coll-view-title">${_escHtml(nick)}'s Collection</div>
      <div class="coll-view-sub">Read-only view</div>
      <div style="font-family:'Barlow Condensed',sans-serif;color:var(--muted);letter-spacing:1px;padding:20px 0">
        Collection data is stored locally per device — full cross-user collection viewing is not available yet.
        Showcase and trophy counts are shared on the leaderboard.
      </div>
    </div>
  `;
  document.body.appendChild(overlay);
  overlay.addEventListener('click', e => { if (e.target === overlay) overlay.remove(); });
}

/* ══════════════════════════════════════════════════════
   MONKEY-PATCH showTab & renderSportsbook
   ══════════════════════════════════════════════════════ */
(function() {
  // Patch showTab to trigger renderCards
  const _origShowTab = window.showTab;
  window.showTab = function(id, btn) {
    if (_origShowTab) _origShowTab.call(this, id, btn);
    if (id === 'cards') renderCards();
  };

  // Patch renderSportsbook to inject card data into leaderboard after render
  const _origRenderSportsbook = window.renderSportsbook;
  if (_origRenderSportsbook) {
    window.renderSportsbook = async function() {
      const r = await _origRenderSportsbook.apply(this, arguments);
      setTimeout(() => _injectCardDataIntoLeaderboard(), 300);
      return r;
    };
  }

  // Patch _sbPlaceBet to award daily crate when a bet is actually placed.
  // We confirm a bet was placed by checking that _sbSlip was non-empty before
  // the call and is empty after (the original clears the slip on success only).
  const _origSbPlaceBet = window._sbPlaceBet;
  if (_origSbPlaceBet) {
    window._sbPlaceBet = async function() {
      const stake  = typeof _sbStake !== 'undefined' ? _sbStake : 0;
      const hadBet = typeof _sbSlip  !== 'undefined' && _sbSlip.length > 0;
      const result = await _origSbPlaceBet.apply(this, arguments);
      // Slip is cleared to [] on success; if it's still non-empty the bet was rejected
      const placed = hadBet && typeof _sbSlip !== 'undefined' && _sbSlip.length === 0;
      if (placed && stake >= 1) cardsOnBetPlaced(stake).catch(() => {});
      return result;
    };
  }
})();

/* ══════════════════════════════════════════════════════
   INIT on DOMContentLoaded
   ══════════════════════════════════════════════════════ */
document.addEventListener('DOMContentLoaded', async () => {
  await _cardsLoad();
  await _cardsProcessSettledBets();
  // Inject into leaderboard if sportsbook is already rendered
  setTimeout(() => _injectCardDataIntoLeaderboard(), 800);
});
