# 🎉 Josh's Confetti

> A Manifest V3 Chrome/Edge extension that fires celebratory confetti on any webpage.

![Josh's Confetti demo](joshsconfetti_v2_promo.gif)

---

## Features

- **12 confetti types** — Classic, Stars, Circles, Ribbons, Emoji, Hearts, Diamonds, Triangles, Snowflakes, Sparks, Coins, Teardrops
- **Density presets** — Low / Medium / High / Chaos
- **Size presets** — Tiny / Small / Medium / Large
- **7 explosion modes** — Bottom Up, Top Down, Center, Cannon L, Cannon R, Both Sides, Fireworks 🎆
- **Animation speed** — Slow / Steady / Normal / Fast / Ludicrous
- **Type-matched colors** — palette auto-updates to suit the selected confetti type
- **Sound effects** — mode-aware pop/whoosh/cannon boom/fireworks (optional, off by default)
- **URL triggers** — fire confetti automatically when a tab URL matches a pattern
- **Keyboard shortcut** — `⌘B` / `Ctrl+B` (customizable)
- **Repeat mode** — single shot or up to 10 repeated bursts

---

## Installation

1. Clone or download this repository
2. Go to `chrome://extensions`
3. Enable **Developer mode** (top right)
4. Click **Load unpacked** → select this directory
5. Click the 🎉 toolbar icon on any webpage to fire

---

## Usage

| Action | How |
|---|---|
| Fire confetti | Click the toolbar icon **or** press `⌘B` / `Ctrl+B` |
| Open settings | Right-click the toolbar icon → **Options** |
| Preview changes | Click **🎉 Preview Fire** inside the settings panel |
| Auto-fire on a URL | Add a pattern under **URL Triggers** and save |

---

## Settings

All settings are persisted in `chrome.storage.sync` and available across devices.

| Setting | Default |
|---|---|
| Confetti type | Classic |
| Density | Medium (500 particles) |
| Size | Large |
| Explosion mode | Fireworks |
| Animation speed | Normal |
| Repeat mode | Single |
| Sound effects | Off |

---

## Running Tests

No build step needed — tests run directly with Node.js:

```bash
node tests/run.js
```

162 assertions across manifest integrity, defaults consistency, all confetti types, all explosion modes, physics correctness, UI structure, and regression guards.

---

## Architecture

| File | Role |
|---|---|
| `background.js` | Service worker — handles clicks, keyboard shortcuts, URL triggers, and overlay injection |
| `content.js` | Physics engine — canvas, particle simulation, shape renderers, sound synthesis |
| `overlay.js` | Settings UI — Shadow DOM panel injected into the active page |
| `options.js` | Thin shim — immediately opens the overlay and closes the options page |
| `tests/run.js` | Full regression test suite |

---

## Version

**v2.0** — See [past chats](https://cursor.sh) for full change history.
