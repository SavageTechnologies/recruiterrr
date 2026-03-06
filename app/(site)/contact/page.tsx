import Link from 'next/link'

const CONTACTS = [
  { label: 'General Questions', value: 'hello@recruiterrr.com' },
  { label: 'Support',           value: 'support@recruiterrr.com' },
  { label: 'Feature Requests',  value: 'ideas@recruiterrr.com' },
  { label: 'Enterprise / Teams',value: 'sales@recruiterrr.com' },
]

export default function ContactPage() {
  return (
    <>
      <section className="site-section site-section-paper">
        <div className="site-inner">
          <div className="site-eyebrow-orange">Contact</div>
          <h1 className="site-h1">LET&apos;S<br /><span>TALK.</span></h1>
          <p className="site-lead" style={{ maxWidth: 520, marginBottom: 60 }}>
            We&apos;re a small team. You&apos;ll get a real person, not a ticket queue.
          </p>
          <div className="site-grid-bordered" style={{ gridTemplateColumns: 'repeat(2, 1fr)', marginBottom: 64 }}>
            {CONTACTS.map(c => (
              <div key={c.label} style={{ background: 'var(--site-white)', padding: '32px 36px' }}>
                <div className="site-eyebrow" style={{ marginBottom: 10 }}>{c.label}</div>
                <a href={`mailto:${c.value}`} style={{ fontSize: 15, color: 'var(--site-orange)', textDecoration: 'none', fontWeight: 500 }}>
                  {c.value}
                </a>
              </div>
            ))}
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <div className="site-card" style={{ padding: '32px 28px' }}>
              <div className="site-label" style={{ marginBottom: 12 }}>Response time</div>
              <p className="site-body">We typically respond within one business day. For urgent issues, email support directly.</p>
            </div>
            <div className="site-card" style={{ padding: '32px 28px' }}>
              <div className="site-label" style={{ marginBottom: 12 }}>Enterprise inquiries</div>
              <p className="site-body">Interested in team access or a custom agreement? <Link href="mailto:sales@recruiterrr.com" style={{ color: 'var(--site-ink)', textDecoration: 'underline' }}>Email our sales team</Link> and we&apos;ll set up a call.</p>
            </div>
          </div>
        </div>
      </section>
    </>
  )
}
