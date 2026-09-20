/**
 * HIPAA-4 last-admin invariant.
 *
 * Privileged ADMIN demotion/deletion is serialized with a transaction-scoped
 * PostgreSQL advisory lock. Concurrent transactions that could remove the
 * final ADMIN must wait for this lock, re-read the target, recount remaining
 * ADMIN users, and reject if the mutation would leave zero ADMIN.
 *
 * Lock key 748392001 is application-fixed for this invariant only.
 */

export const ADMIN_INVARIANT_LOCK_KEY = 748392001

export class LastAdminInvariantError extends Error {
  constructor() {
    super("Unable to complete this action.")
    this.name = "LastAdminInvariantError"
  }
}

export class PrivilegedMutationRejected extends Error {
  constructor() {
    super("Unable to complete this action.")
    this.name = "PrivilegedMutationRejected"
  }
}

export type AdminInvariantClient = {
  $executeRaw(query: TemplateStringsArray, ...values: unknown[]): Promise<unknown>
  user: {
    findUnique(args: {
      where: { id: string }
      select: { role: true }
    }): Promise<{ role: string } | null>
    count(args: {
      where: { role: "ADMIN"; id: { not: string } }
    }): Promise<number>
  }
}

export function wouldLeaveZeroAdmins(
  remainingAdminsExcludingTarget: number,
  targetIsAdmin: boolean
): boolean {
  return targetIsAdmin && remainingAdminsExcludingTarget < 1
}

export async function acquireAdminInvariantLock(
  db: Pick<AdminInvariantClient, "$executeRaw">
): Promise<void> {
  await db.$executeRaw`SELECT pg_advisory_xact_lock(${ADMIN_INVARIANT_LOCK_KEY})`
}

export async function assertCanRemovePrivilegedAdmin(
  db: AdminInvariantClient,
  targetUserId: string
): Promise<void> {
  const target = await db.user.findUnique({
    where: { id: targetUserId },
    select: { role: true },
  })
  if (!target) {
    throw new PrivilegedMutationRejected()
  }
  if (target.role !== "ADMIN") {
    return
  }
  const remaining = await db.user.count({
    where: { role: "ADMIN", id: { not: targetUserId } },
  })
  if (wouldLeaveZeroAdmins(remaining, true)) {
    throw new LastAdminInvariantError()
  }
}

export async function withAdminInvariantLock<T>(
  db: AdminInvariantClient,
  fn: () => Promise<T>
): Promise<T> {
  await acquireAdminInvariantLock(db)
  return fn()
}
