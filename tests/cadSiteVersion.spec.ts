import { test, expect } from '../fixtures';
import { WebsiteManagerPage } from '../pages/WebsiteManagerPage';
import { CartPage } from '../pages/CartPage';

test('Cad Site Version flow', async ({ loggedInWebsiteManagerPage }) => {
  test.setTimeout(60_000);
  const websiteManager = new WebsiteManagerPage(loggedInWebsiteManagerPage);
  const page = loggedInWebsiteManagerPage;

  let catalogPage;
  await test.step('Open Cad Site Version details and open catalog popup', async () => {
    await websiteManager.openCadSiteVersionDetails();
    const catalogLink = page.getByRole('link', { name: /nikhil.*cn-qam-stage|http.*nikhil.*cn-qam-stage/i });
    await expect(catalogLink).toBeVisible({ timeout: 15_000 });
    const catalogPopupPromise = page.waitForEvent('popup', { timeout: 15_000 });
    await catalogLink.click();
    catalogPage = await catalogPopupPromise;
  });
  await test.step('Verify catalog URL', async () => {
    await expect(catalogPage).toHaveURL(/nikhil\.cn-qam-stage\.catnav\.us/);
  });

  await test.step('Add item to cart (Engine parts > Brake system > Add To Cart > View Cart)', async () => {
    const cartPageObj = new CartPage(catalogPage);
    await cartPageObj.addEngineBrakeItemToCart();
  });

  const CART_URL = /viewcart|cart\.cn-qam|cbcheckout/i;
  let cartPage = catalogPage;
  await test.step('Resolve cart page (same tab or new tab)', async () => {
    for (let i = 0; i < 12; i++) {
      await catalogPage.waitForTimeout(500);
      if (CART_URL.test(catalogPage.url())) {
        cartPage = catalogPage;
        return;
      }
      const tab = page.context().pages().find((p) => p !== page && CART_URL.test(p.url()));
      if (tab) {
        cartPage = tab;
        return;
      }
      if (i === 11) {
        const link = catalogPage.getByRole('link', { name: /shopping cart/i });
        const href = await link.getAttribute('href').catch(() => null);
        if (href) await catalogPage.goto(href, { waitUntil: 'domcontentloaded', timeout: 15_000 });
        else await link.first().click({ force: true });
        cartPage = catalogPage;
      }
    }
  });
  await cartPage.bringToFront();
  await expect(cartPage).toHaveURL(CART_URL, { timeout: 10_000 });

  await test.step('Estimate shipping and proceed to checkout', async () => {
    const cartPageModel = new CartPage(cartPage);
    await cartPageModel.estimateShippingAndProceed('10001');
  });

  await test.step('Fill basic shipping address', async () => {
    const cartPageModel = new CartPage(cartPage);
    await cartPageModel.fillBasicShippingAddress();
  });

  await test.step('Go to payment and confirm shipping', async () => {
    const cartPageModel = new CartPage(cartPage);
    await cartPageModel.goToPaymentAndConfirmShipping();
  });
});