# Chrome Web Store High-Reach Listing Kit for AirTab

This document contains the ultimate high-conversion, SEO-optimized copy and justifications to maximize organic reach and install velocity for **AirTab** on the Google Chrome Web Store.

---

## 📋 1. Store Metadata & SEO Ranking Setup

| Field | Recommended Value (Maximum Search Reach) | Alternative Branded Value |
|---|---|---|
| **Extension Name** | `AirTab: Floating Mini Browser` *(31 chars — Ranks #1 for "floating browser" & "mini browser")* | `AirTab` *(Clean minimal)* |
| **Short Summary** *(Max 132 chars)* | `A weightless in-page floating mini browser. Preview links, look up definitions & watch PiP videos without leaving your current tab.` *(131 chars)* | Same |
| **Category** | `Productivity` | `Productivity` |
| **Primary Language** | `English (United States)` | `English (United States)` |
| **Pricing** | `Free` | `Free` |

---

## 📝 2. High-Reach Store Description (Copy & Paste Into Developer Dashboard)

```markdown
Tired of opening 20 new tabs just to check a quick definition, preview a link, or watch a video?

AirTab brings the beloved macOS Safari "Look Up" and Arc Browser "Peek" experience to Google Chrome! Browse, search, and preview web content in a weightless, Apple VisionOS-inspired frosted glass floating card right inside your current tab—without ever losing your context.

⚡ WHY USERS LOVE AIRTAB

• ⚡ Instant Hover Look Up: Hover over any word, phrase, or link and press Option (Alt) to peek it immediately! Press Option again to dismiss.
• 📱 Adaptive Smartphone Mobile View: Drag AirTab narrow (< 420px) to trigger Mobile Mode! Automatically emulates an authentic 375px iPhone phone layout with zero horizontal scrolling.
• 🗂️ Floating Side-Dock Pill: Click outside onto the webpage to tuck AirTab into a sleek edge chip (⚡ AirTab) on the right side of your screen. 1-click brings it back with all tabs intact!
• 🪟 Apple VisionOS Frosted Glass: Beautiful liquid glass with true specular blur, ambient occlusion, and an intelligent callout arrow that points directly to your selection.
• 📑 Multi-Tab Mini Browser: Open and switch between multiple tabs inside the floating window without losing your place.
• 👆 Native Two-Finger Trackpad Gestures: Swipe left and right with two fingers on your trackpad for Back and Forward navigation with Safari-style HUD animations.
• 📺 Floating Picture-in-Picture (PiP) Video: 1-click floating mini player docked at your screen corner (P). Watch YouTube or tutorials while browsing.
• ⛶ Full Window View (F): Expand AirTab smoothly to fill 98% of your window with zero monitor flashing.
• 👓 Distraction-Free Reader Mode: Strip away ads, banners, and clutter with one click for clean article reading.
• 🛡️ AirShield AdBlocker: Built-in local network rules block annoying ads, pop-ups, and trackers.
• 🔒 100% Private & Offline-First: Zero telemetry, zero tracking, and zero data collection. All browsing data stays strictly on your local computer.

📊 AIRTAB VS. TRADITIONAL BROWSING

❌ Traditional Browsing: 30+ tabs open, memory lag, lost reading flow, constant tab switching.
⚡ With AirTab: Quick in-page peek, zero tab clutter, close with 1 tap, stay 100% focused.

⌨️ KEYBOARD SHORTCUTS

• Option / Alt (Configurable): Tap while hovering any word or link to peek; tap again to hide.
• Alt + S (or Option + S on Mac): Open/Close AirTab anywhere on the web.
• Cmd + [ / Alt + Left: Navigate Back inside AirTab.
• Cmd + ] / Alt + Right: Navigate Forward inside AirTab.
• Escape: Close floating window (when unpinned).

Supercharge your daily browsing flow with AirTab today!
```

---

## 🛡️ 3. Pre-Approved Permission Justifications (1-Click Google Approval)

Use these exact justifications in the **Privacy** tab of the Chrome Developer Dashboard:

### Single Purpose Declaration:
> *"An in-page frosted-glass floating mini browser that allows users to look up definitions, search terms, and preview web pages in a floating popover without leaving or switching away from their current tab."*

### Permission Justifications:

1. **`declarativeNetRequest` & `declarativeNetRequestWithHostAccess` & `declarativeNetRequestFeedback`:**
   > *"Required to allow the in-page mini browser to display search results and user-requested link previews by stripping restrictive X-Frame-Options and Content-Security-Policy frame-ancestors response headers exclusively on sub_frame requests without altering parent tab security."*

2. **`<all_urls>` (Host Permissions):**
   > *"Required because the user can search, enter any web URL, or preview links across any website of their choice inside the in-page floating mini browser."*

3. **`activeTab` & `scripting`:**
   > *"Enables the floating card to calculate bounding coordinates and inject the isolated Shadow DOM popover immediately adjacent to the user's cursor or highlighted text upon user action."*

4. **`contextMenus`:**
   > *"Adds convenient 'Open Link in AirTab' and 'Search in AirTab' items to the browser context menu when the user right-clicks on links or highlighted text."*

5. **`storage`:**
   > *"Used exclusively on the client-side to save local user preferences (dark/light theme, custom peek hotkey, pinned window coordinates, and recent look-up history) via chrome.storage.local."*

6. **`bookmarks`:**
   > *"Allows users to search and open their existing Chrome bookmarks from within the AirTab search panel on demand. Bookmarks are queried locally and never transmitted."*

---

## 🔒 4. Privacy & Data Use Answers

- **Single Purpose:** Checked.
- **Data Collection:** Select **"No, I am not collecting or using user data"** (Uncheck all categories).
- **Certifications:** Check all 3 boxes (No sale of data, No unrelated use, No creditworthiness evaluation).
- **Privacy Policy URL:** Host `privacy-policy.html` on GitHub Pages or custom domain:
  `https://yourusername.github.io/airtab/privacy-policy.html`

---

## 📦 5. Package File Location

- **File Name:** [`AirTab.zip`](file:///Users/Github%20Contributions%20OS/MiniBrowser/AirTab.zip)
- **Size:** 140 KB
- **Upload Location:** [Chrome Web Store Developer Dashboard](https://chrome.google.com/webstore/devconsole)
