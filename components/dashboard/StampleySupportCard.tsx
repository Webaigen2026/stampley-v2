import Link from "next/link"

import {
  ArrowRight,
  MessageCircleHeart,
} from "lucide-react"

type Props = {
  checkedInToday: boolean
  studyComplete: boolean
}

export default function StampleySupportCard({
  checkedInToday,
  studyComplete,
}: Props) {
  return (
    <section className="rounded-[18px] border border-[#d6e5f6] bg-white p-6">
      <MessageCircleHeart
        size={22}
        strokeWidth={1.7}
        className="text-blue-700"
      />

      <h2 className="mt-4 text-[17px] font-medium text-blue-900">
        Stampley
      </h2>

      <p className="mt-2 text-[12px] leading-5 text-[#64758d]">
        Stampley is part of your study check-in and provides
        support based on what you share during your session.
      </p>

      {!studyComplete && !checkedInToday ? (
        <Link
          href="/check-in"
          className="
            mt-5
            inline-flex
            items-center
            gap-2
            text-[12px]
            font-medium
            text-blue-700
          "
        >
          Start today&apos;s session
          <ArrowRight size={14} />
        </Link>
      ) : (
        <p className="mt-5 text-[12px] text-[#74869c]">
          {studyComplete
            ? "Study check-ins complete."
            : "Today’s Stampley session is complete."}
        </p>
      )}
    </section>
  )
}