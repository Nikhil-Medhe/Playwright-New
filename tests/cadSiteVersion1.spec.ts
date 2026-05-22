/**
 * CAD Site Version 1 — same scenarios for **QAM**, **CatNav prod**, **Thomas Navigator**.
 * URLs come from `BASE_URL`, `PUB_CATALOG_URL`, optional `WM_VERSIONS_PATH`, `PUB_CATALOG_SITE_LINK` (loaded before imports via `config/env`).
 *
 * Dynamic suite (recommended): `npm run test:cad1 -- <qam|prod|navigator>` → sets ENV + URLs via `scripts/run-tests-by-target.js`.
 *
 * Examples:
 *   npm run test:cad1 -- qam
 *   npm run test:cad1 -- prod          — Thomas tools + pub (same as `navigator`)
 *   npm run test:cad1 -- catnav        — legacy `tools.catnav.us` (only if DNS/VPN resolves)
 *   npm run test:cad1 -- navigator --headed
 *
 * Aliases: `npm run test:cad1prod`, `npm run test:cad1navigator`, `npm run test:qam -- tests/cadSiteVersion1.spec.ts`
 */
import { test, expect } from '@playwright/test';
import { envConfig } from '../config/env';
import {
  toolsWebsiteManagerVersionsUrl,
  defaultPubCatalogSiteLinkLabel,
  toolsBaseUrl,
  WM_VERSIONS_PATH,
} from '../config/urls';
import { LoginPage } from '../pages/LoginPage';
import { WebsiteManagerPage } from '../pages/WebsiteManagerPage';
import { CartPage } from '../pages/CartPage';
import { OrderManagerPage, ORDER_MANAGER_HOME } from '../pages/OrderManagerPage';
import { writeLastOrderRef } from '../helpers/lastOrderRefArtifact';
import { getDefaultLoginUser } from '../helpers/dataLoader';

function cadSuiteProfile(): string {
  const h = toolsBaseUrl();
  if (/thomasnet-navigator\.com/i.test(h)) return 'Thomas Navigator';
  if (/tools\.catnav\.us/i.test(h)) return 'CatNav prod';
  return 'QAM / stage';
}

/** Playwright tag: prod-like hosts vs QAM (matches `ENV` from `run-tests-by-target.js`). */
function cadSuiteTag(): string {
  return envConfig.envName === 'prod' ? '@cad-prod' : '@cad-qam';
}

test.use({
  ignoreHTTPSErrors: true,
});

test.describe(`CAD Site Version 1 — ${cadSuiteProfile()}`, { tag: cadSuiteTag() }, () => {
  test('negative flow: unauthenticated WebSite Manager redirects to login', async ({ page }) => {
    test.setTimeout(60_000);
    await page.goto(toolsWebsiteManagerVersionsUrl(), { waitUntil: 'domcontentloaded' });
    await expect(page).toHaveURL(/login/i, { timeout: 20_000 });
  });

  test('negative flow: invalid login credentials', async ({ page }) => {
    test.setTimeout(60_000);
    const loginPage = new LoginPage(page);
    await loginPage.goto(WM_VERSIONS_PATH);
    await loginPage.attemptSignIn(
      {
        company: 'nikhil',
        username: 'nikhilmedhe',
        password: 'WrongPassword_NotReal_999!',
      },
      { value: '30' },
    );
    await expect(page).toHaveURL(/login/i, { timeout: 20_000 });
    await expect(loginPage.invalidCredentialsMessage()).toBeVisible({ timeout: 15_000 });
  });

  test('negative flow: unauthenticated Order Manager redirects to login', async ({ page }) => {
    test.setTimeout(60_000);
    await page.goto(ORDER_MANAGER_HOME, { waitUntil: 'domcontentloaded' });
    await expect(page).toHaveURL(/login/i, { timeout: 20_000 });
  });

  test('happy path: WM → catalog → checkout → thank you → Order Manager', async ({ page }) => {
    test.setTimeout(240_000);

    const loginPage = new LoginPage(page);
    await loginPage.goto(WM_VERSIONS_PATH);
    await loginPage.loginToWebsiteManager(getDefaultLoginUser());

    const websiteManager = new WebsiteManagerPage(page);
    await websiteManager.openCadSiteVersionDetails();

    const catalogPage = await websiteManager.openPubCatalogInNewTab(defaultPubCatalogSiteLinkLabel());
    const cartCatalog = new CartPage(catalogPage);
    await cartCatalog.navigateEngineBrakeClutchPlpPage2AndOpenAddToCartDialog();

    const cart = await CartPage.clickViewCartInDialogAndResolveCartCad(catalogPage, page);
    const checkout = new CartPage(cart);
    await checkout.runCadSiteVersion1CheckoutFromCartLanding();

    const orderRef = await checkout.readThankYouOrderReference();
    expect(orderRef, 'parsed order ref should be digits only').toMatch(/^\d+$/);
    writeLastOrderRef(orderRef);

    await test.step('Order Manager: find order by number', async () => {
      const om = new OrderManagerPage(page);
      await om.gotoOrderHome();
      await om.searchByOrderNumber(orderRef);
      await om.expectOrderRowExists(orderRef);
    });

    await cart.getByRole('button', { name: /Continue Shopping/i }).first().click();
  });
});
