import Link from 'next/link'
import PageNav from '@/components/PageNav'
import PageFooter from '@/components/PageFooter'

export default function PrometheusLandingPage() {
  return (
    <div style={{ minHeight: '100vh', background: 'var(--black)' }}>
      <PageNav />

      {/* HERO */}
      <section style={{ padding: '100px 40px 60px', maxWidth: 960 }}>
        <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 11, color: 'var(--orange)', letterSpacing: 3, textTransform: 'uppercase', marginBottom: 20, display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ width: 24, height: 1, background: 'var(--orange)', display: 'inline-block' }} />
          A Recruiterrr Intelligence Tool
        </div>
        <h1 style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 'clamp(64px, 10vw, 120px)', lineHeight: 0.9, letterSpacing: 2, color: 'var(--white)', marginBottom: 24 }}>
          KNOW THEIR<br />
          <span style={{ color: 'var(--orange)' }}>EVERY MOVE.</span>
        </h1>
        <p style={{ fontSize: 18, color: 'var(--muted)', fontWeight: 300, maxWidth: 560, lineHeight: 1.6, marginBottom: 48 }}>
          PROMETHEUS scans any FMO or IMO and returns a complete competitive intelligence briefing — carriers, incentive trips, lead programs, their recruiting pitch, and a custom counter-script built from their vulnerabilities.
        </p>
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
          <Link href="/dashboard/prometheus" style={{ padding: '18px 48px', background: 'var(--orange)', border: 'none', color: 'var(--black)', fontFamily: "'Bebas Neue', sans-serif", fontSize: 22, letterSpacing: 3, cursor: 'pointer', textDecoration: 'none' }}>
            RUN INTEL NOW
          </Link>
          <Link href="/sign-up" style={{ padding: '18px 32px', background: 'transparent', border: '1px solid var(--border-light)', color: 'var(--muted)', fontFamily: "'DM Mono', monospace", fontSize: 12, letterSpacing: 2, cursor: 'pointer', textDecoration: 'none', display: 'flex', alignItems: 'center' }}>
            CREATE ACCOUNT
          </Link>
        </div>
      </section>

      {/* STATS */}
      <div style={{ display: 'flex', gap: 40, padding: '48px 40px', borderTop: '1px solid var(--border)', borderBottom: '1px solid var(--border)', flexWrap: 'wrap' }}>
        {[
          { main: '9', accent: '', label: 'Pages Crawled Per Scan' },
          { main: '5', accent: '', label: 'SERP Intel Queries' },
          { main: '< 60', accent: 's', label: 'Full FMO Briefing' },
          { main: '6', accent: '', label: 'Intel Sections Returned' },
        ].map(s => (
          <div key={s.label}>
            <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 42, color: 'var(--white)', letterSpacing: 1 }}>
              {s.main}<span style={{ color: 'var(--orange)' }}>{s.accent}</span>
            </div>
            <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 10, color: 'var(--muted)', letterSpacing: 2, textTransform: 'uppercase' }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* THE PROBLEM */}
      <section style={{ padding: '80px 40px', maxWidth: 900 }}>
        <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 11, color: 'var(--muted)', letterSpacing: 3, textTransform: 'uppercase', marginBottom: 12 }}>The Problem</div>
        <h2 style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 48, letterSpacing: 2, color: 'var(--white)', marginBottom: 40 }}>
          YOU'RE RECRUITING BLIND.<br /><span style={{ color: 'var(--orange)' }}>THEY'RE NOT.</span>
        </h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 2 }}>
          {[
            { icon: '⚠', title: 'They Know Their Pitch', body: 'Every agent you call has been told exactly why their FMO is the best. You walk in blind. They have a rehearsed answer for every objection.' },
            { icon: '⚠', title: 'Trip Loyalty Is Real', body: "Agents don't leave an FMO mid-qualification year. If you don't know their trip status, you don't know your timing." },
            { icon: '⚠', title: 'Carrier Gaps Are Your Opening', body: "Most FMOs are strong in some markets and weak in others. You can't exploit what you don't know about." },
            { icon: '⚠', title: 'Their Weaknesses Are Your Script', body: "Agents don't advertise why they're unhappy. But their FMO's complaints are public. Prometheus finds them before you dial." },
          ].map(s => (
            <div key={s.title} style={{ background: 'var(--card)', border: '1px solid var(--border)', padding: '28px 24px' }}>
              <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 18, color: 'var(--orange)', marginBottom: 14 }}>{s.icon}</div>
              <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 15, fontWeight: 600, marginBottom: 8, color: 'var(--white)' }}>{s.title}</div>
              <div style={{ fontSize: 13, color: 'var(--muted)', lineHeight: 1.6 }}>{s.body}</div>
            </div>
          ))}
        </div>
      </section>

      {/* WHAT YOU GET */}
      <section style={{ padding: '0 40px 80px', maxWidth: 900 }}>
        <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 11, color: 'var(--muted)', letterSpacing: 3, textTransform: 'uppercase', marginBottom: 12 }}>What You Get</div>
        <h2 style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 48, letterSpacing: 2, color: 'var(--white)', marginBottom: 40 }}>
          6 INTEL SECTIONS. <span style={{ color: 'var(--orange)' }}>ONE BRIEFING.</span>
        </h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 2 }}>
          {[
            { n: '01', title: 'Carrier Stack', body: 'Every carrier they offer. Which markets they dominate. What they push. What they miss.' },
            { n: '02', title: 'Incentive Trips', body: '2025 & 2026 destinations, qualification thresholds, and exactly how to use their trip in the conversation.' },
            { n: '03', title: 'Lead Programs', body: 'Do they provide leads? Vendor partnerships? Lead credits? We surface what they advertise to agents.' },
            { n: '04', title: 'Their Recruiting Pitch', body: "Their headline claim. Their selling points. Their differentiators. What they say to every agent you're trying to pull." },
            { n: '05', title: 'Weak Points', body: "Agent complaints from the open web. Contract red flags. Gaps in their offer. The cracks in their armor." },
            { n: '06', title: 'Your Counter-Pitch', body: 'A fully custom script. Opening line, key angles, trip angle, carrier angle, and a close — all built from their specific vulnerabilities.' },
          ].map(s => (
            <div key={s.n} style={{ background: 'var(--card)', border: '1px solid var(--border)', padding: '28px 24px' }}>
              <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 11, color: 'var(--orange)', letterSpacing: 2, marginBottom: 14 }}>{s.n}</div>
              <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 15, fontWeight: 600, marginBottom: 8, color: 'var(--white)' }}>{s.title}</div>
              <div style={{ fontSize: 13, color: 'var(--muted)', lineHeight: 1.6 }}>{s.body}</div>
            </div>
          ))}
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section style={{ padding: '0 40px 80px', maxWidth: 900 }}>
        <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 11, color: 'var(--muted)', letterSpacing: 3, textTransform: 'uppercase', marginBottom: 40 }}>How It Works</div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 2 }}>
          {[
            { n: '01', title: 'Enter The FMO Name', body: 'Type any FMO or IMO name. Prometheus auto-discovers their website — no URL needed.' },
            { n: '02', title: 'We Go Deep', body: 'Up to 9 pages crawled simultaneously — about, agents, carriers, trips, leads, tech, and more. Plus 5 targeted SERP searches for intel that lives off their site.' },
            { n: '03', title: 'Get Your Briefing', body: '6 sections of structured intelligence. Read it before the call. Pull up the counter-pitch tab. Walk in knowing more than they expect.' },
          ].map(step => (
            <div key={step.n} style={{ background: 'var(--card)', border: '1px solid var(--border)', padding: '32px 28px' }}>
              <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 56, color: 'var(--border-light)', marginBottom: 16 }}>{step.n}</div>
              <div style={{ fontSize: 16, fontWeight: 600, marginBottom: 12, color: 'var(--white)' }}>{step.title}</div>
              <div style={{ fontSize: 14, color: 'var(--muted)', lineHeight: 1.6 }}>{step.body}</div>
            </div>
          ))}
        </div>
      </section>

      {/* MYTHOLOGY CALLOUT */}
      <section style={{ padding: '0 40px 80px', maxWidth: 900 }}>
        <div style={{ background: 'var(--card)', border: '1px solid var(--border)', padding: '48px 40px' }}>
          <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 11, color: 'var(--muted)', letterSpacing: 3, textTransform: 'uppercase', marginBottom: 16 }}>Why Prometheus</div>
          <h2 style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 40, letterSpacing: 2, color: 'var(--white)', marginBottom: 20, maxWidth: 700 }}>
            HE STOLE FIRE FROM THE GODS.<br /><span style={{ color: 'var(--orange)' }}>WE GAVE IT TO YOU.</span>
          </h2>
          <p style={{ fontSize: 15, color: 'var(--muted)', maxWidth: 580, lineHeight: 1.8 }}>
            Prometheus means <em style={{ color: 'var(--white)' }}>"forethought"</em> — acting with intelligence before the consequences arrive. The competitive research that only the largest recruiting organizations could afford now lives in a tool every independent recruiter can run in under 60 seconds. That is the fire. That is your edge.
          </p>
        </div>
      </section>

      {/* WHO IT'S FOR */}
      <section style={{ padding: '0 40px 80px', maxWidth: 900 }}>
        <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 11, color: 'var(--muted)', letterSpacing: 3, textTransform: 'uppercase', marginBottom: 40 }}>Who It's For</div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 2 }}>
          {[
            { label: 'FMO & IMO Recruiters', body: "You're competing against every other upline for the same agents. Walk into every call knowing exactly what you're up against." },
            { label: 'Team Leaders Building Downlines', body: "When an agent says 'I'm happy where I am' — now you know why, and you know the exact angle to open the conversation." },
            { label: 'Agency Owners Recruiting Captives', body: "Captive agents are sold on stability. Prometheus tells you what they're getting and what they're missing." },
            { label: 'Anyone Losing Agents to Competitors', body: "When an agent leaves for another FMO, run Prometheus on them. Know what the other side offered. Build the counter for next time." },
          ].map(item => (
            <div key={item.label} style={{ background: 'var(--card)', border: '1px solid var(--border)', padding: '28px 24px' }}>
              <div style={{ fontSize: 15, fontWeight: 600, marginBottom: 10, color: 'var(--white)' }}>{item.label}</div>
              <div style={{ fontSize: 13, color: 'var(--muted)', lineHeight: 1.6 }}>{item.body}</div>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section style={{ padding: '0 40px 100px' }}>
        <div style={{ borderTop: '1px solid var(--border)', paddingTop: 80 }}>
          <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 'clamp(48px, 6vw, 80px)', letterSpacing: 2, color: 'var(--white)', marginBottom: 16 }}>
            READY TO <span style={{ color: 'var(--orange)' }}>KNOW?</span>
          </div>
          <p style={{ fontSize: 16, color: 'var(--muted)', marginBottom: 40, maxWidth: 480 }}>
            Inside your Recruiterrr dashboard. No setup. No URL needed. Full FMO intelligence in under 60 seconds.
          </p>
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
            <Link href="/dashboard/prometheus" style={{ padding: '18px 48px', background: 'var(--orange)', border: 'none', color: 'var(--black)', fontFamily: "'Bebas Neue', sans-serif", fontSize: 22, letterSpacing: 3, cursor: 'pointer', textDecoration: 'none' }}>
              RUN YOUR FIRST SCAN
            </Link>
            <Link href="/sign-up" style={{ padding: '18px 32px', background: 'transparent', border: '1px solid var(--border-light)', color: 'var(--muted)', fontFamily: "'DM Mono', monospace", fontSize: 12, letterSpacing: 2, cursor: 'pointer', textDecoration: 'none', display: 'flex', alignItems: 'center' }}>
              CREATE FREE ACCOUNT
            </Link>
          </div>
        </div>
      </section>

      <PageFooter />
    </div>
  )
}
