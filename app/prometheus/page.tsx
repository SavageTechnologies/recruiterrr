'use client'

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
          KNOW.<br />
          <span style={{ color: 'var(--orange)' }}>BEFORE.</span><br />
          YOU DIAL.
        </h1>
        <p style={{ fontSize: 18, color: 'var(--muted)', fontWeight: 300, maxWidth: 520, lineHeight: 1.6, marginBottom: 48 }}>
          PROMETHEUS scans any lead vendor domain and scores its TCPA compliance — so you have documented due diligence before the first call goes out.
        </p>
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
          <Link href="/dashboard/prometheus" style={{ padding: '18px 48px', background: 'var(--orange)', border: 'none', color: 'var(--black)', fontFamily: "'Bebas Neue', sans-serif", fontSize: 22, letterSpacing: 3, cursor: 'pointer', textDecoration: 'none' }}>
            SCAN A DOMAIN FREE
          </Link>
          <Link href="/sign-up" style={{ padding: '18px 32px', background: 'transparent', border: '1px solid var(--border-light)', color: 'var(--muted)', fontFamily: "'DM Mono', monospace", fontSize: 12, letterSpacing: 2, cursor: 'pointer', textDecoration: 'none', display: 'flex', alignItems: 'center' }}>
            CREATE ACCOUNT
          </Link>
        </div>
      </section>

      {/* STATS */}
      <div style={{ display: 'flex', gap: 40, padding: '48px 40px', borderTop: '1px solid var(--border)', borderBottom: '1px solid var(--border)', flexWrap: 'wrap' }}>
        {[
          { main: '7', accent: '', label: 'TCPA Signals Checked' },
          { main: '< 30', accent: 's', label: 'Full Domain Scan' },
          { main: '2024', accent: '', label: 'FCC Ruling Covered' },
          { main: '100', accent: '%', label: 'AI-Powered Analysis' },
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
          ONE BAD VENDOR. <span style={{ color: 'var(--orange)' }}>ONE LAWSUIT.</span>
        </h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 2 }}>
          {[
            { icon: '⚠', title: '$500–$1,500 Per Call', body: 'TCPA violations are strict liability. Every unconsented call is a separate violation. One bad lead list can cost tens of thousands.' },
            { icon: '⚠', title: 'Most Vendors Are Exposed', body: 'The majority of lead generation websites have incomplete or legally invalid opt-in language — and they have no idea.' },
            { icon: '⚠', title: '2024 FCC Ruling Changed Everything', body: 'The new one-to-one consent rule killed shared lead forms. If your vendor lists multiple buyers, that consent is worthless.' },
            { icon: '⚠', title: 'Due Diligence Is Your Defense', body: "Courts look at whether you took reasonable steps to vet vendors. A PROMETHEUS report is evidence that you did your homework." },
          ].map(s => (
            <div key={s.title} style={{ background: 'var(--card)', border: '1px solid var(--border)', padding: '28px 24px' }}>
              <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 18, color: 'var(--orange)', marginBottom: 14 }}>{s.icon}</div>
              <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 15, fontWeight: 600, marginBottom: 8, color: 'var(--white)' }}>{s.title}</div>
              <div style={{ fontSize: 13, color: 'var(--muted)', lineHeight: 1.6 }}>{s.body}</div>
            </div>
          ))}
        </div>
      </section>

      {/* 7 SIGNALS */}
      <section style={{ padding: '0 40px 80px', maxWidth: 900 }}>
        <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 11, color: 'var(--muted)', letterSpacing: 3, textTransform: 'uppercase', marginBottom: 12 }}>What We Check</div>
        <h2 style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 48, letterSpacing: 2, color: 'var(--white)', marginBottom: 40 }}>
          7 SIGNALS. ONE <span style={{ color: 'var(--orange)' }}>SCORE.</span>
        </h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 2 }}>
          {[
            { icon: '01', title: 'Prior Express Written Consent', body: 'The #1 legal requirement. We check for PEWC language, consent checkboxes, and explicit agreement copy near the submit button.' },
            { icon: '02', title: 'Seller Identification', body: "The consent must name who will be calling. 'A licensed agent may contact you' does not hold up in court." },
            { icon: '03', title: 'Contact Method Disclosure', body: 'Calls, texts, autodialers, prerecorded messages — the method must be explicitly stated in the consent.' },
            { icon: '04', title: 'Disclaimer Placement', body: "Clear and conspicuous means near the button, above the fold, visible — not buried in a footer nobody reads." },
            { icon: '05', title: 'Privacy Policy', body: 'Must exist, must be accessible, and must specifically address how telephone contact information is used and shared.' },
            { icon: '06', title: 'Shared Lead Detection', body: "Multi-buyer forms are invalid under the 2024 FCC ruling. We flag vendors listing multiple 'marketing partners.'" },
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
            { n: '01', title: 'Submit Any Domain', body: 'Enter a lead vendor URL or your own website. We handle the rest — no install, no integration, no code.' },
            { n: '02', title: 'We Scan Everything', body: 'Homepage, privacy policy, lead forms, and SERP intelligence — complaint databases, lawsuit records, BBB data.' },
            { n: '03', title: 'Get Your Report', body: 'A scored compliance report with findings, recommendations, and ready-to-use TCPA language you can send to your vendor today.' },
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
            Prometheus means <em style={{ color: 'var(--white)' }}>"forethought"</em> — acting with intelligence before the consequences arrive. The compliance knowledge that only corporate legal teams had access to now lives in a tool every independent agent can use. That is the fire. That is your protection.
          </p>
        </div>
      </section>

      {/* WHO IT'S FOR */}
      <section style={{ padding: '0 40px 80px', maxWidth: 900 }}>
        <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 11, color: 'var(--muted)', letterSpacing: 3, textTransform: 'uppercase', marginBottom: 40 }}>Who It's For</div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 2 }}>
          {[
            { label: 'Independent Agents', body: 'You buy leads from vendors and need to know if you are legally protected before you start dialing.' },
            { label: 'Team Leaders & Downlines', body: 'Vet the vendors your team is using. One lawsuit can affect your entire operation.' },
            { label: 'IMOs & FMOs', body: "Protect the agents in your network. Know which vendors you can recommend and which you can't." },
            { label: 'Anyone Running Their Own Lead Gen', body: "Check your own opt-in forms before you go live. Find the gaps before a plaintiff's attorney does." },
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
            READY TO <span style={{ color: 'var(--orange)' }}>SCAN?</span>
          </div>
          <p style={{ fontSize: 16, color: 'var(--muted)', marginBottom: 40, maxWidth: 480 }}>
            Available inside your Recruiterrr dashboard. No extra setup. No credit card. Scan your first domain in under 30 seconds.
          </p>
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
            <Link href="/dashboard/prometheus" style={{ padding: '18px 48px', background: 'var(--orange)', border: 'none', color: 'var(--black)', fontFamily: "'Bebas Neue', sans-serif", fontSize: 22, letterSpacing: 3, cursor: 'pointer', textDecoration: 'none' }}>
              SCAN YOUR FIRST DOMAIN
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
