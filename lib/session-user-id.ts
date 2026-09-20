/** Stable authenticated user id from Auth.js session. Never use email as owner. */
export function readSessionUserId(
  session: { user?: { id?: unknown } } | null | undefined
): string | null {
  const id = session?.user?.id
  if (typeof id !== "string") return null
  const trimmed = id.trim()
  if (trimmed.length === 0 || trimmed.length > 128) return null
  if (trimmed !== id) return null
  return trimmed
}
