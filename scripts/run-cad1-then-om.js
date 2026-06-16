/**
 * CAD / Test Version checkout → Order Manager (happy path only).
 *
 *   npm run test:cad1-then-om -- --project=chrome
 *   npm run test:prod:cad1-then-om -- --headed
 */
const { spawnSync } = require('child_process');
const path = require('path');

const isProd = process.argv.includes('--prod');
const passthrough = process.argv.filter((a) => a !== '--prod');

const root = path.resolve(__dirname, '..');
const flowHappy = path.join(__dirname, 'run-flow-happy.js');

const target = isProd ? 'prod' : 'qam';
const cadSpec = isProd
  ? 'tests/automationqa-prod/testVersion.spec.ts'
  : 'tests/qam/cadSiteVersion1.spec.ts';
const omSpec = isProd ? 'tests/automationqa-prod/orderManager.spec.ts' : 'tests/qam/orderManager.spec.ts';

function run(spec) {
  const r = spawnSync(process.execPath, [flowHappy, target, spec, ...passthrough], {
    stdio: 'inherit',
    cwd: root,
  });
  if (r.status !== 0) process.exit(r.status === null ? 1 : r.status);
}

run(cadSpec);
run(omSpec);
process.exit(0);
