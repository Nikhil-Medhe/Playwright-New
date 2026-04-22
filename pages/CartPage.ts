import { Page, expect } from '@playwright/test';
import { BasePage } from '../core/BasePage';

export class CartPage extends BasePage {
  constructor(page: Page) {
    super(page);
  }

  async addEngineBrakeItemToCart() {
    await this.page.getByRole('link', { name: 'Engine parts' }).click();
    await this.page.getByRole('link', { name: 'Brake system' }).click();
    await this.page.getByRole('link', { name: 'Add To Cart' }).nth(1).click();
    const dialog = this.page.getByRole('dialog');
    await dialog.waitFor({ state: 'visible', timeout: 15_000 });
    await dialog.locator('#edit-attr-view-cart').or(dialog.locator('button').filter({ hasText: 'View Cart' })).first().click();
  }

  /** Brake system PLP → row “Cluch” (catalog typo) → pagination page 2 → Add To Cart → View Cart in dialog. */
  async addEngineBrakeClutchPlpPage2ItemToCart() {
    await this.page.getByRole('link', { name: 'Engine parts' }).click();
    await this.page.getByRole('link', { name: 'Brake system' }).click();
    const cluchCell = this.page
      .getByText('Cluch', { exact: true })
      .or(this.page.getByRole('link', { name: 'Cluch', exact: true }))
      .or(this.page.getByRole('link', { name: /cluch|clutch/i }));
    await expect(cluchCell.first()).toBeVisible({ timeout: 15_000 });
    await cluchCell.first().click();

    const page2 = this.page.locator('#plp-table-filter').getByRole('link', { name: '2', exact: true });
    await expect(page2).toBeVisible({ timeout: 15_000 });
    await page2.click();

    await this.page.getByRole('link', { name: 'Add To Cart' }).first().click();
    const dialog = this.page.getByRole('dialog');
    await dialog.waitFor({ state: 'visible', timeout: 15_000 });
    await dialog.locator('#edit-attr-view-cart').or(dialog.locator('button').filter({ hasText: 'View Cart' })).first().click();
  }

  async estimateShippingAndProceed(zip: string) {
    const zipInput = this.page.locator('#ecomm-ship-zip').or(this.page.getByRole('textbox', { name: /zip|postal\s*code/i }));
    await expect(zipInput.first()).toBeVisible({ timeout: 15_000 });
    await zipInput.first().fill(zip);

    const estimateBtn = this.page.getByRole('button', { name: /Estimate|Calculate\s*Shipping/i }).first();
    await estimateBtn.click();
    await this.page.waitForTimeout(2000);

    const upsGround = this.page.getByRole('radio', { name: /UPS\s*Ground/i }).first();
    const listItemRadio = this.page.getByRole('listitem').filter({ hasText: /ups|fedex|ground|standard|overnight/i }).getByRole('radio').first();
    const anyRadioNearShipping = this.page.getByRole('radio', { name: /shipping|ground|standard|overnight|delivery/i }).first();
    const firstShippingRadio = this.page.locator('[class*="shipping"], [id*="shipping"], [data-testid*="shipping"]').locator('input[type="radio"]').first();
    const fallbackRadio = this.page.locator('input[type="radio"]').first();

    if (await upsGround.isVisible().catch(() => false)) {
      await upsGround.check();
    } else if (await listItemRadio.isVisible().catch(() => false)) {
      await listItemRadio.check();
    } else if (await anyRadioNearShipping.isVisible().catch(() => false)) {
      await anyRadioNearShipping.check();
    } else if (await firstShippingRadio.isVisible().catch(() => false)) {
      await firstShippingRadio.check();
    } else if (await fallbackRadio.isVisible().catch(() => false)) {
      await fallbackRadio.check();
    } else {
      await expect(listItemRadio).toBeVisible({ timeout: 15_000 });
      await listItemRadio.check();
    }

    const proceedButton = this.page.getByRole('button', { name: /Proceed to Checkout/i }).or(this.page.getByRole('link', { name: /Proceed to Checkout/i })).first();
    await expect(proceedButton).toBeVisible({ timeout: 15_000 });
    await proceedButton.click();
  }

  async fillBasicShippingAddress() {
    await expect(this.page.locator('input[name="FirstName"]')).toBeVisible({ timeout: 15_000 });
    await this.page.locator('input[name="FirstName"]').fill('Nikhil');
    await this.page.locator('input[name="LastName"]').fill('Test');
    await this.page.locator('input[name="CompanyName"]').fill('Test');
    await this.page.locator('input[name="Address1"]').fill('Street no.1');
    await this.page.locator('#ecomm-ship-city').fill('New York');
    await this.page.locator('#ecomm-ship-state').selectOption('NY');
    await this.page.locator('#ecomm-ship-zip').fill('10001');
    await this.page.locator('input[name="Phone"]').fill('12345678901');
    await this.page.locator('input[name="Email"]').fill('nikhil.medhe@firstsource.com');
    await this.page.locator('input[name="Save_Address_Shipping"]').check();
  }

  /**
   * On checkout shipping: calculate rates, pick carrier, open payment, COD, land on review (submit visible).
   * Matches the sequence used in OrderSubmission.spec.ts (avoids clicking Step 2 twice).
   */
  async goToPaymentAndConfirmShipping() {
    const calc = this.page.getByRole('button', { name: 'Calculate Shipping' });
    await expect(calc).toBeVisible({ timeout: 15_000 });
    await calc.click();
    await this.page.locator('#chkIsResidential').check();
    await calc.click();

    const fedexOption = this.page
      .getByRole('listitem')
      .filter({ hasText: /fedex.*priority.*overnight/i })
      .getByRole('radio');
    const anyShippingRadio = this.page
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

    const step2 = this.page.getByRole('button', { name: /Step\s*2:\s*Payment/i });
    await expect(step2).toBeVisible({ timeout: 15_000 });
    await expect(step2).toBeEnabled();
    await step2.click();

    await expect(this.page.locator('#ecomm-billing-same')).toBeVisible({ timeout: 15_000 });
    await this.page.locator('#ecomm-billing-same').check();

    const seeMore = this.page.getByRole('link', { name: /see more/i });
    if (await seeMore.isVisible().catch(() => false)) await seeMore.click();

    const codRadio = this.page.getByRole('listitem').filter({ hasText: 'COD - Cash On Delivery' }).getByRole('radio');
    await expect(codRadio).toBeVisible({ timeout: 15_000 });
    await codRadio.check();

    const step3 = this.page.getByRole('button', { name: /Step\s*3:\s*Review/i });
    await expect(step3).toBeEnabled();
    await step3.click();

    await expect(this.page.getByRole('button', { name: /submit order/i }).first()).toBeVisible({ timeout: 15_000 });
  }

  /** Review step: optional PO / account box, submit, assert thank-you URL and copy. */
  async submitOrderAndAssertThankYou() {
    await this.page.bringToFront();
    await this.page.waitForLoadState('domcontentloaded');

    const customerAcct = this.page.getByRole('textbox', { name: /Customer Account Number/i });
    if (await customerAcct.first().isVisible({ timeout: 5_000 }).catch(() => false)) {
      await customerAcct.first().fill('1234');
    }
    const poByRole = this.page.getByRole('textbox', {
      name: /your order number|order number|purchase order|po\s*#|po number/i,
    });
    if (await poByRole.first().isVisible({ timeout: 3_000 }).catch(() => false)) {
      await poByRole.first().fill('1234');
    }
    const poById = this.page.locator(
      'input[id*="PONumber" i], input[id*="PoNum" i], input[name*="PONumber" i], input[name*="CustomerAccount" i]',
    );
    if (await poById.first().isVisible({ timeout: 2_000 }).catch(() => false)) {
      await poById.first().fill('1234');
    }
    const taxExempt = this.page.getByRole('textbox', { name: /Tax Exempt/i });
    if (await taxExempt.first().isVisible({ timeout: 3_000 }).catch(() => false)) {
      await taxExempt.first().fill('4321');
    }

    const terms = this.page.getByRole('checkbox', { name: /terms|agree|condition/i });
    if (await terms.first().isVisible({ timeout: 1_000 }).catch(() => false)) {
      await terms.first().check();
    }

    /**
     * Thank-you navigation is bound to `<a role="button" class="ecomm-cart-submit" data-url="/cbcheckout/thankyou?...">`.
     * Do not use a plain `<button>Submit Order</button>` — it can re-post to reviewcart.
     */
    const submitThankYou = this.page
      .locator('a.ecomm-cart-submit[role="button"][data-url*="thankyou"]')
      .or(this.page.locator('a[role="button"][data-url*="thankyou"]').filter({ hasText: /submit\s*order/i }))
      .first();

    await expect(submitThankYou).toBeVisible({ timeout: 15_000 });
    await submitThankYou.scrollIntoViewIfNeeded();
    await submitThankYou.click({ force: true, timeout: 30_000 });
    try {
      await this.page.waitForURL(/\/cbcheckout\/thankyou/i, { timeout: 20_000, waitUntil: 'commit' });
    } catch {
      await submitThankYou.evaluate((el) => (el as HTMLAnchorElement).click());
      await this.page.waitForURL(/\/cbcheckout\/thankyou/i, { timeout: 60_000, waitUntil: 'commit' });
    }

    await expect(
      this.page.getByText(/Your order is now complete|Thank you for sending your order/i),
    ).toBeVisible({ timeout: 20_000 });
    await expect(this.page.getByText(/Your order reference number is\s*\d+/i).first()).toBeVisible({
      timeout: 20_000,
    });
  }
}

