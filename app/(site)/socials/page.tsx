'use client'

import Link from 'next/link'

const LINKS = [
  { label: 'Twitter / X', handle: '@recruiterrr', url: 'https://twitter.com/recruiterrr', desc: 'Product updates, tips, and field wins.' },
  { label: 'LinkedIn',    handle: 'Recruiterrr',  url: 'https://linkedin.com/company/recruiterrr', desc: 'Industry news and platform announcements.' },
  { label: 'YouTube',     handle: 'Recruiterrr',  url: 'https://youtube.com/@recruiterrr', desc: 'Walkthroughs, tutorials, and how-to videos.' },
]

export default function SocialsPage() {
  return (
    <>
      <section className="site-section site-section-paper">
        <div className="site-inner">
          <div className="site-eyebrow-orange">Socials</div>
          <h1 className="site-h1">FIND US<br /><span>ONLINE.</span></h1>
          <p className="site-lead" style={{ maxWidth: 440 }}>Follow along for product updates, field intelligence, and the occasional post about insurance.</p>
        </div>
      </section>

      <section className="site-section site-section-white site-section-divider">
        <div className="site-inner">
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16, maxWidth: 640 }}>
            {LINKS.map(l => (
              <a key={l.label} href={l.url} target="_blank" rel="noopener noreferrer" style={{ textDecoration: 'none', display: 'block' }}>
                <div className="site-card" style={{ padding: '28px 32px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 24 }}>
                  <div>
                    <div className="site-label" style={{ marginBottom: 4 }}>{l.label}</div>
                    <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 13, color: 'var(--site-ink-2)', fontWeight: 500, marginBottom: 6 }}>{l.handle}</div>
                    <p className="site-body">{l.desc}</p>
                  </div>
                  <span style={{ fontSize: 18, color: 'var(--site-ink-5)', flexShrink: 0 }}>→</span>
                </div>
              </a>
            ))}
          </div>
        </div>
      </section>
    </>
  )
}
