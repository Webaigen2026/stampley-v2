import {
  checkinsCompletedInWeek,
  computeStudyWeekAndDayFromCheckInNumber,
  STUDY_TOTAL_CHECKINS,
} from "@/lib/check-in-utils"
import { isCheckInDomain } from "@/lib/check-in-subscale"
import type { Domain } from "@/store/checkin-store"

export const STUDY_DOMAINS: Domain[] = [
  "Emotional",
  "Regimen",
  "Physician",
  "Interpersonal",
]

export type WeeklyDomainRow = {
  week_number: number
  domain: string
}

/** Study week for the next check-in based on completed count (0 → week 1, 5 → week 2, …). */
export function getStudyWeekForNextCheckIn(totalCompleted: number): number {
  const completed = Math.max(Math.floor(Number(totalCompleted)) || 0, 0)
  const nextCheckInNumber = Math.min(completed + 1, STUDY_TOTAL_CHECKINS)
  return computeStudyWeekAndDayFromCheckInNumber(nextCheckInNumber).weekNumber
}

export function getDomainForStudyWeek(
  rows: WeeklyDomainRow[],
  weekNumber: number
): Domain | null {
  const row = rows.find((r) => r.week_number === weekNumber)
  const domain = row?.domain
  return isCheckInDomain(domain) ? domain : null
}

export function getUsedDomainsFromPreviousWeeks(
  rows: WeeklyDomainRow[],
  currentWeek: number
): Domain[] {
  return rows
    .filter((r) => r.week_number < currentWeek)
    .map((r) => r.domain)
    .filter((d): d is Domain => isCheckInDomain(d))
}

export function isWeeklyDomainLocked(
  totalCompleted: number,
  weekNumber: number,
  weekDomain: string | null
): boolean {
  if (!weekDomain) return false
  return checkinsCompletedInWeek(totalCompleted, weekNumber) > 0
}

export function isDomainSelectable(
  domain: Domain,
  usedPreviousDomains: Domain[],
  currentWeekDomain: Domain | null,
  isLocked: boolean
): boolean {
  if (isLocked) {
    return currentWeekDomain === domain
  }
  if (usedPreviousDomains.includes(domain)) {
    return false
  }
  return true
}

export const MISSING_WEEKLY_FOCUS_MESSAGE =
  "Weekly focus is missing. Open Weekly Domain and continue again."

export const PRIOR_WEEK_DOMAIN_REUSE_MESSAGE =
  "You already completed this domain in a previous week."

export type ResolveSubmitWeeklyDomainResult =
  | { ok: true; domain: Domain; shouldPersist: boolean }
  | { ok: false; error: string }

/**
 * Authoritative weekly-domain decision for check-in submit.
 * A stored current-week row always wins. Otherwise the requested domain
 * may be accepted only if it is allowlisted and unused in a prior week.
 */
export function resolveSubmitWeeklyDomain(args: {
  weekNumber: number
  weeklyRows: WeeklyDomainRow[]
  requestedDomain: unknown
}): ResolveSubmitWeeklyDomainResult {
  const stored = getDomainForStudyWeek(args.weeklyRows, args.weekNumber)
  if (stored) {
    return { ok: true, domain: stored, shouldPersist: false }
  }

  if (
    !isCheckInDomain(args.requestedDomain) ||
    !STUDY_DOMAINS.includes(args.requestedDomain)
  ) {
    return { ok: false, error: MISSING_WEEKLY_FOCUS_MESSAGE }
  }

  const usedPrevious = getUsedDomainsFromPreviousWeeks(
    args.weeklyRows,
    args.weekNumber
  )
  if (usedPrevious.includes(args.requestedDomain)) {
    return { ok: false, error: PRIOR_WEEK_DOMAIN_REUSE_MESSAGE }
  }

  return {
    ok: true,
    domain: args.requestedDomain,
    shouldPersist: true,
  }
}

/** After a unique (userId, weekNumber) conflict, the stored row wins. */
export function authoritativeDomainFromConflictRow(
  domain: unknown
): Domain | null {
  return isCheckInDomain(domain) ? domain : null
}
