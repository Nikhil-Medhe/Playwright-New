import { test, expect } from '../../fixtures';
import { PUB_CATALOG_BASE_URL } from '../../config/urls';
import { PublicCatalogPage } from '../../pages/qam/PublicCatalogPage';
import { CartPage } from '../../pages/common/CartPage';

test.describe('QAM — Order Submission', { tag: ['@qam', '@commerce', '@regression'] }, () => {
  test('negative: home page has no Proceed to Checkout', async ({ page }) => {
    test.setTimeout(60_000);
    const catalog = new PublicCatalogPage(page);
    await catalog.gotoHome();
    await catalog.expectAllCategoriesHeading();
    await expect(page.getByRole('button', { name: /Proceed to Checkout/i })).toHaveCount(0);
  });

  test('negative: PLP without add-to-cart has no shipping form', async ({ page }) => {
    test.setTimeout(60_000);
    const catalog = new PublicCatalogPage(page);
    await page.goto(PUB_CATALOG_BASE_URL, { waitUntil: 'domcontentloaded' });
    await catalog.openEngineParts();
    await catalog.openBrakeSystemViewItemsPlP();
    await expect(page.locator('input[name="FirstName"]')).toHaveCount(0);
    await expect(page.getByRole('button', { name: /Proceed to Checkout/i })).toHaveCount(0);
  });

  test('happy path: catalog → cart → checkout → submit order', async ({ page }) => {
    test.setTimeout(120_000);

    const catalog = new PublicCatalogPage(page);

    await test.step('Open catalog and verify All Categories', async () => {
    await catalog.gotoHome();
    await catalog.expectAllCategoriesHeading();
  });

  await test.step('Navigate to Engine parts > Brake system (view items PLP)', async () => {
    await catalog.openEngineParts();
    await catalog.openBrakeSystemViewItemsPlP();
  });

  let viewCartDataUrl: string | null = null;
  await test.step('Add to cart (quantity 2) from first PLP row and open View Cart dialog', async () => {
    viewCartDataUrl = await catalog.addFirstBrakePlpRowQtyToCartAndClickViewCart('2');
  });

  let cartPage = page;
  await test.step('Resolve cart page (same tab or new tab)', async () => {
    cartPage = await CartPage.resolveCartPageOrderSubmissionStyle(page, viewCartDataUrl);
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
    const anyShippingRadio = cartPage
      .getByRole('listitem')
      .filter({ hasText: /fedex|ups|standard|ground|overnight/i })
      .getByRole('radio')
      .first();
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
    await expect(cartPage.getByRole('heading', { name: /billing address|payment method/i }).first()).toBeVisible({
      timeout: 15000,
    });
    await cartPage.locator('#ecomm-billing-same').check();
  });

  await test.step('Select payment and go to Step 3 Review', async () => {
    const { selectPaymentOnStep2 } = await import('../../pages/common/CheckoutPayment');
    await selectPaymentOnStep2(cartPage);
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
      cartPage.getByText(/thank you|order (confirmed|submitted|number)|success|confirmation|placed/i),
    ).toBeVisible({ timeout: 20000 });
  });
  });
});
