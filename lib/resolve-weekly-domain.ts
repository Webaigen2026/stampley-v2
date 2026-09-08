import { prisma } from "@/lib/prisma"
import { isCheckInDomain } from "@/lib/check-in-subscale"
import type { Domain } from "@/store/checkin-store"
import {
  getDomainForStudyWeek,
  getStudyWeekForNextCheckIn,
  getUsedDomainsFromPreviousWeeks,
  type WeeklyDomainRow,
} from "@/lib/weekly-domain-progress"

function parseWeeklyRows(
  rows: Array<{ week_number: unknown; domain: unknown }>
): WeeklyDomainRow[] {
  return rows.map((row) => ({
    week_number: Number(row.week_number),
    domain: String(row.domain),
  }))
}

export async function fetchUserWeeklyDomainRows(
  userId: string
): Promise<WeeklyDomainRow[]> {
  const rows = await prisma.userWeeklyDomain.findMany({
    where: { userId },
    orderBy: { weekNumber: "asc" },
    select: {
      weekNumber: true,
      domain: true,
    },
  })

  return parseWeeklyRows(
    rows.map((row) => ({
      week_number: row.weekNumber,
      domain: row.domain,
    }))
  )
}

export async function fetchUserTotalCheckins(userId: string): Promise<number> {
  const progress = await prisma.userStudyProgress.findUnique({
    where: { userId },
    select: { totalCheckins: true },
  })

  return Number(progress?.totalCheckins ?? 0)
}

/** Resolve the focus domain for the user's upcoming check-in week. */
export async function resolveWeeklyDomainForUser(
  userId: string,
  requestedDomain?: unknown
): Promise<{
  domain: Domain | null
  weekNumber: number
  totalCompleted: number
}> {
  const totalCompleted = await fetchUserTotalCheckins(userId)
  const weekNumber = getStudyWeekForNextCheckIn(totalCompleted)
  const weeklyRows = await fetchUserWeeklyDomainRows(userId)
  const weekDomain = getDomainForStudyWeek(weeklyRows, weekNumber)
  const usedPrevious = getUsedDomainsFromPreviousWeeks(weeklyRows, weekNumber)

  if (weekDomain) {
    return { domain: weekDomain, weekNumber, totalCompleted }
  }

  if (
    isCheckInDomain(requestedDomain) &&
    !usedPrevious.includes(requestedDomain)
  ) {
    return { domain: requestedDomain, weekNumber, totalCompleted }
  }

  return { domain: null, weekNumber, totalCompleted }
}
