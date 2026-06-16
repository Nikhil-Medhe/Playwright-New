import { test, expect } from '@playwright/test';
import { PublicCatalogPage } from '../../pages/qam/PublicCatalogPage';

test.use({
  ignoreHTTPSErrors: true,
});

test.describe('QAM — Compare Items', { tag: ['@qam', '@pub', '@smoke', '@regression'] }, () => {
  test('negative: Compare Items with no selection stays on PLP', async ({ page }) => {
    test.setTimeout(60_000);

    const catalog = new PublicCatalogPage(page);
    await catalog.gotoEngineBrakeViewItemsFromHome();
    const plpUrl = page.url();

    await page.getByRole('button', { name: 'Compare Items' }).click();
    await page.waitForTimeout(1500);
    await expect(page).toHaveURL(plpUrl);
    await expect(page).not.toHaveURL(/\/compare\//i);
  });

  test('negative: single item selected does not open compare view', async ({ page }) => {
    test.setTimeout(60_000);

    const catalog = new PublicCatalogPage(page);
    await catalog.gotoEngineBrakeViewItemsFromHome();
    const ids = await catalog.getPlPSearchSelectionCheckboxIds();
    expect(ids.length).toBeGreaterThanOrEqual(2);

    await page.locator(`[id="${ids[0]}"]`).check();
    await page.getByRole('button', { name: 'Compare Items' }).click();
    await page.waitForTimeout(1500);
    await expect(page).not.toHaveURL(/\/compare\//i);
  });

  test('happy path: compare Brake and Cluch from PLP checkboxes', async ({ page }) => {
    test.setTimeout(60_000);

    const catalog = new PublicCatalogPage(page);
    await catalog.gotoHome();
    await catalog.openEngineParts();
    await catalog.openBrakeSystemViewItemsPlP();
    await catalog.compareBrakePlPItemsByIds('3269', '3270');
    await expect(page).toHaveURL(/\/compare\//i);
    await catalog.expectCompareBrakeAndCluchCells();
  });
});
