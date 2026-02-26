import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import Anthropic from '@anthropic-ai/sdk'
import { Ratelimit } from '@upstash/ratelimit'
import { Redis } from '@upstash/redis'
import { supabase } from '@/lib/supabase.server'

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

const ratelimit = new Ratelimit({
  redis: Redis.fromEnv(),
  limiter: Ratelimit.slidingWindow(20, '1 h'),
  analytics: true,
})

const ALLOWED_ORIGINS = ['https://recruiterrr.com', 'http://localhost:3000']

// ─── CARRIER FINGERPRINTS ────────────────────────────────────────────────────
const INTEGRITY_CARRIERS = ['humana', 'aetna', 'cigna', 'wellcare', 'devoted health', 'devoted', 'ffl', 'family first life']
const AMERILIFE_CARRIERS = ['humana', 'aetna', 'unitedhealthcare', 'united health', 'uhc', 'cigna', 'wellcare']
const SMS_CARRIERS = ['mutual of omaha', 'medico', 'gpm life', 'american equity', 'north american', 'north american company']

// ─── LANGUAGE FINGERPRINTS ───────────────────────────────────────────────────
const INTEGRITY_SIGNALS = [
  'integrity partner', 'integrity marketing', 'ffl agent', 'family first life',
  'integrityconnect', 'medicarecenter', 'life of the southwest', 'integrity connect',
  'integrity.com', 'integrity-partner', 'proud integrity'
]
const AMERILIFE_SIGNALS = [
  'amerilife', 'usabg', 'amerilife affiliate', 'amerilife partner',
  'amerilife.com', 'united senior benefits group'
]
const SMS_SIGNALS = [
  'senior market sales', 'sms partner', 'rethinking retirement',
  'seniormarketsales.com', 'sms family', 'sms affiliate'
]

function extractFacebookHandle(url: string): string | null {
  try {
    const match = url.match(/facebook\.com\/([^/?&#]+)/)
    if (match && match[1] && match[1] !== 'pages' && match[1] !== 'groups') {
      return match[1]
    }
  } catch {}
  return null
}

function scoreCarriers(carriers: string[]): { integrity: number; amerilife: number; sms: number; signals: string[] } {
  const lower = carriers.map(c => c.toLowerCase())
  const signals: string[] = []
  let integrity = 0, amerilife = 0, sms = 0

  // Count matching carriers per tree
  const integrityMatches = lower.filter(c => INTEGRITY_CARRIERS.some(k => c.includes(k) || k.includes(c)))
  const amerilifeMatches = lower.filter(c => AMERILIFE_CARRIERS.some(k => c.includes(k) || k.includes(c)))
  const smsMatches = lower.filter(c => SMS_CARRIERS.some(k => c.includes(k) || k.includes(c)))

  if (integrityMatches.length >= 2) { integrity += 20; signals.push(`Carrier mix: ${integrityMatches.join(' + ')} [INTEGRITY pattern]`) }
  else if (integrityMatches.length === 1) { integrity += 8 }

  if (smsMatches.length >= 1) { sms += 25; signals.push(`Carrier: ${smsMatches.join(', ')} [SMS fingerprint]`) }

  // AmeriLife shares carriers with Integrity — only signal if no SMS match
  if (amerilifeMatches.length >= 2 && smsMatches.length === 0) { amerilife += 15; signals.push(`Carrier mix: ${amerilifeMatches.join(' + ')} [AmeriLife compatible]`) }

  return { integrity, amerilife, sms, signals }
}

function scoreText(text: string): { integrity: number; amerilife: number; sms: number; signals: string[] } {
  const lower = text.toLowerCase()
  const signals: string[] = []
  let integrity = 0, amerilife = 0, sms = 0

  for (const s of INTEGRITY_SIGNALS) {
    if (lower.includes(s)) { integrity += 30; signals.push(`Text: "${s}" language detected [INTEGRITY]`); break }
  }
  for (const s of AMERILIFE_SIGNALS) {
    if (lower.includes(s)) { amerilife += 35; signals.push(`Text: "${s}" language detected [AMERILIFE]`); break }
  }
  for (const s of SMS_SIGNALS) {
    if (lower.includes(s)) { sms += 35; signals.push(`Text: "${s}" language detected [SMS]`); break }
  }

  return { integrity, amerilife, sms, signals }
}

export async function POST(req: NextRequest) {
  // CSRF check
  const origin = req.headers.get('origin')
  if (!origin || !ALLOWED_ORIGINS.includes(origin)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  // Auth
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  // Rate limit
  const { success } = await ratelimit.limit(userId)
  if (!success) return NextResponse.json({ error: 'Rate limit exceeded' }, { status: 429 })

  const body = await req.json()
  const { action } = body

  // ─── SAVE OBSERVATION ─────────────────────────────────────────────────────
  if (action === 'log_observation') {
    const {
      agent_name, city, state,
      predicted_tree, predicted_confidence, prediction_signals, prediction_reasoning,
      facebook_profile_url, facebook_about,
      confirmed_tree, confirmed_tree_other, confirmed_sub_imo, recruiter_notes,
      agent_website, agent_address
    } = body

    // Check for existing specimen (upsert by agent+user)
    const { data: existing } = await supabase
      .from('anathema_specimens')
      .select('id')
      .eq('clerk_id', userId)
      .eq('agent_name', agent_name)
      .eq('city', city)
      .eq('state', state)
      .single()

    if (existing?.id) {
      await supabase
        .from('anathema_specimens')
        .update({
          predicted_tree, predicted_confidence, prediction_signals, prediction_reasoning,
          facebook_profile_url, facebook_about,
          confirmed_tree, confirmed_tree_other, confirmed_sub_imo, recruiter_notes,
        })
        .eq('id', existing.id)
    } else {
      await supabase.from('anathema_specimens').insert({
        clerk_id: userId,
        agent_name, city, state, agent_website, agent_address,
        predicted_tree, predicted_confidence, prediction_signals, prediction_reasoning,
        facebook_profile_url, facebook_about,
        confirmed_tree, confirmed_tree_other, confirmed_sub_imo, recruiter_notes,
      })
    }

    return NextResponse.json({ ok: true })
  }

  // ─── CHECK EXISTING SPECIMEN ──────────────────────────────────────────────
  if (action === 'check_existing') {
    const { agent_name, city, state } = body
    const { data } = await supabase
      .from('anathema_specimens')
      .select('*')
      .eq('clerk_id', userId)
      .eq('agent_name', agent_name)
      .eq('city', city)
      .eq('state', state)
      .single()

    return NextResponse.json({ specimen: data || null })
  }

  // ─── RUN SCAN ─────────────────────────────────────────────────────────────
  const { agent } = body
  if (!agent) return NextResponse.json({ error: 'Missing agent' }, { status: 400 })

  const serpKey = process.env.SERPAPI_KEY
  let integrityScore = 0, amerilifeScore = 0, smsScore = 0
  const allSignals: string[] = []
  let facebookProfileUrl: string | null = null
  let facebookAbout: string | null = null

  // TIER 1 — Carrier match
  if (agent.carriers?.length > 0) {
    const carrierResult = scoreCarriers(agent.carriers)
    integrityScore += carrierResult.integrity
    amerilifeScore += carrierResult.amerilife
    smsScore += carrierResult.sms
    allSignals.push(...carrierResult.signals)
  }

  // TIER 1 — Text grep (website content, notes, about)
  const textBlob = [agent.notes || '', agent.about || ''].join(' ')
  if (textBlob.trim()) {
    const textResult = scoreText(textBlob)
    integrityScore += textResult.integrity
    amerilifeScore += textResult.amerilife
    smsScore += textResult.sms
    allSignals.push(...textResult.signals)
  }

  // TIER 2 — SerpAPI Google affiliation search
  try {
    const q = `"${agent.name}" integrity OR amerilife OR "senior market sales" OR "FMO partner"`
    const serpUrl = `https://serpapi.com/search.json?engine=google&q=${encodeURIComponent(q)}&num=5&api_key=${serpKey}`
    const serpRes = await fetch(serpUrl, { signal: AbortSignal.timeout(6000) })
    if (serpRes.ok) {
      const serpData = await serpRes.json()
      const results = serpData.organic_results || []
      const snippets = results.map((r: any) => `${r.title || ''} ${r.snippet || ''}`.toLowerCase()).join(' ')

      if (results.length > 0) {
        const googleResult = scoreText(snippets)
        integrityScore += googleResult.integrity
        amerilifeScore += googleResult.amerilife
        smsScore += googleResult.sms

        // Surface specific Google evidence
        for (const r of results.slice(0, 3)) {
          const combined = `${r.title || ''} ${r.snippet || ''}`.toLowerCase()
          if (combined.includes('integrity')) allSignals.push(`Google: "${r.title}" — Integrity reference found`)
          else if (combined.includes('amerilife')) allSignals.push(`Google: "${r.title}" — AmeriLife reference found`)
          else if (combined.includes('senior market sales') || combined.includes('sms partner')) allSignals.push(`Google: "${r.title}" — SMS reference found`)
        }
      }
    }
  } catch {}

  // TIER 3 — Facebook profile
  try {
    const fbSearchUrl = `https://serpapi.com/search.json?engine=google&q=${encodeURIComponent(`"${agent.name}" site:facebook.com`)}&num=3&api_key=${serpKey}`
    const fbSearchRes = await fetch(fbSearchUrl, { signal: AbortSignal.timeout(5000) })
    if (fbSearchRes.ok) {
      const fbSearchData = await fbSearchRes.json()
      const fbResult = (fbSearchData.organic_results || []).find((r: any) => r.link?.includes('facebook.com'))
      if (fbResult?.link) {
        const handle = extractFacebookHandle(fbResult.link)
        if (handle) {
          facebookProfileUrl = fbResult.link
          try {
            const fbProfileUrl = `https://serpapi.com/search.json?engine=facebook_profile&profile_id=${handle}&api_key=${serpKey}`
            const fbProfileRes = await fetch(fbProfileUrl, { signal: AbortSignal.timeout(5000) })
            if (fbProfileRes.ok) {
              const fbProfile = await fbProfileRes.json()
              const about = fbProfile?.about || fbProfile?.description || ''
              if (about) {
                facebookAbout = about
                const fbResult2 = scoreText(about)
                integrityScore += fbResult2.integrity
                amerilifeScore += fbResult2.amerilife
                smsScore += fbResult2.sms
                if (fbResult2.signals.length > 0) {
                  allSignals.push(...fbResult2.signals.map(s => `Facebook: ${s}`))
                } else {
                  allSignals.push(`Facebook profile found — no direct affiliation language`)
                }
              } else {
                allSignals.push(`Facebook: Profile located — about section empty`)
              }
            }
          } catch {}
        }
      } else {
        allSignals.push(`Facebook: No profile located`)
      }
    }
  } catch {
    allSignals.push(`Facebook: Search unavailable`)
  }

  if (allSignals.length === 0) {
    allSignals.push('No affiliation signals detected in available data')
  }

  // ─── CLAUDE HAIKU PREDICTION ──────────────────────────────────────────────
  const prompt = `You are ANATHEMA, a pathogen analysis system for the US insurance distribution market. Your job is to predict which of three major distribution trees an insurance agent belongs to, based on collected signals.

THE THREE TREES:
1. INTEGRITY MARKETING GROUP — Carriers: Humana, Aetna, Cigna, WellCare, Devoted Health. Language: "FFL", "Family First Life", "IntegrityCONNECT", "MedicareCENTER". Geographic: TX, OK, Southeast. Acquisition-heavy with many branded affiliates.
2. AMERILIFE — Carriers: Humana, Aetna, UnitedHealthcare, Cigna, WellCare. Language: "AmeriLife affiliate", "USABG". Geographic: FL (Clearwater HQ), Southeast, Midwest. Many affiliates hosted on AmeriLife subdomains.
3. SENIOR MARKET SALES (SMS) — Carriers: Mutual of Omaha, Medico, GPM Life, American Equity, North American Company. Language: "SMS partner", "Senior Market Sales", "Rethinking Retirement". Geographic: NE (Omaha HQ), IA, MN, NJ, SC. Long-standing family-owned agencies.

AGENT: ${agent.name}
Location: ${agent.city || ''}, ${agent.state || ''}
Carriers: ${(agent.carriers || []).join(', ') || 'Unknown'}
Pre-scored signals: Integrity=${integrityScore}, AmeriLife=${amerilifeScore}, SMS=${smsScore}

RAW SIGNALS COLLECTED:
${allSignals.map(s => `- ${s}`).join('\n')}

Based on these signals, provide a JSON prediction. Rules:
- If confidence < 35, use predicted_tree: "unknown"
- signals_used should be the 2-4 most compelling specific signals
- reasoning should be 1-2 sentences maximum

Respond with ONLY valid JSON, no markdown:
{
  "predicted_tree": "integrity" | "amerilife" | "sms" | "unknown",
  "confidence": 0-100,
  "signals_used": ["signal 1", "signal 2"],
  "reasoning": "1-2 sentences"
}`

  let prediction = {
    predicted_tree: 'unknown',
    confidence: 0,
    signals_used: allSignals.slice(0, 4),
    reasoning: 'Insufficient signals to determine affiliation.'
  }

  try {
    const claudeRes = await anthropic.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 500,
      messages: [{ role: 'user', content: prompt }],
    })
    const text = (claudeRes.content[0] as any).text || ''
    const parsed = JSON.parse(text.replace(/```json|```/g, '').trim())
    prediction = parsed
  } catch {}

  return NextResponse.json({
    predicted_tree: prediction.predicted_tree,
    confidence: prediction.confidence,
    signals_used: prediction.signals_used,
    reasoning: prediction.reasoning,
    facebook_profile_url: facebookProfileUrl,
    facebook_about: facebookAbout,
  })
}
