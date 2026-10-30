import { ArrowDown, ArrowUp, CalendarClock, Eye, Image, Pause, Pencil, Play, Plus, Send, Trash2, Upload } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { ActionMenu } from '../../components/menu'
import { BANNER_PRESETS, BannerArt, MobileBannerPreview, RwaChecklist } from '../../components/shared'
import { useToast } from '../../components/toast'
import {
  Badge,
  Button,
  Card,
  ConfirmDialog,
  DataTable,
  EmptyState,
  Field,
  FilterBar,
  IconButton,
  Input,
  Modal,
  Notice,
  PageHeader,
  Segmented,
  Select,
  StatusBadge,
  Textarea,
  type Column,
} from '../../components/ui'
import { useStore } from '../../lib/store'
import { BANNER_PLACEMENTS, type Banner, type BannerPlacement, type BannerStatus } from '../../lib/types'
import { addDays, cn, formatDate, fromInputDate, readImage, timeAgo, toInputDate, uid } from '../../lib/utils'

type Filter = 'All' | BannerStatus | 'Expired'
const isExpired = (b: Banner) => new Date(b.endDate).getTime() < Date.now()
const effectiveStatus = (b: Banner): Filter => (isExpired(b) && b.status !== 'Draft' ? 'Expired' : b.status)

export default function Banners() {
  const { state, saveBanner, deleteBanner } = useStore()
  const toast = useToast()
  const [params, setParams] = useSearchParams()
  const [filter, setFilter] = useState<Filter>('All')
  const [placement, setPlacement] = useState<'all' | BannerPlacement>('all')
  const [editing, setEditing] = useState<Banner | 'new' | null>(params.get('new') ? 'new' : null)
  const [previewing, setPreviewing] = useState<Banner | null>(null)
  const [deleting, setDeleting] = useState<Banner | null>(null)

  useEffect(() => {
    if (params.get('new')) setParams({}, { replace: true })
  }, [params, setParams])

  const sorted = [...state.banners].sort((a, b) => a.priority - b.priority)
  const rows = sorted.filter((b) => (filter === 'All' || effectiveStatus(b) === filter) && (placement === 'all' || b.placement === placement))

  const targetLabel = (b: Banner) => {
    if (b.targeting === 'all') return 'All RWAs'
    const names = b.rwaIds.map((id) => state.rwas.find((r) => r.id === id)?.name).filter(Boolean)
    return b.targeting === 'specific' ? (names[0] ?? '—') : `${names.length} selected RWA${names.length === 1 ? '' : 's'}`
  }

  const publish = (b: Banner) => {
    const future = new Date(b.startDate).getTime() > Date.now()
    saveBanner({ ...b, status: future ? 'Scheduled' : 'Published' })
    toast({ title: future ? `Scheduled for ${formatDate(b.startDate)}` : 'Banner published', description: `${b.title} · ${targetLabel(b)}` })
  }

  const move = (b: Banner, dir: -1 | 1) => {
    const i = sorted.findIndex((x) => x.id === b.id)
    const other = sorted[i + dir]
    if (!other) return
    saveBanner({ ...b, priority: other.priority })
    saveBanner({ ...other, priority: b.priority })
  }

  const columns: Column<Banner>[] = [
    {
      key: 'banner',
      header: 'Banner',
      className: 'min-w-64',
      render: (b) => (
        <div className="flex items-center gap-3">
          <BannerArt banner={b} compact className="h-10 w-16 shrink-0 rounded-md" />
          <div className="min-w-0">
            <p className="truncate font-medium text-zinc-900">{b.title}</p>
            <p className="truncate text-xs text-zinc-500">{b.description}</p>
          </div>
        </div>
      ),
    },
    { key: 'placement', header: 'Placement', render: (b) => <span className="whitespace-nowrap">{b.placement}</span> },
    {
      key: 'target',
      header: 'Target',
      render: (b) => (
        <div className="text-xs">
          <p className="whitespace-nowrap text-zinc-800">{targetLabel(b)}</p>
          <p className="text-zinc-500">{b.audience}</p>
        </div>
      ),
    },
    { key: 'status', header: 'Status', render: (b) => <StatusBadge status={effectiveStatus(b)} /> },
    {
      key: 'dates',
      header: 'Schedule',
      render: (b) => (
        <span className="text-xs whitespace-nowrap text-zinc-600">
          {formatDate(b.startDate)} → {formatDate(b.endDate)}
        </span>
      ),
    },
    {
      key: 'priority',
      header: 'Priority',
      render: (b) => {
        const i = sorted.findIndex((x) => x.id === b.id)
        return (
          <div className="flex items-center gap-0.5">
            <span className="w-5 text-center font-medium tabular-nums">{i + 1}</span>
            <IconButton label="Move up" disabled={i === 0} onClick={(e) => { e.stopPropagation(); move(b, -1) }} className="size-6">
              <ArrowUp className="size-3.5" />
            </IconButton>
            <IconButton label="Move down" disabled={i === sorted.length - 1} onClick={(e) => { e.stopPropagation(); move(b, 1) }} className="size-6">
              <ArrowDown className="size-3.5" />
            </IconButton>
          </div>
        )
      },
    },
    { key: 'updated', header: 'Updated', render: (b) => <span className="text-xs whitespace-nowrap text-zinc-500">{timeAgo(b.updatedAt)}</span> },
    {
      key: 'actions',
      header: <span className="sr-only">Actions</span>,
      className: 'text-right',
      render: (b) => (
        <ActionMenu
          items={[
            { label: 'Preview', icon: <Eye />, onClick: () => setPreviewing(b) },
            { label: 'Edit', icon: <Pencil />, onClick: () => setEditing(b) },
            { label: new Date(b.startDate).getTime() > Date.now() ? 'Schedule' : 'Publish', icon: <Send />, onClick: () => publish(b), hidden: b.status === 'Published' || b.status === 'Scheduled', divider: true },
            {
              label: 'Pause',
              icon: <Pause />,
              hidden: b.status !== 'Published' && b.status !== 'Scheduled',
              onClick: () => {
                saveBanner({ ...b, status: 'Paused' })
                toast({ title: 'Banner paused', tone: 'warning' })
              },
            },
            { label: 'Delete', icon: <Trash2 />, danger: true, onClick: () => setDeleting(b), divider: true },
          ]}
        />
      ),
    },
  ]

  return (
    <>
      <PageHeader
        title="Banners & Platform Content"
        description="Central banners shown in resident and admin apps across societies. Only the Super Admin can manage these."
        actions={
          <Button variant="primary" icon={<Plus className="size-4" />} onClick={() => setEditing('new')}>
            Create banner
          </Button>
        }
      />
      <Card>
        <FilterBar>
          <Segmented<Filter>
            value={filter}
            onChange={setFilter}
            options={(['All', 'Published', 'Scheduled', 'Paused', 'Draft', 'Expired'] as Filter[]).map((f) => ({
              value: f,
              label: f,
              count: f === 'All' ? state.banners.length : state.banners.filter((b) => effectiveStatus(b) === f).length,
            }))}
          />
          <Select aria-label="Placement" value={placement} onChange={(e) => setPlacement(e.target.value as typeof placement)} className="sm:ml-auto sm:w-48">
            <option value="all">All placements</option>
            {BANNER_PLACEMENTS.map((p) => (
              <option key={p}>{p}</option>
            ))}
          </Select>
        </FilterBar>
        <DataTable columns={columns} rows={rows} onRowClick={setEditing} empty={<EmptyState icon={<Image />} title="No banners match" description="Create a banner or change the filters." />} />
      </Card>

      {editing && <BannerEditor banner={editing === 'new' ? undefined : editing} nextPriority={sorted.length + 1} onClose={() => setEditing(null)} />}

      <Modal open={!!previewing} onClose={() => setPreviewing(null)} title="Banner preview" description={previewing ? `${previewing.placement} · ${targetLabel(previewing)}` : ''} size="sm">
        {previewing && <MobileBannerPreview banner={previewing} platformName={state.settings.platformName} />}
      </Modal>

      <ConfirmDialog
        open={!!deleting}
        onClose={() => setDeleting(null)}
        title="Delete banner?"
        description={`“${deleting?.title}” will be removed from every targeted society.`}
        confirmLabel="Delete banner"
        onConfirm={() => {
          if (!deleting) return
          deleteBanner(deleting.id)
          toast({ title: 'Banner deleted', tone: 'warning' })
        }}
      />
    </>
  )
}

function BannerEditor({ banner, nextPriority, onClose }: { banner?: Banner; nextPriority: number; onClose: () => void }) {
  const { state, saveBanner } = useStore()
  const toast = useToast()
  const fileRef = useRef<HTMLInputElement>(null)
  const [b, setB] = useState<Banner>(
    banner ?? {
      id: uid('ban'),
      title: '',
      description: '',
      image: 'preset:ocean',
      ctaLabel: 'Learn more',
      url: 'https://',
      placement: 'Home screen',
      audience: 'Residents',
      targeting: 'all',
      rwaIds: [],
      startDate: new Date().toISOString(),
      endDate: addDays(new Date(), 30).toISOString(),
      priority: nextPriority,
      status: 'Draft',
      updatedAt: new Date().toISOString(),
    },
  )
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [transient, setTransient] = useState(false)
  const rwas = state.rwas.filter((r) => r.status !== 'Deactivated')

  const save = (status: BannerStatus) => {
    const e: Record<string, string> = {}
    if (!b.title.trim()) e.title = 'Title is required'
    if (b.ctaLabel && !/^https?:\/\/[^\s.]+\.[^\s]+$/.test(b.url)) e.url = 'Enter a full URL starting with https://'
    if (!b.startDate || !b.endDate) e.dates = 'Start and end dates are required'
    else if (new Date(b.endDate) < new Date(b.startDate)) e.dates = 'End date must be after the start date'
    if (b.targeting !== 'all' && !b.rwaIds.length) e.rwaIds = b.targeting === 'specific' ? 'Choose a society' : 'Select at least one society'
    setErrors(e)
    if (Object.keys(e).length) return
    const finalStatus = status === 'Published' && new Date(b.startDate).getTime() > Date.now() ? 'Scheduled' : status
    saveBanner({ ...b, title: b.title.trim(), status: finalStatus })
    toast({
      title: finalStatus === 'Published' ? 'Banner published' : finalStatus === 'Scheduled' ? `Banner scheduled for ${formatDate(b.startDate)}` : 'Banner saved as draft',
      description: 'Demo mode: visible only inside this prototype.',
    })
    onClose()
  }

  return (
    <Modal
      open
      onClose={onClose}
      size="xl"
      title={banner ? 'Edit banner' : 'Create banner'}
      description="Platform-wide content. Societies can view targeted banners but can’t edit them."
      footer={
        <>
          <Button onClick={onClose}>Cancel</Button>
          {banner && banner.status !== 'Draft' && (
            <Button icon={<Pause className="size-4" />} onClick={() => save('Paused')}>
              Save & pause
            </Button>
          )}
          <Button onClick={() => save('Draft')}>Save draft</Button>
          <Button variant="primary" icon={new Date(b.startDate).getTime() > Date.now() ? <CalendarClock className="size-4" /> : <Play className="size-4" />} onClick={() => save('Published')}>
            {new Date(b.startDate).getTime() > Date.now() ? 'Schedule' : 'Publish'}
          </Button>
        </>
      }
    >
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_300px]">
        <div className="grid grid-cols-1 content-start gap-4 sm:grid-cols-2">
          <Field label="Banner title" error={errors.title} className="sm:col-span-2">
            {(id) => <Input id={id} value={b.title} onChange={(e) => setB({ ...b, title: e.target.value })} invalid={!!errors.title} autoFocus />}
          </Field>
          <Field label="Description" optional className="sm:col-span-2">
            {(id) => <Textarea id={id} rows={2} value={b.description} onChange={(e) => setB({ ...b, description: e.target.value })} />}
          </Field>
          <Field label="Banner image" className="sm:col-span-2" hint={transient ? 'Large file: preview only, it will not survive a refresh.' : 'Pick a built-in demo artwork or upload a local image (stored in your browser).'}>
            {() => (
              <div className="flex flex-wrap items-center gap-2">
                {Object.entries(BANNER_PRESETS).map(([key, p]) => (
                  <button
                    key={key}
                    type="button"
                    title={p.label}
                    aria-label={`${p.label} artwork`}
                    onClick={() => setB({ ...b, image: `preset:${key}` })}
                    className={cn('h-9 w-14 rounded-md', p.className, b.image === `preset:${key}` ? 'ring-2 ring-brand ring-offset-2' : 'opacity-80 hover:opacity-100')}
                  />
                ))}
                <Button size="sm" icon={<Upload className="size-3.5" />} onClick={() => fileRef.current?.click()}>
                  Upload
                </Button>
                {!b.image.startsWith('preset:') && <Badge tone="green">Custom image</Badge>}
                <input
                  ref={fileRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={async (e) => {
                    const file = e.target.files?.[0]
                    e.target.value = ''
                    if (!file) return
                    const { url, persisted } = await readImage(file)
                    setTransient(!persisted)
                    setB({ ...b, image: url })
                  }}
                />
              </div>
            )}
          </Field>
          <Field label="CTA label" optional>
            {(id) => <Input id={id} value={b.ctaLabel} onChange={(e) => setB({ ...b, ctaLabel: e.target.value })} />}
          </Field>
          <Field label="Destination URL" error={errors.url}>
            {(id) => <Input id={id} value={b.url} onChange={(e) => setB({ ...b, url: e.target.value })} invalid={!!errors.url} />}
          </Field>
          <Field label="Placement">
            {(id) => (
              <Select id={id} value={b.placement} onChange={(e) => setB({ ...b, placement: e.target.value as BannerPlacement })}>
                {BANNER_PLACEMENTS.map((p) => (
                  <option key={p}>{p}</option>
                ))}
              </Select>
            )}
          </Field>
          <Field label="Target audience">
            {(id) => (
              <Select id={id} value={b.audience} onChange={(e) => setB({ ...b, audience: e.target.value as Banner['audience'] })}>
                <option>Residents</option>
                <option>RWA admins</option>
                <option>Everyone</option>
              </Select>
            )}
          </Field>
          <Field label="Targeting" error={errors.rwaIds} className="sm:col-span-2">
            {(id) => (
              <div className="space-y-2">
                <Segmented
                  value={b.targeting}
                  onChange={(targeting) => setB({ ...b, targeting, rwaIds: targeting === 'specific' ? b.rwaIds.slice(0, 1) : b.rwaIds })}
                  options={[
                    { value: 'all', label: 'All RWAs' },
                    { value: 'selected', label: 'Selected RWAs' },
                    { value: 'specific', label: 'Specific society' },
                  ]}
                />
                {b.targeting === 'selected' && <RwaChecklist rwas={rwas} value={b.rwaIds} onChange={(rwaIds) => setB({ ...b, rwaIds })} />}
                {b.targeting === 'specific' && (
                  <Select id={id} value={b.rwaIds[0] ?? ''} onChange={(e) => setB({ ...b, rwaIds: e.target.value ? [e.target.value] : [] })} invalid={!!errors.rwaIds}>
                    <option value="">Choose a society…</option>
                    {rwas.map((r) => (
                      <option key={r.id} value={r.id}>
                        {r.name}
                      </option>
                    ))}
                  </Select>
                )}
              </div>
            )}
          </Field>
          <Field label="Start date">
            {(id) => <Input id={id} type="date" value={toInputDate(b.startDate)} onChange={(e) => setB({ ...b, startDate: fromInputDate(e.target.value) })} invalid={!!errors.dates} />}
          </Field>
          <Field label="End date" error={errors.dates}>
            {(id) => <Input id={id} type="date" value={toInputDate(b.endDate)} onChange={(e) => setB({ ...b, endDate: fromInputDate(e.target.value) })} invalid={!!errors.dates} />}
          </Field>
          <Field label="Priority" hint="1 shows first. You can also reorder from the list.">
            {(id) => <Input id={id} type="number" min={1} value={b.priority} onChange={(e) => setB({ ...b, priority: Math.max(1, Number(e.target.value) || 1) })} />}
          </Field>
          <Field label="Current status">{() => <div className="pt-1.5"><StatusBadge status={b.status} /></div>}</Field>
        </div>
        <div className="lg:sticky lg:top-0 lg:self-start">
          <p className="mb-3 text-xs font-medium text-zinc-500">Mobile preview · {b.placement}</p>
          <MobileBannerPreview banner={b} platformName={state.settings.platformName} />
          <Notice className="mt-4">Preview only. Publishing changes status in this demo; nothing is pushed to real devices.</Notice>
        </div>
      </div>
    </Modal>
  )
}
