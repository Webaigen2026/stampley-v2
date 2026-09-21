"use client"

import { useState, useTransition } from "react"
import { usePathname, useRouter, useSearchParams } from "next/navigation"
import { IdentifiedSearchField } from "@/components/admin/identified-search-field"
import { KeysPagination } from "@/components/admin/keys/keys-pagination"
import { KeysTable } from "@/components/admin/keys/keys-table"
import { CopyButton } from "@/components/admin/copy-button"
import { searchAdminKeys } from "@/actions/admin-identified-search"
import { deleteStudyKey } from "@/actions/admin"
import { GENERIC_ADMIN_SEARCH_ERROR } from "@/lib/admin-identified-search-error"
import type { AdminKeyDirectoryResult } from "@/lib/admin-directory-types"

export function KeysDirectory({
  initial,
  status,
  sort,
  pageSize,
}: {
  initial: AdminKeyDirectoryResult
  status: string
  sort: string
  pageSize: number
}) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const [result, setResult] = useState(initial)
  const [appliedQuery, setAppliedQuery] = useState<string | null>(null)
  const [error, setError] = useState("")
  const [pending, startTransition] = useTransition()

  function updateParam(key: string, value: string) {
    const params = new URLSearchParams(searchParams.toString())
    params.delete("q")
    if (!value || value === "ALL") {
      params.delete(key)
    } else {
      params.set(key, value)
    }
    params.set("page", "1")
    startTransition(() => {
      router.push(`${pathname}?${params.toString()}`)
    })
  }

  function runSearch(query: string | null, page = 1) {
    const normalized = query?.trim() ? query.trim() : null
    setError("")
    if (normalized == null) {
      setAppliedQuery(null)
      setResult(initial)
      return
    }
    startTransition(() => {
      void (async () => {
        const next = await searchAdminKeys({
          q: normalized,
          status,
          sort,
          page,
          pageSize,
        })
        if (!next.ok) {
          setError(GENERIC_ADMIN_SEARCH_ERROR)
          return
        }
        setAppliedQuery(normalized)
        setResult(next.data)
      })()
    })
  }

  const identifiedActive = appliedQuery != null

  return (
    <>
      <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-end">
        <IdentifiedSearchField
          placeholder="Search key or participant"
          pending={pending}
          applied={identifiedActive}
          onSearch={(value) => runSearch(value, 1)}
          onClear={() => runSearch(null)}
        />
        <select
          value={status}
          onChange={(event) => updateParam("status", event.target.value)}
          className="h-11 border border-gray-200 bg-white px-4 text-sm text-gray-900 outline-none focus:border-gray-300 focus:ring-4 focus:ring-gray-100"
        >
          <option value="ALL">All statuses</option>
          <option value="AVAILABLE">Available</option>
          <option value="USED">Used</option>
        </select>
        <select
          value={sort}
          onChange={(event) => updateParam("sort", event.target.value)}
          className="h-11 border border-gray-200 bg-white px-4 text-sm text-gray-900 outline-none focus:border-gray-300 focus:ring-4 focus:ring-gray-100"
        >
          <option value="created_at_desc">Newest</option>
          <option value="created_at_asc">Oldest</option>
          <option value="key_asc">Key A–Z</option>
          <option value="key_desc">Key Z–A</option>
        </select>
        <select
          value={String(pageSize)}
          onChange={(event) => updateParam("pageSize", event.target.value)}
          className="h-11 border border-gray-200 bg-white px-4 text-sm text-gray-900 outline-none focus:border-gray-300 focus:ring-4 focus:ring-gray-100"
        >
          <option value="10">10 / page</option>
          <option value="20">20 / page</option>
          <option value="50">50 / page</option>
        </select>
      </div>
      {error ? <p className="mt-2 text-sm text-red-700">{error}</p> : null}

      <p className="mt-4 text-sm text-gray-500">
        {result.filteredTotal} matching key{result.filteredTotal === 1 ? "" : "s"}
        {identifiedActive ? " · identified search active" : ""}
      </p>

      <KeysTable
        keys={result.rows}
        deleteStudyKey={deleteStudyKey}
        CopyButton={CopyButton}
      />

      {identifiedActive ? (
        <div className="flex items-center justify-between border-t border-gray-100 px-6 py-4 text-sm text-gray-500">
          <p>
            Page {result.page} of {result.totalPages}
          </p>
          <div className="flex gap-2">
            <button
              type="button"
              disabled={result.page <= 1 || pending}
              onClick={() => runSearch(appliedQuery, result.page - 1)}
              className="inline-flex h-10 items-center border border-gray-200 bg-white px-4 text-sm font-medium text-gray-700 disabled:text-gray-300"
            >
              Previous
            </button>
            <button
              type="button"
              disabled={result.page >= result.totalPages || pending}
              onClick={() => runSearch(appliedQuery, result.page + 1)}
              className="inline-flex h-10 items-center border border-gray-200 bg-white px-4 text-sm font-medium text-gray-700 disabled:text-gray-300"
            >
              Next
            </button>
          </div>
        </div>
      ) : (
        <KeysPagination
          page={result.page}
          pageSize={result.pageSize}
          totalItems={result.filteredTotal}
          totalPages={result.totalPages}
          status={status}
          sort={sort}
        />
      )}
    </>
  )
}
