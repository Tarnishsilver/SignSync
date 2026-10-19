/**
 * SignTube Popup Script
 * Controls the extension popup UI and communicates with content script
 */

document.addEventListener('DOMContentLoaded', () => {
  const btnToggle = document.getElementById('btn-toggle');
  const btnToggleText = document.getElementById('btn-toggle-text');
  const btnIcon = btnToggle.querySelector('.btn-icon');
  const statusBadge = document.getElementById('status-badge');
  const statusText = document.getElementById('status-text');
  const selPosition = document.getElementById('sel-position');
  const rangeSpeed = document.getElementById('range-speed');
  const speedLabel = document.getElementById('speed-label');
  const chkFingerspell = document.getElementById('chk-fingerspell');
  const infoWord = document.getElementById('info-word');

  // ─── Get current status ───
  function updateStatus() {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (!tabs[0] || !tabs[0].url.includes('youtube.com/watch')) {
        setInactive('Not on YouTube');
        return;
      }

      chrome.tabs.sendMessage(tabs[0].id, { type: 'get-status' }, (response) => {
        if (chrome.runtime.lastError || !response) {
          setInactive('Not loaded');
          return;
        }

        if (response.active) {
          setActive();
          infoWord.textContent = response.currentWord || '—';
          if (response.position) selPosition.value = response.position;
        } else {
          setInactive('Inactive');
        }
      });
    });
  }

  function setActive() {
    statusBadge.className = 'status-badge status-active';
    statusText.textContent = 'Active';
    btnToggle.classList.add('active');
    btnToggleText.textContent = 'Disable Avatar';
    btnIcon.textContent = '⏹';
  }

  function setInactive(msg) {
    statusBadge.className = 'status-badge status-inactive';
    statusText.textContent = msg || 'Inactive';
    btnToggle.classList.remove('active');
    btnToggleText.textContent = 'Enable Avatar';
    btnIcon.textContent = '▶';
    infoWord.textContent = '—';
  }

  // ─── Toggle avatar ───
  btnToggle.addEventListener('click', () => {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (!tabs[0]) return;

      if (!tabs[0].url.includes('youtube.com/watch')) {
        setInactive('Open a YouTube video first');
        return;
      }

      chrome.tabs.sendMessage(tabs[0].id, { type: 'toggle-avatar' }, (response) => {
        if (chrome.runtime.lastError) {
          setInactive('Extension not loaded. Refresh the page.');
          return;
        }
        if (response && response.active) {
          setActive();
        } else {
          setInactive();
        }
      });
    });
  });

  // ─── Position change ───
  selPosition.addEventListener('change', () => {
    sendToContent({ type: 'set-position', position: selPosition.value });
  });

  // ─── Speed change ───
  rangeSpeed.addEventListener('input', () => {
    const val = parseInt(rangeSpeed.value);
    speedLabel.textContent = val + 'ms';
    sendToContent({
      type: 'set-speed',
      signDuration: val,
      letterDuration: Math.round(val * 0.57) // letter speed is ~57% of word speed
    });
  });

  // ─── Fingerspelling toggle ───
  chkFingerspell.addEventListener('change', () => {
    sendToContent({ type: 'set-fingerspelling', enabled: chkFingerspell.checked });
  });

  // ─── Helper: send message to content script ───
  function sendToContent(msg) {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (tabs[0]) {
        chrome.tabs.sendMessage(tabs[0].id, msg);
      }
    });
  }

  // ─── Periodic status update ───
  updateStatus();
  setInterval(updateStatus, 2000);
});
