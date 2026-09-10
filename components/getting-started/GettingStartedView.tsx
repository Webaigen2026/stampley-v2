import Image from "next/image"
import Link from "next/link"

import {
  ArrowRight,
  Info,
} from "lucide-react"

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

export default function GettingStartedView() {
  return (
    <>
      <style>{`
        @keyframes gsFadeUp {
          from {
            opacity: 0;
            transform: translateY(16px);
          }

          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .gs-fade {
          animation: gsFadeUp 0.7s cubic-bezier(0.22, 1, 0.36, 1) both;
        }

        .gs-delay-1 {
          animation-delay: 80ms;
        }

        .gs-delay-2 {
          animation-delay: 160ms;
        }

        .gs-delay-3 {
          animation-delay: 240ms;
        }

        .gs-delay-4 {
          animation-delay: 320ms;
        }

        .gs-delay-5 {
          animation-delay: 400ms;
        }

        @media (prefers-reduced-motion: reduce) {
          .gs-fade {
            animation: none;
          }
        }
      `}</style>

      {/* =====================================================
          HERO — FULL WIDTH
      ====================================================== */}
      <section
        className="
          gs-fade
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
          {/* =================================================
              LEFT CONTENT
          ================================================== */}
          <div
            className="
              relative
              z-20
              py-10
              sm:py-12
              lg:py-16
            "
          >
            <p
              className="
                text-xs
                font-bold
                uppercase
                tracking-[0.35em]
                text-cyan-700
              "
            >
              Getting started
            </p>

            <h1
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
            </h1>

            <p
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
            </p>

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
                text-sm
                font-normal
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
                  duration-200
                  group-hover:translate-x-0.5
                "
              >
                <ArrowRight
                  aria-hidden="true"
                  strokeWidth={1.7}
                  className="h-4 w-4"
                />
              </span>
            </Link>
          </div>

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
            {/* Soft blue accent */}
            <div
              aria-hidden="true"
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

            {/* Main organic image */}
            <div
              className="
                absolute
                bottom-0
                left-[4%]
                top-0
                z-10
                w-[79%]
                overflow-hidden
                rounded-[46%_54%_47%_53%/42%_42%_58%_58%]
              "
            >
              <Image
                src="/pre-survey/womanpresurvey.png"
                alt="Participant preparing to begin the AIDES-T2D study"
                fill
                priority
                sizes="(min-width: 1280px) 48vw, (min-width: 1024px) 52vw, 100vw"
                className="object-cover object-center"
              />
            </div>

            {/* Gold editorial arc */}
            <div
              aria-hidden="true"
              className="
                absolute
                right-[-55px]
                top-[110px]
                h-[270px]
                w-[270px]
                rotate-[9deg]
                rounded-full
                border-[2px]
                border-[#F2B134]
                border-b-transparent
                border-l-transparent
                opacity-90
                xl:h-[300px]
                xl:w-[300px]
              "
            />

            {/* Editorial quote */}
            <div
              className="
                absolute
                right-[0]
                top-[62%]
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

              <div
                aria-hidden="true"
                className="
                  mt-5
                  h-[2px]
                  w-10
                  bg-[#F2B134]
                "
              />
            </div>
          </div>

          {/* =================================================
              MOBILE / TABLET IMAGE
          ================================================== */}
          <div
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
          </div>
        </div>
      </section>

      {/* =====================================================
          STUDY JOURNEY — FULL WIDTH
      ====================================================== */}
      <section
        className="
          gs-fade
          gs-delay-1
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
              bg-[#D7E4F4]
              lg:block
            "
          />

          <ol
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
            {STEPS.map((step, index) => (
              <li
                key={step.number}
                className={`
                  gs-fade
                  gs-delay-${index + 2}
                  relative
                `}
              >
                {/* Step photograph */}
                <div
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
                  "
                >
                  <Image
                    src={step.imageSrc}
                    alt={step.imageAlt}
                    fill
                    sizes="116px"
                    className="object-cover"
                  />
                </div>

                {/* Step number */}
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

                {/* Step title */}
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

                {/* Step description */}
                <p
                  className="
                    mt-3
                    max-w-[31ch]
                    text-sm
                    font-normal
                    leading-[1.65]
                    text-slate-600
                  "
                >
                  {step.description}
                </p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* =====================================================
          BEFORE YOU CONTINUE — FULL WIDTH SECTION
      ====================================================== */}
      <section
        className="
          gs-fade
          gs-delay-5
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
          <div
            className="
              flex
              gap-4
              rounded-[12px]
              bg-[#EEF6FF]
              px-5
              py-6
              sm:px-7
              sm:py-7
            "
          >
            <div
              className="
                flex
                h-9
                w-9
                shrink-0
                items-center
                justify-center
                rounded-full
                bg-white
                text-[#1473E6]
              "
            >
              <Info
                aria-hidden="true"
                strokeWidth={1.7}
                className="h-[18px] w-[18px]"
              />
            </div>

            <div>
              <h2 className="text-base font-medium text-slate-950">
                Before you continue
              </h2>

              <p
                className="
                  mt-2
                  max-w-[100ch]
                  text-sm
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
            </div>
          </div>
        </div>
      </section>
    </>
  )
}