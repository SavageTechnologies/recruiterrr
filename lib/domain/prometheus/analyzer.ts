// ─── lib/domain/prometheus/analyzer.ts ───────────────────────────────────────
// Claude analysis for Prometheus scans.
// Takes crawled pages + SERP intel → structured JSON sales intelligence.

import { getAnthropicClient } from '@/lib/ai'

export async function runClaudeAnalysis(
  fmoName: string,
  domain: string | null,
  pages: Record<string, string>,
  serpIntel: Record<string, string>,
  foundPages: string[]
): Promise<any> {
  const pageContent = Object.entries(pages)
    .map(([slug, text]) => `PAGE: ${slug}\n${text}`)
    .join('\n\n---\n\n')
    .slice(0, 18000)

  const prompt = `You are a sales intelligence analyst. The person reading this works at Recruiterrr — a recruiting intelligence platform — and is about to call or email this FMO to pitch them on buying the tool. Your job is to extract FACTS that help them walk into that conversation already knowing this company. Extract only what the data explicitly supports. If a fact isn't in the data, say "Not found in scan" — never invent.

CRITICAL RULE: You are analyzing "${fmoName}" ONLY. Any content that does not explicitly mention "${fmoName}" or its confirmed website (${domain || 'unknown'}) must be completely ignored. Do not extract facts from content about other companies. If you cannot confirm a fact is specifically about "${fmoName}", return "Not found in scan".

FMO/IMO: ${fmoName}
WEBSITE: ${domain || 'Not found'}
PAGES CRAWLED: ${foundPages.join(', ') || 'None'}

WEBSITE CONTENT:
${pageContent || 'No website content available.'}

SERP INTELLIGENCE:
TRIPS: ${serpIntel.trips || 'No data.'}
CARRIERS: ${serpIntel.carriers || 'No data.'}
AGENT VOICE (Reddit/Forums): ${serpIntel.agent_voice || 'No data.'}
AGENT COMPLAINTS: ${serpIntel.complaints || 'No data.'}
RECRUITING ACTIVITY: ${serpIntel.recruiting || 'No data.'}
RECENT NEWS: ${serpIntel.news || 'No data.'}
LEADERSHIP / CONTACTS: ${serpIntel.leadership || 'No data.'}
TECHNOLOGY: ${serpIntel.technology || 'No data.'}

EXTRACTION RULES:
- contacts: look for named individuals with titles anywhere in the data — website team/about pages, SERP snippets, press releases, LinkedIn mentions. Capture name + title + any contact info found. Empty array if no named people found.
- recruiting_activity: signals the FMO is actively trying to grow their agent headcount right now — job postings, ads, "join our team" language, recent agent growth announcements, conference sponsorships focused on recruiting. Be specific.
- tech_stack: name actual tools mentioned. If no tools mentioned, note that explicitly — it's a sales signal.
- agent_complaints: specific pain points from agents. These are sales angles — each complaint is a problem Recruiterrr may solve.
- size_signal: use agent count, revenue hints, number of states, carrier count, and trip thresholds as signals. LARGE = 500+ agents or clear national presence. MID-SIZE = 50-500 agents or regional presence. SMALL = under 50 agents or single-state.
- data_confidence: HIGH = 5+ pages crawled + multiple SERP hits. MEDIUM = 1-4 pages OR solid SERP data. LOW = no site found or very sparse data.

Return ONLY valid JSON, no markdown, no backticks:
{
  "fmo_name": "<official name as found in data>",
  "website": "<domain or null>",
  "tree_affiliation": "<Integrity | AmeriLife | SMS | Independent | Unknown — only if determinable from data>",
  "size_signal": "LARGE" | "MID-SIZE" | "SMALL" | "UNKNOWN",
  "overview": "<2-3 sentences: who they are, how big, what market they serve, how long operating. Include specific numbers like agent count or states when found.>",
  "recent_news": "<specific acquisitions, new hires, rebrands, partnership announcements, or notable 2024-2025 events — or 'None found in scan'>",
  "contacts": [
    {
      "name": "<full name>",
      "title": "<exact title as found in data>",
      "email": "<email if found — or null>",
      "phone": "<phone if found — or null>",
      "linkedin": "<LinkedIn URL if found — or null>",
      "source": "<where this person was found: website team page | SERP snippet | press release | other>"
    }
  ],
  "recruiting_activity": {
    "actively_recruiting": true | false,
    "signals": ["specific evidence of active recruiting — job postings, ads, language found in data"],
    "target_agent_profile": "<what type of agent they're going after — from their website or SERP>",
    "recruiting_pitch_headline": "<the main hook they use to recruit agents>"
  },
  "what_they_offer": {
    "carriers": ["every carrier name found in data — empty array if none found"],
    "products": ["product lines: Medicare Advantage, Final Expense, Life, Annuities, ACA, etc."],
    "contract_terms": "<commission levels, release policy, vesting, ownership language — or 'Not found in scan'>",
    "lead_program": "<what they say about leads — cost, exclusivity, volume — or 'Not found in scan'>",
    "technology": ["specific tools, CRMs, quoting platforms named in data — empty array means no tech stack mentioned, which is a sales signal"],
    "training": "<training or onboarding specifics — or 'Not found in scan'>",
    "trip_current": "<2025 or 2026 trip destination — or 'Not found in scan'>",
    "trip_threshold": "<production threshold to qualify for trip — or 'Not found in scan'>",
    "trip_past": ["past trip destinations found in data"],
    "events": ["conferences, summits, or events they host or sponsor — include dates if found"]
  },
  "agent_sentiment": {
    "agent_quotes": [
      {
        "quote": "<verbatim or close paraphrase from an actual agent>",
        "sentiment": "positive" | "negative" | "mixed",
        "topic": "<commissions | leads | support | contracts | culture | trips | technology | recruiting>",
        "source": "<reddit | glassdoor | forum | google review | other>"
      }
    ],
    "common_praise": ["specific things agents praise — from found data only"],
    "common_complaints": ["specific complaints — these are your sales angles, be specific"],
    "contract_flags": ["specific contract terms agents flag — captive language, release issues, chargebacks"]
  },
  "sales_angles": {
    "tech_gap": "<is there a visible gap in their tech stack? No CRM mentioned? No quoting tool? Agents complaining about tools? Be specific about the gap and why it matters.>",
    "retention_problem": "<evidence agents are leaving or dissatisfied — churn signals from complaints, Glassdoor, SERP>",
    "recruiting_pain": "<are they struggling to grow, or growing fast and need better tools to manage it? What does the data suggest?>",
    "size_and_budget_read": "<based on size signal, trip thresholds, carrier count, and any revenue hints — can they afford a tool? Are they big enough to need one?>"
  },
  "pages_found": ${JSON.stringify(foundPages)},
  "data_confidence": "HIGH" | "MEDIUM" | "LOW",
  "confidence_note": "<honest summary of what data was and wasn't available>"
}`

  const anthropic = getAnthropicClient()
  const response = await anthropic.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 5000,
    messages: [{ role: 'user', content: prompt }],
  })

  const text = response.content[0].type === 'text' ? response.content[0].text : ''
  const jsonMatch = text.match(/\{[\s\S]*\}/)
  if (!jsonMatch) throw new Error('[runClaudeAnalysis] Failed to parse JSON from response')
  return JSON.parse(jsonMatch[0])
}
