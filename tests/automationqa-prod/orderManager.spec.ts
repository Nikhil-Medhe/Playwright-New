/**
 * Automationqa PROD — Order Manager (same as QAM `orderManager.spec.ts`).
 * Order #: ORDER_REF env, test-results/last-order-ref.txt, or auto pub checkout (self-contained).
 *
 * Run alone: npm run test:prod:order
 * Full chain: npm run test:prod:cad1-then-om
 */
import { test, expect } from '@playwright/test';
import { ensureOrderRef } from '../../helpers/ensureOrderRef';
import { OrderManagerPage, ORDER_MANAGER_HOME } from '../../pages/common/OrderManagerPage';
import { LoginPage } from '../../pages/common/LoginPage';
import { getDefaultLoginUser } from '../../helpers/dataLoader';

test.use({
  ignoreHTTPSErrors: true,
});

test.describe('Automationqa — Order Manager', { tag: ['@prod', '@order', '@tools', '@regression'] }, () => {
  test('negative: unauthenticated Order Manager redirects to login', async ({ page }) => {
    test.setTimeout(60_000);
    await page.goto(ORDER_MANAGER_HOME, { waitUntil: 'domcontentloaded' });
    await expect(page).toHaveURL(/login/i, { timeout: 20_000 });
  });

  test('negative: invalid login credentials', async ({ page }) => {
    test.setTimeout(60_000);
    const loginPage = new LoginPage(page);
    await loginPage.goto();
    await loginPage.attemptSignIn(
      {
        company: 'Automationqa',
        username: 'Automationqa',
        password: 'WrongPassword_NotReal_999!',
      },
      { value: '95' },
    );
    await expect(page).toHaveURL(/login/i, { timeout: 20_000 });
    await expect(loginPage.invalidCredentialsMessage()).toBeVisible({ timeout: 15_000 });
  });

  test('happy path: login, search order number, verify row', async ({ page }) => {
    test.setTimeout(300_000);

    const orderRef = await ensureOrderRef(page, 'prod');

    const loginPage = new LoginPage(page);
    await loginPage.goto();
    await loginPage.loginToOrderManager(getDefaultLoginUser());
    await page.waitForLoadState('domcontentloaded');

    const om = new OrderManagerPage(page);
    await om.gotoOrderHome();

    const orderType = page.locator('#ctl00_MainContent_ddlOrderType');
    if (await orderType.isVisible({ timeout: 15_000 }).catch(() => false)) {
      await orderType.selectOption('0');
      await page.getByRole('button', { name: 'Search' }).click();
      await page.waitForLoadState('domcontentloaded');
    }

    await om.searchByOrderNumber(orderRef);
    await om.expectOrderRowExists(orderRef);
  });
});
