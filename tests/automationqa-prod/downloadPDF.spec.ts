/**
 * Automationqa — Download PDF from Engine Parts PLP.
 *
 * Run: npm run test:prod:pdf -- --headed
 */
import path from 'path';
import { test, expect } from '@playwright/test';
import { PUB_CATALOG_BASE_URL } from '../../config/urls';
import { AutomationqaCatalogPage } from '../../pages/automationqa-prod/AutomationqaCatalogPage';

test.use({
  ignoreHTTPSErrors: true,
});

function getDownloadsRunDir() {
  let runId = process.env.PLAYWRIGHT_RUN_ID;
  if (!runId) {
    const now = new Date();
    const pad = (n: number) => n.toString().padStart(2, '0');
    const datePart = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
    const timePart = `${pad(now.getHours())}-${pad(now.getMinutes())}-${pad(now.getSeconds())}`;
    runId = `run-${datePart}_${timePart}`;
  }
  return path.join(process.cwd(), 'test-results', runId, 'downloads');
}

test.describe('Automationqa — Download PDF', { tag: ['@prod', '@pub', '@smoke', '@regression'] }, () => {
  test('negative: fake PDF URL is not a valid PDF', async ({ page }) => {
    test.setTimeout(60_000);
    const resp = await page.request.get(`${PUB_CATALOG_BASE_URL}fake/path/not-a-real.pdf`);
    expect(resp.ok()).toBeFalsy();
  });

  test('negative: home page has no Engine Parts Download PDF control', async ({ page }) => {
    test.setTimeout(60_000);
    await page.goto(PUB_CATALOG_BASE_URL, { waitUntil: 'domcontentloaded' });
    const catalog = new AutomationqaCatalogPage(page);
    await catalog.expectAllCategoriesHome();
    await expect(page.getByRole('link', { name: 'Download PDF' })).toHaveCount(0);
  });

  test('happy path: Engine Parts PLP → Download PDF', async ({ page }) => {
    test.setTimeout(120_000);
    const saveDir = getDownloadsRunDir();
    const catalog = new AutomationqaCatalogPage(page);
    await page.goto(PUB_CATALOG_BASE_URL, { waitUntil: 'domcontentloaded' });
    await catalog.downloadEnginePartsPdfAndSaveToDir(saveDir, (filename) => path.join(saveDir, filename));
  });
});
