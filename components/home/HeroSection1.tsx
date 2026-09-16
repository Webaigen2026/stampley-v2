"use client"

import { useEffect, useRef, useState } from "react"
import Image from "next/image"
import Link from "next/link"
import { ArrowRight } from "lucide-react"
import { useSession } from "next-auth/react"

export default function HeroSection() {
  const sectionRef = useRef<HTMLElement>(null)
  const [inView, setInView] = useState(false)

  const { status } = useSession()
  const isAuthenticated = status === "authenticated"

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        setInView(entry.isIntersecting)
      },
      {
        threshold: 0.18,
      }
    )

    if (sectionRef.current) {
      observer.observe(sectionRef.current)
    }

    return () => observer.disconnect()
  }, [])

  return (
    <section
      ref={sectionRef}
      className="
        relative
        overflow-hidden
        bg-white
        font-['Outfit',system-ui,sans-serif]
        text-black
      "
    >
      <div
        className="
          grid
          min-h-[640px]
          w-full
          grid-cols-1
          pb-12
          sm:min-h-[680px]
          sm:pb-16
          md:pb-20
          lg:min-h-[680px]
          lg:grid-cols-[0.94fr_1.06fr]
          lg:pb-[115px]
        "
      >
        {/* =====================================================
            LEFT — LIGHT EDITORIAL STUDY PANEL
        ====================================================== */}
        <div
          className="
            relative
            z-20
            flex
            items-center
            overflow-hidden
            bg-white
            px-5
            py-12
            sm:px-8
            sm:py-14
            md:px-12
            md:py-16
            lg:px-0
            lg:py-20
            lg:pl-20
            lg:pr-10
            xl:pl-24
            xl:pr-12
          "
        >
          {/* Soft blue ambient wash */}
          <div
            aria-hidden="true"
            className={`
              pointer-events-none
              absolute
              inset-0
              bg-[radial-gradient(circle_at_12%_12%,rgba(30,64,175,0.06)_0%,rgba(30,64,175,0.02)_30%,transparent_58%)]
              transition-all
              duration-[1400ms]
              ease-out
              ${
                inView
                  ? "scale-100 opacity-100"
                  : "scale-110 opacity-0"
              }
            `}
          />

          {/* Secondary soft wash */}
          <div
            aria-hidden="true"
            className={`
              pointer-events-none
              absolute
              -bottom-[150px]
              -right-[180px]
              h-[340px]
              w-[340px]
              rounded-full
              bg-blue-500/[0.035]
              blur-3xl
              transition-all
              duration-[1600ms]
              ease-out
              sm:h-[420px]
              sm:w-[420px]
              lg:-bottom-[180px]
              lg:-right-[160px]
              ${
                inView
                  ? "scale-100 opacity-100"
                  : "scale-75 opacity-0"
              }
            `}
          />

          {/* Decorative rings */}
          <div
            aria-hidden="true"
            className={`
              pointer-events-none
              absolute
              -right-[250px]
              top-[90px]
              hidden
              h-[440px]
              w-[440px]
              rounded-full
              border
              border-blue-900/[0.055]
              transition-all
              duration-[1200ms]
              ease-out
              sm:block
              md:-right-[210px]
              md:h-[520px]
              md:w-[520px]
              ${
                inView
                  ? "translate-x-0 scale-100 opacity-100"
                  : "translate-x-16 scale-95 opacity-0"
              }
            `}
          />

          <div
            aria-hidden="true"
            className={`
              pointer-events-none
              absolute
              -right-[170px]
              top-[150px]
              hidden
              h-[310px]
              w-[310px]
              rounded-full
              border
              border-blue-900/[0.035]
              transition-all
              delay-100
              duration-[1200ms]
              ease-out
              sm:block
              md:-right-[135px]
              md:top-[155px]
              md:h-[370px]
              md:w-[370px]
              ${
                inView
                  ? "translate-x-0 scale-100 opacity-100"
                  : "translate-x-12 scale-90 opacity-0"
              }
            `}
          />

          {/* Small dot matrix */}
          <div
            aria-hidden="true"
            className={`
              pointer-events-none
              absolute
              right-[6%]
              top-[6%]
              hidden
              grid-cols-4
              gap-[9px]
              transition-all
              delay-200
              duration-1000
              ease-out
              sm:grid
              md:right-[8%]
              md:top-[9%]
              ${
                inView
                  ? "translate-y-0 opacity-[0.12]"
                  : "-translate-y-5 opacity-0"
              }
            `}
          >
            {Array.from({ length: 16 }).map((_, index) => (
              <span
                key={index}
                className="
                  h-[3px]
                  w-[3px]
                  rounded-full
                  bg-blue-900
                "
              />
            ))}
          </div>

          {/* Content */}
          <div
            className="
              relative
              z-10
              mx-auto
              w-full
              max-w-[570px]
              lg:mx-0
            "
          >
            {/* Heading */}
            <h1
              className={`
                max-w-full
                text-[29px]
                font-normal
                leading-[1.1]
                tracking-[-0.03em]
                text-blue-900
                transition-all
                duration-700
                ease-out
                min-[420px]:text-[31px]
                sm:text-[34px]
                md:text-[36px]
                lg:text-[38px]
                xl:text-[42px]
                ${
                  inView
                    ? "translate-x-0 opacity-100"
                    : "-translate-x-12 opacity-0"
                }
              `}
            >
              We&apos;re glad{" "}
              <span className="text-blue-900">
                you&apos;re here.
              </span>
            </h1>

            {/* Intro */}
            <p
              className={`
                mt-6
                max-w-[530px]
                text-[15px]
                font-normal
                leading-[1.75]
                tracking-[-0.01em]
                text-black/75
                transition-all
                delay-100
                duration-700
                ease-out
                sm:mt-7
                sm:text-[16px]
                sm:leading-[1.8]
                md:text-[17px]
                ${
                  inView
                    ? "translate-x-0 opacity-100"
                    : "-translate-x-12 opacity-0"
                }
              `}
            >
              AIDES-T2D is a four-week study designed to understand how AI
              can provide emotional support for people living with Type 2
              Diabetes.
            </p>

            {/* Main commitment */}
            <div
              className={`
                mt-8
                border-l-[3px]
                border-blue-900
                pl-4
                transition-all
                delay-200
                duration-700
                ease-out
                sm:mt-9
                sm:pl-5
                ${
                  inView
                    ? "translate-x-0 opacity-100"
                    : "-translate-x-12 opacity-0"
                }
              `}
            >
              <p
                className="
                  text-[18px]
                  font-normal
                  leading-[1.4]
                  tracking-[-0.02em]
                  text-blue-900
                  sm:text-[20px]
                  md:text-[21px]
                "
              >
                Complete at least five study sessions each week.
              </p>

              <p
                className="
                  mt-4
                  max-w-[530px]
                  text-[15px]
                  font-normal
                  leading-[1.75]
                  tracking-[-0.01em]
                  text-black/75
                  sm:mt-5
                  sm:text-[16px]
                  sm:leading-[1.8]
                  md:text-[17px]
                "
              >
                A session includes a brief check-in and a conversation with
                Stampley.
              </p>
            </div>

            {/* =================================================
                STUDY FACTS
            ================================================== */}
            <div
              className="
                mt-8
                grid
                grid-cols-1
                gap-3
                sm:mt-9
                md:grid-cols-2
              "
            >
              {/* Time */}
              <div
                className={`
                  group
                  relative
                  overflow-hidden
                  rounded-[14px]
                  p-[1px]
                  transition-all
                  delay-300
                  duration-700
                  ease-out
                  ${
                    inView
                      ? "translate-y-0 scale-100 opacity-100"
                      : "translate-y-8 scale-[0.97] opacity-0"
                  }
                `}
              >
                <div
                  aria-hidden="true"
                  className="
                    pointer-events-none
                    absolute
                    inset-[-140%]
                    animate-[spin_4.5s_linear_infinite]
                    bg-[conic-gradient(from_0deg,transparent_0deg,transparent_245deg,rgba(37,99,235,0.08)_280deg,rgba(37,99,235,0.55)_315deg,rgba(96,165,250,1)_336deg,rgba(37,99,235,0.55)_348deg,transparent_360deg)]
                  "
                />

                <div
                  className="
                    relative
                    z-10
                    flex
                    min-h-[88px]
                    items-center
                    gap-3
                    rounded-[13px]
                    bg-white/95
                    px-4
                    py-3.5
                    shadow-[0_6px_24px_rgba(30,64,175,0.05)]
                    backdrop-blur-sm
                    transition-all
                    duration-300
                    group-hover:shadow-[0_10px_32px_rgba(30,64,175,0.10)]
                    sm:min-h-[92px]
                    sm:gap-4
                  "
                >
                  <div
                    className="
                      relative
                      flex
                      h-[52px]
                      w-[52px]
                      shrink-0
                      items-center
                      justify-center
                      sm:h-[58px]
                      sm:w-[58px]
                    "
                  >
                    <Image
                      src="/hero/time.png"
                      alt=""
                      width={58}
                      height={58}
                      aria-hidden="true"
                      className="
                        h-[48px]
                        w-[48px]
                        object-contain
                        transition-transform
                        duration-300
                        group-hover:scale-[1.04]
                        sm:h-[54px]
                        sm:w-[54px]
                      "
                    />
                  </div>

                  <div className="min-w-0">
                    <p
                      className="
                        text-[14px]
                        font-normal
                        leading-5
                        tracking-[-0.01em]
                        text-black
                      "
                    >
                      15–20 minutes
                    </p>

                    <p
                      className="
                        mt-0.5
                        text-[14px]
                        font-normal
                        leading-5
                        tracking-[-0.01em]
                        text-black/60
                        sm:text-[15px]
                      "
                    >
                      per session
                    </p>
                  </div>
                </div>
              </div>

              {/* Hardware */}
              <div
                className={`
                  group
                  relative
                  overflow-hidden
                  rounded-[14px]
                  p-[1px]
                  transition-all
                  delay-[380ms]
                  duration-700
                  ease-out
                  ${
                    inView
                      ? "translate-y-0 scale-100 opacity-100"
                      : "translate-y-8 scale-[0.97] opacity-0"
                  }
                `}
              >
                <div
                  aria-hidden="true"
                  className="
                    pointer-events-none
                    absolute
                    inset-[-140%]
                    animate-[spin_4.5s_linear_infinite]
                    bg-[conic-gradient(from_180deg,transparent_0deg,transparent_245deg,rgba(242,177,52,0.08)_280deg,rgba(242,177,52,0.55)_315deg,rgba(255,196,76,1)_336deg,rgba(242,177,52,0.55)_348deg,transparent_360deg)]
                  "
                />

                <div
                  className="
                    relative
                    z-10
                    flex
                    min-h-[88px]
                    items-center
                    gap-3
                    rounded-[13px]
                    bg-white/95
                    px-4
                    py-3.5
                    shadow-[0_6px_24px_rgba(30,64,175,0.05)]
                    backdrop-blur-sm
                    transition-all
                    duration-300
                    group-hover:shadow-[0_10px_32px_rgba(30,64,175,0.10)]
                    sm:min-h-[92px]
                    sm:gap-4
                  "
                >
                  <div
                    className="
                      relative
                      flex
                      h-[52px]
                      w-[62px]
                      shrink-0
                      items-center
                      justify-center
                      sm:h-[58px]
                      sm:w-[70px]
                    "
                  >
                    <Image
                      src="/hero/hardware.png"
                      alt=""
                      width={70}
                      height={58}
                      aria-hidden="true"
                      className="
                        h-[48px]
                        w-[60px]
                        object-contain
                        transition-transform
                        duration-300
                        group-hover:scale-[1.04]
                        sm:h-[54px]
                        sm:w-[68px]
                      "
                    />
                  </div>

                  <div className="min-w-0">
                    <p
                      className="
                        text-[14px]
                        font-normal
                        leading-5
                        tracking-[-0.01em]
                        text-black/80
                        sm:text-[15px]
                        md:text-[16px]
                      "
                    >
                      Participate anywhere
                    </p>

                    <p
                      className="
                        mt-0.5
                        text-[11px]
                        font-normal
                        leading-4
                        text-black/50
                        sm:text-[11.5px]
                      "
                    >
                      Phone, tablet, or computer
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* =================================================
                CTA
                Mobile: Register + Log in stay in one row
            ================================================== */}
            <div
              className={`
                mt-8
                flex
                w-full
                flex-row
                items-center
                gap-3
                transition-all
                delay-[460ms]
                duration-700
                ease-out
                sm:mt-9
                sm:gap-4
                md:gap-5
                ${
                  inView
                    ? "translate-y-0 opacity-100"
                    : "translate-y-8 opacity-0"
                }
              `}
            >
              {status === "loading" ? (
                <div
                  aria-hidden="true"
                  className="
                    h-[50px]
                    w-full
                    animate-pulse
                    rounded-full
                    bg-slate-100
                    sm:w-[220px]
                  "
                />
              ) : isAuthenticated ? (
                <Link
                  href="/dashboard"
                  className="
                    group
                    flex
                    h-[50px]
                    w-full
                    items-center
                    justify-between
                    rounded-full
                    bg-[#173B7A]
                    px-5
                    text-[12px]
                    font-normal
                    uppercase
                    tracking-[0.10em]
                    text-white
                    shadow-[0_10px_30px_rgba(37,99,235,0.18),0_2px_6px_rgba(0,0,0,0.12)]
                    transition-all
                    duration-200
                    hover:-translate-y-0.5
                    hover:bg-[#122E60]
                    active:translate-y-0
                    focus-visible:outline-none
                    focus-visible:ring-2
                    focus-visible:ring-[#1473E6]
                    focus-visible:ring-offset-2
                    sm:w-[220px]
                  "
                >
                  <span>Dashboard</span>

                  <span
                    className="
                      flex
                      h-8
                      w-8
                      shrink-0
                      items-center
                      justify-center
                      rounded-full
                      border
                      border-white/70
                      text-white
                      transition-transform
                      duration-200
                      group-hover:translate-x-1
                    "
                  >
                    <ArrowRight
                      aria-hidden="true"
                      strokeWidth={1.8}
                      className="h-[15px] w-[15px]"
                    />
                  </span>
                </Link>
              ) : (
                <>
                  {/* Register */}
                  <Link
                    href="/register"
                    className="
                      group
                      flex
                      h-[50px]
                      min-w-0
                      flex-1
                      items-center
                      justify-between
                      rounded-full
                      bg-[#173B7A]
                      px-3.5
                      text-[10px]
                      font-normal
                      uppercase
                      tracking-[0.06em]
                      text-white
                      shadow-[0_10px_30px_rgba(37,99,235,0.18),0_2px_6px_rgba(0,0,0,0.12)]
                      transition-all
                      duration-200
                      hover:-translate-y-0.5
                      hover:bg-[#122E60]
                      active:translate-y-0
                      focus-visible:outline-none
                      focus-visible:ring-2
                      focus-visible:ring-[#1473E6]
                      focus-visible:ring-offset-2
                      min-[380px]:px-4
                      min-[380px]:text-[11px]
                      min-[380px]:tracking-[0.08em]
                      sm:w-[220px]
                      sm:flex-none
                      sm:px-5
                      sm:text-[12px]
                      sm:tracking-[0.10em]
                    "
                  >
                    <span className="truncate">
                      Register
                    </span>

                    <span
                      className="
                        ml-2
                        flex
                        h-7
                        w-7
                        shrink-0
                        items-center
                        justify-center
                        rounded-full
                        border
                        border-white/70
                        text-white
                        transition-transform
                        duration-200
                        group-hover:translate-x-0.5
                        min-[380px]:h-8
                        min-[380px]:w-8
                        sm:group-hover:translate-x-1
                      "
                    >
                      <ArrowRight
                        aria-hidden="true"
                        strokeWidth={1.8}
                        className="
                          h-[14px]
                          w-[14px]
                          min-[380px]:h-[15px]
                          min-[380px]:w-[15px]
                        "
                      />
                    </span>
                  </Link>

                  {/* Log in */}
                  <Link
                    href="/login"
                    className="
                      group
                      flex
                      h-[50px]
                      min-w-0
                      flex-1
                      items-center
                      justify-between
                      rounded-full
                      bg-white
                      px-3.5
                      text-[10px]
                      font-normal
                      uppercase
                      tracking-[0.06em]
                      text-[#173B7A]
                      shadow-[0_7px_24px_rgba(23,59,122,0.07),inset_0_0_0_1px_rgba(23,59,122,0.16)]
                      transition-all
                      duration-200
                      hover:-translate-y-0.5
                      hover:bg-[#F7FAFD]
                      active:translate-y-0
                      focus-visible:outline-none
                      focus-visible:ring-2
                      focus-visible:ring-[#1473E6]
                      focus-visible:ring-offset-2
                      min-[380px]:px-4
                      min-[380px]:text-[11px]
                      min-[380px]:tracking-[0.08em]
                      sm:w-[180px]
                      sm:flex-none
                      sm:px-5
                      sm:text-[12px]
                      sm:tracking-[0.10em]
                    "
                  >
                    <span className="truncate">
                      Log in
                    </span>

                    <span
                      className="
                        ml-2
                        flex
                        h-7
                        w-7
                        shrink-0
                        items-center
                        justify-center
                        rounded-full
                        border
                        border-[#173B7A]/30
                        text-[#173B7A]
                        transition-transform
                        duration-200
                        group-hover:translate-x-0.5
                        min-[380px]:h-8
                        min-[380px]:w-8
                        sm:group-hover:translate-x-1
                      "
                    >
                      <ArrowRight
                        aria-hidden="true"
                        strokeWidth={1.8}
                        className="
                          h-[14px]
                          w-[14px]
                          min-[380px]:h-[15px]
                          min-[380px]:w-[15px]
                        "
                      />
                    </span>
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>

        {/* =====================================================
            RIGHT — REALISTIC PARTICIPANT IMAGE
            Desktop only
        ====================================================== */}
        <div
          className={`
            relative
            hidden
            min-h-full
            overflow-hidden
            transition-all
            duration-[1100ms]
            ease-out
            lg:block
            ${
              inView
                ? "translate-x-0 opacity-100"
                : "translate-x-16 opacity-0"
            }
          `}
        >
          <div
            className={`
              absolute
              inset-0
              transition-transform
              duration-[1500ms]
              ease-out
              ${
                inView
                  ? "scale-100"
                  : "scale-[1.08]"
              }
            `}
          >
            <Image
              src="/hero/womanHero.png"
              alt="A woman sitting comfortably at home using her phone"
              fill
              priority
              sizes="(min-width: 1280px) 53vw, (min-width: 1024px) 50vw, 0px"
              className="
                object-cover
                object-center
              "
            />
          </div>

          {/* White-to-photo transition */}
          <div
            aria-hidden="true"
            className="
              pointer-events-none
              absolute
              inset-0
              bg-[linear-gradient(90deg,#ffffff_0%,rgba(255,255,255,0.96)_5%,rgba(255,255,255,0.82)_13%,rgba(255,255,255,0.60)_23%,rgba(255,255,255,0.34)_34%,rgba(255,255,255,0.15)_44%,rgba(255,255,255,0.04)_53%,rgba(255,255,255,0)_63%)]
            "
          />

          {/* Soft ambient transition */}
          <div
            aria-hidden="true"
            className="
              pointer-events-none
              absolute
              inset-0
              bg-[radial-gradient(circle_at_8%_50%,rgba(255,255,255,0.48)_0%,rgba(255,255,255,0.18)_26%,rgba(255,255,255,0)_56%)]
            "
          />

          {/* Subtle lower photo depth */}
          <div
            aria-hidden="true"
            className="
              pointer-events-none
              absolute
              inset-x-0
              bottom-0
              h-[24%]
              bg-gradient-to-t
              from-black/[0.04]
              to-transparent
            "
          />

          {/* Study duration badge */}
          <div
            className={`
              absolute
              bottom-[135px]
              left-8
              z-10
              rounded-[12px]
              border
              border-white/80
              bg-white/90
              px-4
              py-3
              shadow-[0_8px_30px_rgba(0,0,0,0.08)]
              backdrop-blur-md
              transition-all
              delay-[500ms]
              duration-700
              ease-out
              ${
                inView
                  ? "translate-y-0 scale-100 opacity-100"
                  : "translate-y-8 scale-95 opacity-0"
              }
            `}
          >
            <p
              className="
                text-[9px]
                font-normal
                uppercase
                tracking-[0.14em]
                text-black/50
              "
            >
              Study duration
            </p>

            <p
              className="
                mt-1
                text-[18px]
                font-normal
                tracking-[-0.02em]
                text-blue-900
              "
            >
              Four weeks
            </p>
          </div>
        </div>
      </div>

      {/* =====================================================
          BOTTOM ORANGE CURVE — desktop/tablet decorative layer
      ====================================================== */}
      <div
        aria-hidden="true"
        className={`
          pointer-events-none
          absolute
          inset-x-0
          bottom-[50px]
          z-30
          hidden
          h-[245px]
          transition-all
          duration-[1200ms]
          ease-out
          sm:block
          sm:bottom-[60px]
          sm:h-[260px]
          md:bottom-[70px]
          md:h-[290px]
          lg:bottom-[80px]
          lg:h-[245px]
          ${
            inView
              ? "translate-y-0 opacity-100"
              : "translate-y-16 opacity-0"
          }
        `}
      >
        <svg
          viewBox="0 0 1440 134"
          preserveAspectRatio="none"
          className="block h-full w-full -scale-y-100"
        >
          <path
            d="
              M0 0
              L1440 0
              L1440 74
              C1355 90 1275 100 1170 82
              C1045 60 935 28 795 35
              C665 41 590 58 445 60
              C310 61 170 37 0 8
              Z
            "
            fill="#F2B134"
          />
        </svg>
      </div>

      {/* =====================================================
          BOTTOM S-CURVE
      ====================================================== */}
      <div
        aria-hidden="true"
        className={`
          pointer-events-none
          absolute
          inset-x-0
          bottom-[30px]
          z-40
          hidden
          h-[230px]
          transition-all
          duration-[1200ms]
          ease-out
          sm:block
          sm:bottom-[40px]
          sm:h-[270px]
          md:bottom-[50px]
          md:h-[300px]
          lg:bottom-[60px]
          lg:h-[270px]
          ${
            inView
              ? "translate-y-0 opacity-100"
              : "translate-y-16 opacity-0"
          }
        `}
      >
        <svg
          viewBox="0 0 1440 120"
          preserveAspectRatio="none"
          className="block h-full w-full"
        >
          <path
            d="
              M0 110
              C170 78 310 62 445 68
              C590 74 665 92 795 94
              C935 96 1045 66 1170 54
              C1275 44 1355 47 1440 58
              L1440 120
              L0 120
              Z
            "
            fill="white"
          />
        </svg>
      </div>
    </section>
  )
}