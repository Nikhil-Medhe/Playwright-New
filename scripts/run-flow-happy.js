/**
 * Run a spec's happy-path flow only (no negative tests).
 * Pass `--all` to run every test in the spec (regression).
 *
 *   node scripts/run-flow-happy.js qam tests/qam/orderManager.spec.ts --headed
 *   node scripts/run-flow-happy.js prod tests/automationqa-prod/testVersion.spec.ts --all
 */
const { spawnSync } = require('child_process');
const path = require('path');

const argv = process.argv.slice(2);
if (argv.length < 2) {
  console.error('Usage: node scripts/run-flow-happy.js <target> <spec> [playwright args...]');
  console.error('  Add --all to run negatives + happy paths.');
  process.exit(1);
}

const target = argv[0];
const spec = argv[1];
let passthrough = argv.slice(2);

const runAll = passthrough.includes('--all');
if (runAll) {
  passthrough = passthrough.filter((a) => a !== '--all');
}

const hasGrep = passthrough.some((a) => a === '--grep' || a.startsWith('--grep'));
if (!hasGrep && !runAll) {
  // Single argv token — avoids cmd.exe splitting `happy` and `path` on Jenkins/Windows.
  passthrough = ['--grep=happy path', ...passthrough];
}

const root = path.resolve(__dirname, '..');
const runner = path.join(__dirname, 'run-tests-by-target.js');
const args = [runner, target, spec, ...passthrough];

const r = spawnSync(process.execPath, args, { stdio: 'inherit', cwd: root });
process.exit(r.status === null ? 1 : r.status);
