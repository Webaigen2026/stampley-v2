import Link from "next/link"
import { DdsIdentifiedPanel } from "@/components/admin/dds/dds-identified-panel"
import { StripIdentifiedSearchParam } from "@/components/admin/strip-identified-search-param"
import { loadAdminDdsRows } from "@/lib/admin-directory-search"
import { recordPhiPageViewOrThrow } from "@/lib/admin-phi-page"
import { filterKeysFromFlags } from "@/lib/audit-metadata"
import { requireAdminPage } from "@/lib/admin-authz"
import { hasCapability } from "@/lib/admin-capabilities"

export const dynamic = "force-dynamic"

type SearchParams = {
  highDistress?: string
}

export default async function AdminDDSPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>
}) {
  const actor = await requireAdminPage([
    "canViewOperationalParticipantData",
    "canViewClinicalSurveyData",
  ])
  const canViewItems = hasCapability(actor.role, "canViewClinicalSurveyData")
  const params = await searchParams
  const highDistressOnly = params.highDistress === "1"

  const rows = await loadAdminDdsRows({
    q: null,
    highDistressOnly,
    canViewItems,
  })

  await recordPhiPageViewOrThrow({
    action: "ADMIN_DDS_LIST_VIEWED",
    resourceType: "DDS",
    metadata: {
      filterKeys: filterKeysFromFlags({
        q: false,
      }),
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
          DDS-17 Responses
        </h1>

        <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-600">
          Review baseline Diabetes Distress Scale scores and individual item
          responses. Scores ≥ 3 indicate moderate distress or higher on that
          scale.
        </p>
      </div>

      <form
        action="/admin/dds"
        method="get"
        className="border border-slate-200 bg-gradient-to-br from-white to-stone-50 p-5 shadow-sm"
      >
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
          Filters
        </p>

        <div className="mt-4 flex flex-col gap-4 sm:flex-row sm:flex-wrap sm:items-end">
          <label className="flex items-center gap-2 pb-2 text-sm text-slate-700">
            <input
              type="checkbox"
              name="highDistress"
              value="1"
              defaultChecked={highDistressOnly}
              className="h-4 w-4 border-slate-300"
            />
            High distress only (≥ 3)
          </label>

          <div className="flex gap-2">
            <button
              type="submit"
              className="border border-slate-900 bg-slate-900 px-4 py-2 text-xs font-semibold uppercase tracking-[0.08em] text-white hover:bg-black"
            >
              Apply
            </button>

            {highDistressOnly ? (
              <Link
                href="/admin/dds"
                className="border border-slate-300 bg-white px-4 py-2 text-xs font-semibold uppercase tracking-[0.08em] text-slate-700 hover:bg-slate-50"
              >
                Clear
              </Link>
            ) : null}
          </div>
        </div>
      </form>

      <DdsIdentifiedPanel
        initial={rows}
        canViewItems={canViewItems}
        highDistressOnly={highDistressOnly}
      />

      <p className="text-xs leading-5 text-slate-500">
        Individual item responses (q1–q17) are stored when participants submit
        the DDS-17 survey. Domain and total scores are calculated at submission
        time and are not recalculated on this page.
      </p>
    </main>
  )
}
