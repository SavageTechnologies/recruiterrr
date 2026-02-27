import Link from 'next/link'
import PageNav from '@/components/PageNav'
import PageFooter from '@/components/PageFooter'

export default function DavidLandingPage() {
  return (
    <div style={{ minHeight: '100vh', background: 'var(--black)' }}>
      <PageNav />

      {/* HERO */}
      <section style={{ padding: '100px 40px 60px', position: 'relative', overflow: 'hidden' }}>
        <div style={{
          position: 'absolute', right: 0, top: 0,
          width: '45vw', height: '100%',
          backgroundImage: "url('/david.png')",
          backgroundSize: 'cover', backgroundPosition: 'center top',
          opacity: 0.055, pointerEvents: 'none', userSelect: 'none',
          maskImage: 'linear-gradient(to right, transparent 0%, rgba(0,0,0,0.4) 30%, black 70%)',
          WebkitMaskImage: 'linear-gradient(to right, transparent 0%, rgba(0,0,0,0.4) 30%, black 70%)',
        }} />
        <div style={{ maxWidth: 960, position: 'relative' }}>
          <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 11, color: 'var(--orange)', letterSpacing: 3, textTransform: 'uppercase', marginBottom: 20, display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ width: 24, height: 1, background: 'var(--orange)', display: 'inline-block' }} />
            A Recruiterrr Intelligence Tool — Powered by ANATHEMA
          </div>
          <h1 style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 'clamp(64px, 10vw, 120px)', lineHeight: 0.9, letterSpacing: 2, color: 'var(--white)', marginBottom: 24 }}>
            YOUR SYSTEM.<br />
            <span style={{ color: 'var(--orange)' }}>OUR INTEL.</span><br />
            THEIR ATTENTION.
          </h1>
          <p style={{ fontSize: 18, color: 'var(--muted)', fontWeight: 300, maxWidth: 580, lineHeight: 1.6, marginBottom: 48 }}>
            DAVID doesn't write your messages. It structures everything ANATHEMA knows about an agent into a clean, machine-readable profile payload — so your CRM, sequencer, or AI writer can build outreach that actually reflects who they are.
          </p>
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
            <Link href="/dashboard" style={{ padding: '18px 48px', background: 'var(--orange)', border: 'none', color: 'var(--black)', fontFamily: "'Bebas Neue', sans-serif", fontSize: 22, letterSpacing: 3, cursor: 'pointer', textDecoration: 'none' }}>
              ACCESS DASHBOARD
            </Link>
            <Link href="/sign-up" style={{ padding: '18px 32px', background: 'transparent', border: '1px solid var(--border-light)', color: 'var(--muted)', fontFamily: "'DM Mono', monospace", fontSize: 12, letterSpacing: 2, cursor: 'pointer', textDecoration: 'none', display: 'flex', alignItems: 'center' }}>
              CREATE ACCOUNT
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
              {s.main}<span style={{ color: 'var(--orange)' }}>{s.accent}</span>
            </div>
            <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 10, color: 'var(--muted)', letterSpacing: 2, textTransform: 'uppercase' }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* WHAT DAVID IS */}
      <section style={{ padding: '80px 40px', maxWidth: 900 }}>
        <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 11, color: 'var(--muted)', letterSpacing: 3, textTransform: 'uppercase', marginBottom: 12 }}>What DAVID Is</div>
        <h2 style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 48, letterSpacing: 2, color: 'var(--white)', marginBottom: 40 }}>
          NOT A WRITER.<br /><span style={{ color: 'var(--orange)' }}>AN INTELLIGENCE LAYER.</span>
        </h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 2 }}>
          {[
            { icon: '◈', title: 'We Don\'t Touch Your CRM', body: 'DAVID doesn\'t integrate with HubSpot, Salesforce, or anything else. It returns a structured data payload. You decide where it goes and what your system does with it.' },
            { icon: '◈', title: 'We Don\'t Write Your Messages', body: 'Your voice, your templates, your brand. DAVID gives your AI writer or sequencer the intelligence it needs to stop sending generic outreach. The writing is yours.' },
            { icon: '◈', title: 'We Translate ANATHEMA Into Structure', body: 'ANATHEMA builds deep profiles. DAVID formats that intelligence — tree, upline, signals, score, context — into clean JSON your system can actually read and act on.' },
            { icon: '◈', title: 'One Input. Complete Profile.', body: 'Pass in an agent name and market. Get back everything — predicted distribution chain, confidence, digital footprint, behavioral signals. Your system handles the rest.' },
          ].map(s => (
            <div key={s.title} style={{ background: 'var(--card)', border: '1px solid var(--border)', padding: '28px 24px' }}>
              <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 18, color: 'var(--orange)', marginBottom: 14 }}>{s.icon}</div>
              <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 15, fontWeight: 600, marginBottom: 8, color: 'var(--white)' }}>{s.title}</div>
              <div style={{ fontSize: 13, color: 'var(--muted)', lineHeight: 1.6 }}>{s.body}</div>
            </div>
          ))}
        </div>
      </section>

      {/* PAYLOAD EXAMPLE */}
      <section style={{ padding: '0 40px 80px', maxWidth: 900 }}>
        <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 11, color: 'var(--muted)', letterSpacing: 3, textTransform: 'uppercase', marginBottom: 12 }}>What You Receive</div>
        <h2 style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 48, letterSpacing: 2, color: 'var(--white)', marginBottom: 40 }}>
          THE PAYLOAD. <span style={{ color: 'var(--orange)' }}>YOUR SYSTEM READS IT.</span>
        </h2>
        <div style={{ background: '#080808', border: '1px solid var(--border)', borderLeft: '2px solid var(--orange)', padding: '32px 28px', fontFamily: "'DM Mono', monospace", fontSize: 12, lineHeight: 2, overflowX: 'auto' }}>
          <div style={{ color: '#555', marginBottom: 8, fontSize: 10, letterSpacing: 2 }}>// DAVID API RESPONSE — agent: Russell Scott, Tulsa OK</div>
          <div><span style={{ color: '#555' }}>{'{'}</span></div>
          <div style={{ paddingLeft: 24 }}>
            <div><span style={{ color: '#4fc3f7' }}>"agent_name"</span><span style={{ color: '#555' }}>: </span><span style={{ color: '#a5d6a7' }}>"Russell Scott"</span><span style={{ color: '#555' }}>,</span></div>
            <div><span style={{ color: '#4fc3f7' }}>"market"</span><span style={{ color: '#555' }}>: </span><span style={{ color: '#a5d6a7' }}>"Tulsa, OK"</span><span style={{ color: '#555' }}>,</span></div>
            <div><span style={{ color: '#4fc3f7' }}>"recruit_score"</span><span style={{ color: '#555' }}>: </span><span style={{ color: 'var(--orange)' }}>78</span><span style={{ color: '#555' }}>,</span></div>
            <div><span style={{ color: '#4fc3f7' }}>"recruit_flag"</span><span style={{ color: '#555' }}>: </span><span style={{ color: '#00e676' }}>"HOT"</span><span style={{ color: '#555' }}>,</span></div>
            <div><span style={{ color: '#4fc3f7' }}>"predicted_tree"</span><span style={{ color: '#555' }}>: </span><span style={{ color: '#a5d6a7' }}>"OTHER"</span><span style={{ color: '#555' }}>,</span></div>
            <div><span style={{ color: '#4fc3f7' }}>"predicted_upline"</span><span style={{ color: '#555' }}>: </span><span style={{ color: '#a5d6a7' }}>"Legacy Insurance Advisors"</span><span style={{ color: '#555' }}>,</span></div>
            <div><span style={{ color: '#4fc3f7' }}>"tree_confidence"</span><span style={{ color: '#555' }}>: </span><span style={{ color: 'var(--orange)' }}>84</span><span style={{ color: '#555' }}>,</span></div>
            <div><span style={{ color: '#4fc3f7' }}>"product_focus"</span><span style={{ color: '#555' }}>: </span><span style={{ color: '#a5d6a7' }}>"Medicare Advantage, Supplement, Part D"</span><span style={{ color: '#555' }}>,</span></div>
            <div><span style={{ color: '#4fc3f7' }}>"agency_rating"</span><span style={{ color: '#555' }}>: </span><span style={{ color: 'var(--orange)' }}>5.0</span><span style={{ color: '#555' }}>,</span></div>
            <div><span style={{ color: '#4fc3f7' }}>"review_count"</span><span style={{ color: '#555' }}>: </span><span style={{ color: 'var(--orange)' }}>20</span><span style={{ color: '#555' }}>,</span></div>
            <div><span style={{ color: '#4fc3f7' }}>"hiring_signals"</span><span style={{ color: '#555' }}>: </span><span style={{ color: '#ff4444' }}>false</span><span style={{ color: '#555' }}>,</span></div>
            <div><span style={{ color: '#4fc3f7' }}>"youtube_presence"</span><span style={{ color: '#555' }}>: </span><span style={{ color: '#ff4444' }}>false</span><span style={{ color: '#555' }}>,</span></div>
            <div><span style={{ color: '#4fc3f7' }}>"website"</span><span style={{ color: '#555' }}>: </span><span style={{ color: '#a5d6a7' }}>"okmedicarehelp.com"</span><span style={{ color: '#555' }}>,</span></div>
            <div><span style={{ color: '#4fc3f7' }}>"detection_signals"</span><span style={{ color: '#555' }}>: [</span></div>
            <div style={{ paddingLeft: 24 }}>
              <div><span style={{ color: '#a5d6a7' }}>"Multiple agents cross-referenced to Legacy Insurance Advisors"</span><span style={{ color: '#555' }}>,</span></div>
              <div><span style={{ color: '#a5d6a7' }}>"No Integrity/AmeriLife brand language detected"</span><span style={{ color: '#555' }}>,</span></div>
              <div><span style={{ color: '#a5d6a7' }}>"Education-first website positioning"</span></div>
            </div>
            <div><span style={{ color: '#555' }}>],</span></div>
            <div><span style={{ color: '#4fc3f7' }}>"outreach_context"</span><span style={{ color: '#555' }}>: </span><span style={{ color: '#a5d6a7' }}>"Independent Medicare shop. Not an Integrity or AmeriLife agent. Solo operation — no hiring signals. Education-first approach. Contract conversation is the right angle."</span></div>
          </div>
          <div><span style={{ color: '#555' }}>{'}'}</span></div>
        </div>
        <div style={{ marginTop: 2, padding: '14px 20px', background: 'var(--card)', border: '1px solid var(--border)', fontFamily: "'DM Mono', monospace", fontSize: 10, color: '#555', letterSpacing: 1 }}>
          ↳ This payload goes into your system. Your AI writer, your CRM, your sequencer. DAVID formats the intelligence. You control everything else.
        </div>
      </section>

      {/* EMAIL EXAMPLE */}
      <section style={{ padding: '0 40px 80px', maxWidth: 900 }}>
        <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 11, color: 'var(--muted)', letterSpacing: 3, textTransform: 'uppercase', marginBottom: 12 }}>Email — What Changes</div>
        <h2 style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 48, letterSpacing: 2, color: 'var(--white)', marginBottom: 40 }}>
          SAME AGENT. <span style={{ color: 'var(--orange)' }}>DIFFERENT WORLD.</span>
        </h2>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2, marginBottom: 2 }}>
          {/* WITHOUT */}
          <div style={{ background: 'var(--card)', border: '1px solid var(--border)', borderLeft: '3px solid #ff3344', padding: '32px 28px' }}>
            <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 9, letterSpacing: 3, color: '#ff3344', textTransform: 'uppercase', marginBottom: 20 }}>// Without DAVID — Blind Blast</div>
            <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 11, color: 'var(--muted)', lineHeight: 2 }}>
              <div style={{ color: '#444', marginBottom: 12 }}>Subject: <span style={{ textDecoration: 'line-through' }}>Exciting opportunity for insurance agents</span></div>
              <div style={{ textDecoration: 'line-through', opacity: 0.45, lineHeight: 1.9 }}>
                <p>Hey Russell,</p>
                <br />
                <p>I came across your profile and wanted to connect about joining our FMO. We offer top contracts, great commissions, and a dedicated support team for Medicare agents.</p>
                <br />
                <p>Let me know if you'd like to schedule a quick call!</p>
              </div>
            </div>
            <div style={{ marginTop: 20, fontFamily: "'DM Mono', monospace", fontSize: 9, color: '#ff3344', letterSpacing: 2 }}>↳ DELETED. SAME AS THE LAST 14.</div>
          </div>

          {/* WITH */}
          <div style={{ background: 'var(--card)', border: '1px solid var(--border)', borderLeft: '3px solid #00e676', padding: '32px 28px' }}>
            <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 9, letterSpacing: 3, color: '#00e676', textTransform: 'uppercase', marginBottom: 20 }}>// With DAVID Payload — Your System Builds This</div>
            <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 11, color: 'var(--muted)', lineHeight: 2 }}>
              <div style={{ color: 'var(--muted)', marginBottom: 12 }}>Subject: <span style={{ color: 'var(--orange)' }}>Your Legacy IA setup — and what we see</span></div>
              <p><span style={{ color: 'var(--white)' }}>Russell —</span></p>
              <br />
              <p>You're running a <span style={{ color: 'var(--orange)' }}>5-star Medicare shop in Tulsa</span>, and our data shows you're likely under <span style={{ color: 'var(--orange)' }}>Legacy Insurance Advisors</span> — not in the Integrity or AmeriLife network.</p>
              <br />
              <p>That matters because what we'd offer you looks different than what those shops pitch. Worth 10 minutes to show you the difference.</p>
            </div>
            <div style={{ marginTop: 20, fontFamily: "'DM Mono', monospace", fontSize: 9, color: '#00e676', letterSpacing: 2 }}>↳ OPENED. REPLIED IN 4 MINUTES.</div>
          </div>
        </div>
        <div style={{ padding: '12px 20px', background: 'var(--card)', border: '1px solid var(--border)', fontFamily: "'DM Mono', monospace", fontSize: 9, color: '#555', letterSpacing: 1 }}>
          ↳ Your AI writer received the DAVID payload above and built this. We gave it the intelligence. It did the writing.
        </div>
      </section>

      {/* SMS EXAMPLE */}
      <section style={{ padding: '0 40px 80px', maxWidth: 900 }}>
        <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 11, color: 'var(--muted)', letterSpacing: 3, textTransform: 'uppercase', marginBottom: 12 }}>SMS — What Changes</div>
        <h2 style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 48, letterSpacing: 2, color: 'var(--white)', marginBottom: 40 }}>
          ONE TEXT. <span style={{ color: 'var(--orange)' }}>ONE SHOT.</span>
        </h2>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2, marginBottom: 2 }}>
          {/* WITHOUT */}
          <div style={{ background: 'var(--card)', border: '1px solid var(--border)', borderLeft: '3px solid #ff3344', padding: '32px 28px' }}>
            <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 9, letterSpacing: 3, color: '#ff3344', textTransform: 'uppercase', marginBottom: 20 }}>// Without DAVID</div>
            <div style={{ background: '#111', border: '1px solid #1f1f1f', borderRadius: 2, padding: '16px 18px', maxWidth: 280 }}>
              <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 11, color: '#555', lineHeight: 1.8, textDecoration: 'line-through', opacity: 0.5 }}>
                Hi Russell! I'm reaching out about an amazing opportunity to grow your Medicare book with our FMO. We'd love to connect!
              </div>
            </div>
            <div style={{ marginTop: 20, fontFamily: "'DM Mono', monospace", fontSize: 9, color: '#ff3344', letterSpacing: 2 }}>↳ IGNORED. FEELS LIKE SPAM.</div>
          </div>

          {/* WITH */}
          <div style={{ background: 'var(--card)', border: '1px solid var(--border)', borderLeft: '3px solid #00e676', padding: '32px 28px' }}>
            <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 9, letterSpacing: 3, color: '#00e676', textTransform: 'uppercase', marginBottom: 20 }}>// With DAVID Payload</div>
            <div style={{ background: '#111', border: '1px solid #1f1f1f', borderRadius: 2, padding: '16px 18px', maxWidth: 280 }}>
              <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 11, color: 'var(--muted)', lineHeight: 1.8 }}>
                Russell — saw your <span style={{ color: 'var(--orange)' }}>OK Medicare Help</span> shop in Tulsa. 5 stars, 20 reviews — that's a real operation. Not pitching you a contract, just want to show you something specific to your setup. 10 min?
              </div>
            </div>
            <div style={{ marginTop: 20, fontFamily: "'DM Mono', monospace", fontSize: 9, color: '#00e676', letterSpacing: 2 }}>↳ RESPONDED IN 22 MINUTES.</div>
          </div>
        </div>
        <div style={{ padding: '12px 20px', background: 'var(--card)', border: '1px solid var(--border)', fontFamily: "'DM Mono', monospace", fontSize: 9, color: '#555', letterSpacing: 1 }}>
          ↳ Same payload. Your SMS platform built this from the structured profile DAVID returned. Different tool, same intelligence.
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section style={{ padding: '0 40px 80px', maxWidth: 900 }}>
        <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 11, color: 'var(--muted)', letterSpacing: 3, textTransform: 'uppercase', marginBottom: 40 }}>How It Works</div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 2 }}>
          {[
            { n: '01', title: 'Pull The Specimen', body: 'Find the agent in your Database or run a Search. Every agent ANATHEMA has touched already has a profile. DAVID reads it and formats the payload.' },
            { n: '02', title: 'Request The Payload', body: 'One API call. Pass in the agent. Get back the full structured profile — tree, upline, confidence, signals, context, score. Machine-readable. Ready to inject.' },
            { n: '03', title: 'Your System Takes Over', body: 'Feed the payload into your AI writer, CRM enrichment, or sequencer. It knows who it\'s talking to. What it does with that knowledge is entirely up to you.' },
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
          <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 11, color: 'var(--muted)', letterSpacing: 3, textTransform: 'uppercase', marginBottom: 16 }}>Why David</div>
          <h2 style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 40, letterSpacing: 2, color: 'var(--white)', marginBottom: 20, maxWidth: 700 }}>
            HE STUDIED EVERY HUMAN<br /><span style={{ color: 'var(--orange)' }}>BEFORE THEY WALKED IN THE ROOM.</span>
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
            { label: 'Teams Running AI-Powered Outreach', body: 'Your AI writer is only as good as the context you give it. DAVID gives it the full picture — so the output stops sounding generic.' },
            { label: 'CRM Teams Enriching Contact Records', body: 'Stop staring at a name and a phone number. DAVID enriches every agent record with predicted tree, upline, confidence, and behavioral signals.' },
            { label: 'Sequencer Users Who Want Profile-Driven Routing', body: 'Route agents into different sequences based on their DAVID classification. Integrity captives get one sequence. Independents get another. The data drives the decision.' },
            { label: 'Any Recruiter Whose Outreach Is Being Ignored', body: 'The problem isn\'t your offer. It\'s that your system has no context. DAVID fixes the context. Your system fixes the message.' },
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
            YOUR SYSTEM ALREADY<br /><span style={{ color: 'var(--orange)' }}>KNOWS WHAT TO DO.</span>
          </div>
          <p style={{ fontSize: 16, color: 'var(--muted)', marginBottom: 40, maxWidth: 520 }}>
            Give it the intelligence. DAVID structures everything ANATHEMA knows into a payload your stack can actually use. The rest is yours.
          </p>
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
            <Link href="/dashboard" style={{ padding: '18px 48px', background: 'var(--orange)', border: 'none', color: 'var(--black)', fontFamily: "'Bebas Neue', sans-serif", fontSize: 22, letterSpacing: 3, cursor: 'pointer', textDecoration: 'none' }}>
              ACCESS DASHBOARD
            </Link>
            <Link href="/sign-up" style={{ padding: '18px 32px', background: 'transparent', border: '1px solid var(--border-light)', color: 'var(--muted)', fontFamily: "'DM Mono', monospace", fontSize: 12, letterSpacing: 2, cursor: 'pointer', textDecoration: 'none', display: 'flex', alignItems: 'center' }}>
              CREATE ACCOUNT
            </Link>
          </div>
        </div>
      </section>

      <PageFooter />
    </div>
  )
}
