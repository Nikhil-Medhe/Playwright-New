/**
 * Catalog Manager — QAM (nikhil tools host).
 *
 * Run: npm run test:catalogmanager:qam -- --project=chrome
 */
import { test, expect } from '@playwright/test';
import { envConfig } from '../../config/env';
import { toolsBaseUrl } from '../../config/urls';
import { LoginPage } from '../../pages/common/LoginPage';

test.use({ ignoreHTTPSErrors: true });

test.describe('QAM — Catalog Manager', { tag: ['@qam', '@tools', '@regression'] }, () => {
  test('negative: unauthenticated Category Tree redirects to login', async ({ page }) => {
    test.setTimeout(60_000);
    await page.goto(`${toolsBaseUrl()}/CatalogManager/CategoryTree.aspx`, {
      waitUntil: 'domcontentloaded',
    });
    await expect(page).toHaveURL(/\/LoginManager\/login\.aspx/i, { timeout: 20_000 });
  });

  test('negative: invalid login credentials', async ({ page }) => {
    test.setTimeout(60_000);
    const login = new LoginPage(page);
    await login.goto('/CatalogManager/CategoryTree.aspx');
    await login.attemptSignIn(
      {
        company: 'nikhil',
        username: 'nikhilmedhe',
        password: 'WrongPassword_NotReal_999!',
      },
      { label: 'Catalog Manager' },
    );
    await expect(page).toHaveURL(/login/i, { timeout: 20_000 });
    await expect(login.invalidCredentialsMessage()).toBeVisible({ timeout: 15_000 });
  });

  test('happy path: login, categories tree, search, left nav', async ({ page }) => {
    test.setTimeout(360_000);

    const toolsHost = toolsBaseUrl();
    console.log(`[Catalogmanager] ENV=${envConfig.envName} tools=${toolsHost}`);

    const login = new LoginPage(page);
    await login.goto('/CatalogManager/CategoryTree.aspx');
    await expect(page).toHaveURL(/\/LoginManager\/login\.aspx/i);
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
    const testCategoryRow = categoryTree
      .getByRole('row', { name: /test\s*\[\d+\s*items?\]/i })
      .filter({ hasNotText: /All Categories/i })
      .first();
    const noCategoryMatches = page.getByRole('heading', { name: /No category matches your criteria/i });
    await expect(testCategoryRow.or(noCategoryMatches).first()).toBeVisible({ timeout: 30_000 });
    if (await testCategoryRow.isVisible().catch(() => false)) {
      await expect(testCategoryRow).toContainText(/test/i);
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
});
