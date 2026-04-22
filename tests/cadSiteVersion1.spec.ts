import { test, expect } from '@playwright/test';
import { WebsiteManagerPage } from '../pages/WebsiteManagerPage';
import { OrderManagerPage, parseThankYouOrderRef } from '../pages/OrderManagerPage';
import { writeLastOrderRef } from '../helpers/lastOrderRefArtifact';



test.use({

  ignoreHTTPSErrors: true,

});



test('test', async ({ page }) => {

  test.setTimeout(240_000);



  await page.goto(

    'https://tools.cn-qam-stage.catnav.us/loginmanager/login.aspx?ReturnUrl=/WebSiteManager/WebMainViewVersions.aspx',

  );

  await page.getByRole('textbox', { name: 'Enter company name' }).click();

  await page.getByRole('textbox', { name: 'Enter company name' }).press('CapsLock');

  await page.getByRole('textbox', { name: 'Enter company name' }).fill('N');

  await page.getByRole('textbox', { name: 'Enter company name' }).press('CapsLock');

  await page.getByRole('textbox', { name: 'Enter company name' }).fill('nikhil');

  await page.getByRole('textbox', { name: 'Enter company name' }).press('Tab');

  await page.getByRole('textbox', { name: 'Enter your user name' }).fill('nikhilmedhe');

  await page.getByRole('textbox', { name: 'Enter your user name' }).press('Tab');

  await page.getByRole('textbox', { name: 'Enter your password' }).press('CapsLock');

  await page.getByRole('textbox', { name: 'Enter your password' }).fill('N');

  await page.getByRole('textbox', { name: 'Enter your password' }).press('CapsLock');

  await page.getByRole('textbox', { name: 'Enter your password' }).fill('New@');

  await page.getByRole('textbox', { name: 'Enter your password' }).dblclick();

  await page.getByRole('textbox', { name: 'Enter your password' }).press('CapsLock');

  await page.getByRole('textbox', { name: 'Enter your password' }).fill('N');

  await page.getByRole('textbox', { name: 'Enter your password' }).press('CapsLock');

  await page.getByRole('textbox', { name: 'Enter your password' }).fill('New@nikhil123');

  await page.locator('#ddlApplication').selectOption('30');

  await page.getByRole('button', { name: 'Sign In' }).click();

  const websiteManager = new WebsiteManagerPage(page);
  await websiteManager.openCadSiteVersionDetails();

  const page1Promise = page.waitForEvent('popup');

  await page.getByRole('link', { name: 'https://nikhil.cn-qam-pub.catnav.us', exact: true }).click();

  const page1 = await page1Promise;

  await page1.getByRole('link', { name: 'Engine parts' }).click();

  await page1.getByRole('link', { name: 'Brake system' }).click();

  await page1.getByText('Cluch').click();

  await page1.locator('#plp-table-filter').getByRole('link', { name: '2', exact: true }).click();

  await page1.getByRole('link', { name: 'Add To Cart' }).click();

  const dialog = page1.getByRole('dialog');

  await expect(dialog).toBeVisible({ timeout: 15_000 });

  const viewInDialog = dialog
    .locator('#edit-attr-view-cart')
    .or(dialog.getByRole('button', { name: 'View Cart' }))
    .first();

  const cartUrl = /viewcart|cart\.cn-qam|cbcheckout/i;

  const popupPromise = page1.context().waitForEvent('page', { timeout: 20_000 }).catch(() => null);

  await viewInDialog.click();

  const maybePopup = await popupPromise;

  let cart: typeof page1 | null = null;

  for (let i = 0; i < 40; i++) {
    const candidates = [maybePopup, page1, ...page.context().pages()].filter(Boolean) as typeof page1[];

    for (const p of candidates) {
      if (cartUrl.test(p.url())) {
        cart = p;

        break;
      }
    }

    if (cart) break;

    if (cartUrl.test(page1.url())) {
      cart = page1;

      break;
    }

    await page1.waitForTimeout(500);
  }

  if (!cart) {
    const link = page1.getByRole('link', { name: /shopping cart/i });

    const href = await link.first().getAttribute('href').catch(() => null);

    if (href) await page1.goto(href, { waitUntil: 'domcontentloaded', timeout: 15_000 });
    else await link.first().click({ force: true });

    cart = page1;
  }

  await cart.bringToFront();

  await expect(cart).toHaveURL(cartUrl, { timeout: 15_000 });



  const zip = cart.locator('#ecomm-ship-zip').or(cart.getByRole('textbox', { name: /zip|postal/i }));

  await expect(zip.first()).toBeVisible({ timeout: 15_000 });

  await zip.first().click();

  await zip.first().fill('10001');

  await cart.getByRole('button', { name: /Estimate|Calculate\s*Shipping/i }).first().click();

  const upsGround = cart.getByRole('listitem').filter({ hasText: /UPS\s*Ground/i }).getByRole('radio').first();

  if (await upsGround.isVisible().catch(() => false)) {

    await upsGround.check();

  } else {

    await cart.getByRole('listitem').filter({ hasText: /ups|fedex|ground/i }).getByRole('radio').first().check();

  }

  await cart.getByRole('button', { name: /Proceed to Checkout/i }).nth(1).click();

  await cart.locator('input[name="FirstName"]').click();

  await cart.locator('input[name="FirstName"]').press('CapsLock');

  await cart.locator('input[name="FirstName"]').fill('T');

  await cart.locator('input[name="FirstName"]').press('CapsLock');

  await cart.locator('input[name="FirstName"]').fill('Test');

  await cart.locator('input[name="FirstName"]').press('Tab');

  await cart.locator('input[name="LastName"]').press('CapsLock');

  await cart.locator('input[name="LastName"]').fill('QA');

  await cart.locator('input[name="LastName"]').press('Tab');

  await cart.locator('input[name="CompanyName"]').fill('T');

  await cart.locator('input[name="CompanyName"]').press('CapsLock');

  await cart.locator('input[name="CompanyName"]').fill('Test');

  await cart.locator('input[name="CompanyName"]').press('Tab');

  await cart.locator('input[name="Address1"]').press('CapsLock');

  await cart.locator('input[name="Address1"]').fill('S');

  await cart.locator('input[name="Address1"]').press('CapsLock');

  await cart.locator('input[name="Address1"]').fill('Street one');

  await cart.locator('input[name="Address1"]').press('Tab');

  await cart.locator('input[name="Address2"]').press('CapsLock');

  await cart.locator('input[name="Address2"]').fill('T');

  await cart.locator('input[name="Address2"]').press('CapsLock');

  await cart.locator('input[name="Address2"]').fill('Test');

  await cart.locator('input[name="Address2"]').press('Tab');

  await cart.locator('input[name="Address3"]').press('CapsLock');

  await cart.locator('input[name="Address3"]').fill('T');

  await cart.locator('input[name="Address3"]').press('CapsLock');

  await cart.locator('input[name="Address3"]').fill('Test');

  await cart.locator('input[name="Address3"]').press('Tab');

  await cart.locator('#ecomm-ship-city').fill('New York');

  await cart.locator('#ecomm-ship-state').selectOption('NY');

  await cart.locator('#ecomm-ship-zip').fill('10001');

  await cart.locator('input[name="Save_Address_Shipping"]').check();

  await cart.locator('input[name="Phone"]').fill('12345678912');

  await cart.locator('input[name="Email"]').click();

  await cart.locator('input[name="Email"]').fill('nikhil.medhe@firstsource.com');

  const calcShip = cart.getByRole('button', { name: 'Calculate Shipping' });

  await expect(calcShip).toBeVisible({ timeout: 15_000 });

  await calcShip.click();

  await cart.locator('#chkIsResidential').check();

  await calcShip.click();

  const fedexOption = cart
    .getByRole('listitem')
    .filter({ hasText: /fedex.*priority.*overnight/i })
    .getByRole('radio');

  const anyShippingRadio = cart
    .getByRole('listitem')
    .filter({ hasText: /fedex|ups|standard|ground|overnight/i })
    .getByRole('radio')
    .first();

  if (await fedexOption.isVisible().catch(() => false)) {
    await fedexOption.check();
  } else {
    await expect(anyShippingRadio).toBeVisible({ timeout: 15_000 });

    await anyShippingRadio.check();
  }

  await cart.getByRole('button', { name: /Step\s*2:\s*Payment/i }).click();

  await expect(cart.locator('#ecomm-billing-same')).toBeVisible({ timeout: 15_000 });

  await cart.locator('#ecomm-billing-same').check();

  await cart.getByRole('listitem').filter({ hasText: /COD\s*-\s*Cash On Delivery/i }).getByRole('radio').check();

  await cart.getByRole('button', { name: /Step\s*3:\s*Review/i }).click();



  const customerAcct = cart.getByRole('textbox', { name: /Customer Account Number/i });

  if (await customerAcct.first().isVisible({ timeout: 5_000 }).catch(() => false)) {

    await customerAcct.first().fill('1234');

  }

  const taxExempt = cart.getByRole('textbox', { name: /Tax Exempt/i });

  if (await taxExempt.first().isVisible({ timeout: 3_000 }).catch(() => false)) {

    await taxExempt.first().fill('4321');

  }

  const terms = cart.getByRole('checkbox', { name: /terms|agree|condition/i });

  if (await terms.first().isVisible({ timeout: 2_000 }).catch(() => false)) {

    await terms.first().check();

  }

  const submitThankYou = cart
    .locator('a.ecomm-cart-submit[role="button"][data-url*="thankyou"]')
    .or(cart.locator('a[role="button"][data-url*="thankyou"]').filter({ hasText: /submit\s*order/i }))
    .first();

  await expect(submitThankYou).toBeVisible({ timeout: 15_000 });

  await submitThankYou.scrollIntoViewIfNeeded();

  await submitThankYou.click({ force: true, timeout: 45_000 });

  try {
    await cart.waitForURL(/\/cbcheckout\/thankyou/i, { timeout: 20_000, waitUntil: 'commit' });
  } catch {
    await submitThankYou.evaluate((el) => (el as HTMLAnchorElement).click());

    await cart.waitForURL(/\/cbcheckout\/thankyou/i, { timeout: 90_000, waitUntil: 'commit' });
  }



  await expect(

    cart.getByText(/Your order is now complete|Thank you for sending your order/i),

  ).toBeVisible({ timeout: 20_000 });

  await expect(cart.getByText(/Your order reference number is\s*\d+/i).first()).toBeVisible({
    timeout: 20_000,
  });

  const thankBlock = cart.locator('#ecomm-confirmation-message').or(cart.locator('body'));
  const thankText = await thankBlock.first().innerText();
  const orderRef = parseThankYouOrderRef(thankText);
  if (!orderRef) {
    throw new Error(`Could not parse order reference from thank-you. Snippet: ${thankText.slice(0, 500)}`);
  }
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


