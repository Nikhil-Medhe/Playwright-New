/**
 * Runs tests, then emails pass/fail and attaches the report zip.
 * Use: node scripts/run-tests-and-email.js [test-script]
 * Example: node scripts/run-tests-and-email.js          → npm run test
 *          node scripts/run-tests-and-email.js test:order  → npm run test:order
 */
const { execSync } = require('child_process');
const path = require('path');
const { readLastRunContext } = require('./target-env');

const rootDir = path.join(__dirname, '..');
const testScript = process.argv[2] || 'test';

// Run actual test command (no npm run to avoid recursion when test/test:order point here)
const testCmd = testScript === 'test'
  ? 'node scripts/run-tests-with-id.js'
  : testScript === 'test:order'
    ? 'node scripts/run-tests-by-target.js qam tests/qam/OrderSubmission.spec.ts'
    : `npm run ${testScript}`;

let exitCode = 1;
try {
  execSync(testCmd, { stdio: 'inherit', cwd: process.cwd() });
  exitCode = 0;
} catch (e) {
  exitCode = e.status ?? 1;
}

const result = exitCode === 0 ? 'pass' : 'fail';
execSync('node scripts/copy-report.js', { stdio: 'inherit', cwd: process.cwd() });
execSync('node scripts/zip-report.js', { stdio: 'inherit', cwd: process.cwd() });

console.log('\n--- Sending result email ---');
const saved = readLastRunContext(rootDir);
const emailEnv = { ...process.env, ...(saved || {}) };
try {
  execSync(`node scripts/send-result-email.js ${result}`, {
    stdio: 'inherit',
    cwd: process.cwd(),
    env: emailEnv,
  });
} catch (e) {
  console.error('\n[Email step failed] Check .env has SMTP_USER, SMTP_PASS (Gmail: App Password). Run: npm run email:test');
  if (e.status !== undefined) process.exit(e.status);
}

process.exit(exitCode);
