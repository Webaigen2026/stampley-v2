"use client"

import { useEffect, useRef, useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import Image from "next/image"
import {
  resendRegistrationCode,
  verifyRegistration,
} from "@/actions/register"

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
    if (value && next.every((d) => d.length === 1)) {
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
    const pasted = event.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6)
    if (!pasted) return
    const next = ["", "", "", "", "", ""]
    for (let i = 0; i < pasted.length; i++) next[i] = pasted[i]
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
    <>
      <style>{`
        .f-display,
        .f-mono,
        .f-body {
          font-family: AmericanSansLight, Helvetica, Arial, sans-serif;
        }

        @keyframes spin { to { transform: rotate(360deg); } }
        .spinner { animation: spin 0.7s linear infinite; }

        .btn-shimmer::before {
          content: '';
          position: absolute; top: 0; left: -100%;
          width: 60%; height: 100%;
          background: linear-gradient(90deg, transparent, rgba(255,255,255,0.06), transparent);
          transition: left 0.6s ease;
        }
        .btn-shimmer:hover:not(:disabled)::before { left: 120%; }
      `}</style>

      <div className="f-body relative flex min-h-screen items-center justify-center overflow-hidden bg-[#fefdfb] px-6 py-12 font-[AmericanSansLight,Helvetica,Arial,sans-serif]">
        <div className="relative z-10 w-full max-w-[420px]">
          <Link href="/" className="mb-8 flex items-center gap-3">
            <Image
              src="/images/stampleyLogo.png"
              alt="AIDES-T2D"
              width={32}
              height={32}
            />
            <span className="f-mono text-[10.5px] font-medium uppercase tracking-[0.2em] text-black/40">
              AIDES-T2D
            </span>
          </Link>

          <h1
            className="mb-2 text-[32px] font-normal leading-[1.15] tracking-[-0.02em] text-[#0a0a0f] font-[AmericanSansLight,Helvetica,Arial,sans-serif]"
          >
            Verify your email
          </h1>
          <p
            className="mb-8 text-[14px] font-light leading-[1.6] text-black/70 font-[AmericanSansLight,Helvetica,Arial,sans-serif]"
          >
            We sent a 6-digit code to:
            <br />
            <span className="font-medium text-[#0a0a0f]">{email}</span>
          </p>

          {error && (
            <div className="mb-6 flex items-start gap-2.5 rounded-xl border border-red-100/80 bg-red-50/60 px-4 py-3 text-[12.5px] leading-relaxed text-[#9b2226]">
              <span>{error}</span>
            </div>
          )}

          {info && (
            <div className="mb-6 rounded-xl border border-emerald-100/80 bg-emerald-50/60 px-4 py-3 text-[12.5px] leading-relaxed text-emerald-800">
              {info}
            </div>
          )}

          <form onSubmit={handleSubmit} className="flex flex-col gap-6">
            <div className="flex justify-between gap-2">
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
                  onChange={(e) => handleChange(index, e.target.value)}
                  onKeyDown={(e) => handleKeyDown(index, e)}
                  onPaste={handlePaste}
                  aria-label={`Digit ${index + 1}`}
                  className="auth-input h-14 w-12 rounded-[10px] border border-black/[0.12] bg-white text-center f-mono text-[22px] text-[#0a0a0f] outline-none transition-all duration-200 focus:border-[#3d5a80] focus:shadow-[0_0_0_3.5px_rgba(61,90,128,0.12)] disabled:opacity-40"
                />
              ))}
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn-shimmer relative w-full cursor-pointer overflow-hidden rounded-[10px] border-none bg-blue-900 px-6 py-[14px] f-body text-[13px] font-normal uppercase tracking-[0.06em] text-white shadow-[0_4px_16px_rgba(10,10,15,0.18)] transition-all duration-300 hover:not-disabled:bg-blue-800 disabled:cursor-not-allowed disabled:opacity-40"
            >
              <span className="relative z-10 flex items-center justify-center gap-2">
                {loading ? (
                  <>
                    <span className="spinner inline-block h-3.5 w-3.5 rounded-full border-[1.5px] border-white/20 border-t-white" />
                    <span className="text-[11px] tracking-[0.12em]">Verifying...</span>
                  </>
                ) : (
                  "Verify Email"
                )}
              </span>
            </button>
          </form>

          <p className="mt-8 text-center text-[12.5px] font-light text-black/70">
            Didn&apos;t receive the code?{" "}
            <button
              type="button"
              onClick={() => void handleResend()}
              disabled={resending || loading}
              className="cursor-pointer border-0 bg-transparent p-0 font-medium text-[#0a0a0f] underline-offset-2 hover:underline disabled:opacity-40"
            >
              {resending ? "Sending..." : "Resend code"}
            </button>
          </p>

          <p className="mt-4 text-center text-[12.5px] font-light text-black/50">
            <Link href="/register" className="text-[#3d5a80] hover:text-[#0a0a0f]">
              Start over
            </Link>
          </p>
        </div>
      </div>
    </>
  )
}
