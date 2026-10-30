import { ArrowRight, Lock, Megaphone, MessageSquareWarning, Plus, UserCog, UserPlus, Users } from 'lucide-react'
import { Link, useParams } from 'react-router-dom'
import { BannerArt } from '../../components/shared'
import { Badge, Card, CardHeader, EmptyState, MetricCard, PageHeader, StatusBadge } from '../../components/ui'
import { liveBannersFor } from '../../lib/metrics'
import { demoResident, isOpenComplaint, residentCount, useStore } from '../../lib/store'
import { ROLE_LABELS } from '../../lib/types'
import { formatDate, timeAgo } from '../../lib/utils'
import { useFeature } from '../../components/layout'

export default function RwaOverview() {
  const { rwaId = '' } = useParams()
  const { state, session, can } = useStore()
  const hasFeature = useFeature()
  const rwa = state.rwas.find((r) => r.id === rwaId)!
  const base = `/rwa/${rwaId}`
  const isResident = session.role === 'resident'
  const me = isResident ? demoResident(state.members, rwaId) : undefined
  const plan = state.plans.find((p) => p.id === rwa.planId)

  const complaints = state.complaints.filter((c) => c.rwaId === rwaId && (!isResident || c.memberId === me?.id))
  const announcements = state.announcements
    .filter((a) => a.rwaId === rwaId && a.status === 'Published' && (!a.expiresAt || new Date(a.expiresAt) > new Date()))
    .sort((a, b) => (b.publishedAt ?? '').localeCompare(a.publishedAt ?? ''))
  const banners = state.settings.features.platformBanners && can('banners', 'view') ? liveBannersFor(state.banners, rwaId) : []
  const pendingMembers = state.members.filter((m) => m.rwaId === rwaId && m.status === 'Pending').length

  const quick = [
    { label: 'Add resident', icon: UserPlus, to: `${base}/members`, show: can('members', 'create') },
    { label: 'Add staff', icon: UserCog, to: `${base}/staff`, show: can('staff', 'create') },
    { label: isResident ? 'Raise a complaint' : 'Manage complaints', icon: MessageSquareWarning, to: `${base}/complaints`, show: can('complaints', 'view') && hasFeature(rwaId, 'complaints') },
    { label: 'Post announcement', icon: Megaphone, to: `${base}/announcements`, show: can('announcements', 'create') && hasFeature(rwaId, 'announcements') },
  ].filter((q) => q.show)

  return (
    <>
      <PageHeader
        title={isResident ? `Hello, ${me?.name.split(' ')[0] ?? 'resident'}` : rwa.name}
        description={
          isResident
            ? `${me?.flat ?? ''} · ${rwa.name}`
            : `${ROLE_LABELS[session.role]} workspace · ${rwa.city}, ${rwa.state}`
        }
        actions={<Badge tone="brand">{plan?.name} plan</Badge>}
      />

      {!isResident && (
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          <MetricCard label="Residents" value={residentCount(state.members, rwaId)} icon={<Users />} hint={pendingMembers ? `${pendingMembers} pending approval` : `${rwa.units} units`} />
          <MetricCard label="Active staff" value={state.staff.filter((s) => s.rwaId === rwaId && s.status === 'Active').length} icon={<UserCog />} />
          <MetricCard label="Open complaints" value={complaints.filter(isOpenComplaint).length} icon={<MessageSquareWarning />} tone="warning" />
          <MetricCard label="Live announcements" value={announcements.length} icon={<Megaphone />} />
        </div>
      )}

      {banners.length > 0 && (
        <section className="mt-6">
          <div className="mb-2 flex flex-wrap items-center gap-2">
            <Badge tone="violet">Platform banner</Badge>
            <span className="text-[13px] text-zinc-500">From {state.settings.platformName} · managed centrally</span>
            <span className="ml-auto inline-flex items-center gap-1 text-xs text-zinc-400">
              <Lock className="size-3" /> Not editable by societies
            </span>
          </div>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {banners.map((b) => (
              <BannerArt key={b.id} banner={b} className="h-36 rounded-xl" />
            ))}
          </div>
        </section>
      )}

      <div className="mt-6 grid grid-cols-1 gap-5 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader
            title={isResident ? 'My complaints' : 'Latest complaints'}
            action={
              can('complaints', 'view') && (
                <Link to={`${base}/complaints`} className="inline-flex items-center gap-1 text-[13px] font-medium text-brand hover:underline">
                  View all <ArrowRight className="size-3.5" />
                </Link>
              )
            }
          />
          {complaints.length ? (
            <ul className="divide-y divide-zinc-100">
              {[...complaints]
                .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
                .slice(0, 5)
                .map((c) => (
                  <li key={c.id} className="flex items-center justify-between gap-3 px-5 py-3">
                    <div className="min-w-0">
                      <p className="truncate text-sm text-zinc-900">
                        <span className="font-medium">{c.code}</span> · {c.description}
                      </p>
                      <p className="text-xs text-zinc-500">
                        {c.category} · {c.flat} · {timeAgo(c.createdAt)}
                      </p>
                    </div>
                    <StatusBadge status={c.status} />
                  </li>
                ))}
            </ul>
          ) : (
            <div className="p-4">
              <EmptyState title="No complaints" description="Nothing to show yet." />
            </div>
          )}
        </Card>

        <div className="space-y-5">
          {quick.length > 0 && (
            <Card>
              <CardHeader title="Quick actions" />
              <div className="grid grid-cols-1 gap-2 p-4">
                {quick.map((q) => (
                  <Link key={q.label} to={q.to} className="flex items-center gap-3 rounded-lg border border-zinc-200 px-3 py-2.5 text-sm font-medium text-zinc-800 transition hover:border-brand/40 hover:bg-brand-soft/50">
                    <span className="flex size-8 items-center justify-center rounded-lg bg-brand-soft text-brand">
                      <q.icon className="size-4" />
                    </span>
                    {q.label}
                    <Plus className="ml-auto size-4 text-zinc-300" />
                  </Link>
                ))}
              </div>
            </Card>
          )}
          <Card>
            <CardHeader title="Society announcements" />
            {announcements.length ? (
              <ul className="divide-y divide-zinc-100">
                {announcements.slice(0, 4).map((a) => (
                  <li key={a.id} className="px-5 py-3">
                    <p className="text-sm font-medium text-zinc-900">{a.title}</p>
                    <p className="line-clamp-2 text-[13px] text-zinc-600">{a.body}</p>
                    <p className="mt-1 text-xs text-zinc-400">{formatDate(a.publishedAt)}</p>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="px-5 py-4 text-sm text-zinc-500">No announcements right now.</p>
            )}
          </Card>
        </div>
      </div>
    </>
  )
}
