"use client"

import Link from "next/link"
import { IdentifiedSearchResults } from "@/components/admin/identified-search-results"
import { searchAdminDds } from "@/actions/admin-identified-search"

const DDS_QUESTIONS = [
  { id: "q1", domain: "Emotional" },
  { id: "q2", domain: "Physician" },
  { id: "q3", domain: "Emotional" },
  { id: "q4", domain: "Physician" },
  { id: "q5", domain: "Regimen" },
  { id: "q6", domain: "Regimen" },
  { id: "q7", domain: "Interpersonal" },
  { id: "q8", domain: "Emotional" },
  { id: "q9", domain: "Physician" },
  { id: "q10", domain: "Regimen" },
  { id: "q11", domain: "Emotional" },
  { id: "q12", domain: "Regimen" },
  { id: "q13", domain: "Interpersonal" },
  { id: "q14", domain: "Emotional" },
  { id: "q15", domain: "Physician" },
  { id: "q16", domain: "Regimen" },
  { id: "q17", domain: "Interpersonal" },
] as const

function formatScore(value: unknown): string {
  if (value == null || value === "") return "—"
  const n = Number(value)
  return Number.isFinite(n) ? n.toFixed(2) : "—"
}

function hasHighDistress(row: Record<string, unknown>): boolean {
  const scores = [
    row.total_score,
    row.emotional_score,
    row.physician_score,
    row.regimen_score,
    row.interpersonal_score,
  ]
  return scores.some((value) => {
    const n = Number(value)
    return Number.isFinite(n) && n >= 3
  })
}

function focusDomain(row: Record<string, unknown>): string {
  const confirmed = row.confirmed_domain
  if (typeof confirmed === "string" && confirmed.trim()) return confirmed
  const recommended = row.recommended_domain
  if (typeof recommended === "string" && recommended.trim()) return recommended
  return "—"
}

function hasStoredItemResponses(row: Record<string, unknown>): boolean {
  return DDS_QUESTIONS.some((question) => row[question.id] != null)
}

function DdsTable({
  rows,
  canViewItems,
  highDistressOnly,
  identifiedActive,
}: {
  rows: Record<string, unknown>[]
  canViewItems: boolean
  highDistressOnly: boolean
  identifiedActive: boolean
}) {
  return (
    <section className="overflow-hidden border border-slate-200 bg-white shadow-sm">
      <div className="border-b border-slate-200 bg-slate-50 px-5 py-4">
        <h2 className="text-sm font-semibold text-slate-900">
          Participant DDS-17 Submissions
        </h2>
        <p className="mt-1 text-xs text-slate-500">
          {rows.length} response{rows.length === 1 ? "" : "s"}
          {highDistressOnly ? " · high distress filter active" : ""}
          {identifiedActive ? " · identified search active" : ""}
        </p>
      </div>

      {rows.length === 0 ? (
        <div className="px-5 py-16 text-center">
          <p className="text-sm font-medium text-slate-700">
            No DDS-17 responses submitted yet.
          </p>
          {(identifiedActive || highDistressOnly) && (
            <p className="mt-2 text-sm text-slate-500">
              Try clearing filters to see all submissions.
            </p>
          )}
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full border-collapse text-left text-sm">
            <thead>
              <tr className="border-b border-slate-200 bg-white">
                <th className="px-5 py-3 font-semibold text-slate-600">Participant</th>
                <th className="px-5 py-3 font-semibold text-slate-600">Study ID</th>
                <th className="px-5 py-3 font-semibold text-slate-600">Completed</th>
                <th className="px-5 py-3 font-semibold text-slate-600">Total</th>
                <th className="px-5 py-3 font-semibold text-slate-600">Emotional</th>
                <th className="px-5 py-3 font-semibold text-slate-600">Physician</th>
                <th className="px-5 py-3 font-semibold text-slate-600">Regimen</th>
                <th className="px-5 py-3 font-semibold text-slate-600">Interpersonal</th>
                <th className="px-5 py-3 font-semibold text-slate-600">Focus Domain</th>
                <th className="px-5 py-3 font-semibold text-slate-600">Distress</th>
                <th className="px-5 py-3 font-semibold text-slate-600">Items</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => {
                const highDistress = hasHighDistress(row)
                const storedItems = canViewItems && hasStoredItemResponses(row)
                const userId = String(row.user_id)

                return (
                  <tr
                    key={String(row.dds_id)}
                    className="border-b border-slate-100 align-top hover:bg-slate-50/80"
                  >
                    <td className="px-5 py-4">
                      <Link
                        href={`/admin/users/${userId}`}
                        className="font-medium text-[#005ea8] hover:underline"
                      >
                        {String(row.email)}
                      </Link>
                    </td>
                    <td className="px-5 py-4 text-slate-700">
                      {row.study_id != null ? String(row.study_id) : "—"}
                    </td>
                    <td className="whitespace-nowrap px-5 py-4 text-slate-600">
                      {row.created_at
                        ? new Date(String(row.created_at)).toLocaleString()
                        : "—"}
                    </td>
                    <td className="px-5 py-4 font-medium text-slate-900">
                      {formatScore(row.total_score)}
                    </td>
                    <td className="px-5 py-4 text-slate-700">
                      {formatScore(row.emotional_score)}
                    </td>
                    <td className="px-5 py-4 text-slate-700">
                      {formatScore(row.physician_score)}
                    </td>
                    <td className="px-5 py-4 text-slate-700">
                      {formatScore(row.regimen_score)}
                    </td>
                    <td className="px-5 py-4 text-slate-700">
                      {formatScore(row.interpersonal_score)}
                    </td>
                    <td className="px-5 py-4 text-slate-700">{focusDomain(row)}</td>
                    <td className="px-5 py-4">
                      {highDistress ? (
                        <span className="border border-amber-200 bg-amber-50 px-2 py-1 text-xs font-semibold text-amber-800">
                          ≥ 3
                        </span>
                      ) : (
                        <span className="border border-green-200 bg-green-50 px-2 py-1 text-xs font-semibold text-green-700">
                          Below 3
                        </span>
                      )}
                    </td>
                    <td className="px-5 py-4">
                      {storedItems ? (
                        <details className="group">
                          <summary className="cursor-pointer list-none text-xs font-semibold uppercase tracking-[0.08em] text-[#005ea8] hover:underline [&::-webkit-details-marker]:hidden">
                            View q1–q17
                          </summary>
                          <div className="mt-3 min-w-[280px] border border-slate-200 bg-slate-50 p-3">
                            <table className="w-full text-left text-xs">
                              <thead>
                                <tr className="border-b border-slate-200 text-slate-500">
                                  <th className="pb-2 pr-3 font-semibold">Item</th>
                                  <th className="pb-2 pr-3 font-semibold">Domain</th>
                                  <th className="pb-2 font-semibold">Score</th>
                                </tr>
                              </thead>
                              <tbody>
                                {DDS_QUESTIONS.map((question, index) => {
                                  const value = row[question.id]
                                  const numeric = value == null ? null : Number(value)
                                  return (
                                    <tr
                                      key={question.id}
                                      className="border-b border-slate-100 last:border-b-0"
                                    >
                                      <td className="py-1.5 pr-3 font-medium text-slate-800">
                                        {index + 1}
                                      </td>
                                      <td className="py-1.5 pr-3 text-slate-600">
                                        {question.domain}
                                      </td>
                                      <td className="py-1.5 font-medium text-slate-900">
                                        {numeric == null || Number.isNaN(numeric)
                                          ? "—"
                                          : numeric}
                                      </td>
                                    </tr>
                                  )
                                })}
                              </tbody>
                            </table>
                          </div>
                        </details>
                      ) : (
                        <span className="text-xs text-slate-500">Not stored</span>
                      )}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </section>
  )
}

export function DdsIdentifiedPanel({
  initial,
  canViewItems,
  highDistressOnly,
}: {
  initial: Record<string, unknown>[]
  canViewItems: boolean
  highDistressOnly: boolean
}) {
  return (
    <IdentifiedSearchResults
      placeholder="Email or study ID"
      initial={initial}
      search={(q) => searchAdminDds({ q, highDistressOnly })}
    >
      {(rows, identifiedActive) => (
        <DdsTable
          rows={rows}
          canViewItems={canViewItems}
          highDistressOnly={highDistressOnly}
          identifiedActive={identifiedActive}
        />
      )}
    </IdentifiedSearchResults>
  )
}
