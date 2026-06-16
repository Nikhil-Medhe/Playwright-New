# Playwright Framework — Complete Guide (Scratch → Advanced)

> **कोणी विचारलं तर:** हा project **Page Object Model (POM)** वर आधारित Playwright + TypeScript framework आहे. दोन स्वतंत्र suites आहेत — **QAM (nikhil)** आणि **PROD (Automationqa)** — एकाच `pages/common/` वर. Tests, pages, helpers, config आणि scripts वेगळे पण pattern एकच.

---

## Table of contents

1. [First-time setup (scratch)](#1-first-time-setup-scratch)
2. [Framework architecture](#2-framework-architecture)
3. [Folder structure — प्रत्येक folder काय करतो](#3-folder-structure)
4. [QAM vs PROD — काय वेगळं](#4-qam-vs-prod)
5. [How a test run works (script pipeline)](#5-how-a-test-run-works)
6. [Run types: individual vs full vs stack](#6-run-types)
7. [All npm commands (cheat sheet)](#7-all-npm-commands)
8. [Flow mapping & dependencies](#8-flow-mapping--dependencies)
9. [Imports — कसं करायचं](#9-imports)
10. [Page Objects (POM)](#10-page-objects-pom)
11. [Helpers & test data](#11-helpers--test-data)
12. [Tags & filtering](#12-tags--filtering)
13. [Order Manager — order ref dependency](#13-order-manager--order-ref-dependency)
14. [Payment (COD / Stripe)](#14-payment-cod--stripe)
15. [Reports & email](#15-reports--email)
16. [CI & Jenkins](#16-ci--jenkins)
17. [Adding a new test (step-by-step)](#17-adding-a-new-test)
18. [Troubleshooting](#18-troubleshooting)

---

## 1. First-time setup (scratch)

### Prerequisites

- Node.js 18+ (LTS recommended)
- Google Chrome installed (or run `npx playwright install chrome`)
- VPN/network access to QAM or Thomas prod URLs
- Credential files (see below)

### Install

```bash
cd playwright-ts
npm ci
npx playwright install chrome
```

### Credentials (required)

| Target | File | Example |
|--------|------|---------|
| QAM | `Data/credentials.json` | nikhil login users |
| PROD | `Data/automationqa-credentials.json` | Automationqa login |

Copy from `Data/automationqa-credentials.example.json` for prod template.  
**Never commit real passwords** — files are gitignored.

### Optional `.env`

```bash
copy .env.example .env
```

Key variables:

```env
ENV=stage
HEADLESS=false
PLAYWRIGHT_WORKERS=2
PAYMENT_METHOD=auto
# ORDER_REF=12345678
```

### Validate (no browser)

```bash
npm run validate
```

Should print: `QAM specs: 12 | PROD specs: 11` and `[validate] OK`.

---

## 2. Framework architecture

```
┌─────────────────────────────────────────────────────────────┐
│  npm script (package.json)                                   │
│    test:prod:order  |  test:qam  |  stack:prod:smoke        │
└──────────────────────────┬──────────────────────────────────┘
                           ▼
┌─────────────────────────────────────────────────────────────┐
│  scripts/run-flow-happy.js  OR  run-tests-by-target.js      │
│    → sets ENV, BASE_URL, PUB_CATALOG_URL (target-env.js)    │
└──────────────────────────┬──────────────────────────────────┘
                           ▼
┌─────────────────────────────────────────────────────────────┐
│  scripts/run-tests-with-id.js → npx playwright test           │
│    playwright.config.ts (browsers, retries, testIgnore)      │
└──────────────────────────┬──────────────────────────────────┘
                           ▼
┌─────────────────────────────────────────────────────────────┐
│  tests/qam/*.spec.ts  OR  tests/automationqa-prod/*.spec.ts │
│    imports → pages/ + helpers/ + config/urls.ts             │
└─────────────────────────────────────────────────────────────┘
```

**Design principles (industry standard):**

- **POM** — UI locators & actions in `pages/`, not in tests
- **Separation by env** — `tests/qam` vs `tests/automationqa-prod`
- **Shared common layer** — `pages/common/` for Login, Cart, OM, WM
- **Env-driven URLs** — no hardcoded hosts in tests
- **Flow stacks** — dependency-ordered runs
- **Tags** — `@smoke`, `@commerce`, etc. for selective CI

---

## 3. Folder structure

```
playwright-ts/
├── config/
│   ├── env.ts              # ENV, baseURL, timeout (reads process.env)
│   ├── urls.ts             # PUB_CATALOG_BASE_URL, WM paths, cart URL regex
│   ├── flow-stacks.js      # Named stacks (order-full, smoke, …)
│   └── test-tags.ts        # Tag constants (@smoke, @commerce, …)
│
├── core/
│   └── BasePage.ts         # Base class for all page objects
│
├── pages/
│   ├── common/             # SHARED — both QAM & PROD
│   │   ├── LoginPage.ts
│   │   ├── CartPage.ts
│   │   ├── OrderManagerPage.ts
│   │   ├── WebsiteManagerPage.ts
│   │   ├── RequestInformationPage.ts
│   │   └── CheckoutPayment.ts   # COD / Stripe abstraction
│   ├── qam/                # QAM-only catalog pages
│   │   ├── PublicCatalogPage.ts
│   │   └── PcatCatalogPage.ts
│   └── automationqa-prod/  # PROD-only catalog pages
│       └── AutomationqaCatalogPage.ts
│
├── tests/
│   ├── qam/                # 12 spec files (nikhil QAM)
│   └── automationqa-prod/    # 11 spec files (Automationqa prod)
│
├── helpers/
│   ├── dataLoader.ts       # credentials.json loader
│   ├── ensureOrderRef.ts   # auto order for OM tests
│   ├── lastOrderRefArtifact.ts  # test-results/last-order-ref.txt
│   └── index.ts            # re-exports
│
├── fixtures/
│   └── index.ts            # optional Playwright fixtures (loggedInWM, etc.)
│
├── Data/
│   ├── credentials.json           # QAM (gitignored)
│   └── automationqa-credentials.json  # PROD (gitignored)
│
├── scripts/
│   ├── target-env.js       # qam/prod URL map
│   ├── run-tests-by-target.js
│   ├── run-flow-happy.js   # happy path only (--grep "happy path")
│   ├── run-flow-stack.js   # multi-flow sequential runner
│   ├── run-cad1-then-om.js
│   └── validate-framework.js
│
├── playwright.config.ts
├── package.json
├── FRAMEWORK.md            # Short industry reference
└── GUIDE.md                # This file (full guide)
```

**Ignored legacy paths** (`playwright.config.ts` → `testIgnore`):

- `tests/*.spec.ts` (old root specs)
- `tests/automationqa-*.spec.ts`
- `*recorded.spec.ts`

Active suites = **only** `tests/qam/` and `tests/automationqa-prod/`.

---

## 4. QAM vs PROD

| | QAM | PROD |
|---|-----|------|
| **Company** | nikhil | Automationqa |
| **Tools URL** | tools.cn-qam-stage.catnav.us | tools.thomasnet-navigator.com |
| **Pub catalog** | nikhil.cn-qam-pub.catnav.us | automationqa.thomasnet-navigator.com |
| **Test folder** | `tests/qam/` | `tests/automationqa-prod/` |
| **Catalog page** | `PublicCatalogPage` | `AutomationqaCatalogPage` |
| **Credentials** | `Data/credentials.json` | `Data/automationqa-credentials.json` |
| **Specs count** | 12 | 11 (no standalone `login.spec`) |

### Scenario mapping (same flow, different items)

| Scenario | QAM spec | PROD spec | QAM item | PROD item |
|----------|----------|-----------|----------|-----------|
| WM + checkout + OM | `cadSiteVersion1.spec.ts` | `testVersion.spec.ts` | Brake/Clutch PLP | Valve Cover Pro 1 |
| Order Manager | `orderManager.spec.ts` | `orderManager.spec.ts` | same pattern | same pattern |
| Order Submission | `OrderSubmission.spec.ts` | `orderSubmission.spec.ts` | Brake item | Valve Cover Pro 1 |
| Catalog Manager | `Catalogmanager.spec.ts` | `catalogManager.spec.ts` | nikhil CM | Automationqa CM |
| PCAT | `PCATBasicNavigation.spec.ts` | `pcatNavigation.spec.ts` | Discount category | Automotive pvtcat |
| Promotions | `Promotions.spec.ts` | `promotions.spec.ts` | promo `Sale` | promo `sale50` |
| Compare | `CompareItem.spec.ts` | `compareItem.spec.ts` | Brake + Cluch | Valve Cover + Valve Spring |
| Keyword | `Keyword search.spec.ts` | `keywordSearch.spec.ts` | cluch | valve cover pro |
| PDF / Email / RFI | same names | same names | Engine/Brake | Engine Parts |

---

## 5. How a test run works

Example: `npm run test:prod:order -- --project=chrome --headed`

```
1. package.json → "test:prod:order"
2. run-flow-happy.js prod tests/automationqa-prod/orderManager.spec.ts --project=chrome --headed
   → adds --grep "happy path" (unless --all passed)
3. run-tests-by-target.js prod …
   → target-env.js sets:
      ENV=prod
      BASE_URL=https://tools.thomasnet-navigator.com
      PUB_CATALOG_URL=https://automationqa.thomasnet-navigator.com
      LOGIN_USERS_FILE=Data/automationqa-credentials.json
4. run-tests-with-id.js → PLAYWRIGHT_RUN_ID=run-2026-06-16_17-30-00
5. npx playwright test tests/automationqa-prod/orderManager.spec.ts --grep "happy path" --project=chrome --headed
6. playwright.config.ts loads envConfig.baseURL from step 3
7. Spec runs → imports pages/helpers → browser actions
8. Report: playwright-reports/run-…/index.html
```

---

## 6. Run types

### A) Individual flow (एक scenario)

Happy path only (recommended for daily use):

```bash
npm run test:prod:order -- --project=chrome --headed
npm run test:prod:compare -- --project=chrome
npm run test:cad1 -- --project=chrome          # QAM WM flow
npm run test:qam:order -- --project=chrome
```

With **all tests** in that spec (negatives + happy):

```bash
npm run test:prod:order -- --all --project=chrome
```

### B) Full suite (सर्व specs, negatives included)

```bash
npm run test:prod -- --project=chrome --workers=1
npm run test:qam -- --project=chrome --workers=1
```

- PROD: ~31 tests (11 files × negatives + happy)
- QAM: ~32 tests (12 files; includes `login.spec.ts`)

### C) Flow stack (dependency order, happy only)

```bash
npm run stack:prod:order-full -- --project=chrome --headed
npm run stack:prod:smoke -- --project=chrome
npm run stack:prod:happy-all -- --workers=1
npm run stack:list
```

### D) Tag-based run

```bash
npm run test:prod:smoke -- --project=chrome      # @smoke only
npm run test:prod:commerce -- --project=chrome  # @commerce only
npm run test:prod -- --grep "@order" --project=chrome
```

### E) With email report

```bash
npm run test:prod:chrome:email -- --headed
npm run test:qam:chrome:email
```

Requires `.env` SMTP settings (`SMTP_USER`, `SMTP_PASS`, `EMAIL_TO`).

---

## 7. All npm commands

### Full suites

| Command | What runs |
|---------|-----------|
| `npm run test:qam` | All `tests/qam/` (negatives + happy) |
| `npm run test:prod` | All `tests/automationqa-prod/` |

### PROD individual flows

| Command | Spec |
|---------|------|
| `test:prod:cad1` | testVersion (WM → checkout → OM) |
| `test:prod:order` | orderManager |
| `test:prod:catalogmanager` | catalogManager |
| `test:prod:compare` | compareItem |
| `test:prod:pdf` | downloadPDF |
| `test:prod:email` | emailThisPage |
| `test:prod:keyword` | keywordSearch |
| `test:prod:order-submit` | orderSubmission |
| `test:prod:promotions` | promotions |
| `test:prod:rfi` | requestInformation |
| `test:prod:pcat` | pcatNavigation |
| `test:prod:cad1-then-om` | testVersion → orderManager |

### QAM individual flows

| Command | Spec |
|---------|------|
| `test:cad1` | cadSiteVersion1 |
| `test:qam:order` | orderManager |
| `test:cad1-then-om` | cadSiteVersion1 → orderManager |
| `test:catalogmanager:qam` | Catalogmanager |
| `test:pcat:qam` | PCATBasicNavigation |
| `test:rfi` | RequestInformation |

### Stacks

| Command | Stack |
|---------|-------|
| `stack:prod:smoke` | keyword → compare → pdf |
| `stack:prod:order` | OM only |
| `stack:prod:order-full` | cad1 → OM |
| `stack:prod:commerce` | order-submit → promotions → pcat |
| `stack:prod:happy-all` | all flows in order |
| `stack:qam:*` | same pattern for QAM |

### Utility

| Command | Purpose |
|---------|---------|
| `npm run validate` | Check structure + credentials (no browser) |
| `npm run report` | Open latest HTML report |
| `npm run test:ui` | Playwright UI mode |

**Playwright CLI passthrough** — always append after `--`:

```bash
npm run test:prod:order -- --project=chrome --headed --workers=1 --debug
```

---

## 8. Flow mapping & dependencies

### Dependency types

```
┌─────────────────────────────────────────┐
│ STANDALONE — कोणतीही prior run नको      │
│  compare, pdf, email, keyword, rfi,     │
│  catalogmanager                         │
└─────────────────────────────────────────┘

┌─────────────────────────────────────────┐
│ CHECKOUT — order तयार करतो (optional)   │
│  order-submit, promotions, pcat, cad1   │
│  → writes test-results/last-order-ref.txt│
└─────────────────────────────────────────┘

┌─────────────────────────────────────────┐
│ ORDER MANAGER — order number हवा        │
│  Priority:                              │
│   1. ORDER_REF env                      │
│   2. last-order-ref.txt                 │
│   3. ensureOrderRef() auto checkout     │
└─────────────────────────────────────────┘
```

### Visual: `order-full` stack (PROD)

```
Step 1: testVersion.spec.ts
  Login → WM → Test Version → pub catalog tab
  → Engine Parts PLP → Valve Cover Pro 1
  → cart → checkout → thank you
  → OM verify → writeLastOrderRef()

Step 2: orderManager.spec.ts
  → read order ref → OM login → search → verify row
```

### Visual: `happy-all` stack order

```
catalogmanager → cad1 → order → keyword → compare → pdf
  → email → rfi → order-submit → promotions → pcat
```

---

## 9. Imports

### Rule: relative paths from spec file

From `tests/automationqa-prod/orderManager.spec.ts`:

```typescript
// Playwright
import { test, expect } from '@playwright/test';

// Helpers (../../helpers/)
import { ensureOrderRef } from '../../helpers/ensureOrderRef';
import { getDefaultLoginUser } from '../../helpers/dataLoader';

// Common pages (../../pages/common/)
import { LoginPage } from '../../pages/common/LoginPage';
import { OrderManagerPage, ORDER_MANAGER_HOME } from '../../pages/common/OrderManagerPage';

// Env-specific catalog page (../../pages/automationqa-prod/)
import { AutomationqaCatalogPage } from '../../pages/automationqa-prod/AutomationqaCatalogPage';

// Config URLs (../../config/)
import { PUB_CATALOG_BASE_URL } from '../../config/urls';
```

From `tests/qam/OrderSubmission.spec.ts`:

```typescript
import { PublicCatalogPage } from '../../pages/qam/PublicCatalogPage';
import { CartPage } from '../../pages/common/CartPage';
import { PUB_CATALOG_BASE_URL } from '../../config/urls';
```

### Import cheat sheet

| Need | Import from |
|------|-------------|
| Pub catalog URL | `config/urls` → `PUB_CATALOG_BASE_URL` |
| Tools / WM URL | `config/urls` → `toolsWebsiteManagerVersionsUrl()` |
| Order Manager URL | `pages/common/OrderManagerPage` → `ORDER_MANAGER_HOME` |
| Login | `pages/common/LoginPage` |
| Cart / checkout | `pages/common/CartPage` |
| Payment step | `pages/common/CheckoutPayment` → `selectPaymentOnStep2` |
| QAM catalog nav | `pages/qam/PublicCatalogPage` |
| PROD catalog nav | `pages/automationqa-prod/AutomationqaCatalogPage` |
| Credentials | `helpers/dataLoader` → `getDefaultLoginUser()` |
| Order ref bootstrap | `helpers/ensureOrderRef` → `ensureOrderRef(page, 'prod')` |
| Optional fixtures | `fixtures/index` → `test` (extends base) |

### ❌ Do NOT

- Hardcode `https://nikhil...` or `https://automationqa...` in tests
- Import QAM pages in PROD specs (use `AutomationqaCatalogPage`)
- Put locators in spec files (use Page Objects)

---

## 10. Page Objects (POM)

### Layer model

```
BasePage (core/BasePage.ts)
  └── LoginPage, CartPage, OrderManagerPage, …
  └── PublicCatalogPage (qam)
  └── AutomationqaCatalogPage (prod)
```

### Common pages (both envs)

| Page | Responsibility |
|------|----------------|
| `LoginPage` | Tools login, WM login, OM login, invalid creds |
| `WebsiteManagerPage` | Open WM versions, open catalog tab, Test Version |
| `CartPage` | View cart resolve, checkout flows, promo, PCAT checkout |
| `OrderManagerPage` | Search order, expect row, parse thank-you ref |
| `RequestInformationPage` | RFI multi-step form |
| `CheckoutPayment` | COD / Stripe selection on payment step |

### Env-specific pages

| Page | Used by |
|------|---------|
| `PublicCatalogPage` | QAM specs — Engine parts, Brake PLP, compare, keyword |
| `AutomationqaCatalogPage` | PROD specs — Automotive, Engine Parts, Valve Cover Pro 1 |
| `PcatCatalogPage` | QAM PCAT discount flow |

### Example: test uses POM (not raw locators)

```typescript
// ✅ Good — logic in page object
const catalog = new AutomationqaCatalogPage(page);
await catalog.navigateToEnginePartsPlpFromHome();
const cart = await catalog.addValveCoverPro1ToCartAndResolveCart(page);
const checkout = new CartPage(cart);
await checkout.runCadSiteVersion1CheckoutFromCartLanding();

// ❌ Bad — locators in spec
await page.getByRole('link', { name: 'Automotive' }).click();
await page.locator('tr').filter({ hasText: 'Valve Cover' })...
```

---

## 11. Helpers & test data

### `dataLoader.ts`

Loads `Data/credentials.json` or path from `LOGIN_USERS_FILE` env (set by `target-env.js` per target).

```typescript
const user = getDefaultLoginUser();
// { company, username, password }
```

### `ensureOrderRef.ts`

OM tests साठी order number — self-contained:

```typescript
const orderRef = await ensureOrderRef(page, 'prod');
// 1. ORDER_REF env?
// 2. test-results/last-order-ref.txt?
// 3. else → pub catalog checkout → write file → return ref
```

### `lastOrderRefArtifact.ts`

```typescript
writeLastOrderRef('12345678');  // after checkout thank-you
readLastOrderRef();             // before OM search
```

---

## 12. Tags & filtering

Tags are on `test.describe` or `test()`:

```typescript
test.describe('Automationqa — Compare Items', {
  tag: ['@prod', '@pub', '@smoke', '@regression'],
}, () => { ... });
```

| Tag | Use |
|-----|-----|
| `@smoke` | Fast CI smoke (keyword, compare, pdf) |
| `@pub` | Pub catalog browsing |
| `@commerce` | Cart / checkout |
| `@order` | Order Manager |
| `@tools` | Tools login flows |
| `@pcat` | PCAT flows |
| `@regression` | Full suite member |
| `@flaky` | Auto-skipped (grepInvert in config) |

```bash
npm run test:prod:smoke -- --project=chrome
npm run test:prod -- --grep "@commerce" --project=chrome
```

---

## 13. Order Manager — order ref dependency

### Three ways to supply order number

```bash
# 1. Environment variable
$env:ORDER_REF="12345678"
npm run test:prod:order -- --project=chrome

# 2. Previous checkout wrote file (automatic)
npm run test:prod:cad1 -- --project=chrome   # writes last-order-ref.txt
npm run test:prod:order -- --project=chrome  # reads it

# 3. Nothing — test auto-creates order (ensureOrderRef)
npm run test:prod:order -- --project=chrome --headed
```

---

## 14. Payment (COD / Stripe)

`pages/common/CheckoutPayment.ts` — env-aware:

```env
PAYMENT_METHOD=auto    # default: try COD, then Stripe
PAYMENT_METHOD=cod
PAYMENT_METHOD=stripe
```

Used by `CartPage`, `OrderSubmission`, promotions, PCAT checkout paths.

---

## 15. Reports & email

### After any run

```bash
npm run report
```

Paths:

- HTML: `playwright-reports/run-YYYY-MM-DD_HH-mm-ss/index.html`
- JUnit: `test-results/junit.xml`
- Artifacts: `test-results/run-…/` (screenshots, videos on failure)

### Email

```bash
npm run test:prod:chrome:email
```

`.env` needs: `SMTP_HOST`, `SMTP_USER`, `SMTP_PASS`, `EMAIL_TO`

---

## 16. CI & Jenkins

### Local validate

```bash
npm run validate
```

### GitHub Actions (`.github/workflows/playwright.yml`)

- On push/PR: validate + prod smoke stack
- Manual dispatch: pick target + stack

### Jenkins

Parameters:

- `RUN_TARGET`: `qam` | `prod`
- `BROWSER`: `chrome` | `edge` | `firefox`
- `TEST_SUITE`: individual spec or `all`
- `FLOW_STACK`: `smoke` | `order-full` | `happy-all` | … (overrides TEST_SUITE when not `none`)

---

## 17. Adding a new test

### PROD example: new pub flow

1. **Page method** (if needed) → `pages/automationqa-prod/AutomationqaCatalogPage.ts`
2. **Spec** → `tests/automationqa-prod/myNewFlow.spec.ts`
3. **Tags** on describe: `{ tag: ['@prod', '@pub', '@regression'] }`
4. **npm script** in `package.json`:
   ```json
   "test:prod:myflow": "node scripts/run-flow-happy.js prod tests/automationqa-prod/myNewFlow.spec.ts"
   ```
5. **flow-stacks.js** (optional) — add flow id + add to a stack
6. **Run:**
   ```bash
   npm run test:prod:myflow -- --project=chrome --headed
   ```

### Spec template

```typescript
import { test, expect } from '@playwright/test';
import { PUB_CATALOG_BASE_URL } from '../../config/urls';
import { AutomationqaCatalogPage } from '../../pages/automationqa-prod/AutomationqaCatalogPage';

test.use({ ignoreHTTPSErrors: true });

test.describe('Automationqa — My Flow', { tag: ['@prod', '@pub', '@regression'] }, () => {
  test('negative: …', async ({ page }) => {
    test.setTimeout(60_000);
    // ...
  });

  test('happy path: …', async ({ page }) => {
    test.setTimeout(120_000);
    const catalog = new AutomationqaCatalogPage(page);
    await page.goto(PUB_CATALOG_BASE_URL, { waitUntil: 'domcontentloaded' });
    // use page object methods only
  });
});
```

---

## 18. Troubleshooting

| Problem | Solution |
|---------|----------|
| `Executable doesn't exist` (playwright) | `npx playwright install chrome` |
| OM test skips / no order | Use `test:prod:order` (auto `ensureOrderRef`) or run `cad1` first |
| COD payment fail on QAM | Enable COD on catalog or `PAYMENT_METHOD=stripe` |
| Parallel checkout conflicts | `--workers=1` |
| Wrong environment URLs | Use `npm run test:prod` not raw `npx playwright test` |
| Credentials error | Check `Data/credentials.json` or `automationqa-credentials.json` |
| Legacy specs running | Only use `tests/qam` or `tests/automationqa-prod` paths |
| Email not sent | Use `*:chrome:email` scripts + `.env` SMTP vars |

---

## Quick reference card

```bash
# Setup
npm ci && npx playwright install chrome && npm run validate

# Daily PROD
npm run test:prod:order -- --project=chrome --headed
npm run stack:prod:smoke -- --project=chrome

# Full regression
npm run test:prod -- --project=chrome --workers=1

# Full WM + OM chain
npm run stack:prod:order-full -- --project=chrome --headed

# List stacks
npm run stack:prod:list
```

---

*For short reference see `FRAMEWORK.md`. For Jenkins setup see `JENKINS_SETUP.md`.*
