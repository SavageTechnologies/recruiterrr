import PageHeader from '@/components/ui/PageHeader'
import Card from '@/components/ui/Card'

const HOW_WE_DO_IT = [
  ['Market Intelligence Layer', 'Proprietary data aggregation across public business registries, review platforms, and local directories — updated live on every search.'],
  ['Presence Analysis Engine', 'Automated deep crawl of agent web properties to extract carrier relationships, independence signals, and product focus areas.'],
  ['Labor Signal Detection', 'Real-time monitoring of employment activity to identify agencies actively expanding their producer headcount.'],
  ['Digital Footprint Scoring', 'Cross-platform content analysis that surfaces agents building public-facing brands — a strong proxy for independence and tech adoption.'],
  ['Proprietary Scoring Model', 'An insurance-industry-trained AI model that synthesizes all available signals into a single recruitability score, calibrated specifically for FMO and IMO use cases.'],
  ['Live Data Architecture', 'No static databases. No purchased lists. Every search executes the full pipeline in real time — so the intelligence you get is always current.'],
]

export default function AboutPage() {
  return (
    <div style={{ maxWidth: 760, padding: '80px 40px' }}>
      <PageHeader label="About" title="BUILT FOR" accent="RECRUITERS." />

      <div style={{ display: 'flex', flexDirection: 'column', gap: 24, fontSize: 15, color: 'var(--muted)', lineHeight: 1.9, marginBottom: 64 }}>
        <p>Recruiting independent insurance and financial professionals is one of the hardest parts of building an FMO, IMO, or advisory firm. The producers worth recruiting are usually the hardest to find — they don't respond to cold emails, they're not on lead lists, and they've heard every pitch before.</p>
        <p>Recruiterrr was built to change that. Instead of buying stale lists or cold calling blind, you get a real-time intelligence feed on every independent producer in any market — their reviews, their carriers, their web presence, whether they're hiring, and whether they have a YouTube channel.</p>
        <p>We started in the Medicare and senior health space because that's where the recruiting problem is most acute. But the platform is built to work across life, ACA, annuities, and financial advisory — any market where independence is the signal and the right conversation is worth finding.</p>
        <p>If you're growing a downline, building a team, or expanding into a new market — this is the tool we wish we had.</p>
      </div>

      <div style={{ borderTop: '1px solid var(--border)', paddingTop: 40 }}>
        <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 10, color: 'var(--muted)', letterSpacing: 3, textTransform: 'uppercase', marginBottom: 24 }}>How We Do It</div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 2 }}>
          {HOW_WE_DO_IT.map(([title, desc]) => (
            <Card key={title} padding="24px">
              <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 10, color: 'var(--orange)', letterSpacing: 1, marginBottom: 10, textTransform: 'uppercase' }}>{title}</div>
              <div style={{ fontSize: 13, color: 'var(--muted)', lineHeight: 1.8 }}>{desc}</div>
            </Card>
          ))}
        </div>
      </div>
    </div>
  )
}
