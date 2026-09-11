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
        max-w-[270px]
        font-['Outfit',system-ui,sans-serif]
      "
    >
      {/* =====================================================
          HEADER
      ====================================================== */}

      <div className="mb-7">
        <p
          className="
            mt-3
            text-[20px]
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
            bottom-[38px]
            left-[23px]
            top-[38px]
            w-px
            bg-[#D8E3F0]
          "
        />

        {/* Completed vertical rail */}
        <div
          aria-hidden="true"
          className="
            absolute
            left-[23px]
            top-[38px]
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
                  gap-4
                  py-3
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

                <div className="relative z-10 flex w-[44px] shrink-0 justify-center">
                  {active ? (
                    <span
                      className="
                        relative
                        flex
                        h-[44px]
                        w-[44px]
                        items-center
                        justify-center
                        rounded-full
                        bg-white
                        text-[14px]
                        font-medium
                        text-blue-900
                        shadow-[0_4px_12px_rgba(23,59,122,0.15)]
                        ring-[1px]
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
                        h-[36px]
                        w-[36px]
                        items-center
                        justify-center
                        rounded-full
                        bg-white
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
                        className="h-[14px] w-[14px]"
                      />
                    </span>
                  ) : (
                    <span
                      className="
                        flex
                        h-[36px]
                        w-[36px]
                        items-center
                        justify-center
                        rounded-full
                        bg-white
                        text-[12px]
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
                    py-2.5
                    transition-all
                    duration-300
                    ${
                      active
                        ? "font-medium text-blue-900"
                        : "font-normal text-slate-500"
                    }
                  `}
                >
                  <span
                    className={`
                      block
                      text-[10px]
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
                      mt-1.5
                      block
                      text-[15px]
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