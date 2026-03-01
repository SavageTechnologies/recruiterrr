const DAVID = '#a78bfa'
const mono = { fontFamily: "'DM Mono', monospace" }
const bebas = { fontFamily: "'Bebas Neue', sans-serif" }

const PAYLOAD = {
  agent_name: 'John Smith',
  market: 'Oklahoma City, OK',
  recruit_score: 78,
  recruit_flag: 'WARM',
  predicted_tree: 'INTEGRITY',
  tree_confidence: 81,
  product_focus: 'Medicare Advantage, Medicare Supplement, Part D',
  agency_rating: 5.0,
  review_count: 40,
  personal_facts: [
    { source: 'YOUTUBE', fact: 'Published a video about Medicaid benefits for veterans — 3,200 views, posted 6 weeks ago' },
    { source: 'SERP', fact: 'Recognized as Best Insurance Agency in Moore and South OKC in 2025' },
    { source: 'GOOGLE REVIEW', fact: 'Client wrote: "John helped me sort out a Form 1095-A issue my accountant couldn\'t figure out — went way beyond what I expected"' },
    { source: 'FACEBOOK', fact: 'Posted photos from NAIFA Oklahoma annual conference last month — tagged the event and two other attendees' },
  ],
}

const FIELDS = [
  { key: 'agent_name', val: `"${PAYLOAD.agent_name}"`, color: '#7cb87e' },
  { key: 'market', val: `"${PAYLOAD.market}"`, color: '#7cb87e' },
  { key: 'recruit_score', val: PAYLOAD.recruit_score, color: DAVID },
  { key: 'recruit_flag', val: `"${PAYLOAD.recruit_flag}"`, color: '#ffb300' },
  { key: 'predicted_tree', val: `"${PAYLOAD.predicted_tree}"`, color: '#f4621f' },
  { key: 'tree_confidence', val: PAYLOAD.tree_confidence, color: DAVID },
  { key: 'product_focus', val: `"${PAYLOAD.product_focus}"`, color: '#7cb87e' },
  { key: 'agency_rating', val: PAYLOAD.agency_rating, color: DAVID },
  { key: 'review_count', val: PAYLOAD.review_count, color: DAVID },
  { key: 'outreach_ready', val: 'true', color: '#00e676' },
]

export default function DavidDemoSection() {
  return (
    <div style={{ ...mono, color: '#ccc', width: '100%' }}>

      {/* ── PAYLOAD ── */}
      <div style={{ fontSize: 10, color: '#2a2a2a', letterSpacing: 3, textTransform: 'uppercase', marginBottom: 8 }}>
        // DAVID API RESPONSE
      </div>

      <div style={{ background: '#040404', border: '1px solid #141414', borderLeft: `2px solid ${DAVID}`, padding: '24px', marginBottom: 2 }}>
        <div style={{ fontSize: 9, color: '#333', letterSpacing: 2, marginBottom: 14 }}>
          // agent: {PAYLOAD.agent_name}, {PAYLOAD.market}
        </div>
        <div style={{ fontSize: 12, lineHeight: 1.9 }}>
          <span style={{ color: '#2a2a2a' }}>{'{'}</span>
          <div style={{ paddingLeft: 22 }}>
            {FIELDS.map((f, i) => (
              <div key={f.key}>
                <span style={{ color: '#4fc3f7' }}>"{f.key}"</span>
                <span style={{ color: '#2a2a2a' }}>: </span>
                <span style={{ color: f.color }}>{f.val}</span>
                {i < FIELDS.length - 1 && <span style={{ color: '#2a2a2a' }}>,</span>}
              </div>
            ))}
            <div>
              <span style={{ color: '#4fc3f7' }}>"personal_facts"</span>
              <span style={{ color: '#2a2a2a' }}>: [</span>
              <div style={{ paddingLeft: 20 }}>
                {PAYLOAD.personal_facts.map((fact, i) => (
                  <div key={i} style={{ marginBottom: 6 }}>
                    <span style={{ color: '#2a2a2a' }}>{'{'}</span>
                    <div style={{ paddingLeft: 16 }}>
                      <div><span style={{ color: '#888' }}>"source"</span><span style={{ color: '#2a2a2a' }}>: </span><span style={{ color: DAVID }}>"{fact.source}"</span><span style={{ color: '#2a2a2a' }}>,</span></div>
                      <div><span style={{ color: '#888' }}>"fact"</span><span style={{ color: '#2a2a2a' }}>: </span><span style={{ color: '#e0e0e0' }}>"{fact.fact}"</span></div>
                    </div>
                    <span style={{ color: '#2a2a2a' }}>{'}'}{i < PAYLOAD.personal_facts.length - 1 ? ',' : ''}</span>
                  </div>
                ))}
              </div>
              <span style={{ color: '#2a2a2a' }}>]</span>
            </div>
          </div>
          <span style={{ color: '#2a2a2a' }}>{'}'}</span>
        </div>
      </div>

      <div style={{ marginBottom: 80, padding: '11px 16px', background: '#040404', border: '1px solid #141414', fontSize: 9, color: '#2a2a2a', letterSpacing: 1 }}>
        ↳ One API call. Full structured profile. Your system decides what to do with it.
      </div>

      {/* ── EMAIL ── */}
      <div style={{ marginBottom: 40 }}>
        <div style={{ fontSize: 11, color: 'var(--muted)', letterSpacing: 3, textTransform: 'uppercase', marginBottom: 12 }}>Email — What Changes</div>
        <h2 style={{ ...bebas, fontSize: 'clamp(36px, 5vw, 56px)', letterSpacing: 2, color: 'var(--white)', marginBottom: 40, lineHeight: 1 }}>
          SAME PRODUCER. <span style={{ color: DAVID }}>DIFFERENT WORLD.</span>
        </h2>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2, marginBottom: 2 }}>
        <div style={{ background: 'var(--card)', border: '1px solid var(--border)', borderLeft: '3px solid #ff3344', padding: '32px 28px' }}>
          <div style={{ ...mono, fontSize: 9, letterSpacing: 3, color: '#ff3344', textTransform: 'uppercase', marginBottom: 20 }}>// Without DAVID — No Context</div>
          <div style={{ ...mono, fontSize: 11, color: 'var(--muted)', lineHeight: 2 }}>
            <div style={{ color: '#444', marginBottom: 12 }}>Subject: <span style={{ textDecoration: 'line-through' }}>Exciting opportunity for insurance producers</span></div>
            <div style={{ textDecoration: 'line-through', opacity: 0.4, lineHeight: 1.9 }}>
              <p>Hey John,</p><br />
              <p>I came across your profile and wanted to connect about an opportunity with our organization. We offer great contracts, strong support, and competitive commissions.</p><br />
              <p>Let me know if you'd like to connect!</p>
            </div>
          </div>
          <div style={{ marginTop: 20, ...mono, fontSize: 9, color: '#ff3344', letterSpacing: 2 }}>↳ DELETED. SAME AS THE LAST 14.</div>
        </div>

        <div style={{ background: 'var(--card)', border: '1px solid var(--border)', borderLeft: `3px solid ${DAVID}`, padding: '32px 28px' }}>
          <div style={{ ...mono, fontSize: 9, letterSpacing: 3, color: DAVID, textTransform: 'uppercase', marginBottom: 20 }}>// With DAVID — Opens With What They Care About</div>
          <div style={{ ...mono, fontSize: 11, color: 'var(--muted)', lineHeight: 2 }}>
            <div style={{ color: '#888', marginBottom: 12 }}>Subject: <span style={{ color: DAVID }}>John — the veterans Medicaid video + Best Agency in Moore</span></div>
            <div style={{ whiteSpace: 'pre-line', color: '#bbb', lineHeight: 1.9 }}>{`John —

Watched your video on Medicaid benefits for veterans. That's a niche most producers never bother to learn — the fact that you made a video about it says a lot.

Also saw the Best Insurance Agency recognition in Moore and South OKC. Congrats on that — a 5-star rating with 40 reviews doesn't happen by accident.

I'd like to have a conversation when you have 15 minutes. No pitch — just want to learn more about what you're building out there.`}</div>
          </div>
          <div style={{ marginTop: 20, ...mono, fontSize: 9, color: '#00e676', letterSpacing: 2 }}>↳ OPENED. REPLIED: "HOW DID YOU FIND THAT VIDEO?"</div>
        </div>
      </div>

      <div style={{ marginBottom: 80, padding: '12px 20px', background: 'var(--card)', border: '1px solid var(--border)', ...mono, fontSize: 9, color: '#555', letterSpacing: 1 }}>
        ↳ Your AI writer received the DAVID payload — personal facts, awards, content signals — and built this. We gave it the intelligence. It did the writing.
      </div>

      {/* ── SMS ── */}
      <div style={{ marginBottom: 40 }}>
        <div style={{ fontSize: 11, color: 'var(--muted)', letterSpacing: 3, textTransform: 'uppercase', marginBottom: 12 }}>SMS — What Changes</div>
        <h2 style={{ ...bebas, fontSize: 'clamp(36px, 5vw, 56px)', letterSpacing: 2, color: 'var(--white)', marginBottom: 40, lineHeight: 1 }}>
          ONE TEXT. <span style={{ color: DAVID }}>ONE SHOT.</span>
        </h2>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2, marginBottom: 2 }}>
        <div style={{ background: 'var(--card)', border: '1px solid var(--border)', borderLeft: '3px solid #ff3344', padding: '32px 28px' }}>
          <div style={{ ...mono, fontSize: 9, letterSpacing: 3, color: '#ff3344', textTransform: 'uppercase', marginBottom: 20 }}>// Without DAVID</div>
          <div style={{ background: '#0a0a0a', border: '1px solid #1a1a1a', borderRadius: 2, padding: '16px 18px', maxWidth: 280 }}>
            <div style={{ ...mono, fontSize: 11, color: '#555', lineHeight: 1.8, textDecoration: 'line-through', opacity: 0.5 }}>
              Hi John! I'm reaching out about a great opportunity to grow your book. We'd love to connect!
            </div>
          </div>
          <div style={{ marginTop: 20, ...mono, fontSize: 9, color: '#ff3344', letterSpacing: 2 }}>↳ IGNORED. FEELS LIKE SPAM.</div>
        </div>

        <div style={{ background: 'var(--card)', border: '1px solid var(--border)', borderLeft: `3px solid ${DAVID}`, padding: '32px 28px' }}>
          <div style={{ ...mono, fontSize: 9, letterSpacing: 3, color: DAVID, textTransform: 'uppercase', marginBottom: 20 }}>// With DAVID — Leads With What They'll Recognize</div>
          <div style={{ background: '#0a0a0a', border: '1px solid #1a1a1a', borderRadius: 2, padding: '16px 18px', maxWidth: 280 }}>
            <div style={{ ...mono, fontSize: 11, color: 'var(--muted)', lineHeight: 1.8 }}>
              John — saw your veterans Medicaid video and the Best Agency recognition in Moore. Genuinely impressive. Would love to connect when you have 10 minutes — no pitch, just a conversation.
            </div>
          </div>
          <div style={{ marginTop: 20, ...mono, fontSize: 9, color: '#00e676', letterSpacing: 2 }}>↳ RESPONDED IN 7 MINUTES.</div>
        </div>
      </div>

      <div style={{ padding: '12px 20px', background: 'var(--card)', border: '1px solid var(--border)', ...mono, fontSize: 9, color: '#555', letterSpacing: 1 }}>
        ↳ Same payload. Two personal facts they actually remember. The producer thinks you did your homework. You did — automatically, on every agent in your pipeline.
      </div>

    </div>
  )
}
