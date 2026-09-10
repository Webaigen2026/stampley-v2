import {
    BarChart3,
    CalendarCheck2,
    Sparkles,
    TrendingUp,
  } from "lucide-react"
  
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
      <section className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <SummaryCard
          icon={<CalendarCheck2 size={22} strokeWidth={1.7} />}
          value={`${thisWeekCompleted}`}
          label="Check-ins this week"
          className="bg-[#eef7ff]"
          iconClassName="bg-[#dceeff] text-[#0868be]"
        />
  
        <SummaryCard
          icon={<BarChart3 size={22} strokeWidth={1.7} />}
          value={`${completedCheckins}`}
          label="Total check-ins"
          className="bg-[#effaf5]"
          iconClassName="bg-[#dff5ea] text-[#087e60]"
        />
  
        <SummaryCard
          icon={<TrendingUp size={22} strokeWidth={1.7} />}
          value={`${checkinPct}%`}
          label="Study progress"
          className="bg-[#fff7ed]"
          iconClassName="bg-[#ffead3] text-[#d77315]"
        />
  
        <SummaryCard
          icon={<Sparkles size={22} strokeWidth={1.7} />}
          value={`${remainingCheckins}`}
          label="Check-ins remaining"
          className="bg-[#f4f1ff]"
          iconClassName="bg-[#e9e3ff] text-[#6951c8]"
        />
      </section>
    )
  }