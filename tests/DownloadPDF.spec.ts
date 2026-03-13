import path from 'path';
import { existsSync, statSync, mkdirSync } from 'fs';
import { test, expect } from '../fixtures';

// Same run folder as config outputDir (PLAYWRIGHT_RUN_ID: run-YYYY-MM-DD_HH-mm-ss)
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

test('Engine parts → Brake system → Download PDF', async ({ page }) => {
  await page.goto('https://nikhil.cn-qam-pub.catnav.us/');
  await expect(page.getByRole('heading', { name: /all categories/i })).toBeVisible();

  await page.getByRole('link', { name: 'Engine parts' }).click();
  await expect(page).toHaveURL(/engine-parts/);

  await page.getByRole('link', { name: 'Brake system' }).click();
  await expect(page).toHaveURL(/brake-system/);
  await expect(page.getByRole('link', { name: 'Download PDF' })).toBeVisible();

  await page.getByRole('combobox').nth(2).selectOption('200');
  const downloadPromise = page.waitForEvent('download');
  await page.getByRole('link', { name: 'Download PDF' }).click();
  const download = await downloadPromise;

  await expect(download.suggestedFilename()).toMatch(/\.pdf$/i);
  expect(download.suggestedFilename().length).toBeGreaterThan(0);

  const saveDir = getDownloadsRunDir();
  mkdirSync(saveDir, { recursive: true });
  const savePath = path.join(saveDir, download.suggestedFilename());
  await download.saveAs(savePath);

  expect(existsSync(savePath)).toBe(true);
  expect(statSync(savePath).size).toBeGreaterThan(0);
});
