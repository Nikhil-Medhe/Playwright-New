import { test, expect } from '@playwright/test';
import { PUB_CATALOG_BASE_URL } from '../config/urls';

/** PLP: pick 5 line items + blocked 6th; same five items asserted again on confirmation rows. */
const MAX_ITEMS_MSG =
  'You can only check up to 5 items. Uncheck items to make changes to your selections.';

const PLP_FIRST_FIVE_IDS = ['3269', '3270', '3271', '3272', '3273'] as const;
const PLP_SIXTH_ID = '3274';

const RFI_CONFIRMATION_ROW_NAMES = [
  'Item # 1, Brake',
  'Item # 2, Cluch',
  'Item # 3, Paddel',
  'Item # 4, Brt-',
  'Item # 5, Brt-',
] as const;

test.use({
  ignoreHTTPSErrors: true,
  viewport: null,
  launchOptions: {
    slowMo: Number(process.env.SLOW_MO) || 400,
    args: ['--start-maximized'],
  },
});

test('test', async ({ page }) => {
  test.setTimeout(180_000);
  await page.goto(PUB_CATALOG_BASE_URL, { waitUntil: 'domcontentloaded' });
  await page.getByRole('link', { name: 'Engine parts' }).click();
  await page.getByRole('link', { name: 'Brake system' }).click();
  for (const id of PLP_FIRST_FIVE_IDS) {
    await page.locator(`[id="${id}"]`).check();
  }
  await page.locator(`[id="${PLP_SIXTH_ID}"]`).click();
  await expect(page.getByText(MAX_ITEMS_MSG)).toBeVisible({ timeout: 20_000 });
  await expect(page.locator(`[id="${PLP_SIXTH_ID}"]`)).not.toBeChecked();
  await page.getByRole('button', { name: 'Request Information' }).click();
  await page.getByRole('button', { name: 'Next' }).click();
  await page.locator('#RFIAttributes_0__Value_0__Data_Char').click();
  await page.locator('#RFIAttributes_0__Value_0__Data_Char').fill('N');
  await page.locator('#RFIAttributes_0__Value_0__Data_Char').press('CapsLock');
  await page.locator('#RFIAttributes_0__Value_0__Data_Char').fill('Nikhil');
  await page.locator('#RFIAttributes_0__Value_0__Data_Char').press('Tab');
  await page.locator('#RFIAttributes_0__Value_1__Data_Char').fill('qa');
  await page.locator('#RFIAttributes_0__Value_1__Data_Char').press('Tab');
  await page.locator('#RFIAttributes_1__Value_0__Data_Char').fill('test');
  await page.locator('#RFIAttributes_1__Value_0__Data_Char').press('Tab');
  await page.locator('#RFIAttributes_2__Value_0__Data_Char').fill('project');
  await page.locator('#RFIAttributes_2__Value_0__Data_Char').press('Tab');
  await page.locator('#RFIAttributes_3__Value_0__Data_Char').fill('location');
  await page.locator('#RFIAttributes_3__Value_0__Data_Char').press('Tab');
  await page.locator('#RFIAttributes_4__Value_0__Data_Char').fill('title');
  await page.locator('#RFIAttributes_4__Value_0__Data_Char').press('Tab');
  await page.locator('#RFIAttributes_5__Value_0__Data_Char').fill('qa');
  await page.locator('#RFIAttributes_5__Value_0__Data_Char').press('Tab');
  await page.locator('#RFIAttributes_6__Value_0__Data_Char').fill('street one');
  await page.locator('#RFIAttributes_6__Value_0__Data_Char').press('Tab');
  await page.locator('#RFIAttributes_7__Value_0__Data_Char').fill('two');
  await page.locator('#RFIAttributes_7__Value_0__Data_Char').press('Tab');
  await page.locator('#RFIAttributes_8__Value_0__Data_Char').press('CapsLock');
  await page.locator('#RFIAttributes_8__Value_0__Data_Char').fill('N');
  await page.locator('#RFIAttributes_8__Value_0__Data_Char').press('CapsLock');
  await page.locator('#RFIAttributes_8__Value_0__Data_Char').fill('New york');
  await page.locator('#RFIAttributes_8__Value_0__Data_Char').press('Tab');
  await page.locator('#RFIAttributes_9__Value_0__Data_Char').press('CapsLock');
  await page.locator('#RFIAttributes_9__Value_0__Data_Char').fill('N');
  await page.locator('#RFIAttributes_9__Value_0__Data_Char').press('CapsLock');
  await page.locator('#RFIAttributes_9__Value_0__Data_Char').fill('New york');
  await page.locator('#RFIAttributes_9__Value_0__Data_Char').press('Tab');
  await page.locator('#RFIAttributes_10__Value_0__Data_Char').fill('100001');
  await page.locator('#RFIAttributes_11__Value_0__Data_Char').click();
  await page.locator('#RFIAttributes_11__Value_0__Data_Char').press('CapsLock');
  await page.locator('#RFIAttributes_11__Value_0__Data_Char').fill('U');
  await page.locator('#RFIAttributes_11__Value_0__Data_Char').press('CapsLock');
  await page.locator('#RFIAttributes_11__Value_0__Data_Char').fill('United states of america');
  await page.locator('#RFIAttributes_12__Value_0__Data_Char').click();
  await page.locator('#RFIAttributes_12__Value_0__Data_Char').fill('12345678901');
  await page.locator('#RFIAttributes_13__Value_0__Data_Char').click();
  await page.locator('#RFIAttributes_13__Value_0__Data_Char').fill('12345');
  await page.locator('#RFIAttributes_13__Value_0__Data_Char').press('Tab');
  await page.locator('#RFIAttributes_14__Value_0__Data_Char').fill('nikhil.medhe@firstsource.com');
  await page.locator('#RFIAttributes_15__Value_0__Data_Char').click();
  await page.locator('#RFIAttributes_15__Value_0__Data_Char').press('CapsLock');
  await page.locator('#RFIAttributes_15__Value_0__Data_Char').fill('QA');
  await page.getByRole('row', { name: 'Send Copy to Self' }).getByRole('checkbox').check();
  await page.getByText('<p><></p>').click();
  await page.getByText('<p><></p>').fill('C');
  await page.getByRole('row', { name: 'Remember my Information' }).getByRole('checkbox').check();
  await page.getByText('<p><></p>').press('CapsLock');
  await page.getByText('<p><></p>').fill('Comments');
 
  await page.getByRole('button', { name: 'Submit' }).nth(1).click();
  await expect(page.getByText('Your message has been')).toBeVisible();
  // PLP selection 3269–3273 must match these five confirmation table cells (single source: RFI_CONFIRMATION_ROW_NAMES).
  for (const name of RFI_CONFIRMATION_ROW_NAMES) {
    await expect(page.getByRole('cell', { name })).toBeVisible();
  }
});