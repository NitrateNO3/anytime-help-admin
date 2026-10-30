/* eslint-disable react-refresh/only-export-components */
import { useState } from 'react'
import { Select } from '../../components/ui'
import { useStore } from '../../lib/store'

export interface ModuleProps {
  /** Fixed society scope (RWA portal or RWA detail tab). */
  scopeRwaId?: string
  /** Initial society filter for Super Admin pages (from ?rwa=). */
  initialRwaFilter?: string
  /** Inspection mode: no create/edit controls. */
  readOnly?: boolean
  /** Rendered inside another page; hides the page header. */
  embedded?: boolean
}

export function useModuleScope({ scopeRwaId, initialRwaFilter }: ModuleProps) {
  const { state } = useStore()
  const [filter, setFilter] = useState(initialRwaFilter ?? 'all')
  const rwaFilter = scopeRwaId ?? filter
  const scopedRwa = state.rwas.find((r) => r.id === (scopeRwaId ?? (filter !== 'all' ? filter : undefined)))
  return {
    isScoped: !!scopeRwaId,
    rwaFilter,
    setRwaFilter: setFilter,
    /** The society new records are created in, if one is selected. */
    targetRwa: scopedRwa,
    inScope: (rwaId: string) => rwaFilter === 'all' || rwaId === rwaFilter,
    rwaName: (id: string) => state.rwas.find((r) => r.id === id)?.name ?? '—',
  }
}

export function RwaFilterSelect({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const { state } = useStore()
  return (
    <Select aria-label="Filter by RWA" value={value} onChange={(e) => onChange(e.target.value)} className="sm:w-52">
      <option value="all">All societies</option>
      {state.rwas
        .filter((r) => r.status !== 'Deactivated')
        .map((r) => (
          <option key={r.id} value={r.id}>
            {r.name}
          </option>
        ))}
    </Select>
  )
}

export function RwaSelectField({ id, value, onChange, invalid }: { id: string; value: string; onChange: (v: string) => void; invalid?: boolean }) {
  const { state } = useStore()
  return (
    <Select id={id} value={value} onChange={(e) => onChange(e.target.value)} invalid={invalid}>
      <option value="">Select a society…</option>
      {state.rwas
        .filter((r) => r.status !== 'Deactivated')
        .map((r) => (
          <option key={r.id} value={r.id}>
            {r.name} — {r.city}
          </option>
        ))}
    </Select>
  )
}
