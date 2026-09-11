"use client"

import { Check, ChevronDown } from "lucide-react"

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
      staggerChildren: 0.09,
      delayChildren: 0.05,
    },
  },
}

export default function TechnologyStep({
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
            Technology Experience
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
            These questions help us understand your comfort level with digital
            tools, mobile apps, telehealth, and voice-based technology.
          </motion.p>

          {/* About this section */}
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
                Your responses help us understand how familiar and comfortable
                you are with the digital tools that may support your study
                experience.
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
            amount: 0.06,
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
          <YesNoField
            label="Do you own a smartphone?"
            name="owns_smartphone"
            value={formData.owns_smartphone}
            formData={formData}
            setFormData={setFormData}
            reduceMotion={reduceMotion}
          />

          <SelectField
            label="How often do you use the internet?"
            name="internet_usage"
            value={formData.internet_usage}
            options={[
              "Daily",
              "Several times per week",
              "About once per week",
              "Less than once per week",
              "Rarely or never",
            ]}
            formData={formData}
            setFormData={setFormData}
            reduceMotion={reduceMotion}
          />

          <SelectField
            label="How comfortable are you using websites or mobile apps?"
            name="app_comfort"
            value={formData.app_comfort}
            options={[
              "Very comfortable",
              "Somewhat comfortable",
              "Neutral",
              "Somewhat uncomfortable",
              "Very uncomfortable",
            ]}
            formData={formData}
            setFormData={setFormData}
            reduceMotion={reduceMotion}
          />

          <YesNoField
            label="Have you used telehealth services before?"
            name="telehealth_used"
            value={formData.telehealth_used}
            formData={formData}
            setFormData={setFormData}
            reduceMotion={reduceMotion}
          />

          <YesNoField
            label="Have you ever used online tools or apps for emotional or mental health support?"
            name="mental_health_apps_used"
            value={formData.mental_health_apps_used}
            formData={formData}
            setFormData={setFormData}
            reduceMotion={reduceMotion}
          />

          <ScaleField
            label="How comfortable are you using smartphone apps?"
            name="smartphone_app_comfort"
            value={formData.smartphone_app_comfort}
            formData={formData}
            setFormData={setFormData}
            reduceMotion={reduceMotion}
          />

          <YesNoField
            label="Have you used digital tools or apps to help manage your health before?"
            name="digital_health_tools_used"
            value={formData.digital_health_tools_used}
            formData={formData}
            setFormData={setFormData}
            reduceMotion={reduceMotion}
          />

          <ScaleField
            label="How comfortable are you using voice-based technology?"
            name="voice_tech_comfort"
            value={formData.voice_tech_comfort}
            formData={formData}
            setFormData={setFormData}
            reduceMotion={reduceMotion}
          />

          <SelectField
            label="When communicating with digital tools, which format do you generally prefer?"
            name="communication_preference"
            value={formData.communication_preference}
            options={[
              "Text-based messages",
              "Voice-based interaction",
              "Visual buttons and menus",
              "A combination of text and voice",
              "No preference",
            ]}
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

function YesNoField({
  label,
  name,
  value,
  formData,
  setFormData,
  reduceMotion,
}: any) {
  const options = [
    {
      label: "Yes",
      value: true,
    },
    {
      label: "No",
      value: false,
    },
  ]

  return (
    <FieldWrapper
      label={label}
      reduceMotion={reduceMotion}
    >
      <div
        className="
          grid
          gap-3
          sm:grid-cols-2
        "
      >
        {options.map((option) => {
          const selected =
            value === option.value

          return (
            <motion.button
              type="button"
              key={option.label}
              onClick={() =>
                setFormData({
                  ...formData,
                  [name]: option.value,
                })
              }
              aria-pressed={selected}
              whileHover={
                reduceMotion
                  ? undefined
                  : {
                      y: -2,
                    }
              }
              whileTap={
                reduceMotion
                  ? undefined
                  : {
                      scale: 0.99,
                    }
              }
              transition={{
                duration: 0.2,
                ease: easeOut,
              }}
              className={`
                flex
                min-h-[58px]
                cursor-pointer
                items-center
                justify-between
                gap-3
                rounded-[12px]
                bg-white
                px-4
                py-3.5
                text-left
                text-sm
                font-normal
                outline-none
                transition-shadow
                duration-200
                ${
                  selected
                    ? `
                      bg-[#F3F8FF]
                      text-[#173B7A]
                      shadow-[0_8px_24px_rgba(20,115,230,0.14),inset_0_0_0_2px_rgba(20,115,230,0.75)]
                    `
                    : `
                      text-slate-600
                      shadow-[0_5px_18px_rgba(15,45,80,0.07)]
                      hover:text-slate-950
                      hover:shadow-[0_8px_24px_rgba(15,45,80,0.11)]
                    `
                }
              `}
            >
              <span>
                {option.label}
              </span>

              <motion.span
                animate={{
                  scale: selected ? 1 : 0.92,
                }}
                transition={{
                  duration: 0.2,
                  ease: easeOut,
                }}
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
                      ? `
                        bg-[#1473E6]
                        text-white
                        shadow-[0_4px_12px_rgba(20,115,230,0.22)]
                      `
                      : `
                        bg-slate-100
                        text-transparent
                        shadow-[inset_0_0_0_1px_rgba(203,213,225,0.85)]
                      `
                  }
                `}
              >
                <Check
                  aria-hidden="true"
                  strokeWidth={2.5}
                  className="h-3.5 w-3.5"
                />
              </motion.span>
            </motion.button>
          )
        })}
      </div>
    </FieldWrapper>
  )
}

function ScaleField({
  label,
  name,
  value,
  formData,
  setFormData,
  reduceMotion,
}: any) {
  const numericValue =
    typeof value === "number"
      ? value
      : Number(value ?? 0)

  return (
    <FieldWrapper
      label={label}
      reduceMotion={reduceMotion}
    >
      <div className="space-y-5">
        <div
          className="
            flex
            items-center
            justify-between
            gap-4
            text-xs
            font-normal
            text-slate-500
          "
        >
          <span>
            0 = Not comfortable
          </span>

          <span className="text-right">
            10 = Very comfortable
          </span>
        </div>

        <input
          type="range"
          min={0}
          max={10}
          value={value}
          onChange={(e) =>
            setFormData({
              ...formData,
              [name]: Number(e.target.value),
            })
          }
          aria-label={label}
          className="
            h-2
            w-full
            cursor-pointer
            appearance-none
            rounded-full
            bg-slate-200
            accent-[#1473E6]
          "
          style={{
            background: `linear-gradient(
              to right,
              #1473E6 0%,
              #1473E6 ${numericValue * 10}%,
              #E2E8F0 ${numericValue * 10}%,
              #E2E8F0 100%
            )`,
          }}
        />

        <motion.div
          key={numericValue}
          initial={
            reduceMotion
              ? false
              : {
                  opacity: 0.6,
                  y: 4,
                  scale: 0.98,
                }
          }
          animate={{
            opacity: 1,
            y: 0,
            scale: 1,
          }}
          transition={{
            duration: 0.2,
            ease: easeOut,
          }}
          className="
            flex
            items-center
            justify-between
            gap-4
            rounded-[12px]
           
            px-4
            py-3.5
            shadow-[inset_0_0_0_1px_rgba(219,234,254,0.9)]
          "
        >
          <span
            className="
              text-sm
              font-normal
              text-slate-500
            "
          >
            Selected value
          </span>

          <span
            className="
              flex
              h-9
              min-w-9
              items-center
              justify-center
              rounded-full
              bg-[#173B7A]
              px-3
              text-sm
              font-semibold
              text-white
              shadow-[0_5px_14px_rgba(23,59,122,0.18)]
            "
          >
            {value}
          </span>
        </motion.div>
      </div>
    </FieldWrapper>
  )
}