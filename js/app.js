/**
 * High-Fashion Editorial Tarot Web App
 * State Machine, Shuffling Ritual, 3D Card Animation, and Literary Synthesis Engine
 */

(function () {
  'use strict';

  // Application State
  const state = {
    season: 'spring',
    topic: 'love',
    currentStage: 1, // 1: Selection, 2: Meditation/Shuffling, 3: Reveal, 4: Reading
    meditationStep: 'breathing', // 'breathing' | 'picking'
    pickedCards: [], // Array of { cardData, isReversed, position }
    revealedIndices: new Set(),
    particles: null
  };

  // DOM Elements Cache
  const elements = {
    appContainer: document.querySelector('.app-container'),
    seasonBtns: document.querySelectorAll('.season-btn'),
    soundToggleBtn: document.getElementById('sound-toggle-btn'),
    stages: {
      1: document.getElementById('stage-1'),
      2: document.getElementById('stage-2'),
      3: document.getElementById('stage-3'),
      4: document.getElementById('stage-4')
    },
    topicCards: document.querySelectorAll('.topic-card'),
    btnStartMeditation: document.getElementById('btn-start-meditation'),
    breathingBox: document.getElementById('breathing-box'),
    btnReadyPick: document.getElementById('btn-ready-pick'),
    spreadSection: document.getElementById('spread-section'),
    spreadDeck: document.getElementById('spread-deck'),
    guideBannerText: document.getElementById('guide-banner-text'),
    progDots: document.querySelectorAll('.prog-dot'),
    spreadSlotsGrid: document.getElementById('spread-slots-grid'),
    btnViewReading: document.getElementById('btn-view-reading'),
    readingContainer: document.getElementById('reading-container'),
    postcardModal: document.getElementById('postcard-modal'),
    btnClosePostcard: document.getElementById('btn-close-postcard'),
    btnCopyPostcardText: document.getElementById('btn-copy-postcard-text'),
    postcardEditorialSheet: document.getElementById('postcard-editorial-sheet'),
    toastNotice: document.getElementById('toast-notice')
  };

  // Initialize App
  function init() {
    // Initialize seasonal particles
    state.particles = new SeasonalParticles('particle-canvas');
    state.particles.setSeason(state.season);

    setupEventListeners();
    applySeasonTheme(state.season);
    updateTopicSelection('love');
  }

  // Event Listeners Setup
  function setupEventListeners() {
    // Season Switcher
    elements.seasonBtns.forEach((btn) => {
      btn.addEventListener('click', (e) => {
        const season = btn.dataset.season;
        if (season && season !== state.season) {
          switchSeason(season);
        }
      });
    });

    // Sound Toggle
    if (elements.soundToggleBtn) {
      elements.soundToggleBtn.addEventListener('click', () => {
        const isMuted = soundEngine.toggleMute();
        elements.soundToggleBtn.style.opacity = isMuted ? '0.4' : '1';
        elements.soundToggleBtn.setAttribute('title', isMuted ? '開啟聲效' : '靜音');
      });
    }

    // Topic Selection
    elements.topicCards.forEach((card) => {
      card.addEventListener('click', () => {
        const topic = card.dataset.topic;
        updateTopicSelection(topic);
        soundEngine.playChime(640, 0.4);
      });
    });

    // Stage 1 -> Stage 2 (Meditation Start)
    if (elements.btnStartMeditation) {
      elements.btnStartMeditation.addEventListener('click', () => {
        soundEngine.playChime(520, 0.8);
        goToStage(2);
        initStage2();
      });
    }

    // Stage 2: Ready to Pick button
    if (elements.btnReadyPick) {
      elements.btnReadyPick.addEventListener('click', () => {
        soundEngine.playChime(720, 0.8);
        revealSpreadDeck();
      });
    }

    // Stage 3 -> Stage 4 (View Detailed Reading)
    if (elements.btnViewReading) {
      elements.btnViewReading.addEventListener('click', () => {
        soundEngine.playChime(600, 1.0);
        goToStage(4);
        renderFullReading();
      });
    }

    // Delegated actions for reading container buttons
    if (elements.readingContainer) {
      elements.readingContainer.addEventListener('click', (e) => {
        const target = e.target.closest('button');
        if (!target) return;
        if (target.id === 'btn-open-postcard') {
          soundEngine.playChime(780, 0.6);
          openPostcardModal();
        } else if (target.id === 'btn-reset-tarot') {
          soundEngine.playChime(480, 0.6);
          resetState();
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

    // Copy Postcard Text
    if (elements.btnCopyPostcardText) {
      elements.btnCopyPostcardText.addEventListener('click', copyPostcardProse);
    }
  }

  // Season Switch Handler
  function switchSeason(seasonKey) {
    state.season = seasonKey;
    applySeasonTheme(seasonKey);
    soundEngine.playBreeze();

    if (state.particles) {
      state.particles.setSeason(seasonKey);
    }

    // Re-render card backs if currently on Stage 2 or 3
    if (state.currentStage === 2) {
      renderMysteryCardsSpread();
    } else if (state.currentStage === 3) {
      render3DRevealSlots();
    }
  }

  function applySeasonTheme(seasonKey) {
    document.documentElement.setAttribute('data-theme', seasonKey);

    elements.seasonBtns.forEach((btn) => {
      btn.classList.toggle('active', btn.dataset.season === seasonKey);
    });
  }

  function updateTopicSelection(topicKey) {
    state.topic = topicKey;
    elements.topicCards.forEach((card) => {
      card.classList.toggle('selected', card.dataset.topic === topicKey);
    });
  }

  // Stage Transitions
  function goToStage(stageNum) {
    state.currentStage = stageNum;

    Object.keys(elements.stages).forEach((num) => {
      const stageEl = elements.stages[num];
      if (parseInt(num, 10) === stageNum) {
        stageEl.classList.add('active');
      } else {
        stageEl.classList.remove('active');
      }
    });

    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  // =========================================================================
  // Stage 2: Meditation & Shuffling
  // =========================================================================
  function initStage2() {
    state.meditationStep = 'breathing';
    state.pickedCards = [];
    state.revealedIndices = new Set();

    elements.breathingBox.style.display = 'block';
    elements.spreadSection.style.display = 'none';
    elements.btnReadyPick.style.opacity = '1';

    updatePickProgress(0);
  }

  function revealSpreadDeck() {
    state.meditationStep = 'picking';
    elements.breathingBox.style.display = 'none';
    elements.spreadSection.style.display = 'block';

    renderMysteryCardsSpread();
    updatePickInstruction(0);
  }

  function renderMysteryCardsSpread() {
    elements.spreadDeck.innerHTML = '';
    const backSvg = window.CARD_SVGS['back_' + state.season] || window.CARD_SVGS['back_spring'];

    // Provide 14 mystery cards laid out for selection
    const totalMysteryCards = 14;
    for (let i = 0; i < totalMysteryCards; i++) {
      const cardEl = document.createElement('div');
      cardEl.className = 'mystery-card';
      cardEl.dataset.index = i;
      cardEl.innerHTML = backSvg;

      cardEl.addEventListener('mouseenter', () => {
        soundEngine.playChime(800 + i * 25, 0.3);
      });

      cardEl.addEventListener('click', () => {
        handleMysteryCardClick(cardEl, i);
      });

      elements.spreadDeck.appendChild(cardEl);
    }
  }

  function handleMysteryCardClick(cardEl, index) {
    if (state.pickedCards.length >= 3 || cardEl.classList.contains('picked')) {
      return;
    }

    cardEl.classList.add('picked');
    soundEngine.playChime(620 + state.pickedCards.length * 120, 0.7);

    // Pick a card from 22 Major Arcana without duplicate
    const drawnIds = state.pickedCards.map((p) => p.cardData.id);
    const availableCards = window.TAROT_CARDS.filter((c) => !drawnIds.includes(c.id));
    const randomCard = availableCards[Math.floor(Math.random() * availableCards.length)];

    // 50% chance Upright / Reversed
    const isReversed = Math.random() < 0.5;
    const positionInfo = window.SPREAD_POSITIONS[state.pickedCards.length];

    state.pickedCards.push({
      cardData: randomCard,
      isReversed: isReversed,
      position: positionInfo
    });

    const currentCount = state.pickedCards.length;
    updatePickProgress(currentCount);

    if (currentCount < 3) {
      updatePickInstruction(currentCount);
    } else {
      // Finished picking 3 cards -> Transition smoothly to Stage 3
      elements.guideBannerText.textContent = '三張命運之牌已凝定，正在引渡至時光之席……';
      setTimeout(() => {
        goToStage(3);
        render3DRevealSlots();
      }, 900);
    }
  }

  function updatePickInstruction(count) {
    const nextPos = window.SPREAD_POSITIONS[count];
    if (nextPos) {
      elements.guideBannerText.textContent = `請以直覺選取第 ${count + 1} 張牌 —— 探問妳的【${nextPos.title}】(${nextPos.subtitle})`;
    }
  }

  function updatePickProgress(count) {
    elements.progDots.forEach((dot, idx) => {
      dot.classList.toggle('filled', idx < count);
    });
  }

  // =========================================================================
  // Stage 3: 3D Card Reveal
  // =========================================================================
  function render3DRevealSlots() {
    elements.spreadSlotsGrid.innerHTML = '';
    elements.btnViewReading.style.display = 'none';

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
        <div class="reveal-hint font-serif">${isFlipped ? '已揭示' : '輕觸翻開牌面'}</div>
      `;

      const card3DEl = slotEl.querySelector('.tarot-card-3d');
      card3DEl.addEventListener('click', () => {
        flipCard(idx, card3DEl, slotEl.querySelector('.reveal-hint'));
      });

      elements.spreadSlotsGrid.appendChild(slotEl);
    });
  }

  function flipCard(idx, card3DEl, hintEl) {
    if (state.revealedIndices.has(idx)) return;

    state.revealedIndices.add(idx);
    card3DEl.classList.add('flipped');
    if (hintEl) hintEl.textContent = '已揭示';
    soundEngine.playFlip();

    // Check if all 3 cards are flipped
    if (state.revealedIndices.size === 3) {
      setTimeout(() => {
        elements.btnViewReading.style.display = 'inline-flex';
        elements.btnViewReading.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }, 700);
    }
  }

  // =========================================================================
  // Stage 4: Poetic Reading Synthesis Engine
  // =========================================================================
  function renderFullReading() {
    const seasonData = window.SEASONS_DATA[state.season];
    const topicData = window.TOPICS_DATA[state.topic];
    const [c1, c2, c3] = state.pickedCards;

    // Date in elegant format
    const today = new Date();
    const dateStr = `${today.getFullYear()} 年 ${today.getMonth() + 1} 月 ${today.getDate()} 日・${seasonData.name}・${topicData.title}`;

    // Synthesize literary essay linking all 3 cards
    const synthesisText = buildSynthesizedEssay(seasonData, topicData, c1, c2, c3);

    let html = `
      <div class="editorial-header-banner">
        <div class="reading-topic-tag font-sans">${topicData.title}・深度解讀</div>
        <h1 class="reading-main-title font-serif">時光的倒影・三重奏的迴響</h1>
        <div class="reading-date-line font-sans">${dateStr}</div>
      </div>

      <!-- Mini Cards Trio Overview Strip -->
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
        ${state.pickedCards.map((item) => {
          const orientationData = item.isReversed ? item.cardData.reversed : item.cardData.upright;
          const topicInterpretation = orientationData[state.topic];
          const frontSvg = window.CARD_SVGS['card_' + item.cardData.id] || '';

          return `
            <div class="card-detail-item">
              <div class="detail-thumb-box">
                <div class="detail-svg-container ${item.isReversed ? 'reversed' : ''}">
                  ${frontSvg}
                </div>
                <div class="detail-pos-tag font-serif">【${item.position.title}】</div>
                <div class="detail-card-name font-serif">${item.cardData.name} (${item.isReversed ? '逆位' : '正位'})</div>
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
  }

  /**
   * Literary Synthesis Engine
   * Dynamically weaves season, topic, and 3 cards into a coherent, high-literary essay
   * Strictly avoids all AI cliches, mechanical phrasing, and robotic transition markers.
   */
  function buildSynthesizedEssay(season, topic, c1, c2, c3) {
    const o1 = c1.isReversed ? c1.cardData.reversed : c1.cardData.upright;
    const o2 = c2.isReversed ? c2.cardData.reversed : c2.cardData.upright;
    const o3 = c3.isReversed ? c3.cardData.reversed : c3.cardData.upright;

    // Paragraph 1: Linking Origin and Present
    const p1 = `在這段探問「${topic.title}」的旅途裡，妳所經歷的每一步，其實都有著草木萌動般的宿命痕跡。回望【溯源】的伏筆，${c1.cardData.name}以${c1.isReversed ? '沉潛逆轉' : '舒展直立'}的姿態，指向了那一段「${o1.keyword}」的心境——那些過往曾讓妳心碎或歡愉的細節，像落在冬雪下的枯枝，雖不作聲，卻深深刻進了妳靈魂的年輪。而此刻【當下】的水流，正好映照出${c2.cardData.name}的倒影，妳所面對的「${o2.keyword}」，並不是孤立的停滯，而是潮汐在折返前必經的深潭。`;

    // Paragraph 2: Present to Future Glimmer
    const p2 = `當夜色漸深，妳可能會在胸口摸到那一塊隱隱作痛的迷惘。然而，【微光】所指向的${c3.cardData.name}，正在地平線上替妳燃起一盞「${o3.keyword}」的燈火。從${c1.cardData.name}的跋涉，途經${c2.cardData.name}的沉澱，再走到${c3.cardData.name}的破曉，這不是命運對妳的刁難，而是一場深情的淬鍊——生命正在把那些瑣碎的砂礫，磨成妳眼底安靜而清澈的星光。`;

    // Paragraph 3: Seasonal resonance & Personal whisper
    const p3 = `${season.quote} 親愛的妳，在${season.name}的微光裡，請允許自己不用隨時保持無懈可擊的堅強。有些答案，本就該像花瓣落水一樣自然，讓風吹走該走的，讓光留給該留的。只要妳還願意信任自己最初的溫度，這座四季的花園，就永遠有妳一席安放靈魂的角落。`;

    return { p1, p2, p3 };
  }

  // =========================================================================
  // Postcard Modal & Export
  // =========================================================================
  function openPostcardModal() {
    const seasonData = window.SEASONS_DATA[state.season];
    const topicData = window.TOPICS_DATA[state.topic];
    const [c1, c2, c3] = state.pickedCards;
    const today = new Date();
    const dateStr = `${today.getFullYear()}.${String(today.getMonth() + 1).padStart(2, '0')}.${String(today.getDate()).padStart(2, '0')}`;

    elements.postcardEditorialSheet.innerHTML = `
      <div class="postcard-subtitle font-sans">${seasonData.en}・${seasonData.name}</div>
      <h3 class="postcard-title font-serif">四季の籤詩・謐夜迴響</h3>
      <div class="postcard-cards-line font-serif">
        溯源【${c1.cardData.name}${c1.isReversed ? '・逆' : '・正'}】 — 
        當下【${c2.cardData.name}${c2.isReversed ? '・逆' : '・正'}】 — 
        微光【${c3.cardData.name}${c3.isReversed ? '・逆' : '・正'}】
      </div>
      <div class="postcard-quote-body font-serif">
        ${seasonData.blessing}
      </div>
      <div class="postcard-footer-seal font-sans">
        ${dateStr}・探問「${topicData.title}」・謐夜深思
      </div>
    `;

    elements.postcardModal.classList.add('open');
  }

  function closePostcardModal() {
    elements.postcardModal.classList.remove('open');
  }

  function copyPostcardProse() {
    const seasonData = window.SEASONS_DATA[state.season];
    const topicData = window.TOPICS_DATA[state.topic];
    const [c1, c2, c3] = state.pickedCards;
    const today = new Date();
    const dateStr = `${today.getFullYear()} 年 ${today.getMonth() + 1} 月 ${today.getDate()} 日`;

    const copyText = `【四季の籤詩・謐夜塔羅】
時光印記：${dateStr}・${seasonData.name}
探問心境：${topicData.title}

溯源：${c1.cardData.name} (${c1.isReversed ? '逆位' : '正位'}) —— ${c1.isReversed ? c1.cardData.reversed.keyword : c1.cardData.upright.keyword}
當下：${c2.cardData.name} (${c2.isReversed ? '逆位' : '正位'}) —— ${c2.isReversed ? c2.cardData.reversed.keyword : c2.cardData.upright.keyword}
微光：${c3.cardData.name} (${c3.isReversed ? '逆位' : '正位'}) —— ${c3.isReversed ? c3.cardData.reversed.keyword : c3.cardData.upright.keyword}

給妳的季節寄語：
${seasonData.blessing}

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
    goToStage(1);
  }

  // Run on DOM Ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();