/**
 * CAD Site Version 1 — one entrypoint; target picks QAM vs prod stacks.
 *
 * Usage:
 *   node scripts/run-cad-site-version1.js qam [playwright args...]
 *   node scripts/run-cad-site-version1.js prod [playwright args...]
 *   node scripts/run-cad-site-version1.js navigator [playwright args...]
 *
 * npm:
 *   npm run test:cad1 -- qam
 *   npm run test:cad1 -- prod --project=edge
 *   npm run test:cad1:email -- firefox
 *   npm run test:cad1 -- navigator --headed
 *   npm run test:cad1 -- catnav   — legacy CatNav hostname tools.catnav.us (VPN/DNS)
 *
 * Default target if omitted: qam
 */
const { spawnSync } = require('child_process');
const path = require('path');

const targetArg = process.argv[2];
const target = (targetArg && !targetArg.startsWith('-') ? targetArg : 'qam').trim().toLowerCase();
const passthrough =
  targetArg && !targetArg.startsWith('-') ? process.argv.slice(3) : process.argv.slice(2);

const valid = new Set(['qam', 'prod', 'navigator', 'catnav', 'thomas-stage']);
if (!valid.has(target)) {
  console.error(`Invalid target "${targetArg}". Use: qam | prod | navigator | catnav | thomas-stage`);
  process.exit(1);
}

const root = path.resolve(__dirname, '..');
const runner = path.join(__dirname, 'run-tests-by-target.js');
const args = [runner, target, 'tests/cadSiteVersion1.spec.ts', ...passthrough];

const r = spawnSync(process.execPath, args, { stdio: 'inherit', cwd: root });
process.exit(r.status === null ? 1 : r.status);
