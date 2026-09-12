"use client"

import { useSyncExternalStore } from "react"
import { useRouter, usePathname } from "next/navigation"
import { STEPS } from "@/app/check-in/constants/navigation"
import { ArrowRight, ChevronLeft, Loader2, CheckCircle2 } from "lucide-react"
import { AnimatePresence } from "framer-motion"
import { useCheckInStore } from "@/store/checkin-store"
import { useCheckInSubmit } from "@/components/check-in/CheckInSubmitContext"
import { getContinueBlockedMessage } from "@/lib/check-in-step-validation"

const STAMPLEY_INDEX = STEPS.findIndex(
  (s) => s.path === "/check-in/stampley-support"
)

function useIsClientReady() {
  return useSyncExternalStore(
    () => () => {},
    () => true,
    () => false
  )
}

export default function StepDock() {
  const router = useRouter()
  const pathname = usePathname()
  const mounted = useIsClientReady()

  const distress = useCheckInStore((s) => s.distress)
  const mood = useCheckInStore((s) => s.mood)
  const energy = useCheckInStore((s) => s.energy)
  const contextTags = useCheckInStore((s) => s.contextTags)
  const reflection = useCheckInStore((s) => s.reflection)
  const copingAction = useCheckInStore((s) => s.copingAction)
  const domain = useCheckInStore((s) => s.domain)

  const { onSubmit, meta } = useCheckInSubmit()

  const currentIndex = STEPS.findIndex((s) => s.path === pathname)
  const currentStepNum = currentIndex + 1
  const isStampleyStep = currentIndex === STAMPLEY_INDEX

  if (currentIndex === -1 || meta.submitted || meta.checkInSaved) {
    return null
  }

  const continueBlockedMessage = mounted
    ? getContinueBlockedMessage(currentIndex, {
        distress,
        mood,
        energy,
        contextTags,
        reflection,
        copingAction,
        domain,
      })
    : null
  const continueDisabled = mounted && continueBlockedMessage !== null

  const submitDisabled =
    isStampleyStep &&
    (meta.submitting || meta.loading || meta.checkInSaved || meta.submitted)

  const primaryDisabled = continueDisabled || submitDisabled

  const handleNavigate = (dir: "next" | "prev") => {
    const targetIndex = dir === "next" ? currentIndex + 1 : currentIndex - 1

    if (targetIndex >= 0 && targetIndex < STEPS.length) {
      router.push(STEPS[targetIndex].path)
    }
  }

  const handlePrimary = () => {
    if (primaryDisabled) return

    if (isStampleyStep) {
      onSubmit()
      return
    }

    handleNavigate("next")
  }

  const primaryLabel = isStampleyStep
    ? meta.submitting
      ? "Saving Check-in"
      : meta.loading
        ? "Preparing Response"
        : meta.label ?? "Submit & Hear from Stampley"
    : currentIndex === 0
      ? "Continue to Contextual Factors"
      : "Continue"

  return (
    <div className="flex w-full max-w-[920px] flex-col items-stretch gap-2 font-['Outfit',system-ui,sans-serif]">
      {continueBlockedMessage ? (
        <p
          className="px-1 text-center text-sm font-medium leading-snug "
          role="status"
        >
          {continueBlockedMessage}
        </p>
      ) : null}

      <div className="flex items-center justify-between gap-4">
        <AnimatePresence initial={false}>
          {currentStepNum > 1 ? (
            <button
              type="button"
              onClick={() => handleNavigate("prev")}
              className="
                inline-flex
                h-12
                cursor-pointer
                items-center
                gap-1
                rounded-[10px]
                bg-slate-50
                px-4
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
              aria-label="Go back"
            >
              <ChevronLeft size={16} />
              Back
            </button>
          ) : (
            <div />
          )}
        </AnimatePresence>

        <button
          type="button"
          onClick={handlePrimary}
          disabled={primaryDisabled}
          className="
            group
            inline-flex
            h-12
            min-w-[188px]
            cursor-pointer
            items-center
            justify-between
            gap-4
            rounded-[10px]
            bg-[#173B7A]
            px-5
            text-sm
            font-normal
            text-white
            shadow-[0_8px_20px_rgba(23,59,122,0.14)]
            transition
            hover:bg-[#122E60]
            focus-visible:outline-2
            focus-visible:outline-offset-2
            focus-visible:outline-[#173B7A]
            disabled:cursor-not-allowed
            disabled:opacity-50
          "
        >
          <span>{primaryLabel}</span>
          {meta.submitting || meta.loading ? (
            <Loader2 size={15} className="animate-spin opacity-80" />
          ) : isStampleyStep ? (
            <CheckCircle2 size={16} />
          ) : (
            <span
              className="
                flex
                h-8
                w-8
                items-center
                justify-center
                rounded-full
                border
                border-white/70
                transition-transform
                duration-200
                group-hover:translate-x-0.5
              "
              aria-hidden="true"
            >
              <ArrowRight strokeWidth={1.8} className="h-[15px] w-[15px]" />
            </span>
          )}
        </button>
      </div>
    </div>
  )
}
