// ── APORTES.JS — Registo de aportes com activo e valorização ──

const STORAGE_KEY = 'carteira_aportes_v2';
let modoAporte = 'semanal';

function setModo(modo) {
  modoAporte = modo;
  const isSemanal = modo === 'semanal';
  document.getElementById('form-semanal').style.display = isSemanal ? '' : 'none';
  document.getElementById('form-mensal').style.display  = isSemanal ? 'none' : '';
  const btnS = document.getElementById('btn-modo-semanal');
  const btnM = document.getElementById('btn-modo-mensal');
  if (btnS) {
    btnS.style.background = isSemanal ? 'var(--accent)' : 'var(--surface2)';
    btnS.style.color      = isSemanal ? '#fff' : 'var(--muted)';
    btnM.style.background = isSemanal ? 'var(--surface2)' : 'var(--accent)';
    btnM.style.color      = isSemanal ? 'var(--muted)' : '#fff';
  }
}

function loadAportes() {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY)) || []; } catch { return []; }
}
function saveAportes(arr) {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(arr)); } catch {}
}

function formatEur(v) {
  return '€ ' + Number(v).toLocaleString('pt-PT', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function formatLabel(key) {
  if (!key) return '—';
  if (key.length === 7) {
    const [y, m] = key.split('-');
    return MESES_PT_SHORT[parseInt(m) - 1] + ' ' + y;
  }
  const [y, m, d] = key.split('-');
  return d + ' ' + MESES_PT_SHORT[parseInt(m) - 1] + ' ' + y + ' (Ter)';
}

function isTerca(dateStr) {
  return new Date(dateStr + 'T12:00:00').getDay() === 2;
}

// Calcular valorização com base no preço actual (de gsPrices)
function calcValorizacao(aporte) {
  if (!aporte.ticker || !aporte.precoCompra) return null;
  const liveEntry = window.gsPrices && window.gsPrices[aporte.ticker];
  if (!liveEntry) return null;
  const precoActual = liveEntry.price;
  const pct = ((precoActual - aporte.precoCompra) / aporte.precoCompra) * 100;
  return { pct, precoActual };
}

function adicionarAporte() {
  const valorRaw   = document.getElementById('input-valor').value;
  const nota       = document.getElementById('input-nota').value.trim();
  const ticker     = document.getElementById('input-aporte-ticker').value.trim().toUpperCase();
  const precoInput = document.getElementById('input-preco-compra').value;
  const valor      = parseFloat(valorRaw);

  if (!valorRaw || isNaN(valor) || valor <= 0) { showFeedback('Insere um valor válido.', true); return; }

  let chave;
  if (modoAporte === 'semanal') {
    const data = document.getElementById('input-data-semana').value;
    if (!data) { showFeedback('Selecciona a data da terça-feira.', true); return; }
    if (!isTerca(data)) { showFeedback('A data seleccionada não é uma terça-feira.', true); return; }
    chave = data;
  } else {
    const mes = document.getElementById('input-mes').value;
    if (!mes) { showFeedback('Selecciona o mês.', true); return; }
    chave = mes;
  }

  const precoCompra = precoInput ? parseFloat(precoInput) : null;

  const arr = loadAportes();
  const idx = arr.findIndex(a => a.mes === chave && (a.ticker || '') === ticker);
  const entry = { mes: chave, valor, nota, tipo: modoAporte, ticker: ticker || null, precoCompra: precoCompra || null };

  if (idx >= 0) {
    arr[idx] = { ...arr[idx], ...entry };
    showFeedback('Aporte actualizado.', false);
  } else {
    arr.push(entry);
    showFeedback('Aporte adicionado!', false);
  }

  arr.sort((a, b) => a.mes.localeCompare(b.mes));
  saveAportes(arr);
  renderHistory();
  renderTotals();
  renderAportesChart();

  document.getElementById('input-valor').value = '';
  document.getElementById('input-nota').value  = '';
  document.getElementById('input-aporte-ticker').value = '';
  document.getElementById('input-preco-compra').value  = '';
}

function showFeedback(msg, isErr) {
  const el = document.getElementById('form-feedback');
  if (!el) return;
  el.textContent = msg;
  el.style.color = isErr ? 'var(--red)' : 'var(--green)';
  setTimeout(() => { el.textContent = ''; }, 3500);
}

function deletarAporte(idx) {
  const arr = loadAportes();
  arr.splice(idx, 1);
  saveAportes(arr);
  renderHistory();
  renderTotals();
  renderAportesChart();
}

function renderHistory() {
  const arr = loadAportes();
  const el  = document.getElementById('history-list');
  if (!el) return;
  if (arr.length === 0) {
    el.innerHTML = '<div class="empty-state"><div class="empty-icon">📊</div><div>Ainda sem aportes registados.</div></div>';
    return;
  }

  el.innerHTML = [...arr].map((a, origIdx) => {
    const isSem = a.tipo === 'semanal' || (a.mes && a.mes.length === 10);
    const badge = isSem
      ? '<span style="font-size:10px;padding:1px 6px;border-radius:4px;background:#dbeafe;color:#1e40af;margin-left:5px;">Ter</span>'
      : '<span style="font-size:10px;padding:1px 6px;border-radius:4px;background:#d1fae5;color:#065f46;margin-left:5px;">Mês</span>';

    // Valorização
    const val = calcValorizacao(a);
    let valHtml = '—';
    if (val) {
      const sign = val.pct >= 0 ? '+' : '';
      const cls  = val.pct > 0 ? 'profit' : val.pct < 0 ? 'loss' : 'neutral';
      valHtml = `<span class="h-valorizacao ${cls}">${sign}${val.pct.toFixed(2)}%</span>`;
    } else if (a.ticker && a.precoCompra) {
      valHtml = '<span style="font-size:11px;color:var(--muted);">Sem cotação</span>';
    }

    const tickerHtml = a.ticker
      ? `<span style="font-size:10px;padding:1px 6px;border-radius:4px;background:#f3f4f6;color:#374151;margin-left:5px;">${a.ticker}</span>`
      : '';

    return `<div class="history-row">
      <div class="h-mes">${formatLabel(a.mes)}${badge}${tickerHtml}</div>
      <div class="h-valor">${formatEur(a.valor)}</div>
      <div class="h-nota">${a.precoCompra ? 'Compra: ' + a.precoCompra.toFixed(2) : (a.nota || '—')}</div>
      <div>${valHtml}</div>
      <button class="btn-del" onclick="deletarAporte(${origIdx})" title="Remover">×</button>
    </div>`;
  }).reverse().join('');
}

function renderTotals() {
  const arr   = loadAportes();
  const total = arr.reduce((s, a) => s + a.valor, 0);
  const media = arr.length ? total / arr.length : 0;
  const maior = arr.length ? arr.reduce((m, a) => a.valor > m.valor ? a : m, arr[0]) : null;
  const nSem  = arr.filter(a => a.tipo === 'semanal' || (a.mes && a.mes.length === 10)).length;
  const nMes  = arr.length - nSem;

  const set = (id, val) => { const el = document.getElementById(id); if (el) el.textContent = val; };
  set('total-investido', formatEur(total));
  const parts = [];
  if (nSem > 0) parts.push(nSem + (nSem === 1 ? ' semanal' : ' semanais'));
  if (nMes > 0) parts.push(nMes + (nMes === 1 ? ' mensal' : ' mensais'));
  set('total-meses', parts.length ? parts.join(' · ') : '0 registos');
  set('media-mensal', formatEur(media));
  set('maior-aporte', maior ? formatEur(maior.valor) : '€ 0');
  set('maior-aporte-mes', maior ? formatLabel(maior.mes) : '—');

  if (typeof updateProgressBar === 'function') updateProgressBar();
}

let aportesChart = null;

function renderAportesChart() {
  const arr    = loadAportes();
  const canvas = document.getElementById('chartAportes');
  if (!canvas) return;
  if (aportesChart) { aportesChart.destroy(); aportesChart = null; }
  if (arr.length === 0) return;

  const labels = arr.map(a => formatLabel(a.mes));
  const values = arr.map(a => a.valor);
  const colors = arr.map(a => (a.tipo === 'semanal' || (a.mes && a.mes.length === 10))
    ? 'rgba(37,99,235,0.55)' : 'rgba(5,150,105,0.55)');
  const cumulative = [];
  let acc = 0;
  values.forEach(v => { acc += v; cumulative.push(parseFloat(acc.toFixed(2))); });

  aportesChart = new Chart(canvas, {
    type: 'bar',
    data: {
      labels,
      datasets: [
        { label: 'Aporte', data: values, backgroundColor: colors, borderRadius: 4, yAxisID: 'y' },
        { label: 'Acumulado', data: cumulative, type: 'line', borderColor: '#059669',
          backgroundColor: 'rgba(5,150,105,0.07)', borderWidth: 2,
          pointRadius: 3, pointBackgroundColor: '#059669', tension: 0.3, fill: true, yAxisID: 'y2' }
      ]
    },
    options: {
      responsive: true, maintainAspectRatio: false,
      interaction: { mode: 'index', intersect: false },
      plugins: { legend: { display: false }, tooltip: { callbacks: {
        label: ctx => ' ' + ctx.dataset.label + ': € ' +
          Number(ctx.parsed.y).toLocaleString('pt-PT', { minimumFractionDigits: 2 })
      }}},
      scales: {
        x: { ticks: { color:'#6b7280', font:{size:10}, maxRotation:45, autoSkip:true, maxTicksLimit:20 }, grid:{color:'rgba(0,0,0,0.04)'} },
        y: { position:'left', ticks:{ color:'#6b7280', font:{size:10}, callback: v=>'€'+Number(v).toLocaleString('pt-PT') }, grid:{color:'rgba(0,0,0,0.04)'} },
        y2:{ position:'right', ticks:{ color:'#059669', font:{size:10}, callback: v=>'€'+Number(v).toLocaleString('pt-PT') }, grid:{display:false} }
      }
    }
  });
}
