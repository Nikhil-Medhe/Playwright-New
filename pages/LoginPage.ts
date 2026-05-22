import { expect, type Locator } from '@playwright/test';
import { BasePage } from '../core/BasePage';
import { getDefaultLoginUser } from '../helpers/dataLoader';
import type { LoginCreds } from '../helpers/dataLoader';

export class LoginPage extends BasePage {
  async goto(returnPath: string = '/CatalogManager/CategoryTree.aspx') {
    const path = `/LoginManager/login.aspx?ReturnUrl=${encodeURIComponent(returnPath)}`;
    await super.goto(path);
  }

  /** Shown when company / user / password / app combination is rejected. */
  invalidCredentialsMessage(): Locator {
    return this.page.getByText(
      'We do not recognize the login information that you entered. Please make sure you are typing them correctly.',
    );
  }

  async fillLoginForm(creds: LoginCreds): Promise<void> {
    await this.byPlaceholder('Enter company name').fill(creds.company);
    await this.byPlaceholder('Enter your user name').fill(creds.username);
    await this.byPlaceholder('Enter your password').fill(creds.password);
  }

  /**
   * Submit login without asserting success (negative tests).
   * @param applicationSelect `label` or raw `value` for `#ddlApplication` (e.g. Website Manager ≈ `"30"`, Order Manager ≈ `"95"`).
   */
  async attemptSignIn(
    creds: LoginCreds,
    applicationSelect: { label: string } | { value: string },
  ): Promise<void> {
    await this.fillLoginForm(creds);
    if ('label' in applicationSelect) {
      await this.page.locator('#ddlApplication').selectOption({ label: applicationSelect.label });
    } else {
      await this.page.locator('#ddlApplication').selectOption(applicationSelect.value);
    }
    await this.byRole('button', 'Sign In').click();
  }

  async loginToWebsiteManager(options?: LoginCreds): Promise<void> {
    const creds = options ?? getDefaultLoginUser();
    await this.attemptSignIn(creds, { label: 'Website Manager' });
    await expect(this.page).not.toHaveURL(/login\.aspx/);
  }

  /** Order Manager uses a different `#ddlApplication` value than Website Manager. */
  async loginToOrderManager(options?: LoginCreds): Promise<void> {
    const creds = options ?? getDefaultLoginUser();
    await this.attemptSignIn(creds, { value: '95' });
    await expect(this.page).not.toHaveURL(/login\.aspx/);
  }

  /** Thomas / CatNav tools login — Tools dropdown must be Catalog Manager (prod + QAM). */
  async loginToCatalogManager(options?: LoginCreds): Promise<void> {
    const creds = options ?? getDefaultLoginUser();
    await this.attemptSignIn(creds, { label: 'Catalog Manager' });
    await expect(this.page).not.toHaveURL(/login\.aspx/i);
  }
}

