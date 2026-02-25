import Link from 'next/link'
import PageNav from '@/components/PageNav'
import PageFooter from '@/components/PageFooter'

const POSTS = [
  {
    name: 'Drew Gurley',
    company: 'Senior Market Advisors',
    text: "What I really like about Recruiterrr is that it immediately became an accelerator in our onboarding process. Building a recurring book of business takes time and with Recruiterrr, we are giving our team a short cut to the right types of accounts they should be prospecting. Aaron solved a problem that was right under a lot of people's nose!",
  },
]

export default function WallPage() {
  return (
    <div style={{ minHeight: '100vh', background: 'var(--black)', color: 'var(--white)' }}>
      <PageNav />

      <div style={{ maxWidth: 760, padding: '80px 40px' }}>
        <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 11, color: 'var(--orange)', letterSpacing: 3, textTransform: 'uppercase', marginBottom: 16 }}>The Wall</div>
        <h1 style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 72, letterSpacing: 2, lineHeight: 0.9, marginBottom: 12, color: 'var(--white)' }}>
          WHAT PEOPLE<br /><span style={{ color: 'var(--orange)' }}>ARE SAYING.</span>
        </h1>
        <p style={{ fontSize: 14, color: '#333', fontFamily: "'DM Mono', monospace", letterSpacing: 1, marginBottom: 48 }}>real feedback. no edits.</p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          {POSTS.map((p, i) => (
            <div key={i} style={{ background: 'var(--card)', border: '1px solid var(--border)', padding: '36px 40px' }}>
              <div style={{ fontSize: 16, color: 'var(--white)', lineHeight: 1.8, fontStyle: 'italic', marginBottom: 28 }}>
                "{p.text}"
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{ width: 2, height: 32, background: 'var(--orange)' }} />
                <div>
                  <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 12, color: 'var(--white)', letterSpacing: 1 }}>{p.name}</div>
                  <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 10, color: 'var(--muted)', letterSpacing: 1, marginTop: 2 }}>{p.company}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <PageFooter />
    </div>
  )
}
