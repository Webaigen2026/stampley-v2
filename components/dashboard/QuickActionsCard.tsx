import Link from "next/link"

import {
  ArrowRight,
  ClipboardCheck,
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
    <section
      className="
        rounded-[14px]
        bg-white
        p-5
        font-[Univers,'Helvetica_Neue',Helvetica,Arial,sans-serif]
        shadow-[0_8px_30px_rgba(15,45,80,0.08)]
      "
    >
      {/* Header */}
      <div className="mb-4">
        <p
          className="
            text-[9px]
            font-medium
            uppercase
            tracking-[0.16em]
            text-[#7a8b9f]
          "
        >
          Shortcuts
        </p>

        <h2
          className="
            mt-1.5
            text-[18px]
            font-medium
            tracking-[-0.02em]
            text-[#0b2857]
          "
        >
          Quick Actions
        </h2>
      </div>

      {/* Actions */}
      <div className="space-y-2">
        <QuickAction
          href="/check-in"
          imageSrc="/dashboard/calandar.png"
          imageAlt=""
          label={
            checkedInToday
              ? "View Today's Check-In"
              : "Go to Daily Check-In"
          }
        />

        {studyComplete && !postSurveyCompleted && (
          <QuickAction
            href="/survey/post-survey"
            icon={
              <ClipboardCheck
                size={17}
                strokeWidth={1.7}
              />
            }
            label="Complete Post-Survey"
          />
        )}
      </div>
    </section>
  )
}

function QuickAction({
  href,
  imageSrc,
  imageAlt = "",
  icon,
  label,
}: {
  href: string
  imageSrc?: string
  imageAlt?: string
  icon?: React.ReactNode
  label: string
}) {
  return (
    <Link
      href={href}
      className="
        group
        flex
        min-h-[58px]
        items-center
        justify-between
        gap-4
        rounded-[10px]
        bg-[#f6f9fc]
        px-3.5
        py-2.5
        transition-all
        duration-200
        hover:-translate-y-[1px]
        hover:bg-[#edf4fb]
        hover:shadow-[0_6px_18px_rgba(15,45,80,0.07)]
        focus-visible:outline-none
        focus-visible:ring-2
        focus-visible:ring-[#1473E6]/30
      "
    >
      <span className="flex min-w-0 items-center gap-3">
        {/* Custom image or fallback icon */}
        {imageSrc ? (
          <span
            className="
              flex
              h-[44px]
              w-[44px]
              shrink-0
              items-center
              justify-center
            "
          >
            <img
              src={imageSrc}
              alt={imageAlt}
              width={44}
              height={44}
              className="
                h-[44px]
                w-[44px]
                object-contain
                transition-transform
                duration-300
                group-hover:scale-[1.06]
              "
            />
          </span>
        ) : (
          <span
            className="
              flex
              h-9
              w-9
              shrink-0
              items-center
              justify-center
              rounded-[9px]
              bg-white
              text-[#1769d2]
              shadow-[0_2px_8px_rgba(15,45,80,0.05)]
              transition-colors
              duration-200
              group-hover:bg-[#0b4178]
              group-hover:text-white
            "
          >
            {icon}
          </span>
        )}

        {/* Label */}
        <span
          className="
            truncate
            text-[12.5px]
            font-medium
            text-[#263f5d]
            transition-colors
            duration-200
            group-hover:text-[#0b2857]
          "
        >
          {label}
        </span>
      </span>

      {/* Arrow */}
      <span
        className="
          flex
          h-7
          w-7
          shrink-0
          items-center
          justify-center
          rounded-full
          text-[#7d8da1]
          transition-all
          duration-200
          group-hover:bg-white
          group-hover:text-[#0b4178]
        "
      >
        <ArrowRight
          size={14}
          strokeWidth={1.7}
          className="
            transition-transform
            duration-200
            group-hover:translate-x-[2px]
          "
        />
      </span>
    </Link>
  )
}