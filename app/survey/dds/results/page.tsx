import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import { prisma } from "@/lib/prisma"

import DomainConfirmation from "./domain-confirmation"

function getSeverity(score: number) {
  if (score >= 4) {
    return {
      label: "High Distress",
      description:
        "This score suggests diabetes distress may be strongly affecting your daily experience.",
      surface: "bg-red-50",
      text: "text-red-700",
      dot: "bg-red-500",
      progress: "bg-red-500",
    }
  }

  if (score >= 3) {
    return {
      label: "Moderate Distress or Higher",
      description:
        "This score falls within the range commonly associated with moderate diabetes distress or higher.",
      surface: "bg-amber-50",
      text: "text-amber-700",
      dot: "bg-amber-500",
      progress: "bg-amber-500",
    }
  }

  if (score >= 2) {
    return {
      label: "Mild to Moderate Distress",
      description:
        "This score suggests some diabetes-related distress may be present.",
      surface: "bg-[#F0F6FD]",
      text: "text-[#173B7A]",
      dot: "bg-[#1473E6]",
      progress: "bg-[#1473E6]",
    }
  }

  return {
    label: "Low Distress",
    description:
      "Your score is below the moderate diabetes-distress threshold.",
    surface: "bg-emerald-50",
    text: "text-emerald-700",
    dot: "bg-emerald-500",
    progress: "bg-emerald-500",
  }
}

function getScaleWidth(score: number) {
  return `${Math.min(Math.max((score / 6) * 100, 0), 100)}%`
}

export default async function DDSResultsPage() {
  const session = await auth()

  if (!session?.user?.id) {
    redirect("/login")
  }

  const row = await prisma.ddsResponse.findUnique({
    where: {
      userId: session.user.id,
    },
  })

  if (!row) {
    redirect("/survey/dds")
  }

  const totalScore =
    row.totalScore != null
      ? Number(row.totalScore)
      : 0

  const severity =
    getSeverity(totalScore)

  const recommendedDomain =
    row.recommendedDomain ||
    row.confirmedDomain ||
    "Emotional"

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
          HEADER
      ====================================================== */}

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
            max-w-[1200px]
            items-center
            justify-between
            px-5
            sm:px-8
            lg:px-10
          "
        >
          <div>
            <p
              className="
                text-[10px]
                font-semibold
                uppercase
                tracking-[0.22em]
                text-slate-400
              "
            >
              AIDES-T2D Research Study
            </p>

            <p
              className="
                mt-1
                text-sm
                font-medium
                text-[#173B7A]
              "
            >
              DDS-17 Results
            </p>
          </div>

          <div
            className="
              hidden
              items-center
              gap-2.5
              rounded-full
              bg-[#F4F8FD]
              px-4
              py-2
              shadow-[inset_0_0_0_1px_rgba(219,234,254,0.7)]
              sm:flex
            "
          >
            <span
              className="
                h-1.5
                w-1.5
                rounded-full
                bg-[#1473E6]
              "
            />

            <span
              className="
                text-[11px]
                font-semibold
                uppercase
                tracking-[0.16em]
                text-[#173B7A]
              "
            >
              Results Ready
            </span>
          </div>
        </div>
      </header>

      {/* =====================================================
          SOFT BACKGROUND
      ====================================================== */}

      <div
        className="
          relative
          isolate
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
              -left-[180px]
              top-[140px]
              h-[620px]
              w-[620px]
              rounded-full
              bg-[#EAF4FF]/55
              blur-[130px]
            "
          />

          <div
            className="
              absolute
              left-[45%]
              top-[620px]
              h-[520px]
              w-[520px]
              rounded-full
              bg-[#F1F7FF]/60
              blur-[150px]
            "
          />

          <div
            className="
              absolute
              -right-[200px]
              top-[880px]
              h-[650px]
              w-[650px]
              rounded-full
              bg-[#E8F3FF]/45
              blur-[150px]
            "
          />
        </div>

        <div
          className="
            mx-auto
            w-full
            max-w-[1080px]
            px-5
            pb-24
            pt-12
            sm:px-8
            sm:pt-16
            lg:px-10
          "
        >
          {/* =================================================
              INTRO
          ================================================== */}

          {/* <section>
            <p
              className="
                text-[11px]
                font-bold
                uppercase
                tracking-[0.28em]
                text-cyan-700
              "
            >
              DDS-17 Score Summary
            </p>

            <h1
              className="
                mt-4
                text-3xl
                font-light
                tracking-[-0.04em]
                text-slate-950
                sm:text-4xl
                lg:text-[44px]
              "
            >
              Your diabetes distress profile
            </h1>

            <p
              className="
                mt-5
                max-w-[720px]
                text-lg
                leading-relaxed
                text-slate-600
              "
            >
              Your responses help identify the areas of diabetes management
              that may be creating the most emotional or practical burden.
            </p>
          </section> */}

          {/* =================================================
              SCORE SUMMARY
          ================================================== */}

          {/* <section
            className="
              mt-10
              grid
              gap-6
              lg:grid-cols-[340px_1fr]
            "
          > */}
            {/* Main score */}

            {/* <div
              className="
                rounded-[20px]
                bg-white
                p-7
                shadow-[0_12px_38px_rgba(15,45,80,0.08)]
              "
            >
              <p
                className="
                  text-[11px]
                  font-semibold
                  uppercase
                  tracking-[0.18em]
                  text-slate-400
                "
              >
                Overall DDS Score
              </p>

              <div
                className="
                  mt-6
                  flex
                  items-end
                  gap-3
                "
              >
                <p
                  className="
                    text-[58px]
                    font-light
                    leading-none
                    tracking-[-0.05em]
                    text-[#173B7A]
                  "
                >
                  {totalScore.toFixed(2)}
                </p>

                <span
                  className="
                    pb-1
                    text-base
                    font-medium
                    text-slate-400
                  "
                >
                  / 6
                </span>
              </div>

              <div
                className={`
                  mt-6
                  inline-flex
                  items-center
                  gap-2
                  rounded-full
                  px-3.5
                  py-2
                  ${severity.surface}
                  ${severity.text}
                `}
              >
                <span
                  className={`
                    h-2
                    w-2
                    rounded-full
                    ${severity.dot}
                  `}
                />

                <span
                  className="
                    text-xs
                    font-semibold
                  "
                >
                  {severity.label}
                </span>
              </div>

              <p
                className="
                  mt-5
                  text-sm
                  leading-6
                  text-slate-600
                "
              >
                {severity.description}
              </p>
            </div> */}

            {/* Scale */}

            {/* <div
              className="
                rounded-[20px]
                bg-white
                p-7
                shadow-[0_12px_38px_rgba(15,45,80,0.08)]
              "
            >
              <div
                className="
                  flex
                  flex-wrap
                  items-start
                  justify-between
                  gap-4
                "
              >
                <div>
                  <p
                    className="
                      text-[11px]
                      font-semibold
                      uppercase
                      tracking-[0.18em]
                      text-slate-400
                    "
                  >
                    Distress Scale
                  </p>

                  <h2
                    className="
                      mt-2
                      text-xl
                      font-medium
                      text-slate-950
                    "
                  >
                    Where your score falls
                  </h2>
                </div>

                <div
                  className="
                    rounded-full
                    bg-[#F4F8FD]
                    px-3.5
                    py-2
                    text-xs
                    font-medium
                    text-[#173B7A]
                  "
                >
                  Moderate threshold: 3.0
                </div>
              </div>

              <div className="mt-9">
                <div
                  className="
                    mb-3
                    flex
                    justify-between
                    text-xs
                    font-medium
                    text-slate-400
                  "
                >
                  <span>Low</span>
                  <span>Moderate</span>
                  <span>High</span>
                </div>

                <div
                  className="
                    relative
                    h-3
                    overflow-hidden
                    rounded-full
                    bg-slate-100
                  "
                >
                  <div
                    className={`
                      h-full
                      rounded-full
                      transition-all
                      duration-500
                      ${severity.progress}
                    `}
                    style={{
                      width:
                        getScaleWidth(
                          totalScore
                        ),
                    }}
                  />

                  <div
                    className="
                      absolute
                      bottom-0
                      top-0
                      w-px
                      bg-slate-500
                    "
                    style={{
                      left: "50%",
                    }}
                  />
                </div>

                <div
                  className="
                    mt-3
                    flex
                    justify-between
                    text-[11px]
                    text-slate-400
                  "
                >
                  <span>1.0</span>
                  <span>3.0</span>
                  <span>6.0</span>
                </div>
              </div>

              <div
                className="
                  mt-8
                  rounded-[14px]
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
                  DDS-17 scores summarize diabetes-related distress. This
                  information can help identify which areas may benefit from
                  additional support.
                </p>
              </div>
            </div> */}
          {/* </section> */}

          {/* =================================================
              NOTE
          ================================================== */}

          {/* <section
            className="
              mt-8
              rounded-[16px]
              border-l-4
              border-blue-900
              bg-white
              px-6
              py-5
              shadow-[0_10px_32px_rgba(15,45,80,0.07)]
            "
          >
            <p
              className="
                text-sm
                leading-6
                text-slate-600
              "
            >
              This summary is intended to support your study experience. It is
              not a diagnosis and does not replace advice or care from a
              qualified healthcare professional.
            </p>
          </section> */}

          {/* =================================================
              FOCUS SELECTION
          ================================================== */}

          <section
            className="
              mt-12
              rounded-[22px]
              bg-white
              p-6
              shadow-[0_14px_42px_rgba(15,45,80,0.08)]
              sm:p-8
            "
          >
            <p
              className="
                text-[11px]
                font-bold
                uppercase
                tracking-[0.26em]
                text-cyan-700
              "
            >
              Next Step
            </p>

            <h2
              className="
                mt-3
                text-2xl
                font-light
                tracking-tight
                text-slate-950
                sm:text-3xl
              "
            >
              Choose your support focus
            </h2>

            <p
              className="
                mt-4
                max-w-[720px]
                text-base
                leading-relaxed
                text-slate-600
              "
            >
              We recommend beginning with the area most connected to your DDS
              responses. You can accept the recommendation or choose another
              area that feels more important to you right now.
            </p>

            <div className="mt-8">
              <DomainConfirmation
                recommendedDomain={
                  recommendedDomain
                }
              />
            </div>
          </section>
        </div>
      </div>
    </main>
  )
}