async function testUrl(url) {
  try {
    const resp = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)',
      },
      signal: AbortSignal.timeout(15000),
    });
    const rawHtml = await resp.text();
    const titleMatch = rawHtml.match(/<title[^>]*>([^<]+)<\/title>/i);
    console.log("URL:", url);
    console.log("Status:", resp.status);
    console.log("Title:", titleMatch ? titleMatch[1] : "None");
    console.log("Length:", rawHtml.length);
    console.log("---");
  } catch (err) {
    console.error("Error", err.message);
  }
}

async function main() {
  await testUrl('https://www.naukri.com/job-listings-sales-executive-zipaworld-noida-2-to-5-years-240426501793?src=jobsearchDesk&sid=17772114807257262&xp=2&px=1&nignbevent_src=jobsearchDeskGNB');
  await testUrl('https://in.indeed.com/viewjob?jk=f05419a8d725949c&utm_campaign=google_jobs_apply&utm_source=google_jobs_apply&utm_medium=organic');
  await testUrl('https://www.foundit.in/job/visa-consultant-fresher-zigsaw-ahmedabad-51130861');
  await testUrl('https://www.glassdoor.co.in/job-listing/market-research-digitallancers-JV_IC2921225_KO0,15_KE16,30.htm?jl=1008973314282');
}

main();
