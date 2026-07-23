// Deeper probe: LinkedIn HTML structure + Naukri SSR content
import dotenv from 'dotenv';
dotenv.config();

async function probeLinkedIn() {
  console.log('=== LinkedIn Guest API HTML Structure ===');
  const resp = await fetch('https://www.linkedin.com/jobs-guest/jobs/api/jobPosting/4398339581', {
    headers: {
      'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 16_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.5 Mobile/15E148 Safari/604.1',
      'Accept': 'text/html,application/xhtml+xml',
    },
    signal: AbortSignal.timeout(10000),
  });
  const html = await resp.text();
  
  // Check for key class patterns LinkedIn uses
  const titleMatch = html.match(/<h2[^>]*class="[^"]*top-card-layout__title[^"]*"[^>]*>(.*?)<\/h2>/s);
  const companyMatch = html.match(/<a[^>]*class="[^"]*topcard__org-name-link[^"]*"[^>]*>(.*?)<\/a>/s);
  const locationMatch = html.match(/<span[^>]*class="[^"]*topcard__flavor--bullet[^"]*"[^>]*>(.*?)<\/span>/s);
  const descMatch = html.match(/<div[^>]*class="[^"]*description__text[^"]*"[^>]*>([\s\S]*?)<\/div>/);
  
  console.log(`Title: "${titleMatch ? titleMatch[1].trim() : 'NOT FOUND'}"`);
  console.log(`Company: "${companyMatch ? companyMatch[1].trim() : 'NOT FOUND'}"`);
  console.log(`Location: "${locationMatch ? locationMatch[1].trim() : 'NOT FOUND'}"`);
  console.log(`Description: ${descMatch ? descMatch[1].trim().slice(0, 200) + '...' : 'NOT FOUND'}`);
  
  // Also look for any structured data in different format
  const h1 = html.match(/<h1[^>]*>(.*?)<\/h1>/s);
  const h2s = [...html.matchAll(/<h2[^>]*>(.*?)<\/h2>/gs)];
  console.log(`\nH1: ${h1 ? h1[1].trim().slice(0, 80) : 'none'}`);
  console.log(`H2 count: ${h2s.length}`);
  for (const h2 of h2s.slice(0, 3)) {
    console.log(`  H2: "${h2[1].trim().slice(0, 80)}"`);
  }
}

async function probeNaukri() {
  console.log('\n\n=== Naukri HTML Structure ===');
  const resp = await fetch('https://www.naukri.com/job-listings-sales-executive-zipaworld-noida-2-to-5-years-240426501793', {
    headers: {
      'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 16_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.5 Mobile/15E148 Safari/604.1',
      'Accept': 'text/html,application/xhtml+xml',
    },
    signal: AbortSignal.timeout(10000),
  });
  const html = await resp.text();
  
  // Check for __NEXT_DATA__ (Next.js SSR data)
  const nextData = html.match(/<script id="__NEXT_DATA__"[^>]*>([\s\S]*?)<\/script>/);
  if (nextData) {
    console.log('Found __NEXT_DATA__!');
    try {
      const data = JSON.parse(nextData[1]);
      // Navigate to find job data
      const props = data?.props?.pageProps;
      if (props) {
        console.log('pageProps keys:', Object.keys(props));
        // Look for job-related keys
        for (const key of Object.keys(props)) {
          const val = props[key];
          if (typeof val === 'object' && val !== null) {
            const subkeys = Object.keys(val).join(', ');
            console.log(`  ${key}: {${subkeys.slice(0, 100)}}`);
          }
        }
      }
    } catch(e) {
      console.log('Could not parse __NEXT_DATA__');
    }
  } else {
    console.log('No __NEXT_DATA__ found.');
  }
  
  // Check for window.__data__ or window.initialState patterns
  const windowData = html.match(/window\.__INITIAL_STATE__\s*=\s*({[\s\S]*?});?\s*<\/script>/);
  const windowData2 = html.match(/window\.jdp\s*=\s*({[\s\S]*?});?\s*<\/script>/);
  console.log(`window.__INITIAL_STATE__: ${windowData ? 'FOUND' : 'not found'}`);
  console.log(`window.jdp: ${windowData2 ? 'FOUND' : 'not found'}`);
  
  // Check for standard meta tags
  const title = html.match(/<title[^>]*>(.*?)<\/title>/i);
  const ogTitle = html.match(/<meta\s+(?:property|name)="og:title"\s+content="([^"]*)"/i);
  const description = html.match(/<meta\s+name="description"\s+content="([^"]*)"/i);
  
  console.log(`<title>: ${title ? title[1].slice(0, 100) : 'none'}`);
  console.log(`og:title: ${ogTitle ? ogTitle[1].slice(0, 100) : 'none'}`);
  console.log(`description: ${description ? description[1].slice(0, 100) : 'none'}`);
  
  // Search the raw HTML for the actual job title text
  const saleExec = html.includes('Sales Executive');
  const zipaworld = html.includes('Zipaworld');
  console.log(`Contains "Sales Executive": ${saleExec}`);
  console.log(`Contains "Zipaworld": ${zipaworld}`);
  
  // Look for any script with JSON that might contain job data
  const allScripts = [...html.matchAll(/<script[^>]*>([\s\S]*?)<\/script>/gi)];
  console.log(`Total script blocks: ${allScripts.length}`);
  for (const s of allScripts) {
    const content = s[1].trim();
    if (content.includes('Sales Executive') || content.includes('Zipaworld')) {
      console.log(`\nFOUND JOB DATA IN SCRIPT (length: ${content.length}):`);
      console.log(content.slice(0, 500) + '...');
    }
  }
}

async function main() {
  await probeLinkedIn();
  await probeNaukri();
}

main();
