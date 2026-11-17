/**
 * High-Fashion Editorial Tarot Web App
 * State Machine, Dual Spread Modes, Whisper Ritual, 3D Optics,
 * Multi-Dimensional Literary Synthesis Engine, Card Lightbox & Soul Journal
 */

(function () {
  'use strict';

  const JOURNAL_STORAGE_KEY = 'tarot_soul_journal';
  const UNLOCKED_ARCANA_KEY = 'tarot_unlocked_arcana';

  // Application State
  const state = {
    season: 'spring',
    topic: 'love',
    spreadMode: 'triple', // 'triple' | 'single'
    userWhisper: '',
    currentStage: 1, // 1: Selection, 2: Meditation/Shuffling, 3: Reveal, 4: Reading
    meditationStep: 'breathing', // 'breathing' | 'picking'
    pickedCards: [], // Array of { cardData, isReversed, position }
    revealedIndices: new Set(),
    particles: null,
    isTransitioning: false,
    sessionRecorded: false,
    currentRecordId: null,
    currentPostcardPayload: null,
    journalActiveTab: 'timeline', // 'timeline' | 'gallery'
    journalFilterSeason: 'all',
    galleryPeekAll: false,
    editingJournalId: null,
    activeLightboxCard: null,
    activeLightboxReversed: false,
    postcardRatio: '3:4', // '3:4' | '9:16'
    activeWaveIndex: -1,
    isShufflingDeck: false
  };

  // DOM Elements Cache
  const elements = {
    appContainer: document.querySelector('.app-container'),
    seasonBtns: document.querySelectorAll('.season-btn'),
    soundToggleBtn: document.getElementById('sound-toggle-btn'),
    btnOpenJournal: document.getElementById('btn-open-journal'),
    btnOpenGallery: document.getElementById('btn-open-gallery'),
    railEditionText: document.getElementById('rail-edition-text'),
    railVerseText: document.getElementById('rail-verse-text'),
    stages: {
      1: document.getElementById('stage-1'),
      2: document.getElementById('stage-2'),
      3: document.getElementById('stage-3'),
      4: document.getElementById('stage-4')
    },
    topicCards: document.querySelectorAll('.topic-card'),
    spreadModeBtns: document.querySelectorAll('.spread-mode-btn'),
    userWhisperInput: document.getElementById('user-whisper-input'),
    btnStartMeditation: document.getElementById('btn-start-meditation'),
    meditationWhisperEcho: document.getElementById('meditation-whisper-echo'),
    breathingBox: document.getElementById('breathing-box'),
    breathingSeasonInvocation: document.getElementById('breathing-season-invocation'),
    btnReadyPick: document.getElementById('btn-ready-pick'),
    spreadSection: document.getElementById('spread-section'),
    ritualAltarSlots: document.getElementById('ritual-altar-slots'),
    spreadDeck: document.getElementById('spread-deck'),
    guideBannerText: document.getElementById('guide-banner-text'),
    spreadHoverWhisper: document.getElementById('spread-hover-whisper'),
    selectionProgressDots: document.getElementById('selection-progress-dots'),
    btnReshuffleDeck: document.getElementById('btn-reshuffle-deck'),
    stage3HeroTitle: document.getElementById('stage3-hero-title'),
    stage3HeroVerse: document.getElementById('stage3-hero-verse'),
    spreadSlotsGrid: document.getElementById('spread-slots-grid'),
    btnViewReading: document.getElementById('btn-view-reading'),
    readingContainer: document.getElementById('reading-container'),
    postcardModal: document.getElementById('postcard-modal'),
    btnClosePostcard: document.getElementById('btn-close-postcard'),
    postcardRatioBtns: document.querySelectorAll('.postcard-ratio-btn'),
    btnDownloadPostcard: document.getElementById('btn-download-postcard'),
    btnDownloadText: document.getElementById('btn-download-text'),
    btnCopyPostcardText: document.getElementById('btn-copy-postcard-text'),
    postcardEditorialSheet: document.getElementById('postcard-editorial-sheet'),
    journalModal: document.getElementById('journal-modal'),
    btnCloseJournal: document.getElementById('btn-close-journal'),
    journalTabBtns: document.querySelectorAll('.journal-tab-btn'),
    journalTabTimeline: document.getElementById('journal-tab-timeline'),
    journalTabGallery: document.getElementById('journal-tab-gallery'),
    galleryUnlockCount: document.getElementById('gallery-unlock-count'),
    journalFrequencySummary: document.getElementById('journal-frequency-summary'),
    journalFilterPills: document.querySelectorAll('.journal-filter-pill'),
    journalTimelineList: document.getElementById('journal-timeline-list'),
    btnClearJournal: document.getElementById('btn-clear-journal'),
    galleryStatusText: document.getElementById('gallery-status-text'),
    btnToggleGalleryPeek: document.getElementById('btn-toggle-gallery-peek'),
    arcanaGalleryGrid: document.getElementById('arcana-gallery-grid'),
    cardLightboxModal: document.getElementById('card-lightbox-modal'),
    btnCloseLightbox: document.getElementById('btn-close-lightbox'),
    lightboxBody: document.getElementById('lightbox-body'),
    toastNotice: document.getElementById('toast-notice')
  };

  function escapeHtml(str) {
    if (typeof str !== 'string') return '';
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  function isReducedMotionPreferred() {
    return window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  }

  // Interactive 3D Cursor Parallax Tilt & Specular Foil Glare (Scheme I)
  function bind3DTilt(el, options = {}) {
    if (!el || el.dataset.tiltBound === 'true') return;
    el.dataset.tiltBound = 'true';

    const maxDeg = options.maxDeg || 7;
    const requireFlipped = Boolean(options.requireFlipped);
    const glareTargetSelector = options.glareTargetSelector || null;

    const ensureGlareEl = () => {
      const targetParent = glareTargetSelector ? el.querySelector(glareTargetSelector) : el;
      if (!targetParent) return null;
      let glare = targetParent.querySelector('.card-specular-glare');
      if (!glare) {
        glare = document.createElement('div');
        glare.className = 'card-specular-glare';
        glare.setAttribute('aria-hidden', 'true');
        targetParent.appendChild(glare);
      }
      return glare;
    };

    ensureGlareEl();

    el.addEventListener('mousemove', (e) => {
      if (isReducedMotionPreferred()) return;
      if (requireFlipped && !el.classList.contains('flipped')) return;

      const rect = el.getBoundingClientRect();
      if (!rect.width || !rect.height) return;

      const px = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
      const py = Math.max(0, Math.min(1, (e.clientY - rect.top) / rect.height));
      const rotateY = (px - 0.5) * 2 * maxDeg;
      const rotateX = (0.5 - py) * 2 * maxDeg;

      el.style.transform = `perspective(1000px) rotateX(${rotateX.toFixed(2)}deg) rotateY(${rotateY.toFixed(2)}deg)`;

      const glare = ensureGlareEl();
      if (glare) {
        const glareX = requireFlipped ? (1 - px) * 100 : px * 100;
        glare.style.setProperty('--glare-x', `${glareX.toFixed(1)}%`);
        glare.style.setProperty('--glare-y', `${(py * 100).toFixed(1)}%`);
        glare.style.setProperty('--glare-opacity', '1');
      }
    });

    el.addEventListener('mouseleave', () => {
      el.style.transform = '';
      const glare = ensureGlareEl();
      if (glare) {
        glare.style.setProperty('--glare-opacity', '0');
      }
    });
  }

  // Initialize App
  function init() {
    state.particles = new SeasonalParticles('particle-canvas');
    state.particles.setSeason(state.season);

    setupEventListeners();
    applySeasonTheme(state.season);
    updateTopicSelection('love');
    updateGalleryCountBadge();

    elements.topicCards.forEach((card) => {
      bind3DTilt(card, { maxDeg: 5 });
    });

    window.bgmPlayer?.updateUi();
  }

  // Event Listeners Setup
  function setupEventListeners() {
    elements.seasonBtns.forEach((btn) => {
      btn.addEventListener('click', () => {
        const season = btn.dataset.season;
        if (season && season !== state.season) {
          switchSeason(season);
        }
      });
    });

    if (elements.soundToggleBtn) {
      elements.soundToggleBtn.addEventListener('click', () => {
        window.bgmPlayer?.toggle();
      });
    }

    elements.topicCards.forEach((card) => {
      card.addEventListener('click', () => {
        const topic = card.dataset.topic;
        updateTopicSelection(topic);
        window.bgmPlayer?.play();
      });
    });

    elements.spreadModeBtns.forEach((btn) => {
      btn.addEventListener('click', () => {
        const mode = btn.dataset.mode;
        if (mode === 'single' || mode === 'triple') {
          state.spreadMode = mode;
          elements.spreadModeBtns.forEach((b) => {
            b.classList.toggle('active', b.dataset.mode === mode);
          });
        }
      });
    });

    if (elements.userWhisperInput) {
      elements.userWhisperInput.addEventListener('input', (e) => {
        state.userWhisper = e.target.value.trim();
      });
    }

    if (elements.btnStartMeditation) {
      elements.btnStartMeditation.addEventListener('click', () => {
        if (elements.userWhisperInput) {
          state.userWhisper = elements.userWhisperInput.value.trim();
        }
        window.bgmPlayer?.play();
        goToStage(2);
        initStage2();
      });
    }

    if (elements.btnReadyPick) {
      elements.btnReadyPick.addEventListener('click', () => {
        revealSpreadDeck();
      });
    }

    if (elements.btnReshuffleDeck) {
      elements.btnReshuffleDeck.addEventListener('click', () => {
        reshuffleMysteryDeck();
      });
    }

    setupSpreadDeckWaveInteraction();

    if (elements.btnViewReading) {
      elements.btnViewReading.addEventListener('click', () => {
        goToStage(4);
        renderFullReading();
      });
    }

    if (elements.readingContainer) {
      elements.readingContainer.addEventListener('click', (e) => {
        const btn = e.target.closest('button');
        if (btn) {
          if (btn.id === 'btn-open-postcard') {
            openPostcardModal();
            return;
          }
          if (btn.id === 'btn-reset-tarot') {
            resetState();
            return;
          }
          if (btn.id === 'btn-save-soul-note') {
            saveStage4SoulNote();
            return;
          }
        }

        const thumbBox = e.target.closest('.detail-thumb-box');
        if (thumbBox) {
          const idx = parseInt(thumbBox.dataset.cardIdx, 10);
          const picked = state.pickedCards[idx];
          if (picked) {
            openCardLightbox(picked.cardData, picked.isReversed);
          }
        }
      });
    }

    if (elements.btnClosePostcard) {
      elements.btnClosePostcard.addEventListener('click', closePostcardModal);
    }

    if (elements.postcardModal) {
      elements.postcardModal.addEventListener('click', (e) => {
        if (e.target === elements.postcardModal) {
          closePostcardModal();
        }
      });
    }

    elements.postcardRatioBtns.forEach((btn) => {
      btn.addEventListener('click', () => {
        const ratio = btn.dataset.ratio === '9:16' ? '9:16' : '3:4';
        state.postcardRatio = ratio;
        applyPostcardRatioClass();
      });
    });

    if (elements.btnDownloadPostcard) {
      elements.btnDownloadPostcard.addEventListener('click', downloadPostcardImage);
    }

    if (elements.btnCopyPostcardText) {
      elements.btnCopyPostcardText.addEventListener('click', copyPostcardProse);
    }

    if (elements.btnOpenJournal) {
      elements.btnOpenJournal.addEventListener('click', () => openJournalModal('timeline'));
    }

    if (elements.btnOpenGallery) {
      elements.btnOpenGallery.addEventListener('click', () => openJournalModal('gallery'));
    }

    if (elements.btnCloseJournal) {
      elements.btnCloseJournal.addEventListener('click', closeJournalModal);
    }

    if (elements.journalModal) {
      elements.journalModal.addEventListener('click', (e) => {
        if (e.target === elements.journalModal) {
          closeJournalModal();
        }
      });
    }

    elements.journalTabBtns.forEach((btn) => {
      btn.addEventListener('click', () => {
        switchJournalTab(btn.dataset.tab);
      });
    });

    elements.journalFilterPills.forEach((pill) => {
      pill.addEventListener('click', () => {
        state.journalFilterSeason = pill.dataset.filter || 'all';
        elements.journalFilterPills.forEach((p) => {
          p.classList.toggle('active', p === pill);
        });
        renderJournalTimeline();
      });
    });

    if (elements.btnToggleGalleryPeek) {
      elements.btnToggleGalleryPeek.addEventListener('click', () => {
        state.galleryPeekAll = !state.galleryPeekAll;
        elements.btnToggleGalleryPeek.classList.toggle('active', state.galleryPeekAll);
        elements.btnToggleGalleryPeek.textContent = state.galleryPeekAll ? '僅顯示已邂逅' : '預覽全圖鑑';
        renderArcanaGallery();
      });
    }

    if (elements.btnClearJournal) {
      elements.btnClearJournal.addEventListener('click', clearJournalRecords);
    }

    if (elements.btnCloseLightbox) {
      elements.btnCloseLightbox.addEventListener('click', closeCardLightbox);
    }

    if (elements.cardLightboxModal) {
      elements.cardLightboxModal.addEventListener('click', (e) => {
        if (e.target === elements.cardLightboxModal) {
          closeCardLightbox();
        }
      });
    }

    window.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        if (elements.cardLightboxModal && elements.cardLightboxModal.classList.contains('open')) {
          closeCardLightbox();
        } else if (elements.postcardModal && elements.postcardModal.classList.contains('open')) {
          closePostcardModal();
        } else if (elements.journalModal && elements.journalModal.classList.contains('open')) {
          closeJournalModal();
        }
      }
    });
  }

  // Season Switch Handler
  function switchSeason(seasonKey) {
    state.season = seasonKey;
    applySeasonTheme(seasonKey);
    window.bgmPlayer?.switchSeason(seasonKey);

    if (state.particles) {
      state.particles.setSeason(seasonKey);
    }

    if (state.currentStage === 2 && state.meditationStep === 'picking') {
      renderRitualAltarSlots();
      renderMysteryCardsSpread();
    } else if (state.currentStage === 3) {
      render3DRevealSlots();
    }

    if (elements.journalModal && elements.journalModal.classList.contains('open') && state.journalActiveTab === 'gallery') {
      renderArcanaGallery();
    }
  }

  function applySeasonTheme(seasonKey) {
    document.documentElement.setAttribute('data-theme', seasonKey);

    elements.seasonBtns.forEach((btn) => {
      btn.classList.toggle('active', btn.dataset.season === seasonKey);
    });

    const meta = window.SEASON_EDITORIAL_META && window.SEASON_EDITORIAL_META[seasonKey];
    if (meta) {
      if (elements.railEditionText) elements.railEditionText.textContent = meta.edition;
      if (elements.railVerseText) elements.railVerseText.textContent = meta.railVerse;
      if (elements.breathingSeasonInvocation && meta.invocation) {
        elements.breathingSeasonInvocation.textContent = meta.invocation;
      }
    }
  }

  function updateTopicSelection(topicKey) {
    state.topic = topicKey;
    elements.topicCards.forEach((card) => {
      card.classList.toggle('selected', card.dataset.topic === topicKey);
    });
  }

  // Stage Transitions with Smooth Out/In and Lock Mechanism
  function goToStage(stageNum) {
    if (state.isTransitioning || state.currentStage === stageNum) return;
    state.isTransitioning = true;

    const prevStageEl = elements.stages[state.currentStage];
    const nextStageEl = elements.stages[stageNum];

    if (prevStageEl && prevStageEl.classList.contains('active')) {
      prevStageEl.classList.add('is-leaving');
      setTimeout(() => {
        prevStageEl.classList.remove('active', 'is-leaving');
        state.currentStage = stageNum;
        if (nextStageEl) {
          nextStageEl.classList.add('active');
        }
        window.scrollTo({ top: 0, behavior: 'smooth' });
        setTimeout(() => {
          state.isTransitioning = false;
        }, 300);
      }, 450);
    } else {
      state.currentStage = stageNum;
      if (nextStageEl) {
        nextStageEl.classList.add('active');
      }
      window.scrollTo({ top: 0, behavior: 'smooth' });
      state.isTransitioning = false;
    }
  }

  // =========================================================================
  // Stage 2: Meditation, Shuffling & Sympathetic Wave Arc Selection
  // =========================================================================
  const DEFAULT_SPREAD_WHISPER = '以指尖輕觸掃過牌弧，停駐在心弦共鳴的那一席';

  function getTargetPickCount() {
    return state.spreadMode === 'single' ? 1 : 3;
  }

  function initStage2() {
    state.meditationStep = 'breathing';
    state.pickedCards = [];
    state.revealedIndices = new Set();
    state.activeWaveIndex = -1;
    state.isShufflingDeck = false;

    elements.breathingBox.classList.remove('is-exiting-breathing');
    elements.breathingBox.style.display = 'block';
    elements.spreadSection.style.display = 'none';
    elements.btnReadyPick.style.opacity = '1';
    elements.btnReadyPick.disabled = false;

    if (elements.meditationWhisperEcho) {
      if (state.userWhisper) {
        elements.meditationWhisperEcho.textContent = `“${state.userWhisper}”`;
        elements.meditationWhisperEcho.style.display = 'inline-block';
      } else {
        elements.meditationWhisperEcho.style.display = 'none';
      }
    }

    renderProgressDots();
    renderRitualAltarSlots();
    updatePickProgress(0);
  }

  function renderProgressDots() {
    if (!elements.selectionProgressDots) return;
    const count = getTargetPickCount();
    elements.selectionProgressDots.innerHTML = Array.from({ length: count }, () => '<span class="prog-dot"></span>').join('');
  }

  function renderRitualAltarSlots() {
    const container = elements.ritualAltarSlots;
    if (!container) return;

    const positions = state.spreadMode === 'single'
      ? [window.SINGLE_SPREAD_POSITION || window.SPREAD_POSITIONS[1]]
      : window.SPREAD_POSITIONS;
    const romans = ['I', 'II', 'III'];
    const backSvg = window.CARD_SVGS['back_' + state.season] || window.CARD_SVGS['back_spring'];
    const pickedCount = state.pickedCards.length;

    container.innerHTML = positions.map((pos, idx) => {
      const isFilled = idx < pickedCount;
      const isActive = idx === pickedCount && pickedCount < positions.length;
      const cls = isFilled ? 'filled' : (isActive ? 'active-target' : '');
      const stateLabel = isFilled ? '已落座' : (isActive ? '感應中' : '待引渡');
      const innerHtml = isFilled
        ? backSvg
        : `<span class="altar-slot-num font-serif">${romans[idx] || (idx + 1)}</span>`;

      return `
        <div class="altar-slot ${cls}" data-slot-idx="${idx}">
          <div class="altar-slot-card">${innerHtml}</div>
          <span class="altar-slot-label font-serif">【${pos.title}】</span>
          <span class="altar-slot-state font-sans">${stateLabel}</span>
        </div>
      `;
    }).join('');
  }

  function revealSpreadDeck() {
    if (state.meditationStep === 'picking') return;
    state.meditationStep = 'picking';
    elements.btnReadyPick.disabled = true;

    window.bgmPlayer?.playBreeze();
    state.particles?.spawnRipple(window.innerWidth / 2, window.innerHeight * 0.42);
    elements.breathingBox.classList.add('is-exiting-breathing');

    setTimeout(() => {
      elements.breathingBox.classList.remove('is-exiting-breathing');
      elements.breathingBox.style.display = 'none';
      elements.spreadSection.style.display = 'block';

      if (elements.spreadHoverWhisper) {
        elements.spreadHoverWhisper.textContent = DEFAULT_SPREAD_WHISPER;
      }

      renderRitualAltarSlots();
      renderMysteryCardsSpread();
      updatePickInstruction(0);
      window.bgmPlayer?.playShuffle();
    }, 340);
  }

  function clearSpreadWaveClasses() {
    if (!elements.spreadDeck) return;
    elements.spreadDeck.querySelectorAll('.mystery-card').forEach((card) => {
      card.classList.remove('wave-focus', 'wave-near-1', 'wave-near-2');
    });
    state.activeWaveIndex = -1;
    if (elements.spreadHoverWhisper && state.pickedCards.length < getTargetPickCount() && !state.isShufflingDeck) {
      elements.spreadHoverWhisper.textContent = DEFAULT_SPREAD_WHISPER;
    }
  }

  function applySpreadWaveAtClientX(clientX) {
    if (!elements.spreadDeck || state.isShufflingDeck || state.pickedCards.length >= getTargetPickCount()) {
      return;
    }

    const cards = Array.from(elements.spreadDeck.querySelectorAll('.mystery-card'));
    if (!cards.length) return;

    let closestIdx = -1;
    let closestDist = Infinity;

    cards.forEach((card, idx) => {
      if (card.classList.contains('picked')) return;
      const rect = card.getBoundingClientRect();
      const centerX = rect.left + rect.width / 2;
      const dist = Math.abs(clientX - centerX);
      if (dist < rect.width * 0.95 && dist < closestDist) {
        closestDist = dist;
        closestIdx = idx;
      }
    });

    if (closestIdx === -1) {
      clearSpreadWaveClasses();
      return;
    }

    cards.forEach((card, idx) => {
      card.classList.remove('wave-focus', 'wave-near-1', 'wave-near-2');
      if (card.classList.contains('picked')) return;
      const diff = Math.abs(idx - closestIdx);
      if (diff === 0) card.classList.add('wave-focus');
      else if (diff === 1) card.classList.add('wave-near-1');
      else if (diff === 2) card.classList.add('wave-near-2');
    });

    if (closestIdx !== state.activeWaveIndex) {
      state.activeWaveIndex = closestIdx;
      const parsedSeat = parseInt(cards[closestIdx].dataset.seatIdx, 10);
      const seatIdx = Number.isNaN(parsedSeat) ? closestIdx : parsedSeat;
      const hint = window.SPREAD_ARCANA_SEAT_HINTS && window.SPREAD_ARCANA_SEAT_HINTS[seatIdx];
      if (elements.spreadHoverWhisper && hint) {
        elements.spreadHoverWhisper.textContent = `第 ${hint.roman} 席 ・ ${hint.whisper}`;
      }
      window.bgmPlayer?.playHoverTick(closestIdx - (cards.length - 1) / 2);
    }
  }

  function setupSpreadDeckWaveInteraction() {
    const deck = elements.spreadDeck;
    if (!deck || deck.dataset.waveBound === 'true') return;
    deck.dataset.waveBound = 'true';

    deck.addEventListener('pointermove', (e) => {
      if (e.pointerType === 'mouse' || e.pointerType === 'pen') {
        applySpreadWaveAtClientX(e.clientX);
      }
    });

    deck.addEventListener('touchmove', (e) => {
      if (e.touches && e.touches.length > 0) {
        applySpreadWaveAtClientX(e.touches[0].clientX);
      }
    }, { passive: true });

    deck.addEventListener('pointerleave', () => {
      clearSpreadWaveClasses();
    });

    deck.addEventListener('touchend', () => {
      setTimeout(() => clearSpreadWaveClasses(), 160);
    }, { passive: true });
  }

  function reshuffleMysteryDeck() {
    const targetCount = getTargetPickCount();
    if (state.isShufflingDeck || state.pickedCards.length >= targetCount) return;

    state.isShufflingDeck = true;
    clearSpreadWaveClasses();
    if (elements.btnReshuffleDeck) {
      elements.btnReshuffleDeck.disabled = true;
    }

    window.bgmPlayer?.playShuffle();
    const deckRect = elements.spreadDeck.getBoundingClientRect();
    state.particles?.spawnRipple(deckRect.left + deckRect.width / 2, deckRect.top + deckRect.height / 2);

    elements.spreadDeck.querySelectorAll('.mystery-card:not(.picked)').forEach((c) => {
      c.classList.add('is-shuffling');
    });

    setTimeout(() => {
      state.isShufflingDeck = false;
      renderMysteryCardsSpread();
      if (elements.spreadHoverWhisper) {
        elements.spreadHoverWhisper.textContent = '牌陣已重新洗鍊，請再次以直覺感應';
      }
    }, 380);
  }

  function renderMysteryCardsSpread() {
    elements.spreadDeck.innerHTML = '';
    const backSvg = window.CARD_SVGS['back_' + state.season] || window.CARD_SVGS['back_spring'];

    const totalMysteryCards = Math.max(8, 14 - state.pickedCards.length);
    const center = (totalMysteryCards - 1) / 2;
    const hints = window.SPREAD_ARCANA_SEAT_HINTS || [];

    for (let i = 0; i < totalMysteryCards; i++) {
      const cardEl = document.createElement('div');
      cardEl.className = 'mystery-card';
      cardEl.dataset.index = i;
      cardEl.dataset.seatIdx = i;
      const offset = i - center;
      const seatRoman = (hints[i] && hints[i].roman) ? hints[i].roman : String(i + 1);

      cardEl.style.setProperty('--arc-offset', offset.toFixed(2));
      cardEl.style.setProperty('--arc-abs', Math.abs(offset).toFixed(2));
      cardEl.style.animationDelay = `${i * 32}ms`;
      cardEl.innerHTML = `<span class="mystery-seat-num font-serif">${seatRoman}</span>${backSvg}`;

      cardEl.addEventListener('click', () => {
        handleMysteryCardClick(cardEl, i);
      });

      elements.spreadDeck.appendChild(cardEl);
    }

    if (elements.btnReshuffleDeck) {
      elements.btnReshuffleDeck.disabled = state.pickedCards.length >= getTargetPickCount();
    }
  }

  function handleMysteryCardClick(cardEl) {
    const targetCount = getTargetPickCount();
    if (state.isShufflingDeck || state.pickedCards.length >= targetCount || cardEl.classList.contains('picked')) {
      return;
    }

    const pickIdx = state.pickedCards.length;
    cardEl.classList.remove('wave-focus', 'wave-near-1', 'wave-near-2');
    cardEl.classList.add('picked');
    state.activeWaveIndex = -1;

    window.bgmPlayer?.playChime(pickIdx);
    const rect = cardEl.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;
    state.particles?.spawnRipple(cx, cy);
    state.particles?.spawnBurst(cx, cy, 16);

    const drawnIds = state.pickedCards.map((p) => p.cardData.id);
    const availableCards = window.TAROT_CARDS.filter((c) => !drawnIds.includes(c.id));
    const randomCard = availableCards[Math.floor(Math.random() * availableCards.length)];

    const isReversed = Math.random() < 0.5;
    const positionInfo = state.spreadMode === 'single'
      ? (window.SINGLE_SPREAD_POSITION || window.SPREAD_POSITIONS[1])
      : window.SPREAD_POSITIONS[state.pickedCards.length];

    state.pickedCards.push({
      cardData: randomCard,
      isReversed: isReversed,
      position: positionInfo
    });

    const currentCount = state.pickedCards.length;
    renderRitualAltarSlots();
    updatePickProgress(currentCount);

    if (elements.btnReshuffleDeck) {
      elements.btnReshuffleDeck.disabled = currentCount >= targetCount;
    }

    if (currentCount < targetCount) {
      updatePickInstruction(currentCount);
    } else {
      elements.guideBannerText.textContent = state.spreadMode === 'single'
        ? '命運之牌已凝定，正在引渡至時光之席……'
        : '三張命運之牌已凝定，正在引渡至時光之席……';

      if (elements.spreadHoverWhisper) {
        elements.spreadHoverWhisper.textContent = '靜待三秒，即將為妳揭曉命運的牌面';
      }

      setTimeout(() => {
        goToStage(3);
        render3DRevealSlots();
      }, 900);
    }
  }

  function updatePickInstruction(count) {
    if (state.spreadMode === 'single') {
      const pos = window.SINGLE_SPREAD_POSITION || window.SPREAD_POSITIONS[1];
      elements.guideBannerText.textContent = `請以直覺選取 1 張牌 —— 探問今日的【${pos.title}】(${pos.subtitle})`;
      return;
    }

    const nextPos = window.SPREAD_POSITIONS[count];
    if (nextPos) {
      elements.guideBannerText.textContent = `請以直覺選取第 ${count + 1} 張牌 —— 探問妳的【${nextPos.title}】(${nextPos.subtitle})`;
    }
  }

  function updatePickProgress(count) {
    const dots = document.querySelectorAll('#selection-progress-dots .prog-dot');
    dots.forEach((dot, idx) => {
      dot.classList.toggle('filled', idx < count);
    });
  }

  // =========================================================================
  // Stage 3: 3D Card Reveal & SVG Self-Drawing Optics
  // =========================================================================
  function render3DRevealSlots() {
    elements.spreadSlotsGrid.innerHTML = '';
    elements.btnViewReading.style.display = 'none';

    const isSingle = state.spreadMode === 'single';
    elements.spreadSlotsGrid.classList.toggle('single-mode', isSingle);

    if (elements.stage3HeroTitle) {
      elements.stage3HeroTitle.textContent = isSingle ? '流光・當下之鏡' : '溯源・當下・微光';
    }
    if (elements.stage3HeroVerse) {
      elements.stage3HeroVerse.textContent = isSingle
        ? '今日的微光已經降臨，請輕觸翻開牌面。'
        : '命運的三重視野已經降臨，請依序輕觸翻開牌面。';
    }

    state.pickedCards.forEach((item, idx) => {
      const slotEl = document.createElement('div');
      slotEl.className = 'spread-slot';

      const backSvg = window.CARD_SVGS['back_' + state.season] || window.CARD_SVGS['back_spring'];
      const frontSvg = window.CARD_SVGS['card_' + item.cardData.id] || '';

      const orientationLabel = item.isReversed ? '逆位' : '正位';
      const reversedClass = item.isReversed ? 'reversed' : '';
      const isFlipped = state.revealedIndices.has(idx);

      slotEl.innerHTML = `
        <div class="slot-header">
          <div class="slot-position-name font-serif">【${item.position.title}】</div>
          <div class="slot-position-sub">${item.position.subtitle}</div>
        </div>
        <div class="tarot-card-3d ${isFlipped ? 'flipped' : ''}" data-index="${idx}">
          <div class="tarot-card-inner">
            <!-- Back Face -->
            <div class="card-face card-face-back">
              ${backSvg}
            </div>
            <!-- Front Face -->
            <div class="card-face card-face-front ${item.isReversed ? 'is-reversed' : ''}">
              <div class="card-arch-frame" aria-hidden="true"></div>
              <div class="card-specular-glare" aria-hidden="true"></div>
              <div class="card-foil-sheen" aria-hidden="true"></div>
              <div class="card-top-bar">
                <span class="card-roman-num font-serif">${item.cardData.roman}</span>
                <span class="card-orientation-badge ${reversedClass}">${orientationLabel}</span>
              </div>
              <div class="card-artwork-wrapper">
                ${frontSvg}
              </div>
              <div class="card-bottom-bar">
                <div class="card-title-zh font-serif">${item.cardData.name}</div>
                <div class="card-title-en font-sans">${item.cardData.enName}</div>
              </div>
            </div>
          </div>
        </div>
        <div class="reveal-hint font-serif">${isFlipped ? '已揭示・輕觸可放大賞析' : '輕觸翻開牌面'}</div>
      `;

      const card3DEl = slotEl.querySelector('.tarot-card-3d');
      bind3DTilt(card3DEl, {
        maxDeg: 8,
        requireFlipped: true,
        glareTargetSelector: '.card-face-front'
      });

      card3DEl.addEventListener('click', () => {
        flipCard(idx, card3DEl, slotEl.querySelector('.reveal-hint'));
      });

      elements.spreadSlotsGrid.appendChild(slotEl);
    });
  }

  function flipCard(idx, card3DEl, hintEl) {
    const pickedItem = state.pickedCards[idx];
    if (!pickedItem) return;

    if (state.revealedIndices.has(idx)) {
      openCardLightbox(pickedItem.cardData, pickedItem.isReversed);
      return;
    }

    state.revealedIndices.add(idx);
    card3DEl.classList.add('flipped', 'is-drawing');
    if (hintEl) hintEl.textContent = '已揭示・輕觸可放大賞析';

    window.bgmPlayer?.playFlip();
    const cardRect = card3DEl.getBoundingClientRect();
    state.particles?.spawnBurst(cardRect.left + cardRect.width / 2, cardRect.top + cardRect.height / 2, 12);

    unlockArcanaCard(pickedItem.cardData.id);

    const sheenEl = card3DEl.querySelector('.card-foil-sheen');
    if (sheenEl) {
      sheenEl.classList.remove('animate-sheen');
      void sheenEl.offsetWidth;
      sheenEl.classList.add('animate-sheen');
    }

    if (state.revealedIndices.size === getTargetPickCount()) {
      setTimeout(() => {
        elements.btnViewReading.style.display = 'inline-flex';
        elements.btnViewReading.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }, 700);
    }
  }

  // =========================================================================
  // Stage 4: Poetic Reading & Multi-Dimensional Literary Synthesis Engine
  // =========================================================================
  function renderFullReading() {
    const seasonData = window.SEASONS_DATA[state.season];
    const topicData = window.TOPICS_DATA[state.topic];
    const isSingle = state.pickedCards.length === 1;

    const today = new Date();
    const dateStr = `${today.getFullYear()} 年 ${today.getMonth() + 1} 月 ${today.getDate()} 日・${seasonData.name}・${topicData.title}`;

    const synthesisText = buildSynthesizedEssay(seasonData, topicData, state.pickedCards, state.userWhisper);

    const whisperBannerHtml = state.userWhisper
      ? `<div class="reading-whisper-banner font-serif">心語寄託：「${escapeHtml(state.userWhisper)}」</div>`
      : '';

    const readingTagText = isSingle ? `${topicData.title}・單牌指引` : `${topicData.title}・深度解讀`;
    const readingTitleText = isSingle ? '流光定格・當下的鏡像迴響' : '時光的倒影・三重奏的迴響';

    const html = `
      <div class="editorial-header-banner">
        <div class="reading-topic-tag font-sans">${readingTagText}</div>
        <h1 class="reading-main-title font-serif">${readingTitleText}</h1>
        <div class="reading-date-line font-sans">${dateStr}</div>
      </div>

      ${whisperBannerHtml}

      <!-- Mini Cards Overview Strip -->
      <div class="reading-trio-strip">
        ${state.pickedCards.map((item) => `
          <div class="trio-chip">
            <span class="trio-chip-pos font-serif">${item.position.title}</span>
            <span class="trio-chip-name font-serif">${item.cardData.name}</span>
            <span class="trio-chip-state">${item.isReversed ? '逆位' : '正位'}</span>
          </div>
        `).join('')}
      </div>

      <!-- Synthesized Narrative -->
      <div class="reading-synthesis-block">
        <h2 class="synthesis-section-title font-serif">靈魂的交響・時光的伏筆</h2>
        <p class="synthesis-prose font-serif">${synthesisText.p1}</p>
        <p class="synthesis-prose font-serif">${synthesisText.p2}</p>
        <p class="synthesis-prose font-serif">${synthesisText.p3}</p>
      </div>

      <!-- Detailed Breakdown for Each Card -->
      <div class="card-details-stack">
        ${state.pickedCards.map((item, idx) => {
          const orientationData = item.isReversed ? item.cardData.reversed : item.cardData.upright;
          const topicInterpretation = orientationData[state.topic];
          const frontSvg = window.CARD_SVGS['card_' + item.cardData.id] || '';

          return `
            <div class="card-detail-item">
              <div class="detail-thumb-box" data-card-idx="${idx}" title="點擊放大賞析牌面">
                <div class="detail-svg-container ${item.isReversed ? 'reversed' : ''}">
                  ${frontSvg}
                </div>
                <div class="detail-pos-tag font-serif">【${item.position.title}】</div>
                <div class="detail-card-name font-serif">${item.cardData.name} (${item.isReversed ? '逆位' : '正位'})</div>
                <span class="detail-zoom-hint font-sans">放大賞析</span>
              </div>
              <div class="detail-content-box">
                <span class="detail-keyword-pill font-sans">${orientationData.keyword}</span>
                <div class="detail-essence-quote font-serif">“${orientationData.essence}”</div>
                <div class="detail-main-interpretation font-serif">
                  <p>${topicInterpretation}</p>
                </div>
              </div>
            </div>
          `;
        }).join('')}
      </div>

      <!-- Seasonal Blessing -->
      <div class="seasonal-blessing-box">
        <div class="blessing-title font-serif">給妳的季節寄語</div>
        <p class="blessing-verse font-serif">${seasonData.blessing}</p>
      </div>

      <!-- Soul Note Box (P1-1) -->
      <div class="soul-note-box">
        <div class="soul-note-header">
          <h3 class="soul-note-title font-serif">手札隨筆・此刻心緒留白</h3>
          <span class="soul-note-sub font-sans">寫下片語，封存於時光手札與明信片中</span>
        </div>
        <textarea id="stage4-soul-note" class="soul-note-textarea" maxlength="200" placeholder="這張牌讓妳想起了什麼人，或是此刻想對自己說的話……"></textarea>
        <div class="soul-note-actions">
          <button type="button" id="btn-save-soul-note" class="btn-save-note font-serif">封存隨筆</button>
        </div>
      </div>

      <!-- Action Buttons -->
      <div class="reading-action-bar">
        <button id="btn-open-postcard" class="btn-primary font-serif">
          珍藏籤詩
        </button>
        <button id="btn-reset-tarot" class="btn-secondary font-serif">
          重新占卜
        </button>
      </div>
    `;

    elements.readingContainer.innerHTML = html;

    if (!state.sessionRecorded && state.pickedCards.length > 0) {
      const record = saveSessionToJournal(seasonData, topicData, today);
      state.currentRecordId = record.id;
      state.sessionRecorded = true;
      state.pickedCards.forEach((c) => unlockArcanaCard(c.cardData.id));
    }
  }

  /**
   * Multi-Dimensional Literary Synthesis Engine (P0-2)
   * Adapts dynamically to Spread Mode (1 vs 3), Upright/Reversed Arc, Topic & Season.
   */
  function buildSynthesizedEssay(season, topic, pickedCards, whisper) {
    const safeWhisperLead = whisper
      ? `將「${escapeHtml(whisper)}」這句心語輕輕置於月色之下，`
      : `在這段探問「${topic.title}」的安靜旅途裡，`;

    const seasonMetaphorMap = {
      spring: '宛如春雨滲入微涼的土壤',
      summer: '好似夏夜浪潮撫過沙灘上的貝殼',
      autumn: '如同暮光斜斜穿過琥珀色的林葉',
      winter: '猶如一場無聲的大雪覆蓋荒原'
    };
    const seasonMetaphor = seasonMetaphorMap[season.code] || seasonMetaphorMap.spring;

    // Single Card Spread Synthesis
    if (pickedCards.length === 1) {
      const c = pickedCards[0];
      const o = c.isReversed ? c.cardData.reversed : c.cardData.upright;
      const posture = c.isReversed ? '以內斂逆轉的姿態停留' : '以澄澈直立的姿態展開';

      const p1 = `${safeWhisperLead}命運僅僅翻開了一扇窗，讓【${c.cardData.name}】${posture}於妳眼前。它所攜帶的「${o.keyword}」並非遙遠的預言，而是${seasonMetaphor}，精準地映照出妳此刻最真實的心境質地。${o.essence}`;

      const topicVoiceMap = {
        love: c.isReversed
          ? '在感情與羈絆的維度裡，那些尚未說破的試探與保留，其實是心靈保護自己的方式。此刻不必急著替這段緣分定名，允許關係保有一點霧氣般的呼吸感。'
          : '當妳卸下過度的防備，真誠本身的重量自會替妳牽引對等的回應。愛意不需要精密的計算，只需要在心動與信任落座時，坦然地接住它。',
        self: c.isReversed
          ? '靈魂偶爾需要退回安靜的房間，把外界紛雜的標準暫時鎖在門外。今天的不安或遲疑，並不是脆弱，而是內在的聲音提醒妳重新校準心跳的節奏。'
          : '妳比自己想像中更加完整而篤定。無須再四處尋覓別人的座標，順著此刻微光的指引往前走，自我實踐的輪廓已經在腳下成形。',
        career: c.isReversed
          ? '面對未來的版圖與工作抉擇，眼前短暫的膠著正是在替妳過濾浮躁的雜訊。把視線從結果稍微移回到當下的每一個細節，沉澱本身就是積蓄力量。'
          : '所有看似零散的經驗正在這張牌的光暈下悄然匯流。此刻的妳適合溫柔而堅定地握緊方向盤，讓長久以來的構想落地生根。',
        daily: '今日的風向不要求妳去追趕什麼偉大的答案。只需帶著這一句無聲的提醒，像閱讀一首短詩般度過今天，微小的奇蹟就藏在最尋常的呼吸裡。'
      };
      const p2 = topicVoiceMap[topic.id] || topicVoiceMap.daily;
      const p3 = `${season.quote} 在${season.name}的氣息裡，願這枚獨一無二的【流光】像一枚溫潤的書籤，安靜夾在妳今日的時光頁碼之間。`;

      return { p1, p2, p3 };
    }

    // Three Card Spread Synthesis: Classify Orientation Archetype
    const [c1, c2, c3] = pickedCards;
    const o1 = c1.isReversed ? c1.cardData.reversed : c1.cardData.upright;
    const o2 = c2.isReversed ? c2.cardData.reversed : c2.cardData.upright;
    const o3 = c3.isReversed ? c3.cardData.reversed : c3.cardData.upright;

    const r1 = c1.isReversed;
    const r2 = c2.isReversed;
    const r3 = c3.isReversed;

    let arcType = 'dawn';
    if (!r1 && !r2 && !r3) {
      arcType = 'dawn'; // Pure Upright flow
    } else if (!r3 && (r1 || r2)) {
      arcType = 'redemption'; // Past/Present shadow rising into Future clarity
    } else if (r3 && (!r1 || !r2)) {
      arcType = 'introspection'; // Outward momentum turning inward for refinement
    } else {
      arcType = 'alchemical'; // Deep subterranean transformation across all three
    }

    const p1Templates = {
      dawn: `${safeWhisperLead}三張牌面的絲線連綴出一道舒展的光軌。從【溯源】的${c1.cardData.name}開始，那股「${o1.keyword}」的初始動能便未曾熄滅；走進【當下】的${c2.cardData.name}，妳所棲息的「${o2.keyword}」正${seasonMetaphor}，溫柔而堅實地承接著過往的一切伏筆。`,
      redemption: `${safeWhisperLead}這是一段從暗夜走向破曉的長途跋涉。回望【溯源】的${c1.cardData.name}與【當下】的${c2.cardData.name}，「${o1.keyword}」與「${o2.keyword}」的拉扯曾讓妳在夜裡反覆斟酌；那些看似停滯或曲折的伏筆，其實都是在為生命清出容納新光的空地。`,
      introspection: `${safeWhisperLead}外在的風浪正在教會妳把目光轉回心室深處。過去的${c1.cardData.name}與此刻的${c2.cardData.name}在「${o1.keyword}」與「${o2.keyword}」之間鋪開了清晰的肌理——此刻的妳其實早已擁有足夠的輪廓，只是命運邀請妳先放緩腳步。`,
      alchemical: `${safeWhisperLead}這是一組極為私密而深邃的沉潛牌陣。從【溯源】的${c1.cardData.name}至【當下】的${c2.cardData.name}，「${o1.keyword}」與「${o2.keyword}」交織成一場外人看不見的地下河湧動；不必責怪自己此刻的猶疑與疲憊，所有的深層蛻變都在寂靜中發生。`
    };

    const p2Templates = {
      dawn: `而前方【微光】所指涉的${c3.cardData.name}，將帶著「${o3.keyword}」的澄澈意象緩緩升起。${o3.essence} 當「${topic.title}」的脈絡從過去延展到明日，妳不需要費力扮演任何人，只需順著心中那道愈來愈清晰的微光繼續前行。`,
      redemption: `值得慶幸的是，地平線彼端的【微光】由直立的${c3.cardData.name}點亮——「${o3.keyword}」將成為解開前述迷霧的鑰匙。過往所有的迂迴與沉澱都沒有被浪費，它們正被一點一滴轉化為支撐妳重新舒展眉眼的底氣。`,
      introspection: `走向【微光】處，${c3.cardData.name}以逆轉沉思的姿態提示著「${o3.keyword}」。這並非前景受阻，而是一份溫柔的叮囑：在「${topic.title}」的下一頁真正翻開之前，請把向外張望的視線收回來，仔細聆聽靈魂真實的偏好與界線。`,
      alchemical: `在遠方的【微光】位置，${c3.cardData.name}輕輕喚出「${o3.keyword}」的回聲。${o3.essence} 從${c1.cardData.name}到${c3.cardData.name}，命運不是在為難妳，而是透過這段休止符般的留白，替妳洗去不屬於妳的喧囂與期待。`
    };

    const p1 = p1Templates[arcType];
    const p2 = p2Templates[arcType];
    const p3 = `${season.quote} 在${season.name}的微光裡，請允許自己不必隨時保持無懈可擊的姿態。讓風帶走該散去的雜質，讓光留在該停留的心室；只要妳還願意信任自己最初的溫度，這座四季的花園就永遠有妳安放靈魂的一隅。`;

    return { p1, p2, p3 };
  }

  // =========================================================================
  // Unlocked Arcana Storage & Gallery Rendering (P1-2)
  // =========================================================================
  function getUnlockedArcanaIds() {
    const idSet = new Set();
    try {
      const raw = localStorage.getItem(UNLOCKED_ARCANA_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) {
          parsed.forEach((id) => idSet.add(Number(id)));
        }
      }
    } catch (e) {}

    // Also include any card present in historical Soul Journal records
    getJournalRecords().forEach((rec) => {
      (rec.cards || []).forEach((c) => {
        if (c.id !== undefined && c.id !== null) {
          idSet.add(Number(c.id));
        }
      });
    });

    return idSet;
  }

  function unlockArcanaCard(cardId) {
    const idSet = getUnlockedArcanaIds();
    idSet.add(Number(cardId));
    try {
      localStorage.setItem(UNLOCKED_ARCANA_KEY, JSON.stringify(Array.from(idSet)));
    } catch (e) {}
    updateGalleryCountBadge(idSet.size);
  }

  function updateGalleryCountBadge(countOverride) {
    const count = typeof countOverride === 'number' ? countOverride : getUnlockedArcanaIds().size;
    if (elements.galleryUnlockCount) {
      elements.galleryUnlockCount.textContent = `${count}/22`;
    }
    if (elements.galleryStatusText) {
      elements.galleryStatusText.textContent = `已點亮 ${count} / 22 張秘儀印記`;
    }
  }

  function renderArcanaGallery() {
    const container = elements.arcanaGalleryGrid;
    if (!container || !window.TAROT_CARDS) return;

    const unlockedIds = getUnlockedArcanaIds();
    updateGalleryCountBadge(unlockedIds.size);

    const backSvg = window.CARD_SVGS['back_' + state.season] || window.CARD_SVGS['back_spring'];

    container.innerHTML = window.TAROT_CARDS.map((card) => {
      const isUnlocked = unlockedIds.has(card.id);
      const showFront = isUnlocked || state.galleryPeekAll;

      if (showFront) {
        const frontSvg = window.CARD_SVGS['card_' + card.id] || '';
        const statusTag = isUnlocked ? '已邂逅・賞析' : '預覽中・賞析';
        return `
          <div class="gallery-card-item ${isUnlocked ? 'unlocked' : 'peeked'}" data-card-id="${card.id}">
            <span class="gallery-card-roman font-serif">${card.roman}</span>
            <div class="gallery-card-art">${frontSvg}</div>
            <span class="gallery-card-name font-serif">${card.name}</span>
            <span class="gallery-card-state-tag font-sans">${statusTag}</span>
          </div>
        `;
      }

      return `
        <div class="gallery-card-item locked" data-card-id="${card.id}">
          <span class="gallery-card-roman font-serif">${card.roman}</span>
          <div class="gallery-card-art">${backSvg}</div>
          <span class="gallery-card-name font-serif">秘儀待啟</span>
          <span class="gallery-card-state-tag font-sans">尚未邂逅</span>
        </div>
      `;
    }).join('');

    container.querySelectorAll('.gallery-card-item:not(.locked)').forEach((itemEl) => {
      itemEl.addEventListener('click', () => {
        const id = parseInt(itemEl.dataset.cardId, 10);
        const cardData = window.TAROT_CARDS.find((c) => c.id === id);
        if (cardData) {
          openCardLightbox(cardData, false);
        }
      });
    });
  }

  // =========================================================================
  // Card Detail Lightbox Modal (P1-2)
  // =========================================================================
  function openCardLightbox(cardData, initialReversed = false) {
    if (!cardData || !elements.cardLightboxModal) return;
    state.activeLightboxCard = cardData;
    state.activeLightboxReversed = Boolean(initialReversed);

    renderLightboxContent();
    elements.cardLightboxModal.classList.add('open');
    elements.cardLightboxModal.setAttribute('aria-hidden', 'false');
  }

  function closeCardLightbox() {
    if (!elements.cardLightboxModal) return;
    elements.cardLightboxModal.classList.remove('open');
    elements.cardLightboxModal.setAttribute('aria-hidden', 'true');
  }

  function renderLightboxContent() {
    const cardData = state.activeLightboxCard;
    const isRev = state.activeLightboxReversed;
    if (!cardData || !elements.lightboxBody) return;

    const orientData = isRev ? cardData.reversed : cardData.upright;
    const frontSvg = window.CARD_SVGS['card_' + cardData.id] || '';
    const orientBadge = isRev ? '逆位 REVERSED' : '正位 UPRIGHT';

    elements.lightboxBody.innerHTML = `
      <div class="lightbox-showcase-col">
        <div class="lightbox-card-frame ${isRev ? 'is-reversed' : ''}" id="lightbox-card-frame">
          <div class="card-arch-frame" aria-hidden="true"></div>
          <div class="card-specular-glare" aria-hidden="true"></div>
          <div class="card-top-bar">
            <span class="card-roman-num font-serif">${cardData.roman}</span>
            <span class="card-orientation-badge ${isRev ? 'reversed' : ''}">${isRev ? '逆位' : '正位'}</span>
          </div>
          <div class="card-artwork-wrapper">
            ${frontSvg}
          </div>
          <div class="card-bottom-bar">
            <div class="card-title-zh font-serif">${cardData.name}</div>
            <div class="card-title-en font-sans">${cardData.enName}</div>
          </div>
        </div>

        <div class="lightbox-orient-switcher" role="group" aria-label="切換正逆位解說">
          <button type="button" class="lightbox-orient-btn ${!isRev ? 'active' : ''} font-serif" data-orient="upright">正位</button>
          <button type="button" class="lightbox-orient-btn ${isRev ? 'active' : ''} font-serif" data-orient="reversed">逆位</button>
        </div>
      </div>

      <div class="lightbox-lore-col">
        <div>
          <div class="lightbox-lore-en font-sans">${cardData.roman} ・ ${cardData.enName} ・ ${orientBadge}</div>
          <h3 class="lightbox-lore-title font-serif">${cardData.name}</h3>
        </div>
        <span class="detail-keyword-pill font-sans" style="margin-bottom: 4px;">${orientData.keyword}</span>
        <div class="lightbox-lore-essence font-serif">“${orientData.essence}”</div>
        <div class="lightbox-topics-grid">
          <div class="lightbox-topic-item">
            <div class="lightbox-topic-label font-sans">01 / 情感與羈絆</div>
            <div class="lightbox-topic-text font-serif">${orientData.love}</div>
          </div>
          <div class="lightbox-topic-item">
            <div class="lightbox-topic-label font-sans">02 / 自我與靈魂</div>
            <div class="lightbox-topic-text font-serif">${orientData.self}</div>
          </div>
          <div class="lightbox-topic-item">
            <div class="lightbox-topic-label font-sans">03 / 事業與方向</div>
            <div class="lightbox-topic-text font-serif">${orientData.career}</div>
          </div>
          <div class="lightbox-topic-item">
            <div class="lightbox-topic-label font-sans">04 / 今日的溫柔指引</div>
            <div class="lightbox-topic-text font-serif">${orientData.daily}</div>
          </div>
        </div>
      </div>
    `;

    const frame = document.getElementById('lightbox-card-frame');
    if (frame) {
      bind3DTilt(frame, { maxDeg: 9 });
    }

    elements.lightboxBody.querySelectorAll('.lightbox-orient-btn').forEach((btn) => {
      btn.addEventListener('click', () => {
        const nextRev = btn.dataset.orient === 'reversed';
        if (nextRev !== state.activeLightboxReversed) {
          state.activeLightboxReversed = nextRev;
          renderLightboxContent();
        }
      });
    });
  }

  // =========================================================================
  // Soul Journal Storage, Frequency Summary & Inline Notes (P1-1)
  // =========================================================================
  function saveSessionToJournal(seasonData, topicData, today) {
    const dateFormatted = `${today.getFullYear()}.${String(today.getMonth() + 1).padStart(2, '0')}.${String(today.getDate()).padStart(2, '0')}`;
    const record = {
      id: 'journal_' + Date.now(),
      timestamp: today.toISOString(),
      dateFormatted: dateFormatted,
      season: state.season,
      seasonName: seasonData.name,
      seasonEn: seasonData.en,
      topic: state.topic,
      topicTitle: topicData.title,
      spreadMode: state.spreadMode,
      whisper: state.userWhisper || '',
      note: '',
      blessing: seasonData.blessing,
      cards: state.pickedCards.map((c) => ({
        id: c.cardData.id,
        name: c.cardData.name,
        enName: c.cardData.enName,
        roman: c.cardData.roman,
        isReversed: c.isReversed,
        posTitle: c.position.title,
        posSub: c.position.subtitle,
        keyword: c.isReversed ? c.cardData.reversed.keyword : c.cardData.upright.keyword
      }))
    };

    const list = getJournalRecords();
    list.unshift(record);
    if (list.length > 20) {
      list.length = 20;
    }

    writeJournalRecords(list);
    return record;
  }

  function getJournalRecords() {
    try {
      const raw = localStorage.getItem(JOURNAL_STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        return Array.isArray(parsed) ? parsed : [];
      }
    } catch (e) {}
    return [];
  }

  function writeJournalRecords(list) {
    try {
      localStorage.setItem(JOURNAL_STORAGE_KEY, JSON.stringify(list));
    } catch (e) {
      console.info('無法寫入本機手札紀錄:', e);
    }
  }

  function updateRecordNote(recordId, noteText) {
    const records = getJournalRecords();
    const target = records.find((r) => String(r.id) === String(recordId));
    if (!target) return false;
    target.note = noteText.trim();
    writeJournalRecords(records);

    if (state.currentPostcardPayload && String(state.currentPostcardPayload.recordId) === String(recordId)) {
      state.currentPostcardPayload.note = target.note;
    }
    if (String(state.currentRecordId) === String(recordId)) {
      const stage4NoteEl = document.getElementById('stage4-soul-note');
      if (stage4NoteEl && stage4NoteEl.value.trim() !== target.note) {
        stage4NoteEl.value = target.note;
      }
    }
    return true;
  }

  function saveStage4SoulNote() {
    const textarea = document.getElementById('stage4-soul-note');
    if (!textarea || !state.currentRecordId) return;
    if (updateRecordNote(state.currentRecordId, textarea.value)) {
      showToast('隨筆已封存至時光手札');
    }
  }

  function openJournalModal(initialTab = 'timeline') {
    state.editingJournalId = null;
    switchJournalTab(initialTab);
    elements.journalModal.classList.add('open');
    elements.journalModal.setAttribute('aria-hidden', 'false');
  }

  function closeJournalModal() {
    state.editingJournalId = null;
    elements.journalModal.classList.remove('open');
    elements.journalModal.setAttribute('aria-hidden', 'true');
  }

  function switchJournalTab(tabName) {
    const targetTab = tabName === 'gallery' ? 'gallery' : 'timeline';
    state.journalActiveTab = targetTab;

    elements.journalTabBtns.forEach((btn) => {
      const isMatch = btn.dataset.tab === targetTab;
      btn.classList.toggle('active', isMatch);
      btn.setAttribute('aria-selected', isMatch ? 'true' : 'false');
    });

    if (elements.journalTabTimeline) {
      elements.journalTabTimeline.classList.toggle('active', targetTab === 'timeline');
    }
    if (elements.journalTabGallery) {
      elements.journalTabGallery.classList.toggle('active', targetTab === 'gallery');
    }

    if (targetTab === 'gallery') {
      renderArcanaGallery();
    } else {
      renderJournalTimeline();
    }
  }

  function renderJournalFrequencySummary(records) {
    const summaryEl = elements.journalFrequencySummary;
    if (!summaryEl) return;

    if (!records || records.length === 0) {
      summaryEl.style.display = 'none';
      return;
    }

    const cardFreq = {};
    let uprightCount = 0;
    let reversedCount = 0;

    records.forEach((rec) => {
      (rec.cards || []).forEach((c) => {
        cardFreq[c.name] = (cardFreq[c.name] || 0) + 1;
        if (c.isReversed) reversedCount += 1;
        else uprightCount += 1;
      });
    });

    const sortedCards = Object.entries(cardFreq).sort((a, b) => b[1] - a[1]);
    const topCard = sortedCards.length > 0 ? sortedCards[0] : null;
    const totalCards = uprightCount + reversedCount;
    const balanceHint = totalCards > 0
      ? (uprightCount >= reversedCount
        ? `正位顯化居多（${uprightCount}:${reversedCount}），心緒傾向外在舒展與明朗行動`
        : `逆位內省居多（${uprightCount}:${reversedCount}），近來靈魂偏好向內沉澱與修整`)
      : '';

    summaryEl.style.display = 'block';
    summaryEl.innerHTML = `
      <span class="font-serif">
        近期共與時光對話 <strong>${records.length}</strong> 次${topCard ? `，最常相遇的秘儀為 <strong>【${topCard[0]}】</strong>（${topCard[1]} 回）` : ''}；${balanceHint}。
      </span>
    `;
  }

  function renderJournalTimeline() {
    const allRecords = getJournalRecords();
    const container = elements.journalTimelineList;
    if (!container) return;

    renderJournalFrequencySummary(allRecords);
    updateGalleryCountBadge();

    const filtered = state.journalFilterSeason === 'all'
      ? allRecords
      : allRecords.filter((r) => r.season === state.journalFilterSeason);

    if (!allRecords || allRecords.length === 0) {
      container.innerHTML = `
        <div class="journal-empty-hint font-serif">
          手札尚是一片靜謐的留白，<br>等待妳寫下第一頁星光。
        </div>
      `;
      return;
    }

    if (filtered.length === 0) {
      container.innerHTML = `
        <div class="journal-empty-hint font-serif">
          此季節尚無留存的籤詩紀錄，<br>等待妳在下一次季風拂過時翻牌。
        </div>
      `;
      return;
    }

    container.innerHTML = filtered.map((rec) => {
      const cardsHtml = (rec.cards || []).map((c) => `
        <div class="journal-card-chip font-serif">
          <span class="chip-pos">【${c.posTitle}】</span>
          <span>${c.name}</span>
          <span class="chip-state">(${c.isReversed ? '逆' : '正'})</span>
        </div>
      `).join('');

      const whisperHtml = rec.whisper
        ? `<div class="journal-whisper-line font-serif">“${escapeHtml(rec.whisper)}”</div>`
        : '';

      const isEditing = String(state.editingJournalId) === String(rec.id);
      const noteHtml = isEditing
        ? `
          <div class="journal-inline-editor">
            <textarea class="journal-inline-textarea" maxlength="200" placeholder="寫下此刻回望這組牌面的感受……">${escapeHtml(rec.note || '')}</textarea>
            <div class="journal-inline-editor-actions">
              <button type="button" class="journal-replay-btn btn-cancel-inline-note font-sans">取消</button>
              <button type="button" class="journal-replay-btn btn-save-inline-note font-sans">儲存隨筆</button>
            </div>
          </div>
        `
        : (rec.note
          ? `<div class="journal-note-preview font-serif">隨筆：${escapeHtml(rec.note)}</div>`
          : '');

      const spreadLabel = rec.spreadMode === 'single' ? '單牌・流光' : '三牌・時光';

      return `
        <div class="journal-timeline-card" data-record-id="${rec.id}">
          <div class="journal-card-top font-sans">
            <div class="journal-date font-sans">${rec.dateFormatted}</div>
            <div class="journal-tags">
              <span class="journal-tag font-sans">${rec.seasonName}</span>
              <span class="journal-tag font-sans">${rec.topicTitle}</span>
              <span class="journal-tag font-sans">${spreadLabel}</span>
            </div>
          </div>
          ${whisperHtml}
          <div class="journal-cards-row font-serif">
            ${cardsHtml}
          </div>
          ${noteHtml}
          <div class="journal-card-bottom">
            <span class="journal-blessing-excerpt font-serif">“${rec.blessing || ''}”</span>
            <div class="journal-card-actions">
              <button type="button" class="journal-replay-btn btn-edit-inline-note font-serif" data-record-id="${rec.id}">隨筆批註</button>
              <button type="button" class="journal-replay-btn btn-replay-postcard font-serif" data-record-id="${rec.id}">重溫籤詩</button>
            </div>
          </div>
        </div>
      `;
    }).join('');

    container.querySelectorAll('.journal-timeline-card').forEach((cardEl) => {
      const id = cardEl.dataset.recordId;
      const targetRec = allRecords.find((r) => String(r.id) === String(id));
      if (!targetRec) return;

      const editBtn = cardEl.querySelector('.btn-edit-inline-note');
      if (editBtn) {
        editBtn.addEventListener('click', (e) => {
          e.stopPropagation();
          state.editingJournalId = String(state.editingJournalId) === String(id) ? null : id;
          renderJournalTimeline();
        });
      }

      const cancelInlineBtn = cardEl.querySelector('.btn-cancel-inline-note');
      if (cancelInlineBtn) {
        cancelInlineBtn.addEventListener('click', (e) => {
          e.stopPropagation();
          state.editingJournalId = null;
          renderJournalTimeline();
        });
      }

      const saveInlineBtn = cardEl.querySelector('.btn-save-inline-note');
      if (saveInlineBtn) {
        saveInlineBtn.addEventListener('click', (e) => {
          e.stopPropagation();
          const ta = cardEl.querySelector('.journal-inline-textarea');
          if (ta && updateRecordNote(id, ta.value)) {
            state.editingJournalId = null;
            renderJournalTimeline();
            showToast('隨筆已更新');
          }
        });
      }

      const inlineTextarea = cardEl.querySelector('.journal-inline-textarea');
      if (inlineTextarea) {
        inlineTextarea.addEventListener('click', (e) => e.stopPropagation());
      }

      const replayBtn = cardEl.querySelector('.btn-replay-postcard');
      if (replayBtn) {
        replayBtn.addEventListener('click', (e) => {
          e.stopPropagation();
          closeJournalModal();
          openPostcardModal(targetRec);
        });
      }

      cardEl.addEventListener('click', () => {
        if (String(state.editingJournalId) === String(id)) return;
        closeJournalModal();
        openPostcardModal(targetRec);
      });
    });
  }

  function clearJournalRecords() {
    const records = getJournalRecords();
    if (!records || records.length === 0) {
      showToast('目前尚無手札紀錄');
      return;
    }

    const confirmed = window.confirm('確定要清空所有時光手札嗎？此動作無法復原。');
    if (confirmed) {
      try {
        localStorage.removeItem(JOURNAL_STORAGE_KEY);
      } catch (e) {}
      state.editingJournalId = null;
      renderJournalTimeline();
      showToast('時光手札已回歸純淨留白');
    }
  }

  // =========================================================================
  // Postcard Modal & PNG Export
  // =========================================================================
  function openPostcardModal(recordData = null) {
    let seasonData, topicTitle, cards, blessing, dateStr, whisper, note, recordId;

    if (recordData) {
      seasonData = window.SEASONS_DATA[recordData.season] || window.SEASONS_DATA.spring;
      topicTitle = recordData.topicTitle;
      cards = recordData.cards || [];
      blessing = recordData.blessing;
      dateStr = recordData.dateFormatted;
      whisper = recordData.whisper || '';
      note = recordData.note || '';
      recordId = recordData.id;
    } else {
      seasonData = window.SEASONS_DATA[state.season];
      topicTitle = window.TOPICS_DATA[state.topic].title;
      cards = state.pickedCards.map((c) => ({
        id: c.cardData.id,
        name: c.cardData.name,
        roman: c.cardData.roman,
        isReversed: c.isReversed,
        posTitle: c.position.title,
        keyword: c.isReversed ? c.cardData.reversed.keyword : c.cardData.upright.keyword
      }));
      blessing = seasonData.blessing;
      const today = new Date();
      dateStr = `${today.getFullYear()}.${String(today.getMonth() + 1).padStart(2, '0')}.${String(today.getDate()).padStart(2, '0')}`;
      whisper = state.userWhisper || '';
      const stage4NoteEl = document.getElementById('stage4-soul-note');
      const liveRec = state.currentRecordId
        ? getJournalRecords().find((r) => String(r.id) === String(state.currentRecordId))
        : null;
      note = stage4NoteEl ? stage4NoteEl.value.trim() : (liveRec ? liveRec.note : '');
      recordId = state.currentRecordId;
    }

    state.currentPostcardPayload = {
      recordId,
      seasonData,
      topicTitle,
      cards,
      blessing,
      dateStr,
      whisper,
      note
    };

    const isSingle = cards.length === 1;
    const trioVisualHtml = cards.map((c) => {
      const svg = window.CARD_SVGS['card_' + c.id] || '';
      return `
        <div class="postcard-mini-card">
          <span class="mini-pos-tag font-serif">【${c.posTitle}】</span>
          <span class="mini-roman font-serif">${c.roman || ''}</span>
          <div class="mini-svg-wrap ${c.isReversed ? 'is-reversed' : ''}">
            ${svg}
          </div>
          <span class="mini-card-name font-serif">${c.name}</span>
          <span class="mini-orientation-badge font-sans">${c.isReversed ? '逆位' : '正位'}</span>
        </div>
      `;
    }).join('');

    const whisperLineHtml = whisper
      ? `<div class="postcard-whisper-line font-serif">問：「${escapeHtml(whisper)}」</div>`
      : '';

    const noteBoxHtml = note
      ? `
        <div class="postcard-note-box font-serif">
          <span class="postcard-note-label font-sans">手札隨筆</span>
          ${escapeHtml(note)}
        </div>
      `
      : '';

    elements.postcardEditorialSheet.innerHTML = `
      <div class="postcard-crest-ornament" aria-hidden="true">
        <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.2">
          <circle cx="12" cy="12" r="9" stroke-dasharray="2 3" stroke-opacity="0.65"></circle>
          <polygon points="12,3 13.3,10.7 21,12 13.3,13.3 12,21 10.7,13.3 3,12 10.7,10.7" fill="currentColor" fill-opacity="0.88"></polygon>
        </svg>
      </div>
      <div class="postcard-subtitle font-sans">${seasonData.en}・${seasonData.name}</div>
      <h3 class="postcard-title font-serif">四時詩籤・謐夜迴響</h3>
      ${whisperLineHtml}
      <div class="postcard-trio-visual ${isSingle ? 'single-mode' : ''}">
        ${trioVisualHtml}
      </div>
      <div class="postcard-quote-body font-serif">
        ${blessing}
      </div>
      ${noteBoxHtml}
      <div class="postcard-footer-seal font-sans">
        ${dateStr}・探問「${topicTitle}」・謐夜深思
      </div>
    `;

    applyPostcardRatioClass();
    elements.postcardModal.classList.add('open');
    elements.postcardModal.setAttribute('aria-hidden', 'false');
  }

  function applyPostcardRatioClass() {
    const isTall = state.postcardRatio === '9:16';
    if (elements.postcardEditorialSheet) {
      elements.postcardEditorialSheet.classList.toggle('ratio-9-16', isTall);
    }
    elements.postcardRatioBtns.forEach((btn) => {
      btn.classList.toggle('active', btn.dataset.ratio === state.postcardRatio);
    });
  }

  function closePostcardModal() {
    elements.postcardModal.classList.remove('open');
    elements.postcardModal.setAttribute('aria-hidden', 'true');
  }

  function downloadPostcardImage() {
    const sheet = elements.postcardEditorialSheet;
    const btn = elements.btnDownloadPostcard;
    const btnText = elements.btnDownloadText;
    if (!sheet) return;

    if (typeof window.html2canvas !== 'function') {
      showToast('圖片匯出模組尚未載入，請稍候重試');
      return;
    }

    const originalText = btnText ? btnText.textContent : '儲存籤詩圖片';
    if (btnText) btnText.textContent = '正在凝印籤詩……';
    if (btn) btn.disabled = true;

    const exportScale = state.postcardRatio === '9:16' ? 2.5 : 2;
    const modeTag = state.postcardRatio === '9:16' ? '桌布' : '書籤';

    window.html2canvas(sheet, {
      scale: exportScale,
      useCORS: true,
      backgroundColor: null,
      logging: false
    }).then((canvas) => {
      const now = new Date();
      const dateCode = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}`;
      const link = document.createElement('a');
      link.download = `四時詩籤_${modeTag}_${dateCode}.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();
      showToast('籤詩圖卡已珍藏至裝置');
    }).catch((err) => {
      console.error('明信片凝印失敗:', err);
      showToast('圖卡凝印失敗，請嘗試複製文字');
    }).finally(() => {
      if (btnText) btnText.textContent = originalText;
      if (btn) btn.disabled = false;
    });
  }

  function copyPostcardProse() {
    const payload = state.currentPostcardPayload;
    if (!payload) return;

    const cardsText = payload.cards.map((c) => {
      return `${c.posTitle}：${c.name} (${c.isReversed ? '逆位' : '正位'}) —— ${c.keyword || ''}`;
    }).join('\n');

    const whisperLine = payload.whisper ? `\n心語寄託：${payload.whisper}` : '';
    const noteLine = payload.note ? `\n\n手札隨筆：\n${payload.note}` : '';

    const copyText = `【四時詩籤・謐夜塔羅】
時光印記：${payload.dateStr}・${payload.seasonData.name}
探問心境：${payload.topicTitle}${whisperLine}

${cardsText}

給妳的季節寄語：
${payload.blessing}${noteLine}

—— 願妳在四季更迭的風裡，聽見心底最初的潮聲。`;

    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(copyText).then(() => {
        showToast('籤詩已珍藏至剪貼簿');
      }).catch(() => {
        fallbackCopy(copyText);
      });
    } else {
      fallbackCopy(copyText);
    }
  }

  function fallbackCopy(text) {
    const textArea = document.createElement('textarea');
    textArea.value = text;
    document.body.appendChild(textArea);
    textArea.select();
    try {
      document.execCommand('copy');
      showToast('籤詩已珍藏至剪貼簿');
    } catch (err) {
      showToast('無法自動複製，請手動選取文字');
    }
    document.body.removeChild(textArea);
  }

  function showToast(msg) {
    elements.toastNotice.textContent = msg;
    elements.toastNotice.classList.add('show');
    setTimeout(() => {
      elements.toastNotice.classList.remove('show');
    }, 2800);
  }

  function resetState() {
    state.pickedCards = [];
    state.revealedIndices = new Set();
    state.sessionRecorded = false;
    state.currentRecordId = null;
    state.currentPostcardPayload = null;
    state.userWhisper = '';
    if (elements.userWhisperInput) {
      elements.userWhisperInput.value = '';
    }
    goToStage(1);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
