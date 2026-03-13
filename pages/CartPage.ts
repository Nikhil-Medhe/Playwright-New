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
    await this.page.getByRole('button', { name: 'View Cart' }).click();
  }

  async estimateShippingAndProceed(zip: string) {
    await this.page.getByRole('textbox', { name: 'Zip Code' }).fill(zip);
    await this.page.getByRole('button', { name: 'Estimate' }).click();

    const shippingOption = this.page
      .getByRole('radio', { name: /UPS\s*Ground/i })
      .first();

    await expect(shippingOption).toBeVisible({ timeout: 30_000 });
    await shippingOption.check();

    const proceedButton = this.page
      .getByRole('button', { name: 'Proceed to Checkout' })
      .first();

    await proceedButton.waitFor({ state: 'visible' });
    await proceedButton.click();
  }

  async fillBasicShippingAddress() {
    await this.page.locator('#chkIsResidential').check();
    await this.page.locator('input[name="FirstName"]').fill('new');
    await this.page.locator('input[name="LastName"]').fill('test');
    await this.page.locator('input[name="Address1"]').fill('street one');
  }

  async goToPaymentAndConfirmShipping() {
    await this.page.getByRole('button', { name: 'Step 2: Payment ' }).click();
    await this.page.getByRole('button', { name: 'Calculate Shipping' }).click();
    await this.page.getByText('UPS Ground').click();

    const shippingOption = this.page
      .getByRole('radio', { name: /UPS\s*Ground/i })
      .first();

    await expect(shippingOption).toBeVisible({ timeout: 30_000 });
    await shippingOption.check();

    await this.page.getByRole('button', { name: 'Step 2: Payment ' }).click();
  }
}

