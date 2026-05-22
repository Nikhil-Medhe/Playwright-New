import { type Page, expect } from '@playwright/test';
import { BasePage } from '../core/BasePage';

export class WebsiteManagerPage extends BasePage {
  constructor(page: Page) {
    super(page);
  }

  /**
   * Cad Site Version → Details (`WebManEditVersion.aspx`).
   * Select the grid row first (`vrId`), then run `EditVersion()` — same as the Edit flyout “Details” item
   * (`onMenuItemAction` → `EditVersion`). Clicks on `#menuItem0` / `#menuItemHilite0` alone do not navigate.
   */
  async openCadSiteVersionDetails() {
    const versionCell = this.page.getByRole('cell', { name: 'Cad Site Version', exact: true });
    await versionCell.scrollIntoViewIfNeeded();
    await versionCell.click();

    await Promise.all([
      this.page.waitForURL(/WebManEditVersion\.aspx/i, { timeout: 45_000 }),
      this.page.evaluate(() => {
        const w = window as Window & { EditVersion?: () => void };
        if (typeof w.EditVersion !== 'function') {
          throw new Error('Website Manager: EditVersion() is not available on this page');
        }
        w.EditVersion();
      }),
    ]);

    await this.page.waitForLoadState('domcontentloaded');
  }

  /**
   * Clicks the configured pub-catalog link on WM (opens a new browser tab / window).
   * @param linkName Exact accessible name of the link (often the pub site URL).
   */
  async openPubCatalogInNewTab(linkName: string): Promise<Page> {
    const popupPromise = this.page.waitForEvent('popup', { timeout: 120_000 });
    const trimmed = linkName.trim().replace(/\/?$/, '');
    let host = '';
    try {
      host = new URL(trimmed.startsWith('http') ? trimmed : `https://${trimmed}`).hostname;
    } catch {
      host = trimmed.replace(/^https?:\/\//, '').split('/')[0];
    }

    const byRoleExact = this.page.getByRole('link', { name: linkName, exact: true });
    const byRoleHost = this.page.getByRole('link', { name: new RegExp(host.replace(/\./g, '\\.')) }).first();
    const byHrefExact = this.page.locator(`a[href="${trimmed}"], a[href="${trimmed}/"]`).first();
    const byHrefPrefix = this.page.locator(`a[href^="${trimmed}"]`).first();
    const byHrefHost = this.page.locator(`a[href*="${host}"]`).first();

    const target =
      (await byRoleExact.isVisible({ timeout: 4000 }).catch(() => false))
        ? byRoleExact
        : (await byHrefExact.isVisible({ timeout: 2000 }).catch(() => false))
          ? byHrefExact
          : (await byHrefPrefix.isVisible({ timeout: 2000 }).catch(() => false))
            ? byHrefPrefix
            : (await byRoleHost.isVisible({ timeout: 4000 }).catch(() => false))
              ? byRoleHost
              : byHrefHost;

    await expect(target).toBeVisible({ timeout: 20_000 });
    await target.click();
    return await popupPromise;
  }
}
