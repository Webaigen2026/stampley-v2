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
      {/* Subtle image treatment */}
      <div className="absolute inset-0 bg-[#0b2857]/[0.02]" />

      {/* Soft transition into content */}
      <div
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
          text-[15px]
          font-medium
          leading-[1.35]
          tracking-[-0.015em]
          text-[#0b2857]
        "
      >
        Your participation matters.
      </p>

      <p
        className="
          mt-2
          text-[11.5px]
          font-normal
          leading-[1.65]
          text-[#66778d]
        "
      >
        Your input helps us better understand diabetes support and emotional
        well-being.
      </p>
    </div>
  </div>

  {/* Sign out */}
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
        text-[12px]
        font-normal
        text-[#52657d]
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