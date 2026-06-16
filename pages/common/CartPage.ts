import { Page, expect } from '@playwright/test';
import { CART_LANDING_URL_RE } from '../../config/urls';
import { BasePage } from '../../core/BasePage';
import { parseThankYouOrderRef } from './OrderManagerPage';
import { selectPaymentOnStep2 } from './CheckoutPayment';

/** Matches cart / viewcart across envs (paths `viewcart` / `cbcheckout`, not QAM-only hosts). */
export const CART_OR_VIEWCART_RE = CART_LANDING_URL_RE;

export class CartPage extends BasePage {
  constructor(page: Page) {
    super(page);
  }

  /**
   * After “View Cart” from add-to-cart dialog: same-tab, new tab, or `data-url` fallback (OrderSubmission pattern).
   */
  static async resolveCartPageOrderSubmissionStyle(
    catalogPage: Page,
    viewCartDataUrl: string | null,
  ): Promise<Page> {
    let cartPage = catalogPage;
    for (let i = 0; i < 8; i++) {
      await new Promise((r) => setTimeout(r, 500));
      if (CART_OR_VIEWCART_RE.test(catalogPage.url())) {
        cartPage = catalogPage;
        return cartPage;
      }
      const pages = catalogPage.context().pages();
      const cartTab = pages.find((p) => p !== catalogPage && CART_OR_VIEWCART_RE.test(p.url()));
      if (cartTab) {
        return cartTab;
      }
      if (i === 7) {
        await catalogPage.keyboard.press('Escape');
        const navTimeout = 60_000;
        const findCartPage = () =>
          catalogPage.context().pages().find((p) => CART_OR_VIEWCART_RE.test(p.url()));

        let found = findCartPage();
        const until = Date.now() + 2_000;
        while (!found && Date.now() < until) {
          await new Promise((r) => setTimeout(r, 200));
          found = findCartPage();
        }

        if (found) {
          return found;
        }
        const cartUrl =
          viewCartDataUrl ?? (await catalogPage.locator('#edit-attr-view-cart').getAttribute('data-url'));
        if (!cartUrl) {
          throw new Error(
            'Cart fallback: no data-url (capture from View Cart button when dialog is open)',
          );
        }
        await catalogPage.goto(cartUrl, { waitUntil: 'domcontentloaded', timeout: navTimeout });
        return catalogPage;
      }
    }
    return cartPage;
  }

  /**
   * CAD flow: catalog popup + tools page context — click View Cart in dialog and resolve the cart `Page`.
   */
  static async clickViewCartInDialogAndResolveCartCad(catalogPage: Page, toolsPage: Page): Promise<Page> {
    const dialog = catalogPage.getByRole('dialog');
    await expect(dialog).toBeVisible({ timeout: 15_000 });
    const viewInDialog = dialog
      .locator('#edit-attr-view-cart')
      .or(dialog.getByRole('button', { name: 'View Cart' }))
      .first();

    const cartUrl = CART_LANDING_URL_RE;
    const popupPromise = catalogPage.context().waitForEvent('page', { timeout: 20_000 }).catch(() => null);
    await viewInDialog.click();
    const maybePopup = await popupPromise;

    let cart: Page | null = null;
    for (let i = 0; i < 40; i++) {
      const candidates = [maybePopup, catalogPage, ...toolsPage.context().pages()].filter(
        Boolean,
      ) as Page[];

      for (const p of candidates) {
        if (cartUrl.test(p.url())) {
          cart = p;
          break;
        }
      }

      if (cart) break;

      if (cartUrl.test(catalogPage.url())) {
        cart = catalogPage;
        break;
      }

      await catalogPage.waitForTimeout(500);
    }

    if (!cart) {
      const link = catalogPage.getByRole('link', { name: /shopping cart/i });
      const href = await link.first().getAttribute('href').catch(() => null);
      if (href) await catalogPage.goto(href, { waitUntil: 'domcontentloaded', timeout: 15_000 });
      else await link.first().click({ force: true });
      cart = catalogPage;
    }

    await cart.bringToFront();
    await expect(cart).toHaveURL(cartUrl, { timeout: 15_000 });
    return cart;
  }

  /** Brake PLP: first row “Add To Cart” → View Cart → resolved cart page. */
  static async addFirstPlPAddToCartAndResolve(catalogPage: Page): Promise<Page> {
    await catalogPage.getByRole('link', { name: 'Add To Cart' }).first().click();
    const dialog = catalogPage.getByRole('dialog');
    await expect(dialog).toBeVisible({ timeout: 15_000 });
    const viewCartBtn = dialog.getByRole('button', { name: 'View Cart' });
    const viewCartDataUrl = await viewCartBtn.getAttribute('data-url');
    await viewCartBtn.click();
    const cart = await CartPage.resolveCartPageOrderSubmissionStyle(catalogPage, viewCartDataUrl);
    if (cart !== catalogPage) await cart.bringToFront();
    return cart;
  }

  async addEngineBrakeItemToCart() {
    await this.page.getByRole('link', { name: 'Engine parts' }).click();
    await this.page.getByRole('link', { name: 'Brake system' }).click();
    await this.page.getByRole('link', { name: 'Add To Cart' }).nth(1).click();
    const dialog = this.page.getByRole('dialog');
    await dialog.waitFor({ state: 'visible', timeout: 15_000 });
    await dialog.locator('#edit-attr-view-cart').or(dialog.locator('button').filter({ hasText: 'View Cart' })).first().click();
  }

  /**
   * Brake system PLP → row “Cluch” (catalog typo) → pagination page 2 → Add To Cart → dialog visible
   * (caller may use `CartPage.clickViewCartInDialogAndResolveCartCad` for multi-tab CAD).
   */
  async navigateEngineBrakeClutchPlpPage2AndOpenAddToCartDialog(): Promise<void> {
    await this.page.getByRole('link', { name: 'Engine parts' }).click();
    await this.page.getByRole('link', { name: 'Brake system' }).click();
    const cluchCell = this.page
      .getByText('Cluch', { exact: true })
      .or(this.page.getByRole('link', { name: 'Cluch', exact: true }))
      .or(this.page.getByRole('link', { name: /cluch|clutch/i }));
    await expect(cluchCell.first()).toBeVisible({ timeout: 15_000 });
    await cluchCell.first().click();

    const page2 = this.page.locator('#plp-table-filter').getByRole('link', { name: '2', exact: true });
    await expect(page2).toBeVisible({ timeout: 15_000 });
    await page2.click();

    await this.page.getByRole('link', { name: 'Add To Cart' }).first().click();
    const dialog = this.page.getByRole('dialog');
    await dialog.waitFor({ state: 'visible', timeout: 15_000 });
  }

  /** Brake system PLP → Cluch → page 2 → Add To Cart → View Cart (same tab / simple dialog). */
  async addEngineBrakeClutchPlpPage2ItemToCart(): Promise<void> {
    await this.navigateEngineBrakeClutchPlpPage2AndOpenAddToCartDialog();
    const dialog = this.page.getByRole('dialog');
    await dialog.locator('#edit-attr-view-cart').or(dialog.locator('button').filter({ hasText: 'View Cart' })).first().click();
  }

  async estimateShippingAndProceed(zip: string) {
    const zipInput = this.page.locator('#ecomm-ship-zip').or(this.page.getByRole('textbox', { name: /zip|postal\s*code/i }));
    await expect(zipInput.first()).toBeVisible({ timeout: 15_000 });
    await zipInput.first().fill(zip);

    const estimateBtn = this.page.getByRole('button', { name: /Estimate|Calculate\s*Shipping/i }).first();
    await estimateBtn.click();
    await this.page.waitForTimeout(2000);

    const upsGround = this.page.getByRole('radio', { name: /UPS\s*Ground/i }).first();
    const listItemRadio = this.page.getByRole('listitem').filter({ hasText: /ups|fedex|ground|standard|overnight/i }).getByRole('radio').first();
    const anyRadioNearShipping = this.page.getByRole('radio', { name: /shipping|ground|standard|overnight|delivery/i }).first();
    const firstShippingRadio = this.page.locator('[class*="shipping"], [id*="shipping"], [data-testid*="shipping"]').locator('input[type="radio"]').first();
    const fallbackRadio = this.page.locator('input[type="radio"]').first();

    if (await upsGround.isVisible().catch(() => false)) {
      await upsGround.check();
    } else if (await listItemRadio.isVisible().catch(() => false)) {
      await listItemRadio.check();
    } else if (await anyRadioNearShipping.isVisible().catch(() => false)) {
      await anyRadioNearShipping.check();
    } else if (await firstShippingRadio.isVisible().catch(() => false)) {
      await firstShippingRadio.check();
    } else if (await fallbackRadio.isVisible().catch(() => false)) {
      await fallbackRadio.check();
    } else {
      await expect(listItemRadio).toBeVisible({ timeout: 15_000 });
      await listItemRadio.check();
    }

    const proceedButton = this.page.getByRole('button', { name: /Proceed to Checkout/i }).or(this.page.getByRole('link', { name: /Proceed to Checkout/i })).first();
    await expect(proceedButton).toBeVisible({ timeout: 15_000 });
    await proceedButton.click();
  }

  async fillBasicShippingAddress() {
    await expect(this.page.locator('input[name="FirstName"]')).toBeVisible({ timeout: 15_000 });
    await this.page.locator('input[name="FirstName"]').fill('Nikhil');
    await this.page.locator('input[name="LastName"]').fill('Test');
    await this.page.locator('input[name="CompanyName"]').fill('Test');
    await this.page.locator('input[name="Address1"]').fill('Street no.1');
    await this.page.locator('#ecomm-ship-city').fill('New York');
    await this.page.locator('#ecomm-ship-state').selectOption('NY');
    await this.page.locator('#ecomm-ship-zip').fill('10001');
    await this.page.locator('input[name="Phone"]').fill('12345678901');
    await this.page.locator('input[name="Email"]').fill('nikhil.medhe@firstsource.com');
    await this.page.locator('input[name="Save_Address_Shipping"]').check();
  }

  /**
   * On checkout shipping: calculate rates, pick carrier, open payment, COD, land on review (submit visible).
   * Matches the sequence used in OrderSubmission.spec.ts (avoids clicking Step 2 twice).
   */
  async goToPaymentAndConfirmShipping() {
    const calc = this.page.getByRole('button', { name: 'Calculate Shipping' });
    await expect(calc).toBeVisible({ timeout: 15_000 });
    await calc.click();
    await this.page.locator('#chkIsResidential').check();
    await calc.click();

    const fedexOption = this.page
      .getByRole('listitem')
      .filter({ hasText: /fedex.*priority.*overnight/i })
      .getByRole('radio');
    const anyShippingRadio = this.page
      .getByRole('listitem')
      .filter({ hasText: /fedex|ups|standard|ground|overnight/i })
      .getByRole('radio')
      .first();
    if (await fedexOption.isVisible().catch(() => false)) {
      await fedexOption.check();
    } else {
      await expect(anyShippingRadio).toBeVisible({ timeout: 15_000 });
      await anyShippingRadio.check();
    }

    const step2 = this.page.getByRole('button', { name: /Step\s*2:\s*Payment/i });
    await expect(step2).toBeVisible({ timeout: 15_000 });
    await expect(step2).toBeEnabled();
    await step2.click();

    await expect(this.page.locator('#ecomm-billing-same')).toBeVisible({ timeout: 15_000 });
    await this.page.locator('#ecomm-billing-same').check();

    const seeMore = this.page.getByRole('link', { name: /see more/i });
    if (await seeMore.isVisible().catch(() => false)) await seeMore.click();

    await selectPaymentOnStep2(this.page);

    const step3 = this.page.getByRole('button', { name: /Step\s*3:\s*Review/i });
    await expect(step3).toBeEnabled();
    await step3.click();

    await expect(this.page.getByRole('button', { name: /submit order/i }).first()).toBeVisible({ timeout: 15_000 });
  }

  /** Review step: optional PO / account box, submit, assert thank-you URL and copy. */
  async submitOrderAndAssertThankYou() {
    await this.page.bringToFront();
    await this.page.waitForLoadState('domcontentloaded');

    const customerAcct = this.page.getByRole('textbox', { name: /Customer Account Number/i });
    if (await customerAcct.first().isVisible({ timeout: 5_000 }).catch(() => false)) {
      await customerAcct.first().fill('1234');
    }
    const poByRole = this.page.getByRole('textbox', {
      name: /your order number|order number|purchase order|po\s*#|po number/i,
    });
    if (await poByRole.first().isVisible({ timeout: 3_000 }).catch(() => false)) {
      await poByRole.first().fill('1234');
    }
    const poById = this.page.locator(
      'input[id*="PONumber" i], input[id*="PoNum" i], input[name*="PONumber" i], input[name*="CustomerAccount" i]',
    );
    if (await poById.first().isVisible({ timeout: 2_000 }).catch(() => false)) {
      await poById.first().fill('1234');
    }
    const taxExempt = this.page.getByRole('textbox', { name: /Tax Exempt/i });
    if (await taxExempt.first().isVisible({ timeout: 3_000 }).catch(() => false)) {
      await taxExempt.first().fill('4321');
    }

    const terms = this.page.getByRole('checkbox', { name: /terms|agree|condition/i });
    if (await terms.first().isVisible({ timeout: 1_000 }).catch(() => false)) {
      await terms.first().check();
    }

    /**
     * Thank-you navigation is bound to `<a role="button" class="ecomm-cart-submit" data-url="/cbcheckout/thankyou?...">`.
     * Do not use a plain `<button>Submit Order</button>` — it can re-post to reviewcart.
     */
    const submitThankYou = this.page
      .locator('a.ecomm-cart-submit[role="button"][data-url*="thankyou"]')
      .or(this.page.locator('a[role="button"][data-url*="thankyou"]').filter({ hasText: /submit\s*order/i }))
      .first();

    await expect(submitThankYou).toBeVisible({ timeout: 15_000 });
    await submitThankYou.scrollIntoViewIfNeeded();
    await submitThankYou.click({ force: true, timeout: 30_000 });
    try {
      await this.page.waitForURL(/\/cbcheckout\/thankyou/i, { timeout: 20_000, waitUntil: 'commit' });
    } catch {
      await submitThankYou.evaluate((el) => (el as HTMLAnchorElement).click());
      await this.page.waitForURL(/\/cbcheckout\/thankyou/i, { timeout: 60_000, waitUntil: 'commit' });
    }

    await expect(
      this.page.getByText(/Your order is now complete|Thank you for sending your order/i),
    ).toBeVisible({ timeout: 20_000 });
    await expect(this.page.getByText(/Your order reference number is\s*\d+/i).first()).toBeVisible({
      timeout: 20_000,
    });
  }

  /**
   * Full checkout path used by `cadSiteVersion1.spec.ts` after cart URL is stable (zip → proceed → address → payment → thank-you).
   */
  async runCadSiteVersion1CheckoutFromCartLanding(): Promise<void> {
    const cart = this.page;

    const zip = cart.locator('#ecomm-ship-zip').or(cart.getByRole('textbox', { name: /zip|postal/i }));
    await expect(zip.first()).toBeVisible({ timeout: 15_000 });
    await zip.first().click();
    await zip.first().fill('10001');
    await cart.getByRole('button', { name: /Estimate|Calculate\s*Shipping/i }).first().click();

    const upsGround = cart.getByRole('listitem').filter({ hasText: /UPS\s*Ground/i }).getByRole('radio').first();
    const anyShip = cart
      .getByRole('listitem')
      .filter({ hasText: /ups|fedex|ground/i })
      .getByRole('radio')
      .first();
    if (await upsGround.isVisible({ timeout: 20_000 }).catch(() => false)) {
      await upsGround.check();
    } else if (await anyShip.isVisible({ timeout: 5_000 }).catch(() => false)) {
      await anyShip.check();
    }

    await cart.getByRole('button', { name: /Proceed to Checkout/i }).nth(1).click();

    await cart.locator('input[name="FirstName"]').click();
    await cart.locator('input[name="FirstName"]').press('CapsLock');
    await cart.locator('input[name="FirstName"]').fill('T');
    await cart.locator('input[name="FirstName"]').press('CapsLock');
    await cart.locator('input[name="FirstName"]').fill('Test');
    await cart.locator('input[name="FirstName"]').press('Tab');
    await cart.locator('input[name="LastName"]').press('CapsLock');
    await cart.locator('input[name="LastName"]').fill('QA');
    await cart.locator('input[name="LastName"]').press('Tab');
    await cart.locator('input[name="CompanyName"]').fill('T');
    await cart.locator('input[name="CompanyName"]').press('CapsLock');
    await cart.locator('input[name="CompanyName"]').fill('Test');
    await cart.locator('input[name="CompanyName"]').press('Tab');
    await cart.locator('input[name="Address1"]').press('CapsLock');
    await cart.locator('input[name="Address1"]').fill('S');
    await cart.locator('input[name="Address1"]').press('CapsLock');
    await cart.locator('input[name="Address1"]').fill('Street one');
    await cart.locator('input[name="Address1"]').press('Tab');
    await cart.locator('input[name="Address2"]').press('CapsLock');
    await cart.locator('input[name="Address2"]').fill('T');
    await cart.locator('input[name="Address2"]').press('CapsLock');
    await cart.locator('input[name="Address2"]').fill('Test');
    await cart.locator('input[name="Address2"]').press('Tab');
    await cart.locator('input[name="Address3"]').press('CapsLock');
    await cart.locator('input[name="Address3"]').fill('T');
    await cart.locator('input[name="Address3"]').press('CapsLock');
    await cart.locator('input[name="Address3"]').fill('Test');
    await cart.locator('input[name="Address3"]').press('Tab');
    await cart.locator('#ecomm-ship-city').fill('New York');
    await cart.locator('#ecomm-ship-state').selectOption('NY');
    await cart.locator('#ecomm-ship-zip').fill('10001');
    await cart.locator('input[name="Save_Address_Shipping"]').check();
    await cart.locator('input[name="Phone"]').fill('12345678912');
    await cart.locator('input[name="Email"]').click();
    await cart.locator('input[name="Email"]').fill('nikhil.medhe@firstsource.com');

    const calcShip = cart.getByRole('button', { name: 'Calculate Shipping' });
    await expect(calcShip).toBeVisible({ timeout: 15_000 });
    await calcShip.click();
    await cart.locator('#chkIsResidential').check();
    await calcShip.click();

    const fedexOption = cart
      .getByRole('listitem')
      .filter({ hasText: /fedex.*priority.*overnight/i })
      .getByRole('radio');
    const anyShippingRadio = cart
      .getByRole('listitem')
      .filter({ hasText: /fedex|ups|standard|ground|overnight/i })
      .getByRole('radio')
      .first();
    if (await fedexOption.isVisible().catch(() => false)) {
      await fedexOption.check();
    } else {
      await expect(anyShippingRadio).toBeVisible({ timeout: 15_000 });
      await anyShippingRadio.check();
    }

    await cart.getByRole('button', { name: /Step\s*2:\s*Payment/i }).click();
    await selectPaymentOnStep2(cart);
    await cart.getByRole('button', { name: /Step\s*3:\s*Review/i }).click();

    const customerAcct = cart.getByRole('textbox', { name: /Customer Account Number/i });
    if (await customerAcct.first().isVisible({ timeout: 5_000 }).catch(() => false)) {
      await customerAcct.first().fill('1234');
    }
    const taxExempt = cart.getByRole('textbox', { name: /Tax Exempt/i });
    if (await taxExempt.first().isVisible({ timeout: 3_000 }).catch(() => false)) {
      await taxExempt.first().fill('4321');
    }
    const terms = cart.getByRole('checkbox', { name: /terms|agree|condition/i });
    if (await terms.first().isVisible({ timeout: 2_000 }).catch(() => false)) {
      await terms.first().check();
    }

    const submitThankYou = cart
      .locator('a.ecomm-cart-submit[role="button"][data-url*="thankyou"]')
      .or(cart.locator('a[role="button"][data-url*="thankyou"]').filter({ hasText: /submit\s*order/i }))
      .first();
    await expect(submitThankYou).toBeVisible({ timeout: 15_000 });
    await submitThankYou.scrollIntoViewIfNeeded();
    await submitThankYou.click({ force: true, timeout: 45_000 });
    try {
      await cart.waitForURL(/\/cbcheckout\/thankyou/i, { timeout: 20_000, waitUntil: 'commit' });
    } catch {
      await submitThankYou.evaluate((el) => (el as HTMLAnchorElement).click());
      await cart.waitForURL(/\/cbcheckout\/thankyou/i, { timeout: 90_000, waitUntil: 'commit' });
    }

    await expect(
      cart.getByText(/Your order is now complete|Thank you for sending your order/i),
    ).toBeVisible({ timeout: 20_000 });
    await expect(cart.getByText(/Your order reference number is\s*\d+/i).first()).toBeVisible({
      timeout: 20_000,
    });
  }

  /** `Promotions.spec.ts` — valid promo through thank-you + Continue Shopping. */
  async runPromotionsValidPromoCheckoutAfterCartOpen(): Promise<void> {
    await this.runPromotionsPromoCheckoutAfterCartOpen('Sale');
  }

  async runPromotionsPromoCheckoutAfterCartOpen(
    promoCode: string,
    options?: { clickContinueShopping?: boolean },
  ): Promise<void> {
    const cartPage = this.page;
    const promoInput = cartPage.getByRole('textbox', { name: 'Promo Code' });
    await expect(promoInput).toBeVisible({ timeout: 30_000 });
    await expect(promoInput).toBeEmpty();
    await promoInput.fill(promoCode);
    await cartPage.getByRole('button', { name: 'Apply' }).click();
    await expect(cartPage.getByText('The coupon code is successfully applied')).toBeVisible();
    await cartPage.getByRole('textbox', { name: 'Zip Code' }).click();
    await cartPage.getByRole('textbox', { name: 'Zip Code' }).fill('10001');
    await cartPage.getByRole('button', { name: 'Estimate' }).click();
    await cartPage.getByRole('listitem').filter({ hasText: 'UPS Ground$' }).getByRole('radio').check();
    await cartPage.getByRole('button', { name: 'Proceed to Checkout' }).first().click();
    await cartPage.locator('input[name="FirstName"]').click();
    await cartPage.locator('input[name="FirstName"]').press('CapsLock');
    await cartPage.locator('input[name="FirstName"]').fill('T');
    await cartPage.locator('input[name="FirstName"]').press('CapsLock');
    await cartPage.locator('input[name="FirstName"]').fill('Test');
    await cartPage.locator('input[name="FirstName"]').press('Tab');
    await cartPage.locator('input[name="LastName"]').press('CapsLock');
    await cartPage.locator('input[name="LastName"]').fill('QA');
    await cartPage.locator('input[name="LastName"]').press('Tab');
    await cartPage.locator('input[name="CompanyName"]').fill('T');
    await cartPage.locator('input[name="CompanyName"]').press('CapsLock');
    await cartPage.locator('input[name="CompanyName"]').fill('Test');
    await cartPage.locator('input[name="CompanyName"]').press('Tab');
    await cartPage.locator('input[name="Address1"]').press('CapsLock');
    await cartPage.locator('input[name="Address1"]').fill('S');
    await cartPage.locator('input[name="Address1"]').press('CapsLock');
    await cartPage.locator('input[name="Address1"]').fill('Street');
    await cartPage.locator('input[name="Address1"]').press('Tab');
    await cartPage.locator('input[name="Address2"]').fill('one');
    await cartPage.locator('input[name="Address2"]').press('Tab');
    await cartPage.locator('input[name="Address3"]').fill('two');
    await cartPage.locator('input[name="Phone"]').click();
    await cartPage.locator('input[name="Phone"]').fill('1234567899');
    await cartPage.locator('input[name="Email"]').click();
    await cartPage.locator('input[name="Email"]').fill('nikhil.medhe@firstsource.com');
    await cartPage.locator('input[name="Save_Address_Shipping"]').check();
    await cartPage.locator('#chkIsResidential').check();
    await cartPage.getByRole('button', { name: 'Calculate Shipping' }).click();
    await cartPage.getByRole('listitem').filter({ hasText: 'UPS Ground$' }).getByRole('radio').check();
    await cartPage.getByRole('button', { name: /Step\s*2:\s*Payment/i }).click();
    await selectPaymentOnStep2(cartPage);
    await expect(cartPage.getByText(/COD|Stripe|Cash On Delivery|Credit Card/i).first()).toBeVisible({
      timeout: 10_000,
    });
    await expect(cartPage.getByRole('button', { name: 'Step 3: Review & Submit Order' })).toBeVisible();
    await cartPage.getByRole('button', { name: 'Step 3: Review & Submit Order' }).click();

    const orderNumberBox = cartPage.getByRole('textbox', { name: /your order number|order number/i });
    if (await orderNumberBox.first().isVisible({ timeout: 3_000 }).catch(() => false)) {
      await orderNumberBox.first().fill('1234');
    }

    const submitThankYou = cartPage
      .locator('a.ecomm-cart-submit[role="button"][data-url*="thankyou"]')
      .or(cartPage.locator('a[role="button"][data-url*="thankyou"]').filter({ hasText: /submit\s*order/i }))
      .first();
    await expect(submitThankYou).toBeVisible({ timeout: 30_000 });
    await submitThankYou.scrollIntoViewIfNeeded();
    await submitThankYou.click({ force: true, timeout: 30_000 });
    try {
      await cartPage.waitForURL(/\/cbcheckout\/thankyou/i, { timeout: 20_000, waitUntil: 'commit' });
    } catch {
      await submitThankYou.evaluate((el) => (el as HTMLAnchorElement).click());
      await cartPage.waitForURL(/\/cbcheckout\/thankyou/i, { timeout: 60_000, waitUntil: 'commit' });
    }

    await expect(
      cartPage.getByText(/Your order is now complete|Thank you for sending your order/i),
    ).toBeVisible({ timeout: 30_000 });
    if (options?.clickContinueShopping !== false) {
      await cartPage.getByRole('button', { name: 'Continue Shopping' }).first().click();
    }
  }

  async expectInvalidPromoCodeMessage(): Promise<void> {
    const invalidPromoBanner = this.page.locator('#ecomm-promo-error');
    await expect(invalidPromoBanner).toContainText('The coupon code is invalid.', { timeout: 15_000 });
    await expect(this.page.getByText('The coupon code is successfully applied')).not.toBeVisible();
  }

  /** Parse numeric order ref from thank-you body (CAD → Order Manager handoff). */
  async readThankYouOrderReference(): Promise<string> {
    const thankBlock = this.page.locator('#ecomm-confirmation-message').or(this.page.locator('body'));
    const thankText = await thankBlock.first().innerText();
    const orderRef = parseThankYouOrderRef(thankText);
    if (!orderRef) {
      throw new Error(`Could not parse order reference from thank-you. Snippet: ${thankText.slice(0, 500)}`);
    }
    return orderRef;
  }

  /** PLP / cart line helpers (`PcatCatalogPage` / PCAT flows). */
  static normalizeWs(s: string): string {
    return s.replace(/\s+/g, ' ').trim();
  }

  static orderLineSignature(full: string): string {
    const n = CartPage.normalizeWs(full);
    const partMatch = n.match(/\b[A-Z0-9][A-Z0-9\-]{4,}\b/i);
    if (partMatch) return partMatch[0];
    const noMoney = n.replace(/\$\s*[\d.,]+/g, '').trim();
    return noMoney.slice(0, 80);
  }

  /** Shopping cart article layout: product link text inside `article`, or legacy table row. */
  static async readFirstCartLineProductLabel(cartPage: Page): Promise<string> {
    await cartPage.waitForLoadState('domcontentloaded');
    const productLink = cartPage.locator('article a[href*="/item/"]').first();
    if (await productLink.isVisible({ timeout: 15_000 }).catch(() => false)) {
      return CartPage.normalizeWs(await productLink.innerText());
    }
    const looserItemLink = cartPage.locator('article a[href*="item"], main a[href*="/item/"]').first();
    if (await looserItemLink.isVisible({ timeout: 8_000 }).catch(() => false)) {
      return CartPage.normalizeWs(await looserItemLink.innerText());
    }
    const article = cartPage.locator('article').filter({ hasText: /quantity|item total/i }).first();
    if (await article.isVisible({ timeout: 5_000 }).catch(() => false)) {
      const text = CartPage.normalizeWs(await article.innerText());
      if (text.length > 10) return text.slice(0, 400);
    }
    const rowLink = cartPage.locator('tr td a[href*="item"]').first();
    if (await rowLink.isVisible({ timeout: 8_000 }).catch(() => false)) {
      return CartPage.normalizeWs(await rowLink.innerText());
    }
    const legacyRow = cartPage.locator('#ecomm-cart-lines tbody tr, table tbody tr').first();
    if (await legacyRow.isVisible({ timeout: 5_000 }).catch(() => false)) {
      return CartPage.normalizeWs(await legacyRow.innerText());
    }
    throw new Error('Could not read cart line text for order validation.');
  }

  /** Assert PLP row text corresponds to the cart product label (same line item). */
  static async expectPollPlPRowMatchesCartLine(plpRowText: string, cartProductLabel: string): Promise<void> {
    const cartSig = CartPage.orderLineSignature(cartProductLabel);
    expect(cartSig.length).toBeGreaterThan(0);
    const leadToken = cartProductLabel.split(',')[0].trim();
    await expect
      .poll(
        () =>
          plpRowText.includes(leadToken) ||
          plpRowText.includes(cartSig) ||
          cartProductLabel.split(/\s+/).some((w) => w.length > 2 && plpRowText.includes(w)),
        { timeout: 15_000 },
      )
      .toBeTruthy();
  }

  /**
   * PCAT `?pcat=pvtcat` Discount sample checkout after cart is open (zip → … → review asserts line → thank-you).
   */
  async runPcatPvtCatDiscountCheckoutThroughThankYou(cartProductLabel: string): Promise<void> {
    const cartPage = this.page;

    await cartPage.getByRole('textbox', { name: 'Zip Code' }).click();
    await cartPage.getByRole('textbox', { name: 'Zip Code' }).fill('10001');
    await cartPage.getByRole('button', { name: 'Estimate' }).click();
    await cartPage.getByRole('listitem').filter({ hasText: 'UPS Ground$' }).getByRole('radio').check();
    const proceedCheckout = cartPage.getByRole('button', { name: 'Proceed to Checkout' });
    /** Some themes duplicate this button; prod PCAT cart often has exactly one — `.nth(1)` never resolves on Firefox. */
    if ((await proceedCheckout.count()) > 1) {
      await proceedCheckout.nth(1).click();
    } else {
      await proceedCheckout.first().click();
    }

    await expect(cartPage.locator('input[name="FirstName"]')).toBeVisible({ timeout: 90_000 });

    await cartPage.locator('input[name="FirstName"]').click();
    await cartPage.locator('input[name="FirstName"]').press('CapsLock');
    await cartPage.locator('input[name="FirstName"]').fill('T');
    await cartPage.locator('input[name="FirstName"]').press('CapsLock');
    await cartPage.locator('input[name="FirstName"]').fill('Test');
    await cartPage.locator('input[name="FirstName"]').press('Tab');
    await cartPage.locator('input[name="LastName"]').press('CapsLock');
    await cartPage.locator('input[name="LastName"]').fill('P');
    await cartPage.locator('input[name="LastName"]').press('CapsLock');
    await cartPage.locator('input[name="LastName"]').fill('Pvtcat');
    await cartPage.locator('input[name="CompanyName"]').click();
    await cartPage.locator('input[name="CompanyName"]').fill('pvtcat');
    await cartPage.locator('input[name="CompanyName"]').press('Tab');
    await cartPage.locator('input[name="Address1"]').fill('street');
    await cartPage.locator('input[name="Address1"]').press('Tab');
    await cartPage.locator('input[name="Address2"]').fill('street one');
    await cartPage.locator('input[name="Address2"]').press('Tab');
    await cartPage.locator('input[name="Address3"]').fill('two');
    await cartPage.locator('input[name="Address3"]').press('Tab');
    await cartPage.locator('input[name="Phone"]').click();
    await cartPage.locator('input[name="Phone"]').click();
    await cartPage.locator('input[name="Phone"]').fill('1987654323');
    await cartPage.locator('input[name="Fax"]').click();
    await cartPage.locator('input[name="Fax"]').fill('12345');
    await cartPage.locator('input[name="Email"]').click();
    await cartPage.locator('input[name="Email"]').fill('nikhil.medhe@firstsource.com');
    await cartPage.locator('#chkIsResidential').check();
    await cartPage.locator('#plp-shipping-save > .plp-card-firstcolumn').click();
    await cartPage.locator('input[name="Save_Address_Shipping"]').check();
    await cartPage.getByRole('button', { name: 'Calculate Shipping' }).click();
    await cartPage.getByRole('listitem').filter({ hasText: 'UPS Ground$' }).getByRole('radio').check();

    const step2 = cartPage.getByRole('button', { name: /Step\s*2:\s*Payment/i });
    await step2.click();
    await step2.click();
    await cartPage.locator('input[name="Fax"]').click();
    await cartPage.locator('input[name="Fax"]').fill('1234');
    await step2.click();
    await cartPage.locator('input[name="Fax"]').dblclick();
    await cartPage.locator('input[name="Fax"]').fill('11223344');
    await step2.click();
    await selectPaymentOnStep2(cartPage);
    await cartPage.getByRole('button', { name: 'Step 3: Review & Submit Order' }).click();

    const cartSig = CartPage.orderLineSignature(cartProductLabel);
    await expect(
      cartPage.getByRole('link', { name: cartProductLabel }).or(cartPage.getByText(cartSig, { exact: false })),
    ).toBeVisible({ timeout: 20_000 });

    const submitThankYou = cartPage
      .locator('a.ecomm-cart-submit[role="button"][data-url*="thankyou"]')
      .or(cartPage.locator('a[role="button"][data-url*="thankyou"]').filter({ hasText: /submit\s*order/i }))
      .first();
    await expect(submitThankYou).toBeVisible({ timeout: 20_000 });
    await submitThankYou.scrollIntoViewIfNeeded();
    await submitThankYou.click({ force: true, timeout: 30_000 });
    try {
      await cartPage.waitForURL(/\/cbcheckout\/thankyou/i, { timeout: 20_000, waitUntil: 'commit' });
    } catch {
      await submitThankYou.evaluate((el) => (el as HTMLAnchorElement).click());
      await cartPage.waitForURL(/\/cbcheckout\/thankyou/i, { timeout: 60_000, waitUntil: 'commit' });
    }

    await expect(
      cartPage.getByText(/Your order is now complete\.|Thank you for sending your order/i),
    ).toBeVisible({ timeout: 20_000 });
  }
}

