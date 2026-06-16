// ── APP.JS — Navegação, menu hambúrguer, progresso ──

function toggleMenu() {
  const menu    = document.getElementById('mobile-menu');
  const overlay = document.getElementById('menu-overlay');
  const btn     = document.getElementById('hamburger-btn');
  const isOpen  = menu.classList.contains('open');
  if (isOpen) {
    menu.classList.remove('open');
    overlay.classList.remove('open');
    btn.setAttribute('aria-expanded','false');
    document.body.style.overflow = '';
  } else {
    menu.classList.add('open');
    overlay.classList.add('open');
    btn.setAttribute('aria-expanded','true');
    document.body.style.overflow = 'hidden';
  }
}

function closeMenu() {
  document.getElementById('mobile-menu').classList.remove('open');
  document.getElementById('menu-overlay').classList.remove('open');
  document.getElementById('hamburger-btn').setAttribute('aria-expanded','false');
  document.body.style.overflow = '';
}

function switchTab(id, btn) {
  // Hide all panels
  document.querySelectorAll('.tab-panel').forEach(p => p.classList.remove('active'));
  // Deactivate all tab buttons
  document.querySelectorAll('.tab-btn, .mobile-tab-btn').forEach(b => b.classList.remove('active'));

  // Show selected panel
  const panel = document.getElementById('tab-' + id);
  if (panel) panel.classList.add('active');

  // Activate matching buttons
  document.querySelectorAll(`[data-tab="${id}"]`).forEach(b => b.classList.add('active'));

  closeMenu();

  // Lazy init per tab
  if (id === 'analise')    setTimeout(() => { refreshAnalise(); }, 60);
  if (id === 'aportes')    setTimeout(() => { renderAportesChart(); }, 60);
  if (id === 'calendario') setTimeout(() => { renderEventos(); }, 60);
  if (id === 'cotacoes')   setTimeout(() => { initCotacoes(); }, 60);
}

// ── PROGRESS BAR ──
function updateProgressBar() {
  const arr   = typeof loadAportes === 'function' ? loadAportes() : [];
  const total = arr.reduce((s, a) => s + a.valor, 0);
  const pct   = Math.min(100, (total / META) * 100);

  const fill  = document.getElementById('progress-fill');
  const valor = document.getElementById('progress-valor');
  const pctEl = document.getElementById('progress-pct');
  if (fill)  fill.style.width  = pct.toFixed(1) + '%';
  if (valor) valor.textContent = '€ ' + Number(total).toLocaleString('pt-PT', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  if (pctEl) pctEl.textContent = pct.toFixed(1) + '%';
}

// ── INIT ──
document.addEventListener('DOMContentLoaded', () => {
  const now = new Date();
  const y   = now.getFullYear();
  const m   = String(now.getMonth() + 1).padStart(2, '0');
  const d   = String(now.getDate()).padStart(2, '0');

  const elM = document.getElementById('input-mes');
  if (elM) elM.value = `${y}-${m}`;

  const elS = document.getElementById('input-data-semana');
  if (elS) {
    const day  = now.getDay();
    const diff = day === 2 ? 0 : (2 - day + 7) % 7;
    const next = new Date(now);
    next.setDate(now.getDate() + diff);
    elS.value = `${next.getFullYear()}-${String(next.getMonth()+1).padStart(2,'0')}-${String(next.getDate()).padStart(2,'0')}`;
  }

  const elD = document.getElementById('ev-data');
  if (elD) elD.value = `${y}-${m}-${d}`;

  if (typeof renderHistory === 'function') renderHistory();
  if (typeof renderTotals === 'function')  renderTotals();
  updateProgressBar();

  document.addEventListener('keydown', e => { if (e.key === 'Escape') closeMenu(); });
});
