import Link from "next/link"
import { PostSurveyIdentifiedPanel } from "@/components/admin/post-surveys/post-survey-identified-panel"
import { StripIdentifiedSearchParam } from "@/components/admin/strip-identified-search-param"
import {
  loadAdminPostSurveyRows,
  PHQ_SEVERITY_OPTIONS,
} from "@/lib/admin-directory-search"
import { recordPhiPageViewOrThrow } from "@/lib/admin-phi-page"
import { filterKeysFromFlags } from "@/lib/audit-metadata"
import { requireAdminPage } from "@/lib/admin-authz"
import { surveyViewCapabilities } from "@/lib/admin-phi-minimization"

export const dynamic = "force-dynamic"

type SearchParams = {
  phqSeverity?: string
  futureContact?: string
}

export default async function AdminPostSurveysPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>
}) {
  const actor = await requireAdminPage([
    "canViewOperationalParticipantData",
    "canViewClinicalSurveyData",
  ])
  const caps = surveyViewCapabilities(actor.role)
  const params = await searchParams
  const phqSeverity = (params.phqSeverity ?? "").trim()
  const futureContact = (params.futureContact ?? "").trim()

  const rows = await loadAdminPostSurveyRows({
    q: null,
    phqSeverity,
    futureContact,
    caps,
  })

  const hasUrlFilters = Boolean(phqSeverity || futureContact)

  await recordPhiPageViewOrThrow({
    action: "ADMIN_POST_SURVEY_LIST_VIEWED",
    resourceType: "POST_SURVEY",
    metadata: {
      filterKeys: filterKeysFromFlags({
        q: false,
      }),
      includesNarratives: false,
    },
  })

  return (
    <main className="space-y-8">
      <StripIdentifiedSearchParam />
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
          {caps.canViewClinicalSurveyScores ? (
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
          ) : null}

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

            {hasUrlFilters ? (
              <Link
                href="/admin/post-surveys"
                className="border border-slate-300 bg-white px-4 py-2 text-xs font-semibold uppercase tracking-[0.08em] text-slate-700 hover:bg-slate-50"
              >
                Clear
              </Link>
            ) : null}
          </div>
        </div>
      </form>

      <PostSurveyIdentifiedPanel
        initial={rows}
        caps={caps}
        phqSeverity={phqSeverity}
        futureContact={futureContact}
      />
    </main>
  )
}
