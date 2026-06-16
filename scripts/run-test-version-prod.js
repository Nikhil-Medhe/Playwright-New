/**
 * Test Version — Automationqa PROD (`tests/automationqa-prod/testVersion.spec.ts`).
 * QAM equivalent: `npm run test:cad1` → `cadSiteVersion1.spec.ts`.
 *
 *   npm run test:prod:cad1 -- --project=chrome
 *   npm run test:prod:cad1 -- --headed
 */
const { spawnSync } = require('child_process');
const path = require('path');

const passthrough = process.argv.slice(2);

const root = path.resolve(__dirname, '..');
const runner = path.join(__dirname, 'run-flow-happy.js');
const args = [runner, 'prod', 'tests/automationqa-prod/testVersion.spec.ts', ...passthrough];

const r = spawnSync(process.execPath, args, { stdio: 'inherit', cwd: root });
process.exit(r.status === null ? 1 : r.status);
