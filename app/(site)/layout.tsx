import type { ReactNode } from 'react'
import './site.css'
import PageNav from '@/components/layout/PageNav'
import PageFooter from '@/components/layout/PageFooter'

export default function SiteLayout({ children }: { children: ReactNode }) {
  return (
    <div className="site-shell">
      <PageNav />
      <main style={{ position: 'relative', zIndex: 1 }}>{children}</main>
      <PageFooter />
    </div>
  )
}
