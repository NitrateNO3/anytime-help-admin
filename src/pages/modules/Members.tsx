import { Check, Eye, FileUp, Pencil, Plus, Power, Upload, UserPlus, X } from 'lucide-react'
import { useRef, useState } from 'react'
import { useFeature } from '../../components/layout'
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
  Notice,
  PageHeader,
  SearchInput,
  Segmented,
  Select,
  StatusBadge,
  type Column,
} from '../../components/ui'
import { useStore } from '../../lib/store'
import type { Member, MemberCategory, MemberStatus } from '../../lib/types'
import { downloadText, formatDate, isEmail, isPhone, parseCsv, uid } from '../../lib/utils'
import { RwaFilterSelect, RwaSelectField, useModuleScope, type ModuleProps } from './scope'

const CATEGORIES: MemberCategory[] = ['Owner', 'Tenant', 'Family member', 'Other']
const STATUSES: MemberStatus[] = ['Active', 'Pending', 'Inactive', 'Rejected']

export default function Members(props: ModuleProps) {
  const { state, saveMember } = useStore()
  const gate = useGate()
  const toast = useToast()
  const hasFeature = useFeature()
  const scope = useModuleScope(props)
  const [q, setQ] = useState('')
  const [status, setStatus] = useState<'All' | MemberStatus>('All')
  const [editing, setEditing] = useState<Member | 'new' | null>(null)
  const [viewing, setViewing] = useState<Member | null>(null)
  const [importing, setImporting] = useState(false)

  if (!gate('members', 'view').allowed) return <AccessDenied />

  const readOnly = !!props.readOnly
  const canCreate = gate('members', 'create').allowed && !readOnly
  const canEdit = gate('members', 'edit').allowed && !readOnly
  const canApprove = gate('members', 'approve').allowed && !readOnly
  const csvAllowed = scope.targetRwa ? hasFeature(scope.targetRwa.id, 'csvImport') : false

  const base = state.members.filter((m) => scope.inScope(m.rwaId))
  const needle = q.trim().toLowerCase()
  const rows = base.filter(
    (m) => (status === 'All' || m.status === status) && (!needle || [m.name, m.flat, m.phone, m.email].some((v) => v.toLowerCase().includes(needle))),
  )
  const pendingCount = base.filter((m) => m.status === 'Pending').length

  const setMemberStatus = (m: Member, s: MemberStatus) => {
    saveMember({ ...m, status: s })
    toast({
      title: s === 'Active' ? (m.status === 'Pending' ? 'Registration approved' : 'Member activated') : s === 'Rejected' ? 'Registration rejected' : 'Member deactivated',
      description: `${m.name} · ${m.flat}`,
      tone: s === 'Active' ? 'success' : 'warning',
    })
  }

  const columns: Column<Member>[] = [
    {
      key: 'name',
      header: 'Resident',
      className: 'min-w-52',
      render: (m) => (
        <div className="flex items-center gap-3">
          <Avatar name={m.name} size="sm" />
          <div className="min-w-0">
            <p className="truncate font-medium text-zinc-900">{m.name}</p>
            <p className="text-xs text-zinc-500">{m.category}</p>
          </div>
        </div>
      ),
    },
    { key: 'flat', header: 'Flat', render: (m) => <span className="font-medium whitespace-nowrap text-zinc-800">{m.flat}</span> },
    { key: 'phone', header: 'Phone', render: (m) => <span className="whitespace-nowrap">{m.phone}</span> },
    { key: 'email', header: 'Email', render: (m) => <span className="text-zinc-500">{m.email || '—'}</span> },
    ...(scope.isScoped ? [] : [{ key: 'rwa', header: 'Society', render: (m: Member) => <span className="whitespace-nowrap">{scope.rwaName(m.rwaId)}</span> }]),
    { key: 'status', header: 'Status', render: (m) => <StatusBadge status={m.status} /> },
    { key: 'date', header: 'Registered', render: (m) => <span className="whitespace-nowrap text-zinc-500">{formatDate(m.createdAt)}</span> },
    {
      key: 'actions',
      header: <span className="sr-only">Actions</span>,
      className: 'text-right',
      render: (m) => (
        <div className="flex items-center justify-end gap-1">
          {m.status === 'Pending' && canApprove && (
            <>
              <Button size="sm" icon={<Check className="size-3.5" />} onClick={(e) => { e.stopPropagation(); setMemberStatus(m, 'Active') }}>
                Approve
              </Button>
              <Button size="sm" variant="ghost" aria-label="Reject" title="Reject" onClick={(e) => { e.stopPropagation(); setMemberStatus(m, 'Rejected') }}>
                <X className="size-4" />
              </Button>
            </>
          )}
          <ActionMenu
            items={[
              { label: 'View profile', icon: <Eye />, onClick: () => setViewing(m) },
              { label: 'Edit member', icon: <Pencil />, onClick: () => setEditing(m), disabled: !canEdit },
              { label: 'Activate', icon: <Power />, onClick: () => setMemberStatus(m, 'Active'), hidden: m.status === 'Active' || m.status === 'Pending', disabled: !canEdit },
              { label: 'Deactivate', icon: <Power />, onClick: () => setMemberStatus(m, 'Inactive'), hidden: m.status !== 'Active', disabled: !canEdit, danger: true },
            ]}
          />
        </div>
      ),
    },
  ]

  const actions = !readOnly && (
    <>
      {!canCreate && <RestrictedHint>Adding members is restricted for your role</RestrictedHint>}
      {state.settings.features.csvImport && (
        <Button
          icon={<Upload className="size-4" />}
          disabled={!canCreate || !scope.targetRwa || !csvAllowed}
          title={!scope.targetRwa ? 'Select a society first' : !csvAllowed ? 'CSV import is not included in this society’s plan' : undefined}
          onClick={() => setImporting(true)}
        >
          Import CSV
        </Button>
      )}
      <Button variant="primary" icon={<Plus className="size-4" />} disabled={!canCreate} onClick={() => setEditing('new')}>
        Add member
      </Button>
    </>
  )

  return (
    <>
      {!props.embedded ? (
        <PageHeader title="Members" description={scope.isScoped ? 'Residents registered with this society.' : 'Residents across every society. Filter by RWA to manage one society.'} actions={actions} />
      ) : (
        !readOnly && <div className="mb-3 flex flex-wrap justify-end gap-2">{actions}</div>
      )}

      {pendingCount > 0 && status !== 'Pending' && canApprove && (
        <Notice tone="warning" className="mb-4 flex flex-wrap items-center justify-between gap-2">
          <span>
            <b>{pendingCount}</b> registration request{pendingCount > 1 ? 's' : ''} awaiting review.
          </span>
          <Button size="sm" onClick={() => setStatus('Pending')}>
            Review requests
          </Button>
        </Notice>
      )}

      <Card>
        <FilterBar>
          <Segmented<'All' | MemberStatus>
            value={status}
            onChange={setStatus}
            options={[{ value: 'All', label: 'All', count: base.length }, ...STATUSES.map((s) => ({ value: s, label: s, count: base.filter((m) => m.status === s).length }))]}
          />
          <div className="flex flex-col gap-2 sm:ml-auto sm:flex-row">
            {!scope.isScoped && <RwaFilterSelect value={scope.rwaFilter} onChange={scope.setRwaFilter} />}
            <SearchInput value={q} onChange={setQ} placeholder="Search name, flat, phone, email" />
          </div>
        </FilterBar>
        <DataTable
          columns={columns}
          rows={rows}
          onRowClick={setViewing}
          empty={
            <EmptyState
              icon={<UserPlus />}
              title={needle || status !== 'All' ? 'No members match these filters' : 'No members yet'}
              description={needle || status !== 'All' ? 'Try clearing the search or status filter.' : 'Add residents one by one or import a CSV file.'}
              action={canCreate && !needle && status === 'All' ? <Button variant="primary" onClick={() => setEditing('new')}>Add member</Button> : undefined}
            />
          }
        />
      </Card>

      {editing && <MemberForm member={editing === 'new' ? undefined : editing} defaultRwaId={scope.targetRwa?.id} lockRwa={scope.isScoped} onClose={() => setEditing(null)} />}
      {importing && scope.targetRwa && <ImportDialog rwaId={scope.targetRwa.id} onClose={() => setImporting(false)} />}

      <Modal open={!!viewing} onClose={() => setViewing(null)} title="Member profile" footer={viewing && canEdit ? <Button onClick={() => { setEditing(viewing); setViewing(null) }}>Edit member</Button> : undefined}>
        {viewing && (
          <div className="space-y-5">
            <div className="flex items-center gap-3">
              <Avatar name={viewing.name} size="lg" />
              <div>
                <p className="text-base font-semibold text-zinc-900">{viewing.name}</p>
                <p className="text-sm text-zinc-500">
                  {viewing.flat} · {scope.rwaName(viewing.rwaId)}
                </p>
              </div>
              <span className="ml-auto">
                <StatusBadge status={viewing.status} />
              </span>
            </div>
            <DefinitionList
              items={[
                { label: 'Phone', value: viewing.phone },
                { label: 'Email', value: viewing.email },
                { label: 'Category', value: viewing.category },
                { label: 'Registered', value: formatDate(viewing.createdAt) },
              ]}
            />
            <div>
              <p className="mb-2 text-xs font-medium text-zinc-500">Complaints raised</p>
              {state.complaints.filter((c) => c.memberId === viewing.id).length === 0 ? (
                <p className="text-sm text-zinc-500">None</p>
              ) : (
                <ul className="space-y-1.5">
                  {state.complaints
                    .filter((c) => c.memberId === viewing.id)
                    .map((c) => (
                      <li key={c.id} className="flex items-center justify-between gap-2 rounded-lg border border-zinc-100 px-3 py-2 text-sm">
                        <span className="min-w-0 truncate">
                          <span className="font-medium text-zinc-900">{c.code}</span> · {c.description}
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

function MemberForm({ member, defaultRwaId, lockRwa, onClose }: { member?: Member; defaultRwaId?: string; lockRwa: boolean; onClose: () => void }) {
  const { saveMember } = useStore()
  const toast = useToast()
  const [f, setF] = useState({
    rwaId: member?.rwaId ?? defaultRwaId ?? '',
    name: member?.name ?? '',
    flat: member?.flat ?? '',
    phone: member?.phone ?? '',
    email: member?.email ?? '',
    category: member?.category ?? ('Owner' as MemberCategory),
    status: member?.status ?? ('Active' as MemberStatus),
  })
  const [errors, setErrors] = useState<Record<string, string>>({})

  const validate = () => {
    const e: Record<string, string> = {}
    if (!f.rwaId) e.rwaId = 'Choose the society this member belongs to'
    if (!f.name.trim()) e.name = 'Full name is required'
    if (!f.flat.trim()) e.flat = 'Flat or unit number is required'
    if (!isPhone(f.phone)) e.phone = 'Enter a valid 10-digit mobile number'
    if (f.email && !isEmail(f.email)) e.email = 'Enter a valid email address'
    setErrors(e)
    return !Object.keys(e).length
  }

  const save = () => {
    if (!validate()) return
    saveMember({
      id: member?.id ?? uid('mem'),
      createdAt: member?.createdAt ?? new Date().toISOString(),
      ...f,
      name: f.name.trim(),
      flat: f.flat.trim().toUpperCase(),
      phone: f.phone.trim(),
      email: f.email.trim(),
    })
    toast({ title: member ? 'Member updated' : 'Member added', description: `${f.name} · ${f.flat.toUpperCase()}` })
    onClose()
  }

  return (
    <Modal
      open
      onClose={onClose}
      title={member ? 'Edit member' : 'Add member'}
      description="Use fictional details — this is demo data stored in your browser."
      footer={
        <>
          <Button onClick={onClose}>Cancel</Button>
          <Button variant="primary" onClick={save}>
            {member ? 'Save changes' : 'Add member'}
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
        <Field label="Full name" error={errors.name} className="sm:col-span-2">
          {(id) => <Input id={id} value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} invalid={!!errors.name} autoFocus />}
        </Field>
        <Field label="Flat / unit number" error={errors.flat}>
          {(id) => <Input id={id} value={f.flat} onChange={(e) => setF({ ...f, flat: e.target.value })} placeholder="e.g. B-402" invalid={!!errors.flat} />}
        </Field>
        <Field label="Phone number" error={errors.phone}>
          {(id) => <Input id={id} inputMode="tel" value={f.phone} onChange={(e) => setF({ ...f, phone: e.target.value })} placeholder="+91 98000 12345" invalid={!!errors.phone} />}
        </Field>
        <Field label="Email address" optional error={errors.email} className="sm:col-span-2">
          {(id) => <Input id={id} type="email" value={f.email} onChange={(e) => setF({ ...f, email: e.target.value })} invalid={!!errors.email} />}
        </Field>
        <Field label="Household category">
          {(id) => (
            <Select id={id} value={f.category} onChange={(e) => setF({ ...f, category: e.target.value as MemberCategory })}>
              {CATEGORIES.map((c) => (
                <option key={c}>{c}</option>
              ))}
            </Select>
          )}
        </Field>
        <Field label="Membership status">
          {(id) => (
            <Select id={id} value={f.status} onChange={(e) => setF({ ...f, status: e.target.value as MemberStatus })}>
              {STATUSES.map((c) => (
                <option key={c}>{c}</option>
              ))}
            </Select>
          )}
        </Field>
      </div>
    </Modal>
  )
}

interface ImportRow {
  line: number
  values: Record<string, string>
  errors: string[]
}

const SAMPLE_CSV = `name,flat,phone,email,category,status
Asha Pillai,A-101,+91 98000 44001,asha.pillai@mail.example,Owner,Active
Rahul Sen,A-102,+91 98000 44002,rahul.sen@mail.example,Tenant,Pending
Invalid Row,,12345,not-an-email,Owner,Active
`

function ImportDialog({ rwaId, onClose }: { rwaId: string; onClose: () => void }) {
  const { state, addMembers } = useStore()
  const toast = useToast()
  const input = useRef<HTMLInputElement>(null)
  const [rows, setRows] = useState<ImportRow[] | null>(null)
  const [fileName, setFileName] = useState('')
  const rwa = state.rwas.find((r) => r.id === rwaId)

  const parse = (text: string) => {
    const grid = parseCsv(text)
    if (grid.length < 2) {
      toast({ title: 'The file has no data rows', tone: 'error' })
      return
    }
    const header = grid[0].map((h) => h.trim().toLowerCase())
    const required = ['name', 'flat', 'phone']
    const missing = required.filter((r) => !header.includes(r))
    if (missing.length) {
      toast({ title: 'Missing columns', description: `Add: ${missing.join(', ')}`, tone: 'error' })
      return
    }
    const existingFlats = new Set(state.members.filter((m) => m.rwaId === rwaId).map((m) => `${m.flat.toUpperCase()}|${m.name.toLowerCase()}`))
    setRows(
      grid.slice(1).map((cells, i) => {
        const values = Object.fromEntries(header.map((h, j) => [h, (cells[j] ?? '').trim()]))
        const errors: string[] = []
        if (!values.name) errors.push('Name missing')
        if (!values.flat) errors.push('Flat missing')
        if (!isPhone(values.phone ?? '')) errors.push('Invalid phone')
        if (values.email && !isEmail(values.email)) errors.push('Invalid email')
        if (values.category && !CATEGORIES.includes(values.category as MemberCategory)) errors.push('Unknown category')
        if (values.status && !STATUSES.includes(values.status as MemberStatus)) errors.push('Unknown status')
        if (existingFlats.has(`${values.flat?.toUpperCase()}|${values.name?.toLowerCase()}`)) errors.push('Already exists')
        return { line: i + 2, values, errors }
      }),
    )
  }

  const valid = rows?.filter((r) => !r.errors.length) ?? []

  const confirm = () => {
    const now = new Date().toISOString()
    addMembers(
      valid.map((r) => ({
        id: uid('mem'),
        rwaId,
        name: r.values.name,
        flat: r.values.flat.toUpperCase(),
        phone: r.values.phone,
        email: r.values.email ?? '',
        category: (r.values.category as MemberCategory) || 'Owner',
        status: (r.values.status as MemberStatus) || 'Active',
        createdAt: now,
      })),
    )
    toast({ title: `${valid.length} members imported`, description: rows && rows.length > valid.length ? `${rows.length - valid.length} invalid rows were skipped.` : undefined })
    onClose()
  }

  return (
    <Modal
      open
      onClose={onClose}
      size="lg"
      title={`Import members · ${rwa?.name}`}
      description="CSV files are parsed entirely in your browser. Nothing is uploaded."
      footer={
        <>
          <Button onClick={onClose}>Cancel</Button>
          <Button variant="primary" disabled={!valid.length} onClick={confirm}>
            Import {valid.length || ''} valid row{valid.length === 1 ? '' : 's'}
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        <div className="flex flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-zinc-300 bg-zinc-50 p-6 text-center">
          <FileUp className="size-6 text-zinc-400" />
          <p className="text-sm text-zinc-700">{fileName || 'Choose a .csv file with columns name, flat, phone, email, category, status'}</p>
          <div className="flex gap-2">
            <Button size="sm" variant="primary" onClick={() => input.current?.click()}>
              {fileName ? 'Choose another file' : 'Choose file'}
            </Button>
            <Button size="sm" onClick={() => downloadText('members-sample.csv', SAMPLE_CSV)}>
              Download sample
            </Button>
          </div>
          <input
            ref={input}
            type="file"
            accept=".csv,text/csv"
            className="hidden"
            onChange={async (e) => {
              const file = e.target.files?.[0]
              e.target.value = ''
              if (!file) return
              setFileName(file.name)
              parse(await file.text())
            }}
          />
        </div>
        {rows && (
          <>
            <div className="flex flex-wrap gap-2 text-[13px]">
              <Badge tone="green">{valid.length} valid</Badge>
              {rows.length - valid.length > 0 && <Badge tone="red">{rows.length - valid.length} with errors (will be skipped)</Badge>}
            </div>
            <div className="thin-scroll max-h-72 overflow-auto rounded-lg border border-zinc-200">
              <table className="w-full text-[13px]">
                <thead className="sticky top-0 bg-zinc-50 text-left text-xs text-zinc-500">
                  <tr>
                    {['Row', 'Name', 'Flat', 'Phone', 'Email', 'Result'].map((h) => (
                      <th key={h} className="px-3 py-2 font-medium">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {rows.map((r) => (
                    <tr key={r.line} className={r.errors.length ? 'bg-red-50/60' : ''}>
                      <td className="px-3 py-2 text-zinc-400">{r.line}</td>
                      <td className="px-3 py-2">{r.values.name || '—'}</td>
                      <td className="px-3 py-2">{r.values.flat || '—'}</td>
                      <td className="px-3 py-2 whitespace-nowrap">{r.values.phone || '—'}</td>
                      <td className="px-3 py-2">{r.values.email || '—'}</td>
                      <td className="px-3 py-2">{r.errors.length ? <span className="text-red-700">{r.errors.join(', ')}</span> : <span className="text-emerald-700">Ready</span>}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>
    </Modal>
  )
}
