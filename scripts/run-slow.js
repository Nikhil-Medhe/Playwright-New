/**
 * Runs Playwright tests in headed mode with slowMo=500ms so you can see each step.
 * Sets PLAYWRIGHT_RUN_ID so this run gets its own folder (no override).
 */
process.env.SLOW_MO = process.env.SLOW_MO || '500';
const now = new Date();
const pad = (n) => n.toString().padStart(2, '0');
const datePart = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
const timePart = `${pad(now.getHours())}-${pad(now.getMinutes())}-${pad(now.getSeconds())}`;
process.env.PLAYWRIGHT_RUN_ID = `run-${datePart}_${timePart}`;
const { execSync } = require('child_process');
const args = process.argv.slice(2);
execSync(
  ['npx', 'playwright', 'test', '--headed', ...args].join(' '),
  { stdio: 'inherit', env: process.env }
);
