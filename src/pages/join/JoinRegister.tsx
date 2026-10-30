import { useState } from 'react'
import { Link, Navigate, useNavigate } from 'react-router-dom'
import { findDuplicate, RwaFields, validateDraft, type DraftErrors } from '../../components/rwaFields'
import { useToast } from '../../components/toast'
import { Badge, Button } from '../../components/ui'
import { useStore } from '../../lib/store'
import { formatINR } from '../../lib/utils'
import { useJoin } from './joinState'
import { JoinSteps } from './JoinSteps'

export default function JoinRegister() {
  const { state } = useStore()
  const { draft, setDraft } = useJoin()
  const navigate = useNavigate()
  const toast = useToast()
  const [errors, setErrors] = useState<DraftErrors>({})
  const plan = state.plans.find((p) => p.id === draft.planId)

  if (!plan) return <Navigate to="/join/plans" replace />

  const next = () => {
    const e = validateDraft(draft.rwa)
    setErrors(e)
    if (Object.keys(e).length) {
      toast({ title: 'Please complete the highlighted fields', tone: 'error' })
      requestAnimationFrame(() => document.querySelector('[aria-invalid="true"]')?.scrollIntoView({ behavior: 'smooth', block: 'center' }))
      return
    }
    navigate('/join/checkout')
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6">
      <JoinSteps current={1} />
      <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight text-zinc-900">Tell us about your society</h1>
          <p className="mt-2 text-zinc-600">Please use fictional details — this is a demo and nothing is sent anywhere.</p>
        </div>
        <div className="flex items-center gap-2 text-sm">
          <Badge tone="brand">{plan.name}</Badge>
          <span className="text-zinc-600">
            {formatINR(plan.price)}/{plan.period}
          </span>
          <Link to="/join/plans" className="text-brand hover:underline">
            Change
          </Link>
        </div>
      </div>
      <RwaFields
        draft={draft.rwa}
        errors={errors}
        duplicate={findDuplicate(draft.rwa, state.rwas)}
        onChange={(rwa) => {
          setDraft({ ...draft, rwa })
          if (Object.keys(errors).length) setErrors(validateDraft(rwa))
        }}
      />
      <div className="mt-6 flex justify-between gap-2">
        <Button onClick={() => navigate('/join/plans')}>Back</Button>
        <Button variant="primary" onClick={next}>
          Continue to review
        </Button>
      </div>
    </div>
  )
}
