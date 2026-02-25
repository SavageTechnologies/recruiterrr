import Link from 'next/link'
import PageNav from '@/components/PageNav'
import PageFooter from '@/components/PageFooter'

export default function ContactPage() {
  return (
    <div style={{ minHeight: '100vh', background: 'var(--black)', color: 'var(--white)' }}>
      <PageNav />

      <div style={{ maxWidth: 760, padding: '80px 40px' }}>
        <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 11, color: 'var(--orange)', letterSpacing: 3, textTransform: 'uppercase', marginBottom: 16 }}>Contact</div>
        <h1 style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 72, letterSpacing: 2, lineHeight: 0.9, marginBottom: 48, color: 'var(--white)' }}>
          LET'S<br /><span style={{ color: 'var(--orange)' }}>TALK.</span>
        </h1>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 2, marginBottom: 48 }}>
          {[
            { label: 'General Questions', value: 'hello@recruiterrr.com', type: 'email' },
            { label: 'Support', value: 'support@recruiterrr.com', type: 'email' },
            { label: 'Feature Requests', value: 'ideas@recruiterrr.com', type: 'email' },
            { label: 'Enterprise / Teams', value: 'sales@recruiterrr.com', type: 'email' },
          ].map(c => (
            <div key={c.label} style={{ background: 'var(--card)', border: '1px solid var(--border)', padding: '24px' }}>
              <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 9, color: 'var(--muted)', letterSpacing: 2, textTransform: 'uppercase', marginBottom: 8 }}>{c.label}</div>
              <a href={`mailto:${c.value}`} style={{ fontSize: 14, color: 'var(--orange)', textDecoration: 'none' }}>{c.value}</a>
            </div>
          ))}
        </div>

        <div style={{ padding: '32px', border: '1px solid var(--border)', background: 'var(--card)' }}>
          <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 10, color: 'var(--muted)', letterSpacing: 2, marginBottom: 16 }}>RESPONSE TIME</div>
          <div style={{ fontSize: 15, color: 'var(--muted)', lineHeight: 1.8 }}>
            We're a small team building fast. We read every email and typically respond within 24 hours on weekdays.
            If you're experiencing a bug or outage, email support and we'll get on it same day.
          </div>
        </div>
      </div>

      <PageFooter />
    </div>
  )
}
