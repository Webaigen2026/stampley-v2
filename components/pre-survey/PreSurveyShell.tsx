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
      {/* =====================================================
          FIXED SIDEBAR
      ====================================================== */}
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

        <div
    aria-hidden="true"
    className="
      pointer-events-none
    flex
    justify-center
      bottom-0
    
      z-10
      h-[285px]
      w-full
      overflow-hidden
    "
  >
    {/* Soft background circle */}
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

    {/* Secondary ring */}
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
  width={120}
  height={160}
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
      </aside>

      {/* =====================================================
          MAIN CONTENT
      ====================================================== */}
      <div className="min-w-0 lg:pl-[340px]">
        {/* ===================================================
            STICKY HEADER
        ==================================================== */}
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
            {/* Brand */}
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

            {/* Survey Status */}
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
                  fontFamily: `'Playfair Display', 'Cinzel', 'Dancing Script', 'Caveat', 'Great Vibes', cursive, serif, system-ui, sans-serif`,
                  letterSpacing: '0.01em',
                }}
              >
                Pre-Survey
              </span>
         
            </div>
          </div>
          
        </header>

       

        {/* ===================================================
            PAGE CONTENT
        ==================================================== */}
        <div className="w-full min-w-0">
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
    </main>
  )
}