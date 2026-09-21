export const IDENTIFIED_SEARCH_MAX_LENGTH = 200
export const ADMIN_IDENTIFIED_SEARCH_PARAM = "q"

export function normalizeIdentifiedSearchQuery(raw: unknown): string | null {
  if (typeof raw !== "string") return null
  const trimmed = raw.trim()
  if (!trimmed) return null
  if (trimmed.length > IDENTIFIED_SEARCH_MAX_LENGTH) {
    return trimmed.slice(0, IDENTIFIED_SEARCH_MAX_LENGTH)
  }
  return trimmed
}

export function stripIdentifiedSearchParam(search: string): string {
  const params = new URLSearchParams(
    search.startsWith("?") ? search.slice(1) : search
  )
  params.delete(ADMIN_IDENTIFIED_SEARCH_PARAM)
  const next = params.toString()
  return next ? `?${next}` : ""
}
