'use client'

import { useState, useEffect } from 'react'

export default function DashboardThemeToggle() {
  const [isDark, setIsDark] = useState(false)

  useEffect(() => {
    setIsDark(document.documentElement.getAttribute('data-theme') === 'dark')
  }, [])

  function toggle() {
    const next = isDark ? 'light' : 'dark'
    document.documentElement.setAttribute('data-theme', next)
    localStorage.setItem('recruiterrr_theme', next)
    setIsDark(!isDark)
  }

  return (
    <div className="dash-theme-toggle">
      <span className="dash-theme-label">{isDark ? 'DARK' : 'LIGHT'}</span>
      <button
        className="dash-toggle-btn"
        onClick={toggle}
        aria-label="Toggle theme"
      >
        <div className="dash-toggle-knob" />
      </button>
    </div>
  )
}
