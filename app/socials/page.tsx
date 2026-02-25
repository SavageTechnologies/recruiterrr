'use client'

import Link from 'next/link'
import PageNav from '@/components/PageNav'
import PageFooter from '@/components/PageFooter'

const LINKS = [
  { label: 'Twitter / X', handle: '@recruiterrr', url: 'https://twitter.com/recruiterrr', desc: 'Product updates, tips, and recruiter wins.' },
  { label: 'LinkedIn', handle: 'Recruiterrr', url: 'https://linkedin.com/company/recruiterrr', desc: 'Industry news and platform announcements.' },
  { label: 'YouTube', handle: 'Recruiterrr', url: 'https://youtube.com/@recruiterrr', desc: 'Walkthroughs, tutorials, and how-to videos.' },
]

export default function SocialsPage() {
  return (
    <div style={{ minHeight: '100vh', background: 'var(--black)', color: 'var(--white)' }}>
      <PageNav />

      <div style={{ maxWidth: 760, padding: '80px 40px' }}>
        <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 11, color: 'var(--orange)', letterSpacing: 3, textTransform: 'uppercase', marginBottom: 16 }}>Socials</div>
        <h1 style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 72, letterSpacing: 2, lineHeight: 0.9, marginBottom: 48, color: 'var(--white)' }}>
          FIND US<br /><span style={{ color: 'var(--orange)' }}>ONLINE.</span>
        </h1>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 2, marginBottom: 48 }}>
          {LINKS.map(l => (
            <a key={l.label} href={l.url} target="_blank" rel="noopener noreferrer"
              style={{ background: 'var(--card)', border: '1px solid var(--border)', padding: '28px 32px', textDecoration: 'none', display: 'block', transition: 'border-color 0.15s' }}
              onMouseEnter={e => (e.currentTarget.style.borderColor = 'var(--border-light)')}
              onMouseLeave={e => (e.currentTarget.style.borderColor = 'var(--border)')}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 10, color: 'var(--muted)', letterSpacing: 2, textTransform: 'uppercase', marginBottom: 6 }}>{l.label}</div>
                  <div style={{ fontSize: 18, fontWeight: 600, color: 'var(--orange)', marginBottom: 8 }}>{l.handle}</div>
                  <div style={{ fontSize: 13, color: '#444' }}>{l.desc}</div>
                </div>
                <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 20, color: '#333' }}>↗</div>
              </div>
            </a>
          ))}
        </div>

        <div style={{ padding: '28px 32px', border: '1px solid var(--border)', background: 'var(--card)' }}>
          <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 10, color: 'var(--muted)', letterSpacing: 2, marginBottom: 10 }}>STAY IN THE LOOP</div>
          <div style={{ fontSize: 14, color: 'var(--muted)', lineHeight: 1.7 }}>
            Follow us for product updates, recruiting tips, and real stories from agents and recruiters using Recruiterrr in the field.
          </div>
        </div>
      </div>

      <PageFooter />
    </div>
  )
}
