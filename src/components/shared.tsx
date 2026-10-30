/* eslint-disable react-refresh/only-export-components */
import { ImagePlus, Lock, ShieldAlert, Trash2 } from 'lucide-react'
import { useRef, useState, type ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { useStore } from '../lib/store'
import type { Action, Banner, Module, Rwa } from '../lib/types'
import { cn, readImage } from '../lib/utils'
import { useToast } from './toast'
import { Avatar, Button, Card, CardHeader, EmptyState } from './ui'

/* ---------- Chart container ---------- */

export function ChartCard({ title, description, action, children, className }: { title: string; description?: string; action?: ReactNode; children: ReactNode; className?: string }) {
  return (
    <Card className={className}>
      <CardHeader title={title} description={description} action={action} />
      <div className="h-64 p-4 pt-3">{children}</div>
    </Card>
  )
}

// Validated categorical order (dataviz reference palette) — assigned in fixed order, never cycled.
export const CHART_COLORS = ['#2a78d6', '#eb6834', '#1baf7a', '#eda100', '#e87ba4', '#008300', '#6250d6', '#e34948']
export const AXIS_PROPS = { tick: { fontSize: 12, fill: '#71717a' }, axisLine: false, tickLine: false } as const
export const GRID_PROPS = { stroke: '#f0f0f2', vertical: false } as const

export const tooltipStyle = {
  contentStyle: { borderRadius: 10, border: '1px solid #e4e4e7', fontSize: 12, boxShadow: '0 4px 12px rgba(0,0,0,0.06)' },
  labelStyle: { color: '#3f3f46', fontWeight: 600 },
}

/* ---------- Banner visuals ---------- */

export const BANNER_PRESETS: Record<string, { label: string; className: string }> = {
  sunset: { label: 'Sunset', className: 'bg-gradient-to-br from-orange-400 via-rose-500 to-fuchsia-600' },
  ocean: { label: 'Ocean', className: 'bg-gradient-to-br from-sky-400 via-blue-500 to-indigo-600' },
  forest: { label: 'Forest', className: 'bg-gradient-to-br from-emerald-400 via-teal-500 to-cyan-700' },
  violet: { label: 'Violet', className: 'bg-gradient-to-br from-violet-500 via-purple-500 to-indigo-700' },
  slate: { label: 'Slate', className: 'bg-gradient-to-br from-slate-600 via-slate-700 to-zinc-900' },
}

export function BannerArt({ banner, className, compact }: { banner: Pick<Banner, 'image' | 'title' | 'description' | 'ctaLabel'>; className?: string; compact?: boolean }) {
  const preset = banner.image.startsWith('preset:') ? BANNER_PRESETS[banner.image.slice(7)] : undefined
  return (
    <div className={cn('relative overflow-hidden text-white', preset?.className ?? 'bg-zinc-800', className)}>
      {!preset && banner.image && <img src={banner.image} alt="" className="absolute inset-0 size-full object-cover" onError={(e) => (e.currentTarget.style.display = 'none')} />}
      {!preset && <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />}
      {preset && <div className="absolute -top-6 -right-6 size-24 rounded-full bg-white/15" />}
      {!compact && (
        <div className="relative flex h-full flex-col justify-end p-3">
          <p className="text-[13px] leading-tight font-semibold">{banner.title || 'Banner title'}</p>
          {banner.description && <p className="mt-0.5 line-clamp-2 text-[11px] leading-snug text-white/85">{banner.description}</p>}
          {banner.ctaLabel && <span className="mt-2 inline-flex w-fit rounded-full bg-white px-2.5 py-1 text-[10px] font-semibold text-zinc-900">{banner.ctaLabel}</span>}
        </div>
      )}
    </div>
  )
}

export function MobileBannerPreview({ banner, platformName }: { banner: Banner; platformName: string }) {
  const placementTop = banner.placement === 'Home screen' || banner.placement === 'Dashboard'
  return (
    <div className="mx-auto w-[260px] rounded-[2.2rem] border-[7px] border-zinc-900 bg-zinc-900 shadow-xl">
      <div className="overflow-hidden rounded-[1.7rem] bg-zinc-50">
        <div className="flex items-center justify-between px-5 pt-2.5 pb-1 text-[10px] font-semibold text-zinc-800">
          <span>9:41</span>
          <span className="h-4 w-16 rounded-full bg-zinc-900" />
          <span>100%</span>
        </div>
        <div className="space-y-2.5 px-3 pt-2 pb-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[10px] text-zinc-500">Good morning</p>
              <p className="text-[13px] font-semibold text-zinc-900">{platformName}</p>
            </div>
            <span className="size-7 rounded-full bg-brand-soft" />
          </div>
          {placementTop && <BannerArt banner={banner} className="h-32 rounded-xl" />}
          <div className="grid grid-cols-4 gap-1.5">
            {['Complaints', 'Visitors', 'Notices', 'Help'].map((x) => (
              <div key={x} className="flex flex-col items-center gap-1 rounded-lg bg-white p-1.5 shadow-xs">
                <span className="size-5 rounded-md bg-brand-soft" />
                <span className="text-[8px] text-zinc-600">{x}</span>
              </div>
            ))}
          </div>
          {!placementTop && (
            <div>
              <p className="mb-1 text-[10px] font-semibold text-zinc-500 uppercase">{banner.placement === 'Promotional area' ? 'Offers for you' : 'Highlights'}</p>
              <BannerArt banner={banner} className="h-28 rounded-xl" />
            </div>
          )}
          <div className="space-y-1.5">
            {[0, 1].map((i) => (
              <div key={i} className="flex items-center gap-2 rounded-lg bg-white p-2 shadow-xs">
                <span className="size-6 rounded-md bg-zinc-100" />
                <div className="flex-1 space-y-1">
                  <span className="block h-1.5 w-3/4 rounded bg-zinc-200" />
                  <span className="block h-1.5 w-1/2 rounded bg-zinc-100" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

/* ---------- Image picker ---------- */

export function ImagePicker({ value, onChange, label = 'Upload image', shape = 'wide' }: { value?: string; onChange: (url: string | undefined) => void; label?: string; shape?: 'wide' | 'square' }) {
  const input = useRef<HTMLInputElement>(null)
  const toast = useToast()
  const [transient, setTransient] = useState(false)
  return (
    <div className="flex items-center gap-3">
      <div className={cn('flex shrink-0 items-center justify-center overflow-hidden rounded-lg border border-dashed border-zinc-300 bg-zinc-50', shape === 'square' ? 'size-16' : 'h-16 w-28')}>
        {value ? <img src={value} alt="" className="size-full object-cover" /> : <ImagePlus className="size-5 text-zinc-400" />}
      </div>
      <div className="space-y-1">
        <div className="flex gap-2">
          <Button size="sm" onClick={() => input.current?.click()}>
            {value ? 'Replace' : label}
          </Button>
          {value && (
            <Button size="sm" variant="ghost" icon={<Trash2 className="size-3.5" />} onClick={() => onChange(undefined)}>
              Remove
            </Button>
          )}
        </div>
        <p className="text-xs text-zinc-500">
          {transient ? 'Large file: preview only, it will not survive a page refresh.' : 'Stored locally in your browser. Files under 350 KB persist.'}
        </p>
      </div>
      <input
        ref={input}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={async (e) => {
          const file = e.target.files?.[0]
          e.target.value = ''
          if (!file) return
          if (!file.type.startsWith('image/')) {
            toast({ title: 'Please choose an image file', tone: 'error' })
            return
          }
          const { url, persisted } = await readImage(file)
          setTransient(!persisted)
          onChange(url)
        }}
      />
    </div>
  )
}

/* ---------- RWA identity ---------- */

export function RwaIdentity({ rwa, link, sub }: { rwa: Rwa; link?: string; sub?: ReactNode }) {
  const body = (
    <div className="flex min-w-0 items-center gap-3">
      <Avatar name={rwa.name} src={rwa.logo} square />
      <div className="min-w-0">
        <p className="truncate font-medium text-zinc-900">{rwa.name}</p>
        <p className="truncate text-xs text-zinc-500">{sub ?? `${rwa.city}, ${rwa.state}`}</p>
      </div>
    </div>
  )
  return link ? (
    <Link to={link} onClick={(e) => e.stopPropagation()} className="hover:[&_p:first-child]:text-brand">
      {body}
    </Link>
  ) : (
    body
  )
}

/* ---------- Permission helpers ---------- */

export function useGate() {
  const { can } = useStore()
  return (module: Module, action: Action) => ({
    allowed: can(module, action),
    title: can(module, action) ? undefined : 'Restricted by your role’s permissions (demo)',
  })
}

export function RestrictedHint({ children = 'Some actions are restricted for your current demo role.' }: { children?: ReactNode }) {
  return (
    <span className="inline-flex items-center gap-1.5 text-xs text-zinc-500">
      <Lock className="size-3.5" />
      {children}
    </span>
  )
}

export function AccessDenied({ title = 'You don’t have access to this page', description }: { title?: string; description?: ReactNode }) {
  return (
    <EmptyState
      icon={<ShieldAlert />}
      title={title}
      description={description ?? 'Your current demo role does not include permission to view this area. Switch roles from the top bar to explore it.'}
    />
  )
}

/* ---------- RWA multi-select ---------- */

export function RwaChecklist({ rwas, value, onChange }: { rwas: { id: string; name: string; city: string }[]; value: string[]; onChange: (ids: string[]) => void }) {
  return (
    <div className="thin-scroll max-h-48 space-y-1 overflow-y-auto rounded-lg border border-zinc-200 p-1.5">
      {rwas.map((r) => {
        const checked = value.includes(r.id)
        return (
          <label key={r.id} className={cn('flex cursor-pointer items-center gap-2.5 rounded-md px-2 py-1.5 text-sm', checked ? 'bg-brand-soft' : 'hover:bg-zinc-50')}>
            <input type="checkbox" className="size-4 accent-[var(--brand)]" checked={checked} onChange={() => onChange(checked ? value.filter((x) => x !== r.id) : [...value, r.id])} />
            <span className="flex-1 text-zinc-800">{r.name}</span>
            <span className="text-xs text-zinc-500">{r.city}</span>
          </label>
        )
      })}
    </div>
  )
}
