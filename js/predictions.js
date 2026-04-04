
// PREDICTIONS TAB
// ============================================================

// Storage wrappers · uses localStorage (works in any browser).
// Falls back to a simple in-memory store if localStorage is blocked.
const _memStore = {};  // in-memory mirror for sync access (e.g. _predActiveDate)

// The entire betting tab belongs to Clanker, not individual users.
// Both picks (predictions:) and P&L (bets:) are shared across all users.
function _isSharedKey(key) { return key.startsWith('predictions:') || key.startsWith('bets:'); }

async function _storageGet(key) {
  const shared = _isSharedKey(key);
  try {
    const r = await window.storage.get(key, shared);
    if (r && r.value != null) { _memStore[key] = r.value; return { value: r.value }; }
    return null;
  } catch(e) {
    return _memStore[key] ? { value: _memStore[key] } : null;
  }
}
async function _storageSet(key, val) {
  _memStore[key] = val;
  const shared = _isSharedKey(key);
  try { await window.storage.set(key, val, shared); } catch(e) {}
  return true;
}
async function _storageDelete(key) {
  delete _memStore[key];
  const shared = _isSharedKey(key);
  try { await window.storage.delete(key, shared); } catch(e) {}
  return true;
}

// Storage keys
function _predKey(dateStr) { return 'predictions:' + dateStr; }

// Active date cache — populated by _initPredActiveDate() before each render.
let _predActiveDateCache = null;

// Async initializer: loads yesterday's picks from Firebase and determines the
// correct active date. "Today" doesn't advance until all yesterday's games are graded.
async function _initPredActiveDate() {
  const calendarToday = localDateStr(new Date());
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayStr = localDateStr(yesterday);

  // Load yesterday's picks into _memStore if not already there
  if (!_memStore[_predKey(yesterdayStr)]) {
    await _storageGet(_predKey(yesterdayStr));
  }

  try {
    const raw = _memStore[_predKey(yesterdayStr)];
    if (raw) {
      const data = JSON.parse(raw);
      const picks = data.picks || [];
      // Stay on yesterday if any picks still have no result (games not final yet)
      if (picks.length > 0 && picks.some(p => !p.result)) {
        _predActiveDateCache = yesterdayStr;
        return;
      }
    }
  } catch(e) {}

  _predActiveDateCache = calendarToday;
}

// Sync accessor — always use after awaiting _initPredActiveDate().
function _predActiveDate() {
  if (_predActiveDateCache) return _predActiveDateCache;
  // Fallback: use _memStore sync check (before cache is warmed)
  const now = new Date();
  const calendarToday = localDateStr(now);
  const hour = now.getHours();
  if (hour < 6) {
    const yesterday = new Date(now);
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = localDateStr(yesterday);
    try {
      const raw = _memStore[_predKey(yesterdayStr)];
      if (raw) {
        const data = JSON.parse(raw);
        const picks = data.picks || [];
        if (picks.length > 0 && picks.some(p => !p.result)) return yesterdayStr;
        if (picks.length === 0) return yesterdayStr;
      } else {
        return yesterdayStr;
      }
    } catch(e) {}
  }
  return calendarToday;
}

function _predViewingDate() { return _predState.viewingDate || _predActiveDate(); }

const _predState = {
  viewingDate: null,   // null = today
  generating: false,
  generateTriggered: false,
  lastTriggerDate: null,
};

// ── HELPERS ──────────────────────────────────────────────────

function _predGetTeamData(abbr) {
  const t = STANDINGS_DATA.find(t => t.abbr === abbr);
  const e = ENRICHED_DATA.find(t => t.abbr === abbr);
  const nr = _NET_RATINGS[abbr] || {};
  const streak = STREAK_DATA[abbr] || 0;
  return { ...t, power: e ? e.power : 0, ortg: nr.ortg || 0, drtg: nr.drtg || 0, netRtg: nr.netRtg || 0, streak };
}

function _predStreakStr(streak) {
  if (!streak) return 'W/L 0';
  return (streak > 0 ? 'W' : 'L') + Math.abs(streak);
}

// Build a compact recent-form string from last 5 results in RECENT_GAMES for a team
function _predRecentForm(abbr) {
  const results = [];
  [...RECENT_GAMES].reverse().forEach(g => {
    if (results.length >= 5) return;
    if (g.home === abbr) results.push(g.homeScore > g.awayScore ? 'W' : 'L');
    else if (g.away === abbr) results.push(g.awayScore > g.homeScore ? 'W' : 'L');
  });
  return results.join('') || '';
}

// Summarize past pick performance for the AI prompt (last 7 days)
async function _predGetHistorySummary() {
  const lines = [];
  for (let i = 1; i <= 7; i++) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const dateStr = localDateStr(d);
    try {
      const stored = await _storageGet(_predKey(dateStr));
      if (!stored) continue;
      const data = JSON.parse(stored.value);
      if (!data.picks || !data.picks.length) continue;
      const graded = data.picks.filter(p => p.result);
      if (!graded.length) continue;
      const wins = graded.filter(p => p.result === 'correct').length;
      const upsets = graded.filter(p => p.isUpset && p.result === 'correct').length;
      const missed = graded.filter(p => p.isUpset && p.result === 'wrong').length;
      lines.push(`${dateStr}: ${wins}/${graded.length} correct (${upsets} upset picks hit, ${missed} upset picks missed)`);
    } catch(e) {}
  }
  return lines.length ? lines.join('\n') : 'No prior pick history available.';
}

// ── GENERATE PICKS (stats-based, no API needed) ───────────────
//
// Picks are generated entirely from the data already on the page:
// power score, net rating, home court, streak, recent form, win%.
// A seeded pseudo-random element (based on date + matchup) provides
// day-to-day variety and enables genuine upset picks when the numbers
// are close enough to justify it.

function _predDateSeed(dateStr, homeAbbr, awayAbbr) {
  // Deterministic seed so the same day always produces the same picks
  let h = 0;
  const s = (dateStr + homeAbbr + awayAbbr);
  for (let i = 0; i < s.length; i++) { h = (Math.imul(31, h) + s.charCodeAt(i)) | 0; }
  return Math.abs(h);
}

function _predSeededRandom(seed) {
  // Simple LCG · returns float [0, 1)
  const x = Math.sin(seed + 1) * 10000;
  return x - Math.floor(x);
}

function _predBuildReasoning(winner, loser, winnerData, loserData, isHome, powerDiff, isUpset, seed) {
  const rnd = (n) => _predSeededRandom(seed + n);

  const winStreak  = STREAK_DATA[winner] || 0;
  const lossStreak = STREAK_DATA[loser]  || 0;
  const netDiff    = (winnerData.netRtg - loserData.netRtg).toFixed(1);

  const templates = isUpset ? [
    `${winner} are the underdog on paper but that net rating gap is only ${netDiff} points. ${loser} ${lossStreak < -2 ? 'has been bleeding losses lately and' : ''} looks vulnerable enough for the upset here.`,
    `Don't sleep on ${winner}. The power diff is just ${powerDiff} points and ${isHome ? 'they have home court tonight' : 'their recent form is trending up'}. ${loser} at ${loserData.netRtg > 0 ? '+' : ''}${loserData.netRtg} net rating is not as scary as the record suggests.`,
    `${winner} covers the gap with a dRTG of ${winnerData.drtg} that can slow down ${loser}'s offense sitting at ${loserData.ortg} on the year. Close enough on the numbers to take the dog.`,
    `${winner} is the play. ${loser} is stronger on paper${lossStreak <= -2 ? ' but has dropped ' + Math.abs(lossStreak) + ' straight' : ' but the gap is tighter than people think'}. At ${winnerData.netRtg > 0 ? '+' : ''}${winnerData.netRtg} net rating, ${winner} is no pushover.`,
    `Clanker likes ${winner} here. The numbers are close enough that ${isHome ? 'home court could flip this' : 'anything can happen'}. ${loser} at ${loserData.power} power score is not untouchable.`,
  ] : [
    `${winner} at ${winnerData.power} power score has a clear edge here. The ${netDiff}-point net rating advantage is real and ${winStreak > 0 ? 'they are rolling on a ' + winStreak + '-game win streak' : 'recent form backs it up'}.`,
    `Lean ${winner}. Their offense at ${winnerData.ortg} oRTG runs into a ${loser} defense giving up ${loserData.drtg} on the year. That ${powerDiff}-point power gap is not nothing.`,
    `${winner} takes this one${lossStreak <= -2 ? '. ' + loser + ' has dropped ' + Math.abs(lossStreak) + ' in a row and the cracks are showing' : '. ' + loser + ' has the worse net rating at ' + (loserData.netRtg > 0 ? '+' : '') + loserData.netRtg}. Back the stronger team.`,
    `${winner} is the pick${isHome ? ' with home court on their side' : ' on the road tonight'}. Power score of ${winnerData.power} vs ${loserData.power} tells the story pretty clearly.`,
    `Clanker is on ${winner}. The net rating gap of ${netDiff} points is meaningful at this stage of the season and ${isHome ? 'home teams cover more often than not' : 'the road form is there'}.`,
  ];

  return templates[Math.floor(rnd(7) * templates.length)];
}

async function _predGeneratePicks(games) {
  const todayStr = localDateStr(new Date());

  const picks = games.map(g => {
    const home = _predGetTeamData(g.home);
    const away = _predGetTeamData(g.away);
    const seed = _predDateSeed(todayStr, g.home, g.away);
    const rnd  = (n) => _predSeededRandom(seed + n);

    const homeGP = home.wins + home.losses;
    const awayGP = away.wins + away.losses;
    if (!homeGP || !awayGP) return null;

    // ── Score each team ──────────────────────────────────────────
    // Start from power score, add contextual adjustments
    let homeScore = home.power;
    let awayScore = away.power;

    // Home court: historically worth ~3 pts in NBA
    homeScore += 3.0;

    // Streak momentum: each consecutive game is worth ~0.4 pts
    homeScore += (STREAK_DATA[g.home] || 0) * 0.4;
    awayScore += (STREAK_DATA[g.away] || 0) * 0.4;

    // Net rating is already baked into power score but add a small extra weight
    homeScore += (home.netRtg || 0) * 0.15;
    awayScore += (away.netRtg || 0) * 0.15;

    const rawDiff  = homeScore - awayScore;
    const powerDiff = Math.abs(home.power - away.power).toFixed(1);
    const statFav  = rawDiff >= 0 ? g.home : g.away;
    const statDog  = rawDiff >= 0 ? g.away : g.home;
    const favScore = Math.max(homeScore, awayScore);
    const dogScore = Math.min(homeScore, awayScore);
    const margin   = Math.abs(rawDiff);

    // ── Upset decision ───────────────────────────────────────────
    // Probability of picking an upset scales with how close the matchup is.
    // A 0-pt margin = 40% upset chance; 10-pt margin ≈ 5% upset chance.
    const upsetProb = Math.max(0.03, 0.40 - (margin * 0.037));
    const isUpset   = rnd(1) < upsetProb;

    const pick   = isUpset ? statDog : statFav;
    const loser  = isUpset ? statFav : statDog;
    const pickData  = _predGetTeamData(pick);
    const loserData = _predGetTeamData(loser);
    const pickIsHome = pick === g.home;

    // ── Confidence ───────────────────────────────────────────────
    let confidence;
    const effectiveMargin = isUpset ? (10 - margin) : margin; // upsets are less confident
    if (effectiveMargin >= 8)       confidence = 'High';
    else if (effectiveMargin >= 4)  confidence = 'Medium';
    else                            confidence = 'Low';

    const reasoning = _predBuildReasoning(
      pick, loser, pickData, loserData, pickIsHome, powerDiff, isUpset, seed
    );

    return {
      game:     `${g.away} @ ${g.home}`,
      homeAbbr: g.home,
      awayAbbr: g.away,
      tipTime:  g.tipDisplay || '',
      pick,
      confidence,
      isUpset,
      reasoning,
      result:     null,
      finalScore: null,
      homeML: g.homeML || null,
      awayML: g.awayML || null,
      eventId: g.eventId || null,
    };
  }).filter(Boolean);

  // Attach moneylines from ESPN odds (best-effort — may not be available yet)
  const todayOdds = await fetchOddsForDate(todayStr).catch(() => ({}));
  _attachMoneylines(picks, todayOdds);

  return picks;
}

// ── GRADE PICKS ───────────────────────────────────────────────

async function _predGradePicks(dateStr) {
  try {
    const stored = await _storageGet(_predKey(dateStr));
    if (!stored) return;
    const data = JSON.parse(stored.value);
    if (!data.picks || !data.picks.length) return;

    const games = await espnFetchDate(dateStr);
    if (!games) return;

    let changed = false;
    data.picks.forEach(pick => {
      if (pick.result) return; // already graded
      const game = games.find(g =>
        g.isFinal &&
        ((g.home === pick.homeAbbr && g.away === pick.awayAbbr) ||
         (g.home === pick.awayAbbr && g.away === pick.homeAbbr))
      );
      if (!game) return;
      const winner = game.homeScore > game.awayScore ? game.home : game.away;
      pick.result = pick.pick === winner ? 'correct' : 'wrong';
      pick.finalScore = `${game.away} ${game.awayScore}-${game.homeScore} ${game.home}`;
      changed = true;
    });

    if (changed) {
      await _storageSet(_predKey(dateStr), JSON.stringify(data));
    }

    // After grading picks, compute bet P&L
    if (changed) {
      await _gradeBetsForDate(dateStr);
    }
  } catch(e) {}
}

// ── RENDER ────────────────────────────────────────────────────

async function renderPredictions() {
  const container = document.getElementById('predictions-container');
  await _initPredActiveDate();  // load Firebase data & determine correct active date
  const calendarToday = localDateStr(new Date());
  const activeDate = _predActiveDate();   // today = last day with ungraded games
  const viewDate = _predViewingDate();
  const isToday  = viewDate === activeDate;  // "today" = the active betting day, not calendar day

  // Reset the generate-trigger guard if viewing a different date than last time
  if (_predState.lastTriggerDate !== viewDate) {
    _predState.generateTriggered = false;
    _predState.lastTriggerDate = viewDate;
  }

  // ── Step 1: Render the shell immediately (no async) ──────────
  // The date nav and record badge render right away; async sections
  // fill in below as data arrives.
  container.innerHTML = `
    <div class="section-header">
      <div class="section-title">🎰 Clanker's Daily Picks</div>
      <div class="section-sub">Clanker's game picks · Tracks record over time</div>
    </div>
    <div class="pred-header-row">
      <div id="pred-record-badge" class="pred-record-badge">
        <div>
          <div style="color:var(--muted);font-size:0.7rem;letter-spacing:2px;text-transform:uppercase;margin-bottom:2px">All-Time Record</div>
          <div style="display:flex;align-items:baseline;gap:6px">
            <span class="pred-record-num wins" id="pred-rec-w">0</span>
            <span style="color:var(--muted)">–</span>
            <span class="pred-record-num losses" id="pred-rec-l">0</span>
            <span class="pred-record-num pct" style="font-size:1rem;margin-left:4px" id="pred-rec-pct"></span>
          </div>
        </div>
      </div>
      <div id="pred-ledger-badge" class="pred-ledger-badge" style="display:none">
        <div>
          <div style="color:var(--muted);font-size:0.7rem;letter-spacing:2px;text-transform:uppercase;margin-bottom:2px">💰 $10/Game · All-Time</div>
          <div style="display:flex;align-items:baseline;gap:4px">
            <span class="pred-ledger-val even" id="pred-ledger-total">$0.00</span>
          </div>
        </div>
      </div>
      <div class="pred-date-nav">
        <button class="pred-date-btn" onclick="_predNavigate(-1)" ${viewDate <= '2026-03-31' ? 'disabled' : ''}>◀</button>
        <div class="pred-date-label">${isToday ? 'TODAY' : _predFmtDate(viewDate)}</div>
        <button class="pred-date-btn" onclick="_predNavigate(1)" ${isToday ? 'disabled' : ''}>▶</button>
      </div>
    </div>
    <div id="pred-picks-area">
      <div style="padding:40px 0;text-align:center;color:var(--muted);font-family:'Barlow Condensed',sans-serif;letter-spacing:2px;font-size:0.8rem;text-transform:uppercase">
        Loading…
      </div>
    </div>
    <div id="pred-pnl-chart-area"></div>
    <div id="pred-history-area"></div>`;

  // ── Step 2: Load picks + games + odds in parallel ───────────────
  const [storedRaw, fetchedGames, viewDateOdds] = await Promise.all([
    _storageGet(_predKey(viewDate)),
    espnFetchDate(viewDate).catch(() => null),   // fetch for all dates (today AND past) for score display
    fetchOddsForDate(viewDate).catch(() => ({})),
  ]);

  let storedData = null;
  try { if (storedRaw) storedData = JSON.parse(storedRaw.value); } catch(e) {}

  let games = fetchedGames || [];
  if (isToday && !games.length) {
    games = UPCOMING_GAMES
      .filter(g => g.date === viewDate)
      .map(g => ({ ...g, isFinal: false, isLive: false, isUpcoming: true }));
  }

  // Attach fresh moneylines to any picks that don't have them yet
  if (storedData?.picks) {
    // Also copy eventIds from freshly-fetched games so odds API can use them
    if (games.length) {
      storedData.picks.forEach(pick => {
        if (!pick.eventId) {
          const g = games.find(g => g.home === pick.homeAbbr && g.away === pick.awayAbbr);
          if (g?.eventId) pick.eventId = g.eventId;
        }
      });
    }
    const mlChanged = _attachMoneylines(storedData.picks, viewDateOdds);

    // Attach final scores + results from freshly-fetched games BEFORE rendering
    // so pick cards always show scores on the first render (not just after background grading)
    let scoresAttached = false;
    if (games.length) {
      storedData.picks.forEach(pick => {
        const game = games.find(g =>
          g.isFinal && (
            (g.home === pick.homeAbbr && g.away === pick.awayAbbr) ||
            (g.home === pick.awayAbbr && g.away === pick.homeAbbr)
          )
        );
        if (!game) return;
        if (!pick.finalScore) {
          pick.finalScore = `${game.away} ${game.awayScore}-${game.homeScore} ${game.home}`;
          scoresAttached = true;
        }
        if (!pick.result) {
          const winner = game.homeScore > game.awayScore ? game.home : game.away;
          pick.result = pick.pick === winner ? 'correct' : 'wrong';
          scoresAttached = true;
        }
      });
    }

    if (mlChanged || scoresAttached) {
      _storageSet(_predKey(viewDate), JSON.stringify(storedData)).catch(() => {});
    }
  }

  // ── Step 3: Render picks area ─────────────────────────────────
  const picksArea = document.getElementById('pred-picks-area');
  if (!picksArea) return;

  if (storedData && storedData.picks && storedData.picks.length) {
    const picks = storedData.picks;
    // Note: this block uses await so the outer renderPredictions must be async (it is)
    const graded = picks.filter(p => p.result);
    const dayW   = graded.filter(p => p.result === 'correct').length;
    const locked  = isToday ? _predPicksLocked(picks, games) : true;

    let html = '';
    // Load daily bet ledger for summary line
    const todayDayLedger = await _getDayLedger(viewDate).catch(() => null);

    if (graded.length) {
      let moneyLine = '';
      if (todayDayLedger && todayDayLedger.bets > 0) {
        const net = todayDayLedger.net;
        const mCol = net > 0 ? 'var(--green)' : net < 0 ? 'var(--red)' : 'var(--muted)';
        const mStr = (net >= 0 ? '+' : '') + '$' + Math.abs(net).toFixed(2);
        moneyLine = ` · <span style="color:${mCol};font-family:'Bebas Neue',sans-serif;font-size:1rem;letter-spacing:1px">${mStr}</span> on $10 bets`;
      }
      html += `<div style="font-family:'Barlow Condensed',sans-serif;font-size:0.8rem;color:var(--muted);letter-spacing:2px;margin-bottom:16px;text-transform:uppercase">
        ${_predFmtDate(viewDate)} · ${dayW}/${graded.length} correct${moneyLine}
      </div>`;
    }

    html += `<div class="pred-cards-grid">`;

    // Build power rank map (rank 1 = highest power score)
    const predRankMap = {};
    [...ENRICHED_DATA].sort((a, b) => b.power - a.power).forEach((t, i) => {
      predRankMap[t.abbr] = i + 1;
    });

    picks.forEach(pick => {
      const homeT      = _predGetTeamData(pick.homeAbbr);
      const awayT      = _predGetTeamData(pick.awayAbbr);
      const homeColors = TEAM_COLORS[pick.homeAbbr] || {bg:'#333'};
      const awayColors = TEAM_COLORS[pick.awayAbbr] || {bg:'#333'};
      const pickColors = TEAM_COLORS[pick.pick]     || {bg:'var(--accent)'};
      const cardClass  = pick.result ? (pick.result === 'correct' ? 'correct' : 'wrong') : 'pending';

      const awayRank = predRankMap[pick.awayAbbr] || '';
      const homeRank = predRankMap[pick.homeAbbr] || '';

      html += (function() {
        // Build gradient background for header from both team colors
        const awayHex = awayColors.bg === '#333' ? '#444' : awayColors.bg;
        const homeHex = homeColors.bg === '#333' ? '#444' : homeColors.bg;
        const pickHex = pickColors.bg === '#333' ? '#555' : pickColors.bg;

        // Find current live score from games array if game is in progress
        const liveGame = games.find(g =>
          (g.home === pick.homeAbbr && g.away === pick.awayAbbr) ||
          (g.home === pick.awayAbbr && g.away === pick.homeAbbr)
        );
        const isLive = liveGame && liveGame.isLive;
        const isFinal = liveGame && liveGame.isFinal;

        // For past dates, liveGame is absent (games[] not fetched); fall back to stored pick data
        const hasFinalScore = pick.finalScore ||
          (liveGame && liveGame.isFinal && (liveGame.homeScore || liveGame.awayScore));

        // Parse scores: prefer live game object, fall back to stored finalScore string
        // finalScore format: "AWAY awayScore-homeScore HOME"  e.g. "BOS 112-108 MIL"
        function parseFinalScores() {
          if (liveGame && liveGame.isFinal) {
            const awayS = liveGame.away === pick.awayAbbr ? liveGame.awayScore : liveGame.homeScore;
            const homeS = liveGame.home === pick.homeAbbr ? liveGame.homeScore : liveGame.awayScore;
            return { awayS, homeS };
          }
          if (pick.finalScore) {
            // "AWAY awayScore-homeScore HOME"  →  split on ' ', index 1 is "awayScore-homeScore"
            const parts = pick.finalScore.split(' ');
            const scorePart = parts[1] || '';
            const [as, hs] = scorePart.split('-');
            return { awayS: as || '?', homeS: hs || '?' };
          }
          return null;
        }

        let centerHtml = '';
        if (isLive) {
          const awayScore = liveGame.away === pick.awayAbbr ? liveGame.awayScore : liveGame.homeScore;
          const homeScore = liveGame.home === pick.homeAbbr ? liveGame.homeScore : liveGame.awayScore;
          centerHtml = `<div class="pred-live-indicator"><div class="pred-live-dot"></div>LIVE</div>
            <div class="pred-score-display">
              ${awayScore}<span class="pred-score-sep"> - </span>${homeScore}
            </div>
            <div class="pred-game-clock">${liveGame.status || ''}</div>`;
        } else if (hasFinalScore || pick.result) {
          const scores = parseFinalScores();
          const scoreDisplay = scores
            ? `<div class="pred-score-display" style="font-size:1.3rem">${scores.awayS}<span class="pred-score-sep" style="font-size:1rem"> - </span>${scores.homeS}</div>`
            : `<div style="font-family:'Barlow Condensed',sans-serif;font-size:0.82rem;letter-spacing:1px;color:${pick.result==='correct'?'var(--green)':pick.result==='wrong'?'var(--red)':'var(--muted)'}">${pick.result==='correct'?'✓ CORRECT':pick.result==='wrong'?'✗ WRONG':'—'}</div>`;
          centerHtml = `<div class="pred-tip-time" style="font-size:0.65rem">FINAL</div>${scoreDisplay}`;
        } else {
          centerHtml = `<span class="pred-tip-time">${pick.tipTime || 'TODAY'}</span>
            <div class="pred-at-sign">@</div>`;
        }

        // Stat rows
        function statRow(awayVal, label, homeVal, higherIsBetter) {
          const aN = parseFloat(awayVal), hN = parseFloat(homeVal);
          let awayCls = '', homeCls = '';
          if (!isNaN(aN) && !isNaN(hN) && aN !== hN) {
            const awayWins = higherIsBetter ? aN > hN : aN < hN;
            awayCls = awayWins ? 'better' : 'worse';
            homeCls = awayWins ? 'worse' : 'better';
          }
          return '<div class="pred-stat-row">'
            + '<span class="pred-stat-val away ' + awayCls + '">' + awayVal + '</span>'
            + '<span class="pred-stat-label">' + label + '</span>'
            + '<span class="pred-stat-val home ' + homeCls + '">' + homeVal + '</span>'
            + '</div>';
        }
        const awayStrk = STREAK_DATA[pick.awayAbbr]||0;
        const homeStrk = STREAK_DATA[pick.homeAbbr]||0;
        const strkAwayCls = awayStrk === homeStrk ? '' : awayStrk > homeStrk ? 'better' : 'worse';
        const strkHomeCls = awayStrk === homeStrk ? '' : homeStrk > awayStrk ? 'better' : 'worse';
        const strkRow = '<div class="pred-stat-row">'
          + '<span class="pred-stat-val away ' + strkAwayCls + '">' + _predStreakStr(awayStrk) + '</span>'
          + '<span class="pred-stat-label">STREAK</span>'
          + '<span class="pred-stat-val home ' + strkHomeCls + '">' + _predStreakStr(homeStrk) + '</span>'
          + '</div>';

        const statsHtml = statRow(awayT.power, 'POWER', homeT.power, true)
          + statRow((awayT.netRtg>0?'+':'') + awayT.netRtg, 'NET RTG', (homeT.netRtg>0?'+':'') + homeT.netRtg, true)
          + statRow(awayT.ortg, 'oRTG', homeT.ortg, true)
          + statRow(awayT.drtg, 'dRTG', homeT.drtg, false)
          + strkRow;

        // Pick bar right side
        const pickIsHome = pick.pick === pick.homeAbbr;
        const pickML = pickIsHome ? pick.homeML : pick.awayML;
        const mlStr = pickML ? _fmtML(pickML) : null;
        const mlIsFav = pickML && pickML < 0;
        const mlCls = mlIsFav ? 'fav' : 'dog';
        const mlBadge = mlStr ? '<span class="pred-ml-badge ' + mlCls + '">' + mlStr + '</span>' : '';

        // Pre-game bet preview row — only show if we have a real moneyline
        const betPreviewML = pickML; // null if no odds yet
        const potentialPayout = betPreviewML ? _mlPayout(betPreviewML, 10) : null;
        const mlLabel = mlStr || null;
        const mlLabelCls = betPreviewML && betPreviewML < 0 ? 'fav' : 'dog';
        const betRowHtml = (() => {
          if (pick.result === 'correct') {
            const br = _pickBetResult(pick);
            const profit = br ? br.payout : (potentialPayout || 9.09);
            return `<div class="pred-bet-row">
              <div class="pred-bet-row-left">💰 <span class="pred-bet-row-stake">$10 bet</span>${mlLabel ? ' · <span class="pred-ml-badge ' + mlLabelCls + '" style="display:inline-flex">' + mlLabel + '</span>' : ''}</div>
              <div class="pred-bet-row-right"><span class="pred-bet-payout-preview win">+$${profit.toFixed(2)} profit</span></div>
            </div>`;
          } else if (pick.result === 'wrong') {
            return `<div class="pred-bet-row">
              <div class="pred-bet-row-left">💰 <span class="pred-bet-row-stake">$10 bet</span>${mlLabel ? ' · <span class="pred-ml-badge ' + mlLabelCls + '" style="display:inline-flex">' + mlLabel + '</span>' : ''}</div>
              <div class="pred-bet-row-right"><span class="pred-bet-payout-preview loss">−$10.00 lost</span></div>
            </div>`;
          } else if (potentialPayout !== null) {
            return `<div class="pred-bet-row">
              <div class="pred-bet-row-left">💰 <span class="pred-bet-row-stake">$10 bet</span> · <span class="pred-ml-badge ${mlLabelCls}" style="display:inline-flex">${mlLabel}</span></div>
              <div class="pred-bet-row-right" style="color:var(--text)">Win → <span class="pred-bet-payout-preview win" style="font-size:0.95rem">+$${potentialPayout.toFixed(2)}</span></div>
            </div>`;
          } else {
            return ''; // no odds yet — show nothing
          }
        })();

        let pickRight = '';
        if (pick.result === 'correct') {
          const betR = _pickBetResult(pick);
          const payStr = betR ? ' <span class="pred-payout-badge win">+$' + betR.payout.toFixed(2) + '</span>' : '';
          pickRight = '<span class="pred-result-badge correct">✓ Correct</span>' + payStr;
        } else if (pick.result === 'wrong') {
          pickRight = '<span class="pred-result-badge wrong">✗ Wrong</span> <span class="pred-payout-badge loss">-$10.00</span>';
        } else if (locked) {
          pickRight = mlBadge + ' <span style="font-family:\'Barlow Condensed\',sans-serif;font-size:0.82rem;letter-spacing:2px;color:rgba(255,255,255,0.75);position:relative;z-index:1">LOCKED 🔒</span>';
        } else {
          pickRight = mlBadge + ' <span style="font-family:\'Barlow Condensed\',sans-serif;font-size:0.78rem;letter-spacing:2px;color:rgba(255,255,255,0.6);position:relative;z-index:1">CONF: ' + pick.confidence.toUpperCase() + '</span>';
        }

        return `<div class="pred-card ${cardClass}">
          <div class="pred-card-header">
            <div class="pred-card-header-bg" style="background:linear-gradient(90deg,${awayHex} 0%,transparent 55%)"></div>
            <div class="pred-card-header-bg" style="background:linear-gradient(270deg,${homeHex} 0%,transparent 55%)"></div>
            <div class="pred-team-side away">
              <div class="pred-logo-wrap" style="background:${awayHex}20;border:1px solid ${awayHex}40">
                <img src="${getLogoUrl(pick.awayAbbr)}" alt="${pick.awayAbbr}" onerror="this.style.display='none'">
              </div>
              <div class="pred-team-info">
                <div class="pred-team-rank">#${awayRank}</div>
                <div class="pred-team-abbr">${pick.awayAbbr}</div>
                <div class="pred-team-rec">${awayT.wins}-${awayT.losses}</div>
              </div>
            </div>
            <div class="pred-center-info">${centerHtml}</div>
            <div class="pred-team-side home">
              <div class="pred-logo-wrap" style="background:${homeHex}20;border:1px solid ${homeHex}40">
                <img src="${getLogoUrl(pick.homeAbbr)}" alt="${pick.homeAbbr}" onerror="this.style.display='none'">
              </div>
              <div class="pred-team-info">
                <div class="pred-team-rank">#${homeRank}</div>
                <div class="pred-team-abbr">${pick.homeAbbr}</div>
                <div class="pred-team-rec">${homeT.wins}-${homeT.losses}</div>
              </div>
            </div>
          </div>

          <div class="pred-stats-row">${statsHtml}</div>

          <div class="pred-pick-bar" style="background:linear-gradient(90deg,${pickHex}44 0%,${pickHex}18 100%)">
            <div class="pred-pick-bar-bg" style="background:${pickHex};opacity:0.15"></div>
            <div class="pred-pick-left">
              <div class="pred-pick-logo">
                <img src="${getLogoUrl(pick.pick)}" alt="${pick.pick}" onerror="this.style.display='none'">
              </div>
              <div class="pred-pick-text">
                <span class="pred-pick-label-text">PICK</span>
                <span class="pred-pick-name">${pick.pick}</span>
              </div>
              
            </div>
            <div class="pred-pick-right">${pickRight}</div>
          </div>

          ${betRowHtml}

          <div class="pred-reasoning">${pick.reasoning}</div>
        </div>`;
      })();
    });
    html += `</div>`;

    if (isToday && locked) {
      html += `<div style="margin-top:16px;font-family:'Barlow Condensed',sans-serif;font-size:0.75rem;color:var(--muted);letter-spacing:2px;text-transform:uppercase">
        🔒 Picks locked · Games in progress
      </div>`;
    }
    picksArea.innerHTML = html;

  } else if (isToday) {
    const upcoming = games.filter(g => !g.isFinal && !g.isLive);
    if (!upcoming.length) {
      picksArea.innerHTML = `<div class="pred-no-games">🏀 No upcoming games today</div>`;
    } else if (_predState.generating) {
      picksArea.innerHTML = `<div style="padding:40px 0;text-align:center">
        <div class="mini-spinner" style="display:inline-block;margin-bottom:16px"></div>
        <div style="font-family:'Barlow Condensed',sans-serif;font-size:0.9rem;letter-spacing:2px;color:var(--muted);text-transform:uppercase">Clanker is running the numbers…</div>
      </div>`;
    } else {
      // No picks yet and not generating · kick off generation once, show spinner
      // Guard prevents re-triggering if renderPredictions is called again before complete
      if (!_predState.generateTriggered) {
        _predState.generateTriggered = true;
        picksArea.innerHTML = `<div style="padding:40px 0;text-align:center">
          <div class="mini-spinner" style="display:inline-block;margin-bottom:16px"></div>
          <div style="font-family:'Barlow Condensed',sans-serif;font-size:0.9rem;letter-spacing:2px;color:var(--muted);text-transform:uppercase">Clanker is generating today's picks…</div>
        </div>`;
        setTimeout(() => _predGenerateToday(), 0);
      } else {
        picksArea.innerHTML = `<div style="padding:40px 0;text-align:center">
          <div class="mini-spinner" style="display:inline-block;margin-bottom:16px"></div>
          <div style="font-family:'Barlow Condensed',sans-serif;font-size:0.9rem;letter-spacing:2px;color:var(--muted);text-transform:uppercase">Clanker is running the numbers…</div>
        </div>`;
      }
    }
  } else {
    if (viewDate === '2026-03-31') {
      picksArea.innerHTML = `<div class="pred-no-games">Game predictions started on Apr 1</div>`;
    } else {
      picksArea.innerHTML = `<div class="pred-no-games">No picks recorded for ${_predFmtDate(viewDate)}</div>`;
    }
  }

  // ── Step 4: Grade picks quietly in background ─────────────────
  // Only re-render picks area if grading changes something
  _predGradePicks(viewDate).catch(() => {});

  // Scan last 30 days for all-time record + load ledger in parallel
  const recordPromises = [];
  for (let i = 0; i <= 30; i++) {
    const d = new Date(); d.setDate(d.getDate() - i);
    recordPromises.push(_storageGet(_predKey(localDateStr(d))));
  }
  // Also grade today's bets and load ledger
  _gradeBetsForDate(viewDate).catch(() => {});
  const ledgerPromise = _getAlltimeLedger();

  Promise.all([Promise.all(recordPromises), ledgerPromise]).then(async ([recordResults, ledger]) => {
    let totalW = 0, totalL = 0, totalUpsetW = 0, totalUpsetL = 0;
    const historyItems = [];

    recordResults.forEach((r, i) => {
      if (!r) return;
      try {
        const d = JSON.parse(r.value);
        const picks = d.picks || [];
        picks.forEach(p => {
          if (p.result === 'correct') { totalW++; if (p.isUpset) totalUpsetW++; }
          if (p.result === 'wrong')   { totalL++; if (p.isUpset) totalUpsetL++; }
        });
        if (i >= 1 && i <= 14) {
          const graded = picks.filter(p => p.result);
          if (graded.length) {
            const dd = new Date(); dd.setDate(dd.getDate() - i);
            const ddStr = localDateStr(dd);
            historyItems.push({
              date: ddStr,
              w: graded.filter(p => p.result === 'correct').length,
              total: graded.length,
              picks,
            });
          }
        }
      } catch(e) {}
    });

    // Update record badge
    const totalGames = totalW + totalL;
    const pct = totalGames > 0 ? ((totalW / totalGames) * 100).toFixed(1) : '';
    const wEl = document.getElementById('pred-rec-w');
    const lEl = document.getElementById('pred-rec-l');
    const pEl = document.getElementById('pred-rec-pct');
    if (wEl) wEl.textContent = totalW;
    if (lEl) lEl.textContent = totalL;
    if (pEl) pEl.textContent = totalGames > 0 ? pct + '%' : '';

    // Update ledger badge
    const ledgerBadge = document.getElementById('pred-ledger-badge');
    const ledgerTotalEl = document.getElementById('pred-ledger-total');
    if (ledgerBadge && ledgerTotalEl && (ledger.totalBets > 0)) {
      ledgerBadge.style.display = '';
      const lv = ledger.total;
      const lvCls = lv > 0 ? 'up' : lv < 0 ? 'down' : 'even';
      ledgerTotalEl.className = 'pred-ledger-val ' + lvCls;
      ledgerTotalEl.textContent = (lv >= 0 ? '+' : '') + '$' + Math.abs(lv).toFixed(2);
      // Add bet count sub-label
      let subEl = ledgerBadge.querySelector('.pred-ledger-sub');
      if (!subEl) {
        subEl = document.createElement('div');
        subEl.className = 'pred-ledger-sub';
        subEl.style.cssText = 'font-family:Barlow Condensed,sans-serif;font-size:0.72rem;color:var(--muted);letter-spacing:1px;margin-top:1px';
        ledgerBadge.querySelector('div').appendChild(subEl);
      }
      subEl.textContent = ledger.totalBets + ' bet' + (ledger.totalBets !== 1 ? 's' : '') + ' placed';
    }

    // Upset badge
    const badge = document.getElementById('pred-record-badge');
    if (badge && (totalUpsetW > 0 || totalUpsetL > 0)) {
      const existing = badge.querySelector('#pred-upset-badge');
      if (!existing) {
        const div = document.createElement('div');
        div.id = 'pred-upset-badge';
        div.style.cssText = 'border-left:1px solid var(--border);padding-left:14px;margin-left:6px';
        div.innerHTML = `<div style="color:var(--muted);font-size:0.7rem;letter-spacing:2px;text-transform:uppercase;margin-bottom:2px">Upset Picks</div>
          <div style="font-family:'Barlow Condensed',sans-serif;font-size:0.95rem">
            <span style="color:var(--green)">${totalUpsetW}W</span>
            <span style="color:var(--muted)"> / </span>
            <span style="color:var(--red)">${totalUpsetL}L</span>
          </div>`;
        badge.appendChild(div);
      }
    }

    // Render history
    const histArea = document.getElementById('pred-history-area');
    if (histArea && historyItems.length > 0) {
      let hHtml = `<div class="pred-history-section">
        <div class="section-header" style="margin-top:32px;margin-bottom:14px">
          <div class="section-title" style="font-size:1.3rem">Pick History</div>
          <div class="section-sub">Past results · click a day to review</div>
        </div>`;
      // Load daily bet ledgers for all history items
      const dayLedgerPromises = historyItems.map(item => _getDayLedger(item.date));
      const dayLedgers = await Promise.all(dayLedgerPromises).catch(() => historyItems.map(() => null));

      historyItems.forEach((item, idx) => {
        const p = ((item.w / item.total) * 100).toFixed(0);
        const cls = item.w/item.total >= 0.6 ? 'good' : item.w/item.total >= 0.4 ? 'mid' : 'bad';
        const upsets = item.picks.filter(p => p.isUpset && p.result === 'correct').length;
        const dayLedger = dayLedgers[idx];
        let moneyHtml = '';
        if (dayLedger && dayLedger.bets > 0) {
          const net = dayLedger.net;
          const mCls = net > 0 ? 'up' : net < 0 ? 'down' : 'even';
          const mStr = (net >= 0 ? '+' : '') + '$' + Math.abs(net).toFixed(2);
          moneyHtml = `<span class="pred-history-money ${mCls}">${mStr}</span>`;
        }
        hHtml += `<div class="pred-history-row" onclick="_predJumpToDate('${item.date}')">
          <span class="pred-history-date">${_predFmtDate(item.date)}</span>
          <span class="pred-history-rec ${cls}">${item.w}–${item.total - item.w} (${p}%)</span>
          <span class="pred-history-games">${item.total} game${item.total>1?'s':''}${upsets>0?` · ${upsets} upset pick${upsets>1?'s':''} hit`:''}</span>
          ${moneyHtml}
        </div>`;
      });
      hHtml += `</div>`;
      histArea.innerHTML = hHtml;
    }

    // Render P&L chart after history
    renderPnlChart().catch(() => {});
  }).catch(() => {});
}

function _predFmtDate(dateStr) {
  const d = new Date(dateStr + 'T12:00:00');
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

// Returns true if any of today's picked games have already started or finished
function _predPicksLocked(picks, todayGames) {
  const now = new Date();
  // Lock if any game is live or final
  if (todayGames && todayGames.some(g => g.isLive || g.isFinal)) return true;
  // Lock if current time is past the earliest tip time in the picks
  // tipTime is like "7:00 PM" · parse it relative to today
  for (const pick of picks) {
    if (!pick.tipTime) continue;
    const match = pick.tipTime.match(/(\d{1,2}):(\d{2})\s*(AM|PM)/i);
    if (!match) continue;
    let h = parseInt(match[1]), m = parseInt(match[2]);
    const ampm = match[3].toUpperCase();
    if (ampm === 'PM' && h !== 12) h += 12;
    if (ampm === 'AM' && h === 12) h = 0;
    const tip = new Date(now);
    tip.setHours(h, m, 0, 0);
    if (now >= tip) return true;
  }
  return false;
}

// Ensure today's picks exist · called on page load and when tab opens.
// Generates silently in the background; re-renders predictions tab if visible.
async function _predEnsureTodaysPicks() {
  if (_predState.generating) return;
  const activeDate = _predActiveDate();
  const existing = await _storageGet(_predKey(activeDate));
  if (existing) return;

  // Fetch games for the active date
  const fetched = await espnFetchDate(activeDate);
  const upcoming = (fetched || []).filter(g => !g.isFinal && !g.isLive);
  if (!upcoming.length) return; // no games or all finished

  // Generate picks
  _predState.generating = true;
  try {
    const picks = await _predGeneratePicks(upcoming);
    const saveData = { date: activeDate, picks, generatedAt: new Date().toISOString() };
    await _storageSet(_predKey(activeDate), JSON.stringify(saveData));
  } catch(e) {
    console.error('Auto-generate picks error:', e);
  }
  _predState.generating = false;

  _predActiveDateCache = null;  // reset so next render recalculates active date
  // Re-render if predictions tab is open
  if (document.getElementById('panel-predictions')?.classList.contains('active')) {
    renderPredictions();
  }
}

async function _predGenerateToday() {
  if (_predState.generating) return;
  _predState.generating = true;

  try {
    const activeDate = _predActiveDate();
    const fetched = await espnFetchDate(activeDate);
    const upcoming = (fetched || []).filter(g => !g.isFinal && !g.isLive);
    if (upcoming.length) {
      const picks = await _predGeneratePicks(upcoming);
      const saveData = { date: activeDate, picks, generatedAt: new Date().toISOString() };
      await _storageSet(_predKey(activeDate), JSON.stringify(saveData));
    }
  } catch(e) {
    console.error('Prediction error:', e);
    const pa = document.getElementById('pred-picks-area');
    if (pa) pa.innerHTML = `<div class="pred-no-games" style="color:var(--red)">
      Error generating picks: ${e.message || 'Unknown error'}
      <br><br><button class="pred-generate-btn" onclick="_predRegenerate()">Try Again</button>
    </div>`;
    _predState.generating = false;
    return;
  }
  _predState.generating = false;
  renderPredictions();
}

async function _predRegenerate() {
  const activeDate = _predActiveDate();
  await _storageDelete(_predKey(activeDate));
  _predState.generateTriggered = false;
  _predState.lastTriggerDate = null;
  _predGenerateToday();
}

function _predNavigate(dir) {
  const EARLIEST_DATE = '2026-03-29';
  const current = new Date(_predViewingDate() + 'T12:00:00');
  current.setDate(current.getDate() + dir);
  const activeDate = _predActiveDate();
  const newDate = localDateStr(current);
  // Don't navigate forward past the active betting date
  if (newDate > activeDate) return;
  // Don't navigate back before March 29
  if (newDate < EARLIEST_DATE) return;
  _predState.viewingDate = newDate === activeDate ? null : newDate;
  renderPredictions();
}

function _predJumpToDate(dateStr) {
  const activeDate = _predActiveDate();
  _predState.viewingDate = dateStr === activeDate ? null : dateStr;
  renderPredictions();
}

// Auto-grade picks when poll detects new final games
async function _predAutoGrade() {
  const activeDate = _predActiveDate();
  await _predGradePicks(activeDate);
  await _gradeBetsForDate(activeDate);
  // If predictions tab is visible, re-render
  if (document.getElementById('panel-predictions')?.classList.contains('active')) {
    renderPredictions();
  }
}
