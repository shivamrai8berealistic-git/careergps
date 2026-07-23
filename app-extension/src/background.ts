import type { ExtensionMessage } from './shared/types';

// This should point to your web app's domain.
// For development, it's localhost. For production, it would be your deployed URL.
const WEB_APP_URL = 'http://localhost:3000';

chrome.runtime.onMessage.addListener(
  (message: ExtensionMessage, sender, sendResponse) => {
    if (message.type === 'ANALYZE_JOB') {
      console.log('Background script received job to analyze:', message.jobData);
      
      // Encode the job data to be passed as a URL parameter.
      const jobDataString = JSON.stringify(message.jobData);
      const encodedJobData = btoa(jobDataString); // Base64 encode

      // Construct the URL to the web app's import page.
      // Note: The web app needs a page at '/jobs/import' that can handle this data.
      // That page will be responsible for decoding the data, saving the job, and running the analysis.
      const url = `${WEB_APP_URL}/jobs/import?data=${encodeURIComponent(encodedJobData)}`;

      // Open a new tab with the constructed URL.
      chrome.tabs.create({ url });
    }
    
    // Return true to indicate you wish to send a response asynchronously.
    return true; 
  }
);

console.log('CareerPilot AI background script loaded.');
