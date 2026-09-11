"use client"

import {
  Check,
  ChevronDown,
} from "lucide-react"

import {
  motion,
  useReducedMotion,
  type Variants,
} from "framer-motion"

import StepButtons from "./StepButtons"
import PreSurveyBackground from "./PreSurveyBackground"

const easeOut = [0.22, 1, 0.36, 1] as const

/* =========================================================
   MOTION
========================================================= */

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

/* =========================================================
   DEMOGRAPHICS
========================================================= */

export default function DemographicsStep({
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
          min-w-0
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
            Demographics
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
            Please complete the following background questions. Select the
            option that best describes you.
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
              border-l-4
              border-blue-900
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
                shadow-sm
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
                These questions help the research team better understand the
                background and experiences of study participants.
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
          <SelectField
            label="How long ago were you diagnosed with type 2 diabetes?"
            name="diagnosis_duration"
            value={formData.diagnosis_duration}
            options={[
              "Less than 1 year ago",
              "1–5 years ago",
              "6–10 years ago",
              "More than 10 years ago",
            ]}
            setFormData={setFormData}
            formData={formData}
            reduceMotion={reduceMotion}
          />

          <TextField
            label="What is your age in years?"
            name="age"
            type="number"
            placeholder="Enter your age"
            value={formData.age}
            setFormData={setFormData}
            formData={formData}
            reduceMotion={reduceMotion}
          />

          <SelectField
            label="Sex assigned at birth"
            name="gender"
            value={formData.gender}
            options={[
              "Female",
              "Male",
            ]}
            setFormData={setFormData}
            formData={formData}
            reduceMotion={reduceMotion}
          />

          <SingleSelectCardField
            label="Which race do you identify with?"
            name="race"
            values={formData.race}
            options={[
              "American Indian or Alaska Native",
              "Asian",
              "Black or African American",
              "Native Hawaiian or Other Pacific Islander",
              "White",
              "Multiracial",
              "Other",
            ]}
            setFormData={setFormData}
            formData={formData}
            reduceMotion={reduceMotion}
          />

          <SelectField
            label="Are you of Hispanic, Latino, or Spanish origin?"
            name="ethnicity"
            value={formData.ethnicity}
            options={[
              "Yes",
              "No",
            ]}
            setFormData={setFormData}
            formData={formData}
            reduceMotion={reduceMotion}
          />

          <SelectField
            label="What is your current marital status?"
            name="marital_status"
            value={formData.marital_status}
            options={[
              "Single",
              "Married",
              "Living with partner",
              "Separated",
              "Divorced",
              "Widowed",
            ]}
            setFormData={setFormData}
            formData={formData}
            reduceMotion={reduceMotion}
          />

          <SelectField
            label="What is the highest level of education you completed?"
            name="education"
            value={formData.education}
            options={[
              "Less than high school",
              "High school diploma or GED",
              "Some college",
              "Associate degree",
              "Bachelor’s degree",
              "Graduate or professional degree",
            ]}
            setFormData={setFormData}
            formData={formData}
            reduceMotion={reduceMotion}
          />

          <SelectField
            label="What is your current employment status?"
            name="employment_status"
            value={formData.employment_status}
            options={[
              "Employed full-time",
              "Employed part-time",
              "Self-employed",
              "Unemployed",
              "Student",
              "Retired",
              "Unable to work",
            ]}
            setFormData={setFormData}
            formData={formData}
            reduceMotion={reduceMotion}
          />

          <SelectField
            label="What is your annual household income?"
            name="household_income"
            value={formData.household_income}
            options={[
              "Less than $25,000",
              "$25,000–$49,999",
              "$50,000–$74,999",
              "$75,000–$99,999",
              "$100,000 or more",
            ]}
            setFormData={setFormData}
            formData={formData}
            reduceMotion={reduceMotion}
          />

          <SelectField
            label="What type of health insurance do you currently have?"
            name="insurance_type"
            value={formData.insurance_type}
            options={[
              "Private insurance",
              "Medicaid",
              "Medicare",
              "Military/Veterans insurance",
              "No insurance",
              "Other",
            ]}
            setFormData={setFormData}
            formData={formData}
            reduceMotion={reduceMotion}
          />
        </motion.div>

        {/* =====================================================
            FOOTER BUTTONS
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

/* =========================================================
   FIELD WRAPPER
========================================================= */

function FieldWrapper({
  label,
  children,
  reduceMotion,
}: {
  label: string
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

        <div className="mt-5">
          {children}
        </div>
      </div>
    </motion.div>
  )
}

/* =========================================================
   TEXT FIELD
========================================================= */

function TextField({
  label,
  name,
  value,
  type = "text",
  placeholder,
  formData,
  setFormData,
  reduceMotion,
}: any) {
  return (
    <FieldWrapper
      label={label}
      reduceMotion={reduceMotion}
    >
      <input
        type={type}
        value={value}
        min={
          type === "number"
            ? 0
            : undefined
        }
        placeholder={placeholder}
        onChange={(e) => {
          const value =
            e.target.value

          if (
            type === "number" &&
            Number(value) < 0
          ) {
            return
          }

          setFormData({
            ...formData,
            [name]: value,
          })
        }}
        className="
          h-[54px]
          w-full
          rounded-[10px]
          bg-white
          px-4
          text-base
          font-normal
          text-slate-950
          shadow-[inset_0_0_0_1px_rgba(203,213,225,0.72),0_4px_14px_rgba(15,45,80,0.04)]
          outline-none
          transition-all
          duration-200
          placeholder:text-slate-400
          hover:shadow-[inset_0_0_0_1px_rgba(148,163,184,0.85),0_5px_16px_rgba(15,45,80,0.05)]
          focus:shadow-[inset_0_0_0_2px_rgba(20,115,230,0.90),0_0_0_4px_rgba(20,115,230,0.10)]
        "
      />
    </FieldWrapper>
  )
}

/* =========================================================
   SELECT FIELD
========================================================= */

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

/* =========================================================
   SINGLE SELECT CARD FIELD
========================================================= */

function SingleSelectCardField({
  label,
  name,
  values,
  options,
  formData,
  setFormData,
  reduceMotion,
}: any) {
  function selectOption(option: string) {
    setFormData({
      ...formData,
      [name]: [option],
    })
  }

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
          xl:grid-cols-3
        "
      >
        {options.map((option: string) => {
          const selected =
            values?.[0] === option

          return (
            <motion.button
              type="button"
              key={option}
              onClick={() =>
                selectOption(option)
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
                min-h-[62px]
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
                focus-visible:shadow-[0_0_0_4px_rgba(20,115,230,0.12),0_8px_24px_rgba(15,45,80,0.10)]
              `}
            >
              <span className="leading-snug">
                {option}
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

/* =========================================================
   MULTI SELECT FIELD
========================================================= */

function MultiSelectField({
  label,
  name,
  values,
  options,
  formData,
  setFormData,
  reduceMotion,
}: any) {
  function toggleOption(option: string) {
    const current =
      Array.isArray(values)
        ? values
        : []

    const updated =
      current.includes(option)
        ? current.filter(
            (item: string) =>
              item !== option
          )
        : [
            ...current,
            option,
          ]

    setFormData({
      ...formData,
      [name]: updated,
    })
  }

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
          xl:grid-cols-3
        "
      >
        {options.map((option: string) => {
          const selected =
            values?.includes(option)

          return (
            <motion.button
              type="button"
              key={option}
              onClick={() =>
                toggleOption(option)
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
                min-h-[62px]
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
                      hover:shadow-[0_8px_24px_rgba(15,45,80,0.11)]
                    `
                }
              `}
            >
              <span className="leading-snug">
                {option}
              </span>

              <motion.span
                animate={{
                  scale: selected ? 1 : 0.92,
                }}
                className={`
                  flex
                  h-6
                  w-6
                  shrink-0
                  items-center
                  justify-center
                  rounded-[7px]
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