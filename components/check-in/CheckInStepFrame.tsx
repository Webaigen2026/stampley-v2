import type { ReactNode } from "react"

export default function CheckInStepFrame({
  title,
  description,
  children,
}: {
  title: string
  description?: string
  children: ReactNode
}) {
  return (
    <div
      className="
        relative
        isolate
        min-h-full
        overflow-x-hidden
        bg-white
        font-['Outfit',system-ui,sans-serif]
        text-slate-950
      "
    >
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 -z-10 overflow-hidden bg-white"
      >
        <div className="absolute -left-[180px] top-[40px] h-[520px] w-[520px] rounded-full bg-[#EAF4FF]/55 blur-[120px]" />
        <div className="absolute right-[-160px] top-[220px] h-[420px] w-[420px] rounded-full bg-[#F1F7FF]/70 blur-[130px]" />
      </div>

      <div className="mx-auto w-full max-w-[920px] px-5 pb-32 pt-8 sm:px-8 sm:pt-10 lg:px-10">
        <p
          className="
            text-xs
            font-bold
            uppercase
            tracking-[0.35em]
            text-cyan-700
          "
        >
          Daily Check-In
        </p>

        <h1
          className="
            mt-4
            max-w-[20ch]
            text-3xl
            font-light
            tracking-tight
            text-[#0B2857]
            sm:text-4xl
          "
        >
          {title}
        </h1>

        {description ? (
          <p
            className="
              mt-4
              max-w-[58ch]
              text-base
              font-normal
              leading-relaxed
              text-slate-600
              sm:text-lg
            "
          >
            {description}
          </p>
        ) : null}

        <div className="mt-10">{children}</div>
      </div>
    </div>
  )
}
