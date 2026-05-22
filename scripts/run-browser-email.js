/**
 * Run Playwright on one browser (chrome | edge | firefox), then email report.
 *
 * Usage:
 *   node scripts/run-browser-email.js qam chrome
 *   node scripts/run-browser-email.js prod edge
 *   node scripts/run-browser-email.js qam firefox tests/cadSiteVersion1.spec.ts
 *   node scripts/run-browser-email.js edge
 *   node scripts/run-browser-email.js qam --headed
 *
 * Browser from env (if omitted on CLI): BROWSER=edge or PLAYWRIGHT_PROJECT=firefox
 *
 * npm:
 *   npm run test:qam:email -- edge
 *   npm run test:prod:email -- firefox
 *   npm run test:cad1:email -- chrome
 */
const path = require('path');
const { execSync } = require('child_process');
const { getTargetEnv } = require('./target-env');
const rootDir = path.join(__dirname, '..');

const VALID_TARGETS = new Set(['qam', 'prod', 'navigator', 'catnav', 'thomas-stage']);
const VALID_BROWSERS = new Set(['chrome', 'edge', 'firefox']);

function shellEscape(arg) {
  const s = String(arg);
  if (process.platform === 'win32') {
    if (!/[\s"]/.test(s)) return s;
    return `"${s.replace(/"/g, '""')}"`;
  }
  if (!/[\s'"\\]/.test(s)) return s;
  return `'${s.replace(/'/g, `'\\''`)}'`;
}

function browserFromEnv() {
  const raw = (process.env.BROWSER || process.env.PLAYWRIGHT_PROJECT || '').trim().toLowerCase();
  return VALID_BROWSERS.has(raw) ? raw : 'chrome';
}

function parseArgs(argv) {
  const rest = [...argv];
  let target = null;
  let browser = null;

  if (rest[0] && VALID_TARGETS.has(rest[0].trim().toLowerCase())) {
    target = rest.shift().trim().toLowerCase();
  }
  if (rest[0] && VALID_BROWSERS.has(rest[0].trim().toLowerCase())) {
    browser = rest.shift().trim().toLowerCase();
  }

  if (!browser) browser = browserFromEnv();
  if (!VALID_BROWSERS.has(browser)) {
    console.error(`Invalid browser "${browser}". Use: chrome | edge | firefox`);
    process.exit(1);
  }

  return { target, browser, passthrough: rest };
}

const { target, browser, passthrough } = parseArgs(process.argv.slice(2));
const projectFlag = `--project=${browser}`;
const targetEnv = target ? getTargetEnv(target) : null;

const runnerArgs = target
  ? ['node', 'scripts/run-tests-by-target.js', target, projectFlag, ...passthrough]
  : ['node', 'scripts/run-tests-with-id.js', projectFlag, ...passthrough];

const testCmd = runnerArgs.map(shellEscape).join(' ');

console.log(`[run-browser-email] target=${target || '(from .env)'} browser=${browser}`);

let exitCode = 1;
try {
  execSync(testCmd, { stdio: 'inherit', cwd: process.cwd(), shell: true });
  exitCode = 0;
} catch (e) {
  exitCode = e.status ?? 1;
}

const result = exitCode === 0 ? 'pass' : 'fail';
execSync('node scripts/copy-report.js', { stdio: 'inherit', cwd: process.cwd() });
execSync('node scripts/zip-report.js', { stdio: 'inherit', cwd: process.cwd() });

console.log(`\n--- Sending result email (${browser}) ---`);
const emailEnv = { ...process.env, ...(targetEnv || {}) };
try {
  execSync(`node scripts/send-result-email.js ${result}`, {
    stdio: 'inherit',
    cwd: process.cwd(),
    env: emailEnv,
  });
} catch (e) {
  console.error('\n[Email step failed] Check .env has SMTP_USER, SMTP_PASS. Run: npm run email:test');
  if (e.status !== undefined) process.exit(e.status);
}

process.exit(exitCode);
