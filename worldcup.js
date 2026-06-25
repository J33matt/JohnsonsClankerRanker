// ============================ World Cup Tab ============================
// Three sub-tabs: Scores & Schedule, Standings & Bracket, Advancement Odds.
// Data: ESPN public FIFA World Cup endpoints (scoreboard + standings, no key).
// Reuses globals from index.html: _sbFetchEspnWcScoreboard, _sbWcFlag.

let _wczStandingsCache = null;
let _wczLiveTimer = null;
let _wczAdvCache = null;
const _wczExpanded = {};
const _wczSlotOpen = {};
function _wczToggleSlot(m) { _wczSlotOpen[m] = !_wczSlotOpen[m]; _wczRenderBracket(); }

function _wczStopLiveRefresh() { if (_wczLiveTimer) { clearInterval(_wczLiveTimer); _wczLiveTimer = null; } }

function _wczEnsureStyle() {
  if (document.getElementById('wcz-style')) return;
  const st = document.createElement('style');
  st.id = 'wcz-style';
  st.textContent = `
    .wc-team-row { transition: background 0.12s; }
    .wc-team-row:hover { background: rgba(255,255,255,0.06); }
    .wc-chevron { transition: transform 0.2s ease; display:inline-block; color: var(--muted); }
    .wc-team-row.open .wc-chevron { transform: rotate(180deg); }
  `;
  document.head.appendChild(st);
}

function showWcTab(tab, btn) {
  localStorage.setItem('activeWcTab', tab);
  document.querySelectorAll('#wc-tabs .tab-btn').forEach(b => b.classList.remove('active'));
  if (btn) btn.classList.add('active');
  document.querySelectorAll('.wc-panel').forEach(p => p.style.display = 'none');
  const panel = document.getElementById('wc-panel-' + tab);
  if (panel) panel.style.display = 'block';
  _wczStopLiveRefresh();
  if (tab === 'scores') { _wczRenderScores(); _wczLiveTimer = setInterval(_wczRenderScores, 30000); }
  else if (tab === 'bracket') _wczRenderBracket();
  else if (tab === 'advance') _wczRenderAdvance();
}

// ----------------------------- data -----------------------------
async function _wczFetchGroups() {
  if (_wczStandingsCache && Date.now() - _wczStandingsCache.ts < 60000) return _wczStandingsCache.data;
  const d = await fetch('https://site.api.espn.com/apis/v2/sports/soccer/fifa.world/standings').then(r => r.json());
  const groups = (d.children || []).map(g => {
    const letter = (g.name || '').replace(/group/i, '').trim();
    const teams = (g.standings?.entries || []).map(e => {
      const s = {}; (e.stats || []).forEach(x => s[x.name] = x.value);
      const desc = (e.note?.description || '');
      return {
        id: String(e.team.id), name: e.team.displayName, abbr: e.team.abbreviation || '',
        logo: e.team.logos?.[0]?.href || _sbWcFlag(e.team.displayName) || '',
        P: +s.points || 0, W: +s.wins || 0, D: +s.ties || 0, L: +s.losses || 0,
        GF: +s.pointsFor || 0, GA: +s.pointsAgainst || 0, GD: +s.pointDifferential || 0,
        gp: +s.gamesPlayed || 0, rank: +s.rank || 0,
        noteDesc: desc, noteColor: e.note?.color || '',
        // Only a confirmed berth — NOT ESPN's "Best 8 advance" label that marks
        // every third-place team (only 8 of the 12 actually go through).
        qualified: /round of 32/i.test(desc),
        eliminated: /eliminat/i.test(desc),
      };
    });
    return { letter, name: g.name, teams };
  }).sort((a, b) => a.letter.localeCompare(b.letter));
  _wczStandingsCache = { ts: Date.now(), data: groups };
  return groups;
}

function _wczTeamLogo(url, w) {
  return url ? `<img src="${url}" style="width:${w || 24}px;height:${Math.round((w || 24) * 0.67)}px;object-fit:cover;border-radius:2px;vertical-align:middle;flex-shrink:0" onerror="this.style.display='none'">` : '';
}

// ----------------------- Scores & Schedule -----------------------
function _wczMatchRow(ev) {
  const c = ev.competitions?.[0]; if (!c) return '';
  const h = c.competitors.find(x => x.homeAway === 'home') || c.competitors[0];
  const a = c.competitors.find(x => x.homeAway === 'away') || c.competitors[1];
  if (!h || !a) return '';
  const st = c.status?.type?.state || 'pre';
  const live = st === 'in', fin = st === 'post';
  const time = new Date(ev.date).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
  const mid = (live || fin)
    ? `<span style="font-family:'Bebas Neue',sans-serif;font-size:1.38rem;letter-spacing:1px">${h.score ?? 0} - ${a.score ?? 0}</span>`
    : `<span style="color:var(--muted);font-family:'Barlow Condensed',sans-serif;font-size:1.03rem">${time}</span>`;
  const sub = live
    ? `<span style="color:#22c55e;font-size:0.69rem;letter-spacing:1px;font-family:'Barlow Condensed',sans-serif">&#9679; ${c.status?.type?.shortDetail || 'LIVE'}</span>`
    : fin ? `<span style="color:var(--muted);font-size:0.69rem;letter-spacing:1px;font-family:'Barlow Condensed',sans-serif">FT</span>` : '';
  const nm = t => `<span style="font-family:'Barlow Condensed',sans-serif;font-size:1.13rem;letter-spacing:0.5px">${t.team.displayName}</span>`;
  return `<div style="display:flex;align-items:center;gap:10px;padding:10px 12px;border-bottom:1px solid rgba(255,255,255,0.05)">
    <div style="flex:1;display:flex;align-items:center;gap:8px;justify-content:flex-end;text-align:right;min-width:0">${nm(h)}${_wczTeamLogo(h.team.logo, 26)}</div>
    <div style="min-width:78px;text-align:center;display:flex;flex-direction:column;align-items:center;gap:1px">${mid}${sub}</div>
    <div style="flex:1;display:flex;align-items:center;gap:8px;min-width:0">${_wczTeamLogo(a.team.logo, 26)}${nm(a)}</div>
  </div>`;
}

async function _wczRenderScores() {
  const el = document.getElementById('wc-panel-scores'); if (!el) return;
  if (!el.dataset.init) { el.innerHTML = `<div class="loading-spinner"><div class="spinner"></div>Loading matches...</div>`; el.dataset.init = '1'; }
  let events;
  try { events = await _sbFetchEspnWcScoreboard(); }
  catch (e) { el.innerHTML = `<div style="padding:24px;color:var(--muted);font-family:'Barlow Condensed',sans-serif">Could not load matches.</div>`; return; }
  const evs = [...events].sort((a, b) => new Date(a.date) - new Date(b.date));
  const now = new Date(), todayKey = now.toDateString();
  const head = t => `<div style="font-family:'Bebas Neue',sans-serif;font-size:1.21rem;letter-spacing:2px;color:var(--muted);padding:14px 4px 6px">${t}</div>`;
  const wrap = rows => `<div style="border:1px solid var(--border);border-radius:8px;overflow:hidden">${rows}</div>`;

  let html = '';
  const today = evs.filter(e => new Date(e.date).toDateString() === todayKey);
  html += head("Today's Matches");
  html += today.length ? wrap(today.map(_wczMatchRow).join('')) : `<div style="padding:18px;color:var(--muted);font-family:'Barlow Condensed',sans-serif;letter-spacing:1px;border:1px solid var(--border);border-radius:8px">No matches scheduled today.</div>`;

  // Upcoming, grouped by date (future, not today), capped to keep it readable
  const upcoming = evs.filter(e => { const d = new Date(e.date); return d > now && d.toDateString() !== todayKey && (e.competitions?.[0]?.status?.type?.state || 'pre') === 'pre'; });
  const byDate = {};
  for (const e of upcoming) { const k = new Date(e.date).toDateString(); (byDate[k] = byDate[k] || []).push(e); }
  const dateKeys = Object.keys(byDate).slice(0, 8);
  if (dateKeys.length) {
    html += head('Upcoming Schedule');
    for (const k of dateKeys) {
      const label = new Date(k).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });
      html += `<div style="font-family:'Barlow Condensed',sans-serif;font-size:0.92rem;letter-spacing:1.5px;color:var(--accent2);padding:10px 4px 4px">${label}</div>`;
      html += wrap(byDate[k].map(_wczMatchRow).join(''));
    }
  }
  html += `<div style="text-align:center;color:rgba(255,255,255,0.3);font-family:'Barlow Condensed',sans-serif;font-size:0.81rem;letter-spacing:1px;padding:14px 0">Live scores refresh automatically every 30 seconds.</div>`;
  el.innerHTML = html;
}

// --------------------- Standings & Bracket ----------------------
function _wczGroupComplete(g) { return g.teams.length === 4 && g.teams.every(t => t.gp >= 3); }

function _wczStandingsTable(g) {
  const teams = [...g.teams].sort((a, b) => a.rank - b.rank);
  const rows = teams.map((t, i) => {
    const pos = i + 1;
    const band = pos <= 2 ? 'border-left:3px solid #22c55e' : pos === 3 ? 'border-left:3px solid var(--accent2)' : 'border-left:3px solid transparent';
    return `<tr style="${band}">
      <td style="padding:6px 6px;color:var(--muted);text-align:center;font-family:'Barlow Condensed',sans-serif">${pos}</td>
      <td style="padding:6px 6px"><div style="display:flex;align-items:center;gap:7px">${_wczTeamLogo(t.logo, 22)}<span style="font-family:'Barlow Condensed',sans-serif;font-size:1.06rem">${t.name}</span></div></td>
      <td style="text-align:center;color:var(--muted)">${t.gp}</td>
      <td style="text-align:center;color:var(--muted)">${t.W}-${t.D}-${t.L}</td>
      <td style="text-align:center;color:var(--muted)">${t.GD > 0 ? '+' + t.GD : t.GD}</td>
      <td style="text-align:center;font-family:'Bebas Neue',sans-serif;font-size:1.15rem">${t.P}</td>
    </tr>`;
  }).join('');
  return `<div style="border:1px solid var(--border);border-radius:8px;overflow:hidden">
    <div style="background:var(--surface2);padding:7px 12px;font-family:'Bebas Neue',sans-serif;letter-spacing:2px;font-size:1.15rem">${g.name}</div>
    <table style="width:100%;border-collapse:collapse;font-size:0.98rem">
      <thead><tr style="color:var(--muted);font-family:'Barlow Condensed',sans-serif;font-size:0.71rem;letter-spacing:1px;text-transform:uppercase">
        <th style="padding:5px 6px"></th><th style="text-align:left;padding:5px 6px">Team</th><th>GP</th><th>W-D-L</th><th>GD</th><th>Pts</th>
      </tr></thead><tbody>${rows}</tbody>
    </table>
  </div>`;
}

// Round of 32 slot allocation (2026 fixed structure).
const _WCZ_R32 = [
  { m: 73, a: { t: 'RU', g: 'A' }, b: { t: 'RU', g: 'B' } },
  { m: 74, a: { t: 'W', g: 'E' }, b: { t: '3', g: 'A/B/C/D/F' } },
  { m: 75, a: { t: 'W', g: 'F' }, b: { t: 'RU', g: 'C' } },
  { m: 76, a: { t: 'W', g: 'C' }, b: { t: 'RU', g: 'F' } },
  { m: 77, a: { t: 'W', g: 'I' }, b: { t: '3', g: 'C/D/F/G/H' } },
  { m: 78, a: { t: 'RU', g: 'E' }, b: { t: 'RU', g: 'I' } },
  { m: 79, a: { t: 'W', g: 'A' }, b: { t: '3', g: 'C/E/F/H/I' } },
  { m: 80, a: { t: 'W', g: 'L' }, b: { t: '3', g: 'E/H/I/J/K' } },
  { m: 81, a: { t: 'W', g: 'D' }, b: { t: '3', g: 'B/E/F/I/J' } },
  { m: 82, a: { t: 'W', g: 'G' }, b: { t: '3', g: 'A/E/H/I/J' } },
  { m: 83, a: { t: 'RU', g: 'K' }, b: { t: 'RU', g: 'L' } },
  { m: 84, a: { t: 'W', g: 'H' }, b: { t: 'RU', g: 'J' } },
  { m: 85, a: { t: 'W', g: 'B' }, b: { t: '3', g: 'E/F/G/I/J' } },
  { m: 86, a: { t: 'W', g: 'J' }, b: { t: 'RU', g: 'H' } },
  { m: 87, a: { t: 'W', g: 'K' }, b: { t: '3', g: 'D/E/I/J/L' } },
  { m: 88, a: { t: 'RU', g: 'D' }, b: { t: 'RU', g: 'G' } },
];

// The eight third-place slots and which groups' third-placed team may fill each.
const _WCZ_THIRD_SLOTS = _WCZ_R32.filter(mt => mt.b.t === '3').map(mt => ({ m: mt.m, g: new Set(mt.b.g.split('/')) }));
function _wczShuffle(a) { for (let i = a.length - 1; i > 0; i--) { const j = (Math.random() * (i + 1)) | 0; [a[i], a[j]] = [a[j], a[i]]; } return a; }
// Assign the eight qualifying third-place groups to the eight slots, respecting
// eligibility (a group can never meet the winner from its own group). A random
// VALID assignment is drawn each call; averaging over the simulation estimates how
// often each team lands in each slot. The official FIFA table fixes one specific
// assignment once the eight groups are known, so these are modelled odds.
function _wczAssignThirds(qLetters) {
  const slots = _wczShuffle(_WCZ_THIRD_SLOTS.slice());
  const used = {}, res = {};
  const bt = i => {
    if (i === slots.length) return true;
    const s = slots[i];
    for (const L of _wczShuffle(qLetters.filter(x => !used[x] && s.g.has(x)))) { used[L] = 1; res[s.m] = L; if (bt(i + 1)) return true; used[L] = 0; }
    return false;
  };
  bt(0); return res;
}

function _wczSlotHtml(slot, groupMap, adv, matchNum) {
  const place = adv?.place, prob = adv?.prob;
  // Third-place slot: list the eligible groups' current third-place team with its
  // chance of grabbing a wildcard berth (overall advance minus the chance it finishes
  // 1st/2nd). Which qualifier lands in THIS exact slot is set by FIFA's allocation table.
  if (slot.t === '3') {
    const feas = adv?.slotFeas?.[matchNum];
    const byId = adv?.teamById;
    if (feas && byId) {
      const spMap = {}; (adv.slotProb?.[matchNum] || []).forEach(x => spMap[x.id] = x.p);
      const ids = Object.keys(feas).sort((a, b) => (spMap[b] || 0) - (spMap[a] || 0));
      const open = _wczSlotOpen[matchNum];
      const fmtP = id => {
        const p = spMap[id];
        if (p == null) return ids.length === 1 ? '100%' : 'possible';
        if (p >= 0.9995 && ids.length > 1) return '>99%'; // not truly locked — another team is still possible
        if (p >= 0.005) return _wczPct(p);
        return '<1%';
      };
      const topT = byId[ids[0]];
      const headLine = topT ? `${topT.name} ${fmtP(ids[0])}` : 'To be determined';
      let body = '';
      if (open) {
        body = ids.map(id => {
          const t = byId[id]; if (!t) return '';
          const p = spMap[id] || 0;
          const col = p >= 0.5 ? '#22c55e' : p >= 0.2 ? 'var(--accent2)' : 'var(--muted)';
          const opp = adv.ownOpp?.[id] != null ? byId[adv.ownOpp[id]]?.name : null;
          const scen = _wczSlotScenario(feas[id], opp, t.name, adv.slotMiss?.[matchNum]?.[id]);
          return `<div style="padding:5px 0;border-top:1px solid rgba(255,255,255,0.05)">
            <div style="display:flex;align-items:center;gap:6px;font-family:'Barlow Condensed',sans-serif;font-size:0.9rem">
              ${_wczTeamLogo(t.logo, 18)}<span style="flex:1;min-width:0;color:var(--text);white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${t.name} <span style="color:var(--muted);font-size:0.78rem">(${t.group})</span></span>
              <span style="color:${col};font-weight:600;flex-shrink:0">${fmtP(id)}</span></div>
            ${scen ? `<div style="font-family:'Barlow Condensed',sans-serif;font-size:0.78rem;color:rgba(255,255,255,0.5);padding-left:24px;margin-top:1px">${scen}</div>` : ''}
          </div>`;
        }).join('');
      }
      return `<div>
        <div onclick="event.stopPropagation();_wczToggleSlot(${matchNum})" style="cursor:pointer;display:flex;align-items:center;gap:6px;font-family:'Barlow Condensed',sans-serif">
          <span style="font-size:0.78rem;color:var(--accent2);flex-shrink:0">Third place:</span>
          <span style="flex:1;min-width:0;font-size:0.92rem;color:var(--text);white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${headLine}</span>
          <span style="font-size:0.8rem;color:var(--muted);transform:${open ? 'rotate(180deg)' : 'none'};transition:transform 0.2s">&#9662;</span>
        </div>
        ${body}</div>`;
    }
    // Fallback (no simulation, e.g. group stage finished): list eligible groups' thirds.
    const rows = slot.g.split('/').map(L => {
      const g = groupMap[L]; if (!g) return '';
      const t = [...g.teams].sort((a, b) => a.rank - b.rank)[2]; if (!t) return '';
      const pp = place?.[t.id] || {}; const q = Math.max(0, (prob?.[t.id] || 0) - (pp.p1 || 0) - (pp.p2 || 0));
      let label, col;
      if (q >= 0.999) { label = 'Qualified'; col = '#22c55e'; }
      else if (q <= 0.001) { label = 'Out'; col = 'rgba(255,255,255,0.3)'; }
      else { label = _wczPct(q) + ' to qualify'; col = q >= 0.4 ? 'var(--accent2)' : 'var(--muted)'; }
      return `<div style="display:flex;align-items:center;gap:6px;padding:2px 0;font-family:'Barlow Condensed',sans-serif;font-size:0.9rem">
        ${_wczTeamLogo(t.logo, 18)}<span style="flex:1;min-width:0;color:var(--text);white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${t.name} <span style="color:var(--muted);font-size:0.78rem">(${L})</span></span>
        <span style="color:${col};font-weight:600;flex-shrink:0">${label}</span></div>`;
    }).join('');
    return `<div><div style="font-family:'Barlow Condensed',sans-serif;font-size:0.82rem;color:var(--accent2);margin-bottom:3px">Eligible third-place teams (one fills this slot):</div>${rows}</div>`;
  }
  const g = groupMap[slot.g];
  let team = null;
  if (g) {
    if (_wczGroupComplete(g)) {
      const sorted = [...g.teams].sort((a, b) => a.rank - b.rank);
      team = slot.t === 'W' ? sorted[0] : sorted[1];
    } else if (place) {
      // Fill a slot once that position is mathematically clinched (100% in the sim):
      // p1 for the group winner, p2 for the runner-up.
      const key = slot.t === 'W' ? 'p1' : 'p2';
      team = g.teams.find(t => (place[t.id]?.[key] || 0) >= 0.999) || null;
    }
  }
  if (team) return `<div style="display:flex;align-items:center;gap:7px">${_wczTeamLogo(team.logo, 22)}<span style="font-family:'Barlow Condensed',sans-serif;font-size:1.06rem">${team.name}</span></div>`;
  return `<div style="color:var(--muted);font-family:'Barlow Condensed',sans-serif;font-size:0.98rem">Group ${slot.g} ${slot.t === 'W' ? 'Winner' : 'Runner-up'}</div>`;
}

async function _wczRenderBracket() {
  const el = document.getElementById('wc-panel-bracket'); if (!el) return;
  if (!el.dataset.init) { el.innerHTML = `<div class="loading-spinner"><div class="spinner"></div>Loading standings...</div>`; el.dataset.init = '1'; }
  let groups, adv = null;
  try {
    groups = await _wczFetchGroups();
    adv = await _wczGetAdvData(groups).catch(() => null);
  }
  catch (e) { el.innerHTML = `<div style="padding:24px;color:var(--muted);font-family:'Barlow Condensed',sans-serif">Could not load standings.</div>`; return; }
  const groupMap = {}; groups.forEach(g => groupMap[g.letter] = g);

  let html = `<div style="font-family:'Bebas Neue',sans-serif;font-size:1.21rem;letter-spacing:2px;color:var(--muted);padding:4px 4px 10px">Group Standings</div>`;
  html += `<div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(280px,1fr));gap:12px">`;
  html += groups.map(_wczStandingsTable).join('');
  html += `</div>`;
  html += `<div style="font-family:'Barlow Condensed',sans-serif;font-size:0.78rem;letter-spacing:1px;color:rgba(255,255,255,0.35);padding:8px 4px">Green: top two (advance). Amber: third place (eight best advance as wildcards).</div>`;

  // Third-place wildcard race
  const thirds = groups.map(g => { const s = [...g.teams].sort((a, b) => a.rank - b.rank); return { ...s[2], group: g.letter, complete: _wczGroupComplete(g) }; })
    .filter(Boolean).sort((a, b) => b.P - a.P || b.GD - a.GD || b.GF - a.GF);
  html += `<div style="font-family:'Bebas Neue',sans-serif;font-size:1.21rem;letter-spacing:2px;color:var(--muted);padding:18px 4px 8px">Third-Place Wildcard Race</div>`;
  const wcCol = 'text-align:center;padding:7px 8px;flex-shrink:0';
  html += `<div style="border:1px solid var(--border);border-radius:8px;overflow:hidden">
    <div style="display:flex;align-items:center;background:var(--surface2);border-bottom:1px solid var(--border);font-family:'Barlow Condensed',sans-serif;font-size:0.78rem;letter-spacing:1px;text-transform:uppercase;color:var(--muted)">
      <span style="width:34px;${wcCol}">#</span>
      <span style="flex:1;text-align:left;padding:7px 8px">Team</span>
      <span style="width:48px;${wcCol}" title="Group points (1st tiebreaker)">Pts</span>
      <span style="width:48px;${wcCol}" title="Overall goal difference (2nd tiebreaker)">GD</span>
      <span style="width:48px;${wcCol}" title="Overall goals scored (3rd tiebreaker)">GF</span>
    </div>`;
  html += thirds.map((t, i) => {
    const inField = i < 8;
    return `<div style="display:flex;align-items:center;border-bottom:1px solid rgba(255,255,255,0.05);${inField ? 'background:rgba(34,197,94,0.06)' : ''}">
      <span style="width:34px;${wcCol};color:${inField ? '#22c55e' : 'var(--muted)'};font-family:'Bebas Neue',sans-serif;font-size:1.06rem">${i + 1}</span>
      <span style="flex:1;display:flex;align-items:center;gap:8px;padding:7px 8px;min-width:0">${_wczTeamLogo(t.logo, 22)}<span style="font-family:'Barlow Condensed',sans-serif;font-size:1.06rem;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${t.name} <span style="color:var(--muted);font-size:0.86rem">(${t.group})</span></span></span>
      <span style="width:48px;${wcCol};font-family:'Bebas Neue',sans-serif;font-size:1.06rem">${t.P}</span>
      <span style="width:48px;${wcCol};font-family:'Barlow Condensed',sans-serif;font-size:0.98rem;color:var(--muted)">${t.GD > 0 ? '+' + t.GD : t.GD}</span>
      <span style="width:48px;${wcCol};font-family:'Barlow Condensed',sans-serif;font-size:0.98rem;color:var(--muted)">${t.GF}</span>
    </div>`;
  }).join('');
  html += `</div><div style="font-family:'Barlow Condensed',sans-serif;font-size:0.78rem;letter-spacing:1px;color:rgba(255,255,255,0.35);padding:8px 4px">Top eight (green) qualify. Ranked by points, then overall goal difference, then goals scored; fair-play points and FIFA ranking break any remaining ties.</div>`;

  // Round of 32 bracket allocation
  html += `<div style="font-family:'Bebas Neue',sans-serif;font-size:1.21rem;letter-spacing:2px;color:var(--muted);padding:18px 4px 8px">Round of 32</div>`;
  html += `<div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(300px,1fr));gap:10px">`;
  html += _WCZ_R32.map(mt => `<div style="border:1px solid var(--border);border-radius:8px;overflow:hidden">
      <div style="background:var(--surface2);padding:4px 10px;font-family:'Barlow Condensed',sans-serif;font-size:0.71rem;letter-spacing:1.5px;color:var(--muted)">MATCH ${mt.m}</div>
      <div style="padding:9px 12px;border-bottom:1px solid rgba(255,255,255,0.05)">${_wczSlotHtml(mt.a, groupMap, adv, mt.m)}</div>
      <div style="padding:9px 12px">${_wczSlotHtml(mt.b, groupMap, adv, mt.m)}</div>
    </div>`).join('');
  html += `</div>`;
  html += `<div style="font-family:'Barlow Condensed',sans-serif;font-size:0.78rem;letter-spacing:1px;color:rgba(255,255,255,0.35);padding:10px 4px 4px">Winner/runner-up slots fill once clinched. Tap a third-place slot to see every team that can still reach it, its chance of doing so, and the result it needs. Percentages are the realistic chance (FIFA's official allocation table decides the exact slot); the candidate list comes from an exhaustive possibility search, so even long-shot paths are shown.</div>`;
  el.innerHTML = html;
}

// ----------------------- Advancement Odds -----------------------
// Match-level Monte Carlo with the 2026 group tiebreakers (head-to-head first).
function _wczStrength(t) { const gp = Math.max(1, t.gp); return (t.P / gp) + 0.35 * (t.GD / gp); }
function _wczPois(l) { const L = Math.exp(-l); let k = 0, p = 1; do { k++; p *= Math.random(); } while (p > L); return k - 1; }
function _wczSimMatch(a, b) {
  const d = (a.str ?? 0) - (b.str ?? 0);
  const la = Math.min(6, Math.max(0.15, 1.35 * Math.exp(0.45 * d)));
  const lb = Math.min(6, Math.max(0.15, 1.35 * Math.exp(-0.45 * d)));
  return [_wczPois(la), _wczPois(lb)];
}
// Cross-group comparator for the third-place pool (no head-to-head between groups):
// points, overall goal difference, goals scored, then strength as a stable proxy.
function _wczCmp(a, b) { return b.P - a.P || b.GD - a.GD || b.GF - a.GF || b.str - a.str; }

// 2026 tiebreak for a set of teams level on points. Head-to-head points, then
// H2H goal difference, then H2H goals — and whenever a step separates the set
// into smaller still-tied subsets, the procedure restarts from H2H points for
// each subset. If still tied after H2H, fall back to overall GD, GF, strength.
function _wczBreakTie(ids, matches, st) {
  if (ids.length === 1) return [st[ids[0]]];
  const set = new Set(ids);
  const mini = {}; ids.forEach(id => mini[id] = { P: 0, GD: 0, GF: 0 });
  for (const m of matches) {
    if (!set.has(m.a) || !set.has(m.b)) continue;
    const A = mini[m.a], B = mini[m.b];
    A.GF += m.as; A.GD += m.as - m.bs; B.GF += m.bs; B.GD += m.bs - m.as;
    if (m.as > m.bs) A.P += 3; else if (m.bs > m.as) B.P += 3; else { A.P++; B.P++; }
  }
  for (const key of ['P', 'GD', 'GF']) {
    const vals = [...new Set(ids.map(id => mini[id][key]))];
    if (vals.length > 1) {
      vals.sort((x, y) => y - x);
      let res = [];
      for (const v of vals) res = res.concat(_wczBreakTie(ids.filter(id => mini[id][key] === v), matches, st));
      return res;
    }
  }
  return [...ids].sort((x, y) => st[y].GD - st[x].GD || st[y].GF - st[x].GF || st[y].str - st[x].str).map(id => st[id]);
}

// Final group order (1st..4th) applying the tiebreakers within equal-point blocks.
function _wczRankGroup(ids, matches, st) {
  const arr = ids.map(id => st[id]).sort((a, b) => b.P - a.P);
  const out = []; let block = [];
  for (let i = 0; i < arr.length; i++) {
    if (i > 0 && arr[i].P !== arr[i - 1].P) { out.push(block); block = []; }
    block.push(arr[i]);
  }
  if (block.length) out.push(block);
  const order = [];
  for (const b of out) order.push(...(b.length === 1 ? [b[0]] : _wczBreakTie(b.map(t => t.id), matches, st)));
  return order.map(t => t.id);
}

// Pull every group match (played, with scores) and remaining fixtures from the scoreboard.
async function _wczPrepSim(groups) {
  const teamGroup = {}, meta = {};
  groups.forEach(g => g.teams.forEach(t => { teamGroup[t.id] = g.letter; meta[t.id] = { str: _wczStrength(t) }; }));
  const events = await _sbFetchEspnWcScoreboard();
  // Seed each team from ESPN's authoritative aggregate (always complete, even if
  // the scoreboard feed drops a played match). Found played matches are kept only
  // to drive head-to-head tiebreakers; remaining fixtures come from the feed.
  const perGroup = {}; groups.forEach(g => perGroup[g.letter] = {
    ids: g.teams.map(t => t.id),
    agg: Object.fromEntries(g.teams.map(t => [t.id, { P: t.P, GF: t.GF, GA: t.GA }])),
    played: [], remaining: [],
  });
  for (const ev of events) {
    const c = ev.competitions?.[0]; if (!c) continue;
    const comp = c.competitors || []; if (comp.length !== 2) continue;
    const home = comp.find(x => x.homeAway === 'home') || comp[0];
    const away = comp.find(x => x.homeAway === 'away') || comp[1];
    const ha = String(home.team.id), aw = String(away.team.id);
    const g = teamGroup[ha]; if (!g || g !== teamGroup[aw]) continue;
    if ((c.status?.type?.state || 'pre') === 'post') perGroup[g].played.push({ a: ha, b: aw, as: +home.score || 0, bs: +away.score || 0 });
    else perGroup[g].remaining.push({ a: ha, b: aw });
  }
  return { perGroup, meta };
}

function _wczBucket() { return { _all: [0, 0], a: [0, 0], d: [0, 0], b: [0, 0] }; }

function _wczSimDetailed(groups, prep, N) {
  const { perGroup, meta } = prep;
  const ids = []; groups.forEach(g => g.teams.forEach(t => ids.push(t.id)));
  const adv = {}; const cond = {}; const place = {};
  ids.forEach(id => { adv[id] = 0; place[id] = [0, 0, 0, 0]; cond[id] = { win: _wczBucket(), draw: _wczBucket(), loss: _wczBucket() }; });
  const slotTally = {}; _WCZ_THIRD_SLOTS.forEach(s => slotTally[s.m] = {});
  const qThird = {}; groups.forEach(g => qThird[g.letter] = 0); // P(group's third qualifies)

  // Per-team final-matchday context: own opponent and the "other" group match (o1 vs o2).
  const info = {};
  for (const g of groups) {
    const pg = perGroup[g.letter], rem = pg.remaining;
    const remCount = {}; pg.ids.forEach(id => remCount[id] = 0);
    rem.forEach(m => { remCount[m.a]++; remCount[m.b]++; });
    const detailed = rem.length === 2 && pg.ids.every(id => remCount[id] === 1);
    for (const id of pg.ids) {
      const my = rem.find(m => m.a === id || m.b === id);
      const oppId = my ? (my.a === id ? my.b : my.a) : null;
      let o1 = null, o2 = null;
      if (detailed) { const other = rem.find(m => m !== my); if (other) { o1 = other.a; o2 = other.b; } }
      info[id] = { oppId, o1, o2, detailed: detailed && !!o1, hasMatch: !!my };
    }
  }

  for (let it = 0; it < N; it++) {
    const simRes = {}; const thirds = [];
    for (const g of groups) {
      const pg = perGroup[g.letter];
      // Seed from the authoritative aggregate, then add simulated remaining matches.
      const st = {}; pg.ids.forEach(id => { const a = pg.agg[id]; st[id] = { id, P: a.P, GF: a.GF, GA: a.GA, GD: a.GF - a.GA, str: meta[id].str }; });
      const matches = pg.played.slice();
      for (const m of pg.remaining) {
        const [as, bs] = _wczSimMatch(meta[m.a], meta[m.b]);
        matches.push({ a: m.a, b: m.b, as, bs }); simRes[m.a + '_' + m.b] = { as, bs };
        const A = st[m.a], B = st[m.b];
        A.GF += as; A.GA += bs; B.GF += bs; B.GA += as;
        if (as > bs) A.P += 3; else if (bs > as) B.P += 3; else { A.P++; B.P++; }
      }
      pg.ids.forEach(id => { st[id].GD = st[id].GF - st[id].GA; });
      const order = _wczRankGroup(pg.ids, matches, st);
      st[order[0]].adv = true; st[order[1]].adv = true;
      for (let i = 0; i < order.length && i < 4; i++) place[order[i]][i]++;
      const third = st[order[2]]; third.grp = g.letter; thirds.push(third);
      pg._st = st;
    }
    thirds.sort(_wczCmp);
    for (let i = 0; i < 8 && i < thirds.length; i++) { thirds[i].adv = true; qThird[thirds[i].grp]++; }

    // Assign the eight qualifying thirds to the eight knockout slots using FIFA's
    // official allocation table (exact), falling back to a valid matching if needed.
    const q8 = thirds.slice(0, 8);
    const teamByLetter = {}; q8.forEach(t => teamByLetter[t.grp] = t.id);
    const key = q8.map(t => t.grp).sort().join('');
    const assign = (typeof _WCZ_ALLOC !== 'undefined' && _WCZ_ALLOC[key]) || _wczAssignThirds(q8.map(t => t.grp));
    for (const s of _WCZ_THIRD_SLOTS) { const L = assign[s.m]; if (L == null) continue; const tid = teamByLetter[L]; if (tid) slotTally[s.m][tid] = (slotTally[s.m][tid] || 0) + 1; }

    for (const g of groups) {
      const pg = perGroup[g.letter];
      for (const id of pg.ids) {
        const a = pg._st[id].adv ? 1 : 0; if (a) adv[id]++;
        const inf = info[id]; if (!inf || !inf.hasMatch) continue;
        const my = pg.remaining.find(m => m.a === id || m.b === id);
        const r = simRes[my.a + '_' + my.b]; const isA = my.a === id;
        const own = r.as === r.bs ? 'draw' : ((r.as > r.bs) === isA ? 'win' : 'loss');
        const bk = cond[id][own]; bk._all[1]++; if (a) bk._all[0]++;
        if (inf.detailed) {
          const orr = simRes[inf.o1 + '_' + inf.o2];
          const ok = orr.as === orr.bs ? 'd' : (orr.as > orr.bs ? 'a' : 'b');
          bk[ok][1]++; if (a) bk[ok][0]++;
        }
      }
      pg._st = null;
    }
  }

  const prob = {}, condP = {}, placeP = {};
  const pr = bk => bk[1] ? bk[0] / bk[1] : null;
  ids.forEach(id => {
    prob[id] = adv[id] / N;
    placeP[id] = { p1: place[id][0] / N, p2: place[id][1] / N, p3: place[id][2] / N, p4: place[id][3] / N };
    const c = cond[id];
    condP[id] = {
      win: { all: pr(c.win._all), a: pr(c.win.a), d: pr(c.win.d), b: pr(c.win.b) },
      draw: { all: pr(c.draw._all), a: pr(c.draw.a), d: pr(c.draw.d), b: pr(c.draw.b) },
      loss: { all: pr(c.loss._all), a: pr(c.loss.a), d: pr(c.loss.d), b: pr(c.loss.b) },
    };
  });
  const slotProb = {};
  _WCZ_THIRD_SLOTS.forEach(s => { slotProb[s.m] = Object.entries(slotTally[s.m]).map(([id, c]) => ({ id, p: c / N })).sort((a, b) => b.p - a.p); });
  const qThirdP = {}; for (const g in qThird) qThirdP[g] = qThird[g] / N;
  return { prob, cond: condP, info, place: placeP, slotProb, qThird: qThirdP };
}

// Most likely qualifying combination among the FEASIBLE ones (those actually observed
// in the possibility search, so impossible group-sets are excluded), scored by each
// group's third-qualifying probability. Returns the sorted 8-group key, or null.
function _wczBestComboFrom(keys, qThird) {
  const cl = x => Math.min(0.999, Math.max(0.001, x || 0));
  let best = null, bestScore = -Infinity;
  for (const key of keys) {
    const inSet = new Set(key.split(''));
    let s = 0; for (const g in qThird) s += inSet.has(g) ? Math.log(cl(qThird[g])) : Math.log(1 - cl(qThird[g]));
    if (s > bestScore) { bestScore = s; best = key; }
  }
  return best;
}

function _wczList(a) { return a.length <= 1 ? (a[0] || '') : a.length === 2 ? `${a[0]} and ${a[1]}` : `${a.slice(0, -1).join(', ')} and ${a[a.length - 1]}`; }

// Possibility search: simulate the remaining matches with UNIFORM scoring (no team
// strength) over a large sample to surface every team that can still reach each
// third-place slot, and which of their own results keeps that path open. This finds
// rare-but-possible outcomes the realistic simulation almost never samples.
function _wczPossib(groups, prep, N) {
  const { perGroup } = prep;
  const ownKey = {}, ownOpp = {};
  for (const g of groups) for (const m of perGroup[g.letter].remaining) {
    ownKey[m.a] = { k: m.a + '_' + m.b, isA: true }; ownKey[m.b] = { k: m.a + '_' + m.b, isA: false };
    ownOpp[m.a] = m.b; ownOpp[m.b] = m.a;
  }
  const slotFeas = {}; _WCZ_THIRD_SLOTS.forEach(s => slotFeas[s.m] = {});
  for (let it = 0; it < N; it++) {
    const simRes = {}, thirds = [];
    for (const g of groups) {
      const pg = perGroup[g.letter];
      const st = {}; pg.ids.forEach(id => { const a = pg.agg[id]; st[id] = { id, P: a.P, GF: a.GF, GA: a.GA, GD: a.GF - a.GA, str: 0 }; });
      const matches = pg.played.slice();
      for (const m of pg.remaining) {
        const as = _wczPois(1.3), bs = _wczPois(1.3);
        matches.push({ a: m.a, b: m.b, as, bs }); simRes[m.a + '_' + m.b] = { as, bs };
        const A = st[m.a], B = st[m.b]; A.GF += as; A.GA += bs; B.GF += bs; B.GA += as;
        if (as > bs) A.P += 3; else if (bs > as) B.P += 3; else { A.P++; B.P++; }
      }
      pg.ids.forEach(id => st[id].GD = st[id].GF - st[id].GA);
      const order = _wczRankGroup(pg.ids, matches, st);
      const third = st[order[2]]; third.grp = g.letter; thirds.push(third);
    }
    thirds.sort(_wczCmp);
    const q8 = thirds.slice(0, 8);
    const teamByLetter = {}; q8.forEach(t => teamByLetter[t.grp] = t.id);
    const key = q8.map(t => t.grp).sort().join('');
    const assign = (typeof _WCZ_ALLOC !== 'undefined' && _WCZ_ALLOC[key]) || _wczAssignThirds(q8.map(t => t.grp));
    for (const s of _WCZ_THIRD_SLOTS) {
      const L = assign[s.m]; if (L == null) continue; const id = teamByLetter[L]; if (!id) continue;
      let f = slotFeas[s.m][id]; if (!f) { f = { win: false, draw: false, loss: false, hasMatch: ownKey[id] != null, combos: {} }; slotFeas[s.m][id] = f; }
      f.combos[key] = true;
      const ok = ownKey[id]; if (ok) { const r = simRes[ok.k]; if (r) { const own = r.as === r.bs ? 'draw' : ((r.as > r.bs) === ok.isA ? 'win' : 'loss'); f[own] = true; } }
    }
  }
  return { slotFeas, ownOpp };
}

// "Most likely path" for a team to take a slot: its own-match requirement (from the
// possibility search) plus which groups' thirds most likely miss the cut.
function _wczSlotScenario(f, opp, team, missing) {
  if (!f) return '';
  const parts = [];
  if (f.hasMatch && opp) {
    const res = ['win', 'draw', 'loss'].filter(k => f[k]);
    const verb = { win: `beats ${opp}`, draw: `draws with ${opp}`, loss: `loses to ${opp}` };
    if (res.length >= 3) parts.push(`${team} finishes 3rd in its group`);
    else if (res.length === 1) parts.push(`${team} ${verb[res[0]]}`);
    else if (res.length) parts.push(`${team} ${res.map(k => k === 'win' ? 'wins' : k === 'draw' ? 'draws' : 'loses').join(' or ')} vs ${opp}`);
  }
  if (missing && missing.length) parts.push(`the third-placed teams of Group${missing.length > 1 ? 's' : ''} ${_wczList(missing)} miss the cut`);
  if (!parts.length) return '';
  return `Most likely: ${parts.join(', and ')}.`;
}

function _wczPct(p) { if (p == null) return '—'; if (p >= 0.999) return '100%'; if (p <= 0.001) return '0%'; const v = p * 100; return (v < 10 ? v.toFixed(1) : v.toFixed(0)) + '%'; }
function _wczToggleTeam(id) { _wczExpanded[id] = !_wczExpanded[id]; _wczRenderAdvance(true); }

// Shared advancement simulation (prob/place/cond), cached for 60s — used by both
// the Advancement Odds tab and the bracket (to fill clinched slots early).
async function _wczGetAdvData(groups) {
  if (_wczAdvCache && Date.now() - _wczAdvCache.ts < 60000) return _wczAdvCache;
  const prep = await _wczPrepSim(groups);
  const anyRemaining = Object.values(prep.perGroup).some(pg => pg.remaining.length);
  let data, qThird;
  if (!anyRemaining) {
    const prob = {}, cond = {}, info = {}, place = {};
    groups.forEach(g => g.teams.forEach(t => {
      prob[t.id] = (t.qualified || t.rank <= 2) ? 1 : 0;
      place[t.id] = { p1: t.rank === 1 ? 1 : 0, p2: t.rank === 2 ? 1 : 0, p3: t.rank === 3 ? 1 : 0, p4: t.rank === 4 ? 1 : 0 };
      cond[t.id] = { win: {}, draw: {}, loss: {} }; info[t.id] = { hasMatch: false };
    }));
    data = { ts: Date.now(), prob, cond, info, place };
    // third qualifies => among the eight best current thirds
    const thirds = groups.map(g => ({ g: g.letter, t: [...g.teams].sort((a, b) => a.rank - b.rank)[2] }))
      .sort((a, b) => b.t.P - a.t.P || b.t.GD - a.t.GD || b.t.GF - a.t.GF);
    qThird = {}; thirds.forEach((x, i) => qThird[x.g] = i < 8 ? 1 : 0);
  } else {
    const r = _wczSimDetailed(groups, prep, 4000);
    data = { ts: Date.now(), prob: r.prob, cond: r.cond, info: r.info, place: r.place, slotProb: r.slotProb };
    qThird = r.qThird;
  }
  // Broad possibility search: which teams can still reach each slot + own-result needed.
  const poss = _wczPossib(groups, prep, anyRemaining ? 10000 : 1);
  data.slotFeas = poss.slotFeas; data.ownOpp = poss.ownOpp;
  data.teamById = {};
  groups.forEach(g => g.teams.forEach(t => data.teamById[t.id] = { ...t, group: g.letter }));
  // Most-likely missing groups (the modal qualifying combination) per candidate.
  data.slotMiss = {};
  const allLetters = groups.map(g => g.letter);
  for (const s of _WCZ_THIRD_SLOTS) {
    data.slotMiss[s.m] = {};
    for (const id in (data.slotFeas[s.m] || {})) {
      const keys = Object.keys(data.slotFeas[s.m][id].combos || {});
      const best = _wczBestComboFrom(keys, qThird);
      if (best) { const inSet = new Set(best.split('')); data.slotMiss[s.m][id] = allLetters.filter(L => !inSet.has(L)); }
    }
  }
  _wczAdvCache = data;
  return data;
}

async function _wczRenderAdvance(fromToggle) {
  const el = document.getElementById('wc-panel-advance'); if (!el) return;
  _wczEnsureStyle();
  if (!fromToggle && !el.dataset.init) { el.innerHTML = `<div class="loading-spinner"><div class="spinner"></div>Simulating tournament...</div>`; el.dataset.init = '1'; }
  let groups, data;
  try {
    groups = await _wczFetchGroups();
    data = await _wczGetAdvData(groups);
  } catch (e) { el.innerHTML = `<div style="padding:24px;color:var(--muted);font-family:'Barlow Condensed',sans-serif">Could not load data.</div>`; return; }

  const tmap = {}; groups.forEach(g => g.teams.forEach(t => tmap[t.id] = { ...t, group: g.letter }));
  const pl = id => data.place?.[id] || { p1: 0, p2: 0, p3: 0 };
  const all = Object.values(tmap).sort((a, b) =>
    (data.prob[b.id] - data.prob[a.id]) ||
    (pl(b.id).p1 - pl(a.id).p1) ||
    (pl(b.id).p2 - pl(a.id).p2) ||
    (pl(b.id).p3 - pl(a.id).p3) ||
    b.P - a.P || b.GD - a.GD);

  let html = `<div style="font-family:'Bebas Neue',sans-serif;font-size:1.21rem;letter-spacing:2px;color:var(--muted);padding:4px 4px 4px">Probability of Reaching the Round of 32</div>`;
  html += `<div style="font-family:'Barlow Condensed',sans-serif;font-size:0.81rem;letter-spacing:1px;color:rgba(255,255,255,0.35);padding:0 4px 12px">Monte Carlo simulation of the remaining group matches using the 2026 tiebreakers (head-to-head first). Tap a country for its qualification scenarios.</div>`;
  const colHead = (txt, w) => `<span style="width:${w}px;text-align:right;flex-shrink:0">${txt}</span>`;
  html += `<div style="border:1px solid var(--border);border-radius:8px;overflow:hidden">`;
  html += `<div style="display:flex;align-items:center;gap:8px;padding:7px 12px;background:var(--surface2);border-bottom:1px solid var(--border);font-family:'Barlow Condensed',sans-serif;font-size:0.78rem;letter-spacing:1px;text-transform:uppercase;color:var(--muted)">
      <span style="width:24px;flex-shrink:0"></span>
      <span style="flex:1">Team</span>
      ${colHead('1st', 44)}${colHead('2nd', 44)}${colHead('3rd', 44)}${colHead('R32', 50)}
      <span style="width:14px;flex-shrink:0"></span>
    </div>`;
  const col = (val, w, color, strong) => `<span style="width:${w}px;text-align:right;flex-shrink:0;font-family:'${strong ? 'Bebas Neue' : 'Barlow Condensed'}',sans-serif;font-size:${strong ? '1.13rem' : '0.98rem'};color:${color}">${val}</span>`;
  for (const t of all) {
    const p = data.prob[t.id];
    const pl = data.place[t.id] || { p1: 0, p2: 0, p3: 0, p4: 0 };
    const pColor = p >= 0.999 ? '#22c55e' : p <= 0.001 ? '#ef4444' : p >= 0.5 ? 'var(--text)' : 'var(--muted)';
    const dim = v => v <= 0.001 ? 'rgba(255,255,255,0.25)' : 'var(--text)';
    const open = _wczExpanded[t.id];
    html += `<div onclick="_wczToggleTeam('${t.id}')" class="wc-team-row${open ? ' open' : ''}" style="cursor:pointer;padding:9px 12px;border-bottom:1px solid rgba(255,255,255,0.05);${open ? 'background:rgba(255,255,255,0.04)' : ''}">
      <div style="display:flex;align-items:center;gap:8px">
        ${_wczTeamLogo(t.logo, 24)}
        <span style="flex:1;min-width:0;font-family:'Barlow Condensed',sans-serif;font-size:1.09rem;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${t.name} <span style="color:var(--muted);font-size:0.86rem">(Grp ${t.group})</span></span>
        ${col(_wczPct(pl.p1), 44, dim(pl.p1))}
        ${col(_wczPct(pl.p2), 44, dim(pl.p2))}
        ${col(_wczPct(pl.p3), 44, dim(pl.p3))}
        ${col(_wczPct(p), 50, pColor, true)}
        <span class="wc-chevron" style="font-size:0.8rem;width:14px;text-align:center;flex-shrink:0">&#9662;</span>
      </div>
      ${open ? _wczTeamDetail(t, data, tmap) : ''}
    </div>`;
  }
  html += `</div>`;
  html += `<div style="font-family:'Barlow Condensed',sans-serif;font-size:0.76rem;letter-spacing:0.5px;color:rgba(255,255,255,0.3);padding:10px 4px">Group ranking applies head-to-head points, head-to-head goal difference and goals, then overall goal difference and goals scored, per the 2026 rules.</div>`;
  el.innerHTML = html;
}

function _wczBranch(p) {
  if (p == null) return ['—', 'var(--muted)'];
  if (p >= 0.995) return ['Advances', '#22c55e'];
  if (p <= 0.005) return ['Eliminated', '#ef4444'];
  return [_wczPct(p) + ' (goals / 3rd-place race)', p >= 0.5 ? '#9be3b4' : 'var(--muted)'];
}

function _wczTeamDetail(t, data, tmap) {
  const p = data.prob[t.id];
  const info = data.info[t.id] || {};
  const nm = id => tmap[id]?.name || 'opponent';
  // Label on the left, value on the right; the grouped cards keep them associated.
  const leader = (label, value, color, o = {}) => `<div style="display:flex;align-items:center;justify-content:space-between;gap:10px;${o.indent ? 'padding:4px 0 4px 16px' : 'padding:5px 0'};font-family:'Barlow Condensed',sans-serif;font-size:${o.size || '0.9rem'}">
      <span style="color:${o.labelColor || 'var(--muted)'};font-weight:${o.bold ? '700' : '400'}">${label}</span>
      <span style="color:${color || 'var(--text)'};white-space:nowrap;font-weight:600;text-align:right">${value}</span>
    </div>`;
  const current = leader('Current', `${t.P} pts &middot; ${t.W}-${t.D}-${t.L} &middot; ${t.GD > 0 ? '+' + t.GD : t.GD} GD &middot; ${t.gp} GP`, 'var(--text)');

  // Projected group finish (placement probabilities from the simulation).
  const pl = data.place?.[t.id];
  let finishBlock = '';
  if (pl) {
    finishBlock = `<div style="margin-top:8px;padding:6px 9px;background:rgba(255,255,255,0.03);border-radius:6px">`
      + leader('Projected group finish', '', null, { bold: true, labelColor: 'var(--text)', size: '0.92rem' })
      + leader('Win the group (1st)', _wczPct(pl.p1), '#22c55e', { indent: true, size: '0.85rem' })
      + leader('Runner-up (2nd)', _wczPct(pl.p2), '#22c55e', { indent: true, size: '0.85rem' })
      + leader('Third place (3rd)', _wczPct(pl.p3), 'var(--accent2)', { indent: true, size: '0.85rem' })
      + leader('Bottom of group (4th)', _wczPct(pl.p4), 'var(--muted)', { indent: true, size: '0.85rem' })
      + `</div>`;
  }

  let body = '';
  if (p >= 0.999) body = leader('Status', 'Qualified for the Round of 32', '#22c55e');
  else if (p <= 0.001) body = leader('Status', 'Eliminated', '#ef4444');
  else if (!info.hasMatch) body = leader('Status', "Depends on other groups' 3rd-place teams", 'var(--accent2)');
  else if (info.detailed) {
    const c = data.cond[t.id];
    const o1 = nm(info.o1), o2 = nm(info.o2), opp = nm(info.oppId);
    const seg = (verb, bucket) => {
      if (!bucket || bucket.all == null) return '';
      const settle = bucket.all >= 0.999 ? 'in' : bucket.all <= 0.001 ? 'out' : null;
      const headVal = settle === 'in' ? 'Through (100%)' : settle === 'out' ? 'Out (0%)' : `${_wczPct(bucket.all)} to advance`;
      const headColor = settle === 'out' ? '#ef4444' : bucket.all >= 0.5 ? '#22c55e' : 'var(--muted)';
      let block = leader(`If ${t.name} ${verb}`, headVal, headColor, { bold: true, labelColor: 'var(--text)', size: '0.92rem' });
      if (!settle) {
        const branch = (lbl, pr) => { const [txt, col] = _wczBranch(pr); return leader(lbl, txt, col, { indent: true, size: '0.85rem' }); };
        block += branch(`${o1} beat ${o2}`, bucket.a) + branch(`${o1} & ${o2} draw`, bucket.d) + branch(`${o2} beat ${o1}`, bucket.b);
      }
      return `<div style="margin-top:8px;padding:6px 9px;background:rgba(255,255,255,0.03);border-radius:6px">${block}</div>`;
    };
    body = leader('Final match', `vs ${opp}`, 'var(--text)')
      + `<div style="margin-top:2px;font-family:'Barlow Condensed',sans-serif;font-size:0.94rem;color:rgba(255,255,255,0.45)">Other match in the group: ${o1} vs ${o2}</div>`
      + seg('win', c.win) + seg('draw', c.draw) + seg('lose', c.loss);
  } else {
    const c = data.cond[t.id];
    body = leader('Final match', `vs ${nm(info.oppId)}`, 'var(--text)')
      + leader('If they win', _wczPct(c.win?.all) + ' to advance', (c.win?.all ?? 0) >= 0.5 ? '#22c55e' : 'var(--text)')
      + leader('If they draw', _wczPct(c.draw?.all) + ' to advance', (c.draw?.all ?? 0) >= 0.5 ? '#22c55e' : 'var(--muted)')
      + leader('If they lose', _wczPct(c.loss?.all) + ' to advance', (c.loss?.all ?? 0) >= 0.5 ? '#22c55e' : '#ef4444');
  }
  return `<div style="margin-top:8px;padding:8px 4px 2px;border-top:1px solid rgba(255,255,255,0.06)">${current}${finishBlock}${body}</div>`;
}
