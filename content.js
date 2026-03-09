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

  // ─── Shared animation state ───────────────────────────────────────────────

  let _canvas    = null;
  let _ctx       = null;
  let _particles = [];
  let _animating = false;

  // ─── Entry Point ──────────────────────────────────────────────────────────

  window.__joshConfettiLaunch = function (settings) {
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

    const count  = Math.max(1, Math.min(1000, settings.particleCount || 150));
    const colors = (settings.colors && settings.colors.length > 0)
      ? settings.colors
      : DEFAULT_COLORS;

    for (let i = 0; i < count; i++) {
      _particles.push(createParticle(settings, W, H, colors));
    }

    if (!_animating) {
      _animating = true;
      requestAnimationFrame(_loop);
    }
  };

  // ─── Animation Loop ───────────────────────────────────────────────────────

  function _loop() {
    if (!_canvas || !document.contains(_canvas)) {
      _animating = false; _particles = []; return;
    }

    const W = _canvas.width, H = _canvas.height;
    _ctx.clearRect(0, 0, W, H);

    let alive = 0;
    for (const p of _particles) {
      if (p.dead) continue;
      updateParticle(p, W, H);
      drawParticle(_ctx, p);
      alive++;
    }

    // Prune dead particles when list grows large
    if (_particles.length > 3000) {
      _particles = _particles.filter(p => !p.dead);
    }

    if (alive === 0) {
      _canvas.remove();
      _canvas = null; _particles = []; _animating = false;
      return;
    }

    requestAnimationFrame(_loop);
  }

  // ─── Gravity resolver ─────────────────────────────────────────────────────

  function resolveGravity(animationDirection) {
    const dirs = animationDirection || ['random'];
    let pool;

    if (dirs.includes('random') || dirs.length === 0) {
      pool = ['fall-down', 'rise-up'];
    } else {
      pool = dirs.filter(d => d === 'fall-down' || d === 'rise-up');
      if (pool.length === 0) pool = ['fall-down'];
    }

    const picked = pool[Math.floor(Math.random() * pool.length)];
    // rise-up uses gentle negative gravity so particles float up gracefully
    return picked === 'rise-up' ? -0.10 : 0.26;
  }

  // ─── Particle Factory ─────────────────────────────────────────────────────

  function createParticle(settings, W, H, colors) {
    const color   = colors[Math.floor(Math.random() * colors.length)];
    const emoji   = EMOJIS[Math.floor(Math.random() * EMOJIS.length)];
    const sizeBase = settings.particleSize || 10;
    const size    = sizeBase * (0.6 + Math.random() * 0.8);
    const gravity = resolveGravity(settings.animationDirection);
    const type    = settings.confettiType || 'classic';
    const mode    = settings.explosionMode || 'bottom-up';

    let x, y, vx, vy;
    const sp = 9 + Math.random() * 9;

    switch (mode) {
      case 'bottom-up':
        x  = Math.random() * W;
        y  = H + 10;
        vx = (Math.random() - 0.5) * 8;
        vy = -(sp + Math.random() * 8);
        break;

      case 'top-down':
        x  = Math.random() * W;
        y  = -size;
        vx = (Math.random() - 0.5) * 5;
        vy = 2 + Math.random() * 3;
        break;

      case 'center': {
        const angle = Math.random() * Math.PI * 2;
        const speed = sp * (0.6 + Math.random() * 0.8);
        x  = W * 0.5;
        y  = H * 0.45;
        vx = Math.cos(angle) * speed;
        vy = Math.sin(angle) * speed - 3;
        break;
      }

      case 'cannon-left':
        x  = -10;
        y  = H * 0.35 + Math.random() * H * 0.3;
        vx = sp * 1.6 + Math.random() * 4;
        vy = (Math.random() - 0.5) * 10 - 4;
        break;

      case 'cannon-right':
        x  = W + 10;
        y  = H * 0.35 + Math.random() * H * 0.3;
        vx = -(sp * 1.6 + Math.random() * 4);
        vy = (Math.random() - 0.5) * 10 - 4;
        break;

      case 'side-to-side':
        if (Math.random() < 0.5) { x = -10;    vx =  sp * 1.4 + Math.random() * 4; }
        else                      { x = W + 10; vx = -(sp * 1.4 + Math.random() * 4); }
        y  = H * 0.25 + Math.random() * H * 0.5;
        vy = (Math.random() - 0.5) * 8 - 2;
        break;

      default:
        x = Math.random() * W; y = H + 10;
        vx = (Math.random() - 0.5) * 6;
        vy = -(sp + Math.random() * 6);
    }

    return {
      x, y, vx, vy, color, emoji, size, type, gravity,
      rotation:      Math.random() * Math.PI * 2,
      rotationSpeed: (Math.random() - 0.5) * 0.22,
      wobble:        Math.random() * Math.PI * 2,
      phase:         Math.random() * Math.PI * 2,
      opacity: 1,
      dead: false
    };
  }

  // ─── Physics Update ───────────────────────────────────────────────────────

  function updateParticle(p, W, H) {
    p.vy += p.gravity;
    p.vx *= 0.992;
    p.vy *= 0.992;
    p.x  += p.vx;
    p.y  += p.vy;
    p.rotation += p.rotationSpeed;
    p.wobble   += 0.12;
    p.phase    += 0.08;

    // Fade based on gravity direction
    if (p.gravity >= 0) {
      const fs = H * 0.78;
      if (p.y > fs) p.opacity = Math.max(0, 1 - (p.y - fs) / (H * 0.28));
    } else {
      const fe = H * 0.22;
      if (p.y < fe) p.opacity = Math.max(0, 1 - (fe - p.y) / (H * 0.28));
    }

    if (p.opacity <= 0 || p.y > H + 100 || p.y < -120 || p.x < -140 || p.x > W + 140) {
      p.dead = true;
    }
  }

  // ─── Dispatch Draw ────────────────────────────────────────────────────────

  function drawParticle(ctx, p) {
    ctx.save();
    ctx.globalAlpha = p.opacity;
    ctx.translate(p.x, p.y);
    ctx.rotate(p.rotation);

    switch (p.type) {
      case 'classic':  drawClassic(ctx, p);  break;
      case 'stars':    drawStar(ctx, p);     break;
      case 'circles':  drawCircle(ctx, p);   break;
      case 'ribbons':  drawRibbon(ctx, p);   break;
      case 'emoji':    drawEmoji(ctx, p);    break;
      default:         drawClassic(ctx, p);
    }

    ctx.restore();
  }

  // ─── Shape Renderers ──────────────────────────────────────────────────────

  function drawClassic(ctx, p) {
    const w = p.size * Math.max(0.05, Math.abs(Math.cos(p.wobble)));
    const h = p.size * 0.45;
    ctx.fillStyle = p.color;
    ctx.fillRect(-w * 0.5, -h * 0.5, w, h);
  }

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

  function drawCircle(ctx, p) {
    ctx.fillStyle = p.color;
    ctx.beginPath();
    ctx.arc(0, 0, p.size * 0.5, 0, Math.PI * 2);
    ctx.fill();
  }

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

  function drawEmoji(ctx, p) {
    ctx.rotate(-p.rotation);
    ctx.rotate(Math.sin(p.wobble) * 0.35);
    ctx.font         = `${Math.round(p.size * 1.6)}px serif`;
    ctx.textAlign    = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(p.emoji, 0, 0);
  }
}
