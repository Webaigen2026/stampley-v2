"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { generateStudyKey } from "@/actions/admin"

type StatusMessage = {
  type: "success" | "warning" | "error"
  text: string
  key?: string
}

export function GenerateStudyKeyForm() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState<StatusMessage | null>(null)

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    setMessage(null)

    const form = e.currentTarget
    const formData = new FormData(form)
    const result = await generateStudyKey(formData)

    setLoading(false)

    if (result && "success" in result && result.success && result.emailed === false) {
      setMessage({
        type: "warning",
        text: result.error,
        key: result.key,
      })
      router.refresh()
      return
    }

    if (result && "success" in result && result.success) {
      setMessage({
        type: "success",
        text: "Study key created and emailed.",
        key: result.key,
      })
      form.reset()
      router.refresh()
      return
    }

    setMessage({
      type: "error",
      text: result?.error || "Failed to generate key",
    })
  }

  return (
    <form onSubmit={handleSubmit} className="flex w-full flex-col items-stretch gap-2 sm:w-auto sm:items-end">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
        <label htmlFor="study-key-email" className="sr-only">
          Participant email
        </label>
        <input
          id="study-key-email"
          name="email"
          type="email"
          required
          autoComplete="off"
          placeholder="Participant email"
          className="h-11 w-full border border-gray-200 bg-white px-4 text-sm text-gray-900 shadow-sm outline-none transition placeholder:text-gray-400 focus:border-gray-300 focus:ring-4 focus:ring-gray-100 sm:w-72"
        />
        <button
          type="submit"
          disabled={loading}
          className="inline-flex h-11 items-center justify-center gap-2 bg-gray-900 px-5 text-sm font-medium text-white shadow-sm transition hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-60"
        >
          <span className="text-base leading-none">+</span>
          {loading ? "Sending..." : "Generate & Email Key"}
        </button>
      </div>

      {message && (
        <div
          className={`max-w-md text-right text-sm ${
            message.type === "success"
              ? "text-emerald-700"
              : message.type === "warning"
                ? "text-amber-700"
                : "text-red-600"
          }`}
        >
          <p>{message.text}</p>
          {message.key && (
            <p className="mt-1 font-mono text-xs text-gray-700">
              Study key: {message.key}
            </p>
          )}
        </div>
      )}
    </form>
  )
}
