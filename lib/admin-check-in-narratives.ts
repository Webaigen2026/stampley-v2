export type AdminCheckInListItem = {
  id: string
  email: string | null
  checkInDate: Date | string | null
  createdAt: Date | string | null
  distress: number | null
  mood: number | null
  energy: number | null
  domain: string | null
  subscale: string | null
  needsSafetyEscalation: boolean | null
}

export type AdminCheckInNarrativeDetail = {
  reflection: string | null
  copingAction: string | null
}

export const ADMIN_CHECK_IN_LIST_FIELDS = [
  "id",
  "email",
  "checkInDate",
  "createdAt",
  "distress",
  "mood",
  "energy",
  "domain",
  "subscale",
  "needsSafetyEscalation",
] as const

export const ADMIN_CHECK_IN_NARRATIVE_DETAIL_FIELDS = [
  "reflection",
  "copingAction",
] as const

const CHECK_IN_ID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

export function isCheckInId(value: unknown): value is string {
  return typeof value === "string" && CHECK_IN_ID_PATTERN.test(value)
}

function optionalNumber(value: unknown): number | null {
  if (value == null || value === "") return null
  const n = Number(value)
  return Number.isFinite(n) ? n : null
}

function optionalText(value: unknown): string | null {
  if (value == null) return null
  return typeof value === "string" ? value : String(value)
}

export function mapAdminCheckInListRow(
  row: Record<string, unknown>
): AdminCheckInListItem {
  return {
    id: String(row.id),
    email: row.email != null ? String(row.email) : null,
    checkInDate: (row.checkInDate ?? row.check_in_date ?? null) as
      | Date
      | string
      | null,
    createdAt: (row.createdAt ?? row.created_at ?? null) as Date | string | null,
    distress: optionalNumber(row.distress),
    mood: optionalNumber(row.mood),
    energy: optionalNumber(row.energy),
    domain: optionalText(row.domain),
    subscale: optionalText(row.subscale),
    needsSafetyEscalation:
      row.needsSafetyEscalation == null && row.needs_safety_escalation == null
        ? null
        : Boolean(row.needsSafetyEscalation ?? row.needs_safety_escalation),
  }
}

export function mapAdminCheckInNarrativeDetail(row: {
  reflection: unknown
  copingAction: unknown
}): AdminCheckInNarrativeDetail {
  return {
    reflection: typeof row.reflection === "string" ? row.reflection : null,
    copingAction: typeof row.copingAction === "string" ? row.copingAction : null,
  }
}
