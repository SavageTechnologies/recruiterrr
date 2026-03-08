const mono = "'DM Mono', monospace"

export default function SiteFooter() {
  return (
    <footer style={{
      background: 'var(--site-white)',
      borderTop: '1px solid var(--site-border)',
      padding: '12px 24px',
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      flexWrap: 'wrap', gap: 10, flexShrink: 0,
    }}>
      <style>{`
        .footer-status { display: flex; }
        @media (max-width: 768px) {
          .footer-status { display: none; }
        }
      `}</style>
      <div style={{ fontFamily: mono, fontSize: 9, color: 'var(--site-ink-4)', letterSpacing: 1 }}>
        © 2026 InsuraSafe, LLC. All rights reserved.
      </div>
      <div style={{ display: 'flex', gap: 2 }}>
        {[['Privacy', '/privacy'], ['Terms', '/terms']].map(([label, href]) => (
          <a
            key={href}
            href={href}
            style={{
              fontFamily: mono, fontSize: 9,
              color: 'var(--site-ink-4)',
              letterSpacing: 1.5, padding: '3px 8px', textTransform: 'uppercase' as const,
              textDecoration: 'none', borderBottom: '1px solid transparent',
            }}
            onMouseEnter={e => (e.currentTarget.style.color = 'var(--site-orange)')}
            onMouseLeave={e => (e.currentTarget.style.color = 'var(--site-ink-4)')}
          >{label}</a>
        ))}
      </div>
      <div className="footer-status" style={{ fontFamily: mono, fontSize: 9, color: 'var(--site-ink-5)', letterSpacing: 2, alignItems: 'center', gap: 8 }}>
        ALL SYSTEMS NOMINAL
        <div style={{ display: 'flex', gap: 4, marginLeft: 8 }}>
          <div style={{ width: 4, height: 4, background: 'var(--site-orange)', borderRadius: '50%' }} />
          <div style={{ width: 4, height: 4, background: 'rgba(26,200,100,0.6)', borderRadius: '50%' }} />
        </div>
      </div>
    </footer>
  )
}
