import PageHeader from '@/components/ui/PageHeader'
import Card from '@/components/ui/Card'

const POSTS = [
  {
    name: 'Drew Gurley',
    company: 'Senior Market Advisors',
    text: "What I really like about Recruiterrr is that it immediately became an accelerator in our onboarding process. Building a recurring book of business takes time and with Recruiterrr, we are giving our team a short cut to the right types of accounts they should be prospecting. Aaron solved a problem that was right under a lot of people's nose!",
  },
]

export default function WallPage() {
  return (
    <div style={{ maxWidth: 760, padding: '80px 40px' }}>
      <PageHeader label="The Wall" title="WHAT PEOPLE" accent="ARE SAYING." />
      <p style={{ fontFamily: "'DM Mono', monospace", fontSize: 10, color: '#444', letterSpacing: 1, marginBottom: 48 }}>real feedback. no edits.</p>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        {POSTS.map((p, i) => (
          <Card key={i} padding="36px 40px">
            <div style={{ fontSize: 16, color: 'var(--white)', lineHeight: 1.8, fontStyle: 'italic', marginBottom: 28 }}>
              "{p.text}"
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{ width: 2, height: 32, background: 'var(--orange)', flexShrink: 0 }} />
              <div>
                <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 12, color: 'var(--white)', letterSpacing: 1 }}>{p.name}</div>
                <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 10, color: 'var(--muted)', letterSpacing: 1, marginTop: 2 }}>{p.company}</div>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  )
}
