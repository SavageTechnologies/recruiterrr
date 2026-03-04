'use client'

import { useState, useEffect } from 'react'

const STORAGE_KEY = 'recruiterrr_onboarding_complete'

/**
 * useOnboarding
 *
 * Returns whether the onboarding overlay should be shown,
 * and a function to mark it as complete (persisted to localStorage).
 *
 * Usage:
 *   const { showOnboarding, completeOnboarding } = useOnboarding()
 */
export function useOnboarding() {
  const [showOnboarding, setShowOnboarding] = useState(false)

  useEffect(() => {
    const done = localStorage.getItem(STORAGE_KEY)
    if (!done) {
      setShowOnboarding(true)
    }
  }, [])

  const completeOnboarding = () => {
    localStorage.setItem(STORAGE_KEY, 'true')
    setShowOnboarding(false)
  }

  // For dev/testing — call this in the browser console to reset:
  // localStorage.removeItem('recruiterrr_onboarding_complete')

  return { showOnboarding, completeOnboarding }
}
