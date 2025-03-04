let currentWidth = 100;

chrome.action.onClicked.addListener((tab) => {
  console.log("Extension icon clicked for tab:", tab.id);

  if (tab.url && tab.url.startsWith('chrome://')) {
    console.error("Cannot inject into chrome:// pages");
    return;
  }

  chrome.scripting.executeScript({
    target: { tabId: tab.id },
    files: ["content.js"]
  }).then(() => {
    console.log("Content script injected successfully");
    chrome.tabs.sendMessage(tab.id, { action: "toggle" }, (response) => {
      if (chrome.runtime.lastError) {
        console.error("Toggle message failed:", chrome.runtime.lastError.message);
      } else {
        console.log("Toggle message sent successfully, response:", response);
      }
    });
  }).catch((err) => {
    console.error("Failed to inject content script:", err.message);
  });
});

function updateWidth(width) {
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    if (!tabs[0]) {
      console.error("No active tab found");
      return;
    }
    if (tabs[0].url && tabs[0].url.startsWith('chrome://')) {
      console.error("Cannot update width on chrome:// pages");
      return;
    }

    chrome.scripting.executeScript({
      target: { tabId: tabs[0].id },
      files: ["content.js"]
    }).then(() => {
      chrome.tabs.sendMessage(tabs[0].id, { action: "setWidth", width: width }, (response) => {
        if (chrome.runtime.lastError) {
          console.error("Width update failed:", chrome.runtime.lastError.message);
        } else {
          console.log("Width updated successfully to:", width);
        }
      });
    }).catch((err) => {
      console.error("Failed to inject content script for width update:", err.message);
    });
  });
}

chrome.commands.onCommand.addListener((command) => {
  if (command === "increase-width") {
    currentWidth = Math.min(100, currentWidth + 10);
    updateWidth(currentWidth);
  } else if (command === "decrease-width") {
    currentWidth = Math.max(10, currentWidth - 10);
    updateWidth(currentWidth);
  } else if (command === "toggle-fixed") {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (!tabs[0]) return;
      chrome.scripting.executeScript({
        target: { tabId: tabs[0].id },
        files: ["content.js"]
      }).then(() => {
        chrome.tabs.sendMessage(tabs[0].id, { action: "toggleFixed" }, (response) => {
          if (chrome.runtime.lastError) {
            console.error("Toggle fixed failed:", chrome.runtime.lastError.message);
          } else {
            console.log("Toggle fixed successful, response:", response);
          }
        });
      }).catch((err) => {
        console.error("Failed to inject content script for toggle fixed:", err.message);
      });
    });
  }
});