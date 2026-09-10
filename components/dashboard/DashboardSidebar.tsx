import Image from "next/image"
import Link from "next/link"

import {
  CalendarCheck2,
  HeartHandshake,
  LayoutDashboard,
  LogOut,
  Target,
  TrendingUp,
  ClipboardCheck,
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
        font-[Univers,'Helvetica_Neue',Helvetica,Arial,sans-serif]
        text-black
        lg:flex
      "
    >
      {/* Brand */}
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

      {/* Navigation */}
      <nav className="flex-1 px-4 pt-3">
        <div className="space-y-1.5">
          <Link
            href="/dashboard"
            className="
              flex
              items-center
              gap-3
             
              bg-[#eaf3ff]
              px-4
              py-3.5
              text-[14px]
              font-medium
              text-black
            "
          >
            <LayoutDashboard size={19} strokeWidth={1.8} />

            Dashboard
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
              text-[14px]
              font-normal
              text-black
              transition
              hover:bg-[#f3f7fc]
              hover:text-black
            "
          >
            <CalendarCheck2 size={19} strokeWidth={1.7} />

            Daily Check-In
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
              text-[14px]
              font-normal
              text-black
              transition
              hover:bg-[#f3f7fc]
              hover:text-black
            "
          >
            <TrendingUp size={19} strokeWidth={1.7} />

            My Progress
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
              text-[14px]
              font-normal
              text-black
              transition
              hover:bg-[#f3f7fc]
              hover:text-black
            "
          >
            <Target size={19} strokeWidth={1.7} />

            Support Focus
          </a>

        </div>
      </nav>

  {/* Participant message */}
<div className="px-4 pb-5">
  <div
    className="
      group
      overflow-hidden
      border
      border-[#dfe8f2]
      bg-white
    "
  >
    {/* Image */}
    <div
      className="
        relative
        h-[145px]
        overflow-hidden
        bg-[#eef3f7]
        bg-cover
        bg-center
        bg-no-repeat
      "
      style={{
        backgroundImage: "url('/dashboard/women.png')",
        backgroundPosition: "62% center",
      }}
    >
      {/* Very subtle image treatment */}
      <div className="absolute inset-0 bg-black/[0.02]" />

    
    </div>

    {/* Content */}
    <div className="px-4 pb-5 pt-4">
      {/* Small accent */}
      <div className="mb-3 h-[2px] w-7 bg-[#1473E6]" />

      <p
        className="
          text-[15px]
          font-medium
          leading-[1.35]
          tracking-[-0.01em]
          text-black
        "
      >
        Your participation matters.
      </p>

      <p
        className="
          mt-2
          text-[12px]
          font-normal
          leading-[1.6]
          text-black/70
        "
      >
        Your input helps us better understand diabetes support and emotional
        well-being.
      </p>
    </div>
  </div>

  {/* Sign out */}
  <form
    className="mt-3"
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
        border-t
        border-[#e5e7eb]
        px-1
        py-3
        text-[12px]
        font-normal
        text-black
        transition-colors
        hover:text-[#1473E6]
      "
    >
      <span>Sign out</span>

      <LogOut
        size={15}
        strokeWidth={1.6}
        className="
          text-black/55
          transition-colors
          group-hover:text-[#1473E6]
        "
      />
    </button>
  </form>
</div>
    </aside>
  )
}