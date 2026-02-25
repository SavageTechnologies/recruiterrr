import Link from 'next/link'
import IntegrityPartnerMap from '@/components/AmeriLifePartnerMap'

export default function AmeriLifeNetworkPage() {
  return (
    <div style={{ position: 'relative' }}>
      <Link href="/network" style={{
        position: 'fixed', top: 20, right: 20, zIndex: 999,
        display: 'flex', alignItems: 'center', gap: 6,
        background: 'rgba(26,24,20,0.85)', backdropFilter: 'blur(8px)',
        border: '1px solid #2e2b27', padding: '7px 12px',
        fontFamily: "'DM Mono', monospace", fontSize: 10,
        color: '#7a7570', letterSpacing: 1, textDecoration: 'none',
        }}>
        ← NETWORK
        </Link>
      <IntegrityPartnerMap />
    </div>
  )
}