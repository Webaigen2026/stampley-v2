import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import { prisma } from "@/lib/prisma"

import DDSClient from "./dds-client"

export default async function Page() {
  const session = await auth()

  if (!session?.user?.id) {
    redirect("/login")
  }

  const preSurvey = await prisma.preSurveyResponse.findUnique({
    where: {
      userId: session.user.id,
    },
    select: {
      id: true,
    },
  })

  if (!preSurvey) {
    redirect("/survey/pre-survey")
  }

  const dds = await prisma.ddsResponse.findUnique({
    where: {
      userId: session.user.id,
    },
    select: {
      id: true,
    },
  })

  if (dds) {
    redirect("/survey/dds/results")
  }

  return <DDSClient />
}