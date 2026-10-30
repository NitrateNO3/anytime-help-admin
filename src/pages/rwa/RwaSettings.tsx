import { Check, Lock } from 'lucide-react'
import { useState } from 'react'
import { useParams } from 'react-router-dom'
import { draftFromRwa, draftToRwaFields, RwaFields, validateDraft, type DraftErrors, type RwaDraft } from '../../components/rwaFields'
import { AccessDenied, useGate } from '../../components/shared'
import { useToast } from '../../components/toast'
import { Badge, Button, Card, CardHeader, DefinitionList, Notice, PageHeader, StatusBadge } from '../../components/ui'
import { useStore } from '../../lib/store'
import { FEATURE_LABELS, type FeatureKey } from '../../lib/types'
import { formatDate } from '../../lib/utils'

export default function RwaSettings() {
  const { rwaId = '' } = useParams()
  const { state, updateRwa } = useStore()
  const gate = useGate()
  const toast = useToast()
  const rwa = state.rwas.find((r) => r.id === rwaId)!
  const [draft, setDraft] = useState<RwaDraft>(() => draftFromRwa(rwa))
  const [errors, setErrors] = useState<DraftErrors>({})

  if (!gate('rwaSettings', 'view').allowed) return <AccessDenied />
  const canEdit = gate('rwaSettings', 'edit').allowed
  const plan = state.plans.find((p) => p.id === rwa.planId)
  const dirty = JSON.stringify(draft) !== JSON.stringify(draftFromRwa(rwa))

  const save = () => {
    const e = validateDraft(draft)
    setErrors(e)
    if (Object.keys(e).length) {
      toast({ title: 'Please fix the highlighted fields', tone: 'error' })
      return
    }
    updateRwa(rwa.id, draftToRwaFields(draft), `${rwa.name} society details updated by the RWA`)
    toast({ title: 'Society details saved' })
  }

  return (
    <>
      <PageHeader
        title="Society settings"
        description="Profile and contacts for your society. Plan and account status are managed by Anytime Help."
        actions={
          canEdit && (
            <>
              <Button disabled={!dirty} onClick={() => setDraft(draftFromRwa(rwa))}>
                Discard
              </Button>
              <Button variant="primary" disabled={!dirty} onClick={save}>
                Save changes
              </Button>
            </>
          )
        }
      />
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-[1fr_20rem]">
        <div>
          {canEdit ? (
            <RwaFields draft={draft} errors={errors} onChange={setDraft} />
          ) : (
            <Card>
              <CardHeader title="Society profile" action={<Badge><Lock className="size-3" /> View only</Badge>} />
              <div className="p-5">
                <DefinitionList
                  items={[
                    { label: 'Name', value: rwa.name },
                    { label: 'Address', value: `${rwa.address}, ${rwa.city}, ${rwa.state} ${rwa.pin}` },
                    { label: 'Units', value: rwa.units },
                    { label: 'President', value: rwa.presidentName },
                    { label: 'Administrator', value: `${rwa.adminName} · ${rwa.adminEmail}` },
                  ]}
                />
              </div>
            </Card>
          )}
        </div>
        <div className="space-y-5">
          <Card>
            <CardHeader title="Plan & status" action={<Badge><Lock className="size-3" /> Managed by Anytime Help</Badge>} />
            <div className="space-y-3 p-5 text-sm">
              <div className="flex justify-between">
                <span className="text-zinc-500">Plan</span>
                <Badge tone="brand">{plan?.name}</Badge>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-500">Account</span>
                <StatusBadge status={rwa.status} />
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-500">Subscription</span>
                <StatusBadge status={rwa.subscription.status} />
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-500">{rwa.subscription.trialEndsAt ? 'Trial ends' : 'Renews'}</span>
                <span>{formatDate(rwa.subscription.trialEndsAt ?? rwa.subscription.renewalDate)}</span>
              </div>
            </div>
          </Card>
          <Card>
            <CardHeader title="Enabled features" />
            <ul className="space-y-2 p-5">
              {(Object.keys(FEATURE_LABELS) as FeatureKey[]).map((f) => {
                const on = rwa.features.includes(f) && state.settings.features[f]
                return (
                  <li key={f} className="flex items-center justify-between text-sm">
                    <span className={on ? 'text-zinc-800' : 'text-zinc-400'}>{FEATURE_LABELS[f]}</span>
                    {on ? <Check className="size-4 text-emerald-600" /> : <span className="text-xs text-zinc-400">Not included</span>}
                  </li>
                )
              })}
            </ul>
          </Card>
          <Notice>Need a different plan or more features? Contact {state.settings.supportEmail}.</Notice>
        </div>
      </div>
    </>
  )
}
