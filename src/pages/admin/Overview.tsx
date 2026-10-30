import {
  AlertCircle,
  ArrowRight,
  Building2,
  CheckCircle2,
  Clock,
  CreditCard,
  Image,
  ImagePlus,
  MessageSquareWarning,
  PauseCircle,
  Plus,
  UserCog,
  Users,
} from 'lucide-react'
import { Link, useNavigate } from 'react-router-dom'
import { ActivityFeed } from '../../components/activity'
import { CountBars, TrendArea } from '../../components/charts'
import { ChartCard, RwaIdentity } from '../../components/shared'
import { Badge, Button, Card, CardHeader, MetricCard, PageHeader } from '../../components/ui'
import { complaintStatusData, cumulativeByMonth, platformMetrics, residentsBySociety } from '../../lib/metrics'
import { useStore } from '../../lib/store'
import { timeAgo } from '../../lib/utils'

export default function Overview() {
  const { state } = useStore()
  const navigate = useNavigate()
  const m = platformMetrics(state)
  const pending = state.rwas.filter((r) => r.status === 'Pending')
  const plan = (id: string) => state.plans.find((p) => p.id === id)?.name ?? '—'

  return (
    <>
      <PageHeader
        title="Platform overview"
        description={`Every society on ${state.settings.platformName}, at a glance.`}
        actions={
          <Button variant="primary" icon={<Plus className="size-4" />} onClick={() => navigate('/admin/rwas/new')}>
            Add New RWA
          </Button>
        }
      />

      <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        <MetricCard label="Total RWAs" value={m.totalRwas} icon={<Building2 />} hint={`${m.trial} on trial`} onClick={() => navigate('/admin/rwas')} />
        <MetricCard label="Active RWAs" value={m.active} icon={<CheckCircle2 />} tone="success" onClick={() => navigate('/admin/rwas?status=Active')} />
        <MetricCard label="Pending RWAs" value={m.pending} icon={<Clock />} tone="warning" hint={m.pending ? 'Awaiting approval' : 'All caught up'} onClick={() => navigate('/admin/rwas?status=Pending')} />
        <MetricCard label="Suspended RWAs" value={m.suspended} icon={<PauseCircle />} tone="danger" onClick={() => navigate('/admin/rwas?status=Suspended')} />
        <MetricCard label="Total residents" value={m.residents} icon={<Users />} onClick={() => navigate('/admin/members')} />
        <MetricCard label="Active staff" value={m.staff} icon={<UserCog />} onClick={() => navigate('/admin/staff')} />
        <MetricCard label="Open complaints" value={m.openComplaints} icon={<MessageSquareWarning />} tone="warning" onClick={() => navigate('/admin/complaints')} />
        <MetricCard label="Active banners" value={m.activeBanners} icon={<Image />} onClick={() => navigate('/admin/banners')} />
      </div>

      {pending.length > 0 && (
        <Card className="mt-6 border-amber-200">
          <CardHeader
            title={
              <span className="flex items-center gap-2">
                <AlertCircle className="size-4 text-amber-600" /> Join requests awaiting approval
              </span>
            }
            description="Submitted from the public join page. Review and approve to activate the society."
            action={
              <Button size="sm" onClick={() => navigate('/admin/rwas?status=Pending')}>
                Review all
              </Button>
            }
          />
          <ul className="divide-y divide-zinc-100">
            {pending.slice(0, 4).map((r) => (
              <li key={r.id} className="flex flex-wrap items-center justify-between gap-3 px-5 py-3">
                <RwaIdentity rwa={r} link={`/admin/rwas/${r.id}`} />
                <div className="flex items-center gap-2 text-xs text-zinc-500">
                  <Badge tone="brand">{plan(r.planId)}</Badge>
                  {r.joinRequest?.mode === 'purchase' ? <Badge tone="violet">Demo purchase</Badge> : <Badge tone="amber">Manual approval</Badge>}
                  <span>{timeAgo(r.createdAt)}</span>
                </div>
              </li>
            ))}
          </ul>
        </Card>
      )}

      <div className="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-2">
        <ChartCard title="RWA onboarding growth" description="Cumulative societies onboarded, last 12 months">
          <TrendArea data={cumulativeByMonth(state.rwas.filter((r) => r.status !== 'Deactivated'), 12)} name="RWAs" />
        </ChartCard>
        <ChartCard title="Resident growth" description="Cumulative registered residents, last 12 months">
          <TrendArea data={cumulativeByMonth(state.members.filter((x) => x.status !== 'Rejected'), 12)} name="Residents" />
        </ChartCard>
        <ChartCard title="Complaint status" description={`${state.complaints.length} complaints across all societies`}>
          <CountBars data={complaintStatusData(state.complaints)} dataKey="status" name="Complaints" horizontal />
        </ChartCard>
        <ChartCard title="Residents by society" description="Registered residents per RWA">
          <CountBars data={residentsBySociety(state)} name="Residents" horizontal />
        </ChartCard>
      </div>

      <div className="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader
            title="Recent activity"
            description="Simulated audit trail of demo actions"
            action={
              <Link to="/admin/activity" className="inline-flex items-center gap-1 text-[13px] font-medium text-brand hover:underline">
                View all <ArrowRight className="size-3.5" />
              </Link>
            }
          />
          <ActivityFeed items={state.activity.slice(0, 7)} />
        </Card>
        <Card>
          <CardHeader title="Quick actions" />
          <div className="grid grid-cols-1 gap-2 p-4">
            {[
              { label: 'Add New RWA', desc: 'Manually onboard a society', icon: Plus, to: '/admin/rwas/new' },
              { label: 'Create Banner', desc: 'Publish platform content', icon: ImagePlus, to: '/admin/banners?new=1' },
              { label: 'View All RWAs', desc: 'Search, filter and manage', icon: Building2, to: '/admin/rwas' },
              { label: 'Manage Plans', desc: 'Pricing and subscriptions', icon: CreditCard, to: '/admin/plans' },
            ].map((a) => (
              <Link key={a.label} to={a.to} className="group flex items-center gap-3 rounded-lg border border-zinc-200 p-3 transition hover:border-brand/40 hover:bg-brand-soft/50">
                <span className="flex size-9 items-center justify-center rounded-lg bg-brand-soft text-brand">
                  <a.icon className="size-4" />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block text-sm font-medium text-zinc-900">{a.label}</span>
                  <span className="block text-xs text-zinc-500">{a.desc}</span>
                </span>
                <ArrowRight className="size-4 text-zinc-300 transition group-hover:translate-x-0.5 group-hover:text-brand" />
              </Link>
            ))}
          </div>
        </Card>
      </div>
    </>
  )
}
