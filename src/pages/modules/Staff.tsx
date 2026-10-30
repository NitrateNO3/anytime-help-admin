import { Briefcase, Eye, ListChecks, MessageSquareWarning, Pencil, Plus, Power, UserCog, X } from 'lucide-react'
import { useState } from 'react'
import { ActionMenu } from '../../components/menu'
import { AccessDenied, RestrictedHint, useGate } from '../../components/shared'
import { useToast } from '../../components/toast'
import {
  Avatar,
  Badge,
  Button,
  Card,
  DataTable,
  DefinitionList,
  EmptyState,
  Field,
  FilterBar,
  Input,
  Modal,
  PageHeader,
  SearchInput,
  Segmented,
  Select,
  StatusBadge,
  type Column,
} from '../../components/ui'
import { isOpenComplaint, useStore } from '../../lib/store'
import { STAFF_DEPARTMENTS, type Staff as StaffT, type StaffDepartment } from '../../lib/types'
import { formatDate, isPhone, uid } from '../../lib/utils'
import { RwaFilterSelect, RwaSelectField, useModuleScope, type ModuleProps } from './scope'

export default function Staff(props: ModuleProps) {
  const { state, saveStaff } = useStore()
  const gate = useGate()
  const toast = useToast()
  const scope = useModuleScope(props)
  const [q, setQ] = useState('')
  const [status, setStatus] = useState<'All' | 'Active' | 'Inactive'>('All')
  const [dept, setDept] = useState<'all' | StaffDepartment>('all')
  const [editing, setEditing] = useState<{ staff?: StaffT; focus?: 'department' | 'responsibilities' } | null>(null)
  const [viewing, setViewing] = useState<StaffT | null>(null)

  if (!gate('staff', 'view').allowed) return <AccessDenied />

  const readOnly = !!props.readOnly
  const canCreate = gate('staff', 'create').allowed && !readOnly
  const canEdit = gate('staff', 'edit').allowed && !readOnly

  const base = state.staff.filter((s) => scope.inScope(s.rwaId))
  const needle = q.trim().toLowerCase()
  const rows = base.filter(
    (s) =>
      (status === 'All' || s.status === status) &&
      (dept === 'all' || s.department === dept) &&
      (!needle || [s.name, s.employeeId, s.phone, s.designation].some((v) => v.toLowerCase().includes(needle))),
  )
  const assigned = (id: string) => state.complaints.filter((c) => c.staffId === id)

  const toggle = (s: StaffT) => {
    const next = s.status === 'Active' ? 'Inactive' : 'Active'
    saveStaff({ ...s, status: next })
    toast({ title: `${s.name} ${next === 'Active' ? 'activated' : 'deactivated'}`, tone: next === 'Active' ? 'success' : 'warning' })
  }

  const columns: Column<StaffT>[] = [
    {
      key: 'name',
      header: 'Staff member',
      className: 'min-w-52',
      render: (s) => (
        <div className="flex items-center gap-3">
          <Avatar name={s.name} size="sm" />
          <div className="min-w-0">
            <p className="truncate font-medium text-zinc-900">{s.name}</p>
            <p className="text-xs text-zinc-500">{s.employeeId}</p>
          </div>
        </div>
      ),
    },
    {
      key: 'dept',
      header: 'Department',
      render: (s) => (
        <div>
          <p className="whitespace-nowrap text-zinc-800">{s.department}</p>
          <p className="text-xs whitespace-nowrap text-zinc-500">{s.designation}</p>
        </div>
      ),
    },
    { key: 'phone', header: 'Phone', render: (s) => <span className="whitespace-nowrap">{s.phone}</span> },
    {
      key: 'resp',
      header: 'Responsibilities',
      render: (s) => (
        <div className="flex max-w-60 flex-wrap gap-1">
          {s.responsibilities.length ? s.responsibilities.map((r) => <Badge key={r}>{r}</Badge>) : <span className="text-zinc-400">—</span>}
        </div>
      ),
    },
    ...(scope.isScoped ? [] : [{ key: 'rwa', header: 'Society', render: (s: StaffT) => <span className="whitespace-nowrap">{scope.rwaName(s.rwaId)}</span> }]),
    {
      key: 'open',
      header: 'Open tasks',
      className: 'text-right',
      render: (s) => <span className="tabular-nums">{assigned(s.id).filter(isOpenComplaint).length}</span>,
    },
    { key: 'status', header: 'Status', render: (s) => <StatusBadge status={s.status} /> },
    {
      key: 'actions',
      header: <span className="sr-only">Actions</span>,
      className: 'text-right',
      render: (s) => (
        <ActionMenu
          items={[
            { label: 'View profile', icon: <Eye />, onClick: () => setViewing(s) },
            { label: 'View assigned complaints', icon: <MessageSquareWarning />, onClick: () => setViewing(s) },
            { label: 'Edit staff', icon: <Pencil />, onClick: () => setEditing({ staff: s }), disabled: !canEdit, divider: true },
            { label: 'Change department', icon: <Briefcase />, onClick: () => setEditing({ staff: s, focus: 'department' }), disabled: !canEdit },
            { label: 'Assign responsibilities', icon: <ListChecks />, onClick: () => setEditing({ staff: s, focus: 'responsibilities' }), disabled: !canEdit },
            { label: s.status === 'Active' ? 'Deactivate' : 'Activate', icon: <Power />, onClick: () => toggle(s), disabled: !canEdit, danger: s.status === 'Active', divider: true },
          ]}
        />
      ),
    },
  ]

  const actions = !readOnly && (
    <>
      {!canCreate && <RestrictedHint>Adding staff is restricted for your role</RestrictedHint>}
      <Button variant="primary" icon={<Plus className="size-4" />} disabled={!canCreate} onClick={() => setEditing({})}>
        Add staff
      </Button>
    </>
  )

  return (
    <>
      {!props.embedded ? (
        <PageHeader title="Staff" description={scope.isScoped ? 'Security, housekeeping, maintenance and facility staff for this society.' : 'Staff across all societies.'} actions={actions} />
      ) : (
        !readOnly && <div className="mb-3 flex justify-end gap-2">{actions}</div>
      )}
      <Card>
        <FilterBar>
          <Segmented
            value={status}
            onChange={setStatus}
            options={(['All', 'Active', 'Inactive'] as const).map((s) => ({ value: s, label: s, count: s === 'All' ? base.length : base.filter((x) => x.status === s).length }))}
          />
          <div className="flex flex-col gap-2 sm:ml-auto sm:flex-row">
            <Select aria-label="Department" value={dept} onChange={(e) => setDept(e.target.value as typeof dept)} className="sm:w-44">
              <option value="all">All departments</option>
              {STAFF_DEPARTMENTS.map((d) => (
                <option key={d}>{d}</option>
              ))}
            </Select>
            {!scope.isScoped && <RwaFilterSelect value={scope.rwaFilter} onChange={scope.setRwaFilter} />}
            <SearchInput value={q} onChange={setQ} placeholder="Search name, ID or phone" />
          </div>
        </FilterBar>
        <DataTable
          columns={columns}
          rows={rows}
          onRowClick={setViewing}
          empty={<EmptyState icon={<UserCog />} title="No staff found" description={base.length ? 'Try different filters.' : 'Add your first staff member to start assigning complaints.'} />}
        />
      </Card>

      {editing && <StaffForm staff={editing.staff} focus={editing.focus} defaultRwaId={scope.targetRwa?.id} lockRwa={scope.isScoped} onClose={() => setEditing(null)} />}

      <Modal
        open={!!viewing}
        onClose={() => setViewing(null)}
        title="Staff profile"
        footer={viewing && canEdit ? <Button onClick={() => { setEditing({ staff: viewing }); setViewing(null) }}>Edit staff</Button> : undefined}
      >
        {viewing && (
          <div className="space-y-5">
            <div className="flex items-center gap-3">
              <Avatar name={viewing.name} size="lg" />
              <div>
                <p className="text-base font-semibold text-zinc-900">{viewing.name}</p>
                <p className="text-sm text-zinc-500">
                  {viewing.designation} · {scope.rwaName(viewing.rwaId)}
                </p>
              </div>
              <span className="ml-auto">
                <StatusBadge status={viewing.status} />
              </span>
            </div>
            <DefinitionList
              items={[
                { label: 'Employee ID', value: viewing.employeeId },
                { label: 'Department', value: viewing.department },
                { label: 'Phone', value: viewing.phone },
                { label: 'Joined', value: formatDate(viewing.createdAt) },
                { label: 'Responsibilities', value: viewing.responsibilities.join(', ') },
              ]}
            />
            <div>
              <p className="mb-2 text-xs font-medium text-zinc-500">Assigned complaints ({assigned(viewing.id).length})</p>
              {assigned(viewing.id).length === 0 ? (
                <p className="text-sm text-zinc-500">No complaints assigned.</p>
              ) : (
                <ul className="space-y-1.5">
                  {assigned(viewing.id).map((c) => (
                    <li key={c.id} className="flex items-center justify-between gap-2 rounded-lg border border-zinc-100 px-3 py-2 text-sm">
                      <span className="min-w-0 truncate">
                        <span className="font-medium text-zinc-900">{c.code}</span> · {c.flat} · {c.description}
                      </span>
                      <StatusBadge status={c.status} />
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        )}
      </Modal>
    </>
  )
}

function StaffForm({ staff, focus, defaultRwaId, lockRwa, onClose }: { staff?: StaffT; focus?: 'department' | 'responsibilities'; defaultRwaId?: string; lockRwa: boolean; onClose: () => void }) {
  const { state, saveStaff } = useStore()
  const toast = useToast()
  const [f, setF] = useState({
    rwaId: staff?.rwaId ?? defaultRwaId ?? '',
    name: staff?.name ?? '',
    employeeId: staff?.employeeId ?? '',
    department: staff?.department ?? ('Security' as StaffDepartment),
    designation: staff?.designation ?? '',
    phone: staff?.phone ?? '',
    responsibilities: staff?.responsibilities ?? [],
    status: staff?.status ?? ('Active' as const),
  })
  const [duty, setDuty] = useState('')
  const [errors, setErrors] = useState<Record<string, string>>({})

  const addDuty = () => {
    const d = duty.trim()
    if (d && !f.responsibilities.includes(d)) setF({ ...f, responsibilities: [...f.responsibilities, d] })
    setDuty('')
  }

  const save = () => {
    const e: Record<string, string> = {}
    if (!f.rwaId) e.rwaId = 'Choose a society'
    if (!f.name.trim()) e.name = 'Name is required'
    if (!f.employeeId.trim()) e.employeeId = 'Employee ID is required'
    else if (state.staff.some((s) => s.id !== staff?.id && s.rwaId === f.rwaId && s.employeeId.toLowerCase() === f.employeeId.trim().toLowerCase()))
      e.employeeId = 'This employee ID is already used in this society'
    if (!f.designation.trim()) e.designation = 'Designation is required'
    if (!isPhone(f.phone)) e.phone = 'Enter a valid 10-digit mobile number'
    setErrors(e)
    if (Object.keys(e).length) return
    const pending = duty.trim() && !f.responsibilities.includes(duty.trim()) ? [duty.trim()] : []
    saveStaff({
      id: staff?.id ?? uid('stf'),
      createdAt: staff?.createdAt ?? new Date().toISOString(),
      ...f,
      responsibilities: [...f.responsibilities, ...pending],
      name: f.name.trim(),
      employeeId: f.employeeId.trim(),
      designation: f.designation.trim(),
    })
    toast({ title: staff ? 'Staff updated' : 'Staff member added', description: `${f.name} · ${f.department}` })
    onClose()
  }

  return (
    <Modal
      open
      onClose={onClose}
      title={staff ? 'Edit staff' : 'Add staff'}
      footer={
        <>
          <Button onClick={onClose}>Cancel</Button>
          <Button variant="primary" onClick={save}>
            {staff ? 'Save changes' : 'Add staff'}
          </Button>
        </>
      }
    >
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {!lockRwa && (
          <Field label="Society" error={errors.rwaId} className="sm:col-span-2">
            {(id) => <RwaSelectField id={id} value={f.rwaId} onChange={(rwaId) => setF({ ...f, rwaId })} invalid={!!errors.rwaId} />}
          </Field>
        )}
        <Field label="Full name" error={errors.name}>
          {(id) => <Input id={id} value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} invalid={!!errors.name} autoFocus={!focus} />}
        </Field>
        <Field label="Employee ID" error={errors.employeeId}>
          {(id) => <Input id={id} value={f.employeeId} onChange={(e) => setF({ ...f, employeeId: e.target.value })} placeholder="e.g. GV-120" invalid={!!errors.employeeId} />}
        </Field>
        <Field label="Department">
          {(id) => (
            <Select id={id} value={f.department} autoFocus={focus === 'department'} onChange={(e) => setF({ ...f, department: e.target.value as StaffDepartment })}>
              {STAFF_DEPARTMENTS.map((d) => (
                <option key={d}>{d}</option>
              ))}
            </Select>
          )}
        </Field>
        <Field label="Designation" error={errors.designation}>
          {(id) => <Input id={id} value={f.designation} onChange={(e) => setF({ ...f, designation: e.target.value })} placeholder="e.g. Night Supervisor" invalid={!!errors.designation} />}
        </Field>
        <Field label="Phone" error={errors.phone}>
          {(id) => <Input id={id} inputMode="tel" value={f.phone} onChange={(e) => setF({ ...f, phone: e.target.value })} placeholder="+91 98000 12345" invalid={!!errors.phone} />}
        </Field>
        <Field label="Status">
          {(id) => (
            <Select id={id} value={f.status} onChange={(e) => setF({ ...f, status: e.target.value as 'Active' | 'Inactive' })}>
              <option>Active</option>
              <option>Inactive</option>
            </Select>
          )}
        </Field>
        <Field label="Assigned responsibilities" optional className="sm:col-span-2" hint="Press Enter to add each responsibility.">
          {(id) => (
            <div className="space-y-2">
              <div className="flex gap-2">
                <Input
                  id={id}
                  value={duty}
                  autoFocus={focus === 'responsibilities'}
                  onChange={(e) => setDuty(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault()
                      addDuty()
                    }
                  }}
                  placeholder="e.g. Gate 2 night shift"
                />
                <Button onClick={addDuty}>Add</Button>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {f.responsibilities.map((r) => (
                  <Badge key={r} tone="brand">
                    {r}
                    <button aria-label={`Remove ${r}`} onClick={() => setF({ ...f, responsibilities: f.responsibilities.filter((x) => x !== r) })}>
                      <X className="size-3" />
                    </button>
                  </Badge>
                ))}
              </div>
            </div>
          )}
        </Field>
      </div>
    </Modal>
  )
}
