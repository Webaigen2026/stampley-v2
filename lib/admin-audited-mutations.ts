import type { UserRole } from "@/lib/generated/prisma/client"
import {
  appendAuditEvent,
  createAuditRequestId,
  type AuditActor,
  type AuditWriteClient,
} from "@/lib/audit"
import {
  LastAdminInvariantError,
  PrivilegedMutationRejected,
  assertCanRemovePrivilegedAdmin,
  withAdminInvariantLock,
  type AdminInvariantClient,
} from "@/lib/admin-last-admin"
import { isUserRole } from "@/lib/admin-capabilities"

type MutationClient = (AuditWriteClient | object) &
  AdminInvariantClient & {
    user: AdminInvariantClient["user"] & {
      create(args: {
        data: { email: string; password: string; role: UserRole }
        select: { id: true }
      }): Promise<{ id: string }>
      deleteMany(args: { where: { id: string } }): Promise<{ count: number }>
      updateMany(args: {
        where: { id: string }
        data: { role: UserRole; authVersion: { increment: 1 } }
      }): Promise<{ count: number }>
    }
    studyKey: {
      create(args: {
        data: { key: string; isUsed: boolean; createdBy: string | null }
        select: { id: true }
      }): Promise<{ id: string }>
      deleteMany(args: {
        where: { id: string; isUsed: false }
      }): Promise<{ count: number }>
    }
  }

export { LastAdminInvariantError, PrivilegedMutationRejected }

export async function auditedCreateUser(
  db: MutationClient,
  actor: AuditActor,
  args: { email: string; passwordHash: string; role: UserRole }
): Promise<{ id: string }> {
  const requestId = createAuditRequestId()
  const created = await db.user.create({
    data: {
      email: args.email,
      password: args.passwordHash,
      role: args.role,
    },
    select: { id: true },
  })
  await appendAuditEvent(db, actor, {
    action: "ADMIN_USER_CREATED",
    resourceType: "USER",
    resourceId: created.id,
    subjectUserId: created.id,
    outcome: "SUCCESS",
    requestId,
  })
  return created
}

export async function auditedDeleteUser(
  db: MutationClient,
  actor: AuditActor,
  subjectUserId: string
): Promise<{ deleted: boolean }> {
  if (actor.userId === subjectUserId) {
    throw new PrivilegedMutationRejected()
  }

  return withAdminInvariantLock(db, async () => {
    await assertCanRemovePrivilegedAdmin(db, subjectUserId)
    const requestId = createAuditRequestId()
    const deleted = await db.user.deleteMany({
      where: { id: subjectUserId },
    })
    if (deleted.count !== 1) {
      throw new PrivilegedMutationRejected()
    }
    await appendAuditEvent(db, actor, {
      action: "ADMIN_USER_DELETED",
      resourceType: "USER",
      resourceId: subjectUserId,
      subjectUserId,
      outcome: "SUCCESS",
      requestId,
    })
    return { deleted: true }
  })
}

export async function auditedChangeUserRole(
  db: MutationClient,
  actor: AuditActor,
  args: { id: string; toRole: UserRole }
): Promise<{ newRole: UserRole; fromRole: UserRole }> {
  if (actor.userId === args.id) {
    throw new PrivilegedMutationRejected()
  }
  if (!isUserRole(args.toRole)) {
    throw new PrivilegedMutationRejected()
  }

  return withAdminInvariantLock(db, async () => {
    const current = await db.user.findUnique({
      where: { id: args.id },
      select: { role: true },
    })
    if (!current || !isUserRole(current.role)) {
      throw new PrivilegedMutationRejected()
    }
    const fromRole = current.role as UserRole
    if (fromRole === "ADMIN" && args.toRole !== "ADMIN") {
      await assertCanRemovePrivilegedAdmin(db, args.id)
    }

    const requestId = createAuditRequestId()
    const updated = await db.user.updateMany({
      where: { id: args.id },
      data: {
        role: args.toRole,
        authVersion: { increment: 1 },
      },
    })
    if (updated.count !== 1) {
      throw new PrivilegedMutationRejected()
    }

    await appendAuditEvent(db, actor, {
      action: "ADMIN_ROLE_CHANGED",
      resourceType: "USER",
      resourceId: args.id,
      subjectUserId: args.id,
      outcome: "SUCCESS",
      requestId,
      metadata: { fromRole, toRole: args.toRole },
    })
    return { newRole: args.toRole, fromRole }
  })
}

export async function auditedCreateStudyKey(
  db: MutationClient,
  actor: AuditActor,
  args: { key: string; createdBy: string | null }
): Promise<{ id: string }> {
  const requestId = createAuditRequestId()
  const created = await db.studyKey.create({
    data: {
      key: args.key,
      isUsed: false,
      createdBy: args.createdBy,
    },
    select: { id: true },
  })
  await appendAuditEvent(db, actor, {
    action: "ADMIN_STUDY_KEY_CREATED",
    resourceType: "STUDY_KEY",
    resourceId: created.id,
    outcome: "SUCCESS",
    requestId,
  })
  return created
}

export async function auditedDeleteStudyKey(
  db: MutationClient,
  actor: AuditActor,
  studyKeyId: string
): Promise<{ deleted: boolean }> {
  const requestId = createAuditRequestId()
  const deleted = await db.studyKey.deleteMany({
    where: { id: studyKeyId, isUsed: false },
  })
  if (deleted.count !== 1) {
    return { deleted: false }
  }
  await appendAuditEvent(db, actor, {
    action: "ADMIN_STUDY_KEY_DELETED",
    resourceType: "STUDY_KEY",
    resourceId: studyKeyId,
    outcome: "SUCCESS",
    requestId,
  })
  return { deleted: true }
}
