import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'

export async function GET(req: NextRequest) {
  // Auth gate — no CSRF origin check needed for same-site GET requests
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const q = req.nextUrl.searchParams.get('q')?.trim()
  if (!q || q.length < 2) return NextResponse.json({ suggestions: [] })

  try {
    const url = `https://serpapi.com/search.json?engine=google_autocomplete&q=${encodeURIComponent(q)}&gl=us&hl=en&api_key=${process.env.SERPAPI_KEY}`
    const res = await fetch(url, { signal: AbortSignal.timeout(4000) })
    if (!res.ok) return NextResponse.json({ suggestions: [] })

    const data = await res.json()
    const suggestions: { city: string; state: string; label: string }[] = []

    for (const item of (data.suggestions || [])) {
      const raw: string = item.value || ''
      // Match "City, ST" optionally followed by ", United States" or similar
      const match = raw.match(/^([^,]+),\s*([A-Z]{2})(?:[,\s]|$)/)
      if (match) {
        const city = match[1].trim()
        const state = match[2].trim()
        if (/\d/.test(city)) continue // skip street addresses
        suggestions.push({ city, state, label: `${city}, ${state}` })
        if (suggestions.length >= 6) break
      }
    }

    return NextResponse.json({ suggestions })
  } catch {
    return NextResponse.json({ suggestions: [] })
  }
}
