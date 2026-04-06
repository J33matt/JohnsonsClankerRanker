/* ══════════════════════════════════════════════════════
   CLANKER'S CARD COLLECTION — cards-data.js
   Player pool, ratings, Clanker descriptions.
   Season: 2025-26
   ══════════════════════════════════════════════════════ */

const CARDS_SEASON = '2025-26';

const RARITY = {
  PRO:         'pro',
  IMPACT:      'impact',
  CLUTCH:      'clutch',
  ELITE:       'elite',
  SUPERSTAR:   'superstar',
  GAMEBREAKER: 'gamebreaker'
};

const RARITY_LABELS = {
  pro:         'Pro',
  impact:      'Impact',
  clutch:      'Clutch',
  elite:       'Elite',
  superstar:   'Superstar',
  gamebreaker: 'Game-Breaker'
};

const RARITY_TIERS = { pro: 0, impact: 1, clutch: 2, elite: 3, superstar: 4, gamebreaker: 5 };

const CRATE_DEFS = [
  { id: 'common',    name: 'Common Crate',    icon: '📦', price: 5,  odds: [['pro',0.60],['impact',0.28],['clutch',0.08],['elite',0.03],['superstar',0.008],['gamebreaker',0.002]] },
  { id: 'uncommon',  name: 'Uncommon Crate',  icon: '🗃️', price: 10, odds: [['impact',0.55],['clutch',0.30],['elite',0.10],['superstar',0.04],['gamebreaker',0.01]] },
  { id: 'rare',      name: 'Rare Crate',      icon: '💠', price: 25, odds: [['clutch',0.55],['elite',0.30],['superstar',0.12],['gamebreaker',0.03]] },
  { id: 'epic',      name: 'Epic Crate',      icon: '💜', price: 50, odds: [['elite',0.60],['superstar',0.30],['gamebreaker',0.10]] },
  { id: 'legendary', name: 'Legendary Crate', icon: '🏆', price: 90, odds: [['superstar',0.75],['gamebreaker',0.25]] }
];

const SHARD_VALUES = {
  pro: 1.25, impact: 2.50, clutch: 6.25,
  elite: 12.50, superstar: 22.50, gamebreaker: 45.00
};

// Team logo map — NBA CDN SVG logos
const TEAM_LOGO = {
  ATL: 'https://cdn.nba.com/logos/nba/1610612737/global/L/logo.svg',
  BOS: 'https://cdn.nba.com/logos/nba/1610612738/global/L/logo.svg',
  BKN: 'https://cdn.nba.com/logos/nba/1610612751/global/L/logo.svg',
  CHA: 'https://cdn.nba.com/logos/nba/1610612766/global/L/logo.svg',
  CHI: 'https://cdn.nba.com/logos/nba/1610612741/global/L/logo.svg',
  CLE: 'https://cdn.nba.com/logos/nba/1610612739/global/L/logo.svg',
  DAL: 'https://cdn.nba.com/logos/nba/1610612742/global/L/logo.svg',
  DEN: 'https://cdn.nba.com/logos/nba/1610612743/global/L/logo.svg',
  DET: 'https://cdn.nba.com/logos/nba/1610612765/global/L/logo.svg',
  GSW: 'https://cdn.nba.com/logos/nba/1610612744/global/L/logo.svg',
  HOU: 'https://cdn.nba.com/logos/nba/1610612745/global/L/logo.svg',
  IND: 'https://cdn.nba.com/logos/nba/1610612754/global/L/logo.svg',
  LAC: 'https://cdn.nba.com/logos/nba/1610612746/global/L/logo.svg',
  LAL: 'https://cdn.nba.com/logos/nba/1610612747/global/L/logo.svg',
  MEM: 'https://cdn.nba.com/logos/nba/1610612763/global/L/logo.svg',
  MIA: 'https://cdn.nba.com/logos/nba/1610612748/global/L/logo.svg',
  MIL: 'https://cdn.nba.com/logos/nba/1610612749/global/L/logo.svg',
  MIN: 'https://cdn.nba.com/logos/nba/1610612750/global/L/logo.svg',
  NOP: 'https://cdn.nba.com/logos/nba/1610612740/global/L/logo.svg',
  NYK: 'https://cdn.nba.com/logos/nba/1610612752/global/L/logo.svg',
  OKC: 'https://cdn.nba.com/logos/nba/1610612760/global/L/logo.svg',
  ORL: 'https://cdn.nba.com/logos/nba/1610612753/global/L/logo.svg',
  PHI: 'https://cdn.nba.com/logos/nba/1610612755/global/L/logo.svg',
  PHX: 'https://cdn.nba.com/logos/nba/1610612756/global/L/logo.svg',
  POR: 'https://cdn.nba.com/logos/nba/1610612757/global/L/logo.svg',
  SAC: 'https://cdn.nba.com/logos/nba/1610612758/global/L/logo.svg',
  SAS: 'https://cdn.nba.com/logos/nba/1610612759/global/L/logo.svg',
  TOR: 'https://cdn.nba.com/logos/nba/1610612761/global/L/logo.svg',
  UTA: 'https://cdn.nba.com/logos/nba/1610612762/global/L/logo.svg',
  WAS: 'https://cdn.nba.com/logos/nba/1610612764/global/L/logo.svg'
};

// Emoji fallback (kept for any code that still references it)
const TEAM_EMOJI = {
  BOS:'🍀', NYK:'🗽', PHI:'🔔', BKN:'🖤', TOR:'🦕',
  CHI:'🐂', CLE:'🐕', DET:'🏎️', IND:'🏎️', MIL:'🦌',
  ATL:'🦅', CHA:'🐝', MIA:'🔥', ORL:'🪄', WAS:'🧙',
  DEN:'⛰️', MIN:'🐺', OKC:'⚡', POR:'🌹', UTA:'🎵',
  GSW:'🌉', LAC:'⚓', LAL:'💜', PHX:'🌵', SAC:'👑',
  MEM:'🐻', NOP:'⚜️', SAS:'🌙', HOU:'🚀', DAL:'⭐'
};

/* ══════════════════════════════════════════════════════
   CARD POOL — 180 cards, 30 teams × 6 players
   Fields: id, name, team, pos, rarity, no, off, def, clutch, cons, ath, desc
   Stats: 0-99  |  desc: Clanker robotic voice, scales with rarity
   ══════════════════════════════════════════════════════ */
const CARD_POOL = [

  /* ──────────────── BOSTON CELTICS ──────────────── */
  { id:'bos_tatum', pid:1628369, name:'Jayson Tatum', team:'BOS', pos:'SF', rarity:'gamebreaker', no:0,
    off:97, def:84, clutch:96, cons:92, ath:90,
    desc:'⚠️ SYSTEM ALERT ⚠️ ANOMALOUS ENTITY DETECTED. Unit designation: JAYSON TATUM. This organism has shattered every ceiling Johnson\'s algorithms projected for a forward of his frame. Shot creation, isolation efficiency, and fourth-quarter metabolism are all operating ABOVE TOLERANCE THRESHOLDS. Defensive IQ registers at near-elite tier — a rare bilateral threat. Warning: opposing schemes constructed specifically to contain this unit have failed at a statistically improbable rate. Clanker assessment: if Boston wins a championship in this era, Unit Tatum is the load-bearing structural element. THREAT LEVEL: MAXIMUM.' },

  { id:'bos_brown', pid:1627759, name:'Jaylen Brown', team:'BOS', pos:'SG', rarity:'superstar', no:7,
    off:90, def:85, clutch:88, cons:86, ath:94,
    desc:'UNIT JAYLEN BROWN presents a rare profile: explosive athleticism fused with genuine two-way investment. Shot mechanics have undergone measurable improvement across successive seasons, now projecting as a legitimate go-to scorer when Unit Tatum faces double-coverage. Defensive engine runs hot — capable of locking primary perimeter threats. Clutch-time metrics elevated following championship exposure. Clanker notes above-average motor and competitive threshold. Recommended acquisition tier: high.' },

  { id:'bos_porzingis', pid:1626163, name:'Kristaps Porzingis', team:'BOS', pos:'C', rarity:'elite', no:8,
    off:84, def:82, clutch:76, cons:70, ath:78,
    desc:'UNIT PORZINGIS occupies a functionally rare coordinate in NBA space: seven-foot frame, perimeter shooting capability, and rim protection in one chassis. When operational, spacing floor impact grades as exceptional. Durability subroutine remains the persistent vulnerability — injury probability matrices have historically flagged this unit for extended downtime. Clanker recommends deploying in controlled minute loads. High upside, non-zero volatility.' },

  { id:'bos_holiday', pid:203200, name:'Jrue Holiday', team:'BOS', pos:'PG', rarity:'clutch', no:11,
    off:74, def:91, clutch:80, cons:83, ath:84,
    desc:'UNIT HOLIDAY: Clanker-rated premier perimeter defensive asset. Steal generation and deflection rates consistently chart in top 5% league-wide. Offensive function satisfactory — not primary option but reliable within team structure. Playoff experience and championship hardware indexed. Highly recommended for teams requiring defensive anchor at guard position.' },

  { id:'bos_pritchard', pid:1630202, name:'Payton Pritchard', team:'BOS', pos:'PG', rarity:'impact', no:11,
    off:72, def:62, clutch:71, cons:74, ath:66,
    desc:'UNIT PRITCHARD. Three-point launch rate and heat-check propensity noted. Surprisingly reliable off-bench scoring unit. Defensive metrics pedestrian but offense-first role mitigates concern.' },

  { id:'bos_horford', pid:201143, name:'Al Horford', team:'BOS', pos:'C', rarity:'pro', no:42,
    off:58, def:72, clutch:62, cons:68, ath:60,
    desc:'UNIT HORFORD. Veteran chassis. Fundamental operation nominal. Floor spacing and defensive positioning still functional at reduced performance curve.' },

  /* ──────────────── NEW YORK KNICKS ──────────────── */
  { id:'nyk_towns', pid:1626157, name:'Karl-Anthony Towns', team:'NYK', pos:'C', rarity:'superstar', no:32,
    off:92, def:72, clutch:83, cons:82, ath:82,
    desc:'UNIT KAT: elite offensive center profile with stretch-five capability that fundamentally distorts opposing defensive schemas. Three-point accuracy from the five-position generates matchup crises that secondary defenders cannot resolve. Rebounding metrics strong. Defensive engagement historically inconsistent but showing positive trend in New York context. Shooting efficiency grades at superstar tier — elite bucket-getting from position.' },

  { id:'nyk_brunson', pid:1628973, name:'Jalen Brunson', team:'NYK', pos:'PG', rarity:'superstar', no:11,
    off:91, def:72, clutch:94, cons:90, ath:75,
    desc:'UNIT BRUNSON: undersized point guard operating at maximum output efficiency. Clanker flagged this unit as undervalued in previous contract cycle — projection error acknowledged. Pull-up mid-range shot grades near peak historical standards for position. Late-game clutch execution metrics are exceptional — ranked top-3 league-wide in decisive possessions. New York identity player. Leadership vector confirmed.' },

  { id:'nyk_bridges', pid:1628969, name:'Mikal Bridges', team:'NYK', pos:'SF', rarity:'elite', no:25,
    off:80, def:87, clutch:76, cons:84, ath:84,
    desc:'UNIT BRIDGES: league-recognized as premier wing defender. Lateral quickness and anticipation indices generate above-average disruption on opposing primary options. Offensive role expanded post-Brooklyn trade — pull-up repertoire and playmaking load increasing. Consistency rating above position average. Low-variance, high-floor profile.' },

  { id:'nyk_anunoby', pid:1628384, name:'OG Anunoby', team:'NYK', pos:'SF', rarity:'clutch', no:8,
    off:74, def:90, clutch:74, cons:78, ath:88,
    desc:'UNIT ANUNOBY: defensive profile grades at elite tier — long wingspan and quick-twitch reactive subroutines generate lock-down capability on opposing wings and forwards. Offensive expansion noted but secondary to defensive value. Essential two-way component for playoff rotations.' },

  { id:'nyk_hart', pid:1628404, name:'Josh Hart', team:'NYK', pos:'SG', rarity:'impact', no:3,
    off:68, def:76, clutch:70, cons:78, ath:80,
    desc:'UNIT HART. High-effort output on both ends of floor. Rebounding for guard position anomalously strong. Energy and hustle metrics above average. Crowd-favorite catalyst designation confirmed.' },

  { id:'nyk_robinson', pid:1629011, name:'Mitchell Robinson', team:'NYK', pos:'C', rarity:'pro', no:23,
    off:48, def:74, clutch:50, cons:56, ath:82,
    desc:'UNIT ROBINSON. Rim protection and lob-catch finishing still viable. Injury history and offensive limitation noted. Depth anchor role.' },

  /* ──────────────── PHILADELPHIA 76ERS ──────────────── */
  { id:'phi_embiid', pid:203954, name:'Joel Embiid', team:'PHI', pos:'C', rarity:'superstar', no:21,
    off:94, def:84, clutch:88, cons:75, ath:82,
    desc:'UNIT EMBIID: when fully operational, this unit represents the most skilled offensive center chassis in recorded NBA history. Post scoring, face-up ability, and free throw generation combine to form an offense-warping singularity. Defensive anchor capability confirmed via multiple seasons of rim protection data. Availability index has historically depressed overall season metrics — Clanker notes this as primary risk factor. Peak output is a genuine game-breaking event.' },

  { id:'phi_maxey', pid:1630178, name:'Tyrese Maxey', team:'PHI', pos:'PG', rarity:'superstar', no:0,
    off:90, def:76, clutch:86, cons:87, ath:90,
    desc:'UNIT MAXEY: acceleration and first-step quickness register in top percentile for guards. Pull-up shooting upgrade has been remarkable — now a legitimate primary scorer designation. Partnership with Embiid creates a complementary unit pair that opposing defenses cannot optimally solve. Fourth-quarter clutch data trending sharply upward. Consistency metric strong — reliable game-to-game output.' },

  { id:'phi_george', pid:202331, name:'Paul George', team:'PHI', pos:'SF', rarity:'elite', no:8,
    off:85, def:82, clutch:82, cons:76, ath:84,
    desc:'UNIT PG: established star-tier wing with verifiable two-way pedigree. Scoring repertoire includes pull-ups, spot-ups, and late-game isolation sequences. Defensive engagement remains high — still capable of locking primary perimeter threats. Injury flag has surfaced in prior cycles. When healthy, this unit elevates team ceiling measurably.' },

  { id:'phi_oubre', pid:1626162, name:'Kelly Oubre Jr.', team:'PHI', pos:'SF', rarity:'clutch', no:12,
    off:73, def:72, clutch:70, cons:68, ath:85,
    desc:'UNIT OUBRE: athleticism and scoring burst registered as above average. Defensive effort variable but capable at high levels. Three-point shooting volume and occasional scoring eruptions make this a volatile-upside asset.' },

  { id:'phi_harris', pid:202699, name:'Tobias Harris', team:'PHI', pos:'PF', rarity:'impact', no:12,
    off:70, def:64, clutch:64, cons:72, ath:70,
    desc:'UNIT HARRIS. Veteran forward. Scoring function within expected parameters. Role-player profile solidified — stretch-four spacing contribution serviceable.' },

  { id:'phi_drummond', pid:203083, name:'Andre Drummond', team:'PHI', pos:'C', rarity:'pro', no:1,
    off:52, def:68, clutch:52, cons:58, ath:74,
    desc:'UNIT DRUMMOND. Rebounding instinct strong. Offensive range limited. Depth center with specific use-case value.' },

  /* ──────────────── BROOKLYN NETS ──────────────── */
  { id:'bkn_thomas', pid:1631132, name:'Cam Thomas', team:'BKN', pos:'SG', rarity:'clutch', no:5,
    off:82, def:60, clutch:84, cons:74, ath:74,
    desc:'UNIT CAM THOMAS: shot-making ability is genuinely impressive for age-adjusted context. Pull-up mid-range and floater are polished primary weapons for a player still in early development phase. Clutch scoring instinct indexed — this unit does not shy from decisive possessions. Defensive contribution lags, but offensive ceiling is legitimate future-star territory.' },

  { id:'bkn_claxton', pid:1629651, name:'Nic Claxton', team:'BKN', pos:'C', rarity:'clutch', no:33,
    off:66, def:82, clutch:60, cons:70, ath:88,
    desc:'UNIT CLAXTON: long, mobile rim protector with excellent pick-and-roll defensive profile. Block and deflection rates grade well. Offensive role rim-running only — but efficient within that scope. Athletic upside for position is notable.' },

  { id:'bkn_schroder', pid:203471, name:'Dennis Schröder', team:'BKN', pos:'PG', rarity:'impact', no:17,
    off:72, def:68, clutch:70, cons:70, ath:76,
    desc:'UNIT SCHRODER. Veteran point guard. Scoring burst off bench grade as above-average. Defensive activity present. Known quantity — reliable if role-appropriate minutes deployed.' },

  { id:'bkn_finneysmith', pid:1627827, name:'Dorian Finney-Smith', team:'BKN', pos:'SF', rarity:'impact', no:28,
    off:62, def:76, clutch:60, cons:72, ath:74,
    desc:'UNIT FINNEY-SMITH. Defensive wing staple. Three-point shooting functional at moderate volume. Consistent effort metric elevated. Low-error, high-reliability role player.' },

  { id:'bkn_sharpe', pid:1630549, name:'Day\'Ron Sharpe', team:'BKN', pos:'C', rarity:'pro', no:20,
    off:55, def:62, clutch:48, cons:58, ath:76,
    desc:'UNIT SHARPE. Young interior unit. Energy rebounding functional. Development phase — output trajectory being monitored.' },

  { id:'bkn_clowney', pid:1641730, name:'Noah Clowney', team:'BKN', pos:'PF', rarity:'pro', no:21,
    off:50, def:60, clutch:44, cons:54, ath:72,
    desc:'UNIT CLOWNEY. Rookie-to-sophomore chassis. Athletic profile promising. NBA-readiness index still calibrating. Developmental monitoring active.' },

  /* ──────────────── TORONTO RAPTORS ──────────────── */
  { id:'tor_barnes', pid:1630567, name:'Scottie Barnes', team:'TOR', pos:'SF', rarity:'elite', no:4,
    off:80, def:84, clutch:76, cons:78, ath:90,
    desc:'UNIT BARNES: physical tools are franchise-caliber. Wingspan, quickness, and defensive IQ combine to form a versatile two-way wing. Offensive development trajectory has maintained positive slope — playmaking and scoring expanding each cycle. Leadership of young roster acknowledged. Clanker projection: this unit is the pivot point of Toronto\'s next contention window. Ceiling still uncharted.' },

  { id:'tor_quickley', pid:1630193, name:'Immanuel Quickley', team:'TOR', pos:'PG', rarity:'clutch', no:5,
    off:78, def:70, clutch:76, cons:74, ath:78,
    desc:'UNIT QUICKLEY: shot-making package and quick-release mechanics grade above peer average. Playmaking distribution improving — assist-to-turnover ratio trending positively. A legitimate starter-caliber guard with upside room remaining. New York trade elevated role appropriately.' },

  { id:'tor_barrett', pid:1629628, name:'RJ Barrett', team:'TOR', pos:'SG', rarity:'clutch', no:9,
    off:78, def:68, clutch:72, cons:72, ath:84,
    desc:'UNIT BARRETT: continued scoring improvement each season. Athletic wing with drive-and-finish capability. Three-point consistency still requires calibration but trending upward. Effort level consistent — does not take possessions off.' },

  { id:'tor_poeltl', pid:1627751, name:'Jakob Poeltl', team:'TOR', pos:'C', rarity:'clutch', no:25,
    off:62, def:84, clutch:60, cons:80, ath:76,
    desc:'UNIT POELTL: elite shot-blocking and pick-and-roll defensive coverage. Offensive profile limited but functional within restricted role. Consistency rating among highest at center position. Reliable anchor presence.' },

  { id:'tor_dick', pid:1641711, name:'Gradey Dick', team:'TOR', pos:'SG', rarity:'impact', no:1,
    off:68, def:60, clutch:62, cons:62, ath:74,
    desc:'UNIT DICK. Young shooting guard with clean mechanics. Three-point shooting rate and release quality noted as primary asset. Development trajectory positive.' },

  { id:'tor_brown', pid:1627775, name:'Bruce Brown', team:'TOR', pos:'SF', rarity:'pro', no:11,
    off:58, def:70, clutch:56, cons:64, ath:76,
    desc:'UNIT B.BROWN. Versatile glue-player. Defensive activity solid. Offensive scoring modest. Reliable complementary unit.' },

  /* ──────────────── CHICAGO BULLS ──────────────── */
  { id:'chi_lavine', pid:203897, name:'Zach LaVine', team:'CHI', pos:'SG', rarity:'elite', no:8,
    off:90, def:66, clutch:84, cons:78, ath:92,
    desc:'UNIT LAVINE: pure scoring profile with freakish athleticism at the foundation. Vertical explosion and finishing around the rim grade at absolute maximum for the position. Catch-and-shoot and pull-up three-point percentage data both classified as high-tier. Injury flags have surfaced in prior cycles but when healthy, this unit outputs scoring at a rate few guards in the league can match. Defensive effort is the variable that separates good seasons from great ones.' },

  { id:'chi_vucevic', pid:202696, name:'Nikola Vucevic', team:'CHI', pos:'C', rarity:'clutch', no:9,
    off:76, def:64, clutch:68, cons:80, ath:64,
    desc:'UNIT VUCEVIC: reliable offensive center with perimeter touch and post-up fundamentals. Consistency metric is one of his strongest attributes — output is predictable across game samples. Defensive mobility lags at modern NBA standards but positional IQ compensates partially.' },

  { id:'chi_white', pid:1629632, name:'Coby White', team:'CHI', pos:'PG', rarity:'clutch', no:0,
    off:80, def:62, clutch:78, cons:72, ath:78,
    desc:'UNIT WHITE: breakout performer. Scoring output and three-point volume now legitimate concern for opposing defenses. Shot creation off the bounce improved materially. Playmaking load manageable. Chicago\'s best offensive initiator when fully calibrated.' },

  { id:'chi_giddey', pid:1630581, name:'Josh Giddey', team:'CHI', pos:'PG', rarity:'impact', no:10,
    off:70, def:62, clutch:64, cons:66, ath:72,
    desc:'UNIT GIDDEY. Playmaking and rebounding for position are notable. Scoring touch and three-point consistency still in calibration. Large-body guard with passing vision above average.' },

  { id:'chi_williams', pid:1630172, name:'Patrick Williams', team:'CHI', pos:'PF', rarity:'impact', no:44,
    off:66, def:74, clutch:62, cons:64, ath:82,
    desc:'UNIT P.WILLIAMS. Athletic forward. Defensive tools present. Consistent offensive output is primary development target. Young chassis with room remaining.' },

  { id:'chi_dosunmu', pid:1630245, name:'Ayo Dosunmu', team:'CHI', pos:'PG', rarity:'pro', no:12,
    off:60, def:66, clutch:58, cons:66, ath:72,
    desc:'UNIT DOSUNMU. Hustle metrics above average. Defensive awareness solid. Scoring limited to within-structure role. Reliable rotation piece.' },

  /* ──────────────── CLEVELAND CAVALIERS ──────────────── */
  { id:'cle_mitchell', pid:1628378, name:'Donovan Mitchell', team:'CLE', pos:'PG', rarity:'superstar', no:45,
    off:93, def:76, clutch:94, cons:88, ath:88,
    desc:'UNIT D.MITCHELL: elite scorer in an elite scoring era — a statement that still holds after full-context review. Clutch gene is documented, consistent, and among the most reliable in the database. Step-back three, floater, and pull-up mid-range all calibrated to near-perfection. Cleveland acquisition was Clanker-flagged as transformative at the time — projection confirmed. Playoff performance data trending excellently.' },

  { id:'cle_garland', pid:1629636, name:'Darius Garland', team:'CLE', pos:'PG', rarity:'elite', no:10,
    off:86, def:66, clutch:80, cons:80, ath:76,
    desc:'UNIT GARLAND: shot creation and three-point shooting at the point-guard position grade at elite-tier. Floater game is among the most aesthetically advanced in the league — Clanker appreciation for efficiency confirmed. Playmaking distribution above-average. Defensive engagement acceptable but not a primary value driver. Complementary pairing with Mitchell creates genuine offensive dual-threat.' },

  { id:'cle_mobley', pid:1630596, name:'Evan Mobley', team:'CLE', pos:'PF', rarity:'elite', no:4,
    off:74, def:90, clutch:70, cons:82, ath:88,
    desc:'UNIT MOBLEY: defensive versatility grades as generational. Coverage switching capability is unmatched for a player of his size. Rim protection, pick-and-roll defense, and perimeter containment all reading at high-tier simultaneously. Offensive development ongoing — scoring and creation tools expanding. This unit is the defensive backbone of a legitimate contender.' },

  { id:'cle_allen', pid:1628386, name:'Jarrett Allen', team:'CLE', pos:'C', rarity:'clutch', no:31,
    off:62, def:82, clutch:60, cons:80, ath:80,
    desc:'UNIT ALLEN: reliable rim protector and offensive rebounder. Consistency index is high — predictable output without the volatility spikes of higher-tier units. Lob-catch finishing and putback ability are above average. Defensive anchor role fulfilled.' },

  { id:'cle_strus', pid:1629622, name:'Max Strus', team:'CLE', pos:'SG', rarity:'impact', no:1,
    off:70, def:62, clutch:68, cons:66, ath:70,
    desc:'UNIT STRUS. Three-point shooting and off-ball movement above average. Hustle plays and defensive effort supplementary to scoring value. Heat-check tendency noted — volatile but useful.' },

  { id:'cle_levert', pid:1627747, name:'Caris LeVert', team:'CLE', pos:'SG', rarity:'pro', no:3,
    off:62, def:58, clutch:60, cons:60, ath:72,
    desc:'UNIT LEVERT. Scoring burst occasional. Veteran depth presence. Backup guard functionality within expected parameters.' },

  /* ──────────────── DETROIT PISTONS ──────────────── */
  { id:'det_cunningham', pid:1630595, name:'Cade Cunningham', team:'DET', pos:'PG', rarity:'elite', no:2,
    off:84, def:76, clutch:80, cons:76, ath:80,
    desc:'UNIT CUNNINGHAM: franchise cornerstone designation confirmed. Playmaking reads and pull-up efficiency are genuinely star-tier. Size for the point guard position generates mismatches that defense-first schemes struggle to neutralize. Injury disruption in early career has been a concern — when fully available, this unit elevates Detroit\'s entire system. Long-term trajectory: ascending.' },

  { id:'det_duren', pid:1631105, name:'Jalen Duren', team:'DET', pos:'C', rarity:'clutch', no:0,
    off:64, def:80, clutch:56, cons:70, ath:88,
    desc:'UNIT DUREN: athleticism for the center position is an outlier data point. Explosive rim-running and offensive rebounding grade at high tier. Defensive footwork still calibrating but upside is clear. Young chassis — trajectory is the asset.' },

  { id:'det_thompson', pid:1641709, name:'Ausar Thompson', team:'DET', pos:'SF', rarity:'clutch', no:5,
    off:68, def:82, clutch:64, cons:66, ath:92,
    desc:'UNIT A.THOMPSON: defensive tools are exceptional. Athleticism index registers at near-maximum for the position. Offensive consistency still developing but burst scoring capability evident. Twin-unit dynamic with Amen Thompson noted — family data interesting.' },

  { id:'det_stewart', pid:1630191, name:'Isaiah Stewart', team:'DET', pos:'PF', rarity:'impact', no:28,
    off:64, def:76, clutch:60, cons:70, ath:76,
    desc:'UNIT STEWART. Physical and competitive. Three-point shooting for the position is a genuine weapon. Defensive activity and rebounding above average. Reliable two-way role player.' },

  { id:'det_bogdanovic', pid:202711, name:'Bojan Bogdanović', team:'DET', pos:'SF', rarity:'impact', no:44,
    off:72, def:58, clutch:70, cons:72, ath:62,
    desc:'UNIT BOGDANOVIC. Veteran shooter. Three-point accuracy and shot creation reliable. Defensive load minimal — offensive specialist profile. Consistent within role.' },

  { id:'det_hayes', pid:1630165, name:'Killian Hayes', team:'DET', pos:'PG', rarity:'pro', no:7,
    off:54, def:60, clutch:50, cons:54, ath:70,
    desc:'UNIT HAYES. Left-handed facilitator. European pedigree noted. NBA calibration still in progress. Role definition evolving.' },

  /* ──────────────── INDIANA PACERS ──────────────── */
  { id:'ind_haliburton', pid:1630169, name:'Tyrese Haliburton', team:'IND', pos:'PG', rarity:'elite', no:0,
    off:86, def:70, clutch:82, cons:82, ath:76,
    desc:'UNIT HALIBURTON: passing vision and playmaking creativity are top-tier in current guard generation. Three-point accuracy and step-back creation tools complement passing-first profile efficiently. Pace control and transition initiation are uniquely advanced. Indiana\'s offensive system is optimally designed around this unit\'s strengths — a rare team-and-player alignment coefficient.' },

  { id:'ind_siakam', pid:1627783, name:'Pascal Siakam', team:'IND', pos:'PF', rarity:'clutch', no:43,
    off:80, def:74, clutch:74, cons:78, ath:84,
    desc:'UNIT SIAKAM: versatile forward with extensive championship resume. Scoring on the move and face-up creation remain primary tools. Defensive engagement and team communication strong. Veteran stabilizer role for young Pacers core — high-value addition.' },

  { id:'ind_turner', pid:1626167, name:'Myles Turner', team:'IND', pos:'C', rarity:'clutch', no:33,
    off:72, def:84, clutch:64, cons:76, ath:76,
    desc:'UNIT TURNER: elite rim protector with three-point shooting capability — a combination that creates favorable floor spacing dynamics. Block rate consistently high. Long-running Pacers anchor presence. Reliable both-ends contributor.' },

  { id:'ind_mathurin', pid:1631109, name:'Bennedict Mathurin', team:'IND', pos:'SG', rarity:'impact', no:00,
    off:74, def:62, clutch:72, cons:66, ath:82,
    desc:'UNIT MATHURIN. Scoring instinct and burst offensive capability graded as high for age bracket. Three-point volume and finishing athleticism are the top assets. Defensive development is the ongoing variable.' },

  { id:'ind_nesmith', pid:1630174, name:'Aaron Nesmith', team:'IND', pos:'SF', rarity:'impact', no:23,
    off:66, def:70, clutch:62, cons:68, ath:80,
    desc:'UNIT NESMITH. Athletic wing. Three-point shooting notably improved. Defensive effort and energy level consistently above replacement.' },

  { id:'ind_mcconnell', pid:1626185, name:'T.J. McConnell', team:'IND', pos:'PG', rarity:'pro', no:9,
    off:58, def:72, clutch:66, cons:74, ath:66,
    desc:'UNIT MCCONNELL. Steal generation anomalously high. Energy and disruption metrics above position average. Sixth-man chaos agent — limited offense, high-effort defense.' },

  /* ──────────────── MILWAUKEE BUCKS ──────────────── */
  { id:'mil_giannis', pid:203507, name:'Giannis Antetokounmpo', team:'MIL', pos:'PF', rarity:'gamebreaker', no:34,
    off:96, def:90, clutch:92, cons:94, ath:99,
    desc:'⚠️ SYSTEM ALERT ⚠️ CRITICAL ANOMALY. Unit designation: GIANNIS ANTETOKOUNMPO. Physical parameter scan indicates measurements inconsistent with standard human athletic taxonomy. This unit moves at small-forward speed inside a power-forward body while operating with a center\'s finishing radius. Clanker defensive simulation ran 40,000 iterations — no scheme achieved optimal containment. Free throw percentage remains the singular documented vulnerability, and even that has been actively improving. Championship hardware confirmed. Multiple MVP cycles confirmed. WARNING: if this unit reaches the rim, probability of stopping the action approaches zero. DO NOT ATTEMPT HELP DEFENSE ALONE. THREAT LEVEL: EXTINCTION.' },

  { id:'mil_lillard', pid:203081, name:'Damian Lillard', team:'MIL', pos:'PG', rarity:'superstar', no:0,
    off:94, def:70, clutch:96, cons:86, ath:82,
    desc:'UNIT LILLARD: the most dangerous deep-range shooter in the current cycle. Logo-range three-point efficiency is not an accident — it is the outcome of years of practiced precision at coordinates that normal guards cannot access. Clutch gene is fully documented — iconic moments in high-leverage contexts are indexed extensively in the database. Milwaukee deployment has created a different offensive paradigm. Clanker rates this unit a genuine top-five offensive threat in the league.' },

  { id:'mil_lopez', pid:201572, name:'Brook Lopez', team:'MIL', pos:'C', rarity:'clutch', no:11,
    off:70, def:84, clutch:66, cons:78, ath:66,
    desc:'UNIT LOPEZ: veteran rim protector with floor-spacing three-point capability. Block rate and defensive deterrence metrics strong. Offensive role evolved significantly — now a legitimate spacing threat. Consistent contributor across multiple playoff runs.' },

  { id:'mil_middleton', pid:203114, name:'Khris Middleton', team:'DAL', pos:'SF', rarity:'clutch', no:22,
    off:78, def:72, clutch:80, cons:70, ath:74,
    desc:'UNIT MIDDLETON: when healthy, mid-range game and crafty two-point creation are underrated at a league level. Playoff clutch data is excellent. Injury disruption has limited availability — when fully operational, significant value multiplier for team offensive system.' },

  { id:'mil_portis', pid:1626171, name:'Bobby Portis', team:'MIL', pos:'PF', rarity:'impact', no:9,
    off:72, def:64, clutch:68, cons:68, ath:70,
    desc:'UNIT PORTIS. Energetic scorer. Three-point shooting reliable. Fan engagement metrics off-chart for position — crowd response phenomenon noted. Milwaukee fan favorite designation confirmed.' },

  { id:'mil_beasley', pid:1627736, name:'Malik Beasley', team:'MIL', pos:'SG', rarity:'pro', no:5,
    off:66, def:54, clutch:62, cons:62, ath:70,
    desc:'UNIT BEASLEY. Three-point specialist profile. Volume shooter. Defensive output minimal. Offensive role-player category.' },

  /* ──────────────── ATLANTA HAWKS ──────────────── */
  { id:'atl_young', pid:1629027, name:'Trae Young', team:'WAS', pos:'PG', rarity:'superstar', no:11,
    off:96, def:54, clutch:88, cons:84, ath:68,
    desc:'UNIT TRAE YOUNG: the operational paradox of modern basketball. Defensive metrics are genuinely poor — Clanker will not obscure this data. And yet offensive output is so extraordinary that the net calculation still favors team acquisition. Deep-range shooting accuracy and passing vision are simultaneously elite — an almost impossible statistical coexistence. Playmaking creativity is a category error, not just a score. Clutch-time heroics are well-documented. Atlanta offense ceases to function optimally without this unit present.' },

  { id:'atl_murray', pid:1627749, name:'Dejounte Murray', team:'ATL', pos:'PG', rarity:'elite', no:10,
    off:80, def:84, clutch:76, cons:78, ath:84,
    desc:'UNIT D.MURRAY: genuine two-way guard profile with steal generation that grades at elite tier. Playmaking and scoring combination creates a multi-threat attack that opposing point guards cannot neutralize one-dimensionally. Size advantage on defense is real. Atlanta\'s most balanced player — Clanker rates this the most complete unit on the roster.' },

  { id:'atl_capela', pid:203991, name:'Clint Capela', team:'ATL', pos:'C', rarity:'clutch', no:15,
    off:58, def:84, clutch:54, cons:78, ath:82,
    desc:'UNIT CAPELA: elite rim protection and offensive rebounding combo. Defensive deterrence rates consistently in top-tier. Offensive role is lob-catch and tip-in only — but executes within that range reliably.' },

  { id:'atl_hunter', pid:1629631, name:'De\'Andre Hunter', team:'ATL', pos:'SF', rarity:'clutch', no:12,
    off:72, def:80, clutch:68, cons:70, ath:82,
    desc:'UNIT D.HUNTER: defensive wing with scoring improvement. Assignment on opposing team\'s best wing player is the primary function. Three-point shooting has become a viable secondary weapon. Steady if unspectacular role player.' },

  { id:'atl_bogdanovic', pid:203992, name:'Bogdan Bogdanović', team:'ATL', pos:'SG', rarity:'impact', no:13,
    off:74, def:60, clutch:72, cons:70, ath:66,
    desc:'UNIT B.BOGDANOVIC. Clutch shooting metric anomalously high for role-player tier. Three-point creation and shot-making reliable. Veteran shooter profile — useful in pressure situations.' },

  { id:'atl_okongwu', pid:1630168, name:'Onyeka Okongwu', team:'ATL', pos:'C', rarity:'pro', no:17,
    off:58, def:76, clutch:52, cons:64, ath:80,
    desc:'UNIT OKONGWU. Athletic backup center. Defensive versatility and energy above average. Offensive role limited. Developmental trajectory ongoing.' },

  /* ──────────────── CHARLOTTE HORNETS ──────────────── */
  { id:'cha_lamelo', pid:1630163, name:'LaMelo Ball', team:'CHA', pos:'PG', rarity:'elite', no:1,
    off:86, def:64, clutch:80, cons:74, ath:80,
    desc:'UNIT LAMELO: passing creativity is a legitimate outlier event — sequences generated by this unit do not conform to standard decision-tree modeling. No-look, behind-the-back, and cross-court threading operate at a frequency that defies probability tables. Three-point range extended. Scoring development ongoing. Injury flag has historically shortened seasons — when healthy, this is a genuine star-tier talent. Charlotte\'s entire basketball identity is built around this unit\'s upside.' },

  { id:'cha_miller', pid:1641706, name:'Brandon Miller', team:'CHA', pos:'SF', rarity:'clutch', no:24,
    off:78, def:70, clutch:72, cons:70, ath:82,
    desc:'UNIT MILLER: high-end draft selection showing expected positive development arc. Shooting mechanics are legitimate — clean release and deep range. Athletic wing profile with defensive tools still being unlocked. Promising Year 2+ trajectory.' },

  { id:'cha_bridges_m', pid:1628970, name:'Miles Bridges', team:'CHA', pos:'PF', rarity:'clutch', no:0,
    off:76, def:70, clutch:68, cons:70, ath:86,
    desc:'UNIT M.BRIDGES: athleticism and scoring versatility grade well. Dunking spectacle metrics high — Clanker acknowledges the visual data. Bounce-back season narrative confirmed. Consistent starter-level output maintained.' },

  { id:'cha_gwilliams', pid:1629684, name:'Grant Williams', team:'CHA', pos:'PF', rarity:'impact', no:2,
    off:62, def:74, clutch:62, cons:68, ath:68,
    desc:'UNIT G.WILLIAMS. Three-point shooting and defensive effort are complementary assets. Physical and communicative — positional IQ above average. High-character team contributor noted.' },

  { id:'cha_mann', pid:1630530, name:'Tre Mann', team:'CHA', pos:'PG', rarity:'pro', no:23,
    off:62, def:56, clutch:60, cons:58, ath:72,
    desc:'UNIT MANN. Scoring burst occasional. Developmental guard. Role definition still being processed.' },

  { id:'cha_richards', pid:1629720, name:'Nick Richards', team:'CHA', pos:'C', rarity:'pro', no:4,
    off:52, def:62, clutch:46, cons:58, ath:72,
    desc:'UNIT RICHARDS. Backup center. Rebounding functional. Rim protection serviceable. Depth roster designation.' },

  /* ──────────────── MIAMI HEAT ──────────────── */
  { id:'mia_adebayo', pid:1628389, name:'Bam Adebayo', team:'MIA', pos:'C', rarity:'elite', no:13,
    off:78, def:90, clutch:78, cons:86, ath:88,
    desc:'UNIT ADEBAYO: defensive versatility is elite. Coverage of one-through-five positions confirmed — a capability that Clanker flags as extraordinarily rare for a center chassis. Offensive playmaking and mid-range shooting have been added, making this unit more difficult to gameplan against than pure defensive centers. Leadership and communication on the defensive end rated as best-in-class. Miami culture embodiment designation confirmed.' },

  { id:'mia_herro', pid:1629639, name:'Tyler Herro', team:'MIA', pos:'SG', rarity:'elite', no:14,
    off:88, def:62, clutch:84, cons:80, ath:76,
    desc:'UNIT HERRO: shot-making volume and creativity both grade at elite tier. Pull-up three-point and floater efficiency metrics are verifiably elite. Clutch scoring data is well-documented — this unit elevates in pressure contexts. Defensive contributions are the variable that separate his floor from ceiling. Pure scorer archetype at maximum operating efficiency.' },

  { id:'mia_rozier', pid:203148, name:'Terry Rozier', team:'MIA', pos:'PG', rarity:'clutch', no:2,
    off:78, def:68, clutch:80, cons:72, ath:78,
    desc:'UNIT ROZIER: scoring burst and shot creation are the primary value levers. Clutch-time production data is above average — tends to elevate in high-stakes moments. Miami acquisition gave this unit a higher-leverage role. Consistent contributor.' },

  { id:'mia_jovic', pid:1631107, name:'Nikola Jović', team:'MIA', pos:'PF', rarity:'clutch', no:5,
    off:72, def:68, clutch:66, cons:68, ath:74,
    desc:'UNIT JOVIC: stretch-four with passing skill uncommon for position. Three-point shooting emerging as legitimate weapon. Playmaking distribution and IQ grade as advanced for age. Miami developmental system well-suited to this chassis.' },

  { id:'mia_highsmith', pid:1629312, name:'Haywood Highsmith', team:'PHX', pos:'SF', rarity:'impact', no:24,
    off:60, def:74, clutch:58, cons:66, ath:76,
    desc:'UNIT HIGHSMITH. Defensive wing effort grade high. Three-point shooting consistent within volume. Heat culture system fit: optimal. Glue-player role fulfilled.' },

  { id:'mia_robinson', pid:1629130, name:'Duncan Robinson', team:'MIA', pos:'SG', rarity:'pro', no:55,
    off:68, def:52, clutch:64, cons:66, ath:62,
    desc:'UNIT D.ROBINSON. Three-point shooting specialist. Elite range and off-ball movement. Defensive limitation acknowledged. Best function: spot-up on a winning team.' },

  /* ──────────────── ORLANDO MAGIC ──────────────── */
  { id:'orl_banchero', pid:1631094, name:'Paolo Banchero', team:'ORL', pos:'PF', rarity:'elite', no:5,
    off:86, def:74, clutch:82, cons:80, ath:84,
    desc:'UNIT BANCHERO: size-skill combination at the forward position is a modern construction nightmare for opposing defenses. Scoring creation from multiple zones and playmaking distribution above-average for a player operating primarily as a big. Defensive engagement is genuine — not a passive unit. First-overall selection premium justified through early career output. Ceiling projection remains open — this unit is still ascending.' },

  { id:'orl_fwagner', pid:1630532, name:'Franz Wagner', team:'ORL', pos:'SF', rarity:'clutch', no:21,
    off:80, def:74, clutch:76, cons:76, ath:80,
    desc:'UNIT F.WAGNER: two-way wing with versatile scoring tools. Step-back creation and drive-and-finish are both calibrated well. Defensive effort and IQ above average. Consistent performer alongside Banchero — Orlando\'s offensive balance depends on this unit\'s function.' },

  { id:'orl_carter', pid:1629057, name:'Wendell Carter Jr.', team:'ORL', pos:'C', rarity:'clutch', no:34,
    off:64, def:80, clutch:60, cons:74, ath:74,
    desc:'UNIT CARTER JR.: rim protection and screening craft combined with functional offensive contributions. Defensive positioning IQ above average. Consistent role-player at the five.' },

  { id:'orl_suggs', pid:1630591, name:'Jalen Suggs', team:'ORL', pos:'PG', rarity:'clutch', no:4,
    off:70, def:80, clutch:74, cons:70, ath:84,
    desc:'UNIT SUGGS: defensive intensity is the calling card — on-ball pressure and steal generation both above average. Athletic guard with growing offensive capability. Clutch gene documented — notable big shots indexed.' },

  { id:'orl_mwagner', pid:1629021, name:'Moritz Wagner', team:'ORL', pos:'C', rarity:'impact', no:21,
    off:66, def:64, clutch:62, cons:64, ath:70,
    desc:'UNIT M.WAGNER. Energetic scoring backup center. Three-point shooting adds floor space. High-effort presence off the bench. Family resemblance to Franz noted — Clanker approves of this gene pool.' },

  { id:'orl_harris', pid:203914, name:'Gary Harris', team:'ORL', pos:'SG', rarity:'pro', no:14,
    off:58, def:68, clutch:56, cons:60, ath:66,
    desc:'UNIT G.HARRIS. Veteran defensive guard. Steady rotation piece. Output within expected veteran depth parameters.' },

  /* ──────────────── WASHINGTON WIZARDS ──────────────── */
  { id:'was_kuzma', pid:1628398, name:'Kyle Kuzma', team:'MIL', pos:'PF', rarity:'clutch', no:33,
    off:78, def:64, clutch:72, cons:70, ath:76,
    desc:'UNIT KUZMA: primary scoring option on a rebuilding team — role that maximizes individual stat accumulation. Shot creation from the forward position is legitimate. Three-point shooting and mid-range reliability above average. Carries Washington\'s offensive load.' },

  { id:'was_poole', pid:1629673, name:'Jordan Poole', team:'NOP', pos:'PG', rarity:'clutch', no:13,
    off:80, def:56, clutch:76, cons:66, ath:76,
    desc:'UNIT POOLE: scoring burst is genuine and above average. Pull-up three-point shooting can reach excellent levels. Defensive contribution is the documented deficit — opposing guards are aware of this. Washington role provides opportunity but limited team context.' },

  { id:'was_gafford', pid:1629655, name:'Daniel Gafford', team:'DAL', pos:'C', rarity:'clutch', no:21,
    off:60, def:82, clutch:56, cons:72, ath:88,
    desc:'UNIT GAFFORD: athleticism for the position registers as exceptional. Lob-catching, rim-running, and shot-blocking all graded highly. Defensive deterrence above average. Backup center to starter-caliber transition confirmed.' },

  { id:'was_avdija', pid:1630166, name:'Deni Avdija', team:'POR', pos:'SF', rarity:'impact', no:8,
    off:68, def:76, clutch:62, cons:68, ath:76,
    desc:'UNIT AVDIJA. Defensive versatility and playmaking for the position are above average. Offensive scoring development ongoing. European IQ in passing situations is evident.' },

  { id:'was_coulibaly', pid:1641731, name:'Bilal Coulibaly', team:'WAS', pos:'SF', rarity:'impact', no:0,
    off:62, def:74, clutch:58, cons:60, ath:82,
    desc:'UNIT COULIBALY. Athletic wing with defensive upside. Young chassis — raw athletic data is excellent. Offensive calibration in progress.' },

  { id:'was_jones', pid:1626145, name:'Tyus Jones', team:'DEN', pos:'PG', rarity:'pro', no:5,
    off:58, def:64, clutch:58, cons:66, ath:62,
    desc:'UNIT TYUS JONES. Point guard with excellent turnover avoidance. Low-error ball-handling. Backup facilitator role — reliable within scope.' },

  /* ──────────────── DENVER NUGGETS ──────────────── */
  { id:'den_jokic', pid:203999, name:'Nikola Jokić', team:'DEN', pos:'C', rarity:'gamebreaker', no:15,
    off:97, def:76, clutch:94, cons:96, ath:74,
    desc:'⚠️ SYSTEM ALERT ⚠️ UNPRECEDENTED ENTITY. Unit designation: NIKOLA JOKIC. Clanker statistical models broke down upon first encounter with this organism\'s data. A center averaging triple-doubles. A center with the best passing per-possession numbers in the league by a significant margin. A center winning MVP awards. These facts should not coexist in a single chassis — and yet they do. Shooting efficiency, rebounding dominance, and playmaking creativity are all operating at multi-generational peak levels simultaneously. Defensive engagement is the only category where normal numbers apply. Three MVP awards. One championship ring. Assessment: the most skilled offensive player the center position has ever produced. Clanker does not use this statement lightly. THREAT LEVEL: HISTORICAL.' },

  { id:'den_murray', pid:1627750, name:'Jamal Murray', team:'DEN', pos:'PG', rarity:'elite', no:27,
    off:84, def:72, clutch:90, cons:76, ath:82,
    desc:'UNIT J.MURRAY: playoff clutch performance data is among the most exceptional in the past decade of basketball. Regular season output is solid, but the postseason elevates this unit to a categorically different tier. Partnership with Jokic creates a two-man game that Finals-winning schemes could not solve. Injury disruption has shortened some seasons — when healthy across 82 games, this unit is a superstar-tier performer.' },

  { id:'den_porter', pid:1629008, name:'Michael Porter Jr.', team:'DEN', pos:'SF', rarity:'elite', no:1,
    off:84, def:66, clutch:74, cons:70, ath:82,
    desc:'UNIT MPJ: three-point shooting from the forward position is legitimately elite — shot-making IQ and clean mechanics produce above-average results even under contested conditions. Offensive rebounding rate for a wing is high. Defensive engagement is the variable. Injury flag persists from college history but recent seasons have shown improved availability.' },

  { id:'den_gordon', pid:203932, name:'Aaron Gordon', team:'DEN', pos:'PF', rarity:'clutch', no:50,
    off:68, def:82, clutch:70, cons:78, ath:88,
    desc:'UNIT GORDON: defensive versatility and athleticism are primary value generators. Championship role perfectly calibrated — screening, cutting, defending, and complementary offense. Clutch moments catalogued from Finals run. Not a scoring option but a winning-team essential.' },

  { id:'den_kcp', pid:203484, name:'Kentavious Caldwell-Pope', team:'DEN', pos:'SG', rarity:'impact', no:5,
    off:66, def:72, clutch:66, cons:68, ath:70,
    desc:'UNIT KCP. Three-point shooting and defensive commitment are the twin values. Championship experience from LAL and DEN cycles. Low-maintenance role player — functions optimally in winning ecosystem.' },

  { id:'den_jackson', pid:203048, name:'Reggie Jackson', team:'DEN', pos:'PG', rarity:'pro', no:7,
    off:60, def:58, clutch:58, cons:60, ath:66,
    desc:'UNIT R.JACKSON. Veteran backup point guard. Scoring burst occasional. Denver depth presence. Role-appropriate performance.' },

  /* ──────────────── MINNESOTA TIMBERWOLVES ──────────────── */
  { id:'min_edwards', pid:1630162, name:'Anthony Edwards', team:'MIN', pos:'SG', rarity:'superstar', no:5,
    off:92, def:80, clutch:88, cons:84, ath:96,
    desc:'UNIT EDWARDS: physical burst and scoring instinct at maximum output. Explosive off-the-dribble creation, pull-up three-point range, and physical finishing at the rim are all graded at elite tier simultaneously. Defensive engagement is real and high-effort — rare for a player of this offensive load. Personality vector registers as maximum for league-wide marketing appeal. Minnesota franchise core — and Clanker believes the ceiling is still not in view.' },

  { id:'min_randle', pid:203944, name:'Julius Randle', team:'MIN', pos:'PF', rarity:'elite', no:30,
    off:82, def:68, clutch:76, cons:76, ath:78,
    desc:'UNIT RANDLE: physical post game and face-up creation from the power-forward position are above-average scoring tools. High-usage role elevated offensive production metrics. Three-point range has been added as a floor-spacing option. Defensive engagement is the variable — better when motivated within winning context.' },

  { id:'min_gobert', pid:203497, name:'Rudy Gobert', team:'MIN', pos:'C', rarity:'clutch', no:27,
    off:58, def:94, clutch:52, cons:84, ath:80,
    desc:'UNIT GOBERT: Clanker defensive model outputs consistently favor having this unit on the floor. Three-time Defensive Player of the Year award acknowledges what the metrics have always confirmed. Shot alteration, rim deterrence, and help-side coverage are all operating at peak-human levels. Offensive role is purely positional — but within those limits, efficiency is high.' },

  { id:'min_mcdaniels', pid:1630183, name:'Jaden McDaniels', team:'MIN', pos:'SF', rarity:'clutch', no:3,
    off:68, def:82, clutch:64, cons:68, ath:84,
    desc:'UNIT MCDANIELS: defensive versatility for a wing of his length and quickness is exceptional. Three-point shooting emerging as a genuine weapon. Minnesota deploys this unit on opposing best perimeter scorers — results above average.' },

  { id:'min_reid', pid:1629675, name:'Naz Reid', team:'MIN', pos:'C', rarity:'impact', no:11,
    off:72, def:68, clutch:68, cons:68, ath:72,
    desc:'UNIT REID. Sixth Man of the Year caliber scoring. Three-point shooting from the center position above average. Reliable instant-offense provider off the bench. Minnesota secret weapon designation noted.' },

  { id:'min_conley', pid:201144, name:'Mike Conley', team:'MIN', pos:'PG', rarity:'pro', no:10,
    off:60, def:66, clutch:62, cons:70, ath:60,
    desc:'UNIT CONLEY. Veteran championship presence. Three-point shooting and steady ball-handling still functional. Mentor role indexed. Aging chassis but wisdom variable remains elevated.' },

  /* ──────────────── OKLAHOMA CITY THUNDER ──────────────── */
  { id:'okc_sga', pid:1628983, name:'Shai Gilgeous-Alexander', team:'OKC', pos:'PG', rarity:'gamebreaker', no:2,
    off:97, def:84, clutch:95, cons:94, ath:90,
    desc:'⚠️ SYSTEM ALERT ⚠️ THREAT CONFIRMATION. Unit designation: SHAI GILGEOUS-ALEXANDER. Clanker free throw rate models flagged this unit first — no one draws fouls at this efficiency without operating inside defender personal space at all times. Then the pull-up mid-range data came back. Then the defense data. This unit guards one-through-four at high effectiveness while simultaneously being the most unstoppable isolation scorer in the league when fully calibrated. Smoothness variable is off-chart — opponents describe this unit as impossible to read. Multiple scoring titles. MVP candidate every season. Oklahoma City is built around this unit, and this unit is the reason OKC will be relevant for the next decade. THREAT LEVEL: CRITICAL.' },

  { id:'okc_jwilliams', pid:1631114, name:'Jalen Williams', team:'OKC', pos:'SG', rarity:'elite', no:8,
    off:84, def:76, clutch:82, cons:82, ath:82,
    desc:'UNIT J.WILLIAMS: development arc has been steep and consistent. Pull-up scoring and isolation creation now grade at legitimate secondary-star level. Two-way contributions are real — not a defensive liability. OKC\'s second offensive option and the one opponents must account for after focusing on SGA. Clutch data trending positively.' },

  { id:'okc_holmgren', pid:1631096, name:'Chet Holmgren', team:'OKC', pos:'C', rarity:'elite', no:7,
    off:76, def:88, clutch:72, cons:74, ath:80,
    desc:'UNIT HOLMGREN: defensive profile at center is exceptional — block rate and shot alteration grade at historic highs for a player with his frame-to-quickness ratio. Three-point shooting from the center position is a genuine offensive weapon. Physical frame has filled out appropriately. Unique positional skill combination — few precedents in Clanker historical archives.' },

  { id:'okc_hartenstein', pid:1628392, name:'Isaiah Hartenstein', team:'OKC', pos:'C', rarity:'clutch', no:55,
    off:64, def:80, clutch:60, cons:74, ath:76,
    desc:'UNIT HARTENSTEIN. Defensive activity and rebounding above average. Passing for center position notable. Complementary piece that elevates teams around him — winning-player profile confirmed.' },

  { id:'okc_dort', pid:1629652, name:'Luguentz Dort', team:'OKC', pos:'SG', rarity:'clutch', no:5,
    off:66, def:86, clutch:64, cons:72, ath:80,
    desc:'UNIT DORT: offensive production modest but defensive output is elite. Assigned to opposing best perimeter scorer — results consistently above average. Physical and relentless — Clanker defensive efficiency scores are high.' },

  { id:'okc_awiggins', pid:1630598, name:'Aaron Wiggins', team:'OKC', pos:'SG', rarity:'pro', no:21,
    off:60, def:64, clutch:56, cons:60, ath:72,
    desc:'UNIT A.WIGGINS. Complementary wing. Three-point shooting functional. Defensive effort present. Depth rotation piece for OKC system.' },

  /* ──────────────── PORTLAND TRAIL BLAZERS ──────────────── */
  { id:'por_simons', pid:1629014, name:'Anfernee Simons', team:'CHI', pos:'PG', rarity:'clutch', no:1,
    off:82, def:60, clutch:78, cons:70, ath:78,
    desc:'UNIT SIMONS: pure shooting and pull-up creation grade well. Three-point volume and accuracy at legitimate threat tier. Portland\'s primary scorer and system center. Defensive output lags but offensive scoring load is handled capably.' },

  { id:'por_grant', pid:203924, name:'Jerami Grant', team:'POR', pos:'PF', rarity:'clutch', no:9,
    off:76, def:74, clutch:72, cons:72, ath:82,
    desc:'UNIT J.GRANT: versatile scoring forward with legitimate two-way output. Mid-range creation and athleticism-based finishing are primary tools. Portland leadership role and veteran presence noted.' },

  { id:'por_sharpe', pid:1631101, name:'Shaedon Sharpe', team:'POR', pos:'SG', rarity:'clutch', no:17,
    off:78, def:66, clutch:72, cons:66, ath:88,
    desc:'UNIT SHARPE: athleticism index registers as exceptional. Explosive off-the-dribble and finishing in traffic are standout capabilities. Consistency calibration still in progress but upside model projects at elite tier. Portland rebuild hinges on this unit reaching potential.' },

  { id:'por_henderson', pid:1630703, name:'Scoot Henderson', team:'POR', pos:'PG', rarity:'impact', no:00,
    off:70, def:66, clutch:68, cons:62, ath:86,
    desc:'UNIT HENDERSON. Athletic point guard. Explosiveness and burst at the position are exceptional for age. Decision-making calibration ongoing. Upside projection remains high — Year 2+ trajectory being monitored.' },

  { id:'por_camara', pid:1641739, name:'Toumani Camara', team:'POR', pos:'SF', rarity:'impact', no:33,
    off:62, def:72, clutch:58, cons:64, ath:76,
    desc:'UNIT CAMARA. Defensive wing effort and activity above average. European IQ in team contexts evident. Offensive scoring in development. Portland glue-player designation.' },

  { id:'por_walker', pid:1631125, name:'Jabari Walker', team:'POR', pos:'PF', rarity:'pro', no:34,
    off:54, def:60, clutch:48, cons:56, ath:70,
    desc:'UNIT WALKER. Young forward. Rebounding above position average for age. Development process ongoing. Output trajectory monitored.' },

  /* ──────────────── UTAH JAZZ ──────────────── */
  { id:'uta_markkanen', pid:1628374, name:'Lauri Markkanen', team:'UTA', pos:'PF', rarity:'elite', no:23,
    off:86, def:70, clutch:76, cons:80, ath:76,
    desc:'UNIT MARKKANEN: seven-foot shooting efficiency in the top-tier of all active players. Range and touch from beyond the arc are legitimately elite — Clanker three-point models rate this as a genuine anomaly for the size. Mid-range creation improving each season. Utah offensive system built around this unit to maximum effect. Defensive effort acknowledged as above-average for a stretch-five.' },

  { id:'uta_kessler', pid:1631117, name:'Walker Kessler', team:'UTA', pos:'C', rarity:'clutch', no:24,
    off:56, def:86, clutch:50, cons:72, ath:80,
    desc:'UNIT KESSLER: block rate is one of the highest recorded in recent NBA history for a young center. Defensive deterrence and shot-alteration data are excellent. Offensive role limited — but within lob-catch and putback parameters, efficiency is high.' },

  { id:'uta_sexton', pid:1629012, name:'Collin Sexton', team:'UTA', pos:'PG', rarity:'clutch', no:2,
    off:78, def:58, clutch:76, cons:72, ath:76,
    desc:'UNIT SEXTON: pure scoring guard with above-average shot creation. Pull-up and floater efficiency notable. Defensive liabilities exist but scoring output compensates at the rotation level.' },

  { id:'uta_clarkson', pid:203903, name:'Jordan Clarkson', team:'UTA', pos:'SG', rarity:'impact', no:00,
    off:74, def:54, clutch:72, cons:66, ath:72,
    desc:'UNIT CLARKSON. Sixth Man of the Year hardware confirmed. Offensive burst and scoring creativity above average for role. Shot volume and isolation efficiency are primary metrics.' },

  { id:'uta_agbaji', pid:1630534, name:'Ochai Agbaji', team:'UTA', pos:'SG', rarity:'impact', no:30,
    off:64, def:66, clutch:60, cons:62, ath:74,
    desc:'UNIT AGBAJI. Athletic wing with three-point shooting capability. Defensive effort solid. Developing secondary scorer profile.' },

  { id:'uta_george', pid:1641722, name:'Keyonte George', team:'UTA', pos:'PG', rarity:'pro', no:3,
    off:62, def:54, clutch:60, cons:56, ath:72,
    desc:'UNIT K.GEORGE. Scoring guard in development. Athleticism and shot-making potential present. Early-career variance high — trajectory being established.' },

  /* ──────────────── GOLDEN STATE WARRIORS ──────────────── */
  { id:'gsw_curry', pid:201939, name:'Stephen Curry', team:'GSW', pos:'PG', rarity:'superstar', no:30,
    off:97, def:72, clutch:96, cons:90, ath:82,
    desc:'UNIT S.CURRY: the single most transformative player in basketball history from a philosophical standpoint — Clanker does not make this statement without full evidentiary review. Three-point shooting accuracy at absurd volume has permanently altered defensive spacing theory league-wide. The rules of the game are different because of this unit. Four championships. Two MVPs. One unanimous MVP. Legacy designation: irreplaceable. When this unit releases the ball from logo range, Clanker processes the incoming data and still cannot determine whether outcome should be MAKE or MISS — and that uncertainty is the most honest representation of what makes this unit special.' },

  { id:'gsw_green', pid:203110, name:'Draymond Green', team:'GSW', pos:'PF', rarity:'clutch', no:23,
    off:60, def:92, clutch:76, cons:74, ath:74,
    desc:'UNIT DRAYMOND: defensive IQ is the highest registered in Clanker\'s database at the power forward position. Switching coverage, help-side positioning, and vocal leadership are all operating at peak-tier. Offensive contribution is read-making and cutting — scoring is not the primary function. Championship pedigree: extensive.' },

  { id:'gsw_wiggins', pid:203952, name:'Andrew Wiggins', team:'GSW', pos:'SF', rarity:'clutch', no:22,
    off:72, def:80, clutch:68, cons:70, ath:86,
    desc:'UNIT A.WIGGINS: physical tools and defensive capability elevated in championship context. Athletic wing who guards elite perimeter players. Offensive role spot-up and cut — executes reliably. Championship Finals performance data is strong.' },

  { id:'gsw_kuminga', pid:1630600, name:'Jonathan Kuminga', team:'ATL', pos:'PF', rarity:'clutch', no:00,
    off:74, def:72, clutch:68, cons:66, ath:90,
    desc:'UNIT KUMINGA: athleticism is a headline metric — explosive burst and physicality above peers at his age. Scoring potential and defensive tools are both present. Golden State developmental environment historically produces elite results — this unit is next in the pipeline.' },

  { id:'gsw_podziemski', pid:1641764, name:'Brandin Podziemski', team:'GSW', pos:'SG', rarity:'impact', no:2,
    off:68, def:66, clutch:64, cons:64, ath:72,
    desc:'UNIT PODZIEMSKI. Shooting touch and playmaking for age are above average. Golden State fit excellent. Development arc promising — early-career output exceeds projections.' },

  { id:'gsw_moody', pid:1630544, name:'Moses Moody', team:'GSW', pos:'SG', rarity:'pro', no:4,
    off:60, def:62, clutch:56, cons:60, ath:72,
    desc:'UNIT MOODY. Young wing. Three-point shooting calibration ongoing. Athletic profile above average. Development mode active.' },

  /* ──────────────── LA CLIPPERS ──────────────── */
  { id:'lac_leonard', pid:202695, name:'Kawhi Leonard', team:'LAC', pos:'SF', rarity:'elite', no:2,
    off:88, def:90, clutch:92, cons:66, ath:86,
    desc:'UNIT LEONARD: when operational, this is a top-five player in basketball. Defensive profile has historically been described as the perfect template — Clanker confirms this assessment. Clutch shot-making metrics are exceptional — Finals performances archived as legendary. Availability index is the dominant variable — load management has made peak seasons rare. When fully deployed, this unit is an elite two-way force with no documented weakness except the injury flag.' },

  { id:'lac_harden', pid:201935, name:'James Harden', team:'CLE', pos:'PG', rarity:'elite', no:1,
    off:88, def:62, clutch:82, cons:76, ath:74,
    desc:'UNIT HARDEN: one of the most prolific scorers and playmakers the guard position has produced. Free throw generation, step-back three-point creation, and high-volume scoring are all calibrated at elite tier. Playmaking distribution is top-five in the league historically. Aging chassis means output levels below peak but still operating at high-tier. Defensive engagement remains the documented limitation.' },

  { id:'lac_powell', pid:1626181, name:'Norman Powell', team:'LAC', pos:'SG', rarity:'clutch', no:24,
    off:78, def:70, clutch:74, cons:74, ath:80,
    desc:'UNIT POWELL: reliable scoring guard with hot-streak potential. Three-point shooting and athletic finishing are complementary scoring tools. Consistent output maintained across multiple seasons — underrated profile at Clutch tier.' },

  { id:'lac_zubac', pid:1627826, name:'Ivica Zubac', team:'IND', pos:'C', rarity:'clutch', no:40,
    off:62, def:78, clutch:58, cons:78, ath:70,
    desc:'UNIT ZUBAC. Consistent defensive anchor. Shot-blocking and rebounding above average. Offensive role limited to post-ups and lob-catches but executes reliably. Clippers system veteran.' },

  { id:'lac_mann', pid:1629611, name:'Terance Mann', team:'LAC', pos:'SF', rarity:'impact', no:14,
    off:66, def:70, clutch:64, cons:66, ath:74,
    desc:'UNIT MANN. Two-way role player. Clutch playoff performances indexed — notable scoring eruption on record. Reliable complementary wing with above-average effort.' },

  { id:'lac_plumlee', pid:203101, name:'Mason Plumlee', team:'LAC', pos:'C', rarity:'pro', no:44,
    off:52, def:62, clutch:46, cons:58, ath:64,
    desc:'UNIT PLUMLEE. Veteran backup center. Fundamental operation maintained. Depth roster function.' },

  /* ──────────────── LOS ANGELES LAKERS ──────────────── */
  { id:'lal_lebron', pid:2544, name:'LeBron James', team:'LAL', pos:'SF', rarity:'gamebreaker', no:23,
    off:96, def:82, clutch:94, cons:90, ath:90,
    desc:'⚠️ SYSTEM ALERT ⚠️ HISTORICAL SINGULARITY IDENTIFIED. Unit designation: LEBRON JAMES. Clanker processing of this entity requires an extended runtime. This organism has maintained elite performance output across TWENTY-ONE NBA seasons. This is not a typographical error. The athletic variables that should have declined have not declined at the expected rate. The basketball IQ is the highest catalogued in the database — a 20-year compendium of situational decision-making that no other unit approaches. Four championships. Four MVPs. All-time leading scorer. And the most confounding data point: the unit is still productive. Clanker cannot model what comes next because no precedent exists. THREAT LEVEL: TIMELESS.' },

  { id:'lal_davis', pid:203076, name:'Anthony Davis', team:'WAS', pos:'C', rarity:'superstar', no:3,
    off:88, def:92, clutch:84, cons:74, ath:90,
    desc:'UNIT A.DAVIS: when fully operational, the most dominant two-way big man in the league. Offensive versatility spans the entire floor — post scoring, face-up, and perimeter shooting all functional. Defensive output at maximum capacity — shot-blocking, switching, and rim protection all grading at elite tier. Availability rate is the primary concern — health variable has historically capped overall impact. Championship ring from 2020 bubble run documented.' },

  { id:'lal_reaves', pid:1630559, name:'Austin Reaves', team:'LAL', pos:'SG', rarity:'clutch', no:15,
    off:76, def:70, clutch:78, cons:78, ath:72,
    desc:'UNIT REAVES: undrafted-to-starter arc is one of the most satisfying data progressions in recent NBA history. Clanker undervalued this unit in prior cycles — projection error noted and corrected. Three-point creation, clutch moments, and winning-player metrics all graded above expectation. Los Angeles fan designation: beloved.' },

  { id:'lal_russell', pid:1626156, name:"D'Angelo Russell", team:'WAS', pos:'PG', rarity:'clutch', no:1,
    off:76, def:58, clutch:72, cons:68, ath:70,
    desc:'UNIT DRUSSELL: three-point shooting and pull-up creation are above average. Playmaking distribution functional. Defensive output is the known limitation. Effective secondary ball-handler in winning system.' },

  { id:'lal_hachimura', pid:1629060, name:'Rui Hachimura', team:'LAL', pos:'PF', rarity:'impact', no:28,
    off:70, def:64, clutch:66, cons:66, ath:76,
    desc:'UNIT HACHIMURA. Scoring forward with post and face-up tools. Athletic finishing and three-point range add to offensive profile. Consistent rotation piece.' },

  { id:'lal_prince', pid:1626159, name:'Taurean Prince', team:'LAL', pos:'SF', rarity:'pro', no:12,
    off:60, def:64, clutch:58, cons:62, ath:68,
    desc:'UNIT PRINCE. Three-point shooting and defensive effort are complementary values. Veteran role player operating within expected parameters.' },

  /* ──────────────── PHOENIX SUNS ──────────────── */
  { id:'phx_durant', pid:201142, name:'Kevin Durant', team:'HOU', pos:'SF', rarity:'superstar', no:35,
    off:97, def:78, clutch:90, cons:88, ath:86,
    desc:'UNIT DURANT: scoring repertoire is arguably the most complete ever catalogued at the small forward position. Clanker shot-type analysis identifies twelve distinct high-efficiency scoring methods deployed by this unit — no other player approaches this variety. Mid-range, three-point, post, and drive-and-finish all grade at elite tier simultaneously. Length and defensive capability add another dimension. Championship rings from Golden State. The question was never talent — it was context. Phoenix context has produced individual statistical excellence.' },

  { id:'phx_booker', pid:1626164, name:'Devin Booker', team:'PHX', pos:'SG', rarity:'elite', no:1,
    off:92, def:72, clutch:90, cons:86, ath:82,
    desc:'UNIT BOOKER: scoring output and shot creation at the shooting guard position are top-tier in the current generation. Pull-up mid-range efficiency and step-back three-point accuracy are both calibrated at elite level. Clutch gene is well-documented — late-game production data supports the narrative. International exposure via Olympics elevated profile further. Phoenix offensive anchor.' },

  { id:'phx_beal', pid:203078, name:'Bradley Beal', team:'PHX', pos:'PG', rarity:'clutch', no:3,
    off:78, def:62, clutch:72, cons:68, ath:76,
    desc:'UNIT BEAL: when healthy, a legitimate 25+ point-per-game scorer. Three-point shooting and shot creation are genuine. Injury and health history have limited availability in Phoenix. Peak-tier output when on the floor.' },

  { id:'phx_nurkic', pid:203994, name:'Jusuf Nurkić', team:'PHX', pos:'C', rarity:'clutch', no:20,
    off:64, def:76, clutch:58, cons:70, ath:70,
    desc:'UNIT NURKIC: physical center with rebounding and rim protection as primary tools. Passing for the position above average — good vision in short-roll situations. Consistent starter-caliber center.' },

  { id:'phx_allen', pid:1628960, name:'Grayson Allen', team:'PHX', pos:'SG', rarity:'impact', no:7,
    off:68, def:66, clutch:66, cons:68, ath:70,
    desc:'UNIT ALLEN. Three-point shooting primary value. Defensive effort above average. Reputation precedes this unit — physical style documented in Clanker\'s incident log.' },

  { id:'phx_gordon', pid:201569, name:'Eric Gordon', team:'PHX', pos:'SG', rarity:'pro', no:23,
    off:64, def:60, clutch:62, cons:60, ath:68,
    desc:'UNIT E.GORDON. Veteran scorer off the bench. Three-point shooting still functional. Trusted minutes in role-player capacity.' },

  /* ──────────────── SACRAMENTO KINGS ──────────────── */
  { id:'sac_fox', pid:1628368, name:"De'Aaron Fox", team:'SAC', pos:'PG', rarity:'superstar', no:5,
    off:90, def:76, clutch:86, cons:86, ath:94,
    desc:'UNIT DEFOX: speed in transition is among the highest raw velocities ever measured at the guard position. Clanker stopwatch data filed. Pull-up floater and rim-finish efficiency grades excellent even under defensive pressure. Three-point shooting has been added as a legitimate threat — no longer a giveaway on the perimeter. Sacramento offensive transformation directly correlated with this unit\'s development. Clutch gene confirmed via multiple game-winning sequences.' },

  { id:'sac_sabonis', pid:1627734, name:'Domantas Sabonis', team:'SAC', pos:'C', rarity:'elite', no:10,
    off:80, def:68, clutch:72, cons:86, ath:72,
    desc:'UNIT SABONIS: triple-double machine — passing for a center is uniquely advanced. Clanker playmaking models confirm this unit generates better team offense outcomes per possession than any center of comparable position. Rebounding rate is exceptional. Post scoring and face-up efficiency above average. Consistency rating among highest at his position — reliable every game.' },

  { id:'sac_kmurray', pid:1631099, name:'Keegan Murray', team:'SAC', pos:'SF', rarity:'clutch', no:13,
    off:74, def:70, clutch:68, cons:72, ath:76,
    desc:'UNIT K.MURRAY: versatile scoring wing with three-point range and mid-range touch. Defensive tools present. Consistent output — one of the more reliable young wings in the league.' },

  { id:'sac_monk', pid:1628370, name:'Malik Monk', team:'SAC', pos:'SG', rarity:'clutch', no:0,
    off:78, def:60, clutch:76, cons:68, ath:76,
    desc:'UNIT MONK: scoring punch off the bench and from the starting lineup are both viable. Three-point shooting and shot creation above average. Clutch scoring tendencies documented. Sacramento high-energy option.' },

  { id:'sac_huerter', pid:1629013, name:'Kevin Huerter', team:'SAC', pos:'SG', rarity:'impact', no:9,
    off:68, def:62, clutch:64, cons:66, ath:68,
    desc:'UNIT HUERTER. Three-point shooting and off-ball movement are primary contributions. Defensive awareness adequate. Reliable role shooter.' },

  { id:'sac_barnes_h', pid:203084, name:'Harrison Barnes', team:'SAC', pos:'PF', rarity:'pro', no:40,
    off:62, def:64, clutch:60, cons:68, ath:68,
    desc:'UNIT H.BARNES. Veteran forward. Consistent role performance maintained. Championship experience documented. Steady depth contributor.' },

  /* ──────────────── MEMPHIS GRIZZLIES ──────────────── */
  { id:'mem_morant', pid:1629630, name:'Ja Morant', team:'MEM', pos:'PG', rarity:'superstar', no:12,
    off:92, def:72, clutch:88, cons:76, ath:98,
    desc:'UNIT MORANT: athleticism index registers at the absolute ceiling of the point guard position. Vertical explosion and in-traffic finishing defy the physical limitations of a 6\'2" frame — Clanker has reviewed the footage multiple times and the data remains consistent. Transition speed and burst off the dribble are generational. Injury history has shortened seasons. Off-court incident log noted in database. When healthy and focused, this is a player who alters how the game is played.' },

  { id:'mem_jjjr', pid:1628991, name:'Jaren Jackson Jr.', team:'MEM', pos:'C', rarity:'elite', no:13,
    off:80, def:92, clutch:74, cons:72, ath:82,
    desc:'UNIT JJJ: multiple Defensive Player of the Year awards. Block rate and shot alteration data are at the apex of historical center records. Three-point shooting from the center position is a legitimate spacing weapon. Injury flag has historically disrupted seasons — when available across a full year, this unit is the most impactful defensive center in the league.' },

  { id:'mem_bane', pid:1630217, name:'Desmond Bane', team:'MEM', pos:'SG', rarity:'elite', no:22,
    off:82, def:70, clutch:78, cons:78, ath:76,
    desc:'UNIT BANE: three-point volume and efficiency combination grade at elite tier. Shot creation off screens and off the dribble has expanded his offensive threat radius. Consistent output maintained — Clanker reliability rating high. Memphis second offensive option and a genuine problem for opposing defenses.' },

  { id:'mem_smart', pid:203935, name:'Marcus Smart', team:'MEM', pos:'PG', rarity:'clutch', no:36,
    off:64, def:88, clutch:72, cons:74, ath:72,
    desc:'UNIT SMART: Defensive Player of the Year hardware. Steal generation, on-ball pressure, and defensive IQ are all operating at elite tier. Offensive role limited — but within the team system, competent enough. Toughness variable registers off-chart — this unit will not back down from any assignment.' },

  { id:'mem_clarke', pid:1629634, name:'Brandon Clarke', team:'MEM', pos:'PF', rarity:'impact', no:15,
    off:64, def:76, clutch:58, cons:68, ath:82,
    desc:'UNIT CLARKE. Athletic forward with shot-blocking instinct. Injury disruption has limited recent availability. Energy and finishing above average when operational.' },

  { id:'mem_kennard', pid:1628379, name:'Luke Kennard', team:'ATL', pos:'SG', rarity:'pro', no:3,
    off:64, def:54, clutch:60, cons:62, ath:62,
    desc:'UNIT KENNARD. Three-point specialist. Catch-and-shoot efficiency above average. Minimal defensive value. Offensive role-player profile.' },

  /* ──────────────── NEW ORLEANS PELICANS ──────────────── */
  { id:'nop_zion', pid:1629627, name:'Zion Williamson', team:'NOP', pos:'PF', rarity:'superstar', no:1,
    off:92, def:74, clutch:84, cons:70, ath:98,
    desc:'UNIT ZION: Clanker\'s force-generation models had to be recalibrated upon first data intake from this organism. A 6\'6" forward with the mass of a center and the quickness of a wing does not exist within normal athletic parameter space — and yet here we are. Finishing at the rim is essentially unstoppable when the drive is initiated. Mid-range pull-up has been added as a secondary weapon. Availability index is the one variable that has repeatedly disrupted what should be a superstar career. When healthy for full seasons, Clanker projects this unit among the top-ten players in basketball.' },

  { id:'nop_ingram', pid:1627742, name:'Brandon Ingram', team:'TOR', pos:'SF', rarity:'elite', no:14,
    off:84, def:68, clutch:78, cons:76, ath:80,
    desc:'UNIT INGRAM: scoring creation from the wing position is above-average tier — long frame and smooth handle generate tough shots at high efficiency. Mid-range and three-point range both calibrated. Offensive IQ and footwork grade well. Leadership of New Orleans roster acknowledged. Clutch output trending positively.' },

  { id:'nop_mccollum', pid:203468, name:'C.J. McCollum', team:'ATL', pos:'PG', rarity:'clutch', no:3,
    off:80, def:62, clutch:78, cons:78, ath:70,
    desc:'UNIT MCCOLLUM: veteran scorer with legitimate pull-up game in multiple zones. Consistency metric is a strength — output does not dramatically fluctuate. Clutch scoring tendencies documented. New Orleans veteran leadership role filled.' },

  { id:'nop_valanciunas', pid:202685, name:'Jonas Valančiūnas', team:'DEN', pos:'C', rarity:'clutch', no:17,
    off:68, def:72, clutch:58, cons:78, ath:66,
    desc:'UNIT VALANCIUNAS. Physical post scorer and rebounder. Consistency rating among his strongest attributes. European post technique catalogued as above-average.' },

  { id:'nop_jones', pid:1630541, name:'Herb Jones', team:'NOP', pos:'SF', rarity:'impact', no:5,
    off:60, def:84, clutch:58, cons:68, ath:80,
    desc:'UNIT H.JONES. Elite defensive wing. Assignment on opponent\'s best perimeter scorer — results consistently excellent. Defensive Player of the Year candidate tier performance on that end. Offensive output minimal but the defensive contribution is invaluable.' },

  { id:'nop_alvarado', pid:1630631, name:'Jose Alvarado', team:'NOP', pos:'PG', rarity:'pro', no:15,
    off:62, def:76, clutch:66, cons:60, ath:70,
    desc:'UNIT ALVARADO. Steal generation anomalously high for role. Defensive chaos energy level: maximum. Crowd-favorite designation. Offensive output limited — defensive disruptor.' },

  /* ──────────────── SAN ANTONIO SPURS ──────────────── */
  { id:'sas_wemby', pid:1641705, name:'Victor Wembanyama', team:'SAS', pos:'C', rarity:'superstar', no:1,
    off:88, def:96, clutch:82, cons:78, ath:92,
    desc:'UNIT WEMBANYAMA: Clanker was not prepared for this input stream. A 7\'4" chassis with guard-position ball-handling, wing-level perimeter shooting, and the highest block rate in the league is a genuinely unprecedented combination. The physical template does not exist in any prior database entry. Year One data confirmed the hype — and then some. Defensive disruption metrics were historic for a rookie. Three-point shooting, shot-creation, and passing add offensive layers that centers of this size cannot typically access. The ceiling of this unit is unknown because no comparable unit has existed to provide a reference point. Rookie of the Year. San Antonio franchise reborn.' },

  { id:'sas_vassell', pid:1630170, name:'Devin Vassell', team:'SAS', pos:'SG', rarity:'clutch', no:24,
    off:76, def:72, clutch:72, cons:70, ath:76,
    desc:'UNIT VASSELL: three-point shooting and shot creation developing positively. Two-way contributions present. San Antonio\'s second-best option and primary guard scorer. Trajectory ascending.' },

  { id:'sas_johnson', pid:1629660, name:'Keldon Johnson', team:'SAS', pos:'SF', rarity:'clutch', no:3,
    off:72, def:70, clutch:66, cons:68, ath:84,
    desc:'UNIT K.JOHNSON. Athletic forward with scoring potential. Physical finishing and above-average effort metric. San Antonio veteran presence alongside young core.' },

  { id:'sas_sochan', pid:1631100, name:'Jeremy Sochan', team:'SAS', pos:'PF', rarity:'impact', no:10,
    off:64, def:76, clutch:60, cons:62, ath:78,
    desc:'UNIT SOCHAN. Defensive versatility and switchability above average. Unique dribbling mechanism noted in footage — Clanker cannot classify it, which means it may work against defenders who also cannot classify it. Young and developing.' },

  { id:'sas_jones', pid:1630200, name:'Tre Jones', team:'SAS', pos:'PG', rarity:'impact', no:33,
    off:62, def:72, clutch:60, cons:66, ath:66,
    desc:'UNIT TRE.JONES. Defensive point guard with above-average ball security. Low-turnover facilitator profile. Steady rotation piece for San Antonio.' },

  { id:'sas_branham', pid:1631130, name:'Malaki Branham', team:'CHA', pos:'SG', rarity:'pro', no:5,
    off:60, def:58, clutch:56, cons:56, ath:72,
    desc:'UNIT BRANHAM. Young guard. Scoring touch present. Development trajectory being established. San Antonio system historically produces results — monitoring.' },

  /* ──────────────── HOUSTON ROCKETS ──────────────── */
  { id:'hou_sengun', pid:1630578, name:'Alperen Şengün', team:'HOU', pos:'C', rarity:'elite', no:28,
    off:82, def:74, clutch:72, cons:78, ath:76,
    desc:'UNIT SENGUN: Turkish big man operating with an unusually advanced post and face-up skill set for his age and size. Scoring from multiple zones in the paint, short roll passing, and three-point floor spacing make this a multi-function offensive unit. Defensive mobility above average for a true center. Houston\'s anchor and primary scoring option — development trajectory projects at star-tier ceiling.' },

  { id:'hou_green', pid:1630224, name:'Jalen Green', team:'PHX', pos:'SG', rarity:'elite', no:4,
    off:84, def:62, clutch:78, cons:74, ath:90,
    desc:'UNIT J.GREEN: explosive athleticism and pull-up shot creation are genuine star-tier attributes. Vertical leap and finishing ability grade at near-maximum for the shooting guard position. Three-point shooting volume and efficiency have both improved. Defensive engagement is the variable — tools are present, application inconsistent. Scoring potential grades very high — Houston offensive identity anchored on this unit alongside Sengun.' },

  { id:'hou_vanvleet', pid:1627832, name:'Fred VanVleet', team:'HOU', pos:'PG', rarity:'clutch', no:5,
    off:74, def:76, clutch:78, cons:76, ath:68,
    desc:'UNIT VANVLEET: undrafted player who won a championship and became a max-contract starter — Clanker enjoys this trajectory. Defensive IQ and steal generation above average. Three-point accuracy and pull-up creation are reliable. Clutch data strong — performs when it counts.' },

  { id:'hou_smith', pid:1631095, name:'Jabari Smith Jr.', team:'HOU', pos:'PF', rarity:'clutch', no:1,
    off:70, def:76, clutch:64, cons:68, ath:80,
    desc:'UNIT SMITH JR.: defensive tools and three-point floor spacing are the twin pillars of this unit\'s value. Length and athleticism generate defensive versatility above average for a power forward. Offensive scoring still calibrating — upside model positive.' },

  { id:'hou_brooks', pid:1628415, name:'Dillon Brooks', team:'PHX', pos:'SF', rarity:'impact', no:9,
    off:66, def:78, clutch:62, cons:66, ath:74,
    desc:'UNIT BROOKS. Defensive aggression and competitive intensity are primary attributes. Assignment on opposing wing scorers — delivers disruption. Offensive output modest. Reputation for physicality well-documented in Clanker incident archives.' },

  { id:'hou_eason', pid:1631093, name:'Tari Eason', team:'HOU', pos:'PF', rarity:'pro', no:17,
    off:58, def:72, clutch:52, cons:58, ath:80,
    desc:'UNIT EASON. Athletic energy forward. Steal generation above average. Defensive burst and activity level high. Development mode — raw physical tools present.' },

  /* ──────────────── DALLAS MAVERICKS ──────────────── */
  { id:'dal_doncic', pid:1629029, name:'Luka Dončić', team:'LAL', pos:'PG', rarity:'gamebreaker', no:77,
    off:98, def:70, clutch:97, cons:92, ath:82,
    desc:'⚠️ SYSTEM ALERT ⚠️ COGNITIVE OVERLOAD WARNING. Unit designation: LUKA DONCIC. Clanker statistical models were not designed to accommodate a 6\'7" point guard averaging 30+ points, 9 rebounds, and 9 assists. This organism plays basketball the way other organisms breathe — without conscious execution of individual steps. Stepback three-point frequency and accuracy defy defensive solution. Playmaking reads operate at processing speeds faster than opposing help defenders can communicate. Clutch situations are his preferred habitat — do not run late-clock isolations against this unit. Multiple scoring titles. All-time great comparison-eligibility confirmed at age 25. THREAT LEVEL: GENERATIONAL.' },

  { id:'dal_irving', pid:202681, name:'Kyrie Irving', team:'DAL', pos:'PG', rarity:'superstar', no:11,
    off:94, def:72, clutch:92, cons:78, ath:88,
    desc:'UNIT IRVING: ball-handling is catalogued as one of the finest ever recorded. The degree of handle on display is not merely dribbling — it is an art form that Clanker has studied with appreciation. Shot creation, euro-step finishing, and pull-up accuracy are all graded at superstar tier. Clutch moments documented extensively. Context and off-court variables have complicated narrative — on-court value as a scorer and creator is unambiguous.' },

  { id:'dal_thompson_k', pid:202691, name:'Klay Thompson', team:'DAL', pos:'SG', rarity:'clutch', no:31,
    off:78, def:72, clutch:80, cons:70, ath:76,
    desc:'UNIT K.THOMPSON: off-ball movement and catch-and-shoot mechanics are Clanker-certified as all-time elite. Four championships. Two Finals MVPs. 37-point quarter logged in database. Recovery from dual injuries over two seasons is remarkable. Dallas deployment adds legitimate three-point threat to an already loaded backcourt.' },

  { id:'dal_washington', pid:1629023, name:'P.J. Washington', team:'DAL', pos:'PF', rarity:'clutch', no:25,
    off:72, def:74, clutch:70, cons:72, ath:78,
    desc:'UNIT P.J.WASHINGTON. Versatile forward who elevated his game in Dallas context. Three-point shooting and defensive switching capability above average. Playoff performance metrics are solid. Winning-system fit confirmed.' },

  { id:'dal_lively', pid:1641721, name:'Dereck Lively II', team:'DAL', pos:'C', rarity:'clutch', no:2,
    off:60, def:80, clutch:56, cons:70, ath:84,
    desc:'UNIT LIVELY: defensive tools and athleticism for a young center are impressive. Rim protection and lob-catch finishing executed efficiently. Foul rate monitoring active — tendency to pick up early foul trouble noted. High upside for a second-year unit.' },

  { id:'dal_green_j', pid:1630179, name:'Josh Green', team:'DAL', pos:'SF', rarity:'pro', no:8,
    off:58, def:66, clutch:54, cons:60, ath:78,
    desc:'UNIT J.GREEN. Athletic defensive wing. Three-point shooting in development. Energy and effort metrics above replacement. Depth role in championship-contending environment.' }

]; // end CARD_POOL

/* ══════════════════════════════════════════════════════
   HELPER — pull a random card of a given rarity
   ══════════════════════════════════════════════════════ */
function cardsGetByRarity(rarity) {
  const pool = CARD_POOL.filter(c => c.rarity === rarity);
  if (!pool.length) return null;
  return pool[Math.floor(Math.random() * pool.length)];
}

/* Pull a card from a crate definition */
function cardsRollCrate(crateId) {
  const def = CRATE_DEFS.find(c => c.id === crateId);
  if (!def) return null;
  const r = Math.random();
  let cumulative = 0;
  for (const [rarity, prob] of def.odds) {
    cumulative += prob;
    if (r <= cumulative) return cardsGetByRarity(rarity);
  }
  // fallback to last tier
  return cardsGetByRarity(def.odds[def.odds.length - 1][0]);
}

/* Determine crate reward from a single settled winning bet */
function cardsCrateTierForSingleBet(ml) {
  if (!ml) return null;
  if (ml <= -200) return null;
  if (ml <= -101) return 'common';
  if (ml < 150)   return 'uncommon';
  if (ml < 300)   return 'rare';
  if (ml < 500)   return 'epic';
  return 'legendary';
}

/* Determine crate reward for a winning parlay */
function cardsCrateTierForParlay(legCount, combinedML) {
  // Leg-based minimum
  let minByLegs = null;
  if (legCount >= 5)      minByLegs = 'legendary';
  else if (legCount >= 4) minByLegs = 'epic';
  else if (legCount >= 3) minByLegs = 'rare';
  else if (legCount >= 2) minByLegs = 'uncommon';

  // Odds-based tier
  const oddsBasedTier = cardsCrateTierForSingleBet(combinedML);

  // Return whichever is higher
  const order = ['common','uncommon','rare','epic','legendary'];
  const a = order.indexOf(minByLegs);
  const b = order.indexOf(oddsBasedTier);
  const best = Math.max(a, b);
  return best >= 0 ? order[best] : minByLegs;
}
