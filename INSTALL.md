# Playwright project – step-by-step install

## 1. Install Node.js

- Download the **LTS** version from [nodejs.org](https://nodejs.org/) (e.g. 18 or 20).
- Install it. Verify in Terminal/CMD:
  ```bash
  node -v
  npm -v
  ```
  If both versions appear, you are good.

---

## 2. Go to the project folder

```bash
cd d:\Playwright_old\playwright-ts
```
(or your project path)

---

## 3. Install dependencies

```bash
npm install
```

This installs all packages from `package.json` (Playwright, etc.).

---

## 4. Install Playwright browsers

```bash
npx playwright install chromium
```

For Chromium (Chrome) only. To install all browsers (Chromium, Firefox, WebKit):

```bash
npx playwright install
```

---

## 5. (Optional) Environment variables

Copy `.env.example` to `.env` and edit as needed:

```bash
copy .env.example .env
```

In `.env` you can set `ENV`, `BASE_URL`, `HEADLESS`, etc.

---

## 6. Run tests

All tests (report email is sent after the run if SMTP is set in `.env`):

```bash
npm run test
```

Headed (browser visible):

```bash
npm run test:headed
```

Slow run (watch step-by-step):

```bash
npm run test:slow
```

UI mode (interactive):

```bash
npm run test:ui
```

---

## 7. Where reports are created

- **HTML report:** `playwright-reports/run-YYYY-MM-DD_HH-mm-ss/index.html`
- **Screenshots/videos:** `test-results/run-YYYY-MM-DD_HH-mm-ss/`

After a run, open `index.html` from that folder in a browser to view the report.

---

## Summary (copy-paste)

```bash
cd d:\Playwright_old\playwright-ts
npm install
npx playwright install chromium
npm run test
```
