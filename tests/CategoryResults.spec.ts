import { test, expect } from '@playwright/test';

test.use({
  ignoreHTTPSErrors: true,
});

test('category results — search Brake', async ({ page }) => {
  const categoryUrl =
    process.env.CATEGORY_RESULTS_URL || 'https://nikhil.cn-qam-stage.catnav.us/category';

  await test.step('Open category landing', async () => {
    await page.goto(categoryUrl, { waitUntil: 'domcontentloaded', timeout: 60_000 });
    await expect(page).toHaveURL(/category/i);
  });

  await test.step('Search and assert results surface', async () => {
    const searchBox = page.getByRole('textbox');
    await expect(searchBox).toBeVisible();
    await expect(searchBox).toBeEnabled();
    await searchBox.click();
    await searchBox.fill('Brake');
    await expect(searchBox).toHaveValue('Brake');
    const searchTrigger = page.locator('#search');
    await expect(searchTrigger).toBeVisible();
    await expect(searchTrigger).toBeEnabled();
    await searchTrigger.click();
    const resultLink = page.getByRole('link', { name: /brake/i }).first();
    await expect(resultLink).toBeVisible({ timeout: 15_000 });
    await expect(resultLink).toBeEnabled();
  });
});
