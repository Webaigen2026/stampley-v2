import { auth, signOut } from "@/lib/auth"
import { redirect } from "next/navigation"
import Link from "next/link"
import Image from "next/image"
import { getOnboardingRedirectPath } from "@/lib/check-in-flow-guard"
import GettingStartedView from "@/components/getting-started/GettingStartedView"

export default async function GettingStartedPage() {
  const session = await auth()

  if (!session?.user?.id) {
    redirect("/login")
  }

  if (session.user.role !== "PARTICIPANT") {
    redirect("/dashboard")
  }

  const nextPath = await getOnboardingRedirectPath("/getting-started")

  if (!nextPath) {
    redirect("/dashboard")
  }

  if (nextPath !== "/getting-started") {
    redirect(nextPath)
  }

  const firstName =
    session.user.email?.split("@")[0]?.split(".")[0] ?? ""
  const formattedName = firstName
    ? firstName.charAt(0).toUpperCase() + firstName.slice(1)
    : ""

  return (
    <main
      className="
        min-h-dvh
        bg-white
        font-['Outfit',system-ui,sans-serif]
        text-black
      "
    >
      <header className="border-b border-slate-100 bg-white">
        <div className="mx-auto flex h-[72px] max-w-[1320px] items-center justify-between px-5 sm:px-8 lg:px-10">
          <Link href="/" className="inline-flex items-center gap-3">
            <Image
              src="/images/stampleyLogo.png"
              alt="AIDES-T2D"
              width={32}
              height={32}
              className="h-8 w-auto"
            />
            <span className="hidden text-[10px] font-medium uppercase tracking-[0.16em] text-slate-500 sm:inline">
              AIDES-T2D Research Study
            </span>
          </Link>

          <div className="flex items-center gap-5">
            {formattedName ? (
              <p className="hidden text-sm font-normal text-slate-500 sm:block">
                {formattedName}
              </p>
            ) : null}

            <form
              action={async () => {
                "use server"
                await signOut({ redirectTo: "/login" })
              }}
            >
              <button
                type="submit"
                className="
                  text-sm
                  font-normal
                  text-slate-500
                  transition
                  hover:text-slate-950
                "
              >
                Sign out
              </button>
            </form>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-[1320px] px-5 py-12 sm:px-8 sm:py-16 lg:px-10 lg:py-20">
        <GettingStartedView />
      </div>

      <footer className="border-t border-slate-100">
        <div className="mx-auto flex max-w-[1320px] flex-col gap-1 px-5 py-6 text-xs font-normal text-slate-500 sm:flex-row sm:items-center sm:justify-between sm:px-8 lg:px-10">
          <p>AIDES-T2D Research Study</p>
          <p>University of Massachusetts Boston</p>
          <a
            href="mailto:pcrg@umb.edu"
            className="transition hover:text-slate-950"
          >
            pcrg@umb.edu
          </a>
        </div>
      </footer>
    </main>
  )
}
