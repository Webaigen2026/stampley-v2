"use client"

import { useState } from "react"

export function PostSurveyReflectionCell({ responseId }: { responseId: string }) {
  const [expanded, setExpanded] = useState(false)
  const [loading, setLoading] = useState(false)
  const [loadError, setLoadError] = useState(false)
  const [loaded, setLoaded] = useState(false)
  const [openReflection, setOpenReflection] = useState<string | null>(null)

  async function loadReflection() {
    if (loading) return
    setLoading(true)
    setLoadError(false)
    try {
      const res = await fetch(
        `/api/admin/post-surveys/${encodeURIComponent(responseId)}/reflection`,
        {
          method: "GET",
          cache: "no-store",
          credentials: "same-origin",
        }
      )
      if (!res.ok) throw new Error("Failed to load reflection")
      const data: unknown = await res.json()
      if (!data || typeof data !== "object") {
        throw new Error("Failed to load reflection")
      }
      const raw = data as Record<string, unknown>
      if (!("openReflection" in raw)) {
        throw new Error("Failed to load reflection")
      }
      const value = raw.openReflection
      if (value !== null && typeof value !== "string") {
        throw new Error("Failed to load reflection")
      }
      setOpenReflection(typeof value === "string" && value.trim() ? value.trim() : null)
      setLoaded(true)
      setExpanded(true)
    } catch {
      setLoadError(true)
    } finally {
      setLoading(false)
    }
  }

  function onToggleReflection() {
    if (expanded) {
      setExpanded(false)
      return
    }
    if (loaded) {
      setExpanded(true)
      return
    }
    void loadReflection()
  }

  return (
    <div>
      <button
        type="button"
        onClick={onToggleReflection}
        disabled={loading}
        className="inline-flex cursor-pointer items-center border border-slate-300 bg-white px-2.5 py-1 text-xs font-medium text-slate-800 transition hover:bg-slate-50 disabled:cursor-wait disabled:opacity-70"
      >
        {expanded
          ? "Hide reflection"
          : loading
            ? "Loading reflection…"
            : "View reflection"}
      </button>

      {loadError && !expanded ? (
        <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-red-700">
          <p>Unable to load reflection.</p>
          <button
            type="button"
            onClick={() => void loadReflection()}
            disabled={loading}
            className="cursor-pointer font-medium underline-offset-2 hover:underline disabled:opacity-70"
          >
            Try again
          </button>
        </div>
      ) : null}

      {expanded && loaded ? (
        <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-slate-700">
          {openReflection || "Not provided"}
        </p>
      ) : null}
    </div>
  )
}
