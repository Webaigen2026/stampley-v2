"use server"

import { prisma } from "@/lib/prisma"
import crypto from "crypto"

const ONE_HOUR_MS = 60 * 60 * 1000

class PasswordResetRejected extends Error {
  constructor(message: string) {
    super(message)
    this.name = "PasswordResetRejected"
  }
}

export async function requestPasswordReset(formData: FormData) {
  const email = formData.get("email") as string

  if (!email) return { error: "Email is required" }

  try {
    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
      select: { id: true },
    })

    // Always return success even if user not found (security best practice)
    if (!user) {
      return { success: true }
    }

    const token = crypto.randomBytes(32).toString("hex")
    const tokenHash = crypto
      .createHash("sha256")
      .update(token)
      .digest("hex")

    await prisma.$transaction([
      prisma.passwordResetToken.deleteMany({
        where: { userId: user.id },
      }),
      prisma.passwordResetToken.create({
        data: {
          userId: user.id,
          tokenHash,
          expiresAt: new Date(Date.now() + ONE_HOUR_MS),
        },
      }),
    ])

    // Send email
    try {
      const { sendPasswordResetEmail } = await import("@/lib/email")
      await sendPasswordResetEmail(email.toLowerCase(), token)
      console.log(`[password-reset] email sent to ${email}`)
    } catch (emailError) {
      // Log but don't fail — token is saved, email can be resent
      console.error("[password-reset] email failed:", emailError)
      // Fallback: log token for manual testing
      console.log(`[password-reset] fallback link: /reset-password?token=${token}`)
    }

    return { success: true }

  } catch (error) {
    console.error("[requestPasswordReset]", error)
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

    await prisma.$transaction(async (tx) => {
      const tokenRow = await tx.passwordResetToken.findFirst({
        where: {
          tokenHash,
          expiresAt: { gt: new Date() },
        },
      })

      if (!tokenRow) {
        throw new PasswordResetRejected(
          "Reset link is invalid or has expired. Please request a new one."
        )
      }

      const bcrypt = await import("bcryptjs")
      const hashedPassword = await bcrypt.hash(password, 10)

      const consumed = await tx.passwordResetToken.deleteMany({
        where: {
          id: tokenRow.id,
          tokenHash,
          expiresAt: { gt: new Date() },
        },
      })

      if (consumed.count !== 1) {
        throw new PasswordResetRejected(
          "Reset link is invalid or has expired. Please request a new one."
        )
      }

      await tx.user.updateMany({
        where: { id: tokenRow.userId },
        data: { password: hashedPassword },
      })
    })

    return { success: true }

  } catch (error) {
    if (error instanceof PasswordResetRejected) {
      return { error: error.message }
    }
    console.error("[resetPassword]", error)
    return { error: "Something went wrong. Please try again." }
  }
}
