import Link from "next/link"
import { ArrowRight } from "lucide-react"

export default function AdminDashboardCard() {
  return (
    <section className="mt-8 rounded-[18px] border border-[#dfe8f3] bg-white p-8">
      <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-blue-900/50">
        Admin Portal
      </p>

      <h2 className="mt-4 text-[30px] font-medium tracking-[-0.03em] text-blue-950">
        Manage study operations.
      </h2>

      <p className="mt-3 max-w-xl text-[14px] leading-6 text-[#6c7d91]">
        Review users, study keys, participant activity, and safety signals
        from the administrative dashboard.
      </p>

      <Link
        href="/admin"
        className="mt-6 inline-flex items-center gap-2 rounded-full bg-blue-900 px-5 py-3 text-[12px] font-medium text-white"
      >
        Open Admin
        <ArrowRight size={15} />
      </Link>
    </section>
  )
}