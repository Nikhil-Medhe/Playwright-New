/**
 * Catalog Manager — prod or QAM only (sets BASE_URL before Playwright starts).
 *
 *   node scripts/run-catalogmanager.js prod [playwright args...]
 *   node scripts/run-catalogmanager.js qam [playwright args...]
 *
 *   npm run test:catalogmanager:prod -- --project=chrome
 *   npm run test:catalogmanager:qam -- --project=chrome
 */
const { execSync } = require('child_process');
const path = require('path');

const targetArg = process.argv[2];
const target = (targetArg && !targetArg.startsWith('-') ? targetArg : 'prod').trim().toLowerCase();
const passthrough =
  targetArg && !targetArg.startsWith('-') ? process.argv.slice(3) : process.argv.slice(2);

const valid = new Set(['qam', 'prod', 'navigator']);
if (!valid.has(target)) {
  console.error(`Invalid target "${targetArg}". Use: qam | prod | navigator`);
  process.exit(1);
}

const runner = path.join(__dirname, 'run-tests-by-target.js');
const args = [runner, target, 'tests/Catalogmanager.spec.ts', ...passthrough];

execSync(`node ${args.map((a) => (/\s/.test(a) ? `"${a.replace(/"/g, '""')}"` : a)).join(' ')}`, {
  stdio: 'inherit',
  cwd: process.cwd(),
  shell: true,
});
