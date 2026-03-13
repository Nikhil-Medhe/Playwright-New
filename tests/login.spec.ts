import { test } from '@playwright/test';
import { LoginPage } from '../pages/LoginPage';
import { getLoginUsers } from '../helpers/dataLoader';

const loginUsers = getLoginUsers();

test.describe('Login', () => {
  for (const creds of loginUsers) {
    test(`can login as ${creds.username}`, async ({ page }) => {
      const loginPage = new LoginPage(page);
      await loginPage.goto();
      await loginPage.loginToWebsiteManager(creds);

      // Put assertions here (e.g. check landing page visible / user name shown)
      // Example: await expect(page).toHaveURL(/some-expected-path/);
    });
  }
});
