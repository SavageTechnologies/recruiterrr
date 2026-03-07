import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { supabase } from '@/lib/supabase.server'

export async function GET(req: NextRequest) {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const q     = req.nextUrl.searchParams.get('q')?.trim()
  const state = req.nextUrl.searchParams.get('state')?.trim().toUpperCase()

  // ── Branch 1: state drill-down — return cities for a given state ───────────
  if (state) {
    try {
      const { data, error } = await supabase
        .from('us_cities')
        .select('city, state_id, county_name, population')
        .eq('state_id', state)
        .order('population', { ascending: false })
        .limit(200) // fetch enough to dedup down to ~40 distinct cities

      if (error || !data) return NextResponse.json({ cities: [] })

      const seen = new Set<string>()
      const cities: { city: string; county: string }[] = []

      for (const row of data) {
        const key = row.city.toLowerCase()
        if (seen.has(key)) continue
        seen.add(key)
        cities.push({ city: row.city, county: row.county_name })
        if (cities.length >= 40) break
      }

      return NextResponse.json({ cities })
    } catch {
      return NextResponse.json({ cities: [] })
    }
  }

  // ── Branch 2: city prefix autocomplete (existing behaviour) ────────────────
  if (!q || q.length < 2) return NextResponse.json({ suggestions: [] })

  try {
    const { data, error } = await supabase
      .from('us_cities')
      .select('city, state_id, state_name, county_name, population')
      .ilike('city', `${q}%`)
      .order('population', { ascending: false })
      .limit(50)

    if (error || !data) return NextResponse.json({ suggestions: [] })

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
