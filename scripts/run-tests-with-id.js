/**
 * Sets PLAYWRIGHT_RUN_ID with date and time in one folder name:
 * - test-results/run-2026-03-12-20-31-03/
 * - playwright-reports/run-2026-03-12-20-31-03/
 */
const now = new Date();
const pad = (n) => n.toString().padStart(2, '0');
const datePart = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
const timePart = `${pad(now.getHours())}-${pad(now.getMinutes())}-${pad(now.getSeconds())}`;
process.env.PLAYWRIGHT_RUN_ID = `run-${datePart}_${timePart}`;

const { execSync } = require('child_process');
const args = process.argv.slice(2);
const cmd = ['npx', 'playwright', 'test', ...args].join(' ');
execSync(cmd, { stdio: 'inherit', env: process.env });
