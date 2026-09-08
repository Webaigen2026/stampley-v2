export const runtime = "nodejs"
export const dynamic = "force-dynamic"

import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { Prisma } from "@/lib/generated/prisma/client"
import { getSubscaleForDay } from "@/lib/check-in-subscale"
import {
  computeStudyWeekAndDayFromCheckInNumber,
  STUDY_COMPLETE_MESSAGE,
  STUDY_TOTAL_CHECKINS,
} from "@/lib/check-in-utils"
import { resolveWeeklyDomainForUser } from "@/lib/resolve-weekly-domain"
import { STUDY_DOMAINS } from "@/lib/weekly-domain-progress"

const DUPLICATE_CHECK_IN_MESSAGE =
  "You have already completed today's check-in."

class DuplicateCheckInError extends Error {
  constructor() {
    super(DUPLICATE_CHECK_IN_MESSAGE)
    this.name = "DuplicateCheckInError"
  }
}

function isUniqueViolation(error: unknown): boolean {
  if (
    error instanceof Prisma.PrismaClientKnownRequestError &&
    error.code === "P2002"
  ) {
    return true
  }
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    (error as { code: string }).code === "23505"
  )
}

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const body = await req.json()
    const { distress, mood, energy, contextTags, reflection, copingAction } = body

    const { domain } = await resolveWeeklyDomainForUser(
      session.user.id,
      body.domain
    )

    if (!domain || !STUDY_DOMAINS.includes(domain)) {
      return NextResponse.json(
        { error: "Weekly focus is missing. Open Weekly Domain and continue again." },
        { status: 400 }
      )
    }

    const existingToday = await prisma.$queryRaw<Array<{ id: string }>>`
      SELECT id
      FROM check_in_submissions
      WHERE user_id = ${session.user.id}
        AND check_in_date = CURRENT_DATE
      LIMIT 1
    `

    if (existingToday.length > 0) {
      return NextResponse.json(
        { error: DUPLICATE_CHECK_IN_MESSAGE },
        { status: 409 }
      )
    }

    const progress = await prisma.userStudyProgress.findUnique({
      where: { userId: session.user.id },
      select: { totalCheckins: true },
    })

    const totalCheckins = Number(progress?.totalCheckins ?? 0)

    if (totalCheckins >= STUDY_TOTAL_CHECKINS) {
      return NextResponse.json({ error: STUDY_COMPLETE_MESSAGE }, { status: 403 })
    }

    const checkInNumber = totalCheckins + 1
    const { weekNumber, dayNumber } =
      computeStudyWeekAndDayFromCheckInNumber(checkInNumber)
    const subscale = getSubscaleForDay(domain, dayNumber)

    const { checkInSubmissionId, needsSafetyEscalation } = await prisma.$transaction(
      async (tx) => {
        const prev = await tx.checkInSubmission.findFirst({
          where: { userId: session.user.id },
          orderBy: { createdAt: "desc" },
          select: {
            distress: true,
            consecutiveHighDistressDays: true,
          },
        })

        const consecutiveDays =
          prev && prev.distress >= 9 && distress >= 9
            ? (prev.consecutiveHighDistressDays || 0) + 1
            : distress >= 9 ? 1 : 0

        const needsSafetyEscalation = consecutiveDays >= 2

        let created
        try {
          created = await tx.checkInSubmission.create({
            data: {
              userId: session.user.id,
              domain,
              subscale,
              distress,
              mood,
              energy,
              reflection,
              copingAction,
              contextTags: contextTags ?? Prisma.DbNull,
              needsSafetyEscalation,
              consecutiveHighDistressDays: consecutiveDays,
              weekNumber,
              dayNumber,
            },
            select: { id: true },
          })
        } catch (insertError) {
          if (isUniqueViolation(insertError)) {
            throw new DuplicateCheckInError()
          }
          throw insertError
        }

        await tx.userStudyProgress.upsert({
          where: { userId: session.user.id },
          create: {
            userId: session.user.id,
            currentWeek: weekNumber,
            totalCheckins: 1,
            consecutiveHighDistressDays: consecutiveDays,
          },
          update: {
            currentWeek: weekNumber,
            totalCheckins: { increment: 1 },
            consecutiveHighDistressDays: consecutiveDays,
            updatedAt: new Date(),
          },
        })

        await tx.$executeRaw`
          UPDATE user_study_progress
          SET last_checkin_date = CURRENT_DATE
          WHERE user_id = ${session.user.id}
        `

        return {
          checkInSubmissionId: created.id,
          needsSafetyEscalation,
        }
      }
    )

    return NextResponse.json({
      success: true,
      id: checkInSubmissionId,
      checkInSubmissionId,
      needsSafetyEscalation,
      subscale,
      dayNumber,
      weekNumber,
    })

  } catch (error) {
    if (error instanceof DuplicateCheckInError || isUniqueViolation(error)) {
      return NextResponse.json(
        { error: DUPLICATE_CHECK_IN_MESSAGE },
        { status: 409 }
      )
    }
    console.error("[check-in/submit]", error)
    return NextResponse.json({ error: "Failed to submit" }, { status: 500 })
  }
}
