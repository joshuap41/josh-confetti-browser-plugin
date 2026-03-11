# Josh's Confetti 🎉

> Celebrate anything — launch confetti on any webpage with a single click.

---

## Loading in Chrome / Edge

1. Open Chrome and go to **`chrome://extensions`**
   *(Edge users: go to `edge://extensions`)*
2. Enable **Developer mode** using the toggle in the top-right corner
3. Click **"Load unpacked"**
4. Select the `josh-confetti-cannon` folder
5. The 🎉 icon will appear in your toolbar — **pin it** for easy access by clicking the puzzle piece icon and pinning *Josh's Confetti*

> To update after pulling new changes, return to `chrome://extensions` and click the **↺ refresh** icon on the extension card.

---

## Demo

Check out the trailer to see Josh's Confetti in action:

[Click here to watch the demo video](./joshs-confetti-trailer.mp4)

---

## What It Does

Click the 🎉 toolbar icon on any webpage to fire a burst of confetti. Right-click the icon → **Options** to configure everything.

---

## Settings

### Particle Count
Slider from 10 to 1,000 — controls how many confetti pieces are launched per shot.

### Particle Size
Slider from 3 to 50 — scales all confetti pieces up or down. A live preview updates as you drag.

### Confetti Type
| Type | Description |
|---|---|
| 📄 Classic | Rectangular paper pieces that tumble in 3D |
| ⭐ Stars | 5-pointed stars |
| 🔵 Circles | Simple filled dots |
| 🎀 Ribbons | Wavy sinusoidal streamers |
| 🥳 Emoji | Random celebration emoji (🎉🎊🌟🥳 and more) |

### Animation Direction
Controls gravity after launch — multiple can be selected at once:
- **⬇️ Fall Down** — normal gravity, pieces fall toward the bottom
- **⬆️ Rise Up** — reverse gravity, pieces float upward
- **🔀 Random** — each piece independently picks a direction

### Explosion Mode
Controls where confetti originates:
| Mode | Description |
|---|---|
| ⬆️ Bottom-Up | Ground burst, shoots upward like fireworks |
| ⬇️ Top-Down | Shower from above |
| 💥 Center | Radial burst from the middle of the page |
| ➡️ Cannon Left | Fires from the left edge |
| ⬅️ Cannon Right | Fires from the right edge |
| ↔️ Side-to-Side | Both sides fire simultaneously |

### Repeated Confetti
- **🎯 Single Shot** — one burst per click
- **🔁 Repeated** — fires multiple bursts in sequence (1–10 shots, 1.5 s apart). Shots layer on top of each other so particles from earlier bursts are still falling when the next one fires.

### Colors
A grid of color swatches used for all confetti pieces. Hover a swatch to delete it, click **+** to add any custom color via the color picker. Minimum 1, maximum 20 colors.

### URL Triggers
Add URL patterns (up to 10) to auto-fire confetti whenever you navigate to a matching page — great for checkout confirmations, sign-up success pages, or any celebration moment. Matching is a simple "contains" check against the full URL.

**Example patterns:**
```
checkout/success
/thank-you
order-confirmed
app.example.com/welcome
```

### Keyboard Shortcut
Set a keyboard shortcut to fire confetti without clicking the toolbar icon:
1. Copy the URL from the Options page (or type it manually): `chrome://extensions/shortcuts`
2. Paste it in the address bar and press Enter
3. Find **Josh's Confetti 🎉** and assign your preferred shortcut

---

## File Structure

```
josh-confetti-cannon/
├── manifest.json          Extension manifest (MV3)
├── background.js          Service worker — handles clicks, URL triggers, repeated firing
├── content.js             Confetti physics engine injected into pages
├── options.html           Settings page UI
├── options.css            Settings page styles
├── options.js             Settings page logic
├── generate_icons.py      Run once to regenerate PNG icons (no dependencies required)
├── joshs-confetti-trailer.mp4  Demo video
└── icons/
    ├── icon16.png
    ├── icon32.png
    ├── icon48.png
    └── icon128.png
```

---

## Regenerating Icons

Icons are already included. If you ever need to regenerate them:

```bash
python3 generate_icons.py
```

No external packages required — uses Python's built-in `struct` and `zlib` modules.
