export const runtime = 'nodejs'
export const maxDuration = 30

import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { isAdmin } from '@/lib/auth/access'

const ALLOWED_ORIGINS = ['https://recruiterrr.com', 'http://localhost:3000']

async function serpSearch(query: string): Promise<any[]> {
  const url = `https://serpapi.com/search.json?engine=google&q=${encodeURIComponent(query)}&num=5&api_key=${process.env.SERPAPI_KEY}`
  const res = await fetch(url, { signal: AbortSignal.timeout(8000) })
  if (!res.ok) return []
  const data = await res.json()
  return data.organic_results || []
}

function extractPhone(text: string): string | null {
  const match = text.match(/(\(?\d{3}\)?[\s\-.]?\d{3}[\s\-.]?\d{4})/)
  return match ? match[1].trim() : null
}

function extractEmail(text: string): string | null {
  const match = text.match(/[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}/)
  if (!match) return null
  const email = match[0]
  if (email.includes('sentry') || email.includes('example') || email.includes('noreply')) return null
  return email
}

function extractWebsite(results: any[]): string | null {
  for (const r of results) {
    const link = r.link || ''
    if (
      link.includes('facebook.com') || link.includes('yelp.com') ||
      link.includes('google.com') || link.includes('linkedin.com') ||
      link.includes('youtube.com') || link.includes('bbb.org')
    ) continue
    try {
      const u = new URL(link)
      return `${u.protocol}//${u.hostname}`
    } catch {}
  }
  return null
}

export async function POST(req: NextRequest) {
  const origin = req.headers.get('origin')
  if (!origin || !ALLOWED_ORIGINS.includes(origin)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (!isAdmin(userId)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  try {
    const { name, page_url, state } = await req.json()
    if (!name) return NextResponse.json({ error: 'Name required' }, { status: 400 })

    const stateStr = state ? ` ${state}` : ''

    // Run two searches in parallel — one for contact info, one for their website
    const [contactResults, siteResults] = await Promise.all([
      serpSearch(`"${name}"${stateStr} phone email insurance agent`),
      serpSearch(`"${name}"${stateStr} Medicare insurance`),
    ])

    const allResults = [...contactResults, ...siteResults]
    const allText = allResults.map(r => `${r.title || ''} ${r.snippet || ''} ${r.link || ''}`).join(' ')

    const phone = extractPhone(allText)
    const email = extractEmail(allText)
    const website = extractWebsite(allResults)

    const found = !!(phone || email || website)

    return NextResponse.json({ found, phone, email, website })

  } catch (err: any) {
    console.error('[/api/admin/adspy/contact] error:', err)
    return NextResponse.json({ error: err.message || 'Search failed' }, { status: 500 })
  }
}
