import { test, expect } from '../fixtures';

const CATALOG_URL = 'https://nikhil.cn-qam-pub.catnav.us/';

test('OrderSubmission: catalog → cart → checkout → submit order (pub)', async ({ page }) => {
  test.setTimeout(90_000);

  await test.step('Open catalog and verify All Categories', async () => {
    await page.goto(CATALOG_URL);
    await expect(page.getByRole('heading', { name: /all categories/i })).toBeVisible();
  });

  await test.step('Navigate to Engine parts > Brake system > Item 1', async () => {
    await page.getByRole('link', { name: 'Engine parts' }).click();
    await expect(page).toHaveURL(/engine-parts/);
    await page.getByRole('link', { name: 'Brake system' }).click();
    await expect(page).toHaveURL(/brake-system/);
    await page.getByRole('link', { name: 'Item 1' }).click();
    await expect(page).toHaveURL(/item-1/);
  });

  await test.step('Add to cart (quantity 2) and open View Cart dialog', async () => {
    await page.locator('#plp-cart-quantity').fill('2');
    await page.getByRole('link', { name: 'Add To Cart' }).click();
    const dialog = page.getByRole('dialog');
    await expect(dialog).toBeVisible();
    await dialog.locator('button').filter({ hasText: 'View Cart' }).click();
  });

  const CART_OR_VIEWCART = /viewcart|cart\.cn-qam-pub\.catnav\.us/i;
  let cartPage = page;
  await test.step('Resolve cart page (same tab or new tab)', async () => {
    for (let i = 0; i < 8; i++) {
      await new Promise((r) => setTimeout(r, 500));
      if (CART_OR_VIEWCART.test(page.url())) {
        cartPage = page;
        return;
      }
      const pages = page.context().pages();
      const cartTab = pages.find((p) => p !== page && CART_OR_VIEWCART.test(p.url()));
      if (cartTab) {
        cartPage = cartTab;
        return;
      }
      if (i === 7) {
        await page.keyboard.press('Escape');
        const cartLink = page.getByRole('link', { name: /shopping cart/i });
        const href = await cartLink.getAttribute('href');
        if (href) await page.goto(href, { waitUntil: 'domcontentloaded', timeout: 15000 });
        else await cartLink.click({ force: true });
        cartPage = page;
      }
    }
  });

  await test.step('Proceed to Checkout', async () => {
    const proceedBtn = cartPage.getByRole('button', { name: 'Proceed to Checkout' }).first();
    await expect(proceedBtn).toBeVisible();
    await cartPage.getByRole('button', { name: 'Proceed to Checkout' }).nth(1).click();
    await cartPage.waitForURL(/shippingbilling|checkout|viewcart/i, { timeout: 15000 });
  });

  await test.step('Fill shipping address', async () => {
    await expect(cartPage.locator('input[name="FirstName"]')).toBeVisible({ timeout: 15000 });
    await cartPage.locator('input[name="FirstName"]').fill('Nikhil');
    await cartPage.locator('input[name="LastName"]').fill('Test');
    await cartPage.locator('input[name="CompanyName"]').fill('Test');
    await cartPage.locator('input[name="Address1"]').fill('Street no.1');
    await cartPage.locator('#ecomm-ship-city').fill('New york');
    await cartPage.locator('#ecomm-ship-state').selectOption('NY');
    await cartPage.locator('#ecomm-ship-zip').fill('10001');
    await cartPage.locator('input[name="Phone"]').fill('12345678901');
    await cartPage.locator('input[name="Email"]').fill('nikhil.medhe@firstsource.com');
    await cartPage.locator('input[name="Save_Address_Shipping"]').check();
  });

  await test.step('Calculate shipping and select shipping option', async () => {
    await expect(cartPage.getByRole('button', { name: 'Calculate Shipping' })).toBeVisible();
    await cartPage.getByRole('button', { name: 'Calculate Shipping' }).click();
    await cartPage.locator('#chkIsResidential').check();
    await cartPage.getByRole('button', { name: 'Calculate Shipping' }).click();
    const fedexOption = cartPage.getByRole('listitem').filter({ hasText: /fedex.*priority.*overnight/i }).getByRole('radio');
    const anyShippingRadio = cartPage.getByRole('listitem').filter({ hasText: /fedex|ups|standard|ground|overnight/i }).getByRole('radio').first();
    if (await fedexOption.isVisible().catch(() => false)) {
      await fedexOption.check();
    } else {
      await expect(anyShippingRadio).toBeVisible({ timeout: 10000 });
      await anyShippingRadio.check();
    }
  });

  await test.step('Step 2: Payment - billing same as shipping', async () => {
    await expect(cartPage.getByRole('button', { name: /Step 2.*Payment/i })).toBeVisible();
    await cartPage.getByRole('button', { name: /Step 2.*Payment/i }).click();
    await expect(cartPage.getByRole('heading', { name: /billing address|payment method/i }).first()).toBeVisible({ timeout: 15000 });
    await cartPage.locator('#ecomm-billing-same').check();
  });

  await test.step('Select COD and go to Step 3 Review', async () => {
    const seeMore = cartPage.getByRole('link', { name: /see more/i });
    if (await seeMore.isVisible().catch(() => false)) await seeMore.click();
    const codRadio = cartPage.getByRole('listitem').filter({ hasText: 'COD - Cash On Delivery' }).getByRole('radio');
    await expect(codRadio).toBeVisible({ timeout: 5000 });
    await codRadio.check();
    const step3Btn = cartPage.getByRole('button', { name: /Step 3.*Review.*Submit|Review.*Submit Order/i });
    await expect(step3Btn).toBeVisible();
    await step3Btn.click();
  });

  await test.step('Submit order and verify confirmation', async () => {
    const submitOrderBtn = cartPage.getByRole('button', { name: /submit order/i });
    await expect(submitOrderBtn.first()).toBeVisible({ timeout: 15000 });
    const orderNumberBox = cartPage.getByRole('textbox', { name: /your order number|order number/i });
    if (await orderNumberBox.first().isVisible().catch(() => false)) await orderNumberBox.first().fill('1234');
    await submitOrderBtn.first().click();
    await expect(
      cartPage.getByText(/thank you|order (confirmed|submitted|number)|success|confirmation|placed/i)
    ).toBeVisible({ timeout: 20000 });
  });
});
