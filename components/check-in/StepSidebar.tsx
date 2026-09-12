"use client"

import { useSyncExternalStore } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { Check, ShieldCheck, Sparkles } from "lucide-react"
import { STEPS } from "@/app/check-in/constants/navigation"
import { motion, AnimatePresence } from "framer-motion"
// import DailyWellnessRadar from "../daily-metrics/DailyWellnessRadar"
import { useCheckInStore } from "@/store/checkin-store"
import { canNavigateToStep } from "@/lib/check-in-step-validation"

interface StepSidebarProps {
  collapsed?: boolean
}

function useIsClientReady() {
  return useSyncExternalStore(
    () => () => {},
    () => true,
    () => false
  )
}

export default function StepSidebar({ collapsed = false }: StepSidebarProps) {
  const pathname = usePathname()
  const mounted = useIsClientReady()

  const distress = useCheckInStore((s) => s.distress)
  const mood = useCheckInStore((s) => s.mood)
  const energy = useCheckInStore((s) => s.energy)
  const contextTags = useCheckInStore((s) => s.contextTags)
  const reflection = useCheckInStore((s) => s.reflection)
  const copingAction = useCheckInStore((s) => s.copingAction)
  const domain = useCheckInStore((s) => s.domain)

  const affect = { distress, mood, energy }

  const activeIndex = STEPS.findIndex((s) => s.path === pathname)
  const safeActiveIndex = activeIndex === -1 ? 0 : activeIndex
  const isFullyComplete = safeActiveIndex === STEPS.length - 1

  return (
    <nav
      aria-label="Daily check-in progress"
      className="
        relative
        flex
        h-full
        w-full
        flex-col
        justify-between
        overflow-hidden
        px-5
        py-6
        font-['Outfit',system-ui,sans-serif]
      "
    >
      <AnimatePresence>
        {isFullyComplete && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_24px_100%,rgba(20,115,230,0.06),transparent_70%)]"
          />
        )}
      </AnimatePresence>

      <div className="hidden w-full max-w-[300px] sm:block">
        <div className={`relative flex flex-col ${collapsed ? "gap-10" : "gap-2"}`}>
          <div
            aria-hidden="true"
            className="absolute bottom-[28px] top-[28px] w-px -translate-x-1/2 bg-[#D8E3F0] transition-all duration-500"
            style={{ left: collapsed ? "50%" : "22px" }}
          />

          <motion.div
            aria-hidden="true"
            className="absolute top-[28px] w-px -translate-x-1/2 rounded-full bg-[#8FB8E8]"
            animate={{
              height:
                STEPS.length > 1
                  ? `${(safeActiveIndex / (STEPS.length - 1)) * 84}%`
                  : "0%",
            }}
            transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
            style={{ left: collapsed ? "50%" : "22px" }}
          />

          {STEPS.map((step, index) => {
            const isActive = index === safeActiveIndex
            const isCompleted = index < safeActiveIndex
            const isFinalNode = index === STEPS.length - 1
            const isNavigable = mounted
              ? canNavigateToStep(index, safeActiveIndex, {
                  distress,
                  mood,
                  energy,
                  contextTags,
                  reflection,
                  copingAction,
                  domain,
                })
              : index <= safeActiveIndex

            const stepContent = (
              <>
                <div
                  className={`flex shrink-0 items-center justify-center ${
                    collapsed ? "w-10" : "w-11"
                  }`}
                >
                  {isCompleted || (isFinalNode && isFullyComplete) ? (
                    <span
                      className="
                        flex
                        h-9
                        w-9
                        items-center
                        justify-center
                        rounded-full
                        bg-[#EAF4FF]
                        text-[#173B7A]
                      "
                    >
                      <Check aria-hidden="true" strokeWidth={2.2} className="h-3.5 w-3.5" />
                    </span>
                  ) : isActive ? (
                    <span
                      className="
                        flex
                        h-11
                        w-11
                        items-center
                        justify-center
                        rounded-full
                        bg-white
                        text-[13px]
                        font-medium
                        text-[#173B7A]
                        shadow-[0_4px_12px_rgba(23,59,122,0.15)]
                        ring-1
                        ring-[#EEF6FF]
                      "
                    >
                      {step.id}
                    </span>
                  ) : (
                    <span
                      className="
                        flex
                        h-9
                        w-9
                        items-center
                        justify-center
                        rounded-full
                        bg-white
                        text-[12px]
                        font-normal
                        text-slate-500
                        ring-1
                        ring-slate-200
                      "
                    >
                      {step.id}
                    </span>
                  )}
                </div>

                {!collapsed ? (
                  <div
                    className={`
                      min-w-0
                      rounded-[12px]
                      px-2
                      py-1.5
                      ${isActive ? "bg-[#F7FAFD]" : ""}
                    `}
                  >
                    <p
                      className={`
                        text-[15px]
                        font-medium
                        tracking-tight
                        ${
                          isActive
                            ? "text-[#173B7A]"
                            : isCompleted
                              ? "text-slate-600"
                              : "text-slate-400"
                        }
                      `}
                    >
                      {step.label}
                    </p>
                    {isActive ? (
                      <p className="mt-0.5 text-[12px] leading-snug text-slate-500">
                        {step.description}
                      </p>
                    ) : null}
                  </div>
                ) : null}
              </>
            )

            if (isNavigable) {
              return (
                <Link
                  key={step.id}
                  href={step.path}
                  className={`
                    group
                    relative
                    z-10
                    flex
                    items-center
                    rounded-[12px]
                    outline-none
                    focus-visible:outline-2
                    focus-visible:outline-offset-2
                    focus-visible:outline-[#173B7A]
                    ${collapsed ? "justify-center py-2" : "gap-3 py-2"}
                  `}
                >
                  {stepContent}
                </Link>
              )
            }

            return (
              <div
                key={step.id}
                aria-disabled="true"
                title="Complete the current step before continuing"
                className={`
                  relative
                  z-10
                  flex
                  cursor-not-allowed
                  items-center
                  rounded-[12px]
                  opacity-45
                  ${collapsed ? "justify-center py-2" : "gap-3 py-2"}
                `}
              >
                {stepContent}
              </div>
            )
          })}
        </div>

        {/* <div className="mt-16 hidden w-full max-w-[300px] sm:block">
          <DailyWellnessRadar affect={affect} />
        </div> */}
      </div>

      {!collapsed ? (
        <AnimatePresence>
          {isFullyComplete ? (
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 8 }}
              transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
              className="mt-8 flex items-center gap-3 rounded-[14px] bg-[#F7FAFD] p-4"
            >
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#173B7A]">
                <ShieldCheck size={16} className="text-white" />
              </div>
              <div className="flex min-w-0 flex-col">
                <span className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[#173B7A]">
                  Status
                </span>
                <span className="text-[13px] font-medium text-[#173B7A]">
                  Check-in Complete
                </span>
              </div>
              <Sparkles size={13} className="ml-auto shrink-0 text-[#1473E6]" />
            </motion.div>
          ) : null}
        </AnimatePresence>
      ) : null}
    </nav>
  )
}
