type Props = {
  label: string
  title: string
  accent: string
  accentColor?: string
}

export default function PageHeader({ label, title, accent, accentColor = 'var(--orange)' }: Props) {
  return (
    <div style={{ marginBottom: 48 }}>
      <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 11, color: 'var(--orange)', letterSpacing: 3, textTransform: 'uppercase' as const, marginBottom: 16 }}>
        {label}
      </div>
      <h1 style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 72, letterSpacing: 2, lineHeight: 0.9, color: 'var(--white)', margin: 0 }}>
        {title}<br />
        <span style={{ color: accentColor }}>{accent}</span>
      </h1>
    </div>
  )
}