import { test, expect } from '../fixtures';

const BASE_URL = 'https://nikhil.cn-qam-pub.catnav.us/';

test('New test case: add your scenario name here', async ({ page }) => {
  await page.goto(BASE_URL);
  await expect(page.getByRole('heading', { name: /all categories/i })).toBeVisible();

  // Add your steps below:
  // await page.getByRole('link', { name: '...' }).click();
  // await expect(page).toHaveURL(/.../);
  // await page.getByRole('button', { name: '...' }).click();
  // await expect(page.getByText(/.../)).toBeVisible();
});
