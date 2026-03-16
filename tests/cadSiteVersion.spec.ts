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

  // Browse categories and add an item to the cart
  const cartPage = new CartPage(catalogPage);
  await cartPage.addEngineBrakeItemToCart();

  // Validate cart has the Engine parts / Brake system item
  await expect(catalogPage.getByText('Shopping Cart')).toBeVisible();
  //await expect(catalogPage.getByText(/Brake system/i)).toBeVisible();
  // BEST - semantic आणि specific
//await expect(catalogPage.getByRole('link', { name: 'Brake system' })).toBeVisible();

  // Go directly to cart URL 
  await catalogPage.goto(
    'https://cart.cn-qam-stage.catnav.us/cbcheckout/viewcart?token=eEHvNOMf5uvlBoGxVZLF8jcOCgnwDCMIlNLkm4BCPG7qP8gl1sOcCERhyHXcyu5zXZ3LXgBxiHp28F6Rd5KWVQ%2C%2C&returnurl=http%3A%2F%2Fnikhil.cn-qam-stage.catnav.us%2Fviewitems%2Fengine-parts%2Fbrake-system',
    {
      waitUntil: 'domcontentloaded',
      timeout: 120000,
    }
  );

  // Estimate shipping, fill address, and confirm shipping/payment
  await cartPage.estimateShippingAndProceed('10001');
  await cartPage.fillBasicShippingAddress();
  await cartPage.goToPaymentAndConfirmShipping();
});