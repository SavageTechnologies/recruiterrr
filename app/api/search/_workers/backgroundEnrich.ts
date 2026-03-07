// ─── backgroundEnrich.ts ──────────────────────────────────────────────────────
// Runs AFTER the response is returned to the client.
// Fetches job postings + YouTube data and updates agent_profiles in Supabase.
// Never blocks the user — fire and forget from route.ts.

import { supabase } from '@/lib/supabase.server'

function nameTokens(name: string): string[] {
  const STOP = new Set(['insurance','agency','group','llc','inc','co','corp','the','and','of','a','an','broker','services','solutions','associates','financial','advisor','advisors'])
  return name.toLowerCase().replace(/[^a-z0-9\s]/g, '').split(/\s+/).filter(t => t.length > 2 && !STOP.has(t))
}

function nameMatchesChannel(businessName: string, candidate: string): boolean {
  const bizTokens = nameTokens(businessName)
  if (bizTokens.length === 0) return false
  const candidateLower = candidate.toLowerCase()
  const matchCount = bizTokens.filter(t => candidateLower.includes(t)).length
  return matchCount >= Math.max(1, Math.ceil(bizTokens.length * 0.5))
}

export async function backgroundEnrichAgent(
  clerkId: string,
  agentName: string,
  city: string,
  state: string,
  mode: string,
  youtubeLink: string | null,
): Promise<void> {
  try {
    const modeJobTerms: Record<string, string> = {
      medicare: 'insurance agent',
      life: 'insurance agent',
      annuities: 'financial advisor',
      financial: 'financial advisor',
    }
    const jobTerm = modeJobTerms[mode] || 'insurance agent'

    const [jobData, ytData] = await Promise.all([
      // Job postings
      (async () => {
        try {
          const q = `"${agentName}" ${jobTerm} ${city} ${state}`
          const url = `https://serpapi.com/search.json?engine=google_jobs&q=${encodeURIComponent(q)}&location=${encodeURIComponent(`${city}, ${state}`)}&api_key=${process.env.SERPAPI_KEY}`
          const res = await fetch(url, { signal: AbortSignal.timeout(6000) })
          if (!res.ok) return { hiring: false, roles: [] as string[] }
          const data = await res.json()
          const nameLower = agentName.toLowerCase()
          const relevant = (data.jobs_results || []).filter((j: any) => {
            const companyMatch = j.company_name?.toLowerCase().includes(nameLower.split(' ')[0]) ||
              nameLower.includes((j.company_name?.toLowerCase() || '').split(' ')[0])
            const recent = ['hour', 'day', 'week', 'month'].some(t => j.detected_extensions?.posted_at?.includes(t))
            return companyMatch && recent
          })
          return { hiring: relevant.length > 0, roles: relevant.map((j: any) => j.title).slice(0, 3) as string[] }
        } catch { return { hiring: false, roles: [] as string[] } }
      })(),
      // YouTube
      (async () => {
        try {
          if (youtubeLink) {
            const handleMatch = youtubeLink.match(/youtube\.com\/((@[A-Za-z0-9_.-]+)|channel\/[A-Za-z0-9_-]+|c\/[A-Za-z0-9_-]+|user\/[A-Za-z0-9_-]+)/)
            if (handleMatch) {
              const handle = handleMatch[1]
              const searchUrl = `https://serpapi.com/search.json?engine=youtube&search_query=${encodeURIComponent(handle)}&api_key=${process.env.SERPAPI_KEY}`
              const res = await fetch(searchUrl, { signal: AbortSignal.timeout(6000) })
              if (res.ok) {
                const data = await res.json()
                const matched = (data.channel_results || []).find((c: any) => nameMatchesChannel(agentName, c.title || ''))
                if (matched) return { channel: matched.link || youtubeLink, subscribers: matched.subscribers || null, videoCount: 1 }
              }
            }
            return { channel: youtubeLink, subscribers: null as string | null, videoCount: 0 }
          }
          // No site link — search by name
          const searchUrl = `https://serpapi.com/search.json?engine=youtube&search_query=${encodeURIComponent('"' + agentName + '"')}&api_key=${process.env.SERPAPI_KEY}`
          const res = await fetch(searchUrl, { signal: AbortSignal.timeout(6000) })
          if (!res.ok) return { channel: null as string | null, subscribers: null as string | null, videoCount: 0 }
          const data = await res.json()
          const matchedChannel = (data.channel_results || []).find((c: any) => nameMatchesChannel(agentName, c.title || ''))
          if (matchedChannel) return { channel: matchedChannel.link, subscribers: matchedChannel.subscribers || null, videoCount: 1 }
          const matchedVideo = (data.video_results || []).find((v: any) => nameMatchesChannel(agentName, v.channel?.name || ''))
          if (matchedVideo?.channel?.link) return { channel: matchedVideo.channel.link, subscribers: null as string | null, videoCount: 1 }
          return { channel: null as string | null, subscribers: null as string | null, videoCount: 0 }
        } catch { return { channel: null as string | null, subscribers: null as string | null, videoCount: 0 } }
      })(),
    ])

    await supabase
      .from('agent_profiles')
      .update({
        hiring: jobData.hiring,
        hiring_roles: jobData.roles.length ? jobData.roles : null,
        youtube_channel: ytData.channel,
        youtube_subscribers: ytData.subscribers,
      })
      .eq('clerk_id', clerkId)
      .eq('name', agentName)
      .eq('city', city)
      .eq('state', state)
  } catch (err) {
    console.error('[backgroundEnrichAgent] error:', err)
  }
}
