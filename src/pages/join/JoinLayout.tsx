import { FlaskConical } from 'lucide-react'
import { Suspense, useEffect, useState } from 'react'
import { Link, NavLink, Outlet, useLocation } from 'react-router-dom'
import { emptyDraft } from '../../components/rwaFields'
import { PageSkeleton } from '../../components/ui'
import { useStore } from '../../lib/store'
import { cn } from '../../lib/utils'
import { JOIN_DRAFT_KEY as KEY, type JoinContext, type JoinDraft } from './joinState'

function loadDraft(): JoinDraft {
  try {
    const d = JSON.parse(sessionStorage.getItem(KEY) ?? 'null') as JoinDraft | null
    if (d && d.rwa) return d
  } catch {
    /* ignore */
  }
  return { planId: '', rwa: emptyDraft() }
}

export default function JoinLayout() {
  const { state } = useStore()
  const [draft, setDraft] = useState<JoinDraft>(loadDraft)
  const location = useLocation()

  useEffect(() => {
    try {
      // Logos can be large; keep the draft small by not persisting them across reloads.
      sessionStorage.setItem(KEY, JSON.stringify({ ...draft, rwa: { ...draft.rwa, logo: undefined } }))
    } catch {
      /* ignore */
    }
  }, [draft])

  useEffect(() => window.scrollTo(0, 0), [location.pathname])

  const ctx: JoinContext = { draft, setDraft, reset: () => setDraft({ planId: '', rwa: emptyDraft() }) }
  const { platformName, logo } = state.settings

  return (
    <div className="min-h-screen bg-white">
      <div className="flex items-center justify-center gap-2 bg-amber-50 px-4 py-2 text-center text-[13px] text-amber-900">
        <FlaskConical className="size-4 shrink-0" />
        Demo prototype — no real payments, accounts or emails. Prices are illustrative.
      </div>
      <header className="sticky top-0 z-20 border-b border-zinc-100 bg-white/90 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-6xl items-center gap-4 px-4 sm:px-6">
          <Link to="/join" className="flex items-center gap-2.5">
            {logo ? (
              <img src={logo} alt="" className="size-8 rounded-lg object-cover" />
            ) : (
              <span className="flex size-8 items-center justify-center rounded-lg bg-brand text-sm font-bold text-white">{platformName[0]}</span>
            )}
            <span className="font-semibold tracking-tight text-zinc-900">{platformName}</span>
          </Link>
          <nav className="ml-auto flex items-center gap-1 text-sm">
            <NavLink to="/join/plans" className={({ isActive }) => cn('hidden rounded-lg px-3 py-2 font-medium sm:block', isActive ? 'text-brand' : 'text-zinc-600 hover:text-zinc-900')}>
              Plans
            </NavLink>
            <Link to="/admin" className="rounded-lg px-3 py-2 text-zinc-500 hover:text-zinc-900">
              Admin demo
            </Link>
            <Link to="/join/plans" className="rounded-lg bg-brand px-3.5 py-2 font-medium text-white hover:bg-brand-dark">
              Join
            </Link>
          </nav>
        </div>
      </header>
      <main>
        <Suspense fallback={<div className="mx-auto max-w-6xl p-6"><PageSkeleton /></div>}>
          <Outlet context={ctx} />
        </Suspense>
      </main>
      <footer className="border-t border-zinc-100 py-8 text-center text-[13px] text-zinc-500">
        {platformName} · {state.settings.supportEmail} · Demo environment
      </footer>
    </div>
  )
}
