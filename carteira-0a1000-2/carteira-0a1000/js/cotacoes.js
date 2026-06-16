// ── COTACOES.JS — Cotações via Google Sheets ──

const COT_KEY   = 'carteira_compra_v1';
const GS_ID_KEY = 'carteira_gsid_v1';

function loadCompras() { try { return JSON.parse(localStorage.getItem(COT_KEY)) || {}; } catch { return {}; } }
function saveCompras(obj) { try { localStorage.setItem(COT_KEY, JSON.stringify(obj)); } catch {} }
function getSheetsId() { try { return localStorage.getItem(GS_ID_KEY) || ''; } catch { return ''; } }
function setSheetsId(id) { try { localStorage.setItem(GS_ID_KEY, id); } catch {} }

function ligarGSheets() {
  const raw   = document.getElementById('gs-sheet-id').value.trim();
  const match = raw.match(/\/spreadsheets\/d\/([a-zA-Z0-9_-]+)/);
  const id    = match ? match[1] : raw;
  if (!id || id.length < 20) {
    document.getElementById('gs-status').innerHTML = '<span style="color:var(--red);">ID inválido.</span>';
    return;
  }
  setSheetsId(id);
  document.getElementById('gs-status').innerHTML = '<span style="color:var(--green);">A ligar...</span>';
  initCotacoes();
}

function desligarGSheets() {
  setSheetsId('');
  document.getElementById('gs-setup-card').style.display = '';
  document.getElementById('gs-toolbar').style.display = 'none';
  document.getElementById('gs-disclaimer').style.display = 'none';
  document.getElementById('cot-grid').innerHTML = '';
}

function salvarPrecoCompra(ticker) {
  const input = document.getElementById('input-compra-' + ticker);
  if (!input) return;
  const val = parseFloat(input.value);
  if (isNaN(val) || val <= 0) return;
  const compras = loadCompras();
  compras[ticker] = val;
  saveCompras(compras);
  const safeId  = ticker.replace(/[^a-zA-Z0-9]/g, '-');
  const priceEl = document.querySelector(`#cot-card-${safeId} .cot-price`);
  if (priceEl) {
    const p = parseFloat(priceEl.textContent.replace(/[^0-9.]/g, ''));
    if (!isNaN(p)) updatePnL(ticker, p, val);
  }
}

function updatePnL(ticker, price, buy) {
  const pct  = ((price - buy) / buy) * 100;
  const abs  = price - buy;
  const cls  = pct > 0 ? 'profit' : pct < 0 ? 'loss' : 'neutral';
  const sign = pct >= 0 ? '+' : '';
  const safeId = ticker.replace(/[^a-zA-Z0-9]/g, '-');
  const set = (id, text, c) => { const el = document.getElementById(id); if (el) { el.textContent = text; el.className = 'pnl-value ' + c; }};
  set('pnl-pct-' + safeId, sign + pct.toFixed(2) + '%', cls);
  set('pnl-abs-' + safeId, sign + abs.toFixed(2), cls);
  set('pnl-buy-' + safeId, buy.toFixed(2), 'neutral');
}

function buildCards() {
  const compras = loadCompras();
  const grid    = document.getElementById('cot-grid');
  if (!grid) return;
  grid.innerHTML = PORTFOLIO_ASSETS.map(a => {
    const badge  = CONV_BADGE[a.conv];
    const buy    = compras[a.ticker];
    const safeId = a.ticker.replace(/[^a-zA-Z0-9]/g, '-');
    return `<div class="cot-card" id="cot-card-${safeId}">
      <div class="cot-header">
        <div><div class="cot-name">${a.name}</div><span class="cot-ticker-badge">${a.ticker}</span></div>
        <div style="text-align:right;"><span class="cot-weight-badge ${badge.cls}">${badge.label} · ${a.weight}%</span></div>
      </div>
      <div id="cot-body-${safeId}">
        <div class="cot-loading"><div class="cot-loading-dot"></div><div class="cot-loading-dot"></div><div class="cot-loading-dot"></div><span>A carregar…</span></div>
      </div>
      <div class="cot-divider"></div>
      <div class="cot-pnl-row">
        <div class="cot-pnl-item"><div class="pnl-label">Preço compra</div><div class="pnl-value neutral" id="pnl-buy-${safeId}">${buy ? buy.toFixed(2) : '—'}</div></div>
        <div class="cot-pnl-item"><div class="pnl-label">P&L %</div><div class="pnl-value neutral" id="pnl-pct-${safeId}">—</div></div>
        <div class="cot-pnl-item"><div class="pnl-label">P&L abs.</div><div class="pnl-value neutral" id="pnl-abs-${safeId}">—</div></div>
      </div>
      <div class="cot-input-row">
        <input class="cot-input" type="number" id="input-compra-${a.ticker}" placeholder="Preço de compra" value="${buy || ''}" step="0.01" min="0" />
        <button class="btn-save-price" onclick="salvarPrecoCompra('${a.ticker}')">Guardar</button>
      </div>
    </div>`;
  }).join('');
}

function renderQuoteBody(ticker, price, changePct, currency, isLive) {
  const safeId = ticker.replace(/[^a-zA-Z0-9]/g, '-');
  const el     = document.getElementById('cot-body-' + safeId);
  if (!el) return;
  const dir    = changePct > 0 ? 'up' : changePct < 0 ? 'down' : 'flat';
  const sign   = changePct >= 0 ? '+' : '';
  const badge  = isLive
    ? '<span style="font-size:10px;padding:1px 6px;border-radius:4px;background:#dcfce7;color:#065f46;margin-left:6px;">Live</span>'
    : '<span style="font-size:10px;padding:1px 6px;border-radius:4px;background:#f3f4f6;color:#6b7280;margin-left:6px;">Fecho</span>';
  el.innerHTML = `<div class="cot-price-row" style="align-items:center;">
    <div class="cot-price">${price.toFixed(2)}</div>
    <div class="cot-currency">${currency}</div>
    ${badge}
    <span class="cot-change ${dir}" style="margin-left:4px;">${sign}${changePct.toFixed(2)}%</span>
  </div>`;
  const compras = loadCompras();
  if (compras[ticker] != null) updatePnL(ticker, price, compras[ticker]);
}

function renderQuoteError(ticker, msg) {
  const safeId = ticker.replace(/[^a-zA-Z0-9]/g, '-');
  const el     = document.getElementById('cot-body-' + safeId);
  if (el) el.innerHTML = `<div class="cot-error">⚠ ${msg}</div>`;
}

async function fetchAllQuotes() {
  const id  = getSheetsId();
  if (!id) return;
  const btn = document.getElementById('btn-refresh');
  if (btn) btn.classList.add('loading');

  PORTFOLIO_ASSETS.forEach(a => {
    const safeId = a.ticker.replace(/[^a-zA-Z0-9]/g, '-');
    const el     = document.getElementById('cot-body-' + safeId);
    if (el) el.innerHTML = `<div class="cot-loading"><div class="cot-loading-dot"></div><div class="cot-loading-dot"></div><div class="cot-loading-dot"></div><span>A carregar…</span></div>`;
  });

  try {
    const url  = `https://docs.google.com/spreadsheets/d/${id}/gviz/tq?tqx=out:json&sheet=Cota%C3%A7%C3%B5es&range=A5:F20`;
    const res  = await fetch(url, { signal: AbortSignal.timeout(15000) });
    if (!res.ok) throw new Error('HTTP ' + res.status);
    const text = await res.text();
    const jsonStr = text.replace(/^[^{]*/, '').replace(/\);?\s*$/, '');
    const data    = JSON.parse(jsonStr);
    const rows    = data?.table?.rows;
    if (!rows) throw new Error('Sem dados na folha');

    window.gsPrices = {};

    rows.forEach((row, i) => {
      const a        = PORTFOLIO_ASSETS[i];
      if (!a) return;
      const cells    = row.c || [];
      const priceVal = cells[4]?.v;
      const changeVal= cells[5]?.v;
      if (priceVal == null || priceVal === '' || priceVal === '-') {
        renderQuoteError(a.ticker, 'Sem dados — verifica a folha');
        return;
      }
      const price     = parseFloat(priceVal);
      const changePct = changeVal != null ? parseFloat(changeVal) * 100 : 0;
      const currency  = a.ticker.includes('.L') ? 'GBp'
        : (a.ticker.includes('.PA') || a.ticker.includes('.AS') || a.ticker.includes('.MC') || a.ticker.includes('.LS')) ? 'EUR' : 'USD';
      renderQuoteBody(a.ticker, price, changePct, currency, true);
      window.gsPrices[a.ticker] = { price, currency };
    });

    // Refresh valuation cards + aportes history with live prices
    if (typeof renderValuationCards === "function") renderValuationCards(window.gsPrices);
    if (typeof renderHistory === "function") renderHistory();

    // Refresh rankings
    setTimeout(() => {
      const map = {};
      PORTFOLIO_ASSETS.forEach(a => {
        const safeId  = a.ticker.replace(/[^a-zA-Z0-9]/g, '-');
        const card    = document.getElementById('cot-body-' + safeId);
        if (!card) return;
        const priceEl = card.querySelector('.cot-price');
        const chgEl   = card.querySelector('.cot-change');
        if (!priceEl || !chgEl) return;
        const price     = parseFloat(priceEl.textContent.replace(/[^0-9.]/g, ''));
        const pctText   = chgEl.textContent.replace('%','').replace('+','');
        const changePct = parseFloat(pctText);
        if (!isNaN(price) && !isNaN(changePct))
          map[a.ticker] = { name: a.name, ticker: a.ticker, price, changePct };
      });
      if (Object.keys(map).length > 0 && typeof renderRankings === 'function') renderRankings(map);
    }, 200);

  } catch(e) {
    PORTFOLIO_ASSETS.forEach(a => renderQuoteError(a.ticker, 'Erro: ' + e.message.slice(0, 40)));
  }

  const now = new Date();
  const el  = document.getElementById('cot-last-update');
  if (el) el.textContent = now.toLocaleTimeString('pt-PT', { hour: '2-digit', minute: '2-digit' });
  if (btn) btn.classList.remove('loading');
}

function initCotacoes() {
  const id = getSheetsId();
  if (id) {
    document.getElementById('gs-setup-card').style.display = 'none';
    document.getElementById('gs-toolbar').style.display    = '';
    document.getElementById('gs-disclaimer').style.display = '';
    const input = document.getElementById('gs-sheet-id');
    if (input) input.value = id;
  }
  buildCards();
  if (id) fetchAllQuotes();
}
