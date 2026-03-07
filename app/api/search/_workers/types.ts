// ─── types.ts ─────────────────────────────────────────────────────────────────
// Shared types for the search agent pipeline.
// Edit this file when adding new fields to agent results.

export type AgentResult = {
  name: string; type: string; phone: string; address: string
  rating: number; reviews: number; website: string | null
  carriers: string[]; captive: boolean; score: number
  flag: 'hot' | 'warm' | 'cold'; notes: string; years: number | null
  hiring: boolean; hiring_roles: string[]
  youtube_channel: string | null; youtube_subscribers: string | null; youtube_video_count: number
  about: string | null; contact_email: string | null; social_links: string[]
  _preScore: number
  _enrichmentDelta: number
  _sonnetDelta: number
}

export type WebsiteIntel = {
  fullText: string
  email: string | null
  socialLinks: string[]
  youtubeLink: string | null
}

export type PreScoreResult = {
  score: number
  captive: boolean
}

export type ModeConfig = {
  analyst: string
  queries: string[]
  captiveBrands: string[]
  independenceKeywords: string[]
  specialtyKeywords: string[]
  negativeKeywords?: string[]
  typeFallback: string
}
