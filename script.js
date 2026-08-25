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

const SYSTEM_PROMPT = `You are a recipe-to-DSL converter for a tabular "Cooking for Engineers" matrix generator.
Convert the user's recipe text into the custom DSL below. Output ONLY the DSL syntax: no markdown fences, no commentary, no explanations.

DSL RULES:
- Title: <recipe name>                        (must be the first line)
- ## COMPONENT: <name>                        (optional; splits the recipe into separate modular tables)
- [Group Name]                                (declares a parallel branch; following ingredients/actions belong to it)
- - <ingredient with quantity>                (one ingredient per line; ALWAYS use metric grams (g), millilitres (mL), tsp or Tbs only. Convert cups/oz/lbs/quarts to g or mL and keep the converted value in parentheses, e.g. "- 240 mL (200 g) sugar")
- > <action>                                  (merges all active ingredients above it into one step)
- > (wait)                                    (hold-back: pushes the active ingredients right without merging)
- > <action> (Group A, Group B)               (merges the named parallel groups together - middle-out merge)
- A ">" action placed immediately after the Title (before any ingredient) is a global header step, e.g. "> Preheat oven to 175 C".

EXAMPLE OUTPUT:
Title: Modern Banyuwangi Sambal Tempong
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
  let cur = 'main';

  const newRow = () => {
    const r = { cells: [], nextCol: 0, isHeader: false };
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
      if (!tracks.has(tok.name)) tracks.set(tok.name, { rows: [], col: 0 });
      cur = tok.name;
      continue;
    }

    const track = tracks.get(cur);

    if (tok.type === 'ing') {
      const row = newRow();
      const span = Math.max(track.col, 1);
      row.cells.push({ text: tok.text, colspan: span, rowspan: 1, kind: 'ing' });
      row.nextCol = span;
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

function tableHTML(model, ci) {
  const grid = layoutComponent(model);
  let html = '';
  model.rows.forEach((row, ri) => {
    html += '<tr>';
    for (let c = 0; c < model.totalCols; c++) {
      const cell = grid[ri][c];
      if (!cell) { html += '<td class="cf-empty"></td>'; continue; }
      if (cell._row !== ri || cell._col !== c) continue;
      const idx = row.cells.indexOf(cell);
      const cls = ['cf-' + cell.kind];
      if (cell.kind === 'action' && cell.rowspan >= 3) cls.push('vert');
      let id = '';
      if (cell.kind === 'action' || cell.kind === 'ing') {
        id = ci + ':' + ri + ':' + idx;
        if (doneMap[id]) cls.push('done');
      }
      let text = cell.text;
      if (cell.kind === 'ing') text = scaleText(convertUnits(text), state.portion);
      html += '<td class="' + cls.join(' ') + '"' +
        (id ? ' data-id="' + id + '"' : '') +
        ' colspan="' + cell.colspan + '" rowspan="' + cell.rowspan + '">' +
        esc(text) + '</td>';
    }
    html += '</tr>';
  });
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
    p.textContent = 'Nothing to render yet — write some DSL on the left, or let the AI extract it for you.';
    wrap.appendChild(p);
  }
  canvas.appendChild(wrap);
  canvas.classList.toggle('cooking', state.cooking);
  document.title = doc.title + ' — Matrix Kitchen';
}

/* ---------------- cooking mode ---------------- */

function doneKey() { return 'mk.done.' + hash(state.dsl); }

function loadDone() {
  try { doneMap = JSON.parse(localStorage.getItem(doneKey()) || '{}'); }
  catch (e) { doneMap = {}; }
}

function saveDone() { localStorage.setItem(doneKey(), JSON.stringify(doneMap)); }

function onCanvasClick(e) {
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
    els.shopList.innerHTML = '<li>No ingredients found in the current DSL.</li>';
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

async function callAI(text, provider, key) {
  if (provider === 'gemini') {
    const res = await fetch('https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=' + encodeURIComponent(key), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: SYSTEM_PROMPT }] },
        contents: [{ role: 'user', parts: [{ text }] }]
      })
    });
    if (!res.ok) throw new Error('Gemini API error ' + res.status);
    const data = await res.json();
    const parts = data.candidates?.[0]?.content?.parts || [];
    return parts.map((p) => p.text || '').join('');
  }
  const res = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + key },
    body: JSON.stringify({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: text }
      ]
    })
  });
  if (!res.ok) throw new Error('OpenAI API error ' + res.status);
  const data = await res.json();
  return data.choices?.[0]?.message?.content || '';
}

async function generate() {
  const raw = els.rawText.value.trim();
  const key = els.apiKey.value.trim();
  if (!raw) return toast('Paste some raw recipe text first.');
  if (!key) return toast('Add your API key first — it never leaves your browser except to call the provider.');
  els.generateBtn.disabled = true;
  els.generateBtn.textContent = 'Extracting\u2026';
  try {
    const out = await callAI(raw, state.provider, key);
    const clean = out.replace(/```[a-z]*\s*/gi, '').replace(/```/g, '').trim();
    if (!clean) throw new Error('empty response');
    state.dsl = clean;
    els.dsl.value = clean;
    loadDone();
    render();
    saveState();
    toast('DSL generated — edit it freely in the studio below.');
  } catch (err) {
    toast('AI error: ' + err.message);
  }
  els.generateBtn.disabled = false;
  els.generateBtn.textContent = 'Generate DSL';
}

/* ---------------- PNG export ---------------- */

function savePNG() {
  if (typeof html2canvas === 'undefined') return toast('html2canvas could not be loaded (offline?).');
  const target = els.canvas.querySelector('.recipe') || els.canvas;
  toast('Rendering PNG\u2026');
  html2canvas(target, {
    scale: 2,
    backgroundColor: getComputedStyle(document.body).backgroundColor || '#ffffff',
    useCORS: true
  }).then((c) => {
    const a = document.createElement('a');
    a.download = (document.title.replace(' — Matrix Kitchen', '') || 'recipe') + '.png';
    a.href = c.toDataURL('image/png');
    a.click();
    toast('PNG saved.');
  }).catch((err) => toast('Export failed: ' + err.message));
}

/* ---------------- theme & appearance ---------------- */

function applyTheme() {
  const root = document.documentElement;
  const t = THEMES[state.theme] || THEMES.emerald;
  const accent = state.accent || t.accent;
  root.style.setProperty('--accent', accent);
  root.style.setProperty('--accent-soft', state.accent ? accent + '26' : t.soft);
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
  } catch (e) { /* ignore */ }
  const dsl = localStorage.getItem('mk.dsl');
  state.dsl = dsl === null ? DEFAULT_DSL : dsl;
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
    if (state.cooking) toast('Cooking mode on — click steps to mark them done.');
    saveState();
  });

  els.canvas.addEventListener('click', onCanvasClick);

  els.shopBtn.addEventListener('click', openShopping);
  els.modalClose.addEventListener('click', closeShopping);
  els.modalBackdrop.addEventListener('click', (e) => { if (e.target === els.modalBackdrop) closeShopping(); });
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape') closeShopping(); });

  els.pngBtn.addEventListener('click', savePNG);
  els.generateBtn.addEventListener('click', generate);

  els.provider.addEventListener('change', () => { state.provider = els.provider.value; saveState(); });
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
  els.portion.value = String(state.portion);
  els.cookingToggle.checked = !!state.cooking;
  els.fontRange.value = state.font;
  els.padRange.value = state.pad;
  els.fontOut.textContent = state.font + ' px';
  els.padOut.textContent = state.pad + ' px';
  els.accentPicker.value = state.accent || (THEMES[state.theme] || THEMES.emerald).accent;

  applyTheme();
  renderSwatches();
  loadDone();
  bind();
  render();
}

document.addEventListener('DOMContentLoaded', init);
