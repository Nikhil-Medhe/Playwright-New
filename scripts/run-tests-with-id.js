/**
 * Sets PLAYWRIGHT_RUN_ID with date and time in one folder name:
 * - test-results/run-2026-03-12-20-31-03/
 * - playwright-reports/run-2026-03-12-20-31-03/
 *
 * Uses shell + quoted argv so values with spaces (e.g. --grep "Cad Site Version") work on Windows.
 */
const now = new Date();
const pad = (n) => n.toString().padStart(2, '0');
const datePart = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
const timePart = `${pad(now.getHours())}-${pad(now.getMinutes())}-${pad(now.getSeconds())}`;
process.env.PLAYWRIGHT_RUN_ID = `run-${datePart}_${timePart}`;

const { execSync } = require('child_process');

/** Quote one argv token for cmd.exe / PowerShell when joined into one string. */
function shellEscape(arg) {
  const s = String(arg);
  if (process.platform === 'win32') {
    if (!/[\s"]/.test(s)) return s;
    return `"${s.replace(/"/g, '""')}"`;
  }
  if (!/[\s'"\\]/.test(s)) return s;
  return `'${s.replace(/'/g, `'\\''`)}'`;
}

const args = process.argv.slice(2);
const cmd = ['npx', 'playwright', 'test', ...args.map(shellEscape)].join(' ');
try {
  execSync(cmd, { stdio: 'inherit', env: process.env, cwd: process.cwd(), shell: true });
  process.exit(0);
} catch (e) {
  process.exit(typeof e.status === 'number' ? e.status : 1);
}
