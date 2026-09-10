import { auth, signOut } from "@/lib/auth"

import { redirect } from "next/navigation"

import Link from "next/link"

import Image from "next/image"

import { LogOut } from "lucide-react"

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
<header
  className="
    sticky
    top-0
    z-50
    border-b
    border-slate-100/80
    bg-white/95
    backdrop-blur-xl
  "
>
  <div
    className="
      mx-auto
      flex
      h-[78px]
      max-w-[1320px]
      items-center
      justify-between
      px-5
      sm:px-8
      lg:px-10
    "
  >
    {/* =================================================
        BRAND
    ================================================== */}
    <Link
      href="/"
      className="
        group
        inline-flex
        items-center
        gap-5
        rounded-[10px]
        focus-visible:outline-none
        focus-visible:ring-2
        focus-visible:ring-[#1473E6]/25
        focus-visible:ring-offset-4
      "
    >
      <Image
        src="/images/stampleyLogo.png"
        alt="AIDES-T2D"
        width={156}
        height={52}
        priority
        className="
          h-auto
          w-[142px]
          transition-opacity
          duration-200
          group-hover:opacity-90
        "
      />

      <div
        className="
          hidden
          min-w-0
          border-l
          border-slate-200
          pl-5
          sm:block
        "
      >
        <p
          className="
            text-[10px]
            font-bold
            uppercase
            tracking-[0.24em]
            text-cyan-700
          "
        >
          AIDES-T2D Research Study
        </p>

        <p
          className="
            mt-1.5
            text-xs
            font-normal
            leading-none
            text-slate-400
          "
        >
          Participant onboarding
        </p>
      </div>
    </Link>

    {/* =================================================
        PARTICIPANT ACTIONS
    ================================================== */}
    <div
      className="
        flex
        items-center
        gap-2
        sm:gap-3
      "
    >
      {formattedName ? (
        <div
          className="
            hidden
            items-center
            gap-3
            rounded-full
            bg-[#F8FAFC]
            px-2.5
            py-2
            ring-1
            ring-slate-100
            sm:flex
          "
        >
          {/* Avatar */}
          <div
            className="
              flex
              h-9
              w-9
              items-center
              justify-center
              rounded-full
              bg-[#EAF3FF]
              text-sm
              font-semibold
              uppercase
              text-[#173B7A]
            "
          >
            {formattedName.charAt(0)}
          </div>

          {/* Participant identity */}
          <div className="pr-2">
            <p
              className="
                text-[9px]
                font-semibold
                uppercase
                tracking-[0.16em]
                text-slate-400
              "
            >
              Participant
            </p>

            <p
              className="
                mt-1
                text-sm
                font-medium
                leading-none
                text-slate-700
              "
            >
              {formattedName}
            </p>
          </div>
        </div>
      ) : null}

      {/* =================================================
          SIGN OUT
      ================================================== */}
      <form
        action={async () => {
          "use server"

          await signOut({
            redirectTo: "/login",
          })
        }}
      >
        <button
          type="submit"
          className="
            group
            inline-flex
            h-10
            items-center
            gap-2.5
            rounded-full
            px-3
            text-sm
            font-medium
            text-slate-500
            transition-all
            duration-200
            hover:bg-[#F8FAFC]
            hover:text-[#173B7A]
            focus-visible:outline-none
            focus-visible:ring-2
            focus-visible:ring-[#1473E6]/25
            focus-visible:ring-offset-2
            sm:px-4
          "
        >
          <span className="hidden sm:inline">
            Sign out
          </span>

          <span
            className="
              flex
              h-8
              w-8
              items-center
              justify-center
              rounded-full
              bg-slate-100
              text-slate-500
              transition-all
              duration-200
              group-hover:bg-[#EAF3FF]
              group-hover:text-[#173B7A]
              group-hover:shadow-[0_4px_12px_rgba(23,59,122,0.08)]
            "
          >
            <LogOut
              aria-hidden="true"
              size={14}
              strokeWidth={1.7}
            />
          </span>
        </button>
      </form>
    </div>
  </div>
</header>

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
          <p>AIDES-T2D Research Study</p>

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