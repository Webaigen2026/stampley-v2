import "server-only"

import { prisma } from "@/lib/prisma"
import type { Prisma, UserRole } from "@/lib/generated/prisma/client"
import {
  buildPrismaSessionFilter,
  type AnalyticsFilters,
} from "@/lib/admin-analytics-filters"
import { isUserRole } from "@/lib/admin-capabilities"
import {
  mapPostSurveyListRow,
  postSurveySelect,
  type SurveyViewCapabilities,
} from "@/lib/admin-phi-minimization"
import { mapStampleySessionListRow } from "@/lib/admin-stampley-sessions"
import type { AdminStampleySessionListItem } from "@/lib/admin-stampley-sessions"
import { PHQ_SEVERITY_OPTIONS } from "@/lib/admin-directory-types"
import type {
  AdminKeyDirectoryResult,
  AdminUserDirectoryResult,
} from "@/lib/admin-directory-types"

export {
  PHQ_SEVERITY_OPTIONS,
  type AdminUserDirectoryRow,
  type AdminUserDirectoryResult,
  type AdminKeyDirectoryRow,
  type AdminKeyDirectoryResult,
} from "@/lib/admin-directory-types"

export const USER_SORT_MAP: Record<string, Prisma.UserOrderByWithRelationInput> = {
  created_at_desc: { createdAt: "desc" },
  created_at_asc: { createdAt: "asc" },
  email_asc: { email: "asc" },
  email_desc: { email: "desc" },
}

export const KEY_SORT_MAP: Record<
  string,
  Prisma.StudyKeyOrderByWithRelationInput
> = {
  created_at_desc: { createdAt: "desc" },
  created_at_asc: { createdAt: "asc" },
  key_asc: { key: "asc" },
  key_desc: { key: "desc" },
}

const DDS_ITEM_SELECT = {
  q1: true,
  q2: true,
  q3: true,
  q4: true,
  q5: true,
  q6: true,
  q7: true,
  q8: true,
  q9: true,
  q10: true,
  q11: true,
  q12: true,
  q13: true,
  q14: true,
  q15: true,
  q16: true,
  q17: true,
} as const

export async function loadAdminStampleyChatSessions(
  filters: AnalyticsFilters
): Promise<AdminStampleySessionListItem[]> {
  const sessionFilter = buildPrismaSessionFilter(filters)
  const result = await prisma.$queryRaw<Array<Record<string, unknown>>>`
    SELECT
      s.id,
      s.user_id,
      u.email,
      s.check_in_submission_id,
      s.domain,
      s.stress_level,
      s.mood,
      s.energy,
      s.user_message_count,
      s.assistant_message_count,
      s.summary,
      s.created_at,
      c.check_in_date
    FROM stampley_chat_sessions s
    JOIN users u ON u.id = s.user_id
    LEFT JOIN check_in_submissions c ON c.id = s.check_in_submission_id
    WHERE u.role = 'PARTICIPANT'${sessionFilter.and}
    ORDER BY s.created_at DESC
    LIMIT 200
  `
  return result.map(mapStampleySessionListRow)
}

export async function loadAdminDdsRows(args: {
  q: string | null
  highDistressOnly: boolean
  canViewItems: boolean
}): Promise<Record<string, unknown>[]> {
  const where: Prisma.DdsResponseWhereInput = {}

  if (args.q) {
    where.user = {
      OR: [
        { email: { contains: args.q, mode: "insensitive" } },
        { studyId: { contains: args.q, mode: "insensitive" } },
      ],
    }
  }

  if (args.highDistressOnly) {
    where.OR = [
      { totalScore: { gte: 3 } },
      { emotionalScore: { gte: 3 } },
      { physicianScore: { gte: 3 } },
      { regimenScore: { gte: 3 } },
      { interpersonalScore: { gte: 3 } },
    ]
  }

  const result = await prisma.ddsResponse.findMany({
    where,
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      userId: true,
      createdAt: true,
      totalScore: true,
      emotionalScore: true,
      physicianScore: true,
      regimenScore: true,
      interpersonalScore: true,
      recommendedDomain: true,
      confirmedDomain: true,
      ...(args.canViewItems ? DDS_ITEM_SELECT : {}),
      user: {
        select: { email: true, studyId: true },
      },
    },
  })

  return result.map((row) => ({
    dds_id: row.id,
    user_id: row.userId,
    email: row.user.email,
    study_id: row.user.studyId,
    created_at: row.createdAt,
    total_score: row.totalScore != null ? Number(row.totalScore) : null,
    emotional_score: row.emotionalScore != null ? Number(row.emotionalScore) : null,
    physician_score: row.physicianScore != null ? Number(row.physicianScore) : null,
    regimen_score: row.regimenScore != null ? Number(row.regimenScore) : null,
    interpersonal_score:
      row.interpersonalScore != null ? Number(row.interpersonalScore) : null,
    recommended_domain: row.recommendedDomain,
    confirmed_domain: row.confirmedDomain,
    ...(args.canViewItems
      ? {
          q1: row.q1,
          q2: row.q2,
          q3: row.q3,
          q4: row.q4,
          q5: row.q5,
          q6: row.q6,
          q7: row.q7,
          q8: row.q8,
          q9: row.q9,
          q10: row.q10,
          q11: row.q11,
          q12: row.q12,
          q13: row.q13,
          q14: row.q14,
          q15: row.q15,
          q16: row.q16,
          q17: row.q17,
        }
      : {}),
  }))
}

export async function loadAdminPostSurveyRows(args: {
  q: string | null
  phqSeverity: string
  futureContact: string
  caps: SurveyViewCapabilities
}): Promise<Record<string, unknown>[]> {
  const where: Prisma.PostSurveyResponseWhereInput = {
    completedAt: { not: null },
  }

  if (args.q) {
    where.user = args.caps.canViewIdentifiedAnalytics
      ? { email: { contains: args.q, mode: "insensitive" } }
      : { studyId: { contains: args.q, mode: "insensitive" } }
  }

  if (
    args.caps.canViewClinicalSurveyScores &&
    args.phqSeverity &&
    PHQ_SEVERITY_OPTIONS.includes(
      args.phqSeverity as (typeof PHQ_SEVERITY_OPTIONS)[number]
    )
  ) {
    where.phqSeverity = args.phqSeverity
  }

  if (args.futureContact === "yes") {
    where.futureResearchContact = true
  } else if (args.futureContact === "no") {
    where.futureResearchContact = false
  }

  const result = await prisma.postSurveyResponse.findMany({
    where,
    orderBy: { completedAt: "desc" },
    select: postSurveySelect(args.caps),
  })

  return result.map((row) => mapPostSurveyListRow(row, args.caps))
}

export async function loadAdminUserDirectory(args: {
  q: string | null
  role: string
  sort: string
  page: number
  pageSize: number
}): Promise<AdminUserDirectoryResult> {
  const page = Math.max(args.page, 1)
  const pageSize = Math.max(args.pageSize, 1)
  const where: Prisma.UserWhereInput = {}

  if (args.q) {
    where.OR = [
      { email: { contains: args.q, mode: "insensitive" } },
      { studyId: { contains: args.q, mode: "insensitive" } },
    ]
  }

  if (args.role !== "ALL" && isUserRole(args.role)) {
    where.role = args.role as UserRole
  }

  const orderBy = USER_SORT_MAP[args.sort] ?? USER_SORT_MAP.created_at_desc

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

  return {
    rows: users.map((user) => ({
      id: user.id,
      email: user.email,
      role: user.role,
      study_id: user.studyId,
      created_at: user.createdAt,
      pre_survey_completed_at: user.preSurveyResponse?.completedAt ?? null,
      checkin_count: user._count.checkInSubmissions,
    })),
    totalUsers,
    page,
    pageSize,
    totalPages: Math.max(Math.ceil(totalUsers / pageSize), 1),
  }
}

export async function loadAdminKeyDirectory(args: {
  q: string | null
  status: string
  sort: string
  page: number
  pageSize: number
}): Promise<AdminKeyDirectoryResult> {
  const page = Math.max(args.page, 1)
  const pageSize = Math.max(args.pageSize, 1)
  const where: Prisma.StudyKeyWhereInput = {}

  if (args.status === "USED") {
    where.isUsed = true
  } else if (args.status === "AVAILABLE") {
    where.isUsed = false
  }

  if (args.q) {
    const matchingUsers = await prisma.user.findMany({
      where: { email: { contains: args.q, mode: "insensitive" } },
      select: { studyId: true },
    })
    const matchingStudyIds = matchingUsers
      .map((user) => user.studyId)
      .filter((id): id is string => typeof id === "string" && id.length > 0)

    where.OR = [
      { key: { contains: args.q, mode: "insensitive" } },
      ...(matchingStudyIds.length > 0 ? [{ key: { in: matchingStudyIds } }] : []),
    ]
  }

  const orderBy = KEY_SORT_MAP[args.sort] ?? KEY_SORT_MAP.created_at_desc

  const [keys, filteredTotal] = await Promise.all([
    prisma.studyKey.findMany({
      where,
      orderBy,
      skip: (page - 1) * pageSize,
      take: pageSize,
      select: {
        id: true,
        key: true,
        isUsed: true,
        createdBy: true,
        createdAt: true,
      },
    }),
    prisma.studyKey.count({ where }),
  ])

  const associatedUsers =
    keys.length === 0
      ? []
      : await prisma.user.findMany({
          where: { studyId: { in: keys.map((key) => key.key) } },
          select: { studyId: true, email: true },
        })

  const emailByStudyId = new Map(
    associatedUsers.map((user) => [user.studyId, user.email])
  )

  return {
    rows: keys.map((key) => ({
      id: key.id,
      key: key.key,
      is_used: key.isUsed === true,
      created_at: key.createdAt,
      participant_email: emailByStudyId.get(key.key) ?? null,
    })),
    filteredTotal,
    page,
    pageSize,
    totalPages: Math.max(Math.ceil(filteredTotal / pageSize), 1),
  }
}
