import Image from "next/image"
import Link from "next/link"

import { LogOut } from "lucide-react"

import { SignOutButton } from "@/components/auth/sign-out-button"

type HeaderProps = {
  formattedName: string
}

export function Header({ formattedName }: HeaderProps) {
  const initial = formattedName?.trim().charAt(0).toUpperCase() || "P"

  return (
    <header
      className="
        sticky
        top-0
        z-50
        border-b
        border-slate-200/70
        bg-white/95
        backdrop-blur-xl
        supports-[backdrop-filter]:bg-white/90
      "
    >
      <div
        className="
          mx-auto
          flex
          h-[76px]
          w-full
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
          aria-label="AIDES-T2D home"
          className="
            group
            inline-flex
            min-w-0
            items-center
            gap-4
            rounded-xl
            focus-visible:outline-none
            focus-visible:ring-2
            focus-visible:ring-[#1473E6]/25
            focus-visible:ring-offset-4
          "
        >
          <div
            className="
              flex
              h-10
              w-10
              shrink-0
              items-center
              justify-center
              rounded-xl
              transition-transform
              duration-200
              group-hover:scale-[1.02]
            "
          >
            <Image
              src="/images/stampleyLogo.png"
              alt=""
              width={40}
              height={40}
              priority
              className="
                h-auto
                w-10
                object-contain
              "
            />
          </div>

          <div
            className="
              hidden
              min-w-0
              border-l
              border-slate-200
              pl-4
              sm:block
            "
          >
            <div
              className="
                text-[10px]
                font-bold
                uppercase
                tracking-[0.24em]
                text-cyan-700
              "
            >
              AIDES-T2D
            </div>

            <div
              className="
                mt-1
                truncate
                text-[13px]
                font-semibold
                leading-none
                text-black
              "
            >
              Participant onboarding
            </div>
          </div>
        </Link>

        {/* =================================================
            PARTICIPANT AREA
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
                
                py-1.5
                pl-1.5
                pr-4
                sm:flex
              "
            >
              {/* Avatar */}
              <div
                className="
                  flex
                  h-9
                  w-9
                  shrink-0
                  items-center
                  justify-center
                  rounded-full
                  text-sm
                  font-semibold
                  uppercase
                  text-[#173B7A]
                  ring-1
                  ring-[#D8E8FB]
                "
              >
                {initial}
              </div>

              {/* Identity */}
              <div className="min-w-0">
                <div
                  className="
                    text-[9px]
                    font-bold
                    uppercase
                    tracking-[0.16em]
                    text-black
                  "
                >
                  Participant
                </div>

                <div
                  className="
                    mt-1
                    max-w-[180px]
                    truncate
                    text-sm
                    font-medium
                    leading-none
                    text-slate-800
                  "
                >
                  {formattedName}
                </div>
              </div>
            </div>
          ) : null}

          {/* =================================================
              SIGN OUT
          ================================================== */}
          <SignOutButton
            callbackUrl="/login"
            ariaLabel="Sign out"
            className="
                group
                inline-flex
                h-10
                items-center
                justify-center
                gap-2.5
                rounded-full
                px-2
                text-sm
                font-medium
                
                transition-all
                duration-200

                hover:bg-slate-50
                hover:text-[#173B7A]

                focus-visible:outline-none
                focus-visible:ring-2
                focus-visible:ring-[#1473E6]/25
                focus-visible:ring-offset-2

                sm:px-3
              "
          >
              <span
                className="
                  hidden
                  text-[13px]
                  sm:inline
                "
              >
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
                  group-hover:shadow-[0_4px_14px_rgba(23,59,122,0.08)]
                "
              >
                <LogOut
                  aria-hidden="true"
                  size={14}
                  strokeWidth={1.8}
                />
              </span>
          </SignOutButton>
        </div>
      </div>
    </header>
  )
}