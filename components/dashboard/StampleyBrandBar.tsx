export default function StampleyBrandBar() {
    return (
      <div
        aria-hidden="true"
        className="
          relative
          h-[12px]
          w-full
          overflow-hidden
          bg-[#0E2F66]
        "
      >
        {/* Flowing blue sweep */}
        <div
          className="
            absolute
            left-[-4%]
            top-[-8px]
            h-[28px]
            w-[72%]
            rounded-[50%]
            bg-[#2F6FC6]
            [transform:rotate(-2deg)]
          "
        />
  
        {/* Secondary light-blue sweep */}
        <div
          className="
            absolute
            left-[20%]
            top-[-12px]
            h-[32px]
            w-[48%]
            rounded-[50%]
            bg-[#6CB7E8]
            opacity-90
            [transform:rotate(1deg)]
          "
        />
  
        {/* Gold signature accent */}
        <div
          className="
            absolute
            right-[18%]
            top-[-10px]
            h-[30px]
            w-[15%]
            rounded-[50%]
            bg-[#F2B134]
            [transform:rotate(-8deg)]
          "
        />
  
        {/* Dark finishing sweep */}
        <div
          className="
            absolute
            right-[-5%]
            top-[-7px]
            h-[27px]
            w-[28%]
            rounded-[50%]
            bg-[#071B3E]
            [transform:rotate(3deg)]
          "
        />
      </div>
    )
  }