import Link from "next/link"

import {
  ArrowRight,
  CalendarCheck2,
  ClipboardCheck,
  Target,
} from "lucide-react"

type Props = {
  checkedInToday: boolean
  studyComplete: boolean
  postSurveyCompleted: boolean
}

export default function QuickActionsCard({
  checkedInToday,
  studyComplete,
  postSurveyCompleted,
}: Props) {
  return (
    <section className="rounded-[18px] border border-[#dfe8f3] bg-white p-6">
      <h2 className="text-[17px] font-medium text-[#0b2857]">
        Quick Actions
      </h2>

      <div className="mt-4 divide-y divide-[#e8eef5]">
        <QuickAction
          href="/check-in"
          icon={<CalendarCheck2 size={17} />}
          label={
            checkedInToday
              ? "View Today's Check-In"
              : "Go to Daily Check-In"
          }
        />

        <QuickAction
          href="/survey/dds/results"
          icon={<Target size={17} />}
          label="View Support Focus"
        />

        {studyComplete && !postSurveyCompleted && (
          <QuickAction
            href="/survey/post-survey"
            icon={<ClipboardCheck size={17} />}
            label="Complete Post-Survey"
          />
        )}
      </div>
    </section>
  )
}

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
        py-4
        text-blue-900
      "
    >
      <span className="flex items-center gap-3">
        <span className="text-blue-700">
          {icon}
        </span>

        <span className="text-[12px] font-medium">
          {label}
        </span>
      </span>

      <ArrowRight
        size={14}
        className="transition-transform group-hover:translate-x-1"
      />
    </Link>
  )
}