import Link from 'next/link'

const FEATURES = [
  { label: 'Agent search',              detail: '15 searches per hour' },
  { label: 'Up to 50 results',          detail: 'per search' },
  { label: 'AI recruitability scoring', detail: 'HOT / WARM / COLD + analyst notes' },
  { label: 'YouTube & hiring signals',  detail: 'Full enrichment on every agent' },
  { label: 'Website & carrier intel',   detail: 'Auto-crawled per result' },
  { label: 'ANATHEMA included',         detail: 'Distribution tree analysis — 20 scans/hr' },
  { label: 'PROMETHEUS included',       detail: 'FMO competitive intelligence — 20 scans/hr' },
  { label: 'Search history',            detail: 'Full history, reload instantly' },
  { label: 'Agent database',            detail: 'Persistent — every agent saved' },
  { label: 'Dashboard access',          detail: 'All past searches at a glance' },
]

const MODULES = [
  {
    name: 'SEARCH',
    sub: 'Agent discovery engine',
    accent: 'var(--site-orange)',
    features: ['15 searches per hour', 'Up to 50 results per search', 'HOT / WARM / COLD scoring', 'YouTube & hiring signals', 'Website & carrier intel', 'Persistent agent database'],
  },
  {
    name: 'ANATHEMA',
    sub: 'Distribution tree analysis',
    accent: 'var(--site-green)',
    features: ['Predict Integrity, AmeriLife, or SMS', 'Stage I–IV confidence scale', 'Confidence score per prediction', 'Signal breakdown — what gave it away', 'Changes how you approach every call', '20 scans per hour'],
  },
  {
    name: 'PROMETHEUS',
    sub: 'FMO competitive intelligence',
    accent: 'var(--site-orange)',
    features: ['Enter any FMO or IMO name', 'Auto-crawls site + 5 SERP queries', 'Carrier stack + trips + lead program', 'Their full recruiting pitch decoded', 'Custom counter-script to beat them', '20 scans per hour'],
  },
]

const BOTTOM_NOTES = [
  { label: 'No contracts', body: 'Month to month. Cancel any time. No setup fees.' },
  { label: 'Questions', body: "Not sure what fits? We'll help you figure it out.", href: '/contact' },
]

export default function PricingPage() {
  return (
    <>
      {/* HERO */}
      <section className="site-section site-section-paper">
        <div className="site-inner">
          <div className="site-eyebrow-orange">Pricing</div>
          <h1 className="site-h1">ONE PRICE.<br /><span>EVERYTHING INCLUDED.</span></h1>
          <p className="site-lead" style={{ maxWidth: 520, marginBottom: 0 }}>
            Agent search, distribution tree analysis, and FMO competitive intelligence — all in one platform. No add-ons. No unlocks. Just the full stack.
          </p>
        </div>
      </section>

      {/* MAIN PLAN */}
      <section className="site-section site-section-white site-section-divider">
        <div className="site-inner">
          <div className="site-eyebrow" style={{ marginBottom: 8 }}>Base Plan — Full Stack Included</div>
          <div style={{ border: '1px solid var(--site-border)', borderRadius: 'var(--radius-md)', overflow: 'hidden', boxShadow: 'var(--site-shadow-md)', marginBottom: 48 }}>
            {/* Orange top accent */}
            <div style={{ height: 3, background: 'var(--site-orange)' }} />
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr' }}>
              {/* Price + CTA */}
              <div style={{ padding: '40px', borderRight: '1px solid var(--site-border)', background: 'var(--site-paper)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 24 }}>
                  <span className="site-label">OPERATOR</span>
                  <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 9, color: 'var(--site-ink-4)', letterSpacing: 1 }}>FULL ACCESS</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: 2, marginBottom: 4 }}>
                  <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 18, color: 'var(--site-orange)', marginTop: 14 }}>$</span>
                  <span style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 80, letterSpacing: 1, lineHeight: 1, color: 'var(--site-orange)' }}>
                    {process.env.NEXT_PUBLIC_PRO_PRICE_WHOLE || '499'}
                  </span>
                  <span style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 40, color: 'var(--site-orange)', marginTop: 18 }}>.95</span>
                </div>
                <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 10, color: 'var(--site-ink-4)', letterSpacing: 1, marginBottom: 36 }}>
                  per month · no contract · cancel anytime
                </div>
                <Link href="/sign-up" className="site-btn-primary" style={{ display: 'block', textAlign: 'center', marginBottom: 12 }}>
                  START OPERATOR
                </Link>
                <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 9, color: 'var(--site-ink-4)', letterSpacing: 1, textAlign: 'center' }}>
                  No setup fees. Cancel anytime.
                </div>
              </div>

              {/* Features */}
              <div style={{ padding: '40px', background: 'var(--site-white)' }}>
                <div className="site-eyebrow" style={{ marginBottom: 24 }}>What&apos;s included</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                  {FEATURES.map((f, i) => (
                    <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
                      <span style={{ fontSize: 10, color: 'var(--site-orange)', marginTop: 2, flexShrink: 0 }}>✦</span>
                      <div>
                        <span style={{ fontSize: 13, color: 'var(--site-ink)', fontWeight: 500 }}>{f.label}</span>
                        <span className="site-body" style={{ marginLeft: 6 }}>— {f.detail}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* MODULES */}
          <div className="site-eyebrow" style={{ marginBottom: 16 }}>Everything that&apos;s included</div>
          <div className="site-grid-bordered" style={{ gridTemplateColumns: 'repeat(3, 1fr)', marginBottom: 48 }}>
            {MODULES.map(mod => (
              <div key={mod.name} className="site-tool-card" style={{ '--tool-accent': mod.accent } as React.CSSProperties}>
                <h3 className="site-h3" style={{ marginBottom: 4 }}>{mod.name}</h3>
                <div className="site-body" style={{ marginBottom: 24 }}>{mod.sub}</div>
                <div style={{ height: 1, background: 'var(--site-border)', marginBottom: 20 }} />
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {mod.features.map((f, i) => (
                    <div key={i} style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                      <span style={{ fontSize: 9, color: mod.accent, flexShrink: 0, marginTop: 3 }}>✦</span>
                      <span className="site-body">{f}</span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>

          {/* ENTERPRISE + API */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 64 }}>
            {/* Enterprise */}
            <div className="site-card" style={{ padding: '36px 32px' }}>
              <div className="site-eyebrow" style={{ marginBottom: 12 }}>Enterprise</div>
              <h3 className="site-h3" style={{ marginBottom: 12, fontSize: 32 }}>TEAM ACCESS</h3>
              <p className="site-body" style={{ marginBottom: 24 }}>Multi-seat access, shared agent database, custom data agreements, and priority support. Pricing based on team size and feature set.</p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 28 }}>
                {['Up to 10 seats', 'Shared team agent database', 'All intelligence modules included', 'Dedicated support contact', 'Early access to new features', 'Custom data & white-label terms'].map((f, i) => (
                  <div key={i} style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                    <span style={{ fontSize: 9, color: 'var(--site-orange)', flexShrink: 0 }}>✦</span>
                    <span className="site-body">{f}</span>
                  </div>
                ))}
              </div>
              <Link href="/contact" className="site-btn-ghost" style={{ display: 'block', textAlign: 'center' }}>CONTACT US</Link>
            </div>

            {/* David API */}
            <div style={{ padding: '36px 32px', border: '1px solid var(--site-purple-border)', borderRadius: 'var(--radius-md)', background: 'var(--site-purple-dim)', position: 'relative', overflow: 'hidden' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                <span style={{ display: 'inline-block', width: 6, height: 6, borderRadius: '50%', background: 'var(--site-purple)', animation: 'siteLivePulse 2s ease infinite' }} />
                <div className="site-label" style={{ color: 'var(--site-purple)' }}>Coming Soon</div>
              </div>
              <h3 className="site-h3" style={{ marginBottom: 12, fontSize: 32, color: 'var(--site-purple)' }}>DAVID API</h3>
              <p className="site-body" style={{ marginBottom: 24 }}>Bring Recruiterrr intelligence directly into your CRM, dialer, or AI writer. Structured agent payloads via REST API — tree prediction, recruit score, personal facts, carrier mix.</p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 28 }}>
                {['Structured JSON payload per agent', 'Tree + sub-IMO + confidence score', 'HOT / WARM / COLD flag', 'Bulk query up to 1,000 agents', 'Drop into any CRM or AI workflow'].map((f, i) => (
                  <div key={i} style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                    <span style={{ fontSize: 9, color: 'var(--site-purple)', flexShrink: 0 }}>✦</span>
                    <span className="site-body">{f}</span>
                  </div>
                ))}
              </div>
              <Link href="/contact" className="site-btn-ghost" style={{ display: 'block', textAlign: 'center', borderColor: 'var(--site-purple-border)', color: 'var(--site-purple)' }}>JOIN WAITLIST</Link>
            </div>
          </div>

          {/* Bottom notes */}
          <div style={{ borderTop: '1px solid var(--site-border)', paddingTop: 40, display: 'flex', gap: 60, flexWrap: 'wrap' }}>
            <div>
              <div className="site-label" style={{ marginBottom: 8 }}>No contracts</div>
              <p className="site-body">Month to month.<br />Cancel any time. No setup fees.</p>
            </div>
            <div>
              <div className="site-label" style={{ marginBottom: 8 }}>Questions</div>
              <p className="site-body">Not sure what fits?<br /><Link href="/contact" style={{ color: 'var(--site-ink)', textDecoration: 'underline' }}>We&apos;ll help you figure it out.</Link></p>
            </div>
          </div>
        </div>
      </section>
    </>
  )
}
