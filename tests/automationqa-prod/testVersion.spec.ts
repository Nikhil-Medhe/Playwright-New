/**
 * Automationqa PROD — Test Version (same flow as QAM `cadSiteVersion1.spec.ts`).
 * WM → Test Version catalog → Engine Parts PLP → Valve Cover Pro 1 → checkout → thank you → OM.
 *
 * Run: npm run test:prod:cad1 -- --project=chrome
 *      npm run test:prod:testversion  (alias)
 */
import { test, expect } from '@playwright/test';
import {
  toolsWebsiteManagerVersionsUrl,
  WM_VERSIONS_PATH,
  PUB_CATALOG_BASE_URL,
} from '../../config/urls';
import { LoginPage } from '../../pages/common/LoginPage';
import { WebsiteManagerPage } from '../../pages/common/WebsiteManagerPage';
import { AutomationqaCatalogPage } from '../../pages/automationqa-prod/AutomationqaCatalogPage';
import { CartPage } from '../../pages/common/CartPage';
import { OrderManagerPage, ORDER_MANAGER_HOME } from '../../pages/common/OrderManagerPage';
import { writeLastOrderRef } from '../../helpers/lastOrderRefArtifact';
import { getDefaultLoginUser } from '../../helpers/dataLoader';

test.use({
  ignoreHTTPSErrors: true,
});

test.describe('Automationqa — Test Version (CAD-style)', { tag: ['@prod', '@commerce', '@order', '@tools', '@regression'] }, () => {
  test('negative: unauthenticated Website Manager redirects to login', async ({ page }) => {
    test.setTimeout(60_000);
    await page.goto(toolsWebsiteManagerVersionsUrl(), { waitUntil: 'domcontentloaded' });
    await expect(page).toHaveURL(/login/i, { timeout: 20_000 });
  });

  test('negative: invalid login credentials', async ({ page }) => {
    test.setTimeout(60_000);
    const loginPage = new LoginPage(page);
    await loginPage.goto(WM_VERSIONS_PATH);
    await loginPage.attemptSignIn(
      {
        company: 'Automationqa',
        username: 'Automationqa',
        password: 'WrongPassword_NotReal_999!',
      },
      { value: '30' },
    );
    await expect(page).toHaveURL(/login/i, { timeout: 20_000 });
    await expect(loginPage.invalidCredentialsMessage()).toBeVisible({ timeout: 15_000 });
  });

  test('negative: unauthenticated Order Manager redirects to login', async ({ page }) => {
    test.setTimeout(60_000);
    await page.goto(ORDER_MANAGER_HOME, { waitUntil: 'domcontentloaded' });
    await expect(page).toHaveURL(/login/i, { timeout: 20_000 });
  });

  test('negative: pub catalog — fake item URL shows not found or leaves catalog', async ({ page }) => {
    test.setTimeout(60_000);
    await page.goto(`${PUB_CATALOG_BASE_URL}item/does-not-exist/fake-item-999`, {
      waitUntil: 'domcontentloaded',
    });
    const notFound = page.getByText(/not found|page cannot be found|error/i);
    const onCatalog = page.getByRole('heading', { name: /all categories/i });
    await expect(notFound.or(onCatalog)).toBeVisible({ timeout: 20_000 });
  });

  test('happy path: WM Test Version → catalog → checkout → thank you → Order Manager', async ({
    page,
  }) => {
    test.setTimeout(240_000);

    const loginPage = new LoginPage(page);
    await loginPage.goto(WM_VERSIONS_PATH);
    await loginPage.loginToWebsiteManager(getDefaultLoginUser());

    const wm = new WebsiteManagerPage(page);
    await wm.openTestVersionDetails();

    const catalogLinkLabel = AutomationqaCatalogPage.catalogLiveLinkLabel(PUB_CATALOG_BASE_URL);
    const catalogPage = await wm.openPubCatalogInNewTab(catalogLinkLabel);

    const catalog = new AutomationqaCatalogPage(catalogPage);
    await catalog.navigateToEnginePartsPlpFromHome();
    const cart = await catalog.addValveCoverPro1ToCartAndResolveCart(page);
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
