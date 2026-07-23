async function testJina(url) {
  try {
    const resp = await fetch(`https://r.jina.ai/${url}`);
    const text = await resp.text();
    console.log("Jina response length:", text.length);
    console.log("Preview:", text.substring(0, 500));
  } catch (err) {
    console.error("Error", err.message);
  }
}

testJina('https://www.naukri.com/job-listings-sales-executive-zipaworld-noida-2-to-5-years-240426501793?src=jobsearchDesk&sid=17772114807257262&xp=2&px=1&nignbevent_src=jobsearchDeskGNB');
