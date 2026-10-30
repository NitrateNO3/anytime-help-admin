import { Check } from 'lucide-react'
import type { ReactNode } from 'react'
import type { Plan } from '../lib/types'
import { cn, formatINR } from '../lib/utils'
import { Badge } from './ui'

export function PlanCards({
  plans,
  selectedId,
  onSelect,
  renderAction,
}: {
  plans: Plan[]
  selectedId?: string
  onSelect?: (id: string) => void
  renderAction?: (p: Plan) => ReactNode
}) {
  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
      {plans.map((p) => {
        const selected = p.id === selectedId
        return (
          <div
            key={p.id}
            role={onSelect ? 'button' : undefined}
            tabIndex={onSelect ? 0 : undefined}
            onClick={() => onSelect?.(p.id)}
            onKeyDown={(e) => onSelect && (e.key === 'Enter' || e.key === ' ') && (e.preventDefault(), onSelect(p.id))}
            className={cn(
              'relative flex flex-col rounded-2xl border bg-white p-5 text-left transition',
              onSelect && 'cursor-pointer hover:border-zinc-300',
              selected ? 'border-brand ring-2 ring-brand/30' : p.popular ? 'border-brand/40' : 'border-zinc-200',
            )}
          >
            <div className="flex items-center justify-between gap-2">
              <h3 className="text-base font-semibold text-zinc-900">{p.name}</h3>
              {p.popular && <Badge tone="brand">Most popular</Badge>}
              {selected && !p.popular && <Badge tone="green">Selected</Badge>}
            </div>
            <p className="mt-1 text-[13px] text-zinc-500">{p.tagline}</p>
            <div className="mt-4 flex items-baseline gap-1">
              <span className="text-3xl font-semibold tracking-tight text-zinc-900">{formatINR(p.price)}</span>
              <span className="text-sm text-zinc-500">/{p.period}</span>
            </div>
            <p className="mt-1 text-[11px] font-medium tracking-wide text-amber-700 uppercase">Illustrative price</p>
            <p className="mt-3 text-xs text-zinc-500">
              Up to {p.residentLimit.toLocaleString()} residents · {p.staffLimit} staff
            </p>
            <ul className="mt-4 flex-1 space-y-2">
              {p.highlights.map((h) => (
                <li key={h} className="flex gap-2 text-[13px] text-zinc-700">
                  <Check className="mt-0.5 size-4 shrink-0 text-brand" />
                  {h}
                </li>
              ))}
            </ul>
            {renderAction && <div className="mt-5">{renderAction(p)}</div>}
          </div>
        )
      })}
    </div>
  )
}
