import path from 'path';
import { existsSync, readFileSync } from 'fs';

export type EnvName = 'dev' | 'stage' | 'prod' | 'local';

export interface EnvConfig {
  baseURL: string;
  apiBaseURL?: string;
  envName: EnvName;
  timeout: number;
  [key: string]: string | number | undefined;
}

const DEFAULT_TIMEOUT = 30_000;

function loadDotEnv(): void {
  try {
    const dotenv = require('dotenv');
    const envPath = path.resolve(process.cwd(), '.env');
    if (existsSync(envPath)) {
      /** Never override URLs already set by `run-tests-by-target.js` (`npm run test:prod` / `test:qam`). */
      dotenv.config({ path: envPath, override: false });
    }
  } catch {
    // dotenv optional
  }
}

loadDotEnv();

const envName = (process.env.ENV || process.env.NODE_ENV || 'stage').toLowerCase() as EnvName;

const envMap: Record<EnvName, Partial<EnvConfig>> = {
  dev: {
    baseURL: process.env.BASE_URL || 'https://tools.cn-qam-stage.catnav.us',
    envName: 'dev',
    timeout: Number(process.env.TIMEOUT) || DEFAULT_TIMEOUT,
  },
  stage: {
    baseURL: process.env.BASE_URL || 'https://tools.cn-qam-stage.catnav.us',
    envName: 'stage',
    timeout: Number(process.env.TIMEOUT) || DEFAULT_TIMEOUT,
  },
  prod: {
    baseURL: process.env.BASE_URL || 'https://tools.thomasnet-navigator.com',
    envName: 'prod',
    timeout: Number(process.env.TIMEOUT) || DEFAULT_TIMEOUT,
  },
  local: {
    baseURL: process.env.BASE_URL || 'http://localhost:3000',
    envName: 'local',
    timeout: Number(process.env.TIMEOUT) || DEFAULT_TIMEOUT,
  },
};

export function getEnvConfig(): EnvConfig {
  const base = envMap[envName] ?? envMap.stage;
  /** Prefer explicit `ENV` so prod/stage matches CLI targets even if maps merge oddly. */
  const resolvedEnv = (envName in envMap ? envName : base.envName!) as EnvName;
  return {
    baseURL: process.env.BASE_URL || base.baseURL!,
    apiBaseURL: process.env.API_BASE_URL || base.apiBaseURL,
    envName: resolvedEnv,
    timeout: Number(process.env.TIMEOUT) || base.timeout || DEFAULT_TIMEOUT,
  };
}

export const envConfig = getEnvConfig();
