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

async function runClaudeAnalysis(
  domain: string,
  pages: { homepage: string; privacy: string; leadForm: string; foundPages: string[] },
  serpIntel: string
): Promise<any> {
  const pagesAvailable = !!(pages.homepage || pages.privacy || pages.leadForm)

  const prompt = `You are a TCPA compliance expert analyzing a lead generation website for an independent insurance agent evaluating whether it is safe to purchase leads from this vendor.

DOMAIN: ${domain}
PAGES ACCESSIBLE: ${pagesAvailable ? 'YES — content retrieved' : 'NO — site blocked automated fetch or pages unavailable'}

HOMEPAGE TEXT:
${pages.homepage || 'Not accessible.'}

PRIVACY POLICY TEXT:
${pages.privacy || 'Not accessible.'}

LEAD FORM / CONTACT PAGE TEXT:
${pages.leadForm || 'Not accessible.'}

SERP INTELLIGENCE:
${serpIntel || 'No external intelligence gathered.'}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
STEP 1 — CLASSIFY THE VENDOR
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
First classify this vendor into one of four tiers using ALL available signals — domain name, SERP results, company reputation, age, and any page content available:

ENTERPRISE: Publicly traded company, nationally recognized brand, 10+ years operating, dedicated legal/compliance teams. Examples: eHealth, GoHealth, SelectQuote, HealthMarkets, eHealthInsurance, Covered California, MediaAlpha, QuoteWizard, EverQuote. These companies have compliance infrastructure by necessity and are subject to SEC and regulatory oversight. If pages are inaccessible it is because of bot protection — NOT a compliance failure. Do not penalize for inaccessibility. Score their BUSINESS MODEL risk only.

ESTABLISHED: Known regional or industry brand, 3+ years operating, clear web presence, no significant complaint history. Inaccessible pages = neutral signal, not a penalty. Score based on business model and whatever content is available.

UNKNOWN: Little or no reputation data, newer or unrecognizable domain, limited SERP presence, no clear track record. Inaccessible pages = moderate penalty. Apply higher scrutiny.

SUSPICIOUS: Active SERP complaints or lawsuits filed within last 2 years, very new domain (under 1 year), multiple recent BBB complaints, pages inaccessible AND no reputation data, or known bad actor signals. Inaccessible pages = significant penalty.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
STEP 2 — SCORE BY VENDOR TIER
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Apply these scoring frameworks based on the tier you assigned:

ENTERPRISE (pages inaccessible):
- Assume accessibility checks (PEWC, seller ID, contact method, placement, privacy policy, opt-out) are likely met given compliance infrastructure — mark as null/UNCLEAR not false
- Focus scoring on BUSINESS MODEL risk: is this a shared lead marketplace? That is the real risk
- Shared lead marketplace with no exclusive option → 45-60 (REVIEW NEEDED) — real risk but not a rogue vendor
- Enterprise with dedicated exclusive lead product → 65-80 (REVIEW NEEDED to COMPLIANT)
- Enterprise with documented active ongoing litigation (within 2 years) → drop 15-20 points
- Old settled litigation (3+ years ago) at an enterprise = do NOT penalize, all large companies face litigation

ENTERPRISE (pages accessible):
- Score normally across all 7 checks
- Weight business model heavily — shared marketplace = structural TCPA risk regardless of disclaimer quality

ESTABLISHED (pages inaccessible):
- Mark accessibility checks as null/UNCLEAR
- Score 40-60 based on SERP signals and business model
- Active complaints → 25-40

ESTABLISHED (pages accessible):
- Score normally across all 7 checks

UNKNOWN (pages inaccessible):
- Score 20-40 — lack of reputation + inaccessibility = genuine risk
- Active SERP complaints → 10-25

UNKNOWN (pages accessible):
- Score normally, apply full scrutiny

SUSPICIOUS:
- Score 5-25 regardless of page accessibility
- Document specific red flags clearly

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
STEP 3 — EVALUATE THE 7 TCPA CHECKS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
For each check: true = PASS, false = FAIL, null = UNCLEAR (use null when pages inaccessible and no external signal confirms pass or fail — only mark false when you have actual evidence of failure).

1. PRIOR_EXPRESS_WRITTEN_CONSENT (30pts): Explicit PEWC language in opt-in form.
2. SELLER_IDENTIFICATION (15pts): Specific company or agent named in consent — not just "a licensed agent."
3. CONTACT_METHOD_DISCLOSURE (15pts): Calls, texts, autodialer, prerecorded messages explicitly stated.
4. CLEAR_CONSPICUOUS_PLACEMENT (15pts): Disclaimer visible near submit button, not buried.
5. PRIVACY_POLICY_PRESENT (10pts): Accessible policy addressing phone/text contact and data sharing.
6. SHARED_LEAD_WARNING (-15pts PENALTY if confirmed shared): Multi-buyer model, "up to X partners," aggregator language. 2024 FCC ruling makes this a structural liability.
7. OPT_OUT_LANGUAGE (5pts): Clear STOP/unsubscribe instructions present.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
STEP 4 — VERDICT THRESHOLDS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
75-100 → COMPLIANT
45-74 → REVIEW NEEDED
0-44 → HIGH RISK

NEVER return a score of 0 unless there is truly zero data of any kind. If SERP intel exists, use it to inform the score.

Return ONLY valid JSON:
{
  "score": <number 5-100>,
  "verdict": "COMPLIANT" | "REVIEW NEEDED" | "HIGH RISK",
  "vendor_tier": "ENTERPRISE" | "ESTABLISHED" | "UNKNOWN" | "SUSPICIOUS",
  "domain_age_signal": "<signals about how established this domain/company appears>",
  "is_shared_lead_vendor": <true|false>,
  "checks": {
    "prior_express_written_consent": { "pass": <true|false|null>, "points": <0 or 30>, "finding": "<specific finding or reason for UNCLEAR>" },
    "seller_identification": { "pass": <true|false|null>, "points": <0 or 15>, "finding": "<specific finding>" },
    "contact_method_disclosure": { "pass": <true|false|null>, "points": <0 or 15>, "finding": "<specific finding>" },
    "clear_conspicuous_placement": { "pass": <true|false|null>, "points": <0 or 15>, "finding": "<specific finding>" },
    "privacy_policy_present": { "pass": <true|false|null>, "points": <0 or 10>, "finding": "<specific finding>" },
    "shared_lead_warning": { "pass": <true|false|null>, "points": <0 or -15>, "finding": "<specific finding — use SERP intel and business model knowledge if pages unavailable>" },
    "opt_out_language": { "pass": <true|false|null>, "points": <0 or 5>, "finding": "<specific finding>" }
  },
  "reputation_intel": "<2-3 sentences on SERP intelligence — complaints, lawsuits, BBB issues, or clean record. Note age of any litigation.>",
  "recommendations": [
    { "priority": "CRITICAL" | "HIGH" | "MEDIUM", "title": "<short title>", "detail": "<specific actionable recommendation tailored to this vendor and tier>" }
  ],
  "generated_language": {
    "tcpa_disclaimer": "<Complete ready-to-use TCPA disclaimer with PEWC language, [COMPANY NAME] placeholder, contact method, and opt-out>",
    "vendor_demand_letter": "<Short professional paragraph to send to this vendor demanding specific compliance documentation or fixes>",
    "opt_out_line": "<Single ready-to-use opt-out disclosure line>"
  },
  "summary": "<3-4 sentences plain English summary of compliance picture, vendor tier, key risks, and what the agent should do next>"
}`

  const response = await anthropic.messages.create({
    model: 'claude-sonnet-4-5',
    max_tokens: 2500,
    messages: [{ role: 'user', content: prompt }],
  })

  const text = response.content[0].type === 'text' ? response.content[0].text : ''
  const jsonMatch = text.match(/\{[\s\S]*\}/)
  if (!jsonMatch) throw new Error('Failed to parse Claude analysis')
  return JSON.parse(jsonMatch[0])
}

export async function GET(req: NextRequest) {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const id = req.nextUrl.searchParams.get('id')

  if (id) {
    // Fetch single scan by ID
    const { data, error } = await supabase
      .from('prometheus_scans')
      .select('*')
      .eq('id', id)
      .eq('clerk_id', userId)
      .single()
    if (error || !data) return NextResponse.json({ error: 'Not found' }, { status: 404 })
    return NextResponse.json({ scan: data })
  }

  // Fetch recent scans for this user
  const { data, error } = await supabase
    .from('prometheus_scans')
    .select('id, domain, score, verdict, vendor_tier, is_shared_lead, pages_scanned, created_at')
    .eq('clerk_id', userId)
    .order('created_at', { ascending: false })
    .limit(20)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ scans: data || [] })
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

    const { data: saved, error: saveError } = await supabase
      .from('prometheus_scans')
      .insert({
        clerk_id: userId,
        domain: cleanDomain,
        score: analysis.score,
        verdict: analysis.verdict,
        vendor_tier: analysis.vendor_tier || 'UNKNOWN',
        is_shared_lead: analysis.is_shared_lead_vendor || false,
        pages_scanned: pages.foundPages,
        analysis_json: analysis,
      })
      .select('id')
      .single()

    if (saveError) console.error('Supabase save error:', saveError)

    return NextResponse.json({
      id: saved?.id || null,
      domain: cleanDomain,
      pages: pages.foundPages,
      analysis,
    })
  } catch (err: any) {
    console.error('Prometheus scan error:', err)
    return NextResponse.json({ error: err.message || 'Scan failed' }, { status: 500 })
  }
}
