/**
 * Safe pre-OpenAI diagnostic metadata for /api/stampley/generate.
 * Never include participant text, identifiers, SQL, stacks, or raw messages.
 */

export type StampleyGenerateDiagStage =
  | "request_parse"
  | "participant_persist"
  | "assistant_lookup"
  | "study_context"
  | "theme_memory"
  | "mode_select"
  | "context_build"
  | "prompt_build"

const SAFE_NODE_ERROR_CODES = new Set([
  "ECONNREFUSED",
  "ECONNRESET",
  "ETIMEDOUT",
  "ENOTFOUND",
  "EPIPE",
  "EAI_AGAIN",
  "ECONNABORTED",
  "ENETUNREACH",
])

/** Identifier-like Error.name only (max 64). Rejects newlines/spaces/punctuation. */
const SAFE_ERROR_NAME = /^[A-Za-z][A-Za-z0-9_]{0,63}$/

/**
 * Extract only allowlisted, non-sensitive error classification fields.
 * Does not return error.message or error.stack.
 */
export function extractSafeErrorMetadata(error: unknown): {
  errorName: string
  safeErrorCode?: string
} {
  const errorName = sanitizeErrorName(error)
  const safeErrorCode = extractSafeErrorCode(error)
  return safeErrorCode ? { errorName, safeErrorCode } : { errorName }
}

function sanitizeErrorName(error: unknown): string {
  if (!(error instanceof Error)) return "UnknownError"
  const name = error.name
  if (typeof name !== "string") return "UnknownError"
  if (!SAFE_ERROR_NAME.test(name)) return "UnknownError"
  return name
}

function extractSafeErrorCode(error: unknown): string | undefined {
  if (!error || typeof error !== "object") return undefined

  const code = (error as { code?: unknown }).code

  if (typeof code === "string") {
    if (/^P\d{4}$/.test(code)) return code
    if (/^\d{5}$/.test(code)) return code
    if (SAFE_NODE_ERROR_CODES.has(code)) return code
    return undefined
  }

  if (
    typeof code === "number" &&
    Number.isInteger(code) &&
    code >= 400 &&
    code <= 599
  ) {
    return String(code)
  }

  return undefined
}
