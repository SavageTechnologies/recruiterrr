'use client'

import Link from 'next/link'
import { useUser } from '@clerk/nextjs'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'
import PageNav from '@/components/layout/PageNav'
import PageFooter from '@/components/layout/PageFooter'
import XenoEgg from '@/components/ui/XenoEgg'

export default function HomePage() {
  const { isSignedIn } = useUser()
  const router = useRouter()

  useEffect(() => {
    if (isSignedIn) router.push('/dashboard')
  }, [isSignedIn, router])

  return (
    <div style={{ minHeight: '100vh', background: 'var(--black)', color: 'var(--white)' }}>
      <PageNav />

      {/* HERO */}
      <section style={{ padding: '100px 40px 60px', maxWidth: 960, position: 'relative', overflow: 'hidden' }}>
        <XenoEgg />
        <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 11, color: 'var(--orange)', letterSpacing: 3, textTransform: 'uppercase', marginBottom: 20, display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ width: 24, height: 1, background: 'var(--orange)', display: 'inline-block' }} />
          Producer Intelligence Platform
        </div>
        <h1 style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 'clamp(64px, 10vw, 120px)', lineHeight: 0.9, letterSpacing: 2, color: 'var(--white)', marginBottom: 24 }}>
          KNOW WHO<br />
          YOU'RE<br />
          <span style={{ color: 'var(--orange)' }}>CALLING.</span>
        </h1>
        <p style={{ fontSize: 18, color: 'var(--muted)', fontWeight: 300, maxWidth: 540, lineHeight: 1.7, marginBottom: 48 }}>
          Recruiterrr gives you real-time intelligence on every independent producer in any market — who they are, who they work with, and exactly how to reach them. Four tools. One platform. Built for recruiters who move fast.
        </p>
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
          <Link href="/pricing" style={{ padding: '18px 48px', background: 'var(--orange)', color: 'var(--black)', fontFamily: "'Bebas Neue', sans-serif", fontSize: 22, letterSpacing: 3, textDecoration: 'none' }}>
            REQUEST ACCESS
          </Link>
          <Link href="/about" style={{ padding: '18px 32px', background: 'transparent', border: '1px solid var(--border-light)', color: 'var(--muted)', fontFamily: "'DM Mono', monospace", fontSize: 12, letterSpacing: 2, textDecoration: 'none', display: 'flex', alignItems: 'center' }}>
            HOW IT WORKS
          </Link>
        </div>
      </section>

      {/* STATS */}
      <div style={{ display: 'flex', gap: 40, padding: '48px 40px', borderTop: '1px solid var(--border)', borderBottom: '1px solid var(--border)', flexWrap: 'wrap' }}>
        {[
          { main: '320', accent: 'K+', label: 'Producers Findable' },
          { main: '50', accent: '', label: 'States Covered' },
          { main: '4', accent: '', label: 'Intelligence Tools' },
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

      {/* TOOLS */}
      <section style={{ padding: '80px 40px', maxWidth: 900 }}>
        <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 11, color: 'var(--muted)', letterSpacing: 3, textTransform: 'uppercase', marginBottom: 12 }}>The Platform</div>
        <h2 style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 48, letterSpacing: 2, color: 'var(--white)', marginBottom: 40 }}>
          FOUR TOOLS. <span style={{ color: 'var(--orange)' }}>ONE EDGE.</span>
        </h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 2 }}>
          {[
            {
              name: 'Agent Search',
              tag: 'LIVE',
              tagColor: 'var(--green)',
              accent: 'var(--orange)',
              body: 'Real-time intelligence on every independent producer in any US market. Reviews, carriers, hiring signals, YouTube presence — scored and ranked.',
              href: '/about',
            },
            {
              name: 'PROMETHEUS',
              tag: 'LIVE',
              tagColor: 'var(--green)',
              accent: 'var(--orange)',
              body: 'FMO & IMO competitive intelligence. Scan any upline in under 60 seconds — carriers, incentive trips, weak points, and a custom counter-pitch.',
              href: '/prometheus',
            },
            {
              name: 'ANATHEMA',
              tag: 'LIVE',
              tagColor: 'var(--green)',
              accent: '#00e676',
              body: 'Distribution tree prediction. Know who a producer truly belongs to — Integrity, AmeriLife, SMS, or unaffiliated — before you ever make contact.',
              href: '/anathema',
            },
            {
              name: 'DAVID',
              tag: 'LIVE',
              tagColor: 'var(--green)',
              accent: '#a78bfa',
              body: 'Agentic recruiting outreach. Structures everything we know about a producer into a payload your AI writer, CRM, or sequencer can actually use.',
              href: '/david',
            },
          ].map(tool => (
            <Link key={tool.name} href={tool.href} style={{ textDecoration: 'none' }}>
              <div style={{ background: 'var(--card)', border: '1px solid var(--border)', borderTop: `3px solid ${tool.accent}`, padding: '32px 28px', height: '100%', boxSizing: 'border-box', cursor: 'pointer' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
                  <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 24, letterSpacing: 2, color: 'var(--white)' }}>{tool.name}</div>
                  <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 9, color: tool.tagColor, border: `1px solid ${tool.tagColor}`, padding: '3px 8px', letterSpacing: 2 }}>{tool.tag}</div>
                </div>
                <div style={{ fontSize: 14, color: 'var(--muted)', lineHeight: 1.7 }}>{tool.body}</div>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section style={{ padding: '0 40px 80px', maxWidth: 900 }}>
        <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 11, color: 'var(--muted)', letterSpacing: 3, textTransform: 'uppercase', marginBottom: 40 }}>How It Works</div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 2 }}>
          {[
            { n: '01', title: 'Search Any Market', body: 'Enter a city and state. We pull every independent producer in that area and run the full intelligence pipeline in real time.' },
            { n: '02', title: 'We Do The Research', body: 'Websites crawled, job boards checked, YouTube scanned, carrier appointments identified, distribution trees predicted.' },
            { n: '03', title: 'You Walk In Prepared', body: 'Every producer scored and ranked. Know who to call, what they care about, and exactly how to open the conversation.' },
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
            { role: 'FMO & IMO Recruiters', desc: "You're building a downline. Stop buying cold lists. Every search gives you a ranked shortlist of producers who are actually recruitable — and the intelligence to open the conversation right." },
            { role: 'Regional & Field Managers', desc: "You know your territory but not every producer in it. Run a market scan in under 2 minutes and walk into your next call knowing more than they expect." },
            { role: 'Carrier & Wholesaler Reps', desc: "Find independent producers in new markets who don't carry your products yet. Warm intelligence, not cold calls." },
            { role: 'Agency Builders', desc: "Looking to bring on producers or expand your team? Find established agents with strong reviews, real books of business, and independent setups." },
          ].map(w => (
            <div key={w.role} style={{ background: 'var(--card)', border: '1px solid var(--border)', padding: '28px 24px' }}>
              <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 10, color: 'var(--orange)', letterSpacing: 2, textTransform: 'uppercase', marginBottom: 10 }}>{w.role}</div>
              <div style={{ fontSize: 14, color: 'var(--muted)', lineHeight: 1.7 }}>{w.desc}</div>
            </div>
          ))}
        </div>
      </section>

      {/* WALL QUOTE */}
      <section style={{ padding: '0 40px 80px', maxWidth: 900 }}>
        <div style={{ background: 'var(--card)', border: '1px solid var(--border)', borderLeft: '3px solid var(--orange)', padding: '40px 40px' }}>
          <div style={{ fontSize: 17, color: 'var(--white)', lineHeight: 1.8, fontStyle: 'italic', marginBottom: 24 }}>
            "What I really like about Recruiterrr is that it immediately became an accelerator in our onboarding process. Aaron solved a problem that was right under a lot of people's nose."
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ width: 2, height: 32, background: 'var(--orange)', flexShrink: 0 }} />
            <div>
              <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 12, color: 'var(--white)', letterSpacing: 1 }}>Drew Gurley</div>
              <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 10, color: 'var(--muted)', letterSpacing: 1, marginTop: 2 }}>Senior Market Advisors</div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section style={{ padding: '60px 40px 80px', borderTop: '1px solid var(--border)' }}>
        <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 'clamp(48px, 7vw, 88px)', letterSpacing: 2, color: 'var(--white)', lineHeight: 0.95, marginBottom: 24 }}>
          STOP RECRUITING<br />
          <span style={{ color: 'var(--orange)' }}>BLIND.</span>
        </div>
        <p style={{ fontSize: 15, color: 'var(--muted)', maxWidth: 440, lineHeight: 1.7, marginBottom: 40 }}>
          The intelligence exists. We built the system that reads it.
        </p>
        <Link href="/pricing" style={{ padding: '18px 48px', background: 'var(--orange)', color: 'var(--black)', fontFamily: "'Bebas Neue', sans-serif", fontSize: 20, letterSpacing: 3, textDecoration: 'none' }}>
          REQUEST ACCESS
        </Link>
      </section>

      <PageFooter />
    </div>
  )
}
