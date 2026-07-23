// Background service worker

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'SYNC_AUTH') {
    // Received token from the web app
    chrome.storage.local.set({ cpToken: request.token }, () => {
      console.log('Career Pilot Auth Token synced.');
      sendResponse({ success: true });
    });
    return true;
  }

  if (request.action === 'INGEST_JOB') {
    chrome.storage.local.get(['cpToken'], async (result) => {
      if (!result.cpToken) {
        sendResponse({ success: false, error: 'Not authenticated. Please open Command Center.' });
        return;
      }

      try {
        const res = await fetch('http://localhost:3000/api/ingest/job', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${result.cpToken}`
          },
          body: JSON.stringify(request.payload)
        });

        if (res.ok) {
          sendResponse({ success: true });
        } else {
          sendResponse({ success: false, error: 'API rejected the payload.' });
        }
      } catch (e) {
        sendResponse({ success: false, error: 'Network error.' });
      }
    });
    return true; // Async response
  }
});
