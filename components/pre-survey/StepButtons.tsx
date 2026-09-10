"use client"

import { ArrowRight } from "lucide-react"

export default function StepButtons({
  prevStep,
  nextStep,
  nextLabel = "Continue",
  submit = false,
}: {
  prevStep?: () => void
  nextStep?: () => void
  nextLabel?: string
  submit?: boolean
}) {
  return (
    <div className="mt-8 flex items-center justify-between gap-4 border-t border-slate-100 bg-white px-6 py-5 font-['Outfit',system-ui,sans-serif]">
      {prevStep ? (
        <button
          type="button"
          onClick={prevStep}
          className="
            h-[52px]
            cursor-pointer
            rounded-[10px]
            px-5
            text-sm
            font-normal
            text-slate-600
            transition
            hover:bg-slate-50
            hover:text-slate-950
            focus-visible:outline-2
            focus-visible:outline-offset-2
            focus-visible:outline-[#173B7A]
          "
        >
          Back
        </button>
      ) : (
        <div />
      )}

      <button
        type={submit ? "submit" : "button"}
        onClick={submit ? undefined : nextStep}
        className="
          group
          inline-flex
          h-[56px]
          min-w-[168px]
          cursor-pointer
          items-center
          justify-between
          gap-5
          rounded-[10px]
          bg-[#173B7A]
          px-6
          text-sm
          font-normal
          text-white
          transition
          hover:bg-[#122E60]
          focus-visible:outline-2
          focus-visible:outline-offset-2
          focus-visible:outline-[#173B7A]
        "
      >
        <span>{nextLabel}</span>
        <span
          className="
            flex h-8 w-8 items-center justify-center
            rounded-full border border-white/70
            transition-transform duration-200
            group-hover:translate-x-0.5
          "
          aria-hidden="true"
        >
          <ArrowRight strokeWidth={1.8} className="h-[15px] w-[15px]" />
        </span>
      </button>
    </div>
  )
}
