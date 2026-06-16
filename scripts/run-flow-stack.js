/**
 * Run a named flow stack (happy paths in dependency order).
 *
 *   node scripts/run-flow-stack.js --list
 *   node scripts/run-flow-stack.js prod --list
 *   node scripts/run-flow-stack.js prod order-full --project=chrome --headed
 *   node scripts/run-flow-stack.js qam smoke --workers=1
 *
 * Stacks are defined in config/flow-stacks.js
 */
const { spawnSync } = require('child_process');
const path = require('path');
const { flowsByTarget, stacksByTarget } = require('../config/flow-stacks');

const root = path.resolve(__dirname, '..');
const flowHappy = path.join(__dirname, 'run-flow-happy.js');

function printUsage() {
  console.log(`
Usage:
  node scripts/run-flow-stack.js --list
  node scripts/run-flow-stack.js <qam|prod> --list
  node scripts/run-flow-stack.js <qam|prod> <stack-name> [playwright args...]

npm shortcuts:
  npm run stack:list
  npm run stack:prod:order-full -- --project=chrome --headed
  npm run stack:qam:smoke -- --project=chrome
`);
}

function printStacks(targetFilter) {
  const targets = targetFilter ? [targetFilter] : Object.keys(stacksByTarget);

  for (const target of targets) {
    const stacks = stacksByTarget[target];
    const flows = flowsByTarget[target];
    if (!stacks) continue;

    console.log(`\n=== ${target.toUpperCase()} stacks ===\n`);
    for (const [name, stack] of Object.entries(stacks)) {
      console.log(`  ${name}`);
      console.log(`    ${stack.description}`);
      console.log('    Steps:');
      stack.steps.forEach((id, i) => {
        const flow = flows[id];
        const tags = [
          flow?.writesOrderRef ? 'writes order ref' : null,
          flow?.note ? flow.note : null,
        ]
          .filter(Boolean)
          .join('; ');
        console.log(`      ${i + 1}. ${id} — ${flow?.label ?? id}${tags ? ` (${tags})` : ''}`);
      });
      console.log('');
    }
  }
}

function parseArgs(argv) {
  const args = [...argv];

  if (args.includes('--list') || args.includes('-l')) {
    const target = args.find((a) => a === 'qam' || a === 'prod') ?? null;
    return { list: true, target };
  }

  let target = null;
  let stackName = null;
  const passthrough = [];

  if (args[0] && !args[0].startsWith('-')) {
    target = args.shift();
  }
  if (args[0] && !args[0].startsWith('-')) {
    stackName = args.shift();
  }

  while (args.length > 0) {
    passthrough.push(args.shift());
  }

  return { list: false, target, stackName, passthrough };
}

function runStep(target, flowId, index, total, passthrough) {
  const flow = flowsByTarget[target]?.[flowId];
  if (!flow) {
    console.error(`Unknown flow "${flowId}" for target "${target}".`);
    process.exit(1);
  }

  console.log(`\n[stack ${index}/${total}] ${flow.label} (${flowId})`);
  console.log(`  spec: ${flow.spec}`);
  if (flow.note) console.log(`  note: ${flow.note}`);
  if (flow.writesOrderRef) console.log('  → writes test-results/last-order-ref.txt on success');

  const r = spawnSync(process.execPath, [flowHappy, target, flow.spec, ...passthrough], {
    stdio: 'inherit',
    cwd: root,
  });

  if (r.status !== 0) {
    console.error(`\n[stack] Stopped — step ${index}/${total} failed: ${flowId}`);
    process.exit(r.status === null ? 1 : r.status);
  }
}

const parsed = parseArgs(process.argv.slice(2));

if (parsed.list) {
  if (parsed.target && !stacksByTarget[parsed.target]) {
    console.error(`Invalid target "${parsed.target}". Use: qam | prod`);
    process.exit(1);
  }
  printStacks(parsed.target);
  process.exit(0);
}

const { target, stackName, passthrough } = parsed;

if (!target || !stackName) {
  printUsage();
  process.exit(1);
}

if (!stacksByTarget[target]) {
  console.error(`Invalid target "${target}". Use: qam | prod`);
  process.exit(1);
}

const stack = stacksByTarget[target][stackName];
if (!stack) {
  console.error(`Unknown stack "${stackName}" for target "${target}".`);
  console.error(`Run: node scripts/run-flow-stack.js ${target} --list`);
  process.exit(1);
}

console.log(`[flow-stack] target=${target} stack=${stackName}`);
console.log(`[flow-stack] ${stack.description}`);
console.log(`[flow-stack] ${stack.steps.length} step(s) — happy path only, stops on first failure`);

const total = stack.steps.length;
stack.steps.forEach((flowId, i) => runStep(target, flowId, i + 1, total, passthrough));

console.log(`\n[flow-stack] Done — ${stackName} (${target}) all ${total} step(s) passed.`);
process.exit(0);
