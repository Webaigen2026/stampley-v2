"use client"

import { useState } from "react"

const FIELD_CLASS =
  "w-full border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm outline-none focus:border-slate-400 focus:ring-2 focus:ring-slate-200"

export function IdentifiedSearchField({
  placeholder,
  pending = false,
  applied = false,
  onSearch,
  onClear,
}: {
  placeholder: string
  pending?: boolean
  applied?: boolean
  onSearch: (value: string) => void
  onClear: () => void
}) {
  const [draft, setDraft] = useState("")

  function submit() {
    onSearch(draft)
  }

  function clear() {
    setDraft("")
    onClear()
  }

  return (
    <div className="flex min-w-[220px] flex-1 flex-col gap-2">
      <label className="block text-sm">
        <span className="mb-1.5 block font-medium text-slate-700">
          {placeholder}
        </span>
        <input
          type="search"
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter") {
              event.preventDefault()
              submit()
            }
          }}
          autoComplete="off"
          placeholder={placeholder}
          className={FIELD_CLASS}
        />
      </label>
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={submit}
          disabled={pending}
          className="border border-slate-900 bg-slate-900 px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.08em] text-white hover:bg-black disabled:opacity-60"
        >
          {pending ? "Searching…" : "Search"}
        </button>
        {applied || draft ? (
          <button
            type="button"
            onClick={clear}
            disabled={pending}
            className="border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.08em] text-slate-700 hover:bg-slate-50 disabled:opacity-60"
          >
            Clear search
          </button>
        ) : null}
      </div>
    </div>
  )
}
