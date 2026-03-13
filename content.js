// Josh's Confetti 🎉 — Content Script
// Guard prevents re-definition when injected multiple times.
// Particles from repeated shots accumulate in a shared canvas.

if (!window.__joshConfettiDefined) {
  window.__joshConfettiDefined = true;

  // ─── Defaults ─────────────────────────────────────────────────────────────

  const DEFAULT_COLORS = [
    '#ff6b6b', '#ffd93d', '#6bcb77', '#4d96ff',
    '#ff6bcd', '#ff9f43', '#a29bfe', '#fd79a8',
    '#00cec9', '#fdcb6e', '#e17055', '#74b9ff'
  ];

  const EMOJIS = ['🎉', '🎊', '🎈', '🌟', '✨', '💫', '🎆', '🎇', '🥳', '🎁', '🍾', '🎀'];

  // ─── Sound Effects ────────────────────────────────────────────────────────

  /**
   * Plays a synthesized sound effect matched to the given explosion mode.
   * Uses the Web Audio API to generate the sound procedurally; silently
   * swallows any errors if the AudioContext is unavailable.
   * @param {string} mode - The explosion mode (e.g. 'fireworks', 'cannon-left', 'center').
   */
  function playConfettiSound(mode) {
    try {
      const actx = new (window.AudioContext || window.webkitAudioContext)();
      const now  = actx.currentTime;

      // ── Shared helpers ──────────────────────────────────────────────────────

      /**
       * Creates a mono AudioBuffer filled with white noise.
       * @param {number} duration - Length of the buffer in seconds.
       * @returns {AudioBuffer} A buffer containing white noise samples.
       */
      function noiseBuf(duration) {
        const len = Math.floor(actx.sampleRate * duration);
        const buf = actx.createBuffer(1, len, actx.sampleRate);
        const d   = buf.getChannelData(0);
        for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
        return buf;
      }

      /**
       * Schedules a single high-frequency sparkle "ting" at the given AudioContext time.
       * @param {number} t - Absolute AudioContext time at which to play the sparkle.
       */
      function sparkle(t) {
        const freq = 1800 + Math.random() * 3000;
        const osc  = actx.createOscillator();
        const g    = actx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, t);
        osc.frequency.exponentialRampToValueAtTime(freq * 0.65, t + 0.11);
        g.gain.setValueAtTime(0, t);
        g.gain.linearRampToValueAtTime(0.16, t + 0.008);
        g.gain.exponentialRampToValueAtTime(0.001, t + 0.11);
        osc.connect(g); g.connect(actx.destination);
        osc.start(t); osc.stop(t + 0.12);
      }

      /**
       * Schedules `count` sparkle tings randomly distributed between now+t0 and now+t1 seconds.
       * @param {number} count - Number of sparkles to schedule.
       * @param {number} t0    - Start of the random window, relative to `now` (seconds).
       * @param {number} t1    - End of the random window, relative to `now` (seconds).
       */
      function sparkles(count, t0, t1) {
        for (let i = 0; i < count; i++) sparkle(now + t0 + Math.random() * (t1 - t0));
      }

      // ── Fireworks mode: whistle → crack → boom → sparkle crackles ──────────

      if (mode === 'fireworks') {
        // Rising whistle (launch)
        const wh = actx.createOscillator();
        const wg = actx.createGain();
        wh.type = 'sine';
        wh.frequency.setValueAtTime(180, now);
        wh.frequency.exponentialRampToValueAtTime(2200, now + 0.55);
        wg.gain.setValueAtTime(0.18, now);
        wg.gain.setValueAtTime(0.18, now + 0.5);
        wg.gain.exponentialRampToValueAtTime(0.001, now + 0.6);
        wh.connect(wg); wg.connect(actx.destination);
        wh.start(now); wh.stop(now + 0.62);

        // High-frequency crack on explosion
        const crSrc = actx.createBufferSource();
        crSrc.buffer = noiseBuf(0.14);
        const hpf = actx.createBiquadFilter();
        hpf.type = 'highpass'; hpf.frequency.value = 2000;
        const crg = actx.createGain();
        crg.gain.setValueAtTime(0.7, now + 0.55);
        crg.gain.exponentialRampToValueAtTime(0.001, now + 0.69);
        crSrc.connect(hpf); hpf.connect(crg); crg.connect(actx.destination);
        crSrc.start(now + 0.55); crSrc.stop(now + 0.7);

        // Deep boom after crack
        const bm = actx.createOscillator();
        const bg = actx.createGain();
        bm.type = 'sine';
        bm.frequency.setValueAtTime(95, now + 0.55);
        bm.frequency.exponentialRampToValueAtTime(22, now + 1.1);
        bg.gain.setValueAtTime(0.55, now + 0.55);
        bg.gain.exponentialRampToValueAtTime(0.001, now + 1.1);
        bm.connect(bg); bg.connect(actx.destination);
        bm.start(now + 0.55); bm.stop(now + 1.15);

        // Sparkle crackles scattered through the animation
        sparkles(14, 0.6, 5.5);
        setTimeout(() => actx.close(), 6500);

      // ── Cannon modes: deep thud + noise blast (+ second shot for side-to-side) ──

      } else if (mode === 'cannon-left' || mode === 'cannon-right' || mode === 'side-to-side') {
        /**
         * Synthesizes a single cannon-fire sound (low boom + noise blast) at time t.
         * @param {number} t - Absolute AudioContext time at which to play the shot.
         */
        function cannonShot(t) {
          // Low boom
          const bm = actx.createOscillator();
          const bg = actx.createGain();
          bm.type = 'sine';
          bm.frequency.setValueAtTime(75, t);
          bm.frequency.exponentialRampToValueAtTime(20, t + 0.48);
          bg.gain.setValueAtTime(0.6, t);
          bg.gain.exponentialRampToValueAtTime(0.001, t + 0.48);
          bm.connect(bg); bg.connect(actx.destination);
          bm.start(t); bm.stop(t + 0.5);

          // Noise blast
          const blSrc = actx.createBufferSource();
          blSrc.buffer = noiseBuf(0.28);
          const lpf = actx.createBiquadFilter();
          lpf.type = 'lowpass'; lpf.frequency.value = 900;
          const nlg = actx.createGain();
          nlg.gain.setValueAtTime(0.5, t);
          nlg.gain.exponentialRampToValueAtTime(0.001, t + 0.28);
          blSrc.connect(lpf); lpf.connect(nlg); nlg.connect(actx.destination);
          blSrc.start(t); blSrc.stop(t + 0.3);
        }

        cannonShot(now);
        if (mode === 'side-to-side') cannonShot(now + 0.22); // second cannon offset

        sparkles(9, 0.4, 4.0);
        setTimeout(() => actx.close(), 5000);

      // ── All other modes: whoosh + pop + light sparkle tings ────────────────

      } else {
        const whooshSrc = actx.createBufferSource();
        whooshSrc.buffer = noiseBuf(0.45);
        const bpf = actx.createBiquadFilter();
        bpf.type = 'bandpass';
        bpf.frequency.setValueAtTime(1400, now);
        bpf.frequency.exponentialRampToValueAtTime(280, now + 0.38);
        bpf.Q.value = 1.4;
        const wg = actx.createGain();
        wg.gain.setValueAtTime(0.32, now);
        wg.gain.exponentialRampToValueAtTime(0.001, now + 0.45);
        whooshSrc.connect(bpf); bpf.connect(wg); wg.connect(actx.destination);
        whooshSrc.start(now); whooshSrc.stop(now + 0.46);

        const pop = actx.createOscillator();
        const pg  = actx.createGain();
        pop.type = 'sine';
        pop.frequency.setValueAtTime(700, now);
        pop.frequency.exponentialRampToValueAtTime(110, now + 0.16);
        pg.gain.setValueAtTime(0.28, now);
        pg.gain.exponentialRampToValueAtTime(0.001, now + 0.16);
        pop.connect(pg); pg.connect(actx.destination);
        pop.start(now); pop.stop(now + 0.17);

        sparkles(5, 0.2, 2.8);
        setTimeout(() => actx.close(), 3800);
      }
    } catch (_) {}
  }

  const TUBE_FRACTIONS_X = [0.12, 0.19, 0.26, 0.33, 0.40];
  const TUBE_FRACTION_Y  = 0.38;

  // ─── Shared animation state ───────────────────────────────────────────────

  let _canvas     = null;
  let _ctx        = null;
  let _particles  = [];
  let _cannons    = [];
  let _vehicle    = null;
  let _vehicleImg = null;
  let _animating  = false;

  // Cache pre-rendered emoji bitmaps — keyed by "emoji:fontSize" so drawImage
  // replaces fillText (text shaping runs once per size, not every frame).
  const _emojiCache = new Map();

  /**
   * Returns a pre-rendered off-screen canvas for the given emoji at the given size.
   * Results are cached by "emoji:fontSize" to avoid repeated text-shaping overhead.
   * @param {string} emoji - The emoji character to render.
   * @param {number} size  - The logical particle size; font size is derived from this.
   * @returns {HTMLCanvasElement} An off-screen canvas containing the rendered emoji.
   */
  function _getEmojiCanvas(emoji, size) {
    const fontSize = Math.round(size * 1.6 / 4) * 4; // bucket to nearest 4px
    const key = `${emoji}:${fontSize}`;
    if (_emojiCache.has(key)) return _emojiCache.get(key);
    const pad = Math.ceil(fontSize * 0.25);
    const dim = fontSize + pad * 2;
    const c   = document.createElement('canvas');
    c.width   = dim;
    c.height  = dim;
    const cx  = c.getContext('2d');
    cx.font         = `${fontSize}px serif`;
    cx.textAlign    = 'center';
    cx.textBaseline = 'middle';
    cx.fillText(emoji, dim / 2, dim / 2);
    _emojiCache.set(key, c);
    return c;
  }

  // ─── Entry Point ──────────────────────────────────────────────────────────

  /**
   * Public entry point called by the service worker to launch a confetti animation.
   * Creates (or reuses) the shared canvas, spawns particles according to `settings`,
   * sets up cannon/vehicle visuals, and starts the animation loop if not already running.
   * @param {Object}   settings                  - User-configured animation settings.
   * @param {string}   settings.explosionMode    - How/where particles originate.
   * @param {number}   settings.particleCount    - Number of particles to spawn.
   * @param {number}   settings.particleSize     - Base size of each particle in pixels.
   * @param {string}   settings.confettiType     - Shape type for particles.
   * @param {number}   settings.animationSpeed   - Time-scale multiplier for physics.
   * @param {string[]} settings.colors           - Array of hex color strings.
   * @param {boolean}  settings.soundEnabled     - Whether to play a sound effect.
   */
  window.__joshConfettiLaunch = function (settings) {
    if (settings.soundEnabled) playConfettiSound(settings.explosionMode || 'center');

    const W = window.innerWidth;
    const H = window.innerHeight;

    // Get or create canvas
    if (!_canvas || !document.contains(_canvas)) {
      _canvas = document.createElement('canvas');
      _canvas.id = '__josh-confetti-canvas';
      Object.assign(_canvas.style, {
        position: 'fixed', top: '0', left: '0',
        width: '100%', height: '100%',
        pointerEvents: 'none', zIndex: '2147483647'
      });
      document.documentElement.appendChild(_canvas);
      _ctx        = _canvas.getContext('2d');
      _canvas.width  = W;
      _canvas.height = H;
      _particles  = [];
    }

    const count  = Math.max(1, Math.min(5000, settings.particleCount || 750));
    const colors = (settings.colors && settings.colors.length > 0)
      ? settings.colors
      : DEFAULT_COLORS;

    // Set up cannon/vehicle visuals BEFORE creating particles (fireworks mode needs _vehicle)
    const mode = settings.explosionMode || 'bottom-up';
    if (mode === 'cannon-left' || mode === 'side-to-side') {
      _cannons.push({ side: 'left',  y: H * 0.45, opacity: 1, flash: 1, age: 0 });
    }
    if (mode === 'cannon-right' || mode === 'side-to-side') {
      _cannons.push({ side: 'right', y: H * 0.45, opacity: 1, flash: 1, age: 0 });
    }
    if (mode === 'fireworks') {
      const spd = Math.max(0.05, settings.animationSpeed || 1);
      const imgSc = Math.max(0.15, Math.min(0.28, W / 7000));
      const dw = 2048 * imgSc, dh = 1024 * imgSc;
      _vehicle = {
        opacity: 1, age: 0, spd,
        tubeFlash: [0, 0, 0, 0, 0],
        tubeTriggered: [false, false, false, false, false],
        dw, dh, dx: (W - dw) / 2, dy: H - dh
      };
      if (!_vehicleImg) {
        const img = new Image();
        img.onload = () => { _vehicleImg = img; };
        img.src = chrome.runtime.getURL('profile-view-of-john-deere-gator-pulling-a-firewor.svg');
      }
    }

    for (let i = 0; i < count; i++) {
      _particles.push(createParticle(settings, W, H, colors));
    }

    if (!_animating) {
      _animating = true;
      requestAnimationFrame(_loop);
    }
  };

  // ─── Animation Loop ───────────────────────────────────────────────────────

  /**
   * Per-frame animation loop driven by requestAnimationFrame.
   * Updates and draws all live particles, cannons, and the vehicle overlay.
   * Tears down the canvas and resets state when everything has faded out.
   */
  function _loop() {
    if (!_canvas || !document.contains(_canvas)) {
      _animating = false; _particles = []; return;
    }

    const W = _canvas.width, H = _canvas.height;
    _ctx.clearRect(0, 0, W, H);

    // Track particles separately so the vehicle knows when to start fading
    let particleAlive = 0;
    for (const p of _particles) {
      if (p.dead) continue;
      updateParticle(p, W, H);
      if (p.delay > 0) { particleAlive++; continue; } // waiting to spawn — count alive but don't draw
      drawParticle(_ctx, p);
      particleAlive++;
    }

    // Prune dead particles when list grows large
    if (_particles.length > 3000) {
      _particles = _particles.filter(p => !p.dead);
    }

    let alive = particleAlive;

    // Draw cannons and keep alive while visible
    for (let i = _cannons.length - 1; i >= 0; i--) {
      const c = _cannons[i];
      c.age++;
      c.flash = Math.max(0, c.flash - 0.07);
      if (c.age > 60) c.opacity = Math.max(0, c.opacity - 0.008);
      drawCannon(_ctx, c, W);
      if (c.opacity <= 0) { _cannons.splice(i, 1); } else { alive++; }
    }

    // Draw Gator + fireworks trailer for fireworks mode
    if (_vehicle) {
      _vehicle.age += _vehicle.spd;
      // Trigger each tube flash once, using >= so fractional age steps don't miss the threshold
      for (let t = 0; t < 5; t++) {
        if (!_vehicle.tubeTriggered[t] && _vehicle.age >= t * 15 + 1) {
          _vehicle.tubeFlash[t] = 1.0;
          _vehicle.tubeTriggered[t] = true;
        }
      }
      for (let t = 0; t < 5; t++) {
        _vehicle.tubeFlash[t] = Math.max(0, _vehicle.tubeFlash[t] - 0.055 * _vehicle.spd);
      }
      // Stay fully visible while particles are alive; fade quickly once they're all gone
      if (particleAlive === 0) _vehicle.opacity = Math.max(0, _vehicle.opacity - 0.04);
      drawGatorTrailer(_ctx, _vehicle);
      if (_vehicle.opacity <= 0) _vehicle = null;
      else alive++;
    }

    if (alive === 0) {
      _canvas.remove();
      _canvas = null; _particles = []; _cannons = []; _vehicle = null; _animating = false;
      return;
    }

    requestAnimationFrame(_loop);
  }

  // ─── Particle Factory ─────────────────────────────────────────────────────

  /**
   * Creates and returns a new particle object with initial position, velocity,
   * and visual properties derived from the current settings and explosion mode.
   * @param {Object}   settings            - User-configured animation settings.
   * @param {number}   W                   - Canvas width in pixels.
   * @param {number}   H                   - Canvas height in pixels.
   * @param {string[]} colors              - Array of hex color strings to sample from.
   * @returns {Object} A particle object ready to be updated and drawn each frame.
   */
  function createParticle(settings, W, H, colors) {
    const color   = colors[Math.floor(Math.random() * colors.length)];
    const emoji   = EMOJIS[Math.floor(Math.random() * EMOJIS.length)];
    const sizeBase = settings.particleSize || 10;
    const size    = sizeBase * (0.6 + Math.random() * 0.8);
    // spd scales the physics time-step, NOT initial velocity — same trajectory, different playback speed
    const spd     = Math.max(0.05, settings.animationSpeed || 1);
    const gravity = 0.26;
    const type    = settings.confettiType || 'classic';
    const mode    = settings.explosionMode || 'bottom-up';

    let x, y, vx, vy, delay = 0, lifetime = 0, age = 0;
    const sp = 9 + Math.random() * 9;

    switch (mode) {
      case 'bottom-up':
        x  = Math.random() * W;
        y  = H + 10;
        vx = (Math.random() - 0.5) * 26;
        vy = -(sp + Math.random() * 14);
        break;

      case 'top-down':
        x  = Math.random() * W;
        y  = -size;
        vx = (Math.random() - 0.5) * 22;
        vy = 2 + Math.random() * 5;
        delay = Math.random() * 180; // stagger release over ~3 seconds (180 frames @ 60fps)
        break;

      case 'center': {
        const angle = Math.random() * Math.PI * 2;
        const speed = sp * (1.2 + Math.random() * 1.4);
        x  = W * 0.5;
        y  = H * 0.45;
        vx = Math.cos(angle) * speed;
        vy = Math.sin(angle) * speed - 3;
        break;
      }

      case 'cannon-left':
      case 'cannon-right': {
        const fromLeft = mode === 'cannon-left';
        x  = fromLeft ? -10 : W + 10;
        y  = H * 0.2 + Math.random() * H * 0.6;
        vx = (fromLeft ? 1 : -1) * (sp * 1.8 + Math.random() * 6);
        vy = (Math.random() - 0.5) * 26 - 4;
        delay = Math.random() * 180;
        break;
      }

      case 'side-to-side':
        if (Math.random() < 0.5) { x = -10;    vx =  sp * 1.6 + Math.random() * 6; }
        else                      { x = W + 10; vx = -(sp * 1.6 + Math.random() * 6); }
        y  = H * 0.15 + Math.random() * H * 0.7;
        vy = (Math.random() - 0.5) * 22 - 2;
        delay = Math.random() * 180;
        break;

      case 'fireworks': {
        // All particles launch from a tube on the trailer
        const tubeIdx = Math.floor(Math.random() * TUBE_FRACTIONS_X.length);
        const { dw, dh, dx, dy } = _vehicle;
        x  = dx + TUBE_FRACTIONS_X[tubeIdx] * dw + (Math.random() - 0.5) * 10;
        y  = dy + TUBE_FRACTION_Y * dh;
        // Shoot upward with wide spread
        const angle = -Math.PI / 2 + (Math.random() - 0.5) * Math.PI * 0.75;
        const speed = sp * (2.2 + Math.random() * 2);
        vx = Math.cos(angle) * speed;
        vy = Math.sin(angle) * speed;
        delay    = tubeIdx * 15 + Math.floor(Math.random() * 8);
        lifetime = 150 + Math.floor(Math.random() * 100);
        break;
      }

      default:
        x = Math.random() * W; y = H + 10;
        vx = (Math.random() - 0.5) * 6;
        vy = -(sp + Math.random() * 6);
    }

    return {
      x, y, vx, vy, color, emoji, size, type, gravity, spd, delay, lifetime, age,
      rotation:      Math.random() * Math.PI * 2,
      rotationSpeed: (Math.random() - 0.5) * 0.22,
      wobble:        Math.random() * Math.PI * 2,
      phase:         Math.random() * Math.PI * 2,
      opacity: 1,
      dead: false
    };
  }

  // ─── Physics Update ───────────────────────────────────────────────────────

  /**
   * Advances a single particle's physics state by one time step.
   * Applies gravity, drag, rotation, wobble, and opacity fade.
   * Marks the particle dead when it leaves the viewport or fully fades out.
   * @param {Object} p - The particle object to update (mutated in place).
   * @param {number} W - Canvas width in pixels (used for out-of-bounds check).
   * @param {number} H - Canvas height in pixels (used for fade and out-of-bounds check).
   */
  function updateParticle(p, W, H) {
    // spd is a time-scale multiplier: fast = same trajectory, fewer frames to complete it
    const s = p.spd;
    if (p.delay > 0) { p.delay -= s; return; }

    // Apply gravity and drag scaled by the time step
    const drag = Math.pow(0.992, s);
    p.vy += p.gravity * s;
    p.vx *= drag;
    p.vy *= drag;
    p.x  += p.vx * s;
    p.y  += p.vy * s;
    p.rotation += p.rotationSpeed * s;
    p.wobble   += 0.12 * s;
    p.phase    += 0.08 * s;

    // Fade: lifetime-based for fireworks, position-based for everything else
    if (p.lifetime > 0) {
      p.age += s;
      const fadeStart = p.lifetime * 0.6;
      if (p.age > fadeStart) {
        p.opacity = Math.max(0, 1 - (p.age - fadeStart) / (p.lifetime - fadeStart));
      }
      if (p.age >= p.lifetime) { p.dead = true; return; }
    } else {
      const fs = H * 0.78;
      if (p.y > fs) p.opacity = Math.max(0, 1 - (p.y - fs) / (H * 0.28));
    }

    if (p.opacity <= 0 || p.y > H + 100 || p.y < -120 || p.x < -140 || p.x > W + 140) {
      p.dead = true;
    }
  }

  // ─── Dispatch Draw ────────────────────────────────────────────────────────

  /**
   * Draws a single particle onto the canvas by dispatching to the appropriate
   * shape renderer based on the particle's `type` property.
   * Saves and restores canvas state around the draw call.
   * @param {CanvasRenderingContext2D} ctx - The 2D rendering context to draw onto.
   * @param {Object}                  p   - The particle to draw.
   */
  function drawParticle(ctx, p) {
    ctx.save();
    ctx.globalAlpha = p.opacity;
    ctx.translate(p.x, p.y);
    ctx.rotate(p.rotation);

    switch (p.type) {
      case 'classic':    drawClassic(ctx, p);   break;
      case 'stars':      drawStar(ctx, p);      break;
      case 'circles':    drawCircle(ctx, p);    break;
      case 'ribbons':    drawRibbon(ctx, p);    break;
      case 'emoji':      drawEmoji(ctx, p);     break;
      case 'hearts':     drawHeart(ctx, p);     break;
      case 'diamonds':   drawDiamond(ctx, p);   break;
      case 'triangles':  drawTriangle(ctx, p);  break;
      case 'snowflakes': drawSnowflake(ctx, p); break;
      case 'sparks':     drawSpark(ctx, p);     break;
      case 'coins':      drawCoin(ctx, p);      break;
      case 'teardrops':  drawTeardrop(ctx, p);  break;
      default:           drawClassic(ctx, p);
    }

    ctx.restore();
  }

  // ─── Shape Renderers ──────────────────────────────────────────────────────

  /**
   * Draws a classic rectangular confetti piece, wobbling along its horizontal axis.
   * @param {CanvasRenderingContext2D} ctx - Canvas context (pre-translated/rotated).
   * @param {Object}                  p   - Particle with `size`, `color`, and `wobble`.
   */
  function drawClassic(ctx, p) {
    const w = p.size * Math.max(0.05, Math.abs(Math.cos(p.wobble)));
    const h = p.size * 0.45;
    ctx.fillStyle = p.color;
    ctx.fillRect(-w * 0.5, -h * 0.5, w, h);
  }

  /**
   * Draws a 5-pointed star particle.
   * @param {CanvasRenderingContext2D} ctx - Canvas context (pre-translated/rotated).
   * @param {Object}                  p   - Particle with `size` and `color`.
   */
  function drawStar(ctx, p) {
    ctx.fillStyle = p.color;
    const R = p.size * 0.55, ir = R * 0.42;
    ctx.beginPath();
    for (let i = 0; i < 5; i++) {
      const a  = (i * 2 * Math.PI) / 5 - Math.PI / 2;
      const ia = a + Math.PI / 5;
      if (i === 0) ctx.moveTo(Math.cos(a) * R,  Math.sin(a) * R);
      else         ctx.lineTo(Math.cos(a) * R,  Math.sin(a) * R);
      ctx.lineTo(Math.cos(ia) * ir, Math.sin(ia) * ir);
    }
    ctx.closePath();
    ctx.fill();
  }

  /**
   * Draws a solid circle particle.
   * @param {CanvasRenderingContext2D} ctx - Canvas context (pre-translated/rotated).
   * @param {Object}                  p   - Particle with `size` and `color`.
   */
  function drawCircle(ctx, p) {
    ctx.fillStyle = p.color;
    ctx.beginPath();
    ctx.arc(0, 0, p.size * 0.5, 0, Math.PI * 2);
    ctx.fill();
  }

  /**
   * Draws a wavy ribbon particle as a stroked sinusoidal path.
   * @param {CanvasRenderingContext2D} ctx - Canvas context (pre-translated/rotated).
   * @param {Object}                  p   - Particle with `size`, `color`, and `phase`.
   */
  function drawRibbon(ctx, p) {
    ctx.strokeStyle = p.color;
    ctx.lineWidth   = 2.5;
    ctx.lineCap     = 'round';
    const len = p.size * 2.2;
    ctx.beginPath();
    for (let i = 0; i <= len; i++) {
      const rx = i - len * 0.5;
      const ry = Math.sin(p.phase + i * 0.28) * 4;
      if (i === 0) ctx.moveTo(rx, ry);
      else         ctx.lineTo(rx, ry);
    }
    ctx.stroke();
  }

  /**
   * Draws an emoji particle using a pre-rendered off-screen canvas.
   * Cancels the inherited rotation and applies a gentle wobble instead.
   * @param {CanvasRenderingContext2D} ctx - Canvas context (pre-translated/rotated).
   * @param {Object}                  p   - Particle with `emoji`, `size`, `rotation`, and `wobble`.
   */
  function drawEmoji(ctx, p) {
    ctx.rotate(-p.rotation);
    ctx.rotate(Math.sin(p.wobble) * 0.35);
    const c = _getEmojiCanvas(p.emoji, p.size);
    ctx.drawImage(c, -c.width / 2, -c.height / 2);
  }

  // ─── New Shape Renderers ──────────────────────────────────────────────────

  /**
   * Draws a heart-shaped particle using two bezier curves.
   * @param {CanvasRenderingContext2D} ctx - Canvas context (pre-translated/rotated).
   * @param {Object}                  p   - Particle with `size` and `color`.
   */
  function drawHeart(ctx, p) {
    ctx.fillStyle = p.color;
    const s = p.size * 0.5;
    ctx.beginPath();
    ctx.moveTo(0, s * 0.35);
    ctx.bezierCurveTo( s * 1.0, -s * 0.6,  s * 1.8,  s * 0.5, 0, s * 1.3);
    ctx.bezierCurveTo(-s * 1.8,  s * 0.5, -s * 1.0, -s * 0.6, 0, s * 0.35);
    ctx.closePath();
    ctx.fill();
  }

  /**
   * Draws a diamond (rhombus) particle.
   * @param {CanvasRenderingContext2D} ctx - Canvas context (pre-translated/rotated).
   * @param {Object}                  p   - Particle with `size` and `color`.
   */
  function drawDiamond(ctx, p) {
    ctx.fillStyle = p.color;
    const s = p.size * 0.55;
    ctx.beginPath();
    ctx.moveTo(0, -s);
    ctx.lineTo(s * 0.62, 0);
    ctx.lineTo(0,  s);
    ctx.lineTo(-s * 0.62, 0);
    ctx.closePath();
    ctx.fill();
  }

  /**
   * Draws an equilateral triangle particle.
   * @param {CanvasRenderingContext2D} ctx - Canvas context (pre-translated/rotated).
   * @param {Object}                  p   - Particle with `size` and `color`.
   */
  function drawTriangle(ctx, p) {
    ctx.fillStyle = p.color;
    const s = p.size * 0.6;
    ctx.beginPath();
    ctx.moveTo(0, -s);
    ctx.lineTo(s * 0.866, s * 0.5);
    ctx.lineTo(-s * 0.866, s * 0.5);
    ctx.closePath();
    ctx.fill();
  }

  /**
   * Draws a 6-armed snowflake particle with branch ticks at 60% of each arm.
   * @param {CanvasRenderingContext2D} ctx - Canvas context (pre-translated/rotated).
   * @param {Object}                  p   - Particle with `size` and `color`.
   */
  function drawSnowflake(ctx, p) {
    ctx.strokeStyle = p.color;
    ctx.lineWidth = Math.max(1, p.size * 0.1);
    ctx.lineCap = 'round';
    const r = p.size * 0.52;
    for (let i = 0; i < 6; i++) {
      const a = (i * Math.PI) / 3;
      const ax = Math.cos(a) * r, ay = Math.sin(a) * r;
      ctx.beginPath();
      ctx.moveTo(0, 0); ctx.lineTo(ax, ay); ctx.stroke();
      // Branch ticks at 60% out
      const bx = ax * 0.6, by = ay * 0.6, ba = a + Math.PI / 2, bl = r * 0.3;
      ctx.beginPath();
      ctx.moveTo(bx + Math.cos(ba) * bl, by + Math.sin(ba) * bl);
      ctx.lineTo(bx - Math.cos(ba) * bl, by - Math.sin(ba) * bl);
      ctx.stroke();
    }
  }

  /**
   * Draws a 4-point elongated star (spark) particle.
   * @param {CanvasRenderingContext2D} ctx - Canvas context (pre-translated/rotated).
   * @param {Object}                  p   - Particle with `size` and `color`.
   */
  function drawSpark(ctx, p) {
    ctx.fillStyle = p.color;
    const R = p.size * 0.56, ir = R * 0.18;
    ctx.beginPath();
    for (let i = 0; i < 4; i++) {
      const a  = (i * Math.PI) / 2 - Math.PI / 4;
      const ia = a + Math.PI / 4;
      if (i === 0) ctx.moveTo(Math.cos(a) * R,  Math.sin(a) * R);
      else         ctx.lineTo(Math.cos(a) * R,  Math.sin(a) * R);
      ctx.lineTo(Math.cos(ia) * ir, Math.sin(ia) * ir);
    }
    ctx.closePath();
    ctx.fill();
  }

  /**
   * Draws a coin particle as a wobbling ellipse with an optional inner ring highlight.
   * The horizontal radius collapses as the coin turns edge-on (via cosine wobble).
   * @param {CanvasRenderingContext2D} ctx - Canvas context (pre-translated/rotated).
   * @param {Object}                  p   - Particle with `size`, `color`, and `wobble`.
   */
  function drawCoin(ctx, p) {
    const rx = p.size * 0.45 * Math.max(0.08, Math.abs(Math.cos(p.wobble)));
    const ry = p.size * 0.45;
    ctx.fillStyle = p.color;
    ctx.beginPath();
    ctx.ellipse(0, 0, rx, ry, 0, 0, Math.PI * 2);
    ctx.fill();
    if (Math.abs(Math.cos(p.wobble)) > 0.5) {
      ctx.strokeStyle = 'rgba(255,255,255,0.32)';
      ctx.lineWidth = Math.max(0.5, p.size * 0.06);
      ctx.beginPath();
      ctx.ellipse(0, 0, rx * 0.65, ry * 0.65, 0, 0, Math.PI * 2);
      ctx.stroke();
    }
  }

  /**
   * Draws a teardrop particle using an arc for the rounded top and bezier curves
   * that taper to a point at the bottom.
   * @param {CanvasRenderingContext2D} ctx - Canvas context (pre-translated/rotated).
   * @param {Object}                  p   - Particle with `size` and `color`.
   */
  function drawTeardrop(ctx, p) {
    ctx.fillStyle = p.color;
    const s = p.size * 0.5;
    ctx.beginPath();
    ctx.arc(0, -s * 0.3, s * 0.65, Math.PI, 0);
    ctx.bezierCurveTo( s * 0.65,  s * 0.2,  s * 0.2, s * 1.0,  0, s * 1.1);
    ctx.bezierCurveTo(-s * 0.2,   s * 1.0, -s * 0.65, s * 0.2, -s * 0.65, -s * 0.3);
    ctx.closePath();
    ctx.fill();
  }

  // ─── Gator + Fireworks Trailer Renderer ──────────────────────────────────

  /**
   * Draws the Gator vehicle and fireworks trailer SVG onto the canvas, along with
   * radial gradient flash effects for each tube that has recently fired.
   * No-ops if the vehicle image has not yet loaded.
   * @param {CanvasRenderingContext2D} ctx - The 2D rendering context to draw onto.
   * @param {Object}                  v   - Vehicle state with position, opacity, and tubeFlash arrays.
   */
  function drawGatorTrailer(ctx, v) {
    if (!_vehicleImg) return;
    ctx.save();
    ctx.globalAlpha = v.opacity;

    const { dw, dh, dx, dy } = v;
    ctx.drawImage(_vehicleImg, dx, dy, dw, dh);

    // Tube flash effects (5 tubes on the fireworks trailer)
    TUBE_FRACTIONS_X.forEach((xf, i) => {
      if (v.tubeFlash[i] > 0) {
        const tx = dx + xf * dw;
        const ty = dy + TUBE_FRACTION_Y * dh;
        ctx.save();
        ctx.globalAlpha = v.opacity * v.tubeFlash[i];
        const fl = ctx.createRadialGradient(tx, ty, 0, tx, ty, 36);
        fl.addColorStop(0, 'rgba(255,230,80,1)');
        fl.addColorStop(0.5, 'rgba(255,100,0,0.7)');
        fl.addColorStop(1, 'rgba(255,50,0,0)');
        ctx.fillStyle = fl;
        ctx.beginPath(); ctx.arc(tx, ty, 36 * v.tubeFlash[i], 0, Math.PI * 2); ctx.fill();
        ctx.restore();
      }
    });

    ctx.restore();
  }


  // ─── Cannon Renderer ──────────────────────────────────────────────────────

  /**
   * Draws a decorative cannon (barrel, carriage, wheels, and muzzle flash) on the
   * left or right edge of the canvas. The cannon fades out over time after firing.
   * @param {CanvasRenderingContext2D} ctx - The 2D rendering context to draw onto.
   * @param {Object}                  c   - Cannon state: `side`, `y`, `opacity`, `flash`, `age`.
   * @param {number}                  W   - Canvas width in pixels (used to position the right cannon).
   */
  function drawCannon(ctx, c, W) {
    ctx.save();
    ctx.globalAlpha = c.opacity;
    ctx.translate(c.side === 'left' ? 0 : W, c.y);
    if (c.side === 'right') ctx.scale(-1, 1);

    // Muzzle flash
    if (c.flash > 0) {
      ctx.save();
      ctx.globalAlpha = c.opacity * c.flash;
      ctx.translate(100, -20);
      const fl = ctx.createRadialGradient(0, 0, 0, 0, 0, 45);
      fl.addColorStop(0,   'rgba(255,240,100,1)');
      fl.addColorStop(0.4, 'rgba(255,140,20,0.8)');
      fl.addColorStop(1,   'rgba(255,60,0,0)');
      ctx.fillStyle = fl;
      ctx.beginPath();
      ctx.arc(0, 0, 45 * c.flash, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }

    // Barrel (angled ~-12° upward)
    ctx.save();
    ctx.rotate(-0.21);
    const bg = ctx.createLinearGradient(0, -11, 0, 11);
    bg.addColorStop(0,   '#999');
    bg.addColorStop(0.4, '#bbb');
    bg.addColorStop(1,   '#555');
    ctx.fillStyle = '#2a2a2a'; // shadow
    ctx.beginPath(); ctx.roundRect(9, -9, 92, 22, [0, 8, 8, 0]); ctx.fill();
    ctx.fillStyle = bg;
    ctx.beginPath(); ctx.roundRect(10, -11, 90, 22, [0, 8, 8, 0]); ctx.fill();
    // Decorative bands
    ctx.fillStyle = 'rgba(0,0,0,0.25)';
    [32, 58, 80].forEach(bx => { ctx.fillRect(bx, -11, 6, 22); });
    // Highlight
    ctx.fillStyle = 'rgba(255,255,255,0.18)';
    ctx.beginPath(); ctx.roundRect(13, -9, 82, 6, 3); ctx.fill();
    ctx.restore();

    // Carriage body
    const cg = ctx.createLinearGradient(0, 6, 0, 32);
    cg.addColorStop(0, '#b06830');
    cg.addColorStop(1, '#6b3a12');
    ctx.fillStyle = cg;
    ctx.beginPath(); ctx.roundRect(4, 6, 80, 24, 4); ctx.fill();
    ctx.strokeStyle = '#3a1f0a'; ctx.lineWidth = 1.5; ctx.stroke();
    ctx.fillStyle = 'rgba(255,255,255,0.1)';
    ctx.beginPath(); ctx.roundRect(7, 8, 70, 7, 2); ctx.fill();

    // Wheels
    [20, 66].forEach(wx => {
      const wy = 38, r = 23;
      // Drop shadow
      ctx.fillStyle = 'rgba(0,0,0,0.25)';
      ctx.beginPath(); ctx.ellipse(wx + 4, wy + 4, r, r * 0.28, 0, 0, Math.PI * 2); ctx.fill();
      // Rim
      ctx.fillStyle = '#4a2508';
      ctx.beginPath(); ctx.arc(wx, wy, r, 0, Math.PI * 2); ctx.fill();
      ctx.strokeStyle = '#2a1204'; ctx.lineWidth = 2.5; ctx.stroke();
      // Inner ring
      ctx.strokeStyle = '#7a4518'; ctx.lineWidth = 3;
      ctx.beginPath(); ctx.arc(wx, wy, r - 6, 0, Math.PI * 2); ctx.stroke();
      // Spokes
      ctx.strokeStyle = '#8a5020'; ctx.lineWidth = 2;
      for (let s = 0; s < 6; s++) {
        const a = (s * Math.PI) / 3;
        ctx.beginPath();
        ctx.moveTo(wx, wy);
        ctx.lineTo(wx + Math.cos(a) * (r - 2), wy + Math.sin(a) * (r - 2));
        ctx.stroke();
      }
      // Hub
      ctx.fillStyle = '#aaa';
      ctx.beginPath(); ctx.arc(wx, wy, 5, 0, Math.PI * 2); ctx.fill();
      ctx.strokeStyle = '#777'; ctx.lineWidth = 1; ctx.stroke();
    });

    ctx.restore();
  }
}
