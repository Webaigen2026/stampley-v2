import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import { getPostSurveyAccessStatus } from "@/lib/post-survey-access"
import {
  resolvePostSurveyFormPageDestination,
  resolvePostSurveyPageSession,
} from "@/lib/post-survey-submit-validation"
import PostSurveyClient from "./post-survey-client"

export default async function PostSurveyPage() {
  const session = await auth()
  const pageSession = resolvePostSurveyPageSession(session)

  if (pageSession.status === "unauthenticated") {
    redirect("/login")
  }
  if (pageSession.status === "forbidden") {
    redirect("/dashboard")
  }

  const access = await getPostSurveyAccessStatus(pageSession.userId)
  const destination = resolvePostSurveyFormPageDestination(access)

  if (destination.status === "redirect") {
    redirect(destination.to)
  }

  return <PostSurveyClient />
}
