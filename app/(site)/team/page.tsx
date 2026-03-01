import Link from 'next/link'
import PageHeader from '@/components/ui/PageHeader'
import Card from '@/components/ui/Card'

const JAKE_STATS = [
  { label: 'XBOX', note: 'primary workstation' },
  { label: 'SNACKS', note: 'continuous delivery' },
  { label: 'MORALE', note: 'always high' },
  { label: 'JOKES', note: '7/10 land' },
]

export default function TeamPage() {
  return (
    <div style={{ maxWidth: 760, padding: '80px 40px' }}>
      <PageHeader label="Team" title="WHO BUILT" accent="THIS." />

      <div style={{ display: 'flex', flexDirection: 'column', gap: 2, marginBottom: 48 }}>

        {/* ── Aaron ── */}
        <Card padding="36px 32px" style={{ border: '1px solid var(--orange)' }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 20 }}>
            <div>
              <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 36, letterSpacing: 2, color: 'var(--white)', marginBottom: 4 }}>Aaron Sims</div>
              <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 10, color: 'var(--orange)', letterSpacing: 2, textTransform: 'uppercase' }}>Founder & Builder — Topeka, KS</div>
            </div>
            <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 9, padding: '4px 10px', border: '1px solid var(--orange)', color: 'var(--orange)', letterSpacing: 1 }}>FOUNDER</div>
          </div>
          <div style={{ fontSize: 15, color: 'var(--muted)', lineHeight: 1.8 }}>
            Insurance distribution lifer turned builder. Aaron spent years inside the FMO world watching recruiters work blind — cold calling agents they knew nothing about, buying leads from vendors they'd never vetted. He built Recruiterrr to fix it. Every feature exists because he needed it himself. The platform is opinionated because he is. Somewhere along the way he was inspired by a businessman out of Jasper, Missouri — a man named Brad Wesley — who always knew exactly who the players were in any market. Aaron decided that was the right way to operate.
          </div>
        </Card>

        {/* ── Jake ── */}
        <Card padding="36px 32px" style={{ position: 'relative', overflow: 'hidden' }}>
          <div style={{
            position: 'absolute', top: 0, right: 0, width: 160, height: 160,
            background: 'radial-gradient(circle at top right, rgba(255,179,0,0.04), transparent 70%)',
            pointerEvents: 'none',
          }} />
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 20 }}>
            <div>
              <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 36, letterSpacing: 2, color: 'var(--white)', marginBottom: 4 }}>Jake Sims</div>
              <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 10, color: 'var(--orange)', letterSpacing: 2, textTransform: 'uppercase' }}>Co-Pilot & Morale Officer — Age 7</div>
            </div>
            <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 9, padding: '4px 10px', border: '1px solid var(--border)', color: 'var(--muted)', letterSpacing: 1 }}>ESSENTIAL PERSONNEL</div>
          </div>
          <div style={{ fontSize: 15, color: 'var(--muted)', lineHeight: 1.8, marginBottom: 20 }}>
            Every serious operation needs a co-pilot. Jake joined the Recruiterrr team on day one — positioned roughly two feet to the left of the main workstation, Xbox controller in hand. His contributions are difficult to overstate. He maintains team morale through a proprietary system of jokes, snack distribution, and live musical performance. His original setlist includes <em style={{ color: 'var(--white)' }}>"Forever Friends"</em> — performed on demand, usually mid-sprint. He has never missed a single build session and holds the all-time record for snack consumption per lines of code shipped.
          </div>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {JAKE_STATS.map(({ label, note }) => (
              <div key={label} style={{
                fontFamily: "'DM Mono', monospace", fontSize: 8, letterSpacing: 2,
                color: 'var(--muted)', border: '1px solid var(--border)', padding: '4px 10px',
                display: 'flex', flexDirection: 'column', gap: 1,
              }}>
                <span style={{ color: 'var(--white)' }}>{label}</span>
                <span style={{ opacity: 0.5, fontSize: 7 }}>{note}</span>
              </div>
            ))}
          </div>
        </Card>

      </div>

      <Card padding="32px">
        <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 10, color: 'var(--muted)', letterSpacing: 2, marginBottom: 16 }}>WANT TO JOIN?</div>
        <div style={{ fontSize: 14, color: 'var(--muted)', lineHeight: 1.7, marginBottom: 20 }}>
          We're a lean team building fast. If you're obsessed with producer intelligence, distribution tech, or growth — we'd like to hear from you.
        </div>
        <Link href="/contact" style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 16, letterSpacing: 2, color: 'var(--orange)', textDecoration: 'none' }}>GET IN TOUCH →</Link>
      </Card>
    </div>
  )
}
