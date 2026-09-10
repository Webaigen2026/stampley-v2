import Link from "next/link"
import {
  ArrowRight,
  ClipboardCheck,
  Info,
  ListChecks,
  MessageCircleHeart,
  Target,
} from "lucide-react"

const STEPS = [
  {
    number: "01",
    title: "Pre-Survey",
    description:
      "Review the study information, provide your participation choice, and answer some questions about yourself and your experience with diabetes.",
    icon: ClipboardCheck,
    iconClass: "bg-[#eef6ff] text-[#173B7A]",
  },
  {
    number: "02",
    title: "Diabetes Distress Survey",
    description:
      "Complete a short questionnaire about areas of diabetes management that may be causing stress or concern.",
    icon: ListChecks,
    iconClass: "bg-[#ecf8f1] text-[#173B7A]",
  },
  {
    number: "03",
    title: "Choose Your Support Focus",
    description:
      "Review your results and confirm the area you would like to focus on during your study participation.",
    icon: Target,
    iconClass: "bg-[#f3eeff] text-[#173B7A]",
  },
  {
    number: "04",
    title: "First Check-In",
    description:
      "Complete your first check-in and begin your conversation with Stampley.",
    icon: MessageCircleHeart,
    iconClass: "bg-[#fff6e5] text-[#173B7A]",
  },
]

export default function GettingStartedView() {
  return (
    <>
      <style>{`
        @keyframes gsFadeUp {
          from { opacity: 0; transform: translateY(16px); }
          to { opacity: 1; transform: translateY(0); }
        }

        .gs-fade {
          animation: gsFadeUp 0.7s cubic-bezier(0.22, 1, 0.36, 1) both;
        }

        .gs-delay-1 { animation-delay: 80ms; }
        .gs-delay-2 { animation-delay: 160ms; }
        .gs-delay-3 { animation-delay: 240ms; }
        .gs-delay-4 { animation-delay: 320ms; }
        .gs-delay-5 { animation-delay: 400ms; }

        @media (prefers-reduced-motion: reduce) {
          .gs-fade {
            animation: none;
          }
        }
      `}</style>

      <section className="gs-fade">
        <div className="grid items-center gap-12 lg:grid-cols-[minmax(0,1.05fr)_minmax(280px,0.75fr)] lg:gap-16">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.35em] text-cyan-700">
              Getting started
            </p>

            <h1 className="mt-5 max-w-[12ch] text-4xl font-light tracking-tight text-slate-950 md:text-5xl lg:text-6xl">
              Before you begin.
            </h1>

            <p className="mt-6 max-w-[42ch] text-lg leading-relaxed text-slate-600">
              Your first visit includes a few short steps to help us understand
              your experience and personalize your study participation.
            </p>
          </div>

          <div
            aria-hidden="true"
            className="relative mx-auto hidden h-[280px] w-full max-w-[360px] lg:block"
          >
            <div className="absolute left-[18%] top-[12%] h-[220px] w-[220px] rounded-full bg-[#eef6ff]" />
            <div className="absolute bottom-[18%] right-[10%] h-[92px] w-[92px] rounded-full bg-[#f2b134]/35" />
            <div className="absolute right-[28%] top-[8%] h-[18px] w-[18px] rounded-full bg-[#1473E6]/25" />
          </div>
        </div>
      </section>

      <section className="gs-fade gs-delay-1 mt-16 lg:mt-20">
        <div className="relative">
          <div
            aria-hidden="true"
            className="
              pointer-events-none
              absolute
              top-[28px]
              right-[8%]
              left-[8%]
              hidden
              h-px
              bg-[#d7e4f4]
              lg:block
            "
          />

          <ol className="relative grid list-none gap-10 sm:grid-cols-2 lg:grid-cols-4 lg:gap-8">
          {STEPS.map((step, index) => {
            const Icon = step.icon

            return (
              <li
                key={step.number}
                className={`gs-fade gs-delay-${index + 2} relative`}
              >
                <div
                  className={`
                    relative
                    z-10
                    mb-5
                    flex
                    h-14
                    w-14
                    items-center
                    justify-center
                    rounded-full
                    ${step.iconClass}
                  `}
                >
                  <Icon
                    aria-hidden="true"
                    strokeWidth={1.6}
                    className="h-6 w-6"
                  />
                </div>

                <p className="text-xs font-bold tracking-[0.16em] text-[#1473E6]">
                  {step.number}
                </p>
                <h2 className="mt-3 text-xl font-light tracking-tight text-slate-950">
                  {step.title}
                </h2>
                <p className="mt-3 text-sm font-normal leading-relaxed text-slate-600">
                  {step.description}
                </p>
              </li>
            )
          })}
          </ol>
        </div>
      </section>

      <section className="gs-fade gs-delay-5 mt-16">
        <div className="flex gap-4 rounded-[12px] bg-[#eef6ff] px-5 py-6 sm:px-7 sm:py-7">
          <Info
            aria-hidden="true"
            strokeWidth={1.7}
            className="mt-0.5 h-5 w-5 shrink-0 text-[#1473E6]"
          />
          <div>
            <h2 className="text-base font-medium text-slate-950">
              Before you continue
            </h2>
            <p className="mt-2 text-sm font-normal leading-relaxed text-slate-600">
              You will have a chance to review the study information before
              deciding whether you consent to participate. Your participation is
              completely voluntary, and you can stop at any time without
              penalty.
            </p>
          </div>
        </div>
      </section>

      <section className="gs-fade gs-delay-5 mt-10 flex flex-col items-start gap-4 sm:items-center sm:text-center">
        <Link
          href="/survey/pre-survey"
          className="
            group
            inline-flex
            h-[56px]
            w-full
            items-center
            justify-between
            gap-6
            rounded-[10px]
            bg-[#173B7A]
            px-6
            text-sm
            font-normal
            text-white
            transition-all
            duration-200
            hover:bg-[#122E60]
            focus-visible:outline-2
            focus-visible:outline-offset-2
            focus-visible:outline-[#173B7A]
            active:scale-[0.995]
            sm:w-auto
            sm:min-w-[280px]
          "
        >
          <span>Begin pre-survey</span>
          <span
            className="
              flex
              h-8
              w-8
              items-center
              justify-center
              rounded-full
              border
              border-white/70
              transition-transform
              duration-200
              group-hover:translate-x-0.5
            "
          >
            <ArrowRight
              aria-hidden="true"
              strokeWidth={1.8}
              className="h-[15px] w-[15px]"
            />
          </span>
        </Link>

        <p className="text-sm text-slate-500">
          Thank you for being part of the AIDES-T2D research study.
        </p>
      </section>
    </>
  )
}
