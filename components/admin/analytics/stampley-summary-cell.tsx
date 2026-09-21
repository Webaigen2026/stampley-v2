"use client"

import { useState } from "react"

export function StampleySummaryCell({ sessionId }: { sessionId: string }) {
  const [expanded, setExpanded] = useState(false)
  const [loading, setLoading] = useState(false)
  const [loadError, setLoadError] = useState(false)
  const [loaded, setLoaded] = useState(false)
  const [summary, setSummary] = useState<string | null>(null)

  async function loadSummary() {
    if (loading) return
    setLoading(true)
    setLoadError(false)
    try {
      const res = await fetch(
        `/api/admin/stampley-sessions/${encodeURIComponent(sessionId)}/summary`,
        {
          method: "GET",
          cache: "no-store",
          credentials: "same-origin",
        }
      )
      if (!res.ok) throw new Error("Failed to load summary")
      const data: unknown = await res.json()
      if (!data || typeof data !== "object") {
        throw new Error("Failed to load summary")
      }
      const raw = data as Record<string, unknown>
      const value = raw.summary
      setSummary(typeof value === "string" && value.trim() ? value.trim() : null)
      setLoaded(true)
      setExpanded(true)
    } catch {
      setLoadError(true)
    } finally {
      setLoading(false)
    }
  }

  function onToggleSummary() {
    if (expanded) {
      setExpanded(false)
      return
    }
    if (loaded) {
      setExpanded(true)
      return
    }
    void loadSummary()
  }

  return (
    <div>
      <button
        type="button"
        onClick={onToggleSummary}
        disabled={loading}
        className="inline-flex cursor-pointer items-center border border-slate-300 bg-white px-2.5 py-1 text-xs font-medium text-slate-800 transition hover:bg-slate-50 disabled:cursor-wait disabled:opacity-70"
      >
        {expanded
          ? "Hide summary"
          : loading
            ? "Loading summary…"
            : "View summary"}
      </button>

      {loadError && !expanded ? (
        <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-red-700">
          <p>Unable to load summary.</p>
          <button
            type="button"
            onClick={() => void loadSummary()}
            disabled={loading}
            className="cursor-pointer font-medium underline-offset-2 hover:underline disabled:opacity-70"
          >
            Try again
          </button>
        </div>
      ) : null}

      {expanded && loaded ? (
        <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-slate-700">
          {summary || "No summary available."}
        </p>
      ) : null}
    </div>
  )
}
