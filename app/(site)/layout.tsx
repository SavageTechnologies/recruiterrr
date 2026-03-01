import type { ReactNode } from 'react'
import PageNav from '@/components/layout/PageNav'
import PageFooter from '@/components/layout/PageFooter'

export default function SiteLayout({ children }: { children: ReactNode }) {
  return (
    <div style={{ minHeight: '100vh', background: 'var(--black)', color: 'var(--white)' }}>
      <PageNav />
      <main>{children}</main>
      <PageFooter />
    </div>
  )
}