"use client"

import {
  PostSurveyResponseDetails,
  getDdsDomainScores,
  getDdsTotal,
  asJsonObject,
  formatPostSurveyNumber,
  formatPostSurveyScore,
} from "@/components/admin/post-surveys/post-survey-response-details"
import { IdentifiedSearchResults } from "@/components/admin/identified-search-results"
import { searchAdminPostSurveys } from "@/actions/admin-identified-search"
import type { SurveyViewCapabilities } from "@/lib/admin-phi-minimization"

function PostSurveyTable({
  rows,
  caps,
  identifiedActive,
  phqSeverity,
  futureContact,
}: {
  rows: Record<string, unknown>[]
  caps: SurveyViewCapabilities
  identifiedActive: boolean
  phqSeverity: string
  futureContact: string
}) {
  const hasFilters = Boolean(identifiedActive || phqSeverity || futureContact)

  return (
    <section className="overflow-hidden border border-slate-200 bg-white shadow-sm">
      <div className="border-b border-slate-200 bg-slate-50 px-5 py-4">
        <h2 className="text-sm font-semibold text-slate-900">
          Participant Post-Study Submissions
        </h2>
        <p className="mt-1 text-xs text-slate-500">
          {rows.length} response{rows.length === 1 ? "" : "s"}
          {identifiedActive ? " · identified search active" : ""}
          {phqSeverity ? ` · PHQ ${phqSeverity}` : ""}
          {futureContact ? ` · future contact ${futureContact}` : ""}
        </p>
      </div>

      {rows.length === 0 ? (
        <div className="px-5 py-16 text-center">
          <p className="text-sm font-medium text-slate-700">
            No post-survey responses yet.
          </p>
          {hasFilters ? (
            <p className="mt-2 text-sm text-slate-500">
              Try clearing filters to see all submissions.
            </p>
          ) : null}
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full border-collapse text-left text-sm">
            <thead>
              <tr className="border-b border-slate-200 bg-white">
                <th className="px-5 py-3 font-semibold text-slate-600">
                  {caps.canViewIdentifiedAnalytics ? "Participant" : "Study ID"}
                </th>
                <th className="px-5 py-3 font-semibold text-slate-600">Submitted</th>
                {caps.canViewClinicalSurveyScores ? (
                  <>
                    <th className="px-5 py-3 font-semibold text-slate-600">DDS Total</th>
                    <th className="px-5 py-3 font-semibold text-slate-600">Domains</th>
                    <th className="px-5 py-3 font-semibold text-slate-600">PHQ</th>
                    <th className="px-5 py-3 font-semibold text-slate-600">SUS</th>
                  </>
                ) : null}
                <th className="px-5 py-3 font-semibold text-slate-600">
                  Future Contact
                </th>
                <th className="px-5 py-3 font-semibold text-slate-600">Details</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => {
                const ddsScores = caps.canViewClinicalSurveyScores
                  ? asJsonObject(row.dds_scores)
                  : null
                const domains = getDdsDomainScores(ddsScores)

                return (
                  <tr
                    key={String(row.id)}
                    className="border-b border-slate-100 align-top hover:bg-slate-50/80"
                  >
                    <td className="px-5 py-4 font-medium text-slate-900">
                      {caps.canViewIdentifiedAnalytics
                        ? String(row.email ?? "—")
                        : String(row.study_id)}
                    </td>
                    <td className="whitespace-nowrap px-5 py-4 text-slate-600">
                      {row.completed_at
                        ? new Date(String(row.completed_at)).toLocaleString()
                        : "—"}
                    </td>
                    {caps.canViewClinicalSurveyScores ? (
                      <>
                        <td className="px-5 py-4 font-medium text-slate-900">
                          {getDdsTotal(ddsScores)}
                        </td>
                        <td className="px-5 py-4 text-xs text-slate-700">
                          <div className="space-y-1">
                            <p>E: {domains.emotional}</p>
                            <p>P: {domains.physician}</p>
                            <p>R: {domains.regimen}</p>
                            <p>I: {domains.interpersonal}</p>
                          </div>
                        </td>
                        <td className="px-5 py-4 text-slate-700">
                          <p className="font-medium text-slate-900">
                            {formatPostSurveyNumber(row.phq_total)}
                          </p>
                          <p className="mt-1 text-xs text-slate-500">
                            {typeof row.phq_severity === "string"
                              ? row.phq_severity
                              : "—"}
                          </p>
                        </td>
                        <td className="px-5 py-4 font-medium text-slate-900">
                          {formatPostSurveyScore(row.sus_score)}
                        </td>
                      </>
                    ) : null}
                    <td className="px-5 py-4">
                      {row.future_research_contact === true ? (
                        <span className="border border-green-200 bg-green-50 px-2 py-1 text-xs font-semibold text-green-700">
                          Yes
                        </span>
                      ) : row.future_research_contact === false ? (
                        <span className="text-xs text-slate-500">No</span>
                      ) : (
                        <span className="text-xs text-slate-500">—</span>
                      )}
                    </td>
                    <td className="px-5 py-4">
                      <PostSurveyResponseDetails
                        record={row}
                        responseId={
                          caps.canViewSurveyFreeText ? String(row.id) : undefined
                        }
                        showPhqItems={caps.canViewPhqItem9}
                        showClinicalScores={caps.canViewClinicalSurveyScores}
                        showFreeText={caps.canViewSurveyFreeText}
                        showOpenReflection={caps.canViewSurveyFreeText}
                        showContact={caps.canViewContactInformation}
                      />
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

export function PostSurveyIdentifiedPanel({
  initial,
  caps,
  phqSeverity,
  futureContact,
}: {
  initial: Record<string, unknown>[]
  caps: SurveyViewCapabilities
  phqSeverity: string
  futureContact: string
}) {
  return (
    <IdentifiedSearchResults
      placeholder={caps.canViewIdentifiedAnalytics ? "Email" : "Study ID"}
      initial={initial}
      search={(q) =>
        searchAdminPostSurveys({ q, phqSeverity, futureContact })
      }
    >
      {(rows, identifiedActive) => (
        <PostSurveyTable
          rows={rows}
          caps={caps}
          identifiedActive={identifiedActive}
          phqSeverity={phqSeverity}
          futureContact={futureContact}
        />
      )}
    </IdentifiedSearchResults>
  )
}
