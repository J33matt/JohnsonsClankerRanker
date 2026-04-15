
function getPowerColor(score, min, max) {
  const pct = (score - min) / (max - min);
  if (pct > 0.7) return "#ff4d00";
  if (pct > 0.4) return "#ffaa00";
  return "#3399ff";
}
// Format moneyline for display: +150 or -110
function _fmtML(ml) {
  if (!ml) return 'EVEN';
  return (ml > 0 ? '+' : '') + ml;
}
// Each badge has a hover tooltip listing who affected the score and by how much.
function _predInjBadgeHtml(outPlayers, returnPlayers) {
  const RARITY_PENALTY = { gamebreaker:5.0, superstar:4.0, elite:3.0, clutch:2.0, impact:1.0, pro:0.5 };
  const RETURN_SCALE_LABEL = (gm) => gm <= 3 ? '70%' : gm <= 9 ? '50%' : gm <= 19 ? '30%' : '15%';
  let html = '';

  if (outPlayers && outPlayers.length) {
    const totalPen = outPlayers.reduce((s, p) => s + (RARITY_PENALTY[p.rarity] || 0), 0);
    const rows = outPlayers.map(p => {
      const pen = RARITY_PENALTY[p.rarity] || 0;
      return `<div class="pred-inj-tooltip-row">
        <span>${p.name}</span>
        <span class="pred-inj-tooltip-games">${p.gamesMissed}G out</span>
        <span class="pred-inj-tooltip-penalty">-${pen.toFixed(1)}</span>
      </div>`;
    }).join('');
    html += `<span class="pred-inj-badge" title="">
      <span class="pred-inj-icon">🏥</span>
      <span class="pred-inj-tooltip">
        <div class="pred-inj-tooltip-title">Injury penalty (-${Math.min(totalPen,10).toFixed(1)} pts)</div>
        ${rows}
      </span>
    </span>`;
  }

  if (returnPlayers && returnPlayers.length) {
    const totalBoost = returnPlayers.reduce((s, p) => {
      const base = RARITY_PENALTY[p.rarity] || 0;
      return s + base * (p.boostScale || 0);
    }, 0);
    const rows = returnPlayers.map(p => {
      const base = RARITY_PENALTY[p.rarity] || 0;
      const boost = base * (p.boostScale || 0);
      return `<div class="pred-inj-tooltip-row">
        <span>${p.name}</span>
        <span class="pred-inj-tooltip-games">${p.gamesMissed}G out · ${RETURN_SCALE_LABEL(p.gamesMissed)} str</span>
        <span class="pred-inj-tooltip-boost">+${boost.toFixed(1)}</span>
      </div>`;
    }).join('');
    html += `<span class="pred-inj-badge returning" title="">
      <span class="pred-inj-icon">💚</span>
      <span class="pred-inj-tooltip">
        <div class="pred-inj-tooltip-title">Return boost (+${Math.min(totalBoost,7).toFixed(1)} pts)</div>
        ${rows}
      </span>
    </span>`;
  }

  return html;
}
