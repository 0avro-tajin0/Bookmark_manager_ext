// ── Service worker ──────────────────────────────────────────────────────────
// Minimal background script for personal-use build. No analytics, no
// uninstall survey — just opens the new tab page on fresh install.

chrome.runtime.onInstalled.addListener(({ reason }) => {
  if (reason === 'install') {
    chrome.tabs.create({ url: 'newtab.html' });
  }
});
