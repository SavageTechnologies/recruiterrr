import Link from 'next/link'
import DavidDemoSection from '@/components/products/david/DavidDemoSection'

const DAVID = '#a78bfa'

export default function DavidLandingPage() {
  return (
    <div style={{ background: 'var(--black)' }}>

      {/* HERO */}
      <section style={{ padding: '100px 40px 60px', position: 'relative', overflow: 'hidden' }}>
        <div style={{
          position: 'absolute', right: 0, top: 0, width: '45vw', height: '100%',
          backgroundImage: "url('/david.png')", backgroundSize: 'cover', backgroundPosition: 'center top',
          opacity: 0.055, pointerEvents: 'none', userSelect: 'none',
          maskImage: 'linear-gradient(to right, transparent 0%, rgba(0,0,0,0.4) 30%, black 70%)',
          WebkitMaskImage: 'linear-gradient(to right, transparent 0%, rgba(0,0,0,0.4) 30%, black 70%)',
        }} />
        <div style={{ maxWidth: 960, position: 'relative' }}>
          <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 11, color: DAVID, letterSpacing: 3, textTransform: 'uppercase', marginBottom: 20, display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ width: 24, height: 1, background: DAVID, display: 'inline-block' }} />
            A Recruiterrr Intelligence Tool — Powered by ANATHEMA
          </div>
          <h1 style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 'clamp(64px, 10vw, 120px)', lineHeight: 0.9, letterSpacing: 2, color: 'var(--white)', marginBottom: 24 }}>
            YOUR SYSTEM.<br />
            <span style={{ color: DAVID }}>OUR INTEL.</span><br />
            THEIR ATTENTION.
          </h1>
          <p style={{ fontSize: 18, color: 'var(--muted)', fontWeight: 300, maxWidth: 580, lineHeight: 1.6, marginBottom: 48 }}>
            DAVID doesn't write your messages. It structures everything ANATHEMA knows about a producer into a clean, machine-readable profile payload — so your CRM, sequencer, or AI writer can build outreach that actually reflects who they are.
          </p>
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
            <Link href="/dashboard" style={{ padding: '18px 48px', background: DAVID, color: 'var(--black)', fontFamily: "'Bebas Neue', sans-serif", fontSize: 22, letterSpacing: 3, textDecoration: 'none' }}>
              ACCESS DASHBOARD
            </Link>
            <Link href="/sign-up" style={{ padding: '18px 32px', background: 'transparent', border: '1px solid var(--border-light)', color: 'var(--muted)', fontFamily: "'DM Mono', monospace", fontSize: 12, letterSpacing: 2, textDecoration: 'none', display: 'flex', alignItems: 'center' }}>
              REQUEST ACCESS
            </Link>
          </div>
        </div>
      </section>

      {/* STATS */}
      <div style={{ display: 'flex', gap: 40, padding: '48px 40px', borderTop: '1px solid var(--border)', borderBottom: '1px solid var(--border)', flexWrap: 'wrap' }}>
        {[
          { main: '1', accent: '', label: 'API Call — Full Structured Profile Returned' },
          { main: '100', accent: '%', label: 'Your Stack. Your Templates. Your Voice.' },
          { main: '0', accent: '', label: 'Messages Written By Us' },
          { main: '∞', accent: '', label: 'Systems It Can Feed Into' },
        ].map(s => (
          <div key={s.label}>
            <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 42, color: 'var(--white)', letterSpacing: 1 }}>
              {s.main}<span style={{ color: DAVID }}>{s.accent}</span>
            </div>
            <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 10, color: 'var(--muted)', letterSpacing: 2, textTransform: 'uppercase' }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* WHAT DAVID IS */}
      <section style={{ padding: '80px 40px', maxWidth: 900 }}>
        <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 11, color: 'var(--muted)', letterSpacing: 3, textTransform: 'uppercase', marginBottom: 12 }}>What DAVID Is</div>
        <h2 style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 48, letterSpacing: 2, color: 'var(--white)', marginBottom: 40 }}>
          NOT A WRITER.<br /><span style={{ color: DAVID }}>AN INTELLIGENCE LAYER.</span>
        </h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 2 }}>
          {[
            { title: "We Don't Touch Your CRM", body: "DAVID doesn't integrate with HubSpot, Salesforce, or anything else. It returns a structured data payload. You decide where it goes and what your system does with it." },
            { title: "We Don't Write Your Messages", body: "Your voice, your templates, your brand. DAVID gives your AI writer or sequencer the intelligence it needs to stop sending generic outreach. The writing is yours." },
            { title: 'We Translate ANATHEMA Into Structure', body: "ANATHEMA builds deep profiles. DAVID formats that intelligence — tree, upline, signals, score, context — into clean JSON your system can actually read and act on." },
            { title: 'One Input. Complete Profile.', body: "Pass in a producer name and market. Get back everything — predicted distribution chain, confidence, digital footprint, behavioral signals. Your system handles the rest." },
          ].map(s => (
            <div key={s.title} style={{ background: 'var(--card)', border: '1px solid var(--border)', borderTop: `3px solid ${DAVID}`, padding: '28px 24px' }}>
              <div style={{ fontSize: 15, fontWeight: 600, marginBottom: 8, color: 'var(--white)' }}>{s.title}</div>
              <div style={{ fontSize: 13, color: 'var(--muted)', lineHeight: 1.6 }}>{s.body}</div>
            </div>
          ))}
        </div>
      </section>

      {/* INTERACTIVE DEMO */}
      <section style={{ padding: '0 40px 80px', maxWidth: 900 }}>
        <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 11, color: 'var(--muted)', letterSpacing: 3, textTransform: 'uppercase', marginBottom: 12 }}>What You Receive</div>
        <h2 style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 48, letterSpacing: 2, color: 'var(--white)', marginBottom: 40 }}>
          THE PAYLOAD. <span style={{ color: DAVID }}>TRY IT YOURSELF.</span>
        </h2>
        <DavidDemoSection />
      </section>

      {/* HOW IT WORKS */}
      <section style={{ padding: '0 40px 80px', maxWidth: 900 }}>
        <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 11, color: 'var(--muted)', letterSpacing: 3, textTransform: 'uppercase', marginBottom: 40 }}>How It Works</div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 2 }}>
          {[
            { n: '01', title: 'Pull The Specimen', body: 'Find the producer in your Database or run a Search. Every producer ANATHEMA has touched already has a profile. DAVID reads it and formats the payload.' },
            { n: '02', title: 'Request The Payload', body: 'One API call. Pass in the producer. Get back the full structured profile — tree, upline, confidence, signals, context, score. Machine-readable. Ready to inject.' },
            { n: '03', title: 'Your System Takes Over', body: "Feed the payload into your AI writer, CRM enrichment, or sequencer. It knows who it's talking to. What it does with that knowledge is entirely up to you." },
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
        <div style={{ background: 'var(--card)', border: '1px solid var(--border)', borderLeft: `4px solid ${DAVID}`, padding: '48px 40px' }}>
          <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 11, color: 'var(--muted)', letterSpacing: 3, textTransform: 'uppercase', marginBottom: 16 }}>Why David</div>
          <h2 style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 40, letterSpacing: 2, color: 'var(--white)', marginBottom: 20, maxWidth: 700 }}>
            HE STUDIED EVERY HUMAN<br /><span style={{ color: DAVID }}>BEFORE THEY WALKED IN THE ROOM.</span>
          </h2>
          <p style={{ fontSize: 15, color: 'var(--muted)', maxWidth: 580, lineHeight: 1.8 }}>
            David — the synthetic intelligence from Prometheus — observed, catalogued, and understood every human on the ship before a single conversation happened. He didn't react. He was already prepared. DAVID gives your recruiting operation that same preparation. The intelligence exists. We just make sure your system can read it. <em style={{ color: 'var(--white)' }}>What you do with it is up to you.</em>
          </p>
        </div>
      </section>

      {/* WHO IT'S FOR */}
      <section style={{ padding: '0 40px 80px', maxWidth: 900 }}>
        <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 11, color: 'var(--muted)', letterSpacing: 3, textTransform: 'uppercase', marginBottom: 40 }}>Who It's For</div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 2 }}>
          {[
            { label: 'Teams Running AI-Powered Outreach', body: "Your AI writer is only as good as the context you give it. DAVID gives it the full picture — so the output stops sounding generic." },
            { label: 'CRM Teams Enriching Contact Records', body: "Stop staring at a name and a phone number. DAVID enriches every producer record with predicted tree, upline, confidence, and behavioral signals." },
            { label: 'Sequencer Users Who Want Profile-Driven Routing', body: "Route producers into different sequences based on their DAVID classification. Integrity captives get one sequence. Independents get another. The data drives the decision." },
            { label: 'Any Recruiter Whose Outreach Is Being Ignored', body: "The problem isn't your offer. It's that your system has no context. DAVID fixes the context. Your system fixes the message." },
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
            YOUR SYSTEM ALREADY<br /><span style={{ color: DAVID }}>KNOWS WHAT TO DO.</span>
          </div>
          <p style={{ fontSize: 16, color: 'var(--muted)', marginBottom: 40, maxWidth: 520 }}>
            Give it the intelligence. DAVID structures everything ANATHEMA knows into a payload your stack can actually use. The rest is yours.
          </p>
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
            <Link href="/dashboard" style={{ padding: '18px 48px', background: DAVID, color: 'var(--black)', fontFamily: "'Bebas Neue', sans-serif", fontSize: 22, letterSpacing: 3, textDecoration: 'none' }}>
              ACCESS DASHBOARD
            </Link>
            <Link href="/sign-up" style={{ padding: '18px 32px', background: 'transparent', border: '1px solid var(--border-light)', color: 'var(--muted)', fontFamily: "'DM Mono', monospace", fontSize: 12, letterSpacing: 2, textDecoration: 'none', display: 'flex', alignItems: 'center' }}>
              REQUEST ACCESS
            </Link>
          </div>
        </div>
      </section>

    </div>
  )
}
