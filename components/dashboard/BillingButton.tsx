'use client'

import { useState } from 'react'

type Props = {
  asNavItem?: boolean
}

export default function BillingButton({ asNavItem = false }: Props) {
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

  if (asNavItem) {
    return (
      <button
        onClick={handleBilling}
        disabled={loading}
        data-billing="true"
        className="dash-nav-item"
        style={{ width: '100%', border: 'none', background: 'none', textAlign: 'left' }}
      >
        <span className="dash-nav-icon">◻</span>
        {loading ? 'Loading...' : 'Billing'}
      </button>
    )
  }

  return (
    <button
      onClick={handleBilling}
      disabled={loading}
      data-billing="true"
      style={{
        background: 'none', border: 'none', cursor: loading ? 'default' : 'pointer',
        fontFamily: "'DM Mono', monospace", fontSize: 'var(--text-xs)',
        color: 'var(--text-2)', letterSpacing: 2, textTransform: 'uppercase',
        padding: 0, opacity: loading ? 0.5 : 1,
      }}
    >
      {loading ? 'LOADING...' : 'BILLING'}
    </button>
  )
}
