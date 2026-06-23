import { execSync } from 'child_process';
import path from 'path';
import { defineConfig, devices } from '@playwright/test';
import { envConfig } from './config/env';

// One RUN_ID per run: run-YYYY-MM-DD_HH-mm-ss (set by scripts/run-tests-with-id.js)
function getRunId() {
  if (process.env.PLAYWRIGHT_RUN_ID) return process.env.PLAYWRIGHT_RUN_ID;
  const now = new Date();
  const pad = (n: number) => n.toString().padStart(2, '0');
  const datePart = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
  const timePart = `${pad(now.getHours())}-${pad(now.getMinutes())}-${pad(now.getSeconds())}`;
  return (process.env.PLAYWRIGHT_RUN_ID = `run-${datePart}_${timePart}`);
}
const runId = getRunId();

/**
 * Default locally: **headed** (browser visible). Headless when `CI=true` and not overridden.
 * - `PLAYWRIGHT_HEADED=true` — always show browser (wins over `HEADLESS=true` in `.env`).
 * - `HEADLESS=true` — background browser. `HEADLESS=false` — force headed.
 * - CLI `--headed` still forces headed for that run.
 */
function useHeadless(): boolean {
  const headed = process.env.PLAYWRIGHT_HEADED?.trim().toLowerCase();
  if (headed === '1' || headed === 'true' || headed === 'yes') return false;
  if (process.env.HEADLESS === 'false') return false;
  if (process.env.HEADLESS === 'true') return true;
  return process.env.CI === 'true';
}

/**
 * Headed runs: large outer window + `viewport: null` by default (page fills the window).
 * Chromium: `--start-maximized`. Firefox/WebKit: outer window sized to primary monitor working area on Windows, else PLAYWRIGHT_WINDOW_* / large fallback (`resolvedMaximizeOuterDimensions`).
 * Fixed viewport (smaller window): `PLAYWRIGHT_MAXIMIZE=false`.
 */
function useStartMaximized(): boolean {
  const v = process.env.PLAYWRIGHT_MAXIMIZE?.trim().toLowerCase();
  if (v === 'false' || v === '0' || v === 'no') return false;
  return true;
}

/** CI=1 worker. Local default 2 (avoids many parallel browsers → fewer newPage/teardown timeouts). Override: PLAYWRIGHT_WORKERS=4 in .env */
function workerCount(): number {
  if (process.env.CI) return 1;
  const raw = process.env.PLAYWRIGHT_WORKERS?.trim();
  if (raw) {
    const n = parseInt(raw, 10);
    if (!Number.isNaN(n) && n >= 1) return n;
  }
  return 2;
}

function isTruthyEnv(name: string): boolean {
  const v = process.env[name]?.trim().toLowerCase();
  return v === 'true' || v === '1' || v === 'yes';
}

/** Optional: block downloadable fonts so headings use system fallback (if chunky font persists in Chrome). */
function chromiumExtraLaunchArgs(): string[] {
  const args: string[] = [];
  if (isTruthyEnv('PLAYWRIGHT_DISABLE_REMOTE_WEB_FONTS')) {
    args.push('--disable-remote-fonts');
  }
  return args;
}

type ChromiumLikeChannel = 'chrome' | 'msedge';
type ChromiumLikeDevice = 'Desktop Chrome' | 'Desktop Edge';

/** Chrome / Edge (Chromium): `--start-maximized` + `viewport: null` when enabled. */
function chromiumLikeUseOptions(device: ChromiumLikeDevice, channel: ChromiumLikeChannel) {
  const desktop = { ...devices[device] } as Record<string, unknown>;
  const extra = chromiumExtraLaunchArgs();
  if (useStartMaximized()) {
    delete desktop.deviceScaleFactor;
    return {
      channel,
      ...desktop,
      viewport: null,
      launchOptions: {
        slowMo: launchSlowMo(),
        args: ['--start-maximized', ...extra],
      },
    };
  }
  return {
    channel,
    ...desktop,
    launchOptions: {
      slowMo: launchSlowMo(),
      ...(extra.length ? { args: extra } : {}),
    },
  };
}

function launchSlowMo(): number {
  return Number(process.env.SLOW_MO) || 0;
}

/** Best-effort primary monitor usable area (excludes taskbar). Used so Firefox/WebKit windows match “maximized” size instead of the tiny Desktop *preset* `screen`. */
function primaryMonitorWorkingAreaPixels(): { width: number; height: number } | null {
  if (process.platform !== 'win32') return null;
  try {
    const cmd =
      'powershell -NoProfile -Command "Add-Type -AssemblyName System.Windows.Forms; $wa=[System.Windows.Forms.Screen]::PrimaryScreen.WorkingArea; Write-Output $wa.Width; Write-Output $wa.Height"';
    const lines = execSync(cmd, { encoding: 'utf-8', timeout: 8000, windowsHide: true })
      .trim()
      .split(/\r?\n/);
    const w = parseInt(lines[0] ?? '', 10);
    const h = parseInt(lines[1] ?? '', 10);
    if (Number.isFinite(w) && Number.isFinite(h) && w >= 800 && h >= 600) {
      return { width: w, height: h };
    }
  } catch {
    /* PowerShell blocked or unavailable */
  }
  return null;
}

/**
 * Firefox/WebKit do not support Chromium's `--start-maximized`. Prefer real monitor working area on Windows, else PLAYWRIGHT_WINDOW_* env, else a large fallback — not the Playwright device preset (often 1920×1080 / too small on big displays).
 */
function resolvedMaximizeOuterDimensions(): { width: string; height: string } {
  const envW = process.env.PLAYWRIGHT_WINDOW_WIDTH?.trim();
  const envH = process.env.PLAYWRIGHT_WINDOW_HEIGHT?.trim();
  if (envW && envH && /^\d+$/.test(envW) && /^\d+$/.test(envH)) {
    return { width: envW, height: envH };
  }
  const primary = primaryMonitorWorkingAreaPixels();
  if (primary) {
    return { width: String(primary.width), height: String(primary.height) };
  }
  /* Generic large desktop if OS probe fails (e.g. Linux CI or locked-down shell). */
  return { width: '2560', height: '1440' };
}

function firefoxUseOptions() {
  const preset = devices['Desktop Firefox'];
  const desktop = { ...preset } as Record<string, unknown>;
  const slowMo = launchSlowMo();
  if (!useStartMaximized()) {
    return {
      ...desktop,
      launchOptions: { slowMo },
    };
  }
  delete desktop.deviceScaleFactor;
  const { width, height } = resolvedMaximizeOuterDimensions();
  return {
    ...desktop,
    viewport: null,
    launchOptions: {
      slowMo,
      args: ['-width', width, '-height', height],
    },
  };
}

/*
function webkitUseOptions() {
  const preset = devices['Desktop Safari'];
  const desktop = { ...preset } as Record<string, unknown>;
  const slowMo = launchSlowMo();
  if (!useStartMaximized()) {
    return {
      ...desktop,
      launchOptions: { slowMo },
    };
  }
  delete desktop.deviceScaleFactor;
  const { width, height } = resolvedMaximizeOuterDimensions();
  return {
    ...desktop,
    viewport: null,
    launchOptions: {
      slowMo,
      args: ['--maximized', `--size=${width}x${height}`],
    },
  };
}
*/

export default defineConfig({
  testDir: './tests',
  /** Active suites only — legacy root + recorded + old automationqa/ folder ignored. */
  testIgnore: [
    '**/node_modules/**',
    '**/tests/automationqa/**',
    '**/*-recorded.spec.ts',
    '**/tests/automationqa-*.spec.ts',
    '**/tests/CategoryResults.spec.ts',
    '**/tests/*.spec.ts',
  ],
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : Number(process.env.PLAYWRIGHT_RETRIES ?? 0) || 0,
  workers: workerCount(),
  grep: process.env.PLAYWRIGHT_GREP ? new RegExp(process.env.PLAYWRIGHT_GREP) : undefined,
  grepInvert: process.env.PLAYWRIGHT_GREP_INVERT
    ? new RegExp(process.env.PLAYWRIGHT_GREP_INVERT)
    : /@flaky/,
  outputDir: path.join(process.cwd(), 'test-results', runId),
  reporter: [
    ['html', { outputFolder: path.join(process.cwd(), 'playwright-reports', runId), open: 'never' }],
    ['junit', { outputFile: path.join(process.cwd(), 'test-results', 'junit.xml') }],
  ],
  timeout: envConfig.timeout,
  use: {
    baseURL: envConfig.baseURL,
    headless: useHeadless(),
    /* Capture screenshots/videos only on failures. */
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    /* Collect trace when retrying the failed test. See https://playwright.dev/docs/trace-viewer */
    trace: 'on-first-retry',
  },

  /*
   * --- Browsers / projects (edit here later) ---
   * Browser list is under `projects:` below; run commands are in the comment lines above.
   * Run all:  npx playwright test
   * One browser: npx playwright test --project=chrome | edge | firefox
   * Browser + email: npm run test:qam:email -- edge   (or BROWSER=firefox npm run test:qam:email)
   * Install browsers once: npx playwright install chrome msedge firefox
   *
   * Add/remove a browser: duplicate or delete a `{ name, use }` block below.
   * - Chrome / Edge (Chromium): use chromiumLikeUseOptions('Desktop Chrome'|'Desktop Edge', 'chrome'|'msedge').
   * - Firefox: firefoxUseOptions().
   * - Bundled Chromium (no Google install): new project with use: { ...devices['Desktop Chrome'], launchOptions: {...} } — no `channel` key (see Playwright “Browsers” doc).
   * - WebKit: uncomment webkitUseOptions() + project at bottom of this file.
   * Window size / maximize: useStartMaximized(), resolvedMaximizeOuterDimensions(), chromiumLikeUseOptions, firefoxUseOptions (top of file).
   * Headed vs headless: useHeadless() + env HEADLESS / PLAYWRIGHT_HEADED (also top).
   */
  projects: [
    {
      name: 'chrome',
      use: chromiumLikeUseOptions('Desktop Chrome', 'chrome'),
    },
    {
      name: 'edge',
      use: chromiumLikeUseOptions('Desktop Edge', 'msedge'),
    },
    {
      name: 'firefox',
      use: firefoxUseOptions(),
    },

    // {
    //   name: 'webkit',
    //   use: webkitUseOptions(),
    // },

    /* Test against mobile viewports. */
    // {
    //   name: 'Mobile Chrome',
    //   use: { ...devices['Pixel 5'] },
    // },
  ],

  /* Run your local dev server before starting the tests */
  // webServer: {
  //   command: 'npm run start',
  //   url: 'http://localhost:3000',
  //   reuseExistingServer: !process.env.CI,
  // },
});
