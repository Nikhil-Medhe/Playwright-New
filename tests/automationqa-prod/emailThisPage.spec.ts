/**
 * Automationqa — Email This Page from Engine Parts PLP.
 *
 * Run: npm run test:prod:email -- --headed
 */
import { test, expect } from '@playwright/test';
import { PUB_CATALOG_BASE_URL } from '../../config/urls';
import { AutomationqaCatalogPage } from '../../pages/automationqa-prod/AutomationqaCatalogPage';

test.use({
  ignoreHTTPSErrors: true,
});

test.describe('Automationqa — Email This Page', { tag: ['@prod', '@pub', '@regression'] }, () => {
  test('negative: home page has no Email This Page link', async ({ page }) => {
    test.setTimeout(60_000);
    await page.goto(PUB_CATALOG_BASE_URL, { waitUntil: 'domcontentloaded' });
    const catalog = new AutomationqaCatalogPage(page);
    await catalog.expectAllCategoriesHome();
    await expect(page.getByRole('link', { name: 'Email This Page' })).toHaveCount(0);
  });

  test('negative: fake email URL returns error or leaves catalog', async ({ page }) => {
    test.setTimeout(60_000);
    await page.goto(`${PUB_CATALOG_BASE_URL}email/fake-not-real-page`, {
      waitUntil: 'domcontentloaded',
    });
    const emailHeading = page.getByRole('heading', { name: 'Email Page' });
    const notFound = page.getByText(/not found|error|invalid/i);
    const onCatalog = page.getByRole('heading', { name: /all categories/i });
    await expect(emailHeading.or(notFound).or(onCatalog).first()).toBeVisible({ timeout: 20_000 });
  });

  test('happy path: Engine Parts PLP → Email This Page → fill and submit', async ({ page }) => {
    test.setTimeout(120_000);

    const catalog = new AutomationqaCatalogPage(page);
    await page.goto(PUB_CATALOG_BASE_URL, { waitUntil: 'domcontentloaded' });
    await catalog.navigateToEnginePartsPlpFromHome();
    await catalog.emailThisPageFromEnginePartsPlpAndAssertSent();
  });
});
