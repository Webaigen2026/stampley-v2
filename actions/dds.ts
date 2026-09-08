"use server"

import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"
import { revalidatePath } from "next/cache"
import { calculateDDSScores, type DDSAnswers } from "@/lib/dds-scoring"
import { Prisma } from "@/lib/generated/prisma/client"

export async function submitDDS(formData: FormData) {
  const session = await auth()
  if (!session?.user?.id) return { error: "Unauthorized" }

  try {
    const answers: DDSAnswers = {
      q1: parseInt(formData.get("q1") as string),
      q2: parseInt(formData.get("q2") as string),
      q3: parseInt(formData.get("q3") as string),
      q4: parseInt(formData.get("q4") as string),
      q5: parseInt(formData.get("q5") as string),
      q6: parseInt(formData.get("q6") as string),
      q7: parseInt(formData.get("q7") as string),
      q8: parseInt(formData.get("q8") as string),
      q9: parseInt(formData.get("q9") as string),
      q10: parseInt(formData.get("q10") as string),
      q11: parseInt(formData.get("q11") as string),
      q12: parseInt(formData.get("q12") as string),
      q13: parseInt(formData.get("q13") as string),
      q14: parseInt(formData.get("q14") as string),
      q15: parseInt(formData.get("q15") as string),
      q16: parseInt(formData.get("q16") as string),
      q17: parseInt(formData.get("q17") as string),
    }

    const valid = Object.values(answers).every(v => v >= 1 && v <= 6)
    if (!valid) return { error: "Please answer all questions" }

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
    return { success: true, scores }

  } catch (error) {
    console.error("[submitDDS]", error)
    return { error: "Failed to save responses. Please try again." }
  }
}

export async function confirmDomain(domain: string) {
  const session = await auth()
  if (!session?.user?.id) return { error: "Unauthorized" }

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
