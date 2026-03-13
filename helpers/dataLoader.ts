import { existsSync, readFileSync } from 'fs';
import path from 'path';
import type { TestDataRecord } from '../core/types';

const DATA_DIR = process.env.DATA_DIR || path.resolve(process.cwd(), 'Data');

/**
 * Load JSON array from Data/ or custom path. Used for data-driven tests.
 */
export function loadJson<T = TestDataRecord>(filename: string): T[] {
  const filePath = path.isAbsolute(filename) ? filename : path.resolve(DATA_DIR, filename);
  if (!existsSync(filePath)) {
    throw new Error(`Data file not found: ${filePath}`);
  }
  const raw = readFileSync(filePath, 'utf-8');
  const data = JSON.parse(raw);
  return Array.isArray(data) ? data : [data];
}

/**
 * Load single JSON object (e.g. credentials.json as object with keys).
 */
export function loadJsonObject<T = Record<string, unknown>>(filename: string): T {
  const filePath = path.isAbsolute(filename) ? filename : path.resolve(DATA_DIR, filename);
  if (!existsSync(filePath)) {
    throw new Error(`Data file not found: ${filePath}`);
  }
  const raw = readFileSync(filePath, 'utf-8');
  return JSON.parse(raw) as T;
}

/**
 * Resolve path to a file under Data/ (or DATA_DIR).
 */
export function resolveDataPath(relativePath: string): string {
  return path.resolve(DATA_DIR, relativePath);
}

/**
 * Get credentials array from env (LOGIN_USERS JSON) or from file.
 * File path: LOGIN_USERS_FILE or Data/credentials.json.
 */
export interface LoginCreds {
  company: string;
  username: string;
  password: string;
}

export function getLoginUsers(): LoginCreds[] {
  const env = process.env.LOGIN_USERS;
  if (env) {
    try {
      const parsed = JSON.parse(env) as LoginCreds[];
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    } catch {
      // ignore invalid JSON
    }
  }

  const filePath = process.env.LOGIN_USERS_FILE
    ? path.resolve(process.cwd(), process.env.LOGIN_USERS_FILE)
    : path.resolve(DATA_DIR, 'credentials.json');

  if (existsSync(filePath)) {
    try {
      const json = readFileSync(filePath, 'utf-8');
      const parsed = JSON.parse(json) as LoginCreds[];
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    } catch {
      // ignore
    }
  }

  return [];
}

/** Default user when no credentials file (e.g. CI with LOGIN_USERS). */
const FALLBACK_CREDS: LoginCreds = {
  company: 'nikhil',
  username: 'nikhilmedhe',
  password: 'New@nikhil123',
};

export function getDefaultLoginUser(): LoginCreds {
  const users = getLoginUsers();
  return users.length > 0 ? users[0] : FALLBACK_CREDS;
}
