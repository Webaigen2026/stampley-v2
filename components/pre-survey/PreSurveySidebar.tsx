"use client"

import { Check } from "lucide-react"

export const PRE_SURVEY_STEP_TITLES = [
  "Consent",
  "Demographics",
  "Health Literacy",
  "Diabetes History",
  "Technology",
  "PHQ-9",
  "Review",
] as const

export default function PreSurveySidebar({
  currentStep,
}: {
  currentStep: number
}) {
  return (
    <nav
      aria-label="Pre-survey progress"
      className="
        w-full
        max-w-[290px]
        font-['Outfit',system-ui,sans-serif]
      "
    >
      {/* =====================================================
          HEADER
      ====================================================== */}
      <div className="mb-8">
        <p
          className="
            text-[11px]
            font-semibold
            uppercase
            tracking-[0.28em]
            text-slate-500
          "
        >
          Survey Progress
        </p>

        <p
          className="
            mt-3
            text-[22px]
            font-light
            leading-none
            tracking-[-0.025em]
            text-slate-700
          "
        >
          Step {currentStep} of {PRE_SURVEY_STEP_TITLES.length}
        </p>
      </div>

      {/* =====================================================
          PROGRESS
      ====================================================== */}
      <div className="relative">
        {/* Base vertical rail */}
        <div
          aria-hidden="true"
          className="
            absolute
            bottom-[42px]
            left-[31px]
            top-[42px]
            w-px
            bg-[#D8E3F0]
          "
        />

        {/* Completed vertical rail */}
        <div
          aria-hidden="true"
          className="
            absolute
            left-[31px]
            top-[42px]
            w-px
            bg-[#8FB8E8]
            transition-[height]
            duration-500
            ease-out
          "
          style={{
            height:
              currentStep <= 1
                ? "0%"
                : `${
                    ((currentStep - 1) /
                      (PRE_SURVEY_STEP_TITLES.length - 1)) *
                    84
                  }%`,
          }}
        />

        <ol className="relative list-none">
          {PRE_SURVEY_STEP_TITLES.map((title, index) => {
            const stepNumber = index + 1
            const active = currentStep === stepNumber
            const completed = currentStep > stepNumber
            const padded = String(stepNumber).padStart(2, "0")

            return (
              <li
                key={title}
                aria-current={active ? "step" : undefined}
                className={`
                  relative
                  flex
                  items-center
                  gap-5
                  py-3.5
                  ${index === 0 ? "pt-0" : ""}
                  ${
                    index === PRE_SURVEY_STEP_TITLES.length - 1
                      ? "pb-0"
                      : ""
                  }
                `}
              >
                {/* =================================================
                    STEP MARKER
                ================================================== */}
                <div className="relative z-10 flex w-[64px] shrink-0 justify-center">
                  {active ? (
                    <span
                      className="
                        relative
                        flex
                        h-[64px]
                        w-[64px]
                        items-center
                        justify-center
                        rounded-full
                        bg-[#173B7A]
                        text-[19px]
                        font-medium
                        text-white
                        shadow-[0_8px_22px_rgba(23,59,122,0.18)]
                        ring-[10px]
                        ring-[#EEF6FF]
                        transition-all
                        duration-300
                      "
                    >
                      {padded}
                    </span>
                  ) : completed ? (
                    <span
                      className="
                        flex
                        h-[54px]
                        w-[54px]
                        items-center
                        justify-center
                        rounded-full
                        bg-[#EAF3FF]
                        text-[#173B7A]
                        ring-1
                        ring-[#D5E5F7]
                        transition-all
                        duration-300
                      "
                    >
                      <Check
                        aria-hidden="true"
                        strokeWidth={2}
                        className="h-5 w-5"
                      />
                    </span>
                  ) : (
                    <span
                      className="
                        flex
                        h-[54px]
                        w-[54px]
                        items-center
                        justify-center
                        rounded-full
                        bg-white
                        text-[18px]
                        font-normal
                        text-slate-500
                        ring-1
                        ring-[#CFDCEB]
                        transition-all
                        duration-300
                      "
                    >
                      {padded}
                    </span>
                  )}
                </div>

                {/* =================================================
                    STEP CONTENT
                ================================================== */}
                <div
                  className={`
                    min-w-0
                    flex-1
                    rounded-[14px]
                    px-4
                    py-3
                    transition-all
                    duration-300
                    ${
                      active
                        ? "bg-[#F2F8FF]"
                        : "bg-transparent"
                    }
                  `}
                >
                  <span
                    className={`
                      block
                      text-[11px]
                      font-semibold
                      uppercase
                      tracking-[0.24em]
                      ${
                        active
                          ? "text-[#1473E6]"
                          : completed
                            ? "text-slate-400"
                            : "text-slate-500"
                      }
                    `}
                  >
                    Step {padded}
                  </span>

                  <span
                    className={`
                      mt-2
                      block
                      text-[17px]
                      leading-tight
                      tracking-[-0.015em]
                      ${
                        active
                          ? "font-medium text-[#0B2857]"
                          : completed
                            ? "font-normal text-slate-600"
                            : "font-normal text-slate-500"
                      }
                    `}
                  >
                    {title}
                  </span>
                </div>
              </li>
            )
          })}
        </ol>
      </div>
    </nav>
  )
}