import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import Anthropic from '@anthropic-ai/sdk'
import { createClient } from '@supabase/supabase-js'

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

function normalizeUrl(domain: string): string {
  let d = domain.trim().toLowerCase()
  d = d.replace(/^https?:\/\//, '').replace(/^www\./, '')
  d = d.split('/')[0]
  return `https://${d}`
}

async function fetchPageText(url: string, timeout = 8000): Promise<string> {
  try {
    const res = await fetch(url, {
      headers: { 'User-Agent': 'Mozilla/5.0 (compatible; PrometheusCompliance/1.0)' },
      signal: AbortSignal.timeout(timeout),
    })
    if (!res.ok) return ''
    const html = await res.text()
    return html
      .replace(/<script[\s\S]*?<\/script>/gi, '')
      .replace(/<style[\s\S]*?<\/style>/gi, '')
      .replace(/<[^>]+>/g, ' ')
      .replace(/\s+/g, ' ')
      .trim()
      .slice(0, 5000)
  } catch {
    return ''
  }
}

async function tryFetchPages(base: string): Promise<{ homepage: string; privacy: string; leadForm: string; foundPages: string[] }> {
  const privacySlugs = ['/privacy-policy', '/privacy', '/legal', '/terms-of-service', '/terms']
  const leadSlugs = ['/contact', '/get-quote', '/free-quote', '/leads', '/quote', '/signup', '/sign-up', '/start', '/apply']

  const homepage = await fetchPageText(base)

  let privacy = ''
  let privacyPage = ''
  for (const slug of privacySlugs) {
    const text = await fetchPageText(base + slug, 5000)
    if (text.length > 200) { privacy = text; privacyPage = slug; break }
  }

  let leadForm = ''
  let leadPage = ''
  for (const slug of leadSlugs) {
    const text = await fetchPageText(base + slug, 5000)
    if (text.length > 200) { leadForm = text; leadPage = slug; break }
  }

  const foundPages = ['/ (homepage)']
  if (privacyPage) foundPages.push(privacyPage)
  if (leadPage) foundPages.push(leadPage)

  return { homepage, privacy, leadForm, foundPages }
}

async function fetchSerpIntel(domain: string): Promise<string> {
  try {
    const company = domain.replace(/\.(com|net|org|io|co).*/, '')
    const queries = [
      `"${domain}" TCPA complaint lawsuit`,
      `"${company}" lead generation complaint BBB`,
    ]
    const results: string[] = []
    for (const q of queries) {
      try {
        const url = `https://serpapi.com/search.json?engine=google&q=${encodeURIComponent(q)}&num=5&api_key=${process.env.SERPAPI_KEY}`
        const res = await fetch(url, { signal: AbortSignal.timeout(6000) })
        if (!res.ok) continue
        const data = await res.json()
        const snippets = (data.organic_results || [])
          .slice(0, 5)
          .map((r: any) => `${r.title}: ${r.snippet}`)
          .join('\n')
        if (snippets) results.push(snippets)
      } catch { continue }
    }
    return results.join('\n\n').slice(0, 3000)
  } catch {
    return ''
  }
}

async function runClaudeAnalysis(domain: string, pages: { homepage: string; privacy: string; leadForm: string; foundPages: string[] }, serpIntel: string): Promise<any> {
  const pagesAvailable = !!(pages.homepage || pages.privacy || pages.leadForm)

  const prompt = `You are a TCPA compliance expert analyzing a lead generation website for an independent insurance agent who wants to know if it is safe to buy leads from this vendor.

DOMAIN: ${domain}
PAGES SCANNED: ${pages.foundPages.join(', ')}
PAGES ACCESSIBLE: ${pagesAvailable ? 'YES — content retrieved' : 'NO — pages could not be fetched (blocked, gated, or unavailable)'}

HOMEPAGE TEXT:
${pages.homepage || 'Could not fetch — page blocked or unavailable.'}

PRIVACY POLICY TEXT:
${pages.privacy || 'No privacy policy page found or accessible.'}

LEAD FORM / CONTACT PAGE TEXT:
${pages.leadForm || 'No lead capture page found or accessible.'}

SERP INTELLIGENCE (complaints, lawsuits, reputation):
${serpIntel || 'No external intelligence gathered.'}

Analyze this domain for TCPA compliance. Use whatever data is available — page content, SERP intelligence, or both.

IMPORTANT SCORING RULES:
- If pages are inaccessible but SERP intel shows lawsuits, class actions, or regulatory complaints → score 10–25 (HIGH RISK)
- If pages are inaccessible but SERP intel shows no complaints and domain appears legitimate → score 35–50 (REVIEW NEEDED) — inaccessibility itself is not a pass, but absence of red flags matters
- If pages are inaccessible AND SERP shows active litigation or known shared lead model → score 5–20 (HIGH RISK)
- If pages ARE accessible: score based on what the 7 checks reveal (0–100)
- NEVER return a score of 0 unless there is truly zero information available. If SERP intel exists, use it.
- A score of 0 means "no data at all" — not "high risk." Use 5–25 for high risk with evidence.
- Mark checks as null (UNCLEAR) when pages are inaccessible, not as false/fail — UNLESS SERP intel reveals the failure (e.g. known shared lead vendor = shared_lead_warning fails)

CRITERIA TO EVALUATE:
1. PRIOR_EXPRESS_WRITTEN_CONSENT (30pts): Explicit PEWC language in opt-in form.
2. SELLER_IDENTIFICATION (15pts): Actual company named in consent language.
3. CONTACT_METHOD_DISCLOSURE (15pts): Calls, texts, autodialer explicitly stated.
4. CLEAR_CONSPICUOUS_PLACEMENT (15pts): Disclaimer visible near submit button.
5. PRIVACY_POLICY_PRESENT (10pts): Accessible policy addressing telephone contact.
6. SHARED_LEAD_WARNING (-15pts penalty if shared): Multi-buyer indicators per 2024 FCC ruling.
7. OPT_OUT_LANGUAGE (5pts): Clear STOP/unsubscribe instructions.

Return ONLY valid JSON:
{
  "score": <number 5-100, never 0 unless absolutely no data>,
  "verdict": "COMPLIANT" | "REVIEW NEEDED" | "HIGH RISK",
  "domain_age_signal": "<signals about how established this domain/company appears>",
  "is_shared_lead_vendor": <true|false>,
  "checks": {
    "prior_express_written_consent": { "pass": <true|false|null>, "points": <0 or 30>, "finding": "<specific finding or note that page was inaccessible>" },
    "seller_identification": { "pass": <true|false|null>, "points": <0 or 15>, "finding": "<specific finding>" },
    "contact_method_disclosure": { "pass": <true|false|null>, "points": <0 or 15>, "finding": "<specific finding>" },
    "clear_conspicuous_placement": { "pass": <true|false|null>, "points": <0 or 15>, "finding": "<specific finding>" },
    "privacy_policy_present": { "pass": <true|false|null>, "points": <0 or 10>, "finding": "<specific finding>" },
    "shared_lead_warning": { "pass": <true|false|null>, "points": <0 or -15>, "finding": "<specific finding — use SERP intel if pages unavailable>" },
    "opt_out_language": { "pass": <true|false|null>, "points": <0 or 5>, "finding": "<specific finding>" }
  },
  "reputation_intel": "<2-3 sentences on SERP intelligence — complaints, lawsuits, BBB issues, or clean record>",
  "recommendations": [
    { "priority": "CRITICAL" | "HIGH" | "MEDIUM", "title": "<short title>", "detail": "<specific actionable recommendation>" }
  ],
  "generated_language": {
    "tcpa_disclaimer": "<Complete ready-to-use TCPA disclaimer with PEWC language, [COMPANY NAME] placeholder, contact method, and opt-out>",
    "vendor_demand_letter": "<Short professional paragraph to send to this vendor demanding specific fixes>",
    "opt_out_line": "<Single ready-to-use opt-out disclosure line>"
  },
  "summary": "<3-4 sentences plain English summary of compliance picture and key risks for an independent insurance agent>"
}`

  const response = await anthropic.messages.create({
    model: 'claude-sonnet-4-5',
    max_tokens: 2000,
    messages: [{ role: 'user', content: prompt }],
  })

  const text = response.content[0].type === 'text' ? response.content[0].text : ''
  const jsonMatch = text.match(/\{[\s\S]*\}/)
  if (!jsonMatch) throw new Error('Failed to parse Claude analysis')
  return JSON.parse(jsonMatch[0])
}

export async function POST(req: NextRequest) {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const { domain } = await req.json()
    if (!domain) return NextResponse.json({ error: 'Domain required' }, { status: 400 })

    const baseUrl = normalizeUrl(domain)
    const cleanDomain = baseUrl.replace('https://', '')

    const pages = await tryFetchPages(baseUrl)
    const serpIntel = await fetchSerpIntel(cleanDomain)
    const analysis = await runClaudeAnalysis(cleanDomain, pages, serpIntel)

    await supabase.from('prometheus_scans').insert({
      clerk_id: userId,
      domain: cleanDomain,
      score: analysis.score,
      verdict: analysis.verdict,
      is_shared_lead: analysis.is_shared_lead_vendor,
      pages_scanned: pages.foundPages,
      analysis_json: analysis,
    })

    return NextResponse.json({ domain: cleanDomain, pages: pages.foundPages, analysis })
  } catch (err: any) {
    console.error('Prometheus scan error:', err)
    return NextResponse.json({ error: err.message || 'Scan failed' }, { status: 500 })
  }
}
