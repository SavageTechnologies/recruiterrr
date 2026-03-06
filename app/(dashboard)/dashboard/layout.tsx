import { UserButton } from '@clerk/nextjs'
import { auth } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import './dash.css'
import { isAdmin, hasFullAccess } from '@/lib/auth/access'
import { supabase } from '@/lib/supabase.server'
import BillingButton from '@/components/dashboard/BillingButton'
import DashboardThemeToggle from '@/components/dashboard/DashboardThemeToggle'
import DashboardNav from '@/components/dashboard/DashboardNav'

// ── SVG nav icons — 16×16, 1.5px stroke, no fill ─────────────────────────────
// Consistent optical weight across all nav items.

function IconDashboard() {
  return (
    <svg width="15" height="15" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="2" width="5" height="5" rx="1" />
      <rect x="9" y="2" width="5" height="5" rx="1" />
      <rect x="2" y="9" width="5" height="5" rx="1" />
      <rect x="9" y="9" width="5" height="5" rx="1" />
    </svg>
  )
}

function IconSearch() {
  return (
    <svg width="15" height="15" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="7" cy="7" r="4.5" />
      <line x1="10.5" y1="10.5" x2="14" y2="14" />
    </svg>
  )
}

function IconDatabase() {
  return (
    <svg width="15" height="15" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <ellipse cx="8" cy="4.5" rx="5" ry="2" />
      <path d="M3 4.5v3c0 1.1 2.24 2 5 2s5-.9 5-2v-3" />
      <path d="M3 7.5v3c0 1.1 2.24 2 5 2s5-.9 5-2v-3" />
    </svg>
  )
}

function IconAnathema() {
  return (
    <svg width="15" height="15" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="8" cy="8" r="5.5" />
      <circle cx="8" cy="8" r="2" />
      <line x1="8" y1="2.5" x2="8" y2="6" />
      <line x1="8" y1="10" x2="8" y2="13.5" />
      <line x1="2.5" y1="8" x2="6" y2="8" />
      <line x1="10" y1="8" x2="13.5" y2="8" />
    </svg>
  )
}

function IconPrometheus() {
  return (
    <svg width="15" height="15" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="2,11 5.5,6.5 8,9 11,4.5 14,7" />
      <line x1="2" y1="13.5" x2="14" y2="13.5" />
    </svg>
  )
}

function IconDavid() {
  return (
    <svg width="15" height="15" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="8" cy="5.5" r="2.5" />
      <path d="M3 13.5c0-2.76 2.24-5 5-5s5 2.24 5 5" />
    </svg>
  )
}

function IconMeredith() {
  return (
    <svg width="15" height="15" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="3.5" width="12" height="9" rx="1.5" />
      <path d="M2 6.5h12" />
      <line x1="5.5" y1="3.5" x2="5.5" y2="6.5" />
      <line x1="10.5" y1="3.5" x2="10.5" y2="6.5" />
    </svg>
  )
}

function IconAdmin() {
  return (
    <svg width="15" height="15" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="8" cy="8" r="2" />
      <path d="M8 2v1.5M8 12.5V14M2 8h1.5M12.5 8H14M3.5 3.5l1.1 1.1M11.4 11.4l1.1 1.1M12.5 3.5l-1.1 1.1M4.6 11.4l-1.1 1.1" />
    </svg>
  )
}

function IconBilling() {
  return (
    <svg width="15" height="15" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="4" width="12" height="9" rx="1.5" />
      <path d="M2 7.5h12" />
      <line x1="5.5" y1="11" x2="8" y2="11" />
    </svg>
  )
}

// ─────────────────────────────────────────────────────────────────────────────

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const { userId } = await auth()
  const adminUser = userId ? isAdmin(userId) : false

  // ── Subscription gate ──────────────────────────────────────────────────────
  // Admins and comped users pass through unconditionally.
  // Everyone else needs plan='pro' + subscription_status='active' in Supabase.
  let subscriberUser = adminUser || (userId ? hasFullAccess(userId) : false)

  if (userId && !hasFullAccess(userId)) {
    const { data: user } = await supabase
      .from('users')
      .select('plan, subscription_status')
      .eq('clerk_id', userId)
      .single()

    const isActive = user?.plan === 'pro' && user?.subscription_status === 'active'
    if (!isActive) redirect('/dashboard/subscribe')
    subscriberUser = isActive
  }

  return (
    <div className="dash-shell">

      {/* ── SIDEBAR ── */}
      <aside className="dash-sidebar">

        <Link href="/dashboard" className="dash-sidebar-logo">
          RECRUITERRR<span>.</span>
        </Link>

        <nav className="dash-sidebar-nav">

          <div className="dash-nav-section">Tools</div>

          <Link href="/dashboard" className="dash-nav-item" data-nav="dashboard">
            <span className="dash-nav-icon"><IconDashboard /></span>
            Dashboard
          </Link>

          <Link href="/dashboard/search" className="dash-nav-item">
            <span className="dash-nav-icon"><IconSearch /></span>
            Agent Search
          </Link>

          <Link href="/dashboard/database" className="dash-nav-item">
            <span className="dash-nav-icon"><IconDatabase /></span>
            Database
          </Link>

          {subscriberUser && (
            <>
              <div className="dash-nav-section" style={{ marginTop: 8 }}>Intelligence</div>

              <Link href="/dashboard/anathema" className="dash-nav-item">
                <span className="dash-nav-icon"><IconAnathema /></span>
                Anathema
              </Link>

              <Link href="/dashboard/prometheus" className="dash-nav-item">
                <span className="dash-nav-icon"><IconPrometheus /></span>
                Prometheus
              </Link>
            </>
          )}

          {adminUser && (
            <>
              <div className="dash-nav-section" style={{ marginTop: 8 }}>Admin</div>

              <Link href="/dashboard/david" className="dash-nav-item">
                <span className="dash-nav-icon"><IconDavid /></span>
                David
              </Link>

              <Link href="/dashboard/admin/adspy" className="dash-nav-item">
                <span className="dash-nav-icon"><IconMeredith /></span>
                Meredith
              </Link>

              <Link href="/dashboard/admin" className="dash-nav-item">
                <span className="dash-nav-icon"><IconAdmin /></span>
                Admin
              </Link>
            </>
          )}

          <div className="dash-nav-section" style={{ marginTop: 8 }}>Account</div>
          <BillingButton asNavItem />

        </nav>

        <div className="dash-sidebar-footer">
          <div className="dash-sidebar-plan">
            <div className="dash-plan-dot" />
            PRO PLAN
          </div>
          <DashboardThemeToggle />
          <UserButton
            afterSignOutUrl="/"
            appearance={{
              variables: {
                colorPrimary: '#ff5500',
                borderRadius: '4px',
                fontFamily: "'DM Mono', monospace",
              },
              elements: {
                avatarBox: { width: 28, height: 28, borderRadius: '4px' },
              },
            }}
          />
        </div>
      </aside>

      {/* ── MAIN ── */}
      <main className="dash-main">
        <DashboardNav />
        {children}
      </main>

    </div>
  )
}
