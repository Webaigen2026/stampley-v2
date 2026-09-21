import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import { prisma } from "@/lib/prisma"

import DomainConfirmation from "./domain-confirmation"
import { Header } from "@/components/survey/dds/results/header"
import {
  getHighestDdsDomains,
  isDdsDomain,
  meetsDdsClinicalAttentionThreshold,
} from "@/lib/dds-scoring"

function storedMean(value: unknown): number {
  if (value == null) return 0
  const score = Number(value)
  return Number.isFinite(score) ? score : 0
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

  const totalScore = storedMean(row.totalScore)
  const attentionThresholdReached =
    meetsDdsClinicalAttentionThreshold(totalScore)
  const highestDomains = getHighestDdsDomains({
    emotional: storedMean(row.emotionalScore),
    physician: storedMean(row.physicianScore),
    regimen: storedMean(row.regimenScore),
    interpersonal: storedMean(row.interpersonalScore),
  })
  const recommendedDomain = isDdsDomain(row.recommendedDomain)
    ? row.recommendedDomain
    : isDdsDomain(row.confirmedDomain)
      ? row.confirmedDomain
      : highestDomains[0] ?? "Emotional"
  const uniqueHighest =
    highestDomains.length === 1 ? highestDomains[0] : null

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


<Header />
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
            max-w-7xl
            px-5
            pb-24
         
            sm:px-8
           
            lg:px-10
          "
        >
          {/* =================================================
              FOCUS SELECTION
          ================================================== */}
 <h1
              className="
                my-10
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
           You have completed the pre-survey.
            </h1>








          <section
            className="
              mt-12
              
              bg-white
              p-6
              shadow-[0_14px_42px_rgba(15,45,80,0.08)]
              sm:p-8
            "
          >
         

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
  Choose your support focus for today&apos;s check-in
</h2>

<p
  className="
    mt-4
    max-w-3xl
    text-base
    leading-relaxed
    text-slate-600
  "
>
  Your overall DDS-17 mean is {totalScore.toFixed(2)}.{" "}
  {attentionThresholdReached
    ? "This score meets the DDS threshold for additional attention."
    : "This score is below the DDS threshold for additional attention."}
</p>

<p
  className="
    mt-4
    max-w-3xl
    text-base
    leading-relaxed
    text-slate-600
  "
>
  {uniqueHighest
    ? `Based on your DDS-17 responses, ${uniqueHighest} had the highest mean score. You may continue with that area or choose another of the four approved domains.`
    : "More than one area had the same highest DDS-17 mean score. You may choose any of the four approved domains for today's check-in."}
</p>

            <div className="mt-8">
              <DomainConfirmation
                recommendedDomain={
                  recommendedDomain
                }
                highestDomains={highestDomains}
              />
            </div>
          </section>
        </div>
      </div>
    </main>
  )
}
