// ─── lib/domain/anathema/apify.ts ─────────────────────────────────────────────
// Apify integration for deep Facebook + YouTube scraping.
//
// Called AFTER the main SERP passes when we have confirmed handles.
// Returns raw content structured for two downstream consumers:
//
//   1. ANATHEMA signal scanner  — post text + video titles/descriptions
//      fed into scanResultAgainstNetwork() for tree prediction boost
//
//   2. David facts extractor    — same content passed to extractDavidFacts()
//      as apifyFacebookPosts + apifyYouTubeVideos fields
//
// Zero influence on scoring logic here — this file only fetches and shapes.
// The route handler decides what to do with the output.
//
// Apify Actor IDs used:
//   Facebook Posts: apify/facebook-posts-scraper  (KoJrdxJCTtpon81KY)
//   YouTube Channel: apify/youtube-scraper        (h7sDV53CddomktSi4)
//
// Both are pay-per-event. Costs are roughly:
//   Facebook: ~$0.006 per post  (20 posts ≈ $0.12)
//   YouTube:  ~$0.008 per video (20 videos ≈ $0.16)
// Total add-on per scan when both handles found: ~$0.28

const APIFY_BASE = 'https://api.apify.com/v2'

// ─── TYPES ────────────────────────────────────────────────────────────────────

export type ApifyFacebookPost = {
  text: string
  url: string
  time: string        // ISO timestamp — critical for recency judgment
  likes: number
  shares: number
  comments: number
  link: string | null // external URL the post links to (gold for IMO detection)
  ocrText: string | null  // text extracted from images — awards, events, signage, certificates
  mediaType: 'photo' | 'video' | 'link' | 'none' // what kind of media is attached
}

export type ApifyYouTubeVideo = {
  title: string
  description: string
  url: string
  views: number
  date: string
  duration: string
}

export type ApifyEnrichmentResult = {
  facebookPosts: ApifyFacebookPost[]
  youtubeVideos: ApifyYouTubeVideo[]
  facebookError: string | null
  youtubeError: string | null
  // Pre-assembled text blobs for direct injection into existing scanners
  facebookText: string    // all post text joined — drop into scanResultAgainstNetwork
  youtubeText: string     // all titles + descriptions joined — same
}

// ─── APIFY RUNNER ─────────────────────────────────────────────────────────────
// Starts an Apify actor run synchronously (waits for completion).
// Apify's /run-sync-get-dataset-items endpoint blocks until done and returns
// the dataset directly — no polling needed.

async function runActor(
  actorId: string,
  input: object,
  timeoutSecs = 60
): Promise<any[] | null> {
  const apiKey = process.env.APIFY_API_KEY
  if (!apiKey) {
    console.warn('[Apify] APIFY_API_KEY not set — skipping enrichment')
    return null
  }

  try {
    const url = `${APIFY_BASE}/acts/${actorId}/run-sync-get-dataset-items?token=${apiKey}&timeout=${timeoutSecs}&memory=256`
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(input),
      signal: AbortSignal.timeout((timeoutSecs + 10) * 1000),
    })

    if (!res.ok) {
      const err = await res.text().catch(() => res.statusText)
      console.warn(`[Apify] Actor ${actorId} failed: ${res.status} ${err}`)
      return null
    }

    const data = await res.json()
    return Array.isArray(data) ? data : null
  } catch (err) {
    console.warn(`[Apify] Actor ${actorId} threw:`, err)
    return null
  }
}

// ─── FACEBOOK POSTS ───────────────────────────────────────────────────────────
// Takes the confirmed facebook profile URL from the SERP pass.
// Pulls the 25 most recent posts — enough for signal + David facts.

export async function fetchFacebookPostsApify(
  profileUrl: string,
  maxPosts = 25
): Promise<{ posts: ApifyFacebookPost[]; error: string | null }> {
  // Facebook cold starts are slow — needs 120s timeout
  const items = await runActor('KoJrdxJCTtpon81KY', {
    startUrls: [{ url: profileUrl }],
    resultsLimit: maxPosts,
  }, 120)

  if (!items) return { posts: [], error: 'Actor run failed or API key missing' }

  const posts: ApifyFacebookPost[] = items
    .filter((item: any) => item.text?.trim() || item.media?.some((m: any) => m.ocrText))
    .map((item: any) => {
      // Collect all OCR text from media attachments — this is where awards,
      // event signage, certificates, and recognition images live
      const mediaItems: any[] = item.media || []
      const ocrParts = mediaItems
        .map((m: any) => m.ocrText)
        .filter(Boolean)
        .join(' | ')

      // Determine media type for context
      const firstMedia = mediaItems[0]
      const mediaType: ApifyFacebookPost['mediaType'] =
        !firstMedia ? 'none'
        : firstMedia.__typename === 'Video' ? 'video'
        : firstMedia.__typename === 'Photo' ? 'photo'
        : item.link ? 'link'
        : 'none'

      return {
        text: item.text || '',   // full text — Claude decides what's relevant
        url: item.url || item.topLevelUrl || '',
        time: item.time || '',
        likes: item.likes || 0,
        shares: item.shares || 0,
        comments: item.comments || 0,
        link: item.link || null,
        ocrText: ocrParts || null,
        mediaType,
      }
    })

  return { posts, error: null }
}

// ─── YOUTUBE VIDEOS ───────────────────────────────────────────────────────────
// Takes the confirmed YouTube channel URL from the website crawl.
// Pulls latest 20 videos — titles alone are usually enough for ANATHEMA.

export async function fetchYouTubeVideosApify(
  channelUrl: string,
  maxVideos = 20
): Promise<{ videos: ApifyYouTubeVideo[]; error: string | null }> {
  // Actor: apify/youtube-scraper (streamers~youtube-scraper)
  // Handles @handle, /channel/, /c/ URL formats
  // YouTube cold starts are slow — needs 120s timeout
  const items = await runActor('streamers~youtube-scraper', {
    startUrls: [{ url: channelUrl }],
    maxResults: maxVideos,
    type: 'channel',
    includeDescription: true,
  }, 120)

  if (!items) return { videos: [], error: 'Actor run failed or API key missing' }

  const videos: ApifyYouTubeVideo[] = items
    .filter((item: any) => item.title?.trim())
    .map((item: any) => ({
      title: item.title || '',
      description: (item.description || '').slice(0, 400),
      url: item.url || '',
      views: item.viewCount || 0,
      date: item.date || '',
      duration: item.duration || '',
    }))

  return { videos, error: null }
}

// ─── MAIN ENRICHMENT CALL ────────────────────────────────────────────────────
// Called from the ANATHEMA route when we have confirmed handles.
// Runs Facebook + YouTube in parallel to keep latency down.
// Gracefully degrades — if either fails, the other still runs.

export async function enrichWithApify(params: {
  facebookProfileUrl: string | null
  youtubeChannelUrl: string | null
}): Promise<ApifyEnrichmentResult> {
  const [fbResult, ytResult] = await Promise.all([
    params.facebookProfileUrl
      ? fetchFacebookPostsApify(params.facebookProfileUrl)
      : Promise.resolve({ posts: [], error: 'No Facebook URL' }),

    params.youtubeChannelUrl
      ? fetchYouTubeVideosApify(params.youtubeChannelUrl)
      : Promise.resolve({ videos: [], error: 'No YouTube URL' }),
  ])

  // Pre-assemble text blobs for the existing ANATHEMA signal scanner
  // These drop directly into scanResultAgainstNetwork() calls in the route
  const facebookText = fbResult.posts
    .map(p => [p.text, p.link || ''].join(' '))
    .join('\n')

  // YouTube titles are the money shot for ANATHEMA — "FFL Agent Training 2024"
  // descriptions add context for David facts
  const youtubeText = ytResult.videos
    .map(v => `${v.title}\n${v.description}`)
    .join('\n\n')

  return {
    facebookPosts: fbResult.posts,
    youtubeVideos: ytResult.videos,
    facebookError: fbResult.error,
    youtubeError: ytResult.error,
    facebookText,
    youtubeText,
  }
}

// ─── SIGNAL EXTRACTION HELPERS ───────────────────────────────────────────────
// Convenience formatters for injecting Apify content into the debug log
// and the David facts input.

export function apifyToSerpSnippets(result: ApifyEnrichmentResult): Array<{
  title: string
  url: string
  snippet: string
}> {
  const snippets: Array<{ title: string; url: string; snippet: string }> = []

  result.facebookPosts.forEach(p => {
    // Build a rich snippet that includes timestamp and OCR so the extractor
    // has everything it needs to judge recency and content type
    const parts: string[] = []
    if (p.time) parts.push(`[posted: ${p.time}]`)
    if (p.text) parts.push(p.text)
    if (p.ocrText) parts.push(`[image text: ${p.ocrText}]`)
    if (p.link) parts.push(`[shared link: ${p.link}]`)

    if (parts.length > 1) { // at least timestamp + something
      snippets.push({
        title: `Facebook ${p.mediaType !== 'none' ? p.mediaType + ' ' : ''}post`,
        url: p.url,
        snippet: parts.join(' ').slice(0, 800), // generous — extractor has its own budget
      })
    }
  })

  result.youtubeVideos.forEach(v => {
    snippets.push({
      title: v.title,
      url: v.url,
      snippet: [
        v.date ? `[published: ${v.date}]` : '',
        v.description || `YouTube video: ${v.title}`,
      ].filter(Boolean).join(' '),
    })
  })

  return snippets
}