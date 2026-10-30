/* eslint-disable react-refresh/only-export-components */
import {
  Activity,
  BarChart3,
  Bell,
  Building2,
  ChevronsLeft,
  ChevronsRight,
  CreditCard,
  ExternalLink,
  Image,
  LayoutDashboard,
  Megaphone,
  Menu,
  MessageSquareWarning,
  Settings,
  ShieldCheck,
  UserCog,
  Users,
  X,
  type LucideIcon,
} from 'lucide-react'
import { Suspense, useEffect, useState, type ReactNode } from 'react'
import { Link, NavLink, Outlet, useLocation, useNavigate, useParams } from 'react-router-dom'
import { useStore } from '../lib/store'
import { ROLE_LABELS, type FeatureKey, type Module, type Role } from '../lib/types'
import { cn } from '../lib/utils'
import { AccessDenied } from './shared'
import { Avatar, Badge, Button, Notice, PageSkeleton } from './ui'

interface NavItem {
  to: string
  label: string
  icon: LucideIcon
  end?: boolean
  badge?: number
}

function BrandMark({ collapsed }: { collapsed?: boolean }) {
  const { state } = useStore()
  const { platformName, logo } = state.settings
  return (
    <div className="flex items-center gap-2.5">
      {logo ? (
        <img src={logo} alt="" className="size-8 shrink-0 rounded-lg object-cover" />
      ) : (
        <img src="/logo-mark.png" alt="" className="size-9 shrink-0 object-contain" />
      )}
      {!collapsed && <span className="truncate text-[15px] font-semibold tracking-tight text-zinc-900">{platformName}</span>}
    </div>
  )
}

function Sidebar({ items, sectionLabel, collapsed, onToggle, onNavigate }: { items: NavItem[]; sectionLabel: string; collapsed: boolean; onToggle?: () => void; onNavigate?: () => void }) {
  return (
    <div className="flex h-full flex-col">
      <div className={cn('flex h-14 items-center border-b border-zinc-100', collapsed ? 'justify-center px-2' : 'px-4')}>
        <BrandMark collapsed={collapsed} />
      </div>
      <nav className="thin-scroll flex-1 overflow-y-auto p-2.5">
        {!collapsed && <p className="px-2.5 pt-2 pb-1.5 text-[11px] font-semibold tracking-wider text-zinc-400 uppercase">{sectionLabel}</p>}
        <ul className="space-y-0.5">
          {items.map((item) => (
            <li key={item.to}>
              <NavLink
                to={item.to}
                end={item.end}
                onClick={onNavigate}
                title={collapsed ? item.label : undefined}
                className={({ isActive }) =>
                  cn(
                    'group flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-[13.5px] font-medium transition-colors',
                    collapsed && 'justify-center',
                    isActive ? 'bg-brand-soft text-brand' : 'text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900',
                  )
                }
              >
                <item.icon className="size-[18px] shrink-0" />
                {!collapsed && <span className="flex-1 truncate">{item.label}</span>}
                {!collapsed && !!item.badge && <span className="rounded-full bg-amber-100 px-1.5 text-[11px] font-semibold text-amber-800 tabular-nums">{item.badge}</span>}
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>
      <div className="border-t border-zinc-100 p-2.5">
        <Link
          to="/join"
          className={cn('flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-[13px] text-zinc-500 hover:bg-zinc-100 hover:text-zinc-900', collapsed && 'justify-center')}
          title="Public join page"
        >
          <ExternalLink className="size-4 shrink-0" />
          {!collapsed && 'Public join page'}
        </Link>
        {onToggle && (
          <button
            onClick={onToggle}
            className={cn('mt-0.5 flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-[13px] text-zinc-500 hover:bg-zinc-100 hover:text-zinc-900', collapsed && 'justify-center')}
            aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            {collapsed ? <ChevronsRight className="size-4" /> : <ChevronsLeft className="size-4" />}
            {!collapsed && 'Collapse'}
          </button>
        )}
      </div>
    </div>
  )
}

function RoleSwitcher() {
  const { state, session, setSession } = useStore()
  const navigate = useNavigate()
  const location = useLocation()
  const selectable = state.rwas.filter((r) => r.status !== 'Deactivated')

  const switchRole = (role: Role) => {
    const rwaId = selectable.some((r) => r.id === session.rwaId) ? session.rwaId : (selectable[0]?.id ?? '')
    setSession({ role, rwaId })
    navigate(role === 'super_admin' ? '/admin' : `/rwa/${rwaId}`)
  }

  const switchRwa = (rwaId: string) => {
    setSession({ ...session, rwaId })
    const sub = location.pathname.match(/^\/rwa\/[^/]+(\/.*)?$/)?.[1] ?? ''
    navigate(`/rwa/${rwaId}${sub}`)
  }

  return (
    <div className="flex items-center gap-1.5 rounded-lg border border-amber-200 bg-amber-50/70 py-1 pr-1 pl-2">
      <span className="hidden text-[11px] font-semibold tracking-wide text-amber-800 uppercase md:inline">Demo role</span>
      <select
        aria-label="Demo role"
        value={session.role}
        onChange={(e) => switchRole(e.target.value as Role)}
        className="h-7 max-w-[9.5rem] rounded-md border border-amber-200 bg-white px-1.5 text-[13px] font-medium text-zinc-800 focus:outline-none sm:max-w-none"
      >
        {(Object.keys(ROLE_LABELS) as Role[]).map((r) => (
          <option key={r} value={r}>
            {ROLE_LABELS[r]}
          </option>
        ))}
      </select>
      {session.role !== 'super_admin' && (
        <select
          aria-label="Active RWA"
          value={session.rwaId}
          onChange={(e) => switchRwa(e.target.value)}
          className="h-7 max-w-[8.5rem] rounded-md border border-amber-200 bg-white px-1.5 text-[13px] text-zinc-800 focus:outline-none sm:max-w-[13rem]"
        >
          {selectable.map((r) => (
            <option key={r.id} value={r.id}>
              {r.name}
            </option>
          ))}
        </select>
      )}
    </div>
  )
}

function Shell({ items, sectionLabel, context, children }: { items: NavItem[]; sectionLabel: string; context?: ReactNode; children: ReactNode }) {
  const { state, session, actorName, storageWarning } = useStore()
  const [collapsed, setCollapsed] = useState(() => localStorage.getItem('ah-sidebar') === '1')
  const [drawer, setDrawer] = useState(false)
  const location = useLocation()

  useEffect(() => {
    try {
      localStorage.setItem('ah-sidebar', collapsed ? '1' : '0')
    } catch {
      /* ignore */
    }
  }, [collapsed])

  useEffect(() => {
    window.scrollTo(0, 0)
  }, [location.pathname])

  const unread = state.notifications.filter(
    (n) => n.status === 'Published' && (session.role === 'super_admin' || n.audience === 'all' || n.rwaIds.includes(session.rwaId)),
  ).length
  const notifTo = session.role === 'super_admin' ? '/admin/notifications' : `/rwa/${session.rwaId}/notifications`

  return (
    <div className="min-h-screen">
      <aside className={cn('fixed inset-y-0 left-0 z-30 hidden border-r border-zinc-200/80 bg-white transition-[width] lg:block', collapsed ? 'w-[68px]' : 'w-64')}>
        <Sidebar items={items} sectionLabel={sectionLabel} collapsed={collapsed} onToggle={() => setCollapsed((c) => !c)} />
      </aside>

      {drawer && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div className="absolute inset-0 bg-zinc-950/40" onClick={() => setDrawer(false)} />
          <aside className="animate-fade-in absolute inset-y-0 left-0 w-72 max-w-[85vw] bg-white shadow-xl">
            <button className="absolute top-3.5 right-3 rounded-md p-1 text-zinc-500 hover:bg-zinc-100" aria-label="Close menu" onClick={() => setDrawer(false)}>
              <X className="size-5" />
            </button>
            <Sidebar items={items} sectionLabel={sectionLabel} collapsed={false} onNavigate={() => setDrawer(false)} />
          </aside>
        </div>
      )}

      <div className={cn('transition-[padding]', collapsed ? 'lg:pl-[68px]' : 'lg:pl-64')}>
        <header className="sticky top-0 z-20 flex h-14 items-center gap-2 border-b border-zinc-200/80 bg-white/90 px-3 backdrop-blur sm:px-6">
          <button className="rounded-md p-1.5 text-zinc-600 hover:bg-zinc-100 lg:hidden" aria-label="Open menu" onClick={() => setDrawer(true)}>
            <Menu className="size-5" />
          </button>
          <div className="hidden min-w-0 flex-1 md:block">{context}</div>
          <div className="ml-auto flex items-center gap-2">
            <RoleSwitcher />
            <Link to={notifTo} className="relative hidden rounded-lg p-2 text-zinc-500 hover:bg-zinc-100 hover:text-zinc-900 sm:block" aria-label="Notifications">
              <Bell className="size-[18px]" />
              {unread > 0 && <span className="absolute top-1.5 right-1.5 size-2 rounded-full bg-brand ring-2 ring-white" />}
            </Link>
            <div className="hidden items-center gap-2 border-l border-zinc-200 pl-3 xl:flex">
              <Avatar name={actorName()} size="sm" />
              <div className="leading-tight">
                <p className="max-w-40 truncate text-[13px] font-medium text-zinc-900">{actorName()}</p>
                <p className="text-[11px] text-zinc-500">{ROLE_LABELS[session.role]}</p>
              </div>
            </div>
          </div>
        </header>
        <main className="mx-auto w-full max-w-[1400px] px-4 py-6 sm:px-6 lg:py-8">
          {storageWarning && (
            <Notice tone="warning" className="mb-4">
              {storageWarning}
            </Notice>
          )}
          <Suspense fallback={<PageSkeleton />}>{children}</Suspense>
        </main>
      </div>
    </div>
  )
}

/* ---------- Super Admin layout ---------- */

export function AdminLayout() {
  const { state, session, setSession } = useStore()
  const navigate = useNavigate()
  const pending = state.rwas.filter((r) => r.status === 'Pending').length
  const items: NavItem[] = [
    { to: '/admin', label: 'Overview', icon: LayoutDashboard, end: true },
    { to: '/admin/rwas', label: 'RWA Management', icon: Building2, badge: pending },
    { to: '/admin/members', label: 'Members', icon: Users },
    { to: '/admin/staff', label: 'Staff', icon: UserCog },
    { to: '/admin/complaints', label: 'Complaints', icon: MessageSquareWarning },
    { to: '/admin/banners', label: 'Banners & Content', icon: Image },
    { to: '/admin/permissions', label: 'Roles & Permissions', icon: ShieldCheck },
    { to: '/admin/plans', label: 'Plans & Subscriptions', icon: CreditCard },
    { to: '/admin/notifications', label: 'Notifications', icon: Bell },
    { to: '/admin/analytics', label: 'Analytics & Reports', icon: BarChart3 },
    { to: '/admin/activity', label: 'Activity Logs', icon: Activity },
    { to: '/admin/settings', label: 'Settings', icon: Settings },
  ]

  if (session.role !== 'super_admin') {
    return (
      <Shell items={[]} sectionLabel="Super Admin">
        <AccessDenied
          title="Super Admin area"
          description={
            <>
              <span className="block">You are signed in as {ROLE_LABELS[session.role]} in this demo. Platform-wide pages are only available to the Super Admin.</span>
              <span className="mt-4 flex justify-center gap-2">
                <Button onClick={() => navigate(`/rwa/${session.rwaId}`)}>Go to my society</Button>
                <Button
                  variant="primary"
                  onClick={() => {
                    setSession({ ...session, role: 'super_admin' })
                  }}
                >
                  Switch to Super Admin
                </Button>
              </span>
            </>
          }
        />
      </Shell>
    )
  }

  return (
    <Shell items={items} sectionLabel="Platform" context={<span className="text-[13px] text-zinc-500">Super Admin Console · all societies</span>}>
      <Outlet />
    </Shell>
  )
}

/* ---------- RWA portal layout ---------- */

export function useFeature() {
  const { state } = useStore()
  return (rwaId: string, f: FeatureKey) => state.settings.features[f] && !!state.rwas.find((r) => r.id === rwaId)?.features.includes(f)
}

export function RwaLayout() {
  const { rwaId = '' } = useParams()
  const { state, session, can } = useStore()
  const hasFeature = useFeature()
  const navigate = useNavigate()
  const rwa = state.rwas.find((r) => r.id === rwaId)

  const base = `/rwa/${rwaId}`
  const items: (NavItem & { module?: Module; feature?: FeatureKey })[] = [
    { to: base, label: 'Society Overview', icon: LayoutDashboard, end: true },
    { to: `${base}/members`, label: 'Members', icon: Users, module: 'members' },
    { to: `${base}/staff`, label: 'Staff', icon: UserCog, module: 'staff' },
    { to: `${base}/complaints`, label: session.role === 'resident' ? 'My Complaints' : 'Complaints', icon: MessageSquareWarning, module: 'complaints', feature: 'complaints' },
    { to: `${base}/announcements`, label: 'Announcements', icon: Megaphone, module: 'announcements', feature: 'announcements' },
    { to: `${base}/notifications`, label: 'Notifications', icon: Bell, module: 'notifications', feature: 'notifications' },
    { to: `${base}/analytics`, label: 'Society Analytics', icon: BarChart3, module: 'analytics', feature: 'analytics' },
    { to: `${base}/settings`, label: 'Society Settings', icon: Settings, module: 'rwaSettings' },
  ]
  const visible = items.filter((i) => (!i.module || can(i.module, 'view')) && (!i.feature || hasFeature(rwaId, i.feature)))

  const context = rwa && (
    <div className="flex items-center gap-2 text-[13px]">
      <span className="truncate font-medium text-zinc-900">{rwa.name}</span>
      <span className="text-zinc-400">·</span>
      <span className="truncate text-zinc-500">
        {rwa.city} · Society portal
      </span>
    </div>
  )

  let body: ReactNode = <Outlet />
  if (!rwa) {
    body = <AccessDenied title="Society not found" description="This RWA does not exist in the demo data. It may have been removed by a demo reset." />
  } else if (session.role !== 'super_admin' && session.rwaId !== rwaId) {
    body = (
      <AccessDenied
        title="You can only access your own society"
        description={
          <>
            <span className="block">RWA-level roles are scoped to a single society. Data from {rwa.name} is not visible to your account.</span>
            <span className="mt-4 flex justify-center">
              <Button variant="primary" onClick={() => navigate(`/rwa/${session.rwaId}`)}>
                Back to my society
              </Button>
            </span>
          </>
        }
      />
    )
  }

  return (
    <Shell items={rwa ? visible : []} sectionLabel="Society" context={context}>
      {rwa && session.role === 'super_admin' && (
        <Notice tone="info" className="mb-4">
          You are previewing the <b>{rwa.name}</b> society portal as Super Admin. Switch the demo role to RWA Admin to act as this society.{' '}
          <Link to={`/admin/rwas/${rwa.id}`} className="font-medium underline">
            Back to RWA details
          </Link>
        </Notice>
      )}
      {rwa && (rwa.status === 'Suspended' || rwa.status === 'Pending' || rwa.status === 'Deactivated') && (
        <Notice tone={rwa.status === 'Pending' ? 'warning' : 'danger'} className="mb-4">
          <b>{rwa.name}</b> is currently <Badge tone={rwa.status === 'Pending' ? 'amber' : 'red'}>{rwa.status}</Badge>.{' '}
          {rwa.status === 'Pending' ? 'Anytime Help will review and activate this society soon.' : 'Please contact Anytime Help support to restore full access.'}
        </Notice>
      )}
      {body}
    </Shell>
  )
}
