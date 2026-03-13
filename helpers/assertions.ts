import { expect } from '@playwright/test';

/**
 * Re-export expect and add custom assertion helpers if needed.
 * Use expect from @playwright/test in tests; this module can extend with soft/compound assertions.
 */
export { expect };

/**
 * Assert URL path matches (after baseURL).
 */
export async function expectPath(page: { url: () => Promise<string> }, pathOrRegex: string | RegExp): Promise<void> {
  const url = await page.url();
  if (typeof pathOrRegex === 'string') {
    expect(url).toContain(pathOrRegex);
  } else {
    expect(url).toMatch(pathOrRegex);
  }
}
