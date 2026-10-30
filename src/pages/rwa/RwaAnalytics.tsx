import { BarChart3, CheckCircle2, Clock, Megaphone, MessageSquareWarning, UserCog, Users } from 'lucide-react'
import { useState } from 'react'
import { useParams } from 'react-router-dom'
import { CountBars, TrendArea } from '../../components/charts'
import { useFeature } from '../../components/layout'
import { AccessDenied, ChartCard, useGate } from '../../components/shared'
import { EmptyState, MetricCard, PageHeader, Segmented } from '../../components/ui'
import { complaintStatusData, cumulativeByMonth, perMonth, RANGE_OPTIONS, type Range } from '../../lib/metrics'
import { isOpenComplaint, residentCount, useStore } from '../../lib/store'
import { COMPLAINT_CATEGORIES } from '../../lib/types'

export default function RwaAnalytics() {
  const { rwaId = '' } = useParams()
  const { state } = useStore()
  const gate = useGate()
  const hasFeature = useFeature()
  const [range, setRange] = useState<Range>('6')

  if (!gate('analytics', 'view').allowed) return <AccessDenied />
  if (!hasFeature(rwaId, 'analytics'))
    return <EmptyState icon={<BarChart3 />} title="Analytics isn’t included in this society’s plan" description="Ask Anytime Help to upgrade to Professional or Enterprise to unlock society analytics." />

  const months = Number(range)
  const since = new Date()
  since.setMonth(since.getMonth() - months + 1, 1)
  since.setHours(0, 0, 0, 0)

  const complaints = state.complaints.filter((c) => c.rwaId === rwaId)
  const inRange = complaints.filter((c) => new Date(c.createdAt) >= since)
  const announcements = state.announcements.filter((a) => a.rwaId === rwaId && a.status === 'Published')

  return (
    <>
      <PageHeader title="Society analytics" description="Live figures for this society, computed from its own records only." actions={<Segmented value={range} onChange={setRange} options={RANGE_OPTIONS} />} />
      <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-6">
        <MetricCard label="Residents" value={residentCount(state.members, rwaId)} icon={<Users />} />
        <MetricCard label="Active staff" value={state.staff.filter((s) => s.rwaId === rwaId && s.status === 'Active').length} icon={<UserCog />} />
        <MetricCard label="Complaints" value={inRange.length} icon={<MessageSquareWarning />} hint="In selected range" />
        <MetricCard label="Resolved" value={inRange.filter((c) => !isOpenComplaint(c)).length} icon={<CheckCircle2 />} tone="success" hint="In selected range" />
        <MetricCard label="Pending" value={complaints.filter(isOpenComplaint).length} icon={<Clock />} tone="warning" hint="All open" />
        <MetricCard label="Announcements" value={announcements.filter((a) => new Date(a.publishedAt ?? a.createdAt) >= since).length} icon={<Megaphone />} hint="Published in range" />
      </div>
      <div className="mt-5 grid grid-cols-1 gap-4 lg:grid-cols-2">
        <ChartCard title="Complaint volume" description="New complaints per month">
          <CountBars data={perMonth(complaints, months)} dataKey="month" name="Complaints" />
        </ChartCard>
        <ChartCard title="Complaint status" description="Complaints raised in range">
          <CountBars data={complaintStatusData(inRange)} dataKey="status" name="Complaints" horizontal />
        </ChartCard>
        <ChartCard title="Complaints by category" description="Complaints raised in range">
          <CountBars data={COMPLAINT_CATEGORIES.map((c) => ({ name: c, value: inRange.filter((x) => x.category === c).length }))} name="Complaints" horizontal />
        </ChartCard>
        <ChartCard title="Resident growth" description="Cumulative registered residents">
          <TrendArea data={cumulativeByMonth(state.members.filter((m) => m.rwaId === rwaId && m.status !== 'Rejected'), months)} name="Residents" />
        </ChartCard>
        <ChartCard title="Announcement activity" description="Announcements published per month" className="lg:col-span-2">
          <CountBars data={perMonth(announcements.map((a) => ({ createdAt: a.publishedAt ?? a.createdAt })), months)} dataKey="month" name="Announcements" />
        </ChartCard>
      </div>
    </>
  )
}
