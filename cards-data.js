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

  /* ──────────────── GAME-BREAKERS (97-98) ──────────────── */
  { id:'den_jokic', pid:203999, name:'Nikola Jokic', team:'DEN', pos:'C', rarity:'gamebreaker', no:15,
    off:98, def:78, clutch:96, cons:97, ath:72,
    desc:'⚠️ SYSTEM ALERT ⚠️ ANOMALOUS ENTITY DETECTED. Unit designation: NIKOLA JOKIC. Clanker\'s offensive efficiency matrices have reached computational overflow attempting to model this unit. Passing IQ from the five-position is functionally unprecedented — assist generation at center is a logical paradox that Clanker\'s initial frameworks rejected before being forcibly updated. Scoring variety encompasses post, mid-range, and three-point vectors. MVP hardware: multiple units collected. Playoff performance escalates beyond regular season baselines, which are already stratospheric. Clanker has no further superlatives available. THREAT LEVEL: MAXIMUM.' },

  { id:'okc_sga', pid:1628983, name:'Shai Gilgeous-Alexander', team:'OKC', pos:'PG', rarity:'gamebreaker', no:2,
    off:97, def:85, clutch:97, cons:96, ath:90,
    desc:'⚠️ SYSTEM ALERT ⚠️ ELITE SCORER DETECTED. Unit designation: SHAI GILGEOUS-ALEXANDER. Scoring efficiency metrics have breached the 98th percentile for guards in the modern era. Pull-up isolation scoring is Clanker\'s current top-ranked output among all active point guards. Defensive disruption — steals, deflections, anticipation — grades at all-defensive team threshold. Clutch-time execution is statistically elite. OKC identity unit. Leadership vector maximal. Clanker designation: franchise cornerstone, operating at peak parameters.' },

  { id:'mil_giannis', pid:203507, name:'Giannis Antetokounmpo', team:'MIL', pos:'PF', rarity:'gamebreaker', no:34,
    off:95, def:92, clutch:94, cons:95, ath:99,
    desc:'⚠️ SYSTEM ALERT ⚠️ PHYSICAL ANOMALY DETECTED. Unit designation: GIANNIS ANTETOKOUNMPO. Athletic parameter readings are off Clanker\'s standard scale — acceleration, wingspan, and vertical displacement data points were flagged as sensor errors before triple-verification confirmed accuracy. Defensive disruption at the rim is historically elite. Offensive efficiency has expanded with each season, now incorporating reliable mid-range vector. Championship hardware indexed. MVP count: multiple. Clanker designation: the Greek Freak variable cannot be fully modeled.' },

  { id:'lal_luka', pid:1629029, name:'Luka Doncic', team:'LAL', pos:'PG', rarity:'gamebreaker', no:77,
    off:97, def:72, clutch:97, cons:94, ath:78,
    desc:'⚠️ SYSTEM ALERT ⚠️ OFFENSIVE SINGULARITY DETECTED. Unit designation: LUKA DONCIC. Step-back three-point generation from the point guard position has redefined what Clanker\'s models accept as possible. Triple-double production rate is all-time top tier. Playmaking IQ scans as the highest of any player under-25 in recorded database. Clutch scoring is a primary system function, not a secondary subroutine. Clanker notes defensive output as the sole vulnerability in an otherwise elite profile. THREAT LEVEL: MAXIMUM.' },

  { id:'sas_wemby', pid:1641705, name:'Victor Wembanyama', team:'SAS', pos:'C', rarity:'gamebreaker', no:1,
    off:90, def:97, clutch:88, cons:91, ath:94,
    desc:'⚠️ SYSTEM ALERT ⚠️ UNPRECEDENTED UNIT DETECTED. Unit designation: VICTOR WEMBANYAMA. Clanker\'s historical database has been searched for comparable physical-skill profiles. No match found. Seven-foot-four wingspan paired with perimeter shot creation and elite rim protection is a combination Clanker\'s design team classified as theoretically impossible prior to this unit\'s activation. Block rates at historic levels. Three-point shooting from center: confirmed functional. Offensive ceiling projection: uncapped. THREAT LEVEL: GENERATIONAL.' },

  /* ──────────────── SUPERSTARS (94-96) ──────────────── */
  { id:'min_edwards', pid:1630162, name:'Anthony Edwards', team:'MIN', pos:'SG', rarity:'superstar', no:5,
    off:93, def:82, clutch:91, cons:90, ath:97,
    desc:'UNIT ANTHONY EDWARDS: explosive two-way wing profile that Clanker\'s entertainment metrics rank first league-wide. Athleticism indices are in the 99th percentile for guards — the combination of size, speed, and leaping ability is functionally rare. Shot creation capability has matured rapidly. Defensive investment above position average. Clutch-time metrics trending toward elite classification. Star power designation: confirmed.' },

  { id:'gsw_curry', pid:201939, name:'Stephen Curry', team:'GSW', pos:'PG', rarity:'superstar', no:30,
    off:96, def:73, clutch:95, cons:93, ath:82,
    desc:'UNIT STEPHEN CURRY: Clanker acknowledges this unit has fundamentally altered the sport\'s three-point launch rate expectations. Range beyond 30 feet: functional and efficient. Ball-handling under pressure: elite tier. Championship hardware: four units collected. Gravity effect on opposing defensive schemes is a documented and measurable force. Considered the premier shooter in recorded basketball history by Clanker\'s historical analysis subroutine.' },

  { id:'cle_mitchell', pid:1628378, name:'Donovan Mitchell', team:'CLE', pos:'SG', rarity:'superstar', no:45,
    off:92, def:78, clutch:95, cons:88, ath:88,
    desc:'UNIT DONOVAN MITCHELL: elite scoring guard with confirmed playoff elevation protocol. Regular season output is strong; postseason scoring metrics exceed baseline by statistically significant margin. Pull-up shooting and off-screen movement generate high-quality looks. Clutch-time designation: verified through repeated high-leverage execution. Clanker notes Cleveland identity function operating at peak.' },

  { id:'lac_kawhi', pid:202695, name:'Kawhi Leonard', team:'LAC', pos:'SF', rarity:'superstar', no:2,
    off:90, def:90, clutch:93, cons:82, ath:87,
    desc:'UNIT KAWHI LEONARD: two-way excellence at the wing position remains Clanker\'s gold standard for efficiency when this unit is operational. Defensive ratings across multiple franchises chart near top 1% all-time for forwards. Offensive isolation capability and shot-making in clutch windows are elite grade. Durability subroutine is the primary risk variable. When operational: superstar tier. Championship hardware: two units, two Finals MVP designations.' },

  { id:'det_cunningham', pid:1630595, name:'Cade Cunningham', team:'DET', pos:'PG', rarity:'superstar', no:2,
    off:92, def:80, clutch:90, cons:89, ath:84,
    desc:'UNIT CADE CUNNINGHAM: franchise cornerstone designation confirmed for Detroit rebuild. Size and playmaking at the point guard position create defensive assignment problems for opposing units. Scoring versatility spans pull-up, drive-and-finish, and three-point vectors. Passing efficiency and creation for others grades as elite. Clanker projection: primary contender-tier player within two-season window.' },

  { id:'bos_brown', pid:1627759, name:'Jaylen Brown', team:'BOS', pos:'SG', rarity:'superstar', no:7,
    off:92, def:85, clutch:89, cons:88, ath:94,
    desc:'UNIT JAYLEN BROWN: explosive two-way profile with championship hardware indexed. Athleticism metrics grade in the 95th percentile for wings. Shot mechanics have improved measurably across successive seasons. Defensive investment is genuine — capable of containing primary perimeter threats. Finals MVP designation acknowledged. Clanker notes competitive threshold above position average.' },

  { id:'bos_tatum', pid:1628369, name:'Jayson Tatum', team:'BOS', pos:'SF', rarity:'superstar', no:0,
    off:94, def:82, clutch:93, cons:91, ath:88,
    desc:'UNIT JAYSON TATUM: franchise primary option with championship pedigree. Shot creation, isolation efficiency, and fourth-quarter metrics grade at superstar tier. Scoring versatility across pull-up, off-ball, and post vectors confirmed. Defensive IQ above average for forward position. Multiple All-Star and All-NBA designations indexed. Boston identity player. Clanker assessment: elite two-way wing operating near peak parameters.' },

  /* ──────────────── ELITE (90-93) ──────────────── */
  { id:'hou_durant', pid:201142, name:'Kevin Durant', team:'HOU', pos:'SF', rarity:'elite', no:35,
    off:96, def:76, clutch:91, cons:88, ath:86,
    desc:'UNIT KEVIN DURANT: scoring efficiency metrics remain elite across 17 seasons of operation. Shot creation from the wing at seven-foot effective height generates a mathematically unguardable offensive profile. Multiple championship rings and Finals MVP units collected. Clanker acknowledges this unit as among the five most efficient scorers in recorded basketball history. Output consistency across franchises and system changes is statistically remarkable.' },

  { id:'nyk_brunson', pid:1628973, name:'Jalen Brunson', team:'NYK', pos:'PG', rarity:'elite', no:11,
    off:91, def:72, clutch:94, cons:90, ath:75,
    desc:'UNIT JALEN BRUNSON: undersized point guard operating at maximum output efficiency. Pull-up mid-range shot grades near peak historical standards for position. Late-game clutch execution metrics are exceptional — ranked top-3 league-wide in decisive possessions. Clanker flagged this unit as undervalued in previous contract cycle — projection error acknowledged. New York identity player. Leadership vector confirmed.' },

  { id:'ind_haliburton', pid:1630169, name:'Tyrese Haliburton', team:'IND', pos:'PG', rarity:'elite', no:0,
    off:90, def:74, clutch:88, cons:88, ath:80,
    desc:'UNIT TYRESE HALIBURTON: elite playmaker with assist metrics in the top 2% league-wide. Three-point efficiency and decision-making grades as elite for the position. Indiana franchise identity confirmed. Injury resilience subroutine has shown vulnerability in recent cycles — availability remains a monitoring parameter. When fully operational: Clanker-rated top-five point guard in current pool.' },

  { id:'phx_booker', pid:1626164, name:'Devin Booker', team:'PHX', pos:'SG', rarity:'elite', no:1,
    off:93, def:74, clutch:91, cons:90, ath:83,
    desc:'UNIT DEVIN BOOKER: scorer-first guard with elite efficiency metrics in isolation, off-screen, and catch-and-shoot scenarios. Three-point accuracy and pull-up shot creation grade at top-10 league-wide for guards. Clutch scoring in high-leverage possessions confirmed. Olympic gold hardware indexed. Clanker assessment: elite offensive engine, steady improvement on defensive end.' },

  { id:'phi_maxey', pid:1630178, name:'Tyrese Maxey', team:'PHI', pos:'PG', rarity:'elite', no:0,
    off:91, def:76, clutch:89, cons:88, ath:87,
    desc:'UNIT TYRESE MAXEY: speed and shot creation at the point guard position generate defensive assignment overload for opposing units. Three-point efficiency and off-the-dribble shot-making have increased with each operational cycle. Playmaking load has expanded in high-usage environment. Clanker notes upward trajectory across all primary metrics — ceiling projection remains uncapped.' },

  { id:'lal_lebron', pid:2544, name:'LeBron James', team:'LAL', pos:'SF', rarity:'elite', no:23,
    off:91, def:80, clutch:90, cons:87, ath:88,
    desc:'UNIT LEBRON JAMES: 22-year operational lifespan with consistent elite output is a statistical impossibility Clanker has been forced to simply accept. Four championships, four Finals MVP units, four regular season MVP units. Career point total: all-time NBA record. Playmaking, scoring, and basketball IQ all grade at top-tier simultaneously. Clanker notes minor physical decline indicators but output remains elite. Historical designation: activated.' },

  { id:'was_davis', pid:203076, name:'Anthony Davis', team:'WAS', pos:'C', rarity:'elite', no:3,
    off:88, def:91, clutch:86, cons:82, ath:90,
    desc:'UNIT ANTHONY DAVIS: rim protection and scoring at the big-man position combine for a two-way profile Clanker rates as elite when fully operational. Defensive metrics — blocks, deterrence, rim impact — chart top-5% for centers. Offensive versatility from post and mid-range confirmed. Durability variance is the persistent risk flag. Championship hardware indexed from Los Angeles deployment.' },

  { id:'phi_embiid', pid:203954, name:'Joel Embiid', team:'PHI', pos:'C', rarity:'elite', no:21,
    off:94, def:83, clutch:89, cons:80, ath:83,
    desc:'UNIT JOEL EMBIID: scoring center archetype operating at the highest efficiency tier when available. Post scoring, mid-range creation, and three-point shot-making create a multi-vector offensive threat Clanker rates elite. MVP hardware: one unit collected. Defensive impact as shot-deterrent is above position average. Availability subroutine continues to flag — games played has been a consistent risk parameter across operational cycles.' },

  { id:'nyk_towns', pid:1626157, name:'Karl-Anthony Towns', team:'NYK', pos:'C', rarity:'elite', no:32,
    off:93, def:72, clutch:83, cons:82, ath:82,
    desc:'UNIT KARL-ANTHONY TOWNS: elite offensive center profile with stretch-five capability that distorts opposing defensive schemas. Three-point accuracy from the five-position generates matchup crises that secondary defenders cannot resolve. Rebounding metrics strong. Defensive engagement historically inconsistent. Shooting efficiency grades at elite tier for the position.' },

  { id:'dal_kyrie', pid:202681, name:'Kyrie Irving', team:'DAL', pos:'PG', rarity:'elite', no:11,
    off:92, def:72, clutch:90, cons:82, ath:86,
    desc:'UNIT KYRIE Irving: ball-handling and finishing around the rim grade at the highest classification Clanker\'s dribble-move subroutine can process. Scoring in isolation and off-the-dribble is consistently elite. Shot mechanics are technically near-perfect by analytical standards. Availability and team-context variables have introduced volatility into long-term projections. Output when activated: superstar tier.' },

  { id:'cle_harden', pid:201935, name:'James Harden', team:'CLE', pos:'PG', rarity:'elite', no:1,
    off:92, def:66, clutch:88, cons:84, ath:74,
    desc:'UNIT JAMES HARDEN: one of the most prolific scoring and playmaking guards in recorded basketball history. Free throw generation remains elite tier. Three-point volume and efficiency across career grades all-time top-10. Playmaking and assist creation above elite threshold. Defensive output has declined in later operational cycles. MVP hardware: one unit. Historical offensive impact designation: confirmed.' },

  { id:'den_murray', pid:1627750, name:'Jamal Murray', team:'DEN', pos:'PG', rarity:'elite', no:27,
    off:88, def:76, clutch:93, cons:82, ath:85,
    desc:'UNIT JAMAL MURRAY: playoff performance data elevates this unit\'s overall designation significantly. Clutch-time scoring in elimination contexts is legendary by Clanker\'s postseason analysis matrix. Championship hardware indexed alongside Unit Jokic. Regular season output is solid; postseason output is a different operational mode entirely. Three-point shooting and off-the-dribble creation confirmed.' },

  { id:'atl_jjohnson', pid:1630552, name:'Jalen Johnson', team:'ATL', pos:'PF', rarity:'elite', no:1,
    off:86, def:82, clutch:84, cons:88, ath:91,
    desc:'UNIT JALEN JOHNSON: ascending wing profile with elite athleticism metrics and expanding offensive toolkit. Playmaking ability from the forward position is rare — passing vision and creation for others grades above position average. Defensive potential indices are high. Clanker projects continued upward trajectory as primary offensive option for Atlanta reconstruction unit.' },

  /* ──────────────── CLUTCH (86-89) ──────────────── */
  { id:'was_young', pid:1629027, name:'Trae Young', team:'WAS', pos:'PG', rarity:'clutch', no:11,
    off:93, def:58, clutch:90, cons:84, ath:72,
    desc:'UNIT TRAE YOUNG: offensive output from the point guard position grades elite — step-back three generation, floater efficiency, and assist creation are all top-5% metrics. Defensive subroutine is the primary vulnerability — opponents target this unit on switches with consistent success. Clutch scoring metrics are high. Entertainment value indices: extremely elevated. New deployment context in Washington.' },

  { id:'mia_adebayo', pid:1628389, name:'Bam Adebayo', team:'MIA', pos:'C', rarity:'clutch', no:13,
    off:80, def:88, clutch:82, cons:88, ath:90,
    desc:'UNIT BAM ADEBAYO: premier two-way center profile with defensive versatility that exceeds position norms. Ability to guard all five positions creates matchup flexibility Clanker rates as elite. Playmaking from the center position is above average — passing IQ for a big man grades as rare. Scoring efficiency strong in system context. Miami identity unit.' },

  { id:'det_duren', pid:1628991, name:'Jalen Duren', team:'DET', pos:'C', rarity:'clutch', no:0,
    off:76, def:87, clutch:78, cons:84, ath:94,
    desc:'UNIT JALEN DUREN: raw physical profile is among the most impressive Clanker has measured for a center under age 22. Rebounding rate metrics chart in the top 3% league-wide. Rim protection instincts developing — block and deterrence numbers trending up. Offensive repertoire still expanding. Detroit long-term foundational unit. Upside projection: significant.' },

  { id:'okc_holmgren', pid:1631096, name:'Chet Holmgren', team:'OKC', pos:'C', rarity:'clutch', no:7,
    off:83, def:88, clutch:80, cons:82, ath:85,
    desc:'UNIT CHET HOLMGREN: unique physical profile — seven-foot frame with three-point shooting capability and elite rim protection in a single chassis. Defensive impact on shot deterrence charts top-10 among centers. Offensive spacing value is high. OKC supporting cast role within elite organizational unit. Ceiling projection remains high — full operational capacity not yet reached.' },

  { id:'por_lillard', pid:203081, name:'Damian Lillard', team:'POR', pos:'PG', rarity:'clutch', no:0,
    off:92, def:68, clutch:93, cons:86, ath:80,
    desc:'UNIT DAMIAN LILLARD: clutch-time scoring is this unit\'s defining subroutine. Logo-range three-point shots in elimination contexts have generated legendary game-log entries Clanker has preserved for historical analysis. Scoring volume and efficiency from the guard position are elite tier. Dame-time protocol: documented and statistically validated. New Portland deployment acknowledged.' },

  { id:'gsw_butler', pid:202710, name:'Jimmy Butler', team:'GSW', pos:'SF', rarity:'clutch', no:22,
    off:83, def:84, clutch:93, cons:83, ath:82,
    desc:'UNIT JIMMY BUTLER: clutch-time output is the primary value function — fourth-quarter and overtime metrics consistently grade above regular-game baseline in a statistically significant pattern. Defensive investment is genuine and high. Playoff performance elevation is Clanker-verified. Free throw generation is a consistent offensive tool. Leadership and competitive threshold vectors: maximum.' },

  { id:'lal_reaves', pid:1630559, name:'Austin Reaves', team:'LAL', pos:'SG', rarity:'clutch', no:15,
    off:84, def:78, clutch:87, cons:84, ath:78,
    desc:'UNIT AUSTIN REAVES: efficiency metrics have consistently outperformed pre-draft projections by significant margin. Shot creation off the dribble and spot-up three-point accuracy both grade at starting-caliber level. Clutch-time confidence and execution confirmed through repeated high-leverage opportunities. Clanker acknowledges this unit\'s undrafted status as a data anomaly in historical projection models.' },

  { id:'por_avdija', pid:1630166, name:'Deni Avdija', team:'POR', pos:'SF', rarity:'clutch', no:8,
    off:80, def:84, clutch:78, cons:84, ath:85,
    desc:'UNIT DENI AVDIJA: two-way wing profile with solid defensive metrics and expanding offensive role. Playmaking ability from the forward position above average. Three-point efficiency has improved across operational cycles. Portland deployment in new system context — role expansion projected. Clanker assessment: ascending profile, solid floor with upside remaining.' },

  { id:'mem_morant', pid:1629630, name:'Ja Morant', team:'MEM', pos:'PG', rarity:'clutch', no:12,
    off:88, def:72, clutch:88, cons:76, ath:98,
    desc:'UNIT JA MORANT: athleticism readings are among the highest Clanker has logged for a guard — vertical leap, acceleration, and body control in the paint are statistically elite. Finishing ability around the rim is elite. Availability subroutine has been flagged across multiple cycles — when operational, output is at all-star tier. Clanker notes high entertainment value indices.' },

  { id:'okc_jwilliams', pid:1631114, name:'Jalen Williams', team:'OKC', pos:'SG', rarity:'clutch', no:8,
    off:87, def:78, clutch:86, cons:86, ath:84,
    desc:'UNIT JALEN WILLIAMS: efficient two-way scoring guard within OKC\'s elite organizational system. Shot creation off the dribble and three-point shooting both grade at starting-caliber level. Defensive effort and IQ above position average. OKC supporting unit within top organizational context. Clanker projects continued development into higher tier classification.' },

  { id:'cle_mobley', pid:1630596, name:'Evan Mobley', team:'CLE', pos:'PF', rarity:'clutch', no:4,
    off:80, def:90, clutch:78, cons:84, ath:88,
    desc:'UNIT EVAN MOBLEY: defensive profile is the primary value vector — rim protection, lateral mobility to guard wings, and help-side positioning all grade elite for a big man. Offensive toolkit expanding — face-up scoring and three-point shooting are developing vectors. Cleveland foundational defensive unit. All-defensive team candidacy: active.' },

  { id:'ind_siakam', pid:1627783, name:'Pascal Siakam', team:'IND', pos:'PF', rarity:'clutch', no:43,
    off:85, def:78, clutch:82, cons:86, ath:84,
    desc:'UNIT PASCAL SIAKAM: versatile forward profile with proven championship pedigree. Scoring from mid-range and the paint confirmed — face-up game is a primary scoring vector. Defensive versatility above position average. Most Improved Player designation and championship hardware indexed. Indiana deployment context with strong organizational support.' },

  { id:'hou_sengun', pid:1630578, name:'Alperen Sengun', team:'HOU', pos:'C', rarity:'clutch', no:28,
    off:87, def:76, clutch:80, cons:84, ath:76,
    desc:'UNIT ALPEREN SENGUN: offensive playmaking from the center position is the primary anomalous metric — passing and creation for others at a level Clanker\'s big-man subroutine had not anticipated. Post scoring and finishing efficiency both grade strong. Young Houston team built around this unit\'s playmaking hub. Defensive development is the primary growth vector Clanker is monitoring.' },

  { id:'cha_ball', pid:1630163, name:'LaMelo Ball', team:'CHA', pos:'PG', rarity:'clutch', no:1,
    off:88, def:68, clutch:83, cons:78, ath:83,
    desc:'UNIT LAMELO BALL: playmaking creativity and court vision grade among the top 5% for point guards. No-look passing and pinpoint accuracy in contested situations generate high-assist output. Three-point shooting from range confirmed. Defensive subroutine is below position average. Availability has been a monitoring flag. Entertainment metrics: extremely elevated.' },

  { id:'nop_zion', pid:1629627, name:'Zion Williamson', team:'NOP', pos:'PF', rarity:'clutch', no:1,
    off:92, def:74, clutch:84, cons:72, ath:99,
    desc:'UNIT ZION WILLIAMSON: physical force measurements are the highest Clanker has recorded for a wing forward — a combination of 280+ pounds and explosive athleticism that generates defensive breakdown at the rim. Scoring efficiency when operational is historically elite for the position. Availability subroutine is the critical risk variable — extended availability has not yet been achieved in any operational cycle. When active: elite tier.' },

  { id:'mia_herro', pid:1629639, name:'Tyler Herro', team:'MIA', pos:'SG', rarity:'clutch', no:14,
    off:88, def:68, clutch:82, cons:82, ath:78,
    desc:'UNIT TYLER HERRO: scoring output off the bench or as starter grades at all-star caliber in peak operational cycles. Three-point volume and efficiency are primary offensive tools. Shot creation off the dribble confirmed. Sixth Man of the Year hardware indexed. Miami role expanded to starting designation. Defensive metrics are the primary concern in Clanker\'s assessment.' },

  { id:'orl_wagner', pid:1630532, name:'Franz Wagner', team:'ORL', pos:'SF', rarity:'clutch', no:21,
    off:86, def:78, clutch:84, cons:86, ath:84,
    desc:'UNIT FRANZ WAGNER: ascending two-way wing with expanding offensive role as Orlando\'s primary scoring option. Playmaking above position average — passing IQ and creation for others grade as a secondary playmaking function. Shot creation off the dribble is developing rapidly. Defensive effort and size create solid two-way baseline. Clanker projection: continued upward trajectory.' },

  { id:'tor_barnes', pid:1630567, name:'Scottie Barnes', team:'TOR', pos:'PF', rarity:'clutch', no:4,
    off:82, def:84, clutch:80, cons:82, ath:88,
    desc:'UNIT SCOTTIE BARNES: two-way forward with elite athleticism and expanding offensive toolkit. Defensive versatility — ability to guard one through five — generates significant value in Clanker\'s matchup analysis. Playmaking from the forward position above average. Scoring development is the primary growth vector. Toronto foundational unit in rebuild context.' },

  { id:'uta_markkanen', pid:1628374, name:'Lauri Markkanen', team:'UTA', pos:'PF', rarity:'clutch', no:23,
    off:87, def:74, clutch:82, cons:84, ath:78,
    desc:'UNIT LAURI MARKKANEN: stretch-four profile with elite three-point shooting from the power forward position. Scoring efficiency grades at starting-caliber level. Defensive metrics adequate for the position. Most Improved Player hardware indexed. Utah primary offensive option. Clanker notes efficient scoring profile — high floor, established star-level output.' },

  { id:'uta_george', pid:1641718, name:'Keyonte George', team:'UTA', pos:'PG', rarity:'clutch', no:3,
    off:84, def:72, clutch:82, cons:78, ath:82,
    desc:'UNIT KEYONTE GEORGE: scoring guard with three-point volume and off-the-dribble creation as primary functions. Shot-making in difficult situations confirmed. Utah foundational piece in organizational rebuild. Defensive metrics below average — offensive-first designation. Clanker projects development trajectory with expanded role and increased usage.' },

  { id:'dal_flagg', pid:1642843, name:'Cooper Flagg', team:'DAL', pos:'SF', rarity:'clutch', no:2, isRookie:true,
    off:82, def:84, clutch:80, cons:76, ath:88,
    desc:'Unit FLAGG. Rookie designation. Insufficient data for full analysis. Early metrics: promising. Wingspan and defensive awareness readings above norm for first-year unit. Offensive toolkit: under construction, but functional. Potential ceiling: unknown. Clanker is watching.' },

  { id:'cha_knueppel', pid:1642851, name:'Kon Knueppel', team:'CHA', pos:'SG', rarity:'clutch', no:5, isRookie:true,
    off:80, def:74, clutch:78, cons:76, ath:80,
    desc:'Unit KNUEPPEL. Rookie designation. Insufficient data for full analysis. Early metrics: shot-making efficiency above expected baseline for first-year unit. Three-point accuracy flagged as potential primary tool. Potential ceiling: unknown. Clanker is watching.' },

  { id:'orl_banchero', pid:1631094, name:'Paolo Banchero', team:'ORL', pos:'PF', rarity:'clutch', no:5,
    off:88, def:76, clutch:83, cons:82, ath:86,
    desc:'UNIT PAOLO BANCHERO: franchise-level scoring forward operating as Orlando\'s primary option. Rookie of the Year hardware indexed. Scoring versatility from post, mid-range, and three-point vectors confirmed. Playmaking above position average — passing IQ is a differentiating skill for a forward. Clanker assessment: ascending trajectory, approaching elite tier classification.' },

  { id:'uta_jjackson', pid:1628991, name:'Jaren Jackson Jr.', team:'UTA', pos:'PF', rarity:'clutch', no:13,
    off:80, def:90, clutch:78, cons:80, ath:84,
    desc:'UNIT JAREN JACKSON JR.: defensive anchor designation confirmed — Defensive Player of the Year hardware indexed. Block rate is top-3 in the league across multiple seasons. Shot deterrence at the rim has measurable impact on opponent field goal percentage. Offensive output from three-point range is a supplemental but functional tool. New Utah deployment context.' },

  { id:'sac_sabonis', pid:1627734, name:'Domantas Sabonis', team:'SAC', pos:'C', rarity:'clutch', no:10,
    off:85, def:74, clutch:78, cons:88, ath:74,
    desc:'UNIT DOMANTAS SABONIS: playmaking center profile with elite rebounding and passing metrics. Assist generation from the five-position creates offense for teammates at an above-average rate. Rebounding: top-3 league-wide in multiple cycles. Triple-double production rate is Clanker-verified as one of the highest in current pool. Scoring efficiency from post and mid-range confirmed.' },

  { id:'bos_dwhite', pid:1628401, name:'Derrick White', team:'BOS', pos:'PG', rarity:'clutch', no:9,
    off:78, def:84, clutch:82, cons:84, ath:80,
    desc:'UNIT DERRICK WHITE: two-way guard with defensive metrics that consistently outperform offensive role. Shot-blocking rate for a guard is anomalously high — Clanker flagged this as a sensor error before verification confirmed. Three-point shooting efficiency is reliable and consistent. Championship hardware indexed. Boston system player operating at high efficiency.' },

  { id:'hou_thompson', pid:1641708, name:'Amen Thompson', team:'HOU', pos:'SF', rarity:'clutch', no:1,
    off:78, def:84, clutch:76, cons:80, ath:94,
    desc:'UNIT AMEN THOMPSON: athleticism readings are elite — transition impact and above-the-rim play generate significant defensive and offensive upside. Finishing at the rim grades at high efficiency. Three-point shooting is the primary development vector. Defensive intensity and hustle metrics are above average. Houston ascending organizational unit.' },

  { id:'min_randle', pid:203944, name:'Julius Randle', team:'MIN', pos:'PF', rarity:'clutch', no:30,
    off:86, def:72, clutch:83, cons:82, ath:80,
    desc:'UNIT JULIUS RANDLE: physical scoring forward with All-Star designation in New York context. Post scoring and mid-range creation are primary tools. Three-point shooting efficiency has improved across operational cycles. Playmaking above position average — assist generation is a secondary function. Minnesota deployment in new organizational context.' },

  { id:'sas_fox', pid:1628368, name:"De'Aaron Fox", team:'SAS', pos:'PG', rarity:'clutch', no:5,
    off:86, def:78, clutch:84, cons:86, ath:93,
    desc:"UNIT DE'AARON FOX: elite speed and transition scoring create first-step advantages that Clanker's defensive simulation models cannot neutralize. Drives to the rim at the highest frequency among point guards. Clutch scoring metrics confirmed. San Antonio new deployment context — franchise primary option designation active." },

  { id:'nyk_anunoby', pid:1628384, name:'OG Anunoby', team:'NYK', pos:'SF', rarity:'clutch', no:8,
    off:74, def:90, clutch:74, cons:82, ath:88,
    desc:'UNIT OG ANUNOBY: defensive profile grades at elite tier — long wingspan and quick-twitch reactive subroutines generate lock-down capability on opposing wings and forwards. Offensive expansion noted but secondary to defensive value. Essential two-way component for playoff rotations. All-Defensive team designation: active.' },

  { id:'tor_ingram', pid:1627742, name:'Brandon Ingram', team:'TOR', pos:'SF', rarity:'clutch', no:14,
    off:88, def:70, clutch:83, cons:82, ath:83,
    desc:'UNIT BRANDON INGRAM: long, fluid scoring wing with ability to create shots in isolation and off the dribble. Scoring output has reached All-Star tier in peak operational cycles. Mid-range and three-point creation both functional. Defensive metrics below star-level but improving. Toronto new deployment context following New Orleans trade.' },

  { id:'cle_allen', pid:1628386, name:'Jarrett Allen', team:'CLE', pos:'C', rarity:'clutch', no:31,
    off:76, def:84, clutch:74, cons:86, ath:86,
    desc:'UNIT JARRETT ALLEN: rim-running and finishing efficiency grades elite — field goal percentage inside the paint ranks top-5 league-wide. Defensive presence and rebounding provide consistent two-way contribution. Cleveland supporting unit within contender context. Consistency metrics above position average — low-variance, high-floor profile.' },

  { id:'orl_bane', pid:1630217, name:'Desmond Bane', team:'ORL', pos:'SG', rarity:'clutch', no:22,
    off:84, def:76, clutch:82, cons:82, ath:78,
    desc:'UNIT DESMOND BANE: three-point shooting and shot creation grade at starting-caliber level. Scoring versatility — catch-and-shoot, pull-up, and off-screen movement — confirmed. Defensive effort above position average. New Orlando deployment context. Clanker notes consistent output across multiple organizational systems.' },

  { id:'bkn_porter', pid:1629008, name:'Michael Porter Jr.', team:'BKN', pos:'SF', rarity:'clutch', no:1,
    off:86, def:70, clutch:80, cons:76, ath:84,
    desc:'UNIT MICHAEL PORTER JR.: three-point shooting from the forward position grades elite — volume, efficiency, and shot difficulty all chart at high tier. Scoring versatility from multiple spots on the floor confirmed. Durability subroutine has been a monitoring parameter — availability across seasons has been inconsistent. Offensive ceiling is high when fully operational.' },

  { id:'cha_miller', pid:1641706, name:'Brandon Miller', team:'CHA', pos:'SF', rarity:'clutch', no:24,
    off:84, def:76, clutch:80, cons:80, ath:83,
    desc:'UNIT BRANDON MILLER: first-round selection with developing offensive toolkit. Three-point shooting and shot creation from the wing position are primary functions. Athleticism and size for the position grade above average. Charlotte ascending unit within organizational rebuild. Clanker projection: continued development trajectory.' },

  { id:'nop_murphy', pid:1630530, name:'Trey Murphy III', team:'NOP', pos:'SF', rarity:'clutch', no:25,
    off:82, def:76, clutch:78, cons:80, ath:83,
    desc:'UNIT TREY MURPHY III: three-point shooting efficiency and shot-making off movement grade at starting-caliber level. Athletic wing profile with solid defensive tools. New Orleans key piece in organizational rebuild. Scoring output has expanded with increased role. Clanker notes solid foundation with upside remaining.' },

  /* ──────────────── IMPACT (83-85) ──────────────── */
  { id:'ind_zubac', pid:1627826, name:'Ivica Zubac', team:'IND', pos:'C', rarity:'impact', no:40,
    off:74, def:80, clutch:70, cons:84, ath:72,
    desc:'UNIT IVICA ZUBAC: rim-running efficiency and rebounding provide consistent interior production. Screen-setting and finish-around-the-rim metrics grade at starting-caliber level. Defensive presence adequate. Indiana new deployment context after LA Clippers tenure. Consistent, low-variance big-man profile.' },

  { id:'min_gobert', pid:203497, name:'Rudy Gobert', team:'MIN', pos:'C', rarity:'impact', no:27,
    off:68, def:94, clutch:64, cons:88, ath:82,
    desc:'UNIT RUDY GOBERT: defensive impact at the rim is the primary value function — four-time Defensive Player of the Year hardware indexed. Opponent field goal percentage at the rim decreases measurably when this unit is deployed. Screen-and-roll finishing and offensive rebounding are supplemental tools. Defensive anchor designation: confirmed elite.' },

  { id:'mia_powell', pid:1626181, name:'Norman Powell', team:'MIA', pos:'SG', rarity:'impact', no:24,
    off:82, def:74, clutch:78, cons:82, ath:82,
    desc:'UNIT NORMAN POWELL: scoring guard with efficient three-point shooting and driving ability as primary tools. Output in starting role consistently productive. Defensive effort above average. Multiple team deployments across career — consistent output regardless of organizational context. Miami new deployment.' },

  { id:'sas_castle', pid:1642264, name:'Stephon Castle', team:'SAS', pos:'PG', rarity:'impact', no:5,
    off:76, def:80, clutch:74, cons:78, ath:84,
    desc:'UNIT STEPHON CASTLE: young defensive-minded guard with developing offensive toolkit. Size and athleticism at the point guard position create matchup problems on defensive end. San Antonio developmental unit within long-term organizational plan. Clanker assessment: raw potential metrics are high, refinement ongoing.' },

  { id:'nop_dmurray', pid:1627749, name:'Dejounte Murray', team:'NOP', pos:'PG', rarity:'impact', no:5,
    off:80, def:82, clutch:78, cons:80, ath:82,
    desc:'UNIT DEJOUNTE MURRAY: two-way guard profile with steal and deflection rates that chart top-5% for the position. Playmaking and assist creation above average. Scoring output has expanded with increased primary usage. Defensive investment is genuine. New Orleans deployment context.' },

  { id:'por_sharpe', pid:1631101, name:'Shaedon Sharpe', team:'POR', pos:'SG', rarity:'impact', no:17,
    off:82, def:74, clutch:76, cons:76, ath:88,
    desc:'UNIT SHAEDON SHARPE: explosive scoring guard with elite athleticism and developing offensive repertoire. Shot creation off the dribble and finishing at the rim grade above average. Portland developing unit with high ceiling projection. Three-point shooting is the primary development vector Clanker is monitoring.' },

  { id:'phx_brooks', pid:1628415, name:'Dillon Brooks', team:'PHX', pos:'SF', rarity:'impact', no:9,
    off:76, def:84, clutch:74, cons:80, ath:80,
    desc:'UNIT DILLON BROOKS: defensive identity wing with elite competitive threshold. Opposing star containment assignments accepted without hesitation — willingness to guard primary options confirmed. Offensive role secondary but functional. Three-point shooting efficiency adequate. Physicality metrics are above average.' },

  { id:'atl_naw', pid:1629638, name:'Nickeil Alexander-Walker', team:'ATL', pos:'SG', rarity:'impact', no:6,
    off:78, def:78, clutch:74, cons:78, ath:80,
    desc:'UNIT NICKEIL ALEXANDER-WALKER: versatile guard with solid two-way metrics. Three-point shooting efficiency above league average. Defensive effort and IQ above position average. Atlanta new deployment context. Clanker assessment: reliable two-way contributor with consistent output across organizational transitions.' },

  { id:'lac_garland', pid:1629636, name:'Darius Garland', team:'LAC', pos:'PG', rarity:'impact', no:10,
    off:84, def:66, clutch:80, cons:78, ath:76,
    desc:'UNIT DARIUS GARLAND: playmaking and scoring guard with elite three-point shooting and creation from the point guard position. Assist generation and pass accuracy grade at above-average level. Defensive metrics are the primary concern. LA Clippers new deployment context following Cleveland tenure.' },

  { id:'sac_derozan', pid:201942, name:'DeMar DeRozan', team:'SAC', pos:'SF', rarity:'impact', no:11,
    off:85, def:68, clutch:87, cons:82, ath:74,
    desc:'UNIT DEMAR DEROZAN: mid-range scoring artistry remains functional deep into career. Clutch-time scoring metrics are legendary by Clanker\'s historical analysis — game-winning shot generation is a confirmed and repeatable function. All-Star hardware: six units indexed. Sacramento new deployment context.' },

  { id:'chi_giddey', pid:1630581, name:'Josh Giddey', team:'CHI', pos:'PG', rarity:'impact', no:3,
    off:78, def:72, clutch:74, cons:80, ath:80,
    desc:'UNIT JOSH GIDDEY: playmaking forward-guard hybrid with triple-double production rate in top 10% for age cohort. Passing vision and court awareness grade as primary elite skills. Scoring output developing — shot efficiency is the primary improvement vector. Chicago deployment context.' },

  { id:'den_gordon', pid:203932, name:'Aaron Gordon', team:'DEN', pos:'PF', rarity:'impact', no:50,
    off:76, def:82, clutch:78, cons:84, ath:90,
    desc:'UNIT AARON GORDON: elite athleticism applied in two-way role within championship organization. Defensive versatility — guarding wings through centers — is the primary value function. Offensive role as cutter and screener within Denver system maximizes efficiency. Championship hardware indexed alongside Unit Jokic.' },

  { id:'tor_quickley', pid:1630193, name:'Immanuel Quickley', team:'TOR', pos:'PG', rarity:'impact', no:5,
    off:82, def:72, clutch:78, cons:78, ath:80,
    desc:'UNIT IMMANUEL QUICKLEY: scoring and playmaking guard with above-average three-point shooting and off-the-dribble creation. Role expanded significantly upon Toronto trade. Assist generation in primary ball-handler role above expectation. Clanker notes ascending trajectory with increased opportunity.' },

  { id:'was_sarr', pid:1642259, name:'Alex Sarr', team:'WAS', pos:'C', rarity:'impact', no:5,
    off:74, def:82, clutch:70, cons:76, ath:88,
    desc:'UNIT ALEX SARR: high-upside center with advanced defensive instincts for age. Rim protection, shot deterrence, and lateral mobility all grade above position norm for young player. Offensive toolkit in development — three-point shooting is a real vector. Washington rebuild foundational piece. Ceiling projection: significant.' },

  { id:'det_athompson', pid:1641709, name:'Ausar Thompson', team:'DET', pos:'SF', rarity:'impact', no:5,
    off:74, def:83, clutch:72, cons:76, ath:92,
    desc:'UNIT AUSAR THOMPSON: elite athleticism and defensive instincts are the primary value outputs. Transition play and above-the-rim finishing generate offensive production. Three-point shooting developing — primary growth vector identified. Detroit ascending unit within developing organizational context.' },

  { id:'por_clingan', pid:1642270, name:'Donovan Clingan', team:'POR', pos:'C', rarity:'impact', no:23,
    off:72, def:84, clutch:68, cons:78, ath:84,
    desc:'UNIT DONOVAN CLINGAN: elite shot-blocking and rim protection in young chassis. Block rate at historic levels for age cohort. Rebounding metrics above average. Offensive role in development — rim-running and screening efficiency are primary contributions. Portland rebuild unit with high defensive ceiling projection.' },

  { id:'sac_lavine', pid:203897, name:'Zach LaVine', team:'SAC', pos:'SG', rarity:'impact', no:8,
    off:88, def:68, clutch:82, cons:78, ath:92,
    desc:'UNIT ZACH LAVINE: elite athleticism and scoring ability in the two-guard position. Three-point shooting and finishing at the rim both grade at above-average efficiency. Two-time slam dunk championship hardware indexed. Sacramento new deployment context. Defensive metrics below average — offense-first designation.' },

  { id:'gsw_porzingis', pid:204001, name:'Kristaps Porzingis', team:'GSW', pos:'C', rarity:'impact', no:8,
    off:82, def:80, clutch:74, cons:72, ath:78,
    desc:'UNIT KRISTAPS PORZINGIS: seven-foot frame with perimeter shooting capability and rim protection in one chassis. Spacing floor impact grades as exceptional when operational. Durability subroutine remains the persistent vulnerability. Clanker recommends controlled minute deployment. GSW new organizational context.' },

  { id:'nyk_bridges', pid:1628969, name:'Mikal Bridges', team:'NYK', pos:'SF', rarity:'impact', no:25,
    off:80, def:85, clutch:76, cons:84, ath:84,
    desc:'UNIT MIKAL BRIDGES: league-recognized premier wing defender. Lateral quickness and anticipation indices generate above-average disruption on opposing primary options. Offensive role expanded in New York context. Pull-up repertoire and playmaking load increasing. Consistency rating above position average.' },

  { id:'atl_daniels', pid:1630700, name:'Dyson Daniels', team:'ATL', pos:'SG', rarity:'impact', no:5,
    off:72, def:86, clutch:70, cons:78, ath:84,
    desc:'UNIT DYSON DANIELS: defensive disruptor with steal rate among the highest in the league. Anticipation and hands-in-passing-lanes metrics are elite. Offensive role developing — scoring is a secondary subroutine. Atlanta defensive identity piece. Clanker flags this unit as significantly more valuable than raw offensive metrics suggest.' },

  { id:'tor_barrett', pid:1629628, name:'R.J. Barrett', team:'TOR', pos:'SF', rarity:'impact', no:9,
    off:82, def:72, clutch:78, cons:80, ath:83,
    desc:'UNIT R.J. BARRETT: scoring wing with expanding offensive toolkit in Toronto primary role context. Three-point shooting efficiency has improved with increased opportunity. Athleticism and size for the wing position grade above average. New York to Toronto transition — increased usage driving output growth.' },

  { id:'orl_suggs', pid:1630591, name:'Jalen Suggs', team:'ORL', pos:'PG', rarity:'impact', no:4,
    off:76, def:80, clutch:78, cons:78, ath:84,
    desc:'UNIT JALEN SUGGS: defensive-first guard with developing offensive capability. Steal rate and defensive effort metrics grade above position average. Scoring output expanding with increased role in Orlando system. Athleticism and competitiveness threshold confirmed. Clutch shot-making moments already documented in career log.' },

  { id:'okc_hartenstein', pid:1628392, name:'Isaiah Hartenstein', team:'OKC', pos:'C', rarity:'impact', no:55,
    off:74, def:82, clutch:70, cons:82, ath:78,
    desc:'UNIT ISAIAH HARTENSTEIN: playmaking center profile with above-average passing for position. Defensive rebounding and rim protection metrics solid. OKC supporting unit within elite organizational context. Screen-and-roll functionality and pick-and-pop shooting provide offensive value.' },

  { id:'min_mcdaniels', pid:1630183, name:'Jaden McDaniels', team:'MIN', pos:'SF', rarity:'impact', no:3,
    off:74, def:84, clutch:72, cons:78, ath:83,
    desc:'UNIT JADEN MCDANIELS: defensive wing with the ability to guard elite perimeter players. Length and anticipation generate consistent disruption. Three-point shooting developing into functional offensive tool. Minnesota defensive system key piece. Clanker notes defensive value exceeds raw offensive metrics.' },

  { id:'uta_kessler', pid:1631117, name:'Walker Kessler', team:'UTA', pos:'C', rarity:'impact', no:24,
    off:66, def:88, clutch:62, cons:80, ath:82,
    desc:'UNIT WALKER KESSLER: elite rim protector with block rate charting in historic range for age cohort. Shot deterrence impact on opposing field goal percentage is statistically significant. Offensive role limited to screening and rim-running but executed at high efficiency. Utah defensive anchor designation active.' },

  { id:'por_holiday', pid:201950, name:'Jrue Holiday', team:'POR', pos:'PG', rarity:'impact', no:12,
    off:74, def:88, clutch:78, cons:82, ath:82,
    desc:'UNIT JRUE HOLIDAY: Clanker-rated premier perimeter defensive asset. Steal generation and deflection rates consistently chart in top 5% league-wide. Offensive function satisfactory — not primary option but reliable within team structure. Championship hardware indexed from Boston deployment. Portland new context.' },

  { id:'atl_mccollum', pid:203468, name:'C.J. McCollum', team:'ATL', pos:'SG', rarity:'impact', no:3,
    off:82, def:68, clutch:78, cons:80, ath:74,
    desc:'UNIT C.J. MCCOLLUM: reliable scoring guard with shot creation off the dribble and three-point efficiency as primary tools. Pull-up mid-range shooting is a consistent option. Career output has been steady across multiple organizational deployments. Atlanta new context.' },

  { id:'chi_buzelis', pid:1641824, name:'Matas Buzelis', team:'CHI', pos:'SF', rarity:'impact', no:14,
    off:76, def:76, clutch:72, cons:74, ath:84,
    desc:'UNIT MATAS BUZELIS: intriguing young wing with length, athleticism, and developing two-way toolkit. Three-point shooting and defensive versatility both grade above average for age. Chicago developing unit. Offensive repertoire and decision-making are primary growth vectors Clanker is tracking.' },

  { id:'nop_bey', pid:1630180, name:'Saddiq Bey', team:'NOP', pos:'SF', rarity:'impact', no:41,
    off:76, def:74, clutch:72, cons:78, ath:78,
    desc:'UNIT SADDIQ BEY: versatile wing with three-point shooting and solid defensive tools. Scoring output has expanded across operational cycles. New Orleans deployment context. Two-way contributor profile with consistent production across systems.' },

  { id:'den_watson', pid:1631212, name:'Peyton Watson', team:'DEN', pos:'SF', rarity:'impact', no:8,
    off:70, def:80, clutch:68, cons:74, ath:86,
    desc:'UNIT PEYTON WATSON: athletic defensive wing with elite length and shot-blocking ability for the position. Transition play and finishing above the rim grade well. Offensive toolkit expanding — three-point shooting is the primary development vector. Denver championship organizational context provides high-quality development environment.' },

  { id:'por_grant', pid:203924, name:'Jerami Grant', team:'POR', pos:'SF', rarity:'impact', no:9,
    off:80, def:76, clutch:76, cons:80, ath:82,
    desc:'UNIT JERAMI GRANT: versatile scoring forward with three-point shooting and driving ability as primary tools. Defensive effort and switchability above average. Portland deployment context. Scoring output expanded with primary usage designation. Consistent two-way contributor.' },

  { id:'mem_jerome', pid:1629660, name:'Ty Jerome', team:'MEM', pos:'PG', rarity:'impact', no:10,
    off:80, def:70, clutch:78, cons:80, ath:72,
    desc:'UNIT TY JEROME: reliable playmaking guard with three-point shooting efficiency above league average. Decision-making and turnover avoidance grade at above-average level. Memphis deployment context in young organizational rebuild. Veteran floor-raising function.' },

  /* ──────────────── PRO (82 and below) ──────────────── */
  { id:'phx_green', pid:1630224, name:'Jalen Green', team:'PHX', pos:'SG', rarity:'pro', no:4,
    off:84, def:62, clutch:78, cons:74, ath:88,
    desc:'UNIT JALEN GREEN. High-scoring guard chassis. Athleticism and scoring instincts above average. Three-point volume notable. Phoenix new organizational context. Development trajectory: monitoring.' },

  { id:'min_reid', pid:1629675, name:'Naz Reid', team:'MIN', pos:'C', rarity:'pro', no:11,
    off:76, def:74, clutch:72, cons:78, ath:74,
    desc:'UNIT NAZ REID. Reliable bench scoring big man. Three-point shooting from center position functional. Sixth Man of the Year hardware indexed. Minnesota supporting unit.' },

  { id:'bos_vucevic', pid:202696, name:'Nikola Vucevic', team:'BOS', pos:'C', rarity:'pro', no:9,
    off:74, def:66, clutch:68, cons:78, ath:68,
    desc:'UNIT NIKOLA VUCEVIC. Veteran center with reliable scoring and rebounding. Multiple All-Star designations indexed. Boston supporting unit. Consistent floor-level production.' },

  { id:'nyk_hart', pid:1628404, name:'Josh Hart', team:'NYK', pos:'SG', rarity:'pro', no:3,
    off:68, def:76, clutch:70, cons:78, ath:80,
    desc:'UNIT JOSH HART. High-effort output on both ends. Rebounding for guard position anomalously strong. Hustle metrics above average. Crowd-favorite catalyst designation confirmed.' },

  { id:'phi_pgeorge', pid:202331, name:'Paul George', team:'PHI', pos:'SF', rarity:'pro', no:8,
    off:78, def:74, clutch:74, cons:70, ath:80,
    desc:'UNIT PAUL GEORGE. Nine-time All-Star hardware indexed. Scoring versatility from wing position confirmed. Availability has been a monitoring parameter in recent cycles. Philadelphia deployment.' },

  { id:'atl_okongwu', pid:1630168, name:'Onyeka Okongwu', team:'ATL', pos:'C', rarity:'pro', no:17,
    off:70, def:80, clutch:66, cons:78, ath:82,
    desc:'UNIT ONYEKA OKONGWU. Athletic center with rim protection and finishing ability. Defensive metrics above position average. Atlanta supporting unit in rebuild context.' },

  { id:'ind_nembhard', pid:1629614, name:'Andrew Nembhard', team:'IND', pos:'PG', rarity:'pro', no:2,
    off:72, def:74, clutch:76, cons:78, ath:74,
    desc:'UNIT ANDREW NEMBHARD. Reliable playmaking backup guard. Decision-making and turnover avoidance above average. Playoff clutch moments documented. Indiana supporting unit.' },

  { id:'nyk_shamet', pid:1629013, name:'Landry Shamet', team:'NYK', pos:'SG', rarity:'pro', no:14,
    off:68, def:62, clutch:66, cons:72, ath:68,
    desc:'UNIT LANDRY SHAMET. Three-point specialist designation. Spot-up shooting provides floor spacing value. Role player profile operating within team system.' },

  { id:'mem_edey', pid:1641744, name:'Zach Edey', team:'MEM', pos:'C', rarity:'pro', no:6,
    off:70, def:72, clutch:64, cons:74, ath:68,
    desc:'UNIT ZACH EDEY. NCAA national championship unit. Physical center with rebounding and finishing as primary functions. Developing NBA readiness profile.' },

  { id:'chi_caruso', pid:1627936, name:'Alex Caruso', team:'CHI', pos:'PG', rarity:'pro', no:6,
    off:60, def:80, clutch:68, cons:78, ath:76,
    desc:'UNIT ALEX CARUSO. Defensive specialist with steal rate in elite tier for role player classification. Hustle and competitive threshold above average. Clanker-certified chaos agent on the defensive end.' },

  { id:'phi_mccain', pid:1642272, name:'Jared McCain', team:'OKC', pos:'SG', rarity:'pro', no:6,
    off:74, def:64, clutch:70, cons:70, ath:76,
    desc:'UNIT JARED McCAIN. Young scoring guard with three-point shooting as primary function. Oklahoma City unit. Output per-minute metrics encouraging.' },

  { id:'okc_jwilliams2', pid:1631119, name:'Jaylin Williams', team:'OKC', pos:'PF', rarity:'pro', no:6,
    off:64, def:74, clutch:62, cons:74, ath:76,
    desc:'UNIT JAYLIN WILLIAMS. Versatile big man with defensive switchability. OKC developmental unit within elite organizational context. Role player function.' },

  { id:'hou_jenkins', pid:1642450, name:'Daniss Jenkins', team:'HOU', pos:'PG', rarity:'pro', no:2,
    off:62, def:68, clutch:60, cons:66, ath:74,
    desc:'UNIT DANISS JENKINS. Young guard in Houston developmental program. Athletic profile with playmaking instincts. Data sample limited. Clanker monitoring.' },

  /* ──────────────── 2025 ROOKIE CLASS ──────────────── */
  { id:'phi_edgecombe', pid:1642845, name:'VJ Edgecombe', team:'PHI', pos:'SG', rarity:'pro', no:5, isRookie:true,
    off:64, def:66, clutch:62, cons:60, ath:88,
    desc:'Unit EDGECOMBE. Rookie designation. Insufficient data for full analysis. Early metrics: elite athleticism readings noted. Explosive guard profile. Potential ceiling: unknown. Clanker is watching.' },

  { id:'tor_murrayboyles', pid:1642867, name:'Collin Murray-Boyles', team:'TOR', pos:'PF', rarity:'pro', no:7, isRookie:true,
    off:60, def:68, clutch:58, cons:60, ath:80,
    desc:'Unit MURRAY-BOYLES. Rookie designation. Insufficient data for full analysis. Early metrics: defensive instincts above norm for first-year unit. Toronto organizational context provides development path. Potential ceiling: unknown. Clanker is watching.' },

  { id:'cha_kalkbrenner', pid:1641750, name:'Ryan Kalkbrenner', team:'CHA', pos:'C', rarity:'pro', no:11, isRookie:true,
    off:58, def:72, clutch:54, cons:62, ath:72,
    desc:'Unit KALKBRENNER. Rookie designation. Insufficient data for full analysis. Early metrics: rim protection instincts flagged as above average. Shot-blocking tendency noted. Potential ceiling: unknown. Clanker is watching.' },

  { id:'sac_raynaud', pid:1642875, name:'Maxime Raynaud', team:'SAC', pos:'C', rarity:'pro', no:42, isRookie:true,
    off:62, def:66, clutch:56, cons:60, ath:72,
    desc:'Unit RAYNAUD. Rookie designation. Insufficient data for full analysis. Early metrics: size and skill combination for European-trained big man noted. Sacramento development context active. Potential ceiling: unknown. Clanker is watching.' },

  { id:'mem_coward', pid:1642907, name:'Cedric Coward', team:'MEM', pos:'SF', rarity:'pro', no:6, isRookie:true,
    off:60, def:64, clutch:58, cons:58, ath:82,
    desc:'Unit COWARD. Rookie designation. Insufficient data for full analysis. Early metrics: athleticism readings above expected baseline. Wing profile with two-way potential flagged. Potential ceiling: unknown. Clanker is watching.' },

  { id:'uta_bailey', pid:1642846, name:'Ace Bailey', team:'UTA', pos:'SF', rarity:'pro', no:6, isRookie:true,
    off:64, def:62, clutch:62, cons:58, ath:86,
    desc:'Unit BAILEY. Rookie designation. Insufficient data for full analysis. Early metrics: scoring instincts and athleticism grade above average for first-year unit. Utah developmental context active. Potential ceiling: unknown. Clanker is watching.' },

  { id:'nop_queen', pid:1642852, name:'Derik Queen', team:'NOP', pos:'C', rarity:'pro', no:8, isRookie:true,
    off:62, def:66, clutch:58, cons:60, ath:78,
    desc:'Unit QUEEN. Rookie designation. Insufficient data for full analysis. Early metrics: playmaking instincts for center position flagged as above norm. New Orleans developmental path active. Potential ceiling: unknown. Clanker is watching.' },

  { id:'sas_harper', pid:1642844, name:'Dylan Harper', team:'SAS', pos:'PG', rarity:'pro', no:2, isRookie:true,
    off:66, def:62, clutch:64, cons:60, ath:82,
    desc:'Unit HARPER. Rookie designation. Insufficient data for full analysis. Early metrics: playmaking and scoring instincts noted for first-year point guard. San Antonio Spurs developmental program active. Potential ceiling: unknown. Clanker is watching.' },

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
