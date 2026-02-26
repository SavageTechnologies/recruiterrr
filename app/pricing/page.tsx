import Link from 'next/link'
import PageNav from '@/components/PageNav'
import PageFooter from '@/components/PageFooter'

const TIERS = [
  {
    name: 'FREE',
    price: '$0',
    period: 'forever',
    tag: 'GET STARTED',
    tagColor: 'var(--muted)',
    accent: '#3a3732',
    featured: false,
    cta: 'CREATE FREE ACCOUNT',
    ctaHref: '/sign-up',
    ctaStyle: 'outline',
    features: [
      { label: 'Agent search', detail: '10 searches per month' },
      { label: 'Results per search', detail: 'Up to 10 agents' },
      { label: 'AI scoring', detail: 'HOT / WARM / COLD' },
      { label: 'Search history', detail: 'Last 30 days' },
      { label: 'Dashboard access', detail: null },
      { label: 'Prometheus TCPA scanner', detail: null, excluded: true },
      { label: 'ANATHEMA distribution scanner', detail: null, excluded: true },
      { label: 'YouTube & hiring signals', detail: null, excluded: true },
      { label: 'Priority support', detail: null, excluded: true },
    ],
  },
  {
    name: 'OPERATOR',
    price: '$499',
    priceDetail: '.95',
    period: 'per month',
    tag: 'MOST POPULAR',
    tagColor: 'var(--orange)',
    accent: 'var(--orange)',
    featured: true,
    cta: 'START OPERATOR',
    ctaHref: '/contact',
    ctaStyle: 'filled',
    features: [
      { label: 'Agent search', detail: '200 searches per month' },
      { label: 'Results per search', detail: 'Up to 50 agents' },
      { label: 'AI scoring', detail: 'HOT / WARM / COLD' },
      { label: 'YouTube & hiring signals', detail: 'Full enrichment' },
      { label: 'Search history', detail: 'Full history' },
      { label: 'Prometheus TCPA scanner', detail: '50 scans per month' },
      { label: 'ANATHEMA distribution scanner', detail: null, excluded: true },
      { label: 'Dashboard access', detail: null },
      { label: 'Priority support', detail: null, excluded: true },
    ],
  },
  {
    name: 'ENTERPRISE',
    price: '$10,000',
    period: 'per month',
    tag: 'FULL ACCESS',
    tagColor: 'var(--green)',
    accent: 'var(--green)',
    featured: false,
    cta: 'CONTACT US',
    ctaHref: '/contact',
    ctaStyle: 'outline-green',
    features: [
      { label: 'Agent search', detail: 'Unlimited' },
      { label: 'Results per search', detail: 'Up to 50 agents' },
      { label: 'AI scoring', detail: 'HOT / WARM / COLD' },
      { label: 'YouTube & hiring signals', detail: 'Full enrichment' },
      { label: 'Search history', detail: 'Full history' },
      { label: 'Prometheus TCPA scanner', detail: 'Unlimited scans' },
      { label: 'ANATHEMA distribution scanner', detail: 'Unlimited scans' },
      { label: 'White-label & data reuse rights', detail: 'Internal use' },
      { label: 'Multi-seat team access', detail: 'Up to 10 users' },
      { label: 'Priority support', detail: 'Dedicated contact' },
      { label: 'Early access to new features', detail: null },
    ],
  },
]

export default function PricingPage() {
  return (
    <div style={{ minHeight: '100vh', background: 'var(--black)', color: 'var(--white)' }}>
      <PageNav />

      {/* Hero */}
      <div style={{ maxWidth: 1100, padding: '80px 40px 0' }}>
        <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 11, color: 'var(--orange)', letterSpacing: 3, textTransform: 'uppercase', marginBottom: 16 }}>
          Pricing
        </div>
        <h1 style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 'clamp(56px, 8vw, 96px)', letterSpacing: 2, lineHeight: 0.9, marginBottom: 24, color: 'var(--white)' }}>
          PAY FOR WHAT<br /><span style={{ color: 'var(--orange)' }}>YOU RECRUIT.</span>
        </h1>
        <p style={{ fontSize: 15, color: 'var(--muted)', maxWidth: 480, lineHeight: 1.7, marginBottom: 64 }}>
          Start free. Scale when it's working. Enterprise when you're ready to run markets at volume.
        </p>
      </div>

      {/* Pricing grid */}
      <div style={{ maxWidth: 1100, padding: '0 40px 80px', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 2 }}>
        {TIERS.map((tier) => (
          <div
            key={tier.name}
            style={{
              background: tier.featured ? '#1e1b17' : 'var(--card)',
              border: `1px solid ${tier.featured ? 'var(--orange)' : 'var(--border)'}`,
              display: 'flex',
              flexDirection: 'column',
              position: 'relative',
              overflow: 'hidden',
            }}
          >
            {/* Top accent bar */}
            <div style={{ height: 3, background: tier.accent, width: '100%' }} />

            <div style={{ padding: '36px 32px', flex: 1, display: 'flex', flexDirection: 'column' }}>

              {/* Tag */}
              <div style={{
                fontFamily: "'DM Mono', monospace",
                fontSize: 9,
                letterSpacing: 2,
                color: tier.tagColor,
                border: `1px solid ${tier.tagColor}`,
                padding: '3px 8px',
                display: 'inline-block',
                marginBottom: 24,
                alignSelf: 'flex-start',
              }}>
                {tier.tag}
              </div>

              {/* Tier name */}
              <div style={{
                fontFamily: "'Bebas Neue', sans-serif",
                fontSize: 32,
                letterSpacing: 3,
                color: 'var(--white)',
                marginBottom: 20,
              }}>
                {tier.name}
              </div>

              {/* Price */}
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: 2, marginBottom: 6 }}>
                <span style={{
                  fontFamily: "'Bebas Neue', sans-serif",
                  fontSize: 64,
                  letterSpacing: 1,
                  lineHeight: 1,
                  color: tier.featured ? 'var(--orange)' : 'var(--white)',
                }}>
                  {tier.price}
                </span>
                {tier.priceDetail && (
                  <span style={{
                    fontFamily: "'Bebas Neue', sans-serif",
                    fontSize: 32,
                    color: 'var(--orange)',
                    marginTop: 8,
                  }}>
                    {tier.priceDetail}
                  </span>
                )}
              </div>
              <div style={{
                fontFamily: "'DM Mono', monospace",
                fontSize: 10,
                color: 'var(--muted)',
                letterSpacing: 1,
                marginBottom: 36,
              }}>
                {tier.period}
              </div>

              {/* Divider */}
              <div style={{ height: 1, background: 'var(--border)', marginBottom: 28 }} />

              {/* Features */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14, flex: 1, marginBottom: 36 }}>
                {tier.features.map((f, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
                    <span style={{
                      fontSize: 12,
                      color: f.excluded ? '#333' : tier.accent === 'var(--orange)' ? 'var(--orange)' : f.excluded ? '#333' : tier.accent === 'var(--green)' ? 'var(--green)' : 'var(--muted)',
                      marginTop: 1,
                      flexShrink: 0,
                    }}>
                      {f.excluded ? '—' : '✦'}
                    </span>
                    <div>
                      <span style={{
                        fontSize: 13,
                        color: f.excluded ? '#333' : 'var(--white)',
                      }}>
                        {f.label}
                      </span>
                      {f.detail && !f.excluded && (
                        <span style={{
                          fontFamily: "'DM Mono', monospace",
                          fontSize: 10,
                          color: 'var(--muted)',
                          letterSpacing: 0.5,
                          marginLeft: 8,
                        }}>
                          — {f.detail}
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              {/* CTA */}
              <Link
                href={tier.ctaHref}
                style={{
                  display: 'block',
                  textAlign: 'center',
                  padding: '16px',
                  fontFamily: "'Bebas Neue', sans-serif",
                  fontSize: 18,
                  letterSpacing: 3,
                  textDecoration: 'none',
                  ...(tier.ctaStyle === 'filled'
                    ? { background: 'var(--orange)', color: 'var(--black)', border: '1px solid var(--orange)' }
                    : tier.ctaStyle === 'outline-green'
                    ? { background: 'transparent', color: 'var(--green)', border: '1px solid var(--green)' }
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

      {/* Bottom note */}
      <div style={{ maxWidth: 1100, padding: '0 40px 80px' }}>
        <div style={{ borderTop: '1px solid var(--border)', paddingTop: 40, display: 'flex', gap: 60, flexWrap: 'wrap' }}>
          <div>
            <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 10, color: 'var(--orange)', letterSpacing: 2, textTransform: 'uppercase', marginBottom: 8 }}>
              No contracts
            </div>
            <div style={{ fontSize: 13, color: 'var(--muted)', lineHeight: 1.7 }}>
              Month to month. Cancel any time.<br />No setup fees.
            </div>
          </div>
          <div>
            <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 10, color: 'var(--orange)', letterSpacing: 2, textTransform: 'uppercase', marginBottom: 8 }}>
              Enterprise custom terms
            </div>
            <div style={{ fontSize: 13, color: 'var(--muted)', lineHeight: 1.7 }}>
              Need a custom seat count, data agreement,<br />or API access? <Link href="/contact" style={{ color: 'var(--white)', textDecoration: 'underline' }}>Talk to us.</Link>
            </div>
          </div>
          <div>
            <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 10, color: 'var(--orange)', letterSpacing: 2, textTransform: 'uppercase', marginBottom: 8 }}>
              Questions
            </div>
            <div style={{ fontSize: 13, color: 'var(--muted)', lineHeight: 1.7 }}>
              Not sure which plan fits?<br /><Link href="/contact" style={{ color: 'var(--white)', textDecoration: 'underline' }}>We'll help you figure it out.</Link>
            </div>
          </div>
        </div>
      </div>

      <PageFooter />
    </div>
  )
}
