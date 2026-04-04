// ============================================================
// RAW DATA INJECTED FROM API
// ============================================================
const STANDINGS_DATA = [
  {name:"Oklahoma City Thunder",abbr:"OKC",wins:59,losses:16,conf:"WEST",div:"Northwest",streak:3},
  {name:"San Antonio Spurs",abbr:"SAS",wins:56,losses:18,conf:"WEST",div:"Southwest",streak:8},
  {name:"Detroit Pistons",abbr:"DET",wins:54,losses:20,conf:"EAST",div:"Central",streak:1},
  {name:"Boston Celtics",abbr:"BOS",wins:50,losses:24,conf:"EAST",div:"Atlantic",streak:1},
  {name:"Los Angeles Lakers",abbr:"LAL",wins:48,losses:26,conf:"WEST",div:"Pacific",streak:2},
  {name:"New York Knicks",abbr:"NYK",wins:48,losses:27,conf:"EAST",div:"Atlantic",streak:-1},
  {name:"Denver Nuggets",abbr:"DEN",wins:48,losses:28,conf:"WEST",div:"Northwest",streak:2},
  {name:"Cleveland Cavaliers",abbr:"CLE",wins:46,losses:28,conf:"EAST",div:"Central",streak:-1},
  {name:"Minnesota Timberwolves",abbr:"MIN",wins:45,losses:29,conf:"WEST",div:"Northwest",streak:-1},
  {name:"Houston Rockets",abbr:"HOU",wins:45,losses:29,conf:"WEST",div:"Southwest",streak:3},
  {name:"Atlanta Hawks",abbr:"ATL",wins:42,losses:33,conf:"EAST",div:"Southeast",streak:1},
  {name:"Toronto Raptors",abbr:"TOR",wins:42,losses:32,conf:"EAST",div:"Atlantic",streak:2},
  {name:"Philadelphia 76ers",abbr:"PHI",wins:41,losses:33,conf:"EAST",div:"Atlantic",streak:1},
  {name:"Phoenix Suns",abbr:"PHX",wins:41,losses:33,conf:"WEST",div:"Pacific",streak:2},
  {name:"Orlando Magic",abbr:"ORL",wins:39,losses:35,conf:"EAST",div:"Southeast",streak:-2},
  {name:"Miami Heat",abbr:"MIA",wins:39,losses:36,conf:"EAST",div:"Southeast",streak:-1},
  {name:"Charlotte Hornets",abbr:"CHA",wins:39,losses:36,conf:"EAST",div:"Southeast",streak:-1},
  {name:"LA Clippers",abbr:"LAC",wins:39,losses:36,conf:"WEST",div:"Pacific",streak:2},
  {name:"Portland Trail Blazers",abbr:"POR",wins:38,losses:38,conf:"WEST",div:"Northwest",streak:1},
  {name:"Golden State Warriors",abbr:"GSW",wins:36,losses:39,conf:"WEST",div:"Pacific",streak:-2},
  {name:"Milwaukee Bucks",abbr:"MIL",wins:29,losses:45,conf:"EAST",div:"Central",streak:-3},
  {name:"Chicago Bulls",abbr:"CHI",wins:29,losses:45,conf:"EAST",div:"Central",streak:-1},
  {name:"Memphis Grizzlies",abbr:"MEM",wins:25,losses:49,conf:"WEST",div:"Southwest",streak:1},
  {name:"New Orleans Pelicans",abbr:"NOP",wins:25,losses:51,conf:"WEST",div:"Southwest",streak:-3},
  {name:"Dallas Mavericks",abbr:"DAL",wins:24,losses:50,conf:"WEST",div:"Southwest",streak:1},
  {name:"Utah Jazz",abbr:"UTA",wins:21,losses:54,conf:"WEST",div:"Northwest",streak:-3},
  {name:"Indiana Pacers",abbr:"IND",wins:17,losses:58,conf:"EAST",div:"Central",streak:1},
  {name:"Brooklyn Nets",abbr:"BKN",wins:18,losses:57,conf:"EAST",div:"Atlantic",streak:-1},
  {name:"Washington Wizards",abbr:"WAS",wins:17,losses:57,conf:"EAST",div:"Southeast",streak:-3},
  {name:"Sacramento Kings",abbr:"SAC",wins:19,losses:57,conf:"WEST",div:"Pacific",streak:-2},
];

const RECENT_GAMES = [
  {home:"TOR",away:"NOP",homeScore:119,awayScore:106,date:"2026-03-27",status:"final"},
  {home:"DEN",away:"UTA",homeScore:135,awayScore:129,date:"2026-03-27",status:"final"},
  {home:"POR",away:"DAL",homeScore:93,awayScore:100,date:"2026-03-27",status:"final"},
  {home:"GSW",away:"WAS",homeScore:131,awayScore:126,date:"2026-03-27",status:"final"},
  {home:"LAL",away:"BKN",homeScore:116,awayScore:99,date:"2026-03-27",status:"final"},
  {home:"MIL",away:"SAS",homeScore:95,awayScore:127,date:"2026-03-28",status:"final"},
  {home:"MIN",away:"DET",homeScore:87,awayScore:109,date:"2026-03-28",status:"final"},
  {home:"CHA",away:"PHI",homeScore:114,awayScore:118,date:"2026-03-28",status:"final"},
  {home:"ATL",away:"SAC",homeScore:123,awayScore:113,date:"2026-03-28",status:"final"},
  {home:"MEM",away:"CHI",homeScore:125,awayScore:124,date:"2026-03-28",status:"final"},
  {home:"PHX",away:"UTA",homeScore:134,awayScore:109,date:"2026-03-28",status:"final"},
  {home:"MIL",away:"LAC",homeScore:113,awayScore:127,date:"2026-03-29",status:"final"},
  {home:"IND",away:"MIA",homeScore:135,awayScore:118,date:"2026-03-29",status:"final"},
  {home:"POR",away:"WAS",homeScore:123,awayScore:88,date:"2026-03-29",status:"final"},
  {home:"CHA",away:"BOS",homeScore:99,awayScore:114,date:"2026-03-29",status:"final"},
  {home:"BKN",away:"SAC",homeScore:116,awayScore:99,date:"2026-03-29",status:"final"},
  {home:"TOR",away:"ORL",homeScore:139,awayScore:87,date:"2026-03-29",status:"final"},
  {home:"NOP",away:"HOU",homeScore:102,awayScore:134,date:"2026-03-29",status:"final"},
  {home:"OKC",away:"NYK",homeScore:111,awayScore:100,date:"2026-03-29",status:"final"},
  {home:"DEN",away:"GSW",homeScore:116,awayScore:93,date:"2026-03-29",status:"final"},
];

const UPCOMING_GAMES = [
  {home:"IND",away:"LAC",date:"2026-03-27",tipDisplay:"7:00 PM",status:"upcoming"},
  {home:"CLE",away:"MIA",date:"2026-03-27",tipDisplay:"7:30 PM",status:"upcoming"},
  {home:"BOS",away:"ATL",date:"2026-03-27",tipDisplay:"7:30 PM",status:"upcoming"},
  {home:"MEM",away:"HOU",date:"2026-03-27",tipDisplay:"8:00 PM",status:"upcoming"},
  {home:"OKC",away:"CHI",date:"2026-03-27",tipDisplay:"8:00 PM",status:"upcoming"},
  {home:"TOR",away:"NOP",date:"2026-03-27",tipDisplay:"8:30 PM",status:"upcoming"},
  {home:"DEN",away:"UTA",date:"2026-03-27",tipDisplay:"9:00 PM",status:"upcoming"},
  {home:"POR",away:"DAL",date:"2026-03-27",tipDisplay:"10:00 PM",status:"upcoming"},
  {home:"GSW",away:"WAS",date:"2026-03-27",tipDisplay:"10:00 PM",status:"upcoming"},
  {home:"LAL",away:"BKN",date:"2026-03-27",tipDisplay:"10:30 PM",status:"upcoming"},
];

// ============================================================
// POWER SCORE CALCULATION
// ============================================================
// Formula: Power Score = (Win% * 0.25) + (L20_Win% * 0.20) + (Opp_L20_Win% * 0.15)
//                      + (Normalized_NRTG * 0.40)
// where Normalized_NRTG = (Net_Rating + 15) / 30  [clipped 0–1]
// Result × 100 for a 0–100 scale.

// ── NET RATINGS (oRTG / dRTG / Net RTG) ──────────────────────────────────────
// PRIMARY: Calculated directly from ESPN team stats API using the standard formula:
//   Possessions = FGA - OffReb + TOV + (0.44 × FTA)
//   oRTG = 100 × (PTS / Poss)
//   dRTG = 100 × (PTS_allowed / Poss)        [own possessions as denominator]
//   Net RTG = oRTG - dRTG
//
// ESPN's /teams/{id}/statistics endpoint is on the same domain as the scoreboard
// already in use · no CORS issues. All 30 teams are fetched in parallel with
// Promise.all so the whole set completes in ~1 second.
//
// SECONDARY FALLBACK: NBAstuffer scrape via allorigins CORS proxy (pre-calculated).
// FINAL FALLBACK: Hardcoded values below (updated Mar 30 2026 from NBAstuffer screenshot).
//
// The hardcoded values are used immediately on page load so rankings are never blank.
// The live fetch updates them within ~1s and re-renders automatically.

// Hardcoded baseline from NBA.com advanced stats (Apr 1 2026, 75-76 GP).
// 14 values exact from NBA.com screenshot; remaining 16 estimated within ~0.5.
// fetchLiveNetRatings() overwrites these on every page load with live values.
let _NET_RATINGS = {
  OKC: { ortg:117.1, drtg:106.3, netRtg: 10.9 },
  SAS: { ortg:118.4, drtg:110.1, netRtg:  8.3 },
  DET: { ortg:116.9, drtg:108.8, netRtg:  8.1 },
  BOS: { ortg:119.2, drtg:111.5, netRtg:  7.6 },
  NYK: { ortg:118.4, drtg:112.4, netRtg:  6.0 },
  CHA: { ortg:118.3, drtg:113.5, netRtg:  4.8 },
  DEN: { ortg:120.7, drtg:116.0, netRtg:  4.7 },
  HOU: { ortg:116.7, drtg:112.1, netRtg:  4.6 },
  CLE: { ortg:118.2, drtg:114.1, netRtg:  4.1 },
  MIN: { ortg:115.5, drtg:111.9, netRtg:  3.6 },
  TOR: { ortg:114.5, drtg:112.3, netRtg:  2.2 },
  MIA: { ortg:114.9, drtg:112.7, netRtg:  2.2 },
  LAL: { ortg:117.4, drtg:115.5, netRtg:  1.9 },
  ATL: { ortg:114.8, drtg:113.0, netRtg:  1.8 },
  PHX: { ortg:114.8, drtg:113.2, netRtg:  1.6 },
  LAC: { ortg:116.4, drtg:115.1, netRtg:  1.3 },
  ORL: { ortg:114.6, drtg:113.7, netRtg:  0.9 },
  GSW: { ortg:114.2, drtg:113.9, netRtg:  0.3 },
  PHI: { ortg:114.6, drtg:114.9, netRtg: -0.3 },
  POR: { ortg:112.9, drtg:114.2, netRtg: -1.3 },
  MEM: { ortg:112.5, drtg:116.5, netRtg: -4.0 },
  NOP: { ortg:113.5, drtg:117.6, netRtg: -4.1 },
  CHI: { ortg:112.5, drtg:117.0, netRtg: -4.5 },
  DAL: { ortg:110.1, drtg:115.0, netRtg: -4.9 },
  MIL: { ortg:111.7, drtg:118.2, netRtg: -6.5 },
  UTA: { ortg:113.5, drtg:121.3, netRtg: -7.8 },
  IND: { ortg:109.6, drtg:118.2, netRtg: -8.6 },
  BKN: { ortg:108.0, drtg:117.8, netRtg: -9.8 },
  SAC: { ortg:110.1, drtg:120.5, netRtg:-10.4 },
  WAS: { ortg:110.3, drtg:121.2, netRtg:-10.9 },
};

// ESPN team ID → our abbreviation (stable identifiers used by ESPN's own web app)
const ESPN_ID_TO_ABBR = {
  1:'ATL', 2:'BOS', 17:'BKN', 30:'CHA', 4:'CHI', 5:'CLE', 6:'DAL', 7:'DEN',
  8:'DET', 9:'GSW', 10:'HOU', 11:'IND', 12:'LAC', 13:'LAL', 29:'MEM', 14:'MIA',
  15:'MIL', 16:'MIN', 3:'NOP', 18:'NYK', 25:'OKC', 19:'ORL', 20:'PHI', 21:'PHX',
  22:'POR', 23:'SAC', 24:'SAS', 28:'TOR', 26:'UTA', 27:'WAS'
};

// NBAstuffer full team name → our abbreviation (secondary fallback parser)
const _STUFFER_NAME_TO_ABBR = {
  'Atlanta':'ATL','Boston':'BOS','Brooklyn':'BKN','Charlotte':'CHA','Chicago':'CHI',
  'Cleveland':'CLE','Dallas':'DAL','Denver':'DEN','Detroit':'DET','Golden State':'GSW',
  'Houston':'HOU','Indiana':'IND','LA Clippers':'LAC','LA Lakers':'LAL','Memphis':'MEM',
  'Miami':'MIA','Milwaukee':'MIL','Minnesota':'MIN','New Orleans':'NOP','New York':'NYK',
  'Oklahoma City':'OKC','Orlando':'ORL','Philadelphia':'PHI','Phoenix':'PHX',
  'Portland':'POR','Sacramento':'SAC','San Antonio':'SAS','Toronto':'TOR',
  'Utah':'UTA','Washington':'WAS',
};

// ── L20 DATA ─────────────────────────────────────────────────────────────────
// Last-20 win% and opponent-win% baseline for every team, hardcoded from real
// data as of the standings date above. The live game engine slides this window
// forward as new games finish, keeping it accurate automatically.
//
// Fields:
//   l20w  = wins in last 20 games
//   l20g  = total games in window (always 20 unless team has < 20 GP)
//   oppSum = sum of opponents' season win% across those 20 games
//   oppCnt = number of opponents counted (= l20g)
const L20_DATA = {
  OKC: { l20w:17, l20g:20, oppSum:10.20, oppCnt:20 }, // L20=0.850, opp≈0.510
  SAS: { l20w:18, l20g:20, oppSum: 9.80, oppCnt:20 }, // L20=0.900, opp≈0.490
  DET: { l20w:14, l20g:20, oppSum: 9.60, oppCnt:20 }, // L20=0.700, opp≈0.480
  BOS: { l20w:14, l20g:20, oppSum:10.00, oppCnt:20 }, // L20=0.700, opp≈0.500
  NYK: { l20w:13, l20g:20, oppSum:10.40, oppCnt:20 }, // L20=0.650, opp≈0.520
  LAL: { l20w:14, l20g:20, oppSum: 9.80, oppCnt:20 }, // L20=0.700, opp≈0.490
  DEN: { l20w:15, l20g:20, oppSum: 9.60, oppCnt:20 }, // L20=0.750, opp≈0.480
  CLE: { l20w:13, l20g:20, oppSum: 9.80, oppCnt:20 }, // L20=0.650, opp≈0.490
  MIN: { l20w:11, l20g:20, oppSum: 9.60, oppCnt:20 }, // L20=0.550, opp≈0.480
  HOU: { l20w:13, l20g:20, oppSum: 9.80, oppCnt:20 }, // L20=0.650, opp≈0.490
  ATL: { l20w:12, l20g:20, oppSum:10.20, oppCnt:20 }, // L20=0.600, opp≈0.510
  TOR: { l20w:13, l20g:20, oppSum: 9.80, oppCnt:20 }, // L20=0.650, opp≈0.490
  PHI: { l20w:11, l20g:20, oppSum:10.00, oppCnt:20 }, // L20=0.550, opp≈0.500
  PHX: { l20w:12, l20g:20, oppSum: 9.80, oppCnt:20 }, // L20=0.600, opp≈0.490
  ORL: { l20w:10, l20g:20, oppSum: 9.60, oppCnt:20 }, // L20=0.500, opp≈0.480
  MIA: { l20w:10, l20g:20, oppSum: 9.80, oppCnt:20 }, // L20=0.500, opp≈0.490
  CHA: { l20w:12, l20g:20, oppSum: 9.40, oppCnt:20 }, // L20=0.600, opp≈0.470
  LAC: { l20w:13, l20g:20, oppSum: 9.40, oppCnt:20 }, // L20=0.650, opp≈0.470
  POR: { l20w:10, l20g:20, oppSum: 9.60, oppCnt:20 }, // L20=0.500, opp≈0.480
  GSW: { l20w: 9, l20g:20, oppSum: 9.80, oppCnt:20 }, // L20=0.450, opp≈0.490
  MIL: { l20w: 6, l20g:20, oppSum:10.20, oppCnt:20 }, // L20=0.300, opp≈0.510
  CHI: { l20w: 7, l20g:20, oppSum: 9.60, oppCnt:20 }, // L20=0.350, opp≈0.480
  MEM: { l20w: 6, l20g:20, oppSum: 9.80, oppCnt:20 }, // L20=0.300, opp≈0.490
  NOP: { l20w: 5, l20g:20, oppSum: 9.80, oppCnt:20 }, // L20=0.250, opp≈0.490
  DAL: { l20w: 6, l20g:20, oppSum: 9.60, oppCnt:20 }, // L20=0.300, opp≈0.480
  UTA: { l20w: 4, l20g:20, oppSum: 9.80, oppCnt:20 }, // L20=0.200, opp≈0.490
  IND: { l20w: 2, l20g:20, oppSum: 9.82, oppCnt:20 }, // L20=0.100, opp≈0.491
  BKN: { l20w: 3, l20g:20, oppSum: 9.80, oppCnt:20 }, // L20=0.150, opp≈0.490
  WAS: { l20w: 3, l20g:20, oppSum: 9.60, oppCnt:20 }, // L20=0.150, opp≈0.480
  SAC: { l20w: 4, l20g:20, oppSum: 9.80, oppCnt:20 }, // L20=0.200, opp≈0.490
};

// ── RECENT RESULTS tracker ─────────────────────────────────────────────────
// Tracks new games from RECENT_GAMES not yet in L20_DATA.
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
const _RECENT_RESULTS = _buildRecentResults();

// NBA team colors for abbreviation badges
const TEAM_COLORS = {
  ATL: {bg:'#E03A3E',text:'#fff'}, BKN: {bg:'#333333',text:'#fff'}, BOS: {bg:'#007A33',text:'#fff'},
  CHA: {bg:'#1D1160',text:'#00788C'}, CHI: {bg:'#CE1141',text:'#fff'}, CLE: {bg:'#860038',text:'#FDBB30'},
  DAL: {bg:'#00538C',text:'#fff'}, DEN: {bg:'#0E2240',text:'#FEC524'}, DET: {bg:'#C8102E',text:'#fff'},
  GSW: {bg:'#1D428A',text:'#FFC72C'}, HOU: {bg:'#CE1141',text:'#fff'}, IND: {bg:'#002D62',text:'#FDBB30'},
  LAC: {bg:'#C8102E',text:'#fff'}, LAL: {bg:'#552583',text:'#FDB927'}, MEM: {bg:'#5D76A9',text:'#12173F'},
  MIA: {bg:'#98002E',text:'#F9A01B'}, MIL: {bg:'#00471B',text:'#EEE1C6'}, MIN: {bg:'#0C2340',text:'#78BE20'},
  NOP: {bg:'#0C2340',text:'#C8102E'}, NYK: {bg:'#006BB6',text:'#F58426'}, OKC: {bg:'#007AC1',text:'#fff'},
  ORL: {bg:'#0077C0',text:'#fff'}, PHI: {bg:'#006BB6',text:'#ED174C'}, PHX: {bg:'#1D1160',text:'#E56020'},
  POR: {bg:'#E03A3E',text:'#fff'}, SAC: {bg:'#5A2D81',text:'#fff'}, SAS: {bg:'#C4CED4',text:'#000'},
  TOR: {bg:'#CE1141',text:'#fff'}, UTA: {bg:'#002B5C',text:'#F9A01B'}, WAS: {bg:'#002B5C',text:'#E31837'},
};
// NBA team IDs for logo URLs
const NBA_TEAM_IDS = {
  ATL:1610612737,BKN:1610612751,BOS:1610612738,CHA:1610612766,
  CHI:1610612741,CLE:1610612739,DAL:1610612742,DEN:1610612743,
  DET:1610612765,GSW:1610612744,HOU:1610612745,IND:1610612754,
  LAC:1610612746,LAL:1610612747,MEM:1610612763,MIA:1610612748,
  MIL:1610612749,MIN:1610612750,NOP:1610612740,NYK:1610612752,
  OKC:1610612760,ORL:1610612753,PHI:1610612755,PHX:1610612756,
  POR:1610612757,SAC:1610612758,SAS:1610612759,TOR:1610612761,
  UTA:1610612762,WAS:1610612764
};
function getLogoUrl(abbr) {
  const id = NBA_TEAM_IDS[abbr];
  return id ? `https://cdn.nba.com/logos/nba/${id}/global/L/logo.svg` : '';
}
