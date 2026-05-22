/**
 * Picks the newest playwright-reports/run-* folder by report content time
 * (index.html mtime), not string sort — avoids wrong "latest" in mail/zip.
 */
const fs = require('fs');
const path = require('path');

function reportFolderStampMs(reportsDir, folderName) {
  const indexHtml = path.join(reportsDir, folderName, 'index.html');
  try {
    if (fs.existsSync(indexHtml)) return fs.statSync(indexHtml).mtimeMs;
  } catch (_) {
    /* ignore */
  }
  try {
    return fs.statSync(path.join(reportsDir, folderName)).mtimeMs;
  } catch (_) {
    return 0;
  }
}

/**
 * @param {string} reportsDir absolute path to playwright-reports
 * @returns {string | null} folder name e.g. run-2026-04-27_17-09-40
 */
function getLatestRunFolderName(reportsDir) {
  if (!fs.existsSync(reportsDir)) return null;
  const dirs = fs.readdirSync(reportsDir).filter((f) => {
    try {
      const full = path.join(reportsDir, f);
      return fs.statSync(full).isDirectory() && f.startsWith('run-');
    } catch {
      return false;
    }
  });
  if (dirs.length === 0) return null;
  let best = dirs[0];
  let bestMs = reportFolderStampMs(reportsDir, best);
  for (let i = 1; i < dirs.length; i++) {
    const ms = reportFolderStampMs(reportsDir, dirs[i]);
    if (ms > bestMs) {
      bestMs = ms;
      best = dirs[i];
    }
  }
  return best;
}

module.exports = { getLatestRunFolderName };
