import { test, expect } from '@playwright/test';

test.use({
  ignoreHTTPSErrors: true
});

test('test', async ({ page }) => {
  await page.goto('https://nikhil.cn-qam-stage.catnav.us/category');
  await page.getByRole('textbox').click();
  await page.getByRole('textbox').press('CapsLock');
  await page.getByRole('textbox').fill('B');
  await page.getByRole('textbox').press('CapsLock');
  await page.getByRole('textbox').fill('Break');
  await page.locator('#search').click();
  await page.getByRole('link', { name: 'All Categories' }).click();
  await page.getByRole('textbox').click();
  await page.getByRole('textbox').fill('Brake');
  await page.locator('#search').click();
});