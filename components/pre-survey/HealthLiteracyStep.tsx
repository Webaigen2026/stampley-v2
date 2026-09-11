"use client"

import { ChevronDown } from "lucide-react"

import {
  motion,
  useReducedMotion,
  type Variants,
} from "framer-motion"

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

const questionsContainer: Variants = {
  hidden: {},
  visible: {
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.05,
    },
  },
}

export default function HealthLiteracyStep({
  formData,
  setFormData,
  nextStep,
  prevStep,
}: any) {
  const reduceMotion = useReducedMotion()

  return (
    <PreSurveyBackground>
      <section
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
            Health Literacy
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
            These questions help us understand how comfortable you are managing
            health-related information and medical materials.
          </motion.p>

          {/* =================================================
              ABOUT THIS SECTION
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
                  scale: 0.8,
                },
                visible: {
                  opacity: 1,
                  scale: 1,
                  transition: {
                    duration: 0.6,
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
                h-10
                w-10
                shrink-0
                items-center
                justify-center
                rounded-full
                bg-[#EAF3FF]
                text-sm
                font-semibold
                text-[#1473E6]
              "
            >
              i
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
                About this section
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
                Your answers help us understand how comfortable you feel
                reading, completing, and using health-related information.
              </p>
            </motion.div>
          </motion.div>
        </motion.div>

        {/* =====================================================
            QUESTIONS
        ====================================================== */}
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{
            once: false,
            amount: 0.08,
            margin: "0px 0px -40px 0px",
          }}
          variants={questionsContainer}
          className="
            space-y-5
            px-6
            pb-12
            sm:px-8
            lg:px-10
          "
        >
          <SelectField
            label="How confident are you filling out medical forms by yourself?"
            name="medical_forms_confidence"
            value={formData.medical_forms_confidence}
            options={[
              "Extremely confident",
              "Quite confident",
              "Somewhat confident",
              "A little confident",
              "Not at all confident",
            ]}
            helperText="Select the option that best reflects your confidence level."
            formData={formData}
            setFormData={setFormData}
            reduceMotion={reduceMotion}
          />

          <SelectField
            label="How often do you need help reading health-related materials?"
            name="reading_help_frequency"
            value={formData.reading_help_frequency}
            options={[
              "Never",
              "Rarely",
              "Sometimes",
              "Often",
              "Always",
            ]}
            helperText="This includes prescription labels, appointment instructions, and educational materials."
            formData={formData}
            setFormData={setFormData}
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
            nextStep={nextStep}
          />
        </motion.div>
      </section>
    </PreSurveyBackground>
  )
}

function FieldWrapper({
  label,
  helperText,
  children,
  reduceMotion,
}: {
  label: string
  helperText?: string
  children: React.ReactNode
  reduceMotion?: boolean | null
}) {
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
      <div className="min-w-0">
        <label
          className="
            block
            text-lg
            font-medium
            leading-[1.45]
            text-slate-950
          "
        >
          {label}
        </label>

        {helperText ? (
          <p
            className="
              mt-2
              text-sm
              font-normal
              leading-relaxed
              text-slate-500
            "
          >
            {helperText}
          </p>
        ) : null}

        <div className="mt-5">
          {children}
        </div>
      </div>
    </motion.div>
  )
}

function SelectField({
  label,
  helperText,
  name,
  value,
  options,
  formData,
  setFormData,
  reduceMotion,
}: any) {
  return (
    <FieldWrapper
      label={label}
      helperText={helperText}
      reduceMotion={reduceMotion}
    >
      <div className="relative">
        <select
          value={value}
          onChange={(e) =>
            setFormData({
              ...formData,
              [name]: e.target.value,
            })
          }
          className={`
            h-[54px]
            w-full
            cursor-pointer
            appearance-none
            rounded-[10px]
            bg-white
            px-4
            pr-12
            text-base
            font-normal
            shadow-[inset_0_0_0_1px_rgba(203,213,225,0.72),0_4px_14px_rgba(15,45,80,0.04)]
            outline-none
            transition-all
            duration-200
            hover:shadow-[inset_0_0_0_1px_rgba(148,163,184,0.85),0_5px_16px_rgba(15,45,80,0.05)]
            focus:shadow-[inset_0_0_0_2px_rgba(20,115,230,0.90),0_0_0_4px_rgba(20,115,230,0.10)]
            ${
              value
                ? "text-slate-950"
                : "text-slate-400"
            }
          `}
        >
          <option value="">
            Select one
          </option>

          {options.map((option: string) => {
            const isBlocked =
              option === "Not sure" ||
              option === "Prefer not to answer"

            return (
              <option
                key={option}
                value={option}
                disabled={isBlocked}
                aria-disabled={
                  isBlocked
                    ? "true"
                    : undefined
                }
              >
                {option}
              </option>
            )
          })}
        </select>

        <ChevronDown
          aria-hidden="true"
          strokeWidth={1.7}
          className="
            pointer-events-none
            absolute
            right-4
            top-1/2
            h-5
            w-5
            -translate-y-1/2
            text-slate-400
          "
        />
      </div>
    </FieldWrapper>
  )
}