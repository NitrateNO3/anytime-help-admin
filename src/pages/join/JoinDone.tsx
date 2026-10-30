import { CheckCircle2, Clock } from 'lucide-react'
import { Link, Navigate, useNavigate } from 'react-router-dom'
import { Badge, Button, Notice } from '../../components/ui'
import { useStore } from '../../lib/store'
import { clearJoinDraft, useJoin } from './joinState'

export default function JoinDone() {
  const { state, setSession, session } = useStore()
  const { draft, reset } = useJoin()
  const navigate = useNavigate()
  const result = draft.result
  const rwa = state.rwas.find((r) => r.id === result?.rwaId)
  const plan = state.plans.find((p) => p.id === rwa?.planId)

  if (!result || !rwa) return <Navigate to="/join" replace />
  const purchase = result.mode === 'purchase'

  return (
    <div className="mx-auto max-w-xl px-4 py-16 text-center sm:px-6">
      <span className={`mx-auto flex size-14 items-center justify-center rounded-full ${purchase ? 'bg-emerald-50 text-emerald-600' : 'bg-amber-50 text-amber-600'}`}>
        {purchase ? <CheckCircle2 className="size-7" /> : <Clock className="size-7" />}
      </span>
      <h1 className="mt-5 text-3xl font-semibold tracking-tight text-zinc-900">{purchase ? 'Demo purchase successful' : 'Request submitted'}</h1>
      <p className="mt-3 text-zinc-600">
        {purchase ? (
          <>
            <b>{rwa.name}</b> completed a <b>simulated</b> purchase of the <b>{plan?.name}</b> plan. No payment was taken. The Anytime Help team will activate the society shortly.
          </>
        ) : (
          <>
            Thanks! <b>{rwa.name}</b>’s request for the <b>{plan?.name}</b> plan is now <Badge tone="amber">Pending Approval</Badge>. The Anytime Help team will review it.
          </>
        )}
      </p>
      <div className="mx-auto mt-6 max-w-sm rounded-xl border border-zinc-200 p-4 text-left text-sm">
        <div className="flex justify-between py-1">
          <span className="text-zinc-500">Reference</span>
          <span className="font-mono text-zinc-900">{result.reference}</span>
        </div>
        <div className="flex justify-between py-1">
          <span className="text-zinc-500">Plan</span>
          <span className="text-zinc-900">{plan?.name}</span>
        </div>
        <div className="flex justify-between py-1">
          <span className="text-zinc-500">Status</span>
          <span className="text-zinc-900">{rwa.status === 'Pending' ? 'Awaiting activation' : rwa.status}</span>
        </div>
      </div>
      <Notice className="mt-6 text-left">Demo mode: no confirmation email was sent. Continue as the Super Admin to approve this request.</Notice>
      <div className="mt-6 flex flex-col justify-center gap-2 sm:flex-row">
        <Button
          variant="primary"
          onClick={() => {
            clearJoinDraft()
            setSession({ ...session, role: 'super_admin' })
            navigate('/admin/rwas?status=Pending')
          }}
        >
          Review as Super Admin
        </Button>
        <Link to="/join" onClick={reset} className="inline-flex h-9 items-center justify-center rounded-lg border border-zinc-200 px-4 text-sm font-medium text-zinc-800 hover:bg-zinc-50">
          Back to start
        </Link>
      </div>
    </div>
  )
}
