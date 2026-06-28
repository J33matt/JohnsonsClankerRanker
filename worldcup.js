// ============================ World Cup Tab ============================
// Three sub-tabs: Scores & Schedule, Standings, Bracket.
// Data: ESPN public FIFA World Cup endpoints (scoreboard + standings, no key).
// Reuses globals from index.html: _sbFetchEspnWcScoreboard, _sbWcFlag.

let _wczStandingsCache = null;
let _wczLiveTimer = null;
let _wczAdvCache = null;
const _wczSlotOpen = {};
function _wczToggleSlot(m) { _wczSlotOpen[m] = !_wczSlotOpen[m]; _wczRenderBracket(); }

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
  else if (tab === 'standings') _wczRenderStandings();
  else if (tab === 'bracket') _wczRenderBracket();
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

// Styling for the knockout bracket. Rounds are equal-height flex columns; each
// cell is flex:1 so midpoints line up across rounds, and pseudo-elements draw the
// connector lines (horizontal stub from every match + vertical joiner pairing two
// matches into the next round, all flowing rightward).
//
// The wrap breaks out of the centred panel to a moderate width so the bracket is
// roomier than the 1100px panel without spanning the whole screen, and flex-grow
// gives the Round-of-32 column the largest share (its cards carry the
// qualification detail). The two halves of the draw are separated by extra space
// (a top margin on the first bottom-half cell of every column), which keeps every
// round's halves aligned so the connector lines stay correct.
const _WCZ_BRACKET_CSS = `<style>
.wczb-section{position:relative;left:50%;transform:translateX(-50%);width:min(90vw,1400px)}
.wczb-wrap{overflow-x:auto;-webkit-overflow-scrolling:touch;padding:8px 0;width:100%}
.wczb{display:flex;gap:24px;align-items:stretch;width:100%}
.wczb-round{display:flex;flex-direction:column;justify-content:space-around;min-width:0}
.wczb-cell{flex:1;display:flex;flex-direction:column;justify-content:center;position:relative}
.wczb-cell.half-start{margin-top:24px}
.wczb .rl-r32{flex:5 1 320px}.wczb .rl-r16{flex:2 1 168px}.wczb .rl-qf{flex:2 1 150px}.wczb .rl-sf{flex:2 1 150px}.wczb .rl-final{flex:2 1 165px;justify-content:center}
.wczb-round.l .wczb-cell::after{content:'';position:absolute;right:-24px;top:calc(50% - 1px);width:24px;height:2px;background:var(--border)}
.wczb-round.l.pair .wczb-cell:nth-child(odd)::before{content:'';position:absolute;right:-24px;top:50%;height:50%;width:2px;background:var(--border)}
.wczb-round.l.pair .wczb-cell:nth-child(even)::before{content:'';position:absolute;right:-24px;bottom:50%;height:50%;width:2px;background:var(--border)}
.wczb-card{border:1px solid var(--border);border-radius:8px;overflow:hidden;background:var(--surface);margin:5px 0}
.wczb-card-h{background:var(--surface2);padding:4px 10px;font-family:'Barlow Condensed',sans-serif;font-size:0.71rem;letter-spacing:1.5px;color:var(--muted)}
.wczb-card-s{padding:9px 11px}
.wczb-fut{border:1px dashed var(--border);border-radius:8px;overflow:hidden;background:rgba(255,255,255,0.02)}
.wczb-fut-h{background:var(--surface2);padding:4px 9px;font-family:'Barlow Condensed',sans-serif;font-size:0.66rem;letter-spacing:1.5px;color:var(--muted)}
.wczb-fut-b{padding:6px 9px;font-family:'Barlow Condensed',sans-serif;font-size:0.9rem;color:var(--muted)}
.wczb-fut-b+.wczb-fut-b{border-top:1px solid rgba(255,255,255,0.05)}
</style>`;

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
  const place = adv?.place, byId = adv?.teamById;
  // A clinched team — visually distinct (green accent + CLINCHED tag, no dropdown).
  const lockedHtml = (logo, name) => `<div style="display:flex;align-items:center;gap:7px;border-left:3px solid #22c55e;padding-left:8px">
      ${_wczTeamLogo(logo, 22)}<span style="font-family:'Barlow Condensed',sans-serif;font-size:1.06rem">${name}</span>
      <span style="font-size:0.66rem;letter-spacing:1.5px;color:#22c55e;font-family:'Barlow Condensed',sans-serif;flex-shrink:0">CLINCHED</span></div>`;
  const candRow = (logo, name, sub, pctTxt, col, scen) => `<div style="padding:5px 0;border-top:1px solid rgba(255,255,255,0.05)">
      <div style="display:flex;align-items:center;gap:6px;font-family:'Barlow Condensed',sans-serif;font-size:0.9rem">
        ${_wczTeamLogo(logo, 18)}<span style="flex:1;min-width:0;color:var(--text);white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${name}${sub ? ` <span style="color:var(--muted);font-size:0.78rem">(${sub})</span>` : ''}</span>
        <span style="color:${col};font-weight:600;flex-shrink:0">${pctTxt}</span></div>
      ${scen ? `<div style="font-family:'Barlow Condensed',sans-serif;font-size:0.78rem;color:rgba(255,255,255,0.5);padding-left:24px;margin-top:1px">${scen}</div>` : ''}
    </div>`;
  const dropdown = (prefix, headLine, body, slotKey, open) => `<div>
      <div onclick="event.stopPropagation();_wczToggleSlot('${slotKey}')" style="cursor:pointer;display:flex;align-items:center;gap:6px;font-family:'Barlow Condensed',sans-serif">
        <span style="font-size:0.78rem;color:var(--accent2);flex-shrink:0">${prefix}</span>
        <span style="flex:1;min-width:0;font-size:0.92rem;color:var(--text);white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${headLine}</span>
        <span style="font-size:0.8rem;color:var(--muted);transform:${open ? 'rotate(180deg)' : 'none'};transition:transform 0.2s">&#9662;</span>
      </div>${body}</div>`;
  const colFor = p => p >= 0.5 ? '#22c55e' : p >= 0.2 ? 'var(--accent2)' : 'var(--muted)';

  // ---- Third-place slot ----
  if (slot.t === '3') {
    const feas = adv?.slotFeas?.[matchNum];
    if (feas && byId) {
      const spMap = {}; (adv.slotProb?.[matchNum] || []).forEach(x => spMap[x.id] = x.p);
      const ids = Object.keys(feas).sort((a, b) => (spMap[b] || 0) - (spMap[a] || 0));
      if (ids.length) {
        const fmtP = id => { const p = spMap[id]; if (p == null) return ids.length === 1 ? '100%' : 'possible'; if (p >= 0.9995 && ids.length > 1) return '>99%'; if (p >= 0.005) return _wczPct(p); return '<1%'; };
        if (ids.length === 1) { const t = byId[ids[0]]; return lockedHtml(t.logo, `${t.name} (${t.group})`); }
        const slotKey = matchNum + '_3', open = _wczSlotOpen[slotKey];
        const topT = byId[ids[0]];
        let body = '';
        if (open) body = ids.map(id => { const t = byId[id]; if (!t) return ''; const opp = adv.ownOpp?.[id] != null ? byId[adv.ownOpp[id]]?.name : null; const scen = _wczSlotScenario(feas[id], opp, t.name, adv.slotMiss?.[matchNum]?.[id]); return candRow(t.logo, t.name, t.group, fmtP(id), colFor(spMap[id] || 0), scen); }).join('');
        return dropdown('Third place:', `${topT.name} ${fmtP(ids[0])}`, body, slotKey, open);
      }
    }
    return `<div style="color:var(--muted);font-family:'Barlow Condensed',sans-serif;font-size:0.98rem">Best third place (${slot.g})</div>`;
  }

  // ---- Winner / Runner-up slot ----
  const g = groupMap[slot.g];
  const posName = slot.t === 'W' ? 'Winner' : 'Runner-up';
  const pkey = slot.t === 'W' ? 'p1' : 'p2', posIdx = slot.t === 'W' ? 0 : 1;
  if (g && place && adv?.posReach) {
    const cands = g.teams.map(t => ({ t, p: place[t.id]?.[pkey] || 0, reach: adv.posReach[t.id]?.[pkey] }))
      .filter(c => c.reach).sort((a, b) => b.p - a.p);
    if (cands.length) {
      const fmtP = p => p >= 0.9995 && cands.length > 1 ? '>99%' : p >= 0.005 ? _wczPct(p) : (cands.length === 1 ? '100%' : '<1%');
      if (cands.length === 1) { const t = cands[0].t; return lockedHtml(t.logo, t.name); }
      const slotKey = matchNum + '_' + slot.t + '_' + slot.g, open = _wczSlotOpen[slotKey];
      const topT = cands[0].t;
      let body = '';
      if (open) body = cands.map(c => {
        const t = c.t;
        const opp = adv.ownOpp?.[t.id] != null ? byId?.[adv.ownOpp[t.id]]?.name : null;
        const nm = id => byId?.[id]?.name || '?';
        const lines = _wczEnumPos(adv.groupSim?.[slot.g], t.id, posIdx, nm);
        let scen;
        if (lines) scen = lines.map(l => `<div style="display:flex;gap:6px"><span style="color:var(--text);flex-shrink:0;min-width:74px">${l.head}</span><span>${l.detail}</span></div>`).join('');
        else scen = _wczPosScenario(adv.placeCond?.[t.id], opp, posIdx);
        return candRow(t.logo, t.name, null, fmtP(c.p), colFor(c.p), scen);
      }).join('');
      return dropdown(`Group ${slot.g} ${posName}:`, `${topT.name} ${fmtP(cands[0].p)}`, body, slotKey, open);
    }
  }
  return `<div style="color:var(--muted);font-family:'Barlow Condensed',sans-serif;font-size:0.98rem">Group ${slot.g} ${posName}</div>`;
}

async function _wczRenderStandings() {
  const el = document.getElementById('wc-panel-standings'); if (!el) return;
  if (!el.dataset.init) { el.innerHTML = `<div class="loading-spinner"><div class="spinner"></div>Loading standings...</div>`; el.dataset.init = '1'; }
  let groups;
  try { groups = await _wczFetchGroups(); }
  catch (e) { el.innerHTML = `<div style="padding:24px;color:var(--muted);font-family:'Barlow Condensed',sans-serif">Could not load standings.</div>`; return; }

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
      <span style="width:40px;${wcCol}" title="Games played">GP</span>
      <span style="width:48px;${wcCol}" title="Group points (1st tiebreaker)">Pts</span>
      <span style="width:48px;${wcCol}" title="Overall goal difference (2nd tiebreaker)">GD</span>
      <span style="width:48px;${wcCol}" title="Overall goals scored (3rd tiebreaker)">GF</span>
    </div>`;
  html += thirds.map((t, i) => {
    const inField = i < 8;
    return `<div style="display:flex;align-items:center;border-bottom:1px solid rgba(255,255,255,0.05);${inField ? 'background:rgba(34,197,94,0.06)' : ''}">
      <span style="width:34px;${wcCol};color:${inField ? '#22c55e' : 'var(--muted)'};font-family:'Bebas Neue',sans-serif;font-size:1.06rem">${i + 1}</span>
      <span style="flex:1;display:flex;align-items:center;gap:8px;padding:7px 8px;min-width:0">${_wczTeamLogo(t.logo, 22)}<span style="font-family:'Barlow Condensed',sans-serif;font-size:1.06rem;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${t.name} <span style="color:var(--muted);font-size:0.86rem">(${t.group})</span></span></span>
      <span style="width:40px;${wcCol};font-family:'Barlow Condensed',sans-serif;font-size:0.98rem;color:var(--muted)">${t.gp}</span>
      <span style="width:48px;${wcCol};font-family:'Bebas Neue',sans-serif;font-size:1.06rem">${t.P}</span>
      <span style="width:48px;${wcCol};font-family:'Barlow Condensed',sans-serif;font-size:0.98rem;color:var(--muted)">${t.GD > 0 ? '+' + t.GD : t.GD}</span>
      <span style="width:48px;${wcCol};font-family:'Barlow Condensed',sans-serif;font-size:0.98rem;color:var(--muted)">${t.GF}</span>
    </div>`;
  }).join('');
  html += `</div><div style="font-family:'Barlow Condensed',sans-serif;font-size:0.78rem;letter-spacing:1px;color:rgba(255,255,255,0.35);padding:8px 4px">Top eight (green) qualify. Ranked by points, then overall goal difference, then goals scored; fair-play points and FIFA ranking break any remaining ties.</div>`;
  el.innerHTML = html;
}

async function _wczRenderBracket() {
  const el = document.getElementById('wc-panel-bracket'); if (!el) return;
  if (!el.dataset.init) { el.innerHTML = `<div class="loading-spinner"><div class="spinner"></div>Loading bracket...</div>`; el.dataset.init = '1'; }
  let groups, adv = null;
  try {
    groups = await _wczFetchGroups();
    adv = await _wczGetAdvData(groups).catch(() => null);
  }
  catch (e) { el.innerHTML = `<div style="padding:24px;color:var(--muted);font-family:'Barlow Condensed',sans-serif">Could not load bracket.</div>`; return; }
  const groupMap = {}; groups.forEach(g => groupMap[g.letter] = g);
  let html = '';

  // Round of 32 bracket — a single left-to-right knockout tree. Both halves of
  // the draw are stacked vertically (top half above bottom half) so the rounds
  // narrow rightward 16 -> 8 -> 4 -> 2 -> 1 and meet at the Final on the right,
  // which fits the page width without horizontal scrolling. CSS pseudo-elements
  // draw the horizontal stubs and the vertical joiners that pair two matches
  // into the next round.
  html += _WCZ_BRACKET_CSS;
  html += `<div class="wczb-section">`;
  html += `<div style="font-family:'Bebas Neue',sans-serif;font-size:1.21rem;letter-spacing:2px;color:var(--muted);padding:4px 4px 8px">Round of 32 Bracket</div>`;
  const r32 = {}; _WCZ_R32.forEach(mt => r32[mt.m] = mt);
  const card = m => { const mt = r32[m]; return `<div class="wczb-card">
      <div class="wczb-card-h">MATCH ${mt.m}</div>
      <div class="wczb-card-s" style="border-bottom:1px solid rgba(255,255,255,0.05)">${_wczSlotHtml(mt.a, groupMap, adv, mt.m)}</div>
      <div class="wczb-card-s">${_wczSlotHtml(mt.b, groupMap, adv, mt.m)}</div>
    </div>`; };
  // Compact placeholder node for a not-yet-played later-round match.
  const fut = (label, num, l1, l2) => `<div class="wczb-fut">
      <div class="wczb-fut-h">${label} &middot; M${num}</div>
      <div class="wczb-fut-b">${l1}</div>
      <div class="wczb-fut-b">${l2}</div>
    </div>`;
  // The first bottom-half cell (index = half the column) gets `half-start`, which
  // adds the extra space dividing the two halves of the draw. Same proportion in
  // every column, so the rounds stay aligned.
  const round = (cls, cells) => { const half = cells.length > 1 ? cells.length / 2 : -1; return `<div class="wczb-round ${cls}">${cells.map((c, i) => `<div class="wczb-cell${i === half ? ' half-start' : ''}">${c}</div>`).join('')}</div>`; };
  html += `<div class="wczb-wrap"><div class="wczb">`;
  // Top half then bottom half, stacked into one rightward-flowing bracket.
  html += round('rl-r32 l pair', [74, 77, 73, 75, 83, 84, 81, 82, 76, 78, 79, 80, 86, 88, 85, 87].map(card));
  html += round('rl-r16 l pair', [
    fut('R16', 89, 'Winner M74', 'Winner M77'), fut('R16', 90, 'Winner M73', 'Winner M75'), fut('R16', 93, 'Winner M83', 'Winner M84'), fut('R16', 94, 'Winner M81', 'Winner M82'),
    fut('R16', 91, 'Winner M76', 'Winner M78'), fut('R16', 92, 'Winner M79', 'Winner M80'), fut('R16', 95, 'Winner M86', 'Winner M88'), fut('R16', 96, 'Winner M85', 'Winner M87')]);
  html += round('rl-qf l pair', [
    fut('QF', 97, 'Winner M89', 'Winner M90'), fut('QF', 98, 'Winner M93', 'Winner M94'),
    fut('QF', 99, 'Winner M91', 'Winner M92'), fut('QF', 100, 'Winner M95', 'Winner M96')]);
  html += round('rl-sf l pair', [fut('SF', 101, 'Winner M97', 'Winner M98'), fut('SF', 102, 'Winner M99', 'Winner M100')]);
  html += round('rl-final', [fut('FINAL', 104, 'Winner M101', 'Winner M102')]);
  html += `</div></div>`;
  html += `<div style="font-family:'Barlow Condensed',sans-serif;font-size:0.78rem;letter-spacing:1px;color:rgba(255,255,255,0.35);padding:10px 4px 4px">The bracket flows left to right toward the Final; follow the connector lines to trace a team's path. A green CLINCHED tag marks a team locked into a spot. Any slot still in play is a dropdown — tap it to see every team that can still take it, its chance, and the result it needs. Candidate lists come from an exhaustive possibility search (so long shots show too); the third-place slot routing uses FIFA's official allocation table.</div>`;
  html += `</div>`;
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
  // Per-team finishing position conditioned on own final-match result: [1st, 2nd, total]
  const placeCond = {}; ids.forEach(id => placeCond[id] = { win: [0, 0, 0], draw: [0, 0, 0], loss: [0, 0, 0] });

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
    const simRes = {}; const thirds = []; const posIter = {};
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
      for (let i = 0; i < order.length && i < 4; i++) { place[order[i]][i]++; posIter[order[i]] = i; }
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
        const pc = placeCond[id][own]; pc[2]++; if (posIter[id] === 0) pc[0]++; else if (posIter[id] === 1) pc[1]++;
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
  const placeCondP = {};
  ids.forEach(id => {
    const c = placeCond[id]; const f = r => r[2] ? { p1: r[0] / r[2], p2: r[1] / r[2], n: r[2] } : { p1: null, p2: null, n: 0 };
    placeCondP[id] = { win: f(c.win), draw: f(c.draw), loss: f(c.loss) };
  });
  return { prob, cond: condP, info, place: placeP, slotProb, qThird: qThirdP, placeCond: placeCondP };
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
  const posReach = {}; groups.forEach(g => g.teams.forEach(t => posReach[t.id] = { p1: false, p2: false }));
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
      if (order[0]) posReach[order[0]].p1 = true;
      if (order[1]) posReach[order[1]].p2 = true;
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
  return { slotFeas, ownOpp, posReach };
}

// Exact within-group conditions for a team to finish in `posIdx` (0=win, 1=runner-up),
// by enumerating every scoreline of the group's two final matches through the real
// 2026 tiebreaker engine. Returns a readable multi-clause string, or null.
function _wczEnumPos(pg, teamId, posIdx, nm) {
  const rem = pg.remaining;
  if (rem.length !== 2) return null; // only the final-matchday case is cleanly enumerable
  const ownM = (rem[0].a === teamId || rem[0].b === teamId) ? rem[0] : rem[1];
  const othM = ownM === rem[0] ? rem[1] : rem[0];
  const oppId = ownM.a === teamId ? ownM.b : ownM.a;
  const ownIsA = ownM.a === teamId;
  const MAXG = 7, REAL_MAX = 6; // plausible goal-margin ceiling for phrasing
  const cells = {};
  // Store the goal-difference SWING (other-match winner's margin minus this team's own
  // margin) for each scoreline, so a GD-race condition reduces to a relative margin.
  const add = (ownRes, ok, rel, hit) => { (cells[ownRes] = cells[ownRes] || {}); const c = (cells[ownRes][ok] = cells[ownRes][ok] || { hit: [], miss: [] }); (hit ? c.hit : c.miss).push(rel); };
  for (let p = 0; p <= MAXG; p++) for (let q = 0; q <= MAXG; q++) for (let r = 0; r <= MAXG; r++) for (let s = 0; s <= MAXG; s++) {
    const st = {}; pg.ids.forEach(id => { const a = pg.agg[id]; st[id] = { id, P: a.P, GF: a.GF, GA: a.GA, GD: a.GF - a.GA, str: 0 }; });
    const matches = pg.played.slice();
    const mm = [{ a: ownM.a, b: ownM.b, as: p, bs: q }, { a: othM.a, b: othM.b, as: r, bs: s }];
    for (const m of mm) { matches.push(m); const A = st[m.a], B = st[m.b]; A.GF += m.as; A.GA += m.bs; B.GF += m.bs; B.GA += m.as; if (m.as > m.bs) A.P += 3; else if (m.bs > m.as) B.P += 3; else { A.P++; B.P++; } }
    pg.ids.forEach(id => st[id].GD = st[id].GF - st[id].GA);
    const order = _wczRankGroup(pg.ids, matches, st);
    const ownRes = p === q ? 'D' : ((p > q) === ownIsA ? 'W' : 'L');
    const ok = r === s ? 'D' : (r > s ? 'A' : 'B');
    const ownGD = ownIsA ? p - q : q - p;          // this team's GD change in its own match
    const rivalGD = r - s;                          // other match: a's GD change (>0 if a wins)
    const rel = (ok === 'A' ? rivalGD : ok === 'B' ? -rivalGD : 0) - ownGD; // winner's margin minus team's
    add(ownRes, ok, rel, order.indexOf(teamId) === posIdx);
  }
  const head = { W: `Beat ${nm(oppId)}`, D: `Draw ${nm(oppId)}`, L: `Lose to ${nm(oppId)}` };
  const winnerOf = ok => ok === 'A' ? othM.a : othM.b, loserOf = ok => ok === 'A' ? othM.b : othM.a;
  // Describe an other-match outcome, with a relative goal-margin where it matters.
  const desc = (ok, ownRes, thr) => {
    if (ok === 'D') return `${nm(othM.a)} & ${nm(othM.b)} draw`;
    const base = `${nm(winnerOf(ok))} beat ${nm(loserOf(ok))}`;
    if (thr == null) return base;
    return ownRes === 'D' ? `${base} by ${thr}+` : `${base} by ${thr}+ more than ${nm(teamId)}`;
  };
  const avg = a => a.reduce((x, y) => x + y, 0) / a.length;
  const lines = [];
  for (const ownRes of ['W', 'D', 'L']) {
    const cs = cells[ownRes]; if (!cs) continue;
    const qualDesc = [], failDesc = [];
    for (const ok of ['A', 'D', 'B']) {
      const c = cs[ok] || { hit: [], miss: [] };
      if (!c.hit.length) { failDesc.push(desc(ok, ownRes, null)); continue; }   // never qualifies here
      if (!c.miss.length) { qualDesc.push(desc(ok, ownRes, null)); continue; }  // always qualifies here
      // GD-dependent: a bigger swing either helps (qualify) or hurts (fail).
      if (avg(c.hit) > avg(c.miss)) {
        const thr = Math.max(...c.miss) + 1;                 // qualifies when swing >= thr
        if (thr <= 0) qualDesc.push(desc(ok, ownRes, null));         // essentially always
        else if (thr > REAL_MAX) failDesc.push(desc(ok, ownRes, null)); // needs an implausible margin → treat as no
        else qualDesc.push(desc(ok, ownRes, thr));
      } else {
        const thr = Math.max(...c.hit) + 1;                  // fails when swing >= thr
        if (thr <= 0) failDesc.push(desc(ok, ownRes, null));            // essentially always fails
        else if (thr > REAL_MAX) qualDesc.push(desc(ok, ownRes, null)); // implausible to fail → treat as yes
        else failDesc.push(desc(ok, ownRes, thr));
      }
    }
    if (!qualDesc.length) continue; // can't reach the position with this result
    let detail;
    if (!failDesc.length) detail = 'qualifies';
    else detail = (failDesc.length < qualDesc.length) ? 'qualifies unless ' + failDesc.join(' or ') : 'only if ' + qualDesc.join(' or ');
    lines.push({ head: head[ownRes], detail });
  }
  return lines.length ? lines : null;
}

// Own-match requirement for a team to finish 1st (posIdx 0) or 2nd (posIdx 1) in its group.
function _wczPosScenario(pc, opp, posIdx) {
  if (!pc || !opp) return '';
  const hit = k => pc[k] && pc[k].n > 0 && (posIdx === 0 ? pc[k].p1 > 0 : pc[k].p2 > 0);
  const res = ['win', 'draw', 'loss'].filter(hit);
  if (!res.length || res.length >= 3) return res.length >= 3 ? `any result vs ${opp} can be enough` : '';
  const word = { win: 'win', draw: 'draw', loss: 'lose' };
  return `needs to ${res.map(k => word[k]).join(' or ')} vs ${opp}`;
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

function _wczPct(p) {
  if (p == null) return '—';
  if (p >= 0.9995) return '100%';      // only show 100% when essentially clinched
  if (p <= 0.0005) return '0%';
  const v = p * 100;
  if (v >= 99.5) return '99%';         // don't let 99.5–99.94% round up to 100%
  if (v <= 0.5) return '<1%';          // don't let a live chance round down to 0%
  return (v < 10 ? v.toFixed(1) : String(Math.round(v))) + '%';
}

// Shared advancement simulation (prob/place/cond), cached for 60s — used by the
// bracket to fill clinched slots and route the third-place wildcards.
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
    data = { ts: Date.now(), prob: r.prob, cond: r.cond, info: r.info, place: r.place, slotProb: r.slotProb, placeCond: r.placeCond };
    qThird = r.qThird;
  }
  // Broad possibility search: which teams can still reach each slot + own-result needed.
  const poss = _wczPossib(groups, prep, anyRemaining ? 10000 : 1);
  data.slotFeas = poss.slotFeas; data.ownOpp = poss.ownOpp; data.posReach = poss.posReach;
  data.groupSim = prep.perGroup; // agg/played/remaining per group, for exact W/RU scenarios
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
