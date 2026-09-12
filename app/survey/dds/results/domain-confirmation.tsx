"use client"

import Image from "next/image"
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
    image: "/dds/emotional.png",
  },
  {
    value: "Regimen",
    title: "Regimen-related Distress",
    description:
      "Daily routines, meal planning, glucose monitoring, medication, and self-management.",
    image: "/dds/regimen.png",
  },
  {
    value: "Physician",
    title: "Physician-related Distress",
    description:
      "Communication, trust, clarity, support, and confidence with your healthcare team.",
    image: "/dds/physician.png",
  },
  {
    value: "Interpersonal",
    title: "Interpersonal Distress",
    description:
      "Support, understanding, and emotional connection with family, friends, and people around you.",
    image: "/dds/interperson.png",
  },
]

export default function DomainConfirmation({
  recommendedDomain,
}: {
  recommendedDomain: string
}) {
  const router = useRouter()

  const [selectedDomain, setSelectedDomain] = useState(
    recommendedDomain || "Emotional"
  )

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  async function handleConfirm() {
    if (loading || !selectedDomain) {
      return
    }

    setLoading(true)
    setError("")

    const result = await confirmDomain(selectedDomain)

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
          gap-5
          md:grid-cols-2
        "
      >
        {DOMAINS.map((domain) => {
          const selected =
            selectedDomain === domain.value

          const recommended =
            recommendedDomain === domain.value

          return (
            <button
              key={domain.value}
              type="button"
              onClick={() =>
                setSelectedDomain(domain.value)
              }
              aria-pressed={selected}
              className={`
                group
                relative
                cursor-pointer
                overflow-hidden
                rounded-[16px]
                bg-white
                text-left
                outline-none
                transition-all
                duration-200

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
                  min-h-[210px]
                  items-stretch
                "
              >
                {/* ===========================================
                    DOMAIN ILLUSTRATION
                ============================================ */}

                <div
                  className={`
                    relative
                    w-[145px]
                    shrink-0
                    overflow-hidden
                    transition-colors
                    duration-200
                    sm:w-[165px]

                    ${
                      selected
                        ? "bg-[#EDF6FF]"
                        : "bg-[#F7FAFD]"
                    }
                  `}
                >
                  <div
                    aria-hidden="true"
                    className="
                      absolute
                      -bottom-8
                      -left-7
                      h-[160px]
                      w-[160px]
                      rounded-full
                      bg-[#DCEEFF]/65
                      blur-[2px]
                    "
                  />

                  <Image
                    src={domain.image}
                    alt=""
                    fill
                    sizes="
                      (max-width: 640px) 145px,
                      165px
                    "
                    className="
                      relative
                      z-10
                      object-contain
                      p-3
                      transition-transform
                      duration-300
                      group-hover:scale-[1.03]
                    "
                  />
                </div>

                {/* ===========================================
                    DOMAIN CONTENT
                ============================================ */}

                <div
                  className="
                    flex
                    min-w-0
                    flex-1
                    flex-col
                    p-5
                    sm:p-6
                  "
                >
                  <div
                    className="
                      flex
                      items-start
                      justify-between
                      gap-3
                    "
                  >
                    <div className="min-w-0">
                      <div
                        className="
                          flex
                          flex-wrap
                          items-center
                          gap-2.5
                        "
                      >
                        <h3
                          className={`
                            text-lg
                            font-medium
                            leading-snug
                            sm:text-xl

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
                              px-3
                              py-1.5
                              text-xs
                              font-semibold
                              uppercase
                              tracking-[0.12em]
                              text-[#1473E6]
                            "
                          >
                            Recommended
                          </span>
                        ) : null}
                      </div>
                    </div>

                    {/* =======================================
                        SELECTED INDICATOR
                    ======================================== */}

                    <span
                      className={`
                        flex
                        h-8
                        w-8
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
                        size={17}
                        strokeWidth={2.4}
                      />
                    </span>
                  </div>

                  <p
                    className="
                      mt-4
                      text-base
                      leading-7
                      text-slate-600
                      sm:text-[17px]
                    "
                  >
                    {domain.description}
                  </p>

                  {/* Selected state hint */}

                  <div className="mt-auto pt-5">
                    <span
                      className={`
                        text-xs
                        font-semibold
                        uppercase
                        tracking-[0.12em]
                        transition-opacity

                        ${
                          selected
                            ? "text-[#1473E6] opacity-100"
                            : "text-slate-400 opacity-0 group-hover:opacity-100"
                        }
                      `}
                    >
                      {selected
                        ? "Selected focus"
                        : "Choose this focus"}
                    </span>
                  </div>
                </div>
              </div>
            </button>
          )
        })}
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
            text-base
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
              text-base
              font-medium
              text-slate-800
              sm:text-lg
            "
          >
            Today&apos;s support focus
          </p>

          <p
            className="
              mt-1
              text-base
              leading-7
              text-slate-600
            "
          >
            Your selected focus will guide today&apos;s check-in session.
          </p>
        </div>

        <button
          type="button"
          onClick={handleConfirm}
          disabled={loading || !selectedDomain}
          className="
            inline-flex
            min-h-[52px]
            shrink-0
            items-center
            justify-center
            gap-2
            rounded-[12px]
            bg-[#1473E6]
            px-7
            text-base
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
              size={18}
              strokeWidth={1.8}
            />
          ) : null}
        </button>
      </div>
    </div>
  )
}