import { SignIn } from '@clerk/nextjs'
import Link from 'next/link'
import '../../../(site)/site.css'

const mono = "'DM Mono', monospace"
const bebas = "'Bebas Neue', sans-serif"
const sans = "'DM Sans', sans-serif"

const clerkAppearance = {
  variables: {
    colorPrimary: '#e84d1c',
    colorBackground: '#f7f5f2',
    colorInputBackground: '#ffffff',
    colorInputText: '#111010',
    colorText: '#111010',
    colorTextSecondary: '#7a7571',
    colorNeutral: '#e0dbd5',
    borderRadius: '4px',
    fontFamily: "'DM Mono', monospace",
  },
  elements: {
    card: { background: 'transparent', border: 'none', borderRadius: '0', boxShadow: 'none', padding: '0' },
    rootBox: { width: '100%' },
    headerTitle: { display: 'none' },
    headerSubtitle: { display: 'none' },
    header: { display: 'none' },
    formButtonPrimary: {
      background: '#e84d1c', borderRadius: '4px', fontFamily: "'Bebas Neue', sans-serif",
      fontSize: '18px', letterSpacing: '2px', color: '#ffffff', padding: '14px 0',
      border: 'none', boxShadow: '0 2px 12px rgba(232,77,28,0.28)',
    },
    formFieldInput: {
      background: '#ffffff', border: '1px solid #e0dbd5', borderRadius: '4px',
      color: '#111010', fontFamily: "'DM Mono', monospace", fontSize: '13px', padding: '12px 14px',
    },
    formFieldLabel: { fontFamily: "'DM Mono', monospace", fontSize: '10px', letterSpacing: '2px', textTransform: 'uppercase', color: '#7a7571' },
    footerActionLink: { color: '#e84d1c', fontFamily: "'DM Mono', monospace", fontSize: '11px' },
    footerActionText: { fontFamily: "'DM Mono', monospace", fontSize: '11px', color: '#b8b3ae' },
    footer: { background: 'transparent' },
    dividerLine: { background: '#e0dbd5' },
    dividerText: { color: '#b8b3ae', fontFamily: "'DM Mono', monospace", fontSize: '10px' },
    socialButtonsBlockButton: {
      background: '#ffffff', border: '1px solid #e0dbd5', borderRadius: '4px',
      color: '#3d3a38', fontFamily: "'DM Mono', monospace", fontSize: '11px', letterSpacing: '1px',
    },
    alertText: { fontFamily: "'DM Mono', monospace", fontSize: '11px' },
  },
}

const statCard: React.CSSProperties = {
  padding: '16px 20px',
  background: 'rgba(255,255,255,0.07)',
  border: '1px solid rgba(255,255,255,0.12)',
  borderRadius: 6,
}

export default function SignInPage() {
  return (
    <div className="site-shell" style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>

      {/* NAV */}
      <nav style={{
        height: 56, display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '0 32px', borderBottom: '1px solid var(--site-border)',
        background: 'var(--site-white)', flexShrink: 0,
      }}>
        <Link href="/" style={{ fontFamily: bebas, fontSize: 20, letterSpacing: 3, color: 'var(--site-ink)', textDecoration: 'none' }}>
          RECRUITERRR<span style={{ color: 'var(--site-orange)' }}>.</span>
        </Link>
        <div style={{ display: 'flex', gap: 8 }}>
          <Link href="/sign-in" style={{
            fontFamily: mono, fontSize: 10, letterSpacing: 1.5, padding: '7px 16px',
            background: 'none', border: '1px solid var(--site-ink-3)',
            borderRadius: 4, color: 'var(--site-ink)', textDecoration: 'none',
          }}>SIGN IN</Link>
          <Link href="/sign-up" style={{
            fontFamily: mono, fontSize: 10, letterSpacing: 1.5, padding: '7px 16px',
            background: 'none', border: '1px solid var(--site-border)',
            borderRadius: 4, color: 'var(--site-ink-3)', textDecoration: 'none',
          }}>REQUEST ACCESS</Link>
        </div>
      </nav>

      {/* SPLIT BODY */}
      <div style={{ flex: 1, display: 'grid', gridTemplateColumns: '1fr 1fr', alignItems: 'stretch' }}>

        {/* LEFT */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          padding: '48px 44px', background: 'var(--site-paper)',
          borderRight: '1px solid var(--site-border)',
          minHeight: 'calc(100vh - 56px - 44px)',
        }}>
          <div style={{ width: '100%', maxWidth: 400 }}>
            <div style={{ marginBottom: 32 }}>
              <div style={{ fontFamily: bebas, fontSize: 40, letterSpacing: 2, color: 'var(--site-ink)', marginBottom: 6 }}>WELCOME BACK.</div>
              <div style={{ fontFamily: mono, fontSize: 10, color: 'var(--site-ink-3)', letterSpacing: 2 }}>OPERATOR ACCESS</div>
            </div>
            <SignIn forceRedirectUrl="/dashboard" appearance={clerkAppearance} />
          </div>
        </div>

        {/* RIGHT */}
        <div style={{ background: 'var(--site-orange)', padding: '48px 44px', display: 'flex', flexDirection: 'column' }}>
          <div style={{ flex: 1 }}>
            <h1 style={{ fontFamily: bebas, fontSize: 56, letterSpacing: 2, lineHeight: 0.92, color: 'white', marginBottom: 24 }}>
              RECRUIT ON<br />INTELLIGENCE,<br />
              <span style={{ color: 'rgba(255,255,255,0.42)' }}>NOT INSTINCT.</span>
            </h1>
            <p style={{ fontFamily: sans, fontSize: 14, color: 'rgba(255,255,255,0.72)', lineHeight: 1.8, marginBottom: 36, maxWidth: 400 }}>
              Real-time data on every independent producer in any market. Two tools. One platform. Built for recruiters who move fast.
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 36 }}>
              {[
                { name: 'Agent Search', desc: 'Every independent producer in any US market — scored HOT, WARM, or COLD with YouTube, hiring, and carrier signals.' },
                { name: 'Prometheus', desc: 'FMO & IMO competitive intelligence. Know their carriers, trips, and recruiting pitch before you compete.' },
              ].map(tool => (
                <div key={tool.name} style={statCard}>
                  <div style={{ fontFamily: mono, fontSize: 10, color: 'white', letterSpacing: 2, fontWeight: 500, marginBottom: 6, display: 'flex', alignItems: 'center', gap: 8 }}>
                    {tool.name}
                    <span style={{ fontFamily: mono, fontSize: 8, letterSpacing: 1.5, color: 'rgba(255,255,255,0.5)', border: '1px solid rgba(255,255,255,0.2)', padding: '2px 6px', borderRadius: 2 }}>LIVE</span>
                  </div>
                  <div style={{ fontFamily: sans, fontSize: 12, color: 'rgba(255,255,255,0.58)', lineHeight: 1.65 }}>{tool.desc}</div>
                </div>
              ))}
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 1, background: 'rgba(255,255,255,0.15)', borderRadius: 6, overflow: 'hidden' }}>
              {[['320K+', 'Producers'], ['50', 'States'], ['< 90s', 'Full Scan']].map(([num, label]) => (
                <div key={label} style={{ padding: '16px 12px', background: 'rgba(0,0,0,0.18)', textAlign: 'center' }}>
                  <div style={{ fontFamily: bebas, fontSize: 24, letterSpacing: 1, color: 'white', lineHeight: 1 }}>{num}</div>
                  <div style={{ fontFamily: mono, fontSize: 8, color: 'rgba(255,255,255,0.45)', letterSpacing: 1.5, marginTop: 3 }}>{label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* FOOTER */}
      <footer style={{
        background: 'var(--site-white)', borderTop: '1px solid var(--site-border)',
        padding: '12px 32px', display: 'flex', alignItems: 'center',
        justifyContent: 'space-between', flexWrap: 'wrap', gap: 12, flexShrink: 0,
      }}>
        <div style={{ fontFamily: mono, fontSize: 9, color: 'var(--site-ink-4)', letterSpacing: 1 }}>
          © 2026 InsuraSafe, LLC. All rights reserved.
        </div>
        <div style={{ fontFamily: mono, fontSize: 9, color: 'var(--site-ink-5)', letterSpacing: 2, display: 'flex', alignItems: 'center', gap: 8 }}>
          ALL SYSTEMS NOMINAL
          <div style={{ display: 'flex', gap: 4 }}>
            <div style={{ width: 4, height: 4, background: 'var(--site-orange)', borderRadius: '50%' }} />
            <div style={{ width: 4, height: 4, background: 'rgba(26,200,100,0.6)', borderRadius: '50%' }} />
          </div>
        </div>
      </footer>
    </div>
  )
}
