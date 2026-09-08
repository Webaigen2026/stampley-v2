"use server"

import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { calculateDDSScores, type DDSAnswers } from "@/lib/dds-scoring"
import {
  calculatePhqSeverity,
  calculatePhqTotal,
  calculateSusScore,
  hasNumericAnswer,
  type PhqAnswers,
  type SusAnswers,
} from "@/lib/post-survey-scoring"
import { getPostSurveyAccessStatus } from "@/lib/post-survey-access"
import { redirect } from "next/navigation"
import { assertParticipantEnrolled } from "@/lib/study-enrollment"

function parseDdsAnswers(raw: Record<string, unknown>): DDSAnswers | null {
  const answers = {} as DDSAnswers
  for (let i = 1; i <= 17; i++) {
    const key = `q${i}` as keyof DDSAnswers
    const value = raw[key]
    if (!hasNumericAnswer(value) || value < 1 || value > 6) return null
    answers[key] = value
  }
  return answers
}

function parsePhqAnswers(raw: Record<string, unknown>): PhqAnswers | null {
  const answers = {} as PhqAnswers
  for (let i = 1; i <= 9; i++) {
    const key = `phq${i}` as keyof PhqAnswers
    const value = raw[key]
    if (!hasNumericAnswer(value) || value < 0 || value > 3) return null
    answers[key] = value
  }
  return answers
}

function parseSusAnswers(raw: Record<string, unknown>): SusAnswers | null {
  const answers = {} as SusAnswers
  for (let i = 1; i <= 10; i++) {
    const key = `sus${i}` as keyof SusAnswers
    const value = raw[key]
    if (!hasNumericAnswer(value) || value < 1 || value > 5) return null
    answers[key] = value
  }
  return answers
}

function parseStampleyFeedback(raw: Record<string, unknown>): Record<string, number> | null {
  const feedback: Record<string, number> = {}
  for (let i = 1; i <= 5; i++) {
    const key = `se${i}`
    const value = raw[key]
    if (!hasNumericAnswer(value) || value < 1 || value > 5) return null
    feedback[key] = value
  }
  return feedback
}

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
  if (!session?.user?.id) {
    throw new Error("Unauthorized")
  }

  await assertParticipantEnrolled(session.user.id, session.user.role)

  const access = await getPostSurveyAccessStatus(session.user.id)
  if (!access.studyComplete) {
    throw new Error("Post-survey is available after completing all 20 check-ins.")
  }
  if (access.postSurveyCompleted) {
    redirect("/survey/post-survey/results")
  }

  const ddsAnswers = parseDdsAnswers(data.dds)
  const phqAnswers = parsePhqAnswers(data.phq)
  const susAnswers = parseSusAnswers(data.sus)
  const stampleyFeedback = parseStampleyFeedback(data.stampley)

  if (!ddsAnswers || !phqAnswers || !susAnswers || !stampleyFeedback) {
    return { error: "Please complete all required survey sections." }
  }

  if (data.futureResearchContact === null) {
    return { error: "Please indicate whether you would like future research contact." }
  }

  const ddsScores = calculateDDSScores(ddsAnswers)
  const phqTotal = calculatePhqTotal(phqAnswers)
  const phqSeverity = calculatePhqSeverity(phqTotal)
  const susScore = calculateSusScore(susAnswers)

  const now = new Date()
  const values = {
    ddsAnswers,
    ddsScores,
    phqAnswers,
    phqTotal,
    phqSeverity,
    susAnswers,
    susScore,
    stampleyFeedback,
    openReflection: data.openReflection.trim() || null,
    futureResearchContact: data.futureResearchContact,
    contactName: data.contactName.trim() || null,
    contactEmail: data.contactEmail.trim() || null,
    contactPhone: data.contactPhone.trim() || null,
    completedAt: now,
    updatedAt: now,
  }

  await prisma.postSurveyResponse.upsert({
    where: { userId: session.user.id },
    create: {
      userId: session.user.id,
      ...values,
      createdAt: now,
    },
    update: values,
  })

  return { success: true }
}
