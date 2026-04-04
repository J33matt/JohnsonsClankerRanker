let rankingsSortKey = 'power';
let rankingsSortDir = 'desc';
let rankingsView = 'league'; // 'league' | 'conference' | 'division'

const SORT_COLUMNS = [
  { key: 'power',    label: 'Power Score', center: false },
  { key: 'record',   label: 'Record',      center: false },
  { key: 'winPct',   label: 'Win%',        center: true  },
  { key: 'netRtg',   label: 'Net Rtg',     center: true  },
  { key: 'ortg',     label: 'oRtg',        center: true  },
  { key: 'drtg',     label: 'dRtg',        center: true  },
  { key: 'streak',   label: 'Streak',      center: true  },
];

function sortRankings(key) {
  if (rankingsSortKey === key) {
    rankingsSortDir = rankingsSortDir === 'desc' ? 'asc' : 'desc';
  } else {
    rankingsSortKey = key;
    rankingsSortDir = (key === 'drtg' || key === 'name') ? 'asc' : 'desc';
  }
  renderRankings();
}

function setRankingsView(view, btn) {
  rankingsView = view;
  document.querySelectorAll('.view-btn').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  renderRankings();
}

function getSortValue(t, key) {
  switch(key) {
    case 'power':    return t.power;
    case 'name':     return t.name.toLowerCase();
    case 'record':   return t.winPct;
    case 'winPct':   return t.winPct;
    case 'netRtg':   return t.netRtg;
    case 'ortg':     return t.ortg;
    case 'drtg':     return t.drtg;
    case 'streak':   return t.streak;
    default:         return 0;
  }
}

// ============================================================
// RANK MOVEMENT · baseline is the most recent weekly snapshot
// ============================================================
function buildBaselineRankMap() {
  // Always use the last entry in WEEKLY_RANKINGS as the week's starting point.
  // When the auto-inject fires (7+ days elapsed), the newly appended snapshot
  // becomes the new baseline automatically on the next call.
  const last = WEEKLY_RANKINGS[WEEKLY_RANKINGS.length - 1];
  const map = {};
  if (last && last.rankings) {
    last.rankings.forEach(function(e) { map[e.team] = e.rank; });
  }
  return map;
}

function buildCurrentRankMap() {
  // Compute live ranks from current ENRICHED_DATA power scores
  const sorted = [...ENRICHED_DATA].sort(function(a, b) { return b.power - a.power; });
  const map = {};
  sorted.forEach(function(t, i) { map[t.abbr] = i + 1; });
  return map;
}

function getRankMovement(abbr, baselineMap, currentMap) {
  const base = baselineMap[abbr];
  const curr = currentMap[abbr];
  if (!base || !curr) return 0;
  return base - curr; // positive = moved up (lower rank number = better)
}

function rankMoveCell(movement) {
  if (movement > 0) {
    return '<td class="rank-move-cell"><div class="rank-move up"><span class="rank-move-arrow">▲</span><span class="rank-move-num">' + movement + '</span></div></td>';
  } else if (movement < 0) {
    return '<td class="rank-move-cell"><div class="rank-move down"><span class="rank-move-arrow">▼</span><span class="rank-move-num">' + Math.abs(movement) + '</span></div></td>';
  }
  return '<td class="rank-move-cell"></td>';
}

function renderRankings() {
  const baselineRankMap = buildBaselineRankMap();
  const currentRankMap  = buildCurrentRankMap();
  const allPowers = ENRICHED_DATA.map(t => t.power);
  const maxP = Math.max(...allPowers);
  const minP = Math.min(...allPowers);

  function thSortable(key, label, isCenter) {
    const isActive = rankingsSortKey === key;
    const arrow = isActive ? (rankingsSortDir === 'desc' ? '\u25BC' : '\u25B2') : '\u25BC';
    const cls = 'sortable' + (isActive ? ' sort-active' : '') + (isCenter ? ' center' : '');
    return `<th class="${cls}" onclick="sortRankings('${key}')">${label}<span class="sort-arrow">${arrow}</span></th>`;
  }

  function tableHead() {
    return `<table class="rankings-table">
      <thead><tr>
        <th class="center">#</th>
        <th style="width:28px;min-width:28px;padding:0"></th>
        <th class="sortable${rankingsSortKey==='name'?' sort-active':''}" onclick="sortRankings('name')">Team<span class="sort-arrow">${rankingsSortKey==='name'?(rankingsSortDir==='desc'?'\u25BC':'\u25B2'):'\u25BC'}</span></th>
        ${thSortable('power','Power Score',false)}
        <th class="bar-cell col-bar"></th>
        <th class="col-record sortable${rankingsSortKey==='record'?' sort-active':''}" onclick="sortRankings('record')">Record<span class="sort-arrow">${rankingsSortKey==='record'?(rankingsSortDir==='desc'?'\u25BC':'\u25B2'):'\u25BC'}</span></th>
        <th class="col-winpct center sortable${rankingsSortKey==='winPct'?' sort-active':''}" onclick="sortRankings('winPct')">Win%<span class="sort-arrow">${rankingsSortKey==='winPct'?(rankingsSortDir==='desc'?'\u25BC':'\u25B2'):'\u25BC'}</span></th>
        <th class="col-netrtg center sortable${rankingsSortKey==='netRtg'?' sort-active':''}" onclick="sortRankings('netRtg')">Net Rtg<span class="sort-arrow">${rankingsSortKey==='netRtg'?(rankingsSortDir==='desc'?'\u25BC':'\u25B2'):'\u25BC'}</span></th>
        <th class="col-ortg center sortable${rankingsSortKey==='ortg'?' sort-active':''}" onclick="sortRankings('ortg')">oRtg<span class="sort-arrow">${rankingsSortKey==='ortg'?(rankingsSortDir==='desc'?'\u25BC':'\u25B2'):'\u25BC'}</span></th>
        <th class="col-drtg center sortable${rankingsSortKey==='drtg'?' sort-active':''}" onclick="sortRankings('drtg')">dRtg<span class="sort-arrow">${rankingsSortKey==='drtg'?(rankingsSortDir==='desc'?'\u25BC':'\u25B2'):'\u25BC'}</span></th>
        ${thSortable('streak','Streak',true)}
        <th class="last-cell col-last" style="color:var(--muted);font-size:0.75rem;letter-spacing:2px;text-transform:uppercase;padding:10px 14px;font-weight:600">Last</th>
      </tr></thead><tbody>`;
  }

  function teamRow(t, rank, isTop3, movement) {
    const fillColor = getPowerColor(t.power, minP, maxP);
    const fillPct = ((t.power - minP) / (maxP - minP) * 100).toFixed(1);
    const streakClass = getStreakClass(t.streak);
    const streakLabel = getStreakLabel(t.streak);
    const colors = TEAM_COLORS[t.abbr] || { bg: 'var(--surface2)', text: 'var(--text)' };
    const logo = getLogoUrl(t.abbr);

    // Build Last Game cell
    const lg = _lastGameMap[t.abbr] || null;
    let lastCell = `<td class="last-cell col-last"><span class="last-none">-</span></td>`;
    if (lg) {
      const isHome  = lg.home === t.abbr;
      const myScore = isHome ? lg.homeScore : lg.awayScore;
      const opScore = isHome ? lg.awayScore  : lg.homeScore;
      const oppAbbr = isHome ? lg.away : lg.home;
      const won     = myScore > opScore;
      const atVs    = isHome ? 'vs' : '@';
      const oppLogo = getLogoUrl(oppAbbr);
      // Get day of week from game date
      let dayLabel = '';
      if (lg.date) {
        const gameDate = new Date(lg.date + 'T12:00:00');
        dayLabel = gameDate.toLocaleDateString('en-US', { weekday: 'short' });
      }
      lastCell = `<td class="last-cell col-last">
        <span class="last-result">
          <span class="last-wl ${won?'win':'loss'}">${won?'W':'L'}</span>
          <span class="last-score">${myScore}–${opScore}</span>
          <span class="last-at">${atVs}</span>
          <img class="last-opp-logo" src="${oppLogo}" alt="${oppAbbr}" onerror="this.style.display='none'">
          <span class="last-opp-abbr">${oppAbbr}${dayLabel ? ` <span style="color:var(--muted);font-size:0.72rem">(${dayLabel})</span>` : ''}</span>
        </span>
      </td>`;
    }

    return `<tr>
      <td><div class="rank-num ${isTop3?'top3':''}">${rank}</div></td>
      ${rankMoveCell(movement)}
      <td>
        <div class="team-cell">
          <div style="width:36px;height:28px;border-radius:5px;background:${colors.bg};border:1px solid ${colors.bg}88;display:flex;align-items:center;justify-content:center;padding:2px 3px;flex-shrink:0">
            <img src="${logo}" alt="${t.abbr}" style="width:100%;height:100%;object-fit:contain" onerror="this.outerHTML='<span style=font-family:Bebas Neue,sans-serif;font-size:0.75rem;color:${colors.text};padding:0 2px>${t.abbr}</span>'">
          </div>
          <div>
            <div class="team-name-full">${t.name}</div>
            <div class="team-conf">${t.conf} · ${t.div}</div>
          </div>
        </div>
      </td>
      <td><div class="power-score" style="color:${fillColor}">${t.power}</div></td>
      <td class="bar-cell col-bar">
        <div class="power-bar-bg">
          <div class="power-bar-fill" style="width:${fillPct}%; background:${fillColor}"></div>
        </div>
      </td>
      <td class="record-cell col-record">${t.wins}–${t.losses}</td>
      <td class="win-pct-cell center col-winpct">${(t.winPct*100).toFixed(1)}%</td>
      <td class="ortg-cell col-netrtg" style="color:${t.netRtg>0?'#00e87a':'#ff3355'}">${t.netRtg > 0 ? '+' : ''}${t.netRtg}</td>
      <td class="ortg-cell col-ortg">${t.ortg}</td>
      <td class="ortg-cell col-drtg">${t.drtg}</td>
      <td><span class="trend-badge ${streakClass}">${streakLabel}</span></td>
      ${lastCell}
    </tr>`;
  }

  function sortTeams(teams) {
    return [...teams].sort((a, b) => {
      const va = getSortValue(a, rankingsSortKey);
      const vb = getSortValue(b, rankingsSortKey);
      const cmp = typeof va === 'string' ? va.localeCompare(vb) : va - vb;
      return rankingsSortDir === 'desc' ? -cmp : cmp;
    });
  }

  let html = '';

  if (rankingsView === 'league') {
    const sorted = sortTeams(ENRICHED_DATA);
    html = tableHead();
    sorted.forEach((t, i) => { html += teamRow(t, i + 1, i < 3, getRankMovement(t.abbr, baselineRankMap, currentRankMap)); });
    html += `</tbody></table>`;

  } else if (rankingsView === 'conference') {
    ['WEST', 'EAST'].forEach(conf => {
      const label = conf === 'WEST' ? 'Western Conference' : 'Eastern Conference';
      const cls = conf === 'WEST' ? 'west' : 'east';
      const teams = sortTeams(ENRICHED_DATA.filter(t => t.conf === conf));
      html += `<div class="rankings-group-header ${cls}">${label}</div>`;
      html += tableHead();
      teams.forEach((t, i) => { html += teamRow(t, i + 1, i < 3, getRankMovement(t.abbr, baselineRankMap, currentRankMap)); });
      html += `</tbody></table>`;
    });

  } else if (rankingsView === 'division') {
    const DIVISIONS = [
      { name: 'Northwest', conf: 'WEST' }, { name: 'Pacific', conf: 'WEST' }, { name: 'Southwest', conf: 'WEST' },
      { name: 'Atlantic', conf: 'EAST' }, { name: 'Central', conf: 'EAST' }, { name: 'Southeast', conf: 'EAST' },
    ];
    DIVISIONS.forEach(div => {
      const teams = sortTeams(ENRICHED_DATA.filter(t => t.div === div.name));
      if (!teams.length) return;
      const confLabel = div.conf === 'WEST' ? 'Western' : 'Eastern';
      html += `<div class="rankings-group-header div">${div.name} Division <span style="font-size:0.7rem;color:var(--muted);font-family:'Barlow Condensed',sans-serif;letter-spacing:2px;margin-left:8px">${confLabel}</span></div>`;
      html += tableHead();
      teams.forEach((t, i) => { html += teamRow(t, i + 1, i === 0, getRankMovement(t.abbr, baselineRankMap, currentRankMap)); });
      html += `</tbody></table>`;
    });
  }

  document.getElementById('rankings-container').innerHTML = html;
}
