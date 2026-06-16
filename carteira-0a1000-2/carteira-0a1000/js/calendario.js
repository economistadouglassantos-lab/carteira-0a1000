// ── CALENDARIO.JS — Calendário de relatórios ao investidor ──

let calViewYear, calViewMonth;
(function() {
  const now = new Date();
  calViewYear  = now.getFullYear();
  calViewMonth = now.getMonth();
})();

function loadEventos() {
  let custom = [];
  try { custom = JSON.parse(localStorage.getItem(CAL_KEY)) || []; } catch {}
  const customIds = new Set(custom.map(e => e.id));
  return [...SEED_EVENTS.filter(e => !customIds.has(e.id)), ...custom]
    .sort((a, b) => a.data.localeCompare(b.data));
}

function saveEventos(arr) {
  try { localStorage.setItem(CAL_KEY, JSON.stringify(arr.filter(e => !e.seed))); } catch {}
}

function formatDataPT(dateStr) {
  if (!dateStr) return '—';
  const [y, m, d] = dateStr.split('-');
  return d + ' ' + MESES_PT_SHORT[parseInt(m)-1] + ' ' + y;
}

function diasAte(dateStr) {
  const hoje = new Date(); hoje.setHours(0,0,0,0);
  return Math.round((new Date(dateStr + 'T00:00:00') - hoje) / 86400000);
}

function gcalUrl(ev) {
  const d = ev.data.replace(/-/g,'');
  return `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(ev.empresa + ' — ' + ev.tipo)}&dates=${d}/${d}&details=${encodeURIComponent('Ticker: ' + (ev.ticker||'') + '\nEstado: ' + (ev.estado==='confirmed'?'Confirmado':'Estimado'))}`;
}

function renderEventos() {
  const todos   = loadEventos();
  const hoje    = new Date(); hoje.setHours(0,0,0,0);
  const futuros = todos.filter(e => new Date(e.data+'T00:00:00') >= hoje);
  const passados= todos.filter(e => new Date(e.data+'T00:00:00') < hoje).reverse();

  if (futuros.length > 0) {
    const prox = futuros[0];
    const dias = diasAte(prox.data);
    const set = (id, val) => { const el = document.getElementById(id); if(el) el.textContent = val; };
    set('up-days', dias === 0 ? 'HOJE' : dias);
    set('up-name', prox.empresa + ' — ' + prox.tipo);
    set('up-date', formatDataPT(prox.data) + (prox.estado === 'estimated' ? ' (estimado)' : ' (confirmado)'));
  }

  const SVG = `<svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="4" width="14" height="13" rx="2"/><line x1="7" y1="2" x2="7" y2="6"/><line x1="13" y1="2" x2="13" y2="6"/><line x1="3" y1="9" x2="17" y2="9"/></svg>`;
  const body = document.getElementById('events-list-body');
  if (!body) return;
  let html = '';

  if (futuros.length > 0) {
    html += '<div class="ev-section-title">Próximos relatórios</div>';
    futuros.forEach(ev => {
      const dias = diasAte(ev.data);
      const label = dias === 0 ? 'Hoje' : `Em ${dias} dias`;
      html += `<div class="event-row">
        <div><div class="ev-date">${formatDataPT(ev.data)}</div><div class="ev-date-sub" style="color:${dias<=7?'#d97706':'var(--muted)'};">${label}</div></div>
        <div><div class="ev-company">${ev.empresa}</div><div class="ev-ticker">${ev.ticker||''}</div></div>
        <div class="ev-type">${ev.tipo}</div>
        <div><span class="ev-status ${ev.estado}">${ev.estado==='confirmed'?'✓ Confirmado':'~ Estimado'}</span></div>
        <div style="display:flex;gap:6px;align-items:center;">
          <a class="gcal-btn" href="${gcalUrl(ev)}" target="_blank" rel="noopener" title="Google Calendar">${SVG}</a>
          ${!ev.seed ? `<button class="btn-del" onclick="deletarEvento('${ev.id}')">×</button>` : ''}
        </div>
      </div>`;
    });
  }

  if (passados.length > 0) {
    html += '<div class="ev-section-title">Relatórios anteriores</div>';
    passados.slice(0, 8).forEach(ev => {
      html += `<div class="event-row past">
        <div><div class="ev-date">${formatDataPT(ev.data)}</div></div>
        <div><div class="ev-company">${ev.empresa}</div><div class="ev-ticker">${ev.ticker||''}</div></div>
        <div class="ev-type">${ev.tipo}</div>
        <div><span class="ev-status past">Realizado</span></div>
        <div></div>
      </div>`;
    });
  }

  if (!html) html = '<div class="empty-state"><div class="empty-icon">📅</div><div>Sem eventos.</div></div>';
  body.innerHTML = html;
  renderMiniCal();
}

function deletarEvento(id) {
  saveEventos(loadEventos().filter(e => e.id !== id));
  renderEventos();
}

function adicionarEvento() {
  const empresa = document.getElementById('ev-empresa').value.trim();
  const tipo    = document.getElementById('ev-tipo').value;
  const data    = document.getElementById('ev-data').value;
  const estado  = document.getElementById('ev-estado').value;
  const ticker  = document.getElementById('ev-ticker').value.trim().toUpperCase();

  if (!empresa) { evFeedback('Indica o nome da empresa.', true); return; }
  if (!data)    { evFeedback('Selecciona uma data.', true); return; }

  const custom = JSON.parse(localStorage.getItem(CAL_KEY)||'[]');
  custom.push({ id: 'custom_' + Date.now(), empresa, ticker, tipo, data, estado, seed: false });
  try { localStorage.setItem(CAL_KEY, JSON.stringify(custom)); } catch {}
  evFeedback('Evento adicionado!', false);
  document.getElementById('ev-empresa').value = '';
  document.getElementById('ev-ticker').value  = '';
  renderEventos();
}

function evFeedback(msg, isErr) {
  const el = document.getElementById('ev-feedback');
  if (!el) return;
  el.textContent = msg; el.style.color = isErr ? 'var(--red)' : 'var(--green)';
  setTimeout(() => { el.textContent = ''; }, 3000);
}

function calNav(dir) {
  calViewMonth += dir;
  if (calViewMonth > 11) { calViewMonth = 0; calViewYear++; }
  if (calViewMonth < 0)  { calViewMonth = 11; calViewYear--; }
  renderMiniCal();
}

function renderMiniCal() {
  const label = document.getElementById('cal-month-label');
  if (label) label.textContent = MESES_PT[calViewMonth] + ' ' + calViewYear;
  const grid = document.getElementById('cal-grid');
  if (!grid) return;
  while (grid.children.length > 7) grid.removeChild(grid.lastChild);

  const todos = loadEventos();
  const eventDays = new Set(todos.filter(e => {
    const d = new Date(e.data+'T00:00:00');
    return d.getFullYear()===calViewYear && d.getMonth()===calViewMonth;
  }).map(e => parseInt(e.data.split('-')[2])));
  const confirmedDays = new Set(todos.filter(e => {
    const d = new Date(e.data+'T00:00:00');
    return d.getFullYear()===calViewYear && d.getMonth()===calViewMonth && e.estado==='confirmed';
  }).map(e => parseInt(e.data.split('-')[2])));

  const hoje = new Date(); hoje.setHours(0,0,0,0);
  let startDow = new Date(calViewYear, calViewMonth, 1).getDay();
  startDow = startDow === 0 ? 6 : startDow - 1;
  const daysInMonth  = new Date(calViewYear, calViewMonth+1, 0).getDate();
  const prevMonthDays= new Date(calViewYear, calViewMonth, 0).getDate();

  for (let i = startDow - 1; i >= 0; i--) {
    const cell = document.createElement('div');
    cell.className = 'cal-day other-month'; cell.textContent = prevMonthDays - i;
    grid.appendChild(cell);
  }
  for (let d = 1; d <= daysInMonth; d++) {
    const cell    = document.createElement('div');
    const thisDate= new Date(calViewYear, calViewMonth, d);
    let cls = 'cal-day';
    if (thisDate.getTime() === hoje.getTime()) cls += ' today';
    if (eventDays.has(d)) { cls += ' has-event'; if (confirmedDays.has(d)) cls += ' confirmed'; }
    cell.className = cls; cell.textContent = d;
    if (eventDays.has(d)) {
      cell.title = todos.filter(e => {
        const ed = new Date(e.data+'T00:00:00');
        return ed.getFullYear()===calViewYear && ed.getMonth()===calViewMonth && parseInt(e.data.split('-')[2])===d;
      }).map(e => e.empresa).join(', ');
    }
    grid.appendChild(cell);
  }
  const total    = startDow + daysInMonth;
  const remainder= total % 7 === 0 ? 0 : 7 - (total % 7);
  for (let d = 1; d <= remainder; d++) {
    const cell = document.createElement('div');
    cell.className = 'cal-day other-month'; cell.textContent = d;
    grid.appendChild(cell);
  }
}
