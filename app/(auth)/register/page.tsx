"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import Image from "next/image"
import {
  ArrowRight,
  CircleAlert,
  Eye,
  EyeOff,
  KeyRound,
  LockKeyhole,
  Mail,
  ShieldCheck,
} from "lucide-react"

import { registerWithKey } from "@/actions/register"
import AuthBackgroundDecoration from "@/components/auth/AuthBackgroundDecoration"

export default function RegisterPage() {
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)

  const router = useRouter()

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()

    setLoading(true)
    setError("")

    const formData = new FormData(e.currentTarget)

    const password = String(formData.get("password") || "")
    const confirmPassword = String(formData.get("confirmPassword") || "")

    if (password !== confirmPassword) {
      setError("Passwords do not match.")
      setLoading(false)
      return
    }

    const result = await registerWithKey(formData)

    if (result?.error) {
      setError(result.error)
      setLoading(false)
      return
    }

    router.push("/register/verify")
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
            lg:sticky
            lg:top-0
            lg:h-dvh
            lg:w-[52%]
          "
        >
          <Image
            src="/auth/women2.png"
            alt="A woman smiling while working on a laptop in a bright room"
            fill
            priority
            sizes="(min-width: 1024px) 52vw, 100vw"
            className="
              object-cover
              object-[66%_32%]
              lg:object-[62%_34%]
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
              max-w-[540px]
              sm:bottom-7
              sm:left-7
              lg:bottom-12
              lg:left-10
              lg:right-auto
            "
          >
            <p className="mb-5 text-xs font-bold uppercase tracking-[0.35em] text-cyan-700">
              Your next step
            </p>

            <h1 className="max-w-[20ch] text-4xl font-light tracking-tight text-slate-950 md:text-5xl">
              Your next step starts here.
            </h1>

            <p className="mt-5 max-w-[38ch] text-lg leading-relaxed text-slate-600">
              Create your account, verify your email, and continue your
              AIDES-T2D experience.
            </p>
          </div>
        </section>

        {/* ======================================================
            REGISTRATION PANEL
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
            lg:w-[48%]
            lg:px-12
            lg:py-16
            xl:px-16
          "
        >
          <AuthBackgroundDecoration />

          <div className="relative z-10 w-full max-w-[460px]">
            {/* Logo */}
            <Link
              href="/"
              className="inline-flex"
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

            <p className="mt-8 mb-5 text-xs font-bold uppercase tracking-[0.35em] text-cyan-700">
              Create your account
            </p>

            <h2 className="text-4xl font-light tracking-tight text-slate-950 md:text-5xl">
              Register.
            </h2>

            <p className="mt-5 text-lg leading-relaxed text-slate-600">
              Join the AIDES-T2D study and begin your participation.
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
                  rounded-xl
                  border
                  border-red-200
                  bg-red-50
                  px-4
                  py-3.5
                  text-[13px]
                  leading-5
                  text-black
                "
              >
                <CircleAlert
                  aria-hidden="true"
                  strokeWidth={1.7}
                  className="mt-0.5 h-4 w-4 shrink-0 text-black"
                />

                <span>{error}</span>
              </div>
            )}

            {/* Form */}
            <form
              onSubmit={handleSubmit}
              className="mt-10 flex flex-col gap-6"
            >
              {/* Study ID */}
              <div className="flex flex-col gap-2.5">
                <label
                  htmlFor="studyId"
                  className="
                    text-sm
                    font-normal
                    text-slate-950
                  "
                >
                  Study ID <span className="text-black">(optional)</span>
                </label>

                <div className="relative">
                  <KeyRound
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
                    id="studyId"
                    name="studyId"
                    type="text"
                    placeholder="AIDES-XXXXXX"
                    disabled={loading}
                    autoComplete="off"
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
                      uppercase
                      tracking-[0.04em]
                      text-slate-950
                      outline-none
                      transition-all
                      duration-200
                      placeholder:normal-case
                      placeholder:tracking-normal
                      placeholder:text-slate-400
                      focus:border-[#1473E6]
                      focus:ring-[2px]
                      focus:ring-[#1473E6]
                      disabled:cursor-not-allowed
                      disabled:opacity-50
                    "
                  />
                </div>

                <p
                  className="
                    pl-1
                    text-[12px]
                    font-normal
                    leading-5
                    text-black
                  "
                >
                  Optional. Use it if one was provided by the research team.
                </p>
              </div>

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

              {/* Password */}
              <div className="flex flex-col gap-2.5">
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

                <div className="relative">
                  <LockKeyhole
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
                    id="password"
                    name="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="••••••••"
                    required
                    minLength={8}
                    disabled={loading}
                    autoComplete="new-password"
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

                  <button
                    type="button"
                    onClick={() =>
                      setShowPassword((current) => !current)
                    }
                    aria-label={
                      showPassword ? "Hide password" : "Show password"
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
                      <EyeOff
                        aria-hidden="true"
                        strokeWidth={1.5}
                        className="h-[15px] w-[15px]"
                      />
                    ) : (
                      <Eye
                        aria-hidden="true"
                        strokeWidth={1.5}
                        className="h-[15px] w-[15px]"
                      />
                    )}
                  </button>
                </div>

                <p
                  className="
                    pl-1
                    text-[12px]
                    font-normal
                    leading-5
                    text-black
                  "
                >
                  Minimum 8 characters
                </p>
              </div>

              {/* Confirm Password */}
              <div className="flex flex-col gap-2.5">
                <label
                  htmlFor="confirmPassword"
                  className="
                    text-sm
                    font-normal
                    text-slate-950
                  "
                >
                  Confirm password
                </label>

                <div className="relative">
                  <LockKeyhole
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
                    id="confirmPassword"
                    name="confirmPassword"
                    type={showPassword ? "text" : "password"}
                    placeholder="••••••••"
                    required
                    minLength={8}
                    disabled={loading}
                    autoComplete="new-password"
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

              {/* Continue */}
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

                    <span>Sending code...</span>
                  </div>
                ) : (
                  <>
                    <span>Continue</span>

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

            {/* Existing account */}
            <p
              className="
                mt-8
                text-center
                text-sm
                font-normal
                leading-5
                text-black
              "
            >
              Already have an account?{" "}
              <Link
                href="/login"
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
                Sign in
              </Link>
         
         
            </p>

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