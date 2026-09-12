"use client"

import { useCheckInStore } from "@/store/checkin-store"
import CheckInStepFrame from "@/components/check-in/CheckInStepFrame"
import {
  Stethoscope,
  Activity,
  Pill,
  Briefcase,
  MessageSquareWarning,
  HeartHandshake,
  ThermometerSnowflake,
  Check,
} from "lucide-react"

const CONTEXT_TAGS = [
  { id: "doctors_appointment", label: "Doctor's appointment", icon: Stethoscope },
  { id: "blood_sugar", label: "High or low blood sugar", icon: Activity },
  { id: "missed_medication", label: "Missed a medication or meal", icon: Pill },
  { id: "work_stress", label: "Stress at work or school", icon: Briefcase },
  { id: "conflict", label: "Conflict or tension with someone", icon: MessageSquareWarning },
  { id: "felt_supported", label: "Felt supported by someone", icon: HeartHandshake },
  { id: "unwell", label: "Felt physically unwell or tired", icon: ThermometerSnowflake },
]

export default function ContextualFactorsPage() {
  const { contextTags, setContextTags } = useCheckInStore()

  function toggleTag(tag: string) {
    if (contextTags.includes(tag)) {
      setContextTags(contextTags.filter((t) => t !== tag))
    } else {
      setContextTags([...contextTags, tag])
    }
  }

  return (
    <CheckInStepFrame
      title="Contextual Factors"
      description="Select all that applied to your day with diabetes."
    >
      <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
        {CONTEXT_TAGS.map((tag) => {
          const selected = contextTags.includes(tag.id)
          const Icon = tag.icon

          return (
            <button
              key={tag.id}
              type="button"
              onClick={() => toggleTag(tag.id)}
              aria-pressed={selected}
              className={`
                flex
                min-h-[72px]
                w-full
                cursor-pointer
                items-center
                gap-4
                rounded-[16px]
                bg-white
                px-5
                py-4
                text-left
                shadow-[0_10px_30px_rgba(15,45,80,0.07)]
                transition
                focus-visible:outline-2
                focus-visible:outline-offset-2
                focus-visible:outline-[#173B7A]
                ${
                  selected
                    ? "ring-1 ring-[#1473E6]/30"
                    : "hover:bg-[#F7FAFD]"
                }
              `}
            >
              <span
                className={`
                  flex
                  h-10
                  w-10
                  shrink-0
                  items-center
                  justify-center
                  rounded-full
                  ${
                    selected
                      ? "bg-[#EAF4FF] text-[#173B7A]"
                      : "bg-[#F7FAFD] text-slate-400"
                  }
                `}
              >
                <Icon size={18} strokeWidth={1.7} />
              </span>

              <span
                className={`
                  flex-1
                  text-base
                  leading-snug
                  ${selected ? "font-medium text-[#0B2857]" : "text-slate-600"}
                `}
              >
                {tag.label}
              </span>

              <span
                className={`
                  flex
                  h-6
                  w-6
                  shrink-0
                  items-center
                  justify-center
                  rounded-full
                  ${
                    selected
                      ? "bg-[#173B7A] text-white"
                      : "ring-1 ring-slate-200"
                  }
                `}
                aria-hidden="true"
              >
                {selected ? <Check size={13} strokeWidth={2.4} /> : null}
              </span>
            </button>
          )
        })}
      </div>

      {contextTags.length === 0 ? (
        <p className="mt-6 text-center text-sm text-slate-400">
          Nothing applied today? That&apos;s okay — you can continue without
          selecting anything.
        </p>
      ) : null}
    </CheckInStepFrame>
  )
}
