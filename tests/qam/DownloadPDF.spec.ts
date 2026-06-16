import path from 'path';
import { test, expect } from '@playwright/test';
import { PUB_CATALOG_BASE_URL } from '../../config/urls';
import { PublicCatalogPage } from '../../pages/qam/PublicCatalogPage';

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

test.use({
  ignoreHTTPSErrors: true,
});

test.describe('QAM — Download PDF', { tag: ['@qam', '@pub', '@smoke', '@regression'] }, () => {
  test('negative: fake PDF URL is not a valid PDF', async ({ page }) => {
    test.setTimeout(60_000);
    const resp = await page.request.get(`${PUB_CATALOG_BASE_URL}fake/path/not-a-real.pdf`);
    expect(resp.ok()).toBeFalsy();
  });

  test('negative: home page has no Brake system Download PDF control', async ({ page }) => {
    test.setTimeout(60_000);
    const catalog = new PublicCatalogPage(page);
    await catalog.gotoHome();
    await catalog.expectAllCategoriesHeading();
    await expect(page.getByRole('link', { name: 'Download PDF' })).toHaveCount(0);
  });

  test('happy path: Engine parts → Brake system → Download PDF', async ({ page }) => {
    test.setTimeout(90_000);
    const saveDir = getDownloadsRunDir();
    const catalog = new PublicCatalogPage(page);
    await catalog.downloadBrakePdfAndSaveToDir(saveDir, (filename) => path.join(saveDir, filename));
  });
});
