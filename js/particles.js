/**
 * Dynamic Seasonal Particle Canvas Engine
 * Renders understated, luxury atmospheric visual effects for Spring, Summer, Autumn, and Winter.
 */
class SeasonalParticles {
  constructor(canvasId) {
    this.canvas = document.getElementById(canvasId);
    if (!this.canvas) return;
    this.ctx = this.canvas.getContext('2d');
    this.season = 'spring';
    this.particles = [];
    this.width = 0;
    this.height = 0;
    this.animId = null;
    this.mouse = { x: -1000, y: -1000 };

    this.init();
  }

  init() {
    this.resize();
    window.addEventListener('resize', () => this.resize());
    window.addEventListener('mousemove', (e) => {
      this.mouse.x = e.clientX;
      this.mouse.y = e.clientY;
    });

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

  createParticles() {
    this.particles = [];
    const count = Math.min(Math.floor((this.width * this.height) / 22000), 55);

    for (let i = 0; i < count; i++) {
      this.particles.push(this.newParticle(true));
    }
  }

  newParticle(randomY = false) {
    const y = randomY ? Math.random() * this.height : -20;
    const x = Math.random() * this.width;

    switch (this.season) {
      case 'spring': // Sakura blossom petals & sage pollen
        return {
          x,
          y,
          size: 4 + Math.random() * 6,
          speedY: 0.5 + Math.random() * 0.9,
          speedX: Math.random() * 0.8 - 0.2,
          angle: Math.random() * Math.PI * 2,
          rotSpeed: (Math.random() - 0.5) * 0.02,
          opacity: 0.25 + Math.random() * 0.45,
          oscAmp: 1.2 + Math.random() * 1.5,
          color: Math.random() > 0.35 ? 'rgba(235, 195, 198, ' : 'rgba(215, 226, 210, '
        };

      case 'summer': // Midnight stars & celestial nebula dust
        return {
          x,
          y: Math.random() * this.height,
          size: 1 + Math.random() * 2.5,
          speedY: (Math.random() - 0.5) * 0.15,
          speedX: (Math.random() - 0.5) * 0.15,
          pulse: Math.random() * Math.PI * 2,
          pulseSpeed: 0.02 + Math.random() * 0.03,
          maxOpacity: 0.4 + Math.random() * 0.5,
          color: Math.random() > 0.4 ? 'rgba(226, 232, 240, ' : 'rgba(212, 175, 55, '
        };

      case 'autumn': // Amber sunbeam motes & leaf particles
        return {
          x,
          y,
          size: 3 + Math.random() * 5,
          speedY: 0.6 + Math.random() * 1.1,
          speedX: Math.random() * 0.6 - 0.1,
          angle: Math.random() * Math.PI * 2,
          rotSpeed: (Math.random() - 0.5) * 0.025,
          opacity: 0.2 + Math.random() * 0.45,
          oscAmp: 1.5 + Math.random() * 1.8,
          color: Math.random() > 0.5 ? 'rgba(200, 122, 91, ' : 'rgba(140, 83, 62, '
        };

      case 'winter': // Snowflakes & frosty crystal dust (Interlacing cool pine gray-blue and pure white)
        return {
          x,
          y,
          size: 1.5 + Math.random() * 4,
          speedY: 0.4 + Math.random() * 0.8,
          speedX: (Math.random() - 0.5) * 0.3,
          angle: Math.random() * Math.PI * 2,
          rotSpeed: (Math.random() - 0.5) * 0.015,
          opacity: 0.28 + Math.random() * 0.52,
          color: Math.random() > 0.45 ? 'rgba(122, 145, 158, ' : 'rgba(255, 255, 255, '
        };
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
        const force = (120 - dist) / 120 * 0.6;
        p.x -= (dx / dist) * force;
        p.y -= (dy / dist) * force;
      }

      if (this.season === 'summer') {
        p.pulse += p.pulseSpeed;
        const currentOpacity = (Math.sin(p.pulse) * 0.5 + 0.5) * p.maxOpacity;
        this.ctx.fillStyle = p.color + currentOpacity + ')';
        this.ctx.beginPath();
        this.ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        this.ctx.fill();

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
        this.ctx.fillStyle = p.color + p.opacity + ')';

        if (this.season === 'spring') {
          // Delicate petal shape
          this.ctx.beginPath();
          this.ctx.ellipse(0, 0, p.size, p.size * 0.55, 0, 0, Math.PI * 2);
          this.ctx.fill();
        } else if (this.season === 'autumn') {
          // Diamond / leaf fragment
          this.ctx.beginPath();
          this.ctx.moveTo(0, -p.size);
          this.ctx.lineTo(p.size * 0.6, 0);
          this.ctx.lineTo(0, p.size);
          this.ctx.lineTo(-p.size * 0.6, 0);
          this.ctx.closePath();
          this.ctx.fill();
        } else if (this.season === 'winter') {
          // Soft snowflake / crystal circle
          this.ctx.beginPath();
          this.ctx.arc(0, 0, p.size, 0, Math.PI * 2);
          this.ctx.fill();
        }
        this.ctx.restore();

        if (p.y > this.height + 20 || p.x < -30 || p.x > this.width + 30) {
          this.particles[i] = this.newParticle(false);
        }
      }
    }

    this.animId = requestAnimationFrame(() => this.animate());
  }
}

window.SeasonalParticles = SeasonalParticles;
