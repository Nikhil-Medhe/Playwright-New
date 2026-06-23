# Playwright tests on Jenkins — step-by-step setup

## 1. Install Jenkins (if not already installed)

- Download Jenkins from [jenkins.io](https://www.jenkins.io/download/).
- Install it (Windows: MSI/installer; Linux: package manager).
- Open `http://localhost:8080` in a browser and complete the setup wizard.

---

## 2. Install Node.js on the build agent

On the machine where tests will run (Jenkins server or agent):

- Install **Node.js LTS** (18 or 20) from [nodejs.org](https://nodejs.org/).
- Make sure `node` and `npm` are on the PATH:

```bash
node -v
npm -v
```

---

## 3. Credentials (required — do not commit to git)

**Never push passwords to git.** Use one of these two approaches:

### Option A — Jenkins Secret file (recommended)

1. Jenkins → **Manage Jenkins** → **Credentials** → (Global) → **Add Credentials**
2. Kind: **Secret file**
3. Create two entries:

| Credential ID | Upload file | Used when |
|---------------|-------------|-----------|
| `playwright-qam-credentials` | your `credentials.json` (nikhil) | `RUN_TARGET=qam` |
| `playwright-prod-credentials` | your `automationqa-credentials.json` | `RUN_TARGET=prod` |

4. Run a build — the `Jenkinsfile` **Setup credentials** stage will automatically copy them into `Data/`.

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

If the file already exists in the workspace before the **Setup credentials** stage, Jenkins uses it without a Secret.

---

## 4. Create a new Pipeline job

Recommended: **two jobs** (optional but clearer):

| Job name | Default RUN_TARGET | Default TEST_SUITE |
|----------|-------------------|-------------------|
| `Playwright-QAM` | `qam` | `all` |
| `Playwright-PROD` | `prod` | `all` |

A single job also works — choose `RUN_TARGET` from **Build with Parameters**.

1. In Jenkins: **New Item** → **Pipeline** → **OK**.
2. **Pipeline script from SCM** → **Git** → repo URL + branch.
3. **Script Path:** `Jenkinsfile`
4. **Save**.

---

## 5. Build with Parameters

| Parameter | QAM | PROD |
|-----------|-----|------|
| **RUN_TARGET** | `qam` | `prod` |
| **BROWSER** | chrome / edge / firefox | same |
| **TEST_SUITE** | `all` or a single scenario | `all` or a single scenario |

### TEST_SUITE mapping (qam vs prod)

| Dropdown name | QAM spec | PROD spec |
|---------------|----------|-----------|
| all | `tests/qam/` | `tests/automationqa-prod/` |
| cadSiteVersion1 | `cadSiteVersion1.spec.ts` | `testVersion.spec.ts` |
| cadSiteVersion1_OrderManager | cad1 → orderManager | testVersion → orderManager |
| PCATBasicNavigation | `PCATBasicNavigation.spec.ts` | `pcatNavigation.spec.ts` |
| login | `login.spec.ts` | **QAM only** (error on prod) |
| OrderSubmission, CompareItem, … | `tests/qam/*` | `tests/automationqa-prod/*` |

Local equivalent:

```bash
npm run test:qam -- --project=chrome
npm run test:prod -- --project=chrome
```

---

## 6. How to view reports

1. After the build completes, open **Build Artifacts**.
2. `playwright-reports/run-YYYY-MM-DD_HH-mm-ss/index.html` — HTML report.
3. `playwright-report.zip` — same file as the email attachment.

---

## 7. Email (SMTP)

On the job or agent: `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`, `EMAIL_TO`  
or a workspace `.env` (do not commit).

Details: **`JENKINS_EMAIL_SETUP.md`**

The mail subject includes a **QAM** or **Automationqa Prod** label (based on `RUN_TARGET`).

---

## 8. Windows agent

The `Jenkinsfile` uses **bat** (ready for a Windows Jenkins agent).

---

## Summary

| Step | What |
|------|------|
| 1 | Jenkins + Node.js on agent |
| 2 | Jenkins Secret file: `playwright-qam-credentials` + `playwright-prod-credentials` (or manual `Data/*.json` on agent) |
| 3 | Pipeline from SCM → `Jenkinsfile` |
| 4 | Build with Parameters: **RUN_TARGET** + **TEST_SUITE** + **BROWSER** |
| 5 | SMTP for result email (`JENKINS_EMAIL_SETUP.md`) |

The repo includes a **Jenkinsfile** — after checkout, Jenkins runs the pipeline.
