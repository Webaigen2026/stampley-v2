import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"

import { prisma } from "@/lib/prisma"
import { redirectIfOnboardingIncomplete } from "@/lib/check-in-flow-guard"

import {
  STUDY_TOTAL_CHECKINS,
  computeStudyProgressPercent,
  checkinsCompletedInWeek,
} from "@/lib/check-in-utils"

import { getStudyWeekForNextCheckIn } from "@/lib/weekly-domain-progress"
import { getPostSurveyAccessStatus } from "@/lib/post-survey-access"

import { UnsavedTranscriptResend } from "@/components/stampley/unsaved-transcript-resend"

import DashboardSidebar from "@/components/dashboard/DashboardSidebar"
import DashboardTopbar from "@/components/dashboard/DashboardTopbar"
import DashboardWelcome from "@/components/dashboard/DashboardWelcome"
import DashboardSummaryCards from "@/components/dashboard/DashboardSummaryCards"

import TodayCheckinCard from "@/components/dashboard/TodayCheckinCard"
import StudyProgressCard from "@/components/dashboard/StudyProgressCard"
import StudyRecordCard from "@/components/dashboard/StudyRecordCard"

import SupportFocusCard from "@/components/dashboard/SupportFocusCard"
import QuickActionsCard from "@/components/dashboard/QuickActionsCard"
import StampleySupportCard from "@/components/dashboard/StampleySupportCard"

import AdminDashboardCard from "@/components/dashboard/AdminDashboardCard"

const DOMAIN_META: Record<
  string,
  {
    label: string
    description: string
  }
> = {
  Emotional: {
    label: "Emotional Burden",
    description:
      "Focus on overwhelm, worry, burnout, and the emotional weight of diabetes.",
  },

  Regimen: {
    label: "Regimen-Related Distress",
    description:
      "Focus on daily routines, medications, blood sugar, meal planning, and self-management.",
  },

  Physician: {
    label: "Physician-Related Distress",
    description:
      "Focus on communication, trust, support, and confidence with your healthcare team.",
  },

  Interpersonal: {
    label: "Interpersonal Distress",
    description:
      "Focus on family, friends, social support, and feeling understood by people around you.",
  },
}

export default async function DashboardPage() {
  const session = await auth()

  if (!session?.user?.id) {
    redirect("/login")
  }

  if (session.user.role === "PARTICIPANT") {
    await redirectIfOnboardingIncomplete()
  }

  const [todayCheckin, progress] = await Promise.all([
    prisma.$queryRaw<Array<{ id: string }>>`
      SELECT id
      FROM check_in_submissions
      WHERE user_id = ${session.user.id}
        AND check_in_date = CURRENT_DATE
    `,

    prisma.userStudyProgress.findUnique({
      where: {
        userId: session.user.id,
      },
      select: {
        totalCheckins: true,
        currentWeek: true,
      },
    }),
  ])

  const checkedInToday = todayCheckin.length > 0
  const completedCheckins =
    progress?.totalCheckins ?? 0

  const activeStudyWeek =
    getStudyWeekForNextCheckIn(completedCheckins)

  const currentWeekDomain =
    await prisma.userWeeklyDomain.findUnique({
      where: {
        userId_weekNumber: {
          userId: session.user.id,
          weekNumber: activeStudyWeek,
        },
      },

      select: {
        domain: true,
      },
    })

  const currentDomain =
    currentWeekDomain?.domain ?? null

  const domainMeta = currentDomain
    ? DOMAIN_META[currentDomain]
    : null

  const firstName =
    session.user.email
      ?.split("@")[0]
      ?.split(".")[0] ?? ""

  const formattedName =
    firstName.charAt(0).toUpperCase() +
    firstName.slice(1)

  const remainingCheckins = Math.max(
    STUDY_TOTAL_CHECKINS - completedCheckins,
    0
  )

  const studyComplete =
    completedCheckins >=
    STUDY_TOTAL_CHECKINS

  const postSurveyAccess = studyComplete
    ? await getPostSurveyAccessStatus(
        session.user.id
      )
    : null

  const postSurveyCompleted =
    postSurveyAccess?.postSurveyCompleted ??
    false

  const checkinPct =
    computeStudyProgressPercent(
      completedCheckins
    )

  const thisWeekCompleted =
    checkinsCompletedInWeek(
      completedCheckins,
      activeStudyWeek
    )

  const today =
    new Date().toLocaleDateString(
      "en-US",
      {
        weekday: "long",
        month: "long",
        day: "numeric",
      }
    )

  return (
    <>
      <UnsavedTranscriptResend />

      <main
        className="
          min-h-screen
          bg-[#f8fafc]
          font-['Outfit',system-ui,sans-serif]
          text-[#0b1f45]
        "
      >
        <div className="flex min-h-screen">
          <DashboardSidebar />

          <div className="w-full lg:pl-[248px]">
            <DashboardTopbar
              today={today}
              formattedName={formattedName}
            />
  <DashboardWelcome
                formattedName={formattedName}
              />
            <div
              className="
                mx-auto
                w-full
                max-w-[1500px]
                px-5
                pb-16
                pt-9
                md:px-8
                xl:px-10
              "
            >
            

              {session.user.role ===
                "PARTICIPANT" && (
                <>
                  <DashboardSummaryCards
                    thisWeekCompleted={
                      thisWeekCompleted
                    }
                    completedCheckins={
                      completedCheckins
                    }
                    checkinPct={checkinPct}
                    remainingCheckins={
                      remainingCheckins
                    }
                  />

                  <section
                    className="
                      mt-6
                      grid
                      gap-6
                      xl:grid-cols-[minmax(0,1.75fr)_minmax(320px,0.75fr)]
                    "
                  >
                    {/* LEFT */}
                    <div className="space-y-6">
                      <TodayCheckinCard
                        checkedInToday={
                          checkedInToday
                        }
                        studyComplete={
                          studyComplete
                        }
                        postSurveyCompleted={
                          postSurveyCompleted
                        }
                      />

                      <StudyProgressCard
                        completedCheckins={
                          completedCheckins
                        }
                        activeStudyWeek={
                          activeStudyWeek
                        }
                        thisWeekCompleted={
                          thisWeekCompleted
                        }
                        checkinPct={
                          checkinPct
                        }
                      />

                      <StudyRecordCard
                        checkedInToday={
                          checkedInToday
                        }
                        studyComplete={
                          studyComplete
                        }
                        postSurveyCompleted={
                          postSurveyCompleted
                        }
                      />
                    </div>

                    {/* RIGHT */}
                    <div className="space-y-6">
                      <SupportFocusCard
                        activeStudyWeek={
                          activeStudyWeek
                        }
                        domainMeta={
                          domainMeta
                        }
                      />

                      <QuickActionsCard
                        checkedInToday={
                          checkedInToday
                        }
                        studyComplete={
                          studyComplete
                        }
                        postSurveyCompleted={
                          postSurveyCompleted
                        }
                      />

                      <StampleySupportCard
                        checkedInToday={
                          checkedInToday
                        }
                        studyComplete={
                          studyComplete
                        }
                      />
                    </div>
                  </section>
                </>
              )}

              {session.user.role ===
                "ADMIN" && (
                <AdminDashboardCard />
              )}
            </div>
          </div>
        </div>
      </main>
    </>
  )
}