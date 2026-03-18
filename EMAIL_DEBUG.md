# Mail नाही आल्यावर तपासा (Local + Jenkins)

## Local — मेल येत नाही

1. **चालवा:** `npm run email:test`  
   - Terminal मध्ये "Email sent to nikhil.medhe@firstsource.com" दिसलं = SMTP OK.  
   - Error दिसलं = तो message वाचा (उदा. SMTP credentials missing / authentication failed).

2. **.env तपासा** (project root मध्ये):
   - `SMTP_USER=automation.qa.reports@gmail.com`
   - `SMTP_PASS=` **Gmail App Password** (साधा password नाही; Google Account → Security → App passwords)
   - `EMAIL_TO=nikhil.medhe@firstsource.com`

3. **Test चालवताना मेल हवा असेल तर:**  
   `npm run order` किंवा `npm run test:order` वापरा (थेट `npx playwright test ...` नाही).

4. **Spam / Junk** folder पहा.

---

## Jenkins — मेल येत नाही

1. **Manage Jenkins** → **System** → **E-mail Notification**:
   - SMTP server, port, User Name (automation.qa.reports@gmail.com), Password (App Password) भरलेले आहेत का?
   - **Test configuration** क्लिक करा — तिथे "Email was successfully sent" दिसतं का?

2. **Build Console Output** उघडा:
   - post मधला mail/emailext step चालला का? कोणती error line दिसते?

3. **Build status:** जर build **fail** झाला असेल तर post { failure { ... } } चालतो; जर **success** असेल तर post { success { ... } } चालतो. दोन्हीमध्ये मेल step आहे.

4. Recipient: Jenkinsfile मध्ये `nikhil.medhe@firstsource.com` आहे. Company mail filter / spam पण पहा.

---

## एकदा तपासा

- **Local:** `npm run email:test` → मेल आला = .env + SMTP ठीक. मग `npm run order` चालवल्यावर पण मेल येईल.
- **Jenkins:** System मध्ये Test configuration success = Jenkins SMTP ठीक. मग build success/fail झाल्यावर मेल जाईल.
