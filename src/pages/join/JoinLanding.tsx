import { ArrowRight, BarChart3, Building2, Megaphone, MessageSquareWarning, ShieldCheck, Users } from 'lucide-react'
import { Link } from 'react-router-dom'
import { useStore } from '../../lib/store'

const FEATURES = [
  { icon: Users, title: 'Residents & staff', text: 'Keep every flat, family and staff member organised in one place.' },
  { icon: MessageSquareWarning, title: 'Complaint tracking', text: 'Residents raise issues, you assign staff and track them to resolution.' },
  { icon: Megaphone, title: 'Announcements', text: 'Share notices, events and maintenance updates with the whole society.' },
  { icon: BarChart3, title: 'Society analytics', text: 'See complaint trends, response times and growth at a glance.' },
  { icon: ShieldCheck, title: 'Role-based access', text: 'Presidents, staff managers and residents each see what they need.' },
  { icon: Building2, title: 'Built for RWAs', text: 'From a single tower to a multi-phase township.' },
]

export default function JoinLanding() {
  const { state } = useStore()
  const societies = state.rwas.filter((r) => r.status === 'Active' || r.status === 'Trial').length
  return (
    <>
      <section className="mx-auto max-w-6xl px-4 pt-12 pb-12 text-center sm:px-6 sm:pt-16">
        {!state.settings.logo && <img src="/logo.png" alt={state.settings.platformName} className="mx-auto mb-8 h-40 w-auto object-contain sm:h-52" />}
        <p className="mx-auto inline-flex items-center gap-2 rounded-full border border-zinc-200 px-3 py-1 text-[13px] text-zinc-600">
          <span className="size-1.5 rounded-full bg-emerald-500" /> {societies} societies already on {state.settings.platformName} (demo data)
        </p>
        <h1 className="mx-auto mt-6 max-w-3xl text-4xl font-semibold tracking-tight text-zinc-900 sm:text-5xl">Run your residential society from one calm, simple workspace.</h1>
        <p className="mx-auto mt-5 max-w-2xl text-lg text-zinc-600">
          {state.settings.platformName} helps RWAs manage residents, staff, complaints and announcements — while the {state.settings.platformName} team supports you centrally.
        </p>
        <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
          <Link to="/join/plans" className="inline-flex h-11 items-center justify-center gap-2 rounded-lg bg-brand px-6 font-medium text-white shadow-sm hover:bg-brand-dark">
            Join {state.settings.platformName} <ArrowRight className="size-4" />
          </Link>
          <Link to="/join/plans" className="inline-flex h-11 items-center justify-center rounded-lg border border-zinc-200 px-6 font-medium text-zinc-800 hover:bg-zinc-50">
            Compare plans
          </Link>
        </div>
      </section>
      <section className="mx-auto grid grid-cols-1 max-w-6xl gap-4 px-4 pb-20 sm:grid-cols-2 sm:px-6 lg:grid-cols-3">
        {FEATURES.map((f) => (
          <div key={f.title} className="rounded-2xl border border-zinc-200 bg-white p-6">
            <span className="flex size-10 items-center justify-center rounded-xl bg-brand-soft text-brand">
              <f.icon className="size-5" />
            </span>
            <h3 className="mt-4 font-semibold text-zinc-900">{f.title}</h3>
            <p className="mt-1 text-sm text-zinc-600">{f.text}</p>
          </div>
        ))}
      </section>
    </>
  )
}
