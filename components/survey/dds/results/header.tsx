import Image from "next/image"

export function Header() {
  return (
   
     <header
        className="
          sticky
          top-0
          z-50
          bg-white/92
          backdrop-blur-xl
          shadow-[0_1px_0_rgba(15,45,80,0.06),0_8px_24px_rgba(15,45,80,0.035)]
        "
      >
        <div
          className="
            mx-auto
            flex
            h-[72px]
            w-full
            max-w-[1200px]
            items-center
            justify-between
            px-5
            sm:px-8
            lg:px-10
          "
        >
 <img src="/images/stampleylogomain.webp" alt="Logo" width={150} height={150} />
 
{/* 
          <div>
            <p
              className="
                text-[10px]
                font-semibold
                uppercase
                tracking-[0.22em]
                text-slate-400
              "
            >
              AIDES-T2D Research Study
            </p>

            <p
              className="
                mt-1
                text-sm
                font-medium
                text-[#173B7A]
              "
            >
              DDS-17 Results
            </p>
          </div> */}

          <div
            className="
              hidden
              items-center
              gap-2.5
            
              px-4
              py-2
    
              sm:flex
            "
          >
            <span
              className="
                h-1.5
                w-1.5
                rounded-full
                bg-[#1473E6]
              "
            />

<span
                className="
                  text-[24px]
                  font-bold
              
                "
                style={{
                  fontFamily: `'Playfair Display', 'Cinzel', 'Dancing Script', 'Caveat', 'Great Vibes', cursive, serif, system-ui, sans-serif`,
                  letterSpacing: '0.01em',
                }}
              >
              Results Ready
            </span>
          </div>
        </div>
      </header>
  
  )
}