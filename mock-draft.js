// CLANKER'S MOCK DRAFT ENGINE
// Deterministic - same result every run. No randomness.

const MOCK_REAL_PICKS = {}; // Placeholder for live comparison — populate later

function getMockPositionalPremium(pos, round) {
  const table = {
    QB:   [2.0,1.5,1.0,0.8,0.6,0.5,0.4],
    OT:   [1.8,1.6,1.2,1.0,0.8,0.6,0.5],
    EDGE: [1.7,1.5,1.2,1.0,0.8,0.6,0.5],
    CB:   [1.6,1.4,1.1,1.0,0.9,0.7,0.6],
    WR:   [1.3,1.3,1.1,1.0,0.9,0.8,0.7],
    DT:   [1.2,1.2,1.1,1.0,0.9,0.8,0.7],
    LB:   [1.1,1.1,1.0,1.0,0.9,0.8,0.7],
    RB:   [0.5,0.8,1.0,1.1,1.1,1.0,1.0],
    TE:   [0.8,1.0,1.1,1.1,1.0,0.9,0.8],
    S:    [0.7,0.9,1.0,1.0,1.0,1.0,0.9],
    OG:   [0.9,1.0,1.1,1.1,1.0,0.9,0.8],
    IOL:  [0.8,1.0,1.1,1.1,1.0,0.9,0.8],
  };
  const idx = Math.min(round - 1, 6);
  return (table[pos] || Array(7).fill(1.0))[idx];
}

function getMockTier(rank) {
  if (rank <= 32) return 1;
  if (rank <= 64) return 2;
  if (rank <= 105) return 3;
  return 4;
}

function getMockPickScore(prospect, teamAbbr, round, alreadyDrafted, boardState) {
  const archetype = NFL_TEAM_ARCHETYPES[teamAbbr] || { style:'bpa', preferredPos:[] };
  const rawNeeds = NFL_TEAM_NEEDS[teamAbbr] || [];
  const filledNeeds = alreadyDrafted.filter(p => ['QB','K','P'].includes(p));
  const teamNeeds = rawNeeds.filter(pos => !['QB','K','P'].includes(pos) || !filledNeeds.includes(pos));
  const tier = getMockTier(prospect.rank);
  const premium = getMockPositionalPremium(prospect.pos, round);

  // Base score — rank is dominant
  let score = Math.pow(301 - prospect.rank, 1.8);

  // Tier bonus
  if (tier === 1) score *= 1.4;
  else if (tier === 2) score *= 1.15;

  // Positional premium — compressed so rank stays dominant
  score *= (0.85 + (premium - 1) * 0.3);

  // Needs — stronger weight since this is deterministic
  if (teamNeeds.includes(prospect.pos)) score *= 1.6;

  // Urgency match from NFL_TEAM_CONTEXT
  const context = NFL_TEAM_CONTEXT[teamAbbr] || {};
  const urgency = context.urgency || '';
  if (urgency.includes(prospect.pos)) score *= 1.3;

  // Archetype
  if (archetype.preferredPos && archetype.preferredPos.includes(prospect.pos)) score *= 1.2;
  if (archetype.style === 'needs' && teamNeeds.includes(prospect.pos)) score *= 1.2;
  if (archetype.style === 'bpa') score *= 1.1;

  // Hard suppress filled one-and-done positions
  if (['QB','K','P'].includes(prospect.pos) && alreadyDrafted.includes(prospect.pos)) score *= 0.02;

  // Positional scarcity — boost if few left at this position
  const remaining = boardState.filter(p => p.pos === prospect.pos).length;
  if (remaining <= 2 && teamNeeds.includes(prospect.pos)) score *= 1.4;
  if (remaining <= 1 && teamNeeds.includes(prospect.pos)) score *= 1.6;

  return score;
}

function generateMockReasoning(prospect, teamAbbr, round, pickNum, alreadyDrafted, boardState, allResults) {
  const context = NFL_TEAM_CONTEXT[teamAbbr] || {};
  const teamData = NFL_TEAMS[teamAbbr] || { name: teamAbbr };
  const teamNeeds = NFL_TEAM_NEEDS[teamAbbr] || [];
  const tier = getMockTier(prospect.rank);
  const diff = pickNum - prospect.rank;
  const isNeed = teamNeeds.includes(prospect.pos);
  const remaining = boardState.filter(p => p.pos === prospect.pos).length;
  const tierLabels = { 1: 'blue-chip', 2: 'first-round caliber', 3: 'Day 2', 4: 'developmental' };

  // Board context
  const recentPicks = allResults.slice(-5);
  const positionRun = recentPicks.filter(r => r.prospect.pos === prospect.pos).length >= 2;
  const lastTier1 = boardState.filter(p => getMockTier(p.rank) === 1).length === 0;
  const betterAvailable = boardState.filter(p => p.rank < prospect.rank).length;

  // Build reasoning from actual context
  const sentences = [];

  // Opening — always pick-specific
  if (round === 1 && tier === 1) {
    sentences.push(`${teamData.name} land one of the draft's premier prospects in ${prospect.name}, a ${tierLabels[tier]} talent at ${prospect.pos}.`);
  } else if (diff <= -15) {
    sentences.push(`Clanker views this as an aggressive reach — ${prospect.name} ranked ${Math.abs(diff)} spots below where ${teamData.name} selected him.`);
  } else if (diff >= 20) {
    sentences.push(`Exceptional value here. ${prospect.name} slides ${diff} spots past his board rank, giving ${teamData.name} a steal at pick ${pickNum}.`);
  } else if (isNeed && tier <= 2) {
    sentences.push(`${teamData.name} address one of their most pressing needs, selecting ${prospect.name} at ${prospect.pos} out of ${prospect.school}.`);
  } else if (!isNeed && tier === 1) {
    sentences.push(`Pure best player available. ${prospect.name} wasn't a positional priority for ${teamData.name}, but you don't pass on ${tierLabels[tier]} talent.`);
  } else {
    sentences.push(`${teamData.name} select ${prospect.name}, a ${tierLabels[tier]} prospect at ${prospect.pos} out of ${prospect.school}.`);
  }

  // Board context sentence
  if (positionRun && isNeed) {
    sentences.push(`The run on ${prospect.pos}s in recent picks accelerated this decision — waiting any longer risked losing the position entirely.`);
  } else if (lastTier1) {
    sentences.push(`With the last blue-chip prospect now off the board, value picks become the priority from here.`);
  } else if (remaining <= 2 && isNeed) {
    sentences.push(`Only ${remaining} ${prospect.pos} prospect${remaining === 1 ? '' : 's'} remain on the board — scarcity forced ${teamData.name}'s hand.`);
  } else if (betterAvailable > 0 && !isNeed) {
    sentences.push(`${betterAvailable} higher-ranked prospect${betterAvailable === 1 ? '' : 's'} remain available, but positional need drove this selection over pure BPA.`);
  }

  // Team context sentence
  if (context.storyline && isNeed) {
    sentences.push(`This selection aligns with ${teamData.name}'s draft-day mandate — ${context.urgency ? `prioritizing ${context.urgency}` : 'addressing key roster needs'} as the primary focus heading into the weekend.`);
  } else if (context.storyline && !isNeed && tier <= 2) {
    sentences.push(`Despite pressing needs elsewhere, the value of ${prospect.name} at this spot was too significant for ${teamData.name} to pass up.`);
  }

  // Round-specific insight
  if (round >= 4) {
    sentences.push(`In the later rounds, ${teamData.name} shift focus to developmental talent and depth — ${prospect.name} fits that mold as a ${round === 7 ? 'Day 3 flier' : 'mid-round value pick'}.`);
  } else if (round === 2 || round === 3) {
    if (alreadyDrafted.length > 0) {
      const filled = [...new Set(alreadyDrafted)].join(', ');
      sentences.push(`Having addressed ${filled} on Day 1, ${teamData.name} continue building the roster with complementary pieces.`);
    }
  }

  // Scheme fit
  if (context.scheme) {
    const schemePositions = context.scheme === '3-4'
      ? { EDGE: 'standup pass rusher', LB: 'coverage linebacker', DT: 'two-gap run stuffer' }
      : { EDGE: 'speed rusher off the edge', LB: 'downhill run defender', DT: 'one-gap penetrator' };
    if (schemePositions[prospect.pos]) {
      sentences.push(`As a ${context.scheme} team under ${context.coach || 'the new staff'}, ${prospect.name} projects as a ${schemePositions[prospect.pos]}.`);
    }
  }

  return sentences.join(' ');
}

function runMockDraft() {
  // Deterministic sort — no randomness
  let pool = [...NFL_PROSPECTS].map(p => ({ ...p, tier: getMockTier(p.rank) }));
  const results = [];
  const teamDraftedPositions = {};

  NFL_DRAFT_ORDER.forEach(({ pick, team, round }) => {
    if (!teamDraftedPositions[team]) teamDraftedPositions[team] = [];

    // Check lock picks first
    const lock = NFL_DRAFT_LOCKS.find(l => l.team === team && l.probability >= 0.85);
    let selected = null;
    if (lock) {
      const lockProspect = pool.find(p => p.name === lock.prospectName);
      if (lockProspect) selected = lockProspect;
    }

    if (!selected) {
      // Score all available prospects deterministically
      const scored = pool.map(p => ({
        prospect: p,
        score: getMockPickScore(p, team, round, teamDraftedPositions[team], pool)
      }));
      scored.sort((a, b) => b.score - a.score);
      selected = scored[0].prospect;
    }

    const reasoning = generateMockReasoning(selected, team, round, pick, teamDraftedPositions[team], pool, results);
    const diff = pick - selected.rank;

    teamDraftedPositions[team].push(selected.pos);
    pool = pool.filter(p => p.rank !== selected.rank);

    const gradeVal = (() => {
      const teamNeeds = NFL_TEAM_NEEDS[team] || [];
      const context = NFL_TEAM_CONTEXT[team] || {};
      const tier = getMockTier(selected.rank);
      const premium = getMockPositionalPremium(selected.pos, round);
      let s = 0;
      if (tier === 1) s += 4; else if (tier === 2) s += 3; else if (tier === 3) s += 2; else s += 1;
      if (teamNeeds.includes(selected.pos)) s += 3;
      if ((context.urgency || '').includes(selected.pos)) s += 1;
      s += (0.85 + (premium - 1) * 0.3);
      if (s >= 7) return 'A'; if (s >= 5.5) return 'B'; if (s >= 4) return 'C'; if (s >= 2.5) return 'D'; return 'F';
    })();

    results.push({
      pick, team, round, prospect: selected,
      reasoning,
      grade: gradeVal,
      isDraftSteal: diff >= 20,
      isReach: diff <= -20,
      needsFit: (NFL_TEAM_NEEDS[team] || []).includes(selected.pos),
      realPick: MOCK_REAL_PICKS[pick] || null // comparison hook
    });
  });

  return results;
}
