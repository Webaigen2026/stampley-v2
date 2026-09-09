"use client"

import { useEffect, useRef, useState } from "react"

import {
  BadgeCheck,
  CalendarCheck2,
  ClipboardCheck,
  ListChecks,
  MailCheck,
  MessageCircleHeart,
  UserPlus,
} from "lucide-react"

import DiabetesVideoFeature from "@/components/home/DiabetesVideoFeature"

const steps = [
  {
    icon: UserPlus,
    label: "Create\nAccount",
  },
  {
    icon: MailCheck,
    label: "Verify\nEmail",
  },
  {
    icon: ClipboardCheck,
    label: "Pre-Survey",
  },
  {
    icon: ListChecks,
    label: "DDS\nSurvey",
  },
  {
    icon: CalendarCheck2,
    label: "Study\nSessions",
  },
  {
    icon: MessageCircleHeart,
    label: "Talk With\nStampley",
  },
  {
    icon: BadgeCheck,
    label: "Post-Survey",
  },
]

export default function DiabetesInfoSection() {
  const sectionRef = useRef<HTMLElement>(null)
  const [inView, setInView] = useState(false)

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        setInView(entry.isIntersecting)
      },
      {
        threshold: 0.25,
      }
    )

    if (sectionRef.current) {
      observer.observe(sectionRef.current)
    }

    return () => observer.disconnect()
  }, [])

  return (
    <section
      ref={sectionRef}
      className="
        relative
        -mt-20
        overflow-hidden
        bg-white
        px-6
        py-20
        md:px-12
        lg:px-24
      "
    >
      <div className="mx-auto max-w-7xl">
        {/* =====================================================
            PARTICIPANT JOURNEY
        ====================================================== */}
        <div
          className={`
            mb-28
            flex
            flex-wrap
            justify-center
            gap-5
            transition-all
            duration-700
            ease-out
            ${
              inView
                ? "translate-y-0 opacity-100"
                : "translate-y-10 opacity-0"
            }
          `}
        >
          {steps.map(({ icon: Icon, label }, index) => (
            <div
              key={label}
              className={`
                group
                relative
                flex
                h-36
                w-36
                flex-col
                items-center
                justify-center
                gap-4
                overflow-hidden
                bg-white
                text-center
                text-blue-900
                shadow-[0_14px_35px_rgba(15,23,42,0.14)]
                transition-all
                duration-700
                ease-out
                hover:-translate-y-1
                hover:shadow-[0_20px_45px_rgba(15,23,42,0.18)]
                ${
                  inView
                    ? "translate-y-0 opacity-100"
                    : "translate-y-8 opacity-0"
                }
              `}
              style={{
                transitionDelay: inView
                  ? `${index * 90}ms`
                  : "0ms",
              }}
            >
              {/* Step number */}
              <span
                className="
                  absolute
                  left-3
                  top-3
                  text-[9px]
                  font-medium
                  uppercase
                  tracking-[0.16em]
                  text-blue-900/30
                "
              >
                {String(index + 1).padStart(2, "0")}
              </span>

              {/* Icon */}
              <Icon
                size={46}
                strokeWidth={1.6}
                className="
                  transition-transform
                  duration-300
                  group-hover:scale-105
                "
              />

              {/* Label */}
              <span
                className="
                  whitespace-pre-line
                  text-sm
                  font-medium
                  leading-snug
                "
              >
                {label}
              </span>

              {/* Bottom accent */}
              <span
                aria-hidden="true"
                className="
                  absolute
                  bottom-0
                  left-0
                  h-[2px]
                  w-0
                  bg-blue-900
                  transition-all
                  duration-300
                  group-hover:w-full
                "
              />
            </div>
          ))}
        </div>

        {/* =====================================================
            REUSABLE VIDEO + TEXT
        ====================================================== */}
        <DiabetesVideoFeature inView={inView} />
      </div>

      {/* =====================================================
          DECORATIVE SIDE TAB
      ====================================================== */}
      <button
        type="button"
        className={`
          fixed
          right-0
          top-1/2
          z-40
          hidden
          -translate-y-1/2
          cursor-pointer
          rounded-l-md
          bg-[#FFB100]
          px-3
          py-5
          text-xs
          font-bold
          uppercase
          tracking-wide
          text-blue-900
          shadow-lg
          transition-all
          duration-700
          hover:bg-[#ffd966]
          focus:outline-none
          focus:ring-2
          focus:ring-blue-300
          lg:block
          [writing-mode:vertical-rl]
          ${
            inView
              ? "translate-x-0 opacity-100"
              : "translate-x-full opacity-0"
          }
        `}
        aria-label="Learn More"
        onClick={() => window.open("#about", "_blank")}
      >
        Learn More
      </button>
    </section>
  )
}