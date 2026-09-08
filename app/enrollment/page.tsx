import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import Link from "next/link"
import Image from "next/image"

export default async function EnrollmentPage() {
  const session = await auth()
  if (!session?.user?.id) redirect("/login")

  if (session.user.role === "ADMIN") {
    redirect("/admin/dashboard")
  }

  if (session.user.role === "PARTICIPANT") {
    redirect("/dashboard")
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#fefdfb] px-6 py-16">
      <div className="w-full max-w-[480px] rounded-2xl border border-black/[0.08] bg-white p-10 shadow-[0_12px_40px_rgba(10,10,15,0.06)]">
        <Image
          src="/images/stampleyLogo.png"
          alt="AIDES-T2D"
          width={36}
          height={36}
          className="mb-6"
        />
        <p className="mb-3 text-[11px] uppercase tracking-[0.18em] text-black/45">
          Account verified
        </p>
        <h1
          className="mb-4 text-[28px] font-normal leading-[1.2] text-[#0a0a0f]"
          style={{ fontFamily: "'Inter', sans-serif", letterSpacing: "-0.02em" }}
        >
          Study enrollment required
        </h1>
        <p
          className="mb-8 text-[15px] font-light leading-[1.7] text-black/70"
          style={{ fontFamily: "'Inter', sans-serif" }}
        >
          Your account is verified. A Study Key is required to join the
          AIDES-T2D study.
        </p>
        <p className="mb-8 text-[13px] font-light leading-[1.6] text-black/55">
          If you received a Study ID from the research team, contact them to
          complete enrollment. You can sign out and return later.
        </p>
        <div className="flex flex-col gap-3">
          <Link
            href="/login"
            className="inline-flex items-center justify-center rounded-[10px] bg-blue-900 px-5 py-3 text-[13px] font-semibold uppercase tracking-[0.06em] text-white"
          >
            Return to sign in
          </Link>
        </div>
      </div>
    </main>
  )
}
