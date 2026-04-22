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

const OFFENSE_POSITIONS = ['qb','rb','wr1','wr2','wr3','te','lt','lg','c','rg','rt'];
const DEFENSE_34_POSITIONS = ['lde','nt','rde','wlb','lilb','rilb','slb','lcb','rcb','ss','fs'];
const DEFENSE_43_POSITIONS = ['lde','ldt','rdt','rde','wlb','mlb','slb','lcb','rcb','ss','fs'];

// Formation layouts — { left, top } as percentages for absolute positioning
// Behind-the-QB perspective: top = line of scrimmage / deep field, bottom = behind QB
const OFFENSE_LAYOUT = {
  wr1:  { left: 3,  top: 10 },
  wr3:  { left: 13, top: 14 },
  lt:   { left: 30, top: 10 },
  lg:   { left: 40, top: 10 },
  c:    { left: 50, top: 10 },
  rg:   { left: 60, top: 10 },
  rt:   { left: 70, top: 10 },
  te:   { left: 80, top: 14 },
  wr2:  { left: 97, top: 10 },

  rb:   { left: 40, top: 39 },
  qb:   { left: 50, top: 35 },
};

const DEFENSE_34_LAYOUT = {
  fs:   { left: 65, top: 65 },
  ss:   { left: 35, top: 65 },

  slb:  { left: 74, top: 35 },
  rilb: { left: 58, top: 38 },
  lilb: { left: 42, top: 38 },
  wlb:  { left: 26, top: 35 },

  rcb:  { left: 88, top: 14 },
  rde:  { left: 65, top: 10 },
  nt:   { left: 50, top: 10 },
  lde:  { left: 35, top: 10 },
  lcb:  { left: 5,  top: 14 },
};

const DEFENSE_43_LAYOUT = {
  fs:   { left: 80, top: 65 },
  ss:   { left: 20, top: 60 },

  slb:  { left: 70, top: 35 },
  mlb:  { left: 50, top: 35 },
  wlb:  { left: 30, top: 35 },

  rcb:  { left: 97, top: 14 },
  rde:  { left: 65, top: 10 },
  rdt:  { left: 55, top: 10 },
  ldt:  { left: 45, top: 10 },
  lde:  { left: 35, top: 10 },
  lcb:  { left: 3,  top: 14 },
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
