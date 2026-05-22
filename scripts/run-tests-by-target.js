/**
 * Run Playwright against a named environment target (qam/prod).
 *
 * Usage:
 *   node scripts/run-tests-by-target.js qam [playwright args...]
 *   node scripts/run-tests-by-target.js prod [playwright args...]
 *   node scripts/run-tests-by-target.js navigator [playwright args...]  — alias of prod (Thomas)
 *   node scripts/run-tests-by-target.js catnav [playwright args...]      — legacy tools.catnav.us (DNS/VPN must resolve)
 *   node scripts/run-tests-by-target.js thomas-stage [...]               — Thomas staging pub (nikhil.stage… + ?pcat=pvtcat flows)
 */
const path = require('path');
const { execSync } = require('child_process');
const { targetMap, writeLastRunContext } = require('./target-env');

const target = (process.argv[2] || '').trim().toLowerCase();
const passthroughArgs = process.argv.slice(3);
const rootDir = path.join(__dirname, '..');

if (!targetMap[target]) {
  console.error('Invalid target. Use: qam, prod, navigator, catnav, or thomas-stage');
  process.exit(1);
}

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

const cmd = ['node', 'scripts/run-tests-with-id.js', ...passthroughArgs.map(shellEscape)].join(' ');
const env = { ...process.env, ...targetMap[target] };
writeLastRunContext(env, rootDir);

console.log(
  `[target:${target}] ENV=${env.ENV} BASE_URL=${env.BASE_URL} PUB_CATALOG_URL=${env.PUB_CATALOG_URL}` +
    (env.WM_VERSIONS_PATH ? ` WM_VERSIONS_PATH=${env.WM_VERSIONS_PATH}` : ''),
);
console.log(
  '[run-tests-by-target] Playwright loads config/env from these vars — entire suite (all specs) uses them unless a test hardcodes a URL.',
);

try {
  execSync(cmd, { stdio: 'inherit', env, cwd: process.cwd(), shell: true });
  process.exit(0);
} catch (e) {
  process.exit(typeof e.status === 'number' ? e.status : 1);
}
