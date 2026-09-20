"use server"

import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"
import { revalidatePath } from "next/cache"
import bcrypt from "bcryptjs"
import type { UserRole } from "@/lib/generated/prisma/client"
import { actorFromSession, isAdminActor } from "@/lib/audit-admin"
import { appendAuditEventFailOpen } from "@/lib/audit"
import {
  auditedCreateStudyKey,
  auditedCreateUser,
  auditedDeleteStudyKey,
  auditedDeleteUser,
  auditedToggleUserRole,
} from "@/lib/admin-audited-mutations"

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

async function requireAdminActor() {
  const session = await auth()
  const actor = actorFromSession(session)
  if (!isAdminActor(actor)) {
    return { error: "Unauthorized" as const, actor: null }
  }
  return { actor, error: null }
}

export async function generateStudyKey(formData: FormData) {
  const session = await auth()
  const actor = actorFromSession(session)
  if (!isAdminActor(actor)) {
    return { error: "Unauthorized" }
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
  const gate = await requireAdminActor()
  if (gate.error || !gate.actor) {
    return { error: "Unauthorized" }
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

export async function deleteUser(id: string) {
  const gate = await requireAdminActor()
  if (gate.error || !gate.actor) {
    return { error: "Unauthorized" }
  }
  try {
    const result = await prisma.$transaction((tx) =>
      auditedDeleteUser(tx, gate.actor, id)
    )
    if (!result.deleted) {
      return { error: "Failed to delete user" }
    }
    revalidatePath("/admin/users")
    return { success: true }
  } catch {
    console.error("[admin] deleteUser failed")
    return { error: "Failed to delete user" }
  }
}

export async function createUser(formData: FormData) {
  const gate = await requireAdminActor()
  if (gate.error || !gate.actor) {
    return { error: "Unauthorized" }
  }
  const email = formData.get("email") as string
  const password = formData.get("password") as string
  const role = formData.get("role") as string
  try {
    const hashedPassword = await bcrypt.hash(password, 10)
    await prisma.$transaction((tx) =>
      auditedCreateUser(tx, gate.actor, {
        email: email.toLowerCase(),
        passwordHash: hashedPassword,
        role: role as UserRole,
      })
    )
    revalidatePath("/admin/users")
    return { success: true }
  } catch {
    console.error("[admin] createUser failed")
    return { error: "Failed to create user" }
  }
}

export async function toggleUserRole(id: string, currentRole: string) {
  const gate = await requireAdminActor()
  if (gate.error || !gate.actor) {
    return { error: "Unauthorized" }
  }
  try {
    const result = await prisma.$transaction((tx) =>
      auditedToggleUserRole(tx, gate.actor, { id, currentRole })
    )
    if (!("newRole" in result)) {
      return { error: "Failed to update role" }
    }
    revalidatePath("/admin/users")
    return { success: true, newRole: result.newRole }
  } catch {
    console.error("[admin] toggleUserRole failed")
    return { error: "Failed to update role" }
  }
}
