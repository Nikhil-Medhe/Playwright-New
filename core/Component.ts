import { Locator } from '@playwright/test';
import type { BasePage } from './BasePage';

/**
 * Reusable UI component (e.g. header, modal, sidebar).
 * Receives a root Locator; all component actions are scoped to it.
 */
export abstract class Component {
  constructor(protected readonly root: Locator) {}

  /** Optional: parent page for full-page actions */
  protected page?: BasePage;

  static withPage<T extends Component>(this: new (root: Locator) => T, root: Locator, page: BasePage): T {
    const instance = new this(root) as T;
    (instance as any).page = page;
    return instance;
  }
}
