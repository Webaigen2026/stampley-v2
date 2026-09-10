"use client"

import { useState } from "react"

import { signIn } from "next-auth/react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import Image from "next/image"

import AuthBackgroundDecoration from "@/components/auth/AuthBackgroundDecoration"

export default function LoginPage() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)

  const router = useRouter()

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()

    setLoading(true)
    setError("")

    const result = await signIn("credentials", {
      email,
      password,
      redirect: false,
    })

    if (result?.error) {
      setError("Invalid email or password")
      setLoading(false)
      return
    }

    router.push("/dashboard")
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
            h-[260px]
            shrink-0
            overflow-hidden
            sm:h-[300px]
            lg:h-dvh
            lg:w-[58%]
          "
        >
          <Image
            src="/auth/woman.png"
            alt="A woman sitting peacefully in a bright room"
            fill
            priority
            sizes="(min-width: 1024px) 58vw, 100vw"
            className="
              object-cover
              object-[62%_20%]
              lg:object-[68%_18%]
            "
          />

          {/* Neutral white overlays */}
          <div
            aria-hidden="true"
            className="
              pointer-events-none
              absolute
              inset-0
              bg-gradient-to-r
              from-white/85
              via-white/25
              to-transparent
            "
          />

          <div
            aria-hidden="true"
            className="
              pointer-events-none
              absolute
              inset-0
              bg-gradient-to-t
              from-white/90
              via-white/10
              to-transparent
              lg:from-white/55
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
{/* 
            <span
              className="
                text-[10px]
                font-normal
                uppercase
                tracking-[0.18em]
                text-blue-900
              "
            >
              AIDES-T2D
            </span> */}
          </Link>

          {/* =====================================================
              EDITORIAL COPY
              Matches DiabetesVideoFeature typography
          ====================================================== */}
          <div
            className="
              absolute
              bottom-5
              left-5
              right-5
              z-10
              max-w-[560px]
              sm:bottom-7
              sm:left-7
              lg:bottom-12
              lg:left-10
              lg:right-auto
            "
          >
            {/* Same as "The Good Fight" */}
            <p
              className="
                mb-5
                text-xs
                font-bold
                uppercase
                tracking-[0.35em]
                text-cyan-700
              "
            >
              Everyday support
            </p>

            {/* Same as "It All Matters" */}
            <h1
              className="
                mb-5
                max-w-[13ch]
                text-4xl
                font-light
                tracking-tight
                text-slate-950
                md:text-5xl
              "
            >
              Support that meets you where you are.
            </h1>

            {/* Same as DiabetesVideoFeature body copy */}
            <p
              className="
                max-w-[34ch]
                text-lg
                leading-relaxed
                text-slate-600
              "
            >
              A private space to reflect, check in, and move forward one day
              at a time.
            </p>
          </div>
        </section>

        {/* ======================================================
            LOGIN PANEL
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
            lg:w-[42%]
            lg:px-12
            lg:py-16
            xl:px-16
          "
        >
          <AuthBackgroundDecoration />

          <div className="relative z-10 w-full max-w-[420px]">
            {/* Logo */}
            <Link
              href="/"
              className="inline-flex items-center"
              aria-label="Go to AIDES-T2D home"
            >
              <Image
                src="/images/stampleyLogo.png"
                alt="AIDES-T2D"
                width={40}
                height={40}
                className="
                  h-10
                  w-auto
                  transition-transform
                  duration-200
                  hover:scale-[1.03]
                "
              />
            </Link>

            {/* =====================================================
                LOGIN INTRO
                Same typography system as DiabetesVideoFeature
            ====================================================== */}

            {/* Same eyebrow typography */}
            <p
              className="
                mb-5
                mt-8
                text-xs
                font-bold
                uppercase
                tracking-[0.35em]
                text-cyan-700
              "
            >
              Welcome back
            </p>

            {/* Same major heading typography */}
            <h1
              className="
                text-4xl
                font-light
                tracking-tight
                text-slate-950
                md:text-5xl
              "
            >
              Sign in.
            </h1>

            {/* Same descriptive typography */}
            <p
              className="
                mt-5
                text-lg
                leading-relaxed
                text-slate-600
              "
            >
              Continue your AIDES-T2D study participation.
            </p>

            {/* Error */}
            {error && (
              <div
                role="alert"
                className="
                  mt-7
                  flex
                  items-start
                  gap-3
                  rounded-[8px]
                  bg-red-50
                  px-4
                  py-3.5
                  text-sm
                  font-normal
                  leading-5
                  text-red-800
                "
              >
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="mt-0.5 h-4 w-4 shrink-0"
                  aria-hidden="true"
                >
                  <circle cx="12" cy="12" r="10" />
                  <path d="M12 8v5" />
                  <path d="M12 16.5h.01" />
                </svg>

                <span>{error}</span>
              </div>
            )}

            {/* =====================================================
                FORM
            ====================================================== */}
            <form
              onSubmit={handleSubmit}
              className="mt-10 flex flex-col gap-6"
            >
              {/* Email */}
              <div className="flex flex-col gap-2.5">
                <label
                  htmlFor="email"
                  className="
                    text-sm
                    font-normal
                    text-slate-950
                  "
                >
                  Email address
                </label>

                <div className="relative">
                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    aria-hidden="true"
                    className="
                      pointer-events-none
                      absolute
                      left-4
                      top-1/2
                      h-4
                      w-4
                      -translate-y-1/2
                      text-slate-700
                    "
                  >
                    <rect
                      x="3"
                      y="5"
                      width="18"
                      height="14"
                      rx="2.5"
                    />

                    <path d="m4 8 8 6 8-6" />
                  </svg>

                  <input
                    id="email"
                    name="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
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

              {/* Password */}
              <div className="flex flex-col gap-2.5">
                <div className="flex items-center justify-between gap-4">
                  <label
                    htmlFor="password"
                    className="
                      text-sm
                      font-normal
                      text-slate-950
                    "
                  >
                    Password
                  </label>

                  <Link
                    href="/forgot-password"
                    className="
                      text-sm
                      font-normal
                      text-slate-700
                      transition-colors
                      duration-200
                      hover:text-[#173B7A]
                    "
                  >
                    Forgot password?
                  </Link>
                </div>

                <div className="relative">
                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    aria-hidden="true"
                    className="
                      pointer-events-none
                      absolute
                      left-4
                      top-1/2
                      h-4
                      w-4
                      -translate-y-1/2
                      text-slate-700
                    "
                  >
                    <rect
                      x="4"
                      y="11"
                      width="16"
                      height="10"
                      rx="2.2"
                    />

                    <path d="M8 11V8a4 4 0 0 1 8 0v3" />
                  </svg>

                  <input
                    id="password"
                    name="password"
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    required
                    disabled={loading}
                    autoComplete="current-password"
                    className="
                      auth-input
                      h-[56px]
                      w-full
                      rounded-[10px]
                      border
                      border-[#86868b]
                      bg-white
                      pl-11
                      pr-14
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

                  {/* Password visibility */}
                  <button
                    type="button"
                    onClick={() =>
                      setShowPassword((current) => !current)
                    }
                    aria-label={
                      showPassword
                        ? "Hide password"
                        : "Show password"
                    }
                    className="
                      absolute
                      right-3
                      top-1/2
                      flex
                      h-8
                      w-8
                      -translate-y-1/2
                      cursor-pointer
                      items-center
                      justify-center
                      rounded-full
                      border
                      border-black/35
                      bg-white
                      text-black
                      transition-all
                      duration-200
                      hover:border-black/60
                      hover:bg-black/[0.025]
                      focus-visible:outline-none
                      focus-visible:ring-2
                      focus-visible:ring-[#1473E6]
                      focus-visible:ring-offset-2
                    "
                  >
                    {showPassword ? (
                      <svg
                        width="15"
                        height="15"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="1.6"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        aria-hidden="true"
                      >
                        <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94" />
                        <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19" />
                        <path d="m14.12 14.12a3 3 0 1 1-4.24-4.24" />
                        <line
                          x1="1"
                          y1="1"
                          x2="23"
                          y2="23"
                        />
                      </svg>
                    ) : (
                      <svg
                        width="15"
                        height="15"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="1.6"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        aria-hidden="true"
                      >
                        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                        <circle
                          cx="12"
                          cy="12"
                          r="3"
                        />
                      </svg>
                    )}
                  </button>
                </div>
              </div>

              {/* Submit */}
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
                  text-sm
                  font-normal
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

                    <span>Signing in...</span>
                  </div>
                ) : (
                  <>
                    <span>Sign in</span>

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
                      <svg
                        width="15"
                        height="15"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="1.8"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        aria-hidden="true"
                      >
                        <path d="M5 12h14" />
                        <path d="m13 6 6 6-6 6" />
                      </svg>
                    </span>
                  </>
                )}
              </button>
            </form>

            {/* Registration */}
            <p
              className="
                mt-8
                text-center
                text-sm
                font-normal
                leading-5
                text-slate-700
              "
            >
              New to AIDES-T2D?{" "}

              <Link
                href="/register"
                className="
                  font-bold
                  text-blue-900
                  underline
                  decoration-blue-400/40
                  underline-offset-4
                  transition
                  hover:decoration-blue-700
                  text-base
                "
              >
                Create an account
              </Link>
            </p>

            {/* Trust message */}
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
                text-xs
                font-normal
                leading-5
                text-slate-600
              "
            >
              <svg
                width="13"
                height="13"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
                className="shrink-0"
              >
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
              </svg>

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