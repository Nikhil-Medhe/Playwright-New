import { Page } from '@playwright/test';
import { BasePage } from '../core/BasePage';

export class WebsiteManagerPage extends BasePage {
  constructor(page: Page) {
    super(page);
  }

  async openCadSiteVersionDetails() {
    await this.page
      .getByRole('cell', { name: 'Cad Site Version', exact: true })
      .click();

    const editButton = this.page.locator('#dgViewVersions_ctl09_iBtnEditVersion');
    await editButton.hover();

    const detailsHighlight = this.page.locator('#menuItemHilite0');
    await detailsHighlight.waitFor({ state: 'attached', timeout: 10000 });
    await detailsHighlight.click({ force: true });
  }
}

