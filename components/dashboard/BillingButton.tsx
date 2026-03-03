'use client'

import { useState } from 'react'

export default function BillingButton() {
  const [loading, setLoading] = useState(false)

  async function handleBilling() {
    setLoading(true)
    try {
      const res = await fetch('/api/stripe/portal', { method: 'POST' })
      const data = await res.json()
      if (data.url) window.location.href = data.url
    } catch {
      setLoading(false)
    } finally {
      setLoading(false)
    }
  }

  return (
    <button
      onClick={handleBilling}
      disabled={loading}
      style={{
        background: 'none', border: 'none', cursor: loading ? 'default' : 'crosshair',
        fontFamily: "'DM Mono', monospace", fontSize: 11,
        color: 'var(--muted)', letterSpacing: 2, textTransform: 'uppercase',
        padding: 0, opacity: loading ? 0.5 : 1,
      }}
    >
      {loading ? 'LOADING...' : 'BILLING'}
    </button>
  )
}
