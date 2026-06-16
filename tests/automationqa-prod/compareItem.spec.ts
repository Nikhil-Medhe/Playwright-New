/**
 * Automationqa — Compare Items on pub catalog (Engine Parts PLP).
 *
 * Run: npm run test:prod:compare -- --headed
 */
import { test, expect } from '@playwright/test';
import { PUB_CATALOG_BASE_URL } from '../../config/urls';
import { AutomationqaCatalogPage } from '../../pages/automationqa-prod/AutomationqaCatalogPage';

test.use({
  ignoreHTTPSErrors: true,
});

test.describe('Automationqa — Compare Items', { tag: ['@prod', '@pub', '@smoke', '@regression'] }, () => {
  test('negative: Compare Items with no selection stays on PLP', async ({ page }) => {
    test.setTimeout(60_000);

    const catalog = new AutomationqaCatalogPage(page);
    await page.goto(PUB_CATALOG_BASE_URL, { waitUntil: 'domcontentloaded' });
    await catalog.navigateToEnginePartsPlpFromHome();
    const plpUrl = page.url();

    await page.getByRole('button', { name: 'Compare Items' }).click();
    await page.waitForTimeout(1500);
    await expect(page).toHaveURL(plpUrl);
    await expect(page).not.toHaveURL(/\/compare\//i);
  });

  test('negative: single item selected does not open compare view', async ({ page }) => {
    test.setTimeout(60_000);

    const catalog = new AutomationqaCatalogPage(page);
    await page.goto(PUB_CATALOG_BASE_URL, { waitUntil: 'domcontentloaded' });
    await catalog.navigateToEnginePartsPlpFromHome();
    const ids = await catalog.getPlPCheckboxIds();
    expect(ids.length).toBeGreaterThanOrEqual(2);

    await page.locator(`[id="${ids[0]}"]`).check();
    await page.getByRole('button', { name: 'Compare Items' }).click();
    await page.waitForTimeout(1500);
    await expect(page).not.toHaveURL(/\/compare\//i);
  });

  test('happy path: compare Valve Cover Pro 1 and Valve Spring Pro 1', async ({ page }) => {
    test.setTimeout(90_000);

    const catalog = new AutomationqaCatalogPage(page);
    await page.goto(PUB_CATALOG_BASE_URL, { waitUntil: 'domcontentloaded' });
    await catalog.navigateToEnginePartsPlpFromHome();

    const ids = await catalog.getPlPCheckboxIds();
    expect(ids.length, 'Engine Parts PLP needs ≥2 items to compare').toBeGreaterThanOrEqual(2);

    /** Pick rows by product label when possible; else first two PLP ids. */
    const valveCoverRow = page.locator('tr').filter({ hasText: /Valve Cover Pro 1/i });
    const valveSpringRow = page.locator('tr').filter({ hasText: /Valve Spring Pro 1/i });
    let idA = ids[0];
    let idB = ids[1];
    if ((await valveCoverRow.count()) > 0 && (await valveSpringRow.count()) > 0) {
      idA = (await valveCoverRow.first().locator('input.plp-search-selection').getAttribute('id'))!;
      idB = (await valveSpringRow.first().locator('input.plp-search-selection').getAttribute('id'))!;
    }

    await catalog.comparePlPItemsByIds(idA, idB);
    await expect(page).toHaveURL(/itemids=/i);
    await catalog.expectCompareViewForProductNames(/Valve Cover Pro 1/i, /Valve Spring Pro 1/i);
  });
});
