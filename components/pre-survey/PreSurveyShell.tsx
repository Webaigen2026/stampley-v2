"use client"

import { useState } from "react"
import Image from "next/image"
import Link from "next/link"
import { ChevronLeft, ChevronRight } from "lucide-react"

import PreSurveySidebar from "./PreSurveySidebar"

export default function PreSurveyShell({
  currentStep,
  children,
}: {
  currentStep: number
  children: React.ReactNode
}) {
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false)

  return (
    <main
      className="
        min-h-dvh
        bg-white
        font-['Outfit',system-ui,sans-serif]
        text-slate-950
      "
    >
      <div className="flex min-h-dvh">
        {/* =====================================================
            DESKTOP SIDEBAR
        ====================================================== */}
        <aside
          className={`
            relative
            z-40
            hidden
            shrink-0
            flex-col
            overflow-hidden
            border-r
            border-slate-100
            bg-white
            transition-[width]
            duration-300
            ease-in-out
            lg:flex
            ${isSidebarCollapsed ? "w-20 px-0 pt-14" : "w-[340px] px-8 pt-8"}
          `}
        >
          <button
            type="button"
            onClick={() =>
              setIsSidebarCollapsed((current) => !current)
            }
            aria-label={
              isSidebarCollapsed
                ? "Expand survey navigation"
                : "Collapse survey navigation"
            }
            aria-expanded={!isSidebarCollapsed}
            className={`
              absolute
              top-4
              z-30
              flex
              h-8
              w-8
              items-center
              justify-center
              rounded-full
              border
              border-slate-200
              bg-white
              text-slate-500
              shadow-sm
              transition-colors
              duration-200
              hover:bg-slate-50
              hover:text-[#123B7A]
              focus-visible:outline-2
              focus-visible:outline-offset-2
              focus-visible:outline-[#1473E6]
              ${isSidebarCollapsed ? "right-1/2 translate-x-1/2" : "right-3"}
            `}
          >
            {isSidebarCollapsed ? (
              <ChevronRight
                aria-hidden="true"
                size={16}
                strokeWidth={1.8}
              />
            ) : (
              <ChevronLeft
                aria-hidden="true"
                size={16}
                strokeWidth={1.8}
              />
            )}
          </button>

          <div
            className={`
              relative
              z-20
              ${isSidebarCollapsed ? "flex justify-center" : ""}
            `}
          >
            <PreSurveySidebar
              currentStep={currentStep}
              collapsed={isSidebarCollapsed}
            />
          </div>

          {!isSidebarCollapsed ? (
            <div
              aria-hidden="true"
              className="
                pointer-events-none
                absolute
                bottom-0
                left-0
                z-10
                flex
                h-[285px]
                w-full
                justify-center
                overflow-hidden
              "
            >
              <div
                className="
                  absolute
                  -bottom-[100px]
                  h-[300px]
                  w-[300px]
                  rounded-full
                  bg-[radial-gradient(circle_at_center,#eef7ff_0%,#f7fbff_62%,transparent_100%)]
                "
              />

              <div
                className="
                  absolute
                  bottom-[18px]
                  h-[180px]
                  w-[180px]
                  rounded-full
                  border
                  border-[#d8e9f8]
                  opacity-70
                "
              />

              <img
                src="/dashboard/nurse.png"
                alt=""
                width={100}
                height={100}
                className="
                  absolute
                  bottom-0
                  z-10
                  h-[168px]
                  w-auto
                  max-w-none
                  object-contain
                  object-bottom
                "
              />
            </div>
          ) : null}
        </aside>

        {/* =====================================================
            MAIN CONTENT
        ====================================================== */}
        <div className="min-w-0 flex-1">
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

              <div
                className="
                  hidden
                  items-center
                  gap-2.5
                  px-4
                  py-2
                  sm:flex
                "
              >
                <span
                  aria-hidden="true"
                  className="
                    h-1.5
                    w-1.5
                    rounded-full
                  "
                />

                <span
                  className="
                    text-[24px]
                    font-bold
                  "
                  style={{
                    fontFamily:
                      "'Playfair Display', 'Cinzel', 'Dancing Script', 'Caveat', 'Great Vibes', cursive, serif, system-ui, sans-serif",
                    letterSpacing: "0.01em",
                  }}
                >
                  Pre-Survey
                </span>
              </div>
            </div>
          </header>

          <div className="w-full min-w-0 overflow-x-hidden">
            <div
              className={`
                mx-auto
                mt-4
                w-full
                min-w-0
                px-5
                sm:px-8
                lg:px-10
                ${
                  currentStep === 6
                    ? "max-w-[1100px]"
                    : "max-w-[900px]"
                }
              `}
            >
              {children}
            </div>
          </div>
        </div>
      </div>
    </main>
  )
}
