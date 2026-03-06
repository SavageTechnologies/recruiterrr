import Link from 'next/link'

const JAKE_STATS = [
  { label: 'XBOX',   note: 'primary workstation' },
  { label: 'SNACKS', note: 'continuous delivery' },
  { label: 'MORALE', note: 'always high' },
  { label: 'JOKES',  note: '7/10 land' },
]

export default function TeamPage() {
  return (
    <>
      <section className="site-section site-section-paper">
        <div className="site-inner">
          <div className="site-eyebrow-orange">Team</div>
          <h1 className="site-h1">WHO BUILT<br /><span>THIS.</span></h1>
        </div>
      </section>

      <section className="site-section site-section-white site-section-divider">
        <div className="site-inner">
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16, maxWidth: 760, marginBottom: 48 }}>

            {/* Aaron */}
            <div className="site-card" style={{ padding: '36px 32px', borderColor: 'var(--site-orange-border)', borderWidth: 1 }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 20 }}>
                <div>
                  <h2 className="site-h3" style={{ fontSize: 32, marginBottom: 4 }}>Aaron Sims</h2>
                  <div className="site-label">Founder & Builder — Topeka, KS</div>
                </div>
                <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 8, padding: '4px 10px', border: '1px solid var(--site-orange-border)', color: 'var(--site-orange)', letterSpacing: 1, flexShrink: 0, borderRadius: 3 }}>FOUNDER</span>
              </div>
              <p className="site-body" style={{ fontSize: 15, lineHeight: 1.85 }}>
                Insurance distribution lifer turned builder. Aaron spent years inside the FMO world watching recruiters work blind — cold calling agents they knew nothing about, buying leads from vendors they&apos;d never vetted. He built Recruiterrr to fix it. Every feature exists because he needed it himself. The platform is opinionated because he is. Somewhere along the way he was inspired by a businessman out of Jasper, Missouri — a man named Brad Wesley — who always knew exactly who the players were in any market. Aaron decided that was the right way to operate.
              </p>
            </div>

            {/* Jake */}
            <div className="site-card" style={{ padding: '36px 32px' }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 20 }}>
                <div>
                  <h2 className="site-h3" style={{ fontSize: 32, marginBottom: 4 }}>Jake Sims</h2>
                  <div className="site-label">Co-Pilot & Morale Officer — Age 7</div>
                </div>
                <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 8, padding: '4px 10px', border: '1px solid var(--site-border-2)', color: 'var(--site-ink-3)', letterSpacing: 1, flexShrink: 0, borderRadius: 3 }}>ESSENTIAL PERSONNEL</span>
              </div>
              <p className="site-body" style={{ fontSize: 15, lineHeight: 1.85, marginBottom: 24 }}>
                Every serious operation needs a co-pilot. Jake joined the Recruiterrr team on day one — positioned roughly two feet to the left of the main workstation, Xbox controller in hand. His contributions are difficult to overstate. He maintains team morale through a proprietary system of jokes, snack distribution, and live musical performance. His original setlist includes <em style={{ color: 'var(--site-ink)' }}>&ldquo;Forever Friends&rdquo;</em> — performed on demand, usually mid-sprint. He has never missed a single build session and holds the all-time record for snack consumption per lines of code shipped.
              </p>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                {JAKE_STATS.map(({ label, note }) => (
                  <div key={label} style={{
                    fontFamily: "'DM Mono', monospace", fontSize: 8, letterSpacing: 2,
                    border: '1px solid var(--site-border)', padding: '6px 12px',
                    display: 'flex', flexDirection: 'column', gap: 2, borderRadius: 3,
                  }}>
                    <span style={{ color: 'var(--site-ink)', fontWeight: 500 }}>{label}</span>
                    <span style={{ color: 'var(--site-ink-4)', fontSize: 7 }}>{note}</span>
                  </div>
                ))}
              </div>
            </div>

          </div>

          {/* Join CTA */}
          <div className="site-card" style={{ padding: '32px 28px', maxWidth: 760 }}>
            <div className="site-label" style={{ marginBottom: 12 }}>Want to join?</div>
            <p className="site-body" style={{ marginBottom: 20 }}>We&apos;re a lean team building fast. If you&apos;re obsessed with producer intelligence, distribution tech, or growth — we&apos;d like to hear from you.</p>
            <Link href="/contact" className="site-btn-ghost">Get in Touch →</Link>
          </div>
        </div>
      </section>
    </>
  )
}
