export const runtime = "nodejs"
export const dynamic = "force-dynamic"

import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const body = await req.json()
    const {
      checkInSubmissionId,
      domain,
      stressLevel,
      mood,
      energy,
      userMessageCount,
      assistantMessageCount,
      summary,
      messages,
    } = body

    if (
      typeof checkInSubmissionId !== "string" ||
      !checkInSubmissionId.trim()
    ) {
      return NextResponse.json(
        { error: "checkInSubmissionId is required" },
        { status: 400 }
      )
    }

    const owned = await prisma.checkInSubmission.findFirst({
      where: {
        id: checkInSubmissionId.trim(),
        userId: session.user.id,
      },
      select: { id: true },
    })

    if (!owned) {
      return NextResponse.json(
        { error: "Check-in not found" },
        { status: 404 }
      )
    }

    await prisma.stampleyChatSession.create({
      data: {
        userId: session.user.id,
        checkInSubmissionId: checkInSubmissionId.trim(),
        domain: typeof domain === "string" ? domain : null,
        stressLevel: Number.isFinite(Number(stressLevel))
          ? Number(stressLevel)
          : null,
        mood: Number.isFinite(Number(mood)) ? Number(mood) : null,
        energy: Number.isFinite(Number(energy)) ? Number(energy) : null,
        userMessageCount: Number.isFinite(Number(userMessageCount))
          ? Number(userMessageCount)
          : 0,
        assistantMessageCount: Number.isFinite(Number(assistantMessageCount))
          ? Number(assistantMessageCount)
          : 0,
        summary: typeof summary === "string" ? summary : null,
        messages: Array.isArray(messages) ? messages : [],
      },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("[stampley/session]", error)
    return NextResponse.json(
      { error: "Failed to save chat session" },
      { status: 500 }
    )
  }
}
