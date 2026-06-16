/**
 * Automationqa — Catalog Manager on Thomas prod (same company as Test Version flow).
 *
 * Run: npm run test:prod:catalogmanager -- --headed
 */
import { test, expect } from '@playwright/test';
import { envConfig } from '../../config/env';
import { toolsBaseUrl } from '../../config/urls';
import { LoginPage } from '../../pages/common/LoginPage';

test.use({ ignoreHTTPSErrors: true });

test.describe('Automationqa — Catalog Manager', { tag: ['@prod', '@tools', '@regression'] }, () => {
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
        company: 'Automationqa',
        username: 'Automationqa',
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
    console.log(`[Automationqa Catalog Manager] ENV=${envConfig.envName} tools=${toolsHost}`);
    expect(toolsHost).toMatch(/tools\.thomasnet-navigator\.com/i);

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
    await search.fill('automotive');
    const searchGo = page.locator('#js-category-search-go');
    if (await searchGo.isVisible().catch(() => false)) {
      await searchGo.click({ force: true });
    } else {
      await page.locator('button .fa-search, button:has(.fa-search)').first().click({ force: true });
    }
    const categoryRow = categoryTree
      .getByRole('row', { name: /automotive/i })
      .filter({ hasNotText: /All Categories/i })
      .first();
    const noCategoryMatches = page.getByRole('heading', {
      name: /No category matches your criteria/i,
    });
    await expect(categoryRow.or(noCategoryMatches).first()).toBeVisible({ timeout: 30_000 });
    if (await categoryRow.isVisible().catch(() => false)) {
      await expect(categoryRow).toContainText(/automotive/i);
    }

    const leftNav = (title: string) => {
      const stem = title.replace(/s$/i, '');
      const titles = new Set([title, stem]);
      if (title === 'Promotions') titles.add('Promotion');
      const selector = [...titles].map((t) => `a[title="${t}"]`).join(', ');
      return page
        .locator(selector)
        .or(page.getByRole('link', { name: new RegExp(`^\\s*${title}\\s*$`, 'i') }))
        .first();
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

    await expect(page.getByText(/Automationqa/i).first()).toBeVisible({ timeout: 15_000 });
  });
});
