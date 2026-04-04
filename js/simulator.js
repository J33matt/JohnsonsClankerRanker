function renderSimulator() {
  document.getElementById('simulator-container').innerHTML = `
    <div class="sim-tab-layout">
      <div class="sim-run-bar">
        <button class="sim-run-btn" id="sim-season-btn" onclick="runSeasonSim()">▶ Simulate Season</button>
        <div class="sim-run-desc">
          Simulates all remaining regular-season games using power ratings, home-court advantage, recent form & realistic variance · then runs the full playoffs. Generated news headlines will appear below!
        </div>
        <span class="sim-run-count-badge" id="sim-run-label" style="display:none"></span>
      </div>
      <div id="sim-results-area" style="display:none">
        <div id="sim-standings-section"></div>
        <div id="sim-bracket-section"></div>
      </div>
      <div id="sim-placeholder" style="text-align:center;padding:60px 0;color:var(--muted);font-family:'Barlow Condensed',sans-serif;letter-spacing:3px;font-size:0.85rem;text-transform:uppercase">
        Press Simulate to project the rest of the 2025–26 season
      </div>
    </div>`;
}

function runSeasonSim() {
  const btn = document.getElementById('sim-season-btn');
  btn.disabled = true;
  btn.textContent = '⟳ Simulating…';
  setTimeout(() => {
    try {
      const result = doFullSim();
      renderSimResults(result);
      // Generate news stories
      const newsItems = generateSimNews(result);
      renderNews(newsItems);
      // Show news section inside simulator
      const newsSection = document.getElementById('news-section-sim');
      if (newsSection) newsSection.style.display = '';
      // Flash the news section header
      const newsBtn = document.querySelector('[onclick*="showTab(\'news\'"]') || document.querySelector('.tab-btn:nth-child(5)');
      if (newsBtn) { newsBtn.style.color = 'var(--blue)'; setTimeout(() => newsBtn.style.color = '', 4000); }
    } catch(e) { console.error(e); }
    btn.disabled = false;
    btn.textContent = '▶ Re-Simulate';
    document.getElementById('sim-run-label').style.display = '';
    document.getElementById('sim-run-label').textContent = 'Run #' + (window._simRunCount = (window._simRunCount||0)+1);
    document.getElementById('sim-results-area').style.display = '';
    document.getElementById('sim-placeholder').style.display = 'none';
  }, 30);
}

// ---- Core simulation engine ----
function doFullSim() {
  // Clone standings
  const standings = STANDINGS_DATA.map(t => ({
    ...t,
    wins: t.wins, losses: t.losses,
    simWins: t.wins, simLosses: t.losses,
    ...computePowerScore(t)
  }));
  const byAbbr = {};
  standings.forEach(t => { byAbbr[t.abbr] = t; });

  // Count remaining games (each team plays 82)
  // Estimate remaining per team from current record
  // Build a simple schedule: remaining = 82 - played
  // Simulate inter-team games via round-robin remainder
  const TOTAL_GAMES = 82;
  const remaining = {};
  standings.forEach(t => {
    remaining[t.abbr] = TOTAL_GAMES - t.wins - t.losses;
  });

  // Build remaining game pairs via a deterministic schedule approach:
  // Group into conf, assign remaining matchups proportionally
  // We simulate each team's remaining games against opponents weighted by schedule
  // Use a simplified but realistic approach: simulate each team's remaining games
  // by picking opponents from their conference (60%) and overall (40%)
  // To avoid double-counting, we pair teams and simulate shared games
  const simmedPairs = new Set();
  const gamesPlayed = {}; // abbr -> games added this sim
  standings.forEach(t => { gamesPlayed[t.abbr] = 0; });

  // Generate matchup list: pair each team needing games with others
  const matchups = [];
  const shuffled = [...standings].sort(() => Math.random() - 0.5);
  for (let i = 0; i < shuffled.length; i++) {
    for (let j = i + 1; j < shuffled.length; j++) {
      const a = shuffled[i], b = shuffled[j];
      const key = [a.abbr, b.abbr].sort().join('|');
      if (simmedPairs.has(key)) continue;
      // How many games could these two still play?
      const canA = remaining[a.abbr] - gamesPlayed[a.abbr];
      const canB = remaining[b.abbr] - gamesPlayed[b.abbr];
      if (canA <= 0 || canB <= 0) continue;
      // Typically 1-4 games between teams remaining
      const sameConf = a.conf === b.conf;
      const maxGames = sameConf ? Math.min(canA, canB, 3) : Math.min(canA, canB, 2);
      if (maxGames <= 0) continue;
      const numGames = Math.max(1, Math.floor(Math.random() * maxGames) + 1);
      for (let g = 0; g < numGames; g++) {
        if (gamesPlayed[a.abbr] < remaining[a.abbr] && gamesPlayed[b.abbr] < remaining[b.abbr]) {
          matchups.push([a, b, g % 2 === 0]); // alternate home court
          gamesPlayed[a.abbr]++;
          gamesPlayed[b.abbr]++;
        }
      }
      simmedPairs.add(key);
    }
  }

  // Simulate each remaining game
  matchups.forEach(([teamA, teamB, aIsHome]) => {
    const winner = simGame(teamA, teamB, aIsHome);
    byAbbr[winner].simWins++;
    const loser = winner === teamA.abbr ? teamB.abbr : teamA.abbr;
    byAbbr[loser].simLosses++;
  });

  // Any team that still has games remaining (due to pairing gaps), simulate vs avg opponent
  standings.forEach(t => {
    let needed = TOTAL_GAMES - t.simWins - t.simLosses;
    while (needed > 0) {
      // Simulate vs a random opponent of similar strength
      const opp = standings[Math.floor(Math.random() * standings.length)];
      if (opp.abbr === t.abbr) { needed--; continue; }
      const winner = simGame(t, opp, Math.random() > 0.5);
      byAbbr[winner].simWins++;
      const loser = winner === t.abbr ? opp.abbr : t.abbr;
      byAbbr[loser].simLosses++;
      needed--;
    }
  });

  // Now seed conferences from sim results
  const simWest = seedConferenceSim(standings.filter(t => t.conf === 'WEST'), byAbbr);
  const simEast = seedConferenceSim(standings.filter(t => t.conf === 'EAST'), byAbbr);

  // Play-In simulation
  const wPI = simWest.slice(6, 10);
  const ePI = simEast.slice(6, 10);
  const wSeed7 = simPlayIn78(wPI[0], wPI[1]);
  const wSeed8 = simPlayIn8(wPI[2], wPI[3], wPI[0] === wSeed7 ? wPI[1] : wPI[0]);
  const eSeed7 = simPlayIn78(ePI[0], ePI[1]);
  const eSeed8 = simPlayIn8(ePI[2], ePI[3], ePI[0] === eSeed7 ? ePI[1] : ePI[0]);

  // Build playoff bracket seeds (8 per conf)
  const wSeeds = [...simWest.slice(0, 6), wSeed7, wSeed8];
  const eSeeds = [...simEast.slice(0, 6), eSeed7, eSeed8];

  // Simulate playoffs
  const playoffResult = simulateFullPlayoffs(wSeeds, eSeeds);

  return { simWest, simEast, wSeeds, eSeeds, playoffResult, standings };
}

// Win probability using power score + home advantage + recent form
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
async function fetchAIAnalysis() {
  // Build a rich, unique context from current streak + power data every call
  const sorted = ENRICHED_DATA.slice().sort((a,b) => b.power - a.power);
  const top3 = sorted.slice(0,3).map(t=>`${t.name} (power: ${t.power}, ${t.wins}-${t.losses}, streak: ${t.streak > 0 ? 'W'+t.streak : 'L'+Math.abs(t.streak)})`).join('; ');
  const hotTeams = ENRICHED_DATA.filter(t => (STREAK_DATA[t.abbr]||0) >= 5).sort((a,b)=>(STREAK_DATA[b.abbr]||0)-(STREAK_DATA[a.abbr]||0)).slice(0,2).map(t=>`${t.name} (${STREAK_DATA[t.abbr]}-game win streak, power ${t.power})`).join(', ');
  const coldTeams = ENRICHED_DATA.filter(t => (STREAK_DATA[t.abbr]||0) <= -5).sort((a,b)=>(STREAK_DATA[a.abbr]||0)-(STREAK_DATA[b.abbr]||0)).slice(0,2).map(t=>`${t.name} (${Math.abs(STREAK_DATA[t.abbr])}-game losing streak, power ${t.power})`).join(', ');
  const surprise = sorted.filter(t => t.power > sorted[4].power && (STREAK_DATA[t.abbr]||0) >= 3).slice(0,1).map(t=>t.name)[0] || sorted[3].name;
  
  // Add a random "angle" to force different emphasis each load
  const angles = [
    'Focus your analysis on the playoff race and who has the best shot at the title.',
    'Roast the teams on losing streaks without mercy. Be brutal.',
    'Make a bold prediction about which current hot team will flame out.',
    'Debate whether the top team is actually as good as their record or just schedule-fluffed.',
    'Talk about which team has the most alarming red flags hiding behind a decent record.',
    'Hype up the hottest team in the league right now like they\'re the second coming.',
    'Be skeptical · pick apart the top team\'s weaknesses even while acknowledging their dominance.',
    'Call out a cold team that should be better based on their roster and make it personal.',
  ];
  const angle = angles[Math.floor(Math.random() * angles.length)];

  const prompt = `You are Johnson, a hilariously opinionated and wildly knowledgeable NBA analyst writing for your website "Johnson's Clanker Ranker." Current 2025-26 NBA power rankings data: Top 3 teams: ${top3}. Teams on fire (5+ win streaks): ${hotTeams || 'none'}. Teams in freefall (5+ loss streaks): ${coldTeams || 'none'}. Surprise performer this stretch: ${surprise}. ${angle} Write exactly 3 punchy sentences, sharp, entertaining, with basketball slang. Be bold, be specific, use the actual team names and stats. Under 85 words total.`;
  
  try {
    const res = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "claude-sonnet-4-20250514",
        max_tokens: 200,
        messages: [{ role: "user", content: prompt }]
      })
    });
    const data = await res.json();
    const text = data.content?.map(c => c.text || '').join('') || "Analysis unavailable.";
    document.getElementById('ai-analysis-text').innerHTML = `<p style="line-height:1.75;">${text}</p>`;
  } catch(e) {
    // Fallback: generate a dynamic local analysis using the same data
    const fallbacks = [
      `${sorted[0].name} are operating on a different frequency right now · ${sorted[0].power} power score and nobody's close. ${hotTeams ? hotTeams.split(',')[0].split('(')[0].trim() + ' are absolutely scorching on a long win streak, the league should be scared.' : sorted[1].name + ' are keeping pace but that gap at the top is real.'} ${coldTeams ? coldTeams.split(',')[0].split('(')[0].trim() + ' are turning into a disaster at the worst possible time of year.' : 'Rest of the field is just playing for seeding at this point.'}`,
      `Let me be blunt: ${sorted[0].name} are the class of this league and it's not debatable. ${hotTeams ? hotTeams.split(',')[0].split('(')[0].trim() + ' are catching fire at exactly the right time · watch out.' : sorted[2].name + ' keep showing up and winning games nobody expected them to.'} ${coldTeams ? 'Meanwhile ' + coldTeams.split(',')[0].split('(')[0].trim() + ' are in a full-blown tailspin · management has to be sweating.' : sorted[sorted.length-1].name + ' need to figure things out fast or the draft lottery board is calling.'}`,
      `${sorted[0].name} have the best power score in the league and they're playing like it. ${hotTeams ? hotTeams.split(',')[0].split('(')[0].trim() + ' just won\'t stop · double-digit winning streak energy is real and other contenders should be worried.' : 'No team is really threatening the top right now, which is almost boring.'} ${coldTeams ? coldTeams.split(',')[0].split('(')[0].trim() + ' are a dumpster fire · multiple losses in a row and the questions are piling up.' : 'The bottom half of the league is just fighting for lottery position at this point.'}`,
    ];
    document.getElementById('ai-analysis-text').innerHTML = `<p style="line-height:1.75;">${fallbacks[Math.floor(Math.random() * fallbacks.length)]}</p>`;
  }
}
