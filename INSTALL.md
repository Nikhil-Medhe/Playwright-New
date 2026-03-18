# Playwright project – step-by-step install

## 1. Node.js install करा

- [nodejs.org](https://nodejs.org/) वरून **LTS** version download करा (उदा. 18 किंवा 20).
- Install करा. Terminal/CMD मध्ये check करा:
  ```bash
  node -v
  npm -v
  ```
  दोन्ही version दिसले तर ठीक.

---

## 2. Project folder मध्ये जा

```bash
cd d:\Playwright_old\playwright-ts
```
(किंवा तुमचा project path)

---

## 3. Dependencies install करा

```bash
npm install
```

हे `package.json` मधले सगळे packages (Playwright इ.) install करेल.

---

## 4. Playwright browsers install करा

```bash
npx playwright install chromium
```

फक्त Chromium (Chrome) साठी. सगळे browsers (Chromium, Firefox, WebKit) हवे असल्यास:

```bash
npx playwright install
```

---

## 5. (Optional) Environment variables

`.env.example` copy करून `.env` बनवा आणि गरजेनुसार edit करा:

```bash
copy .env.example .env
```

`.env` मध्ये `ENV`, `BASE_URL`, `HEADLESS` इ. set करू शकता.

---

## 6. Tests run करा

सगळे tests (run संपल्यावर report मेल पण जातो — .env मध्ये SMTP सेट असल्यास):

```bash
npm run test
```

Headed (browser दिसतो):

```bash
npm run test:headed
```

धीमे run (step-by-step बघायला):

```bash
npm run test:slow
```

UI mode (interactive):

```bash
npm run test:ui
```

---

## 7. Report कुठे बनतो

- **HTML report:** `playwright-reports/run-YYYY-MM-DD_HH-mm-ss/index.html`
- **Screenshots/videos:** `test-results/run-YYYY-MM-DD_HH-mm-ss/`

Run नंतर या folder मधला `index.html` browser मध्ये उघडून report बघता येईल.

---

## Summary (copy-paste)

```bash
cd d:\Playwright_old\playwright-ts
npm install
npx playwright install chromium
npm run test
```
