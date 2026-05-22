import { test } from '@playwright/test';
import { readLastOrderRef } from '../helpers/lastOrderRefArtifact';
import { OrderManagerPage } from '../pages/OrderManagerPage';
import { LoginPage } from '../pages/LoginPage';

test.use({
  ignoreHTTPSErrors: true,
});

/**
 * Order Manager login + search by order #.
 * Order ref: `ORDER_REF` env **or** `test-results/last-order-ref.txt` (written by `cadSiteVersion1.spec.ts` after thank-you).
 */
test('Order Manager: login, search by order number, verify row', async ({ page }) => {
  test.setTimeout(120_000);

  const loginPage = new LoginPage(page);
  await loginPage.goto();
  await loginPage.loginToOrderManager();
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
