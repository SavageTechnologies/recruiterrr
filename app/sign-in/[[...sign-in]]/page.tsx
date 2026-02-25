import { SignIn } from '@clerk/nextjs'
import PageNav from '@/components/PageNav'
import PageFooter from '@/components/PageFooter'

export default function SignInPage() {
  return (
    <div style={{ minHeight: '100vh', background: 'var(--black)', color: 'var(--white)', display: 'flex', flexDirection: 'column' }}>
      <PageNav />

      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '60px 40px', gap: 80 }}>
        {/* Left — branding */}
        <div style={{ maxWidth: 400, display: 'none' }} className="auth-left">
          <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 11, color: 'var(--orange)', letterSpacing: 3, textTransform: 'uppercase', marginBottom: 20, display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ width: 24, height: 1, background: 'var(--orange)', display: 'inline-block' }} />
            Agent Intelligence
          </div>
          <h1 style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 72, letterSpacing: 2, lineHeight: 0.9, color: 'var(--white)', marginBottom: 24 }}>
            WELCOME<br /><span style={{ color: 'var(--orange)' }}>BACK.</span>
          </h1>
          <p style={{ fontSize: 15, color: 'var(--muted)', lineHeight: 1.7, marginBottom: 40 }}>
            Your markets are waiting. Sign in to pick up where you left off.
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {['Search any city in seconds', 'HOT / WARM / COLD scoring', 'Job posting + YouTube signals', 'Search history saved'].map(f => (
              <div key={f} style={{ display: 'flex', alignItems: 'center', gap: 10, fontFamily: "'DM Mono', monospace", fontSize: 11, color: '#444', letterSpacing: 0.5 }}>
                <span style={{ width: 6, height: 6, background: 'var(--orange)', borderRadius: '50%', flexShrink: 0 }} />
                {f}
              </div>
            ))}
          </div>
        </div>

        {/* Right — Clerk form */}
        <div>
          <SignIn
            appearance={{
              variables: {
                colorPrimary: '#ff5500',
                colorBackground: '#111110',
                colorInputBackground: '#1a1814',
                colorInputText: '#ffffff',
                colorText: '#ffffff',
                colorTextSecondary: '#666',
                colorNeutral: '#333',
                borderRadius: '0px',
                fontFamily: "'DM Mono', monospace",
              },
              elements: {
                card: {
                  background: '#111110',
                  border: '1px solid #222',
                  borderRadius: 0,
                  boxShadow: 'none',
                  padding: '40px',
                },
                headerTitle: {
                  fontFamily: "'Bebas Neue', sans-serif",
                  fontSize: '36px',
                  letterSpacing: '2px',
                  color: '#ffffff',
                },
                headerSubtitle: {
                  fontFamily: "'DM Mono', monospace",
                  fontSize: '11px',
                  letterSpacing: '1px',
                  color: '#444',
                  textTransform: 'uppercase',
                },
                formButtonPrimary: {
                  background: '#ff5500',
                  borderRadius: 0,
                  fontFamily: "'Bebas Neue', sans-serif",
                  fontSize: '18px',
                  letterSpacing: '2px',
                  color: '#000',
                  padding: '14px 0',
                  border: 'none',
                  '&:hover': { background: '#e04d00' },
                },
                formFieldInput: {
                  background: '#1a1814',
                  border: '1px solid #222',
                  borderRadius: 0,
                  color: '#ffffff',
                  fontFamily: "'DM Mono', monospace",
                  fontSize: '13px',
                  padding: '12px 14px',
                  '&:focus': { borderColor: '#ff5500', boxShadow: 'none' },
                },
                formFieldLabel: {
                  fontFamily: "'DM Mono', monospace",
                  fontSize: '10px',
                  letterSpacing: '2px',
                  textTransform: 'uppercase',
                  color: '#555',
                },
                footerActionLink: {
                  color: '#ff5500',
                  fontFamily: "'DM Mono', monospace",
                  fontSize: '11px',
                },
                dividerLine: { background: '#222' },
                dividerText: { color: '#333', fontFamily: "'DM Mono', monospace", fontSize: '10px' },
                socialButtonsBlockButton: {
                  background: '#1a1814',
                  border: '1px solid #222',
                  borderRadius: 0,
                  color: '#666',
                  fontFamily: "'DM Mono', monospace",
                  fontSize: '11px',
                  letterSpacing: '1px',
                  '&:hover': { background: '#222' },
                },
                identityPreviewEditButton: { color: '#ff5500' },
                alertText: { fontFamily: "'DM Mono', monospace", fontSize: '11px' },
              },
            }}
          />
        </div>
      </div>

      <style>{`
        @media (min-width: 900px) {
          .auth-left { display: block !important; }
        }
      `}</style>

      <PageFooter />
    </div>
  )
}
