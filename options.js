// Josh's Confetti 🎉 — Options Page
// Opened by Chrome when the user right-clicks the icon and chooses "Options".
// Sends a message to inject the settings overlay onto the real page, then
// closes this tab so the user never sees a separate page.

document.addEventListener('DOMContentLoaded', async () => {
  await chrome.runtime.sendMessage({ action: 'openOverlay' });
  window.close();
});
