/* eslint-disable react-refresh/only-export-components */
import { Check } from 'lucide-react'
import { useState } from 'react'
import { useStore } from '../lib/store'
import type { Rwa, RwaStatus, SubscriptionStatus } from '../lib/types'
import { cn, formatINR } from '../lib/utils'
import { useToast } from './toast'
import { Button, ConfirmDialog, Field, Modal, Select } from './ui'

const SUB_STATUSES: SubscriptionStatus[] = ['Trial', 'Pending Approval', 'Active', 'Expired', 'Suspended']

export function AssignPlanDialog({ rwa, onClose }: { rwa: Rwa | null; onClose: () => void }) {
  return rwa ? <AssignPlanBody key={rwa.id} rwa={rwa} onClose={onClose} /> : null
}

function AssignPlanBody({ rwa, onClose }: { rwa: Rwa; onClose: () => void }) {
  const { state, assignPlan } = useStore()
  const toast = useToast()
  const [planId, setPlanId] = useState(rwa.planId)
  const [sub, setSub] = useState<SubscriptionStatus>(rwa.subscription.status)
  const plans = state.plans.filter((p) => p.status === 'Enabled' || p.id === rwa.planId)

  return (
    <Modal
      open
      onClose={onClose}
      title={`Assign plan · ${rwa.name}`}
      description="Plans are illustrative. No billing is performed in this demo."
      footer={
        <>
          <Button onClick={onClose}>Cancel</Button>
          <Button
            variant="primary"
            onClick={() => {
              assignPlan(rwa.id, planId, sub)
              toast({ title: 'Plan updated', description: `${rwa.name} is now on ${state.plans.find((p) => p.id === planId)?.name}.` })
              onClose()
            }}
          >
            Save plan
          </Button>
        </>
      }
    >
      <div className="grid grid-cols-1 gap-2">
        {plans.map((p) => (
          <button
            key={p.id}
            type="button"
            onClick={() => setPlanId(p.id)}
            className={cn('flex items-center gap-3 rounded-xl border p-3 text-left transition', planId === p.id ? 'border-brand bg-brand-soft/60 ring-1 ring-brand' : 'border-zinc-200 hover:border-zinc-300')}
          >
            <span className={cn('flex size-5 items-center justify-center rounded-full border', planId === p.id ? 'border-brand bg-brand text-white' : 'border-zinc-300')}>
              {planId === p.id && <Check className="size-3" />}
            </span>
            <span className="flex-1">
              <span className="block text-sm font-medium text-zinc-900">{p.name}</span>
              <span className="block text-xs text-zinc-500">
                Up to {p.residentLimit.toLocaleString()} residents · {p.staffLimit} staff
              </span>
            </span>
            <span className="text-sm font-medium text-zinc-700">
              {formatINR(p.price)}
              <span className="text-xs font-normal text-zinc-400">/{p.period}</span>
            </span>
          </button>
        ))}
      </div>
      <Field label="Subscription status" className="mt-4" hint="Changing the plan resets the society’s enabled features to the plan defaults.">
        {(id) => (
          <Select id={id} value={sub} onChange={(e) => setSub(e.target.value as SubscriptionStatus)}>
            {SUB_STATUSES.map((s) => (
              <option key={s}>{s}</option>
            ))}
          </Select>
        )}
      </Field>
    </Modal>
  )
}

/** Confirmation flow for suspend / activate / deactivate actions. */
export function useStatusChange() {
  const { setRwaStatus } = useStore()
  const toast = useToast()
  const [pending, setPending] = useState<{ rwa: Rwa; status: RwaStatus } | null>(null)

  const copy: Partial<Record<RwaStatus, { title: string; verb: string; body: string; tone: 'danger' | 'primary' }>> = {
    Suspended: {
      title: 'Suspend RWA?',
      verb: 'Suspend',
      body: 'Society administrators and residents will see a suspension notice. Data is kept and can be restored by reactivating.',
      tone: 'danger',
    },
    Active: { title: 'Activate RWA?', verb: 'Activate', body: 'The society regains full access to its portal and features.', tone: 'primary' },
    Deactivated: { title: 'Deactivate RWA?', verb: 'Deactivate', body: 'The society will be hidden from active counts. You can reactivate it later.', tone: 'danger' },
  }

  const c = pending ? copy[pending.status] : undefined
  const dialog = (
    <ConfirmDialog
      open={!!pending}
      onClose={() => setPending(null)}
      title={c?.title ?? ''}
      tone={c?.tone}
      confirmLabel={c?.verb}
      description={
        <>
          <p>
            <b className="text-zinc-900">{pending?.rwa.name}</b> — {c?.body}
          </p>
          <p className="mt-2 text-xs text-zinc-500">Demo mode: the status changes immediately in this browser only.</p>
        </>
      }
      onConfirm={() => {
        if (!pending) return
        setRwaStatus(pending.rwa.id, pending.status)
        toast({ title: `${pending.rwa.name} ${pending.status === 'Active' ? 'activated' : pending.status.toLowerCase()}`, tone: pending.status === 'Active' ? 'success' : 'warning' })
      }}
    />
  )
  return { request: (rwa: Rwa, status: RwaStatus) => setPending({ rwa, status }), dialog }
}

/** Approve / decline flow for public join requests. */
export function useJoinReview() {
  const { state, approveJoin, rejectJoin } = useStore()
  const toast = useToast()
  const [target, setTarget] = useState<{ rwa: Rwa; mode: 'approve' | 'reject' } | null>(null)
  const [as, setAs] = useState<'Active' | 'Trial'>('Active')
  const plan = target && state.plans.find((p) => p.id === target.rwa.planId)

  const dialog = (
    <Modal
      open={!!target}
      onClose={() => setTarget(null)}
      size="sm"
      title={target?.mode === 'approve' ? 'Approve join request' : 'Decline join request'}
      footer={
        <>
          <Button onClick={() => setTarget(null)}>Cancel</Button>
          {target?.mode === 'approve' ? (
            <Button
              variant="primary"
              onClick={() => {
                approveJoin(target.rwa.id, as)
                toast({ title: `${target.rwa.name} approved`, description: `The society is now ${as} and visible in RWA Management. No invitation email is sent in demo mode.` })
                setTarget(null)
              }}
            >
              Approve
            </Button>
          ) : (
            <Button
              variant="danger"
              onClick={() => {
                if (!target) return
                rejectJoin(target.rwa.id)
                toast({ title: 'Request declined', tone: 'warning' })
                setTarget(null)
              }}
            >
              Decline
            </Button>
          )}
        </>
      }
    >
      {target && (
        <div className="space-y-3 text-sm text-zinc-600">
          <p>
            <b className="text-zinc-900">{target.rwa.name}</b> ({target.rwa.city}) requested the <b className="text-zinc-900">{plan?.name}</b> plan
            {target.rwa.joinRequest?.mode === 'purchase' ? ' via a simulated purchase.' : ' with manual approval.'}
          </p>
          {target.mode === 'approve' ? (
            <Field label="Activate as">
              {(id) => (
                <Select id={id} value={as} onChange={(e) => setAs(e.target.value as 'Active' | 'Trial')}>
                  <option value="Active">Active subscription</option>
                  <option value="Trial">30-day trial</option>
                </Select>
              )}
            </Field>
          ) : (
            <p>The request will be marked as deactivated. You can reactivate it later from the RWA details page.</p>
          )}
        </div>
      )}
    </Modal>
  )
  return {
    approve: (rwa: Rwa) => {
      setAs(rwa.joinRequest?.demoPurchaseSucceeded ? 'Active' : 'Trial')
      setTarget({ rwa, mode: 'approve' })
    },
    reject: (rwa: Rwa) => setTarget({ rwa, mode: 'reject' }),
    dialog,
  }
}
