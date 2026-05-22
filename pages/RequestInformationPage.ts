import { expect, type Page } from '@playwright/test';
import { BasePage } from '../core/BasePage';

export const RFI_MAX_ITEMS_MESSAGE =
  'You can only check up to 5 items. Uncheck items to make changes to your selections.';

/**
 * Request Information (RFI) multi-step form on pub catalog.
 */
export class RequestInformationPage extends BasePage {
  constructor(page: Page) {
    super(page);
  }

  /** Assert RFI step 1 after selecting `selectedCatalogIds` on PLP (order may vary in query string). */
  async expectStep1OptionsFiveItems(selectedCatalogIds: readonly string[]): Promise<void> {
    await expect(this.page).toHaveURL(/\/request\//);
    await expect(this.page).toHaveURL(/itemids=/);
    const url = this.page.url();
    for (const id of selectedCatalogIds) {
      expect(url, `RFI URL should include catalog id ${id}`).toContain(id);
    }

    await expect(this.page.getByRole('heading', { name: 'Request Information Test' })).toBeVisible();
    await expect(
      this.page.getByRole('link', { name: /STEP 1:\s*Options/i }).or(this.page.getByText('STEP 1: Options')),
    ).toBeVisible();

    for (let step = 1; step <= 5; step++) {
      await expect(this.page.getByRole('cell', { name: new RegExp(`Item # ${step},`) }).first()).toBeVisible({
        timeout: 15_000,
      });
    }

    /** Default UPS line is plain table copy — often **no** `<select>` + `<label>` in the accessibility tree (Chromium + Firefox). */
    await expect(
      this.page
        .getByRole('row', { name: /UPS package type/i })
        .filter({ hasText: /Customer Supplied Package/i })
        .first(),
    ).toBeVisible({ timeout: 20_000 });
  }

  async nextFromStep1(): Promise<void> {
    await this.page.getByRole('button', { name: 'Next' }).click();
  }

  /** Step 2+ attribute fields and submit (matches recorded `RequestInformation.spec.ts` flow). */
  async fillAttributesAndSubmit(): Promise<void> {
    await this.page.locator('#RFIAttributes_0__Value_0__Data_Char').click();
    await this.page.locator('#RFIAttributes_0__Value_0__Data_Char').fill('N');
    await this.page.locator('#RFIAttributes_0__Value_0__Data_Char').press('CapsLock');
    await this.page.locator('#RFIAttributes_0__Value_0__Data_Char').fill('Nikhil');
    await this.page.locator('#RFIAttributes_0__Value_0__Data_Char').press('Tab');
    await this.page.locator('#RFIAttributes_0__Value_1__Data_Char').press('Tab');
    await this.page.locator('#RFIAttributes_1__Value_0__Data_Char').press('CapsLock');
    await this.page.locator('#RFIAttributes_1__Value_0__Data_Char').fill('QA');
    await this.page.locator('#RFIAttributes_1__Value_0__Data_Char').press('Tab');
    await this.page.locator('#RFIAttributes_2__Value_0__Data_Char').fill('T');
    await this.page.locator('#RFIAttributes_2__Value_0__Data_Char').press('CapsLock');
    await this.page.locator('#RFIAttributes_2__Value_0__Data_Char').fill('Test');
    await this.page.locator('#RFIAttributes_2__Value_0__Data_Char').press('Tab');
    await this.page.locator('#RFIAttributes_3__Value_0__Data_Char').press('CapsLock');
    await this.page.locator('#RFIAttributes_3__Value_0__Data_Char').fill('T');
    await this.page.locator('#RFIAttributes_3__Value_0__Data_Char').press('CapsLock');
    await this.page.locator('#RFIAttributes_3__Value_0__Data_Char').fill('Test');
    await this.page.locator('#RFIAttributes_3__Value_0__Data_Char').press('Tab');
    await this.page.locator('#RFIAttributes_4__Value_0__Data_Char').press('CapsLock');
    await this.page.locator('#RFIAttributes_4__Value_0__Data_Char').fill('T');
    await this.page.locator('#RFIAttributes_4__Value_0__Data_Char').press('CapsLock');
    await this.page.locator('#RFIAttributes_4__Value_0__Data_Char').fill('Test');
    await this.page.locator('#RFIAttributes_4__Value_0__Data_Char').press('Tab');
    await this.page.locator('#RFIAttributes_5__Value_0__Data_Char').press('CapsLock');
    await this.page.locator('#RFIAttributes_5__Value_0__Data_Char').fill('T');
    await this.page.locator('#RFIAttributes_5__Value_0__Data_Char').press('CapsLock');
    await this.page.locator('#RFIAttributes_5__Value_0__Data_Char').fill('Test');
    await this.page.locator('#RFIAttributes_5__Value_0__Data_Char').press('Tab');
    await this.page.locator('#RFIAttributes_6__Value_0__Data_Char').press('CapsLock');
    await this.page.locator('#RFIAttributes_6__Value_0__Data_Char').fill('T');
    await this.page.locator('#RFIAttributes_6__Value_0__Data_Char').press('CapsLock');
    await this.page.locator('#RFIAttributes_6__Value_0__Data_Char').fill('Test 1');
    await this.page.locator('#RFIAttributes_7__Value_0__Data_Char').click();
    await this.page.locator('#RFIAttributes_7__Value_0__Data_Char').press('CapsLock');
    await this.page.locator('#RFIAttributes_7__Value_0__Data_Char').fill('T');
    await this.page.locator('#RFIAttributes_7__Value_0__Data_Char').press('CapsLock');
    await this.page.locator('#RFIAttributes_7__Value_0__Data_Char').fill('Test 2');
    await this.page.locator('#RFIAttributes_8__Value_0__Data_Char').click();
    await this.page.locator('#RFIAttributes_8__Value_0__Data_Char').press('CapsLock');
    await this.page.locator('#RFIAttributes_8__Value_0__Data_Char').fill('N');
    await this.page.locator('#RFIAttributes_8__Value_0__Data_Char').press('CapsLock');
    await this.page.locator('#RFIAttributes_8__Value_0__Data_Char').fill('New york');
    await this.page.locator('#RFIAttributes_8__Value_0__Data_Char').press('Tab');
    await this.page.locator('#RFIAttributes_9__Value_0__Data_Char').press('CapsLock');
    await this.page.locator('#RFIAttributes_9__Value_0__Data_Char').fill('N');
    await this.page.locator('#RFIAttributes_9__Value_0__Data_Char').press('CapsLock');
    await this.page.locator('#RFIAttributes_9__Value_0__Data_Char').fill('New york');
    await this.page.locator('#RFIAttributes_9__Value_0__Data_Char').press('Tab');
    await this.page.locator('#RFIAttributes_10__Value_0__Data_Char').fill('10001');
    await this.page.locator('#RFIAttributes_11__Value_0__Data_Char').click();
    await this.page.locator('#RFIAttributes_11__Value_0__Data_Char').press('CapsLock');
    await this.page.locator('#RFIAttributes_11__Value_0__Data_Char').fill('UN');
    await this.page.locator('#RFIAttributes_11__Value_0__Data_Char').press('CapsLock');
    await this.page.locator('#RFIAttributes_11__Value_0__Data_Char').fill('');
    await this.page.locator('#RFIAttributes_11__Value_0__Data_Char').press('CapsLock');
    await this.page.locator('#RFIAttributes_11__Value_0__Data_Char').fill('U');
    await this.page.locator('#RFIAttributes_11__Value_0__Data_Char').press('CapsLock');
    await this.page.locator('#RFIAttributes_11__Value_0__Data_Char').fill('United states of ');
    await this.page.locator('#RFIAttributes_11__Value_0__Data_Char').press('CapsLock');
    await this.page.locator('#RFIAttributes_11__Value_0__Data_Char').press('CapsLock');
    await this.page.locator('#RFIAttributes_11__Value_0__Data_Char').fill('United states of america');
    await this.page.locator('#RFIAttributes_12__Value_0__Data_Char').click();
    await this.page.locator('#RFIAttributes_12__Value_0__Data_Char').fill('12345678901');
    await this.page.locator('#RFIAttributes_14__Value_0__Data_Char').click();
    await this.page.locator('#RFIAttributes_14__Value_0__Data_Char').fill('nikhil.medhe@firstsource.com');
    await this.page.locator('#RFIAttributes_14__Value_0__Data_Char').press('Tab');
    await this.page.locator('#RFIAttributes_15__Value_0__Data_Char').press('CapsLock');
    await this.page.locator('#RFIAttributes_15__Value_0__Data_Char').fill('T');
    await this.page.locator('#RFIAttributes_15__Value_0__Data_Char').press('CapsLock');
    await this.page.locator('#RFIAttributes_15__Value_0__Data_Char').fill('Test ');
    await this.page.locator('#RFIAttributes_15__Value_0__Data_Char').press('CapsLock');
    await this.page.locator('#RFIAttributes_15__Value_0__Data_Char').fill('Test QA');
    await this.page.getByRole('row', { name: 'Send Copy to Self' }).getByRole('checkbox').check();
    await this.page.getByRole('row', { name: 'Remember my Information' }).getByRole('checkbox').check();
    await this.page.getByText('<p><></p>').click();
    await this.page.getByText('<p><></p>').press('CapsLock');
    await this.page.getByText('<p><></p>').fill('Test');
    await this.page.getByRole('button', { name: 'Submit' }).nth(1).click();
    await this.page.getByRole('textbox', { name: 'Please complete all required' }).click();
    await this.page.getByRole('textbox', { name: 'Please complete all required' }).press('CapsLock');
    await this.page.getByRole('textbox', { name: 'Please complete all required' }).fill('N');
    await this.page.getByRole('textbox', { name: 'Please complete all required' }).press('CapsLock');
    await this.page.getByRole('textbox', { name: 'Please complete all required' }).fill('Nikhil');
    await this.page.getByRole('button', { name: 'Submit' }).nth(1).click();
  }

  async expectSuccessMessage(): Promise<void> {
    await this.page.getByText('Your message has been').click();
    await expect(this.page.getByText('Your message has been')).toBeVisible();
  }
}
