import { Page, expect } from '@playwright/test';
import { BasePage } from '../core/BasePage';

export class WebsiteManagerPage extends BasePage {
  constructor(page: Page) {
    super(page);
  }

  /**
   * Cad Site Version row: focus cell → hover Edit (`ShowTopEditSubMenus('dgViewVersions_ctl09_iBtnEditVersion',true)`)
   * → Details. Prefer ctl09 grid id from WM; if row order changes, fall back to Edit in the Cad Site Version row.
   */
  async openCadSiteVersionDetails() {
    const versionCell = this.page.getByRole('cell', { name: 'Cad Site Version', exact: true });
    await versionCell.click();

    const editById = this.page.locator('input#dgViewVersions_ctl09_iBtnEditVersion[type="image"]');
    const row = this.page.getByRole('row').filter({ has: versionCell });
    const editInRow = row.locator('input[type="image"][id*="iBtnEditVersion"]').first();
    const editButton = (await editById.isVisible().catch(() => false)) ? editById : editInRow;
    await expect(editButton).toBeVisible({ timeout: 15_000 });
    await editButton.scrollIntoViewIfNeeded();
    await editButton.hover();
    await editButton.dispatchEvent('mouseover');

    const detailsLink = this.page.getByRole('link', { name: 'Details', exact: true });
    if (await detailsLink.isVisible({ timeout: 3_000 }).catch(() => false)) {
      await detailsLink.click({ force: true });
      return;
    }
    /** Hilite layer stays `visibility:hidden` until positioned; click still targets “Details” like manual UI. */
    const menuHilite = this.page.locator('#menuItemHilite0');
    await menuHilite.waitFor({ state: 'attached', timeout: 10_000 });
    await menuHilite.click({ force: true });
  }
}

