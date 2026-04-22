import { test, expect } from '@playwright/test';

test.use({
  ignoreHTTPSErrors: true
});

test('test', async ({ page }) => {
  await page.goto('https://tools.cn-qam-stage.catnav.us/loginmanager/login.aspx?ReturnUrl=/CatalogManager/CategoryTree.aspx');
  await page.getByRole('textbox', { name: 'Enter company name' }).click();
  await page.getByRole('textbox', { name: 'Enter company name' }).fill('nikhil');
  await page.getByRole('textbox', { name: 'Enter company name' }).press('Tab');
  await page.getByRole('textbox', { name: 'Enter your user name' }).fill('nikhilmedhe');
  await page.getByRole('textbox', { name: 'Enter your user name' }).press('Tab');
  await page.getByRole('textbox', { name: 'Enter your password' }).press('CapsLock');
  await page.getByRole('textbox', { name: 'Enter your password' }).fill('N');
  await page.getByRole('textbox', { name: 'Enter your password' }).press('CapsLock');
  await page.getByRole('textbox', { name: 'Enter your password' }).fill('New@nikhil123');
  await page.locator('#ddlApplication').selectOption('95');
  await page.getByRole('button', { name: 'Sign In' }).click();
  await page.locator('#ctl00_MainContent_ddlOrderType').selectOption('0');
  await page.getByRole('button', { name: 'Search' }).click();
});