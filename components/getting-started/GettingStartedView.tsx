"use client"

import Image from "next/image"
import Link from "next/link"

import {
  ArrowRight,
  Info,
} from "lucide-react"

import {
  motion,
  useReducedMotion,
  useScroll,
  useTransform,
  type Variants,
} from "framer-motion"

const STEPS = [
  {
    number: "01",
    title: "Pre-Survey",
    description:
      "Review the study information, provide your participation choice, and answer some questions about yourself and your experience with diabetes.",
    imageSrc: "/pre-survey/Pre-Survey.png",
    imageAlt: "Pre-Survey preparation",
  },
  {
    number: "02",
    title: "Diabetes Distress Survey",
    description:
      "Complete a short questionnaire about areas of diabetes management that may be causing stress or concern.",
    imageSrc: "/pre-survey/Distress Survey.png",
    imageAlt: "Diabetes Distress Survey",
  },
  {
    number: "03",
    title: "Choose Your Support Focus",
    description:
      "Review your results and confirm the area you would like to focus on during your study participation.",
    imageSrc: "/pre-survey/Support.png",
    imageAlt: "Personal support focus",
  },
  {
    number: "04",
    title: "First Check-In",
    description:
      "Complete your first check-in and begin your conversation with Stampley.",
    imageSrc: "/pre-survey/Check-In.png",
    imageAlt: "First study check-in",
  },
]

const easeOut = [0.22, 1, 0.36, 1] as const

const fadeUp: Variants = {
  hidden: {
    opacity: 0,
    y: 28,
    filter: "blur(4px)",
  },
  visible: {
    opacity: 1,
    y: 0,
    filter: "blur(0px)",
    transition: {
      duration: 0.8,
      ease: easeOut,
    },
  },
}

const heroContainer: Variants = {
  hidden: {},
  visible: {
    transition: {
      staggerChildren: 0.11,
      delayChildren: 0.08,
    },
  },
}

const journeyContainer: Variants = {
  hidden: {},
  visible: {
    transition: {
      staggerChildren: 0.12,
      delayChildren: 0.1,
    },
  },
}

const stepItem: Variants = {
  hidden: {
    opacity: 0,
    y: 34,
    scale: 0.97,
    filter: "blur(4px)",
  },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    filter: "blur(0px)",
    transition: {
      duration: 0.75,
      ease: easeOut,
    },
  },
}

export default function GettingStartedView() {
  const reduceMotion = useReducedMotion()

  const { scrollYProgress } = useScroll()

  /*
   * Very restrained movement.
   * It gives the hero composition some depth while scrolling,
   * without turning the page into a parallax-heavy experience.
   */
  const heroImageY = useTransform(
    scrollYProgress,
    [0, 0.35],
    [0, reduceMotion ? 0 : 34]
  )

  const blueAccentY = useTransform(
    scrollYProgress,
    [0, 0.35],
    [0, reduceMotion ? 0 : -22]
  )

  const goldArcY = useTransform(
    scrollYProgress,
    [0, 0.35],
    [0, reduceMotion ? 0 : 18]
  )

  return (
    <>
      {/* =====================================================
          HERO — FULL WIDTH
      ====================================================== */}
      <motion.section
        initial="hidden"
        animate="visible"
        variants={heroContainer}
        className="
          relative
          left-1/2
          w-screen
          -translate-x-1/2
          overflow-hidden
          bg-white
        "
      >
        <div
          className="
            mx-auto
            grid
            w-full
            max-w-[1600px]
            items-center
            gap-12
            px-5
            sm:px-8
            lg:min-h-[540px]
            lg:grid-cols-[minmax(0,0.88fr)_minmax(560px,1.12fr)]
            lg:gap-10
            lg:px-12
            xl:min-h-[580px]
            xl:px-16
            2xl:px-20
          "
        >


  <Link
      href="/"
      className="
        group
        inline-flex
        items-center
        gap-5
        rounded-[10px]
        focus-visible:outline-none
        focus-visible:ring-2
        focus-visible:ring-[#1473E6]/25
        focus-visible:ring-offset-4
      "
    >
      <Image
        src="/images/stampleyLogo.png"
        alt="AIDES-T2D"
        width={36}
        height={36}
        priority
        className="
          h-auto
          w-[36px]
          transition-opacity
          duration-200
          group-hover:opacity-90
        "
      />

      <div
        className="
          hidden
          min-w-0
          border-l
          border-slate-200
          pl-5
          sm:block
        "
      >
        <p
          className="
            text-[10px]
            font-bold
            uppercase
            tracking-[0.24em]
            text-cyan-700
          "
        >
          AIDES-T2D Research Study
        </p>

        <p
          className="
            mt-1.5
            text-xs
            font-normal
            leading-none
            text-slate-400
          "
        >
          Participant onboarding
        </p>
      </div>
    </Link>

          {/* =================================================
              LEFT CONTENT
          ================================================== */}
          <motion.div
            variants={heroContainer}
            className="
              relative
              z-20
              py-10
              sm:py-12
              lg:py-16
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
              Getting started
            </motion.p>

            <motion.h1
              variants={fadeUp}
              className="
                mt-5
                max-w-[11ch]
                text-4xl
                font-light
                leading-[1.02]
                tracking-[-0.045em]
                text-[#0B2857]
                sm:text-5xl
                md:text-6xl
                lg:text-[64px]
                xl:text-[70px]
              "
            >
              Before you begin.
            </motion.h1>

            <motion.p
              variants={fadeUp}
              className="
                mt-7
                max-w-[39ch]
                text-lg
                font-normal
                leading-[1.7]
                text-slate-600
                md:text-xl
              "
            >
              Your first visit includes a few short steps to help us understand
              your experience and personalize your study participation.
            </motion.p>

            <motion.div variants={fadeUp}>
              <Link
                href="/survey/pre-survey"
                className="
                  group
                  mt-8
                  inline-flex
                  h-[58px]
                  w-full
                  items-center
                  justify-between
                  gap-8
                  rounded-[10px]
                  bg-[#173B7A]
                  px-6
                  text-lg
                  font-semibold
                  text-white
                  shadow-[0_10px_28px_rgba(23,59,122,0.13)]
                  transition-[background-color,box-shadow,transform]
                  duration-200
                  hover:-translate-y-0.5
                  hover:bg-[#122E60]
                  hover:shadow-[0_14px_32px_rgba(23,59,122,0.18)]
                  focus-visible:outline-2
                  focus-visible:outline-offset-2
                  focus-visible:outline-[#173B7A]
                  active:translate-y-0
                  sm:w-auto
                  sm:min-w-[290px]
                "
              >
                <span>Begin pre-survey</span>

                <span
                  className="
                    flex
                    h-9
                    w-9
                    shrink-0
                    items-center
                    justify-center
                    rounded-full
                    border
                    border-white/65
                    transition-transform
                    duration-300
                    group-hover:translate-x-1
                  "
                >
                  <ArrowRight
                    aria-hidden="true"
                    strokeWidth={1.7}
                    className="h-5 w-5"
                  />
                </span>
              </Link>
            </motion.div>
          </motion.div>

          {/* =================================================
              DESKTOP IMAGE COMPOSITION
          ================================================== */}
          <div
            className="
              relative
              hidden
              min-h-[540px]
              lg:block
              xl:min-h-[580px]
            "
          >
            {/* Blue background accent */}
            <motion.div
              aria-hidden="true"
              variants={{
                hidden: {
                  opacity: 0,
                  scale: 0.82,
                },
                visible: {
                  opacity: 1,
                  scale: 1,
                  transition: {
                    duration: 1,
                    delay: 0.12,
                    ease: easeOut,
                  },
                },
              }}
              style={{
                y: blueAccentY,
              }}
              className="
                absolute
                left-[1%]
                top-[2%]
                h-[190px]
                w-[190px]
                rounded-full
                bg-[#E4F0FF]
                xl:h-[220px]
                xl:w-[220px]
              "
            />

            {/* Main photograph */}
            <motion.div
              variants={{
                hidden: {
                  opacity: 0,
                  scale: 0.96,
                  x: 28,
                },
                visible: {
                  opacity: 1,
                  scale: 1,
                  x: 0,
                  transition: {
                    duration: 1.05,
                    delay: 0.12,
                    ease: easeOut,
                  },
                },
              }}
              style={{
                y: heroImageY,
              }}
              className="
                absolute
                bottom-0
                left-[4%]
                top-0
                z-10
                w-[79%]
                overflow-hidden
                rounded-[46%_54%_47%_53%/42%_42%_58%_58%]
                will-change-transform
              "
            >
              <Image
                src="/pre-survey/womanpresurvey.png"
                alt="Participant preparing to begin the AIDES-T2D study"
                fill
                priority
                sizes="(min-width: 1280px) 48vw, (min-width: 1024px) 52vw, 100vw"
                className="
                  object-cover
                  object-center
                  transition-transform
                  duration-700
                  hover:scale-[1.015]
                "
              />
            </motion.div>

            {/* Gold editorial arc */}
            <motion.div
              aria-hidden="true"
              variants={{
                hidden: {
                  opacity: 0,
                  scale: 0.86,
                  rotate: -6,
                },
                visible: {
                  opacity: 0.9,
                  scale: 1,
                  rotate: 9,
                  transition: {
                    duration: 1.1,
                    delay: 0.3,
                    ease: easeOut,
                  },
                },
              }}
              style={{
                y: goldArcY,
              }}
              className="
                absolute
                right-[-55px]
                top-[110px]
                h-[270px]
                w-[270px]
                rounded-full
                border-[2px]
                border-[#F2B134]
                border-b-transparent
                border-l-transparent
                xl:h-[300px]
                xl:w-[300px]
              "
            />

            {/* Editorial quote */}
            <motion.div
              variants={{
                hidden: {
                  opacity: 0,
                  x: 20,
                },
                visible: {
                  opacity: 1,
                  x: 0,
                  transition: {
                    duration: 0.85,
                    delay: 0.5,
                    ease: easeOut,
                  },
                },
              }}
              className="
                absolute
                right-[0]
                top-[72%]
                z-20
                w-[165px]
              "
            >
              <p
                className="
                  font-['Cormorant_Garamond',Georgia,serif]
                  text-[27px]
                  font-medium
                  leading-[1.02]
                  tracking-[-0.025em]
                  text-[#173B7A]
                  xl:text-[31px]
                "
              >
                Small steps.
                <br />
                Brighter
                <br />
                <span className="font-normal italic">
                  tomorrows.
                </span>
              </p>

              <motion.div
                aria-hidden="true"
                initial={{
                  scaleX: 0,
                }}
                animate={{
                  scaleX: 1,
                }}
                transition={{
                  duration: 0.75,
                  delay: 0.72,
                  ease: easeOut,
                }}
                className="
                  mt-5
                  h-[2px]
                  w-10
                  origin-left
                  bg-[#F2B134]
                "
              />
            </motion.div>
          </div>

          {/* =================================================
              MOBILE / TABLET IMAGE
          ================================================== */}
          <motion.div
            initial={{
              opacity: 0,
              y: 24,
            }}
            animate={{
              opacity: 1,
              y: 0,
            }}
            transition={{
              duration: 0.85,
              delay: 0.28,
              ease: easeOut,
            }}
            className="
              relative
              mx-auto
              w-full
              max-w-[520px]
              pb-6
              lg:hidden
            "
          >
            <div
              aria-hidden="true"
              className="
                absolute
                -left-3
                -top-3
                h-28
                w-28
                rounded-full
                bg-[#E4F0FF]
                sm:h-36
                sm:w-36
              "
            />

            <div
              className="
                relative
                aspect-[4/3]
                w-full
                overflow-hidden
                rounded-[42%_58%_48%_52%/38%_42%_58%_62%]
              "
            >
              <Image
                src="/pre-survey/womanBeforePresurvey.png"
                alt="Participant preparing to begin the AIDES-T2D study"
                fill
                priority
                sizes="(max-width: 1023px) 90vw, 520px"
                className="object-cover object-center"
              />
            </div>

            <div className="relative mt-6 text-center">
              <p
                className="
                  font-['Cormorant_Garamond',Georgia,serif]
                  text-[28px]
                  font-medium
                  leading-[1.05]
                  tracking-[-0.025em]
                  text-[#173B7A]
                "
              >
                Small steps. Brighter{" "}
                <span className="font-normal italic">
                  tomorrows.
                </span>
              </p>

              <div
                aria-hidden="true"
                className="
                  mx-auto
                  mt-4
                  h-[2px]
                  w-10
                  bg-[#F2B134]
                "
              />
            </div>
          </motion.div>
        </div>
      </motion.section>

      {/* =====================================================
          STUDY JOURNEY — SCROLL REVEAL
      ====================================================== */}
      <motion.section
        initial="hidden"
        whileInView="visible"
        viewport={{
          once: false,
          amount: 0.18,
          margin: "0px 0px -60px 0px",
        }}
        variants={journeyContainer}
        className="
          relative
          left-1/2
          mt-14
          w-screen
          -translate-x-1/2
          bg-white
          lg:mt-16
        "
      >
        <div
          className="
            relative
            mx-auto
            w-full
            max-w-[1600px]
            px-5
            sm:px-8
            lg:px-12
            xl:px-16
            2xl:px-20
          "
        >
          {/* Desktop connector */}
          <div
            aria-hidden="true"
            className="
              pointer-events-none
              absolute
              left-[8%]
              right-[8%]
              top-[56px]
              hidden
              h-px
              overflow-hidden
              bg-[#EDF2F7]
              lg:block
            "
          >
            <motion.div
              variants={{
                hidden: {
                  scaleX: 0,
                },
                visible: {
                  scaleX: 1,
                  transition: {
                    duration: 1.2,
                    delay: 0.06,
                    ease: easeOut,
                  },
                },
              }}
              className="
                absolute
                inset-0
                origin-left
                bg-[#C9DBEF]
              "
            />
          </div>

          <motion.ol
            variants={journeyContainer}
            className="
              relative
              grid
              list-none
              gap-10
              sm:grid-cols-2
              sm:gap-x-10
              sm:gap-y-14
              lg:grid-cols-4
              lg:gap-10
            "
          >
            {STEPS.map((step) => (
              <motion.li
                key={step.number}
                variants={stepItem}
                className="relative"
              >
                {/* Step photograph */}
                <motion.div
                  whileHover={
                    reduceMotion
                      ? undefined
                      : {
                          y: -5,
                          scale: 1.025,
                        }
                  }
                  transition={{
                    duration: 0.3,
                    ease: easeOut,
                  }}
                  className="
                    relative
                    z-10
                    mb-6
                    h-[116px]
                    w-[116px]
                    overflow-hidden
                    rounded-full
                    bg-white
                    ring-[7px]
                    ring-white
                    shadow-[0_10px_30px_rgba(15,45,80,0.07)]
                  "
                >
                  <Image
                    src={step.imageSrc}
                    alt={step.imageAlt}
                    fill
                    sizes="116px"
                    className="
                      object-cover
                      transition-transform
                      duration-500
                      hover:scale-[1.035]
                    "
                  />
                </motion.div>

                <p
                  className="
                    text-xs
                    font-bold
                    tracking-[0.16em]
                    text-[#1473E6]
                  "
                >
                  {step.number}
                </p>

                <h2
                  className="
                    mt-3
                    text-xl
                    font-light
                    tracking-tight
                    text-slate-950
                  "
                >
                  {step.title}
                </h2>

                <p
                  className="
                    mt-3
                    max-w-[31ch]
                    text-md
                    font-normal
                    leading-[1.65]
                    text-slate-600
                  "
                >
                  {step.description}
                </p>
              </motion.li>
            ))}
          </motion.ol>
        </div>
      </motion.section>

      {/* =====================================================
          BEFORE YOU CONTINUE — SCROLL REVEAL
      ====================================================== */}
      <motion.section
        initial={{
          opacity: 0,
          y: 32,
          scale: 0.992,
        }}
        whileInView={{
          opacity: 1,
          y: 0,
          scale: 1,
        }}
        viewport={{
          once: false,
          amount: 0.3,
        }}
        transition={{
          duration: 0.8,
          ease: easeOut,
        }}
        className="
          relative
          left-1/2
          mt-16
          w-screen
          -translate-x-1/2
        "
      >
        <div
          className="
            mx-auto
            w-full
            max-w-[1600px]
            px-5
            sm:px-8
            lg:px-12
            xl:px-16
            2xl:px-20
          "
        >
          <motion.div
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
              flex
              gap-4
              rounded-[12px]
              border-l-4
              border-l-blue-900
              bg-white
              px-5
              py-6
              shadow-[0_10px_30px_rgba(15,45,80,0.08)]
              sm:px-7
              sm:py-7
            "
          >
            {/* Information icon */}
            <motion.div
              initial={{
                opacity: 0,
                scale: 0.75,
              }}
              whileInView={{
                opacity: 1,
                scale: 1,
              }}
              viewport={{
                once: false,
              }}
              transition={{
                duration: 0.55,
                delay: 0.15,
                ease: easeOut,
              }}
              className="
                flex
                h-9
                w-9
                shrink-0
                items-center
                justify-center
                text-[#1473E6]
              "
            >
              <Info
                aria-hidden="true"
                strokeWidth={1.7}
                className="h-[18px] w-[18px]"
              />
            </motion.div>

            <div className="min-w-0">
              <h2 className="text-base font-medium text-slate-950">
                Before you continue
              </h2>

              <p
                className="
                  mt-2
                  max-w-[100ch]
                  text-md
                  font-normal
                  leading-relaxed
                  text-slate-600
                "
              >
                You will have a chance to review the study information before
                deciding whether you consent to participate. Your participation
                is completely voluntary, and you can stop at any time without
                penalty.
              </p>

              {/* Timing */}
              <motion.div
                initial={{
                  opacity: 0,
                  y: 10,
                }}
                whileInView={{
                  opacity: 1,
                  y: 0,
                }}
                viewport={{
                  once: false,
                }}
                transition={{
                  duration: 0.6,
                  delay: 0.18,
                  ease: easeOut,
                }}
                className="
                  mt-5
                  flex
                  flex-col
                  gap-2
                  border-t
                  border-slate-100
                  pt-4
                  sm:flex-row
                  sm:items-center
                  sm:gap-8
                "
              >
                <p className="text-sm text-slate-600">
                  <span className="font-medium text-[#173B7A]">
                    Pre-Survey:
                  </span>{" "}
                  only a few minutes
                </p>

                <p className="text-sm text-slate-600">
                  <span className="font-medium text-[#173B7A]">
                    Diabetes Distress Survey:
                  </span>{" "}
                  only a few minutes
                </p>
              </motion.div>
            </div>
          </motion.div>
        </div>
      </motion.section>
    </>
  )
}