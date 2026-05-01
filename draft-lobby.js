// ── FF Draft Lobby — Phase 1: Lobby & Identity ──────────────────────────────

(function () {
  'use strict';

  let _lobbyId   = null;
  let _myUid     = null;
  let _myName    = null;
  let _isGuest   = false;
  let _unsubLobby = null;

  function _db() { return firebase.firestore(); }
  function _panel() { return document.getElementById('nfl-ff-draft'); }

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
        _draftRenderLobby(snap.data(), lobbyId);
      });
  }

  // ── Render lobby UI ─────────────────────────────────────────────────────────
  function _draftRenderLobby(data, lobbyId) {
    const container = _panel();
    if (!container) return;

    const { settings = {}, participants = {}, hostId } = data;
    const isHost   = hostId === _myUid;
    const maxSlots = settings.leagueSize || 10;
    const pList    = Object.entries(participants).sort((a, b) => a[1].joinedAt - b[1].joinedAt);
    const count    = pList.length;

    const participantRows = pList.map(([uid, p]) => {
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

    const emptySlots = Array.from({ length: Math.max(0, maxSlots - count) }, (_, i) =>
      `<div class="ffd-participant ffd-empty">
        <div class="ffd-p-left"><span class="ffd-p-dot ffd-dot-empty"></span><span class="ffd-p-name ffd-empty-label">Open slot ${count + i + 1}</span></div>
      </div>`
    ).join('');

    const settingsPanel = isHost
      ? `<div class="ffd-settings-panel">
          <div class="ffd-panel-title">LOBBY SETTINGS</div>
          <div class="ffd-settings-row">
            <span class="ffd-settings-label">League Size</span>
            <div class="ffd-opts">
              ${[8, 10, 12].map(n => `<button class="ffd-opt${settings.leagueSize === n ? ' active' : ''}" onclick="_draftSetSetting('${lobbyId}','leagueSize',${n})">${n}</button>`).join('')}
            </div>
          </div>
          <div class="ffd-settings-row">
            <span class="ffd-settings-label">Pick Timer</span>
            <div class="ffd-opts">
              ${[15, 30, 60, 90].map(n => `<button class="ffd-opt${settings.timerSeconds === n ? ' active' : ''}" onclick="_draftSetSetting('${lobbyId}','timerSeconds',${n})">${n}s</button>`).join('')}
              <button class="ffd-opt${!settings.timerSeconds ? ' active' : ''}" onclick="_draftSetSetting('${lobbyId}','timerSeconds',0)">∞</button>
            </div>
          </div>
        </div>`
      : `<div class="ffd-settings-panel ffd-settings-ro">
          <div class="ffd-panel-title">LOBBY SETTINGS</div>
          <div class="ffd-settings-row"><span class="ffd-settings-label">League Size</span><span class="ffd-settings-val">${maxSlots} teams</span></div>
          <div class="ffd-settings-row"><span class="ffd-settings-label">Pick Timer</span><span class="ffd-settings-val">${settings.timerSeconds ? settings.timerSeconds + 's' : 'No limit'}</span></div>
        </div>`;

    const canStart = isHost && count >= 1;
    const actionArea = isHost
      ? `<button class="ffd-start-btn" onclick="_draftStartDraft('${lobbyId}')" ${canStart ? '' : 'disabled'}>
           START DRAFT
         </button>`
      : `<div class="ffd-waiting-msg">Waiting for host to start…</div>`;

    container.innerHTML = `
      <div class="ffd-wrap">
        <div class="ffd-topbar">
          <span class="ffd-lobby-code">LOBBY · ${lobbyId.slice(0, 8).toUpperCase()}</span>
        </div>

        <div class="ffd-lobby-header">🏈 DRAFT LOBBY</div>
        <div class="ffd-lobby-sub">${count} / ${maxSlots} players joined · ${maxSlots - count > 0 ? (maxSlots - count) + ' open slot' + (maxSlots - count !== 1 ? 's' : '') + ' (bots will fill on start)' : 'lobby full'}</div>

        <div class="ffd-body">
          <div class="ffd-participants-panel">
            <div class="ffd-panel-title">PARTICIPANTS</div>
            ${participantRows}
            ${emptySlots}
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
    const db = _db();
    const batch = db.batch();
    batch.update(db.collection('ff_draft_lobbies').doc(lobbyId), { status: 'drafting' });
    // Spawn next open lobby immediately
    batch.set(db.collection('ff_draft_lobbies').doc(), {
      status: 'waiting',
      hostId: null,
      createdAt: firebase.firestore.FieldValue.serverTimestamp(),
      settings: { leagueSize: 10, timerSeconds: 30 },
      participants: {}
    });
    await batch.commit();
    // Phase 2: transition to draft board
    const c = _panel();
    if (c) c.innerHTML = `<div class="ffd-loading">Draft starting… (board coming in Phase 2)</div>`;
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
})();
