import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import { WeeklyDomainClient } from "./weekly-domain-client"
import CheckInStepFrame from "@/components/check-in/CheckInStepFrame"
import {
  fetchUserTotalCheckins,
  fetchUserWeeklyDomainRows,
} from "@/lib/resolve-weekly-domain"
import {
  getDomainForStudyWeek,
  getStudyWeekForNextCheckIn,
  getUsedDomainsFromPreviousWeeks,
  isWeeklyDomainLocked,
} from "@/lib/weekly-domain-progress"

export default async function WeeklyDomainPage() {
  const session = await auth()
  if (!session) redirect("/login")

  const userId = session.user?.id
  if (!userId) redirect("/login")

  const totalCompleted = await fetchUserTotalCheckins(userId)
  const currentWeek = getStudyWeekForNextCheckIn(totalCompleted)
  const weeklyRows = await fetchUserWeeklyDomainRows(userId)
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

  const description = isLocked
    ? `Week ${currentWeek} focus is locked. Stampley will tailor every session to ${currentWeekDomain}.`
    : currentWeekDomain
      ? `Week ${currentWeek} focus is set. You can change it until your first check-in this week.`
      : `Choose your focus domain for Week ${currentWeek}. Select one of the remaining DDS domains you have not completed yet.`

  return (
    <CheckInStepFrame title="Weekly Focus" description={description}>
      <WeeklyDomainClient
        lockedDomain={currentWeekDomain}
        weekNumber={currentWeek}
        isLocked={isLocked}
        usedPreviousDomains={usedPreviousDomains}
      />
    </CheckInStepFrame>
  )
}
