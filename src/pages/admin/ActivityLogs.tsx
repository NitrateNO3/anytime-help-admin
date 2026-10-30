import { Download } from 'lucide-react'
import { useState } from 'react'
import { ACTIVITY_META } from '../../components/activity'
import { Badge, Button, Card, DataTable, EmptyState, FilterBar, Notice, PageHeader, SearchInput, Select, type Column } from '../../components/ui'
import { useStore } from '../../lib/store'
import { ROLE_LABELS, type ActivityLog, type ActivityType, type Role } from '../../lib/types'
import { downloadText, formatDateTime } from '../../lib/utils'
import { RwaFilterSelect } from '../modules/scope'

export default function ActivityLogs() {
  const { state } = useStore()
  const [q, setQ] = useState('')
  const [type, setType] = useState<'all' | ActivityType>('all')
  const [role, setRole] = useState<'all' | Role>('all')
  const [rwa, setRwa] = useState('all')
  const rwaName = (id?: string) => state.rwas.find((r) => r.id === id)?.name

  const needle = q.trim().toLowerCase()
  const rows = state.activity.filter(
    (a) =>
      (type === 'all' || a.type === type) &&
      (role === 'all' || a.role === role) &&
      (rwa === 'all' || a.rwaId === rwa) &&
      (!needle || `${a.description} ${a.actor}`.toLowerCase().includes(needle)),
  )

  const columns: Column<ActivityLog>[] = [
    {
      key: 'activity',
      header: 'Activity',
      render: (a) => {
        const M = ACTIVITY_META[a.type]
        return (
          <span className="flex items-center gap-2 whitespace-nowrap">
            <M.icon className="size-4 text-zinc-500" />
            {M.label}
          </span>
        )
      },
    },
    { key: 'desc', header: 'Description', className: 'min-w-72', render: (a) => <span className="text-zinc-800">{a.description}</span> },
    { key: 'actor', header: 'Actor', render: (a) => <span className="whitespace-nowrap">{a.actor}</span> },
    { key: 'role', header: 'Role', render: (a) => <Badge>{ROLE_LABELS[a.role] ?? a.role}</Badge> },
    { key: 'rwa', header: 'Affected RWA', render: (a) => <span className="whitespace-nowrap">{rwaName(a.rwaId) ?? <span className="text-zinc-400">Platform</span>}</span> },
    { key: 'at', header: 'Timestamp', render: (a) => <span className="whitespace-nowrap text-zinc-500">{formatDateTime(a.at)}</span> },
  ]

  const exportCsv = () => {
    const esc = (v: string) => `"${v.replace(/"/g, '""')}"`
    const lines = rows.map((a) => [ACTIVITY_META[a.type].label, a.description, a.actor, ROLE_LABELS[a.role], rwaName(a.rwaId) ?? 'Platform', a.at].map(esc).join(','))
    downloadText('activity-log.csv', ['Activity,Description,Actor,Role,Affected RWA,Timestamp', ...lines].join('\n'))
  }

  return (
    <>
      <PageHeader
        title="Activity Logs"
        description="Every demo action recorded in this browser."
        actions={
          <Button icon={<Download className="size-4" />} onClick={exportCsv} disabled={!rows.length}>
            Export CSV
          </Button>
        }
      />
      <Notice tone="warning" className="mb-4">
        Simulated activity log stored in localStorage. It is not a tamper-proof security audit system.
      </Notice>
      <Card>
        <FilterBar>
          <SearchInput value={q} onChange={setQ} placeholder="Search description or actor" />
          <div className="grid grid-cols-1 gap-2 sm:ml-auto sm:flex">
            <Select aria-label="Activity type" value={type} onChange={(e) => setType(e.target.value as typeof type)} className="sm:w-44">
              <option value="all">All activity</option>
              {(Object.keys(ACTIVITY_META) as ActivityType[]).map((t) => (
                <option key={t} value={t}>
                  {ACTIVITY_META[t].label}
                </option>
              ))}
            </Select>
            <Select aria-label="Role" value={role} onChange={(e) => setRole(e.target.value as typeof role)} className="sm:w-44">
              <option value="all">All roles</option>
              {(Object.keys(ROLE_LABELS) as Role[]).map((r) => (
                <option key={r} value={r}>
                  {ROLE_LABELS[r]}
                </option>
              ))}
            </Select>
            <RwaFilterSelect value={rwa} onChange={setRwa} />
          </div>
        </FilterBar>
        <DataTable columns={columns} rows={rows} pageSize={15} empty={<EmptyState title="No matching activity" />} />
      </Card>
    </>
  )
}
