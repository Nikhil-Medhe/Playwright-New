/**
 * Opens the latest Playwright HTML report in the browser.
 * Run after tests: npm run report
 */
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const { getLatestRunFolderName } = require('./resolve-latest-run-report');

const reportsDir = path.join(process.cwd(), 'playwright-reports');
if (!fs.existsSync(reportsDir)) {
  console.error('No playwright-reports folder. Run tests first (npm run test).');
  process.exit(1);
}

const latestName = getLatestRunFolderName(reportsDir);
if (!latestName) {
  console.error('No run-* report folder found. Run tests first.');
  process.exit(1);
}

const latest = path.join(reportsDir, latestName);
console.log('Opening report:', latest);
execSync(`npx playwright show-report "${latest}"`, { stdio: 'inherit' });
