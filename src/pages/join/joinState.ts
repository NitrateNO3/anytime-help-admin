import { useOutletContext } from 'react-router-dom'
import type { RwaDraft } from '../../components/rwaFields'

export interface JoinDraft {
  planId: string
  rwa: RwaDraft
  result?: { rwaId: string; mode: 'approval' | 'purchase'; reference: string }
}

export interface JoinContext {
  draft: JoinDraft
  setDraft: (d: JoinDraft) => void
  reset: () => void
}

export const JOIN_DRAFT_KEY = 'anytime-help-join-draft'

/** Clears the saved draft without re-rendering the join flow (used when leaving it). */
export function clearJoinDraft() {
  try {
    sessionStorage.removeItem(JOIN_DRAFT_KEY)
  } catch {
    /* ignore */
  }
}

export const useJoin = () => useOutletContext<JoinContext>()
