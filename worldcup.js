// ============================ World Cup Tab ============================
// Three sub-tabs: Scores & Schedule, Standings & Bracket, Advancement Odds.
// Data: ESPN public FIFA World Cup endpoints (scoreboard + standings, no key).
// Reuses globals from index.html: _sbFetchEspnWcScoreboard, _sbWcFlag.

let _wczStandingsCache = null;
let _wczLiveTimer = null;
let _wczAdvCache = null;
const _wczExpanded = {};

function _wczStopLiveRefresh() { if (_wczLiveTimer) { clearInterval(_wczLiveTimer); _wczLiveTimer = null; } }

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
        qualified: /advance|qualif/i.test(desc),
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
    ? `<span style="font-family:'Bebas Neue',sans-serif;font-size:1.2rem;letter-spacing:1px">${h.score ?? 0} - ${a.score ?? 0}</span>`
    : `<span style="color:var(--muted);font-family:'Barlow Condensed',sans-serif;font-size:0.9rem">${time}</span>`;
  const sub = live
    ? `<span style="color:#22c55e;font-size:0.6rem;letter-spacing:1px;font-family:'Barlow Condensed',sans-serif">&#9679; ${c.status?.type?.shortDetail || 'LIVE'}</span>`
    : fin ? `<span style="color:var(--muted);font-size:0.6rem;letter-spacing:1px;font-family:'Barlow Condensed',sans-serif">FT</span>` : '';
  const nm = t => `<span style="font-family:'Barlow Condensed',sans-serif;font-size:0.98rem;letter-spacing:0.5px">${t.team.displayName}</span>`;
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
  const head = t => `<div style="font-family:'Bebas Neue',sans-serif;font-size:1.05rem;letter-spacing:2px;color:var(--muted);padding:14px 4px 6px">${t}</div>`;
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
      html += `<div style="font-family:'Barlow Condensed',sans-serif;font-size:0.8rem;letter-spacing:1.5px;color:var(--accent2);padding:10px 4px 4px">${label}</div>`;
      html += wrap(byDate[k].map(_wczMatchRow).join(''));
    }
  }
  html += `<div style="text-align:center;color:rgba(255,255,255,0.3);font-family:'Barlow Condensed',sans-serif;font-size:0.7rem;letter-spacing:1px;padding:14px 0">Live scores refresh automatically every 30 seconds.</div>`;
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
      <td style="padding:6px 6px"><div style="display:flex;align-items:center;gap:7px">${_wczTeamLogo(t.logo, 22)}<span style="font-family:'Barlow Condensed',sans-serif;font-size:0.92rem">${t.name}</span></div></td>
      <td style="text-align:center;color:var(--muted)">${t.gp}</td>
      <td style="text-align:center;color:var(--muted)">${t.W}-${t.D}-${t.L}</td>
      <td style="text-align:center;color:var(--muted)">${t.GD > 0 ? '+' + t.GD : t.GD}</td>
      <td style="text-align:center;font-family:'Bebas Neue',sans-serif;font-size:1rem">${t.P}</td>
    </tr>`;
  }).join('');
  return `<div style="border:1px solid var(--border);border-radius:8px;overflow:hidden">
    <div style="background:var(--surface2);padding:7px 12px;font-family:'Bebas Neue',sans-serif;letter-spacing:2px;font-size:1rem">${g.name}</div>
    <table style="width:100%;border-collapse:collapse;font-size:0.85rem">
      <thead><tr style="color:var(--muted);font-family:'Barlow Condensed',sans-serif;font-size:0.62rem;letter-spacing:1px;text-transform:uppercase">
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

function _wczSlotHtml(slot, groupMap) {
  const g = groupMap[slot.g];
  if (slot.t === '3') {
    return `<div style="display:flex;align-items:center;gap:7px;color:var(--accent2)"><span style="font-family:'Barlow Condensed',sans-serif;font-size:0.85rem">Best 3rd Place (${slot.g})</span></div>`;
  }
  const decided = g && _wczGroupComplete(g);
  if (decided) {
    const sorted = [...g.teams].sort((a, b) => a.rank - b.rank);
    const team = slot.t === 'W' ? sorted[0] : sorted[1];
    return `<div style="display:flex;align-items:center;gap:7px">${_wczTeamLogo(team.logo, 22)}<span style="font-family:'Barlow Condensed',sans-serif;font-size:0.92rem">${team.name}</span></div>`;
  }
  return `<div style="color:var(--muted);font-family:'Barlow Condensed',sans-serif;font-size:0.85rem">Group ${slot.g} ${slot.t === 'W' ? 'Winner' : 'Runner-up'}</div>`;
}

async function _wczRenderBracket() {
  const el = document.getElementById('wc-panel-bracket'); if (!el) return;
  if (!el.dataset.init) { el.innerHTML = `<div class="loading-spinner"><div class="spinner"></div>Loading standings...</div>`; el.dataset.init = '1'; }
  let groups;
  try { groups = await _wczFetchGroups(); }
  catch (e) { el.innerHTML = `<div style="padding:24px;color:var(--muted);font-family:'Barlow Condensed',sans-serif">Could not load standings.</div>`; return; }
  const groupMap = {}; groups.forEach(g => groupMap[g.letter] = g);

  let html = `<div style="font-family:'Bebas Neue',sans-serif;font-size:1.05rem;letter-spacing:2px;color:var(--muted);padding:4px 4px 10px">Group Standings</div>`;
  html += `<div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(280px,1fr));gap:12px">`;
  html += groups.map(_wczStandingsTable).join('');
  html += `</div>`;
  html += `<div style="font-family:'Barlow Condensed',sans-serif;font-size:0.68rem;letter-spacing:1px;color:rgba(255,255,255,0.35);padding:8px 4px">Green: top two (advance). Amber: third place (eight best advance as wildcards).</div>`;

  // Third-place wildcard race
  const thirds = groups.map(g => { const s = [...g.teams].sort((a, b) => a.rank - b.rank); return { ...s[2], group: g.letter, complete: _wczGroupComplete(g) }; })
    .filter(Boolean).sort((a, b) => b.P - a.P || b.GD - a.GD || b.GF - a.GF);
  html += `<div style="font-family:'Bebas Neue',sans-serif;font-size:1.05rem;letter-spacing:2px;color:var(--muted);padding:18px 4px 8px">Third-Place Wildcard Race</div>`;
  html += `<div style="border:1px solid var(--border);border-radius:8px;overflow:hidden">`;
  html += thirds.map((t, i) => {
    const inField = i < 8;
    return `<div style="display:flex;align-items:center;gap:10px;padding:8px 12px;border-bottom:1px solid rgba(255,255,255,0.05);${inField ? 'background:rgba(34,197,94,0.06)' : ''}">
      <span style="width:20px;text-align:center;color:${inField ? '#22c55e' : 'var(--muted)'};font-family:'Bebas Neue',sans-serif">${i + 1}</span>
      ${_wczTeamLogo(t.logo, 22)}
      <span style="flex:1;font-family:'Barlow Condensed',sans-serif;font-size:0.92rem">${t.name} <span style="color:var(--muted);font-size:0.78rem">(Group ${t.group})</span></span>
      <span style="color:var(--muted);font-family:'Barlow Condensed',sans-serif;font-size:0.8rem">${t.P} pts &middot; ${t.GD > 0 ? '+' + t.GD : t.GD} GD</span>
    </div>`;
  }).join('');
  html += `</div><div style="font-family:'Barlow Condensed',sans-serif;font-size:0.68rem;letter-spacing:1px;color:rgba(255,255,255,0.35);padding:8px 4px">Top eight third-place teams qualify for the Round of 32.</div>`;

  // Round of 32 bracket allocation
  html += `<div style="font-family:'Bebas Neue',sans-serif;font-size:1.05rem;letter-spacing:2px;color:var(--muted);padding:18px 4px 8px">Round of 32</div>`;
  html += `<div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(300px,1fr));gap:10px">`;
  html += _WCZ_R32.map(mt => `<div style="border:1px solid var(--border);border-radius:8px;overflow:hidden">
      <div style="background:var(--surface2);padding:4px 10px;font-family:'Barlow Condensed',sans-serif;font-size:0.62rem;letter-spacing:1.5px;color:var(--muted)">MATCH ${mt.m}</div>
      <div style="padding:9px 12px;border-bottom:1px solid rgba(255,255,255,0.05)">${_wczSlotHtml(mt.a, groupMap)}</div>
      <div style="padding:9px 12px">${_wczSlotHtml(mt.b, groupMap)}</div>
    </div>`).join('');
  html += `</div>`;
  html += `<div style="font-family:'Barlow Condensed',sans-serif;font-size:0.68rem;letter-spacing:1px;color:rgba(255,255,255,0.35);padding:10px 4px 4px">Decided spots show the qualified team. Undecided spots show who can claim them. Round of 16 onward locks in as the knockout matches are played.</div>`;
  el.innerHTML = html;
}

// ----------------------- Advancement Odds -----------------------
function _wczStrength(t) { const gp = Math.max(1, t.gp); return (t.P / gp) + 0.35 * (t.GD / gp); }
function _wczPois(l) { const L = Math.exp(-l); let k = 0, p = 1; do { k++; p *= Math.random(); } while (p > L); return k - 1; }
function _wczSimMatch(a, b) {
  const d = (a.str ?? _wczStrength(a)) - (b.str ?? _wczStrength(b));
  const la = Math.min(6, Math.max(0.15, 1.35 * Math.exp(0.45 * d)));
  const lb = Math.min(6, Math.max(0.15, 1.35 * Math.exp(-0.45 * d)));
  return [_wczPois(la), _wczPois(lb)];
}
function _wczCmp(a, b) { return b.P - a.P || b.GD - a.GD || b.GF - a.GF || b.str - a.str; }

async function _wczRemainingFixtures(groups) {
  const teamGroup = {}; groups.forEach(g => g.teams.forEach(t => teamGroup[t.id] = g.letter));
  const events = await _sbFetchEspnWcScoreboard();
  const fix = [];
  for (const ev of events) {
    const c = ev.competitions?.[0]; if (!c) continue;
    if ((c.status?.type?.state || 'pre') === 'post') continue;
    const ids = (c.competitors || []).map(x => String(x.team.id));
    if (ids.length !== 2) continue;
    const ga = teamGroup[ids[0]], gb = teamGroup[ids[1]];
    if (ga && ga === gb) fix.push({ group: ga, a: ids[0], b: ids[1] });
  }
  return fix;
}

function _wczSim(groups, fixtures, N) {
  const teams = {}; const byGroup = {};
  groups.forEach(g => { byGroup[g.letter] = []; g.teams.forEach(t => { teams[t.id] = { ...t, group: g.letter, str: _wczStrength(t) }; byGroup[g.letter].push(t.id); }); });
  const adv = {}, cond = {};
  Object.keys(teams).forEach(id => { adv[id] = 0; cond[id] = { win: [0, 0], draw: [0, 0], loss: [0, 0] }; });
  for (let it = 0; it < N; it++) {
    const w = {}; Object.values(teams).forEach(t => { w[t.id] = { id: t.id, P: t.P, GF: t.GF, GD: t.GD, str: t.str, adv: false }; });
    const own = {};
    for (const f of fixtures) {
      const [ga, gb] = _wczSimMatch(teams[f.a], teams[f.b]);
      const A = w[f.a], B = w[f.b];
      A.GF += ga; A.GD += ga - gb; B.GF += gb; B.GD += gb - ga;
      if (ga > gb) { A.P += 3; own[f.a] = 'win'; own[f.b] = 'loss'; }
      else if (gb > ga) { B.P += 3; own[f.b] = 'win'; own[f.a] = 'loss'; }
      else { A.P += 1; B.P += 1; own[f.a] = 'draw'; own[f.b] = 'draw'; }
    }
    const thirds = [];
    for (const L in byGroup) {
      const arr = byGroup[L].map(id => w[id]).sort(_wczCmp);
      if (arr[0]) arr[0].adv = true;
      if (arr[1]) arr[1].adv = true;
      if (arr[2]) thirds.push(arr[2]);
    }
    thirds.sort(_wczCmp);
    for (let i = 0; i < 8 && i < thirds.length; i++) thirds[i].adv = true;
    for (const id in w) {
      if (w[id].adv) adv[id]++;
      const r = own[id];
      if (r) { cond[id][r][1]++; if (w[id].adv) cond[id][r][0]++; }
    }
  }
  const prob = {}, condP = {};
  Object.keys(teams).forEach(id => {
    prob[id] = adv[id] / N;
    const c = cond[id];
    condP[id] = {
      win: c.win[1] ? c.win[0] / c.win[1] : null,
      draw: c.draw[1] ? c.draw[0] / c.draw[1] : null,
      loss: c.loss[1] ? c.loss[0] / c.loss[1] : null,
    };
  });
  return { prob, cond: condP };
}

function _wczPct(p) { if (p == null) return '—'; if (p >= 0.999) return '100%'; if (p <= 0.001) return '0%'; const v = p * 100; return (v < 10 ? v.toFixed(1) : v.toFixed(0)) + '%'; }

function _wczToggleTeam(id) { _wczExpanded[id] = !_wczExpanded[id]; _wczRenderAdvance(true); }

async function _wczRenderAdvance(fromToggle) {
  const el = document.getElementById('wc-panel-advance'); if (!el) return;
  if (!fromToggle && !el.dataset.init) { el.innerHTML = `<div class="loading-spinner"><div class="spinner"></div>Simulating tournament...</div>`; el.dataset.init = '1'; }
  let groups, data;
  try {
    groups = await _wczFetchGroups();
    if (_wczAdvCache && Date.now() - _wczAdvCache.ts < 60000) {
      data = _wczAdvCache;
    } else {
      const fixtures = await _wczRemainingFixtures(groups);
      let prob = {}, cond = {};
      if (!fixtures.length) {
        groups.forEach(g => g.teams.forEach(t => { prob[t.id] = (t.qualified || t.rank <= 2) ? 1 : 0; cond[t.id] = { win: null, draw: null, loss: null }; }));
      } else {
        const r = _wczSim(groups, fixtures, 4000); prob = r.prob; cond = r.cond;
      }
      const oppOf = {}; fixtures.forEach(f => { oppOf[f.a] = f.b; oppOf[f.b] = f.a; });
      data = { ts: Date.now(), prob, cond, oppOf };
      _wczAdvCache = data;
    }
  } catch (e) { el.innerHTML = `<div style="padding:24px;color:var(--muted);font-family:'Barlow Condensed',sans-serif">Could not load data.</div>`; return; }

  const tmap = {}; groups.forEach(g => g.teams.forEach(t => tmap[t.id] = { ...t, group: g.letter }));
  const all = Object.values(tmap).sort((a, b) => (data.prob[b.id] - data.prob[a.id]) || b.P - a.P || b.GD - a.GD);

  let html = `<div style="font-family:'Bebas Neue',sans-serif;font-size:1.05rem;letter-spacing:2px;color:var(--muted);padding:4px 4px 4px">Probability of Reaching the Round of 32</div>`;
  html += `<div style="font-family:'Barlow Condensed',sans-serif;font-size:0.7rem;letter-spacing:1px;color:rgba(255,255,255,0.35);padding:0 4px 12px">Monte Carlo simulation of the remaining group matches. Tap a country for its qualification scenarios.</div>`;
  html += `<div style="border:1px solid var(--border);border-radius:8px;overflow:hidden">`;

  for (const t of all) {
    const p = data.prob[t.id];
    const pColor = p >= 0.999 ? '#22c55e' : p <= 0.001 ? '#ef4444' : p >= 0.5 ? 'var(--text)' : 'var(--muted)';
    const barW = Math.round(Math.max(0, Math.min(1, p)) * 100);
    const open = _wczExpanded[t.id];
    html += `<div onclick="_wczToggleTeam('${t.id}')" style="cursor:pointer;padding:9px 12px;border-bottom:1px solid rgba(255,255,255,0.05);${open ? 'background:rgba(255,255,255,0.03)' : ''}">
      <div style="display:flex;align-items:center;gap:10px">
        ${_wczTeamLogo(t.logo, 24)}
        <span style="flex:1;font-family:'Barlow Condensed',sans-serif;font-size:0.95rem">${t.name} <span style="color:var(--muted);font-size:0.75rem">(Grp ${t.group})</span></span>
        <div style="width:90px;height:5px;background:rgba(255,255,255,0.08);border-radius:3px;overflow:hidden"><div style="height:100%;width:${barW}%;background:${pColor};border-radius:3px"></div></div>
        <span style="min-width:48px;text-align:right;font-family:'Bebas Neue',sans-serif;font-size:1.05rem;color:${pColor}">${_wczPct(p)}</span>
      </div>
      ${open ? _wczTeamDetail(t, data) : ''}
    </div>`;
  }
  html += `</div>`;
  html += `<div style="font-family:'Barlow Condensed',sans-serif;font-size:0.66rem;letter-spacing:0.5px;color:rgba(255,255,255,0.3);padding:10px 4px">Match outcomes are modeled from each team's group form (Poisson scoring). Group ranking uses points, then overall goal difference and goals scored.</div>`;
  el.innerHTML = html;
}

function _wczTeamDetail(t, data) {
  const p = data.prob[t.id];
  const oppId = data.oppOf[t.id];
  const line = (label, txt, color) => `<div style="display:flex;justify-content:space-between;padding:3px 0;font-family:'Barlow Condensed',sans-serif;font-size:0.84rem"><span style="color:var(--muted)">${label}</span><span style="color:${color || 'var(--text)'}">${txt}</span></div>`;
  let body = '';
  if (t.qualified || p >= 0.999) {
    body = line('Status', t.noteDesc || 'Qualified for the Round of 32', '#22c55e');
  } else if (p <= 0.001) {
    body = line('Status', 'Eliminated from contention', '#ef4444');
  } else if (!oppId) {
    body = line('Status', 'Awaiting other results', 'var(--accent2)');
  } else {
    const opp = (_wczStandingsCache?.data || []).flatMap(g => g.teams).find(x => x.id === oppId);
    const c = data.cond[t.id] || {};
    const clinchWin = c.win != null && c.win >= 0.999;
    const elimLoss = c.loss != null && c.loss <= 0.001;
    body += line('Final group match', 'vs ' + (opp ? opp.name : 'opponent'), 'var(--text)');
    body += line('If they win', _wczPct(c.win) + ' to advance' + (clinchWin ? ' (clinches)' : ''), c.win >= 0.5 ? '#22c55e' : 'var(--text)');
    body += line('If they draw', _wczPct(c.draw) + ' to advance', c.draw >= 0.5 ? '#22c55e' : 'var(--muted)');
    body += line('If they lose', _wczPct(c.loss) + ' to advance' + (elimLoss ? ' (eliminated)' : ''), c.loss >= 0.5 ? '#22c55e' : '#ef4444');
    let summary;
    if (clinchWin && elimLoss) summary = 'Win and through; lose and out. A draw may be enough depending on other results.';
    else if (clinchWin) summary = 'A win guarantees a place in the Round of 32.';
    else if (elimLoss) summary = 'Must avoid defeat to stay alive.';
    else summary = 'Result combines with goal difference and other groups to decide their fate.';
    body += `<div style="margin-top:6px;font-family:'Barlow Condensed',sans-serif;font-size:0.78rem;color:var(--accent2);line-height:1.35">${summary}</div>`;
  }
  return `<div style="margin-top:8px;padding:8px 4px 2px;border-top:1px solid rgba(255,255,255,0.06)">
    ${line('Current', `${t.P} pts &middot; ${t.W}-${t.D}-${t.L} &middot; ${t.GD > 0 ? '+' + t.GD : t.GD} GD &middot; ${t.gp} played`, 'var(--text)')}
    ${body}
  </div>`;
}
