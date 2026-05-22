import { test } from '@playwright/test';
import { PublicCatalogPage } from '../pages/PublicCatalogPage';
import { CartPage } from '../pages/CartPage';

test.use({
  ignoreHTTPSErrors: true,
});

test('Promotions — valid promo to order', async ({ page }) => {
  test.setTimeout(120_000);

  const catalog = new PublicCatalogPage(page);
  await catalog.gotoEnginePartsThenOpenBrakeSystemHub();
  const cartPage = await CartPage.addFirstPlPAddToCartAndResolve(page);
  await new CartPage(cartPage).runPromotionsValidPromoCheckoutAfterCartOpen();
});

test('Promotions — invalid promo code shows error', async ({ page }) => {
  test.setTimeout(60_000);

  const catalog = new PublicCatalogPage(page);
  await catalog.gotoEnginePartsThenOpenBrakeSystemHub();
  const cartPage = await CartPage.addFirstPlPAddToCartAndResolve(page);

  const cart = new CartPage(cartPage);
  const promoInput = cartPage.getByRole('textbox', { name: 'Promo Code' });
  await promoInput.fill('INVALID_PROMO_CODE_XYZ');
  await cartPage.getByRole('button', { name: 'Apply' }).click();
  await cart.expectInvalidPromoCodeMessage();
});
