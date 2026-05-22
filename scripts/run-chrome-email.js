/**
 * Chrome + email (shortcut). Same as run-browser-email.js with browser=chrome.
 * Prefer: npm run test:qam:email -- chrome
 */
process.env.BROWSER = process.env.BROWSER || 'chrome';
require('./run-browser-email.js');
