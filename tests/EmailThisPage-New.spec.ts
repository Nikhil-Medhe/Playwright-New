import { test, expect } from '../fixtures';

const BASE_URL = 'https://nikhil.cn-qam-pub.catnav.us/';

test('EmailThisPage-New: Engine parts → Brake system → Item → Email This Page → fill form and submit', async ({
  page,
}) => {
  await page.goto(BASE_URL);
  await expect(page.getByRole('heading', { name: /all categories/i })).toBeVisible();

  await page.getByRole('link', { name: 'Engine parts' }).click();
  await expect(page).toHaveURL(/engine-parts/);

  await page.getByRole('link', { name: 'Brake system' }).click();
  await expect(page).toHaveURL(/brake-system/);

  await page.goto(`${BASE_URL}item/engine-parts/brake-system/item-1`);
  await expect(page).toHaveURL(/item-1/);
  await expect(page.getByRole('link', { name: 'Email This Page' })).toBeVisible();

  await page.getByRole('link', { name: 'Email This Page' }).click();

  await expect(page).toHaveURL(/\/email\//);
  await expect(page.getByRole('heading', { name: 'Email Page' })).toBeVisible();

  const formTable = page.getByRole('table').filter({ hasText: "Recipient's Email" });
  await expect(formTable).toBeVisible();
  await formTable.getByRole('textbox').nth(0).fill('nikhil.medhe@firstsource.com');
  await formTable.getByRole('textbox').nth(1).fill('nikhil.medhe@firstsource.com');
  await formTable.getByRole('textbox').nth(2).fill('Test User');
  await formTable.getByRole('textbox').nth(3).fill('Please find the item details.');

  await page.getByRole('button', { name: 'Send Email' }).first().click();

  await expect(
    page.getByText(/thank you|success|sent|submitted|email has been sent/i).first()
  ).toBeVisible({ timeout: 15000 });
});
