"use client"

import Link from "next/link"
import { changeUserRole, deleteUser } from "@/actions/admin"
import type { AppUserRole } from "@/lib/admin-capabilities"

const ROLE_OPTIONS: Array<{ value: AppUserRole; label: string }> = [
  { value: "PARTICIPANT", label: "Participant" },
  { value: "STUDY_COORDINATOR", label: "Study Coordinator" },
  { value: "CLINICAL_REVIEWER", label: "Clinical Reviewer" },
  { value: "ADMIN", label: "Admin" },
]

export function UsersTable({
  users,
  actorUserId,
  canManageRoles,
  canDeleteUsers,
}: {
  users: Array<{
    id: string
    email: string
    role: AppUserRole | string
    study_id?: string | null
    created_at: Date | string | null
    pre_survey_completed_at?: Date | string | null
    checkin_count?: number
  }>
  actorUserId: string
  canManageRoles: boolean
  canDeleteUsers: boolean
}) {
  return (
    <div className="overflow-hidden  border border-slate-300 bg-white shadow-sm">
      <div className="border-b border-slate-300 bg-slate-50 px-6 py-4">
        <h2 className="text-base font-semibold text-slate-900">
          User Management
        </h2>
        <p className="mt-1 text-sm text-slate-600">
          Review participant records, survey status, roles, and account actions.
        </p>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full text-left">
          <thead className="bg-[#005ea8]">
            <tr>
              {[
                "User",
                "Role",
                "Pre-Survey",
                "Check",
                "Study ID",
                "Joined",
                ...(canManageRoles ? ["Actions"] : []),
                ...(canDeleteUsers ? ["Remove"] : []),
              ].map((header) => (
                <th
                  key={header}
                  className="whitespace-nowrap px-5 py-3 text-xs font-bold uppercase tracking-wide text-white"
                >
                  {header}
                </th>
              ))}
            </tr>
          </thead>

          <tbody className="divide-y divide-slate-200">
            {users.map((u) => {
              const isSelf = u.id === actorUserId
              return (
              <tr key={u.id} className="bg-white transition hover:bg-slate-50">
                <td className="px-5 py-4">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center  border border-slate-300 bg-slate-100 text-sm font-bold text-slate-700">
                      {u.email?.[0]?.toUpperCase() ?? "?"}
                    </div>

                    <div className="min-w-0">
                      <Link
                        href={`/admin/users/${u.id}`}
                        className="truncate text-sm font-semibold text-[#005ea8] underline-offset-2 hover:underline"
                      >
                        {u.email}
                      </Link>
                      <p className="mt-1 text-xs text-slate-500">
                        View participant profile
                      </p>
                    </div>
                  </div>
                </td>

                <td className="px-5 py-4">
                  <span
                    className={`inline-flex  border px-2.5 py-1 text-xs font-semibold ${
                      u.role === "ADMIN"
                        ? "border-indigo-300 bg-indigo-50 text-indigo-800"
                        : "border-blue-300 bg-blue-50 text-blue-800"
                    }`}
                  >
                    {u.role}
                  </span>
                </td>

                <td className="px-5 py-4">
                  {u.pre_survey_completed_at ? (
                    <span className="inline-flex  border border-green-300 bg-green-50 px-2.5 py-1 text-xs font-semibold text-green-800">
                      Completed
                    </span>
                  ) : (
                    <span className="inline-flex  border border-amber-300 bg-amber-50 px-2.5 py-1 text-xs font-semibold text-amber-800">
                      Pending
                    </span>
                  )}
                </td>

                <td className="px-5 py-4">
                  <span className="inline-flex  border border-slate-300 bg-slate-50 px-2.5 py-1 text-xs font-semibold text-slate-700">
                    {u.checkin_count ?? 0}
                  </span>
                </td>

                <td className="px-5 py-4">
                  <span className="inline-flex  border border-slate-300 bg-slate-50 px-2.5 py-1 font-mono text-xs text-slate-700">
                    {u.study_id || "—"}
                  </span>
                </td>

                <td className="px-5 py-4 text-sm text-slate-600">
                  {u.created_at ? new Date(u.created_at).toLocaleDateString() : "—"}
                </td>

                {canManageRoles ? (
                  <td className="px-5 py-4">
                    {isSelf ? (
                      <span className="text-xs text-slate-400">Current user</span>
                    ) : (
                      <form
                        action={async (formData) => {
                          await changeUserRole(formData)
                          return
                        }}
                        className="flex flex-col gap-2"
                      >
                        <input type="hidden" name="userId" value={u.id} />
                        <select
                          name="toRole"
                          defaultValue={u.role}
                          className="border border-slate-300 bg-white px-2 py-1 text-xs text-slate-800"
                        >
                          {ROLE_OPTIONS.map((option) => (
                            <option key={option.value} value={option.value}>
                              {option.label}
                            </option>
                          ))}
                        </select>
                        <input
                          type="password"
                          name="currentPassword"
                          autoComplete="current-password"
                          placeholder="Password if promoting to admin"
                          className="border border-slate-300 bg-white px-2 py-1 text-xs text-slate-800"
                        />
                        <button
                          type="submit"
                          className="inline-flex items-center justify-center border border-[#005ea8] bg-white px-3 py-2 text-xs font-semibold text-[#005ea8] transition hover:bg-[#eef7ff]"
                        >
                          Update role
                        </button>
                      </form>
                    )}
                  </td>
                ) : null}

                {canDeleteUsers ? (
                  <td className="px-5 py-4 text-center">
                    {isSelf ? (
                      <span className="text-xs text-slate-400">—</span>
                    ) : (
                      <form
                        action={async (formData) => {
                          await deleteUser(formData)
                          return
                        }}
                        className="flex flex-col items-center gap-2"
                      >
                        <input type="hidden" name="userId" value={u.id} />
                        <input
                          type="password"
                          name="currentPassword"
                          autoComplete="current-password"
                          placeholder="Confirm password"
                          className="w-36 border border-slate-300 bg-white px-2 py-1 text-xs text-slate-800"
                        />
                        <button
                          type="submit"
                          className="inline-flex h-9 w-9 items-center justify-center  border border-slate-300 bg-white text-slate-500 transition hover:border-red-300 hover:bg-red-50 hover:text-red-700"
                          aria-label={`Delete ${u.email}`}
                        >
                          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </form>
                    )}
                  </td>
                ) : null}
              </tr>
            )})}

            {users.length === 0 && (
              <tr>
                <td colSpan={8} className="px-6 py-16 text-center">
                  <div className="mx-auto max-w-sm">
                    <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center  border border-slate-300 bg-slate-50 text-slate-500">
                      <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" d="M17 20h5V4H2v16h5m10 0v-2a4 4 0 00-4-4H9a4 4 0 00-4 4v2m12 0H7m10-12a4 4 0 11-8 0 4 4 0 018 0z" />
                      </svg>
                    </div>

                    <p className="text-sm font-semibold text-slate-900">
                      No users found
                    </p>

                    <p className="mt-1 text-sm text-slate-600">
                      Try changing your search or filters.
                    </p>
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
