import { expect, type Locator, type Page } from '@playwright/test';

export type PaymentMethod = 'cod' | 'stripe' | 'auto';

/** `PAYMENT_METHOD=cod|stripe|auto` (default `auto`: COD first, then Stripe). */
export function resolvePaymentMethod(): PaymentMethod {
  const v = (process.env.PAYMENT_METHOD || 'auto').trim().toLowerCase();
  if (v === 'cod' || v === 'stripe' || v === 'auto') return v;
  return 'auto';
}

/** Unified COD locator — matches `COD - Cash On Delivery` and `... Cash` variants. */
export function codPaymentRadio(page: Page): Locator {
  return page
    .getByRole('listitem')
    .filter({ hasText: /COD\s*-\s*Cash On Delivery/i })
    .getByRole('radio')
    .first();
}

export function stripePaymentRadio(page: Page): Locator {
  return page
    .getByRole('listitem')
    .filter({ hasText: /stripe|credit\s*card|card\s*payment/i })
    .getByRole('radio')
    .first();
}

async function ensureBillingSameAsShipping(page: Page): Promise<void> {
  const billingSame = page.locator('#ecomm-billing-same');
  await expect(billingSame).toBeVisible({ timeout: 15_000 });
  if (!(await billingSame.isChecked().catch(() => false))) {
    await billingSame.check();
  }
  const seeMore = page.getByRole('link', { name: /see more/i });
  if (await seeMore.isVisible().catch(() => false)) await seeMore.click();
}

/**
 * Step 2 payment selection — env-aware COD / Stripe with auto-fallback.
 */
export async function selectPaymentOnStep2(page: Page, method?: PaymentMethod): Promise<void> {
  const mode = method ?? resolvePaymentMethod();
  await ensureBillingSameAsShipping(page);

  const tryCod = async (): Promise<boolean> => {
    const cod = codPaymentRadio(page);
    if (await cod.isVisible({ timeout: 8_000 }).catch(() => false)) {
      await cod.check();
      return true;
    }
    return false;
  };

  const tryStripe = async (): Promise<boolean> => {
    const stripe = stripePaymentRadio(page);
    if (await stripe.isVisible({ timeout: 8_000 }).catch(() => false)) {
      await stripe.check();
      return true;
    }
    return false;
  };

  if (mode === 'cod') {
    if (await tryCod()) return;
    if (await tryStripe()) return;
  } else if (mode === 'stripe') {
    if (await tryStripe()) return;
    if (await tryCod()) return;
  } else {
    if (await tryCod()) return;
    if (await tryStripe()) return;
  }

  throw new Error(
    `No supported payment method on Step 2 (mode=${mode}). Enable COD or Stripe on catalog, or set PAYMENT_METHOD.`,
  );
}
