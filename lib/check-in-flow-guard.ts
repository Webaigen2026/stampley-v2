import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { redirect } from "next/navigation"
import { STUDY_TOTAL_CHECKINS } from "@/lib/check-in-utils"
import { redirectIfUnenrolled } from "@/lib/study-enrollment"

export async function redirectIfOnboardingIncomplete() {
  const session = await auth()
  if (!session?.user?.id) redirect("/login")
  if (session.user.role !== "PARTICIPANT") return

  await redirectIfUnenrolled()

  const preSurvey = await prisma.preSurveyResponse.findUnique({
    where: { userId: session.user.id },
    select: { id: true },
  })

  if (!preSurvey) {
    redirect("/survey/pre-survey")
  }

  const dds = await prisma.ddsResponse.findUnique({
    where: { userId: session.user.id },
    select: { confirmedDomain: true },
  })

  if (!dds) {
    redirect("/survey/dds")
  }

  if (!dds.confirmedDomain) {
    redirect("/survey/dds/results")
  }
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
