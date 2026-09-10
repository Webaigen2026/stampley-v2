import Image from "next/image"
import { Bell } from "lucide-react"

type Props = {
  today: string
  formattedName: string
}

export default function DashboardTopbar({
  today,
  formattedName,
}: Props) {
  return (
    <header
      className="
        sticky
        top-0
        z-30
        border-b
        border-[#e3ebf5]
        bg-white/95
        backdrop-blur-xl
      "
    >
      <div className="flex h-[72px] items-center justify-between px-5 md:px-8 xl:px-10">
        <div className="lg:hidden">
          <Image
            src="/images/stampleylogomain.webp"
            alt="AIDES-T2D"
            width={130}
            height={44}
            className="h-auto w-[125px]"
          />
        </div>

        <p className="hidden text-[12px] text-[#718096] lg:block">
          {today}
        </p>

        <div className="flex items-center gap-4">
          <button
            type="button"
            aria-label="Notifications"
            className="
              flex
              h-10
              w-10
              items-center
              justify-center
              rounded-full
              border
              border-[#e4ebf4]
              bg-white
              text-blue-900
            "
          >
            <Bell size={18} strokeWidth={1.7} />
          </button>

          <div
            className="
              flex
              h-10
              w-10
              items-center
              justify-center
              rounded-full
              bg-[#dfeeff]
              text-[13px]
              font-medium
              text-blue-900
            "
          >
            {formattedName
              ? formattedName.slice(0, 2).toUpperCase()
              : "PT"}
          </div>
        </div>
      </div>
    </header>
  )
}