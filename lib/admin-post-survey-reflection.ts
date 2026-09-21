export type AdminPostSurveyReflectionDetail = {
  openReflection: string | null
}

export const ADMIN_POST_SURVEY_REFLECTION_DETAIL_FIELDS = [
  "openReflection",
] as const

const POST_SURVEY_RESPONSE_ID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

export function isPostSurveyResponseId(value: unknown): value is string {
  return typeof value === "string" && POST_SURVEY_RESPONSE_ID_PATTERN.test(value)
}

export function mapPostSurveyReflectionDetail(
  openReflection: unknown
): AdminPostSurveyReflectionDetail {
  if (typeof openReflection !== "string") return { openReflection: null }
  const trimmed = openReflection.trim()
  return { openReflection: trimmed === "" ? null : trimmed }
}
