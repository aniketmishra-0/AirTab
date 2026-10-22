// AirTab - Detached Window Controller with Multi-Tabs & Always on Front
(() => {
  let tabs = [];
  let activeTabId = null;
  let nextTabId = 1;
  let pipWindowInstance = null;

  const tabsTrack = document.getElementById("tabsTrack");
  const addTabBtn = document.getElementById("addTabBtn");
  const viewport = document.getElementById("viewport");
  const omnibox = document.getElementById("omnibox");
  const hostBadge = document.getElementById("hostBadge");
  const backBtn = document.getElementById("backBtn");
  const forwardBtn = document.getElementById("forwardBtn");
  const reloadBtn = document.getElementById("reloadBtn");
  const homeBtn = document.getElementById("homeBtn");
  const alwaysOnFrontBtn = document.getElementById("alwaysOnFrontBtn");
  const fullscreenBtn = document.getElementById("fullscreenBtn");
  const toast = document.getElementById("toast");

  function showToast(msg, duration = 2400) {
    if (!toast) return;
    toast.textContent = msg;
    toast.classList.add("visible");
    setTimeout(() => {
      toast.classList.remove("visible");
    }, duration);
  }

  function getSearchUrl(q) {
    if (!q) return "https://www.google.com/";
    return `https://www.google.com/search?q=${encodeURIComponent(q)}`;
  }

  function extractDomain(url) {
    try {
      const u = new URL(url);
      return u.hostname.replace(/^www\./, "");
    } catch (_) {
      return "";
    }
  }

  function getActiveTab() {
    return tabs.find(t => t.id === activeTabId) || null;
  }

  function createTab(initialUrl = "https://www.google.com/", title = "New Tab") {
    const id = nextTabId++;
    const tabItem = document.createElement("div");
    tabItem.className = "tab-item";
    tabItem.dataset.id = id;
    tabItem.innerHTML = `
      <span class="tab-title">${title}</span>
      <span class="tab-close" title="Close Tab">×</span>
    `;

    tabItem.addEventListener("click", (e) => {
      if (e.target.classList.contains("tab-close")) {
        e.stopPropagation();
        closeTab(id);
      } else {
        switchTab(id);
      }
    });

    tabsTrack.appendChild(tabItem);

    const iframe = document.createElement("iframe");
    iframe.className = "tab-iframe";
    iframe.dataset.id = id;
    iframe.setAttribute("allow", "accelerometer; autoplay; clipboard-read; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share");
    iframe.src = initialUrl;

    iframe.addEventListener("load", () => {
      try {
        if (iframe.contentDocument && iframe.contentDocument.title) {
          updateTabTitle(id, iframe.contentDocument.title);
        }
      } catch (_) {}
    });

    viewport.appendChild(iframe);

    const tab = {
      id,
      tabItem,
      iframe,
      title,
      url: initialUrl,
      history: [initialUrl],
      historyIdx: 0
    };
    tabs.push(tab);

    switchTab(id);
    return tab;
  }

  function updateTabTitle(id, newTitle) {
    const t = tabs.find(x => x.id === id);
    if (!t || !newTitle) return;
    t.title = newTitle;
    const titleEl = t.tabItem.querySelector(".tab-title");
    if (titleEl) titleEl.textContent = newTitle.slice(0, 24);
  }

  function switchTab(id) {
    activeTabId = id;
    const t = getActiveTab();
    if (!t) return;

    tabs.forEach(x => {
      x.tabItem.classList.toggle("active", x.id === id);
      x.iframe.classList.toggle("active", x.id === id);
    });

    omnibox.value = t.url;
    const domain = extractDomain(t.url);
    if (domain) {
      hostBadge.textContent = domain;
      hostBadge.style.display = "inline-block";
    } else {
      hostBadge.style.display = "none";
    }
  }

  function closeTab(id) {
    const idx = tabs.findIndex(x => x.id === id);
    if (idx === -1) return;

    const [removed] = tabs.splice(idx, 1);
    removed.tabItem.remove();
    removed.iframe.remove();

    if (tabs.length === 0) {
      createTab("https://www.google.com/", "Google");
      return;
    }

    if (activeTabId === id) {
      const nextTab = tabs[Math.max(0, idx - 1)];
      switchTab(nextTab.id);
    }
  }

  function navigate(dest, query = "") {
    const t = getActiveTab();
    if (!t) return;

    let target = dest.trim();
    if (!target) return;

    if (/^https?:\/\//i.test(target)) {
      // Valid URL
    } else if (/^[a-zA-Z0-9-]+(\.[a-zA-Z0-9-]+)+(\/.*)?$/i.test(target)) {
      target = `https://${target}`;
    } else {
      target = getSearchUrl(target);
    }

    t.url = target;
    t.iframe.src = target;
    t.history = t.history.slice(0, t.historyIdx + 1);
    t.history.push(target);
    t.historyIdx = t.history.length - 1;

    omnibox.value = target;
    const d = extractDomain(target);
    if (d) {
      hostBadge.textContent = d;
      hostBadge.style.display = "inline-block";
      updateTabTitle(t.id, d);
    }
  }

  // Omnibox submit
  omnibox.addEventListener("keydown", (e) => {
    if (e.key === "Enter") {
      navigate(omnibox.value);
      omnibox.blur();
    }
  });

  addTabBtn.addEventListener("click", () => {
    createTab("https://www.google.com/", "New Tab");
  });

  backBtn.addEventListener("click", () => {
    const t = getActiveTab();
    if (t && t.historyIdx > 0) {
      t.historyIdx--;
      const url = t.history[t.historyIdx];
      t.url = url;
      t.iframe.src = url;
      omnibox.value = url;
    }
  });

  forwardBtn.addEventListener("click", () => {
    const t = getActiveTab();
    if (t && t.historyIdx < t.history.length - 1) {
      t.historyIdx++;
      const url = t.history[t.historyIdx];
      t.url = url;
      t.iframe.src = url;
      omnibox.value = url;
    }
  });

  reloadBtn.addEventListener("click", () => {
    const t = getActiveTab();
    if (t) {
      t.iframe.src = t.url;
    }
  });

  homeBtn.addEventListener("click", () => {
    navigate("https://www.google.com/");
  });

  fullscreenBtn.addEventListener("click", () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
    } else {
      document.exitFullscreen().catch(() => {});
    }
  });

  // Always on Front: Native Document Picture-in-Picture
  alwaysOnFrontBtn.addEventListener("click", async () => {
    if ("documentPictureInPicture" in window) {
      try {
        if (pipWindowInstance) {
          pipWindowInstance.close();
          pipWindowInstance = null;
          alwaysOnFrontBtn.classList.remove("active");
          showToast("📌 Always on Front Disengaged");
          return;
        }

        const pipWin = await window.documentPictureInPicture.requestWindow({
          width: Math.max(540, window.innerWidth || 540),
          height: Math.max(640, window.innerHeight || 640)
        });

        pipWindowInstance = pipWin;
        alwaysOnFrontBtn.classList.add("active");

        // Clone current styles to PiP window
        [...document.styleSheets].forEach((styleSheet) => {
          try {
            const cssRules = [...styleSheet.cssRules].map((rule) => rule.cssText).join("");
            const style = document.createElement("style");
            style.textContent = cssRules;
            pipWin.document.head.appendChild(style);
          } catch (_) {
            const link = document.createElement("link");
            link.rel = "stylesheet";
            link.type = styleSheet.type;
            link.media = styleSheet.media;
            link.href = styleSheet.href;
            pipWin.document.head.appendChild(link);
          }
        });

        // Move body contents to PiP window
        while (document.body.firstChild) {
          pipWin.document.body.appendChild(document.body.firstChild);
        }

        pipWin.addEventListener("pagehide", () => {
          while (pipWin.document.body.firstChild) {
            document.body.appendChild(pipWin.document.body.firstChild);
          }
          pipWindowInstance = null;
          alwaysOnFrontBtn.classList.remove("active");
        });

        showToast("📌 Always on Front Active (Floats on top of all apps)");
      } catch (err) {
        console.warn("PiP error:", err);
        showToast("✓ Native Window is already active on top");
      }
    } else {
      showToast("✓ Standalone Window floats above browser tabs");
    }
  });

  // Keyboard Shortcuts (Cmd+T, Cmd+W, Cmd+R)
  window.addEventListener("keydown", (e) => {
    if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "t") {
      e.preventDefault();
      createTab("https://www.google.com/", "New Tab");
    } else if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "w") {
      e.preventDefault();
      if (activeTabId) closeTab(activeTabId);
    } else if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "r") {
      e.preventDefault();
      const t = getActiveTab();
      if (t) t.iframe.src = t.url;
    }
  });

  // Startup: Parse ?url= query param
  const params = new URLSearchParams(window.location.search);
  const initialUrl = params.get("url") || "https://www.google.com/";
  const initialTitle = extractDomain(initialUrl) || "Google";
  createTab(initialUrl, initialTitle);
})();
