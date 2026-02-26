import Link from 'next/link'
import PageNav from '@/components/PageNav'
import PageFooter from '@/components/PageFooter'

const PRINCIPLES = [
  {
    n: '01',
    title: 'Data Exists. Connections Don\'t.',
    body: 'Every person, business, and organization leaves a trail across dozens of public systems. The data is there. What\'s missing is the logic that connects it — the inference layer that turns scattered signals into a single, confident conclusion.',
  },
  {
    n: '02',
    title: 'Clusters Over Records.',
    body: 'We don\'t look at data points. We look at clusters. A Google listing, a website, a job post, a YouTube channel, a carrier relationship — individually they\'re noise. Together they form a fingerprint. The fingerprint tells you what a record never will.',
  },
  {
    n: '03',
    title: 'Signal Before Contact.',
    body: 'The goal is never to find more people. The goal is to know more before you reach out. Every interaction should be informed. Every call should be warm. The intelligence layer exists so you never walk into a conversation blind.',
  },
  {
    n: '04',
    title: 'Live Data or No Data.',
    body: 'Stale intelligence is worse than no intelligence — it creates false confidence. Every query we run executes the full pipeline in real time. No static databases. No purchased lists. No data that was accurate six months ago.',
  },
  {
    n: '05',
    title: 'Industry-Specific Inference.',
    body: 'General-purpose AI doesn\'t know what a Mutual of Omaha appointment means for an SMS affiliation, or why "Rethinking Retirement" language on a website is a strain marker. Domain specificity is what separates intelligence from information.',
  },
  {
    n: '06',
    title: 'The Map Builds Itself.',
    body: 'The best intelligence compounds. Every confirmed observation teaches the system. Every logged specimen sharpens the model. The longer it runs, the more accurate it becomes — and the more defensible the dataset gets.',
  },
]

const APPLICATIONS = [
  {
    industry: 'Insurance Distribution',
    example: 'FMO affiliation mapping, agent recruitability scoring, distribution tree analysis',
    status: 'live',
  },
  {
    industry: 'Financial Services',
    example: 'Advisor independence signals, RIA vs. broker-dealer classification, territory mapping',
    status: 'potential',
  },
  {
    industry: 'Real Estate',
    example: 'Agent independence signals, brokerage affiliation, production tier classification',
    status: 'potential',
  },
  {
    industry: 'Healthcare',
    example: 'Provider network affiliation, group practice vs. independent classification, referral cluster mapping',
    status: 'potential',
  },
  {
    industry: 'B2B Sales Intelligence',
    example: 'Company cluster analysis, decision-maker signal extraction, competitive affiliation detection',
    status: 'potential',
  },
  {
    industry: 'Your Industry',
    example: 'If your market has public data and hidden connections — we can build the inference layer.',
    status: 'open',
  },
]

export default function PhilosophyPage() {
  return (
    <div style={{ minHeight: '100vh', background: 'var(--black)', color: 'var(--white)' }}>
      <PageNav />

      <style>{`
        @keyframes fadeUp { from { opacity: 0; transform: translateY(12px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.3} }
      `}</style>

      {/* ── HERO ── */}
      <section style={{ padding: '100px 40px 80px', maxWidth: 900, position: 'relative' }}>
        {/* Background R watermark */}
        <div style={{
          position: 'absolute', right: -40, top: 0,
          fontFamily: "'Arial Black', sans-serif", fontWeight: 900,
          fontSize: 480, color: 'var(--orange)', opacity: 0.025,
          lineHeight: 1, pointerEvents: 'none', userSelect: 'none',
          letterSpacing: -10,
        }}>R</div>

        <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 11, color: 'var(--orange)', letterSpacing: 3, textTransform: 'uppercase', marginBottom: 20, display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ width: 24, height: 1, background: 'var(--orange)', display: 'inline-block' }} />
          Design Philosophy
        </div>
        <h1 style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 'clamp(56px, 9vw, 110px)', letterSpacing: 2, lineHeight: 0.9, marginBottom: 32 }}>
          THE INTELLIGENCE<br />
          <span style={{ color: 'var(--orange)' }}>IS IN THE</span><br />
          CONNECTION<span style={{ color: 'var(--orange)' }}>.</span>
        </h1>
        <p style={{ fontSize: 18, color: 'var(--muted)', maxWidth: 580, lineHeight: 1.8, fontWeight: 300 }}>
          Most data tools give you records. We give you relationships. The difference between knowing someone exists and knowing who they are, who they work with, and what they're worth to you — that gap is what we close.
        </p>
      </section>

      {/* ── DIVIDER ── */}
      <div style={{ padding: '0 40px', marginBottom: 80 }}>
        <div style={{ height: 1, background: 'linear-gradient(90deg, var(--orange), var(--green), transparent)', maxWidth: 900, opacity: 0.4 }} />
      </div>

      {/* ── HOW WE THINK ── */}
      <section style={{ padding: '0 40px 100px', maxWidth: 900 }}>
        <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 10, color: 'var(--muted)', letterSpacing: 3, textTransform: 'uppercase', marginBottom: 48 }}>
          How We Think
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          {PRINCIPLES.map((p, i) => (
            <div
              key={p.n}
              style={{
                display: 'grid',
                gridTemplateColumns: '80px 1fr',
                gap: 32,
                padding: '36px 32px',
                background: 'var(--card)',
                border: '1px solid var(--border)',
                borderLeft: `3px solid ${i % 2 === 0 ? 'var(--orange)' : 'var(--green)'}`,
              }}
            >
              <div style={{
                fontFamily: "'Bebas Neue', sans-serif",
                fontSize: 56,
                color: i % 2 === 0 ? 'rgba(255,85,0,0.15)' : 'rgba(0,230,118,0.12)',
                lineHeight: 1,
                letterSpacing: 1,
              }}>
                {p.n}
              </div>
              <div>
                <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 13, color: 'var(--white)', letterSpacing: 1, marginBottom: 12, fontWeight: 500 }}>
                  {p.title}
                </div>
                <div style={{ fontSize: 14, color: 'var(--muted)', lineHeight: 1.8 }}>
                  {p.body}
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── CLUSTER DIAGRAM ── */}
      <section style={{ padding: '0 40px 100px', maxWidth: 900 }}>
        <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 10, color: 'var(--muted)', letterSpacing: 3, textTransform: 'uppercase', marginBottom: 32 }}>
          The Cluster Model
        </div>
        <div style={{ background: 'var(--card)', border: '1px solid var(--border)', padding: '48px 40px' }}>

          {/* Diagram */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 0, flexWrap: 'wrap', marginBottom: 48, position: 'relative' }}>

            {/* Data sources */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, alignItems: 'flex-end' }}>
              {['Google Listing', 'Website Content', 'Job Postings', 'YouTube Channel', 'Carrier Roster', 'Social Presence'].map((src, i) => (
                <div key={src} style={{
                  padding: '6px 14px',
                  background: 'var(--black)',
                  border: '1px solid var(--border)',
                  fontFamily: "'DM Mono', monospace",
                  fontSize: 10,
                  color: 'var(--muted)',
                  letterSpacing: 1,
                  position: 'relative',
                }}>
                  {src}
                  {/* Connector line */}
                  <div style={{
                    position: 'absolute', right: -40, top: '50%',
                    width: 40, height: 1,
                    background: `linear-gradient(90deg, var(--border), ${i < 3 ? 'var(--orange)' : 'var(--green)'})`,
                  }} />
                </div>
              ))}
            </div>

            {/* Center node */}
            <div style={{
              width: 120, height: 120,
              border: '1px solid var(--orange)',
              display: 'flex', flexDirection: 'column',
              alignItems: 'center', justifyContent: 'center',
              background: 'rgba(255,85,0,0.04)',
              flexShrink: 0, margin: '0 40px',
              position: 'relative',
            }}>
              <div style={{ width: 8, height: 8, background: 'var(--orange)', borderRadius: '50%', marginBottom: 8, animation: 'pulse 2s infinite' }} />
              <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 14, letterSpacing: 2, color: 'var(--orange)', textAlign: 'center', lineHeight: 1.3 }}>
                INFERENCE<br />ENGINE
              </div>
            </div>

            {/* Output */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {[
                { label: 'IDENTITY', color: 'var(--white)' },
                { label: 'AFFILIATION', color: 'var(--orange)' },
                { label: 'CONFIDENCE', color: 'var(--green)' },
                { label: 'STAGE', color: 'var(--green)' },
              ].map((out, i) => (
                <div key={out.label} style={{ position: 'relative' }}>
                  {/* Connector line */}
                  <div style={{
                    position: 'absolute', left: -40, top: '50%',
                    width: 40, height: 1,
                    background: `linear-gradient(90deg, var(--orange), var(--border))`,
                  }} />
                  <div style={{
                    padding: '6px 14px',
                    background: 'var(--black)',
                    border: `1px solid ${out.color === 'var(--white)' ? 'var(--border)' : out.color}`,
                    fontFamily: "'DM Mono', monospace",
                    fontSize: 10,
                    color: out.color,
                    letterSpacing: 2,
                  }}>
                    {out.label}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div style={{ borderTop: '1px solid var(--border)', paddingTop: 32, fontSize: 14, color: 'var(--muted)', lineHeight: 1.8, maxWidth: 640 }}>
            No single data point is conclusive. A Humana appointment could mean Integrity — or it could mean nothing. A "Rethinking Retirement" phrase on a website is a near-certain SMS marker. The engine knows the difference because it's trained on the full cluster, not individual records. That's the methodology.
          </div>
        </div>
      </section>

      {/* ── DEEP RESEARCH ── */}
      <section style={{ padding: '0 40px 100px', maxWidth: 900 }}>
        <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 10, color: 'var(--muted)', letterSpacing: 3, textTransform: 'uppercase', marginBottom: 32 }}>
          Deep Research Capability
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2 }}>
          {[
            {
              title: 'Multi-Layer Crawling',
              body: 'We don\'t stop at the surface. Every entity we analyze gets crawled across its full digital footprint — primary website, social profiles, directory listings, job boards, video platforms, and public registries — simultaneously.',
              accent: 'var(--orange)',
            },
            {
              title: 'Affiliation Detection',
              body: 'Language patterns, carrier appointments, brand markers, and organizational signals combine to identify who an entity truly belongs to — even when they don\'t advertise it. The fingerprint doesn\'t lie.',
              accent: 'var(--orange)',
            },
            {
              title: 'Confidence Scoring',
              body: 'Every conclusion comes with a confidence score. We don\'t just tell you what we think — we tell you how sure we are and which signals drove the conclusion. You decide what to act on.',
              accent: 'var(--green)',
            },
            {
              title: 'Compounding Intelligence',
              body: 'Field observations logged by users feed back into the system. Confirmed data sharpens future predictions. The dataset grows more accurate and more defensible with every interaction.',
              accent: 'var(--green)',
            },
          ].map(item => (
            <div key={item.title} style={{ background: 'var(--card)', border: '1px solid var(--border)', borderTop: `3px solid ${item.accent}`, padding: '28px 28px' }}>
              <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 12, color: item.accent, letterSpacing: 1, marginBottom: 12 }}>
                {item.title}
              </div>
              <div style={{ fontSize: 14, color: 'var(--muted)', lineHeight: 1.8 }}>
                {item.body}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── APPLICATIONS ── */}
      <section style={{ padding: '0 40px 100px', maxWidth: 900 }}>
        <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 10, color: 'var(--muted)', letterSpacing: 3, textTransform: 'uppercase', marginBottom: 16 }}>
          Where This Applies
        </div>
        <p style={{ fontSize: 15, color: 'var(--muted)', lineHeight: 1.7, maxWidth: 560, marginBottom: 40 }}>
          We built this engine for insurance distribution. But the methodology is industry-agnostic. Anywhere there are public digital signals and hidden relationships — this infrastructure applies.
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          {APPLICATIONS.map(app => (
            <div key={app.industry} style={{
              display: 'grid',
              gridTemplateColumns: '220px 1fr 120px',
              gap: 24,
              padding: '20px 24px',
              background: app.status === 'open' ? 'rgba(0,230,118,0.03)' : 'var(--card)',
              border: `1px solid ${app.status === 'live' ? 'var(--orange)' : app.status === 'open' ? 'rgba(0,230,118,0.3)' : 'var(--border)'}`,
              alignItems: 'center',
            }}>
              <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 12, color: app.status === 'open' ? 'var(--green)' : 'var(--white)', letterSpacing: 1 }}>
                {app.industry}
              </div>
              <div style={{ fontSize: 13, color: 'var(--muted)', lineHeight: 1.6 }}>
                {app.example}
              </div>
              <div style={{ textAlign: 'right' }}>
                {app.status === 'live' && (
                  <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 9, color: 'var(--orange)', border: '1px solid var(--orange)', padding: '3px 8px', letterSpacing: 2 }}>LIVE</span>
                )}
                {app.status === 'potential' && (
                  <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 9, color: 'var(--muted)', border: '1px solid var(--border)', padding: '3px 8px', letterSpacing: 2 }}>POTENTIAL</span>
                )}
                {app.status === 'open' && (
                  <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 9, color: 'var(--green)', border: '1px solid rgba(0,230,118,0.4)', padding: '3px 8px', letterSpacing: 2, animation: 'pulse 2s infinite', display: 'inline-block' }}>OPEN</span>
                )}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── CTA ── */}
      <section style={{ padding: '0 40px 100px', maxWidth: 900 }}>
        <div style={{ background: 'var(--card)', border: '1px solid var(--border)', borderLeft: '4px solid var(--green)', padding: '48px 48px' }}>
          <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 10, color: 'var(--green)', letterSpacing: 3, textTransform: 'uppercase', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ display: 'inline-block', width: 6, height: 6, borderRadius: '50%', background: 'var(--green)', animation: 'pulse 2s infinite' }} />
            Apply This To Your Industry
          </div>
          <h2 style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 'clamp(36px, 5vw, 56px)', letterSpacing: 2, lineHeight: 1, marginBottom: 20 }}>
            IF YOUR MARKET HAS<br />
            PUBLIC DATA AND HIDDEN<br />
            <span style={{ color: 'var(--green)' }}>CONNECTIONS — LET'S TALK.</span>
          </h2>
          <p style={{ fontSize: 15, color: 'var(--muted)', maxWidth: 520, lineHeight: 1.8, marginBottom: 36 }}>
            We're interested in applying this methodology to new industries and datasets. If you have a market where relationships are opaque, affiliations are undisclosed, and the right intelligence would change how you operate — reach out. We want to hear about it.
          </p>
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
            <Link
              href="/contact"
              style={{
                padding: '16px 40px',
                background: 'var(--green)',
                color: 'var(--black)',
                fontFamily: "'Bebas Neue', sans-serif",
                fontSize: 20,
                letterSpacing: 3,
                textDecoration: 'none',
                display: 'inline-block',
              }}
            >
              START A CONVERSATION →
            </Link>
            <Link
              href="/network/anathema"
              style={{
                padding: '16px 32px',
                background: 'transparent',
                border: '1px solid var(--border)',
                color: 'var(--muted)',
                fontFamily: "'DM Mono', monospace",
                fontSize: 12,
                letterSpacing: 2,
                textDecoration: 'none',
                display: 'inline-flex',
                alignItems: 'center',
              }}
            >
              SEE IT IN ACTION
            </Link>
          </div>
        </div>
      </section>

      <PageFooter />
    </div>
  )
}
