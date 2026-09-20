"use server"

import { headers } from "next/headers"
import { prisma } from "@/lib/prisma"
import {
  PasswordResetRejected,
  applyVerifiedPasswordReset,
} from "@/lib/auth-throttle"
import { recordPasswordResetCompletedFailOpen } from "@/lib/audit-auth-events"
import {
  createPrismaPasswordResetIpThrottleStore,
  createPrismaPasswordResetTokenIssuer,
  executePasswordResetRequest,
} from "@/lib/password-reset-throttle"
import crypto from "crypto"

export async function requestPasswordReset(formData: FormData): Promise<{
  success?: true
  error?: string
}> {
  try {
    const headerList = await headers()
    return await executePasswordResetRequest(formData.get("email"), {
      headers: headerList,
      users: {
        findByEmail: (email) =>
          prisma.user.findUnique({
            where: { email },
            select: { id: true },
          }),
      },
      tokens: createPrismaPasswordResetTokenIssuer(prisma),
      ipThrottle: createPrismaPasswordResetIpThrottleStore(prisma),
      sendEmail: async (email, token) => {
        const { sendPasswordResetEmail } = await import("@/lib/email")
        await sendPasswordResetEmail(email, token)
      },
      deleteTokenById: async (tokenId) => {
        await prisma.passwordResetToken.deleteMany({
          where: { id: tokenId },
        })
      },
    })
  } catch {
    console.error("[auth] password reset request failed")
    return { error: "Something went wrong. Please try again." }
  }
}

export async function resetPassword(formData: FormData) {
  const token = formData.get("token") as string
  const password = formData.get("password") as string
  const confirmPassword = formData.get("confirmPassword") as string

  if (!token || !password || !confirmPassword) {
    return { error: "All fields are required" }
  }

  if (password !== confirmPassword) {
    return { error: "Passwords do not match" }
  }

  if (password.length < 8) {
    return { error: "Password must be at least 8 characters" }
  }

  try {
    const tokenHash = crypto
      .createHash("sha256")
      .update(token)
      .digest("hex")

    const bcrypt = await import("bcryptjs")
    const hashedPassword = await bcrypt.hash(password, 10)

    const preview = await prisma.passwordResetToken.findFirst({
      where: { tokenHash, expiresAt: { gt: new Date() } },
      select: { userId: true },
    })

    await prisma.$transaction(async (tx) => {
      await applyVerifiedPasswordReset(tx, { tokenHash, hashedPassword })
    })

    await recordPasswordResetCompletedFailOpen(
      prisma,
      preview?.userId ?? null
    )

    return { success: true }

  } catch (error) {
    if (error instanceof PasswordResetRejected) {
      return { error: error.message }
    }
    console.error("[auth] password reset completion failed")
    return { error: "Something went wrong. Please try again." }
  }
}
