import { test, expect } from '@playwright/test';
import { PUB_CATALOG_BASE_URL } from '../../config/urls';
import { PublicCatalogPage } from '../../pages/qam/PublicCatalogPage';

test.use({
  ignoreHTTPSErrors: true,
});

test.describe('QAM — Email This Page', { tag: ['@qam', '@pub', '@regression'] }, () => {
  test('negative: home page has no Email This Page link', async ({ page }) => {
    test.setTimeout(60_000);
    const catalog = new PublicCatalogPage(page);
    await catalog.gotoHome();
    await catalog.expectAllCategoriesHeading();
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

  test('happy path: Brake system PLP → Email This Page → fill and submit', async ({ page }) => {
    test.setTimeout(90_000);

    const catalog = new PublicCatalogPage(page);
    await catalog.gotoEngineBrakeViewItemsFromHome();
    await catalog.emailThisPageFromBrakeViewItemsAndAssertSent();
  });
});
