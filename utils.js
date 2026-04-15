
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


function simulateFullPlayoffs(wSeeds, eSeeds) {
  // Structure: { west: { r1, semi, cf }, east: { r1, semi, cf }, finals }
  // R1 matchups: 1v8, 4v5, 3v6, 2v7
  function buildR1(seeds) {
    return [
      simSeries(seeds[0], seeds[7]),
      simSeries(seeds[3], seeds[4]),
      simSeries(seeds[2], seeds[5]),
      simSeries(seeds[1], seeds[6]),
    ];
  }

  const wR1 = buildR1(wSeeds);
  const eR1 = buildR1(eSeeds);

  const wSemi = [
    simSeries(wR1[0].winner, wR1[1].winner),
    simSeries(wR1[2].winner, wR1[3].winner),
  ];
  const eSemi = [
    simSeries(eR1[0].winner, eR1[1].winner),
    simSeries(eR1[2].winner, eR1[3].winner),
  ];

  const wCF = simSeries(wSemi[0].winner, wSemi[1].winner);
  const eCF = simSeries(eSemi[0].winner, eSemi[1].winner);

  const finals = simSeries(wCF.winner, eCF.winner);

  return { wR1, eR1, wSemi, eSemi, wCF, eCF, finals };
}

// ---- Render sim results ----
function renderSimResults(result) {
  const { simWest, simEast, wSeeds, eSeeds, playoffResult, standings } = result;

  // Standings section
  let standHtml = `<div style="margin-bottom:28px">
    <div class="section-header" style="margin-bottom:14px">
      <div class="section-title" style="font-size:1.5rem">Projected Final Standings</div>
      <div class="section-sub">Simulated remaining games · W/L change from current</div>
    </div>
    <div class="sim-standings-grid">`;

  function confStandings(teams, confLabel, cls) {
    let h = `<div class="sim-conf-card">
      <div class="sim-conf-header ${cls}">${confLabel} Conference</div>`;
    teams.forEach((t, i) => {
      const orig = standings.find(s => s.abbr === t.abbr);
      const winDelta = t.simWins - orig.wins;
      const badge = i < 6 ? 'playoff' : i < 10 ? 'playin' : 'out';
      const badgeLabel = i < 6 ? 'Playoff' : i < 10 ? 'Play-In' : 'Out';
      const seedClass = i >= 6 && i < 10 ? ' playin-seed' : '';
      const deltaStr = winDelta > 0 ? `+${winDelta}W` : winDelta < 0 ? `${winDelta}W` : '';
      const deltaClass = winDelta > 0 ? 'pos' : winDelta < 0 ? 'neg' : 'neu';
      const colors = TEAM_COLORS[t.abbr] || { bg: 'var(--surface2)', text: '#fff' };
      const logo = getLogoUrl(t.abbr);
      h += `<div class="sim-seed-row">
        <span class="sim-seed-num${seedClass}">${i+1}</span>
        <div style="width:28px;height:22px;border-radius:4px;background:${colors.bg};border:1px solid ${colors.bg}88;display:flex;align-items:center;justify-content:center;flex-shrink:0;padding:2px">
          <img src="${logo}" alt="${t.abbr}" style="width:100%;height:100%;object-fit:contain" onerror="this.style.display='none'">
        </div>
        <span style="font-family:'Barlow Condensed',sans-serif;font-weight:700;font-size:0.9rem;flex:1">${t.abbr}</span>
        <span class="sim-seed-badge ${badge}">${badgeLabel}</span>
        <span class="sim-seed-record">${t.simWins}–${t.simLosses}</span>
        <span class="sim-seed-delta ${deltaClass}">${deltaStr}</span>
      </div>`;
      if (i === 5) h += `<div style="height:2px;background:rgba(255,77,0,0.4);margin:1px 0"></div>`;
      if (i === 9) h += `<div style="height:1px;background:rgba(255,51,85,0.3);margin:1px 0"></div>`;
    });
    h += `</div>`;
    return h;
  }

  standHtml += confStandings(simWest, 'Western', 'west');
  standHtml += confStandings(simEast, 'Eastern', 'east');
  standHtml += `</div></div>`;

  // Bracket section
  let bktHtml = `<div class="sim-bracket-section">
    <div class="section-header" style="margin-bottom:14px">
      <div class="section-title" style="font-size:1.5rem">Simulated Playoffs</div>
      <div class="section-sub">Series results · Click "Re-Simulate" for a different outcome</div>
    </div>`;

  // Champion banner at top
  const champ = playoffResult.finals.winner;
  const champColors = TEAM_COLORS[champ.abbr] || { bg: '#ffaa00' };
  const champLogo = getLogoUrl(champ.abbr);
  bktHtml += `<div class="sim-champion-banner" style="border-color:${champColors.bg};margin-bottom:24px">
    <div style="display:flex;align-items:center;justify-content:center;gap:16px;flex-wrap:wrap">
      <div style="font-size:2.5rem">🏆</div>
      <div>
        <div class="sim-champ-label">2025–26 NBA Champion</div>
        <div class="sim-champ-name" style="color:${champColors.bg}">${champ.name}</div>
        <div class="sim-champ-series">Defeated ${playoffResult.finals.loser.name} ${playoffResult.finals.wWins}–${playoffResult.finals.lWins} in ${playoffResult.finals.games} games</div>
      </div>
      <div style="width:60px;height:48px;background:${champColors.bg};border-radius:8px;display:flex;align-items:center;justify-content:center;padding:5px">
        <img src="${champLogo}" alt="${champ.abbr}" style="width:100%;height:100%;object-fit:contain" onerror="this.style.display='none'">
      </div>
    </div>
  </div>`;

  // Bracket visual
  bktHtml += `<div style="display:flex;justify-content:space-between;margin-bottom:0">
    <div class="bracket-conf-label west-label" style="flex:1;font-size:1.2rem">WESTERN CONFERENCE</div>
    <div style="width:140px"></div>
    <div class="bracket-conf-label east-label" style="flex:1;font-size:1.2rem">EASTERN CONFERENCE</div>
  </div>`;

  bktHtml += `<div class="bracket-tree-wrap"><div class="bracket-tree" style="min-height:580px">`;
  bktHtml += buildSimHalf('west', wSeeds, playoffResult.wR1, playoffResult.wSemi, playoffResult.wCF);
  bktHtml += buildSimFinalsCol(playoffResult);
  bktHtml += buildSimHalf('east', eSeeds, playoffResult.eR1, playoffResult.eSemi, playoffResult.eCF);
  bktHtml += `</div></div>`;

  bktHtml += `</div>`;

  document.getElementById('sim-standings-section').innerHTML = standHtml;
  document.getElementById('sim-bracket-section').innerHTML = bktHtml;
}

function simTeamRow(seed, team, won, seriesW, seriesL) {
  if (!team) return `<div class="sim-bkt-team-row"><span class="sim-bkt-seed">?</span><span class="sim-bkt-name" style="color:var(--muted)">TBD</span></div>`;
  const colors = TEAM_COLORS[team.abbr] || { bg: 'var(--surface2)', text: '#fff' };
  const logo = getLogoUrl(team.abbr);
  const cls = won ? 'winner' : 'loser';
  const winsHtml = seriesW !== undefined ? `<span class="sim-bkt-wins ${won?'w':'l'}">${won ? seriesW : seriesL}</span>` : '';
  return `<div class="sim-bkt-team-row ${cls}">
    <span class="sim-bkt-seed">${seed||''}</span>
    <div style="width:30px;height:24px;border-radius:5px;background:${colors.bg};border:1px solid ${colors.bg}88;display:flex;align-items:center;justify-content:center;padding:2px;flex-shrink:0">
      <img src="${logo}" alt="${team.abbr}" style="width:100%;height:100%;object-fit:contain" onerror="this.style.display='none'">
    </div>
    <span class="sim-bkt-name">${team.abbr}</span>
    ${winsHtml}
  </div>`;
}

function simMatchupHtml(series, topSeed, botSeed) {
  if (!series) return `<div class="sim-bkt-empty">TBD</div>`;
  const topIsWinner = series.winner && series.winner.abbr === series.winner.abbr; // always true
  // figure out which team was "top" (first arg)
  const topTeam = series.winner; // we'll reconstruct based on passed seeds
  const botTeam = series.loser;
  // We need to know which was top/bot · pass explicitly
  return null; // handled inline
}

function buildSimHalf(conf, seeds, r1, semi, cf) {
  const side = conf;
  let h = `<div class="bracket-half ${side}">`;

  // R1 (4 matchups)
  h += `<div class="bkt-round bkt-r1">`;
  const r1Pairings = [[0,7],[3,4],[2,5],[1,6]];
  const r1Seeds = [[1,8],[4,5],[3,6],[2,7]];
  r1.forEach((series, i) => {
    const [sA, sB] = r1Seeds[i];
    const [idxA, idxB] = r1Pairings[i];
    const teamA = seeds[idxA], teamB = seeds[idxB];
    const aWon = series.winner && series.winner.abbr === teamA.abbr;
    h += `<div class="sim-bkt-matchup">
      ${simTeamRow(sA, teamA, aWon, series.wWins, series.lWins)}
      ${simTeamRow(sB, teamB, !aWon, series.wWins, series.lWins)}
      <div class="sim-series-label clinched">${series.winner.abbr} wins ${series.wWins}–${series.lWins} (${series.games}G)</div>
    </div>`;
  });
  h += `</div>`;

  // Connector
  h += `<div class="bkt-conn-col">
    <div class="bkt-conn"><div class="conn-top"></div><div class="conn-bot"></div></div>
    <div class="bkt-conn"><div class="conn-top"></div><div class="conn-bot"></div></div>
  </div>`;

  // Semis (2 matchups)
  h += `<div class="bkt-round bkt-semis">`;
  semi.forEach((series, i) => {
    const teamA = series.winner, teamB = series.loser;
    const aWon = true;
    h += `<div class="sim-bkt-matchup">
      ${simTeamRow('', teamA, true, series.wWins, series.lWins)}
      ${simTeamRow('', teamB, false, series.wWins, series.lWins)}
      <div class="sim-series-label clinched">${series.winner.abbr} wins ${series.wWins}–${series.lWins} (${series.games}G)</div>
    </div>`;
  });
  h += `</div>`;

  // Connector
  h += `<div class="bkt-conn-col">
    <div class="bkt-conn"><div class="conn-top"></div><div class="conn-bot"></div></div>
  </div>`;

  // Conf Finals
  h += `<div class="bkt-round bkt-cf">`;
  h += `<div class="sim-bkt-matchup">
    ${simTeamRow('', cf.winner, true, cf.wWins, cf.lWins)}
    ${simTeamRow('', cf.loser, false, cf.wWins, cf.lWins)}
    <div class="sim-series-label clinched">${cf.winner.abbr} wins ${cf.wWins}–${cf.lWins} (${cf.games}G)</div>
  </div>`;
  h += `</div>`;

  h += `</div>`;
  return h;
}

function buildSimFinalsCol(result) {
  const { finals } = result;
  const colors = TEAM_COLORS[finals.winner.abbr] || { bg: '#ffaa00' };
  return `<div class="bracket-finals-col">
    <div class="bkt-finals has-teams" style="border-color:${colors.bg}">
      🏆<br>NBA<br>FINALS
      <div class="finals-team" style="color:${colors.bg}">${finals.winner.abbr}</div>
      <div class="finals-sub">${finals.wWins}–${finals.lWins} (${finals.games}G)</div>
    </div>
  </div>`;
}


// ============================================================
// NEWS RENDERING
// ============================================================

function renderNewsCard(item) {
  let html = '';

  if (item.type === 'finals') {
    const { champion, finalist, finalsResult, leaders } = item.data;
    const cc = TEAM_COLORS[champion.abbr] || { bg: '#ffaa00' };
    const fmvp = leaders.fmvp;
    html = `<div class="news-finals-card" style="border-color:${cc.bg}55">
      <div style="display:flex;align-items:center;gap:14px;margin-bottom:16px">
        <div style="font-size:2.5rem">🏆</div>
        <div>
          <div class="news-finals-title">${champion.name} are NBA Champions!</div>
          <div class="news-finals-sub">Defeated ${finalist.name} ${finalsResult.wWins}–${finalsResult.lWins} in ${finalsResult.games} games</div>
        </div>
      </div>
      ${fmvp.player ? `<div style="font-family:'Barlow Condensed',sans-serif;font-size:0.75rem;letter-spacing:3px;text-transform:uppercase;color:var(--gold);margin-bottom:10px">🥇 Finals MVP: <strong style="color:#fff">${fmvp.player.name}</strong> · ${fmvp.ppg} PPG / ${fmvp.rpg} RPG / ${fmvp.apg} APG</div>` : ''}
      <div class="news-leaders-grid">
        ${renderLeader(leaders.ppgLeader)}
        ${renderLeader(leaders.astLeader)}
        ${renderLeader(leaders.rebLeader)}
        ${leaders.defPlayer.player ? `<div class="news-leader-card">
          <div class="news-leader-cat">Def. Player</div>
          <div class="news-leader-name">${leaders.defPlayer.player.name}</div>
          <div class="news-leader-team">${leaders.defPlayer.team?.abbr || ''}</div>
          <div class="news-leader-val">🛡️</div>
        </div>` : ''}
      </div>
    </div>`;
    return html;
  }

  const catMap = {
    sweep: ['news-cat-record','SWEEP'],
    upset: ['news-cat-upset','UPSET'],
    injury: ['news-cat-injury','INJURY'],
    scoring: ['news-cat-performance','PERFORMANCE'],
    winrecord: ['news-cat-record','RECORD'],
    seven: ['news-cat-drama','DRAMA'],
    margin: ['news-cat-record','RECORD'],
    cinderella: ['news-cat-upset','CINDERELLA'],
    goat: ['news-cat-performance','LEGACY'],
    firingRumor: ['news-cat-drama','COACHING'],
    controversial: ['news-cat-drama','CONTROVERSY'],
    comeback: ['news-cat-upset','COMEBACK'],
  };
  const [catClass, catLabel] = catMap[item.type] || ['news-cat-record','NEWS'];
  const stripeColors = { 'news-cat-injury':'#ff3355','news-cat-record':'#ffaa00','news-cat-performance':'#00e87a','news-cat-drama':'#cc88ff','news-cat-upset':'#ff8844' };
  const stripeColor = stripeColors[catClass] || '#ff4d00';

  let headline = '', body = '', statsHtml = '';
  const now = new Date();
  const timestamps = ['Round 1','Second Round','Conference Semifinals','Conference Finals','NBA Finals'];
  const ts = timestamps[Math.floor(Math.random() * timestamps.length)];

  if (item.type === 'sweep') {
    const { series } = item;
    headline = `${series.winner.name.toUpperCase()} MAKE IT LOOK EASY IN DOMINANT SWEEP`;
    body = `<strong>${series.winner.name}</strong> wasted absolutely no time, dispatching <strong>${series.loser.name}</strong> without dropping a single game. It was a clinical, suffocating display · the kind that sends a message to every other team left in the bracket. Rest advantage? ${series.winner.name} will have plenty of it.`;
  } else if (item.type === 'upset') {
    const { series } = item;
    headline = `STUNNER: ${series.winner.name.toUpperCase()} ELIMINATE FAVORED ${series.loser.name.toUpperCase()}`;
    body = `Nobody had <strong>${series.winner.name}</strong> winning this series, and yet here we are. The <strong>${series.loser.name}</strong> · expected to cruise · were exposed in ways that will haunt their front office all summer. This is the magic of the playoffs. Anything can happen, and it just did.`;
  } else if (item.type === 'injury') {
    const { player, injury, team, opp, series } = item;
    const oppName = opp ? opp.name : 'their opponents';
    const gameNum = Math.floor(Math.random() * 5) + 1;
    const teamName = team?.name || 'the team';

    // Pick from varied ESPN-style headline templates
    const injuryHeadlines = [
      `BREAKING: ${player.name.toUpperCase()} EXITS GAME ${gameNum} · ${injury.type.toUpperCase()}, STATUS ${injury.severity.toUpperCase()}`,
      `INJURY ALERT: ${player.name.toUpperCase()} GOES DOWN IN GAME ${gameNum}, ${teamName.toUpperCase()} HOLDING BREATH`,
      `${player.name.toUpperCase()} LIMPS OFF IN GAME ${gameNum} · SOURCE: ${injury.type.toUpperCase()}`,
      `SOURCES: ${player.name.toUpperCase()} ${injury.type.toUpperCase()} IN GAME ${gameNum}, STATUS IS ${injury.severity.toUpperCase()}`,
      `REPORT: ${player.name.toUpperCase()} HURT IN GAME ${gameNum} · INITIAL DIAGNOSIS IS ${injury.type.toUpperCase()}`,
    ];
    headline = injuryHeadlines[Math.floor(Math.random() * injuryHeadlines.length)];

    const bodyVariants = [
      `Trainers rushed onto the floor in Game ${gameNum} after <strong>${player.name}</strong> went down. Sources confirm the ${teamName} superstar <em>${injury.type}</em>. Severity is listed as <em>${injury.severity}</em>. The arena fell silent · this is the nightmare scenario everyone feared for the ${teamName} postseason run.`,
      `A collective gasp rippled through the arena in Game ${gameNum}. <strong>${player.name}</strong> crumpled to the floor after <em>${injury.type}</em>. The ${teamName} franchise player was helped to the locker room. Medical staff confirmed the injury is <em>${injury.severity}</em>. ${oppName} just got a massive advantage.`,
      `In what could be a season-altering moment, <strong>${player.name}</strong> left Game ${gameNum} in the ${Math.random() > 0.5 ? 'first half' : 'fourth quarter'} after appearing to <em>${injury.type}</em>. The ${teamName} locker room is reportedly in shock. The diagnosis: <em>${injury.severity}</em>. The basketball world is watching.`,
      `<strong>${player.name}</strong> was trending on social media within seconds of going down in Game ${gameNum}. The ${teamName} star <em>${injury.type}</em> and did not return. Team sources describe the injury as <em>${injury.severity}</em>. Whether this derails ${teamName}'s entire playoff run remains to be seen.`,
    ];
    body = bodyVariants[Math.floor(Math.random() * bodyVariants.length)];
  } else if (item.type === 'scoring') {
    const { player, team, evt, series } = item;
    const assists = Math.floor(Math.random() * 10) + 3;
    const rebounds = Math.floor(Math.random() * 10) + 4;
    const gameNum = Math.floor(Math.random() * 6) + 1;
    headline = `${player.name.toUpperCase()} DROPS ${evt.pts} IN GAME ${gameNum} · ALL-TIME PERFORMANCE`;
    body = `Historians are scrambling through the record books. <strong>${player.name}</strong> ${evt.desc} <strong>${evt.pts} points</strong> in Game ${gameNum}, adding ${rebounds} rebounds and ${assists} assists for good measure. The building was in absolute pandemonium. Opponents looked defeated before halftime. This is a performance they'll be talking about for decades.`;
    statsHtml = `<div class="news-stats-row">
      <div class="news-stat-item"><div class="news-stat-val" style="color:var(--accent)">${evt.pts}</div><div class="news-stat-lbl">Points</div></div>
      <div class="news-stat-item"><div class="news-stat-val" style="color:var(--green)">${rebounds}</div><div class="news-stat-lbl">Rebounds</div></div>
      <div class="news-stat-item"><div class="news-stat-val" style="color:var(--blue)">${assists}</div><div class="news-stat-lbl">Assists</div></div>
    </div>`;
  } else if (item.type === 'winrecord') {
    const { team } = item;
    headline = `${team.name.toUpperCase()} FINISH WITH ALL-TIME GREAT RECORD: ${team.simWins}–${team.simLosses}`;
    body = `The <strong>${team.name}</strong> have completed one of the most dominant regular seasons in NBA history, finishing ${team.simWins}–${team.simLosses}. Basketball Reference servers are reportedly overloaded with fans looking up historical comparisons. <em>"Nobody was stopping this team,"</em> said one Western Conference scout. <em>"Nobody."</em>`;
  } else if (item.type === 'seven') {
    const { series } = item;
    headline = `EPIC: ${series.winner.name.toUpperCase()} SURVIVE 7-GAME WAR WITH ${series.loser.name.toUpperCase()}`;
    body = `They needed all seven games, and every single one of them felt like a Game 7. <strong>${series.winner.name}</strong> and <strong>${series.loser.name}</strong> gave the fans exactly what they paid for · a brutal, beautiful war that ended with the slimmest of margins. <strong>${series.winner.name}</strong> advance, but they'll need to recover fast.`;
  } else if (item.type === 'cinderella') {
    const { team } = item;
    headline = `THE CINDERELLA STORY: ${team.name.toUpperCase()} MAKE IMPROBABLE DEEP RUN`;
    body = `Nobody circled <strong>${team.name}</strong> in their bracket. Their ${team.simWins}–${team.simLosses} regular season record didn't exactly scream contender. And yet, here they are, thriving in the playoffs. Call it chemistry, call it luck, call it destiny · this team refuses to quit and the NBA world is absolutely riveted.`;
  } else if (item.type === 'goat') {
    const { player, team } = item;
    headline = `IS ${player.name.toUpperCase()} THE GREATEST PLAYOFF PERFORMER WE'VE EVER SEEN?`;
    body = `The GOAT conversation isn't going away after this. <strong>${player.name}</strong>'s postseason résumé after this championship run is nothing short of historic. Social media is melting, analysts are arguing, and grandparents are asking what a GOAT is. This performance demands respect regardless of where you stand.`;
  } else if (item.type === 'firingRumor') {
    const { team, coach } = item;
    headline = `RUMOR MILL: ${coach.toUpperCase()} COACHING FUTURE IN QUESTION AFTER FINALS LOSS`;
    body = `Sources close to the <strong>${team.name}</strong> organization say conversations have already begun about the team's direction. <strong>${coach}</strong> went to the Finals, but the question of "what could have been" is already creeping into boardroom discussions. A championship-or-bust mandate was always in play. Now the bust part may have consequences.`;
  } else if (item.type === 'controversial') {
    const { series } = item;
    const gameNum = Math.floor(Math.random() * 6) + 1;
    headline = `CONTROVERSY IN GAME ${gameNum}: REFS BLOW CALL IN ${series.winner.abbr} vs ${series.loser.abbr}`;
    body = `The basketball internet is on fire. With seconds remaining in Game ${gameNum}, a pivotal call · or non-call · has the <strong>${series.loser.name}</strong> fanbase convinced they were robbed. The NBA's Last Two Minute Report is already being prepped. The debate will rage for weeks. Whether it changed the series is impossible to say, but everyone has an opinion.`;
  } else if (item.type === 'comeback') {
    const { series } = item;
    headline = `DOWN 3-1, ${series.winner.name.toUpperCase()} STAGE MIRACLE COMEBACK`;
    body = `History said it was over. Statistically, <strong>${series.winner.name}</strong> had almost no chance. Trailing 3-1, they somehow did what almost no team in NBA history has done · won three straight to advance. The locker room speech on the eve of Game 5 will become the stuff of legend. The <strong>${series.loser.name}</strong> are absolutely devastated.`;
  }

  if (!headline) return '';

  html = `<div class="news-card">
    <div class="news-card-stripe" style="background:${stripeColor}"></div>
    <div class="news-card-body">
      <div class="news-card-meta">
        <span class="news-category-pill ${catClass}">${catLabel}</span>
        <span class="news-timestamp">${ts} · 2026 Playoffs</span>
      </div>
      <div class="news-headline">${headline}</div>
      <div class="news-body">${body}${statsHtml}</div>
    </div>
  </div>`;
  return html;
}

function renderLeader(l) {
  if (!l || !l.player) return '';
  return `<div class="news-leader-card">
    <div class="news-leader-cat">${l.label}</div>
    <div class="news-leader-name">${l.player.name}</div>
    <div class="news-leader-team">${l.team?.abbr || ''}</div>
    <div class="news-leader-val" style="color:var(--accent2)">${l.stat}</div>
  </div>`;
}

function renderNews(newsItems) {
  if (!newsItems || newsItems.length === 0) {
    document.getElementById('news-container').innerHTML = `<div style="text-align:center;padding:60px;color:var(--muted);font-family:'Barlow Condensed',sans-serif;letter-spacing:2px">NO NEWS STORIES GENERATED THIS SIMULATION</div>`;
    return;
  }

  let html = `<div class="news-layout">
    <div class="news-run-bar">
      <button class="news-run-btn" onclick="runSeasonSim()">▶ Re-Simulate & Refresh News</button>
      <div style="font-family:'Barlow Condensed',sans-serif;font-size:0.82rem;letter-spacing:1px;color:var(--muted);flex:1">
        ${newsItems.length} stories generated · Click stories may vary each simulation
      </div>
    </div>
    <div class="news-feed">`;

  // Finals card first
  const finalsItem = newsItems.find(i => i.type === 'finals');
  if (finalsItem) html += renderNewsCard(finalsItem);

  // Rest shuffled
  const rest = newsItems.filter(i => i.type !== 'finals');
  rest.sort(() => Math.random() - 0.5);
  rest.forEach(item => { html += renderNewsCard(item); });

  html += `</div></div>`;
  document.getElementById('news-container').innerHTML = html;
}

// ============================================================
// BETTING UTILITIES
// ============================================================

// American odds → payout on $10 stake (returns net profit, not total return)
// e.g. -110 → $9.09 profit;  +150 → $15.00 profit;  +100 → $10.00 profit
function _mlPayout(moneyLine, stake) {
  stake = stake || 10;
  if (!moneyLine || moneyLine === 0) return stake; // no line → treat as even money
  if (moneyLine > 0) {
    return Math.round((stake * moneyLine / 100) * 100) / 100;
  } else {
    return Math.round((stake / (Math.abs(moneyLine) / 100)) * 100) / 100;
  }
}


// Format dollar amount with sign: +$9.09 or -$10.00
function _fmtDollars(amt) {
  const sign = amt >= 0 ? '+' : '-';
  return sign + '$' + Math.abs(amt).toFixed(2);
}

// Attach moneylines to stored picks from the odds cache for a date
// Mutates picks in place, returns true if anything was added
function _attachMoneylines(picks, oddsMap) {
  let changed = false;
  picks.forEach(pick => {
    const key = pick.awayAbbr + '@' + pick.homeAbbr;
    const odds = oddsMap[key];
    if (!odds) return;
    if (pick.homeML !== odds.homeML || pick.awayML !== odds.awayML) {
      pick.homeML = odds.homeML;
      pick.awayML = odds.awayML;
      changed = true;
    }
  });
  return changed;
}

// Compute net P&L for a single graded pick ($10 stake)
// Returns { payout, net } where net is profit (positive) or loss (negative)
function _pickBetResult(pick) {
  const STAKE = 10;
  if (!pick.result) return null;
  if (pick.result !== 'correct') return { payout: 0, net: -STAKE }; // lost $10
  // Won — determine which ML to use
  const pickIsHome = pick.pick === pick.homeAbbr;
  const ml = pickIsHome ? pick.homeML : pick.awayML;
  if (!ml) {
    // No odds — treat as -110 (standard)
    const payout = _mlPayout(-110, STAKE);
    return { payout, net: payout };
  }
  const payout = _mlPayout(ml, STAKE);
  return { payout, net: payout };
}


// ============================================================
// NEWS GENERATION ENGINE
// ============================================================

function generateSimNews(result) {
  const { simWest, simEast, playoffResult, standings } = result;
  const allSeries = [
    ...playoffResult.wR1, ...playoffResult.eR1,
    ...playoffResult.wSemi, ...playoffResult.eSemi,
    playoffResult.wCF, playoffResult.eCF, playoffResult.finals
  ];
  const champion = playoffResult.finals.winner;
  const finalist = playoffResult.finals.loser;
  const newsItems = [];

  // ── ALWAYS: Finals recap card ──────────────────────────────
  const finalsLeaders = generateFinalsLeaders(allSeries, champion, finalist);
  newsItems.push({ type: 'finals', data: { champion, finalist, finalsResult: playoffResult.finals, leaders: finalsLeaders } });

  // ── SWEEPS ─────────────────────────────────────────────────
  allSeries.forEach(series => {
    if (series && series.lWins === 0 && Math.random() < 0.7) {
      newsItems.push({ type: 'sweep', series });
    }
  });

  // ── UPSETS ─────────────────────────────────────────────────
  allSeries.forEach(series => {
    if (!series || !series.winner || !series.loser) return;
    const winPow = series.winner.power || computePowerScore(series.winner).power;
    const losPow = series.loser.power || computePowerScore(series.loser).power;
    if (losPow - winPow > 3 && Math.random() < 0.85) {
      newsItems.push({ type: 'upset', series });
    }
  });

  // ── RANDOM EVENTS (each with realistic probability) ─────────

  // 1. Star player injury · only for genuine stars, 12% chance per playoff team
  const playoffTeams = new Set();
  allSeries.forEach(s => { if(s){ playoffTeams.add(s.winner?.abbr); playoffTeams.add(s.loser?.abbr); }});
  playoffTeams.forEach(abbr => {
    if (!abbr || !STAR_PLAYERS[abbr] || Math.random() > 0.12) return;
    // Only injure the #1 star (index 0) · never depth players
    const player = STAR_PLAYERS[abbr][Math.floor(Math.random() * STAR_PLAYERS[abbr].length)];
    const injury = INJURY_TYPES[Math.floor(Math.random() * INJURY_TYPES.length)];
    const teamSeries = allSeries.find(s => s && (s.winner?.abbr === abbr || s.loser?.abbr === abbr));
    const opp = teamSeries ? (teamSeries.winner?.abbr === abbr ? teamSeries.loser : teamSeries.winner) : null;
    newsItems.push({ type: 'injury', player, injury, team: STANDINGS_DATA.find(t => t.abbr === abbr), opp, series: teamSeries });
  });

  // 2. Historic scoring performance (4% chance per playoff game)
  const scoringEvents = [
    { pts: 72, desc: "breaks Michael Jordan's single-game playoff scoring record with an ASTOUNDING" },
    { pts: 68, desc: "has the game of a lifetime with" },
    { pts: 65, desc: "drops a mind-bending" },
    { pts: 61, desc: "goes absolutely nuclear with" },
    { pts: 58, desc: "lights up the scoreboard for" },
  ];
  if (Math.random() < 0.18) {
    const topTeams = [...playoffTeams].filter(a => STAR_PLAYERS[a]);
    const randAbbr = topTeams[Math.floor(Math.random() * topTeams.length)];
    if (randAbbr) {
      const player = STAR_PLAYERS[randAbbr][Math.floor(Math.random() * STAR_PLAYERS[randAbbr].length)];
      const evt = scoringEvents[Math.floor(Math.random() * scoringEvents.length)];
      const randSeries = allSeries[Math.floor(Math.random() * allSeries.length)];
      newsItems.push({ type: 'scoring', player, team: STANDINGS_DATA.find(t=>t.abbr===randAbbr), evt, series: randSeries });
    }
  }

  // 3. Regular season record (champion wins record)
  const champStanding = standings.find(t => t.abbr === champion.abbr);
  if (champStanding && champStanding.simWins >= 65 && Math.random() < 0.75) {
    newsItems.push({ type: 'winrecord', team: champStanding });
  }

  // 4. Series going 7 games
  const sevenGamers = allSeries.filter(s => s && s.games === 7);
  if (sevenGamers.length > 0 && Math.random() < 0.8) {
    newsItems.push({ type: 'seven', series: sevenGamers[Math.floor(Math.random() * sevenGamers.length)] });
  }

  // 5. Margin of victory record
  const chStanding = standings.find(t => t.abbr === champion.abbr);
  if (chStanding && Math.random() < 0.12) {
    newsItems.push({ type: 'margin', team: chStanding });
  }

  // 6. Underdog run (team seeded 5+ wins conf finals)
  const confFinalistsSeeds = [
    ...playoffResult.wSemi.map(s => s.winner),
    ...playoffResult.eSemi.map(s => s.winner),
  ];
  // Check if CF winner was lower seeded
  const wCFLoser = playoffResult.wCF.loser;
  const eCFLoser = playoffResult.eCF.loser;
  if (Math.random() < 0.2) {
    const udTeam = Math.random() < 0.5 ? playoffResult.wCF.winner : playoffResult.eCF.winner;
    const udStand = standings.find(t => t.abbr === udTeam?.abbr);
    if (udStand) newsItems.push({ type: 'cinderella', team: udStand, champion });
  }

  // 7. Goat debate moment (8% chance)
  if (Math.random() < 0.08 && STAR_PLAYERS[champion.abbr]) {
    const player = STAR_PLAYERS[champion.abbr][0];
    newsItems.push({ type: 'goat', player, team: champion });
  }

  // 8. Coach fired (losing team) 8% chance
  const COACHES = {OKC:"Mark Daigneault",SAS:"Gregg Popovich",DET:"JB Bickerstaff",BOS:"Joe Mazzulla",NYK:"Tom Thibodeau",LAL:"JJ Redick",DEN:"Michael Malone",CLE:"Kenny Atkinson",MIN:"Chris Finch",HOU:"Ime Udoka",ATL:"Quin Snyder",TOR:"Darko Rajakovic",PHI:"Nick Nurse",PHX:"Mike Budenholzer",CHA:"Charles Lee",MIA:"Erik Spoelstra",ORL:"Jamahl Mosley",LAC:"Tyronn Lue",POR:"Chauncey Billups",GSW:"Steve Kerr",MEM:"Taylor Jenkins",DAL:"Jason Kidd",SAC:"Doug Christie",IND:"Rick Carlisle"};
  if (Math.random() < 0.08) {
    const losingTeam = playoffResult.finals.loser;
    const coach = COACHES[losingTeam.abbr] || "the head coach";
    newsItems.push({ type: 'firingRumor', team: losingTeam, coach });
  }

  // 9. Controversial call (12% chance)
  if (Math.random() < 0.12) {
    const randSeries = allSeries[Math.floor(Math.random() * allSeries.length)];
    if (randSeries) newsItems.push({ type: 'controversial', series: randSeries });
  }

  // 10. Historic comeback
  if (Math.random() < 0.1) {
    const candidates = allSeries.filter(s => s && s.games >= 6);
    if (candidates.length) {
      newsItems.push({ type: 'comeback', series: candidates[Math.floor(Math.random() * candidates.length)] });
    }
  }

  return newsItems;
}

function generateFinalsLeaders(allSeries, champion, finalist) {
  // Generate plausible playoff stat leaders
  const playoffTeams = [...new Set(allSeries.flatMap(s => s ? [s.winner?.abbr, s.loser?.abbr].filter(Boolean) : []))];

  function randStar(abbr) {
    if (!abbr || !STAR_PLAYERS[abbr]) return null;
    return STAR_PLAYERS[abbr][0];
  }

  // PPG leader: tends to be from champion or finalist
  const pTeam = Math.random() < 0.6 ? champion.abbr : finalist.abbr;
  const ppgLeader = randStar(pTeam) || randStar(champion.abbr);
  const ppg = (28 + Math.random() * 12).toFixed(1);

  // Assists: PG type
  const pgTeams = playoffTeams.filter(a => STAR_PLAYERS[a]?.[0]?.pos === 'PG');
  const aTeam = pgTeams[Math.floor(Math.random() * pgTeams.length)] || champion.abbr;
  const astLeader = randStar(aTeam);
  const apg = (7 + Math.random() * 5).toFixed(1);

  // Rebounds: C type
  const cTeams = playoffTeams.filter(a => STAR_PLAYERS[a]?.[0]?.pos === 'C' || STAR_PLAYERS[a]?.[1]?.pos === 'C');
  const rTeam = cTeams[Math.floor(Math.random() * cTeams.length)] || champion.abbr;
  const rebLeader = (STAR_PLAYERS[rTeam] || []).find(p => p.pos === 'C') || randStar(rTeam);
  const rpg = (10 + Math.random() * 5).toFixed(1);

  // Finals MVP: best player on champion
  const fmvp = randStar(champion.abbr);
  const fmvpPpg = (25 + Math.random() * 15).toFixed(1);
  const fmvpRpg = (6 + Math.random() * 8).toFixed(1);
  const fmvpApg = (4 + Math.random() * 7).toFixed(1);

  // Defensive player: usually a big
  const defTeam = playoffTeams[Math.floor(Math.random() * playoffTeams.length)];
  const defPlayer = (STAR_PLAYERS[defTeam] || []).find(p => p.pos === 'C' || p.pos === 'PF') || randStar(defTeam);

  return {
    ppgLeader: { player: ppgLeader, team: STANDINGS_DATA.find(t=>t.abbr===pTeam), stat: ppg, label: 'PPG Leader' },
    astLeader: { player: astLeader, team: STANDINGS_DATA.find(t=>t.abbr===aTeam), stat: apg, label: 'APG Leader' },
    rebLeader: { player: rebLeader, team: STANDINGS_DATA.find(t=>t.abbr===rTeam), stat: rpg, label: 'RPG Leader' },
    fmvp: { player: fmvp, team: champion, ppg: fmvpPpg, rpg: fmvpRpg, apg: fmvpApg },
    defPlayer: { player: defPlayer, team: STANDINGS_DATA.find(t=>t.abbr===defTeam), label: 'Def. Player of Playoffs' },
  };
}

