/**
 * Playwright test tags — filter with `--grep @smoke` or `--grep-invert @flaky`.
 *
 * @see FRAMEWORK.md
 */
export const TAG = {
  QAM: '@qam',
  PROD: '@prod',
  SMOKE: '@smoke',
  REGRESSION: '@regression',
  TOOLS: '@tools',
  PUB: '@pub',
  COMMERCE: '@commerce',
  ORDER: '@order',
  PCAT: '@pcat',
  NEGATIVE: '@negative',
  FLAKY: '@flaky',
} as const;

export type TestTag = (typeof TAG)[keyof typeof TAG];
