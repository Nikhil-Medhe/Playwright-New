/**
 * PCAT `?pcat=pvtcat` — catalog host from `PUB_CATALOG_URL` (`pubPvtCatCatalogUrl()` in `config/urls.ts`).
 *
 * Thomas staging pub: `npm run test:pcat:thomas-stage`
 * QAM pub: `npm run test:pcat:qam`
 */
import { test } from '@playwright/test';
import { PcatCatalogPage } from '../../pages/qam/PcatCatalogPage';
import { CartPage } from '../../pages/common/CartPage';

test.use({
  ignoreHTTPSErrors: true,
});

test('happy path: PCAT basic navigation — Discount PLP item matches cart and review order line', { tag: ['@qam', '@commerce', '@pcat', '@regression'] }, async ({ page }) => {
  test.setTimeout(180_000);

  const pcat = new PcatCatalogPage(page);
  const { cartPage, plpRowText } = await pcat.addFirstDiscountPlPToCartAndResolveCart();

  const cartProductLabel = await CartPage.readFirstCartLineProductLabel(cartPage);
  await CartPage.expectPollPlPRowMatchesCartLine(plpRowText, cartProductLabel);

  await new CartPage(cartPage).runPcatPvtCatDiscountCheckoutThroughThankYou(cartProductLabel);
});
