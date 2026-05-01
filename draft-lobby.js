// ── FF Draft Lobby — Phase 1: Lobby & Identity ──────────────────────────────

(function () {
  'use strict';

  let _lobbyId   = null;
  let _myUid     = null;
  let _myName    = null;
  let _isGuest   = false;
  let _unsubLobby = null;
  let _lastDraftData = null;
  let _timerInterval = null;
  let _botTimeout    = null;
  let _bbScrollTop   = -1;
  window._draftQueue = [];

  function _db() { return firebase.firestore(); }
  function _panel() { return document.getElementById('nfl-ff-draft'); }

  const _BOT_NAMES = ['Alpha Bot','Bravo Bot','Charlie Bot','Delta Bot','Echo Bot',
    'Foxtrot Bot','Golf Bot','Hotel Bot','India Bot','Juliet Bot','Kilo Bot','Lima Bot'];

  const _BOT_PERSONALITIES = ['hero-rb','zero-rb','robust-rb','late-qbte','stacker','bpa'];

  const _ROSTER_SLOTS = [
    {id:'QB',  label:'QB',   pos:['QB']},
    {id:'RB1', label:'RB',   pos:['RB']},
    {id:'RB2', label:'RB',   pos:['RB']},
    {id:'WR1', label:'WR',   pos:['WR']},
    {id:'WR2', label:'WR',   pos:['WR']},
    {id:'TE',  label:'TE',   pos:['TE']},
    {id:'FLX', label:'FLEX', pos:['RB','WR','TE']},
    {id:'DST', label:'D/ST', pos:['DST']},
    {id:'K',   label:'K',    pos:['K']},
    {id:'BN1', label:'BN',   pos:['QB','RB','WR','TE','DST','K']},
    {id:'BN2', label:'BN',   pos:['QB','RB','WR','TE','DST','K']},
    {id:'BN3', label:'BN',   pos:['QB','RB','WR','TE','DST','K']},
    {id:'BN4', label:'BN',   pos:['QB','RB','WR','TE','DST','K']},
    {id:'BN5', label:'BN',   pos:['QB','RB','WR','TE','DST','K']},
    {id:'BN6', label:'BN',   pos:['QB','RB','WR','TE','DST','K']},
    {id:'BN7', label:'BN',   pos:['QB','RB','WR','TE','DST','K']},
  ];

  // ── Tab entry point (called by showNflTab) ──────────────────────────────────
  window.renderDraftLobbyTab = async function () {
    const container = _panel();
    if (!container) return;
    container.innerHTML = `<div class="ffd-loading">Connecting to lobby…</div>`;

    try {
      const identity = await _draftGetIdentity();
      if (!identity) return;
      _myUid   = identity.uid;
      _myName  = identity.name;
      _isGuest = identity.isGuest;

      _lobbyId = await _draftGetOrCreateLobby();
      await _draftJoinLobby(_lobbyId);
      _draftSubscribe(_lobbyId);
    } catch (e) {
      console.error('[Draft] lobby error:', e);
      const c = _panel();
      if (c) c.innerHTML = `<div class="ffd-loading" style="color:#ff6b6b">Failed to connect. Please try again.</div>`;
    }
  };

  // ── Identity ────────────────────────────────────────────────────────────────
  async function _draftGetIdentity() {
    const uid  = typeof _jcrAuth !== 'undefined' && _jcrAuth.getUid();
    const name = typeof _jcrAuth !== 'undefined' && _jcrAuth.getDisplayName();
    if (uid && name) return { uid, name, isGuest: false };

    const gId   = sessionStorage.getItem('jcr_draft_guest_id');
    const gName = sessionStorage.getItem('jcr_draft_guest_name');
    if (gId && gName) return { uid: gId, name: gName, isGuest: true };

    return new Promise(resolve => _draftIdentityModal(resolve));
  }

  function _draftIdentityModal(resolve) {
    const ov = document.createElement('div');
    ov.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,0.88);z-index:10000;display:flex;align-items:center;justify-content:center';
    ov.innerHTML = `
      <div style="background:#12122a;border:1px solid rgba(255,170,0,0.35);border-radius:14px;padding:36px;max-width:420px;width:90%;font-family:'Barlow Condensed',sans-serif;text-align:center">
        <div style="font-size:1.6rem;letter-spacing:3px;color:#ffaa00;margin-bottom:8px">🏈 FANTASY DRAFT</div>
        <div style="color:#aaa;font-size:0.92rem;margin-bottom:24px;line-height:1.6">Sign in to use your sportsbook nickname, or join as a guest.</div>
        <button id="dd-google" style="width:100%;padding:12px 16px;border-radius:8px;border:1px solid rgba(255,255,255,0.18);background:rgba(255,255,255,0.07);color:#fff;font-family:'Barlow Condensed',sans-serif;font-size:1rem;letter-spacing:2px;cursor:pointer;margin-bottom:14px;display:flex;align-items:center;justify-content:center;gap:10px">
          <svg width="18" height="18" viewBox="0 0 48 48"><path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/><path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/><path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/><path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/></svg>
          SIGN IN WITH GOOGLE
        </button>
        <div style="color:#555;font-size:0.78rem;letter-spacing:1px;margin-bottom:14px;">— OR —</div>
        <input id="dd-nick" type="text" maxlength="20" placeholder="Enter a nickname…"
          style="width:100%;box-sizing:border-box;padding:11px 14px;border-radius:8px;border:1px solid rgba(255,170,0,0.3);background:rgba(255,255,255,0.05);color:#fff;font-family:'Barlow Condensed',sans-serif;font-size:1rem;letter-spacing:1px;margin-bottom:12px;outline:none"/>
        <button id="dd-guest" style="width:100%;padding:12px;border-radius:8px;border:1px solid rgba(255,170,0,0.5);background:transparent;color:#ffaa00;font-family:'Barlow Condensed',sans-serif;font-size:1rem;letter-spacing:3px;font-weight:700;cursor:pointer">JOIN AS GUEST</button>
        <div id="dd-err" style="color:#ff6b6b;font-size:0.85rem;margin-top:12px;min-height:18px"></div>
      </div>`;
    document.body.appendChild(ov);

    ov.querySelector('#dd-google').onclick = () => {
      _jcrAuth.ensureAuth().then(uid => {
        document.body.removeChild(ov);
        resolve({ uid, name: _jcrAuth.getDisplayName(), isGuest: false });
      }).catch(() => {});
    };

    const guestBtn = ov.querySelector('#dd-guest');
    const nickInput = ov.querySelector('#dd-nick');
    const errEl = ov.querySelector('#dd-err');
    const doGuest = () => {
      const n = nickInput.value.trim().slice(0, 20);
      if (!n) { errEl.textContent = 'Please enter a nickname.'; return; }
      const gId = 'guest_' + Math.random().toString(36).slice(2, 10);
      sessionStorage.setItem('jcr_draft_guest_id', gId);
      sessionStorage.setItem('jcr_draft_guest_name', n);
      document.body.removeChild(ov);
      resolve({ uid: gId, name: n, isGuest: true });
    };
    guestBtn.onclick = doGuest;
    nickInput.onkeydown = e => { if (e.key === 'Enter') doGuest(); };
  }

  // ── Lobby find / create ─────────────────────────────────────────────────────
  async function _draftGetOrCreateLobby() {
    const snap = await _db().collection('ff_draft_lobbies')
      .where('status', '==', 'waiting')
      .orderBy('createdAt', 'asc')
      .limit(1)
      .get();
    if (!snap.empty) return snap.docs[0].id;

    const ref = await _db().collection('ff_draft_lobbies').add({
      status: 'waiting',
      hostId: null,
      createdAt: firebase.firestore.FieldValue.serverTimestamp(),
      settings: { leagueSize: 10, timerSeconds: 30 },
      participants: {}
    });
    return ref.id;
  }

  // ── Join (transaction — first joiner becomes host) ──────────────────────────
  async function _draftJoinLobby(lobbyId) {
    const ref = _db().collection('ff_draft_lobbies').doc(lobbyId);
    await _db().runTransaction(async tx => {
      const doc = await tx.get(ref);
      const data = doc.data();
      const parts = { ...(data.participants || {}) };
      if (!parts[_myUid]) {
        parts[_myUid] = { name: _myName, isBot: false, isGuest: _isGuest, joinedAt: Date.now() };
      }
      tx.update(ref, { participants: parts, hostId: data.hostId || _myUid });
    });
  }

  // ── Real-time listener ──────────────────────────────────────────────────────
  function _draftSubscribe(lobbyId) {
    if (_unsubLobby) _unsubLobby();
    _unsubLobby = _db().collection('ff_draft_lobbies').doc(lobbyId)
      .onSnapshot(snap => {
        if (!snap.exists) return;
        const data = snap.data();
        if (data.status === 'drafting') {
          _renderDraftBoard(data, lobbyId);
          _handleBotPick(data, lobbyId);
        } else {
          _draftRenderLobby(data, lobbyId);
        }
      });
  }

  // ── Render lobby UI ─────────────────────────────────────────────────────────
  function _draftRenderLobby(data, lobbyId) {
    const container = _panel();
    if (!container) return;

    const { settings = {}, participants = {}, hostId, slotPreferences = {} } = data;
    const isHost      = hostId === _myUid;
    const maxSlots    = settings.leagueSize || 10;
    const randomize   = settings.randomizeOrder !== false; // default true
    const pList       = Object.entries(participants).sort((a, b) => a[1].joinedAt - b[1].joinedAt);
    const count       = pList.length;

    // When manual order: render all N slots in pick order, each slot claimed or open
    // When random: render joined participants then empty slots (original behaviour)
    let participantRows, emptySlots;
    if (!randomize) {
      const myClaimedSlot = slotPreferences[_myUid] !== undefined ? slotPreferences[_myUid] : null;
      participantRows = Array.from({ length: maxSlots }, (_, i) => {
        const claimedUid  = Object.entries(slotPreferences).find(([, s]) => s === i)?.[0];
        const p           = claimedUid ? participants[claimedUid] : null;
        const isMe        = claimedUid === _myUid;
        const isH         = claimedUid === hostId;
        if (p) {
          return `<div class="ffd-participant${isMe ? ' ffd-me' : ''}">
            <div class="ffd-p-left">
              ${isH ? '<span class="ffd-host-crown">👑</span>' : '<span class="ffd-p-dot"></span>'}
              <span class="ffd-slot-badge">${i + 1}</span>
              <span class="ffd-p-name">${p.name}${isMe ? ' <span class="ffd-you-tag">YOU</span>' : ''}</span>
              ${p.isGuest ? '<span class="ffd-guest-tag">GUEST</span>' : ''}
            </div>
            <div style="display:flex;gap:6px;align-items:center">
              ${isHost && !isH ? `<button class="ffd-give-host-btn" onclick="_draftGiveHost('${lobbyId}','${claimedUid}')">Give Host</button>` : ''}
              ${isMe ? `<button class="ffd-give-host-btn" onclick="_draftClaimSlot('${lobbyId}',null)">Leave</button>` : ''}
            </div>
          </div>`;
        }
        return `<div class="ffd-participant ffd-empty">
          <div class="ffd-p-left">
            <span class="ffd-p-dot ffd-dot-empty"></span>
            <span class="ffd-slot-badge" style="opacity:0.35">${i + 1}</span>
            <span class="ffd-p-name ffd-empty-label">Open slot ${i + 1}</span>
          </div>
          ${myClaimedSlot !== i ? `<button class="ffd-give-host-btn" onclick="_draftClaimSlot('${lobbyId}',${i})">Move here</button>` : ''}
        </div>`;
      }).join('');
      emptySlots = '';
    } else {
      participantRows = pList.map(([uid, p]) => {
        const isMe = uid === _myUid;
        const isH  = uid === hostId;
        return `<div class="ffd-participant${isMe ? ' ffd-me' : ''}">
          <div class="ffd-p-left">
            ${isH ? '<span class="ffd-host-crown">👑</span>' : '<span class="ffd-p-dot"></span>'}
            <span class="ffd-p-name">${p.name}${isMe ? ' <span class="ffd-you-tag">YOU</span>' : ''}</span>
            ${p.isGuest ? '<span class="ffd-guest-tag">GUEST</span>' : ''}
          </div>
          ${isHost && !isH ? `<button class="ffd-give-host-btn" onclick="_draftGiveHost('${lobbyId}','${uid}')">Give Host</button>` : ''}
        </div>`;
      }).join('');
      emptySlots = Array.from({ length: Math.max(0, maxSlots - count) }, (_, i) =>
        `<div class="ffd-participant ffd-empty">
          <div class="ffd-p-left"><span class="ffd-p-dot ffd-dot-empty"></span><span class="ffd-p-name ffd-empty-label">Open slot ${count + i + 1}</span></div>
        </div>`
      ).join('');
    }

    const settingsPanel = isHost
      ? `<div class="ffd-settings-panel">
          <div class="ffd-panel-title">LOBBY SETTINGS</div>
          <div class="ffd-settings-row">
            <span class="ffd-settings-label">League Size</span>
            <div class="ffd-opts">
              ${[8,10,12].map(n => `<button class="ffd-opt${settings.leagueSize===n?' active':''}" onclick="_draftSetSetting('${lobbyId}','leagueSize',${n})">${n}</button>`).join('')}
            </div>
          </div>
          <div class="ffd-settings-row">
            <span class="ffd-settings-label">Pick Timer</span>
            <div class="ffd-opts">
              ${[15,30,60,90].map(n => `<button class="ffd-opt${settings.timerSeconds===n?' active':''}" onclick="_draftSetSetting('${lobbyId}','timerSeconds',${n})">${n}s</button>`).join('')}
              <button class="ffd-opt${!settings.timerSeconds?' active':''}" onclick="_draftSetSetting('${lobbyId}','timerSeconds',0)">∞</button>
            </div>
          </div>
          <div class="ffd-settings-row">
            <span class="ffd-settings-label">Draft Order</span>
            <div class="ffd-opts">
              <button class="ffd-opt${randomize?' active':''}" onclick="_draftSetSetting('${lobbyId}','randomizeOrder',true)">Random</button>
              <button class="ffd-opt${!randomize?' active':''}" onclick="_draftSetSetting('${lobbyId}','randomizeOrder',false)">Manual</button>
            </div>
          </div>
        </div>`
      : `<div class="ffd-settings-panel ffd-settings-ro">
          <div class="ffd-panel-title">LOBBY SETTINGS</div>
          <div class="ffd-settings-row"><span class="ffd-settings-label">League Size</span><span class="ffd-settings-val">${maxSlots} teams</span></div>
          <div class="ffd-settings-row"><span class="ffd-settings-label">Pick Timer</span><span class="ffd-settings-val">${settings.timerSeconds ? settings.timerSeconds+'s' : 'No limit'}</span></div>
          <div class="ffd-settings-row"><span class="ffd-settings-label">Draft Order</span><span class="ffd-settings-val">${randomize ? 'Randomized' : 'Manual'}</span></div>
        </div>`;


    const canStart = isHost && count >= 1;
    const actionArea = isHost
      ? `<button class="ffd-start-btn" onclick="_draftStartDraft('${lobbyId}')" ${canStart ? '' : 'disabled'}>START DRAFT</button>`
      : `<div class="ffd-waiting-msg">Waiting for host to start…</div>`;

    container.innerHTML = `
      <div class="ffd-wrap">
        <div class="ffd-topbar">
          <span class="ffd-lobby-code">LOBBY · ${lobbyId.slice(0,8).toUpperCase()}</span>
        </div>
        <div class="ffd-lobby-header">🏈 DRAFT LOBBY</div>
        <div class="ffd-lobby-sub">${count} / ${maxSlots} players joined · ${maxSlots - count > 0 ? (maxSlots-count)+' open slot'+(maxSlots-count!==1?'s':'')+' (bots will fill on start)' : 'lobby full'}</div>
        <div class="ffd-body">
          <div class="ffd-participants-panel">
            <div class="ffd-panel-title">PARTICIPANTS</div>
            ${participantRows}${emptySlots}
          </div>
          ${settingsPanel}
        </div>
        ${actionArea}
      </div>`;
  }

  // ── Host actions (global so inline onclick can reach them) ──────────────────
  window._draftGiveHost = async function (lobbyId, newHostId) {
    await _db().collection('ff_draft_lobbies').doc(lobbyId).update({ hostId: newHostId });
  };

  window._draftSetSetting = async function (lobbyId, key, val) {
    await _db().collection('ff_draft_lobbies').doc(lobbyId)
      .update({ ['settings.' + key]: val });
  };

  window._draftStartDraft = async function (lobbyId) {
    const db   = _db();
    const snap = await db.collection('ff_draft_lobbies').doc(lobbyId).get();
    const data = snap.data();
    const settings       = data.settings || {};
    const leagueSize     = settings.leagueSize || 10;
    const timerSecs      = settings.timerSeconds || 0;
    const randomize      = settings.randomizeOrder !== false;
    const slotPrefs      = data.slotPreferences || {};
    const participants   = { ...(data.participants || {}) };

    // Order humans by their claimed slot (manual) or join order, then shuffle if random
    let humanUids = Object.entries(participants)
      .sort((a, b) => {
        if (!randomize) {
          const sa = slotPrefs[a[0]] !== undefined ? slotPrefs[a[0]] : 999;
          const sb = slotPrefs[b[0]] !== undefined ? slotPrefs[b[0]] : 999;
          if (sa !== sb) return sa - sb;
        }
        return a[1].joinedAt - b[1].joinedAt;
      })
      .map(([uid]) => uid);

    if (randomize) {
      for (let i = humanUids.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [humanUids[i], humanUids[j]] = [humanUids[j], humanUids[i]];
      }
    }

    let botCount = 0;
    while (humanUids.length < leagueSize) {
      const botUid = 'bot_' + Math.random().toString(36).slice(2, 10);
      participants[botUid] = {
        name: _BOT_NAMES[botCount] || ('Bot ' + (botCount + 1)),
        isBot: true,
        botPersonality: _BOT_PERSONALITIES[botCount % _BOT_PERSONALITIES.length],
        joinedAt: Date.now() + botCount + 1
      };
      humanUids.push(botUid);
      botCount++;
    }

    const draftOrder = [];
    for (let r = 0; r < 16; r++) {
      draftOrder.push(...(r % 2 === 0 ? [...humanUids] : [...humanUids].reverse()));
    }

    const timerEndsAt = timerSecs > 0
      ? firebase.firestore.Timestamp.fromMillis(Date.now() + timerSecs * 1000) : null;

    const batch = db.batch();
    batch.update(db.collection('ff_draft_lobbies').doc(lobbyId), {
      status: 'drafting', participants, draftOrder,
      currentPickIndex: 0, picks: [], draftedRanks: [], timerEndsAt
    });
    batch.set(db.collection('ff_draft_lobbies').doc(), {
      status: 'waiting', hostId: null,
      createdAt: firebase.firestore.FieldValue.serverTimestamp(),
      settings: { leagueSize: 10, timerSeconds: 30 }, participants: {}
    });
    await batch.commit();
  };

  window._draftLeaveLobby = function () {
    if (_unsubLobby) { _unsubLobby(); _unsubLobby = null; }

    if (_lobbyId && _myUid) {
      const ref = _db().collection('ff_draft_lobbies').doc(_lobbyId);
      ref.get().then(doc => {
        if (!doc.exists) return;
        const data = doc.data();
        const parts = { ...(data.participants || {}) };
        delete parts[_myUid];
        const update = { participants: parts };
        if (data.hostId === _myUid) {
          const remaining = Object.keys(parts);
          update.hostId = remaining.length ? remaining[0] : null;
        }
        ref.update(update);
      });
    }

    _lobbyId = null;
  };

  // ── Draft board ─────────────────────────────────────────────────────────────
  function _buildRoster(picks, uid) {
    const mine = picks.filter(p => p.uid === uid).sort((a, b) => a.pickIndex - b.pickIndex);
    const slots = _ROSTER_SLOTS.map(s => ({ ...s, filled: null }));
    for (const pick of mine) {
      const slot = slots.find(s => !s.filled && s.pos.includes(pick.playerPos));
      if (slot) slot.filled = pick;
    }
    return slots;
  }

  function _posColor(p) { return typeof _ffPosColor === 'function' ? _ffPosColor(p) : '#888'; }
  function _teamOf(name) {
    const k = (name||'').toLowerCase().replace(/[.'''`]/g,'').replace(/\s+/g,' ').trim();
    return (window._playerTeamMap && (window._playerTeamMap[k] ||
      window._playerTeamMap[k.replace(/\s+(jr|sr|ii|iii|iv)$/i,'').trim()])) || '';
  }

  function _renderBigBoard(data, leagueSize, currentPickIndex) {
    const { draftOrder = [], picks = [], participants = {} } = data;
    const picksMap = {};
    picks.forEach(p => { picksMap[p.pickIndex] = p; });
    const teamOrder  = draftOrder.slice(0, leagueSize);
    const totalRounds = 16;
    const currentRound0 = Math.floor(currentPickIndex / leagueSize); // 0-indexed

    const headerCells = teamOrder.map((uid, c) => {
      const isMe = uid === _myUid;
      const name = (participants[uid] || {}).name || '?';
      return `<div class="ffdb-bb-th${isMe ? ' ffdb-bb-me-col' : ''}">${name}</div>`;
    }).join('');

    const roundRows = Array.from({length: totalRounds}, (_, r) => {
      const isCur = r === currentRound0;
      const cells = teamOrder.map((uid, c) => {
        const pickIdx = r * leagueSize + (r % 2 === 0 ? c : leagueSize - 1 - c);
        const pick    = picksMap[pickIdx];
        const isOnClock = pickIdx === currentPickIndex;
        const isMe    = uid === _myUid;
        const pc      = pick ? _posColor(pick.playerPos) : '';
        return `<div class="ffdb-bb-cell${pick?' ffdb-bb-picked':''}${isOnClock?' ffdb-bb-onclock':''}${isMe?' ffdb-bb-me-col':''}">
          <div class="ffdb-bb-picknum">${r+1}.${String((r%2===0?c:leagueSize-1-c)+1).padStart(2,'0')}</div>
          ${pick
            ? `<div class="ffdb-bb-pname">${pick.playerName}</div><div class="ffdb-bb-pdot" style="background:${pc}"></div>`
            : isOnClock ? `<div class="ffdb-bb-pname ffdb-bb-clock-label">ON CLOCK</div>` : ''}
        </div>`;
      }).join('');
      return `<div class="ffdb-bb-round${isCur?' ffdb-bb-cur-round':''}" data-round="${r}">${cells}</div>`;
    }).join('');

    return { headerCells, roundRows, currentRound0 };
  }

  function _renderDraftBoard(data, lobbyId) {
    const container = _panel();
    if (!container) return;
    _lastDraftData = data;

    const { draftOrder = [], currentPickIndex = 0, picks = [],
            draftedRanks = [], participants = {}, settings = {}, timerEndsAt } = data;
    const leagueSize  = settings.leagueSize || 10;
    const timerSecs   = settings.timerSeconds || 0;
    const totalPicks  = draftOrder.length;

    if (currentPickIndex >= totalPicks) {
      container.innerHTML = `<div class="ffd-loading">Draft complete! Clanker's Verdict coming in Phase 4.</div>`;
      return;
    }

    const currentUid    = draftOrder[currentPickIndex];
    const currentPicker = participants[currentUid] || {};
    const isMyTurn      = currentUid === _myUid;
    const currentRound  = Math.floor(currentPickIndex / leagueSize) + 1;
    const pickInRound   = (currentPickIndex % leagueSize) + 1;

    // Save big board scroll before re-render
    const bbOld = document.getElementById('ffdb-bb-scroll');
    if (bbOld) _bbScrollTop = bbOld.scrollTop;

    // Forced starter mode
    const myRemainingPicks = draftOrder.slice(currentPickIndex).filter(u => u === _myUid).length;
    const unfilledStarters = _buildRoster(picks, _myUid).filter(s => !s.id.startsWith('BN') && !s.filled);
    const forcedMode = unfilledStarters.length > 0 && unfilledStarters.length >= myRemainingPicks;
    const forcedPos  = forcedMode ? new Set(unfilledStarters.flatMap(s => s.pos)) : null;

    // Available players
    const posFilter  = window._ffdbPosFilter || 'ALL';
    const draftedSet = new Set(draftedRanks);
    const available  = (typeof FANTASY_RANKINGS !== 'undefined' ? FANTASY_RANKINGS : [])
      .filter(p => !draftedSet.has(p.rank));
    const flexSet    = new Set(['QB','RB','WR','TE']);
    let filtered = posFilter === 'ALL' ? available
      : posFilter === 'FLEX' ? available.filter(p => flexSet.has(p.pos))
      : available.filter(p => p.pos === posFilter);
    if (forcedMode) filtered = available.filter(p => forcedPos.has(p.pos));

    // My future pick indicators
    const myFuturePicks = [];
    for (let i = currentPickIndex; i < draftOrder.length; i++) {
      if (draftOrder[i] === _myUid) {
        myFuturePicks.push({
          pickIdx: i,
          round: Math.floor(i / leagueSize) + 1,
          playersBefore: i - currentPickIndex
        });
      }
    }

    // Build player rows with indicators interspersed
    const queue = window._draftQueue || [];
    const poolRows = [];
    let indIdx = 0;
    filtered.forEach((p, i) => {
      while (indIdx < myFuturePicks.length && myFuturePicks[indIdx].playersBefore === i) {
        const fp = myFuturePicks[indIdx++];
        poolRows.push(`<div class="ffdb-pick-indicator">
          <span class="ffdb-pi-line"></span>
          <span class="ffdb-pi-label">▼ YOUR R${fp.round} PICK (EST. #${fp.pickIdx + 1} OVERALL)</span>
          <span class="ffdb-pi-line"></span>
        </div>`);
      }
      const inQueue = queue.includes(p.rank);
      poolRows.push(`<div class="ffdb-player-row${inQueue?' ffdb-in-queue':''}">
        <span class="ffdb-p-rank">${p.rank}</span>
        <span class="ffdb-pos-badge" style="background:${_posColor(p.pos)}">${p.pos}</span>
        <span class="ffdb-p-name">${p.name}</span>
        <span class="ffdb-p-team">${_teamOf(p.name)}</span>
        <button class="ffdb-q-btn${inQueue?' ffdb-q-active':''}" onclick="_toggleQueue(${p.rank})" title="${inQueue?'Remove from queue':'Add to queue'}">${inQueue?'★':'☆'}</button>
        ${isMyTurn && (!forcedMode || forcedPos.has(p.pos))
          ? `<button class="ffdb-pick-btn" onclick="_draftMakePick('${lobbyId}',${p.rank})">DRAFT</button>`
          : '<span class="ffdb-pick-ph"></span>'}
      </div>`);
    });
    // Remaining indicators beyond available pool
    while (indIdx < myFuturePicks.length) {
      const fp = myFuturePicks[indIdx++];
      poolRows.push(`<div class="ffdb-pick-indicator ffdb-pi-end">
        <span class="ffdb-pi-line"></span>
        <span class="ffdb-pi-label">▼ YOUR R${fp.round} PICK (EST. #${fp.pickIdx + 1} OVERALL)</span>
        <span class="ffdb-pi-line"></span>
      </div>`);
    }

    // Queue panel
    const queueRows = queue.length
      ? queue.map((rank, qi) => {
          const p = (typeof FANTASY_RANKINGS !== 'undefined' ? FANTASY_RANKINGS : []).find(x => x.rank === rank);
          if (!p) return '';
          const gone = draftedSet.has(rank);
          return `<div class="ffdb-q-row${gone?' ffdb-q-gone':''}">
            <span class="ffdb-q-pos">${qi+1}.</span>
            <span class="ffdb-pos-badge ffdb-pos-sm" style="background:${_posColor(p.pos)}">${p.pos}</span>
            <span class="ffdb-q-name">${p.name}</span>
            ${gone ? '<span class="ffdb-q-tag">GONE</span>' : ''}
            ${isMyTurn && !gone
              ? `<button class="ffdb-pick-btn" style="font-size:0.68rem;padding:3px 8px" onclick="_draftMakePick('${lobbyId}',${rank})">DRAFT</button>`
              : ''}
            <button class="ffdb-q-rm" onclick="_toggleQueue(${rank})">✕</button>
          </div>`;
        }).join('')
      : '<div class="ffdb-empty-pool">No players queued. Star ☆ players to add.</div>';

    // Roster
    const rosterSlots = _buildRoster(picks, _myUid).map(s => `
      <div class="ffdb-slot${s.filled?' ffdb-slot-filled':''}">
        <span class="ffdb-slot-label">${s.label}</span>
        ${s.filled
          ? `<span class="ffdb-slot-player"><span class="ffdb-slot-pos" style="color:${_posColor(s.filled.playerPos)}">${s.filled.playerPos}</span> ${s.filled.playerName}</span>`
          : `<span class="ffdb-slot-empty">—</span>`}
      </div>`).join('');

    // Recent picks
    const recentPicks = [...picks].sort((a,b) => b.pickIndex - a.pickIndex).slice(0, 10).map(p => {
      const r  = Math.floor(p.pickIndex / leagueSize) + 1;
      const pk = (p.pickIndex % leagueSize) + 1;
      return `<div class="ffdb-recent-row">
        <span class="ffdb-recent-meta">R${r}.${pk}</span>
        <span class="ffdb-pos-badge ffdb-pos-sm" style="background:${_posColor(p.playerPos)}">${p.playerPos}</span>
        <span class="ffdb-recent-name">${p.playerName}</span>
        <span class="ffdb-recent-picker">${(participants[p.uid]||{}).name||'?'}</span>
      </div>`;
    }).join('');

    // Big board
    const { headerCells, roundRows } = _renderBigBoard(data, leagueSize, currentPickIndex);

    const forcedBanner = forcedMode
      ? `<div class="ffdb-forced-banner">⚠ Only showing players eligible for your remaining starter slots</div>` : '';

    container.innerHTML = `
      <div class="ffdb-wrap">
        <div class="ffdb-topbar">
          <div class="ffdb-round-info">Round ${currentRound} · Pick ${pickInRound} / ${leagueSize}</div>
          <div class="ffdb-clock${isMyTurn?' ffdb-your-turn':''}">
            ${isMyTurn ? '⚡ YOUR PICK' : `${currentPicker.name||'?'} is picking…`}
            ${timerSecs > 0 ? `<span class="ffdb-timer" id="ffdb-timer">--</span>` : ''}
          </div>
          <div class="ffdb-pick-count">${currentPickIndex} / ${totalPicks} picks made</div>
        </div>

        <div class="ffdb-bb-wrap">
          <div class="ffdb-bb-outer" id="ffdb-bb-outer">
            <div class="ffdb-bb-header-row">
              <div class="ffdb-bb-corner">RD</div>${headerCells}
            </div>
            <div class="ffdb-bb-scroll" id="ffdb-bb-scroll">${roundRows}</div>
          </div>
        </div>

        <div class="ffdb-main">
          <div class="ffdb-pool-panel">
            <div class="ffdb-pool-header">
              <span class="ffdb-panel-title">AVAILABLE · ${filtered.length}</span>
              <div class="ffdb-pos-filters">
                ${['ALL','FLEX','QB','RB','WR','TE','K','DST'].map(pos =>
                  `<button class="ffdb-pos-pill${posFilter===pos&&!forcedMode?' active':''}" onclick="_ffdbSetFilter('${pos}')">${pos}</button>`
                ).join('')}
              </div>
            </div>
            ${forcedBanner}
            <div class="ffdb-pool-list">${poolRows.join('')||'<div class="ffdb-empty-pool">No players available.</div>'}</div>
          </div>

          <div class="ffdb-right-panel">
            <div class="ffdb-queue-panel">
              <div class="ffdb-panel-title">MY QUEUE · ${queue.length}</div>
              ${queueRows}
            </div>
            <div class="ffdb-roster-panel">
              <div class="ffdb-panel-title">MY ROSTER</div>
              ${rosterSlots}
            </div>
            <div class="ffdb-feed-panel">
              <div class="ffdb-panel-title">RECENT PICKS</div>
              ${recentPicks || '<div class="ffdb-empty-pool">No picks yet.</div>'}
            </div>
          </div>
        </div>
      </div>`;

    // Restore / init big board scroll
    const bbNew = document.getElementById('ffdb-bb-scroll');
    if (bbNew) {
      if (_bbScrollTop >= 0) {
        bbNew.scrollTop = _bbScrollTop;
      } else {
        const rowH = 56;
        bbNew.scrollTop = Math.max(0, Math.floor(currentPickIndex / leagueSize) - 1) * rowH;
      }
    }

    _startTimer(timerEndsAt, timerSecs, lobbyId);
  }

  // ── Pick submission ─────────────────────────────────────────────────────────
  window._draftMakePick = async function (lobbyId, playerRank, forUid) {
    const pickerUid = forUid || _myUid;
    const ref = _db().collection('ff_draft_lobbies').doc(lobbyId);
    await _db().runTransaction(async tx => {
      const doc  = await tx.get(ref);
      const data = doc.data();
      if (data.draftOrder[data.currentPickIndex] !== pickerUid) return;
      if ((data.draftedRanks || []).includes(playerRank)) return;

      const player = (typeof FANTASY_RANKINGS !== 'undefined' ? FANTASY_RANKINGS : [])
        .find(p => p.rank === playerRank);
      if (!player) return;

      const k    = (player.name||'').toLowerCase().replace(/[.'''`]/g,'').replace(/\s+/g,' ').trim();
      const team = (window._playerTeamMap && (window._playerTeamMap[k] ||
        window._playerTeamMap[k.replace(/\s+(jr|sr|ii|iii|iv)$/i,'').trim()])) || null;

      const timerSecs = data.settings?.timerSeconds || 0;
      const nextTimer = timerSecs > 0
        ? firebase.firestore.Timestamp.fromMillis(Date.now() + timerSecs * 1000) : null;

      tx.update(ref, {
        picks: firebase.firestore.FieldValue.arrayUnion({
          pickIndex: data.currentPickIndex, uid: pickerUid,
          playerRank, playerName: player.name, playerPos: player.pos,
          playerTeam: team, timestamp: Date.now()
        }),
        draftedRanks: firebase.firestore.FieldValue.arrayUnion(playerRank),
        currentPickIndex: data.currentPickIndex + 1,
        timerEndsAt: nextTimer
      });
    });
  };

  // ── Bot picks ───────────────────────────────────────────────────────────────
  function _handleBotPick(data, lobbyId) {
    if (_myUid !== data.hostId) return;
    const currentUid = (data.draftOrder || [])[data.currentPickIndex];
    if (!currentUid || !data.participants?.[currentUid]?.isBot) return;

    if (_botTimeout) { clearTimeout(_botTimeout); _botTimeout = null; }
    _botTimeout = setTimeout(async () => {  // 3s bot delay
      const snap = await _db().collection('ff_draft_lobbies').doc(lobbyId).get();
      if (!snap.exists) return;
      const fresh = snap.data();
      if ((fresh.draftOrder || [])[fresh.currentPickIndex] !== currentUid) return;
      const drafted = new Set(fresh.draftedRanks || []);
      const bpa = (typeof FANTASY_RANKINGS !== 'undefined' ? FANTASY_RANKINGS : [])
        .find(p => !drafted.has(p.rank));
      if (bpa) await window._draftMakePick(lobbyId, bpa.rank, currentUid);
    }, 3000);
  }

  // ── Timer countdown ─────────────────────────────────────────────────────────
  function _startTimer(timerEndsAt, timerSecs, lobbyId) {
    if (_timerInterval) { clearInterval(_timerInterval); _timerInterval = null; }
    if (!timerSecs || !timerEndsAt) return;
    const endMs = timerEndsAt.toMillis ? timerEndsAt.toMillis() : Number(timerEndsAt);
    const tick  = () => {
      const el  = document.getElementById('ffdb-timer');
      if (!el)  { clearInterval(_timerInterval); return; }
      const rem = Math.max(0, Math.ceil((endMs - Date.now()) / 1000));
      el.textContent = rem + 's';
      el.style.color = rem <= 10 ? '#e74c3c' : '';
      if (rem <= 0) {
        clearInterval(_timerInterval); _timerInterval = null;
        // Auto-pick BPA for whoever is on the clock
        _db().collection('ff_draft_lobbies').doc(lobbyId).get().then(snap => {
          if (!snap.exists) return;
          const d   = snap.data();
          const uid = (d.draftOrder || [])[d.currentPickIndex];
          // Human auto-pick: only current user handles their own expiry
          // Bot expiry: host handles (already covered by _handleBotPick)
          if (uid !== _myUid) return;
          const drafted = new Set(d.draftedRanks || []);
          const all = typeof FANTASY_RANKINGS !== 'undefined' ? FANTASY_RANKINGS : [];
          const pick = _queueOrBpa(all, drafted);
          if (pick) window._draftMakePick(lobbyId, pick.rank);
        });
      }
    };
    tick();
    _timerInterval = setInterval(tick, 1000);
  }

  // ── Position filter ─────────────────────────────────────────────────────────
  window._ffdbPosFilter = 'ALL';
  window._ffdbSetFilter = function (pos) {
    window._ffdbPosFilter = pos;
    if (_lastDraftData && _lobbyId) _renderDraftBoard(_lastDraftData, _lobbyId);
  };

  // ── Queue helpers ────────────────────────────────────────────────────────────
  function _queueOrBpa(all, drafted) {
    for (const rank of (window._draftQueue || [])) {
      const p = all.find(x => x.rank === rank && !drafted.has(x.rank));
      if (p) return p;
    }
    return all.find(p => !drafted.has(p.rank)) || null;
  }

  window._toggleQueue = function (rank) {
    const q = window._draftQueue;
    const i = q.indexOf(rank);
    if (i >= 0) q.splice(i, 1); else q.push(rank);
    if (_lastDraftData && _lobbyId) _renderDraftBoard(_lastDraftData, _lobbyId);
  };

  // ── Slot claim ───────────────────────────────────────────────────────────────
  window._draftClaimSlot = async function (lobbyId, slotIndex) {
    const ref = _db().collection('ff_draft_lobbies').doc(lobbyId);
    await _db().runTransaction(async tx => {
      const doc  = await tx.get(ref);
      const data = doc.data();
      const prefs = { ...(data.slotPreferences || {}) };
      delete prefs[_myUid];
      if (slotIndex !== null) {
        const taken = Object.entries(prefs).some(([uid, s]) => s === slotIndex && uid !== _myUid);
        if (!taken) prefs[_myUid] = slotIndex;
      }
      tx.update(ref, { slotPreferences: prefs });
    });
  };
})();
