const puppeteer = require('puppeteer');
const https = require('https');

const GITHUB_TOKEN = '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';
const GITHUB_USER = 'j33matt';
const GITHUB_REPO = 'JohnsonsClankerRanker';
const FILE_PATH = 'nfl-data.js';

const TEAMS = [
  'arizona-cardinals','atlanta-falcons','baltimore-ravens','buffalo-bills',
  'carolina-panthers','chicago-bears','cincinnati-bengals','cleveland-browns',
  'dallas-cowboys','denver-broncos','detroit-lions','green-bay-packers',
  'houston-texans','indianapolis-colts','jacksonville-jaguars','kansas-city-chiefs',
  'las-vegas-raiders','los-angeles-chargers','los-angeles-rams','miami-dolphins',
  'minnesota-vikings','new-england-patriots','new-orleans-saints','new-york-giants',
  'new-york-jets','philadelphia-eagles','pittsburgh-steelers','san-francisco-49ers',
  'seattle-seahawks','tampa-bay-buccaneers','tennessee-titans','washington-commanders'
];

async function scrapeTeam(page, team) {
  console.log(`Scraping ${team}...`);
  await page.goto(`https://www.maddenratings.com/teams/${team}`, { waitUntil: 'networkidle2', timeout: 30000 });
  await page.waitForSelector('table', { timeout: 15000 });
  return await page.evaluate(() => {
    const rows = document.querySelectorAll('table tr');
    const players = [];
    rows.forEach(row => {
      const cells = row.querySelectorAll('td');
      if (cells.length >= 3) {
        const rawName = cells[1]?.innerText?.trim();
        const name = rawName?.split('\n')[0].split('#')[0].trim();
        const ovr = parseInt(cells[2]?.innerText?.trim());
        if (name && ovr && ovr > 50) players.push({ name, ovr });
      }
    });
    return players;
  });
}

async function getFileSha() {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'api.github.com',
      path: `/repos/${GITHUB_USER}/${GITHUB_REPO}/contents/${FILE_PATH}`,
      headers: { 'Authorization': `token ${GITHUB_TOKEN}`, 'User-Agent': 'madden-scraper' }
    };
    https.get(options, res => {
      let data = '';
      res.on('data', d => data += d);
      res.on('end', () => resolve(JSON.parse(data).sha));
    }).on('error', reject);
  });
}

async function getCurrentFile() {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'api.github.com',
      path: `/repos/${GITHUB_USER}/${GITHUB_REPO}/contents/${FILE_PATH}`,
      headers: { 'Authorization': `token ${GITHUB_TOKEN}`, 'User-Agent': 'madden-scraper' }
    };
    https.get(options, res => {
      let data = '';
      res.on('data', d => data += d);
      res.on('end', () => {
        const json = JSON.parse(data);
        resolve(Buffer.from(json.content, 'base64').toString('utf8'));
      });
    }).on('error', reject);
  });
}

async function pushToGitHub(newContent, sha) {
  return new Promise((resolve, reject) => {
    const body = JSON.stringify({
      message: 'Update Madden ratings',
      content: Buffer.from(newContent).toString('base64'),
      sha
    });
    const options = {
      hostname: 'api.github.com',
      path: `/repos/${GITHUB_USER}/${GITHUB_REPO}/contents/${FILE_PATH}`,
      method: 'PUT',
      headers: {
        'Authorization': `token ${GITHUB_TOKEN}`,
        'User-Agent': 'madden-scraper',
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(body)
      }
    };
    const req = https.request(options, res => {
      let data = '';
      res.on('data', d => data += d);
      res.on('end', () => resolve(JSON.parse(data)));
    });
    req.on('error', reject);
    req.write(body);
    req.end();
  });
}

(async () => {
  const browser = await puppeteer.launch({ 
    headless: false,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  const page = await browser.newPage();
  await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36');

  const allRatings = {};
  for (const team of TEAMS) {
    try {
      const players = await scrapeTeam(page, team);
      players.forEach(p => {
        const key = p.name.toLowerCase().replace(/[.'''`]/g, '').replace(/\s+/g, ' ').trim();
        allRatings[key] = p.ovr;
      });
      console.log(`  ✓ ${team}: ${players.length} players`);
    } catch(e) {
      console.error(`  ✗ ${team}: ${e.message}`);
    }
  }

  await browser.close();
  console.log(`\nTotal players scraped: ${Object.keys(allRatings).length}`);

  const ratingsObj = 'const MADDEN_RATINGS = ' + JSON.stringify(allRatings, null, 2) + ';';
  const currentFile = await getCurrentFile();
  const sha = await getFileSha();
  const newFile = currentFile.replace(/const MADDEN_RATINGS = \{[\s\S]*?\};/, ratingsObj);

  await pushToGitHub(newFile, sha);
  console.log('✓ nfl-data.js updated on GitHub!');
})();
