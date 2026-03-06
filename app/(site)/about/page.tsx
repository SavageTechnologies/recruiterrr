import Link from 'next/link'

const HOW_WE_DO_IT = [
  ['Market Intelligence Layer', 'Proprietary data aggregation across public business registries, review platforms, and local directories — updated live on every search.'],
  ['Presence Analysis Engine', 'Automated deep crawl of agent web properties to extract carrier relationships, independence signals, and product focus areas.'],
  ['Labor Signal Detection', 'Real-time monitoring of employment activity to identify agencies actively expanding their producer headcount.'],
  ['Digital Footprint Scoring', 'Cross-platform content analysis that surfaces agents building public-facing brands — a strong proxy for independence and tech adoption.'],
  ['Proprietary Scoring Model', 'An insurance-industry-trained AI model that synthesizes all available signals into a single recruitability score, calibrated specifically for FMO and IMO use cases.'],
  ['Live Data Architecture', 'No static databases. No purchased lists. Every search executes the full pipeline in real time — so the intelligence you get is always current.'],
]

export default function AboutPage() {
  return (
    <>
      {/* HERO */}
      <section className="site-section site-section-paper">
        <div className="site-inner">
          <div className="site-eyebrow-orange">About</div>
          <h1 className="site-h1">BUILT FOR<br /><span>RECRUITERS.</span></h1>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20, maxWidth: 660 }}>
            <p className="site-lead">Recruiting independent insurance professionals is one of the hardest parts of building an FMO, IMO, or advisory firm. The producers worth recruiting are usually the hardest to find — they don't respond to cold emails, they're not on lead lists, and they've heard every pitch before.</p>
            <p className="site-body" style={{ fontSize: 15, color: 'var(--site-ink-2)', lineHeight: 1.85 }}>Recruiterrr was built to change that. Instead of buying stale lists or cold calling blind, you get a real-time intelligence feed on every independent producer in any market — their reviews, their carriers, their web presence, whether they're hiring, and whether they have a YouTube channel.</p>
            <p className="site-body" style={{ fontSize: 15, color: 'var(--site-ink-2)', lineHeight: 1.85 }}>We started in the Medicare and senior health space because that's where the recruiting problem is most acute. But the platform is built to work across life, ACA, annuities, and financial advisory — any market where independence is the signal and the right conversation is worth finding.</p>
            <p className="site-body" style={{ fontSize: 15, color: 'var(--site-ink-2)', lineHeight: 1.85 }}>If you're growing a downline, building a team, or expanding into a new market — this is the tool we wish we had.</p>
          </div>
        </div>
      </section>

      {/* HOW WE DO IT */}
      <section className="site-section site-section-white site-section-divider">
        <div className="site-inner">
          <div className="site-eyebrow">How We Do It</div>
          <h2 className="site-h2">SIX LAYERS OF <span>INTELLIGENCE.</span></h2>
          <div className="site-grid-bordered" style={{ gridTemplateColumns: 'repeat(2, 1fr)' }}>
            {HOW_WE_DO_IT.map(([title, desc]) => (
              <div key={title} className="site-tool-card">
                <div className="site-label" style={{ marginBottom: 10 }}>{title}</div>
                <p className="site-body">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="site-section site-section-paper-2 site-section-divider">
        <div className="site-inner" style={{ textAlign: 'center', maxWidth: 600, margin: '0 auto' }}>
          <div className="site-eyebrow">Get Started</div>
          <h2 className="site-h2" style={{ marginBottom: 20 }}>READY TO <span>RECRUIT SMARTER?</span></h2>
          <p className="site-lead" style={{ marginBottom: 40 }}>The intelligence exists. We built the system that reads it.</p>
          <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
            <Link href="/pricing" className="site-btn-primary">Request Access</Link>
            <Link href="/pricing" className="site-btn-ghost">See Pricing →</Link>
          </div>
        </div>
      </section>
    </>
  )
}
