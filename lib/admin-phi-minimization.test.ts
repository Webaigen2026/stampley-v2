import { describe, it } from "node:test"
import assert from "node:assert/strict"
import { readFileSync } from "node:fs"
import { dirname, join } from "node:path"
import { fileURLToPath } from "node:url"
import { canAccessAdminPath, hasCapability } from "./admin-capabilities"
import {
  analyticsFiltersForView,
  assertNoCoordinatorPhi,
  canViewDashboardParticipantEmail,
  dashboardRecentUserSelect,
  mapDashboardRecentUser,
  mapPostSurveyListRow,
  mapPreSurveyListRow,
  postSurveySelect,
  preSurveySelect,
  shapeAnalyticsEngagementRows,
  shapeAnalyticsOverview,
  shapeAnalyticsParticipantRows,
  shapeAnalyticsSafetyRows,
  surveyViewCapabilities,
} from "./admin-phi-minimization"

const HERE = dirname(fileURLToPath(import.meta.url))
const ROOT = join(HERE, "..")

function read(rel: string) {
  return readFileSync(join(ROOT, rel), "utf8")
}

const coordinator = surveyViewCapabilities("STUDY_COORDINATOR")
const reviewer = surveyViewCapabilities("CLINICAL_REVIEWER")
const admin = surveyViewCapabilities("ADMIN")
const participant = surveyViewCapabilities("PARTICIPANT")

const preSurveyFixture = {
  studyId: "AIDES-TEST1",
  email: "participant@example.com",
  preSurveyResponse: {
    consentStatus: "consented",
    completedAt: new Date("2026-01-02T00:00:00.000Z"),
    age: 44,
    gender: "Female",
    diabetesDuration: "5 years",
    insuranceType: "Private",
    phqTotal: 12,
    phqSeverity: "Moderate",
    needsMentalHealthFollowup: true,
    phq9: 2,
  },
}

const postSurveyFixture = {
  id: "post-1",
  completedAt: new Date("2026-02-01T00:00:00.000Z"),
  futureResearchContact: true,
  ddsAnswers: { q1: 4 },
  ddsScores: { total: 2.4 },
  phqAnswers: { phq9: 1 },
  phqTotal: 9,
  phqSeverity: "Mild",
  susAnswers: { sus1: 5 },
  susScore: 72.5,
  stampleyFeedback: { se1: 4 },
  openReflection: "I felt overwhelmed",
  contactName: "Test Contact",
  contactEmail: "contact@example.com",
  contactPhone: "555-0100",
  user: { email: "participant@example.com", studyId: "AIDES-TEST1" },
}

describe("HIPAA-4.1 coordinator analytics minimization", () => {
  it("omits email and exact participant score averages", () => {
    const overview = shapeAnalyticsOverview(
      {
        total_participants: 4,
        total_checkins: 20,
        total_stampley_sessions: 8,
        avg_stress: 6.4,
        high_stress_checkins: 2,
      },
      coordinator
    )
    const participants = shapeAnalyticsParticipantRows(
      [
        {
          email: "participant@example.com",
          avg_stress: 8.2,
          avg_mood: 3.1,
          avg_energy: 4.0,
        },
      ],
      coordinator
    )
    assert.equal("avg_stress" in overview, false)
    assert.equal(overview.total_checkins, 20)
    assert.deepEqual(participants, [])
    assert.deepEqual(assertNoCoordinatorPhi({ overview, participants }), [])
  })

  it("omits safety-detail rows and transcript summaries", () => {
    const safety = shapeAnalyticsSafetyRows(
      [{ email: "participant@example.com", stress_level: 9, summary: "crisis" }],
      coordinator
    )
    const engagement = shapeAnalyticsEngagementRows(
      [
        {
          email: "participant@example.com",
          summary: "talked about insulin",
          user_message_count: 3,
        },
      ],
      coordinator
    )
    assert.deepEqual(safety, [])
    assert.deepEqual(engagement, [])
  })

  it("ignores email search filters for coordinator", () => {
    const filtered = analyticsFiltersForView(
      {
        q: "participant@example.com",
        from: "2026-01-01",
        to: "2026-01-31",
        domain: null,
        highStress: false,
        week: 2,
      },
      coordinator
    )
    assert.equal(filtered.q, null)
    assert.equal(filtered.week, 2)
  })

  it("keeps ADMIN identified analytics fields", () => {
    const overview = shapeAnalyticsOverview(
      { total_participants: 4, avg_stress: 6.4, high_stress_checkins: 2 },
      admin
    )
    const participants = shapeAnalyticsParticipantRows(
      [{ email: "participant@example.com", avg_stress: 8.2 }],
      admin
    )
    assert.equal(overview.avg_stress, 6.4)
    assert.equal(participants[0]?.email, "participant@example.com")
    assert.equal(participants[0]?.avg_stress, 8.2)
  })

  it("keeps CLINICAL_REVIEWER clinical analytics fields without dropping scores", () => {
    const participants = shapeAnalyticsParticipantRows(
      [{ email: "participant@example.com", avg_mood: 4.5, avg_energy: 7 }],
      reviewer
    )
    const safety = shapeAnalyticsSafetyRows(
      [{ email: "participant@example.com", stress_level: 9 }],
      reviewer
    )
    const engagement = shapeAnalyticsEngagementRows(
      [{ email: "participant@example.com", summary: "session note" }],
      reviewer
    )
    assert.equal(participants[0]?.avg_mood, 4.5)
    assert.equal(safety[0]?.stress_level, 9)
    assert.equal(engagement[0]?.summary, "session note")
  })
})

describe("HIPAA-4.1 coordinator pre-survey minimization", () => {
  it("returns operational fields only", () => {
    const row = mapPreSurveyListRow(preSurveyFixture, coordinator)
    assert.equal(row.study_id, "AIDES-TEST1")
    assert.equal(row.completed, true)
    assert.equal("email" in row, false)
    assert.equal("phq_total" in row, false)
    assert.equal("phq_severity" in row, false)
    assert.equal("needs_mental_health_followup" in row, false)
    assert.equal("phq_answers" in row, false)
    assert.equal(preSurveySelect(coordinator).email, false)
    assert.equal(preSurveySelect(coordinator).preSurveyResponse.select.phqTotal, false)
    assert.deepEqual(assertNoCoordinatorPhi(row), [])
  })

  it("keeps clinical reviewer PHQ summary fields", () => {
    const row = mapPreSurveyListRow(preSurveyFixture, reviewer)
    assert.equal(row.email, "participant@example.com")
    assert.equal(row.phq_total, 12)
    assert.equal(row.phq_severity, "Moderate")
    assert.equal(row.needs_mental_health_followup, true)
  })

  it("keeps ADMIN approved pre-survey fields", () => {
    const row = mapPreSurveyListRow(preSurveyFixture, admin)
    assert.equal(row.email, "participant@example.com")
    assert.equal(row.phq_total, 12)
    assert.equal(preSurveySelect(admin).email, true)
  })
})

describe("HIPAA-4.1 coordinator post-survey minimization", () => {
  it("omits feedback, narratives, and answer payloads", () => {
    const row = mapPostSurveyListRow(postSurveyFixture, coordinator)
    assert.equal(row.study_id, "AIDES-TEST1")
    assert.equal(row.future_research_contact, true)
    assert.equal(row.contact_email, "contact@example.com")
    assert.equal("stampley_feedback" in row, false)
    assert.equal("open_reflection" in row, false)
    assert.equal("dds_answers" in row, false)
    assert.equal("sus_answers" in row, false)
    assert.equal("email" in row, false)
    assert.equal(row.id, "post-1")
    assert.equal(postSurveySelect(coordinator).stampleyFeedback, false)
    assert.equal(postSurveySelect(coordinator).ddsAnswers, false)
    assert.equal(postSurveySelect(coordinator).susAnswers, false)
    assert.equal("openReflection" in postSurveySelect(coordinator), false)
  })

  it("keeps clinical reviewer survey content without operational contact", () => {
    const row = mapPostSurveyListRow(postSurveyFixture, reviewer)
    assert.equal(row.stampley_feedback, postSurveyFixture.stampleyFeedback)
    assert.equal("open_reflection" in row, false)
    assert.equal(row.id, "post-1")
    assert.equal(JSON.stringify(row).includes("I felt overwhelmed"), false)
    assert.deepEqual(row.dds_answers, { q1: 4 })
    assert.deepEqual(row.sus_answers, { sus1: 5 })
    assert.equal(row.phq_answers, postSurveyFixture.phqAnswers)
    assert.equal("contact_email" in row, false)
    assert.equal("contact_name" in row, false)
    assert.equal("contact_phone" in row, false)
  })

  it("keeps ADMIN identified and clinical post-survey fields", () => {
    const row = mapPostSurveyListRow(postSurveyFixture, admin)
    assert.equal(row.email, "participant@example.com")
    assert.equal(row.contact_email, "contact@example.com")
    assert.equal(row.phq_total, 9)
    assert.equal(row.id, "post-1")
    assert.equal("open_reflection" in row, false)
    assert.equal(row.stampley_feedback, postSurveyFixture.stampleyFeedback)
    assert.equal(JSON.stringify(row).includes("I felt overwhelmed"), false)
    assert.equal("openReflection" in postSurveySelect(admin), false)
    assert.equal("openReflection" in postSurveySelect(reviewer), false)
  })
})

describe("HIPAA-4.1 server authorization and audit", () => {
  it("omits sensitive fields from coordinator server-side data shape", () => {
    assert.equal(hasCapability("STUDY_COORDINATOR", "canViewIdentifiedAnalytics"), false)
    assert.equal(hasCapability("STUDY_COORDINATOR", "canViewClinicalSurveyScores"), false)
    assert.equal(hasCapability("STUDY_COORDINATOR", "canViewSurveyFreeText"), false)
    assert.equal(hasCapability("CLINICAL_REVIEWER", "canViewIdentifiedAnalytics"), true)
    assert.equal(hasCapability("ADMIN", "canViewSurveyFreeText"), true)
    assert.equal(participant.canViewIdentifiedAnalytics, false)
  })

  it("keeps existing capability authorization on the three pages", () => {
    assert.equal(canAccessAdminPath("STUDY_COORDINATOR", "/admin/analytics"), true)
    assert.equal(canAccessAdminPath("STUDY_COORDINATOR", "/admin/pre-surveys"), true)
    assert.equal(canAccessAdminPath("STUDY_COORDINATOR", "/admin/post-surveys"), true)
    assert.equal(canAccessAdminPath("PARTICIPANT", "/admin/analytics"), false)
    assert.match(read("app/admin/analytics/page.tsx"), /requireAdminPage\("canViewAggregateAnalytics"\)/)
    assert.match(read("app/admin/pre-surveys/page.tsx"), /requireAdminPage/)
    assert.match(read("app/admin/post-surveys/page.tsx"), /requireAdminPage/)
    assert.match(read("app/admin/analytics/page.tsx"), /await recordPhiPageViewOrThrow/)
    assert.match(read("app/admin/pre-surveys/page.tsx"), /await recordPhiPageViewOrThrow/)
    assert.match(read("app/admin/post-surveys/page.tsx"), /await recordPhiPageViewOrThrow/)
  })
})

describe("HIPAA-4.2 dashboard identifier minimization", () => {
  const createdAt = new Date("2026-03-01T00:00:00.000Z")
  const identifiedRow = {
    id: "550e8400-e29b-41d4-a716-446655440000",
    email: "participant@example.com",
    studyId: "AIDES-TEST1",
    createdAt,
  }
  const unassignedRow = {
    id: "550e8400-e29b-41d4-a716-446655440099",
    email: "orphan@example.com",
    studyId: null,
    createdAt,
  }

  it("omits email and UUID from coordinator dashboard rows", () => {
    const includeEmail = canViewDashboardParticipantEmail("STUDY_COORDINATOR")
    const row = mapDashboardRecentUser(identifiedRow, includeEmail)
    assert.equal(includeEmail, false)
    assert.equal(dashboardRecentUserSelect(includeEmail).email, false)
    assert.equal("email" in row, false)
    assert.equal("id" in row, false)
    assert.equal("user_id" in row, false)
    assert.equal(row.study_id, "AIDES-TEST1")
    assert.equal(row.label, "AIDES-TEST1")
    assert.doesNotMatch(JSON.stringify(row), /550e8400-e29b-41d4-a716-446655440000/)
    assert.deepEqual(assertNoCoordinatorPhi(row), [])
  })

  it("does not fall back to email or UUID when studyId is missing", () => {
    const row = mapDashboardRecentUser(
      unassignedRow,
      canViewDashboardParticipantEmail("STUDY_COORDINATOR")
    )
    assert.equal(row.label, "Unassigned participant")
    assert.equal("email" in row, false)
    assert.equal("study_id" in row, false)
    assert.equal("id" in row, false)
    assert.doesNotMatch(JSON.stringify(row), /orphan@example.com/)
    assert.doesNotMatch(JSON.stringify(row), /550e8400-e29b-41d4-a716-446655440099/)
  })

  it("keeps ADMIN dashboard email behavior", () => {
    const includeEmail = canViewDashboardParticipantEmail("ADMIN")
    const row = mapDashboardRecentUser(identifiedRow, includeEmail)
    assert.equal(includeEmail, true)
    assert.equal(dashboardRecentUserSelect(includeEmail).email, true)
    assert.equal(row.email, "participant@example.com")
    assert.equal(row.label, "participant@example.com")
  })

  it("omits dashboard email for clinical reviewer and unknown roles", () => {
    assert.equal(canViewDashboardParticipantEmail("CLINICAL_REVIEWER"), false)
    assert.equal(canViewDashboardParticipantEmail("PARTICIPANT"), false)
    assert.equal(canViewDashboardParticipantEmail("SUPERUSER"), false)
    assert.equal(canViewDashboardParticipantEmail(undefined), false)
    const reviewerRow = mapDashboardRecentUser(
      identifiedRow,
      canViewDashboardParticipantEmail("CLINICAL_REVIEWER")
    )
    assert.equal("email" in reviewerRow, false)
    assert.equal(reviewerRow.label, "AIDES-TEST1")
  })

  it("keeps dashboard authorization server-side and participants denied", () => {
    assert.equal(canAccessAdminPath("PARTICIPANT", "/admin/dashboard"), false)
    assert.equal(canAccessAdminPath("STUDY_COORDINATOR", "/admin/dashboard"), true)
    assert.equal(canAccessAdminPath("CLINICAL_REVIEWER", "/admin/dashboard"), true)
    assert.equal(canAccessAdminPath("ADMIN", "/admin/dashboard"), true)
    const dashboard = read("app/admin/dashboard/page.tsx")
    assert.match(dashboard, /requireStaffPage/)
    assert.match(dashboard, /canViewDashboardParticipantEmail/)
    assert.match(dashboard, /dashboardRecentUserSelect/)
    assert.match(dashboard, /mapDashboardRecentUser/)
    assert.doesNotMatch(dashboard, /select:\s*\{\s*email:\s*true/)
  })

  it("preserves HIPAA-3 dashboard audit without identifiers", () => {
    const dashboard = read("app/admin/dashboard/page.tsx")
    assert.match(dashboard, /ADMIN_DASHBOARD_VIEWED/)
    assert.match(dashboard, /fail-open/)
    assert.doesNotMatch(
      dashboard,
      /recordAdminPageView\([\s\S]*email|studyId|userId/
    )
  })
})
