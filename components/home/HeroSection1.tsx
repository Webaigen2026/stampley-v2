import Image from "next/image"
import Link from "next/link"
import {
  ArrowRight,
  Clock3,
  Laptop,
  ShieldCheck,
} from "lucide-react"

export default function HeroSection() {
  return (
    <section
      className="
        relative
        overflow-hidden
        bg-white
        font-[AmericanSansLight,Helvetica,Arial,sans-serif]
        text-black
      "
    >
      <div
        className="
          mx-auto
          grid
          min-h-[680px]
          max-w-[1440px]
          grid-cols-1
          lg:grid-cols-[0.94fr_1.06fr]
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
            px-6
            py-16
            sm:px-10
            lg:px-14
            lg:py-20
            xl:px-20
          "
        >
          {/* Soft blue ambient wash */}
          <div
            aria-hidden="true"
            className="
              pointer-events-none
              absolute
              inset-0
              bg-[radial-gradient(circle_at_12%_12%,rgba(30,64,175,0.06)_0%,rgba(30,64,175,0.02)_30%,transparent_58%)]
            "
          />

          {/* Secondary soft wash */}
          <div
            aria-hidden="true"
            className="
              pointer-events-none
              absolute
              -bottom-[180px]
              -right-[160px]
              h-[420px]
              w-[420px]
              rounded-full
              bg-blue-500/[0.035]
              blur-3xl
            "
          />

          {/* Decorative rings */}
          <div
            aria-hidden="true"
            className="
              pointer-events-none
              absolute
              -right-[210px]
              top-[80px]
              h-[520px]
              w-[520px]
              rounded-full
              border
              border-blue-900/[0.055]
            "
          />

          <div
            aria-hidden="true"
            className="
              pointer-events-none
              absolute
              -right-[135px]
              top-[155px]
              h-[370px]
              w-[370px]
              rounded-full
              border
              border-blue-900/[0.035]
            "
          />

          {/* Small dot matrix */}
          <div
            aria-hidden="true"
            className="
              pointer-events-none
              absolute
              right-[8%]
              top-[9%]
              grid
              grid-cols-4
              gap-[9px]
              opacity-[0.12]
            "
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
          <div className="relative z-10 w-full max-w-[570px]">
            {/* Eyebrow */}
            {/* <div
              className="
                mb-5
                flex
                items-center
                gap-3
              "
            >
              <span
                className="
                  h-[6px]
                  w-[6px]
                  rounded-full
                  bg-blue-900
                "
              />

              <span
                className="
                  text-[10px]
                  font-normal
                  uppercase
                  tracking-[0.16em]
                  text-black/50
                "
              >
                AIDES-T2D Study
              </span>
            </div> */}

            {/* Heading */}
            <h1
              className="
                max-w-[12ch]
                text-[30px]
                font-normal
                leading-[1.08]
                tracking-[-0.03em]
                text-blue-900
                sm:text-[34px]
                lg:text-[38px]
                xl:text-[42px]
              "
            >
              We&apos;re glad{" "}
              <span className="text-blue-900">
                you&apos;re here.
              </span>
            </h1>

            {/* Intro */}
            <p
              className="
                mt-7
                max-w-[530px]
                text-[16px]
                font-normal
                leading-[1.8]
                tracking-[-0.01em]
                text-black/75
                sm:text-[17px]
              "
            >
              AIDES-T2D is a four-week study designed to understand how AI
              can provide emotional support for people living with Type 2
              Diabetes.
            </p>

            {/* Main commitment */}
            <div
              className="
                mt-9
                border-l-[3px]
                border-blue-900
                pl-5
              "
            >
              <p
                className="
                  text-[19px]
                  font-normal
                  leading-[1.35]
                  tracking-[-0.02em]
                  text-blue-900
                  sm:text-[21px]
                "
              >
                Complete at least five study sessions each week.
              </p>

              <p
                className="
                  mt-3
                  max-w-[500px]
                  text-[14px]
                  font-normal
                  leading-[1.7]
                  text-black/70
                  sm:text-[15px]
                "
              >
                A session includes a brief check-in and a conversation with
                Stampley.
              </p>
            </div>

            {/* Study facts */}
            <div
              className="
                mt-9
                grid
                grid-cols-1
                gap-3
                sm:grid-cols-2
              "
            >
              <div
                className="
                  flex
                  items-center
                  gap-3
                  rounded-[12px]
                  border
                  border-[#86868b]
                  bg-white/95
                  px-4
                  py-3.5
                  backdrop-blur-sm
                "
              >
                <div
                  className="
                    flex
                    h-9
                    w-9
                    shrink-0
                    items-center
                    justify-center
                    rounded-full
                    border
                    border-black/10
                    bg-black/[0.025]
                  "
                >
                  <Clock3
                    aria-hidden="true"
                    strokeWidth={1.5}
                    className="
                      h-[17px]
                      w-[17px]
                      text-black/75
                    "
                  />
                </div>

                <div>
                  <p
                    className="
                      text-[13px]
                      font-normal
                      leading-5
                      text-black
                    "
                  >
                    15–20 minutes
                  </p>

                  <p
                    className="
                      text-[11px]
                      leading-4
                      text-black/50
                    "
                  >
                    Approximately per session
                  </p>
                </div>
              </div>

              <div
                className="
                  flex
                  items-center
                  gap-3
                  rounded-[12px]
                  border
                  border-[#86868b]
                  bg-white/95
                  px-4
                  py-3.5
                  backdrop-blur-sm
                "
              >
                <div
                  className="
                    flex
                    h-9
                    w-9
                    shrink-0
                    items-center
                    justify-center
                    rounded-full
                    border
                    border-black/10
                    bg-black/[0.025]
                  "
                >
                  <Laptop
                    aria-hidden="true"
                    strokeWidth={1.5}
                    className="
                      h-[17px]
                      w-[17px]
                      text-black/75
                    "
                  />
                </div>

                <div>
                  <p
                    className="
                      text-[13px]
                      font-normal
                      leading-5
                      text-black
                    "
                  >
                    Participate anywhere
                  </p>

                  <p
                    className="
                      text-[11px]
                      leading-4
                      text-black/50
                    "
                  >
                    Phone, tablet, or computer
                  </p>
                </div>
              </div>
            </div>

            {/* CTA */}
            <div
              className="
                mt-9
                flex
                flex-col
                gap-5
                sm:flex-row
                sm:items-center
              "
            >
              <Link
                href="/login"
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
                  sm:w-[220px]
                "
              >
                <span>Sign in</span>

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

              {/* <div
                className="
                  flex
                  items-center
                  gap-2.5
                "
              >
                <ShieldCheck
                  aria-hidden="true"
                  strokeWidth={1.5}
                  className="
                    h-4
                    w-4
                    shrink-0
                    text-black/60
                  "
                />

                <span
                  className="
                    max-w-[210px]
                    text-[11px]
                    leading-[1.55]
                    text-black/55
                  "
                >
                  Secure access for enrolled study participants.
                </span>
              </div> */}
            </div>
          </div>
        </div>

        {/* =====================================================
            RIGHT — REALISTIC PARTICIPANT IMAGE
        ====================================================== */}
        <div
          className="
            relative
            min-h-[420px]
            overflow-hidden
            sm:min-h-[520px]
            lg:min-h-full
          "
        >
          <Image
            src="/hero/womanHero.png"
            alt="A woman sitting comfortably at home using her phone"
            fill
            priority
            sizes="(min-width: 1024px) 53vw, 100vw"
            className="
              object-cover
              object-center
            "
          />

          {/* White-to-photo transition */}
          <div
            aria-hidden="true"
            className="
              pointer-events-none
              absolute
              inset-0
              hidden
              lg:block
              lg:bg-[linear-gradient(90deg,#ffffff_0%,rgba(255,255,255,0.96)_5%,rgba(255,255,255,0.82)_13%,rgba(255,255,255,0.60)_23%,rgba(255,255,255,0.34)_34%,rgba(255,255,255,0.15)_44%,rgba(255,255,255,0.04)_53%,rgba(255,255,255,0)_63%)]
            "
          />

          {/* Soft ambient transition */}
          <div
            aria-hidden="true"
            className="
              pointer-events-none
              absolute
              inset-0
              hidden
              lg:block
              lg:bg-[radial-gradient(circle_at_8%_50%,rgba(255,255,255,0.48)_0%,rgba(255,255,255,0.18)_26%,rgba(255,255,255,0)_56%)]
            "
          />

          {/* Subtle lower depth */}
          <div
            aria-hidden="true"
            className="
              pointer-events-none
              absolute
              inset-x-0
              bottom-0
              hidden
              h-[24%]
              lg:block
              lg:bg-gradient-to-t
              lg:from-black/[0.04]
              lg:to-transparent
            "
          />

          {/* Mobile transition */}
          <div
            aria-hidden="true"
            className="
              pointer-events-none
              absolute
              inset-x-0
              top-0
              h-32
              bg-gradient-to-b
              from-white
              via-white/60
              to-transparent
              lg:hidden
            "
          />

          {/* Study duration badge */}
          <div
            className="
              absolute
              bottom-6
              left-5
              z-10
              rounded-[12px]
              border
              border-white/80
              bg-white/90
              px-4
              py-3
              shadow-[0_8px_30px_rgba(0,0,0,0.08)]
              backdrop-blur-md
              sm:bottom-7
              sm:left-7
              lg:bottom-8
              lg:left-8
            "
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
          BOTTOM UTILITY LINKS
      ====================================================== */}
      <div
        className="
          relative
          z-30
          border-t
          border-black/[0.08]
          bg-white
        "
      >
        <div
          className="
            mx-auto
            flex
            max-w-[1440px]
            flex-col
            gap-4
            px-6
            py-5
            sm:flex-row
            sm:items-center
            sm:justify-between
            sm:px-10
            lg:px-14
            xl:px-20
          "
        >
          {/* <p
            className="
              text-[11.5px]
              leading-5
              text-black
            "
          >
            Questions about the study or your participation? Contact the
            AIDES-T2D research team.
          </p> */}

          {/* <div
            className="
              flex
              items-center
              gap-5
              text-[11.5px]
              text-black
            "
          >
            <Link
              href="/privacy"
              className="
                underline
                decoration-black/25
                underline-offset-4
                transition
                hover:decoration-black
              "
            >
              Privacy Policy
            </Link>

            <Link
              href="/terms"
              className="
                underline
                decoration-black/25
                underline-offset-4
                transition
                hover:decoration-black
              "
            >
              Terms of Use
            </Link>
          </div> */}
        </div>
      </div>
    </section>
  )
}