import { toAffectBand, toStressBand } from "@/lib/stampley-openai-context"

export function codedStressBand(value: unknown): string {
  const n = typeof value === "number" ? value : Number(value)
  if (!Number.isInteger(n) || n < 0 || n > 10) return ""
  return toStressBand(n)
}

export function codedAffectBand(value: unknown): string {
  if (value == null || value === "") return ""
  const n = typeof value === "number" ? value : Number(value)
  if (!Number.isInteger(n) || n < 0 || n > 10) return ""
  return toAffectBand(n)
}
