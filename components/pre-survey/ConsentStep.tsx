"use client"

import StepButtons from "./StepButtons"
import PreSurveyBackground from "./PreSurveyBackground"

import {
  motion,
  useReducedMotion,
  type Variants,
} from "framer-motion"

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

const listContainer: Variants = {
  hidden: {},

  visible: {
    transition: {
      staggerChildren: 0.08,
      delayChildren: 0.08,
    },
  },
}

const listItem: Variants = {
  hidden: {
    opacity: 0,
    x: 14,
  },

  visible: {
    opacity: 1,
    x: 0,

    transition: {
      duration: 0.55,
      ease: easeOut,
    },
  },
}

export default function ConsentStep({
  formData,
  setFormData,
  nextStep,
}: any) {
  const reduceMotion = useReducedMotion()

  const options = [
    {
      value: "I consent to participate",
      title: "I consent to participate",
      description:
        "I have read the information above and voluntarily agree to participate in this research study.",
    },

    {
      value: "I do not consent",
      title: "I do not consent",
      description:
        "I do not wish to participate in this research study.",
    },
  ]

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
            border-b
            border-slate-100
            px-6
            pb-8
            pt-6
            sm:px-8
            sm:pb-9
            sm:pt-7
            lg:px-10
          "
        >
          {/* Heading */}
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
            Consent to Participate
          </motion.h1>

          {/* Intro */}
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
            You are being invited to participate in the AIDES-T2D research
            study. Before continuing, please review the information below and
            indicate whether you consent to participate in this study.
          </motion.p>

          {/* =================================================
              PRE-SURVEY CONTEXT
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
              flex
              max-w-[760px]
              items-center
              gap-5
              rounded-lg
              border-l-4
              border-l-blue-900
              bg-white
              px-5
              py-5
              shadow-lg
            "
          >
            {/* Pre-survey illustration */}
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
                    duration: 0.7,
                    ease: easeOut,
                  },
                },
              }}
              className="
                flex
                h-[76px]
                w-[76px]
                shrink-0
                items-center
                justify-center
                sm:h-[84px]
                sm:w-[84px]
              "
            >
              <motion.img
                src="/dashboard/checksurvey.png"
                alt=""
                aria-hidden="true"
                whileHover={
                  reduceMotion
                    ? undefined
                    : {
                        scale: 1.06,
                      }
                }
                transition={{
                  duration: 0.3,
                  ease: easeOut,
                }}
                className="
                  h-full
                  w-full
                  object-contain
                "
              />
            </motion.div>

            <motion.p
              variants={fadeLeft}
              className="
                max-w-[70ch]
                text-base
                font-normal
                leading-relaxed
                text-slate-600
              "
            >
              This pre-survey is completed only once at the beginning of the
              study. Your responses will help personalize your experience
              throughout the AIDES-T2D program and support ongoing research
              focused on diabetes-related distress and well-being.
            </motion.p>
          </motion.div>
        </motion.div>

        {/* =====================================================
            BODY
        ====================================================== */}
        <div
          className="
            space-y-10
            px-6
            py-9
            sm:px-8
            sm:py-10
            lg:px-10
          "
        >
          {/* =================================================
              IMPORTANT INFORMATION
          ================================================== */}
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{
              once: false,
              amount: 0.24,
            }}
            variants={container}
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
              flex
              max-w-[760px]
              rounded-lg
              border-l-4
              border-l-blue-900
              bg-white
              px-5
              py-6
              shadow-lg
            "
          >
            <div className="flex items-start gap-5">
              {/* Important information shield */}
              <motion.div
                variants={{
                  hidden: {
                    opacity: 0,
                    scale: 0.8,
                    rotate: -4,
                  },

                  visible: {
                    opacity: 1,
                    scale: 1,
                    rotate: 0,

                    transition: {
                      duration: 0.7,
                      ease: easeOut,
                    },
                  },
                }}
                className="
                  flex
                  h-[72px]
                  w-[72px]
                  shrink-0
                  items-center
                  justify-center
                  sm:h-[80px]
                  sm:w-[80px]
                "
              >
                <motion.img
                  src="/dashboard/sheild.png"
                  alt=""
                  aria-hidden="true"
                  whileHover={
                    reduceMotion
                      ? undefined
                      : {
                          scale: 1.06,
                          rotate: 1.5,
                        }
                  }
                  transition={{
                    duration: 0.3,
                    ease: easeOut,
                  }}
                  className="
                    h-full
                    w-full
                    object-contain
                  "
                />
              </motion.div>

              <div className="min-w-0 pt-1">
                <motion.h2
                  variants={fadeLeft}
                  className="
                    text-base
                    font-medium
                    text-[#173B7A]
                  "
                >
                  Important information
                </motion.h2>

                <motion.ul
                  variants={listContainer}
                  className="
                    mt-4
                    space-y-3
                    text-base
                    font-normal
                    leading-relaxed
                    text-slate-600
                  "
                >
                  <motion.li
                    variants={listItem}
                    className="flex gap-3"
                  >
                    <span
                      aria-hidden="true"
                      className="
                        mt-[10px]
                        h-1.5
                        w-1.5
                        shrink-0
                        rounded-full
                        bg-[#1473E6]
                      "
                    />

                    <span>
                      Your participation in this study is completely voluntary.
                    </span>
                  </motion.li>

                  <motion.li
                    variants={listItem}
                    className="flex gap-3"
                  >
                    <span
                      aria-hidden="true"
                      className="
                        mt-[10px]
                        h-1.5
                        w-1.5
                        shrink-0
                        rounded-full
                        bg-[#1473E6]
                      "
                    />

                    <span>
                      You may stop participating at any time without penalty.
                    </span>
                  </motion.li>

                  <motion.li
                    variants={listItem}
                    className="flex gap-3"
                  >
                    <span
                      aria-hidden="true"
                      className="
                        mt-[10px]
                        h-1.5
                        w-1.5
                        shrink-0
                        rounded-full
                        bg-[#1473E6]
                      "
                    />

                    <span>
                      Your responses will be kept confidential and used only
                      for research purposes.
                    </span>
                  </motion.li>

                  <motion.li
                    variants={listItem}
                    className="flex gap-3"
                  >
                    <span
                      aria-hidden="true"
                      className="
                        mt-[10px]
                        h-1.5
                        w-1.5
                        shrink-0
                        rounded-full
                        bg-[#1473E6]
                      "
                    />

                    <span>
                      Some survey questions may ask about your emotional
                      well-being and experiences managing diabetes.
                    </span>
                  </motion.li>
                </motion.ul>
              </div>
            </div>
          </motion.div>

          {/* =================================================
              PARTICIPANT CONSENT
          ================================================== */}
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{
              once: false,
              amount: 0.2,
            }}
            variants={container}
            className="max-w-[820px]"
          >
            <motion.div
              variants={fadeUp}
              className="mb-5"
            >
              <h2
                className="
                  text-2xl
                  font-light
                  tracking-tight
                  text-slate-950
                "
              >
                Participant consent
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
                Please select one of the options below.
              </p>
            </motion.div>

            <motion.div
              variants={listContainer}
              className="space-y-3"
            >
              {options.map((option) => {
                const selected =
                  formData.consent_status === option.value

                return (
                  <motion.label
                    key={option.value}
                    variants={fadeUp}
                    whileHover={
                      reduceMotion
                        ? undefined
                        : {
                            y: -2,
                            scale: 1.003,
                          }
                    }
                    whileTap={
                      reduceMotion
                        ? undefined
                        : {
                            scale: 0.997,
                          }
                    }
                    transition={{
                      duration: 0.2,
                      ease: easeOut,
                    }}
                    className={`
                      group
                      relative
                      block
                      cursor-pointer
                      rounded-[14px]
                      border
                      px-5
                      py-5
                      transition-[border-color,background-color,box-shadow]
                      duration-200
                      ${
                        selected
                          ? `
                            border-blue-900
                            bg-white
                            shadow-[0_8px_24px_rgba(20,115,230,0.08)]
                          `
                          : `
                            border-slate-200
                            bg-white
                            hover:border-blue-900
                          `
                      }
                    `}
                  >
                    <div className="flex items-start gap-4">
                      {/* Custom radio */}
                      <motion.span
                        aria-hidden="true"
                        animate={{
                          scale: selected ? 1 : 0.95,
                          backgroundColor: selected
                            ? "#1473E6"
                            : "#FFFFFF",
                          borderColor: selected
                            ? "#1473E6"
                            : "#CBD5E1",
                        }}
                        transition={{
                          duration: 0.2,
                          ease: easeOut,
                        }}
                        className="
                          mt-0.5
                          flex
                          h-5
                          w-5
                          shrink-0
                          items-center
                          justify-center
                          rounded-full
                          border
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
                              duration: 0.2,
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

                      {/* Native radio */}
                      <input
                        type="radio"
                        name="consent_status"
                        value={option.value}
                        checked={selected}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            consent_status: e.target.value,
                          })
                        }
                        className="sr-only"
                      />

                      {/* Copy */}
                      <div className="min-w-0">
                        <p
                          className={`
                            text-[15px]
                            font-medium
                            leading-snug
                            transition-colors
                            duration-200
                            ${
                              selected
                                ? "text-[#173B7A]"
                                : "text-slate-900"
                            }
                          `}
                        >
                          {option.title}
                        </p>

                        <p
                          className="
                            mt-1.5
                            max-w-[68ch]
                            text-sm
                            font-normal
                            leading-relaxed
                            text-slate-500
                          "
                        >
                          {option.description}
                        </p>
                      </div>
                    </div>
                  </motion.label>
                )
              })}
            </motion.div>
          </motion.div>

          {/* =================================================
              ACKNOWLEDGEMENT
          ================================================== */}
          <motion.div
            initial={{
              opacity: 0,
              y: 24,
              scale: 0.99,
            }}
            whileInView={{
              opacity: 1,
              y: 0,
              scale: 1,
            }}
            viewport={{
              once: false,
              amount: 0.4,
            }}
            whileHover={
              reduceMotion
                ? undefined
                : {
                    x: 3,
                  }
            }
            transition={{
              duration: 0.65,
              ease: easeOut,
            }}
            className="
              max-w-[820px]
              border-l-4
              border-[#173B7A]
              bg-white
              px-5
              py-4
              shadow-[0_8px_24px_rgba(15,45,80,0.06)]
            "
          >
            <p
              className="
                text-sm
                font-normal
                leading-relaxed
                text-slate-600
              "
            >
              By selecting{" "}
              <span className="font-medium text-slate-900">
                “I consent to participate”
              </span>
              , you acknowledge that you understand the purpose of this study
              and agree to participate voluntarily.
            </p>
          </motion.div>
        </div>

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
          <StepButtons nextStep={nextStep} />
        </motion.div>
      </section>
    </PreSurveyBackground>
  )
}