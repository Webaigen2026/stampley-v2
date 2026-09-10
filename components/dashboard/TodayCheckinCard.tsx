import Link from "next/link"

import { ArrowRight, Check } from "lucide-react"

type Props = {
  checkedInToday: boolean
  studyComplete: boolean
  postSurveyCompleted: boolean
}

export default function TodayCheckinCard({
  checkedInToday,
  studyComplete,
  postSurveyCompleted,
}: Props) {
  return (
    <section
      className="
        relative
        overflow-hidden
        rounded-[22px]
        bg-[#0b4178]
        text-white
      "
    >
      <style>{`
        @keyframes checkinIllustrationFloat {
          0%,
          100% {
            transform: translate3d(0, 0, 0) rotate(0deg);
          }

          50% {
            transform: translate3d(0, -8px, 0) rotate(1deg);
          }
        }

        @keyframes checkinIllustrationGlow {
          0%,
          100% {
            opacity: 0.16;
            transform: scale(0.96);
          }

          50% {
            opacity: 0.3;
            transform: scale(1.05);
          }
        }

        .checkin-illustration {
          animation: checkinIllustrationFloat 5.5s ease-in-out infinite;
          will-change: transform;
        }

        .checkin-illustration-glow {
          animation: checkinIllustrationGlow 5.5s ease-in-out infinite;
          will-change: transform, opacity;
        }

        @media (prefers-reduced-motion: reduce) {
          .checkin-illustration,
          .checkin-illustration-glow {
            animation: none;
          }
        }
      `}</style>

      <div
        className="
          grid
          min-h-[220px]
          items-center
          gap-6
          px-7
          py-8
          md:px-9
          lg:grid-cols-[minmax(0,1fr)_300px]
          lg:gap-10
        "
      >
        {/* =====================================================
            CONTENT
        ====================================================== */}
        <div className="relative z-10">
          <p
            className="
              text-xs
              font-bold
              uppercase
              tracking-[0.35em]
              text-white/60
            "
          >
            Today&apos;s Check-In
          </p>

          <h2
            className="
              mt-3
              text-3xl
              font-light
              tracking-tight
              text-white
            "
          >
            {studyComplete
              ? "Your study check-ins are complete."
              : checkedInToday
                ? "You’re all set for today."
                : "Your check-in is ready."}
          </h2>

          <p
            className="
              mt-4
              max-w-[600px]
              text-base
              font-normal
              leading-relaxed
              text-white/70
            "
          >
            {studyComplete
              ? "Thank you for completing all 20 study check-ins."
              : checkedInToday
                ? "Today’s check-in has been saved. Come back tomorrow for your next session."
                : "Take a few minutes to complete today’s study session."}
          </p>

          {/* Action */}
          <div className="mt-7">
  {studyComplete ? (
    postSurveyCompleted ? (
      /* Completed state */
      <div
        className="
          inline-flex
          h-[50px]
          items-center
          gap-3
          rounded-[10px]
          border
          border-white/20
          bg-white/[0.08]
          px-5
          text-sm
          font-normal
          tracking-[0.01em]
          text-white
          backdrop-blur-sm
        "
      >
        <span
          className="
            flex
            h-6
            w-6
            items-center
            justify-center
            rounded-full
            bg-white
            text-[#0b4178]
          "
        >
          <Check size={13} strokeWidth={2} />
        </span>

        Study complete
      </div>
    ) : (
      /* Post-survey CTA */
      <Link
        href="/survey/post-survey"
        className="
          group
          inline-flex
          h-[52px]
          items-center
          gap-6
          rounded-[10px]
          bg-white
          pl-6
          pr-2
          text-sm
          font-normal
          tracking-[-0.01em]
          text-[#0b4178]
          shadow-[0_8px_24px_rgba(0,0,0,0.12)]
          transition-all
          duration-300
          ease-out
          hover:-translate-y-[1px]
          hover:shadow-[0_12px_30px_rgba(0,0,0,0.18)]
          focus-visible:outline-none
          focus-visible:ring-2
          focus-visible:ring-white
          focus-visible:ring-offset-2
          focus-visible:ring-offset-[#0b4178]
          active:translate-y-0
        "
      >
        <span>Complete Post-Survey</span>

        <span
          className="
            flex
            h-9
            w-9
            items-center
            justify-center
            rounded-full
            bg-[#0b4178]
            text-white
            transition-all
            duration-300
            group-hover:bg-[#1261a0]
          "
        >
          <ArrowRight
            size={16}
            strokeWidth={1.8}
            className="
              transition-transform
              duration-300
              group-hover:translate-x-[2px]
            "
          />
        </span>
      </Link>
    )
  ) : (
    /* Check-in CTA */
    <Link
      href="/check-in"
      className="
        group
        inline-flex
        h-[52px]
        items-center
        gap-6
        rounded-[10px]
        bg-white
        pl-6
        pr-2
        text-sm
        font-normal
        tracking-[-0.01em]
        text-[#0b4178]
        shadow-[0_8px_24px_rgba(0,0,0,0.12)]
        transition-all
        duration-300
        ease-out
        hover:-translate-y-[1px]
        hover:shadow-[0_12px_30px_rgba(0,0,0,0.18)]
        focus-visible:outline-none
        focus-visible:ring-2
        focus-visible:ring-white
        focus-visible:ring-offset-2
        focus-visible:ring-offset-[#0b4178]
        active:translate-y-0
      "
    >
      <span>
        {checkedInToday
          ? "View Today's Status"
          : "Start Check-In"}
      </span>

      <span
        className="
          flex
          h-9
          w-9
          items-center
          justify-center
          rounded-full
          bg-[#0b4178]
          text-white
          transition-all
          duration-300
          group-hover:bg-[#1261a0]
        "
      >
        <ArrowRight
          size={16}
          strokeWidth={1.8}
          className="
            transition-transform
            duration-300
            group-hover:translate-x-[2px]
          "
        />
      </span>
    </Link>
  )}
</div>


        </div>

        {/* =====================================================
            ILLUSTRATION
        ====================================================== */}
        <div
          className="
            relative
            hidden
            h-[210px]
            items-center
            justify-center
            lg:flex
          "
        >
          {/* Soft animated glow behind image */}
          <div
            aria-hidden="true"
            className="
              checkin-illustration-glow
              absolute
              h-[160px]
              w-[220px]
              rounded-full
              bg-[#48AEDA]
              blur-[45px]
            "
          />

          <img
            src="/dashboard/bannerlogo.png"
            alt=""
            width={300}
            height={220}
            className="
              checkin-illustration
              relative
              z-10
              block
              h-auto
              w-full
              max-w-[280px]
              object-contain
            "
          />
        </div>
      </div>
    </section>
  )
}