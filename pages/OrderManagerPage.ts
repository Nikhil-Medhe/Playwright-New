import { Page, expect } from '@playwright/test';
import { BasePage } from '../core/BasePage';

/** Order Manager list (same tools host as WM; session cookie should carry over). */
export const ORDER_MANAGER_HOME = 'https://tools.cn-qam-stage.catnav.us/orders/OrderHomePage.aspx';

/** Parse “Your order reference number is … 56” (digits vary). */
export function parseThankYouOrderRef(text: string): string | null {
  const m =
    text.match(/order\s*reference\s*number\s*is[^0-9#]*#?\s*(\d+)/i) ??
    text.match(/reference\s*number\s*is[^0-9#]*#?\s*(\d+)/i) ??
    text.match(/order\s*#\s*:?\s*(\d+)/i);
  return m?.[1] ?? null;
}

/** Best-effort total from thank-you copy — prefer “grand / order total” lines, else last `$…` on page. */
export function parseThankYouTotal(text: string): string | null {
  const blocks = [
    text.match(/grand\s*total[^$]*(\$\s*[\d,]+\.\d{2})/i),
    text.match(/order\s*total[^$]*(\$\s*[\d,]+\.\d{2})/i),
    text.match(/total\s*(due|amount)?\s*:?\s*(\$\s*[\d,]+\.\d{2})/i),
  ];
  for (const b of blocks) {
    const g = b?.[2] ?? b?.[1];
    if (g) return g.trim();
  }
  const all = [...text.matchAll(/\$\s*[\d,]+\.\d{2}/g)];
  if (all.length > 0) return all[all.length - 1][0].trim();
  return null;
}

/** Last dollar line on review / cart page is usually the payable total (avoids grabbing sub-shipping lines). */
export function parseLastDollarTotal(text: string): string | null {
  const all = [...text.matchAll(/\$\s*[\d,]+\.\d{2}/g)];
  if (all.length === 0) return null;
  return all[all.length - 1][0].trim();
}

export function normalizeMoney(s: string): string {
  return s.replace(/[\$,]/g, '').replace(/\s+/g, '');
}

export class OrderManagerPage extends BasePage {
  constructor(page: Page) {
    super(page);
  }

  async gotoOrderHome() {
    await this.goto(ORDER_MANAGER_HOME);
  }

  async searchByOrderNumber(orderNo: string) {
    const findRow = this.page.getByRole('row', { name: /Find Order#/i });
    const box = findRow.getByRole('textbox').first();
    await expect(box).toBeVisible({ timeout: 20_000 });
    await box.fill(orderNo);
    await this.page.getByRole('button', { name: /^search$/i }).click();
    await this.page.waitForLoadState('domcontentloaded');
  }

  /** Data row for Order # link (ancestor `tr` — avoids grid “row” that wraps the whole table). */
  private orderDataRow(orderNo: string) {
    const link = this.page.getByRole('link', { name: orderNo, exact: true }).first();
    return link.locator('xpath=ancestor::tr[1]');
  }

  /** `expectedTotalRaw` e.g. “$ 2975.37” — compared to numeric text in that data row. */
  async expectOrderRowWithTotal(orderNo: string, expectedTotalRaw: string) {
    const row = this.orderDataRow(orderNo);
    await expect(row).toBeVisible({ timeout: 25_000 });
    const rowText = await row.innerText();
    const expected = normalizeMoney(expectedTotalRaw);
    const rowNorm = normalizeMoney(rowText);
    expect(rowNorm).toContain(expected);
  }

  async expectOrderRowExists(orderNo: string) {
    await expect(this.orderDataRow(orderNo)).toBeVisible({ timeout: 25_000 });
  }
}
