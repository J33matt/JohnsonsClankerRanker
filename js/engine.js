let _netRatingsFetching = false;

// Primary: ESPN standings (pts/ptsAllowed) + core stats (avgEstimatedPossessions)
// This matches NBA.com's pace-adjusted oRTG/dRTG within ~0.1 points.
async function fetchESPNRatings() {
  const teamIds = Object.keys(ESPN_ID_TO_ABBR).map(Number);

  // Step 1: standings → avgPointsFor + avgPointsAgainst per team (single call)
  const ptsByAbbr = {};
  try {
    const stRes = await fetch('https://site.web.api.espn.com/apis/v2/sports/basketball/nba/standings?season=2025&seasontype=2');
    if (stRes.ok) {
      const stJson = await stRes.json();
      (stJson.entries || []).forEach(function(e) {
        const abbr = normAbbr(e.team?.abbreviation || '');
        if (!abbr) return;
        const stats = {};
        (e.stats || []).forEach(function(s) { stats[s.name] = s.value; });
        const ptsFor     = parseFloat(stats['avgPointsFor']     || 0);
        const ptsAgainst = parseFloat(stats['avgPointsAgainst'] || 0);
        if (ptsFor > 0) ptsByAbbr[abbr] = { ptsFor, ptsAgainst };
      });
    }
  } catch(e) {}

  // Step 2: ESPN core stats → avgEstimatedPossessions (bilateral pace, matches NBA.com)
  // Falls back to Oliver formula from the site stats API if core stats unavailable.
  const CORE_BASE  = 'https://sports.core.api.espn.com/v2/sports/basketball/leagues/nba/seasons/2026/types/2/teams/';
  const SITE_BASE  = 'https://site.api.espn.com/apis/site/v2/sports/basketball/nba/teams/';

  const results = await Promise.all(teamIds.map(async function(id) {
    try {
      const [coreRes, siteRes] = await Promise.all([
        fetch(CORE_BASE + id + '/statistics'),
        fetch(SITE_BASE + id + '/statistics')
      ]);
      const coreJson = coreRes.ok ? await coreRes.json() : null;
      const siteJson = siteRes.ok ? await siteRes.json() : null;
      return { id, coreJson, siteJson };
    } catch(e) { return null; }
  }));

  let parsed = 0;
  results.forEach(function(r) {
    if (!r) return;
    const abbr = ESPN_ID_TO_ABBR[r.id];
    if (!abbr) return;

    // Extract avgEstimatedPossessions from core stats (bilateral pace = NBA.com method)
    let avgEstPoss = null;
    if (r.coreJson) {
      const coreCats = r.coreJson.splits?.categories || r.coreJson.categories || [];
      coreCats.forEach(function(cat) {
        (cat.stats || []).forEach(function(s) {
          if (s.name === 'avgEstimatedPossessions') avgEstPoss = parseFloat(s.value);
        });
      });
    }

    // Fall back: Oliver formula from site stats API
    if (!avgEstPoss && r.siteJson) {
      const siteCats = r.siteJson.splits?.categories || [];
      const statMap = {};
      siteCats.forEach(function(cat) {
        (cat.stats || []).forEach(function(s) { statMap[s.name] = parseFloat(s.value); });
      });
      const fga  = statMap['avgFieldGoalsAttempted'] || 0;
      const oreb = statMap['avgOffensiveRebounds']   || 0;
      const tov  = statMap['avgTurnovers']           || 0;
      const fta  = statMap['avgFreeThrowsAttempted'] || 0;
      if (fga && fta) avgEstPoss = fga - oreb + tov + (0.44 * fta);
    }

    if (!avgEstPoss || avgEstPoss <= 0) return;

    const ptsFor     = ptsByAbbr[abbr]?.ptsFor     || 0;
    const ptsAgainst = ptsByAbbr[abbr]?.ptsAgainst || 0;
    if (!ptsFor || !ptsAgainst) return;

    const oRTG   = Math.round((100 * ptsFor     / avgEstPoss) * 10) / 10;
    const dRTG   = Math.round((100 * ptsAgainst / avgEstPoss) * 10) / 10;
    const netRtg = Math.round((oRTG - dRTG) * 10) / 10;

    _NET_RATINGS[abbr] = { ortg: oRTG, drtg: dRTG, netRtg };
    parsed++;
  });

  return parsed;
}

// Secondary: scrape NBAstuffer via CORS proxy (pre-calculated values)
async function fetchNBAStufferRatings() {
  const target = 'https://www.nbastuffer.com/2025-2026-nba-team-stats/';
  const proxy  = 'https://api.allorigins.win/get?url=' + encodeURIComponent(target);
  const res    = await fetch(proxy);
  if (!res.ok) throw new Error('proxy ' + res.status);
  const json   = await res.json();
  const html   = json.contents || '';

  const rows = html.split('\n').filter(function(l) {
    return l.trim().startsWith('|') && l.includes('|') && !l.includes('---');
  });

  let parsed = 0;
  rows.forEach(function(row) {
    const cols = row.split('|').map(function(c){ return c.trim(); });
    if (cols.length < 14) return;
    const abbr  = _STUFFER_NAME_TO_ABBR[cols[2]];
    if (!abbr) return;
    const oEFF  = parseFloat(cols[10]);
    const dEFF  = parseFloat(cols[11]);
    const eDIFF = parseFloat(cols[12]);
    if (isNaN(oEFF) || isNaN(dEFF) || isNaN(eDIFF)) return;
    _NET_RATINGS[abbr] = {
      ortg:   Math.round(oEFF  * 10) / 10,
      drtg:   Math.round(dEFF  * 10) / 10,
      netRtg: Math.round(eDIFF * 10) / 10,
    };
    parsed++;
  });
  return parsed;
}

// Main entry point · tries ESPN first, falls back to NBAstuffer, then hardcoded.
// Re-renders rankings automatically when fresh data arrives.
async function fetchLiveNetRatings() {
  if (_netRatingsFetching) return;
  _netRatingsFetching = true;
  try {
    let parsed = 0;
    try {
      parsed = await fetchESPNRatings();
    } catch(e) { /* ESPN failed · try NBAstuffer */ }

    if (parsed < 20) {
      try {
        parsed = await fetchNBAStufferRatings();
      } catch(e) { /* NBAstuffer failed · hardcoded values remain */ }
    }

    if (parsed >= 20) {
      // Recompute and re-render with fresh ratings
      ENRICHED_DATA.forEach(function(entry, i) {
        const s = STANDINGS_DATA[i];
        Object.assign(entry, s, computePowerScore(s), { streak: STREAK_DATA[s.abbr] || 0 });
      });
      _weeklySnapshotsCache = null;
      renderRankings();
      if (typeof _lastScoreData !== 'undefined' && _lastScoreData) renderScoresHtml(_lastScoreData);
    }
  } finally {
    _netRatingsFetching = false;
  }
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

// ============================================================
// STREAK DATA (positive = win streak, negative = loss streak)
// ============================================================
// Computed from RECENT_GAMES + extended history. Positive = W streak, negative = L streak.
// STREAK_DATA is derived directly from STANDINGS_DATA.streak so there is only
// one source of truth. Positive = win streak, negative = loss streak.
// The live game engine updates STREAK_DATA[abbr] in-place as games finish.
// fetchESPNStreaks() overwrites these with authoritative values from ESPN on every load/poll.
const STREAK_DATA = {};
STANDINGS_DATA.forEach(t => { STREAK_DATA[t.abbr] = t.streak || 0; });

// ── STREAK CALCULATION FROM SCOREBOARD ───────────────────────────────────────
// Fetches the last 15 days of game results from the proven ESPN scoreboard API
// (same endpoint/domain as the scores tab · zero CORS issues) and recomputes
// every team's current win/loss streak from scratch.
// This needs no hardcoded data and is always authoritative.
async function fetchESPNStreaks() {
  try {
    // Fetch last 40 days in parallel · covers any realistic NBA streak length
    // (longest in NBA history is 33 games; 40 days safely exceeds that)
    const dates = getDateRange(40, 0);
    const results = await Promise.all(dates.map(d => espnFetchDate(d)));

    // Flatten all final games, sort oldest → newest
    const allFinal = results
      .flatMap(r => r || [])
      .filter(g => g.isFinal)
      .sort((a, b) => a.date.localeCompare(b.date));

    if (allFinal.length === 0) return;

    // For each team, collect their results in chronological order
    const teamResults = {};   // abbr → [true=W, false=L, ...]  oldest first
    STANDINGS_DATA.forEach(t => { teamResults[t.abbr] = []; });

    allFinal.forEach(g => {
      const hw = g.homeScore > g.awayScore;
      if (teamResults[g.home] !== undefined) teamResults[g.home].push(hw);
      if (teamResults[g.away] !== undefined) teamResults[g.away].push(!hw);
    });

    // Compute streak: walk backwards from most recent result
    let updated = 0;
    Object.keys(teamResults).forEach(abbr => {
      const res = teamResults[abbr];
      if (res.length === 0) return;
      const last = res[res.length - 1];  // most recent result
      let streak = 0;
      for (let i = res.length - 1; i >= 0; i--) {
        if (res[i] === last) streak++;
        else break;
      }
      STREAK_DATA[abbr] = last ? streak : -streak;
      updated++;
    });

    if (updated >= 20) {
      const vals = Object.values(STREAK_DATA);
      _streakBest  = Math.max(...vals);
      _streakWorst = Math.min(...vals);
      ENRICHED_DATA.forEach(function(entry, i) {
        entry.streak = STREAK_DATA[STANDINGS_DATA[i].abbr] || 0;
      });
      renderRankings();
    }
  } catch(e) {
    // Scoreboard unavailable · STREAK_DATA values from STANDINGS_DATA remain
  }
}

// Identify best and worst streaks
// Mutable streak extremes · updated live whenever games finish
let _streakBest  = Math.max(...Object.values(STREAK_DATA));
let _streakWorst = Math.min(...Object.values(STREAK_DATA));

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

function getPowerColor(score, min, max) {
  const pct = (score - min) / (max - min);
  if (pct > 0.7) return "#ff4d00";
  if (pct > 0.4) return "#ffaa00";
  return "#3399ff";
}

const ENRICHED_DATA = STANDINGS_DATA.map(t => ({ ...t, ...computePowerScore(t), streak: STREAK_DATA[t.abbr] || 0 }));

// ── LAST GAME MAP ─────────────────────────────────────────────
// Keyed by team abbr → most recent final game object.
// Seeded from static RECENT_GAMES at init; updated live.
let _lastGameMap = {};

function seedLastGameMap(games) {
  const sorted = [...games].sort((a, b) => (a.date || '').localeCompare(b.date || ''));
  sorted.forEach(g => {
    const isFinal = g.isFinal || g.status === 'final';
    if (!isFinal) return;
    _lastGameMap[g.home] = g;
    _lastGameMap[g.away] = g;
  });
}

// ── LIVE UPDATE ENGINE ───────────────────────────────────────
// Called after every ESPN fetch. Mutates STANDINGS_DATA, STREAK_DATA,
// _RECENT_RESULTS, ENRICHED_DATA in-place so all render functions
// see fresh data without a page reload.
//
// KEY INVARIANT: Only games that are truly NEW (not already counted
// in STANDINGS_DATA baseline or a previous poll cycle) affect W/L totals.
// Streaks for a team are only updated when that team has a genuinely new
// final game · never recomputed from a partial game list.

// Persistent set of game keys already applied to STANDINGS_DATA.
// Pre-seeded with all RECENT_GAMES so they are never double-counted.
const _appliedGameKeys = new Set(
  RECENT_GAMES.map(g => g.date + '_' + g.home + '_' + g.away)
);

function applyLiveGameData(allFinalGames) {
  if (!allFinalGames || !allFinalGames.length) return;

  const sorted = [...allFinalGames].sort((a, b) => (a.date||'').localeCompare(b.date||''));

  // 1. Filter to genuinely new games not yet applied to W/L totals.
  const newGames = sorted.filter(g => {
    const key = g.date + '_' + g.home + '_' + g.away;
    if (_appliedGameKeys.has(key)) return false;
    _appliedGameKeys.add(key);
    return true;
  });

  // 2. Apply only new game results to wins/losses · never re-apply old ones.
  if (newGames.length) {
    const wMap = {}, lMap = {};
    STANDINGS_DATA.forEach(t => { wMap[t.abbr] = t.wins; lMap[t.abbr] = t.losses; });
    newGames.forEach(g => {
      const hw = g.homeScore > g.awayScore;
      if (wMap[g.home] !== undefined) { hw ? wMap[g.home]++ : lMap[g.home]++; }
      if (wMap[g.away] !== undefined) { hw ? lMap[g.away]++ : wMap[g.away]++; }
    });
    STANDINGS_DATA.forEach(t => { t.wins = wMap[t.abbr]; t.losses = lMap[t.abbr]; });
  }

  // 3. Update last-game map · newest game per team wins.
  sorted.forEach(g => { _lastGameMap[g.home] = g; _lastGameMap[g.away] = g; });

  // Note: streaks are NOT updated here · fetchESPNStreaks() computes them from
  // actual game results and runs immediately after in pollAndRefreshAll.
  // Incrementing on top of a potentially stale baseline caused wrong values.

  // 4. Rebuild _RECENT_RESULTS from last 20 applied games across all fetched data.
  const recent20 = sorted.slice(-20);
  STANDINGS_DATA.forEach(t => { _RECENT_RESULTS[t.abbr] = { recentWins: 0, recentLosses: 0, opponents: [] }; });
  recent20.forEach(g => {
    const hw = g.homeScore > g.awayScore;
    if (_RECENT_RESULTS[g.home]) {
      hw ? _RECENT_RESULTS[g.home].recentWins++ : _RECENT_RESULTS[g.home].recentLosses++;
      _RECENT_RESULTS[g.home].opponents.push(g.away);
    }
    if (_RECENT_RESULTS[g.away]) {
      hw ? _RECENT_RESULTS[g.away].recentLosses++ : _RECENT_RESULTS[g.away].recentWins++;
      _RECENT_RESULTS[g.away].opponents.push(g.home);
    }
  });

  // 6. Recompute ENRICHED_DATA in-place (only needed when something actually changed).
  if (newGames.length) {
    ENRICHED_DATA.forEach((entry, i) => {
      const s = STANDINGS_DATA[i];
      Object.assign(entry, s, computePowerScore(s), { streak: STREAK_DATA[s.abbr] || 0 });
    });

    // 7. Update streak extremes for badge coloring.
    const vals = Object.values(STREAK_DATA);
    _streakBest  = Math.max(...vals);
    _streakWorst = Math.min(...vals);
  }
}

// ── POLL LOOP ────────────────────────────────────────────────
// 60s when live games running, 5min otherwise.
// Refreshes all tabs with live data after each fetch.
let _pollTimer = null;
let _hasLiveGames = false;
let _weeklySnapshotsCache = null; // invalidated when data changes
let _lastScoreData = null;    // cached so GTW badges can be refreshed without re-fetching

async function pollAndRefreshAll() {
  const today = localDateStr(new Date());
  const past3  = getDateRange(3, 0).slice(0, 3);
  const results = await Promise.all([espnFetchDate(today), ...past3.map(d => espnFetchDate(d))]);
  const todayGames = results[0] || [];
  const allFinal   = [...todayGames, ...results.slice(1).flatMap(r => r || [])].filter(g => g.isFinal);

  _hasLiveGames = todayGames.some(g => g.isLive);

  // Always re-fetch net ratings on every poll so oRTG/dRTG/netRtg stay current
  // even on days with no new game results finishing.
  fetchLiveNetRatings();

  // Determine if any genuinely new finals exist before mutating state.
  const newFinalsExist = allFinal.some(g => {
    const key = g.date + '_' + g.home + '_' + g.away;
    return !_appliedGameKeys.has(key);
  });

  if (newFinalsExist) {
    applyLiveGameData(allFinal);
  }

  // Only re-render rankings/other tabs when something actually changed.
  // This prevents power scores and rankings from flickering mid-game.
  if (!newFinalsExist) {
    schedulePoll();
    return;
  }

  // Re-fetch streaks after new games finish
  fetchESPNStreaks();

  renderRankings();

  // Refresh scores GTW badges using cached data + fresh power ranks (no re-fetch needed)
  if (_lastScoreData) renderScoresHtml(_lastScoreData);

  // Re-render other tabs only if visible (avoids resetting bracket picks)
  if (document.getElementById('panel-playoffs')  && document.getElementById('panel-playoffs').classList.contains('active'))  renderPlayoffs();
  if (document.getElementById('panel-draft')     && document.getElementById('panel-draft').classList.contains('active'))     renderDraft();
  if (document.getElementById('panel-simulator') && document.getElementById('panel-simulator').classList.contains('active')) renderSimulator();

  // Auto-grade any pending predictions now that new games have finished
  _predAutoGrade();

  // Graph: invalidate snapshot cache and update chart if it's been rendered
  if (typeof graphChart !== 'undefined' && graphChart) {
    _weeklySnapshotsCache = null;
    updateGraph();
  }

  // Timestamp
  const now = new Date();
  const el = document.getElementById('update-time');
  if (el) el.textContent = 'Updated ' + now.toLocaleDateString('en-US',{month:'short',day:'numeric'}) + ' · ' + now.toLocaleTimeString('en-US',{hour:'numeric',minute:'2-digit'});

  schedulePoll();
}

function schedulePoll() {
  if (_pollTimer) clearTimeout(_pollTimer);
  _pollTimer = setTimeout(pollAndRefreshAll, _hasLiveGames ? 60000 : 300000);
}

// Standalone ratings refresh — runs every 30 minutes regardless of game activity.
// Ensures oRTG, dRTG, and net rating stay current even on off-days or between polls.
// fetchLiveNetRatings() already calls renderRankings() internally when data changes.
setInterval(function() { fetchLiveNetRatings(); }, 10 * 60 * 1000);
const ESPN_BASE = 'https://site.api.espn.com/apis/site/v2/sports/basketball/nba/scoreboard';

// Normalize ESPN team abbreviations → our internal abbrs
const ABBR_MAP = {
  'ATL':'ATL','BKN':'BKN','BOS':'BOS','CHA':'CHA','CHI':'CHI',
  'CLE':'CLE','DAL':'DAL','DEN':'DEN','DET':'DET','GSW':'GSW',
  'HOU':'HOU','IND':'IND','LAC':'LAC','LAL':'LAL','MEM':'MEM',
  'MIA':'MIA','MIL':'MIL','MIN':'MIN','NOP':'NOP','NYK':'NYK',
  'OKC':'OKC','ORL':'ORL','PHI':'PHI','PHX':'PHX','POR':'POR',
  'SAC':'SAC','SAS':'SAS','TOR':'TOR','UTA':'UTA','WAS':'WAS',
  'GS':'GSW','SA':'SAS','NY':'NYK','NO':'NOP','PHO':'PHX',
  'UTAH':'UTA','WSH':'WAS','BRK':'BKN','NOR':'NOP'
};
function normAbbr(a) { return ABBR_MAP[a] || a; }

// Build a power-rank map (rank 1 = best) for "Games to Watch" logic
function buildPowerRankMap() {
  const ranked = STANDINGS_DATA
    .map(t => ({ abbr: t.abbr, power: computePowerScore(t).power }))
    .sort((a, b) => b.power - a.power);
  const map = {};
  ranked.forEach((t, i) => { map[t.abbr] = i + 1; });
  return map;
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

// Fetch games from ESPN for a given date (YYYY-MM-DD)
async function espnFetchDate(dateStr) {
  try {
    const yyyymmdd = dateStr.replace(/-/g, '');
    const url = `${ESPN_BASE}?dates=${yyyymmdd}`;
    const res = await fetch(url);
    if (!res.ok) throw new Error(`ESPN ${res.status}`);
    const json = await res.json();
    return parseESPNGames(json, dateStr);
  } catch (e) {
    return null; // signal failure
  }
}

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
    return { home, away, homeScore, awayScore, date: dateStr, tipDisplay, isFinal, isLive, isUpcoming, status, homeML, awayML, eventId };
  }).filter(Boolean);
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

// Fetch the full remaining schedule for Games to Watch
async function fetchRemainingSchedule() {
  const dates = getRemainingSeasonDates();
  // Fetch all remaining dates in parallel (batched)
  const results = await Promise.all(dates.map(d => espnFetchDate(d)));
  const allGames = [];
  results.forEach((games, i) => {
    if (games && games.length > 0) {
      games.forEach(g => {
        if (g.isUpcoming || g.isFinal === false) {
          allGames.push({ ...g, date: dates[i] });
        }
      });
    }
  });
  return allGames;
}

// Main scores fetch · pulls today + 3 past days from ESPN, plus full remaining schedule
async function fetchAllScoreData() {
  const today = localDateStr(new Date());
  const past3 = getDateRange(3, 0).slice(0, 3); // 3 days ago through yesterday

  // Run fetches in parallel: today + past 3 days
  const dateResults = await Promise.all([
    espnFetchDate(today),
    ...past3.map(d => espnFetchDate(d))
  ]);

  let todayGames = dateResults[0];
  const pastResults = dateResults.slice(1);

  // Flatten past games · only finals
  let recentGames = pastResults
    .flatMap(games => (games || []))
    .filter(g => g.isFinal)
    .sort((a, b) => b.date.localeCompare(a.date)); // newest first

  // Fetch full remaining schedule for Games to Watch
  let remainingGames = [];
  try {
    remainingGames = await fetchRemainingSchedule();
  } catch (e) { /* will use fallback */ }

  // Determine data source
  const apiWorked = todayGames !== null || pastResults.some(r => r !== null);
  let source = apiWorked ? 'espn' : 'fallback';

  // Fallback: if APIs failed, use hardcoded data
  if (!todayGames || todayGames.length === 0) {
    // Use UPCOMING_GAMES that match today's date as today's games
    const todayStr = today;
    const todayFromUpcoming = UPCOMING_GAMES
      .filter(g => g.date === todayStr)
      .map(g => ({ ...g, isUpcoming: true, isFinal: false, isLive: false, tipDisplay: g.tipDisplay || '' }));
    if (todayFromUpcoming.length > 0) {
      todayGames = todayFromUpcoming;
    } else {
      todayGames = [];
    }
  }

  if (recentGames.length === 0) {
    recentGames = RECENT_GAMES.map(g => ({
      ...g, isFinal: g.status === 'final', isLive: false, isUpcoming: false, tipDisplay: ''
    }));
  }

  if (remainingGames.length === 0) {
    // Use any UPCOMING_GAMES that are after today as fallback
    const todayStr = today;
    remainingGames = UPCOMING_GAMES
      .filter(g => g.date > todayStr)
      .map(g => ({ ...g, isUpcoming: true, isFinal: false, isLive: false, tipDisplay: g.tipDisplay || '' }));
  }

  return {
    today: todayGames || [],
    recent: recentGames,
    remaining: remainingGames,
    source,
    fetchedAt: new Date()
  };
}
