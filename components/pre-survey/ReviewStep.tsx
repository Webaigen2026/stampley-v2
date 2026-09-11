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
}: any) {
  const [isSubmitting, setIsSubmitting] = useState(false)

  const reduceMotion = useReducedMotion()

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()

    try {
      setIsSubmitting(true)

      await submitPreSurvey(formData)

      window.location.href = "/survey/dds"
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
              rounded-[14px]
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
            space-y-5
            px-6
            pb-12
            sm:px-8
            lg:px-10
          "
        >
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

          <ReviewRow
            label="Consent Status"
            value={formData.consent_status}
            reduceMotion={reduceMotion}
          />

          <ReviewRow
            label="Age"
            value={formData.age}
            reduceMotion={reduceMotion}
          />

          <ReviewRow
            label="Gender"
            value={formData.gender}
            reduceMotion={reduceMotion}
          />

          <ReviewRow
            label="Diagnosis Duration"
            value={formData.diagnosis_duration}
            reduceMotion={reduceMotion}
          />

          <ReviewRow
            label="Health Insurance"
            value={formData.insurance_type}
            reduceMotion={reduceMotion}
          />

          <ReviewRow
            label="Internet Usage"
            value={formData.internet_usage}
            reduceMotion={reduceMotion}
          />

          <ReviewRow
            label="Communication Preference"
            value={formData.communication_preference}
            reduceMotion={reduceMotion}
          />
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

function ReviewRow({
  label,
  value,
  reduceMotion,
}: {
  label: string
  value: any
  reduceMotion?: boolean | null
}) {
  const displayValue = Array.isArray(value)
    ? value.length > 0
      ? value.join(", ")
      : "Not answered"
    : value || "Not answered"

  const unanswered =
    displayValue === "Not answered"

  return (
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
        group
        max-w-[820px]
        rounded-[16px]
        bg-white
        px-5
        py-5
        shadow-[0_10px_30px_rgba(15,45,80,0.07)]
        sm:px-6
        sm:py-6
      "
    >
      <div
        className="
          flex
          flex-col
          gap-3
          sm:flex-row
          sm:items-start
          sm:justify-between
          sm:gap-8
        "
      >
        <div className="min-w-0">
          <p
            className="
              text-sm
              font-medium
              text-slate-500
            "
          >
            {label}
          </p>

          <p
            className={`
              mt-2
              text-base
              font-medium
              leading-relaxed
              ${
                unanswered
                  ? "text-slate-400"
                  : "text-slate-950"
              }
            `}
          >
            {displayValue}
          </p>
        </div>

        {!unanswered ? (
          <div
            className="
              flex
              h-8
              w-8
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
              size={17}
              strokeWidth={1.9}
            />
          </div>
        ) : null}
      </div>
    </motion.div>
  )
}