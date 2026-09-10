import Link from "next/link"
import { ArrowRight } from "lucide-react"

export default function AdminDashboardCard() {
  return (
    <section className="group relative mt-8 isolate overflow-hidden rounded-[22px] bg-white shadow-[0_10px_40px_rgba(15,23,42,0.08),0_2px_10px_rgba(15,23,42,0.03)] transition-all duration-300 ease-out hover:-translate-y-0.5 hover:shadow-[0_18px_50px_rgba(15,23,42,0.10),0_4px_14px_rgba(15,23,42,0.04)]">
      {/* Left accent rail */}
      <div
        aria-hidden="true"
        className="absolute inset-y-0 left-0 z-20 w-[5px] bg-gradient-to-b from-cyan-400 via-cyan-600 to-blue-800"
      />

      {/* Soft background wash */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 -z-10 bg-[linear-gradient(115deg,#ffffff_0%,#ffffff_44%,#f8fbff_68%,#f3f8ff_100%)]"
      />

      {/* Large lower arc */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -bottom-[250px] right-[9%] -z-10 h-[430px] w-[680px] rounded-[50%] bg-blue-50/70 blur-[1px]"
      />

      {/* Right circle */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -bottom-[190px] -right-[55px] -z-10 h-[430px] w-[430px] rounded-full bg-blue-100/35"
      />

      {/* Thin sweeping ring */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -bottom-[310px] -right-[80px] -z-10 h-[700px] w-[700px] rounded-full border border-blue-200/40"
      />

      {/* Small floating circle */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute right-[21%] top-[58px] -z-10 h-7 w-7 rounded-full bg-blue-200/60"
      />

      {/* Dot pattern */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute right-[26%] top-[88px] -z-10 hidden h-[88px] w-[180px] opacity-60 lg:block"
        style={{
          backgroundImage:
            "radial-gradient(circle, rgba(96,165,250,0.30) 2px, transparent 2.5px)",
          backgroundSize: "22px 22px",
        }}
      />

      {/* Content */}
      <div className="relative z-10 p-8 pl-9 sm:p-10 sm:pl-11 lg:px-14 lg:py-12">
        <p className="text-xs font-bold uppercase tracking-[0.35em] text-cyan-700">
          Admin Portal
        </p>

        <h2 className="mt-4 text-2xl font-light tracking-[-0.025em] text-slate-950 sm:text-[28px]">
          Manage study operations.
        </h2>

        <p className="mt-4 max-w-3xl text-lg leading-[1.75] text-slate-600">
          Review users, study keys, participant activity, and safety signals
          from the administrative dashboard.
        </p>

        <Link
          href="/admin"
          className="mt-7 inline-flex items-center gap-3 rounded-full bg-blue-950 px-5 py-3 text-sm font-medium text-white shadow-[0_5px_15px_rgba(23,37,84,0.18)] transition-all duration-200 hover:-translate-y-px hover:bg-blue-900 hover:shadow-[0_8px_20px_rgba(23,37,84,0.22)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-900 focus-visible:ring-offset-2"
        >
          Open Admin

          <ArrowRight
            size={16}
            strokeWidth={1.8}
            className="transition-transform duration-200 group-hover:translate-x-1"
          />
        </Link>
      </div>
    </section>
  )
}