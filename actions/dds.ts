"use server"

import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"
import { revalidatePath } from "next/cache"
import {
  calculateDDSScores,
  isDdsDomain,
  parseDdsAnswersFromFormData,
} from "@/lib/dds-scoring"
import { Prisma } from "@/lib/generated/prisma/client"

export async function submitDDS(formData: FormData) {
  const session = await auth()
  if (!session?.user?.id) return { error: "Unauthorized" }

  try {
    const answers = parseDdsAnswersFromFormData(formData)
    if (!answers) return { error: "Please answer all questions" }

    const scores = calculateDDSScores(answers)

    const values = {
      q1: answers.q1,
      q2: answers.q2,
      q3: answers.q3,
      q4: answers.q4,
      q5: answers.q5,
      q6: answers.q6,
      q7: answers.q7,
      q8: answers.q8,
      q9: answers.q9,
      q10: answers.q10,
      q11: answers.q11,
      q12: answers.q12,
      q13: answers.q13,
      q14: answers.q14,
      q15: answers.q15,
      q16: answers.q16,
      q17: answers.q17,
      emotionalScore: scores.emotional,
      physicianScore: scores.physician,
      regimenScore: scores.regimen,
      interpersonalScore: scores.interpersonal,
      totalScore: scores.total,
      recommendedDomain: scores.recommendedDomain,
    }

    await prisma.ddsResponse.upsert({
      where: { userId: session.user.id },
      create: {
        userId: session.user.id,
        ...values,
      },
      update: values,
    })

    revalidatePath("/survey/dds")
    return { success: true }

  } catch (error) {
    console.error("[submitDDS]", error)
    return { error: "Failed to save responses. Please try again." }
  }
}

export async function confirmDomain(domain: string) {
  const session = await auth()
  if (!session?.user?.id) return { error: "Unauthorized" }

  if (!isDdsDomain(domain)) {
    return { error: "Unable to save focus." }
  }

  try {
    await prisma.$transaction(async (tx) => {
      await tx.ddsResponse.updateMany({
        where: { userId: session.user.id },
        data: { confirmedDomain: domain },
      })

      await tx.userWeeklyDomain.upsert({
        where: {
          userId_weekNumber: {
            userId: session.user.id,
            weekNumber: 1,
          },
        },
        create: {
          userId: session.user.id,
          weekNumber: 1,
          domain,
        },
        update: {
          domain,
        },
      })

      const existingProgress = await tx.userStudyProgress.findUnique({
        where: { userId: session.user.id },
        select: { id: true },
      })

      if (!existingProgress) {
        try {
          await tx.userStudyProgress.create({
            data: {
              userId: session.user.id,
              currentWeek: 1,
              totalCheckins: 0,
              consecutiveHighDistressDays: 0,
            },
          })
        } catch (error) {
          if (
            !(
              error instanceof Prisma.PrismaClientKnownRequestError &&
              error.code === "P2002"
            )
          ) {
            throw error
          }
        }
      }
    })

    return { success: true }
  } catch (error) {
    console.error("[confirmDomain]", error)
    return { error: "Failed to confirm domain." }
  }
}
