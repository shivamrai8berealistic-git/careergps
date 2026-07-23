async function testUrl(url) {
  try {
    const resp = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.9',
        'Cache-Control': 'no-cache',
        'Pragma': 'no-cache',
      },
      signal: AbortSignal.timeout(15000),
    });
    const rawHtml = await resp.text();
    const ogTitleMatch = rawHtml.match(/<meta\s+property="og:title"\s+content="([^"]+)"/i);
    console.log("LinkedIn og:title:", ogTitleMatch ? ogTitleMatch[1] : "None");
    
    // check Naukri title tag
    const titleMatch = rawHtml.match(/<title[^>]*>([^<]+)<\/title>/i);
    console.log("LinkedIn title:", titleMatch ? titleMatch[1] : "None");
  } catch (err) {
    console.error("Error", err.message);
  }
}

async function main() {
  await testUrl('https://www.linkedin.com/jobs/collections/easy-apply/?currentJobId=4398339581&discover=true');
}

main();
