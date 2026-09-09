export default function HeroBackgroundDecoration() {
    return (
      <div
        aria-hidden="true"
        className="
          pointer-events-none
          absolute
          inset-0
          overflow-hidden
        "
      >
        {/* Soft upper-left ambient wash */}
        <div
          className="
            absolute
            -left-[190px]
            -top-[220px]
            h-[620px]
            w-[620px]
            rounded-full
            bg-[radial-gradient(circle,rgba(30,64,175,0.05)_0%,rgba(30,64,175,0.018)_42%,rgba(30,64,175,0)_70%)]
          "
        />
  
        {/* Large upper-left ring */}
        <div
          className="
            absolute
            -left-[330px]
            -top-[350px]
            h-[700px]
            w-[700px]
            rounded-full
            border
            border-blue-900/[0.055]
          "
        />
  
        {/* Inner upper-left ring */}
        <div
          className="
            absolute
            -left-[255px]
            -top-[275px]
            h-[550px]
            w-[550px]
            rounded-full
            border
            border-blue-900/[0.04]
          "
        />
  
        {/* Top-right dot matrix */}
        <div
          className="
            absolute
            right-[7%]
            top-[9%]
            grid
            grid-cols-4
            gap-[10px]
            opacity-[0.13]
          "
        >
          {Array.from({ length: 16 }).map((_, index) => (
            <span
              key={`top-dot-${index}`}
              className="
                h-[3px]
                w-[3px]
                rounded-full
                bg-blue-900
              "
            />
          ))}
        </div>
  
        {/* Soft center-right wash */}
        <div
          className="
            absolute
            right-[-140px]
            top-[35%]
            h-[400px]
            w-[400px]
            rounded-full
            bg-[radial-gradient(circle,rgba(30,64,175,0.025)_0%,rgba(30,64,175,0.01)_45%,rgba(30,64,175,0)_72%)]
          "
        />
  
        {/* Large lower-right ring */}
        <div
          className="
            absolute
            -bottom-[390px]
            -right-[340px]
            h-[720px]
            w-[720px]
            rounded-full
            border
            border-blue-900/[0.05]
          "
        />
  
        {/* Inner lower-right ring */}
        <div
          className="
            absolute
            -bottom-[315px]
            -right-[265px]
            h-[570px]
            w-[570px]
            rounded-full
            border
            border-blue-900/[0.035]
          "
        />
  
        {/* Small lower-left dot accent */}
        <div
          className="
            absolute
            bottom-[9%]
            left-[6%]
            grid
            grid-cols-5
            gap-[8px]
            opacity-[0.09]
          "
        >
          {Array.from({ length: 10 }).map((_, index) => (
            <span
              key={`bottom-dot-${index}`}
              className="
                h-[3px]
                w-[3px]
                rounded-full
                bg-blue-900
              "
            />
          ))}
        </div>
      </div>
    )
  }