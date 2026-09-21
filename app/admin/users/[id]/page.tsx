import { prisma } from "@/lib/prisma"
import Link from "next/link"
import { notFound } from "next/navigation"
import { StampleySessionCard } from "@/components/admin/stampley-chats/stampley-session-card"
import { mapStampleySessionListRow } from "@/lib/admin-stampley-sessions"
import {
  PostSurveyResponseDetails,
  PostSurveySummaryCards,
} from "@/components/admin/post-surveys/post-survey-response-details"
import { recordPhiPageViewOrThrow } from "@/lib/admin-phi-page"
import { requireAdminPage } from "@/lib/admin-authz"
import { hasCapability } from "@/lib/admin-capabilities"

export const dynamic = "force-dynamic"

const PHQ_QUESTIONS = [
  "Little interest or pleasure in doing things",
  "Feeling down, depressed, or hopeless",
  "Trouble falling or staying asleep, or sleeping too much",
  "Feeling tired or having little energy",
  "Poor appetite or overeating",
  "Feeling bad about yourself — or that you are a failure or have let yourself or your family down",
  "Trouble concentrating on things, such as reading or watching television",
  "Moving or speaking so slowly that other people could notice, or the opposite — being so fidgety or restless that you move around more than usual",
  "Thoughts that you would be better off dead or hurting yourself in some way",
] as const

const PHQ_LABELS: Record<number, string> = {
  0: "Not at all",
  1: "Several days",
  2: "More than half the days",
  3: "Nearly every day",
}

export default async function AdminUserProfilePage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const actor = await requireAdminPage("canViewParticipantDirectory")
  const canViewPhqItems = hasCapability(actor.role, "canViewPhqItem9")
  const canViewSafety = hasCapability(actor.role, "canViewSafetyData")
  const canViewNarratives = hasCapability(actor.role, "canViewCheckInNarratives")
  const canViewTranscripts = hasCapability(actor.role, "canViewTranscripts")
  const canViewContact = hasCapability(actor.role, "canViewContactInformation")
  const canViewClinical = hasCapability(actor.role, "canViewClinicalSurveyData")
  const { id } = await params

  const userRow = await prisma.user.findUnique({
    where: { id },
    select: {
      id: true,
      email: true,
      role: true,
      createdAt: true,
    },
  })

  if (!userRow) notFound()

  const user = {
    id: userRow.id,
    email: userRow.email,
    role: userRow.role,
    created_at: userRow.createdAt,
  }

  const [
    preSurveyRow,
    postSurveyRow,
    progressRow,
    checkInRows,
    stampleySessionRows,
  ] = await Promise.all([
    prisma.preSurveyResponse.findUnique({
      where: { userId: id },
      select: {
        consentStatus: true,
        diagnosisDuration: true,
        age: true,
        gender: true,
        race: true,
        ethnicity: true,
        maritalStatus: true,
        education: true,
        employmentStatus: true,
        householdIncome: true,
        insuranceType: true,
        medicalFormsConfidence: true,
        readingHelpFrequency: true,
        diabetesDuration: true,
        currentTreatments: true,
        attendedDiabetesClasses: true,
        diabetesToolsUsed: true,
        overallHealthRating: true,
        ownsSmartphone: true,
        internetUsage: true,
        appComfort: true,
        telehealthUsed: true,
        mentalHealthAppsUsed: true,
        smartphoneAppComfort: true,
        digitalHealthToolsUsed: true,
        voiceTechComfort: true,
        communicationPreference: true,
        diagnosisVerified: true,
        diagnosisFileUrl: true,
        phq1: canViewPhqItems,
        phq2: canViewPhqItems,
        phq3: canViewPhqItems,
        phq4: canViewPhqItems,
        phq5: canViewPhqItems,
        phq6: canViewPhqItems,
        phq7: canViewPhqItems,
        phq8: canViewPhqItems,
        phq9: canViewPhqItems,
        phqTotal: true,
        phqSeverity: true,
        needsMentalHealthFollowup: canViewClinical,
        completedAt: true,
      },
    }),
    prisma.postSurveyResponse.findFirst({
      where: { userId: id, completedAt: { not: null } },
      select: {
        ddsAnswers: canViewClinical,
        ddsScores: true,
        phqAnswers: canViewPhqItems,
        phqTotal: true,
        phqSeverity: true,
        susAnswers: true,
        susScore: true,
        stampleyFeedback: canViewClinical,
        openReflection: canViewClinical,
        futureResearchContact: true,
        contactName: canViewContact,
        contactEmail: canViewContact,
        contactPhone: canViewContact,
        completedAt: true,
      },
    }),
    prisma.userStudyProgress.findUnique({
      where: { userId: id },
      select: {
        totalCheckins: true,
        currentWeek: true,
        lastCheckinDate: true,
        studyStartDate: true,
        consecutiveHighDistressDays: canViewSafety,
      },
    }),
    prisma.checkInSubmission.findMany({
      where: { userId: id },
      orderBy: { createdAt: "desc" },
      take: 50,
      select: {
        id: true,
        checkInDate: true,
        distress: canViewClinical,
        mood: canViewClinical,
        energy: canViewClinical,
        domain: true,
        subscale: true,
        reflection: canViewNarratives,
        copingAction: canViewNarratives,
        contextTags: canViewNarratives,
        needsSafetyEscalation: canViewSafety,
        consecutiveHighDistressDays: canViewSafety,
        createdAt: true,
      },
    }),
    canViewTranscripts
      ? prisma.stampleyChatSession.findMany({
          where: { userId: id },
          orderBy: { createdAt: "desc" },
          select: {
            id: true,
            userId: true,
            checkInSubmissionId: true,
            domain: true,
            stressLevel: true,
            mood: true,
            energy: true,
            userMessageCount: true,
            assistantMessageCount: true,
            summary: true,
            createdAt: true,
            user: { select: { email: true } },
            checkInSubmission: { select: { checkInDate: true } },
          },
        })
      : Promise.resolve([]),
  ])

  const preSurvey = preSurveyRow
    ? {
        consent_status: preSurveyRow.consentStatus,
        diagnosis_duration: preSurveyRow.diagnosisDuration,
        age: preSurveyRow.age,
        gender: preSurveyRow.gender,
        race: preSurveyRow.race,
        ethnicity: preSurveyRow.ethnicity,
        marital_status: preSurveyRow.maritalStatus,
        education: preSurveyRow.education,
        employment_status: preSurveyRow.employmentStatus,
        household_income: preSurveyRow.householdIncome,
        insurance_type: preSurveyRow.insuranceType,
        medical_forms_confidence: preSurveyRow.medicalFormsConfidence,
        reading_help_frequency: preSurveyRow.readingHelpFrequency,
        diabetes_duration: preSurveyRow.diabetesDuration,
        current_treatments: preSurveyRow.currentTreatments,
        attended_diabetes_classes: preSurveyRow.attendedDiabetesClasses,
        diabetes_tools_used: preSurveyRow.diabetesToolsUsed,
        overall_health_rating: preSurveyRow.overallHealthRating,
        owns_smartphone: preSurveyRow.ownsSmartphone,
        internet_usage: preSurveyRow.internetUsage,
        app_comfort: preSurveyRow.appComfort,
        telehealth_used: preSurveyRow.telehealthUsed,
        mental_health_apps_used: preSurveyRow.mentalHealthAppsUsed,
        smartphone_app_comfort: preSurveyRow.smartphoneAppComfort,
        digital_health_tools_used: preSurveyRow.digitalHealthToolsUsed,
        voice_tech_comfort: preSurveyRow.voiceTechComfort,
        communication_preference: preSurveyRow.communicationPreference,
        diagnosis_verified: preSurveyRow.diagnosisVerified,
        diagnosis_file_url: preSurveyRow.diagnosisFileUrl,
        phq1: canViewPhqItems ? preSurveyRow.phq1 : null,
        phq2: canViewPhqItems ? preSurveyRow.phq2 : null,
        phq3: canViewPhqItems ? preSurveyRow.phq3 : null,
        phq4: canViewPhqItems ? preSurveyRow.phq4 : null,
        phq5: canViewPhqItems ? preSurveyRow.phq5 : null,
        phq6: canViewPhqItems ? preSurveyRow.phq6 : null,
        phq7: canViewPhqItems ? preSurveyRow.phq7 : null,
        phq8: canViewPhqItems ? preSurveyRow.phq8 : null,
        phq9: canViewPhqItems ? preSurveyRow.phq9 : null,
        phq_total: preSurveyRow.phqTotal,
        phq_severity: preSurveyRow.phqSeverity,
        needs_mental_health_followup: canViewClinical
          ? preSurveyRow.needsMentalHealthFollowup
          : null,
        completed_at: preSurveyRow.completedAt,
      }
    : null

  const postSurvey = postSurveyRow
    ? {
        dds_answers: canViewClinical ? postSurveyRow.ddsAnswers : null,
        dds_scores: postSurveyRow.ddsScores,
        phq_answers: canViewPhqItems ? postSurveyRow.phqAnswers : null,
        phq_total: postSurveyRow.phqTotal,
        phq_severity: postSurveyRow.phqSeverity,
        sus_answers: postSurveyRow.susAnswers,
        sus_score:
          postSurveyRow.susScore != null ? Number(postSurveyRow.susScore) : null,
        stampley_feedback: canViewClinical ? postSurveyRow.stampleyFeedback : null,
        open_reflection: canViewClinical ? postSurveyRow.openReflection : null,
        future_research_contact: postSurveyRow.futureResearchContact,
        contact_name: canViewContact ? postSurveyRow.contactName : null,
        contact_email: canViewContact ? postSurveyRow.contactEmail : null,
        contact_phone: canViewContact ? postSurveyRow.contactPhone : null,
        completed_at: postSurveyRow.completedAt,
      }
    : null

  const progress = progressRow
    ? {
        total_checkins: progressRow.totalCheckins,
        current_week: progressRow.currentWeek,
        last_checkin_date: progressRow.lastCheckinDate,
        study_start_date: progressRow.studyStartDate,
        consecutive_high_distress_days: canViewSafety
          ? progressRow.consecutiveHighDistressDays
          : null,
      }
    : null

  const checkIns = checkInRows.map((item) => ({
    id: item.id,
    check_in_date: item.checkInDate,
    distress: item.distress,
    mood: item.mood,
    energy: item.energy,
    domain: item.domain,
    subscale: item.subscale,
    reflection: canViewNarratives ? item.reflection : null,
    coping_action: canViewNarratives ? item.copingAction : null,
    context_tags: canViewNarratives ? item.contextTags : null,
    needs_safety_escalation: canViewSafety ? item.needsSafetyEscalation : null,
    consecutive_high_distress_days: canViewSafety
      ? item.consecutiveHighDistressDays
      : null,
    created_at: item.createdAt,
  }))

  const stampleySessions = stampleySessionRows.map((session) =>
    mapStampleySessionListRow({
      id: session.id,
      user_id: session.userId,
      email: session.user.email,
      check_in_submission_id: session.checkInSubmissionId,
      domain: session.domain,
      stress_level: session.stressLevel,
      mood: session.mood,
      energy: session.energy,
      user_message_count: session.userMessageCount,
      assistant_message_count: session.assistantMessageCount,
      summary: session.summary,
      created_at: session.createdAt,
      check_in_date: session.checkInSubmission?.checkInDate ?? null,
    })
  )

  await recordPhiPageViewOrThrow({
    action: "ADMIN_PARTICIPANT_PROFILE_VIEWED",
    resourceType: "USER",
    resourceId: user.id,
    subjectUserId: user.id,
    metadata: {
      includesPhqItems: canViewPhqItems,
      includesTranscripts: false,
    },
  })

  return (
    <main className="space-y-8">
      <div>
        <Link
          href="/admin/users"
          className="text-sm font-medium text-blue-900 hover:underline"
        >
          ← Back to Users
        </Link>

        <div className="mt-5 border border-slate-200 bg-white p-6">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
            Participant Profile
          </p>

          <div className="mt-3 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div>
              <h1 className="text-3xl font-semibold tracking-tight text-slate-950">
                {user.email}
              </h1>

              <p className="mt-2 text-sm text-slate-500">
                Joined {new Date(user.created_at as Date).toLocaleString()}
              </p>
            </div>

            <span className="inline-flex w-fit border border-blue-200 bg-blue-50 px-3 py-1 text-xs font-semibold uppercase tracking-[0.12em] text-blue-900">
              {user.role}
            </span>
          </div>
        </div>
      </div>

      <section className="grid gap-6 lg:grid-cols-5">
        <StatCard
          label="Pre-Survey"
          value={preSurvey?.completed_at ? "Completed" : "Pending"}
        />
        <StatCard
          label="Post-Survey"
          value={postSurvey?.completed_at ? "Completed" : "Pending"}
        />
        <StatCard
          label="Total Check-ins"
          value={progress?.total_checkins ?? checkIns.length ?? 0}
        />
        <StatCard
          label="Current Week"
          value={progress?.current_week ?? "—"}
        />
        {canViewSafety ? (
        <StatCard
          label="Safety Streak"
          value={progress?.consecutive_high_distress_days ?? 0}
        />
        ) : (
        <StatCard label="Study Start" value={formatDate(progress?.study_start_date)} />
        )}
      </section>

      {!preSurvey ? (
        <section className="border border-amber-200 bg-amber-50 p-6">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-amber-800">
            Pre-Survey Pending
          </p>
          <p className="mt-2 text-sm leading-6 text-amber-900">
            No pre-survey submitted yet for this participant.
          </p>
        </section>
      ) : (
        <section className="space-y-6">
          <SectionCard title="Consent">
            <div className="grid gap-4 md:grid-cols-2">
              <InfoRow
                label="Completed At"
                value={formatDate(preSurvey.completed_at)}
              />
              <InfoRow label="Consent Status" value={preSurvey.consent_status} />
            </div>
          </SectionCard>

          <SectionCard title="Demographics">
            <div className="grid gap-4 md:grid-cols-2">
              <InfoRow
                label="Diagnosis Duration"
                value={preSurvey.diagnosis_duration}
              />
              <InfoRow label="Age" value={preSurvey.age} />
              <InfoRow label="Gender" value={preSurvey.gender} />
              <InfoRow label="Race" value={formatArray(preSurvey.race)} />
              <InfoRow label="Ethnicity" value={preSurvey.ethnicity} />
              <InfoRow
                label="Marital Status"
                value={preSurvey.marital_status}
              />
              <InfoRow label="Education" value={preSurvey.education} />
              <InfoRow
                label="Employment Status"
                value={preSurvey.employment_status}
              />
              <InfoRow
                label="Household Income"
                value={preSurvey.household_income}
              />
              <InfoRow label="Insurance Type" value={preSurvey.insurance_type} />
              <InfoRow
                label="Diagnosis Verified"
                value={formatBoolean(preSurvey.diagnosis_verified)}
              />
              <InfoRow
                label="Diagnosis File URL"
                value={preSurvey.diagnosis_file_url}
              />
            </div>
          </SectionCard>

          <SectionCard title="Health Literacy">
            <div className="grid gap-4 md:grid-cols-2">
              <InfoRow
                label="Medical Forms Confidence"
                value={preSurvey.medical_forms_confidence}
              />
              <InfoRow
                label="Reading Help Frequency"
                value={preSurvey.reading_help_frequency}
              />
            </div>
          </SectionCard>

          <SectionCard title="Diabetes History">
            <div className="grid gap-4 md:grid-cols-2">
              <InfoRow
                label="Diabetes Duration"
                value={preSurvey.diabetes_duration}
              />
              <InfoRow
                label="Current Treatments"
                value={formatArray(preSurvey.current_treatments)}
              />
              <InfoRow
                label="Attended Diabetes Classes"
                value={formatBoolean(preSurvey.attended_diabetes_classes)}
              />
              <InfoRow
                label="Diabetes Tools Used"
                value={formatArray(preSurvey.diabetes_tools_used)}
              />
              <InfoRow
                label="Overall Health Rating"
                value={preSurvey.overall_health_rating}
              />
            </div>
          </SectionCard>

          <SectionCard title="Technology Access & Comfort">
            <div className="grid gap-4 md:grid-cols-2">
              <InfoRow
                label="Owns Smartphone"
                value={formatBoolean(preSurvey.owns_smartphone)}
              />
              <InfoRow
                label="Internet Usage"
                value={preSurvey.internet_usage}
              />
              <InfoRow label="App Comfort" value={preSurvey.app_comfort} />
              <InfoRow
                label="Telehealth Used"
                value={formatBoolean(preSurvey.telehealth_used)}
              />
              <InfoRow
                label="Mental Health Apps Used"
                value={formatBoolean(preSurvey.mental_health_apps_used)}
              />
              <InfoRow
                label="Smartphone App Comfort (0–10)"
                value={preSurvey.smartphone_app_comfort}
              />
              <InfoRow
                label="Digital Health Tools Used"
                value={formatBoolean(preSurvey.digital_health_tools_used)}
              />
              <InfoRow
                label="Voice Tech Comfort (0–10)"
                value={preSurvey.voice_tech_comfort}
              />
              <InfoRow
                label="Communication Preference"
                value={preSurvey.communication_preference}
              />
            </div>
          </SectionCard>

          {canViewPhqItems ? (
          <SectionCard title="PHQ-9 Detailed Responses">
            <div className="overflow-x-auto">
              <table className="min-w-full border-collapse text-left text-sm">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50">
                    <th className="px-4 py-3 font-semibold text-slate-600">
                      #
                    </th>
                    <th className="px-4 py-3 font-semibold text-slate-600">
                      Question
                    </th>
                    <th className="px-4 py-3 font-semibold text-slate-600">
                      Score
                    </th>
                    <th className="px-4 py-3 font-semibold text-slate-600">
                      Response
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {PHQ_QUESTIONS.map((question, index) => {
                    const key = `phq${index + 1}`
                    const score = (
                      preSurvey as Record<string, unknown>
                    )[key]
                    const numericScore =
                      score === null || score === undefined
                        ? null
                        : Number(score)

                    return (
                      <tr
                        key={key}
                        className="border-b border-slate-100 last:border-b-0"
                      >
                        <td className="px-4 py-3 text-slate-500">{index + 1}</td>
                        <td className="px-4 py-3 text-slate-800">{question}</td>
                        <td className="px-4 py-3 font-medium text-slate-900">
                          {numericScore === null || Number.isNaN(numericScore)
                            ? "Not provided"
                            : numericScore}
                        </td>
                        <td className="px-4 py-3 text-slate-700">
                          {formatPhqLabel(numericScore)}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </SectionCard>
          ) : null}

          <SectionCard title="PHQ-9 Summary">
            <div className="grid gap-6 md:grid-cols-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
                  PHQ Total
                </p>
                <p className="mt-2 text-4xl font-semibold text-slate-950">
                  {formatValue(preSurvey.phq_total)}
                </p>
              </div>

              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
                  Severity
                </p>
                <p className="mt-2 text-sm font-medium text-slate-700">
                  {formatValue(preSurvey.phq_severity)}
                </p>
              </div>

              {canViewClinical ? (
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
                  Mental Health Follow-up
                </p>

                {preSurvey.needs_mental_health_followup ? (
                  <span className="mt-2 inline-flex border border-red-200 bg-red-50 px-3 py-1 text-xs font-semibold text-red-700">
                    Follow-up Recommended
                  </span>
                ) : (
                  <span className="mt-2 inline-flex border border-green-200 bg-green-50 px-3 py-1 text-xs font-semibold text-green-700">
                    No Follow-up Flag
                  </span>
                )}
              </div>
              ) : null}
            </div>
          </SectionCard>
        </section>
      )}

      {!postSurvey ? (
        <section className="border border-slate-200 bg-slate-50 p-6">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
            Post-Survey Summary
          </p>
          <p className="mt-2 text-sm leading-6 text-slate-600">
            No post-survey submitted yet for this participant.
          </p>
        </section>
      ) : (
        <section className="space-y-4 border border-slate-200 bg-white">
          <div className="border-b border-slate-200 bg-slate-50 px-5 py-4">
            <h2 className="text-sm font-semibold text-slate-900">
              Post-Survey Summary
            </h2>
            <p className="mt-1 text-xs text-slate-500">
              Submitted {formatDate(postSurvey.completed_at)}
            </p>
          </div>
          <div className="p-5">
            <PostSurveySummaryCards record={postSurvey} />
            <div className="mt-6">
              <PostSurveyResponseDetails
                record={postSurvey}
                summaryLabel="View detailed responses"
                showPhqItems={canViewPhqItems}
                showFreeText={canViewClinical}
                showContact={canViewContact}
              />
            </div>
          </div>
        </section>
      )}

      <section className="overflow-hidden border border-slate-200 bg-white">
        <div className="border-b border-slate-200 bg-slate-50 px-5 py-4">
          <h2 className="text-sm font-semibold text-slate-900">
            Check-in History
          </h2>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full border-collapse text-left text-sm">
            <thead>
              <tr className="border-b border-slate-200">
                <th className="px-5 py-3 font-semibold text-slate-600">Date</th>
                <th className="px-5 py-3 font-semibold text-slate-600">
                  Distress
                </th>
                <th className="px-5 py-3 font-semibold text-slate-600">Mood</th>
                <th className="px-5 py-3 font-semibold text-slate-600">
                  Energy
                </th>
                <th className="px-5 py-3 font-semibold text-slate-600">
                  Domain
                </th>
                <th className="px-5 py-3 font-semibold text-slate-600">
                  Safety
                </th>
              </tr>
            </thead>

            <tbody>
              {checkIns.length === 0 ? (
                <tr>
                  <td
                    colSpan={6}
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
                    <td className="px-5 py-4 text-slate-700">
                      {formatDate(item.check_in_date)}
                    </td>
                    <td className="px-5 py-4 font-medium text-slate-900">
                      {canViewClinical ? item.distress : "—"}
                    </td>
                    <td className="px-5 py-4 text-slate-700">
                      {canViewClinical ? item.mood : "—"}
                    </td>
                    <td className="px-5 py-4 text-slate-700">
                      {canViewClinical ? item.energy : "—"}
                    </td>
                    <td className="px-5 py-4 text-slate-700">
                      {item.domain ?? "—"}
                    </td>
                    <td className="px-5 py-4">
                      {!canViewSafety ? (
                        <span className="text-slate-400">—</span>
                      ) : item.needs_safety_escalation ? (
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

      {canViewNarratives ? (
      <section className="grid gap-4">
        {checkIns.map((item) => (
          <div
            key={`${item.id}-reflection`}
            className="border border-slate-200 bg-white p-5"
          >
            <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
              <div>
                <p className="text-sm font-semibold text-slate-900">
                  {formatDate(item.check_in_date)}
                </p>
                <p className="text-xs text-slate-500">
                  {item.domain ?? "No domain"} ·{" "}
                  {item.subscale ?? "No subscale"}
                </p>
              </div>

              {item.needs_safety_escalation && (
                <span className="w-fit border border-red-200 bg-red-50 px-2 py-1 text-xs font-semibold text-red-700">
                  Safety Flag
                </span>
              )}
            </div>

            <div className="mt-4 grid gap-4 md:grid-cols-2">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
                  Reflection
                </p>
                <p className="mt-2 text-sm leading-6 text-slate-700">
                  {item.reflection || "No reflection provided."}
                </p>
              </div>

              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
                  Coping Action
                </p>
                <p className="mt-2 text-sm leading-6 text-slate-700">
                  {item.coping_action || "No coping action provided."}
                </p>
              </div>
            </div>
          </div>
        ))}
      </section>
      ) : null}

      {canViewTranscripts ? (
      <section className="space-y-4">
        <div className="border border-slate-200 bg-slate-50 px-5 py-4">
          <h2 className="text-sm font-semibold text-slate-900">
            Stampley Chat History
          </h2>
          <p className="mt-1 text-xs leading-5 text-slate-500">
            Saved Stampley sessions from this participant&apos;s check-ins.
          </p>
        </div>

        {stampleySessions.length === 0 ? (
          <div className="border border-slate-200 bg-white px-5 py-10 text-center shadow-sm">
            <p className="text-sm text-slate-500">
              No Stampley chat sessions saved for this participant yet.
            </p>
          </div>
        ) : (
          stampleySessions.map((session) => (
            <StampleySessionCard key={session.id} session={session} />
          ))
        )}
      </section>
      ) : null}
    </main>
  )
}

function SectionCard({
  title,
  children,
}: {
  title: string
  children: React.ReactNode
}) {
  return (
    <div className="border border-slate-200 bg-white">
      <div className="border-b border-slate-200 bg-slate-50 px-5 py-4">
        <h2 className="text-sm font-semibold text-slate-900">{title}</h2>
      </div>
      <div className="p-5">{children}</div>
    </div>
  )
}

function StatCard({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="border border-slate-200 bg-white p-5">
      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
        {label}
      </p>
      <p className="mt-3 text-2xl font-semibold text-slate-950">{value}</p>
    </div>
  )
}

function InfoRow({ label, value }: { label: string; value: unknown }) {
  return (
    <div className="border border-slate-100 bg-slate-50 px-4 py-3">
      <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
        {label}
      </p>
      <p className="mt-1 break-words text-sm text-slate-800">
        {formatValue(value)}
      </p>
    </div>
  )
}

function formatValue(value: unknown) {
  if (value === null || value === undefined || value === "") {
    return "Not provided"
  }
  return String(value)
}

function formatBoolean(value: unknown) {
  if (value === null || value === undefined) return "Not provided"
  return value ? "Yes" : "No"
}

function formatDate(value: unknown) {
  if (value === null || value === undefined || value === "") {
    return "Not provided"
  }
  return new Date(value as string | Date).toLocaleString()
}

function formatArray(value: unknown) {
  if (value === null || value === undefined) return "Not provided"
  if (Array.isArray(value)) {
    return value.length ? value.join(", ") : "Not provided"
  }
  return String(value)
}

function formatPhqLabel(score: number | null) {
  if (score === null || Number.isNaN(score)) return "Not provided"
  return PHQ_LABELS[score] ?? "Not provided"
}
