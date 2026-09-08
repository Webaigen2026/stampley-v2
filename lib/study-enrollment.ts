import "server-only"

import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { redirect } from "next/navigation"
import { NextResponse } from "next/server"

export async function isParticipantEnrolled(userId: string): Promise<boolean> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { studyId: true },
  })
  return Boolean(user?.studyId)
}

export async function redirectIfUnenrolled() {
  const session = await auth()
  if (!session?.user?.id) redirect("/login")
  if (session.user.role !== "PARTICIPANT") return

  const enrolled = await isParticipantEnrolled(session.user.id)
  if (!enrolled) redirect("/enrollment")
}

export async function assertParticipantEnrolled(
  userId: string,
  role: string | undefined
) {
  if (role !== "PARTICIPANT") return
  const enrolled = await isParticipantEnrolled(userId)
  if (!enrolled) {
    throw new Error("A Study Key is required to join the AIDES-T2D study.")
  }
}

export async function enrollmentForbiddenResponse(session: {
  user?: { id?: string; role?: string }
} | null) {
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }
  if (session.user.role !== "PARTICIPANT") return null

  const enrolled = await isParticipantEnrolled(session.user.id)
  if (enrolled) return null

  return NextResponse.json(
    { error: "A Study Key is required to join the AIDES-T2D study." },
    { status: 403 }
  )
}
