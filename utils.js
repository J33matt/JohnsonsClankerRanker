
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

// Division winners map (best record in each division)
function getDivisionWinners() {
  const divs = {};
  STANDINGS_DATA.forEach(t => {
    const key = t.conf + '_' + t.div;
    if (!divs[key] || t.wins / (t.wins + t.losses) > divs[key].wins / (divs[key].wins + divs[key].losses)) {
      divs[key] = t;
    }
  });
  return new Set(Object.values(divs).map(t => t.abbr));
}

function getConfWinPct(team) {
  // Use net rating as a conference-record proxy for tiebreaking equal win%
  return (_NET_RATINGS[team.abbr] || {}).netRtg || 0;
}

function getDivWinPct(team) {
  // Use net rating for division tiebreaking (best available proxy without real conf/div records)
  return (_NET_RATINGS[team.abbr] || {}).netRtg || 0;
}

function getPointDiff(team) {
  const netRtg = computePowerScore(team).netRtg;
  return Math.round(netRtg * (team.wins + team.losses) * 0.5);
}

function seedConference(conf) {
  const teams = STANDINGS_DATA.filter(t => t.conf === conf).map(t => ({
    ...t,
    winPct: t.wins / (t.wins + t.losses),
    confWinPct: getConfWinPct(t),
    divWinPct: getDivWinPct(t),
    ptDiff: getPointDiff(t),
  }));
  const divWinners = getDivisionWinners();
  teams.sort((a, b) => {
    if (Math.abs(a.winPct - b.winPct) > 0.0001) return b.winPct - a.winPct;
    const aDiv = divWinners.has(a.abbr) ? 1 : 0;
    const bDiv = divWinners.has(b.abbr) ? 1 : 0;
    if (aDiv !== bDiv) return bDiv - aDiv;
    if (Math.abs(a.confWinPct - b.confWinPct) > 0.0001) return b.confWinPct - a.confWinPct;
    if (a.div === b.div && Math.abs(a.divWinPct - b.divWinPct) > 0.0001) return b.divWinPct - a.divWinPct;
    return b.ptDiff - a.ptDiff;
  });
  return teams;
}

// Build a power-rank map (rank 1 = best) for "Games to Watch" logic
function buildPowerRankMap() {
  const ranked = STANDINGS_DATA
    .map(t => ({ abbr: t.abbr, power: computePowerScore(t).power }))
    .sort((a, b) => b.power - a.power);
  const map = {};
  ranked.forEach((t, i) => { map[t.abbr] = i + 1; });
  return map;
}
// Compute win probability for upcoming game display
function gameWinProb(awayAbbr, homeAbbr) {
  const awayT = STANDINGS_DATA.find(t => t.abbr === awayAbbr);
  const homeT = STANDINGS_DATA.find(t => t.abbr === homeAbbr);
  if (!awayT || !homeT) return { homePct: 55, awayPct: 45 };
  const awayPwr = computePowerScore(awayT).power;
  const homePwr = computePowerScore(homeT).power;
  const diff = (homePwr - awayPwr) * 0.4 + 2.0; // home court ~2pts
  const homeProb = 1 / (1 + Math.exp(-diff * 0.15));
  const homePct = Math.round(Math.max(28, Math.min(75, homeProb * 100)));
  return { homePct, awayPct: 100 - homePct };
}


function normAbbr(a) { return ABBR_MAP[a] || a; }



function parseESPNGames(data, dateStr) {
  const events = data?.events || [];
  return events.map(evt => {
    const comp = evt.competitions?.[0];
    if (!comp) return null;
    const homeComp = comp.competitors?.find(c => c.homeAway === 'home');
    const awayComp = comp.competitors?.find(c => c.homeAway === 'away');
    const home = normAbbr(homeComp?.team?.abbreviation || '');
    const away = normAbbr(awayComp?.team?.abbreviation || '');
    const homeScore = +(homeComp?.score || 0);
    const awayScore = +(awayComp?.score || 0);
    const statusType = comp.status?.type;
    const isFinal = statusType?.completed === true;
    const isLive = !isFinal && (statusType?.state === 'in');
    const isUpcoming = !isFinal && !isLive;
    const statusText = statusType?.shortDetail || comp.status?.type?.detail || '';
    let tipDisplay = '';
    if (isUpcoming && statusText) {
      // Extract time from status text like "3/27 - 7:00 PM ET" or "7:00 PM ET"
      const timeMatch = statusText.match(/(\d{1,2}:\d{2}\s*[AP]M)/i);
      tipDisplay = timeMatch ? timeMatch[1].toUpperCase() : statusText.replace(/ ET$/,'').toUpperCase();
    }
    const status = isLive ? statusText : (isFinal ? 'Final' : statusText);
    // Extract moneylines from ESPN odds data
    const oddsData = comp.odds && comp.odds[0];
    const homeML = oddsData?.homeTeamOdds?.moneyLine || oddsData?.homeTeamOdds?.current?.moneyLine || null;
    const awayML = oddsData?.awayTeamOdds?.moneyLine || oddsData?.awayTeamOdds?.current?.moneyLine || null;
    const eventId = evt.id || null;
    // Extract each team's current W-L record embedded in the scoreboard response
    function parseCompRecord(comp) {
      const rec = (comp?.records || []).find(r => r.type === 'total' || r.name === 'overall');
      if (!rec?.summary) return null;
      const [w, l] = rec.summary.split('-').map(Number);
      return (!isNaN(w) && !isNaN(l)) ? { w, l } : null;
    }
    const homeRecord = parseCompRecord(homeComp);
    const awayRecord  = parseCompRecord(awayComp);
    return { home, away, homeScore, awayScore, date: dateStr, tipDisplay, isFinal, isLive, isUpcoming, status, homeML, awayML, eventId, homeRecord, awayRecord };
  }).filter(Boolean);
}

function getLogoUrl(abbr) {
  const id = NBA_TEAM_IDS[abbr];
  return id ? `https://cdn.nba.com/logos/nba/${id}/global/L/logo.svg` : '';
}


// Much more balanced · any team can beat any team on a given night
function simWinProb(teamA, teamB, aIsHome) {
  const powerA = teamA.power || computePowerScore(teamA).power;
  const powerB = teamB.power || computePowerScore(teamB).power;
  const homeBonus = aIsHome ? 2.0 : -2.0; // home court worth ~2 pts

  // Recent form bonus: teams on win streaks get a small boost
  const formA = getFormFactor(teamA);
  const formB = getFormFactor(teamB);

  // Compress power difference significantly · NBA is a parity league
  // Use 0.4 multiplier (was 0.8) to flatten the curve
  const diff = (powerA - powerB) * 0.4 + homeBonus + (formA - formB) * 1.2;
  const prob = 1 / (1 + Math.exp(-diff * 0.15));

  // Clamp to realistic range: even massive favorites can lose (floor 30%, ceiling 75%)
  // This ensures upsets happen regularly like real NBA
  return Math.max(0.28, Math.min(0.75, prob));
}

// Compute a form factor based on recent streak & season variance
function getFormFactor(team) {
  // Simulate form from streak field if available, else use small random noise
  const streak = team.streak || 0; // positive = win streak, negative = loss streak
  // Small form bonus/penalty, capped at ±2.5 points
  return Math.max(-2.5, Math.min(2.5, streak * 0.4));
}

function simGame(teamA, teamB, aIsHome) {
  const prob = simWinProb(teamA, teamB, aIsHome);
  return Math.random() < prob ? teamA.abbr : teamB.abbr;
}

// Simulate a playoff series, return { winner, loser, wWins, lWins, games }
function simSeries(teamA, teamB) {
  if (!teamA || !teamB) return { winner: teamA || teamB, loser: null, wWins: 4, lWins: 0, games: 4 };
  let winsA = 0, winsB = 0;
  let gameNum = 0;
  // Home court: teamA has home court (higher seed passed first)
  while (winsA < 4 && winsB < 4) {
    gameNum++;
    const aIsHome = [1,2,5,7].includes(gameNum); // HH AA HA H
    const w = simGame(teamA, teamB, aIsHome);
    if (w === teamA.abbr) winsA++; else winsB++;
  }
  const winner = winsA === 4 ? teamA : teamB;
  const loser = winsA === 4 ? teamB : teamA;
  return { winner, loser, wWins: Math.max(winsA, winsB), lWins: Math.min(winsA, winsB), games: winsA + winsB };
}

function simPlayIn78(t7, t8) {
  const w = simGame(t7, t8, true); // 7 seed hosts
  return w === t7.abbr ? t7 : t8;
}
function simPlayIn8(t9, t10, loserOf78) {
  // 9 vs 10 game first
  const w910 = simGame(t9, t10, true) === t9.abbr ? t9 : t10;
  // Winner of 9/10 plays loser of 7/8 for 8 seed
  const w = simGame(loserOf78, w910, false); // neutral-ish
  return w === loserOf78.abbr ? loserOf78 : w910;
}

function seedConferenceSim(teams, byAbbr) {
  return [...teams].map(t => ({
    ...t,
    simWins: byAbbr[t.abbr].simWins,
    simLosses: byAbbr[t.abbr].simLosses,
    power: computePowerScore(t).power
  })).sort((a, b) => {
    const aP = a.simWins / (a.simWins + a.simLosses);
    const bP = b.simWins / (b.simWins + b.simLosses);
    if (Math.abs(aP - bP) > 0.001) return bP - aP;
    return b.power - a.power;
  });
}

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
// Get all remaining regular season game dates from the ESPN calendar
function getRemainingSeasonDates() {
  const today = new Date();
  const dates = [];
  // Regular season typically ends around April 13; generate dates through Apr 15 to be safe
  const endDate = new Date(today.getFullYear(), 3, 15); // April 15
  const d = new Date(today);
  d.setDate(d.getDate() + 1); // start from tomorrow
  while (d <= endDate) {
    dates.push(localDateStr(new Date(d)));
    d.setDate(d.getDate() + 1);
  }
  return dates;
}
