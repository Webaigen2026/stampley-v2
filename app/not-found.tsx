// app/not-found.tsx

import Image from "next/image"
import Link from "next/link"

import {
  ArrowRight,
  Home,
  Mail,
} from "lucide-react"

export default function NotFound() {
  return (
    <main
      className="
        relative
        min-h-dvh
        overflow-hidden
        bg-white
        font-['Outfit',system-ui,sans-serif]
        text-[#0B2857]
      "
    >
      {/* =====================================================
          SUBTLE BACKGROUND DETAILS
      ====================================================== */}
      <div
        aria-hidden="true"
        className="
          pointer-events-none
          absolute
          -bottom-[180px]
          -right-[150px]
          h-[430px]
          w-[430px]
          rounded-full
          bg-[#EEF6FF]
        "
      />

      <div
        aria-hidden="true"
        className="
          pointer-events-none
          absolute
          -bottom-[190px]
          right-[120px]
          h-[330px]
          w-[330px]
          rounded-full
          bg-[#F7FAFF]
        "
      />


      {/* =====================================================
          404 CONTENT
      ====================================================== */}
      <section
        className="
          relative
          z-10
          mx-auto
          grid
          min-h-[calc(100dvh-92px)]
          w-full
          max-w-[1440px]
          items-center
          gap-8
          px-5
          pb-12
          pt-4
          sm:px-8
          lg:grid-cols-[1.08fr_0.92fr]
          lg:gap-14
          lg:px-12
          lg:pb-16
          lg:pt-0
          xl:gap-20
          xl:px-16
        "
      >
        {/* =================================================
            LEFT — ILLUSTRATION
        ================================================== */}
        <div
          className="
            order-2
            relative
            flex
            items-center
            justify-center
            lg:order-1
          "
        >
          {/* Soft glow behind illustration */}
          <div
            aria-hidden="true"
            className="
              pointer-events-none
              absolute
              left-1/2
              top-1/2
              h-[68%]
              w-[78%]
              -translate-x-1/2
              -translate-y-1/2
              rounded-full
              bg-[#F7FBFF]
              blur-3xl
            "
          />

          <Image
            src="/notfound/notfound.png"
            alt="Illustration of a participant deciding between two directions"
            width={900}
            height={900}
            priority
            sizes="
              (max-width: 1023px) 90vw,
              (max-width: 1279px) 52vw,
              650px
            "
            className="
              relative
              z-10
              h-auto
              w-full
              max-w-[650px]
              object-contain
              lg:max-w-[690px]
              xl:max-w-[730px]
            "
          />
        </div>

        {/* =================================================
            RIGHT — MESSAGE
        ================================================== */}
        <div
          className="
            order-1
            mx-auto
            w-full
            max-w-[570px]
            text-center
            lg:order-2
            lg:mx-0
            lg:text-left
          "
        >
        

          {/* Large 404 */}
          <div
            aria-hidden="true"
            className="
              mt-5
              inline-block
              bg-gradient-to-r
              from-[#0B2857]
              via-[#1473E6]
              to-[#72AEF8]
              bg-clip-text
              text-[112px]
              font-semibold
              leading-[0.82]
              tracking-[-0.07em]
              text-transparent
              sm:text-[142px]
              lg:text-[158px]
              xl:text-[172px]
            "
          >
            404
          </div>

          {/* Heading */}
          <h1
            className="
              mt-7
              text-4xl
              font-light
              leading-[1.05]
              tracking-[-0.04em]
              text-[#0B2857]
              sm:text-5xl
              lg:text-[54px]
            "
          >
            Page not found
          </h1>

          {/* Description */}
          <p
            className="
              mx-auto
              mt-5
              max-w-[40ch]
              text-base
              font-normal
              leading-[1.75]
              text-slate-500
              sm:text-lg
              lg:mx-0
            "
          >
            The page you&apos;re looking for doesn&apos;t exist or may have
            been moved.
          </p>

          {/* =================================================
              ACTIONS
          ================================================== */}
          <div
            className="
              mt-9
              flex
              flex-col
              gap-3
              sm:flex-row
              sm:justify-center
              lg:justify-start
            "
          >
            {/* Home */}
            <Link
              href="/"
              className="
                group
                inline-flex
                h-[56px]
                min-w-[205px]
                items-center
                justify-between
                gap-5
                rounded-[10px]
                bg-[#173B7A]
                px-5
                text-sm
                font-medium
                text-white
                shadow-[0_10px_28px_rgba(23,59,122,0.16)]
                transition-all
                duration-200
                hover:-translate-y-0.5
                hover:bg-[#122E60]
                hover:shadow-[0_14px_32px_rgba(23,59,122,0.2)]
                focus-visible:outline-none
                focus-visible:ring-2
                focus-visible:ring-[#1473E6]/30
                focus-visible:ring-offset-2
              "
            >
              <span className="flex items-center gap-3">
                <Home
                  aria-hidden="true"
                  size={18}
                  strokeWidth={1.7}
                />

                Go to home
              </span>

              <ArrowRight
                aria-hidden="true"
                size={18}
                strokeWidth={1.7}
                className="
                  transition-transform
                  duration-200
                  group-hover:translate-x-1
                "
              />
            </Link>

            {/* Support */}
            <a
              href="mailto:pcrg@umb.edu"
              className="
                group
                inline-flex
                h-[56px]
                min-w-[205px]
                items-center
                justify-center
                gap-3
                rounded-[10px]
                border
                border-[#BFD7F3]
                bg-white
                px-5
                text-sm
                font-medium
                text-[#173B7A]
                transition-all
                duration-200
                hover:-translate-y-0.5
                hover:border-[#8FB9E8]
                hover:bg-[#F8FBFF]
                focus-visible:outline-none
                focus-visible:ring-2
                focus-visible:ring-[#1473E6]/20
                focus-visible:ring-offset-2
              "
            >
              <Mail
                aria-hidden="true"
                size={18}
                strokeWidth={1.7}
                className="
                  transition-transform
                  duration-200
                  group-hover:-translate-y-0.5
                "
              />

              Contact support
            </a>
          </div>

          {/* =================================================
              SUPPORT EMAIL
          ================================================== */}
          <div
            className="
              mt-8
              flex
              flex-wrap
              items-center
              justify-center
              gap-x-2
              gap-y-1
              text-sm
              text-slate-500
              lg:justify-start
            "
          >
            <span>Need help?</span>

            <a
              href="mailto:pcrg@umb.edu"
              className="
                font-medium
                text-[#1473E6]
                underline
                decoration-[#1473E6]/25
                underline-offset-4
                transition-colors
                duration-200
                hover:text-[#173B7A]
              "
            >
              pcrg@umb.edu
            </a>
          </div>
        </div>
      </section>
    </main>
  )
}