import Link from "next/link"

import {
  ArrowRight,
  Target,
} from "lucide-react"

type Props = {
  activeStudyWeek: number
  domainMeta: {
    label: string
    description: string
  } | null
}

export default function SupportFocusCard({
  activeStudyWeek,
  domainMeta,
}: Props) {
  return (
    <section
      id="focus"
      className="
        rounded-[18px]
        border
        border-[#dfe8f3]
        bg-white
        p-6
      "
    >
      <div className="flex items-center gap-3">
        <Target
          size={20}
          strokeWidth={1.7}
          className="text-blue-700"
        />

        <div>
          <h2 className="text-[17px] font-medium text-[#0b2857]">
            Your Support Focus
          </h2>

          <p className="mt-0.5 text-[11px] text-[#8391a3]">
            Week {activeStudyWeek}
          </p>
        </div>
      </div>

      {domainMeta ? (
        <div className="mt-5 border-l-2 border-blue-700 pl-4">
          <h3 className="text-[15px] font-medium text-blue-900">
            {domainMeta.label}
          </h3>

          <p className="mt-2 text-[12px] leading-5 text-[#60738d]">
            {domainMeta.description}
          </p>
        </div>
      ) : (
        <div className="mt-5 border-l-2 border-slate-200 pl-4">
          <p className="text-[13px] font-medium text-[#3f5572]">
            No weekly focus selected yet.
          </p>

          <p className="mt-2 text-[12px] leading-5 text-[#7a8a9f]">
            Your focus will be selected during Step 4 of your
            next check-in.
          </p>
        </div>
      )}

      <Link
        href="/survey/dds/results"
        className="mt-5 inline-flex items-center gap-2 text-[12px] font-medium text-blue-700"
      >
        View DDS Results
        <ArrowRight size={14} />
      </Link>
    </section>
  )
}