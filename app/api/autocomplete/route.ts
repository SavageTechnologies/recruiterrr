import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'

const ALLOWED_ORIGINS = ['https://recruiterrr.com', 'http://localhost:3000']

export async function GET(req: NextRequest) {
  const origin = req.headers.get('origin')
  if (!origin || !ALLOWED_ORIGINS.includes(origin)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const q = req.nextUrl.searchParams.get('q')?.trim()
  if (!q || q.length < 2) return NextResponse.json({ suggestions: [] })

  try {
    // SerpAPI google_autocomplete returns place suggestions as the user types.
    // We filter to US cities only on our side.
    const url = `https://serpapi.com/search.json?engine=google_autocomplete&q=${encodeURIComponent(q)}&gl=us&hl=en&api_key=${process.env.SERPAPI_KEY}`
    const res = await fetch(url, { signal: AbortSignal.timeout(4000) })
    if (!res.ok) return NextResponse.json({ suggestions: [] })

    const data = await res.json()

    // Each suggestion looks like: { value: "Tampa, FL, United States", type: "... city ..." }
    // We parse out "City, ST" and drop anything that doesn't look like a US city+state pair.
    const suggestions: { city: string; state: string; label: string }[] = []

    for (const item of (data.suggestions || [])) {
      const raw: string = item.value || ''

      // Match "City, ST" or "City, State" optionally followed by ", United States"
      const match = raw.match(/^([^,]+),\s*([A-Z]{2})(?:,|$)/)
      if (match) {
        const city = match[1].trim()
        const state = match[2].trim()
        suggestions.push({ city, state, label: `${city}, ${state}` })
        if (suggestions.length >= 6) break
      }
    }

    return NextResponse.json({ suggestions })
  } catch {
    return NextResponse.json({ suggestions: [] })
  }
}
