"use client"

import Image from "next/image"
import Link from "next/link"

import PreSurveySidebar, {
  PRE_SURVEY_STEP_TITLES,
} from "./PreSurveySidebar"

const TOTAL_STEPS = 7

export default function PreSurveyShell({
  currentStep,
  children,
}: {
  currentStep: number
  children: React.ReactNode
}) {
  const clampedStep = Math.min(Math.max(currentStep, 1), TOTAL_STEPS)
  const progressPercent = (clampedStep / TOTAL_STEPS) * 100
  const currentTitle = PRE_SURVEY_STEP_TITLES[clampedStep - 1] ?? ""

  return (
    <main
      className="
        min-h-dvh
        bg-white
        font-['Outfit',system-ui,sans-serif]
        text-slate-950
      "
    >
      <header className="border-b border-slate-100 bg-white">
        <div className="mx-auto flex h-[72px] max-w-[1200px] items-center px-5 sm:px-8 lg:px-10">
          <Link
            href="/"
            className="
              inline-flex items-center gap-3 rounded-[10px]
              focus-visible:outline-2
              focus-visible:outline-offset-4
              focus-visible:outline-[#1473E6]
            "
          >
            <Image
              src="/images/stampleyLogo.png"
              alt="AIDES-T2D"
              width={32}
              height={32}
              priority
              className="h-8 w-auto"
            />
            <span className="hidden text-[10px] font-medium uppercase tracking-[0.16em] text-slate-500 sm:inline">
              AIDES-T2D Research Study
            </span>
          </Link>
        </div>
      </header>

      <div className="mx-auto max-w-[1200px] px-5 py-8 sm:px-8 sm:py-10 lg:px-10 lg:py-12">
        <section className="max-w-[820px]">
          <p className="text-xs font-bold uppercase tracking-[0.35em] text-cyan-700">
            Pre-survey
          </p>

          <div className="mt-4 flex flex-wrap items-end justify-between gap-3">
            <div>
              <p className="text-sm font-medium text-[#173B7A]">{currentTitle}</p>
              <p className="mt-1 text-sm text-slate-500">
                Step {clampedStep} of {TOTAL_STEPS}
              </p>
            </div>
          </div>

          <div
            className="mt-5 h-[3px] overflow-hidden bg-slate-100"
            role="progressbar"
            aria-label="Pre-survey progress"
            aria-valuemin={1}
            aria-valuemax={TOTAL_STEPS}
            aria-valuenow={clampedStep}
          >
            <div
              className="h-full bg-[#173B7A] transition-[width] duration-300 ease-out"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </section>

        <div className="mt-10 flex items-start gap-12 lg:gap-16">
          <aside className="hidden w-[240px] shrink-0 lg:block">
            <PreSurveySidebar currentStep={currentStep} />
          </aside>

          <div className="min-w-0 flex-1">
            <div className="max-w-[800px]">{children}</div>
          </div>
        </div>
      </div>
    </main>
  )
}
