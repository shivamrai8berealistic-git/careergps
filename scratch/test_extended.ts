/**
 * Extended test: Test with URLs from additional job sites not in the original list.
 */
import { scrapeJobFromUrl } from '../src/actions/scrape-job';
import dotenv from 'dotenv';
dotenv.config({ path: '../.env.local' });

const extraUrls = [
  // LinkedIn /view/ format (not /collections/)
  "https://www.linkedin.com/jobs/view/4398339581",
  // Wellfound (AngelList)
  "https://wellfound.com/jobs/3273698-full-stack-developer",
  // Internshala
  "https://internshala.com/internship/detail/full-stack-development-work-from-home-internship-at-devtown1748355710",
  // SimplyHired
  "https://www.simplyhired.co.in/search?q=software+engineer&l=Delhi",
];

async function main() {
  console.log('=== EXTENDED TEST: Additional Job Sites ===\n');
  
  for (let i = 0; i < extraUrls.length; i++) {
    const url = extraUrls[i];
    const host = new URL(url).hostname.replace('www.', '');
    console.log(`[TEST ${i+1}/${extraUrls.length}] ${host}`);
    console.log(`URL: ${url}`);
    
    const start = Date.now();
    try {
      const result = await scrapeJobFromUrl(url);
      const ms = Date.now() - start;
      console.log(`✅ PASS (${ms}ms)`);
      console.log(`   Title: "${result.title}"`);
      console.log(`   Company: "${result.company}"`);
      console.log(`   Location: "${result.location || 'N/A'}"`);
      console.log(`   Description: ${result.description.length} chars`);
    } catch (err: any) {
      const ms = Date.now() - start;
      console.log(`⚠️ FAIL (${ms}ms): ${err.message.slice(0, 150)}`);
    }
    console.log('---\n');
    
    if (i < extraUrls.length - 1) {
      await new Promise(r => setTimeout(r, 3000));
    }
  }
}

main();
