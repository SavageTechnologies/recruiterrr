import Link from 'next/link'

const PROBLEMS = [
  { title: 'They Know Their Pitch', body: 'Every producer you call has been told exactly why their FMO is the best. You walk in blind. They have a rehearsed answer for every objection.' },
  { title: 'Trip Loyalty Is Real', body: "Producers don't leave an FMO mid-qualification year. If you don't know their trip status, you don't know your timing." },
  { title: 'Carrier Gaps Are Your Opening', body: "Most FMOs are strong in some markets and weak in others. You can't exploit what you don't know about." },
  { title: 'Their Weaknesses Are Your Script', body: "Producers don't advertise why they're unhappy. But their FMO's complaints are public. Prometheus finds them before you dial." },
]

const INTEL = [
  { n: '01', title: 'Carrier Stack',      body: 'Every carrier they offer. Which markets they dominate. What they push. What they miss.' },
  { n: '02', title: 'Incentive Trips',    body: '2025 & 2026 destinations, qualification thresholds, and exactly how to use their trip in the conversation.' },
  { n: '03', title: 'Lead Programs',      body: 'Do they provide leads? Vendor partnerships? Lead credits? We surface what they advertise to producers.' },
  { n: '04', title: 'Their Recruiting Pitch', body: "Their headline claim. Their selling points. Their differentiators. What they say to every producer you're trying to pull." },
  { n: '05', title: 'Weak Points',        body: "Producer complaints from the open web. Contract red flags. Gaps in their offer. The cracks in their armor." },
  { n: '06', title: 'Your Counter-Pitch', body: 'A fully custom script. Opening line, key angles, trip angle, carrier angle, and a close — all built from their specific vulnerabilities.' },
]

const STEPS = [
  { n: '01', title: 'Enter The FMO Name', body: 'Type any FMO or IMO name. Prometheus auto-discovers their website — no URL needed.' },
  { n: '02', title: 'We Go Deep', body: 'Up to 9 pages crawled simultaneously — about, agents, carriers, trips, leads, tech, and more. Plus 5 targeted SERP searches for off-site intel.' },
  { n: '03', title: 'Get Your Briefing', body: '6 sections of structured intelligence. Read it before the call. Pull up the counter-pitch. Walk in knowing more than they expect.' },
]

const FOR_WHOM = [
  { label: 'FMO & IMO Recruiters', body: "You're competing against every other upline for the same producers. Walk into every call knowing exactly what you're up against." },
  { label: 'Team Leaders Building Downlines', body: "When a producer says 'I'm happy where I am' — now you know why, and you know the exact angle to open the conversation." },
  { label: 'Agency Owners Recruiting Captives', body: "Captive producers are sold on stability. Prometheus tells you what they're getting and what they're missing." },
  { label: 'Anyone Losing Producers to Competitors', body: "When a producer leaves for another FMO, run Prometheus on them. Know what the other side offered. Build the counter for next time." },
]

export default function PrometheusLandingPage() {
  return (
    <>
      {/* HERO */}
      <section className="site-section site-section-paper">
        <div className="site-inner">
          <div className="site-eyebrow-orange">A Recruiterrr Intelligence Tool</div>
          <h1 className="site-h1">KNOW THEIR<br /><span>EVERY MOVE.</span></h1>
          <p className="site-lead" style={{ maxWidth: 560, marginBottom: 48 }}>
            PROMETHEUS scans any FMO or IMO and returns a complete competitive intelligence briefing — carriers, incentive trips, lead programs, their recruiting pitch, and a custom counter-script built from their vulnerabilities.
          </p>
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
            <Link href="/dashboard/prometheus" className="site-btn-primary">Run Intel Now</Link>
            <Link href="/sign-up" className="site-btn-ghost">Request Access</Link>
          </div>
        </div>
      </section>

      {/* STATS */}
      <div className="site-stats-band">
        <div className="site-inner">
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)' }}>
            {[['9', '', 'Pages Crawled Per Scan'], ['5', '', 'SERP Intel Queries'], ['< 60', 's', 'Full FMO Briefing'], ['6', '', 'Intel Sections Returned']].map(([num, acc, label]) => (
              <div key={label} className="site-stat-item">
                <div className="site-stat-num">{num}<span>{acc}</span></div>
                <div className="site-stat-label">{label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* THE PROBLEM */}
      <section className="site-section site-section-white site-section-divider">
        <div className="site-inner">
          <div className="site-eyebrow">The Problem</div>
          <h2 className="site-h2">YOU&apos;RE RECRUITING BLIND.<br /><span>THEY&apos;RE NOT.</span></h2>
          <div className="site-grid-bordered" style={{ gridTemplateColumns: 'repeat(2, 1fr)' }}>
            {PROBLEMS.map(p => (
              <div key={p.title} className="site-tool-card">
                <h3 className="site-h3" style={{ fontSize: 16, marginBottom: 10, fontFamily: "'DM Sans', sans-serif", fontWeight: 600, letterSpacing: 0 }}>{p.title}</h3>
                <p className="site-body">{p.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* WHAT YOU GET */}
      <section className="site-section site-section-paper site-section-divider">
        <div className="site-inner">
          <div className="site-eyebrow">What You Get</div>
          <h2 className="site-h2">6 INTEL SECTIONS. <span>ONE BRIEFING.</span></h2>
          <div className="site-grid-bordered" style={{ gridTemplateColumns: 'repeat(3, 1fr)' }}>
            {INTEL.map(s => (
              <div key={s.n} className="site-tool-card">
                <div className="site-label" style={{ marginBottom: 12 }}>{s.n}</div>
                <h3 className="site-h3" style={{ fontSize: 17, marginBottom: 8 }}>{s.title}</h3>
                <p className="site-body">{s.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section className="site-section site-section-white site-section-divider">
        <div className="site-inner">
          <div className="site-eyebrow">How It Works</div>
          <h2 className="site-h2">THREE STEPS TO <span>PREPARED.</span></h2>
          <div className="site-grid-bordered" style={{ gridTemplateColumns: 'repeat(3, 1fr)' }}>
            {STEPS.map((step, i) => (
              <div key={step.n} className="site-step-card">
                <div className="site-step-num">{step.n}</div>
                <div className="site-step-title">{step.title}</div>
                <p className="site-body">{step.body}</p>
                {i < STEPS.length - 1 && <div className="site-step-connector">→</div>}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* WHY PROMETHEUS */}
      <section className="site-section site-section-paper-2 site-section-divider">
        <div className="site-inner">
          <div className="site-card" style={{ padding: '48px 40px' }}>
            <div className="site-eyebrow" style={{ marginBottom: 16 }}>Why Prometheus</div>
            <h2 className="site-h2" style={{ marginBottom: 20 }}>HE STOLE FIRE FROM THE GODS.<br /><span>WE GAVE IT TO YOU.</span></h2>
            <p className="site-lead" style={{ maxWidth: 580 }}>
              Prometheus means <em style={{ color: 'var(--site-ink)' }}>&ldquo;forethought&rdquo;</em> — acting with intelligence before the consequences arrive. The competitive research that only the largest recruiting organizations could afford now lives in a tool any recruiter can run in under 60 seconds. That is the fire. That is your edge.
            </p>
          </div>
        </div>
      </section>

      {/* WHO IT'S FOR */}
      <section className="site-section site-section-white site-section-divider">
        <div className="site-inner">
          <div className="site-eyebrow">Who It&apos;s For</div>
          <h2 className="site-h2">BUILT FOR <span>OPERATORS.</span></h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 16 }}>
            {FOR_WHOM.map(item => (
              <div key={item.label} className="site-card" style={{ padding: '28px 24px' }}>
                <div className="site-label" style={{ marginBottom: 10 }}>{item.label}</div>
                <p className="site-body">{item.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="site-section site-section-paper site-section-divider">
        <div className="site-inner" style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: 80, alignItems: 'center' }}>
          <div>
            <div className="site-eyebrow">Get Started</div>
            <h2 className="site-h2" style={{ marginBottom: 20 }}>READY TO <span>KNOW?</span></h2>
            <p className="site-lead">Inside your dashboard. No setup. No URL needed. Full FMO intelligence in under 60 seconds.</p>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12, flexShrink: 0 }}>
            <Link href="/dashboard/prometheus" className="site-btn-primary" style={{ fontSize: 18, padding: '16px 40px', boxShadow: '0 4px 24px rgba(232,77,28,0.28)' }}>Run Your First Scan</Link>
            <Link href="/sign-up" className="site-btn-ghost" style={{ textAlign: 'center' }}>Request Access</Link>
          </div>
        </div>
      </section>
    </>
  )
}
