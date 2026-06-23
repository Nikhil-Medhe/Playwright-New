# Jenkins Email — same as local (`send-result-email.js`)

Jenkins now sends mail the same way as local: **nodemailer**, **QAM/PROD** label, **playwright-report.zip** attachment, junit summary.

---

## 1. SMTP credentials (required)

The same variables as local `.env` must be set on the Jenkins **job** or **build agent**:

| Variable | Example |
|----------|---------|
| `SMTP_HOST` | `smtp.gmail.com` |
| `SMTP_PORT` | `587` |
| `SMTP_USER` | `automation.qa.reports@gmail.com` |
| `SMTP_PASS` | Gmail **App Password** |
| `EMAIL_TO` | `you@company.com` |
| `EMAIL_CC` | (optional) `a@x.com,b@y.com` |

### Option A — `.env` on the agent (simple, like local)

Place `.env` in the repo checkout folder on the build machine (do **not** commit to git):

```
D:\jenkins\workspace\Playwright-Tests\.env
```

`send-result-email.js` reads that file.

### Option B — Jenkins job Environment (recommended for prod)

**Job → Configure → Build Environment → Use secret text(s) or plain env vars:**

- `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`
- `SMTP_PASS` → **Secret text** credential
- `EMAIL_TO`, optional `EMAIL_CC`

Or **Manage Jenkins → System → Global properties** (for all jobs).

### Test (on agent)

In the workspace:

```bash
npm run email:test
```

Check the console for `Email sent successfully` and verify the ZIP in your inbox.

---

## 2. Jenkins System SMTP (optional — not used now)

The old flow used Jenkins `mail()` + the **E-mail Notification** plugin.  
The **new `Jenkinsfile`** only uses `node scripts/send-result-email.js` — so **configuring Jenkins System SMTP is optional**; mail is sent when **`.env` / job env** is set.

---

## 3. Build parameters (Jenkinsfile)

| Parameter | Values |
|-----------|--------|
| **RUN_TARGET** | `qam` → `tests/qam` + nikhil QAM URLs \| `prod` → `tests/automationqa-prod` + Automationqa URLs |
| **BROWSER** | `chrome` \| `edge` \| `firefox` |
| **TEST_SUITE** | `all`, `Catalogmanager`, `CompareItem`, `DownloadPDF`, `EmailThisPage-New`, `cadSiteVersion1`, `cadSiteVersion1_OrderManager`, `Keyword search`, `login` (QAM only), `orderManager`, `OrderSubmission`, `PCATBasicNavigation`, `Promotions`, `RequestInformation` |

**Build with Parameters** → `RUN_TARGET` + suite + browser → **Build**.

Tests: `node scripts/run-tests-by-target.js <qam|prod> <spec-or-folder>` — same as local `npm run test:qam` / `npm run test:prod`.

**Credentials (on agent, do not commit):**

- QAM: `Data/credentials.json`
- PROD: `Data/automationqa-credentials.json`

---

## 4. What the email contains (same as local)

| Item | Source |
|------|--------|
| Subject | `[PASS/FAIL] Playwright Automation Result – **QAM** or **Automationqa Prod** – timestamp` |
| Body | Environment label, Tools URL, Pub URL, passed/failed counts |
| Attachment | `playwright-report.zip` |
| Footer | Jenkins job #, suite, console link (`EMAIL_BODY_FOOTER`) |

Optional overrides (job env): `EMAIL_SUBJECT_PREFIX`, `EMAIL_BODY_HEADER`, `EMAIL_BODY_FOOTER`

---

## 5. Artifacts (Jenkins UI)

Along with the email ZIP, Jenkins **Build Artifacts** also include:

- `playwright-report.zip`
- `playwright-reports/run-*/`
- `test-results/junit.xml`

---

## 6. Troubleshooting

| Problem | Fix |
|---------|-----|
| `SMTP_USER or SMTP_PASS missing` | Fill in job env or agent `.env` |
| No email, tests pass | Console: `WARN: send-result-email.js failed` — run `npm run email:test` |
| Prod run but QAM URL | Select **RUN_TARGET=prod**; credentials: `Data/automationqa-credentials.json` |
| QAM run fails login | **RUN_TARGET=qam** + `Data/credentials.json` on agent |
| Wrong browser | **BROWSER** parameter + install stage (chromium/msedge/firefox) |

Local email docs: `RUN_TESTS.md` § 6.
