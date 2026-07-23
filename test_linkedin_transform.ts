import { scrapeJobFromUrl } from './src/actions/scrape-job';
import dotenv from 'dotenv';
dotenv.config();

async function main() {
  const transformedUrl = "https://www.linkedin.com/jobs/view/4398339581";
  console.log(`Testing transformed LinkedIn URL: ${transformedUrl}`);
  try {
    const result = await scrapeJobFromUrl(transformedUrl);
    console.log("SUCCESS:");
    console.log(JSON.stringify(result, null, 2));
  } catch (err: any) {
    console.log(`FAILED: ${err.message}`);
  }
}

main();
