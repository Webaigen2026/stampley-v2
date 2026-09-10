"use client"

import { useState } from "react"
import Link from "next/link"
import Image from "next/image"
import {
  ArrowLeft,
  ArrowRight,
  CircleAlert,
  Mail,
  ShieldCheck,
} from "lucide-react"

import { requestPasswordReset } from "@/actions/password-reset"
import AuthBackgroundDecoration from "@/components/auth/AuthBackgroundDecoration"

export default function ForgotPasswordPage() {
  const [submitted, setSubmitted] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()

    setLoading(true)
    setError("")

    const formData = new FormData(e.currentTarget)
    const result = await requestPasswordReset(formData)

    if (result?.error) {
      setError(result.error)
      setLoading(false)
      return
    }

    setSubmitted(true)
    setLoading(false)
  }

  if (submitted) {
    return (
      <main
        className="
          min-h-dvh
          bg-white
          font-['Outfit',system-ui,sans-serif]
          text-black
        "
      >
        <div className="flex min-h-dvh flex-col lg:flex-row">
          {/* ======================================================
              IMAGE / EDITORIAL PANEL
          ====================================================== */}
          <section
            className="
              relative
              h-[270px]
              shrink-0
              overflow-hidden
              sm:h-[320px]
              lg:h-dvh
              lg:w-[55%]
            "
          >
            <Image
              src="/auth/woman3.png"
              alt="A woman sitting thoughtfully near a bright window"
              fill
              priority
              sizes="(min-width: 1024px) 55vw, 100vw"
              className="
                object-cover
                object-[58%_30%]
                lg:object-[60%_32%]
              "
            />

            {/* White overlays */}
            <div
              className="
                pointer-events-none
                absolute
                inset-0
                bg-gradient-to-r
                from-white/90
                via-white/25
                to-transparent
              "
            />

            <div
              className="
                pointer-events-none
                absolute
                inset-0
                bg-gradient-to-t
                from-white/90
                via-white/10
                to-transparent
                lg:from-white/60
              "
            />

            {/* Brand */}
            <Link
              href="/"
              className="
                absolute
                left-5
                top-5
                z-10
                flex
                items-center
                gap-3
                text-black
                sm:left-7
                sm:top-7
                lg:left-10
                lg:top-9
              "
            >
              <Image
                src="/images/stampleyLogo.png"
                alt=""
                width={30}
                height={30}
                className="h-[30px] w-auto"
              />

             
            </Link>

            {/* Editorial copy */}
            <div
              className="
                absolute
                bottom-5
                left-5
                right-5
                z-10
                max-w-[520px]
                sm:bottom-7
                sm:left-7
                lg:bottom-12
                lg:left-10
                lg:right-auto
              "
            >
              <p className="mb-5 text-xs font-bold uppercase tracking-[0.35em] text-cyan-700">
                Account support
              </p>

              <h1 className="max-w-[20ch] text-4xl font-light tracking-tight text-slate-950 md:text-5xl">
                Check your inbox.
              </h1>

              <p className="mt-5 max-w-[38ch] text-lg leading-relaxed text-slate-600">
                If an account exists for that email address, a secure reset
                link has been sent.
              </p>
            </div>
          </section>

          {/* ======================================================
              SUCCESS PANEL
          ====================================================== */}
          <section
            className="
              relative
              flex
              flex-1
              items-center
              justify-center
              overflow-hidden
              bg-white
              px-6
              py-12
              sm:px-10
              lg:w-[45%]
              lg:px-12
              lg:py-16
              xl:px-16
            "
          >
            <AuthBackgroundDecoration />

            <div className="relative z-10 w-full max-w-[420px]">
              {/* Logo + heading */}
              <Link
                href="/"
                className="inline-flex items-center"
                aria-label="Go to AIDES-T2D home"
              >
                <Image
                  src="/images/stampleyLogo.png"
                  alt="AIDES-T2D"
                  width={36}
                  height={36}
                  className="
                    h-9
                    w-auto
                    transition-transform
                    duration-200
                    hover:scale-[1.03]
                  "
                />
              </Link>

              <p className="mt-8 text-xs font-bold uppercase tracking-[0.35em] text-cyan-700">
                Account support
              </p>

              <h2 className="mt-5 text-4xl font-light tracking-tight text-slate-950 md:text-5xl">
                Check your email.
              </h2>

              <p className="mt-5 text-lg leading-relaxed text-slate-600">
                If an account exists for that email address, we&apos;ve sent
                a password reset link. Follow the instructions in the email
                to continue.
              </p>

              {/* Info panel */}
              <div
                className="
                  mt-8
                  rounded-[10px]
                  border
                  border-[#86868b]
                  bg-white
                  px-4
                  py-4
                "
              >
                <div className="flex items-start gap-3">
                  <Mail
                    aria-hidden="true"
                    strokeWidth={1.5}
                    className="mt-0.5 h-4 w-4 shrink-0 text-black"
                  />

                  <p
                    className="
                      text-[13px]
                      font-normal
                      leading-5
                      text-black
                    "
                  >
                    Click the reset link in the email to choose a new password.
                    The link expires in 1 hour.
                  </p>
                </div>
              </div>

              {/* Back to sign in */}
              <Link
                href="/login"
                className="
                  group
                  mt-8
                  flex
                  h-[56px]
                  w-full
                  items-center
                  justify-between
                  rounded-[10px]
                  border
                  border-[#86868b]
                  bg-white
                  px-5
                  text-[14px]
                  font-normal
                  tracking-[-0.005em]
                  text-black
                  transition-all
                  duration-200
                  hover:border-black
                  hover:bg-black/[0.02]
                  focus-visible:outline-none
                  focus-visible:ring-2
                  focus-visible:ring-[#1473E6]
                  focus-visible:ring-offset-2
                "
              >
                <span>Back to sign in</span>

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
                    border-black/35
                    bg-white
                    text-black
                    transition-all
                    duration-200
                    group-hover:border-black/60
                    group-hover:bg-black/[0.025]
                  "
                >
                  <ArrowLeft
                    aria-hidden="true"
                    strokeWidth={1.8}
                    className="h-[15px] w-[15px]"
                  />
                </span>
              </Link>

              {/* Privacy */}
              <div
                className="
                  mt-8
                  flex
                  items-center
                  justify-center
                  gap-2
                  border-t
                  border-black/[0.08]
                  pt-6
                  text-center
                  text-[11.5px]
                  font-normal
                  leading-5
                  text-black
                "
              >
                <ShieldCheck
                  aria-hidden="true"
                  strokeWidth={1.5}
                  className="h-[13px] w-[13px] shrink-0 text-black"
                />

                <span>
                  Your information is handled securely and confidentially.
                </span>
              </div>
            </div>
          </section>
        </div>
      </main>
    )
  }

  return (
    <main
      className="
        min-h-dvh
        bg-white
        font-['Outfit',system-ui,sans-serif]
        text-black
      "
    >
      <div className="flex min-h-dvh flex-col lg:flex-row">
        {/* ======================================================
            IMAGE / EDITORIAL PANEL
        ====================================================== */}
        <section
          className="
            relative
            h-[270px]
            shrink-0
            overflow-hidden
            sm:h-[320px]
            lg:h-dvh
            lg:w-[55%]
          "
        >
          <Image
            src="/auth/woman3.png"
            alt="A woman sitting thoughtfully near a bright window"
            fill
            priority
            sizes="(min-width: 1024px) 55vw, 100vw"
            className="
              object-cover
              object-[58%_30%]
              lg:object-[60%_32%]
            "
          />

          {/* White overlays */}
          <div
            className="
              pointer-events-none
              absolute
              inset-0
              bg-gradient-to-r
              from-white/90
              via-white/25
              to-transparent
            "
          />

          <div
            className="
              pointer-events-none
              absolute
              inset-0
              bg-gradient-to-t
              from-white/90
              via-white/10
              to-transparent
              lg:from-white/60
            "
          />

          {/* Brand */}
          <Link
            href="/"
            className="
              absolute
              left-5
              top-5
              z-10
              flex
              items-center
              gap-3
              text-black
              sm:left-7
              sm:top-7
              lg:left-10
              lg:top-9
            "
          >
            <Image
              src="/images/stampleyLogo.png"
              alt=""
              width={30}
              height={30}
              className="h-[30px] w-auto"
            />

            <span
              className="
                text-[10px]
                uppercase
                tracking-[0.18em]
                text-blue-900
              "
            >
              AIDES-T2D
            </span>
          </Link>

          {/* Editorial copy */}
          <div
            className="
              absolute
              bottom-5
              left-5
              right-5
              z-10
              max-w-[520px]
              sm:bottom-7
              sm:left-7
              lg:bottom-12
              lg:left-10
              lg:right-auto
            "
          >
            <p className="mb-5 text-xs font-bold uppercase tracking-[0.35em] text-cyan-700">
              Account support
            </p>

            <h1 className="max-w-[20ch] text-4xl font-light tracking-tight text-slate-950 md:text-5xl">
              It&apos;s okay to reset.
            </h1>

            <p className="mt-5 max-w-[38ch] text-lg leading-relaxed text-slate-600">
              We&apos;ll help you get back into your account so you can
              continue your AIDES-T2D journey.
            </p>
          </div>
        </section>

        {/* ======================================================
            FORM PANEL
        ====================================================== */}
        <section
          className="
            relative
            flex
            flex-1
            items-center
            justify-center
            overflow-hidden
            bg-white
            px-6
            py-12
            sm:px-10
            lg:w-[45%]
            lg:px-12
            lg:py-16
            xl:px-16
          "
        >
          <AuthBackgroundDecoration />

          <div className="relative z-10 w-full max-w-[420px]">
           

            <p className="mt-8 text-xs font-bold uppercase tracking-[0.35em] text-cyan-700">
              Account support
            </p>

            <h2 className="mt-5 text-4xl font-light tracking-tight text-slate-950 md:text-5xl">
              Forgot password?
            </h2>


            {/* Error */}
            {error && (
              <div
                role="alert"
                className="
                  mt-7
                  flex
                  items-start
                  gap-3
                  px-4
                  py-3.5
                  text-[13px]
                  leading-5
                  text-red-800
                "
              >
                <CircleAlert
                  aria-hidden="true"
                  strokeWidth={1.7}
                  className="mt-0.5 h-4 w-4 shrink-0"
                />

                <span>{error}</span>
              </div>
            )}

            {/* Form */}
            <form
              onSubmit={handleSubmit}
              className="mt-10 flex flex-col gap-6"
            >
              <div className="flex flex-col gap-2.5">
                <label
                  htmlFor="email"
                  className="text-sm font-normal text-slate-950"
                >
                  Email address
                </label>

                <div className="relative">
                  <Mail
                    aria-hidden="true"
                    strokeWidth={1.5}
                    className="
                      pointer-events-none
                      absolute
                      left-4
                      top-1/2
                      h-4
                      w-4
                      -translate-y-1/2
                      text-black
                    "
                  />

                  <input
                    id="email"
                    name="email"
                    type="email"
                    placeholder="you@email.com"
                    required
                    disabled={loading}
                    autoComplete="email"
                    className="
                      auth-input
                      h-[56px]
                      w-full
                      rounded-[10px]
                      border
                      border-[#86868b]
                      bg-white
                      pl-11
                      pr-4
                      text-base
                      font-normal
                      text-slate-950
                      outline-none
                      transition-all
                      duration-200
                      placeholder:text-slate-400
                      focus:border-[#1473E6]
                      focus:ring-[2px]
                      focus:ring-[#1473E6]
                      disabled:cursor-not-allowed
                      disabled:opacity-50
                    "
                  />
                </div>
              </div>

              {/* Primary action */}
              <button
                type="submit"
                disabled={loading}
                className="
                  group
                  mt-1
                  flex
                  h-[56px]
                  w-full
                  cursor-pointer
                  items-center
                  justify-between
                  rounded-[10px]
                  bg-[#173B7A]
                  px-5
                  text-[14px]
                  font-normal
                  tracking-[-0.005em]
                  text-white
                  transition-all
                  duration-200
                  hover:bg-[#122E60]
                  active:scale-[0.995]
                  disabled:cursor-not-allowed
                  disabled:opacity-50
                "
              >
                {loading ? (
                  <div className="flex w-full items-center justify-center gap-2.5">
                    <span
                      className="
                        h-4
                        w-4
                        animate-spin
                        rounded-full
                        border-[1.5px]
                        border-white/30
                        border-t-white
                      "
                    />

                    <span>Sending...</span>
                  </div>
                ) : (
                  <>
                    <span>Send reset link</span>

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
                        bg-transparent
                        text-white
                        transition-all
                        duration-200
                        group-hover:border-white
                        group-hover:bg-white/[0.08]
                      "
                    >
                      <ArrowRight
                        aria-hidden="true"
                        strokeWidth={1.8}
                        className="h-[15px] w-[15px]"
                      />
                    </span>
                  </>
                )}
              </button>
            </form>

            {/* Back to login */}
            <Link
              href="/login"
              className="
                mt-8
                inline-flex
                items-center
                gap-2
                text-sm
                font-normal
                text-black
                underline
                decoration-black/25
                underline-offset-4
                transition
                hover:decoration-black
              "
            >
              <ArrowLeft
                aria-hidden="true"
                strokeWidth={1.8}
                className="h-4 w-4"
              />

              <span>Back to sign in</span>
            </Link>

            {/* Privacy */}
            <div
              className="
                mt-8
                flex
                items-center
                justify-center
                gap-2
                border-t
                border-black/[0.08]
                pt-6
                text-center
                text-[11.5px]
                font-normal
                leading-5
                text-black
              "
            >
              <ShieldCheck
                aria-hidden="true"
                strokeWidth={1.5}
                className="h-[13px] w-[13px] shrink-0 text-black"
              />

              <span>
                Your information is handled securely and confidentially.
              </span>
            </div>
          </div>
        </section>
      </div>
    </main>
  )
}