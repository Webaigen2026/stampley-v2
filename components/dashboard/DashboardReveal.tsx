"use client"

import {
  type ReactNode,
  useEffect,
  useRef,
  useState,
} from "react"

type Props = {
  children: ReactNode
  delay?: number
  className?: string
}

export default function DashboardReveal({
  children,
  delay = 0,
  className = "",
}: Props) {
  const ref = useRef<HTMLDivElement>(null)
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const element = ref.current

    if (!element) return

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true)
          observer.unobserve(element)
        }
      },
      {
        threshold: 0.08,
        rootMargin: "0px 0px -30px 0px",
      }
    )

    observer.observe(element)

    return () => observer.disconnect()
  }, [])

  return (
    <div
      ref={ref}
      style={{
        transitionDelay: `${delay}ms`,
      }}
      className={`
        transform-gpu
        transition-[opacity,transform,filter]
        duration-700
        ease-[cubic-bezier(0.22,1,0.36,1)]
        motion-reduce:transform-none
        motion-reduce:transition-none
        ${
          visible
            ? "translate-y-0 scale-100 opacity-100 blur-0"
            : "translate-y-4 scale-[0.995] opacity-0 blur-[2px]"
        }
        ${className}
      `}
    >
      {children}
    </div>
  )
}
