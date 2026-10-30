import { CalendarClock, Lock, Megaphone, Pencil, Plus, Send, Trash2 } from 'lucide-react'
import { useState } from 'react'
import { AccessDenied, BannerArt, ImagePicker, RestrictedHint, useGate } from '../../components/shared'
import { useToast } from '../../components/toast'
import { Badge, Button, Card, ConfirmDialog, EmptyState, Field, FilterBar, Input, Modal, Notice, PageHeader, SearchInput, Segmented, StatusBadge, Textarea } from '../../components/ui'
import { useStore } from '../../lib/store'
import { liveBannersFor } from '../../lib/metrics'
import type { Announcement } from '../../lib/types'
import { formatDate, fromInputDate, toInputDate, uid } from '../../lib/utils'
import { RwaFilterSelect, useModuleScope, type ModuleProps } from './scope'

type Filter = 'All' | 'Published' | 'Draft' | 'Expired'

const isExpired = (a: Announcement) => !!a.expiresAt && new Date(a.expiresAt).getTime() < Date.now()

export default function Announcements(props: ModuleProps) {
  const { state, saveAnnouncement, deleteAnnouncement } = useStore()
  const gate = useGate()
  const toast = useToast()
  const scope = useModuleScope(props)
  const [filter, setFilter] = useState<Filter>('All')
  const [q, setQ] = useState('')
  const [editing, setEditing] = useState<Announcement | 'new' | null>(null)
  const [deleting, setDeleting] = useState<Announcement | null>(null)

  if (!gate('announcements', 'view').allowed) return <AccessDenied />

  // Super Admin inspects announcements across societies; only the society portal writes them.
  const readOnly = !!props.readOnly || !scope.isScoped
  const canCreate = gate('announcements', 'create').allowed && !readOnly
  const canEdit = gate('announcements', 'edit').allowed && !readOnly
  const canDelete = gate('announcements', 'delete').allowed && !readOnly
  const canPublish = gate('announcements', 'publish').allowed && !readOnly
  const isSocietyMember = !canEdit && !canCreate && scope.isScoped

  const base = state.announcements.filter((a) => scope.inScope(a.rwaId) && (!isSocietyMember || (a.status === 'Published' && !isExpired(a))))
  const needle = q.trim().toLowerCase()
  const rows = base
    .filter((a) => {
      const f = filter === 'Expired' ? isExpired(a) : filter === 'All' || (a.status === filter && !isExpired(a))
      return f && (!needle || `${a.title} ${a.body}`.toLowerCase().includes(needle))
    })
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
  const banners = scope.isScoped && state.settings.features.platformBanners ? liveBannersFor(state.banners, scope.rwaFilter) : []

  const actions = !readOnly && (
    <>
      {!canCreate && !isSocietyMember && <RestrictedHint>Creating announcements is restricted for your role</RestrictedHint>}
      {!isSocietyMember && (
        <Button variant="primary" icon={<Plus className="size-4" />} disabled={!canCreate} onClick={() => setEditing('new')}>
          New announcement
        </Button>
      )}
    </>
  )

  return (
    <>
      {!props.embedded ? (
        <PageHeader
          title="Announcements"
          description={scope.isScoped ? 'Society notices for residents. Each announcement belongs only to this society.' : 'Inspect announcements published by each society. Societies manage their own announcements.'}
          actions={actions}
        />
      ) : (
        !readOnly && <div className="mb-3 flex justify-end gap-2">{actions}</div>
      )}

      {!scope.isScoped && !props.embedded && (
        <Notice tone="info" className="mb-4">
          Read-only inspection. Super Admin publishes platform-wide content from <b>Banners & Content</b>; society announcements are written by each RWA.
        </Notice>
      )}

      {banners.length > 0 && !props.embedded && (
        <Card className="mb-5">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-zinc-100 px-5 py-3">
            <div className="flex items-center gap-2">
              <Badge tone="violet">Platform banner</Badge>
              <span className="text-[13px] text-zinc-500">Published by {state.settings.platformName}. Visible to this society, not editable here.</span>
            </div>
            <span className="inline-flex items-center gap-1 text-xs text-zinc-500">
              <Lock className="size-3.5" /> Managed centrally
            </span>
          </div>
          <div className="grid grid-cols-1 gap-3 p-4 sm:grid-cols-2 lg:grid-cols-3">
            {banners.map((b) => (
              <BannerArt key={b.id} banner={b} className="h-32 rounded-xl" />
            ))}
          </div>
        </Card>
      )}

      <Card>
        <FilterBar>
          <Segmented<Filter>
            value={filter}
            onChange={setFilter}
            options={(['All', 'Published', 'Draft', 'Expired'] as Filter[]).map((f) => ({
              value: f,
              label: f,
              count: f === 'All' ? base.length : f === 'Expired' ? base.filter(isExpired).length : base.filter((a) => a.status === f && !isExpired(a)).length,
            }))}
          />
          <div className="flex flex-col gap-2 sm:ml-auto sm:flex-row">
            {!scope.isScoped && <RwaFilterSelect value={scope.rwaFilter} onChange={scope.setRwaFilter} />}
            <SearchInput value={q} onChange={setQ} placeholder="Search announcements" />
          </div>
        </FilterBar>
        <div className="p-4">
          {rows.length === 0 ? (
            <EmptyState
              icon={<Megaphone />}
              title="No announcements"
              description={canCreate ? 'Share updates, events and maintenance notices with residents.' : 'Nothing has been published here yet.'}
              action={canCreate ? <Button variant="primary" onClick={() => setEditing('new')}>New announcement</Button> : undefined}
            />
          ) : (
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
              {rows.map((a) => (
                <article key={a.id} className="flex flex-col overflow-hidden rounded-xl border border-zinc-200 bg-white">
                  {a.image && <img src={a.image} alt="" className="h-36 w-full object-cover" onError={(e) => (e.currentTarget.style.display = 'none')} />}
                  <div className="flex flex-1 flex-col p-4">
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge tone="brand">Society announcement</Badge>
                      {isExpired(a) ? <StatusBadge status="Expired" /> : <StatusBadge status={a.status} />}
                      {!scope.isScoped && <span className="text-xs text-zinc-500">{scope.rwaName(a.rwaId)}</span>}
                    </div>
                    <h3 className="mt-2 font-semibold text-zinc-900">{a.title}</h3>
                    <p className="mt-1 line-clamp-3 flex-1 text-sm text-zinc-600">{a.body}</p>
                    <div className="mt-3 flex flex-wrap items-center justify-between gap-2 border-t border-zinc-100 pt-3">
                      <p className="flex items-center gap-1 text-xs text-zinc-500">
                        <CalendarClock className="size-3.5" />
                        {a.publishedAt ? `Published ${formatDate(a.publishedAt)}` : `Created ${formatDate(a.createdAt)}`}
                        {a.expiresAt && ` · ${isExpired(a) ? 'expired' : 'expires'} ${formatDate(a.expiresAt)}`}
                      </p>
                      {!readOnly && !isSocietyMember && (
                        <div className="flex gap-1">
                          {a.status === 'Draft' && (
                            <Button
                              size="sm"
                              icon={<Send className="size-3.5" />}
                              disabled={!canPublish}
                              title={canPublish ? undefined : 'Publishing is restricted for your role'}
                              onClick={() => {
                                saveAnnouncement({ ...a, status: 'Published', publishedAt: new Date().toISOString() })
                                toast({ title: 'Announcement published', description: 'Residents of this society can now see it (demo).' })
                              }}
                            >
                              Publish
                            </Button>
                          )}
                          <Button size="sm" variant="ghost" aria-label="Edit" disabled={!canEdit} onClick={() => setEditing(a)}>
                            <Pencil className="size-3.5" />
                          </Button>
                          <Button size="sm" variant="ghost" aria-label="Delete" disabled={!canDelete} onClick={() => setDeleting(a)}>
                            <Trash2 className="size-3.5" />
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>
                </article>
              ))}
            </div>
          )}
        </div>
      </Card>

      {editing && scope.targetRwa && (
        <AnnouncementForm announcement={editing === 'new' ? undefined : editing} rwaId={scope.targetRwa.id} canPublish={canPublish} onClose={() => setEditing(null)} />
      )}
      <ConfirmDialog
        open={!!deleting}
        onClose={() => setDeleting(null)}
        title="Delete announcement?"
        description={`“${deleting?.title}” will be removed for all residents. This can’t be undone (except via Reset Demo Data).`}
        confirmLabel="Delete"
        onConfirm={() => {
          if (!deleting) return
          deleteAnnouncement(deleting.id)
          toast({ title: 'Announcement deleted', tone: 'warning' })
        }}
      />
    </>
  )
}

function AnnouncementForm({ announcement, rwaId, canPublish, onClose }: { announcement?: Announcement; rwaId: string; canPublish: boolean; onClose: () => void }) {
  const { saveAnnouncement } = useStore()
  const toast = useToast()
  const [f, setF] = useState({ title: announcement?.title ?? '', body: announcement?.body ?? '', image: announcement?.image, expiresAt: toInputDate(announcement?.expiresAt) })
  const [errors, setErrors] = useState<Record<string, string>>({})

  const save = (status: 'Draft' | 'Published') => {
    const e: Record<string, string> = {}
    if (!f.title.trim()) e.title = 'Title is required'
    if (!f.body.trim()) e.body = 'Message is required'
    if (f.expiresAt && new Date(f.expiresAt) < new Date(new Date().toDateString())) e.expiresAt = 'Expiry must be today or later'
    setErrors(e)
    if (Object.keys(e).length) return
    const now = new Date().toISOString()
    saveAnnouncement({
      id: announcement?.id ?? uid('ann'),
      rwaId,
      title: f.title.trim(),
      body: f.body.trim(),
      image: f.image,
      expiresAt: f.expiresAt ? fromInputDate(f.expiresAt) : undefined,
      status,
      createdAt: announcement?.createdAt ?? now,
      publishedAt: status === 'Published' ? (announcement?.publishedAt ?? now) : undefined,
    })
    toast({ title: status === 'Published' ? 'Announcement published' : 'Draft saved', description: status === 'Published' ? 'Visible to residents of this society (demo, no push sent).' : undefined })
    onClose()
  }

  return (
    <Modal
      open
      onClose={onClose}
      title={announcement ? 'Edit announcement' : 'New announcement'}
      description="Announcements are only visible inside this society."
      footer={
        <>
          <Button onClick={onClose}>Cancel</Button>
          <Button onClick={() => save('Draft')}>Save draft</Button>
          <Button variant="primary" disabled={!canPublish} title={canPublish ? undefined : 'Publishing is restricted for your role'} onClick={() => save('Published')}>
            Publish
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        <Field label="Title" error={errors.title}>
          {(id) => <Input id={id} value={f.title} onChange={(e) => setF({ ...f, title: e.target.value })} invalid={!!errors.title} autoFocus />}
        </Field>
        <Field label="Message" error={errors.body}>
          {(id) => <Textarea id={id} rows={5} value={f.body} onChange={(e) => setF({ ...f, body: e.target.value })} invalid={!!errors.body} />}
        </Field>
        <Field label="Image" optional>
          {() => <ImagePicker value={f.image} onChange={(image) => setF({ ...f, image })} />}
        </Field>
        <Field label="Expiry date" optional error={errors.expiresAt} hint="Expired announcements are hidden from residents automatically.">
          {(id) => <Input id={id} type="date" value={f.expiresAt} onChange={(e) => setF({ ...f, expiresAt: e.target.value })} className="sm:w-52" invalid={!!errors.expiresAt} />}
        </Field>
      </div>
    </Modal>
  )
}
