"use server"

import { createHash, randomInt, timingSafeEqual } from "crypto"
import { cookies } from "next/headers"
import bcrypt from "bcryptjs"
import { prisma } from "@/lib/prisma"

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const CODE_TTL_MS = 10 * 60 * 1000
const RESEND_COOLDOWN_MS = 60 * 1000
const MAX_ATTEMPTS = 5
const PENDING_EMAIL_COOKIE = "registration_pending_email"
const COOKIE_MAX_AGE_SEC = 15 * 60

class RegistrationRejected extends Error {
  constructor(message: string) {
    super(message)
    this.name = "RegistrationRejected"
  }
}

function hashVerificationCode(code: string) {
  return createHash("sha256").update(code).digest("hex")
}

function generateVerificationCode() {
  return randomInt(0, 1_000_000).toString().padStart(6, "0")
}

function codesMatch(expectedHash: string, submittedCode: string) {
  const submittedHash = hashVerificationCode(submittedCode)
  const expected = Buffer.from(expectedHash)
  const actual = Buffer.from(submittedHash)
  if (expected.length !== actual.length) return false
  return timingSafeEqual(expected, actual)
}

function cookieOptions() {
  return {
    httpOnly: true,
    sameSite: "lax" as const,
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: COOKIE_MAX_AGE_SEC,
  }
}

async function setPendingEmailCookie(email: string) {
  const jar = await cookies()
  jar.set(PENDING_EMAIL_COOKIE, email, cookieOptions())
}

async function clearPendingEmailCookie() {
  const jar = await cookies()
  jar.delete(PENDING_EMAIL_COOKIE)
}

export async function getPendingRegistrationEmail() {
  const jar = await cookies()
  const email = jar.get(PENDING_EMAIL_COOKIE)?.value?.trim().toLowerCase()
  return email || null
}

async function persistVerification(params: {
  email: string
  passwordHash: string
  studyKey: string | null
  codeHash: string
  now: Date
}) {
  const expiresAt = new Date(params.now.getTime() + CODE_TTL_MS)
  await prisma.registrationVerification.upsert({
    where: { email: params.email },
    create: {
      email: params.email,
      passwordHash: params.passwordHash,
      studyKey: params.studyKey,
      codeHash: params.codeHash,
      expiresAt,
      attempts: 0,
      lastSentAt: params.now,
    },
    update: {
      passwordHash: params.passwordHash,
      studyKey: params.studyKey,
      codeHash: params.codeHash,
      expiresAt,
      attempts: 0,
      lastSentAt: params.now,
    },
  })
}

export async function registerWithKey(formData: FormData) {
  const studyIdRaw = String(formData.get("studyId") || "").trim()
  const email = String(formData.get("email") || "").trim()
  const password = String(formData.get("password") || "")
  const confirmPassword = formData.get("confirmPassword") as string | null

  if (!email || !password) {
    return { error: "Email and password are required" }
  }

  if (confirmPassword != null && confirmPassword !== password) {
    return { error: "Passwords do not match." }
  }

  if (!EMAIL_PATTERN.test(email)) {
    return { error: "Please enter a valid email address" }
  }

  if (password.length < 8) {
    return { error: "Password must be at least 8 characters" }
  }

  const normalizedEmail = email.toLowerCase()
  const normalizedStudyId = studyIdRaw ? studyIdRaw.toUpperCase() : null

  try {
    const existingUser = await prisma.user.findUnique({
      where: { email: normalizedEmail },
      select: { id: true },
    })

    if (existingUser) {
      return { error: "Email already registered" }
    }

    if (normalizedStudyId) {
      const unusedKey = await prisma.studyKey.findFirst({
        where: { key: normalizedStudyId, isUsed: false },
        select: { id: true },
      })
      if (!unusedKey) {
        return { error: "Invalid or already used Study ID" }
      }
    }

    const hashedPassword = await bcrypt.hash(password, 10)
    const code = generateVerificationCode()
    const codeHash = hashVerificationCode(code)
    const now = new Date()

    await persistVerification({
      email: normalizedEmail,
      passwordHash: hashedPassword,
      studyKey: normalizedStudyId,
      codeHash,
      now,
    })

    try {
      const { sendRegistrationVerificationEmail } = await import("@/lib/email")
      await sendRegistrationVerificationEmail({
        email: normalizedEmail,
        code,
      })
    } catch (emailError) {
      await prisma.registrationVerification.deleteMany({
        where: { email: normalizedEmail },
      })
      console.error("[register] verification email failed:", emailError)
      return { error: "Could not send a verification email. Please try again." }
    }

    await setPendingEmailCookie(normalizedEmail)
    return { success: true }
  } catch (error) {
    if (error instanceof RegistrationRejected) {
      return { error: error.message }
    }
    console.error("[register] error:", error)
    return { error: "Something went wrong. Please try again." }
  }
}

export async function verifyRegistration(formData: FormData) {
  const submittedCode = String(formData.get("code") || "").replace(/\D/g, "")
  const pendingEmail = await getPendingRegistrationEmail()

  if (!pendingEmail) {
    return { error: "This verification session has expired. Please register again." }
  }

  if (submittedCode.length !== 6) {
    return { error: "Enter the 6-digit verification code." }
  }

  try {
    const record = await prisma.registrationVerification.findUnique({
      where: { email: pendingEmail },
    })

    if (!record) {
      await clearPendingEmailCookie()
      return { error: "This verification session has expired. Please register again." }
    }

    const now = new Date()

    if (record.expiresAt.getTime() <= now.getTime()) {
      await prisma.registrationVerification.deleteMany({
        where: { id: record.id },
      })
      await clearPendingEmailCookie()
      return { error: "Verification code expired" }
    }

    if (record.attempts >= MAX_ATTEMPTS) {
      await prisma.registrationVerification.deleteMany({
        where: { id: record.id },
      })
      await clearPendingEmailCookie()
      return { error: "Too many attempts. Please register again." }
    }

    if (!codesMatch(record.codeHash, submittedCode)) {
      const nextAttempts = record.attempts + 1
      if (nextAttempts >= MAX_ATTEMPTS) {
        await prisma.registrationVerification.deleteMany({
          where: { id: record.id },
        })
        await clearPendingEmailCookie()
        return { error: "Too many attempts. Please register again." }
      }

      await prisma.registrationVerification.update({
        where: { id: record.id },
        data: { attempts: nextAttempts },
      })
      return { error: "Verification code invalid" }
    }

    await prisma.$transaction(async (tx) => {
      const verification = await tx.registrationVerification.findUnique({
        where: { id: record.id },
      })

      if (!verification || verification.email !== pendingEmail) {
        throw new RegistrationRejected(
          "This verification session has expired. Please register again."
        )
      }

      if (verification.expiresAt.getTime() <= Date.now()) {
        await tx.registrationVerification.deleteMany({
          where: { id: verification.id },
        })
        throw new RegistrationRejected("Verification code expired")
      }

      if (verification.attempts >= MAX_ATTEMPTS) {
        await tx.registrationVerification.deleteMany({
          where: { id: verification.id },
        })
        throw new RegistrationRejected("Too many attempts. Please register again.")
      }

      if (!codesMatch(verification.codeHash, submittedCode)) {
        throw new RegistrationRejected("Verification code invalid")
      }

      const existingUser = await tx.user.findUnique({
        where: { email: verification.email },
        select: { id: true },
      })
      if (existingUser) {
        await tx.registrationVerification.deleteMany({
          where: { id: verification.id },
        })
        throw new RegistrationRejected("Email already registered")
      }

      const studyKey = verification.studyKey

      await tx.user.create({
        data: {
          email: verification.email,
          password: verification.passwordHash,
          role: "PARTICIPANT",
          studyId: studyKey,
        },
      })

      if (studyKey) {
        const claimed = await tx.studyKey.updateMany({
          where: { key: studyKey, isUsed: false },
          data: { isUsed: true },
        })
        if (claimed.count !== 1) {
          throw new RegistrationRejected("Invalid or already used Study ID")
        }
      }

      const consumed = await tx.registrationVerification.deleteMany({
        where: { id: verification.id },
      })
      if (consumed.count !== 1) {
        throw new Error("Verification record was not consumed")
      }
    })

    await clearPendingEmailCookie()
    return { success: true }
  } catch (error) {
    if (error instanceof RegistrationRejected) {
      if (
        error.message === "This verification session has expired. Please register again." ||
        error.message === "Verification code expired" ||
        error.message === "Too many attempts. Please register again." ||
        error.message === "Email already registered"
      ) {
        await clearPendingEmailCookie()
      }
      return { error: error.message }
    }
    console.error("[verifyRegistration] error:", error)
    return { error: "Something went wrong. Please try again." }
  }
}

export async function resendRegistrationCode() {
  const pendingEmail = await getPendingRegistrationEmail()
  if (!pendingEmail) {
    return { error: "This verification session has expired. Please register again." }
  }

  try {
    const record = await prisma.registrationVerification.findUnique({
      where: { email: pendingEmail },
    })

    if (!record) {
      await clearPendingEmailCookie()
      return { error: "This verification session has expired. Please register again." }
    }

    const now = new Date()
    const elapsed = now.getTime() - record.lastSentAt.getTime()
    if (elapsed < RESEND_COOLDOWN_MS) {
      const wait = Math.ceil((RESEND_COOLDOWN_MS - elapsed) / 1000)
      return { error: `Please wait ${wait} seconds before requesting another code.` }
    }

    const existingUser = await prisma.user.findUnique({
      where: { email: pendingEmail },
      select: { id: true },
    })
    if (existingUser) {
      await prisma.registrationVerification.deleteMany({
        where: { id: record.id },
      })
      await clearPendingEmailCookie()
      return { error: "Email already registered" }
    }

    if (record.studyKey) {
      const unusedKey = await prisma.studyKey.findFirst({
        where: { key: record.studyKey, isUsed: false },
        select: { id: true },
      })
      if (!unusedKey) {
        return { error: "Invalid or already used Study ID" }
      }
    }

    const code = generateVerificationCode()
    const codeHash = hashVerificationCode(code)
    const expiresAt = new Date(now.getTime() + CODE_TTL_MS)

    await prisma.registrationVerification.update({
      where: { id: record.id },
      data: {
        codeHash,
        expiresAt,
        attempts: 0,
        lastSentAt: now,
      },
    })

    try {
      const { sendRegistrationVerificationEmail } = await import("@/lib/email")
      await sendRegistrationVerificationEmail({
        email: pendingEmail,
        code,
      })
    } catch (emailError) {
      console.error("[resendRegistrationCode] email failed:", emailError)
      return { error: "Could not send a verification email. Please try again." }
    }

    await setPendingEmailCookie(pendingEmail)
    return { success: true }
  } catch (error) {
    console.error("[resendRegistrationCode] error:", error)
    return { error: "Something went wrong. Please try again." }
  }
}
