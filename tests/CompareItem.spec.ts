import { test, expect } from '@playwright/test';

test.use({
  ignoreHTTPSErrors: true
});

test('test', async ({ page }) => {
  await page.goto('https://nikhil.cn-qam-pub.catnav.us/');
  await page.getByRole('link', { name: 'Engine parts' }).click();
  await page.getByRole('link', { name: 'Brake system' }).click();
  await page.locator('[id="1070"]').check();
  await page.locator('[id="1071"]').check();
  await page.getByRole('button', { name: 'Compare Items' }).click();
});