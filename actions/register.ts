"use server"

import { prisma } from "@/lib/prisma"
import bcrypt from "bcryptjs"

class RegistrationRejected extends Error {
  constructor(message: string) {
    super(message)
    this.name = "RegistrationRejected"
  }
}

export async function registerWithKey(formData: FormData) {
  const studyId = formData.get("studyId") as string
  const email = formData.get("email") as string
  const password = formData.get("password") as string
  const confirmPassword = formData.get("confirmPassword") as string | null

  if (!studyId || !email || !password) {
    return { error: "All fields are required" }
  }

  if (confirmPassword != null && confirmPassword !== password) {
    return { error: "Passwords do not match." }
  }

  const normalizedEmail = email.toLowerCase()
  const normalizedStudyId = studyId.toUpperCase()

  try {
    const hashedPassword = await bcrypt.hash(password, 10)

    await prisma.$transaction(async (tx) => {
      const unusedKey = await tx.studyKey.findFirst({
        where: { key: normalizedStudyId, isUsed: false },
      })

      if (!unusedKey) {
        throw new RegistrationRejected("Invalid or already used Study ID")
      }

      const existingUser = await tx.user.findUnique({
        where: { email: normalizedEmail },
        select: { id: true },
      })

      if (existingUser) {
        throw new RegistrationRejected("Email already registered")
      }

      await tx.user.create({
        data: {
          email: normalizedEmail,
          password: hashedPassword,
          role: "PARTICIPANT",
          studyId: normalizedStudyId,
        },
      })

      const marked = await tx.studyKey.updateMany({
        where: { key: normalizedStudyId, isUsed: false },
        data: { isUsed: true },
      })

      if (marked.count !== 1) {
        throw new Error("Study key was not marked used")
      }
    })

    return { success: true }

  } catch (error) {
    if (error instanceof RegistrationRejected) {
      return { error: error.message }
    }
    console.error("[register] error:", error)
    return { error: "Something went wrong. Please try again." }
  }
}
