import PageHeader from '@/components/ui/PageHeader'
import Card from '@/components/ui/Card'

const CONTACTS = [
  { label: 'General Questions', value: 'hello@recruiterrr.com' },
  { label: 'Support', value: 'support@recruiterrr.com' },
  { label: 'Feature Requests', value: 'ideas@recruiterrr.com' },
  { label: 'Enterprise / Teams', value: 'sales@recruiterrr.com' },
]

export default function ContactPage() {
  return (
    <div style={{ maxWidth: 760, padding: '80px 40px' }}>
      <PageHeader label="Contact" title="LET'S" accent="TALK." />

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 2, marginBottom: 48 }}>
        {CONTACTS.map(c => (
          <Card key={c.label}>
            <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 9, color: 'var(--muted)', letterSpacing: 2, textTransform: 'uppercase', marginBottom: 8 }}>{c.label}</div>
            <a href={`mailto:${c.value}`} style={{ fontSize: 14, color: 'var(--orange)', textDecoration: 'none' }}>{c.value}</a>
          </Card>
        ))}
      </div>

      <Card padding="32px">
        <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 10, color: 'var(--muted)', letterSpacing: 2, marginBottom: 16 }}>RESPONSE TIME</div>
        <div style={{ fontSize: 15, color: 'var(--muted)', lineHeight: 1.8 }}>
          We're a small team building fast. We read every email and typically respond within 24 hours on weekdays.
          If you're experiencing a bug or outage, email support and we'll get on it same day.
        </div>
      </Card>
    </div>
  )
}