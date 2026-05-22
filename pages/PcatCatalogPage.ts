import { expect, type Page } from '@playwright/test';
import { BasePage } from '../core/BasePage';
import { pubPvtCatCatalogUrl } from '../config/urls';
import { CartPage } from './CartPage';

/**
 * Private catalog (`?pcat=pvtcat`) — Discount hub PLP and add-to-cart (PCAT flows).
 */
export class PcatCatalogPage extends BasePage {
  constructor(page: Page) {
    super(page);
  }

  async gotoPvtCatCatalog(): Promise<void> {
    await this.page.goto(pubPvtCatCatalogUrl(), { waitUntil: 'domcontentloaded' });
  }

  async openDiscountCategory(): Promise<void> {
    await this.page.getByRole('link', { name: 'Discount' }).click();
  }

  /** Inner text of the PLP row that contains the first “Add To Cart” link. */
  async readFirstDiscountAddToCartRowText(): Promise<string> {
    const addLink = this.page.getByRole('link', { name: 'Add To Cart' }).first();
    await expect(addLink).toBeVisible({ timeout: 30_000 });
    const plpRow = this.page.locator('tr').filter({ has: addLink }).first();
    await expect(plpRow).toBeVisible({ timeout: 15_000 });
    return CartPage.normalizeWs(await plpRow.innerText());
  }

  async clickFirstAddToCart(): Promise<void> {
    await this.page.getByRole('link', { name: 'Add To Cart' }).first().click();
  }

  /**
   * Discount PLP → first row add to cart → View Cart → resolved cart `Page`.
   */
  async addFirstDiscountPlPToCartAndResolveCart(): Promise<{ cartPage: Page; plpRowText: string }> {
    await this.gotoPvtCatCatalog();
    await this.openDiscountCategory();
    const plpRowText = await this.readFirstDiscountAddToCartRowText();
    await this.clickFirstAddToCart();

    const dialog = this.page.getByRole('dialog');
    await expect(dialog).toBeVisible({ timeout: 15_000 });
    const viewCartBtn = dialog.getByRole('button', { name: 'View Cart' });
    const viewCartDataUrl = await viewCartBtn.getAttribute('data-url');
    await viewCartBtn.evaluate((el) => (el as HTMLElement).click());

    let cartPage = await CartPage.resolveCartPageOrderSubmissionStyle(this.page, viewCartDataUrl);
    if (cartPage !== this.page) await cartPage.bringToFront();

    return { cartPage, plpRowText };
  }
}
