import path from 'path';
import { test } from '../fixtures';
import { PublicCatalogPage } from '../pages/PublicCatalogPage';

function getDownloadsRunDir() {
  let runId = process.env.PLAYWRIGHT_RUN_ID;
  if (!runId) {
    const now = new Date();
    const pad = (n: number) => n.toString().padStart(2, '0');
    const datePart = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
    const timePart = `${pad(now.getHours())}-${pad(now.getMinutes())}-${pad(now.getSeconds())}`;
    runId = `run-${datePart}_${timePart}`;
  }
  return path.join(process.cwd(), 'test-results', runId, 'downloads');
}

test('Engine parts → Brake system → Download PDF', async ({ page }) => {
  test.setTimeout(90_000);
  const saveDir = getDownloadsRunDir();
  const catalog = new PublicCatalogPage(page);
  await catalog.downloadBrakePdfAndSaveToDir(saveDir, (filename) => path.join(saveDir, filename));
});
