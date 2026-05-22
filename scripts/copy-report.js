/**
 * Copies latest Playwright report to playwright-report/ so Jenkins can archive one path.
 * Run after tests in CI.
 */
const fs = require('fs');
const path = require('path');
const { getLatestRunFolderName } = require('./resolve-latest-run-report');

const reportsDir = path.join(process.cwd(), 'playwright-reports');
const outDir = path.join(process.cwd(), 'playwright-report');

if (!fs.existsSync(reportsDir)) process.exit(0);

const latestName = getLatestRunFolderName(reportsDir);
if (!latestName) process.exit(0);

const src = path.join(reportsDir, latestName);
if (fs.existsSync(outDir)) fs.rmSync(outDir, { recursive: true });
fs.mkdirSync(outDir, { recursive: true });
for (const name of fs.readdirSync(src)) {
  const s = path.join(src, name);
  const d = path.join(outDir, name);
  fs.cpSync(s, d, { recursive: true });
}
console.log('Report copied from playwright-reports/' + latestName + ' → playwright-report/');
