'use client'

import { useOnboarding } from '@/lib/useOnboarding'
import OnboardingTour from '@/components/dashboard/OnboardingTour'
import { ReactNode } from 'react'

export default function DashboardClient({ children }: { children: ReactNode }) {
  const { showOnboarding, completeOnboarding } = useOnboarding()
  return (
    <>
      {showOnboarding && <OnboardingTour onComplete={completeOnboarding} />}
      {children}
    </>
  )
}