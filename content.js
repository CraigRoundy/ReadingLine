console.log("Content script loaded");

(function () {
  let lineActive = false;
  let readingLine = null;
  let initialized = false;
  let lineWidth = 100; // Default width percentage
  let lineFixed = false; // Track fixed position
  let lineVerticalOffset = 0; // Vertical offset for fixed mode
  let additionalLines = [];

  if (window.readingLineInitialized) {
    console.log("Content script already initialized, skipping");
    return;
  }

  function addReadingLine() {
    const newLine = document.createElement('div');
    newLine.className = 'reading-line-guide';
    newLine.style.top = '0px';
    document.body.appendChild(newLine);
    additionalLines.push(newLine);
  }

  function createReadingLine() {
    console.log("Creating reading line element");
    readingLine = document.createElement('div');
    readingLine.id = 'reading-line-guide';
    readingLine.style.display = 'none';
    readingLine.style.height = '2px';
    readingLine.style.zIndex = '9999';
    readingLine.style.position = 'fixed';
    readingLine.style.pointerEvents = 'none';
    updateLineWidth();
    document.body.appendChild(readingLine);
    console.log("Reading line created:", readingLine);
  }

  function updateLineWidth() {
    if (readingLine) {
      readingLine.style.width = `${lineWidth}%`;
      readingLine.style.left = `${(100 - lineWidth) / 2}%`;
      console.log("Line width updated to:", lineWidth, "left:", readingLine.style.left);
    }
  }

  function toggleReadingLine() {
    lineActive = !lineActive;
    console.log("Toggling reading line. Active:", lineActive);
    if (readingLine) {
      readingLine.style.display = lineActive ? 'block' : 'none';
      console.log("Reading line display set to:", readingLine.style.display);
    } else {
      console.log("Warning: Reading line element not found, creating now");
      createReadingLine();
      readingLine.style.display = lineActive ? 'block' : 'none';
    }
  }

  function toggleLineFixed() {
    lineFixed = !lineFixed;
    console.log("Line fixed mode toggled. Fixed:", lineFixed);
  }

  function updateLinePosition(e) {
    if (lineActive && readingLine && !lineFixed) {
      requestAnimationFrame(() => {
        readingLine.style.top = `${e.clientY}px`;
      });
    }
  }

  function savePreferences() {
    chrome.storage.sync.set({
      lineWidth,
      lineFixed,
      lineVerticalOffset
    });
  }

  function loadPreferences() {
    chrome.storage.sync.get(['lineWidth', 'lineFixed', 'lineVerticalOffset'], (prefs) => {
      lineWidth = prefs.lineWidth || 100;
      lineFixed = prefs.lineFixed || false;
      lineVerticalOffset = prefs.lineVerticalOffset || 0;
      updateLineWidth();
      if (readingLine) {
        readingLine.style.top = `${lineVerticalOffset}px`;
      }
    });
  }

  document.addEventListener('keydown', (e) => {
    console.log("Key pressed:", e.key, "Alt key:", e.altKey, "Ctrl key:", e.ctrlKey);
    if (e.altKey && e.key === 'l') {
      console.log("Alt+L detected, toggling line");
      toggleReadingLine();
    } else if (e.ctrlKey && e.key === 'l') { // Ctrl+L to toggle fixed mode
      console.log("Ctrl+L detected, toggling fixed mode");
      toggleLineFixed();
    } else if (e.ctrlKey && e.key === 'ArrowUp') {
      lineWidth = Math.min(100, lineWidth + 10);
      updateLineWidth();
      savePreferences();
    } else if (e.ctrlKey && e.key === 'ArrowDown') {
      lineWidth = Math.max(10, lineWidth - 10);
      updateLineWidth();
      savePreferences();
    } else if (lineActive && lineFixed && e.key === 'ArrowUp') {
      lineVerticalOffset = Math.max(0, lineVerticalOffset - 10);
      readingLine.style.top = `${lineVerticalOffset}px`;
      savePreferences();
    } else if (lineActive && lineFixed && e.key === 'ArrowDown') {
      lineVerticalOffset += 10;
      readingLine.style.top = `${lineVerticalOffset}px`;
      savePreferences();
    } else if (e.altKey && e.key === 'a') {
      addReadingLine();
    } else if (e.altKey && e.key === 'v') {
      toggleReadingLine();
    }
  });

  document.addEventListener('mousemove', updateLinePosition);

  function init() {
    if (initialized) {
      console.log("Already initialized, skipping");
      return;
    }

    console.log("Initializing reading line extension");
    loadPreferences();
    createReadingLine();

    initialized = true;
    console.log("Reading line initialization complete");
  }

  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    console.log("Message received in content script:", message);
    if (message.action === 'toggle') {
      if (!initialized) {
        init();
      }
      toggleReadingLine();
      sendResponse({ status: "Line toggled", active: lineActive });
    } else if (message.action === 'setWidth') {
      if (!initialized) {
        init();
      }
      lineWidth = Math.max(10, Math.min(100, message.width));
      updateLineWidth();
      savePreferences();
      sendResponse({ status: "Width updated", width: lineWidth });
    } else if (message.action === 'toggleFixed') {
      if (!initialized) {
        init();
      }
      toggleLineFixed();
      savePreferences();
      sendResponse({ status: "Fixed mode toggled", fixed: lineFixed });
    }
    return true;
  });

  if (document.readyState === 'loading') {
    console.log("Document still loading, adding DOMContentLoaded listener");
    document.addEventListener('DOMContentLoaded', init);
  } else {
    console.log("Document already loaded, initializing immediately");
    init();
  }

  window.readingLineInitialized = true;
  console.log("Content script setup complete");
})();