// ============================================================
// DRAFT TAB
// ============================================================
function renderDraft() {
  // Official NBA lottery odds by seed position (top-pick odds)
  const LOTTERY_ODDS = [14.0, 14.0, 14.0, 12.5, 10.5, 9.0, 7.5, 6.0, 4.5, 3.0, 2.0, 1.5, 1.0, 0.5];

  // Top prospects for 2026 draft — 10 for lottery picks + 2 extras shown in prospects section
  // Sources: ESPN Big Board, Bleacher Report, The Athletic (as of late March 2026)
  const PROSPECTS = [
    { rank: 1,  name: 'AJ Dybantsa',       school: 'BYU',         pos: 'SF',  ht: '6\'9"',  pts: 25.5, reb: 6.8, ast: 3.7, tier: 1, blurb: 'Nation\'s leading scorer and the statistical case for #1 overall. Pro-ready frame, 7\'0" wingspan, elite shot creation at any level. Went out of the tournament with 35 points — the Dybantsa hype is real.' },
    { rank: 2,  name: 'Darryn Peterson',    school: 'Kansas',      pos: 'SG',  ht: '6\'6"',  pts: 18.2, reb: 4.5, ast: 4.8, tier: 1, blurb: 'Most scouts have him as the most talented player in the class. Elite two-way profile, Kobe comp from the day he walked in the door. Lingering health questions are the only thing keeping this from being a runaway.' },
    { rank: 3,  name: 'Cameron Boozer',     school: 'Duke',        pos: 'PF',  ht: '6\'10"', pts: 23.0, reb: 10.0, ast: 4.1, tier: 1, blurb: 'ACC Player of the Year and one of the safest bets in the class. Double-double machine with advanced feel and a shooting range that keeps expanding. Some question the ceiling but the floor is undeniable.' },
    { rank: 4,  name: 'Caleb Wilson',       school: 'N. Carolina', pos: 'PF',  ht: '6\'10"', pts: 19.8, reb: 9.4, ast: 2.7, tier: 2, blurb: 'Top-3 box plus-minus in the country. Explosive athlete who rebounds, defends, and does damage in transition. Three-point shooting (26%) is the one thing standing between him and the top three.' },
    { rank: 5,  name: 'Kingston Flemings',  school: 'Houston',     pos: 'PG',  ht: '6\'4"',  pts: 16.5, reb: 3.9, ast: 5.4, tier: 2, blurb: 'Most explosive guard in the draft. His burst off the bounce is reminiscent of prime Derrick Rose. 49-point game against Alabama turned heads. Downhill style and elite finishing make him a nightmare in the open court.' },
    { rank: 6,  name: 'Keaton Wagler',      school: 'Illinois',    pos: 'SG',  ht: '6\'6"',  pts: 17.9, reb: 4.9, ast: 4.3, tier: 2, blurb: 'Big Ten Freshman of the Year who came out of nowhere to lock in a lottery spot. 41% from three, impeccable decision-making, and 6\'6" size at the guard position. Athleticism is the only real concern.' },
    { rank: 7,  name: 'Darius Acuff Jr.',   school: 'Arkansas',    pos: 'PG',  ht: '6\'2"',  pts: 22.2, reb: 3.0, ast: 6.4, tier: 2, blurb: 'Pure offensive engine with a Trae Young comp and sky-high ceiling. Footwork and ball handling are already NBA-ready. Defensive projection is the question mark but the scoring toolkit is elite.' },
    { rank: 8,  name: 'Nate Ament',         school: 'Tennessee',   pos: 'SF',  ht: '6\'10"', pts: 17.4, reb: 6.4, ast: 2.1, tier: 2, blurb: 'Big wing with a shot that translates and tools on both ends. Has been consistently putting up 20-point games down the stretch. Missed time with injury earlier in the year but is playing his best ball now.' },
    { rank: 9,  name: 'Mikel Brown Jr.',    school: 'Louisville',  pos: 'PG',  ht: '6\'3"',  pts: 18.2, reb: 3.3, ast: 4.7, tier: 3, blurb: 'Dynamic perimeter scorer who can go for 45 on any given night. Lightning-rod style offense with NBA-level shot-making and creativity. Back injury has teams doing extra due diligence at the combine.' },
    { rank: 10, name: 'Koa Peat',           school: 'Arizona',     pos: 'PF',  ht: '6\'8"',  pts: 13.8, reb: 5.3, ast: 2.7, tier: 3, blurb: 'Skilled, high-IQ forward who rebounds, defends, and distributes. Missed time with a leg injury and has been inconsistent since returning. Some execs think he helps himself by coming back in 2027.' },
    // Extra prospects shown in the prospects grid but not part of the lottery sim
    { rank: 11, name: 'Labaron Philon Jr.', school: 'Alabama',     pos: 'PG',  ht: '6\'3"',  pts: 21.5, reb: 4.2, ast: 5.4, tier: 3, blurb: 'Returned to college and has improved in every category. 53.6% FG, 38.6% from three. Opened the tournament with 29 points, 8 rebounds, 7 assists against Hofstra. Could push into the lottery by draft night.' },
    { rank: 12, name: 'Chris Cenac Jr.',    school: 'Houston',     pos: 'C',   ht: '6\'11"', pts: 13.6, reb: 8.2, ast: 1.9, tier: 3, blurb: 'Fluid 6\'11" big who has developed noticeably since November. Hauled in 18 rebounds against Idaho in the tournament. Developing offensive game with strong defensive instincts and real first-round upside.' },
  ];

  // Team needs for lottery teams based on ESPN/Bleacher Report expert analysis
  const TEAM_NEEDS = [
    { abbr: 'IND', name: 'Indiana Pacers', pick: '~#1–3', needs: ['Star Wing', 'Scoring Guard', 'Two-Way Player'], target: 'AJ Dybantsa', blurb: 'Haliburton returns from ACL next season. This pick is top-4 protected · must land in the lottery to keep it. Any top-4 prospect fits alongside a healthy Haliburton/Siakam core.' },
    { abbr: 'BKN', name: 'Brooklyn Nets', pick: '~#1–3', needs: ['Blue-Chip Star', 'Franchise Cornerstone', 'Wing'], target: 'Darryn Peterson', blurb: 'Rebuilding hard after the KD era. Desperately need a blue-chip talent. If Dybantsa is on the board, it\'s a no-brainer in under a second, per scouts.' },
    { abbr: 'WAS', name: 'Washington Wizards', pick: '~#1–3', needs: ['Star Forward', 'Complementary Scorer', 'Wing'], target: 'Cameron Boozer', blurb: 'Trae Young debuted recently, Anthony Davis return unclear. Could be Washington\'s last high-lottery dip for a while · Boozer\'s skill set complements their youth core.' },
    { abbr: 'SAC', name: 'Sacramento Kings', pick: '~#4', needs: ['Franchise Player', 'Point Guard', 'Athletic Wing'], target: 'Darius Acuff Jr.', blurb: 'Five rotation players injured · need a cornerstone to rebuild around. Best available player regardless of position. Must get finances in order by trading veterans.' },
    { abbr: 'UTA', name: 'Utah Jazz', pick: '~#5', needs: ['Backcourt Scorer', 'Two-Way Guard', 'Secondary Creator'], target: 'Darryn Peterson', blurb: 'Set in the frontcourt with Jackson & Markkanen. Backcourt is the priority. Peterson\'s two-way skills alongside Keyonte George would be perfect. Pick must land top-8 or goes to OKC.' },
    { abbr: 'DAL', name: 'Dallas Mavericks', pick: '~#6', needs: ['Wing Scorer', 'Playmaker', 'Secondary Star'], target: 'Cameron Boozer', blurb: 'Cooper Flagg already in place. Adding Boozer would create a formidable Durham-to-Dallas pipeline. His paint-to-perimeter scoring range creates matchup advantages alongside Flagg.' },
    { abbr: 'MEM', name: 'Memphis Grizzlies', pick: '~#7', needs: ['Guard Depth', 'Shooting', 'Versatile Wing'], target: 'Kingston Flemings', blurb: 'Rebuilding around young core. Need players who can fit around Ja Morant if he returns. Flemings\' explosiveness and improving jumper make him a strong fit.' },
    { abbr: 'NOP', name: 'New Orleans Pelicans', pick: 'ATL\'s via trade', needs: ['Backcourt Star', 'Young Creator', 'Scorer'], target: 'Darryn Peterson', blurb: 'Traded unprotected 2026 pick to Atlanta for Derik Queen. Rebuilding mode · the Pelicans have craved young star power in the backcourt for years.' },
    { abbr: 'MIL', name: 'Milwaukee Bucks', pick: '~#9', needs: ['Athletic Big', 'Versatile Defender', 'Development Wing'], target: 'Koa Peat', blurb: 'Post-Giannis rebuild underway. Need high-upside pieces on cheap rookie deals. Smart, winning player who can contribute immediately and develop over time.' },
    { abbr: 'GSW', name: 'Golden State Warriors', pick: '~#10', needs: ['Athletic Playmaker', 'Versatile Big', 'Future Core Piece'], target: 'Mikel Brown Jr.', blurb: 'No time to tank · need lottery luck. A dynamic perimeter scorer on a cheap rookie deal fits their window perfectly. Brown\'s creation ability and scoring upside is worth the medical risk.' },
    { abbr: 'CHI', name: 'Chicago Bulls', pick: '~#11', needs: ['Stretch Big', 'Shooting Wing', 'Secondary Scorer'], target: 'Nate Ament', blurb: 'Looking to complement their young guards with shooters. Ament\'s 6\'10" frame and shooting ability fits even with questions about his injury history this season.' },
    { abbr: 'CHA', name: 'Charlotte Hornets', pick: '~#12', needs: ['Big Man', 'Two-Way Big', 'Front Court Depth'], target: 'Chris Cenac Jr.', blurb: 'Surging late in the season. If Charlotte believes in its young core, Peat or Cenac provide useful complementary skills without requiring to swing for the fences.' },
  ];

  // Build lottery order from current standings
  const lotteryTeams = STANDINGS_DATA
    .filter(t => {
      const west = seedConference('WEST');
      const east = seedConference('EAST');
      const wPlay = new Set(west.slice(0,10).map(t=>t.abbr));
      const ePlay = new Set(east.slice(0,10).map(t=>t.abbr));
      return !wPlay.has(t.abbr) && !ePlay.has(t.abbr);
    });

  // Sort by losses desc (worst record = best lottery odds)
  lotteryTeams.sort((a, b) => {
    const apct = a.wins / (a.wins + a.losses);
    const bpct = b.wins / (b.wins + b.losses);
    return apct - bpct;
  });

  // If fewer than 14 lottery teams (edge case), pad
  while (lotteryTeams.length < 14) lotteryTeams.push(null);
  const lottery14 = lotteryTeams.slice(0, 14);

  // Lottery simulation engine (weighted random using ping-pong ball combos)
  function simulateLottery() {
    // Assign ping pong ball counts (out of 1000)
    const ballCounts = [140, 140, 140, 125, 105, 90, 75, 60, 45, 30, 20, 15, 10, 5];
    let pool = [];
    lottery14.forEach((team, i) => {
      const count = ballCounts[i] || 0;
      for (let j = 0; j < count; j++) pool.push(i);
    });
    // Shuffle pool
    for (let i = pool.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [pool[i], pool[j]] = [pool[j], pool[i]];
    }
    // Draw top 4 picks
    const drawn = [];
    const usedPool = [...pool];
    while (drawn.length < 4) {
      const idx = Math.floor(Math.random() * usedPool.length);
      const pick = usedPool[idx];
      if (!drawn.includes(pick)) drawn.push(pick);
      usedPool.splice(idx, 1);
      if (usedPool.length === 0) break;
    }
    // Remaining picks 5-14 in original order, skipping drawn ones
    const remaining = lottery14.map((_, i) => i).filter(i => !drawn.includes(i));
    return [...drawn, ...remaining];
  }

  // Positional fit map: which positions match each team's needs
  // Keys are need strings, values are prospect positions that satisfy them
  const NEED_POS_MAP = {
    'Star Wing': ['SF','PF','SG'], 'Scoring Guard': ['SG','PG','SF'],
    'Two-Way Player': ['SF','SG','PG'], 'Blue-Chip Star': ['SF','SG','PF','PG'],
    'Franchise Cornerstone': ['SF','PG','SG','PF'], 'Wing': ['SF','SG'],
    'Star Forward': ['PF','SF'], 'Complementary Scorer': ['SG','SF','PF'],
    'Franchise Player': ['PG','SG','SF','PF'], 'Point Guard': ['PG'],
    'Athletic Wing': ['SF','SG'], 'Backcourt Scorer': ['SG','PG'],
    'Two-Way Guard': ['SG','PG'], 'Secondary Creator': ['PG','SG'],
    'Wing Scorer': ['SF','SG'], 'Playmaker': ['PG','SG'],
    'Secondary Star': ['SF','SG','PF'], 'Guard Depth': ['PG','SG'],
    'Shooting': ['SG','SF','PF'], 'Versatile Wing': ['SF','SG'],
    'Backcourt Star': ['SG','PG'], 'Young Creator': ['PG','SG'],
    'Scorer': ['SG','SF','PF'], 'Athletic Big': ['C','PF'],
    'Versatile Defender': ['SF','PF','C'], 'Development Wing': ['SF','SG'],
    'Athletic Playmaker': ['PG','SG','SF'], 'Versatile Big': ['PF','C'],
    'Future Core Piece': ['SF','PG','SG','PF','C'],
    'Stretch Big': ['PF','C'], 'Shooting Wing': ['SF','SG'],
    'Secondary Scorer': ['SG','SF'], 'Big Man': ['C','PF'],
    'Two-Way Big': ['PF','C'], 'Front Court Depth': ['PF','C'],
  };

  // Realistic draft selection: top-3 are interchangeable, rest driven by need + tier
  function selectProspect(pickNum, teamNeeds, availableProspects) {
    if (availableProspects.length === 0) return null;

    if (pickNum <= 3) {
      // Top 3 picks: only tier-1 players are eligible for #1,
      // tier-1 & tier-2 for picks 2-3. Weighted by consensus rank.
      const eligible = availableProspects.filter(p => p.tier <= (pickNum === 1 ? 1 : 2));
      if (eligible.length === 0) return availableProspects[0];
      // Weights: rank 1 = 50, rank 2 = 30, rank 3 = 20 — #1 can shuffle but Koa Peat never goes here
      const weights = eligible.map(p => Math.max(1, 55 - p.rank * 15));
      const total = weights.reduce((a, b) => a + b, 0);
      let r = Math.random() * total;
      for (let i = 0; i < eligible.length; i++) {
        r -= weights[i];
        if (r <= 0) return eligible[i];
      }
      return eligible[eligible.length - 1];
    }

    // Picks 4-10: score each available prospect for this team
    // Score = (tier fit) + (positional need match) + (small random variance)
    const scored = availableProspects.map(p => {
      let score = 0;

      // Tier penalty: tier 1 = 60pts, tier 2 = 35pts, tier 3 = 10pts
      score += [60, 35, 10][p.tier - 1] || 5;

      // Positional need bonus: +25 if prospect's position matches any team need
      if (teamNeeds) {
        const matched = teamNeeds.some(need => {
          const fitPos = NEED_POS_MAP[need] || [];
          return fitPos.includes(p.pos);
        });
        if (matched) score += 25;
      }

      // Rank-order nudge: slightly prefer players closer to their consensus rank
      score += Math.max(0, 15 - p.rank);

      // Realistic variance: ±20 points of randomness
      score += (Math.random() - 0.5) * 40;

      return { prospect: p, score };
    });

    scored.sort((a, b) => b.score - a.score);
    return scored[0].prospect;
  }

  // Map team abbr to TEAM_NEEDS entry for positional needs lookup
  const teamNeedsMap = {};
  TEAM_NEEDS.forEach(t => { teamNeedsMap[t.abbr] = t.needs; });

  // Render lottery odds table
  function lotteryOddsHTML() {
    let h = `<div class="lottery-card">
      <div class="lottery-card-header">
        <div class="lch-title">2026 Lottery Odds</div>
        <div class="lch-sub">Based on current standings · Top-pick %</div>
      </div>
      <table class="lottery-table">
        <thead><tr>
          <th>#</th><th>Team</th><th>Record</th><th>Top-1 %</th><th>Top-4 %</th>
        </tr></thead><tbody>`;
    // Top4 odds approximation based on seed
    const top4 = [52.1, 52.1, 52.1, 48.1, 37.3, 30.3, 23.6, 17.4, 12.0, 7.7, 5.0, 3.7, 2.5, 1.2];
    const oddsColors = ['#ffd700','#ffd700','#ffd700','#ffaa00','#ff8800','#ff6600','#ff4d00','#c97700','#997700','#667700','#557700','#447700','#336600','#225500'];
    lottery14.forEach((team, i) => {
      if (!team) return;
      const colors = TEAM_COLORS[team.abbr] || { bg: 'var(--surface2)', text: '#fff' };
      const logo = getLogoUrl(team.abbr);
      const odds1 = LOTTERY_ODDS[i] || 0.5;
      const odds4 = top4[i] || 1.2;
      const color = oddsColors[i];
      h += `<tr>
        <td>${i+1}</td>
        <td>
          <div style="display:flex;align-items:center;gap:8px">
            <div class="logo-badge-sm" style="background:${colors.bg};border:1px solid ${colors.bg}88">
              <img src="${logo}" alt="${team.abbr}" onerror="this.style.display='none'">
            </div>
            <div>
              <div style="font-weight:600;font-size:0.88rem">${team.name}</div>
              <div style="font-size:0.72rem;color:var(--muted);font-family:'Barlow Condensed',sans-serif;letter-spacing:1px">${team.abbr}</div>
            </div>
          </div>
        </td>
        <td style="color:var(--muted)">${team.wins}–${team.losses}</td>
        <td>
          <div style="text-align:right">
            <span class="lot-odds-pill" style="color:${color};font-size:1rem">${odds1}%</span>
            <div class="lot-odds-bar" style="width:80px;margin-left:auto">
              <div class="lot-odds-bar-fill" style="width:${(odds1/14*100).toFixed(0)}%;background:${color}"></div>
            </div>
          </div>
        </td>
        <td style="color:#6699cc;font-family:'Bebas Neue',sans-serif;font-size:1rem;letter-spacing:1px">${odds4}%</td>
      </tr>`;
    });
    h += `</tbody></table></div>`;
    return h;
  }

  // Render simulator
  function simulatorHTML() {
    return `<div class="sim-card">
      <div class="sim-card-header">
        <div class="lch-title">🎱 Lottery Simulator</div>
        <div class="lch-sub">Run the draft lottery with real odds</div>
      </div>
      <div class="sim-controls">
        <button class="sim-btn primary" onclick="runSingleSim()">Run Lottery</button>
        <span class="sim-count-label" id="sim-run-count"></span>
      </div>
      <div id="sim-results" class="sim-results">
        <div style="text-align:center;color:var(--muted);font-family:'Barlow Condensed',sans-serif;letter-spacing:2px;font-size:0.8rem;padding:24px 0">
          PRESS "RUN LOTTERY" TO SIMULATE THE DRAFT
        </div>
      </div>
      <div id="sim-stats" style="display:none" class="sim-stat-row">
      </div>
    </div>`;
  }

  // Build the page
  let html = '';

  // Top section: odds + simulator side by side
  html += `<div class="draft-layout">
    ${lotteryOddsHTML()}
    ${simulatorHTML()}
  </div>`;

  // Top prospects
  html += `<div class="prospects-section">
    <div class="section-header" style="margin-bottom:16px">
      <div class="section-title">Top Prospects</div>
      <div class="section-sub">2026 Draft Class · Expert Rankings</div>
    </div>
    <div class="prospects-grid">`;

  const prospectColors = ['#ffd700','#ffaa00','#c8a000','#ff6600','#ff4400','#dd3300','#aa2200','#882200','#662200','#552200','#444','#444'];
  PROSPECTS.forEach((p, i) => {
    const col = prospectColors[i] || '#444';
    const isNonLottery = p.rank > 10;
    html += `<div class="prospect-card" style="border-top:2px solid ${col}20${isNonLottery ? ';opacity:0.75' : ''}">
      <div class="prospect-rank-badge" style="background:${col}18;color:${col};border:1px solid ${col}44">#${p.rank} Overall${isNonLottery ? ' · Non-Lottery' : ''}</div>
      <div class="prospect-name">${p.name}</div>
      <div class="prospect-school">${p.school} · ${p.ht}</div>
      <div class="prospect-pos-pill">${p.pos}</div>
      <div class="prospect-stat-row">
        <div class="prospect-stat"><div class="prospect-stat-val">${p.pts}</div><div class="prospect-stat-lbl">PPG</div></div>
        <div class="prospect-stat"><div class="prospect-stat-val">${p.reb}</div><div class="prospect-stat-lbl">RPG</div></div>
        <div class="prospect-stat"><div class="prospect-stat-val">${p.ast}</div><div class="prospect-stat-lbl">APG</div></div>
      </div>
      <div class="prospect-blurb">${p.blurb}</div>
    </div>`;
  });

  html += `</div></div>`;

  // Team Needs
  html += `<div class="needs-section">
    <div class="section-header" style="margin-bottom:16px">
      <div class="section-title">Team Needs</div>
      <div class="section-sub">Lottery teams · Based on ESPN &amp; expert analyses</div>
    </div>
    <div class="needs-grid">`;

  TEAM_NEEDS.forEach(t => {
    const colors = TEAM_COLORS[t.abbr] || { bg: '#333', text: '#fff' };
    const logo = getLogoUrl(t.abbr);
    html += `<div class="needs-card">
      <div class="needs-card-top">
        <div class="logo-badge-sm" style="width:40px;height:32px;background:${colors.bg};border:1px solid ${colors.bg}88;border-radius:6px;display:flex;align-items:center;justify-content:center;padding:3px 4px;flex-shrink:0">
          <img src="${logo}" alt="${t.abbr}" style="width:100%;height:100%;object-fit:contain" onerror="this.outerHTML='<span style=font-family:Bebas Neue,sans-serif;font-size:0.8rem;color:${colors.text}>${t.abbr}</span>'">
        </div>
        <div class="needs-team-info">
          <div class="needs-team-name">${t.name}</div>
          <div class="needs-pick-label">Projected ${t.pick}</div>
        </div>
      </div>
      <div class="needs-tags">${t.needs.map(n => `<span class="needs-tag">${n}</span>`).join('')}</div>
      <div class="needs-prospect-target">🎯 Target: ${t.target}</div>
      <div class="needs-blurb">${t.blurb}</div>
    </div>`;
  });

  html += `</div></div>`;

  document.getElementById('draft-container').innerHTML = html;

  // ---- Simulator functions ----
  window.runSingleSim = function() {
    const order = simulateLottery();
    let available = [...PROSPECTS]; // prospects not yet selected
    let h = '';

    // Show all 10 lottery picks
    const displayCount = Math.min(10, order.length);
    order.slice(0, displayCount).forEach((seedIdx, pickIdx) => {
      const team = lottery14[seedIdx];
      if (!team) return;
      const colors = TEAM_COLORS[team.abbr] || { bg: '#333', text: '#fff' };
      const logo = getLogoUrl(team.abbr);
      const originalSeed = seedIdx + 1;
      const pickNum = pickIdx + 1;
      const jumped = pickNum < originalSeed;
      const stayed = pickNum === originalSeed;
      const numClass = pickNum === 1 ? 'top1' : pickNum === 2 ? 'top2' : pickNum === 3 ? 'top3' : '';
      const jumpBadge = pickNum <= 4 && jumped
        ? `<span class="sim-jumped-badge">&#x2B06; JUMPED ${originalSeed - pickNum}</span>`
        : stayed && pickNum <= 4
        ? `<span class="sim-stayed-badge">STAYED AT ${pickNum}</span>`
        : '';

      // Smart prospect selection using positional needs
      const needs = teamNeedsMap[team.abbr] || null;
      const prospect = selectProspect(pickNum, needs, available);
      if (prospect) available = available.filter(p => p.rank !== prospect.rank);

      h += `<div class="sim-pick-row">
        <div class="sim-pick-num ${numClass}">${pickNum}</div>
        <div class="logo-badge-sm" style="width:36px;height:28px;background:${colors.bg};border:1px solid ${colors.bg}88;border-radius:5px;padding:2px 3px">
          <img src="${logo}" alt="${team.abbr}" style="width:100%;height:100%;object-fit:contain" onerror="this.style.display='none'">
        </div>
        <div class="sim-pick-detail">
          <div class="sim-pick-name">${team.name}</div>
          <div class="sim-pick-meta">${team.abbr} · Was seed ${originalSeed} · ${team.wins}-${team.losses}</div>
        </div>
        ${prospect ? `<div class="sim-pick-prospect">${prospect.name} <span style="color:var(--muted);font-size:0.75rem">${prospect.pos}</span></div>` : ''}
        ${jumpBadge}
      </div>`;
    });

    // Picks 11-12: show extra prospects only, no team (lottery is only 10 picks)
    const extraLabel = `<div style="margin-top:14px;padding:6px 0 4px;font-family:'Barlow Condensed',sans-serif;font-size:0.7rem;letter-spacing:2px;color:var(--muted);text-transform:uppercase;border-top:1px solid var(--border)">
      Other Projected Lottery-Fringe Prospects
    </div>`;
    h += extraLabel;
    [11, 12].forEach(pickNum => {
      const prospect = available[0]; // next best available
      if (prospect) available = available.slice(1);
      if (!prospect) return;
      h += `<div class="sim-pick-row" style="opacity:0.65">
        <div class="sim-pick-num" style="color:var(--muted)">${pickNum}</div>
        <div style="width:36px;height:28px;flex-shrink:0"></div>
        <div class="sim-pick-detail">
          <div class="sim-pick-name" style="color:var(--muted)">Pick ${pickNum}</div>
          <div class="sim-pick-meta">Non-lottery range</div>
        </div>
        <div class="sim-pick-prospect">${prospect.name} <span style="color:var(--muted);font-size:0.75rem">${prospect.pos}</span></div>
      </div>`;
    });

    document.getElementById('sim-results').innerHTML = h;
    document.getElementById('sim-stats').style.display = 'none';
    const runNum = (window._draftRunCount = (window._draftRunCount || 0) + 1);
    document.getElementById('sim-run-count').textContent = `Run #${runNum}`;
  };

  let multiSimData = {};
  window.runMultiSim = function(n) {
    // Kept for compatibility but no longer called from UI
  };
}
