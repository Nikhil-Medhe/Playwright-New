import { test } from '@playwright/test';
import { readLastOrderRef } from '../helpers/lastOrderRefArtifact';
import { OrderManagerPage } from '../pages/OrderManagerPage';

test.use({
  ignoreHTTPSErrors: true,
});

/**
 * Order Manager login + search by order #.
 * Order ref: `ORDER_REF` env **or** `test-results/last-order-ref.txt` (written by `cadSiteVersion1.spec.ts` after thank-you).
 */
test('Order Manager: login, search by order number, verify row', async ({ page }) => {
  test.setTimeout(120_000);

  await page.goto(
    'https://tools.cn-qam-stage.catnav.us/loginmanager/login.aspx?ReturnUrl=/CatalogManager/CategoryTree.aspx',
  );
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
  await page.waitForLoadState('domcontentloaded');

  const om = new OrderManagerPage(page);
  await om.gotoOrderHome();

  const orderType = page.locator('#ctl00_MainContent_ddlOrderType');
  if (await orderType.isVisible({ timeout: 15_000 }).catch(() => false)) {
    await orderType.selectOption('0');
    await page.getByRole('button', { name: 'Search' }).click();
    await page.waitForLoadState('domcontentloaded');
  }

  const orderRef = process.env.ORDER_REF?.trim() || readLastOrderRef() || undefined;
  test.skip(
    !orderRef,
    'Set ORDER_REF or run tests/cadSiteVersion1.spec.ts first (writes test-results/last-order-ref.txt). Example: ORDER_REF=60 npx playwright test tests/orderManager.spec.ts',
  );

  await om.searchByOrderNumber(orderRef!);
  await om.expectOrderRowExists(orderRef!);
});
