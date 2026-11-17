/**
 * Dynamic Seasonal Particle & Interactive Light Trail Canvas Engine
 * Renders organic seasonal motifs (sakura petals, celestial stars/fireflies, ginkgo/bokeh, ice crystals),
 * cursor stardust trails, and click golden ripples with reduced-motion adaptation.
 */
class SeasonalParticles {
  constructor(canvasId) {
    this.canvas = document.getElementById(canvasId);
    if (!this.canvas) return;
    this.ctx = this.canvas.getContext('2d');
    this.season = 'spring';
    this.particles = [];
    this.trailParticles = [];
    this.ripples = [];
    this.width = 0;
    this.height = 0;
    this.animId = null;
    this.mouse = { x: -1000, y: -1000 };
    this.lastTrailTime = 0;
    this.reducedMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    this.init();
  }

  init() {
    this.resize();
    window.addEventListener('resize', () => this.resize());

    window.addEventListener('mousemove', (e) => {
      this.mouse.x = e.clientX;
      this.mouse.y = e.clientY;
      this.spawnTrailParticle(e.clientX, e.clientY);
    });

    window.addEventListener('touchmove', (e) => {
      if (e.touches && e.touches.length > 0) {
        const touch = e.touches[0];
        this.mouse.x = touch.clientX;
        this.mouse.y = touch.clientY;
        this.spawnTrailParticle(touch.clientX, touch.clientY);
      }
    }, { passive: true });

    window.addEventListener('pointerdown', (e) => {
      this.spawnRipple(e.clientX, e.clientY);
    });

    if (window.matchMedia) {
      window.matchMedia('(prefers-reduced-motion: reduce)').addEventListener('change', (e) => {
        this.reducedMotion = e.matches;
        this.createParticles();
      });
    }

    this.createParticles();
    this.animate();
  }

  resize() {
    this.width = this.canvas.width = window.innerWidth;
    this.height = this.canvas.height = window.innerHeight;
  }

  setSeason(season) {
    this.season = season;
    this.createParticles();
  }

  getSeasonAccentRgba(alpha) {
    switch (this.season) {
      case 'spring':
        return `rgba(201, 168, 106, ${alpha})`;
      case 'summer':
        return `rgba(212, 175, 55, ${alpha})`;
      case 'autumn':
        return `rgba(200, 122, 91, ${alpha})`;
      case 'winter':
        return `rgba(185, 208, 220, ${alpha})`;
      default:
        return `rgba(201, 168, 106, ${alpha})`;
    }
  }

  spawnTrailParticle(x, y) {
    const now = performance.now();
    const interval = this.reducedMotion ? 90 : 32;
    if (now - this.lastTrailTime < interval) return;
    this.lastTrailTime = now;

    if (this.trailParticles.length > 48) {
      this.trailParticles.shift();
    }

    const colorPool = {
      spring: Math.random() > 0.4 ? '240, 196, 200' : '201, 168, 106',
      summer: Math.random() > 0.35 ? '212, 175, 55' : '226, 232, 240',
      autumn: Math.random() > 0.45 ? '200, 122, 91' : '214, 168, 110',
      winter: Math.random() > 0.4 ? '185, 210, 222' : '255, 255, 255'
    };

    const rgb = colorPool[this.season] || '201, 168, 106';
    const speedFactor = this.reducedMotion ? 0.3 : 1;

    this.trailParticles.push({
      x: x + (Math.random() - 0.5) * 8,
      y: y + (Math.random() - 0.5) * 8,
      vx: (Math.random() - 0.5) * 0.65 * speedFactor,
      vy: (0.25 + Math.random() * 0.45) * speedFactor,
      size: 1.2 + Math.random() * 2.2,
      life: 1.0,
      decay: this.reducedMotion ? 0.035 : 0.022,
      rgb
    });
  }

  spawnRipple(x, y) {
    if (this.ripples.length > 8) {
      this.ripples.shift();
    }
    this.ripples.push({
      x,
      y,
      r: 3,
      maxR: this.reducedMotion ? 32 : 48,
      alpha: 0.55
    });
  }

  createParticles() {
    this.particles = [];
    const baseCount = Math.min(Math.floor((this.width * this.height) / 21000), 58);
    const count = this.reducedMotion ? Math.max(10, Math.floor(baseCount * 0.45)) : baseCount;

    for (let i = 0; i < count; i++) {
      this.particles.push(this.newParticle(true));
    }
  }

  newParticle(randomY = false) {
    const y = randomY ? Math.random() * this.height : -24;
    const x = Math.random() * this.width;
    const speedMult = this.reducedMotion ? 0.35 : 1;

    switch (this.season) {
      case 'spring': // Organic notched sakura blossom petals with 3D tumble roll
        return {
          x,
          y,
          size: 5 + Math.random() * 6.5,
          speedY: (0.45 + Math.random() * 0.85) * speedMult,
          speedX: (Math.random() * 0.7 - 0.15) * speedMult,
          angle: Math.random() * Math.PI * 2,
          rotSpeed: (Math.random() - 0.5) * 0.018 * speedMult,
          roll: Math.random() * Math.PI * 2,
          rollSpeed: (0.02 + Math.random() * 0.03) * speedMult,
          opacity: 0.28 + Math.random() * 0.42,
          oscAmp: (1.0 + Math.random() * 1.4) * speedMult,
          color: Math.random() > 0.3 ? 'rgba(238, 194, 200, ' : 'rgba(210, 224, 206, '
        };

      case 'summer': { // Midnight celestial stars (dots + 4-pt starbursts) & soft fireflies
        const kindRand = Math.random();
        const kind = kindRand > 0.78 ? 'firefly' : (kindRand > 0.55 ? 'starburst' : 'dot');
        return {
          kind,
          x,
          y: Math.random() * this.height,
          size: kind === 'firefly' ? 4 + Math.random() * 4.5 : (kind === 'starburst' ? 3 + Math.random() * 3.5 : 1 + Math.random() * 2),
          speedY: (Math.random() - 0.5) * 0.18 * speedMult,
          speedX: (Math.random() - 0.5) * 0.18 * speedMult,
          pulse: Math.random() * Math.PI * 2,
          pulseSpeed: (0.018 + Math.random() * 0.03) * speedMult,
          maxOpacity: kind === 'firefly' ? 0.45 + Math.random() * 0.3 : 0.4 + Math.random() * 0.5,
          color: Math.random() > 0.38 ? 'rgba(226, 232, 240, ' : 'rgba(212, 175, 55, '
        };
      }

      case 'autumn': { // Fan-shaped ginkgo leaves & afternoon sunbeam bokeh
        const isBokeh = Math.random() > 0.74;
        return {
          isBokeh,
          x,
          y: isBokeh ? Math.random() * this.height : y,
          size: isBokeh ? 12 + Math.random() * 16 : 5.5 + Math.random() * 6,
          speedY: (isBokeh ? 0.18 + Math.random() * 0.25 : 0.55 + Math.random() * 0.95) * speedMult,
          speedX: (Math.random() * 0.65 - 0.1) * speedMult,
          angle: Math.random() * Math.PI * 2,
          rotSpeed: (Math.random() - 0.5) * 0.02 * speedMult,
          opacity: isBokeh ? 0.06 + Math.random() * 0.08 : 0.26 + Math.random() * 0.44,
          oscAmp: (1.2 + Math.random() * 1.5) * speedMult,
          color: Math.random() > 0.45 ? 'rgba(200, 122, 91, ' : (Math.random() > 0.5 ? 'rgba(182, 134, 72, ' : 'rgba(140, 83, 62, ')
        };
      }

      case 'winter': { // Soft snow dust & symmetrical 6-fold ice crystals
        const isCrystal = Math.random() > 0.65;
        return {
          isCrystal,
          x,
          y,
          size: isCrystal ? 4.5 + Math.random() * 4.5 : 1.5 + Math.random() * 3.5,
          speedY: (0.35 + Math.random() * 0.75) * speedMult,
          speedX: (Math.random() - 0.5) * 0.28 * speedMult,
          angle: Math.random() * Math.PI * 2,
          rotSpeed: (Math.random() - 0.5) * 0.015 * speedMult,
          opacity: isCrystal ? 0.35 + Math.random() * 0.45 : 0.28 + Math.random() * 0.5,
          oscAmp: 0.7 * speedMult,
          color: Math.random() > 0.45 ? 'rgba(122, 145, 158, ' : 'rgba(255, 255, 255, '
        };
      }
    }
  }

  drawSakuraPetal(ctx, size) {
    ctx.beginPath();
    ctx.moveTo(0, size * 0.9);
    ctx.bezierCurveTo(-size * 0.9, size * 0.3, -size * 0.85, -size * 0.75, -size * 0.22, -size * 0.9);
    ctx.lineTo(0, -size * 0.58);
    ctx.lineTo(size * 0.22, -size * 0.9);
    ctx.bezierCurveTo(size * 0.85, -size * 0.75, size * 0.9, size * 0.3, 0, size * 0.9);
    ctx.closePath();
    ctx.fill();
  }

  drawGinkgoLeaf(ctx, size) {
    ctx.beginPath();
    ctx.moveTo(0, size * 0.95);
    ctx.lineTo(0, size * 0.35);
    ctx.bezierCurveTo(-size * 1.05, size * 0.1, -size * 1.0, -size * 0.75, -size * 0.15, -size * 0.85);
    ctx.lineTo(0, -size * 0.45);
    ctx.lineTo(size * 0.15, -size * 0.85);
    ctx.bezierCurveTo(size * 1.0, -size * 0.75, size * 1.05, size * 0.1, 0, size * 0.35);
    ctx.closePath();
    ctx.fill();
  }

  drawFourPointStar(ctx, x, y, r, colorStr) {
    ctx.save();
    ctx.translate(x, y);
    ctx.fillStyle = colorStr;
    ctx.beginPath();
    const inner = r * 0.24;
    for (let i = 0; i < 4; i++) {
      const a = (i * Math.PI) / 2;
      const aNext = a + Math.PI / 4;
      if (i === 0) ctx.moveTo(Math.cos(a) * r, Math.sin(a) * r);
      else ctx.lineTo(Math.cos(a) * r, Math.sin(a) * r);
      ctx.lineTo(Math.cos(aNext) * inner, Math.sin(aNext) * inner);
    }
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  }

  drawSixFoldCrystal(ctx, size, strokeColor) {
    ctx.strokeStyle = strokeColor;
    ctx.lineWidth = 0.9;
    ctx.lineCap = 'round';
    for (let i = 0; i < 3; i++) {
      const a = (i * Math.PI) / 3;
      const dx = Math.cos(a) * size;
      const dy = Math.sin(a) * size;
      ctx.beginPath();
      ctx.moveTo(-dx, -dy);
      ctx.lineTo(dx, dy);
      ctx.stroke();
    }
    // Delicate crystal ticks on primary axis
    const branch = size * 0.35;
    for (let i = 0; i < 6; i++) {
      const a = (i * Math.PI) / 3;
      const tipX = Math.cos(a) * size * 0.65;
      const tipY = Math.sin(a) * size * 0.65;
      ctx.beginPath();
      ctx.moveTo(tipX, tipY);
      ctx.lineTo(tipX + Math.cos(a + 0.6) * branch, tipY + Math.sin(a + 0.6) * branch);
      ctx.moveTo(tipX, tipY);
      ctx.lineTo(tipX + Math.cos(a - 0.6) * branch, tipY + Math.sin(a - 0.6) * branch);
      ctx.stroke();
    }
  }

  drawInteractiveEffects() {
    const ctx = this.ctx;

    // 1. Cursor stardust trail
    for (let i = this.trailParticles.length - 1; i >= 0; i--) {
      const tp = this.trailParticles[i];
      tp.x += tp.vx;
      tp.y += tp.vy;
      tp.life -= tp.decay;

      if (tp.life <= 0) {
        this.trailParticles.splice(i, 1);
        continue;
      }

      ctx.fillStyle = `rgba(${tp.rgb}, ${(tp.life * 0.65).toFixed(3)})`;
      ctx.beginPath();
      ctx.arc(tp.x, tp.y, tp.size * tp.life, 0, Math.PI * 2);
      ctx.fill();
    }

    // 2. Click golden concentric ripples
    for (let i = this.ripples.length - 1; i >= 0; i--) {
      const rp = this.ripples[i];
      rp.r += (rp.maxR - rp.r) * 0.12 + 0.6;
      rp.alpha *= 0.92;

      if (rp.alpha < 0.02 || rp.r >= rp.maxR) {
        this.ripples.splice(i, 1);
        continue;
      }

      ctx.save();
      ctx.strokeStyle = this.getSeasonAccentRgba(rp.alpha.toFixed(3));
      ctx.lineWidth = 0.9;
      ctx.beginPath();
      ctx.arc(rp.x, rp.y, rp.r, 0, Math.PI * 2);
      ctx.stroke();

      if (rp.r > 12) {
        ctx.strokeStyle = this.getSeasonAccentRgba((rp.alpha * 0.45).toFixed(3));
        ctx.lineWidth = 0.6;
        ctx.beginPath();
        ctx.arc(rp.x, rp.y, rp.r * 0.58, 0, Math.PI * 2);
        ctx.stroke();
      }
      ctx.restore();
    }
  }

  animate() {
    this.ctx.clearRect(0, 0, this.width, this.height);

    for (let i = 0; i < this.particles.length; i++) {
      const p = this.particles[i];

      // Subtle reaction to mouse position
      const dx = this.mouse.x - p.x;
      const dy = this.mouse.y - p.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist < 120 && dist > 0) {
        const force = ((120 - dist) / 120) * 0.55;
        p.x -= (dx / dist) * force;
        p.y -= (dy / dist) * force;
      }

      if (this.season === 'summer') {
        p.pulse += p.pulseSpeed;
        const currentOpacity = (Math.sin(p.pulse) * 0.5 + 0.5) * p.maxOpacity;
        const fillStr = p.color + currentOpacity.toFixed(3) + ')';

        if (p.kind === 'firefly') {
          const grad = this.ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.size * 2.4);
          grad.addColorStop(0, `rgba(212, 175, 55, ${currentOpacity.toFixed(3)})`);
          grad.addColorStop(1, 'rgba(212, 175, 55, 0)');
          this.ctx.fillStyle = grad;
          this.ctx.beginPath();
          this.ctx.arc(p.x, p.y, p.size * 2.4, 0, Math.PI * 2);
          this.ctx.fill();
        } else if (p.kind === 'starburst') {
          this.drawFourPointStar(this.ctx, p.x, p.y, p.size, fillStr);
        } else {
          this.ctx.fillStyle = fillStr;
          this.ctx.beginPath();
          this.ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
          this.ctx.fill();
        }

        p.x += p.speedX;
        p.y += p.speedY;

        if (p.x < 0) p.x = this.width;
        if (p.x > this.width) p.x = 0;
        if (p.y < 0) p.y = this.height;
        if (p.y > this.height) p.y = 0;
      } else {
        p.y += p.speedY;
        p.x += p.speedX + Math.sin(p.y * 0.015) * (p.oscAmp || 1);
        p.angle += p.rotSpeed;

        this.ctx.save();
        this.ctx.translate(p.x, p.y);
        this.ctx.rotate(p.angle);
        const colorStr = p.color + p.opacity.toFixed(3) + ')';
        this.ctx.fillStyle = colorStr;

        if (this.season === 'spring') {
          p.roll += p.rollSpeed;
          const tumbleScale = Math.cos(p.roll) * 0.65 + 0.35;
          this.ctx.scale(1, tumbleScale);
          this.drawSakuraPetal(this.ctx, p.size);
        } else if (this.season === 'autumn') {
          if (p.isBokeh) {
            this.ctx.beginPath();
            for (let k = 0; k < 6; k++) {
              const a = (k * Math.PI) / 3;
              const bx = Math.cos(a) * p.size;
              const by = Math.sin(a) * p.size;
              if (k === 0) this.ctx.moveTo(bx, by);
              else this.ctx.lineTo(bx, by);
            }
            this.ctx.closePath();
            this.ctx.fill();
          } else {
            this.drawGinkgoLeaf(this.ctx, p.size);
          }
        } else if (this.season === 'winter') {
          if (p.isCrystal) {
            this.drawSixFoldCrystal(this.ctx, p.size, colorStr);
          } else {
            this.ctx.shadowBlur = 6;
            this.ctx.shadowColor = 'rgba(255, 255, 255, 0.55)';
            this.ctx.beginPath();
            this.ctx.arc(0, 0, p.size, 0, Math.PI * 2);
            this.ctx.fill();
          }
        }
        this.ctx.restore();

        if (p.y > this.height + 30 || p.x < -36 || p.x > this.width + 36) {
          this.particles[i] = this.newParticle(false);
        }
      }
    }

    this.drawInteractiveEffects();
    this.animId = requestAnimationFrame(() => this.animate());
  }
}

window.SeasonalParticles = SeasonalParticles;
