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
  let _bbLastSnapRound = -1;
  window._draftQueue    = [];
  window._ffdbBoardView = 'round'; // 'round' | 'roster'

  function _db() { return firebase.firestore(); }
  function _panel() { return document.getElementById('nfl-ff-draft'); }

  const _BOT_NAMES = ['Alpha Bot','Bravo Bot','Charlie Bot','Delta Bot','Echo Bot',
    'Foxtrot Bot','Golf Bot','Hotel Bot','India Bot','Juliet Bot','Kilo Bot','Lima Bot'];

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
      const update = { participants: parts, hostId: data.hostId || _myUid };
      // Auto-claim first open slot when manual order is active
      if (data.settings?.randomizeOrder === false) {
        const prefs = { ...(data.slotPreferences || {}) };
        if (prefs[_myUid] === undefined) {
          const leagueSize = data.settings?.leagueSize || 10;
          const taken = new Set(Object.values(prefs));
          for (let i = 0; i < leagueSize; i++) {
            if (!taken.has(i)) { prefs[_myUid] = i; break; }
          }
          update.slotPreferences = prefs;
        }
      }
      tx.update(ref, update);
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
          ${myClaimedSlot !== i ? `<button class="ffd-give-host-btn ffd-move-here-btn" onclick="_draftClaimSlot('${lobbyId}',${i})">Move here</button>` : ''}
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
          <div class="ffd-settings-row">
            <span class="ffd-settings-label">Bot Speed</span>
            <div class="ffd-opts ffd-opts-nowrap">
              ${['vfast','fast','normal','slow','vslow'].map(spd => {
                const labels = { vfast:'Very Fast', fast:'Fast', normal:'Normal', slow:'Slow', vslow:'Very Slow' };
                const cur = settings.botSpeed || 'normal';
                return `<button class="ffd-opt${cur===spd?' active':''}" onclick="_draftSetSetting('${lobbyId}','botSpeed','${spd}')">${labels[spd]}</button>`;
              }).join('')}
            </div>
          </div>
        </div>`
      : `<div class="ffd-settings-panel ffd-settings-ro">
          <div class="ffd-panel-title">LOBBY SETTINGS</div>
          <div class="ffd-settings-row"><span class="ffd-settings-label">League Size</span><span class="ffd-settings-val">${maxSlots} teams</span></div>
          <div class="ffd-settings-row"><span class="ffd-settings-label">Pick Timer</span><span class="ffd-settings-val">${settings.timerSeconds ? settings.timerSeconds+'s' : 'No limit'}</span></div>
          <div class="ffd-settings-row"><span class="ffd-settings-label">Draft Order</span><span class="ffd-settings-val">${randomize ? 'Randomized' : 'Manual'}</span></div>
          <div class="ffd-settings-row"><span class="ffd-settings-label">Bot Speed</span><span class="ffd-settings-val">${({'vfast':'Very Fast','fast':'Fast','normal':'Normal','slow':'Slow','vslow':'Very Slow'})[settings.botSpeed||'normal']}</span></div>
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

    let botCount = 0;
    while (humanUids.length < leagueSize) {
      const botUid = 'bot_' + Math.random().toString(36).slice(2, 10);
      participants[botUid] = {
        name: _BOT_NAMES[botCount] || ('Bot ' + (botCount + 1)),
        isBot: true,
        botPersonality: 'emergent',
        joinedAt: Date.now() + botCount + 1
      };
      humanUids.push(botUid);
      botCount++;
    }

    if (randomize) {
      for (let i = humanUids.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [humanUids[i], humanUids[j]] = [humanUids[j], humanUids[i]];
      }
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
      return `<div class="ffdb-bb-round${isCur?' ffdb-bb-cur-round':''}" data-round="${r}"><div class="ffdb-bb-rlabel">R${r+1}</div>${cells}</div>`;
    }).join('');

    return { headerCells, roundRows, currentRound0 };
  }

  function _renderRosterBoard(data, leagueSize) {
    const { draftOrder = [], picks = [], participants = {}, currentPickIndex = 0 } = data;
    const teamOrder  = draftOrder.slice(0, leagueSize);
    const currentUid = draftOrder[currentPickIndex];

    const headerCells = teamOrder.map(uid => {
      const isMe      = uid === _myUid;
      const isOnClock = uid === currentUid;
      const name      = (participants[uid] || {}).name || '?';
      return `<div class="ffdb-bb-th${isMe ? ' ffdb-bb-me-col' : ''}${isOnClock ? ' ffdb-rv-onclock' : ''}">${isOnClock ? '⏱ ' : ''}${name}</div>`;
    }).join('');

    const rosterRows = _ROSTER_SLOTS.map((slot, si) => {
      const cells = teamOrder.map(uid => {
        const isMe      = uid === _myUid;
        const isOnClock = uid === currentUid;
        const slots     = _buildRoster(picks, uid);
        const filled    = slots[si] && slots[si].filled;
        const pc        = filled ? _posColor(filled.playerPos) : '';
        return `<div class="ffdb-bb-cell ffdb-rv-cell${isMe?' ffdb-bb-me-col':''}${filled?' ffdb-bb-picked':''}${isOnClock?' ffdb-rv-col-active':''}">
          ${filled
            ? `<div class="ffdb-bb-pdot" style="background:${pc}"></div><div class="ffdb-bb-pname">${filled.playerName}</div>`
            : `<span class="ffdb-slot-empty">—</span>`}
        </div>`;
      }).join('');
      const isBench = slot.label === 'BN';
      return `<div class="ffdb-bb-round ffdb-rv-row${isBench?' ffdb-rv-bench':''}">
        <div class="ffdb-bb-rlabel ffdb-rv-label">${slot.label}</div>${cells}
      </div>`;
    }).join('');

    return { headerCells, rosterRows };
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
      _renderVerdict(data, lobbyId);
      return;
    }

    const currentUid    = draftOrder[currentPickIndex];
    const currentPicker = participants[currentUid] || {};
    const isMyTurn      = currentUid === _myUid;
    const currentRound  = Math.floor(currentPickIndex / leagueSize) + 1;
    const pickInRound   = (currentPickIndex % leagueSize) + 1;

    // Save pool scroll position before re-render
    const poolOld = document.getElementById('ffdb-pool-list');
    const savedPoolScroll = poolOld ? poolOld.scrollTop : 0;

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
    const flexSet    = new Set(['RB','WR','TE']);
    const rookieSet  = (typeof FF_ROOKIES !== 'undefined') ? FF_ROOKIES : new Set();
    let filtered = posFilter === 'ALL'    ? available
      : posFilter === 'FLEX'   ? available.filter(p => flexSet.has(p.pos))
      : posFilter === 'ROOKIE' ? available.filter(p => rookieSet.has((p.name||'').toLowerCase()))
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
        <button class="ffdb-q-pill${inQueue?' ffdb-q-active':''}" onclick="_toggleQueue(${p.rank})">${inQueue?'Queued':'+ Queue'}</button>
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
      : '<div class="ffdb-empty-pool">No players queued. Use "+ Queue" to add players.</div>';

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
    const boardView = window._ffdbBoardView || 'round';
    const { headerCells, roundRows, currentRound0 } = _renderBigBoard(data, leagueSize, currentPickIndex);
    const { headerCells: rvHeader, rosterRows }     = _renderRosterBoard(data, leagueSize);

    const boardInner = boardView === 'roster'
      ? `<div class="ffdb-bb-header-row">
           <div class="ffdb-bb-corner">POS</div>${rvHeader}
         </div>
         <div class="ffdb-rv-scroll" id="ffdb-bb-scroll">${rosterRows}</div>`
      : `<div class="ffdb-bb-header-row">
           <div class="ffdb-bb-corner">RD</div>${headerCells}
         </div>
         <div class="ffdb-bb-scroll" id="ffdb-bb-scroll">${roundRows}</div>`;

    const forcedBanner = forcedMode
      ? `<div class="ffdb-forced-banner">⚠ Only showing players eligible for your remaining starter slots</div>` : '';

    container.innerHTML = `
      <div class="ffdb-wrap">
        <div class="ffdb-topbar">
          <div class="ffdb-round-info">Round ${currentRound} · Pick ${pickInRound} / ${leagueSize}</div>
          <div class="ffdb-pick-count">${currentPickIndex} / ${totalPicks} picks made</div>
        </div>

        <div class="ffdb-bb-wrap">
          <div class="ffdb-bb-viewtoggle">
            <button class="ffdb-vt-btn${boardView==='round'?' active':''}" onclick="window._ffdbBoardView='round';if(_lastDraftData&&_lobbyId)_renderDraftBoard(_lastDraftData,_lobbyId)">Round View</button>
            <button class="ffdb-vt-btn${boardView==='roster'?' active':''}" onclick="window._ffdbBoardView='roster';if(_lastDraftData&&_lobbyId)_renderDraftBoard(_lastDraftData,_lobbyId)">Roster View</button>
          </div>
          <div class="ffdb-bb-outer" id="ffdb-bb-outer">
            ${boardInner}
          </div>
        </div>

        <div class="ffdb-clock${isMyTurn?' ffdb-your-turn':''}">
          ${isMyTurn ? '⚡ YOUR PICK' : `${currentPicker.name||'?'} is picking…`}
          ${timerSecs > 0 ? `<span class="ffdb-timer" id="ffdb-timer">--</span>` : ''}
        </div>

        <div class="ffdb-main">
          <div class="ffdb-pool-panel">
            <div class="ffdb-pool-header">
              <span class="ffdb-panel-title">AVAILABLE · ${filtered.length}</span>
              <div class="ffdb-pos-filters">
                ${['ALL','FLEX','QB','RB','WR','TE','K','DST','ROOKIE'].map(pos =>
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

    // Restore pool scroll — defer so browser finishes layout before setting scrollTop
    requestAnimationFrame(() => {
      const poolNew = document.getElementById('ffdb-pool-list');
      if (poolNew) poolNew.scrollTop = savedPoolScroll;
    });

    // Auto-scroll big board: snap position updates only on new round,
    // but scrollTop is always restored since DOM is replaced each render
    const bbNew = document.getElementById('ffdb-bb-scroll');
    if (bbNew && boardView === 'round') {
      const curRound0 = Math.floor(currentPickIndex / leagueSize);
      if (curRound0 !== _bbLastSnapRound) _bbLastSnapRound = curRound0;
      bbNew.scrollTop = Math.max(0, _bbLastSnapRound - 1) * 56;
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

  // ── Bot personality engine ──────────────────────────────────────────────────
  const _BOT_PERSONALITIES = ['hero-rb','zero-rb','robust-rb','late-qbte','stacker','bpa','bully-te','franchise','rookie-fever'];

  function _botPickPlayer(personality, available, myPicks, round) {
    if (!available.length) return null;

    // Current roster summary
    const cnt = {};
    myPicks.forEach(p => { cnt[p.playerPos] = (cnt[p.playerPos] || 0) + 1; });
    const rb = cnt.RB||0, wr = cnt.WR||0, qb = cnt.QB||0, te = cnt.TE||0;
    const hasEliteRB = myPicks.some(p => p.playerPos==='RB' && p.playerRank<=20);

    // Pre-compute shared values
    const myQB    = myPicks.find(p => p.playerPos==='QB');
    const myTE    = myPicks.find(p => p.playerPos==='TE');
    const qbTeam  = myQB ? _teamOf(myQB.playerName) : null;
    const myQBRank = myQB ? myQB.playerRank : 999;
    const myTERank = myTE ? myTE.playerRank : 999;
    const eliteQB  = myQBRank <= 15;
    const mediumQB = myQBRank <= 50;
    const eliteTE  = myTERank <= 12;
    const mediumTE = myTERank <= 40;

    // Best available rank (for stacker rank-delta check)
    const bpaRank = available.length ? available[0].rank : 999;

    // Bye week map for shared-bye penalty
    const byeMap = (typeof BYE_WEEKS !== 'undefined') ? BYE_WEEKS : {};
    const myTeams = new Set(myPicks.map(pp => _teamOf(pp.playerName)).filter(Boolean));
    const myByesByPos = {};
    myPicks.forEach(pp => {
      const t = _teamOf(pp.playerName);
      if (!t) return;
      const bw = byeMap[t];
      if (!bw) return;
      if (!myByesByPos[pp.playerPos]) myByesByPos[pp.playerPos] = new Set();
      myByesByPos[pp.playerPos].add(bw);
    });

    const scored = available.map(p => {
      let s = 400 - p.rank;

      // ── Hard caps ────────────────────────────────────────────────────────────
      if (p.pos==='QB'  && qb>=2) s *= 0.02;
      if (p.pos==='TE'  && te>=2) s *= 0.02;
      if (p.pos==='K'   && (cnt.K||0)>=1)   s *= 0.05;
      if (p.pos==='DST' && (cnt.DST||0)>=1) s *= 0.05;
      if (p.pos==='RB'  && rb>=5) s *= 0.4;
      if (p.pos==='WR'  && wr>=5) s *= 0.4;

      // ── K/DST timing: no bot drafts these before round 14 ────────────────────
      if ((p.pos==='K' || p.pos==='DST') && (cnt[p.pos]||0)===0 && round < 14) s *= 0.02;

      // ── QB backup timing ──────────────────────────────────────────────────────
      if (p.pos==='QB' && qb===0) {
        if (round >= 9) s *= 4.0;
      } else if (p.pos==='QB' && qb===1) {
        if (eliteQB) {
          if (round < 13)       s *= 0.05; else s *= 2.5;
        } else if (mediumQB) {
          if (round < 10)       s *= 0.05;
          else if (round <= 12) s *= 2.0;
          else                  s *= 1.5;
        } else {
          if (round < 8)        s *= 0.05;
          else if (round <= 10) s *= 2.5;
          else                  s *= 2.0;
        }
      }

      // ── TE backup timing ──────────────────────────────────────────────────────
      if (p.pos==='TE' && te===1) {
        if (eliteTE) {
          if (round < 13)       s *= 0.05; else s *= 2.0;
        } else if (mediumTE) {
          if (round < 10)       s *= 0.05;
          else if (round <= 12) s *= 1.8;
          else                  s *= 1.4;
        } else {
          if (round < 8)        s *= 0.05;
          else if (round <= 11) s *= 2.0;
          else                  s *= 1.6;
        }
      }

      // ── Shared-bye penalty (all bots, all positions) ──────────────────────────
      const pTeamAbbr = _teamOf(p.name);
      if (pTeamAbbr && byeMap[pTeamAbbr] && myByesByPos[p.pos]) {
        if (myByesByPos[p.pos].has(byeMap[pTeamAbbr])) s *= 0.8;
      }

      // ── Personality modifiers ─────────────────────────────────────────────────
      switch (personality) {

        case 'hero-rb': {
          // Rounds 1-2: only chase elite RBs (rank ≤ 15); if none available, BPA
          const bestAvailRB = available.find(x => x.pos==='RB');
          const topRBGone   = !bestAvailRB || bestAvailRB.rank > 15;
          if (round <= 2) {
            if (p.pos==='RB' && rb===0 && !topRBGone) s *= 2.8;
            else if (p.pos==='RB' && rb===0 && topRBGone) { /* BPA — no multiplier */ }
            else if (p.pos==='RB') s *= 0.4;
          } else if (round <= 6) {
            if (hasEliteRB) {
              if (p.pos==='RB')                      s *= 0.15;
              if (p.pos==='WR'||p.pos==='TE')        s *= 1.5;
              if (p.pos==='QB' && qb===0)            s *= 1.3;
            } else {
              if (p.pos==='RB') s *= 1.6;
            }
          } else {
            if (p.pos==='RB' && rb>=2) s *= 0.35;
          }
          // Flex tolerance: allow up to 7 RBs/WRs for this build
          if (p.pos==='RB' && rb>=5 && rb<7) s *= 2.0; // undo soft cap partially
          break;
        }

        case 'zero-rb': {
          if (round <= 8) {
            if (p.pos==='RB')                       s *= 0.04;
            if (p.pos==='WR' && wr < 3)             s *= 1.25; // capped at 3 WRs with boost
            if (p.pos==='QB' && qb===0)             s *= 1.3;
            if (p.pos==='TE' && te===0)             s *= 1.3;
          } else {
            if (p.pos==='RB')                       s *= 2.2;
          }
          break;
        }

        case 'robust-rb':
          if (rb < 3 && round <= 6) {
            if (p.pos==='RB')               s *= 2.4;
          } else if (rb >= 3) {
            if (p.pos==='RB')               s *= 0.2;
            if (p.pos==='WR')               s *= 2.1;
            if (p.pos==='TE' && te===0)     s *= 1.9;
          }
          break;

        case 'late-qbte':
          // Trigger urgency at round 8 (earlier than the universal round-9 fallback)
          if (round <= 6) {
            if (p.pos==='QB')               s *= 0.04;
            if (p.pos==='TE')               s *= 0.08;
            if (p.pos==='WR')               s *= 1.35;
            if (p.pos==='RB')               s *= 1.2;
          } else if (round <= 8) {
            if (p.pos==='QB' && qb===0)     s *= 3.0; // bump urgency a round early
            if (p.pos==='TE' && te===0)     s *= 2.5;
          } else {
            if (p.pos==='QB' && qb===0)     s *= 3.5;
            if (p.pos==='TE' && te===0)     s *= 3.0;
          }
          break;

        case 'stacker':
          if (qb===0) {
            if (round <= 7 && p.pos==='QB') s *= 2.2;
          } else if (qbTeam) {
            const tm = _teamOf(p.name);
            // Only apply stack bonus if teammate is within 25 ranks of BPA
            if (tm && tm===qbTeam && (p.pos==='WR'||p.pos==='TE') && (p.rank - bpaRank) <= 25) {
              s *= 3.0;
            }
          }
          break;

        case 'bully-te':
          // Target 2 elite TEs in rounds 1-5; flex one every week
          if (te < 2 && round <= 5) {
            if (p.pos==='TE')               s *= 3.5;
          } else if (te >= 2) {
            if (p.pos==='TE')               s *= 0.05; // already loaded
            if (p.pos==='RB' && rb < 2)     s *= 1.8;
            if (p.pos==='WR' && wr < 2)     s *= 1.8;
          }
          break;

        case 'franchise':
          // Avoid stacking multiple players from the same NFL team; mild bye-week diversity bonus
          if (pTeamAbbr && myTeams.has(pTeamAbbr)) s *= 0.6;
          break;

        case 'rookie-fever': {
          // Boost rookies 1.5×; slight preference for high-upside positions
          const isRookie = (typeof FF_ROOKIES !== 'undefined') && FF_ROOKIES.has((p.name||'').toLowerCase());
          if (isRookie) {
            s *= 1.5;
            if (p.pos==='RB'||p.pos==='WR') s *= 1.1; // extra juice for skill rookies
          }
          break;
        }

        case 'emergent':
          // Fluid state — no multipliers; round-1 weighted draw handled before this map
          break;

        case 'bpa':
        default:
          break;
      }

      return { player: p, score: s };
    });

    scored.sort((a, b) => b.score - a.score);
    return scored[0].player;
  }

  function _resolveArchetype(picks) {
    const p1 = picks[0]?.playerPos;
    const p2 = picks[1]?.playerPos;
    const key = `${p1}+${p2}`;
    switch (key) {
      case 'RB+RB': return 'robust-rb';
      case 'RB+WR': return 'hero-rb';   // got RB, now building out
      case 'RB+TE': return 'hero-rb';
      case 'WR+WR': return 'zero-rb';   // pure zero-rb only if both picks were WR
      case 'WR+RB': return 'bpa';       // balanced start — no strong lean, go BPA
      case 'WR+TE': return 'bpa';       // balanced start
      case 'TE+TE': return 'bully-te';
      case 'TE+RB': return 'bully-te';
      case 'TE+WR': return 'bully-te';
      case 'QB+WR': return 'stacker';
      case 'QB+RB': return 'stacker';
      case 'QB+TE': return 'stacker';
      case 'RB+QB': return 'late-qbte';
      case 'WR+QB': return 'late-qbte';
      default:      return 'bpa';
    }
  }

  // ── Bot picks ───────────────────────────────────────────────────────────────
  function _handleBotPick(data, lobbyId) {
    if (_myUid !== data.hostId) return;
    const currentUid = (data.draftOrder || [])[data.currentPickIndex];
    if (!currentUid || !data.participants?.[currentUid]?.isBot) return;

    if (_botTimeout) { clearTimeout(_botTimeout); _botTimeout = null; }
    const _ls       = data.settings?.leagueSize || 10;
    const _botSpeed = data.settings?.botSpeed || 'normal';
    const botDelay  = _botSpeed === 'vfast'  ? 150
                    : _botSpeed === 'fast'   ? 1000
                    : _botSpeed === 'slow'   ? 5000
                    : _botSpeed === 'vslow'  ? 10000
                    // normal: tiered by round
                    : data.currentPickIndex < _ls * 3 ? 3000
                    : data.currentPickIndex < _ls * 7 ? 2000
                    : data.currentPickIndex < _ls * 9 ? 1000 : 150;
    _botTimeout = setTimeout(async () => {
      const snap = await _db().collection('ff_draft_lobbies').doc(lobbyId).get();
      if (!snap.exists) return;
      const fresh = snap.data();
      if ((fresh.draftOrder || [])[fresh.currentPickIndex] !== currentUid) return;

      const all         = typeof FANTASY_RANKINGS !== 'undefined' ? FANTASY_RANKINGS : [];
      const drafted     = new Set(fresh.draftedRanks || []);
      let   available   = all.filter(p => !drafted.has(p.rank));
      let   personality = fresh.participants?.[currentUid]?.botPersonality || 'bpa';
      const leagueSize  = fresh.settings?.leagueSize || 10;
      const round       = Math.floor(fresh.currentPickIndex / leagueSize) + 1;
      const myPicks     = (fresh.picks || []).filter(p => p.uid === currentUid);

      // Bot forced starter mode: mirror the human logic
      const totalPicks    = (fresh.draftOrder || []).length;
      const botRemaining  = (fresh.draftOrder || []).slice(fresh.currentPickIndex).filter(u => u === currentUid).length;
      const botUnfilled   = _buildRoster(myPicks.map(p => ({ ...p, uid: currentUid })), currentUid)
                              .filter(s => !s.id.startsWith('BN') && !s.filled);
      if (botUnfilled.length > 0 && botUnfilled.length >= botRemaining) {
        const forcedPos = new Set(botUnfilled.flatMap(s => s.pos));
        available = available.filter(p => forcedPos.has(p.pos));
      }

      // Round 1 emergent: weighted draw from top 3 (70/20/10), bypass scoring
      if (round === 1 && personality === 'emergent') {
        const roll = Math.random();
        const idx  = roll < 0.70 ? 0 : roll < 0.90 ? 1 : 2;
        const pick = available[Math.min(idx, available.length - 1)];
        if (pick) await window._draftMakePick(lobbyId, pick.rank, currentUid);
        return;
      }

      // Round 3+ emergent: lock in archetype based on first two picks
      if (personality === 'emergent' && myPicks.length >= 2) {
        personality = _resolveArchetype(myPicks);
        await _db().collection('ff_draft_lobbies').doc(lobbyId).update({
          [`participants.${currentUid}.botPersonality`]: personality
        });
      }

      const pick = _botPickPlayer(personality, available, myPicks, round);
      if (pick) await window._draftMakePick(lobbyId, pick.rank, currentUid);
    }, botDelay);
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
      const pool = document.getElementById('ffdb-pool-list');
      if (pool) pool.classList.toggle('ffdb-pool-urgent', rem <= 5 && rem > 0);
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

  // ── Phase 4: Clanker's Verdict ───────────────────────────────────────────────
  function _gradeTeam(uid, data) {
    const { draftOrder = [], picks = [], settings = {} } = data;
    const leagueSize = settings.leagueSize || 10;
    const allRankings = typeof FANTASY_RANKINGS !== 'undefined' ? FANTASY_RANKINGS : [];
    const rankMap = {};
    allRankings.forEach(p => { rankMap[p.rank] = p; });

    const teamOrder = draftOrder.slice(0, leagueSize);
    const mySlot    = teamOrder.indexOf(uid);
    const myPicks   = picks.filter(p => p.uid === uid).sort((a, b) => a.pickIndex - b.pickIndex);
    if (!myPicks.length) return null;

    // ── Category 1: Positional Balance ──────────────────────────────────────────
    // Does the roster fill all starter slots with valid players?
    const slots = _buildRoster(myPicks, uid);
    const starterSlots = slots.filter(s => s.label !== 'BN');
    const filledStarters = starterSlots.filter(s => s.filled).length;
    const balScore = Math.round((filledStarters / starterSlots.length) * 100);

    // ── Category 2: Value / Tier Awareness ──────────────────────────────────────
    // For each of my picks, find BPA by checking which players were taken before it.
    // Uses string coercion to avoid any numeric type mismatches from Firestore.
    const allPicksSorted = [...picks].sort((a, b) => Number(a.pickIndex) - Number(b.pickIndex));

    let totalReach = 0;
    myPicks.forEach(p => {
      const myIdx = Number(p.pickIndex);
      // Collect ranks taken by picks that happened strictly before this one
      const takenStr = new Set(
        allPicksSorted
          .filter(q => Number(q.pickIndex) < myIdx)
          .map(q => String(q.playerRank))
      );
      const bpa = allRankings.find(r => !takenStr.has(String(r.rank)));
      const bpaRank = bpa ? Number(bpa.rank) : Number(p.playerRank);
      totalReach += Math.max(0, Number(p.playerRank) - bpaRank);
    });
    console.log('[Verdict] uid=' + uid + ' picks=' + myPicks.length + ' totalReach=' + totalReach + ' avgReach=' + (myPicks.length ? totalReach / myPicks.length : 0));
    const avgReach = myPicks.length ? totalReach / myPicks.length : 0;
    // Normalize: 0 avg reach → 100 (always took BPA), 20+ avg reach → 0
    const valScore = Math.min(100, Math.max(0, Math.round(100 - avgReach * (100 / 20))));

    // ── Category 3: Depth Quality ────────────────────────────────────────────────
    // Average rank of bench picks — calibrated to where bench players actually fall.
    // In a 16-round draft, bench picks (rounds 10-16) are typically rank 90-200.
    // rank ≤ 60 → 100 (elite stash), rank 200 → 0 (pure filler). Range = 140.
    const benchPicks = slots.filter(s => s.label === 'BN' && s.filled).map(s => s.filled);
    let depScore = 50;
    if (benchPicks.length) {
      const avgBenchRank = benchPicks.reduce((s, p) => s + p.playerRank, 0) / benchPicks.length;
      depScore = Math.min(100, Math.max(0, Math.round(100 - Math.max(0, avgBenchRank - 60) * (100 / 140))));
    }

    // ── Category 4: Scarcity Recognition ────────────────────────────────────────
    // Reward drafting scarce elite positions (TE, QB) in early rounds vs. late.
    // TE top 5 by rank in first 5 rounds = great; K/DST in first 8 rounds = punished.
    let scarScore = 60;
    const earlyPicks = myPicks.filter(p => p.pickIndex < leagueSize * 4); // first 4 rounds
    const latePicks  = myPicks.filter(p => p.pickIndex >= leagueSize * 12); // last 4 rounds
    const eliteTE = myPicks.find(p => p.playerPos === 'TE' && p.playerRank <= 30);
    if (eliteTE) {
      const round = Math.floor(myPicks.findIndex(x => x === eliteTE) / 1) ;
      scarScore += eliteTE.pickIndex < leagueSize * 5 ? 20 : 5;
    }
    const earlyKDST = earlyPicks.filter(p => p.playerPos === 'K' || p.playerPos === 'DST');
    scarScore -= earlyKDST.length * 15;
    const lateKDST = latePicks.filter(p => p.playerPos === 'K' || p.playerPos === 'DST');
    scarScore += lateKDST.length * 8;
    scarScore = Math.min(100, Math.max(0, scarScore));

    // ── Category 5: Strategy Coherence ──────────────────────────────────────────
    // Measure how consistently a strategy was applied (RB heavy, WR heavy, etc.)
    // Simple: check if top 4 picks cluster into a recognizable pattern.
    const top4 = myPicks.slice(0, Math.min(4, myPicks.length));
    const pos4 = top4.map(p => p.playerPos);
    const rbEarly = pos4.filter(p => p === 'RB').length;
    const wrEarly = pos4.filter(p => p === 'WR').length;
    // Reward clear early-round strategy commitment
    let cohScore = 50;
    if (rbEarly >= 3) cohScore = 85; // hero RB
    else if (wrEarly >= 3) cohScore = 80; // zero RB
    else if (rbEarly >= 2 && wrEarly >= 1) cohScore = 75; // balanced
    else if (wrEarly >= 2 && rbEarly >= 1) cohScore = 72;
    else cohScore = 55; // no clear strategy

    // ── Overall score & letter grade ─────────────────────────────────────────────
    const weights = { bal: 0.25, val: 0.25, dep: 0.20, scar: 0.15, coh: 0.15 };
    const overall = Math.round(
      balScore  * weights.bal +
      valScore  * weights.val +
      depScore  * weights.dep +
      scarScore * weights.scar +
      cohScore  * weights.coh
    );

    function toGrade(n) {
      if (n >= 93) return 'A+';
      if (n >= 87) return 'A';
      if (n >= 83) return 'A-';
      if (n >= 80) return 'B+';
      if (n >= 75) return 'B';
      if (n >= 70) return 'B-';
      if (n >= 65) return 'C+';
      if (n >= 60) return 'C';
      if (n >= 55) return 'C-';
      if (n >= 50) return 'D+';
      if (n >= 45) return 'D';
      return 'F';
    }

    // ── Positional grades ─────────────────────────────────────────────────────────
    const myRBs  = myPicks.filter(p => p.playerPos==='RB').sort((a,b) => a.playerRank - b.playerRank);
    const myWRs  = myPicks.filter(p => p.playerPos==='WR').sort((a,b) => a.playerRank - b.playerRank);
    const myQBs  = myPicks.filter(p => p.playerPos==='QB').sort((a,b) => a.playerRank - b.playerRank);
    const myTEs  = myPicks.filter(p => p.playerPos==='TE').sort((a,b) => a.playerRank - b.playerRank);
    const myBench = slots.filter(s => s.label==='BN' && s.filled).map(s => s.filled);

    function posGrade(score) { return toGrade(Math.round(score)); }

    // QB: starter quality + backup presence + backup quality
    const qbStarter = myQBs[0] ? myQBs[0].playerRank : 999;
    const qbBackup  = myQBs[1] ? myQBs[1].playerRank : 999;
    const qbStartScore = qbStarter <= 10 ? 95 : qbStarter <= 20 ? 82 : qbStarter <= 40 ? 68 : qbStarter <= 70 ? 54 : 35;
    const qbBackScore  = qbBackup <= 999 ? (qbBackup <= 60 ? 15 : 10) : 0;
    const qbPosScore   = Math.min(100, qbStartScore + qbBackScore);
    const qbFactors = [
      { label: 'Starter Tier', val: Math.round(qbStartScore / 95 * 100) },
      { label: 'Has Backup',   val: myQBs.length >= 2 ? 100 : 0 },
      { label: 'Backup Value', val: qbBackup <= 999 ? Math.min(100, Math.round(100 - (qbBackup-40)*1.5)) : 0 },
    ];

    // RB: RB1 quality + RB2 quality + depth count
    const rb1 = myRBs[0] ? myRBs[0].playerRank : 999;
    const rb2 = myRBs[1] ? myRBs[1].playerRank : 999;
    const rbCountBonus = Math.min(15, (myRBs.length - 2) * 5);
    const rb1Score = rb1 <= 10 ? 95 : rb1 <= 20 ? 83 : rb1 <= 40 ? 68 : rb1 <= 70 ? 50 : rb1 <= 999 ? 32 : 0;
    const rb2Score = rb2 <= 30 ? 90 : rb2 <= 60 ? 72 : rb2 <= 100 ? 54 : rb2 <= 999 ? 35 : 0;
    const rbPosScore = Math.min(100, rb1Score * 0.55 + rb2Score * 0.35 + rbCountBonus);
    const rbFactors = [
      { label: 'RB1 Tier',   val: Math.round(rb1Score) },
      { label: 'RB2 Tier',   val: myRBs.length >= 2 ? Math.round(rb2Score) : 0 },
      { label: 'Depth Count',val: Math.min(100, myRBs.length * 20) },
    ];

    // WR: WR1 quality + WR2 quality + corps depth
    const wr1 = myWRs[0] ? myWRs[0].playerRank : 999;
    const wr2 = myWRs[1] ? myWRs[1].playerRank : 999;
    const wrCountBonus = Math.min(15, (myWRs.length - 2) * 5);
    const wr1Score = wr1 <= 8  ? 95 : wr1 <= 20 ? 82 : wr1 <= 40 ? 67 : wr1 <= 70 ? 50 : wr1 <= 999 ? 30 : 0;
    const wr2Score = wr2 <= 25 ? 90 : wr2 <= 50 ? 72 : wr2 <= 90 ? 54 : wr2 <= 999 ? 35 : 0;
    const wrPosScore = Math.min(100, wr1Score * 0.50 + wr2Score * 0.35 + wrCountBonus);
    const wrFactors = [
      { label: 'WR1 Tier',   val: Math.round(wr1Score) },
      { label: 'WR2 Tier',   val: myWRs.length >= 2 ? Math.round(wr2Score) : 0 },
      { label: 'Depth Count',val: Math.min(100, myWRs.length * 20) },
    ];

    // TE: starter tier (scarcity makes elite TE very valuable) + backup
    const te1 = myTEs[0] ? myTEs[0].playerRank : 999;
    const te2 = myTEs[1] ? myTEs[1].playerRank : 999;
    const teStartScore = te1 <= 8  ? 100 : te1 <= 15 ? 88 : te1 <= 30 ? 70 : te1 <= 60 ? 52 : te1 <= 999 ? 34 : 0;
    const teBackScore  = te2 <= 999 ? 10 : 0;
    const tePosScore   = Math.min(100, teStartScore + teBackScore);
    const teFactors = [
      { label: 'Starter Tier', val: Math.round(teStartScore) },
      { label: 'Scarcity Edge', val: te1 <= 15 ? 100 : te1 <= 30 ? 60 : 25 },
      { label: 'Has Backup',   val: myTEs.length >= 2 ? 100 : 0 },
    ];

    // BENCH: avg rank of bench players + filled slots + positional variety
    const avgBR = myBench.length ? myBench.reduce((s,p) => s + p.playerRank, 0) / myBench.length : 200;
    const benchFilledPct = (myBench.length / 7) * 100;
    const benchAvgScore  = Math.min(100, Math.max(0, Math.round(100 - Math.max(0, avgBR - 60) * (100/140))));
    const benchPosScore  = Math.round(benchAvgScore * 0.6 + benchFilledPct * 0.4);
    const benchFactors = [
      { label: 'Avg Player Tier', val: benchAvgScore },
      { label: 'Slots Filled',    val: Math.round(benchFilledPct) },
      { label: 'Pos Variety',     val: Math.min(100, new Set(myBench.map(p=>p.playerPos)).size * 20) },
    ];

    const posGrades = {
      QB:    { score: Math.round(qbPosScore),    grade: posGrade(qbPosScore),    factors: qbFactors },
      RB:    { score: Math.round(rbPosScore),    grade: posGrade(rbPosScore),    factors: rbFactors },
      WR:    { score: Math.round(wrPosScore),    grade: posGrade(wrPosScore),    factors: wrFactors },
      TE:    { score: Math.round(tePosScore),    grade: posGrade(tePosScore),    factors: teFactors },
      BENCH: { score: Math.round(benchPosScore), grade: posGrade(benchPosScore), factors: benchFactors },
    };

    // ── Narrative blurb ──────────────────────────────────────────────────────────
    function _blurb(bal, val, dep, scar, coh, overall, grade, picks) {
      const pos4      = picks.slice(0, 4).map(p => p.playerPos);
      const pos6      = picks.slice(0, 6).map(p => p.playerPos);
      const rbEarly   = pos4.filter(p => p==='RB').length;
      const wrEarly   = pos4.filter(p => p==='WR').length;
      const hasEliteRB = picks.some(p => p.playerPos==='RB' && p.playerRank<=12);
      const hasEliteWR = picks.some(p => p.playerPos==='WR' && p.playerRank<=10);
      const hasEliteTE = picks.some(p => p.playerPos==='TE' && p.playerRank<=10);
      const hasLateQB  = picks.find(p => p.playerPos==='QB' && picks.indexOf(p) > 8);
      const hasEarlyQB = picks.find(p => p.playerPos==='QB' && picks.indexOf(p) <= 4);
      const earlyKDST  = picks.slice(0, Math.floor(picks.length * 0.5)).some(p => p.playerPos==='K'||p.playerPos==='DST');
      const rbCount    = picks.filter(p => p.playerPos==='RB').length;
      const wrCount    = picks.filter(p => p.playerPos==='WR').length;

      // A tier
      if (grade === 'A+') {
        if (hasEliteRB && rbEarly >= 2) return "Back-to-back RBs to open and never looked back. The room felt that.";
        if (hasEliteTE) return "Locked up a top TE and turned positional scarcity into a weekly weapon. Clanker bows.";
        if (hasEliteWR && wrEarly >= 2) return "A receiver room that other managers will nightmare about. Surgical.";
        if (val >= 85) return "Took value at every single turn. No ego picks, no panic — just clean draft execution.";
        return "A masterclass. Clanker has reviewed the tape and has no notes.";
      }
      if (grade === 'A') {
        if (hasEliteRB) return "Built around a stud RB and filled every hole around it. Hard to beat this floor.";
        if (hasEarlyQB) return "Went QB early and stacked the offense around it. High ceiling, high upside.";
        if (dep >= 80) return "Starters are strong and the bench can absorb injuries. Dangerous deep into the season.";
        return "Excellent draft. The kind of roster that wins in October when it matters.";
      }
      if (grade === 'A-') {
        if (rbEarly >= 3) return "Heavy RB investment paid off. The Flex is covered six different ways.";
        if (wrCount >= 5) return "WR-heavy but the talent is there. Survive the injury bug and this is a contender.";
        return "A really solid haul. A couple of reaches didn't derail the overall vision.";
      }
      // B tier
      if (grade === 'B+') {
        if (val < 55) return "Reached in a few spots but the roster has too much talent to ignore. Flawed but formidable.";
        if (scar >= 75) return "Made the right calls at scarce positions under pressure. That's how you separate from the field.";
        return "A strong draft. Not perfect, but the kind of roster managers underestimate.";
      }
      if (grade === 'B') {
        if (dep < 50) return "Starters look good on paper. Just pray nobody goes on IR because the depth is shaky.";
        if (bal < 70) return "Some starter gaps could hurt — but there's enough upside here to paper over the cracks.";
        return "Solid. Won't blow anyone away on draft day but will be competitive week to week.";
      }
      if (grade === 'B-') {
        if (earlyKDST) return "The early K or DST pick stings, but the rest of the roster is serviceable.";
        return "There's a real team buried in here. A few late-add pickups and this could be dangerous.";
      }
      // C tier
      if (grade === 'C+') {
        if (rbCount <= 2) return "Too many WRs chasing the same targets, not enough RB insurance. Thin in the backfield.";
        if (wrCount <= 2) return "The WR corps is going to be a weekly problem. Add early and often on the wire.";
        return "Average. Will need the waiver wire to work overtime to make the playoffs.";
      }
      if (grade === 'C') {
        if (bal < 65) return "Starter slots sitting empty after 16 rounds. That's not a strategy, that's a mistake.";
        if (val < 40) return "Reached early, reached late, reached in the middle. The rankings exist for a reason.";
        return "Clanker has concerns. Multiple concerns. Overlapping concerns.";
      }
      if (grade === 'C-') {
        if (hasLateQB && !hasEliteTE) return "Waited too long on QB *and* TE. Both spots are a problem. Good luck with that.";
        return "There are two or three good picks in here. The other thirteen are a mystery.";
      }
      // D/F tier
      if (grade === 'D+') return "Clanker tried to find something positive to say. Clanker is still looking.";
      if (grade === 'D')  return "This roster has the energy of a group project where nobody showed up.";
      return "A historic collapse across all sixteen rounds. Clanker needs a moment.";
    }

    const narrative = _blurb(balScore, valScore, depScore, scarScore, cohScore, overall, toGrade(overall), myPicks);

    return {
      overall, grade: toGrade(overall),
      cats: {
        'Positional Balance': balScore,
        'Value':              valScore,
        'Bench Depth':        depScore,
        'Scarcity Awareness': scarScore,
        'Strategy Coherence': cohScore,
      },
      posGrades,
      narrative,
      picks: myPicks,
    };
  }

  function _renderVerdict(data, lobbyId) {
    const container = _panel();
    if (!container) return;
    clearInterval(_timerInterval); _timerInterval = null;
    clearTimeout(_botTimeout);     _botTimeout    = null;
    window._draftQueue    = [];
    window._ffdbBoardView = 'round';
    _bbLastSnapRound      = -1;

    const { draftOrder = [], participants = {}, settings = {} } = data;
    const leagueSize  = settings.leagueSize || 10;
    const teamOrder   = draftOrder.slice(0, leagueSize);

    // Grade every team
    const grades = teamOrder.map(uid => ({
      uid,
      name: (participants[uid] || {}).name || '?',
      isBot: !!(participants[uid] || {}).isBot,
      isMe: uid === _myUid,
      ..._gradeTeam(uid, data),
    })).filter(g => g.overall !== undefined);

    grades.sort((a, b) => b.overall - a.overall);
    const winner = grades[0];

    function gradeColor(g) {
      if (g.startsWith('A')) return '#4caf50';
      if (g.startsWith('B')) return '#8bc34a';
      if (g.startsWith('C')) return '#ffb300';
      if (g.startsWith('D')) return '#ff7043';
      return '#e53935';
    }

    const catKeys = Object.keys((grades[0] || {}).cats || {});

    const teamCards = grades.map((g, i) => {
      const crown  = i === 0 ? '<span class="ffcv-crown">👑</span>' : '';
      const youTag = g.isMe ? '<span class="ffcv-you-tag">YOU</span>' : '';
      const gColor = gradeColor(g.grade);

      // Left: category bars
      const catBars = catKeys.map(k => {
        const score = g.cats[k];
        const col   = score >= 75 ? '#4caf50' : score >= 55 ? '#ffb300' : '#e53935';
        return `<div class="ffcv-cat-row">
          <span class="ffcv-cat-label">${k}</span>
          <div class="ffcv-cat-bar-bg"><div class="ffcv-cat-bar" style="width:${score}%;background:${col}"></div></div>
          <span class="ffcv-cat-score">${score}</span>
        </div>`;
      }).join('');

      // Middle: full roster by slot
      const rosterSlots = _buildRoster(g.picks, g.uid).map(s => {
        const pc = s.filled ? _posColor(s.filled.playerPos) : '';
        return `<div class="ffcv-slot">
          <span class="ffcv-slot-label">${s.label}</span>
          ${s.filled
            ? `<span class="ffcv-slot-pos" style="background:${pc}">${s.filled.playerPos}</span>
               <span class="ffcv-slot-name">${s.filled.playerName}</span>`
            : `<span class="ffcv-slot-empty">—</span>`}
        </div>`;
      }).join('');

      // Right: positional grades
      const posOrder = ['QB','RB','WR','TE','BENCH'];
      const posGradeRows = posOrder.map(pos => {
        const pg = (g.posGrades || {})[pos];
        if (!pg) return '';
        const gc = gradeColor(pg.grade);
        const factorBars = pg.factors.map(f => {
          const fc = f.val >= 75 ? '#4caf50' : f.val >= 50 ? '#ffb300' : '#e53935';
          return `<div class="ffcv-pos-factor">
            <span class="ffcv-pos-flabel">${f.label}</span>
            <div class="ffcv-cat-bar-bg ffcv-pos-bar-bg"><div class="ffcv-cat-bar" style="width:${f.val}%;background:${fc}"></div></div>
          </div>`;
        }).join('');
        return `<div class="ffcv-pos-block">
          <div class="ffcv-pos-header">
            <span class="ffcv-pos-name">${pos}</span>
            <span class="ffcv-pos-grade" style="color:${gc}">${pg.grade}</span>
          </div>
          <div class="ffcv-pos-factors">${factorBars}</div>
        </div>`;
      }).join('');

      return `<div class="ffcv-card${g.isMe?' ffcv-card-me':''}">
        <div class="ffcv-card-top">
          <div class="ffcv-rank">#${i+1}</div>
          <div class="ffcv-name">${crown}${g.name}${youTag}</div>
          <div class="ffcv-grade" style="color:${gColor}">${g.grade}</div>
        </div>
        <div class="ffcv-narrative">${g.narrative}</div>
        <div class="ffcv-body">
          <div class="ffcv-col-left">
            <div class="ffcv-col-title">RATINGS</div>
            <div class="ffcv-cats">${catBars}</div>
          </div>
          <div class="ffcv-col-mid">
            <div class="ffcv-col-title">ROSTER</div>
            <div class="ffcv-roster">${rosterSlots}</div>
          </div>
          <div class="ffcv-col-right">
            <div class="ffcv-col-title">POSITION GRADES</div>
            ${posGradeRows}
          </div>
        </div>
      </div>`;
    }).join('');

    container.innerHTML = `
      <div class="ffcv-wrap">
        <div class="ffcv-header">
          <div class="ffcv-title">⚖️ Clanker's Verdict</div>
          <div class="ffcv-subtitle">Winner: <strong>${winner.name}</strong> with a <strong style="color:${gradeColor(winner.grade)}">${winner.grade}</strong></div>
        </div>
        <div class="ffcv-cards">${teamCards}</div>
        <button class="ffcv-new-btn" onclick="renderDraftLobbyTab()">New Draft</button>
      </div>`;
  }

})();
