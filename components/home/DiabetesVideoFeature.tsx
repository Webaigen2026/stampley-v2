"use client"

import { useRef } from "react"

type DiabetesVideoFeatureProps = {
  inView: boolean
}

export default function DiabetesVideoFeature({
  inView,
}: DiabetesVideoFeatureProps) {
  const videoRef = useRef<HTMLVideoElement>(null)

  const playVideo = () => {
    videoRef.current?.play()
  }

  return (
    <div className="grid items-center gap-16 pt-20 lg:grid-cols-[1.05fr_0.95fr]">
      {/* Video */}
      <div
        className={`relative transition-all duration-700 ease-out ${
          inView
            ? "translate-x-0 opacity-100"
            : "-translate-x-12 opacity-0"
        }`}
      >
        <div
          className={`absolute -left-6 -top-16 h-56 w-36 rotate-[-12deg] rounded-full border-l-4 border-blue-100/70 transition-all duration-700 ${
            inView ? "opacity-100" : "opacity-0"
          }`}
        />

        <div
          className={`absolute -right-10 -top-10 h-24 w-24 border-[10px] border-blue-900 transition-all duration-700 ${
            inView
              ? "rotate-0 scale-100 opacity-100"
              : "rotate-45 scale-75 opacity-0"
          }`}
        />

        <div className="relative h-[300px] overflow-hidden shadow-sm md:h-[420px]">
          <video
            ref={videoRef}
            src="/videos/diabeticsvideo.mp4"
            poster="/images/diabetes/diabetes2.jpg"
            className="h-full w-full object-cover"
          />

          <div className="absolute inset-0 bg-slate-900/20" />

          <button
            type="button"
            onClick={playVideo}
            aria-label="Play video"
            className="absolute left-1/2 top-1/2 flex h-16 w-16 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-white text-blue-900 shadow-lg transition hover:scale-105"
          >
            <span className="ml-1 text-2xl">▶</span>
          </button>
        </div>
      </div>

      {/* Text */}
      <div
        className={`max-w-md transition-all duration-700 ease-out ${
          inView
            ? "translate-x-0 opacity-100"
            : "translate-x-12 opacity-0"
        }`}
      >
        <p className="mb-5 text-xs font-bold uppercase tracking-[0.35em] text-cyan-700">
          The Good Fight
        </p>

        <h2 className="mb-5 text-4xl font-light tracking-tight text-slate-950 md:text-5xl">
          It All Matters
        </h2>

        <p className="text-lg leading-relaxed text-slate-600">
          Every step toward better diabetes support matters. Through
          education, emotional care, research, and daily check-ins,
          AIDES-T2D helps people feel less alone while managing Type 2
          Diabetes.
        </p>
      </div>
    </div>
  )
}