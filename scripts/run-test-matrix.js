/**
 * Excel-friendly test matrix: edit Data/test-matrix.csv (run=Y/N), then:
 *   npm run test:matrix
 *
 * Output: test-results/test-matrix-<timestamp>.csv (test_id, Pass/Fail, duration, notes)
 * Override sheet path: MATRIX_CSV=Data/my-matrix.csv npm run test:matrix
 */
const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');

function parseCSVLine(line) {
  const out = [];
  let cur = '';
  let inQ = false;
  for (let i = 0; i < line.length; i++) {
    const c = line[i];
    if (c === '"') {
      if (inQ && line[i + 1] === '"') {
        cur += '"';
        i++;
        continue;
      }
      inQ = !inQ;
      continue;
    }
    if (!inQ && c === ',') {
      out.push(cur.trim());
      cur = '';
      continue;
    }
    cur += c;
  }
  out.push(cur.trim());
  return out;
}

function parseCSV(text) {
  const lines = text
    .replace(/^\uFEFF/, '')
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean);
  if (lines.length < 2) return { headers: [], rows: [] };
  const headers = parseCSVLine(lines[0]).map((h) => h.toLowerCase());
  const rows = [];
  for (let i = 1; i < lines.length; i++) {
    const cols = parseCSVLine(lines[i]);
    const row = {};
    headers.forEach((h, j) => {
      row[h] = cols[j] ?? '';
    });
    rows.push(row);
  }
  return { headers, rows };
}

const pad = (n) => n.toString().padStart(2, '0');
const now = new Date();
const stamp = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}_${pad(now.getHours())}-${pad(now.getMinutes())}-${pad(now.getSeconds())}`;

const matrixPath = path.resolve(process.cwd(), process.env.MATRIX_CSV || 'Data/test-matrix.csv');
if (!fs.existsSync(matrixPath)) {
  console.error('Matrix file not found:', matrixPath);
  process.exit(1);
}

const raw = fs.readFileSync(matrixPath, 'utf8');
const { rows } = parseCSV(raw);

const outDir = path.join(process.cwd(), 'test-results');
if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });
const outCsv = path.join(outDir, `test-matrix-${stamp}.csv`);

const resultLines = [['test_id', 'spec_file', 'grep_title', 'status', 'exit_code', 'duration_ms', 'flow_notes'].join(',')];

function csvEscape(s) {
  if (s == null) return '';
  const t = String(s);
  if (/[",\r\n]/.test(t)) return `"${t.replace(/"/g, '""')}"`;
  return t;
}

for (const row of rows) {
  const run = (row.run || '').toUpperCase();
  if (run !== 'Y' && run !== 'YES' && run !== '1') continue;

  const testId = row.test_id || row['test id'] || 'unnamed';
  const specFile = row.spec_file || row.spec || '';
  const grepTitle = (row.grep_title || row.grep || '').trim();
  const notes = row.flow_notes || row.notes || '';

  if (!specFile) {
    resultLines.push([testId, '', '', 'Skipped', '', '', csvEscape('missing spec_file')].join(','));
    continue;
  }

  const specPath = path.resolve(process.cwd(), specFile);
  if (!fs.existsSync(specPath)) {
    resultLines.push([csvEscape(testId), csvEscape(specFile), csvEscape(grepTitle), 'Skipped', '127', '', csvEscape('file not found')].join(','));
    console.warn('Skip (missing file):', specPath);
    continue;
  }

  const spawnArgs = ['scripts/run-tests-with-id.js', specFile];
  if (grepTitle) spawnArgs.push('--grep', grepTitle);

  const t0 = Date.now();
  const r = spawnSync('node', spawnArgs, {
    stdio: 'inherit',
    env: process.env,
    cwd: process.cwd(),
    windowsHide: true,
  });
  const exitCode = r.status === null ? 1 : r.status;
  const ms = Date.now() - t0;
  const status = exitCode === 0 ? 'Pass' : 'Fail';
  resultLines.push(
    [
      csvEscape(testId),
      csvEscape(specFile),
      csvEscape(grepTitle),
      status,
      String(exitCode),
      String(ms),
      csvEscape(notes),
    ].join(','),
  );
  console.log(`[${status}] ${testId}  (${ms}ms)`);
}

fs.writeFileSync(outCsv, resultLines.join('\n'), 'utf8');
console.log('\nMatrix results written to:', outCsv);
