"use client"

import { useState } from "react"
import {
  motion,
  useReducedMotion,
  type Variants,
} from "framer-motion"
import { CheckCircle2 } from "lucide-react"

import { submitPreSurvey } from "@/actions/pre-survey"

import StepButtons from "./StepButtons"
import PreSurveyBackground from "./PreSurveyBackground"

const easeOut = [0.22, 1, 0.36, 1] as const

const fadeUp: Variants = {
  hidden: {
    opacity: 0,
    y: 28,
    filter: "blur(3px)",
  },

  visible: {
    opacity: 1,
    y: 0,
    filter: "blur(0px)",
    transition: {
      duration: 0.7,
      ease: easeOut,
    },
  },
}

const fadeLeft: Variants = {
  hidden: {
    opacity: 0,
    x: -22,
    filter: "blur(2px)",
  },

  visible: {
    opacity: 1,
    x: 0,
    filter: "blur(0px)",
    transition: {
      duration: 0.75,
      ease: easeOut,
    },
  },
}

const container: Variants = {
  hidden: {},

  visible: {
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.04,
    },
  },
}

const rowsContainer: Variants = {
  hidden: {},

  visible: {
    transition: {
      staggerChildren: 0.08,
      delayChildren: 0.04,
    },
  },
}

export default function ReviewStep({
  formData,
  prevStep,
  onBeforeSubmit,
}: any) {
  const [isSubmitting, setIsSubmitting] = useState(false)

  const reduceMotion = useReducedMotion()

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()

    if (isSubmitting) {
      return
    }

    if (onBeforeSubmit && !onBeforeSubmit()) {
      return
    }

    try {
      setIsSubmitting(true)

      await submitPreSurvey(formData)

      window.location.href = "/survey/pre-survey/completed"
    } catch (error) {
      console.error("Pre-survey submit failed:", error)

      setIsSubmitting(false)
    }
  }

  return (
    <PreSurveyBackground>
      <form
        onSubmit={handleSubmit}
        className="
          relative
          font-['Outfit',system-ui,sans-serif]
          text-slate-950
        "
      >
        {/* =====================================================
            HEADER
        ====================================================== */}
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{
            once: false,
            amount: 0.22,
          }}
          variants={container}
          className="
            px-6
            pb-10
            pt-6
            sm:px-8
            sm:pb-12
            sm:pt-7
            lg:px-10
          "
        >
          <motion.p
            variants={fadeUp}
            className="
              text-xs
              font-bold
              uppercase
              tracking-[0.35em]
              text-cyan-700
            "
          >
            Final step
          </motion.p>

          <motion.h1
            variants={fadeUp}
            className="
              mt-4
              text-3xl
              font-light
              tracking-tight
              text-slate-950
              sm:text-4xl
            "
          >
            Review & Submit
          </motion.h1>

          <motion.p
            variants={fadeUp}
            className="
              mt-5
              max-w-[66ch]
              text-lg
              font-normal
              leading-relaxed
              text-slate-600
            "
          >
            Please review your responses before submitting. After submission,
            you will continue to the daily check-in.
          </motion.p>

          {/* =================================================
              SUBMISSION NOTICE
          ================================================== */}
          <motion.div
            variants={fadeUp}
            whileHover={
              reduceMotion
                ? undefined
                : {
                    y: -2,
                  }
            }
            transition={{
              duration: 0.25,
              ease: easeOut,
            }}
            className="
              mt-7
              flex
              max-w-[820px]
              items-start
              gap-4
              border-l-4
              border-blue-900
              bg-white
              px-5
              py-5
              shadow-[0_10px_32px_rgba(15,45,80,0.08)]
              sm:px-6
            "
          >
            <motion.div
              variants={{
                hidden: {
                  opacity: 0,
                  scale: 0.82,
                  rotate: -3,
                },

                visible: {
                  opacity: 1,
                  scale: 1,
                  rotate: 0,
                  transition: {
                    duration: 0.65,
                    ease: easeOut,
                  },
                },
              }}
              whileHover={
                reduceMotion
                  ? undefined
                  : {
                      scale: 1.06,
                    }
              }
              className="
                flex
                h-11
                w-11
                shrink-0
                items-center
                justify-center
                rounded-full
                bg-[#EAF3FF]
                text-[#1473E6]
              "
            >
              <CheckCircle2
                aria-hidden="true"
                size={21}
                strokeWidth={1.8}
              />
            </motion.div>

            <motion.div
              variants={fadeLeft}
              className="min-w-0"
            >
              <h2
                className="
                  text-base
                  font-medium
                  text-[#173B7A]
                "
              >
                Submission notice
              </h2>

              <p
                className="
                  mt-1.5
                  max-w-[70ch]
                  text-base
                  font-normal
                  leading-relaxed
                  text-slate-600
                "
              >
                By submitting this form, your pre-survey responses will be
                securely saved as part of your AIDES-T2D study record.
              </p>
            </motion.div>
          </motion.div>
        </motion.div>

        {/* =====================================================
            REVIEW RESPONSES
        ====================================================== */}
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{
            once: false,
            amount: 0.08,
            margin: "0px 0px -40px 0px",
          }}
          variants={rowsContainer}
          className="
            px-6
            pb-12
            sm:px-8
            lg:px-10
          "
        >
          {/* Section heading */}
          <motion.div
            variants={fadeUp}
            className="max-w-[820px]"
          >
            <h2
              className="
                text-2xl
                font-light
                tracking-tight
                text-slate-950
              "
            >
              Your responses
            </h2>

            <p
              className="
                mt-2
                text-sm
                font-normal
                leading-relaxed
                text-slate-500
              "
            >
              Review the information below before submitting your pre-survey.
            </p>
          </motion.div>

          {/* =================================================
              SINGLE REVIEW CARD
          ================================================== */}
          <motion.div
            variants={fadeUp}
            whileHover={
              reduceMotion
                ? undefined
                : {
                    y: -2,
                  }
            }
            transition={{
              duration: 0.25,
              ease: easeOut,
            }}
            className="
              mt-6
              max-w-[820px]
              overflow-hidden
              rounded-[16px]
              bg-white
              shadow-[0_10px_32px_rgba(15,45,80,0.08)]
            "
          >
            <ReviewRow
              label="Consent Status"
              value={formData.consent_status}
            />

            <ReviewRow
              label="Age"
              value={formData.age}
            />

            <ReviewRow
              label="Gender"
              value={formData.gender}
            />

            <ReviewRow
              label="Diagnosis Duration"
              value={formData.diagnosis_duration}
            />

            <ReviewRow
              label="Health Insurance"
              value={formData.insurance_type}
            />

            <ReviewRow
              label="Internet Usage"
              value={formData.internet_usage}
            />

            <ReviewRow
              label="Communication Preference"
              value={formData.communication_preference}
              last
            />
          </motion.div>
        </motion.div>

        {/* =====================================================
            FOOTER
        ====================================================== */}
        <motion.div
          initial={{
            opacity: 0,
            y: 20,
          }}
          whileInView={{
            opacity: 1,
            y: 0,
          }}
          viewport={{
            once: false,
            amount: 0.5,
          }}
          transition={{
            duration: 0.6,
            ease: easeOut,
          }}
        >
          <StepButtons
            prevStep={prevStep}
            submit
            disabled={isSubmitting}
            nextLabel={
              isSubmitting
                ? "Submitting..."
                : "Submit Pre-Survey"
            }
          />
        </motion.div>
      </form>
    </PreSurveyBackground>
  )
}

/* ============================================================
   REVIEW ROW
============================================================ */

function ReviewRow({
  label,
  value,
  last = false,
}: {
  label: string
  value: any
  last?: boolean
}) {
  const displayValue = Array.isArray(value)
    ? value.length > 0
      ? value.join(", ")
      : "Not answered"
    : value || "Not answered"

  const unanswered = displayValue === "Not answered"

  return (
    <div
      className={`
        group
        relative
        px-5
        py-5
        transition-colors
        duration-200
        hover:bg-slate-50/60
        sm:px-6
        sm:py-5

        ${
          last
            ? ""
            : "border-b border-slate-100"
        }
      `}
    >
      <div
        className="
          flex
          flex-col
          gap-2
          sm:flex-row
          sm:items-center
          sm:justify-between
          sm:gap-8
        "
      >
        {/* Label */}
        <p
          className="
            min-w-0
            text-sm
            font-medium
            text-slate-500
            sm:w-[42%]
          "
        >
          {label}
        </p>

        {/* Value */}
        <div
          className="
            flex
            min-w-0
            flex-1
            items-center
            justify-between
            gap-4
            sm:justify-end
          "
        >
          <p
            className={`
              min-w-0
              text-base
              font-medium
              leading-relaxed
              sm:text-right

              ${
                unanswered
                  ? "text-slate-400"
                  : "text-slate-950"
              }
            `}
          >
            {displayValue}
          </p>

          {!unanswered ? (
            <div
              className="
                flex
                h-7
                w-7
                shrink-0
                items-center
                justify-center
                rounded-full
                bg-[#EEF6FF]
                text-[#1473E6]
              "
            >
              <CheckCircle2
                aria-hidden="true"
                size={15}
                strokeWidth={1.9}
              />
            </div>
          ) : (
            <div
              aria-hidden="true"
              className="
                h-7
                w-7
                shrink-0
              "
            />
          )}
        </div>
      </div>
    </div>
  )
}