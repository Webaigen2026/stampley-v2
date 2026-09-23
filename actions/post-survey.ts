"use server"

import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import {
  calculatePhqSeverity,
  calculatePhqTotal,
  calculateSusScore,
  scorePostSurveyDds,
} from "@/lib/post-survey-scoring"
import { getPostSurveyAccessStatus } from "@/lib/post-survey-access"
import {
  isPrismaUniqueConflict,
  needsMentalHealthFollowupFromPhq,
  POST_SURVEY_NOT_ELIGIBLE,
  POST_SURVEY_UNAUTHORIZED,
  resolvePostSurveySubmitAuth,
  validatePostSurveySubmitPayload,
} from "@/lib/post-survey-submit-validation"
import { redirect } from "next/navigation"

export async function submitPostSurvey(data: {
  dds: Record<string, unknown>
  phq: Record<string, unknown>
  sus: Record<string, unknown>
  stampley: Record<string, unknown>
  openReflection: string
  futureResearchContact: boolean | null
  contactName: string
  contactEmail: string
  contactPhone: string
}) {
  const session = await auth()
  const authz = resolvePostSurveySubmitAuth(session)
  if (!authz.ok) {
    throw new Error(POST_SURVEY_UNAUTHORIZED)
  }

  const access = await getPostSurveyAccessStatus(authz.userId)
  if (!access.studyComplete) {
    throw new Error(POST_SURVEY_NOT_ELIGIBLE)
  }
  if (access.postSurveyCompleted) {
    redirect("/survey/post-survey/results")
  }

  const validated = validatePostSurveySubmitPayload(data)
  if (!validated.ok) {
    return { error: validated.error }
  }

  const {
    ddsAnswers,
    phqAnswers,
    susAnswers,
    stampleyFeedback,
    openReflection,
    futureResearchContact,
    contactName,
    contactEmail,
    contactPhone,
  } = validated.data

  // Server calculates scores from validated raw answers only.
  const ddsScores = scorePostSurveyDds(ddsAnswers)
  const phqTotal = calculatePhqTotal(phqAnswers)
  const phqSeverity = calculatePhqSeverity(phqTotal)
  const needsMentalHealthFollowup = needsMentalHealthFollowupFromPhq({
    phq9: phqAnswers.phq9,
    phqTotal,
  })
  const susScore = calculateSusScore(susAnswers)

  const now = new Date()

  try {
    await prisma.postSurveyResponse.create({
      data: {
        userId: authz.userId,
        ddsAnswers,
        ddsScores,
        phqAnswers,
        phqTotal,
        phqSeverity,
        needsMentalHealthFollowup,
        susAnswers,
        susScore,
        stampleyFeedback,
        openReflection,
        futureResearchContact,
        contactName,
        contactEmail,
        contactPhone,
        completedAt: now,
        createdAt: now,
        updatedAt: now,
      },
    })
  } catch (error) {
    // Concurrent first submit: unique(userId) wins; treat as already submitted.
    if (isPrismaUniqueConflict(error)) {
      redirect("/survey/post-survey/results")
    }
    throw error
  }

  return { success: true }
}
