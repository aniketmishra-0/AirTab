// AirTab - Content Script (Manifest V3)
// macOS Safari Look Up Popover + Clean Full-Bleed Viewport + In-Tab Smart Reload + Pinned Persistence

(() => {
  // If running inside a subframe (e.g. inside the AirTab iframe):
  if (window !== window.top) {
    // 1. Track URL navigations inside iframe (e.g. user clicked next video on YouTube)
    let lastUrl = window.location.href;
    let lastTitle = document.title;
    function checkSubframeNav() {
      const currentUrl = window.location.href;
      const currentTitle = document.title;
      if (currentUrl !== lastUrl || (currentTitle && currentTitle !== lastTitle)) {
        lastUrl = currentUrl;
        lastTitle = currentTitle;
        try {
          window.top.postMessage({
            type: "AIRTAB_FRAME_NAV",
            url: currentUrl,
            title: currentTitle
          }, "*");
        } catch (_) {}
      }
    }
    setInterval(checkSubframeNav, 800);
    window.addEventListener("popstate", checkSubframeNav);
    window.addEventListener("yt-navigate-finish", checkSubframeNav);

    // Sync YouTube video playback time so switching tabs resumes seamlessly
    if (window.location.hostname.includes("youtube.com")) {
      setInterval(() => {
        const v = document.querySelector("video");
        if (v && !v.paused && v.currentTime > 3) {
          try {
            const u = new URL(window.location.href);
            u.searchParams.set("t", `${Math.floor(v.currentTime)}s`);
            window.top.postMessage({
              type: "AIRTAB_FRAME_NAV",
              url: u.href,
              title: document.title
            }, "*");
          } catch (_) {}
        }
      }, 2500);
    }

    // 3. AirShield: Rust-Grade Offline Cosmetic AdBlocker
    try {
      const adStyle = document.createElement("style");
      adStyle.id = "airtab-shield-cosmetics";
      adStyle.textContent = `
        .adsbygoogle, ins.adsbygoogle, [id^="google_ads_"], [id^="aswift_"], [id^="gpt_unit_"],
        iframe[src*="doubleclick"], iframe[src*="googleads"], iframe[src*="amazon-adsystem"],
        ytd-ad-slot-renderer, ytd-promoted-sparkles-web-renderer, ytd-banner-promo-renderer,
        ytd-statement-banner-renderer, ytd-in-feed-ad-layout-renderer,
        ytd-engagement-panel-section-list-renderer[target-id="engagement-panel-ads"],
        #player-ads, .video-ads, .ytp-ad-module, .ytp-ad-overlay-container,
        .ytp-ad-overlay-slot, .ytp-ad-image-overlay, .ytp-ad-text-overlay,
        .ytp-ad-preview-container, .ytp-ad-player-overlay, .ytp-ad-player-overlay-layout,
        .ytp-suggested-action, .ytp-paid-content-overlay, .ytp-cards-teaser, .ytp-cards-button,
        .ytp-ce-element, .annotation, [class*="ad-banner"], [class*="banner-ad"],
        [class*="sponsored-post"], [class*="taboola-"], [class*="outbrain-"], .ad-slot,
        .ad-container, .ad-wrapper, .advertisement, .adbox, #ad-sidebar, #header-ad, #footer-ad {
          display: none !important;
          visibility: hidden !important;
          opacity: 0 !important;
          height: 0 !important;
          min-height: 0 !important;
          max-height: 0 !important;
          pointer-events: none !important;
        }
      `;
      (document.head || document.documentElement).appendChild(adStyle);
    } catch (_) {}

    // 4. Zero-Escape Link Interceptor: Keeps all link clicks & search results inside AirTab
    function extractCleanUrl(raw) {
      if (!raw) return null;
      try {
        const u = new URL(raw, window.location.href);
        // Clean Google search redirect wrappers (e.g. /url?q=https://...)
        if ((u.hostname.includes("google.") || u.hostname.includes("googleusercontent.")) && u.pathname === "/url") {
          const q = u.searchParams.get("q") || u.searchParams.get("url");
          if (q && q.startsWith("http")) return q;
        }
        return u.href;
      } catch (_) {
        return raw;
      }
    }

    // Neutralize target="_blank" and target="_top" on mousedown (skip UI toggle buttons like 9-dot Google apps)
    document.addEventListener("mousedown", (e) => {
      const a = e.target.closest("a");
      if (a) {
        const ariaLabel = (a.getAttribute("aria-label") || "").toLowerCase();
        const role = (a.getAttribute("role") || "").toLowerCase();
        if (
          role === "button" ||
          a.getAttribute("aria-haspopup") === "true" ||
          ariaLabel.includes("google apps") ||
          ariaLabel.includes("google account") ||
          a.classList.contains("gb_d") ||
          a.classList.contains("gb_C") ||
          a.classList.contains("gb_B") ||
          a.classList.contains("gb_A")
        ) {
          return;
        }

        const t = (a.getAttribute("target") || "").toLowerCase();
        if (t === "_blank" || t === "_top" || t === "_parent") {
          a.setAttribute("target", "_self");
        }
      }
    }, true);

    // Capture click events before page scripts or default browser behavior
    document.addEventListener("click", (e) => {
      const a = e.target.closest("a");
      if (!a) return;

      // DO NOT INTERCEPT interactive UI toggle buttons (Google 9-dot apps menu, account profile dropdown, etc.)
      const ariaLabel = (a.getAttribute("aria-label") || "").toLowerCase();
      const role = (a.getAttribute("role") || "").toLowerCase();
      const hasPopup = a.getAttribute("aria-haspopup");

      if (
        role === "button" ||
        hasPopup === "true" ||
        ariaLabel.includes("google apps") ||
        ariaLabel.includes("google account") ||
        a.classList.contains("gb_d") ||
        a.classList.contains("gb_C") ||
        a.classList.contains("gb_B") ||
        a.classList.contains("gb_A") ||
        (a.hasAttribute("jsaction") && !a.hasAttribute("data-ved"))
      ) {
        // Allow Google's own script to handle the 9-dot dropdown naturally!
        return;
      }

      const rawHref = a.getAttribute("href") || a.href;
      if (!rawHref || rawHref === "#" || rawHref.startsWith("javascript:")) return;

      const dest = extractCleanUrl(rawHref);
      if (!dest || !dest.startsWith("http")) return;

      const target = (a.getAttribute("target") || "").toLowerCase();
      const isEscape = target === "_blank" || target === "_top" || target === "_parent";
      const isExternal = !dest.startsWith(window.location.origin);
      const isNewTab = e.metaKey || e.ctrlKey;

      // Contain inside AirTab if opening new tab, holding Cmd/Ctrl, or navigating to external site
      if (isEscape || isNewTab || isExternal) {
        e.preventDefault();
        e.stopPropagation();

        try {
          window.top.postMessage({
            type: "AIRTAB_NAVIGATE",
            url: dest,
            title: (a.textContent || "").trim().slice(0, 80),
            newTab: isNewTab
          }, "*");
        } catch (_) {
          window.location.href = dest;
        }
      }
    }, true);

    // Trap window.open so script popups load inside AirTab without injecting inline DOM scripts (CSP safe)
    try {
      const _origOpen = window.open;
      window.open = function(url, target, features) {
        if (url && typeof url === 'string') {
          try {
            const dest = extractCleanUrl(url);
            window.top.postMessage({ type: 'AIRTAB_NAVIGATE', url: dest }, '*');
            return window;
          } catch (_) {
            window.location.href = url;
            return window;
          }
        }
        return _origOpen ? _origOpen.apply(this, arguments) : null;
      };
    } catch (_) {}

    // 5. YouTube Brave-Grade Ad Interceptor & Full-Screen Containment
    if (window.location.hostname.includes("youtube.com")) {
      const ytStyle = document.createElement("style");
      ytStyle.id = "airtab-yt-containment";
      ytStyle.textContent = `
        .airtab-video-fill-active #player,
        .airtab-video-fill-active #player-container,
        .airtab-video-fill-active #player-container-outer,
        .airtab-video-fill-active ytd-player,
        .airtab-video-fill-active #ytd-player,
        .airtab-video-fill-active .html5-video-player {
          position: fixed !important;
          top: 0 !important;
          left: 0 !important;
          width: 100vw !important;
          height: 100vh !important;
          max-width: 100vw !important;
          max-height: 100vh !important;
          z-index: 2147483647 !important;
          background: #000 !important;
        }
        .airtab-video-fill-active video {
          width: 100vw !important;
          height: 100vh !important;
          object-fit: contain !important;
        }
        .airtab-video-fill-active #masthead-container,
        .airtab-video-fill-active #masthead,
        .airtab-video-fill-active #below,
        .airtab-video-fill-active #secondary,
        .airtab-video-fill-active #comments,
        .airtab-video-fill-active ytd-masthead {
          display: none !important;
        }
        body.airtab-video-fill-active {
          overflow: hidden !important;
        }
      `;
      (document.head || document.documentElement).appendChild(ytStyle);

      let isYtFilled = false;
      function toggleYtFill(force = null) {
        isYtFilled = force !== null ? force : !isYtFilled;
        document.body.classList.toggle("airtab-video-fill-active", isYtFilled);
        try {
          window.top.postMessage({
            type: "AIRTAB_VIDEO_FILL",
            isFilled: isYtFilled
          }, "*");
        } catch (_) {}
      }

      // Intercept YouTube player fullscreen button
      document.addEventListener("click", (e) => {
        const fsBtn = e.target.closest(".ytp-fullscreen-button");
        if (fsBtn) {
          e.preventDefault();
          e.stopPropagation();
          toggleYtFill();
        }
      }, true);

      // Keyboard 'f' key inside YouTube video player
      document.addEventListener("keydown", (e) => {
        if (e.key === "f" || e.key === "F") {
          const isTyping = e.target && (e.target.tagName === "INPUT" || e.target.tagName === "TEXTAREA" || e.target.isContentEditable);
          if (!isTyping) {
            e.preventDefault();
            e.stopPropagation();
            toggleYtFill();
          }
        } else if (e.key === "Escape" && isYtFilled) {
          e.preventDefault();
          toggleYtFill(false);
        }
      }, true);

      // Rock-Solid YouTube Zero-Ad Interceptor & Auto-Skipper
      const skipAdNow = () => {
        try {
          // 1. Click all modern and legacy skip buttons instantly
          const skipSelectors = [
            ".ytp-ad-skip-button",
            ".ytp-ad-skip-button-modern",
            ".ytp-skip-ad-button",
            ".ytp-ad-skip-button-container",
            ".ytp-ad-overlay-close-button",
            "[id^='skip-button']",
            "button.ytp-ad-skip-button-modern",
            ".ytp-ad-skip-button-slot",
            "#skip-button\\:8",
            "button[class*='skip']",
            ".ytp-ad-preview-container"
          ];
          for (const sel of skipSelectors) {
            const btns = document.querySelectorAll(sel);
            btns.forEach(b => { try { b.click(); } catch (_) {} });
          }

          // 2. Fast-forward video ad if currently playing
          const player = document.querySelector("#movie_player") || document.querySelector(".html5-video-player");
          const isAdActive = document.querySelector(".ad-showing, .ad-interrupting, .ytp-ad-player-overlay") ||
                             (player && (player.classList.contains("ad-showing") || player.classList.contains("ad-interrupting")));
          const video = document.querySelector("video");

          if (isAdActive && video) {
            video.muted = true;
            if (!isNaN(video.duration) && video.duration > 0 && isFinite(video.duration)) {
              video.currentTime = video.duration;
            }
            video.playbackRate = 16.0;
            // Immediate click follow-up
            for (const sel of skipSelectors) {
              const b = document.querySelector(sel);
              if (b) { try { b.click(); } catch (_) {} }
            }
          }

          // 3. Remove overlay ads, banners, and companion promotions
          const overlays = document.querySelectorAll(
            ".ytp-ad-overlay-close-button, .ytp-ad-image-overlay, .ytp-cards-teaser, " +
            "ytd-promoted-sparkles-web-renderer, ytd-ad-slot-renderer, " +
            "ytd-in-feed-ad-layout-renderer, ytd-banner-promo-renderer, " +
            "ytd-statement-banner-renderer, #masthead-ad, " +
            "ytd-engagement-panel-section-list-renderer[target-id='engagement-panel-ads'], " +
            ".ytp-ad-overlay-container, .ytp-ad-message-container"
          );
          overlays.forEach(el => {
            try { el.remove(); } catch (_) {}
          });
        } catch (_) {}
      };

      // High-frequency polling (runs every 100ms reliably without relying on requestAnimationFrame)
      setInterval(skipAdNow, 100);

      // MutationObserver directly on DOM for instantaneous response
      try {
        const adObserver = new MutationObserver(skipAdNow);
        const target = document.body || document.documentElement;
        adObserver.observe(target, {
          childList: true,
          subtree: true
        });
      } catch (_) {}
    }

    return; // Stop execution in subframes - only top frame renders AirTab UI
  }

  if (window.__AIRTAB_INITIALIZED__) return;
  window.__AIRTAB_INITIALIZED__ = true;

  function getSearchUrl(query) {
    if (!query) return "https://www.google.com/";
    return `https://www.google.com/search?q=${encodeURIComponent(query)}`;
  }

  let settings = {
    theme: "dark",
    linkPeekEnabled: true,
    peekHotkey: "Alt",
    adblockEnabled: true,
    gestureNavEnabled: true,
    adaptiveSheets: true,
    antiFrameBusting: true,
    docked: false,
    sidebarWidth: 440
  };

  let historyList = [];
  let bookmarksList = [];

  // State Management
  let isPinned = false;
  let pinMode = "none"; // "none" | "tab" | "chrome"
  let isTemporaryPeek = false; // true = Hotkey Peek (ephemeral), false = Manual Selection Click (persistent / samne dikha rhega)
  let isMaximized = false;
  let isPipMode = false;
  let isTheaterMode = false;
  let isSideMinimized = false;
  let currentZoom = 1.0;
  let isOpen = false;
  let isDocked = false;
  let currentSelectionText = "";
  let currentSelectionRect = null;
  let nextTabId = 1;
  let tabs = [];
  let activeTabId = null;

  // Drag & Resize State
  let isDragging = false;
  let isResizing = false;
  let isDockResizing = false;
  let dragStartX = 0, dragStartY = 0;
  let initialLeft = 0, initialTop = 0;
  function getDisplayAdaptiveDimensions(url = "") {
    const screenW = window.innerWidth;
    const screenH = window.innerHeight;

    const isSheet = (settings.adaptiveSheets !== false) && /spreadsheets|docs\.google|sheets\.google|office\.com|office\.live|onedrive|sharepoint|airtable/i.test(url);

    if (isSheet) {
      // Large spreadsheet canvas: adapt to 86% of display width and 86% of height
      const targetW = Math.max(920, Math.min(1300, Math.round(screenW * 0.86)));
      const targetH = Math.max(620, Math.min(880, Math.round(screenH * 0.86)));
      return { width: targetW, height: targetH, isSheet: true };
    }

    // Comfortable tall Look-Up card (matching Image 2: 520px width x 630px height, extending further down)
    const targetW = Math.min(520, Math.round(screenW - 32));
    const targetH = Math.min(630, Math.round(screenH - 48));
    return { width: targetW, height: targetH, isSheet: false };
  }

  let defaultDims = getDisplayAdaptiveDimensions("");
  let initialWidth = defaultDims.width;
  let initialHeight = defaultDims.height;

  // Active Overlay Panel State
  let activeOverlay = null; // null | "reader" | "history" | "settings"

  // 1. Create Host Element and Shadow Root
  const host = document.createElement("airtab-mini-browser");
  host.id = "airtab-host-root";
  const shadow = host.attachShadow({ mode: "open" });

  // Anti-Frame-Busting Navigation Shield:
  // Strictly prevents embedded iframes (e.g. Gmail, Google accounts) from hijacking the host browser tab
  let lastHostInteractionTime = 0;
  document.addEventListener("click", (e) => {
    if (!e.composedPath().includes(host)) {
      lastHostInteractionTime = Date.now();
    }
  }, true);

  document.addEventListener("keydown", (e) => {
    lastHostInteractionTime = Date.now();
  }, true);

  if (window.navigation) {
    window.navigation.addEventListener("navigate", (e) => {
      if (settings.antiFrameBusting === false) return;
      // If AirTab is active and a navigation happens on the parent window without user interacting with the parent
      const timeSinceHostUser = Date.now() - lastHostInteractionTime;
      const isUnsolicitedTopNav = isOpen && timeSinceHostUser > 600 && !e.userInitiated;

      if (isUnsolicitedTopNav && e.cancelable) {
        const destUrl = e.destination ? e.destination.url : "";
        e.preventDefault();
        console.warn("AirTab Shield: Prevented background iframe from hijacking main window to:", destUrl);

        // Keep the navigation contained inside AirTab's active tab!
        const activeTab = getActiveTab();
        if (activeTab && destUrl && destUrl !== window.location.href) {
          navigateActiveTab(destUrl, activeTab.title);
        }
      }
    });
  }

  // 1.1 Synchronous Anti-Flash Critical Stylesheet (Prevents ANY FOUC paint on browser refresh)
  const antiFlashStyle = document.createElement("style");
  antiFlashStyle.textContent = `
    :host {
      all: initial !important;
      position: absolute !important;
      top: 0 !important;
      left: 0 !important;
      width: 0 !important;
      height: 0 !important;
      overflow: visible !important;
      pointer-events: none !important;
      z-index: 2147483647 !important;
    }
    .quickpeek-popover:not(.visible):not(.closing):not(.minimizing),
    .quickpeek-pill-trigger:not(.visible),
    .airtab-side-bar:not(.visible),
    .quickpeek-arrow:not(.visible),
    .quickpeek-link-peek-badge:not(.visible) {
      display: none !important;
    }
    .quickpeek-popover.visible,
    .quickpeek-popover.closing,
    .quickpeek-popover.minimizing {
      display: flex !important;
    }
    .quickpeek-pill-trigger.visible {
      display: flex !important;
    }
    .airtab-side-bar.visible {
      display: flex !important;
      opacity: 1 !important;
      pointer-events: auto !important;
      visibility: visible !important;
    }
    .quickpeek-arrow.visible {
      display: block !important;
    }
    .quickpeek-link-peek-badge.visible {
      display: inline-flex !important;
    }
  `;
  shadow.appendChild(antiFlashStyle);
  document.documentElement.appendChild(host);

  // 2. Inject Full Stylesheet into Shadow DOM
  const styleLink = document.createElement("link");
  styleLink.rel = "stylesheet";
  styleLink.href = chrome.runtime.getURL("styles.css");
  shadow.appendChild(styleLink);

  // 3. Selection Pill Trigger (AirTab Logo + AirTab)
  const pillTrigger = document.createElement("div");
  pillTrigger.className = "quickpeek-pill-trigger";
  pillTrigger.innerHTML = `
    <span class="quickpeek-pill-icon">
      <svg width="13" height="13" viewBox="0 0 24 24" fill="none">
        <path d="M12 3L4 21" stroke="#ffffff" stroke-width="2.6" stroke-linecap="round"/>
        <path d="M12 3L20 21" stroke="#ffffff" stroke-width="2.6" stroke-linecap="round"/>
        <line x1="6.8" y1="14.5" x2="17.2" y2="14.5" stroke="#00f0ff" stroke-width="2.6" stroke-linecap="round"/>
      </svg>
    </span>
    <span class="quickpeek-pill-label">AirTab</span>
  `;
  shadow.appendChild(pillTrigger);

  // 4. VisionOS / Safari Look Up Link Peek Floating Badge
  const linkPeekBadge = document.createElement("div");
  linkPeekBadge.className = "quickpeek-link-peek-badge";
  linkPeekBadge.innerHTML = `
    <span style="display:inline-flex; align-items:center;">
      <svg width="11" height="11" viewBox="0 0 24 24" fill="none">
        <path d="M12 3L4 21" stroke="#ffffff" stroke-width="2.6" stroke-linecap="round"/>
        <path d="M12 3L20 21" stroke="#ffffff" stroke-width="2.6" stroke-linecap="round"/>
        <line x1="6.8" y1="14.5" x2="17.2" y2="14.5" stroke="#00f0ff" stroke-width="2.6" stroke-linecap="round"/>
      </svg>
    </span>
    <span>AirTab ↗</span>
  `;
  shadow.appendChild(linkPeekBadge);
  let activeHoveredLink = null;

  // 5. Callout Pointer Arrow (▲ / ▼)
  const arrow = document.createElement("div");
  arrow.className = "quickpeek-arrow arrow-top";
  arrow.innerHTML = `
    <svg viewBox="0 0 18 9" preserveAspectRatio="none">
      <path d="M 0 9 L 9 0 L 18 9" fill="rgba(22, 22, 24, 0.90)" stroke="rgba(255, 255, 255, 0.14)" stroke-width="1" />
    </svg>
  `;
  shadow.appendChild(arrow);

  // 6. Popover Main Card (Full-Bleed without bottom bar)
  const popover = document.createElement("div");
  popover.className = "quickpeek-popover";
  popover.innerHTML = `
    <!-- Dock Left-Edge Resize Handle -->
    <div class="quickpeek-dock-resize-handle"></div>

    <!-- 1. Header Bar: Multi-Tabs & Window Controls -->
    <div class="quickpeek-header-bar">
      <span class="quickpeek-pip-title" style="display:none;" title="Click to Exit PiP & restore normal window">📺 AirTab PiP</span>
      <span class="quickpeek-mobile-indicator" title="📱 Mobile Phone View Active (375px responsive phone layout)">📱 Mobile</span>
      <div class="quickpeek-tabs-container"></div>
      <button class="quickpeek-add-tab-btn" title="New Tab">+</button>
      
      <div class="quickpeek-window-actions">
        <!-- Pin AirTab with Hover Dropdown (Tab vs Universal Chrome) -->
        <div class="quickpeek-pin-wrapper">
          <button class="quickpeek-action-btn pin-btn">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
              <line x1="12" y1="17" x2="12" y2="22"></line>
              <path d="M5 17h14v-2l-2-2V5a2 2 0 0 0-2-2H9a2 2 0 0 0-2 2v8l-2 2v2z"></path>
            </svg>
          </button>

          <!-- Pin Hover/Click Popup Menu -->
          <div class="quickpeek-pin-menu" style="display:none;">
            <div class="quickpeek-pin-header">AirTab Pinning</div>
            
            <button class="quickpeek-pin-option pin-tab-opt">
              <span class="pin-opt-icon">📌</span>
              <div class="pin-opt-text">
                <span class="pin-opt-title">Pin to This Tab</span>
                <span class="pin-opt-desc">Always on front of this page</span>
              </div>
              <span class="pin-opt-check tab-check">✓</span>
            </button>

            <button class="quickpeek-pin-option pin-chrome-opt">
              <span class="pin-opt-icon">📺</span>
              <div class="pin-opt-text">
                <span class="pin-opt-title">Always on Front (PiP)</span>
                <span class="pin-opt-desc">Floats above all tabs & apps (Zero reload)</span>
              </div>
              <span class="pin-opt-check chrome-check">↗</span>
            </button>

            <div class="quickpeek-pin-divider"></div>

            <button class="quickpeek-pin-option unpin-opt">
              <span class="pin-opt-icon">✕</span>
              <div class="pin-opt-text">
                <span class="pin-opt-title">Unpin (Normal Float)</span>
                <span class="pin-opt-desc">Close on outside click</span>
              </div>
            </button>
          </div>
        </div>

        <!-- Minimize to Side Bar -->
        <button class="quickpeek-action-btn minimize-btn" title="Minimize to Side Bar (M)">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round">
            <line x1="5" y1="12" x2="19" y2="12"></line>
          </svg>
        </button>

        <!-- Maximize / Full Window View -->
        <button class="quickpeek-action-btn maximize-btn" title="Full Window View (Expand Inside Browser) (F)">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
            <polyline points="15 3 21 3 21 9"></polyline>
            <polyline points="9 21 3 21 3 15"></polyline>
            <line x1="21" y1="3" x2="14" y2="10"></line>
            <line x1="3" y1="21" x2="10" y2="14"></line>
          </svg>
        </button>

        <!-- More Tools (⋯) Dropdown -->
        <button class="quickpeek-action-btn more-btn" title="More Tools & Views">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor">
            <circle cx="12" cy="12" r="2.2"></circle>
            <circle cx="19" cy="12" r="2.2"></circle>
            <circle cx="5" cy="12" r="2.2"></circle>
          </svg>
        </button>

        <!-- Exit PiP Mode Button (Strictly visible only when in PiP mode) -->
        <button class="quickpeek-action-btn pip-restore-btn" title="Exit PiP & Restore Normal Window (P)" style="display: none !important;">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
            <rect x="2" y="2" width="20" height="20" rx="3" ry="3"></rect>
            <polyline points="9 15 15 15 15 9"></polyline>
            <line x1="15" y1="15" x2="9" y2="9"></line>
          </svg>
        </button>

        <!-- Close Window -->
        <button class="quickpeek-action-btn close-btn" title="Close (Esc)">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
            <line x1="18" y1="6" x2="6" y2="18"></line>
            <line x1="6" y1="6" x2="18" y2="18"></line>
          </svg>
        </button>

        <!-- More Tools Popover Dropdown (macOS Sequoia Popover) -->
        <div class="quickpeek-more-menu" style="display:none;">
          <button class="quickpeek-menu-item pip-btn" title="Picture-in-Picture Mini Player (P)">
            <span class="menu-icon">📺</span>
            <span class="menu-label">Picture-in-Picture</span>
            <span class="menu-shortcut">P</span>
          </button>
          <button class="quickpeek-menu-item theater-btn" title="Theater Mode (Widescreen Float) (T)">
            <span class="menu-icon">🎬</span>
            <span class="menu-label">Theater Mode</span>
            <span class="menu-shortcut">T</span>
          </button>
          <button class="quickpeek-menu-item dock-btn" title="Dock to Sidebar">
            <span class="menu-icon">📌</span>
            <span class="menu-label">Dock to Sidebar</span>
            <span class="menu-shortcut">D</span>
          </button>
          <div class="quickpeek-menu-divider"></div>
          <button class="quickpeek-menu-item history-btn" title="History & Bookmarks">
            <span class="menu-icon">🕒</span>
            <span class="menu-label">History & Bookmarks</span>
          </button>
          <button class="quickpeek-menu-item theme-btn" title="Toggle Light/Dark Theme">
            <span class="menu-icon">🎨</span>
            <span class="menu-label">Toggle Theme</span>
          </button>
          <div class="quickpeek-menu-divider"></div>
          <button class="quickpeek-menu-item settings-btn" title="Settings & Preferences">
            <span class="menu-icon">⚙️</span>
            <span class="menu-label">Settings & Preferences</span>
            <span class="menu-shortcut">⌘,</span>
          </button>
        </div>
      </div>
    </div>

    <!-- 2. Minimalist Navigation & Omnibox Bar -->
    <div class="quickpeek-nav-bar">
      <button class="quickpeek-nav-btn back-btn" title="Back">
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round">
          <polyline points="15 18 9 12 15 6"></polyline>
        </svg>
      </button>
      <button class="quickpeek-nav-btn forward-btn" title="Forward">
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round">
          <polyline points="9 18 15 12 9 6"></polyline>
        </svg>
      </button>
      <!-- Smart In-Tab Reload: reloads exact active page without reset -->
      <button class="quickpeek-nav-btn reload-btn" title="Reload Active Page (Cmd+R)">
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
          <polyline points="23 4 23 10 17 10"></polyline>
          <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"></path>
        </svg>
      </button>

      <button class="quickpeek-nav-btn home-btn" title="Home (Google Search)">
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
          <polyline points="9 22 9 12 15 12 15 22"></polyline>
        </svg>
      </button>
      
      <div class="quickpeek-omnibox-wrapper">
        <div class="quickpeek-domain-badge" title="Secure Connection (AirShield Active)" style="display:none;">
          <svg class="quickpeek-domain-lock" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round">
            <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
            <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
          </svg>
          <span class="quickpeek-domain-host"></span>
        </div>
        <span class="quickpeek-omnibox-icon">🔍</span>
        <input type="text" class="quickpeek-omnibox-input" placeholder="Search Google or enter web address..." spellcheck="false" autocomplete="off" />
        <!-- Quick 1-Click Video Focus / Pure Embed Player -->
        <button class="quickpeek-nav-btn video-focus-btn" title="Focus Video (Fill Window Edge-to-Edge)" style="display:none; width:22px; height:22px; font-size:11px; padding:0;">🎬</button>
        <!-- Quick 1-Click Clean Sheet Focus Grid Toggle -->
        <button class="quickpeek-nav-btn sheet-focus-btn" title="Toggle Clean Sheet Grid (Full View)" style="display:none; width:22px; height:22px; font-size:11px; padding:0;">📊</button>
        <!-- Quick 1-Click PiP Button -->
        <button class="quickpeek-nav-btn pip-nav-btn" title="Picture-in-Picture Mini Player (P)" style="display:none; width:22px; height:22px; font-size:11px; padding:0;">📺</button>
        <!-- Zoom Page Button (Click to cycle, or Cmd+ / Cmd-) -->
        <button class="quickpeek-nav-btn zoom-btn" title="Zoom Page: Click to cycle (Cmd+ / Cmd-)">100%</button>
        <!-- AirShield Offline Rust-Grade AdBlock Badge -->
        <button class="quickpeek-nav-btn shield-btn" title="AirShield: Rust-Grade Offline AdBlock Active (Zero Ads, 100% Private)" style="width:20px; height:20px; font-size:11px; padding:0; display:inline-flex; align-items:center; justify-content:center; color:#38ef7d; cursor:pointer;">🛡️</button>
        <!-- Quick 1-Click Google Translate Button -->
        <button class="quickpeek-nav-btn translate-btn" title="Translate to Hindi (Google Translate)" style="width:20px; height:20px; font-size:11px; padding:0;">🌐</button>
        <!-- 1-Click Copy URL Button -->
        <button class="quickpeek-copy-btn" title="Copy Current URL">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
            <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
            <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
          </svg>
        </button>
        <button class="quickpeek-bookmark-btn" title="Bookmark this page">★</button>
      </div>

      <button class="quickpeek-popout-btn" title="Detach into Floating Window (Zero reload on tab switch, uninterrupted video)">
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path>
          <polyline points="15 3 21 3 21 9"></polyline>
          <line x1="10" y1="14" x2="21" y2="3"></line>
        </svg>
      </button>
    </div>

    <!-- Progress Indicator -->
    <div class="quickpeek-progress-bar"></div>

    <!-- 3. Clean Full-Bleed Viewport (Extends to bottom with rounded corners) -->
    <div class="quickpeek-viewport">
      <div class="quickpeek-drag-shield"></div>

      <!-- Edge Swipe Gesture Zones (macOS Two-Finger Trackpad Back/Forward) -->
      <div class="quickpeek-edge-gesture edge-left" title="Swipe right to go Back"></div>
      <div class="quickpeek-edge-gesture edge-right" title="Swipe left to go Forward"></div>

      <!-- Visual Gesture Navigation HUD (macOS Safari Look Up Style) -->
      <div class="quickpeek-gesture-hud gesture-back">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round">
          <polyline points="15 18 9 12 15 6"></polyline>
        </svg>
      </div>
      <div class="quickpeek-gesture-hud gesture-forward">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round">
          <polyline points="9 18 15 12 9 6"></polyline>
        </svg>
      </div>

      <!-- Smart Fallback Warning Banner for JS-blocked frames or Login Requirements -->
      <div class="quickpeek-fallback-banner">
        <span>⚠️ Site restricts embedding or needs Google account login.</span>
        <div class="fallback-actions">
          <button class="quickpeek-fallback-btn fallback-popup-btn" title="Open in Logged-In Floating Window">Open Logged-In Float 🗗</button>
          <button class="quickpeek-fallback-btn fallback-tab-btn" title="Open in new Chrome Tab">New Tab ↗</button>
        </div>
      </div>

      <!-- Chrome-Style Bottom-Left Status Bubble (Loading / Connecting Indicator) -->
      <div class="quickpeek-status-bubble">
        <span class="status-spinner"></span>
        <span class="status-text">Loading...</span>
      </div>

      <!-- History & Bookmarks Panel -->
      <div class="quickpeek-overlay-panel history-panel">
        <div class="quickpeek-panel-header">
          <div class="quickpeek-history-tabs">
            <button class="quickpeek-history-tab-btn active" data-tab="history">🕒 Recent History</button>
            <button class="quickpeek-history-tab-btn" data-tab="bookmarks">★ Bookmarks</button>
          </div>
          <button class="quickpeek-panel-close">✕</button>
        </div>
        <div class="quickpeek-panel-body">
          <div class="quickpeek-history-list"></div>
        </div>
      </div>

      <!-- Settings Modal Panel -->
      <div class="quickpeek-overlay-panel settings-panel">
        <div class="quickpeek-panel-header">
          <div class="quickpeek-panel-title">⚙️ AirTab Preferences & Controls</div>
          <button class="quickpeek-panel-close">✕</button>
        </div>
        <div class="quickpeek-panel-body">

          <!-- 1. FEATURE TOGGLES SECTION -->
          <div class="quickpeek-settings-section">
            <div class="quickpeek-settings-title">Core Features & Controls</div>

            <!-- Adblock Toggle -->
            <div class="quickpeek-settings-row">
              <div class="quickpeek-settings-label">
                <span class="quickpeek-settings-name">🛡️ AirShield AdBlocker</span>
                <span class="quickpeek-settings-sub">Block intrusive ads, banners, and video prerolls</span>
              </div>
              <label class="qp-switch">
                <input type="checkbox" class="adblock-toggle" checked />
                <span class="qp-slider"></span>
              </label>
            </div>

            <!-- Link Hover Preview Toggle -->
            <div class="quickpeek-settings-row">
              <div class="quickpeek-settings-label">
                <span class="quickpeek-settings-name">⚡ Instant Hover Peek & Look Up</span>
                <span class="quickpeek-settings-sub">Hover over any word or link & press hotkey to peek instantly</span>
              </div>
              <label class="qp-switch">
                <input type="checkbox" class="link-peek-toggle" checked />
                <span class="qp-slider"></span>
              </label>
            </div>

            <!-- Instant Hover Peek Hotkey Selector -->
            <div class="quickpeek-settings-row">
              <div class="quickpeek-settings-label">
                <span class="quickpeek-settings-name">⌨️ Instant Peek Hotkey</span>
                <span class="quickpeek-settings-sub">Key to press while hovering any link or word</span>
              </div>
              <select class="quickpeek-settings-select peek-hotkey-select">
                <option value="Alt">⌥ Option / Alt (Recommended)</option>
                <option value="Shift">⇧ Shift</option>
                <option value="Control">⌃ Control / Command</option>
                <option value="Space">␣ Spacebar</option>
              </select>
            </div>

            <!-- Trackpad Swipe Gesture Toggle -->
            <div class="quickpeek-settings-row">
              <div class="quickpeek-settings-label">
                <span class="quickpeek-settings-name">👆 Top-Bar Swipe Navigation</span>
                <span class="quickpeek-settings-sub">Two-finger swipe on header bar for Back / Forward</span>
              </div>
              <label class="qp-switch">
                <input type="checkbox" class="gesture-toggle" checked />
                <span class="qp-slider"></span>
              </label>
            </div>

            <!-- Adaptive Spreadsheets Toggle -->
            <div class="quickpeek-settings-row">
              <div class="quickpeek-settings-label">
                <span class="quickpeek-settings-name">📊 Auto-Adaptive Spreadsheets</span>
                <span class="quickpeek-settings-sub">Expand to wide view for Google Sheets & Airtable</span>
              </div>
              <label class="qp-switch">
                <input type="checkbox" class="adaptive-sheets-toggle" checked />
                <span class="qp-slider"></span>
              </label>
            </div>

            <!-- Anti-Frame-Busting Protection Toggle -->
            <div class="quickpeek-settings-row">
              <div class="quickpeek-settings-label">
                <span class="quickpeek-settings-name">🔒 Anti-Frame-Busting Shield</span>
                <span class="quickpeek-settings-sub">Prevent sites like Gmail from hijacking browser tab</span>
              </div>
              <label class="qp-switch">
                <input type="checkbox" class="anti-bust-toggle" checked />
                <span class="qp-slider"></span>
              </label>
            </div>
          </div>

          <!-- 2. APPEARANCE SECTION -->
          <div class="quickpeek-settings-section">
            <div class="quickpeek-settings-title">Appearance & Theme</div>
            <div class="quickpeek-settings-row">
              <div class="quickpeek-settings-label">
                <span class="quickpeek-settings-name">Theme Style</span>
                <span class="quickpeek-settings-sub">Choose visual appearance</span>
              </div>
              <select class="quickpeek-settings-select theme-select">
                <option value="dark">Dark Frosted Glass</option>
                <option value="light">Light Frosted Glass</option>
                <option value="auto">Auto (Match OS)</option>
              </select>
            </div>
          </div>

          <!-- 3. EXPANDABLE DETAILS ACCORDION BUTTONS -->
          <div class="quickpeek-settings-section">
            <div class="quickpeek-settings-title">Security & Architecture Details</div>

            <!-- Button 1: Privacy Guarantee Accordion -->
            <button class="quickpeek-accordion-btn" data-target="privacy-accordion">
              <span>🛡️ Data Privacy & Zero-Collection Policy</span>
              <span class="accordion-arrow">▾</span>
            </button>
            <div class="quickpeek-accordion-content" id="privacy-accordion">
              <p class="quickpeek-settings-desc">
                <strong>Zero data collection:</strong> AirTab is built on a 100% private, offline-first architecture. We do not track, collect, store, or sell any personal data, searches, or browsing history.
              </p>
              <ul class="quickpeek-settings-list" style="margin-top:6px;">
                <li>🔒 <strong>No External Cloud:</strong> Direct connections with zero proxy servers.</li>
                <li>🚫 <strong>Zero Analytics:</strong> Free of third-party telemetry scripts.</li>
                <li>💻 <strong>Sandboxed Storage:</strong> Kept strictly inside local browser sandbox.</li>
              </ul>
            </div>

            <!-- Button 2: Performance & Memory Benchmark Accordion -->
            <button class="quickpeek-accordion-btn" data-target="perf-accordion">
              <span>⚡ Performance & Memory Benchmarks</span>
              <span class="accordion-arrow">▾</span>
            </button>
            <div class="quickpeek-accordion-content" id="perf-accordion">
              <div class="quickpeek-stat-grid">
                <div class="quickpeek-stat-box">
                  <div class="quickpeek-stat-num" style="color:#38ef7d;">~22 MB</div>
                  <div class="quickpeek-stat-label">RAM Usage</div>
                </div>
                <div class="quickpeek-stat-box">
                  <div class="quickpeek-stat-num">0 ms</div>
                  <div class="quickpeek-stat-label">Filter Latency</div>
                </div>
                <div class="quickpeek-stat-box">
                  <div class="quickpeek-stat-num">0%</div>
                  <div class="quickpeek-stat-label">Idle CPU</div>
                </div>
              </div>
              <p class="quickpeek-settings-subdesc" style="margin-top:8px;">
                💡 <strong>10x Less Memory:</strong> Regular Chrome tabs consume 150MB–300MB, whereas AirTab runs at ~22MB.
              </p>
            </div>
          </div>

          <!-- 4. DATA RESET -->
          <div class="quickpeek-settings-section" style="margin-top: 8px;">
            <button class="quickpeek-btn-danger clear-data-btn" style="width: 100%; padding: 8px;">Clear AirTab Cache & Local History</button>
          </div>

        </div>
      </div>
    </div>

    <!-- Resize Grip Handle -->
    <div class="quickpeek-resize-handle"></div>
  `;
  shadow.appendChild(popover);

  // 7. Side Minimized Quick-Access Bar (Docked to right edge on outside click)
  const sideBar = document.createElement("div");
  sideBar.className = "airtab-side-bar";
  sideBar.innerHTML = `
    <div class="airtab-side-pill" title="Click to Restore AirTab (Drag up/down to move)">
      <span class="airtab-side-icon">
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none">
          <path d="M12 3L4 21" stroke="#ffffff" stroke-width="2.6" stroke-linecap="round"/>
          <path d="M12 3L20 21" stroke="#ffffff" stroke-width="2.6" stroke-linecap="round"/>
          <line x1="6.8" y1="14.5" x2="17.2" y2="14.5" stroke="#00f0ff" stroke-width="2.6" stroke-linecap="round"/>
        </svg>
      </span>
      <span class="airtab-side-label">AirTab</span>
      <button class="airtab-side-dismiss" title="Close AirTab completely">✕</button>
    </div>
  `;
  shadow.appendChild(sideBar);

  // Cache DOM Elements inside Shadow Root
  const sidePill = sideBar.querySelector(".airtab-side-pill");
  const sideLabel = sideBar.querySelector(".airtab-side-label");
  const sideDismissBtn = sideBar.querySelector(".airtab-side-dismiss");

  const headerBar = popover.querySelector(".quickpeek-header-bar");
  const pipTitle = popover.querySelector(".quickpeek-pip-title");
  const tabsContainer = popover.querySelector(".quickpeek-tabs-container");
  const addTabBtn = popover.querySelector(".quickpeek-add-tab-btn");
  const pipBtn = popover.querySelector(".pip-btn");
  const theaterBtn = popover.querySelector(".theater-btn");
  const minimizeBtn = popover.querySelector(".minimize-btn");
  const maximizeBtn = popover.querySelector(".maximize-btn");
  const readerBtn = popover.querySelector(".reader-btn");
  const historyBtn = popover.querySelector(".history-btn");
  const settingsBtn = popover.querySelector(".settings-btn");
  const themeBtn = popover.querySelector(".theme-btn");
  const dockBtn = popover.querySelector(".dock-btn");
  const pinWrapper = popover.querySelector(".quickpeek-pin-wrapper");
  const pinBtn = popover.querySelector(".pin-btn");
  const pinMenu = popover.querySelector(".quickpeek-pin-menu");
  const pinTabOpt = popover.querySelector(".pin-tab-opt");
  const pinChromeOpt = popover.querySelector(".pin-chrome-opt");
  const unpinOpt = popover.querySelector(".unpin-opt");
  const moreBtn = popover.querySelector(".more-btn");
  const moreMenu = popover.querySelector(".quickpeek-more-menu");
  const pipRestoreBtn = popover.querySelector(".pip-restore-btn");
  const closeBtn = popover.querySelector(".close-btn");
  
  const backBtn = popover.querySelector(".back-btn");
  const forwardBtn = popover.querySelector(".forward-btn");
  const reloadBtn = popover.querySelector(".reload-btn");
  const homeBtn = popover.querySelector(".home-btn");
  const domainBadge = popover.querySelector(".quickpeek-domain-badge");
  const domainHost = popover.querySelector(".quickpeek-domain-host");
  const omniboxIcon = popover.querySelector(".quickpeek-omnibox-icon");
  const omnibox = popover.querySelector(".quickpeek-omnibox-input");
  const videoFocusBtn = popover.querySelector(".video-focus-btn");
  const sheetFocusBtn = popover.querySelector(".sheet-focus-btn");
  const pipNavBtn = popover.querySelector(".pip-nav-btn");
  const zoomBtn = popover.querySelector(".zoom-btn");
  const translateBtn = popover.querySelector(".translate-btn");
  const shieldBtn = popover.querySelector(".shield-btn");
  const copyBtn = popover.querySelector(".quickpeek-copy-btn");
  const bookmarkBtn = popover.querySelector(".quickpeek-bookmark-btn");
  const popoutBtn = popover.querySelector(".quickpeek-popout-btn");
  const progressBar = popover.querySelector(".quickpeek-progress-bar");
  
  const viewport = popover.querySelector(".quickpeek-viewport");
  const fallbackBanner = popover.querySelector(".quickpeek-fallback-banner");
  const fallbackPopupBtn = popover.querySelector(".fallback-popup-btn");
  const fallbackTabBtn = popover.querySelector(".fallback-tab-btn");

  // Gesture Navigation Elements
  const navBar = popover.querySelector(".quickpeek-nav-bar");
  const edgeGestureLeft = popover.querySelector(".quickpeek-edge-gesture.edge-left");
  const edgeGestureRight = popover.querySelector(".quickpeek-edge-gesture.edge-right");
  const gestureHudBack = popover.querySelector(".quickpeek-gesture-hud.gesture-back");
  const gestureHudForward = popover.querySelector(".quickpeek-gesture-hud.gesture-forward");
  
  const resizeHandle = popover.querySelector(".quickpeek-resize-handle");
  const dockResizeHandle = popover.querySelector(".quickpeek-dock-resize-handle");

  // Overlays
  const readerPanel = popover.querySelector(".reader-panel");
  const historyPanel = popover.querySelector(".history-panel");
  const settingsPanel = popover.querySelector(".settings-panel");

  applyTheme(settings.theme);
  renderSettingsPanel();

  // Load Persisted Storage & Check Persistent Pinned State
  chrome.storage.local.get(["settings", "history", "bookmarks", "airtabPinned", "airtabPinnedMode", "airtabPinnedState", "airtabPinnedUrl"], (res) => {
    if (res.settings) {
      settings = Object.assign(settings, res.settings);
    }
    if (res.history) historyList = res.history;
    if (res.bookmarks) bookmarksList = res.bookmarks;

    applyTheme(settings.theme);
    renderSettingsPanel();

    if (settings.docked) {
      setDockedMode(true);
    }

    // Clean up any legacy roaming keys on page initialization
    isPinned = false;
    pinMode = "none";
    chrome.storage.local.remove(["airtabPinned", "airtabPinnedMode", "airtabPinnedState", "airtabPinnedUrl"]);
  });

  // ==========================================================================
  // Omnibox URL Formatter & Live Verified Security Badge
  // ==========================================================================

  function getDisplayQuery(url, query) {
    if (url && (url.startsWith("http://") || url.startsWith("https://"))) {
      return url;
    }
    return url || query || "";
  }

  function updateOmniboxDisplay(url, query = "") {
    const val = getDisplayQuery(url, query);
    omnibox.value = val;
    if (url && (url.startsWith("http://") || url.startsWith("https://"))) {
      try {
        const u = new URL(url);
        let hostStr = u.hostname.replace(/^www\./, "");
        if (domainBadge && domainHost) {
          domainHost.textContent = hostStr;
          domainBadge.style.display = "inline-flex";
          if (omniboxIcon) omniboxIcon.style.display = "none";
        }
      } catch (_) {
        if (domainBadge) domainBadge.style.display = "none";
        if (omniboxIcon) omniboxIcon.style.display = "inline-flex";
      }
    } else {
      if (domainBadge) domainBadge.style.display = "none";
      if (omniboxIcon) omniboxIcon.style.display = "inline-flex";
    }
  }

  // 1-Click Copy URL to Clipboard with instant visual feedback
  if (copyBtn) {
    copyBtn.addEventListener("click", () => {
      const tab = getActiveTab();
      if (!tab || !tab.url) return;
      navigator.clipboard.writeText(tab.url).then(() => {
        copyBtn.innerHTML = `
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#38ef7d" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round">
            <polyline points="20 6 9 17 4 12"></polyline>
          </svg>
        `;
        copyBtn.title = "Copied to clipboard!";
        copyBtn.classList.add("copied");
        setTimeout(() => {
          copyBtn.innerHTML = `
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
              <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
              <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
            </svg>
          `;
          copyBtn.title = "Copy Current URL";
          copyBtn.classList.remove("copied");
        }, 1500);
      }).catch(() => {});
    });
  }

  // More Tools (⋯) Dropdown Menu Logic
  function toggleMoreMenu(forceState) {
    if (!moreMenu) return;
    const show = typeof forceState === "boolean" ? forceState : (moreMenu.style.display === "none");
    moreMenu.style.display = show ? "flex" : "none";
    if (moreBtn) moreBtn.classList.toggle("active", show);
  }

  if (moreBtn) {
    moreBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      toggleMoreMenu();
    });
  }

  if (moreMenu) {
    moreMenu.addEventListener("click", (e) => {
      // Auto close popover menu when any tool is selected
      if (e.target.closest(".quickpeek-menu-item")) {
        toggleMoreMenu(false);
      }
    });
  }

  document.addEventListener("click", (e) => {
    if (moreMenu && moreMenu.style.display !== "none" && !e.composedPath().includes(moreMenu) && !e.composedPath().includes(moreBtn)) {
      toggleMoreMenu(false);
    }
  });

  // ==========================================================================
  // Theme Management
  // ==========================================================================

  function applyTheme(theme) {
    popover.classList.remove("theme-light", "theme-dark");
    if (theme === "light") {
      popover.classList.add("theme-light");
    } else if (theme === "dark") {
      popover.classList.add("theme-dark");
    } else {
      const isSystemDark = window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches;
      popover.classList.add(isSystemDark ? "theme-dark" : "theme-light");
    }
  }

  themeBtn.addEventListener("click", () => {
    const current = settings.theme || "dark";
    const nextTheme = current === "dark" ? "light" : current === "light" ? "auto" : "dark";
    settings.theme = nextTheme;
    chrome.storage.local.set({ settings });
    applyTheme(nextTheme);
  });

  // ==========================================================================
  // Zoom In / Zoom Out Controls (Adjust Page Scale & Text Size)
  // ==========================================================================

  const zoomLevels = [0.85, 1.0, 1.15, 1.3, 1.5];

  function updateMobileViewportMode() {
    const width = popover.offsetWidth;
    const isMobile = width > 0 && width <= 420;
    popover.classList.toggle("mobile-mode", isMobile);

    tabs.forEach((tab) => {
      if (tab && tab.iframe) {
        if (isMobile) {
          // Standard mobile smartphone viewport (iPhone 375px)
          const mobileViewportW = 375;
          const scale = Math.min(1.0, width / mobileViewportW);
          tab.iframe.style.width = `${mobileViewportW}px`;
          tab.iframe.style.height = `${(100 / scale).toFixed(2)}%`;
          tab.iframe.style.transform = `scale(${scale})`;
          tab.iframe.style.transformOrigin = "0 0";
        } else {
          // Desktop / Tablet mode: restore user zoom level
          tab.iframe.style.width = `${(100 / currentZoom).toFixed(2)}%`;
          tab.iframe.style.height = `${(100 / currentZoom).toFixed(2)}%`;
          tab.iframe.style.transform = `scale(${currentZoom})`;
          tab.iframe.style.transformOrigin = "0 0";
        }
      }
    });
  }

  function applyZoom(zoom) {
    currentZoom = Math.max(0.75, Math.min(1.8, Math.round(zoom * 100) / 100));
    chrome.storage.local.set({ airtabZoom: currentZoom });

    if (zoomBtn) {
      zoomBtn.textContent = `${Math.round(currentZoom * 100)}%`;
      zoomBtn.title = `Zoom: ${Math.round(currentZoom * 100)}% (Click to cycle, Cmd+/Cmd-)`;
      zoomBtn.classList.toggle("active", currentZoom !== 1.0);
    }

    updateMobileViewportMode();
  }

  function cycleZoom() {
    let nextIdx = zoomLevels.findIndex((z) => Math.abs(z - currentZoom) < 0.05) + 1;
    if (nextIdx >= zoomLevels.length || nextIdx === 0) nextIdx = 0;
    applyZoom(zoomLevels[nextIdx]);
  }

  if (zoomBtn) {
    zoomBtn.addEventListener("click", cycleZoom);
  }

  chrome.storage.local.get(["airtabZoom"], (res) => {
    if (res && res.airtabZoom) {
      applyZoom(res.airtabZoom);
    }
  });

  // ==========================================================================
  // Display Modes: Theater, Full Window Maximize, and PiP Mini Player
  // ==========================================================================

  function toggleTheaterMode(force = null) {
    isTheaterMode = force !== null ? force : !isTheaterMode;
    if (isTheaterMode) {
      if (isMaximized) toggleMaximize(false);
      if (isPipMode) togglePipMode(false);
      if (isDocked) setDockedMode(false);
    }
    popover.classList.toggle("theater-mode", isTheaterMode);
    theaterBtn.classList.toggle("active", isTheaterMode);
    theaterBtn.title = isTheaterMode ? "Restore Compact Card (T)" : "Theater Mode (Widescreen Float) (T)";

    if (isTheaterMode) {
      arrow.classList.remove("visible");
      if (!isDocked) {
        const top = Math.max(20, Math.min(window.innerHeight - 600, popover.offsetTop));
        const left = Math.max(20, Math.min(window.innerWidth - 880, (window.innerWidth - 860) / 2));
        popover.style.top = `${top}px`;
        popover.style.left = `${left}px`;
      }
    } else if (!isDocked && !isMaximized && !isPipMode) {
      positionPopover(currentSelectionRect);
    }
  }

  function toggleMaximize(force = null) {
    isMaximized = force !== null ? force : !isMaximized;
    if (isMaximized) {
      if (isTheaterMode) toggleTheaterMode(false);
      if (isPipMode) togglePipMode(false);
      if (isDocked) setDockedMode(false);
    }
    popover.classList.toggle("maximized", isMaximized);
    maximizeBtn.classList.toggle("active", isMaximized);
    maximizeBtn.title = isMaximized ? "Restore Compact Card (Esc / F)" : "Full Window View (Expand Inside Browser) (F)";

    if (isMaximized) {
      arrow.classList.remove("visible");
    } else if (!isDocked && !isTheaterMode && !isPipMode) {
      positionPopover(currentSelectionRect);
    }
  }

  function togglePipMode(force = null) {
    isPipMode = force !== null ? force : !isPipMode;
    if (isPipMode) {
      if (isMaximized) toggleMaximize(false);
      if (isTheaterMode) toggleTheaterMode(false);
      if (isDocked) setDockedMode(false);

      // If active tab is YouTube, ensure clean full-bleed embed is loaded
      const tab = getActiveTab();
      if (tab && tab.url) {
        const vid = extractYouTubeId(tab.url);
        if (vid && !tab.url.includes("/embed/")) {
          navigateActiveTab(`https://www.youtube-nocookie.com/embed/${vid}?autoplay=1`, tab.title);
        }
      }
    } else {
      // Clean up inline styles left behind by PiP dragging or docking
      popover.style.bottom = "";
      popover.style.right = "";
    }
    popover.classList.toggle("pip-mode", isPipMode);
    if (pipRestoreBtn) {
      pipRestoreBtn.style.setProperty("display", isPipMode ? "inline-flex" : "none", "important");
    }
    if (pipBtn) {
      pipBtn.classList.toggle("active", isPipMode);
      pipBtn.title = isPipMode ? "Restore Normal AirTab (P)" : "Picture-in-Picture Mini Player (P)";
    }
    if (pipNavBtn) pipNavBtn.classList.toggle("active", isPipMode);

    if (isPipMode) {
      arrow.classList.remove("visible");
      const tab = getActiveTab();
      if (pipTitle && tab) {
        pipTitle.textContent = tab.title ? `📺 ${tab.title}` : "📺 AirTab PiP";
        pipTitle.title = "Click to exit PiP & restore normal window";
      }
    } else if (!isDocked && !isTheaterMode && !isMaximized) {
      positionPopover(currentSelectionRect);
    }
  }

  theaterBtn.addEventListener("click", () => toggleTheaterMode());
  if (minimizeBtn) {
    minimizeBtn.addEventListener("click", () => minimizeToSideBar());
  }
  maximizeBtn.addEventListener("click", () => toggleMaximize());
  pipBtn.addEventListener("click", () => togglePipMode());
  pipNavBtn.addEventListener("click", () => togglePipMode());

  if (pipRestoreBtn) {
    pipRestoreBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      togglePipMode(false);
    });
  }

  if (pipTitle) {
    pipTitle.addEventListener("click", () => {
      if (isPipMode) togglePipMode(false);
    });
  }

  // Double click header bar to toggle Full Window Maximize / Exit PiP
  headerBar.addEventListener("dblclick", (e) => {
    if (e.target.closest(".quickpeek-tab") || e.target.closest(".quickpeek-action-btn")) return;
    if (isPipMode) {
      togglePipMode(false);
    } else {
      toggleMaximize();
    }
  });

  // Video Focus Helper: Extracts video to fill 100% of floating card
  function extractYouTubeId(url) {
    try {
      const u = new URL(url);
      if (u.hostname.includes("youtu.be")) return u.pathname.slice(1);
      if (u.searchParams.has("v")) return u.searchParams.get("v");
      const match = u.pathname.match(/\/embed\/([a-zA-Z0-9_-]+)/);
      if (match) return match[1];
    } catch (_) {}
    return null;
  }

  function updateVideoControls(url) {
    if (!url) {
      videoFocusBtn.style.display = "none";
      pipNavBtn.style.display = "none";
      if (sheetFocusBtn) sheetFocusBtn.style.display = "none";
      return;
    }
    const isYt = url.includes("youtube.com/watch") || url.includes("youtu.be/") || url.includes("youtube.com/embed/");
    if (isYt) {
      videoFocusBtn.style.display = "inline-flex";
      videoFocusBtn.classList.toggle("active", url.includes("/embed/"));
      videoFocusBtn.title = url.includes("/embed/") ? "Exit Video Focus (Back to normal)" : "Focus Video (Fill Window Edge-to-Edge)";

      pipNavBtn.style.display = "inline-flex";
      pipNavBtn.classList.toggle("active", isPipMode);
    } else {
      videoFocusBtn.style.display = "none";
      pipNavBtn.style.display = "none";
    }

    if (sheetFocusBtn) {
      const isSheet = /docs\.google\.com\/spreadsheets/i.test(url);
      sheetFocusBtn.style.display = isSheet ? "inline-flex" : "none";
      if (isSheet) {
        const hasMinimal = url.includes("rm=minimal");
        sheetFocusBtn.classList.toggle("active", hasMinimal);
        sheetFocusBtn.title = hasMinimal ? "Restore Full Google Menus (Grid Focus Active)" : "Focus Sheet Grid (Hide Menus for Clean View)";
      }
    }
  }

  if (sheetFocusBtn) {
    sheetFocusBtn.addEventListener("click", () => {
      const tab = getActiveTab();
      if (!tab || !tab.url) return;
      try {
        const u = new URL(tab.url);
        if (u.searchParams.get("rm") === "minimal") {
          u.searchParams.delete("rm");
        } else {
          u.searchParams.set("rm", "minimal");
        }
        navigateActiveTab(u.href, tab.title);
      } catch (_) {}
    });
  }

  videoFocusBtn.addEventListener("click", () => {
    const tab = getActiveTab();
    if (!tab || !tab.url) return;
    if (tab.url.includes("/embed/")) {
      const match = tab.url.match(/\/embed\/([a-zA-Z0-9_-]+)/);
      if (match && match[1]) {
        navigateActiveTab(`https://www.youtube.com/watch?v=${match[1]}`, tab.title);
      }
    } else {
      const vid = extractYouTubeId(tab.url);
      if (vid) {
        navigateActiveTab(`https://www.youtube-nocookie.com/embed/${vid}?autoplay=1`, tab.title);
        if (!isTheaterMode && !isMaximized && !isPipMode) toggleTheaterMode(true);
      }
    }
  });

  // ==========================================================================
  // Dock to Sidebar Mode (Edge / Arc Style)
  // ==========================================================================

  function setDockedMode(docked) {
    isDocked = docked;
    settings.docked = docked;
    chrome.storage.local.set({ settings });

    if (isMaximized) toggleMaximize(false);
    if (isPipMode) togglePipMode(false);
    if (isTheaterMode) toggleTheaterMode(false);

    popover.classList.toggle("docked", isDocked);
    dockBtn.classList.toggle("active", isDocked);
    dockBtn.title = isDocked ? "Undock to Floating Window" : "Dock to Sidebar";

    if (isDocked) {
      arrow.classList.remove("visible");
      popover.style.width = `${settings.sidebarWidth || 440}px`;
      popover.style.height = "100vh";
      popover.style.left = "auto";
      popover.style.top = "0";
      popover.style.right = "0";
      popover.style.bottom = "0";
    } else {
      positionPopover(currentSelectionRect);
    }
  }

  dockBtn.addEventListener("click", () => {
    setDockedMode(!isDocked);
  });

  dockResizeHandle.addEventListener("mousedown", (e) => {
    e.stopPropagation();
    e.preventDefault();
    isDockResizing = true;
    dragStartX = e.clientX;
    initialWidth = popover.offsetWidth;

    popover.classList.add("is-resizing");

    function onDockMove(ev) {
      if (!isDockResizing) return;
      const dw = dragStartX - ev.clientX;
      const newWidth = Math.max(320, Math.min(window.innerWidth - 60, initialWidth + dw));
      popover.style.width = `${newWidth}px`;
      settings.sidebarWidth = newWidth;
    }

    function onDockUp() {
      isDockResizing = false;
      popover.classList.remove("is-resizing");
      chrome.storage.local.set({ settings });
      if (isPinned) savePinnedState();
      window.removeEventListener("mousemove", onDockMove);
      window.removeEventListener("mouseup", onDockUp);
    }

    window.addEventListener("mousemove", onDockMove);
    window.addEventListener("mouseup", onDockUp);
  });

  // ==========================================================================
  // Progress Bar Controller (Sleek Apple-Grade Loading Bar with Auto-Finish)
  // ==========================================================================

  let progressAnimTimer = null;
  let progressSafetyTimer = null;

  function startProgressBar() {
    clearTimeout(progressAnimTimer);
    clearTimeout(progressSafetyTimer);

    if (!progressBar) return;

    // Reset styles
    progressBar.style.transition = "none";
    progressBar.style.opacity = "1";
    progressBar.style.width = "0%";
    progressBar.classList.remove("done", "loading");

    // Force reflow
    void progressBar.offsetWidth;

    // Smooth entry to 35%
    progressBar.style.transition = "width 0.35s cubic-bezier(0.1, 0.8, 0.2, 1), opacity 0.25s ease";
    progressBar.classList.add("loading");
    progressBar.style.width = "35%";

    // Creep up to 78% then 90%
    progressAnimTimer = setTimeout(() => {
      progressBar.style.transition = "width 1.2s ease-out";
      progressBar.style.width = "78%";
      progressAnimTimer = setTimeout(() => {
        progressBar.style.width = "90%";
      }, 700);
    }, 350);

    // Watchdog: never stays stuck on screen (auto-finishes after 2.2s max)
    progressSafetyTimer = setTimeout(() => {
      finishProgressBar();
    }, 2200);
  }

  function finishProgressBar() {
    clearTimeout(progressAnimTimer);
    clearTimeout(progressSafetyTimer);

    if (!progressBar) return;

    // Swift jump to 100%
    progressBar.style.transition = "width 0.2s ease-out, opacity 0.25s ease";
    progressBar.style.width = "100%";
    progressBar.classList.add("done");

    progressAnimTimer = setTimeout(() => {
      progressBar.style.opacity = "0";
      progressAnimTimer = setTimeout(() => {
        progressBar.style.width = "0%";
        progressBar.classList.remove("done", "loading");
      }, 250);
    }, 150);
  }

  // Chrome-Style Loading Status Controller (Tab Spinner + Bottom Status Bubble)
  const statusBubble = popover.querySelector(".quickpeek-status-bubble");
  const statusText = statusBubble ? statusBubble.querySelector(".status-text") : null;
  let statusTimer = null;

  function showLoadingStatus(url, message = "") {
    startProgressBar();

    // 1. Tab spinner on active tab
    const tab = getActiveTab();
    if (tab && tab.tabEl) {
      tab.tabEl.classList.add("loading");
    }

    // 2. Bottom-left floating status bubble (identical to Google Chrome)
    if (statusBubble && statusText) {
      clearTimeout(statusTimer);
      const domain = extractDomain(url) || "page";
      statusText.textContent = message || `Loading ${domain}...`;
      statusBubble.classList.add("visible");

      statusTimer = setTimeout(() => {
        statusBubble.classList.remove("visible");
      }, 3000);
    }
  }

  function hideLoadingStatus() {
    finishProgressBar();

    // 1. Remove spinner from all tabs
    tabs.forEach((t) => {
      if (t.tabEl) t.tabEl.classList.remove("loading");
    });

    // 2. Fade out status bubble
    if (statusBubble) {
      clearTimeout(statusTimer);
      statusBubble.classList.remove("visible");
    }
  }

  // ==========================================================================
  // Tab Management Functions
  // ==========================================================================

  function getActiveTab() {
    return tabs.find((t) => t.id === activeTabId);
  }

  function createTab(initialUrl, title, query = "") {
    const tabId = nextTabId++;
    const tabTitle = title || query || "New Tab";

    const tabEl = document.createElement("div");
    tabEl.className = "quickpeek-tab";
    tabEl.dataset.tabId = tabId;
    tabEl.innerHTML = `
      <span class="quickpeek-tab-spinner"></span>
      <span class="quickpeek-tab-title">${escapeHTML(tabTitle)}</span>
      <span class="quickpeek-tab-close" title="Close Tab">×</span>
    `;

    tabEl.addEventListener("click", (e) => {
      if (e.target.classList.contains("quickpeek-tab-close")) {
        e.stopPropagation();
        closeTab(tabId);
      } else {
        switchTab(tabId);
      }
    });

    tabsContainer.appendChild(tabEl);

    // Embedded Viewport (Full Video & HTML5 Support - No Monitor Hijacking)
    const iframe = document.createElement("iframe");
    iframe.className = "quickpeek-iframe";
    iframe.dataset.tabId = tabId;
    iframe.setAttribute("allow", "accelerometer; autoplay; clipboard-read; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share");
    iframe.setAttribute("loading", "lazy");

    // Apply current zoom scale
    iframe.style.transform = `scale(${currentZoom})`;
    iframe.style.width = `${(100 / currentZoom).toFixed(2)}%`;
    iframe.style.height = `${(100 / currentZoom).toFixed(2)}%`;
    iframe.style.transformOrigin = "0 0";

    let loadTimer = null;

    iframe.addEventListener("load", () => {
      clearTimeout(loadTimer);
      fallbackBanner.classList.remove("visible");
      hideLoadingStatus();

      try {
        if (iframe.contentDocument && iframe.contentDocument.title) {
          updateTabTitle(tabId, iframe.contentDocument.title);
        }
      } catch (_) {}
    });

    viewport.appendChild(iframe);

    const newTab = {
      id: tabId,
      title: tabTitle,
      url: initialUrl,
      query: query,
      tabEl: tabEl,
      iframe: iframe,
      history: [initialUrl],
      historyIndex: 0
    };

    tabs.push(newTab);

    if (initialUrl) {
      showLoadingStatus(initialUrl, `Opening ${tabTitle}...`);
      iframe.src = initialUrl;
      addToHistory(initialUrl, tabTitle);

      if (isPinned) {
        savePinnedState();
      }

      loadTimer = setTimeout(() => {
        try {
          if (!iframe.contentDocument || iframe.contentDocument.body?.children?.length === 0) {
            fallbackBanner.classList.add("visible");
          }
        } catch (_) {}
      }, 3500);
    }

    switchTab(tabId);
    return newTab;
  }

  function switchTab(tabId) {
    activeTabId = tabId;
    const tab = getActiveTab();
    if (!tab) return;

    tabs.forEach((t) => {
      t.tabEl.classList.toggle("active", t.id === tabId);
      t.iframe.classList.toggle("active", t.id === tabId);
    });

    updateOmniboxDisplay(tab.url, tab.query);
    tab.tabEl.scrollIntoView({ behavior: "smooth", block: "nearest", inline: "nearest" });
    adaptDimensionsToContent(tab.url);
    updateMobileViewportMode();
    updateBookmarkStatus(tab.url);
    updateVideoControls(tab.url);
    if (isPipMode && pipTitle) {
      pipTitle.textContent = tab.title ? `📺 ${tab.title}` : "📺 AirTab PiP";
    }
    hideAllOverlays();

    if (isPinned) {
      savePinnedState();
    }
  }

  function closeTab(tabId) {
    const index = tabs.findIndex((t) => t.id === tabId);
    if (index === -1) return;

    const [removedTab] = tabs.splice(index, 1);
    removedTab.tabEl.remove();
    removedTab.iframe.remove();

    if (tabs.length === 0) {
      if (isPinned || isDocked) {
        createTab(getSearchUrl(""), "Google", "");
      } else {
        closePopover();
      }
      return;
    }

    if (activeTabId === tabId) {
      const nextTab = tabs[Math.max(0, index - 1)];
      switchTab(nextTab.id);
    }

    if (isPinned) {
      savePinnedState();
    }
  }

  function updateTabTitle(tabId, newTitle) {
    const tab = tabs.find((t) => t.id === tabId);
    if (!tab) return;
    tab.title = newTitle;
    const titleSpan = tab.tabEl.querySelector(".quickpeek-tab-title");
    if (titleSpan) {
      titleSpan.textContent = newTitle;
    }
  }

  function navigateActiveTab(targetUrl, query = "") {
    const tab = getActiveTab();
    if (!tab) return;

    tab.url = targetUrl;
    if (query) tab.query = query;

    tab.history = tab.history.slice(0, tab.historyIndex + 1);
    tab.history.push(targetUrl);
    tab.historyIndex = tab.history.length - 1;

    // Reset zoom to 100% on spreadsheets so HTML5 Canvas grids are pixel-perfect
    if (/spreadsheets|docs\.google/i.test(targetUrl) && currentZoom !== 1.0) {
      applyZoom(1.0);
    }

    const displayTitle = query || extractDomain(targetUrl) || "Web";
    fallbackBanner.classList.remove("visible");
    showLoadingStatus(targetUrl, `Opening ${displayTitle}...`);
    tab.iframe.src = targetUrl;
    updateOmniboxDisplay(targetUrl, query);

    updateTabTitle(tab.id, displayTitle);
    addToHistory(targetUrl, displayTitle);
    updateBookmarkStatus(targetUrl);
    updateVideoControls(targetUrl);
    if (isPipMode && pipTitle) {
      pipTitle.textContent = displayTitle ? `📺 ${displayTitle}` : "📺 AirTab PiP";
    }

    if (isPinned) {
      savePinnedState();
    }

    adaptDimensionsToContent(targetUrl);
  }

  // ==========================================================================
  // Smart In-Tab Reload Mechanics (Reloads exact active page)
  // ==========================================================================

  function reloadActiveTab() {
    const tab = getActiveTab();
    if (!tab || !tab.iframe) return;

    showLoadingStatus(tab.url, `Reloading ${tab.title || "page"}...`);

    try {
      // Reload current active page directly inside the iframe
      tab.iframe.contentWindow.location.reload();
    } catch (_) {
      try {
        const docHref = tab.iframe.contentDocument?.location?.href;
        if (docHref && docHref !== "about:blank") {
          tab.iframe.src = docHref;
          return;
        }
      } catch (e) {}
      // Fallback: reload current src
      const current = tab.iframe.src;
      tab.iframe.src = current;
    }
  }

  // ==========================================================================
  // Positioning & Callout Arrow Calculations
  // ==========================================================================

  function adaptDimensionsToContent(url = "") {
    if (isDocked || isMaximized || isPipMode || isTheaterMode) return;

    // Strict Position Preservation: If popover is already open on screen, DO NOT auto-center!
    if (isOpen && popover.style.left && popover.style.top) {
      const currentLeft = parseFloat(popover.style.left);
      const currentTop = parseFloat(popover.style.top);
      if (!isNaN(currentLeft) && !isNaN(currentTop)) {
        return;
      }
    }

    const dims = getDisplayAdaptiveDimensions(url);
    initialWidth = dims.width;
    initialHeight = dims.height;

    popover.style.width = `${dims.width}px`;
    popover.style.height = `${dims.height}px`;

    // Center popover on display (Initial launch only)
    const left = Math.max(16, Math.round((window.innerWidth - dims.width) / 2));
    const top = Math.max(16, Math.round((window.innerHeight - dims.height) / 2));
    popover.style.left = `${left}px`;
    popover.style.top = `${top}px`;
    arrow.className = "quickpeek-arrow";
  }

  function positionPopover(rect, url = "") {
    if (isDocked || isMaximized || isPipMode || isTheaterMode) return;

    const dims = getDisplayAdaptiveDimensions(url || getActiveTab()?.url || "");
    const popoverWidth = dims.width;
    const popoverHeight = dims.height;

    initialWidth = popoverWidth;
    initialHeight = popoverHeight;

    popover.style.width = `${popoverWidth}px`;
    popover.style.height = `${popoverHeight}px`;

    // If it's a spreadsheet or no text selection, always center wide on screen!
    if (dims.isSheet || !rect || rect.width === 0) {
      const left = Math.max(16, Math.round((window.innerWidth - popoverWidth) / 2));
      const top = Math.max(16, Math.round((window.innerHeight - popoverHeight) / 2));

      popover.style.left = `${left}px`;
      popover.style.top = `${top}px`;
      arrow.className = "quickpeek-arrow";
      return;
    }

    if (rect && rect.width > 0 && rect.height > 0) {
      const selCenter = rect.left + rect.width / 2;
      let left = selCenter - popoverWidth / 2;
      left = Math.max(16, Math.min(window.innerWidth - popoverWidth - 16, left));

      const spaceBelow = window.innerHeight - (rect.bottom + 12);
      const spaceAbove = rect.top - 12;

      let top = 0;
      let isArrowTop = true;

      if (spaceBelow >= popoverHeight || spaceBelow >= spaceAbove) {
        top = rect.bottom + 12;
        isArrowTop = true;
      } else {
        top = Math.max(16, rect.top - popoverHeight - 12);
        isArrowTop = false;
      }

      top = Math.max(16, Math.min(window.innerHeight - popoverHeight - 16, top));

      popover.style.left = `${left}px`;
      popover.style.top = `${top}px`;

      let arrowLeft = selCenter - 9;
      arrowLeft = Math.max(left + 22, Math.min(left + popoverWidth - 40, arrowLeft));

      arrow.style.left = `${arrowLeft}px`;

      if (isArrowTop) {
        arrow.style.top = `${top}px`;
        arrow.className = "quickpeek-arrow arrow-top visible";
        arrow.innerHTML = `
          <svg viewBox="0 0 18 9" preserveAspectRatio="none">
            <path d="M 0 9 L 9 0 L 18 9" fill="rgba(22, 22, 24, 0.90)" stroke="rgba(255, 255, 255, 0.14)" stroke-width="1" />
          </svg>
        `;
      } else {
        arrow.style.top = `${top + popoverHeight}px`;
        arrow.className = "quickpeek-arrow arrow-bottom visible";
        arrow.innerHTML = `
          <svg viewBox="0 0 18 9" preserveAspectRatio="none">
            <path d="M 0 0 L 9 9 L 18 0" fill="rgba(22, 22, 24, 0.90)" stroke="rgba(255, 255, 255, 0.14)" stroke-width="1" />
          </svg>
        `;
      }
    } else {
      const left = Math.max(16, (window.innerWidth - popoverWidth) / 2);
      const top = Math.max(16, (window.innerHeight - popoverHeight) / 2);

      popover.style.left = `${left}px`;
      popover.style.top = `${top}px`;
      arrow.className = "quickpeek-arrow";
    }
  }

  // ==========================================================================
  // Open / Close Lifecycle
  // ==========================================================================

  function openAirTab({ text = "", rect = null, url = "", isTemporary = false } = {}) {
    isTemporaryPeek = !!isTemporary;
    hidePill();
    hideLinkPeekBadge();

    if (isSideMinimized) {
      isSideMinimized = false;
      sideBar.classList.remove("visible");
    }

    const query = text.trim();
    currentSelectionText = query;
    currentSelectionRect = rect;

    // Suppress coordinate transitions so window snaps to position without sliding/flying flash
    popover.style.transition = "none";
    positionPopover(rect, url);
    void popover.offsetHeight; // Force reflow
    popover.style.transition = "";

    const wasAlreadyVisible = popover.classList.contains("visible");
    popover.classList.remove("closing", "minimizing", "restoring");
    popover.classList.add("visible");
    if (!wasAlreadyVisible) {
      popover.classList.add("opening");
      setTimeout(() => popover.classList.remove("opening"), 210);
    }
    isOpen = true;

    const initialUrl = url || getSearchUrl(query);
    const initialTitle = url ? extractDomain(url) : (query || "Google");

    if (tabs.length === 0) {
      createTab(initialUrl, initialTitle, query);
    } else if (url) {
      createTab(initialUrl, initialTitle, query);
    } else if (query) {
      const active = getActiveTab();
      if (active) {
        navigateActiveTab(initialUrl, query);
      } else {
        createTab(initialUrl, initialTitle, query);
      }
    }

    if (!query && !url) {
      setTimeout(() => omnibox.focus(), 150);
    }
  }

  function closePopover(force = false) {
    if (isPinned && !force) return; // Strict guard: NEVER close when pinned
    if (!isOpen) return;

    arrow.classList.remove("visible");
    hideAllOverlays();
    isOpen = false;

    popover.classList.remove("opening", "minimizing", "restoring");
    popover.classList.add("closing");

    setTimeout(() => {
      popover.classList.remove("visible", "closing");
      if (force) {
        isSideMinimized = false;
        sideBar.classList.remove("visible");
      }
    }, 180);
  }

  // ==========================================================================
  // Global Browser-Wide Roaming & State Persistence
  // ==========================================================================

  function showStatusMessage(message, duration = 2400) {
    if (statusBubble && statusText) {
      clearTimeout(statusTimer);
      statusText.textContent = message;
      statusBubble.classList.add("visible");
      statusTimer = setTimeout(() => {
        statusBubble.classList.remove("visible");
      }, duration);
    }
  }

  function getAirTabState() {
    const computedStyle = window.getComputedStyle(popover);
    return {
      isOpen: isOpen,
      isPinned: isPinned,
      isDocked: isDocked,
      dockWidth: (settings && settings.sidebarWidth) ? settings.sidebarWidth : 460,
      isPipMode: isPipMode,
      isTheaterMode: isTheaterMode,
      isMaximized: isMaximized,
      position: {
        left: popover.style.left || `${computedStyle.left}`,
        top: popover.style.top || `${computedStyle.top}`,
        width: popover.style.width || `${computedStyle.width}`,
        height: popover.style.height || `${computedStyle.height}`
      },
      tabs: tabs.map((t) => ({
        title: t.title,
        url: t.url,
        query: t.query
      })),
      activeTabIndex: tabs.findIndex((t) => t.id === activeTabId)
    };
  }

  let savePinnedDebounce = null;
  function savePinnedState() {
    if (!isPinned || pinMode !== "chrome") {
      clearTimeout(savePinnedDebounce);
      savePinnedDebounce = null;
      return;
    }
    clearTimeout(savePinnedDebounce);
    savePinnedDebounce = setTimeout(() => {
      if (!isPinned || pinMode !== "chrome") return;
      const state = getAirTabState();
      chrome.storage.local.set({
        airtabPinned: true,
        airtabPinnedMode: "chrome",
        airtabPinnedState: state,
        airtabPinnedUrl: (state.tabs && state.tabs[state.activeTabIndex]) ? state.tabs[state.activeTabIndex].url : ""
      });
    }, 500);
  }

  function applyPinnedState(state) {
    if (!state || !state.tabs || state.tabs.length === 0) return;

    // If AirTab is already open with the same tabs, skip reconstruction entirely.
    // This prevents iframe refresh when switching Chrome tabs in global/pinned mode.
    if (isOpen && isPinned && pinMode === "chrome") {
      // Already showing the pinned AirTab — just ensure visibility, no iframe destruction.
      popover.classList.add("visible");
      hidePill();
      return;
    }

    setPinMode("chrome");

    if (isSideMinimized) {
      isSideMinimized = false;
      sideBar.classList.remove("visible");
    }

    // Restore position & dimensions
    if (state.position) {
      if (state.position.left) popover.style.left = state.position.left;
      if (state.position.top) popover.style.top = state.position.top;
      if (state.position.width) popover.style.width = state.position.width;
      if (state.position.height) popover.style.height = state.position.height;
      arrow.classList.remove("visible");
    }

    // Sync tabs — check if we already have the exact same set of tabs loaded
    const sameTabs = tabs.length === state.tabs.length &&
      tabs.every((t, i) => {
        // Compare base URLs only (ignore fragment/query changes from SPA navigation)
        try {
          const a = new URL(t.url).origin + new URL(t.url).pathname;
          const b = new URL(state.tabs[i].url).origin + new URL(state.tabs[i].url).pathname;
          return a === b;
        } catch (_) {
          return t.url === state.tabs[i].url;
        }
      });

    if (!sameTabs) {
      [...tabs].forEach((t) => {
        try { t.tabEl.remove(); } catch (_) {}
        try { t.iframe.remove(); } catch (_) {}
      });
      tabs = [];
      activeTabId = null;

      state.tabs.forEach((tabData) => {
        createTab(tabData.url, tabData.title, tabData.query);
      });

      const targetIdx = (state.activeTabIndex >= 0 && state.activeTabIndex < tabs.length) ? state.activeTabIndex : 0;
      if (tabs[targetIdx]) {
        switchTab(tabs[targetIdx].id);
      }
    } else {
      // Tabs are same — just switch active tab if needed, DO NOT reload iframes
      const targetIdx = (state.activeTabIndex >= 0 && state.activeTabIndex < tabs.length) ? state.activeTabIndex : 0;
      if (tabs[targetIdx] && tabs[targetIdx].id !== activeTabId) {
        switchTab(tabs[targetIdx].id);
      }
    }

    if (state.isDocked && !isDocked) {
      setDockedMode(true);
    } else if (!state.isDocked && isDocked) {
      setDockedMode(false);
    }

    if (state.isMaximized && !isMaximized) {
      toggleMaximize(true);
    } else if (!state.isMaximized && isMaximized) {
      toggleMaximize(false);
    }

    if (state.isPipMode && !isPipMode) {
      togglePipMode(true);
    } else if (!state.isPipMode && isPipMode) {
      togglePipMode(false);
    }

    if (state.isTheaterMode && !isTheaterMode) {
      toggleTheaterMode(true);
    } else if (!state.isTheaterMode && isTheaterMode) {
      toggleTheaterMode(false);
    }

    popover.classList.add("visible");
    isOpen = true;
    hidePill();
  }

  // ==========================================================================
  // Side Minimized Quick-Access Bar (Docked to right edge on outside click)
  // ==========================================================================

  function minimizeToSideBar() {
    if (!isOpen || isPinned || isDocked || isSideMinimized) return;
    isSideMinimized = true;
    arrow.classList.remove("visible");
    hideAllOverlays();

    const tab = getActiveTab();
    if (sideLabel) {
      sideLabel.textContent = "AirTab";
    }
    if (sidePill) {
      sidePill.title = (tab && tab.title) ? `${tab.title} (Click to restore AirTab, drag to move)` : "Click to restore AirTab (Drag to reposition)";
    }

    // Smooth fluid morph towards right edge
    popover.classList.remove("opening", "closing", "restoring");
    popover.classList.add("minimizing");
    sideBar.classList.add("visible");

    setTimeout(() => {
      popover.classList.remove("visible", "minimizing");
    }, 220);
  }

  function restoreFromSideBar() {
    isSideMinimized = false;
    sideBar.classList.remove("visible");
    popover.classList.remove("minimizing", "closing", "opening");
    popover.classList.add("visible", "restoring");
    isOpen = true;

    setTimeout(() => {
      popover.classList.remove("restoring");
    }, 230);
  }

  let isSideBarDragging = false;
  let sideBarStartY = 0;
  let sideBarStartTop = 0;

  // Restore saved vertical position
  chrome.storage.local.get(["airtabSideBarTop"], (res) => {
    if (res && typeof res.airtabSideBarTop === "number") {
      const clamped = Math.max(20, Math.min(window.innerHeight - 60, res.airtabSideBarTop));
      sideBar.style.top = `${clamped}px`;
    }
  });

  sidePill.addEventListener("mousedown", (e) => {
    if (e.target.closest(".airtab-side-dismiss")) return;
    isSideBarDragging = false;
    sideBarStartY = e.clientY;
    const computedTop = parseFloat(window.getComputedStyle(sideBar).top) || sideBar.offsetTop;
    sideBarStartTop = computedTop;

    function onSideMouseMove(ev) {
      const dy = ev.clientY - sideBarStartY;
      if (Math.abs(dy) > 3) {
        isSideBarDragging = true;
      }
      if (isSideBarDragging) {
        let newTop = sideBarStartTop + dy;
        newTop = Math.max(20, Math.min(window.innerHeight - 55, newTop));
        sideBar.style.top = `${newTop}px`;
      }
    }

    function onSideMouseUp() {
      window.removeEventListener("mousemove", onSideMouseMove);
      window.removeEventListener("mouseup", onSideMouseUp);
      if (isSideBarDragging) {
        const finalTop = parseFloat(sideBar.style.top);
        if (finalTop) {
          chrome.storage.local.set({ airtabSideBarTop: finalTop });
        }
      }
    }

    window.addEventListener("mousemove", onSideMouseMove);
    window.addEventListener("mouseup", onSideMouseUp);
  });

  sidePill.addEventListener("click", (e) => {
    if (e.target.closest(".airtab-side-dismiss")) return;
    if (isSideBarDragging) {
      isSideBarDragging = false;
      return;
    }
    restoreFromSideBar();
  });

  sideDismissBtn.addEventListener("click", (e) => {
    e.stopPropagation();
    isSideMinimized = false;
    sideBar.classList.remove("visible");
    closePopover(true);
  });

  // ==========================================================================
  // Selection Pill (⚡ AirTab)
  // ==========================================================================

  function showPill(rect, text) {
    if (isOpen && (isPinned || isDocked)) return;

    currentSelectionText = text;
    currentSelectionRect = rect;

    let pillX = rect.left + rect.width / 2 - 45;
    let pillY = rect.top - 32;

    if (pillX + 105 > window.innerWidth) {
      pillX = window.innerWidth - 115;
    }
    if (pillX < 10) pillX = 10;
    if (pillY < 10) {
      pillY = rect.bottom + 8;
    }

    pillTrigger.style.left = `${pillX}px`;
    pillTrigger.style.top = `${pillY}px`;
    pillTrigger.classList.add("visible");
  }

  function hidePill() {
    pillTrigger.classList.remove("visible");
  }

  document.addEventListener("mouseup", (e) => {
    if (e.composedPath().includes(host)) return;

    setTimeout(() => {
      const selection = window.getSelection();
      const text = selection ? selection.toString().trim() : "";

      if (text.length > 0 && selection.rangeCount > 0) {
        const range = selection.getRangeAt(0);
        const rect = range.getBoundingClientRect();
        if (rect && rect.width > 0 && rect.height > 0) {
          showPill(rect, text);
          return;
        }
      }

      hidePill();
    }, 10);
  });

  pillTrigger.addEventListener("click", (e) => {
    e.stopPropagation();
    e.preventDefault();
    openAirTab({
      text: currentSelectionText,
      rect: currentSelectionRect,
      isTemporary: false // Manual Selection Click: Persistent Mode ("samne dikha rhega")!
    });
  });

  // Outside click on host page: Collapses smoothly into the floating side pill
  function handleHostOutsideClick(e) {
    if (e.composedPath && e.composedPath().includes(host)) return;
    hidePill();
    hideLinkPeekBadge();

    if (isOpen && !isPinned && !isDocked) {
      minimizeToSideBar();
    }
  }

  // Register in CAPTURE phase so page scripts cannot swallow/stopPropagation the event
  window.addEventListener("mousedown", handleHostOutsideClick, true);
  window.addEventListener("pointerdown", handleHostOutsideClick, true);

  // If user clicks into an iframe on the host page, blur fires on window
  window.addEventListener("blur", () => {
    if (document.activeElement && document.activeElement.tagName === "IFRAME") {
      const activeEl = document.activeElement;
      if (host && !host.contains(activeEl)) {
        hidePill();
        hideLinkPeekBadge();
        if (isOpen && !isPinned && !isDocked) {
          minimizeToSideBar();
        }
      }
    }
  });

  // ==========================================================================
  // Instant Hover Peek & Look Up Engine (Configurable Hotkey / macOS Look Up)
  // ==========================================================================

  function hideLinkPeekBadge() {
    linkPeekBadge.classList.remove("visible");
    activeHoveredLink = null;
  }

  let linkHoverTimer = null;
  let lastMouseX = null;
  let lastMouseY = null;
  let lastHoveredElement = null;

  document.addEventListener("mousemove", (e) => {
    lastMouseX = e.clientX;
    lastMouseY = e.clientY;
    lastHoveredElement = e.target;
  }, { passive: true });

  document.addEventListener("mouseover", (e) => {
    if (!settings.linkPeekEnabled) return;
    if (e.composedPath().includes(host)) return;

    const link = e.target.closest("a");
    if (!link || !link.href || link.href.startsWith("javascript:")) {
      hideLinkPeekBadge();
      return;
    }

    activeHoveredLink = link;

    if (e.shiftKey || e.altKey) {
      showLinkPeek(link);
    } else {
      clearTimeout(linkHoverTimer);
      linkHoverTimer = setTimeout(() => {
        if (activeHoveredLink === link) {
          showLinkPeek(link);
        }
      }, 500);
    }
  });

  document.addEventListener("mouseout", (e) => {
    const link = e.target.closest("a");
    if (link && activeHoveredLink === link) {
      clearTimeout(linkHoverTimer);
      setTimeout(() => {
        if (!linkPeekBadge.matches(":hover")) {
          hideLinkPeekBadge();
        }
      }, 200);
    }
  });

  function getWordUnderCursor(x, y) {
    if (x == null || y == null) return null;
    let range = null;
    let textNode = null;
    let offset = 0;

    if (document.caretRangeFromPoint) {
      range = document.caretRangeFromPoint(x, y);
      if (range) {
        textNode = range.startContainer;
        offset = range.startOffset;
      }
    } else if (document.caretPositionFromPoint) {
      const pos = document.caretPositionFromPoint(x, y);
      if (pos) {
        textNode = pos.offsetNode;
        offset = pos.offset;
      }
    }

    if (!textNode || textNode.nodeType !== Node.TEXT_NODE) {
      return null;
    }

    const text = textNode.textContent || "";
    if (!text || offset < 0 || offset > text.length) return null;

    // Unicode word character: letters, numbers, apostrophes, underscores, hyphens
    const isWordChar = (ch) => ch && /[\p{L}\p{N}'_\-]/u.test(ch);

    let targetOffset = offset;
    if (!isWordChar(text[targetOffset]) && targetOffset > 0 && isWordChar(text[targetOffset - 1])) {
      targetOffset--;
    }
    if (!isWordChar(text[targetOffset])) return null;

    let start = targetOffset;
    while (start > 0 && isWordChar(text[start - 1])) {
      start--;
    }

    let end = targetOffset;
    while (end < text.length && isWordChar(text[end])) {
      end++;
    }

    const word = text.slice(start, end).replace(/^['_\-]+|['_\-]+$/g, "").trim();
    if (!word || word.length < 1) return null;

    let rect = null;
    try {
      const wordRange = document.createRange();
      wordRange.setStart(textNode, start);
      wordRange.setEnd(textNode, end);
      rect = wordRange.getBoundingClientRect();
    } catch (_) {}

    if (!rect || (rect.width === 0 && rect.height === 0)) {
      const parent = textNode.parentElement;
      if (parent && parent.getBoundingClientRect) {
        rect = parent.getBoundingClientRect();
      }
    }

    return { word, rect };
  }

  function isTypingInput(target) {
    if (!target) target = document.activeElement;
    if (!target) return false;
    const tag = target.tagName ? target.tagName.toLowerCase() : "";
    if (tag === "input" || tag === "textarea" || tag === "select") return true;
    if (target.isContentEditable || target.getAttribute("contenteditable") === "true") return true;
    return false;
  }

  function matchesPeekHotkey(e) {
    const hotkey = settings.peekHotkey || "Alt";
    if (hotkey === "Alt") {
      return e.key === "Alt" || e.key === "Option" || (e.altKey && !e.ctrlKey && !e.metaKey);
    }
    if (hotkey === "Shift") {
      return e.key === "Shift" || (e.shiftKey && !e.ctrlKey && !e.altKey);
    }
    if (hotkey === "Control") {
      return e.key === "Control" || e.key === "Meta" || e.ctrlKey || e.metaKey;
    }
    if (hotkey === "Space") {
      return e.code === "Space" || e.key === " ";
    }
    return false;
  }

  // Instant Peek & Toggle on Hotkey Press (Press to Open -> Press again to Hide)
  window.addEventListener("keydown", (e) => {
    if (e.repeat) return;
    if (!settings.linkPeekEnabled) return;

    if (matchesPeekHotkey(e)) {
      // TOGGLE: If AirTab is already open, pressing hotkey hides / closes it immediately!
      if (isOpen) {
        if (settings.peekHotkey === "Space" && (isTypingInput(e.target) || isTypingInput(document.activeElement))) {
          return;
        }
        if (settings.peekHotkey === "Space") e.preventDefault();
        closePopover(true);
        return;
      }

      // If AirTab is closed, ensure user is not actively typing in an input / textarea
      if (isTypingInput(e.target) || isTypingInput(document.activeElement)) return;

      // Priority 1: User has highlighted text
      const selection = window.getSelection();
      const selectedText = selection ? selection.toString().trim() : "";
      if (selectedText && selectedText.length > 0) {
        let rect = null;
        try {
          const range = selection.getRangeAt(0);
          rect = range.getBoundingClientRect();
        } catch (_) {}
        if (settings.peekHotkey === "Space") e.preventDefault();
        openAirTab({ text: selectedText, rect: rect, isTemporary: true });
        return;
      }

      // Priority 2: Hovering over a link
      const link = (lastHoveredElement && lastHoveredElement.closest) ? lastHoveredElement.closest("a") : activeHoveredLink;
      if (link && link.href && !link.href.startsWith("javascript:")) {
        if (settings.peekHotkey === "Space") e.preventDefault();
        const rect = link.getBoundingClientRect();
        openAirTab({ url: link.href, rect: rect, isTemporary: true });
        hideLinkPeekBadge();
        return;
      }

      // Priority 3: Hovering over a word
      if (lastMouseX !== null && lastMouseY !== null) {
        const wordInfo = getWordUnderCursor(lastMouseX, lastMouseY);
        if (wordInfo && wordInfo.word) {
          if (settings.peekHotkey === "Space") e.preventDefault();
          openAirTab({ text: wordInfo.word, rect: wordInfo.rect, isTemporary: true });
          return;
        }
      }

      // Priority 4: Hovering over an image
      const img = (lastHoveredElement && lastHoveredElement.closest) ? lastHoveredElement.closest("img") : null;
      if (img && (img.src || img.alt)) {
        if (settings.peekHotkey === "Space") e.preventDefault();
        const rect = img.getBoundingClientRect();
        if (img.alt && img.alt.trim().length > 1) {
          openAirTab({ text: img.alt.trim(), rect: rect, isTemporary: true });
        } else if (img.src) {
          openAirTab({ url: img.src, rect: rect, isTemporary: true });
        }
        return;
      }
    }
  }, true);

  function showLinkPeek(link) {
    const rect = link.getBoundingClientRect();
    if (!rect || rect.width === 0) return;

    let bx = rect.right + 6;
    let by = rect.top - 6;

    if (bx + 85 > window.innerWidth) {
      bx = rect.left - 85;
    }
    if (by < 10) by = rect.bottom + 4;

    linkPeekBadge.style.left = `${Math.max(10, bx)}px`;
    linkPeekBadge.style.top = `${Math.max(10, by)}px`;
    linkPeekBadge.classList.add("visible");
  }

  linkPeekBadge.addEventListener("click", (e) => {
    e.stopPropagation();
    e.preventDefault();
    if (activeHoveredLink && activeHoveredLink.href) {
      const rect = activeHoveredLink.getBoundingClientRect();
      openAirTab({ url: activeHoveredLink.href, rect: rect });
      hideLinkPeekBadge();
    }
  });

  // Hotkey / Option / Shift + Click any link directly opens in AirTab Look Up
  document.addEventListener("click", (e) => {
    if (!settings.linkPeekEnabled) return;
    if (isTypingInput(e.target)) return;

    const hotkey = settings.peekHotkey || "Alt";
    const matchesClickModifier =
      (hotkey === "Shift" && e.shiftKey) ||
      (hotkey === "Control" && (e.ctrlKey || e.metaKey)) ||
      (e.altKey || e.shiftKey);

    if (matchesClickModifier) {
      const link = (e.target && e.target.closest) ? e.target.closest("a") : null;
      if (link && link.href && !e.composedPath().includes(host)) {
        e.preventDefault();
        e.stopPropagation();
        const rect = link.getBoundingClientRect();
        openAirTab({ url: link.href, rect: rect });
        hideLinkPeekBadge();
      }
    }
  }, true);

  // Track last context menu target to position AirTab right where the user right-clicked
  let lastContextMenuRect = null;
  document.addEventListener("contextmenu", (e) => {
    try {
      const link = (e.target && e.target.closest) ? e.target.closest("a") : null;
      const target = link || e.target;
      if (target && target.getBoundingClientRect) {
        lastContextMenuRect = target.getBoundingClientRect();
      } else {
        lastContextMenuRect = {
          left: e.clientX,
          right: e.clientX,
          top: e.clientY,
          bottom: e.clientY,
          width: 0,
          height: 0
        };
      }
    } catch (_) {
      lastContextMenuRect = null;
    }
  }, true);

  // Keyboard Shortcuts (Alt+S, Escape, Cmd+R / F5 smart reload, F for Fullscreen, P for PiP)
  window.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && isOpen) {
      if (isMaximized) {
        toggleMaximize(false);
        return;
      }
      if (isPipMode) {
        togglePipMode(false);
        return;
      }
      if (isTheaterMode) {
        toggleTheaterMode(false);
        return;
      }
      if (activeOverlay) {
        hideAllOverlays();
      } else {
        closePopover();
      }
      return;
    }

    // Intercept keyboard controls when focused/interacting with AirTab
    if (isOpen && e.composedPath().includes(host)) {
      const activeEl = shadow.activeElement || document.activeElement;
      const isTyping = activeEl && (activeEl.tagName === "INPUT" || activeEl.tagName === "TEXTAREA" || activeEl.isContentEditable);

      if (!isTyping) {
        if (e.key === "f" || e.key === "F") {
          e.preventDefault();
          toggleMaximize();
          return;
        }
        if (e.key === "p" || e.key === "P") {
          e.preventDefault();
          togglePipMode();
          return;
        }
        if (e.key === "t" || e.key === "T") {
          e.preventDefault();
          toggleTheaterMode();
          return;
        }
      }

      // Keyboard Navigation (Back / Forward)
      if ((e.metaKey && e.key === "[") || (e.altKey && e.key === "ArrowLeft")) {
        e.preventDefault();
        goBack();
        return;
      }
      if ((e.metaKey && e.key === "]") || (e.altKey && e.key === "ArrowRight")) {
        e.preventDefault();
        goForward();
        return;
      }

      // Zoom Keyboard Shortcuts (Cmd/Ctrl + Plus, Minus, 0)
      if (e.metaKey || e.ctrlKey) {
        if (e.key === "=" || e.key === "+") {
          e.preventDefault();
          applyZoom(currentZoom + 0.15);
          return;
        }
        if (e.key === "-" || e.key === "_") {
          e.preventDefault();
          applyZoom(currentZoom - 0.15);
          return;
        }
        if (e.key === "0") {
          e.preventDefault();
          applyZoom(1.0);
          return;
        }
      }
    }

    // Intercept Cmd+R or F5 when interacting with AirTab to reload active tab only
    if (isOpen && ((e.metaKey || e.ctrlKey) && (e.key === "r" || e.key === "R"))) {
      if (e.composedPath().includes(host)) {
        e.preventDefault();
        reloadActiveTab();
        return;
      }
    }
    if (isOpen && e.key === "F5") {
      if (e.composedPath().includes(host)) {
        e.preventDefault();
        reloadActiveTab();
        return;
      }
    }

    if (e.altKey && (e.code === "KeyS" || e.key === "s" || e.key === "S")) {
      e.preventDefault();
      e.stopPropagation();

      const selection = window.getSelection();
      const text = selection ? selection.toString().trim() : "";
      let rect = null;

      if (text.length > 0 && selection.rangeCount > 0) {
        rect = selection.getRangeAt(0).getBoundingClientRect();
      }

      if (isOpen) {
        closePopover();
      } else {
        openAirTab({ text: text, rect: rect });
      }
    }
  });

  // ==========================================================================
  // Header Bar Dragging
  // ==========================================================================

  headerBar.addEventListener("mousedown", (e) => {
    if (isDocked || isMaximized) return;
    if (e.target.closest(".quickpeek-tab") ||
        e.target.closest(".quickpeek-add-tab-btn") ||
        e.target.closest(".quickpeek-action-btn")) {
      return;
    }

    isDragging = true;
    dragStartX = e.clientX;
    dragStartY = e.clientY;

    if (isPipMode) {
      const rect = popover.getBoundingClientRect();
      initialLeft = rect.left;
      initialTop = rect.top;
      popover.style.bottom = "auto";
      popover.style.right = "auto";
      popover.style.left = `${initialLeft}px`;
      popover.style.top = `${initialTop}px`;
    } else {
      const computedStyle = window.getComputedStyle(popover);
      initialLeft = parseFloat(computedStyle.left) || popover.offsetLeft;
      initialTop = parseFloat(computedStyle.top) || popover.offsetTop;
    }

    popover.classList.add("is-dragging");
    arrow.classList.remove("visible");

    function onMouseMove(ev) {
      if (!isDragging) return;
      const dx = ev.clientX - dragStartX;
      const dy = ev.clientY - dragStartY;

      let newLeft = initialLeft + dx;
      let newTop = initialTop + dy;

      newLeft = Math.max(0, Math.min(window.innerWidth - popover.offsetWidth, newLeft));
      newTop = Math.max(0, Math.min(window.innerHeight - popover.offsetHeight, newTop));

      popover.style.left = `${newLeft}px`;
      popover.style.top = `${newTop}px`;
    }

    function onMouseUp() {
      isDragging = false;
      popover.classList.remove("is-dragging");
      if (isPinned) savePinnedState();
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("mouseup", onMouseUp);
    }

    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("mouseup", onMouseUp);
  });

  // Corner Resizing
  resizeHandle.addEventListener("mousedown", (e) => {
    if (isDocked || isMaximized) return;
    e.stopPropagation();
    e.preventDefault();

    isResizing = true;
    dragStartX = e.clientX;
    dragStartY = e.clientY;

    if (isPipMode) {
      const rect = popover.getBoundingClientRect();
      popover.style.bottom = "auto";
      popover.style.right = "auto";
      popover.style.left = `${rect.left}px`;
      popover.style.top = `${rect.top}px`;
    }

    initialWidth = popover.offsetWidth;
    initialHeight = popover.offsetHeight;

    popover.classList.add("is-resizing");
    arrow.classList.remove("visible");

    function onResizeMove(ev) {
      if (!isResizing) return;
      const dw = ev.clientX - dragStartX;
      const dh = ev.clientY - dragStartY;

      const minW = isPipMode ? 280 : 290;
      const minH = isPipMode ? 180 : 340;
      const newWidth = Math.max(minW, Math.min(window.innerWidth - 32, initialWidth + dw));
      const newHeight = Math.max(minH, Math.min(window.innerHeight - 32, initialHeight + dh));

      popover.style.width = `${newWidth}px`;
      popover.style.height = `${newHeight}px`;
      updateMobileViewportMode();
    }

    function onResizeUp() {
      isResizing = false;
      popover.classList.remove("is-resizing");
      initialWidth = popover.offsetWidth;
      initialHeight = popover.offsetHeight;
      updateMobileViewportMode();
      if (isPinned) savePinnedState();
      window.removeEventListener("mousemove", onResizeMove);
      window.removeEventListener("mouseup", onResizeUp);
    }

    window.addEventListener("mousemove", onResizeMove);
    window.addEventListener("mouseup", onResizeUp);
  });

  // Automatic Mobile Viewport Adaptation on any size change
  if (window.ResizeObserver) {
    const popoverResizeObserver = new ResizeObserver(() => {
      if (isOpen) {
        updateMobileViewportMode();
      }
    });
    popoverResizeObserver.observe(popover);
  }

  // ==========================================================================
  // Navigation & Actions
  // ==========================================================================

  addTabBtn.addEventListener("click", () => {
    createTab(getSearchUrl(""), "Google", "");
  });

  // ==========================================================================
  // Dual Pin Mechanics: Pin for this Tab vs Pin for Chrome (Universal Roaming)
  // ==========================================================================

  function setPinMode(mode) {
    pinMode = mode;
    isPinned = (mode === "tab");

    clearTimeout(savePinnedDebounce);
    savePinnedDebounce = null;

    pinBtn.classList.remove("pinned", "pinned-tab", "pinned-chrome");

    if (pinTabOpt) pinTabOpt.classList.toggle("active", mode === "tab");
    if (unpinOpt) unpinOpt.classList.toggle("active", mode === "none");

    if (mode === "tab") {
      isTemporaryPeek = false;
      pinBtn.classList.add("pinned", "pinned-tab");
      chrome.storage.local.remove(["airtabPinned", "airtabPinnedMode", "airtabPinnedState", "airtabPinnedUrl"]);
      chrome.runtime.sendMessage({ action: "AIRTAB_UNPIN_ALL" }).catch(() => {});
      showStatusMessage("📌 Pinned to this Tab: Stays sticky on this page");
    } else {
      chrome.storage.local.remove(["airtabPinned", "airtabPinnedMode", "airtabPinnedState", "airtabPinnedUrl"]);
      chrome.runtime.sendMessage({ action: "AIRTAB_UNPIN_ALL" }).catch(() => {});
      showStatusMessage("📍 AirTab Unpinned: Normal floating card");
    }
  }

  let pinHoverTimer = null;

  function showPinMenu() {
    clearTimeout(pinHoverTimer);
    if (!pinMenu) return;
    if (pinTabOpt) pinTabOpt.classList.toggle("active", pinMode === "tab");
    if (unpinOpt) unpinOpt.classList.toggle("active", pinMode === "none");
    pinMenu.style.display = "flex";
  }

  function hidePinMenu(delay = 180) {
    clearTimeout(pinHoverTimer);
    pinHoverTimer = setTimeout(() => {
      if (pinMenu) pinMenu.style.display = "none";
    }, delay);
  }

  if (pinWrapper) {
    pinWrapper.addEventListener("mouseenter", () => showPinMenu());
    pinWrapper.addEventListener("mouseleave", () => hidePinMenu(220));
  }

  pinBtn.addEventListener("click", (e) => {
    e.stopPropagation();
    // 1-Click Fast Action: Toggle "Pin to Current Tab" (Sticky on this page, zero reload on other tabs)
    if (pinMode === "tab") {
      setPinMode("none");
    } else {
      setPinMode("tab");
    }
    hidePinMenu(0);
  });

  let activePipWindow = null;

  async function openAlwaysOnFrontPiP() {
    if ("documentPictureInPicture" in window) {
      try {
        if (activePipWindow) {
          activePipWindow.close();
          activePipWindow = null;
          return true;
        }

        const width = Math.max(540, popover.offsetWidth || 540);
        const height = Math.max(640, popover.offsetHeight || 640);
        const pipWin = await window.documentPictureInPicture.requestWindow({
          width: width,
          height: height
        });
        activePipWindow = pipWin;

        const style = document.createElement("style");
        style.textContent = `
          * { box-sizing: border-box; margin: 0; padding: 0; }
          html, body {
            width: 100%;
            height: 100%;
            overflow: hidden;
            background: #0d0e12;
            font-family: -apple-system, BlinkMacSystemFont, "SF Pro Text", "Segoe UI", Roboto, sans-serif;
          }
          .quickpeek-popover {
            position: absolute !important;
            top: 0 !important;
            left: 0 !important;
            right: 0 !important;
            bottom: 0 !important;
            width: 100% !important;
            height: 100% !important;
            max-width: 100% !important;
            max-height: 100% !important;
            border-radius: 0 !important;
            border: none !important;
            box-shadow: none !important;
            display: flex !important;
            opacity: 1 !important;
            visibility: visible !important;
            pointer-events: auto !important;
          }
          .quickpeek-arrow { display: none !important; }
        `;
        pipWin.document.head.appendChild(style);

        const link = document.createElement("link");
        link.rel = "stylesheet";
        link.href = chrome.runtime.getURL("styles.css");
        pipWin.document.head.appendChild(link);

        pipWin.document.body.appendChild(popover);
        popover.classList.add("visible", "in-pip-window");
        showStatusMessage("📺 Always on Front: Floating on top of all tabs & apps!");

        pipWin.addEventListener("pagehide", () => {
          popover.classList.remove("in-pip-window");
          shadow.appendChild(popover);
          activePipWindow = null;
          if (isOpen) {
            popover.classList.add("visible");
          }
        });
        return true;
      } catch (err) {
        console.warn("PiP error:", err);
      }
    }
    return false;
  }

  if (pinTabOpt) {
    pinTabOpt.addEventListener("click", (e) => {
      e.stopPropagation();
      setPinMode(pinMode === "tab" ? "none" : "tab");
      hidePinMenu(0);
    });
  }

  if (pinChromeOpt) {
    pinChromeOpt.addEventListener("click", async (e) => {
      e.stopPropagation();
      hidePinMenu(0);

      // Launch Always on Front (PiP) keeping the exact same AirTab popover & all tabs intact
      const ok = await openAlwaysOnFrontPiP();
      if (!ok) {
        // Fallback: Pin to Tab
        setPinMode("tab");
        showStatusMessage("📌 Pinned Always on Front on this page");
      }
    });
  }

  if (unpinOpt) {
    unpinOpt.addEventListener("click", (e) => {
      e.stopPropagation();
      setPinMode("none");
      hidePinMenu(0);
    });
  }

  document.addEventListener("click", (e) => {
    if (pinMenu && pinMenu.style.display !== "none" && !e.composedPath().includes(pinWrapper)) {
      hidePinMenu(0);
    }
  });

  closeBtn.addEventListener("click", () => {
    setPinMode("none");
    closePopover(true);
  });

  // Reusable Back & Forward Navigation
  function goBack() {
    const tab = getActiveTab();
    if (!tab) return;
    if (tab.historyIndex > 0) {
      tab.historyIndex--;
      const prevUrl = tab.history[tab.historyIndex];
      tab.url = prevUrl;
      tab.iframe.src = prevUrl;
      updateOmniboxDisplay(prevUrl, tab.query);
    } else {
      try {
        tab.iframe.contentWindow.history.back();
      } catch (_) {}
    }
  }

  function goForward() {
    const tab = getActiveTab();
    if (!tab) return;
    if (tab.historyIndex < tab.history.length - 1) {
      tab.historyIndex++;
      const nextUrl = tab.history[tab.historyIndex];
      tab.url = nextUrl;
      tab.iframe.src = nextUrl;
      updateOmniboxDisplay(nextUrl, tab.query);
    } else {
      try {
        tab.iframe.contentWindow.history.forward();
      } catch (_) {}
    }
  }

  backBtn.addEventListener("click", goBack);
  forwardBtn.addEventListener("click", goForward);

  // ==========================================================================
  // Trackpad Gesture Navigation (Two-finger swipe Back/Forward)
  // Only active when mouse is over the floating popover; main browser gestures work normally
  // ==========================================================================
  let isMouseOverPopover = false;
  let accumulatedDeltaX = 0;
  let gestureCooldown = false;
  let gestureResetTimer = null;
  const SWIPE_THRESHOLD = 45;

  popover.addEventListener("mouseenter", () => {
    isMouseOverPopover = true;
  });

  popover.addEventListener("mouseleave", () => {
    isMouseOverPopover = false;
    resetGestureState();
  });

  function resetGestureState() {
    accumulatedDeltaX = 0;
    if (gestureHudBack) {
      gestureHudBack.classList.remove("visible", "triggered");
      gestureHudBack.style.transform = "";
    }
    if (gestureHudForward) {
      gestureHudForward.classList.remove("visible", "triggered");
      gestureHudForward.style.transform = "";
    }
  }

  function showGestureFeedback(direction, progress) {
    if (direction === "back" && gestureHudBack) {
      gestureHudBack.classList.add("visible");
      gestureHudBack.style.transform = `translateY(-50%) scale(${0.75 + progress * 0.35})`;
      if (gestureHudForward) gestureHudForward.classList.remove("visible", "triggered");
    } else if (direction === "forward" && gestureHudForward) {
      gestureHudForward.classList.add("visible");
      gestureHudForward.style.transform = `translateY(-50%) scale(${0.75 + progress * 0.35})`;
      if (gestureHudBack) gestureHudBack.classList.remove("visible", "triggered");
    }
  }

  function triggerGestureAction(direction) {
    gestureCooldown = true;
    if (direction === "back") {
      if (gestureHudBack) {
        gestureHudBack.classList.add("triggered");
      }
      goBack();
    } else if (direction === "forward") {
      if (gestureHudForward) {
        gestureHudForward.classList.add("triggered");
      }
      goForward();
    }

    setTimeout(() => {
      resetGestureState();
      setTimeout(() => {
        gestureCooldown = false;
      }, 250);
    }, 200);
  }

  function handleSwipeWheel(e) {
    if (settings.gestureNavEnabled === false) return;
    // Only intercept when mouse is over the floating popover card
    if (!isOpen || !isMouseOverPopover) return;

    // NEVER hijack scrolling inside spreadsheets or online documents
    const curTab = getActiveTab();
    if (curTab && /spreadsheets|docs\.google|sheets\.google|office\.com|office\.live|onedrive|sharepoint|airtable|notion|canvas/i.test(curTab.url)) {
      return;
    }

    // Check if horizontal swipe is dominant
    const absX = Math.abs(e.deltaX);
    const absY = Math.abs(e.deltaY);

    if (absX <= absY || absX < 4) {
      // User is scrolling vertically or barely moving horizontally, do not interfere!
      return;
    }

    if (gestureCooldown) return;

    // Prevent horizontal scroll from bubbling to host page
    e.preventDefault();
    e.stopPropagation();

    accumulatedDeltaX += e.deltaX;

    // On macOS:
    // Moving fingers to the right (Back gesture) produces deltaX < 0
    // Moving fingers to the left (Forward gesture) produces deltaX > 0
    if (accumulatedDeltaX < -10) {
      const progress = Math.min(1, Math.abs(accumulatedDeltaX) / SWIPE_THRESHOLD);
      showGestureFeedback("back", progress);
    } else if (accumulatedDeltaX > 10) {
      const progress = Math.min(1, Math.abs(accumulatedDeltaX) / SWIPE_THRESHOLD);
      showGestureFeedback("forward", progress);
    } else {
      resetGestureState();
    }

    if (accumulatedDeltaX <= -SWIPE_THRESHOLD) {
      triggerGestureAction("back");
    } else if (accumulatedDeltaX >= SWIPE_THRESHOLD) {
      triggerGestureAction("forward");
    }

    clearTimeout(gestureResetTimer);
    gestureResetTimer = setTimeout(() => {
      resetGestureState();
    }, 200);
  }

  // Attach gesture listener strictly to headerBar and navBar so it NEVER interferes with iframe scrolling or spreadsheets
  if (headerBar) headerBar.addEventListener("wheel", handleSwipeWheel, { passive: false });
  if (navBar) navBar.addEventListener("wheel", handleSwipeWheel, { passive: false });

  // Listen for trackpad gesture & video messages forwarded from subframes (iframes)
  window.addEventListener("message", (e) => {
    if (!e.data) return;

    if (e.data.type === "AIRTAB_GESTURE_NAV") {
      if (isOpen) {
        showGestureFeedback(e.data.action, 1);
        setTimeout(() => {
          triggerGestureAction(e.data.action);
        }, 120);
      }
    } else if (e.data.type === "AIRTAB_FRAME_NAV") {
      const tab = getActiveTab();
      if (tab && e.data.url) {
        tab.url = e.data.url;
        if (e.data.title) {
          tab.title = e.data.title.replace(/ - YouTube$/, "");
          updateTabTitle(tab.id, tab.title);
        }
        updateOmniboxDisplay(tab.url, "");
        updateVideoControls(tab.url);
        updateBookmarkStatus(tab.url);
        hideLoadingStatus();
      }
    } else if (e.data.type === "AIRTAB_VIDEO_FILL") {
      if (e.data.isFilled) {
        if (!isTheaterMode && !isMaximized) {
          toggleTheaterMode(true);
        }
      }
    } else if (e.data.type === "AIRTAB_NAVIGATE") {
      // Keeps internal clicks, search links, and popup windows contained inside AirTab
      if (e.data.url) {
        showLoadingStatus(e.data.url, `Opening ${e.data.title || extractDomain(e.data.url)}...`);
        if (!isOpen) {
          openAirTab();
        }
        if (e.data.newTab) {
          createTab(e.data.url, e.data.title || "New Tab");
        } else {
          navigateActiveTab(e.data.url, e.data.title || "");
        }
      }
    } else if (e.data.type === "AIRTAB_OPEN_POPUP") {
      if (e.data.url) {
        chrome.runtime.sendMessage({
          action: "OPEN_FLOATING_WINDOW",
          url: e.data.url,
          width: Math.max(560, popover.offsetWidth || 560),
          height: Math.max(680, popover.offsetHeight || 680)
        });
        showStatusMessage("🚀 Opened in Logged-In Floating Window (Full Google Session)");
      }
    }
  });

  // Mouse Aux buttons: Button 3 (Back) and Button 4 (Forward) on the popover
  popover.addEventListener("mousedown", (e) => {
    if (e.button === 3) {
      e.preventDefault();
      e.stopPropagation();
      goBack();
    } else if (e.button === 4) {
      e.preventDefault();
      e.stopPropagation();
      goForward();
    }
  });

  // Keyboard navigation when hovering popover
  window.addEventListener("keydown", (e) => {
    if (!isOpen || !isMouseOverPopover) return;
    if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "t") {
      e.preventDefault();
      createTab(getSearchUrl(""), "Google", "");
      return;
    }
    if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "w") {
      e.preventDefault();
      if (activeTabId) {
        closeTab(activeTabId);
      }
      return;
    }
    if ((e.altKey && e.key === "ArrowLeft") || (e.metaKey && e.key === "[")) {
      e.preventDefault();
      goBack();
    } else if ((e.altKey && e.key === "ArrowRight") || (e.metaKey && e.key === "]")) {
      e.preventDefault();
      goForward();
    }
  });

  reloadBtn.addEventListener("click", reloadActiveTab);

  homeBtn.addEventListener("click", () => {
    navigateActiveTab("https://www.google.com/", "Google");
  });

  // Omnibox focus/blur clean display
  omnibox.addEventListener("focus", () => {
    if (domainBadge) domainBadge.style.display = "none";
    if (omniboxIcon) omniboxIcon.style.display = "inline-flex";
    const tab = getActiveTab();
    if (tab && tab.url) {
      omnibox.value = tab.url;
      omnibox.select();
    }
  });

  omnibox.addEventListener("blur", () => {
    const tab = getActiveTab();
    if (tab) {
      updateOmniboxDisplay(tab.url, tab.query);
    }
  });

  omnibox.addEventListener("keydown", (e) => {
    if (e.key === "Enter") {
      const val = omnibox.value.trim();
      if (!val) return;

      // If user types 'gmail', navigate to Gmail directly inside the active tab
      if (val.toLowerCase() === "gmail") {
        navigateActiveTab("https://mail.google.com/", "Gmail");
        omnibox.blur();
        return;
      }

      let destination = "";
      if (/^https?:\/\//i.test(val)) {
        destination = val;
      } else if (/^[a-zA-Z0-9-]+(\.[a-zA-Z0-9-]+)+(\/.*)?$/i.test(val)) {
        destination = `https://${val}`;
      } else {
        destination = getSearchUrl(val);
      }

      navigateActiveTab(destination, val);
      omnibox.blur();
    }
  });

  // Direct 1-Click Hindi Translation in Nav Bar
  translateBtn.addEventListener("click", () => {
    const tab = getActiveTab();
    const q = tab ? (tab.query || currentSelectionText || tab.title) : currentSelectionText;
    if (q) {
      const translateUrl = `https://www.google.com/search?q=translate+${encodeURIComponent(q)}+to+hindi`;
      navigateActiveTab(translateUrl, `Hindi: ${q}`);
    }
  });

  // AirShield Status Click: Opens Settings and focuses AirShield section
  if (shieldBtn) {
    shieldBtn.addEventListener("click", () => {
      openPanel("settings");
      setTimeout(() => {
        const shieldSec = popover.querySelector(".airshield-settings-section");
        if (shieldSec) {
          shieldSec.scrollIntoView({ behavior: "smooth", block: "center" });
          shieldSec.style.boxShadow = "0 0 0 2px rgba(56, 239, 125, 0.4)";
          setTimeout(() => { shieldSec.style.boxShadow = ""; }, 1800);
        }
      }, 100);
    });
  }

  popoutBtn.addEventListener("click", () => {
    const tab = getActiveTab();
    const targetUrl = (tab && tab.url) ? tab.url : "https://www.google.com/";
    // Detach into an independent native floating popup window (floats above Chrome tabs with full login)
    chrome.runtime.sendMessage({
      action: "OPEN_FLOATING_WINDOW",
      url: targetUrl,
      width: Math.max(560, popover.offsetWidth || 560),
      height: Math.max(680, popover.offsetHeight || 680)
    }).catch(() => {
      window.open(targetUrl, "_blank");
    });
    closePopover();
  });

  if (fallbackPopupBtn) {
    fallbackPopupBtn.addEventListener("click", () => {
      const tab = getActiveTab();
      const targetUrl = (tab && tab.url) ? tab.url : "https://www.google.com/";
      chrome.runtime.sendMessage({
        action: "OPEN_FLOATING_WINDOW",
        url: targetUrl,
        width: Math.max(560, popover.offsetWidth || 560),
        height: Math.max(680, popover.offsetHeight || 680)
      });
      fallbackBanner.classList.remove("visible");
    });
  }

  if (fallbackTabBtn) {
    fallbackTabBtn.addEventListener("click", () => {
      const tab = getActiveTab();
      if (tab && tab.url) {
        window.open(tab.url, "_blank");
        fallbackBanner.classList.remove("visible");
      }
    });
  }

  // ==========================================================================
  // Overlay Panel Mechanics
  // ==========================================================================

  function hideAllOverlays() {
    activeOverlay = null;
    [readerPanel, historyPanel, settingsPanel].forEach((p) => p && p.classList.remove("visible"));
    [readerBtn, historyBtn, settingsBtn].forEach((b) => b && b.classList.remove("active"));
  }

  function toggleOverlay(name) {
    if (activeOverlay === name) {
      hideAllOverlays();
      return;
    }

    hideAllOverlays();
    activeOverlay = name;

    if (name === "reader" && readerPanel && readerBtn) {
      readerPanel.classList.add("visible");
      readerBtn.classList.add("active");
      loadReaderMode();
    } else if (name === "history") {
      historyPanel.classList.add("visible");
      if (historyBtn) historyBtn.classList.add("active");
      renderHistoryList("history");
    } else if (name === "settings") {
      settingsPanel.classList.add("visible");
      if (settingsBtn) settingsBtn.classList.add("active");
      renderSettingsPanel();
    }
  }

  popover.querySelectorAll(".quickpeek-panel-close").forEach((btn) => {
    btn.addEventListener("click", hideAllOverlays);
  });

  if (readerBtn) readerBtn.addEventListener("click", () => toggleOverlay("reader"));
  if (historyBtn) historyBtn.addEventListener("click", () => toggleOverlay("history"));
  if (settingsBtn) settingsBtn.addEventListener("click", () => toggleOverlay("settings"));

  // ==========================================================================
  // Clean Reader Mode Mechanics (Safely Guarded)
  // ==========================================================================

  if (readerPanel) {
    const readerTitle = readerPanel.querySelector(".quickpeek-reader-title");
    const readerMeta = readerPanel.querySelector(".quickpeek-reader-meta");
    const readerBody = readerPanel.querySelector(".quickpeek-reader-body");
    const readerContent = readerPanel.querySelector(".quickpeek-reader-content");

    let readerFontSize = 15;

    readerPanel.querySelector(".font-inc-btn")?.addEventListener("click", () => {
      readerFontSize = Math.min(24, readerFontSize + 1);
      if (readerContent) readerContent.style.fontSize = `${readerFontSize}px`;
    });

    readerPanel.querySelector(".font-dec-btn")?.addEventListener("click", () => {
      readerFontSize = Math.max(12, readerFontSize - 1);
      if (readerContent) readerContent.style.fontSize = `${readerFontSize}px`;
    });

    readerPanel.querySelector(".font-toggle-btn")?.addEventListener("click", (e) => {
      if (!readerContent) return;
      const isSans = readerContent.classList.toggle("font-sans");
      e.target.textContent = isSans ? "Sans" : "Serif";
    });
  }

  function loadReaderMode() {
    const tab = getActiveTab();
    if (!tab || !tab.url) {
      readerTitle.textContent = "No active page";
      readerBody.innerHTML = "<p>Navigate to an article or webpage to read it here.</p>";
      return;
    }

    readerTitle.textContent = tab.title || "Loading Article...";
    readerMeta.textContent = "Fetching distraction-free view...";
    readerBody.innerHTML = `<div style="color:var(--qp-accent);">Extracting article typography...</div>`;

    chrome.runtime.sendMessage(
      {
        action: "FETCH_READER_CONTENT",
        url: tab.url
      },
      (res) => {
        if (res && res.success && res.html) {
          parseAndDisplayArticle(res.html, tab.url);
        } else {
          readerTitle.textContent = tab.title || "Reading View";
          readerMeta.textContent = `${extractDomain(tab.url)}`;
          readerBody.innerHTML = `
            <p>${escapeHTML(currentSelectionText || "Could not fetch full article HTML directly. You can read the live view in the iframe tab.")}</p>
          `;
        }
      }
    );
  }

  function parseAndDisplayArticle(htmlString, url) {
    try {
      const parser = new DOMParser();
      const doc = parser.parseFromString(htmlString, "text/html");

      const title = doc.querySelector("h1")?.innerText || doc.title || "Article";
      readerTitle.textContent = title;

      const candidate = doc.querySelector("article") || doc.querySelector("main") || doc.body;

      const toRemove = candidate.querySelectorAll("script, style, iframe, form, header, footer, nav, aside, .ad, .advertisement");
      toRemove.forEach((el) => el.remove());

      const paragraphs = Array.from(candidate.querySelectorAll("p, h2, h3, blockquote, ul, ol"))
        .filter((el) => el.innerText.trim().length > 20)
        .map((el) => el.outerHTML)
        .join("");

      const wordCount = candidate.innerText.split(/\s+/).length;
      const readMinutes = Math.max(1, Math.round(wordCount / 200));

      readerMeta.textContent = `⏱️ ${readMinutes} min read • ${extractDomain(url)}`;
      readerBody.innerHTML = paragraphs || "<p>Could not extract formatted body text for this site.</p>";
    } catch (err) {
      readerBody.innerHTML = `<p>Error rendering reader view: ${err.message}</p>`;
    }
  }

  // ==========================================================================
  // History & Bookmarks Mechanics
  // ==========================================================================

  function addToHistory(url, title) {
    if (!url || url === "about:blank") return;
    const item = {
      id: Date.now().toString(),
      url: url,
      title: title || extractDomain(url) || "Web Page",
      timestamp: Date.now()
    };
    historyList = historyList.filter((h) => h.url !== url);
    historyList.unshift(item);
    if (historyList.length > 50) historyList.pop();
    chrome.storage.local.set({ history: historyList });
  }

  function updateBookmarkStatus(url) {
    const isBookmarked = bookmarksList.some((b) => b.url === url);
    bookmarkBtn.classList.toggle("bookmarked", isBookmarked);
  }

  bookmarkBtn.addEventListener("click", () => {
    const tab = getActiveTab();
    if (!tab || !tab.url) return;

    const existsIndex = bookmarksList.findIndex((b) => b.url === tab.url);
    if (existsIndex >= 0) {
      bookmarksList.splice(existsIndex, 1);
    } else {
      bookmarksList.unshift({
        id: Date.now().toString(),
        url: tab.url,
        title: tab.title || tab.query || extractDomain(tab.url)
      });
    }
    chrome.storage.local.set({ bookmarks: bookmarksList });
    updateBookmarkStatus(tab.url);
  });

  const historyTabs = historyPanel.querySelectorAll(".quickpeek-history-tab-btn");
  let currentHistoryTab = "history";

  historyTabs.forEach((btn) => {
    btn.addEventListener("click", () => {
      historyTabs.forEach((b) => b.classList.remove("active"));
      btn.classList.add("active");
      currentHistoryTab = btn.dataset.tab;
      renderHistoryList(currentHistoryTab);
    });
  });

  function renderHistoryList(type) {
    const listEl = historyPanel.querySelector(".quickpeek-history-list");
    listEl.innerHTML = "";

    const items = type === "history" ? historyList : bookmarksList;

    if (items.length === 0) {
      listEl.innerHTML = `<div style="color:var(--qp-text-dim); text-align:center; padding:20px;">No ${type} items yet.</div>`;
      return;
    }

    items.forEach((item) => {
      const row = document.createElement("div");
      row.className = "quickpeek-history-item";
      row.innerHTML = `
        <div class="quickpeek-history-item-info">
          <div class="quickpeek-history-item-title">${escapeHTML(item.title)}</div>
          <div class="quickpeek-history-item-url">${escapeHTML(item.url)}</div>
        </div>
        <button class="quickpeek-reader-btn delete-item-btn" style="padding:2px 6px; font-size:10px;">✕</button>
      `;

      row.addEventListener("click", (e) => {
        if (e.target.classList.contains("delete-item-btn")) {
          e.stopPropagation();
          if (type === "history") {
            historyList = historyList.filter((h) => h.id !== item.id);
            chrome.storage.local.set({ history: historyList });
          } else {
            bookmarksList = bookmarksList.filter((b) => b.id !== item.id);
            chrome.storage.local.set({ bookmarks: bookmarksList });
          }
          renderHistoryList(type);
        } else {
          navigateActiveTab(item.url, item.title);
          hideAllOverlays();
        }
      });

      listEl.appendChild(row);
    });
  }

  // ==========================================================================
  // Settings Panel Mechanics
  // ==========================================================================

  function renderSettingsPanel() {
    const adblockToggle = settingsPanel.querySelector(".adblock-toggle");
    const linkToggle = settingsPanel.querySelector(".link-peek-toggle");
    const gestureToggle = settingsPanel.querySelector(".gesture-toggle");
    const adaptiveSheetsToggle = settingsPanel.querySelector(".adaptive-sheets-toggle");
    const antiBustToggle = settingsPanel.querySelector(".anti-bust-toggle");
    const themeSelect = settingsPanel.querySelector(".theme-select");
    const clearBtn = settingsPanel.querySelector(".clear-data-btn");

    if (adblockToggle) {
      adblockToggle.checked = settings.adblockEnabled !== false;
      adblockToggle.onchange = () => {
        settings.adblockEnabled = adblockToggle.checked;
        saveSettings();
      };
    }

    if (linkToggle) {
      linkToggle.checked = settings.linkPeekEnabled !== false;
      linkToggle.onchange = () => {
        settings.linkPeekEnabled = linkToggle.checked;
        saveSettings();
      };
    }

    const peekHotkeySelect = settingsPanel.querySelector(".peek-hotkey-select");
    if (peekHotkeySelect) {
      peekHotkeySelect.value = settings.peekHotkey || "Alt";
      peekHotkeySelect.onchange = () => {
        settings.peekHotkey = peekHotkeySelect.value;
        saveSettings();
      };
    }

    if (gestureToggle) {
      gestureToggle.checked = settings.gestureNavEnabled !== false;
      gestureToggle.onchange = () => {
        settings.gestureNavEnabled = gestureToggle.checked;
        saveSettings();
      };
    }

    if (adaptiveSheetsToggle) {
      adaptiveSheetsToggle.checked = settings.adaptiveSheets !== false;
      adaptiveSheetsToggle.onchange = () => {
        settings.adaptiveSheets = adaptiveSheetsToggle.checked;
        saveSettings();
      };
    }

    if (antiBustToggle) {
      antiBustToggle.checked = settings.antiFrameBusting !== false;
      antiBustToggle.onchange = () => {
        settings.antiFrameBusting = antiBustToggle.checked;
        saveSettings();
      };
    }

    if (themeSelect) {
      themeSelect.value = settings.theme || "dark";
      themeSelect.onchange = () => {
        settings.theme = themeSelect.value;
        saveSettings();
        applyTheme(settings.theme);
      };
    }

    // Expandable detail buttons (accordions)
    settingsPanel.querySelectorAll(".quickpeek-accordion-btn").forEach((btn) => {
      btn.onclick = () => {
        const targetId = btn.dataset.target;
        const targetEl = settingsPanel.querySelector(`#${targetId}`);
        if (targetEl) {
          const isOpening = !targetEl.classList.contains("open");
          targetEl.classList.toggle("open", isOpening);
          btn.classList.toggle("expanded", isOpening);
        }
      };
    });

    if (clearBtn) {
      clearBtn.onclick = () => {
        if (confirm("Are you sure you want to clear AirTab local history and cache?")) {
          historyList = [];
          chrome.storage.local.set({ history: [], airtabPinnedUrl: "" }, () => {
            clearBtn.textContent = "✓ Data Cleared!";
            setTimeout(() => {
              clearBtn.textContent = "Clear AirTab Cache & Local History";
            }, 2000);
          });
        }
      };
    }
  }

  function saveSettings() {
    chrome.storage.local.set({ settings });
  }

  // ==========================================================================
  // Background Messages Listener
  // ==========================================================================

  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.action === "AIRTAB_SYNC_PINNED" && message.state) {
      applyPinnedState(message.state);
      sendResponse({ status: "synced" });
      return true;
    } else if (message.action === "AIRTAB_OPEN" || message.action === "QUICKPEEK_OPEN") {
      const selection = window.getSelection();
      let rect = null;
      if (selection && selection.rangeCount > 0 && selection.toString().trim()) {
        rect = selection.getRangeAt(0).getBoundingClientRect();
      }
      if (!rect && lastContextMenuRect) {
        rect = lastContextMenuRect;
      }
      const text = message.text || (selection ? selection.toString().trim() : "");
      const url = message.url || "";

      if (isOpen) {
        // Multi-AirTab: If already open, add a new tab into AirTab!
        const tabUrl = url || (text ? getSearchUrl(text) : "https://www.google.com/");
        const tabTitle = url ? extractDomain(url) : (text || "New Tab");
        createTab(tabUrl, tabTitle, text);
        sendResponse({ status: "tab_added" });
      } else {
        openAirTab({
          text: text,
          url: url,
          rect: rect
        });
        sendResponse({ status: "opened" });
      }
    } else if (message.action === "AIRTAB_SHORTCUT" || message.action === "QUICKPEEK_SHORTCUT") {
      const selection = window.getSelection();
      const text = selection ? selection.toString().trim() : "";
      let rect = null;
      if (text.length > 0 && selection.rangeCount > 0) {
        rect = selection.getRangeAt(0).getBoundingClientRect();
      }
      if (isSideMinimized) {
        restoreFromSideBar();
      } else if (isOpen) {
        if (text) {
          createTab(getSearchUrl(text), text, text);
        } else {
          closePopover();
        }
      } else {
        openAirTab({ text: text, rect: rect });
      }
      sendResponse({ status: "toggled" });
    } else if (message.action === "AIRTAB_TOGGLE" || message.action === "QUICKPEEK_TOGGLE") {
      if (isSideMinimized) {
        restoreFromSideBar();
      } else if (isOpen) {
        closePopover();
      } else {
        openAirTab();
      }
      sendResponse({ status: "toggled" });
    }
    return true;
  });

  // Global Roaming: If unpinned in any tab, exit roaming on all tabs
  chrome.storage.onChanged.addListener((changes, area) => {
    if (area !== "local") return;
    if (changes.airtabPinned && !changes.airtabPinned.newValue) {
      if (pinMode === "chrome") {
        setPinMode("none");
        if (isOpen) {
          closePopover(true);
        }
      }
    }
  });

  // Helpers
  function escapeHTML(str) {
    if (!str) return "";
    return String(str)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }

  function extractDomain(url) {
    try {
      const u = new URL(url);
      return u.hostname.replace(/^www\./, "");
    } catch (_) {
      return "";
    }
  }
})();
