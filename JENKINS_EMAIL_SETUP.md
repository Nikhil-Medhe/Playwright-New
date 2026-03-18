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
