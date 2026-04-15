
function getPowerColor(score, min, max) {
  const pct = (score - min) / (max - min);
  if (pct > 0.7) return "#ff4d00";
  if (pct > 0.4) return "#ffaa00";
  return "#3399ff";
}
// Format moneyline for display: +150 or -110
function _fmtML(ml) {
  if (!ml) return 'EVEN';
  return (ml > 0 ? '+' : '') + ml;
}
// Each badge has a hover tooltip listing who affected the score and by how much.
function _predInjBadgeHtml(outPlayers, returnPlayers) {
  const RARITY_PENALTY = { gamebreaker:5.0, superstar:4.0, elite:3.0, clutch:2.0, impact:1.0, pro:0.5 };
  const RETURN_SCALE_LABEL = (gm) => gm <= 3 ? '70%' : gm <= 9 ? '50%' : gm <= 19 ? '30%' : '15%';
  let html = '';

  if (outPlayers && outPlayers.length) {
    const totalPen = outPlayers.reduce((s, p) => s + (RARITY_PENALTY[p.rarity] || 0), 0);
    const rows = outPlayers.map(p => {
      const pen = RARITY_PENALTY[p.rarity] || 0;
      return `<div class="pred-inj-tooltip-row">
        <span>${p.name}</span>
        <span class="pred-inj-tooltip-games">${p.gamesMissed}G out</span>
        <span class="pred-inj-tooltip-penalty">-${pen.toFixed(1)}</span>
      </div>`;
    }).join('');
    html += `<span class="pred-inj-badge" title="">
      <span class="pred-inj-icon">🏥</span>
      <span class="pred-inj-tooltip">
        <div class="pred-inj-tooltip-title">Injury penalty (-${Math.min(totalPen,10).toFixed(1)} pts)</div>
        ${rows}
      </span>
    </span>`;
  }

  if (returnPlayers && returnPlayers.length) {
    const totalBoost = returnPlayers.reduce((s, p) => {
      const base = RARITY_PENALTY[p.rarity] || 0;
      return s + base * (p.boostScale || 0);
    }, 0);
    const rows = returnPlayers.map(p => {
      const base = RARITY_PENALTY[p.rarity] || 0;
      const boost = base * (p.boostScale || 0);
      return `<div class="pred-inj-tooltip-row">
        <span>${p.name}</span>
        <span class="pred-inj-tooltip-games">${p.gamesMissed}G out · ${RETURN_SCALE_LABEL(p.gamesMissed)} str</span>
        <span class="pred-inj-tooltip-boost">+${boost.toFixed(1)}</span>
      </div>`;
    }).join('');
    html += `<span class="pred-inj-badge returning" title="">
      <span class="pred-inj-icon">💚</span>
      <span class="pred-inj-tooltip">
        <div class="pred-inj-tooltip-title">Return boost (+${Math.min(totalBoost,7).toFixed(1)} pts)</div>
        ${rows}
      </span>
    </span>`;
  }

  return html;
}

// The live game engine appends to this as games finish.
function _buildRecentResults() {
  const results = {};
  STANDINGS_DATA.forEach(t => { results[t.abbr] = { recentWins: 0, recentLosses: 0, opponents: [] }; });
  RECENT_GAMES.forEach(g => {
    if (g.status !== 'final') return;
    const homeWon = g.homeScore > g.awayScore;
    if (results[g.home]) {
      homeWon ? results[g.home].recentWins++ : results[g.home].recentLosses++;
      results[g.home].opponents.push(g.away);
    }
    if (results[g.away]) {
      homeWon ? results[g.away].recentLosses++ : results[g.away].recentWins++;
      results[g.away].opponents.push(g.home);
    }
  });
  return results;
}
// ── POWER SCORE ───────────────────────────────────────────────────────────────
function computePowerScore(team) {
  const gp = team.wins + team.losses;
  if (gp === 0) return { power: 0, winPct: 0, ortg: 0, drtg: 0, netRtg: 0,
                          l20WinPct: 0, oppL20WinPct: 0.5, normalizedNRTG: 0.5 };

  // 1. Season win%
  const winPct = team.wins / gp;

  // 2. L20 win% and Opp L20 win%
  //    Merge the hardcoded L20_DATA baseline with any new live games in
  //    _RECENT_RESULTS, sliding the 20-game window forward as games come in.
  const liveData = _RECENT_RESULTS[team.abbr] || { recentWins: 0, recentLosses: 0, opponents: [] };
  const baseL20  = L20_DATA[team.abbr];
  let l20WinPct, oppL20WinPct;

  if (baseL20) {
    const liveGP = liveData.recentWins + liveData.recentLosses;
    if (liveGP > 0) {
      // Slide the window: drop the oldest liveGP games from the baseline,
      // add the new live games.
      const dropGP = Math.min(liveGP, baseL20.l20g);
      const dropW  = Math.round((dropGP / baseL20.l20g) * baseL20.l20w);
      const newW   = baseL20.l20w - dropW + liveData.recentWins;
      const newG   = baseL20.l20g - dropGP + liveGP;
      l20WinPct = newG > 0 ? newW / newG : winPct;

      // Opponent win% for the new live games
      let liveOppSum = 0, liveOppCnt = 0;
      liveData.opponents.forEach(function(o) {
        const opp = STANDINGS_DATA.find(function(t) { return t.abbr === o; });
        if (opp && (opp.wins + opp.losses) > 0) {
          liveOppSum += opp.wins / (opp.wins + opp.losses);
          liveOppCnt++;
        }
      });
      const baseOppAvg = baseL20.oppCnt > 0 ? baseL20.oppSum / baseL20.oppCnt : 0.500;
      const keptOpp = Math.max(0, baseL20.oppCnt - dropGP);
      oppL20WinPct = (liveOppCnt + keptOpp) > 0
        ? (baseOppAvg * keptOpp + liveOppSum) / (liveOppCnt + keptOpp)
        : 0.500;
    } else {
      l20WinPct    = baseL20.l20g > 0 ? baseL20.l20w / baseL20.l20g : winPct;
      oppL20WinPct = baseL20.oppCnt > 0 ? baseL20.oppSum / baseL20.oppCnt : 0.500;
    }
  } else {
    // Team not in L20_DATA · use season win% as proxy
    l20WinPct    = winPct;
    oppL20WinPct = 0.500;
  }

  // 3. Net Rating · live from NBAstuffer fetch (or hardcoded fallback)
  const nrtgData = _NET_RATINGS[team.abbr];
  const ortg   = nrtgData ? nrtgData.ortg   : 110.0;
  const drtg   = nrtgData ? nrtgData.drtg   : 115.0;
  const netRtg = nrtgData ? nrtgData.netRtg : (ortg - drtg);

  // 4. Normalize: (netRtg + 15) / 30, clamped to [0, 1]
  const normalizedNRTG = Math.max(0, Math.min(1, (netRtg + 15) / 30));

  // 5. Final power score on 0–100 scale
  const power = (
    (winPct          * 0.25) +
    (l20WinPct       * 0.20) +
    (oppL20WinPct    * 0.15) +
    (normalizedNRTG  * 0.40)
  ) * 100;

  return {
    power:  Math.round(power * 10) / 10,
    winPct, ortg, drtg, netRtg,
    l20WinPct:    Math.round(l20WinPct    * 1000) / 1000,
    oppL20WinPct: Math.round(oppL20WinPct * 1000) / 1000,
    normalizedNRTG: Math.round(normalizedNRTG * 1000) / 1000,
  };
}

function getStreakClass(streak) {
  if (streak === _streakBest)  return 'streak-best';
  if (streak === _streakWorst) return 'streak-worst';
  const abs = Math.abs(streak);
  if (abs <= 1) return 'streak-grey';
  if (streak > 0) return abs >= 5 ? 'streak-w5' : 'streak-w' + abs;
  return abs >= 5 ? 'streak-l5' : 'streak-l' + abs;
}

function getStreakLabel(streak) {
  const abs = Math.abs(streak);
  const prefix = streak > 0 ? 'W' : 'L';
  let emoji = '';
  if (abs >= 5 && streak > 0) emoji = '\uD83D\uDD25 ';
  if (abs >= 5 && streak < 0) emoji = '\u2744\uFE0F ';
  return `${emoji}${prefix}${abs}`;
}


function seedLastGameMap(games) {
  const sorted = [...games].sort((a, b) => (a.date || '').localeCompare(b.date || ''));
  sorted.forEach(g => {
    const isFinal = g.isFinal || g.status === 'final';
    if (!isFinal) return;
    _lastGameMap[g.home] = g;
    _lastGameMap[g.away] = g;
  });
}

function sortRankings(key) {
  if (rankingsSortKey === key) {
    rankingsSortDir = rankingsSortDir === 'desc' ? 'asc' : 'desc';
  } else {
    rankingsSortKey = key;
    rankingsSortDir = (key === 'drtg' || key === 'name') ? 'asc' : 'desc';
  }
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

// Format a date as YYYY-MM-DD in local time
function localDateStr(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}
// Returns array of YYYY-MM-DD strings for today + past N days + future N days
function getDateRange(pastDays, futureDays) {
  const dates = [];
  for (let i = -pastDays; i <= futureDays; i++) {
    const d = new Date();
    d.setDate(d.getDate() + i);
    dates.push(localDateStr(d));
  }
  return dates;
}
