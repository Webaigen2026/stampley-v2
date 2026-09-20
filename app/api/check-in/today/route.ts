export const runtime = "nodejs"
export const dynamic = "force-dynamic"

import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { jsonWithSensitiveCache } from "@/lib/sensitive-cache-headers"

export async function GET() {
  const session = await auth()
  if (!session?.user?.id) {
    return jsonWithSensitiveCache({ error: "Unauthorized" }, { status: 401 })
  }

  const result = await prisma.$queryRaw<Array<{ id: string }>>`
    SELECT id
    FROM check_in_submissions
    WHERE user_id = ${session.user.id}
      AND check_in_date = CURRENT_DATE
    LIMIT 1
  `

  return jsonWithSensitiveCache({
    checkedInToday: result.length > 0,
  })
}
