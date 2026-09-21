import { prisma } from "@/lib/prisma"
import { GenerateStudyKeyForm } from "@/components/admin/keys/generate-study-key-form"
import { KeysDirectory } from "@/components/admin/keys/keys-directory"
import { StripIdentifiedSearchParam } from "@/components/admin/strip-identified-search-param"
import { loadAdminKeyDirectory } from "@/lib/admin-directory-search"
import { recordAdminPageView } from "@/lib/audit-admin"
import { filterKeysFromFlags } from "@/lib/audit-metadata"
import { requireAdminPage } from "@/lib/admin-authz"

export const dynamic = "force-dynamic"

type SearchParams = {
  status?: string
  sort?: string
  page?: string
  pageSize?: string
}

export default async function AdminKeysPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>
}) {
  await requireAdminPage("canManageStudyKeys")
  const params = await searchParams

  const status = params.status ?? "ALL"
  const sort = params.sort ?? "created_at_desc"
  const page = Math.max(Number(params.page ?? "1"), 1)
  const pageSize = Math.max(Number(params.pageSize ?? "20"), 1)

  const [directory, total, used, available] = await Promise.all([
    loadAdminKeyDirectory({
      q: null,
      status,
      sort,
      page,
      pageSize,
    }),
    prisma.studyKey.count(),
    prisma.studyKey.count({ where: { isUsed: true } }),
    prisma.studyKey.count({ where: { isUsed: false } }),
  ])

  await recordAdminPageView({
    policy: "fail-open",
    action: "ADMIN_STUDY_KEY_LIST_VIEWED",
    resourceType: "STUDY_KEY",
    metadata: {
      page,
      pageSize,
      filterKeys: filterKeysFromFlags({ q: false }),
    },
  })

  return (
    <div className="space-y-8">
      <StripIdentifiedSearchParam />
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight text-gray-900">
            Study Keys
          </h1>
          <p className="mt-1.5 text-sm text-gray-500">
            {available} available · {used} used · {total} total
          </p>
        </div>

        <GenerateStudyKeyForm />
      </div>

      <section className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div
          className="border border-gray-100 p-5 relative overflow-hidden"
          style={{
            backgroundImage: "url('/images/gradient5.jpg')",
            backgroundSize: "cover",
            backgroundPosition: "right bottom",
            backgroundRepeat: "no-repeat",
          }}
        >
          <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-white">
            Total Keys
          </p>
          <p className="mt-2 text-3xl font-semibold tracking-tight text-white">
            {total}
          </p>
        </div>

        <div
          className="border border-gray-100 p-5 relative overflow-hidden"
          style={{
            backgroundImage: "url('/images/gradient4.jpg')",
            backgroundSize: "cover",
            backgroundPosition: "right bottom",
            backgroundRepeat: "no-repeat",
          }}
        >
          <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-white">
            Available
          </p>
          <p className="mt-2 text-3xl font-semibold tracking-tight text-white">
            {available}
          </p>
        </div>

        <div
          className="border border-gray-100 p-5 relative overflow-hidden"
          style={{
            backgroundImage: "url('/images/gradient3.jpg')",
            backgroundSize: "cover",
            backgroundPosition: "right bottom",
            backgroundRepeat: "no-repeat",
          }}
        >
          <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-white">
            Used
          </p>
          <p className="mt-2 text-3xl font-semibold tracking-tight text-white">
            {used}
          </p>
        </div>
      </section>

      <section className="overflow-hidden border border-gray-200/80 bg-white shadow-sm">
        <div className="border-b border-gray-100 bg-gradient-to-b from-gray-50 to-white px-6 py-5">
          <h2 className="text-base font-semibold text-gray-900">All Study Keys</h2>
        </div>
        <div className="px-6 py-5">
          <KeysDirectory
            initial={directory}
            status={status}
            sort={sort}
            pageSize={pageSize}
          />
        </div>
      </section>
    </div>
  )
}
