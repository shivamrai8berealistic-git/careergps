// Injected into careerpilot.ai to hand off the token seamlessly

// Listen for messages from the web app
window.addEventListener('message', (event) => {
  // Accept only messages from same origin
  if (event.origin !== window.location.origin) return;

  if (event.data && event.data.type === 'CP_AUTH_TOKEN') {
    const token = event.data.token;
    if (token) {
      chrome.runtime.sendMessage({ action: 'SYNC_AUTH', token: token }, (response) => {
        if (chrome.runtime.lastError) {
           // Extension context invalidated or not listening
        }
      });
    }
  }
});
