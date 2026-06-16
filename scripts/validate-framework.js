/**
 * Framework sanity check — no browser required.
 *   npm run validate
 */
const fs = require('fs');
const path = require('path');
const { flowsByTarget, stacksByTarget } = require('../config/flow-stacks');

const root = process.cwd();
let errors = 0;

function fail(msg) {
  console.error(`  ✗ ${msg}`);
  errors += 1;
}
function ok(msg) {
  console.log(`  ✓ ${msg}`);
}

console.log('\n[validate] Playwright framework checks\n');

// Active suites only
const qamSpecs = fs.readdirSync(path.join(root, 'tests/qam')).filter((f) => f.endsWith('.spec.ts'));
const prodSpecs = fs.readdirSync(path.join(root, 'tests/automationqa-prod')).filter((f) => f.endsWith('.spec.ts'));
ok(`QAM specs: ${qamSpecs.length} | PROD specs: ${prodSpecs.length}`);

for (const target of ['qam', 'prod']) {
  const cred =
    target === 'prod' ? 'Data/automationqa-credentials.json' : 'Data/credentials.json';
  if (fs.existsSync(path.join(root, cred))) ok(`${target} credentials: ${cred}`);
  else if (process.env.CI) console.log(`  ⚠ ${target} credentials not on agent (expected in CI): ${cred}`);
  else fail(`${target} credentials missing: ${cred}`);
}

for (const target of Object.keys(flowsByTarget)) {
  for (const [id, flow] of Object.entries(flowsByTarget[target])) {
    if (!fs.existsSync(path.join(root, flow.spec))) {
      fail(`flow ${target}/${id}: missing ${flow.spec}`);
    }
  }
}
ok('flow-stacks.js: all flow specs exist');

for (const target of Object.keys(stacksByTarget)) {
  for (const [name, stack] of Object.entries(stacksByTarget[target])) {
    for (const step of stack.steps) {
      if (!flowsByTarget[target][step]) fail(`stack ${target}/${name}: unknown step "${step}"`);
    }
  }
}
ok('flow-stacks.js: all stack steps resolve');

const legacyRoot = fs
  .readdirSync(path.join(root, 'tests'))
  .filter((f) => f.endsWith('.spec.ts'));
if (legacyRoot.length > 0) {
  console.log(`  ⚠ legacy root specs ignored by config (${legacyRoot.length}): ${legacyRoot.slice(0, 3).join(', ')}…`);
} else {
  ok('no legacy root specs');
}

console.log(errors === 0 ? '\n[validate] OK\n' : `\n[validate] FAILED (${errors} issue(s))\n`);
process.exit(errors === 0 ? 0 : 1);
