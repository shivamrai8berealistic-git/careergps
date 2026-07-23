import { scrapeJobFromUrl } from './src/actions/scrape-job';

async function main() {
  const url = 'https://www.linkedin.com/jobs/collections/easy-apply/?currentJobId=4398339581&discover=true';
  try {
    const result = await ai.runFlow(extractJobFromUrl, {
      rawHtml: text.substring(0, 30000),
      sourceUrl: url,
    }, {
        model: 'googleai/gemini-2.0-flash'
    });
  } catch (err) {
    console.error("Error:", err);
  }
}

main();
