import { readFileSync, writeFileSync, existsSync } from 'fs';

const INPUT = '.reassure/output.json';
const OUTPUT = '.reassure/output-compact.md';

if (!existsSync(INPUT)) {
  process.exit(0);
}

const data = JSON.parse(readFileSync(INPUT, 'utf8'));

const { significant = [], meaningless = [], added = [], removed = [] } = data;

const regressions = significant.filter(e => e.relativeDurationDiff > 0);
const improvements = significant.filter(e => e.relativeDurationDiff < 0);

const fmt = ms => `${ms.toFixed(1)} ms`;
const pct = rel => `${rel >= 0 ? '+' : ''}${(rel * 100).toFixed(1)}%`;
const indicator = rel => (rel > 0 ? '🔴' : '🟢');

const componentOf = name => name.split(' Performance ')[0];

function groupByComponent(entries) {
  const map = new Map();
  for (const entry of entries) {
    const comp = componentOf(entry.name);
    if (!map.has(comp)) map.set(comp, []);
    map.get(comp).push(entry);
  }
  return map;
}

function regressionTable(entries) {
  if (entries.length === 0) return '_No regressions — all clear ✅_\n';
  let t = '| Test | Baseline | Current | Δ% |\n';
  t += '|------|----------|---------|----|\n';
  for (const e of entries) {
    t += `| ${e.name} | ${fmt(e.baseline.meanDuration)} | ${fmt(e.current.meanDuration)} | 🔴 ${pct(e.relativeDurationDiff)} |\n`;
  }
  return t;
}

function improvementSummaryTable(groups) {
  let t = '| Component | Tests | Avg Δ% | Worst | Best |\n';
  t += '|-----------|-------|--------|-------|------|\n';
  for (const [comp, entries] of groups) {
    const avg = entries.reduce((s, e) => s + e.relativeDurationDiff, 0) / entries.length;
    const worst = Math.max(...entries.map(e => e.relativeDurationDiff));
    const best = Math.min(...entries.map(e => e.relativeDurationDiff));
    t += `| ${comp} | ${entries.length} | ${pct(avg)} | ${pct(worst)} | ${pct(best)} |\n`;
  }
  return t;
}

function improvementFullList(groups) {
  let t = '| Test | Baseline | Current | Δ% |\n';
  t += '|------|----------|---------|----|\n';
  for (const [, entries] of groups) {
    for (const e of entries) {
      t += `| ${e.name} | ${fmt(e.baseline.meanDuration)} | ${fmt(e.current.meanDuration)} | 🟢 ${pct(e.relativeDurationDiff)} |\n`;
    }
  }
  return t;
}

const regIcon = regressions.length > 0 ? '🔴' : '🟢';
let md = `## Reassure — ${regIcon} ${regressions.length} regressions · 🟢 ${improvements.length} improvements · ${added.length} added · ${removed.length} removed\n\n`;

md += `### ${regressions.length > 0 ? '🔴' : '🟢'} Regressions (${regressions.length})\n\n`;
md += regressionTable(regressions);
md += '\n';

if (improvements.length > 0) {
  const groups = groupByComponent(improvements);
  md += `### 🟢 Improvements (${improvements.length} tests across ${groups.size} components)\n\n`;
  md += improvementSummaryTable(groups);
  md += '\n';
  md += `<details><summary>Full improvement list (${improvements.length})</summary>\n\n`;
  md += improvementFullList(groups);
  md += '\n</details>\n\n';
}

if (meaningless.length > 0) {
  const groups = groupByComponent(meaningless);
  md += `<details><summary>Meaningless changes (${meaningless.length} tests across ${groups.size} components)</summary>\n\n`;
  const entries = [...groups.values()].flat();
  let t = '| Test | Baseline | Current | Δ% |\n';
  t += '|------|----------|---------|----|\n';
  for (const e of entries) {
    t += `| ${e.name} | ${fmt(e.baseline.meanDuration)} | ${fmt(e.current.meanDuration)} | ${indicator(e.relativeDurationDiff)} ${pct(e.relativeDurationDiff)} |\n`;
  }
  md += t;
  md += '\n</details>\n';
}

writeFileSync(OUTPUT, md);
