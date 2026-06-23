# Playwright — individual tests, QAM vs Prod, config & email

Quick reference for running **one spec** on **QAM** or **Prod**, and where to change URLs, credentials, email body, and other dynamic settings.

---

## 1. Golden rule (URLs)

| Run type | Command pattern | Tools host (example) |
|----------|-----------------|----------------------|
| **QAM** | `node scripts/run-tests-by-target.js qam …` | `https://tools.cn-qam-stage.catnav.us` |
| **Prod** (Thomas) | `node scripts/run-tests-by-target.js prod …` | `https://tools.thomasnet-navigator.com` |
| **Wrong** (defaults to QAM) | `npx playwright test tests/…` only | Uses `.env` / default `ENV=stage` |

The console should show `[target:qam]` or `[target:prod]` and `BASE_URL=…`.

---

## 2. Individual test — no email

Replace `tests/YourTest.spec.ts` with your file. Add `--project=chrome` (or `edge`, `firefox`).

### QAM

```bash
node scripts/run-tests-by-target.js qam tests/OrderSubmission.spec.ts --project=chrome
```

### Prod

```bash
node scripts/run-tests-by-target.js prod tests/OrderSubmission.spec.ts --project=chrome
```

### Extra Playwright flags (append to the same command)

```bash
node scripts/run-tests-by-target.js prod tests/Catalogmanager.spec.ts --project=chrome --headed
node scripts/run-tests-by-target.js qam tests/cadSiteVersion1.spec.ts --project=edge --grep "@cad-prod"
```

### npm shortcuts (already in `package.json`)

| Test | QAM | Prod |
|------|-----|------|
| Catalog Manager | `npm run test:catalogmanager:qam -- --project=chrome` | `npm run test:catalogmanager:prod -- --project=chrome` |
| CAD Site Version 1 | `npm run test:cad1 -- qam --project=chrome` | `npm run test:cad1 -- prod --project=chrome` |
| PCAT navigation | `npm run test:pcat:qam` | — (use `thomas-stage` script for Thomas staging pub) |
| Order submission only | `npm run test:order:no-email` (no target — set env yourself) | `node scripts/run-tests-by-target.js prod tests/OrderSubmission.spec.ts --project=chrome` |

---

## 3. Individual test — with email (report ZIP)

Pattern: `node scripts/run-browser-email.js <target> <browser> <spec path>`

### QAM + Chrome + one spec

```bash
node scripts/run-browser-email.js qam chrome tests/OrderSubmission.spec.ts
```

### Prod + Chrome + one spec

```bash
node scripts/run-browser-email.js prod chrome tests/Catalogmanager.spec.ts
```

### npm aliases

```bash
npm run test:qam:chrome:email -- tests/RequestInformation.spec.ts
npm run test:prod:chrome:email -- tests/cadSiteVersion1.spec.ts
npm run test:cad1prod:chrome:email
```

To change email body or subject → [§ 6 Email](#6-email-body-subject-recipients).

---

## 4. All test files (copy-paste paths)

| Spec file | Typical stack |
|-----------|----------------|
| `tests/Catalogmanager.spec.ts` | Tools (QAM / Thomas prod) |
| `tests/cadSiteVersion1.spec.ts` | Tools + pub catalog |
| `tests/OrderSubmission.spec.ts` | Pub catalog + cart |
| `tests/orderManager.spec.ts` | Tools Order Manager |
| `tests/RequestInformation.spec.ts` | Pub PLP |
| `tests/Promotions.spec.ts` | Pub + cart |
| `tests/CompareItem.spec.ts` | Pub |
| `tests/DownloadPDF.spec.ts` | Pub |
| `tests/EmailThisPage-New.spec.ts` | Pub |
| `tests/PCATBasicNavigation.spec.ts` | Pub (pvt cat) |
| `tests/login.spec.ts` | Tools login |
| `tests/Keyword search.spec.ts` | Pub (filename has space — use quotes) |

**Filename with space:**

```bash
node scripts/run-tests-by-target.js qam "tests/Keyword search.spec.ts" --project=chrome
```

**Full suite + email:**

```bash
npm run test:qam:email
npm run test:prod:email
```

---

## 5. Environment targets (dynamic URLs)

Defined in **`scripts/run-tests-by-target.js`** → `targetMap`:

| Target | `ENV` | `BASE_URL` (tools) | `PUB_CATALOG_URL` (storefront) |
|--------|-------|--------------------|--------------------------------|
| `qam` | stage | `https://tools.cn-qam-stage.catnav.us` | `https://nikhil.cn-qam-pub.catnav.us` |
| `prod` / `navigator` | prod | `https://tools.thomasnet-navigator.com` | `https://nikhil.thomasnet-navigator.com` |
| `thomas-stage` | stage | `https://tools.thomasnet-navigator.com` | `https://nikhil.stage.thomasnet-navigator.com` |
| `catnav` | prod | `https://tools.catnav.us` | `https://nikhil.thomasnet-navigator.com` |

**New company / URL without code change:** project root `.env` (copy from `.env.example`):

```env
BASE_URL=https://your-tools-host
PUB_CATALOG_URL=https://your-pub-host
ENV=prod
```

`run-tests-by-target.js` sets vars **before** Playwright starts; `.env` is loaded with `override: false` so CLI target wins over `.env` for those keys.

**Used in tests (import, don’t hardcode hosts):**

| File | Purpose |
|------|---------|
| `config/env.ts` | `baseURL`, `envName`, `timeout` |
| `config/urls.ts` | `PUB_CATALOG_BASE_URL`, `toolsBaseUrl()`, WM paths, cart regex |
| `pages/LoginPage.ts` | Login under `BASE_URL` |
| `pages/PublicCatalogPage.ts` | Pub URLs |

**WM versions path (Thomas vs CatNav):** `WM_VERSIONS_PATH` in target or `.env` — see `config/urls.ts`.

---

## 6. Email — body, subject, recipients

### Local run (after `run-browser-email.js` or `run-tests-and-email.js`)

**QAM vs PROD in email:** use targeted runners so the label is not always "Local":

```bash
npm run test:prod:chrome:email
npm run test:qam:chrome:email
```

Subject/body then show **`QAM`** or **`PROD`** (e.g. `[PASS] Playwright – PROD – …`, body `Playwright – PROD run`).  
Saved context: `test-results/last-run-target.json` (written when `run-tests-by-target.js` starts).

| What | Where |
|------|--------|
| **QAM / PROD label logic** | `scripts/target-env.js` → `resolveEmailEnvironmentLabel()` |
| **Subject line** | `scripts/send-result-email.js` — uses `envLabel` (QAM / PROD / …) |
| **Email body text** | `scripts/send-result-email.js` — `body` + `Tools (BASE_URL)` / `Pub catalog` |
| **SMTP / To / CC** | `.env` — `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`, `EMAIL_TO`, `EMAIL_CC` |
| **Test counts in body** | Same file — `getTestSummary()` reads `test-results/junit.xml` |
| **ZIP attachment** | `scripts/zip-report.js` → `playwright-report.zip` attached in `send-result-email.js` |

Example body edit (`scripts/send-result-email.js`):

```javascript
const body = `Playwright – Local run

Result: ${isPass ? 'SUCCESS' : 'FAILED'}
Environment: ${process.env.BASE_URL || 'n/a'}
${summary}
...
`;
```

Optional: add env-driven lines without hardcoding:

```javascript
const extra = process.env.EMAIL_BODY_FOOTER || '';
```

Then set `EMAIL_BODY_FOOTER=…` in `.env`.

### Jenkins email (same script as local)

| What | Where |
|------|--------|
| Send mail | `Jenkinsfile` → `post { always }` → `node scripts/send-result-email.js pass\|fail` |
| SMTP / To / CC | Job env or agent `.env` — `SMTP_*`, `EMAIL_TO`, `EMAIL_CC` (not Jenkins `mail()`) |
| QAM / PROD | Build parameter **RUN_TARGET** + `run-tests-by-target.js` |
| ZIP attachment | `scripts/zip-report.js` then `send-result-email.js` |

See: `JENKINS_EMAIL_SETUP.md`, `JENKINS_SETUP.md`.

### Test email only (no run)

```bash
npm run email:test
```

---

## 7. Other dynamic / common config

| Setting | File / env |
|---------|------------|
| Login credentials | `.env` → `LOGIN_USERS` JSON **or** `LOGIN_USERS_FILE` → `Data/credentials.json` |
| Default creds fallback | `helpers/dataLoader.ts` → `FALLBACK_CREDS` |
| Order Manager order # | `.env` → `ORDER_REF` or `test-results/last-order-ref.txt` (from cadSiteVersion1) |
| Playwright timeout | `.env` → `TIMEOUT` or `config/env.ts` |
| Headed / headless | `.env` → `HEADLESS`, `PLAYWRIGHT_HEADED`; `playwright.config.ts` → `useHeadless()` |
| Parallel workers | `.env` → `PLAYWRIGHT_WORKERS`; `playwright.config.ts` |
| Browser window maximize | `.env` → `PLAYWRIGHT_MAXIMIZE` |
| Slow motion | `.env` → `SLOW_MO` |
| Browsers (projects) | `playwright.config.ts` → `projects` (chrome, edge, firefox) |
| HTML report folder | `playwright-reports/run-YYYY-MM-DD_HH-mm-ss/` |
| Open latest report | `npm run report` |

---

## 8. Reports

```bash
npm run report
npx playwright show-report playwright-reports\run-2026-05-22_13-00-28
```

---

## 9. Cheat sheet (copy one line)

```bash
# QAM — one test
node scripts/run-tests-by-target.js qam tests/Catalogmanager.spec.ts --project=chrome

# Prod — one test
node scripts/run-tests-by-target.js prod tests/Catalogmanager.spec.ts --project=chrome

# Prod — one test + email
node scripts/run-browser-email.js prod chrome tests/Catalogmanager.spec.ts

# QAM — one test + email
node scripts/run-browser-email.js qam chrome tests/OrderSubmission.spec.ts
```

---

## 10. Troubleshooting

| Problem | Fix |
|---------|-----|
| Prod run still opens QAM | Use `run-tests-by-target.js prod`, not plain `npx playwright test` |
| Catalog Manager wrong app | Spec uses `loginToCatalogManager()` — Tools = Catalog Manager |
| Email not sent | `.env` SMTP + `npm run email:test` |
| `Keyword search` not found | Quote path: `"tests/Keyword search.spec.ts"` |
