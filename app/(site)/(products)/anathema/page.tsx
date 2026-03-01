'use client'

import Link from 'next/link'

const STAGES = [
  { roman: 'I', range: '1–34%', label: 'Trace Markers', body: 'Weak signal. A single carrier overlap or vague language pattern. Not conclusive — but enough to start asking questions.' },
  { roman: 'II', range: '35–54%', label: 'Partial Match', body: 'Multiple signals point to a tree. Possible affiliation. Worth a targeted approach and one qualifying question on the call.' },
  { roman: 'III', range: '55–79%', label: 'Strong Markers', body: "Carrier fingerprint plus confirmed language signals. High probability affiliation. You know who you're dealing with." },
  { roman: 'IV', range: '80–100%', label: 'Full Confirmation', body: 'Definitive. Direct affiliation language, partner listing, or Facebook confirmation. Act accordingly.' },
]

const SIGNALS = [
  { n: '01', title: 'Carrier Fingerprint', body: "Every tree has its carriers. The carrier mix a producer writes is one of the strongest affiliation signals available — most producers don't realize their appointments are a fingerprint." },
  { n: '02', title: 'Language Markers', body: "Website copy, About pages, and social bios contain embedded signals — branded program names, platform references, event language. These aren't accidents. They're brand contamination." },
  { n: '03', title: 'Web Intelligence', body: 'A live search cross-references the producer against the full distribution network index — partner directories, press releases, association pages, and co-mentions that no producer voluntarily surfaces.' },
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

export default function AnathemaLandingPage() {
  return (
    <div style={{ background: 'var(--black)' }}>
      <style>{`
        @keyframes scanDown { 0% { top: 0; opacity: 0.7; } 100% { top: 100%; opacity: 0; } }
        .hero-scanline { position: absolute; left: 0; width: 100%; height: 1px; background: linear-gradient(90deg, transparent, #00e676, transparent); animation: scanDown 3s ease-in-out infinite; pointer-events: none; }
        @keyframes pulseGreen { 0%, 100% { opacity: 0.4; } 50% { opacity: 1; } }
        .pulse-dot { width: 6px; height: 6px; border-radius: 50%; background: #00e676; animation: pulseGreen 2s ease-in-out infinite; display: inline-block; }
      `}</style>

      {/* HERO */}
      <section style={{ padding: '100px 40px 60px', position: 'relative', overflow: 'hidden' }}>
        <div style={{
          position: 'absolute', right: 0, top: 0, width: '45vw', height: '100%',
          backgroundImage: "url('/anathema-specimen.png')", backgroundSize: 'cover', backgroundPosition: 'center top',
          opacity: 0.055, pointerEvents: 'none', userSelect: 'none',
          maskImage: 'linear-gradient(to right, transparent 0%, rgba(0,0,0,0.4) 30%, black 70%)',
          WebkitMaskImage: 'linear-gradient(to right, transparent 0%, rgba(0,0,0,0.4) 30%, black 70%)',
        }} />
        <div style={{ maxWidth: 960, position: 'relative' }}>
          <div className="hero-scanline" />
          <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 11, color: 'var(--green)', letterSpacing: 3, textTransform: 'uppercase', marginBottom: 20, display: 'flex', alignItems: 'center', gap: 10 }}>
            <span className="pulse-dot" />
            A Recruiterrr Intelligence System · Chemical A0-3959X.91–15
          </div>
          <h1 style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 'clamp(60px, 10vw, 116px)', lineHeight: 0.88, letterSpacing: 2, color: 'var(--white)', marginBottom: 28 }}>
            EVERY AGENT<br />
            <span style={{ color: 'var(--green)' }}>HAS BEEN</span><br />
            INFECTED.
          </h1>
          <p style={{ fontSize: 16, color: 'var(--muted)', fontFamily: "'DM Mono', monospace", maxWidth: 560, lineHeight: 1.7, marginBottom: 48, letterSpacing: 0.3 }}>
            In the US insurance market, no producer operates independently. Every one of them rolls up through a distribution hierarchy — a tree they didn't choose and won't tell you about. They don't advertise it. But the pathogen leaves traces. ANATHEMA reads them.
          </p>
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
            <Link href="/dashboard/search" style={{ padding: '16px 40px', background: 'transparent', border: '1px solid var(--green)', color: 'var(--green)', fontFamily: "'Bebas Neue', sans-serif", fontSize: 20, letterSpacing: 3, textDecoration: 'none' }}>
              RUN A SCAN
            </Link>
            <Link href="/sign-up" style={{ padding: '16px 28px', background: 'transparent', border: '1px solid var(--border-light)', color: 'var(--muted)', fontFamily: "'DM Mono', monospace", fontSize: 11, letterSpacing: 2, textDecoration: 'none', display: 'flex', alignItems: 'center' }}>
              REQUEST ACCESS
            </Link>
          </div>
        </div>
      </section>

      {/* STATS ROW */}
      <div style={{ display: 'flex', gap: 0, borderTop: '1px solid var(--border)', borderBottom: '1px solid var(--border)', flexWrap: 'wrap' }}>
        {[
          { main: '∞', label: 'Distribution Trees' },
          { main: '4', label: 'Signal Tiers' },
          { main: 'IV', label: 'Infection Stages' },
          { main: '∞', label: 'Specimen Learning' },
        ].map((s, i) => (
          <div key={s.label} style={{ padding: '32px 40px', borderRight: i < 3 ? '1px solid var(--border)' : 'none', flex: '1 1 180px' }}>
            <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 44, color: 'var(--green)', letterSpacing: 1, lineHeight: 1 }}>{s.main}</div>
            <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 9, color: 'var(--muted)', letterSpacing: 3, textTransform: 'uppercase', marginTop: 4 }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* THE PROBLEM */}
      <section style={{ padding: '80px 40px', maxWidth: 900 }}>
        <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 11, color: 'var(--muted)', letterSpacing: 3, textTransform: 'uppercase', marginBottom: 12 }}>The Problem</div>
        <h2 style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 52, letterSpacing: 2, color: 'var(--white)', marginBottom: 40 }}>
          YOU'RE RECRUITING BLIND.<br />
          <span style={{ color: 'var(--green)' }}>THEY'RE NOT INDEPENDENT.</span>
        </h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 2 }}>
          {[
            { title: 'The Major Trees Control Most of the Market', body: 'A small number of large consolidators — Integrity Marketing Group, AmeriLife, Senior Market Sales, and others — collectively control the majority of the independent distribution market. Most producers who call themselves independent are affiliated with one of them.' },
            { title: 'The Hierarchy Is Invisible', body: 'No public registry. No disclosure requirement. The distribution tree can be 3–5 layers deep — IMO to sub-FMO to affiliate to producer — and none of it is documented anywhere.' },
            { title: "You're Wasting Calls", body: "If you're recruiting for one tree and you spend 45 minutes pitching a producer already in it, you just wasted your time. ANATHEMA tells you before you dial." },
            { title: 'Competitive Intel Is Currency', body: "Knowing which tree a producer rolls up through tells you their contracts, their carriers, their incentives, and exactly what you need to offer to get them to move." },
          ].map(s => (
            <div key={s.title} style={{ background: 'var(--card)', border: '1px solid var(--border)', padding: '28px 24px' }}>
              <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 10, color: 'var(--green)', marginBottom: 12, letterSpacing: 1 }}>▸</div>
              <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 12, fontWeight: 600, marginBottom: 10, color: 'var(--white)', letterSpacing: 0.3 }}>{s.title}</div>
              <div style={{ fontSize: 13, color: 'var(--muted)', lineHeight: 1.7 }}>{s.body}</div>
            </div>
          ))}
        </div>
      </section>

      {/* THE THREE TREES */}
      <section style={{ padding: '0 40px 80px', maxWidth: 900 }}>
        <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 11, color: 'var(--muted)', letterSpacing: 3, textTransform: 'uppercase', marginBottom: 12 }}>Mapped Hierarchies</div>
        <h2 style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 52, letterSpacing: 2, color: 'var(--white)', marginBottom: 16 }}>
          KNOWN TREES.<br />
          <span style={{ color: 'var(--green)' }}>MORE BEING MAPPED.</span>
        </h2>
        <p style={{ fontFamily: "'DM Mono', monospace", fontSize: 11, color: 'var(--muted)', letterSpacing: 1, marginBottom: 40, maxWidth: 560, lineHeight: 1.7 }}>
          These are the three largest consolidators currently in the detection index. ANATHEMA also detects unresolved uplines — FMOs and IMOs outside the mapped network — and flags them for field confirmation. The index grows with every scan.
        </p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 2 }}>
          {TREES.map(tree => (
            <div key={tree.name} style={{ background: '#0e0d0c', border: '1px solid rgba(0,230,118,0.15)', padding: '28px 24px', fontFamily: "'DM Mono', monospace" }}>
              <div style={{ fontSize: 22, color: 'var(--green)', fontFamily: "'Bebas Neue', sans-serif", letterSpacing: 3, marginBottom: 8 }}>{tree.name}</div>
              <div style={{ fontSize: 11, color: 'var(--muted)', marginBottom: 16, lineHeight: 1.6 }}>{tree.sub}</div>
              <div style={{ fontSize: 9, color: '#666', letterSpacing: 1, marginBottom: 6 }}>CARRIERS</div>
              <div style={{ fontSize: 11, color: 'var(--muted)', marginBottom: 14, lineHeight: 1.5 }}>{tree.carriers}</div>
              <div style={{ fontSize: 9, color: '#666', letterSpacing: 1, marginBottom: 6 }}>GEOGRAPHY</div>
              <div style={{ fontSize: 11, color: 'var(--muted)', marginBottom: 14 }}>{tree.geo}</div>
              <div style={{ fontSize: 9, color: '#666', letterSpacing: 1, marginBottom: 6 }}>LANGUAGE MARKERS</div>
              <div style={{ fontSize: 10, color: 'var(--green)', lineHeight: 1.6 }}>{tree.tell}</div>
              <div style={{ marginTop: 16, paddingTop: 12, borderTop: '1px solid #1a1a1a', fontSize: 9, color: '#444', letterSpacing: 1 }}>{tree.count}</div>
            </div>
          ))}
        </div>
      </section>

      {/* SIGNAL STACK */}
      <section style={{ padding: '0 40px 80px', maxWidth: 900 }}>
        <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 11, color: 'var(--muted)', letterSpacing: 3, textTransform: 'uppercase', marginBottom: 12 }}>How It Scans</div>
        <h2 style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 52, letterSpacing: 2, color: 'var(--white)', marginBottom: 40 }}>
          4 SIGNAL TIERS.<br />
          <span style={{ color: 'var(--green)' }}>ONE VERDICT.</span>
        </h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 2 }}>
          {SIGNALS.map(s => (
            <div key={s.n} style={{ background: 'var(--card)', border: '1px solid var(--border)', padding: '28px 24px' }}>
              <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 10, color: 'var(--green)', letterSpacing: 2, marginBottom: 14 }}>{s.n}</div>
              <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 12, fontWeight: 600, marginBottom: 10, color: 'var(--white)', letterSpacing: 0.3 }}>{s.title}</div>
              <div style={{ fontSize: 13, color: 'var(--muted)', lineHeight: 1.7 }}>{s.body}</div>
            </div>
          ))}
        </div>
      </section>

      {/* INFECTION STAGES */}
      <section style={{ padding: '0 40px 80px', maxWidth: 900 }}>
        <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 11, color: 'var(--muted)', letterSpacing: 3, textTransform: 'uppercase', marginBottom: 12 }}>Infection Staging</div>
        <h2 style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 52, letterSpacing: 2, color: 'var(--white)', marginBottom: 40 }}>
          STAGE I TO IV.<br />
          <span style={{ color: 'var(--green)' }}>KNOW THE DEPTH.</span>
        </h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 2 }}>
          {STAGES.map(stage => (
            <div key={stage.roman} style={{ background: 'var(--card)', border: '1px solid var(--border)', padding: '24px 20px' }}>
              <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 48, color: 'rgba(0,230,118,0.2)', lineHeight: 1, marginBottom: 8 }}>{stage.roman}</div>
              <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 9, color: 'var(--green)', letterSpacing: 2, marginBottom: 4 }}>{stage.range}</div>
              <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 11, color: 'var(--white)', marginBottom: 10 }}>{stage.label}</div>
              <div style={{ fontSize: 12, color: 'var(--muted)', lineHeight: 1.6 }}>{stage.body}</div>
            </div>
          ))}
        </div>
      </section>

      {/* FIELD OBSERVATION */}
      <section style={{ padding: '0 40px 80px', maxWidth: 900 }}>
        <div style={{ background: '#0e0d0c', border: '1px solid rgba(0,230,118,0.2)', padding: '48px 40px' }}>
          <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 11, color: 'var(--muted)', letterSpacing: 3, textTransform: 'uppercase', marginBottom: 16 }}>Field Intelligence Loop</div>
          <h2 style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 44, letterSpacing: 2, color: 'var(--white)', marginBottom: 20, maxWidth: 700 }}>
            THE SYSTEM GETS SMARTER.<br />
            <span style={{ color: 'var(--green)' }}>EVERY SCAN TEACHES IT.</span>
          </h2>
          <p style={{ fontSize: 14, color: 'var(--muted)', maxWidth: 600, lineHeight: 1.8, fontFamily: "'DM Mono', monospace", letterSpacing: 0.3 }}>
            After ANATHEMA returns a prediction, you can log what you personally know — confirm the strain, correct it, add the sub-IMO name, or leave field notes. Every observation goes into the specimen database. Over time, ANATHEMA's predictions aren't just based on fingerprint rules — they're weighted against real confirmed data from real recruiters in the field.
          </p>
        </div>
      </section>

      {/* MYTHOLOGY CALLOUT */}
      <section style={{ padding: '0 40px 80px', maxWidth: 900 }}>
        <div style={{ background: 'var(--card)', border: '1px solid var(--border)', padding: '48px 40px' }}>
          <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 11, color: 'var(--muted)', letterSpacing: 3, textTransform: 'uppercase', marginBottom: 16 }}>Why Anathema</div>
          <h2 style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 44, letterSpacing: 2, color: 'var(--white)', marginBottom: 20, maxWidth: 700 }}>
            THE PATHOGEN<br />
            <span style={{ color: 'var(--green)' }}>LEAVES TRACES.</span>
          </h2>
          <p style={{ fontSize: 14, color: 'var(--muted)', maxWidth: 600, lineHeight: 1.8, fontFamily: "'DM Mono', monospace", letterSpacing: 0.3 }}>
            In the AVP / Prometheus universe, an Anathema is an organism changed at a cellular level by Engineer pathogen — Chemical A0-3959X.91–15. It doesn't look like what it was before. But the pathogen leaves biological markers that reveal which strain infected it and how deep the mutation runs. Every insurance producer in this market has been changed — by the tree that recruited them, the carriers they were handed, the language they were trained to use. They don't announce it. But the markers are there. ANATHEMA reads them.
          </p>
        </div>
      </section>

      {/* CTA */}
      <section style={{ padding: '0 40px 100px' }}>
        <div style={{ borderTop: '1px solid var(--border)', paddingTop: 80 }}>
          <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 'clamp(48px, 6vw, 88px)', letterSpacing: 2, color: 'var(--white)', marginBottom: 16, lineHeight: 0.9 }}>
            RUN YOUR FIRST<br />
            <span style={{ color: 'var(--green)' }}>SCAN.</span>
          </div>
          <p style={{ fontSize: 14, color: 'var(--muted)', marginBottom: 40, maxWidth: 440, fontFamily: "'DM Mono', monospace", letterSpacing: 0.3 }}>
            Available inside your Recruiterrr dashboard on every agent card. No extra setup. Hit ANATHEMA SCAN and the system does the rest.
          </p>
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
            <Link href="/dashboard/search" style={{ padding: '16px 40px', background: 'transparent', border: '1px solid var(--green)', color: 'var(--green)', fontFamily: "'Bebas Neue', sans-serif", fontSize: 20, letterSpacing: 3, textDecoration: 'none' }}>
              OPEN DASHBOARD
            </Link>
            <Link href="/sign-up" style={{ padding: '16px 28px', background: 'transparent', border: '1px solid var(--border-light)', color: 'var(--muted)', fontFamily: "'DM Mono', monospace", fontSize: 11, letterSpacing: 2, textDecoration: 'none', display: 'flex', alignItems: 'center' }}>
              REQUEST ACCESS
            </Link>
          </div>
        </div>
      </section>

    </div>
  )
}
