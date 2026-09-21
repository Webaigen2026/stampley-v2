import { StampleySummaryCell } from "@/components/admin/analytics/stampley-summary-cell"
import { STUDY_DOMAINS } from "@/lib/admin-analytics-url"
import type { AdminAnalyticsDashboard } from "@/lib/admin-analytics-dashboard"
import type { SurveyViewCapabilities } from "@/lib/admin-phi-minimization"

function formatDate(value: unknown): string {
  if (!value) return "—"
  const d = new Date(String(value))
  return Number.isNaN(d.getTime()) ? "—" : d.toLocaleDateString()
}

function formatNumber(value: unknown, digits = 1): string {
  if (value == null || value === "") return "—"
  const n = Number(value)
  return Number.isFinite(n) ? n.toFixed(digits) : "—"
}

function pct(numerator: number, denominator: number): string {
  if (denominator <= 0) return "—"
  return `${Math.round((numerator / denominator) * 100)}%`
}

function StatCard({
  label,
  value,
  hint,
  accent = false,
}: {
  label: string
  value: string | number
  hint?: string
  accent?: boolean
}) {
  return (
    <div
      className={`border p-5 shadow-sm ${
        accent
          ? "border-amber-200/80 bg-gradient-to-br from-amber-50/90 to-stone-50"
          : "border-slate-200 bg-white"
      }`}
    >
      <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">
        {label}
      </p>
      <p className="mt-2 text-3xl font-semibold tracking-tight text-slate-950">
        {value}
      </p>
      {hint ? (
        <p className="mt-1.5 text-xs leading-5 text-slate-500">{hint}</p>
      ) : null}
    </div>
  )
}

function Section({
  title,
  description,
  children,
}: {
  title: string
  description?: string
  children: React.ReactNode
}) {
  return (
    <section className="overflow-hidden border border-slate-200 bg-white shadow-sm">
      <div className="border-b border-slate-200 bg-stone-50/80 px-5 py-4">
        <h2 className="text-sm font-semibold text-slate-900">{title}</h2>
        {description ? (
          <p className="mt-1 text-xs leading-5 text-slate-500">{description}</p>
        ) : null}
      </div>
      {children}
    </section>
  )
}

export function AnalyticsResults({
  data,
  caps,
  identifiedActive,
}: {
  data: AdminAnalyticsDashboard
  caps: SurveyViewCapabilities
  identifiedActive: boolean
}) {
  const {
    overview,
    totalParticipants,
    preSurveyCompleted,
    ddsCompleted,
    withCheckins,
    rowFiltersActive,
    domainCounts,
    participants,
    highStressRows,
    engagementRows,
  } = data
  const domainCountMap = new Map(
    domainCounts.map((row) => [row.domain, row.count])
  )

  return (
    <>
      <div>
        <h2 className="mb-3 text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
          Overview
        </h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-6">
          <StatCard
            label="Participants"
            value={Number(overview.total_participants ?? 0)}
            hint={
              rowFiltersActive
                ? "Participants with matching check-ins"
                : identifiedActive && caps.canViewIdentifiedAnalytics
                  ? "Participants matching email search"
                  : "Enrolled participants"
            }
          />
          <StatCard
            label="Total check-ins"
            value={Number(overview.total_checkins ?? 0)}
          />
          <StatCard
            label="Stampley sessions"
            value={Number(overview.total_stampley_sessions ?? 0)}
          />
          {caps.canViewClinicalSurveyScores ? (
            <StatCard
              label="Avg stress level"
              value={formatNumber(overview.avg_stress)}
              hint="Self-reported stress (0–10) for filtered check-ins"
            />
          ) : null}
          <StatCard
            label="High-stress check-ins"
            value={Number(overview.high_stress_checkins ?? 0)}
            hint="Check-ins with stress ≥ 9 (within current filters)"
            accent
          />
          <StatCard
            label="Completion rates"
            value={pct(withCheckins, totalParticipants)}
            hint={`Pre-survey ${pct(preSurveyCompleted, totalParticipants)} · DDS baseline ${pct(ddsCompleted, totalParticipants)} · ≥1 matching check-in ${pct(withCheckins, totalParticipants)}`}
            accent
          />
        </div>
      </div>

      <div>
        <h2 className="mb-3 text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
          Domain trends
        </h2>
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          {STUDY_DOMAINS.map((domain) => (
            <div
              key={domain}
              className="border border-slate-200 bg-gradient-to-br from-white to-stone-50 p-5 shadow-sm"
            >
              <p className="text-sm font-medium text-slate-700">{domain}</p>
              <p className="mt-2 text-2xl font-semibold text-slate-950">
                {domainCountMap.get(domain) ?? 0}
              </p>
              <p className="mt-1 text-xs text-slate-500">check-ins</p>
            </div>
          ))}
        </div>
      </div>

      {caps.canViewIdentifiedAnalytics ? (
        <Section
          title="Participants"
          description="Aggregated metrics per participant for the current filters. Read-only."
        >
          <div className="overflow-x-auto">
            <table className="min-w-full border-collapse text-left text-sm">
              <thead>
                <tr className="border-b border-slate-200 bg-white">
                  <th className="px-5 py-3 font-semibold text-slate-600">Email</th>
                  <th className="px-5 py-3 font-semibold text-slate-600">Role</th>
                  <th className="px-5 py-3 font-semibold text-slate-600">Check-ins</th>
                  <th className="px-5 py-3 font-semibold text-slate-600">Latest check-in</th>
                  <th className="px-5 py-3 font-semibold text-slate-600">Avg stress</th>
                  <th className="px-5 py-3 font-semibold text-slate-600">Avg mood</th>
                  <th className="px-5 py-3 font-semibold text-slate-600">Avg energy</th>
                  <th className="px-5 py-3 font-semibold text-slate-600">Top domain</th>
                  <th className="px-5 py-3 font-semibold text-slate-600">Stampley sessions</th>
                  <th className="px-5 py-3 font-semibold text-slate-600">Last session</th>
                </tr>
              </thead>
              <tbody>
                {participants.length === 0 ? (
                  <tr>
                    <td
                      colSpan={10}
                      className="px-5 py-10 text-center text-slate-500"
                    >
                      No participants match the current filters.
                    </td>
                  </tr>
                ) : (
                  participants.map((row) => (
                    <tr
                      key={String(row.email)}
                      className="border-b border-slate-100 hover:bg-slate-50/80"
                    >
                      <td className="px-5 py-4 font-medium text-slate-900">
                        {String(row.email)}
                      </td>
                      <td className="px-5 py-4 text-slate-600">
                        {String(row.role ?? "—")}
                      </td>
                      <td className="px-5 py-4 text-slate-700">
                        {Number(row.total_checkins) || 0}
                      </td>
                      <td className="px-5 py-4 text-slate-600">
                        {formatDate(row.latest_check_in_date)}
                      </td>
                      <td className="px-5 py-4 text-slate-700">
                        {formatNumber(row.avg_stress)}
                      </td>
                      <td className="px-5 py-4 text-slate-700">
                        {formatNumber(row.avg_mood)}
                      </td>
                      <td className="px-5 py-4 text-slate-700">
                        {formatNumber(row.avg_energy)}
                      </td>
                      <td className="px-5 py-4 text-slate-700">
                        {row.most_common_domain
                          ? String(row.most_common_domain)
                          : "—"}
                      </td>
                      <td className="px-5 py-4 text-slate-700">
                        {Number(row.stampley_sessions) || 0}
                      </td>
                      <td className="px-5 py-4 text-slate-600">
                        {formatDate(row.last_session_date)}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </Section>
      ) : null}

      {caps.canViewSafetyData ? (
        <Section
          title="High-stress monitoring"
          description="Check-ins with self-reported stress ≥ 9, further narrowed by your filters."
        >
          <div className="overflow-x-auto">
            <table className="min-w-full border-collapse text-left text-sm">
              <thead>
                <tr className="border-b border-slate-200 bg-white">
                  <th className="px-5 py-3 font-semibold text-slate-600">Participant</th>
                  <th className="px-5 py-3 font-semibold text-slate-600">Date</th>
                  <th className="px-5 py-3 font-semibold text-slate-600">Stress</th>
                  <th className="px-5 py-3 font-semibold text-slate-600">Domain</th>
                  <th className="px-5 py-3 font-semibold text-slate-600">Safety escalation</th>
                </tr>
              </thead>
              <tbody>
                {highStressRows.length === 0 ? (
                  <tr>
                    <td
                      colSpan={5}
                      className="px-5 py-10 text-center text-slate-500"
                    >
                      No high-stress check-ins match the current filters.
                    </td>
                  </tr>
                ) : (
                  highStressRows.map((row, i) => (
                    <tr
                      key={`${row.email}-${row.check_in_date}-${i}`}
                      className="border-b border-slate-100 hover:bg-red-50/30"
                    >
                      <td className="px-5 py-4 font-medium text-slate-900">
                        {String(row.email)}
                      </td>
                      <td className="px-5 py-4 text-slate-600">
                        {formatDate(row.check_in_date)}
                      </td>
                      <td className="px-5 py-4 font-semibold text-red-700">
                        {row.stress_level != null ? String(row.stress_level) : "—"}
                      </td>
                      <td className="px-5 py-4 text-slate-700">
                        {row.domain ? String(row.domain) : "—"}
                      </td>
                      <td className="px-5 py-4">
                        {row.needs_safety_escalation ? (
                          <span className="border border-red-200 bg-red-50 px-2 py-1 text-xs font-semibold text-red-700">
                            Flagged
                          </span>
                        ) : (
                          <span className="border border-slate-200 bg-slate-50 px-2 py-1 text-xs font-semibold text-slate-600">
                            Not flagged
                          </span>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </Section>
      ) : null}

      {caps.canViewIdentifiedAnalytics ? (
        <Section
          title="Stampley engagement"
          description={
            caps.canViewTranscripts
              ? "Saved session summaries and message counts for the current filters. Raw chat JSON is not displayed."
              : "Session counts for the current filters. Summaries are restricted."
          }
        >
          <div className="overflow-x-auto">
            <table className="min-w-full border-collapse text-left text-sm">
              <thead>
                <tr className="border-b border-slate-200 bg-white">
                  <th className="px-5 py-3 font-semibold text-slate-600">Participant</th>
                  <th className="px-5 py-3 font-semibold text-slate-600">User msgs</th>
                  <th className="px-5 py-3 font-semibold text-slate-600">Assistant msgs</th>
                  <th className="px-5 py-3 font-semibold text-slate-600">Linked check-in</th>
                  {caps.canViewTranscripts ? (
                    <th className="px-5 py-3 font-semibold text-slate-600">Session summary</th>
                  ) : null}
                </tr>
              </thead>
              <tbody>
                {engagementRows.length === 0 ? (
                  <tr>
                    <td
                      colSpan={5}
                      className="px-5 py-10 text-center text-slate-500"
                    >
                      No Stampley sessions match the current filters.
                    </td>
                  </tr>
                ) : (
                  engagementRows.map((row, i) => (
                    <tr
                      key={row.id || `${row.email}-${row.created_at}-${i}`}
                      className="border-b border-slate-100 hover:bg-slate-50/80"
                    >
                      <td className="px-5 py-4 font-medium text-slate-900">
                        {String(row.email)}
                      </td>
                      <td className="px-5 py-4 text-slate-700">
                        {Number(row.user_message_count) || 0}
                      </td>
                      <td className="px-5 py-4 text-slate-700">
                        {Number(row.assistant_message_count) || 0}
                      </td>
                      <td className="px-5 py-4 text-slate-600">
                        {formatDate(row.linked_check_in_date)}
                      </td>
                      {caps.canViewTranscripts ? (
                        <td className="max-w-md px-5 py-4 text-slate-600">
                          {row.id ? (
                            <StampleySummaryCell sessionId={row.id} />
                          ) : (
                            <span className="italic text-slate-400">No summary</span>
                          )}
                        </td>
                      ) : null}
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </Section>
      ) : null}
    </>
  )
}
