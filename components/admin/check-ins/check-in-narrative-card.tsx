"use client"

import { useState } from "react"
import { ChevronDown, ChevronUp } from "lucide-react"

type NarrativeDetail = {
  reflection: string | null
  copingAction: string | null
}

export function CheckInNarrativeCard({
  checkInId,
  heading,
  subheading,
  flagged = false,
}: {
  checkInId: string
  heading: string
  subheading: string
  flagged?: boolean
}) {
  const [expanded, setExpanded] = useState(false)
  const [loading, setLoading] = useState(false)
  const [loadError, setLoadError] = useState(false)
  const [narrative, setNarrative] = useState<NarrativeDetail | null>(null)

  async function loadNarrative() {
    if (loading) return
    setLoading(true)
    setLoadError(false)
    try {
      const res = await fetch(
        `/api/admin/check-ins/${encodeURIComponent(checkInId)}`,
        {
          method: "GET",
          cache: "no-store",
          credentials: "same-origin",
        }
      )
      if (!res.ok) throw new Error("Failed to load check-in narrative")
      const data: unknown = await res.json()
      if (!data || typeof data !== "object") {
        throw new Error("Failed to load check-in narrative")
      }
      const raw = data as Record<string, unknown>
      setNarrative({
        reflection: typeof raw.reflection === "string" ? raw.reflection : null,
        copingAction:
          typeof raw.copingAction === "string" ? raw.copingAction : null,
      })
      setExpanded(true)
    } catch {
      setLoadError(true)
    } finally {
      setLoading(false)
    }
  }

  function onToggleNarrative() {
    if (expanded) {
      setExpanded(false)
      return
    }
    if (narrative) {
      setExpanded(true)
      return
    }
    void loadNarrative()
  }

  return (
    <div className="border border-slate-200 bg-white p-5">
      <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-sm font-semibold text-slate-900">{heading}</p>
          <p className="text-xs text-slate-500">{subheading}</p>
        </div>

        {flagged ? (
          <span className="w-fit border border-red-200 bg-red-50 px-2 py-1 text-xs font-semibold text-red-700">
            Safety Flag
          </span>
        ) : null}
      </div>

      <div className="mt-4">
        <button
          type="button"
          onClick={onToggleNarrative}
          disabled={loading}
          className="inline-flex cursor-pointer items-center gap-2 border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-800 transition hover:bg-slate-50 disabled:cursor-wait disabled:opacity-70"
        >
          {expanded ? (
            <>
              <ChevronUp className="h-4 w-4" aria-hidden />
              Hide reflection
            </>
          ) : (
            <>
              <ChevronDown className="h-4 w-4" aria-hidden />
              {loading ? "Loading reflection…" : "View reflection"}
            </>
          )}
        </button>
      </div>

      {loadError && !expanded ? (
        <div className="mt-3 flex flex-wrap items-center gap-3 text-sm text-red-700">
          <p>Unable to load check-in narrative.</p>
          <button
            type="button"
            onClick={() => void loadNarrative()}
            disabled={loading}
            className="cursor-pointer font-medium underline-offset-2 hover:underline disabled:opacity-70"
          >
            Try again
          </button>
        </div>
      ) : null}

      {expanded && narrative ? (
        <div className="mt-4 grid gap-4 md:grid-cols-2">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
              Reflection
            </p>
            <p className="mt-2 text-sm leading-6 text-slate-700">
              {narrative.reflection || "No reflection provided."}
            </p>
          </div>

          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
              Coping Action
            </p>
            <p className="mt-2 text-sm leading-6 text-slate-700">
              {narrative.copingAction || "No coping action provided."}
            </p>
          </div>
        </div>
      ) : null}
    </div>
  )
}
