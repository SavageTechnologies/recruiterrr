export const OPERATOR_TIPS = [
  {
    tag: 'PRIORITY', color: 'var(--sig-green)',
    headline: 'HOT means call today.',
    body: "The HOT flag means independent signals fired — no captive contract language, no FMO branding, hiring activity, YouTube presence. Work HOT first, every time.",
  },
  {
    tag: 'SIGNAL', color: 'var(--sig-red)',
    headline: 'YouTube is your biggest tell.',
    body: "An agent building a personal brand is thinking beyond their current upline. Producers don't make videos when they're happy where they are. Click the YT badge and watch what they're posting before you dial.",
  },
  {
    tag: 'INTEL', color: 'var(--orange)',
    headline: 'Their website tells you everything.',
    body: "Before you call, click the website link and spend 60 seconds on it. Carrier logos on the homepage = independent. One company's branding everywhere = captive. Know before you dial.",
  },
  {
    tag: 'OPENER', color: 'var(--orange)',
    headline: 'The HIRING badge is a backdoor.',
    body: "An agent actively hiring subagents has a book of business and is growing — and is probably dealing with support or lead problems from their upline. \"I saw you're building a team\" beats any other opener.",
  },
  {
    tag: 'READING', color: 'var(--text-3)',
    headline: 'Reviews tell you who they are.',
    body: "High rating + lots of reviews = established producer with a real client base. Both are recruitable but the conversation is completely different. Check the count before you call.",
  },
  {
    tag: 'STRATEGY', color: 'var(--text-3)',
    headline: 'Search the city, not the agent.',
    body: "You're mapping a market, not hunting one person. Run the search, look at the cluster. If 8 of 30 agents have YouTube, that's a market full of ambitious producers.",
  },
]

export const ANNUITY_TIPS = [
  {
    tag: 'FIA / MYGA', color: 'var(--sig-green)',
    headline: "They won't look like annuity agents.",
    body: 'The best FIA producers call themselves "retirement planners" or "financial advisors." Look past the title and into the notes.',
  },
  {
    tag: 'SIGNAL', color: 'var(--sig-red)',
    headline: '"Safe money" is the magic phrase.',
    body: 'If their website mentions "safe money", "principal protection", "no market risk" — that\'s a pure FIA producer.',
  },
  {
    tag: 'INTEL', color: 'var(--orange)',
    headline: 'Carrier names confirm the kill.',
    body: 'Athene, North American, American Equity, Allianz, Nationwide — if you see any of these on their site, they\'re selling FIAs.',
  },
  {
    tag: 'AVOID', color: 'var(--sig-red)',
    headline: 'Fee-only = walk away.',
    body: 'Fee-only fiduciaries are philosophically anti-annuity. "AUM", "assets under management" — these are securities-first advisors. Don\'t waste time on COLD results here.',
  },
  {
    tag: 'NUANCE', color: 'var(--text-3)',
    headline: '"Fiduciary" alone means nothing.',
    body: 'Insurance agents can legally call themselves fiduciaries. Only walk away if you see "fee-only fiduciary" with AUM language.',
  },
  {
    tag: 'STRATEGY', color: 'var(--text-3)',
    headline: 'Retirement income = your target market.',
    body: 'WARM scores here often mean "I do some annuities" — that\'s a conversation worth having. Don\'t skip WARM on annuity searches.',
  },
]

// ── Supported search modes ────────────────────────────────────────────────────
// This is the single source of truth for what modes exist in the product.
// The backend config.ts has a 'financial' mode that is not yet production-ready.
// Do not add it here until the frontend search form, market summary, and
// saved-search restore are all ready to support it.
export const MODES = [
  { value: 'medicare',  label: 'Medicare / Senior',    desc: 'Medicare Advantage, Supplement, PDP' },
  { value: 'life',      label: 'Life / Final Expense', desc: 'Term, whole life, final expense' },
  { value: 'annuities', label: 'FIA / MYGA',           desc: 'Fixed index annuities, MYGA, safe money' },
]

// Helper — safely resolve a mode value to its display label/desc.
// Falls back to medicare if an unrecognized mode (e.g. 'financial') is restored
// from a saved search, so the UI never renders a blank header or broken select.
export function resolveMode(mode: string): { value: string; label: string; desc: string } {
  return MODES.find(m => m.value === mode) ?? MODES[0]
}

export const LOADING_PHASES = [
  { label: 'Scanning Google local listings',     detail: 'Pulling every agent in the market'         },
  { label: 'Crawling agent websites',            detail: 'Reading homepages, about pages, contact'   },
  { label: 'Checking job boards',                detail: 'Flagging agencies actively hiring'          },
  { label: 'Scanning YouTube presence',          detail: 'Finding agents building personal brands'   },
  { label: 'Running AI recruiter scoring',       detail: 'Writing intel briefs on every HOT target'  },
  { label: 'Preparing your results',             detail: 'Almost there — sorting by recruitability'  },
]
