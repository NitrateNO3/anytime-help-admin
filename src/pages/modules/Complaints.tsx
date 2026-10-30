import { CheckCircle2, CircleDot, Clock, MessageSquareWarning, Plus } from 'lucide-react'
import { useState } from 'react'
import { AccessDenied, RestrictedHint, useGate } from '../../components/shared'
import { useToast } from '../../components/toast'
import {
  Badge,
  Button,
  Card,
  DataTable,
  DefinitionList,
  EmptyState,
  Field,
  FilterBar,
  MetricCard,
  Modal,
  Notice,
  PageHeader,
  SearchInput,
  Select,
  StatusBadge,
  Textarea,
  type Column,
} from '../../components/ui'
import { demoResident, isOpenComplaint, useStore } from '../../lib/store'
import { COMPLAINT_CATEGORIES, COMPLAINT_STATUSES, PRIORITIES, type Complaint, type ComplaintCategory, type ComplaintStatus, type Priority } from '../../lib/types'
import { formatDate, formatDateTime, uid } from '../../lib/utils'
import { RwaFilterSelect, RwaSelectField, useModuleScope, type ModuleProps } from './scope'

export default function Complaints(props: ModuleProps) {
  const { state, session } = useStore()
  const gate = useGate()
  const scope = useModuleScope(props)
  const [q, setQ] = useState('')
  const [status, setStatus] = useState<'all' | ComplaintStatus>('all')
  const [category, setCategory] = useState<'all' | ComplaintCategory>('all')
  const [priority, setPriority] = useState<'all' | Priority>('all')
  const [staffId, setStaffId] = useState('all')
  const [openId, setOpenId] = useState<string | null>(null)
  const [creating, setCreating] = useState(false)

  if (!gate('complaints', 'view').allowed) return <AccessDenied />

  const isResident = session.role === 'resident'
  const me = isResident ? demoResident(state.members, session.rwaId) : undefined
  const readOnly = !!props.readOnly
  const canCreate = gate('complaints', 'create').allowed && !readOnly

  const base = state.complaints.filter((c) => scope.inScope(c.rwaId) && (!isResident || c.memberId === me?.id))
  const staffOptions = state.staff.filter((s) => scope.inScope(s.rwaId))
  const needle = q.trim().toLowerCase()
  const rows = base
    .filter(
      (c) =>
        (status === 'all' || c.status === status) &&
        (category === 'all' || c.category === category) &&
        (priority === 'all' || c.priority === priority) &&
        (staffId === 'all' || (staffId === 'none' ? !c.staffId : c.staffId === staffId)) &&
        (!needle || [c.code, c.residentName, c.flat, c.description].some((v) => v.toLowerCase().includes(needle))),
    )
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
  const staffName = (id?: string) => state.staff.find((s) => s.id === id)?.name
  const selected = state.complaints.find((c) => c.id === openId)

  const columns: Column<Complaint>[] = [
    { key: 'code', header: 'ID', render: (c) => <span className="font-medium whitespace-nowrap text-zinc-900">{c.code}</span> },
    {
      key: 'issue',
      header: 'Issue',
      className: 'min-w-60',
      render: (c) => (
        <div className="min-w-0">
          <p className="line-clamp-1 text-zinc-900">{c.description}</p>
          <p className="text-xs text-zinc-500">
            {c.category} · {c.residentName}, {c.flat}
          </p>
        </div>
      ),
    },
    ...(scope.isScoped ? [] : [{ key: 'rwa', header: 'Society', render: (c: Complaint) => <span className="whitespace-nowrap">{scope.rwaName(c.rwaId)}</span> }]),
    { key: 'priority', header: 'Priority', render: (c) => <StatusBadge status={c.priority} /> },
    { key: 'staff', header: 'Assigned to', render: (c) => <span className="whitespace-nowrap">{staffName(c.staffId) ?? <span className="text-zinc-400">Unassigned</span>}</span> },
    { key: 'date', header: 'Created', render: (c) => <span className="whitespace-nowrap text-zinc-500">{formatDate(c.createdAt)}</span> },
    { key: 'status', header: 'Status', render: (c) => <StatusBadge status={c.status} /> },
  ]

  const actions = !readOnly && (
    <>
      {!canCreate && <RestrictedHint>Creating complaints is restricted for your role</RestrictedHint>}
      <Button variant="primary" icon={<Plus className="size-4" />} disabled={!canCreate} onClick={() => setCreating(true)}>
        {isResident ? 'Raise complaint' : 'New complaint'}
      </Button>
    </>
  )

  return (
    <>
      {!props.embedded ? (
        <PageHeader
          title={isResident ? 'My complaints' : 'Complaints'}
          description={isResident ? `Track issues you’ve raised as ${me?.name ?? 'a resident'} (${me?.flat ?? '—'}).` : scope.isScoped ? 'Assign, track and resolve resident complaints.' : 'Complaints across all societies.'}
          actions={actions}
        />
      ) : (
        !readOnly && <div className="mb-3 flex justify-end gap-2">{actions}</div>
      )}

      <div className="mb-4 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <MetricCard label="Total" value={base.length} icon={<MessageSquareWarning />} />
        <MetricCard label="New / open" value={base.filter((c) => c.status === 'New' || c.status === 'Open').length} icon={<CircleDot />} tone="warning" />
        <MetricCard label="In progress" value={base.filter((c) => c.status === 'Assigned' || c.status === 'In Progress').length} icon={<Clock />} />
        <MetricCard label="Resolved / closed" value={base.filter((c) => !isOpenComplaint(c)).length} icon={<CheckCircle2 />} tone="success" />
      </div>

      <Card>
        <FilterBar>
          <SearchInput value={q} onChange={setQ} placeholder="Search ID, resident, flat, issue" />
          <div className="grid grid-cols-2 gap-2 sm:ml-auto sm:flex sm:flex-wrap">
            <Select aria-label="Status" value={status} onChange={(e) => setStatus(e.target.value as typeof status)} className="sm:w-36">
              <option value="all">All statuses</option>
              {COMPLAINT_STATUSES.map((s) => (
                <option key={s}>{s}</option>
              ))}
            </Select>
            <Select aria-label="Category" value={category} onChange={(e) => setCategory(e.target.value as typeof category)} className="sm:w-40">
              <option value="all">All categories</option>
              {COMPLAINT_CATEGORIES.map((s) => (
                <option key={s}>{s}</option>
              ))}
            </Select>
            <Select aria-label="Priority" value={priority} onChange={(e) => setPriority(e.target.value as typeof priority)} className="sm:w-36">
              <option value="all">All priorities</option>
              {PRIORITIES.map((s) => (
                <option key={s}>{s}</option>
              ))}
            </Select>
            {!isResident && (
              <Select aria-label="Assigned staff" value={staffId} onChange={(e) => setStaffId(e.target.value)} className="sm:w-44">
                <option value="all">All staff</option>
                <option value="none">Unassigned</option>
                {staffOptions.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </Select>
            )}
            {!scope.isScoped && (
              <RwaFilterSelect
                value={scope.rwaFilter}
                onChange={(v) => {
                  scope.setRwaFilter(v)
                  setStaffId('all')
                }}
              />
            )}
          </div>
        </FilterBar>
        <DataTable
          columns={columns}
          rows={rows}
          onRowClick={(c) => setOpenId(c.id)}
          empty={<EmptyState icon={<MessageSquareWarning />} title="No complaints found" description={base.length ? 'Try adjusting the filters.' : 'Complaints raised by residents will appear here.'} />}
        />
      </Card>

      {selected && <ComplaintDetail complaint={selected} readOnly={readOnly || isResident} onClose={() => setOpenId(null)} />}
      {creating && <ComplaintForm defaultRwaId={scope.targetRwa?.id} lockRwa={scope.isScoped} residentId={me?.id} onClose={() => setCreating(false)} onCreated={setOpenId} />}
    </>
  )
}

function ComplaintDetail({ complaint: c, readOnly, onClose }: { complaint: Complaint; readOnly: boolean; onClose: () => void }) {
  const { state, assignComplaint, setComplaintStatus } = useStore()
  const gate = useGate()
  const toast = useToast()
  const [notes, setNotes] = useState(c.resolutionNotes)
  const canEdit = gate('complaints', 'edit').allowed && !readOnly
  const staff = state.staff.filter((s) => s.rwaId === c.rwaId && (s.status === 'Active' || s.id === c.staffId))
  const rwa = state.rwas.find((r) => r.id === c.rwaId)

  return (
    <Modal open onClose={onClose} size="lg" title={`${c.code} · ${c.category}`} description={`${rwa?.name} · raised ${formatDateTime(c.createdAt)}`}>
      <div className="grid grid-cols-1 gap-6 md:grid-cols-[1fr_15rem]">
        <div className="space-y-5">
          <div>
            <p className="text-xs font-medium text-zinc-500">Description</p>
            <p className="mt-1 text-sm text-zinc-900">{c.description}</p>
          </div>
          <DefinitionList
            items={[
              { label: 'Resident', value: c.residentName },
              { label: 'Flat', value: c.flat },
              { label: 'Priority', value: <StatusBadge status={c.priority} /> },
              { label: 'Status', value: <StatusBadge status={c.status} /> },
            ]}
          />
          <div>
            <Field label="Resolution notes" hint={canEdit ? undefined : 'Read-only for your role.'}>
              {(id) => <Textarea id={id} value={notes} disabled={!canEdit} onChange={(e) => setNotes(e.target.value)} placeholder="What was done to resolve the issue?" />}
            </Field>
            {canEdit && notes !== c.resolutionNotes && (
              <div className="mt-2 flex justify-end">
                <Button
                  size="sm"
                  variant="primary"
                  onClick={() => {
                    setComplaintStatus(c.id, c.status, notes)
                    toast({ title: 'Resolution notes saved' })
                  }}
                >
                  Save notes
                </Button>
              </div>
            )}
          </div>
          <div>
            <p className="mb-2 text-xs font-medium text-zinc-500">Activity history</p>
            <ol className="relative space-y-3 border-l border-zinc-200 pl-4">
              {[...c.history].reverse().map((h, i) => (
                <li key={i} className="relative">
                  <span className="absolute top-1.5 -left-[21px] size-2.5 rounded-full border-2 border-white bg-brand" />
                  <p className="text-sm text-zinc-800">{h.text}</p>
                  <p className="text-xs text-zinc-500">
                    {h.actor} · {formatDateTime(h.at)}
                  </p>
                </li>
              ))}
            </ol>
          </div>
        </div>
        <div className="space-y-4 rounded-xl bg-zinc-50 p-4 md:self-start">
          <Field label="Assigned staff">
            {(id) => (
              <Select
                id={id}
                value={c.staffId ?? ''}
                disabled={!canEdit}
                onChange={(e) => {
                  const next = e.target.value || undefined
                  assignComplaint(c.id, next)
                  toast({ title: next ? 'Complaint assigned' : 'Assignment removed', description: next ? `${c.code} → ${state.staff.find((s) => s.id === next)?.name}` : undefined })
                }}
              >
                <option value="">Unassigned</option>
                {staff.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name} · {s.department}
                  </option>
                ))}
              </Select>
            )}
          </Field>
          <Field label="Status">
            {(id) => (
              <Select
                id={id}
                value={c.status}
                disabled={!canEdit}
                onChange={(e) => {
                  setComplaintStatus(c.id, e.target.value as ComplaintStatus)
                  toast({ title: `Status changed to ${e.target.value}` })
                }}
              >
                {COMPLAINT_STATUSES.map((s) => (
                  <option key={s}>{s}</option>
                ))}
              </Select>
            )}
          </Field>
          {!staff.length && <p className="text-xs text-zinc-500">This society has no active staff yet.</p>}
          {!canEdit && <Badge>View only</Badge>}
        </div>
      </div>
    </Modal>
  )
}

function ComplaintForm({ defaultRwaId, lockRwa, residentId, onClose, onCreated }: { defaultRwaId?: string; lockRwa: boolean; residentId?: string; onClose: () => void; onCreated: (id: string) => void }) {
  const { state, saveComplaint, actorName } = useStore()
  const toast = useToast()
  const [f, setF] = useState({
    rwaId: defaultRwaId ?? '',
    memberId: residentId ?? '',
    category: 'Maintenance' as ComplaintCategory,
    priority: 'Medium' as Priority,
    description: '',
  })
  const [errors, setErrors] = useState<Record<string, string>>({})
  const members = state.members.filter((m) => m.rwaId === f.rwaId && m.status === 'Active')

  const save = () => {
    const e: Record<string, string> = {}
    if (!f.rwaId) e.rwaId = 'Choose a society'
    if (!f.memberId) e.memberId = 'Choose the resident'
    if (f.description.trim().length < 8) e.description = 'Describe the issue in a few words (min. 8 characters)'
    setErrors(e)
    if (Object.keys(e).length) return
    const m = state.members.find((x) => x.id === f.memberId)!
    const seq = Math.max(1000, ...state.complaints.map((c) => Number(c.code.replace(/\D/g, '')) || 0)) + 1
    const now = new Date().toISOString()
    const id = uid('cmp')
    saveComplaint({
      id,
      code: `CMP-${seq}`,
      rwaId: f.rwaId,
      memberId: m.id,
      residentName: m.name,
      flat: m.flat,
      category: f.category,
      description: f.description.trim(),
      priority: f.priority,
      status: 'New',
      createdAt: now,
      resolutionNotes: '',
      history: [{ at: now, actor: actorName(), text: 'Complaint raised' }],
    })
    toast({ title: `CMP-${seq} created`, description: 'Open it to assign staff and track progress.' })
    onClose()
    onCreated(id)
  }

  return (
    <Modal
      open
      onClose={onClose}
      title={residentId ? 'Raise a complaint' : 'New complaint'}
      footer={
        <>
          <Button onClick={onClose}>Cancel</Button>
          <Button variant="primary" onClick={save}>
            Submit complaint
          </Button>
        </>
      }
    >
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {!lockRwa && (
          <Field label="Society" error={errors.rwaId} className="sm:col-span-2">
            {(id) => <RwaSelectField id={id} value={f.rwaId} onChange={(rwaId) => setF({ ...f, rwaId, memberId: '' })} invalid={!!errors.rwaId} />}
          </Field>
        )}
        {residentId ? (
          <Notice className="sm:col-span-2">
            Raising as {state.members.find((m) => m.id === residentId)?.name} ({state.members.find((m) => m.id === residentId)?.flat})
          </Notice>
        ) : (
          <Field label="Resident" error={errors.memberId} className="sm:col-span-2">
            {(id) => (
              <Select id={id} value={f.memberId} onChange={(e) => setF({ ...f, memberId: e.target.value })} invalid={!!errors.memberId} disabled={!f.rwaId}>
                <option value="">{f.rwaId ? 'Select resident…' : 'Choose a society first'}</option>
                {members.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.name} · {m.flat}
                  </option>
                ))}
              </Select>
            )}
          </Field>
        )}
        <Field label="Category">
          {(id) => (
            <Select id={id} value={f.category} onChange={(e) => setF({ ...f, category: e.target.value as ComplaintCategory })}>
              {COMPLAINT_CATEGORIES.map((c) => (
                <option key={c}>{c}</option>
              ))}
            </Select>
          )}
        </Field>
        <Field label="Priority">
          {(id) => (
            <Select id={id} value={f.priority} onChange={(e) => setF({ ...f, priority: e.target.value as Priority })}>
              {PRIORITIES.map((c) => (
                <option key={c}>{c}</option>
              ))}
            </Select>
          )}
        </Field>
        <Field label="Description" error={errors.description} className="sm:col-span-2">
          {(id) => <Textarea id={id} value={f.description} onChange={(e) => setF({ ...f, description: e.target.value })} placeholder="What’s the issue and where is it?" invalid={!!errors.description} />}
        </Field>
      </div>
    </Modal>
  )
}
