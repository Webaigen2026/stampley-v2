export const runtime = "nodejs"
export const dynamic = "force-dynamic"

import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { enrollmentForbiddenResponse } from "@/lib/study-enrollment"

export async function GET() {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }
  const enrollmentError = await enrollmentForbiddenResponse(session)
  if (enrollmentError) return enrollmentError

  const result = await prisma.$queryRaw<Array<{ id: string }>>`
    SELECT id
    FROM check_in_submissions
    WHERE user_id = ${session.user.id}
      AND check_in_date = CURRENT_DATE
    LIMIT 1
  `

  return NextResponse.json({
    checkedInToday: result.length > 0,
  })
}
