import { test, expect } from '@playwright/test';

test.use({
  ignoreHTTPSErrors: true
});

test('test', async ({ page }) => {
  await page.goto('https://cart.cn-qam-pub.catnav.us/cbcheckout/reviewcart?token=...%E0%A4%A4%E0%A5%81%E0%A4%AE%E0%A4%9A%E0%A4%BE-URL...');
});

