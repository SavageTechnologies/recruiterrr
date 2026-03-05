'use client'

import { usePathname } from 'next/navigation'
import { useEffect } from 'react'

// Reads the current pathname and adds .active class to the matching sidebar nav item.
// This runs client-side so the server-rendered sidebar stays static/cacheable.
export default function DashboardNav() {
  const pathname = usePathname()

  useEffect(() => {
    // Clear all active states
    document.querySelectorAll('.dash-nav-item').forEach(el => {
      el.classList.remove('active')
    })

    // Match most specific route first
    const routes: [string, string][] = [
      ['/dashboard/admin/adspy', '[href="/dashboard/admin/adspy"]'],
      ['/dashboard/admin',       '[href="/dashboard/admin"]'],
      ['/dashboard/search',      '[href="/dashboard/search"]'],
      ['/dashboard/database',    '[href="/dashboard/database"]'],
      ['/dashboard/anathema',    '[href="/dashboard/anathema"]'],
      ['/dashboard/prometheus',  '[href="/dashboard/prometheus"]'],
      ['/dashboard/david',       '[href="/dashboard/david"]'],
      ['/dashboard',             '[data-nav="dashboard"]'],
    ]

    for (const [route, selector] of routes) {
      if (pathname.startsWith(route)) {
        const el = document.querySelector(`.dash-nav-item${selector}`)
        if (el) { el.classList.add('active'); break }
      }
    }
  }, [pathname])

  return null
}
