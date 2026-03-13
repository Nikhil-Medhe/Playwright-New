import { test, expect } from '../fixtures';
import { WebsiteManagerPage } from '../pages/WebsiteManagerPage';
import { CartPage } from '../pages/CartPage';

test('Cad Site Version flow', async ({ loggedInWebsiteManagerPage }) => {
  const websiteManager = new WebsiteManagerPage(loggedInWebsiteManagerPage);

  // Open Cad Site Version details, which opens catalog in a new window
  await websiteManager.openCadSiteVersionDetails();

  const page = loggedInWebsiteManagerPage;
  const catalogPopupPromise = page.waitForEvent('popup');
  await page.getByRole('link', { name: 'http://nikhil.cn-qam-stage.' }).click();
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