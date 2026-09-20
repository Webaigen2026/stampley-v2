export const USER_ROLES = [
  "ADMIN",
  "STUDY_COORDINATOR",
  "CLINICAL_REVIEWER",
  "PARTICIPANT",
] as const

export type AppUserRole = (typeof USER_ROLES)[number]

export const STAFF_ROLES = [
  "ADMIN",
  "STUDY_COORDINATOR",
  "CLINICAL_REVIEWER",
] as const

export type StaffRole = (typeof STAFF_ROLES)[number]

export const ADMIN_CAPABILITIES = [
  "canManagePrivilegedUsers",
  "canManageParticipants",
  "canManageStudyKeys",
  "canViewParticipantDirectory",
  "canViewOperationalParticipantData",
  "canViewClinicalSurveyData",
  "canViewPhqItem9",
  "canViewSafetyData",
  "canViewCheckInNarratives",
  "canViewTranscripts",
  "canViewContactInformation",
  "canViewAggregateAnalytics",
  "canExportCodedResearchData",
  "canDeleteUsers",
] as const

export type AdminCapability = (typeof ADMIN_CAPABILITIES)[number]

const ALL_CAPABILITIES = new Set<AdminCapability>(ADMIN_CAPABILITIES)

const ROLE_CAPABILITIES: Record<StaffRole, ReadonlySet<AdminCapability>> = {
  ADMIN: ALL_CAPABILITIES,
  STUDY_COORDINATOR: new Set([
    "canManageParticipants",
    "canManageStudyKeys",
    "canViewParticipantDirectory",
    "canViewOperationalParticipantData",
    "canViewContactInformation",
    "canViewAggregateAnalytics",
    "canExportCodedResearchData",
  ]),
  CLINICAL_REVIEWER: new Set([
    "canViewParticipantDirectory",
    "canViewClinicalSurveyData",
    "canViewPhqItem9",
    "canViewSafetyData",
    "canViewCheckInNarratives",
    "canViewTranscripts",
    "canViewAggregateAnalytics",
  ]),
}

export function isUserRole(value: unknown): value is AppUserRole {
  return typeof value === "string" && (USER_ROLES as readonly string[]).includes(value)
}

export function isStaffRole(value: unknown): value is StaffRole {
  return typeof value === "string" && (STAFF_ROLES as readonly string[]).includes(value)
}

export function hasCapability(
  role: unknown,
  capability: AdminCapability
): boolean {
  if (!isStaffRole(role)) return false
  if (!(ADMIN_CAPABILITIES as readonly string[]).includes(capability)) return false
  return ROLE_CAPABILITIES[role].has(capability)
}

export function hasAnyCapability(
  role: unknown,
  capabilities: readonly AdminCapability[]
): boolean {
  return capabilities.some((capability) => hasCapability(role, capability))
}

export function creatableRolesFor(actorRole: unknown): AppUserRole[] {
  if (actorRole === "ADMIN") {
    return [...USER_ROLES]
  }
  if (actorRole === "STUDY_COORDINATOR") {
    return ["PARTICIPANT"]
  }
  return []
}

export function canGrantRole(actorRole: unknown, requestedRole: unknown): boolean {
  if (!isUserRole(requestedRole)) return false
  return creatableRolesFor(actorRole).includes(requestedRole)
}

export function requiresAdminStepUp(requestedRole: string | null | undefined): boolean {
  return requestedRole === "ADMIN"
}

export function parseRequestedRole(value: unknown): AppUserRole | null {
  if (typeof value !== "string") return null
  const trimmed = value.trim().toUpperCase()
  return isUserRole(trimmed) ? trimmed : null
}

export function roleLabel(role: unknown): string {
  switch (role) {
    case "ADMIN":
      return "Administrator"
    case "STUDY_COORDINATOR":
      return "Study Coordinator"
    case "CLINICAL_REVIEWER":
      return "Clinical Reviewer"
    case "PARTICIPANT":
      return "Participant"
    default:
      return "Unknown"
  }
}

export const ADMIN_NAV_CAPABILITIES: Record<string, AdminCapability | null> = {
  "/admin/dashboard": null,
  "/admin/users": "canViewParticipantDirectory",
  "/admin/keys": "canManageStudyKeys",
  "/admin/check-ins": "canViewCheckInNarratives",
  "/admin/stampley-chats": "canViewTranscripts",
  "/admin/safety": "canViewSafetyData",
  "/admin/analytics": "canViewAggregateAnalytics",
  "/admin/pre-surveys": "canViewOperationalParticipantData",
  "/admin/post-surveys": "canViewOperationalParticipantData",
  "/admin/dds": "canViewOperationalParticipantData",
}

export function canAccessAdminPath(role: unknown, pathname: string): boolean {
  if (!isStaffRole(role)) return false
  if (pathname === "/admin" || pathname === "/admin/dashboard") return true
  if (pathname.startsWith("/admin/users")) {
    return hasCapability(role, "canViewParticipantDirectory")
  }
  if (pathname.startsWith("/admin/keys")) {
    return hasCapability(role, "canManageStudyKeys")
  }
  if (pathname.startsWith("/admin/check-ins")) {
    return hasCapability(role, "canViewCheckInNarratives")
  }
  if (pathname.startsWith("/admin/stampley-chats")) {
    return hasCapability(role, "canViewTranscripts")
  }
  if (pathname.startsWith("/admin/safety")) {
    return hasCapability(role, "canViewSafetyData")
  }
  if (pathname.startsWith("/admin/analytics")) {
    return hasCapability(role, "canViewAggregateAnalytics")
  }
  if (
    pathname.startsWith("/admin/pre-surveys") ||
    pathname.startsWith("/admin/post-surveys") ||
    pathname.startsWith("/admin/dds")
  ) {
    return hasAnyCapability(role, [
      "canViewOperationalParticipantData",
      "canViewClinicalSurveyData",
    ])
  }
  return false
}

export function visibleAdminNavHrefs(role: unknown): string[] {
  return Object.entries(ADMIN_NAV_CAPABILITIES)
    .filter(([href, capability]) => {
      if (capability == null) return isStaffRole(role)
      if (
        href === "/admin/pre-surveys" ||
        href === "/admin/post-surveys" ||
        href === "/admin/dds"
      ) {
        return hasAnyCapability(role, [
          "canViewOperationalParticipantData",
          "canViewClinicalSurveyData",
        ])
      }
      return hasCapability(role, capability)
    })
    .map(([href]) => href)
}
