type Props = {
    activeStudyWeek: number
    domainMeta: {
      label: string
      description: string
    } | null
  }
  
  export default function SupportFocusCard({
    activeStudyWeek,
    domainMeta,
  }: Props) {
    return (
      <section
        id="focus"
        className="
          relative
          min-h-[280px]
          overflow-hidden
          rounded-[16px]
          bg-white
          shadow-[0_10px_36px_rgba(15,45,80,0.08)]
        "
      >
        <div
          className="
            relative
            z-10
            flex
            min-h-[280px]
            flex-col
            px-6
            py-6
            sm:pr-[215px]
            md:px-7
            md:py-7
          "
        >
          {/* Header */}
          <div>
          
  
            <h2
              className="
                mt-2
                text-2xl
                font-light
                tracking-tight
                text-slate-950
              "
            >
              Your Support Focus
            </h2>
  
            <p
              className="
                mt-1
                text-sm
                font-normal
                text-slate-500
              "
            >
              Week {activeStudyWeek}
            </p>
          </div>
  
          {/* Focus content */}
          {domainMeta ? (
            <div
              className="
                mt-6
                max-w-[330px]
              "
            >
              <div
                className="
                  h-[3px]
                  w-10
                  rounded-full
                  bg-[#1d5fd1]
                "
              />
  
              <h3
                className="
                  mt-4
                  text-xl
                  font-light
                  tracking-tight
                  text-slate-950
                "
              >
                {domainMeta.label}
              </h3>
  
              <p
                className="
                  mt-3
                  max-w-[200px]
                  text-sm
                  font-normal
                  leading-relaxed
                  text-slate-600
                "
              >
                {domainMeta.description}
              </p>
            </div>
          ) : (
            <div
              className="
                mt-6
                max-w-[330px]
              "
            >
              <div
                className="
                  h-[3px]
                  w-10
                  rounded-full
                  bg-[#cbd5e1]
                "
              />
  
              <p
                className="
                  mt-4
                  text-base
                  font-medium
                  text-slate-950
                "
              >
                No weekly focus selected yet.
              </p>
  
              <p
                className="
                  mt-3
                  max-w-[300px]
                  text-sm
                  font-normal
                  leading-relaxed
                  text-slate-600
                "
              >
                Your focus will be selected during Step 4 of your next check-in.
              </p>
            </div>
          )}
        </div>
  
        {/* Nurse illustration */}
        <div
          aria-hidden="true"
          className="
            pointer-events-none
            absolute
            bottom-0
            right-0
            hidden
            h-full
            w-[215px]
            sm:block
          "
        >
          {/* Soft medical backdrop */}
          <div
            className="
              absolute
              bottom-[-45px]
              right-[-20px]
              h-[250px]
              w-[250px]
              rounded-full
              bg-[radial-gradient(circle_at_center,#edf6ff_0%,#f6fbff_65%,transparent_100%)]
            "
          />
  
          {/* Secondary subtle circle */}
          <div
            className="
              absolute
              bottom-[18px]
              right-[18px]
              h-[150px]
              w-[150px]
              rounded-full
              border
              border-[#d8e9f8]
              opacity-70
            "
          />

          <img
            src="/dashboard/nurse.png"
            alt=""
            width={220}
            height={260}
            className="
              absolute
              bottom-0
              right-[-6px]
              z-10
              h-[168px]
              w-auto
              max-w-none
              object-contain
              object-bottom
            "
          />

    
        </div>
      </section>
    )
  }