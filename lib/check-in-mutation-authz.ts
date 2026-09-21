import { isParticipantRole } from "@/lib/admin-capabilities"

export const CHECK_IN_MUTATION_UNAUTHORIZED = "Unauthorized"
export const CHECK_IN_MUTATION_FORBIDDEN = "Forbidden"

export type CheckInMutationSession = {
  user?: {
    id?: string | null
    role?: unknown
  } | null
} | null | undefined

export type CheckInMutationAccess =
  | { ok: true; userId: string }
  | { ok: false; status: 401; error: typeof CHECK_IN_MUTATION_UNAUTHORIZED }
  | { ok: false; status: 403; error: typeof CHECK_IN_MUTATION_FORBIDDEN }

/** Session-id + PARTICIPANT role gate for Daily Check-In mutations. */
export function resolveCheckInMutationAccess(
  session: CheckInMutationSession
): CheckInMutationAccess {
  const userId = session?.user?.id
  if (typeof userId !== "string" || userId.length === 0) {
    return {
      ok: false,
      status: 401,
      error: CHECK_IN_MUTATION_UNAUTHORIZED,
    }
  }

  if (!isParticipantRole(session?.user?.role)) {
    return {
      ok: false,
      status: 403,
      error: CHECK_IN_MUTATION_FORBIDDEN,
    }
  }

  return { ok: true, userId }
}
