"use client"

import {
  motion,
  useReducedMotion,
  type Variants,
} from "framer-motion"

import StepButtons from "./StepButtons"
import PreSurveyBackground from "./PreSurveyBackground"

const questions = [
  "Little interest or pleasure in doing things",
  "Feeling down, depressed, or hopeless",
  "Trouble falling or staying asleep, or sleeping too much",
  "Feeling tired or having little energy",
  "Poor appetite or overeating",
  "Feeling bad about yourself — or that you are a failure or have let yourself or your family down",
  "Trouble concentrating on things, such as reading or watching television",
  "Moving or speaking so slowly that other people could notice, or the opposite — being so fidgety or restless that you move around more than usual",
  "Thoughts that you would be better off dead or hurting yourself in some way",
]

const options = [
  { value: 0, label: "Not at all" },
  { value: 1, label: "Several days" },
  { value: 2, label: "More than half the days" },
  { value: 3, label: "Nearly every day" },
]

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

const rowContainer: Variants = {
  hidden: {},

  visible: {
    transition: {
      staggerChildren: 0.06,
      delayChildren: 0.04,
    },
  },
}

export default function PHQStep({
  formData,
  setFormData,
  nextStep,
  prevStep,
}: any) {
  const reduceMotion = useReducedMotion()

  const answeredQuestions = questions.filter((_, index) => {
    const name = `phq${index + 1}`
    return formData[name] !== undefined
  }).length

  const progress = Math.round(
    (answeredQuestions / questions.length) * 100
  )

  return (
    <PreSurveyBackground>
      <section
        className="
          relative
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
            Patient Health Questionnaire-9
            <span className="text-slate-400"> (PHQ-9)</span>
          </motion.h1>

          <motion.p
            variants={fadeUp}
            className="
              mt-5
              max-w-[68ch]
              text-lg
              font-normal
              leading-relaxed
              text-slate-600
            "
          >
            Over the last 2 weeks, how often have you been bothered by the
            following problems?
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
              max-w-[900px]
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
                  max-w-[72ch]
                  text-base
                  font-normal
                  leading-relaxed
                  text-slate-600
                "
              >
                Please choose the response that best reflects how often you
                experienced each item during the past two weeks.
              </p>
            </motion.div>
          </motion.div>
        </motion.div>

        {/* =====================================================
            COMPLETION PROGRESS
        ====================================================== */}
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{
            once: false,
            amount: 0.4,
          }}
          variants={fadeUp}
          className="
            px-6
            pb-8
            sm:px-8
            lg:px-10
          "
        >
        
        </motion.div>

        {/* =====================================================
            QUESTION MATRIX
        ====================================================== */}
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{
            once: false,
            amount: 0.06,
          }}
          variants={rowContainer}
          className="
            min-w-0
            px-6
            pb-10
            sm:px-8
            lg:px-10
          "
        >
          <div
            className="
              w-full
              max-w-[1100px]
              min-w-0
              overflow-hidden
              rounded-[18px]
              bg-white
              shadow-[0_14px_40px_rgba(15,45,80,0.08)]
            "
          >
            <div className="w-full overflow-x-auto overscroll-x-contain">
              <table
                className="
                  w-full
                  min-w-[940px]
                  border-collapse
                "
              >
                <thead>
                  <tr className="bg-[#F8FAFD]">
                    <th
                      className="
                        w-[46%]
                        px-6
                        py-5
                        text-left
                        text-[11px]
                        font-bold
                        uppercase
                        tracking-[0.16em]
                        text-slate-700
                      "
                    >
                      Question
                    </th>

                    {options.map((option) => (
                      <th
                        key={option.value}
                        className="
                          px-3
                          py-5
                          text-center
                        "
                      >
                        <span
                          className="
                            block
                            text-[12px]
                            font-medium
                            normal-case
                            tracking-normal
                            text-slate-700
                          "
                        >
                          {option.label}
                        </span>

                        <span
                          className="
                            mt-1
                            block
                            text-[13px]
                            font-normal
                            text-slate-400
                          "
                        >
                          Score {option.value}
                        </span>
                      </th>
                    ))}
                  </tr>
                </thead>

                <tbody>
                  {questions.map((question, index) => {
                    const name = `phq${index + 1}`

                    return (
                      <motion.tr
                        key={name}
                        variants={fadeUp}
                        className="
                          border-t
                          border-slate-100
                          bg-white
                          transition-colors
                          duration-200
                          hover:bg-[#FCFDFF]
                        "
                      >
                        <td
                          className="
                            px-6
                            py-6
                            align-middle
                          "
                        >
                          <p
                            className="
                              text-[18px]
                              font-medium
                              leading-relaxed
                              text-slate-900
                            "
                          >
                            {question}
                          </p>
                        </td>

                        {options.map((option) => {
                          const selected =
                            formData[name] === option.value

                          return (
                            <td
                              key={option.value}
                              className={`
                                px-3
                                py-6
                                text-center
                                align-middle
                                transition-colors
                                duration-200
                                ${
                                  selected
                                    ? "bg-[#F3F8FF]"
                                    : "bg-transparent"
                                }
                              `}
                            >
                              <label
                                className="
                                  inline-flex
                                  cursor-pointer
                                  items-center
                                  justify-center
                                  rounded-full
                                  p-2
                                "
                              >
                                <input
                                  type="radio"
                                  name={name}
                                  value={option.value}
                                  checked={selected}
                                  onChange={() =>
                                    setFormData({
                                      ...formData,
                                      [name]:
                                        option.value,
                                    })
                                  }
                                  className="sr-only"
                                />

                                <motion.span
                                  aria-hidden="true"
                                  animate={{
                                    scale: selected
                                      ? 1
                                      : 0.94,
                                    backgroundColor: selected
                                      ? "#1473E6"
                                      : "#FFFFFF",
                                    boxShadow: selected
                                      ? "0 5px 14px rgba(20,115,230,0.22), inset 0 0 0 1px rgba(20,115,230,1)"
                                      : "inset 0 0 0 1px rgba(148,163,184,0.7)",
                                  }}
                                  whileHover={
                                    reduceMotion
                                      ? undefined
                                      : {
                                          scale: 1.08,
                                        }
                                  }
                                  transition={{
                                    duration: 0.2,
                                    ease: easeOut,
                                  }}
                                  className="
                                    flex
                                    h-6
                                    w-6
                                    items-center
                                    justify-center
                                    rounded-full
                                  "
                                >
                                  {selected ? (
                                    <motion.span
                                      initial={{
                                        scale: 0,
                                        opacity: 0,
                                      }}
                                      animate={{
                                        scale: 1,
                                        opacity: 1,
                                      }}
                                      transition={{
                                        duration: 0.18,
                                        ease: easeOut,
                                      }}
                                      className="
                                        h-2
                                        w-2
                                        rounded-full
                                        bg-white
                                      "
                                    />
                                  ) : null}
                                </motion.span>

                                <span className="sr-only">
                                  {option.label}
                                </span>
                              </label>
                            </td>
                          )
                        })}
                      </motion.tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </motion.div>

        {/* =====================================================
            SAFETY NOTICE
        ====================================================== */}
        <motion.div
          initial={{
            opacity: 0,
            y: 22,
            scale: 0.99,
          }}
          whileInView={{
            opacity: 1,
            y: 0,
            scale: 1,
          }}
          viewport={{
            once: false,
            amount: 0.35,
          }}
          transition={{
            duration: 0.65,
            ease: easeOut,
          }}
          className="
            px-6
            pb-10
            sm:px-8
            lg:px-10
          "
        >
          
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