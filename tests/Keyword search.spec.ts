import { test } from '@playwright/test';
import { PublicCatalogPage } from '../pages/PublicCatalogPage';

test('Keyword search — cluch finds item heading', async ({ page }) => {
  const catalog = new PublicCatalogPage(page);
  await catalog.gotoHome();
  await catalog.searchKeywordAndExpectItemHeading('cluch', 'Item # 2, Cluch');
});
