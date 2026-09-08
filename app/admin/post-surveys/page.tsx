import { prisma } from "@/lib/prisma"
import type { Prisma } from "@/lib/generated/prisma/client"
import Link from "next/link"
import {
  PostSurveyResponseDetails,
  getDdsDomainScores,
  getDdsTotal,
  asJsonObject,
  formatPostSurveyNumber,
  formatPostSurveyScore,
} from "@/components/admin/post-surveys/post-survey-response-details"

export const dynamic = "force-dynamic"

type SearchParams = {
  q?: string
  phqSeverity?: string
  futureContact?: string
}

const PHQ_SEVERITY_OPTIONS = [
  "Minimal",
  "Mild",
  "Moderate",
  "Moderately Severe",
  "Severe",
] as const

export default async function AdminPostSurveysPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>
}) {
  const params = await searchParams
  const q = (params.q ?? "").trim()
  const phqSeverity = (params.phqSeverity ?? "").trim()
  const futureContact = (params.futureContact ?? "").trim()

  const where: Prisma.PostSurveyResponseWhereInput = {
    completedAt: { not: null },
  }

  if (q) {
    where.user = { email: { contains: q, mode: "insensitive" } }
  }

  if (phqSeverity && PHQ_SEVERITY_OPTIONS.includes(phqSeverity as (typeof PHQ_SEVERITY_OPTIONS)[number])) {
    where.phqSeverity = phqSeverity
  }

  if (futureContact === "yes") {
    where.futureResearchContact = true
  } else if (futureContact === "no") {
    where.futureResearchContact = false
  }

  const result = await prisma.postSurveyResponse.findMany({
    where,
    orderBy: { completedAt: "desc" },
    select: {
      id: true,
      userId: true,
      completedAt: true,
      ddsAnswers: true,
      ddsScores: true,
      phqAnswers: true,
      phqTotal: true,
      phqSeverity: true,
      susAnswers: true,
      susScore: true,
      stampleyFeedback: true,
      openReflection: true,
      futureResearchContact: true,
      contactName: true,
      contactEmail: true,
      contactPhone: true,
      user: { select: { email: true } },
    },
  })

  const rows = result.map((row) => ({
    id: row.id,
    user_id: row.userId,
    email: row.user.email,
    completed_at: row.completedAt,
    dds_answers: row.ddsAnswers,
    dds_scores: row.ddsScores,
    phq_answers: row.phqAnswers,
    phq_total: row.phqTotal,
    phq_severity: row.phqSeverity,
    sus_answers: row.susAnswers,
    sus_score: row.susScore != null ? Number(row.susScore) : null,
    stampley_feedback: row.stampleyFeedback,
    open_reflection: row.openReflection,
    future_research_contact: row.futureResearchContact,
    contact_name: row.contactName,
    contact_email: row.contactEmail,
    contact_phone: row.contactPhone,
  }))

  const hasFilters = Boolean(q || phqSeverity || futureContact)

  return (
    <main className="space-y-8">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
          Admin · Study
        </p>

        <h1 className="mt-2 text-3xl font-semibold tracking-tight text-slate-950">
          Post-Survey Responses
        </h1>

        <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-600">
          Review post-study exit survey submissions including DDS-17, PHQ-9,
          System Usability Scale, and Stampley experience feedback.
        </p>
      </div>

      <form
        action="/admin/post-surveys"
        method="get"
        className="border border-slate-200 bg-gradient-to-br from-white to-stone-50 p-5 shadow-sm"
      >
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
          Filters
        </p>

        <div className="mt-4 flex flex-col gap-4 lg:flex-row lg:flex-wrap lg:items-end">
          <label className="block min-w-[220px] flex-1 text-sm">
            <span className="mb-1.5 block text-xs font-medium text-slate-600">
              Search participant
            </span>
            <input
              type="search"
              name="q"
              defaultValue={q}
              placeholder="Email…"
              className="w-full border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:border-slate-400 focus:ring-2 focus:ring-slate-200"
            />
          </label>

          <label className="block min-w-[180px] text-sm">
            <span className="mb-1.5 block text-xs font-medium text-slate-600">
              PHQ severity
            </span>
            <select
              name="phqSeverity"
              defaultValue={phqSeverity}
              className="w-full border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:border-slate-400 focus:ring-2 focus:ring-slate-200"
            >
              <option value="">All severities</option>
              {PHQ_SEVERITY_OPTIONS.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </label>

          <label className="block min-w-[180px] text-sm">
            <span className="mb-1.5 block text-xs font-medium text-slate-600">
              Future contact
            </span>
            <select
              name="futureContact"
              defaultValue={futureContact}
              className="w-full border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:border-slate-400 focus:ring-2 focus:ring-slate-200"
            >
              <option value="">All</option>
              <option value="yes">Yes</option>
              <option value="no">No</option>
            </select>
          </label>

          <div className="flex gap-2">
            <button
              type="submit"
              className="border border-slate-900 bg-slate-900 px-4 py-2 text-xs font-semibold uppercase tracking-[0.08em] text-white hover:bg-black"
            >
              Apply
            </button>

            {hasFilters && (
              <Link
                href="/admin/post-surveys"
                className="border border-slate-300 bg-white px-4 py-2 text-xs font-semibold uppercase tracking-[0.08em] text-slate-700 hover:bg-slate-50"
              >
                Clear
              </Link>
            )}
          </div>
        </div>
      </form>

      <section className="overflow-hidden border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-200 bg-slate-50 px-5 py-4">
          <h2 className="text-sm font-semibold text-slate-900">
            Participant Post-Study Submissions
          </h2>
          <p className="mt-1 text-xs text-slate-500">
            {rows.length} response{rows.length === 1 ? "" : "s"}
            {q ? ` · matching “${q}”` : ""}
            {phqSeverity ? ` · PHQ ${phqSeverity}` : ""}
            {futureContact ? ` · future contact ${futureContact}` : ""}
          </p>
        </div>

        {rows.length === 0 ? (
          <div className="px-5 py-16 text-center">
            <p className="text-sm font-medium text-slate-700">
              No post-survey responses yet.
            </p>
            {hasFilters && (
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
                  <th className="px-5 py-3 font-semibold text-slate-600">
                    Participant
                  </th>
                  <th className="px-5 py-3 font-semibold text-slate-600">
                    Submitted
                  </th>
                  <th className="px-5 py-3 font-semibold text-slate-600">
                    DDS Total
                  </th>
                  <th className="px-5 py-3 font-semibold text-slate-600">
                    Domains
                  </th>
                  <th className="px-5 py-3 font-semibold text-slate-600">
                    PHQ
                  </th>
                  <th className="px-5 py-3 font-semibold text-slate-600">
                    SUS
                  </th>
                  <th className="px-5 py-3 font-semibold text-slate-600">
                    Future Contact
                  </th>
                  <th className="px-5 py-3 font-semibold text-slate-600">
                    Details
                  </th>
                </tr>
              </thead>

              <tbody>
                {rows.map((row) => {
                  const ddsScores = asJsonObject(row.dds_scores)
                  const domains = getDdsDomainScores(ddsScores)
                  const userId = String(row.user_id)

                  return (
                    <tr
                      key={String(row.id)}
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

                      <td className="whitespace-nowrap px-5 py-4 text-slate-600">
                        {row.completed_at
                          ? new Date(String(row.completed_at)).toLocaleString()
                          : "—"}
                      </td>

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
                          {row.phq_severity || "—"}
                        </p>
                      </td>

                      <td className="px-5 py-4 font-medium text-slate-900">
                        {formatPostSurveyScore(row.sus_score)}
                      </td>

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
                        <PostSurveyResponseDetails record={row} />
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </main>
  )
}
