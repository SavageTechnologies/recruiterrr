import type { ReactNode } from 'react'
import './site.css'

export default function SiteLayout({ children }: { children: ReactNode }) {
  return <div className="site-shell">{children}</div>
}
