export const ALLOWED_AUDIT_FILTER_KEYS = [
  "from",
  "to",
  "domain",
  "week",
  "highStress",
  "q",
] as const

export type AllowedAuditFilterKey = (typeof ALLOWED_AUDIT_FILTER_KEYS)[number]

export const ALLOWED_AUDIT_METADATA_KEYS = [
  "fromRole",
  "toRole",
  "emailed",
  "filterKeys",
  "rowCount",
  "identified",
  "exportMode",
  "includesPhqItems",
  "includesTranscripts",
  "includesNarratives",
  "page",
  "pageSize",
] as const

export type AllowedAuditMetadataKey = (typeof ALLOWED_AUDIT_METADATA_KEYS)[number]

export type AuditMetadata = {
  fromRole?: "ADMIN" | "STUDY_COORDINATOR" | "CLINICAL_REVIEWER" | "PARTICIPANT"
  toRole?: "ADMIN" | "STUDY_COORDINATOR" | "CLINICAL_REVIEWER" | "PARTICIPANT"
  emailed?: boolean
  filterKeys?: AllowedAuditFilterKey[]
  rowCount?: number
  identified?: boolean
  exportMode?: "CODED"
  includesPhqItems?: boolean
  includesTranscripts?: boolean
  includesNarratives?: boolean
  page?: number
  pageSize?: number
}

const ALLOWED_METADATA_KEY_SET = new Set<string>(ALLOWED_AUDIT_METADATA_KEYS)
const ALLOWED_FILTER_KEY_SET = new Set<string>(ALLOWED_AUDIT_FILTER_KEYS)
const ALLOWED_ROLES = new Set([
  "ADMIN",
  "STUDY_COORDINATOR",
  "CLINICAL_REVIEWER",
  "PARTICIPANT",
])
const ALLOWED_EXPORT_MODES = new Set(["CODED"])

export class AuditMetadataRejected extends Error {
  constructor(message = "Invalid audit metadata") {
    super(message)
    this.name = "AuditMetadataRejected"
  }
}

function assertAllowedRole(
  value: unknown,
  key: string
): "ADMIN" | "STUDY_COORDINATOR" | "CLINICAL_REVIEWER" | "PARTICIPANT" {
  if (typeof value !== "string" || !ALLOWED_ROLES.has(value)) {
    throw new AuditMetadataRejected(`Invalid ${key}`)
  }
  return value as "ADMIN" | "STUDY_COORDINATOR" | "CLINICAL_REVIEWER" | "PARTICIPANT"
}

export function filterKeysFromAnalytics(filters: {
  q?: string | null
  from?: string | null
  to?: string | null
  domain?: string | null
  highStress?: boolean
  week?: number | null
}): AllowedAuditFilterKey[] {
  return filterKeysFromFlags({
    q: Boolean(filters.q),
    from: Boolean(filters.from),
    to: Boolean(filters.to),
    domain: Boolean(filters.domain),
    highStress: Boolean(filters.highStress),
    week: filters.week != null,
  })
}

export function filterKeysFromFlags(flags: {
  from?: boolean
  to?: boolean
  domain?: boolean
  week?: boolean
  highStress?: boolean
  q?: boolean
}): AllowedAuditFilterKey[] {
  const keys: AllowedAuditFilterKey[] = []
  for (const key of ALLOWED_AUDIT_FILTER_KEYS) {
    if (flags[key]) keys.push(key)
  }
  return keys
}

export function sanitizeAuditMetadata(input: unknown): AuditMetadata | null {
  if (input == null) return null
  if (typeof input !== "object" || Array.isArray(input)) {
    throw new AuditMetadataRejected("Metadata must be a plain object")
  }

  const raw = input as Record<string, unknown>
  const sanitized: AuditMetadata = {}

  for (const key of Object.keys(raw)) {
    if (!ALLOWED_METADATA_KEY_SET.has(key)) {
      throw new AuditMetadataRejected("Unknown metadata key")
    }
    const value = raw[key]
    if (value === undefined) continue

    switch (key) {
      case "fromRole":
        sanitized.fromRole = assertAllowedRole(value, "fromRole")
        break
      case "toRole":
        sanitized.toRole = assertAllowedRole(value, "toRole")
        break
      case "exportMode":
        if (typeof value !== "string" || !ALLOWED_EXPORT_MODES.has(value)) {
          throw new AuditMetadataRejected("Invalid exportMode")
        }
        sanitized.exportMode = "CODED"
        break
      case "emailed":
      case "identified":
      case "includesPhqItems":
      case "includesTranscripts":
      case "includesNarratives":
        if (typeof value !== "boolean") {
          throw new AuditMetadataRejected(`Invalid ${key}`)
        }
        sanitized[key] = value
        break
      case "rowCount":
      case "page":
      case "pageSize":
        if (
          typeof value !== "number" ||
          !Number.isInteger(value) ||
          value < 0
        ) {
          throw new AuditMetadataRejected(`Invalid ${key}`)
        }
        sanitized[key] = value
        break
      case "filterKeys":
        if (!Array.isArray(value) || value.some((item) => typeof item !== "string")) {
          throw new AuditMetadataRejected("Invalid filterKeys")
        }
        if (value.some((item) => !ALLOWED_FILTER_KEY_SET.has(item))) {
          throw new AuditMetadataRejected("Invalid filterKeys")
        }
        sanitized.filterKeys = [...new Set(value as AllowedAuditFilterKey[])]
        break
      default:
        throw new AuditMetadataRejected("Unknown metadata key")
    }
  }

  return Object.keys(sanitized).length > 0 ? sanitized : null
}
