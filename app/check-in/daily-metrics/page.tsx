"use client"

import { useCheckInStore } from "@/store/checkin-store"
import { computeWellnessPercent } from "@/lib/wellness-score"
import { Info } from "lucide-react"

function MetricCard({
  title,
  question,
  minLabel,
  maxLabel,
  value,
  onChange,
  ariaLabel,
  showHighDistressNote = false,
}: {
  title: string
  question: string
  minLabel: string
  maxLabel: string
  value: number | undefined
  onChange: (value: number) => void
  ariaLabel: string
  showHighDistressNote?: boolean
}) {
  const answered = value !== undefined
  const storedValue = answered ? value : 0
  const sliderPosition = answered ? storedValue : 0
  const fillPercent = answered ? (storedValue / 10) * 100 : 0

  return (
    <section
      className="
        rounded-[8px]
        bg-white
        px-5
        py-6
        shadow-[0_10px_30px_rgba(15,45,80,0.07)]
        sm:px-6
        sm:py-7
      "
    >
      <div
        className="
          flex
          flex-col
          gap-6
          lg:flex-row
          lg:items-center
          lg:gap-8
        "
      >
        <div className="min-w-0 lg:w-[240px] lg:shrink-0">
          <p
            className="
              text-[11px]
              font-semibold
              uppercase
              tracking-[0.18em]
              text-[#1473E6]
            "
          >
            {title}
          </p>
          <h2
            className="
              mt-2
              text-lg
              font-medium
              leading-snug
              text-[#0B2857]
              sm:text-xl
            "
          >
            {question}
          </h2>
        </div>

        <div className="min-w-0 flex-1">
          <div className="relative pt-1 pb-2">
            <div className="relative h-10">
              <div className="absolute left-0 right-0 top-1/2 h-1.5 -translate-y-1/2 rounded-full bg-[#E6EEF7]" />
              <div
                className="absolute left-0 top-1/2 h-1.5 -translate-y-1/2 rounded-full bg-[#1473E6]"
                style={{ width: `${fillPercent}%` }}
              />
              <input
                type="range"
                min={0}
                max={10}
                step={1}
                value={sliderPosition}
                onChange={(e) => onChange(Number(e.target.value))}
                aria-label={ariaLabel}
                aria-valuemin={0}
                aria-valuemax={10}
                aria-valuenow={answered ? storedValue : undefined}
                aria-valuetext={answered ? String(storedValue) : "Not selected"}
                className="
                  relative
                  z-10
                  h-10
                  w-full
                  cursor-pointer
                  appearance-none
                  bg-transparent
                  accent-[#1473E6]
                  focus-visible:outline-2
                  focus-visible:outline-offset-4
                  focus-visible:outline-[#173B7A]
                "
              />
            </div>

            <div className="mt-1 flex justify-between px-0.5">
              {Array.from({ length: 11 }, (_, tick) => (
                <span
                  key={tick}
                  className={`
                    w-4
                    text-center
                    text-[10px]
                    tabular-nums
                    ${
                      answered && storedValue === tick
                        ? "font-semibold text-[#173B7A]"
                        : "text-slate-400"
                    }
                  `}
                >
                  {tick}
                </span>
              ))}
            </div>
          </div>

          <div className="mt-3 flex items-start justify-between gap-4 text-xs leading-relaxed text-slate-500">
            <span className="max-w-[46%]">{minLabel}</span>
            <span className="max-w-[46%] text-right">{maxLabel}</span>
          </div>
        </div>

        <div
          className="
            flex
            shrink-0
            items-end
            justify-end
            gap-0.5
            lg:w-[88px]
            lg:flex-col
            lg:items-end
          "
        >
          <span
            className="
              text-4xl
              font-light
              leading-none
              tracking-tight
              text-[#0B2857]
              sm:text-5xl
            "
          >
            {answered ? storedValue : "—"}
          </span>
          <span className="mb-1 text-sm font-medium text-slate-400">/10</span>
        </div>
      </div>

      {showHighDistressNote && answered && storedValue >= 8 ? (
        <div className="mt-5 rounded-[12px] bg-amber-50 px-4 py-3 text-sm leading-relaxed text-amber-800">
          You&apos;re reporting high stress today. Stampley will provide extra
          support.
        </div>
      ) : null}
    </section>
  )
}

export default function DailyMetricsPage() {
  const { distress, mood, energy, setDistress, setMood, setEnergy } =
    useCheckInStore()

  const wellness = computeWellnessPercent(distress, mood, energy)

  return (
    <div
      className="
        relative
        isolate
        min-h-full
        overflow-x-hidden
        bg-white
        font-['Outfit',system-ui,sans-serif]
        text-slate-950
      "
    >
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 -z-10 overflow-hidden bg-white"
      >
        <div className="absolute -left-[180px] top-[40px] h-[520px] w-[520px] rounded-full bg-[#EAF4FF]/55 blur-[120px]" />
        <div className="absolute right-[-160px] top-[220px] h-[420px] w-[420px] rounded-full bg-[#F1F7FF]/70 blur-[130px]" />
      </div>

      <div className="mx-auto w-full max-w-[920px] px-5 pb-32 pt-8 sm:px-8 sm:pt-10 lg:px-10">
      

        <div className="mt-4 flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
          <div className="min-w-0">
            <h1
              className="
                max-w-full
                text-3xl
                font-light
                tracking-tight
                text-[#0B2857]
                sm:text-4xl
              "
            >
              How are you feeling today?
            </h1>

            <p
              className="
                mt-4
                max-w-full
                text-base
                font-normal
                leading-relaxed
                text-slate-600
                sm:text-lg
              "
            >
              Take a moment to check in with yourself. Use the sliders below to
              rate each area from 0 to 10.
            </p>

          </div>

         
        </div>

        <div className="mt-10 space-y-5">
          <MetricCard
            title="Stress"
            question="How much diabetes-related stress are you feeling today?"
            minLabel="0 = Not at all stressed"
            maxLabel="10 = Extremely stressed"
            value={distress}
            onChange={setDistress}
            ariaLabel="Diabetes-related stress from 0 not at all stressed to 10 extremely stressed"
            showHighDistressNote
          />

          <MetricCard
            title="Mood"
            question="How would you rate your overall mood today?"
            minLabel="0 = Very low mood"
            maxLabel="10 = Excellent mood"
            value={mood}
            onChange={setMood}
            ariaLabel="Overall mood from 0 very low mood to 10 excellent mood"
          />

          <MetricCard
            title="Energy"
            question="How would you rate your energy level today?"
            minLabel="0 = No energy"
            maxLabel="10 = Very high energy"
            value={energy}
            onChange={setEnergy}
            ariaLabel="Energy level from 0 no energy to 10 very high energy"
          />
        </div>

        <aside
          className="
            mt-6
            flex
            items-start
            gap-3
            rounded-[16px]
            bg-[#F7FAFD]
            px-5
            py-4
          "
        >
          <span
            className="
              mt-0.5
              flex
              h-8
              w-8
              shrink-0
              items-center
              justify-center
              rounded-full
              bg-[#EAF4FF]
              text-[#1473E6]
            "
          >
            <Info aria-hidden="true" size={16} strokeWidth={1.8} />
          </span>
          <p className="text-sm leading-relaxed text-slate-600">
            There are no right or wrong answers. Your responses help us
            understand how you&apos;re doing and provide more personalized
            support during today&apos;s check-in.
          </p>
        </aside>
      </div>
    </div>
  )
}
