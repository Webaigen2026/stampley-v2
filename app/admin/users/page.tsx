import { AddUserForm } from "@/components/admin/add-user-form"
import { UsersDirectory } from "@/components/admin/users/users-directory"
import { StripIdentifiedSearchParam } from "@/components/admin/strip-identified-search-param"
import { loadAdminUserDirectory } from "@/lib/admin-directory-search"
import { recordAdminPageView } from "@/lib/audit-admin"
import { filterKeysFromFlags } from "@/lib/audit-metadata"
import { requireAdminPage } from "@/lib/admin-authz"
import { creatableRolesFor, hasCapability } from "@/lib/admin-capabilities"

export const dynamic = "force-dynamic"

type SearchParams = {
  role?: string
  sort?: string
  page?: string
  pageSize?: string
}

export default async function AdminUsersPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>
}) {
  const actor = await requireAdminPage("canViewParticipantDirectory")
  const params = await searchParams

  const role = params.role ?? "ALL"
  const sort = params.sort ?? "created_at_desc"
  const page = Math.max(Number(params.page ?? "1"), 1)
  const pageSize = Math.max(Number(params.pageSize ?? "20"), 1)

  const directory = await loadAdminUserDirectory({
    q: null,
    role,
    sort,
    page,
    pageSize,
  })

  await recordAdminPageView({
    policy: "fail-open",
    action: "ADMIN_USER_DIRECTORY_VIEWED",
    resourceType: "USER_DIRECTORY",
    metadata: {
      page,
      pageSize,
      filterKeys: filterKeysFromFlags({ q: false }),
    },
  })

  return (
    <div className="space-y-8">
      <StripIdentifiedSearchParam />
      <div>
        <h1 className="text-3xl font-semibold tracking-tight text-gray-900">
          Users
        </h1>
        <p className="mt-1.5 text-sm text-gray-500">
          Manage admins and participants.
        </p>
      </div>

      <AddUserForm creatableRoles={creatableRolesFor(actor.role)} />

      <section className="overflow-hidden border border-gray-200/80 bg-white">
        <div className="border-b border-gray-100 bg-gradient-to-b from-gray-50 to-white px-6 py-5">
          <h2 className="text-base font-semibold text-gray-900">All Users</h2>
        </div>
        <div className="px-6 py-5">
          <UsersDirectory
            initial={directory}
            role={role}
            sort={sort}
            pageSize={pageSize}
            actorUserId={actor.userId}
            canManageRoles={hasCapability(actor.role, "canManagePrivilegedUsers")}
            canDeleteUsers={hasCapability(actor.role, "canDeleteUsers")}
          />
        </div>
      </section>
    </div>
  )
}
