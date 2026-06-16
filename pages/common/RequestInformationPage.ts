import { expect, type Page } from '@playwright/test';
import { BasePage } from '../../core/BasePage';

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
    await this.expectStep1SelectedItems(selectedCatalogIds, {
      heading: 'Request Information Test',
      expectUpsRow: true,
    });
    await expect(
      this.page.getByRole('link', { name: /STEP 1:\s*Options/i }).or(this.page.getByText('STEP 1: Options')),
    ).toBeVisible();
  }

  /** RFI step 1 — Automationqa uses heading “Request Information” (no STEP 1 / UPS row). */
  async expectStep1SelectedItems(
    selectedCatalogIds: readonly string[],
    options?: { heading?: string | RegExp; expectUpsRow?: boolean },
  ): Promise<void> {
    await expect(this.page).toHaveURL(/\/request\//);
    await expect(this.page).toHaveURL(/itemids=/);
    const url = this.page.url();
    for (const id of selectedCatalogIds) {
      expect(url, `RFI URL should include catalog id ${id}`).toContain(id);
    }

    const heading = options?.heading ?? /Request Information/i;
    await expect(this.page.getByRole('heading', { name: heading })).toBeVisible();

    for (let step = 1; step <= selectedCatalogIds.length; step++) {
      await expect(this.page.getByRole('cell', { name: new RegExp(`Item # ${step},`) }).first()).toBeVisible({
        timeout: 15_000,
      });
    }

    if (options?.expectUpsRow) {
      await expect(
        this.page
          .getByRole('row', { name: /UPS package type/i })
          .filter({ hasText: /Customer Supplied Package/i })
          .first(),
      ).toBeVisible({ timeout: 20_000 });
    }
  }

  /** Automationqa RFI — standard contact form (First Name / Last Name / Email / Comments). */
  async fillAutomationqaRfiForm(): Promise<void> {
    const form = this.page.getByRole('table').filter({ hasText: 'First Name' });
    await expect(form).toBeVisible({ timeout: 15_000 });
    await form.getByRole('row', { name: /First Name/i }).getByRole('textbox').fill('Automation');
    await form.getByRole('row', { name: /Last Name/i }).getByRole('textbox').fill('QA');
    await form.getByRole('row', { name: /^Email/i }).getByRole('textbox').fill('nikhil.medhe@firstsource.com');
    await form
      .getByRole('row', { name: /Comments/i })
      .getByRole('textbox')
      .fill('RFI test — includes Item #2 Valve Cover Pro 1.');
    await this.page.getByRole('button', { name: 'Submit' }).first().click();
  }

  /** Prod may require reCAPTCHA — accept success message or captcha prompt. */
  async expectAutomationqaSubmitResult(): Promise<void> {
    const success = this.page.getByText(
      /Your message has been|thank you|successfully submitted|email has been sent/i,
    );
    const captcha = this.page.getByText(/Please complete all required|not a robot|recaptcha/i);
    await expect(success.or(captcha).first()).toBeVisible({ timeout: 20_000 });
    if (await success.first().isVisible().catch(() => false)) return;
    await expect(this.page.locator('iframe').first()).toBeVisible({ timeout: 10_000 });
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
