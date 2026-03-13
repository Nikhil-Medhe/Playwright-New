import { Page, Locator } from '@playwright/test';
import { envConfig } from '../config/env';
import type { BasePageOptions } from './types';

/**
 * Base class for all page objects. Provides:
 * - Unified navigation with baseURL
 * - Common wait/visibility helpers
 * - Locator shortcuts (byRole, byTestId, byLabel)
 */
export abstract class BasePage {
  constructor(protected readonly page: Page) {}

  get baseURL(): string {
    return envConfig.baseURL;
  }

  /** Navigate to path (relative to baseURL) or full URL */
  async goto(pathOrUrl: string, options?: BasePageOptions): Promise<void> {
    const url = pathOrUrl.startsWith('http') ? pathOrUrl : `${this.baseURL}${pathOrUrl}`;
    await this.page.goto(url, {
      waitUntil: options?.waitUntil ?? 'domcontentloaded',
      timeout: envConfig.timeout,
    });
  }

  /** Wait for page to be in a stable state (network idle optional) */
  async waitForLoad(waitUntil: 'load' | 'domcontentloaded' | 'networkidle' = 'domcontentloaded'): Promise<void> {
    await this.page.waitForLoadState(waitUntil);
  }

  /** Shortcut: getByRole with common options */
  byRole(role: Parameters<Page['getByRole']>[0], name?: string | RegExp, options?: Parameters<Page['getByRole']>[2]): Locator {
    return name != null ? this.page.getByRole(role, { name, ...options }) : this.page.getByRole(role, options as any);
  }

  /** Shortcut: data-testid (recommended for stable selectors) */
  byTestId(testId: string): Locator {
    return this.page.getByTestId(testId);
  }

  /** Shortcut: getByLabel */
  byLabel(label: string | RegExp): Locator {
    return this.page.getByLabel(label);
  }

  /** Shortcut: getByPlaceholder */
  byPlaceholder(placeholder: string | RegExp): Locator {
    return this.page.getByPlaceholder(placeholder);
  }

  /** Get current page (for subclasses that might wrap context) */
  getPage(): Page {
    return this.page;
  }
}
