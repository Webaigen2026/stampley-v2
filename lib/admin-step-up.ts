import "server-only"

import { prisma } from "@/lib/prisma"
import { verifyPassword } from "@/lib/auth-throttle"

export const GENERIC_STEP_UP_ERROR = "Unable to complete this action."

export function readStepUpPassword(formData: FormData): string {
  const raw = formData.get("currentPassword")
  return typeof raw === "string" ? raw : ""
}

export { requiresAdminStepUp } from "@/lib/admin-capabilities"

export async function verifyActorStepUpPassword(
  actorUserId: string,
  password: string
): Promise<boolean> {
  if (!actorUserId || typeof password !== "string" || password.length === 0) {
    return false
  }

  const user = await prisma.user.findUnique({
    where: { id: actorUserId },
    select: { password: true },
  })
  if (!user?.password) {
    return false
  }

  try {
    return await verifyPassword(password, user.password)
  } catch {
    return false
  }
}
