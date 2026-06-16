import { test, expect } from '@playwright/test';
import { PublicCatalogPage } from '../../pages/qam/PublicCatalogPage';
import { RequestInformationPage, RFI_MAX_ITEMS_MESSAGE } from '../../pages/common/RequestInformationPage';

test.use({
  ignoreHTTPSErrors: true,
});

test.describe('QAM — Request Information', { tag: ['@qam', '@pub', '@regression'] }, () => {
  test('negative: sixth PLP item shows max-5 validation', async ({ browser }) => {
  test.setTimeout(120_000);
  const context = await browser.newContext({ viewport: null, ignoreHTTPSErrors: true });
  const page = await context.newPage();
  try {
    const catalog = new PublicCatalogPage(page);
    await catalog.gotoHome();
    await catalog.openEngineParts();
    await catalog.openBrakeSystemViewItemsPlP();

    const ids = await catalog.getPlPSearchSelectionCheckboxIds();
    expect(ids.length, 'Brake PLP needs ≥6 checkbox rows for max-5 validation').toBeGreaterThanOrEqual(6);
    const firstFive = ids.slice(0, 5);
    const sixthId = ids[5];

    await catalog.checkPlPItemIds(firstFive);
    await page.waitForTimeout(400);
    await page.locator(`[id="${sixthId}"]`).scrollIntoViewIfNeeded();
    await page.locator(`[id="${sixthId}"]`).click();
    await expect(page.getByText(RFI_MAX_ITEMS_MESSAGE)).toBeVisible({ timeout: 20_000 });
    await expect(page.locator(`[id="${sixthId}"]`)).not.toBeChecked();
  } finally {
    await context.close();
  }
  });

  test('happy path: five items PLP → submit RFI', async ({ page }) => {
    test.setTimeout(180_000);
    const catalog = new PublicCatalogPage(page);
    await catalog.gotoHome();
    await catalog.openEngineParts();
    await catalog.openBrakeSystemViewItemsPlP();

    const ids = await catalog.getPlPSearchSelectionCheckboxIds();
    expect(ids.length, 'Brake PLP needs ≥5 rows for RFI').toBeGreaterThanOrEqual(5);
    const firstFive = ids.slice(0, 5);

    await catalog.checkPlPItemIds(firstFive);
    await catalog.clickRequestInformation();

    const rfi = new RequestInformationPage(page);
    await rfi.expectStep1OptionsFiveItems(firstFive);
    await rfi.nextFromStep1();
    await rfi.fillAttributesAndSubmit();
    await rfi.expectSuccessMessage();
  });
});
