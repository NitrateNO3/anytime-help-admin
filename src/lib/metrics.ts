import { isOpenComplaint, residentCount } from './store'
import { COMPLAINT_STATUSES, type Banner, type DemoState } from './types'
import { lastNMonths } from './utils'

export function platformMetrics(s: DemoState) {
  const now = Date.now()
  const live = s.banners.filter((b) => b.status === 'Published' && new Date(b.startDate).getTime() <= now && new Date(b.endDate).getTime() >= now)
  return {
    totalRwas: s.rwas.filter((r) => r.status !== 'Deactivated').length,
    active: s.rwas.filter((r) => r.status === 'Active').length,
    pending: s.rwas.filter((r) => r.status === 'Pending').length,
    suspended: s.rwas.filter((r) => r.status === 'Suspended').length,
    trial: s.rwas.filter((r) => r.status === 'Trial').length,
    residents: residentCount(s.members),
    staff: s.staff.filter((x) => x.status === 'Active').length,
    openComplaints: s.complaints.filter(isOpenComplaint).length,
    activeBanners: live.length,
  }
}

/** Cumulative count of records created up to the end of each of the last N months. */
export function cumulativeByMonth<T extends { createdAt: string }>(items: T[], months: number) {
  const times = items.map((i) => new Date(i.createdAt).getTime())
  return lastNMonths(months).map((m) => ({
    month: m.label,
    value: times.filter((t) => t <= m.end.getTime()).length,
  }))
}

/** Count of records created within each of the last N months. */
export function perMonth<T extends { createdAt: string }>(items: T[], months: number) {
  const buckets = lastNMonths(months)
  return buckets.map((m, i) => {
    const start = i === 0 ? new Date(m.end.getFullYear(), m.end.getMonth(), 1).getTime() : buckets[i - 1].end.getTime()
    return {
      month: m.label,
      value: items.filter((x) => {
        const t = new Date(x.createdAt).getTime()
        return t > start && t <= m.end.getTime()
      }).length,
    }
  })
}

export function complaintStatusData(complaints: DemoState['complaints']) {
  return COMPLAINT_STATUSES.map((status) => ({ status, value: complaints.filter((c) => c.status === status).length }))
}

export function residentsBySociety(s: DemoState) {
  return s.rwas
    .filter((r) => r.status !== 'Deactivated')
    .map((r) => ({ name: r.name.replace(/ (Residency|Society|Heights|Enclave|Park)$/, ''), fullName: r.name, value: residentCount(s.members, r.id) }))
    .sort((a, b) => b.value - a.value)
}

/** Platform banners visible to a society right now. */
export function liveBannersFor(banners: Banner[], rwaId: string) {
  const now = Date.now()
  return banners
    .filter(
      (b) =>
        b.status === 'Published' &&
        new Date(b.startDate).getTime() <= now &&
        new Date(b.endDate).getTime() >= now &&
        (b.targeting === 'all' || b.rwaIds.includes(rwaId)),
    )
    .sort((a, b) => a.priority - b.priority)
}

export type Range = '3' | '6' | '12'
export const RANGE_OPTIONS = [
  { value: '3' as Range, label: '3 months' },
  { value: '6' as Range, label: '6 months' },
  { value: '12' as Range, label: '12 months' },
]
