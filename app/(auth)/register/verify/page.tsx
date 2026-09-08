import { redirect } from "next/navigation"
import { getPendingRegistrationEmail } from "@/actions/register"
import { RegisterVerifyForm } from "./verify-form"

export default async function RegisterVerifyPage() {
  const email = await getPendingRegistrationEmail()
  if (!email) {
    redirect("/register")
  }

  return <RegisterVerifyForm email={email} />
}
