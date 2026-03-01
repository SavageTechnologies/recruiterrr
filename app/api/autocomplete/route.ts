import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { supabase } from '@/lib/supabase.server'

export async function GET(req: NextRequest) {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const q = req.nextUrl.searchParams.get('q')?.trim()
  if (!q || q.length < 2) return NextResponse.json({ suggestions: [] })

  try {
    // Prefix match on city name, ordered by population so bigger cities surface first.
    // Deduplicate by city+state — multiple zips can share the same city name.
    const { data, error } = await supabase
      .from('us_cities')
      .select('city, state_id, state_name, county_name, population')
      .ilike('city', `${q}%`)
      .order('population', { ascending: false })
      .limit(50) // fetch more than we need so dedup has enough to work with

    if (error || !data) return NextResponse.json({ suggestions: [] })

    // Deduplicate by city+state, keep highest-population row for each
    const seen = new Set<string>()
    const suggestions: { city: string; state: string; state_name: string; county: string; label: string }[] = []

    for (const row of data) {
      const key = `${row.city.toLowerCase()}|${row.state_id}`
      if (seen.has(key)) continue
      seen.add(key)

      suggestions.push({
        city:       row.city,
        state:      row.state_id,
        state_name: row.state_name,
        county:     row.county_name,
        label:      `${row.city}, ${row.state_id}`,
      })

      if (suggestions.length >= 7) break
    }

    return NextResponse.json({ suggestions })
  } catch {
    return NextResponse.json({ suggestions: [] })
  }
}
