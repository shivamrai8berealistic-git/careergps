// Probe what structured data each job site actually returns
import dotenv from 'dotenv';
dotenv.config();

const urls = [
  { name: 'LinkedIn Guest API', url: 'https://www.linkedin.com/jobs-guest/jobs/api/jobPosting/4398339581' },
  { name: 'Naukri', url: 'https://www.naukri.com/job-listings-sales-executive-zipaworld-noida-2-to-5-years-240426501793' },
  { name: 'FoundIt', url: 'https://www.foundit.in/job/senior-consultant-sap-sd-argano-software-delhi-36070703' },
];

async function probe(name: string, targetUrl: string) {
  console.log(`\n=== ${name} ===`);
  console.log(`URL: ${targetUrl}`);
  
  try {
    const resp = await fetch(targetUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 16_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.5 Mobile/15E148 Safari/604.1',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.9',
      },
      signal: AbortSignal.timeout(10000),
    });
    
    console.log(`Status: ${resp.status}`);
    const html = await resp.text();
    console.log(`Total length: ${html.length}`);
    
    // Check for JSON-LD
    const jsonLdMatches = html.match(/<script[^>]*type\s*=\s*["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi);
    if (jsonLdMatches) {
      console.log(`JSON-LD blocks found: ${jsonLdMatches.length}`);
      for (const match of jsonLdMatches) {
        const content = match.replace(/<script[^>]*>/, '').replace(/<\/script>/, '').trim();
        try {
          const parsed = JSON.parse(content);
          const type = parsed['@type'] || (Array.isArray(parsed['@graph']) ? parsed['@graph'].map((g: any) => g['@type']).join(', ') : 'unknown');
          console.log(`  Type: ${type}`);
          if (type === 'JobPosting' || parsed['@type'] === 'JobPosting') {
            console.log(`  Title: ${parsed.title}`);
            console.log(`  Company: ${parsed.hiringOrganization?.name}`);
            console.log(`  Location: ${JSON.stringify(parsed.jobLocation)}`);
            console.log(`  EmploymentType: ${parsed.employmentType}`);
            console.log(`  Description length: ${(parsed.description || '').length}`);
          }
        } catch {
          console.log(`  (Could not parse JSON-LD: ${content.slice(0, 100)}...)`);
        }
      }
    } else {
      console.log('No JSON-LD found.');
    }
    
    // Check for OpenGraph tags
    const ogTitle = html.match(/<meta\s+property="og:title"\s+content="([^"]*)"/i);
    const ogDesc = html.match(/<meta\s+property="og:description"\s+content="([^"]*)"/i);
    console.log(`OG Title: ${ogTitle ? ogTitle[1] : 'none'}`);
    console.log(`OG Description: ${ogDesc ? ogDesc[1].slice(0, 80) : 'none'}...`);
    
    // Check for title tag
    const titleTag = html.match(/<title[^>]*>(.*?)<\/title>/i);
    console.log(`<title>: ${titleTag ? titleTag[1].slice(0, 80) : 'none'}`);
    
  } catch (err: any) {
    console.log(`ERROR: ${err.message}`);
  }
}

async function main() {
  for (const { name, url } of urls) {
    await probe(name, url);
  }
}

main();
