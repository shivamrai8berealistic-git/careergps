// Extract Naukri's __NEXT_DATA__ job data structure
import dotenv from 'dotenv';
dotenv.config();

async function main() {
  const resp = await fetch('https://www.naukri.com/job-listings-sales-executive-zipaworld-noida-2-to-5-years-240426501793', {
    headers: {
      'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 16_5 like Mac OS X) AppleWebKit/605.1.15',
      'Accept': 'text/html,application/xhtml+xml',
    },
    signal: AbortSignal.timeout(10000),
  });
  const html = await resp.text();
  
  const nextData = html.match(/<script id="__NEXT_DATA__"[^>]*>([\s\S]*?)<\/script>/);
  if (!nextData) {
    console.log('No __NEXT_DATA__');
    return;
  }
  
  const data = JSON.parse(nextData[1]);
  const redux = data.props.pageProps.initialReduxState;
  
  // Explore ssr_jdReducer
  const jd = redux.ssr_jdReducer;
  if (jd) {
    console.log('=== ssr_jdReducer keys ===');
    console.log(Object.keys(jd));
    
    // Look for job data at common paths
    for (const key of Object.keys(jd)) {
      const val = jd[key];
      if (typeof val === 'string' && val.length < 200) {
        console.log(`  ${key}: "${val}"`);
      } else if (typeof val === 'object' && val !== null) {
        console.log(`  ${key}: [object with keys: ${Object.keys(val).slice(0, 10).join(', ')}]`);
      } else if (typeof val === 'number' || typeof val === 'boolean') {
        console.log(`  ${key}: ${val}`);
      }
    }
    
    // Common Naukri JD fields
    if (jd.jdData || jd.jobData || jd.data) {
      const jobObj = jd.jdData || jd.jobData || jd.data;
      console.log('\n=== Job Data Object ===');
      console.log(JSON.stringify(jobObj, null, 2).slice(0, 3000));
    }
  }
  
  // Also check ssr_srp for search results page data
  const srp = redux.ssr_srp;
  if (srp) {
    console.log('\n=== ssr_srp keys ===');
    console.log(Object.keys(srp).slice(0, 15));
  }
}

main();
