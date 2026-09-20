export const runtime = "nodejs"
export const dynamic = "force-dynamic"

import { NextRequest } from "next/server"
import { auth } from "@/lib/auth"
import { jsonWithSensitiveCache } from "@/lib/sensitive-cache-headers"
import { buildCheckInStudyContext } from "@/lib/check-in-context"
import { resolveWeeklyDomainForUser } from "@/lib/resolve-weekly-domain"
import { STUDY_DOMAINS } from "@/lib/weekly-domain-progress"
import { prisma } from "@/lib/prisma"

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session?.user?.id) {
    return jsonWithSensitiveCache({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const body = await req.json().catch(() => ({}))
    const { domain } = await resolveWeeklyDomainForUser(
      session.user.id,
      body.domain
    )

    if (!domain || !STUDY_DOMAINS.includes(domain)) {
      return jsonWithSensitiveCache(
        {
          error:
            "Weekly focus is missing. Open Weekly Domain and continue again.",
        },
        { status: 400 }
      )
    }

    const progress = await prisma.userStudyProgress.findUnique({
      where: { userId: session.user.id },
      select: { totalCheckins: true },
    })

    const totalCheckins = Number(progress?.totalCheckins ?? 0)
    const checkInNumber = totalCheckins + 1
    const context = buildCheckInStudyContext(domain, checkInNumber)

    if (!context) {
      return jsonWithSensitiveCache(
        { error: "Unable to compute study context." },
        { status: 400 }
      )
    }

    return jsonWithSensitiveCache(context)
  } catch (error) {
    console.error("[check-in/study-context]", error)
    return jsonWithSensitiveCache(
      { error: "Failed to compute study context" },
      { status: 500 }
    )
  }
}
