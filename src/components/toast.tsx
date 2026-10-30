/* eslint-disable react-refresh/only-export-components */
import { AlertTriangle, CheckCircle2, Info, X } from 'lucide-react'
import { createContext, useCallback, useContext, useState, type ReactNode } from 'react'
import { cn } from '../lib/utils'

type ToastTone = 'success' | 'info' | 'warning' | 'error'
interface ToastItem {
  id: number
  title: string
  description?: string
  tone: ToastTone
}

const ToastContext = createContext<(t: Omit<ToastItem, 'id' | 'tone'> & { tone?: ToastTone }) => void>(() => {})

let counter = 0

export function ToastProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<ToastItem[]>([])

  const dismiss = useCallback((id: number) => setItems((xs) => xs.filter((x) => x.id !== id)), [])
  const push = useCallback(
    (t: Omit<ToastItem, 'id' | 'tone'> & { tone?: ToastTone }) => {
      const id = ++counter
      setItems((xs) => [...xs.slice(-3), { tone: 'success', ...t, id }])
      setTimeout(() => dismiss(id), 4500)
    },
    [dismiss],
  )

  return (
    <ToastContext.Provider value={push}>
      {children}
      <div className="pointer-events-none fixed inset-x-0 bottom-0 z-[60] flex flex-col items-center gap-2 p-4 sm:items-end" aria-live="polite">
        {items.map((t) => {
          const Icon = { success: CheckCircle2, info: Info, warning: AlertTriangle, error: AlertTriangle }[t.tone]
          return (
            <div key={t.id} className="animate-fade-in pointer-events-auto flex w-full max-w-sm items-start gap-3 rounded-xl border border-zinc-200 bg-white p-3.5 shadow-lg">
              <Icon
                className={cn('mt-0.5 size-4.5 shrink-0', {
                  success: 'text-emerald-600',
                  info: 'text-sky-600',
                  warning: 'text-amber-600',
                  error: 'text-red-600',
                }[t.tone])}
              />
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-zinc-900">{t.title}</p>
                {t.description && <p className="mt-0.5 text-[13px] text-zinc-500">{t.description}</p>}
              </div>
              <button aria-label="Dismiss" onClick={() => dismiss(t.id)} className="rounded p-0.5 text-zinc-400 hover:text-zinc-700">
                <X className="size-3.5" />
              </button>
            </div>
          )
        })}
      </div>
    </ToastContext.Provider>
  )
}

export const useToast = () => useContext(ToastContext)
