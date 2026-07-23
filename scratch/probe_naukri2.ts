// Naukri uses different URL patterns for search results vs job details
// The "job-listings" URL is a search results page, not a job detail page
// We need to find the actual JD URL format
import dotenv from 'dotenv';
dotenv.config();

async function main() {
  // Try the direct JD URL format: naukri.com/job-detail/<slug>
  const urls = [
    // Original URL (search results page with job ID embedded)
    'https://www.naukri.com/job-listings-sales-executive-zipaworld-noida-2-to-5-years-240426501793',
    // Try Naukri's JD API format
    'https://www.naukri.com/jobapi/v3/job/240426501793',
  ];

  for (const url of urls) {
    console.log(`\n=== Testing: ${url} ===`);
    try {
      const resp = await fetch(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 16_5 like Mac OS X) AppleWebKit/605.1.15',
          'Accept': 'application/json, text/html',
          'appid': '109',
          'systemid': 'Naukri',
        },
        signal: AbortSignal.timeout(10000),
      });
      console.log(`Status: ${resp.status}`);
      const text = await resp.text();
      console.log(`Length: ${text.length}`);
      
      // Check if it's JSON
      if (text.startsWith('{') || text.startsWith('[')) {
        try {
          const json = JSON.parse(text);
          console.log('JSON response! Keys:', Object.keys(json).slice(0, 15));
          if (json.title || json.jobTitle) {
            console.log(`Title: ${json.title || json.jobTitle}`);
            console.log(`Company: ${json.company || json.companyName}`);
          }
          // Print first 1000 chars for inspection
          console.log('Content:', JSON.stringify(json, null, 2).slice(0, 2000));
        } catch {}
      } else {
        // Check for job title in HTML
        const hasJobData = text.includes('Sales Executive') || text.includes('Zipaworld');
        console.log(`Contains job data: ${hasJobData}`);
        
        // Check __NEXT_DATA__ again
        const nextData = text.match(/<script id="__NEXT_DATA__"[^>]*>([\s\S]*?)<\/script>/);
        if (nextData) {
          const data = JSON.parse(nextData[1]);
          const jd = data?.props?.pageProps?.initialReduxState?.ssr_jdReducer?.jd;
          if (jd && Object.keys(jd).length > 0) {
            console.log('JD data keys:', Object.keys(jd));
            console.log('JD snippet:', JSON.stringify(jd, null, 2).slice(0, 1500));
          } else {
            console.log('JD object is empty - this is likely a search page, not a job detail page');
          }
        }
      }
    } catch (err: any) {
      console.log(`Error: ${err.message}`);
    }
  }
}

main();
