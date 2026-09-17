import { auth, signOut } from "@/lib/auth"

import { redirect } from "next/navigation"

import Link from "next/link"

import Image from "next/image"

import { LogOut } from "lucide-react"
import { Header } from "@/components/getting-started/header"

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

  const nextPath =
    await getOnboardingRedirectPath("/getting-started")

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
   {/* =====================================================
    HEADER
====================================================== */}

<Header formattedName={formattedName} />
      {/* =====================================================
          PAGE CONTENT
      ====================================================== */}
      <div
        className="
          mx-auto
          max-w-[1320px]
          px-5
          py-12
          sm:px-8
          sm:py-16
          lg:px-10
          lg:py-20
        "
      >
        <GettingStartedView />
      </div>

      {/* =====================================================
          FOOTER
      ====================================================== */}
      <footer className="border-t border-slate-100">
        <div
          className="
            mx-auto
            flex
            max-w-[1320px]
            flex-col
            gap-1
            px-5
            py-6
            text-xs
            font-normal
            text-slate-500
            sm:flex-row
            sm:items-center
            sm:justify-between
            sm:px-8
            lg:px-10
          "
        >
          <p>AIDES-T2D</p>

          <p>University of Massachusetts Boston</p>

          <a
            href="mailto:pcrg@umb.edu"
            className="
              transition
              hover:text-slate-950
            "
          >
            pcrg@umb.edu
          </a>
        </div>
      </footer>
    </main>
  )
}