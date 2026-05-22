import { envConfig } from './env';

/**
 * Public storefront (catalog home / PLP host).
 * - **QAM:** `run-tests-by-target.js qam` sets `PUB_CATALOG_URL=https://nikhil.cn-qam-pub.catnav.us`
 * - **Prod (Thomas):** `prod` / `navigator` set `PUB_CATALOG_URL=https://nikhil.thomasnet-navigator.com`
 * - **Thomas staging pub:** `run-tests-by-target.js thomas-stage` sets `PUB_CATALOG_URL=https://nikhil.stage.thomasnet-navigator.com` (PCAT `?pcat=pvtcat`)
 * Override in `.env` when needed. Tests should import this (or `PublicCatalogPage`) instead of hardcoding URLs.
 */
export const PUB_CATALOG_BASE_URL =
  (process.env.PUB_CATALOG_URL || 'https://nikhil.cn-qam-pub.catnav.us').replace(/\/?$/, '/') ;

/** Private catalog landing: `PUB_CATALOG_URL` + `?pcat=pvtcat` (PCATBasicNavigation). */
export function pubPvtCatCatalogUrl(): string {
  return `${PUB_CATALOG_BASE_URL.replace(/\/?$/, '')}/?pcat=pvtcat`;
}

/** Tools host (Website Manager, Order Manager login). */
export function toolsBaseUrl(): string {
  return envConfig.baseURL.replace(/\/?$/, '');
}

/**
 * WM versions grid path. CatNav stacks often use `WebMain…`; Thomas Navigator uses `WebManViewVersions.aspx`
 * (see screenshots). Override with env when needed.
 */
export const WM_VERSIONS_PATH =
  process.env.WM_VERSIONS_PATH?.trim() || '/WebSiteManager/WebMainViewVersions.aspx';

export function toolsWebsiteManagerVersionsUrl(): string {
  return `${toolsBaseUrl()}${WM_VERSIONS_PATH}`;
}

/** Order Manager — same tools host as `BASE_URL` (stage vs prod). */
export function orderManagerHomeUrl(): string {
  return `${toolsBaseUrl()}/orders/OrderHomePage.aspx`;
}

/**
 * Cart / checkout URLs: path-based so QAM + prod hosts both match (avoid hardcoded `cn-qam` hostnames).
 */
export const CART_LANDING_URL_RE = /viewcart|cbcheckout/i;

/**
 * Exact link label on WM “Cad Site Version” details pointing at the pub catalog (matches grid text).
 * Uses `PUB_CATALOG_SITE_LINK` when set; else origin from `PUB_CATALOG_URL` (see `run-tests-by-target.js` prod).
 */
export function defaultPubCatalogSiteLinkLabel(): string {
  const explicit = process.env.PUB_CATALOG_SITE_LINK?.trim();
  if (explicit) return explicit;
  return PUB_CATALOG_BASE_URL.replace(/\/?$/, '');
}
