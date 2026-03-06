'use client'

import Link from 'next/link'
import { useUser } from '@clerk/nextjs'
import { useRouter } from 'next/navigation'
import { useEffect, useRef } from 'react'

// ─── DATA ─────────────────────────────────────────────────────────────────────

const PREVIEW_AGENTS = [
  { initials: 'KM', name: 'Kellerman & Associates',    meta: '4.9 ★  ·  214 reviews  ·  Independent', score: 92, flag: 'HOT'  as const },
  { initials: 'SR', name: 'Sarah Reyes Insurance',     meta: '4.7 ★  ·  87 reviews  ·  YouTube ▸',   score: 84, flag: 'HOT'  as const },
  { initials: 'TP', name: 'Trident Benefits Group',    meta: '4.5 ★  ·  41 reviews  ·  Hiring',       score: 68, flag: 'WARM' as const },
  { initials: 'BF', name: 'Banner Financial Services', meta: '3.8 ★  ·  12 reviews',                  score: 31, flag: 'COLD' as const, dim: true },
]

const STATS = [
  { num: '320', accent: 'K+', label: 'Producers Findable' },
  { num: '50',  accent: '',   label: 'States Covered'     },
  { num: '4',   accent: '',   label: 'Intelligence Tools'  },
  { num: '< 90',accent: 's', label: 'Full Market Scan'    },
]

const TOOLS = [
  {
    name: 'Agent Search', href: '/about',
    body: 'Real-time intelligence on every independent producer in any US market. Reviews, carriers, hiring signals, YouTube presence — scored and ranked so you know who to call first.',
    accent: 'var(--site-orange)',
  },
  {
    name: 'Prometheus', href: '/prometheus',
    body: 'FMO & IMO competitive intelligence. Scan any upline in under 60 seconds — carriers, incentive trips, weak points, and a custom counter-pitch ready to use on the call.',
    accent: 'var(--site-orange)',
  },
  {
    name: 'Anathema', href: '/anathema',
    body: 'Distribution tree intelligence. Know which FMO a producer truly belongs to — Integrity, AmeriLife, SMS, or independent — and how deep the relationship runs, before you ever make contact.',
    accent: 'var(--site-green)',
  },
  {
    name: 'David', href: '/david',
    body: 'Personal intelligence for recruiting outreach. Structures everything we know about a producer — family, hobbies, recent content — into an opener your AI writer or sequencer can actually use.',
    accent: 'var(--site-purple)',
  },
]

const STEPS = [
  { n: '01', title: 'Search Any Market',    connector: true,  body: 'Enter a city and state. We pull every independent producer in that area and run the full intelligence pipeline in real time — no lists, no databases, no stale data.' },
  { n: '02', title: 'We Do the Research',   connector: true,  body: 'Websites crawled, job boards checked, YouTube scanned, carrier appointments identified, distribution trees predicted. Forty signals synthesized per producer.' },
  { n: '03', title: 'You Walk In Prepared', connector: false, body: 'Every producer scored HOT, WARM, or COLD. Know who to call, what they care about, who they work with, and exactly how to open the conversation.' },
]

const FOR_WHOM = [
  { role: 'FMO & IMO Recruiters',       body: "Stop buying cold lists. Every search gives you a ranked shortlist of producers who are actually recruitable — with the intelligence to open the conversation right the first time." },
  { role: 'Regional & Field Managers',  body: "You know your territory but not every producer in it. Run a market scan in under two minutes and walk into your next call knowing more than they expect." },
  { role: 'Carrier & Wholesaler Reps',  body: "Find independent producers in new markets who don't carry your products yet. Warm intelligence, not cold calls. Know the carriers before you pitch the contract." },
  { role: 'Agency Builders',            body: "Looking to bring on producers or expand your team? Find established agents with strong reviews, real books of business, and the kind of independence that makes them recruitable." },
]

// ─── PAGE ─────────────────────────────────────────────────────────────────────

export default function HomePage() {
  const { isSignedIn } = useUser()
  const router = useRouter()
  const fadeRefs = useRef<HTMLElement[]>([])

  useEffect(() => {
    if (isSignedIn) router.push('/dashboard')
  }, [isSignedIn, router])

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => entries.forEach(el => {
        if (el.isIntersecting) { el.target.classList.add('visible'); observer.unobserve(el.target) }
      }),
      { threshold: 0.12, rootMargin: '0px 0px -40px 0px' }
    )
    fadeRefs.current.forEach(el => el && observer.observe(el))
    return () => observer.disconnect()
  }, [])

  const fade = (el: HTMLElement | null) => {
    if (el && !fadeRefs.current.includes(el)) fadeRefs.current.push(el)
  }

  return (
    <>
      {/* ── HERO ──────────────────────────────────────────────────────────── */}
      <div className="site-inner">
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 420px', gap: 80, alignItems: 'center', padding: '100px 0 80px' }}>

          {/* Copy */}
          <div>
            <div className="site-eyebrow-orange">Producer Intelligence Platform</div>
            <h1 className="site-h1">
              RECRUIT ON<br />
              INTELLIGENCE,<br />
              <span>NOT INSTINCT.</span>
            </h1>
            <p className="site-lead" style={{ maxWidth: 500, marginBottom: 48 }}>
              Real-time data on every independent producer in any market — who they are,
              who they work with, and exactly how to reach them. Four tools. One platform.
              Built for recruiters who move fast.
            </p>
            <div style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
              <Link href="/pricing" className="site-btn-primary">Request Access</Link>
              <Link href="/about"   className="site-btn-ghost">How It Works →</Link>
            </div>
          </div>

          {/* Live preview card */}
          <div className="site-card-float" style={{
            background: 'var(--site-white)',
            border: '1px solid var(--site-border)',
            borderRadius: 'var(--radius-md)',
            boxShadow: 'var(--site-shadow-lg)',
            overflow: 'hidden',
          }}>
            <div style={{ padding: '14px 20px', background: 'var(--site-paper-2)', borderBottom: '1px solid var(--site-border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 9, letterSpacing: 2, textTransform: 'uppercase', color: 'var(--site-ink-3)' }}>Austin, TX · Medicare</span>
              <div className="site-live-badge"><div className="site-live-dot" />LIVE</div>
            </div>

            <div style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 6 }}>
              {PREVIEW_AGENTS.map(a => (
                <div key={a.name} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px', borderRadius: 6, border: '1px solid var(--site-border)', background: 'var(--site-white)', opacity: a.dim ? 0.45 : 1 }}>
                  <div style={{ width: 30, height: 30, borderRadius: '50%', background: 'var(--site-paper-2)', border: '1px solid var(--site-border)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: "'DM Mono', monospace", fontSize: 9, color: 'var(--site-ink-3)', flexShrink: 0 }}>
                    {a.initials}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 12, fontWeight: 500, color: 'var(--site-ink)', marginBottom: 2, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{a.name}</div>
                    <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 9, color: 'var(--site-ink-4)' }}>{a.meta}</div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 5, flexShrink: 0 }}>
                    <div className="site-score-bar">
                      <div className="site-score-fill" style={{ width: `${a.score}%`, background: a.dim ? 'var(--site-ink-5)' : 'var(--site-orange)' }} />
                    </div>
                    <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 9, color: a.dim ? 'var(--site-ink-5)' : 'var(--site-ink-3)', width: 20, textAlign: 'right' }}>{a.score}</span>
                  </div>
                  <span className={`site-flag site-flag-${a.flag.toLowerCase()}`}>{a.flag}</span>
                </div>
              ))}
            </div>

            <div style={{ padding: '10px 20px', background: 'var(--site-paper-2)', borderTop: '1px solid var(--site-border)', display: 'flex', justifyContent: 'space-between' }}>
              {[['28', 'agents found'], ['11 HOT', '· 9 WARM'], ['47s', 'to complete']].map(([val, label]) => (
                <div key={label} style={{ fontFamily: "'DM Mono', monospace", fontSize: 9, color: 'var(--site-ink-4)' }}>
                  <strong style={{ color: 'var(--site-ink-2)', fontWeight: 500 }}>{val}</strong> {label}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ── STATS ─────────────────────────────────────────────────────────── */}
      <div className="site-stats-band">
        <div className="site-inner">
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)' }}>
            {STATS.map(s => (
              <div key={s.label} className="site-stat-item">
                <div className="site-stat-num">{s.num}<span>{s.accent}</span></div>
                <div className="site-stat-label">{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── TOOLS ─────────────────────────────────────────────────────────── */}
      <section className="site-section site-section-paper site-section-divider">
        <div className="site-inner">
          <div ref={fade} className="site-fade-up"><div className="site-eyebrow">The Platform</div></div>
          <div ref={fade} className="site-fade-up"><h2 className="site-h2">FOUR TOOLS. <span>ONE EDGE.</span></h2></div>
          <div ref={fade} className="site-fade-up site-grid-bordered" style={{ gridTemplateColumns: 'repeat(2, 1fr)' }}>
            {TOOLS.map(tool => (
              <Link key={tool.name} href={tool.href} className="site-tool-card" style={{ '--tool-accent': tool.accent } as React.CSSProperties}>
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 16 }}>
                  <h3 className="site-h3">{tool.name}</h3>
                  <span className="site-tool-tag">LIVE</span>
                </div>
                <p className="site-body">{tool.body}</p>
                <div className="site-tool-link" style={{ color: tool.accent }}>Learn more <span>→</span></div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ── HOW IT WORKS ──────────────────────────────────────────────────── */}
      <section className="site-section site-section-white site-section-divider">
        <div className="site-inner">
          <div ref={fade} className="site-fade-up"><div className="site-eyebrow">How It Works</div></div>
          <div ref={fade} className="site-fade-up"><h2 className="site-h2">THREE STEPS TO <span>PREPARED.</span></h2></div>
          <div ref={fade} className="site-fade-up site-grid-bordered" style={{ gridTemplateColumns: 'repeat(3, 1fr)' }}>
            {STEPS.map(step => (
              <div key={step.n} className="site-step-card">
                <div className="site-step-num">{step.n}</div>
                <div className="site-step-title">{step.title}</div>
                <p className="site-body">{step.body}</p>
                {step.connector && <div className="site-step-connector">→</div>}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── WHO IT'S FOR ──────────────────────────────────────────────────── */}
      <section className="site-section site-section-paper-2 site-section-divider">
        <div className="site-inner">
          <div ref={fade} className="site-fade-up"><div className="site-eyebrow">Who It's For</div></div>
          <div ref={fade} className="site-fade-up"><h2 className="site-h2">BUILT FOR <span>OPERATORS.</span></h2></div>
          <div ref={fade} className="site-fade-up" style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 16 }}>
            {FOR_WHOM.map(w => (
              <div key={w.role} className="site-card" style={{ padding: '32px 28px' }}>
                <div className="site-label" style={{ marginBottom: 12 }}>{w.role}</div>
                <p className="site-body">{w.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ───────────────────────────────────────────────────────────── */}
      <section className="site-section site-section-paper site-section-divider">
        <div className="site-inner">
          <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: 80, alignItems: 'center' }}>
            <div ref={fade} className="site-fade-up">
              <div className="site-eyebrow">Get Started</div>
              <h2 className="site-h2" style={{ marginBottom: 20 }}>STOP RECRUITING<br /><span>BLIND.</span></h2>
              <p className="site-lead">The intelligence exists. We built the system that reads it.</p>
            </div>
            <div ref={fade} className="site-fade-up" style={{ display: 'flex', flexDirection: 'column', gap: 12, alignItems: 'flex-end', flexShrink: 0 }}>
              <Link href="/sign-up" className="site-btn-primary" style={{ fontSize: 20, padding: '18px 52px', boxShadow: '0 4px 24px rgba(232,77,28,0.28)' }}>
                Request Access
              </Link>
              <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 9, letterSpacing: 1.5, color: 'var(--site-ink-4)', textTransform: 'uppercase' }}>
                No contract · Cancel anytime
              </span>
            </div>
          </div>
        </div>
      </section>
    </>
  )
}
