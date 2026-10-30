import { Check, Minus, Pencil, Plus } from 'lucide-react'
import { useState } from 'react'
import { PlanCards } from '../../components/planCards'
import { AssignPlanDialog } from '../../components/rwaDialogs'
import { RwaIdentity } from '../../components/shared'
import { useToast } from '../../components/toast'
import { Badge, Button, Card, CardHeader, DataTable, Field, FilterBar, Input, Modal, Notice, PageHeader, Segmented, Select, StatusBadge, Textarea, Toggle, type Column } from '../../components/ui'
import { residentCount, useStore } from '../../lib/store'
import { FEATURE_LABELS, type FeatureKey, type Plan, type Rwa, type SubscriptionStatus } from '../../lib/types'
import { formatDate, uid } from '../../lib/utils'

export default function Plans() {
  const { state, savePlan } = useStore()
  const toast = useToast()
  const [editing, setEditing] = useState<Plan | 'new' | null>(null)
  const [assignFor, setAssignFor] = useState<Rwa | null>(null)
  const [subFilter, setSubFilter] = useState<'All' | SubscriptionStatus>('All')

  const subs = state.rwas.filter((r) => r.status !== 'Deactivated' && (subFilter === 'All' || r.subscription.status === subFilter))
  const columns: Column<Rwa>[] = [
    { key: 'rwa', header: 'Society', className: 'min-w-56', render: (r) => <RwaIdentity rwa={r} link={`/admin/rwas/${r.id}`} /> },
    { key: 'plan', header: 'Plan', render: (r) => <Badge tone="brand">{state.plans.find((p) => p.id === r.planId)?.name ?? '—'}</Badge> },
    { key: 'sub', header: 'Subscription', render: (r) => <StatusBadge status={r.subscription.status} /> },
    {
      key: 'usage',
      header: 'Residents used',
      render: (r) => {
        const limit = state.plans.find((p) => p.id === r.planId)?.residentLimit ?? 0
        const used = residentCount(state.members, r.id)
        return (
          <div className="w-28">
            <div className="flex justify-between text-xs text-zinc-500 tabular-nums">
              <span>{used}</span>
              <span>{limit.toLocaleString()}</span>
            </div>
            <div className="mt-1 h-1.5 rounded-full bg-zinc-100">
              <div className="h-full rounded-full bg-brand" style={{ width: `${Math.min(100, (used / Math.max(1, limit)) * 100)}%` }} />
            </div>
          </div>
        )
      },
    },
    { key: 'start', header: 'Started', render: (r) => <span className="whitespace-nowrap text-zinc-500">{formatDate(r.subscription.startDate)}</span> },
    {
      key: 'renew',
      header: 'Trial end / renewal',
      render: (r) => (
        <span className="whitespace-nowrap text-zinc-600">
          {r.subscription.trialEndsAt ? `Trial ends ${formatDate(r.subscription.trialEndsAt)}` : formatDate(r.subscription.renewalDate)}
        </span>
      ),
    },
    {
      key: 'act',
      header: <span className="sr-only">Actions</span>,
      className: 'text-right',
      render: (r) => (
        <Button size="sm" onClick={(e) => { e.stopPropagation(); setAssignFor(r) }}>
          Change plan
        </Button>
      ),
    },
  ]

  return (
    <>
      <PageHeader
        title="Plans & Subscriptions"
        description="Define demo plans and assign them to societies. Prices are illustrative and no billing is performed."
        actions={
          <Button variant="primary" icon={<Plus className="size-4" />} onClick={() => setEditing('new')}>
            New plan
          </Button>
        }
      />
      <Notice tone="warning" className="mb-5">
        Illustrative pricing only — not approved commercial pricing. No payment gateway is connected.
      </Notice>

      <PlanCards
        plans={state.plans}
        renderAction={(p) => (
          <div className="flex items-center justify-between gap-2 border-t border-zinc-100 pt-4">
            <label className="flex items-center gap-2 text-[13px] text-zinc-600">
              <Toggle
                label={`${p.name} enabled`}
                checked={p.status === 'Enabled'}
                onChange={(on) => {
                  savePlan({ ...p, status: on ? 'Enabled' : 'Disabled' })
                  toast({ title: `${p.name} ${on ? 'enabled' : 'disabled'}`, description: on ? 'Available on the public join page.' : 'Hidden from the join page; existing societies keep it.' })
                }}
              />
              {p.status}
            </label>
            <span className="text-xs text-zinc-500">{state.rwas.filter((r) => r.planId === p.id && r.status !== 'Deactivated').length} RWAs</span>
            <Button size="sm" icon={<Pencil className="size-3.5" />} onClick={(e) => { e.stopPropagation(); setEditing(p) }}>
              Edit
            </Button>
          </div>
        )}
      />

      <Card className="mt-6">
        <CardHeader title="Plan comparison" description="Features enabled by default for societies on each plan." />
        <div className="thin-scroll overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-zinc-100 bg-zinc-50/60 text-left">
                <th className="px-5 py-2.5 text-xs font-medium tracking-wide text-zinc-500 uppercase">Feature</th>
                {state.plans.map((p) => (
                  <th key={p.id} className="px-4 py-2.5 text-center text-xs font-medium text-zinc-700">
                    {p.name}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {[
                { label: 'Resident limit', render: (p: Plan) => p.residentLimit.toLocaleString() },
                { label: 'Staff limit', render: (p: Plan) => p.staffLimit },
                { label: 'Members & staff management', render: () => <Check className="mx-auto size-4 text-emerald-600" /> },
                ...(Object.keys(FEATURE_LABELS) as FeatureKey[]).map((f) => ({
                  label: FEATURE_LABELS[f],
                  render: (p: Plan) => (p.modules.includes(f) ? <Check className="mx-auto size-4 text-emerald-600" /> : <Minus className="mx-auto size-4 text-zinc-300" />),
                })),
              ].map((row) => (
                <tr key={row.label} className="border-b border-zinc-100 last:border-0">
                  <td className="px-5 py-2.5 text-zinc-700">{row.label}</td>
                  {state.plans.map((p) => (
                    <td key={p.id} className="px-4 py-2.5 text-center text-zinc-900 tabular-nums">
                      {row.render(p)}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      <Card className="mt-6">
        <CardHeader title="Subscriptions" description="Every society’s plan and demo subscription state." />
        <FilterBar>
          <Segmented
            value={subFilter}
            onChange={setSubFilter}
            options={(['All', 'Active', 'Trial', 'Pending Approval', 'Expired', 'Suspended'] as const).map((s) => ({
              value: s,
              label: s,
              count: state.rwas.filter((r) => r.status !== 'Deactivated' && (s === 'All' || r.subscription.status === s)).length,
            }))}
          />
        </FilterBar>
        <DataTable columns={columns} rows={subs} />
      </Card>

      {editing && <PlanForm plan={editing === 'new' ? undefined : editing} onClose={() => setEditing(null)} />}
      <AssignPlanDialog rwa={assignFor} onClose={() => setAssignFor(null)} />
    </>
  )
}

function PlanForm({ plan, onClose }: { plan?: Plan; onClose: () => void }) {
  const { savePlan } = useStore()
  const toast = useToast()
  const [p, setP] = useState<Plan>(
    plan ?? { id: uid('plan'), name: '', tagline: '', price: 0, period: 'month', residentLimit: 200, staffLimit: 20, modules: ['complaints', 'announcements'], highlights: [], status: 'Enabled' },
  )
  const [highlights, setHighlights] = useState(p.highlights.join('\n'))
  const [errors, setErrors] = useState<Record<string, string>>({})

  const save = () => {
    const e: Record<string, string> = {}
    if (!p.name.trim()) e.name = 'Plan name is required'
    if (p.price < 0) e.price = 'Price can’t be negative'
    if (p.residentLimit < 1) e.residentLimit = 'Must be at least 1'
    if (p.staffLimit < 1) e.staffLimit = 'Must be at least 1'
    setErrors(e)
    if (Object.keys(e).length) return
    savePlan({ ...p, name: p.name.trim(), highlights: highlights.split('\n').map((h) => h.trim()).filter(Boolean) })
    toast({ title: plan ? 'Plan updated' : 'Plan created', description: 'Illustrative plan stored in this browser.' })
    onClose()
  }

  const num = (k: 'price' | 'residentLimit' | 'staffLimit', label: string) => (
    <Field label={label} error={errors[k]}>
      {(id) => <Input id={id} type="number" min={0} value={p[k]} onChange={(e) => setP({ ...p, [k]: Number(e.target.value) })} invalid={!!errors[k]} />}
    </Field>
  )

  return (
    <Modal
      open
      onClose={onClose}
      size="lg"
      title={plan ? `Edit ${plan.name}` : 'New plan'}
      footer={
        <>
          <Button onClick={onClose}>Cancel</Button>
          <Button variant="primary" onClick={save}>
            Save plan
          </Button>
        </>
      }
    >
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Field label="Plan name" error={errors.name}>
          {(id) => <Input id={id} value={p.name} onChange={(e) => setP({ ...p, name: e.target.value })} invalid={!!errors.name} autoFocus />}
        </Field>
        <Field label="Status">
          {(id) => (
            <Select id={id} value={p.status} onChange={(e) => setP({ ...p, status: e.target.value as Plan['status'] })}>
              <option>Enabled</option>
              <option>Disabled</option>
            </Select>
          )}
        </Field>
        <Field label="Tagline" optional className="sm:col-span-2">
          {(id) => <Input id={id} value={p.tagline} onChange={(e) => setP({ ...p, tagline: e.target.value })} />}
        </Field>
        {num('price', 'Illustrative price (₹)')}
        <Field label="Billing period">
          {(id) => (
            <Select id={id} value={p.period} onChange={(e) => setP({ ...p, period: e.target.value as Plan['period'] })}>
              <option value="month">Monthly</option>
              <option value="year">Yearly</option>
            </Select>
          )}
        </Field>
        {num('residentLimit', 'Resident limit')}
        {num('staffLimit', 'Staff limit')}
        <Field label="Enabled features" className="sm:col-span-2">
          {() => (
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
              {(Object.keys(FEATURE_LABELS) as FeatureKey[]).map((f) => {
                const on = p.modules.includes(f)
                return (
                  <label key={f} className="flex cursor-pointer items-center gap-2.5 rounded-lg border border-zinc-200 px-3 py-2 text-sm hover:bg-zinc-50">
                    <input type="checkbox" className="size-4 accent-[var(--brand)]" checked={on} onChange={() => setP({ ...p, modules: on ? p.modules.filter((x) => x !== f) : [...p.modules, f] })} />
                    {FEATURE_LABELS[f]}
                  </label>
                )
              })}
            </div>
          )}
        </Field>
        <Field label="Marketing highlights" optional className="sm:col-span-2" hint="One per line. Shown on the public plans page.">
          {(id) => <Textarea id={id} rows={4} value={highlights} onChange={(e) => setHighlights(e.target.value)} />}
        </Field>
        <label className="flex items-center gap-2 text-sm text-zinc-700 sm:col-span-2">
          <input type="checkbox" className="size-4 accent-[var(--brand)]" checked={!!p.popular} onChange={(e) => setP({ ...p, popular: e.target.checked })} />
          Highlight as “Most popular”
        </label>
      </div>
    </Modal>
  )
}
