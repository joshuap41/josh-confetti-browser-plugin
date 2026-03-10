# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What This Is

A Manifest V3 Chrome/Edge browser extension that fires confetti animations on any webpage. No build step, no dependencies, no package manager — all plain JavaScript loaded directly by the browser.

## Loading / Testing

Since there's no build process, "running" the extension means loading it unpacked in Chrome:

1. Go to `chrome://extensions`
2. Enable **Developer mode**
3. Click **Load unpacked** → select this directory
4. After any code change, click the **↺ refresh** icon on the extension card

To regenerate icons (rarely needed):
```bash
python3 generate_icons.py
```

## Architecture

The extension has three runtime contexts that cannot share variables directly:

### `background.js` — Service Worker
Runs persistently in the background. Handles:
- Toolbar icon clicks (`chrome.action.onClicked`)
- URL trigger matching (`chrome.tabs.onUpdated`) — fires confetti when a tab's URL matches a user-configured pattern
- Repeated-shot sequencing (fires `shootConfetti` up to 10× with 1.5 s gaps)
- Reads settings from `chrome.storage.sync` before each shot

Injection mechanism: `chrome.scripting.executeScript` first injects `content.js` (idempotent via guard), then calls `window.__joshConfettiLaunch(settings)` in the page context.

### `content.js` — Physics Engine (injected into pages)
Injected on demand into the active tab. Uses a top-level `if (!window.__joshConfettiDefined)` guard so repeated injections are safe. Maintains a single shared canvas (`__josh-confetti-canvas`, z-index max, pointer-events none) across repeated shots so particles accumulate.

Key internals:
- `window.__joshConfettiLaunch(settings)` — public entry point called by the service worker
- `createParticle(settings, W, H, colors)` — spawns a particle with initial position/velocity based on `explosionMode`
- `updateParticle(p, W, H)` — per-frame physics: gravity, drag (0.992), rotation, wobble, fade
- `drawParticle(ctx, p)` — dispatches to shape renderers: `drawClassic`, `drawStar`, `drawCircle`, `drawRibbon`, `drawEmoji`
- Canvas and particle array are torn down automatically when all particles die

### `options.html` / `options.js` / `options.css` — Settings UI
Opened via right-click → Options. Reads/writes `chrome.storage.sync`. The `current` object is the in-memory working state; settings are only persisted on explicit Save.

UI pattern: all settings are reflected to DOM via `reflect*()` functions on load, and listeners in `attachListeners()` mutate `current` in place. A live canvas preview (`renderPreview`) re-renders on particle size/type/color changes.

## Settings Schema (stored in `chrome.storage.sync`)

| Key | Type | Default |
|---|---|---|
| `confettiType` | `'classic'│'stars'│'circles'│'ribbons'│'emoji'` | `'classic'` |
| `particleCount` | number 1–1000 | 1000 |
| `particleSize` | number 3–50 | 35 |
| `explosionMode` | `'bottom-up'│'top-down'│'center'│'cannon-left'│'cannon-right'│'side-to-side'` | `'center'` |
| `animationDirection` | array of `'fall-down'│'rise-up'│'random'` | `['rise-up','random']` |
| `repeatMode` | `'single'│'repeated'` | `'repeated'` |
| `repeatCount` | number 1–10 | 2 |
| `colors` | array of hex strings (1–20) | 12 defaults |
| `urlTriggers` | array of strings (up to 10) | `[]` |

`DEFAULT_SETTINGS` / `DEFAULTS` / `DEFAULT_COLORS` are duplicated across all three JS files intentionally — each context needs its own copy since they can't share module state.
