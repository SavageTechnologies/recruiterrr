import Link from 'next/link'

type Feature = {
  label: string
  detail?: string | null
  excluded?: boolean
}

type ApiPlan = {
  label: string
  price: string
  detail: string
}

type Tier = {
  name: string
  price: string
  priceDetail?: string
  period: string
  tag: string
  tagColor: string
  accent: string
  featured: boolean
  comingSoon?: boolean
  cta: string
  ctaHref: string
  ctaStyle: 'outline' | 'filled' | 'outline-purple'
  features: Feature[]
}

const DAVID_API_PLANS: ApiPlan[] = [
  { label: 'PAY AS YOU GO', price: '$0.75',   detail: 'per agent payload' },
  { label: 'STARTER',       price: '$299/mo', detail: '5,000 payloads' },
  { label: 'PRO',           price: '$999/mo', detail: '25,000 payloads' },
  { label: 'ENTERPRISE',    price: 'CUSTOM',  detail: 'Volume + SLA' },
]

const TIERS: Tier[] = [
  {
    name: 'OPERATOR',
    price: '$499',
    priceDetail: '.95',
    period: 'per month',
    tag: 'FULL ACCESS',
    tagColor: 'var(--orange)',
    accent: 'var(--orange)',
    featured: true,
    cta: 'START OPERATOR',
    ctaHref: '/sign-up',
    ctaStyle: 'filled',
    features: [
      { label: 'Agent search',                  detail: '15 searches per hour' },
      { label: 'Results per search',            detail: 'Up to 50 agents' },
      { label: 'AI scoring',                    detail: 'HOT / WARM / COLD' },
      { label: 'YouTube & hiring signals',      detail: 'Full enrichment' },
      { label: 'Search history',                detail: 'Full history' },
      { label: 'Agent database',                detail: 'Persistent — every search saved' },
      { label: 'Prometheus FMO intel scanner',  detail: '20 scans per hour' },
      { label: 'ANATHEMA distribution scanner', detail: '20 scans per hour' },
      { label: 'Dashboard access' },
      { label: 'Multi-seat team access',        excluded: true },
      { label: 'Priority support',              excluded: true },
    ],
  },
  {
    name: 'ENTERPRISE',
    price: '$10,000',
    period: 'per month',
    tag: 'TEAM ACCESS',
    tagColor: 'var(--orange)',
    accent: 'var(--orange)',
    featured: false,
    cta: 'CONTACT US',
    ctaHref: '/contact',
    ctaStyle: 'outline',
    features: [
      { label: 'Agent search',                    detail: 'Unlimited' },
      { label: 'Results per search',              detail: 'Up to 50 agents' },
      { label: 'AI scoring',                      detail: 'HOT / WARM / COLD' },
      { label: 'YouTube & hiring signals',        detail: 'Full enrichment' },
      { label: 'Search history',                  detail: 'Full history' },
      { label: 'Agent database',                  detail: 'Shared team database' },
      { label: 'Prometheus FMO intel scanner',    detail: 'Unlimited scans' },
      { label: 'ANATHEMA distribution scanner',   detail: 'Unlimited scans' },
      { label: 'DAVID API access',                detail: 'Included as available' },
      { label: 'White-label & data reuse rights', detail: 'Internal use' },
      { label: 'Multi-seat team access',          detail: 'Up to 10 users' },
      { label: 'Priority support',                detail: 'Dedicated contact' },
      { label: 'Early access to new features' },
    ],
  },
  {
    name: 'DAVID API',
    price: 'USAGE',
    period: 'based pricing',
    tag: 'COMING SOON',
    tagColor: '#a78bfa',
    accent: '#a78bfa',
    featured: false,
    comingSoon: true,
    cta: 'JOIN WAITLIST',
    ctaHref: '/contact',
    ctaStyle: 'outline-purple',
    features: [
      { label: 'Agent intelligence payload',  detail: 'Structured JSON per agent' },
      { label: 'Distribution tree + upline',  detail: 'Tree, sub-IMO, confidence' },
      { label: 'Personal facts layer',        detail: 'YouTube, press, reviews, social' },
      { label: 'Recruit score + flag',        detail: 'HOT / WARM / COLD' },
      { label: 'Bulk query support',          detail: 'Batch up to 1,000' },
      { label: 'REST API + documentation' },
      { label: 'Drop into any AI writer or CRM' },
    ],
  },
]

export default function PricingPage() {
  return (
    <div style={{ color: 'var(--white)' }}>
      <style>{`@keyframes apiPulse { 0%,100%{opacity:1} 50%{opacity:0.3} }`}</style>

      {/* Hero */}
      <div style={{ maxWidth: 1100, padding: '80px 40px 0' }}>
        <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 11, color: 'var(--orange)', letterSpacing: 3, textTransform: 'uppercase', marginBottom: 16 }}>
          Pricing
        </div>
        <h1 style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 'clamp(56px, 8vw, 96px)', letterSpacing: 2, lineHeight: 0.9, marginBottom: 24 }}>
          PAY FOR WHAT<br /><span style={{ color: 'var(--orange)' }}>YOU RECRUIT.</span>
        </h1>
        <p style={{ fontSize: 15, color: 'var(--muted)', maxWidth: 480, lineHeight: 1.7, marginBottom: 64 }}>
          Serious tools for serious recruiters. Built for professionals who move fast.
        </p>
      </div>

      {/* Pricing grid */}
      <div style={{ maxWidth: 1100, padding: '0 40px 80px', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 2 }}>
        {TIERS.map((tier: Tier) => (
          <div
            key={tier.name}
            style={{
              background: tier.featured ? '#1e1b17' : tier.comingSoon ? '#0e0c14' : 'var(--card)',
              border: `1px solid ${tier.featured ? 'var(--orange)' : tier.comingSoon ? 'rgba(167,139,250,0.25)' : 'var(--border)'}`,
              display: 'flex',
              flexDirection: 'column',
              position: 'relative',
              overflow: 'hidden',
            }}
          >
            <div style={{ height: 3, background: tier.accent, width: '100%' }} />

            <div style={{ padding: '36px 32px', flex: 1, display: 'flex', flexDirection: 'column' }}>

              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 24, flexWrap: 'wrap' }}>
                <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 9, letterSpacing: 2, color: tier.tagColor, border: `1px solid ${tier.tagColor}`, padding: '3px 8px' }}>
                  {tier.tag}
                </div>
                {tier.comingSoon && (
                  <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 8, letterSpacing: 1, color: '#a78bfa', display: 'flex', alignItems: 'center', gap: 4 }}>
                    <span style={{ display: 'inline-block', width: 5, height: 5, borderRadius: '50%', background: '#a78bfa', animation: 'apiPulse 2s ease infinite' }} />
                    DAVID INTELLIGENCE LAYER
                  </div>
                )}
              </div>

              <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 32, letterSpacing: 3, color: 'var(--white)', marginBottom: 20 }}>
                {tier.name}
              </div>

              {tier.comingSoon ? (
                <div style={{ marginBottom: 28 }}>
                  <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 48, letterSpacing: 1, lineHeight: 1, color: '#a78bfa', marginBottom: 4 }}>
                    $0.75
                  </div>
                  <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 10, color: 'var(--muted)', letterSpacing: 1, marginBottom: 14 }}>
                    per agent payload · pay as you go
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                    {DAVID_API_PLANS.map((p: ApiPlan) => (
                      <div key={p.label} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '6px 10px', background: 'rgba(167,139,250,0.04)', border: '1px solid rgba(167,139,250,0.12)' }}>
                        <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 9, color: '#a78bfa', letterSpacing: 1 }}>{p.label}</span>
                        <span style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 14, color: 'var(--white)', letterSpacing: 1 }}>{p.price}</span>
                        <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 9, color: 'var(--muted)', letterSpacing: 0.5 }}>{p.detail}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <>
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: 2, marginBottom: 6 }}>
                    <span style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 64, letterSpacing: 1, lineHeight: 1, color: tier.featured ? 'var(--orange)' : 'var(--white)' }}>
                      {tier.price}
                    </span>
                    {tier.priceDetail && (
                      <span style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 32, color: 'var(--orange)', marginTop: 8 }}>
                        {tier.priceDetail}
                      </span>
                    )}
                  </div>
                  <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 10, color: 'var(--muted)', letterSpacing: 1, marginBottom: 36 }}>
                    {tier.period}
                  </div>
                </>
              )}

              <div style={{ height: 1, background: 'var(--border)', marginBottom: 28 }} />

              <div style={{ display: 'flex', flexDirection: 'column', gap: 14, flex: 1, marginBottom: 36 }}>
                {tier.features.map((f: Feature, i: number) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
                    <span style={{ fontSize: 12, color: f.excluded ? '#333' : tier.accent, marginTop: 1, flexShrink: 0 }}>
                      {f.excluded ? '—' : '✦'}
                    </span>
                    <div>
                      <span style={{ fontSize: 13, color: f.excluded ? '#333' : 'var(--white)' }}>
                        {f.label}
                      </span>
                      {f.detail && !f.excluded && (
                        <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 10, color: 'var(--muted)', letterSpacing: 0.5, marginLeft: 8 }}>
                          — {f.detail}
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              <Link
                href={tier.ctaHref}
                style={{
                  display: 'block', textAlign: 'center', padding: '16px',
                  fontFamily: "'Bebas Neue', sans-serif", fontSize: 18, letterSpacing: 3, textDecoration: 'none',
                  ...(tier.ctaStyle === 'filled'
                    ? { background: 'var(--orange)', color: 'var(--black)', border: '1px solid var(--orange)' }
                    : tier.ctaStyle === 'outline-purple'
                    ? { background: 'transparent', color: '#a78bfa', border: '1px solid #a78bfa' }
                    : { background: 'transparent', color: 'var(--white)', border: '1px solid var(--border)' }
                  ),
                }}
              >
                {tier.cta}
              </Link>
            </div>
          </div>
        ))}
      </div>

      {/* Bottom notes */}
      <div style={{ maxWidth: 1100, padding: '0 40px 80px' }}>
        <div style={{ borderTop: '1px solid var(--border)', paddingTop: 40, display: 'flex', gap: 60, flexWrap: 'wrap' }}>
          <div>
            <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 10, color: 'var(--orange)', letterSpacing: 2, textTransform: 'uppercase', marginBottom: 8 }}>No contracts</div>
            <div style={{ fontSize: 13, color: 'var(--muted)', lineHeight: 1.7 }}>Month to month. Cancel any time.<br />No setup fees.</div>
          </div>
          <div>
            <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 10, color: 'var(--orange)', letterSpacing: 2, textTransform: 'uppercase', marginBottom: 8 }}>Enterprise custom terms</div>
            <div style={{ fontSize: 13, color: 'var(--muted)', lineHeight: 1.7 }}>
              Need a custom seat count, data agreement,<br />or API access? <Link href="/contact" style={{ color: 'var(--white)', textDecoration: 'underline' }}>Talk to us.</Link>
            </div>
          </div>
          <div>
            <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 10, color: 'var(--orange)', letterSpacing: 2, textTransform: 'uppercase', marginBottom: 8 }}>Questions</div>
            <div style={{ fontSize: 13, color: 'var(--muted)', lineHeight: 1.7 }}>
              Not sure which plan fits?<br /><Link href="/contact" style={{ color: 'var(--white)', textDecoration: 'underline' }}>We'll help you figure it out.</Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
