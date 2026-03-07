// ─── lib/domain/prometheus/crawler.ts ────────────────────────────────────────
// FMO site crawler for Prometheus scans.
// Strategy: sitemap → nav links → slug fallback. Fetches up to 10 pages.

import { fetchPageText, safeFetch, extractPageText } from '@/lib/fetch'

// Slug fallback when sitemap + nav yield fewer than 3 slugs
export const SLUG_FALLBACK = [
  '/', '/about', '/about-us', '/agents', '/for-agents', '/join', '/join-us',
  '/carriers', '/our-carriers', '/products', '/trips', '/incentive-trips',
  '/incentives', '/leads', '/lead-program', '/technology', '/tools',
  '/why-us', '/benefits', '/contact',
]

// Pages whose URLs match these patterns are never worth crawling
const SKIP_PATTERNS = [
  /wp-login/, /wp-admin/, /wp-json/, /wp-content/, /wp-includes/,
  /cdn-cgi/, /email-protection/, /sitemap/, /\.xml$/, /feed\//,
  /login/, /admin/, /dashboard/, /privacy-policy/, /terms/, /cookie/,
  /author\//, /tag\//, /category\//, /page\/\d/, /\?/, /#/,
]

// Keywords that indicate a page is worth crawling for intel
export const RELEVANT_KEYWORDS = [
  'agent', 'join', 'partner', 'carrier', 'product', 'trip', 'incentive',
  'lead', 'tech', 'tool', 'platform', 'crm', 'why', 'benefit', 'about',
  'resource', 'wholesal', 'advisor', 'recruit',
]

export function scoreSlug(slug: string): number {
  const s = slug.toLowerCase()
  return RELEVANT_KEYWORDS.filter(k => s.includes(k)).length
}

export async function parseSitemap(baseUrl: string): Promise<string[]> {
  const candidates = ['/sitemap.xml', '/sitemap_index.xml', '/sitemap']
  for (const path of candidates) {
    try {
      const res = await safeFetch(baseUrl + path, { timeoutMs: 5000 })
      if (!res.ok) continue
      const xml = await res.text()
      const locs = [...xml.matchAll(/<loc>\s*(https?:\/\/[^<]+)\s*<\/loc>/gi)]
        .map(m => m[1].trim())
      if (locs.length > 0) return locs
    } catch {}
  }
  return []
}

export function extractNavLinks(html: string, baseUrl: string): string[] {
  const navPattern = /<(?:nav|header|footer)[^>]*>([\s\S]*?)<\/(?:nav|header|footer)>/gi
  const hrefPattern = /href=["']([^"']+)["']/gi
  const links: string[] = []
  let navMatch
  while ((navMatch = navPattern.exec(html)) !== null) {
    let hrefMatch
    const section = navMatch[1]
    while ((hrefMatch = hrefPattern.exec(section)) !== null) {
      links.push(hrefMatch[1])
    }
  }
  let hrefMatch
  while ((hrefMatch = hrefPattern.exec(html)) !== null) {
    links.push(hrefMatch[1])
  }
  const base = new URL(baseUrl)
  return [...new Set(links)]
    .filter(href => {
      if (href.startsWith('#') || href.startsWith('mailto:') || href.startsWith('tel:')) return false
      try {
        const u = new URL(href, baseUrl)
        return u.hostname === base.hostname && u.pathname !== '/'
      } catch { return false }
    })
    .map(href => {
      try { return new URL(href, baseUrl).pathname } catch { return null }
    })
    .filter((p): p is string => !!p)
}

export async function crawlFMOSite(baseUrl: string): Promise<{ pages: Record<string, string>; foundPages: string[] }> {
  const pages: Record<string, string> = {}
  const foundPages: string[] = []
  const MAX_PAGES = 10

  // Always grab homepage first — needed for nav link extraction
  const homepageHtml = await safeFetch(baseUrl + '/', { timeoutMs: 7000 })
    .then(r => r.ok ? r.text() : '').catch(() => '')

  if (homepageHtml.length > 300) {
    const text = extractPageText(homepageHtml, 6000)
    pages['/'] = text
    foundPages.push('/')
  }

  const [sitemapUrls, navSlugs] = await Promise.all([
    parseSitemap(baseUrl),
    Promise.resolve(homepageHtml ? extractNavLinks(homepageHtml, baseUrl) : []),
  ])

  const base = new URL(baseUrl)
  const sitemapSlugs = sitemapUrls
    .filter(u => { try { return new URL(u).hostname === base.hostname } catch { return false } })
    .map(u => { try { return new URL(u).pathname } catch { return null } })
    .filter((p): p is string => !!p && p !== '/')

  const discoveredSlugs = [...new Set([...sitemapSlugs, ...navSlugs])]
  const useFallback = discoveredSlugs.length < 3

  const allSlugs = [...new Set([...discoveredSlugs, ...(useFallback ? SLUG_FALLBACK : [])])]
    .filter(s => s !== '/' && !foundPages.includes(s))
    .filter(s => !SKIP_PATTERNS.some(p => p.test(s)))
    .sort((a, b) => scoreSlug(b) - scoreSlug(a))
    .slice(0, 30)

  const BATCH = 4
  for (let i = 0; i < allSlugs.length && foundPages.length < MAX_PAGES; i += BATCH) {
    const batch = allSlugs.slice(i, i + BATCH)
    await Promise.all(batch.map(async slug => {
      if (foundPages.length >= MAX_PAGES) return
      const text = await fetchPageText(baseUrl + slug, 5000, 5000)
      if (text.length > 300) {
        pages[slug] = text
        foundPages.push(slug)
      }
    }))
    if (i + BATCH < allSlugs.length) await new Promise(r => setTimeout(r, 200))
  }

  return { pages, foundPages }
}
