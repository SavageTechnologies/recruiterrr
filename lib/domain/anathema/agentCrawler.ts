// ─── lib/domain/anathema/agentCrawler.ts ─────────────────────────────────────
// Crawls an insurance agent's website to extract relationship intelligence.
//
// Strategy:
//   1. Fetch homepage → extract nav links + raw HTML for social/carrier signals
//   2. Hit sitemap → get real page URLs (no guessing)
//   3. Score and crawl relevant pages (about, team, partners, carriers, etc.)
//   4. Extract: owner names, FMO/upline mentions, carrier logos, membership orgs
//
// Returns structured intel that feeds directly into evidence gathering.
// Max 5 pages — agent sites are small. We want signal, not volume.

import { safeFetch, fetchPageText, extractPageText } from '@/lib/fetch'
import { parseSitemap, extractNavLinks, scoreSlug } from '@/lib/domain/prometheus/crawler'

// ─── TYPES ────────────────────────────────────────────────────────────────────

export type AgentSiteIntel = {
  ownerNames: string[]          // People found on the site — used for targeted SERP
  fmoMentions: string[]         // Named FMOs, IMOs, or upline orgs mentioned
  carrierMentions: string[]     // Insurance carriers (logos, text mentions)
  membershipOrgs: string[]      // NAMSMAP, NAIFA, chamber, etc.
  relationshipPhrases: string[] // "appointed through", "partnered with", "member of"
  fullText: string              // All crawled text combined — for Claude
  pagesFound: string[]          // Which pages were actually crawled
  socialUrls: {                 // Social links found on the site
    facebook: string | null
    youtube: string | null
    linkedin: string | null
    instagram: string | null
  }
}

// ─── SLUG SCORING FOR AGENT SITES ─────────────────────────────────────────────
// Different from Prometheus — we want pages about the people and their affiliations

const AGENT_RELEVANT_SLUGS = [
  'about', 'about-us', 'our-story', 'meet', 'team', 'staff', 'agent',
  'who-we-are', 'founder', 'owner', 'principal',
  'partners', 'affiliates', 'carriers', 'our-carriers', 'companies',
  'memberships', 'associations', 'certifications', 'credentials',
  'contact', 'bio',
]

const AGENT_SKIP_PATTERNS = [
  /wp-login/, /wp-admin/, /wp-json/, /wp-content/,
  /cdn-cgi/, /sitemap/, /\.xml$/, /feed\//,
  /privacy/, /terms/, /cookie/, /disclaimer/,
  /blog/, /news/, /article/, /post\/\d/, /\?/, /#/,
  /medicare-101/, /medicare-explained/, /resources/, /faq/,
]

function scoreAgentSlug(slug: string): number {
  const s = slug.toLowerCase()
  return AGENT_RELEVANT_SLUGS.filter(k => s.includes(k)).length
}

// ─── OWNER NAME EXTRACTION ─────────────────────────────────────────────────────
// Looks for patterns like "John Smith, Founder" or "Meet Jane Doe"
// Keeps it simple — we just need enough to run a targeted SERP search

function extractOwnerNames(text: string, agentName: string): string[] {
  const names: string[] = []
  const agencyWords = agentName.toLowerCase().split(/\s+/)

  // Pattern: Title Case Name followed by role indicators
  const rolePattern = /([A-Z][a-z]+ (?:[A-Z][a-z]+ )?[A-Z][a-z]+)[,\s]+(?:is the |is an? )?(?:founder|owner|principal|president|ceo|agent|broker|advisor|director|manager)/gi
  let m
  while ((m = rolePattern.exec(text)) !== null) {
    const name = m[1].trim()
    // Skip if name words overlap too much with agency name
    const nameWords = name.toLowerCase().split(/\s+/)
    const overlap = nameWords.filter(w => agencyWords.includes(w) && w.length > 3).length
    if (overlap < nameWords.length && name.split(' ').length >= 2) {
      names.push(name)
    }
  }

  // Pattern: "Meet [Name]" or "About [Name]"
  const meetPattern = /(?:meet|about|introducing)\s+([A-Z][a-z]+ (?:[A-Z][a-z]+ )?[A-Z][a-z]+)/gi
  while ((m = meetPattern.exec(text)) !== null) {
    const name = m[1].trim()
    if (name.split(' ').length >= 2 && !names.includes(name)) {
      names.push(name)
    }
  }

  return [...new Set(names)].slice(0, 3)
}

// ─── FMO / UPLINE MENTION EXTRACTION ─────────────────────────────────────────
// Looks for relationship language near organization names

const RELATIONSHIP_TRIGGERS = [
  'appointed through', 'contracted with', 'writing under', 'upline',
  'field marketing', 'marketing organization', 'FMO', 'IMO', 'NMO',
  'general agent', 'managing general', 'partnered with', 'member of',
  'proud member', 'affiliated with', 'in partnership with',
  'sponsored by', 'supported by', 'backed by',
]

function extractRelationshipPhrases(text: string): string[] {
  const found: string[] = []
  const lower = text.toLowerCase()

  for (const trigger of RELATIONSHIP_TRIGGERS) {
    const idx = lower.indexOf(trigger.toLowerCase())
    if (idx === -1) continue
    // Grab 120 chars of context around the trigger
    const start = Math.max(0, idx - 20)
    const end = Math.min(text.length, idx + trigger.length + 100)
    const context = text.slice(start, end).replace(/\s+/g, ' ').trim()
    if (context.length > 10) found.push(context)
  }

  return [...new Set(found)].slice(0, 8)
}

// ─── CARRIER EXTRACTION ────────────────────────────────────────────────────────

const KNOWN_CARRIERS = [
  'Aetna', 'Humana', 'UnitedHealthcare', 'UHC', 'Cigna', 'Anthem', 'BCBS', 'Blue Cross',
  'Mutual of Omaha', 'Medico', 'Manhattan Life', 'Wellcare', 'Centene',
  'Allstate', 'Transamerica', 'Americo', 'Gerber Life', 'AIG', 'Foresters',
  'American Equity', 'Athene', 'North American', 'Global Atlantic',
  'Nationwide', 'Pacific Life', 'Allianz', 'Midland National',
  'Devoted Health', 'Alignment Health', 'Clover Health',
  'CVS Health', 'Molina', 'Elevance',
]

function extractCarriers(text: string): string[] {
  const found: string[] = []
  for (const carrier of KNOWN_CARRIERS) {
    if (text.toLowerCase().includes(carrier.toLowerCase())) {
      found.push(carrier)
    }
  }
  return found
}

// ─── MEMBERSHIP / ASSOCIATION EXTRACTION ──────────────────────────────────────

const KNOWN_ORGS = [
  'NAMSMAP', 'NAIFA', 'NAHU', 'AHIP', 'Better Business Bureau', 'BBB',
  'Chamber of Commerce', 'NACG', 'FFL', 'Family First Life',
  'Integrity', 'AmeriLife', 'Senior Market Sales', 'SMS',
  'Advisors Excel', 'Pinnacle Financial', 'PHP Agency',
  'USABG', 'NAAIP', 'MedicareCENTER', 'IntegrityCONNECT',
]

function extractMemberships(text: string): string[] {
  const found: string[] = []
  for (const org of KNOWN_ORGS) {
    if (text.toLowerCase().includes(org.toLowerCase())) {
      found.push(org)
    }
  }
  return found
}

// ─── SOCIAL LINK EXTRACTION ────────────────────────────────────────────────────

function extractSocialUrls(html: string) {
  const fb = html.match(/https?:\/\/(?:www\.)?facebook\.com\/(?!sharer|share)[^\s"'<>]+/)?.[0]?.replace(/['">,]+$/, '') || null
  const yt = html.match(/https?:\/\/(?:www\.)?youtube\.com\/(?:channel\/|@|c\/|user\/)[^\s"'<>]+/)?.[0]?.replace(/['">,]+$/, '') || null
  const li = html.match(/https?:\/\/(?:www\.)?linkedin\.com\/(?:in|company)\/[^\s"'<>]+/)?.[0]?.replace(/['">,]+$/, '') || null
  const ig = html.match(/https?:\/\/(?:www\.)?instagram\.com\/[^\s"'<>]+/)?.[0]?.replace(/['">,]+$/, '') || null
  return { facebook: fb, youtube: yt, linkedin: li, instagram: ig }
}

// ─── MAIN CRAWLER ─────────────────────────────────────────────────────────────

export async function crawlAgentSite(
  websiteUrl: string,
  agentName: string,
): Promise<AgentSiteIntel> {
  const empty: AgentSiteIntel = {
    ownerNames: [], fmoMentions: [], carrierMentions: [],
    membershipOrgs: [], relationshipPhrases: [], fullText: '',
    pagesFound: [], socialUrls: { facebook: null, youtube: null, linkedin: null, instagram: null },
  }

  try {
    const parsed = new URL(websiteUrl)
    const baseUrl = `${parsed.protocol}//${parsed.hostname}`
    const MAX_PAGES = 5

    // Step 1: Fetch homepage — need raw HTML for social/nav extraction
    const homepageRes = await safeFetch(baseUrl + '/', { timeoutMs: 7000 }).catch(() => null)
    if (!homepageRes?.ok) return empty

    const homepageHtml = await homepageRes.text().catch(() => '')
    if (!homepageHtml || homepageHtml.length < 200) return empty

    const homepageText = extractPageText(homepageHtml, 5000)
    const socialUrls = extractSocialUrls(homepageHtml)
    const allPageTexts: string[] = [homepageText]
    const pagesFound: string[] = ['/']

    // Step 2: Discover real URLs — sitemap first, nav links as fallback
    const [sitemapUrls, navSlugs] = await Promise.all([
      parseSitemap(baseUrl),
      Promise.resolve(extractNavLinks(homepageHtml, baseUrl)),
    ])

    const base = new URL(baseUrl)
    const sitemapSlugs = sitemapUrls
      .filter(u => { try { return new URL(u).hostname === base.hostname } catch { return false } })
      .map(u => { try { return new URL(u).pathname } catch { return null } })
      .filter((p): p is string => !!p && p !== '/')

    const discovered = [...new Set([...sitemapSlugs, ...navSlugs])]
      .filter(s => s !== '/' && !AGENT_SKIP_PATTERNS.some(p => p.test(s)))
      .sort((a, b) => scoreAgentSlug(b) - scoreAgentSlug(a))
      .slice(0, 20)

    // Step 3: Crawl relevant pages in parallel batches
    const BATCH = 3
    for (let i = 0; i < discovered.length && pagesFound.length < MAX_PAGES; i += BATCH) {
      const batch = discovered.slice(i, i + BATCH)
      await Promise.all(batch.map(async slug => {
        if (pagesFound.length >= MAX_PAGES) return
        const text = await fetchPageText(baseUrl + slug, 4000, 5000)
        if (text.length > 200) {
          allPageTexts.push(`[PAGE: ${slug}]\n${text}`)
          pagesFound.push(slug)
        }
      }))
    }

    const fullText = allPageTexts.join('\n\n').slice(0, 15000)

    // Step 4: Extract intelligence from everything we crawled
    const ownerNames = extractOwnerNames(fullText, agentName)
    const relationshipPhrases = extractRelationshipPhrases(fullText)
    const carrierMentions = extractCarriers(fullText)
    const membershipOrgs = extractMemberships(fullText)

    // FMO mentions = membership orgs that are actually distribution orgs
    const fmoMentions = membershipOrgs.filter(o =>
      ['FMO', 'IMO', 'Integrity', 'AmeriLife', 'SMS', 'Senior Market Sales',
       'Advisors Excel', 'Pinnacle', 'PHP', 'USABG', 'Family First Life', 'FFL',
       'MedicareCENTER', 'IntegrityCONNECT', 'NAAIP'].some(k =>
         o.toLowerCase().includes(k.toLowerCase())
       )
    )

    return {
      ownerNames,
      fmoMentions,
      carrierMentions,
      membershipOrgs,
      relationshipPhrases,
      fullText,
      pagesFound,
      socialUrls,
    }
  } catch {
    return empty
  }
}
