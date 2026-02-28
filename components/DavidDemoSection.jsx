"use client"

import { useState, useRef } from "react"

// ─── PROFILES ─────────────────────────────────────────────────────────────────
// Each profile has personal_facts — real-feeling scraped signals from ANATHEMA's
// exhaust data. These are what DAVID structures for marketing reuse.
// Messages lead with the most disarming personal fact first, THEN the intel angle.

const PROFILES = {
  integrity: {
    predicted_tree: "INTEGRITY",
    predicted_upline: "Senior Life Insurance Company",
    tree_confidence: 91,
    recruit_score: 34,
    recruit_flag: "COLD",
    stage: "III",
    product_focus: "Medicare Advantage, FFL",
    agency_rating: 4.2,
    review_count: 31,
    hiring_signals: true,
    youtube_presence: false,
    personal_facts: [
      { source: "FACEBOOK", fact: "Commented on an Integrity Summit recap post — 'Best event of the year, our team crushed it'" },
      { source: "GOOGLE REVIEW", fact: "Client wrote: 'She walked me through every option without trying to sell me anything — rare in this business'" },
      { source: "SERP", fact: "Featured in Oklahoma Insurance Today: 'Top Medicare Producers to Watch in 2024'" },
      { source: "WEBSITE", fact: "Bio mentions 'FFL agent since 2019' and references integrityconnect tools by name" },
    ],
    email_subject: (name) => `${fn(name)} — saw the Oklahoma Insurance Today feature`,
    email_body: (name, market, upline) =>
      `${fn(name)} —\n\nCaught your feature in Oklahoma Insurance Today — "Top Medicare Producers to Watch." That's a real recognition, not a paid listing.\n\nOne of your clients wrote that you "walked them through every option without trying to sell anything." That kind of reputation takes years to build.\n\nI know you're deep in the Integrity network right now. Not here to disrupt that. Just want to show you what a conversation looks like from our side — specifically for producers at your level who are starting to think about what's next. 15 minutes?`,
    email_cta: "OPENED. REPLIED: 'HOW DID YOU FIND THAT ARTICLE?'",
    sms_body: (name, market, upline) =>
      `${fn(name)} — saw your Oklahoma Insurance Today feature. Congrats on that. Quick question about your setup under ${upline} — not a pitch, just something specific to your situation. Worth 10 min?`,
    sms_cta: "RESPONDED IN 11 MINUTES.",
  },

  amerilife: {
    predicted_tree: "AMERILIFE",
    predicted_upline: "GoHealth Insurance",
    tree_confidence: 78,
    recruit_score: 41,
    recruit_flag: "WARM",
    stage: "II",
    product_focus: "Medicare Supplement, ACA",
    agency_rating: 4.6,
    review_count: 58,
    hiring_signals: false,
    youtube_presence: true,
    personal_facts: [
      { source: "YOUTUBE", fact: "Video: 'Why I switched from captive to independent Medicare — my honest story' — 2,400 views, posted 8 months ago" },
      { source: "FACEBOOK", fact: "Commented on a GoHealth affiliate post: 'These tools are getting better but still not where I need them'" },
      { source: "GOOGLE REVIEW", fact: "Client wrote: 'Marcus actually called me back on a Saturday. Nobody does that anymore'" },
      { source: "LINKEDIN", fact: "Posted 3 weeks ago: 'Thinking about what the next chapter of my practice looks like. Open to conversations.'" },
    ],
    email_subject: (name) => `${fn(name)} — watched your video on going independent`,
    email_body: (name, market, upline) =>
      `${fn(name)} —\n\nWatched your YouTube video — "Why I switched from captive to independent." Honest take, and 2,400 people thought it was worth their time.\n\nAlso saw your LinkedIn post three weeks ago about thinking through what the next chapter looks like. That's exactly the conversation I want to have.\n\nYou're with ${upline} right now. I know what that setup looks like from the inside. What I want to show you is what it looks like from the outside — specifically for someone with your book and your mindset. Not a contract pitch. An actual conversation. This week?`,
    email_cta: "OPENED. REPLIED: 'YEAH LET'S TALK. THAT VIDEO WAS JUST ME BEING HONEST.'",
    sms_body: (name, market, upline) =>
      `${fn(name)} — watched your video on going independent. Good stuff. Saw your LinkedIn post too — sounds like you're in a thinking moment. I have something specific to your situation under ${upline}. Worth 15 min this week?`,
    sms_cta: "RESPONDED IN 8 MINUTES.",
  },

  independent: {
    predicted_tree: "OTHER",
    predicted_upline: null,
    tree_confidence: 88,
    recruit_score: 82,
    recruit_flag: "HOT",
    stage: null,
    product_focus: "Medicare Advantage, Supplement, Part D",
    agency_rating: 5.0,
    review_count: 94,
    hiring_signals: false,
    youtube_presence: true,
    personal_facts: [
      { source: "YOUTUBE", fact: "Video: 'Medicare Supplement vs Advantage in 2024 — I changed my mind' — 8,800 views, 142 comments" },
      { source: "FACEBOOK GROUP", fact: "Posted in Independent Medicare Agents group: 'Anyone seeing Humana pulling back in rural markets? My clients are getting wrecked'" },
      { source: "GOOGLE REVIEW", fact: "Client wrote: 'She drove 45 minutes to explain my options in person. I've never had an agent do that'" },
      { source: "SERP", fact: "Quoted as local Medicare expert in Tulsa World article on retiree confusion" },
    ],
    email_subject: (name) => `${fn(name)} — the Humana rural market post + your Tulsa World quote`,
    email_body: (name, market) =>
      `${fn(name)} —\n\nSaw your post in the Independent Medicare Agents group about Humana pulling back in rural markets. You're not wrong — and your clients in ${ct(market)} are probably feeling it.\n\nAlso caught your quote in the Tulsa World piece on Medicare confusion. That's the kind of visibility that builds a real practice.\n\n94 reviews, 5 stars, 8,800 views on your Supplement vs Advantage video. You're doing this right and doing it alone.\n\nWe work with a handful of fully independent producers at your level — not to bring you into a network, but to give you access to things the networks hoard. Worth a conversation to see if any of it is relevant to what you're building.`,
    email_cta: "OPENED. REPLIED: 'OKAY YOU HAVE MY ATTENTION. WHAT DO YOU ACTUALLY OFFER?'",
    sms_body: (name, market) =>
      `${fn(name)} — saw your Humana rural market post and your Tulsa World quote. You clearly know what you're doing out there. We work with independents at your level — not to sign you to anything, just to show you what's available. 15 min?`,
    sms_cta: "RESPONDED IN 4 MINUTES.",
  },

  sms_tree: {
    predicted_tree: "SMS",
    predicted_upline: "Senior Market Sales",
    tree_confidence: 69,
    recruit_score: 55,
    recruit_flag: "WARM",
    stage: "II",
    product_focus: "Medicare Supplement, Final Expense",
    agency_rating: 4.8,
    review_count: 22,
    hiring_signals: false,
    youtube_presence: false,
    personal_facts: [
      { source: "FACEBOOK", fact: "Commented on a Senior Market Sales event post: 'Great conference, learned a ton on the annuity side'" },
      { source: "WEBSITE", fact: "Blog post: 'Why I only recommend Mutual of Omaha for my supplement clients' — published 6 months ago" },
      { source: "GOOGLE REVIEW", fact: "Client wrote: 'Bill has been my agent for 11 years. He's the only person I trust with my Medicare'" },
      { source: "SERP", fact: "Local chamber of commerce Business Spotlight: 'the go-to Medicare resource in the county'" },
    ],
    email_subject: (name) => `${fn(name)} — your Mutual of Omaha post + Rethinking Retirement`,
    email_body: (name, market, upline) =>
      `${fn(name)} —\n\nRead your blog post on why you only recommend Mutual of Omaha for supplement clients. Solid reasoning — you clearly know that product cold.\n\nAlso saw you were at the Rethinking Retirement conference. SMS puts on a good event.\n\nOne of your clients wrote that you've been their agent for 11 years. The chamber called you "the go-to Medicare resource in the county." That's not a book of business — that's a community.\n\nNot here to pull you out of anything. I just want to show you what your carrier mix looks like with a different set of options behind it. 15 minutes?`,
    email_cta: "OPENED. REPLIED: 'WHAT DO YOU MEAN BY DIFFERENT OPTIONS?'",
    sms_body: (name, market, upline) =>
      `${fn(name)} — read your Mutual of Omaha post. Good take. Saw you were at Rethinking Retirement too. Quick question about your carrier setup under ${upline} — not a pitch, something specific. Worth 10 min?`,
    sms_cta: "RESPONDED. SAID 'SURE, WHAT'S THIS ABOUT?'",
  },

  unknown: {
    predicted_tree: "UNKNOWN",
    predicted_upline: null,
    tree_confidence: 28,
    recruit_score: 61,
    recruit_flag: "WARM",
    stage: null,
    product_focus: "Life, Health, Medicare",
    agency_rating: 4.3,
    review_count: 11,
    hiring_signals: false,
    youtube_presence: false,
    personal_facts: [
      { source: "FACEBOOK", fact: "Commented on a Western Marketing post about agent tech — 'Western Marketing is the BEST!'" },
      { source: "GOOGLE REVIEW", fact: "Client wrote: 'She explained my Medicare options in a way my own doctor never did'" },
      { source: "WEBSITE", fact: "Homepage tagline: 'Independent. Honest. Local.' — no FMO logos or carrier badges visible anywhere" },
      { source: "SERP", fact: "No press mentions or conference appearances found — quiet operation, likely referral-only growth" },
    ],
    email_subject: (name) => `${fn(name)} — your Western Marketing comment + a question`,
    email_body: (name, market) =>
      `${fn(name)} —\n\nSaw your comment on a Western Marketing post a while back — "Western Marketing is the BEST!" One of your clients wrote that you "explained Medicare in a way their own doctor never did." That combination is actually interesting to me.\n\nYour website says independent. Your digital footprint says something a little different. I'm not saying that's a problem — I'm saying it might be worth a 15-minute conversation about what your setup actually looks like and whether it's working the way you think it is.\n\nNo agenda beyond that.`,
    email_cta: "OPENED. REPLIED: 'THAT'S ODDLY SPECIFIC. WHO ARE YOU?'",
    sms_body: (name, market) =>
      `${fn(name)} — saw your Western Marketing comment from last year. Quick question about your setup — your site says independent but we're picking up some signals worth talking about. Not a pitch. 10 min?`,
    sms_cta: "RESPONDED. CURIOUS AND A LITTLE SPOOKED.",
  },
}

function fn(name) { return name.trim().split(" ")[0] || name.trim() }
function ct(market) { return market.trim().split(",")[0] || market.trim() }

function selectProfile(name, market) {
  const input = (name + " " + market).toLowerCase()
  if (input.includes("integrity") || input.includes("ffl")) return "integrity"
  if (input.includes("ameri") || input.includes("gohealth") || input.includes("marcus")) return "amerilife"
  if (input.includes("sms") || input.includes("omaha") || input.includes("bill")) return "sms_tree"
  if (input.includes("independent") || input.includes("broker") || input.includes("russell")) return "independent"
  if (input.includes("pam") || input.includes("western")) return "unknown"
  const keys = ["independent", "integrity", "amerilife", "sms_tree", "unknown", "independent", "integrity"]
  return keys[name.trim().length % keys.length]
}

const PIPELINE_STEPS = [
  { label: "INITIALIZING DAVID SCAN", duration: 380 },
  { label: "QUERYING SERP SIGNALS", duration: 850 },
  { label: "CRAWLING AGENT WEBSITE", duration: 720 },
  { label: "ANALYZING CARRIER FINGERPRINT", duration: 780 },
  { label: "CROSS-REFERENCING NETWORK INDEX", duration: 640 },
  { label: "EXTRACTING PERSONAL FACT SIGNALS", duration: 700 },
  { label: "STRUCTURING DAVID PAYLOAD", duration: 400 },
]

function flagColor(f) { return f === "HOT" ? "#00e676" : f === "WARM" ? "#ffb300" : "#ff4444" }
function treeColor(t) {
  if (t === "INTEGRITY") return "#f4621f"
  if (t === "AMERILIFE") return "#4fc3f7"
  if (t === "SMS") return "#ce93d8"
  if (t === "OTHER") return "#00e676"
  return "#555"
}

function buildFields(p) {
  return [
    { key: "agent_name", value: p.agent_name, type: "string" },
    { key: "market", value: p.market, type: "string" },
    { key: "recruit_score", value: p.recruit_score, type: "number" },
    { key: "recruit_flag", value: p.recruit_flag, type: "flag" },
    { key: "predicted_tree", value: p.predicted_tree, type: "tree" },
    { key: "predicted_upline", value: p.predicted_upline, type: p.predicted_upline ? "string" : "null" },
    { key: "tree_confidence", value: p.tree_confidence, type: "number" },
    { key: "product_focus", value: p.product_focus, type: "string" },
    { key: "agency_rating", value: p.agency_rating, type: "number" },
    { key: "review_count", value: p.review_count, type: "number" },
    { key: "personal_facts", value: p.personal_facts, type: "facts" },
    { key: "outreach_ready", value: true, type: "bool" },
  ]
}

function sleep(ms) { return new Promise(r => setTimeout(r, ms)) }

const mono = { fontFamily: "'DM Mono', 'Courier New', monospace" }
const bebas = { fontFamily: "'Bebas Neue', sans-serif" }

function Highlight({ text, terms, color }) {
  if (!terms || terms.length === 0) return <span>{text}</span>
  const escaped = terms.filter(Boolean).map(t => t.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'))
  if (escaped.length === 0) return <span>{text}</span>
  try {
    const parts = text.split(new RegExp(`(${escaped.join("|")})`))
    return (
      <>
        {parts.map((p, i) =>
          terms.filter(Boolean).includes(p)
            ? <span key={i} style={{ color: color || "#f4621f", fontWeight: "bold" }}>{p}</span>
            : <span key={i}>{p}</span>
        )}
      </>
    )
  } catch {
    return <span>{text}</span>
  }
}

export default function DavidDemoSection() {
  const [agentName, setAgentName] = useState("")
  const [market, setMarket] = useState("")
  const [phase, setPhase] = useState("idle")
  const [currentStep, setCurrentStep] = useState(-1)
  const [completedSteps, setCompletedSteps] = useState([])
  const [profile, setProfile] = useState(null)
  const [visibleFields, setVisibleFields] = useState([])
  const scanRef = useRef(false)

  const canRun = agentName.trim().length > 1 && market.trim().length > 1
  const accent = profile ? treeColor(profile.predicted_tree) : "#1a1a1a"

  async function runScan() {
    if (!canRun || phase === "scanning") return
    scanRef.current = true
    setPhase("scanning")
    setCurrentStep(-1)
    setCompletedSteps([])
    setVisibleFields([])
    setProfile(null)

    for (let i = 0; i < PIPELINE_STEPS.length; i++) {
      if (!scanRef.current) return
      setCurrentStep(i)
      await sleep(PIPELINE_STEPS[i].duration)
      if (!scanRef.current) return
      setCompletedSteps(prev => [...prev, i])
    }

    const key = selectProfile(agentName, market)
    const p = { ...PROFILES[key], agent_name: agentName.trim(), market: market.trim() }
    setProfile(p)
    setPhase("result")

    const fields = buildFields(p)
    for (let i = 0; i < fields.length; i++) {
      if (!scanRef.current) return
      await sleep(70)
      setVisibleFields(prev => [...prev, i])
    }
  }

  function reset() {
    scanRef.current = false
    setPhase("idle")
    setProfile(null)
    setVisibleFields([])
    setCompletedSteps([])
    setCurrentStep(-1)
    setAgentName("")
    setMarket("")
  }

  const fields = profile ? buildFields(profile) : []
  const highlights = profile
    ? [fn(profile.agent_name), ct(profile.market), profile.predicted_upline, String(profile.agency_rating), String(profile.review_count)].filter(Boolean)
    : []

  const liveEmail = profile ? {
    subject: profile.email_subject(profile.agent_name),
    body: profile.email_body(profile.agent_name, profile.market, profile.predicted_upline || "your network"),
    cta: profile.email_cta,
  } : null

  const liveSMS = profile ? {
    body: profile.sms_body(profile.agent_name, profile.market, profile.predicted_upline || "your network"),
    cta: profile.sms_cta,
  } : null

  return (
    <div style={{ ...mono, color: "#ccc", width: "100%" }}>

      {/* ── PLAYGROUND ── */}
      <div style={{ fontSize: 10, color: "#2a2a2a", letterSpacing: 3, textTransform: "uppercase", marginBottom: 8 }}>
        // DAVID PLAYGROUND — ENTER ANY AGENT TO SCAN
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr auto", gap: 2, marginBottom: 2 }}>
        {[
          { label: "AGENT NAME", val: agentName, set: setAgentName, ph: "e.g. Pam Luthi" },
          { label: "MARKET", val: market, set: setMarket, ph: "e.g. Tulsa, OK" },
        ].map(f => (
          <div key={f.label} style={{ position: "relative" }}>
            <div style={{ position: "absolute", top: 10, left: 14, fontSize: 8, color: "#333", letterSpacing: 3, textTransform: "uppercase", pointerEvents: "none", zIndex: 1 }}>{f.label}</div>
            <input
              value={f.val}
              onChange={e => { f.set(e.target.value); if (phase === "result") reset() }}
              placeholder={f.ph}
              disabled={phase === "scanning"}
              onKeyDown={e => e.key === "Enter" && runScan()}
              style={{ width: "100%", background: "#060606", border: "1px solid #1a1a1a", color: "#fff", ...mono, fontSize: 13, padding: "28px 14px 10px", outline: "none", boxSizing: "border-box", opacity: phase === "scanning" ? 0.5 : 1 }}
            />
          </div>
        ))}
        <button
          onClick={phase === "result" ? reset : runScan}
          disabled={!canRun && phase === "idle"}
          style={{
            background: phase === "result" ? "transparent" : canRun ? "#f4621f" : "#0d0d0d",
            border: phase === "result" ? "1px solid #222" : "1px solid transparent",
            color: phase === "result" ? "#444" : canRun ? "#000" : "#2a2a2a",
            ...mono, fontSize: 10, letterSpacing: 3, textTransform: "uppercase",
            padding: "0 24px", cursor: canRun || phase === "result" ? "pointer" : "default",
            transition: "all 0.2s", whiteSpace: "nowrap", minWidth: 140,
          }}
        >
          {phase === "scanning" ? "SCANNING..." : phase === "result" ? "↩ RESET" : "RUN DAVID →"}
        </button>
      </div>

      {/* Payload panel */}
      <div style={{ background: "#040404", border: "1px solid #141414", borderLeft: `2px solid ${phase === "result" ? accent : "#141414"}`, minHeight: 300, padding: "24px", transition: "border-color 0.5s ease", marginBottom: 2 }}>

        {phase === "idle" && (
          <div style={{ height: 252, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 10 }}>
            <div style={{ fontSize: 9, color: "#1e1e1e", letterSpacing: 5, textTransform: "uppercase" }}>AWAITING INPUT</div>
            <div style={{ width: 32, height: 1, background: "#151515" }} />
            <div style={{ fontSize: 9, color: "#181818", letterSpacing: 2 }}>enter agent name + market above</div>
          </div>
        )}

        {phase === "scanning" && (
          <div>
            <div style={{ fontSize: 9, color: "#333", letterSpacing: 3, textTransform: "uppercase", marginBottom: 24 }}>
              // DAVID SCAN PIPELINE — {agentName}, {market}
            </div>
            {PIPELINE_STEPS.map((step, i) => {
              const done = completedSteps.includes(i)
              const active = currentStep === i && !done
              return (
                <div key={i} style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 12, opacity: i > currentStep ? 0.15 : 1, transition: "opacity 0.4s" }}>
                  <span style={{ fontSize: 11, color: done ? "#00e676" : active ? "#f4621f" : "#2a2a2a", width: 14, transition: "color 0.3s", flexShrink: 0 }}>
                    {done ? "✓" : active ? "▶" : "○"}
                  </span>
                  <span style={{ fontSize: 11, letterSpacing: 2, textTransform: "uppercase", color: done ? "#3a3a3a" : active ? "#e0e0e0" : "#2a2a2a", transition: "color 0.3s" }}>
                    {step.label}
                  </span>
                  {active && <span style={{ fontSize: 10, color: "#f4621f", animation: "blink 0.7s infinite", marginLeft: 4 }}>■</span>}
                  {done && <span style={{ marginLeft: "auto", fontSize: 9, color: "#1e1e1e", letterSpacing: 2 }}>DONE</span>}
                </div>
              )
            })}
          </div>
        )}

        {phase === "result" && profile && (
          <div style={{ fontSize: 12, lineHeight: 1.9 }}>
            <div style={{ fontSize: 9, color: "#333", letterSpacing: 2, marginBottom: 14 }}>
              // DAVID API RESPONSE — agent: {profile.agent_name}, {profile.market}
            </div>
            <span style={{ color: "#2a2a2a" }}>{"{"}</span>
            <div style={{ paddingLeft: 22 }}>
              {fields.map((field, i) => {
                if (!visibleFields.includes(i)) return null

                if (field.type === "facts") return (
                  <div key={field.key} style={{ marginBottom: 4 }}>
                    <span style={{ color: "#4fc3f7" }}>"{field.key}"</span><span style={{ color: "#2a2a2a" }}>: [</span>
                    <div style={{ paddingLeft: 20 }}>
                      {field.value.map((fact, fi) => (
                        <div key={fi} style={{ marginBottom: 6 }}>
                          <span style={{ color: "#2a2a2a" }}>{"{"}</span>
                          <div style={{ paddingLeft: 16 }}>
                            <div>
                              <span style={{ color: "#888" }}>"source"</span><span style={{ color: "#2a2a2a" }}>: </span>
                              <span style={{ color: accent, fontWeight: "bold" }}>"{fact.source}"</span><span style={{ color: "#2a2a2a" }}>,</span>
                            </div>
                            <div>
                              <span style={{ color: "#888" }}>"fact"</span><span style={{ color: "#2a2a2a" }}>: </span>
                              <span style={{ color: "#e0e0e0" }}>"{fact.fact}"</span>
                            </div>
                          </div>
                          <span style={{ color: "#2a2a2a" }}>{"}"}{fi < field.value.length - 1 ? "," : ""}</span>
                        </div>
                      ))}
                    </div>
                    <span style={{ color: "#2a2a2a" }}>],</span>
                  </div>
                )

                let val
                if (field.type === "flag") val = <span style={{ color: flagColor(field.value), fontWeight: "bold" }}>"{field.value}"</span>
                else if (field.type === "tree") val = <span style={{ color: treeColor(field.value), fontWeight: "bold" }}>"{field.value}"</span>
                else if (field.type === "number") val = <span style={{ color: "#f4621f" }}>{field.value}</span>
                else if (field.type === "bool") val = <span style={{ color: field.value ? "#00e676" : "#ff4444" }}>{String(field.value)}</span>
                else if (field.type === "null") val = <span style={{ color: "#333" }}>null</span>
                else val = <span style={{ color: "#7cb87e" }}>"{field.value}"</span>

                return (
                  <div key={field.key}>
                    <span style={{ color: "#4fc3f7" }}>"{field.key}"</span><span style={{ color: "#2a2a2a" }}>: </span>{val}
                    {i < fields.length - 1 && <span style={{ color: "#2a2a2a" }}>,</span>}
                  </div>
                )
              })}
            </div>
            {visibleFields.length === fields.length && <span style={{ color: "#2a2a2a" }}>{"}"}</span>}
          </div>
        )}
      </div>

      {/* Personal facts banner */}
      {phase === "result" && profile && (
        <div style={{ marginBottom: 2, padding: "14px 20px", background: "#070707", border: "1px solid #141414", borderLeft: `2px solid ${accent}`, display: "flex", alignItems: "center", gap: 16, flexWrap: "wrap" }}>
          <span style={{ fontSize: 9, color: accent, letterSpacing: 3, textTransform: "uppercase" }}>
            ◈ {profile.personal_facts.length} PERSONAL FACTS EXTRACTED
          </span>
          <span style={{ fontSize: 9, color: "#333", letterSpacing: 1 }}>
            {profile.personal_facts.map(f => f.source).join(" · ")}
          </span>
          <span style={{ marginLeft: "auto", fontSize: 9, color: "#2a2a2a", letterSpacing: 2, textTransform: "uppercase" }}>
            ANATHEMA EXHAUST → DAVID STRUCTURE
          </span>
        </div>
      )}

      <div style={{ marginBottom: 80, padding: "11px 16px", background: "#040404", border: "1px solid #141414", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 8 }}>
        <div style={{ fontSize: 9, color: "#2a2a2a", letterSpacing: 1 }}>
          ↳ Personal facts are ANATHEMA exhaust — data already pulled for tree detection, now structured for marketing reuse. Zero additional cost.
        </div>
        {phase === "result" && profile && (
          <span style={{ fontSize: 9, color: accent, letterSpacing: 2, textTransform: "uppercase", borderLeft: `1px solid ${accent}`, paddingLeft: 12 }}>
            {profile.predicted_tree} · {profile.recruit_flag}
          </span>
        )}
      </div>

      {/* ── EMAIL ── */}
      <div style={{ marginBottom: 32 }}>
        <div style={{ fontSize: 11, color: "var(--muted, #888)", letterSpacing: 3, textTransform: "uppercase", marginBottom: 12 }}>Email — What Changes</div>
        <h2 style={{ ...bebas, fontSize: "clamp(36px, 5vw, 56px)", letterSpacing: 2, color: "var(--white, #f0ede8)", marginBottom: 10, lineHeight: 1 }}>
          SAME AGENT. <span style={{ color: "var(--orange, #f4621f)" }}>DIFFERENT WORLD.</span>
        </h2>
        <div style={{ ...mono, fontSize: 10, color: phase === "result" ? accent : "#2a2a2a", letterSpacing: 2, textTransform: "uppercase", marginBottom: 32, display: "flex", alignItems: "center", gap: 8, transition: "color 0.5s" }}>
          {phase === "result"
            ? <><span style={{ width: 16, height: 1, background: accent, display: "inline-block" }} />personal facts loaded — outreach built for {fn(agentName)}</>
            : "run a scan above to see personal facts drive the message ↑"
          }
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 2, marginBottom: 2 }}>
        <div style={{ background: "var(--card, #0d0d0d)", border: "1px solid var(--border, #1a1a1a)", borderLeft: "3px solid #ff3344", padding: "32px 28px" }}>
          <div style={{ ...mono, fontSize: 9, letterSpacing: 3, color: "#ff3344", textTransform: "uppercase", marginBottom: 20 }}>// Without DAVID — No Context</div>
          <div style={{ ...mono, fontSize: 11, color: "var(--muted, #888)", lineHeight: 2 }}>
            <div style={{ color: "#444", marginBottom: 12 }}>Subject: <span style={{ textDecoration: "line-through" }}>Exciting opportunity for insurance agents</span></div>
            <div style={{ textDecoration: "line-through", opacity: 0.4, lineHeight: 1.9 }}>
              <p>Hey {phase === "result" ? fn(agentName) : "there"},</p><br />
              <p>I came across your profile and wanted to connect about joining our FMO. We offer top contracts, great commissions, and a dedicated support team.</p><br />
              <p>Let me know if you'd like to hop on a quick call!</p>
            </div>
          </div>
          <div style={{ marginTop: 20, ...mono, fontSize: 9, color: "#ff3344", letterSpacing: 2 }}>↳ DELETED. SAME AS THE LAST 14.</div>
        </div>

        <div style={{ background: "var(--card, #0d0d0d)", border: "1px solid var(--border, #1a1a1a)", borderLeft: `3px solid ${phase === "result" ? accent : "#1a3a1a"}`, padding: "32px 28px", transition: "border-color 0.5s" }}>
          <div style={{ ...mono, fontSize: 9, letterSpacing: 3, color: phase === "result" ? "#00e676" : "#1a3a1a", textTransform: "uppercase", marginBottom: 20, transition: "color 0.5s" }}>
            // With DAVID — Personal Facts Drive The Opener
          </div>
          <div style={{ ...mono, fontSize: 11, color: "var(--muted, #888)", lineHeight: 2 }}>
            {phase !== "result" ? (
              <div style={{ color: "#222", fontStyle: "italic", paddingTop: 20, lineHeight: 1.8 }}>
                Waiting for scan...<br /><span style={{ color: "#181818" }}>Personal facts will shape this message once DAVID runs.</span>
              </div>
            ) : (
              <>
                <div style={{ color: "#888", marginBottom: 12 }}>Subject: <span style={{ color: "var(--orange, #f4621f)" }}>{liveEmail.subject}</span></div>
                <div style={{ whiteSpace: "pre-line", color: "#bbb", lineHeight: 1.9 }}>
                  <Highlight text={liveEmail.body} terms={highlights} color="var(--orange, #f4621f)" />
                </div>
              </>
            )}
          </div>
          {phase === "result" && <div style={{ marginTop: 20, ...mono, fontSize: 9, color: "#00e676", letterSpacing: 2 }}>↳ {liveEmail.cta}</div>}
        </div>
      </div>

      <div style={{ marginBottom: 80, padding: "12px 20px", background: "var(--card, #0d0d0d)", border: "1px solid var(--border, #1a1a1a)", ...mono, fontSize: 9, color: "#555", letterSpacing: 1 }}>
        ↳ Your AI writer received the DAVID payload — personal facts, tree intel, behavioral signals — and built this. We gave it the intelligence. It did the writing.
      </div>

      {/* ── SMS ── */}
      <div style={{ marginBottom: 32 }}>
        <div style={{ fontSize: 11, color: "var(--muted, #888)", letterSpacing: 3, textTransform: "uppercase", marginBottom: 12 }}>SMS — What Changes</div>
        <h2 style={{ ...bebas, fontSize: "clamp(36px, 5vw, 56px)", letterSpacing: 2, color: "var(--white, #f0ede8)", marginBottom: 10, lineHeight: 1 }}>
          ONE TEXT. <span style={{ color: "var(--orange, #f4621f)" }}>ONE SHOT.</span>
        </h2>
        <div style={{ ...mono, fontSize: 10, color: phase === "result" ? accent : "#2a2a2a", letterSpacing: 2, textTransform: "uppercase", marginBottom: 32, display: "flex", alignItems: "center", gap: 8, transition: "color 0.5s" }}>
          {phase === "result"
            ? <><span style={{ width: 16, height: 1, background: accent, display: "inline-block" }} />same payload — one fact, one shot</>
            : "run a scan above to see live personalization ↑"
          }
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 2, marginBottom: 2 }}>
        <div style={{ background: "var(--card, #0d0d0d)", border: "1px solid var(--border, #1a1a1a)", borderLeft: "3px solid #ff3344", padding: "32px 28px" }}>
          <div style={{ ...mono, fontSize: 9, letterSpacing: 3, color: "#ff3344", textTransform: "uppercase", marginBottom: 20 }}>// Without DAVID</div>
          <div style={{ background: "#0a0a0a", border: "1px solid #1a1a1a", borderRadius: 2, padding: "16px 18px", maxWidth: 280 }}>
            <div style={{ ...mono, fontSize: 11, color: "#555", lineHeight: 1.8, textDecoration: "line-through", opacity: 0.5 }}>
              Hi {phase === "result" ? fn(agentName) : "there"}! I'm reaching out about an amazing opportunity to grow your Medicare book with our FMO. We'd love to connect!
            </div>
          </div>
          <div style={{ marginTop: 20, ...mono, fontSize: 9, color: "#ff3344", letterSpacing: 2 }}>↳ IGNORED. FEELS LIKE SPAM.</div>
        </div>

        <div style={{ background: "var(--card, #0d0d0d)", border: "1px solid var(--border, #1a1a1a)", borderLeft: `3px solid ${phase === "result" ? accent : "#1a3a1a"}`, padding: "32px 28px", transition: "border-color 0.5s" }}>
          <div style={{ ...mono, fontSize: 9, letterSpacing: 3, color: phase === "result" ? "#00e676" : "#1a3a1a", textTransform: "uppercase", marginBottom: 20, transition: "color 0.5s" }}>
            // With DAVID — Leads With A Fact They Recognize
          </div>
          <div style={{ background: "#0a0a0a", border: "1px solid #1a1a1a", borderRadius: 2, padding: "16px 18px", maxWidth: 280 }}>
            {phase !== "result" ? (
              <div style={{ ...mono, fontSize: 11, color: "#1e1e1e", lineHeight: 1.8, fontStyle: "italic" }}>Waiting for payload...</div>
            ) : (
              <div style={{ ...mono, fontSize: 11, color: "var(--muted, #888)", lineHeight: 1.8 }}>
                <Highlight text={liveSMS.body} terms={highlights} color="var(--orange, #f4621f)" />
              </div>
            )}
          </div>
          {phase === "result" && <div style={{ marginTop: 20, ...mono, fontSize: 9, color: "#00e676", letterSpacing: 2 }}>↳ {liveSMS.cta}</div>}
        </div>
      </div>

      <div style={{ padding: "12px 20px", background: "var(--card, #0d0d0d)", border: "1px solid var(--border, #1a1a1a)", ...mono, fontSize: 9, color: "#555", letterSpacing: 1 }}>
        ↳ Same payload. One personal fact. The agent thinks you actually looked them up. You did — six months ago, for a completely different reason.
      </div>

      <style>{`
        @keyframes blink { 0%,100%{opacity:1} 50%{opacity:0} }
        input::placeholder { color: #1e1e1e !important; }
        input:focus { border-color: #2a2a2a !important; outline: none; }
      `}</style>
    </div>
  )
}
