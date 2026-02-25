import Link from 'next/link'
import PageNav from '@/components/PageNav'
import PageFooter from '@/components/PageFooter'

export default function AboutPage() {
  return (
    <div style={{ minHeight: '100vh', background: 'var(--black)', color: 'var(--white)' }}>
      <PageNav />

      <div style={{ maxWidth: 760, padding: '80px 40px' }}>
        <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 11, color: 'var(--orange)', letterSpacing: 3, textTransform: 'uppercase', marginBottom: 16 }}>About</div>
        <h1 style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 72, letterSpacing: 2, lineHeight: 0.9, marginBottom: 48, color: 'var(--white)' }}>
          BUILT FOR<br /><span style={{ color: 'var(--orange)' }}>RECRUITERS.</span>
        </h1>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 32, fontSize: 16, color: 'var(--muted)', lineHeight: 1.8 }}>
          <p>
            Recruiting independent insurance agents is one of the hardest parts of building an FMO or IMO. The agents worth recruiting are usually the hardest to find — they don't respond to cold emails, they're not on lead lists, and they've heard every pitch before.
          </p>
          <p>
            Recruiterrr was built to change that. Instead of buying stale lists or cold calling blind, you get a real-time intelligence feed on every independent agent in any market — their reviews, their carriers, their web presence, whether they're hiring, and whether they have a YouTube channel.
          </p>
          <p>
            Every agent gets a score. <span style={{ color: 'var(--green)' }}>HOT</span> means they're independent, established, multi-carrier, and likely open to a better deal. <span style={{ color: 'var(--yellow)' }}>WARM</span> means worth a call. <span style={{ color: '#555' }}>COLD</span> means skip it and move on.
          </p>
          <p>
            We built this for life, health, Medicare, and senior insurance recruiters who are done wasting time on leads that go nowhere. If you're growing a downline, building a team, or expanding into a new market — this is the tool we wish we had.
          </p>

          <div style={{ borderTop: '1px solid var(--border)', paddingTop: 32 }}>
            <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 10, color: 'var(--muted)', letterSpacing: 2, textTransform: 'uppercase', marginBottom: 20 }}>How We Do It</div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 2 }}>
              {[
                ['Market Intelligence Layer', 'Proprietary data aggregation across public business registries, review platforms, and local directories — updated live on every search.'],
                ['Presence Analysis Engine', 'Automated deep crawl of agent web properties to extract carrier relationships, independence signals, and product focus areas.'],
                ['Labor Signal Detection', 'Real-time monitoring of employment activity to identify agencies actively expanding their producer headcount.'],
                ['Digital Footprint Scoring', 'Cross-platform content analysis that surfaces agents building public-facing brands — a strong proxy for independence and tech adoption.'],
                ['Proprietary Scoring Model', 'An insurance-industry-trained AI model that synthesizes all available signals into a single recruitability score, calibrated specifically for FMO and IMO use cases.'],
                ['Live Data Architecture', 'No static databases. No purchased lists. Every search executes the full pipeline in real time — so the intelligence you get is always current.'],
              ].map(([title, desc]) => (
                <div key={title} style={{ background: 'var(--card)', border: '1px solid var(--border)', padding: '20px' }}>
                  <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 10, color: 'var(--orange)', letterSpacing: 1, marginBottom: 6 }}>{title}</div>
                  <div style={{ fontSize: 13, color: '#444' }}>{desc}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <PageFooter />
    </div>
  )
}
