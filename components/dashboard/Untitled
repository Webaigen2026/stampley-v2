import { auth, signOut } from "@/lib/auth"
import { redirect } from "next/navigation"
import { prisma } from "@/lib/prisma"
import { redirectIfOnboardingIncomplete } from "@/lib/check-in-flow-guard"

import Link from "next/link"
import Image from "next/image"

import {
  ArrowRight,
  BarChart3,
  Bell,
  BookOpen,
  CalendarCheck2,
  Check,
  CheckCircle2,
  CircleHelp,
  ClipboardCheck,
  Clock3,
  HeartHandshake,
  LayoutDashboard,
  LogOut,
  MessageCircleHeart,
  Sparkles,
  Target,
  TrendingUp,
  UserRound,
} from "lucide-react"

import DonutProgress from "@/components/dashboard/DonutProgress"
import { UnsavedTranscriptResend } from "@/components/stampley/unsaved-transcript-resend"

import {
  STUDY_TOTAL_CHECKINS,
  computeStudyProgressPercent,
  checkinsCompletedInWeek,
} from "@/lib/check-in-utils"

import { getStudyWeekForNextCheckIn } from "@/lib/weekly-domain-progress"
import { getPostSurveyAccessStatus } from "@/lib/post-survey-access"

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
  const completedCheckins = progress?.totalCheckins ?? 0

  const activeStudyWeek =
    getStudyWeekForNextCheckIn(completedCheckins)

  const [currentWeekDomain, chartRows] = await Promise.all([
    prisma.userWeeklyDomain.findUnique({
      where: {
        userId_weekNumber: {
          userId: session.user.id,
          weekNumber: activeStudyWeek,
        },
      },
      select: {
        domain: true,
      },
    }),

    prisma.checkInSubmission.findMany({
      where: {
        userId: session.user.id,
      },
      orderBy: {
        checkInDate: "asc",
      },
      select: {
        checkInDate: true,
        distress: true,
        mood: true,
        energy: true,
        domain: true,
      },
    }),
  ])

  const currentDomain = currentWeekDomain?.domain ?? null

  const firstName =
    session.user.email?.split("@")[0]?.split(".")[0] ?? ""

  const formattedName =
    firstName.charAt(0).toUpperCase() + firstName.slice(1)

  const remainingCheckins = Math.max(
    STUDY_TOTAL_CHECKINS - completedCheckins,
    0
  )

  const studyComplete =
    completedCheckins >= STUDY_TOTAL_CHECKINS

  const postSurveyAccess = studyComplete
    ? await getPostSurveyAccessStatus(session.user.id)
    : null

  const postSurveyCompleted =
    postSurveyAccess?.postSurveyCompleted ?? false

  const checkinPct =
    computeStudyProgressPercent(completedCheckins)

  const thisWeekCompleted = checkinsCompletedInWeek(
    completedCheckins,
    activeStudyWeek
  )

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

  const domainMeta = currentDomain
    ? DOMAIN_META[currentDomain]
    : null

  const today = new Date().toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
  })

  const weeklySessions = [1, 2, 3, 4, 5]

  return (
    <>
      <UnsavedTranscriptResend />

      <main
        className="
          min-h-screen
          bg-[#f7faff]
          font-['Outfit',system-ui,sans-serif]
          text-[#0b1f45]
        "
      >
        <div className="flex min-h-screen">
          {/* =====================================================
              SIDEBAR
          ====================================================== */}
          <aside
            className="
              fixed
              inset-y-0
              left-0
              z-40
              hidden
              w-[248px]
              flex-col
              border-r
              border-[#dce7f4]
              bg-white
              lg:flex
            "
          >
            {/* Brand */}
            <div className="px-6 pb-6 pt-7">
              <Link
                href="/"
                className="flex items-center"
              >
                <Image
                  src="/images/stampleylogomain.webp"
                  alt="AIDES-T2D"
                  width={156}
                  height={52}
                  priority
                  className="h-auto w-[150px]"
                />
              </Link>

              <p
                className="
                  mt-2
                  text-[9px]
                  font-medium
                  uppercase
                  tracking-[0.2em]
                  text-blue-900/45
                "
              >
                Research Study
              </p>
            </div>

            {/* Navigation */}
            <nav className="flex-1 px-4 pt-3">
              <div className="space-y-1.5">
                <Link
                  href="/dashboard"
                  className="
                    flex
                    items-center
                    gap-3
                    rounded-[12px]
                    bg-[#eaf3ff]
                    px-4
                    py-3.5
                    text-[14px]
                    font-medium
                    text-blue-900
                  "
                >
                  <LayoutDashboard
                    size={19}
                    strokeWidth={1.8}
                  />

                  Dashboard
                </Link>

                <Link
                  href="/check-in"
                  className="
                    flex
                    items-center
                    gap-3
                    rounded-[12px]
                    px-4
                    py-3.5
                    text-[14px]
                    font-normal
                    text-[#3d526f]
                    transition
                    hover:bg-[#f3f7fc]
                    hover:text-blue-900
                  "
                >
                  <CalendarCheck2
                    size={19}
                    strokeWidth={1.7}
                  />

                  Daily Check-In
                </Link>

                <a
                  href="#progress"
                  className="
                    flex
                    items-center
                    gap-3
                    rounded-[12px]
                    px-4
                    py-3.5
                    text-[14px]
                    text-[#3d526f]
                    transition
                    hover:bg-[#f3f7fc]
                    hover:text-blue-900
                  "
                >
                  <TrendingUp
                    size={19}
                    strokeWidth={1.7}
                  />

                  My Progress
                </a>

                <a
                  href="#focus"
                  className="
                    flex
                    items-center
                    gap-3
                    rounded-[12px]
                    px-4
                    py-3.5
                    text-[14px]
                    text-[#3d526f]
                    transition
                    hover:bg-[#f3f7fc]
                    hover:text-blue-900
                  "
                >
                  <Target
                    size={19}
                    strokeWidth={1.7}
                  />

                  Support Focus
                </a>

                <Link
                  href="/survey/dds/results"
                  className="
                    flex
                    items-center
                    gap-3
                    rounded-[12px]
                    px-4
                    py-3.5
                    text-[14px]
                    text-[#3d526f]
                    transition
                    hover:bg-[#f3f7fc]
                    hover:text-blue-900
                  "
                >
                  <ClipboardCheck
                    size={19}
                    strokeWidth={1.7}
                  />

                  DDS Results
                </Link>
              </div>
            </nav>

            {/* Sidebar support */}
            <div className="px-4 pb-5">
              <div
                className="
                  rounded-[18px]
                  border
                  border-[#d9e8f8]
                  bg-[linear-gradient(145deg,#f0f8ff,#ffffff)]
                  p-5
                "
              >
                <div
                  className="
                    flex
                    h-10
                    w-10
                    items-center
                    justify-center
                    rounded-full
                    bg-[#e5f2ff]
                    text-blue-800
                  "
                >
                  <HeartHandshake
                    size={20}
                    strokeWidth={1.7}
                  />
                </div>

                <p
                  className="
                    mt-4
                    text-[15px]
                    font-medium
                    text-blue-900
                  "
                >
                  Your participation matters.
                </p>

                <p
                  className="
                    mt-2
                    text-[12px]
                    leading-5
                    text-[#63748c]
                  "
                >
                  Your input helps us better understand
                  diabetes support and emotional well-being.
                </p>
              </div>

              <form
                className="mt-3"
                action={async () => {
                  "use server"

                  await signOut({
                    redirectTo: "/login",
                  })
                }}
              >
                <button
                  type="submit"
                  className="
                    flex
                    w-full
                    items-center
                    gap-3
                    rounded-[12px]
                    px-4
                    py-3
                    text-[13px]
                    text-[#65758c]
                    transition
                    hover:bg-slate-50
                    hover:text-[#0b1f45]
                  "
                >
                  <LogOut
                    size={17}
                    strokeWidth={1.7}
                  />

                  Sign out
                </button>
              </form>
            </div>
          </aside>

          {/* =====================================================
              MAIN DASHBOARD
          ====================================================== */}
          <div className="w-full lg:pl-[248px]">
            {/* Top bar */}
            <header
              className="
                sticky
                top-0
                z-30
                border-b
                border-[#e3ebf5]
                bg-white/90
                backdrop-blur-xl
              "
            >
              <div
                className="
                  flex
                  h-[72px]
                  items-center
                  justify-between
                  px-5
                  md:px-8
                  xl:px-10
                "
              >
                <div className="lg:hidden">
                  <Image
                    src="/images/stampleylogomain.webp"
                    alt="AIDES-T2D"
                    width={130}
                    height={44}
                    className="h-auto w-[125px]"
                  />
                </div>

                <p
                  className="
                    hidden
                    text-[12px]
                    font-normal
                    text-[#718096]
                    lg:block
                  "
                >
                  {today}
                </p>

                <div className="flex items-center gap-4">
                  <button
                    type="button"
                    aria-label="Notifications"
                    className="
                      relative
                      flex
                      h-10
                      w-10
                      items-center
                      justify-center
                      rounded-full
                      border
                      border-[#e4ebf4]
                      bg-white
                      text-blue-900
                    "
                  >
                    <Bell
                      size={18}
                      strokeWidth={1.7}
                    />
                  </button>

                  <div
                    className="
                      flex
                      h-10
                      w-10
                      items-center
                      justify-center
                      rounded-full
                      bg-[#dfeeff]
                      text-[13px]
                      font-medium
                      text-blue-900
                    "
                  >
                    {formattedName
                      ? formattedName
                          .slice(0, 2)
                          .toUpperCase()
                      : "PT"}
                  </div>
                </div>
              </div>
            </header>

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
              {/* =================================================
                  WELCOME
              ================================================== */}
              <section>
                <div
                  className="
                    flex
                    flex-col
                    gap-5
                    xl:flex-row
                    xl:items-start
                    xl:justify-between
                  "
                >
                  <div>
                    <p
                      className="
                        text-[12px]
                        font-medium
                        uppercase
                        tracking-[0.16em]
                        text-blue-900/45
                      "
                    >
                      Participant Dashboard
                    </p>

                    <h1
                      className="
                        mt-3
                        text-[34px]
                        font-medium
                        leading-[1.08]
                        tracking-[-0.035em]
                        text-[#0a285f]
                        sm:text-[42px]
                      "
                    >
                      Welcome back
                      {formattedName
                        ? `, ${formattedName}`
                        : ""}
                      .
                    </h1>

                    <p
                      className="
                        mt-3
                        max-w-2xl
                        text-[15px]
                        leading-7
                        text-[#64758c]
                      "
                    >
                      Thank you for being part of the
                      AIDES-T2D study. Your participation
                      helps us better understand how people
                      experience and manage diabetes-related
                      distress.
                    </p>
                  </div>

                  <div
                    className="
                      hidden
                      max-w-[290px]
                      pt-2
                      text-right
                      xl:block
                    "
                  >
                    <p
                      className="
                        font-serif
                        text-[22px]
                        italic
                        leading-7
                        text-blue-900/80
                      "
                    >
                      “Small steps today,
                      <br />
                      a healthier tomorrow.”
                    </p>

                    <div
                      className="
                        ml-auto
                        mt-4
                        h-[2px]
                        w-10
                        bg-[#f4ae25]
                      "
                    />
                  </div>
                </div>
              </section>

              {/* =================================================
                  SUMMARY CARDS
              ================================================== */}
              {session.user.role === "PARTICIPANT" && (
                <>
                  <section
                    className="
                      mt-8
                      grid
                      grid-cols-1
                      gap-4
                      sm:grid-cols-2
                      xl:grid-cols-4
                    "
                  >
                    <SummaryCard
                      icon={
                        <CalendarCheck2
                          size={22}
                          strokeWidth={1.7}
                        />
                      }
                      value={`${thisWeekCompleted}`}
                      label="Check-ins this week"
                      className="bg-[#eef7ff]"
                      iconClassName="bg-[#dceeff] text-[#0868be]"
                    />

                    <SummaryCard
                      icon={
                        <BarChart3
                          size={22}
                          strokeWidth={1.7}
                        />
                      }
                      value={`${completedCheckins}`}
                      label="Total check-ins"
                      className="bg-[#effaf5]"
                      iconClassName="bg-[#dff5ea] text-[#087e60]"
                    />

                    <SummaryCard
                      icon={
                        <TrendingUp
                          size={22}
                          strokeWidth={1.7}
                        />
                      }
                      value={`${checkinPct}%`}
                      label="Study progress"
                      className="bg-[#fff7ed]"
                      iconClassName="bg-[#ffead3] text-[#d77315]"
                    />

                    <SummaryCard
                      icon={
                        <Sparkles
                          size={22}
                          strokeWidth={1.7}
                        />
                      }
                      value={`${remainingCheckins}`}
                      label="Check-ins remaining"
                      className="bg-[#f4f1ff]"
                      iconClassName="bg-[#e9e3ff] text-[#6951c8]"
                    />
                  </section>

                  {/* =============================================
                      BODY GRID
                  ============================================== */}
                  <section
                    className="
                      mt-6
                      grid
                      gap-6
                      xl:grid-cols-[minmax(0,1.75fr)_minmax(320px,0.75fr)]
                    "
                  >
                    {/* LEFT COLUMN */}
                    <div className="space-y-6">
                      {/* Today's status */}
                      <section
                        className="
                          relative
                          overflow-hidden
                          rounded-[22px]
                          bg-[linear-gradient(115deg,#0a4c88_0%,#0a3568_60%,#082e5b_100%)]
                          p-6
                          text-white
                          shadow-[0_18px_50px_rgba(12,65,117,0.16)]
                          md:p-8
                        "
                      >
                        <div
                          aria-hidden="true"
                          className="
                            absolute
                            -right-20
                            -top-16
                            h-56
                            w-56
                            rounded-full
                            border-[34px]
                            border-white/[0.04]
                          "
                        />

                        <div
                          className="
                            relative
                            z-10
                            flex
                            flex-col
                            gap-6
                            md:flex-row
                            md:items-center
                            md:justify-between
                          "
                        >
                          <div className="flex gap-4">
                            <div
                              className="
                                flex
                                h-14
                                w-14
                                shrink-0
                                items-center
                                justify-center
                                rounded-full
                                border
                                border-emerald-300/70
                                bg-emerald-300/10
                              "
                            >
                              {checkedInToday ? (
                                <Check
                                  size={25}
                                  strokeWidth={1.7}
                                  className="text-emerald-200"
                                />
                              ) : (
                                <Clock3
                                  size={24}
                                  strokeWidth={1.7}
                                  className="text-white"
                                />
                              )}
                            </div>

                            <div>
                              <p
                                className="
                                  text-[10px]
                                  font-semibold
                                  uppercase
                                  tracking-[0.2em]
                                  text-white/55
                                "
                              >
                                Today&apos;s Check-In
                              </p>

                              <h2
                                className="
                                  mt-2
                                  text-[24px]
                                  font-medium
                                  tracking-[-0.025em]
                                  text-white
                                "
                              >
                                {studyComplete
                                  ? "Your study check-ins are complete."
                                  : checkedInToday
                                    ? "You’re all set for today."
                                    : "Your check-in is ready."}
                              </h2>

                              <p
                                className="
                                  mt-2
                                  max-w-xl
                                  text-[14px]
                                  leading-6
                                  text-white/70
                                "
                              >
                                {studyComplete
                                  ? "Thank you for completing all 20 study check-ins."
                                  : checkedInToday
                                    ? "Today’s check-in has been saved. Come back tomorrow for your next session."
                                    : "Take a few minutes to record how you’re feeling and complete today’s Stampley session."}
                              </p>
                            </div>
                          </div>

                          <div className="shrink-0">
                            {studyComplete ? (
                              postSurveyCompleted ? (
                                <div
                                  className="
                                    rounded-full
                                    bg-white/10
                                    px-5
                                    py-3
                                    text-[12px]
                                    font-medium
                                    text-white
                                  "
                                >
                                  Study complete
                                </div>
                              ) : (
                                <Link
                                  href="/survey/post-survey"
                                  className="
                                    inline-flex
                                    items-center
                                    gap-2
                                    rounded-full
                                    bg-white
                                    px-5
                                    py-3
                                    text-[12px]
                                    font-medium
                                    text-blue-900
                                    transition
                                    hover:-translate-y-0.5
                                  "
                                >
                                  Complete Post-Survey

                                  <ArrowRight
                                    size={15}
                                  />
                                </Link>
                              )
                            ) : checkedInToday ? (
                              <Link
                                href="/check-in"
                                className="
                                  inline-flex
                                  items-center
                                  gap-2
                                  rounded-full
                                  bg-white
                                  px-5
                                  py-3
                                  text-[12px]
                                  font-medium
                                  text-blue-900
                                  transition
                                  hover:-translate-y-0.5
                                "
                              >
                                View Today&apos;s Status

                                <ArrowRight
                                  size={15}
                                />
                              </Link>
                            ) : (
                              <Link
                                href="/check-in"
                                className="
                                  inline-flex
                                  items-center
                                  gap-2
                                  rounded-full
                                  bg-white
                                  px-5
                                  py-3
                                  text-[12px]
                                  font-medium
                                  text-blue-900
                                  transition
                                  hover:-translate-y-0.5
                                "
                              >
                                Start Check-In

                                <ArrowRight
                                  size={15}
                                />
                              </Link>
                            )}
                          </div>
                        </div>
                      </section>

                      {/* Study Progress */}
                      <section
                        id="progress"
                        className="
                          rounded-[22px]
                          border
                          border-[#dfe8f3]
                          bg-white
                          p-6
                          shadow-[0_8px_30px_rgba(24,58,93,0.045)]
                          md:p-8
                        "
                      >
                        <div
                          className="
                            flex
                            items-start
                            justify-between
                            gap-4
                          "
                        >
                          <div>
                            <div className="flex items-center gap-3">
                              <div
                                className="
                                  flex
                                  h-10
                                  w-10
                                  items-center
                                  justify-center
                                  rounded-[12px]
                                  bg-[#eaf3ff]
                                  text-blue-800
                                "
                              >
                                <BarChart3
                                  size={20}
                                  strokeWidth={1.7}
                                />
                              </div>

                              <div>
                                <h2
                                  className="
                                    text-[18px]
                                    font-medium
                                    text-[#0b2857]
                                  "
                                >
                                  Your Progress
                                </h2>

                                <p
                                  className="
                                    mt-0.5
                                    text-[12px]
                                    text-[#7a899d]
                                  "
                                >
                                  Week {activeStudyWeek} of 4
                                </p>
                              </div>
                            </div>
                          </div>

                          <p
                            className="
                              text-[12px]
                              font-medium
                              text-blue-700
                            "
                          >
                            {completedCheckins} /{" "}
                            {STUDY_TOTAL_CHECKINS}
                          </p>
                        </div>

                        <div
                          className="
                            mt-8
                            grid
                            gap-8
                            lg:grid-cols-[1fr_190px]
                            lg:items-center
                          "
                        >
                          <div>
                            <div
                              className="
                                flex
                                items-center
                                justify-between
                              "
                            >
                              <div>
                                <p
                                  className="
                                    text-[13px]
                                    font-medium
                                    text-[#2d4565]
                                  "
                                >
                                  This week
                                </p>

                                <p
                                  className="
                                    mt-1
                                    text-[12px]
                                    text-[#8391a3]
                                  "
                                >
                                  Complete at least five study
                                  sessions each week.
                                </p>
                              </div>

                              <p
                                className="
                                  text-[14px]
                                  font-semibold
                                  text-blue-900
                                "
                              >
                                {thisWeekCompleted}/5
                              </p>
                            </div>

                            {/* Weekly circles */}
                            <div
                              className="
                                mt-7
                                grid
                                grid-cols-5
                                gap-3
                              "
                            >
                              {weeklySessions.map(
                                (sessionNumber) => {
                                  const complete =
                                    sessionNumber <=
                                    thisWeekCompleted

                                  return (
                                    <div
                                      key={sessionNumber}
                                      className="
                                        flex
                                        flex-col
                                        items-center
                                        gap-2
                                      "
                                    >
                                      <div
                                        className={`
                                          flex
                                          h-11
                                          w-11
                                          items-center
                                          justify-center
                                          rounded-full
                                          border
                                          transition
                                          ${
                                            complete
                                              ? "border-blue-700 bg-blue-700 text-white"
                                              : "border-[#bdd2e8] bg-[#f8fbff] text-[#9eb1c7]"
                                          }
                                        `}
                                      >
                                        {complete ? (
                                          <Check
                                            size={18}
                                            strokeWidth={2}
                                          />
                                        ) : (
                                          <span className="text-[12px]">
                                            {sessionNumber}
                                          </span>
                                        )}
                                      </div>

                                      <span
                                        className="
                                          text-[10px]
                                          text-[#8190a4]
                                        "
                                      >
                                        Session {sessionNumber}
                                      </span>
                                    </div>
                                  )
                                }
                              )}
                            </div>

                            {/* 4-week progress */}
                            <div
                              className="
                                mt-8
                                border-t
                                border-[#e8eef5]
                                pt-6
                              "
                            >
                              <div
                                className="
                                  grid
                                  grid-cols-4
                                  gap-2
                                "
                              >
                                {[1, 2, 3, 4].map(
                                  (week) => {
                                    const completed =
                                      checkinsCompletedInWeek(
                                        completedCheckins,
                                        week
                                      )

                                    const active =
                                      week === activeStudyWeek

                                    return (
                                      <div
                                        key={week}
                                        className={`
                                          rounded-[12px]
                                          border
                                          px-3
                                          py-3
                                          text-center
                                          ${
                                            active
                                              ? "border-blue-700 bg-[#edf5ff]"
                                              : "border-[#e3ebf4] bg-white"
                                          }
                                        `}
                                      >
                                        <p
                                          className="
                                            text-[9px]
                                            uppercase
                                            tracking-[0.14em]
                                            text-[#8997a9]
                                          "
                                        >
                                          Week
                                        </p>

                                        <p
                                          className="
                                            mt-1
                                            text-[15px]
                                            font-medium
                                            text-blue-900
                                          "
                                        >
                                          {week}
                                        </p>

                                        <p
                                          className="
                                            mt-1
                                            text-[10px]
                                            text-[#7e8ea2]
                                          "
                                        >
                                          {completed}/5
                                        </p>
                                      </div>
                                    )
                                  }
                                )}
                              </div>
                            </div>
                          </div>

                          <div className="flex justify-center">
                            <DonutProgress
                              percent={checkinPct}
                              completed={
                                completedCheckins
                              }
                              total={
                                STUDY_TOTAL_CHECKINS
                              }
                            />
                          </div>
                        </div>
                      </section>

                      {/* Study Record */}
                      <section
                        className="
                          rounded-[22px]
                          border
                          border-[#dfe8f3]
                          bg-white
                          p-6
                          shadow-[0_8px_30px_rgba(24,58,93,0.045)]
                          md:p-8
                        "
                      >
                        <div className="flex items-center gap-3">
                          <div
                            className="
                              flex
                              h-10
                              w-10
                              items-center
                              justify-center
                              rounded-[12px]
                              bg-[#eef6ff]
                              text-blue-800
                            "
                          >
                            <Clock3
                              size={20}
                              strokeWidth={1.7}
                            />
                          </div>

                          <div>
                            <h2
                              className="
                                text-[18px]
                                font-medium
                                text-[#0b2857]
                              "
                            >
                              Study Record
                            </h2>

                            <p
                              className="
                                mt-0.5
                                text-[12px]
                                text-[#8391a3]
                              "
                            >
                              Your completed study milestones
                            </p>
                          </div>
                        </div>

                        <div className="mt-6 divide-y divide-[#e8eef5]">
                          <RecordRow
                            icon={
                              <CheckCircle2
                                size={18}
                              />
                            }
                            title="Pre-Survey"
                            status="Completed"
                          />

                          <RecordRow
                            icon={
                              <ClipboardCheck
                                size={18}
                              />
                            }
                            title="DDS-17"
                            status="Completed"
                          />

                          <RecordRow
                            icon={
                              <CalendarCheck2
                                size={18}
                              />
                            }
                            title="Daily Check-In"
                            status={
                              checkedInToday
                                ? "Completed today"
                                : "Pending today"
                            }
                          />

                          {studyComplete && (
                            <RecordRow
                              icon={
                                <CheckCircle2
                                  size={18}
                                />
                              }
                              title="Post-Study Survey"
                              status={
                                postSurveyCompleted
                                  ? "Completed"
                                  : "Pending"
                              }
                            />
                          )}
                        </div>
                      </section>
                    </div>

                    {/* RIGHT COLUMN */}
                    <div className="space-y-6">
                      {/* Support Focus */}
                      <section
                        id="focus"
                        className="
                          rounded-[22px]
                          border
                          border-[#dfe8f3]
                          bg-white
                          p-6
                          shadow-[0_8px_30px_rgba(24,58,93,0.045)]
                        "
                      >
                        <div className="flex items-center gap-3">
                          <div
                            className="
                              flex
                              h-10
                              w-10
                              items-center
                              justify-center
                              rounded-[12px]
                              bg-[#e9f4ff]
                              text-blue-700
                            "
                          >
                            <Target
                              size={20}
                              strokeWidth={1.8}
                            />
                          </div>

                          <div>
                            <h2
                              className="
                                text-[17px]
                                font-medium
                                text-[#0b2857]
                              "
                            >
                              Your Support Focus
                            </h2>

                            <p
                              className="
                                mt-0.5
                                text-[11px]
                                text-[#8391a3]
                              "
                            >
                              Week {activeStudyWeek}
                            </p>
                          </div>
                        </div>

                        {domainMeta ? (
                          <div
                            className="
                              mt-5
                              rounded-[16px]
                              bg-[#edf7ff]
                              p-5
                            "
                          >
                            <div
                              className="
                                flex
                                h-11
                                w-11
                                items-center
                                justify-center
                                rounded-full
                                bg-white
                                text-blue-700
                              "
                            >
                              <UserRound
                                size={21}
                                strokeWidth={1.7}
                              />
                            </div>

                            <h3
                              className="
                                mt-4
                                text-[16px]
                                font-medium
                                text-blue-900
                              "
                            >
                              {domainMeta.label}
                            </h3>

                            <p
                              className="
                                mt-2
                                text-[12px]
                                leading-5
                                text-[#60738d]
                              "
                            >
                              {domainMeta.description}
                            </p>
                          </div>
                        ) : (
                          <div
                            className="
                              mt-5
                              rounded-[16px]
                              bg-[#f6f9fc]
                              p-5
                            "
                          >
                            <p
                              className="
                                text-[13px]
                                font-medium
                                text-[#3f5572]
                              "
                            >
                              No weekly focus selected yet.
                            </p>

                            <p
                              className="
                                mt-2
                                text-[12px]
                                leading-5
                                text-[#7a8a9f]
                              "
                            >
                              Your focus will be selected during
                              Step 4 of your next check-in.
                            </p>
                          </div>
                        )}

                        <Link
                          href="/survey/dds/results"
                          className="
                            mt-5
                            inline-flex
                            items-center
                            gap-2
                            text-[12px]
                            font-medium
                            text-blue-700
                          "
                        >
                          View DDS Results

                          <ArrowRight
                            size={14}
                          />
                        </Link>
                      </section>

                      {/* Quick Actions */}
                      <section
                        className="
                          rounded-[22px]
                          border
                          border-[#dfe8f3]
                          bg-white
                          p-6
                          shadow-[0_8px_30px_rgba(24,58,93,0.045)]
                        "
                      >
                        <div className="flex items-center gap-3">
                          <Sparkles
                            size={20}
                            strokeWidth={1.7}
                            className="text-blue-700"
                          />

                          <h2
                            className="
                              text-[17px]
                              font-medium
                              text-[#0b2857]
                            "
                          >
                            Quick Actions
                          </h2>
                        </div>

                        <div className="mt-5 space-y-2">
                          <QuickAction
                            href="/check-in"
                            icon={
                              <CalendarCheck2
                                size={18}
                              />
                            }
                            label={
                              checkedInToday
                                ? "View Today's Check-In"
                                : "Go to Daily Check-In"
                            }
                          />

                          <QuickAction
                            href="/survey/dds/results"
                            icon={
                              <Target size={18} />
                            }
                            label="View Support Focus"
                          />

                          {studyComplete &&
                          !postSurveyCompleted ? (
                            <QuickAction
                              href="/survey/post-survey"
                              icon={
                                <ClipboardCheck
                                  size={18}
                                />
                              }
                              label="Complete Post-Survey"
                            />
                          ) : null}
                        </div>
                      </section>

                      {/* Stampley */}
                      <section
                        className="
                          overflow-hidden
                          rounded-[22px]
                          border
                          border-[#d6e5f6]
                          bg-[linear-gradient(145deg,#e8f5ff,#f8fcff)]
                          p-6
                          shadow-[0_8px_30px_rgba(24,58,93,0.045)]
                        "
                      >
                        <div
                          className="
                            flex
                            h-12
                            w-12
                            items-center
                            justify-center
                            rounded-full
                            bg-white
                            text-blue-700
                            shadow-sm
                          "
                        >
                          <MessageCircleHeart
                            size={23}
                            strokeWidth={1.7}
                          />
                        </div>

                        <h2
                          className="
                            mt-5
                            text-[18px]
                            font-medium
                            text-blue-900
                          "
                        >
                          Stampley is here to support you.
                        </h2>

                        <p
                          className="
                            mt-2
                            text-[12px]
                            leading-5
                            text-[#64758d]
                          "
                        >
                          Stampley is part of your daily check-in
                          and provides support based on the
                          information you share during the study.
                        </p>

                        {!studyComplete &&
                        !checkedInToday ? (
                          <Link
                            href="/check-in"
                            className="
                              mt-5
                              flex
                              items-center
                              justify-between
                              rounded-[12px]
                              bg-[#0b4c8c]
                              px-4
                              py-3
                              text-[12px]
                              font-medium
                              text-white
                            "
                          >
                            Start Today&apos;s Session

                            <ArrowRight
                              size={15}
                            />
                          </Link>
                        ) : (
                          <div
                            className="
                              mt-5
                              rounded-[12px]
                              border
                              border-blue-900/10
                              bg-white/70
                              px-4
                              py-3
                              text-[12px]
                              text-blue-900/65
                            "
                          >
                            {studyComplete
                              ? "Study check-ins complete."
                              : "Today's Stampley session is complete."}
                          </div>
                        )}
                      </section>

                      {/* Help */}
                      <section
                        className="
                          rounded-[22px]
                          border
                          border-[#dfe8f3]
                          bg-white
                          p-6
                        "
                      >
                        <div className="flex gap-3">
                          <CircleHelp
                            size={20}
                            strokeWidth={1.7}
                            className="mt-0.5 text-blue-700"
                          />

                          <div>
                            <h2
                              className="
                                text-[15px]
                                font-medium
                                text-[#0b2857]
                              "
                            >
                              Need help?
                            </h2>

                            <p
                              className="
                                mt-2
                                text-[12px]
                                leading-5
                                text-[#76869a]
                              "
                            >
                              If you have questions about your
                              participation, contact the AIDES-T2D
                              research team.
                            </p>
                          </div>
                        </div>
                      </section>
                    </div>
                  </section>
                </>
              )}

              {/* =================================================
                  ADMIN
              ================================================== */}
              {session.user.role === "ADMIN" && (
                <section
                  className="
                    mt-8
                    rounded-[22px]
                    border
                    border-[#dfe8f3]
                    bg-white
                    p-8
                  "
                >
                  <p
                    className="
                      text-[10px]
                      font-semibold
                      uppercase
                      tracking-[0.18em]
                      text-blue-900/50
                    "
                  >
                    Admin Portal
                  </p>

                  <h2
                    className="
                      mt-4
                      text-[30px]
                      font-medium
                      tracking-[-0.03em]
                      text-blue-950
                    "
                  >
                    Manage study operations.
                  </h2>

                  <p
                    className="
                      mt-3
                      max-w-xl
                      text-[14px]
                      leading-6
                      text-[#6c7d91]
                    "
                  >
                    Review users, study keys, participant
                    activity, and safety signals from the
                    administrative dashboard.
                  </p>

                  <Link
                    href="/admin"
                    className="
                      mt-6
                      inline-flex
                      items-center
                      gap-2
                      rounded-full
                      bg-blue-900
                      px-5
                      py-3
                      text-[12px]
                      font-medium
                      text-white
                    "
                  >
                    Open Admin

                    <ArrowRight
                      size={15}
                    />
                  </Link>
                </section>
              )}
            </div>
          </div>
        </div>
      </main>
    </>
  )
}

/* ============================================================
   SUMMARY CARD
============================================================ */

function SummaryCard({
  icon,
  value,
  label,
  className,
  iconClassName,
}: {
  icon: React.ReactNode
  value: string
  label: string
  className: string
  iconClassName: string
}) {
  return (
    <div
      className={`
        rounded-[18px]
        border
        border-white
        p-5
        shadow-[0_8px_28px_rgba(27,62,101,0.035)]
        ${className}
      `}
    >
      <div className="flex items-center gap-4">
        <div
          className={`
            flex
            h-11
            w-11
            shrink-0
            items-center
            justify-center
            rounded-[13px]
            ${iconClassName}
          `}
        >
          {icon}
        </div>

        <div>
          <p
            className="
              text-[24px]
              font-semibold
              leading-none
              tracking-[-0.025em]
              text-[#0a285f]
            "
          >
            {value}
          </p>

          <p
            className="
              mt-1.5
              text-[11px]
              leading-4
              text-[#63758c]
            "
          >
            {label}
          </p>
        </div>
      </div>
    </div>
  )
}

/* ============================================================
   QUICK ACTION
============================================================ */

function QuickAction({
  href,
  icon,
  label,
}: {
  href: string
  icon: React.ReactNode
  label: string
}) {
  return (
    <Link
      href={href}
      className="
        group
        flex
        items-center
        justify-between
        rounded-[12px]
        bg-[#edf6ff]
        px-4
        py-3
        text-blue-900
        transition
        hover:bg-[#e2f1ff]
      "
    >
      <span className="flex items-center gap-3">
        <span className="text-blue-700">
          {icon}
        </span>

        <span
          className="
            text-[12px]
            font-medium
          "
        >
          {label}
        </span>
      </span>

      <ArrowRight
        size={15}
        className="
          transition-transform
          group-hover:translate-x-1
        "
      />
    </Link>
  )
}

/* ============================================================
   STUDY RECORD ROW
============================================================ */

function RecordRow({
  icon,
  title,
  status,
}: {
  icon: React.ReactNode
  title: string
  status: string
}) {
  return (
    <div
      className="
        flex
        items-center
        justify-between
        gap-5
        py-4
      "
    >
      <div className="flex items-center gap-3">
        <div
          className="
            flex
            h-9
            w-9
            items-center
            justify-center
            rounded-full
            bg-[#edf6ff]
            text-blue-700
          "
        >
          {icon}
        </div>

        <p
          className="
            text-[13px]
            font-medium
            text-[#294563]
          "
        >
          {title}
        </p>
      </div>

      <span
        className="
          text-[11px]
          font-medium
          text-[#74869c]
        "
      >
        {status}
      </span>
    </div>
  )
}