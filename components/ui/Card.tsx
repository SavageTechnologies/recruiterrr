import type { ReactNode, CSSProperties } from 'react'

type Props = {
  children: ReactNode
  padding?: string | number
  style?: CSSProperties
}

export default function Card({ children, padding = '24px', style }: Props) {
  return (
    <div style={{
      background: 'var(--card)',
      border: '1px solid var(--border)',
      padding,
      ...style,
    }}>
      {children}
    </div>
  )
}