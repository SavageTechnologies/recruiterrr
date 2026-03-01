'use client'

import PageHeader from '@/components/ui/PageHeader'
import Card from '@/components/ui/Card'

const LINKS = [
  { label: 'Twitter / X', handle: '@recruiterrr', url: 'https://twitter.com/recruiterrr', desc: 'Product updates, tips, and field wins.' },
  { label: 'LinkedIn', handle: 'Recruiterrr', url: 'https://linkedin.com/company/recruiterrr', desc: 'Industry news and platform announcements.' },
  { label: 'YouTube', handle: 'Recruiterrr', url: 'https://youtube.com/@recruiterrr', desc: 'Walkthroughs, tutorials, and how-to videos.' },
]

export default function SocialsPage() {
  return (
    <div style={{ maxWidth: 760, padding: '80px 40px' }}>
      <PageHeader label="Socials" title="FIND US" accent="ONLINE." />

      <div style={{ display: 'flex', flexDirection: 'column', gap: 2, marginBottom: 48 }}>
        {LINKS.map(l => (
          <a key={l.label} href={l.url} target="_blank" rel="noopener noreferrer"
            style={{ textDecoration: 'none', display: 'block' }}
            onMouseEnter={e => ((e.currentTarget.querySelector('.card-inner') as HTMLElement).style.borderColor = 'var(--border-light)')}
            onMouseLeave={e => ((e.currentTarget.querySelector('.card-inner') as HTMLElement).style.borderColor = 'var(--border)')}>
            <div className="card-inner" style={{ background: 'var(--card)', border: '1px solid var(--border)', padding: '28px 32px', transition: 'border-color 0.15s' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 10, color: 'var(--muted)', letterSpacing: 2, textTransform: 'uppercase', marginBottom: 6 }}>{l.label}</div>
                  <div style={{ fontSize: 18, fontWeight: 600, color: 'var(--orange)', marginBottom: 8 }}>{l.handle}</div>
                  <div style={{ fontSize: 13, color: 'var(--muted)' }}>{l.desc}</div>
                </div>
                <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 20, color: '#444' }}>↗</div>
              </div>
            </div>
          </a>
        ))}
      </div>

      <Card padding="28px 32px">
        <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 10, color: 'var(--muted)', letterSpacing: 2, marginBottom: 10 }}>STAY IN THE LOOP</div>
        <div style={{ fontSize: 14, color: 'var(--muted)', lineHeight: 1.7 }}>
          Follow us for product updates, recruiting tips, and real stories from producers and recruiters using Recruiterrr in the field.
        </div>
      </Card>
    </div>
  )
}
