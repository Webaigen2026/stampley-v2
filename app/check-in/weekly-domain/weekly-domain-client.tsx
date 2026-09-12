"use client"

import { useLayoutEffect, useState } from "react"
import { Check, Lock } from "lucide-react"

import { useCheckInStore, type Domain } from "@/store/checkin-store"

const DOMAINS = [
  {
    id: "Emotional" as Domain,
    label: "Emotional Burden",
    shortLabel: "Emotional",
    description: "Feeling overwhelmed, discouraged, or burned out by diabetes.",
    tag: "Emotional",
    insight:
      "Emotional distress is common in diabetes care. Naming it can help Stampley support you more gently.",
  },
  {
    id: "Regimen" as Domain,
    label: "Regimen-Related",
    shortLabel: "Regimen",
    description: "Challenges with medications, blood sugar, meals, or routines.",
    tag: "Behavioral",
    insight:
      "Diabetes routines can involve many daily decisions. Support can focus on one realistic step at a time.",
  },
  {
    id: "Physician" as Domain,
    label: "Physician-Related",
    shortLabel: "Physician",
    description: "Concerns about your doctor or healthcare team relationship.",
    tag: "Clinical",
    insight:
      "Feeling understood by your care team matters. This focus can help you reflect on what support you need.",
  },
  {
    id: "Interpersonal" as Domain,
    label: "Interpersonal",
    shortLabel: "Social",
    description: "Feeling unsupported by family or friends about your diabetes.",
    tag: "Social",
    insight:
      "Support from others can shape how diabetes feels day to day. Stampley can help you name what would help.",
  },
]

interface Props {
  lockedDomain: Domain | null
  weekNumber: number
  isLocked: boolean
  usedPreviousDomains: Domain[]
}

export function WeeklyDomainClient({
  lockedDomain,
  weekNumber,
  isLocked,
  usedPreviousDomains,
}: Props) {
  const { domain, setDomain, clearDomain } = useCheckInStore()
  const [showInsight, setShowInsight] = useState<string | null>(null)
  const [saveError, setSaveError] = useState("")
  const [savingDomain, setSavingDomain] = useState<Domain | null>(null)

  useLayoutEffect(() => {
    if (lockedDomain) {
      setDomain(lockedDomain)
      return
    }

    if (domain && usedPreviousDomains.includes(domain)) {
      clearDomain()
    }
  }, [lockedDomain, domain, usedPreviousDomains, setDomain, clearDomain])

  const activeDomain = DOMAINS.find((item) => item.id === (domain || lockedDomain))

  async function handleSelectDomain(selected: Domain) {
    if (isLocked || usedPreviousDomains.includes(selected)) return

    setSaveError("")
    setSavingDomain(selected)

    try {
      const res = await fetch("/api/check-in/weekly-domain", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ domain: selected }),
      })

      const data = await res.json().catch(() => ({}))

      if (!res.ok) {
        setSaveError(
          typeof data.error === "string"
            ? data.error
            : "Failed to save your weekly focus domain."
        )
        return
      }

      setDomain(selected)
      setShowInsight(selected)
      window.setTimeout(() => setShowInsight(null), 3000)
    } catch {
      setSaveError("Failed to save your weekly focus domain. Please try again.")
    } finally {
      setSavingDomain(null)
    }
  }

  return (
    <div className="space-y-5">
      {activeDomain && (domain || lockedDomain) ? (
        <section className="flex items-start gap-3 rounded-[16px] bg-[#F7FAFD] px-5 py-4">
          <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#EAF4FF] text-[#173B7A]">
            {isLocked ? (
              <Lock size={15} strokeWidth={1.8} />
            ) : (
              <Check size={15} strokeWidth={2.2} />
            )}
          </span>
          <div className="min-w-0">
            <p className="text-sm font-medium text-[#173B7A]">
              {isLocked
                ? `Week ${weekNumber} focus locked`
                : `Week ${weekNumber} focus selected`}
            </p>
            <p className="mt-1 text-sm leading-relaxed text-slate-600">
              {isLocked ? (
                <>
                  This week&apos;s domain is locked once check-ins begin.
                  Stampley will focus on{" "}
                  <span className="font-medium text-[#0B2857]">
                    {activeDomain.label}
                  </span>
                  .
                </>
              ) : (
                <>
                  Stampley will focus on{" "}
                  <span className="font-medium text-[#0B2857]">
                    {activeDomain.label}
                  </span>{" "}
                  for this week&apos;s check-ins.
                </>
              )}
            </p>
          </div>
        </section>
      ) : null}

      {saveError ? (
        <p className="rounded-[14px] bg-red-50 px-4 py-3 text-sm text-red-800">
          {saveError}
        </p>
      ) : null}

      <div className="space-y-3">
        {DOMAINS.map((item) => {
          const isSelected = domain === item.id || lockedDomain === item.id
          const usedPreviously = usedPreviousDomains.includes(item.id)
          const isDisabled =
            (isLocked && lockedDomain !== item.id) ||
            usedPreviously ||
            savingDomain !== null

          return (
            <button
              key={item.id}
              type="button"
              onClick={() => handleSelectDomain(item.id)}
              disabled={isDisabled || isLocked}
              aria-pressed={isSelected}
              className={`
                flex
                w-full
                items-start
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
                ${isDisabled ? "cursor-not-allowed opacity-45" : "cursor-pointer"}
                ${isSelected ? "ring-1 ring-[#1473E6]/30" : ""}
              `}
            >
              <span
                className={`
                  mt-0.5
                  flex
                  h-6
                  w-6
                  shrink-0
                  items-center
                  justify-center
                  rounded-full
                  ${
                    isSelected
                      ? "bg-[#173B7A] text-white"
                      : "ring-1 ring-slate-200"
                  }
                `}
                aria-hidden="true"
              >
                {isSelected ? <Check size={13} strokeWidth={2.4} /> : null}
              </span>

              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="text-base font-medium text-[#0B2857]">
                    {item.label}
                  </p>
                  <span className="text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-400">
                    {item.tag}
                  </span>
                </div>
                <p className="mt-1 text-sm leading-relaxed text-slate-500">
                  {item.description}
                </p>
                {usedPreviously ? (
                  <p className="mt-2 text-xs text-slate-400">
                    You already completed this domain in a previous week.
                  </p>
                ) : null}
                {savingDomain === item.id ? (
                  <p className="mt-2 text-xs text-slate-400">Saving…</p>
                ) : null}
                {showInsight === item.id ? (
                  <p className="mt-3 text-sm leading-relaxed text-slate-600">
                    {item.insight}
                  </p>
                ) : null}
              </div>
            </button>
          )
        })}
      </div>
    </div>
  )
}
