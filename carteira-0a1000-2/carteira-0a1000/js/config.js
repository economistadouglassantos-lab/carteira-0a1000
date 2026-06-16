// ── CONFIGURAÇÃO GLOBAL ──
const META = 1000; // Meta de investimento em €

const PORTFOLIO_ASSETS = [
  { name: 'Borr Drilling',                       ticker: 'BORR',    row: 5,  conv: 'high',   weight: 8  },
  { name: 'Nu Holdings',                         ticker: 'NU',      row: 6,  conv: 'high',   weight: 8  },
  { name: 'Sonae',                               ticker: 'SON.LS',  row: 7,  conv: 'high',   weight: 8  },
  { name: 'SpaceX',                              ticker: 'SPCX',    row: 8,  conv: 'high',   weight: 8  },
  { name: 'Sezzle',                              ticker: 'SEZL',    row: 9,  conv: 'mid',    weight: 3  },
  { name: 'Byrna Technologies',                  ticker: 'BYRN',    row: 10, conv: 'mid',    weight: 3  },
  { name: 'Faes Farma',                          ticker: 'FAE.MC',  row: 11, conv: 'mid',    weight: 3  },
  { name: 'Embraer',                             ticker: 'ERJ',     row: 12, conv: 'mid',    weight: 3  },
  { name: 'Flow Traders',                        ticker: 'FLOW.AS', row: 13, conv: 'mid',    weight: 3  },
  { name: 'BNP Paribas',                         ticker: 'BNP.PA',  row: 14, conv: 'mid',    weight: 3  },
  { name: 'Navigator Company',                   ticker: 'NVG.LS',  row: 15, conv: 'mid',    weight: 3  },
  { name: 'Vanguard S&P 500',                    ticker: 'VUAA.L',  row: 16, conv: 'etf',    weight: 15 },
  { name: 'Vanguard FTSE Emerging Mkts (Dist)',  ticker: 'VFEA.L',  row: 17, conv: 'etf',    weight: 13 },
  { name: 'iShares Dev Property',                ticker: 'IWDP.L',  row: 18, conv: 'etf',    weight: 7  },
  { name: 'iShares Physical Gold',               ticker: 'IGLN.L',  row: 19, conv: 'anchor', weight: 10 },
  { name: 'Vanguard Corp Bond',                  ticker: 'VUSC.L',  row: 20, conv: 'anchor', weight: 5  },
];

const CONV_BADGE = {
  high:   { cls: 'cot-weight-high',   label: 'Alta' },
  mid:    { cls: 'cot-weight-mid',    label: 'Mod.' },
  etf:    { cls: 'cot-weight-etf',    label: 'ETF'  },
  anchor: { cls: 'cot-weight-anchor', label: 'Âncora' },
};

// Empresas para avaliação Bazin / FCD
const VALUATION_DATA = [
  // Pagam dividendos — Bazin
  { ticker:'BNP.PA',  name:'BNP Paribas',       method:'bazin', dpa:5.16, currency:'EUR', note:'Dividendo 2025 €5.16/acção' },
  { ticker:'NVG.LS',  name:'Navigator Company',  method:'bazin', dpa:0.25, currency:'EUR', note:'Dividendo 2025 €0.25/acção' },
  { ticker:'FAE.MC',  name:'Faes Farma',         method:'bazin', dpa:0.18, currency:'EUR', note:'Dividendo 2025 €0.18/acção' },
  { ticker:'SON.LS',  name:'Sonae',              method:'bazin', dpa:0.06, currency:'EUR', note:'Dividendo 2025 €0.06/acção' },
  { ticker:'FLOW.AS', name:'Flow Traders',       method:'bazin', dpa:1.15, currency:'EUR', note:'Dividendo estimado 2025 €1.15/acção' },
  // Não pagam dividendos — FCD simplificado
  { ticker:'BORR',    name:'Borr Drilling',      method:'fcd', eps:0.17, g:0.12, note:'EPS TTM $0.17 · crescimento esperado 12%' },
  { ticker:'NU',      name:'Nu Holdings',        method:'fcd', eps:0.72, g:0.28, note:'EPS TTM $0.72 · crescimento esperado 28%' },
  { ticker:'SEZL',    name:'Sezzle',             method:'fcd', eps:3.72, g:0.30, note:'EPS TTM $3.72 · crescimento esperado 30%' },
  { ticker:'BYRN',    name:'Byrna Technologies', method:'fcd', eps:0.66, g:0.20, note:'EPS TTM $0.66 · crescimento esperado 20%' },
  { ticker:'ERJ',     name:'Embraer',            method:'fcd', eps:2.16, g:0.17, note:'EPS TTM $2.16 · crescimento esperado 17%' },
  { ticker:'SPCX',    name:'SpaceX',             method:'fcd', eps:null, g:null, note:'Empresa privada — dados não disponíveis' },
];

const TAXA_DESCONTO = 0.10;

// Seed de eventos de calendário
const CAL_KEY = 'carteira_eventos_v1';
const MESES_PT = ['Janeiro','Fevereiro','Março','Abril','Maio','Junho','Julho','Agosto','Setembro','Outubro','Novembro','Dezembro'];
const MESES_PT_SHORT = ['Jan','Fev','Mar','Abr','Mai','Jun','Jul','Ago','Set','Out','Nov','Dez'];

const SEED_EVENTS = [
  { id:'seed1',  empresa:'Nu Holdings',        ticker:'NU',   tipo:'Resultados trimestrais', data:'2026-05-14', estado:'confirmed', seed:true },
  { id:'seed2',  empresa:'Sezzle',             ticker:'SEZL', tipo:'Resultados trimestrais', data:'2026-05-06', estado:'confirmed', seed:true },
  { id:'seed3',  empresa:'Borr Drilling',      ticker:'BORR', tipo:'Resultados trimestrais', data:'2026-05-20', estado:'confirmed', seed:true },
  { id:'seed4',  empresa:'BNP Paribas',        ticker:'BNP',  tipo:'Resultados trimestrais', data:'2026-04-30', estado:'confirmed', seed:true },
  { id:'seed5',  empresa:'Flow Traders',       ticker:'FLOW', tipo:'Resultados trimestrais', data:'2026-04-24', estado:'confirmed', seed:true },
  { id:'seed6',  empresa:'Byrna Technologies', ticker:'BYRN', tipo:'Resultados trimestrais', data:'2026-04-09', estado:'confirmed', seed:true },
  { id:'seed7',  empresa:'Byrna Technologies', ticker:'BYRN', tipo:'Resultados trimestrais', data:'2026-07-09', estado:'confirmed', seed:true },
  { id:'seed8',  empresa:'Nu Holdings',        ticker:'NU',   tipo:'Resultados trimestrais', data:'2026-08-13', estado:'confirmed', seed:true },
  { id:'seed9',  empresa:'Borr Drilling',      ticker:'BORR', tipo:'Resultados trimestrais', data:'2026-08-12', estado:'estimated', seed:true },
  { id:'seed10', empresa:'Sezzle',             ticker:'SEZL', tipo:'Resultados trimestrais', data:'2026-08-06', estado:'estimated', seed:true },
  { id:'seed11', empresa:'Embraer',            ticker:'ERJ',  tipo:'Resultados trimestrais', data:'2026-08-05', estado:'estimated', seed:true },
  { id:'seed12', empresa:'BNP Paribas',        ticker:'BNP',  tipo:'Resultados trimestrais', data:'2026-07-30', estado:'estimated', seed:true },
  { id:'seed13', empresa:'Flow Traders',       ticker:'FLOW', tipo:'Resultados semestrais',  data:'2026-07-30', estado:'estimated', seed:true },
  { id:'seed14', empresa:'Faes Farma',         ticker:'FAE',  tipo:'Resultados semestrais',  data:'2026-07-22', estado:'estimated', seed:true },
  { id:'seed15', empresa:'Navigator Company',  ticker:'NVG',  tipo:'Resultados semestrais',  data:'2026-07-28', estado:'estimated', seed:true },
  { id:'seed16', empresa:'Sonae',              ticker:'SON',  tipo:'Resultados semestrais',  data:'2026-07-24', estado:'estimated', seed:true },
  { id:'seed17', empresa:'Borr Drilling',      ticker:'BORR', tipo:'Resultados trimestrais', data:'2026-11-05', estado:'estimated', seed:true },
  { id:'seed18', empresa:'Nu Holdings',        ticker:'NU',   tipo:'Resultados trimestrais', data:'2026-11-12', estado:'estimated', seed:true },
  { id:'seed19', empresa:'Sezzle',             ticker:'SEZL', tipo:'Resultados trimestrais', data:'2026-11-05', estado:'estimated', seed:true },
  { id:'seed20', empresa:'BNP Paribas',        ticker:'BNP',  tipo:'Resultados trimestrais', data:'2026-10-28', estado:'estimated', seed:true },
  { id:'seed21', empresa:'Embraer',            ticker:'ERJ',  tipo:'Resultados trimestrais', data:'2026-11-05', estado:'estimated', seed:true },
];
