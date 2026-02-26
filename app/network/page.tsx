import Link from 'next/link'
import PageNav from '@/components/PageNav'
import PageFooter from '@/components/PageFooter'

const NETWORKS = [
  {
    slug: 'integrity',
    name: 'Integrity Marketing Group',
    url: 'integrity.com',
    desc: 'The nation\'s largest independent distributor of life and health insurance. 181 partner FMOs and IMOs across all 50 states.',
    count: 181,
    status: 'live',
  },
  {
    slug: 'amerilife',
    name: 'AmeriLife',
    url: 'amerilife.com',
    desc: 'One of the largest insurance distribution organizations in the US, focused on health, life, wealth and worksite markets.',
    count: 78,
    status: 'live',
  },
  {
    slug: 'sms',
    name: 'Senior Market Sales',
    url: 'seniormarketsales.com',
    desc: 'Omaha-based national FMO and one of the top three distribution networks in the senior market. Strong in Medicare, life, and annuity across the midwest and beyond.',
    count: 27,
    status: 'live',
  },
]

export default function NetworkPage() {
  return (
    <div style={{ minHeight: '100vh', background: 'var(--black)' }}>
      <PageNav />

      <section style={{ padding: '80px 40px 40px', maxWidth: 900 }}>
        <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 11, color: 'var(--orange)', letterSpacing: 3, textTransform: 'uppercase', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ width: 24, height: 1, background: 'var(--orange)', display: 'inline-block' }} />
          Distribution Network
        </div>
        <h1 style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 'clamp(48px, 7vw, 80px)', letterSpacing: 2, lineHeight: 0.95, marginBottom: 16 }}>
          THE <span style={{ color: 'var(--orange)' }}>NETWORK.</span>
        </h1>
        <p style={{ fontSize: 15, color: 'var(--muted)', maxWidth: 520, lineHeight: 1.7, fontWeight: 300 }}>
          The major FMO holding companies and their affiliate networks. These are the organizations recruiting and managing independent insurance agents across the country.
        </p>
      </section>

      <section style={{ padding: '0 40px 80px', maxWidth: 900 }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(380px, 1fr))', gap: 2 }}>
          {NETWORKS.map(n => (
            <div key={n.slug} style={{ background: 'var(--card)', border: '1px solid var(--border)', padding: '32px 28px', position: 'relative' }}>

              {n.status === 'coming' && (
                <div style={{ position: 'absolute', top: 16, right: 16, fontFamily: "'DM Mono', monospace", fontSize: 9, color: 'var(--muted)', letterSpacing: 2, textTransform: 'uppercase', background: 'var(--border)', padding: '3px 8px' }}>
                  COMING SOON
                </div>
              )}

              <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 9, color: 'var(--muted)', letterSpacing: 2, textTransform: 'uppercase', marginBottom: 10 }}>
                {n.url}
              </div>

              <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 28, letterSpacing: 2, marginBottom: 12, lineHeight: 1 }}>
                {n.name}
              </div>

              <p style={{ fontSize: 13, color: 'var(--muted)', lineHeight: 1.7, marginBottom: 24 }}>
                {n.desc}
              </p>

              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div>
                  <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 32, color: 'var(--orange)', letterSpacing: 1 }}>{n.count}</div>
                  <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 9, color: 'var(--muted)', letterSpacing: 1, textTransform: 'uppercase' }}>Affiliates Mapped</div>
                </div>

                {n.status === 'live' ? (
                  <Link href={`/network/${n.slug}`} style={{ padding: '12px 28px', background: 'var(--orange)', color: 'var(--black)', fontFamily: "'Bebas Neue', sans-serif", fontSize: 18, letterSpacing: 2, textDecoration: 'none' }}>
                    EXPLORE MAP →
                  </Link>
                ) : (
                  <div style={{ padding: '12px 28px', background: 'transparent', border: '1px solid var(--border)', color: 'var(--muted)', fontFamily: "'Bebas Neue', sans-serif", fontSize: 18, letterSpacing: 2 }}>
                    EXPLORE MAP →
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </section>

      <PageFooter />
    </div>
  )
}