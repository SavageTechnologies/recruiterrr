import { SignIn } from '@clerk/nextjs'
import Link from 'next/link'
import PageNav from '@/components/layout/PageNav'
import PageFooter from '@/components/layout/PageFooter'
import '../../../(site)/site.css'

const clerkAppearance = {
  variables: {
    colorPrimary: '#e84d1c',
    colorBackground: '#ffffff',
    colorInputBackground: '#f7f5f2',
    colorInputText: '#111010',
    colorText: '#111010',
    colorTextSecondary: '#7a7571',
    colorNeutral: '#e0dbd5',
    borderRadius: '4px',
    fontFamily: "'DM Mono', monospace",
  },
  elements: {
    card: {
      background: '#ffffff',
      border: '1px solid #e0dbd5',
      borderRadius: '4px',
      boxShadow: '0 4px 16px rgba(17,16,16,0.08)',
      padding: '40px',
    },
    headerTitle: {
      fontFamily: "'Bebas Neue', sans-serif",
      fontSize: '32px',
      letterSpacing: '2px',
      color: '#111010',
    },
    headerSubtitle: {
      fontFamily: "'DM Mono', monospace",
      fontSize: '10px',
      letterSpacing: '1.5px',
      color: '#7a7571',
      textTransform: 'uppercase',
    },
    formButtonPrimary: {
      background: '#e84d1c',
      borderRadius: '4px',
      fontFamily: "'Bebas Neue', sans-serif",
      fontSize: '18px',
      letterSpacing: '2px',
      color: '#ffffff',
      padding: '14px 0',
      border: 'none',
      boxShadow: '0 2px 12px rgba(232,77,28,0.28)',
    },
    formFieldInput: {
      background: '#f7f5f2',
      border: '1px solid #e0dbd5',
      borderRadius: '4px',
      color: '#111010',
      fontFamily: "'DM Mono', monospace",
      fontSize: '13px',
      padding: '12px 14px',
    },
    formFieldLabel: {
      fontFamily: "'DM Mono', monospace",
      fontSize: '10px',
      letterSpacing: '2px',
      textTransform: 'uppercase',
      color: '#7a7571',
    },
    footerActionLink: {
      color: '#e84d1c',
      fontFamily: "'DM Mono', monospace",
      fontSize: '11px',
    },
    dividerLine: { background: '#e0dbd5' },
    dividerText: {
      color: '#b8b3ae',
      fontFamily: "'DM Mono', monospace",
      fontSize: '10px',
    },
    socialButtonsBlockButton: {
      background: '#f7f5f2',
      border: '1px solid #e0dbd5',
      borderRadius: '4px',
      color: '#3d3a38',
      fontFamily: "'DM Mono', monospace",
      fontSize: '11px',
      letterSpacing: '1px',
    },
    identityPreviewEditButton: { color: '#e84d1c' },
    alertText: { fontFamily: "'DM Mono', monospace", fontSize: '11px' },
  },
}

export default function SignInPage() {
  return (
    <div className="site-shell">
      <PageNav />

      <main style={{ position: 'relative', zIndex: 1 }}>
        <div style={{
          minHeight: 'calc(100vh - 64px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '60px 40px',
          gap: 80,
        }}>

          {/* Left — branding, hidden on mobile */}
          <div className="auth-left" style={{ maxWidth: 380, display: 'none' }}>
            <div style={{
              fontFamily: "'DM Mono', monospace",
              fontSize: 10,
              color: 'var(--site-orange)',
              letterSpacing: 3,
              textTransform: 'uppercase',
              marginBottom: 20,
              display: 'flex',
              alignItems: 'center',
              gap: 10,
            }}>
              <span style={{ width: 24, height: 1, background: 'var(--site-orange)', display: 'inline-block', flexShrink: 0 }} />
              Agent Intelligence
            </div>

            <h1 style={{
              fontFamily: "'Bebas Neue', sans-serif",
              fontSize: 68,
              letterSpacing: 2,
              lineHeight: 0.9,
              color: 'var(--site-ink)',
              marginBottom: 24,
            }}>
              WELCOME<br />
              <span style={{ color: 'var(--site-orange)' }}>BACK.</span>
            </h1>

            <p style={{
              fontSize: 14,
              color: 'var(--site-ink-3)',
              lineHeight: 1.75,
              marginBottom: 40,
            }}>
              Your markets are waiting. Sign in to pick up where you left off.
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {[
                'Search any city in seconds',
                'HOT / WARM / COLD scoring',
                'Job posting + YouTube signals',
                'Search history saved',
              ].map(f => (
                <div key={f} style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10,
                  fontFamily: "'DM Mono', monospace",
                  fontSize: 11,
                  color: 'var(--site-ink-3)',
                  letterSpacing: 0.5,
                }}>
                  <span style={{ width: 5, height: 5, background: 'var(--site-orange)', borderRadius: '50%', flexShrink: 0 }} />
                  {f}
                </div>
              ))}
            </div>

            <div style={{
              marginTop: 48,
              paddingTop: 28,
              borderTop: '1px solid var(--site-border)',
            }}>
              <div style={{
                fontFamily: "'DM Mono', monospace",
                fontSize: 10,
                color: 'var(--site-ink-4)',
                letterSpacing: 1,
                marginBottom: 10,
              }}>
                DON'T HAVE AN ACCOUNT?
              </div>
              <Link href="/sign-up" style={{
                fontFamily: "'DM Mono', monospace",
                fontSize: 11,
                color: 'var(--site-orange)',
                textDecoration: 'none',
                letterSpacing: 1,
              }}>
                Start your subscription →
              </Link>
            </div>
          </div>

          {/* Right — Clerk widget */}
          <div>
            <SignIn appearance={clerkAppearance} />
          </div>

        </div>
      </main>

      <PageFooter />

      <style>{`
        @media (min-width: 860px) {
          .auth-left { display: block !important; }
        }
      `}</style>
    </div>
  )
}
