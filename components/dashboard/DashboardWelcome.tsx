import StampleyBrandBar from "@/components/dashboard/StampleyBrandBar"

type Props = {
  formattedName: string
}

export default function DashboardWelcome({
  formattedName,
}: Props) {
  return (
    <section
      className="
        relative
        overflow-hidden
        bg-white
      "
    >
      {/* Stampley brand accent */}
      <StampleyBrandBar />

      {/* Welcome hero */}
      <div className="grid min-h-[280px] md:grid-cols-[55%_45%]">
        {/* Welcome content */}
        <div
          className="
            relative
            z-10
            flex
            flex-col
            justify-center
            px-7
            py-10
            md:px-9
            lg:px-10
          "
        >
         

          <p className="text-xs font-bold uppercase tracking-[0.35em] text-cyan-700">
            Participant Dashboard
          </p>

          <h1
            className="
              my-6
              max-w-[400px]
              text-2xl
              font-light
              tracking-tight
              text-slate-950
              md:text-3xl
            "
          >
            Welcome back
            {formattedName ? `, ${formattedName}` : ""}.
          </h1>

     

          <p
            className="
              mt-4
              max-w-[570px]
              text-lg
              leading-relaxed
              text-slate-600
            "
          >
            Thank you for being part of the AIDES-T2D study. Your participation
            helps us better understand diabetes-related distress and support.
          </p>

          {/* Research study label */}
          <div className="mt-7 flex items-center gap-3">
            <span
              aria-hidden="true"
              className="h-[2px] w-8 bg-[#1473E6]"
            />

            <span
              className="
                text-xs
                font-medium
                uppercase
                tracking-[0.16em]
                text-slate-500
              "
            >
              AIDES-T2D Research Study
            </span>
          </div>
        </div>

        {/* Participant image */}
        <div className="relative min-h-[240px] md:min-h-full">
          <div
            className="
              absolute
              inset-0
              bg-cover
              bg-center
              bg-no-repeat
            "
            style={{
              backgroundImage: "url('/dashboard/header.png')",
              backgroundPosition: "55% center",
            }}
          />

          {/* Subtle clinical-blue treatment */}
          <div className="absolute inset-0 bg-[#0a285f]/[0.025]" />

          {/* Soft transition between text and image */}
          <div
            className="
              absolute
              inset-y-0
              left-0
              hidden
              w-20
              bg-gradient-to-r
              from-white
              via-white/50
              to-transparent
              md:block
            "
          />
        </div>
      </div>
    </section>
  )
}