"use server"

import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"
import { revalidatePath } from "next/cache"
import bcrypt from "bcryptjs"
import type { UserRole } from "@/lib/generated/prisma/client"

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
  if (!session || session.user?.role !== "ADMIN") {
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

  let key: string
  try {
    key = generateKey()
    await prisma.studyKey.create({
      data: {
        key,
        isUsed: false,
        createdBy: session.user.email,
      },
    })
    revalidatePath("/admin/keys")
  } catch (error) {
    console.error("[generateStudyKey]", error)
    return { error: "Failed to generate key" }
  }

  try {
    const { sendStudyKeyEmail } = await import("@/lib/email")
    await sendStudyKeyEmail({ email, studyKey: key })
    return { success: true, key, emailed: true as const }
  } catch (emailError) {
    console.error("[generateStudyKey] email failed:", emailError)
    return {
      success: true,
      key,
      emailed: false as const,
      error: "Study key was created, but the email could not be sent.",
    }
  }
}

export async function deleteStudyKey(id: string) {
  const session = await auth()
  if (!session || session.user?.role !== "ADMIN") {
    return { error: "Unauthorized" }
  }
  try {
    await prisma.studyKey.deleteMany({
      where: { id, isUsed: false },
    })
    revalidatePath("/admin/keys")
    return { success: true }
  } catch (error) {
    console.error("[deleteStudyKey]", error)
    return { error: "Failed to delete key" }
  }
}

export async function deleteUser(id: string) {
  const session = await auth()
  if (!session || session.user?.role !== "ADMIN") {
    return { error: "Unauthorized" }
  }
  try {
    await prisma.user.deleteMany({
      where: { id },
    })
    revalidatePath("/admin/users")
    return { success: true }
  } catch (error) {
    console.error("[deleteUser]", error)
    return { error: "Failed to delete user" }
  }
}

export async function createUser(formData: FormData) {
  const session = await auth()
  if (!session || session.user?.role !== "ADMIN") {
    return { error: "Unauthorized" }
  }
  const email = formData.get("email") as string
  const password = formData.get("password") as string
  const role = formData.get("role") as string
  try {
    const hashedPassword = await bcrypt.hash(password, 10)
    await prisma.user.create({
      data: {
        email: email.toLowerCase(),
        password: hashedPassword,
        role: role as UserRole,
      },
    })
    revalidatePath("/admin/users")
    return { success: true }
  } catch (error) {
    console.error("[createUser]", error)
    return { error: "Failed to create user" }
  }
}

export async function toggleUserRole(id: string, currentRole: string) {
  const session = await auth()
  if (!session || session.user?.role !== "ADMIN") {
    return { error: "Unauthorized" }
  }
  const newRole: UserRole = currentRole === "ADMIN" ? "PARTICIPANT" : "ADMIN"
  try {
    await prisma.user.updateMany({
      where: { id },
      data: { role: newRole },
    })
    revalidatePath("/admin/users")
    return { success: true, newRole }
  } catch (error) {
    console.error("[toggleUserRole]", error)
    return { error: "Failed to update role" }
  }
}
