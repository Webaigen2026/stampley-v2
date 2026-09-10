"use client"

import { useState, Suspense, type ReactNode } from "react"
import { useSearchParams } from "next/navigation"
import Link from "next/link"
import Image from "next/image"
import { resetPassword } from "@/actions/password-reset"
import AuthBackgroundDecoration from "@/components/auth/AuthBackgroundDecoration"

function ResetAuthLayout({
  leftEyebrow,
  leftHeading,
  leftDescription,
  children,
}: {
  leftEyebrow: string
  leftHeading: ReactNode
  leftDescription: string
  children: React.ReactNode
}) {
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
            src="/auth/womanreset.png"
            alt="A woman looking thoughtfully toward a bright window"
            fill
            priority
            sizes="(min-width: 1024px) 58vw, 100vw"
            className="
              object-cover
              object-[58%_18%]
              lg:object-[62%_16%]
            "
          />

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

          
          </Link>

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
            <p className="mb-5 text-xs font-bold uppercase tracking-[0.35em] text-cyan-700">
              {leftEyebrow}
            </p>

            <h1 className="mb-5 max-w-[16ch] text-4xl font-light tracking-tight text-slate-950 md:text-5xl">
              {leftHeading}
            </h1>

            <p className="max-w-[36ch] text-lg leading-relaxed text-slate-600">
              {leftDescription}
            </p>
          </div>
        </section>

        <section
          className="
            relative
            flex
            flex-1
            items-center
            justify-center
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

          <div className="relative z-10 w-full max-w-[420px]">{children}</div>
        </section>
      </div>
    </main>
  )
}

function ResetPasswordForm() {
  const searchParams = useSearchParams()
  const token = searchParams.get("token")

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState(false)

  if (!token) {
    return (
      <ResetAuthLayout
        leftEyebrow="Account security"
        leftHeading={
          <>
            Create a new password
            <br />
            you&apos;ll remember.
          </>
        }
        leftDescription="Choose a strong, unique password to keep your AIDES-T2D account secure."
      >
      

        <p className="mt-8 mb-5 text-xs font-bold uppercase tracking-[0.35em] text-cyan-700">
          Password reset
        </p>

        <h2 className="text-4xl font-light tracking-tight text-slate-950 md:text-5xl">
          Invalid reset link.
        </h2>

        <p className="mt-5 text-lg leading-relaxed text-slate-600">
          This password reset link is invalid or missing. Please request a new
          one.
        </p>

        <Link
          href="/forgot-password"
          className="
            group
            mt-10
            flex
            h-[56px]
            w-full
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
          "
        >
          <span>Request new link</span>

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
        </Link>

        <p className="mt-8 text-center text-sm font-normal text-slate-600">
          <Link
            href="/login"
            className="
              text-sm
              font-normal
              text-slate-950
              underline
              decoration-black/25
              underline-offset-4
              transition
              hover:decoration-black
            "
          >
            ← Back to sign in
          </Link>
        </p>
      </ResetAuthLayout>
    )
  }

  if (success) {
    return (
      <ResetAuthLayout
        leftEyebrow="Account security"
        leftHeading={
          <>
            Your password
            <br />
            is updated.
          </>
        }
        leftDescription="You can now sign in using your new password."
      >
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

        <div className="mt-8 mb-8">
          <style>{`
            @keyframes pulseRing {
              0%   { transform: scale(0.95); opacity: 0.6; }
              100% { transform: scale(1.15); opacity: 0; }
            }
            .pulse-ring::before {
              content: '';
              position: absolute; inset: -8px;
              border-radius: 50%;
              border: 1.5px solid rgba(23,59,122,0.3);
              animation: pulseRing 2s ease-out infinite;
            }
          `}</style>
          <div
            className="
              pulse-ring
              relative
              flex
              h-[72px]
              w-[72px]
              items-center
              justify-center
              rounded-full
              border
              border-[#173B7A]/20
              bg-[#173B7A]/[0.06]
            "
          >
            <svg
              className="h-[30px] w-[30px]"
              viewBox="0 0 24 24"
              fill="none"
              stroke="#173B7A"
              strokeWidth="1.4"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <path d="M5 13l4 4L19 7" />
            </svg>
          </div>
        </div>

        <p className="mb-5 text-xs font-bold uppercase tracking-[0.35em] text-cyan-700">
          Password updated
        </p>

        <h2 className="text-4xl font-light tracking-tight text-slate-950 md:text-5xl">
          Password reset successfully.
        </h2>

        <p className="mt-5 text-lg leading-relaxed text-slate-600">
          Your password has been updated. You can now sign in with your new
          password.
        </p>

        <Link
          href="/login"
          className="
            group
            mt-10
            flex
            h-[56px]
            w-full
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
          "
        >
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
        </Link>
      </ResetAuthLayout>
    )
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    setError("")

    const formData = new FormData(e.currentTarget)
    formData.append("token", token!)
    const result = await resetPassword(formData)

    if (result?.error) {
      setError(result.error)
      setLoading(false)
    } else {
      setSuccess(true)
    }
  }

  return (
    <ResetAuthLayout
      leftEyebrow="Account security"
      leftHeading={
        <>
          Create a new password
          <br />
          you&apos;ll remember.
        </>
      }
      leftDescription="Choose a strong, unique password to keep your AIDES-T2D account secure."
    >
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

      <p className="mt-8 mb-5 text-xs font-bold uppercase tracking-[0.35em] text-cyan-700">
        Reset your password
      </p>

      <h2 className="text-4xl font-light tracking-tight text-slate-950 md:text-5xl">
        Set new password.
      </h2>

      <p className="mt-5 text-lg leading-relaxed text-slate-600">
        Choose a strong password to regain access to your AIDES-T2D account.
      </p>

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

      <form onSubmit={handleSubmit} className="mt-10 flex flex-col gap-6">
        <div className="flex flex-col gap-2.5">
          <label
            htmlFor="password"
            className="text-sm font-normal text-slate-950"
          >
            New Password
          </label>

          <input
            id="password"
            name="password"
            type="password"
            placeholder="••••••••"
            required
            minLength={8}
            disabled={loading}
            className="
              auth-input
              h-[56px]
              w-full
              rounded-[10px]
              border
              border-[#86868b]
              bg-white
              px-4
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

          <p className="pl-1 text-xs font-normal text-slate-600">
            Minimum 8 characters
          </p>
        </div>

        <div className="flex flex-col gap-2.5">
          <label
            htmlFor="confirmPassword"
            className="text-sm font-normal text-slate-950"
          >
            Confirm New Password
          </label>

          <input
            id="confirmPassword"
            name="confirmPassword"
            type="password"
            placeholder="••••••••"
            required
            minLength={8}
            disabled={loading}
            className="
              auth-input
              h-[56px]
              w-full
              rounded-[10px]
              border
              border-[#86868b]
              bg-white
              px-4
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

        <div className="flex flex-col gap-2 pl-1">
          <p className="text-xs font-normal text-slate-600">
            Password requirements
          </p>
          <p className="flex items-center gap-2 text-xs font-normal text-slate-600">
            <span
              aria-hidden="true"
              className="h-1.5 w-1.5 rounded-full bg-slate-400"
            />
            At least 8 characters
          </p>
          <p className="flex items-center gap-2 text-xs font-normal text-slate-600">
            <span
              aria-hidden="true"
              className="h-1.5 w-1.5 rounded-full bg-slate-400"
            />
            Both passwords must match
          </p>
        </div>

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

              <span>Updating...</span>
            </div>
          ) : (
            <>
              <span>Reset password</span>

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

      <p className="mt-8 text-center text-sm font-normal text-slate-600">
        <Link
          href="/login"
          className="
            text-sm
            font-normal
            text-slate-950
            underline
            decoration-black/25
            underline-offset-4
            transition
            hover:decoration-black
          "
        >
          ← Back to sign in
        </Link>
      </p>
    </ResetAuthLayout>
  )
}

export default function ResetPasswordPage() {
  return (
    <Suspense
      fallback={
        <div
          className="
            flex
            min-h-dvh
            items-center
            justify-center
            bg-white
            font-['Outfit',system-ui,sans-serif]
          "
        >
          <div className="text-sm text-slate-600">Loading...</div>
        </div>
      }
    >
      <ResetPasswordForm />
    </Suspense>
  )
}
