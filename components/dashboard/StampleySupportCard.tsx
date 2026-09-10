import Link from "next/link"
import Image from "next/image"

import { ArrowRight } from "lucide-react"

type Props = {
  checkedInToday: boolean
  studyComplete: boolean
}

export default function StampleySupportCard({
  checkedInToday,
  studyComplete,
}: Props) {
  const canStartSession =
    !studyComplete && !checkedInToday

  return (
    <section
      className="
        relative
        overflow-hidden
        rounded-[14px]
        bg-white
        p-6
        shadow-[0_8px_30px_rgba(15,45,80,0.08)]
      "
    >
      {/* Subtle decorative background */}
      <div
        aria-hidden="true"
        className="
          pointer-events-none
          absolute
          -right-14
          -top-16
          h-[180px]
          w-[180px]
          rounded-full
          bg-[#edf6ff]
        "
      />

      <div className="relative z-10">
        {/* Brand */}
        <div className="flex items-center gap-3">
          <div
            className="
              flex
              h-[52px]
              w-[52px]
              shrink-0
              items-center
              justify-center
            
            "
          >
            <Image
              src="/images/stampleyLogo.png"
              alt="Stampley"
              width={42}
              height={42}
              className="h-[42px] w-[42px] object-contain"
            />
          </div>

          <div>
          

            <h2
              className="
                mt-0.5
                text-xl
                font-light
                tracking-tight
                text-slate-950
              "
            >
              Stampley
            </h2>
          </div>
        </div>

        {/* Description */}
        <p
          className="
            mt-5
            max-w-[360px]
            text-sm
            font-normal
            leading-relaxed
            text-slate-600
          "
        >
          Stampley is part of your study check-in and provides
          support based on what you share during your session.
        </p>

        {/* Action / Status */}
        {/* <div className="mt-6">
          {canStartSession ? (
            <Link
              href="/check-in"
              className="
                group
                inline-flex
                h-[46px]
                items-center
                gap-5
                rounded-[9px]
                bg-[#0b4178]
                py-1.5
                pl-5
                pr-1.5
                text-[12px]
                font-medium
                text-white
                shadow-[0_6px_18px_rgba(11,65,120,0.16)]
                transition-all
                duration-200
                hover:-translate-y-[1px]
                hover:bg-[#083663]
                hover:shadow-[0_9px_22px_rgba(11,65,120,0.22)]
                focus-visible:outline-none
                focus-visible:ring-2
                focus-visible:ring-[#1473E6]/40
              "
            >
              <span>Start today&apos;s session</span>

              <span
                className="
                  flex
                  h-[34px]
                  w-[34px]
                  items-center
                  justify-center
                  rounded-[7px]
                  bg-white
                  text-[#0b4178]
                  transition-transform
                  duration-200
                  group-hover:translate-x-[1px]
                "
              >
                <ArrowRight
                  size={15}
                  strokeWidth={1.8}
                />
              </span>
            </Link>
          ) : (
            <div className="flex items-center gap-2.5">
              <span
                className="
                  h-[7px]
                  w-[7px]
                  shrink-0
                  rounded-full
                  bg-[#16805f]
                "
              />

              <p
                className="
                  text-[12px]
                  font-medium
                  text-[#526b65]
                "
              >
                {studyComplete
                  ? "Study check-ins complete."
                  : "Today’s Stampley session is complete."}
              </p>
            </div>
          )}
        </div> */}
      </div>
    </section>
  )
}