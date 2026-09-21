"use server"

import { unstable_noStore as noStore } from "next/cache"
import {
  requireAdminCapability,
  requireAnyAdminCapability,
} from "@/lib/admin-authz"
import { hasCapability } from "@/lib/admin-capabilities"
import { loadAdminAnalyticsDashboard } from "@/lib/admin-analytics-data"
import type { AdminAnalyticsDashboard } from "@/lib/admin-analytics-data"
import {
  parseAnalyticsFilters,
  type AnalyticsFilters,
} from "@/lib/admin-analytics-filters"
import {
  loadAdminDdsRows,
  loadAdminKeyDirectory,
  loadAdminPostSurveyRows,
  loadAdminStampleyChatSessions,
  loadAdminUserDirectory,
  type AdminKeyDirectoryResult,
  type AdminUserDirectoryResult,
} from "@/lib/admin-directory-search"
import { normalizeIdentifiedSearchQuery } from "@/lib/admin-identified-search"
import { GENERIC_ADMIN_SEARCH_ERROR } from "@/lib/admin-identified-search-error"
import { analyticsFiltersForView, surveyViewCapabilities } from "@/lib/admin-phi-minimization"
import { recordPhiPageViewOrThrow } from "@/lib/admin-phi-page"
import { recordAdminPageView } from "@/lib/audit-admin"
import { filterKeysFromAnalytics, filterKeysFromFlags } from "@/lib/audit-metadata"
import type { AdminStampleySessionListItem } from "@/lib/admin-stampley-sessions"

export type AdminSearchResult<T> =
  | { ok: true; data: T }
  | { ok: false; error: string }

function fail(): { ok: false; error: string } {
  return { ok: false, error: GENERIC_ADMIN_SEARCH_ERROR }
}

function urlSafeFiltersFromInput(input: {
  from?: string | null
  to?: string | null
  domain?: string | null
  week?: number | null
  highStress?: boolean
}): AnalyticsFilters {
  return parseAnalyticsFilters({
    from: input.from ?? undefined,
    to: input.to ?? undefined,
    domain: input.domain ?? undefined,
    week: input.week != null ? String(input.week) : undefined,
    highStress: input.highStress ? "true" : undefined,
  })
}

export async function searchAdminAnalytics(input: {
  q: string | null
  from?: string | null
  to?: string | null
  domain?: string | null
  week?: number | null
  highStress?: boolean
}): Promise<AdminSearchResult<AdminAnalyticsDashboard>> {
  noStore()
  const gate = await requireAdminCapability("canViewAggregateAnalytics")
  if (!gate.ok) return fail()

  try {
    const caps = surveyViewCapabilities(gate.actor.role)
    const filters = analyticsFiltersForView(
      {
        ...urlSafeFiltersFromInput(input),
        q: caps.canViewIdentifiedAnalytics
          ? normalizeIdentifiedSearchQuery(input.q)
          : null,
      },
      caps
    )
    const data = await loadAdminAnalyticsDashboard(filters, caps)
    await recordPhiPageViewOrThrow({
      action: "ADMIN_ANALYTICS_VIEWED",
      resourceType: "ANALYTICS",
      metadata: {
        filterKeys: filterKeysFromAnalytics(filters),
        includesNarratives: false,
      },
    })
    return { ok: true, data }
  } catch {
    return fail()
  }
}

export async function searchAdminStampleyChats(input: {
  q: string | null
  from?: string | null
  to?: string | null
  domain?: string | null
  week?: number | null
  highStress?: boolean
}): Promise<AdminSearchResult<AdminStampleySessionListItem[]>> {
  noStore()
  const gate = await requireAdminCapability("canViewTranscripts")
  if (!gate.ok) return fail()

  try {
    const filters: AnalyticsFilters = {
      ...urlSafeFiltersFromInput(input),
      q: normalizeIdentifiedSearchQuery(input.q),
    }
    const data = await loadAdminStampleyChatSessions(filters)
    await recordPhiPageViewOrThrow({
      action: "ADMIN_STAMPLEY_TRANSCRIPT_LIST_VIEWED",
      resourceType: "STAMPLEY_SESSION",
      metadata: {
        includesTranscripts: false,
        filterKeys: filterKeysFromAnalytics(filters),
      },
    })
    return { ok: true, data }
  } catch {
    return fail()
  }
}

export async function searchAdminDds(input: {
  q: string | null
  highDistressOnly: boolean
}): Promise<AdminSearchResult<Record<string, unknown>[]>> {
  noStore()
  const gate = await requireAnyAdminCapability([
    "canViewOperationalParticipantData",
    "canViewClinicalSurveyData",
  ])
  if (!gate.ok) return fail()

  try {
    const q = normalizeIdentifiedSearchQuery(input.q)
    const canViewItems = hasCapability(
      gate.actor.role,
      "canViewClinicalSurveyData"
    )
    const data = await loadAdminDdsRows({
      q,
      highDistressOnly: input.highDistressOnly,
      canViewItems,
    })
    await recordPhiPageViewOrThrow({
      action: "ADMIN_DDS_LIST_VIEWED",
      resourceType: "DDS",
      metadata: {
        filterKeys: filterKeysFromFlags({ q: Boolean(q) }),
      },
    })
    return { ok: true, data }
  } catch {
    return fail()
  }
}

export async function searchAdminPostSurveys(input: {
  q: string | null
  phqSeverity: string
  futureContact: string
}): Promise<AdminSearchResult<Record<string, unknown>[]>> {
  noStore()
  const gate = await requireAnyAdminCapability([
    "canViewOperationalParticipantData",
    "canViewClinicalSurveyData",
  ])
  if (!gate.ok) return fail()

  try {
    const caps = surveyViewCapabilities(gate.actor.role)
    const q = normalizeIdentifiedSearchQuery(input.q)
    const data = await loadAdminPostSurveyRows({
      q,
      phqSeverity: input.phqSeverity,
      futureContact: input.futureContact,
      caps,
    })
    await recordPhiPageViewOrThrow({
      action: "ADMIN_POST_SURVEY_LIST_VIEWED",
      resourceType: "POST_SURVEY",
      metadata: {
        filterKeys: filterKeysFromFlags({ q: Boolean(q) }),
        includesNarratives: false,
      },
    })
    return { ok: true, data }
  } catch {
    return fail()
  }
}

export async function searchAdminUsers(input: {
  q: string | null
  role: string
  sort: string
  page: number
  pageSize: number
}): Promise<AdminSearchResult<AdminUserDirectoryResult>> {
  noStore()
  const gate = await requireAdminCapability("canViewParticipantDirectory")
  if (!gate.ok) return fail()

  try {
    const q = normalizeIdentifiedSearchQuery(input.q)
    const data = await loadAdminUserDirectory({
      q,
      role: input.role,
      sort: input.sort,
      page: input.page,
      pageSize: input.pageSize,
    })
    await recordAdminPageView({
      policy: "fail-open",
      action: "ADMIN_USER_DIRECTORY_VIEWED",
      resourceType: "USER_DIRECTORY",
      metadata: {
        page: data.page,
        pageSize: data.pageSize,
        filterKeys: filterKeysFromFlags({ q: Boolean(q) }),
      },
    })
    return { ok: true, data }
  } catch {
    return fail()
  }
}

export async function searchAdminKeys(input: {
  q: string | null
  status: string
  sort: string
  page: number
  pageSize: number
}): Promise<AdminSearchResult<AdminKeyDirectoryResult>> {
  noStore()
  const gate = await requireAdminCapability("canManageStudyKeys")
  if (!gate.ok) return fail()

  try {
    const q = normalizeIdentifiedSearchQuery(input.q)
    const data = await loadAdminKeyDirectory({
      q,
      status: input.status,
      sort: input.sort,
      page: input.page,
      pageSize: input.pageSize,
    })
    await recordAdminPageView({
      policy: "fail-open",
      action: "ADMIN_STUDY_KEY_LIST_VIEWED",
      resourceType: "STUDY_KEY",
      metadata: {
        page: data.page,
        pageSize: data.pageSize,
        filterKeys: filterKeysFromFlags({ q: Boolean(q) }),
      },
    })
    return { ok: true, data }
  } catch {
    return fail()
  }
}
