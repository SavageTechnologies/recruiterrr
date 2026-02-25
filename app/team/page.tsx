import Link from 'next/link'
import PageNav from '@/components/PageNav'
import PageFooter from '@/components/PageFooter'

export default function TeamPage() {
  return (
    <div style={{ minHeight: '100vh', background: 'var(--black)', color: 'var(--white)' }}>
      <PageNav />

      <div style={{ maxWidth: 760, padding: '80px 40px' }}>
        <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 11, color: 'var(--orange)', letterSpacing: 3, textTransform: 'uppercase', marginBottom: 16 }}>Team</div>
        <h1 style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 72, letterSpacing: 2, lineHeight: 0.9, marginBottom: 48, color: 'var(--white)' }}>
          WHO BUILT<br /><span style={{ color: 'var(--orange)' }}>THIS.</span>
        </h1>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 2, marginBottom: 48 }}>
          <div style={{ background: 'var(--card)', border: '1px solid var(--orange)', padding: '36px 32px' }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 20 }}>
              <div>
                <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 36, letterSpacing: 2, color: 'var(--white)', marginBottom: 4 }}>Aaron Sims</div>
                <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 10, color: 'var(--orange)', letterSpacing: 2, textTransform: 'uppercase' }}>Founder</div>
              </div>
              <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 9, padding: '4px 10px', border: '1px solid var(--orange)', color: 'var(--orange)', letterSpacing: 1 }}>FOUNDER</div>
            </div>
            <div style={{ fontSize: 15, color: 'var(--muted)', lineHeight: 1.8 }}>
              Insurance industry operator. Built Recruiterrr to solve a recruiting problem he lived with for years — too many markets, not enough intel on who was actually worth calling. If it feels like it was built by someone who's been in the trenches, that's because it was.
            </div>
          </div>
        </div>

        <div style={{ padding: '32px', border: '1px solid var(--border)', background: 'var(--card)' }}>
          <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 10, color: 'var(--muted)', letterSpacing: 2, marginBottom: 16 }}>WANT TO JOIN?</div>
          <div style={{ fontSize: 14, color: 'var(--muted)', lineHeight: 1.7, marginBottom: 20 }}>
            We're a lean team building fast. If you're obsessed with insurance tech and have skills in product, engineering, or growth — we'd like to hear from you.
          </div>
          <Link href="/contact" style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 16, letterSpacing: 2, color: 'var(--orange)', textDecoration: 'none' }}>GET IN TOUCH →</Link>
        </div>
      </div>

      <PageFooter />
    </div>
  )
}
