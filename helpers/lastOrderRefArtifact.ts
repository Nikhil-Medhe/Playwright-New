import fs from 'fs';
import path from 'path';

/** Stable path under `test-results/` (gitignored) for handoff to `orderManager.spec.ts`. */
const LAST_ORDER_REF_FILE = path.join(process.cwd(), 'test-results', 'last-order-ref.txt');

export function writeLastOrderRef(orderRef: string): void {
  const dir = path.dirname(LAST_ORDER_REF_FILE);
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(LAST_ORDER_REF_FILE, orderRef.trim(), 'utf8');
}

export function readLastOrderRef(): string | null {
  try {
    const s = fs.readFileSync(LAST_ORDER_REF_FILE, 'utf8').trim();
    return s.length > 0 ? s : null;
  } catch {
    return null;
  }
}
