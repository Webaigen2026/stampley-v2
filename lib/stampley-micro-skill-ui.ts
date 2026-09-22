/**
 * Default Skill/Insight disclosure key for a newly rendered assistant message.
 * Opens MICRO-SKILL when present; otherwise leaves the card collapsed.
 */
export function defaultExpandedCardForAssistantMessage(
  messageId: string,
  data: { micro_skill?: unknown } | null | undefined
): string | null {
  if (typeof messageId !== "string" || messageId.length === 0) return null
  const skill = data?.micro_skill
  if (typeof skill !== "string" || skill.trim().length === 0) return null
  return `${messageId}-skill`
}
