import Link from 'next/link'

const STAGES = [
  { roman: 'I',   range: '1–34%',   label: 'Trace Markers',    body: 'Weak signal. A single carrier overlap or vague language pattern. Not conclusive — but enough to start asking questions.' },
  { roman: 'II',  range: '35–54%',  label: 'Partial Match',    body: 'Multiple signals point to a tree. Possible affiliation. Worth a targeted approach and one qualifying question on the call.' },
  { roman: 'III', range: '55–79%',  label: 'Strong Markers',   body: "Carrier fingerprint plus confirmed language signals. High probability affiliation. You know who you're dealing with." },
  { roman: 'IV',  range: '80–100%', label: 'Full Confirmation', body: 'Definitive. Direct affiliation language, partner listing, or Facebook confirmation. Act accordingly.' },
]

const SIGNALS = [
  { n: '01', title: 'Carrier Fingerprint', body: "Every tree has its carriers. The carrier mix a producer writes is one of the strongest affiliation signals available — most producers don't realize their appointments are a fingerprint." },
  { n: '02', title: 'Language Markers',    body: "Website copy, About pages, and social bios contain embedded signals — branded program names, platform references, event language. These aren't accidents. They're brand contamination." },
  { n: '03', title: 'Web Intelligence',    body: 'A live search cross-references the producer against the full distribution network index — partner directories, press releases, association pages, and co-mentions that no producer voluntarily surfaces.' },
  { n: '04', title: 'Facebook Profile Scan', body: "The most unguarded signal. Trip photos with FMO branding. Affiliation language in the bio. Retreat announcements. Producers post what they won't say on the phone. ANATHEMA reads it." },
]

const TREES = [
  {
    name: 'INTEGRITY',
    sub: 'National independent distributor of life and health insurance. 181+ partner FMOs and IMOs across all 50 states.',
    carriers: 'Humana · Aetna · Cigna · WellCare · Devoted',
    geo: 'Texas · Oklahoma · Southeast',
    tell: '"FFL", "Family First Life", "IntegrityCONNECT", "MedicareCENTER"',
    count: '181+ mapped affiliates',
  },
  {
    name: 'AMERILIFE',
    sub: 'Large insurance distribution organization focused on health, life, wealth, and worksite markets.',
    carriers: 'Humana · Aetna · UHC · Cigna · WellCare',
    geo: 'Florida (HQ: Clearwater) · Southeast · Midwest',
    tell: '"AmeriLife affiliate", "USABG", co-branded subdomains',
    count: '78 mapped affiliates',
  },
  {
    name: 'SMS',
    sub: 'Omaha-based national FMO. One of the top distribution networks in the senior market with strong life and annuity reach.',
    carriers: 'Mutual of Omaha · Medico · GPM Life · North American',
    geo: 'Nebraska (HQ: Omaha) · Iowa · Minnesota · NJ · SC',
    tell: '"Senior Market Sales", "Rethinking Retirement", "SMS partner"',
    count: '27 mapped affiliates',
  },
]

const PROBLEMS = [
  { title: 'The Major Trees Control Most of the Market', body: 'A small number of large consolidators — Integrity Marketing Group, AmeriLife, Senior Market Sales, and others — collectively control the majority of the independent distribution market. Most producers who call themselves independent are affiliated with one of them.' },
  { title: 'The Hierarchy Is Invisible', body: 'No public registry. No disclosure requirement. The distribution tree can be 3–5 layers deep — IMO to sub-FMO to affiliate to producer — and none of it is documented anywhere.' },
  { title: "You're Wasting Calls", body: "If you're recruiting for one tree and you spend 45 minutes pitching a producer already in it, you just wasted your time. ANATHEMA tells you before you dial." },
  { title: 'Competitive Intel Is Currency', body: "Knowing which tree a producer rolls up through tells you their contracts, their carriers, their incentives, and exactly what you need to offer to get them to move." },
]

export default function AnathemaLandingPage() {
  return (
    <>
      {/* HERO */}
      <section className="site-section site-section-paper">
        <div className="site-inner">
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
            <div style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--site-green)', animation: 'siteLivePulse 2s ease infinite' }} />
            <div className="site-label" style={{ color: 'var(--site-green)' }}>A Recruiterrr Intelligence System</div>
          </div>
          <h1 className="site-h1" style={{ marginBottom: 28 }}>EVERY AGENT<br />HAS BEEN<br /><span style={{ color: 'var(--site-green)' }}>INFECTED.</span></h1>
          <p className="site-lead" style={{ maxWidth: 560, marginBottom: 48 }}>
            In the US insurance market, no producer operates independently. Every one of them rolls up through a distribution hierarchy — a tree they didn&apos;t choose and won&apos;t tell you about. The pathogen leaves traces. ANATHEMA reads them.
          </p>
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
            <Link href="/dashboard/search" className="site-btn-primary" style={{ background: 'var(--site-green)', boxShadow: '0 2px 12px rgba(26,122,74,0.28)' }}>Run a Scan</Link>
            <Link href="/sign-up" className="site-btn-ghost">Request Access</Link>
          </div>
        </div>
      </section>

      {/* STATS */}
      <div className="site-stats-band">
        <div className="site-inner">
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)' }}>
            {[['∞', '', 'Distribution Trees'], ['4', '', 'Signal Tiers'], ['IV', '', 'Infection Stages'], ['∞', '', 'Specimen Learning']].map(([num, acc, label]) => (
              <div key={label} className="site-stat-item">
                <div className="site-stat-num" style={{ color: 'var(--site-green)' }}>{num}<span>{acc}</span></div>
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
          <h2 className="site-h2">YOU&apos;RE RECRUITING BLIND.<br /><span style={{ color: 'var(--site-green)' }}>THEY&apos;RE NOT INDEPENDENT.</span></h2>
          <div className="site-grid-bordered" style={{ gridTemplateColumns: 'repeat(2, 1fr)' }}>
            {PROBLEMS.map(p => (
              <div key={p.title} className="site-tool-card" style={{ '--tool-accent': 'var(--site-green)' } as React.CSSProperties}>
                <div className="site-label" style={{ color: 'var(--site-green)', marginBottom: 10 }}>▸</div>
                <h3 className="site-h3" style={{ fontSize: 16, marginBottom: 10, fontFamily: "'DM Sans', sans-serif", fontWeight: 600, letterSpacing: 0 }}>{p.title}</h3>
                <p className="site-body">{p.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* KNOWN TREES */}
      <section className="site-section site-section-paper-2 site-section-divider">
        <div className="site-inner">
          <div className="site-eyebrow">Mapped Hierarchies</div>
          <h2 className="site-h2">KNOWN TREES.<br /><span style={{ color: 'var(--site-green)' }}>MORE BEING MAPPED.</span></h2>
          <p className="site-lead" style={{ maxWidth: 560, marginBottom: 48 }}>These are the three largest consolidators currently in the detection index. The index grows with every scan.</p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }}>
            {TREES.map(tree => (
              <div key={tree.name} className="site-card" style={{ padding: '28px 24px', borderColor: 'var(--site-green-border)' }}>
                <h3 className="site-h3" style={{ color: 'var(--site-green)', marginBottom: 8, fontSize: 22 }}>{tree.name}</h3>
                <p className="site-body" style={{ marginBottom: 16 }}>{tree.sub}</p>
                <div className="site-eyebrow" style={{ marginBottom: 4 }}>Carriers</div>
                <p className="site-body" style={{ marginBottom: 12 }}>{tree.carriers}</p>
                <div className="site-eyebrow" style={{ marginBottom: 4 }}>Geography</div>
                <p className="site-body" style={{ marginBottom: 12 }}>{tree.geo}</p>
                <div className="site-eyebrow" style={{ marginBottom: 4 }}>Language Markers</div>
                <p className="site-body" style={{ color: 'var(--site-green)' }}>{tree.tell}</p>
                <div style={{ marginTop: 16, paddingTop: 12, borderTop: '1px solid var(--site-border)' }}>
                  <span className="site-body" style={{ fontSize: 10 }}>{tree.count}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* SIGNAL TIERS */}
      <section className="site-section site-section-white site-section-divider">
        <div className="site-inner">
          <div className="site-eyebrow">How It Scans</div>
          <h2 className="site-h2">4 SIGNAL TIERS.<br /><span style={{ color: 'var(--site-green)' }}>ONE VERDICT.</span></h2>
          <div className="site-grid-bordered" style={{ gridTemplateColumns: 'repeat(2, 1fr)' }}>
            {SIGNALS.map(s => (
              <div key={s.n} className="site-tool-card" style={{ '--tool-accent': 'var(--site-green)' } as React.CSSProperties}>
                <div className="site-label" style={{ color: 'var(--site-green)', marginBottom: 12 }}>{s.n}</div>
                <h3 className="site-h3" style={{ fontSize: 18, marginBottom: 10 }}>{s.title}</h3>
                <p className="site-body">{s.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* INFECTION STAGES */}
      <section className="site-section site-section-paper site-section-divider">
        <div className="site-inner">
          <div className="site-eyebrow">Infection Staging</div>
          <h2 className="site-h2">STAGE I TO IV.<br /><span style={{ color: 'var(--site-green)' }}>KNOW THE DEPTH.</span></h2>
          <div className="site-grid-bordered" style={{ gridTemplateColumns: 'repeat(4, 1fr)' }}>
            {STAGES.map(stage => (
              <div key={stage.roman} style={{ background: 'var(--site-white)', padding: '28px 24px' }}>
                <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 56, color: 'var(--site-green-border)', lineHeight: 1, marginBottom: 8 }}>{stage.roman}</div>
                <div className="site-label" style={{ color: 'var(--site-green)', marginBottom: 4 }}>{stage.range}</div>
                <div style={{ fontWeight: 600, fontSize: 13, color: 'var(--site-ink)', marginBottom: 8 }}>{stage.label}</div>
                <p className="site-body">{stage.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FIELD INTEL LOOP */}
      <section className="site-section site-section-paper-2 site-section-divider">
        <div className="site-inner">
          <div className="site-card" style={{ padding: '48px 40px', borderColor: 'var(--site-green-border)' }}>
            <div className="site-eyebrow" style={{ marginBottom: 16 }}>Field Intelligence Loop</div>
            <h2 className="site-h2" style={{ marginBottom: 20 }}>THE SYSTEM GETS SMARTER.<br /><span style={{ color: 'var(--site-green)' }}>EVERY SCAN TEACHES IT.</span></h2>
            <p className="site-lead" style={{ maxWidth: 600 }}>
              After ANATHEMA returns a prediction, you can log what you personally know — confirm the strain, correct it, add the sub-IMO name, or leave field notes. Every observation goes into the specimen database. Over time, ANATHEMA&apos;s predictions aren&apos;t just based on fingerprint rules — they&apos;re weighted against real confirmed data from real recruiters in the field.
            </p>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="site-section site-section-white site-section-divider">
        <div className="site-inner" style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: 80, alignItems: 'center' }}>
          <div>
            <div className="site-eyebrow">Get Started</div>
            <h2 className="site-h2" style={{ marginBottom: 20 }}>RUN YOUR FIRST<br /><span style={{ color: 'var(--site-green)' }}>SCAN.</span></h2>
            <p className="site-lead">Available inside your dashboard on every agent card. No extra setup.</p>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12, flexShrink: 0 }}>
            <Link href="/dashboard/search" className="site-btn-primary" style={{ background: 'var(--site-green)', boxShadow: '0 4px 24px rgba(26,122,74,0.28)', fontSize: 18, padding: '16px 40px' }}>Open Dashboard</Link>
            <Link href="/sign-up" className="site-btn-ghost" style={{ textAlign: 'center' }}>Request Access</Link>
          </div>
        </div>
      </section>
    </>
  )
}
