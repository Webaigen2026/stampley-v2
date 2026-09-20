import "server-only"

import { redirect } from "next/navigation"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { appendAuditEventFailOpen, type AuditActor } from "@/lib/audit"
import { actorFromSession } from "@/lib/audit-admin"
import {
  hasAnyCapability,
  hasCapability,
  isStaffRole,
  type AdminCapability,
} from "@/lib/admin-capabilities"

export const GENERIC_ADMIN_ACTION_ERROR = "Unable to complete this action."

export async function requireStaffActor(): Promise<
  | { ok: true; actor: AuditActor }
  | { ok: false; error: typeof GENERIC_ADMIN_ACTION_ERROR }
> {
  const session = await auth()
  const actor = actorFromSession(session)
  if (!actor || !isStaffRole(actor.role)) {
    return { ok: false, error: GENERIC_ADMIN_ACTION_ERROR }
  }
  return { ok: true, actor }
}

export async function requireAdminCapability(
  capability: AdminCapability
): Promise<
  | { ok: true; actor: AuditActor }
  | { ok: false; error: typeof GENERIC_ADMIN_ACTION_ERROR }
> {
  const gate = await requireStaffActor()
  if (!gate.ok) return gate
  if (!hasCapability(gate.actor.role, capability)) {
    await appendAuditEventFailOpen(prisma, gate.actor, {
      action: "AUTH_ADMIN_ACCESS_DENIED",
      resourceType: "AUTH_SESSION",
      outcome: "DENIED",
    })
    return { ok: false, error: GENERIC_ADMIN_ACTION_ERROR }
  }
  return gate
}

export async function requireAdminPage(
  capability: AdminCapability | readonly AdminCapability[]
): Promise<AuditActor> {
  const session = await auth()
  const actor = actorFromSession(session)
  const allowed = Array.isArray(capability)
    ? hasAnyCapability(actor?.role, capability as readonly AdminCapability[])
    : hasCapability(actor?.role, capability as AdminCapability)

  if (!actor || !allowed) {
    if (actor) {
      await appendAuditEventFailOpen(prisma, actor, {
        action: "AUTH_ADMIN_ACCESS_DENIED",
        resourceType: "AUTH_SESSION",
        outcome: "DENIED",
      })
    }
    if (!session?.user?.id) {
      redirect("/login")
    }
    redirect("/admin/dashboard")
  }

  return actor
}

export async function requireStaffPage(): Promise<AuditActor> {
  const session = await auth()
  const actor = actorFromSession(session)
  if (!actor || !isStaffRole(actor.role)) {
    redirect("/login")
  }
  return actor
}
