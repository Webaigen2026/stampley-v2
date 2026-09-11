"use client"

import type { ReactNode } from "react"

type PreSurveyBackgroundProps = {
  children: ReactNode
  className?: string
}

export default function PreSurveyBackground({
  children,
  className = "",
}: PreSurveyBackgroundProps) {
  return (
    <div
      className={`
        relative
        isolate
        min-h-screen
        min-w-0
        overflow-hidden
        bg-white
        font-['Outfit',system-ui,sans-serif]
        text-slate-950
        ${className}
      `}
    >
      {/* =====================================================
          SOFT CLINICAL BACKGROUND
      ====================================================== */}
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
        {/* Upper-left ambient glow */}
        <div
          className="
            absolute
            -left-[180px]
            top-[80px]
            h-[620px]
            w-[620px]
            rounded-full
            bg-[#EAF4FF]/55
            blur-[120px]
          "
        />

        {/* Center ambient glow */}
        <div
          className="
            absolute
            left-[42%]
            top-[420px]
            h-[520px]
            w-[520px]
            rounded-full
            bg-[#F1F7FF]/55
            blur-[140px]
          "
        />

        {/* Lower-right ambient glow */}
        <div
          className="
            absolute
            -right-[220px]
            top-[850px]
            h-[680px]
            w-[680px]
            rounded-full
            bg-[#E8F3FF]/45
            blur-[140px]
          "
        />

        {/* Very subtle center highlight */}
        <div
          className="
            absolute
            left-1/2
            top-[10%]
            h-[420px]
            w-[720px]
            -translate-x-1/2
            rounded-full
            bg-white/70
            blur-[130px]
          "
        />
      </div>

      {/* =====================================================
          PAGE CONTENT
      ====================================================== */}
      <div className="relative z-10 min-w-0">
        {children}
      </div>
    </div>
  )
}