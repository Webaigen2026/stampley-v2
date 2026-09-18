import Image from "next/image"
import Link from "next/link"
import { redirect } from "next/navigation"
import { ArrowRight } from "lucide-react"

import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

import {
  STUDY_COMPLETE_MESSAGE,
  STUDY_TOTAL_CHECKINS,
} from "@/lib/check-in-utils"

/* =========================================================
   BACKGROUND
========================================================= */

function StatusBackground() {
  return (
    <div
      aria-hidden="true"
      className="
        pointer-events-none
        absolute
        inset-0
        overflow-hidden
        bg-white
      "
    >
      {/* Upper-left glow */}
      <div
        className="
          absolute
          -left-[180px]
          top-[40px]
          h-[540px]
          w-[540px]
          rounded-full
          bg-[#EAF4FF]/60
          blur-[125px]
        "
      />

      {/* Center glow */}
      <div
        className="
          absolute
          left-1/2
          top-[24%]
          h-[460px]
          w-[600px]
          -translate-x-1/2
          rounded-full
          bg-[#F1F7FF]/75
          blur-[145px]
        "
      />

      {/* Lower-right glow */}
      <div
        className="
          absolute
          -right-[200px]
          bottom-[4%]
          h-[520px]
          w-[520px]
          rounded-full
          bg-[#EAF4FF]/40
          blur-[135px]
        "
      />

      {/* Soft central light */}
      <div
        className="
          absolute
          left-1/2
          top-1/2
          h-[360px]
          w-[760px]
          -translate-x-1/2
          -translate-y-1/2
          rounded-full
          bg-white/75
          blur-[120px]
        "
      />
    </div>
  )
}

/* =========================================================
   STATUS CARD
========================================================= */

function StatusCard({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div
      className="
        relative
        isolate
        flex
        h-full
        min-h-full
        items-center
        justify-center
        overflow-hidden
        bg-white
        px-5
        py-10
        font-['Outfit',system-ui,sans-serif]
        text-slate-950
        sm:py-12
      "
    >
      <StatusBackground />

      <div
        className="
          relative
          z-10
          w-full
          max-w-[640px]
        "
      >
        <div
          className="
            rounded-[24px]
            bg-white/95
            px-6
            py-9
            text-center
            shadow-[0_20px_60px_rgba(15,45,80,0.09)]
            backdrop-blur-sm
            sm:px-12
            sm:py-10
          "
        >
          {children}
        </div>
      </div>
    </div>
  )
}

/* =========================================================
   STATUS ICON
========================================================= */

function StatusIcon({
  tone,
}: {
  tone: "green" | "blue"
}) {
  const glow =
    tone === "green"
      ? "shadow-[0_14px_34px_rgba(16,185,129,0.13)]"
      : "shadow-[0_14px_34px_rgba(20,115,230,0.14)]"

  const surface =
    tone === "green"
      ? "bg-[#F0FBF5]"
      : "bg-[#F2F7FF]"

  return (
    <div
      className={`
        relative
        mx-auto
        mb-5
        flex
        h-[92px]
        w-[92px]
        items-center
        justify-center
        rounded-full
        ${surface}
        ${glow}
      `}
    >
      {/* Soft inner halo */}
      <div
        aria-hidden="true"
        className="
          absolute
          inset-[10px]
          rounded-full
          bg-white/80
        "
      />

<img
          src="/dashboard/checksurvey.png"
          alt=""
          width={120}
          height={160}
          className="
            absolute
            bottom-0
           
            z-10
            h-[168px]
            w-auto
            max-w-none
            object-contain
            object-bottom
          "
        />
    </div>
  )
}

/* =========================================================
   DASHBOARD BUTTON
========================================================= */

function DashboardButton() {
  return (
    <Link
      href="/dashboard"
      className="
        group
        inline-flex
        min-h-[50px]
        w-full
        items-center
        justify-center
        gap-2.5
        rounded-[12px]
        bg-[#173B7A]
        px-7
        text-base
        font-medium
        text-white
        shadow-[0_8px_18px_rgba(23,59,122,0.14)]
        transition-all
        duration-200

        hover:-translate-y-0.5
        hover:bg-[#123568]
        hover:shadow-[0_10px_22px_rgba(23,59,122,0.17)]

        focus-visible:outline-none
        focus-visible:ring-2
        focus-visible:ring-[#1473E6]
        focus-visible:ring-offset-2

        sm:w-auto
      "
    >
      Back to Dashboard

      <ArrowRight
        aria-hidden="true"
        size={17}
        strokeWidth={1.8}
        className="
          transition-transform
          duration-200
          group-hover:translate-x-0.5
        "
      />
    </Link>
  )
}

/* =========================================================
   PAGE
========================================================= */

export default async function CheckInEntryPage() {
  const session = await auth()

  const userId = session?.user?.id

  if (!userId) {
    redirect("/login")
  }

  const [todayResult, progress] = await Promise.all([
    prisma.$queryRaw<Array<{ id: string }>>`
      SELECT id
      FROM check_in_submissions
      WHERE user_id = ${userId}
        AND check_in_date = CURRENT_DATE
      LIMIT 1
    `,

    prisma.userStudyProgress.findUnique({
      where: {
        userId,
      },
      select: {
        totalCheckins: true,
      },
    }),
  ])

  const totalCheckins =
    Number(progress?.totalCheckins ?? 0)

  const studyComplete =
    totalCheckins >=
    STUDY_TOTAL_CHECKINS

  /* =======================================================
     STUDY COMPLETE
  ======================================================= */

  if (studyComplete) {
    return (
      <StatusCard>
        <StatusIcon tone="blue" />

        <p
          className="
            text-[11px]
            font-semibold
            uppercase
            tracking-[0.22em]
            text-[#1473E6]
          "
        >
          Study complete
        </p>

        <h2
          className="
            mt-3
            text-3xl
            font-medium
            tracking-[-0.035em]
            text-[#173B7A]
            sm:text-[34px]
          "
        >
          Study check-ins complete
        </h2>

        <p
          className="
            mx-auto
            mb-8
            mt-4
            max-w-[480px]
            text-base
            leading-7
            text-slate-600
          "
        >
          {STUDY_COMPLETE_MESSAGE}
        </p>

        <DashboardButton />
      </StatusCard>
    )
  }

  /* =======================================================
     ALREADY CHECKED IN TODAY
  ======================================================= */

  if (todayResult.length > 0) {
    return (
      <StatusCard>
        <StatusIcon tone="green" />

        {/* <p
          className="
            text-[11px]
            font-semibold
            uppercase
            tracking-[0.22em]
            text-[#1473E6]
          "
        >
          Daily check-in complete.
        </p> */}

        <h2
          className="
            mt-3
            text-3xl
            font-medium
            tracking-[-0.035em]
            text-[#173B7A]
            sm:text-[34px]
          "
        >
          Already checked in today!
        </h2>

        <p
          className="
            mx-auto
            mb-8
            mt-4
            max-w-[480px]
            text-base
            leading-7
            text-slate-600
          "
        >
          You&apos;ve completed your check-in for today.
          See you tomorrow! 
        </p>

        <DashboardButton />
      </StatusCard>
    )
  }

  /* =======================================================
     START TODAY'S CHECK-IN
  ======================================================= */

  redirect("/check-in/daily-metrics")
}