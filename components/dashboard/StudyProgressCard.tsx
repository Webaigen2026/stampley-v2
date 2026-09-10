import { Check } from "lucide-react"

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
  const studyWeeks = [1, 2, 3, 4]

  const remainingThisWeek = Math.max(
    5 - thisWeekCompleted,
    0
  )

  const weeklyData = studyWeeks.map((week) => ({
    week,
    completed: checkinsCompletedInWeek(
      completedCheckins,
      week
    ),
  }))

  return (
    <section
      id="progress"
      className="
        overflow-hidden
        rounded-[16px]
        bg-white
        font-[Univers,'Helvetica_Neue',Helvetica,Arial,sans-serif]
        shadow-[0_12px_40px_rgba(15,45,80,0.09)]
      "
    >
      {/* =====================================================
          HEADER
      ====================================================== */}
      <div
        className="
          flex
          flex-col
          gap-5
          border-b
          border-[#e8edf3]
          px-6
          py-6
          md:flex-row
          md:items-end
          md:justify-between
          md:px-8
        "
      >
        <div>
          <h2
            className="
              text-[28px]
              font-medium
              leading-none
              tracking-[-0.03em]
              text-[#0b2857]
            "
          >
            Your Progress
          </h2>

          <p
            className="
              mt-2
              text-[14px]
              text-[#61738c]
            "
          >
            Week {activeStudyWeek} of 4
          </p>
        </div>

        <div className="md:text-right">
          <p
            className="
              text-[14px]
              font-medium
              text-[#244875]
            "
          >
            {completedCheckins} /{" "}
            {STUDY_TOTAL_CHECKINS} sessions
          </p>

          <p
            className="
              mt-1
              text-[11px]
              text-[#8a98aa]
            "
          >
            Overall study completion
          </p>
        </div>
      </div>

      {/* =====================================================
          MAIN CONTENT
      ====================================================== */}
      <div
        className="
          grid
          gap-8
          px-6
          py-7
          md:px-8
          lg:grid-cols-[minmax(0,1fr)_310px]
        "
      >
        {/* =====================================================
            THIS WEEK
        ====================================================== */}
        <div
          className="
            rounded-[14px]
            bg-[#f4f8fd]
            px-6
            py-6
          "
        >
          <div
            className="
              flex
              flex-col
              gap-3
              sm:flex-row
              sm:items-end
              sm:justify-between
            "
          >
            <div>
              <h3
                className="
                  text-[22px]
                  font-medium
                  tracking-[-0.02em]
                  text-[#0b2857]
                "
              >
                This week
              </h3>

              <p
                className="
                  mt-1
                  text-[13px]
                  leading-5
                  text-[#536984]
                "
              >
                Complete at least five study
                sessions each week.
              </p>
            </div>

            <div className="sm:text-right">
              <p
                className="
                  text-[14px]
                  font-semibold
                  text-[#0b4178]
                "
              >
                {thisWeekCompleted}/5
              </p>

              <p
                className="
                  mt-1
                  text-[10px]
                  text-[#7f8ea2]
                "
              >
                {remainingThisWeek === 0
                  ? "Week complete"
                  : `${remainingThisWeek} remaining`}
              </p>
            </div>
          </div>

          {/* Session path */}
          <div className="relative mt-8">
            {/* Connecting line */}
            <div
              aria-hidden="true"
              className="
                absolute
                left-[8%]
                right-[8%]
                top-[22px]
                h-[2px]
                bg-[#d4dfec]
              "
            />

            {/* Completed line */}
            <div
              aria-hidden="true"
              className="
                absolute
                left-[8%]
                top-[22px]
                h-[2px]
                bg-[#1769d2]
                transition-[width]
                duration-500
              "
              style={{
                width: `${Math.min(
                  (thisWeekCompleted / 4) * 84,
                  84
                )}%`,
              }}
            />

            <div
              className="
                relative
                z-10
                grid
                grid-cols-5
                gap-2
              "
            >
              {weeklySessions.map(
                (sessionNumber) => {
                  const complete =
                    sessionNumber <=
                    thisWeekCompleted

                  return (
                    <div
                      key={sessionNumber}
                      className="
                        flex
                        flex-col
                        items-center
                        text-center
                      "
                    >
                      <div
                        className={`
                          flex
                          h-11
                          w-11
                          items-center
                          justify-center
                          rounded-full
                          border-[2px]
                          transition-all
                          duration-300
                          ${
                            complete
                              ? "border-[#1769d2] bg-[#1769d2] text-white shadow-[0_4px_12px_rgba(23,105,210,0.22)]"
                              : "border-[#8fb5e5] bg-white text-[#1769d2]"
                          }
                        `}
                      >
                        {complete ? (
                          <Check
                            size={18}
                            strokeWidth={2.2}
                          />
                        ) : (
                          <span className="text-[14px] font-medium">
                            {sessionNumber}
                          </span>
                        )}
                      </div>

                      <span
                        className="
                          mt-3
                          text-[11px]
                          font-medium
                          text-[#35506f]
                        "
                      >
                        Session {sessionNumber}
                      </span>
                    </div>
                  )
                }
              )}
            </div>
          </div>
        </div>

        {/* =====================================================
            REAL PROGRESS GRAPH
        ====================================================== */}
        <div
          className="
            flex
            flex-col
            border-t
            border-[#e6edf4]
            pt-7
            lg:border-l
            lg:border-t-0
            lg:pl-8
            lg:pt-0
          "
        >
          <div>
            <p
              className="
                text-[10px]
                font-medium
                uppercase
                tracking-[0.14em]
                text-[#8391a4]
              "
            >
              Weekly activity
            </p>

            <div
              className="
                mt-2
                flex
                items-end
                justify-between
                gap-3
              "
            >
              <div>
                <p
                  className="
                    text-[24px]
                    font-medium
                    tracking-[-0.03em]
                    text-[#0b2857]
                  "
                >
                  {checkinPct}%
                </p>

                <p
                  className="
                    mt-1
                    text-[11px]
                    text-[#8190a3]
                  "
                >
                  overall completion
                </p>
              </div>

              <p
                className="
                  text-[11px]
                  text-[#8190a3]
                "
              >
                Goal: 5 / week
              </p>
            </div>
          </div>

          {/* Chart */}
          <div
            className="
              relative
              mt-7
              h-[150px]
              border-b
              border-[#dfe6ee]
            "
          >
            {/* Goal line */}
            <div
              aria-hidden="true"
              className="
                absolute
                inset-x-0
                top-0
                border-t
                border-dashed
                border-[#bfd0e1]
              "
            />

            <span
              className="
                absolute
                right-0
                top-[-17px]
                text-[9px]
                text-[#8a98aa]
              "
            >
              5 sessions
            </span>

            {/* Grid lines */}
            <div
              aria-hidden="true"
              className="
                absolute
                inset-x-0
                top-[50%]
                border-t
                border-[#eef2f6]
              "
            />

            {/* Bars */}
            <div
              className="
                absolute
                inset-0
                flex
                items-end
                justify-between
                gap-3
                px-1
              "
            >
              {weeklyData.map(
                ({ week, completed }) => {
                  const isActive =
                    week === activeStudyWeek

                  const height =
                    completed === 0
                      ? 5
                      : Math.max(
                          (Math.min(
                            completed,
                            5
                          ) /
                            5) *
                            100,
                          8
                        )

                  return (
                    <div
                      key={week}
                      className="
                        flex
                        h-full
                        flex-1
                        items-end
                        justify-center
                      "
                    >
                      <div
                        className="
                          relative
                          flex
                          h-full
                          w-full
                          max-w-[42px]
                          items-end
                        "
                      >
                        <div
                          className={`
                            w-full
                            rounded-t-[5px]
                            transition-[height]
                            duration-500
                            ${
                              isActive
                                ? "bg-[#1769d2]"
                                : completed > 0
                                  ? "bg-[#78a9e4]"
                                  : "bg-[#e4ebf3]"
                            }
                          `}
                          style={{
                            height: `${height}%`,
                          }}
                        />

                        {completed > 0 && (
                          <span
                            className="
                              absolute
                              left-1/2
                              -translate-x-1/2
                              text-[10px]
                              font-medium
                              text-[#33516f]
                            "
                            style={{
                              bottom: `calc(${height}% + 6px)`,
                            }}
                          >
                            {completed}
                          </span>
                        )}
                      </div>
                    </div>
                  )
                }
              )}
            </div>
          </div>

          {/* Week labels */}
          <div
            className="
              mt-3
              grid
              grid-cols-4
              gap-3
              px-1
            "
          >
            {weeklyData.map(({ week }) => (
              <div
                key={week}
                className="text-center"
              >
                <p
                  className={`
                    text-[10px]
                    font-medium
                    ${
                      week === activeStudyWeek
                        ? "text-[#1769d2]"
                        : "text-[#8a98aa]"
                    }
                  `}
                >
                  W{week}
                </p>
              </div>
            ))}
          </div>

         
        </div>
      </div>
    </section>
  )
}