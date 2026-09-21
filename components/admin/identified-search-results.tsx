"use client"

import { useState, useTransition } from "react"
import { IdentifiedSearchField } from "@/components/admin/identified-search-field"
import { GENERIC_ADMIN_SEARCH_ERROR } from "@/lib/admin-identified-search-error"

export function IdentifiedSearchResults<T>({
  placeholder,
  enabled = true,
  initial,
  search,
  children,
}: {
  placeholder: string
  enabled?: boolean
  initial: T
  search: (
    query: string | null
  ) => Promise<{ ok: true; data: T } | { ok: false; error: string }>
  children: (data: T, identifiedActive: boolean) => React.ReactNode
}) {
  const [data, setData] = useState(initial)
  const [applied, setApplied] = useState(false)
  const [error, setError] = useState("")
  const [pending, startTransition] = useTransition()

  function runSearch(query: string | null) {
    const normalized = query?.trim() ? query : null
    setError("")
    if (normalized == null) {
      setData(initial)
      setApplied(false)
      return
    }
    startTransition(() => {
      void (async () => {
        const result = await search(normalized)
        if (!result.ok) {
          setError(GENERIC_ADMIN_SEARCH_ERROR)
          return
        }
        setData(result.data)
        setApplied(true)
      })()
    })
  }

  return (
    <>
      {enabled ? (
        <div className="mt-4">
          <IdentifiedSearchField
            placeholder={placeholder}
            pending={pending}
            applied={applied}
            onSearch={(value) => runSearch(value)}
            onClear={() => {
              setData(initial)
              setApplied(false)
              setError("")
            }}
          />
          {error ? (
            <p className="mt-2 text-sm text-red-700">{error}</p>
          ) : null}
        </div>
      ) : null}
      {children(data, applied)}
    </>
  )
}
