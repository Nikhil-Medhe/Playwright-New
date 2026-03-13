import { expect } from '@playwright/test';
import { BasePage } from '../core/BasePage';
import { getDefaultLoginUser } from '../helpers/dataLoader';
import type { LoginCreds } from '../helpers/dataLoader';

export class LoginPage extends BasePage {
  async goto(returnPath: string = '/CatalogManager/CategoryTree.aspx') {
    const path = `/loginmanager/login.aspx?ReturnUrl=${encodeURIComponent(returnPath)}`;
    await super.goto(path);
  }

  async loginToWebsiteManager(options?: LoginCreds) {
    const { company, username, password } = options ?? getDefaultLoginUser();

    await this.byPlaceholder('Enter company name').fill(company);
    await this.byPlaceholder('Enter your user name').fill(username);
    await this.byPlaceholder('Enter your password').fill(password);

    await this.page.selectOption('#ddlApplication', { label: 'Website Manager' });
    await this.byRole('button', 'Sign In').click();

    await expect(this.page).not.toHaveURL(/login\.aspx/);
  }
}

