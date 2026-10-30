import { Lock, RotateCcw, Save, UserCheck } from 'lucide-react'
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useToast } from '../../components/toast'
import { Badge, Button, Card, CardHeader, ConfirmDialog, Notice, PageHeader, Segmented } from '../../components/ui'
import { defaultPermissions, isLockedCell, isSensitiveCell } from '../../lib/permissions'
import { useStore } from '../../lib/store'
import { ACTIONS, MODULE_LABELS, MODULES, ROLE_LABELS, type Action, type Module, type PermissionMatrix, type Role } from '../../lib/types'
import { cn } from '../../lib/utils'

const ROLES = Object.keys(ROLE_LABELS) as Role[]

interface Change {
  role: Role
  module: Module
  action: Action
  value: boolean
}

function diff(a: PermissionMatrix, b: PermissionMatrix): Change[] {
  const out: Change[] = []
  for (const role of ROLES) for (const module of MODULES) for (const action of ACTIONS) if (a[role][module][action] !== b[role][module][action]) out.push({ role, module, action, value: b[role][module][action] })
  return out
}

const clone = (p: PermissionMatrix) => JSON.parse(JSON.stringify(p)) as PermissionMatrix

export default function Permissions() {
  const { state, session, setSession, savePermissions } = useStore()
  const toast = useToast()
  const navigate = useNavigate()
  const [role, setRole] = useState<Role>('rwa_admin')
  const [draft, setDraft] = useState<PermissionMatrix>(() => clone(state.permissions))
  const [confirm, setConfirm] = useState<'save' | 'reset' | null>(null)

  const changes = diff(state.permissions, draft)
  const sensitive = changes.filter((c) => isSensitiveCell(c.module, c.action) && !c.value)

  const set = (module: Module, action: Action, value: boolean) => {
    const next = clone(draft)
    next[role][module][action] = value
    // Without view access the other actions are meaningless.
    if (action === 'view' && !value) for (const a of ACTIONS) if (!isLockedCell(role, module, a)) next[role][module][a] = false
    if (action !== 'view' && value) next[role][module].view = true
    setDraft(next)
  }

  const doSave = () => {
    const summary =
      changes.length === 1
        ? `${ROLE_LABELS[changes[0].role]}: ${changes[0].value ? 'granted' : 'removed'} ${changes[0].action} on ${MODULE_LABELS[changes[0].module]}`
        : `${changes.length} permission changes saved (${[...new Set(changes.map((c) => ROLE_LABELS[c.role]))].join(', ')})`
    savePermissions(draft, summary)
    toast({ title: 'Permissions saved', description: 'Stored in this browser. The demo UI now follows the new matrix.' })
  }

  const preview = () => {
    const rwaId = state.rwas.some((r) => r.id === session.rwaId) ? session.rwaId : state.rwas[0].id
    setSession({ role, rwaId })
    navigate(role === 'super_admin' ? '/admin' : `/rwa/${rwaId}`)
  }

  return (
    <>
      <PageHeader
        title="Roles & Permissions"
        description="Configure what each role can do in the prototype. Changes apply after you save."
        actions={
          <>
            <Button icon={<RotateCcw className="size-4" />} onClick={() => setConfirm('reset')}>
              Reset to defaults
            </Button>
            <Button variant="primary" icon={<Save className="size-4" />} disabled={!changes.length} onClick={() => (sensitive.length ? setConfirm('save') : doSave())}>
              Save changes{changes.length ? ` (${changes.length})` : ''}
            </Button>
          </>
        }
      />
      <Notice tone="warning" className="mb-5">
        <b>UI simulation only.</b> This matrix controls which buttons and pages the demo shows. It is not secure production authorization — there is no backend enforcing it.
      </Notice>

      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <Segmented<Role>
          value={role}
          onChange={setRole}
          options={ROLES.map((r) => ({ value: r, label: ROLE_LABELS[r], count: changes.filter((c) => c.role === r).length || undefined }))}
        />
        <Button size="sm" icon={<UserCheck className="size-4" />} onClick={preview} disabled={!!changes.length} title={changes.length ? 'Save your changes first' : undefined}>
          Switch demo role to {ROLE_LABELS[role]}
        </Button>
      </div>

      <Card>
        <CardHeader
          title={`${ROLE_LABELS[role]} permissions`}
          description={
            role === 'super_admin'
              ? 'Critical Super Admin permissions are locked so the last Super Admin can’t lose access.'
              : 'Platform-only modules (banners, plans, activity logs) can’t be granted write access to society roles.'
          }
          action={changes.some((c) => c.role === role) && <Badge tone="amber">Unsaved changes</Badge>}
        />
        <div className="thin-scroll overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-zinc-100 bg-zinc-50/60">
                <th className="px-5 py-2.5 text-left text-xs font-medium tracking-wide text-zinc-500 uppercase">Module</th>
                {ACTIONS.map((a) => (
                  <th key={a} className="px-3 py-2.5 text-center text-xs font-medium tracking-wide text-zinc-500 capitalize">
                    {a}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {MODULES.map((m) => (
                <tr key={m} className="border-b border-zinc-100 last:border-0">
                  <td className="px-5 py-3 font-medium whitespace-nowrap text-zinc-800">{MODULE_LABELS[m]}</td>
                  {ACTIONS.map((a) => {
                    const locked = isLockedCell(role, m, a)
                    const value = draft[role][m][a]
                    const changed = state.permissions[role][m][a] !== value
                    return (
                      <td key={a} className="px-3 py-3 text-center">
                        <label
                          className={cn('relative inline-flex size-8 items-center justify-center rounded-lg', changed && 'bg-amber-50 ring-1 ring-amber-300', locked ? 'cursor-not-allowed' : 'cursor-pointer hover:bg-zinc-100')}
                          title={locked ? (role === 'super_admin' ? 'Locked: critical Super Admin permission' : 'Platform-only: not available to society roles') : `${a} ${MODULE_LABELS[m]}`}
                        >
                          <input
                            type="checkbox"
                            aria-label={`${ROLE_LABELS[role]} ${a} ${MODULE_LABELS[m]}`}
                            className="size-4 accent-[var(--brand)] disabled:opacity-40"
                            checked={value}
                            disabled={locked}
                            onChange={(e) => set(m, a, e.target.checked)}
                          />
                          {locked && <Lock className="absolute -top-0.5 -right-0.5 size-3 text-zinc-400" />}
                        </label>
                      </td>
                    )
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      <ConfirmDialog
        open={confirm === 'save'}
        onClose={() => setConfirm(null)}
        title="Remove sensitive permissions?"
        confirmLabel="Save changes"
        description={
          <>
            <p>You are removing these sensitive permissions:</p>
            <ul className="mt-2 list-disc space-y-0.5 pl-5">
              {sensitive.map((c) => (
                <li key={`${c.role}${c.module}${c.action}`}>
                  {ROLE_LABELS[c.role]} — <b>{c.action}</b> on {MODULE_LABELS[c.module]}
                </li>
              ))}
            </ul>
          </>
        }
        onConfirm={doSave}
      />
      <ConfirmDialog
        open={confirm === 'reset'}
        onClose={() => setConfirm(null)}
        title="Reset all permissions?"
        tone="primary"
        confirmLabel="Reset"
        description="Every role returns to the default demo permissions. This is saved immediately."
        onConfirm={() => {
          const d = defaultPermissions()
          setDraft(clone(d))
          savePermissions(d, 'Permissions reset to demo defaults')
          toast({ title: 'Permissions reset to defaults' })
        }}
      />
    </>
  )
}
