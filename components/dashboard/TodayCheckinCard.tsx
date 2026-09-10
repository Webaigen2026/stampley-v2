import Link from "next/link"

import {
  ArrowRight,
  Check,
  Clock3,
} from "lucide-react"

type Props = {
  checkedInToday: boolean
  studyComplete: boolean
  postSurveyCompleted: boolean
}

export default function TodayCheckinCard({
  checkedInToday,
  studyComplete,
  postSurveyCompleted,
}: Props) {
  return (
    <section
      className="
        relative
        overflow-hidden
        rounded-[22px]
        bg-[#0b4178]
        p-6
        text-white
        md:p-8
      "
    >
      <div className="relative z-10 flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
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
              border-white/25
            "
          >
            {checkedInToday ? (
              <Check size={25} strokeWidth={1.7} />
            ) : (
              <Clock3 size={24} strokeWidth={1.7} />
            )}
          </div>

          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-white/55">
              Today&apos;s Check-In
            </p>

            <h2 className="mt-2 text-[24px] font-medium tracking-[-0.025em] text-white">
              {studyComplete
                ? "Your study check-ins are complete."
                : checkedInToday
                  ? "You’re all set for today."
                  : "Your check-in is ready."}
            </h2>

            <p className="mt-2 max-w-xl text-[14px] leading-6 text-white/70">
              {studyComplete
                ? "Thank you for completing all 20 study check-ins."
                : checkedInToday
                  ? "Today’s check-in has been saved. Come back tomorrow for your next session."
                  : "Take a few minutes to complete today’s study session."}
            </p>
          </div>
        </div>

        <div className="shrink-0">
          {studyComplete ? (
            postSurveyCompleted ? (
              <div className="rounded-full border border-white/20 px-5 py-3 text-[12px] font-medium">
                Study complete
              </div>
            ) : (
              <Link
                href="/survey/post-survey"
                className="inline-flex items-center gap-2 rounded-full bg-white px-5 py-3 text-[12px] font-medium text-blue-900"
              >
                Complete Post-Survey
                <ArrowRight size={15} />
              </Link>
            )
          ) : (
            <Link
              href="/check-in"
              className="inline-flex items-center gap-2 rounded-full bg-white px-5 py-3 text-[12px] font-medium text-blue-900"
            >
              {checkedInToday
                ? "View Today's Status"
                : "Start Check-In"}

              <ArrowRight size={15} />
            </Link>
          )}
        </div>
      </div>
    </section>
  )
}