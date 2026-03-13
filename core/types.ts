import type { Page, Locator } from '@playwright/test';

export type { Page, Locator };

export interface BasePageOptions {
  path?: string;
  waitUntil?: 'load' | 'domcontentloaded' | 'networkidle';
}

export interface TestDataRecord {
  [key: string]: string | number | boolean | string[] | undefined;
}

export type DataSource = 'json' | 'csv' | 'env';
