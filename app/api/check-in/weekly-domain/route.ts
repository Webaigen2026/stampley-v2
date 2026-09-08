export const runtime = "nodejs"
export const dynamic = "force-dynamic"

import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { isCheckInDomain } from "@/lib/check-in-subscale"
import type { Domain } from "@/store/checkin-store"
import {
  fetchUserTotalCheckins,
  fetchUserWeeklyDomainRows,
} from "@/lib/resolve-weekly-domain"
import {
  getDomainForStudyWeek,
  getStudyWeekForNextCheckIn,
  getUsedDomainsFromPreviousWeeks,
  isWeeklyDomainLocked,
  STUDY_DOMAINS,
} from "@/lib/weekly-domain-progress"

export async function GET() {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const totalCompleted = await fetchUserTotalCheckins(session.user.id)
    const currentWeek = getStudyWeekForNextCheckIn(totalCompleted)
    const weeklyRows = await fetchUserWeeklyDomainRows(session.user.id)
    const currentWeekDomain = getDomainForStudyWeek(weeklyRows, currentWeek)
    const usedPreviousDomains = getUsedDomainsFromPreviousWeeks(
      weeklyRows,
      currentWeek
    )
    const isLocked = isWeeklyDomainLocked(
      totalCompleted,
      currentWeek,
      currentWeekDomain
    )

    return NextResponse.json({
      currentWeek,
      currentWeekDomain,
      usedPreviousDomains,
      isLocked,
      totalCompleted,
    })
  } catch (error) {
    console.error("[check-in/weekly-domain GET]", error)
    return NextResponse.json({ error: "Failed to load weekly domain" }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const body = await req.json().catch(() => ({}))
    const domain = body.domain

    if (!isCheckInDomain(domain) || !STUDY_DOMAINS.includes(domain)) {
      return NextResponse.json({ error: "Invalid domain." }, { status: 400 })
    }

    const totalCompleted = await fetchUserTotalCheckins(session.user.id)
    const currentWeek = getStudyWeekForNextCheckIn(totalCompleted)
    const weeklyRows = await fetchUserWeeklyDomainRows(session.user.id)
    const currentWeekDomain = getDomainForStudyWeek(weeklyRows, currentWeek)
    const usedPreviousDomains = getUsedDomainsFromPreviousWeeks(
      weeklyRows,
      currentWeek
    )
    const isLocked = isWeeklyDomainLocked(
      totalCompleted,
      currentWeek,
      currentWeekDomain
    )

    if (isLocked) {
      return NextResponse.json(
        { error: "This week's domain is locked once check-ins begin." },
        { status: 403 }
      )
    }

    if (usedPreviousDomains.includes(domain as Domain)) {
      return NextResponse.json(
        { error: "You already completed this domain in a previous week." },
        { status: 400 }
      )
    }

    await prisma.$transaction([
      prisma.userWeeklyDomain.upsert({
        where: {
          userId_weekNumber: {
            userId: session.user.id,
            weekNumber: currentWeek,
          },
        },
        create: {
          userId: session.user.id,
          weekNumber: currentWeek,
          domain,
        },
        update: {
          domain,
          startedAt: new Date(),
        },
      }),
      prisma.userStudyProgress.upsert({
        where: { userId: session.user.id },
        create: {
          userId: session.user.id,
          currentWeek,
          totalCheckins: totalCompleted,
        },
        update: {
          currentWeek,
          updatedAt: new Date(),
        },
      }),
    ])

    return NextResponse.json({
      success: true,
      weekNumber: currentWeek,
      domain,
    })
  } catch (error) {
    console.error("[check-in/weekly-domain POST]", error)
    return NextResponse.json({ error: "Failed to save weekly domain" }, { status: 500 })
  }
}
