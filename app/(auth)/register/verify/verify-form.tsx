"use client"

import { useEffect, useRef, useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import Image from "next/image"
import {
  ArrowLeft,
  ArrowRight,
  CircleAlert,
  MailCheck,
  RotateCcw,
  ShieldCheck,
} from "lucide-react"

import {
  resendRegistrationCode,
  verifyRegistration,
} from "@/actions/register"

import AuthBackgroundDecoration from "@/components/auth/AuthBackgroundDecoration"

export function RegisterVerifyForm({ email }: { email: string }) {
  const [digits, setDigits] = useState(["", "", "", "", "", ""])
  const [error, setError] = useState("")
  const [info, setInfo] = useState("")
  const [loading, setLoading] = useState(false)
  const [resending, setResending] = useState(false)

  const inputsRef = useRef<Array<HTMLInputElement | null>>([])
  const router = useRouter()

  useEffect(() => {
    inputsRef.current[0]?.focus()
  }, [])

  function setDigitAt(index: number, value: string) {
    const next = [...digits]
    next[index] = value
    setDigits(next)
    return next
  }

  async function submitCode(codeDigits: string[]) {
    const code = codeDigits.join("")

    if (code.length !== 6) {
      setError("Enter the 6-digit verification code.")
      return
    }

    setLoading(true)
    setError("")
    setInfo("")

    const formData = new FormData()
    formData.set("code", code)

    const result = await verifyRegistration(formData)

    if (result?.error) {
      setError(result.error)
      setLoading(false)
      setDigits(["", "", "", "", "", ""])
      inputsRef.current[0]?.focus()
      return
    }

    router.push("/login?message=Account created! Please sign in.")
  }

  function handleChange(index: number, raw: string) {
    const value = raw.replace(/\D/g, "").slice(-1)
    const next = setDigitAt(index, value)

    if (value && index < 5) {
      inputsRef.current[index + 1]?.focus()
    }

    if (value && next.every((digit) => digit.length === 1)) {
      void submitCode(next)
    }
  }

  function handleKeyDown(
    index: number,
    event: React.KeyboardEvent<HTMLInputElement>
  ) {
    if (event.key === "Backspace" && !digits[index] && index > 0) {
      inputsRef.current[index - 1]?.focus()
    }
  }

  function handlePaste(event: React.ClipboardEvent<HTMLInputElement>) {
    event.preventDefault()

    const pasted = event.clipboardData
      .getData("text")
      .replace(/\D/g, "")
      .slice(0, 6)

    if (!pasted) return

    const next = ["", "", "", "", "", ""]

    for (let i = 0; i < pasted.length; i++) {
      next[i] = pasted[i]
    }

    setDigits(next)

    const focusIndex = Math.min(pasted.length, 5)
    inputsRef.current[focusIndex]?.focus()

    if (pasted.length === 6) {
      void submitCode(next)
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    await submitCode(digits)
  }

  async function handleResend() {
    setResending(true)
    setError("")
    setInfo("")

    const result = await resendRegistrationCode()

    if (result?.error) {
      setError(result.error)
    } else {
      setInfo("A new code was sent.")
      setDigits(["", "", "", "", "", ""])
      inputsRef.current[0]?.focus()
    }

    setResending(false)
  }

  return (
    <main
      className="
        relative
        flex
        min-h-dvh
        items-center
        justify-center
        overflow-hidden
        bg-white
        px-6
        py-12
        font-['Outfit',system-ui,sans-serif]
        text-black
        sm:px-10
      "
    >
      <AuthBackgroundDecoration />

      <div className="relative z-10 w-full max-w-[460px]">
        {/* Brand / page title */}
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
          Email verification
        </p>

        <h1 className="mt-5 text-4xl font-light tracking-tight text-slate-950 md:text-5xl">
          Verify your email.
        </h1>

        {/* Supporting copy */}
        <div className="mt-5">
          <p className="max-w-[40ch] text-lg leading-relaxed text-slate-600">
            We sent a 6-digit verification code to:
          </p>

          <div
            className="
              mt-3
              inline-flex
              items-center
              gap-2
              rounded-full
              border
              border-[#86868b]
              bg-white
              px-3.5
              py-2
            "
          >
            <MailCheck
              aria-hidden="true"
              strokeWidth={1.5}
              className="h-4 w-4 text-black"
            />

            <span
              className="
                max-w-[280px]
                truncate
                text-[13px]
                font-normal
                text-black
              "
            >
              {email}
            </span>
          </div>
        </div>

        {/* Error */}
        {error && (
          <div
            role="alert"
            className="
              mt-7
              flex
              items-start
              gap-3
              rounded-[10px]
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

        {/* Info */}
        {info && (
          <div
            className="
              mt-7
              flex
              items-start
              gap-3
              rounded-[10px]
              border
              border-[#86868b]
              bg-white
              px-4
              py-3.5
              text-[13px]
              leading-5
              text-black
            "
          >
            <MailCheck
              aria-hidden="true"
              strokeWidth={1.6}
              className="mt-0.5 h-4 w-4 shrink-0 text-black"
            />

            <span>{info}</span>
          </div>
        )}

        <form
          onSubmit={handleSubmit}
          className="mt-10 flex flex-col gap-6"
        >
          {/* Verification code */}
          <div>
            <label
              className="mb-2.5 block text-sm font-normal text-slate-950"
            >
              Verification code
            </label>

            <div className="grid grid-cols-6 gap-2 sm:gap-3">
              {digits.map((digit, index) => (
                <input
                  key={index}
                  ref={(el) => {
                    inputsRef.current[index] = el
                  }}
                  type="text"
                  inputMode="numeric"
                  autoComplete={index === 0 ? "one-time-code" : "off"}
                  maxLength={1}
                  value={digit}
                  disabled={loading}
                  onChange={(e) =>
                    handleChange(index, e.target.value)
                  }
                  onKeyDown={(e) =>
                    handleKeyDown(index, e)
                  }
                  onPaste={handlePaste}
                  aria-label={`Digit ${index + 1}`}
                  className="
                    auth-input
                    h-[56px]
                    min-w-0
                    w-full
                    rounded-[10px]
                    border
                    border-[#86868b]
                    bg-white
                    text-center
                    text-base
                    font-normal
                    text-slate-950
                    outline-none
                    transition-all
                    duration-200
                    focus:border-[#1473E6]
                    focus:ring-[2px]
                    focus:ring-[#1473E6]
                    disabled:cursor-not-allowed
                    disabled:opacity-50
                  "
                />
              ))}
            </div>

            <p
              className="
                mt-3
                text-[12px]
                font-normal
                leading-5
                text-black
              "
            >
              Enter the code from your email. You can also paste all 6 digits
              at once.
            </p>
          </div>

          {/* Verify button */}
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

                <span>Verifying...</span>
              </div>
            ) : (
              <>
                <span>Verify email</span>

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

        {/* Resend */}
        <div
          className="
            mt-8
            flex
            flex-col
            items-center
            justify-center
            gap-3
            sm:flex-row
            sm:gap-2
          "
        >
          <span
            className="
              text-sm
              font-normal
              text-black
            "
          >
            Didn&apos;t receive the code?
          </span>

          <button
            type="button"
            onClick={() => void handleResend()}
            disabled={resending || loading}
            className="
              inline-flex
              cursor-pointer
              items-center
              gap-1.5
              border-0
              bg-transparent
              p-0
              text-sm
              font-normal
              text-black
              underline
              decoration-black/25
              underline-offset-4
              transition
              hover:decoration-black
              disabled:cursor-not-allowed
              disabled:opacity-50
            "
          >
            <RotateCcw
              aria-hidden="true"
              strokeWidth={1.6}
              className={`h-3.5 w-3.5 ${
                resending ? "animate-spin" : ""
              }`}
            />

            <span>{resending ? "Sending..." : "Resend code"}</span>
          </button>
        </div>

        {/* Start over */}
        <Link
          href="/register"
          className="
            mt-5
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
            strokeWidth={1.7}
            className="h-4 w-4"
          />

          <span>Start over</span>
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
            Your verification code is used only to confirm your registration.
          </span>
        </div>
      </div>
    </main>
  )
}