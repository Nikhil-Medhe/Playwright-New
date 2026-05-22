/**
 * Sends a single test email to verify SMTP. Run: npm run email:test
 */
const { execSync } = require('child_process');
const path = require('path');
execSync('node scripts/send-result-email.js pass', {
  stdio: 'inherit',
  cwd: path.join(__dirname, '..'),
});
