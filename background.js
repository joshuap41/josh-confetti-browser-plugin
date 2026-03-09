// Josh's Confetti 🎉 — Service Worker

const DEFAULT_COLORS = [
  '#ff6b6b','#ffd93d','#6bcb77','#4d96ff',
  '#ff6bcd','#ff9f43','#a29bfe','#fd79a8',
  '#00cec9','#fdcb6e','#e17055','#74b9ff'
];

const DEFAULT_SETTINGS = {
  confettiType:       'classic',
  particleCount:      1000,
  particleSize:       35,
  explosionMode:      'center',
  animationDirection: ['rise-up', 'random'],
  repeatMode:         'repeated',
  repeatCount:        2,
  colors:             DEFAULT_COLORS,
  urlTriggers:        []
};

// ── Core injection helper ──────────────────────────────────────────────────

async function shootConfetti(tabId, settings) {
  try {
    await chrome.scripting.executeScript({ target: { tabId }, files: ['content.js'] });
    await chrome.scripting.executeScript({
      target: { tabId },
      func: (s) => { if (window.__joshConfettiLaunch) window.__joshConfettiLaunch(s); },
      args: [settings]
    });
  } catch (err) {
    console.warn("Josh's Confetti 🎉:", err.message);
  }
}

// ── Repeated-shot launcher ─────────────────────────────────────────────────

async function fireWithRepeat(tabId, settings) {
  const shots = settings.repeatMode === 'repeated'
    ? Math.max(1, Math.min(10, settings.repeatCount || 3))
    : 1;

  for (let i = 0; i < shots; i++) {
    if (i > 0) await new Promise(r => setTimeout(r, 1500));
    await shootConfetti(tabId, settings);
  }
}

// ── Toolbar icon click ─────────────────────────────────────────────────────

chrome.action.onClicked.addListener(async (tab) => {
  if (!tab.id || !tab.url) return;
  if (/^(chrome|edge|chrome-extension):\/\//.test(tab.url)) return;

  const settings = await chrome.storage.sync.get(DEFAULT_SETTINGS);
  await fireWithRepeat(tab.id, settings);
});

// ── URL trigger listener ───────────────────────────────────────────────────

chrome.tabs.onUpdated.addListener(async (tabId, changeInfo, tab) => {
  if (changeInfo.status !== 'complete' || !tab.url) return;

  const { urlTriggers } = await chrome.storage.sync.get({ urlTriggers: [] });
  if (!urlTriggers?.length) return;

  const url = tab.url;
  for (const pattern of urlTriggers) {
    if (pattern?.trim() && url.includes(pattern.trim())) {
      const settings = await chrome.storage.sync.get(DEFAULT_SETTINGS);
      await fireWithRepeat(tabId, settings);
      break;
    }
  }
});
