// ─── crawl.ts ─────────────────────────────────────────────────────────────────
// Website crawler — homepage + /about in parallel.
// Extracts: plain text, contact email, social links, YouTube channel link.
// Jobs and YouTube SERP lookups are NOT here — they run in backgroundEnrich.ts.

import { fetchPageText } from '@/lib/fetch'
import type { WebsiteIntel } from './types'

export function extractEmails(text: string): string[] {
  const matches = text.match(/[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}/g) || []
  return [...new Set(matches)].filter(e =>
    !e.includes('noreply') && !e.includes('no-reply') && !e.includes('@sentry') &&
    !e.includes('@example') && !e.includes('@schema') && e.length < 60
  ).slice(0, 3)
}

export function extractSocialLinks(html: string): string[] {
  const links: string[] = []
  const patterns = [
    /https?:\/\/(?:www\.)?facebook\.com\/[^"'\s>]+/g,
    /https?:\/\/(?:www\.)?linkedin\.com\/(?:in|company)\/[^"'\s>]+/g,
    /https?:\/\/(?:www\.)?instagram\.com\/[^"'\s>]+/g,
    /https?:\/\/(?:www\.)?(?:twitter|x)\.com\/[^"'\s>]+/g,
  ]
  for (const p of patterns) {
    for (const m of (html.match(p) || [])) {
      const clean = m.replace(/['",>]+$/, '')
      if (!links.includes(clean) && !clean.includes('sharer') && !clean.includes('intent')) {
        links.push(clean)
      }
    }
  }
  return links.slice(0, 4)
}

export function extractYouTubeLink(html: string): string | null {
  const pattern = /https?:\/\/(?:www\.)?youtube\.com\/(channel\/[A-Za-z0-9_-]+|@[A-Za-z0-9_.-]+|c\/[A-Za-z0-9_-]+|user\/[A-Za-z0-9_-]+)/g
  for (const m of (html.match(pattern) || [])) {
    const clean = m.replace(/['",>]+$/, '')
    if (!clean.includes('/embed') && !clean.includes('youtube.com/t/') && !clean.includes('youtube.com/about')) {
      return clean
    }
  }
  return null
}

export async function crawlWebsite(rawUrl: string): Promise<WebsiteIntel> {
  const empty: WebsiteIntel = { fullText: '', email: null, socialLinks: [], youtubeLink: null }
  try {
    const parsed = new URL(rawUrl)
    if (!['http:', 'https:'].includes(parsed.protocol)) return empty
    const base = `${parsed.protocol}//${parsed.hostname}`

    const [homeHtml, aboutText] = await Promise.all([
      (async () => {
        try {
          const res = await fetch(rawUrl, {
            headers: { 'User-Agent': 'Mozilla/5.0 (compatible; Recruiterrr/1.0)' },
            signal: AbortSignal.timeout(5000),
            redirect: 'follow',
          })
          if (!res.ok) return ''
          const reader = res.body?.getReader()
          if (!reader) return ''
          let html = ''; let bytes = 0
          while (true) {
            const { done, value } = await reader.read()
            if (done) break
            bytes += value.length
            html += new TextDecoder().decode(value)
            if (bytes > 400_000) { reader.cancel(); break }
          }
          return html
        } catch { return '' }
      })(),
      Promise.all([
        fetchPageText(`${base}/about`, 2000, 4000),
        fetchPageText(`${base}/about-us`, 2000, 4000),
      ]).then(([a, b]) => a || b || ''),
    ])

    const homeText = homeHtml
      .replace(/<script[\s\S]*?<\/script>/gi, '')
      .replace(/<style[\s\S]*?<\/style>/gi, '')
      .replace(/<[^>]+>/g, ' ')
      .replace(/\s+/g, ' ')
      .trim()
      .slice(0, 2000)

    const allText = homeText + ' ' + aboutText
    const email = extractEmails(allText)[0] || null
    const socialLinks = extractSocialLinks(homeHtml)
    const youtubeLink = extractYouTubeLink(homeHtml)

    const fullText = [
      homeText ? `HOMEPAGE: ${homeText}` : '',
      aboutText ? `ABOUT: ${aboutText}` : '',
    ].filter(Boolean).join('\n\n').slice(0, 4000)

    return { fullText, email, socialLinks, youtubeLink }
  } catch { return empty }
}
