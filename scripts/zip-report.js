/**
 * Zips playwright-report/ to playwright-report.zip so it can be attached to email.
 */
const fs = require('fs');
const path = require('path');
const archiver = require('archiver');

const reportDir = path.join(process.cwd(), 'playwright-report');
const zipPath = path.join(process.cwd(), 'playwright-report.zip');

if (!fs.existsSync(reportDir)) {
  console.log('No playwright-report folder, skip zip.');
  process.exit(0);
}

const output = fs.createWriteStream(zipPath);
const archive = archiver('zip', { zlib: { level: 6 } });

output.on('close', () => {
  console.log('Created', zipPath, '(' + Math.round(archive.pointer() / 1024) + ' KB)');
});

archive.on('error', (err) => {
  console.error('Zip error:', err);
  process.exit(1);
});

archive.pipe(output);
archive.directory(reportDir, false);
archive.finalize();
