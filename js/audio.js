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
    this.targetVolume = 0.35;
    this.currentSeason = 'spring';
    this.isPlaying = false;
    this.userExplicitlyPaused = false;
    this.hasUnlockedAutoplay = false;

    // Dual audio channel architecture for seamless 0.8s / 1.0s crossfading
    this.channelA = new Audio();
    this.channelB = new Audio();
    this.activeChannel = 'A'; // 'A' or 'B'

    this.initChannel(this.channelA);
    this.initChannel(this.channelB);

    this.activeAudio.src = SEASON_BGM_CONFIG[this.currentSeason];

    this.setupAutoplayUnlocking();
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

  updateUi() {
    const btn = document.getElementById('sound-toggle-btn');
    if (!btn) return;

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

  // Backward-compatibility safe stubs for previous synthesizer methods
  playChime() {}
  playFlip() {}
  playBreeze() {}
  toggleMute() {
    return !this.toggle();
  }
}

// Global Export & Alias for backward compatibility
window.bgmPlayer = new BgmPlayer();
window.soundEngine = window.bgmPlayer;
