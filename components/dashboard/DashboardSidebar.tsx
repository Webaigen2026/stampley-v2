import Image from "next/image"
import Link from "next/link"

import {
  CalendarCheck2,
  LayoutDashboard,
  LogOut,
  Target,
  TrendingUp,
} from "lucide-react"

import { signOut } from "@/lib/auth"

export default function DashboardSidebar() {
  return (
    <aside
      className="
        fixed
        inset-y-0
        left-0
        z-40
        hidden
        w-[248px]
        flex-col
        border-r
        border-[#dce7f4]
        bg-white
        font-['Outfit',system-ui,sans-serif]
        text-slate-950
        lg:flex
      "
    >
      {/* =====================================================
          BRAND
      ====================================================== */}
      <div className="px-6 pb-6 pt-7">
        <Link href="/" className="flex items-center">
          <Image
            src="/images/stampleylogomain.webp"
            alt="AIDES-T2D"
            width={156}
            height={52}
            priority
            className="h-auto w-[150px]"
          />
        </Link>
      </div>

      {/* =====================================================
          NAVIGATION
      ====================================================== */}
      <nav className="flex-1 px-4 pt-3">
        <div className="space-y-1.5">
          <Link
            href="/dashboard"
            className="
              flex
              items-center
              gap-3
              rounded-[12px]
              bg-[#eaf3ff]
              px-4
              py-3.5
              text-sm
              font-medium
              text-slate-950
            "
          >
            <LayoutDashboard
              size={19}
              strokeWidth={1.8}
            />

            <span>Dashboard</span>
          </Link>

          <Link
            href="/check-in"
            className="
              flex
              items-center
              gap-3
              rounded-[12px]
              px-4
              py-3.5
              text-sm
              font-medium
              text-slate-950
              transition
              hover:bg-[#f3f7fc]
            "
          >
            <CalendarCheck2
              size={19}
              strokeWidth={1.7}
            />

            <span>Daily Check-In</span>
          </Link>

          <a
            href="#progress"
            className="
              flex
              items-center
              gap-3
              rounded-[12px]
              px-4
              py-3.5
              text-sm
              font-medium
              text-slate-950
              transition
              hover:bg-[#f3f7fc]
            "
          >
            <TrendingUp
              size={19}
              strokeWidth={1.7}
            />

            <span>My Progress</span>
          </a>

          <a
            href="#focus"
            className="
              flex
              items-center
              gap-3
              rounded-[12px]
              px-4
              py-3.5
              text-sm
              font-medium
              text-slate-950
              transition
              hover:bg-[#f3f7fc]
            "
          >
            <Target
              size={19}
              strokeWidth={1.7}
            />

            <span>Support Focus</span>
          </a>
        </div>
      </nav>

      {/* =====================================================
          PARTICIPANT MESSAGE
      ====================================================== */}
      <div className="px-4 pb-5">
        <div
          className="
            group
            overflow-hidden
            rounded-[14px]
            bg-white
            shadow-[0_8px_26px_rgba(15,45,80,0.08)]
          "
        >
          {/* Image */}
          <div
            className="
              relative
              h-[140px]
              overflow-hidden
              bg-[#eef4f8]
              bg-cover
              bg-no-repeat
              transition-transform
              duration-500
            "
            style={{
              backgroundImage: "url('/dashboard/women.png')",
              backgroundPosition: "62% center",
            }}
          >
            <div
              aria-hidden="true"
              className="absolute inset-0 bg-[#0b2857]/[0.02]"
            />

            <div
              aria-hidden="true"
              className="
                absolute
                inset-x-0
                bottom-0
                h-12
                bg-gradient-to-t
                from-white
                to-transparent
              "
            />
          </div>

          {/* Content */}
          <div className="px-4 pb-5 pt-3">
            <div
              aria-hidden="true"
              className="
                mb-3
                h-[3px]
                w-8
                rounded-full
                bg-[#1473E6]
              "
            />

            <p
              className="
                text-sm
                font-medium
                text-slate-950
              "
            >
              Your participation matters.
            </p>

            <p
              className="
                mt-2
                text-xs
                font-normal
                leading-relaxed
                text-slate-500
              "
            >
              Your input helps us better understand diabetes support and
              emotional well-being.
            </p>
          </div>
        </div>

        {/* =====================================================
            SIGN OUT
        ====================================================== */}
        <form
          className="mt-4"
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
              flex
              w-full
              items-center
              justify-between
              rounded-[9px]
              px-3
              py-2.5
              text-xs
              font-medium
              text-slate-500
              transition-all
              duration-200
              hover:bg-[#f3f7fb]
              hover:text-[#0b4178]
              focus-visible:outline-none
              focus-visible:ring-2
              focus-visible:ring-[#1473E6]/30
            "
          >
            <span>Sign out</span>

            <span
              className="
                flex
                h-7
                w-7
                items-center
                justify-center
                rounded-full
                bg-[#f1f5f9]
                text-[#64748b]
                transition-all
                duration-200
                group-hover:bg-white
                group-hover:text-[#0b4178]
                group-hover:shadow-sm
              "
            >
              <LogOut
                size={14}
                strokeWidth={1.6}
              />
            </span>
          </button>
        </form>
      </div>
    </aside>
  )
}