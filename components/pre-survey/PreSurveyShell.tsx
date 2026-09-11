"use client"

import Image from "next/image"
import Link from "next/link"

import PreSurveySidebar from "./PreSurveySidebar"

export default function PreSurveyShell({
  currentStep,
  children,
}: {
  currentStep: number
  children: React.ReactNode
}) {
  return (
    <main
      className="
        min-h-dvh
        bg-white
        font-['Outfit',system-ui,sans-serif]
        text-slate-950
      "
    >
      <aside
        className="
          fixed
          inset-y-0
          left-0
          z-40
          hidden
          w-[340px]
          overflow-y-auto
          border-r
          border-slate-100
          bg-white
          px-8
          pt-8
          lg:block
        "
      >
        <PreSurveySidebar currentStep={currentStep} />
      </aside>

      <div className="lg:pl-[340px]">
        <header
          className="
            sticky
            top-0
            z-50
            border-b
            border-slate-100
            bg-white/95
            backdrop-blur-md
          "
        >
          <div className="mx-auto flex h-[72px] max-w-[1200px] items-center px-5 sm:px-8 lg:px-10">
            <Link
              href="/"
              className="
                inline-flex items-center gap-3 rounded-[10px]
                focus-visible:outline-2
                focus-visible:outline-offset-4
                focus-visible:outline-[#1473E6]
              "
            >
              <Image
                src="/images/stampleyLogo.png"
                alt="AIDES-T2D"
                width={32}
                height={32}
                priority
                className="h-8 w-auto"
              />
              <span className="hidden text-[10px] font-medium uppercase tracking-[0.16em] text-slate-500 sm:inline">
                AIDES-T2D
              </span>
            </Link>
          </div>
        </header>

        <div className="w-full">
          <div
            className="
              mx-auto
              mt-4
              w-full
              max-w-[900px]
              px-5
              sm:px-8
              lg:px-10
            "
          >
            {children}
          </div>
        </div>
      </div>
    </main>
  )
}
