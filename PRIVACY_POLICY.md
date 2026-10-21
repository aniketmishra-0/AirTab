# Privacy Policy for AirTab - Mini Floating Browser

**Effective Date:** October 21, 2026  
**Last Updated:** October 21, 2026

**AirTab - Mini Floating Browser** ("AirTab", "we", "us", or "our") is committed to protecting your privacy. This Privacy Policy details our strict client-side data handling practices, zero-collection policy, and permission justifications for the AirTab Chrome Extension (Manifest V3).

---

## 1. Zero Data Collection & Absolute Privacy

- **Zero Tracking:** We do not track, collect, log, monitor, or store any personal information, search queries, browsing history, keystrokes, or website interactions.
- **Zero External Transmission:** AirTab does not communicate with any external analytics servers, telemetry endpoints, or third-party cloud services.
- **Zero Monetization of Data:** We never sell, rent, monetize, or transfer user data under any circumstances.
- **100% Offline-First Architecture:** All extension features—including user settings, dark/light themes, custom search engines, bookmarks, and local look-up history—operate exclusively within your local machine's isolated browser storage.

---

## 2. Chrome Permissions & Technical Justifications

To deliver an in-page floating mini browser without opening intrusive new browser windows, AirTab requests specific Chrome Extension permissions. Every permission is strictly confined to local client-side execution:

| Permission | Purpose & Technical Justification |
|---|---|
| `declarativeNetRequest` & `declarativeNetRequestWithHostAccess` | Used exclusively to modify response headers (such as removing restrictive `X-Frame-Options` and `Content-Security-Policy: frame-ancestors`) on `sub_frame` requests. This allows user-requested search queries and link previews to render safely inside the in-page floating iframe without breaking or navigating away from the parent tab. |
| `<all_urls>` (Host Permissions) | Essential because the user can search, enter any web address, or preview links across any website of their choosing within the floating mini browser. |
| `activeTab` & `scripting` | Enables the floating Look Up popover to calculate exact screen coordinates next to the user's cursor or highlighted text and display the isolated Shadow DOM popover. |
| `contextMenus` | Adds a convenient right-click menu item (*"Open Link in AirTab"* / *"Search in AirTab"*) when clicking links or selecting text on any page. |
| `storage` | Used strictly to store your personal UI preferences (dark/light theme, custom hotkey, pinned window coordinates, and recent look-up history) locally on your device via `chrome.storage.local`. |
| `bookmarks` | Enables optional quick-access to your existing Chrome bookmarks from within the AirTab search panel. Bookmarks are read locally on demand and are never transmitted externally. |

> **Note on Cookies:** AirTab does **not** request the `cookies` permission. Your browser authentication, login credentials, and session cookies are never accessed, altered, or intercepted by AirTab.

---

## 3. Third-Party Web Content & Embedded Pages

When you use AirTab to perform web searches (e.g. Google Search) or preview web pages (e.g. Wikipedia, GitHub, documentation, or portals):
- You are directly interacting with that third-party website via standard secure HTTPS iframes.
- The destination website's own privacy policy and terms govern your interaction with their content.
- AirTab does not inject ads, does not alter page content, and does not record or intercept any passwords, credentials, or form data entered into previewed sites.

---

## 4. Local Data Retention & User Control

All user-generated local data (such as recent look-up history and saved preferences) is stored inside your browser's local sandbox (`chrome.storage.local`).
- You can clear your look-up history at any time with a single click inside AirTab Settings.
- Uninstalling the AirTab extension instantly and permanently deletes all locally stored preferences and history from your browser.

---

## 5. Google Chrome Web Store Developer Policy Compliance

AirTab is engineered in strict compliance with the **Google Chrome Web Store Developer Program Policies**:
- **Single Purpose Policy:** AirTab fulfills a single, cohesive purpose: providing an in-page floating mini browser to look up definitions, preview links, and search the web without tab-switching.
- **Limited Use Requirements:** All code adheres to Chrome Web Store Limited Use principles. No user data is transferred or leveraged outside of providing the core mini-browser utility.
- **No Remote Code Execution:** 100% of all scripts, styles, rules, and vector assets are bundled directly inside the local extension package. Zero remote scripts (`eval`, external CDN scripts, or dynamic code loading) are executed.
- **Manifest V3 Compliant:** Uses modern, secure Manifest V3 service workers and declarative network rule standards.

---

## 6. Developer Contact & Support

If you have questions, feedback, or inquiries regarding this Privacy Policy, please contact:

- **Developer:** Aniket Mishra
- **Project:** AirTab - Mini Floating Browser
- **GitHub Repository:** [https://github.com/](https://github.com/)
