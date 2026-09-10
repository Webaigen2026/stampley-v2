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
    tooltip:
      "Create your secure participant account to begin the study.",
  },
  {
    icon: MailCheck,
    label: "Verify\nEmail",
    tooltip:
      "Confirm your email address using the verification code we send you.",
  },
  {
    icon: ClipboardCheck,
    label: "Pre-Survey",
    tooltip:
      "Complete the initial survey before beginning your study activities.",
  },
  {
    icon: ListChecks,
    label: "DDS\nSurvey",
    tooltip:
      "Complete the Diabetes Distress Scale assessment.",
  },
  {
    icon: CalendarCheck2,
    label: "Study\nSessions",
    tooltip:
      "Complete at least five study sessions each week for four weeks.",
  },
  {
    icon: MessageCircleHeart,
    label: "Talk With\nStampley",
    tooltip:
      "Have supportive conversations with Stampley during your study sessions.",
  },
  {
    icon: BadgeCheck,
    label: "Post-Survey",
    tooltip:
      "Complete the final survey at the end of your study participation.",
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
            PARTICIPANT JOURNEY INTRO
        ====================================================== */}
        <div
          className={`
            mx-auto
            mb-12
            max-w-3xl
            text-center
            transition-all
            duration-700
            ease-out
            ${
              inView
                ? "translate-y-0 opacity-100"
                : "translate-y-6 opacity-0"
            }
          `}
        >
        

          {/* Main title */}
         
          <h1
              className={`
                whitespace-nowrap
                mb-10
                text-[30px]
                font-normal
                leading-[1.08]
                tracking-[-0.03em]
                text-blue-900
                transition-all
                duration-700
                ease-out
                sm:text-[34px]
                lg:text-[38px]
                xl:text-[42px]
                ${
                  inView
                    ? "translate-x-0 opacity-100"
                    : "-translate-x-12 opacity-0"
                }
              `}
            >
            Your study journey, step by step
          </h1>

          {/* Description */}
          <p className="mx-auto max-w-2xl text-lg leading-relaxed text-slate-600">
            From creating your account to completing your final survey,
            here&apos;s what participation in AIDES-T2D looks like. Most study
            activities are completed online, and you&apos;ll move through each
            step in order.
          </p>
        </div>

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
          {steps.map(({ icon: Icon, label, tooltip }, index) => (
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

              {/* Step label */}
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

              {/* Animated bottom accent */}
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

              {/* =================================================
                  WHITE BOTTOM TOOLTIP
              ================================================== */}
              <div
                role="tooltip"
                className="
                  pointer-events-none
                  absolute
                  left-1/2
                  top-[calc(100%+14px)]
                  z-50
                  w-[210px]
                  -translate-x-1/2
                  translate-y-2
                  rounded-[12px]
                  border
                  border-slate-200/80
                  bg-white
                  px-4
                  py-3
                  text-left
                  opacity-0
                  shadow-[0_14px_40px_rgba(15,23,42,0.16)]
                  transition-all
                  duration-200
                  group-hover:translate-y-0
                  group-hover:opacity-100
                "
              >
                {/* Tooltip arrow */}
                <span
                  aria-hidden="true"
                  className="
                    absolute
                    -top-[6px]
                    left-1/2
                    h-3
                    w-3
                    -translate-x-1/2
                    rotate-45
                    border-l
                    border-t
                    border-slate-200/80
                    bg-white
                  "
                />

                {/* Tooltip step number */}
                <p
                  className="
                    mb-1.5
                    text-[9px]
                    font-semibold
                    uppercase
                    tracking-[0.18em]
                    text-blue-900/45
                  "
                >
                  Step {String(index + 1).padStart(2, "0")}
                </p>

                {/* Tooltip title */}
                <p
                  className="
                    text-[13px]
                    font-semibold
                    leading-5
                    text-blue-900
                  "
                >
                  {label.replace("\n", " ")}
                </p>

                {/* Tooltip description */}
                <p
                  className="
                    mt-1
                    text-[11.5px]
                    font-normal
                    leading-[1.55]
                    text-slate-500
                  "
                >
                  {tooltip}
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* =====================================================
            REUSABLE VIDEO + TEXT COMPONENT
        ====================================================== */}
        <DiabetesVideoFeature inView={inView} />
      </div>

      {/* =====================================================
          DECORATIVE SIDE TAB
      ====================================================== */}
      <a
        href="https://stampleyresearchgroup.com"
        target="_blank"
        rel="noopener noreferrer"
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
      >
        Learn More
      </a>
    </section>
  )
}