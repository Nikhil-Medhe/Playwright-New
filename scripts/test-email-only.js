/**
 * फक्त एक मेल पाठवतो — SMTP चेक करण्यासाठी. Run: npm run email:test
 */
const { execSync } = require('child_process');
const path = require('path');
execSync('node scripts/send-result-email.js pass', {
  stdio: 'inherit',
  cwd: path.join(__dirname, '..'),
});
