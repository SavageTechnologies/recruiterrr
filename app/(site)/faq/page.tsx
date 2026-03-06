import Link from 'next/link'

const FAQS = [
  { q: 'What kinds of agents does Recruiterrr find?', a: 'We find independent life, health, Medicare, and senior insurance agents — anyone with a Google business listing in your target market. We flag captive agents (State Farm, Bankers Life, etc.) separately so you can filter them out.' },
  { q: 'How accurate is the data?', a: 'We pull live data on every search — no cached databases. Reviews, ratings, and web presence are pulled fresh from Google. AI scoring is based on signals from that same search, so what you see is current.' },
  { q: 'How many agents does a typical search return?', a: 'Between 10 and 50, depending on the market size and how many results you request. Major metros like Dallas or Miami may return 40+ agents. Smaller markets might return 8–12. You can adjust the result limit in the search bar.' },
  { q: 'What does HOT, WARM, and COLD mean?', a: 'HOT (75–100) means the agent shows strong independent signals — multi-carrier, Medicare/senior focus, good reviews, no captive branding. WARM (50–74) is worth a call but less certain. COLD (0–49) is likely captive, inactive, or a poor fit.' },
  { q: 'What does the HIRING badge mean?', a: "It means we found an active job posting for that agency on Google Jobs — usually for a role like 'Insurance Sales Agent' or 'Medicare Sales Rep.' Agencies that are actively hiring are growing, have budget, and are already thinking about adding producers — which makes them prime FMO recruiting targets." },
  { q: 'What does the YouTube badge mean?', a: "That agent or agency has a YouTube presence with Medicare or insurance content. This signals they're independent, tech-savvy, and actively building a brand — the type of producer most likely to be open to a better platform." },
  { q: 'How many searches can I run?', a: 'The free trial includes a limited number of searches per hour. Paid plans unlock higher limits. Check the pricing page for current tiers.' },
  { q: 'Does this work for non-Medicare lines like life or ACA?', a: 'Yes. We search for "health insurance agent," "life insurance agent," and "Medicare supplement agent" queries in parallel. The scoring AI is calibrated for Medicare and senior products right now, but we plan to add line-specific scoring modes.' },
  { q: 'Is this legal to use for recruiting?', a: "All data we collect is publicly available — Google business listings, public websites, public job postings. We don't access private records or licensed producer databases. We're just reading what's already public and scoring it intelligently. For NIPR/licensed producer data access, that's a Phase 2 feature requiring a separate subscriber agreement." },
  { q: 'Can I export results?', a: 'CSV export is on the roadmap. For now, results are displayed in the app and saved to your search history so you can reference them any time.' },
]

export default function FAQPage() {
  return (
    <>
      <section className="site-section site-section-paper">
        <div className="site-inner">
          <div className="site-eyebrow-orange">FAQ</div>
          <h1 className="site-h1">COMMON<br /><span>QUESTIONS.</span></h1>
          <p className="site-lead" style={{ maxWidth: 520, marginBottom: 0 }}>
            Everything you need to know about how Recruiterrr works.
          </p>
        </div>
      </section>

      <section className="site-section site-section-white site-section-divider">
        <div className="site-inner">
          <div style={{ display: 'flex', flexDirection: 'column', gap: 2, maxWidth: 800 }}>
            {FAQS.map((faq, i) => (
              <div key={i} style={{ padding: '32px 28px', background: 'var(--site-white)', border: '1px solid var(--site-border)', borderRadius: i === 0 ? '6px 6px 0 0' : i === FAQS.length - 1 ? '0 0 6px 6px' : 0, marginTop: i === 0 ? 0 : -1 }}>
                <div style={{ fontFamily: "'DM Sans', sans-serif", fontWeight: 600, fontSize: 15, color: 'var(--site-ink)', marginBottom: 10 }}>{faq.q}</div>
                <p className="site-body" style={{ fontSize: 14 }}>{faq.a}</p>
              </div>
            ))}
          </div>

          <div style={{ marginTop: 48, paddingTop: 40, borderTop: '1px solid var(--site-border)' }}>
            <div className="site-eyebrow" style={{ marginBottom: 12 }}>Still have questions?</div>
            <p className="site-body" style={{ marginBottom: 20 }}>Can&apos;t find what you&apos;re looking for? Reach out directly.</p>
            <Link href="/contact" className="site-btn-ghost">Contact Us →</Link>
          </div>
        </div>
      </section>
    </>
  )
}
