import { test, expect } from '@playwright/test';
import { PUB_CATALOG_BASE_URL } from '../../config/urls';
import { PublicCatalogPage } from '../../pages/qam/PublicCatalogPage';

test.use({
  ignoreHTTPSErrors: true,
});

test.describe('QAM — Keyword Search', { tag: ['@qam', '@pub', '@smoke', '@regression'] }, () => {
  test('negative: unknown keyword shows no results', async ({ page }) => {
    test.setTimeout(60_000);

    const catalog = new PublicCatalogPage(page);
    await catalog.gotoHome();
    await catalog.expectAllCategoriesHeading();
    await catalog.searchKeyword('xyznotexist999');
    await catalog.expectNoKeywordResultsFor('xyznotexist999');
  });

  test('negative: empty search stays on catalog home', async ({ page }) => {
    test.setTimeout(60_000);

    const catalog = new PublicCatalogPage(page);
    await catalog.gotoHome();
    await catalog.expectAllCategoriesHeading();
    await page.getByRole('textbox').first().press('Enter');
    await page.waitForLoadState('domcontentloaded');
    await catalog.expectAllCategoriesHeading();
  });

  test('happy path: cluch keyword finds item heading', async ({ page }) => {
    test.setTimeout(60_000);

    const catalog = new PublicCatalogPage(page);
    await catalog.gotoHome();
    await catalog.searchKeywordAndExpectItemHeading('cluch', 'Item # 2, Cluch');
  });
});
