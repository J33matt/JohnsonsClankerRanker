const POSITIONAL_PREMIUM = {
  QB:   { r1:2.0, r2:1.5, r3:1.0, r4:0.8, r5:0.6, r6:0.5, r7:0.4 },
  OT:   { r1:1.8, r2:1.6, r3:1.2, r4:1.0, r5:0.8, r6:0.6, r7:0.5 },
  EDGE: { r1:1.7, r2:1.5, r3:1.2, r4:1.0, r5:0.8, r6:0.6, r7:0.5 },
  CB:   { r1:1.6, r2:1.4, r3:1.1, r4:1.0, r5:0.9, r6:0.7, r7:0.6 },
  WR:   { r1:1.3, r2:1.3, r3:1.1, r4:1.0, r5:0.9, r6:0.8, r7:0.7 },
  DT:   { r1:1.2, r2:1.2, r3:1.1, r4:1.0, r5:0.9, r6:0.8, r7:0.7 },
  LB:   { r1:1.1, r2:1.1, r3:1.0, r4:1.0, r5:0.9, r6:0.8, r7:0.7 },
  RB:   { r1:0.5, r2:0.8, r3:1.0, r4:1.1, r5:1.1, r6:1.0, r7:1.0 },
  TE:   { r1:0.8, r2:1.0, r3:1.1, r4:1.1, r5:1.0, r6:0.9, r7:0.8 },
  S:    { r1:0.7, r2:0.9, r3:1.0, r4:1.0, r5:1.0, r6:1.0, r7:0.9 },
  OG:   { r1:0.9, r2:1.0, r3:1.1, r4:1.1, r5:1.0, r6:0.9, r7:0.8 },
  IOL:  { r1:0.8, r2:1.0, r3:1.1, r4:1.1, r5:1.0, r6:0.9, r7:0.8 },
};

function assignTiers(prospects) {
  return prospects.map(p => ({
    ...p,
    tier: p.rank <= 32 ? 1 : p.rank <= 64 ? 2 : p.rank <= 105 ? 3 : 4
  }));
}

function assignVolatility(prospects) {
  const pool = prospects.map(p => ({ ...p, slideRisk: false }));
  const count = 3 + Math.floor(Math.random() * 3);
  const indices = new Set();
  while (indices.size < count) indices.add(Math.floor(Math.random() * pool.length));
  indices.forEach(i => pool[i].slideRisk = true);
  return pool;
}

function getRoundKey(round) {
  return `r${Math.min(round, 7)}`;
}

function selectPick(teamAbbr, round, availableProspects, recentPicks) {
  const archetype = NFL_TEAM_ARCHETYPES[teamAbbr] || { style:'bpa', scheme:'4-3', preferredPos:[] };
  const teamNeeds = NFL_TEAM_NEEDS[teamAbbr] || [];
  const rk = getRoundKey(round);

  const lock = NFL_DRAFT_LOCKS.find(l => l.team === teamAbbr);
  if (lock) {
    const lockProspect = availableProspects.find(p => p.name === lock.prospectName);
    if (lockProspect && Math.random() < lock.probability) return lockProspect;
  }

  const recentPositions = recentPicks.slice(-3).map(p => p.prospect.pos);
  const runPos = recentPositions.length === 3 && recentPositions.every(p => p === recentPositions[0]) ? recentPositions[0] : null;

  const scored = availableProspects.map(p => {
    let score = (301 - p.rank);
    if (p.tier === 1) score *= 1.4;
    else if (p.tier === 2) score *= 1.15;
    const premium = (POSITIONAL_PREMIUM[p.pos] || {})[rk] || 1.0;
    score *= premium;
    if (teamNeeds.includes(p.pos)) score *= 1.2;
    if (runPos && p.pos === runPos && teamNeeds.includes(p.pos)) score *= 1.4;
    if (archetype.preferredPos.includes(p.pos)) score *= 1.1;
    if (archetype.style === 'traits' && p.rank % 7 < 3) score *= 1.2;
    if (archetype.style === 'safe' && p.rank <= 100) score *= 1.2;
    if (archetype.style === 'needs' && teamNeeds.includes(p.pos)) score *= 1.3;
    if (p.slideRisk) score *= 0.3;
    score *= (0.92 + Math.random() * 0.16);
    return { prospect: p, score };
  });

  scored.sort((a, b) => b.score - a.score);
  // Prevent non-slideRisk top prospects from falling more than 15 picks
  const topAvailableRank = Math.min(...availableProspects.map(p => p.rank));
  const safePick = scored.find(s => !s.prospect.slideRisk && s.prospect.rank <= topAvailableRank + 15);
  if (safePick && scored[0].prospect.slideRisk) return safePick.prospect;
  return scored[0].prospect;
}

function gradePickResult(prospect, teamAbbr, round) {
  const teamNeeds = NFL_TEAM_NEEDS[teamAbbr] || [];
  const archetype = NFL_TEAM_ARCHETYPES[teamAbbr] || { preferredPos: [] };
  const rk = getRoundKey(round);
  const premium = (POSITIONAL_PREMIUM[prospect.pos] || {})[rk] || 1.0;
  let score = 0;
  if (prospect.tier === 1) score += 4;
  else if (prospect.tier === 2) score += 3;
  else if (prospect.tier === 3) score += 2;
  else score += 1;
  if (teamNeeds.includes(prospect.pos)) score += 3;
  if (archetype.preferredPos.includes(prospect.pos)) score += 1;
  score += premium;
  if (score >= 7) return 'A';
  if (score >= 5.5) return 'B';
  if (score >= 4) return 'C';
  if (score >= 2.5) return 'D';
  return 'F';
}

function runDraftSimulation() {
  let pool = assignTiers([...NFL_PROSPECTS]);
  pool = assignVolatility(pool);
  const results = [];
  const recentPicks = [];

  NFL_DRAFT_ORDER.forEach(({ pick, team, round }) => {
    const prospect = selectPick(team, round, pool, recentPicks);
    pool = pool.filter(p => p.rank !== prospect.rank);
    const diff = pick - prospect.rank;
    const result = {
      pick, team, prospect,
      grade: gradePickResult(prospect, team, round),
      isDraftSteal: diff >= 20,
      isReach: diff <= -20,
      needsFit: (NFL_TEAM_NEEDS[team] || []).includes(prospect.pos)
    };
    results.push(result);
    recentPicks.push(result);
    if (recentPicks.length > 8) recentPicks.shift();
  });

  return results;
}
