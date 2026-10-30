import { ClipboardCheck, CreditCard, FlaskConical } from 'lucide-react'
import { useState } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'
import { draftToRwaFields, validateDraft } from '../../components/rwaFields'
import { Badge, Button, Card, CardHeader, DefinitionList, Notice } from '../../components/ui'
import { useStore } from '../../lib/store'
import { cn, formatINR } from '../../lib/utils'
import { useJoin } from './joinState'
import { JoinSteps } from './JoinSteps'

export default function JoinCheckout() {
  const { state, createRwa } = useStore()
  const { draft, setDraft } = useJoin()
  const navigate = useNavigate()
  const [mode, setMode] = useState<'approval' | 'purchase'>('approval')
  const [processing, setProcessing] = useState(false)
  const plan = state.plans.find((p) => p.id === draft.planId)

  if (!plan) return <Navigate to="/join/plans" replace />
  if (Object.keys(validateDraft(draft.rwa)).length) return <Navigate to="/join/register" replace />

  const r = draft.rwa
  const submit = () => {
    setProcessing(true)
    // Simulated latency only — nothing leaves the browser.
    setTimeout(
      () => {
        const now = new Date().toISOString()
        const rwa = createRwa({
          ...draftToRwaFields(r),
          planId: plan.id,
          status: 'Pending',
          source: 'join',
          joinRequest: { mode, submittedAt: now, demoPurchaseSucceeded: mode === 'purchase' ? true : undefined },
        })
        setDraft({ ...draft, result: { rwaId: rwa.id, mode, reference: `AH-${rwa.id.slice(-6).toUpperCase()}` } })
        navigate('/join/done')
      },
      mode === 'purchase' ? 1400 : 600,
    )
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-12 sm:px-6">
      <JoinSteps current={2} />
      <h1 className="text-3xl font-semibold tracking-tight text-zinc-900">Review & confirm</h1>
      <p className="mt-2 text-zinc-600">Choose how you’d like to proceed. Both options are simulations for this prototype.</p>

      <div className="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-[1fr_22rem]">
        <div className="space-y-5">
          <Card>
            <CardHeader title="Your society" action={<Button size="sm" variant="ghost" onClick={() => navigate('/join/register')}>Edit</Button>} />
            <div className="p-5">
              <DefinitionList
                items={[
                  { label: 'Society', value: r.name },
                  { label: 'Units', value: r.units },
                  { label: 'Address', value: `${r.address}, ${r.city}, ${r.state} ${r.pin}` },
                  { label: 'President', value: r.presidentName },
                  { label: 'Administrator', value: `${r.adminName} · ${r.adminEmail}` },
                  { label: 'Phone', value: r.adminPhone },
                ]}
              />
            </div>
          </Card>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {[
              { value: 'approval' as const, icon: ClipboardCheck, title: 'Submit for approval', text: 'The Anytime Help team reviews your request and activates your society.' },
              { value: 'purchase' as const, icon: CreditCard, title: 'Simulate purchase', text: 'Walk through a demo checkout. No card details are collected and no money moves.' },
            ].map((o) => (
              <button
                key={o.value}
                type="button"
                onClick={() => setMode(o.value)}
                className={cn('rounded-2xl border p-5 text-left transition', mode === o.value ? 'border-brand bg-brand-soft/50 ring-2 ring-brand/30' : 'border-zinc-200 hover:border-zinc-300')}
              >
                <o.icon className={cn('size-5', mode === o.value ? 'text-brand' : 'text-zinc-500')} />
                <p className="mt-3 font-semibold text-zinc-900">{o.title}</p>
                <p className="mt-1 text-sm text-zinc-600">{o.text}</p>
              </button>
            ))}
          </div>

          {mode === 'purchase' && (
            <Card className="border-dashed border-amber-300 bg-amber-50/40">
              <div className="flex gap-3 p-5">
                <FlaskConical className="mt-0.5 size-5 shrink-0 text-amber-700" />
                <div className="text-sm text-amber-900">
                  <p className="font-semibold">Demo checkout</p>
                  <p className="mt-1">
                    This prototype has no payment gateway. Clicking “Simulate purchase” only marks the request as a successful <b>demo</b> purchase. No card, UPI or bank
                    details are requested, stored or charged.
                  </p>
                </div>
              </div>
            </Card>
          )}
        </div>

        <Card className="lg:sticky lg:top-24 lg:self-start">
          <CardHeader title="Order summary" />
          <div className="space-y-3 p-5 text-sm">
            <div className="flex items-center justify-between">
              <span className="text-zinc-600">Plan</span>
              <Badge tone="brand">{plan.name}</Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-zinc-600">Billing</span>
              <span className="text-zinc-900 capitalize">{plan.period}ly</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-zinc-600">Limits</span>
              <span className="text-zinc-900">
                {plan.residentLimit.toLocaleString()} residents · {plan.staffLimit} staff
              </span>
            </div>
            <div className="flex items-baseline justify-between border-t border-zinc-100 pt-3">
              <span className="font-medium text-zinc-900">Illustrative total</span>
              <span className="text-xl font-semibold text-zinc-900">
                {formatINR(plan.price)}
                <span className="text-sm font-normal text-zinc-500">/{plan.period}</span>
              </span>
            </div>
            <Notice tone="warning">Sample pricing for demonstration only. You will not be charged.</Notice>
            <Button variant="primary" className="h-11 w-full" loading={processing} onClick={submit}>
              {processing ? (mode === 'purchase' ? 'Simulating…' : 'Submitting…') : mode === 'purchase' ? 'Simulate purchase' : 'Submit for approval'}
            </Button>
          </div>
        </Card>
      </div>
    </div>
  )
}
