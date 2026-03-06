const POSTS = [
  {
    name: 'Drew Gurley',
    company: 'Senior Market Advisors',
    text: "What I really like about Recruiterrr is that it immediately became an accelerator in our onboarding process. Building a recurring book of business takes time and with Recruiterrr, we are giving our team a short cut to the right types of accounts they should be prospecting. Aaron solved a problem that was right under a lot of people's nose!",
  },
]

export default function WallPage() {
  return (
    <>
      <section className="site-section site-section-paper">
        <div className="site-inner">
          <div className="site-eyebrow-orange">The Wall</div>
          <h1 className="site-h1">WHAT PEOPLE<br /><span>ARE SAYING.</span></h1>
          <p className="site-lead" style={{ maxWidth: 440 }}>Real feedback. No edits.</p>
        </div>
      </section>

      <section className="site-section site-section-white site-section-divider">
        <div className="site-inner">
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16, maxWidth: 760 }}>
            {POSTS.map((p, i) => (
              <div key={i} className="site-card" style={{ padding: '36px 40px' }}>
                <p style={{ fontSize: 17, color: 'var(--site-ink-2)', lineHeight: 1.85, fontStyle: 'italic', marginBottom: 28 }}>
                  &ldquo;{p.text}&rdquo;
                </p>
                <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                  <div style={{ width: 3, height: 36, background: 'var(--site-orange)', borderRadius: 2, flexShrink: 0 }} />
                  <div>
                    <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 12, color: 'var(--site-ink)', fontWeight: 500, letterSpacing: 0.5 }}>{p.name}</div>
                    <div className="site-body" style={{ marginTop: 2 }}>{p.company}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </>
  )
}
