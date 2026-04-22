import { test, expect } from '@playwright/test';

test.use({
  ignoreHTTPSErrors: true
});

test('test', async ({ page }) => {
  await page.goto('https://tools.cn-qam-stage.catnav.us/loginmanager/login.aspx?ReturnUrl=/WebSiteManager/WebMainViewVersions.aspx');
  await page.getByRole('textbox', { name: 'Enter company name' }).click();
  await page.getByRole('textbox', { name: 'Enter company name' }).press('CapsLock');
  await page.getByRole('textbox', { name: 'Enter company name' }).fill('N');
  await page.getByRole('textbox', { name: 'Enter company name' }).press('CapsLock');
  await page.getByRole('textbox', { name: 'Enter company name' }).fill('Nikhil');
  await page.getByRole('textbox', { name: 'Enter company name' }).press('Tab');
  await page.getByRole('textbox', { name: 'Enter your user name' }).click();
  await page.getByRole('textbox', { name: 'Enter your user name' }).fill('nikhilmedhe');
  await page.getByRole('textbox', { name: 'Enter your password' }).click();
  await page.getByRole('textbox', { name: 'Enter your password' }).press('CapsLock');
  await page.getByRole('textbox', { name: 'Enter your password' }).fill('N');
  await page.getByRole('textbox', { name: 'Enter your password' }).press('CapsLock');
  await page.getByRole('textbox', { name: 'Enter your password' }).fill('New@nikhil123');
  await page.locator('#ddlApplication').selectOption('30');
  await page.getByRole('button', { name: 'Sign In' }).click();
  await page.locator('tr:nth-child(9) > td:nth-child(2)').click();
  await page.locator('#dgViewVersions_ctl09_iBtnEditVersion').click();
  await page.locator('#menuItem0').click();
  const page1Promise = page.waitForEvent('popup');
  await page.getByRole('link', { name: 'https://nikhil.cn-qam-pub.catnav.us', exact: true }).click();
  const page1 = await page1Promise;
  await page1.getByRole('link', { name: 'Engine parts' }).click();
  await page1.getByRole('link', { name: 'Brake system' }).click();
  await page1.getByRole('link', { name: 'Add To Cart' }).nth(1).click();
  await page1.getByRole('button', { name: 'View Cart' }).click();
  await page1.goto('https://cart.cn-qam-pub.catnav.us/cbcheckout/viewcart?token=eEHvNOMf5uvlBoGxVZLF8jcOCgnwDCMIlNLkm4BCPG4dYmBBGfQrJvmX9V97T2SqvwIR1kc8R2JsIymrbasUUw%2C%2C&returnurl=https%3A%2F%2Fnikhil.cn-qam-pub.catnav.us%2Fviewitems%2Fengine-parts%2Fbrake-system-1');
  await page1.getByRole('textbox', { name: 'Zip Code' }).click();
  await page1.getByRole('textbox', { name: 'Zip Code' }).fill('10001');
  await page1.getByRole('button', { name: 'Estimate' }).click();
  await page1.getByRole('listitem').filter({ hasText: 'UPS Next Day Air$' }).getByRole('radio').check();
  await page1.getByRole('button', { name: 'Proceed to Checkout' }).nth(1).click();
  await page1.locator('#chkIsResidential').check();
  await page1.locator('input[name="FirstName"]').click();
  await page1.locator('input[name="FirstName"]').press('CapsLock');
  await page1.locator('input[name="FirstName"]').fill('T');
  await page1.locator('input[name="FirstName"]').press('CapsLock');
  await page1.locator('input[name="FirstName"]').fill('Test');
  await page1.locator('input[name="FirstName"]').press('Tab');
  await page1.locator('input[name="LastName"]').press('CapsLock');
  await page1.locator('input[name="LastName"]').fill('QA');
  await page1.locator('input[name="LastName"]').press('Tab');
  await page1.locator('input[name="CompanyName"]').fill('T');
  await page1.locator('input[name="CompanyName"]').press('CapsLock');
  await page1.locator('input[name="CompanyName"]').fill('Test');
  await page1.locator('input[name="CompanyName"]').press('Tab');
  await page1.locator('input[name="Address1"]').press('CapsLock');
  await page1.locator('input[name="Address1"]').fill('S');
  await page1.locator('input[name="Address1"]').press('CapsLock');
  await page1.locator('input[name="Address1"]').fill('Street one');
  await page1.locator('input[name="Address1"]').press('Tab');
  await page1.locator('input[name="Address2"]').press('CapsLock');
  await page1.locator('input[name="Address2"]').fill('A1');
  await page1.locator('input[name="Address2"]').press('Tab');
  await page1.locator('input[name="Address3"]').fill('B2');
  await page1.locator('input[name="Phone"]').click();
  await page1.locator('input[name="Phone"]').fill('12345678901');
  await page1.locator('input[name="Email"]').click();
  await page1.locator('input[name="Email"]').press('CapsLock');
  await page1.locator('input[name="Email"]').fill('nikhil.medhe@firstsource.com');
  await page1.locator('input[name="Save_Address_Shipping"]').check();
  await page1.getByRole('button', { name: 'Calculate Shipping' }).click();
  await page1.getByRole('listitem').filter({ hasText: 'UPS Next Day Air$' }).getByRole('radio').check();
  await page1.getByRole('button', { name: 'Step 2: Payment ' }).click();
  await page1.locator('#ecomm-billing-same').check();
  await page1.getByRole('listitem').filter({ hasText: 'COD - Cash On Delivery Cash' }).getByRole('radio').check();
  await page1.getByRole('button', { name: 'Step 3: Review & Submit Order' }).click();
  const customerAcct = page1.getByRole('textbox', { name: /Customer Account Number/i });
  await customerAcct.click();
  await customerAcct.fill('1234');
  /** Primary checkout control is often `<a role="button" data-url=".../thankyou...">`; `.nth(1)` can hit a hidden duplicate. */
  const submitOrder = page1
    .locator('a[role="button"][data-url*="/cbcheckout/thankyou"]')
    .filter({ hasText: /submit order/i })
    .or(page1.getByRole('button', { name: /submit order/i }));
  await submitOrder.first().scrollIntoViewIfNeeded();
  await submitOrder.first().click();
});