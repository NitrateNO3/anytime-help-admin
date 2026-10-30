import { Bell, Eye, Plus, Send, Trash2 } from 'lucide-react'
import { useState } from 'react'
import { ActionMenu } from '../../components/menu'
import { AccessDenied, RestrictedHint, RwaChecklist, useGate } from '../../components/shared'
import { useToast } from '../../components/toast'
import {
  Badge,
  Button,
  Card,
  DataTable,
  DemoBadge,
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
  Textarea,
  type Column,
} from '../../components/ui'
import { useStore } from '../../lib/store'
import type { AppNotification } from '../../lib/types'
import { formatDateTime, uid } from '../../lib/utils'
import type { ModuleProps } from './scope'

const TYPES: AppNotification['type'][] = ['Info', 'Alert', 'Maintenance', 'Event']
const TYPE_TONE = { Info: 'blue', Alert: 'red', Maintenance: 'amber', Event: 'violet' } as const

export default function Notifications({ scopeRwaId }: ModuleProps) {
  const { state, saveNotification, deleteNotification } = useStore()
  const gate = useGate()
  const toast = useToast()
  const [creating, setCreating] = useState(false)
  const [preview, setPreview] = useState<AppNotification | null>(null)
  const [scopeFilter, setScopeFilter] = useState<'all' | 'platform' | 'society'>('all')
  const [q, setQ] = useState('')

  if (!gate('notifications', 'view').allowed) return <AccessDenied />

  const isPlatform = !scopeRwaId
  const canCreate = gate('notifications', 'create').allowed
  const canPublish = gate('notifications', 'publish').allowed
  const canDelete = gate('notifications', 'delete').allowed

  const relevant = state.notifications.filter((n) =>
    isPlatform ? true : (n.scope === 'society' && n.rwaIds.includes(scopeRwaId)) || (n.scope === 'platform' && n.status === 'Published' && (n.audience === 'all' || n.rwaIds.includes(scopeRwaId))),
  )
  const needle = q.trim().toLowerCase()
  const rows = relevant
    .filter((n) => (scopeFilter === 'all' || n.scope === scopeFilter) && (!needle || `${n.title} ${n.message}`.toLowerCase().includes(needle)))
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))

  const audienceLabel = (n: AppNotification) =>
    n.audience === 'all' ? 'All RWAs' : n.rwaIds.map((id) => state.rwas.find((r) => r.id === id)?.name ?? 'Unknown').join(', ')

  const publish = (n: AppNotification) => {
    saveNotification({ ...n, status: 'Published' })
    toast({ title: 'Marked as published (simulated)', description: 'No email, SMS or push notification was sent.' })
  }

  const canManage = (n: AppNotification) => (isPlatform ? n.scope === 'platform' : n.scope === 'society')

  const columns: Column<AppNotification>[] = [
    {
      key: 'title',
      header: 'Notification',
      className: 'min-w-64',
      render: (n) => (
        <div className="min-w-0">
          <p className="font-medium text-zinc-900">{n.title}</p>
          <p className="line-clamp-1 text-xs text-zinc-500">{n.message}</p>
        </div>
      ),
    },
    { key: 'type', header: 'Type', render: (n) => <Badge tone={TYPE_TONE[n.type]}>{n.type}</Badge> },
    {
      key: 'scope',
      header: 'Source',
      render: (n) => <Badge tone={n.scope === 'platform' ? 'violet' : 'brand'}>{n.scope === 'platform' ? 'Platform' : 'Society'}</Badge>,
    },
    { key: 'aud', header: 'Audience', render: (n) => <span className="line-clamp-1 max-w-48 text-[13px]">{audienceLabel(n)}</span> },
    { key: 'date', header: 'Created', render: (n) => <span className="whitespace-nowrap text-zinc-500">{formatDateTime(n.createdAt)}</span> },
    { key: 'status', header: 'Status', render: (n) => <StatusBadge status={n.status} /> },
    {
      key: 'actions',
      header: <span className="sr-only">Actions</span>,
      className: 'text-right',
      render: (n) => (
        <ActionMenu
          items={[
            { label: 'Preview', icon: <Eye />, onClick: () => setPreview(n) },
            { label: 'Mark as published', icon: <Send />, onClick: () => publish(n), hidden: n.status === 'Published' || !canManage(n), disabled: !canPublish },
            {
              label: 'Delete',
              icon: <Trash2 />,
              danger: true,
              hidden: !canManage(n) || !canDelete,
              onClick: () => {
                deleteNotification(n.id)
                toast({ title: 'Notification deleted', tone: 'warning' })
              },
            },
          ]}
        />
      ),
    },
  ]

  return (
    <>
      <PageHeader
        title={
          <span className="flex items-center gap-3">
            Notifications <DemoBadge>Simulated delivery</DemoBadge>
          </span>
        }
        description={isPlatform ? 'Create platform-wide notices for all or selected societies.' : 'Society notices and platform messages relevant to this society.'}
        actions={
          <>
            {!canCreate && <RestrictedHint>Creating notifications is restricted for your role</RestrictedHint>}
            <Button variant="primary" icon={<Plus className="size-4" />} disabled={!canCreate} onClick={() => setCreating(true)}>
              {isPlatform ? 'New platform notification' : 'New society notification'}
            </Button>
          </>
        }
      />
      <Notice className="mb-4">Publishing only changes the status inside this prototype. No email, SMS or push notification is ever delivered.</Notice>
      <Card>
        <FilterBar>
          <Segmented
            value={scopeFilter}
            onChange={setScopeFilter}
            options={[
              { value: 'all', label: 'All', count: relevant.length },
              { value: 'platform', label: 'Platform', count: relevant.filter((n) => n.scope === 'platform').length },
              { value: 'society', label: 'Society', count: relevant.filter((n) => n.scope === 'society').length },
            ]}
          />
          <SearchInput value={q} onChange={setQ} placeholder="Search notifications" className="sm:ml-auto" />
        </FilterBar>
        <DataTable columns={columns} rows={rows} onRowClick={setPreview} empty={<EmptyState icon={<Bell />} title="No notifications yet" />} />
      </Card>

      {creating && <NotificationForm scopeRwaId={scopeRwaId} canPublish={canPublish} onClose={() => setCreating(false)} />}
      <Modal open={!!preview} onClose={() => setPreview(null)} title="Notification preview" size="sm">
        {preview && <NotificationPreview n={preview} audience={audienceLabel(preview)} />}
      </Modal>
    </>
  )
}

function NotificationPreview({ n, audience }: { n: Pick<AppNotification, 'title' | 'message' | 'type'>; audience: string }) {
  const { state } = useStore()
  return (
    <div className="space-y-3">
      <div className="rounded-2xl bg-zinc-900 p-3">
        <div className="rounded-xl bg-white/95 p-3 shadow">
          <div className="flex items-center gap-2 text-[11px] text-zinc-500">
            <span className="flex size-4 items-center justify-center rounded bg-brand text-[9px] font-bold text-white">{state.settings.platformName[0]}</span>
            {state.settings.platformName} · now
            <Badge tone={TYPE_TONE[n.type]} className="ml-auto !py-0 text-[10px]">
              {n.type}
            </Badge>
          </div>
          <p className="mt-1.5 text-sm font-semibold text-zinc-900">{n.title || 'Notification title'}</p>
          <p className="mt-0.5 text-[13px] text-zinc-600">{n.message || 'Your message will appear here.'}</p>
        </div>
      </div>
      <p className="text-xs text-zinc-500">Audience: {audience}</p>
    </div>
  )
}

function NotificationForm({ scopeRwaId, canPublish, onClose }: { scopeRwaId?: string; canPublish: boolean; onClose: () => void }) {
  const { state, saveNotification, actorName } = useStore()
  const toast = useToast()
  const isPlatform = !scopeRwaId
  const [f, setF] = useState({ title: '', message: '', type: 'Info' as AppNotification['type'], audience: 'all' as 'all' | 'selected', rwaIds: [] as string[] })
  const [errors, setErrors] = useState<Record<string, string>>({})
  const rwas = state.rwas.filter((r) => r.status !== 'Deactivated')

  const save = (status: 'Draft' | 'Published') => {
    const e: Record<string, string> = {}
    if (!f.title.trim()) e.title = 'Title is required'
    if (!f.message.trim()) e.message = 'Message is required'
    if (isPlatform && f.audience === 'selected' && !f.rwaIds.length) e.rwaIds = 'Select at least one society'
    setErrors(e)
    if (Object.keys(e).length) return
    saveNotification({
      id: uid('ntf'),
      title: f.title.trim(),
      message: f.message.trim(),
      type: f.type,
      scope: isPlatform ? 'platform' : 'society',
      audience: isPlatform ? f.audience : 'selected',
      rwaIds: isPlatform ? (f.audience === 'all' ? [] : f.rwaIds) : [scopeRwaId],
      status,
      createdAt: new Date().toISOString(),
      createdBy: actorName(),
    })
    toast({ title: status === 'Published' ? 'Notification published (simulated)' : 'Draft saved', description: status === 'Published' ? 'Nothing was actually sent.' : undefined })
    onClose()
  }

  const audience = isPlatform ? (f.audience === 'all' ? 'All RWAs' : `${f.rwaIds.length} selected RWA${f.rwaIds.length === 1 ? '' : 's'}`) : (state.rwas.find((r) => r.id === scopeRwaId)?.name ?? '')

  return (
    <Modal
      open
      onClose={onClose}
      size="lg"
      title={isPlatform ? 'New platform notification' : 'New society notification'}
      footer={
        <>
          <Button onClick={onClose}>Cancel</Button>
          <Button onClick={() => save('Draft')}>Save draft</Button>
          <Button variant="primary" icon={<Send className="size-4" />} disabled={!canPublish} onClick={() => save('Published')}>
            Publish (simulated)
          </Button>
        </>
      }
    >
      <div className="grid grid-cols-1 gap-6 md:grid-cols-[1fr_16rem]">
        <div className="space-y-4">
          <Field label="Title" error={errors.title}>
            {(id) => <Input id={id} value={f.title} onChange={(e) => setF({ ...f, title: e.target.value })} invalid={!!errors.title} autoFocus />}
          </Field>
          <Field label="Message" error={errors.message}>
            {(id) => <Textarea id={id} value={f.message} onChange={(e) => setF({ ...f, message: e.target.value })} invalid={!!errors.message} />}
          </Field>
          <Field label="Type">
            {(id) => (
              <Select id={id} value={f.type} onChange={(e) => setF({ ...f, type: e.target.value as AppNotification['type'] })}>
                {TYPES.map((t) => (
                  <option key={t}>{t}</option>
                ))}
              </Select>
            )}
          </Field>
          {isPlatform && (
            <Field label="Audience" error={errors.rwaIds}>
              {() => (
                <div className="space-y-2">
                  <Segmented
                    value={f.audience}
                    onChange={(audience) => setF({ ...f, audience })}
                    options={[
                      { value: 'all', label: 'All RWAs' },
                      { value: 'selected', label: 'Selected RWAs' },
                    ]}
                  />
                  {f.audience === 'selected' && <RwaChecklist rwas={rwas} value={f.rwaIds} onChange={(rwaIds) => setF({ ...f, rwaIds })} />}
                </div>
              )}
            </Field>
          )}
        </div>
        <div>
          <p className="mb-2 text-xs font-medium text-zinc-500">Preview</p>
          <NotificationPreview n={f} audience={audience} />
        </div>
      </div>
    </Modal>
  )
}
