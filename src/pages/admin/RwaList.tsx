import { Ban, Building2, Check, CreditCard, Eye, MessageSquareWarning, Pencil, Plus, Power, UserCog, Users, X } from 'lucide-react'
import { useMemo, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { ActionMenu } from '../../components/menu'
import { AssignPlanDialog, useJoinReview, useStatusChange } from '../../components/rwaDialogs'
import { RwaIdentity } from '../../components/shared'
import { Badge, Button, Card, DataTable, EmptyState, FilterBar, PageHeader, SearchInput, Segmented, StatusBadge, type Column } from '../../components/ui'
import { isOpenComplaint, residentCount, useStore } from '../../lib/store'
import type { Rwa, RwaStatus } from '../../lib/types'
import { formatDate } from '../../lib/utils'

type Filter = 'All' | RwaStatus

export default function RwaList() {
  const { state } = useStore()
  const navigate = useNavigate()
  const [params, setParams] = useSearchParams()
  const filter = (params.get('status') as Filter) || 'All'
  const [q, setQ] = useState('')
  const [planFor, setPlanFor] = useState<Rwa | null>(null)
  const status = useStatusChange()
  const review = useJoinReview()

  const stats = useMemo(() => {
    const map = new Map<string, { residents: number; staff: number; open: number }>()
    for (const r of state.rwas) {
      map.set(r.id, {
        residents: residentCount(state.members, r.id),
        staff: state.staff.filter((s) => s.rwaId === r.id && s.status === 'Active').length,
        open: state.complaints.filter((c) => c.rwaId === r.id && isOpenComplaint(c)).length,
      })
    }
    return map
  }, [state])

  const rows = state.rwas.filter((r) => {
    if (filter !== 'All' && r.status !== filter) return false
    if (filter === 'All' && r.status === 'Deactivated') return false
    const needle = q.trim().toLowerCase()
    return !needle || [r.name, r.city, r.state, r.adminEmail, r.adminPhone, r.adminName].some((v) => v.toLowerCase().includes(needle))
  })

  const count = (s: RwaStatus) => state.rwas.filter((r) => r.status === s).length
  const planName = (id: string) => state.plans.find((p) => p.id === id)?.name ?? '—'

  const columns: Column<Rwa>[] = [
    { key: 'name', header: 'RWA', render: (r) => <RwaIdentity rwa={r} link={`/admin/rwas/${r.id}`} />, className: 'min-w-56' },
    { key: 'president', header: 'President', render: (r) => <span className="whitespace-nowrap">{r.presidentName}</span> },
    {
      key: 'contact',
      header: 'Admin contact',
      render: (r) => (
        <div className="text-xs">
          <p className="font-medium whitespace-nowrap text-zinc-800">{r.adminName}</p>
          <p className="text-zinc-500">{r.adminEmail}</p>
        </div>
      ),
    },
    { key: 'res', header: 'Residents', render: (r) => <span className="tabular-nums">{stats.get(r.id)?.residents}</span>, className: 'text-right' },
    { key: 'staff', header: 'Staff', render: (r) => <span className="tabular-nums">{stats.get(r.id)?.staff}</span>, className: 'text-right' },
    {
      key: 'open',
      header: 'Open',
      render: (r) => {
        const n = stats.get(r.id)?.open ?? 0
        return <span className={n ? 'font-medium text-amber-700 tabular-nums' : 'text-zinc-400 tabular-nums'}>{n}</span>
      },
      className: 'text-right',
    },
    { key: 'plan', header: 'Plan', render: (r) => <Badge tone="brand">{planName(r.planId)}</Badge> },
    {
      key: 'status',
      header: 'Status',
      render: (r) => (
        <div className="flex flex-col items-start gap-1">
          <StatusBadge status={r.status} />
          {r.status === 'Pending' && r.joinRequest && <span className="text-[11px] text-zinc-500">{r.joinRequest.mode === 'purchase' ? 'Demo purchase' : 'Join request'}</span>}
        </div>
      ),
    },
    { key: 'date', header: 'Onboarded', render: (r) => <span className="whitespace-nowrap text-zinc-500">{formatDate(r.createdAt)}</span> },
    {
      key: 'actions',
      header: <span className="sr-only">Actions</span>,
      className: 'text-right',
      render: (r) => (
        <div className="flex items-center justify-end gap-1">
          {r.status === 'Pending' && (
            <>
              <Button size="sm" variant="primary" icon={<Check className="size-3.5" />} onClick={(e) => { e.stopPropagation(); review.approve(r) }}>
                Approve
              </Button>
              <Button size="sm" variant="ghost" aria-label="Decline" onClick={(e) => { e.stopPropagation(); review.reject(r) }}>
                <X className="size-4" />
              </Button>
            </>
          )}
          <ActionMenu
            items={[
              { label: 'View details', icon: <Eye />, onClick: () => navigate(`/admin/rwas/${r.id}`) },
              { label: 'Edit RWA', icon: <Pencil />, onClick: () => navigate(`/admin/rwas/${r.id}/edit`) },
              { label: 'Manage members', icon: <Users />, onClick: () => navigate(`/admin/members?rwa=${r.id}`), divider: true },
              { label: 'Manage staff', icon: <UserCog />, onClick: () => navigate(`/admin/staff?rwa=${r.id}`) },
              { label: 'View complaints', icon: <MessageSquareWarning />, onClick: () => navigate(`/admin/complaints?rwa=${r.id}`) },
              { label: 'Assign plan', icon: <CreditCard />, onClick: () => setPlanFor(r) },
              { label: 'Activate', icon: <Power />, onClick: () => status.request(r, 'Active'), hidden: r.status === 'Active' || r.status === 'Pending', divider: true },
              { label: 'Suspend', icon: <Ban />, onClick: () => status.request(r, 'Suspended'), danger: true, hidden: r.status === 'Suspended' || r.status === 'Deactivated' || r.status === 'Pending' },
            ]}
          />
        </div>
      ),
    },
  ]

  return (
    <>
      <PageHeader
        title="RWA Management"
        description="Onboard societies, review join requests and control account status."
        actions={
          <Button variant="primary" icon={<Plus className="size-4" />} onClick={() => navigate('/admin/rwas/new')}>
            Add New RWA
          </Button>
        }
      />
      <Card>
        <FilterBar>
          <Segmented<Filter>
            value={filter}
            onChange={(v) => setParams(v === 'All' ? {} : { status: v }, { replace: true })}
            options={[
              { value: 'All', label: 'All RWAs', count: state.rwas.filter((r) => r.status !== 'Deactivated').length },
              { value: 'Active', label: 'Active', count: count('Active') },
              { value: 'Pending', label: 'Pending', count: count('Pending') },
              { value: 'Trial', label: 'Trial', count: count('Trial') },
              { value: 'Suspended', label: 'Suspended', count: count('Suspended') },
              { value: 'Deactivated', label: 'Deactivated', count: count('Deactivated') },
            ]}
          />
          <SearchInput value={q} onChange={setQ} placeholder="Search name, city or admin contact" className="sm:ml-auto" />
        </FilterBar>
        <DataTable
          columns={columns}
          rows={rows}
          onRowClick={(r) => navigate(`/admin/rwas/${r.id}`)}
          empty={
            <EmptyState
              icon={<Building2 />}
              title={q ? 'No RWAs match your search' : `No ${filter === 'All' ? '' : filter.toLowerCase() + ' '}RWAs`}
              description={q ? 'Try a different name, city or contact.' : 'Societies you onboard will appear here.'}
            />
          }
        />
      </Card>
      <AssignPlanDialog rwa={planFor} onClose={() => setPlanFor(null)} />
      {status.dialog}
      {review.dialog}
    </>
  )
}
