// Josh's Confetti 🎉 — Service Worker

const DEFAULT_COLORS = [
  '#ff6b6b','#ffd93d','#6bcb77','#4d96ff',
  '#ff6bcd','#ff9f43','#a29bfe','#fd79a8',
  '#00cec9','#fdcb6e','#e17055','#74b9ff'
];

const DEFAULT_SETTINGS = {
  confettiType:       'classic',
  particleCount:      4000,
  particleSize:       50,
  animationSpeed:     0.2,
  explosionMode:      'fireworks',
  repeatMode:         'single',
  repeatCount:        2,
  colors:             DEFAULT_COLORS,
  urlTriggers:        [],
  soundEnabled:       false
};

const CHROME_URL_RE = /^(chrome|edge|chrome-extension):\/\//;

// ── Track the last real tab the user was on ────────────────────────────────
// Stored both in memory (fast) and in chrome.storage.session (survives the
// service worker going to sleep — which resets all in-memory state).

let lastActiveTabId = null;

/**
 * Records the given tab ID as the most recently active user tab.
 * Persists the value to chrome.storage.session so it survives service-worker restarts.
 * @param {number} tabId - The ID of the tab to record.
 * @returns {Promise<void>}
 */
async function setLastActiveTab(tabId) {
  lastActiveTabId = tabId;
  await chrome.storage.session.set({ lastActiveTabId: tabId });
}

/**
 * Returns the best tab ID to inject confetti into, using a three-tier fallback:
 * 1. In-memory cache (service worker is still warm).
 * 2. chrome.storage.session (service worker restarted but browser is still open).
 * 3. Any active non-chrome tab across all windows (last resort).
 * @returns {Promise<number|null>} The target tab ID, or null if none is found.
 */
async function getTargetTabId() {
  // 1 — in-memory (service worker is still warm)
  if (lastActiveTabId) return lastActiveTabId;

  // 2 — session storage (service worker restarted but browser is still open)
  const stored = await chrome.storage.session.get('lastActiveTabId');
  if (stored.lastActiveTabId) {
    lastActiveTabId = stored.lastActiveTabId; // restore in-memory cache
    return stored.lastActiveTabId;
  }

  // 3 — last resort: any active non-chrome tab across all windows
  const tabs = await chrome.tabs.query({ active: true });
  const webTab = tabs.find(t => t.url && !CHROME_URL_RE.test(t.url));
  return webTab?.id ?? null;
}

chrome.tabs.onActivated.addListener(({ tabId }) => {
  chrome.tabs.get(tabId, (tab) => {
    if (chrome.runtime.lastError) return;
    if (tab?.url && !CHROME_URL_RE.test(tab.url)) setLastActiveTab(tabId);
  });
});

// ── Core injection helper ──────────────────────────────────────────────────

/**
 * Injects content.js into the given tab (idempotent) and then calls
 * `window.__joshConfettiLaunch` with the provided settings.
 * Logs a warning if the injection fails (e.g. on a restricted page).
 * @param {number} tabId    - The ID of the tab to inject into.
 * @param {Object} settings - The confetti settings object to pass to the launch function.
 * @returns {Promise<void>}
 */
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

/**
 * Fires confetti one or more times on the given tab according to the repeat settings.
 * When `repeatMode` is `'repeated'`, fires up to 10 shots with 1.5 s gaps between them.
 * @param {number} tabId    - The ID of the tab to fire confetti on.
 * @param {Object} settings - The confetti settings object; uses `repeatMode` and `repeatCount`.
 * @returns {Promise<void>}
 */
async function fireWithRepeat(tabId, settings) {
  const shots = settings.repeatMode === 'repeated'
    ? Math.max(1, Math.min(10, settings.repeatCount || 3))
    : 1;

  for (let i = 0; i < shots; i++) {
    if (i > 0) await new Promise(r => setTimeout(r, 1500));
    await shootConfetti(tabId, settings);
  }
}

// ── Toolbar icon click → fire confetti ────────────────────────────────────

chrome.action.onClicked.addListener(async (tab) => {
  if (!tab.id || !tab.url) return;
  if (CHROME_URL_RE.test(tab.url)) return;

  const settings = await chrome.storage.sync.get(DEFAULT_SETTINGS);
  await fireWithRepeat(tab.id, settings);
});

// ── Keyboard shortcut handler ──────────────────────────────────────────────

chrome.commands.onCommand.addListener(async (command) => {
  if (command !== 'fire-confetti') return;
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (!tab?.id || !tab.url) return;
  if (CHROME_URL_RE.test(tab.url)) return;
  const settings = await chrome.storage.sync.get(DEFAULT_SETTINGS);
  await fireWithRepeat(tab.id, settings);
});

// ── Message listener ───────────────────────────────────────────────────────

chrome.runtime.onMessage.addListener((msg, sender) => {
  // options.html opened via right-click → Options; inject overlay on real page
  if (msg.action === 'openOverlay') {
    getTargetTabId().then(targetId => {
      if (!targetId) return;
      chrome.scripting.executeScript({ target: { tabId: targetId }, files: ['overlay.js'] })
        .catch(err => console.warn("Josh's Confetti 🎉:", err.message));
    });
  }

  // "Preview Fire" from overlay — current (possibly unsaved) settings
  if (msg.action === 'firePreview' && sender.tab?.id) {
    fireWithRepeat(sender.tab.id, msg.settings);
  }
});

// ── Tab update listener — URL triggers + lastActiveTabId upkeep ───────────

chrome.tabs.onUpdated.addListener(async (tabId, changeInfo, tab) => {
  if (changeInfo.status !== 'complete' || !tab.url) return;
  if (CHROME_URL_RE.test(tab.url)) return;

  // Keep lastActiveTabId current when the active tab finishes loading
  if (tab.active) setLastActiveTab(tabId);

  // URL trigger matching
  const { urlTriggers } = await chrome.storage.sync.get({ urlTriggers: [] });
  if (!urlTriggers?.length) return;

  for (const pattern of urlTriggers) {
    if (pattern?.trim() && tab.url.includes(pattern.trim())) {
      const settings = await chrome.storage.sync.get(DEFAULT_SETTINGS);
      await fireWithRepeat(tabId, settings);
      break;
    }
  }
});
