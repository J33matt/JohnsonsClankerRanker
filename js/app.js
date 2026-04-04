function showTab(id, btn) {
  document.querySelectorAll('.panel').forEach(p => p.classList.remove('active'));
  document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
  document.getElementById('panel-' + id).classList.add('active');
  btn.classList.add('active');
  if (id === 'rankings') {
    document.getElementById('ai-analysis-text').innerHTML = `<div id="ai-loading"><div class="mini-spinner"></div> Generating fresh analysis...</div>`;
    fetchAIAnalysis();
    renderRankings();
    // Refresh net ratings in the background so values update as games finish
    fetchLiveNetRatings();
  }
  if (id === 'predictions') renderPredictions().catch(function(e) {
    const c = document.getElementById('predictions-container');
    if (c) c.innerHTML = '<div class="pred-no-games">Error loading predictions: ' + (e.message || 'unknown error') + '</div>';
  });
  if (id === 'graph') {
    if (!graphChart) { renderGraph(); }
    else { _weeklySnapshotsCache = null; updateGraph(); }
  }
  if (id === 'playoffs')  renderPlayoffs();
  if (id === 'draft')     renderDraft();
  if (id === 'simulator') renderSimulator();
  if (id === 'sportsbook') renderSportsbook();
}

// ============================================================
// INIT
// ============================================================
document.addEventListener('DOMContentLoaded', async () => {
  const now = new Date();
  document.getElementById('update-time').textContent = 'Updated ' + now.toLocaleDateString('en-US',{month:'short',day:'numeric'}) + ' · ' + now.toLocaleTimeString('en-US',{hour:'numeric',minute:'2-digit'});

  // Seed last-game map from static data so column shows immediately
  seedLastGameMap(RECENT_GAMES.map(g => ({ ...g, isFinal: g.status === 'final' })));

  // Auto-inject a new weekly graph point if 7+ days have passed since last entry
  (function() {
    const last = WEEKLY_RANKINGS[WEEKLY_RANKINGS.length - 1];
    const lastDate = new Date(last.date);
    const today = new Date(); today.setHours(0,0,0,0);
    if (Math.floor((today - lastDate) / 86400000) >= 7) {
      const label   = today.toLocaleDateString('en-US', { month: 'short', day: '2-digit' });
      const dateStr = today.toISOString().slice(0, 10);
      const entries = STANDINGS_DATA.map(t => {
        const ps = computePowerScore(t);
        return { team: t.abbr, wins: t.wins, losses: t.losses, power: ps.power, netRtg: ps.netRtg };
      }).sort((a,b) => b.power - a.power).map((e,i) => ({ ...e, rank: i+1 }));
      WEEKLY_RANKINGS.push({ date: dateStr, label, rankings: entries });
    }
  })();

  // Fetch live net ratings from ESPN stats API (falls back to NBAstuffer, then hardcoded)
  fetchLiveNetRatings();

  // Fetch authoritative streaks from ESPN standings API · fixes any stale hardcoded values
  fetchESPNStreaks();

  // Generate today's picks first so moneylines are in localStorage before scores render
  await _predEnsureTodaysPicks();

  renderRankings();
  renderScores(); // async · will update scores-container when done, then start poll loop
  renderPlayoffs();
  renderSimulator();
  renderDraft();
  fetchAIAnalysis();
  // Graph is rendered lazily when tab is opened

  // Auto-settle any open sportsbook bets in background
  _sbAutoSettle().catch(() => {});
});
