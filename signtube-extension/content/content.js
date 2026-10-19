/**
 * SignTube Content Script
 * Injects a sign language avatar overlay onto YouTube video pages.
 * The avatar sits RIGHT NEXT to the video so users don't need to move their eyes.
 */

(function () {
  'use strict';

  // ═══════════════════════════════════════════════
  //  CONFIG & STATE
  // ═══════════════════════════════════════════════

  const CONFIG = {
    SIGN_DURATION: 700,       // ms per word sign
    LETTER_DURATION: 400,     // ms per fingerspelled letter
    CAPTION_POLL_MS: 500,     // how often to check for new captions
    MAX_QUEUE_SIZE: 30,       // trim queue if it grows too large
    AVATAR_WIDTH: 220,        // default avatar panel width
    AVATAR_HEIGHT: 260,       // default avatar panel height
    POSITION: 'bottom-right', // default position relative to video
  };

  let state = {
    isInjected: false,
    isMinimized: false,
    isPaused: false,
    isDragging: false,
    isResizing: false,
    avatarReady: false,
    lastCaption: '',
    currentWord: '',
    queueLength: 0,
    processedCaptions: new Set(),
    captionObserver: null,
    pollInterval: null,
    fingerspellingEnabled: true,
    // Dragging state
    dragOffsetX: 0,
    dragOffsetY: 0,
  };

  // SiGML file index (populated from bundled files)
  let sigmlIndex = new Set();

  // ═══════════════════════════════════════════════
  //  SIGML INDEX – load from extension's bundled files
  // ═══════════════════════════════════════════════

  async function buildSigmlIndex() {
    // We'll fetch the index file that lists all available .sigml filenames
    try {
      const indexURL = chrome.runtime.getURL('sigml/index.json');
      const res = await fetch(indexURL);
      const data = await res.json();
      sigmlIndex = new Set(data);
      console.log(`[SignTube] Loaded ${sigmlIndex.size} SiGML entries`);
    } catch (e) {
      console.warn('[SignTube] Could not load sigml index, using empty set:', e);
      sigmlIndex = new Set();
    }
  }

  function getSigmlPath(word) {
    const clean = word.toLowerCase().replace(/\s+/g, '_');
    if (sigmlIndex.has(clean + '.sigml')) {
      return { found: true, paths: [`sigml/${clean}.sigml`] };
    }
    // Fingerspelling fallback
    if (state.fingerspellingEnabled) {
      const chars = clean.split('');
      const paths = [];
      for (const c of chars) {
        if (/^[a-z0-9]$/.test(c) && sigmlIndex.has(c + '.sigml')) {
          paths.push(`sigml/${c}.sigml`);
        }
      }
      if (paths.length > 0) {
        return { found: false, fingerspelled: true, paths };
      }
    }
    return { found: false, paths: [] };
  }

  // ═══════════════════════════════════════════════
  //  NLP (inline – no server needed)
  // ═══════════════════════════════════════════════

  const STOP_WORDS = new Set([
    'a', 'an', 'the', 'is', 'am', 'are', 'was', 'were', 'be', 'been',
    'being', 'do', 'does', 'did', 'doing', 'will', 'would', 'shall',
    'should', 'may', 'might', 'must', 'can', 'could',
    'has', 'have', 'had', 'having', 'to', 'of', 'its'
  ]);

  const CONTRACTIONS = {
    "i'm": "i", "i'll": "i will", "i've": "i have", "i'd": "i would",
    "you're": "you", "you'll": "you will", "you've": "you have",
    "he's": "he", "she's": "she", "it's": "it",
    "we're": "we", "they're": "they",
    "don't": "dont", "doesn't": "dont", "didn't": "didnt",
    "can't": "can not", "won't": "not will",
    "isn't": "not", "aren't": "not", "wasn't": "not",
    "that's": "that", "what's": "what", "there's": "there",
    "let's": "let us", "here's": "here",
    "thank you": "thank",
  };

  const PHRASE_MAP = [
    [/\bi am going to\b/g, "i go"],
    [/\bi am\b/g, "i"],
    [/\bwe are\b/g, "we"],
    [/\bthey are\b/g, "they"],
    [/\bhe is\b/g, "he"],
    [/\bshe is\b/g, "she"],
    [/\ba lot of\b/g, "a_lot"],
    [/\bget rid of\b/g, "get_rid_of"],
    [/\bthank you\b/g, "thank"],
    [/\bwell done\b/g, "well_done"],
    [/\bthank god\b/g, "thank_god"],
    [/\bi don't know\b/g, "i_dont_know"],
    [/\bi know\b/g, "i_know"],
  ];

  function processCaption(text) {
    if (!text) return [];
    let clean = text
      .replace(/\[.*?\]/g, '')
      .replace(/<[^>]*>/g, '')
      .replace(/[.,\/#!$%\^&\*;:{}=\-_`~()"\[\]]/g, ' ')
      .replace(/\s+/g, ' ')
      .toLowerCase().trim();

    if (!clean) return [];

    // Expand contractions
    const words = clean.split(/\s+/);
    clean = words.map(w => CONTRACTIONS[w] || w).join(' ');

    // Phrase simplification
    for (const [pat, rep] of PHRASE_MAP) {
      clean = clean.replace(pat, rep);
    }

    return clean.split(/\s+/)
      .filter(w => w.length > 0 && !STOP_WORDS.has(w));
  }

  // ═══════════════════════════════════════════════
  //  UI INJECTION
  // ═══════════════════════════════════════════════

  function createAvatarPanel() {
    if (document.getElementById('signtube-avatar-container')) return;

    const container = document.createElement('div');
    container.id = 'signtube-avatar-container';

    // Header
    const header = document.createElement('div');
    header.id = 'signtube-header-bar';

    const title = document.createElement('div');
    title.className = 'signtube-header-title';
    title.innerHTML = `
      <span class="signtube-logo-dot"></span>
      <span>SignTube</span>
    `;

    const minimizedIcon = document.createElement('div');
    minimizedIcon.id = 'signtube-minimized-icon';
    minimizedIcon.textContent = '🤟';

    const controls = document.createElement('div');
    controls.className = 'signtube-header-controls';

    // Pause button
    const pauseBtn = document.createElement('button');
    pauseBtn.id = 'signtube-btn-pause';
    pauseBtn.title = 'Pause/Resume signing';
    pauseBtn.textContent = '⏸';
    pauseBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      state.isPaused = !state.isPaused;
      pauseBtn.textContent = state.isPaused ? '▶' : '⏸';
      if (state.isPaused) {
        sendToAvatar({ type: 'pause' });
      } else {
        sendToAvatar({ type: 'resume' });
      }
    });

    // Position toggle
    const posBtn = document.createElement('button');
    posBtn.id = 'signtube-btn-position';
    posBtn.title = 'Cycle position (Bottom-Right → Bottom-Left → Top-Right → Top-Left)';
    posBtn.textContent = '◫';
    posBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      cyclePosition();
    });

    // Minimize button
    const minBtn = document.createElement('button');
    minBtn.id = 'signtube-btn-minimize';
    minBtn.title = 'Minimize';
    minBtn.textContent = '−';
    minBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      toggleMinimize();
    });

    controls.appendChild(pauseBtn);
    controls.appendChild(posBtn);
    controls.appendChild(minBtn);

    header.appendChild(minimizedIcon);
    header.appendChild(title);
    header.appendChild(controls);

    // Avatar iframe
    const iframe = document.createElement('iframe');
    iframe.id = 'signtube-avatar-iframe';
    iframe.src = chrome.runtime.getURL('avatar/index.html');
    iframe.allow = 'autoplay';
    iframe.title = 'Sign Language Avatar';

    // Status bar
    const statusBar = document.createElement('div');
    statusBar.id = 'signtube-status-bar';
    statusBar.innerHTML = `
      <span class="signtube-idle-text">Waiting for captions...</span>
    `;

    // Resize handle
    const resizeHandle = document.createElement('div');
    resizeHandle.className = 'signtube-resize-handle';

    container.appendChild(header);
    container.appendChild(iframe);
    container.appendChild(statusBar);
    container.appendChild(resizeHandle);

    // Append to the video player area
    positionAvatar(container);

    // Setup dragging
    setupDrag(container, header);
    setupResize(container, resizeHandle);

    // Listen for avatar messages
    window.addEventListener('message', handleAvatarMessage);

    // Mark as injected
    state.isInjected = true;

    console.log('[SignTube] Avatar panel injected');
  }

  function positionAvatar(container) {
    // Find the YouTube player container
    const playerContainer =
      document.querySelector('#movie_player') ||
      document.querySelector('.html5-video-player') ||
      document.querySelector('#player-container-outer') ||
      document.querySelector('#player');

    if (!playerContainer) {
      // Fallback: attach to body with fixed position
      container.style.position = 'fixed';
      container.style.bottom = '80px';
      container.style.right = '20px';
      document.body.appendChild(container);
      return;
    }

    // Ensure the player container has relative positioning for absolute children
    const computedStyle = window.getComputedStyle(playerContainer);
    if (computedStyle.position === 'static') {
      playerContainer.style.position = 'relative';
    }

    // Position inside the player, near the video
    container.style.position = 'absolute';
    applyPosition(container, CONFIG.POSITION);

    playerContainer.appendChild(container);
  }

  function applyPosition(container, position) {
    // Reset
    container.style.top = '';
    container.style.bottom = '';
    container.style.left = '';
    container.style.right = '';

    switch (position) {
      case 'bottom-right':
        container.style.bottom = '60px'; // Above YouTube controls
        container.style.right = '12px';
        break;
      case 'bottom-left':
        container.style.bottom = '60px';
        container.style.left = '12px';
        break;
      case 'top-right':
        container.style.top = '12px';
        container.style.right = '12px';
        break;
      case 'top-left':
        container.style.top = '12px';
        container.style.left = '12px';
        break;
    }
  }

  const POSITIONS = ['bottom-right', 'bottom-left', 'top-right', 'top-left'];

  function cyclePosition() {
    const idx = POSITIONS.indexOf(CONFIG.POSITION);
    CONFIG.POSITION = POSITIONS[(idx + 1) % POSITIONS.length];
    const container = document.getElementById('signtube-avatar-container');
    if (container) {
      applyPosition(container, CONFIG.POSITION);
      showPositionIndicator(CONFIG.POSITION);
    }
  }

  function showPositionIndicator(pos) {
    let indicator = document.querySelector('.signtube-position-indicator');
    if (!indicator) {
      indicator = document.createElement('div');
      indicator.className = 'signtube-position-indicator';
      const playerContainer = document.querySelector('#movie_player') ||
        document.querySelector('.html5-video-player') || document.body;
      playerContainer.appendChild(indicator);
    }
    indicator.textContent = `📍 ${pos.replace('-', ' ').toUpperCase()}`;
    indicator.classList.add('signtube-visible');
    setTimeout(() => indicator.classList.remove('signtube-visible'), 1200);
  }

  function toggleMinimize() {
    const container = document.getElementById('signtube-avatar-container');
    if (!container) return;
    state.isMinimized = !state.isMinimized;
    container.classList.toggle('signtube-minimized', state.isMinimized);
  }

  // ═══════════════════════════════════════════════
  //  DRAGGING
  // ═══════════════════════════════════════════════

  function setupDrag(container, handle) {
    handle.addEventListener('mousedown', (e) => {
      if (e.target.tagName === 'BUTTON') return;
      e.preventDefault();
      state.isDragging = true;
      container.classList.add('signtube-dragging');

      const rect = container.getBoundingClientRect();
      state.dragOffsetX = e.clientX - rect.left;
      state.dragOffsetY = e.clientY - rect.top;

      // Switch to fixed positioning for free dragging
      container.style.position = 'fixed';
      container.style.left = rect.left + 'px';
      container.style.top = rect.top + 'px';
      container.style.right = '';
      container.style.bottom = '';

      // Move to body for unrestricted dragging
      if (container.parentElement !== document.body) {
        document.body.appendChild(container);
      }
    });

    document.addEventListener('mousemove', (e) => {
      if (!state.isDragging) return;
      e.preventDefault();
      const x = e.clientX - state.dragOffsetX;
      const y = e.clientY - state.dragOffsetY;
      container.style.left = x + 'px';
      container.style.top = y + 'px';
    });

    document.addEventListener('mouseup', () => {
      if (!state.isDragging) return;
      state.isDragging = false;
      container.classList.remove('signtube-dragging');
    });
  }

  // ═══════════════════════════════════════════════
  //  RESIZING
  // ═══════════════════════════════════════════════

  function setupResize(container, handle) {
    handle.addEventListener('mousedown', (e) => {
      e.preventDefault();
      e.stopPropagation();
      state.isResizing = true;
      const startW = container.offsetWidth;
      const startH = container.offsetHeight;
      const startX = e.clientX;
      const startY = e.clientY;

      const onMove = (ev) => {
        if (!state.isResizing) return;
        const newW = Math.max(160, startW + (ev.clientX - startX));
        const newH = Math.max(180, startH + (ev.clientY - startY));
        container.style.width = newW + 'px';
        container.style.height = newH + 'px';
        // Adjust iframe height
        const iframe = container.querySelector('#signtube-avatar-iframe');
        if (iframe) {
          iframe.style.height = (newH - 66) + 'px'; // header + statusbar ~66px
        }
      };

      const onUp = () => {
        state.isResizing = false;
        document.removeEventListener('mousemove', onMove);
        document.removeEventListener('mouseup', onUp);
      };

      document.addEventListener('mousemove', onMove);
      document.addEventListener('mouseup', onUp);
    });
  }

  // ═══════════════════════════════════════════════
  //  AVATAR COMMUNICATION
  // ═══════════════════════════════════════════════

  function sendToAvatar(msg) {
    const iframe = document.getElementById('signtube-avatar-iframe');
    if (iframe && iframe.contentWindow) {
      iframe.contentWindow.postMessage(msg, '*');
    }
  }

  function handleAvatarMessage(event) {
    const data = event.data;
    if (!data || !data.type) return;

    const statusBar = document.getElementById('signtube-status-bar');
    if (!statusBar) return;

    switch (data.type) {
      case 'avatar-ready':
      case 'pong':
        state.avatarReady = true;
        console.log('[SignTube] Avatar engine ready');
        break;

      case 'avatar-playing':
        state.currentWord = data.word || '';
        statusBar.innerHTML = `
          <span class="signtube-current-word">
            <span class="signtube-play-icon">▶</span>
            ${escapeHtml(state.currentWord)}
          </span>
          <span class="signtube-queue-info">${state.queueLength > 0 ? 'Q:' + state.queueLength : ''}</span>
        `;
        break;

      case 'avatar-idle':
        state.currentWord = '';
        statusBar.innerHTML = `<span class="signtube-idle-text">Waiting for captions...</span>`;
        break;

      case 'avatar-word-done':
        // Word finished playing
        break;

      case 'avatar-skipped':
        console.log(`[SignTube] Skipped ${data.count} signs to keep up`);
        break;
    }
  }

  function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  // ═══════════════════════════════════════════════
  //  CAPTION DETECTION
  // ═══════════════════════════════════════════════

  function startCaptionMonitor() {
    // Method 1: MutationObserver on YouTube's caption container
    const setupObserver = () => {
      const captionContainer =
        document.querySelector('.ytp-caption-window-container') ||
        document.querySelector('.caption-window');

      if (captionContainer) {
        if (state.captionObserver) state.captionObserver.disconnect();

        state.captionObserver = new MutationObserver(() => {
          extractAndProcessCaption();
        });

        state.captionObserver.observe(captionContainer, {
          childList: true,
          subtree: true,
          characterData: true,
        });

        console.log('[SignTube] Caption observer attached');
      }
    };

    // Method 2: Polling fallback (catches captions even when observer misses)
    state.pollInterval = setInterval(() => {
      // Try to set up observer if not yet attached
      if (!state.captionObserver) {
        setupObserver();
      }
      extractAndProcessCaption();
    }, CONFIG.CAPTION_POLL_MS);

    // Initial setup attempt
    setupObserver();
  }

  function extractAndProcessCaption() {
    if (state.isPaused) return;

    // YouTube caption selectors (various YouTube UI versions)
    const captionElements = document.querySelectorAll(
      '.ytp-caption-segment, .captions-text span, .ytp-caption-window-container span'
    );

    let fullText = '';
    captionElements.forEach(el => {
      fullText += el.textContent + ' ';
    });
    fullText = fullText.trim();

    if (!fullText || fullText === state.lastCaption) return;

    state.lastCaption = fullText;

    // Hash the caption to avoid reprocessing
    const hash = simpleHash(fullText);
    if (state.processedCaptions.has(hash)) return;
    state.processedCaptions.add(hash);

    // Keep processed set manageable
    if (state.processedCaptions.size > 500) {
      const arr = Array.from(state.processedCaptions);
      state.processedCaptions = new Set(arr.slice(-200));
    }

    console.log(`[SignTube] Caption: "${fullText}"`);

    // Process through NLP
    const tokens = processCaption(fullText);
    if (tokens.length === 0) return;

    // Build SiGML queue
    const items = [];
    for (const word of tokens) {
      const result = getSigmlPath(word);
      if (result.paths.length > 0) {
        for (const p of result.paths) {
          const w = p.split('/').pop().replace('.sigml', '');
          const duration = w.length === 1 ? CONFIG.LETTER_DURATION : CONFIG.SIGN_DURATION;
          items.push({
            path: p,
            word: w,
            duration
          });
        }
      }
    }

    if (items.length > 0) {
      state.queueLength += items.length;
      sendToAvatar({ type: 'play-batch', items });
    }
  }

  function simpleHash(str) {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash |= 0; // Convert to 32bit integer
    }
    return hash;
  }

  // ═══════════════════════════════════════════════
  //  YOUTUBE NAVIGATION DETECTION
  // ═══════════════════════════════════════════════

  function isWatchPage() {
    return window.location.pathname === '/watch';
  }

  function onNavigate() {
    if (isWatchPage()) {
      // Wait for player to load
      setTimeout(() => {
        createAvatarPanel();
        startCaptionMonitor();
      }, 2000);
    } else {
      cleanup();
    }
  }

  function cleanup() {
    const container = document.getElementById('signtube-avatar-container');
    if (container) container.remove();

    if (state.captionObserver) {
      state.captionObserver.disconnect();
      state.captionObserver = null;
    }
    if (state.pollInterval) {
      clearInterval(state.pollInterval);
      state.pollInterval = null;
    }

    state.isInjected = false;
    state.lastCaption = '';
    state.processedCaptions.clear();

    window.removeEventListener('message', handleAvatarMessage);
  }

  // ═══════════════════════════════════════════════
  //  LISTEN FOR POPUP MESSAGES
  // ═══════════════════════════════════════════════

  chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
    switch (msg.type) {
      case 'toggle-avatar':
        if (state.isInjected) {
          cleanup();
        } else {
          createAvatarPanel();
          startCaptionMonitor();
        }
        sendResponse({ active: state.isInjected });
        break;

      case 'set-position':
        CONFIG.POSITION = msg.position;
        const c = document.getElementById('signtube-avatar-container');
        if (c) applyPosition(c, msg.position);
        sendResponse({ ok: true });
        break;

      case 'set-fingerspelling':
        state.fingerspellingEnabled = msg.enabled;
        sendResponse({ ok: true });
        break;

      case 'set-speed':
        CONFIG.SIGN_DURATION = msg.signDuration || CONFIG.SIGN_DURATION;
        CONFIG.LETTER_DURATION = msg.letterDuration || CONFIG.LETTER_DURATION;
        sendToAvatar({
          type: 'set-speed',
          signDuration: CONFIG.SIGN_DURATION,
          letterDuration: CONFIG.LETTER_DURATION,
        });
        sendResponse({ ok: true });
        break;

      case 'get-status':
        sendResponse({
          active: state.isInjected,
          avatarReady: state.avatarReady,
          currentWord: state.currentWord,
          isPaused: state.isPaused,
          position: CONFIG.POSITION,
        });
        break;
    }
    return true; // keep channel open for async
  });

  // ═══════════════════════════════════════════════
  //  INIT
  // ═══════════════════════════════════════════════

  async function init() {
    console.log('[SignTube] Extension loaded on YouTube');

    // Build the SiGML index
    await buildSigmlIndex();

    // YouTube uses SPA navigation (History API)
    // Listen for navigation events
    const originalPushState = history.pushState;
    history.pushState = function (...args) {
      originalPushState.apply(this, args);
      setTimeout(onNavigate, 500);
    };

    window.addEventListener('popstate', () => setTimeout(onNavigate, 500));

    // Also listen for YouTube's custom navigation events
    document.addEventListener('yt-navigate-finish', () => setTimeout(onNavigate, 1000));

    // Initial check
    if (isWatchPage()) {
      // Wait for video player to fully load
      setTimeout(() => {
        createAvatarPanel();
        startCaptionMonitor();
      }, 3000);
    }
  }

  init();
})();
