/**
 * Automationqa — PCAT `?pcat=pvtcat` (Automotive hub → Engine Parts → checkout).
 *
 * URL: https://automationqa.thomasnet-navigator.com/?pcat=pvtcat
 * Run: npm run test:prod:pcat -- --project=chrome
 */
import { test, expect } from '@playwright/test';
import { AutomationqaCatalogPage } from '../../pages/automationqa-prod/AutomationqaCatalogPage';
import { CartPage } from '../../pages/common/CartPage';
import { writeLastOrderRef } from '../../helpers/lastOrderRefArtifact';

test.use({
  ignoreHTTPSErrors: true,
});

test('happy path: PCAT pvtcat — Engine Parts item matches cart and completes checkout', { tag: ['@prod', '@commerce', '@pcat', '@regression'] }, async ({ page }) => {
  test.setTimeout(240_000);

  const catalog = new AutomationqaCatalogPage(page);
  const { cartPage, plpRowText } = await catalog.addValveCoverPro1PvtCatToCartAndResolveCart();

  const cartProductLabel = await CartPage.readFirstCartLineProductLabel(cartPage);
  await CartPage.expectPollPlPRowMatchesCartLine(plpRowText, cartProductLabel);

  const checkout = new CartPage(cartPage);
  await checkout.runCadSiteVersion1CheckoutFromCartLanding();

  const orderRef = await checkout.readThankYouOrderReference();
  expect(orderRef, 'parsed order ref should be digits only').toMatch(/^\d+$/);
  writeLastOrderRef(orderRef);

  await expect(
    cartPage.getByText(/Your order is now complete|Thank you for sending your order/i),
  ).toBeVisible({ timeout: 15_000 });
});
