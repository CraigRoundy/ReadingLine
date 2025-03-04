console.log("Content script loaded");

(function() {
  let lineActive = false;
  let readingLine = null;
  let initialized = false;
  let lineWidth = 100; // Default width percentage
  let lineFixed = false; // Track fixed position

  if (window.readingLineInitialized) {
    console.log("Content script already initialized, skipping");
    return;
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
      readingLine.style.top = `${e.clientY}px`;
    }
  }

  function init() {
    if (initialized) {
      console.log("Already initialized, skipping");
      return;
    }

    console.log("Initializing reading line extension");
    createReadingLine();

    document.addEventListener('keydown', (e) => {
      console.log("Key pressed:", e.key, "Alt key:", e.altKey, "Ctrl key:", e.ctrlKey);
      if (e.altKey && e.key === 'l') {
        console.log("Alt+L detected, toggling line");
        toggleReadingLine();
      } else if (e.ctrlKey && e.key === 'l') { // Ctrl+L to toggle fixed mode
        console.log("Ctrl+L detected, toggling fixed mode");
        toggleLineFixed();
      }
    });

    document.addEventListener('mousemove', updateLinePosition);

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
      sendResponse({ status: "Width updated", width: lineWidth });
    } else if (message.action === 'toggleFixed') {
      if (!initialized) {
        init();
      }
      toggleLineFixed();
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