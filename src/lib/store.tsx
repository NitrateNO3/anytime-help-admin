/* eslint-disable react-refresh/only-export-components */
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { normalizePermissions } from './permissions'
import { createSeed, STATE_VERSION } from './seed'
import type {
  Action,
  ActivityType,
  Announcement,
  AppNotification,
  Banner,
  Complaint,
  ComplaintStatus,
  DemoState,
  Member,
  Module,
  PermissionMatrix,
  Plan,
  PlatformSettings,
  Role,
  Rwa,
  RwaStatus,
  Session,
  Staff,
  SubscriptionStatus,
} from './types'
import { addDays, uid } from './utils'

const STATE_KEY = 'anytime-help-demo-state'
const SESSION_KEY = 'anytime-help-demo-session'

function loadState(): { state: DemoState; recovered: boolean } {
  try {
    const raw = localStorage.getItem(STATE_KEY)
    if (!raw) return { state: createSeed(), recovered: false }
    const parsed = JSON.parse(raw) as Partial<DemoState>
    const seed = createSeed()
    const arrays = ['rwas', 'members', 'staff', 'complaints', 'announcements', 'banners', 'plans', 'notifications', 'activity'] as const
    if (parsed.version !== STATE_VERSION || arrays.some((k) => !Array.isArray(parsed[k]))) {
      return { state: seed, recovered: true }
    }
    return {
      state: {
        ...(parsed as DemoState),
        permissions: normalizePermissions(parsed.permissions),
        settings: { ...seed.settings, ...parsed.settings, features: { ...seed.settings.features, ...parsed.settings?.features } },
      },
      recovered: false,
    }
  } catch {
    return { state: createSeed(), recovered: true }
  }
}

function loadSession(): Session {
  try {
    const s = JSON.parse(localStorage.getItem(SESSION_KEY) ?? 'null') as Session | null
    if (s && typeof s.role === 'string' && typeof s.rwaId === 'string') return s
  } catch {
    /* fall through to default */
  }
  return { role: 'super_admin', rwaId: 'rwa_green_valley' }
}

export const residentCount = (members: Member[], rwaId?: string) =>
  members.filter((m) => m.status !== 'Rejected' && (!rwaId || m.rwaId === rwaId)).length
export const isOpenComplaint = (c: Complaint) => c.status !== 'Resolved' && c.status !== 'Closed'

export function subscriptionFor(status: RwaStatus): SubscriptionStatus {
  switch (status) {
    case 'Active':
      return 'Active'
    case 'Trial':
      return 'Trial'
    case 'Pending':
      return 'Pending Approval'
    case 'Suspended':
      return 'Suspended'
    default:
      return 'Expired'
  }
}

export type NewRwaInput = Omit<Rwa, 'id' | 'createdAt' | 'subscription' | 'features' | 'source'> & {
  source?: Rwa['source']
  joinRequest?: Rwa['joinRequest']
}

interface Store {
  state: DemoState
  session: Session
  storageWarning: string | null
  setSession: (s: Session) => void
  can: (module: Module, action: Action) => boolean
  actorName: () => string
  log: (type: ActivityType, description: string, rwaId?: string) => void

  createRwa: (input: NewRwaInput) => Rwa
  updateRwa: (id: string, patch: Partial<Rwa>, note?: string) => void
  setRwaStatus: (id: string, status: RwaStatus) => void
  assignPlan: (rwaId: string, planId: string, subStatus?: SubscriptionStatus) => void
  approveJoin: (id: string, status?: 'Active' | 'Trial') => void
  rejectJoin: (id: string) => void

  saveMember: (m: Member) => void
  addMembers: (ms: Member[]) => void
  saveStaff: (s: Staff) => void
  saveComplaint: (c: Complaint) => void
  assignComplaint: (id: string, staffId: string | undefined) => void
  setComplaintStatus: (id: string, status: ComplaintStatus, notes?: string) => void
  saveAnnouncement: (a: Announcement) => void
  deleteAnnouncement: (id: string) => void
  saveBanner: (b: Banner) => void
  deleteBanner: (id: string) => void
  savePlan: (p: Plan) => void
  saveNotification: (n: AppNotification) => void
  deleteNotification: (id: string) => void
  savePermissions: (p: PermissionMatrix, summary: string) => void
  updateSettings: (s: PlatformSettings) => void
  resetDemo: () => void
}

const StoreContext = createContext<Store | null>(null)

export function StoreProvider({ children }: { children: ReactNode }) {
  const initial = useRef(loadState())
  const [state, setState] = useState<DemoState>(initial.current.state)
  const [session, setSessionState] = useState<Session>(loadSession)
  const [storageWarning, setStorageWarning] = useState<string | null>(
    initial.current.recovered ? 'Saved demo data was unreadable, so a fresh demo dataset was loaded.' : null,
  )

  useEffect(() => {
    try {
      localStorage.setItem(STATE_KEY, JSON.stringify(state))
    } catch {
      setStorageWarning('Browser storage is full. Recent changes may not survive a refresh — try smaller images.')
    }
  }, [state])

  useEffect(() => {
    try {
      localStorage.setItem(SESSION_KEY, JSON.stringify(session))
    } catch {
      /* non-critical */
    }
  }, [session])

  useEffect(() => {
    document.documentElement.style.setProperty('--brand', state.settings.brandColor)
    document.title = `${state.settings.platformName} — Admin`
  }, [state.settings.brandColor, state.settings.platformName])

  // Keep latest values reachable from stable callbacks.
  const sessionRef = useRef(session)
  const stateRef = useRef(state)
  useEffect(() => {
    sessionRef.current = session
    stateRef.current = state
  })

  const actorName = useCallback(() => {
    const s = sessionRef.current
    const rwa = stateRef.current.rwas.find((r) => r.id === s.rwaId)
    switch (s.role) {
      case 'super_admin':
        return 'Anytime Help Admin'
      case 'rwa_admin':
        return rwa?.adminName ?? 'RWA Admin'
      case 'staff_manager':
        return `Staff Manager (${rwa?.name ?? 'society'})`
      default:
        return demoResident(stateRef.current.members, s.rwaId)?.name ?? 'Resident'
    }
  }, [])

  /** Apply a state change and append an activity entry in one update. */
  const commit = useCallback(
    (fn: (s: DemoState) => DemoState, entry?: { type: ActivityType; description: string; rwaId?: string; actor?: string; role?: Role }) => {
      const actor = actorName()
      const role = sessionRef.current.role
      setState((prev) => {
        const next = fn(prev)
        if (!entry) return next
        const log = { id: uid('act'), at: new Date().toISOString(), actor, role, ...entry }
        return { ...next, activity: [log, ...next.activity].slice(0, 500) }
      })
    },
    [actorName],
  )

  const log = useCallback(
    (type: ActivityType, description: string, rwaId?: string) => commit((s) => s, { type, description, rwaId }),
    [commit],
  )

  const can = useCallback(
    (module: Module, action: Action) => state.permissions[session.role]?.[module]?.[action] ?? false,
    [state.permissions, session.role],
  )

  const store = useMemo<Store>(() => {
    const rwaName = (id?: string) => stateRef.current.rwas.find((r) => r.id === id)?.name ?? 'society'
    const upsert = <T extends { id: string }>(list: T[], item: T) =>
      list.some((x) => x.id === item.id) ? list.map((x) => (x.id === item.id ? item : x)) : [item, ...list]

    return {
      state,
      session,
      storageWarning,
      setSession: setSessionState,
      can,
      actorName,
      log,

      createRwa(input) {
        const now = new Date()
        const plan = stateRef.current.plans.find((p) => p.id === input.planId)
        const rwa: Rwa = {
          ...input,
          id: uid('rwa'),
          createdAt: now.toISOString(),
          source: input.source ?? 'manual',
          features: [...(plan?.modules ?? [])],
          subscription: {
            status: subscriptionFor(input.status),
            startDate: now.toISOString(),
            renewalDate: addDays(now, input.status === 'Trial' ? 30 : 365).toISOString(),
            trialEndsAt: input.status === 'Trial' ? addDays(now, 30).toISOString() : undefined,
          },
        }
        const description =
          rwa.source === 'join'
            ? `${rwa.name} requested to join (${plan?.name ?? 'plan'}, ${rwa.joinRequest?.mode === 'purchase' ? 'simulated purchase' : 'manual approval'})`
            : `${rwa.name} onboarded manually on the ${plan?.name ?? ''} plan`
        commit((s) => ({ ...s, rwas: [rwa, ...s.rwas] }), {
          type: rwa.source === 'join' ? 'rwa.join_request' : 'rwa.created',
          description,
          rwaId: rwa.id,
          ...(rwa.source === 'join' ? { actor: rwa.adminName, role: 'rwa_admin' as const } : {}),
        })
        return rwa
      },

      updateRwa(id, patch, note) {
        commit((s) => ({ ...s, rwas: s.rwas.map((r) => (r.id === id ? { ...r, ...patch } : r)) }), {
          type: 'rwa.updated',
          description: note ?? `${rwaName(id)} details updated`,
          rwaId: id,
        })
      },

      setRwaStatus(id, status) {
        const verb = { Active: 'activated', Suspended: 'suspended', Trial: 'moved to trial', Pending: 'set to pending', Deactivated: 'deactivated' }[status]
        commit(
          (s) => ({
            ...s,
            rwas: s.rwas.map((r) =>
              r.id === id ? { ...r, status, subscription: { ...r.subscription, status: subscriptionFor(status) } } : r,
            ),
          }),
          { type: 'rwa.status', description: `${rwaName(id)} ${verb}`, rwaId: id },
        )
      },

      assignPlan(rwaId, planId, subStatus) {
        const plan = stateRef.current.plans.find((p) => p.id === planId)
        commit(
          (s) => ({
            ...s,
            rwas: s.rwas.map((r) =>
              r.id === rwaId
                ? {
                    ...r,
                    planId,
                    features: [...(plan?.modules ?? r.features)],
                    subscription: { ...r.subscription, status: subStatus ?? r.subscription.status },
                  }
                : r,
            ),
          }),
          { type: 'plan.assigned', description: `${plan?.name ?? 'Plan'} plan assigned to ${rwaName(rwaId)}`, rwaId },
        )
      },

      approveJoin(id, status = 'Active') {
        const now = new Date()
        commit(
          (s) => ({
            ...s,
            rwas: s.rwas.map((r) =>
              r.id === id
                ? {
                    ...r,
                    status,
                    subscription: {
                      status: subscriptionFor(status),
                      startDate: now.toISOString(),
                      renewalDate: addDays(now, status === 'Trial' ? 30 : 365).toISOString(),
                      trialEndsAt: status === 'Trial' ? addDays(now, 30).toISOString() : undefined,
                    },
                  }
                : r,
            ),
          }),
          { type: 'rwa.status', description: `Join request approved — ${rwaName(id)} is now ${status}`, rwaId: id },
        )
      },

      rejectJoin(id) {
        commit(
          (s) => ({
            ...s,
            rwas: s.rwas.map((r) =>
              r.id === id ? { ...r, status: 'Deactivated', subscription: { ...r.subscription, status: 'Expired' } } : r,
            ),
          }),
          { type: 'rwa.status', description: `Join request from ${rwaName(id)} declined`, rwaId: id },
        )
      },

      saveMember(m) {
        const isNew = !stateRef.current.members.some((x) => x.id === m.id)
        commit((s) => ({ ...s, members: upsert(s.members, m) }), {
          type: isNew ? 'member.created' : 'member.updated',
          description: isNew ? `${m.name} (${m.flat}) added to ${rwaName(m.rwaId)}` : `${m.name} (${m.flat}) updated — ${m.status}`,
          rwaId: m.rwaId,
        })
      },

      addMembers(ms) {
        if (!ms.length) return
        commit((s) => ({ ...s, members: [...ms, ...s.members] }), {
          type: 'member.created',
          description: `${ms.length} residents imported via CSV into ${rwaName(ms[0].rwaId)}`,
          rwaId: ms[0].rwaId,
        })
      },

      saveStaff(st) {
        const isNew = !stateRef.current.staff.some((x) => x.id === st.id)
        commit((s) => ({ ...s, staff: upsert(s.staff, st) }), {
          type: isNew ? 'staff.created' : 'staff.updated',
          description: isNew
            ? `Staff account created for ${st.name} (${st.department})`
            : `${st.name} updated — ${st.department}, ${st.status}`,
          rwaId: st.rwaId,
        })
      },

      saveComplaint(c) {
        const isNew = !stateRef.current.complaints.some((x) => x.id === c.id)
        commit((s) => ({ ...s, complaints: upsert(s.complaints, c) }), {
          type: isNew ? 'complaint.created' : 'complaint.status',
          description: isNew ? `${c.code} raised: ${c.category} — ${c.flat}` : `${c.code} updated`,
          rwaId: c.rwaId,
        })
      },

      assignComplaint(id, staffId) {
        const actor = actorName()
        const st = stateRef.current.staff.find((x) => x.id === staffId)
        const c = stateRef.current.complaints.find((x) => x.id === id)
        if (!c) return
        const text = st ? `Assigned to ${st.name}` : 'Assignment removed'
        commit(
          (s) => ({
            ...s,
            complaints: s.complaints.map((x) =>
              x.id === id
                ? {
                    ...x,
                    staffId,
                    status: st && (x.status === 'New' || x.status === 'Open') ? 'Assigned' : x.status,
                    history: [...x.history, { at: new Date().toISOString(), actor, text }],
                  }
                : x,
            ),
          }),
          { type: 'complaint.assigned', description: `${c.code} ${st ? `assigned to ${st.name}` : 'unassigned'}`, rwaId: c.rwaId },
        )
      },

      setComplaintStatus(id, status, notes) {
        const actor = actorName()
        const c = stateRef.current.complaints.find((x) => x.id === id)
        if (!c) return
        commit(
          (s) => ({
            ...s,
            complaints: s.complaints.map((x) =>
              x.id === id
                ? {
                    ...x,
                    status,
                    resolutionNotes: notes ?? x.resolutionNotes,
                    history: [
                      ...x.history,
                      ...(status !== x.status ? [{ at: new Date().toISOString(), actor, text: `Status changed to ${status}` }] : []),
                      ...(notes !== undefined && notes !== x.resolutionNotes
                        ? [{ at: new Date().toISOString(), actor, text: 'Resolution notes updated' }]
                        : []),
                    ],
                  }
                : x,
            ),
          }),
          { type: 'complaint.status', description: `${c.code} ${status !== c.status ? `moved to ${status}` : 'notes updated'}`, rwaId: c.rwaId },
        )
      },

      saveAnnouncement(a) {
        const prev = stateRef.current.announcements.find((x) => x.id === a.id)
        const published = a.status === 'Published' && prev?.status !== 'Published'
        commit((s) => ({ ...s, announcements: upsert(s.announcements, a) }), {
          type: 'announcement.published',
          description: published ? `Announcement “${a.title}” published` : `Announcement “${a.title}” saved as ${a.status.toLowerCase()}`,
          rwaId: a.rwaId,
        })
      },

      deleteAnnouncement(id) {
        const a = stateRef.current.announcements.find((x) => x.id === id)
        commit((s) => ({ ...s, announcements: s.announcements.filter((x) => x.id !== id) }), {
          type: 'announcement.published',
          description: `Announcement “${a?.title}” deleted`,
          rwaId: a?.rwaId,
        })
      },

      saveBanner(b) {
        const prev = stateRef.current.banners.find((x) => x.id === b.id)
        const published = b.status === 'Published' && prev?.status !== 'Published'
        commit((s) => ({ ...s, banners: upsert(s.banners, { ...b, updatedAt: new Date().toISOString() }) }), {
          type: published ? 'banner.published' : 'banner.updated',
          description: published ? `Banner “${b.title}” published` : `Banner “${b.title}” ${prev ? 'updated' : 'created'} (${b.status})`,
        })
      },

      deleteBanner(id) {
        const b = stateRef.current.banners.find((x) => x.id === id)
        commit((s) => ({ ...s, banners: s.banners.filter((x) => x.id !== id) }), {
          type: 'banner.updated',
          description: `Banner “${b?.title}” deleted`,
        })
      },

      savePlan(p) {
        const isNew = !stateRef.current.plans.some((x) => x.id === p.id)
        commit((s) => ({ ...s, plans: isNew ? [...s.plans, p] : s.plans.map((x) => (x.id === p.id ? p : x)) }), {
          type: 'plan.updated',
          description: `${p.name} plan ${isNew ? 'created' : 'updated'} (${p.status})`,
        })
      },

      saveNotification(n) {
        const prev = stateRef.current.notifications.find((x) => x.id === n.id)
        commit((s) => ({ ...s, notifications: upsert(s.notifications, n) }), {
          type: 'notification.published',
          description:
            n.status === 'Published' && prev?.status !== 'Published'
              ? `Notification “${n.title}” published (simulated)`
              : `Notification “${n.title}” saved as draft`,
          rwaId: n.scope === 'society' ? n.rwaIds[0] : undefined,
        })
      },

      deleteNotification(id) {
        commit((s) => ({ ...s, notifications: s.notifications.filter((x) => x.id !== id) }))
      },

      savePermissions(p, summary) {
        commit((s) => ({ ...s, permissions: normalizePermissions(p) }), { type: 'permission.changed', description: summary })
      },

      updateSettings(settings) {
        commit((s) => ({ ...s, settings }), { type: 'settings.updated', description: 'Platform settings updated' })
      },

      resetDemo() {
        localStorage.removeItem(STATE_KEY)
        setState(createSeed())
        setSessionState({ role: 'super_admin', rwaId: 'rwa_green_valley' })
        setStorageWarning(null)
      },
    }
  }, [state, session, storageWarning, can, actorName, log, commit])

  return <StoreContext.Provider value={store}>{children}</StoreContext.Provider>
}

export function useStore() {
  const ctx = useContext(StoreContext)
  if (!ctx) throw new Error('useStore must be used inside StoreProvider')
  return ctx
}

/** The resident the demo impersonates in "Resident" mode: first active member of the society. */
export function demoResident(members: Member[], rwaId: string) {
  return members.find((m) => m.rwaId === rwaId && m.status === 'Active')
}
