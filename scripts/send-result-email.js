/**
 * Sends email after a local run (pass/fail, test summary, playwright-report.zip).
 * Use: node scripts/send-result-email.js pass | fail
 *
 * Environment label (QAM / PROD) comes from:
 * - RUN_TARGET + BASE_URL set by run-tests-by-target / run-browser-email, or
 * - test-results/last-run-target.json written at start of a targeted run
 *
 * .env: EMAIL_TO, EMAIL_CC, optional EMAIL_SUBJECT_PREFIX, EMAIL_BODY_HEADER, EMAIL_BODY_FOOTER
 */
const path = require('path');
const fs = require('fs');
const { getLatestRunFolderName } = require('./resolve-latest-run-report');
const { resolveEmailEnvironmentLabel, readLastRunContext } = require('./target-env');

const rootDir = path.join(__dirname, '..');
const envPath = path.join(rootDir, '.env');
require('dotenv').config({ path: envPath });
const nodemailer = require('nodemailer');

const result = (process.argv[2] || 'pass').toLowerCase();
const isPass = result === 'pass';

const host = process.env.SMTP_HOST;
const port = parseInt(process.env.SMTP_PORT || '587', 10);
const user = process.env.SMTP_USER;
const pass = process.env.SMTP_PASS;
const to = process.env.EMAIL_TO;
const cc = (process.env.EMAIL_CC || '').trim();

if (!user || !pass) {
  console.error('Local email: SMTP_USER or SMTP_PASS missing.');
  console.error('Add them in .env at project root:', path.resolve(envPath));
  console.error('Example: SMTP_USER=your@gmail.com  SMTP_PASS=app-password  EMAIL_TO=recipient@company.com  [EMAIL_CC=a@x.com,b@y.com]');
  process.exit(1);
}

function getTestSummary() {
  const junitPath = path.join(rootDir, 'test-results', 'junit.xml');
  if (!fs.existsSync(junitPath)) return 'Test summary: See Playwright Report.';
  const xml = fs.readFileSync(junitPath, 'utf8');
  const t = xml.match(/tests="(\d+)"/);
  const f = xml.match(/failures="(\d+)"/);
  const tests = t ? t[1] : '?';
  const failures = f ? f[1] : '?';
  const passed = (/\d+/.test(tests) && /\d+/.test(failures)) ? (parseInt(tests, 10) - parseInt(failures, 10)) : '?';
  return `Tests: ${passed} passed, ${failures} failed (total ${tests}).`;
}

function mergeRunContext() {
  const saved = readLastRunContext(rootDir);
  return { ...(saved || {}), ...process.env };
}

const runContext = mergeRunContext();
const envLabel = resolveEmailEnvironmentLabel(runContext);
const baseUrl = runContext.BASE_URL || 'n/a';
const pubUrl = runContext.PUB_CATALOG_URL || 'n/a';

const summary = getTestSummary();
const latestRun = getLatestRunFolderName(path.join(rootDir, 'playwright-reports'));
const zipPath = path.join(rootDir, 'playwright-report.zip');
const attachments = fs.existsSync(zipPath)
  ? [{ filename: 'playwright-report.zip', content: fs.readFileSync(zipPath) }]
  : [];

const subjectPrefix = (process.env.EMAIL_SUBJECT_PREFIX || 'Playwright Automation Result').trim();
const stamp = new Date().toISOString().slice(0, 19).replace('T', ' ');
const subject = isPass
  ? `[PASS] ${subjectPrefix} – ${envLabel} – ${stamp}`
  : `[FAIL] ${subjectPrefix} – ${envLabel} – ${stamp}`;

const reportZipHelp = attachments.length
  ? `Full HTML report for this run (every test that executed) — see attached playwright-report.zip:
  1) Save the ZIP, then unzip it.
  2) Open index.html inside the folder in Chrome or Edge — you will see all pass/fail results, screenshots, and timings.

The zip contains one report folder listing every test from this run (not a single-test slice).`
  : `No ZIP was produced. On this machine, from the repo root: run "npm run report" to open the latest run, or open a folder under playwright-reports/run-*/`;

const bodyHeader = (process.env.EMAIL_BODY_HEADER || `Playwright – ${envLabel} run`).trim();
const bodyFooter = (process.env.EMAIL_BODY_FOOTER || '').trim();

const body = `${bodyHeader}

Result: ${isPass ? 'SUCCESS' : 'FAILED'}
Environment: ${envLabel}
Tools (BASE_URL): ${baseUrl}
Pub catalog: ${pubUrl}
${summary}
${latestRun ? `Report run folder: playwright-reports/${latestRun}/` : ''}

${reportZipHelp}
${bodyFooter ? `\n${bodyFooter}` : ''}`;

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
    ...(cc ? { cc } : {}),
    subject,
    text: body,
    attachments,
  };

  try {
    const ccLog = cc ? ` (CC: ${cc})` : '';
    console.log(`Sending email (${envLabel}) to:`, mailOptions.to + ccLog, '...');
    console.log('Subject:', subject);
    await transporter.sendMail(mailOptions);
    console.log('Email sent successfully.');
    if (attachments.length) console.log('Attached: playwright-report.zip');
  } catch (err) {
    console.error('Email failed:', err.message);
    if (err.response) console.error('SMTP response:', err.response);
    process.exit(1);
  }
}

send().then(() => process.exit(0)).catch((err) => {
  console.error('Email failed:', err.message);
  process.exit(1);
});
