/**
 * Shared QAM / Prod (and related) URL sets for run-tests-by-target + email labels.
 *
 * Active suites:
 * - `qam` — nikhil QAM pub (tests/qam)
 * - `prod` — Automationqa on Thomas prod (tests/automationqa-prod)
 */
const AUTOMATIONQA_PROD = {
  ENV: 'prod',
  BASE_URL: 'https://tools.thomasnet-navigator.com',
  PUB_CATALOG_URL: 'https://automationqa.thomasnet-navigator.com',
  WM_VERSIONS_PATH: '/WebSiteManager/WebManViewVersions.aspx',
  LOGIN_USERS_FILE: 'Data/automationqa-credentials.json',
};

const targetMap = {
  qam: {
    RUN_TARGET: 'qam',
    ENV: 'stage',
    BASE_URL: 'https://tools.cn-qam-stage.catnav.us',
    PUB_CATALOG_URL: 'https://nikhil.cn-qam-pub.catnav.us',
  },
  prod: {
    RUN_TARGET: 'prod',
    ...AUTOMATIONQA_PROD,
  },
  navigator: {
    RUN_TARGET: 'navigator',
    ...AUTOMATIONQA_PROD,
  },
  catnav: {
    RUN_TARGET: 'catnav',
    ENV: 'prod',
    BASE_URL: 'https://tools.catnav.us',
    PUB_CATALOG_URL: 'https://nikhil.thomasnet-navigator.com',
  },
  'thomas-stage': {
    RUN_TARGET: 'thomas-stage',
    ENV: 'stage',
    BASE_URL: 'https://tools.thomasnet-navigator.com',
    PUB_CATALOG_URL: 'https://nikhil.stage.thomasnet-navigator.com',
    WM_VERSIONS_PATH: '/WebSiteManager/WebManViewVersions.aspx',
  },
};

function getTargetEnv(target) {
  const key = (target || '').trim().toLowerCase();
  return targetMap[key] ? { ...targetMap[key] } : null;
}

/** Short label for email subject/body: QAM, PROD, Thomas Stage, … */
function resolveEmailEnvironmentLabel(env = process.env) {
  const target = (env.RUN_TARGET || env.PLAYWRIGHT_RUN_TARGET || '').trim().toLowerCase();
  if (target === 'qam') return 'QAM';
  if (target === 'prod' || target === 'navigator') return 'Automationqa Prod';
  if (target === 'thomas-stage') return 'Thomas Stage';

  const base = (env.BASE_URL || '').toLowerCase();
  const pub = (env.PUB_CATALOG_URL || '').toLowerCase();

  if (base.includes('cn-qam-stage')) return 'QAM';
  if (pub.includes('automationqa.')) return 'Automationqa Prod';
  if (base.includes('thomasnet-navigator.com') && pub.includes('stage.')) return 'Thomas Stage';
  if (base.includes('thomasnet-navigator.com')) return 'Automationqa Prod';
  if (base.includes('tools.catnav.us')) return 'CatNav Prod';

  const envName = (env.ENV || '').toLowerCase();
  if (envName === 'prod') return 'Automationqa Prod';
  if (envName === 'stage' || envName === 'dev') return 'QAM';

  return 'Local';
}

function writeLastRunContext(envVars, rootDir) {
  const fs = require('fs');
  const path = require('path');
  const dir = path.join(rootDir, 'test-results');
  fs.mkdirSync(dir, { recursive: true });
  const payload = {
    ...envVars,
    label: resolveEmailEnvironmentLabel(envVars),
    savedAt: new Date().toISOString(),
  };
  fs.writeFileSync(path.join(dir, 'last-run-target.json'), JSON.stringify(payload, null, 2), 'utf8');
}

function readLastRunContext(rootDir) {
  const fs = require('fs');
  const path = require('path');
  const file = path.join(rootDir, 'test-results', 'last-run-target.json');
  if (!fs.existsSync(file)) return null;
  try {
    return JSON.parse(fs.readFileSync(file, 'utf8'));
  } catch {
    return null;
  }
}

module.exports = {
  targetMap,
  getTargetEnv,
  resolveEmailEnvironmentLabel,
  writeLastRunContext,
  readLastRunContext,
};
