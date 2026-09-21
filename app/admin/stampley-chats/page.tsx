import { StampleyChatsIdentifiedPanel } from "@/components/admin/stampley-chats/stampley-chats-identified-panel"
import { StripIdentifiedSearchParam } from "@/components/admin/strip-identified-search-param"
import {
  hasActiveUrlSafeAnalyticsFilters,
  parseUrlSafeAnalyticsFilters,
  STUDY_DOMAINS,
} from "@/lib/admin-analytics-filters"
import { loadAdminStampleyChatSessions } from "@/lib/admin-directory-search"
import { recordPhiPageViewOrThrow } from "@/lib/admin-phi-page"
import { filterKeysFromAnalytics } from "@/lib/audit-metadata"
import { requireAdminPage } from "@/lib/admin-authz"

export const dynamic = "force-dynamic"

type SearchParams = Record<string, string | string[] | undefined>

export default async function AdminStampleyChatsPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>
}) {
  await requireAdminPage("canViewTranscripts")
  const params = await searchParams
  const filters = parseUrlSafeAnalyticsFilters(params)
  const filtersActive = hasActiveUrlSafeAnalyticsFilters(filters)
  const sessions = await loadAdminStampleyChatSessions(filters)

  await recordPhiPageViewOrThrow({
    action: "ADMIN_STAMPLEY_TRANSCRIPT_LIST_VIEWED",
    resourceType: "STAMPLEY_SESSION",
    metadata: {
      includesTranscripts: false,
      filterKeys: filterKeysFromAnalytics(filters),
    },
  })

  return (
    <main className="space-y-8">
      <StripIdentifiedSearchParam />
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
          Admin
        </p>

        <h1 className="mt-2 text-3xl font-semibold tracking-tight text-slate-950">
          Stampley Chats
        </h1>

        <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-600">
          Read-only view of Stampley chat sessions saved from participant
          check-ins. Expand any session to review the full transcript.
        </p>

        <form
          action="/admin/stampley-chats"
          method="get"
          className="mt-6 border border-slate-200 bg-gradient-to-br from-white to-stone-50 p-5 shadow-sm"
        >
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
            Filters
          </p>
          <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
            <label className="block text-sm">
              <span className="font-medium text-slate-700">From date</span>
              <input
                type="date"
                name="from"
                defaultValue={filters.from ?? ""}
                className="mt-1 w-full border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-200"
              />
            </label>
            <label className="block text-sm">
              <span className="font-medium text-slate-700">To date</span>
              <input
                type="date"
                name="to"
                defaultValue={filters.to ?? ""}
                className="mt-1 w-full border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-200"
              />
            </label>
            <label className="block text-sm">
              <span className="font-medium text-slate-700">Domain</span>
              <select
                name="domain"
                defaultValue={filters.domain ?? "ALL"}
                className="mt-1 w-full border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-200"
              >
                <option value="ALL">All domains</option>
                {STUDY_DOMAINS.map((domain) => (
                  <option key={domain} value={domain}>
                    {domain}
                  </option>
                ))}
              </select>
            </label>
            <label className="flex items-end gap-2 pb-2 text-sm">
              <input
                type="checkbox"
                name="highStress"
                value="true"
                defaultChecked={filters.highStress}
                className="h-4 w-4 border-slate-300 text-slate-900"
              />
              <span className="font-medium text-slate-700">
                High stress only (stress ≥ 9)
              </span>
            </label>
          </div>
          <div className="mt-4 flex flex-wrap items-center gap-3">
            <button
              type="submit"
              className="inline-flex cursor-pointer items-center border border-slate-800 bg-slate-900 px-4 py-2 text-sm font-medium text-white shadow-sm transition hover:bg-slate-800"
            >
              Apply filters
            </button>
            <a
              href="/admin/stampley-chats"
              className="text-sm font-medium text-slate-600 underline-offset-2 hover:text-slate-900 hover:underline"
            >
              Clear filters
            </a>
            {filtersActive ? (
              <span className="text-xs text-slate-500">
                Showing filtered results
              </span>
            ) : null}
          </div>
        </form>
      </div>

      <StampleyChatsIdentifiedPanel
        initial={sessions}
        urlFilters={{
          from: filters.from,
          to: filters.to,
          domain: filters.domain,
          week: filters.week,
          highStress: filters.highStress,
        }}
      />
    </main>
  )
}
