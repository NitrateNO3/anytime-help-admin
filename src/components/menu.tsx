import { MoreHorizontal } from 'lucide-react'
import { useEffect, useLayoutEffect, useRef, useState, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { cn } from '../lib/utils'

export interface MenuItem {
  label: string
  icon?: ReactNode
  onClick: () => void
  danger?: boolean
  disabled?: boolean
  hidden?: boolean
  divider?: boolean
}

/** Row action menu rendered in a portal so table scroll containers don't clip it. */
export function ActionMenu({ items, label = 'Actions' }: { items: MenuItem[]; label?: string }) {
  const [open, setOpen] = useState(false)
  const [pos, setPos] = useState({ top: 0, left: 0 })
  const btn = useRef<HTMLButtonElement>(null)
  const menu = useRef<HTMLDivElement>(null)

  useLayoutEffect(() => {
    if (!open || !btn.current || !menu.current) return
    const r = btn.current.getBoundingClientRect()
    const m = menu.current.getBoundingClientRect()
    const top = r.bottom + m.height + 8 > window.innerHeight ? r.top - m.height - 4 : r.bottom + 4
    setPos({ top: Math.max(8, top), left: Math.max(8, Math.min(r.right - m.width, window.innerWidth - m.width - 8)) })
  }, [open])

  useEffect(() => {
    if (!open) return
    const close = (e: Event) => {
      if (menu.current?.contains(e.target as Node) || btn.current?.contains(e.target as Node)) return
      setOpen(false)
    }
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false)
    const onScroll = () => setOpen(false)
    document.addEventListener('mousedown', close)
    document.addEventListener('keydown', onKey)
    window.addEventListener('scroll', onScroll, true)
    return () => {
      document.removeEventListener('mousedown', close)
      document.removeEventListener('keydown', onKey)
      window.removeEventListener('scroll', onScroll, true)
    }
  }, [open])

  const visible = items.filter((i) => !i.hidden)

  return (
    <>
      <button
        ref={btn}
        type="button"
        aria-label={label}
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={(e) => {
          e.stopPropagation()
          setOpen((o) => !o)
        }}
        className="inline-flex size-8 items-center justify-center rounded-lg text-zinc-500 hover:bg-zinc-100 hover:text-zinc-900"
      >
        <MoreHorizontal className="size-4" />
      </button>
      {open &&
        createPortal(
          <div
            ref={menu}
            role="menu"
            style={{ top: pos.top, left: pos.left }}
            className="animate-fade-in fixed z-[55] min-w-48 rounded-xl border border-zinc-200 bg-white p-1 shadow-lg"
            onClick={(e) => e.stopPropagation()}
          >
            {visible.map((item, i) => (
              <div key={item.label}>
                {item.divider && i > 0 && <div className="my-1 h-px bg-zinc-100" />}
                <button
                  role="menuitem"
                  disabled={item.disabled}
                  title={item.disabled ? 'Restricted by your role’s permissions (demo)' : undefined}
                  onClick={() => {
                    setOpen(false)
                    item.onClick()
                  }}
                  className={cn(
                    'flex w-full items-center gap-2.5 rounded-lg px-2.5 py-1.5 text-left text-[13px] disabled:cursor-not-allowed disabled:opacity-40 [&>svg]:size-4',
                    item.danger ? 'text-red-600 hover:bg-red-50' : 'text-zinc-700 hover:bg-zinc-100',
                  )}
                >
                  {item.icon}
                  {item.label}
                </button>
              </div>
            ))}
          </div>,
          document.body,
        )}
    </>
  )
}
