function renderTrends() {
  const enriched = STANDINGS_DATA.map(t => ({ ...t, ...computePowerScore(t) }));

  // Best net ratings
  const byNet = [...enriched].sort((a,b) => b.netRtg - a.netRtg).slice(0, 5);
  // Worst
  const worstNet = [...enriched].sort((a,b) => a.netRtg - b.netRtg).slice(0, 5);
  // Most wins
  const mostWins = [...enriched].sort((a,b) => b.wins - a.wins).slice(0, 5);
  // Most losses
  const mostLoss = [...enriched].sort((a,b) => b.losses - a.losses).slice(0, 5);

  let html = `<div class="trends-grid">`;

  // Top offenses
  const byOrtg = [...enriched].sort((a,b) => b.ortg - a.ortg);
  html += `<div class="trend-card">
    <div class="trend-card-title"><span class="icon">🏀</span> Top Offensive Ratings</div>
    <ul class="trend-list">`;
  byOrtg.slice(0,5).forEach((t,i) => {
    html += `<li><span class="trend-team">${i+1}. ${t.name}</span><span class="trend-stat stat-green">${t.ortg}</span></li>`;
  });
  html += `</ul></div>`;

  // Best defenses
  const byDrtg = [...enriched].sort((a,b) => a.drtg - b.drtg);
  html += `<div class="trend-card">
    <div class="trend-card-title"><span class="icon">🛡</span> Best Defensive Ratings</div>
    <ul class="trend-list">`;
  byDrtg.slice(0,5).forEach((t,i) => {
    html += `<li><span class="trend-team">${i+1}. ${t.name}</span><span class="trend-stat stat-blue">${t.drtg}</span></li>`;
  });
  html += `</ul></div>`;

  // Best net ratings
  html += `<div class="trend-card">
    <div class="trend-card-title"><span class="icon">📈</span> Best Net Ratings</div>
    <ul class="trend-list">`;
  byNet.forEach((t,i) => {
    html += `<li><span class="trend-team">${i+1}. ${t.name}</span><span class="trend-stat stat-green">+${t.netRtg}</span></li>`;
  });
  html += `</ul></div>`;

  // Worst net
  html += `<div class="trend-card">
    <div class="trend-card-title"><span class="icon">📉</span> Worst Net Ratings</div>
    <ul class="trend-list">`;
  worstNet.forEach((t,i) => {
    html += `<li><span class="trend-team">${i+1}. ${t.name}</span><span class="trend-stat stat-red">${t.netRtg}</span></li>`;
  });
  html += `</ul></div>`;

  // Hottest streaks
  const hotStreaks = [...enriched].filter(t => (STREAK_DATA[t.abbr]||0) > 0).sort((a,b) => (STREAK_DATA[b.abbr]||0) - (STREAK_DATA[a.abbr]||0)).slice(0,5);
  html += `<div class="trend-card">
    <div class="trend-card-title"><span class="icon">🔥</span> Hottest Streaks</div>
    <ul class="trend-list">`;
  hotStreaks.forEach((t,i) => {
    const s = STREAK_DATA[t.abbr]||0;
    html += `<li><span class="trend-team">${i+1}. ${t.name}</span><span class="trend-badge ${getStreakClass(s)}">${getStreakLabel(s)}</span></li>`;
  });
  html += `</ul></div>`;

  // Coldest streaks
  const coldStreaks = [...enriched].filter(t => (STREAK_DATA[t.abbr]||0) < 0).sort((a,b) => (STREAK_DATA[a.abbr]||0) - (STREAK_DATA[b.abbr]||0)).slice(0,5);
  html += `<div class="trend-card">
    <div class="trend-card-title"><span class="icon">❄️</span> Coldest Streaks</div>
    <ul class="trend-list">`;
  coldStreaks.forEach((t,i) => {
    const s = STREAK_DATA[t.abbr]||0;
    html += `<li><span class="trend-team">${i+1}. ${t.name}</span><span class="trend-badge ${getStreakClass(s)}">${getStreakLabel(s)}</span></li>`;
  });
  html += `</ul></div>`;

  html += `</div>`;

  // Notable recent results
  html += `<div class="section-header" style="margin-top:8px;">
    <div class="section-title">Notable Recent Results</div>
    <div class="section-sub">Biggest upsets &amp; blowouts</div>
  </div>`;
  const notables = [
    {desc: "PHI drops 157 on CHI", note: "Philadelphia's highest-scoring game of the season in a +20 blowout."},
    {desc: "BOS snaps OKC's road dominance", note: "Boston beats the West's best team 119–109 at home."},
    {desc: "ATL edges DET in Detroit", note: "Atlanta steals a road win 130–129, cooling Pistons' momentum."},
    {desc: "MIA stifles CLE", note: "Heat win 120–103 in Cleveland, surprising given CLE's home strength."},
    {desc: "SAS demolishes MEM", note: "Spurs win 123–98 on the road, extending their elite road record."},
  ];
  html += `<div class="trend-card">
    <ul class="trend-list">`;
  notables.forEach(n => {
    html += `<li style="flex-direction:column;align-items:flex-start;gap:4px;">
      <div style="font-family:'Barlow Condensed',sans-serif;font-weight:700;font-size:1rem;color:var(--accent)">${n.desc}</div>
      <div style="font-size:0.85rem;color:var(--muted)">${n.note}</div>
    </li>`;
  });
  html += `</ul></div>`;

  document.getElementById('trends-container').innerHTML = html;
}

// ============================================================
// PLAYOFFS BRACKET
// ============================================================

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

// ============================================================
// NEWS GENERATION ENGINE
// ============================================================

const STAR_PLAYERS = {
  OKC: [{name:"Shai Gilgeous-Alexander",pos:"SG"},{name:"Chet Holmgren",pos:"C"}],
  SAS: [{name:"Victor Wembanyama",pos:"C"},{name:"Stephon Castle",pos:"PG"}],
  DET: [{name:"Cade Cunningham",pos:"PG"},{name:"Jalen Duren",pos:"C"}],
  BOS: [{name:"Jayson Tatum",pos:"SF"},{name:"Jaylen Brown",pos:"SG"}],
  NYK: [{name:"Jalen Brunson",pos:"PG"},{name:"Karl-Anthony Towns",pos:"C"},{name:"Landry Shamet",pos:"SG"}],
  LAL: [{name:"LeBron James",pos:"SF"},{name:"Anthony Davis",pos:"C"}],
  DEN: [{name:"Nikola Jokic",pos:"C"},{name:"Jamal Murray",pos:"PG"}],
  CLE: [{name:"Donovan Mitchell",pos:"SG"},{name:"Evan Mobley",pos:"PF"}],
  MIN: [{name:"Anthony Edwards",pos:"SG"},{name:"Karl-Anthony Towns",pos:"C"}],
  HOU: [{name:"Alperen Sengun",pos:"C"},{name:"Jalen Green",pos:"SG"}],
  ATL: [{name:"Trae Young",pos:"PG"},{name:"Zaccharie Risacher",pos:"SF"}],
  TOR: [{name:"Scottie Barnes",pos:"SF"},{name:"Immanuel Quickley",pos:"PG"}],
  PHI: [{name:"Tyrese Maxey",pos:"PG"},{name:"Joel Embiid",pos:"C"}],
  PHX: [{name:"Kevin Durant",pos:"SF"},{name:"Devin Booker",pos:"SG"}],
  CHA: [{name:"LaMelo Ball",pos:"PG"},{name:"Brandon Miller",pos:"SF"}],
  MIA: [{name:"Bam Adebayo",pos:"C"},{name:"Tyler Herro",pos:"SG"}],
  ORL: [{name:"Paolo Banchero",pos:"PF"},{name:"Franz Wagner",pos:"SF"}],
  LAC: [{name:"Kawhi Leonard",pos:"SF"},{name:"James Harden",pos:"PG"}],
  POR: [{name:"Scoot Henderson",pos:"PG"},{name:"Anfernee Simons",pos:"SG"}],
  GSW: [{name:"Stephen Curry",pos:"PG"},{name:"Draymond Green",pos:"PF"}],
  MEM: [{name:"Ja Morant",pos:"PG"},{name:"Desmond Bane",pos:"SG"}],
  DAL: [{name:"Cooper Flagg",pos:"SF"},{name:"Kyrie Irving",pos:"PG"}],
  SAC: [{name:"De'Aaron Fox",pos:"PG"},{name:"Domantas Sabonis",pos:"C"}],
  IND: [{name:"Tyrese Haliburton",pos:"PG"},{name:"Pascal Siakam",pos:"PF"}],
};

const INJURY_TYPES = [
  { type: "tears his ACL", severity: "season-ending", games: 0 },
  { type: "tears his Achilles", severity: "season-ending", games: 0 },
  { type: "breaks his wrist", severity: "series-ending", games: 0 },
  { type: "suffers a fractured orbital bone", severity: "2-3 games", games: 2 },
  { type: "strains his hamstring", severity: "game-time decision", games: 1 },
  { type: "rolls his ankle badly", severity: "1-2 games", games: 1 },
  { type: "goes down with a knee contusion", severity: "2-3 games", games: 2 },
  { type: "dislocates his shoulder", severity: "series-ending", games: 0 },
  { type: "pulls his quad", severity: "1-2 games", games: 1 },
];

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
    const player = STAR_PLAYERS[abbr][0];
    const injury = INJURY_TYPES[Math.floor(Math.random() * INJURY_TYPES.length)];
    const teamSeries = allSeries.find(s => s && (s.winner?.abbr === abbr || s.loser?.abbr === abbr));
    const opp = teamSeries ? (teamSeries.winner?.abbr === abbr ? teamSeries.loser : teamSeries.winner) : null;
    newsItems.push({ type: 'injury', player, injury, team: STANDINGS_DATA.find(t => t.abbr === abbr), opp, series: teamSeries });
  });

  // 2. Historic scoring performance (4% chance per playoff game)
  const scoringEvents = [
    { pts: 72, desc: "breaks Michael Jordan's single-game playoff scoring record with an ASTOUNDING" },
    { pts: 68, desc: "erupts for an eye-watering" },
    { pts: 65, desc: "drops a mind-bending" },
    { pts: 61, desc: "goes absolutely nuclear with" },
    { pts: 58, desc: "lights up the scoreboard for" },
  ];
  if (Math.random() < 0.18) {
    const topTeams = [...playoffTeams].filter(a => STAR_PLAYERS[a]);
    const randAbbr = topTeams[Math.floor(Math.random() * topTeams.length)];
    if (randAbbr) {
      const player = STAR_PLAYERS[randAbbr][0];
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
// GRAPH TAB · Weekly Power Rankings Chart
// ============================================================
