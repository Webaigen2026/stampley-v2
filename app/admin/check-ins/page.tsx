import { prisma } from "@/lib/prisma"
import { recordPhiPageViewOrThrow } from "@/lib/admin-phi-page"
import { requireAdminPage } from "@/lib/admin-authz"
import { mapAdminCheckInListRow } from "@/lib/admin-check-in-narratives"
import { CheckInNarrativeCard } from "@/components/admin/check-ins/check-in-narrative-card"

export const dynamic = "force-dynamic"

function formatDate(value: Date | string | null): string {
  if (!value) return "—"
  const d = new Date(value)
  return Number.isNaN(d.getTime()) ? "—" : d.toLocaleDateString()
}

function formatDateTime(value: Date | string | null): string {
  if (!value) return "—"
  const d = new Date(value)
  return Number.isNaN(d.getTime()) ? "—" : d.toLocaleString()
}

export default async function AdminCheckInsPage() {
  await requireAdminPage("canViewCheckInNarratives")
  const result = await prisma.checkInSubmission.findMany({
    orderBy: { createdAt: "desc" },
    take: 100,
    select: {
      id: true,
      checkInDate: true,
      distress: true,
      mood: true,
      energy: true,
      domain: true,
      subscale: true,
      needsSafetyEscalation: true,
      createdAt: true,
      user: { select: { email: true } },
    },
  })

  const checkIns = result.map((item) =>
    mapAdminCheckInListRow({
      id: item.id,
      email: item.user.email,
      checkInDate: item.checkInDate,
      createdAt: item.createdAt,
      distress: item.distress,
      mood: item.mood,
      energy: item.energy,
      domain: item.domain,
      subscale: item.subscale,
      needsSafetyEscalation: item.needsSafetyEscalation,
    })
  )

  await recordPhiPageViewOrThrow({
    action: "ADMIN_CHECKIN_LIST_VIEWED",
    resourceType: "CHECK_IN",
    metadata: {
      includesNarratives: false,
    },
  })

  return (
    <main className="space-y-8">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
          Admin
        </p>

        <h1 className="mt-2 text-3xl font-semibold tracking-tight text-slate-950">
          Participant Check-ins
        </h1>

        <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-600">
          Review daily check-in submissions, participant distress levels,
          selected domains, reflections, and safety flags.
        </p>
      </div>

      <section className="overflow-hidden border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-200 bg-slate-50 px-5 py-4">
          <h2 className="text-sm font-semibold text-slate-900">
            Recent Check-ins
          </h2>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full border-collapse text-left text-sm">
            <thead className="bg-white">
              <tr className="border-b border-slate-200">
                <th className="px-5 py-3 font-semibold text-slate-600">User</th>
                <th className="px-5 py-3 font-semibold text-slate-600">Date</th>
                <th className="px-5 py-3 font-semibold text-slate-600">Distress</th>
                <th className="px-5 py-3 font-semibold text-slate-600">Mood</th>
                <th className="px-5 py-3 font-semibold text-slate-600">Energy</th>
                <th className="px-5 py-3 font-semibold text-slate-600">Domain</th>
                <th className="px-5 py-3 font-semibold text-slate-600">Safety</th>
              </tr>
            </thead>

            <tbody>
              {checkIns.length === 0 ? (
                <tr>
                  <td
                    colSpan={7}
                    className="px-5 py-10 text-center text-slate-500"
                  >
                    No check-ins found.
                  </td>
                </tr>
              ) : (
                checkIns.map((item) => (
                  <tr
                    key={item.id}
                    className="border-b border-slate-100 hover:bg-slate-50"
                  >
                    <td className="px-5 py-4 text-slate-900">
                      {item.email}
                    </td>

                    <td className="px-5 py-4 text-slate-600">
                      {formatDate(item.checkInDate)}
                    </td>

                    <td className="px-5 py-4 font-medium text-slate-900">
                      {item.distress}
                    </td>

                    <td className="px-5 py-4 text-slate-700">
                      {item.mood}
                    </td>

                    <td className="px-5 py-4 text-slate-700">
                      {item.energy}
                    </td>

                    <td className="px-5 py-4 text-slate-700">
                      {item.domain ?? "—"}
                    </td>

                    <td className="px-5 py-4">
                      {item.needsSafetyEscalation ? (
                        <span className="border border-red-200 bg-red-50 px-2 py-1 text-xs font-semibold text-red-700">
                          Flagged
                        </span>
                      ) : (
                        <span className="border border-green-200 bg-green-50 px-2 py-1 text-xs font-semibold text-green-700">
                          Clear
                        </span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>

      <section className="grid gap-4">
        {checkIns.map((item) => (
          <CheckInNarrativeCard
            key={`${item.id}-details`}
            checkInId={item.id}
            heading={item.email || "Participant"}
            subheading={`${formatDateTime(item.createdAt)} · ${item.domain ?? "No domain"} · ${item.subscale ?? "No subscale"}`}
            flagged={Boolean(item.needsSafetyEscalation)}
          />
        ))}
      </section>
    </main>
  )
}
