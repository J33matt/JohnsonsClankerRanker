// ── Toast notifications ───────────────────────────────────────
let _sbToastTimer = null;
function _sbToast(type, title, msg) {
  // Remove existing toast
  const existing = document.getElementById('sb-toast-el');
  if (existing) existing.remove();
  if (_sbToastTimer) clearTimeout(_sbToastTimer);

  const icons = { win: '🎉', loss: '😬', push: '🤝', info: '💰' };
  const el = document.createElement('div');
  el.id = 'sb-toast-el';
  el.className = `sb-toast ${type}`;
  el.innerHTML = `<div class="sb-toast-icon">${icons[type] || '💡'}</div>
    <div class="sb-toast-body">
      <div class="sb-toast-title">${title}</div>
      <div class="sb-toast-msg">${msg}</div>
    </div>`;
  document.body.appendChild(el);
  _sbToastTimer = setTimeout(() => { el.style.opacity = '0'; el.style.transition = 'opacity 0.4s'; setTimeout(() => el.remove(), 400); }, 5000);
}

// ============================================================
// SPORTSBOOK — BLOCKED NICKNAME WORDS
// Paste your list of inappropriate words below, one per line
// inside the array. Words are matched case-insensitively and
// also as substrings (so "bad" will block "badword" too).
// ============================================================
const SB_BLOCKED_WORDS = [
  // ← paste words here, one per line, e.g.:
  // "example",
  // "badword",
];

function _sbNickIsBlocked(nick) {
  const lower = nick.toLowerCase();
  return SB_BLOCKED_WORDS.some(w => lower.includes(w.toLowerCase()));
}

// ============================================================
// BOT PLAYER — "Johnson's Clanker Ranker 🤖"
// Has its own bankroll, places daily picks, competes on the
// leaderboard. Uses power scores + odds value to pick bets.
// ============================================================
const BOT_NAME      = "Johnson's Clanker Ranker 🤖";
const BOT_KEY       = 'sb.bot.profile';
const BOT_BETS_KEY  = 'sb.bot.bets';
const BOT_RESET_VER = 10; // bump this to force a full bot reset
const BOT_LB_KEY    = 'leaderboard.ClankerRanker_BOT';
const BOT_START_BAL = 100;

let _botProfile = null;
let _botBetsCache = null; // in-memory cache so bets survive within same page load

async function _botLoad() {
  try {
    const r = await window.storage.get(BOT_KEY);
    if (r) {
      const p = JSON.parse(r.value);
      // If stored profile is from an older reset version, wipe everything and start fresh
      if ((p.resetVer || 0) < BOT_RESET_VER) {
        _botProfile = null;
        _botBetsCache = [];
        try { await window.storage.set(BOT_BETS_KEY, JSON.stringify([])); } catch(e) {}
        return;
      }
      _botProfile = p;
      return;
    }
  } catch(e) {}
  _botProfile = null;
}

async function _botSave() {
  if (!_botProfile) return;
  _botProfile.resetVer = BOT_RESET_VER; // always stamp current version
  try { await window.storage.set(BOT_KEY, JSON.stringify(_botProfile)); } catch(e) {}
  // Update leaderboard
  try {
    await window.storage.set(BOT_LB_KEY, JSON.stringify({
      v: 2,  // version — pre-auth entries lack this and are filtered from display
      nickname: BOT_NAME,
      bankroll: _botProfile.bankroll,
      w: _botProfile.w || 0,
      l: _botProfile.l || 0,
      net: _botProfile.net || 0,
      bets: (_botProfile.w || 0) + (_botProfile.l || 0),
      ts: Date.now()
    }), true);
  } catch(e) {}
}

async function _botLoadBets() {
  if (_botBetsCache !== null) return _botBetsCache;
  try {
    const r = await window.storage.get(BOT_BETS_KEY);
    _botBetsCache = r ? JSON.parse(r.value) : [];
  } catch(e) {
    _botBetsCache = [];
  }
  return _botBetsCache;
}
async function _botSaveBets(bets) {
  _botBetsCache = bets; // update cache immediately
  try {
    await window.storage.set(BOT_BETS_KEY, JSON.stringify(bets));
  } catch(e) {
    console.error('[Bot] Failed to save bets:', e);
  }
}

// ── Advanced Bot Probability Engine ─────────────────────────────────────────

// Standard normal CDF approximation (Hart 1968, max error < 7.5e-8)
function _botNormalCDF(z) {
  const t = 1 / (1 + 0.2316419 * Math.abs(z));
  const poly = t * (0.319381530 + t * (-0.356563782 + t * (1.781477937 + t * (-1.821255978 + t * 1.330274429))));
  const p = 1 - 0.398942280 * Math.exp(-0.5 * z * z) * poly;
  return z >= 0 ? p : 1 - p;
}

// Multi-signal matchup model: blends net ratings, win%, power score, and streak
// Returns { homeWinProb, awayWinProb, projMargin, projTotal }
function _botEstimateMatchup(awayAbbr, homeAbbr) {
  const awayE = ENRICHED_DATA.find(t => t.abbr === awayAbbr);
  const homeE = ENRICHED_DATA.find(t => t.abbr === homeAbbr);
  const awayN = _NET_RATINGS[awayAbbr] || { ortg: 114, drtg: 114, netRtg: 0 };
  const homeN = _NET_RATINGS[homeAbbr] || { ortg: 114, drtg: 114, netRtg: 0 };

  if (!awayE || !homeE) return { homeWinProb: 0.55, awayWinProb: 0.45, projMargin: 3, projTotal: 222 };

  // Signal 1: Net rating differential → logistic (most predictive in NBA)
  // Each point of net rating ≈ ~2.5 pts/game; +3 for home court
  const netDiff = (homeN.netRtg - awayN.netRtg) + 3.0;
  const netProb = 1 / (1 + Math.exp(-netDiff * 0.10));

  // Signal 2: Win % → Bill James Log5 formula
  const hWP = Math.max(0.10, Math.min(0.90, homeE.winPct || 0.500));
  const aWP = Math.max(0.10, Math.min(0.90, awayE.winPct || 0.500));
  const log5D = hWP + aWP - 2 * hWP * aWP;
  const log5Prob = log5D > 0 ? (hWP - hWP * aWP) / log5D : 0.5;

  // Signal 3: Composite power score
  const pwrDiff = (homeE.power - awayE.power) * 0.4 + 2.5;
  const pwrProb = 1 / (1 + Math.exp(-pwrDiff * 0.12));

  // Signal 4: Recent streak momentum (hot/cold teams, modest effect)
  const hStr = homeE.streak || 0;
  const aStr = awayE.streak || 0;
  const streakAdj = Math.max(-0.05, Math.min(0.05, (hStr - aStr) * 0.012));

  // Weighted ensemble — net rating dominates (45%), log5 strong (30%), power fills rest
  const rawProb = 0.45 * netProb + 0.30 * log5Prob + 0.25 * pwrProb + streakAdj;
  const homeWinProb = Math.max(0.22, Math.min(0.78, rawProb));

  // Projected point margin: offense vs opponent defense, +2.5 home court
  const POSS = 98;
  const awayProjPts = ((awayN.ortg + homeN.drtg) / 2) * (POSS / 100);
  const homeProjPts = ((homeN.ortg + awayN.drtg) / 2) * (POSS / 100) + 2.5;
  const projMargin = homeProjPts - awayProjPts; // positive = home wins by X

  // Projected game total: additive offense-defense adjustments around league avg
  const LG = 114;
  const awayAdjPts = ((awayN.ortg - LG) + (LG - homeN.drtg) + LG) * (POSS / 100);
  const homeAdjPts = ((homeN.ortg - LG) + (LG - awayN.drtg) + LG) * (POSS / 100);
  const projTotal = awayAdjPts + homeAdjPts;

  return { homeWinProb, awayWinProb: 1 - homeWinProb, projMargin, projTotal };
}

// Raw Kelly Criterion fraction: f* = (p·b − q) / b  where b = decimal odds net profit
// Positive = bet has positive expected value; fractional Kelly (25%) used for safety
function _botKellyFraction(prob, ml) {
  if (prob <= 0 || prob >= 1) return 0;
  const decNet = ml >= 100 ? ml / 100 : 100 / Math.abs(ml); // net profit per $1 wagered
  const kelly = (prob * (decNet + 1) - 1) / decNet;
  return Math.max(0, kelly);
}

// Analyze a single bet: returns { prob, edge, kelly, score }
// score > 0 means positive expected value; higher = stronger edge
function _botAnalyzeBet(type, mu, ml, spreadLine, total) {
  const actualML = ml || -110;
  const implied = actualML < 0 ? Math.abs(actualML) / (Math.abs(actualML) + 100) : 100 / (actualML + 100);
  const MARGIN_SD = 13; // NBA point spread std deviation
  const TOTAL_SD  = 12; // NBA game total std deviation

  let prob = 0;
  if      (type === 'ml_home')     { prob = mu.homeWinProb; }
  else if (type === 'ml_away')     { prob = mu.awayWinProb; }
  else if (type === 'spread_home') {
    // P(home wins by more than the spread number, e.g. -7 means home must win by 7+)
    const needMargin = -(spreadLine || 0);
    prob = _botNormalCDF((mu.projMargin - needMargin) / MARGIN_SD);
  }
  else if (type === 'spread_away') {
    const needMargin = -(spreadLine || 0);
    prob = 1 - _botNormalCDF((mu.projMargin - needMargin) / MARGIN_SD);
  }
  else if (type === 'ou_over')  { prob = 1 - _botNormalCDF(((total || 225) - mu.projTotal) / TOTAL_SD); }
  else if (type === 'ou_under') { prob = _botNormalCDF(((total || 225) - mu.projTotal) / TOTAL_SD); }

  const edge  = prob - implied;
  const kelly = _botKellyFraction(prob, actualML);
  // Score = Kelly × edge direction: only positive for +EV bets, negative for -EV
  const score = edge > 0 ? kelly : -Math.abs(edge);
  return { prob, edge, kelly, score };
}

async function _botMakeDailyPicks(enrichedGames) {
  if (!_botProfile) return;
  const today = localDateStr(new Date());
  if (_botProfile.lastPickDate === today && _botProfile.pickVersion === 3) return; // already picked today with current logic

  const bets = await _botLoadBets();
  // Remove any stale/invalid picks from today and refund their stakes
  const todayOpen = bets.filter(b => b.date === today && b.status === 'open');
  const keptBets = bets.filter(b => b.date !== today || b.status === 'settled');
  const refund = todayOpen.reduce((sum, b) => sum + (b.stake || 0), 0);
  if (refund > 0) {
    _botProfile.bankroll = (_botProfile.bankroll || 0) + refund;
    await _botSave();
  }
  const bankroll = _botProfile.bankroll || 0;
  if (bankroll <= 0) return;

  // Prefer upcoming games; fall back to live/final so Clanker always has picks
  const upcoming = enrichedGames.filter(g => !g.isFinal && !g.isLive);

  let gamesToPick = upcoming.length ? upcoming : enrichedGames;

  if (!gamesToPick.length) {
    // ESPN returned nothing at all — fall back to static schedule so Clanker
    // always has picks (only happens on days with no ESPN coverage)
    gamesToPick = UPCOMING_GAMES.slice(0, 10).map(g => {
      const spread = _sbSpread(g.away, g.home);
      const total  = _sbTotal(g.away, g.home);
      return {
        ...g, date: today, key: g.away + '@' + g.home,
        awayML: -110, homeML: -110,
        awaySpread: spread.awaySpread, homeSpread: spread.homeSpread, spreadLine: spread.line,
        awaySpreadML: -110, homeSpreadML: -110,
        total, overML: -110, underML: -110,
        isFinal: false, isLive: false
      };
    });
  }

  if (!gamesToPick.length) return;

  // Analyze all possible bets — compute prob + Kelly for each
  const candidates = [];
  const betTypes = ['ml_away','ml_home','spread_away','spread_home','ou_over','ou_under'];
  for (const g of gamesToPick) {
    const mu = _botEstimateMatchup(g.away, g.home); // compute matchup model once per game
    for (const type of betTypes) {
      const ml = (type === 'ml_away'     ? g.awayML
               : type === 'ml_home'     ? g.homeML
               : type === 'spread_away' ? g.awaySpreadML
               : type === 'spread_home' ? g.homeSpreadML
               : type === 'ou_over'     ? g.overML
               :                          g.underML) || -110;
      const { prob, edge, kelly, score } = _botAnalyzeBet(type, mu, ml, g.spreadLine, g.total);
      candidates.push({ g, type, ml, prob, edge, kelly, score });
    }
  }

  // Sort by score (positive EV first, then highest Kelly = highest growth rate)
  candidates.sort((a, b) => b.score - a.score);

  // Pick top 3 positive-EV bets — max 1 O/U for variety
  const picks = [];
  let ouCount = 0;
  for (const c of candidates) {
    if (picks.length >= 3) break;
    if (c.score <= 0) break; // stop at negative EV
    const isOU = c.type === 'ou_over' || c.type === 'ou_under';
    if (isOU && ouCount >= 1) continue;
    picks.push(c);
    if (isOU) ouCount++;
  }
  // Fallback: if no bets had positive EV, take best available anyway
  if (!picks.length) {
    ouCount = 0;
    for (const c of candidates) {
      if (picks.length >= 3) break;
      const isOU = c.type === 'ou_over' || c.type === 'ou_under';
      if (isOU && ouCount >= 1) continue;
      picks.push(c);
      if (isOU) ouCount++;
    }
  }
  if (!picks.length) return;

  // Kelly-based stake sizing helper — 25% fractional Kelly, min $5, max 20% bankroll
  const kellyStake = (prob, ml) => {
    const raw = _botKellyFraction(prob, ml);
    const frac = Math.min(raw * 0.25, 0.20);
    return Math.max(5, Math.min(Math.floor(bankroll * frac), bankroll));
  };

  let betPlaced = false;

  if (picks.length >= 2) {
    const legs = picks.map(p => ({
      gameKey: p.g.key, type: p.type,
      awayAbbr: p.g.away, homeAbbr: p.g.home, ml: p.ml,
      line: p.type === 'spread_home' ? p.g.spreadLine
          : p.type === 'spread_away' ? -p.g.spreadLine
          : p.type.startsWith('ou')  ? p.g.total : 0,
      label: p.type
    }));
    const validLegs = [];
    for (const leg of legs) {
      const check = _sbCorrelationBlocked(leg, validLegs);
      if (!check.blocked) validLegs.push(leg);
    }
    if (validLegs.length >= 2) {
      const combined   = validLegs.reduce((acc, l) => acc * _mlToDecimal(l.ml), 1);
      const parlayML   = _parlayOddsToML(combined);
      // Kelly-size the parlay: use product of individual probs as combined win probability
      const parlayProb = validLegs.reduce((acc, l) => {
        const pick = picks.find(p => p.g.key === l.gameKey && p.type === l.type);
        return acc * (pick ? pick.prob : 0.5);
      }, 1);
      const stake = kellyStake(parlayProb, parlayML);
      keptBets.push({
        id: Date.now() + Math.random(), date: today,
        betType: 'parlay', status: 'open',
        legs: validLegs, stake, parlayML,
        result: null, payout: null, net: null
      });
      _botProfile.bankroll -= stake;
      betPlaced = true;
    }
  }

  if (!betPlaced) {
    const p = picks[0];
    const leg = {
      gameKey: p.g.key, type: p.type,
      awayAbbr: p.g.away, homeAbbr: p.g.home, ml: p.ml,
      line: p.type === 'spread_home' ? p.g.spreadLine
          : p.type === 'spread_away' ? -p.g.spreadLine
          : p.type.startsWith('ou')  ? p.g.total : 0,
      label: p.type
    };
    const stake = kellyStake(p.prob, p.ml);
    keptBets.push({
      id: Date.now() + Math.random(), date: today,
      betType: 'single', status: 'open',
      legs: [leg], stake, ml: p.ml,
      result: null, payout: null, net: null
    });
    _botProfile.bankroll -= stake;
    betPlaced = true;
  }

  if (betPlaced) {
    _botBetsCache = null; // invalidate cache so fresh load picks up new bets
    _botProfile.lastPickDate = today;
    _botProfile.pickVersion = 3;
    await _botSaveBets(keptBets);
    await _botSave();
  }
}

async function _botSettle(enrichedGamesForToday) {
  if (!_botProfile) return;
  const bets = await _botLoadBets();
  const open = bets.filter(b => b.status === 'open');
  if (!open.length) return;

  const dates = [...new Set(open.map(b => b.date))];
  const allGames = {};
  await Promise.all(dates.map(async d => {
    try { allGames[d] = await espnFetchDate(d) || []; } catch(e) { allGames[d] = []; }
  }));

  let changed = false;
  for (const bet of open) {
    const games = allGames[bet.date] || [];
    let finalResult = null, payout = 0;

    if (bet.betType === 'single') {
      const leg = bet.legs[0];
      const game = games.find(g => g.isFinal && ((g.home === leg.homeAbbr && g.away === leg.awayAbbr)));
      if (!game) continue;
      finalResult = _sbGradeLeg(leg, game);
      if (finalResult === 'win')  payout = bet.stake + _mlPayout(leg.ml, bet.stake);
      else if (finalResult === 'push') payout = bet.stake;
    } else {
      const { result } = _sbGradeParlay(bet.legs, games);
      if (result === 'pending') continue;
      finalResult = result;
      if (finalResult === 'win')  payout = bet.stake + _mlPayout(bet.parlayML, bet.stake);
      else if (finalResult === 'push') payout = bet.stake;
    }

    bet.status = 'settled'; bet.result = finalResult; bet.payout = payout; bet.net = payout - bet.stake;
    changed = true;
    _botProfile.bankroll = Math.max(0, (_botProfile.bankroll || 0) + payout);  // stake already deducted at placement
    _botProfile.w = (_botProfile.w || 0) + (finalResult === 'win' ? 1 : 0);
    _botProfile.l = (_botProfile.l || 0) + (finalResult === 'loss' ? 1 : 0);
    _botProfile.net = (_botProfile.net || 0) + (payout - bet.stake);
  }

  if (_botProfile.bankroll <= 0) {
    const today = localDateStr(new Date());
    if (!_botProfile.brokeDate || _botProfile.brokeDate !== today) {
      _botProfile.bankroll = 25;
      _botProfile.brokeDate = today;
    }
  }

  if (changed) {
    await _botSaveBets(bets);
    await _botSave();
  }
}

const SB_KEY_PROFILE  = 'sb.profile';
const SB_KEY_BETLIST  = 'sb.bets';
const SB_KEY_PARLAY   = 'sb.parlay.slip';

// ── State ────────────────────────────────────────────────────
let _sbSlip = [];          // array of leg objects on current slip
let _sbSlipMode = 'single'; // 'single' | 'parlay'
let _sbStake = 10;
let _sbProfile = null;
let _sbGames = [];         // today's games with live odds
let _sbEnrichedGamesCache = []; // enriched games with odds + spreads + totals
let _sbHistoryFilter = 'all'; // 'all' | 'open' | 'settled'

// ── Parlay correlation rules ─────────────────────────────────
function _sbCorrelationBlocked(newLeg, existingLegs) {
  // Can't parlay ML + Spread from the SAME team in the SAME game
  for (const leg of existingLegs) {
    if (leg.gameKey !== newLeg.gameKey) continue; // different game, fine
    // Same game legs — check specific restrictions
    const newType  = newLeg.type;   // 'ml_away'|'ml_home'|'spread_away'|'spread_home'|'ou_over'|'ou_under'
    const legType  = leg.type;
    // ML + Spread of same team = blocked
    if ((newType === 'ml_away'    && legType === 'spread_away') ||
        (newType === 'spread_away'&& legType === 'ml_away')    ||
        (newType === 'ml_home'    && legType === 'spread_home') ||
        (newType === 'spread_home'&& legType === 'ml_home'))    return { blocked: true, reason: 'Cannot parlay a team\'s ML + Spread in the same game.' };
    // ML + Spread of opposite teams = also blocked
    if ((newType === 'ml_away'    && legType === 'spread_home') ||
        (newType === 'spread_home'&& legType === 'ml_away')    ||
        (newType === 'ml_home'    && legType === 'spread_away') ||
        (newType === 'spread_away'&& legType === 'ml_home'))    return { blocked: true, reason: 'Cannot parlay ML + Spread on opposite teams in the same game.' };
    // Same type (duplicate) = blocked
    if (newType === legType) return { blocked: true, reason: 'That bet is already on your slip.' };
    // Large spread favorite + over is technically allowed (just a warning) — allow it
  }
  return { blocked: false };
}

// ── American odds → parlay combined decimal odds ─────────────
function _mlToDecimal(ml) {
  if (!ml || ml === 0) return 1.909; // -110 default
  return ml > 0 ? (ml / 100) + 1 : (100 / Math.abs(ml)) + 1;
}
function _parlayOddsToML(decimalOdds) {
  // Convert combined decimal parlay odds back to American
  if (decimalOdds >= 2) return Math.round((decimalOdds - 1) * 100);
  return Math.round(-100 / (decimalOdds - 1));
}

// ── Profile management ────────────────────────────────────────
async function _sbLoadProfile() {
  try {
    const raw = await window.storage.get(SB_KEY_PROFILE);
    if (raw) { _sbProfile = JSON.parse(raw.value); return; }
  } catch(e) {
    console.error('[Sportsbook] Failed to load profile:', e);
  }
  _sbProfile = null;
}

async function _sbSaveProfile() {
  if (!_sbProfile) return;
  try {
    await window.storage.set(SB_KEY_PROFILE, JSON.stringify(_sbProfile));
  } catch(e) {
    console.error('[Sportsbook] Failed to save profile:', e);
  }
}

// One-time wipe of pre-auth leaderboard entries from shared Firestore storage.
// Runs once per deployment, gated by the lb_reset_v3 flag in the shared collection.
async function _sbMaybeResetLeaderboard() {
  try {
    const flag = await window.storage.get('lb_reset_v3', true);
    if (flag) return; // already done
    const { keys } = await window.storage.list('leaderboard.', true);
    await Promise.all(keys.map(k => window.storage.delete(k, true).catch(() => {})));
    await window.storage.set('lb_reset_v3', '1', true);
  } catch(e) {}
}

async function _sbSaveLeaderboard() {
  if (!_sbProfile) return;
  const safeNick = (_sbProfile.nickname || 'anon').replace(/[^a-zA-Z0-9_-]/g, '_').slice(0, 20);
  const userKey = 'leaderboard.' + safeNick;
  const totalBets = (_sbProfile.allTimeW || 0) + (_sbProfile.allTimeL || 0);
  const entry = {
    v: 2,  // version — pre-auth entries lack this and are filtered from display
    nickname: _sbProfile.nickname,
    bankroll: _sbProfile.bankroll,
    w: _sbProfile.allTimeW || 0,
    l: _sbProfile.allTimeL || 0,
    net: _sbProfile.allTimeNet || 0,
    bets: totalBets,
    ts: Date.now()
  };
  try { await window.storage.set(userKey, JSON.stringify(entry), true); } catch(e) {
    console.error('[Sportsbook] Leaderboard save error:', e);
  }
}

// ── Bet persistence ───────────────────────────────────────────
async function _sbLoadBets() {
  try {
    const raw = await window.storage.get(SB_KEY_BETLIST);
    return raw ? JSON.parse(raw.value) : [];
  } catch(e) { return []; }
}
async function _sbSaveBets(bets) {
  try { await window.storage.set(SB_KEY_BETLIST, JSON.stringify(bets)); } catch(e) {}
}

// ── Spread generation (deterministic from game + power scores) ─
function _sbSpread(awayAbbr, homeAbbr) {
  const awayE = ENRICHED_DATA.find(t => t.abbr === awayAbbr);
  const homeE = ENRICHED_DATA.find(t => t.abbr === homeAbbr);
  if (!awayE || !homeE) return { line: 0, awaySpread: 'pk', homeSpread: 'pk' };
  // powerDiff > 0 means home is stronger → home is favored → negative spread for home
  const powerDiff = (homeE.power - awayE.power) + 3; // +3 home court
  // line = home team's spread: negative means home is favored
  const line = -Math.round(powerDiff * 2) / 2;
  const absSL = Math.abs(line);
  const homeSpread = line <= 0 ? `-${absSL}` : `+${absSL}`;
  const awaySpread = line <= 0 ? `+${absSL}` : `-${absSL}`;
  return { line, awaySpread, homeSpread };
}

// ── Total (O/U) generation — fallback when ESPN has no line ──────
function _sbTotal(awayAbbr, homeAbbr) {
  const awayN = _NET_RATINGS[awayAbbr] || { ortg: 115, drtg: 115 };
  const homeN = _NET_RATINGS[homeAbbr] || { ortg: 115, drtg: 115 };
  // ortg/drtg are per-100-possessions; NBA game ≈ 98 possessions per team
  const awayProjPts = awayN.ortg * 0.98;
  const homeProjPts = homeN.ortg * 0.98;
  const total = Math.round((awayProjPts + homeProjPts) * 2) / 2; // round to 0.5
  return total;
}

// ── Determine bet result from final scores ─────────────────────
function _sbGradeLeg(leg, game) {
  const { homeScore, awayScore } = game;
  if (homeScore == null || awayScore == null) return null;
  const { type, line } = leg;
  if (type === 'ml_away') {
    if (awayScore > homeScore) return 'win';
    if (awayScore < homeScore) return 'loss';
    return 'push';
  }
  if (type === 'ml_home') {
    if (homeScore > awayScore) return 'win';
    if (homeScore < awayScore) return 'loss';
    return 'push';
  }
  if (type === 'spread_away') {
    // Away covers if awayScore + spread > homeScore
    const margin = awayScore + line - homeScore;
    if (margin > 0) return 'win';
    if (margin < 0) return 'loss';
    return 'push';
  }
  if (type === 'spread_home') {
    const margin = homeScore - line - awayScore;
    if (margin > 0) return 'win';
    if (margin < 0) return 'loss';
    return 'push';
  }
  if (type === 'ou_over') {
    const tot = homeScore + awayScore;
    if (tot > line) return 'win';
    if (tot < line) return 'loss';
    return 'push';
  }
  if (type === 'ou_under') {
    const tot = homeScore + awayScore;
    if (tot < line) return 'win';
    if (tot > line) return 'loss';
    return 'push';
  }
  return null;
}

function _sbGradeParlay(legs, games) {
  let anyPending = false;
  let hasPush = false;
  for (const leg of legs) {
    const game = games.find(g =>
      (g.home === leg.homeAbbr && g.away === leg.awayAbbr) ||
      (g.home === leg.awayAbbr && g.away === leg.homeAbbr)
    );
    if (!game || (!game.isFinal && !game.isLive)) { anyPending = true; continue; }
    if (!game.isFinal) { anyPending = true; continue; }
    const result = _sbGradeLeg(leg, game);
    if (result === 'loss') return { result: 'loss', settledLegs: legs.length };
    if (result === 'push') hasPush = true;
  }
  if (anyPending) return { result: 'pending' };
  return { result: hasPush ? 'push' : 'win', settledLegs: legs.length };
}

// ── Auto-settle open bets ─────────────────────────────────────
async function _sbAutoSettle() {
  const bets = await _sbLoadBets();
  if (!bets.length) return;
  const open = bets.filter(b => b.status === 'open');
  if (!open.length) return;

  // Fetch games for all unique dates with open bets
  const dates = [...new Set(open.map(b => b.date))];
  const allGames = {};
  await Promise.all(dates.map(async d => {
    try { allGames[d] = await espnFetchDate(d) || []; } catch(e) { allGames[d] = []; }
  }));

  // Use _sbProfile already in memory — don't reload from storage here
  if (!_sbProfile) return;
  let changed = false;

  for (const bet of open) {
    const games = allGames[bet.date] || [];
    let finalResult = null;
    let payout = 0;

    if (bet.betType === 'single') {
      const leg = bet.legs[0];
      const game = games.find(g =>
        (g.home === leg.homeAbbr && g.away === leg.awayAbbr) ||
        (g.home === leg.awayAbbr && g.away === leg.homeAbbr)
      );
      if (!game || !game.isFinal) continue;
      finalResult = _sbGradeLeg(leg, game);
      if (finalResult === 'win') payout = bet.stake + _mlPayout(leg.ml, bet.stake);
      else if (finalResult === 'push') payout = bet.stake;
      else payout = 0;
    } else {
      // Parlay
      const { result } = _sbGradeParlay(bet.legs, games);
      if (result === 'pending') continue;
      finalResult = result;
      if (finalResult === 'win') payout = bet.stake + _mlPayout(bet.parlayML, bet.stake);
      else if (finalResult === 'push') payout = bet.stake;
      else payout = 0;
      // Store per-leg results so circles fill in correctly
      bet.legResults = bet.legs.map(l => {
        const g = games.find(g => g.home === l.homeAbbr && g.away === l.awayAbbr);
        return (g && g.isFinal) ? _sbGradeLeg(l, g) : (finalResult === 'win' ? 'win' : 'pending');
      });
    }

    bet.status = 'settled';
    bet.result = finalResult;
    bet.payout = payout;
    bet.net = payout - bet.stake;
    changed = true;

    // Fire toast notification for this settlement
    const net = payout - bet.stake;
    const legDesc = bet.legs?.[0] ? _sbLegDesc(bet.legs[0]) : '';
    const betLabel = bet.betType === 'parlay' ? `${bet.legs.length}-Leg Parlay` : legDesc;
    if (finalResult === 'win') {
      _sbToast('win', `Bet Won! +$${Math.abs(net).toFixed(2)}`, betLabel);
    } else if (finalResult === 'loss') {
      _sbToast('loss', `Bet Lost -$${bet.stake.toFixed(2)}`, betLabel);
    } else if (finalResult === 'push') {
      _sbToast('push', 'Push — Stake Returned', betLabel);
    }

    // Update profile
    if (_sbProfile) {
      _sbProfile.bankroll = Math.max(0, (_sbProfile.bankroll || 0) + payout);  // stake already deducted at placement
      _sbProfile.allTimeW = (_sbProfile.allTimeW || 0) + (finalResult === 'win' ? 1 : 0);
      _sbProfile.allTimeL = (_sbProfile.allTimeL || 0) + (finalResult === 'loss' ? 1 : 0);
      _sbProfile.allTimeNet = (_sbProfile.allTimeNet || 0) + (payout - bet.stake);
    }
  }

  if (changed) {
    await _sbSaveBets(bets);
    if (_sbProfile) {
      // Check if broke — if bankroll is 0 and it's a new day, give $50
      if (_sbProfile.bankroll <= 0) {
        const today = localDateStr(new Date());
        if (!_sbProfile.brokeDate || _sbProfile.brokeDate !== today) {
          _sbProfile.bankroll = 25;
          _sbProfile.brokeDate = today;
          _sbProfile.brokeCount = (_sbProfile.brokeCount || 0) + 1;
        }
      }
      // Record bankroll snapshot in history
      if (!_sbProfile.history) _sbProfile.history = [];
      const snapDate = localDateStr(new Date());
      const last = _sbProfile.history[_sbProfile.history.length - 1];
      if (!last || last.date !== snapDate || Math.abs(last.balance - _sbProfile.bankroll) > 0.009) {
        _sbProfile.history.push({ date: snapDate, balance: _sbProfile.bankroll });
        if (_sbProfile.history.length > 90) _sbProfile.history = _sbProfile.history.slice(-90);
      }
      await _sbSaveProfile();
      await _sbSaveLeaderboard();
    }
  }
}

// ── Compute payout for current slip ─────────────────────────────
function _sbComputePayout() {
  if (!_sbSlip.length) return 0;
  if (_sbSlipMode === 'parlay') {
    const combined = _sbSlip.reduce((acc, l) => acc * _mlToDecimal(l.ml), 1);
    return Math.round(_sbStake * combined * 100) / 100;
  } else {
    // Single mode: total payout = sum of each individual bet's payout
    return _sbSlip.reduce((sum, leg) => {
      return sum + _sbStake + _mlPayout(leg.ml, _sbStake);
    }, 0);
  }
}

// ── Place bets ────────────────────────────────────────────────
async function _sbPlaceBet() {
  if (!_sbSlip.length || !_sbProfile) return;
  if (_sbProfile.bankroll < _sbStake) {
    alert(`Not enough funds. Your balance is $${_sbProfile.bankroll.toFixed(2)}.`);
    return;
  }

  const today = localDateStr(new Date());
  const bets = await _sbLoadBets();
  const newBets = [];

  if (_sbSlipMode === 'single') {
    for (const leg of _sbSlip) {
      if (_sbProfile.bankroll < _sbStake) break; // can't afford more
      const bet = {
        id: Date.now() + Math.random(),
        date: today,
        betType: 'single',
        status: 'open',
        legs: [leg],
        stake: _sbStake,
        ml: leg.ml,
        result: null, payout: null, net: null
      };
      bets.push(bet);
      newBets.push(bet);
      _sbProfile.bankroll -= _sbStake;
    }
  } else {
    // Parlay
    const combined = _sbSlip.reduce((acc, l) => acc * _mlToDecimal(l.ml), 1);
    const parlayML = _parlayOddsToML(combined);
    const bet = {
      id: Date.now() + Math.random(),
      date: today,
      betType: 'parlay',
      status: 'open',
      legs: [..._sbSlip],
      stake: _sbStake,
      parlayML,
      result: null, payout: null, net: null
    };
    bets.push(bet);
    newBets.push(bet);
    _sbProfile.bankroll -= _sbStake;
  }

  await _sbSaveBets(bets);
  await _sbSaveProfile();
  await _sbSaveLeaderboard();

  // Clear slip
  _sbSlip = [];

  // Re-render
  renderSportsbook();
}

// ── Leaderboard fetch ─────────────────────────────────────────
async function _sbFetchLeaderboard() {
  try {
    const { keys } = await window.storage.list('leaderboard.', true);
    const entries = [];
    await Promise.all(keys.slice(0, 50).map(async k => {
      try {
        const raw = await window.storage.get(k, true);
        if (raw) entries.push(JSON.parse(raw.value));
      } catch(e) {}
    }));
    // Only show post-auth entries (v >= 2); filter out stale (no ts in last 60 days)
    const cutoff = Date.now() - 60 * 24 * 60 * 60 * 1000;
    return entries
      .filter(e => e.v >= 2 && e.nickname && e.bankroll != null && (!e.ts || e.ts > cutoff))
      .sort((a, b) => b.bankroll - a.bankroll)
      .slice(0, 15);
  } catch(e) { return []; }
}

// ── Format leg description ────────────────────────────────────
function _sbLegDesc(leg) {
  const { type, awayAbbr, homeAbbr, line } = leg;
  if (type === 'ml_away') return `${awayAbbr} ML`;
  if (type === 'ml_home') return `${homeAbbr} ML`;
  // spread_away leg stores line = -spreadLine (away's number), spread_home stores line = spreadLine (home's number)
  if (type === 'spread_away') return `${awayAbbr} ${line >= 0 ? '+' : ''}${line}`;
  if (type === 'spread_home') return `${homeAbbr} ${line >= 0 ? '+' : ''}${line}`;
  if (type === 'ou_over') return `OVER ${line}`;
  if (type === 'ou_under') return `UNDER ${line}`;
  return leg.label || '';
}

// ── Toggle a bet button ───────────────────────────────────────
function _sbToggleLeg(gameKey, type, awayAbbr, homeAbbr, ml, line, label) {
  const leg = { gameKey, type, awayAbbr, homeAbbr, ml, line, label };
  const existIdx = _sbSlip.findIndex(l => l.gameKey === gameKey && l.type === type);

  if (existIdx !== -1) {
    // Remove this specific leg
    _sbSlip.splice(existIdx, 1);
    if (!_sbSlip.length) _sbSlipMode = 'single';
  } else {
    if (_sbSlipMode === 'parlay') {
      // Parlay mode: check correlation rules
      const check = _sbCorrelationBlocked(leg, _sbSlip);
      if (check.blocked) {
        const warn = document.getElementById('sb-slip-warning');
        if (warn) { warn.textContent = check.reason; warn.style.display = 'block'; setTimeout(() => { if(warn) warn.style.display='none'; }, 3500); }
        return;
      }
      _sbSlip.push(leg);
    } else {
      // Single mode: allow multiple legs, each placed as a separate bet
      // But only one pick per game+side combination (no same type twice)
      // Remove any conflicting same-game/same-type leg first (shouldn't happen, but safety)
      _sbSlip = _sbSlip.filter(l => !(l.gameKey === gameKey && l.type === type));
      _sbSlip.push(leg);
    }
  }
  _renderSbSlip();
  _renderSbGameButtons();
}

// ── Render slip ───────────────────────────────────────────────
function _renderSbSlip() {
  const el = document.getElementById('sb-slip-body');
  if (!el) return;
  const warn = document.getElementById('sb-slip-warning');
  if (warn) warn.style.display = 'none';

  const count = document.getElementById('sb-slip-count');
  if (count) count.textContent = _sbSlip.length;

  if (!_sbSlip.length) {
    el.innerHTML = `<div class="sb-slip-empty">📋 Add bets to your slip</div>`;
    const prow = document.getElementById('sb-payout-row');
    if (prow) prow.style.display = 'none';
    const pbtn = document.getElementById('sb-place-btn');
    if (pbtn) pbtn.disabled = true;
    return;
  }

  let html = '';
  // Type toggle (only show if 2+ legs)
  if (_sbSlip.length >= 2) {
    html += `<div class="sb-slip-type-toggle">
      <button class="sb-slip-type-btn ${_sbSlipMode==='single'?'active':''}" onclick="_sbSetMode('single')">Singles</button>
      <button class="sb-slip-type-btn ${_sbSlipMode==='parlay'?'active':''}" onclick="_sbSetMode('parlay')">Parlay</button>
    </div>`;
  }

  html += _sbSlip.map(leg => `
    <div class="sb-slip-leg">
      <div class="sb-slip-leg-icon">${leg.type.startsWith('ml') ? '🏆' : leg.type.startsWith('spread') ? '📏' : '🎯'}</div>
      <div class="sb-slip-leg-info">
        <div class="sb-slip-leg-pick">${_sbLegDesc(leg)}</div>
        <div class="sb-slip-leg-game">${leg.awayAbbr} @ ${leg.homeAbbr}</div>
      </div>
      <div class="sb-slip-leg-odds ${leg.ml < 0 ? 'fav' : 'dog'}" style="color:${leg.ml < 0 ? 'var(--green)' : 'var(--accent2)'}">${_fmtML(leg.ml)}</div>
      <button class="sb-slip-leg-remove" onclick="_sbRemoveLeg('${leg.gameKey}','${leg.type}')">✕</button>
    </div>
  `).join('');

  // Parlay summary
  if (_sbSlipMode === 'parlay' && _sbSlip.length >= 2) {
    const combined = _sbSlip.reduce((acc, l) => acc * _mlToDecimal(l.ml), 1);
    const parlayML = _parlayOddsToML(combined);
    html += `<div style="padding:10px 14px;background:rgba(255,255,255,0.03);border-top:1px solid var(--border);font-family:'Barlow Condensed',sans-serif;font-size:0.78rem;letter-spacing:1px;color:var(--muted)">
      ${_sbSlip.length}-Leg Parlay · Combined odds <span style="color:var(--accent2);font-weight:700">${_fmtML(parlayML)}</span>
    </div>`;
  }

  el.innerHTML = html;

  // Stake + payout
  const prow = document.getElementById('sb-payout-row');
  if (prow) {
    prow.style.display = 'flex';
    const pval = document.getElementById('sb-payout-val');
    if (pval) {
      if (_sbSlipMode === 'parlay') {
        const payout = _sbComputePayout();
        const profit = payout - _sbStake;
        pval.textContent = `+$${profit.toFixed(2)} profit · $${payout.toFixed(2)} return`;
      } else if (_sbSlip.length > 1) {
        const totalPayout = _sbComputePayout();
        const totalStake  = _sbStake * _sbSlip.length;
        const totalProfit = totalPayout - totalStake;
        pval.textContent = `+$${totalProfit.toFixed(2)} combined profit · $${totalStake.toFixed(2)} staked`;
      } else {
        const payout = _sbComputePayout();
        const profit = payout - _sbStake;
        pval.textContent = `+$${profit.toFixed(2)} profit · $${payout.toFixed(2)} return`;
      }
    }
  }
  const pbtn = document.getElementById('sb-place-btn');
  if (pbtn) {
    const totalStake = _sbSlipMode === 'single' ? _sbStake * _sbSlip.length : _sbStake;
    const balance = _sbProfile?.bankroll || 0;
    pbtn.disabled = !_sbProfile || _sbStake <= 0 || totalStake > balance;
    if (_sbSlipMode === 'parlay') {
      pbtn.textContent = `Place ${_sbSlip.length}-Leg Parlay · $${_sbStake.toFixed(2)}`;
    } else if (_sbSlip.length > 1) {
      pbtn.textContent = `Place ${_sbSlip.length} Singles · $${totalStake.toFixed(2)} total`;
    } else {
      pbtn.textContent = `Place Bet · $${_sbStake.toFixed(2)}`;
    }
  }
}

function _sbRemoveLeg(gameKey, type) {
  _sbSlip = _sbSlip.filter(l => !(l.gameKey === gameKey && l.type === type));
  if (!_sbSlip.length) _sbSlipMode = 'single';
  _renderSbSlip();
  _renderSbGameButtons();
}

function _sbSetMode(mode) {
  if (mode === 'parlay' && _sbSlipMode === 'single') {
    // Check all existing legs against each other for parlay violations
    // Keep removing conflicting legs until the parlay is valid
    const validLegs = [];
    for (const leg of _sbSlip) {
      const check = _sbCorrelationBlocked(leg, validLegs);
      if (!check.blocked) validLegs.push(leg);
    }
    _sbSlip = validLegs;
  }
  _sbSlipMode = mode;
  _renderSbSlip();
  _renderSbGameButtons();
}

function _renderSbGameButtons() {
  // Re-render bet button states without full re-render
  document.querySelectorAll('.sb-bet-btn').forEach(btn => {
    const gk   = btn.dataset.gk;
    const type = btn.dataset.type;
    const isSelected = _sbSlip.some(l => l.gameKey === gk && l.type === type);
    const isInParlay = _sbSlipMode === 'parlay' && _sbSlip.some(l => l.gameKey === gk && l.type !== type);
    btn.classList.toggle('selected', isSelected);
    btn.classList.toggle('in-parlay', !isSelected && isInParlay);
  });
}

// ── Main render ───────────────────────────────────────────────
// Sportsbook active date — stays on yesterday until all its games are final,
// so bets settle correctly and the page doesn't jump to "tomorrow" at midnight.
let _sbActiveDateCache = null;
let _sbLiveRefreshTimer = null;

// Lightweight refresh: settle open bets and update the bets panel without full re-render
async function _sbRefreshBets() {
  if (!_sbProfile) return;
  const prevBankroll = _sbProfile.bankroll;
  await _sbAutoSettle();
  const bets = await _sbLoadBets();
  const panel = document.getElementById('sb-mybets-panel');
  if (!panel) return;
  const openBets = bets.filter(b => b.status === 'open');
  panel.innerHTML = (openBets.length ? _renderSbOpenBets(openBets) : '') + _renderSbHistory(bets);
  // Update balance display if it changed
  if (_sbProfile && _sbProfile.bankroll !== prevBankroll) {
    const balEl = document.querySelector('.sb-bankroll-val');
    if (balEl) balEl.textContent = '$' + (_sbProfile.bankroll || 0).toFixed(2);
    const openEl = document.querySelector('.sb-stat-pill b:last-of-type');
    if (openEl) openEl.textContent = openBets.length;
  }
}
async function _sbGetActiveDate() {
  if (_sbActiveDateCache) return _sbActiveDateCache;
  const todayStr = localDateStr(new Date());
  const yesterday = new Date(); yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayStr = localDateStr(yesterday);
  try {
    const games = await espnFetchDate(yesterdayStr).catch(() => null);
    if (games && games.length > 0 && games.some(g => !g.isFinal)) {
      _sbActiveDateCache = yesterdayStr;
      return yesterdayStr;
    }
  } catch(e) {}
  _sbActiveDateCache = todayStr;
  return todayStr;
}

// Convert moneyline to implied true probability (vig removed).
// Falls back to power-score model when real odds aren't available.
function _sbWinPct(awayML, homeML, awayAbbr, homeAbbr) {
  if (awayML && homeML && awayML !== -110 && homeML !== -110) {
    const toRaw = ml => ml > 0 ? 100 / (ml + 100) : Math.abs(ml) / (Math.abs(ml) + 100);
    const awayRaw = toRaw(awayML), homeRaw = toRaw(homeML);
    const total = awayRaw + homeRaw;
    return {
      awayPct: Math.round((awayRaw / total) * 100),
      homePct: Math.round((homeRaw / total) * 100)
    };
  }
  return gameWinProb(awayAbbr, homeAbbr);
}

// Fetch ESPN matchup predictor win % for a list of games (keyed by away@home)
async function _fetchPredictorWinPcts(games) {
  const result = {};
  await Promise.all(games.map(async g => {
    if (!g.eventId) return;
    try {
      const url = `https://sports.core.api.espn.com/v2/sports/basketball/leagues/nba/events/${g.eventId}/competitions/${g.eventId}/predictor`;
      const res = await fetch(url);
      if (!res.ok) return;
      const json = await res.json();
      const stats = json.awayTeam?.statistics || [];
      const proj = stats.find(s => s.name === 'gameProjection');
      if (proj && proj.value != null) {
        const awayPct = Math.round(proj.value);
        result[g.away + '@' + g.home] = { awayPct, homePct: 100 - awayPct };
      }
    } catch(e) {}
  }));
  return result;
}

async function renderSportsbook() {
  const container = document.getElementById('sb-container');
  if (!container) return;
  container.innerHTML = `<div class="loading-spinner"><div class="spinner"></div>Loading Sportsbook…</div>`;

  try {

  // Sign-in required for sportsbook — prompts Google auth + username picker on first visit
  await window._jcrAuth.ensureAuth();

  // Reset the Firestore load state after sign-in.
  // _sbAutoSettle() at page-load runs _load() in "offline" mode (no auth yet),
  // setting _loaded=true with an empty cache. Clear it so we actually fetch from Firestore.
  window._jcrAuth.resetLoad();

  // One-time leaderboard wipe: clear pre-auth entries from shared storage
  await _sbMaybeResetLeaderboard();

  // Only load from storage if we don't already have a profile in memory
  if (!_sbProfile) {
    await _sbLoadProfile();
  }

  // Run auto-settle (only meaningful if there's a profile)
  if (_sbProfile) {
    await _sbAutoSettle();
    _sbActiveDateCache = null;  // recalculate active date after settling
  }

  // Auto-create sportsbook profile using Firebase username (no onboarding prompt)
  if (!_sbProfile) {
    const autoNick = (window._jcrAuth.getDisplayName() || 'Player').replace(/[^a-zA-Z0-9_ ]/g, '').trim().slice(0, 20) || 'Player';
    const today = localDateStr(new Date());
    _sbProfile = {
      nickname: autoNick,
      bankroll: 100,
      startBalance: 100,
      startDate: today,
      allTimeW: 0, allTimeL: 0, allTimeNet: 0,
      brokeCount: 0,
      history: [{ date: today, balance: 100, label: 'Start' }]
    };
    await window.storage.set(SB_KEY_PROFILE, JSON.stringify(_sbProfile));
    await _sbSaveLeaderboard();
  }

  // Save leaderboard entry to keep it fresh for other users
  if (_sbProfile) { _sbSaveLeaderboard().catch(() => {}); }

  // Determine active date — stays on yesterday until all games are final
  const today = await _sbGetActiveDate();
  const [fetchedGames, odds, leaderboard, bets] = await Promise.all([
    espnFetchDate(today).catch(() => null),
    fetchOddsForDate(today).catch(() => ({})),
    _sbFetchLeaderboard(),
    _sbLoadBets()
  ]);

  // Merge with UPCOMING_GAMES
  let games = fetchedGames || [];
  if (!games.length) {
    games = UPCOMING_GAMES.filter(g => g.date === today).map(g => ({
      ...g, isFinal: false, isLive: false, isUpcoming: true
    }));
  }
  _sbGames = games;

  // Fetch ESPN matchup predictor win % (only for upcoming games that have an eventId)
  const predictorPcts = await _fetchPredictorWinPcts(games.filter(g => g.isUpcoming && g.eventId)).catch(() => ({}));

  // Build enriched games with spreads + totals + odds + win probability
  const enrichedGames = games.map(g => {
    const key = g.away + '@' + g.home;
    const od = odds[key] || {};
    // Use ESPN predictor if available, otherwise fall back to implied moneyline odds
    const prob = predictorPcts[key] || _sbWinPct(od.awayML, od.homeML, g.away, g.home);

    // Real spread from ESPN if available, otherwise power-score fallback
    // spreadLine = home team's spread: negative means home is favored
    let spreadLine, awaySpread, homeSpread;
    if (od.spreadLine != null && !isNaN(od.spreadLine)) {
      spreadLine = od.spreadLine; // home team's line (e.g. -7 = home -7, away +7)
      const absSL = Math.abs(spreadLine);
      homeSpread = spreadLine <= 0 ? `-${absSL}` : `+${absSL}`;
      awaySpread = spreadLine <= 0 ? `+${absSL}` : `-${absSL}`;
    } else {
      const ps = _sbSpread(g.away, g.home);
      spreadLine = ps.line;
      awaySpread = ps.awaySpread;
      homeSpread = ps.homeSpread;
    }

    // Real O/U from ESPN if available, otherwise power-score fallback
    const total = (od.total != null && !isNaN(od.total) && od.total > 150 && od.total < 280)
      ? od.total
      : _sbTotal(g.away, g.home);

    return {
      ...g, key,
      awayML: od.awayML || -110, homeML: od.homeML || -110,
      awaySpread, homeSpread, spreadLine,
      awaySpreadML: od.awaySpreadML || -110,
      homeSpreadML: od.homeSpreadML || -110,
      total,
      overML:  od.overML  || -110,
      underML: od.underML || -110,
      awayWinPct: prob.awayPct, homeWinPct: prob.homePct
    };
  });
  _sbEnrichedGamesCache = enrichedGames;

  // ── Bot player: initialize, settle, and make daily picks ─────
  await _botLoad();
  if (!_botProfile) {
    _botProfile = {
      nickname: BOT_NAME, bankroll: BOT_START_BAL,
      w: 0, l: 0, net: 0,
      lastPickDate: null,
      resetVer: BOT_RESET_VER
    };
    await _botSave();
  }
  await _botSettle(enrichedGames);
  await _botMakeDailyPicks(enrichedGames);
  // Reload after picks are placed so we always display the freshest bets
  const botBets = await _botLoadBets();

  const isBroke = (_sbProfile.bankroll || 0) <= 0;
  const openBets = bets.filter(b => b.status === 'open');
  const settledBets = bets.filter(b => b.status === 'settled');
  const totalNet = _sbProfile.allTimeNet || 0;
  const netCls = totalNet > 0 ? 'up' : totalNet < 0 ? 'dn' : '';
  const netStr = (totalNet >= 0 ? '+' : '') + '$' + Math.abs(totalNet).toFixed(2);
  const totalWagered = settledBets.reduce((s, b) => s + (b.stake || 0), 0);
  const roi = totalWagered > 0
    ? ((totalNet / totalWagered) * 100).toFixed(1)
    : '0.0';

  // Streak: count consecutive wins/losses from most recent settled bets
  const recentSettled = bets.filter(b => b.status === 'settled').slice(-10).reverse();
  let streakCount = 0, streakType = '';
  for (const b of recentSettled) {
    if (streakCount === 0) { streakType = b.result; streakCount = 1; }
    else if (b.result === streakType) streakCount++;
    else break;
  }
  const streakLabel = streakCount >= 2
    ? (streakType === 'win' ? `🔥 ${streakCount}W streak` : streakType === 'loss' ? `🥶 ${streakCount}L streak` : '')
    : '';

  let html = `
  <div class="sb-header">
    <div class="sb-bankroll-card">
      <div class="sb-bankroll-label">💰 Your Balance${streakLabel ? ` <span style="font-size:0.75rem;margin-left:8px">${streakLabel}</span>` : ''}</div>
      <div class="sb-bankroll-val" style="${streakCount >= 3 && streakType === 'win' ? 'color:var(--green)' : streakCount >= 3 && streakType === 'loss' ? 'color:var(--red)' : ''}">$${(_sbProfile.bankroll || 0).toFixed(2)}</div>
      <div class="sb-bankroll-sub">Started $${_sbProfile.startBalance || 100} · ${_sbProfile.startDate || '—'} · $${totalWagered.toFixed(0)} wagered total</div>
    </div>
    <div class="sb-stats-row">
      <div class="sb-stat-pill"><b>${_sbProfile.allTimeW || 0}</b>Wins</div>
      <div class="sb-stat-pill"><b>${_sbProfile.allTimeL || 0}</b>Losses</div>
      <div class="sb-stat-pill"><b class="${netCls}">${netStr}</b>All-Time Net</div>
      <div class="sb-stat-pill"><b class="${netCls}">${roi}%</b>ROI</div>
      <div class="sb-stat-pill"><b>${openBets.length}</b>Open Bets</div>
    </div>
    <div class="sb-nickname-wrap">
      <div class="sb-nickname-display">${_sbProfile.nickname}</div>
      <div class="sb-nickname-sub">Your Handle</div>
      <div style="display:flex;gap:6px;flex-wrap:wrap;justify-content:flex-end">
        <button class="sb-edit-btn" onclick="renderSportsbook()" title="Refresh & settle bets">↻ Refresh</button>
        <button class="sb-edit-btn" onclick="_sbEditNickname()">Edit Name</button>
        <button class="sb-edit-btn" onclick="_sbSignOut()" style="border-color:rgba(255,60,60,0.4);color:var(--red)" title="Sign out of sportsbook">Sign Out</button>
      </div>
    </div>
  </div>`;

  if (isBroke) {
    const brokeMsg = (_sbProfile.brokeCount || 0) > 1
      ? `You've gone broke ${_sbProfile.brokeCount} times now. Check back tomorrow for $25.`
      : 'You\'ve exhausted your starting balance. Come back tomorrow for a fresh $50 stake.';
    html += `<div class="sb-broke-banner">
      <div class="sb-broke-icon">💸</div>
      <div class="sb-broke-title">You're Broke</div>
      <div class="sb-broke-sub">${brokeMsg}</div>
      <button onclick="_sbStartFresh()" style="margin-top:14px;padding:9px 22px;border-radius:8px;border:1px solid rgba(255,51,85,0.4);background:transparent;color:var(--red);font-family:'Barlow Condensed',sans-serif;font-size:0.8rem;letter-spacing:2px;cursor:pointer;text-transform:uppercase">⟳ Start Fresh ($50)</button>
    </div>`;
  }

  // Bankroll chart (only if there's history)
  const hist = _sbProfile.history || [];
  if (hist.length >= 2) {
    html += `<div class="sb-bankroll-chart-wrap">
      <div class="sb-section-label" style="margin-bottom:12px">📈 Bankroll History</div>
      <div style="position:relative;height:140px"><canvas id="sb-bankroll-chart"></canvas></div>
    </div>`;
  }

  // Leaderboard
  html += _renderSbLeaderboard(leaderboard);

  // Main bet area
  if (!isBroke) {
    html += `<div class="sb-layout"><div class="sb-games-main">`;

    // Today's games
    html += `<div style="display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:10px;margin-bottom:16px">
      <div class="sb-section-label" style="margin-bottom:0">Today's Games <span class="sb-section-sub">${today} · Tap to add to slip</span></div>
      <div style="display:flex;gap:8px;flex-wrap:wrap">
        <button class="sb-quick-btn" onclick="_sbQuickFavParlay()" title="Build a parlay with all ML favorites">⚡ Fav Parlay</button>
        <button class="sb-quick-btn" onclick="_sbClearSlip()">🗑 Clear Slip</button>
      </div>
    </div>`;

    if (!enrichedGames.length) {
      html += `<div style="text-align:center;padding:48px 0;color:var(--muted);font-family:'Barlow Condensed',sans-serif;letter-spacing:3px;font-size:0.82rem;text-transform:uppercase">No games today</div>`;
    } else {
      html += `<div class="sb-games-grid">`;
      enrichedGames.forEach(g => { html += _renderSbGameCard(g, openBets); });
      html += `</div>`;
    }

    // Clanker's picks — shown below the games, above the bet slip
    html += _renderBotPicks(botBets, enrichedGames);

    html += `</div>`;

    // Right column: slip on top, user's bets below
    html += `<div class="sb-right-col">`;
    html += `
    <div>
      <div class="sb-slip" id="sb-slip-panel">
        <div class="sb-slip-header">
          <span class="sb-slip-title">Bet Slip <span class="sb-slip-count" id="sb-slip-count">0</span></span>
          <button class="sb-slip-clear" onclick="_sbClearSlip()">Clear</button>
        </div>
        <div id="sb-slip-body"></div>
        <div id="sb-slip-warning" class="sb-slip-warning" style="display:none"></div>
        <div style="padding:0 14px 4px">
          <div class="sb-stake-label" style="margin-bottom:6px">Stake per bet</div>
          <input class="sb-stake-input" id="sb-stake-input" type="number" min="1" max="10000" value="${_sbStake}" oninput="_sbUpdateStake(this.value)" placeholder="$ amount">
        </div>
        <div class="sb-quick-stakes">
          <button class="sb-quick-btn" onclick="_sbQuickStake(5)">$5</button>
          <button class="sb-quick-btn" onclick="_sbQuickStake(10)">$10</button>
          <button class="sb-quick-btn" onclick="_sbQuickStake(25)">$25</button>
          <button class="sb-quick-btn" onclick="_sbQuickStake(50)">$50</button>
          <button class="sb-quick-btn" onclick="_sbQuickStake(Math.floor(_sbProfile?.bankroll||0))" title="All In">All In</button>
        </div>
        <div class="sb-payout-row" id="sb-payout-row" style="display:none">
          <span class="sb-payout-label">Potential Payout</span>
          <span class="sb-payout-val" id="sb-payout-val"></span>
        </div>
        <button class="sb-place-btn" id="sb-place-btn" onclick="_sbPlaceBet()" disabled>Place Bet</button>
      </div>
    </div>`;

    // My Bets panel inside the right column — always visible
    html += `<div id="sb-mybets-panel">`;
    if (openBets.length) html += _renderSbOpenBets(openBets);
    html += _renderSbHistory(bets);
    html += `</div>`;

    html += `</div>`; // close sb-right-col
    html += `</div>`; // close sb-layout (the one opened before sb-games-main)
  }

  // Clanker's picks (shown here only for broke users; non-broke users see it inside games col above)
  if (isBroke) {
    html += _renderBotPicks(botBets, enrichedGames);
  }

  container.innerHTML = html;

  // Render bankroll history chart if canvas exists
  const chartCanvas = document.getElementById('sb-bankroll-chart');
  if (chartCanvas && hist.length >= 2) {
    _sbRenderBankrollChart(chartCanvas, hist);
  }

  // Initialize slip
  _renderSbSlip();
  _renderSbGameButtons();

  // Live refresh: settle + update bets panel every 2 minutes
  if (_sbLiveRefreshTimer) clearInterval(_sbLiveRefreshTimer);
  _sbLiveRefreshTimer = setInterval(() => { _sbRefreshBets().catch(() => {}); }, 2 * 60 * 1000);

  } catch(e) {
    // Surface any error instead of leaving the spinner up forever
    console.error('renderSportsbook error:', e);
    if (container) container.innerHTML = `<div style="padding:48px;text-align:center;font-family:'Barlow Condensed',sans-serif;color:var(--red);letter-spacing:2px">
      ⚠ Failed to load sportsbook<br><span style="font-size:0.78rem;color:var(--muted);margin-top:8px;display:block">${e.message || String(e)}</span>
      <button onclick="renderSportsbook()" style="margin-top:18px;padding:9px 22px;border-radius:8px;border:1px solid rgba(255,60,60,0.4);background:transparent;color:var(--red);font-family:'Barlow Condensed',sans-serif;font-size:0.8rem;letter-spacing:2px;cursor:pointer">↻ Try Again</button>
    </div>`;
  }
}

function _renderSbGameCard(g, openBets) {
  const awayColors = TEAM_COLORS[g.away] || { bg: 'var(--muted)', text: '#fff' };
  const homeColors = TEAM_COLORS[g.home] || { bg: 'var(--muted)', text: '#fff' };
  const awayRec = STANDINGS_DATA.find(t => t.abbr === g.away);
  const homeRec = STANDINGS_DATA.find(t => t.abbr === g.home);
  const awayRecStr = awayRec ? `${awayRec.wins}\u2013${awayRec.losses}` : '';
  const homeRecStr = homeRec ? `${homeRec.wins}\u2013${homeRec.losses}` : '';
  const awayLogo = getLogoUrl(g.away);
  const homeLogo = getLogoUrl(g.home);

  const isLocked    = g.isLive || g.isFinal;
  const statusLabel = g.isLive ? (g.status || 'LIVE') : g.isFinal ? 'Final' : (g.tipDisplay || 'Upcoming');
  const statusCls   = g.isLive ? 'sb-game-status-live' : g.isFinal ? 'sb-game-status-final' : 'sb-game-status-upcoming';

  const gameBets = openBets.filter(b => b.legs.some(l => l.homeAbbr === g.home && l.awayAbbr === g.away));
  const betBadge = gameBets.length
    ? `<span style="font-family:'Barlow Condensed',sans-serif;font-size:0.65rem;letter-spacing:1px;background:rgba(255,170,0,0.15);color:var(--accent2);border:1px solid rgba(255,170,0,0.3);border-radius:8px;padding:1px 7px">${gameBets.length} open</span>`
    : '';

  // Win prob bar
  const awayPct = g.awayWinPct || 45;
  const homePct = g.homeWinPct || 55;
  const awayBarColor = (awayColors.bg && awayColors.bg !== 'var(--muted)' && awayColors.bg !== '#333') ? awayColors.bg : 'var(--blue)';
  const homeBarColor = (homeColors.bg && homeColors.bg !== 'var(--muted)' && homeColors.bg !== '#333') ? homeColors.bg : 'var(--accent)';
  const probBar = g.isFinal ? '' : `
    <div style="display:flex;align-items:center;gap:8px;padding:0 14px 10px;font-family:'Barlow Condensed',sans-serif;font-size:0.7rem;letter-spacing:1px">
      <span style="color:var(--muted);width:32px;text-align:right">${awayPct}%</span>
      <div style="flex:1;height:5px;border-radius:3px;background:var(--surface2);overflow:hidden;display:flex">
        <div style="width:${awayPct}%;background:${awayBarColor};opacity:0.75;border-radius:3px 0 0 3px"></div>
        <div style="width:${homePct}%;background:${homeBarColor};opacity:0.75;border-radius:0 3px 3px 0"></div>
      </div>
      <span style="color:var(--muted);width:32px">${homePct}%</span>
    </div>`;

  // Score display
  let scoreCenter = '';
  if (g.isLive || g.isFinal) {
    const aWon = g.awayScore > g.homeScore;
    const hWon = g.homeScore > g.awayScore;
    scoreCenter = `<div class="sb-score-nums">
      <span class="${!aWon && g.isFinal ? 'losing' : ''}">${g.awayScore ?? '\u2014'}</span>
      <span style="color:var(--muted);font-size:1.2rem"> \u2013 </span>
      <span class="${!hWon && g.isFinal ? 'losing' : ''}">${g.homeScore ?? '\u2014'}</span>
    </div>
    <div class="sb-ou-line">O/U ${g.total}</div>`;
  } else {
    scoreCenter = `<div style="font-family:'Barlow Condensed',sans-serif;font-size:0.78rem;letter-spacing:2px;color:var(--muted);line-height:1.2;text-align:center">VS<br><span style="font-size:0.65rem;color:rgba(255,255,255,0.25)">${g.tipDisplay || ''}</span></div>
    <div class="sb-ou-line" style="margin-top:4px">O/U ${g.total}</div>`;
  }

  // Bet button factory
  const btn = (type, label, ml, line) => {
    const isSelected = _sbSlip.some(l => l.gameKey === g.key && l.type === type);
    const mlFmt = _fmtML(ml);
    const mlCls = ml < 0 ? 'fav' : ml > 0 ? 'dog' : 'even';
    return `<button class="sb-bet-btn${isSelected ? ' selected' : ''}" data-gk="${g.key}" data-type="${type}"
      onclick="_sbToggleLeg('${g.key}','${type}','${g.away}','${g.home}',${ml},${line || 0},'${label.replace(/'/g,"\\'")}')">
      <span class="sb-bet-label">${label}</span>
      <span class="sb-bet-odds ${mlCls}">${mlFmt}</span>
    </button>`;
  };

  const logoStyle = 'width:36px;height:36px;object-fit:contain;flex-shrink:0';
  const awayLogoHtml = awayLogo ? `<img src="${awayLogo}" alt="${g.away}" style="${logoStyle}" onerror="this.style.display='none'">` : '';
  const homeLogoHtml = homeLogo ? `<img src="${homeLogo}" alt="${g.home}" style="${logoStyle}" onerror="this.style.display='none'">` : '';
  const awayClr = awayBarColor;
  const homeClr = homeBarColor;

  return `
  <div class="sb-game-card${isLocked ? ' locked' : ''}">
    <div class="sb-game-header">
      <span>${g.away} @ ${g.home} ${betBadge}</span>
      <span class="${statusCls}">${statusLabel}</span>
    </div>
    <div class="sb-teams-row">
      <div class="sb-team away" style="flex-direction:row;align-items:center;gap:8px">
        ${awayLogoHtml}
        <div>
          <div class="sb-team-abbr" style="color:${awayClr}">${g.away}</div>
          <div class="sb-team-rec">${awayRecStr} &middot; Away</div>
        </div>
      </div>
      <div class="sb-score-center">${scoreCenter}</div>
      <div class="sb-team home" style="flex-direction:row-reverse;align-items:center;gap:8px">
        ${homeLogoHtml}
        <div style="text-align:right">
          <div class="sb-team-abbr" style="color:${homeClr}">${g.home}</div>
          <div class="sb-team-rec">${homeRecStr} &middot; Home</div>
        </div>
      </div>
    </div>
    ${probBar}
    <div class="sb-bet-grid">
      <div class="sb-bet-col">
        <div class="sb-bet-col-header">Moneyline</div>
        ${btn('ml_away', g.away + ' ML', g.awayML || -110, 0)}
        ${btn('ml_home', g.home + ' ML', g.homeML || -110, 0)}
      </div>
      <div class="sb-bet-col">
        <div class="sb-bet-col-header">Spread</div>
        ${btn('spread_away', `${g.away} ${g.awaySpread}`, g.awaySpreadML || -110, -g.spreadLine)}
        ${btn('spread_home', `${g.home} ${g.homeSpread}`, g.homeSpreadML || -110, g.spreadLine)}
      </div>
      <div class="sb-bet-col">
        <div class="sb-bet-col-header">Over/Under</div>
        ${btn('ou_over',  `Over ${g.total}`,  g.overML  || -110, g.total)}
        ${btn('ou_under', `Under ${g.total}`, g.underML || -110, g.total)}
      </div>
    </div>
  </div>`;
}



function _sbRenderBankrollChart(canvas, history) {
  // Destroy existing chart if any
  const existing = Chart.getChart(canvas);
  if (existing) existing.destroy();

  const labels = history.map(h => h.date.slice(5)); // MM-DD
  const data   = history.map(h => h.balance);
  const startBal = history[0]?.balance || 100;
  const isUp = data[data.length - 1] >= startBal;

  const color = isUp ? '#00e87a' : '#ff3355';
  const fillColor = isUp ? 'rgba(0,232,122,0.12)' : 'rgba(255,51,85,0.12)';

  new Chart(canvas, {
    type: 'line',
    data: {
      labels,
      datasets: [{
        data,
        borderColor: color,
        backgroundColor: fillColor,
        borderWidth: 2,
        fill: true,
        tension: 0.35,
        pointRadius: data.length <= 10 ? 4 : 2,
        pointBackgroundColor: color,
        pointBorderColor: color,
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      animation: { duration: 400 },
      plugins: {
        legend: { display: false },
        tooltip: {
          backgroundColor: 'rgba(17,17,24,0.95)',
          titleColor: '#7070a0',
          bodyColor: '#e8e8f0',
          borderColor: 'rgba(255,255,255,0.08)',
          borderWidth: 1,
          callbacks: {
            label: ctx => `$${ctx.raw.toFixed(2)}`
          }
        }
      },
      scales: {
        x: {
          grid: { color: 'rgba(255,255,255,0.04)', drawTicks: false },
          ticks: { color: '#7070a0', font: { family: "'Barlow Condensed'", size: 10 }, maxTicksLimit: 8 },
        },
        y: {
          grid: { color: 'rgba(255,255,255,0.04)', drawTicks: false },
          ticks: {
            color: '#7070a0',
            font: { family: "'Barlow Condensed'", size: 10 },
            callback: v => `$${v}`
          },
          // Add a baseline at $100 starting balance
        }
      }
    }
  });
}

function _renderBotPicks(botBets, enrichedGames) {
  const today = localDateStr(new Date());
  const todayBets = botBets.filter(b => b.date === today);

  const botNet    = _botProfile?.net    || 0;
  const botW      = _botProfile?.w      || 0;
  const botL      = _botProfile?.l      || 0;
  const botBankroll = _botProfile?.bankroll || 0;
  const netColor  = botNet >= 0 ? 'var(--green)' : 'var(--red)';
  const netStr    = (botNet >= 0 ? '+' : '') + '$' + Math.abs(botNet).toFixed(2);

  const headerHtml = `
    <div style="display:flex;align-items:center;gap:16px;padding:14px 20px;background:linear-gradient(90deg,rgba(255,170,0,0.08) 0%,transparent 100%);border-bottom:1px solid rgba(255,170,0,0.18);flex-wrap:wrap">
      <div style="font-size:1.6rem;flex-shrink:0">🤖</div>
      <div style="flex:1;min-width:0">
        <div style="font-family:'Bebas Neue',sans-serif;font-size:1.2rem;letter-spacing:2px;color:var(--accent2)">Johnson's Clanker Ranker</div>
        <div style="font-family:'Barlow Condensed',sans-serif;font-size:0.72rem;letter-spacing:1px;color:var(--muted);margin-top:1px">AI-powered picks · Optimizing for leaderboard glory</div>
      </div>
      <div style="display:flex;gap:10px;flex-wrap:wrap;align-items:center">
        <div style="text-align:center">
          <div style="font-family:'Bebas Neue',sans-serif;font-size:1.3rem;letter-spacing:1px;color:var(--accent2)">$${botBankroll.toFixed(2)}</div>
          <div style="font-family:'Barlow Condensed',sans-serif;font-size:0.65rem;letter-spacing:1px;color:var(--muted);text-transform:uppercase">Balance</div>
        </div>
        <div style="text-align:center">
          <div style="font-family:'Bebas Neue',sans-serif;font-size:1.3rem;letter-spacing:1px;color:${netColor}">${netStr}</div>
          <div style="font-family:'Barlow Condensed',sans-serif;font-size:0.65rem;letter-spacing:1px;color:var(--muted);text-transform:uppercase">All-Time Net</div>
        </div>
        <div style="text-align:center">
          <div style="font-family:'Bebas Neue',sans-serif;font-size:1.3rem;letter-spacing:1px;color:var(--text)">${botW}W–${botL}L</div>
          <div style="font-family:'Barlow Condensed',sans-serif;font-size:0.65rem;letter-spacing:1px;color:var(--muted);text-transform:uppercase">Record</div>
        </div>
      </div>
    </div>`;

  if (!todayBets.length) {
    const hasUpcoming = enrichedGames.filter(g => !g.isFinal && !g.isLive).length > 0;
    const allLocked   = enrichedGames.length > 0 && !hasUpcoming;
    const msg = hasUpcoming
      ? 'Clanker is analyzing today\'s matchups… reload in a moment to see picks. 🔍'
      : allLocked
        ? 'All of today\'s games are already underway — Clanker\'s picks will be posted tomorrow when lines open. 🔋'
        : 'No games scheduled today — Clanker is resting its circuits. 🔋';
    const body = `<div style="padding:24px 20px;font-family:'Barlow Condensed',sans-serif;font-size:0.85rem;letter-spacing:1px;color:var(--muted);text-align:center">${msg}</div>`;
    return `<div style="background:var(--surface);border:1px solid rgba(255,170,0,0.22);border-radius:12px;overflow:hidden;margin-bottom:28px">${headerHtml}${body}</div>`;
  }

  const betRows = todayBets.map(bet => {
    const legs = bet.legs || [];
    const isPending = bet.status === 'open';
    const isWin     = bet.result === 'win';
    const isLoss    = bet.result === 'loss';

    let badge = '';
    if (isPending) badge = `<span style="padding:2px 8px;border-radius:4px;background:rgba(255,170,0,0.15);color:var(--accent2);font-family:'Barlow Condensed',sans-serif;font-size:0.68rem;letter-spacing:1px;font-weight:700">LIVE BET</span>`;
    else if (isWin)  badge = `<span style="padding:2px 8px;border-radius:4px;background:rgba(0,232,122,0.15);color:var(--green);font-family:'Barlow Condensed',sans-serif;font-size:0.68rem;letter-spacing:1px;font-weight:700">WON</span>`;
    else if (isLoss) badge = `<span style="padding:2px 8px;border-radius:4px;background:rgba(255,51,85,0.15);color:var(--red);font-family:'Barlow Condensed',sans-serif;font-size:0.68rem;letter-spacing:1px;font-weight:700">LOST</span>`;
    else             badge = `<span style="padding:2px 8px;border-radius:4px;background:rgba(255,255,255,0.08);color:var(--muted);font-family:'Barlow Condensed',sans-serif;font-size:0.68rem;letter-spacing:1px;font-weight:700">PUSH</span>`;

    const typeLabel  = bet.betType === 'parlay' ? `${legs.length}-Leg Parlay` : 'Single';
    const oddsStr    = bet.betType === 'parlay' ? _fmtML(bet.parlayML) : _fmtML(bet.ml || legs[0]?.ml);
    const potProfit  = bet.betType === 'parlay'
      ? _mlPayout(bet.parlayML, bet.stake).toFixed(2)
      : _mlPayout(bet.ml || legs[0]?.ml, bet.stake).toFixed(2);

    const legRows = legs.map(l => {
      const game = enrichedGames.find(g => g.key === l.gameKey || (g.home === l.homeAbbr && g.away === l.awayAbbr));
      const awayLogo = getLogoUrl(l.awayAbbr);
      const homeLogo = getLogoUrl(l.homeAbbr);
      const logoA = awayLogo ? `<img src="${awayLogo}" style="width:18px;height:18px;object-fit:contain;vertical-align:middle;margin-right:3px" onerror="this.style.display='none'">` : '';
      const logoH = homeLogo ? `<img src="${homeLogo}" style="width:18px;height:18px;object-fit:contain;vertical-align:middle;margin-right:3px" onerror="this.style.display='none'">` : '';
      const desc = _sbLegDesc(l);

      // Reasoning blurb
      let reason = '';
      if (l.type === 'ml_away' || l.type === 'ml_home') {
        const isPicking = l.type === 'ml_home' ? l.homeAbbr : l.awayAbbr;
        const teamE = ENRICHED_DATA.find(t => t.abbr === isPicking);
        reason = teamE ? `Power score ${teamE.power.toFixed(1)} · edge detected vs line` : 'ML edge detected';
      } else if (l.type.startsWith('spread')) {
        reason = 'Spread covers based on power differential';
      } else {
        reason = l.type === 'ou_over' ? 'Both offenses project high totals' : 'Defensive matchup projects low total';
      }

      const scoreInfo = (game?.isFinal || game?.isLive)
        ? `<span style="color:var(--muted);font-size:0.72rem;margin-left:8px">${game.awayScore ?? '—'}–${game.homeScore ?? '—'}${game.isFinal ? ' F' : ''}</span>`
        : '';

      return `<div style="display:flex;align-items:flex-start;gap:10px;padding:8px 0;border-bottom:1px solid rgba(255,255,255,0.04)">
        <div style="font-size:1rem;flex-shrink:0;margin-top:1px">${l.type.startsWith('ml') ? '🏆' : l.type.startsWith('spread') ? '📏' : '🎯'}</div>
        <div style="flex:1;min-width:0">
          <div style="font-family:'Barlow Condensed',sans-serif;font-size:0.92rem;font-weight:700;color:var(--text)">${desc} <span style="color:var(--muted);font-weight:400">${_fmtML(l.ml)}</span>${scoreInfo}</div>
          <div style="font-family:'Barlow Condensed',sans-serif;font-size:0.72rem;color:var(--muted);letter-spacing:1px;margin-top:2px">${logoA}${l.awayAbbr} @ ${logoH}${l.homeAbbr} · ${reason}</div>
        </div>
      </div>`;
    }).join('');

    const netDisplay = !isPending
      ? `<span style="font-family:'Bebas Neue',sans-serif;font-size:1.1rem;color:${bet.net >= 0 ? 'var(--green)' : 'var(--red)'}">${bet.net >= 0 ? '+' : ''}$${Math.abs(bet.net).toFixed(2)}</span>`
      : `<span style="font-family:'Barlow Condensed',sans-serif;font-size:0.78rem;color:var(--green)">To win +$${potProfit}</span>`;

    return `<div style="padding:14px 20px;border-bottom:1px solid rgba(255,255,255,0.05)">
      <div style="display:flex;align-items:center;gap:10px;margin-bottom:10px;flex-wrap:wrap">
        ${badge}
        <span style="font-family:'Barlow Condensed',sans-serif;font-size:0.8rem;color:var(--muted)">${typeLabel} · ${oddsStr} · Stake: <strong style="color:var(--text)">$${bet.stake.toFixed(2)}</strong></span>
        <span style="margin-left:auto">${netDisplay}</span>
      </div>
      <div>${legRows}</div>
    </div>`;
  }).join('');

  return `<div style="background:var(--surface);border:1px solid rgba(255,170,0,0.22);border-radius:12px;overflow:hidden;margin-bottom:28px">
    ${headerHtml}
    ${betRows}
  </div>`;
}

function _renderSbLeaderboard(entries) {
  const myNick = _sbProfile?.nickname || '';

  if (!entries.length) {
    return `<div class="sb-leaderboard" style="margin-bottom:28px">
      <div class="sb-lb-header">
        <span class="sb-lb-title">🏆 Global Leaderboard</span>
        <span class="sb-lb-sub">Be the first to appear!</span>
      </div>
      <div class="sb-lb-loading">No players on the board yet. Place your first bet to join.</div>
    </div>`;
  }

  // Check if current user appears in entries, if not add them at end for context
  const userInList = entries.some(e => e.nickname === myNick);
  const displayEntries = [...entries];
  if (!userInList && _sbProfile) {
    displayEntries.push({
      nickname: myNick,
      bankroll: _sbProfile.bankroll || 0,
      w: _sbProfile.allTimeW || 0,
      l: _sbProfile.allTimeL || 0,
      net: _sbProfile.allTimeNet || 0,
      _notInTop: true
    });
  }

  const rows = displayEntries.map((e, i) => {
    const isYou = e.nickname === myNick;
    const rankCls = i === 0 ? 'top1' : i === 1 ? 'top2' : i === 2 ? 'top3' : '';
    const medals = ['🥇','🥈','🥉'];
    const rankDisplay = e._notInTop ? '—' : (i < 3 ? medals[i] : `#${i + 1}`);
    const record = `${e.w || 0}W–${e.l || 0}L`;
    const net = e.net || 0;
    const netStr = (net >= 0 ? '+' : '') + '$' + Math.abs(net).toFixed(2);
    const netColor = net > 0 ? 'var(--green)' : net < 0 ? 'var(--red)' : 'var(--muted)';
    // ROI vs $100 start
    const changeFromStart = e.bankroll - 100;
    const changeStr = (changeFromStart >= 0 ? '+' : '') + '$' + Math.abs(changeFromStart).toFixed(0);
    const changePct = ((changeFromStart / 100) * 100).toFixed(0);
    const changeColor = changeFromStart > 0 ? 'var(--green)' : changeFromStart < 0 ? 'var(--red)' : 'var(--muted)';
    const betsPlaced = e.bets != null ? e.bets : (e.w || 0) + (e.l || 0);

    return `<div class="sb-lb-row${isYou ? ' you' : ''}${e._notInTop ? ' not-in-top' : ''}">
      <div class="sb-lb-rank ${rankCls}">${rankDisplay}</div>
      <div>
        <div class="sb-lb-name${isYou ? ' you' : ''}">${e.nickname}${isYou ? ' <span style="font-size:0.65rem;color:var(--accent2);letter-spacing:1px">YOU</span>' : ''}</div>
        <div style="font-family:'Barlow Condensed',sans-serif;font-size:0.7rem;color:var(--muted);letter-spacing:1px;margin-top:1px">${record}</div>
      </div>
      <div style="text-align:right">
        <div style="font-family:'Barlow Condensed',sans-serif;font-size:0.72rem;color:var(--muted);letter-spacing:1px">${betsPlaced} bet${betsPlaced !== 1 ? 's' : ''}</div>
        <div style="font-family:'Barlow Condensed',sans-serif;font-size:0.68rem;color:${changeColor};letter-spacing:1px">${changeStr} (${changePct}%)</div>
      </div>
      <div class="sb-lb-balance">$${(e.bankroll || 0).toFixed(2)}</div>
    </div>`;
  }).join('');

  return `<div class="sb-leaderboard" style="margin-bottom:28px">
    <div class="sb-lb-header">
      <span class="sb-lb-title">🏆 Global Leaderboard</span>
      <span class="sb-lb-sub" style="margin-left:auto">Top ${Math.min(entries.length, 15)} · Balance from $100 start</span>
    </div>
    <div class="sb-lb-row" style="background:var(--surface2);border-bottom:1px solid var(--border)">
      <div style="font-family:'Barlow Condensed',sans-serif;font-size:0.65rem;letter-spacing:2px;color:var(--muted);text-transform:uppercase">Rank</div>
      <div style="font-family:'Barlow Condensed',sans-serif;font-size:0.65rem;letter-spacing:2px;color:var(--muted);text-transform:uppercase">Player</div>
      <div style="font-family:'Barlow Condensed',sans-serif;font-size:0.65rem;letter-spacing:2px;color:var(--muted);text-transform:uppercase;text-align:right">Bets · ROI</div>
      <div style="font-family:'Barlow Condensed',sans-serif;font-size:0.65rem;letter-spacing:2px;color:var(--muted);text-transform:uppercase;text-align:right">Balance</div>
    </div>
    ${rows}
  </div>`;
}

// ── Shared bet card renderer (used by open bets + history) ────
function _renderSbBetCard(bet, opts = {}) {
  const { accentOpen = false } = opts;
  const legs      = bet.legs || [];
  const isPending = bet.status === 'open';
  const isWin     = bet.result === 'win';
  const isLoss    = bet.result === 'loss';
  const isPush    = bet.result === 'push';
  const isParlay  = bet.betType === 'parlay';

  // ── Overall result pill ────────────────────────────────────
  let resultPill = '';
  let cardAccent = 'rgba(255,255,255,0.06)';
  if (isPending) {
    resultPill = `<span style="padding:3px 10px;border-radius:20px;background:rgba(255,170,0,0.15);color:var(--accent2);font-family:'Barlow Condensed',sans-serif;font-size:0.7rem;letter-spacing:2px;font-weight:700;text-transform:uppercase">Live</span>`;
    if (accentOpen) cardAccent = 'rgba(255,170,0,0.07)';
  } else if (isWin) {
    resultPill = `<span style="padding:3px 10px;border-radius:20px;background:rgba(0,232,122,0.15);color:var(--green);font-family:'Barlow Condensed',sans-serif;font-size:0.7rem;letter-spacing:2px;font-weight:700;text-transform:uppercase">Won</span>`;
    cardAccent = 'rgba(0,232,122,0.04)';
  } else if (isLoss) {
    resultPill = `<span style="padding:3px 10px;border-radius:20px;background:rgba(255,51,85,0.12);color:var(--red);font-family:'Barlow Condensed',sans-serif;font-size:0.7rem;letter-spacing:2px;font-weight:700;text-transform:uppercase">Lost</span>`;
    cardAccent = 'rgba(255,51,85,0.04)';
  } else if (isPush) {
    resultPill = `<span style="padding:3px 10px;border-radius:20px;background:rgba(255,255,255,0.08);color:var(--muted);font-family:'Barlow Condensed',sans-serif;font-size:0.7rem;letter-spacing:2px;font-weight:700;text-transform:uppercase">Push</span>`;
  }

  // ── Parlay header banner ──────────────────────────────────
  const parlayOdds = isParlay ? _fmtML(bet.parlayML) : _fmtML(bet.ml || legs[0]?.ml);
  let parlayBanner = '';
  const uniqueGameKeys = new Set(legs.map(l => l.gameKey || (l.awayAbbr + '@' + l.homeAbbr)));
  const isSGP = isParlay && legs.length > 1 && uniqueGameKeys.size === 1;
  const isMultiGameParlay = isParlay && legs.length > 1 && uniqueGameKeys.size > 1;

  if (isSGP) {
    parlayBanner = `
      <div style="display:flex;align-items:center;gap:10px;padding:10px 16px 8px;border-bottom:1px solid rgba(255,255,255,0.06);background:rgba(255,255,255,0.03)">
        <span style="font-family:'Barlow Condensed',sans-serif;font-size:0.65rem;letter-spacing:2px;color:var(--accent2);background:rgba(255,170,0,0.12);border:1px solid rgba(255,170,0,0.25);border-radius:3px;padding:1px 7px;font-weight:700">SGP</span>
        <span style="font-family:'Barlow Condensed',sans-serif;font-size:0.9rem;font-weight:700;color:var(--text);letter-spacing:0.5px">${legs.length}-Leg Same Game Parlay</span>
        <span style="margin-left:auto;font-family:'Bebas Neue',sans-serif;font-size:1.1rem;letter-spacing:1px;color:${isWin ? 'var(--green)' : isPending ? 'var(--accent2)' : isLoss ? 'var(--red)' : 'var(--muted)'}">${parlayOdds}</span>
      </div>`;
  } else if (isMultiGameParlay) {
    parlayBanner = `
      <div style="display:flex;align-items:center;gap:10px;padding:10px 16px 8px;border-bottom:1px solid rgba(255,255,255,0.06);background:rgba(255,255,255,0.03)">
        <span style="font-family:'Barlow Condensed',sans-serif;font-size:0.65rem;letter-spacing:2px;color:var(--accent2);background:rgba(255,170,0,0.12);border:1px solid rgba(255,170,0,0.25);border-radius:3px;padding:1px 7px;font-weight:700">PARLAY</span>
        <span style="font-family:'Barlow Condensed',sans-serif;font-size:0.9rem;font-weight:700;color:var(--text);letter-spacing:0.5px">${legs.length}-Leg Parlay · ${uniqueGameKeys.size} Games</span>
        <span style="margin-left:auto;font-family:'Bebas Neue',sans-serif;font-size:1.1rem;letter-spacing:1px;color:${isWin ? 'var(--green)' : isPending ? 'var(--accent2)' : isLoss ? 'var(--red)' : 'var(--muted)'}">${parlayOdds}</span>
      </div>`;
  }

  // ── Per-leg status dot ────────────────────────────────────
  const legDot = (legResult) => {
    if (!legResult || legResult === 'pending') {
      return `<span style="display:inline-flex;align-items:center;justify-content:center;width:20px;height:20px;border-radius:50%;background:rgba(255,255,255,0.1);border:2px solid rgba(255,255,255,0.15);flex-shrink:0"></span>`;
    }
    if (legResult === 'win') {
      return `<span style="display:inline-flex;align-items:center;justify-content:center;width:20px;height:20px;border-radius:50%;background:rgba(0,232,122,0.2);border:2px solid var(--green);color:var(--green);font-size:0.65rem;flex-shrink:0">✓</span>`;
    }
    if (legResult === 'loss') {
      return `<span style="display:inline-flex;align-items:center;justify-content:center;width:20px;height:20px;border-radius:50%;background:rgba(255,51,85,0.18);border:2px solid var(--red);color:var(--red);font-size:0.65rem;flex-shrink:0">✕</span>`;
    }
    // push
    return `<span style="display:inline-flex;align-items:center;justify-content:center;width:20px;height:20px;border-radius:50%;background:rgba(255,255,255,0.08);border:2px solid rgba(255,255,255,0.3);color:var(--muted);font-size:0.55rem;flex-shrink:0">P</span>`;
  };

  // ── Compute per-leg result for display ────────────────────
  // For settled single bets and all bets, derive from game scores if possible
  const legTypeLabel = (type) => {
    if (type === 'ml_away' || type === 'ml_home') return 'MONEYLINE';
    if (type.startsWith('spread')) return 'SPREAD BETTING';
    if (type.startsWith('ou')) return 'TOTAL POINTS';
    return '';
  };

  const legsHtml = legs.map((l, i) => {
    // Per-leg result: singles use overall result; parlays use stored legResults if available
    let legResult = null;
    if (!isPending) {
      if (!isParlay) {
        legResult = bet.result;
      } else if (bet.legResults && bet.legResults[i] != null) {
        legResult = bet.legResults[i]; // stored at settlement time
      } else if (bet.result === 'win') {
        legResult = 'win'; // all legs must have won
      } else if (bet.result === 'push') {
        legResult = 'push';
      } else {
        legResult = 'pending'; // loss but no per-leg data — keep gray
      }
    }

    const desc = _sbLegDesc(l);
    const gameStr = `${l.awayAbbr} @ ${l.homeAbbr}`;
    const typeStr = legTypeLabel(l.type);
    const awayLogo = getLogoUrl(l.awayAbbr);
    const homeLogo = getLogoUrl(l.homeAbbr);
    const logoA = awayLogo ? `<img src="${awayLogo}" style="width:16px;height:16px;object-fit:contain;vertical-align:middle;border-radius:2px" onerror="this.style.display='none'">` : '';
    const logoH = homeLogo ? `<img src="${homeLogo}" style="width:16px;height:16px;object-fit:contain;vertical-align:middle;border-radius:2px" onerror="this.style.display='none'">` : '';

    // O/U progress bar — shown when the game is live and the bet is still open
    let ouBarHtml = '';
    if (isPending && (l.type === 'ou_over' || l.type === 'ou_under')) {
      const liveG = (_sbEnrichedGamesCache || _sbGames || []).find(g =>
        (g.home === l.homeAbbr && g.away === l.awayAbbr) ||
        (g.home === l.awayAbbr && g.away === l.homeAbbr)
      );
      if (liveG && liveG.isLive) {
        const currentPts = (liveG.homeScore || 0) + (liveG.awayScore || 0);
        const ouLine = l.line || 0;
        // Scale: bar fills from 0 → line × 1.15 so there's room to exceed
        const maxPts = Math.max(ouLine * 1.15, currentPts + 5);
        const pct = Math.min(100, (currentPts / maxPts) * 100);
        const linePct = Math.min(99, (ouLine / maxPts) * 100);
        const isOver = l.type === 'ou_over';
        const barColor = currentPts >= ouLine
          ? (isOver ? 'var(--green)' : 'var(--red)')
          : (isOver ? 'rgba(255,255,255,0.3)' : 'var(--green)');
        const statusLbl = currentPts >= ouLine
          ? (isOver ? `✓ Over by ${currentPts - ouLine}` : `✗ Over by ${currentPts - ouLine}`)
          : `${ouLine - currentPts} pts needed`;
        ouBarHtml = `
          <div style="margin-top:8px">
            <div style="display:flex;justify-content:space-between;font-family:'Barlow Condensed',sans-serif;font-size:0.68rem;color:var(--muted);margin-bottom:3px">
              <span>${currentPts} pts</span>
              <span style="color:${currentPts>=ouLine?(isOver?'var(--green)':'var(--red)'):'var(--muted)'}">${statusLbl}</span>
              <span>O/U ${ouLine}</span>
            </div>
            <div style="position:relative;height:6px;background:rgba(255,255,255,0.08);border-radius:3px;overflow:visible">
              <div style="height:100%;width:${pct}%;background:${barColor};border-radius:3px;transition:width 0.4s"></div>
              <div style="position:absolute;top:-3px;left:${linePct}%;width:2px;height:12px;background:var(--accent2);border-radius:1px;transform:translateX(-50%)"></div>
            </div>
            <div style="font-family:'Barlow Condensed',sans-serif;font-size:0.62rem;color:var(--muted);margin-top:2px;letter-spacing:1px">${liveG.status || 'LIVE'}</div>
          </div>`;
      }
    }

    return `
      <div style="display:flex;align-items:flex-start;gap:11px;padding:10px 16px;border-bottom:1px solid rgba(255,255,255,0.05)">
        ${legDot(legResult)}
        <div style="flex:1;min-width:0">
          <div style="font-family:'Barlow Condensed',sans-serif;font-size:0.98rem;font-weight:700;color:var(--text);line-height:1.2">${desc}</div>
          <div style="font-family:'Barlow Condensed',sans-serif;font-size:0.68rem;letter-spacing:1.5px;color:var(--muted);text-transform:uppercase;margin-top:2px">${typeStr}</div>
          <div style="display:flex;align-items:center;gap:5px;margin-top:4px;font-family:'Barlow Condensed',sans-serif;font-size:0.72rem;color:var(--muted)">${logoA}${logoH} ${gameStr}</div>
          ${ouBarHtml}
        </div>
        <div style="font-family:'Bebas Neue',sans-serif;font-size:1rem;letter-spacing:1px;color:var(--muted);flex-shrink:0">${_fmtML(l.ml)}</div>
      </div>`;
  }).join('');

  // ── Footer: wager / return ────────────────────────────────
  const returnAmt = isPending
    ? (isParlay
        ? (bet.stake + _mlPayout(bet.parlayML, bet.stake)).toFixed(2)
        : (bet.stake + _mlPayout(bet.ml || legs[0]?.ml, bet.stake)).toFixed(2))
    : (bet.payout != null ? bet.payout.toFixed(2) : (isWin ? (bet.stake + _mlPayout(bet.ml || legs[0]?.ml, bet.stake)).toFixed(2) : '0.00'));

  const returnColor = isPending ? 'var(--text)' : isWin ? 'var(--green)' : isLoss ? 'var(--muted)' : 'var(--muted)';

  const betIdShort = String(bet.id).replace('.', '').slice(-13).padStart(13, '0');
  const footer = `
    <div style="display:flex;align-items:center;justify-content:space-between;padding:10px 16px;background:rgba(0,0,0,0.2)">
      <div>
        <div style="font-family:'Bebas Neue',sans-serif;font-size:1.3rem;letter-spacing:1px;color:var(--text)">$${bet.stake.toFixed(2)}</div>
        <div style="font-family:'Barlow Condensed',sans-serif;font-size:0.62rem;letter-spacing:2px;color:var(--muted);text-transform:uppercase">Total Wager</div>
      </div>
      <div style="text-align:right">
        <div style="font-family:'Bebas Neue',sans-serif;font-size:1.3rem;letter-spacing:1px;color:${returnColor}">$${returnAmt}</div>
        <div style="font-family:'Barlow Condensed',sans-serif;font-size:0.62rem;letter-spacing:2px;color:var(--muted);text-transform:uppercase">${isPending ? 'Potential Return' : isWin ? 'Returned' : isLoss ? 'Returned' : 'Returned'}</div>
      </div>
    </div>
    <div style="display:flex;justify-content:space-between;align-items:center;padding:6px 16px 10px;border-top:1px solid rgba(255,255,255,0.04)">
      <span style="font-family:'Barlow Condensed',sans-serif;font-size:0.65rem;letter-spacing:1px;color:rgba(255,255,255,0.2);text-transform:uppercase">BET ID: ${betIdShort}</span>
      <span style="font-family:'Barlow Condensed',sans-serif;font-size:0.65rem;color:rgba(255,255,255,0.2)">${bet.date}</span>
    </div>`;

  // ── Card wrapper ──────────────────────────────────────────
  const borderColor = isWin ? 'rgba(0,232,122,0.25)' : isLoss ? 'rgba(255,51,85,0.2)' : isPending ? 'rgba(255,170,0,0.22)' : 'rgba(255,255,255,0.08)';

  return `
    <div style="background:var(--surface);border:1px solid ${borderColor};border-radius:10px;overflow:hidden;margin-bottom:14px">
      <div style="display:flex;align-items:center;gap:10px;padding:10px 16px;background:${cardAccent};border-bottom:1px solid rgba(255,255,255,0.05)">
        ${resultPill}
        <span style="font-family:'Barlow Condensed',sans-serif;font-size:0.8rem;color:var(--muted);letter-spacing:0.5px">${isParlay ? `${legs.length}-Leg Parlay · ${parlayOdds}` : `Single · ${parlayOdds}`}</span>
        ${!isPending && bet.net != null ? `<span style="margin-left:auto;font-family:'Bebas Neue',sans-serif;font-size:1.1rem;letter-spacing:1px;color:${bet.net >= 0 ? 'var(--green)' : 'var(--red)'};">${bet.net >= 0 ? '+' : ''}$${Math.abs(bet.net).toFixed(2)}</span>` : ''}
      </div>
      ${parlayBanner}
      ${legsHtml}
      ${footer}
    </div>`;
}

function _renderSbOpenBets(openBets) {
  if (!openBets.length) return '';

  const cards = openBets.map(b => _renderSbBetCard(b, { accentOpen: true })).join('');

  return `
    <div style="margin-bottom:28px;margin-top:8px">
      <div style="display:flex;align-items:center;gap:12px;margin-bottom:12px">
        <span style="font-family:'Bebas Neue',sans-serif;font-size:1.15rem;letter-spacing:2px;color:var(--accent2)">Open Bets</span>
        <span style="font-family:'Barlow Condensed',sans-serif;font-size:0.72rem;letter-spacing:1px;color:var(--muted);background:rgba(255,170,0,0.12);border:1px solid rgba(255,170,0,0.25);border-radius:10px;padding:1px 8px">${openBets.length}</span>
        <button onclick="renderSportsbook()" style="margin-left:auto;padding:4px 12px;border-radius:6px;border:1px solid rgba(255,170,0,0.3);background:transparent;color:var(--accent2);font-family:'Barlow Condensed',sans-serif;font-size:0.72rem;letter-spacing:1px;cursor:pointer">↻ Refresh</button>
      </div>
      ${cards}
    </div>`;
}

function _renderSbHistory(bets) {
  if (!bets.length) return '';
  const settled = [...bets].filter(b => b.status !== 'open').sort((a, b) => b.id - a.id);

  if (!settled.length) return '';

  const wins     = settled.filter(b => b.result === 'win').length;
  const losses   = settled.filter(b => b.result === 'loss').length;
  const totalNet = settled.filter(b => b.net != null).reduce((s, b) => s + b.net, 0);
  const netColor = totalNet >= 0 ? 'var(--green)' : 'var(--red)';
  const netStr   = `${totalNet >= 0 ? '+' : ''}$${Math.abs(totalNet).toFixed(2)}`;

  const cards = settled.slice(0, 40).map(b => _renderSbBetCard(b)).join('');

  return `
    <div class="sb-history-card" style="margin-top:32px">
      <div class="sb-history-header">
        <span class="sb-history-title">Bet History</span>
        <span style="font-family:'Barlow Condensed',sans-serif;font-size:0.8rem;color:var(--muted);margin-left:auto;display:flex;gap:12px;align-items:center">
          <span>${wins}W–${losses}L</span>
          <span style="color:${netColor};font-family:'Bebas Neue',sans-serif;font-size:1rem;letter-spacing:1px">${netStr}</span>
        </span>
      </div>
      <div style="padding:16px 0 4px">
        ${cards || '<div class="sb-history-empty">No settled bets yet</div>'}
      </div>
    </div>`;
}


function _renderSbOnboarding(container) {
  container.innerHTML = `
  <div class="sb-modal-overlay">
    <div class="sb-modal">
      <div class="sb-modal-icon">🎰</div>
      <div class="sb-modal-title">Welcome to the Sportsbook</div>
      <div class="sb-modal-sub">
        You start with <strong style="color:var(--accent2)">$100</strong> in play money.<br>
        Pick a handle to appear on the global leaderboard.<br>
        Your balance persists day to day.
      </div>
      <input class="sb-modal-input" id="sb-nick-input" maxlength="20" placeholder="Your nickname…" oninput="document.getElementById('sb-start-btn').disabled=!this.value.trim()">
      <button class="sb-modal-btn" id="sb-start-btn" onclick="_sbCreateProfile()" disabled>Let's Bet →</button>
    </div>
  </div>`;
}

async function _sbCreateProfile() {
  const nick = (document.getElementById('sb-nick-input')?.value || '').trim();
  if (!nick) return;

  if (_sbNickIsBlocked(nick)) {
    const input = document.getElementById('sb-nick-input');
    if (input) { input.style.borderColor = 'var(--red)'; input.value = ''; input.placeholder = 'That name isn\'t allowed — try another'; }
    return;
  }

  const btn = document.getElementById('sb-start-btn');
  if (btn) { btn.disabled = true; btn.textContent = 'Saving…'; }

  const today = localDateStr(new Date());
  _sbProfile = {
    nickname: nick,
    bankroll: 100,
    startBalance: 100,
    startDate: today,
    allTimeW: 0, allTimeL: 0, allTimeNet: 0,
    brokeCount: 0,
    history: [{ date: today, balance: 100, label: 'Start' }]
  };

  try {
    await window.storage.set(SB_KEY_PROFILE, JSON.stringify(_sbProfile));
  } catch(e) {
    console.error('[Sportsbook] Profile save error:', e);
    // Storage failed — keep _sbProfile in memory and proceed anyway
    // The profile will work this session even if it can't persist
  }

  // Update leaderboard best-effort
  try { await _sbSaveLeaderboard(); } catch(e) {}

  // renderSportsbook will use the in-memory _sbProfile, not re-load from storage
  renderSportsbook();
}

function _sbEditNickname() {
  const newNick = prompt('Enter new nickname (max 20 chars):', _sbProfile?.nickname || '');
  if (!newNick || !newNick.trim()) return;
  if (_sbNickIsBlocked(newNick.trim())) { alert('That name isn\'t allowed — please choose another.'); return; }
  if (!_sbProfile) return;
  const safe = newNick.trim().slice(0, 20);
  _sbProfile.nickname = safe;
  window._jcrAuth.setDisplayName(safe);
  _sbSaveProfile().then(() => { _sbSaveLeaderboard(); renderSportsbook(); });
}

function _sbSignOut() {
  if (!confirm('Sign out of Johnson\'s Clanker Ranker Sportsbook?')) return;
  window._jcrAuth.signOut()
    .then(function() {
      _sbProfile = null;
      _sbGames = null;
      if (typeof _sbEnrichedGamesCache !== 'undefined') _sbEnrichedGamesCache = null;
      if (typeof _sbLiveRefreshTimer !== 'undefined' && _sbLiveRefreshTimer) {
        clearInterval(_sbLiveRefreshTimer);
        _sbLiveRefreshTimer = null;
      }
      renderSportsbook();
    })
    .catch(function(e) {
      alert('Sign-out failed: ' + (e.message || 'Unknown error'));
    });
}

async function _sbStartFresh() {
  if (!_sbProfile) return;
  if (!confirm('Start fresh with $50? Your bet history will be kept but your balance resets.')) return;
  const today = localDateStr(new Date());
  _sbProfile.bankroll = 50;
  _sbProfile.brokeCount = (_sbProfile.brokeCount || 0) + 1;
  _sbProfile.brokeDate = today;
  if (!_sbProfile.history) _sbProfile.history = [];
  _sbProfile.history.push({ date: today, balance: 50, label: 'Reset' });
  await _sbSaveProfile();
  await _sbSaveLeaderboard();
  renderSportsbook();
}

function _sbUpdateStake(val) {
  const n = parseFloat(val);
  if (!isNaN(n) && n > 0) { _sbStake = n; _renderSbSlip(); }
}

function _sbQuickStake(amount) {
  _sbStake = Math.max(1, Math.round(amount));
  const inp = document.getElementById('sb-stake-input');
  if (inp) inp.value = _sbStake;
  _renderSbSlip();
}

function _sbClearSlip() {
  _sbSlip = [];
  _sbSlipMode = 'single';
  _renderSbSlip();
  _renderSbGameButtons();
}

function _sbQuickFavParlay() {
  // Build a parlay of all ML favorites from today's upcoming games
  const games = _sbEnrichedGamesCache.length ? _sbEnrichedGamesCache : _sbGames;
  _sbSlip = [];
  _sbSlipMode = 'parlay';
  for (const g of games) {
    if (g.isFinal || g.isLive) continue;
    const awayML = g.awayML || -110;
    const homeML = g.homeML || -110;
    // Pick the bigger favorite (more negative = bigger fav)
    let type, ml;
    if (awayML < homeML) {
      type = 'ml_away'; ml = awayML;
    } else {
      type = 'ml_home'; ml = homeML;
    }
    // Skip big dogs (positive ML means underdog — don't add to "fav" parlay)
    if (ml > 0) continue;
    const gameKey = g.key || (g.away + '@' + g.home);
    const leg = {
      gameKey, type, awayAbbr: g.away, homeAbbr: g.home, ml, line: 0,
      label: type === 'ml_away' ? g.away : g.home
    };
    const check = _sbCorrelationBlocked(leg, _sbSlip);
    if (!check.blocked) _sbSlip.push(leg);
  }
  if (!_sbSlip.length) {
    alert('No clear favorites found today. Try adding legs manually.');
    _sbSlipMode = 'single';
    return;
  }
  _renderSbSlip();
  _renderSbGameButtons();
}

