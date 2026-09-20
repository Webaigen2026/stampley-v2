import { prisma } from "@/lib/prisma"
import type { Prisma, UserRole } from "@/lib/generated/prisma/client"
import { AddUserForm } from "@/components/admin/add-user-form"
import { UsersTableToolbar } from "@/components/admin/users/users-table-toolbar"
import { UsersTable } from "@/components/admin/users/users-table"
import { UsersPagination } from "@/components/admin/users/users-pagination"
import { recordAdminPageView } from "@/lib/audit-admin"
import { filterKeysFromFlags } from "@/lib/audit-metadata"
import { requireAdminPage } from "@/lib/admin-authz"
import {
  creatableRolesFor,
  hasCapability,
  isUserRole,
} from "@/lib/admin-capabilities"

export const dynamic = "force-dynamic"

type SearchParams = {
  q?: string
  role?: string
  sort?: string
  page?: string
  pageSize?: string
}

const SORT_MAP: Record<string, Prisma.UserOrderByWithRelationInput> = {
  created_at_desc: { createdAt: "desc" },
  created_at_asc: { createdAt: "asc" },
  email_asc: { email: "asc" },
  email_desc: { email: "desc" },
}

export default async function AdminUsersPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>
}) {
  const actor = await requireAdminPage("canViewParticipantDirectory")
  const params = await searchParams

  const q = (params.q ?? "").trim()
  const role = params.role ?? "ALL"
  const sort = params.sort ?? "created_at_desc"
  const page = Math.max(Number(params.page ?? "1"), 1)
  const pageSize = Math.max(Number(params.pageSize ?? "20"), 1)

  const where: Prisma.UserWhereInput = {}

  if (q) {
    where.OR = [
      { email: { contains: q, mode: "insensitive" } },
      { studyId: { contains: q, mode: "insensitive" } },
    ]
  }

  if (role !== "ALL" && isUserRole(role)) {
    where.role = role as UserRole
  }

  const orderBy = SORT_MAP[sort] ?? SORT_MAP.created_at_desc

  const [users, totalUsers] = await Promise.all([
    prisma.user.findMany({
      where,
      orderBy,
      skip: (page - 1) * pageSize,
      take: pageSize,
      select: {
        id: true,
        email: true,
        role: true,
        studyId: true,
        createdAt: true,
        preSurveyResponse: {
          select: { completedAt: true },
        },
        _count: {
          select: { checkInSubmissions: true },
        },
      },
    }),
    prisma.user.count({ where }),
  ])

  const rows = users.map((u) => ({
    id: u.id,
    email: u.email,
    role: u.role,
    study_id: u.studyId,
    created_at: u.createdAt,
    pre_survey_completed_at: u.preSurveyResponse?.completedAt ?? null,
    checkin_count: u._count.checkInSubmissions,
  }))

  const totalPages = Math.max(Math.ceil(totalUsers / pageSize), 1)

  await recordAdminPageView({
    policy: "fail-open",
    action: "ADMIN_USER_DIRECTORY_VIEWED",
    resourceType: "USER_DIRECTORY",
    metadata: {
      page,
      pageSize,
      filterKeys: filterKeysFromFlags({ q: Boolean(q) }),
    },
  })

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-semibold tracking-tight text-gray-900">
          Users
        </h1>
        <p className="mt-1.5 text-sm text-gray-500">
          Manage admins and participants.
        </p>
      </div>

      <AddUserForm creatableRoles={creatableRolesFor(actor.role)} />

      <section className="overflow-hidden  border border-gray-200/80 bg-white">
        <div className="border-b border-gray-100 bg-gradient-to-b from-gray-50 to-white px-6 py-5">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <h2 className="text-base font-semibold text-gray-900">
                All Users
              </h2>
              <p className="mt-1 text-sm text-gray-500">
                {totalUsers} total user{totalUsers === 1 ? "" : "s"}
              </p>
            </div>

            <UsersTableToolbar
              q={q}
              role={role}
              sort={sort}
              pageSize={pageSize}
            />
          </div>
        </div>

        <UsersTable
          users={rows}
          actorUserId={actor.userId}
          canManageRoles={hasCapability(actor.role, "canManagePrivilegedUsers")}
          canDeleteUsers={hasCapability(actor.role, "canDeleteUsers")}
        />

        <UsersPagination
          page={page}
          pageSize={pageSize}
          totalUsers={totalUsers}
          totalPages={totalPages}
        />
      </section>
    </div>
  )
}
