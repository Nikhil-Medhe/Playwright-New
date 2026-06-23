# Email not arriving — troubleshooting (Local + Jenkins)

## Local — email not arriving

1. **Run:** `npm run email:test`  
   - If the terminal shows "Email sent to nikhil.medhe@firstsource.com" = SMTP OK.  
   - If an error appears, read the message (e.g. SMTP credentials missing / authentication failed).

2. **Check `.env`** (project root):
   - `SMTP_USER=automation.qa.reports@gmail.com`
   - `SMTP_PASS=` **Gmail App Password** (not your regular password; Google Account → Security → App passwords)
   - `EMAIL_TO=nikhil.medhe@firstsource.com`

3. **If you want email when running tests:**  
   Use `npm run order` or `npm run test:order` (not raw `npx playwright test ...`).

4. Check the **Spam / Junk** folder.

---

## Jenkins — email not arriving

1. **Manage Jenkins** → **System** → **E-mail Notification**:
   - Are SMTP server, port, User Name (automation.qa.reports@gmail.com), and Password (App Password) filled in?
   - Click **Test configuration** — does it show "Email was successfully sent"?

2. Open **Build Console Output**:
   - Did the mail/emailext step in post run? What error line appears?

3. **Build status:** If the build **failed**, `post { failure { ... } }` runs; if **success**, `post { success { ... } }` runs. Both include a mail step.

4. Recipient: `nikhil.medhe@firstsource.com` is in the Jenkinsfile. Also check company mail filters / spam.

---

## Quick check

- **Local:** `npm run email:test` → email received = `.env` + SMTP OK. Then `npm run order` should also send email.
- **Jenkins:** Test configuration success in System = Jenkins SMTP OK. Email should be sent after build success/fail.
