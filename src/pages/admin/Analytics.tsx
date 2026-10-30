import { Download } from 'lucide-react'
import { useState } from 'react'
import { Bar, BarChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { CountBars, TrendArea } from '../../components/charts'
import { AXIS_PROPS, CHART_COLORS, ChartCard, GRID_PROPS, tooltipStyle } from '../../components/shared'
import { Button, MetricCard, PageHeader, Segmented } from '../../components/ui'
import { complaintStatusData, cumulativeByMonth, perMonth, RANGE_OPTIONS, type Range } from '../../lib/metrics'
import { isOpenComplaint, residentCount, useStore } from '../../lib/store'
import { downloadText } from '../../lib/utils'
import { RwaFilterSelect } from '../modules/scope'


export default function Analytics() {
  const { state } = useStore()
  const [range, setRange] = useState<Range>('12')
  const [rwaFilter, setRwaFilter] = useState('all')
  const months = Number(range)
  const since = new Date()
  since.setMonth(since.getMonth() - months + 1, 1)
  since.setHours(0, 0, 0, 0)

  const inRwa = (id: string) => rwaFilter === 'all' || id === rwaFilter
  const rwas = state.rwas.filter((r) => r.status !== 'Deactivated' && inRwa(r.id))
  const members = state.members.filter((m) => m.status !== 'Rejected' && inRwa(m.rwaId))
  const complaints = state.complaints.filter((c) => inRwa(c.rwaId))
  const complaintsInRange = complaints.filter((c) => new Date(c.createdAt) >= since)
  const resolvedInRange = complaintsInRange.filter((c) => !isOpenComplaint(c)).length

  const statusData = (['Active', 'Trial', 'Pending', 'Suspended', 'Deactivated'] as const).map((s) => ({
    name: s,
    value: state.rwas.filter((r) => r.status === s && inRwa(r.id)).length,
  }))

  const distribution = rwas.map((r) => ({
    name: r.name.split(' ')[0],
    Residents: residentCount(state.members, r.id),
    Staff: state.staff.filter((s) => s.rwaId === r.id && s.status === 'Active').length,
  }))

  const exportReport = () => {
    const header = 'Society,City,Status,Plan,Residents,Active staff,Complaints,Open complaints,Published announcements'
    const lines = rwas.map((r) =>
      [
        r.name,
        r.city,
        r.status,
        state.plans.find((p) => p.id === r.planId)?.name ?? '',
        residentCount(state.members, r.id),
        state.staff.filter((s) => s.rwaId === r.id && s.status === 'Active').length,
        state.complaints.filter((c) => c.rwaId === r.id).length,
        state.complaints.filter((c) => c.rwaId === r.id && isOpenComplaint(c)).length,
        state.announcements.filter((a) => a.rwaId === r.id && a.status === 'Published').length,
      ]
        .map((v) => `"${String(v).replace(/"/g, '""')}"`)
        .join(','),
    )
    downloadText(`society-report-${new Date().toISOString().slice(0, 10)}.csv`, [header, ...lines].join('\n'))
  }

  return (
    <>
      <PageHeader
        title="Analytics & Reports"
        description="Platform trends computed live from the demo data."
        actions={
          <Button icon={<Download className="size-4" />} onClick={exportReport}>
            Export society report
          </Button>
        }
      />
      <div className="mb-5 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <Segmented value={range} onChange={setRange} options={RANGE_OPTIONS} />
        <RwaFilterSelect value={rwaFilter} onChange={setRwaFilter} />
      </div>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <MetricCard label="Societies" value={rwas.length} hint={`${rwas.filter((r) => r.status === 'Active').length} active`} />
        <MetricCard label="Residents" value={members.length} hint={`+${members.filter((m) => new Date(m.createdAt) >= since).length} in range`} />
        <MetricCard label="Complaints in range" value={complaintsInRange.length} hint={`${complaints.filter(isOpenComplaint).length} open overall`} />
        <MetricCard
          label="Resolution rate"
          value={complaintsInRange.length ? `${Math.round((resolvedInRange / complaintsInRange.length) * 100)}%` : '—'}
          hint="Resolved or closed, in range"
          tone="success"
        />
      </div>

      <div className="mt-5 grid grid-cols-1 gap-4 lg:grid-cols-2">
        <ChartCard title="RWA growth" description="Cumulative societies onboarded">
          <TrendArea data={cumulativeByMonth(rwas, months)} name="RWAs" />
        </ChartCard>
        <ChartCard title="Resident growth" description="Cumulative registered residents">
          <TrendArea data={cumulativeByMonth(members, months)} name="Residents" />
        </ChartCard>
        <ChartCard title="Complaint volume" description="New complaints per month">
          <CountBars data={perMonth(complaints, months)} dataKey="month" name="Complaints" />
        </ChartCard>
        <ChartCard title="Complaint resolution" description="Current status of complaints raised in range">
          <CountBars data={complaintStatusData(complaintsInRange)} dataKey="status" name="Complaints" horizontal />
        </ChartCard>
        <ChartCard title="Active vs inactive societies" description="Account status across RWAs">
          <CountBars data={statusData} name="Societies" horizontal />
        </ChartCard>
        <ChartCard title="Users by society" description="Residents and active staff per RWA">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={distribution} margin={{ top: 8, right: 8, left: -18, bottom: 0 }} barGap={2}>
              <CartesianGrid {...GRID_PROPS} />
              <XAxis dataKey="name" {...AXIS_PROPS} interval={0} />
              <YAxis allowDecimals={false} {...AXIS_PROPS} />
              <Tooltip {...tooltipStyle} cursor={{ fill: '#f4f4f5' }} />
              <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 12, color: '#52525b' }} />
              <Bar dataKey="Residents" fill={CHART_COLORS[0]} radius={[4, 4, 0, 0]} maxBarSize={28} />
              <Bar dataKey="Staff" fill={CHART_COLORS[1]} radius={[4, 4, 0, 0]} maxBarSize={28} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>
    </>
  )
}
