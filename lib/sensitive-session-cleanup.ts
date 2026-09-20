export type SessionLifecycleStatus =
  | "loading"
  | "authenticated"
  | "unauthenticated"

export function decideSensitiveSessionCleanup(input: {
  status: SessionLifecycleStatus
  currentUserId: string | null
  previousKnownUserId: string | null | undefined
}): "cleanup" | "none" {
  if (input.status === "loading") {
    return "none"
  }

  if (input.status === "unauthenticated") {
    return "cleanup"
  }

  if (
    typeof input.previousKnownUserId === "string" &&
    typeof input.currentUserId === "string" &&
    input.previousKnownUserId !== input.currentUserId
  ) {
    return "cleanup"
  }

  return "none"
}

export function nextKnownSessionUserId(input: {
  status: SessionLifecycleStatus
  currentUserId: string | null
  previousKnownUserId: string | null | undefined
}): string | null | undefined {
  if (input.status === "loading") {
    return input.previousKnownUserId
  }
  if (input.status === "unauthenticated") {
    return null
  }
  return input.currentUserId
}
