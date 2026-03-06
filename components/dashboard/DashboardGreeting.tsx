'use client'

import { useMemo } from 'react'

const GREETINGS = [
  (name: string) => `BACK IN THE FIELD,\n${name}.`,
  (name: string) => `LET'S FIND SOME\nAGENTS, ${name}.`,
  (name: string) => `YOUR MARKET'S\nWAITING, ${name}.`,
  (name: string) => `TIME TO HUNT,\n${name}.`,
  (name: string) => `GO GET 'EM,\n${name}.`,
]

export default function DashboardGreeting({ firstName }: { firstName: string }) {
  const name = firstName.toUpperCase()

  // Pick a greeting — stable per session via seeding off the minute
  // so it feels fresh each visit but doesn't flicker on re-render
  const greeting = useMemo(() => {
    const seed = Math.floor(Date.now() / 60000)
    return GREETINGS[seed % GREETINGS.length](name)
  }, [name])

  const [line1, line2] = greeting.split('\n')

  return (
    <div style={{ marginBottom: 36 }}>
      <div className="page-eyebrow" style={{ marginBottom: 10 }}>
        Welcome back
      </div>
      <h1 style={{
        fontFamily: "'Bebas Neue', sans-serif",
        fontSize: 'clamp(48px, 6vw, 72px)',
        letterSpacing: 2,
        lineHeight: 0.95,
        color: 'var(--text-1)',
        margin: 0,
      }}>
        {line1}<br />
        <span style={{ color: 'var(--orange)' }}>{line2}</span>
      </h1>
    </div>
  )
}
