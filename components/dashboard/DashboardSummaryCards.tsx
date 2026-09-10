import Image from "next/image"

import SummaryCard from "./SummaryCard"

type Props = {
  thisWeekCompleted: number
  completedCheckins: number
  checkinPct: number
  remainingCheckins: number
}

export default function DashboardSummaryCards({
  thisWeekCompleted,
  completedCheckins,
  checkinPct,
  remainingCheckins,
}: Props) {
  return (
    <section className="my-8 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {/* Check-ins this week */}
      <SummaryCard
        imageSrc="/dashboard/calandar.png"
        imageAlt="Weekly check-ins"
        value={`${thisWeekCompleted}`}
        label="Check-ins this week"
        className="rounded-[14px] bg-[#eef7ff]"
      />

      {/* Total check-ins */}
      <SummaryCard
        imageSrc="/dashboard/checkin.png"
        imageAlt="Completed check-ins"
        value={`${completedCheckins}`}
        label="Total check-ins"
        className="rounded-[14px] bg-[#effaf5]"
      />

      {/* Study progress */}
      <SummaryCard
        imageSrc="/dashboard/progress.png"
        imageAlt="Study progress"
        value={`${checkinPct}%`}
        label="Study progress"
        className="rounded-[14px] bg-[#fff7ed]"
      />

      {/* Check-ins remaining */}
      <SummaryCard
        imageSrc="/dashboard/checkinremaining.png"
        imageAlt="Remaining check-ins"
        value={`${remainingCheckins}`}
        label="Check-ins remaining"
        className="rounded-[14px] bg-[#f4f1ff]"
      />
    </section>
  )
}