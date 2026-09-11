import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import { prisma } from "@/lib/prisma"
import Image from "next/image"
import Link from "next/link"
import { ArrowRight, CheckCircle2 } from "lucide-react"

export default async function PreSurveyCompletedPage() {
  const session = await auth()

  if (!session?.user?.id) {
    redirect("/login")
  }

  const preSurvey = await prisma.preSurveyResponse.findUnique({
    where: { userId: session.user.id },
    select: { id: true },
  })

  if (!preSurvey) {
    redirect("/survey/pre-survey")
  }

  const dds = await prisma.ddsResponse.findUnique({
    where: { userId: session.user.id },
    select: { id: true },
  })

  if (dds) {
    redirect("/survey/dds/results")
  }

  return (
    <main
      className="
        relative
        isolate
        min-h-dvh
        overflow-hidden
        bg-white
        font-['Outfit',system-ui,sans-serif]
        text-slate-950
      "
    >
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 -z-10 overflow-hidden bg-white"
      >
        <div className="absolute -left-[180px] top-[80px] h-[620px] w-[620px] rounded-full bg-[#EAF4FF]/55 blur-[120px]" />
        <div className="absolute left-[42%] top-[280px] h-[520px] w-[520px] rounded-full bg-[#F1F7FF]/55 blur-[140px]" />
        <div className="absolute -right-[220px] top-[520px] h-[680px] w-[680px] rounded-full bg-[#E8F3FF]/45 blur-[140px]" />
      </div>

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
          <Link
            href="/"
            className="
              group
              inline-flex
              items-center
              gap-3
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
        </div>
      </header>

      <div className="mx-auto w-full max-w-[900px] px-5 pb-20 pt-10 sm:px-8 sm:pt-14 lg:px-10">
        <p
          className="
            text-xs
            font-bold
            uppercase
            tracking-[0.35em]
            text-cyan-700
          "
        >
          Pre-Survey completed
        </p>

        <div
          className="
            mt-5
            flex
            h-12
            w-12
            items-center
            justify-center
            rounded-full
            bg-emerald-50
            text-emerald-700
            shadow-[0_8px_20px_rgba(4,120,87,0.08)]
          "
        >
          <CheckCircle2 aria-hidden="true" size={24} strokeWidth={1.8} />
        </div>

        <h1
          className="
            mt-5
            max-w-[18ch]
            text-3xl
            font-light
            tracking-tight
            text-slate-950
            sm:text-4xl
          "
        >
          Great work — your pre-survey is complete.
        </h1>

        <p
          className="
            mt-5
            max-w-[66ch]
            text-lg
            font-normal
            leading-relaxed
            text-slate-600
          "
        >
          Your responses have been securely saved. You have completed the first
          important step of the AIDES-T2D study.
        </p>

        <section
          className="
            mt-10
            max-w-[820px]
            rounded-[16px]
            bg-white
            px-5
            py-6
            shadow-[0_10px_30px_rgba(15,45,80,0.07)]
            sm:px-6
          "
        >
          <div className="flex items-start justify-between gap-6">
            <div>
              <h2 className="text-base font-medium text-[#173B7A]">
                Study setup progress
              </h2>
              <p className="mt-1.5 text-sm font-normal leading-relaxed text-slate-500">
                1 of 2 setup surveys completed
              </p>
            </div>
            <p className="shrink-0 text-sm font-semibold text-[#1473E6]">50%</p>
          </div>

          <div
            className="mt-5 h-1.5 w-full overflow-hidden rounded-full bg-slate-100"
            role="progressbar"
            aria-valuenow={50}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-label="Study setup progress"
          >
            <div className="h-full w-1/2 rounded-full bg-[#1473E6]" />
          </div>
        </section>

        <div className="mt-5 grid max-w-[820px] gap-5 sm:grid-cols-2">
          <article
            className="
              rounded-[16px]
              bg-white
              px-5
              py-6
              shadow-[0_10px_30px_rgba(15,45,80,0.07)]
              sm:px-6
            "
          >
            <p
              className="
                text-[11px]
                font-semibold
                uppercase
                tracking-[0.18em]
                text-emerald-700
              "
            >
              Completed
            </p>
            <h3 className="mt-3 text-xl font-light tracking-tight text-slate-950">
              Pre-Survey
            </h3>
            <p className="mt-2 text-sm font-normal leading-relaxed text-slate-500">
              Your pre-survey responses are saved to your study record.
            </p>
          </article>

          <article
            className="
              rounded-[16px]
              bg-white
              px-5
              py-6
              shadow-[0_10px_30px_rgba(15,45,80,0.07)]
              sm:px-6
            "
          >
            <p
              className="
                text-[11px]
                font-semibold
                uppercase
                tracking-[0.18em]
                text-cyan-700
              "
            >
              Next step
            </p>
            <h3 className="mt-3 text-xl font-light tracking-tight text-slate-950">
              Diabetes Distress Scale
            </h3>
            <p className="mt-2 text-sm font-normal leading-relaxed text-slate-500">
              DDS-17 is the final setup survey and contains 17 short questions.
            </p>
          </article>
        </div>

        <p
          className="
            mt-8
            max-w-[66ch]
            text-base
            font-normal
            leading-relaxed
            text-slate-600
          "
        >
          The Diabetes Distress Scale (DDS-17) is the final setup survey. It
          includes 17 short questions about areas of diabetes care that may feel
          stressful or difficult.
        </p>

        <Link
          href="/survey/dds"
          className="
            group
            mt-8
            inline-flex
            h-[56px]
            min-w-[168px]
            items-center
            justify-between
            gap-5
            rounded-[10px]
            bg-[#173B7A]
            px-6
            text-sm
            font-normal
            text-white
            transition
            hover:bg-[#122E60]
            focus-visible:outline-2
            focus-visible:outline-offset-2
            focus-visible:outline-[#173B7A]
          "
        >
          <span>Begin DDS-17</span>
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
            aria-hidden="true"
          >
            <ArrowRight strokeWidth={1.8} className="h-[15px] w-[15px]" />
          </span>
        </Link>
      </div>
    </main>
  )
}
