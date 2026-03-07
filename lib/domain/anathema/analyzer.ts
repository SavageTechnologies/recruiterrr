// ─── lib/domain/anathema/analyzer.ts (rebuilt) ───────────────────────────────
// ANATHEMA analysis engine — rebuilt as a deep profile tool.
//
// Philosophy (new):
//   Find facts about this specific agent/agency from their public record.
//   Describe what exists. Never infer relationships from noise.
//   Identical anchoring rule to Prometheus: ignore anything not explicitly
//   about this entity.
//
// Pipeline:
//   1. gatherEvidence    — website crawl + 8 SERP queries in TRUE parallel
//   2. analyzeEvidence   — one Sonnet call → structured agent profile
//   3. detectAffiliation — deterministic exact-phrase scan → optional signal card

import { getAnthropicClient } from '@/lib/ai'
import { crawlAgentSite } from './agentCrawler'
import { fetchAgentSerpIntel, type AgentSerpDebugEntry } from './serp'

// ─── TYPES ────────────────────────────────────────────────────────────────────

export type PersonalHook = {
  source:    'FACEBOOK' | 'YOUTUBE' | 'SERP' | 'WEBSITE' | 'OTHER'
  fact:      string
  raw_quote: string
  usability: 'HIGH' | 'MED' | 'LOW'
  recency:   'RECENT' | 'DATED' | 'UNKNOWN'
}

export type AgentProfile = {
  display_name:         string
  owner_name:           string | null
  years_in_business:    string | null
  website:              string | null
  facebook_profile_url: string | null
  overview:             string
  production: {
    awards:       string[]
    recognitions: string[]
    credentials:  string[]
  }
  community: {
    local_ties:       string[]
    press_mentions:   string[]
    reputation_notes: string | null
  }
  recruiting: {
    actively_recruiting: boolean
    signals:             string[]
    target_profile:      string | null
  }
  career: {
    background:      string | null
    notable_history: string[]
  }
  personal_hooks:  PersonalHook[]
  data_confidence: 'HIGH' | 'MEDIUM' | 'LOW'
  confidence_note: string
  pages_crawled:   string[]
  serp_debug:      AgentSerpDebugEntry[]
}

// ─── AFFILIATION SIGNAL ───────────────────────────────────────────────────────
// Deterministic. No inference. Only fires on unambiguous proper nouns/product
// names that cannot appear in normal English without referring to the company.
//
// "integrity" alone is intentionally excluded — agents write "we operate with
// integrity" constantly and it has zero signal value. Full brand phrases only.

export type AffiliationSignal = {
  tree:           'integrity' | 'amerilife' | 'sms'
  matched_phrase: string
  context:        string
  source:         'website' | 'serp'
}

const AFFILIATION_PHRASES: Array<{ phrase: string; tree: 'integrity' | 'amerilife' | 'sms' }> = [
  // Integrity Marketing Group — full phrases only, never the word "integrity" alone
  { phrase: 'integrity marketing group', tree: 'integrity' },
  { phrase: 'integrityconnect',          tree: 'integrity' },
  { phrase: 'integrity connect',         tree: 'integrity' },
  { phrase: 'medicarecenter',            tree: 'integrity' },
  { phrase: 'medicare center',           tree: 'integrity' },
  { phrase: 'integrity.com',             tree: 'integrity' },
  { phrase: 'family first life',         tree: 'integrity' },
  { phrase: 'familyfirstlife',           tree: 'integrity' },
  { phrase: 'ffl agent',                 tree: 'integrity' },
  { phrase: 'ffl broker',               tree: 'integrity' },
  // AmeriLife — made-up word, safe at any length
  { phrase: 'amerilife',                 tree: 'amerilife' },
  { phrase: 'usabg',                     tree: 'amerilife' },
  { phrase: 'united senior benefits',    tree: 'amerilife' },
  { phrase: 'amerilife.com',             tree: 'amerilife' },
  // SMS — full phrase required, "senior market" alone is too generic
  { phrase: 'senior market sales',       tree: 'sms' },
  { phrase: 'seniormarketsales.com',     tree: 'sms' },
  { phrase: 'rethinking retirement',     tree: 'sms' },
  { phrase: 'sms partner',              tree: 'sms' },
  { phrase: 'sms affiliate',            tree: 'sms' },
  { phrase: 'sms family',              tree: 'sms' },
]

export function detectAffiliationSignal(evidenceBlob: string): AffiliationSignal | null {
  const lower = evidenceBlob.toLowerCase()

  for (const { phrase, tree } of AFFILIATION_PHRASES) {
    const idx = lower.indexOf(phrase)
    if (idx === -1) continue

    const start   = Math.max(0, idx - 30)
    const end     = Math.min(evidenceBlob.length, idx + phrase.length + 90)
    const context = evidenceBlob.slice(start, end).replace(/\s+/g, ' ').trim()
    const before  = lower.slice(0, idx)
    const source  = before.includes('=== agent website') ? 'website' : 'serp'

    return { tree, matched_phrase: phrase, context, source }
  }

  return null
}

// ─── STEP 1: GATHER EVIDENCE ──────────────────────────────────────────────────
// Website crawl + SERP fire in TRUE parallel — crawl no longer blocks SERP.

export async function gatherEvidence(
  agentName:    string,
  agentCity:    string,
  agentState:   string,
  agentWebsite: string | null,
  serpKey:      string,
  socialFbUrl:  string | null,
): Promise<{
  evidenceBlob:         string
  facebookProfileUrl:   string | null
  ownerNames:           string[]
  websitePagesFound:    string[]
  serpDebug:            AgentSerpDebugEntry[]
}> {
  const [websiteIntel, serpResult] = await Promise.all([
    agentWebsite
      ? crawlAgentSite(agentWebsite, agentName).catch(() => null)
      : Promise.resolve(null),
    fetchAgentSerpIntel(agentName, agentCity, agentState, null, agentWebsite, serpKey),
  ])

  const ownerNames = websiteIntel?.ownerNames || []

  let facebookProfileUrl = socialFbUrl || websiteIntel?.socialUrls.facebook || null
  if (!facebookProfileUrl) {
    const socialDebug = serpResult.serpDebug.find(d => d.key === 'social')
    const fbResult = (socialDebug?.results || []).find(r =>
      r.link?.includes('facebook.com') &&
      !r.link.includes('facebook.com/sharer') &&
      !r.link.includes('facebook.com/share'),
    )
    if (fbResult?.link) facebookProfileUrl = fbResult.link
  }

  const sections: string[] = []

  if (websiteIntel?.fullText) {
    sections.push(
      `=== AGENT WEBSITE (${agentWebsite}) ===\nPages crawled: ${websiteIntel.pagesFound.join(', ')}\n${websiteIntel.fullText}`,
    )
    if (websiteIntel.ownerNames.length > 0)
      sections.push(`OWNER/PRINCIPAL NAMES ON SITE: ${websiteIntel.ownerNames.join(', ')}`)
    if (websiteIntel.carrierMentions.length > 0)
      sections.push(`CARRIERS ON SITE: ${websiteIntel.carrierMentions.join(', ')}`)
    if (websiteIntel.membershipOrgs.length > 0)
      sections.push(`ORGANIZATIONS MENTIONED: ${websiteIntel.membershipOrgs.join(', ')}`)
    if (websiteIntel.relationshipPhrases.length > 0)
      sections.push(`RELATIONSHIP LANGUAGE:\n${websiteIntel.relationshipPhrases.map(p => `- ${p}`).join('\n')}`)
  }

  for (const entry of serpResult.serpDebug) {
    if (entry.results.length === 0) continue
    const label = entry.key.toUpperCase().replace('_', ' ')
    const snippets = entry.results.map(r => `[${r.title}] ${r.snippet} | ${r.link}`).join('\n')
    sections.push(`=== SERP: ${label} ===\n${snippets}`)
  }

  const evidenceBlob = sections.join('\n\n').slice(0, 14000)

  return {
    evidenceBlob,
    facebookProfileUrl,
    ownerNames,
    websitePagesFound: websiteIntel?.pagesFound || [],
    serpDebug: serpResult.serpDebug,
  }
}

// ─── STEP 2: ANALYZE EVIDENCE ─────────────────────────────────────────────────

export async function analyzeEvidence(
  agentName:    string,
  agentCity:    string,
  agentState:   string,
  agentWebsite: string | null,
  evidenceBlob: string,
  ownerNames:   string[],
  pagesFound:   string[],
): Promise<AgentProfile> {
  const fallback: AgentProfile = {
    display_name: agentName, owner_name: ownerNames[0] || null,
    years_in_business: null, website: agentWebsite, facebook_profile_url: null,
    overview: 'Insufficient public data found for this agent.',
    production: { awards: [], recognitions: [], credentials: [] },
    community: { local_ties: [], press_mentions: [], reputation_notes: null },
    recruiting: { actively_recruiting: false, signals: [], target_profile: null },
    career: { background: null, notable_history: [] },
    personal_hooks: [], data_confidence: 'LOW',
    confidence_note: 'No website found and SERP returned no relevant results.',
    pages_crawled: pagesFound, serp_debug: [],
  }

  const prompt = `You are an intelligence analyst building a recruiter briefing on an insurance agent. Extract FACTS from public evidence only. If a fact isn't in the data, return null or empty — never invent.

CRITICAL RULE: You are analyzing "${agentName}" ONLY.${ownerNames.length > 0 ? ` The owner/principal is ${ownerNames.join(', ')}.` : ''} Ignore any content that does not explicitly mention "${agentName}"${ownerNames.length > 0 ? ` or ${ownerNames.join(' or ')}` : ''}. Do not extract facts about other agencies or people.

AGENT: ${agentName}${ownerNames.length > 0 ? `\nOWNER/PRINCIPAL: ${ownerNames.join(', ')}` : ''}
LOCATION: ${[agentCity, agentState].filter(Boolean).join(', ')}
WEBSITE: ${agentWebsite || 'Not found'}
PAGES CRAWLED: ${pagesFound.join(', ') || 'None'}

EVIDENCE:
${evidenceBlob.slice(0, 10000)}

━━━ EXTRACTION RULES ━━━

personal_hooks — Only facts that give a recruiter a genuine conversation opener:
KEEP: Community events they hosted/attended/sponsored recently, awards, unusual bio details (military, career change, bilingual, nonprofit), recent accomplishments, specific memorable client reviews.
DISCARD: Generic Medicare explainers, holiday posts, regulatory boilerplate, anything that could describe any insurance agent anywhere.

production — Awards, rankings, leaderboard appearances. Specific names and years when available.

community — Local sponsorships, charity, chamber of commerce, local press. Not national industry content.

recruiting — Is this agent recruiting other agents? Job postings, "join my team," downline content = actively_recruiting: true.

career — Prior career before insurance, how they entered the business. Only if explicitly stated.

data_confidence — HIGH = 3+ pages crawled + multiple SERP hits. MEDIUM = website found OR solid SERP. LOW = no site + sparse SERP.

Return ONLY valid JSON, no markdown:
{
  "display_name": "<official name as found, or input name>",
  "owner_name": "<individual owner name, or null>",
  "years_in_business": "<e.g. '12 years' or 'Founded 2008' — or null>",
  "website": "<domain or null>",
  "facebook_profile_url": "<FB URL if found in evidence — or null>",
  "overview": "<2-3 sentences: who they are, how long, what market, geographic focus. Use specific numbers when found.>",
  "production": {
    "awards": ["award name year"],
    "recognitions": ["leaderboard or ranking details"],
    "credentials": ["CLTC, LUTCF, or other designations found"]
  },
  "community": {
    "local_ties": ["specific sponsorships, charities, events"],
    "press_mentions": ["specific press or local news mentions"],
    "reputation_notes": "<BBB rating, Google review summary, or null>"
  },
  "recruiting": {
    "actively_recruiting": true | false,
    "signals": ["specific recruiting evidence"],
    "target_profile": "<type of person they recruit — or null>"
  },
  "career": {
    "background": "<prior career or entry into insurance — or null>",
    "notable_history": ["specific past roles or transitions if found"]
  },
  "personal_hooks": [
    {
      "source": "FACEBOOK" | "YOUTUBE" | "SERP" | "WEBSITE" | "OTHER",
      "fact": "<plain English — what a recruiter would say>",
      "raw_quote": "<exact text from source, under 200 chars>",
      "usability": "HIGH" | "MED" | "LOW",
      "recency": "RECENT" | "DATED" | "UNKNOWN"
    }
  ],
  "data_confidence": "HIGH" | "MEDIUM" | "LOW",
  "confidence_note": "<honest 1 sentence about data quality>"
}`

  try {
    const anthropic = getAnthropicClient()
    const res = await anthropic.messages.create({
      model: 'claude-sonnet-4-6', max_tokens: 4500,
      messages: [{ role: 'user', content: prompt }],
    })

    const raw   = ((res.content[0] as any).text || '').trim()
    const match = raw.match(/\{[\s\S]*\}/)
    if (!match) throw new Error('No JSON in response')
    const p = JSON.parse(match[0])

    return {
      display_name:         p.display_name      || agentName,
      owner_name:           p.owner_name        || ownerNames[0] || null,
      years_in_business:    p.years_in_business || null,
      website:              p.website           || agentWebsite,
      facebook_profile_url: p.facebook_profile_url || null,
      overview:             p.overview          || '',
      production: {
        awards:       Array.isArray(p.production?.awards)       ? p.production.awards       : [],
        recognitions: Array.isArray(p.production?.recognitions) ? p.production.recognitions : [],
        credentials:  Array.isArray(p.production?.credentials)  ? p.production.credentials  : [],
      },
      community: {
        local_ties:       Array.isArray(p.community?.local_ties)     ? p.community.local_ties     : [],
        press_mentions:   Array.isArray(p.community?.press_mentions) ? p.community.press_mentions : [],
        reputation_notes: p.community?.reputation_notes || null,
      },
      recruiting: {
        actively_recruiting: p.recruiting?.actively_recruiting === true,
        signals:             Array.isArray(p.recruiting?.signals) ? p.recruiting.signals : [],
        target_profile:      p.recruiting?.target_profile || null,
      },
      career: {
        background:      p.career?.background || null,
        notable_history: Array.isArray(p.career?.notable_history) ? p.career.notable_history : [],
      },
      personal_hooks: Array.isArray(p.personal_hooks)
        ? p.personal_hooks.filter((h: any) =>
            typeof h.fact === 'string' &&
            ['FACEBOOK','YOUTUBE','SERP','WEBSITE','OTHER'].includes(h.source) &&
            ['HIGH','MED','LOW'].includes(h.usability) &&
            ['RECENT','DATED','UNKNOWN'].includes(h.recency),
          )
        : [],
      data_confidence: ['HIGH','MEDIUM','LOW'].includes(p.data_confidence) ? p.data_confidence : 'LOW',
      confidence_note: p.confidence_note || '',
      pages_crawled:   pagesFound,
      serp_debug:      [],
    }
  } catch (err) {
    console.error('[analyzeEvidence] failed:', err instanceof Error ? err.message : err)
    return fallback
  }
}
