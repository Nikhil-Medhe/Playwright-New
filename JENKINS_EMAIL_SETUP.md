# Jenkins Email — same as local (`send-result-email.js`)

Jenkins आता local सारखाच mail पाठवतो: **nodemailer**, **QAM/PROD** label, **playwright-report.zip** attachment, junit summary.

---

## 1. SMTP credentials (जरूरी)

Local `.env` सारखेच variables Jenkins **job** किंवा **build agent** वर असले पाहिजेत:

| Variable | Example |
|----------|---------|
| `SMTP_HOST` | `smtp.gmail.com` |
| `SMTP_PORT` | `587` |
| `SMTP_USER` | `automation.qa.reports@gmail.com` |
| `SMTP_PASS` | Gmail **App Password** |
| `EMAIL_TO` | `you@company.com` |
| `EMAIL_CC` | (optional) `a@x.com,b@y.com` |

### Option A — Agent वर `.env` (सोपं, local सारखं)

Build machine वर repo checkout folder मध्ये `.env` ठेवा (git मध्ये commit **करू नका**):

```
D:\jenkins\workspace\Playwright-Tests\.env
```

`send-result-email.js` तोच file वाचतो.

### Option B — Jenkins job Environment (शिफारस prod साठी)

**Job → Configure → Build Environment → Use secret text(s) or plain env vars:**

- `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`
- `SMTP_PASS` → **Secret text** credential
- `EMAIL_TO`, optional `EMAIL_CC`

किंवा **Manage Jenkins → System → Global properties** (सर्व jobs साठी).

### Test (agent वर)

Workspace मध्ये:

```bash
npm run email:test
```

Console मध्ये `Email sent successfully` आणि inbox मध्ये ZIP तपासा.

---

## 2. Jenkins System SMTP (optional — आता वापरत नाही)

जुना flow Jenkins `mail()` + **E-mail Notification** plugin वापरत होता.  
**नवीन `Jenkinsfile`** फक्त `node scripts/send-result-email.js` वापरतो — म्हणून **Jenkins System SMTP configure करणे optional** आहे; mail जातो तेव्हा **`.env` / job env** पाहिजे.

---

## 3. Build parameters (Jenkinsfile)

| Parameter | Values |
|-----------|--------|
| **RUN_TARGET** | `qam` \| `prod` |
| **BROWSER** | `chrome` \| `edge` \| `firefox` |
| **TEST_SUITE** | `OrderSubmission`, `Catalogmanager`, `cadSiteVersion1`, `cadSiteVersion1_OrderManager`, `cadSiteVersion`, `all` |

**Build with Parameters** → target + suite निवडा → **Build**.

Tests: `run-tests-by-target.js` (local `npm run test:qam` / `test:prod` सारखं).

---

## 4. Mail मध्ये काय येतं (local सारखं)

| Item | Source |
|------|--------|
| Subject | `[PASS/FAIL] Playwright Automation Result – **QAM/PROD** – timestamp` |
| Body | Environment label, Tools URL, Pub URL, passed/failed counts |
| Attachment | `playwright-report.zip` |
| Footer | Jenkins job #, suite, console link (`EMAIL_BODY_FOOTER`) |

Optional overrides (job env): `EMAIL_SUBJECT_PREFIX`, `EMAIL_BODY_HEADER`, `EMAIL_BODY_FOOTER`

---

## 5. Artifacts (Jenkins UI)

Email ZIP सोबत, Jenkins **Build Artifacts** मध्येही:

- `playwright-report.zip`
- `playwright-reports/run-*/`
- `test-results/junit.xml`

---

## 6. Troubleshooting

| Problem | Fix |
|---------|-----|
| `SMTP_USER or SMTP_PASS missing` | Job env किंवा agent `.env` भरा |
| Email नाही, tests pass | Console: `WARN: send-result-email.js failed` — `npm run email:test` |
| Prod run पण QAM URL | **RUN_TARGET=prod** parameter निवडा |
| Wrong browser | **BROWSER** parameter + install stage (chromium/msedge/firefox) |

Local email docs: `RUN_TESTS.md` § 6.
