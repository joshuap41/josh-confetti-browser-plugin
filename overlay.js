// Josh's Confetti 🎉 — Settings Overlay
// Injected into the active page. Uses Shadow DOM for full CSS isolation.

if (!window.__joshConfettiOverlayDefined) {
  window.__joshConfettiOverlayDefined = true;

  // ── Defaults ──────────────────────────────────────────────────────────────

  const DEFAULT_COLORS = [
    '#ff6b6b','#ffd93d','#6bcb77','#4d96ff',
    '#ff6bcd','#ff9f43','#a29bfe','#fd79a8',
    '#00cec9','#fdcb6e','#e17055','#74b9ff'
  ];

  const TYPE_COLORS = {
    classic:    ['#ff6b6b','#ffd93d','#6bcb77','#4d96ff','#ff6bcd','#ff9f43','#a29bfe','#fd79a8','#00cec9','#fdcb6e','#e17055','#74b9ff'],
    stars:      ['#ffd700','#ffec6e','#fff9c4','#ffa500','#ff8c00','#f9ca24','#fdcb6e','#ffeaa7','#e17055','#ffd93d'],
    circles:    ['#ff6b6b','#6bcb77','#4d96ff','#ffd93d','#a29bfe','#fd79a8','#00cec9','#ff9f43','#e17055','#74b9ff'],
    ribbons:    ['#ff6bcd','#a29bfe','#fd79a8','#4d96ff','#00cec9','#6bcb77','#ffd93d','#ff6b6b','#ff9f43','#74b9ff'],
    emoji:      ['#ff6b6b','#ffd93d','#6bcb77','#4d96ff','#ff6bcd','#ff9f43','#a29bfe','#fd79a8'],
    hearts:     ['#ff4757','#ff6b81','#ff8fa3','#dd0000','#ff69b4','#ff1493','#c0392b','#e84393','#f06292','#ff85a1'],
    diamonds:   ['#74b9ff','#a29bfe','#00cec9','#dfe6e9','#81ecec','#6c5ce7','#48dbfb','#0984e3','#b2bec3','#c8d6e5'],
    triangles:  ['#ff6b6b','#ffd93d','#6bcb77','#4d96ff','#ff9f43','#a29bfe','#00cec9','#fd79a8','#e17055','#74b9ff'],
    snowflakes: ['#dfe6e9','#b2bec3','#74b9ff','#81ecec','#a8d8ea','#d4e6f1','#aed6f1','#85c1e9','#c8d6e5','#e8f4f8'],
    sparks:     ['#ffd700','#fff9c4','#ff8c00','#ffec6e','#ffa500','#ff4500','#ffeaa7','#fdcb6e','#e17055','#ff6348'],
    coins:      ['#ffd700','#d4a017','#f0c040','#ffec6e','#b8860b','#daa520','#c8a000','#e8b800','#f8c800','#ffa500'],
    teardrops:  ['#4d96ff','#00cec9','#74b9ff','#81ecec','#a29bfe','#6c5ce7','#0984e3','#48dbfb','#00b894','#55efc4'],
  };

  const DENSITY_PRESETS = { low: 150, medium: 500, high: 1500, chaos: 4000 };
  const SIZE_PRESETS    = { tiny: 8, small: 18, medium: 35, large: 50 };
  const SPEED_PRESETS   = { slow: 0.05, steady: 0.1, normal: 0.2, fast: 0.3, ludicrous: 0.4 };

  const DEFAULTS = {
    confettiType:   'classic',
    particleCount:  500,
    particleSize:   50,
    animationSpeed: 0.2,
    explosionMode:  'fireworks',
    repeatMode:     'single',
    repeatCount:    2,
    colors:         [...DEFAULT_COLORS],
    urlTriggers:    [],
    soundEnabled:   false
  };

  // ── Shadow DOM CSS ─────────────────────────────────────────────────────────

  const CSS = `
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

    :host { all: initial; }

    .backdrop {
      position: fixed; inset: 0; z-index: 2147483646;
      background: rgba(0,0,0,0.35);
      display: flex; align-items: center; justify-content: center;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      font-size: 13px; line-height: 1.5; color: #e8e8f0;
    }

    .panel {
      background: #0f0f1a;
      border: 1px solid rgba(255,255,255,0.1);
      border-radius: 16px;
      width: 420px;
      max-height: 88vh;
      display: flex; flex-direction: column;
      overflow: hidden;
      box-shadow: 0 24px 64px rgba(0,0,0,0.7);
    }

    .panel-header {
      display: flex; align-items: center; justify-content: space-between;
      padding: 14px 16px 10px;
      border-bottom: 1px solid rgba(255,255,255,0.07);
      flex-shrink: 0;
    }

    .panel-title {
      font-size: 15px; font-weight: 700; letter-spacing: -0.01em;
      background: linear-gradient(90deg, #a29bfe, #fd79a8, #ffd93d, #6bcb77, #a29bfe);
      background-size: 300% auto;
      -webkit-background-clip: text; -webkit-text-fill-color: transparent;
      background-clip: text;
      animation: shimmer 4s linear infinite;
    }
    @keyframes shimmer { to { background-position: 300% center; } }

    .close-btn {
      background: transparent; border: none; cursor: pointer;
      color: #888; font-size: 16px; line-height: 1;
      padding: 4px 6px; border-radius: 6px;
      transition: color 0.12s, background 0.12s;
    }
    .close-btn:hover { color: #fff; background: rgba(255,255,255,0.08); }

    .panel-body {
      overflow-y: auto; padding: 12px 14px 16px;
      display: flex; flex-direction: column; gap: 10px;
      scrollbar-width: thin; scrollbar-color: rgba(255,255,255,0.15) transparent;
    }

    .action-row { display: flex; gap: 8px; }
    .btn-action {
      flex: 1; padding: 13px;
      border-radius: 999px; border: none;
      color: #fff; font-size: 14px; font-weight: 800;
      cursor: pointer; letter-spacing: 0.02em;
      transition: opacity 0.12s, transform 0.12s, box-shadow 0.12s;
    }
    .btn-action:hover  { opacity: 0.9; transform: translateY(-1px); }
    .btn-action:active { transform: translateY(0); }
    .btn-fire {
      background: linear-gradient(90deg, #a29bfe, #fd79a8);
      box-shadow: 0 4px 20px rgba(162,155,254,0.4);
    }
    .btn-fire:hover { box-shadow: 0 6px 26px rgba(162,155,254,0.5); }
    .btn-save {
      background: linear-gradient(90deg, #6bcb77, #00cec9);
      box-shadow: 0 4px 20px rgba(107,203,119,0.3);
    }
    .btn-save:hover { box-shadow: 0 6px 26px rgba(107,203,119,0.4); }
    .save-feedback { font-size: 11px; font-weight: 500; color: #6bcb77; opacity: 0; transition: opacity 0.3s; text-align: center; }
    .save-feedback.visible { opacity: 1; }

    .version-tag {
      font-size: 10px; font-weight: 600; color: #8888aa;
      background: rgba(255,255,255,0.06); border-radius: 4px;
      padding: 2px 7px; letter-spacing: 0.06em; flex-shrink: 0;
    }

    .card {
      background: #1a1a2e;
      border: 1px solid rgba(255,255,255,0.07);
      border-radius: 11px; padding: 12px;
      display: flex; flex-direction: column; gap: 9px;
    }

    .card-title {
      font-size: 10px; font-weight: 700; text-transform: uppercase;
      letter-spacing: 0.1em; color: #8888aa;
    }

    .row { display: flex; justify-content: space-between; align-items: baseline; }
    .slider-label { font-size: 11px; color: #8888aa; }
    .val { font-size: 12px; font-weight: 700; color: #a29bfe; }

    input[type="range"] {
      -webkit-appearance: none; appearance: none;
      width: 100%; height: 4px; border-radius: 2px;
      background: #16213e; outline: none; cursor: pointer;
    }
    input[type="range"]::-webkit-slider-thumb {
      -webkit-appearance: none; width: 14px; height: 14px;
      border-radius: 50%; background: #a29bfe; cursor: pointer;
      box-shadow: 0 0 0 3px rgba(162,155,254,0.22);
    }

    .preview-wrap {
      background: #16213e; border: 1px solid rgba(255,255,255,0.07);
      border-radius: 7px; overflow: hidden;
    }
    canvas { display: block; width: 100%; height: 50px; }

    .pill-group { display: flex; flex-wrap: wrap; gap: 6px; }
    .pill {
      display: inline-flex; align-items: center; gap: 4px;
      padding: 5px 11px; border-radius: 999px;
      border: 1.5px solid rgba(255,255,255,0.08);
      background: #16213e; color: #e8e8f0; cursor: pointer;
      font-size: 11px; font-weight: 500; white-space: nowrap;
      transition: border-color 0.12s, background 0.12s;
    }
    .pill:hover { border-color: #a29bfe; }
    .pill.active { border-color: #a29bfe; background: rgba(162,155,254,0.18); color: #fff; }

    .mode-grid {
      display: grid; grid-template-columns: repeat(4, 1fr); gap: 6px;
    }
    .mode-btn {
      display: flex; flex-direction: column; align-items: center; gap: 2px;
      padding: 8px 4px; border-radius: 8px;
      border: 1.5px solid rgba(255,255,255,0.08);
      background: #16213e; color: #e8e8f0; cursor: pointer;
      transition: border-color 0.12s, background 0.12s, transform 0.12s;
    }
    .mode-btn:hover { border-color: #fd79a8; transform: translateY(-1px); }
    .mode-btn.active { border-color: #a29bfe; background: rgba(162,155,254,0.18); }
    .mode-arrow { font-size: 16px; line-height: 1; }
    .mode-name { font-size: 9px; font-weight: 600; text-align: center; }

    .repeat-count-row { display: none; flex-direction: column; gap: 7px; padding-top: 9px; border-top: 1px solid rgba(255,255,255,0.07); }
    .repeat-count-row.visible { display: flex; }

    .swatch-grid { display: flex; flex-wrap: wrap; gap: 6px; }
    .swatch {
      width: 34px; height: 34px; border-radius: 7px; cursor: pointer;
      border: 2px solid rgba(255,255,255,0.05); flex-shrink: 0; position: relative;
      transition: transform 0.12s, border-color 0.12s;
    }
    .swatch:hover { transform: scale(1.1); border-color: rgba(255,255,255,0.4); }
    .swatch-x {
      position: absolute; inset: 0; display: flex; align-items: center; justify-content: center;
      font-size: 13px; font-weight: 700; color: #fff; opacity: 0;
      background: rgba(0,0,0,0.4); border-radius: 5px;
      transition: opacity 0.12s;
    }
    .swatch:hover .swatch-x { opacity: 1; }
    .swatch-add {
      width: 34px; height: 34px; border-radius: 7px;
      border: 2px dashed #8888aa; background: transparent;
      color: #8888aa; font-size: 18px; cursor: pointer;
      display: flex; align-items: center; justify-content: center;
      transition: border-color 0.12s, color 0.12s;
    }
    .swatch-add:hover { border-color: #a29bfe; color: #a29bfe; }

    .swatch-reset {
      padding: 0 12px; height: 34px; border-radius: 7px;
      border: 1.5px solid rgba(253,203,110,0.4); background: transparent;
      color: #fdcb6e; font-size: 11px; font-weight: 600; cursor: pointer;
      white-space: nowrap; align-self: center;
      transition: border-color 0.12s, background 0.12s;
    }
    .swatch-reset:hover { border-color: #fdcb6e; background: rgba(253,203,110,0.1); }

    .trigger-list { display: flex; flex-direction: column; gap: 6px; }
    .trigger-row { display: flex; gap: 6px; align-items: center; }
    .trigger-input {
      flex: 1; background: #16213e; border: 1.5px solid rgba(255,255,255,0.08);
      border-radius: 7px; color: #e8e8f0; padding: 6px 10px; font-size: 11px; outline: none;
      transition: border-color 0.12s;
    }
    .trigger-input:focus { border-color: #a29bfe; }
    .trigger-input::placeholder { color: #8888aa; }
    .trigger-del {
      width: 28px; height: 28px; border-radius: 7px;
      border: 1.5px solid rgba(255,255,255,0.08); background: transparent;
      color: #8888aa; cursor: pointer; font-size: 13px;
      display: flex; align-items: center; justify-content: center;
      transition: border-color 0.12s, color 0.12s;
    }
    .trigger-del:hover { border-color: #ff6b6b; color: #ff6b6b; }
    .btn-add-url {
      align-self: flex-start; padding: 5px 12px; border-radius: 7px;
      border: 1.5px solid #a29bfe; background: transparent;
      color: #a29bfe; cursor: pointer; font-size: 11px; font-weight: 600;
      transition: background 0.12s;
    }
    .btn-add-url:hover { background: rgba(162,155,254,0.12); }

    kbd {
      background: #16213e; border: 1.5px solid rgba(255,255,255,0.18);
      border-radius: 4px; padding: 1px 7px; font-size: 10px;
      font-family: monospace; color: #a29bfe; white-space: nowrap;
    }
    .shortcut-hint { font-size: 11px; color: #8888aa; line-height: 1.8; }

    .toggle-row { display: flex; align-items: center; justify-content: space-between; }
    .toggle { position: relative; display: inline-block; width: 36px; height: 20px; flex-shrink: 0; }
    .toggle input { opacity: 0; width: 0; height: 0; position: absolute; }
    .toggle-track {
      position: absolute; inset: 0; border-radius: 20px;
      background: #16213e; border: 1.5px solid rgba(255,255,255,0.15);
      transition: background 0.2s, border-color 0.2s; cursor: pointer;
    }
    .toggle-track::after {
      content: ''; position: absolute; width: 14px; height: 14px;
      border-radius: 50%; background: #8888aa; top: 2px; left: 2px;
      transition: transform 0.2s, background 0.2s;
    }
    .toggle input:checked + .toggle-track { background: rgba(162,155,254,0.3); border-color: #a29bfe; }
    .toggle input:checked + .toggle-track::after { transform: translateX(16px); background: #a29bfe; }
    .hint-text { font-size: 10px; color: #8888aa; line-height: 1.5; margin-top: 2px; }

  `;

  // ── Shadow DOM HTML ────────────────────────────────────────────────────────

  const HTML = `
    <div class="backdrop" id="backdrop">
      <div class="panel" id="panel">
        <div class="panel-header">
          <span class="panel-title">🎉 Josh's Confetti</span>
          <div style="display:flex;align-items:center;gap:8px;flex-shrink:0">
            <span class="version-tag">v2.0</span>
            <button class="close-btn" id="close-btn">✕</button>
          </div>
        </div>
        <div class="panel-body">
          <div class="action-row">
            <button class="btn-action btn-save" id="save-btn">💾 Save Settings</button>
            <button class="btn-action btn-fire" id="fire-btn">🎉 Preview Fire</button>
          </div>
          <span class="save-feedback" id="save-feedback">Saved ✓</span>

          <div class="card">
            <span class="card-title">Density Preset</span>
            <div class="pill-group">
              <button class="pill" data-value="low"    data-group="densityPreset">🌤 Low</button>
              <button class="pill" data-value="medium" data-group="densityPreset">🌥 Medium</button>
              <button class="pill" data-value="high"   data-group="densityPreset">⛅ High</button>
              <button class="pill" data-value="chaos"  data-group="densityPreset">🌪 Chaos</button>
            </div>
          </div>

          <div class="card">
            <span class="card-title">Particle Size</span>
            <div class="pill-group">
              <button class="pill" data-value="tiny"   data-group="sizePreset">🔹 Tiny</button>
              <button class="pill" data-value="small"  data-group="sizePreset">🔸 Small</button>
              <button class="pill" data-value="medium" data-group="sizePreset">⬛ Medium</button>
              <button class="pill" data-value="large"  data-group="sizePreset">🟥 Large</button>
            </div>
            <div class="preview-wrap">
              <canvas id="size-preview" width="392" height="50"></canvas>
            </div>
          </div>

          <div class="card">
            <span class="card-title">Confetti Type</span>
            <div class="pill-group">
              <button class="pill" data-value="classic"    data-group="confettiType">📄 Classic</button>
              <button class="pill" data-value="stars"      data-group="confettiType">⭐ Stars</button>
              <button class="pill" data-value="circles"    data-group="confettiType">🔵 Circles</button>
              <button class="pill" data-value="ribbons"    data-group="confettiType">🎀 Ribbons</button>
              <button class="pill" data-value="emoji"      data-group="confettiType">🥳 Emoji</button>
              <button class="pill" data-value="hearts"     data-group="confettiType">❤️ Hearts</button>
              <button class="pill" data-value="diamonds"   data-group="confettiType">💎 Diamonds</button>
              <button class="pill" data-value="triangles"  data-group="confettiType">🔺 Triangles</button>
              <button class="pill" data-value="snowflakes" data-group="confettiType">❄️ Snowflakes</button>
              <button class="pill" data-value="sparks"     data-group="confettiType">✨ Sparks</button>
              <button class="pill" data-value="coins"      data-group="confettiType">🪙 Coins</button>
              <button class="pill" data-value="teardrops"  data-group="confettiType">💧 Teardrops</button>
            </div>
          </div>

          <div class="card">
            <span class="card-title">Explosion Mode</span>
            <div class="mode-grid">
              <button class="mode-btn" data-value="bottom-up"    data-group="explosionMode"><span class="mode-arrow">⬆️</span><span class="mode-name">Bottom Up</span></button>
              <button class="mode-btn" data-value="top-down"     data-group="explosionMode"><span class="mode-arrow">⬇️</span><span class="mode-name">Top Down</span></button>
              <button class="mode-btn" data-value="center"       data-group="explosionMode"><span class="mode-arrow">💥</span><span class="mode-name">Center</span></button>
              <button class="mode-btn" data-value="cannon-left"  data-group="explosionMode"><span class="mode-arrow">➡️</span><span class="mode-name">Cannon L</span></button>
              <button class="mode-btn" data-value="cannon-right" data-group="explosionMode"><span class="mode-arrow">⬅️</span><span class="mode-name">Cannon R</span></button>
              <button class="mode-btn" data-value="side-to-side" data-group="explosionMode"><span class="mode-arrow">↔️</span><span class="mode-name">Both Sides</span></button>
              <button class="mode-btn" data-value="fireworks"    data-group="explosionMode"><span class="mode-arrow">🎆</span><span class="mode-name">Fireworks</span></button>
            </div>
          </div>

          <div class="card">
            <span class="card-title">Animation Speed</span>
            <div class="pill-group">
              <button class="pill" data-value="slow"      data-group="speedPreset">🐌 Slow</button>
              <button class="pill" data-value="steady"    data-group="speedPreset">🐢 Steady</button>
              <button class="pill" data-value="normal"    data-group="speedPreset">🚶 Normal</button>
              <button class="pill" data-value="fast"      data-group="speedPreset">🏃 Fast</button>
              <button class="pill" data-value="ludicrous" data-group="speedPreset">⚡ Ludicrous</button>
            </div>
          </div>

          <div class="card">
            <div class="toggle-row">
              <span class="card-title">Sound Effects</span>
              <label class="toggle">
                <input type="checkbox" id="sound-enabled" />
                <span class="toggle-track"></span>
              </label>
            </div>
            <p class="hint-text">Play a pop/whoosh sound when confetti fires</p>
          </div>

          <div class="card">
            <span class="card-title">Repeat Mode</span>
            <div class="pill-group">
              <button class="pill" data-value="single"   data-group="repeatMode">🎯 Single</button>
              <button class="pill" data-value="repeated" data-group="repeatMode">🔁 Repeated</button>
            </div>
            <div class="repeat-count-row" id="repeat-count-row">
              <div class="row">
                <span class="slider-label">Repeat count</span>
                <span class="val" id="repeat-count-val">2</span>
              </div>
              <input type="range" id="repeat-count" min="1" max="10" step="1" value="2" />
            </div>
          </div>

          <div class="card">
            <span class="card-title">Colors</span>
            <div id="color-swatches" class="swatch-grid"></div>
            <input type="color" id="color-picker" tabindex="-1"
                   style="visibility:hidden;position:absolute;width:0;height:0;padding:0;border:none" />
          </div>

          <div class="card">
            <span class="card-title">URL Triggers</span>
            <div id="trigger-list" class="trigger-list"></div>
            <button class="btn-add-url" id="add-trigger-btn">+ Add URL</button>
          </div>

          <div class="card">
            <span class="card-title">Keyboard Shortcut</span>
            <p class="shortcut-hint">
              Default: <kbd>⌘ B</kbd> Mac &nbsp;·&nbsp; <kbd>Ctrl+B</kbd> Win/Linux<br>
              Customize at <kbd>chrome://extensions/shortcuts</kbd>
            </p>
          </div>

        </div>
      </div>
    </div>
  `;

  // ── Mount ──────────────────────────────────────────────────────────────────

  const host = document.createElement('div');
  host.id = '__josh-confetti-overlay-host';
  document.documentElement.appendChild(host);

  const shadow = host.attachShadow({ mode: 'closed' });
  const style  = document.createElement('style');
  style.textContent = CSS;
  shadow.appendChild(style);

  const wrapper = document.createElement('div');
  wrapper.innerHTML = HTML;
  shadow.appendChild(wrapper);

  const root = shadow.getElementById('backdrop');
  root.style.display = 'none';

  // ── State ──────────────────────────────────────────────────────────────────

  let current = { ...DEFAULTS };

  // ── Helpers ────────────────────────────────────────────────────────────────

  /**
   * Convenience wrapper around `shadow.getElementById`.
   * @param {string} id - The element ID to look up within the shadow root.
   * @returns {Element|null} The matching element, or null if not found.
   */
  function $(id) { return shadow.getElementById(id); }

  /**
   * Sets a range slider's value, updates its displayed label, and refreshes the
   * gradient fill to reflect the new thumb position.
   * @param {string}         id    - The base ID of the slider element (label ID is `${id}-val`).
   * @param {number}         value - The value to apply to the slider.
   * @param {Function|null}  fmt   - Optional formatter function for the displayed label text.
   */
  function setSlider(id, value, fmt) {
    const slider = $(id);
    const valEl  = $(`${id}-val`);
    if (!slider) return;
    slider.value = value;
    if (valEl) valEl.textContent = fmt ? fmt(value) : value;
    updateFill(slider);
  }

  /**
   * Updates the CSS gradient background of a range slider to visually fill
   * the track up to the current thumb position.
   * @param {HTMLInputElement} slider - The range input element to update.
   */
  function updateFill(slider) {
    const pct = ((slider.value - slider.min) / (slider.max - slider.min)) * 100;
    slider.style.background =
      `linear-gradient(to right, #a29bfe ${pct}%, #16213e ${pct}%)`;
  }

  // ── Reflect ────────────────────────────────────────────────────────────────

  /**
   * Syncs every UI control in the panel to the current in-memory settings state.
   * Should be called after loading settings or performing a bulk state update.
   */
  function reflectAll() {
    // Pill / mode buttons
    ['confettiType','explosionMode','repeatMode'].forEach(group => {
      shadow.querySelectorAll(`[data-group="${group}"]`).forEach(btn => {
        btn.classList.toggle('active', btn.dataset.value === current[group]);
      });
    });
    setSlider('repeat-count', current.repeatCount);
    reflectDensityPreset();
    reflectSizePreset();
    reflectSpeedPreset();
    reflectRepeatRow();
    reflectSwatches();
    reflectTriggers();
    const soundEl = $('sound-enabled');
    if (soundEl) soundEl.checked = !!current.soundEnabled;
    renderPreview();
  }

  /**
   * Highlights the density preset pill whose particle count matches `current.particleCount`,
   * or clears all highlights if no preset matches.
   */
  function reflectDensityPreset() {
    const activePreset = Object.entries(DENSITY_PRESETS).find(([, v]) => v === current.particleCount)?.[0] ?? null;
    shadow.querySelectorAll('[data-group="densityPreset"]').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.value === activePreset);
    });
  }

  /**
   * Highlights the size preset pill whose particle size matches `current.particleSize`,
   * or clears all highlights if no preset matches.
   */
  function reflectSizePreset() {
    const activePreset = Object.entries(SIZE_PRESETS).find(([, v]) => v === current.particleSize)?.[0] ?? null;
    shadow.querySelectorAll('[data-group="sizePreset"]').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.value === activePreset);
    });
  }

  /**
   * Highlights the speed preset pill whose animation speed matches `current.animationSpeed`,
   * or clears all highlights if no preset matches.
   */
  function reflectSpeedPreset() {
    const activePreset = Object.entries(SPEED_PRESETS).find(([, v]) => v === current.animationSpeed)?.[0] ?? null;
    shadow.querySelectorAll('[data-group="speedPreset"]').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.value === activePreset);
    });
  }

  /**
   * Shows or hides the repeat-count slider row based on whether `current.repeatMode`
   * is set to `'repeated'`.
   */
  function reflectRepeatRow() {
    $('repeat-count-row').classList.toggle('visible', current.repeatMode === 'repeated');
  }

  /**
   * Returns true if `current.colors` exactly matches the default color palette.
   * @returns {boolean}
   */
  function colorsAreDefault() {
    if (current.colors.length !== DEFAULT_COLORS.length) return false;
    return current.colors.every((c, i) => c === DEFAULT_COLORS[i]);
  }

  /**
   * Returns true if `current.colors` exactly matches the type-specific palette
   * for the currently selected confetti type.
   * @returns {boolean}
   */
  function colorsMatchType() {
    const typeColors = TYPE_COLORS[current.confettiType];
    if (!typeColors || typeColors.length !== current.colors.length) return false;
    return current.colors.every((c, i) => c === typeColors[i]);
  }

  /**
   * Rebuilds the color swatch grid from `current.colors`.
   * Renders one swatch per color (with a click-to-remove × button), a + add button,
   * and optional "Type Colors" / "Default" reset buttons when the palette has drifted.
   */
  function reflectSwatches() {
    const grid = $('color-swatches');
    grid.innerHTML = '';
    current.colors.forEach((hex, i) => {
      const sw = document.createElement('div');
      sw.className = 'swatch';
      sw.style.backgroundColor = hex;
      const x = document.createElement('span');
      x.className = 'swatch-x'; x.textContent = '✕';
      sw.appendChild(x);
      sw.addEventListener('click', () => {
        if (current.colors.length <= 1) return;
        current.colors.splice(i, 1);
        reflectSwatches(); renderPreview();
      });
      grid.appendChild(sw);
    });
    const addBtn = document.createElement('button');
    addBtn.className = 'swatch-add'; addBtn.textContent = '+';
    addBtn.addEventListener('click', () => {
      if (current.colors.length < 20) $('color-picker').click();
    });
    grid.appendChild(addBtn);

    const typeColors = TYPE_COLORS[current.confettiType];
    if (typeColors && !colorsMatchType()) {
      const typeBtn = document.createElement('button');
      typeBtn.className = 'swatch-reset';
      typeBtn.textContent = '↺ Type Colors';
      typeBtn.title = `Restore ${current.confettiType} palette`;
      typeBtn.addEventListener('click', () => {
        current.colors = [...typeColors];
        reflectSwatches(); renderPreview();
      });
      grid.appendChild(typeBtn);
    }

    if (!colorsAreDefault()) {
      const resetBtn = document.createElement('button');
      resetBtn.className = 'swatch-reset';
      resetBtn.textContent = '↺ Default';
      resetBtn.title = 'Restore all default colors';
      resetBtn.addEventListener('click', () => {
        current.colors = [...DEFAULT_COLORS];
        reflectSwatches(); renderPreview();
      });
      grid.appendChild(resetBtn);
    }
  }

  /**
   * Rebuilds the URL trigger list UI from `current.urlTriggers`, then syncs the
   * "Add URL" button's disabled state.
   */
  function reflectTriggers() {
    const list = $('trigger-list');
    list.innerHTML = '';
    current.urlTriggers.forEach((url, i) => addTriggerRow(url, i));
    syncAddBtn();
  }

  /**
   * Appends a new URL trigger row (text input + delete button) to the trigger list.
   * The input's `input` event syncs changes back to `current.urlTriggers`; the
   * delete button removes the entry from both the DOM and the array.
   * @param {string} [value=''] - Initial value to pre-fill in the text input.
   */
  function addTriggerRow(value = '') {
    const list = $('trigger-list');
    const row   = document.createElement('div');  row.className = 'trigger-row';
    const input = document.createElement('input'); input.type = 'text'; input.className = 'trigger-input';
    input.placeholder = 'e.g. checkout/success'; input.value = value;
    input.addEventListener('input', () => {
      const idx = Array.from(list.children).indexOf(row);
      if (idx >= 0) current.urlTriggers[idx] = input.value;
    });
    const del = document.createElement('button'); del.className = 'trigger-del'; del.textContent = '✕';
    del.addEventListener('click', () => {
      const idx = Array.from(list.children).indexOf(row);
      if (idx >= 0) current.urlTriggers.splice(idx, 1);
      row.remove(); syncAddBtn();
    });
    row.appendChild(input); row.appendChild(del); list.appendChild(row);
  }

  /**
   * Disables the "Add URL" button when the maximum of 10 triggers has been reached.
   */
  function syncAddBtn() {
    $('add-trigger-btn').disabled = current.urlTriggers.length >= 10;
  }

  // ── Preview ────────────────────────────────────────────────────────────────

  /**
   * Renders a static preview of the current particle type and size into the
   * size-preview canvas. Shows 7 sample particles spread across the canvas width,
   * drawn using inline shape logic that mirrors the content-script renderers.
   */
  function renderPreview() {
    const canvas = $('size-preview');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const W = canvas.width, H = canvas.height;
    ctx.clearRect(0, 0, W, H);
    ctx.fillStyle = '#16213e'; ctx.fillRect(0, 0, W, H);
    const sz = current.particleSize, type = current.confettiType;
    const colors = current.colors.length ? current.colors : DEFAULT_COLORS;
    const count = 7;
    for (let i = 0; i < count; i++) {
      const x = 20 + (i * (W - 40)) / (count - 1);
      const y = H / 2 + Math.sin(i * 1.1) * 6;
      const rot = (i - 3) * 0.28;
      const s = sz * (0.7 + (i % 3) * 0.15);
      ctx.save(); ctx.translate(x, y); ctx.rotate(rot);
      ctx.fillStyle = colors[i % colors.length];
      ctx.strokeStyle = ctx.fillStyle; ctx.globalAlpha = 0.92;
      if (type === 'circles') {
        ctx.beginPath(); ctx.arc(0, 0, s * 0.5, 0, Math.PI * 2); ctx.fill();
      } else if (type === 'stars') {
        const R = s * 0.55, ir = R * 0.42;
        ctx.beginPath();
        for (let j = 0; j < 5; j++) {
          const a = (j * 2 * Math.PI) / 5 - Math.PI / 2, ia = a + Math.PI / 5;
          j === 0 ? ctx.moveTo(Math.cos(a)*R, Math.sin(a)*R) : ctx.lineTo(Math.cos(a)*R, Math.sin(a)*R);
          ctx.lineTo(Math.cos(ia)*ir, Math.sin(ia)*ir);
        }
        ctx.closePath(); ctx.fill();
      } else if (type === 'ribbons') {
        ctx.lineWidth = 2.5; ctx.lineCap = 'round';
        const len = s * 2.2;
        ctx.beginPath();
        for (let j = 0; j <= len; j++) {
          const rx = j - len*0.5, ry = Math.sin(i + j*0.28) * 4;
          j === 0 ? ctx.moveTo(rx, ry) : ctx.lineTo(rx, ry);
        }
        ctx.stroke();
      } else if (type === 'emoji') {
        ctx.font = `${Math.round(s * 1.6)}px serif`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
        ctx.globalAlpha = 1;
        ctx.fillText(['🎉','🎊','🌟','🎈','✨','💫','🥳'][i % 7], 0, 0);
      } else if (type === 'hearts') {
        const hs = s * 0.5;
        ctx.beginPath();
        ctx.moveTo(0, hs * 0.35);
        ctx.bezierCurveTo( hs,       -hs * 0.6,  hs * 1.8,  hs * 0.5, 0, hs * 1.3);
        ctx.bezierCurveTo(-hs * 1.8,  hs * 0.5, -hs,       -hs * 0.6, 0, hs * 0.35);
        ctx.closePath(); ctx.fill();
      } else if (type === 'diamonds') {
        const ds = s * 0.55;
        ctx.beginPath();
        ctx.moveTo(0, -ds); ctx.lineTo(ds * 0.62, 0);
        ctx.lineTo(0, ds);  ctx.lineTo(-ds * 0.62, 0);
        ctx.closePath(); ctx.fill();
      } else if (type === 'triangles') {
        const ts = s * 0.6;
        ctx.beginPath();
        ctx.moveTo(0, -ts); ctx.lineTo(ts * 0.866, ts * 0.5); ctx.lineTo(-ts * 0.866, ts * 0.5);
        ctx.closePath(); ctx.fill();
      } else if (type === 'snowflakes') {
        ctx.lineWidth = Math.max(1, s * 0.1); ctx.lineCap = 'round';
        const sr = s * 0.52;
        for (let j = 0; j < 6; j++) {
          const a = (j * Math.PI) / 3, ax = Math.cos(a) * sr, ay = Math.sin(a) * sr;
          ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(ax, ay); ctx.stroke();
          const bx = ax * 0.6, by = ay * 0.6, ba = a + Math.PI / 2, bl = sr * 0.3;
          ctx.beginPath();
          ctx.moveTo(bx + Math.cos(ba) * bl, by + Math.sin(ba) * bl);
          ctx.lineTo(bx - Math.cos(ba) * bl, by - Math.sin(ba) * bl);
          ctx.stroke();
        }
      } else if (type === 'sparks') {
        const R = s * 0.56, ir = R * 0.18;
        ctx.beginPath();
        for (let j = 0; j < 4; j++) {
          const a = (j * Math.PI) / 2 - Math.PI / 4, ia = a + Math.PI / 4;
          j === 0 ? ctx.moveTo(Math.cos(a)*R, Math.sin(a)*R) : ctx.lineTo(Math.cos(a)*R, Math.sin(a)*R);
          ctx.lineTo(Math.cos(ia)*ir, Math.sin(ia)*ir);
        }
        ctx.closePath(); ctx.fill();
      } else if (type === 'coins') {
        const rx = s * 0.45 * Math.max(0.15, Math.abs(Math.cos(i * 0.6)));
        ctx.beginPath(); ctx.ellipse(0, 0, rx, s * 0.45, 0, 0, Math.PI * 2); ctx.fill();
      } else if (type === 'teardrops') {
        const ts = s * 0.5;
        ctx.beginPath();
        ctx.arc(0, -ts * 0.3, ts * 0.65, Math.PI, 0);
        ctx.bezierCurveTo( ts * 0.65,  ts * 0.2,  ts * 0.2,  ts * 1.0, 0, ts * 1.1);
        ctx.bezierCurveTo(-ts * 0.2,   ts * 1.0, -ts * 0.65, ts * 0.2, -ts * 0.65, -ts * 0.3);
        ctx.closePath(); ctx.fill();
      } else {
        const w = s * Math.abs(Math.cos(i * 0.6)), h = s * 0.45;
        ctx.fillRect(-w*0.5, -h*0.5, w, h);
      }
      ctx.restore();
    }
  }

  // ── Listeners ──────────────────────────────────────────────────────────────

  /**
   * Attaches all event listeners to the overlay's interactive elements.
   * Handles close/backdrop clicks, Escape key, pill/mode button selection,
   * slider input, color picker, URL trigger management, sound toggle, and save.
   */
  function attachListeners() {
    // Close
    $('close-btn').addEventListener('click', () => window.__joshConfettiOverlay.hide());
    $('backdrop').addEventListener('click', e => {
      if (e.target === $('backdrop')) window.__joshConfettiOverlay.hide();
    });

    // Escape key — only acts when overlay is visible
    document.addEventListener('keydown', e => {
      if (e.key === 'Escape' && root.style.display !== 'none') window.__joshConfettiOverlay.hide();
    });

    // Preview Fire — fires confetti behind the overlay, overlay stays open
    $('fire-btn').addEventListener('click', () => {
      chrome.runtime.sendMessage({ action: 'firePreview', settings: current });
    });

    // Pill / mode buttons (including density presets and type-based color auto-apply)
    shadow.querySelectorAll('[data-group]').forEach(btn => {
      btn.addEventListener('click', () => {
        const { group, value } = btn.dataset;

        // Density presets — drives particleCount
        if (group === 'densityPreset') {
          const count = DENSITY_PRESETS[value];
          if (!count) return;
          current.particleCount = count;
          reflectDensityPreset();
          return;
        }

        // Size presets — drives particleSize
        if (group === 'sizePreset') {
          const size = SIZE_PRESETS[value];
          if (!size) return;
          current.particleSize = size;
          reflectSizePreset();
          renderPreview();
          return;
        }

        // Speed presets — drives animationSpeed
        if (group === 'speedPreset') {
          const speed = SPEED_PRESETS[value];
          if (!speed) return;
          current.animationSpeed = speed;
          reflectSpeedPreset();
          return;
        }

        if (!(group in current)) return;
        shadow.querySelectorAll(`[data-group="${group}"]`).forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        current[group] = value;
        if (group === 'repeatMode') reflectRepeatRow();
        if (group === 'confettiType') {
          // Auto-apply type-specific color palette
          current.colors = [...(TYPE_COLORS[value] || DEFAULT_COLORS)];
          reflectSwatches();
          renderPreview();
        }
      });
    });

    // Sound toggle
    $('sound-enabled').addEventListener('change', e => {
      current.soundEnabled = e.target.checked;
    });

    // Sliders
    [
      ['repeat-count', v => { current.repeatCount = +v; }],
    ].forEach(([id, onchange, fmt]) => {
      const slider = $(id);
      if (!slider) return;
      slider.addEventListener('input', () => {
        const v = slider.value;
        const valEl = $(`${id}-val`);
        if (valEl) valEl.textContent = fmt ? fmt(v) : v;
        updateFill(slider);
        onchange(v);
      });
    });

    // Color picker
    $('color-picker').addEventListener('change', e => {
      const hex = e.target.value;
      if (hex && !current.colors.includes(hex) && current.colors.length < 20) {
        current.colors.push(hex);
        reflectSwatches(); renderPreview();
      }
    });

    // URL triggers
    $('add-trigger-btn').addEventListener('click', () => {
      if (current.urlTriggers.length >= 10) return;
      current.urlTriggers.push('');
      addTriggerRow('');
      syncAddBtn();
    });

    // Save — persists settings, flashes feedback, then closes
    $('save-btn').addEventListener('click', async () => {
      const inputs = shadow.querySelectorAll('.trigger-input');
      current.urlTriggers = Array.from(inputs).map(i => i.value.trim()).filter(Boolean);
      await chrome.storage.sync.set(current);
      const fb = $('save-feedback');
      fb.classList.add('visible');
      setTimeout(() => { fb.classList.remove('visible'); window.__joshConfettiOverlay.hide(); }, 700);
    });
  }

  attachListeners();

  // ── Public API ─────────────────────────────────────────────────────────────

  window.__joshConfettiOverlay = {
    /**
     * Loads saved settings from chrome.storage.sync, applies them to the in-memory
     * state, syncs all UI controls, and makes the overlay panel visible.
     * @returns {Promise<void>}
     */
    async show() {
      const stored = await chrome.storage.sync.get(DEFAULTS);
      current = { ...DEFAULTS, ...stored };
      if (!Array.isArray(current.colors))      current.colors      = [...DEFAULT_COLORS];
      if (!Array.isArray(current.urlTriggers)) current.urlTriggers = [];
      reflectAll();
      root.style.display = 'flex';
    },
    /**
     * Hides the overlay panel without saving any unsaved changes.
     */
    hide() {
      root.style.display = 'none';
    }
  };
}

// Show (safe to call on re-injection)
window.__joshConfettiOverlay.show();
