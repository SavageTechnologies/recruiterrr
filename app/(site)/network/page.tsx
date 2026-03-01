import Link from 'next/link'

const NETWORKS = [
  {
    slug: 'integrity',
    name: 'Integrity Marketing Group',
    url: 'integrity.com',
    desc: "The nation's largest independent distributor of life and health insurance. 181 partner FMOs and IMOs across all 50 states.",
    count: 181,
    countLabel: 'Affiliates Mapped',
    isAnathema: false,
  },
  {
    slug: 'amerilife',
    name: 'AmeriLife',
    url: 'amerilife.com',
    desc: 'One of the largest insurance distribution organizations in the US, focused on health, life, wealth and worksite markets.',
    count: 78,
    countLabel: 'Affiliates Mapped',
    isAnathema: false,
  },
  {
    slug: 'sms',
    name: 'Senior Market Sales',
    url: 'seniormarketsales.com',
    desc: 'Omaha-based national FMO and one of the top three distribution networks in the senior market. Strong in Medicare, life, and annuity across the midwest and beyond.',
    count: 27,
    countLabel: 'Affiliates Mapped',
    isAnathema: false,
  },
  {
    slug: 'anathema',
    name: 'ANATHEMA Infection Map',
    url: 'field intelligence',
    desc: 'A live map built from recruiter field data. Every confirmed agent affiliation logged by a Recruiterrr user gets plotted in real time — proprietary intelligence no directory can give you.',
    count: null,
    countLabel: 'Community Logged',
    isAnathema: true,
  },
]

export default function NetworkPage() {
  return (
    <div>
      <style>{`@keyframes anathemaPulse { 0%,100%{opacity:1} 50%{opacity:0.3} }`}</style>

      <section style={{ padding: '80px 40px 40px', maxWidth: 900 }}>
        <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 11, color: 'var(--orange)', letterSpacing: 3, textTransform: 'uppercase', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ width: 24, height: 1, background: 'var(--orange)', display: 'inline-block' }} />
          Distribution Network
        </div>
        <h1 style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 'clamp(48px, 7vw, 80px)', letterSpacing: 2, lineHeight: 0.95, marginBottom: 16 }}>
          THE <span style={{ color: 'var(--orange)' }}>NETWORK.</span>
        </h1>
        <p style={{ fontSize: 15, color: 'var(--muted)', maxWidth: 520, lineHeight: 1.7, fontWeight: 300 }}>
          The major FMO holding companies and their affiliate networks. These are the organizations recruiting and managing independent producers across the country.
        </p>
      </section>

      <section style={{ padding: '0 40px 80px', maxWidth: 900 }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(380px, 1fr))', gap: 2 }}>
          {NETWORKS.map(n => (
            <div key={n.slug} style={{ background: 'var(--card)', border: '1px solid var(--border)', padding: '32px 28px' }}>
              <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 9, color: 'var(--muted)', letterSpacing: 2, textTransform: 'uppercase', marginBottom: 10 }}>
                {n.url}
              </div>
              <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 28, letterSpacing: 2, marginBottom: 12, lineHeight: 1, color: 'var(--white)' }}>
                {n.name}
              </div>
              <p style={{ fontSize: 13, color: 'var(--muted)', lineHeight: 1.7, marginBottom: 24 }}>
                {n.desc}
              </p>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div>
                  {n.count !== null ? (
                    <>
                      <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 32, color: n.isAnathema ? 'var(--green)' : 'var(--orange)', letterSpacing: 1 }}>{n.count}</div>
                      <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 9, color: 'var(--muted)', letterSpacing: 1, textTransform: 'uppercase' }}>{n.countLabel}</div>
                    </>
                  ) : (
                    <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 9, color: 'var(--green)', letterSpacing: 2, textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: 6 }}>
                      <span style={{ display: 'inline-block', width: 5, height: 5, borderRadius: '50%', background: 'var(--green)', animation: 'anathemaPulse 2s ease infinite' }} />
                      LIVE · COMMUNITY LOGGED
                    </div>
                  )}
                </div>
                <Link href={`/network/${n.slug}`} style={{ padding: '12px 28px', background: n.isAnathema ? 'var(--green)' : 'var(--orange)', color: 'var(--black)', fontFamily: "'Bebas Neue', sans-serif", fontSize: 18, letterSpacing: 2, textDecoration: 'none' }}>
                  EXPLORE MAP →
                </Link>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  )
}
