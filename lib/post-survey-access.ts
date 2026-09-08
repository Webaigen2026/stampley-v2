import "server-only"

import { prisma } from "@/lib/prisma"
import { STUDY_TOTAL_CHECKINS } from "@/lib/check-in-utils"

export type PostSurveyAccessStatus = {
  totalCheckins: number
  studyComplete: boolean
  postSurveyCompleted: boolean
}

export async function getPostSurveyAccessStatus(
  userId: string
): Promise<PostSurveyAccessStatus> {
  const [progress, postSurvey] = await Promise.all([
    prisma.userStudyProgress.findUnique({
      where: { userId },
      select: { totalCheckins: true },
    }),
    prisma.postSurveyResponse.findUnique({
      where: { userId },
      select: { completedAt: true },
    }),
  ])

  const totalCheckins = Number(progress?.totalCheckins ?? 0)
  const studyComplete = totalCheckins >= STUDY_TOTAL_CHECKINS
  const postSurveyCompleted = Boolean(postSurvey?.completedAt)

  return { totalCheckins, studyComplete, postSurveyCompleted }
}
