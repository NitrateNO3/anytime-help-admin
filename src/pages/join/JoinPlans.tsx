import { useNavigate } from 'react-router-dom'
import { PlanCards } from '../../components/planCards'
import { Button } from '../../components/ui'
import { useStore } from '../../lib/store'
import { useJoin } from './joinState'
import { JoinSteps } from './JoinSteps'

export default function JoinPlans() {
  const { state } = useStore()
  const { draft, setDraft } = useJoin()
  const navigate = useNavigate()
  const plans = state.plans.filter((p) => p.status === 'Enabled')

  return (
    <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
      <JoinSteps current={0} />
      <h1 className="text-3xl font-semibold tracking-tight text-zinc-900">Choose a plan for your society</h1>
      <p className="mt-2 max-w-2xl text-zinc-600">All prices are illustrative sample pricing for this demo, not approved commercial pricing. You can change plans later.</p>
      <div className="mt-8">
        <PlanCards
          plans={plans}
          selectedId={draft.planId}
          renderAction={(p) => (
            <Button
              variant={p.popular || draft.planId === p.id ? 'primary' : 'secondary'}
              className="w-full"
              onClick={() => {
                setDraft({ ...draft, planId: p.id })
                navigate('/join/register')
              }}
            >
              Join with {p.name}
            </Button>
          )}
        />
      </div>
    </div>
  )
}
