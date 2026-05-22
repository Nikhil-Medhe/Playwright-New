import { expect, type Download, type Page } from '@playwright/test';
import { BasePage } from '../core/BasePage';
import { PUB_CATALOG_BASE_URL } from '../config/urls';

/**
 * Public catalog (pub host): home, category PLP, email-this-page, compare, PDF, keyword search.
 */
export class PublicCatalogPage extends BasePage {
  constructor(page: Page) {
    super(page);
  }

  async gotoHome(waitUntil: 'load' | 'domcontentloaded' = 'domcontentloaded'): Promise<void> {
    await this.page.goto(PUB_CATALOG_BASE_URL, { waitUntil });
  }

  async expectAllCategoriesHeading(): Promise<void> {
    await expect(this.page.getByRole('heading', { name: /all categories/i })).toBeVisible({
      timeout: 30_000,
    });
  }

  /** Home → Engine parts category. */
  async openEngineParts(): Promise<void> {
    await this.page.getByRole('link', { name: 'Engine parts' }).click();
    await expect(this.page).toHaveURL(/engine-parts/);
  }

  /** On engine landing: open Brake system (view-items PLP). */
  async openBrakeSystemViewItemsPlP(): Promise<void> {
    await this.page.getByRole('link', { name: 'Brake system' }).click();
    await expect(this.page).toHaveURL(/viewitems.*brake-system|brake-system/i, { timeout: 20_000 });
  }

  /** Home → Engine parts → Brake system PLP (OrderSubmission / Email flow). */
  async gotoEngineBrakeViewItemsFromHome(): Promise<void> {
    await this.gotoHome();
    await this.expectAllCategoriesHeading();
    await this.openEngineParts();
    await this.openBrakeSystemViewItemsPlP();
  }

  /**
   * First PLP row for brake item `…/1` — set line qty, Add To Cart, View Cart; returns `data-url` from View Cart if present.
   */
  async addFirstBrakePlpRowQtyToCartAndClickViewCart(qty: string): Promise<string | null> {
    const firstItemRow = this.page.locator('tr:has(a[href="/item/engine-parts/brake-system-1/1"])');
    await expect(firstItemRow).toBeVisible({ timeout: 15_000 });
    await firstItemRow.getByRole('textbox').fill(qty);
    await firstItemRow.getByRole('link', { name: 'Add To Cart' }).click();
    const dialog = this.page.getByRole('dialog');
    await expect(dialog).toBeVisible();
    const viewCartBtn = dialog.getByRole('button', { name: 'View Cart' });
    const viewCartDataUrl = await viewCartBtn.getAttribute('data-url');
    await viewCartBtn.click();
    return viewCartDataUrl;
  }

  /** Promotions-style: intermediate “Brake system” hub with h2 before PLP. */
  async gotoEnginePartsThenOpenBrakeSystemHub(): Promise<void> {
    await this.gotoHome();
    await this.page.getByRole('link', { name: 'Engine parts' }).click();
    await expect(this.page.locator('h2')).toContainText('Brake system');
    await expect(this.page.getByRole('link', { name: 'Brake system' })).toBeVisible();
    await this.page.getByRole('link', { name: 'Brake system' }).click();
  }

  /** Email This Page from view-items PLP; fill sample fields; send. */
  async emailThisPageFromBrakeViewItemsAndAssertSent(): Promise<void> {
    const emailThisPage = this.page.getByRole('link', { name: 'Email This Page' });
    await emailThisPage.scrollIntoViewIfNeeded();
    await expect(emailThisPage).toBeVisible({ timeout: 20_000 });
    await emailThisPage.click();

    await expect(this.page).toHaveURL(/\/email\//);
    await expect(this.page).toHaveURL(/from=viewitems|brake-system-1/i);
    await expect(this.page.getByRole('heading', { name: 'Email Page' })).toBeVisible();

    const formTable = this.page.getByRole('table').filter({ hasText: "Recipient's Email" });
    await expect(formTable).toBeVisible();
    await formTable.getByRole('textbox').nth(0).fill('nikhil.medhe@firstsource.com');
    await formTable.getByRole('textbox').nth(1).fill('nikhil.medhe@firstsource.com');
    await formTable.getByRole('textbox').nth(2).fill('Test User');
    await formTable.getByRole('textbox').nth(3).fill('Please find the listing details.');

    await this.page.getByRole('button', { name: 'Send Email' }).first().click();
    await expect(
      this.page.getByText(/thank you|success|sent|submitted|email has been sent/i).first(),
    ).toBeVisible({ timeout: 15_000 });
  }

  /** Compare two PLP checkbox ids then open compare view. */
  async compareBrakePlPItemsByIds(idA: string, idB: string): Promise<void> {
    await this.page.locator(`[id="${idA}"]`).check();
    await this.page.locator(`[id="${idB}"]`).check();
    await this.page.getByRole('button', { name: 'Compare Items' }).click();
  }

  async expectCompareBrakeAndCluchCells(): Promise<void> {
    await expect(
      this.page.getByRole('cell').filter({ hasText: 'Brake' }).filter({ hasText: 'List Price' }),
    ).toBeVisible();
    await expect(
      this.page.getByRole('cell').filter({ hasText: 'Cluch' }).filter({ hasText: 'List Price' }),
    ).toBeVisible();
  }

  /**
   * Brake/view-items PLP: checkbox ids in **table row** order (item rows only — excludes header / grid chrome).
   * Use instead of hardcoded ids so QAM / prod / pub catalogs stay portable.
   */
  async getPlPSearchSelectionCheckboxIds(): Promise<string[]> {
    const rowCheckbox = this.page
      .locator('table tbody tr')
      .filter({ has: this.page.locator('a[href*="/item/"]') })
      .locator('input.plp-search-selection[type="checkbox"]');
    await expect(rowCheckbox.first()).toBeVisible({ timeout: 30_000 });
    const n = await rowCheckbox.count();
    const ids: string[] = [];
    for (let i = 0; i < n; i++) {
      const raw = await rowCheckbox.nth(i).getAttribute('id');
      if (raw?.trim()) ids.push(raw.trim());
    }
    return ids;
  }

  /** Brake PLP: select first N checkbox ids (catalog item ids). Uses click so PLP JS / limits match real users (avoid `check({ force })` skipping handlers). */
  async checkPlPItemIds(ids: string[]): Promise<void> {
    for (const id of ids) {
      const box = this.page.locator(`[id="${id}"]`);
      await box.scrollIntoViewIfNeeded();
      await expect(box).toBeVisible({ timeout: 30_000 });
      try {
        await box.click({ timeout: 45_000 });
      } catch {
        await box.check({ timeout: 45_000 });
      }
      await this.page.waitForTimeout(150);
    }
  }

  async clickRequestInformation(): Promise<void> {
    const btn = this.page.getByRole('button', { name: 'Request Information' });
    await btn.scrollIntoViewIfNeeded();
    await expect(btn).toBeVisible({ timeout: 20_000 });
    await Promise.all([
      this.page.waitForURL(/\/request\//i, { timeout: 60_000, waitUntil: 'commit' }),
      btn.click(),
    ]);
  }

  /** Header/search: keyword + Enter; assert item heading. */
  async searchKeywordAndExpectItemHeading(keyword: string, headingName: string | RegExp): Promise<void> {
    await this.page.getByRole('textbox').click();
    await this.page.getByRole('textbox').fill(keyword);
    await this.page.getByRole('textbox').press('Enter');
    await expect(this.page.getByRole('heading', { name: headingName })).toBeVisible();
  }

  /** Engine → Brake → set PDF row limit combobox (nth 2) → trigger Download PDF (download, popup, or navigate). */
  async downloadBrakePdfAndSaveToDir(saveDir: string, getSavePath: (filename: string) => string): Promise<void> {
    await this.gotoHome();
    await this.expectAllCategoriesHeading();
    await this.openEngineParts();
    await this.page.getByRole('link', { name: 'Brake system' }).click();
    await expect(this.page).toHaveURL(/brake-system/);
    await expect(this.page.getByRole('link', { name: 'Download PDF' })).toBeVisible();
    await this.page.getByRole('combobox').nth(2).selectOption('200');

    const link = this.page.getByRole('link', { name: 'Download PDF' });
    const waitMs = 75_000;
    const downloadP = this.page.waitForEvent('download', { timeout: waitMs });
    const popupP = this.page.waitForEvent('popup', { timeout: waitMs });
    void downloadP.catch(() => {});
    void popupP.catch(() => {});
    await link.click();

    const { existsSync, statSync, mkdirSync, writeFileSync } = await import('fs');
    mkdirSync(saveDir, { recursive: true });

    type Race =
      | { kind: 'download'; d: Download }
      | { kind: 'popup'; p: Page }
      | { kind: 'navigate' };

    let result: Race;
    try {
      result = await Promise.race([
        downloadP.then((d) => ({ kind: 'download' as const, d })),
        popupP.then((p) => ({ kind: 'popup' as const, p })),
      ]);
    } catch {
      await this.page
        .waitForURL(/\.pdf(\?|$)|\/pdf\/|download|\.pdf/i, { timeout: 45_000, waitUntil: 'commit' })
        .catch(() => {});
      await expect(this.page.url()).toMatch(/\.pdf(\?|$)|\/pdf\/|download|\.pdf/i);
      result = { kind: 'navigate' };
    }

    const looksLikePdf = (buf: Buffer): boolean =>
      buf.length >= 4 && buf.subarray(0, 4).toString() === '%PDF';

    if (result.kind === 'download') {
      const { d: download } = result;
      await expect(download.suggestedFilename()).toMatch(/\.pdf$/i);
      const savePath = getSavePath(download.suggestedFilename());
      await download.saveAs(savePath);
      expect(existsSync(savePath)).toBe(true);
      expect(statSync(savePath).size).toBeGreaterThan(0);
      return;
    }

    if (result.kind === 'popup') {
      const pdfPage = result.p;
      await pdfPage.waitForLoadState('domcontentloaded');
      const pdfUrl = pdfPage.url();
      await expect(pdfUrl).toMatch(/pdf|download|catnav/i);
      const resp = await this.page.request.get(pdfUrl);
      expect(resp.ok()).toBeTruthy();
      const buf = Buffer.from(await resp.body());
      expect(looksLikePdf(buf) || buf.length > 500).toBeTruthy();
      const base = pdfUrl.split('/').pop()?.split('?')[0] || 'download.pdf';
      const savePath = getSavePath(base.toLowerCase().endsWith('.pdf') ? base : 'brake-download.pdf');
      writeFileSync(savePath, buf);
      expect(statSync(savePath).size).toBeGreaterThan(0);
      await pdfPage.close();
      return;
    }

    const url = this.page.url();
    const resp = await this.page.request.get(url);
    expect(resp.ok()).toBeTruthy();
    const buf = Buffer.from(await resp.body());
    expect(looksLikePdf(buf) || buf.length > 500).toBeTruthy();
    const savePath = getSavePath('brake-system-download.pdf');
    writeFileSync(savePath, buf);
    expect(statSync(savePath).size).toBeGreaterThan(0);
  }
}
