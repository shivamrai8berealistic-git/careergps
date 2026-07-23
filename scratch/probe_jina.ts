// Test Jina output for Naukri and other sites that need JS rendering
import dotenv from 'dotenv';
dotenv.config();

async function testJina(name: string, url: string) {
  console.log(`\n=== Jina: ${name} ===`);
  const jinaUrl = `https://r.jina.ai/${url}`;
  try {
    const resp = await fetch(jinaUrl, {
      headers: {
        'Accept': 'text/plain',
      },
      signal: AbortSignal.timeout(25000),
    });
    console.log(`Status: ${resp.status}`);
    const text = await resp.text();
    console.log(`Length: ${text.length}`);
    
    // Show first chunk
    console.log(`Content preview:\n${text.slice(0, 1500)}`);
    console.log(`\n... [${text.length - 1500} more chars] ...`);
    
    // Check for job-related content
    const hasTitle = text.includes('Sales Executive') || text.includes('Senior Consultant');
    console.log(`Contains expected job title: ${hasTitle}`);
  } catch (err: any) {
    console.log(`Error: ${err.message}`);
  }
}

async function main() {
  await testJina('Naukri', 'https://www.naukri.com/job-listings-sales-executive-zipaworld-noida-2-to-5-years-240426501793');
  await testJina('Glassdoor', 'https://www.glassdoor.co.in/job-listing/market-research-digitallancers-JV_IC2921225_KO0,15_KE16,30.htm?jl=1008973314282');
  await testJina('Indeed', 'https://in.indeed.com/viewjob?jk=f05419a8d725949c');
}

main();
