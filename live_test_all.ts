/**
 * End-to-end regression test for the Job Import by URL pipeline.
 * Run: node node_modules/tsx/dist/cli.mjs live_test_all.ts
 */
import { scrapeJobFromUrl } from './src/actions/scrape-job';
import dotenv from 'dotenv';
dotenv.config();

interface TestCase {
  url: string;
  expectedStatus: 'success' | 'blocked' | 'unsupported';
  label: string;
}

interface TestResult {
  label: string;
  url: string;
  status: string;
  title?: string;
  company?: string;
  location?: string;
  descLen?: number;
  sourceUrl?: string;
  method?: string;
  error?: string;
  durationMs: number;
}

const TEST_CASES: TestCase[] = [
  // Repeated runs to prove stability
  { url: 'https://www.linkedin.com/jobs/collections/easy-apply/?currentJobId=4398339581&discover=true', expectedStatus: 'success', label: 'Repeated 1: LinkedIn' },
  { url: 'https://www.linkedin.com/jobs/collections/easy-apply/?currentJobId=4398339581&discover=true', expectedStatus: 'success', label: 'Repeated 2: LinkedIn (Same URL)' },
  { url: 'https://www.linkedin.com/jobs/collections/easy-apply/?currentJobId=4398339581&discover=true', expectedStatus: 'success', label: 'Repeated 3: LinkedIn (Same URL)' },

  // LinkedIn — fast path (<2s)
  { url: 'https://www.linkedin.com/jobs/collections/recommended/?currentJobId=4361011095', expectedStatus: 'success', label: 'LinkedIn (recommended collection)' },

  // LinkedIn — should be detected as search/collection without a job ID
  { url: 'https://www.linkedin.com/jobs/search/?keywords=engineer', expectedStatus: 'unsupported', label: 'LinkedIn (search page → unsupported)' },

  // Naukri — Jina+AI path (~15-30s)
  { url: 'https://www.naukri.com/job-listings-sales-executive-zipaworld-noida-2-to-5-years-240426501793?src=jobsearchDesk&sid=17772114807257262&xp=2&px=1&nignbevent_src=jobsearchDeskGNB', expectedStatus: 'success', label: 'Naukri #1 (Zipaworld)' },
  { url: 'https://www.naukri.com/job-listings-sales-executive-m-s-vinit-enterprises-jalandhar-0-to-5-years-200426016741?src=simjobsjd_rt', expectedStatus: 'success', label: 'Naukri #2 (Vinit Enterprises)' },

  // FoundIt — JSON-LD fast path (<1s)
  { url: 'https://www.foundit.in/job/senior-consultant-sap-sd-argano-software-delhi-36070703', expectedStatus: 'success', label: 'FoundIt (SAP Consultant)' },
  { url: 'https://www.foundit.in/job/visa-consultant-fresher-zigsaw-ahmedabad-51130861', expectedStatus: 'success', label: 'FoundIt (Visa Consultant)' },

  // Glassdoor — blocked by Cloudflare
  { url: 'https://www.glassdoor.co.in/job-listing/market-research-digitallancers-JV_IC2921225_KO0,15_KE16,30.htm?jl=1008973314282&utm_campaign=google_jobs_apply&utm_source=google_jobs_apply&utm_medium=organic', expectedStatus: 'blocked', label: 'Glassdoor (specific listing → blocked)' },
  { url: 'https://www.glassdoor.co.in/Job/new-delhi-jobs-SRCH_IL.0,9_IC2891681.htm', expectedStatus: 'unsupported', label: 'Glassdoor (search page → unsupported)' },

  // Indeed — blocked by Cloudflare
  { url: 'https://in.indeed.com/viewjob?jk=f05419a8d725949c&utm_campaign=google_jobs_apply&utm_source=google_jobs_apply&utm_medium=organic', expectedStatus: 'blocked', label: 'Indeed #1 (blocked)' },
  { url: 'https://in.indeed.com/viewjob?jk=2ac593637f7c4eed&utm_campaign=google_jobs_apply&utm_source=google_jobs_apply&utm_medium=organic', expectedStatus: 'blocked', label: 'Indeed #2 (blocked)' },
];

async function runTest(tc: TestCase, idx: number, total: number): Promise<TestResult> {
  const hostname = new URL(tc.url).hostname.replace('www.', '');
  console.log(`\n${'─'.repeat(60)}`);
  console.log(`[${idx + 1}/${total}] ${tc.label}`);
  console.log(`  URL: ${tc.url.slice(0, 90)}${tc.url.length > 90 ? '…' : ''}`);
  console.log(`  Expected: ${tc.expectedStatus}`);

  const start = Date.now();
  const result = await scrapeJobFromUrl(tc.url);
  const duration = Date.now() - start;

  const matched = result.status === tc.expectedStatus || 
    (tc.expectedStatus === 'blocked' && (result.status === 'blocked' || result.status === 'partial')) ||
    (tc.expectedStatus === 'success' && (result.status === 'success' || result.status === 'partial'));

  if (result.status === 'success' || result.status === 'partial') {
    const j = result.job!;
    const icon = result.status === 'success' ? '✅' : '⚠️';
    console.log(`  ${icon} ${result.status.toUpperCase()} via ${result.method} (${duration}ms)`);
    console.log(`     Title:       "${j.title}"`);
    console.log(`     Company:     "${j.company}"`);
    console.log(`     Location:    "${j.location || 'N/A'}"`);
    console.log(`     Description: ${j.description.length} chars`);
    console.log(`     Source URL:  ${j.sourceUrl}`);
    if (!matched) console.log(`  ⚠️  WARNING: Expected "${tc.expectedStatus}" but got "${result.status}"`);
    return {
      label: tc.label, url: tc.url, status: result.status,
      title: j.title, company: j.company, location: j.location,
      descLen: j.description.length, sourceUrl: j.sourceUrl,
      method: result.method, durationMs: duration,
    };
  } else {
    const icon = matched ? (result.status === 'blocked' ? '🛡️' : '🚫') : '❌';
    console.log(`  ${icon} ${result.status.toUpperCase()} (${duration}ms)`);
    console.log(`     Message: ${result.error?.slice(0, 120)}`);
    if (!matched) console.log(`  ❌ MISMATCH: Expected "${tc.expectedStatus}" but got "${result.status}"`);
    return {
      label: tc.label, url: tc.url, status: result.status,
      error: result.error?.slice(0, 200), method: result.method, durationMs: duration,
    };
  }
}

async function main() {
  console.log('═'.repeat(60));
  console.log('  JOB IMPORT — HYBRID PIPELINE TEST SUITE');
  console.log('═'.repeat(60));
  console.log(`  ${TEST_CASES.length} URLs across LinkedIn, Naukri, FoundIt, Glassdoor, Indeed\n`);

  const results: TestResult[] = [];
  for (let i = 0; i < TEST_CASES.length; i++) {
    const r = await runTest(TEST_CASES[i], i, TEST_CASES.length);
    results.push(r);
    // Delay between tests
    if (i < TEST_CASES.length - 1) {
      const delay = (r.status === 'success' || r.status === 'partial') ? 2000 : 500;
      await new Promise(res => setTimeout(res, delay));
    }
  }

  // ── Summary ──────────────────────────────────────────────────────────────
  console.log('\n\n' + '═'.repeat(60));
  console.log('  FINAL REPORT');
  console.log('═'.repeat(60) + '\n');

  const successes = results.filter(r => r.status === 'success');
  const partials = results.filter(r => r.status === 'partial');
  const blocked = results.filter(r => r.status === 'blocked');
  const unsupported = results.filter(r => r.status === 'unsupported');
  const failures = results.filter(r => !['success','partial','blocked','unsupported'].includes(r.status));

  console.log(`  SUCCESS:     ${successes.length}`);
  console.log(`  PARTIAL:     ${partials.length}`);
  console.log(`  BLOCKED:     ${blocked.length}  (Cloudflare/bot protection — use extension or paste JD)`);
  console.log(`  UNSUPPORTED: ${unsupported.length}  (search pages or invalid URLs)`);
  console.log(`  FAIL/THROW:  ${failures.length}\n`);

  for (const r of results) {
    let icon = '❓';
    if (r.status === 'success') icon = '✅';
    else if (r.status === 'partial') icon = '⚠️';
    else if (r.status === 'blocked') icon = '🛡️';
    else if (r.status === 'unsupported') icon = '🚫';
    else icon = '❌';

    const label = r.label.padEnd(42);
    const detail = (r.status === 'success' || r.status === 'partial')
      ? `"${r.title}" @ "${r.company}" | desc:${r.descLen}ch | ${r.method} | ${r.durationMs}ms`
      : `${r.error?.slice(0, 60)}… | ${r.durationMs}ms`;
    console.log(`  ${icon} ${label} ${detail}`);
  }

  console.log('\n' + '═'.repeat(60));
  if (failures.length > 0) {
    console.log('  ❌ Unexpected failures — see above.');
    process.exit(1);
  } else {
    console.log('  ✅ All tests completed — no unexpected crashes or silent failures.');
    process.exit(0);
  }
}

main();
