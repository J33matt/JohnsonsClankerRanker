// ── FF Draft Lobby — Phase 1: Lobby & Identity ──────────────────────────────

(function () {
  'use strict';

  let _lobbyId   = null;
  let _myUid     = null;
  let _myName    = null;
  let _isGuest   = false;
  let _unsubLobby  = null;
  let _unsubChat   = null;
  let _chatMessages = [];
  let _wasInLobby   = false;
  let _poolScrollTop = 0;
  let _chatUnread    = 0;
  let _chatLastCount = 0;
  let _lastDraftData = null;
  let _timerInterval = null;
  let _botTimeout    = null;
  let _bbLastSnapRound = -1;
  let _verdictShown  = false;
  window._draftQueue    = [];
  window._ffdbBoardView = 'round'; // 'round' | 'roster'

  function _db() { return firebase.firestore(); }
  function _panel() { return document.getElementById('nfl-ff-draft'); }

  const _BOT_ADJ = ['Stoic','Erratic','Bold','Cynical','Pragmatic','Wild','Zen','Grumpy','Salty','Hasty','Calculated','Eccentric','Nervous','Aloof','Jovial','Pensive','Chrome','Neon','Static','Digital','Ancient','Vintage','Shiny','Rusty','Lucid','Fractal','Hidden','Radiant','Hollow','Primal','Infinite','Velvet','Scholar','Apprentice','Master','Senior','Junior','Expert','Novice','Rogue','Elite','Stealthy','Prime','Alpha','Omega','Kinetic','Tidal','Bitter','Crimson','Gloom','Sudden','Brisk','Mellow','Vague','Formal','Drastic','Candid','Nimble','Vexed','Heavy'];
  const _BOT_NOUN = ['Jack','Bo','Zeke','Mack','Duke','Beau','Colt','Knox','Dash','Wyatt','Finn','Silas','Jude','Rhett','Arlo','Milo','Badger','Owl','Fox','Penguin','Mammoth','Gecko','Raven','Beetle','Newt','Lynx','Sloth','Gear','Circuit','Paradox','Vector','Prism','Ledger','Anchor','Signal','Pulse','Ember','Catalyst','Cipher','Echo','Horizon','Architect','Mastermind','Tactician','Coordinator','Strategist','Analyst','Director','Governor','Overseer','Consultant','Administrator','Engineer','Shotcaller','Skipper','Captain','Chief','Boss','Principal','Warden','Sentinel','Monitor','Harbinger','Sovereign','Steward','Chancellor','Dean','Enthusiast','Hobbyist','Lurker','Specialist','Curator','Collector','Hoarder','Visionary','Prophet','Nomad','Voyager','Pilot','Scribe','Merchant','Guard','Scout','Ranger','Smith','Weaver','Baker','Clerk','Judge','Monk','Knight','Baron','Duke','Beer','Drinker','Bob','Rizzler','Goat'];
  function _botRandomName(usedNames) {
    const pick = arr => arr[Math.floor(Math.random() * arr.length)];
    let name, attempts = 0;
    do { name = pick(_BOT_ADJ) + ' ' + pick(_BOT_NOUN); } while (usedNames.has(name) && ++attempts < 50);
    usedNames.add(name);
    return name;
  }

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
    // Tear down any existing session so chat/subscriptions don't bleed across lobbies
    if (_unsubLobby) { _unsubLobby(); _unsubLobby = null; }
    if (_unsubChat)  { _unsubChat();  _unsubChat  = null; _chatMessages = []; }
    _unmountChatWidget();
    _wasInLobby    = false;
    _poolScrollTop = 0;
    _chatUnread    = 0;
    _chatLastCount = 0;
    _verdictShown  = false;
    container.innerHTML = `<div class="ffd-loading">Connecting to lobby…</div>`;

    try {
      const identity = await _draftGetIdentity();
      if (!identity) return;
      _myUid   = identity.uid;
      window._myUid = identity.uid;
      _myName  = identity.name;
      _isGuest = identity.isGuest;

      _lobbyId = await _draftGetOrCreateLobby();
      window.location.hash = '#lobby=' + _lobbyId;
      await _draftJoinLobby(_lobbyId);
      _draftSubscribe(_lobbyId);
      _draftSubscribeChat(_lobbyId);

      // Kick off roster/ID map load so headshots appear in the player pool.
      // buildPlayerTeamMap caches its promise, so this is free on repeat calls.
      // Once resolved, re-subscribe to force one re-render with IDs populated.
      if (typeof buildPlayerTeamMap === 'function' && Object.keys(window._playerIdMap || {}).length === 0) {
        const _snapLobbyId = _lobbyId;
        buildPlayerTeamMap().then(() => {
          if (_lobbyId === _snapLobbyId && _unsubLobby) _draftSubscribe(_lobbyId);
        }).catch(() => {});
      }
    } catch (e) {
      console.error('[Draft] lobby error:', e);
      const c = _panel();
      if (c) c.innerHTML = `<div class="ffd-loading" style="color:#ff6b6b">Failed to connect. Please try again.</div>`;
    }
  };

  // ── Identity ────────────────────────────────────────────────────────────────
  async function _draftGetIdentity() {
    // Wait for Firebase to restore a prior session before reading UID.
    // Without this, a hard refresh (Ctrl+Shift+R) clears JS state and getUid()
    // returns null before onAuthStateChanged has fired, triggering a spurious login.
    if (typeof _jcrAuth !== 'undefined' && _jcrAuth.waitForRestore) {
      await _jcrAuth.waitForRestore();
    }
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
    // Check for invite link hash: #lobby=LOBBYID
    const hashMatch = window.location.hash.match(/^#lobby=(.+)$/);
    if (hashMatch) {
      const inviteId = hashMatch[1];
      const doc = await _db().collection('ff_draft_lobbies').doc(inviteId).get();
      if (doc.exists && doc.data().status === 'waiting') return inviteId;
      // Lobby gone or already started — fall through to normal logic
    }

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
        // Detect kick: we were in the lobby before but are no longer a participant
        if (_wasInLobby && data.status === 'waiting' && _myUid && !(data.participants || {})[_myUid]) {
          if (_unsubLobby) { _unsubLobby(); _unsubLobby = null; }
          if (_unsubChat)  { _unsubChat();  _unsubChat  = null; _chatMessages = []; }
          _wasInLobby = false;
          const c = _panel();
          if (c) c.innerHTML = `<div class="ffd-kicked-screen">
            <div class="ffd-kicked-icon">🚫</div>
            <div class="ffd-kicked-msg">You were removed from the lobby.</div>
            <button class="ffd-start-btn" onclick="renderDraftLobbyTab()">Find New Lobby</button>
          </div>`;
          return;
        }
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
    if (participants[_myUid]) _wasInLobby = true;
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
              ${isHost && !isH && !p.isBot ? `<button class="ffd-kick-btn" onclick="_draftKick('${lobbyId}','${claimedUid}')">Kick</button>` : ''}
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
          <div style="display:flex;gap:6px;align-items:center">
            ${isHost && !isH ? `<button class="ffd-give-host-btn" onclick="_draftGiveHost('${lobbyId}','${uid}')">Give Host</button>` : ''}
            ${isHost && !isH && !p.isBot ? `<button class="ffd-kick-btn" onclick="_draftKick('${lobbyId}','${uid}')">Kick</button>` : ''}
          </div>
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
          <button class="ffd-invite-btn" onclick="_draftCopyInvite('${lobbyId}', this)">🔗 Copy Invite Link</button>
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
    _mountChatWidget(lobbyId);
  }

  // ── Invite link ──────────────────────────────────────────────────────────────
  window._draftCopyInvite = function (lobbyId, btn) {
    const url = window.location.origin + window.location.pathname + '#lobby=' + lobbyId;
    navigator.clipboard.writeText(url).then(() => {
      const orig = btn.textContent;
      btn.textContent = '✓ Copied!';
      setTimeout(() => { btn.textContent = orig; }, 2000);
    });
  };

  // ── Pick reactions ───────────────────────────────────────────────────────────
  window._draftReact = async function (lobbyId, pickIndex, emoji) {
    const key = 'reactions.' + pickIndex + '.' + emoji;
    await _db().collection('ff_draft_lobbies').doc(lobbyId)
      .update({ [key]: firebase.firestore.FieldValue.increment(1) });
  };

  // ── Live chat ────────────────────────────────────────────────────────────────
  function _draftSubscribeChat(lobbyId) {
    if (_unsubChat) { _unsubChat(); _unsubChat = null; _chatMessages = []; }
    // No orderBy — avoids requiring a Firestore composite index.
    // Sort client-side instead; handle null ts (server timestamp not yet set).
    _unsubChat = _db().collection('ff_draft_lobbies').doc(lobbyId)
      .collection('messages')
      .onSnapshot(snap => {
        _chatMessages = snap.docs
          .map(d => ({ id: d.id, ...d.data() }))
          .sort((a, b) => {
            const ta = a.ts?.toMillis ? a.ts.toMillis() : (a.ts || 0);
            const tb = b.ts?.toMillis ? b.ts.toMillis() : (b.ts || 0);
            return ta - tb;
          });
        _renderChatMessages();
      }, err => { console.warn('[Chat] snapshot error:', err); });
  }

  function _renderChatMessages() {
    const el = document.getElementById('ffdb-chat-msgs');
    if (!el) return;
    const atBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 40;
    el.innerHTML = _chatMessages.map(m => {
      const isMe = m.uid === _myUid;
      const safe = (m.text || '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
      return `<div class="ffdb-chat-msg${isMe ? ' ffdb-chat-me' : ''}">
        <span class="ffdb-chat-name">${(m.name||'?').replace(/</g,'&lt;')}</span>
        <span class="ffdb-chat-text">${safe}</span>
      </div>`;
    }).join('');
    const body  = document.getElementById('ffdb-chat-widget-body');
    const isOpen = body && body.style.display !== 'none';
    if (isOpen && atBottom) el.scrollTop = el.scrollHeight;
    // Unread badge while collapsed
    const newCount = _chatMessages.length;
    if (!isOpen && newCount > _chatLastCount) {
      _chatUnread += newCount - _chatLastCount;
      const badge = document.getElementById('ffdb-chat-badge');
      if (badge) { badge.textContent = _chatUnread; badge.style.display = ''; }
    }
    _chatLastCount = newCount;
  }

  window._draftSendChat = async function (lobbyId) {
    const inp = document.getElementById('ffdb-chat-input');
    if (!inp) return;
    const text = inp.value.trim();
    if (!text) return;
    inp.value = '';
    await _db().collection('ff_draft_lobbies').doc(lobbyId)
      .collection('messages').add({
        uid: _myUid, name: _myName || 'You', text,
        ts: firebase.firestore.FieldValue.serverTimestamp()
      });
  };

  // ── Floating chat widget ─────────────────────────────────────────────────────
  function _mountChatWidget(lobbyId) {
    if (document.getElementById('ffdb-chat-widget')) return; // already mounted
    const w = document.createElement('div');
    w.id = 'ffdb-chat-widget';
    w.className = 'ffdb-chat-widget collapsed';
    w.innerHTML = `
      <div class="ffdb-chat-widget-header" onclick="_toggleChatWidget()">
        <span class="ffdb-chat-widget-title">💬 Chat</span>
        <span class="ffdb-chat-badge" id="ffdb-chat-badge" style="display:none">0</span>
        <span class="ffdb-chat-widget-chevron" id="ffdb-chat-widget-chevron">▴</span>
      </div>
      <div class="ffdb-chat-widget-body" id="ffdb-chat-widget-body" style="display:none">
        <div class="ffdb-chat-msgs" id="ffdb-chat-msgs"></div>
        <div class="ffdb-chat-input-row">
          <input class="ffdb-chat-input" id="ffdb-chat-input" placeholder="Message…" maxlength="200"
                 onkeydown="if(event.key==='Enter')_draftSendChat('${lobbyId}')">
          <button class="ffdb-chat-send" onclick="_draftSendChat('${lobbyId}')">↑</button>
        </div>
      </div>`;
    document.body.appendChild(w);
    _renderChatMessages(); // populate with any messages already received
  }

  function _unmountChatWidget() {
    const w = document.getElementById('ffdb-chat-widget');
    if (w) w.remove();
    _chatUnread = 0;
    _chatLastCount = 0;
  }

  window._toggleChatWidget = function () {
    const body    = document.getElementById('ffdb-chat-widget-body');
    const chevron = document.getElementById('ffdb-chat-widget-chevron');
    const widget  = document.getElementById('ffdb-chat-widget');
    const badge   = document.getElementById('ffdb-chat-badge');
    if (!body) return;
    const opening = body.style.display === 'none';
    body.style.display = opening ? '' : 'none';
    if (chevron) chevron.textContent = opening ? '▾' : '▴';
    if (widget)  widget.classList.toggle('collapsed', !opening);
    if (opening) {
      _chatUnread = 0;
      _chatLastCount = _chatMessages.length;
      if (badge) badge.style.display = 'none';
      const msgs = document.getElementById('ffdb-chat-msgs');
      if (msgs) msgs.scrollTop = msgs.scrollHeight;
    }
  };

  // ── Host actions (global so inline onclick can reach them) ──────────────────
  window._draftGiveHost = async function (lobbyId, newHostId) {
    await _db().collection('ff_draft_lobbies').doc(lobbyId).update({ hostId: newHostId });
  };

  window._draftKick = async function (lobbyId, uid) {
    const update = {
      ['participants.' + uid]: firebase.firestore.FieldValue.delete(),
      ['slotPreferences.' + uid]: firebase.firestore.FieldValue.delete(),
    };
    await _db().collection('ff_draft_lobbies').doc(lobbyId).update(update);
  };

  window._draftSetSetting = async function (lobbyId, key, val) {
    const update = { ['settings.' + key]: val };

    if (key === 'randomizeOrder') {
      if (val === false) {
        // Switching to Manual: auto-assign all current participants to slots in join order
        const doc  = await _db().collection('ff_draft_lobbies').doc(lobbyId).get();
        const data = doc.data();
        const participants = data.participants || {};
        const leagueSize   = data.settings?.leagueSize || 10;
        const prefs = {};
        Object.entries(participants)
          .sort((a, b) => (a[1].joinedAt || 0) - (b[1].joinedAt || 0))
          .forEach(([uid], i) => { if (i < leagueSize) prefs[uid] = i; });
        update.slotPreferences = prefs;
      } else {
        // Switching back to Random: clear manual slot assignments
        update.slotPreferences = {};
      }
    }

    await _db().collection('ff_draft_lobbies').doc(lobbyId).update(update);
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
    const _usedBotNames = new Set(Object.values(participants).map(p => p.name));
    while (humanUids.length < leagueSize) {
      const botUid = 'bot_' + Math.random().toString(36).slice(2, 10);
      participants[botUid] = {
        name: _botRandomName(_usedBotNames),
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
    if (_unsubChat)  { _unsubChat();  _unsubChat  = null; _chatMessages = []; }
    _unmountChatWidget();
    _wasInLobby    = false;
    _poolScrollTop = 0;
    _verdictShown  = false;
    if (window.location.hash.startsWith('#lobby=')) history.replaceState(null, '', window.location.pathname + window.location.search);

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
    window._lastDraftData = data;

    const { draftOrder = [], currentPickIndex = 0, picks = [],
            draftedRanks = [], participants = {}, settings = {}, timerEndsAt,
            reactions = {}, hostId } = data;
    const isHost = hostId === _myUid;
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

    // Capture scroll from the live element before innerHTML wipes it.
    // _poolScrollTop is also kept up-to-date by the onscroll handler below,
    // so even if onSnapshot fires twice (optimistic + server-confirm) the
    // second render still restores the correct user-intended position.
    const poolOld = document.getElementById('ffdb-pool-list');
    if (poolOld) _poolScrollTop = poolOld.scrollTop;

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
      const _pTeam  = p.team || _teamOf(p.name);
      const _pBye   = (typeof BYE_WEEKS !== 'undefined' && _pTeam) ? BYE_WEEKS[_pTeam] : null;
      // Headshot / team logo for thumbnail
      const _pLogoUrl = _pTeam
        ? `https://a.espncdn.com/i/teamlogos/nfl/500/${_pTeam.toLowerCase()}.png`
        : (p.pos !== 'DST' ? 'https://a.espncdn.com/i/teamlogos/leagues/500/nfl.png' : '');
      let _pHeadshotUrl = '';
      if (p.pos !== 'DST') {
        const _pKey = (p.name||'').toLowerCase().replace(/[.'''`]/g,'').replace(/\s+/g,' ').trim();
        const _pKeyStripped = _pKey.replace(/\s+(jr|sr|ii|iii|iv)$/i,'').trim();
        const idMap = window._playerIdMap;
        // Prefer team-qualified key to resolve name collisions (e.g. two players named Justin Jefferson)
        const _pAthId = idMap && (
          (_pTeam && (idMap[_pKey + '|' + _pTeam.toLowerCase()] || idMap[_pKeyStripped + '|' + _pTeam.toLowerCase()])) ||
          idMap[_pKey] || idMap[_pKeyStripped]
        );
        if (_pAthId) _pHeadshotUrl = 'https://a.espncdn.com/i/headshots/nfl/players/full/' + _pAthId + '.png';
      }
      const _pThumbHTML = `<div class="ffdb-p-thumb">
        ${_pLogoUrl ? `<img class="ffdb-p-thumb-logo" src="${_pLogoUrl}" onerror="this.style.display='none'" alt="">` : ''}
        ${_pHeadshotUrl ? `<img class="ffdb-p-thumb-head" src="${_pHeadshotUrl}" onerror="this.style.display='none';var l=this.parentNode.querySelector('.ffdb-p-thumb-logo');if(l)l.style.opacity='0.65';" alt="">` : ''}
      </div>`;
      const _posRowColor = _posColor(p.pos);
      poolRows.push(`<div class="ffdb-player-row${inQueue?' ffdb-in-queue':''}" style="background:${_posRowColor}0f;border-left:2px solid ${_posRowColor}55">
        <span class="ffdb-p-rank">${p.rank}</span>
        <span class="ffdb-pos-badge" style="background:${_posColor(p.pos)}">${p.pos}</span>
        <span class="ffdb-p-name">${p.name}</span>
        <span class="ffdb-p-team">${_pTeam}</span>
        ${_pBye ? `<span class="ffdb-p-bye">BYE ${_pBye}</span>` : '<span class="ffdb-p-bye"></span>'}
        ${_pThumbHTML}
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
      const pickReacts = ['🔥','💀','😂'].map(e => {
        const cnt = ((reactions[p.pickIndex]||{})[e]) || 0;
        return `<button class="ffdb-react-btn" onclick="_draftReact('${lobbyId}',${p.pickIndex},'${e}')">${e}${cnt>0?`<span class="ffdb-react-cnt">${cnt}</span>`:''}</button>`;
      }).join('');
      return `<div class="ffdb-recent-row">
        <span class="ffdb-recent-meta">R${r}.${pk}</span>
        <span class="ffdb-pos-badge ffdb-pos-sm" style="background:${_posColor(p.playerPos)}">${p.playerPos}</span>
        <span class="ffdb-recent-name">${p.playerName}</span>
        <span class="ffdb-recent-picker">${(participants[p.uid]||{}).name||'?'}</span>
        <div class="ffdb-react-row">${pickReacts}</div>
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
          ${isHost ? (() => {
            const cur = settings.botSpeed || 'normal';
            const speeds = [['vfast','⚡⚡'],['fast','⚡'],['normal','—'],['slow','🐢'],['vslow','🐢🐢']];
            return `<div class="ffdb-speed-ctrl">
              <span class="ffdb-speed-label">Bot speed</span>
              ${speeds.map(([spd, lbl]) =>
                `<button class="ffdb-speed-btn${cur===spd?' active':''}" onclick="_draftSetSetting('${lobbyId}','botSpeed','${spd}')" title="${spd}">${lbl}</button>`
              ).join('')}
            </div>`;
          })() : ''}
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

    // Restore pool scroll and wire up the persistent scroll tracker.
    // Double-rAF ensures CSS max-height is applied before we set scrollTop.
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        const poolNew = document.getElementById('ffdb-pool-list');
        if (!poolNew) return;
        poolNew.scrollTop = _poolScrollTop;
        poolNew.onscroll = () => { _poolScrollTop = poolNew.scrollTop; };
      });
    });

    // Auto-scroll big board: snap position updates only on new round,
    // but scrollTop is always restored since DOM is replaced each render
    const bbNew = document.getElementById('ffdb-bb-scroll');
    if (bbNew && boardView === 'round') {
      const curRound0 = Math.floor(currentPickIndex / leagueSize);
      if (curRound0 !== _bbLastSnapRound) _bbLastSnapRound = curRound0;
      bbNew.scrollTop = Math.max(0, _bbLastSnapRound) * 56;
    }

    _startTimer(timerEndsAt, timerSecs, lobbyId);
    _mountChatWidget(lobbyId);
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
      const team = player.team || (window._playerTeamMap && (window._playerTeamMap[k] ||
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
              if (p.pos==='RB')                      s *= 0.3;  // was 0.15
              if (p.pos==='WR'||p.pos==='TE')        s *= 1.25; // was 1.5
              if (p.pos==='QB' && qb===0)            s *= 1.3;
            } else {
              if (p.pos==='RB') s *= 1.6;
            }
          } else {
            if (p.pos==='RB' && rb>=2) s *= 0.55; // was 0.35
          }
          // Flex tolerance: allow up to 7 RBs/WRs for this build
          if (p.pos==='RB' && rb>=5 && rb<7) s *= 2.0; // undo soft cap partially
          break;
        }

        case 'zero-rb': {
          if (round <= 5) {
            if (p.pos==='RB')                       s *= 0.12; // avoids RB early but not completely
            if (p.pos==='WR' && wr < 3)             s *= 1.2;
            if (p.pos==='QB' && qb===0)             s *= 1.3;
            if (p.pos==='TE' && te===0)             s *= 1.3;
          } else if (round <= 8) {
            if (p.pos==='RB')                       s *= 0.35; // softens avoidance mid-draft
          } else {
            if (p.pos==='RB')                       s *= 2.2;
          }
          break;
        }

        case 'robust-rb':
          if (rb < 3 && round <= 6) {
            if (p.pos==='RB')               s *= 2.4;
          } else if (rb >= 3) {
            if (p.pos==='RB')               s *= 0.4;
            if (p.pos==='WR')               s *= 1.3; // was 2.1 — too aggressive pivot
            if (p.pos==='TE' && te===0)     s *= 1.6;
          }
          break;

        case 'late-qbte':
          // Trigger urgency at round 8 (earlier than the universal round-9 fallback)
          if (round <= 6) {
            if (p.pos==='QB')               s *= 0.04;
            if (p.pos==='TE')               s *= 0.08;
            // no WR/RB preference — let BPA decide skill position
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

    // ── Positional scores (hoisted — used by Category 1 and the grade cards) ─────
    const slots   = _buildRoster(myPicks, uid);
    const myRBs   = myPicks.filter(p => p.playerPos==='RB').sort((a,b) => a.playerRank - b.playerRank);
    const myWRs   = myPicks.filter(p => p.playerPos==='WR').sort((a,b) => a.playerRank - b.playerRank);
    const myQBs   = myPicks.filter(p => p.playerPos==='QB').sort((a,b) => a.playerRank - b.playerRank);
    const myTEs   = myPicks.filter(p => p.playerPos==='TE').sort((a,b) => a.playerRank - b.playerRank);
    const myBench = slots.filter(s => s.label==='BN' && s.filled).map(s => s.filled);

    const qbStarter    = myQBs[0] ? myQBs[0].playerRank : 999;
    const qbBackup     = myQBs[1] ? myQBs[1].playerRank : 999;
    const qbPosRankNum = myQBs[0] ? allRankings.filter(r => r.pos === 'QB' && r.rank <= qbStarter).length : 999;
    const qbStartScore = qbPosRankNum <= 1 ? 100 : qbPosRankNum <= 3 ? 85 : qbPosRankNum <= 6 ? 70 : qbPosRankNum <= 10 ? 52 : 32;
    const qbBackScore  = qbBackup < 999 ? (qbPosRankNum <= 6 ? 15 : 10) : 0;
    const qbPosScore   = Math.min(100, qbStartScore + qbBackScore);

    const rb1 = myRBs[0] ? myRBs[0].playerRank : 999;
    const rb2 = myRBs[1] ? myRBs[1].playerRank : 999;
    const rb1PosRankNum = myRBs[0] ? allRankings.filter(r => r.pos === 'RB' && r.rank <= rb1).length : 999;
    const rb2PosRankNum = myRBs[1] ? allRankings.filter(r => r.pos === 'RB' && r.rank <= rb2).length : 999;
    const rbCountBonus  = Math.min(15, (myRBs.length - 2) * 5);
    const rb1Score = rb1PosRankNum <= 1 ? 100 : rb1PosRankNum <= 4  ? 85 : rb1PosRankNum <= 8  ? 70 : rb1PosRankNum <= 15 ? 52 : 32;
    const rb2Score = rb2PosRankNum <= 5 ? 90  : rb2PosRankNum <= 10 ? 75 : rb2PosRankNum <= 20 ? 58 : rb2PosRankNum <= 999 ? 38 : 0;
    const rbPosScore = Math.min(100, rb1Score * 0.55 + rb2Score * 0.35 + rbCountBonus);

    const wr1 = myWRs[0] ? myWRs[0].playerRank : 999;
    const wr2 = myWRs[1] ? myWRs[1].playerRank : 999;
    const wr1PosRankNum = myWRs[0] ? allRankings.filter(r => r.pos === 'WR' && r.rank <= wr1).length : 999;
    const wr2PosRankNum = myWRs[1] ? allRankings.filter(r => r.pos === 'WR' && r.rank <= wr2).length : 999;
    const wrCountBonus  = Math.min(15, (myWRs.length - 2) * 5);
    const wr1Score = wr1PosRankNum <= 1 ? 100 : wr1PosRankNum <= 4  ? 85 : wr1PosRankNum <= 8  ? 70 : wr1PosRankNum <= 15 ? 52 : 32;
    const wr2Score = wr2PosRankNum <= 5 ? 90  : wr2PosRankNum <= 10 ? 75 : wr2PosRankNum <= 20 ? 58 : wr2PosRankNum <= 999 ? 38 : 0;
    const wrPosScore = Math.min(100, wr1Score * 0.50 + wr2Score * 0.35 + wrCountBonus);

    const te1 = myTEs[0] ? myTEs[0].playerRank : 999;
    const te2 = myTEs[1] ? myTEs[1].playerRank : 999;
    // Use positional rank (TE1, TE2…) so the score is league-size independent.
    // Absolute rank thresholds would inflate scores in shallow leagues where a
    // top-22 TE is easy to land vs. a 12-team draft where it costs a 2nd-round pick.
    const tePosRankNum   = myTEs[0] ? allRankings.filter(r => r.pos === 'TE' && r.rank <= te1).length : 999;
    const tePosRankScore = tePosRankNum <= 1 ? 100 : tePosRankNum <= 2 ? 80 : tePosRankNum <= 4 ? 60 : tePosRankNum <= 6 ? 42 : 22;
    const teStartScore   = tePosRankNum <= 1 ? 100 : tePosRankNum <= 2 ? 90 : tePosRankNum <= 4 ? 80 : tePosRankNum <= 6 ? 63 : tePosRankNum < 999 ? 42 : 0;
    const teBackScore    = te2 <= 999 ? 10 : 0;
    const tePosScore     = Math.min(100, teStartScore + teBackScore);

    // Bench thresholds scaled by league size.
    // Floor anchored at leagueSize×11 (≈ the realistic best-case bench avg rank —
    // bench picks start at pick ~91 in a 10-team draft, so the actual achievable
    // minimum average is ~105-110, not 90). At 10-team: floor=110, range=130,
    // bestFloors=[100,120,140,160] — A+ bench requires rank≤110 avg (elite sleeper
    // hunting), typical good bench ~125-135 lands B/B+.
    const _lsScale      = leagueSize / 10;
    const _benchFloor   = Math.round(110 * _lsScale);
    const _benchRange   = Math.round(130 * _lsScale);
    const _bf1          = Math.round(100 * _lsScale);
    const _bf2          = Math.round(120 * _lsScale);
    const _bf3          = Math.round(140 * _lsScale);
    const _bf4          = Math.round(165 * _lsScale);

    const avgBR         = myBench.length ? myBench.reduce((s,p) => s + p.playerRank, 0) / myBench.length : _bf4 * 2;
    const bestBenchRank = myBench.length ? Math.min(...myBench.map(p => p.playerRank)) : _bf4 * 2;
    const benchAvgScore  = Math.min(100, Math.max(0, Math.round(100 - Math.max(0, avgBR - _benchFloor) * (100 / _benchRange))));
    const bestAssetScore = bestBenchRank <= _bf1 ? 100 : bestBenchRank <= _bf2 ? 80 : bestBenchRank <= _bf3 ? 60 : bestBenchRank <= _bf4 ? 40 : 20;
    const benchPosScore  = Math.round(benchAvgScore * 0.5 + bestAssetScore * 0.3 + Math.min(100, new Set(myBench.map(p=>p.playerPos)).size * 25) * 0.2);

    // ── Zero RB detection (used in Cat 1 penalty and badges) ─────────────────────
    const _top4Pos = myPicks.slice(0, 4).map(p => p.playerPos);
    const isZeroRB = _top4Pos.filter(p => p === 'WR').length >= 3;

    // ── Category 1: Positional Strength ──────────────────────────────────────────
    // Weighted average of the 5 positional grades, with a penalty for any glaring
    // weakness. Weights: RB/WR 25% each (core positions), QB/TE 20% each, Bench 10%.
    // Penalty: −8 per position scoring below threshold, −16 if below 30 (broken).
    // Zero RB curve: if drafter went Zero RB (3+ WRs in top 4) and WR room is elite
    // (wrPosScore > 85), relax the RB penalty threshold from 45 → 35 — a deliberate
    // strategy shouldn't be punished the same as an accidental positional hole.
    const _posBase      = qbPosScore*0.20 + rbPosScore*0.25 + wrPosScore*0.25 + tePosScore*0.20 + benchPosScore*0.10;
    const _rbPenThresh  = (isZeroRB && wrPosScore > 85) ? 35 : 45;
    const _posPenalty   = [
      [qbPosScore, 45], [rbPosScore, _rbPenThresh], [wrPosScore, 45],
      [tePosScore, 45], [benchPosScore, 45]
    ].reduce((pen, [s, thr]) => pen + (s < 30 ? 16 : s < thr ? 8 : 0), 0);
    const posStrScore = Math.min(100, Math.max(0, Math.round(_posBase - _posPenalty)));

    // ── Category 2: Value / Tier Awareness ──────────────────────────────────────
    // BPA reconstruction: for each of my picks, find the best available skill-position
    // player at that moment. K/DST excluded (specialty rounds). QB excluded from BPA
    // once the league has drafted ≥ leagueSize QBs (teams have their starter; the
    // remaining QB cluster at ranks 80-100 would otherwise freeze BPA for 60+ picks).
    const allPicksSorted = [...picks].sort((a, b) => Number(a.pickIndex) - Number(b.pickIndex));

    let totalReach = 0;
    myPicks.forEach(p => {
      const myIdx = Number(p.pickIndex);
      const picksBefore = allPicksSorted.filter(q => Number(q.pickIndex) < myIdx);
      const takenStr = new Set(picksBefore.map(q => String(q.playerRank)));
      // BPA = best available skill-position player (RB/WR/TE only).
      // QB, K, DST excluded: QB has its own positional grade and its clustered ranks
      // (e.g. ranks 65-95 are all QBs nobody wants) would freeze BPA for 30+ picks.
      const bpa = allRankings.find(r => {
        if (r.pos === 'K' || r.pos === 'DST' || r.pos === 'QB') return false;
        return !takenStr.has(String(r.rank));
      });
      const bpaRank = bpa ? Number(bpa.rank) : Number(p.playerRank);
      // Stack reach waiver: waive up to 10 ranks of reach when a WR/TE is on the
      // same team as the starting QB (myQBs[0]) and that QB was already drafted
      // before this pick. WR1-WR3 count (WR3 can flex); WR4+ are pure bench.
      // TE1 only. RBs excluded: QB/RB correlation isn't a meaningful stack.
      let stackWaiver = 0;
      if (p.playerTeam && myQBs[0] && myQBs[0].playerTeam === p.playerTeam) {
        const _isStackablePos =
          (p.playerPos === 'WR' && myWRs.slice(0, 3).some(w => w.playerRank === Number(p.playerRank))) ||
          (p.playerPos === 'TE' && myTEs.slice(0, 2).some(t => t.playerRank === Number(p.playerRank)));
        const _starterQBAlreadyPicked = _isStackablePos && allPicksSorted.some(q =>
          q.uid === uid &&
          Number(q.pickIndex) < myIdx &&
          q.playerRank === myQBs[0].playerRank
        );
        if (_starterQBAlreadyPicked) stackWaiver = 10;
      }
      totalReach += Math.max(0, Number(p.playerRank) - bpaRank - stackWaiver);
    });
    const avgReach = myPicks.length ? totalReach / myPicks.length : 0;
    // Normalize: 0 avg reach → 100 (pure BPA drafter), 45+ avg reach → 0.
    // Ceiling raised from 30 to 45: a reach of ~10 picks is normal fantasy draft
    // behaviour (positional need, sleeper picks) and should score B, not C+.
    const valScore = Math.min(100, Math.max(0, Math.round(100 - avgReach * (100 / 45))));

    // ── Category 3: Depth Quality ────────────────────────────────────────────────
    // Uses myBench, avgBR, and the league-size-scaled thresholds (_benchFloor, _benchRange)
    // already computed above. Scaling ensures an 8-team drafter isn't rewarded simply
    // for having naturally higher-ranked bench players than a 12-team drafter.
    let depScore = 50;
    if (myBench.length) {
      depScore = Math.min(100, Math.max(0, Math.round(100 - Math.max(0, avgBR - _benchFloor) * (100 / _benchRange))));
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
    // Bye week logjam: if top 3 WRs share a bye, that's a nightmare management week.
    // If top 2 RBs share a bye, that's a major problem too.
    if (typeof BYE_WEEKS !== 'undefined') {
      const _byeOf = p => (p && p.playerTeam ? BYE_WEEKS[p.playerTeam] || null : null);
      const wrByes = myWRs.slice(0, 3).map(_byeOf).filter(Boolean);
      const rbByes = myRBs.slice(0, 2).map(_byeOf).filter(Boolean);
      const _hasDupe = arr => arr.length > 1 && arr.some((b, i) => arr.indexOf(b) !== i);
      if (_hasDupe(wrByes)) scarScore -= 7;
      if (_hasDupe(rbByes)) scarScore -= 5;
    }
    scarScore = Math.min(100, Math.max(0, scarScore));

    // ── Category 5: Strategy Coherence ──────────────────────────────────────────
    // Reward drafters who committed to a recognizable strategy and executed it
    // consistently. Checks positional patterns (hero RB, zero RB), team correlation
    // (stacker), positional hoarding (bully TE), deliberate scarcity deferral
    // (late QB/TE), and sleeper-heavy builds (rookie fever). Patterns are checked
    // in priority order — most committed/specific strategy wins.
    const top4    = myPicks.slice(0, Math.min(4, myPicks.length));
    const pos4    = top4.map(p => p.playerPos);
    const rbEarly = pos4.filter(p => p === 'RB').length;
    const wrEarly = pos4.filter(p => p === 'WR').length;

    // Stack detection (hoisted — also needed for badges below)
    // Requires the QB to be the starter (myQBs[0]). WR1-WR3 count (WR3 can flex);
    // WR4+ are pure bench and wouldn't start in a healthy lineup. TE1 only — TE2
    // is a bench handcuff. RBs excluded: QB/RB correlation isn't a meaningful stack.
    const _starterQBTeam  = myQBs[0] ? myQBs[0].playerTeam : null;
    const _stackableWRTE  = [...myWRs.slice(0, 3), ...myTEs.slice(0, 2)].filter(Boolean);
    const _hasStack       = !!_starterQBTeam && _stackableWRTE.some(p =>
      p.playerTeam === _starterQBTeam
    );

    // Bully TE: 2+ TEs drafted before round 6
    const _earlyTECnt = myTEs.filter(p => Number(p.pickIndex) < leagueSize * 5).length;

    // Late QB/TE: deliberately deferred both scarce positions — QB round 7+, TE round 6+
    const _firstQBRound = myQBs.length ? Math.floor(Math.min(...myQBs.map(q => Number(q.pickIndex))) / leagueSize) + 1 : 999;
    const _firstTERound = myTEs.length ? Math.floor(Math.min(...myTEs.map(t => Number(t.pickIndex))) / leagueSize) + 1 : 999;
    const _isLateQBTE   = myQBs.length > 0 && myTEs.length > 0 && _firstQBRound >= 7 && _firstTERound >= 6;

    // Rookie fever: 3+ rookies in the pool (requires FF_ROOKIES from nfl-data.js)
    const _rookieCnt = (typeof FF_ROOKIES !== 'undefined')
      ? myPicks.filter(p => FF_ROOKIES.has((p.playerName || '').toLowerCase())).length
      : 0;

    let cohScore = 50;
    if      (rbEarly >= 3)                cohScore = 85; // Hero RB
    else if (wrEarly >= 3)                cohScore = 80; // Zero RB
    else if (_hasStack)                   cohScore = 78; // Stacker (QB + same-team WR/TE)
    else if (_earlyTECnt >= 2)            cohScore = 76; // Bully TE
    else if (rbEarly >= 2 && wrEarly >= 1) cohScore = 75; // Balanced — RB lean
    else if (_isLateQBTE)                 cohScore = 73; // Late QB/TE
    else if (wrEarly >= 2 && rbEarly >= 1) cohScore = 72; // Balanced — WR lean
    else if (_rookieCnt >= 3)             cohScore = 70; // Rookie Fever
    else                                  cohScore = 55; // No clear strategy

    // ── Overall score & letter grade ─────────────────────────────────────────────
    const weights = { pos: 0.25, val: 0.25, dep: 0.20, scar: 0.15, coh: 0.15 };
    const overall = Math.round(
      posStrScore * weights.pos +
      valScore    * weights.val +
      depScore    * weights.dep +
      scarScore   * weights.scar +
      cohScore    * weights.coh
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

    // ── Positional grade cards (scores already computed above) ───────────────────
    function posGrade(score) { return toGrade(Math.round(score)); }

    const qbFactors = [
      { label: 'Starter Tier', val: Math.round(qbStartScore) },
      { label: 'Has Backup',   val: myQBs.length >= 2 ? 100 : 0 },
      { label: 'Backup Value', val: qbBackup < 999 ? Math.min(100, Math.round(100 - (qbBackup - 40) * 1.5)) : 0 },
    ];
    const rbFactors = [
      { label: 'RB1 Tier',    val: Math.round(rb1Score) },
      { label: 'RB2 Tier',    val: myRBs.length >= 2 ? Math.round(rb2Score) : 0 },
      { label: 'Depth Count', val: Math.min(100, myRBs.length * 20) },
    ];
    const wrFactors = [
      { label: 'WR1 Tier',    val: Math.round(wr1Score) },
      { label: 'WR2 Tier',    val: myWRs.length >= 2 ? Math.round(wr2Score) : 0 },
      { label: 'Depth Count', val: Math.min(100, myWRs.length * 20) },
    ];
    // Position Rank: how many TEs are ranked above yours? TE1=100, TE2=80, TE3-4=60, TE5-6=42, TE7+=22
    const teFactors = [
      { label: 'Starter Tier',  val: Math.round(teStartScore) },
      { label: 'Position Rank', val: tePosRankScore },
      { label: 'Has Backup',    val: myTEs.length >= 2 ? 100 : 0 },
    ];
    const benchFactors = [
      { label: 'Avg Player Tier', val: benchAvgScore },
      { label: 'Best Asset',      val: bestAssetScore },
      { label: 'Pos Variety',     val: Math.min(100, new Set(myBench.map(p=>p.playerPos)).size * 25) },
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
        if (bal < 70) return "A positional weakness or two could bite — but there's enough upside to paper over the cracks.";
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
        if (bal < 65) return "Multiple positions are badly underdrafted. This roster has real holes that the wire alone won't fix.";
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

    const narrative = _blurb(posStrScore, valScore, depScore, scarScore, cohScore, overall, toGrade(overall), myPicks);

    // ── Roster Profile Badges ─────────────────────────────────────────────────────
    // (_myQBTeams and _hasStack already computed in Category 5 above)
    const _sleeperCnt = myPicks.filter(p => Number(p.playerRank) > 150).length;
    const badges = [];
    if (valScore > 90)                               badges.push({ label: 'Safe Bet',            emoji: '🛡️' });
    if (_sleeperCnt >= 3)                            badges.push({ label: 'Boom or Bust',         emoji: '💣' });
    if (_hasStack && cohScore >= 72)                 badges.push({ label: 'Calculated Architect', emoji: '🎯' });
    if (isZeroRB)                                    badges.push({ label: 'Zero RB',              emoji: '🏃' });
    if (_top4Pos.filter(p => p === 'RB').length >= 3) badges.push({ label: 'Hero RB',             emoji: '💪' });

    return {
      overall, grade: toGrade(overall),
      cats: {
        'Positional Strength': posStrScore,
        'Value':               valScore,
        'Bench Depth':         depScore,
        'Scarcity Awareness':  scarScore,
        'Strategy Coherence':  cohScore,
      },
      posGrades,
      narrative,
      badges,
      picks: myPicks,
    };
  }

  // ── Recap stats ──────────────────────────────────────────────────────────────
  function _computeRecap(data, allRankings) {
    const { picks = [], participants = {}, settings = {}, draftOrder = [] } = data;
    const leagueSize = settings.leagueSize || 10;
    const allSorted  = [...picks].sort((a, b) => Number(a.pickIndex) - Number(b.pickIndex));
    const awards = [];

    // Top Dog — who drafted the #1 overall ranked player
    if (allSorted.length) {
      const top = [...allSorted].sort((a, b) => Number(a.playerRank) - Number(b.playerRank))[0];
      const name = (participants[top.uid] || {}).name || '?';
      const rd   = Math.floor(Number(top.pickIndex) / leagueSize) + 1;
      awards.push({ emoji: '🏆', title: 'Top Dog', desc: `${name} landed ${top.playerName} (overall #${top.playerRank}, Rd ${rd})` });
    }

    // First QB Off Board
    const firstQb = allSorted.find(p => p.playerPos === 'QB');
    if (firstQb) {
      const name = (participants[firstQb.uid] || {}).name || '?';
      const rd   = Math.floor(Number(firstQb.pickIndex) / leagueSize) + 1;
      awards.push({ emoji: '🎯', title: 'First QB Off Board', desc: `${name} — ${firstQb.playerName} in Rd ${rd}` });
    }

    // Waiting Game — who drafted their first QB latest
    const firstQbRoundByUid = {};
    allSorted.filter(p => p.playerPos === 'QB').forEach(p => {
      const rd = Math.floor(Number(p.pickIndex) / leagueSize) + 1;
      if (!firstQbRoundByUid[p.uid]) firstQbRoundByUid[p.uid] = { rd, pick: p };
    });
    const latestQb = Object.values(firstQbRoundByUid).sort((a, b) => b.rd - a.rd)[0];
    if (latestQb && latestQb.rd >= 5) {
      const name = (participants[latestQb.pick.uid] || {}).name || '?';
      awards.push({ emoji: '⏳', title: 'Waiting Game', desc: `${name} held off until Rd ${latestQb.rd} for ${latestQb.pick.playerName}` });
    }

    // Backfield Boss — most RBs
    const rbCount = {};
    allSorted.filter(p => p.playerPos === 'RB').forEach(p => { rbCount[p.uid] = (rbCount[p.uid] || 0) + 1; });
    const boss = Object.entries(rbCount).sort((a, b) => b[1] - a[1])[0];
    if (boss && boss[1] >= 3) {
      const name = (participants[boss[0]] || {}).name || '?';
      awards.push({ emoji: '🏃', title: 'Backfield Boss', desc: `${name} stockpiled ${boss[1]} RBs` });
    }

    // Route Runner — most WRs
    const wrCount = {};
    allSorted.filter(p => p.playerPos === 'WR').forEach(p => { wrCount[p.uid] = (wrCount[p.uid] || 0) + 1; });
    const runner = Object.entries(wrCount).sort((a, b) => b[1] - a[1])[0];
    if (runner && runner[1] >= 4) {
      const name = (participants[runner[0]] || {}).name || '?';
      awards.push({ emoji: '📡', title: 'Route Runner', desc: `${name} loaded up with ${runner[1]} WRs` });
    }

    // Stack Attack — most players from one NFL team on a single roster
    const stacks = {};
    allSorted.forEach(p => {
      if (!p.playerTeam) return;
      if (!stacks[p.uid]) stacks[p.uid] = {};
      stacks[p.uid][p.playerTeam] = (stacks[p.uid][p.playerTeam] || 0) + 1;
    });
    let bestStack = null;
    Object.entries(stacks).forEach(([uid, teams]) => {
      Object.entries(teams).forEach(([team, cnt]) => {
        if (!bestStack || cnt > bestStack.cnt) bestStack = { uid, team, cnt };
      });
    });
    if (bestStack && bestStack.cnt >= 3) {
      const name = (participants[bestStack.uid] || {}).name || '?';
      awards.push({ emoji: '📦', title: 'Stack Attack', desc: `${name} grabbed ${bestStack.cnt} players from ${bestStack.team}` });
    }

    // Last Pick Standing — highest pick index that filled a starting slot
    const lastPick = allSorted[allSorted.length - 1];
    if (lastPick) {
      const name = (participants[lastPick.uid] || {}).name || '?';
      const rd   = Math.floor(Number(lastPick.pickIndex) / leagueSize) + 1;
      awards.push({ emoji: '🎲', title: 'Final Pick', desc: `${name} — ${lastPick.playerName} with the last pick (Rd ${rd})` });
    }

    return awards;
  }

  window._ffcvShowTab = function (tabId, btn) {
    ['grades', 'recap'].forEach(id => {
      const p = document.getElementById('ffcv-panel-' + id);
      if (p) p.style.display = id === tabId ? '' : 'none';
    });
    document.querySelectorAll('.ffcv-tab-btn').forEach(b => b.classList.remove('active'));
    if (btn) btn.classList.add('active');
  };

  function _buildVerdictFullHTML(grades, gradeColor, data) {
    const winner  = grades[0];
    const catKeys = Object.keys((grades[0] || {}).cats || {});

    const teamCards = grades.map((g, i) => {
      const crown  = i === 0 ? '<span class="ffcv-crown">👑</span>' : '';
      const youTag = g.isMe ? '<span class="ffcv-you-tag">YOU</span>' : '';
      const gColor = gradeColor(g.grade);

      const catBars = catKeys.map(k => {
        const score = g.cats[k];
        const col   = score >= 75 ? '#4caf50' : score >= 55 ? '#ffb300' : '#e53935';
        return `<div class="ffcv-cat-row">
          <span class="ffcv-cat-label">${k}</span>
          <div class="ffcv-cat-bar-bg"><div class="ffcv-cat-bar" style="width:${score}%;background:${col}"></div></div>
          <span class="ffcv-cat-score">${score}</span>
        </div>`;
      }).join('');

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
        ${(g.badges && g.badges.length) ? `<div class="ffcv-badges">${g.badges.map(b => `<span class="ffcv-badge">${b.emoji} ${b.label}</span>`).join('')}</div>` : ''}
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

    const allRankingsV = typeof FANTASY_RANKINGS !== 'undefined' ? FANTASY_RANKINGS : [];
    const recapItems  = _computeRecap(data, allRankingsV);
    const recapAwards = recapItems.map(item =>
      `<div class="ffcv-recap-card">
        <div class="ffcv-recap-emoji">${item.emoji}</div>
        <div class="ffcv-recap-title">${item.title}</div>
        <div class="ffcv-recap-desc">${item.desc}</div>
      </div>`
    ).join('');

    return `
      <div class="ffcv-wrap">
        <div class="ffcv-header">
          <div class="ffcv-title">⚖️ Clanker's Verdict</div>
          <div class="ffcv-subtitle">Winner: <strong>${winner.name}</strong> with a <strong style="color:${gradeColor(winner.grade)}">${winner.grade}</strong></div>
        </div>
        <div class="ffcv-tabs">
          <button class="ffcv-tab-btn active" onclick="_ffcvShowTab('grades',this)">📊 Grades</button>
          <button class="ffcv-tab-btn" onclick="_ffcvShowTab('recap',this)">🏆 Recap</button>
        </div>
        <div id="ffcv-panel-grades">
          <div class="ffcv-cards">${teamCards}</div>
        </div>
        <div id="ffcv-panel-recap" style="display:none">
          <div class="ffcv-recap-grid">${recapAwards || '<div class="ffcv-recap-empty">Not enough data yet.</div>'}</div>
        </div>
        <button class="ffcv-new-btn" onclick="renderDraftLobbyTab()">New Draft</button>
      </div>`;
  }

  function _verdictRevealEntry(g, rank, isWinner, gradeColor) {
    const div = document.createElement('div');
    div.className = 'ffcv-reveal-entry' + (isWinner ? ' ffcv-reveal-winner' : '');
    const youTag = g.isMe ? ' <span class="ffcv-you-tag">YOU</span>' : '';
    div.innerHTML = `
      <span class="ffcv-reveal-rank">#${rank}</span>
      <span class="ffcv-reveal-name">${isWinner ? '👑 ' : ''}${g.name}${youTag}</span>
      <span class="ffcv-reveal-grade" style="color:${gradeColor(g.grade)}">${g.grade}</span>`;
    return div;
  }

  function _renderVerdict(data, lobbyId) {
    const container = _panel();
    if (!container) return;
    if (_verdictShown) return;
    _verdictShown = true;

    clearInterval(_timerInterval); _timerInterval = null;
    clearTimeout(_botTimeout);     _botTimeout    = null;
    window._draftQueue    = [];
    window._ffdbBoardView = 'round';
    _bbLastSnapRound      = -1;
    _poolScrollTop        = 0;

    const { draftOrder = [], participants = {}, settings = {} } = data;
    const leagueSize  = settings.leagueSize || 10;
    const teamOrder   = draftOrder.slice(0, leagueSize);

    const grades = teamOrder.map(uid => ({
      uid,
      name: (participants[uid] || {}).name || '?',
      isBot: !!(participants[uid] || {}).isBot,
      isMe: uid === _myUid,
      ..._gradeTeam(uid, data),
    })).filter(g => g.overall !== undefined);

    grades.sort((a, b) => b.overall - a.overall);

    function gradeColor(g) {
      if (g.startsWith('A')) return '#4caf50';
      if (g.startsWith('B')) return '#8bc34a';
      if (g.startsWith('C')) return '#ffb300';
      if (g.startsWith('D')) return '#ff7043';
      return '#e53935';
    }

    const fullHTML = _buildVerdictFullHTML(grades, gradeColor, data);
    const n = grades.length;
    const revealOrder = [...grades].reverse(); // worst → best

    // ── helpers exposed to inline onclick ──────────────────────────────────────
    window._ffcvRevealTimeouts = [];

    window._ffcvShowFullVerdict = function () {
      (window._ffcvRevealTimeouts || []).forEach(t => clearTimeout(t));
      window._ffcvRevealTimeouts = [];
      const c = _panel();
      if (c) c.innerHTML = fullHTML;
    };

    window._ffcvSkipReveal = function () {
      (window._ffcvRevealTimeouts || []).forEach(t => clearTimeout(t));
      window._ffcvRevealTimeouts = [];
      const list = document.getElementById('ffcv-reveal-list');
      if (list) {
        list.innerHTML = '';
        // prepend worst→best so winner ends up on top
        revealOrder.forEach((g, idx) => {
          const isWinner = idx === n - 1;
          const entry = _verdictRevealEntry(g, n - idx, isWinner, gradeColor);
          entry.style.animation = 'none';
          entry.style.opacity   = '1';
          list.prepend(entry);
        });
      }
      const btn = document.getElementById('ffcv-reveal-action');
      if (btn) { btn.textContent = 'View Full Results →'; btn.className = 'ffcv-reveal-view-btn'; btn.onclick = window._ffcvShowFullVerdict; }
    };

    // ── render reveal shell ────────────────────────────────────────────────────
    container.innerHTML = `
      <div class="ffcv-reveal-wrap">
        <div class="ffcv-reveal-eyebrow">⚖️ CLANKER'S VERDICT</div>
        <div class="ffcv-reveal-list" id="ffcv-reveal-list"></div>
        <div class="ffcv-reveal-actions">
          <button class="ffcv-reveal-skip" id="ffcv-reveal-action" onclick="_ffcvSkipReveal()">Skip ›</button>
        </div>
      </div>`;

    // ── schedule reveals last→first ────────────────────────────────────────────
    let cum = 700;
    revealOrder.forEach((g, idx) => {
      const isWinner = idx === n - 1;
      if (isWinner) cum += 1100; // dramatic pause before #1

      const t = setTimeout(() => {
        const list = document.getElementById('ffcv-reveal-list');
        if (!list) return;
        list.prepend(_verdictRevealEntry(g, n - idx, isWinner, gradeColor));

        if (isWinner) {
          const t2 = setTimeout(() => {
            const btn = document.getElementById('ffcv-reveal-action');
            if (btn) { btn.textContent = 'View Full Results →'; btn.className = 'ffcv-reveal-view-btn'; btn.onclick = window._ffcvShowFullVerdict; }
          }, 1600);
          window._ffcvRevealTimeouts.push(t2);
        }
      }, cum);

      window._ffcvRevealTimeouts.push(t);
      cum += isWinner ? 0 : 850;
    });
  }

})();
