'use server';

import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import { adminDb, admin } from '@/lib/firebase-admin';
import { getAuth } from 'firebase-admin/auth';

async function verifyAuth(idToken: string) {
  if (!idToken) throw new Error('Unauthorized: No token provided');
  try {
    await getAuth(admin.app()).verifyIdToken(idToken);
  } catch (error) {
    throw new Error('Unauthorized: Invalid token');
  }
}

// ── Schema ───────────────────────────────────────────────────────────────────
const ExtractedJobSchema = z.object({
  title: z.string().describe('Job title / role name.'),
  company: z.string().describe('Hiring company name.'),
  location: z.string().optional().describe('City, state, or "Remote".'),
  description: z.string().describe('Full job description, cleaned of HTML.'),
  applyUrl: z.string().optional().describe('Direct application URL if found.'),
  employmentType: z.string().optional().describe('Full-time, Part-time, Contract, etc.'),
});
export type ExtractedJob = z.infer<typeof ExtractedJobSchema>;

export type ScrapeStatus = 'success' | 'partial' | 'blocked' | 'unsupported';

export type ScrapeResult = {
  status: ScrapeStatus;
  job?: ExtractedJob & { sourceUrl: string };
  /** User-facing explanation of why it failed and what to do next */
  error?: string;
  /** Which extraction method was used — for debugging */
  method?: string;
};

// ── AI Flows ─────────────────────────────────────────────────────────────────
const extractFromUrlPrompt = ai.definePrompt({
  name: 'extractJobFromUrlPrompt',
  input: { schema: z.object({ rawText: z.string(), sourceUrl: z.string() }) },
  output: { schema: ExtractedJobSchema },
  model: 'googleai/gemini-2.5-flash',
  prompt: `You are an expert job description parser. Extract structured data from the following job posting page content.

Source URL: {{sourceUrl}}

Page content:
---
{{rawText}}
---

Extract:
1. Job title / role
2. Company name
3. Location (city / remote / hybrid)
4. Full job description (cleaned readable prose, no HTML)
5. Direct application URL if present
6. Employment type (full-time, part-time, contract, internship)

Return ONLY valid JSON. Title and company MUST NOT be empty — infer from context.
If a field is missing, use "" for required fields and omit optional fields.`,
});

const extractFromUrlFlow = ai.defineFlow(
  {
    name: 'extractJobFromUrlFlow',
    inputSchema: z.object({ rawText: z.string(), sourceUrl: z.string() }),
    outputSchema: ExtractedJobSchema,
  },
  async (input) => {
    const { output } = await extractFromUrlPrompt(input);
    if (!output) throw new Error('AI did not return structured job data.');
    return output;
  }
);

const extractFromTextPrompt = ai.definePrompt({
  name: 'extractJobFromTextPrompt',
  input: { schema: z.object({ rawText: z.string(), companyHint: z.string().optional() }) },
  output: { schema: ExtractedJobSchema },
  model: 'googleai/gemini-2.5-flash',
  prompt: `You are an expert job description parser.

{{#if companyHint}}Company hint: {{companyHint}}{{/if}}

Raw job description:
---
{{rawText}}
---

Extract: title, company, location, full description, apply URL, employment type.
Return ONLY valid JSON.`,
});

const extractFromTextFlow = ai.defineFlow(
  {
    name: 'extractJobFromTextFlow',
    inputSchema: z.object({ rawText: z.string(), companyHint: z.string().optional() }),
    outputSchema: ExtractedJobSchema,
  },
  async (input) => {
    const { output } = await extractFromTextPrompt(input);
    if (!output) throw new Error('AI did not return structured job data.');
    return output;
  }
);

// ── Zero-AI Extractors ────────────────────────────────────────────────────────

function extractFromJsonLd(html: string): ExtractedJob | null {
  const blocks = html.match(/<script[^>]*type\s*=\s*["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi);
  if (!blocks) return null;

  for (const block of blocks) {
    try {
      const content = block.replace(/<script[^>]*>/, '').replace(/<\/script>/, '').trim();
      const parsed = JSON.parse(content);
      const candidates = parsed['@graph'] ? parsed['@graph'] : [parsed];

      for (const obj of candidates) {
        if (obj['@type'] !== 'JobPosting') continue;

        const desc = (obj.description || '')
          .replace(/<[^>]+>/g, ' ')
          .replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&nbsp;/g, ' ')
          .replace(/\s+/g, ' ').trim();

        const locationObj = obj.jobLocation;
        let location = '';
        if (locationObj) {
          if (typeof locationObj === 'string') {
            location = locationObj;
          } else if (locationObj.address) {
            const a = locationObj.address;
            location = [a.addressLocality, a.addressRegion, a.addressCountry].filter(Boolean).join(', ');
          } else if (Array.isArray(locationObj)) {
            location = locationObj.map((l: any) => l.address?.addressLocality || l.name || '').filter(Boolean).join('; ');
          }
        }

        const company = obj.hiringOrganization?.name || (typeof obj.hiringOrganization === 'string' ? obj.hiringOrganization : '');
        if (obj.title && company) {
          console.log(`[JSON-LD] Found: "${obj.title}" at "${company}"`);
          return {
            title: obj.title,
            company,
            location: location || undefined,
            description: desc || obj.title,
            applyUrl: obj.url || undefined,
            employmentType: Array.isArray(obj.employmentType) ? obj.employmentType.join(', ') : obj.employmentType || undefined,
          };
        }
      }
    } catch { /* skip */ }
  }
  return null;
}

function extractFromLinkedInHtml(html: string): ExtractedJob | null {
  const titleMatch = html.match(/<h2[^>]*class="[^"]*top-card-layout__title[^"]*"[^>]*>([\s\S]*?)<\/h2>/);
  const companyMatch = html.match(/<a[^>]*class="[^"]*topcard__org-name-link[^"]*"[^>]*>([\s\S]*?)<\/a>/);
  const locationMatch = html.match(/<span[^>]*class="[^"]*topcard__flavor--bullet[^"]*"[^>]*>([\s\S]*?)<\/span>/);
  const descMatch = html.match(/<div[^>]*class="[^"]*show-more-less-html__markup[^"]*"[^>]*>([\s\S]*?)<\/div>/);
  const h2Title = html.match(/<h2[^>]*>([\s\S]*?)<\/h2>/);

  const clean = (s: string) => s.replace(/<[^>]+>/g, '').replace(/&amp;/g, '&').replace(/&nbsp;/g, ' ').trim();

  const title = clean(titleMatch?.[1] || h2Title?.[1] || '');
  const company = clean(companyMatch?.[1] || '');
  const location = clean(locationMatch?.[1] || '');

  let description = '';
  if (descMatch) {
    description = descMatch[1]
      .replace(/<br\s*\/?>/gi, '\n')
      .replace(/<\/?(p|div|li|ul|ol|h[1-6])[^>]*>/gi, '\n')
      .replace(/<[^>]+>/g, '')
      .replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&nbsp;/g, ' ')
      .replace(/&#39;/g, "'").replace(/&quot;/g, '"')
      .replace(/\n{3,}/g, '\n\n').trim();
  }

  if (title && company) {
    console.log(`[LinkedIn HTML] Found: "${title}" at "${company}"`);
    const typeMatch = html.match(/Full-time|Part-time|Contract|Internship|Temporary/i);
    return {
      title,
      company,
      location: location || undefined,
      description: description || title,
      employmentType: typeMatch?.[0] || undefined,
    };
  }
  return null;
}

// ── Utilities ─────────────────────────────────────────────────────────────────

function cleanHtmlForAi(html: string): string {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, '')
    .replace(/<style[\s\S]*?<\/style>/gi, '')
    .replace(/<nav[\s\S]*?<\/nav>/gi, '')
    .replace(/<header[\s\S]*?<\/header>/gi, '')
    .replace(/<footer[\s\S]*?<\/footer>/gi, '')
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/?(p|div|li|ul|ol|h[1-6]|tr|td|th|section|article)[^>]*>/gi, '\n')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&nbsp;/g, ' ')
    .replace(/&#39;/g, "'").replace(/&quot;/g, '"')
    .replace(/[ \t]+/g, ' ').replace(/\n{3,}/g, '\n\n')
    .trim().slice(0, 25000);
}

/** Strip UTM/tracking parameters so sourceUrl stored is clean */
function normalizeUrl(raw: string): string {
  try {
    const u = new URL(raw);
    const trackingParams = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term',
      'src', 'sid', 'xp', 'px', 'nignbevent_src', 'discover', 'refId', 'trackingId'];
    trackingParams.forEach(p => u.searchParams.delete(p));
    return u.toString();
  } catch {
    return raw;
  }
}

async function withRetry<T>(fn: () => Promise<T>, maxAttempts = 3, label = 'API call'): Promise<T> {
  const delays = [5000, 15000, 30000];
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (err: any) {
      const isRetryable =
        err.code === 429 || err.code === 503 ||
        err.status === 'RESOURCE_EXHAUSTED' || err.status === 'UNAVAILABLE' ||
        err.message?.includes('429') || err.message?.includes('503') ||
        err.message?.includes('RESOURCE_EXHAUSTED') || err.message?.includes('quota') ||
        err.message?.includes('high demand');

      if (isRetryable && attempt < maxAttempts) {
        const delay = delays[attempt - 1] ?? 30000;
        console.warn(`[withRetry] ${label} attempt ${attempt}/${maxAttempts} — waiting ${delay / 1000}s`);
        await new Promise(r => setTimeout(r, delay));
        continue;
      }
      if (isRetryable) {
        throw new Error('AI service is temporarily busy. Please try again in a moment, or use the "Paste JD" tab instead.');
      }
      throw err;
    }
  }
  throw new Error('Retry loop exited without result');
}

function isBlockedPage(text: string): boolean {
  const markers = [
    'just a moment', 'security check', 'access denied', 'captcha',
    'additional verification required', 'humans only',
    'checking if the site connection is secure',
    'enable javascript and cookies to continue',
    'cf-browser-verification', 'attention required! | cloudflare',
    'ray id:', 'challenge-form', 'blocked by', 'bot detection',
  ];
  const lower = text.toLowerCase();
  return markers.some(m => lower.includes(m));
}

/** True if this URL is a search/listing page rather than a single job post */
function isSearchOrListingPage(url: string): { blocked: boolean; reason: string } | null {
  try {
    const u = new URL(url);
    const path = u.pathname.toLowerCase();
    const host = u.hostname.toLowerCase();

    // LinkedIn collection/search pages (not individual jobs)
    if (host.includes('linkedin.com')) {
      if (path.includes('/jobs/search') || path.includes('/jobs/collections/') || path === '/jobs/') {
        // BUT if it has currentJobId= param, it IS a valid single job
        if (!u.searchParams.get('currentJobId') && !path.match(/\/view\/\d+/)) {
          return { blocked: false, reason: 'This looks like a LinkedIn jobs collection page. Please paste the URL of a specific job listing (look for a URL with /view/12345 or currentJobId=...).' };
        }
      }
    }

    // Glassdoor search pages (SRCH_ in path)
    if (host.includes('glassdoor') && (path.includes('/job/') && path.includes('SRCH_'))) {
      return { blocked: false, reason: 'This looks like a Glassdoor search results page. Please navigate to a specific job listing and paste that URL.' };
    }

    // Generic search patterns
    if (path.match(/\/(search|results|browse)\/?(\?|$)/) || u.searchParams.has('q') && path.includes('/jobs')) {
      return { blocked: false, reason: 'This looks like a job search results page. Please paste the URL of a single job posting.' };
    }

    return null;
  } catch {
    return null;
  }
}

const BLOCKED_MESSAGE = (hostname: string) =>
  `This site (${hostname}) is blocking automated import.\n\n` +
  `What to do:\n` +
  `• Use our Browser Extension — open the job page and click "Save to CareerPilot"\n` +
  `• Or copy the job description and use the "Paste JD" tab\n` +
  `• Or enter the job details manually`;

// ── Site-Specific Fetchers ────────────────────────────────────────────────────

const MOBILE_UA = 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1';
const FETCH_HEADERS = {
  'User-Agent': MOBILE_UA,
  'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
  'Accept-Language': 'en-US,en;q=0.9',
};

async function fetchLinkedIn(jobId: string, originalUrl: string): Promise<ExtractedJob & { sourceUrl: string; method: string }> {
  const apiUrl = `https://www.linkedin.com/jobs-guest/jobs/api/jobPosting/${jobId}`;
  console.log(`[LinkedIn] Fetching guest API: ${apiUrl}`);

  const resp = await fetch(apiUrl, { headers: FETCH_HEADERS, signal: AbortSignal.timeout(10000) });

  if (resp.status === 404) throw new Error('This LinkedIn job has been removed or is no longer available.');
  if (!resp.ok) throw new Error(`LinkedIn returned status ${resp.status}. The job may have been removed.`);

  const html = await resp.text();
  if (html.length < 300) throw new Error('LinkedIn returned an empty response. The job may have been removed.');

  const structured = extractFromLinkedInHtml(html);
  if (structured?.title && structured?.company) {
    return { ...structured, sourceUrl: originalUrl, method: 'linkedin-html-selectors' };
  }

  console.log('[LinkedIn] Selector extraction incomplete, falling back to AI...');
  const cleaned = cleanHtmlForAi(html);
  const result = await withRetry(() => extractFromUrlFlow({ rawText: cleaned, sourceUrl: originalUrl }), 3, 'LinkedIn AI');
  return { ...result, sourceUrl: originalUrl, method: 'linkedin-ai' };
}

async function fetchFoundIt(url: string): Promise<ExtractedJob & { sourceUrl: string; method: string }> {
  console.log(`[FoundIt] Direct fetch: ${url}`);
  const resp = await fetch(url, { headers: FETCH_HEADERS, signal: AbortSignal.timeout(12000) });

  if (!resp.ok) throw new Error(`FoundIt returned status ${resp.status}. The job may have been removed.`);
  const html = await resp.text();

  const jsonLd = extractFromJsonLd(html);
  if (jsonLd?.title && jsonLd?.company) {
    return { ...jsonLd, sourceUrl: url, method: 'foundit-jsonld' };
  }

  console.log('[FoundIt] No JSON-LD, falling back to AI...');
  const cleaned = cleanHtmlForAi(html);
  const result = await withRetry(() => extractFromUrlFlow({ rawText: cleaned, sourceUrl: url }), 3, 'FoundIt AI');
  return { ...result, sourceUrl: url, method: 'foundit-ai' };
}

async function fetchGeneric(url: string): Promise<ExtractedJob & { sourceUrl: string; method: string }> {
  const hostname = new URL(url).hostname;
  let rawContent = '';
  let method = '';

  // Step 1: Direct fetch
  try {
    console.log(`[Generic] Direct fetch: ${url}`);
    const resp = await fetch(url, { headers: FETCH_HEADERS, signal: AbortSignal.timeout(8000), redirect: 'follow' });

    if (resp.ok) {
      const html = await resp.text();
      if (html.length > 2000 && !isBlockedPage(html)) {
        const jsonLd = extractFromJsonLd(html);
        if (jsonLd?.title && jsonLd?.company) {
          console.log(`[Generic] JSON-LD found on direct fetch.`);
          return { ...jsonLd, sourceUrl: url, method: 'generic-jsonld' };
        }
        const cleaned = cleanHtmlForAi(html);
        if (cleaned.length > 500) {
          rawContent = cleaned;
          method = 'generic-direct-ai';
          console.log(`[Generic] Direct content usable (${cleaned.length} chars).`);
        }
      } else if (isBlockedPage(html)) {
        console.log('[Generic] Direct fetch returned blocked page.');
      }
    }
  } catch (e: any) {
    console.log(`[Generic] Direct fetch failed: ${e.message}`);
  }

  // Step 2: Jina Reader fallback
  if (!rawContent) {
    try {
      console.log(`[Generic] Trying Jina Reader...`);
      const jinaResp = await fetch(`https://r.jina.ai/${url}`, {
        headers: { 'Accept': 'text/plain', 'User-Agent': MOBILE_UA },
        signal: AbortSignal.timeout(25000),
      });

      if (jinaResp.ok) {
        const markdown = await jinaResp.text();
        if (!isBlockedPage(markdown) && markdown.length > 200) {
          rawContent = markdown.slice(0, 25000);
          method = 'jina-ai';
          console.log(`[Generic] Jina success (${rawContent.length} chars).`);
        } else {
          throw new Error('Jina returned blocked or empty content');
        }
      } else {
        throw new Error(`Jina HTTP ${jinaResp.status}`);
      }
    } catch (e: any) {
      console.error(`[Generic] Jina failed: ${e.message}`);
      throw new Error(BLOCKED_MESSAGE(hostname));
    }
  }

  // Step 3: AI extraction
  console.log(`[Generic] Sending content to AI (method: ${method})...`);
  const result = await withRetry(() => extractFromUrlFlow({ rawText: rawContent, sourceUrl: url }), 3, `Generic AI (${method})`);
  return { ...result, sourceUrl: url, method };
}

// ── Public API ────────────────────────────────────────────────────────────────

/**
 * Main entry point. Returns a ScrapeResult with explicit status classification.
 * Never throws — always returns a typed result the UI can act on.
 */
export async function scrapeJobFromUrl(idToken: string, url: string): Promise<ScrapeResult> {
  await verifyAuth(idToken);
  // Validate URL
  let parsedUrl: URL;
  try {
    parsedUrl = new URL(url.trim());
  } catch {
    return { status: 'unsupported', error: 'Please enter a valid URL starting with https://' };
  }

  if (!['http:', 'https:'].includes(parsedUrl.protocol)) {
    return { status: 'unsupported', error: 'Only http/https URLs are supported.' };
  }

  // Detect search/listing pages before attempting fetch
  const searchCheck = isSearchOrListingPage(url);
  if (searchCheck) {
    return { status: 'unsupported', error: searchCheck.reason };
  }

  const hostname = parsedUrl.hostname.toLowerCase();
  const cleanUrl = normalizeUrl(url);
  console.log(`[scrapeJobFromUrl] ${hostname} — cleaned URL: ${cleanUrl}`);

  try {
    let raw: ExtractedJob & { sourceUrl: string; method?: string };

    // Site routing
    if (hostname.includes('linkedin.com')) {
      const viewMatch = url.match(/\/view\/(\d+)/);
      const jobIdParam = parsedUrl.searchParams.get('currentJobId');
      const jobId = viewMatch?.[1] || jobIdParam;

      if (!jobId) {
        return {
          status: 'unsupported',
          error: 'Could not find a job ID in this LinkedIn URL. Please use a URL like linkedin.com/jobs/view/12345 or one with currentJobId=... in the address bar.',
        };
      }
      raw = await fetchLinkedIn(jobId, cleanUrl);

    } else if (hostname.includes('foundit.in') || hostname.includes('monster.com')) {
      raw = await fetchFoundIt(cleanUrl);

    } else if (hostname.includes('glassdoor')) {
      if (url.includes('/job-listing/') || url.includes('/job/')) {
        raw = await fetchGeneric(cleanUrl);
      } else {
        return {
          status: 'unsupported',
          error: 'This Glassdoor URL appears to be a search page. Please navigate to a specific job listing and paste that URL.',
        };
      }

    } else {
      // Naukri, Indeed, and all other sites
      raw = await fetchGeneric(cleanUrl);
    }

    // ── Validate extracted data ──────────────────────────────────────────────
    const hasTitle = raw.title?.trim().length > 0;
    const hasCompany = raw.company?.trim().length > 0;
    const hasDescription = raw.description?.trim().length > 20;

    // Complete failure — extracted nothing useful
    if (!hasTitle && !hasCompany && !hasDescription) {
      return {
        status: 'blocked',
        error: BLOCKED_MESSAGE(hostname),
        method: raw.method,
      };
    }

    // Partial — some fields missing
    if (!hasTitle || !hasCompany || !hasDescription) {
      if (!hasTitle) raw.title = 'Untitled Role';
      if (!hasCompany) raw.company = 'Unknown Company';
      console.log(`[scrapeJobFromUrl] ⚠️ Partial: "${raw.title}" at "${raw.company}" via ${raw.method}`);
      return { status: 'partial', job: raw as ExtractedJob & { sourceUrl: string }, method: raw.method };
    }

    console.log(`[scrapeJobFromUrl] ✅ Success: "${raw.title}" at "${raw.company}" via ${raw.method}`);
    return { status: 'success', job: raw as ExtractedJob & { sourceUrl: string }, method: raw.method };

  } catch (err: any) {
    const msg = err.message || '';
    console.error(`[scrapeJobFromUrl] Error:`, msg);

    // Map known error messages to blocked status
    const isBlockMessage = msg.includes('is blocking') || msg.includes('temporarily busy') || msg.includes('Jina') || msg.includes('security challenge');
    return {
      status: isBlockMessage ? 'blocked' : 'blocked',
      error: msg.includes('\n') ? msg : BLOCKED_MESSAGE(hostname),
    };
  }
}

/**
 * Extract structured job data from pasted raw text.
 */
export async function extractJobFromText(idToken: string, rawText: string, companyHint?: string): Promise<ExtractedJob> {
  await verifyAuth(idToken);
  if (!rawText || rawText.trim().length < 50) {
    throw new Error('Please paste more job description text (at least a few sentences).');
  }
  return withRetry(
    () => extractFromTextFlow({ rawText: rawText.trim().slice(0, 20000), companyHint }),
    3,
    'Text extraction'
  );
}
