import type { ReactNode } from "react"

type Props = {
  icon: ReactNode
  value: string
  label: string
  className?: string
  iconClassName?: string
}

export default function SummaryCard({
  icon,
  value,
  label,
  className = "",
  iconClassName = "",
}: Props) {
  return (
    <div
      className={`
        rounded-[18px]
        border
        border-white
        p-5
        shadow-[0_8px_28px_rgba(27,62,101,0.035)]
        ${className}
      `}
    >
      <div className="flex items-center gap-4">
        <div
          className={`
            flex
            h-11
            w-11
            shrink-0
            items-center
            justify-center
            rounded-[13px]
            ${iconClassName}
          `}
        >
          {icon}
        </div>

        <div>
          <p className="text-[24px] font-semibold leading-none tracking-[-0.025em] text-[#0a285f]">
            {value}
          </p>

          <p className="mt-1.5 text-[11px] leading-4 text-[#63758c]">
            {label}
          </p>
        </div>
      </div>
    </div>
  )
}