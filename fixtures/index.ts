import { test as base, expect, Page } from '@playwright/test';
import { LoginPage } from '../pages/LoginPage';
import { getDefaultLoginUser } from '../helpers/dataLoader';
import { envConfig } from '../config/env';
import type { LoginCreds } from '../helpers/dataLoader';

type Fixtures = {
  loginPage: LoginPage;
  loggedInWebsiteManagerPage: Page;
  /** Default credentials from Data/credentials.json or LOGIN_USERS */
  defaultCreds: LoginCreds;
  /** Base URL from config (env-driven) */
  baseURL: string;
};

export const test = base.extend<Fixtures>({
  baseURL: async ({}, use) => {
    await use(envConfig.baseURL);
  },

  defaultCreds: async ({}, use) => {
    await use(getDefaultLoginUser());
  },

  loginPage: async ({ page }, use) => {
    await use(new LoginPage(page));
  },

  loggedInWebsiteManagerPage: async ({ page, loginPage }, use) => {
    await loginPage.goto('/WebSiteManager/WebMainViewVersions.aspx');
    const creds = getDefaultLoginUser();
    await loginPage.loginToWebsiteManager(creds);
    await use(page);
  },
});

export { expect } from '@playwright/test';
