// ── Firebase cloud storage ───────────────────────────────────
// Each user's data stored in Firestore: users/{username}/store/{key}
(function () {
  var firebaseConfig = {
    apiKey: "AIzaSyCCIs7EnqUwWxJfe4yO1OxJ_1glACZ1zEc",
    authDomain: "johnsonsclankerranker-ba199.firebaseapp.com",
    projectId: "johnsonsclankerranker-ba199",
    storageBucket: "johnsonsclankerranker-ba199.firebasestorage.app",
    messagingSenderId: "40795520767",
    appId: "1:40795520767:web:17a469f360bae22a2456ca"
  };

  var _db   = null;
  var _auth = null;
  var _uid  = null;
  var _displayName = null;
  var _cache = {};
  var _loaded = false;
  var _loading = null;
  var _saveTimers = {};
  var _syncEl = null;

  function _initFirebase() {
    if (!_db) {
      if (!firebase.apps.length) firebase.initializeApp(firebaseConfig);
      _db   = firebase.firestore();
      _auth = firebase.auth();
    }
  }

  function _showSyncStatus(msg, cls) {
    if (!_syncEl) {
      _syncEl = document.createElement('div');
      _syncEl.id = 'fb-sync-status';
      _syncEl.style.cssText = 'position:fixed;bottom:12px;right:12px;padding:6px 14px;border-radius:20px;font-family:Barlow Condensed,sans-serif;font-size:0.8rem;letter-spacing:1px;z-index:9999;transition:opacity 0.5s';
      document.body.appendChild(_syncEl);
    }
    _syncEl.textContent = msg;
    _syncEl.style.background = cls==='ok' ? 'rgba(0,200,100,0.15)' : cls==='err' ? 'rgba(255,60,60,0.15)' : 'rgba(255,170,0,0.15)';
    _syncEl.style.color       = cls==='ok' ? '#00c864' : cls==='err' ? '#ff4444' : '#ffaa00';
    _syncEl.style.border      = '1px solid ' + (cls==='ok' ? 'rgba(0,200,100,0.3)' : cls==='err' ? 'rgba(255,60,60,0.3)' : 'rgba(255,170,0,0.3)');
    _syncEl.style.opacity = '1';
    if (cls === 'ok') setTimeout(function() { if (_syncEl) _syncEl.style.opacity = '0'; }, 3000);
  }

  // Show Google Sign-In modal
  function _showSignInModal(resolve) {
    var overlay = document.createElement('div');
    overlay.id = 'jcr-signin-overlay';
    overlay.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,0.88);z-index:10000;display:flex;align-items:center;justify-content:center';
    overlay.innerHTML = '<div style="background:#12122a;border:1px solid rgba(255,170,0,0.35);border-radius:14px;padding:38px;max-width:420px;width:90%;font-family:\'Barlow Condensed\',sans-serif;text-align:center">'
      + '<div style="font-size:1.6rem;letter-spacing:3px;color:#ffaa00;margin-bottom:8px">&#x1F3C0; SPORTSBOOK</div>'
      + '<div style="color:#aaa;font-size:0.92rem;margin-bottom:26px;line-height:1.6">Sign in with Google to track your picks, place bets, and compete on the leaderboard.</div>'
      + '<button id="jcr-google-btn" style="width:100%;padding:13px 16px;border-radius:8px;border:1px solid rgba(255,255,255,0.18);background:rgba(255,255,255,0.07);color:#fff;font-family:\'Barlow Condensed\',sans-serif;font-size:1rem;letter-spacing:2px;cursor:pointer;display:flex;align-items:center;justify-content:center;gap:10px">'
      + '<svg width="20" height="20" viewBox="0 0 48 48"><path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/><path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/><path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/><path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/><path fill="none" d="M0 0h48v48H0z"/></svg>'
      + 'SIGN IN WITH GOOGLE</button>'
      + '<div id="jcr-signin-err" style="color:#ff6b6b;font-size:0.85rem;margin-top:14px;display:none"></div>'
      + '</div>';
    document.body.appendChild(overlay);
    var btn = overlay.querySelector('#jcr-google-btn');
    var errEl = overlay.querySelector('#jcr-signin-err');
    btn.onclick = function() {
      btn.disabled = true;
      btn.style.opacity = '0.6';
      btn.innerHTML = '<span style="letter-spacing:2px">Signing in…</span>';
      var provider = new firebase.auth.GoogleAuthProvider();
      _auth.signInWithPopup(provider)
        .then(function(result) {
          _uid = result.user.uid;
          document.body.removeChild(overlay);
          return _ensureNickname(result.user);
        })
        .then(function(nick) {
          _displayName = nick;
          resolve(_uid);
        })
        .catch(function(e) {
          btn.disabled = false;
          btn.style.opacity = '1';
          btn.innerHTML = '<svg width="20" height="20" viewBox="0 0 48 48"><path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/><path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/><path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/><path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/><path fill="none" d="M0 0h48v48H0z"/></svg> SIGN IN WITH GOOGLE';
          errEl.textContent = e.code === 'auth/popup-closed-by-user' ? 'Sign-in cancelled.' : 'Sign-in failed. Please try again.';
          errEl.style.display = '';
        });
    };
  }

  // Resolve display nickname from localStorage (keyed by UID — no Firestore read needed).
  // Always prompts on first sign-in so every user picks their own username.
  function _ensureNickname(user) {
    var stored = localStorage.getItem('jcr.nick.' + user.uid);
    if (stored) return Promise.resolve(stored);
    // First time on this device — show the nickname picker
    return new Promise(function(resolve) { _showNicknameModal(user, resolve); });
  }

  function _showNicknameModal(user, resolve) {
    var overlay = document.createElement('div');
    overlay.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,0.88);z-index:10000;display:flex;align-items:center;justify-content:center';
    var suggested = ((user.displayName || '').split(' ')[0] || '').replace(/[^a-zA-Z0-9_ ]/g, '').trim().slice(0, 20);
    overlay.innerHTML = '<div style="background:#12122a;border:1px solid rgba(255,170,0,0.35);border-radius:14px;padding:36px;max-width:420px;width:90%;font-family:\'Barlow Condensed\',sans-serif">'
      + '<div style="font-size:1.5rem;letter-spacing:3px;color:#ffaa00;margin-bottom:6px">&#x1F3C0; ONE MORE THING</div>'
      + '<div style="color:#aaa;font-size:0.92rem;margin-bottom:22px;line-height:1.55">Choose a display name for the sportsbook leaderboard.</div>'
      + '<input id="jcr-nick-input" type="text" placeholder="Your name (e.g. Matt)" maxlength="20" value="' + suggested + '"'
      + ' style="width:100%;box-sizing:border-box;padding:11px 14px;border-radius:8px;border:1px solid rgba(255,170,0,0.3);background:rgba(255,255,255,0.05);color:#fff;font-family:\'Barlow Condensed\',sans-serif;font-size:1rem;letter-spacing:1px;margin-bottom:14px;outline:none"/>'
      + '<button id="jcr-nick-btn" style="width:100%;padding:11px;border-radius:8px;border:none;background:#ffaa00;color:#000;font-family:\'Barlow Condensed\',sans-serif;font-size:1rem;letter-spacing:3px;font-weight:700;cursor:pointer">LET\'S GO</button>'
      + '<div id="jcr-nick-err" style="color:#ff6b6b;font-size:0.82rem;margin-top:10px;display:none"></div>'
      + '</div>';
    document.body.appendChild(overlay);
    var input = overlay.querySelector('#jcr-nick-input');
    var btn   = overlay.querySelector('#jcr-nick-btn');
    var err   = overlay.querySelector('#jcr-nick-err');
    input.focus();
    if (suggested) input.select();
    function submit() {
      var name = input.value.trim();
      if (!name || name.length < 2) { err.textContent = 'Please enter at least 2 characters.'; err.style.display = ''; return; }
      var safe = name.replace(/[^a-zA-Z0-9_ ]/g, '').trim();
      if (!safe) { err.textContent = 'Letters and numbers only please.'; err.style.display = ''; return; }
      localStorage.setItem('jcr.nick.' + user.uid, safe);
      document.body.removeChild(overlay);
      resolve(safe);
    }
    btn.onclick = submit;
    input.onkeydown = function(e) { if (e.key === 'Enter') submit(); };
  }

  // _authPromise — caches the interactive sign-in flow (prevents double modal from parallel callers)
  var _authPromise = null;
  // _authRestorePromise — caches the silent session-restore check (no modal ever shown)
  var _authRestorePromise = null;

  // Silent auth restore — called from _load() / _loadShared(). Never shows a modal.
  // Sets _uid + _displayName if the user is already signed in, otherwise resolves with nothing.
  function _tryRestoreAuth() {
    if (_uid) return Promise.resolve();
    if (_authRestorePromise) return _authRestorePromise;
    _initFirebase();
    _authRestorePromise = new Promise(function(resolve) {
      var done = false;
      var unsub = _auth.onAuthStateChanged(function(user) {
        if (done) return;
        done = true;
        unsub();
        if (user) {
          _uid = user.uid;
          _ensureNickname(user).then(function(nick) { _displayName = nick; resolve(); });
        } else {
          resolve(); // not signed in — silently continue, no modal
        }
      });
    });
    return _authRestorePromise;
  }

  // Interactive auth gate — called ONLY from renderSportsbook(). Shows sign-in modal if needed.
  function _ensureAuth() {
    if (_uid) return Promise.resolve(_uid);
    if (_authPromise) return _authPromise;
    _initFirebase();
    _authPromise = new Promise(function(resolve) {
      var done = false;
      var unsub = _auth.onAuthStateChanged(function(user) {
        if (done) return;
        done = true;
        unsub();
        if (user) {
          _uid = user.uid;
          _ensureNickname(user).then(function(nick) { _displayName = nick; resolve(_uid); });
        } else {
          _showSignInModal(resolve);
        }
      });
    });
    return _authPromise;
  }

  function _storeRef(key) {
    var safeKey = key.replace(/\//g, '__SL__');
    return _db.collection('users').doc(_uid).collection('store').doc(safeKey);
  }

  function _load() {
    if (_loaded) return Promise.resolve();
    if (_loading) return _loading;
    _loading = _tryRestoreAuth().then(function() {
      if (!_uid) { _loaded = true; return; } // not signed in — skip Firestore, work offline
      _initFirebase();
      _showSyncStatus('\u27f3 Syncing\u2026', 'sync');
      return _db.collection('users').doc(_uid).collection('store').get()
        .then(function(snap) {
          snap.forEach(function(doc) {
            var key = doc.id.replace(/__SL__/g, '/');
            _cache[key] = doc.data().value;
          });
          _showSyncStatus('\u2713 Synced', 'ok');
          _loaded = true;
        })
        .catch(function() { _showSyncStatus('\u26a0 Sync error', 'err'); _loaded = true; });
    });
    return _loading;
  }

  function _scheduleSave(key, value) {
    if (_saveTimers[key]) clearTimeout(_saveTimers[key]);
    _saveTimers[key] = setTimeout(function() {
      _showSyncStatus('\u27f3 Saving\u2026', 'sync');
      _storeRef(key).set({ value: value })
        .then(function() { _showSyncStatus('\u2713 Saved', 'ok'); })
        .catch(function() { _showSyncStatus('\u26a0 Save failed', 'err'); });
    }, 1500);
  }

  function _scheduleDelete(key) {
    if (_saveTimers[key]) clearTimeout(_saveTimers[key]);
    _saveTimers[key] = setTimeout(function() {
      _storeRef(key).delete().catch(function() {});
    }, 500);
  }

  // ── Shared storage (leaderboard — readable by all users) ──
  var _sharedCache = {};
  var _sharedLoaded = false;
  var _sharedLoading = null;
  var _sharedSaveTimers = {};

  function _sharedRef(key) {
    var safeKey = key.replace(/\//g, '__SL__');
    return _db.collection('shared').doc(safeKey);
  }

  function _loadShared() {
    if (_sharedLoaded) return Promise.resolve();
    if (_sharedLoading) return _sharedLoading;
    _sharedLoading = _tryRestoreAuth().then(function() {
      _initFirebase();
      return _db.collection('shared').get()
        .then(function(snap) {
          snap.forEach(function(doc) {
            var key = doc.id.replace(/__SL__/g, '/');
            _sharedCache[key] = doc.data().value;
          });
          _sharedLoaded = true;
        })
        .catch(function() { _sharedLoaded = true; });
    });
    return _sharedLoading;
  }

  function _scheduleSharedSave(key, value) {
    if (_sharedSaveTimers[key]) clearTimeout(_sharedSaveTimers[key]);
    _sharedSaveTimers[key] = setTimeout(function() {
      _sharedRef(key).set({ value: value }).catch(function() {});
    }, 1500);
  }

  window.storage = {
    get: async function(key, shared) {
      if (shared) {
        await _loadShared();
        var val = _sharedCache[key];
        if (val === undefined) throw new Error('Key not found: ' + key);
        return { key: key, value: val };
      }
      await _load();
      var val = _cache[key];
      if (val === undefined) throw new Error('Key not found: ' + key);
      return { key: key, value: val };
    },
    set: async function(key, value, shared) {
      if (shared) {
        await _loadShared();
        _sharedCache[key] = value;
        _scheduleSharedSave(key, value);
        return { key: key, value: value };
      }
      await _load();
      _cache[key] = value;
      _scheduleSave(key, value);
      return { key: key, value: value };
    },
    delete: async function(key, shared) {
      if (shared) {
        await _loadShared();
        delete _sharedCache[key];
        if (_sharedSaveTimers[key]) clearTimeout(_sharedSaveTimers[key]);
        _sharedSaveTimers[key] = setTimeout(function() {
          _sharedRef(key).delete().catch(function() {});
        }, 500);
        return { key: key, deleted: true };
      }
      await _load();
      delete _cache[key];
      _scheduleDelete(key);
      return { key: key, deleted: true };
    },
    list: async function(prefix, shared) {
      if (shared) {
        await _loadShared();
        var keys = Object.keys(_sharedCache).filter(function(k) { return !prefix || k.startsWith(prefix); });
        return { keys: keys, prefix: prefix };
      }
      await _load();
      var keys = Object.keys(_cache).filter(function(k) { return !prefix || k.startsWith(prefix); });
      return { keys: keys, prefix: prefix };
    }
  };

  // ── Public auth API (exposed to global scope for sportsbook) ────
  window._jcrAuth = {
    // Show sign-in modal if not authenticated. Resolves when signed in.
    ensureAuth: function() { return _ensureAuth(); },
    // Reset load state so storage re-fetches from Firestore after sign-in
    resetLoad: function() { _loaded = false; _loading = null; },
    // Get / set display name (localStorage keyed by UID)
    getDisplayName: function() { return _displayName; },
    setDisplayName: function(name) {
      _displayName = name;
      if (_uid) localStorage.setItem('jcr.nick.' + _uid, name);
    },
    // Sign out: clears all auth state and resolves when done
    signOut: function() {
      if (!_auth) return Promise.reject(new Error('Auth not initialised'));
      return _auth.signOut().then(function() {
        _uid = null;
        _displayName = null;
        _authPromise = null;
        _authRestorePromise = null;
        _loaded = false;
        _loading = null;
        _cache = {};
      });
    }
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function() { _load(); });
  } else {
    setTimeout(function() { _load(); }, 0);
  }
})();
