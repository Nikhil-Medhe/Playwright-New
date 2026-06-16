# Playwright Framework — Industry Guide

> **Full guide (scratch → advanced):** see **[GUIDE.md](./GUIDE.md)** — structure, imports, flows, individual vs full run, dependencies, everything.

Thomas Navigator / CatNav automation with **Page Object Model**, **environment targets**, **flow stacks**, and **tag-based** test selection.

## Structure

```
config/
  urls.ts              — URL builders (BASE_URL, PUB_CATALOG_URL)
  env.ts               — ENV + timeout
  flow-stacks.js       — Named dependency-ordered stacks
  test-tags.ts         — Tag constants
pages/
  common/              — Shared POM (Login, Cart, OM, WM, CheckoutPayment)
  qam/                 — QAM pub catalog pages
  automationqa-prod/   — Automationqa prod catalog pages
tests/
  qam/                 — nikhil QAM suite (12 specs)
  automationqa-prod/   — Automationqa PROD suite (11 specs)
helpers/
  ensureOrderRef.ts    — Self-contained OM order bootstrap
scripts/
  run-tests-by-target.js
  run-flow-happy.js    — Happy path only
  run-flow-stack.js    — Stack runner
  validate-framework.js
```

Legacy specs under `tests/*.spec.ts` are **ignored** by `playwright.config.ts`.

---

## Environments

| Target | Command prefix | Tools URL | Pub catalog |
|--------|----------------|-----------|-------------|
| QAM | `npm run test:qam` | tools.cn-qam-stage.catnav.us | nikhil.cn-qam-pub.catnav.us |
| PROD | `npm run test:prod` | tools.thomasnet-navigator.com | automationqa.thomasnet-navigator.com |

Credentials:
- QAM: `Data/credentials.json`
- PROD: `Data/automationqa-credentials.json`

---

## Tags (industry standard)

| Tag | Meaning |
|-----|---------|
| `@qam` / `@prod` | Environment suite |
| `@smoke` | Fast pub checks (keyword, compare, pdf) |
| `@pub` | Public catalog browsing |
| `@commerce` | Cart / checkout |
| `@order` | Order Manager |
| `@tools` | Tools login (WM, CM, OM) |
| `@pcat` | PCAT pvtcat |
| `@regression` | Full suite member |
| `@flaky` | Excluded by default (`grepInvert`) |

```bash
# Smoke only
npm run test:prod:smoke -- --project=chrome

# Commerce flows
npm run test:qam:commerce -- --project=chrome

# Custom grep
npm run test:prod -- --grep "@order"
```

---

## Flow stacks (dependency order)

```bash
npm run stack:list
npm run stack:prod:list

npm run stack:prod:order-full -- --project=chrome --headed
npm run stack:qam:smoke -- --project=chrome
npm run stack:prod:happy-all -- --workers=1
```

| Stack | Steps |
|-------|-------|
| `order` | OM only (auto checkout if no order ref) |
| `order-full` | cad1 → OM |
| `smoke` | keyword → compare → pdf |
| `pub` | browsing flows |
| `commerce` | order-submit → promotions → pcat |
| `tools` | catalog manager |
| `happy-all` | full happy-path regression |

Stacks run **happy path only** and **stop on first failure**.

---

## Order Manager dependency

Priority for order number:
1. `ORDER_REF` env
2. `test-results/last-order-ref.txt`
3. **Auto** pub checkout (`ensureOrderRef`)

```bash
npm run test:prod:order -- --project=chrome   # self-contained
```

---

## Payment abstraction

`pages/common/CheckoutPayment.ts` — COD / Stripe with auto-fallback.

```bash
PAYMENT_METHOD=cod      # force COD
PAYMENT_METHOD=stripe   # force Stripe
PAYMENT_METHOD=auto     # default — COD then Stripe
```

---

## CI / Jenkins

**Validate (no browser):**
```bash
npm run validate
```

**GitHub Actions:** `.github/workflows/playwright.yml`
- Push/PR: validate + prod smoke stack
- Manual: pick target + stack

**Jenkins:** `FLOW_STACK` parameter (smoke, order-full, happy-all, …) overrides `TEST_SUITE` when not `none`.

---

## Reporting

- HTML: `playwright-reports/run-YYYY-MM-DD_HH-mm-ss/`
- JUnit: `test-results/junit.xml`
- Email: `npm run test:prod:chrome:email` (requires `.env` SMTP)

---

## Quick commands

```bash
npm run validate
npm run test:prod -- --project=chrome              # full regression
npm run test:prod:smoke -- --project=chrome        # tag smoke
npm run stack:prod:order-full -- --project=chrome  # WM + OM chain
npm run test:prod:order -- --project=chrome --headed
```
