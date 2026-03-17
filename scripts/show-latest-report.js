/**
 * Opens the latest Playwright HTML report in the browser (Playwright सारखा report).
 * Run after tests: npm run report
 */
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const reportsDir = path.join(process.cwd(), 'playwright-reports');
if (!fs.existsSync(reportsDir)) {
  console.error('No playwright-reports folder. Run tests first (npm run test).');
  process.exit(1);
}

const dirs = fs.readdirSync(reportsDir)
  .filter((f) => fs.statSync(path.join(reportsDir, f)).isDirectory() && f.startsWith('run-'))
  .sort()
  .reverse();

if (dirs.length === 0) {
  console.error('No run-* report folder found. Run tests first.');
  process.exit(1);
}

const latest = path.join(reportsDir, dirs[0]);
console.log('Opening report:', latest);
execSync(`npx playwright show-report "${latest}"`, { stdio: 'inherit' });
