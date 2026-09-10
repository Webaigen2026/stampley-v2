import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { redirect } from "next/navigation"
import { STUDY_TOTAL_CHECKINS } from "@/lib/check-in-utils"

export type MissingPreSurveyPath = "/survey/pre-survey" | "/getting-started"

/**
 * Next required onboarding route for the current user, or null if complete
 * / not a participant. Check-in keeps sending missing pre-survey to
 * /survey/pre-survey. Dashboard may send that case to /getting-started.
 */
export async function getOnboardingRedirectPath(
  missingPreSurveyPath: MissingPreSurveyPath = "/survey/pre-survey"
): Promise<string | null> {
  const session = await auth()
  if (!session?.user?.id) return "/login"
  if (session.user.role !== "PARTICIPANT") return null

  const preSurvey = await prisma.preSurveyResponse.findUnique({
    where: { userId: session.user.id },
    select: { id: true },
  })

  if (!preSurvey) {
    return missingPreSurveyPath
  }

  const dds = await prisma.ddsResponse.findUnique({
    where: { userId: session.user.id },
    select: { confirmedDomain: true },
  })

  if (!dds) {
    return "/survey/dds"
  }

  if (!dds.confirmedDomain) {
    return "/survey/dds/results"
  }

  return null
}

export async function redirectIfOnboardingIncomplete(
  missingPreSurveyPath: MissingPreSurveyPath = "/survey/pre-survey"
) {
  const nextPath = await getOnboardingRedirectPath(missingPreSurveyPath)
  if (nextPath) redirect(nextPath)
}

export async function redirectIfAlreadyCheckedInToday() {
  const session = await auth()
  if (!session?.user?.id) redirect("/login")

  const [todayRows, progress] = await Promise.all([
    prisma.$queryRaw<Array<{ id: string }>>`
      SELECT id
      FROM check_in_submissions
      WHERE user_id = ${session.user.id}
        AND check_in_date = CURRENT_DATE
    `,
    prisma.userStudyProgress.findUnique({
      where: { userId: session.user.id },
      select: { totalCheckins: true },
    }),
  ])

  const totalCheckins = Number(progress?.totalCheckins ?? 0)
  if (totalCheckins >= STUDY_TOTAL_CHECKINS) {
    redirect("/check-in")
  }

  if (todayRows.length > 0) {
    redirect("/check-in")
  }
}
