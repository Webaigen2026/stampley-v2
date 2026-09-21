import "server-only"

import { prisma } from "@/lib/prisma"
import { Prisma } from "@/lib/generated/prisma/client"
import {
  buildPrismaCheckInFilter,
  buildPrismaCheckInRowFilter,
  buildPrismaHighStressTableFilter,
  buildPrismaParticipantUserFilter,
  buildPrismaSessionFilter,
  buildPrismaSessionRowFilter,
  type AnalyticsFilters,
} from "@/lib/admin-analytics-filters"
import {
  shapeAnalyticsEngagementRows,
  shapeAnalyticsOverview,
  shapeAnalyticsParticipantRows,
  shapeAnalyticsSafetyRows,
  type SurveyViewCapabilities,
} from "@/lib/admin-phi-minimization"
import { mapAnalyticsEngagementListRow } from "@/lib/admin-stampley-summary"
import type { AdminAnalyticsDashboard } from "@/lib/admin-analytics-dashboard"

export type { AdminAnalyticsDashboard } from "@/lib/admin-analytics-dashboard"

function hasCheckInRowFilters(filters: AnalyticsFilters): boolean {
  return Boolean(
    filters.from ||
      filters.to ||
      filters.domain ||
      filters.week ||
      filters.highStress
  )
}

function serializeAnalyticsValue(value: unknown): unknown {
  if (typeof value === "bigint") return Number(value)
  if (value instanceof Prisma.Decimal) return value.toNumber()
  return value
}

function serializeAnalyticsRow(
  row: Record<string, unknown>
): Record<string, unknown> {
  const out: Record<string, unknown> = {}
  for (const [key, value] of Object.entries(row)) {
    out[key] = serializeAnalyticsValue(value)
  }
  return out
}

export async function loadAdminAnalyticsDashboard(
  filters: AnalyticsFilters,
  caps: SurveyViewCapabilities
): Promise<AdminAnalyticsDashboard> {
  const checkInFilter = buildPrismaCheckInFilter(filters)
  const sessionFilter = buildPrismaSessionFilter(filters)
  const highStressFilter = buildPrismaHighStressTableFilter(filters)
  const userFilter = buildPrismaParticipantUserFilter(filters)
  const checkInRowFilter = buildPrismaCheckInRowFilter(filters, "c")
  const checkInRowFilterC2 = buildPrismaCheckInRowFilter(filters, "c2")
  const sessionRowFilter = buildPrismaSessionRowFilter(filters, {
    s: "s",
    c: "c_sess",
  })
  const rowFiltersActive = hasCheckInRowFilters(filters)

  const [
    participantCountResult,
    overviewResult,
    completionResult,
    participantResult,
    domainResult,
    highStressResult,
    engagementResult,
  ] = await Promise.all([
    rowFiltersActive
      ? prisma.$queryRaw<Array<{ total_participants: number }>>`
          SELECT COUNT(DISTINCT c.user_id)::int AS total_participants
          FROM check_in_submissions c
          JOIN users u ON u.id = c.user_id
          WHERE u.role = 'PARTICIPANT'${checkInFilter.and}
        `
      : prisma.user
          .count({
            where: {
              role: "PARTICIPANT",
              ...(caps.canViewIdentifiedAnalytics && filters.q
                ? { email: { contains: filters.q, mode: "insensitive" } }
                : {}),
            },
          })
          .then((total_participants) => [{ total_participants }]),
    prisma.$queryRaw<Array<Record<string, unknown>>>`
      SELECT
        (SELECT COUNT(*)::int
         FROM check_in_submissions c
         JOIN users u ON u.id = c.user_id
         WHERE u.role = 'PARTICIPANT'${checkInFilter.and}) AS total_checkins,
        (SELECT COUNT(*)::int
         FROM stampley_chat_sessions s
         JOIN users u ON u.id = s.user_id
         LEFT JOIN check_in_submissions c ON c.id = s.check_in_submission_id
         WHERE u.role = 'PARTICIPANT'${sessionFilter.and}) AS total_stampley_sessions,
        ${
          caps.canViewClinicalSurveyScores
            ? Prisma.sql`(SELECT ROUND(AVG(c.distress)::numeric, 1)
         FROM check_in_submissions c
         JOIN users u ON u.id = c.user_id
         WHERE u.role = 'PARTICIPANT'${checkInFilter.and}) AS avg_stress`
            : Prisma.sql`NULL AS avg_stress`
        },
        (SELECT COUNT(*)::int
         FROM check_in_submissions c
         JOIN users u ON u.id = c.user_id
         WHERE u.role = 'PARTICIPANT'${checkInFilter.and}
           AND c.distress >= 9) AS high_stress_checkins
    `,
    prisma.$queryRaw<Array<Record<string, unknown>>>`
      SELECT
        COUNT(DISTINCT u.id)::int AS total_participants,
        COUNT(DISTINCT u.id) FILTER (
          WHERE p.completed_at IS NOT NULL
        )::int AS pre_survey_completed,
        COUNT(DISTINCT u.id) FILTER (
          WHERE d.id IS NOT NULL
        )::int AS dds_completed,
        COUNT(DISTINCT u.id) FILTER (
          WHERE EXISTS (
            SELECT 1
            FROM check_in_submissions c
            WHERE c.user_id = u.id${checkInRowFilter.and}
          )
        )::int AS with_checkins
      FROM users u
      LEFT JOIN pre_survey_responses p ON p.user_id = u.id
      LEFT JOIN dds_responses d ON d.user_id = u.id
      WHERE u.role = 'PARTICIPANT'${userFilter.and}
    `,
    caps.canViewIdentifiedAnalytics
      ? prisma.$queryRaw<Array<Record<string, unknown>>>`
      SELECT
        u.email,
        u.role::text AS role,
        COUNT(DISTINCT c.id)::int AS total_checkins,
        MAX(c.check_in_date) AS latest_check_in_date,
        ROUND(AVG(c.distress)::numeric, 1) AS avg_stress,
        ROUND(AVG(c.mood)::numeric, 1) AS avg_mood,
        ROUND(AVG(c.energy)::numeric, 1) AS avg_energy,
        (
          SELECT c2.domain
          FROM check_in_submissions c2
          WHERE c2.user_id = u.id${checkInRowFilterC2.and}
          GROUP BY c2.domain
          ORDER BY COUNT(*) DESC
          LIMIT 1
        ) AS most_common_domain,
        COUNT(DISTINCT s.id) FILTER (
          WHERE s.id IS NOT NULL AND (${sessionRowFilter.on})
        )::int AS stampley_sessions,
        MAX(s.created_at) FILTER (
          WHERE s.id IS NOT NULL AND (${sessionRowFilter.on})
        ) AS last_session_date
      FROM users u
      LEFT JOIN check_in_submissions c
        ON c.user_id = u.id AND (${checkInRowFilter.on})
      LEFT JOIN stampley_chat_sessions s ON s.user_id = u.id
      LEFT JOIN check_in_submissions c_sess
        ON c_sess.id = s.check_in_submission_id
      WHERE u.role = 'PARTICIPANT'${userFilter.and}
      GROUP BY u.id, u.email, u.role
      ORDER BY latest_check_in_date DESC NULLS LAST, u.email ASC
    `
      : Promise.resolve([]),
    prisma.$queryRaw<Array<{ domain: string; count: number }>>`
      SELECT domain, COUNT(*)::int AS count
      FROM check_in_submissions c
      JOIN users u ON u.id = c.user_id
      WHERE u.role = 'PARTICIPANT'
        AND c.domain IN ('Emotional', 'Regimen', 'Physician', 'Interpersonal')${checkInFilter.and}
      GROUP BY domain
    `,
    caps.canViewSafetyData
      ? prisma.$queryRaw<Array<Record<string, unknown>>>`
      SELECT
        u.email,
        c.check_in_date,
        c.distress AS stress_level,
        c.domain,
        c.needs_safety_escalation
      FROM check_in_submissions c
      JOIN users u ON u.id = c.user_id
      WHERE u.role = 'PARTICIPANT'${highStressFilter.and}
      ORDER BY c.check_in_date DESC, c.created_at DESC
      LIMIT 75
    `
      : Promise.resolve([]),
    caps.canViewIdentifiedAnalytics
      ? prisma.$queryRaw<Array<Record<string, unknown>>>`
      SELECT
        s.id,
        u.email,
        s.user_message_count,
        s.assistant_message_count,
        c.check_in_date AS linked_check_in_date,
        s.created_at
      FROM stampley_chat_sessions s
      JOIN users u ON u.id = s.user_id
      LEFT JOIN check_in_submissions c ON c.id = s.check_in_submission_id
      WHERE u.role = 'PARTICIPANT'${sessionFilter.and}
      ORDER BY s.created_at DESC
      LIMIT 100
    `
      : Promise.resolve([]),
  ])

  const overviewRow = serializeAnalyticsRow(overviewResult[0] ?? {})
  const overview = shapeAnalyticsOverview(
    {
      total_participants: serializeAnalyticsValue(
        participantCountResult[0]?.total_participants ?? 0
      ),
      total_checkins: overviewRow.total_checkins,
      total_stampley_sessions: overviewRow.total_stampley_sessions,
      avg_stress: overviewRow.avg_stress,
      high_stress_checkins: overviewRow.high_stress_checkins,
    },
    caps
  )

  const completion = serializeAnalyticsRow(completionResult[0] ?? {})
  const totalParticipants = Number(completion.total_participants) || 0
  const preSurveyCompleted = Number(completion.pre_survey_completed) || 0
  const ddsCompleted = Number(completion.dds_completed) || 0
  const withCheckins = Number(completion.with_checkins) || 0

  return {
    overview,
    totalParticipants,
    preSurveyCompleted,
    ddsCompleted,
    withCheckins,
    rowFiltersActive,
    domainCounts: domainResult.map((row) => ({
      domain: String(row.domain),
      count: Number(row.count) || 0,
    })),
    participants: shapeAnalyticsParticipantRows(
      participantResult.map(serializeAnalyticsRow),
      caps
    ),
    highStressRows: shapeAnalyticsSafetyRows(
      highStressResult.map(serializeAnalyticsRow),
      caps
    ),
    engagementRows: shapeAnalyticsEngagementRows(
      engagementResult.map(serializeAnalyticsRow),
      caps
    ).map(mapAnalyticsEngagementListRow),
  }
}
