# Jenkins वर Playwright tests – step-by-step setup

## 1. Jenkins install (जर अजून नसेल)

- [jenkins.io](https://www.jenkins.io/download/) वरून Jenkins download करा.
- Install करा (Windows: MSI/installer; Linux: package manager).
- Browser मध्ये `http://localhost:8080` उघडा, setup wizard पूर्ण करा.

---

## 2. Build agent वर Node.js install करा

ज्या machine वर tests चालणार (Jenkins server किंवा agent), तिथे:

- [nodejs.org](https://nodejs.org/) वरून **Node.js LTS** (18 किंवा 20) install करा.
- Path मध्ये `node` आणि `npm` असल्याची खात्री करा. CMD/PowerShell मध्ये:
  ```bash
  node -v
  npm -v
  ```

---

## 3. नवीन Pipeline job बनवा

1. Jenkins मध्ये **New Item** क्लिक करा.
2. **Job name** द्या (उदा. `Playwright-Tests`).
3. **Pipeline** select करा → **OK**.

---

## 4. Job configure करा

1. **Configure** मध्ये जा.
2. **Pipeline** section मध्ये:
   - **Definition:** **Pipeline script from SCM** select करा.
   - **SCM:** **Git**.
   - **Repository URL:** तुमचा repo URL (उदा. `https://github.com/your-org/playwright-ts.git`).
   - **Credentials** जर private repo असेल तर add करा.
   - **Branch:** `*/main` किंवा तुमची branch (उदा. `*/master`).
3. **Script Path:** `Jenkinsfile` (default ठेवा – repo root मधली `Jenkinsfile` वापरली जाईल).
4. **Save**.

---

## 5. पहिला build चालवा

1. Job page वर **Build Now** क्लिक करा.
2. **Build with Parameters** → **RUN_TARGET** (qam/prod), **BROWSER**, **TEST_SUITE** निवडा.
3. **Console Output** मध्ये logs बघा – checkout → npm ci → playwright install → `run-tests-by-target.js` → `send-result-email.js` चालले पाहिजे.

---

## 6. Report कसे बघायचे

1. Build पूर्ण झाल्यावर **Build Artifacts** (किंवा **Workspace**) मध्ये जा.
2. `playwright-reports/run-YYYY-MM-DD_HH-mm-ss/` folder उघडा.
3. **index.html** download करा आणि browser मध्ये उघडा – HTML report दिसेल.

(जर **Archive the artifacts** plugin असले आणि Jenkinsfile मध्ये `archiveArtifacts` असेल तर Build page वरच **Build Artifacts** लिंक दिसेल.)

---

## 7. Email (SMTP) — local सारखं

Jenkins mail आता **`scripts/send-result-email.js`** वापरतो (ZIP + QAM/PROD label).

Job किंवा agent वर set करा: `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`, `EMAIL_TO`  
किंवा workspace मध्ये `.env` (commit नाही).

तपशील: **`JENKINS_EMAIL_SETUP.md`**

URL / environment: **Build with Parameters → RUN_TARGET** (`qam` | `prod`) — `run-tests-by-target.js` local सारखं.

---

## 8. Windows agent वर चालवत असाल तर

जर build agent **Windows** असेल तर `Jenkinsfile` मधले `sh` steps `bat` ने बदलावे:

- `sh 'npm ci'` → `bat 'npm ci'`
- `sh 'npx playwright install --with-deps chromium'` → `bat 'npx playwright install --with-deps chromium'`
- `sh 'npm run test'` → `bat 'npm run test'`

(आवश्यक तर मी तुमच्या repo साठी Windows version देऊ शकतो.)

---

## Summary

| Step | काय करायचे |
|------|----------------|
| 1 | Jenkins install |
| 2 | Agent वर Node.js (18+) install |
| 3 | New Item → Pipeline job |
| 4 | Pipeline from SCM, Git URL, branch, Script Path = `Jenkinsfile` |
| 5 | Build with Parameters (RUN_TARGET, TEST_SUITE) |
| 6 | Report: email ZIP + `playwright-reports/run-*/index.html` |
| 7 | SMTP in job env or agent `.env` (`JENKINS_EMAIL_SETUP.md`) |

Repo मध्ये **Jenkinsfile** आधीच आहे – तो checkout झाला की Jenkins तो वापरून pipeline चालवेल.
