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

function renderPlayoffs() {
  const west = seedConference('WEST');
  const east = seedConference('EAST');

  // ================================================================
  // BRACKET STATE
  // ================================================================
  // Each conf: 4 R1 matchups, 2 Semis, 1 CF, 1 Finals slot
  // bracket[conf][round][matchupIdx] = winning team object or null
  // play-in: piWinners[conf] = { seed7: team|null, seed8: team|null }
  const bracketState = {
    west: { r1: [null,null,null,null], semi: [null,null], cf: [null], finalsTeam: null },
    east: { r1: [null,null,null,null], semi: [null,null], cf: [null], finalsTeam: null },
    champion: null
  };
  const piState = {
    west: { game78winner: null, game910winner: null, seed8: null, deciderWinner: null },
    east: { game78winner: null, game910winner: null, seed8: null, deciderWinner: null }
  };

  // R1 pairings: [topSeedIdx, botSeedIdx] into the seeded array (0-based)
  // 1v8, 4v5, 3v6, 2v7 · indices 0,1,2,3,4,5 for seeds 1-6; 6,7 for play-in results
  const R1_PAIRINGS = [[0,7],[3,4],[2,5],[1,6]]; // [topSeedIdx, botSeedIdx]

  // History stack for undo
  const history = [];
  const redoStack = [];

  function pushHistory(action) {
    history.push(JSON.parse(JSON.stringify({ bracketState, piState, action })));
    redoStack.length = 0; // clear redo on new action
    updateControls();
  }

  function undo() {
    if (!history.length) return;
    const current = JSON.parse(JSON.stringify({ bracketState, piState }));
    redoStack.push(current);
    const prev = history.pop();
    Object.assign(bracketState, prev.bracketState);
    Object.assign(piState, prev.piState);
    updateControls();
    rerenderBracket();
  }

  function redo() {
    if (!redoStack.length) return;
    const next = redoStack.pop();
    history.push(JSON.parse(JSON.stringify({ bracketState, piState })));
    Object.assign(bracketState, next.bracketState);
    Object.assign(piState, next.piState);
    updateControls();
    rerenderBracket();
  }

  function clearBracket() {
    // Reset all picks
    ['west','east'].forEach(c => {
      bracketState[c].r1 = [null,null,null,null];
      bracketState[c].semi = [null,null];
      bracketState[c].cf = [null];
      bracketState[c].finalsTeam = null;
      piState[c].game78winner = null;
      piState[c].game910winner = null;
      piState[c].seed8 = null;
      piState[c].deciderWinner = null;
    });
    bracketState.champion = null;
    history.length = 0;
    redoStack.length = 0;
    updateControls();
    rerenderBracket();
    dismissChampion();
  }

  function updateControls() {
    const undoBtn = document.getElementById('bkt-undo-btn');
    const redoBtn = document.getElementById('bkt-redo-btn');
    const clearBtn = document.getElementById('bkt-clear-btn');
    if (undoBtn) undoBtn.disabled = history.length === 0;
    if (redoBtn) redoBtn.disabled = redoStack.length === 0;
    if (clearBtn) {
      const hasAny = bracketState.champion ||
        ['west','east'].some(c => bracketState[c].r1.some(x=>x) || bracketState[c].semi.some(x=>x) || bracketState[c].cf[0] || piState[c].game78winner || piState[c].game910winner);
      clearBtn.disabled = !hasAny;
    }
  }

  // ================================================================
  // PLAY-IN LOGIC
  // ================================================================
  const wPI = west.slice(6, 10);
  const ePI = east.slice(6, 10);

  // Placeholder objects for undecided 7/8 seeds · used in the bracket before play-in picks are made.
  // These are lightweight sentinels; bracket picks stored against them get replaced when the real
  // team is resolved, or cleared if the user's choice doesn't match the resolved seed.
  function makePlaceholder(seed, conf) {
    return { _placeholder: true, _seed: seed, _conf: conf, abbr: '__PI' + seed + '_' + conf,
             name: 'Play-In #' + seed, wins: 0, losses: 0 };
  }

  // Returns the 8th seed from play-in for a conf (real team or placeholder)
  function getSeed8(conf) {
    return piState[conf].seed8 || makePlaceholder(8, conf);
  }
  function getSeed7(conf) {
    return piState[conf].game78winner || makePlaceholder(7, conf);
  }

  // When a real team is resolved for a play-in slot, walk the bracket and replace
  // any stored placeholder of that seed with the real team.  If the stored pick
  // was the OTHER placeholder (wrong seed), leave it · it will get cleared by
  // invalidatePlayInDownstream.
  function replacePlaceholderInBracket(conf, seedNum, realTeam) {
    const phAbbr = '__PI' + seedNum + '_' + conf;
    // Check every stored bracket pick and swap in the real team
    ['r1','semi','cf'].forEach(round => {
      const arr = bracketState[conf][round];
      for (let i = 0; i < arr.length; i++) {
        if (arr[i] && arr[i].abbr === phAbbr) arr[i] = realTeam;
      }
    });
    if (bracketState[conf].finalsTeam && bracketState[conf].finalsTeam.abbr === phAbbr) {
      bracketState[conf].finalsTeam = realTeam;
    }
    if (bracketState.champion && bracketState.champion.abbr === phAbbr) {
      bracketState.champion = realTeam;
    }
  }

  function pickPlayIn(conf, game, teamIdx) {
    pushHistory('playin');
    const piTeams = conf === 'west' ? wPI : ePI;
    if (game === '78') {
      const newSeed7 = piTeams[teamIdx];
      piState[conf].game78winner = newSeed7;
      // Replace any bracket placeholder for seed 7 with the real team
      replacePlaceholderInBracket(conf, 7, newSeed7);
      // Loser of 7/8 plays winner of 9/10 · reset 8 seed decider when 7/8 changes
      // Also clear bracket picks that used the seed-8 placeholder (they're now ambiguous)
      piState[conf].seed8 = null;
      piState[conf].deciderWinner = null;
      invalidatePlaceholderPicks(conf, 8);
    } else if (game === '910') {
      piState[conf].game910winner = piTeams[teamIdx + 2];
      // Reset the 8-seed decider pick since 9/10 winner changed
      piState[conf].seed8 = null;
      piState[conf].deciderWinner = null;
      invalidatePlaceholderPicks(conf, 8);
    } else if (game === 'decider') {
      // teamIdx: 0 = loser of 7/8, 1 = winner of 9/10
      const piState_c = piState[conf];
      const loserOf78 = piTeams.find(t => t !== piState_c.game78winner && (t === piTeams[0] || t === piTeams[1]));
      const newSeed8 = teamIdx === 0 ? loserOf78 : piState[conf].game910winner;
      piState[conf].seed8 = newSeed8;
      piState[conf].deciderWinner = newSeed8;
      // Replace any bracket placeholder for seed 8 with the real team
      replacePlaceholderInBracket(conf, 8, newSeed8);
    }
    rerenderBracket();
  }

  // Clear bracket picks that are stored as a specific placeholder (called when that
  // placeholder becomes ambiguous again, e.g. when the 7/8 game result changes).
  function invalidatePlaceholderPicks(conf, seedNum) {
    const phAbbr = '__PI' + seedNum + '_' + conf;
    // R1 matchups that use the 8-seed: idx 0 (1v8) · clear pick if it was the placeholder
    [0, 3].forEach(r1idx => {
      if (bracketState[conf].r1[r1idx] && bracketState[conf].r1[r1idx].abbr === phAbbr) {
        bracketState[conf].r1[r1idx] = null;
        invalidateDownstream(conf, 'r1', r1idx);
      }
    });
  }

  // ================================================================
  // BRACKET PICK LOGIC
  // ================================================================
  function getR1Teams(conf, matchupIdx) {
    const seeds = conf === 'west' ? west : east;
    const pairing = R1_PAIRINGS[matchupIdx];
    let topTeam = seeds[pairing[0]];
    let botTeam = seeds[pairing[1]];
    // Matchup 0: 1 vs 8-seed (play-in winner or placeholder)
    if (matchupIdx === 0) { botTeam = getSeed8(conf); }
    // Matchup 3: 2 vs 7-seed (play-in winner or placeholder)
    if (matchupIdx === 3) { botTeam = getSeed7(conf); }
    return [topTeam, botTeam];
  }

  function getSemiTeams(conf, matchupIdx) {
    // Semi 0: winner of R1[0] vs winner of R1[1]
    // Semi 1: winner of R1[2] vs winner of R1[3]
    if (matchupIdx === 0) return [bracketState[conf].r1[0], bracketState[conf].r1[1]];
    return [bracketState[conf].r1[2], bracketState[conf].r1[3]];
  }

  function getCFTeams(conf) {
    return [bracketState[conf].semi[0], bracketState[conf].semi[1]];
  }

  function getFinalsTeams() {
    return [bracketState.west.cf[0], bracketState.east.cf[0]];
  }

  function pickR1(conf, matchupIdx, team) {
    pushHistory('r1');
    bracketState[conf].r1[matchupIdx] = team;
    invalidateDownstream(conf, 'r1', matchupIdx);
    rerenderBracket();
  }

  function pickSemi(conf, matchupIdx, team) {
    pushHistory('semi');
    bracketState[conf].semi[matchupIdx] = team;
    invalidateDownstream(conf, 'semi', matchupIdx);
    rerenderBracket();
  }

  function pickCF(conf, team) {
    pushHistory('cf');
    bracketState[conf].cf[0] = team;
    bracketState[conf].finalsTeam = team;
    // invalidate finals pick if team changed
    if (bracketState.champion && bracketState.champion.abbr !== (bracketState.west.cf[0] && bracketState.west.cf[0].abbr) && bracketState.champion.abbr !== (bracketState.east.cf[0] && bracketState.east.cf[0].abbr)) {
      bracketState.champion = null;
    }
    rerenderBracket();
  }

  function isBracketComplete() {
    // All 8 R1 picks, all 4 semi picks, both CF picks, and both finalists known
    const allR1 = ['west','east'].every(c => bracketState[c].r1.every(x => x));
    const allSemi = ['west','east'].every(c => bracketState[c].semi.every(x => x));
    const allCF = ['west','east'].every(c => bracketState[c].cf[0]);
    return allR1 && allSemi && allCF;
  }

  function pickChampion(team) {
    pushHistory('champion');
    bracketState.champion = team;
    rerenderBracket();
    // Only show the celebration when the full bracket is filled out
    if (!team._placeholder && isBracketComplete()) showChampion(team);
  }

  // Returns the set of team abbrs that are valid winners of a given R1 matchup
  function r1Contestants(conf, matchupIdx) {
    const [top, bot] = getR1Teams(conf, matchupIdx);
    const valid = new Set();
    if (top) valid.add(top.abbr);
    if (bot) valid.add(bot.abbr);
    return valid;
  }

  // Returns the set of team abbrs that are valid winners of a given semi matchup
  // (i.e. winners of the two R1 matchups that feed it)
  function semiContestants(conf, semiIdx) {
    const r1a = semiIdx === 0 ? 0 : 2;
    const r1b = semiIdx === 0 ? 1 : 3;
    const valid = new Set();
    r1Contestants(conf, r1a).forEach(a => valid.add(a));
    r1Contestants(conf, r1b).forEach(a => valid.add(a));
    // Also include the stored R1 winners (they are always valid semi contestants)
    if (bracketState[conf].r1[r1a]) valid.add(bracketState[conf].r1[r1a].abbr);
    if (bracketState[conf].r1[r1b]) valid.add(bracketState[conf].r1[r1b].abbr);
    return valid;
  }

  // Returns the set of team abbrs that are valid CF contestants
  function cfContestants(conf) {
    const valid = new Set();
    semiContestants(conf, 0).forEach(a => valid.add(a));
    semiContestants(conf, 1).forEach(a => valid.add(a));
    if (bracketState[conf].semi[0]) valid.add(bracketState[conf].semi[0].abbr);
    if (bracketState[conf].semi[1]) valid.add(bracketState[conf].semi[1].abbr);
    return valid;
  }

  function invalidateDownstream(conf, round, idx) {
    // Surgical invalidation: only clear a slot if the stored pick is no longer
    // a valid contestant given the new pick. This preserves user advances that
    // don't conflict with the new pick.
    if (round === 'r1') {
      const semiIdx = idx < 2 ? 0 : 1;
      const newWinner = bracketState[conf].r1[idx];
      // Which teams can still win this semi? The new r1 winner + the other r1 slot's winner
      const otherR1Idx = semiIdx === 0 ? (idx === 0 ? 1 : 0) : (idx === 2 ? 3 : 2);
      const otherR1Winner = bracketState[conf].r1[otherR1Idx];
      const validSemi = new Set();
      if (newWinner) validSemi.add(newWinner.abbr);
      if (otherR1Winner) validSemi.add(otherR1Winner.abbr);
      // Also include all r1 contestants from both matchups (for when neither is picked yet)
      r1Contestants(conf, idx).forEach(a => validSemi.add(a));
      if (otherR1Winner) validSemi.add(otherR1Winner.abbr);

      const semiPick = bracketState[conf].semi[semiIdx];
      if (semiPick && !validSemi.has(semiPick.abbr)) {
        bracketState[conf].semi[semiIdx] = null;
        // Cascade to CF
        const cfPick = bracketState[conf].cf[0];
        const validCF = new Set();
        // Valid CF contestants = stored semi picks that weren't just cleared
        const s0 = bracketState[conf].semi[0], s1 = bracketState[conf].semi[1];
        if (s0) validCF.add(s0.abbr);
        if (s1) validCF.add(s1.abbr);
        // Also any semi contestant teams
        semiContestants(conf, 0).forEach(a => validCF.add(a));
        semiContestants(conf, 1).forEach(a => validCF.add(a));
        if (cfPick && !validCF.has(cfPick.abbr)) {
          bracketState[conf].cf[0] = null;
          bracketState[conf].finalsTeam = null;
          // Cascade to champion
          const champ = bracketState.champion;
          const validChamp = new Set();
          if (bracketState.west.cf[0]) validChamp.add(bracketState.west.cf[0].abbr);
          if (bracketState.east.cf[0]) validChamp.add(bracketState.east.cf[0].abbr);
          cfContestants('west').forEach(a => validChamp.add(a));
          cfContestants('east').forEach(a => validChamp.add(a));
          if (champ && !validChamp.has(champ.abbr)) bracketState.champion = null;
        }
      }
    } else if (round === 'semi') {
      const newWinner = bracketState[conf].semi[idx];
      const otherSemiWinner = bracketState[conf].semi[idx === 0 ? 1 : 0];
      const validCF = new Set();
      if (newWinner) validCF.add(newWinner.abbr);
      if (otherSemiWinner) validCF.add(otherSemiWinner.abbr);
      semiContestants(conf, idx).forEach(a => validCF.add(a));

      const cfPick = bracketState[conf].cf[0];
      if (cfPick && !validCF.has(cfPick.abbr)) {
        bracketState[conf].cf[0] = null;
        bracketState[conf].finalsTeam = null;
        // Cascade to champion
        const champ = bracketState.champion;
        const validChamp = new Set();
        if (bracketState.west.cf[0]) validChamp.add(bracketState.west.cf[0].abbr);
        if (bracketState.east.cf[0]) validChamp.add(bracketState.east.cf[0].abbr);
        cfContestants('west').forEach(a => validChamp.add(a));
        cfContestants('east').forEach(a => validChamp.add(a));
        if (champ && !validChamp.has(champ.abbr)) bracketState.champion = null;
      }
    } else if (round === 'cf') {
      const champ = bracketState.champion;
      const validChamp = new Set();
      if (bracketState.west.cf[0]) validChamp.add(bracketState.west.cf[0].abbr);
      if (bracketState.east.cf[0]) validChamp.add(bracketState.east.cf[0].abbr);
      cfContestants('west').forEach(a => validChamp.add(a));
      cfContestants('east').forEach(a => validChamp.add(a));
      if (champ && !validChamp.has(champ.abbr)) bracketState.champion = null;
    }
  }

  // ================================================================
  // CHAMPION CELEBRATION
  // ================================================================
  function showChampion(team) {
    const overlay = document.getElementById('champion-overlay');
    const canvas = document.getElementById('confetti-canvas');
    if (!overlay) return;
    const colors = TEAM_COLORS[team.abbr] || { bg: '#ffaa00', text: '#fff' };
    const logo = getLogoUrl(team.abbr);
    overlay.querySelector('.champ-name').textContent = team.name;
    overlay.querySelector('.champ-logo-wrap').innerHTML = `<img src="${logo}" alt="${team.abbr}" onerror="this.outerHTML='<span style=font-family:Bebas+Neue,sans-serif;font-size:2rem;color:${colors.text}>${team.abbr}</span>'">`;
    overlay.querySelector('.champ-card').style.borderColor = colors.bg;
    overlay.querySelector('.champ-name').style.color = colors.bg;
    overlay.querySelector('.champ-logo-wrap').style.borderColor = colors.bg;
    overlay.querySelector('.champ-trophy').textContent = '🏆';
    overlay.classList.add('visible');
    canvas.classList.add('visible');
    startConfetti(colors.bg);

    // Apply champion colors to header gradient
    applyChampionTheme(colors.bg);
  }

  function dismissChampion() {
    const overlay = document.getElementById('champion-overlay');
    const canvas = document.getElementById('confetti-canvas');
    if (overlay) overlay.classList.remove('visible');
    if (canvas) { canvas.classList.remove('visible'); stopConfetti(); }
    resetChampionTheme();
  }

  let confettiAnim = null;
  let confettiParticles = [];

  function startConfetti(teamColor) {
    const canvas = document.getElementById('confetti-canvas');
    if (!canvas) return;
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    const ctx = canvas.getContext('2d');
    const colors = [teamColor, '#ffffff', '#ffaa00', '#ffd700', '#ff4d00'];
    confettiParticles = Array.from({length: 140}, () => ({
      x: Math.random() * canvas.width,
      y: Math.random() * -canvas.height,
      w: 8 + Math.random() * 10,
      h: 6 + Math.random() * 8,
      color: colors[Math.floor(Math.random() * colors.length)],
      rot: Math.random() * Math.PI * 2,
      rotV: (Math.random() - 0.5) * 0.12,
      vx: (Math.random() - 0.5) * 3,
      vy: 3 + Math.random() * 4,
    }));
    function draw() {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      confettiParticles.forEach(p => {
        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate(p.rot);
        ctx.fillStyle = p.color;
        ctx.globalAlpha = 0.88;
        ctx.fillRect(-p.w/2, -p.h/2, p.w, p.h);
        ctx.restore();
        p.x += p.vx; p.y += p.vy; p.rot += p.rotV;
        if (p.y > canvas.height) { p.y = -20; p.x = Math.random() * canvas.width; }
      });
      confettiAnim = requestAnimationFrame(draw);
    }
    if (confettiAnim) cancelAnimationFrame(confettiAnim);
    draw();
  }

  function stopConfetti() {
    if (confettiAnim) { cancelAnimationFrame(confettiAnim); confettiAnim = null; }
    const canvas = document.getElementById('confetti-canvas');
    if (canvas) { const ctx = canvas.getContext('2d'); ctx.clearRect(0,0,canvas.width,canvas.height); }
  }

  function applyChampionTheme(color) {
    document.documentElement.style.setProperty('--accent', color);
    document.querySelector('header').style.borderBottomColor = color + '88';
  }
  function resetChampionTheme() {
    document.documentElement.style.setProperty('--accent', '#ff4d00');
    document.querySelector('header').style.borderBottomColor = '';
  }

  // ================================================================
  // RENDER
  // ================================================================
  function teamRowHtml(seed, team, extraClass, clickFn) {
    if (!team) {
      return `<div class="bkt-team-row" style="opacity:0.4">
        <span class="bkt-seed">${seed}</span>
        <div style="width:38px;height:30px;border-radius:6px;background:var(--surface2);border:1px solid var(--border);display:flex;align-items:center;justify-content:center;flex-shrink:0">
          <span style="font-size:0.55rem;color:var(--muted)">?</span>
        </div>
        <span class="bkt-tbd">TBD</span>
      </div>`;
    }
    // Placeholder for undecided play-in seed · show seed number in logo box
    if (team._placeholder) {
      const cls = extraClass || '';
      const onclick = clickFn ? `onclick="${clickFn}"` : '';
      return `<div class="bkt-team-row ${cls}" ${onclick} style="opacity:0.75">
        <span class="bkt-seed">${seed}</span>
        <div style="width:38px;height:30px;border-radius:6px;background:var(--surface2);border:1px dashed var(--muted);display:flex;align-items:center;justify-content:center;flex-shrink:0">
          <span style="font-family:'Bebas Neue',sans-serif;font-size:1rem;color:var(--muted);letter-spacing:1px">${team._seed}</span>
        </div>
        <span class="bkt-name" style="color:var(--muted)">Play-In #${team._seed}</span>
        <span class="bkt-record" style="color:var(--muted)">?–?</span>
      </div>`;
    }
    const colors = TEAM_COLORS[team.abbr] || { bg: 'var(--surface2)', text: '#fff' };
    const logo = getLogoUrl(team.abbr);
    const cls = extraClass || '';
    const onclick = clickFn ? `onclick="${clickFn}"` : '';
    return `<div class="bkt-team-row ${cls}" ${onclick}>
      <span class="bkt-seed">${seed}</span>
      <div class="bkt-logo-badge" style="background:${colors.bg};border:1px solid ${colors.bg}88;">
        <img src="${logo}" alt="${team.abbr}" onerror="this.outerHTML='<span style=font-family:Bebas+Neue,sans-serif;font-size:0.75rem;color:${colors.text}>${team.abbr}</span>'">
      </div>
      <span class="bkt-name">${team.abbr}</span>
      <span class="bkt-record">${team.wins}–${team.losses}</span>
    </div>`;
  }

  function matchupHtml(conf, round, matchupIdx, topSeed, topTeam, botSeed, botTeam, winner, clickable) {
    // Allow interaction if at least one team is present (one-sided picks allowed)
    const hasAny = topTeam || botTeam;
    const classes = ['bkt-matchup'];
    if (hasAny && clickable) classes.push('clickable');
    if (hasAny && !winner) classes.push('pending');

    let topClass = '', botClass = '';
    if (winner) {
      topClass = topTeam && winner.abbr === topTeam.abbr ? 'winner-row' : (topTeam ? 'loser-row' : '');
      botClass = botTeam && winner.abbr === botTeam.abbr ? 'winner-row' : (botTeam ? 'loser-row' : '');
    }

    // Build click handlers · a team is clickable as long as it exists; opponent can be TBD
    const topClick = (hasAny && clickable && topTeam) ? `_bktPick('${conf}','${round}',${matchupIdx},'${topTeam.abbr}')` : '';
    const botClick = (hasAny && clickable && botTeam) ? `_bktPick('${conf}','${round}',${matchupIdx},'${botTeam.abbr}')` : '';

    return `<div class="${classes.join(' ')}">
      ${teamRowHtml(topSeed, topTeam, topClass, topClick)}
      ${teamRowHtml(botSeed, botTeam, botClass, botClick)}
    </div>`;
  }

  function emptySlotHtml(label) {
    return `<div class="bkt-matchup empty-slot">
      <div class="bkt-team-row" style="justify-content:center;padding:14px 8px">
        <span class="bkt-tbd" style="font-style:normal;letter-spacing:1px;font-size:0.7rem">${label}</span>
      </div>
    </div>`;
  }

  function buildHalfHtml(conf, seeds) {
    const g = seeds.slice(0, 6);
    let h = `<div class="bracket-half ${conf}">`;

    // R1
    h += `<div class="bkt-round bkt-r1">`;
    for (let i = 0; i < 4; i++) {
      const [top, bot] = getR1Teams(conf, i);
      const seed1 = [1,4,3,2][i], seed2 = [8,5,6,7][i];
      const winner = bracketState[conf].r1[i];
      if (top || bot) {
        h += matchupHtml(conf, 'r1', i, seed1, top, seed2, bot, winner, true);
      } else {
        h += emptySlotHtml(['1 vs 8','4 vs 5','3 vs 6','2 vs 7'][i]);
      }
    }
    h += `</div>`;

    // Connector
    h += `<div class="bkt-conn-col">
      <div class="bkt-conn"><div class="conn-top"></div><div class="conn-bot"></div></div>
      <div class="bkt-conn"><div class="conn-top"></div><div class="conn-bot"></div></div>
    </div>`;

    // Semis
    h += `<div class="bkt-round bkt-semis">`;
    for (let i = 0; i < 2; i++) {
      const [t, b] = getSemiTeams(conf, i);
      const winner = bracketState[conf].semi[i];
      if (t || b) {
        h += matchupHtml(conf, 'semi', i, '', t, '', b, winner, true);
      } else {
        h += emptySlotHtml('Semifinal');
      }
    }
    h += `</div>`;

    // Connector
    h += `<div class="bkt-conn-col">
      <div class="bkt-conn"><div class="conn-top"></div><div class="conn-bot"></div></div>
    </div>`;

    // CF
    h += `<div class="bkt-round bkt-cf">`;
    const [cft, cfb] = getCFTeams(conf);
    const cfwinner = bracketState[conf].cf[0];
    if (cft || cfb) {
      h += matchupHtml(conf, 'cf', 0, '', cft, '', cfb, cfwinner, true);
    } else {
      h += emptySlotHtml(conf === 'west' ? 'West Finals' : 'East Finals');
    }
    h += `</div>`;

    h += `</div>`;
    return h;
  }

  function buildFinalsHtml() {
    const [wTeam, eTeam] = getFinalsTeams();
    const champ = bracketState.champion;
    const hasAny = wTeam || eTeam;

    if (champ) {
      const isPhChamp = champ._placeholder;
      const colors = isPhChamp ? { bg: 'var(--muted)', text: '#fff' } : (TEAM_COLORS[champ.abbr] || { bg: '#ffaa00', text: '#fff' });
      const champLabel = isPhChamp ? ('Play-In #' + champ._seed) : champ.abbr;
      return `<div class="bracket-finals-col">
        <div class="bkt-finals has-teams" style="border-color:${colors.bg};cursor:pointer" onclick="_bktPickChampion(null)">
          🏆<br>NBA<br>FINALS
          <div class="finals-team" style="color:${colors.bg};font-size:${isPhChamp?'0.65rem':'1rem'}">${champLabel}</div>
          <div class="finals-sub">CHAMPION</div>
        </div>
      </div>`;
    }

    if (hasAny) {
      // Build buttons for whichever finalist(s) are known
      let buttons = '';
      [wTeam, eTeam].filter(Boolean).forEach(team => {
        const isPh = team._placeholder;
        const tc = isPh ? {bg:'var(--muted)'} : (TEAM_COLORS[team.abbr] || {bg:'var(--accent)'});
        const label = isPh ? ('Play-In #' + team._seed) : team.abbr;
        buttons += `<button onclick="_bktPickChampion('${team.abbr}')" style="background:${tc.bg}22;border:1px solid ${tc.bg}88;border-radius:5px;color:${tc.bg};font-family:'Bebas Neue',sans-serif;font-size:0.75rem;letter-spacing:1px;padding:5px 10px;cursor:pointer;transition:background 0.15s" onmouseover="this.style.background='${tc.bg}44'" onmouseout="this.style.background='${tc.bg}22'">${label}</button>`;
      });
      const sub = (!wTeam || !eTeam) ? 'Finalist · pick champion:' : 'Pick champion:';
      return `<div class="bracket-finals-col">
        <div class="bkt-finals has-teams" style="cursor:default">
          🏆<br>NBA<br>FINALS
          <div class="finals-sub">${sub}</div>
          <div style="display:flex;flex-direction:column;gap:5px;margin-top:6px">${buttons}</div>
        </div>
      </div>`;
    }

    return `<div class="bracket-finals-col">
      <div class="bkt-finals">🏆<br>NBA<br>FINALS<div class="finals-sub">2025–26</div></div>
    </div>`;
  }

  function buildPlayInHtml(conf, piTeams) {
    const pi = piState[conf];
    function piTeamBtn(seed, team, game, teamArrIdx, winnerAbbr, loserAbbr) {
      const colors = TEAM_COLORS[team.abbr] || { bg: 'var(--surface2)' };
      const logo = getLogoUrl(team.abbr);
      const isWinner = winnerAbbr === team.abbr;
      const isLoser = loserAbbr && loserAbbr === team.abbr;
      const cls = isWinner ? 'winner' : (isLoser ? 'loser' : '');
      return `<button class="pi-team-btn ${cls}" onclick="_bktPickPlayIn('${conf}','${game}',${teamArrIdx})">
        <span class="pi-seed">${seed}</span>
        <div class="pi-logo-badge" style="background:${colors.bg};border:1px solid ${colors.bg}88">
          <img class="pi-logo" src="${logo}" alt="${team.abbr}" onerror="this.style.display='none'">
        </div>
        <span class="pi-name">${team.abbr}</span>
        <span class="pi-record">${team.wins}–${team.losses}</span>
      </button>`;
    }

    const g78Winner = pi.game78winner ? pi.game78winner.abbr : null;
    const g910Winner = pi.game910winner ? pi.game910winner.abbr : null;
    const g78Loser = g78Winner ? piTeams.find(t => (t === piTeams[0] || t === piTeams[1]) && t.abbr !== g78Winner) : null;
    const deciderWinner = pi.deciderWinner ? pi.deciderWinner.abbr : null;

    let h = `<div class="playin-conf">`;
    h += `<div class="playin-title">${conf === 'west' ? 'Western' : 'Eastern'} <span class="playin-badge">Play-In Tournament</span></div>`;

    // Game 1: 7 vs 8 · winner is 7th seed
    h += `<div class="playin-game-label">Game 1 (7 vs 8) · Winner = 7th Seed</div>`;
    h += `<div class="playin-matchup">
      ${piTeamBtn(7, piTeams[0], '78', 0, g78Winner, g78Winner && piTeams[1].abbr === g78Winner ? piTeams[0].abbr : null)}
      ${piTeamBtn(8, piTeams[1], '78', 1, g78Winner, g78Winner && piTeams[0].abbr === g78Winner ? piTeams[1].abbr : null)}
    </div>`;
    if (g78Winner) {
      h += `<div class="playin-result-label visible">✓ ${g78Winner} locks in as 7th seed</div>`;
    }

    // Game 2: 9 vs 10 · winner advances to decider
    h += `<div class="playin-game-label" style="margin-top:14px">Game 2 (9 vs 10) · Winner advances to decider</div>`;
    h += `<div class="playin-matchup">
      ${piTeamBtn(9, piTeams[2], '910', 0, g910Winner, g910Winner && piTeams[3].abbr === g910Winner ? piTeams[2].abbr : null)}
      ${piTeamBtn(10, piTeams[3], '910', 1, g910Winner, g910Winner && piTeams[2].abbr === g910Winner ? piTeams[3].abbr : null)}
    </div>`;
    if (g910Winner && !g78Loser) {
      h += `<div class="playin-result-label visible" style="color:var(--accent2)">↓ Pick Game 1 result first</div>`;
    }

    // Game 3: loser of 7/8 vs winner of 9/10 · winner is 8th seed
    if (g78Loser && g910Winner) {
      h += `<div class="playin-game-label" style="margin-top:14px">Game 3 (8th Seed Decider) · Winner = 8th Seed</div>`;
      h += `<div class="playin-matchup">`;
      // Btn for loser of 7/8 (teamArrIdx 0 means "pick loserOf78")
      const loserColors = TEAM_COLORS[g78Loser.abbr] || { bg: 'var(--surface2)' };
      const loserLogo = getLogoUrl(g78Loser.abbr);
      const loserIsWinner = deciderWinner === g78Loser.abbr;
      const loserIsLoser = deciderWinner && deciderWinner !== g78Loser.abbr;
      h += `<button class="pi-team-btn ${loserIsWinner?'winner':loserIsLoser?'loser':''}" onclick="_bktPickPlayIn('${conf}','decider',0)">
        <span class="pi-seed" style="font-size:0.7rem;color:var(--accent2)">L78</span>
        <div class="pi-logo-badge" style="background:${loserColors.bg};border:1px solid ${loserColors.bg}88">
          <img class="pi-logo" src="${loserLogo}" alt="${g78Loser.abbr}" onerror="this.style.display='none'">
        </div>
        <span class="pi-name">${g78Loser.abbr}</span>
        <span class="pi-record">${g78Loser.wins}–${g78Loser.losses}</span>
      </button>`;
      // Btn for winner of 9/10
      const w910Team = pi.game910winner;
      const w910Colors = TEAM_COLORS[w910Team.abbr] || { bg: 'var(--surface2)' };
      const w910Logo = getLogoUrl(w910Team.abbr);
      const w910IsWinner = deciderWinner === w910Team.abbr;
      const w910IsLoser = deciderWinner && deciderWinner !== w910Team.abbr;
      h += `<button class="pi-team-btn ${w910IsWinner?'winner':w910IsLoser?'loser':''}" onclick="_bktPickPlayIn('${conf}','decider',1)">
        <span class="pi-seed" style="font-size:0.7rem;color:var(--accent2)">W910</span>
        <div class="pi-logo-badge" style="background:${w910Colors.bg};border:1px solid ${w910Colors.bg}88">
          <img class="pi-logo" src="${w910Logo}" alt="${w910Team.abbr}" onerror="this.style.display='none'">
        </div>
        <span class="pi-name">${w910Team.abbr}</span>
        <span class="pi-record">${w910Team.wins}–${w910Team.losses}</span>
      </button>`;
      h += `</div>`;
      if (deciderWinner) {
        h += `<div class="playin-result-label visible">✓ ${deciderWinner} earns the 8th seed</div>`;
      }
    } else if (!g78Loser || !g910Winner) {
      h += `<div style="font-family:'Barlow Condensed',sans-serif;font-size:0.65rem;letter-spacing:2px;color:var(--muted);text-transform:uppercase;margin-top:12px;padding:8px;border:1px dashed var(--border);border-radius:5px;text-align:center">Game 3 unlocks after Games 1 &amp; 2</div>`;
    }

    h += `</div>`;
    return h;
  }

  // ================================================================
  // GLOBAL CLICK HANDLERS (exposed on window for inline onclick)
  // ================================================================
  // Use a lookup map to find teams quickly
  const allTeams = [...west, ...east, ...wPI, ...ePI];
  function findTeam(abbr) { return allTeams.find(t => t.abbr === abbr); }

  window._bktPickPlayIn = function(conf, game, idx) {
    pickPlayIn(conf, game, idx);
  };

  window._bktPick = function(conf, round, matchupIdx, abbr) {
    // Check if this is a placeholder pick (__PI7_west / __PI8_east etc.)
    let team = findTeam(abbr);
    if (!team && abbr.startsWith('__PI')) {
      // Reconstruct the placeholder object so it can be stored in bracketState
      const m = abbr.match(/^__PI(\d+)_(\w+)$/);
      if (m) team = makePlaceholder(parseInt(m[1]), m[2]);
    }
    if (!team) return;
    if (round === 'r1') pickR1(conf, matchupIdx, team);
    else if (round === 'semi') pickSemi(conf, matchupIdx, team);
    else if (round === 'cf') pickCF(conf, team);
  };

  window._bktPickChampion = function(abbr) {
    if (!abbr) return;
    let team = findTeam(abbr);
    if (!team && abbr.startsWith('__PI')) {
      const m = abbr.match(/^__PI(\d+)_(\w+)$/);
      if (m) team = makePlaceholder(parseInt(m[1]), m[2]);
    }
    if (!team) return;
    pickChampion(team);
  };

  // ================================================================
  // RE-RENDER
  // ================================================================
  function rerenderBracket() {
    const container = document.getElementById('bracket-inner');
    if (!container) return;
    container.innerHTML = buildFullBracket();
    updateControls();
  }

  function buildFullBracket() {
    let html = '';

    // Play-In section ABOVE bracket
    html += `<div class="playin-above">
      <div class="section-header" style="margin-bottom:14px">
        <div class="section-title" style="font-size:1.4rem">Play-In Tournament</div>
        <div class="section-sub">Pick seeds 7 & 8 first, then fill the bracket</div>
      </div>
      <div class="playin-section">
        ${buildPlayInHtml('west', wPI)}
        ${buildPlayInHtml('east', ePI)}
      </div>
    </div>`;

    // Conference labels
    html += `<div style="display:flex;justify-content:space-between;margin-bottom:0">
      <div class="bracket-conf-label west-label" style="flex:1">WESTERN CONFERENCE</div>
      <div style="width:106px"></div>
      <div class="bracket-conf-label east-label" style="flex:1">EASTERN CONFERENCE</div>
    </div>`;

    // Main bracket
    html += `<div class="bracket-tree-wrap"><div class="bracket-tree">`;
    html += buildHalfHtml('west', west);
    html += buildFinalsHtml();
    html += buildHalfHtml('east', east);
    html += `</div></div>`;

    return html;
  }

  // ================================================================
  // INITIAL RENDER
  // ================================================================
  const container = document.getElementById('playoffs-container');

  // Controls
  let ctrlHtml = `<div class="bracket-controls">
    <button class="bkt-ctrl-btn" id="bkt-undo-btn" onclick="_bktUndo()" disabled>↩ Undo</button>
    <button class="bkt-ctrl-btn" id="bkt-redo-btn" onclick="_bktRedo()" disabled>↪ Redo</button>
    <button class="bkt-ctrl-btn danger" id="bkt-clear-btn" onclick="_bktClear()" disabled>✕ Clear Bracket</button>
    <span class="bracket-hint">Click a team to advance them. Start with Play-In picks above.</span>
  </div>`;

  container.innerHTML = ctrlHtml + `<div id="bracket-inner"></div>`;

  window._bktUndo = undo;
  window._bktRedo = redo;
  window._bktClear = clearBracket;

  document.getElementById('bracket-inner').innerHTML = buildFullBracket();
  updateControls();

  // Champion overlay (append to body if not already there)
  if (!document.getElementById('champion-overlay')) {
    const overlayEl = document.createElement('div');
    overlayEl.id = 'champion-overlay';
    overlayEl.innerHTML = `
      <div class="champ-backdrop" onclick="dismissChampOverlay()"></div>
      <div class="champ-card">
        <div class="champ-trophy">🏆</div>
        <div class="champ-year">2025–26 NBA Champions</div>
        <div class="champ-title">Your Pick</div>
        <div class="champ-logo-wrap"></div>
        <div class="champ-name"></div>
        <button class="champ-dismiss" onclick="dismissChampOverlay()">Dismiss</button>
      </div>`;
    document.body.appendChild(overlayEl);
    window.dismissChampOverlay = dismissChampion;
  }

  if (!document.getElementById('confetti-canvas')) {
    const cvs = document.createElement('canvas');
    cvs.id = 'confetti-canvas';
    document.body.appendChild(cvs);
  }

}
