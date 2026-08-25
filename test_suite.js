'use strict';

/*
 * MATRIX KITCHEN — QA Test Harness
 * Standalone Node.js runner. Loads script.js into a sandboxed VM context,
 * stubs the browser environment, and asserts on the parsed DAG output and
 * the generated table DOM (HTML string) for 6 topological archetypes.
 *
 * Run: node test_suite.js
 */

const fs = require('fs');
const path = require('path');
const vm = require('vm');

/* ---------------- sandbox bootstrap ---------------- */

const SRC_PATH = path.join(__dirname, 'script.js');
const SRC = fs.readFileSync(SRC_PATH, 'utf8');

function makeSandbox() {
  const elStub = () => ({
    style: {},
    classList: { add() {}, remove() {}, toggle() {}, contains() { return false; } },
    dataset: {},
    appendChild() {},
    insertAdjacentHTML() {},
    addEventListener() {},
    querySelector() { return null; },
    querySelectorAll() { return []; }
  });
  const sandbox = {
    console,
    setTimeout, clearTimeout, setInterval, clearInterval,
    document: {
      addEventListener() {},
      querySelector() { return elStub(); },
      createElement() { return elStub(); },
      title: '',
      body: elStub(),
      documentElement: { style: { setProperty() {} } }
    },
    localStorage: { getItem: () => null, setItem() {}, removeItem() {} },
    navigator: { userAgent: 'node-qa' },
    fetch: () => Promise.reject(new Error('offline')),
    html2canvas: undefined
  };
  sandbox.window = sandbox;
  sandbox.globalThis = sandbox;
  return vm.createContext(sandbox);
}

const ctx = makeSandbox();
vm.runInContext(SRC.replace(/document\.addEventListener\('DOMContentLoaded',\s*init\);/, ''), ctx, { filename: 'script.js' });

vm.runInContext(`
  globalThis.E = {
    parseDSL, buildComponent, layoutComponent, tableHTML,
    scaleText, convertUnits, parseQty, fmtQty, parseIngredientLine,
    buildShoppingList,
    setPortion: (v) => { state.portion = v; },
    resetDone: () => { doneMap = {}; }
  };
`, ctx);

const E = ctx.E;

/* ---------------- micro test framework ---------------- */

const results = [];

function registerCase(name, fn) {
  const t0 = process.hrtime.bigint();
  const asserts = [];
  let status = 'PASS';
  let error = null;
  const a = (ok, label) => asserts.push({ ok: !!ok, label });
  try { fn(a); }
  catch (err) { status = 'ERROR'; error = err; }
  const ms = Number(process.hrtime.bigint() - t0) / 1e6;
  results.push({ name, status, asserts, error, ms });
}

function eq(actual, expected, label) {
  return (ok) => ok(
    JSON.stringify(actual) === JSON.stringify(expected),
    `${label || 'value'} → expected ${JSON.stringify(expected)}, got ${JSON.stringify(actual)}`
  );
}

/* ---------------- model / dom helpers ---------------- */

function build(dsl) {
  const doc = E.parseDSL(dsl);
  const models = doc.components.map((c) => E.buildComponent(c));
  const grids = models.map((m) => E.layoutComponent(m));
  const html = models.map((m, i) => E.tableHTML(m, i)).join('\n');
  return { doc, models, grids, html };
}

function findCell(model, kind, textIncludes) {
  for (const row of model.rows) {
    for (const cell of row.cells) {
      if (cell.kind === kind && String(cell.text).includes(textIncludes)) return cell;
    }
  }
  return null;
}

function countRe(html, re) { return (html.match(re) || []).length; }

/* ============================================================
   FIXTURES — 6 recipe topological archetypes
   ============================================================ */

const FIX = {};

// Case 1: Sequential linear stacking + colspan waterfall (late join)
FIX.linear = `Title: QA Asparagus
- asparagus
- butter
- almonds
> melt
> brown
> add
- cayenne pepper
> saute until tender`;

// Case 2: Symmetrical parallel fork-and-join
FIX.fork = `Title: QA Fork Join
[Base A]
- item a1
- item a2
> heat a

[Base B]
- item b1
- item b2
- item b3
> heat b

[Join]
> combine all (Base A, Base B)`;

// Case 3: Asymmetric multi-track (3 tracks, different heights, 2 sub-actions downstream)
FIX.asym = `Title: QA Asymmetric
[T1]
- t one a
- t one b
> cook t1

[T2]
- t two a
> cook t2

[T3]
- t three a
- t three b
- t three c
> (wait)

[Final]
> merge all (T1, T2, T3)
- finisher element
> plate`;

// Case 4: Top + bottom hold-backs spanning past intermediate columns
FIX.holdback = `Title: QA Holdback
[Early]
- early item
> do early

[Held]
- held item
> (wait)
> (wait)
> do late

[Bottom]
- bottom item
> act bottom
> (wait)
- late bottom item
> final bottom`;

// Case 5: Modular sub-recipes
FIX.modular = `Title: QA Modular
## COMPONENT: Sauce
- sauce base
- sauce fat
> whisk sauce

## COMPONENT: Topping
- topping chip
> melt topping`;

// Case 6: Vertical text rule (reuses Case 1 topology + a short control)
FIX.vertical = FIX.linear;

/* ============================================================
   CASE 1 — Sequential Linear Stacking & Colspan Waterfalls
   ============================================================ */

registerCase('Case 1: Sequential Linear Stacking & Colspan Waterfalls', (ok) => {
  E.setPortion(1); E.resetDone();
  const { models, html } = build(FIX.linear);
  const m = models[0];

  // Matrix dimension integrity
  ok(m.totalCols === 5, `totalCols === 5 (got ${m.totalCols})`);

  // Late-joining ingredient: colspan = target_action_column - current_column
  const cayenne = findCell(m, 'ing', 'cayenne');
  ok(!!cayenne, 'late ingredient "cayenne pepper" exists in model');
  if (cayenne) {
    ok(cayenne._col === 0, `cayenne starts at column 0 (got ${cayenne._col})`);
    ok(cayenne.colspan === 4, `cayenne colspan = target action col (4) - current col (0) = 4 (got ${cayenne.colspan})`);
  }

  // Rowspan math: each merge equals its child ingredient row count
  eq(findCell(m, 'action', 'melt').rowspan, 3)(ok);
  eq(findCell(m, 'action', 'brown').rowspan, 3)(ok);
  eq(findCell(m, 'action', 'add').rowspan, 3)(ok);
  eq(findCell(m, 'action', 'saute').rowspan, 4)(ok);

  // Column adjacency: each action sits exactly one column right of its parent merge
  ok(findCell(m, 'action', 'melt')._col === 1, `melt at column 1 (got ${findCell(m, 'action', 'melt')._col})`);
  ok(findCell(m, 'action', 'brown')._col === 2, `brown at column 2 (got ${findCell(m, 'action', 'brown')._col})`);
  ok(findCell(m, 'action', 'add')._col === 3, `add at column 3 (got ${findCell(m, 'action', 'add')._col})`);
  ok(findCell(m, 'action', 'saute')._col === 4, `saute at column 4 (got ${findCell(m, 'action', 'saute')._col})`);

  // No empty placeholder cells in the rendered DOM
  ok(!html.includes('cf-empty'), 'no empty placeholder <td> elements in rendered table');
});

/* ============================================================
   CASE 2 — Symmetrical Parallel Fork-and-Join
   ============================================================ */

registerCase('Case 2: Symmetrical Parallel Fork-and-Join', (ok) => {
  E.setPortion(1); E.resetDone();
  const { models, html } = build(FIX.fork);
  const m = models[0];

  const combine = findCell(m, 'action', 'combine');
  ok(!!combine, '"combine all" merge cell exists');
  ok(combine.rowspan === 5, `combine rowspan = sum of child rows (2 + 3) = 5 (got ${combine.rowspan})`);
  ok(combine._col === 2, `combine sits at column 2, flush after both branches (got ${combine._col})`);

  eq(findCell(m, 'action', 'heat a').rowspan, 2)(ok);
  eq(findCell(m, 'action', 'heat b').rowspan, 3)(ok);

  // Matrix dimension integrity: both parallel tracks terminate at the same column depth
  ok(findCell(m, 'action', 'heat a')._col === findCell(m, 'action', 'heat b')._col,
    `parallel tracks align: heat a col ${findCell(m, 'action', 'heat a')._col} === heat b col ${findCell(m, 'action', 'heat b')._col}`);
  ok(m.totalCols === 3, `totalCols === 3 (got ${m.totalCols})`);

  // Rowspan coverage: merge spans contiguous rows from first branch top to last branch bottom
  const firstRow = m.rows.findIndex((r) => r.cells.includes(combine));
  ok(firstRow === 0, `merge anchored at top row of first branch (row 0, got ${firstRow})`);
  ok(!html.includes('cf-empty'), 'no empty placeholder <td> elements');
});

/* ============================================================
   CASE 3 — Asymmetric Multi-Track (3 tracks, 2 downstream actions)
   ============================================================ */

registerCase('Case 3: Asymmetric Multi-Track Merge', (ok) => {
  E.setPortion(1); E.resetDone();
  const { models, html } = build(FIX.asym);
  const m = models[0];

  const merge = findCell(m, 'action', 'merge all');
  const plate = findCell(m, 'action', 'plate');
  ok(!!merge && !!plate, 'both downstream sub-actions exist');

  // Rowspan math: 2 + 1 + 3 child ingredient rows
  ok(merge.rowspan === 6, `merge rowspan = 2 + 1 + 3 = 6 (got ${merge.rowspan})`);
  ok(plate.rowspan === 7, `plate rowspan = 6 merged + 1 finisher = 7 (got ${plate.rowspan})`);

  // Asymmetric hold-back track (T3, no action) must stretch flush to the merge column
  const t3 = findCell(m, 'ing', 't three a');
  ok(t3.colspan === 2, `T3 (waiting track) ingredients stretch colspan 2 to reach merge column (got ${t3.colspan})`);

  // Late finisher ingredient joins flush against "plate"
  const finisher = findCell(m, 'ing', 'finisher');
  ok(finisher.colspan === 3, `finisher colspan = 3, flush against plate column (got ${finisher.colspan})`);

  // Matrix dimension integrity
  ok(m.totalCols === 4, `totalCols === 4 (got ${m.totalCols})`);
  ok(merge._col === 2, `merge at column 2 (got ${merge._col})`);
  ok(plate._col === 3, `plate at column 3 (got ${plate._col})`);
  ok(!html.includes('cf-empty'), 'no empty placeholder <td> elements');
});

/* ============================================================
   CASE 4 — Top and Bottom Hold-Backs
   ============================================================ */

registerCase('Case 4: Top and Bottom Hold-Backs', (ok) => {
  E.setPortion(1); E.resetDone();
  const { models, html } = build(FIX.holdback);
  const m = models[0];

  // Top hold-back: two waits push "do late" past the intermediate column occupied by "do early"
  const doLate = findCell(m, 'action', 'do late');
  const doEarly = findCell(m, 'action', 'do early');
  ok(doEarly._col === 1, `do early at column 1 (got ${doEarly._col})`);
  ok(doLate._col === 2, `do late skipped intermediate column → column 2 (got ${doLate._col})`);
  const held = findCell(m, 'ing', 'held item');
  ok(held.colspan === 2, `held ingredient stretches colspan 2 across the held columns (got ${held.colspan})`);

  // Bottom hold-back: wait AFTER an action widens the acted cell, late joiner stays flush
  const preLayout = E.buildComponent(E.parseDSL(FIX.holdback).components[0]);
  const actBottomPre = findCell(preLayout, 'action', 'act bottom');
  ok(actBottomPre.colspan === 2, `post-action wait widens "act bottom" colspan to 2 in DAG model (got ${actBottomPre.colspan})`);
  const actBottom = findCell(m, 'action', 'act bottom');
  ok(actBottom.colspan >= 2, `"act bottom" retains widened colspan in DOM, edge-stretched to ${actBottom.colspan}`);
  const lateBottom = findCell(m, 'ing', 'late bottom item');
  ok(lateBottom.colspan === 3, `late bottom ingredient colspan 3, flush against final column (got ${lateBottom.colspan})`);
  const finalBottom = findCell(m, 'action', 'final bottom');
  ok(finalBottom._col === 3, `final bottom action at column 3 (got ${finalBottom._col})`);

  // Matrix dimension integrity
  ok(m.totalCols === 4, `totalCols === 4 (got ${m.totalCols})`);
  ok(!html.includes('cf-empty'), 'no empty placeholder <td> elements');
});

/* ============================================================
   CASE 5 — Modular Sub-Recipes
   ============================================================ */

registerCase('Case 5: Modular Sub-Recipes (## COMPONENT)', (ok) => {
  E.setPortion(1); E.resetDone();
  const { doc, models, html } = build(FIX.modular);

  ok(doc.components.length === 2, `two distinct components parsed (got ${doc.components.length})`);
  ok(doc.components[0].name === 'Sauce', `component 1 named "Sauce" (got "${doc.components[0].name}")`);
  ok(doc.components[1].name === 'Topping', `component 2 named "Topping" (got "${doc.components[1].name}")`);

  // Each component is an independent table DOM element with its own isolated column depth
  const tables = countRe(html, /<table class="cf-table">/g);
  ok(tables === 2, `rendered DOM contains 2 distinct <table> elements (got ${tables})`);
  ok(models[0].totalCols === 2, `Sauce table has independent column depth 2 (got ${models[0].totalCols})`);
  ok(models[1].totalCols === 2, `Topping table has independent column depth 2 (got ${models[1].totalCols})`);
  ok(!html.includes('cf-empty'), 'no empty placeholder <td> elements');
});

/* ============================================================
   CASE 6 — Vertical Text Rule (rowspan >= 3)
   ============================================================ */

registerCase('Case 6: Vertical Text Rule (rowspan >= 3)', (ok) => {
  E.setPortion(1); E.resetDone();
  const { models, html } = build(FIX.vertical);
  const m = models[0];

  // melt / brown / add have rowspan 3 → vert; saute rowspan 4 → vert
  const vertCount = countRe(html, /class="[^"]*\bvert\b[^"]*"/g);
  ok(vertCount === 4, `exactly 4 action cells carry the vert class (got ${vertCount})`);

  ['melt', 'brown', 'add', 'saute'].forEach((t) => {
    const td = html.match(new RegExp('<td class="([^"]*)"[^>]*>[^<]*' + t));
    ok(!!td && /\bvert\b/.test(td[1]), `"${t}" cell has vert class`);
  });

  // Control: rowspan 2 cells must NOT be vertical (fork fixture)
  const { html: forkHtml } = build(FIX.fork);
  const heatA = forkHtml.match(/<td class="([^"]*)"[^>]*>[^<]*heat a/);
  ok(!!heatA && !/\bvert\b/.test(heatA[1]), 'control: rowspan 2 cell ("heat a") has no vert class');

  // CSS backing exists in styles.css
  const css = fs.readFileSync(path.join(__dirname, 'styles.css'), 'utf8');
  ok(/td\.vert\s*{[^}]*writing-mode:\s*vertical-rl/.test(css), 'styles.css defines td.vert { writing-mode: vertical-rl }');
  ok(/td\.vert\s*{[^}]*rotate\(180deg\)/.test(css), 'styles.css defines td.vert { transform: rotate(180deg) }');
});

/* ============================================================
   EXTRA — Utility assertions (scaler precision, grocery math)
   ============================================================ */

registerCase('Extra: Portion Scaler Floating-Point Precision', (ok) => {
  E.setPortion(1);
  ok(E.scaleText('1.5 tsp', 2) === '3 tsp', `1.5 tsp × 2 → "3 tsp" (got "${E.scaleText('1.5 tsp', 2)}")`);
  ok(E.scaleText('0.5 tsp', 2) === '1 tsp', `0.5 tsp × 2 → "1 tsp", not artifact (got "${E.scaleText('0.5 tsp', 2)}")`);
  ok(!E.scaleText('0.1 g', 3).includes('000000'), `0.1 g × 3 clean → "${E.scaleText('0.1 g', 3)}"`);
  ok(E.scaleText('0.3 g', 3) === '0.9 g', `0.3 g × 3 → "0.9 g" (got "${E.scaleText('0.3 g', 3)}")`);
  ok(E.scaleText('1/3 tsp', 3) === '1 tsp', `1/3 tsp × 3 → "1 tsp" exact fraction math (got "${E.scaleText('1/3 tsp', 3)}")`);
  ok(E.scaleText('2-1/2 g', 2) === '5 g', `2-1/2 g × 2 → "5 g" mixed number (got "${E.scaleText('2-1/2 g', 2)}")`);

  // End-to-end: portion change flows into rendered ingredient cells
  E.setPortion(2);
  const { html } = build('Title: T\n- 1.5 tsp vanilla');
  E.setPortion(1);
  ok(html.includes('3 tsp'), 'rendered DOM reflects scaled quantity (3 tsp at 2×)');
});

registerCase('Extra: Grocery Consolidation Across Components', (ok) => {
  E.setPortion(1);
  const list = E.buildShoppingList(E.parseDSL(`Title: QA Grocery
## COMPONENT: A
- 100 g flour
- 50 g sugar
> mix

## COMPONENT: B
- 150 g flour
- 1 tsp salt
> whisk`));
  const flour = list.find((i) => i.name === 'flour');
  ok(!!flour, 'flour entry exists');
  ok(flour && flour.qty === 250, `100 g + 150 g flour consolidate to 250 g (got ${flour && flour.qty} g)`);
  ok(list.length === 3, `3 unique line items (flour, sugar, salt) (got ${list.length})`);

  // Fractional consolidation: 1/2 tsp + 1/4 tsp = 3/4 tsp (no float drift)
  const list2 = E.buildShoppingList(E.parseDSL('Title: Q\n- 1/2 tsp salt\n- 1/4 tsp salt\n> x'));
  const salt = list2.find((i) => i.name === 'salt');
  ok(salt && fmt(salt.qty) === '3/4', `1/2 + 1/4 tsp salt → 3/4 tsp (got ${salt && fmt(salt.qty)})`);
  function fmt(v) { return E.fmtQty(v); }
});

/* ---------------- report ---------------- */

const line = '\u2550'.repeat(74);
const thin = '\u2500'.repeat(74);
let totalAsserts = 0, passedAsserts = 0;

console.log('\n' + line);
console.log('  MATRIX KITCHEN \u2014 QA DIAGNOSTIC REPORT (DAG Table Engine)');
console.log('  Target: script.js  |  Runner: test_suite.js  |  Node ' + process.version);
console.log(line);

for (const r of results) {
  const icon = r.status === 'PASS' ? '\u2713 PASS' : '\u2717 FAIL';
  console.log(`\n[${icon}] ${r.name}  (${r.ms.toFixed(2)} ms)`);
  console.log(thin);
  for (const a of r.asserts) {
    totalAsserts++;
    if (a.ok) passedAsserts++;
    console.log(`   ${a.ok ? '\u2713' : '\u2717'} ${a.label}`);
  }
  if (r.error) {
    console.log(`   \u2717 TOPOLOGICAL GRAPH ERROR: ${r.error.message}`);
    if (r.error.stack) console.log(r.error.stack.split('\n').slice(1, 4).join('\n'));
  }
  const subPassed = r.asserts.filter((a) => a.ok).length;
  console.log(`   → ${subPassed}/${r.asserts.length} assertions passed`);
}

const failedCases = results.filter((r) => r.status !== 'PASS');
console.log('\n' + line);
console.log(`  SUMMARY: ${results.length - failedCases.length}/${results.length} cases passed | ` +
  `${passedAsserts}/${totalAsserts} assertions passed | ` +
  `total time ${results.reduce((s, r) => s + r.ms, 0).toFixed(2)} ms`);
console.log(line);

if (failedCases.length) {
  console.log('\n  MISMATCHED DOM / GRAPH ATTRIBUTES:');
  for (const r of failedCases) {
    console.log(`  • ${r.name}:`);
    r.asserts.filter((a) => !a.ok).forEach((a) => console.log(`     - ${a.label}`));
    if (r.error) console.log(`     - threw: ${r.error.message}`);
  }
  process.exit(1);
}
process.exit(0);
