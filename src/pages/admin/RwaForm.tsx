import { ArrowLeft, Check } from 'lucide-react'
import { useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { PlanCards } from '../../components/planCards'
import { draftFromRwa, draftToRwaFields, emptyDraft, findDuplicate, RwaFields, validateDraft, type DraftErrors, type RwaDraft } from '../../components/rwaFields'
import { useToast } from '../../components/toast'
import { Button, Card, CardHeader, DefinitionList, Field, Notice, PageHeader, Select, Textarea } from '../../components/ui'
import { useStore } from '../../lib/store'
import type { RwaStatus } from '../../lib/types'
import { cn } from '../../lib/utils'

const STATUSES: RwaStatus[] = ['Active', 'Trial', 'Pending', 'Suspended']

export default function RwaForm() {
  const { rwaId } = useParams()
  const { state, createRwa, updateRwa } = useStore()
  const navigate = useNavigate()
  const toast = useToast()
  const existing = state.rwas.find((r) => r.id === rwaId)
  const editing = !!rwaId

  const [draft, setDraft] = useState<RwaDraft>(() => (existing ? draftFromRwa(existing) : emptyDraft()))
  const [planId, setPlanId] = useState(existing?.planId ?? state.settings.defaultPlanId)
  const [status, setStatus] = useState<RwaStatus>(existing?.status ?? state.settings.defaultStatus)
  const [notes, setNotes] = useState(existing?.notes ?? '')
  const [errors, setErrors] = useState<DraftErrors>({})
  const [step, setStep] = useState<'form' | 'review'>('form')

  if (editing && !existing) {
    return <Notice tone="danger">This RWA could not be found.</Notice>
  }

  const duplicate = findDuplicate(draft, state.rwas, rwaId)
  const plan = state.plans.find((p) => p.id === planId)
  const enabledPlans = state.plans.filter((p) => p.status === 'Enabled' || p.id === existing?.planId)

  const change = (d: RwaDraft) => {
    setDraft(d)
    if (Object.keys(errors).length) setErrors(validateDraft(d))
  }

  const submitForm = () => {
    const e = validateDraft(draft)
    setErrors(e)
    if (Object.keys(e).length) {
      toast({ title: 'Please fix the highlighted fields', tone: 'error' })
      requestAnimationFrame(() => document.querySelector('[aria-invalid="true"]')?.scrollIntoView({ behavior: 'smooth', block: 'center' }))
      return
    }
    if (editing && existing) {
      updateRwa(existing.id, { ...draftToRwaFields(draft), notes })
      toast({ title: 'RWA updated', description: `${draft.name} has been saved.` })
      navigate(`/admin/rwas/${existing.id}`)
      return
    }
    setStep('review')
    window.scrollTo({ top: 0 })
  }

  const create = () => {
    const rwa = createRwa({ ...draftToRwaFields(draft), planId, status, notes: notes.trim() || undefined })
    toast({ title: 'Demo RWA created', description: `${rwa.name} was added to this browser’s demo data. No invitation email or real account was created.` })
    navigate(`/admin/rwas/${rwa.id}`)
  }

  return (
    <div className="mx-auto max-w-4xl">
      <PageHeader
        breadcrumb={
          <Link to={editing ? `/admin/rwas/${rwaId}` : '/admin/rwas'} className="inline-flex items-center gap-1 hover:text-zinc-800">
            <ArrowLeft className="size-3.5" /> {editing ? existing?.name : 'RWA Management'}
          </Link>
        }
        title={editing ? 'Edit RWA' : 'Add New RWA'}
        description={editing ? 'Update society details and contacts.' : 'Manually onboard a society. It appears in RWA Management as soon as it’s created.'}
      />

      {!editing && (
        <ol className="mb-6 flex items-center gap-3 text-[13px]">
          {['Society details & plan', 'Review & create'].map((label, i) => {
            const active = (i === 0 && step === 'form') || (i === 1 && step === 'review')
            const done = i === 0 && step === 'review'
            return (
              <li key={label} className="flex items-center gap-2">
                <span className={cn('flex size-6 items-center justify-center rounded-full text-xs font-semibold', active ? 'bg-brand text-white' : done ? 'bg-emerald-100 text-emerald-700' : 'bg-zinc-200 text-zinc-600')}>
                  {done ? <Check className="size-3.5" /> : i + 1}
                </span>
                <span className={active ? 'font-medium text-zinc-900' : 'text-zinc-500'}>{label}</span>
                {i === 0 && <span className="mx-1 h-px w-8 bg-zinc-300" />}
              </li>
            )
          })}
        </ol>
      )}

      {step === 'form' ? (
        <>
          <RwaFields
            draft={draft}
            errors={errors}
            onChange={change}
            duplicate={duplicate}
            extra={
              <>
                {!editing && (
                  <Card>
                    <CardHeader title="Plan & account status" description="Plans and prices are illustrative. No billing takes place." />
                    <div className="space-y-5 p-5">
                      <PlanCards plans={enabledPlans} selectedId={planId} onSelect={setPlanId} />
                      <Field label="Account status" className="max-w-xs">
                        {(id) => (
                          <Select id={id} value={status} onChange={(e) => setStatus(e.target.value as RwaStatus)}>
                            {STATUSES.map((s) => (
                              <option key={s}>{s}</option>
                            ))}
                          </Select>
                        )}
                      </Field>
                    </div>
                  </Card>
                )}
                <Card>
                  <CardHeader title="Internal notes" description="Visible to Anytime Help staff only." />
                  <div className="p-5">
                    <Field label="Notes" optional>
                      {(id) => <Textarea id={id} value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Context from onboarding calls, special arrangements…" />}
                    </Field>
                  </div>
                </Card>
              </>
            }
          />
          <div className="sticky bottom-0 z-10 -mx-4 mt-6 flex justify-end gap-2 border-t border-zinc-200 bg-[#f7f7f8]/95 px-4 py-3 backdrop-blur sm:mx-0 sm:rounded-xl sm:border sm:bg-white">
            <Button onClick={() => navigate(-1)}>Cancel</Button>
            <Button variant="primary" onClick={submitForm}>
              {editing ? 'Save changes' : 'Continue to review'}
            </Button>
          </div>
        </>
      ) : (
        <div className="space-y-5">
          {duplicate && (
            <Notice tone="warning">
              Possible duplicate: <b>{duplicate.name}</b> already exists in {duplicate.city}. You can still create this record if it’s a different society.
            </Notice>
          )}
          <Card>
            <CardHeader title="Society" action={<Button size="sm" variant="ghost" onClick={() => setStep('form')}>Edit</Button>} />
            <div className="p-5">
              <DefinitionList
                items={[
                  { label: 'Society name', value: draft.name },
                  { label: 'Residential units', value: draft.units },
                  { label: 'Address', value: `${draft.address}, ${draft.city}, ${draft.state} ${draft.pin}` },
                  { label: 'Registration number', value: draft.regNo || 'Not provided' },
                  { label: 'President', value: `${draft.presidentName}${draft.presidentPhone ? ' · ' + draft.presidentPhone : ''}` },
                  { label: 'Administrator', value: `${draft.adminName} · ${draft.adminEmail} · ${draft.adminPhone}` },
                ]}
              />
            </div>
          </Card>
          <Card>
            <CardHeader title="Plan & status" action={<Button size="sm" variant="ghost" onClick={() => setStep('form')}>Edit</Button>} />
            <div className="p-5">
              <DefinitionList
                items={[
                  { label: 'Plan', value: `${plan?.name} (illustrative pricing)` },
                  { label: 'Account status', value: status },
                  { label: 'Internal notes', value: notes || 'None' },
                ]}
              />
            </div>
          </Card>
          <Notice tone="info">Demo mode: creating this RWA stores it in your browser’s localStorage. No administrator account or invitation email is created.</Notice>
          <div className="flex justify-end gap-2">
            <Button onClick={() => setStep('form')}>Back</Button>
            <Button variant="primary" onClick={create}>
              Create RWA
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
