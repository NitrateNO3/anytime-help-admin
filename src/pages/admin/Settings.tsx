import { ArrowRight, RotateCcw } from 'lucide-react'
import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { ImagePicker } from '../../components/shared'
import { useToast } from '../../components/toast'
import { Button, Card, CardHeader, ConfirmDialog, Field, Input, PageHeader, Select, Toggle } from '../../components/ui'
import { useStore } from '../../lib/store'
import { FEATURE_LABELS, type FeatureKey, type PlatformSettings, type RwaStatus } from '../../lib/types'
import { cn, isEmail } from '../../lib/utils'

const BRAND_PRESETS = ['#4f46e5', '#0f766e', '#2563eb', '#b45309', '#be185d', '#18181b']

export default function Settings() {
  const { state, updateSettings, resetDemo } = useStore()
  const toast = useToast()
  const navigate = useNavigate()
  const [s, setS] = useState<PlatformSettings>(state.settings)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [confirmReset, setConfirmReset] = useState(false)
  const dirty = JSON.stringify(s) !== JSON.stringify(state.settings)

  const save = () => {
    const e: Record<string, string> = {}
    if (!s.platformName.trim()) e.platformName = 'Platform name is required'
    if (!isEmail(s.supportEmail)) e.supportEmail = 'Enter a valid email'
    if (!/^#[0-9a-f]{6}$/i.test(s.brandColor)) e.brandColor = 'Use a 6-digit hex colour, e.g. #4f46e5'
    setErrors(e)
    if (Object.keys(e).length) return
    updateSettings({ ...s, platformName: s.platformName.trim() })
    toast({ title: 'Settings saved', description: 'Branding and defaults now apply across the prototype.' })
  }

  return (
    <>
      <PageHeader
        title="Platform settings"
        description="Demo configuration for branding, defaults and platform-wide features."
        actions={
          <>
            <Button disabled={!dirty} onClick={() => setS(state.settings)}>
              Discard
            </Button>
            <Button variant="primary" disabled={!dirty} onClick={save}>
              Save settings
            </Button>
          </>
        }
      />
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        <Card>
          <CardHeader title="Branding" description="Shown in the sidebar, join pages and banner previews." />
          <div className="space-y-4 p-5">
            <Field label="Platform name" error={errors.platformName}>
              {(id) => <Input id={id} value={s.platformName} onChange={(e) => setS({ ...s, platformName: e.target.value })} invalid={!!errors.platformName} />}
            </Field>
            <Field label="Logo" optional>
              {() => <ImagePicker value={s.logo} onChange={(logo) => setS({ ...s, logo })} label="Upload logo" shape="square" />}
            </Field>
            <Field label="Brand colour" error={errors.brandColor} hint="Used for buttons, highlights and charts.">
              {(id) => (
                <div className="flex flex-wrap items-center gap-2">
                  {BRAND_PRESETS.map((c) => (
                    <button
                      key={c}
                      type="button"
                      aria-label={`Use ${c}`}
                      onClick={() => setS({ ...s, brandColor: c })}
                      style={{ background: c }}
                      className={cn('size-8 rounded-lg', s.brandColor.toLowerCase() === c && 'ring-2 ring-zinc-900 ring-offset-2')}
                    />
                  ))}
                  <input type="color" aria-label="Custom colour" value={s.brandColor} onChange={(e) => setS({ ...s, brandColor: e.target.value })} className="size-8 cursor-pointer rounded-lg border border-zinc-200" />
                  <Input id={id} value={s.brandColor} onChange={(e) => setS({ ...s, brandColor: e.target.value })} className="w-28 font-mono" invalid={!!errors.brandColor} />
                </div>
              )}
            </Field>
          </div>
        </Card>
        <Card>
          <CardHeader title="Support contact" description="Shown to societies on suspension notices and the join flow." />
          <div className="space-y-4 p-5">
            <Field label="Support email" error={errors.supportEmail}>
              {(id) => <Input id={id} type="email" value={s.supportEmail} onChange={(e) => setS({ ...s, supportEmail: e.target.value })} invalid={!!errors.supportEmail} />}
            </Field>
            <Field label="Support phone">
              {(id) => <Input id={id} value={s.supportPhone} onChange={(e) => setS({ ...s, supportPhone: e.target.value })} />}
            </Field>
          </div>
          <CardHeader title="Onboarding defaults" description="Pre-filled when adding a new RWA manually." />
          <div className="grid grid-cols-1 gap-4 p-5 sm:grid-cols-2">
            <Field label="Default plan">
              {(id) => (
                <Select id={id} value={s.defaultPlanId} onChange={(e) => setS({ ...s, defaultPlanId: e.target.value })}>
                  {state.plans.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                    </option>
                  ))}
                </Select>
              )}
            </Field>
            <Field label="Default account status">
              {(id) => (
                <Select id={id} value={s.defaultStatus} onChange={(e) => setS({ ...s, defaultStatus: e.target.value as RwaStatus })}>
                  {(['Trial', 'Active', 'Pending'] as RwaStatus[]).map((x) => (
                    <option key={x}>{x}</option>
                  ))}
                </Select>
              )}
            </Field>
          </div>
        </Card>
        <Card>
          <CardHeader title="Platform features" description="Turning a feature off hides it for every society, regardless of plan." />
          <ul className="divide-y divide-zinc-100">
            {(Object.keys(FEATURE_LABELS) as FeatureKey[]).map((f) => (
              <li key={f} className="flex items-center justify-between px-5 py-3">
                <span className="text-sm text-zinc-800">{FEATURE_LABELS[f]}</span>
                <Toggle label={FEATURE_LABELS[f]} checked={s.features[f]} onChange={(v) => setS({ ...s, features: { ...s.features, [f]: v } })} />
              </li>
            ))}
          </ul>
        </Card>
        <div className="space-y-5">
          <Card>
            <CardHeader title="Default role permissions" description="Configured in the permission matrix." />
            <div className="p-5">
              <Link to="/admin/permissions" className="inline-flex items-center gap-1 text-sm font-medium text-brand hover:underline">
                Open Roles & Permissions <ArrowRight className="size-4" />
              </Link>
            </div>
          </Card>
          <Card className="border-red-200">
            <CardHeader title="Reset demo data" description="Restore every society, record, permission and setting to the original seeded state." />
            <div className="flex flex-wrap items-center justify-between gap-3 p-5">
              <p className="max-w-sm text-sm text-zinc-600">Everything you’ve created in this browser will be erased. Your demo role resets to Super Admin.</p>
              <Button variant="outline-danger" icon={<RotateCcw className="size-4" />} onClick={() => setConfirmReset(true)}>
                Reset Demo Data
              </Button>
            </div>
          </Card>
        </div>
      </div>
      <ConfirmDialog
        open={confirmReset}
        onClose={() => setConfirmReset(false)}
        title="Reset all demo data?"
        confirmLabel="Reset everything"
        description="This restores the seeded societies, members, staff, complaints, banners, plans, permissions, settings and activity log. It can’t be undone."
        onConfirm={() => {
          resetDemo()
          toast({ title: 'Demo data reset', description: 'A clean starting state has been restored.' })
          navigate('/admin')
        }}
      />
    </>
  )
}
