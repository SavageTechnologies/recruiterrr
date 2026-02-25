'use client'

import Link from 'next/link'
import PageNav from '@/components/PageNav'
import PageFooter from '@/components/PageFooter'

export default function PrometheusLandingPage() {
  return (
    <div style={{ minHeight: '100vh', background: 'var(--black)' }}>
      <PageNav />

      {/* HERO */}
      <section style={{ padding: '100px 40px 60px', maxWidth: 1000, position: 'relative', overflow: 'hidden' }}>
        {/* Background grid effect */}
        <div style={{
          position: 'absolute', top: 0, right: -200, width: 600, height: 600,
          background: 'radial-gradient(circle at center, rgba(0,229,255,0.04) 0%, transparent 70%)',
          pointerEvents: 'none',
        }} />

        <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 11, color: '#00e5ff', letterSpacing: 3, textTransform: 'uppercase', marginBottom: 20, display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ width: 24, height: 1, background: '#00e5ff', display: 'inline-block' }} />
          A Recruiterrr Intelligence Tool
        </div>

        <h1 style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 'clamp(72px, 11vw, 130px)', lineHeight: 0.88, letterSpacing: 2, color: 'var(--white)', marginBottom: 24 }}>
          KNOW<br />
          BEFORE<br />
          <span style={{ color: '#00e5ff' }}>YOU DIAL.</span>
        </h1>

        <p style={{ fontSize: 19, color: 'var(--muted)', fontWeight: 300, maxWidth: 560, lineHeight: 1.6, marginBottom: 48 }}>
          PROMETHEUS scans any lead vendor domain and scores its TCPA compliance — so you have documented due diligence before the first call goes out.
        </p>

        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
          <Link href="/dashboard/prometheus" style={{
            padding: '18px 48px', background: '#00e5ff', border: 'none',
            color: '#0d0d0b', fontFamily: "'Bebas Neue', sans-serif",
            fontSize: 22, letterSpacing: 3, cursor: 'pointer', textDecoration: 'none',
          }}>
            SCAN A DOMAIN
          </Link>
          <Link href="/sign-up" style={{
            padding: '18px 32px', background: 'transparent',
            border: '1px solid var(--border-light)', color: 'var(--muted)',
            fontFamily: "'DM Mono', monospace", fontSize: 12,
            letterSpacing: 2, cursor: 'pointer', textDecoration: 'none',
            display: 'flex', alignItems: 'center',
          }}>
            CREATE FREE ACCOUNT
          </Link>
        </div>
      </section>

      {/* STATS */}
      <div style={{ display: 'flex', gap: 0, borderTop: '1px solid var(--border)', borderBottom: '1px solid var(--border)' }}>
        {[
          { main: '7', accent: '', label: 'TCPA Signals Checked' },
          { main: '< 30', accent: 's', label: 'Full Domain Scan' },
          { main: '2024', accent: '', label: 'FCC Ruling Covered' },
          { main: '100', accent: '%', label: 'AI-Powered Analysis' },
        ].map((s, i) => (
          <div key={s.label} style={{ flex: 1, padding: '40px 32px', borderRight: i < 3 ? '1px solid var(--border)' : 'none' }}>
            <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 44, color: 'var(--white)', letterSpacing: 1 }}>
              {s.main}<span style={{ color: '#00e5ff' }}>{s.accent}</span>
            </div>
            <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 10, color: 'var(--muted)', letterSpacing: 2, textTransform: 'uppercase' }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* WHAT IT IS */}
      <section style={{ padding: '80px 40px', maxWidth: 960 }}>
        <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 11, color: 'var(--muted)', letterSpacing: 3, textTransform: 'uppercase', marginBottom: 12 }}>The Problem</div>
        <h2 style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 52, letterSpacing: 2, color: 'var(--white)', marginBottom: 24 }}>
          ONE BAD VENDOR.<br /><span style={{ color: '#00e5ff' }}>ONE LAWSUIT.</span>
        </h2>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 40 }}>
          <p style={{ fontSize: 15, color: 'var(--muted)', lineHeight: 1.8 }}>
            TCPA violations can cost <strong style={{ color: 'var(--white)' }}>$500–$1,500 per call</strong>. Most independent agents have no idea their lead vendor's opt-in forms are legally worthless — until they get a demand letter.
          </p>
          <p style={{ fontSize: 15, color: 'var(--muted)', lineHeight: 1.8 }}>
            PROMETHEUS gives you the same compliance intelligence that big carriers pay attorneys thousands for — in under 30 seconds, on any domain. That's forethought. That's your defense.
          </p>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section style={{ padding: '0 40px 80px', maxWidth: 960 }}>
        <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 11, color: 'var(--muted)', letterSpacing: 3, textTransform: 'uppercase', marginBottom: 12 }}>How It Works</div>
        <h2 style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 52, letterSpacing: 2, color: 'var(--white)', marginBottom: 40 }}>
          3 STEPS. <span style={{ color: '#00e5ff' }}>ONE REPORT.</span>
        </h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 2 }}>
          {[
            { n: '01', title: 'Submit Domain', body: 'Enter any lead vendor URL or your own website. No login required for the first scan.' },
            { n: '02', title: 'We Scan Everything', body: 'We crawl the homepage, privacy policy, lead forms, and cross-reference complaint databases and lawsuit records.' },
            { n: '03', title: 'Get Your Report', body: 'A scored compliance report with specific findings, recommendations, and ready-to-use TCPA language drops instantly.' },
          ].map(s => (
            <div key={s.n} style={{ background: 'var(--card)', border: '1px solid var(--border)', padding: '32px 28px' }}>
              <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 11, color: '#00e5ff', letterSpacing: 2, marginBottom: 16 }}>{s.n}</div>
              <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 16, fontWeight: 600, marginBottom: 10, color: 'var(--white)' }}>{s.title}</div>
              <div style={{ fontSize: 14, color: 'var(--muted)', lineHeight: 1.6 }}>{s.body}</div>
            </div>
          ))}
        </div>
      </section>

      {/* 7 CHECKS */}
      <section style={{ padding: '0 40px 80px', maxWidth: 960 }}>
        <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 11, color: 'var(--muted)', letterSpacing: 3, textTransform: 'uppercase', marginBottom: 12 }}>The Intelligence</div>
        <h2 style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 52, letterSpacing: 2, color: 'var(--white)', marginBottom: 40 }}>
          7 SIGNALS. <span style={{ color: '#00e5ff' }}>ONE SCORE.</span>
        </h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 2 }}>
          {[
            { n: '01', title: 'PEWC Language', body: 'Prior express written consent — the #1 legal requirement and most common failure point.' },
            { n: '02', title: 'Seller ID', body: 'Is the caller actually named in the consent? Vague language won\'t hold up in court.' },
            { n: '03', title: 'Contact Method', body: 'Calls, texts, autodialers — what\'s disclosed? What isn\'t?' },
            { n: '04', title: 'Disclaimer Placement', body: 'Is it visible near the submit button or buried where no consumer would see it?' },
            { n: '05', title: 'Privacy Policy', body: 'Exists, is accessible, and addresses telephone contact and data sharing.' },
            { n: '06', title: 'Shared Lead Flag', body: 'Multi-buyer consent is legally invalid under the FCC\'s 2024 one-to-one consent ruling.' },
            { n: '07', title: 'Opt-Out Language', body: 'Clear STOP instructions are required on every outbound contact.' },
            { n: '08', title: 'SERP Intelligence', body: 'We hunt for complaints, lawsuits, and BBB issues so you see the full picture.' },
          ].map(c => (
            <div key={c.n} style={{ background: 'var(--card)', border: '1px solid var(--border)', padding: '24px 20px' }}>
              <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 11, color: '#00e5ff', letterSpacing: 2, marginBottom: 12 }}>{c.n}</div>
              <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--white)', marginBottom: 6 }}>{c.title}</div>
              <div style={{ fontSize: 12, color: 'var(--muted)', lineHeight: 1.6 }}>{c.body}</div>
            </div>
          ))}
        </div>
      </section>

      {/* MYTHOLOGY CALLOUT */}
      <section style={{ margin: '0 40px 80px', background: 'var(--card)', border: '1px solid var(--border)', padding: '48px 40px', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', top: -60, right: -60, width: 300, height: 300, background: 'radial-gradient(circle, rgba(0,229,255,0.05) 0%, transparent 70%)', pointerEvents: 'none' }} />
        <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 11, color: '#00e5ff', letterSpacing: 3, textTransform: 'uppercase', marginBottom: 16 }}>Why Prometheus</div>
        <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 38, color: 'var(--white)', letterSpacing: 2, marginBottom: 16, maxWidth: 700 }}>
          HE STOLE FIRE FROM THE GODS AND GAVE IT TO HUMANITY.
        </div>
        <p style={{ fontSize: 15, color: 'var(--muted)', maxWidth: 600, lineHeight: 1.8 }}>
          Prometheus means <em style={{ color: 'var(--white)' }}>"forethought"</em> — acting with intelligence before the consequences arrive. We took the compliance knowledge that only corporate legal teams had access to, and gave it to every independent agent. That's the fire. That's your protection.
        </p>
      </section>

      {/* CTA */}
      <section style={{ padding: '0 40px 100px', textAlign: 'center' }}>
        <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 'clamp(48px, 6vw, 72px)', letterSpacing: 2, color: 'var(--white)', marginBottom: 16 }}>
          READY TO SCAN<span style={{ color: '#00e5ff' }}>?</span>
        </div>
        <p style={{ fontSize: 15, color: 'var(--muted)', marginBottom: 40 }}>Available inside your Recruiterrr dashboard. No extra setup required.</p>
        <Link href="/dashboard/prometheus" style={{
          padding: '20px 64px', background: '#00e5ff', border: 'none',
          color: '#0d0d0b', fontFamily: "'Bebas Neue', sans-serif",
          fontSize: 24, letterSpacing: 3, cursor: 'pointer', textDecoration: 'none', display: 'inline-block',
        }}>
          SCAN YOUR FIRST DOMAIN
        </Link>
      </section>

      <PageFooter />
    </div>
  )
}
