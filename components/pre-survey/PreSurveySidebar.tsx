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
    <nav aria-label="Pre-survey progress">
      <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-slate-400">
        Sections
      </p>

      <div className="relative mt-6">
        <div
          aria-hidden="true"
          className="absolute top-3 bottom-3 left-[15px] w-px bg-slate-200"
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
              className={`relative flex items-start gap-3 py-3 ${
                index === 0 ? "pt-0" : ""
              } ${
                index === PRE_SURVEY_STEP_TITLES.length - 1 ? "pb-0" : ""
              }`}
            >
              <span
                className={`
                  relative z-10
                  flex h-8 w-8 shrink-0 items-center justify-center
                  rounded-full text-[11px] font-medium
                  ${
                    active
                      ? "bg-[#173B7A] text-white"
                      : completed
                        ? "bg-[#eef6ff] text-[#173B7A]"
                        : "bg-white text-slate-400 ring-1 ring-slate-200"
                  }
                `}
              >
                {completed ? (
                  <Check aria-hidden="true" strokeWidth={2.2} className="h-3.5 w-3.5" />
                ) : (
                  padded
                )}
              </span>

              <span className="min-w-0 pt-1">
                <span
                  className={`
                    block text-[10px] font-bold tracking-[0.16em]
                    ${active ? "text-[#1473E6]" : "text-slate-400"}
                  `}
                >
                  {padded}
                </span>
                <span
                  className={`
                    mt-0.5 block text-sm leading-snug
                    ${
                      active
                        ? "font-medium text-[#173B7A]"
                        : completed
                          ? "font-normal text-slate-700"
                          : "font-normal text-slate-400"
                    }
                  `}
                >
                  {title}
                </span>
              </span>
            </li>
          )
        })}
        </ol>
      </div>
    </nav>
  )
}
