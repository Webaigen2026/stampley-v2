"use client"

import { useEffect, useRef } from "react"
import confetti from "canvas-confetti"
import { motion, useReducedMotion } from "framer-motion"

const CONFETTI_COLORS = [
  "#173B7A",
  "#1473E6",
  "#60A5FA",
  "#93C5FD",
  "#F4B942",
  "#FFD86A",
]

const PARTICLES = [
  { left: "6%", top: "8%", size: 12, color: "#60A5FA", square: true, rotate: 18, drift: 46 },
  { left: "16%", top: "28%", size: 8, color: "#1473E6", square: false, rotate: -10, drift: 38 },
  { left: "24%", top: "2%", size: 11, color: "#93C5FD", square: true, rotate: 42, drift: 52 },
  { left: "72%", top: "6%", size: 10, color: "#1473E6", square: true, rotate: 14, drift: 44 },
  { left: "86%", top: "22%", size: 12, color: "#60A5FA", square: true, rotate: 36, drift: 50 },
  { left: "10%", top: "62%", size: 8, color: "#F4B942", square: false, rotate: 8, drift: 34 },
  { left: "80%", top: "68%", size: 9, color: "#FFD86A", square: false, rotate: -16, drift: 36 },
  { left: "38%", top: "-4%", size: 7, color: "#173B7A", square: false, rotate: 12, drift: 40 },
  { left: "58%", top: "12%", size: 8, color: "#93C5FD", square: true, rotate: -22, drift: 42 },
] as const

export default function PreSurveyCelebration() {
  const reduceMotion = useReducedMotion()
  const hasFired = useRef(false)

  useEffect(() => {
    if (reduceMotion || hasFired.current) {
      return
    }

    hasFired.current = true

    let cancelled = false
    const timeouts: ReturnType<typeof setTimeout>[] = []

    function fire(options: confetti.Options) {
      if (cancelled) {
        return
      }

      void confetti({
        ...options,
        colors: CONFETTI_COLORS,
        disableForReducedMotion: true,
      })
    }

    fire({
      particleCount: 64,
      spread: 58,
      startVelocity: 28,
      scalar: 0.82,
      gravity: 1.05,
      origin: { x: 0.5, y: 0.2 },
    })

    timeouts.push(
      setTimeout(() => {
        fire({
          particleCount: 18,
          spread: 42,
          startVelocity: 20,
          scalar: 0.68,
          origin: { x: 0.1, y: 0.28 },
        })
        fire({
          particleCount: 18,
          spread: 42,
          startVelocity: 20,
          scalar: 0.68,
          origin: { x: 0.9, y: 0.28 },
        })
      }, 300)
    )

    return () => {
      cancelled = true
      for (const timeout of timeouts) {
        clearTimeout(timeout)
      }
      confetti.reset()
    }
  }, [reduceMotion])

  return (
    <div className="relative flex justify-center">
      <div
        aria-hidden="true"
        className="
          pointer-events-none
          absolute
          left-1/2
          top-1/2
          z-0
          h-[280px]
          w-[min(100vw,720px)]
          -translate-x-1/2
          -translate-y-1/2
          overflow-hidden
        "
      >
        {reduceMotion
          ? null
          : PARTICLES.map((particle, index) => (
              <motion.span
                key={`${particle.left}-${particle.top}`}
                className={
                  particle.square ? "absolute rounded-[3px]" : "absolute rounded-full"
                }
                style={{
                  left: particle.left,
                  top: particle.top,
                  width: particle.size,
                  height: particle.size,
                  backgroundColor: particle.color,
                }}
                initial={{
                  opacity: 0,
                  y: 0,
                  rotate: particle.rotate,
                }}
                animate={{
                  opacity: [0, 0.7, 0],
                  y: particle.drift,
                  rotate: particle.rotate + 18,
                }}
                transition={{
                  duration: 1.8 + index * 0.08,
                  delay: 0.08 + index * 0.04,
                  ease: "easeOut",
                }}
              />
            ))}
      </div>

      <div className="relative z-10 flex h-28 w-28 items-center justify-center sm:h-32 sm:w-32">
        {reduceMotion ? null : (
          <motion.span
            aria-hidden="true"
            className="
              pointer-events-none
              absolute
              inset-[-18%]
              rounded-full
            "
            style={{
              background:
                "radial-gradient(circle, rgba(255,216,106,0.42) 0%, rgba(244,185,66,0.16) 42%, transparent 70%)",
            }}
            initial={{ opacity: 0, scale: 0.7 }}
            animate={{ opacity: [0, 0.55, 0.08], scale: [0.7, 1.18, 1.08] }}
            transition={{
              duration: 1.05,
              ease: "easeOut",
              times: [0, 0.4, 1],
            }}
          />
        )}

        {reduceMotion ? (
          <img
            src="/dashboard/badge.png"
            alt="Completion badge"
            className="relative z-10 h-28 w-28 object-contain sm:h-32 sm:w-32"
          />
        ) : (
          <motion.img
            src="/dashboard/badge.png"
            alt="Completion badge"
            className="relative z-10 h-28 w-28 object-contain sm:h-32 sm:w-32"
            initial={{
              opacity: 0,
              scale: 0.55,
              y: -16,
              rotate: -8,
            }}
            animate={{
              opacity: 1,
              scale: 1,
              y: 0,
              rotate: 0,
            }}
            transition={{
              type: "spring",
              stiffness: 145,
              damping: 13,
              mass: 0.75,
            }}
          />
        )}
      </div>
    </div>
  )
}
