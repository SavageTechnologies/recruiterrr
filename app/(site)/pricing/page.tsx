import Link from 'next/link'

export default function PricingPage() {
  return (
    <div style={{ color: 'var(--white)' }}>
      <style>{`
        @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.3} }
        @keyframes fadeUp { from{opacity:0;transform:translateY(12px)} to{opacity:1;transform:translateY(0)} }
        .addon-card:hover { border-color: var(--hover-color) !important; }
      `}</style>

      {/* ── HERO ── */}
      <div style={{ maxWidth: 1100, padding: '80px 40px 72px' }}>
        <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 11, color: 'var(--orange)', letterSpacing: 3, textTransform: 'uppercase', marginBottom: 16 }}>
          Pricing
        </div>
        <h1 style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 'clamp(56px, 8vw, 96px)', letterSpacing: 2, lineHeight: 0.9, marginBottom: 24 }}>
          ONE PRICE.<br /><span style={{ color: 'var(--orange)' }}>EVERYTHING INCLUDED.</span>
        </h1>
        <p style={{ fontSize: 15, color: 'var(--muted)', maxWidth: 520, lineHeight: 1.7 }}>
          Agent search, distribution tree analysis, and FMO competitive intelligence — all in one platform. No add-ons. No unlocks. Just the full stack.
        </p>
      </div>

      <div style={{ maxWidth: 1100, padding: '0 40px 80px' }}>

        {/* ── OPERATOR BASE PLAN ── */}
        <div style={{ marginBottom: 4 }}>
          <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 9, color: '#444', letterSpacing: 3, textTransform: 'uppercase', marginBottom: 12 }}>
            Base Plan — Full Stack Included
          </div>
        </div>

        <div style={{
          background: '#1e1b17',
          border: '1px solid var(--orange)',
          position: 'relative',
          overflow: 'hidden',
          marginBottom: 48,
        }}>
          <div style={{ height: 3, background: 'var(--orange)', width: '100%' }} />

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 0 }}>

            {/* Left — price + CTA */}
            <div style={{ padding: '40px 40px', borderRight: '1px solid var(--border)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 20 }}>
                <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 9, letterSpacing: 2, color: 'var(--orange)', border: '1px solid var(--orange)', padding: '3px 8px' }}>
                  OPERATOR
                </div>
                <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 9, letterSpacing: 2, color: 'var(--muted)', padding: '3px 0' }}>
                  FULL ACCESS
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'flex-start', gap: 2, marginBottom: 4 }}>
                <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 18, color: 'var(--orange)', marginTop: 14, letterSpacing: 0 }}>$</span>
                <span style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 80, letterSpacing: 1, lineHeight: 1, color: 'var(--orange)' }}>799</span>
              <span style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 40, color: 'var(--orange)', marginTop: 18 }}>.95</span>
              </div>
              <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 10, color: 'var(--muted)', letterSpacing: 1, marginBottom: 36 }}>
                per month · no contract · cancel anytime
              </div>

              <Link href="/sign-up" style={{
                display: 'block', textAlign: 'center', padding: '18px 32px',
                background: 'var(--orange)', color: 'var(--black)',
                fontFamily: "'Bebas Neue', sans-serif", fontSize: 20, letterSpacing: 3,
                textDecoration: 'none', marginBottom: 12,
              }}>
                START OPERATOR
              </Link>
              <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 9, color: '#444', letterSpacing: 1, textAlign: 'center' }}>
                No setup fees. Cancel anytime.
              </div>
            </div>

            {/* Right — features */}
            <div style={{ padding: '40px 40px' }}>
              <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 9, color: '#444', letterSpacing: 2, textTransform: 'uppercase', marginBottom: 24 }}>
                What's included
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                {[
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
                ].map((f, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
                    <span style={{ fontSize: 10, color: 'var(--orange)', marginTop: 2, flexShrink: 0 }}>✦</span>
                    <div>
                      <span style={{ fontSize: 13, color: 'var(--white)' }}>{f.label}</span>
                      <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 10, color: 'var(--muted)', letterSpacing: 0.5, marginLeft: 8 }}>
                        — {f.detail}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

          </div>
        </div>

        {/* ── INCLUDED MODULES ── */}
        <div style={{ marginBottom: 48 }}>
          <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 9, color: '#444', letterSpacing: 3, textTransform: 'uppercase', marginBottom: 16 }}>
            Everything that's included
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 2 }}>

            {/* SEARCH */}
            <div style={{ background: 'var(--card)', border: '1px solid var(--border)', borderTop: '3px solid var(--orange)', padding: '32px 28px' }}>
              <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 28, letterSpacing: 3, color: 'var(--white)', marginBottom: 6 }}>SEARCH</div>
              <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 10, color: 'var(--muted)', letterSpacing: 1, marginBottom: 24, lineHeight: 1.6 }}>Agent discovery engine</div>
              <div style={{ height: 1, background: 'var(--border)', marginBottom: 24 }} />
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {['15 searches per hour', 'Up to 50 results per search', 'HOT / WARM / COLD scoring', 'YouTube & hiring signals', 'Website & carrier intel', 'Persistent agent database'].map((f, i) => (
                  <div key={i} style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                    <span style={{ fontSize: 9, color: 'var(--orange)', flexShrink: 0, marginTop: 3 }}>✦</span>
                    <span style={{ fontSize: 12, color: 'var(--muted)', lineHeight: 1.5 }}>{f}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* ANATHEMA */}
            <div style={{ background: 'var(--card)', border: '1px solid var(--border)', borderTop: '3px solid var(--green)', padding: '32px 28px' }}>
              <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 28, letterSpacing: 3, color: 'var(--white)', marginBottom: 6 }}>ANATHEMA</div>
              <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 10, color: 'var(--muted)', letterSpacing: 1, marginBottom: 24, lineHeight: 1.6 }}>Distribution tree analysis</div>
              <div style={{ height: 1, background: 'var(--border)', marginBottom: 24 }} />
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {['Predict Integrity, AmeriLife, or SMS affiliation', 'Stage I–IV infection scale per agent', 'Confidence score on every prediction', 'Signal breakdown — what gave it away', 'Changes how you approach every call', '20 scans per hour'].map((f, i) => (
                  <div key={i} style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                    <span style={{ fontSize: 9, color: 'var(--green)', flexShrink: 0, marginTop: 3 }}>✦</span>
                    <span style={{ fontSize: 12, color: 'var(--muted)', lineHeight: 1.5 }}>{f}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* PROMETHEUS */}
            <div style={{ background: 'var(--card)', border: '1px solid var(--border)', borderTop: '3px solid var(--orange)', padding: '32px 28px' }}>
              <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 28, letterSpacing: 3, color: 'var(--white)', marginBottom: 6 }}>PROMETHEUS</div>
              <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 10, color: 'var(--muted)', letterSpacing: 1, marginBottom: 24, lineHeight: 1.6 }}>FMO competitive intelligence</div>
              <div style={{ height: 1, background: 'var(--border)', marginBottom: 24 }} />
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {['Enter any FMO or IMO name', 'Auto-crawls their site + 5 SERP queries', 'Carrier stack + incentive trips + lead program', 'Their full recruiting pitch decoded', 'Custom counter-script written to beat them', '20 scans per hour'].map((f, i) => (
                  <div key={i} style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                    <span style={{ fontSize: 9, color: 'var(--orange)', flexShrink: 0, marginTop: 3 }}>✦</span>
                    <span style={{ fontSize: 12, color: 'var(--muted)', lineHeight: 1.5 }}>{f}</span>
                  </div>
                ))}
              </div>
            </div>

          </div>
        </div>

        {/* ── ENTERPRISE ── */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2, marginBottom: 48 }}>

          {/* Enterprise */}
          <div style={{ background: 'var(--card)', border: '1px solid var(--border)', padding: '36px 32px' }}>
            <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 9, color: 'var(--muted)', letterSpacing: 2, marginBottom: 12 }}>
              ENTERPRISE
            </div>
            <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 36, letterSpacing: 2, color: 'var(--white)', marginBottom: 8 }}>
              TEAM ACCESS
            </div>
            <div style={{ fontSize: 13, color: 'var(--muted)', lineHeight: 1.7, marginBottom: 28, maxWidth: 340 }}>
              Multi-seat access, shared agent database, custom data agreements, and priority support. Pricing based on team size and feature set.
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 28 }}>
              {[
                'Up to 10 seats',
                'Shared team agent database',
                'All intelligence modules included',
                'Dedicated support contact',
                'Early access to new features',
                'Custom data & white-label terms',
              ].map((f, i) => (
                <div key={i} style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                  <span style={{ fontSize: 9, color: 'var(--orange)', flexShrink: 0 }}>✦</span>
                  <span style={{ fontSize: 13, color: 'var(--muted)' }}>{f}</span>
                </div>
              ))}
            </div>
            <Link href="/contact" style={{
              display: 'block', textAlign: 'center', padding: '16px',
              background: 'transparent', border: '1px solid var(--border)',
              color: 'var(--white)', fontFamily: "'Bebas Neue', sans-serif",
              fontSize: 18, letterSpacing: 3, textDecoration: 'none',
            }}>
              CONTACT US
            </Link>
          </div>

          {/* David API waitlist */}
          <div style={{ background: '#0a0a0f', border: '1px solid #1a1520', padding: '36px 32px', position: 'relative', overflow: 'hidden' }}>
            <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(ellipse at 80% 20%, rgba(167,139,250,0.04) 0%, transparent 60%)', pointerEvents: 'none' }} />
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
              <span style={{ display: 'inline-block', width: 6, height: 6, borderRadius: '50%', background: '#a78bfa', animation: 'pulse 2s ease infinite' }} />
              <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 9, color: '#a78bfa', letterSpacing: 2 }}>
                COMING SOON
              </div>
            </div>
            <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 36, letterSpacing: 2, color: '#a78bfa', marginBottom: 8 }}>
              DAVID API
            </div>
            <div style={{ fontSize: 13, color: '#555', lineHeight: 1.7, marginBottom: 28, maxWidth: 340 }}>
              Bring Recruiterrr intelligence directly into your CRM, dialer, or AI writer. Structured agent payloads via REST API — tree prediction, recruit score, personal facts, carrier mix.
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 28 }}>
              {[
                'Structured JSON payload per agent',
                'Tree + sub-IMO + confidence score',
                'HOT / WARM / COLD flag',
                'Bulk query up to 1,000 agents',
                'Drop into any CRM or AI workflow',
              ].map((f, i) => (
                <div key={i} style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                  <span style={{ fontSize: 9, color: '#3a3045', flexShrink: 0 }}>✦</span>
                  <span style={{ fontSize: 13, color: '#444' }}>{f}</span>
                </div>
              ))}
            </div>
            <Link href="/contact" style={{
              display: 'block', textAlign: 'center', padding: '16px',
              background: 'transparent', border: '1px solid #2a2035',
              color: '#a78bfa', fontFamily: "'Bebas Neue', sans-serif",
              fontSize: 18, letterSpacing: 3, textDecoration: 'none',
            }}>
              JOIN WAITLIST
            </Link>
          </div>

        </div>

        {/* ── BOTTOM NOTES ── */}
        <div style={{ borderTop: '1px solid var(--border)', paddingTop: 40, display: 'flex', gap: 60, flexWrap: 'wrap' }}>
          <div>
            <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 10, color: 'var(--orange)', letterSpacing: 2, textTransform: 'uppercase', marginBottom: 8 }}>
              No contracts
            </div>
            <div style={{ fontSize: 13, color: 'var(--muted)', lineHeight: 1.7 }}>
              Month to month.<br />Cancel any time. No setup fees.
            </div>
          </div>
          <div>
            <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 10, color: 'var(--orange)', letterSpacing: 2, textTransform: 'uppercase', marginBottom: 8 }}>
              Questions
            </div>
            <div style={{ fontSize: 13, color: 'var(--muted)', lineHeight: 1.7 }}>
              Not sure what fits?<br />
              <Link href="/contact" style={{ color: 'var(--white)', textDecoration: 'underline' }}>We'll help you figure it out.</Link>
            </div>
          </div>
        </div>

      </div>
    </div>
  )
}
