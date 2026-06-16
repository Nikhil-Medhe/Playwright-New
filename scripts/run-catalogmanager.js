/**
 * Catalog Manager — QAM (nikhil) or prod (Automationqa).
 *
 *   npm run test:catalogmanager:qam -- --project=chrome
 *   npm run test:prod:catalogmanager -- --project=chrome
 */
const { execSync } = require('child_process');
const path = require('path');

const targetArg = process.argv[2];
const target = (targetArg && !targetArg.startsWith('-') ? targetArg : 'qam').trim().toLowerCase();
const passthrough =
  targetArg && !targetArg.startsWith('-') ? process.argv.slice(3) : process.argv.slice(2);

const specByTarget = {
  qam: 'tests/qam/Catalogmanager.spec.ts',
  prod: 'tests/automationqa-prod/catalogManager.spec.ts',
  navigator: 'tests/automationqa-prod/catalogManager.spec.ts',
};

if (!specByTarget[target]) {
  console.error(`Invalid target "${targetArg}". Use: qam | prod`);
  process.exit(1);
}

const runner = path.join(__dirname, 'run-flow-happy.js');
const envTarget = target === 'qam' ? 'qam' : 'prod';
const args = [runner, envTarget, specByTarget[target], ...passthrough];

execSync(`node ${args.map((a) => (/\s/.test(a) ? `"${a.replace(/"/g, '""')}"` : a)).join(' ')}`, {
  stdio: 'inherit',
  cwd: process.cwd(),
  shell: true,
});
