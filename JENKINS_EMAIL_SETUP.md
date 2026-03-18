# Jenkins Email + Playwright Setup

## 1. Jenkins मध्ये Email (SMTP) Configure करा

1. **Manage Jenkins** → **System** (Configure System).
2. **E-mail Notification** section शोधा.
3. Fill करा:
   - **SMTP server:** तुमचा mail server (उदा. `smtp.gmail.com`, `smtp.office365.com`, company SMTP).
   - **Default user e-mail suffix:** जर लागत असेल (उदा. `@company.com`).
   - **Use SMTP Authentication:** होय निवडा.
   - **User Name:** तुमचा email (उदa. `yourname@gmail.com`).
   - **Password:** तुमचा app password किंवा SMTP password.
   - **Use SSL:** होय (port 465) किंवा **Use TLS** (port 587) — server वर अवलंबून.
   - **SMTP Port:** 465 (SSL) किंवा 587 (TLS).
4. **Test configuration** बटणाने एक test mail पाठवून तपासा.
5. **Save**.

**Gmail साठी:** 2-Step Verification + App Password वापरा; साधा password काम करणार नाही.

---

## 1b. मेल मध्ये Report Zip Attach करण्यासाठी (Optional)

मेलबरोबर **playwright-report.zip** attach व्हावा (ना फक्त link) तर **Email Extension** plugin चा SMTP सेट करावा लागतो:

1. **Manage Jenkins** → **System**.
2. खाली स्क्रोल करून **Extended E-mail Notification** section शोधा.
3. तिथे **E-mail Notification** सारखंच भरा:
   - **SMTP server:** `smtp.gmail.com` (किंवा तुमचा SMTP).
   - **SMTP Port:** 587 (किंवा 465).
   - **Use TLS:** होय (587 साठी); किंवा Use SSL (465 साठी).
   - **Default user e-mail suffix:** जर लागत असेल.
   - **Use SMTP Authentication:** होय.
   - **User Name** आणि **Password:** same credentials (e.g. Gmail + App Password).
4. **Save**.

जर हे सेट नसेल तर मेल येऊ शकतो (built-in mail) पण attachment नाही; `emailext` वापरलं तर "Connection error" येऊ शकतो. दोन्ही (E-mail Notification + Extended E-mail Notification) एकाच SMTP ने भरल्यावर attachment सह मेल जातो.

---

## 2. Playwright Job नंतर Email कसं येतं

या repo मधला **Jenkinsfile** आधीच असं करतो:

- **Build FAIL** (Playwright tests fail) → `post { failure { ... } }` → तुम्ही सेट केलेल्या recipients ला **failure** mail.
- **Build SUCCESS** → `post { success { ... } }` → **success** mail.

Recipients बदलण्यासाठी Jenkinsfile मधला `RECIPIENTS` किंवा job मधला parameter/credential वापरा (खाली सांगितलं).

---

## 3. कोणाला mail पाठवायचं (Recipients)

- **Jenkinsfile मध्ये:** `def recipients = env.EMAIL_RECIPIENTS ?: 'nikhil.medhe@firstsource.com'` — यात आपले email किंवा comma-separated list द्या: `'a@co.com, b@co.com'`.
- **किंवा Job/Global variable:** `EMAIL_RECIPIENTS` set करा (Manage Jenkins → System → Global properties, किंवा Job → Configure → Environment).

## 4. Mail मध्ये काय येतं (Subject + Body + Test Result)

- **Subject (PASS):** `[PASS] Playwright <JobName> #<BuildNumber> – <Suite>`
- **Subject (FAIL):** `[FAIL] Playwright <JobName> #<BuildNumber> – <Suite>`
- **Body:** Job name, Build #, Suite, **Tests: X passed, Y failed (total Z)**, + Playwright Report link + Console link.

हर run नंतर (pass किंवा fail) mail मध्ये test result summary (passed/failed count) आणि report link असतो.

---

## 5. Local: Test run झाल्यावर report मेल (config)

**जेव्हा तुम्ही tests चालवाल तेव्हाच report मेल पण जावा** असं हवं असेल तर ही config वापरा.

### Step 1: .env मध्ये SMTP सेट करा

Project root मध्ये `.env` फाइल (उदा. `D:\Playwright_old\playwright-ts\.env`):

```
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=automation.qa.reports@gmail.com
SMTP_PASS=<Gmail App Password>
EMAIL_TO=nikhil.medhe@firstsource.com
```

Gmail साठी **App Password** वापरा (साधा password नाही).

### Step 2: Tests चालवण्यासाठी हेच commands वापरा

| काय चालवायचं | Command | मेल |
|---------------|---------|-----|
| सर्व tests + report मेल | **`npm run test`** | होय (run संपल्यावर आपोआप) |
| फक्त OrderSubmission + report मेल | **`npm run order`** किंवा **`npm run test:order`** | होय (run संपल्यावर आपोआप) |
| Tests बिना मेल | `npm run test:no-email` किंवा `npm run test:order:no-email` | नाही |
| फक्त मेल test (कोणती test नाही) | `npm run email:test` | एक test मेल पाठवतो |

**महत्त्व:** Report मेल पाठवण्यासाठी **`npm run test`** किंवा **`npm run order`** वापरा. **`npx playwright test ...`** थेट चालवल्यास मेल जात नाही.

मेल **From:** SMTP_USER, **To:** EMAIL_TO (जे .env मध्ये दिलं असेल ते).
