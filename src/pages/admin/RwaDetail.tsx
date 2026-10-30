import { ArrowLeft, ArrowUpRight, Ban, Check, CreditCard, ExternalLink, Megaphone, MessageSquareWarning, Pencil, Power, UserCog, Users } from 'lucide-react'
import { useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { ActivityFeed } from '../../components/activity'
import { AssignPlanDialog, useJoinReview, useStatusChange } from '../../components/rwaDialogs'
import { useToast } from '../../components/toast'
import { Avatar, Badge, Button, Card, CardHeader, DefinitionList, MetricCard, Notice, PageHeader, StatusBadge, Tabs, Textarea, Toggle } from '../../components/ui'
import { isOpenComplaint, residentCount, useStore } from '../../lib/store'
import { COMPLAINT_STATUSES, FEATURE_LABELS, type FeatureKey } from '../../lib/types'
import { formatDate } from '../../lib/utils'
import Announcements from '../modules/Announcements'
import Complaints from '../modules/Complaints'
import Members from '../modules/Members'
import Staff from '../modules/Staff'

type Tab = 'overview' | 'members' | 'staff' | 'complaints' | 'announcements' | 'settings'

export default function RwaDetail() {
  const { rwaId = '' } = useParams()
  const { state } = useStore()
  const navigate = useNavigate()
  const [tab, setTab] = useState<Tab>('overview')
  const [planOpen, setPlanOpen] = useState(false)
  const status = useStatusChange()
  const review = useJoinReview()
  const rwa = state.rwas.find((r) => r.id === rwaId)

  if (!rwa) {
    return (
      <Notice tone="danger">
        RWA not found. <Link to="/admin/rwas" className="underline">Back to RWA Management</Link>
      </Notice>
    )
  }

  const plan = state.plans.find((p) => p.id === rwa.planId)
  const complaints = state.complaints.filter((c) => c.rwaId === rwa.id)
  const announcements = state.announcements.filter((a) => a.rwaId === rwa.id)
  const staff = state.staff.filter((s) => s.rwaId === rwa.id)

  const manageLink = (to: string, label: string) => (
    <div className="mb-3 flex items-center justify-between gap-2 rounded-lg border border-zinc-200 bg-white px-4 py-2.5 text-[13px] text-zinc-600">
      <span>Read-only view of {rwa.name}. Editing happens in a dedicated screen to avoid changing the wrong society.</span>
      <Button size="sm" onClick={() => navigate(to)} icon={<ArrowUpRight className="size-3.5" />}>
        {label}
      </Button>
    </div>
  )

  return (
    <>
      <PageHeader
        breadcrumb={
          <Link to="/admin/rwas" className="inline-flex items-center gap-1 hover:text-zinc-800">
            <ArrowLeft className="size-3.5" /> RWA Management
          </Link>
        }
        title={
          <span className="flex flex-wrap items-center gap-3">
            <Avatar name={rwa.name} src={rwa.logo} square size="md" />
            {rwa.name}
            <StatusBadge status={rwa.status} />
          </span>
        }
        description={`${rwa.address}, ${rwa.city}, ${rwa.state} ${rwa.pin}`}
        actions={
          <>
            {rwa.status === 'Pending' ? (
              <Button variant="primary" icon={<Check className="size-4" />} onClick={() => review.approve(rwa)}>
                Approve request
              </Button>
            ) : rwa.status === 'Suspended' || rwa.status === 'Deactivated' ? (
              <Button variant="primary" icon={<Power className="size-4" />} onClick={() => status.request(rwa, 'Active')}>
                Reactivate
              </Button>
            ) : (
              <Button variant="outline-danger" icon={<Ban className="size-4" />} onClick={() => status.request(rwa, 'Suspended')}>
                Suspend
              </Button>
            )}
            <Button icon={<CreditCard className="size-4" />} onClick={() => setPlanOpen(true)}>
              Assign plan
            </Button>
            <Button icon={<Pencil className="size-4" />} onClick={() => navigate(`/admin/rwas/${rwa.id}/edit`)}>
              Edit
            </Button>
            <Button variant="ghost" icon={<ExternalLink className="size-4" />} onClick={() => navigate(`/rwa/${rwa.id}`)}>
              Society portal
            </Button>
          </>
        }
      />

      {rwa.status === 'Pending' && rwa.joinRequest && (
        <Notice tone="warning" className="mb-5">
          Join request submitted {formatDate(rwa.joinRequest.submittedAt)} via the public join page (
          {rwa.joinRequest.mode === 'purchase' ? 'simulated purchase marked successful — no money was collected' : 'manual approval'}).
        </Notice>
      )}

      <Tabs<Tab>
        value={tab}
        onChange={setTab}
        tabs={[
          { value: 'overview', label: 'Overview' },
          { value: 'members', label: 'Members' },
          { value: 'staff', label: 'Staff' },
          { value: 'complaints', label: 'Complaints' },
          { value: 'announcements', label: 'Announcements' },
          { value: 'settings', label: 'Settings' },
        ]}
      />

      {tab === 'overview' && (
        <div className="space-y-5">
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            <MetricCard label="Residents" value={residentCount(state.members, rwa.id)} icon={<Users />} hint={`${rwa.units} units`} onClick={() => setTab('members')} />
            <MetricCard label="Active staff" value={staff.filter((s) => s.status === 'Active').length} icon={<UserCog />} onClick={() => setTab('staff')} />
            <MetricCard label="Open complaints" value={complaints.filter(isOpenComplaint).length} icon={<MessageSquareWarning />} tone="warning" onClick={() => setTab('complaints')} />
            <MetricCard label="Announcements" value={announcements.filter((a) => a.status === 'Published').length} icon={<Megaphone />} hint={`${announcements.filter((a) => a.status === 'Draft').length} drafts`} onClick={() => setTab('announcements')} />
          </div>
          <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
            <div className="space-y-5 lg:col-span-2">
              <Card>
                <CardHeader title="Society profile" />
                <div className="p-5">
                  <DefinitionList
                    items={[
                      { label: 'Address', value: `${rwa.address}, ${rwa.city}` },
                      { label: 'State / PIN', value: `${rwa.state} ${rwa.pin}` },
                      { label: 'Residential units', value: rwa.units },
                      { label: 'Registration number', value: rwa.regNo },
                      { label: 'Onboarded', value: `${formatDate(rwa.createdAt)} · ${rwa.source === 'join' ? 'public join flow' : 'manual'}` },
                      { label: 'Internal notes', value: rwa.notes },
                    ]}
                  />
                </div>
              </Card>
              <Card>
                <CardHeader title="Administrative contacts" />
                <div className="grid grid-cols-1 gap-4 p-5 sm:grid-cols-2">
                  {[
                    { role: 'President', name: rwa.presidentName, lines: [rwa.presidentPhone] },
                    { role: 'Administrator', name: rwa.adminName, lines: [rwa.adminEmail, rwa.adminPhone] },
                  ].map((c) => (
                    <div key={c.role} className="flex items-start gap-3 rounded-lg border border-zinc-100 p-3">
                      <Avatar name={c.name} />
                      <div className="min-w-0 text-sm">
                        <p className="font-medium text-zinc-900">{c.name}</p>
                        <p className="text-xs text-zinc-500">{c.role}</p>
                        {c.lines.filter(Boolean).map((l) => (
                          <p key={l} className="mt-1 truncate text-[13px] text-zinc-600">
                            {l}
                          </p>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </Card>
              <Card>
                <CardHeader title="Recent activity" />
                <ActivityFeed items={state.activity.filter((a) => a.rwaId === rwa.id).slice(0, 6)} />
              </Card>
            </div>
            <div className="space-y-5">
              <Card>
                <CardHeader title="Plan & subscription" action={<Button size="sm" variant="ghost" onClick={() => setPlanOpen(true)}>Change</Button>} />
                <div className="space-y-3 p-5 text-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-zinc-500">Plan</span>
                    <Badge tone="brand">{plan?.name ?? '—'}</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-zinc-500">Subscription</span>
                    <StatusBadge status={rwa.subscription.status} />
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-zinc-500">{rwa.subscription.trialEndsAt ? 'Trial ends' : 'Renewal'}</span>
                    <span className="text-zinc-900">{formatDate(rwa.subscription.trialEndsAt ?? rwa.subscription.renewalDate)}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-zinc-500">Limits</span>
                    <span className="text-zinc-900">
                      {plan?.residentLimit.toLocaleString()} residents · {plan?.staffLimit} staff
                    </span>
                  </div>
                </div>
              </Card>
              <Card>
                <CardHeader title="Complaint summary" />
                <ul className="space-y-2 p-5">
                  {COMPLAINT_STATUSES.map((s) => {
                    const n = complaints.filter((c) => c.status === s).length
                    return (
                      <li key={s} className="flex items-center justify-between text-sm">
                        <StatusBadge status={s} />
                        <span className="text-zinc-900 tabular-nums">{n}</span>
                      </li>
                    )
                  })}
                </ul>
              </Card>
              <Card>
                <CardHeader title="Available features" action={<Button size="sm" variant="ghost" onClick={() => setTab('settings')}>Configure</Button>} />
                <ul className="space-y-2 p-5">
                  {(Object.keys(FEATURE_LABELS) as FeatureKey[]).map((f) => (
                    <li key={f} className="flex items-center justify-between text-sm">
                      <span className={rwa.features.includes(f) ? 'text-zinc-800' : 'text-zinc-400 line-through'}>{FEATURE_LABELS[f]}</span>
                      {rwa.features.includes(f) ? <Check className="size-4 text-emerald-600" /> : <span className="text-xs text-zinc-400">Off</span>}
                    </li>
                  ))}
                </ul>
              </Card>
              <Card>
                <CardHeader title="Announcements" />
                <ul className="divide-y divide-zinc-100">
                  {announcements.slice(0, 3).map((a) => (
                    <li key={a.id} className="flex items-center justify-between gap-2 px-5 py-2.5 text-sm">
                      <span className="truncate">{a.title}</span>
                      <StatusBadge status={a.status} />
                    </li>
                  ))}
                  {!announcements.length && <li className="px-5 py-3 text-sm text-zinc-500">No announcements yet.</li>}
                </ul>
              </Card>
            </div>
          </div>
        </div>
      )}

      {tab === 'members' && (
        <>
          {manageLink(`/admin/members?rwa=${rwa.id}`, 'Manage members')}
          <Members scopeRwaId={rwa.id} readOnly embedded />
        </>
      )}
      {tab === 'staff' && (
        <>
          {manageLink(`/admin/staff?rwa=${rwa.id}`, 'Manage staff')}
          <Staff scopeRwaId={rwa.id} readOnly embedded />
        </>
      )}
      {tab === 'complaints' && (
        <>
          {manageLink(`/admin/complaints?rwa=${rwa.id}`, 'Manage complaints')}
          <Complaints scopeRwaId={rwa.id} readOnly embedded />
        </>
      )}
      {tab === 'announcements' && <Announcements scopeRwaId={rwa.id} readOnly embedded />}
      {tab === 'settings' && <RwaAdminSettings rwaId={rwa.id} onDeactivate={() => status.request(rwa, 'Deactivated')} />}

      <AssignPlanDialog rwa={planOpen ? rwa : null} onClose={() => setPlanOpen(false)} />
      {status.dialog}
      {review.dialog}
    </>
  )
}

function RwaAdminSettings({ rwaId, onDeactivate }: { rwaId: string; onDeactivate: () => void }) {
  const { state, updateRwa } = useStore()
  const toast = useToast()
  const rwa = state.rwas.find((r) => r.id === rwaId)!
  const [notes, setNotes] = useState(rwa.notes ?? '')

  const toggle = (f: FeatureKey, on: boolean) => {
    const features = on ? [...rwa.features, f] : rwa.features.filter((x) => x !== f)
    updateRwa(rwa.id, { features }, `${FEATURE_LABELS[f]} ${on ? 'enabled' : 'disabled'} for ${rwa.name}`)
    toast({ title: `${FEATURE_LABELS[f]} ${on ? 'enabled' : 'disabled'}`, description: rwa.name })
  }

  return (
    <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
      <Card>
        <CardHeader title="Feature availability" description="Control which modules this society can use. Defaults come from the assigned plan." />
        <ul className="divide-y divide-zinc-100">
          {(Object.keys(FEATURE_LABELS) as FeatureKey[]).map((f) => (
            <li key={f} className="flex items-center justify-between gap-3 px-5 py-3">
              <div>
                <p className="text-sm font-medium text-zinc-900">{FEATURE_LABELS[f]}</p>
                {!state.settings.features[f] && <p className="text-xs text-amber-700">Disabled platform-wide in Settings</p>}
              </div>
              <Toggle label={FEATURE_LABELS[f]} checked={rwa.features.includes(f)} onChange={(v) => toggle(f, v)} />
            </li>
          ))}
        </ul>
      </Card>
      <div className="space-y-5">
        <Card>
          <CardHeader title="Internal notes" description="Only visible to the Anytime Help team." />
          <div className="space-y-3 p-5">
            <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} aria-label="Internal notes" />
            <div className="flex justify-end">
              <Button
                size="sm"
                variant="primary"
                disabled={notes === (rwa.notes ?? '')}
                onClick={() => {
                  updateRwa(rwa.id, { notes }, `Internal notes updated for ${rwa.name}`)
                  toast({ title: 'Notes saved' })
                }}
              >
                Save notes
              </Button>
            </div>
          </div>
        </Card>
        <Card className="border-red-200">
          <CardHeader title="Danger zone" />
          <div className="flex flex-wrap items-center justify-between gap-3 p-5">
            <p className="max-w-sm text-sm text-zinc-600">Deactivating removes the society from active counts. Its records are kept and it can be reactivated.</p>
            <Button variant="outline-danger" disabled={rwa.status === 'Deactivated'} onClick={onDeactivate}>
              Deactivate RWA
            </Button>
          </div>
        </Card>
      </div>
    </div>
  )
}
