/**
 * Automationqa — Keyword search on pub catalog.
 *
 * Run: npm run test:prod:keyword -- --headed
 */
import { test, expect } from '@playwright/test';
import { PUB_CATALOG_BASE_URL } from '../../config/urls';
import { AutomationqaCatalogPage } from '../../pages/automationqa-prod/AutomationqaCatalogPage';

test.use({
  ignoreHTTPSErrors: true,
});

test.describe('Automationqa — Keyword Search', { tag: ['@prod', '@pub', '@smoke', '@regression'] }, () => {
  test('negative: unknown keyword shows no results', async ({ page }) => {
    test.setTimeout(60_000);

    const catalog = new AutomationqaCatalogPage(page);
    await page.goto(PUB_CATALOG_BASE_URL, { waitUntil: 'domcontentloaded' });
    await catalog.expectAllCategoriesHome();
    await catalog.searchKeyword('xyznotexist999');
    await catalog.expectNoKeywordResultsFor('xyznotexist999');
  });

  test('negative: empty search stays on catalog home', async ({ page }) => {
    test.setTimeout(60_000);

    const catalog = new AutomationqaCatalogPage(page);
    await page.goto(PUB_CATALOG_BASE_URL, { waitUntil: 'domcontentloaded' });
    await catalog.expectAllCategoriesHome();
    await page.getByRole('textbox').first().press('Enter');
    await page.waitForLoadState('domcontentloaded');
    await catalog.expectAllCategoriesHome();
  });

  test('happy path: valve cover pro → results → item page', async ({ page }) => {
    test.setTimeout(90_000);

    const catalog = new AutomationqaCatalogPage(page);
    await page.goto(PUB_CATALOG_BASE_URL, { waitUntil: 'domcontentloaded' });
    await catalog.expectAllCategoriesHome();

    await catalog.searchKeyword('valve cover pro');
    await catalog.expectKeywordResultsFor(/valve cover pro/i);
    await catalog.openKeywordResultItem(/Valve Cover Pro 1/i);
    await catalog.expectValveCoverPro1ItemPage();
  });
});
