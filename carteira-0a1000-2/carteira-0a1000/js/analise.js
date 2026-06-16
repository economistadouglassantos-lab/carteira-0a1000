// ── ANALISE.JS — Gráficos, rankings, Bazin/FCD ──

// ── DOUGHNUT CHARTS ──
let chartsInited = false; // reset on each visit

function initCharts() {
  if (chartsInited) return;
  chartsInited = true;

  const DOUGHNUT_OPTS = {
    cutout: '62%', responsive: true, maintainAspectRatio: false,
    animation: { duration: 900, easing: 'easeOutQuart' },
    plugins: {
      legend: { display: false },
      tooltip: { callbacks: { label: ctx => ' ' + ctx.label + ': ' + ctx.parsed + '%' } }
    }
  };

  new Chart(document.getElementById('chartRegional'), {
    type: 'doughnut',
    data: { labels: ['Global','Europa','EUA','Brasil','Privado'],
      datasets: [{ data: [40,30,20,5,5], backgroundColor: ['#2563eb','#0891b2','#d97706','#059669','#6b7280'], borderWidth: 0, hoverOffset: 6 }] },
    options: DOUGHNUT_OPTS
  });

  new Chart(document.getElementById('chartSector'), {
    type: 'doughnut',
    data: { labels: ['ETF/Índices','Fintech','Aero/Defesa','Farmacêutico','Energia','Imobiliário','Pasta/Papel','Outros'],
      datasets: [{ data: [35,16,8,8,8,7,8,10], backgroundColor: ['#2563eb','#0891b2','#d97706','#059669','#7c3aed','#dc2626','#16a34a','#6b7280'], borderWidth: 0, hoverOffset: 6 }] },
    options: DOUGHNUT_OPTS
  });

  new Chart(document.getElementById('chartTese'), {
    type: 'doughnut',
    data: { labels: ['Alta convicção','ETF estrutural','Conv. moderada','Âncora'],
      datasets: [{ data: [32,35,18,15], backgroundColor: ['#1a3a6b','#2563eb','#0891b2','#6b7280'], borderWidth: 0, hoverOffset: 6 }] },
    options: DOUGHNUT_OPTS
  });

  renderValuationCards(window.gsPrices || {});
}

// ── RANKINGS ──
function renderRankings(quotesMap) {
  const entries = Object.values(quotesMap).filter(e => e.changePct != null && !isNaN(e.changePct));
  const sorted  = [...entries].sort((a, b) => b.changePct - a.changePct);
  const top5    = sorted.slice(0, 5);
  const bot5    = sorted.slice(-5).reverse();

  function rowHTML(e, i) {
    const isUp = e.changePct >= 0;
    const sign = isUp ? '+' : '';
    return `<div class="ranking-row">
      <span class="rank-pos">${i+1}</span>
      <span class="rank-name">${e.name}<br><span class="rank-ticker">${e.ticker}</span></span>
      <span class="rank-pct ${isUp ? 'up' : 'down'}">${sign}${e.changePct.toFixed(2)}%</span>
    </div>`;
  }

  const upEl   = document.getElementById('ranking-up');
  const downEl = document.getElementById('ranking-down');
  if (upEl)   upEl.innerHTML   = top5.length ? top5.map((e,i)  => rowHTML(e,i)).join('') : '<div class="rank-empty">Sem dados.</div>';
  if (downEl) downEl.innerHTML = bot5.length ? bot5.map((e,i)  => rowHTML(e,i)).join('') : '<div class="rank-empty">Sem dados.</div>';
  const el = document.getElementById('ranking-update');
  if (el) el.textContent = 'Actualizado: ' + new Date().toLocaleTimeString('pt-PT', {hour:'2-digit',minute:'2-digit'});
}

// ── BAZIN / FCD ──
const BAZIN_KEY = 'carteira_valuation_v1';

function calcBazin(dpa) { return dpa / 0.06; }

function calcFCD(eps, g, anos=5) {
  if (!eps || !g) return null;
  const r = TAXA_DESCONTO;
  if (r <= g) return eps * 50;
  let soma = 0;
  for (let i = 1; i <= anos; i++) soma += (eps * Math.pow(1+g, i)) / Math.pow(1+r, i);
  return soma + (eps * Math.pow(1+g, anos) * 1.04) / ((r - 0.04) * Math.pow(1+r, anos));
}

function verdict(current, teto, method) {
  if (!current || !teto) return { cls:'pendente', label:'Insere o preço actual' };
  const margin = ((teto - current) / teto) * 100;
  if (method === 'fcd') {
    if (margin > 20) return { cls:'compra',  label:'Subvalorizada — margem de ' + margin.toFixed(0) + '%' };
    if (margin > 0)  return { cls:'neutra',  label:'Próxima do valor intrínseco' };
    return                  { cls:'cara',    label:'Sobrevalorizada — ' + Math.abs(margin).toFixed(0) + '% acima' };
  }
  if (margin > 15) return { cls:'compra', label:'Abaixo do teto — compra!' };
  if (margin > 0)  return { cls:'neutra', label:'Perto do teto — atenção' };
  return                  { cls:'cara',   label:'Acima do teto — cara' };
}

function loadValuationPrices() { try { return JSON.parse(localStorage.getItem(BAZIN_KEY)) || {}; } catch { return {}; } }
function saveValuationPrice(ticker, price) {
  const d = loadValuationPrices(); d[ticker] = price;
  try { localStorage.setItem(BAZIN_KEY, JSON.stringify(d)); } catch {}
}

function calcValuation(ticker) {
  const input = document.getElementById('val-input-' + ticker.replace(/[^a-zA-Z0-9]/g,'-'));
  if (!input) return;
  const price = parseFloat(input.value);
  if (!price || isNaN(price)) return;
  saveValuationPrice(ticker, price);
  renderValuationCards(window.gsPrices || {});
}

function renderValuationCards(livePrices) {
  const grid = document.getElementById('valuation-grid');
  if (!grid) return;
  const saved  = loadValuationPrices();
  const prices = livePrices || window.gsPrices || {};

  grid.innerHTML = VALUATION_DATA.map(d => {
    const safeId    = d.ticker.replace(/[^a-zA-Z0-9]/g, '-');
    const livePrice = prices[d.ticker]?.price ?? null;
    const current   = livePrice ?? saved[d.ticker] ?? null;
    const isLive    = livePrice != null;

    let teto, tetoLabel, metodoLabel;
    if (d.method === 'bazin') {
      teto = calcBazin(d.dpa); tetoLabel = d.currency + ' ' + teto.toFixed(2); metodoLabel = 'Preço-Teto de Bazin';
    } else if (d.eps && d.g) {
      teto = calcFCD(d.eps, d.g); tetoLabel = '$ ' + (teto ? teto.toFixed(2) : '—'); metodoLabel = 'FCD simplificado';
    } else {
      teto = null; tetoLabel = '—'; metodoLabel = 'FCD';
    }

    const v = verdict(current, teto, d.method);
    const sym = d.method === 'bazin' ? d.currency : '$';
    const priceDisplay = current
      ? `${sym} ${current.toFixed(2)} ${isLive
          ? '<span style="font-size:10px;padding:1px 5px;border-radius:3px;background:#dcfce7;color:#065f46;margin-left:4px;">Sheets</span>'
          : '<span style="font-size:10px;padding:1px 5px;border-radius:3px;background:#f3f4f6;color:#6b7280;margin-left:4px;">Manual</span>'}`
      : '—';

    const rows = d.method === 'bazin' ? `
      <div class="val-row"><span class="val-label">Dividendo/acção</span><span class="val-value">${d.currency} ${d.dpa.toFixed(3)}</span></div>
      <div class="val-row"><span class="val-label">Preço-Teto (÷6%)</span><span class="val-value">${tetoLabel}</span></div>
      <div class="val-row"><span class="val-label">Preço actual</span><span class="val-value">${priceDisplay}</span></div>
    ` : d.eps ? `
      <div class="val-row"><span class="val-label">EPS (TTM)</span><span class="val-value">$ ${d.eps.toFixed(2)}</span></div>
      <div class="val-row"><span class="val-label">Crescimento esperado</span><span class="val-value">${(d.g*100).toFixed(0)}% /ano</span></div>
      <div class="val-row"><span class="val-label">Valor intrínseco</span><span class="val-value">${tetoLabel}</span></div>
      <div class="val-row"><span class="val-label">Preço actual</span><span class="val-value">${priceDisplay}</span></div>
    ` : `<div class="val-row"><span class="val-label">Dados</span><span class="val-value" style="color:var(--muted)">Indisponíveis</span></div>`;

    return `<div class="valuation-card ${v.cls}">
      <div class="val-method">${metodoLabel}</div>
      <div class="val-name">${d.name}</div>
      ${rows}
      <div class="val-verdict ${v.cls}">${v.label}</div>
      <div class="val-input-row">
        <input class="val-input" type="number" id="val-input-${safeId}"
          placeholder="${isLive ? 'Via Google Sheets' : 'Preço actual (' + sym + ')'}"
          value="${current ? current.toFixed(2) : ''}" step="0.01" min="0"
          ${isLive ? 'style="background:#f0fdf4;color:#065f46;border-color:#bbf7d0;"' : ''} />
        <button class="btn-calc" onclick="calcValuation('${d.ticker}')" ${isLive ? 'style="display:none"' : ''}>Calcular</button>
      </div>
      <div style="font-size:10px;color:var(--muted);margin-top:8px;">${d.note}</div>
    </div>`;
  }).join('');
}

// Called every time the analise tab opens — refresh valuation with latest prices
function refreshAnalise() {
  initCharts();
  renderValuationCards(window.gsPrices || {});
  // Also refresh aportes history if prices updated
  if (typeof renderHistory === 'function') renderHistory();
}
