import { test } from '@playwright/test';
import { PublicCatalogPage } from '../pages/PublicCatalogPage';

test.use({
  ignoreHTTPSErrors: true,
});

test('Compare items — PLP checkboxes then compare view', async ({ page }) => {
  test.setTimeout(60_000);
  const catalog = new PublicCatalogPage(page);
  await catalog.gotoHome();
  await catalog.openEngineParts();
  await catalog.openBrakeSystemViewItemsPlP();
  await catalog.compareBrakePlPItemsByIds('3269', '3270');
  await catalog.expectCompareBrakeAndCluchCells();
});
