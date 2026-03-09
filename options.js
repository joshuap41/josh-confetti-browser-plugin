// Josh's Confetti 🎉 — Options Page Logic

// ── Defaults ──────────────────────────────────────────────────────────────

const DEFAULT_COLORS = [
  '#ff6b6b','#ffd93d','#6bcb77','#4d96ff',
  '#ff6bcd','#ff9f43','#a29bfe','#fd79a8',
  '#00cec9','#fdcb6e','#e17055','#74b9ff'
];

const DEFAULTS = {
  confettiType:       'classic',
  particleCount:      1000,
  particleSize:       35,
  explosionMode:      'center',
  animationDirection: ['rise-up', 'random'],
  repeatMode:         'repeated',
  repeatCount:        2,
  colors:             [...DEFAULT_COLORS],
  urlTriggers:        []
};

let current = { ...DEFAULTS };

// ── Boot ───────────────────────────────────────────────────────────────────

document.addEventListener('DOMContentLoaded', async () => {
  const stored = await chrome.storage.sync.get(DEFAULTS);
  current = { ...DEFAULTS, ...stored };

  // Ensure arrays are real arrays (storage can return primitives on edge cases)
  if (!Array.isArray(current.animationDirection)) current.animationDirection = ['random'];
  if (!Array.isArray(current.colors))             current.colors = [...DEFAULT_COLORS];
  if (!Array.isArray(current.urlTriggers))        current.urlTriggers = [];

  reflectPillGroups();
  reflectSliders();
  reflectDirectionCheckboxes();
  reflectRepeatRow();
  reflectSwatches();
  reflectTriggers();

  attachListeners();
});

// ── Reflect: pill/mode buttons ─────────────────────────────────────────────

function reflectPillGroups() {
  ['confettiType', 'explosionMode', 'repeatMode'].forEach(group => {
    document.querySelectorAll(`[data-group="${group}"]`).forEach(btn => {
      btn.classList.toggle('active', btn.dataset.value === current[group]);
    });
  });
}

// ── Reflect: sliders ───────────────────────────────────────────────────────

function reflectSliders() {
  setSlider('particle-count', current.particleCount);
  setSlider('particle-size',  current.particleSize);
  setSlider('repeat-count',   current.repeatCount);
}

function setSlider(id, value) {
  const slider = document.getElementById(id);
  const valEl  = document.getElementById(`${id}-val`);
  if (!slider) return;
  slider.value = value;
  if (valEl) valEl.textContent = value;
  updateSliderFill(slider);
}

function updateSliderFill(slider) {
  const pct = ((slider.value - slider.min) / (slider.max - slider.min)) * 100;
  slider.style.background =
    `linear-gradient(to right, #a29bfe ${pct}%, #16213e ${pct}%)`;
}

// ── Reflect: animation direction checkboxes ────────────────────────────────

function reflectDirectionCheckboxes() {
  document.querySelectorAll('.dir-cb').forEach(cb => {
    cb.checked = current.animationDirection.includes(cb.value);
  });
}

// ── Reflect: repeat count row visibility ──────────────────────────────────

function reflectRepeatRow() {
  const row = document.getElementById('repeat-count-row');
  if (row) row.classList.toggle('visible', current.repeatMode === 'repeated');
}

// ── Reflect: color swatches ────────────────────────────────────────────────

function reflectSwatches() {
  const grid = document.getElementById('color-swatches');
  if (!grid) return;
  grid.innerHTML = '';

  current.colors.forEach((hex, i) => {
    const swatch = document.createElement('div');
    swatch.className = 'swatch';
    swatch.style.backgroundColor = hex;
    swatch.title = hex;

    const x = document.createElement('span');
    x.className = 'swatch-x';
    x.textContent = '✕';
    swatch.appendChild(x);

    swatch.addEventListener('click', () => {
      if (current.colors.length <= 1) return; // always keep at least 1
      current.colors.splice(i, 1);
      reflectSwatches();
      renderPreview();
    });

    grid.appendChild(swatch);
  });

  // + add button
  const addBtn = document.createElement('button');
  addBtn.className = 'swatch-add';
  addBtn.textContent = '+';
  addBtn.title = 'Add a color';
  addBtn.addEventListener('click', () => {
    if (current.colors.length >= 20) return;
    document.getElementById('color-picker').click();
  });
  grid.appendChild(addBtn);
}

// ── Reflect: URL triggers ──────────────────────────────────────────────────

function reflectTriggers() {
  const list = document.getElementById('trigger-list');
  if (!list) return;
  list.innerHTML = '';

  current.urlTriggers.forEach((url, i) => addTriggerRow(url, i));
  syncAddTriggerBtn();
}

function addTriggerRow(value = '', index = -1) {
  const list = document.getElementById('trigger-list');

  const row = document.createElement('div');
  row.className = 'trigger-row';

  const input = document.createElement('input');
  input.type = 'text';
  input.className = 'trigger-input';
  input.placeholder = 'e.g. checkout/success or example.com/thank-you';
  input.value = value;
  input.addEventListener('input', () => {
    const idx = Array.from(list.children).indexOf(row);
    if (idx >= 0) current.urlTriggers[idx] = input.value;
  });

  const del = document.createElement('button');
  del.className = 'trigger-del';
  del.textContent = '✕';
  del.title = 'Remove';
  del.addEventListener('click', () => {
    const idx = Array.from(list.children).indexOf(row);
    if (idx >= 0) current.urlTriggers.splice(idx, 1);
    row.remove();
    syncAddTriggerBtn();
  });

  row.appendChild(input);
  row.appendChild(del);
  list.appendChild(row);
}

function syncAddTriggerBtn() {
  const btn = document.getElementById('add-trigger-btn');
  if (btn) btn.disabled = current.urlTriggers.length >= 10;
}

// ── Preview Canvas ─────────────────────────────────────────────────────────

function renderPreview() {
  const canvas = document.getElementById('size-preview');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const W = canvas.width, H = canvas.height;

  ctx.clearRect(0, 0, W, H);
  ctx.fillStyle = '#0f0f1a';
  ctx.fillRect(0, 0, W, H);

  const sz     = current.particleSize;
  const type   = current.confettiType;
  const colors = current.colors.length ? current.colors : DEFAULT_COLORS;
  const count  = 7;

  for (let i = 0; i < count; i++) {
    const x   = 20 + (i * (W - 40)) / (count - 1);
    const y   = H / 2 + Math.sin(i * 1.1) * 8;
    const rot = (i - 3) * 0.28;
    const col = colors[i % colors.length];
    const s   = sz * (0.7 + (i % 3) * 0.15);

    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(rot);
    ctx.fillStyle   = col;
    ctx.strokeStyle = col;
    ctx.globalAlpha = 0.92;

    if (type === 'circles') {
      ctx.beginPath();
      ctx.arc(0, 0, s * 0.5, 0, Math.PI * 2);
      ctx.fill();
    } else if (type === 'stars') {
      const R = s * 0.55, ir = R * 0.42;
      ctx.beginPath();
      for (let j = 0; j < 5; j++) {
        const a = (j * 2 * Math.PI) / 5 - Math.PI / 2;
        const ia = a + Math.PI / 5;
        if (j === 0) ctx.moveTo(Math.cos(a) * R, Math.sin(a) * R);
        else         ctx.lineTo(Math.cos(a) * R, Math.sin(a) * R);
        ctx.lineTo(Math.cos(ia) * ir, Math.sin(ia) * ir);
      }
      ctx.closePath();
      ctx.fill();
    } else if (type === 'ribbons') {
      ctx.lineWidth = 2.5;
      ctx.lineCap = 'round';
      const len = s * 2.2;
      ctx.beginPath();
      for (let j = 0; j <= len; j++) {
        const rx = j - len * 0.5;
        const ry = Math.sin(i + j * 0.28) * 4;
        if (j === 0) ctx.moveTo(rx, ry);
        else         ctx.lineTo(rx, ry);
      }
      ctx.stroke();
    } else if (type === 'emoji') {
      ctx.font = `${Math.round(s * 1.6)}px serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.globalAlpha = 1;
      ctx.fillText(['🎉','🎊','🌟','🎈','✨','💫','🥳'][i % 7], 0, 0);
    } else {
      // classic
      const w = s * Math.abs(Math.cos(i * 0.6));
      const h = s * 0.45;
      ctx.fillRect(-w * 0.5, -h * 0.5, w, h);
    }

    ctx.restore();
  }
}

// ── Wire up all listeners ──────────────────────────────────────────────────

function attachListeners() {

  // — Pill buttons (type, explosionMode, repeatMode) —
  document.querySelectorAll('[data-group]').forEach(btn => {
    btn.addEventListener('click', () => {
      const group = btn.dataset.group;
      const value = btn.dataset.value;
      if (!(group in current)) return;

      document.querySelectorAll(`[data-group="${group}"]`).forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      current[group] = value;

      if (group === 'repeatMode') reflectRepeatRow();
      if (group === 'confettiType') renderPreview();
    });
  });

  // — Particle count slider —
  const pcSlider = document.getElementById('particle-count');
  if (pcSlider) {
    pcSlider.addEventListener('input', () => {
      current.particleCount = +pcSlider.value;
      document.getElementById('particle-count-val').textContent = pcSlider.value;
      updateSliderFill(pcSlider);
    });
  }

  // — Particle size slider —
  const psSlider = document.getElementById('particle-size');
  if (psSlider) {
    psSlider.addEventListener('input', () => {
      current.particleSize = +psSlider.value;
      document.getElementById('particle-size-val').textContent = psSlider.value;
      updateSliderFill(psSlider);
      renderPreview();
    });
  }

  // — Repeat count slider —
  const rcSlider = document.getElementById('repeat-count');
  if (rcSlider) {
    rcSlider.addEventListener('input', () => {
      current.repeatCount = +rcSlider.value;
      document.getElementById('repeat-count-val').textContent = rcSlider.value;
      updateSliderFill(rcSlider);
    });
  }

  // — Animation direction checkboxes —
  document.querySelectorAll('.dir-cb').forEach(cb => {
    cb.addEventListener('change', () => {
      const checked = Array.from(document.querySelectorAll('.dir-cb:checked')).map(c => c.value);
      // Always require at least one selection
      if (checked.length === 0) {
        document.querySelector('.dir-cb[value="random"]').checked = true;
        current.animationDirection = ['random'];
      } else {
        current.animationDirection = checked;
      }
    });
  });

  // — Color picker —
  const picker = document.getElementById('color-picker');
  if (picker) {
    picker.addEventListener('change', () => {
      const hex = picker.value;
      if (hex && !current.colors.includes(hex)) {
        current.colors.push(hex);
        reflectSwatches();
        renderPreview();
      }
    });
  }

  // — Add URL trigger —
  document.getElementById('add-trigger-btn')?.addEventListener('click', () => {
    if (current.urlTriggers.length >= 10) return;
    current.urlTriggers.push('');
    addTriggerRow('', current.urlTriggers.length - 1);
    syncAddTriggerBtn();
  });

  // — Copy keyboard shortcut URL —
  document.getElementById('copy-shortcut-btn')?.addEventListener('click', async () => {
    try {
      await navigator.clipboard.writeText('chrome://extensions/shortcuts');
      const btn = document.getElementById('copy-shortcut-btn');
      btn.textContent = 'Copied!';
      setTimeout(() => { btn.textContent = 'Copy'; }, 1800);
    } catch {}
  });

  // — Save —
  document.getElementById('save-btn')?.addEventListener('click', saveSettings);

  // Initial preview render
  renderPreview();
}

// ── Save ───────────────────────────────────────────────────────────────────

async function saveSettings() {
  // Scrape latest trigger input values before saving
  const inputs = document.querySelectorAll('.trigger-input');
  current.urlTriggers = Array.from(inputs)
    .map(i => i.value.trim())
    .filter(Boolean);

  await chrome.storage.sync.set(current);
  showFeedback('✓ Saved!');
  setTimeout(() => window.close(), 800);
}

function showFeedback(msg) {
  const el = document.getElementById('save-feedback');
  el.textContent = msg;
  el.classList.add('visible');
  setTimeout(() => el.classList.remove('visible'), 2200);
}
