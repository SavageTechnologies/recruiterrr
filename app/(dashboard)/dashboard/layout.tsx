import { UserButton } from '@clerk/nextjs'
import { auth } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { isAdmin, hasFullAccess } from '@/lib/auth/access'
import { supabase } from '@/lib/supabase.server'
import BillingButton from '@/components/dashboard/BillingButton'
import DashboardThemeToggle from '@/components/dashboard/DashboardThemeToggle'
import DashboardNav from '@/components/dashboard/DashboardNav'

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const { userId } = await auth()
  const adminUser = userId ? isAdmin(userId) : false

  // ── Subscription gate ───────────────────────────────────────────────────────
  // Admins and comped users pass through unconditionally.
  // Everyone else needs plan='pro' + subscription_status='active' in Supabase.
  // The subscribe page lives in its own route group so it's never under this layout.
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
            <span className="dash-nav-icon">◈</span>
            Dashboard
          </Link>

          <Link href="/dashboard/search" className="dash-nav-item">
            <span className="dash-nav-icon">⊕</span>
            Search
          </Link>

          <Link href="/dashboard/database" className="dash-nav-item">
            <span className="dash-nav-icon">◎</span>
            Database
          </Link>

          {subscriberUser && (
            <>
              <div className="dash-nav-section" style={{ marginTop: 8 }}>Intelligence</div>

              <Link href="/dashboard/anathema" className="dash-nav-item">
                <span className="dash-nav-icon">⬡</span>
                Anathema
              </Link>

              <Link href="/dashboard/prometheus" className="dash-nav-item">
                <span className="dash-nav-icon">◉</span>
                Prometheus
              </Link>
            </>
          )}

          {adminUser && (
            <>
              <div className="dash-nav-section" style={{ marginTop: 8 }}>Admin</div>

              <Link href="/dashboard/david" className="dash-nav-item">
                <span className="dash-nav-icon">◻</span>
                David
              </Link>

              <Link href="/dashboard/admin/adspy" className="dash-nav-item">
                <span className="dash-nav-icon">◧</span>
                Meredith
              </Link>

              <Link href="/dashboard/admin" className="dash-nav-item">
                <span className="dash-nav-icon">◱</span>
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
