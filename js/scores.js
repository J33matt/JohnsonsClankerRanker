const _oddsCache = {};

// Fetch moneylines from ESPN scoreboard for a given date
// ESPN scoreboard includes comp.odds[0].homeTeamOdds.moneyLine on upcoming games
async function fetchOddsForDate(dateStr) {
async function fetchOddsForDate(dateStr) {
  const cacheKey = 'odds:' + dateStr;
  if (_oddsCache[cacheKey]) return _oddsCache[cacheKey];
  try {
    // Step 1: fetch scoreboard to get event IDs + team abbrs + any inline odds
    const yyyymmdd = dateStr.replace(/-/g, '');
    const url = `https://site.api.espn.com/apis/site/v2/sports/basketball/nba/scoreboard?dates=${yyyymmdd}&limit=50`;
    const res = await fetch(url);
    if (!res.ok) return {};
    const json = await res.json();
    const result = {};

    const eventMeta = []; // { eventId, key, homeAbbr, awayAbbr, inlineHomeML, inlineAwayML }
    (json.events || []).forEach(evt => {
      const comp = evt.competitions?.[0];
      if (!comp) return;
      const homeComp = comp.competitors?.find(c => c.homeAway === 'home');
      const awayComp = comp.competitors?.find(c => c.homeAway === 'away');
      if (!homeComp || !awayComp) return;
      const homeAbbr = normAbbr(homeComp.team?.abbreviation || '');
      const awayAbbr = normAbbr(awayComp.team?.abbreviation || '');
      const key = awayAbbr + '@' + homeAbbr;
      const oddsData = comp.odds?.[0];
      const inlineHomeML = oddsData?.homeTeamOdds?.moneyLine || oddsData?.homeTeamOdds?.current?.moneyLine || null;
      const inlineAwayML = oddsData?.awayTeamOdds?.moneyLine || oddsData?.awayTeamOdds?.current?.moneyLine || null;
      // Seed with inline odds immediately (may be null)
      if (inlineHomeML || inlineAwayML) {
        result[key] = { homeML: inlineHomeML, awayML: inlineAwayML, homeAbbr, awayAbbr };
      }
      if (evt.id) {
        eventMeta.push({ eventId: evt.id, key, homeAbbr, awayAbbr, inlineHomeML, inlineAwayML });
      }
    });

    // Step 2: for each event missing moneylines, hit the ESPN core odds API
    const needsOdds = eventMeta.filter(m => !result[m.key]);
    // Also fetch all events to get spread + O/U data even if ML was inline
    await Promise.all(eventMeta.map(async (m) => {
      try {
        const oddsUrl = `https://sports.core.api.espn.com/v2/sports/basketball/leagues/nba/events/${m.eventId}/competitions/${m.eventId}/odds?limit=50`;
        const oddsRes = await fetch(oddsUrl);
        if (!oddsRes.ok) return;
        const oddsJson = await oddsRes.json();
        const books = oddsJson.items || [];
        const preferred = books.find(b => /espn.?bet/i.test(b.provider?.name || ''))
          || books.find(b => /caesars/i.test(b.provider?.name || ''))
          || books.find(b => /draftkings/i.test(b.provider?.name || ''))
          || books[0];
        if (!preferred) return;
        const homeML = preferred.homeTeamOdds?.moneyLine
          || preferred.homeTeamOdds?.current?.moneyLine
          || null;
        const awayML = preferred.awayTeamOdds?.moneyLine
          || preferred.awayTeamOdds?.current?.moneyLine
          || null;
        // Spread: ESPN spread.value is the home team's spread (negative = home favored)
        // e.g. home -7 → spread.value = -7, so away gets +7
        const spreadRaw = preferred.spread?.value ?? preferred.spread ?? null;
        const spreadLine = spreadRaw != null ? parseFloat(spreadRaw) : null;
        // Spread juice — spreadOdds is a direct number on the root odds object
        const awaySpreadML = preferred.awayTeamOdds?.spreadOdds
          || parseInt(preferred.awayTeamOdds?.current?.spread?.american)
          || -110;
        const homeSpreadML = preferred.homeTeamOdds?.spreadOdds
          || parseInt(preferred.homeTeamOdds?.current?.spread?.american)
          || -110;
        // Over/Under total
        const overUnder = preferred.overUnder?.value ?? preferred.overUnder ?? null;
        const total = overUnder != null ? parseFloat(overUnder) : null;
        const overML  = preferred.overOdds?.moneyLine  || preferred.over?.moneyLine  || -110;
        const underML = preferred.underOdds?.moneyLine || preferred.under?.moneyLine || -110;

        result[m.key] = {
          homeML: homeML || result[m.key]?.homeML || null,
          awayML: awayML || result[m.key]?.awayML || null,
          homeAbbr: m.homeAbbr, awayAbbr: m.awayAbbr,
          spreadLine, awaySpreadML, homeSpreadML,
          total, overML, underML
        };
      } catch(e) {}
    }));

    _oddsCache[cacheKey] = result;
    return result;
  } catch(e) {
    return {};
  }
}

// American odds → payout on $10 stake (returns net profit, not total return)
// e.g. -110 → $9.09 profit;  +150 → $15.00 profit;  +100 → $10.00 profit
function _mlPayout(moneyLine, stake) {
  stake = stake || 10;
  if (!moneyLine || moneyLine === 0) return stake; // no line → treat as even money
  if (moneyLine > 0) {
    return Math.round((stake * moneyLine / 100) * 100) / 100;
  } else {
    return Math.round((stake / (Math.abs(moneyLine) / 100)) * 100) / 100;
  }
}

// Format moneyline for display: +150 or -110
function _fmtML(ml) {
  if (!ml) return 'EVEN';
  return (ml > 0 ? '+' : '') + ml;
}

// Format dollar amount with sign: +$9.09 or -$10.00
function _fmtDollars(amt) {
  const sign = amt >= 0 ? '+' : '-';
  return sign + '$' + Math.abs(amt).toFixed(2);
}

// Attach moneylines to stored picks from the odds cache for a date
// Mutates picks in place, returns true if anything was added
function _attachMoneylines(picks, oddsMap) {
  let changed = false;
  picks.forEach(pick => {
    const key = pick.awayAbbr + '@' + pick.homeAbbr;
    const odds = oddsMap[key];
    if (!odds) return;
    if (pick.homeML !== odds.homeML || pick.awayML !== odds.awayML) {
      pick.homeML = odds.homeML;
      pick.awayML = odds.awayML;
      changed = true;
    }
  });
  return changed;
}

// Compute net P&L for a single graded pick ($10 stake)
// Returns { payout, net } where net is profit (positive) or loss (negative)
function _pickBetResult(pick) {
  const STAKE = 10;
  if (!pick.result) return null;
  if (pick.result !== 'correct') return { payout: 0, net: -STAKE }; // lost $10
  // Won — determine which ML to use
  const pickIsHome = pick.pick === pick.homeAbbr;
  const ml = pickIsHome ? pick.homeML : pick.awayML;
  if (!ml) {
    // No odds — treat as -110 (standard)
    const payout = _mlPayout(-110, STAKE);
    return { payout, net: payout };
  }
  const payout = _mlPayout(ml, STAKE);
  return { payout, net: payout };
}

// Grade bets for a date: reads stored picks, computes P&L, saves to ledger
async function _gradeBetsForDate(dateStr) {
  try {
    const stored = await _storageGet(_predKey(dateStr));
    if (!stored) return;
    const data = JSON.parse(stored.value);
    const picks = data.picks || [];

    // Fetch odds if not already on picks
    const oddsMap = await fetchOddsForDate(dateStr);
    const mlChanged = _attachMoneylines(picks, oddsMap);

    // Compute total daily net for all graded picks
    let dayNet = 0, dayBets = 0;
    const betDetails = [];
    picks.forEach(pick => {
      const br = _pickBetResult(pick);
      if (!br) return;
      dayNet += br.net;
      dayBets++;
      betDetails.push({ game: pick.game, pick: pick.pick, net: br.net, result: pick.result, payout: br.payout, ml: pick.pick === pick.homeAbbr ? pick.homeML : pick.awayML });
    });

    // Attach per-pick bet info back to picks (so card can show payout)
    picks.forEach(pick => {
      const br = _pickBetResult(pick);
      if (br) pick.betNet = br.net;
    });

    if (mlChanged || dayBets > 0) {
      await _storageSet(_predKey(dateStr), JSON.stringify(data));
    }

    // Save daily ledger entry
    if (dayBets > 0) {
      const ledgerKey = _BET_KEY_PREFIX + dateStr;
      await _storageSet(ledgerKey, JSON.stringify({
        date: dateStr,
        net: Math.round(dayNet * 100) / 100,
        bets: dayBets,
        details: betDetails,
      }));
      await _updateAlltimeLedger();
    }
  } catch(e) {}
}

// Rebuild the all-time ledger total from daily entries
async function _updateAlltimeLedger() {
  try {
    const promises = [];
    for (let i = 0; i <= 90; i++) {
      const d = new Date(); d.setDate(d.getDate() - i);
      promises.push(_storageGet(_BET_KEY_PREFIX + localDateStr(d)));
    }
    const results = await Promise.all(promises);
    let total = 0, totalBets = 0;
    results.forEach(r => {
      if (!r) return;
      try {
        const d = JSON.parse(r.value);
        total += d.net || 0;
        totalBets += d.bets || 0;
      } catch(e) {}
    });
    total = Math.round(total * 100) / 100;
    await _storageSet(_BET_ALLTIME_KEY, JSON.stringify({ total, totalBets, updatedAt: new Date().toISOString() }));
    return { total, totalBets };
  } catch(e) { return { total: 0, totalBets: 0 }; }
}

// Read all-time ledger
async function _getAlltimeLedger() {
  try {
    const r = await _storageGet(_BET_ALLTIME_KEY);
    if (!r) return { total: 0, totalBets: 0 };
    return JSON.parse(r.value);
  } catch(e) { return { total: 0, totalBets: 0 }; }
}

// Read daily ledger for a date
async function _getDayLedger(dateStr) {
  try {
    const r = await _storageGet(_BET_KEY_PREFIX + dateStr);
    if (!r) return null;
    return JSON.parse(r.value);
  } catch(e) { return null; }
}

// ── P&L CHART ─────────────────────────────────────────────────
let _pnlChart = null;

async function renderPnlChart() {
async function renderPnlChart() {
  const area = document.getElementById('pred-pnl-chart-area');
  if (!area) return;

  // Load last 30 days of daily ledger entries
  const promises = [];
  const dateLabels = [];
  for (let i = 29; i >= 0; i--) {
    const d = new Date(); d.setDate(d.getDate() - i);
    const ds = localDateStr(d);
    dateLabels.push(ds);
    promises.push(_getDayLedger(ds));
  }
  const ledgers = await Promise.all(promises);

  // Build cumulative net P&L, only plotted on days with bets
  const labels = [];
  const dataPoints = [];
  let running = 0;
  let hasBets = false;

  for (let i = 0; i < dateLabels.length; i++) {
    const lg = ledgers[i];
    if (!lg || !lg.bets) continue; // skip days with no bets
    running += lg.net || 0;
    running = Math.round(running * 100) / 100;
    const d = new Date(dateLabels[i] + 'T12:00:00');
    labels.push(d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }));
    dataPoints.push(running);
    hasBets = true;
  }

  if (!hasBets) {
    area.innerHTML = ''; // No data yet, hide
    return;
  }

  // Determine overall color based on final value
  const finalVal = dataPoints[dataPoints.length - 1] ?? 0;
  const lineColor = finalVal >= 0 ? '#00e87a' : '#ff3355';
  const fillColor = finalVal >= 0 ? 'rgba(0,232,122,0.08)' : 'rgba(255,51,85,0.08)';

  // Per-point dot colors (green if up, red if down at that point)
  const pointColors = dataPoints.map(v => v >= 0 ? '#00e87a' : '#ff3355');

  // Build card HTML
  area.innerHTML = `
    <div class="pnl-chart-card">
      <div class="pnl-chart-header">
        <div class="pnl-chart-title">💰 House Net P&L</div>
        <div class="pnl-chart-sub">Cumulative profit / loss · $10/game · end-of-day snapshots</div>
      </div>
      <div class="pnl-chart-wrap">
        <canvas id="pnl-canvas"></canvas>
      </div>
    </div>`;

  const ctx = document.getElementById('pnl-canvas');
  if (!ctx) return;

  if (_pnlChart) { _pnlChart.destroy(); _pnlChart = null; }

  _pnlChart = new Chart(ctx, {
    type: 'line',
    data: {
      labels,
      datasets: [{
        label: 'Net P&L',
        data: dataPoints,
        borderColor: lineColor,
        borderWidth: 2.5,
        backgroundColor: fillColor,
        fill: true,
        tension: 0.3,
        pointRadius: 5,
        pointHoverRadius: 8,
        pointBackgroundColor: pointColors,
        pointBorderColor: pointColors,
        spanGaps: true,
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        tooltip: {
          callbacks: {
            label: function(ctx) {
              const v = ctx.parsed.y;
              return (v >= 0 ? '+$' : '-$') + Math.abs(v).toFixed(2) + ' cumulative';
            }
          },
          bodyFont: { family: "'Barlow Condensed', sans-serif" },
          titleFont: { family: "'Barlow Condensed', sans-serif" },
        }
      },
      scales: {
        x: {
          grid: { color: '#ffffff08' },
          ticks: { font: { family: "'Barlow Condensed', sans-serif", size: 10 }, color: '#555', maxRotation: 45 }
        },
        y: {
          grid: { color: '#ffffff08' },
          border: { dash: [4, 4] },
          ticks: {
            font: { family: "'Barlow Condensed', sans-serif", size: 11 },
            color: '#666',
            callback: v => (v >= 0 ? '+$' : '-$') + Math.abs(v).toFixed(0)
          }
        }
      }
    }
  });
}

// PREDICTIONS TAB
// ============================================================

// Storage wrappers · uses localStorage (works in any browser).
// Falls back to a simple in-memory store if localStorage is blocked.
// ============================================================
// SCORES RENDER · 3-section redesign
// ============================================================
async function renderScores() {
  document.getElementById('scores-container').innerHTML =
    `<div class="loading-spinner"><div class="spinner"></div>Fetching live scores…</div>`;

  let data;
  try { data = await fetchAllScoreData(); }
  catch(e) { data = { today: [], recent: [], remaining: [], source: 'error', fetchedAt: new Date() }; }

  // Cache data so GTW badges can be refreshed when power rankings change
  _lastScoreData = data;

  // Update timestamp
  const now = data.fetchedAt || new Date();
  const tsEl = document.getElementById('scores-update-time');
  if (tsEl) tsEl.textContent = 'Updated ' + now.toLocaleDateString('en-US',{month:'short',day:'numeric'}) + ' · ' + now.toLocaleTimeString('en-US',{hour:'numeric',minute:'2-digit'});

  renderScoresHtml(data);
}

// Renders the scores tab HTML using cached game data + freshly computed power ranks.
// Call this directly (without re-fetching) when power rankings change mid-session.
function renderScoresHtml(data) {
  if (!data) return;

  // Always recompute power ranks fresh so GTW badges reflect current rankings
  const powerRanks = buildPowerRankMap();

  // ── PULL MONEYLINES FROM STORED BETTING PICKS ────────────
  // The betting tab fetches & stores MLs in localStorage. Read them here so
  // score cards always show moneylines regardless of ESPN odds availability.
  const _picksMLMap = {};
  try {
    const todayStr = localDateStr(new Date());
    const raw = _memStore['predictions:' + todayStr];
    if (raw) {
      const stored = JSON.parse(raw);
      (stored.picks || []).forEach(p => {
        if (p.homeAbbr && p.awayAbbr && (p.homeML || p.awayML)) {
          _picksMLMap[p.awayAbbr + '@' + p.homeAbbr] = { homeML: p.homeML, awayML: p.awayML };
        }
      });
    }
  } catch(e) {}

  // ── SCORE CARD BUILDER ─────────────────────────────────
  function scoreCard(g, opts = {}) {
    const { gtw = false, gtwLabel = '' } = opts;
    const homeAbbr = g.home, awayAbbr = g.away;
    const homeColors = TEAM_COLORS[homeAbbr] || { bg: '#333', text: '#fff' };
    const awayColors = TEAM_COLORS[awayAbbr] || { bg: '#333', text: '#fff' };
    const homeLogo = getLogoUrl(homeAbbr);
    const awayLogo = getLogoUrl(awayAbbr);
    const homeRec = STANDINGS_DATA.find(t => t.abbr === homeAbbr);
    const awayRec = STANDINGS_DATA.find(t => t.abbr === awayAbbr);
    const homeRecStr = homeRec ? `${homeRec.wins}–${homeRec.losses}` : '';
    const awayRecStr = awayRec ? `${awayRec.wins}–${awayRec.losses}` : '';

    const showScore = g.isFinal || g.isLive;
    const homeWon = g.homeScore > g.awayScore;

    let statusLabel, statusCls;
    if (g.isLive) { statusLabel = g.status || 'LIVE'; statusCls = 'status-live'; }
    else if (g.isFinal) { statusLabel = 'Final'; statusCls = 'status-final'; }
    else { statusLabel = g.tipDisplay || 'Upcoming'; statusCls = 'status-upcoming'; }

    // Date display
    const today = localDateStr(new Date());
    const yesterday = localDateStr(new Date(Date.now() - 86400000));
    let dateLabel = '';
    if (g.date === today) dateLabel = 'Today';
    else if (g.date === yesterday) dateLabel = 'Yesterday';
    else if (g.date) {
      const d = new Date(g.date + 'T12:00:00');
      dateLabel = d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
    }

    // Resolve moneylines: game object first, then picks cache fallback
    const _mlFallback = _picksMLMap[awayAbbr + '@' + homeAbbr] || {};
    const resolvedHomeML = g.homeML || _mlFallback.homeML || null;
    const resolvedAwayML = g.awayML || _mlFallback.awayML || null;

    function fmtML(ml) {
      if (!ml) return null;
      const str = (ml > 0 ? '+' : '') + ml;
      const color = ml < 0 ? '#4dffa0' : '#ffc844';
      return `<span style="font-family:'Bebas Neue',sans-serif;font-size:1.1rem;letter-spacing:1px;color:${color}">${str}</span>`;
    }

    // Win probability + moneylines
    let probBar = '';
    if (g.isUpcoming) {
      const { homePct, awayPct } = gameWinProb(awayAbbr, homeAbbr);
      const mlRow = (resolvedAwayML || resolvedHomeML) ? `
        <div style="display:flex;justify-content:space-between;align-items:center;margin-top:7px;padding-top:7px;border-top:1px solid var(--border)">
          <div>${fmtML(resolvedAwayML) || '<span style="color:var(--muted)">—</span>'}</div>
          <span style="font-family:'Barlow Condensed',sans-serif;font-size:0.6rem;letter-spacing:2px;color:var(--muted);text-transform:uppercase">Moneyline</span>
          <div>${fmtML(resolvedHomeML) || '<span style="color:var(--muted)">—</span>'}</div>
        </div>` : '';
      probBar = `<div class="score-prob-bar">
        <div class="score-prob-labels"><span>${awayAbbr} ${awayPct}%</span><span>${homeAbbr} ${homePct}%</span></div>
        <div class="score-prob-track">
          <div class="prob-away" style="width:${awayPct}%"></div>
          <div class="prob-home" style="width:${homePct}%"></div>
        </div>
        ${mlRow}
      </div>`;
    } else if ((g.isLive || g.isFinal) && (resolvedAwayML || resolvedHomeML)) {
      // Show pre-game ML on live/final cards
      probBar = `<div class="score-prob-bar">
        <div style="display:flex;justify-content:space-between;align-items:center">
          <div>${fmtML(resolvedAwayML) || '<span style="color:var(--muted)">—</span>'}</div>
          <span style="font-family:'Barlow Condensed',sans-serif;font-size:0.6rem;letter-spacing:2px;color:var(--muted);text-transform:uppercase">Pre-Game ML</span>
          <div>${fmtML(resolvedHomeML) || '<span style="color:var(--muted)">—</span>'}</div>
        </div>
      </div>`;
    }

    // Score display
    let scoreSection = '';
    if (showScore) {
      const homeScoreCls = g.isFinal ? (homeWon ? 'won' : 'lost') : 'live-score';
      const awayScoreCls = g.isFinal ? (!homeWon ? 'won' : 'lost') : 'live-score';
      scoreSection = `<div class="score-vs-block">
        <div class="score-final-scores">
          <div class="score-vs-num ${awayScoreCls}">${g.awayScore}</div>
          <div class="score-vs-dash">–</div>
          <div class="score-vs-num ${homeScoreCls}">${g.homeScore}</div>
        </div>
        ${g.isLive ? `<div style="font-family:'Barlow Condensed',sans-serif;font-size:0.68rem;letter-spacing:2px;color:var(--green);text-align:center">${g.status}</div>` : ''}
      </div>`;
    } else {
      scoreSection = `<div class="score-vs-block" style="color:var(--muted);font-family:'Barlow Condensed',sans-serif;font-size:0.85rem;letter-spacing:2px">VS</div>`;
    }

    // GTW matchup label
    const gtwMeta = gtw && gtwLabel ? `<div class="gtw-matchup-rank">⭐ ${gtwLabel}</div>` : '';

    // Close game banner: live game, 4th quarter, under 5:00, within 5 points
    let closeGameBanner = '';
    if (g.isLive) {
      const scoreDiff = Math.abs((g.homeScore || 0) - (g.awayScore || 0));
      const statusStr = (g.status || '').toLowerCase();
      // ESPN status text for 4th quarter looks like "4th - 3:42" or "4Q 2:15" or "End of 3rd"
      const is4thQ = /\b4(th|q)\b/i.test(statusStr) || statusStr.startsWith('4th') || statusStr.startsWith('4q');
      // Parse time remaining: look for M:SS pattern
      const timeMatch = statusStr.match(/(\d+):(\d{2})/);
      let secsRemaining = null;
      if (timeMatch) {
        secsRemaining = parseInt(timeMatch[1]) * 60 + parseInt(timeMatch[2]);
      }
      const under5mins = secsRemaining !== null && secsRemaining < 300;
      if (is4thQ && under5mins && scoreDiff <= 5) {
        const timeStr = timeMatch ? timeMatch[0].toUpperCase() : 'LATE 4TH';
        closeGameBanner = `<div class="close-game-banner"><div class="close-game-dot"></div>🔥 CLOSE GAME · ${timeStr} LEFT · ${scoreDiff === 0 ? 'TIED' : scoreDiff + ' PTS'}</div>`;
      }
    }

    return `<div class="score-card${gtw ? ' gtw' : ''}${g.isLive ? ' is-live' : ''}">
      ${gtw ? `<div class="gtw-flag">MUST WATCH</div>` : ''}
      <div class="score-card-top">
        <span class="score-time-badge">${dateLabel}${g.tipDisplay && !g.isFinal && !g.isLive ? ' · ' + g.tipDisplay : ''}</span>
        <span class="score-status ${statusCls}">${statusLabel}</span>
      </div>
      <div class="score-card-body">
        <div class="score-teams-row">
          <div class="score-team-block away">
            <div class="score-logo-wrap" style="background:${awayColors.bg};border:1px solid ${awayColors.bg}88">
              <img src="${awayLogo}" alt="${awayAbbr}" onerror="this.style.display='none'">
            </div>
            <div class="score-team-info">
              ${powerRanks[awayAbbr] ? `<div style="font-family:'Barlow Condensed',sans-serif;font-size:0.7rem;font-weight:700;letter-spacing:1px;color:rgba(255,255,255,0.4);line-height:1;margin-bottom:1px">#${powerRanks[awayAbbr]}</div>` : ''}
              <div class="score-team-abbr-lg" style="color:${awayColors.bg === '#333' ? 'var(--text)' : awayColors.bg}">${awayAbbr}</div>
              <div class="score-team-record">${awayRecStr} · Away</div>
            </div>
          </div>
          ${scoreSection}
          <div class="score-team-block home">
            <div class="score-logo-wrap" style="background:${homeColors.bg};border:1px solid ${homeColors.bg}88">
              <img src="${homeLogo}" alt="${homeAbbr}" onerror="this.style.display='none'">
            </div>
            <div class="score-team-info">
              ${powerRanks[homeAbbr] ? `<div style="font-family:'Barlow Condensed',sans-serif;font-size:0.7rem;font-weight:700;letter-spacing:1px;color:rgba(255,255,255,0.4);line-height:1;margin-bottom:1px">#${powerRanks[homeAbbr]}</div>` : ''}
              <div class="score-team-abbr-lg" style="color:${homeColors.bg === '#333' ? 'var(--text)' : homeColors.bg}">${homeAbbr}</div>
              <div class="score-team-record">${homeRecStr} · Home</div>
            </div>
          </div>
        </div>
        ${probBar}
        ${gtwMeta}
      </div>
      ${closeGameBanner}
    </div>`;
  }

  // ── SECTION HEADER HELPER ─────────────────────────────
  function sectionHead(title, sub, live = false) {
    return `<div class="scores-section-label">
      ${live ? '<div class="scores-live-dot"></div>' : ''}
      <div>
        <div class="scores-section-title">${title}</div>
        <div class="scores-section-sub">${sub}</div>
      </div>
    </div>`;
  }

  let html = '';

  // API source notice
  const sourceLabel = data.source === 'espn' ? 'ESPN API' : 'Cached data';
  html += `<div style="display:flex;align-items:center;gap:8px;margin-bottom:20px;font-family:'Barlow Condensed',sans-serif;font-size:0.75rem;letter-spacing:2px;color:var(--muted)">
    <div class="scores-live-dot"></div> Live · ${sourceLabel} · Auto-refreshes on page load
  </div>`;

  // ── GTW SCORING HELPER (used by both sections) ────────
  const allRemaining = data.remaining || [];
  const scoredRemaining = allRemaining.map(g => {
    const hr = powerRanks[g.home] || 30;
    const ar = powerRanks[g.away] || 30;
    const eliteScore = hr + ar;
    const bothTop10 = hr <= 10 && ar <= 10;
    return { ...g, hr, ar, eliteScore, bothTop10 };
  });

  // Helper: check if a today game qualifies as GTW (both teams top 10)
  function getTodayGtwOpts(g) {
    const hr = powerRanks[g.home] || 30;
    const ar = powerRanks[g.away] || 30;
    if (hr <= 10 && ar <= 10) {
      return { gtw: true, gtwLabel: `#${ar} ${g.away} vs #${hr} ${g.home}` };
    }
    return { gtw: false, gtwLabel: '' };
  }

  // ── SECTION 1: TODAY'S GAMES ──────────────────────────
  const todayFinal = data.today.filter(g => g.isFinal);
  const todayLive = data.today.filter(g => g.isLive);
  const todayUpcoming = data.today.filter(g => g.isUpcoming);
  const todayAll = [...todayLive, ...todayFinal, ...todayUpcoming];

  // Count how many of today's games are must-watch
  const todayGtwCount = todayAll.filter(g => getTodayGtwOpts(g).gtw).length;
  const todaySubLabel = [
    todayLive.length > 0 ? `${todayLive.length} game${todayLive.length > 1 ? 's' : ''} in progress` :
    todayFinal.length > 0 ? `${todayFinal.length} final${todayFinal.length > 1 ? 's' : ''} · ${todayUpcoming.length} upcoming` :
    todayUpcoming.length > 0 ? `${todayUpcoming.length} games tonight` : 'No games today',
    todayGtwCount > 0 ? `${todayGtwCount} must watch` : ''
  ].filter(Boolean).join(' · ');

  html += sectionHead("Today's Games", todaySubLabel, todayLive.length > 0);

  if (todayAll.length > 0) {
    html += '<div class="scores-grid">';
    todayAll.forEach(g => { html += scoreCard(g, getTodayGtwOpts(g)); });
    html += '</div>';
  } else {
    html += `<div class="no-games-msg">🏀 No games scheduled today. Check back tomorrow.</div>`;
  }

  html += '<div class="scores-divider"></div>';

  // ── SECTION 2: GAMES TO WATCH (future only · exclude today) ──
  const todayStr2 = localDateStr(new Date());
  const gtwGames = scoredRemaining
    .filter(g => g.bothTop10 && g.date > todayStr2)
    .sort((a, b) => a.date.localeCompare(b.date) || a.eliteScore - b.eliteScore);

  html += sectionHead('Games to Watch',
    gtwGames.length > 0 ? `${gtwGames.length} upcoming game${gtwGames.length > 1 ? 's' : ''} between two top-10 teams` : 'No upcoming top-10 matchups found',
    false);

  if (gtwGames.length > 0) {
    html += '<div class="scores-grid">';
    gtwGames.forEach(g => {
      const matchupStr = `#${g.ar} ${g.away} vs #${g.hr} ${g.home}`;
      html += scoreCard(g, { gtw: true, gtwLabel: matchupStr });
    });
    html += '</div>';
  } else {
    html += `<div class="no-games-msg">No upcoming games this season between two top-10 power-ranked teams</div>`;
  }

  html += '<div class="scores-divider"></div>';

  // ── SECTION 3: RECENT RESULTS ─────────────────────────
  const recentToShow = data.recent;

  const recentCount = Math.min(recentToShow.length, 16);
  html += sectionHead('Recent Results', data.source === 'espn' ? 'Past 72 hours · From ESPN API' : 'Cached results', false);

  if (recentToShow.length > 0) {
    html += '<div class="scores-grid">';
    recentToShow.slice(0, recentCount).forEach(g => { html += scoreCard(g); });
    html += '</div>';
  } else {
    html += `<div class="no-games-msg">No recent results available</div>`;
  }

  document.getElementById('scores-container').innerHTML = html;

  // Feed finished games into the live engine so rankings/playoffs/graph update.
  // Only call applyLiveGameData when there are genuinely new finals not yet applied.
  const finishedGames = [...(data.today||[]), ...(data.recent||[])].filter(g => g.isFinal);
  const hasNewFinals = finishedGames.some(g => {
    const key = g.date + '_' + g.home + '_' + g.away;
    return !_appliedGameKeys.has(key);
  });
  if (hasNewFinals) {
    applyLiveGameData(finishedGames);
    renderRankings(); // re-render rankings only when data actually changed
  }

  // Start/reset the background poll loop
  _hasLiveGames = (data.today||[]).some(g => g.isLive);
  schedulePoll();
}

function renderStandings() {
  const east = STANDINGS_DATA.filter(t => t.conf === 'EAST').sort((a,b)=>b.wins-a.wins||(a.losses-b.losses));
  const west = STANDINGS_DATA.filter(t => t.conf === 'WEST').sort((a,b)=>b.wins-a.wins||(a.losses-b.losses));

  function tableFor(teams, confName) {
    let h = `<div class="conf-header">${confName} Conference</div>`;
    h += `<table class="standings-table"><thead><tr>
      <th>#</th><th>Team</th><th>W</th><th>L</th><th>PCT</th><th>GB</th><th>DIV</th>
    </tr></thead><tbody>`;
    const leaderW = teams[0].wins, leaderL = teams[0].losses;
    teams.forEach((t, i) => {
      const gb = i === 0 ? '' : (((leaderW - t.wins) + (t.losses - leaderL)) / 2).toFixed(1);
      const playoffLine = i === 5; // after 6th seed
      h += `<tr class="${playoffLine ? 'playoff-line' : ''}">
        <td>${i+1}</td>
        <td>${t.name}</td>
        <td>${t.wins}</td>
        <td>${t.losses}</td>
        <td class="win-pct">${(t.wins/(t.wins+t.losses)*100).toFixed(1)}%</td>
        <td>${gb}</td>
        <td>${t.div.split(' ')[0]}</td>
      </tr>`;
    });
    h += '</tbody></table>';
    return h;
  }

  document.getElementById('standings-container').innerHTML =
    tableFor(east, 'Eastern') + tableFor(west, 'Western');
}

