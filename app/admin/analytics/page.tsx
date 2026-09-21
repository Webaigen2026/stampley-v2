import { AnalyticsIdentifiedPanel } from "@/components/admin/analytics/analytics-identified-panel"
import { StripIdentifiedSearchParam } from "@/components/admin/strip-identified-search-param"
import { loadAdminAnalyticsDashboard } from "@/lib/admin-analytics-data"
import {
  buildUrlSafeAnalyticsQueryString,
  hasActiveUrlSafeAnalyticsFilters,
  parseUrlSafeAnalyticsFilters,
  STUDY_DOMAINS,
} from "@/lib/admin-analytics-filters"
import { recordPhiPageViewOrThrow } from "@/lib/admin-phi-page"
import { filterKeysFromAnalytics } from "@/lib/audit-metadata"
import { requireAdminPage } from "@/lib/admin-authz"
import { hasCapability } from "@/lib/admin-capabilities"
import {
  analyticsFiltersForView,
  surveyViewCapabilities,
} from "@/lib/admin-phi-minimization"

export const dynamic = "force-dynamic"

type SearchParams = Record<string, string | string[] | undefined>

export default async function AdminAnalyticsPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>
}) {
  const actor = await requireAdminPage("canViewAggregateAnalytics")
  const caps = surveyViewCapabilities(actor.role)
  const canExport = hasCapability(actor.role, "canExportCodedResearchData")
  const params = await searchParams
  const filters = analyticsFiltersForView(
    parseUrlSafeAnalyticsFilters(params),
    caps
  )
  const exportQs = buildUrlSafeAnalyticsQueryString(filters)
  const filtersActive = hasActiveUrlSafeAnalyticsFilters(filters)
  const dashboard = await loadAdminAnalyticsDashboard(filters, caps)

  await recordPhiPageViewOrThrow({
    action: "ADMIN_ANALYTICS_VIEWED",
    resourceType: "ANALYTICS",
    metadata: {
      filterKeys: filterKeysFromAnalytics(filters),
      includesNarratives: false,
    },
  })

  return (
    <main className="space-y-8">
      <StripIdentifiedSearchParam />
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
          Admin · Research
        </p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight text-slate-950">
          Longitudinal Analytics
        </h1>
        <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-600">
          Read-only view of daily check-in trends, Stampley engagement, domain
          focus, and high-stress monitoring across the 4-week study. Summaries
          only — full chat transcripts are not shown.
        </p>

        <form
          action="/admin/analytics"
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
            <label className="block text-sm">
              <span className="font-medium text-slate-700">Study week</span>
              <select
                name="week"
                defaultValue={
                  filters.week != null ? String(filters.week) : "ALL"
                }
                className="mt-1 w-full border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-200"
              >
                <option value="ALL">All weeks</option>
                <option value="1">Week 1</option>
                <option value="2">Week 2</option>
                <option value="3">Week 3</option>
                <option value="4">Week 4</option>
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
                High-stress only (stress ≥ 9)
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
              href="/admin/analytics"
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

        {canExport ? (
          <div className="mt-5 flex flex-wrap gap-3">
            <a
              href={`/api/admin/analytics/check-ins/export${exportQs}`}
              className="inline-flex items-center border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-800 shadow-sm transition hover:border-slate-400 hover:bg-stone-50"
            >
              Export check-ins CSV
            </a>
            <a
              href={`/api/admin/analytics/stampley-sessions/export${exportQs}`}
              className="inline-flex items-center border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-800 shadow-sm transition hover:border-slate-400 hover:bg-stone-50"
            >
              Export Stampley sessions CSV
            </a>
            <a
              href={`/api/admin/analytics/high-stress/export${exportQs}`}
              className="inline-flex items-center border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-800 shadow-sm transition hover:border-slate-400 hover:bg-stone-50"
            >
              Export high-stress CSV
            </a>
          </div>
        ) : null}
      </div>

      <AnalyticsIdentifiedPanel
        initial={dashboard}
        caps={caps}
        enabled={caps.canViewIdentifiedAnalytics}
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
