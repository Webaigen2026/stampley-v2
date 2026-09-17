import Image from "next/image"
import Link from "next/link"
import { redirect } from "next/navigation"
import {
  ArrowRight,
} from "lucide-react"

import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

import PreSurveyCelebration from "@/components/pre-survey/PreSurveyCelebration"

export default async function PreSurveyCompletedPage() {
  const session = await auth()

  if (!session?.user?.id) {
    redirect("/login")
  }

  const preSurvey = await prisma.preSurveyResponse.findUnique({
    where: {
      userId: session.user.id,
    },
    select: {
      id: true,
    },
  })

  if (!preSurvey) {
    redirect("/survey/pre-survey")
  }

  const dds = await prisma.ddsResponse.findUnique({
    where: {
      userId: session.user.id,
    },
    select: {
      id: true,
    },
  })

  if (dds) {
    redirect("/survey/dds/results")
  }

  return (
    <main
      className="
        min-h-dvh
        overflow-hidden
        bg-white
        font-['Outfit',system-ui,sans-serif]
        text-slate-950
      "
    >
      {/* =====================================================
          PAGE BACKGROUND
      ====================================================== */}
      <section
        className="
          relative
          isolate
          min-h-dvh
          overflow-hidden
        "
      >
        {/* ===================================================
            TOP BLUE CELEBRATION WAVE
        ==================================================== */}
        <div
          aria-hidden="true"
          className="
            pointer-events-none
            absolute
            inset-x-0
            top-0
            -z-10
            h-[240px]
            overflow-hidden
          "
        >
          {/* Main blue wave */}
          <div
            className="
              absolute
              -left-[6%]
              -top-[120px]
              h-[300px]
              w-[112%]
              rounded-[0_0_50%_50%/0_0_100%_100%]
              bg-blue-900
            "
          />

          {/* Soft center highlight */}
          <div
            className="
              absolute
              left-[28%]
              top-[-70px]
              h-[180px]
              w-[340px]
              rotate-[-8deg]
              rounded-full
              bg-white/40
              blur-[50px]
            "
          />

          {/* Soft right highlight */}
          <div
            className="
              absolute
              right-[12%]
              top-[-35px]
              h-[150px]
              w-[300px]
              rounded-full
              bg-[#DCEEFF]/45
              blur-[45px]
            "
          />
        </div>

        {/* ===================================================
            MAIN CONTENT
        ==================================================== */}
        <div
          className="
            relative
            z-10
            mx-auto
            w-full
            max-w-[900px]
            px-5
            pb-16
            pt-12
            sm:px-8
            sm:pt-14
            lg:px-10
          "
        >
          {/* =================================================
              MEDAL
          ================================================== */}
          <div className="relative mt-15 mb-6 flex justify-center">
            <PreSurveyCelebration />
          </div>

          {/* =================================================
              CONGRATULATIONS
          ================================================== */}
          <div className="mt-4 text-center">
            <h1
              className="
                mt-3
                text-4xl
                font-light
                tracking-[-0.045em]
                text-[#0B2857]
                sm:text-5xl
              "
              style={{
                fontFamily:
                  "'Papyrus', 'Brush Script MT', 'Comic Sans MS', cursive, fantasy, 'Copperplate', 'Lucida Handwriting', 'Dancing Script', 'Great Vibes', sans-serif",
              }}
            >
              You&apos;ve completed the pre-survey.
            </h1>
          </div>

          {/* =================================================
              STEP CARDS + DIRECTION ARROW
          ================================================== */}
          <div
            className="
              relative
              mt-20
              grid
              gap-5
              md:grid-cols-[minmax(0,1fr)_72px_minmax(0,1fr)]
              md:items-stretch
              md:gap-0
            "
          >
            {/* ===============================================
                COMPLETED CARD
            ================================================ */}
            <section
              className="
                relative
                z-10
                bg-white
                p-6
                shadow-[0_8px_26px_rgba(15,45,80,0.07)]
              "
            >
              <div className="flex items-start gap-4">
                <div
                  className="
                    flex
                    h-20
                    w-20
                    shrink-0
                    items-center
                    justify-center
                  "
                >
                  <img
                    src="/dashboard/bannerlogo.png"
                    alt="Banner Logo"
                    className="h-full w-full object-contain"
                  />
                </div>

                <div className="min-w-0">
                  <p
                    className="
                      text-[10px]
                      font-bold
                      uppercase
                      tracking-[0.16em]
                      text-emerald-600
                    "
                  >
                    Completed
                  </p>

                  <h3
                    className="
                      mt-1.5
                      text-xl
                      font-medium
                      text-[#173B7A]
                    "
                  >
                    Pre-Survey
                  </h3>

                  <p
                    className="
                      mt-2
                      text-sm
                      leading-6
                      text-slate-500
                    "
                  >
                    Your background, health, technology, and well-being
                    responses have been recorded.
                  </p>
                </div>
              </div>
            </section>

            {/* ===============================================
                DIRECTION ARROW
            ================================================ */}
            <div
              aria-hidden="true"
              className="
                relative
                z-20
                flex
                h-[54px]
                items-center
                justify-center
                md:h-auto
              "
            >
              {/* Mobile vertical connector */}
              <div
                className="
                  absolute
                  left-1/2
                  top-0
                  h-full
                  -translate-x-1/2
                  border-l
                  border-dashed
                  border-[#CFE2F8]
                  md:hidden
                "
              />

              {/* Desktop left connector */}
              <div
                className="
                  absolute
                  left-0
                  top-1/2
                  hidden
                  w-1/2
                  -translate-y-1/2
                  border-t
                  border-dashed
                  border-[#CFE2F8]
                  md:block
                "
              />

              {/* Desktop right connector */}
              <div
                className="
                  absolute
                  right-0
                  top-1/2
                  hidden
                  w-1/2
                  -translate-y-1/2
                  border-t
                  border-dashed
                  border-[#CFE2F8]
                  md:block
                "
              />

              {/* Arrow circle */}
              <div
                className="
                  relative
                  z-10
                  flex
                  h-12
                  w-12
                  items-center
                  justify-center
                  rounded-full
                  bg-[#EEF6FF]
                  text-[#1473E6]
                  shadow-[0_6px_20px_rgba(20,115,230,0.10)]
                  ring-4
                  ring-white
                  md:h-14
                  md:w-14
                "
              >
                <ArrowRight
                  size={25}
                  strokeWidth={2}
                  className="
                    rotate-90
                    md:rotate-0
                  "
                />
              </div>
            </div>

            {/* ===============================================
                NEXT STEP CARD
            ================================================ */}
            <section
              className="
                relative
                z-10
                bg-white
                p-6
                shadow-[0_8px_26px_rgba(20,115,230,0.08)]
              "
            >
              <div className="flex items-start gap-4">
                <img
                  src="/dashboard/glucometer.png"
                  alt="Glucometer"
                  className="h-20 w-20 shrink-0 object-contain"
                  width={80}
                  height={80}
                />

                <div className="min-w-0">
                  <p
                    className="
                      text-[10px]
                      font-bold
                      uppercase
                      tracking-[0.16em]
                      text-[#1473E6]
                    "
                  >
                    Next Step
                  </p>

                  <h3
                    className="
                      mt-1.5
                      text-xl
                      font-medium
                      text-[#173B7A]
                    "
                  >
                    Diabetes Distress Scale
                  </h3>

                  <p
                    className="
                      mt-2
                      text-sm
                      leading-6
                      text-slate-500
                    "
                  >
                    Complete the DDS-17 to help us understand which areas of
                    diabetes management may be causing you the most distress.
                  </p>
                </div>
              </div>
            </section>
          </div>

          {/* =================================================
              SUPPORT MESSAGE
          ================================================== */}
          <div
            className="
              mt-5
              border-l-4
              border-[#1473E6]
              bg-[#F7FAFD]
              px-5
              py-4
            "
          >
            <p
              className="
                text-sm
                leading-6
                text-slate-600
              "
            >
              You only have one setup survey left. The DDS-17 contains 17
              short questions and will help personalize the support you
              receive during the study.
            </p>
          </div>

          {/* =================================================
              CTA
          ================================================== */}
          <div
            className="
              mt-8
              flex
              flex-col
              items-center
              text-center
            "
          >
            <Link
              href="/survey/dds"
              className="
                group
                inline-flex
                h-12
                min-w-[260px]
                items-center
                justify-center
                gap-2.5
                rounded-[10px]
                bg-[#173B7A]
                px-7
                text-sm
                font-medium
                text-white
                shadow-[0_8px_22px_rgba(23,59,122,0.18)]
                transition-all
                duration-200
                hover:bg-[#123568]
                hover:shadow-[0_10px_26px_rgba(23,59,122,0.22)]
                focus-visible:outline-none
                focus-visible:ring-2
                focus-visible:ring-[#1473E6]
                focus-visible:ring-offset-3
              "
            >
              Begin DDS-17

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
            </Link>

            <p
              className="
                mt-4
                max-w-[560px]
                text-sm
                leading-6
                text-slate-500
              "
            >
              Ready for the final setup step?
            </p>
          </div>
        </div>
      </section>
    </main>
  )
}