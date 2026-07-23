// Content script for parsing job boards

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'EXTRACT_JOB') {
    const jobData = extractJobData();
    if (!jobData) {
      sendResponse({ success: false, error: 'Could not extract job data from this page.' });
      return true;
    }

    // Send to background script to push to API
    chrome.runtime.sendMessage({ action: 'INGEST_JOB', payload: jobData }, (response) => {
      sendResponse(response);
    });
    
    return true; // Keep message channel open for async response
  }
});

function extractJobData() {
  const url = window.location.href;
  
  // Basic heuristic for MVP (LinkedIn / Indeed)
  let title = document.querySelector('h1')?.innerText;
  if (!title) {
    const ogTitle = document.querySelector('meta[property="og:title"]')?.getAttribute('content');
    title = ogTitle || document.title;
  }

  // Very naive extraction for MVP
  const company = "Unknown Company"; 
  const location = "Remote / Unknown";

  // Check if this looks like an application success page
  const isApplied = url.includes('post-apply') || document.body.innerText.includes('Application submitted');

  return {
    url,
    title: title.trim(),
    company,
    location,
    status: isApplied ? 'applied' : 'viewed'
  };
}
