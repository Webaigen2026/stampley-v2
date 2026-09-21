export const runtime = "nodejs"
export const dynamic = "force-dynamic"

import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { jsonWithSensitiveCache } from "@/lib/sensitive-cache-headers"

function parseScore(value: unknown): number {
  const n = Number(value)
  return Number.isFinite(n) ? n : NaN
}

export async function GET() {
  const session = await auth()

  if (!session?.user?.id) {
    return jsonWithSensitiveCache({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const row = await prisma.ddsResponse.findUnique({
      where: { userId: session.user.id },
      select: {
        emotionalScore: true,
        physicianScore: true,
        regimenScore: true,
        interpersonalScore: true,
      },
    })

    if (!row) {
      return jsonWithSensitiveCache({ ddsSummary: null })
    }

    const emotionalScore = parseScore(
      row.emotionalScore != null ? Number(row.emotionalScore) : null
    )
    const regimenScore = parseScore(
      row.regimenScore != null ? Number(row.regimenScore) : null
    )
    const physicianScore = parseScore(
      row.physicianScore != null ? Number(row.physicianScore) : null
    )
    const interpersonalScore = parseScore(
      row.interpersonalScore != null ? Number(row.interpersonalScore) : null
    )

    return jsonWithSensitiveCache({
      ddsSummary: {
        emotionalScore,
        regimenScore,
        physicianScore,
        interpersonalScore,
      },
    })
  } catch (error) {
    console.error("[dds-summary]", error)
    return jsonWithSensitiveCache(
      { error: "Failed to load DDS summary" },
      { status: 500 }
    )
  }
}
