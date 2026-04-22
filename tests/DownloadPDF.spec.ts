import path from 'path';
import { existsSync, statSync, mkdirSync, writeFileSync } from 'fs';
import { test, expect } from '../fixtures';
import type { Download, Page } from '@playwright/test';

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

function looksLikePdf(buf: Buffer): boolean {
  return buf.length >= 4 && buf.subarray(0, 4).toString() === '%PDF';
}

test('Engine parts → Brake system → Download PDF', async ({ page }) => {
  test.setTimeout(90_000);

  await page.goto('https://nikhil.cn-qam-pub.catnav.us/');
  await expect(page.getByRole('heading', { name: /all categories/i })).toBeVisible();

  await page.getByRole('link', { name: 'Engine parts' }).click();
  await expect(page).toHaveURL(/engine-parts/);

  await page.getByRole('link', { name: 'Brake system' }).click();
  await expect(page).toHaveURL(/brake-system/);
  await expect(page.getByRole('link', { name: 'Download PDF' })).toBeVisible();

  await page.getByRole('combobox').nth(2).selectOption('200');

  const link = page.getByRole('link', { name: 'Download PDF' });
  const waitMs = 75_000;

  const downloadP = page.waitForEvent('download', { timeout: waitMs });
  const popupP = page.waitForEvent('popup', { timeout: waitMs });
  void downloadP.catch(() => {});
  void popupP.catch(() => {});

  await link.click();

  let result: { kind: 'download'; d: Download } | { kind: 'popup'; p: Page } | { kind: 'navigate' };

  try {
    result = await Promise.race([
      downloadP.then((d) => ({ kind: 'download' as const, d })),
      popupP.then((p) => ({ kind: 'popup' as const, p })),
    ]);
  } catch {
    await page
      .waitForURL(/\.pdf(\?|$)|\/pdf\/|download|\.pdf/i, { timeout: 45_000, waitUntil: 'commit' })
      .catch(() => {});
    await expect(page.url()).toMatch(/\.pdf(\?|$)|\/pdf\/|download|\.pdf/i);
    result = { kind: 'navigate' };
  }

  const saveDir = getDownloadsRunDir();
  mkdirSync(saveDir, { recursive: true });

  if (result.kind === 'download') {
    const { d: download } = result;
    await expect(download.suggestedFilename()).toMatch(/\.pdf$/i);
    const savePath = path.join(saveDir, download.suggestedFilename());
    await download.saveAs(savePath);
    expect(existsSync(savePath)).toBe(true);
    expect(statSync(savePath).size).toBeGreaterThan(0);
    return;
  }

  if (result.kind === 'popup') {
    const pdfPage = result.p;
    await pdfPage.waitForLoadState('domcontentloaded');
    const pdfUrl = pdfPage.url();
    await expect(pdfUrl).toMatch(/pdf|download|catnav/i);
    const resp = await page.request.get(pdfUrl);
    expect(resp.ok()).toBeTruthy();
    const buf = Buffer.from(await resp.body());
    expect(looksLikePdf(buf) || buf.length > 500).toBeTruthy();
    const base = pdfUrl.split('/').pop()?.split('?')[0] || 'download.pdf';
    const savePath = path.join(saveDir, base.toLowerCase().endsWith('.pdf') ? base : 'brake-download.pdf');
    writeFileSync(savePath, buf);
    expect(statSync(savePath).size).toBeGreaterThan(0);
    await pdfPage.close();
    return;
  }

  const url = page.url();
  const resp = await page.request.get(url);
  expect(resp.ok()).toBeTruthy();
  const buf = Buffer.from(await resp.body());
  expect(looksLikePdf(buf) || buf.length > 500).toBeTruthy();
  const savePath = path.join(saveDir, 'brake-system-download.pdf');
  writeFileSync(savePath, buf);
  expect(statSync(savePath).size).toBeGreaterThan(0);
});
