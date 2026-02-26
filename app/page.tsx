'use client'

import Link from 'next/link'
import { useUser } from '@clerk/nextjs'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'
import PageFooter from '@/components/PageFooter'
import HomeNav from '@/components/HomeNav'
import XenoEgg from '@/components/XenoEgg'

export default function HomePage() {
  const { isSignedIn } = useUser()
  const router = useRouter()

  useEffect(() => {
    if (isSignedIn) router.push('/dashboard')
  }, [isSignedIn, router])

  return (
    <div style={{ minHeight: '100vh', background: 'var(--black)' }}>
      <HomeNav />

      {/* HERO */}
      <section style={{ padding: '100px 40px 60px', maxWidth: 960, position: 'relative', overflow: 'hidden' }}>
        <XenoEgg />
        <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 11, color: 'var(--orange)', letterSpacing: 3, textTransform: 'uppercase', marginBottom: 20, display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ width: 24, height: 1, background: 'var(--orange)', display: 'inline-block' }} />
          For FMOs &amp; IMOs
        </div>
        <h1 style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 'clamp(64px, 10vw, 120px)', lineHeight: 0.9, letterSpacing: 2, color: 'var(--white)', marginBottom: 24 }}>
          FIND.<br />
          <span style={{ color: 'var(--orange)' }}>SCORE.</span><br />
          RECRUIT.
        </h1>
        <p style={{ fontSize: 18, color: 'var(--muted)', fontWeight: 300, maxWidth: 520, lineHeight: 1.6, marginBottom: 48 }}>
          Stop cold calling blind. We scrape, research, and score every independent life, health, and senior insurance agent in any market — so you know exactly who to call first.
        </p>
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
          <Link href="/pricing" style={{ padding: '18px 48px', background: 'var(--orange)', border: 'none', color: 'var(--black)', fontFamily: "'Bebas Neue', sans-serif", fontSize: 22, letterSpacing: 3, cursor: 'pointer', textDecoration: 'none' }}>
            REQUEST ACCESS
          </Link>
          <Link href="/about" style={{ padding: '18px 32px', background: 'transparent', border: '1px solid var(--border-light)', color: 'var(--muted)', fontFamily: "'DM Mono', monospace", fontSize: 12, letterSpacing: 2, cursor: 'pointer', textDecoration: 'none', display: 'flex', alignItems: 'center' }}>
            HOW IT WORKS
          </Link>
        </div>
      </section>

      {/* STATS */}
      <div style={{ display: 'flex', gap: 40, padding: '48px 40px', borderTop: '1px solid var(--border)', borderBottom: '1px solid var(--border)', flexWrap: 'wrap' }}>
        {[
          { main: '320', accent: 'K+', label: 'Licensed Agents Findable' },
          { main: '50', accent: '', label: 'States Covered' },
          { main: '6', accent: 'x', label: 'Signals Per Agent' },
          { main: '< 90', accent: 's', label: 'Full Market Scan' },
        ].map(s => (
          <div key={s.label}>
            <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 42, color: 'var(--white)', letterSpacing: 1 }}>
              {s.main}<span style={{ color: 'var(--orange)' }}>{s.accent}</span>
            </div>
            <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 10, color: 'var(--muted)', letterSpacing: 2, textTransform: 'uppercase' }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* SIGNALS */}
      <section style={{ padding: '80px 40px', maxWidth: 900 }}>
        <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 11, color: 'var(--muted)', letterSpacing: 3, textTransform: 'uppercase', marginBottom: 12 }}>What We Check</div>
        <h2 style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 48, letterSpacing: 2, color: 'var(--white)', marginBottom: 40 }}>
          6 SIGNALS. ONE <span style={{ color: 'var(--orange)' }}>SCORE.</span>
        </h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 2 }}>
          {[
            { icon: '01', title: 'Google Presence', body: 'Reviews, ratings, business type, and years in operation pulled from Google local listings.' },
            { icon: '02', title: 'Website Crawl', body: 'We visit their site and identify carrier logos, independent signals, and product focus areas.' },
            { icon: '03', title: 'Job Postings', body: 'Actively hiring insurance agents? Growing agencies with budget are prime recruiting targets.' },
            { icon: '04', title: 'YouTube Presence', body: 'Content creators with Medicare or senior insurance channels are tech-forward independents.' },
            { icon: '05', title: 'Carrier Mix', body: 'Multi-carrier agents are far more recruitable than single-carrier captives. We tell the difference.' },
            { icon: '06', title: 'HOT / WARM / COLD', body: 'Every agent gets a 0-100 recruitability score. Stop guessing who to call.' },
          ].map(s => (
            <div key={s.title} style={{ background: 'var(--card)', border: '1px solid var(--border)', padding: '28px 24px' }}>
              <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 11, color: 'var(--orange)', letterSpacing: 2, marginBottom: 14 }}>{s.icon}</div>
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
            { n: '01', title: 'Search Any Market', body: 'Enter a city and state. We query Google local listings for every insurance agent in that area.' },
            { n: '02', title: 'We Do The Research', body: 'Our AI crawls websites, checks job boards, scans YouTube, and identifies carrier appointments.' },
            { n: '03', title: 'You Get a Score', body: 'Every agent gets a recruitability score. HOT means independent, multi-carrier, and ready to move.' },
          ].map(step => (
            <div key={step.n} style={{ background: 'var(--card)', border: '1px solid var(--border)', padding: '32px 28px' }}>
              <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 56, color: 'var(--border-light)', marginBottom: 16 }}>{step.n}</div>
              <div style={{ fontSize: 16, fontWeight: 600, marginBottom: 12, color: 'var(--white)' }}>{step.title}</div>
              <div style={{ fontSize: 14, color: 'var(--muted)', lineHeight: 1.6 }}>{step.body}</div>
            </div>
          ))}
        </div>
      </section>

      {/* WHO IT'S FOR */}
      <section style={{ padding: '0 40px 80px', maxWidth: 900 }}>
        <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 11, color: 'var(--muted)', letterSpacing: 3, textTransform: 'uppercase', marginBottom: 40 }}>Who It's For</div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 2 }}>
          {[
            { role: 'FMO / IMO Recruiters', desc: "You're building a downline. Stop buying $5 lists of cold names. Every search gives you a ranked shortlist of agents who are actually recruitable." },
            { role: 'Regional Managers', desc: "You know your territory but you don't know every agent in it. Run a city search in under 2 minutes and walk into your next call prepared." },
            { role: 'Carrier Reps', desc: "Identify independent agents in new markets who don't carry your products yet. Warm leads, not cold calls." },
            { role: 'Agency Builders', desc: "Looking to acquire a book or bring on producers? Find established agents with high reviews and independent setups." },
          ].map(w => (
            <div key={w.role} style={{ background: 'var(--card)', border: '1px solid var(--border)', padding: '28px 24px' }}>
              <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 10, color: 'var(--orange)', letterSpacing: 2, textTransform: 'uppercase', marginBottom: 10 }}>{w.role}</div>
              <div style={{ fontSize: 14, color: 'var(--muted)', lineHeight: 1.7 }}>{w.desc}</div>
            </div>
          ))}
        </div>
      </section>

      {/* INTELLIGENCE TOOLS */}
      <section style={{ padding: '0 40px 80px', maxWidth: 960 }}>
        <style>{`
          @keyframes blink { 0%,100%{opacity:1} 50%{opacity:0} }
          @keyframes scanlineP { 0%{top:-2px;opacity:0.7} 100%{top:100%;opacity:0} }
          @keyframes scanlineA { 0%{top:-2px;opacity:0.7} 100%{top:100%;opacity:0} }
          @keyframes pulseP { 0%,100%{opacity:0.4} 50%{opacity:1} }
          @keyframes pulseA { 0%,100%{opacity:0.3} 50%{opacity:0.8} }
          .intel-card-p:hover .scanline-p { animation: scanlineP 1.4s linear infinite !important; }
          .intel-card-a:hover .scanline-a { animation: scanlineA 1.4s linear infinite !important; }
          .intel-card-p:hover { border-color: var(--orange) !important; box-shadow: 0 0 40px rgba(255,85,0,0.08), inset 0 0 60px rgba(255,85,0,0.03) !important; }
          .intel-card-a:hover { border-color: rgba(0,230,118,0.6) !important; box-shadow: 0 0 40px rgba(0,230,118,0.08), inset 0 0 60px rgba(0,230,118,0.03) !important; }
        `}</style>

        {/* Section header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 24 }}>
          <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 9, color: '#333', letterSpacing: 3 }}>SYS://INTEL</div>
          <div style={{ flex: 1, height: 1, background: 'linear-gradient(90deg, #2a2a2a, transparent)' }} />
          <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 9, color: '#333', letterSpacing: 2 }}>2 MODULES ONLINE</div>
          <div style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--green)', animation: 'pulseA 2s ease-in-out infinite' }} />
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 3 }}>

          {/* PROMETHEUS CARD */}
          <Link href="/prometheus" style={{ textDecoration: 'none' }}>
            <div className="intel-card-p" style={{ background: '#100f0d', border: '1px solid #2a2826', padding: 0, cursor: 'pointer', transition: 'border-color 0.2s, box-shadow 0.2s', position: 'relative', overflow: 'hidden' }}>

              {/* Scan line */}
              <div className="scanline-p" style={{ position: 'absolute', left: 0, width: '100%', height: 2, background: 'linear-gradient(90deg, transparent, var(--orange), transparent)', top: '-2px', opacity: 0, zIndex: 2 }} />

              {/* Corner decorations */}
              <div style={{ position: 'absolute', top: 0, left: 0, width: 20, height: 20, borderTop: '1px solid var(--orange)', borderLeft: '1px solid var(--orange)', opacity: 0.5 }} />
              <div style={{ position: 'absolute', top: 0, right: 0, width: 20, height: 20, borderTop: '1px solid var(--orange)', borderRight: '1px solid var(--orange)', opacity: 0.5 }} />
              <div style={{ position: 'absolute', bottom: 0, left: 0, width: 20, height: 20, borderBottom: '1px solid var(--orange)', borderLeft: '1px solid var(--orange)', opacity: 0.5 }} />
              <div style={{ position: 'absolute', bottom: 0, right: 0, width: 20, height: 20, borderBottom: '1px solid var(--orange)', borderRight: '1px solid var(--orange)', opacity: 0.5 }} />

              {/* Header bar */}
              <div style={{ padding: '10px 16px', borderBottom: '1px solid #1e1c1a', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <div style={{ width: 5, height: 5, background: 'var(--orange)', animation: 'pulseP 2.5s ease-in-out infinite' }} />
                  <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 8, color: 'var(--orange)', letterSpacing: 3 }}>PROMETHEUS · MODULE 01</div>
                </div>
                <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 8, color: '#333', letterSpacing: 1 }}>STATUS: ONLINE</div>
              </div>

              {/* Body */}
              <div style={{ padding: '28px 28px 24px' }}>
                <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 9, color: '#444', letterSpacing: 2, marginBottom: 14 }}>
                  ── FMO COMPETITIVE INTELLIGENCE ──
                </div>
                <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 32, color: 'var(--white)', letterSpacing: 2, lineHeight: 1, marginBottom: 14 }}>
                  KNOW THEIR<br />EVERY MOVE<span style={{ color: 'var(--orange)' }}>.</span>
                </div>
                <div style={{ fontSize: 12, color: '#666', lineHeight: 1.7, marginBottom: 20 }}>
                  Carriers. Incentive trips. Lead programs. Their recruiting pitch. Weak points. A custom counter-script built from their vulnerabilities.
                </div>

                {/* Fake data readout */}
                <div style={{ borderTop: '1px solid #1e1c1a', paddingTop: 14, display: 'flex', flexDirection: 'column', gap: 5 }}>
                  {['CARRIER STACK EXTRACTION', 'TRIP INTEL 2025/2026', 'COUNTER-PITCH GENERATOR'].map((item, i) => (
                    <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <div style={{ width: 4, height: 4, background: 'var(--orange)', opacity: 0.5, flexShrink: 0 }} />
                      <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 8, color: '#444', letterSpacing: 1 }}>{item}</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Footer */}
              <div style={{ padding: '10px 28px', borderTop: '1px solid #1e1c1a', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 9, color: 'var(--orange)', letterSpacing: 2 }}>ACCESS MODULE ↗</div>
                <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 8, color: '#2a2826', letterSpacing: 1 }}>v1.0 · RECRUITERRR</div>
              </div>
            </div>
          </Link>

          {/* ANATHEMA CARD */}
          <Link href="/anathema" style={{ textDecoration: 'none' }}>
            <div className="intel-card-a" style={{ background: '#090d0b', border: '1px solid rgba(0,230,118,0.12)', padding: 0, cursor: 'pointer', transition: 'border-color 0.2s, box-shadow 0.2s', position: 'relative', overflow: 'hidden' }}>

              {/* Scan line */}
              <div className="scanline-a" style={{ position: 'absolute', left: 0, width: '100%', height: 2, background: 'linear-gradient(90deg, transparent, #00e676, transparent)', top: '-2px', opacity: 0, zIndex: 2 }} />

              {/* Corner decorations */}
              <div style={{ position: 'absolute', top: 0, left: 0, width: 20, height: 20, borderTop: '1px solid rgba(0,230,118,0.4)', borderLeft: '1px solid rgba(0,230,118,0.4)' }} />
              <div style={{ position: 'absolute', top: 0, right: 0, width: 20, height: 20, borderTop: '1px solid rgba(0,230,118,0.4)', borderRight: '1px solid rgba(0,230,118,0.4)' }} />
              <div style={{ position: 'absolute', bottom: 0, left: 0, width: 20, height: 20, borderBottom: '1px solid rgba(0,230,118,0.4)', borderLeft: '1px solid rgba(0,230,118,0.4)' }} />
              <div style={{ position: 'absolute', bottom: 0, right: 0, width: 20, height: 20, borderBottom: '1px solid rgba(0,230,118,0.4)', borderRight: '1px solid rgba(0,230,118,0.4)' }} />

              {/* Header bar */}
              <div style={{ padding: '10px 16px', borderBottom: '1px solid rgba(0,230,118,0.07)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <div style={{ width: 5, height: 5, background: 'var(--green)', animation: 'pulseA 2s ease-in-out infinite' }} />
                  <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 8, color: 'var(--green)', letterSpacing: 3 }}>ANATHEMA · MODULE 02</div>
                </div>
                <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 8, color: '#1a2e22', letterSpacing: 1 }}>A0-3959X.91–15</div>
              </div>

              {/* Body */}
              <div style={{ padding: '28px 28px 24px' }}>
                <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 9, color: 'rgba(0,230,118,0.2)', letterSpacing: 2, marginBottom: 14 }}>
                  ── PATHOGEN ANALYSIS SYSTEM ──
                </div>
                <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 32, color: 'var(--white)', letterSpacing: 2, lineHeight: 1, marginBottom: 14 }}>
                  NO AGENT IS<br />TRULY FREE<span style={{ color: 'var(--green)' }}>.</span>
                </div>
                <div style={{ fontSize: 12, color: '#4a6655', lineHeight: 1.7, marginBottom: 20 }}>
                  Every agent carries markers. Carrier fingerprints. Language signals. Social traces. ANATHEMA reads the pathogen and names the strain.
                </div>

                {/* Fake data readout */}
                <div style={{ borderTop: '1px solid rgba(0,230,118,0.07)', paddingTop: 14, display: 'flex', flexDirection: 'column', gap: 5 }}>
                  {['INTEGRITY · AMERILIFE · SMS', 'STAGE I → STAGE IV CLASSIFICATION', 'SPECIMEN DATABASE LEARNING'].map((item, i) => (
                    <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <div style={{ width: 4, height: 4, background: 'var(--green)', opacity: 0.3, flexShrink: 0 }} />
                      <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 8, color: 'rgba(0,230,118,0.25)', letterSpacing: 1 }}>{item}</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Footer */}
              <div style={{ padding: '10px 28px', borderTop: '1px solid rgba(0,230,118,0.07)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 9, color: 'var(--green)', letterSpacing: 2 }}>ACCESS MODULE ↗</div>
                <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 8, color: 'rgba(0,230,118,0.08)', letterSpacing: 1 }}>v1.0 · RECRUITERRR</div>
              </div>
            </div>
          </Link>

        </div>

        {/* Bottom system bar */}
        <div style={{ marginTop: 3, padding: '8px 16px', background: '#0a0908', border: '1px solid #191714', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 8, color: '#252220', letterSpacing: 2 }}>RECRUITERRR INTELLIGENCE PLATFORM · ALL SYSTEMS NOMINAL</div>
          <div style={{ display: 'flex', gap: 12 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
              <div style={{ width: 4, height: 4, background: 'var(--orange)', opacity: 0.5 }} />
              <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 8, color: '#252220', letterSpacing: 1 }}>PROMETHEUS ONLINE</div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
              <div style={{ width: 4, height: 4, background: 'var(--green)', opacity: 0.3 }} />
              <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 8, color: '#252220', letterSpacing: 1 }}>ANATHEMA ONLINE</div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section style={{ padding: '60px 40px 80px', borderTop: '1px solid var(--border)' }}>
        <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 'clamp(48px, 7vw, 88px)', letterSpacing: 2, color: 'var(--white)', lineHeight: 0.95, marginBottom: 32 }}>
          STOP COLD<br />
          CALLING<span style={{ color: 'var(--orange)' }}>.</span>
        </div>
        <Link href="/pricing" style={{ padding: '18px 48px', background: 'var(--orange)', border: 'none', color: 'var(--black)', fontFamily: "'Bebas Neue', sans-serif", fontSize: 20, letterSpacing: 3, cursor: 'pointer', textDecoration: 'none' }}>
          REQUEST ACCESS
        </Link>
      </section>

      <PageFooter />
    </div>
  )
}
