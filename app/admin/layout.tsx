import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import { AdminAppShell } from "@/components/admin/admin-app-shell"
import {
  isStaffRole,
  visibleAdminNavHrefs,
  type AppUserRole,
} from "@/lib/admin-capabilities"

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await auth()
  const role = session?.user?.role as AppUserRole | undefined
  if (!session || !isStaffRole(role)) {
    redirect("/login")
  }

  return (
    <AdminAppShell
      email={session.user?.email ?? ""}
      role={role}
      visibleHrefs={visibleAdminNavHrefs(role)}
    >
      {children}
    </AdminAppShell>
  )
}
