import type { Page } from '@playwright/test';
import { PUB_CATALOG_BASE_URL } from '../config/urls';
import { PublicCatalogPage } from '../pages/qam/PublicCatalogPage';
import { AutomationqaCatalogPage } from '../pages/automationqa-prod/AutomationqaCatalogPage';
import { CartPage } from '../pages/common/CartPage';
import { readLastOrderRef, writeLastOrderRef } from './lastOrderRefArtifact';

export type FlowTarget = 'qam' | 'prod';

/** `ORDER_REF` env, then `test-results/last-order-ref.txt`. */
export function resolveOrderRef(): string | null {
  const fromEnv = process.env.ORDER_REF?.trim();
  if (fromEnv) return fromEnv;
  return readLastOrderRef();
}

function detectFlowTarget(): FlowTarget {
  const t = (process.env.RUN_TARGET || process.env.ENV || '').toLowerCase();
  if (t === 'prod' || t === 'navigator') return 'prod';
  return 'qam';
}

async function placeQamPubOrder(page: Page): Promise<string> {
  const catalog = new PublicCatalogPage(page);
  await catalog.gotoEngineBrakeViewItemsFromHome();
  const viewCartDataUrl = await catalog.addFirstBrakePlpRowQtyToCartAndClickViewCart('2');
  const cartPage = await CartPage.resolveCartPageOrderSubmissionStyle(page, viewCartDataUrl);
  if (cartPage !== page) await cartPage.bringToFront();
  const checkout = new CartPage(cartPage);
  await checkout.runCadSiteVersion1CheckoutFromCartLanding();
  const orderRef = await checkout.readThankYouOrderReference();
  writeLastOrderRef(orderRef);
  return orderRef;
}

async function placeProdPubOrder(page: Page): Promise<string> {
  const catalog = new AutomationqaCatalogPage(page);
  await page.goto(PUB_CATALOG_BASE_URL, { waitUntil: 'domcontentloaded' });
  await catalog.navigateToEnginePartsPlpFromHome();
  const cartPage = await catalog.addValveCoverPro1ToCartAndResolveCart(page);
  const checkout = new CartPage(cartPage);
  await checkout.runCadSiteVersion1CheckoutFromCartLanding();
  const orderRef = await checkout.readThankYouOrderReference();
  writeLastOrderRef(orderRef);
  return orderRef;
}

/**
 * Returns a known order ref for Order Manager flows.
 * Places a pub-catalog order first when none exists (self-contained flow).
 */
export async function ensureOrderRef(page: Page, target?: FlowTarget): Promise<string> {
  const existing = resolveOrderRef();
  if (existing) return existing;
  const flow = target ?? detectFlowTarget();
  return flow === 'prod' ? placeProdPubOrder(page) : placeQamPubOrder(page);
}
