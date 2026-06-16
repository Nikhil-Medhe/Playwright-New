/**
 * Automationqa — Promotions (Valve Cover Pro 1 + promo code sale50).
 *
 * Run: npm run test:prod:promotions -- --headed
 */
import { test, expect } from '@playwright/test';
import { PUB_CATALOG_BASE_URL } from '../../config/urls';
import { AutomationqaCatalogPage } from '../../pages/automationqa-prod/AutomationqaCatalogPage';
import { CartPage } from '../../pages/common/CartPage';
import { writeLastOrderRef } from '../../helpers/lastOrderRefArtifact';

const PROMO_CODE = 'sale50';
const ITEM_LABEL = /Valve Cover Pro 1/i;

test.use({
  ignoreHTTPSErrors: true,
});

test.describe('Automationqa — Promotions', { tag: ['@prod', '@commerce', '@regression'] }, () => {
  test('negative: invalid promo code shows error', async ({ page }) => {
    test.setTimeout(120_000);

    const catalog = new AutomationqaCatalogPage(page);
    await page.goto(PUB_CATALOG_BASE_URL, { waitUntil: 'domcontentloaded' });
    await catalog.navigateToEnginePartsPlpFromHome();
    const cartPage = await catalog.addValveCoverPro1ToCartAndResolveCart(page);

    const cart = new CartPage(cartPage);
    const promoInput = cartPage.getByRole('textbox', { name: 'Promo Code' });
    await promoInput.fill('INVALID_PROMO_XYZ_999');
    await cartPage.getByRole('button', { name: 'Apply' }).click();
    await cart.expectInvalidPromoCodeMessage();
  });

  test('happy path: Item #2 Valve Cover Pro 1 + sale50 → thank you', async ({ page }) => {
    test.setTimeout(240_000);

    const catalog = new AutomationqaCatalogPage(page);
    await page.goto(PUB_CATALOG_BASE_URL, { waitUntil: 'domcontentloaded' });
    await catalog.navigateToEnginePartsPlpFromHome();

    const row = page.locator('tr').filter({ hasText: ITEM_LABEL });
    await expect(row.first()).toBeVisible({ timeout: 20_000 });
    await expect(row.first()).toContainText(/2/);

    const cartPage = await catalog.addValveCoverPro1ToCartAndResolveCart(page);
    await expect(cartPage.getByText(ITEM_LABEL).first()).toBeVisible({ timeout: 20_000 });

    const checkout = new CartPage(cartPage);
    await checkout.runPromotionsPromoCheckoutAfterCartOpen(PROMO_CODE, { clickContinueShopping: false });

    const orderRef = await checkout.readThankYouOrderReference();
    expect(orderRef).toMatch(/^\d+$/);
    writeLastOrderRef(orderRef);
  });
});
