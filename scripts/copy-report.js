/**
 * Copies latest Playwright report to playwright-report/ so Jenkins can archive one path.
 * Run after tests in CI.
 */
const fs = require('fs');
const path = require('path');

const reportsDir = path.join(process.cwd(), 'playwright-reports');
const outDir = path.join(process.cwd(), 'playwright-report');

if (!fs.existsSync(reportsDir)) process.exit(0);

const dirs = fs.readdirSync(reportsDir)
  .filter((f) => fs.statSync(path.join(reportsDir, f)).isDirectory() && f.startsWith('run-'))
  .sort()
  .reverse();

if (dirs.length === 0) process.exit(0);

const src = path.join(reportsDir, dirs[0]);
if (fs.existsSync(outDir)) fs.rmSync(outDir, { recursive: true });
fs.mkdirSync(outDir, { recursive: true });
for (const name of fs.readdirSync(src)) {
  const s = path.join(src, name);
  const d = path.join(outDir, name);
  fs.cpSync(s, d, { recursive: true });
}
console.log('Report copied to playwright-report/');
