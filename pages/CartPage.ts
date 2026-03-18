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
    await this.page.locator('#chkIsResidential').check();
    await this.page.locator('input[name="FirstName"]').fill('new');
    await this.page.locator('input[name="LastName"]').fill('test');
    await this.page.locator('input[name="Address1"]').fill('street one');
  }

  async goToPaymentAndConfirmShipping() {
    const step2Btn = this.page.getByRole('button', { name: /Step\s*2.*Payment/i }).first();
    await step2Btn.click();
    const calcBtn = this.page.getByRole('button', { name: /Calculate\s*Shipping|Estimate/i }).first();
    if (await calcBtn.isVisible().catch(() => false)) await calcBtn.click();
    const upsText = this.page.getByText(/UPS\s*Ground/i).first();
    if (await upsText.isVisible().catch(() => false)) await upsText.click();

    const shippingOption = this.page.getByRole('radio', { name: /UPS\s*Ground/i }).first();
    const listItemRadio = this.page.getByRole('listitem').filter({ hasText: /ups|fedex|ground|standard/i }).getByRole('radio').first();
    const anyRadioNearShipping = this.page.getByRole('radio', { name: /shipping|ground|standard|overnight|delivery/i }).first();
    const fallbackRadio = this.page.locator('input[type="radio"]').first();
    if (await shippingOption.isVisible().catch(() => false)) {
      await shippingOption.check();
    } else if (await listItemRadio.isVisible().catch(() => false)) {
      await listItemRadio.check();
    } else if (await anyRadioNearShipping.isVisible().catch(() => false)) {
      await anyRadioNearShipping.check();
    } else if (await fallbackRadio.isVisible().catch(() => false)) {
      await fallbackRadio.check();
    } else {
      await expect(listItemRadio).toBeVisible({ timeout: 15_000 });
      await listItemRadio.check();
    }
    await step2Btn.click();
  }
}

