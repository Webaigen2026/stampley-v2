export const runtime = "nodejs"
export const dynamic = "force-dynamic"

import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

type DomainName = "Emotional" | "Regimen" | "Physician" | "Interpersonal"

function parseScore(value: unknown): number {
  const n = Number(value)
  return Number.isFinite(n) ? n : NaN
}

function highestDomainFromScores(scores: {
  emotionalScore: number
  regimenScore: number
  physicianScore: number
  interpersonalScore: number
}): DomainName {
  const entries: { domain: DomainName; score: number }[] = [
    { domain: "Emotional", score: scores.emotionalScore },
    { domain: "Regimen", score: scores.regimenScore },
    { domain: "Physician", score: scores.physicianScore },
    { domain: "Interpersonal", score: scores.interpersonalScore },
  ]

  return entries.reduce((best, current) =>
    current.score > best.score ? current : best
  ).domain
}

export async function GET() {
  const session = await auth()

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const row = await prisma.ddsResponse.findUnique({
      where: { userId: session.user.id },
      select: {
        totalScore: true,
        emotionalScore: true,
        physicianScore: true,
        regimenScore: true,
        interpersonalScore: true,
      },
    })

    if (!row) {
      return NextResponse.json({ ddsSummary: null })
    }

    const totalScore = parseScore(
      row.totalScore != null ? Number(row.totalScore) : null
    )
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

    const highestDomain = highestDomainFromScores({
      emotionalScore,
      regimenScore,
      physicianScore,
      interpersonalScore,
    })

    return NextResponse.json({
      ddsSummary: {
        totalScore,
        emotionalScore,
        regimenScore,
        physicianScore,
        interpersonalScore,
        highestDomain,
      },
    })
  } catch (error) {
    console.error("[dds-summary]", error)
    return NextResponse.json(
      { error: "Failed to load DDS summary" },
      { status: 500 }
    )
  }
}
