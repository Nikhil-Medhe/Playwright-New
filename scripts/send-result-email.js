/**
 * Local run नंतर test result मेल पाठवण्यासाठी.
 * Use: node scripts/send-result-email.js pass   किंवा   node scripts/send-result-email.js fail
 *
 * Env (किंवा .env): SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, EMAIL_TO
 * Example (Gmail): SMTP_HOST=smtp.gmail.com SMTP_PORT=587 SMTP_USER=automation.qa.reports@gmail.com SMTP_PASS=xxx EMAIL_TO=nikhil.medhe@firstsource.com
 */
const path = require('path');
const envPath = path.join(__dirname, '..', '.env');
require('dotenv').config({ path: envPath });
const nodemailer = require('nodemailer');

const result = (process.argv[2] || 'pass').toLowerCase();
const isPass = result === 'pass';
const summary = process.argv[3] || (isPass ? 'All tests passed.' : 'One or more tests failed.');

const host = process.env.SMTP_HOST || 'smtp.gmail.com';
const port = Number(process.env.SMTP_PORT) || 587;
const user = process.env.SMTP_USER || process.env.GMAIL_USER;
const pass = process.env.SMTP_PASS || process.env.GMAIL_APP_PASSWORD;
const to = process.env.EMAIL_TO || 'nikhil.medhe@firstsource.com';

if (!user || !pass) {
  console.error('SMTP credentials missing. Add to', envPath, ':');
  console.error('  SMTP_USER=automation.qa.reports@gmail.com');
  console.error('  SMTP_PASS=<Gmail App Password>');
  console.error('  EMAIL_TO=nikhil.medhe@firstsource.com');
  process.exit(1);
}

const transporter = nodemailer.createTransport({
  host,
  port,
  secure: port === 465,
  auth: { user, pass },
});

const subject = isPass
  ? `[PASS] Playwright local run – ${new Date().toISOString().slice(0, 19)}`
  : `[FAIL] Playwright local run – ${new Date().toISOString().slice(0, 19)}`;

const body = `Playwright Test Result – ${isPass ? 'SUCCESS' : 'FAILED'}

Job: Local run
Build: -
Suite: -

${summary}

HTML report: see attached playwright-report.zip (unzip and open index.html).
`;

const zipPath = path.join(__dirname, '..', 'playwright-report.zip');
const attachments = [];
if (require('fs').existsSync(zipPath)) {
  attachments.push({ filename: 'playwright-report.zip', content: require('fs').readFileSync(zipPath) });
}

transporter.sendMail({
  from: user,
  to,
  subject,
  text: body,
  attachments: attachments.length ? attachments : undefined,
}).then((info) => {
  console.log('Email sent to', to, info.messageId ? '(messageId: ' + info.messageId + ')' : '');
}).catch((err) => {
  console.error('Email failed:', err.message);
  if (err.response) console.error('SMTP response:', err.response);
  process.exit(1);
});
