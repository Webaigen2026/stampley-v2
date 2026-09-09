type AuthBackgroundDecorationProps = {
    className?: string
  }
  
  export default function AuthBackgroundDecoration({
    className = "",
  }: AuthBackgroundDecorationProps) {
    return (
      <div
        aria-hidden="true"
        className={`pointer-events-none absolute inset-0 overflow-hidden ${className}`}
      >
        {/* Large top-right arc */}
        <div
          className="
            absolute
            -right-[180px]
            -top-[220px]
            h-[500px]
            w-[500px]
            rounded-full
            border-[70px]
            border-[#173B7A]/[0.035]
          "
        />
  
        {/* Soft top-right glow */}
        <div
          className="
            absolute
            -right-24
            -top-24
            h-[380px]
            w-[380px]
            rounded-full
            bg-[#173B7A]/[0.025]
            blur-3xl
          "
        />
  
        {/* Top-right dot field */}
        <div
          className="
            absolute
            right-8
            top-14
            grid
            grid-cols-4
            gap-[10px]
            opacity-20
          "
        >
          {Array.from({ length: 16 }).map((_, index) => (
            <span
              key={`top-dot-${index}`}
              className="
                h-[3px]
                w-[3px]
                rounded-full
                bg-[#173B7A]
              "
            />
          ))}
        </div>
  
        {/* Bottom-left dot field */}
        <div
          className="
            absolute
            -left-1
            bottom-16
            grid
            grid-cols-5
            gap-[10px]
            opacity-[0.12]
          "
        >
          {Array.from({ length: 20 }).map((_, index) => (
            <span
              key={`bottom-dot-${index}`}
              className="
                h-[3px]
                w-[3px]
                rounded-full
                bg-[#173B7A]
              "
            />
          ))}
        </div>
  
        {/* Bottom-right arc */}
        <div
          className="
            absolute
            -bottom-[250px]
            -right-[250px]
            h-[440px]
            w-[440px]
            rounded-full
            border-[55px]
            border-[#173B7A]/[0.025]
          "
        />
      </div>
    )
  }