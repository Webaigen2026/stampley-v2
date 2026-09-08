import { prisma } from "@/lib/prisma"
import type { Prisma } from "@/lib/generated/prisma/client"
import { deleteStudyKey } from "@/actions/admin"
import { CopyButton } from "@/components/admin/copy-button"
import { GenerateStudyKeyForm } from "@/components/admin/keys/generate-study-key-form"
import { KeysTableToolbar } from "@/components/admin/keys/keys-table-toolbar"
import { KeysTable } from "@/components/admin/keys/keys-table"
import { KeysPagination } from "@/components/admin/keys/keys-pagination"

export const dynamic = "force-dynamic"

type SearchParams = {
  q?: string
  status?: string
  sort?: string
  page?: string
  pageSize?: string
}

const SORT_MAP: Record<string, Prisma.StudyKeyOrderByWithRelationInput> = {
  created_at_desc: { createdAt: "desc" },
  created_at_asc: { createdAt: "asc" },
  key_asc: { key: "asc" },
  key_desc: { key: "desc" },
}

export default async function AdminKeysPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>
}) {
  const params = await searchParams

  const q = (params.q ?? "").trim()
  const status = params.status ?? "ALL"
  const sort = params.sort ?? "created_at_desc"
  const page = Math.max(Number(params.page ?? "1"), 1)
  const pageSize = Math.max(Number(params.pageSize ?? "20"), 1)

  const where: Prisma.StudyKeyWhereInput = {}

  if (status === "USED") {
    where.isUsed = true
  } else if (status === "AVAILABLE") {
    where.isUsed = false
  }

  if (q) {
    const matchingUsers = await prisma.user.findMany({
      where: { email: { contains: q, mode: "insensitive" } },
      select: { studyId: true },
    })
    const matchingStudyIds = matchingUsers
      .map((u) => u.studyId)
      .filter((id): id is string => typeof id === "string" && id.length > 0)

    where.OR = [
      { key: { contains: q, mode: "insensitive" } },
      ...(matchingStudyIds.length > 0
        ? [{ key: { in: matchingStudyIds } }]
        : []),
    ]
  }

  const orderBy = SORT_MAP[sort] ?? SORT_MAP.created_at_desc

  const [keys, filteredTotal, total, used, available] = await Promise.all([
    prisma.studyKey.findMany({
      where,
      orderBy,
      skip: (page - 1) * pageSize,
      take: pageSize,
      select: {
        id: true,
        key: true,
        isUsed: true,
        createdBy: true,
        createdAt: true,
      },
    }),
    prisma.studyKey.count({ where }),
    prisma.studyKey.count(),
    prisma.studyKey.count({ where: { isUsed: true } }),
    prisma.studyKey.count({ where: { isUsed: false } }),
  ])

  const associatedUsers =
    keys.length === 0
      ? []
      : await prisma.user.findMany({
          where: { studyId: { in: keys.map((k) => k.key) } },
          select: { studyId: true, email: true },
        })

  const emailByStudyId = new Map(
    associatedUsers.map((u) => [u.studyId, u.email])
  )

  const keyRows = keys.map((k) => ({
    id: k.id,
    key: k.key,
    is_used: k.isUsed === true,
    created_at: k.createdAt as Date,
    participant_email: emailByStudyId.get(k.key) ?? null,
  }))

  const totalPages = Math.max(Math.ceil(filteredTotal / pageSize), 1)

  return (
    <div className="space-y-8">
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
    className=" border border-gray-100 p-5 relative overflow-hidden"
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
    className=" border border-gray-100 p-5 relative overflow-hidden"
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
    className=" border border-gray-100 p-5 relative overflow-hidden"
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

      <section className="overflow-hidden  border border-gray-200/80 bg-white shadow-sm">
        <div className="border-b border-gray-100 bg-gradient-to-b from-gray-50 to-white px-6 py-5">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <h2 className="text-base font-semibold text-gray-900">All Study Keys</h2>
              <p className="mt-1 text-sm text-gray-500">
                {filteredTotal} matching key{filteredTotal === 1 ? "" : "s"}
              </p>
            </div>

            <KeysTableToolbar
              q={q}
              status={status}
              sort={sort}
              pageSize={pageSize}
            />
          </div>
        </div>

        <KeysTable
          keys={keyRows}
          deleteStudyKey={async (id: string) => {
            "use server"
            await deleteStudyKey(id)
          }}
          CopyButton={CopyButton}
        />

        <KeysPagination
          page={page}
          pageSize={pageSize}
          totalItems={filteredTotal}
          totalPages={totalPages}
          q={q}
          status={status}
          sort={sort}
        />
      </section>
    </div>
  )
}