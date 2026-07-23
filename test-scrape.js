import { scrapeJobFromUrl } from './src/actions/scrape-job.js';

async function main() {
  const url = 'https://www.linkedin.com/jobs/collections/easy-apply/?currentJobId=4398339581&discover=true';
  try {
    const result = await scrapeJobFromUrl(url);
    console.log(result);
  } catch (err) {
    console.error("Error:", err);
  }
}

main();
