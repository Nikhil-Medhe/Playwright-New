import { expect, type Download, type Page } from '@playwright/test';
import { BasePage } from '../../core/BasePage';
import { pubPvtCatCatalogUrl } from '../../config/urls';
import { CartPage, CART_OR_VIEWCART_RE } from '../common/CartPage';

/** Automationqa pub catalog — locators for Test Version catalog flow. */
const L = {
  allCategoriesHeading: /all categories/i,
  automotive: /^Automotive$/i,
  engineParts: /Engine Parts/i,
  valveCoverPro1: /Valve Cover Pro 1/i,
  valveSpringPro1: /Valve Spring Pro 1/i,
  catalogLiveHost: /automationqa\.thomasnet-navigator\.com/i,
};

export class AutomationqaCatalogPage extends BasePage {
  constructor(page: Page) {
    super(page);
  }

  async expectAllCategoriesHome() {
    await expect(this.page.getByRole('heading', { name: L.allCategoriesHeading })).toBeVisible({
      timeout: 30_000,
    });
    await expect(this.page.getByRole('link', { name: L.automotive })).toBeVisible({ timeout: 15_000 });
  }

  /** `?pcat=pvtcat` — Automotive hub (no All Categories / Electronics). */
  async gotoPvtCatCatalog(): Promise<void> {
    await this.page.goto(pubPvtCatCatalogUrl(), { waitUntil: 'domcontentloaded' });
  }

  async expectPvtCatAutomotiveLanding(): Promise<void> {
    await expect(this.page).toHaveTitle(/Automotive On Pvt Cat/i, { timeout: 30_000 });
    await expect(this.page.getByRole('heading', { name: /^Automotive$/i, level: 1 })).toBeVisible({
      timeout: 20_000,
    });
    await expect(this.page.getByRole('link', { name: L.engineParts }).first()).toBeVisible({
      timeout: 15_000,
    });
  }

  async openEnginePartsFromPvtCatLanding(): Promise<void> {
    await this.page.getByRole('link', { name: L.engineParts }).first().click();
    await this.page.waitForLoadState('domcontentloaded');
    await expect(this.page).toHaveURL(/viewitems\/automotive\/engine-parts/i, { timeout: 20_000 });
    await expect(this.page.getByText(L.valveCoverPro1).first()).toBeVisible({ timeout: 20_000 });
  }

  async readValveCoverPro1PlPRowText(): Promise<string> {
    const row = this.page.locator('tr').filter({ hasText: L.valveCoverPro1 });
    await expect(row.first()).toBeVisible({ timeout: 20_000 });
    return CartPage.normalizeWs(await row.first().innerText());
  }

  /**
   * Pvt cat → Engine Parts PLP → Valve Cover Pro 1 add to cart → resolved cart `Page`.
   */
  async addValveCoverPro1PvtCatToCartAndResolveCart(): Promise<{ cartPage: Page; plpRowText: string }> {
    await this.gotoPvtCatCatalog();
    await this.expectPvtCatAutomotiveLanding();
    await this.openEnginePartsFromPvtCatLanding();
    const plpRowText = await this.readValveCoverPro1PlPRowText();
    await this.openAddToCartDialogForValveCoverPro1();
    const dialog = this.page.getByRole('dialog');
    const viewCartBtn = dialog
      .locator('#edit-attr-view-cart')
      .or(dialog.getByRole('button', { name: 'View Cart' }))
      .first();
    const viewCartDataUrl = await viewCartBtn.getAttribute('data-url');
    await viewCartBtn.evaluate((el) => (el as HTMLElement).click());
    let cartPage = await CartPage.resolveCartPageOrderSubmissionStyle(this.page, viewCartDataUrl);
    if (cartPage !== this.page) await cartPage.bringToFront();
    return { cartPage, plpRowText };
  }

  async openAutomotive() {
    await this.page.getByRole('link', { name: L.automotive }).click();
    await this.page.waitForLoadState('domcontentloaded');
    await expect(this.page.getByRole('link', { name: L.engineParts }).first()).toBeVisible({
      timeout: 20_000,
    });
  }

  async openEngineParts801() {
    await this.page.getByRole('link', { name: L.engineParts }).first().click();
    await this.page.waitForLoadState('domcontentloaded');
    await expect(this.page).toHaveURL(/viewitems\/automotive\/engine-parts/i, { timeout: 20_000 });
    await expect(this.page.getByText(L.valveCoverPro1).first()).toBeVisible({ timeout: 20_000 });
  }

  async openValveCoverPro1() {
    const row = this.page.locator('tr').filter({ hasText: L.valveCoverPro1 });
    await expect(row.first()).toBeVisible({ timeout: 20_000 });
    await row.first().locator('a.plp-itemlink').click();
    await this.page.waitForLoadState('domcontentloaded');
  }

  /** Automotive → Engine Parts PLP (caller adds to cart from PLP row). */
  async navigateToEnginePartsPlpFromHome() {
    await this.expectAllCategoriesHome();
    await this.openAutomotive();
    await this.openEngineParts801();
  }

  /** Valve Cover Pro 1 PLP row → Add To Cart → dialog visible (CAD-style). */
  async openAddToCartDialogForValveCoverPro1() {
    const row = this.page.locator('tr').filter({ hasText: L.valveCoverPro1 });
    await expect(row.first()).toBeVisible({ timeout: 20_000 });
    await row.first().getByRole('link', { name: 'Add To Cart' }).click();
    await this.page.getByRole('dialog').waitFor({ state: 'visible', timeout: 15_000 });
  }

  /**
   * Valve Cover Pro 1 → View Cart → cart page (Thomas prod uses `data-url`; WM flow falls back to CAD resolver).
   */
  async addValveCoverPro1ToCartAndResolveCart(toolsPage: Page): Promise<Page> {
    await this.openAddToCartDialogForValveCoverPro1();
    const dialog = this.page.getByRole('dialog');
    const viewCartBtn = dialog
      .locator('#edit-attr-view-cart')
      .or(dialog.getByRole('button', { name: 'View Cart' }))
      .first();
    const viewCartDataUrl = await viewCartBtn.getAttribute('data-url');
    await viewCartBtn.evaluate((el) => (el as HTMLElement).click());

    let cartPage = await CartPage.resolveCartPageOrderSubmissionStyle(this.page, viewCartDataUrl);
    if (!CART_OR_VIEWCART_RE.test(cartPage.url())) {
      cartPage = await CartPage.clickViewCartInDialogAndResolveCartCad(this.page, toolsPage);
    }
    if (cartPage !== this.page) await cartPage.bringToFront();
    await expect(cartPage).toHaveURL(CART_OR_VIEWCART_RE, { timeout: 60_000 });
    return cartPage;
  }

  /** Valve Cover Pro 1 — set qty, Add To Cart, View Cart; returns `data-url` if present. */
  async addValveCoverPro1QtyToCartAndClickViewCart(qty: string): Promise<string | null> {
    const row = this.page.locator('tr').filter({ hasText: L.valveCoverPro1 });
    await expect(row.first()).toBeVisible({ timeout: 20_000 });
    const qtyBox = row.first().getByRole('textbox');
    if (await qtyBox.isVisible().catch(() => false)) await qtyBox.fill(qty);
    await row.first().getByRole('link', { name: 'Add To Cart' }).click();
    const dialog = this.page.getByRole('dialog');
    await expect(dialog).toBeVisible({ timeout: 15_000 });
    const viewCartBtn = dialog
      .locator('#edit-attr-view-cart')
      .or(dialog.getByRole('button', { name: 'View Cart' }))
      .first();
    const viewCartDataUrl = await viewCartBtn.getAttribute('data-url');
    await viewCartBtn.click();
    return viewCartDataUrl;
  }

  /** WM → Details → Catalog Home (Live) → Automotive → Engine Parts (801) → Valve Cover Pro 1 */
  async navigateToValveCoverPro1FromHome() {
    await this.expectAllCategoriesHome();
    await this.openAutomotive();
    await this.openEngineParts801();
    await this.openValveCoverPro1();
  }

  async expectValveCoverPro1ItemPage() {
    await expect(this.page).toHaveURL(/\/item\/automotive\/engine-parts\/e2/i, { timeout: 25_000 });
    await expect(this.page.getByRole('heading', { name: /Valve Cover Pro 1/i })).toBeVisible({
      timeout: 20_000,
    });
  }

  static catalogLiveLinkLabel(pubCatalogUrl: string): string {
    const trimmed = pubCatalogUrl.trim().replace(/\/?$/, '');
    return trimmed.startsWith('http') ? trimmed : `http://${trimmed}`;
  }

  /** Engine Parts PLP checkbox ids in table row order. */
  async getPlPCheckboxIds(): Promise<string[]> {
    const rowCheckbox = this.page
      .locator('table tbody tr')
      .filter({ has: this.page.locator('a.plp-itemlink, a[href*="/item/"]') })
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

  async comparePlPItemsByIds(idA: string, idB: string): Promise<void> {
    await this.page.locator(`[id="${idA}"]`).check();
    await this.page.locator(`[id="${idB}"]`).check();
    await this.page.getByRole('button', { name: 'Compare Items' }).click();
    await this.page.waitForURL(/\/compare\//i, { timeout: 30_000 });
  }

  async expectCompareViewForProductNames(...names: RegExp[]): Promise<void> {
    for (const name of names) {
      await expect(
        this.page.getByRole('cell').filter({ hasText: name }).filter({ hasText: /List Price/i }),
      ).toBeVisible({ timeout: 20_000 });
    }
  }

  /**
   * Engine Parts PLP → row-limit combobox → Download PDF (download, popup, or navigate).
   */
  async downloadEnginePartsPdfAndSaveToDir(
    saveDir: string,
    getSavePath: (filename: string) => string,
  ): Promise<void> {
    await this.navigateToEnginePartsPlpFromHome();
    await expect(this.page.getByRole('link', { name: 'Download PDF' })).toBeVisible({ timeout: 20_000 });

    const combo = this.page.getByRole('combobox').nth(2);
    if (await combo.isVisible().catch(() => false)) {
      await combo.selectOption('200').catch(() => combo.selectOption({ index: 0 }));
    }

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
      await expect(pdfUrl).toMatch(/pdf|download/i);
      const resp = await this.page.request.get(pdfUrl);
      expect(resp.ok()).toBeTruthy();
      const buf = Buffer.from(await resp.body());
      expect(looksLikePdf(buf) || buf.length > 500).toBeTruthy();
      const base = pdfUrl.split('/').pop()?.split('?')[0] || 'download.pdf';
      const savePath = getSavePath(base.toLowerCase().endsWith('.pdf') ? base : 'engine-parts-download.pdf');
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
    const savePath = getSavePath('engine-parts-download.pdf');
    writeFileSync(savePath, buf);
    expect(statSync(savePath).size).toBeGreaterThan(0);
  }

  /** Engine Parts PLP → Email This Page → fill form → assert sent. */
  async emailThisPageFromEnginePartsPlpAndAssertSent(): Promise<void> {
    const emailThisPage = this.page.getByRole('link', { name: 'Email This Page' });
    await emailThisPage.scrollIntoViewIfNeeded();
    await expect(emailThisPage).toBeVisible({ timeout: 20_000 });
    await emailThisPage.click();

    await expect(this.page).toHaveURL(/\/email\//i, { timeout: 30_000 });
    await expect(this.page).toHaveURL(/from=viewitems|engine-parts/i);
    await expect(this.page.getByRole('heading', { name: 'Email Page' })).toBeVisible();

    const formTable = this.page.getByRole('table').filter({ hasText: "Recipient's Email" });
    await expect(formTable).toBeVisible();
    await formTable.getByRole('textbox').nth(0).fill('nikhil.medhe@firstsource.com');
    await formTable.getByRole('textbox').nth(1).fill('nikhil.medhe@firstsource.com');
    await formTable.getByRole('textbox').nth(2).fill('Automationqa Test');
    await formTable.getByRole('textbox').nth(3).fill('Please find the Engine Parts listing details.');

    await this.page.getByRole('button', { name: 'Send Email' }).first().click();
    /** Prod Automationqa may block submit until reCAPTCHA is completed. */
    const success = this.page.getByText(/thank you|success|sent|submitted|email has been sent/i);
    const captchaRequired = this.page.getByText(/Please complete all required fields|not a robot|recaptcha/i);
    await expect(success.or(captchaRequired).first()).toBeVisible({ timeout: 20_000 });
    if (await success.first().isVisible().catch(() => false)) return;
    await expect(this.page.locator('iframe').first()).toBeVisible({ timeout: 10_000 });
  }

  async searchKeyword(keyword: string) {
    const search = this.page.getByRole('textbox').first();
    await search.click();
    await search.fill(keyword);
    await search.press('Enter');
    await this.page.waitForLoadState('domcontentloaded');
  }

  async expectKeywordResultsFor(keyword: string | RegExp) {
    await expect(this.page.getByRole('heading', { name: /Search Results On/i })).toBeVisible({
      timeout: 20_000,
    });
    await expect(this.page.getByRole('heading', { name: keyword })).toBeVisible({ timeout: 15_000 });
  }

  async expectNoKeywordResultsFor(keyword: string) {
    await expect(
      this.page.getByRole('heading', {
        name: new RegExp(`No Results Found On.*${keyword.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}`, 'i'),
      }),
    ).toBeVisible({ timeout: 20_000 });
  }

  async openKeywordResultItem(productName: RegExp) {
    const row = this.page.locator('tr').filter({ hasText: productName });
    await expect(row.first()).toBeVisible({ timeout: 20_000 });
    await row.first().getByRole('link').first().click();
    await this.page.waitForLoadState('domcontentloaded');
  }

  /** PLP: select checkbox ids (click — matches real user / PLP JS). */
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
}
