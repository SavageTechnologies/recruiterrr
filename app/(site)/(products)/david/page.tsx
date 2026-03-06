import Link from 'next/link'

const WHAT_IT_IS = [
  { title: "We Don't Touch Your CRM",               body: "DAVID doesn't integrate with HubSpot, Salesforce, or anything else. It returns a structured intelligence payload. You decide where it goes and what your system does with it." },
  { title: "We Don't Write Your Messages",          body: "Your voice, your templates, your brand. DAVID gives your AI writer or sequencer the intelligence it needs to stop sending generic outreach. The writing is yours — we just make sure it's informed." },
  { title: 'We Structure ANATHEMA Into Action',     body: "ANATHEMA builds deep profiles. DAVID formats that intelligence — tree, upline, confidence, personal facts, behavioral signals — into clean, machine-readable data your system can actually act on." },
  { title: 'One Input. A Complete Picture.',        body: "Pass in a producer name and market. Get back everything — predicted distribution chain, confidence score, digital footprint, personal facts, and behavioral signals. Fully structured. Ready to use." },
]

const PAYLOAD_FIELDS = [
  { key: 'agent_name',      val: '"John Smith"',                                          color: '#2d7a4f' },
  { key: 'market',          val: '"Oklahoma City, OK"',                                   color: '#2d7a4f' },
  { key: 'recruit_score',   val: '78',                                                    color: '#7c5cbf' },
  { key: 'recruit_flag',    val: '"WARM"',                                                color: '#92660a' },
  { key: 'predicted_tree',  val: '"INTEGRITY"',                                           color: '#c0431a' },
  { key: 'tree_confidence', val: '81',                                                    color: '#7c5cbf' },
  { key: 'product_focus',   val: '"Medicare Advantage, Medicare Supplement, Part D"',     color: '#2d7a4f' },
  { key: 'agency_rating',   val: '5.0',                                                   color: '#7c5cbf' },
  { key: 'review_count',    val: '40',                                                    color: '#7c5cbf' },
  { key: 'outreach_ready',  val: 'true',                                                  color: '#1a7a4a' },
]

const PERSONAL_FACTS = [
  { source: 'YOUTUBE',  fact: 'Published a video about Medicaid benefits for veterans — 3,200 views, 6 weeks ago' },
  { source: 'SERP',     fact: 'Best Insurance Agency in Moore and South OKC — 2025' },
  { source: 'GOOGLE',   fact: 'Client review: went above and beyond on a Form 1095-A issue no one else could solve' },
  { source: 'FACEBOOK', fact: 'NAIFA Oklahoma conference photos last month — tagged the event and two attendees' },
]

const STEPS = [
  { n: '01', title: 'Find the Producer',      body: 'Run a search or pull a producer from your database. Every agent ANATHEMA has touched already has a profile waiting.' },
  { n: '02', title: 'Request the Profile',    body: 'One API call. Pass in the producer. Get back the full structured profile — tree, upline, confidence, signals, personal facts, and outreach score.' },
  { n: '03', title: 'Your System Takes Over', body: "Feed the payload into your AI writer, CRM, or sequencer. It knows exactly who it's talking to. What it does with that intelligence is entirely up to you." },
]

const FOR_WHOM = [
  { label: 'Teams Running AI-Powered Outreach',               body: "Your AI writer is only as good as the context you give it. DAVID hands it a complete picture of who the producer is — so the output stops reading like a template and starts reading like someone actually did their homework." },
  { label: 'CRM Teams Enriching Contact Records',             body: "Stop staring at a name and a phone number. DAVID enriches every record with predicted tree affiliation, upline, confidence score, and the personal signals that make a cold opener land." },
  { label: 'Sequencer Users Who Want Smarter Routing',        body: "Route producers into different sequences based on their DAVID profile. Integrity-affiliated agents get one flow. Independents get another. The right message to the right person at the right time." },
  { label: "Any Recruiter Whose Outreach Isn't Getting Replies", body: "The problem usually isn't your offer — it's that your outreach has no context. DAVID fixes the context. When your system knows who it's talking to, the message finally sounds like it was written for that person." },
]

export default function DavidLandingPage() {
  return (
    <>
      {/* ── HERO ── */}
      <section className="site-section site-section-paper">
        <div className="site-inner">
          <div className="site-eyebrow-orange" style={{ color: 'var(--site-purple)' }}>
            A Recruiterrr Intelligence Tool — Powered by ANATHEMA
          </div>
          <h1 className="site-h1">
            YOUR SYSTEM.<br />
            <span style={{ color: 'var(--site-purple)' }}>OUR INTEL.</span><br />
            THEIR ATTENTION.
          </h1>
          <p className="site-lead" style={{ maxWidth: 560, marginBottom: 48 }}>
            DAVID takes everything ANATHEMA knows about a producer and structures it into a clean,
            machine-readable profile — so your CRM, sequencer, or AI writer can build outreach that
            actually reflects who they are, what they care about, and why now is the right time to reach out.
          </p>
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
            <Link href="/dashboard" className="site-btn-primary" style={{ background: 'var(--site-purple)', boxShadow: '0 2px 12px rgba(124,92,191,0.28)' }}>
              Access Dashboard
            </Link>
            <Link href="/sign-up" className="site-btn-ghost">Request Access</Link>
          </div>
        </div>
      </section>

      {/* ── STATS ── */}
      <div className="site-stats-band">
        <div className="site-inner">
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)' }}>
            {[
              ['1',   '',   'API Call Per Full Profile'],
              ['100', '%',  'Your Stack. Your Templates.'],
              ['0',   '',   'Generic Messages Sent'],
              ['∞',   '',   'Profiles Growing Daily'],
            ].map(([num, acc, label]) => (
              <div key={label} className="site-stat-item">
                <div className="site-stat-num" style={{ color: 'var(--site-purple)' }}>
                  {num}<span style={{ color: 'var(--site-purple)' }}>{acc}</span>
                </div>
                <div className="site-stat-label">{label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── WHAT DAVID IS ── */}
      <section className="site-section site-section-white site-section-divider">
        <div className="site-inner">
          <div className="site-eyebrow">What DAVID Is</div>
          <h2 className="site-h2">NOT A WRITER.<br /><span style={{ color: 'var(--site-purple)' }}>AN INTELLIGENCE LAYER.</span></h2>
          <div className="site-grid-bordered" style={{ gridTemplateColumns: 'repeat(2, 1fr)' }}>
            {WHAT_IT_IS.map(s => (
              <div key={s.title} className="site-tool-card" style={{ '--tool-accent': 'var(--site-purple)' } as React.CSSProperties}>
                <h3 className="site-h3" style={{ fontSize: 17, marginBottom: 10, fontFamily: "'DM Sans', sans-serif", fontWeight: 600, letterSpacing: 0 }}>{s.title}</h3>
                <p className="site-body">{s.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── THE PAYLOAD ── */}
      <section className="site-section site-section-paper site-section-divider">
        <div className="site-inner">
          <div className="site-eyebrow">What You Receive</div>
          <h2 className="site-h2">THE PROFILE.<br /><span style={{ color: 'var(--site-purple)' }}>ONE CALL. FULL PICTURE.</span></h2>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>

            {/* JSON block */}
            <div style={{
              background: '#0f0f0f', border: '1px solid #1e1e1e',
              borderLeft: '3px solid var(--site-purple)',
              borderRadius: 'var(--radius-md)', padding: 28, overflow: 'hidden',
            }}>
              <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 9, color: '#444', letterSpacing: 2, marginBottom: 16 }}>
                // DAVID PROFILE — agent: John Smith, Oklahoma City OK
              </div>
              <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 11, lineHeight: 2, color: '#888' }}>
                <span style={{ color: '#333' }}>{'{'}</span>
                <div style={{ paddingLeft: 20 }}>
                  {PAYLOAD_FIELDS.map((f, i) => (
                    <div key={f.key}>
                      <span style={{ color: '#4fc3f7' }}>&quot;{f.key}&quot;</span>
                      <span style={{ color: '#333' }}>: </span>
                      <span style={{ color: f.color }}>{f.val}</span>
                      {i < PAYLOAD_FIELDS.length - 1 && <span style={{ color: '#333' }}>,</span>}
                    </div>
                  ))}
                  <div>
                    <span style={{ color: '#4fc3f7' }}>&quot;personal_facts&quot;</span>
                    <span style={{ color: '#333' }}>: [</span>
                    <div style={{ paddingLeft: 20 }}>
                      {PERSONAL_FACTS.map((f, i) => (
                        <div key={i} style={{ marginBottom: 4 }}>
                          <span style={{ color: '#333' }}>{'{ '}</span>
                          <span style={{ color: '#7c5cbf' }}>&quot;{f.source}&quot;</span>
                          <span style={{ color: '#333' }}>: </span>
                          <span style={{ color: '#666' }}>&quot;{f.fact}&quot;</span>
                          <span style={{ color: '#333' }}>{' }'}{ i < PERSONAL_FACTS.length - 1 ? ',' : ''}</span>
                        </div>
                      ))}
                    </div>
                    <span style={{ color: '#333' }}>]</span>
                  </div>
                </div>
                <span style={{ color: '#333' }}>{'}'}</span>
              </div>
              <div style={{ marginTop: 16, fontFamily: "'DM Mono', monospace", fontSize: 9, color: '#2a2a2a', letterSpacing: 1 }}>
                ↳ One call. Full structured profile. Your system decides what to do next.
              </div>
            </div>

            {/* What's in it */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {[
                { label: 'Recruit Score + Flag',     body: 'HOT / WARM / COLD with a numeric score. Route producers automatically into the right sequence without manual review.' },
                { label: 'Predicted Tree + Upline',  body: 'Which consolidator they roll up through, the confidence level, and the specific sub-IMO if identified — so you know the full chain before the conversation starts.' },
                { label: 'Product Focus',            body: 'What lines they actually write — Medicare Advantage, life, ACA — so your pitch speaks directly to their book of business.' },
                { label: 'Personal Facts Array',     body: 'YouTube content, awards, reviews, social signals, conference attendance. The real-world context your AI writer needs to open a cold conversation that actually gets a response.' },
                { label: 'Outreach Ready Flag',      body: 'Boolean. True means the profile is enriched enough for your system to act on immediately without manual review.' },
              ].map(item => (
                <div key={item.label} className="site-card" style={{ padding: '20px 22px' }}>
                  <div className="site-label" style={{ color: 'var(--site-purple)', marginBottom: 6 }}>{item.label}</div>
                  <p className="site-body">{item.body}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── BEFORE / AFTER ── */}
      <section className="site-section site-section-white site-section-divider">
        <div className="site-inner">
          <div className="site-eyebrow">What Changes</div>
          <h2 className="site-h2">SAME PRODUCER.<br /><span style={{ color: 'var(--site-purple)' }}>COMPLETELY DIFFERENT RESULT.</span></h2>
          <p className="site-lead" style={{ maxWidth: 560, marginBottom: 48 }}>
            DAVID passes the enriched profile to your AI writer. It doesn&apos;t change your templates —
            it gives them something real to work with. The difference in response rate isn&apos;t subtle.
          </p>

          <div className="site-grid-bordered" style={{ gridTemplateColumns: '1fr 1fr', marginBottom: 16 }}>

            {/* Without */}
            <div style={{ background: 'var(--site-white)', padding: '36px 32px', borderLeft: '3px solid #e05252' }}>
              <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 9, letterSpacing: 2, color: '#e05252', textTransform: 'uppercase', marginBottom: 20 }}>
                Without DAVID — No Context
              </div>
              <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 10, color: 'var(--site-ink-4)', lineHeight: 2, marginBottom: 20 }}>
                <div style={{ marginBottom: 10, textDecoration: 'line-through', opacity: 0.5 }}>
                  Subject: Exciting opportunity for insurance producers
                </div>
                <div style={{ textDecoration: 'line-through', opacity: 0.35, lineHeight: 1.9 }}>
                  <p>Hey John,</p><br />
                  <p>I came across your profile and wanted to reach out about an exciting opportunity. We offer great contracts, strong support, and competitive commissions.</p><br />
                  <p>Let me know if you&apos;d like to connect!</p>
                </div>
              </div>
              <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 9, color: '#e05252', letterSpacing: 1 }}>
                ↳ DELETED. SAME AS THE LAST 14.
              </div>
            </div>

            {/* With */}
            <div style={{ background: 'var(--site-white)', padding: '36px 32px', borderLeft: '3px solid var(--site-purple)' }}>
              <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 9, letterSpacing: 2, color: 'var(--site-purple)', textTransform: 'uppercase', marginBottom: 20 }}>
                With DAVID — Opens With What They Care About
              </div>
              <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 10, color: 'var(--site-ink-3)', lineHeight: 1.9, marginBottom: 20 }}>
                <div style={{ color: 'var(--site-ink-2)', marginBottom: 10, fontWeight: 500 }}>
                  Subject: John — the veterans Medicaid video + Best Agency in Moore
                </div>
                <p style={{ color: 'var(--site-ink-2)' }}>John —</p><br />
                <p>Watched your video on Medicaid benefits for veterans. That&apos;s a niche most producers never bother to learn — the fact that you made a video about it says a lot.</p><br />
                <p>Also saw the Best Agency recognition in Moore and South OKC. A 5-star rating with 40 reviews doesn&apos;t happen by accident.</p><br />
                <p>15 minutes when you have it. No pitch — just want to learn more about what you&apos;re building.</p>
              </div>
              <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 9, color: 'var(--site-green)', letterSpacing: 1 }}>
                ↳ OPENED. REPLIED: &ldquo;HOW DID YOU FIND THAT VIDEO?&rdquo;
              </div>
            </div>
          </div>

          <div style={{ padding: '14px 20px', background: 'var(--site-paper)', border: '1px solid var(--site-border)', borderRadius: 'var(--radius)', fontFamily: "'DM Mono', monospace", fontSize: 10, color: 'var(--site-ink-4)', letterSpacing: 0.5 }}>
            ↳ Your AI writer received the DAVID profile — personal facts, awards, content signals — and built this. We supplied the intelligence. It did the writing.
          </div>
        </div>
      </section>

      {/* ── HOW IT WORKS ── */}
      <section className="site-section site-section-paper site-section-divider">
        <div className="site-inner">
          <div className="site-eyebrow">How It Works</div>
          <h2 className="site-h2">THREE STEPS TO <span style={{ color: 'var(--site-purple)' }}>PREPARED.</span></h2>
          <div className="site-grid-bordered" style={{ gridTemplateColumns: 'repeat(3, 1fr)' }}>
            {STEPS.map((step, i) => (
              <div key={step.n} className="site-step-card">
                <div className="site-step-num">{step.n}</div>
                <div className="site-step-title">{step.title}</div>
                <p className="site-body">{step.body}</p>
                {i < STEPS.length - 1 && <div className="site-step-connector">→</div>}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── WHY DAVID ── */}
      <section className="site-section site-section-paper-2 site-section-divider">
        <div className="site-inner">
          <div className="site-card" style={{ padding: '48px 40px', borderColor: 'var(--site-purple-border)' }}>
            <div className="site-eyebrow" style={{ marginBottom: 16 }}>Why David</div>
            <h2 className="site-h2" style={{ marginBottom: 20 }}>
              KNOW WHO YOU&apos;RE TALKING TO<br />
              <span style={{ color: 'var(--site-purple)' }}>BEFORE YOU SAY A WORD.</span>
            </h2>
            <p className="site-lead" style={{ maxWidth: 600 }}>
              The best recruiters in this industry have always done their homework before the call.
              They knew the producer&apos;s carriers, their awards, what they posted last week, what
              conference they just attended. That kind of preparation used to take hours — or it just
              didn&apos;t happen. DAVID makes it automatic. Every producer you reach out to, your system
              already knows who they are. The intelligence exists. We structure it so your operation
              can act on it at scale.{' '}
              <em style={{ color: 'var(--site-ink)' }}>What you build with it is up to you.</em>
            </p>
          </div>
        </div>
      </section>

      {/* ── WHO IT'S FOR ── */}
      <section className="site-section site-section-white site-section-divider">
        <div className="site-inner">
          <div className="site-eyebrow">Who It&apos;s For</div>
          <h2 className="site-h2">BUILT FOR <span style={{ color: 'var(--site-purple)' }}>YOUR STACK.</span></h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 16 }}>
            {FOR_WHOM.map(item => (
              <div key={item.label} className="site-card" style={{ padding: '32px 28px' }}>
                <div className="site-label" style={{ color: 'var(--site-purple)', marginBottom: 10 }}>{item.label}</div>
                <p className="site-body">{item.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="site-section site-section-paper site-section-divider">
        <div className="site-inner" style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: 80, alignItems: 'center' }}>
          <div>
            <div className="site-eyebrow">Get Started</div>
            <h2 className="site-h2" style={{ marginBottom: 20 }}>
              YOUR SYSTEM ALREADY<br />
              <span style={{ color: 'var(--site-purple)' }}>KNOWS WHAT TO DO.</span>
            </h2>
            <p className="site-lead">Give it the intelligence. Every profile built from here compounds into a better database, a sharper system, and a bigger advantage over everyone still recruiting blind.</p>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12, flexShrink: 0 }}>
            <Link href="/dashboard" className="site-btn-primary" style={{ background: 'var(--site-purple)', boxShadow: '0 4px 24px rgba(124,92,191,0.28)', fontSize: 18, padding: '16px 40px' }}>
              Access Dashboard
            </Link>
            <Link href="/sign-up" className="site-btn-ghost" style={{ textAlign: 'center' }}>Request Access</Link>
          </div>
        </div>
      </section>
    </>
  )
}
