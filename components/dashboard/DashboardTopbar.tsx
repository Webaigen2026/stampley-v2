"use client"

import Image from "next/image"
import Link from "next/link"
import { useEffect, useId, useRef, useState } from "react"
import { Bell, LayoutDashboard, LogOut } from "lucide-react"
import { signOut } from "next-auth/react"

type DashboardTopbarProps = {
  today: string
  formattedName: string
  email?: string
}

function getInitials(name: string) {
  const cleaned = name.trim()

  if (!cleaned) {
    return "PT"
  }

  const parts = cleaned
    .split(/\s+/)
    .filter(Boolean)

  if (parts.length === 1) {
    return parts[0]
      .slice(0, 2)
      .toUpperCase()
  }

  return `${parts[0][0]}${parts[1][0]}`.toUpperCase()
}

export default function DashboardTopbar({
  today,
  formattedName,
  email,
}: DashboardTopbarProps) {
  const initials = getInitials(formattedName)
  const [menuOpen, setMenuOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)
  const menuId = useId()

  useEffect(() => {
    if (!menuOpen) return

    function handlePointerDown(event: MouseEvent) {
      if (
        menuRef.current &&
        !menuRef.current.contains(event.target as Node)
      ) {
        setMenuOpen(false)
      }
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setMenuOpen(false)
      }
    }

    document.addEventListener("mousedown", handlePointerDown)
    document.addEventListener("keydown", handleKeyDown)

    return () => {
      document.removeEventListener("mousedown", handlePointerDown)
      document.removeEventListener("keydown", handleKeyDown)
    }
  }, [menuOpen])

  function handleSignOut() {
    setMenuOpen(false)
    void signOut({ callbackUrl: "/login" })
  }

  return (
    <header
      className="
        sticky
        top-0
        z-40
        h-[72px]
        bg-white/92
        backdrop-blur-xl
        shadow-[0_1px_0_rgba(15,45,80,0.05),0_8px_24px_rgba(15,45,80,0.035)]
      "
    >
      <div
        className="
          mx-auto
          flex
          h-full
          w-full
          items-center
          justify-between
          px-5
          sm:px-6
          lg:px-8
        "
      >
        {/* Mobile logo */}
        <div className="flex items-center lg:hidden">
          <Image
            src="/images/stampleylogomain.webp"
            alt="Stampley"
            width={132}
            height={38}
            priority
            className="
              h-auto
              w-[118px]
              object-contain
            "
          />
        </div>

        {/* Desktop date */}
        <div className="hidden lg:block">
          <p
            className="
              font-['Outfit',system-ui,sans-serif]
              text-sm
              font-medium
              text-slate-500
            "
          >
            {today}
          </p>
        </div>

        {/* Right actions */}
        <div
          className="
            ml-auto
            flex
            items-center
            gap-3
          "
        >
          {/* <button
            type="button"
            aria-label="Notifications"
            className="
              flex
              h-10
              w-10
              items-center
              justify-center
              rounded-full
              bg-[#F7FAFD]
              text-slate-500
              transition-all
              duration-200

              hover:bg-[#EEF6FF]
              hover:text-[#173B7A]

              focus-visible:outline-none
              focus-visible:ring-2
              focus-visible:ring-[#1473E6]/30
              focus-visible:ring-offset-2
            "
          >
            <Bell
              size={18}
              strokeWidth={1.8}
            />
          </button> */}

          <div className="relative" ref={menuRef}>
            <button
              type="button"
              aria-label="Open account menu"
              aria-haspopup="menu"
              aria-expanded={menuOpen}
              aria-controls={menuId}
              onClick={() => setMenuOpen((open) => !open)}
              className="
                flex
                h-10
                w-10
                items-center
                justify-center
                rounded-full
                bg-[#173B7A]
                font-['Outfit',system-ui,sans-serif]
                text-sm
                font-semibold
                text-white
                shadow-[0_6px_16px_rgba(23,59,122,0.15)]
                transition-opacity
                duration-200

                hover:opacity-95
                focus-visible:outline-none
                focus-visible:ring-2
                focus-visible:ring-[#1473E6]/30
                focus-visible:ring-offset-2
              "
            >
              {initials}
            </button>

            {menuOpen && (
              <div
                id={menuId}
                role="menu"
                aria-label="Account menu"
                className="
                  absolute
                  right-0
                  top-[calc(100%+10px)]
                  z-50
                  w-[min(232px,calc(100vw-2.5rem))]
                  overflow-hidden
                 
                  bg-white
                  font-['Outfit',system-ui,sans-serif]
                  shadow-[0_18px_45px_rgba(15,45,80,0.14)]
                  ring-1
                  ring-[#173B7A]/6
                "
              >
                <div className="border-b border-[#eef3f8] px-4 py-3">
                  <p className="truncate text-sm font-medium text-[#173B7A]">
                    {formattedName || "Participant"}
                  </p>
                  {email ? (
                    <p className="mt-0.5 truncate text-xs text-slate-500">
                      {email}
                    </p>
                  ) : null}
                </div>

                <div className="p-1.5">
                  {/* <Link
                    href="/dashboard"
                    role="menuitem"
                    onClick={() => setMenuOpen(false)}
                    className="
                      flex
                      items-center
                      gap-3
                      rounded-[10px]
                      px-3
                      py-2.5
                      text-sm
                      font-medium
                      text-slate-700
                      transition
                      hover:bg-[#F7FAFD]
                      hover:text-[#173B7A]
                      focus-visible:outline-none
                      focus-visible:bg-[#F7FAFD]
                      focus-visible:ring-2
                      focus-visible:ring-[#1473E6]/25
                    "
                  >
                    <LayoutDashboard
                      size={16}
                      strokeWidth={1.8}
                    />
                    Dashboard
                  </Link> */}

                  <button
                    type="button"
                    role="menuitem"
                    onClick={handleSignOut}
                    className="
                      flex
                      w-full
                      items-center
                      gap-3
                      rounded-[10px]
                      px-3
                      py-2.5
                      text-left
                      text-sm
                      font-medium
                      text-[#173B7A]
                      transition
                      hover:bg-[#EEF6FF]
                      focus-visible:outline-none
                      focus-visible:bg-[#EEF6FF]
                      focus-visible:ring-2
                      focus-visible:ring-[#1473E6]/25
                    "
                  >
                    <LogOut
                      size={16}
                      strokeWidth={1.8}
                    />
                    Sign out
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  )
}
