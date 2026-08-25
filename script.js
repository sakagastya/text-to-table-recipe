'use strict';

const DEFAULT_DSL = `Title: Modern Banyuwangi Sambal Tempong
> Heat water to boiling

[Boiled Base]
- 100 g tomatoes, chopped
- 1 tsp (5 g) shrimp paste (terasi)
> boil until soft

[Raw Aromatics]
- 50 g bird's eye chilies
- 3 shallots, peeled
- 2 cloves garlic
- 1/2 tsp (2 g) salt
- 1 tsp (5 g) sugar
> (wait)

[Assembly]
> grind in cobek (Boiled Base, Raw Aromatics)
- 1 Tbs (15 mL) lime juice
> mix well`;

const THEMES = {
  emerald: { accent: '#059669', soft: '#d1fae5' },
  slate:   { accent: '#475569', soft: '#e2e8f0' },
  amber:   { accent: '#d97706', soft: '#fef3c7' },
  rose:    { accent: '#e11d48', soft: '#ffe4e6' },
  ocean:   { accent: '#0284c7', soft: '#e0f2fe' }
};

const I18N = {
  en: {
    tagline: 'Recipe text \u2192 editorial cooking matrix',
    p1: 'AI Auto-Extract', provider: 'Provider',
    apiKey: 'API key', apiKeyNote: '(stored only in your browser)',
    keyPh: 'Paste your key\u2026',
    rawText: 'Recipe link or raw text',
    rawTextPh: 'Paste a recipe link (web page or video) or the messy text here\u2026',
    genBtn: 'Create cooking table', p2: 'DSL Code Studio', syntax: 'Syntax',
    p3: 'Appearance', theme: 'Theme', accent: 'Custom accent',
    cellFont: 'Cell font', cellPad: 'Cell padding', resetAccent: 'Reset accent',
    layout: 'Layout', flow: 'Table flow', horizontal: 'Horizontal', vertical: 'Vertical',
    ingText: 'Ingredient text', actText: 'Action text', auto: 'Auto',
    ingWords: 'Ingredient words/line', actWords: 'Action words/line',
    langLabel: 'Language', portions: 'Portions', cooking: 'Cooking mode',
    shopBtn: 'Shopping list', pngBtn: 'Save as PNG',
    shopTitle: 'Shopping List', scaledTo: 'Scaled to',
    shopNote: '\u00B7 duplicates consolidated \u00B7 metric units enforced',
    foot: '100% client-side. No backend, no build step. Ready for GitHub Pages.',
    canvasEmpty: 'Nothing to render yet \u2014 write some DSL on the left, or let the AI extract it for you.',
    shopEmpty: 'No ingredients found in the current DSL.',
    cookingOn: 'Cooking mode on \u2014 click steps to mark them done.',
    needText: 'Paste some raw recipe text first.',
    needKey: 'Add your API key first \u2014 it never leaves your browser except to call the provider.',
    extracting: 'Creating table\u2026', genOk: 'Cooking table created \u2014 edit the DSL below.', aiErr: 'AI error: ',
    fetching: 'Reading link\u2026', fetchErr: 'Link error: ',
    translating: 'Translating\u2026', transOk: 'Table translated \u2014 structure unchanged.',
    regenHint: 'UI language changed. Add your API key and the current table will be translated (structure stays identical).',
    rendering: 'Rendering PNG\u2026', pngOk: 'PNG saved.', pngFail: 'Export failed: ',
    offlineCanvas: 'html2canvas could not be loaded (offline?).',
    movedUp: 'Group moved up.', movedDown: 'Group moved down.',
    navUp: 'Move group up', navDown: 'Move group down',
    modelSwitch: 'Gemini model switched to ', busy: ' busy \u2014 retrying\u2026',
    noModels: 'This Gemini API key has no text-generation models available.',
    regenHint: 'UI language changed. The table text comes from the DSL \u2014 paste raw text + API key and it will re-extract automatically.'
  },
  id: {
    tagline: 'Teks resep \u2192 matriks memasak editorial',
    p1: 'Ekstraksi Otomatis AI', provider: 'Penyedia',
    apiKey: 'Kunci API', apiKeyNote: '(hanya tersimpan di browser Anda)',
    keyPh: 'Tempel kunci Anda\u2026',
    rawText: 'Tautan resep atau teks mentah',
    rawTextPh: 'Tempel tautan resep (halaman web atau video) atau teks mentah di sini\u2026',
    genBtn: 'Buat tabel masak', p2: 'Studio Kode DSL', syntax: 'Sintaks',
    p3: 'Tampilan', theme: 'Tema', accent: 'Aksen kustom',
    cellFont: 'Font sel', cellPad: 'Padding sel', resetAccent: 'Reset aksen',
    layout: 'Tata Letak', flow: 'Arah tabel', horizontal: 'Horizontal', vertical: 'Vertikal',
    ingText: 'Teks bahan', actText: 'Teks aksi', auto: 'Otomatis',
    ingWords: 'Kata bahan/baris', actWords: 'Kata aksi/baris',
    langLabel: 'Bahasa', portions: 'Porsi', cooking: 'Mode memasak',
    shopBtn: 'Daftar belanja', pngBtn: 'Simpan PNG',
    shopTitle: 'Daftar Belanja', scaledTo: 'Diskalakan',
    shopNote: '\u00B7 duplikat digabung \u00B7 satuan metrik dipaksa',
    foot: '100% sisi klien. Tanpa backend, tanpa build. Siap untuk GitHub Pages.',
    canvasEmpty: 'Belum ada yang dirender \u2014 tulis DSL di kiri, atau biarkan AI mengekstraknya.',
    shopEmpty: 'Tidak ada bahan dalam DSL saat ini.',
    cookingOn: 'Mode memasak aktif \u2014 klik langkah untuk menandai selesai.',
    needText: 'Tempel teks resep mentah dulu.',
    needKey: 'Tambahkan kunci API dulu \u2014 kunci hanya dikirim ke penyedia layanan.',
    extracting: 'Membuat tabel\u2026', genOk: 'Tabel masak dibuat \u2014 sunting DSL di bawah.', aiErr: 'Kesalahan AI: ',
    fetching: 'Membaca tautan\u2026', fetchErr: 'Kesalahan tautan: ',
    translating: 'Menerjemahkan\u2026', transOk: 'Tabel diterjemahkan \u2014 struktur tetap sama.',
    regenHint: 'Bahasa antarmuka berubah. Tambahkan kunci API dan tabel saat ini akan diterjemahkan (struktur tetap sama).',
    rendering: 'Merender PNG\u2026', pngOk: 'PNG tersimpan.', pngFail: 'Ekspor gagal: ',
    offlineCanvas: 'html2canvas tidak dapat dimuat (offline?).',
    movedUp: 'Grup naik.', movedDown: 'Grup turun.',
    navUp: 'Naikkan grup', navDown: 'Turunkan grup',
    modelSwitch: 'Model Gemini beralih ke ', busy: ' sibuk \u2014 mencoba ulang\u2026',
    noModels: 'Kunci API Gemini ini tidak memiliki model teks yang tersedia.',
    regenHint: 'Bahasa antarmuka berubah. Teks tabel berasal dari DSL \u2014 tempel teks mentah + kunci API dan ekstraksi ulang berjalan otomatis.'
  }
};

function t(key) { return (I18N[state.lang] && I18N[state.lang][key]) || I18N.en[key] || key; }

function applyI18n() {
  document.documentElement.lang = state.lang === 'id' ? 'id' : 'en';
  document.querySelectorAll('[data-i18n]').forEach((el) => { el.textContent = t(el.dataset.i18n); });
  document.querySelectorAll('[data-i18n-ph]').forEach((el) => { el.placeholder = t(el.dataset.i18nPh); });
}

const LANGS = {
  en: {
    label: 'English',
    example: `Title: Modern Banyuwangi Sambal Tempong
> Heat water to boiling

[Boiled Base]
- 100 g tomatoes, chopped
- 1 tsp (5 g) shrimp paste (terasi)
> boil until soft

[Raw Aromatics]
- 50 g bird's eye chilies
- 3 shallots, peeled
- 2 cloves garlic
- 1/2 tsp (2 g) salt
- 1 tsp (5 g) sugar
> (wait)

[Assembly]
> grind in cobek (Boiled Base, Raw Aromatics)
- 1 Tbs (15 mL) lime juice
> mix well`
  },
  id: {
    label: 'Bahasa Indonesia',
    example: `Title: Sambal Tempong Banyuwangi Modern
> Didihkan air hingga mendidih

[Bahan Direbus]
- 100 g tomat, cincang
- 1 tsp (5 g) terasi
> rebus hingga lunak

[Bahan Mentah]
- 50 g cabai rawit
- 3 bawang merah, kupas
- 2 siung bawang putih
- 1/2 tsp (2 g) garam
- 1 tsp (5 g) gula
> (tunggu)

[Peracikan]
> haluskan dengan cobek (Bahan Direbus, Bahan Mentah)
- 1 Tbs (15 mL) air jeruk nipis
> aduk rata`
  }
};

function systemPrompt(lang) {
  const l = LANGS[lang] || LANGS.en;
  return `You are a recipe-to-DSL converter for a tabular "Cooking for Engineers" cooking matrix.
Reply with ONLY the DSL below - no markdown fences, no commentary.
Write ALL text (title, ingredients, actions, group names) in ${l.label}. Keep unit symbols g, mL, tsp, Tbs.

STRUCTURE: keep the table compact, simple and identical regardless of language - fewest columns possible, short actions (2-6 words), [Groups] only for genuinely parallel prep work, one final merge action. The same recipe must yield the same table shape in every language.

DSL RULES:
- Title: <name>                     first line
- ## COMPONENT: <name>              optional; starts a separate modular table
- [Group Name]                      parallel branch
- - <ingredient + quantity>         one per line; metric only (g, mL, tsp, Tbs); convert cups/oz/lbs and keep the result in parentheses, e.g. "- 240 mL (200 g) sugar"
- > <action>                        merges all active ingredients above into one step
- > (wait)                          hold-back: pushes ingredients right without merging
- > <action> (Group A, Group B)     middle-out merge of named groups
- a > action right after the Title is a global header step

EXAMPLE OUTPUT:
${l.example}`;
}

function translatePrompt(lang) {
  const l = LANGS[lang] || LANGS.en;
  return `You translate recipe DSL for a cooking-matrix app. Reply with ONLY the translated DSL - no markdown, no commentary.
Translate ONLY the human-readable words (title, ingredients, actions, group names) into ${l.label}. Keep unit symbols g, mL, tsp, Tbs.
Keep the DSL structure EXACTLY: same lines, same order, same groups, same merge references, same quantities and units.`;
}

const $ = (s) => document.querySelector(s);

const els = {};

const state = {
  dsl: DEFAULT_DSL,
  portion: 1,
  theme: 'emerald',
  accent: '',
  font: 14,
  pad: 10,
  cooking: false,
  provider: 'gemini',
  lang: 'en',
  orient: 'h',
  ingDir: 'h',
  actDir: 'auto',
  ingWrap: 0,
  actWrap: 0,
  apiKey: '',
  rawText: ''
};

let doneMap = {};
let renderTimer = null;
let saveTimer = null;

/* ---------------- utilities ---------------- */

function hash(s) {
  let h = 5381;
  for (let i = 0; i < s.length; i++) h = ((h << 5) + h + s.charCodeAt(i)) | 0;
  return (h >>> 0).toString(36);
}

function esc(s) {
  return String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}

function toast(msg) {
  const t = $('#toast');
  t.textContent = msg;
  t.classList.add('show');
  clearTimeout(toast._t);
  toast._t = setTimeout(() => t.classList.remove('show'), 2600);
}

function debounce(fn, ms) {
  return (...args) => {
    clearTimeout(fn._t);
    fn._t = setTimeout(() => fn(...args), ms);
  };
}

/* ---------------- quantity math ---------------- */

function parseQty(s) {
  s = String(s).trim();
  let m = s.match(/^(\d+)[-\s](\d+)\s*\/\s*(\d+)$/);
  if (m) return +m[1] + (+m[2]) / (+m[3]);
  m = s.match(/^(\d+)\s*\/\s*(\d+)$/);
  if (m) return (+m[1]) / (+m[2]);
  const v = parseFloat(s);
  return isFinite(v) ? v : 0;
}

function fmtQty(v) {
  if (!isFinite(v)) return '0';
  v = Math.round(v * 100) / 100;
  if (Math.abs(v - Math.round(v)) < 0.005) return String(Math.round(v));
  for (const d of [2, 3, 4, 8]) {
    const n = Math.round(v * d);
    if (rem(n, d) && Math.abs(v - n / d) < 0.02) {
      const whole = Math.floor(n / d);
      return (whole ? whole + '-' : '') + (n % d) + '/' + d;
    }
  }
  return String(v);
}

function rem(n, d) { return n % d !== 0; }

/* ---------------- unit conversion (imperial -> metric) ---------------- */

const CONVERSIONS = [
  { re: /((?:\d+[ -])?\d+\s*\/\s*\d+|\d+(?:\.\d+)?)\s*(?:fl\.?\s*oz\.?|fluid ounces)\b/gi, factor: 29.57, unit: 'mL' },
  { re: /((?:\d+[ -])?\d+\s*\/\s*\d+|\d+(?:\.\d+)?)\s*cups?\b/gi,                          factor: 236.59, unit: 'mL' },
  { re: /((?:\d+[ -])?\d+\s*\/\s*\d+|\d+(?:\.\d+)?)\s*pints?\b/gi,                         factor: 473.18, unit: 'mL' },
  { re: /((?:\d+[ -])?\d+\s*\/\s*\d+|\d+(?:\.\d+)?)\s*quarts?\b/gi,                        factor: 946.35, unit: 'mL' },
  { re: /((?:\d+[ -])?\d+\s*\/\s*\d+|\d+(?:\.\d+)?)\s*gallons?\b/gi,                       factor: 3785.41, unit: 'mL' },
  { re: /((?:\d+[ -])?\d+\s*\/\s*\d+|\d+(?:\.\d+)?)\s*(?:lbs?\.?|pounds?)\b/gi,            factor: 453.59, unit: 'g' },
  { re: /((?:\d+[ -])?\d+\s*\/\s*\d+|\d+(?:\.\d+)?)\s*(?:oz\.?|ounces)\b/gi,               factor: 28.35, unit: 'g' }
];

function roundMetric(v) {
  if (v >= 100) return Math.round(v / 10) * 10;
  if (v >= 20) return Math.round(v / 5) * 5;
  return Math.round(v * 2) / 2;
}

function convertUnits(text) {
  let out = text;
  for (const c of CONVERSIONS) {
    out = out.replace(c.re, (m, q) => {
      const v = parseQty(q);
      if (!v) return m;
      return fmtQty(roundMetric(v * c.factor)) + ' ' + c.unit;
    });
  }
  return out;
}

function scaleText(text, factor) {
  if (factor === 1) return text;
  return text.replace(/(?:\d+[ -])?\d+\s*\/\s*\d+|\d+(?:\.\d+)?|\d+/g, (m) => fmtQty(parseQty(m) * factor));
}

/* ---------------- DSL parser ---------------- */

function parseDSL(src) {
  const doc = { title: 'Untitled Recipe', components: [] };
  let comp = null;
  const ensureComp = () => {
    if (!comp) {
      comp = { name: '', lines: [] };
      doc.components.push(comp);
    }
    return comp;
  };
  for (const raw of String(src || '').split(/\r?\n/)) {
    const line = raw.trim();
    if (!line) continue;
    let m;
    if ((m = line.match(/^Title\s*:\s*(.+)$/i))) { doc.title = m[1].trim(); continue; }
    if ((m = line.match(/^##\s*(?:COMPONENT\s*:\s*)?(.+)$/i))) {
      comp = { name: m[1].trim(), lines: [] };
      doc.components.push(comp);
      continue;
    }
    if (line.startsWith('>')) {
      const body = line.replace(/^>\s*/, '').trim();
      const gm = body.match(/\(([^)]+)\)\s*$/);
      ensureComp().lines.push({
        type: 'action',
        body,
        wait: /^\(wait\)$/i.test(body),
        groupsRaw: gm ? gm[1] : null
      });
      continue;
    }
    if (line.startsWith('[') && line.endsWith(']')) {
      ensureComp().lines.push({ type: 'group', name: line.slice(1, -1).trim() });
      continue;
    }
    if (line.startsWith('-')) {
      const text = line.slice(1).trim();
      if (text) ensureComp().lines.push({ type: 'ing', text });
      continue;
    }
  }
  return doc;
}

/* ---------------- DAG / matrix builder ---------------- */

function buildComponent(comp) {
  const rows = [];
  const tracks = new Map([['main', { rows: [], col: 0 }]]);
  const groupOrder = [];
  let cur = 'main';

  const newRow = () => {
    const r = { cells: [], nextCol: 0, isHeader: false, track: null, isTrackHead: false, trackIdx: -1 };
    rows.push(r);
    return r;
  };

  const extendRow = (row, target) => {
    if (target <= row.nextCol) return;
    const last = row.cells[row.cells.length - 1];
    if (last) last.colspan += target - row.nextCol;
    else row.cells.push({ text: '', colspan: target - row.nextCol, rowspan: 1, kind: 'filler' });
    row.nextCol = target;
  };

  const placeAction = (entityRows, text, actionCol) => {
    entityRows.forEach((r) => extendRow(r, actionCol));
    const row0 = rows.indexOf(entityRows[0]);
    if (row0 < 0) return;
    rows[row0].cells.push({ text, colspan: 1, rowspan: entityRows.length, kind: 'action' });
    entityRows.forEach((r) => { r.nextCol = actionCol + 1; });
  };

  for (const tok of comp.lines) {
    if (tok.type === 'group') {
      if (!tracks.has(tok.name)) {
        tracks.set(tok.name, { rows: [], col: 0 });
        groupOrder.push(tok.name);
      }
      cur = tok.name;
      continue;
    }

    const track = tracks.get(cur);

    if (tok.type === 'ing') {
      const row = newRow();
      const span = Math.max(track.col, 1);
      row.cells.push({ text: tok.text, colspan: span, rowspan: 1, kind: 'ing' });
      row.nextCol = span;
      if (cur !== 'main') {
        row.track = cur;
        row.isTrackHead = track.rows.length === 0;
        row.trackIdx = groupOrder.indexOf(cur);
      }
      track.rows.push(row);
      continue;
    }

    if (tok.type !== 'action') continue;

    if (tok.wait) {
      track.col += 1;
      track.rows.forEach((r) => extendRow(r, Math.max(track.col, 1)));
      continue;
    }

    let groups = null;
    let text = tok.body;
    if (tok.groupsRaw) {
      const names = tok.groupsRaw.split(',').map((s) => s.trim()).filter(Boolean);
      if (names.length && names.every((n) => tracks.has(n))) {
        groups = names.map((n) => tracks.get(n));
        text = tok.body.replace(/\([^)]*\)\s*$/, '').trim();
      }
    }

    if (groups) {
      const actionCol = Math.max(1, ...groups.map((g) => g.col));
      const merged = [];
      groups.forEach((g) => {
        g.rows.forEach((r) => extendRow(r, actionCol));
        merged.push(...g.rows);
        g.col = actionCol + 1;
      });
      merged.sort((a, b) => rows.indexOf(a) - rows.indexOf(b));
      if (merged.length) {
        placeAction(merged, text, actionCol);
        const ct = tracks.get(cur);
        ct.rows = merged.slice();
        ct.col = actionCol + 1;
      }
    } else if (track.rows.length === 0) {
      const row = newRow();
      row.isHeader = true;
      row.cells.push({ text, colspan: 1, rowspan: 1, kind: 'header' });
      row.nextCol = 1;
    } else {
      const actionCol = Math.max(track.col, 1);
      placeAction(track.rows, text, actionCol);
      track.col = actionCol + 1;
    }
  }

  return { rows };
}

function layoutComponent(model) {
  const grid = model.rows.map(() => ({}));
  model.rows.forEach((row, ri) => {
    let col = 0;
    for (const cell of row.cells) {
      while (grid[ri][col] !== undefined) col++;
      cell._row = ri;
      cell._col = col;
      const rMax = Math.min(ri + cell.rowspan, grid.length);
      for (let r = ri; r < rMax; r++) {
        for (let c = col; c < col + cell.colspan; c++) grid[r][c] = cell;
      }
      col += cell.colspan;
    }
  });
  let total = 1;
  const seen = new Set();
  grid.forEach((r) => Object.values(r).forEach((cell) => {
    if (cell && !seen.has(cell)) {
      seen.add(cell);
      if (cell.kind !== 'header') total = Math.max(total, cell._col + cell.colspan);
    }
  }));
  model.rows.forEach((row) => row.cells.forEach((c) => {
    if (c.kind === 'header') c.colspan = total;
  }));
  model.rows.forEach((row, ri) => {
    const last = row.cells[row.cells.length - 1];
    if (!last || last.kind === 'header') return;
    let c = last._col + last.colspan;
    while (c < total && !grid[ri][c]) { grid[ri][c] = last; c++; }
    last.colspan = c - last._col;
  });
  model.totalCols = total;
  return grid;
}

/* ---------------- renderer ---------------- */

function wrapWords(text, n) {
  n = +n || 0;
  if (n < 1) return text;
  const words = String(text).split(/\s+/).filter(Boolean);
  const lines = [];
  for (let i = 0; i < words.length; i += n) lines.push(words.slice(i, i + n).join(' '));
  return lines.join('\n');
}

function transposeGrid(grid, cols) {
  const R = grid.length;
  const C = cols;
  const tg = Array.from({ length: C }, () => new Array(R).fill(null));
  for (let r = 0; r < R; r++)
    for (let c = 0; c < C; c++) tg[c][r] = grid[r][c] || null;
  const seen = new Set();
  for (let r = 0; r < C; r++) {
    for (let c = 0; c < R; c++) {
      const cell = tg[r][c];
      if (!cell || seen.has(cell)) continue;
      seen.add(cell);
      let span = 0;
      while (c + span < R && tg[r][c + span] === cell) span++;
      let depth = 0;
      while (r + depth < C && tg[r + depth][c] === cell) depth++;
      cell._row = r;
      cell._col = c;
      cell.colspan = span;
      cell.rowspan = depth;
    }
  }
  return { grid: tg, total: R };
}

function tableHTML(model, ci) {
  const grid0 = layoutComponent(model);
  model.rows.forEach((row, ri) => row.cells.forEach((cell, idx) => {
    cell._ridx = ri;
    cell._cidx = idx;
    cell._head = cell.kind === 'ing' && row.isTrackHead && row.cells[0] === cell;
    if (cell._head) cell._gi = row.trackIdx;
  }));
  let grid = grid0;
  let total = model.totalCols;
  if (state.orient === 'v') {
    const tp = transposeGrid(grid, total);
    grid = tp.grid;
    total = tp.total;
  }
  model.totalCols = total;
  let html = '';
  const R = grid.length;
  for (let ri = 0; ri < R; ri++) {
    html += '<tr>';
    for (let c = 0; c < total; c++) {
      const cell = grid[ri][c];
      if (!cell) { html += '<td class="cf-empty"></td>'; continue; }
      if (cell._row !== ri || cell._col !== c) continue;
      const cls = ['cf-' + cell.kind];
      let vert = false;
      if (cell.kind === 'action') vert = state.actDir === 'v' || (state.actDir === 'auto' && cell.rowspan >= 3);
      else if (cell.kind === 'ing') vert = state.ingDir === 'v';
      if (vert) cls.push('vert');
      let id = '';
      if (cell.kind === 'action' || cell.kind === 'ing') {
        id = ci + ':' + cell._ridx + ':' + cell._cidx;
        if (doneMap[id]) cls.push('done');
      }
      let text = cell.text;
      if (cell.kind === 'ing') text = scaleText(convertUnits(text), state.portion);
      const wrapN = cell.kind === 'ing' ? state.ingWrap : state.actWrap;
      if (!vert && wrapN >= 1) {
        text = wrapWords(text, wrapN);
        cls.push('wrapped');
      }
      let nav = '';
      if (cell._head) {
        nav = '<span class="trk-nav" data-ci="' + ci + '" data-gi="' + cell._gi + '">' +
          '<button type="button" class="trk-btn" data-dir="-1" title="' + esc(t('navUp')) + '" aria-label="' + esc(t('navUp')) + '">&#8593;</button>' +
          '<button type="button" class="trk-btn" data-dir="1" title="' + esc(t('navDown')) + '" aria-label="' + esc(t('navDown')) + '">&#8595;</button>' +
          '</span>';
      }
      html += '<td class="' + cls.join(' ') + '"' +
        (id ? ' data-id="' + id + '"' : '') +
        ' colspan="' + cell.colspan + '" rowspan="' + cell.rowspan + '">' +
        nav + esc(text) + '</td>';
    }
    html += '</tr>';
  }
  return '<table class="cf-table">' + html + '</table>';
}

function render() {
  const doc = parseDSL(state.dsl);
  const canvas = els.canvas;
  canvas.innerHTML = '';
  const wrap = document.createElement('div');
  wrap.className = 'recipe';
  const h = document.createElement('h2');
  h.className = 'recipe-title';
  h.textContent = doc.title;
  wrap.appendChild(h);
  let shown = 0;
  doc.components.forEach((comp, ci) => {
    const model = buildComponent(comp);
    if (!model.rows.length) return;
    shown++;
    if (comp.name) {
      const s = document.createElement('h3');
      s.className = 'recipe-sub';
      s.textContent = comp.name;
      wrap.appendChild(s);
    }
    wrap.insertAdjacentHTML('beforeend', tableHTML(model, ci));
  });
  if (!shown) {
    const p = document.createElement('p');
    p.className = 'canvas-empty';
    p.textContent = t('canvasEmpty');
    wrap.appendChild(p);
  }
  canvas.appendChild(wrap);
  canvas.classList.toggle('cooking', state.cooking);
  document.title = doc.title + ' — Matrix Kitchen';
}

/* ---------------- block reordering ---------------- */

function componentRanges(lines) {
  const ranges = [];
  const heads = [];
  let leadFirst = -1;
  lines.forEach((l, i) => {
    const t = l.trim();
    if (/^##/.test(t)) heads.push(i);
    else if (heads.length === 0 && leadFirst < 0 && /^[-\[>]/.test(t)) leadFirst = i;
  });
  if (!heads.length) ranges.push({ start: 0, end: lines.length });
  else if (leadFirst >= 0) ranges.push({ start: 0, end: heads[0] });
  heads.forEach((h, i) => {
    ranges.push({ start: h + 1, end: i + 1 < heads.length ? heads[i + 1] : lines.length });
  });
  return ranges;
}

function groupBlockIndices(lines, range) {
  const idx = [];
  for (let i = range.start; i < range.end; i++) {
    const t = lines[i].trim();
    if (t.startsWith('[') && t.endsWith(']')) idx.push(i);
  }
  return idx;
}

function reorderDslBlocks(src, ci, gi, dir) {
  const lines = String(src || '').split(/\r?\n/);
  const range = componentRanges(lines)[ci];
  if (!range || gi < 0) return src;
  const heads = groupBlockIndices(lines, range);
  const swap = gi + dir;
  if (swap < 0 || swap >= heads.length) return src;
  const first = Math.min(gi, swap);
  const second = Math.max(gi, swap);
  const fStart = heads[first];
  const sStart = heads[second];
  const sEnd = second + 1 < heads.length ? heads[second + 1] : range.end;
  const fSeg = lines.slice(fStart, sStart);
  const sSeg = lines.slice(sStart, sEnd);
  return [...lines.slice(0, fStart), ...sSeg, ...fSeg, ...lines.slice(sEnd)].join('\n');
}

function applyReorder(ci, gi, dir) {
  const next = reorderDslBlocks(state.dsl, ci, gi, dir);
  if (next === state.dsl) return;
  state.dsl = next;
  els.dsl.value = next;
  loadDone();
  render();
  saveState();
  toast(dir < 0 ? t('movedUp') : t('movedDown'));
}

/* ---------------- cooking mode ---------------- */

function doneKey() { return 'mk.done.' + hash(state.dsl); }

function loadDone() {
  try { doneMap = JSON.parse(localStorage.getItem(doneKey()) || '{}'); }
  catch (e) { doneMap = {}; }
}

function saveDone() { localStorage.setItem(doneKey(), JSON.stringify(doneMap)); }

function onCanvasClick(e) {
  if (e.target.closest('.trk-btn')) return;
  if (!state.cooking) return;
  const td = e.target.closest('td[data-id]');
  if (!td) return;
  const id = td.dataset.id;
  if (doneMap[id]) delete doneMap[id];
  else doneMap[id] = true;
  td.classList.toggle('done', !!doneMap[id]);
  saveDone();
}

/* ---------------- shopping list ---------------- */

function parseIngredientLine(text) {
  const m = text.match(/^\s*((?:\d+[ -])?\d+\s*\/\s*\d+|\d+(?:\.\d+)?)\s*(g|mL|ml|L|kg|tsp|tbsp|Tbs|Tbsp|TSP)?\.?\s*(.*)$/);
  if (!m || !m[3] || !m[3].trim()) return { qty: null, unit: '', name: text.trim() };
  return {
    qty: parseQty(m[1]),
    unit: (m[2] || '').replace(/\./g, ''),
    name: m[3].trim().replace(/^,\s*/, '')
  };
}

function buildShoppingList(source) {
  const doc = typeof source === 'string'
    ? parseDSL(source)
    : (source && source.components ? source : parseDSL(state.dsl));
  const list = new Map();
  doc.components.forEach((comp) => comp.lines.forEach((l) => {
    if (l.type !== 'ing') return;
    const text = scaleText(convertUnits(l.text), state.portion);
    const p = parseIngredientLine(text);
    const name = p.name.replace(/^\([^)]*\)\s*/, '').split(',')[0].trim();
    if (!name) return;
    const key = name.toLowerCase() + '|' + (p.qty !== null ? p.unit.toLowerCase() : '');
    if (!list.has(key)) list.set(key, { qty: 0, unit: p.unit, name, hasQty: p.qty !== null });
    const it = list.get(key);
    if (p.qty !== null) { it.qty += p.qty; it.hasQty = true; }
  }));
  return [...list.values()];
}

function openShopping() {
  const items = buildShoppingList();
  els.shopList.innerHTML = '';
  $('#modalPortion').textContent = state.portion + '\u00D7';
  if (!items.length) {
    els.shopList.innerHTML = '<li>' + esc(t('shopEmpty')) + '</li>';
  }
  items.forEach((it) => {
    const li = document.createElement('li');
    const qtyStr = it.hasQty ? fmtQty(it.qty) + (it.unit ? ' ' + it.unit : '') : '\u2014';
    li.innerHTML = '<input type="checkbox" tabindex="-1"><span class="qty">' + esc(qtyStr) + '</span><span>' + esc(it.name) + '</span>';
    li.addEventListener('click', () => {
      li.classList.toggle('checked');
      li.querySelector('input').checked = li.classList.contains('checked');
    });
    els.shopList.appendChild(li);
  });
  els.modalBackdrop.classList.remove('hidden');
}

function closeShopping() { els.modalBackdrop.classList.add('hidden'); }

/* ---------------- AI extraction ---------------- */

const GEMINI_BASE = 'https://generativelanguage.googleapis.com/v1beta';
const GEMINI_PREFERRED = ['gemini-3.5-flash', 'gemini-3.6-flash'];
let geminiModel = '';

async function apiErr(res, label) {
  let detail = '';
  try { detail = ' \u2014 ' + String(await res.text()).replace(/\s+/g, ' ').trim().slice(0, 160); } catch (e) { /* body unavailable */ }
  return label + ' API error ' + res.status + detail;
}

function geminiPayload(text, sys) {
  return {
    systemInstruction: { parts: [{ text: sys || systemPrompt(state.lang) }] },
    contents: [{ role: 'user', parts: [{ text }] }]
  };
}

async function geminiGenerate(model, key, text, sys) {
  const res = await fetch(GEMINI_BASE + '/models/' + encodeURIComponent(model) + ':generateContent?key=' + encodeURIComponent(key), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(geminiPayload(text, sys))
  });
  if (!res.ok) {
    const err = new Error(await apiErr(res, 'Gemini'));
    err.status = res.status;
    err.model = model;
    throw err;
  }
  const data = await res.json();
  return (data.candidates?.[0]?.content?.parts || []).map((p) => p.text || '').join('');
}

async function discoverGeminiModel(key) {
  const res = await fetch(GEMINI_BASE + '/models?key=' + encodeURIComponent(key));
  if (!res.ok) throw new Error(await apiErr(res, 'Gemini'));
  const { models = [] } = await res.json();
  const usable = models
    .filter((m) => (m.supportedGenerationMethods || []).includes('generateContent'))
    .map((m) => String(m.name || '').replace(/^models\//, ''))
    .filter((n) => /^gemini-.+(flash|pro)/.test(n))
    .filter((n) => !/(image|tts|audio|video|embedding|native|live|thinking)/i.test(n))
    .sort((a, b) => {
      const la = /-latest$/.test(a) ? 1 : 0;
      const lb = /-latest$/.test(b) ? 1 : 0;
      if (la !== lb) return lb - la;
      return b.localeCompare(a, undefined, { numeric: true });
    });
  if (!usable.length) throw new Error(t('noModels'));
  return usable[0];
}

const GEMINI_TRANSIENT = new Set([429, 500, 502, 503, 504]);

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function withRetry(fn) {
  for (let attempt = 1; ; attempt++) {
    try {
      return await fn();
    } catch (err) {
      if (!GEMINI_TRANSIENT.has(err.status) || attempt >= 2) throw err;
      toast(err.model + t('busy'));
      await sleep(1200 * attempt);
    }
  }
}

async function callGemini(text, key, sys) {
  const tried = [...new Set([geminiModel, ...GEMINI_PREFERRED].filter(Boolean))];
  let lastErr = null;
  for (const model of tried) {
    try {
      const out = await withRetry(() => geminiGenerate(model, key, text, sys));
      geminiModel = model;
      return out;
    } catch (err) {
      if (err.status !== 404 && !GEMINI_TRANSIENT.has(err.status)) throw err;
      lastErr = err;
    }
  }
  try {
    const model = await discoverGeminiModel(key);
    const out = await withRetry(() => geminiGenerate(model, key, text, sys));
    geminiModel = model;
    toast(t('modelSwitch') + model);
    return out;
  } catch (err) {
    throw lastErr || err;
  }
}

function looksLikeUrl(s) {
  return /^(https?:\/\/|www\.)[^\s]+$/i.test(String(s || '').trim());
}

const READERS = [
  (u) => 'https://r.jina.ai/' + u,
  (u) => 'https://api.allorigins.win/raw?url=' + encodeURIComponent(u)
];

async function fetchReadable(url) {
  let lastErr = null;
  for (const make of READERS) {
    try {
      const res = await fetch(make(url), { headers: { 'Accept': 'text/plain, text/html, */*' } });
      if (!res.ok) { lastErr = new Error('HTTP ' + res.status); continue; }
      const text = await res.text();
      const clean = text
        .replace(/<script[\s\S]*?<\/script>/gi, ' ')
        .replace(/<style[\s\S]*?<\/style>/gi, ' ')
        .replace(/<[^>]+>/g, ' ')
        .replace(/[ \t]+/g, ' ')
        .trim();
      if (clean.length < 40) { lastErr = new Error('no readable text at that link'); continue; }
      return clean.slice(0, 24000);
    } catch (err) {
      lastErr = err;
    }
  }
  throw lastErr || new Error('link could not be read');
}

async function callAI(text, provider, key, sys) {
  if (provider === 'gemini') return callGemini(text, key, sys);
  const res = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + key },
    body: JSON.stringify({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: sys || systemPrompt(state.lang) },
        { role: 'user', content: text }
      ]
    })
  });
  if (!res.ok) throw new Error(await apiErr(res, 'OpenAI'));
  const data = await res.json();
  return data.choices?.[0]?.message?.content || '';
}

async function generate() {
  let raw = els.rawText.value.trim();
  const key = els.apiKey.value.trim();
  if (!raw) return toast(t('needText'));
  if (!key) return toast(t('needKey'));
  els.generateBtn.disabled = true;
  if (looksLikeUrl(raw)) {
    els.generateBtn.textContent = t('fetching');
    try {
      raw = await fetchReadable(/^https?:\/\//i.test(raw) ? raw : 'https://' + raw);
      els.rawText.value = raw;
      state.rawText = raw;
    } catch (err) {
      toast(t('fetchErr') + err.message);
      els.generateBtn.disabled = false;
      els.generateBtn.textContent = t('genBtn');
      return;
    }
  }
  els.generateBtn.textContent = t('extracting');
  try {
    const out = await callAI(raw, state.provider, key);
    const clean = out.replace(/```[a-z]*\s*/gi, '').replace(/```/g, '').trim();
    if (!clean) throw new Error('empty response');
    state.dsl = clean;
    els.dsl.value = clean;
    loadDone();
    render();
    saveState();
    toast(t('genOk'));
  } catch (err) {
    toast(t('aiErr') + err.message);
  }
  els.generateBtn.disabled = false;
  els.generateBtn.textContent = t('genBtn');
}

async function retranslate() {
  els.generateBtn.disabled = true;
  els.generateBtn.textContent = t('translating');
  try {
    const out = await callAI(state.dsl, state.provider, els.apiKey.value.trim(), translatePrompt(state.lang));
    const clean = out.replace(/```[a-z]*\s*/gi, '').replace(/```/g, '').trim();
    if (!clean) throw new Error('empty response');
    state.dsl = clean;
    els.dsl.value = clean;
    loadDone();
    render();
    saveState();
    toast(t('transOk'));
  } catch (err) {
    toast(t('aiErr') + err.message);
  }
  els.generateBtn.disabled = false;
  els.generateBtn.textContent = t('genBtn');
}

/* ---------------- PNG export ---------------- */

function sanitizeClone(clonedDoc) {
  const MODERN = /color\(|oklch\(|oklab\(|lab\(|lch\(|color-mix\(/i;
  const ctx = document.createElement('canvas').getContext('2d');
  const legacy = (c) => {
    try { ctx.fillStyle = c; return ctx.fillStyle; } catch (e) { return c; }
  };
  const fix = (s) => s.replace(/(color\([^)]*\)|oklch\([^)]*\)|oklab\([^)]*\)|lab\([^)]*\)|lch\([^)]*\)|color-mix\([^)]*\))/gi, (m) => legacy(m));
  const srcRoot = els.canvas.querySelector('.recipe') || els.canvas;
  const dstRoot = clonedDoc.querySelector('.recipe') || clonedDoc.querySelector('#canvas');
  if (!dstRoot) return;
  const src = srcRoot.querySelectorAll('*');
  const dst = dstRoot.querySelectorAll('*');
  const props = ['color', 'backgroundColor', 'borderTopColor', 'borderRightColor', 'borderBottomColor', 'borderLeftColor', 'backgroundImage', 'boxShadow'];
  const n = Math.min(src.length, dst.length);
  for (let i = 0; i < n; i++) {
    const cs = getComputedStyle(src[i]);
    for (const p of props) {
      const v = cs[p];
      if (v && MODERN.test(v)) dst[i].style[p] = fix(v);
    }
  }
}

function savePNG() {
  if (typeof html2canvas === 'undefined') return toast(t('offlineCanvas'));
  const target = els.canvas.querySelector('.recipe') || els.canvas;
  toast(t('rendering'));
  document.body.classList.add('exporting');
  html2canvas(target, {
    scale: 2,
    backgroundColor: getComputedStyle(document.body).backgroundColor || '#ffffff',
    useCORS: true,
    onclone: sanitizeClone
  }).then((c) => {
    const a = document.createElement('a');
    a.download = (document.title.replace(' — Matrix Kitchen', '') || 'recipe') + '.png';
    a.href = c.toDataURL('image/png');
    a.click();
    toast(t('pngOk'));
  }).catch((err) => toast(t('pngFail') + err.message))
    .finally(() => document.body.classList.remove('exporting'));
}

/* ---------------- theme & appearance ---------------- */

function hexRgb(hex) {
  let h = String(hex).replace('#', '');
  if (h.length === 3) h = h.split('').map((c) => c + c).join('');
  const v = parseInt(h, 16) || 0;
  return [(v >> 16) & 255, (v >> 8) & 255, v & 255];
}

function mixHex(a, b, pct) {
  const A = hexRgb(a);
  const B = hexRgb(b);
  return 'rgb(' + A.map((v, i) => Math.round(v * pct + B[i] * (1 - pct))).join(', ') + ')';
}

function rgbaHex(a, alpha) {
  return 'rgba(' + hexRgb(a).join(', ') + ', ' + alpha + ')';
}

function applyTheme() {
  const root = document.documentElement;
  const th = THEMES[state.theme] || THEMES.emerald;
  const accent = state.accent || th.accent;
  root.style.setProperty('--accent', accent);
  root.style.setProperty('--accent-soft', state.accent ? rgbaHex(accent, 0.15) : th.soft);
  root.style.setProperty('--accent-border', mixHex(accent, '#ffffff', 0.55));
  root.style.setProperty('--accent-ink', mixHex(accent, '#101828', 0.75));
  root.style.setProperty('--accent-code', mixHex(accent, '#000000', 0.70));
  root.style.setProperty('--accent-dark', mixHex(accent, '#000000', 0.88));
  root.style.setProperty('--accent-ring', rgbaHex(accent, 0.18));
  root.style.setProperty('--accent-ring2', rgbaHex(accent, 0.30));
  root.style.setProperty('--accent-done', rgbaHex(accent, 0.12));
  root.style.setProperty('--cf-font', state.font + 'px');
  root.style.setProperty('--cf-pad', state.pad + 'px');
}

function renderSwatches() {
  els.swatches.innerHTML = '';
  Object.entries(THEMES).forEach(([name, t]) => {
    const b = document.createElement('button');
    b.className = 'swatch' + (!state.accent && state.theme === name ? ' active' : '');
    b.style.background = t.accent;
    b.title = name.charAt(0).toUpperCase() + name.slice(1);
    b.addEventListener('click', () => {
      state.theme = name;
      state.accent = '';
      els.accentPicker.value = t.accent;
      applyTheme();
      renderSwatches();
      saveState();
    });
    els.swatches.appendChild(b);
  });
}

/* ---------------- persistence ---------------- */

function saveState() {
  try {
    localStorage.setItem('mk.settings', JSON.stringify({
      portion: state.portion,
      theme: state.theme,
      accent: state.accent,
      font: state.font,
      pad: state.pad,
      cooking: state.cooking,
      provider: state.provider,
      lang: state.lang,
      orient: state.orient,
      ingDir: state.ingDir,
      actDir: state.actDir,
      ingWrap: state.ingWrap,
      actWrap: state.actWrap,
      apiKey: state.apiKey,
      rawText: state.rawText
    }));
    localStorage.setItem('mk.dsl', state.dsl);
  } catch (e) { /* storage unavailable */ }
}

function loadState() {
  try {
    const saved = JSON.parse(localStorage.getItem('mk.settings') || '{}');
    Object.assign(state, saved);
    state.lang = saved.lang || saved.outputLang || state.lang;
  } catch (e) { /* ignore */ }
  const dsl = localStorage.getItem('mk.dsl');
  state.dsl = dsl === null ? DEFAULT_DSL : dsl;
  if (!LANGS[state.lang]) state.lang = 'en';
  if (state.orient !== 'v') state.orient = 'h';
  if (state.ingDir !== 'v') state.ingDir = 'h';
  if (!['auto', 'h', 'v'].includes(state.actDir)) state.actDir = 'auto';
  state.ingWrap = Math.min(6, Math.max(0, +state.ingWrap || 0));
  state.actWrap = Math.min(6, Math.max(0, +state.actWrap || 0));
}

/* ---------------- wiring ---------------- */

const debouncedRender = debounce(() => { loadDone(); render(); }, 160);

function bind() {
  els.dsl.addEventListener('input', () => {
    state.dsl = els.dsl.value;
    debouncedRender();
    clearTimeout(saveTimer);
    saveTimer = setTimeout(saveState, 400);
  });

  els.portion.addEventListener('change', () => {
    state.portion = parseFloat(els.portion.value) || 1;
    render();
    saveState();
  });

  els.cookingToggle.addEventListener('change', () => {
    state.cooking = els.cookingToggle.checked;
    els.canvas.classList.toggle('cooking', state.cooking);
    if (state.cooking) toast(t('cookingOn'));
    saveState();
  });

  els.canvas.addEventListener('click', (e) => {
    const btn = e.target.closest('.trk-btn');
    if (!btn) return;
    const nav = btn.closest('.trk-nav');
    if (!nav) return;
    e.preventDefault();
    applyReorder(+nav.dataset.ci, +nav.dataset.gi, +btn.dataset.dir);
  });

  els.canvas.addEventListener('click', onCanvasClick);

  els.shopBtn.addEventListener('click', openShopping);
  els.modalClose.addEventListener('click', closeShopping);
  els.modalBackdrop.addEventListener('click', (e) => { if (e.target === els.modalBackdrop) closeShopping(); });
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape') closeShopping(); });

  els.pngBtn.addEventListener('click', savePNG);
  els.generateBtn.addEventListener('click', generate);

  els.provider.addEventListener('change', () => { state.provider = els.provider.value; saveState(); });
  els.outputLang.addEventListener('change', () => {
    state.lang = els.outputLang.value;
    applyI18n();
    render();
    saveState();
    if (els.apiKey.value.trim() && state.dsl.trim()) retranslate();
    else if (els.rawText.value.trim() && els.apiKey.value.trim()) generate();
    else toast(t('regenHint'));
  });
  els.orientSel.addEventListener('change', () => { state.orient = els.orientSel.value; render(); saveState(); });
  els.ingDir.addEventListener('change', () => { state.ingDir = els.ingDir.value; render(); saveState(); });
  els.actDir.addEventListener('change', () => { state.actDir = els.actDir.value; render(); saveState(); });
  els.ingWrap.addEventListener('change', () => { state.ingWrap = +els.ingWrap.value || 0; render(); saveState(); });
  els.actWrap.addEventListener('change', () => { state.actWrap = +els.actWrap.value || 0; render(); saveState(); });
  els.apiKey.addEventListener('input', () => { state.apiKey = els.apiKey.value; saveState(); });
  els.rawText.addEventListener('input', () => { state.rawText = els.rawText.value; saveState(); });

  els.accentPicker.addEventListener('input', () => {
    state.accent = els.accentPicker.value;
    applyTheme();
    renderSwatches();
    saveState();
  });

  els.resetAccent.addEventListener('click', () => {
    state.accent = '';
    applyTheme();
    renderSwatches();
    saveState();
  });

  els.fontRange.addEventListener('input', () => {
    state.font = +els.fontRange.value;
    els.fontOut.textContent = state.font + ' px';
    applyTheme();
    saveState();
  });

  els.padRange.addEventListener('input', () => {
    state.pad = +els.padRange.value;
    els.padOut.textContent = state.pad + ' px';
    applyTheme();
    saveState();
  });
}

function init() {
  Object.assign(els, {
    dsl: $('#dslInput'),
    rawText: $('#rawText'),
    apiKey: $('#apiKey'),
    provider: $('#provider'),
    outputLang: $('#outputLang'),
    orientSel: $('#orientSel'),
    ingDir: $('#ingDir'),
    actDir: $('#actDir'),
    ingWrap: $('#ingWrap'),
    actWrap: $('#actWrap'),
    generateBtn: $('#generateBtn'),
    portion: $('#portion'),
    cookingToggle: $('#cookingToggle'),
    shopBtn: $('#shopBtn'),
    pngBtn: $('#pngBtn'),
    canvas: $('#canvas'),
    modalBackdrop: $('#modalBackdrop'),
    modalClose: $('#modalClose'),
    shopList: $('#shopList'),
    swatches: $('#swatches'),
    accentPicker: $('#accentPicker'),
    resetAccent: $('#resetAccent'),
    fontRange: $('#fontRange'),
    padRange: $('#padRange'),
    fontOut: $('#fontOut'),
    padOut: $('#padOut')
  });

  loadState();

  els.dsl.value = state.dsl;
  els.rawText.value = state.rawText || '';
  els.apiKey.value = state.apiKey || '';
  els.provider.value = state.provider;
  els.outputLang.value = state.lang;
  els.orientSel.value = state.orient;
  els.ingDir.value = state.ingDir;
  els.actDir.value = state.actDir;
  els.ingWrap.value = String(state.ingWrap);
  els.actWrap.value = String(state.actWrap);
  els.portion.value = String(state.portion);
  els.cookingToggle.checked = !!state.cooking;
  els.fontRange.value = state.font;
  els.padRange.value = state.pad;
  els.fontOut.textContent = state.font + ' px';
  els.padOut.textContent = state.pad + ' px';
  els.accentPicker.value = state.accent || (THEMES[state.theme] || THEMES.emerald).accent;

  applyTheme();
  applyI18n();
  renderSwatches();
  loadDone();
  bind();
  render();
}

document.addEventListener('DOMContentLoaded', init);
