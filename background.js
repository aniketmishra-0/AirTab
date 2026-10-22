// AirTab - Background Service Worker (Manifest V3)

const DYNAMIC_SUBFRAME_RULE_ID = 1001;

// Register dynamic declarativeNetRequest rules to guarantee header stripping for all subframes
async function registerHeaderStrippingRules() {
  try {
    await chrome.declarativeNetRequest.updateDynamicRules({
      removeRuleIds: [DYNAMIC_SUBFRAME_RULE_ID],
      addRules: [
        {
          id: DYNAMIC_SUBFRAME_RULE_ID,
          priority: 99999,
          action: {
            type: "modifyHeaders",
            responseHeaders: [
              { header: "x-frame-options", operation: "remove" },
              { header: "content-security-policy", operation: "remove" },
              { header: "content-security-policy-report-only", operation: "remove" },
              { header: "frame-options", operation: "remove" },
              { header: "cross-origin-opener-policy", operation: "remove" },
              { header: "cross-origin-embedder-policy", operation: "remove" },
              { header: "cross-origin-resource-policy", operation: "remove" }
            ]
          },
          condition: {
            resourceTypes: ["sub_frame"]
          }
        }
      ]
    });
    console.log("AirTab: Dynamic declarativeNetRequest sub_frame rules registered successfully.");
  } catch (err) {
    console.error("AirTab: Error registering dynamic rules:", err);
  }
}

// Register dynamic context menu options (Link, Selection, Page)
function setupContextMenus() {
  chrome.contextMenus.removeAll(() => {
    // 1. Right-click on any Link: Direct open link in AirTab
    chrome.contextMenus.create({
      id: "airtab-open-link",
      title: "Open Link in AirTab",
      contexts: ["link"]
    });

    // 2. Right-click on Highlighted / Selected text: Search in AirTab
    chrome.contextMenus.create({
      id: "airtab-lookup-selection",
      title: "Search '%s' in AirTab",
      contexts: ["selection"]
    });

    // 3. Right-click on empty page area or media: Open AirTab launcher
    chrome.contextMenus.create({
      id: "airtab-open-page",
      title: "Open AirTab Floating Browser",
      contexts: ["page", "image", "video", "audio", "frame"]
    });

    // 4. Open in Detached Window (Multi-AirTab Floating Window)
    chrome.contextMenus.create({
      id: "airtab-open-floating",
      title: "Open in Detached Window (Multi-AirTab)",
      contexts: ["link", "page"]
    });
  });
}

chrome.runtime.onInstalled.addListener(() => {
  registerHeaderStrippingRules();
  setupContextMenus();
});

chrome.runtime.onStartup.addListener(() => {
  registerHeaderStrippingRules();
  setupContextMenus();
});

registerHeaderStrippingRules();
setupContextMenus();

// Resilient messaging helper: auto-injects content script if tab was open before extension reload
async function sendOrInject(tab, message) {
  if (!tab || !tab.id) return;
  const url = tab.url || "";

  // Handle Chrome internal or restricted pages
  const isRestricted = (
    url.startsWith("chrome://") ||
    url.startsWith("edge://") ||
    url.startsWith("chrome-extension://") ||
    url.startsWith("about:") ||
    url.startsWith("view-source:") ||
    url.includes("chromewebstore.google.com")
  );

  if (isRestricted) {
    // Only launch standalone popup window on explicit user trigger, NOT on passive sync
    if (message.action !== "AIRTAB_SYNC_PINNED") {
      chrome.windows.create({
        url: message.url || "https://www.google.com/",
        type: "popup",
        width: 520,
        height: 440,
        focused: true
      });
    }
    return;
  }

  try {
    await chrome.tabs.sendMessage(tab.id, message);
  } catch (err) {
    // Content script not present in tab, inject dynamically
    try {
      await chrome.scripting.insertCSS({
        target: { tabId: tab.id },
        files: ["styles.css"]
      });
      await chrome.scripting.executeScript({
        target: { tabId: tab.id },
        files: ["content.js"]
      });
      setTimeout(() => {
        chrome.tabs.sendMessage(tab.id, message).catch((e) => {
          console.warn("AirTab: Message failed after injection:", e);
        });
      }, 120);
    } catch (injectErr) {
      console.warn("AirTab: Could not inject script into tab:", injectErr);
    }
  }
}

// Context menu click listener
chrome.contextMenus.onClicked.addListener((info, tab) => {
  if (!tab || !tab.id) return;

  if (info.menuItemId === "airtab-open-link") {
    sendOrInject(tab, {
      action: "AIRTAB_OPEN",
      url: info.linkUrl || "",
      text: "",
      trigger: "contextMenuLink"
    });
  } else if (info.menuItemId === "airtab-lookup-selection") {
    sendOrInject(tab, {
      action: "AIRTAB_OPEN",
      url: "",
      text: info.selectionText || "",
      trigger: "contextMenuSelection"
    });
  } else if (info.menuItemId === "airtab-open-page") {
    sendOrInject(tab, {
      action: "AIRTAB_OPEN",
      url: "",
      text: "",
      trigger: "contextMenuPage"
    });
  } else if (info.menuItemId === "airtab-open-floating") {
    const targetUrl = info.linkUrl || "https://www.google.com/";
    chrome.windows.create({
      url: targetUrl,
      type: "popup",
      width: 540,
      height: 620,
      focused: true
    });
  }
});

// Purge roaming state when unpinned
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === "AIRTAB_UNPIN_ALL") {
    chrome.storage.local.remove(["airtabPinned", "airtabPinnedMode", "airtabPinnedState", "airtabPinnedUrl"]);
    sendResponse({ status: "unpinned" });
    return true;
  }
});

// Keyboard shortcut listener (Alt+S / Option+S)
chrome.commands.onCommand.addListener((command) => {
  if (command === "open-airtab" || command === "open-quickpeek") {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (tabs && tabs[0]) {
        sendOrInject(tabs[0], {
          action: "AIRTAB_SHORTCUT",
          trigger: "shortcut"
        });
      }
    });
  }
});

// Extension toolbar icon click listener (Guaranteed instant open on ANY tab)
chrome.action.onClicked.addListener((tab) => {
  if (tab) {
    sendOrInject(tab, {
      action: "AIRTAB_TOGGLE",
      trigger: "actionIcon"
    });
  }
});

// Runtime messages from content script
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === "GET_CHROME_BOOKMARKS") {
    if (chrome.bookmarks) {
      chrome.bookmarks.getTree((tree) => {
        try {
          const list = [];
          function walk(nodes) {
            for (const n of nodes) {
              if (n.url && !n.url.startsWith("javascript:")) {
                list.push({ title: n.title || n.url, url: n.url });
              }
              if (n.children) walk(n.children);
            }
          }
          walk(tree);
          sendResponse({ success: true, bookmarks: list.slice(0, 30) });
        } catch (e) {
          sendResponse({ success: false, error: e.message });
        }
      });
      return true;
    } else {
      sendResponse({ success: false, error: "Bookmarks API unavailable" });
      return true;
    }
  }

  // Open detached floating window (Floats above Chrome tab bar & desktop with 100% active Chrome login)
  if (message.action === "OPEN_FLOATING_WINDOW" && message.url) {
    const winOpts = {
      url: message.url,
      type: "popup",
      width: message.width || 560,
      height: message.height || 680,
      focused: true
    };
    if (typeof message.left === "number" && !isNaN(message.left)) winOpts.left = Math.round(message.left);
    if (typeof message.top === "number" && !isNaN(message.top)) winOpts.top = Math.round(message.top);
    chrome.windows.create(winOpts);
    sendResponse({ success: true });
    return true;
  }

  if (message.action === "OPEN_NEW_TAB" && message.url) {
    chrome.tabs.create({ url: message.url });
    sendResponse({ success: true });
    return true;
  }

  // Fetch article HTML for clean distraction-free Reader mode
  if (message.action === "FETCH_READER_CONTENT" && message.url) {
    fetch(message.url, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8"
      }
    })
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.text();
      })
      .then((html) => sendResponse({ success: true, html }))
      .catch((err) => sendResponse({ success: false, error: err.message }));
    return true;
  }

  return false;
});
