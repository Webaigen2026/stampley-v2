import { hasCapability, type AdminCapability } from "@/lib/admin-capabilities"

export type SurveyViewCapabilities = {
  canViewIdentifiedAnalytics: boolean
  canViewClinicalSurveyScores: boolean
  canViewSurveyFreeText: boolean
  canViewPhqItem9: boolean
  canViewContactInformation: boolean
  canViewSafetyData: boolean
  canViewTranscripts: boolean
}

const VIEW_CAPABILITIES = [
  "canViewIdentifiedAnalytics",
  "canViewClinicalSurveyScores",
  "canViewSurveyFreeText",
  "canViewPhqItem9",
  "canViewContactInformation",
  "canViewSafetyData",
  "canViewTranscripts",
] as const satisfies readonly AdminCapability[]

export function surveyViewCapabilities(role: unknown): SurveyViewCapabilities {
  return {
    canViewIdentifiedAnalytics: hasCapability(role, "canViewIdentifiedAnalytics"),
    canViewClinicalSurveyScores: hasCapability(role, "canViewClinicalSurveyScores"),
    canViewSurveyFreeText: hasCapability(role, "canViewSurveyFreeText"),
    canViewPhqItem9: hasCapability(role, "canViewPhqItem9"),
    canViewContactInformation: hasCapability(role, "canViewContactInformation"),
    canViewSafetyData: hasCapability(role, "canViewSafetyData"),
    canViewTranscripts: hasCapability(role, "canViewTranscripts"),
  }
}

export function operationalStudyId(value: unknown): string {
  if (typeof value !== "string") return "UNASSIGNED"
  const trimmed = value.trim()
  return trimmed.length > 0 ? trimmed : "UNASSIGNED"
}

const UNASSIGNED_DASHBOARD_PARTICIPANT = "Unassigned participant"

export function canViewDashboardParticipantEmail(role: unknown): boolean {
  return (
    hasCapability(role, "canViewIdentifiedAnalytics") &&
    hasCapability(role, "canManageParticipants")
  )
}

export function dashboardRecentUserSelect(includeEmail: boolean) {
  return {
    studyId: true,
    createdAt: true,
    email: includeEmail,
  } as const
}

export type DashboardRecentUserRow = {
  label: string
  created_at: Date | string
  study_id?: string
  email?: string | null
}

export function mapDashboardRecentUser(
  row: {
    studyId?: string | null
    createdAt?: Date | string | null
    email?: string | null
    id?: string | null
  },
  includeEmail: boolean
): DashboardRecentUserRow {
  const studyId =
    typeof row.studyId === "string" && row.studyId.trim().length > 0
      ? row.studyId.trim()
      : null
  const mapped: DashboardRecentUserRow = {
    label: includeEmail
      ? row.email?.trim() || studyId || UNASSIGNED_DASHBOARD_PARTICIPANT
      : studyId || UNASSIGNED_DASHBOARD_PARTICIPANT,
    created_at: row.createdAt ?? "",
  }
  if (studyId) {
    mapped.study_id = studyId
  }
  if (includeEmail) {
    mapped.email = row.email ?? null
  }
  return mapped
}

export function analyticsFiltersForView<T extends { q: string | null }>(
  filters: T,
  caps: Pick<SurveyViewCapabilities, "canViewIdentifiedAnalytics">
): T {
  if (caps.canViewIdentifiedAnalytics) return filters
  return { ...filters, q: null }
}

export function shapeAnalyticsOverview(
  raw: {
    total_participants?: unknown
    total_checkins?: unknown
    total_stampley_sessions?: unknown
    avg_stress?: unknown
    high_stress_checkins?: unknown
  },
  caps: Pick<SurveyViewCapabilities, "canViewClinicalSurveyScores">
) {
  const overview: Record<string, unknown> = {
    total_participants: Number(raw.total_participants ?? 0),
    total_checkins: Number(raw.total_checkins ?? 0),
    total_stampley_sessions: Number(raw.total_stampley_sessions ?? 0),
    high_stress_checkins: Number(raw.high_stress_checkins ?? 0),
  }
  if (caps.canViewClinicalSurveyScores) {
    overview.avg_stress = raw.avg_stress ?? null
  }
  return overview
}

export function shapeAnalyticsParticipantRows(
  rows: Array<Record<string, unknown>>,
  caps: Pick<SurveyViewCapabilities, "canViewIdentifiedAnalytics">
): Array<Record<string, unknown>> {
  if (!caps.canViewIdentifiedAnalytics) return []
  return rows
}

export function shapeAnalyticsSafetyRows(
  rows: Array<Record<string, unknown>>,
  caps: Pick<SurveyViewCapabilities, "canViewSafetyData">
): Array<Record<string, unknown>> {
  if (!caps.canViewSafetyData) return []
  return rows
}

export function shapeAnalyticsEngagementRows(
  rows: Array<Record<string, unknown>>,
  caps: Pick<SurveyViewCapabilities, "canViewIdentifiedAnalytics" | "canViewTranscripts">
): Array<Record<string, unknown>> {
  if (!caps.canViewIdentifiedAnalytics) return []
  if (caps.canViewTranscripts) return rows
  return rows.map((row) => {
    const rest = { ...row }
    delete rest.summary
    return rest
  })
}

export function preSurveySelect(caps: SurveyViewCapabilities) {
  return {
    studyId: true,
    email: caps.canViewIdentifiedAnalytics,
    preSurveyResponse: {
      select: {
        consentStatus: true,
        completedAt: true,
        age: caps.canViewClinicalSurveyScores,
        gender: caps.canViewClinicalSurveyScores,
        diabetesDuration: caps.canViewClinicalSurveyScores,
        insuranceType: caps.canViewClinicalSurveyScores,
        phqTotal: caps.canViewClinicalSurveyScores,
        phqSeverity: caps.canViewClinicalSurveyScores,
        needsMentalHealthFollowup: caps.canViewClinicalSurveyScores,
      },
    },
  } as const
}

export type PreSurveyListRow = {
  study_id: string
  consent_status: string | null
  completed: boolean
  completed_at: Date | string | null
  email?: string | null
  age?: number | null
  gender?: string | null
  diabetes_duration?: string | null
  insurance_type?: string | null
  phq_total?: number | null
  phq_severity?: string | null
  needs_mental_health_followup?: boolean | null
}

export function mapPreSurveyListRow(
  user: {
    studyId?: string | null
    email?: string | null
    preSurveyResponse?: {
      consentStatus?: string | null
      completedAt?: Date | string | null
      age?: number | null
      gender?: string | null
      diabetesDuration?: string | null
      insuranceType?: string | null
      phqTotal?: number | null
      phqSeverity?: string | null
      needsMentalHealthFollowup?: boolean | null
    } | null
  },
  caps: SurveyViewCapabilities
): PreSurveyListRow {
  const completedAt = user.preSurveyResponse?.completedAt ?? null
  const row: PreSurveyListRow = {
    study_id: operationalStudyId(user.studyId),
    consent_status: user.preSurveyResponse?.consentStatus ?? null,
    completed: Boolean(completedAt),
    completed_at: completedAt,
  }

  if (caps.canViewIdentifiedAnalytics) {
    row.email = user.email ?? null
  }
  if (caps.canViewClinicalSurveyScores) {
    row.age = user.preSurveyResponse?.age ?? null
    row.gender = user.preSurveyResponse?.gender ?? null
    row.diabetes_duration = user.preSurveyResponse?.diabetesDuration ?? null
    row.insurance_type = user.preSurveyResponse?.insuranceType ?? null
    row.phq_total = user.preSurveyResponse?.phqTotal ?? null
    row.phq_severity = user.preSurveyResponse?.phqSeverity ?? null
    row.needs_mental_health_followup =
      user.preSurveyResponse?.needsMentalHealthFollowup ?? null
  }

  return row
}

export function postSurveySelect(caps: SurveyViewCapabilities) {
  return {
    id: true,
    completedAt: true,
    futureResearchContact: true,
    ddsAnswers: caps.canViewClinicalSurveyScores,
    ddsScores: caps.canViewClinicalSurveyScores,
    phqAnswers: caps.canViewPhqItem9,
    phqTotal: caps.canViewClinicalSurveyScores,
    phqSeverity: caps.canViewClinicalSurveyScores,
    susAnswers: caps.canViewClinicalSurveyScores,
    susScore: caps.canViewClinicalSurveyScores,
    stampleyFeedback: caps.canViewSurveyFreeText,
    contactName: caps.canViewContactInformation,
    contactEmail: caps.canViewContactInformation,
    contactPhone: caps.canViewContactInformation,
    user: {
      select: {
        email: caps.canViewIdentifiedAnalytics,
        studyId: true,
      },
    },
  } as const
}

export function mapPostSurveyListRow(
  row: {
    id: string
    completedAt?: Date | string | null
    futureResearchContact?: boolean | null
    ddsAnswers?: unknown
    ddsScores?: unknown
    phqAnswers?: unknown
    phqTotal?: number | null
    phqSeverity?: string | null
    susAnswers?: unknown
    susScore?: unknown
    stampleyFeedback?: unknown
    contactName?: string | null
    contactEmail?: string | null
    contactPhone?: string | null
    user?: { email?: string | null; studyId?: string | null } | null
  },
  caps: SurveyViewCapabilities
) {
  const mapped: Record<string, unknown> = {
    id: row.id,
    study_id: operationalStudyId(row.user?.studyId),
    completed_at: row.completedAt ?? null,
    future_research_contact: row.futureResearchContact ?? null,
  }

  if (caps.canViewIdentifiedAnalytics) {
    mapped.email = row.user?.email ?? null
  }
  if (caps.canViewClinicalSurveyScores) {
    mapped.dds_answers = row.ddsAnswers ?? null
    mapped.dds_scores = row.ddsScores ?? null
    mapped.phq_total = row.phqTotal ?? null
    mapped.phq_severity = row.phqSeverity ?? null
    mapped.sus_answers = row.susAnswers ?? null
    mapped.sus_score = row.susScore != null ? Number(row.susScore) : null
  }
  if (caps.canViewPhqItem9) {
    mapped.phq_answers = row.phqAnswers ?? null
  }
  if (caps.canViewSurveyFreeText) {
    mapped.stampley_feedback = row.stampleyFeedback ?? null
  }
  if (caps.canViewContactInformation) {
    mapped.contact_name = row.contactName ?? null
    mapped.contact_email = row.contactEmail ?? null
    mapped.contact_phone = row.contactPhone ?? null
  }

  return mapped
}

export function assertNoCoordinatorPhi(payload: unknown) {
  const serialized = JSON.stringify(payload)
  const forbidden = [
    "email",
    "phq_total",
    "phq_severity",
    "needs_mental_health_followup",
    "phq_answers",
    "stampley_feedback",
    "open_reflection",
    "dds_answers",
    "sus_answers",
    "avg_stress",
    "avg_mood",
    "avg_energy",
    "summary",
    "user_id",
  ]
  return forbidden.filter((key) => {
    const quoted = `"${key}"`
    return serialized.includes(quoted)
  })
}

export { VIEW_CAPABILITIES }
