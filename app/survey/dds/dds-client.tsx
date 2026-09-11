"use client"

import {
  useMemo,
  useRef,
  useState,
} from "react"

import Image from "next/image"
import Link from "next/link"
import { useRouter } from "next/navigation"

import {
  ArrowLeft,
  ArrowRight,
  Check,
  HeartHandshake,
  Info,
  Menu,
  X,
} from "lucide-react"

import {
  motion,
  useReducedMotion,
  type Variants,
} from "framer-motion"

import { submitDDS } from "@/actions/dds"

/* =========================================================
   DATA
========================================================= */

const QUESTIONS = [
  {
    id: "q1",
    text: "Feeling that diabetes is taking up too much of my mental and physical energy every day.",
    domain: "Emotional",
  },
  {
    id: "q2",
    text: "Feeling that my doctor doesn't know enough about diabetes and diabetes care.",
    domain: "Physician",
  },
  {
    id: "q3",
    text: "Feeling angry, scared, and/or depressed when I think about living with diabetes.",
    domain: "Emotional",
  },
  {
    id: "q4",
    text: "Feeling that my doctor doesn't give me clear enough directions on how to manage my diabetes.",
    domain: "Physician",
  },
  {
    id: "q5",
    text: "Feeling that I am not testing my blood sugars frequently enough.",
    domain: "Regimen",
  },
  {
    id: "q6",
    text: "Feeling that I am often failing with my diabetes routine.",
    domain: "Regimen",
  },
  {
    id: "q7",
    text: "Feeling that friends or family are not supportive enough of my self-care efforts.",
    domain: "Interpersonal",
  },
  {
    id: "q8",
    text: "Feeling that diabetes controls my life.",
    domain: "Emotional",
  },
  {
    id: "q9",
    text: "Feeling that my doctor doesn't take my concerns seriously enough.",
    domain: "Physician",
  },
  {
    id: "q10",
    text: "Not feeling confident in my day-to-day ability to manage diabetes.",
    domain: "Regimen",
  },
  {
    id: "q11",
    text: "Feeling that I will end up with serious long-term complications, no matter what I do.",
    domain: "Emotional",
  },
  {
    id: "q12",
    text: "Feeling that I am not sticking closely enough to a good meal plan.",
    domain: "Regimen",
  },
  {
    id: "q13",
    text: "Feeling that friends or family don't appreciate how difficult living with diabetes can be.",
    domain: "Interpersonal",
  },
  {
    id: "q14",
    text: "Feeling overwhelmed by the demands of living with diabetes.",
    domain: "Emotional",
  },
  {
    id: "q15",
    text: "Feeling that I don't have a doctor who I can see regularly enough about my diabetes.",
    domain: "Physician",
  },
  {
    id: "q16",
    text: "Not feeling motivated to keep up my diabetes self-management.",
    domain: "Regimen",
  },
  {
    id: "q17",
    text: "Feeling that friends or family don't give me the emotional support that I would like.",
    domain: "Interpersonal",
  },
] as const

const SCALE = [
  {
    value: 1,
    label: "Not a Problem",
  },
  {
    value: 2,
    label: "Slight Problem",
  },
  {
    value: 3,
    label: "Moderate Problem",
  },
  {
    value: 4,
    label: "Somewhat Serious Problem",
  },
  {
    value: 5,
    label: "Serious Problem",
  },
  {
    value: 6,
    label: "Very Serious Problem",
  },
] as const

const DOMAIN_ORDER = [
  "Emotional",
  "Physician",
  "Regimen",
  "Interpersonal",
] as const

const DOMAIN_LABELS: Record<string, string> = {
  Emotional: "Emotional Burden",
  Physician: "Physician-related",
  Regimen: "Regimen-related",
  Interpersonal: "Interpersonal",
}

const DOMAIN_DESCRIPTIONS: Record<string, string> = {
  Emotional:
    "Questions about overwhelm, fear, burnout, and the emotional burden of living with diabetes.",

  Physician:
    "Questions about communication, clarity, support, and confidence in your healthcare team.",

  Regimen:
    "Questions about routines, meal planning, blood sugar testing, medication, and daily self-management.",

  Interpersonal:
    "Questions about support, understanding, and emotional help from family, friends, and people around you.",
}

/* =========================================================
   MOTION
========================================================= */

const easeOut = [0.22, 1, 0.36, 1] as const

const fadeUp: Variants = {
  hidden: {
    opacity: 0,
    y: 24,
    filter: "blur(3px)",
  },

  visible: {
    opacity: 1,
    y: 0,
    filter: "blur(0px)",
    transition: {
      duration: 0.65,
      ease: easeOut,
    },
  },
}

const stagger: Variants = {
  hidden: {},

  visible: {
    transition: {
      staggerChildren: 0.08,
      delayChildren: 0.03,
    },
  },
}

/* =========================================================
   TYPES
========================================================= */

type GroupedSection = {
  domain: string
  questions: (typeof QUESTIONS)[number][]
}

/* =========================================================
   DDS CLIENT
========================================================= */

export default function DDSClient() {
  const router = useRouter()
  const reduceMotion = useReducedMotion()

  const [answers, setAnswers] = useState<Record<string, number>>({})
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [currentDomainIndex, setCurrentDomainIndex] = useState(0)
  const [showMobileProgress, setShowMobileProgress] = useState(false)

  const questionRefs = useRef<
    Record<string, HTMLTableRowElement | null>
  >({})

  /* =======================================================
     DERIVED STATE
  ======================================================== */

  const totalAnswered = Object.keys(answers).length

  const progress = Math.round((totalAnswered / 17) * 100)

  const allAnswered = totalAnswered === 17

  const remaining = 17 - totalAnswered

  const groupedQuestions = useMemo(() => {
    return DOMAIN_ORDER.map((domain) => ({
      domain,
      questions: QUESTIONS.filter(
        (question) => question.domain === domain
      ),
    }))
  }, [])

  const currentSection =
    groupedQuestions[currentDomainIndex]

  const currentDomain =
    currentSection.domain

  const currentQuestions =
    currentSection.questions

  const currentDomainDescription =
    DOMAIN_DESCRIPTIONS[currentDomain]

  const currentSectionAnswered =
    currentQuestions.filter(
      (question) =>
        answers[question.id] != null
    ).length

  const currentSectionComplete =
    currentSectionAnswered === currentQuestions.length

  const isLastSection =
    currentDomainIndex === groupedQuestions.length - 1

  const globalQuestionNumberStart =
    groupedQuestions
      .slice(0, currentDomainIndex)
      .reduce(
        (sum, section) =>
          sum + section.questions.length,
        0
      )

  /* =======================================================
     ANSWER HANDLER
  ======================================================== */

  function handleAnswer(
    questionId: string,
    value: number
  ) {
    setAnswers((previous) => ({
      ...previous,
      [questionId]: value,
    }))

    if (error) {
      setError("")
    }
  }

  /* =======================================================
     NEXT SECTION
  ======================================================== */

  function handleNextSection() {
    const firstUnanswered =
      currentQuestions.find(
        (question) =>
          answers[question.id] == null
      )

    if (firstUnanswered) {
      setError(
        `Please answer all ${DOMAIN_LABELS[currentDomain]} questions before continuing.`
      )

      questionRefs.current[
        firstUnanswered.id
      ]?.scrollIntoView({
        behavior: "smooth",
        block: "center",
      })

      return
    }

    setError("")

    if (!isLastSection) {
      setCurrentDomainIndex(
        (previous) => previous + 1
      )

      window.scrollTo({
        top: 0,
        behavior: "smooth",
      })
    }
  }

  /* =======================================================
     PREVIOUS SECTION
  ======================================================== */

  function handlePreviousSection() {
    setError("")

    if (currentDomainIndex > 0) {
      setCurrentDomainIndex(
        (previous) => previous - 1
      )

      window.scrollTo({
        top: 0,
        behavior: "smooth",
      })
    }
  }

  /* =======================================================
     SUBMIT
  ======================================================== */

  async function handleSubmit() {
    if (loading) {
      return
    }

    if (!allAnswered) {
      const firstUnansweredDomainIndex =
        groupedQuestions.findIndex(
          (section) =>
            section.questions.some(
              (question) =>
                answers[question.id] == null
            )
        )

      if (
        firstUnansweredDomainIndex !== -1
      ) {
        setCurrentDomainIndex(
          firstUnansweredDomainIndex
        )

        const firstUnanswered =
          groupedQuestions[
            firstUnansweredDomainIndex
          ].questions.find(
            (question) =>
              answers[question.id] == null
          )

        setError(
          "Please answer all 17 questions before continuing."
        )

        setTimeout(() => {
          if (firstUnanswered) {
            questionRefs.current[
              firstUnanswered.id
            ]?.scrollIntoView({
              behavior: "smooth",
              block: "center",
            })
          }
        }, 50)
      }

      return
    }

    setLoading(true)
    setError("")

    const formData = new FormData()

    Object.entries(answers).forEach(
      ([key, value]) => {
        formData.append(
          key,
          value.toString()
        )
      }
    )

    const result =
      await submitDDS(formData)

    if (result?.error) {
      setError(result.error)
      setLoading(false)
      return
    }

    router.push("/survey/dds/results")
  }

  return (
    <main
      className="
        min-h-dvh
        bg-white
        font-['Outfit',system-ui,sans-serif]
        text-slate-950
      "
    >
      {/* =====================================================
          FIXED SIDEBAR
      ====================================================== */}

<aside
  className="
    fixed
    inset-y-0
    left-0
    z-40
    hidden
    w-[340px]
    overflow-hidden
    border-r
    border-slate-100
    bg-white
    lg:block
  "
>
  {/* =====================================================
      SCROLLABLE SIDEBAR CONTENT
  ====================================================== */}
  <div
    className="
      relative
      z-20
      h-full
      overflow-y-auto
      px-8
      pb-[290px]
      pt-8
    "
  >
    <DDSProgressContent
      groupedQuestions={groupedQuestions}
      currentDomainIndex={currentDomainIndex}
      answers={answers}
      totalAnswered={totalAnswered}
      progress={progress}
    />
  </div>

  {/* =====================================================
      NURSE ILLUSTRATION
  ====================================================== */}
  <div
    aria-hidden="true"
    className="
      pointer-events-none
    flex
    justify-center
      bottom-0
    
      z-10
      h-[285px]
      w-full
      overflow-hidden
    "
  >
    {/* Soft background circle */}
    <div
      className="
        absolute
        -bottom-[40px]
        
        h-[300px]
        w-[300px]
        rounded-full
        bg-[radial-gradient(circle_at_center,#eef7ff_0%,#f7fbff_62%,transparent_100%)]
      "
    />

    {/* Secondary ring */}
    <div
      className="
        absolute
        bottom-[18px]
        
        h-[180px]
        w-[180px]
        rounded-full
        border
        border-[#d8e9f8]
        opacity-70
      "
    />

  
<img
  src="/dashboard/nurse2.png"
  alt=""
  width={220}
  height={260}
  className="
    absolute
    bottom-0
   
    z-10
    h-[200px]
    w-auto
    max-w-none
    object-contain
    object-bottom
  "
/>
  </div>
  <p className="text-center text-sm text-slate-500 ">
    This survey is designed to help you identify your support needs and provide you with the resources you need to manage your diabetes.
  </p>
</aside>

      {/* =====================================================
          MAIN
      ====================================================== */}

      <div className="min-w-0 lg:pl-[340px]">
        {/* ===================================================
            HEADER
        ==================================================== */}

        <header
          className="
            sticky
            top-0
            z-50
            bg-white/92
            backdrop-blur-xl
            shadow-[0_1px_0_rgba(15,45,80,0.06),0_8px_24px_rgba(15,45,80,0.035)]
          "
        >
          <div
            className="
              mx-auto
              flex
              h-[72px]
              w-full
              max-w-[1400px]
              items-center
              justify-between
              px-5
              sm:px-8
              lg:px-10
            "
          >
            <Link
              href="/"
              className="
                group
                inline-flex
                items-center
                rounded-[10px]
                focus-visible:outline-2
                focus-visible:outline-offset-4
                focus-visible:outline-[#1473E6]
              "
            >
              <Image
                src="/images/stampleyLogo.png"
                alt="AIDES-T2D"
                width={156}
                height={52}
                priority
                className="
                  h-auto
                  w-[40px]
                  object-contain
                  transition-opacity
                  duration-200
                  group-hover:opacity-90
                "
              />
            </Link>

            <div
              className="
                hidden
                items-center
                gap-2.5
               
                px-4
                py-2
                 sm:flex
              "
            >
              <span
                className="
                  h-1.5
                  w-1.5
                
                "
              />

<span
                className="
                  text-[24px]
                  font-bold
              
                "
                style={{
                  fontFamily: `'Playfair Display', 'Cinzel', 'Dancing Script', 'Caveat', 'Great Vibes', cursive, serif, system-ui, sans-serif`,
                  letterSpacing: '0.01em',
                }}
              >
                DDS-17 Survey
              </span>
            </div>
          </div>
        </header>

        {/* ===================================================
            SOFT BACKGROUND
        ==================================================== */}

        <div
          className="
            relative
            isolate
            min-h-[calc(100dvh-72px)]
            overflow-hidden
          "
        >
          <div
            aria-hidden="true"
            className="
              pointer-events-none
              fixed
              inset-0
              -z-10
              overflow-hidden
              bg-white
            "
          >
            <div
              className="
                absolute
                -left-[160px]
                top-[120px]
                h-[600px]
                w-[600px]
                rounded-full
                bg-[#EAF4FF]/55
                blur-[130px]
              "
            />

            <div
              className="
                absolute
                left-[44%]
                top-[480px]
                h-[520px]
                w-[520px]
                rounded-full
                bg-[#F1F7FF]/55
                blur-[150px]
              "
            />

            <div
              className="
                absolute
                -right-[200px]
                top-[840px]
                h-[680px]
                w-[680px]
                rounded-full
                bg-[#E8F3FF]/45
                blur-[150px]
              "
            />
          </div>

          {/* =================================================
              MOBILE PROGRESS
          ================================================== */}

          <div
            className="
              px-5
              pt-5
              sm:px-8
              lg:hidden
            "
          >
            <button
              type="button"
              onClick={() =>
                setShowMobileProgress(
                  (previous) =>
                    !previous
                )
              }
              aria-expanded={
                showMobileProgress
              }
              className="
                flex
                w-full
                items-center
                justify-between
                rounded-[14px]
                bg-white
                px-5
                py-4
                text-left
                shadow-[0_8px_28px_rgba(15,45,80,0.08)]
              "
            >
              <div>
                <p
                  className="
                    text-sm
                    font-medium
                    text-[#173B7A]
                  "
                >
                  DDS-17 Progress
                </p>

                <p
                  className="
                    mt-1
                    text-xs
                    text-slate-500
                  "
                >
                  {totalAnswered} of 17 answered
                </p>
              </div>

              <span
                className="
                  flex
                  h-9
                  w-9
                  items-center
                  justify-center
                  rounded-full
                  bg-[#F2F7FD]
                  text-[#173B7A]
                "
              >
                {showMobileProgress ? (
                  <X
                    size={17}
                    strokeWidth={1.8}
                  />
                ) : (
                  <Menu
                    size={17}
                    strokeWidth={1.8}
                  />
                )}
              </span>
            </button>

            {showMobileProgress ? (
              <motion.div
                initial={{
                  opacity: 0,
                  y: -10,
                }}
                animate={{
                  opacity: 1,
                  y: 0,
                }}
                className="
                  mt-3
                  rounded-[16px]
                  bg-white
                  p-5
                  shadow-[0_10px_32px_rgba(15,45,80,0.08)]
                "
              >
                <DDSProgressContent
                  groupedQuestions={
                    groupedQuestions
                  }
                  currentDomainIndex={
                    currentDomainIndex
                  }
                  answers={answers}
                  totalAnswered={
                    totalAnswered
                  }
                  progress={progress}
                />
              </motion.div>
            ) : null}
          </div>

          {/* =================================================
              CONTENT
          ================================================== */}

          <motion.div
            key={currentDomainIndex}
            initial="hidden"
            animate="visible"
            variants={stagger}
            className="
              mx-auto
              w-full
              max-w-[1180px]
              px-5
              pb-16
              pt-8
              sm:px-8
              sm:pt-10
              lg:px-10
              lg:pt-14
            "
          >
           

            {/* ===============================================
                DOMAIN INTRO
            ================================================ */}

            <motion.div
              variants={fadeUp}
              className="
               
                
                
              
                px-6
                py-5
         
              "
            >
              <h1
                    className="
                   
                      text-3xl
                      font-light
                      tracking-[-0.04em]
                      text-slate-950
                      sm:text-4xl
                      lg:text-[42px]
                    "
                  >
                {DOMAIN_LABELS[currentDomain]}
              </h1>

              <p
                    className="
                      mt-5
                      max-w-full
                      text-lg
                      font-normal
                      leading-relaxed
                      text-slate-600
                    "
                  >
                {currentDomainDescription}
              </p>

              
            </motion.div>

            {/* ===============================================
                MATRIX
            ================================================ */}

            <motion.div
              variants={fadeUp}
            >
              <DDSQuestionMatrix
                currentQuestions={
                  currentQuestions
                }
                answers={answers}
                error={error}
                globalQuestionNumberStart={
                  globalQuestionNumberStart
                }
                onAnswer={handleAnswer}
                questionRefs={
                  questionRefs
                }
              />
            </motion.div>

            {/* ===============================================
                ERROR
            ================================================ */}

            {error ? (
              <motion.div
                initial={{
                  opacity: 0,
                  y: 8,
                }}
                animate={{
                  opacity: 1,
                  y: 0,
                }}
                role="alert"
                className="
                  mt-6
                  rounded-[12px]
                  bg-red-50
                  px-5
                  py-4
                  text-sm
                  font-medium
                  text-red-700
                  shadow-[inset_4px_0_0_rgba(185,28,28,0.72)]
                "
              >
                {error}
              </motion.div>
            ) : null}

            {/* ===============================================
                NAVIGATION
            ================================================ */}
{/* ===============================================
    NAVIGATION
================================================ */}

<motion.div
  variants={fadeUp}
  className="
    mt-10
    flex
    flex-col
    gap-4
    border-t
    border-slate-100
    pt-7
    sm:flex-row
    sm:items-center
    sm:justify-between
  "
>
  {/* =============================================
      BACK
  ============================================== */}

  <button
    type="button"
    onClick={handlePreviousSection}
    disabled={
      currentDomainIndex === 0 ||
      loading
    }
    className="
      group
      inline-flex
      h-11
      items-center
      justify-center
      gap-2
      rounded-[10px]
      bg-white
      px-5
      text-sm
      font-medium
      text-slate-600
      shadow-[0_4px_14px_rgba(15,45,80,0.06),inset_0_0_0_1px_rgba(203,213,225,0.75)]
      transition-all
      duration-200

      hover:bg-slate-50
      hover:text-[#173B7A]
      hover:shadow-[0_6px_18px_rgba(15,45,80,0.08),inset_0_0_0_1px_rgba(148,163,184,0.85)]

      focus-visible:outline-none
      focus-visible:ring-2
      focus-visible:ring-[#1473E6]
      focus-visible:ring-offset-2

      disabled:cursor-not-allowed
      disabled:opacity-40
    "
  >
    <ArrowLeft
      aria-hidden="true"
      size={16}
      strokeWidth={1.8}
      className="
        transition-transform
        duration-200
        group-hover:-translate-x-0.5
      "
    />

    Back
  </button>

  {/* =============================================
      CONTINUE / SUBMIT
  ============================================== */}

  {!isLastSection ? (
    <button
      type="button"
      onClick={handleNextSection}
      disabled={loading}
      className="
        group
        inline-flex
        h-11
        items-center
        justify-center
        gap-2
        rounded-[10px]
        bg-[#173B7A]
        px-6
        text-sm
        font-medium
        text-white
        shadow-[0_6px_18px_rgba(23,59,122,0.16)]
        transition-all
        duration-200

        hover:bg-[#123568]
        hover:shadow-[0_8px_22px_rgba(23,59,122,0.20)]

        focus-visible:outline-none
        focus-visible:ring-2
        focus-visible:ring-[#1473E6]
        focus-visible:ring-offset-2

        disabled:cursor-not-allowed
        disabled:opacity-55
      "
    >
      <span>
        {currentSectionComplete
          ? "Continue"
          : `Continue (${
              currentQuestions.length -
              currentSectionAnswered
            } remaining)`}
      </span>

      <ArrowRight
        aria-hidden="true"
        size={16}
        strokeWidth={1.8}
        className="
          transition-transform
          duration-200
          group-hover:translate-x-0.5
        "
      />
    </button>
  ) : (
    <button
      type="button"
      onClick={handleSubmit}
      disabled={
        loading ||
        !allAnswered
      }
      className="
        group
        inline-flex
        h-11
        items-center
        justify-center
        gap-2
        rounded-[10px]
        bg-[#173B7A]
        px-6
        text-sm
        font-medium
        text-white
        shadow-[0_6px_18px_rgba(23,59,122,0.16)]
        transition-all
        duration-200

        hover:bg-[#123568]
        hover:shadow-[0_8px_22px_rgba(23,59,122,0.20)]

        focus-visible:outline-none
        focus-visible:ring-2
        focus-visible:ring-[#1473E6]
        focus-visible:ring-offset-2

        disabled:cursor-not-allowed
        disabled:bg-slate-300
        disabled:text-white
        disabled:shadow-none
      "
    >
      <span>
        {loading
          ? "Calculating your results..."
          : allAnswered
            ? "See My Results"
            : `Answer all questions (${remaining} remaining)`}
      </span>

      {!loading &&
      allAnswered ? (
        <ArrowRight
          aria-hidden="true"
          size={16}
          strokeWidth={1.8}
          className="
            transition-transform
            duration-200
            group-hover:translate-x-0.5
          "
        />
      ) : null}
    </button>
  )}
</motion.div>



          </motion.div>
        </div>
      </div>
    </main>
  )
}

/* =========================================================
   QUESTION MATRIX
========================================================= */

function DDSQuestionMatrix({
  currentQuestions,
  answers,
  error,
  globalQuestionNumberStart,
  onAnswer,
  questionRefs,
}: {
  currentQuestions: (typeof QUESTIONS)[number][]
  answers: Record<string, number>
  error: string
  globalQuestionNumberStart: number
  onAnswer: (
    questionId: string,
    value: number
  ) => void
  questionRefs: React.MutableRefObject<
    Record<string, HTMLTableRowElement | null>
  >
}) {
  return (
    <div
      className="
        mt-8
        overflow-hidden
        rounded-[18px]
        bg-white
        shadow-[0_12px_36px_rgba(15,45,80,0.08)]
      "
    >
      <div className="overflow-x-auto">
        <table
          className="
            w-full
            min-w-[940px]
            border-collapse
          "
        >
          <thead>
            <tr
              className="
                bg-[#F7FAFD]
                shadow-[inset_0_-1px_0_rgba(226,232,240,0.9)]
              "
            >
              <th
                className="
                  w-[64px]
                  px-4
                  py-5
                  text-center
                  text-[11px]
                  font-semibold
                  uppercase
                  tracking-[0.14em]
                  text-slate-500
                "
              >
                #
              </th>

              <th
                className="
                  w-[43%]
                  min-w-[340px]
                  px-5
                  py-5
                  text-left
                  text-[11px]
                  font-semibold
                  uppercase
                  tracking-[0.14em]
                  text-slate-500
                "
              >
                Statement
              </th>

              {SCALE.map(
                (option) => (
                  <th
                    key={
                      option.value
                    }
                    className="
                      min-w-[105px]
                      px-2
                      py-5
                      text-center
                      align-top
                    "
                  >
                    <span
                      className="
                        block
                        text-sm
                        font-semibold
                        text-slate-900
                      "
                    >
                      {option.value}
                    </span>

                    <span
                      className="
                        mx-auto
                        mt-2
                        block
                        max-w-[88px]
                        text-[10px]
                        font-normal
                        leading-[1.35]
                        text-slate-400
                      "
                    >
                      {option.label}
                    </span>
                  </th>
                )
              )}
            </tr>
          </thead>

          <tbody>
            {currentQuestions.map(
              (
                question,
                index
              ) => {
                const selectedValue =
                  answers[
                    question.id
                  ]

                const unansweredError =
                  !!error &&
                  selectedValue == null

                const questionNumber =
                  globalQuestionNumberStart +
                  index +
                  1

                return (
                  <tr
                    key={
                      question.id
                    }
                    ref={(
                      element
                    ) => {
                      questionRefs.current[
                        question.id
                      ] = element
                    }}
                    className={`
                      transition-colors
                      duration-200

                      ${
                        unansweredError
                          ? "bg-red-50/60"
                          : "bg-white hover:bg-[#FBFDFF]"
                      }

                      [&:not(:last-child)]:shadow-[inset_0_-1px_0_rgba(226,232,240,0.75)]
                    `}
                  >
                    {/* ===================================
                        QUESTION NUMBER
                    ==================================== */}

                    <td
                      className="
                        px-4
                        py-5
                        text-center
                        align-middle
                      "
                    >
                      <span
                        className="
                          inline-flex
                          h-8
                          min-w-8
                          items-center
                          justify-center
                          rounded-[9px]
                         
                          px-2
                          text-[11px]
                          font-semibold
                          text-[#173B7A]
                        "
                      >
                        Q{questionNumber}
                      </span>
                    </td>

                    {/* ===================================
                        QUESTION
                    ==================================== */}

                    <td
                      className="
                        px-5
                        py-5
                        align-middle
                      "
                    >
                      <p
                        className="
                          max-w-[500px]
                          text-[16px]
                          font-medium
                          leading-6
                          text-slate-800
                        "
                      >
                        {question.text}
                        
                      </p>
                    </td>

                    {/* ===================================
                        SCALE OPTIONS
                    ==================================== */}

                    {SCALE.map(
                      (option) => {
                        const selected =
                          selectedValue ===
                          option.value

                        const inputId =
                          `${question.id}-${option.value}`

                        return (
                          <td
                            key={
                              option.value
                            }
                            className={`
                              px-2
                              py-5
                              text-center
                              align-middle
                              transition-colors
                              duration-200

                              ${
                                selected
                                  ? "bg-[#F1F7FF]"
                                  : ""
                              }
                            `}
                          >
                            <label
                              htmlFor={
                                inputId
                              }
                              className="
                                group
                                inline-flex
                                cursor-pointer
                                items-center
                                justify-center
                                rounded-full
                                p-2
                                focus-within:ring-2
                                focus-within:ring-[#1473E6]
                                focus-within:ring-offset-2
                              "
                            >
                              <input
                                id={
                                  inputId
                                }
                                type="radio"
                                name={
                                  question.id
                                }
                                value={
                                  option.value
                                }
                                checked={
                                  selected
                                }
                                onChange={() =>
                                  onAnswer(
                                    question.id,
                                    option.value
                                  )
                                }
                                className="sr-only"
                              />

                              <span
                                aria-hidden="true"
                                className={`
                                  flex
                                  h-6
                                  w-6
                                  items-center
                                  justify-center
                                  rounded-full
                                  transition-all
                                  duration-200

                                  ${
                                    selected
                                      ? `
                                        bg-[#1473E6]
                                        shadow-[0_4px_12px_rgba(20,115,230,0.22)]
                                      `
                                      : `
                                        bg-white
                                        shadow-[inset_0_0_0_1.5px_rgba(148,163,184,0.7)]
                                        group-hover:shadow-[inset_0_0_0_1.5px_rgba(20,115,230,0.7)]
                                      `
                                  }
                                `}
                              >
                                {selected ? (
                                  <span
                                    className="
                                      h-2
                                      w-2
                                      rounded-full
                                      bg-white
                                    "
                                  />
                                ) : null}
                              </span>

                              <span className="sr-only">
                                Question{" "}
                                {questionNumber}:{" "}
                                {option.label}, score{" "}
                                {option.value}
                              </span>
                            </label>
                          </td>
                        )
                      }
                    )}
                  </tr>
                )
              }
            )}
          </tbody>
        </table>
      </div>

      {/* =====================================================
          MATRIX INSTRUCTIONS
      ====================================================== */}

      <div
        className="
          flex
          items-start
          gap-3
          bg-[#F4F8FD]
          px-5
          py-4
          sm:px-6
        "
      >
        <div
          className="
            flex
            h-8
            w-8
            shrink-0
            items-center
            justify-center
            rounded-full
            bg-white
            text-[#1473E6]
            shadow-[0_4px_14px_rgba(15,45,80,0.06)]
          "
        >
          <Info
            aria-hidden="true"
            size={16}
            strokeWidth={1.8}
          />
        </div>

        <p
          className="
            pt-0.5
            text-sm
            leading-6
            text-slate-600
          "
        >
          Select one response for each statement using the 1–6 scale.
          Your answers should reflect how much each issue has bothered
          you during the past month.
        </p>
      </div>
    </div>
  )
}

/* =========================================================
   PROGRESS CONTENT
========================================================= */

function DDSProgressContent({
  groupedQuestions,
  currentDomainIndex,
  answers,
  totalAnswered,
  progress,
}: {
  groupedQuestions:
    GroupedSection[]

  currentDomainIndex: number

  answers:
    Record<string, number>

  totalAnswered: number

  progress: number
}) {
  return (
    <>
      <p
        className="
          text-[10px]
          font-bold
          uppercase
          tracking-[0.28em]
          text-slate-400
        "
      >
        DDS-17 Progress
      </p>

      <h2
        className="
          mt-3
          text-xl
          font-light
          tracking-tight
          text-slate-500
        "
      >
        {totalAnswered} of 17 answered
      </h2>

    

      {/* =====================================================
          DOMAINS
      ====================================================== */}

      <div
        className="
          relative
          mt-8
        "
      >
        <div
          aria-hidden="true"
          className="
            absolute
            bottom-6
            left-[19px]
            top-6
            w-px
            bg-slate-200
          "
        />

        <ol
          className="
            relative
            space-y-2
          "
        >
          {groupedQuestions.map(
            (
              section,
              index
            ) => {
              const active =
                currentDomainIndex ===
                index

              const completed =
                currentDomainIndex >
                index

              const answered =
                section.questions.filter(
                  (question) =>
                    answers[
                      question.id
                    ] != null
                ).length

              return (
                <li
                  key={
                    section.domain
                  }
                  className="
                    relative
                    flex
                    items-center
                    gap-4
                    py-2
                  "
                >
                  <div
                    className={`
                      relative
                      z-10
                      flex
                      h-10
                      w-10
                      shrink-0
                      items-center
                      justify-center
                      rounded-full
                      text-base
                      font-semibold
                      transition-all

                      ${
                        active
                          ? `
                            bg-white
                            text-blue-900
                            shadow-[0_7px_20px_rgba(23,59,122,0.20)]
                          `
                          : completed
                            ? `
                              bg-white
                              shadow-sm
                              text-[#173B7A]
                              text-[16px]
                            `
                            : `
                              bg-white
                              text-slate-400
                              shadow-[inset_0_0_0_1px_rgba(203,213,225,0.8)]
                            `
                      }
                    `}
                  >
                    {completed ? (
                      <Check
                        size={16}
                        strokeWidth={2.1}
                      />
                    ) : (
                      index + 1
                    )}
                  </div>

                  <div
                    className={`
                      min-w-0
                      flex-1
                      rounded-[12px]
                      px-4
                      py-3

                      ${
                        active
                          ? "bg-white font-bold text-blue-900"
                          : ""
                      }
                    `}
                  >
                    <p
                      className={`
                        text-sm
                        font-medium

                        ${
                          active
                            ? "text-[#173B7A]"
                            : "text-slate-600"
                        }
                      `}
                    >
                      {
                        DOMAIN_LABELS[
                          section.domain
                        ]
                      }
                    </p>

                    <p
                      className="
                        mt-1
                        text-xs
                        text-slate-400
                      "
                    >
                      {answered} of{" "}
                      {
                        section.questions
                          .length
                      }{" "}
                      answered
                    </p>
                  </div>
                </li>
              )
            }
          )}
        </ol>
      </div>
    </>
  )
}