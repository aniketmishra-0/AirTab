// AirTab - Options Page Script

let currentSettings = {
  theme: "dark",
  linkPeekEnabled: true,
  peekHotkey: "Alt"
};

document.addEventListener("DOMContentLoaded", () => {
  chrome.storage.local.get(["settings"], (res) => {
    if (res.settings) {
      currentSettings = Object.assign(currentSettings, res.settings);
    }
    populateUI();
  });

  document.getElementById("saveBtn").addEventListener("click", () => {
    currentSettings.theme = document.getElementById("theme").value;
    currentSettings.linkPeekEnabled = document.getElementById("linkPeekEnabled").checked;
    currentSettings.peekHotkey = document.getElementById("peekHotkey").value;

    chrome.storage.local.set({ settings: currentSettings }, () => {
      showStatus("✓ Settings saved successfully!");
    });
  });
});

function populateUI() {
  document.getElementById("theme").value = currentSettings.theme || "dark";
  document.getElementById("linkPeekEnabled").checked = currentSettings.linkPeekEnabled !== false;
  document.getElementById("peekHotkey").value = currentSettings.peekHotkey || "Alt";
}

function showStatus(msg, isError = false) {
  const toast = document.getElementById("statusToast");
  toast.textContent = msg;
  toast.style.color = isError ? "#ff453a" : "#30d158";
  setTimeout(() => {
    toast.textContent = "";
  }, 3000);
}
