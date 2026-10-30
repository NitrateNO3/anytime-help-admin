import { Check } from 'lucide-react'
import { cn } from '../../lib/utils'

const STEPS = ['Choose plan', 'Society details', 'Review & confirm']

export function JoinSteps({ current }: { current: 0 | 1 | 2 }) {
  return (
    <ol className="mb-8 flex flex-wrap items-center gap-2 text-[13px] sm:gap-3">
      {STEPS.map((label, i) => (
        <li key={label} className="flex items-center gap-2">
          <span
            className={cn(
              'flex size-6 items-center justify-center rounded-full text-xs font-semibold',
              i < current ? 'bg-emerald-100 text-emerald-700' : i === current ? 'bg-brand text-white' : 'bg-zinc-100 text-zinc-500',
            )}
          >
            {i < current ? <Check className="size-3.5" /> : i + 1}
          </span>
          <span className={i === current ? 'font-medium text-zinc-900' : 'text-zinc-500'}>{label}</span>
          {i < STEPS.length - 1 && <span className="mx-1 hidden h-px w-8 bg-zinc-200 sm:block" />}
        </li>
      ))}
    </ol>
  )
}
