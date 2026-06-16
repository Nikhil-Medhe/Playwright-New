# Jenkins वर Playwright tests – step-by-step setup

## 1. Jenkins install (जर अजून नसेल)

- [jenkins.io](https://www.jenkins.io/download/) वरून Jenkins download करा.
- Install करा (Windows: MSI/installer; Linux: package manager).
- Browser मध्ये `http://localhost:8080` उघडा, setup wizard पूर्ण करा.

---

## 2. Build agent वर Node.js install करा

ज्या machine वर tests चालणार (Jenkins server किंवा agent), तिथे:

- [nodejs.org](https://nodejs.org/) वरून **Node.js LTS** (18 किंवा 20) install करा.
- Path मध्ये `node` आणि `npm` असल्याची खात्री करा:

```bash
node -v
npm -v
```

---

## 3. Credentials (जरूरी — git मध्ये commit नाही)

Passwords **कधीच git push करू नका**. दोन पैकी एक मार्ग वापरा:

### Option A — Jenkins Secret file (recommended)

1. Jenkins → **Manage Jenkins** → **Credentials** → (Global) → **Add Credentials**
2. Kind: **Secret file**
3. दोन entries तयार करा:

| Credential ID | Upload file | Used when |
|---------------|-------------|-----------|
| `playwright-qam-credentials` | तुझा `credentials.json` (nikhil) | `RUN_TARGET=qam` |
| `playwright-prod-credentials` | तुझा `automationqa-credentials.json` | `RUN_TARGET=prod` |

4. Build run करा — `Jenkinsfile` stage **Setup credentials** automatic copy करेल `Data/` मध्ये.

JSON format (array):

```json
[{ "company": "nikhil", "username": "nikhilmedhe", "password": "..." }]
```

PROD:

```json
[{ "company": "Automationqa", "username": "Automationqa", "password": "..." }]
```

### Option B — Manual copy on agent (fallback)

| RUN_TARGET | File on agent |
|------------|---------------|
| **qam** | `...\Playwright-TS-Automation\Data\credentials.json` |
| **prod** | `...\Playwright-TS-Automation\Data\automationqa-credentials.json` |

`Setup credentials` stage आधी workspace मध्ये file असेल तर Jenkins Secret शिवाय ती वापरते.

---

## 4. नवीन Pipeline job बनवा

शिफारस: **दोन jobs** (optional पण clear):

| Job name | Default RUN_TARGET | Default TEST_SUITE |
|----------|-------------------|-------------------|
| `Playwright-QAM` | `qam` | `all` |
| `Playwright-PROD` | `prod` | `all` |

एकच job पण चालेल — **Build with Parameters** वरून `RUN_TARGET` निवडा.

1. Jenkins मध्ये **New Item** → **Pipeline** → **OK**.
2. **Pipeline script from SCM** → **Git** → repo URL + branch.
3. **Script Path:** `Jenkinsfile`
4. **Save**.

---

## 5. Build with Parameters

| Parameter | QAM | PROD |
|-----------|-----|------|
| **RUN_TARGET** | `qam` | `prod` |
| **BROWSER** | chrome / edge / firefox | same |
| **TEST_SUITE** | `all` किंवा एक scenario | `all` किंवा एक scenario |

### TEST_SUITE mapping (qam vs prod)

| Dropdown name | QAM spec | PROD spec |
|---------------|----------|-----------|
| all | `tests/qam/` | `tests/automationqa-prod/` |
| cadSiteVersion1 | `cadSiteVersion1.spec.ts` | `testVersion.spec.ts` |
| cadSiteVersion1_OrderManager | cad1 → orderManager | testVersion → orderManager |
| PCATBasicNavigation | `PCATBasicNavigation.spec.ts` | `pcatNavigation.spec.ts` |
| login | `login.spec.ts` | **QAM only** (prod वर error) |
| OrderSubmission, CompareItem, … | `tests/qam/*` | `tests/automationqa-prod/*` |

Local equivalent:

```bash
npm run test:qam -- --project=chrome
npm run test:prod -- --project=chrome
```

---

## 6. Report कसे बघायचे

1. Build पूर्ण झाल्यावर **Build Artifacts**.
2. `playwright-reports/run-YYYY-MM-DD_HH-mm-ss/index.html` — HTML report.
3. `playwright-report.zip` — email attachment same file.

---

## 7. Email (SMTP)

Job किंवा agent वर: `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`, `EMAIL_TO`  
किंवा workspace `.env` (commit नाही).

तपशील: **`JENKINS_EMAIL_SETUP.md`**

Mail subject मध्ये **QAM** किंवा **Automationqa Prod** label येतो (`RUN_TARGET` नुसार).

---

## 8. Windows agent

`Jenkinsfile` **bat** वापरते (Windows Jenkins agent साठी ready).

---

## Summary

| Step | काय |
|------|-----|
| 1 | Jenkins + Node.js on agent |
| 2 | Jenkins Secret file: `playwright-qam-credentials` + `playwright-prod-credentials` (किंवा manual `Data/*.json` on agent) |
| 3 | Pipeline from SCM → `Jenkinsfile` |
| 4 | Build with Parameters: **RUN_TARGET** + **TEST_SUITE** + **BROWSER** |
| 5 | SMTP for result email (`JENKINS_EMAIL_SETUP.md`) |

Repo मध्ये **Jenkinsfile** आहे — checkout झाला की Jenkins pipeline चालवेल.
