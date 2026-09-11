"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"

import {
  ArrowRight,
  Check,
} from "lucide-react"

import { confirmDomain } from "@/actions/dds"

const DOMAINS = [
  {
    value: "Emotional",
    title: "Emotional Burden",
    description:
      "Overwhelm, worry, burnout, fear, and the emotional weight of living with diabetes.",
  },

  {
    value: "Regimen",
    title: "Regimen-related Distress",
    description:
      "Daily routines, meal planning, glucose monitoring, medication, and self-management.",
  },

  {
    value: "Physician",
    title: "Physician-related Distress",
    description:
      "Communication, trust, clarity, support, and confidence with your healthcare team.",
  },

  {
    value: "Interpersonal",
    title: "Interpersonal Distress",
    description:
      "Support, understanding, and emotional connection with family, friends, and people around you.",
  },
]

export default function DomainConfirmation({
  recommendedDomain,
}: {
  recommendedDomain: string
}) {
  const router = useRouter()

  const [
    selectedDomain,
    setSelectedDomain,
  ] = useState(
    recommendedDomain ||
      "Emotional"
  )

  const [
    loading,
    setLoading,
  ] = useState(false)

  const [
    error,
    setError,
  ] = useState("")

  async function handleConfirm() {
    if (
      loading ||
      !selectedDomain
    ) {
      return
    }

    setLoading(true)
    setError("")

    const result =
      await confirmDomain(
        selectedDomain
      )

    if (result?.error) {
      setError(result.error)

      setLoading(false)

      return
    }

    router.push("/check-in")
  }

  return (
    <div>
      {/* =====================================================
          DOMAIN OPTIONS
      ====================================================== */}

      <div
        className="
          grid
          gap-4
          md:grid-cols-2
        "
      >
        {DOMAINS.map(
          (domain) => {
            const selected =
              selectedDomain ===
              domain.value

            const recommended =
              recommendedDomain ===
              domain.value

            return (
              <button
                key={
                  domain.value
                }
                type="button"
                onClick={() =>
                  setSelectedDomain(
                    domain.value
                  )
                }
                aria-pressed={
                  selected
                }
                className={`
                  group
                  relative
                  cursor-pointer
                  rounded-[16px]
                  bg-white
                  p-5
                  text-left
                  outline-none
                  transition-all
                  duration-200
                  sm:p-6

                  ${
                    selected
                      ? `
                        -translate-y-0.5
                        shadow-[0_12px_32px_rgba(20,115,230,0.13),inset_0_0_0_2px_rgba(20,115,230,0.75)]
                      `
                      : `
                        shadow-[0_8px_26px_rgba(15,45,80,0.07)]
                        hover:-translate-y-0.5
                        hover:shadow-[0_12px_32px_rgba(15,45,80,0.10)]
                      `
                  }

                  focus-visible:ring-2
                  focus-visible:ring-[#1473E6]
                  focus-visible:ring-offset-3
                `}
              >
                <div
                  className="
                    flex
                    items-start
                    justify-between
                    gap-4
                  "
                >
                  <div className="min-w-0">
                    <div
                      className="
                        flex
                        flex-wrap
                        items-center
                        gap-2
                      "
                    >
                      <h3
                        className={`
                          text-base
                          font-medium

                          ${
                            selected
                              ? "text-[#173B7A]"
                              : "text-slate-950"
                          }
                        `}
                      >
                        {domain.title}
                      </h3>

                      {recommended ? (
                        <span
                          className="
                            rounded-full
                            bg-[#EEF6FF]
                            px-2.5
                            py-1
                            text-[9px]
                            font-semibold
                            uppercase
                            tracking-[0.14em]
                            text-[#1473E6]
                          "
                        >
                          Recommended
                        </span>
                      ) : null}
                    </div>

                    <p
                      className="
                        mt-3
                        text-sm
                        leading-6
                        text-slate-500
                      "
                    >
                      {
                        domain.description
                      }
                    </p>
                  </div>

                  <span
                    className={`
                      flex
                      h-7
                      w-7
                      shrink-0
                      items-center
                      justify-center
                      rounded-full
                      transition-all

                      ${
                        selected
                          ? `
                            bg-[#1473E6]
                            text-white
                            shadow-[0_5px_14px_rgba(20,115,230,0.22)]
                          `
                          : `
                            bg-slate-50
                            text-transparent
                            shadow-[inset_0_0_0_1px_rgba(203,213,225,0.9)]
                          `
                      }
                    `}
                    aria-hidden="true"
                  >
                    <Check
                      size={15}
                      strokeWidth={
                        2.4
                      }
                    />
                  </span>
                </div>
              </button>
            )
          }
        )}
      </div>

      {/* =====================================================
          ERROR
      ====================================================== */}

      {error ? (
        <div
          role="alert"
          className="
            mt-5
            rounded-[12px]
            bg-red-50
            px-4
            py-3
            text-sm
            font-medium
            text-red-700
            shadow-[inset_4px_0_0_rgba(185,28,28,0.72)]
          "
        >
          {error}
        </div>
      ) : null}

      {/* =====================================================
          CONFIRMATION FOOTER
      ====================================================== */}

      <div
        className="
          mt-8
          flex
          flex-col
          gap-4
          rounded-[16px]
          bg-[#F7FAFD]
          px-5
          py-5
          sm:flex-row
          sm:items-center
          sm:justify-between
          sm:px-6
        "
      >
        <div>
          <p
            className="
              text-sm
              font-medium
              text-slate-700
            "
          >
            Your first-week focus
          </p>

          <p
            className="
              mt-1
              text-sm
              leading-6
              text-slate-500
            "
          >
            This focus will guide your
            first week of daily
            check-ins.
          </p>
        </div>

        <button
          type="button"
          onClick={
            handleConfirm
          }
          disabled={
            loading ||
            !selectedDomain
          }
          className="
            inline-flex
            min-h-[50px]
            shrink-0
            items-center
            justify-center
            gap-2
            rounded-[12px]
            bg-[#1473E6]
            px-6
            text-sm
            font-semibold
            text-white
            shadow-[0_10px_24px_rgba(20,115,230,0.22)]
            transition-all
            duration-200
            hover:-translate-y-0.5
            hover:bg-[#0F66CF]
            hover:shadow-[0_14px_30px_rgba(20,115,230,0.26)]
            disabled:cursor-not-allowed
            disabled:bg-slate-300
            disabled:shadow-none
          "
        >
          {loading
            ? "Saving focus..."
            : "Confirm Focus & Continue"}

          {!loading ? (
            <ArrowRight
              size={17}
              strokeWidth={
                1.8
              }
            />
          ) : null}
        </button>
      </div>
    </div>
  )
}