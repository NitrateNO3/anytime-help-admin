/* eslint-disable react-refresh/only-export-components */
import {
  Bell,
  Building2,
  CreditCard,
  Image,
  Megaphone,
  MessageSquareWarning,
  Settings,
  ShieldCheck,
  UserCog,
  UserPlus,
  type LucideIcon,
} from 'lucide-react'
import { useStore } from '../lib/store'
import type { ActivityLog, ActivityType } from '../lib/types'
import { timeAgo } from '../lib/utils'
import { EmptyState } from './ui'

export const ACTIVITY_META: Record<ActivityType, { label: string; icon: LucideIcon }> = {
  'rwa.created': { label: 'RWA created', icon: Building2 },
  'rwa.updated': { label: 'RWA updated', icon: Building2 },
  'rwa.status': { label: 'RWA status', icon: Building2 },
  'rwa.join_request': { label: 'Join request', icon: Building2 },
  'member.created': { label: 'Member added', icon: UserPlus },
  'member.updated': { label: 'Member updated', icon: UserPlus },
  'staff.created': { label: 'Staff created', icon: UserCog },
  'staff.updated': { label: 'Staff updated', icon: UserCog },
  'complaint.created': { label: 'Complaint raised', icon: MessageSquareWarning },
  'complaint.assigned': { label: 'Complaint assigned', icon: MessageSquareWarning },
  'complaint.status': { label: 'Complaint status', icon: MessageSquareWarning },
  'banner.published': { label: 'Banner published', icon: Image },
  'banner.updated': { label: 'Banner updated', icon: Image },
  'plan.assigned': { label: 'Plan assigned', icon: CreditCard },
  'plan.updated': { label: 'Plan updated', icon: CreditCard },
  'permission.changed': { label: 'Permissions', icon: ShieldCheck },
  'announcement.published': { label: 'Announcement', icon: Megaphone },
  'notification.published': { label: 'Notification', icon: Bell },
  'settings.updated': { label: 'Settings', icon: Settings },
}

export function ActivityFeed({ items }: { items: ActivityLog[] }) {
  const { state } = useStore()
  if (!items.length) return <EmptyState title="No activity yet" description="Actions taken in the demo will appear here." />
  return (
    <ul className="divide-y divide-zinc-100">
      {items.map((a) => {
        const meta = ACTIVITY_META[a.type] ?? ACTIVITY_META['rwa.updated']
        const rwa = state.rwas.find((r) => r.id === a.rwaId)
        return (
          <li key={a.id} className="flex gap-3 px-5 py-3">
            <span className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-lg bg-zinc-100 text-zinc-600">
              <meta.icon className="size-4" />
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-sm text-zinc-800">{a.description}</p>
              <p className="mt-0.5 text-xs text-zinc-500">
                {a.actor}
                {rwa && <> · {rwa.name}</>} · {timeAgo(a.at)}
              </p>
            </div>
          </li>
        )
      })}
    </ul>
  )
}
