/**
 * Tests चालवतो आणि निकाल (pass/fail) नुसार मेल पाठवतो.
 * Use: node scripts/run-tests-and-email.js [test-script]
 * Example: node scripts/run-tests-and-email.js          → npm run test
 *          node scripts/run-tests-and-email.js test:order  → npm run test:order
 */
const { execSync } = require('child_process');
const path = require('path');

const testScript = process.argv[2] || 'test';
const runScript = path.join(__dirname, 'send-result-email.js');

let exitCode = 1;
try {
  execSync(`npm run ${testScript}`, { stdio: 'inherit', cwd: process.cwd() });
  exitCode = 0;
} catch (e) {
  exitCode = e.status ?? 1;
}

const result = exitCode === 0 ? 'pass' : 'fail';
execSync('node scripts/copy-report.js', { stdio: 'inherit', cwd: process.cwd() });
execSync('node scripts/zip-report.js', { stdio: 'inherit', cwd: process.cwd() });
require('child_process').execSync(`node "${runScript}" ${result}`, {
  stdio: 'inherit',
  cwd: process.cwd(),
  env: { ...process.env },
});

process.exit(exitCode);
