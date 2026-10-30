import { ACTIONS, MODULES, type Action, type Module, type PermissionMatrix, type Role } from './types'

type Grants = Partial<Record<Module, Action[]>>

const ALL = [...ACTIONS]

function build(grants: Grants): Record<Module, Record<Action, boolean>> {
  return Object.fromEntries(
    MODULES.map((m) => [m, Object.fromEntries(ACTIONS.map((a) => [a, grants[m]?.includes(a) ?? false]))]),
  ) as Record<Module, Record<Action, boolean>>
}

export function defaultPermissions(): PermissionMatrix {
  return {
    super_admin: build(Object.fromEntries(MODULES.map((m) => [m, ALL]))),
    rwa_admin: build({
      members: ['view', 'create', 'edit', 'delete', 'approve'],
      staff: ['view', 'create', 'edit', 'delete'],
      complaints: ['view', 'create', 'edit', 'delete', 'approve'],
      announcements: ['view', 'create', 'edit', 'delete', 'publish'],
      banners: ['view'],
      plans: ['view'],
      rwaSettings: ['view', 'edit'],
      analytics: ['view'],
      notifications: ['view', 'create', 'publish'],
    }),
    staff_manager: build({
      members: ['view'],
      staff: ['view', 'edit'],
      complaints: ['view', 'edit', 'approve'],
      announcements: ['view'],
      banners: ['view'],
      notifications: ['view'],
    }),
    resident: build({
      complaints: ['view', 'create'],
      announcements: ['view'],
      banners: ['view'],
      notifications: ['view'],
    }),
  }
}

/** Platform-only modules: society roles can never write to them, regardless of the matrix. */
export const PLATFORM_ONLY: Module[] = ['banners', 'plans', 'activityLogs']

/** Super Admin permissions that must never be removed in the demo. */
export function isLockedCell(role: Role, module: Module, action: Action) {
  if (role === 'super_admin') {
    return action === 'view' || ['rwaSettings', 'banners', 'plans', 'activityLogs'].includes(module)
  }
  if (PLATFORM_ONLY.includes(module)) return action !== 'view' || module === 'activityLogs'
  return false
}

export function isSensitiveCell(module: Module, action: Action) {
  return action === 'delete' || action === 'approve' || module === 'rwaSettings'
}

/** Coerce stored permissions against the current schema so malformed data can't crash the UI. */
export function normalizePermissions(input: unknown): PermissionMatrix {
  const base = defaultPermissions()
  if (!input || typeof input !== 'object') return base
  const src = input as Record<string, Record<string, Record<string, unknown>>>
  for (const role of Object.keys(base) as Role[]) {
    for (const m of MODULES) {
      for (const a of ACTIONS) {
        const v = src[role]?.[m]?.[a]
        if (typeof v === 'boolean' && !isLockedCell(role, m, a)) base[role][m][a] = v
      }
    }
  }
  return base
}
