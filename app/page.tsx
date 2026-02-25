'use client'

import Link from 'next/link'
import { SignInButton, SignUpButton, useUser } from '@clerk/nextjs'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'
import PageFooter from '@/components/PageFooter'

export default function HomePage() {
  const { isSignedIn } = useUser()
  const router = useRouter()

  useEffect(() => {
    if (isSignedIn) router.push('/dashboard')
  }, [isSignedIn, router])

  return (
    <div style={{ minHeight: '100vh', background: 'var(--black)' }}>
      {/* NAV */}
      <nav style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '20px 40px', borderBottom: '1px solid var(--border)', position: 'sticky', top: 0, background: 'var(--black)', zIndex: 100 }}>
        <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 28, letterSpacing: 3, color: 'var(--white)' }}>
          RECRUITERRR<span style={{ color: 'var(--orange)' }}>.</span>
        </div>
        <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
          <SignInButton mode="modal">
            <button style={{ padding: '10px 24px', background: 'transparent', border: '1px solid var(--border-light)', color: 'var(--muted)', fontFamily: "'DM Mono', monospace", fontSize: 12, letterSpacing: 2, cursor: 'pointer', textTransform: 'uppercase' }}>
              Sign In
            </button>
          </SignInButton>
          <SignUpButton mode="modal">
            <button style={{ padding: '10px 24px', background: 'var(--orange)', border: 'none', color: 'var(--black)', fontFamily: "'Bebas Neue', sans-serif", fontSize: 16, letterSpacing: 2, cursor: 'pointer' }}>
              Start Free Trial
            </button>
          </SignUpButton>
        </div>
      </nav>

      {/* HERO */}
      <section style={{ padding: '100px 40px 60px', maxWidth: 960 }}>
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
          <SignUpButton mode="modal">
            <button style={{ padding: '18px 48px', background: 'var(--orange)', border: 'none', color: 'var(--black)', fontFamily: "'Bebas Neue', sans-serif", fontSize: 22, letterSpacing: 3, cursor: 'pointer' }}>
              START FREE — NO CARD NEEDED
            </button>
          </SignUpButton>
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
            { icon: '🔍', title: 'Google Presence', body: 'Reviews, ratings, business type, and years in operation pulled from Google local listings.' },
            { icon: '🌐', title: 'Website Crawl', body: 'We visit their site and identify carrier logos, independent signals, and product focus areas.' },
            { icon: '💼', title: 'Job Postings', body: 'Actively hiring insurance agents? Growing agencies with budget are prime recruiting targets.' },
            { icon: '🎬', title: 'YouTube Presence', body: 'Content creators with Medicare or senior insurance channels are tech-forward independents.' },
            { icon: '🏢', title: 'Carrier Mix', body: 'Multi-carrier agents are far more recruitable than single-carrier captives. We tell the difference.' },
            { icon: '🔥', title: 'HOT / WARM / COLD', body: 'Every agent gets a 0-100 recruitability score. Stop guessing who to call.' },
          ].map(s => (
            <div key={s.title} style={{ background: 'var(--card)', border: '1px solid var(--border)', padding: '28px 24px' }}>
              <div style={{ fontSize: 28, marginBottom: 12 }}>{s.icon}</div>
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

      {/* CTA */}
      <section style={{ padding: '60px 40px 80px', borderTop: '1px solid var(--border)' }}>
        <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 'clamp(48px, 7vw, 88px)', letterSpacing: 2, color: 'var(--white)', lineHeight: 0.95, marginBottom: 32 }}>
          STOP COLD<br />
          CALLING<span style={{ color: 'var(--orange)' }}>.</span>
        </div>
        <SignUpButton mode="modal">
          <button style={{ padding: '18px 48px', background: 'var(--orange)', border: 'none', color: 'var(--black)', fontFamily: "'Bebas Neue', sans-serif", fontSize: 20, letterSpacing: 3, cursor: 'pointer' }}>
            START YOUR FREE TRIAL
          </button>
        </SignUpButton>
      </section>

      <PageFooter />
    </div>
  )
}
