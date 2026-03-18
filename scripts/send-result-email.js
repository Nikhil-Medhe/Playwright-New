/**
 * Local run नंतर मेल पाठवतो (pass/fail + test summary + playwright-report.zip).
 * Use: node scripts/send-result-email.js pass | fail
 */
const path = require('path');
const fs = require('fs');

require('dotenv').config({ path: path.join(__dirname, '..', '.env') });
const nodemailer = require('nodemailer');

const result = (process.argv[2] || 'pass').toLowerCase();
const isPass = result === 'pass';

const host = process.env.SMTP_HOST;
const port = parseInt(process.env.SMTP_PORT || '587', 10);
const user = process.env.SMTP_USER;
const pass = process.env.SMTP_PASS;
const to = process.env.EMAIL_TO;

if (!user || !pass) {
  console.error('Set SMTP_USER and SMTP_PASS in .env (project root). Use Gmail App Password for Gmail.');
  process.exit(1);
}

function getTestSummary() {
  const junitPath = path.join(__dirname, '..', 'test-results', 'junit.xml');
  if (!fs.existsSync(junitPath)) return 'Test summary: See Playwright Report.';
  const xml = fs.readFileSync(junitPath, 'utf8');
  const t = xml.match(/tests="(\d+)"/);
  const f = xml.match(/failures="(\d+)"/);
  const tests = t ? t[1] : '?';
  const failures = f ? f[1] : '?';
  const passed = (/\d+/.test(tests) && /\d+/.test(failures)) ? (parseInt(tests, 10) - parseInt(failures, 10)) : '?';
  return `Tests: ${passed} passed, ${failures} failed (total ${tests}).`;
}

const summary = getTestSummary();
const zipPath = path.join(__dirname, '..', 'playwright-report.zip');
const attachments = fs.existsSync(zipPath)
  ? [{ filename: 'playwright-report.zip', content: fs.readFileSync(zipPath) }]
  : [];

const subject = isPass
  ? `[PASS] Playwright (Local) – ${new Date().toISOString().slice(0, 19).replace('T', ' ')}`
  : `[FAIL] Playwright (Local) – ${new Date().toISOString().slice(0, 19).replace('T', ' ')}`;

const body = `Playwright – Local run

Result: ${isPass ? 'SUCCESS' : 'FAILED'}
${summary}

HTML report: ${attachments.length ? 'see attached playwright-report.zip (unzip and open index.html).' : 'Run "npm run report" or check playwright-reports/.'}
`;

async function send() {
  const transporter = nodemailer.createTransport({
    host: host || 'smtp.gmail.com',
    port,
    secure: port === 465,
    auth: { user, pass },
  });

  const mailOptions = {
    from: user,
    to: to || user,
    subject,
    text: body,
    attachments,
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log('Email sent to:', mailOptions.to);
    if (attachments.length) console.log('Attached: playwright-report.zip');
  } catch (err) {
    console.error('Email failed:', err.message);
    process.exit(1);
  }
}

send().then(() => process.exit(0)).catch((err) => {
  console.error('Email failed:', err.message);
  process.exit(1);
});
