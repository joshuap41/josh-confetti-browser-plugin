#!/usr/bin/env node
// Josh's Confetti 🎉 — Test Suite (v2.0)
// Zero dependencies — plain Node.js.
// Run: node tests/run.js

'use strict';

const fs   = require('fs');
const path = require('path');

// ── Minimal test framework ──────────────────────────────────────────────────

let passed = 0, failed = 0;
const failures = [];

function assert(condition, label) {
  if (condition) {
    process.stdout.write(`  ✅  ${label}\n`);
    passed++;
  } else {
    process.stdout.write(`  ❌  ${label}\n`);
    failures.push(label);
    failed++;
  }
}

function assertEqual(a, b, label) {
  const ok = a === b;
  assert(ok, label + (ok ? '' : `  →  got ${JSON.stringify(a)}, expected ${JSON.stringify(b)}`));
}

function assertContains(haystack, needle, label) {
  assert(haystack.includes(needle), label + (haystack.includes(needle) ? '' : `  →  missing: "${needle}"`));
}

function assertNotContains(haystack, needle, label) {
  assert(!haystack.includes(needle), label + (haystack.includes(needle) ? `  →  should NOT contain: "${needle}"` : ''));
}

function section(title) {
  console.log(`\n── ${title}`);
}

// ── Load source files ───────────────────────────────────────────────────────

const ROOT = path.join(__dirname, '..');

function read(file) { return fs.readFileSync(path.join(ROOT, file), 'utf8'); }

const overlay  = read('overlay.js');
const content  = read('content.js');
const bg       = read('background.js');
const manifest = JSON.parse(read('manifest.json'));

// ── Extract typed constants via safe eval ───────────────────────────────────

function extractObject(src, name) {
  // Matches "const NAME = { ... };" allowing nested braces up to 2 deep
  const re = new RegExp(`const ${name}\\s*=\\s*(\\{(?:[^{}]|\\{[^{}]*\\})*\\})`, 's');
  const m  = src.match(re);
  if (!m) return null;
  try { return new Function(`return (${m[1]})`)(); } catch { return null; }
}

function extractScalar(src, name) {
  const m = src.match(new RegExp(`${name}:\\s*([\\d.]+)`));
  return m ? parseFloat(m[1]) : null;
}

const DENSITY_PRESETS = extractObject(overlay, 'DENSITY_PRESETS');
const SIZE_PRESETS    = extractObject(overlay, 'SIZE_PRESETS');
const SPEED_PRESETS   = extractObject(overlay, 'SPEED_PRESETS');

// ══════════════════════════════════════════════════════════════════════════════
// SECTION 1 — Manifest
// ══════════════════════════════════════════════════════════════════════════════

section('Manifest');
assertEqual(manifest.manifest_version, 3,       'manifest_version is 3 (MV3)');
assertEqual(manifest.version,          '2.0.0', 'extension version is 2.0.0');
assert(Array.isArray(manifest.permissions),      'permissions array exists');
assertContains(manifest.permissions, 'storage',  'has "storage" permission');
assertContains(manifest.permissions, 'scripting','has "scripting" permission');
assertContains(manifest.permissions, 'tabs',     'has "tabs" permission');
assert(!!manifest.background?.service_worker,    'background.service_worker defined');
assertEqual(manifest.background.service_worker, 'background.js', 'service worker is background.js');
assert(!!manifest.options_page,                  'options_page defined');
assert(Array.isArray(manifest.host_permissions), 'host_permissions array exists');
assertContains(manifest.host_permissions[0], '<all_urls>', 'host_permissions covers all URLs');
assert(manifest.web_accessible_resources?.length > 0, 'web_accessible_resources defined');

// ══════════════════════════════════════════════════════════════════════════════
// SECTION 2 — DEFAULTS schema (overlay + background must be consistent)
// ══════════════════════════════════════════════════════════════════════════════

section('DEFAULTS — required keys in overlay.js');
const REQUIRED_KEYS = [
  'confettiType', 'particleCount', 'particleSize', 'animationSpeed',
  'explosionMode', 'repeatMode', 'repeatCount', 'colors', 'urlTriggers', 'soundEnabled',
];
for (const key of REQUIRED_KEYS) {
  assertContains(overlay, `${key}:`, `overlay DEFAULTS has "${key}"`);
}

section('DEFAULTS — required keys in background.js');
for (const key of REQUIRED_KEYS) {
  assertContains(bg, `${key}:`, `background DEFAULT_SETTINGS has "${key}"`);
}

section('DEFAULTS — cross-file scalar consistency');
const overlaySpeed  = extractScalar(overlay, 'animationSpeed');
const bgSpeed       = extractScalar(bg,      'animationSpeed');
assertEqual(overlaySpeed, bgSpeed, `animationSpeed default matches (${overlaySpeed})`);

const overlayCount  = extractScalar(overlay, 'particleCount');
const bgCount       = extractScalar(bg,      'particleCount');
assertEqual(overlayCount, bgCount, `particleCount default matches (${overlayCount})`);

const overlaySize   = extractScalar(overlay, 'particleSize');
const bgSize        = extractScalar(bg,      'particleSize');
assertEqual(overlaySize, bgSize, `particleSize default matches (${overlaySize})`);

section('DEFAULTS — soundEnabled is false by default');
assertContains(overlay, 'soundEnabled:   false', 'overlay soundEnabled: false');
assertContains(bg,      'soundEnabled:',          'background has soundEnabled key');
assertContains(bg,      'false',                  'background soundEnabled is false');

// ══════════════════════════════════════════════════════════════════════════════
// SECTION 3 — Confetti types
// ══════════════════════════════════════════════════════════════════════════════

const ALL_TYPES = [
  'classic','stars','circles','ribbons','emoji',
  'hearts','diamonds','triangles','snowflakes','sparks','coins','teardrops',
];

section('Confetti types — TYPE_COLORS has every type');
for (const t of ALL_TYPES) {
  assertContains(overlay, `${t}:`, `TYPE_COLORS entry for "${t}"`);
}

section('Confetti types — content.js drawParticle handles every type');
for (const t of ALL_TYPES) {
  assertContains(content, `case '${t}'`, `drawParticle switch case for "${t}"`);
}

section('Confetti types — overlay HTML pill for every type');
for (const t of ALL_TYPES) {
  assertContains(overlay, `data-value="${t}"`, `pill button for confettiType "${t}"`);
}

// ══════════════════════════════════════════════════════════════════════════════
// SECTION 4 — Explosion modes
// ══════════════════════════════════════════════════════════════════════════════

const ALL_MODES = ['bottom-up','top-down','center','cannon-left','cannon-right','side-to-side','fireworks'];

section('Explosion modes — createParticle handles every mode');
for (const m of ALL_MODES) {
  assertContains(content, `'${m}'`, `createParticle handles "${m}"`);
}

section('Explosion modes — overlay HTML mode-btn for every mode');
for (const m of ALL_MODES) {
  assertContains(overlay, `data-value="${m}"`, `mode-btn for "${m}"`);
}

section('Explosion modes — sound handles cannon + fireworks modes');
assertContains(content, "mode === 'fireworks'",    'sound: fireworks branch');
assertContains(content, "mode === 'cannon-left'",  'sound: cannon-left branch');
assertContains(content, "mode === 'cannon-right'", 'sound: cannon-right branch');
assertContains(content, "mode === 'side-to-side'", 'sound: side-to-side branch');

// ══════════════════════════════════════════════════════════════════════════════
// SECTION 5 — Presets
// ══════════════════════════════════════════════════════════════════════════════

section('Density presets — structure and ordering');
assert(DENSITY_PRESETS !== null, 'DENSITY_PRESETS parsed');
if (DENSITY_PRESETS) {
  const vals = Object.values(DENSITY_PRESETS);
  assertEqual(vals.length, 4, 'exactly 4 density presets');
  assert(vals.every(v => v > 0),                          'all values > 0');
  assert(vals[0] < vals[1] && vals[1] < vals[2] && vals[2] < vals[3], 'values are strictly ascending');
  assertContains(overlay, 'data-group="densityPreset"',   'overlay has density preset pills');
}

section('Size presets — structure and ordering');
assert(SIZE_PRESETS !== null, 'SIZE_PRESETS parsed');
if (SIZE_PRESETS) {
  const vals = Object.values(SIZE_PRESETS);
  assertEqual(vals.length, 4, 'exactly 4 size presets');
  assert(vals.every(v => v >= 3 && v <= 50),              'all values in slider range [3, 50]');
  assert(vals[0] < vals[1] && vals[1] < vals[2] && vals[2] < vals[3], 'values are strictly ascending');
  assertContains(overlay, 'data-group="sizePreset"',      'overlay has size preset pills');
}

section('Speed presets — structure, ordering, and ceiling');
assert(SPEED_PRESETS !== null, 'SPEED_PRESETS parsed');
if (SPEED_PRESETS) {
  const vals = Object.values(SPEED_PRESETS);
  assertEqual(vals.length, 5, 'exactly 5 speed presets');
  assert(vals.every(v => v > 0 && v <= 1),                'all values in range (0, 1]');
  for (let i = 1; i < vals.length; i++) {
    assert(vals[i] > vals[i - 1], `speed preset ${i + 1} > preset ${i}`);
  }
  assertEqual(Math.max(...vals), 0.4, 'ludicrous preset is the ceiling (0.4)');
  assertContains(overlay, 'data-group="speedPreset"',     'overlay has speed preset pills');
}

// ══════════════════════════════════════════════════════════════════════════════
// SECTION 6 — Physics correctness (animation speed regression)
// ══════════════════════════════════════════════════════════════════════════════

section('Physics — speed is time-scale, NOT velocity multiplier');
assertNotContains(content, 'const sp = (9 + Math.random() * 9) * spd',
  'sp is not scaled by spd (velocity decoupled from speed)');
assertContains(content, 'const sp = 9 + Math.random() * 9',
  'sp uses fixed base velocity');
assertContains(content, 'const gravity = 0.26;',
  'gravity is a fixed constant, not speed-scaled');
assertContains(content, 'Math.pow(0.992, s)',
  'drag uses time-scaled exponent Math.pow(0.992, s)');
assertContains(content, 'p.vy += p.gravity * s',
  'gravity is applied with time-scale s');
assertContains(content, 'p.x  += p.vx * s',
  'x position update is time-scaled');
assertContains(content, 'p.y  += p.vy * s',
  'y position update is time-scaled');
assertContains(content, 'p.rotation += p.rotationSpeed * s',
  'rotation update is time-scaled');
assertContains(content, 'p.delay -= s',
  'delay counts down by time-scale s');
assertContains(content, 'p.age += s',
  'age increments by time-scale s');

// ══════════════════════════════════════════════════════════════════════════════
// SECTION 7 — Fireworks vehicle lifetime
// ══════════════════════════════════════════════════════════════════════════════

section('Fireworks vehicle — tied to particle lifetime');
assertContains(content, 'particleAlive === 0',
  'vehicle starts fading only when particleAlive hits zero');
assertNotContains(content, 'if (_vehicle.age > 200)',
  'old fixed-frame age threshold removed');
assertContains(content, '_vehicle.age += _vehicle.spd',
  'vehicle age is speed-scaled');
assertContains(content, 'tubeTriggered',
  'tube flashes use one-shot triggered flags');

// ══════════════════════════════════════════════════════════════════════════════
// SECTION 8 — Sound effects
// ══════════════════════════════════════════════════════════════════════════════

section('Sound effects — mode-aware dispatch');
assertContains(content, 'function playConfettiSound(mode)',
  'playConfettiSound accepts mode argument');
assertContains(content, "playConfettiSound(settings.explosionMode",
  'launch passes explosionMode to sound function');
assertContains(content, 'function sparkle(',
  'sparkle helper defined');
assertContains(content, 'function sparkles(',
  'sparkles scheduler defined');
assertContains(content, "if (mode === 'fireworks')",
  'fireworks sound branch');
assertContains(content, 'Rising whistle',
  'fireworks: rising whistle comment present');
assertContains(content, 'function cannonShot(',
  'cannon sound uses cannonShot helper');

// ══════════════════════════════════════════════════════════════════════════════
// SECTION 9 — UI structure
// ══════════════════════════════════════════════════════════════════════════════

section('Overlay HTML — all required elements present');
const REQUIRED_ELEMENTS = [
  ['id="fire-btn"',          'Preview Fire button'],
  ['id="save-btn"',          'Save button'],
  ['id="close-btn"',         'Close button'],
  ['id="size-preview"',      'Size preview canvas'],
  ['id="sound-enabled"',     'Sound toggle checkbox'],
  ['id="repeat-count-row"',  'Repeat count row'],
  ['id="color-swatches"',    'Color swatches container'],
  ['id="color-picker"',      'Hidden color picker input'],
  ['id="trigger-list"',      'URL trigger list'],
  ['id="add-trigger-btn"',   'Add URL button'],
  ['data-group="densityPreset"', 'Density preset pill group'],
  ['data-group="sizePreset"',    'Size preset pill group'],
  ['data-group="speedPreset"',   'Speed preset pill group'],
  ['data-group="confettiType"',  'Confetti type pill group'],
  ['data-group="explosionMode"', 'Explosion mode button group'],
  ['data-group="repeatMode"',    'Repeat mode pill group'],
  ['class="version-tag"',        'Version tag in header'],
  ['class="action-row"',         'Action row (dual-button top bar)'],
];
for (const [selector, label] of REQUIRED_ELEMENTS) {
  assertContains(overlay, selector, label);
}

section('Overlay UI — Save and Fire buttons are siblings in action-row');
const actionRowMatch = overlay.match(/class="action-row"[^]*?<\/div>/);
if (actionRowMatch) {
  const row = actionRowMatch[0];
  assert(row.includes('id="save-btn"'), 'Save button is inside action-row');
  assert(row.includes('id="fire-btn"'), 'Fire button is inside action-row');
} else {
  assert(false, 'action-row element found in overlay HTML');
}

section('Overlay CSS — buttons use flex layout in action-row');
assertContains(overlay, '.action-row { display: flex;', 'action-row is a flex container');
assertContains(overlay, 'flex: 1',                      'btn-action uses flex: 1 for equal width');

section('Overlay — version badge shows v2.0');
assertContains(overlay, 'v2.0', 'version tag text is "v2.0"');

// ══════════════════════════════════════════════════════════════════════════════
// SECTION 10 — Guard rails (no regressions from removed features)
// ══════════════════════════════════════════════════════════════════════════════

section('Regression — removed particle-count slider');
assertNotContains(overlay, 'id="particle-count"',     'particle-count slider is gone');
assertNotContains(overlay, 'id="particle-count-val"', 'particle-count value label is gone');

section('Regression — removed particle-size slider');
assertNotContains(overlay, 'id="particle-size"',     'particle-size slider is gone (replaced by presets)');
assertNotContains(overlay, 'id="particle-size-val"', 'particle-size value label is gone');

section('Regression — removed animation-speed slider');
assertNotContains(overlay, 'id="animation-speed"',     'animation-speed slider is gone (replaced by presets)');
assertNotContains(overlay, 'id="animation-speed-val"', 'animation-speed value label is gone');

section('Regression — old fixed vehicle age threshold');
assertNotContains(content, '_vehicle.age > 200', 'old hard-coded vehicle age threshold removed');

// ══════════════════════════════════════════════════════════════════════════════
// Summary
// ══════════════════════════════════════════════════════════════════════════════

const total = passed + failed;
console.log(`\n${'─'.repeat(58)}`);
console.log(`  ${passed}/${total} passed${failed > 0 ? `  |  ${failed} FAILED` : '  |  All green ✅'}`);
if (failures.length) {
  console.log('\nFailed tests:');
  failures.forEach(f => console.log(`  • ${f}`));
}
console.log('');
process.exit(failed > 0 ? 1 : 0);
