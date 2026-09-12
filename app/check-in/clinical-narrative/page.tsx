"use client"

import { useCheckInStore } from "@/store/checkin-store"
import CheckInStepFrame from "@/components/check-in/CheckInStepFrame"
import { Info } from "lucide-react"

const REFLECTION_MAX_LENGTH = 250
const COPING_MAX_LENGTH = 180

function NarrativeBox({
  id,
  label,
  question,
  value,
  onChange,
  placeholder,
  maxLength,
}: {
  id: string
  label: string
  question: string
  value: string
  onChange: (value: string) => void
  placeholder: string
  maxLength: number
}) {
  const remaining = Math.max(maxLength - value.length, 0)
  const nearLimit = value.length >= maxLength * 0.9
  const atLimit = value.length >= maxLength

  const handleChange = (nextValue: string) => {
    onChange(nextValue.slice(0, maxLength))
  }

  return (
    <section
      className="
        rounded-[18px]
        bg-white
        px-5
        py-6
        shadow-[0_10px_30px_rgba(15,45,80,0.07)]
        sm:px-6
        sm:py-7
      "
      aria-labelledby={`${id}-label`}
    >
      <p
        id={`${id}-label`}
        className="
          text-[11px]
          font-semibold
          uppercase
          tracking-[0.18em]
          text-[#1473E6]
        "
      >
        {label}
      </p>

      <h2 className="mt-2 text-lg font-medium leading-snug text-[#0B2857] sm:text-xl">
        {question}
      </h2>

      <textarea
        id={id}
        value={value}
        maxLength={maxLength}
        onChange={(e) => handleChange(e.target.value)}
        placeholder={placeholder}
        className="
          mt-5
          min-h-[160px]
          w-full
          resize-none
          rounded-[14px]
          bg-[#F7FAFD]
          px-4
          py-4
          text-base
          font-normal
          leading-relaxed
          text-[#0B2857]
          outline-none
          placeholder:text-slate-400
          focus-visible:outline-2
          focus-visible:outline-offset-2
          focus-visible:outline-[#173B7A]
        "
      />

      <div className="mt-3 flex items-center justify-between gap-3">
        <p
          className={`text-xs ${
            atLimit
              ? "text-[#c65b4b]"
              : nearLimit
                ? "text-amber-600"
                : "text-slate-400"
          }`}
        >
          {remaining} characters remaining
        </p>

        <p
          className={`text-xs font-medium ${
            atLimit
              ? "text-[#c65b4b]"
              : nearLimit
                ? "text-amber-600"
                : "text-slate-400"
          }`}
        >
          {value.length}/{maxLength}
        </p>
      </div>
    </section>
  )
}

export default function ClinicalNarrativePage() {
  const { reflection, copingAction, setReflection, setCopingAction } =
    useCheckInStore()

  return (
    <CheckInStepFrame
      title="Clinical Narrative"
      description="Share what was on your mind today. There are no right or wrong answers."
    >
      <div className="space-y-5">
        <NarrativeBox
          id="reflection"
          label="Contextual Impact"
          question="What most shaped your day with diabetes?"
          value={reflection}
          onChange={setReflection}
          placeholder="Today I felt..."
          maxLength={REFLECTION_MAX_LENGTH}
        />

        <NarrativeBox
          id="copingAction"
          label="Resilience & Action"
          question="What helped you get through the day?"
          value={copingAction}
          onChange={setCopingAction}
          placeholder="What coping strategies did you use today?"
          maxLength={COPING_MAX_LENGTH}
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
          A few sentences are enough. Write only what you are comfortable
          sharing about today.
        </p>
      </aside>
    </CheckInStepFrame>
  )
}
