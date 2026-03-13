import { Locator, Page } from '@playwright/test';
import { envConfig } from '../config/env';

const DEFAULT_TIMEOUT = envConfig.timeout;

/**
 * Wait for locator to be visible, then return it (for chaining).
 */
export async function waitForVisible(
  locator: Locator,
  options?: { timeout?: number }
): Promise<Locator> {
  await locator.waitFor({ state: 'visible', timeout: options?.timeout ?? DEFAULT_TIMEOUT });
  return locator;
}

/**
 * Wait for network to be idle (no requests for `idle` ms).
 */
export async function waitForNetworkIdle(
  page: Page,
  idle = 500
): Promise<void> {
  await page.waitForLoadState('networkidle');
  await new Promise((r) => setTimeout(r, idle));
}

/**
 * Retry a function until it succeeds or max attempts.
 */
export async function retry<T>(
  fn: () => Promise<T>,
  options: { attempts?: number; delayMs?: number } = {}
): Promise<T> {
  const { attempts = 3, delayMs = 500 } = options;
  let lastError: Error | undefined;
  for (let i = 0; i < attempts; i++) {
    try {
      return await fn();
    } catch (e) {
      lastError = e instanceof Error ? e : new Error(String(e));
      if (i < attempts - 1) {
        await new Promise((r) => setTimeout(r, delayMs));
      }
    }
  }
  throw lastError;
}
