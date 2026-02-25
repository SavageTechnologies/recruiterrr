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
  const prompt = `You are a TCPA compliance expert analyzing a lead generation website for an independent insurance agent who wants to know if it is safe to buy leads from this vendor.

DOMAIN: ${domain}
PAGES SCANNED: ${pages.foundPages.join(', ')}

HOMEPAGE TEXT:
${pages.homepage || 'Could not fetch homepage.'}

PRIVACY POLICY TEXT:
${pages.privacy || 'No privacy policy page found.'}

LEAD FORM / CONTACT PAGE TEXT:
${pages.leadForm || 'No lead capture page found.'}

SERP INTELLIGENCE (complaints, lawsuits, reputation):
${serpIntel || 'No external intelligence gathered.'}

Analyze this website for TCPA compliance across these 7 criteria. For each, determine if it PASSES, FAILS, or is UNCLEAR, and provide a specific finding citing actual text found (or noting its absence).

CRITERIA:
1. PRIOR_EXPRESS_WRITTEN_CONSENT (30pts): Does the opt-in form have explicit PEWC language where the consumer consents to be contacted by phone/text? Look for phrases like "prior express written consent", "I agree to be contacted", "By submitting", consent checkboxes.
2. SELLER_IDENTIFICATION (15pts): Is the actual company or agent who will be calling clearly named in the consent language? "A licensed agent may contact you" is NOT enough — a specific named entity is required.
3. CONTACT_METHOD_DISCLOSURE (15pts): Does the consent specify HOW they'll be contacted — calls, texts, autodialer, prerecorded messages?
4. CLEAR_CONSPICUOUS_PLACEMENT (15pts): Is the disclaimer near the submit button and visible, not buried in fine print or a separate page nobody reads?
5. PRIVACY_POLICY_PRESENT (10pts): Does a privacy policy exist, is it accessible, and does it address phone/text contact and data sharing?
6. SHARED_LEAD_WARNING (10pts — NEGATIVE if shared): Does the form indicate leads are sold to multiple buyers? Look for "up to X partners", "marketing partners", multiple company logos, or shared/aggregator language. This is a RED FLAG per 2024 FCC ruling.
7. OPT_OUT_LANGUAGE (5pts): Is there clear opt-out language — "Reply STOP", unsubscribe instructions, or similar?

Also analyze the SERP INTELLIGENCE for any complaint patterns, lawsuit history, or BBB issues.

Return ONLY valid JSON in this exact format:
{
  "score": <0-100 number>,
  "verdict": "COMPLIANT" | "REVIEW NEEDED" | "HIGH RISK",
  "domain_age_signal": "<any signals about how established this domain/company appears>",
  "is_shared_lead_vendor": <true|false>,
  "checks": {
    "prior_express_written_consent": { "pass": <true|false|null>, "points": <0 or 30>, "finding": "<specific finding with quoted text if found>" },
    "seller_identification": { "pass": <true|false|null>, "points": <0 or 15>, "finding": "<specific finding>" },
    "contact_method_disclosure": { "pass": <true|false|null>, "points": <0 or 15>, "finding": "<specific finding>" },
    "clear_conspicuous_placement": { "pass": <true|false|null>, "points": <0 or 15>, "finding": "<specific finding>" },
    "privacy_policy_present": { "pass": <true|false|null>, "points": <0 or 10>, "finding": "<specific finding>" },
    "shared_lead_warning": { "pass": <true|false|null>, "points": <0 or -15>, "finding": "<specific finding — flag if shared lead indicators found>" },
    "opt_out_language": { "pass": <true|false|null>, "points": <0 or 5>, "finding": "<specific finding>" }
  },
  "reputation_intel": "<2-3 sentences summarizing what the SERP intelligence revealed — complaints, lawsuits, BBB issues, or clean record>",
  "recommendations": [
    { "priority": "CRITICAL" | "HIGH" | "MEDIUM", "title": "<short title>", "detail": "<specific actionable recommendation>" }
  ],
  "generated_language": {
    "tcpa_disclaimer": "<A complete, ready-to-use TCPA compliant disclaimer they can send to this vendor or use on their own site. Must include PEWC language, seller identification placeholder [COMPANY NAME], contact method, and opt-out.>",
    "vendor_demand_letter": "<A short professional paragraph they can send to this vendor demanding specific fixes before purchasing more leads.>",
    "opt_out_line": "<A single ready-to-use opt-out disclosure line.>"
  },
  "summary": "<3-4 sentences plain English summary of the overall compliance picture and key risks for an independent insurance agent.>"
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

    // Fetch all pages
    const pages = await tryFetchPages(baseUrl)

    // Fetch SERP intelligence
    const serpIntel = await fetchSerpIntel(cleanDomain)

    // Run Claude TCPA analysis
    const analysis = await runClaudeAnalysis(cleanDomain, pages, serpIntel)

    // Save to Supabase
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
