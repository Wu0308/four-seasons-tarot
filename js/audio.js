/**
 * 四季專屬高質感純音樂（BGM）播放器
 * Ambient Background Music Engine with Smooth Crossfade & Resilient Error Handling
 */

const SEASON_BGM_CONFIG = {
  spring: 'assets/audio/spring-piano.mp3',  // 春・晨露與鋼琴獨奏
  summer: 'assets/audio/summer-night.mp3',  // 夏・仲夜微風與大提琴
  autumn: 'assets/audio/autumn-rain.mp3',   // 秋・暮光與細雨聲
  winter: 'assets/audio/winter-silence.mp3' // 冬・初雪與空靈環境音
};

class BgmPlayer {
  constructor() {
    let savedVol = 0.38;
    try {
      const stored = localStorage.getItem('tarot_bgm_volume');
      if (stored !== null) {
        const parsed = parseFloat(stored);
        if (!isNaN(parsed) && parsed >= 0 && parsed <= 1) {
          savedVol = parsed;
        }
      }
    } catch (e) {}

    this.targetVolume = savedVol;
    this.currentSeason = 'spring';
    this.isPlaying = false;
    this.userExplicitlyPaused = false;
    this.hasUnlockedAutoplay = false;
    this.audioCtx = null;
    this.noiseBuffer = null;
    this.lastHoverTickTime = 0;

    // Dual audio channel architecture for seamless 0.8s / 1.0s crossfading
    this.channelA = new Audio();
    this.channelB = new Audio();
    this.activeChannel = 'A'; // 'A' or 'B'

    this.initChannel(this.channelA);
    this.initChannel(this.channelB);

    this.activeAudio.src = SEASON_BGM_CONFIG[this.currentSeason];

    this.setupAutoplayUnlocking();
    this.setupVolumeControls();
  }

  get activeAudio() {
    return this.activeChannel === 'A' ? this.channelA : this.channelB;
  }

  get inactiveAudio() {
    return this.activeChannel === 'A' ? this.channelB : this.channelA;
  }

  initChannel(audio) {
    audio.loop = true;
    audio.preload = 'auto';
    audio.volume = 0;

    // Silent error resilience - never pop error or break application
    audio.addEventListener('error', () => {
      console.info('背景音樂音檔載入提示（可依需求於 assets/audio/ 放置音檔）:', audio.src);
    });
  }

  setupAutoplayUnlocking() {
    const unlock = () => {
      if (this.hasUnlockedAutoplay) return;
      this.hasUnlockedAutoplay = true;

      if (!this.userExplicitlyPaused && !this.isPlaying) {
        this.play();
      }

      ['click', 'touchstart', 'keydown'].forEach((evt) => {
        window.removeEventListener(evt, unlock, true);
      });
    };

    ['click', 'touchstart', 'keydown'].forEach((evt) => {
      window.addEventListener(evt, unlock, { once: true, capture: true });
    });
  }

  play() {
    this.userExplicitlyPaused = false;
    const current = this.activeAudio;

    if (!current.src || !current.src.includes(SEASON_BGM_CONFIG[this.currentSeason])) {
      current.src = SEASON_BGM_CONFIG[this.currentSeason];
    }

    const playPromise = current.play();
    if (playPromise !== undefined) {
      playPromise
        .then(() => {
          this.isPlaying = true;
          this.fadeVolume(current, current.volume, this.targetVolume, 1000);
          this.updateUi();
        })
        .catch(() => {
          // Handled silently for autoplay policies or missing files
          this.isPlaying = false;
          this.updateUi();
        });
    }
  }

  pause() {
    this.userExplicitlyPaused = true;
    const current = this.activeAudio;
    this.fadeVolume(current, current.volume, 0, 600, () => {
      current.pause();
      this.isPlaying = false;
      this.updateUi();
    });
  }

  toggle() {
    if (this.isPlaying) {
      this.pause();
    } else {
      this.play();
    }
    return this.isPlaying;
  }

  switchSeason(seasonKey) {
    if (!SEASON_BGM_CONFIG[seasonKey] || this.currentSeason === seasonKey) {
      return;
    }

    this.currentSeason = seasonKey;
    const newSrc = SEASON_BGM_CONFIG[seasonKey];

    if (!this.isPlaying) {
      // Just swap track source quietly if paused
      this.activeAudio.src = newSrc;
      return;
    }

    // Crossfade: Fade-out current track (0.8s) & Fade-in new track (1.0s)
    const outgoing = this.activeAudio;
    this.activeChannel = this.activeChannel === 'A' ? 'B' : 'A';
    const incoming = this.activeAudio;

    // 1. Smooth Fade-out outgoing channel to 0 in 800ms
    this.fadeVolume(outgoing, outgoing.volume, 0, 800, () => {
      outgoing.pause();
      outgoing.currentTime = 0;
    });

    // 2. Prepare incoming channel & Fade-in to target volume in 1000ms
    incoming.src = newSrc;
    incoming.volume = 0;
    const playPromise = incoming.play();
    if (playPromise !== undefined) {
      playPromise
        .then(() => {
          this.fadeVolume(incoming, 0, this.targetVolume, 1000);
        })
        .catch(() => {
          console.info('新季節音訊未載入或受瀏覽器限制:', newSrc);
        });
    }
  }

  fadeVolume(audio, startVol, endVol, durationMs, onComplete) {
    const startTime = performance.now();
    const tick = (now) => {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / durationMs, 1);
      const easeVal = startVol + (endVol - startVol) * progress;

      try {
        audio.volume = Math.max(0, Math.min(1, easeVal));
      } catch (e) {
        // Safe check
      }

      if (progress < 1) {
        requestAnimationFrame(tick);
      } else {
        if (typeof onComplete === 'function') {
          onComplete();
        }
      }
    };

    requestAnimationFrame(tick);
  }

  setVolume(newVolume) {
    const vol = parseFloat(newVolume);
    if (isNaN(vol) || vol < 0 || vol > 1) return;
    this.targetVolume = vol;

    try {
      localStorage.setItem('tarot_bgm_volume', String(vol));
    } catch (e) {}

    if (this.isPlaying) {
      const current = this.activeAudio;
      this.fadeVolume(current, current.volume, this.targetVolume, 250);
    }
    this.updateUi();
  }

  setupVolumeControls() {
    const attach = () => {
      const volBtns = document.querySelectorAll('.vol-btn');
      volBtns.forEach((btn) => {
        btn.addEventListener('click', (e) => {
          e.stopPropagation();
          const vol = parseFloat(btn.dataset.vol);
          this.setVolume(vol);
          if (!this.isPlaying) {
            this.play();
          }
        });
      });
      this.updateUi();
    };

    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', attach);
    } else {
      setTimeout(attach, 0);
    }
  }

  updateUi() {
    const btn = document.getElementById('sound-toggle-btn');
    if (btn) {
      if (this.isPlaying) {
        btn.classList.add('is-playing');
        btn.setAttribute('title', '暫停背景音樂');
        btn.setAttribute('aria-label', '暫停背景音樂');
      } else {
        btn.classList.remove('is-playing');
        btn.setAttribute('title', '播放背景音樂');
        btn.setAttribute('aria-label', '播放背景音樂');
      }
    }

    const volBtns = document.querySelectorAll('.vol-btn');
    volBtns.forEach((vBtn) => {
      const btnVol = parseFloat(vBtn.dataset.vol);
      const isMatch = Math.abs(btnVol - this.targetVolume) < 0.08;
      vBtn.classList.toggle('active', isMatch);
    });
  }

  // =========================================================================
  // Tactile Paper & Crystal Micro-SFX Synthesizer (Web Audio API)
  // =========================================================================
  ensureAudioContext() {
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (!AudioCtx) return null;

    if (!this.audioCtx) {
      try {
        this.audioCtx = new AudioCtx();
      } catch (e) {
        return null;
      }
    }

    if (this.audioCtx.state === 'suspended') {
      this.audioCtx.resume().catch(() => {});
    }

    if (!this.noiseBuffer && this.audioCtx) {
      const sampleRate = this.audioCtx.sampleRate || 44100;
      const length = Math.floor(sampleRate * 1.2);
      const buffer = this.audioCtx.createBuffer(1, length, sampleRate);
      const data = buffer.getChannelData(0);
      let lastOut = 0;
      for (let i = 0; i < length; i++) {
        const white = Math.random() * 2 - 1;
        // Soft pink-tinted cotton paper noise
        data[i] = (lastOut + 0.08 * white) / 1.08;
        lastOut = data[i];
      }
      this.noiseBuffer = buffer;
    }

    return this.audioCtx;
  }

  getSfxGainScale() {
    if (this.userExplicitlyPaused) return 0;
    return Math.max(0.25, Math.min(1, this.targetVolume / 0.38));
  }

  playShuffle() {
    if (this.userExplicitlyPaused) return;
    const ctx = this.ensureAudioContext();
    if (!ctx || !this.noiseBuffer) return;

    const scale = this.getSfxGainScale();
    const now = ctx.currentTime;

    for (let i = 0; i < 6; i++) {
      const start = now + i * 0.045;
      const src = ctx.createBufferSource();
      src.buffer = this.noiseBuffer;

      const filter = ctx.createBiquadFilter();
      filter.type = 'bandpass';
      filter.frequency.setValueAtTime(920 + i * 130, start);
      filter.Q.setValueAtTime(1.8, start);

      const gain = ctx.createGain();
      const peak = 0.065 * scale;
      gain.gain.setValueAtTime(0.0001, start);
      gain.gain.linearRampToValueAtTime(peak, start + 0.012);
      gain.gain.exponentialRampToValueAtTime(0.0001, start + 0.065);

      src.connect(filter);
      filter.connect(gain);
      gain.connect(ctx.destination);

      src.start(start, (i * 0.11) % 0.6, 0.08);
    }
  }

  playHoverTick(pitchOffset = 0) {
    if (this.userExplicitlyPaused) return;
    const nowMs = performance.now();
    if (nowMs - this.lastHoverTickTime < 55) return;
    this.lastHoverTickTime = nowMs;

    const ctx = this.ensureAudioContext();
    if (!ctx || !this.noiseBuffer) return;

    const scale = this.getSfxGainScale();
    const now = ctx.currentTime;

    // Tactile cotton paper edge brush
    const src = ctx.createBufferSource();
    src.buffer = this.noiseBuffer;

    const filter = ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(1400 + pitchOffset * 35, now);
    filter.Q.setValueAtTime(2.6, now);

    const nGain = ctx.createGain();
    nGain.gain.setValueAtTime(0.0001, now);
    nGain.gain.linearRampToValueAtTime(0.032 * scale, now + 0.008);
    nGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.048);

    src.connect(filter);
    filter.connect(nGain);
    nGain.connect(ctx.destination);
    src.start(now, Math.random() * 0.5, 0.06);

    // Subtle soft harmonic wooden/crystal overtone
    const freq = 420 * Math.pow(2, pitchOffset / 24);
    const osc = ctx.createOscillator();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(freq, now);

    const oGain = ctx.createGain();
    oGain.gain.setValueAtTime(0.0001, now);
    oGain.gain.linearRampToValueAtTime(0.014 * scale, now + 0.008);
    oGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.09);

    osc.connect(oGain);
    oGain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.1);
  }

  playChime(stepIndex = 0) {
    if (this.userExplicitlyPaused) return;
    const ctx = this.ensureAudioContext();
    if (!ctx) return;

    const scale = this.getSfxGainScale();
    const now = ctx.currentTime;
    const notes = [528, 660, 792];
    const baseFreq = notes[Math.abs(stepIndex) % notes.length];

    [1, 2].forEach((mult, idx) => {
      const osc = ctx.createOscillator();
      osc.type = idx === 0 ? 'sine' : 'triangle';
      osc.frequency.setValueAtTime(baseFreq * mult, now);

      const gain = ctx.createGain();
      const peak = (idx === 0 ? 0.055 : 0.018) * scale;
      gain.gain.setValueAtTime(0.0001, now);
      gain.gain.linearRampToValueAtTime(peak, now + 0.025);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + (idx === 0 ? 1.35 : 0.85));

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 1.4);
    });
  }

  playFlip() {
    if (this.userExplicitlyPaused) return;
    const ctx = this.ensureAudioContext();
    if (!ctx || !this.noiseBuffer) return;

    const scale = this.getSfxGainScale();
    const now = ctx.currentTime;

    // Card air-turn whoosh
    const src = ctx.createBufferSource();
    src.buffer = this.noiseBuffer;

    const filter = ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.Q.setValueAtTime(1.4, now);
    filter.frequency.setValueAtTime(380, now);
    filter.frequency.exponentialRampToValueAtTime(1050, now + 0.09);
    filter.frequency.exponentialRampToValueAtTime(460, now + 0.22);

    const nGain = ctx.createGain();
    nGain.gain.setValueAtTime(0.0001, now);
    nGain.gain.linearRampToValueAtTime(0.08 * scale, now + 0.045);
    nGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.24);

    src.connect(filter);
    filter.connect(nGain);
    nGain.connect(ctx.destination);
    src.start(now, 0.1, 0.26);

    // Delicate foil glint harmonic
    const osc = ctx.createOscillator();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(880, now + 0.05);

    const oGain = ctx.createGain();
    oGain.gain.setValueAtTime(0.0001, now + 0.05);
    oGain.gain.linearRampToValueAtTime(0.022 * scale, now + 0.08);
    oGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.65);

    osc.connect(oGain);
    oGain.connect(ctx.destination);
    osc.start(now + 0.05);
    osc.stop(now + 0.68);
  }

  playBreeze() {
    if (this.userExplicitlyPaused) return;
    const ctx = this.ensureAudioContext();
    if (!ctx || !this.noiseBuffer) return;

    const scale = this.getSfxGainScale();
    const now = ctx.currentTime;

    const src = ctx.createBufferSource();
    src.buffer = this.noiseBuffer;

    const filter = ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.Q.setValueAtTime(1.1, now);
    filter.frequency.setValueAtTime(260, now);
    filter.frequency.exponentialRampToValueAtTime(580, now + 0.42);
    filter.frequency.exponentialRampToValueAtTime(220, now + 0.92);

    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.linearRampToValueAtTime(0.075 * scale, now + 0.35);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.95);

    src.connect(filter);
    filter.connect(gain);
    gain.connect(ctx.destination);
    src.start(now, 0, 1.0);
  }

  toggleMute() {
    return !this.toggle();
  }
}

// Global Export & Alias for backward compatibility
window.bgmPlayer = new BgmPlayer();
window.soundEngine = window.bgmPlayer;
