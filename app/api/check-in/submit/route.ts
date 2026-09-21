export const runtime = "nodejs"
export const dynamic = "force-dynamic"

import { NextRequest } from "next/server"
import { auth } from "@/lib/auth"
import { jsonWithSensitiveCache } from "@/lib/sensitive-cache-headers"
import { prisma } from "@/lib/prisma"
import { Prisma } from "@/lib/generated/prisma/client"
import { getSubscaleForDay, isCheckInDomain } from "@/lib/check-in-subscale"
import {
  computeStudyWeekAndDayFromCheckInNumber,
  STUDY_COMPLETE_MESSAGE,
  STUDY_TOTAL_CHECKINS,
} from "@/lib/check-in-utils"
import { resolveCheckInMutationAccess } from "@/lib/check-in-mutation-authz"
import { fetchUserWeeklyDomainRows } from "@/lib/resolve-weekly-domain"
import {
  authoritativeDomainFromConflictRow,
  resolveSubmitWeeklyDomain,
} from "@/lib/weekly-domain-progress"
import { validateCheckInSubmitBody } from "@/lib/check-in-submit-validation"

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
  const access = resolveCheckInMutationAccess(session)
  if (!access.ok) {
    return jsonWithSensitiveCache({ error: access.error }, { status: access.status })
  }
  const userId = access.userId

  let body: unknown
  try {
    body = await req.json()
  } catch {
    return jsonWithSensitiveCache(
      { error: "Invalid request body" },
      { status: 400 }
    )
  }

  const validated = validateCheckInSubmitBody(body)
  if (!validated.ok) {
    return jsonWithSensitiveCache({ error: validated.error }, { status: 400 })
  }

  const {
    distress,
    mood,
    energy,
    contextTags,
    reflection,
    copingAction,
  } = validated.data

  try {
    const requestedDomain =
      body !== null && typeof body === "object" && "domain" in body
        ? (body as { domain?: unknown }).domain
        : undefined

    const existingToday = await prisma.$queryRaw<Array<{ id: string }>>`
      SELECT id
      FROM check_in_submissions
      WHERE user_id = ${userId}
        AND check_in_date = CURRENT_DATE
      LIMIT 1
    `

    if (existingToday.length > 0) {
      return jsonWithSensitiveCache(
        { error: DUPLICATE_CHECK_IN_MESSAGE },
        { status: 409 }
      )
    }

    const progress = await prisma.userStudyProgress.findUnique({
      where: { userId },
      select: { totalCheckins: true },
    })

    const totalCheckins = Number(progress?.totalCheckins ?? 0)

    if (totalCheckins >= STUDY_TOTAL_CHECKINS) {
      return jsonWithSensitiveCache({ error: STUDY_COMPLETE_MESSAGE }, { status: 403 })
    }

    const checkInNumber = totalCheckins + 1
    const { weekNumber, dayNumber } =
      computeStudyWeekAndDayFromCheckInNumber(checkInNumber)
    const weeklyRows = await fetchUserWeeklyDomainRows(userId)
    const domainDecision = resolveSubmitWeeklyDomain({
      weekNumber,
      weeklyRows,
      requestedDomain,
    })

    if (!domainDecision.ok) {
      return jsonWithSensitiveCache(
        { error: domainDecision.error },
        { status: 400 }
      )
    }

    const { checkInSubmissionId, needsSafetyEscalation, subscale } = await prisma.$transaction(
      async (tx) => {
        let domain = domainDecision.domain

        if (domainDecision.shouldPersist) {
          try {
            await tx.userWeeklyDomain.create({
              data: {
                userId,
                weekNumber,
                domain,
              },
            })
          } catch (persistError) {
            if (!isUniqueViolation(persistError)) {
              throw persistError
            }
            const winner = await tx.userWeeklyDomain.findUnique({
              where: {
                userId_weekNumber: {
                  userId,
                  weekNumber,
                },
              },
              select: { domain: true },
            })
            const authoritative = authoritativeDomainFromConflictRow(
              winner?.domain
            )
            if (!authoritative) {
              throw persistError
            }
            domain = authoritative
          }
        } else {
          const existingWeek = await tx.userWeeklyDomain.findUnique({
            where: {
              userId_weekNumber: {
                userId,
                weekNumber,
              },
            },
            select: { domain: true },
          })
          if (isCheckInDomain(existingWeek?.domain)) {
            domain = existingWeek.domain
          }
        }

        const subscale = getSubscaleForDay(domain, dayNumber)

        const prev = await tx.checkInSubmission.findFirst({
          where: { userId },
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
              userId,
              domain,
              subscale,
              distress,
              mood,
              energy,
              reflection,
              copingAction,
              contextTags,
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
          where: { userId },
          create: {
            userId,
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
          WHERE user_id = ${userId}
        `

        return {
          checkInSubmissionId: created.id,
          needsSafetyEscalation,
          subscale,
        }
      }
    )

    return jsonWithSensitiveCache({
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
      return jsonWithSensitiveCache(
        { error: DUPLICATE_CHECK_IN_MESSAGE },
        { status: 409 }
      )
    }
    console.error("[check-in/submit]", error)
    return jsonWithSensitiveCache({ error: "Failed to submit" }, { status: 500 })
  }
}
