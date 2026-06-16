/**
 * Automationqa — Order Submission (pub catalog → cart → checkout → thank you).
 *
 * Run: npm run test:prod:order-submit -- --headed
 */
import { test, expect } from '@playwright/test';
import { PUB_CATALOG_BASE_URL } from '../../config/urls';
import { AutomationqaCatalogPage } from '../../pages/automationqa-prod/AutomationqaCatalogPage';
import { CartPage } from '../../pages/common/CartPage';
import { writeLastOrderRef } from '../../helpers/lastOrderRefArtifact';

test.use({
  ignoreHTTPSErrors: true,
});

test.describe('Automationqa — Order Submission', { tag: ['@prod', '@commerce', '@regression'] }, () => {
  test('negative: home page has no Proceed to Checkout', async ({ page }) => {
    test.setTimeout(60_000);
    await page.goto(PUB_CATALOG_BASE_URL, { waitUntil: 'domcontentloaded' });
    const catalog = new AutomationqaCatalogPage(page);
    await catalog.expectAllCategoriesHome();
    await expect(page.getByRole('button', { name: /Proceed to Checkout/i })).toHaveCount(0);
  });

  test('negative: PLP without add-to-cart has no shipping form', async ({ page }) => {
    test.setTimeout(60_000);
    const catalog = new AutomationqaCatalogPage(page);
    await page.goto(PUB_CATALOG_BASE_URL, { waitUntil: 'domcontentloaded' });
    await catalog.navigateToEnginePartsPlpFromHome();
    await expect(page.locator('input[name="FirstName"]')).toHaveCount(0);
    await expect(page.getByRole('button', { name: /Proceed to Checkout/i })).toHaveCount(0);
  });

  test('happy path: catalog → cart → checkout → thank you', async ({ page }) => {
    test.setTimeout(240_000);

    const catalog = new AutomationqaCatalogPage(page);
    await page.goto(PUB_CATALOG_BASE_URL, { waitUntil: 'domcontentloaded' });
    await catalog.expectAllCategoriesHome();
    await catalog.navigateToEnginePartsPlpFromHome();
    const cartPage = await catalog.addValveCoverPro1ToCartAndResolveCart(page);

    const checkout = new CartPage(cartPage);
    await checkout.runCadSiteVersion1CheckoutFromCartLanding();

    const orderRef = await checkout.readThankYouOrderReference();
    expect(orderRef, 'parsed order ref should be digits only').toMatch(/^\d+$/);
    writeLastOrderRef(orderRef);

    await expect(
      cartPage.getByText(/Your order is now complete|Thank you for sending your order/i),
    ).toBeVisible({ timeout: 15_000 });
  });
});
