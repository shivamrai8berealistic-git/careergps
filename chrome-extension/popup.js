document.addEventListener('DOMContentLoaded', () => {
  const btnLogin = document.getElementById('btn-login');
  const btnCapture = document.getElementById('btn-capture');
  const authSection = document.getElementById('auth-section');
  const captureSection = document.getElementById('capture-section');
  const statusDot = document.getElementById('status-dot');
  const statusText = document.getElementById('status-text');
  const captureMsg = document.getElementById('capture-msg');

  // Check auth state from storage
  chrome.storage.local.get(['cpToken'], (result) => {
    if (result.cpToken) {
      statusDot.classList.add('connected');
      statusText.textContent = 'Linked to Career Pilot AI';
      authSection.classList.add('hidden');
      captureSection.classList.remove('hidden');
    }
  });

  btnLogin.addEventListener('click', () => {
    chrome.tabs.create({ url: 'http://localhost:3000/dashboard' });
  });

  btnCapture.addEventListener('click', async () => {
    btnCapture.disabled = true;
    btnCapture.textContent = 'Capturing...';
    
    // Get the active tab
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    
    if (tab && tab.id) {
      // Send message to content script to extract job
      chrome.tabs.sendMessage(tab.id, { action: 'EXTRACT_JOB' }, (response) => {
        if (chrome.runtime.lastError) {
          captureMsg.textContent = 'Cannot capture this page.';
          captureMsg.style.color = '#ef4444';
          captureMsg.classList.remove('hidden');
          btnCapture.disabled = false;
          btnCapture.textContent = 'Capture Current Job';
          return;
        }

        if (response && response.success) {
          captureMsg.textContent = 'Job captured to Memory!';
          captureMsg.style.color = '#10b981';
          captureMsg.classList.remove('hidden');
          setTimeout(() => window.close(), 2000);
        } else {
          captureMsg.textContent = response?.error || 'Failed to capture.';
          captureMsg.style.color = '#ef4444';
          captureMsg.classList.remove('hidden');
          btnCapture.disabled = false;
          btnCapture.textContent = 'Capture Current Job';
        }
      });
    }
  });
});
