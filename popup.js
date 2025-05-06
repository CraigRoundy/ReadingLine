document.getElementById('saveSettings').addEventListener('click', () => {
    const lineWidth = document.getElementById('lineWidth').value;
    const lineColor = document.getElementById('lineColor').value;

    chrome.storage.sync.set({ lineWidth, lineColor }, () => {
        alert('Settings saved!');
    });
});