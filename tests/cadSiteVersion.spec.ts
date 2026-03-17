import { test, expect } from '../fixtures';
import { WebsiteManagerPage } from '../pages/WebsiteManagerPage';
import { CartPage } from '../pages/CartPage';

test('Cad Site Version flow', async ({ loggedInWebsiteManagerPage }) => {
  test.setTimeout(60_000);
  const websiteManager = new WebsiteManagerPage(loggedInWebsiteManagerPage);

  // Open Cad Site Version details, which opens catalog in a new window
  await websiteManager.openCadSiteVersionDetails();

  const page = loggedInWebsiteManagerPage;
  // Link text can vary (e.g. full URL); match any catalog link containing nikhil + cn-qam-stage
  const catalogLink = page.getByRole('link', { name: /nikhil.*cn-qam-stage|http.*nikhil.*cn-qam-stage/i });
  await expect(catalogLink).toBeVisible({ timeout: 15_000 });
  const catalogPopupPromise = page.waitForEvent('popup', { timeout: 15_000 });
  await catalogLink.click();
  const catalogPage = await catalogPopupPromise;
  await expect(catalogPage).toHaveURL(/nikhil\.cn-qam-stage\.catnav\.us/);

  // Browse categories and add an item to the cart (dialog मधून View Cart — id="edit-attr-view-cart")
  const cartPageObj = new CartPage(catalogPage);
  await cartPageObj.addEngineBrakeItemToCart();

  const CART_URL = /viewcart|cart\.cn-qam|cbcheckout/i;
  let cartPage = catalogPage;
  for (let i = 0; i < 12; i++) {
    await catalogPage.waitForTimeout(500);
    if (CART_URL.test(catalogPage.url())) {
      cartPage = catalogPage;
      break;
    }
    const tab = page.context().pages().find((p) => p !== page && CART_URL.test(p.url()));
    if (tab) {
      cartPage = tab;
      break;
    }
    if (i === 11) {
      const link = catalogPage.getByRole('link', { name: /shopping cart/i });
      const href = await link.getAttribute('href').catch(() => null);
      if (href) await catalogPage.goto(href, { waitUntil: 'domcontentloaded', timeout: 15_000 });
      else await link.first().click({ force: true });
      cartPage = catalogPage;
    }
  }
  await cartPage.bringToFront();
  await expect(cartPage).toHaveURL(CART_URL, { timeout: 10_000 });

  const cartPageModel = new CartPage(cartPage);
  await cartPageModel.estimateShippingAndProceed('10001');
  await cartPageModel.fillBasicShippingAddress();
  await cartPageModel.goToPaymentAndConfirmShipping();
});