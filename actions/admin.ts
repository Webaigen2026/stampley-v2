"use server"

import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"
import { revalidatePath } from "next/cache"
import bcrypt from "bcryptjs"
import type { UserRole } from "@/lib/generated/prisma/client"
import { actorFromSession } from "@/lib/audit-admin"
import { appendAuditEventFailOpen } from "@/lib/audit"
import {
  auditedChangeUserRole,
  auditedCreateStudyKey,
  auditedCreateUser,
  auditedDeleteStudyKey,
  auditedDeleteUser,
  LastAdminInvariantError,
  PrivilegedMutationRejected,
} from "@/lib/admin-audited-mutations"
import {
  canGrantRole,
  parseRequestedRole,
  requiresAdminStepUp,
} from "@/lib/admin-capabilities"
import {
  GENERIC_ADMIN_ACTION_ERROR,
  requireAdminCapability,
} from "@/lib/admin-authz"
import {
  GENERIC_STEP_UP_ERROR,
  readStepUpPassword,
  verifyActorStepUpPassword,
} from "@/lib/admin-step-up"

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

function generateKey(): string {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789"
  let key = "AIDES-"
  for (let i = 0; i < 6; i++) {
    key += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return key
}

function normalizeEmail(email: string) {
  return email.trim().toLowerCase()
}

export async function generateStudyKey(formData: FormData) {
  const session = await auth()
  const actor = actorFromSession(session)
  const gate = await requireAdminCapability("canManageStudyKeys")
  if (!gate.ok || !actor) {
    return { error: GENERIC_ADMIN_ACTION_ERROR }
  }

  const emailRaw = formData.get("email")
  const email = typeof emailRaw === "string" ? normalizeEmail(emailRaw) : ""

  if (!email) {
    return { error: "Email is required" }
  }

  if (!EMAIL_PATTERN.test(email)) {
    return { error: "Please enter a valid email address" }
  }

  const key = generateKey()
  let createdId: string
  try {
    const created = await prisma.$transaction((tx) =>
      auditedCreateStudyKey(tx, actor, {
        key,
        createdBy:
          typeof session?.user?.email === "string" ? session.user.email : null,
      })
    )
    createdId = created.id
  } catch {
    console.error("[admin] generateStudyKey failed")
    return { error: "Failed to generate key" }
  }

  try {
    const { sendStudyKeyEmail } = await import("@/lib/email")
    await sendStudyKeyEmail({ email, studyKey: key })
    await appendAuditEventFailOpen(prisma, actor, {
      action: "ADMIN_STUDY_KEY_EMAILED",
      resourceType: "STUDY_KEY",
      resourceId: createdId,
      outcome: "SUCCESS",
      metadata: { emailed: true },
    })
    return { success: true, key, emailed: true as const }
  } catch {
    console.error("[admin] generateStudyKey email failed")
    await appendAuditEventFailOpen(prisma, actor, {
      action: "ADMIN_STUDY_KEY_EMAILED",
      resourceType: "STUDY_KEY",
      resourceId: createdId,
      outcome: "FAILED",
      metadata: { emailed: false },
    })
    return {
      success: true,
      key,
      emailed: false as const,
      error: "Study key was created, but the email could not be sent.",
    }
  }
}

export async function deleteStudyKey(id: string) {
  const gate = await requireAdminCapability("canManageStudyKeys")
  if (!gate.ok) {
    return { error: GENERIC_ADMIN_ACTION_ERROR }
  }
  try {
    const result = await prisma.$transaction((tx) =>
      auditedDeleteStudyKey(tx, gate.actor, id)
    )
    if (!result.deleted) {
      return { error: "Failed to delete key" }
    }
    revalidatePath("/admin/keys")
    return { success: true }
  } catch {
    console.error("[admin] deleteStudyKey failed")
    return { error: "Failed to delete key" }
  }
}

export async function deleteUser(formData: FormData) {
  const gate = await requireAdminCapability("canDeleteUsers")
  if (!gate.ok) {
    return { error: GENERIC_ADMIN_ACTION_ERROR }
  }

  const idRaw = formData.get("userId")
  const id = typeof idRaw === "string" ? idRaw : ""
  if (!id) {
    return { error: GENERIC_ADMIN_ACTION_ERROR }
  }
  if (gate.actor.userId === id) {
    return { error: GENERIC_ADMIN_ACTION_ERROR }
  }

  const passwordOk = await verifyActorStepUpPassword(
    gate.actor.userId,
    readStepUpPassword(formData)
  )
  if (!passwordOk) {
    return { error: GENERIC_STEP_UP_ERROR }
  }

  try {
    await prisma.$transaction((tx) =>
      auditedDeleteUser(tx, gate.actor, id)
    )
    revalidatePath("/admin/users")
    return { success: true }
  } catch (error) {
    if (
      error instanceof LastAdminInvariantError ||
      error instanceof PrivilegedMutationRejected
    ) {
      return { error: GENERIC_ADMIN_ACTION_ERROR }
    }
    console.error("[admin] deleteUser failed")
    return { error: GENERIC_ADMIN_ACTION_ERROR }
  }
}

export async function createUser(formData: FormData) {
  const gate = await requireAdminCapability("canManageParticipants")
  if (!gate.ok) {
    return { error: GENERIC_ADMIN_ACTION_ERROR }
  }

  const emailRaw = formData.get("email")
  const passwordRaw = formData.get("password")
  const email =
    typeof emailRaw === "string" ? normalizeEmail(emailRaw) : ""
  const password = typeof passwordRaw === "string" ? passwordRaw : ""
  const requestedRole = parseRequestedRole(formData.get("role"))

  if (!email || !EMAIL_PATTERN.test(email) || !password) {
    return { error: GENERIC_ADMIN_ACTION_ERROR }
  }
  if (!requestedRole || !canGrantRole(gate.actor.role, requestedRole)) {
    return { error: GENERIC_ADMIN_ACTION_ERROR }
  }

  if (requiresAdminStepUp(requestedRole)) {
    const passwordOk = await verifyActorStepUpPassword(
      gate.actor.userId,
      readStepUpPassword(formData)
    )
    if (!passwordOk) {
      return { error: GENERIC_STEP_UP_ERROR }
    }
  }

  try {
    const hashedPassword = await bcrypt.hash(password, 10)
    await prisma.$transaction((tx) =>
      auditedCreateUser(tx, gate.actor, {
        email,
        passwordHash: hashedPassword,
        role: requestedRole as UserRole,
      })
    )
    revalidatePath("/admin/users")
    return { success: true }
  } catch {
    console.error("[admin] createUser failed")
    return { error: GENERIC_ADMIN_ACTION_ERROR }
  }
}

export async function changeUserRole(formData: FormData) {
  const gate = await requireAdminCapability("canManagePrivilegedUsers")
  if (!gate.ok) {
    return { error: GENERIC_ADMIN_ACTION_ERROR }
  }

  const idRaw = formData.get("userId")
  const id = typeof idRaw === "string" ? idRaw : ""
  const toRole = parseRequestedRole(formData.get("toRole"))
  if (!id || !toRole) {
    return { error: GENERIC_ADMIN_ACTION_ERROR }
  }
  if (gate.actor.userId === id) {
    return { error: GENERIC_ADMIN_ACTION_ERROR }
  }
  if (!canGrantRole(gate.actor.role, toRole)) {
    return { error: GENERIC_ADMIN_ACTION_ERROR }
  }

  if (requiresAdminStepUp(toRole)) {
    const passwordOk = await verifyActorStepUpPassword(
      gate.actor.userId,
      readStepUpPassword(formData)
    )
    if (!passwordOk) {
      return { error: GENERIC_STEP_UP_ERROR }
    }
  }

  try {
    const result = await prisma.$transaction((tx) =>
      auditedChangeUserRole(tx, gate.actor, {
        id,
        toRole: toRole as UserRole,
      })
    )
    revalidatePath("/admin/users")
    return { success: true, newRole: result.newRole }
  } catch (error) {
    if (
      error instanceof LastAdminInvariantError ||
      error instanceof PrivilegedMutationRejected
    ) {
      return { error: GENERIC_ADMIN_ACTION_ERROR }
    }
    console.error("[admin] changeUserRole failed")
    return { error: GENERIC_ADMIN_ACTION_ERROR }
  }
}
