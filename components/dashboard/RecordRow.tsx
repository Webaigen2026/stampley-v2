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

        <p className="text-sm font-medium text-slate-950">
          {title}
        </p>
      </div>

      <span className="text-xs font-normal text-slate-500">
        {status}
      </span>
    </div>
  )
}