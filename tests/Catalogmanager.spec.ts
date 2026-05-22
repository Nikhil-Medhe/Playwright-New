/**
 * Catalog Manager — URLs follow `BASE_URL` from `run-tests-by-target.js` (not hardcoded QAM).
 *
 * Prod (Thomas):  npm run test:catalogmanager:prod -- --project=chrome
 *   → https://tools.thomasnet-navigator.com/LoginManager/login.aspx
 * QAM (stage):    npm run test:catalogmanager:qam -- --project=chrome
 *   → https://tools.cn-qam-stage.catnav.us/LoginManager/login.aspx
 *
 * Plain `npx playwright test tests/Catalogmanager.spec.ts` uses `.env` / default stage — not prod.
 */
import { test, expect } from '@playwright/test';
import { envConfig } from '../config/env';
import { toolsBaseUrl } from '../config/urls';
import { LoginPage } from '../pages/LoginPage';

test.use({ ignoreHTTPSErrors: true });

test('Catalog Manager — login, categories, expand tree', async ({ page }) => {
  test.setTimeout(360_000);

  const toolsHost = toolsBaseUrl();
  console.log(`[Catalogmanager] ENV=${envConfig.envName} tools=${toolsHost}`);

  const login = new LoginPage(page);
  await login.goto('/CatalogManager/CategoryTree.aspx');
  await expect(page).toHaveURL(/\/LoginManager\/login\.aspx/i);
  if (envConfig.envName === 'prod') {
    expect(toolsHost, 'Prod run must use npm run test:catalogmanager:prod (not plain npx playwright test)').toMatch(
      /tools\.thomasnet-navigator\.com/i,
    );
  }
  await login.loginToCatalogManager();

  await page.waitForLoadState('domcontentloaded');
  await page.waitForURL(/CategoryTree\.aspx|\/catalog\//i, { timeout: 60_000 });

  const categoriesLink = page
    .locator('a.leftnav[title="Categories"], a[title="Categories"]')
    .or(page.getByRole('link', { name: /^Categories$/i }))
    .first();
  await categoriesLink.waitFor({ state: 'visible', timeout: 60_000 });
  await categoriesLink.scrollIntoViewIfNeeded();
  await categoriesLink.click({ force: true });
  await expect
    .poll(() => page.url(), { timeout: 60_000 })
    .toMatch(/\/catalog\/category|CategoryTree\.aspx/i);

  const expandAll = page.getByRole('button', { name: 'Expand All' });
  await expandAll.waitFor({ state: 'visible', timeout: 60_000 });
  await expandAll.scrollIntoViewIfNeeded();
  await expandAll.click({ force: true });

  const categoryTree = page.getByRole('treegrid');
  await expect(categoryTree).toBeVisible();
  await expect(categoryTree.getByRole('row', { name: /All Categories/i }).first()).toBeVisible();

  const search = page.getByRole('textbox', { name: 'Search' });
  await search.scrollIntoViewIfNeeded();
  await search.click();
  await search.fill('test');
  const goBtn = page.locator('#js-category-search-go');
  await goBtn.scrollIntoViewIfNeeded();
  await goBtn.click({ force: true });
  const testCategoryRow = categoryTree.getByRole('row', { name: /TEST\s*\[\d+\s*items?\]/i }).first();
  const noCategoryMatches = page.getByRole('heading', { name: /No category matches your criteria/i });
  await expect(testCategoryRow.or(noCategoryMatches).first()).toBeVisible({ timeout: 30_000 });
  if (await testCategoryRow.isVisible().catch(() => false)) {
    await expect(testCategoryRow).toContainText('TEST');
  }

  const leftNav = (title: string) => {
    const stem = title.replace(/s$/i, '');
    const titles = new Set([title, stem]);
    if (title === 'Promotions') titles.add('Promotion');
    const selector = [...titles].map((t) => `a[title="${t}"]`).join(', ');
    return page.locator(selector).first();
  };

  const assertLeftNavSelected = async (title: string) => {
    const stem = title.replace(/s$/i, '').toLowerCase();
    await expect
      .poll(() => page.url(), { timeout: 60_000 })
      .toMatch(new RegExp(`/catalog/${stem}`, 'i'));
  };

  const clickLeftNav = async (title: string) => {
    const link = leftNav(title);
    if (!(await link.isVisible().catch(() => false))) {
      const menuToggle = page.getByRole('link', { name: /Expand Menu|Collapse Menu/i }).first();
      if (await menuToggle.isVisible().catch(() => false)) {
        await menuToggle.click({ force: true });
      }
    }
    await link.click({ force: true, timeout: 60_000 });
    await assertLeftNavSelected(title);
  };

  await clickLeftNav('Products');
  await clickLeftNav('Attributes');
  await clickLeftNav('Forms');
  await clickLeftNav('Assets');
  await clickLeftNav('Promotions');
  await clickLeftNav('Batch');
  await clickLeftNav('Catalogs');
  await clickLeftNav('Items');
  await clickLeftNav('Publish');
});
