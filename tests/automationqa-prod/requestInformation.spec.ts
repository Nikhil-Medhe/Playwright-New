/**
 * Automationqa — Request Information (RFI) from Engine Parts PLP.
 *
 * Run: npm run test:prod:rfi -- --headed
 */
import { test, expect } from '@playwright/test';
import { PUB_CATALOG_BASE_URL } from '../../config/urls';
import { AutomationqaCatalogPage } from '../../pages/automationqa-prod/AutomationqaCatalogPage';
import { RequestInformationPage, RFI_MAX_ITEMS_MESSAGE } from '../../pages/common/RequestInformationPage';

test.use({
  ignoreHTTPSErrors: true,
});

test.describe('Automationqa — Request Information', { tag: ['@prod', '@pub', '@regression'] }, () => {
  test('negative: sixth PLP item shows max-5 validation', async ({ page }) => {
    test.setTimeout(120_000);

    const catalog = new AutomationqaCatalogPage(page);
    await page.goto(PUB_CATALOG_BASE_URL, { waitUntil: 'domcontentloaded' });
    await catalog.navigateToEnginePartsPlpFromHome();

    const ids = await catalog.getPlPCheckboxIds();
    expect(ids.length, 'Engine Parts PLP needs ≥6 rows for max-5 validation').toBeGreaterThanOrEqual(6);
    const firstFive = ids.slice(0, 5);
    const sixthId = ids[5];

    await catalog.checkPlPItemIds(firstFive);
    await page.waitForTimeout(400);
    await page.locator(`[id="${sixthId}"]`).scrollIntoViewIfNeeded();
    await page.locator(`[id="${sixthId}"]`).click();
    await expect(page.getByText(RFI_MAX_ITEMS_MESSAGE)).toBeVisible({ timeout: 20_000 });
    await expect(page.locator(`[id="${sixthId}"]`)).not.toBeChecked();
  });

  test('happy path: five items (incl. Valve Cover Pro 1) → submit RFI', async ({ page }) => {
    test.setTimeout(180_000);

    const catalog = new AutomationqaCatalogPage(page);
    await page.goto(PUB_CATALOG_BASE_URL, { waitUntil: 'domcontentloaded' });
    await catalog.navigateToEnginePartsPlpFromHome();

    const ids = await catalog.getPlPCheckboxIds();
    expect(ids.length, 'Engine Parts PLP needs ≥5 rows for RFI').toBeGreaterThanOrEqual(5);
    const firstFive = ids.slice(0, 5);

    await catalog.checkPlPItemIds(firstFive);
    await catalog.clickRequestInformation();

    const rfi = new RequestInformationPage(page);
    await rfi.expectStep1SelectedItems(firstFive, { heading: 'Request Information' });
    await expect(page.getByText(/Valve Cover Pro 1/i)).toBeVisible();

    await rfi.fillAutomationqaRfiForm();
    await rfi.expectAutomationqaSubmitResult();
  });
});
