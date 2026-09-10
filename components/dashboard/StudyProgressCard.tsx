import { BarChart3, Check } from "lucide-react"

import DonutProgress from "@/components/dashboard/DonutProgress"

import {
  STUDY_TOTAL_CHECKINS,
  checkinsCompletedInWeek,
} from "@/lib/check-in-utils"

type Props = {
  completedCheckins: number
  activeStudyWeek: number
  thisWeekCompleted: number
  checkinPct: number
}

export default function StudyProgressCard({
  completedCheckins,
  activeStudyWeek,
  thisWeekCompleted,
  checkinPct,
}: Props) {
  const weeklySessions = [1, 2, 3, 4, 5]

  return (
    <section
      id="progress"
      className="
        rounded-[18px]
        border
        border-[#dfe8f3]
        bg-white
        p-6
        md:p-8
      "
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          <BarChart3
            size={20}
            strokeWidth={1.7}
            className="text-blue-800"
          />

          <div>
            <h2 className="text-[18px] font-medium text-[#0b2857]">
              Your Progress
            </h2>

            <p className="mt-0.5 text-[12px] text-[#7a899d]">
              Week {activeStudyWeek} of 4
            </p>
          </div>
        </div>

        <p className="text-[12px] font-medium text-blue-700">
          {completedCheckins} / {STUDY_TOTAL_CHECKINS}
        </p>
      </div>

      <div className="mt-8 grid gap-8 lg:grid-cols-[1fr_190px] lg:items-center">
        <div>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[13px] font-medium text-[#2d4565]">
                This week
              </p>

              <p className="mt-1 text-[12px] text-[#8391a3]">
                Complete at least five study sessions each week.
              </p>
            </div>

            <p className="text-[14px] font-semibold text-blue-900">
              {thisWeekCompleted}/5
            </p>
          </div>

          <div className="mt-7 grid grid-cols-5 gap-3">
            {weeklySessions.map((sessionNumber) => {
              const complete =
                sessionNumber <= thisWeekCompleted

              return (
                <div
                  key={sessionNumber}
                  className="flex flex-col items-center gap-2"
                >
                  <div
                    className={`
                      flex
                      h-11
                      w-11
                      items-center
                      justify-center
                      rounded-full
                      border
                      ${
                        complete
                          ? "border-blue-700 bg-blue-700 text-white"
                          : "border-[#bdd2e8] bg-white text-[#9eb1c7]"
                      }
                    `}
                  >
                    {complete ? (
                      <Check size={18} />
                    ) : (
                      <span className="text-[12px]">
                        {sessionNumber}
                      </span>
                    )}
                  </div>

                  <span className="text-[10px] text-[#8190a4]">
                    Session {sessionNumber}
                  </span>
                </div>
              )
            })}
          </div>

          <div className="mt-8 border-t border-[#e8eef5] pt-6">
            <div className="grid grid-cols-4 gap-2">
              {[1, 2, 3, 4].map((week) => {
                const completed =
                  checkinsCompletedInWeek(
                    completedCheckins,
                    week
                  )

                const active =
                  week === activeStudyWeek

                return (
                  <div
                    key={week}
                    className={`
                      border
                      px-3
                      py-3
                      text-center
                      ${
                        active
                          ? "border-blue-700 bg-[#f3f8fe]"
                          : "border-[#e3ebf4] bg-white"
                      }
                    `}
                  >
                    <p className="text-[9px] uppercase tracking-[0.14em] text-[#8997a9]">
                      Week
                    </p>

                    <p className="mt-1 text-[15px] font-medium text-blue-900">
                      {week}
                    </p>

                    <p className="mt-1 text-[10px] text-[#7e8ea2]">
                      {completed}/5
                    </p>
                  </div>
                )
              })}
            </div>
          </div>
        </div>

        <div className="flex justify-center">
          <DonutProgress
            percent={checkinPct}
            completed={completedCheckins}
            total={STUDY_TOTAL_CHECKINS}
          />
        </div>
      </div>
    </section>
  )
}