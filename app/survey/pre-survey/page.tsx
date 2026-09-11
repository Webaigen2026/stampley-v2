import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import { prisma } from "@/lib/prisma"
import PreSurveyClient from "./pre-survey-client"

export default async function PreSurveyPage() {
  const session = await auth()

  if (!session?.user?.id) {
    redirect("/login")
  }

  if (session.user.role !== "PARTICIPANT") {
    redirect("/dashboard")
  }

  const preSurvey = await prisma.preSurveyResponse.findUnique({
    where: { userId: session.user.id },
    select: { id: true },
  })

  if (preSurvey) {
    redirect("/survey/dds")
  }

  return <PreSurveyClient />
}
