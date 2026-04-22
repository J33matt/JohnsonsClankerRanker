// NFL LINEUPS ENGINE
// Fetches ESPN depth charts and caches by team

const LINEUP_CACHE = {};
const ESPN_TEAM_IDS = {
  ARI:1,ATL:2,BAL:3,BUF:4,CAR:5,CHI:6,CIN:7,CLE:8,DAL:9,DEN:10,
  DET:11,GB:12,HOU:34,IND:15,JAX:30,KC:16,LAR:14,MIA:17,MIN:18,
  NE:17,NO:18,NYG:19,NYJ:20,LV:13,PHI:21,PIT:22,LAC:24,SF:25,
  SEA:26,TB:27,TEN:10,WAS:28
};

// Fix duplicate IDs — correct ESPN team ID mapping
const NFL_ESPN_IDS = {
  ARI:22,ATL:1,BAL:33,BUF:2,CAR:29,CHI:3,CIN:4,CLE:5,DAL:6,DEN:7,
  DET:8,GB:9,HOU:34,IND:11,JAX:30,KC:12,LAR:14,MIA:15,MIN:16,
  NE:17,NO:18,NYG:19,NYJ:20,LV:13,PHI:21,PIT:23,LAC:24,SF:25,
  SEA:26,TB:27,TEN:10,WAS:28
};

const OFFENSE_POSITIONS = ['qb','rb','fb','wr1','wr2','wr3','te','lt','lg','c','rg','rt'];
const DEFENSE_34_POSITIONS = ['lde','nt','rde','wlb','lilb','rilb','slb','lcb','rcb','ss','fs','nb'];
const DEFENSE_43_POSITIONS = ['lde','ldt','rdt','rde','wlb','mlb','slb','lcb','rcb','ss','fs','nb'];

// Formation grid layouts — [row, col] for each position key
// Offense (7 cols, 5 rows) — view from above, offense at bottom
const OFFENSE_LAYOUT = {
  lt:   [0, 0],
  lg:   [0, 1],
  c:    [0, 2],
  rg:   [0, 3],
  rt:   [0, 4],
  te:   [0, 5],
  wr1:  [1, 0],
  wr2:  [1, 2],
  rb:   [1, 3],
  qb:   [1, 4],
  wr3:  [1, 6],
  fb:   [1, 5],
};

const DEFENSE_34_LAYOUT = {
  fs:   [0, 0],
  wlb:  [0, 1],
  lilb: [0, 2],
  rilb: [0, 3],
  ss:   [0, 4],
  lcb:  [1, 0],
  rcb:  [1, 6],
  lde:  [1, 2],
  nt:   [1, 3],
  rde:  [1, 4],
  slb:  [1, 1],
  nb:   [0, 5],
};

const DEFENSE_43_LAYOUT = {
  fs:   [0, 0],
  wlb:  [0, 1],
  mlb:  [0, 2],
  slb:  [0, 3],
  ss:   [0, 4],
  lcb:  [1, 0],
  rcb:  [1, 6],
  lde:  [1, 1],
  ldt:  [1, 2],
  rdt:  [1, 4],
  rde:  [1, 5],
  nb:   [0, 5],
};

async function fetchTeamLineup(abbr) {
  if (LINEUP_CACHE[abbr]) return LINEUP_CACHE[abbr];

  const espnId = NFL_ESPN_IDS[abbr];
  if (!espnId) return null;

  try {
    const res = await fetch(`https://site.api.espn.com/apis/site/v2/sports/football/nfl/teams/${espnId}/depthcharts`);
    const data = await res.json();

    const result = { offense: {}, defense: {}, raw: data.depthchart };

    data.depthchart.forEach(chart => {
      const name = chart.name.toLowerCase();
      if (name.includes('wr') || name.includes('offense') || name.includes('3wr')) {
        Object.entries(chart.positions).forEach(([pos, val]) => {
          result.offense[pos] = val.athletes || [];
        });
      } else if (name.includes('base') || name.includes('defense') || name.includes('3-4') || name.includes('4-3')) {
        Object.entries(chart.positions).forEach(([pos, val]) => {
          result.defense[pos] = val.athletes || [];
        });
      }
    });

    LINEUP_CACHE[abbr] = result;
    return result;
  } catch(e) {
    console.error('Lineup fetch failed for', abbr, e);
    return null;
  }
}

function getHeadshotUrl(athleteId) {
  return `https://a.espncdn.com/i/headshots/nfl/players/full/${athleteId}.png`;
}

function getDefenseLayout(abbr) {
  const scheme = (NFL_TEAM_CONTEXT[abbr] || {}).scheme || '4-3';
  return scheme === '3-4' ? DEFENSE_34_LAYOUT : DEFENSE_43_LAYOUT;
}

function getDefensePositions(abbr) {
  const scheme = (NFL_TEAM_CONTEXT[abbr] || {}).scheme || '4-3';
  return scheme === '3-4' ? DEFENSE_34_POSITIONS : DEFENSE_43_POSITIONS;
}
