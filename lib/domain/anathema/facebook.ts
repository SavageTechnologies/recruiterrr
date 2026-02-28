// ─── lib/domain/anathema/facebook.ts ─────────────────────────────────────────
// Facebook handle extraction + profile/post fetch via SerpAPI.
// Returns raw text content for downstream scanning and the hunter.

// ─── TYPES ────────────────────────────────────────────────────────────────────

export type FacebookResult = {
  profileUrl: string
  about: string
  postText: string
  allText: string        // about + postText combined — pass to scanners
  handle: string
}

// ─── HANDLE EXTRACTOR ─────────────────────────────────────────────────────────

export function extractFacebookHandle(url: string): string | null {
  try {
    const match = url.match(/facebook\.com\/([^/?&#]+)/)
    if (match && match[1] && match[1] !== 'pages' && match[1] !== 'groups') return match[1]
  } catch {}
  return null
}

// ─── PROFILE FETCHER ──────────────────────────────────────────────────────────
// Runs two SerpAPI calls: one to find the FB profile URL via Google,
// one to fetch profile content. Returns null on any failure.

export async function fetchFacebookProfile(
  agentName: string,
  serpKey: string
): Promise<{ result: FacebookResult | null; searchResults: any[] }> {
  try {
    const fbQ = `"${agentName}" site:facebook.com`
    const fbSearchRes = await fetch(
      `https://serpapi.com/search.json?engine=google&q=${encodeURIComponent(fbQ)}&num=3&api_key=${serpKey}`,
      { signal: AbortSignal.timeout(12000) }
    )
    if (!fbSearchRes.ok) return { result: null, searchResults: [] }

    const fbSearchData = await fbSearchRes.json()
    const searchResults: any[] = fbSearchData.organic_results || []
    const fbResult = searchResults.find((r: any) => r.link?.includes('facebook.com'))

    if (!fbResult?.link) return { result: null, searchResults }

    const handle = extractFacebookHandle(fbResult.link)
    if (!handle) return { result: null, searchResults }

    const fbProfileRes = await fetch(
      `https://serpapi.com/search.json?engine=facebook_profile&profile_id=${handle}&api_key=${serpKey}`,
      { signal: AbortSignal.timeout(12000) }
    )
    if (!fbProfileRes.ok) return { result: null, searchResults }

    const fbProfile = await fbProfileRes.json()
    const about = fbProfile?.about || fbProfile?.description || ''
    const posts: any[] = fbProfile?.posts || fbProfile?.updates || []
    const postText = posts
      .slice(0, 10)
      .map((p: any) => p.snippet || p.text || p.description || '')
      .filter(Boolean)
      .join('\n')

    const allText = [about, postText].filter(Boolean).join('\n')
    if (!allText) return { result: null, searchResults }

    return {
      result: {
        profileUrl: fbResult.link,
        about,
        postText,
        allText,
        handle,
      },
      searchResults,
    }
  } catch {
    return { result: null, searchResults: [] }
  }
}
