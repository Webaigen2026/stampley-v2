import type { ReactNode } from "react"

type Props = {
  icon: ReactNode
  title: string
  status: string
}

export default function RecordRow({
  icon,
  title,
  status,
}: Props) {
  return (
    <div className="flex items-center justify-between gap-5 py-4">
      <div className="flex items-center gap-3">
        <span className="text-blue-700">
          {icon}
        </span>

        <p className="text-[13px] font-medium text-[#294563]">
          {title}
        </p>
      </div>

      <span className="text-[11px] font-medium text-[#74869c]">
        {status}
      </span>
    </div>
  )
}