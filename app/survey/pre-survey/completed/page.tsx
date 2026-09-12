import Image from "next/image"
import Link from "next/link"
import { redirect } from "next/navigation"

import {
  ArrowRight,
  Check,
  ClipboardCheck,
  FileText,
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
          HEADER
      ====================================================== */}

      {/* <header
        className="
          relative
          z-40
          bg-white/95
          backdrop-blur-xl
          shadow-[0_1px_0_rgba(15,45,80,0.06)]
        "
      >
        <div
          className="
            mx-auto
            flex
            h-[76px]
            w-full
            max-w-[1280px]
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
                w-[150px]
                object-contain
              "
            />
          </Link>

          <div
            className="
              hidden
              items-center
              gap-2.5
              rounded-full
              bg-[#F4F8FD]
              px-4
              py-2
              shadow-[inset_0_0_0_1px_rgba(219,234,254,0.8)]
              sm:flex
            "
          >
            <span
              className="
                flex
                h-7
                w-7
                items-center
                justify-center
                rounded-full
                bg-white
                text-[#173B7A]
                shadow-[0_3px_10px_rgba(15,45,80,0.06)]
              "
            >
              <Check
                size={14}
                strokeWidth={2}
              />
            </span>

            <span
              className="
                text-[11px]
                font-semibold
                uppercase
                tracking-[0.16em]
                text-[#173B7A]
              "
            >
              Pre-Survey Complete
            </span>
          </div>
        </div>
      </header> */}

      {/* =====================================================
          PAGE BACKGROUND
      ====================================================== */}

      <section
        className="
          relative
          isolate
          min-h-[calc(100dvh-76px)]
          overflow-hidden
        "
      >
        {/* ===================================================
            SOFT CLINICAL BACKGROUND
        ==================================================== */}

        
        {/* ===================================================
            TOP SOFT BLUE CELEBRATION WAVE
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
          <div
            className="
              absolute
              -left-[6%]
              -top-[120px]
              h-[300px]
              w-[112%]
              rounded-[0_0_50%_50%/0_0_100%_100%]
              bg-blue-900    "
          />

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
              style={{ fontFamily: "'Papyrus', 'Brush Script MT', 'Comic Sans MS', cursive, fantasy, 'Copperplate', 'Lucida Handwriting', 'Dancing Script', 'Great Vibes', sans-serif" }}
            >
               You&apos;ve completed the pre-survey.
            </h1>
       


          
          </div>

          {/* =================================================
              PROGRESS
          ================================================== */}

          {/* <section
            className="
              mt-8
              rounded-[18px]
              bg-white/90
              px-6
              py-5
              shadow-[0_10px_30px_rgba(15,45,80,0.07)]
              backdrop-blur-sm
            "
          >
            <div
              className="
                flex
                items-center
                justify-between
                gap-5
              "
            >
              <div>
                <p
                  className="
                    text-base
                    font-medium
                    text-[#173B7A]
                  "
                >
                  Study setup progress
                </p>

                <p
                  className="
                    mt-1
                    text-sm
                    text-slate-500
                  "
                >
                  1 of 2 setup surveys completed
                </p>
              </div>

              <span
                className="
                  text-lg
                  font-semibold
                  text-[#1473E6]
                "
              >
                50%
              </span>
            </div>

            <div
              className="
                mt-4
                h-2.5
                overflow-hidden
                rounded-full
                bg-[#E6EEF7]
              "
            >
              <div
                className="
                  h-full
                  w-1/2
                  rounded-full
                  bg-[linear-gradient(90deg,#1473E6_0%,#2688F2_100%)]
                "
              />
            </div>
          </section> */}

          {/* =================================================
              STEP CARDS
          ================================================== */}

          <div
            className="
              mt-20
              grid
              gap-4
              md:grid-cols-2
            "
          >
            {/* Completed card */}
            <section
              className="
              
                bg-white
                p-6
                shadow-[0_8px_26px_rgba(15,45,80,0.07)]
              "
            >
              <div className="flex items-start gap-4">
                {/* <div
                  className="
                    flex
                    h-12
                    w-12
                    shrink-0
                    items-center
                    justify-center
                    rounded-full
                    bg-[#E9F8EF]
                    text-emerald-600
                  "
                >
                  <ClipboardCheck
                    size={21}
                    strokeWidth={1.8}
                  />
                </div> */}

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

            {/* Next step card */}
            <section
              className="
             
                
                p-6
                shadow-[0_8px_26px_rgba(20,115,230,0.08)]
              "
            >
              <div className="flex items-start gap-4">
                <img
                  src="/dashboard/glucometer.png"
                  alt="Glucometer"
                  className="w-20 h-20 "

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