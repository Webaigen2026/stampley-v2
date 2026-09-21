"use client"

import { useState, useTransition } from "react"
import { usePathname, useRouter, useSearchParams } from "next/navigation"
import { IdentifiedSearchField } from "@/components/admin/identified-search-field"
import { UsersPagination } from "@/components/admin/users/users-pagination"
import { UsersTable } from "@/components/admin/users/users-table"
import { searchAdminUsers } from "@/actions/admin-identified-search"
import { GENERIC_ADMIN_SEARCH_ERROR } from "@/lib/admin-identified-search-error"
import type { AdminUserDirectoryResult } from "@/lib/admin-directory-types"

export function UsersDirectory({
  initial,
  role,
  sort,
  pageSize,
  actorUserId,
  canManageRoles,
  canDeleteUsers,
}: {
  initial: AdminUserDirectoryResult
  role: string
  sort: string
  pageSize: number
  actorUserId: string
  canManageRoles: boolean
  canDeleteUsers: boolean
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
        const next = await searchAdminUsers({
          q: normalized,
          role,
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
          placeholder="Search email or study ID"
          pending={pending}
          applied={identifiedActive}
          onSearch={(value) => runSearch(value, 1)}
          onClear={() => runSearch(null)}
        />
        <select
          value={role}
          onChange={(event) => updateParam("role", event.target.value)}
          className="h-11 border border-gray-200 bg-white px-4 text-sm text-gray-900 outline-none focus:border-gray-300 focus:ring-4 focus:ring-gray-100"
        >
          <option value="ALL">All roles</option>
          <option value="ADMIN">Admin</option>
          <option value="STUDY_COORDINATOR">Study Coordinator</option>
          <option value="CLINICAL_REVIEWER">Clinical Reviewer</option>
          <option value="PARTICIPANT">Participant</option>
        </select>
        <select
          value={sort}
          onChange={(event) => updateParam("sort", event.target.value)}
          className="h-11 border border-gray-200 bg-white px-4 text-sm text-gray-900 outline-none focus:border-gray-300 focus:ring-4 focus:ring-gray-100"
        >
          <option value="created_at_desc">Newest</option>
          <option value="created_at_asc">Oldest</option>
          <option value="email_asc">Email A–Z</option>
          <option value="email_desc">Email Z–A</option>
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
        {result.totalUsers} total user{result.totalUsers === 1 ? "" : "s"}
        {identifiedActive ? " · identified search active" : ""}
      </p>

      <UsersTable
        users={result.rows}
        actorUserId={actorUserId}
        canManageRoles={canManageRoles}
        canDeleteUsers={canDeleteUsers}
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
        <UsersPagination
          page={result.page}
          pageSize={result.pageSize}
          totalUsers={result.totalUsers}
          totalPages={result.totalPages}
        />
      )}
    </>
  )
}
