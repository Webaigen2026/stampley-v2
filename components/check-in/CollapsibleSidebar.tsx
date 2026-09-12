"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { PanelLeftClose, PanelLeft } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import StepSidebar from "./StepSidebar"
import Image from "next/image"

const SIDEBAR_CONFIG = {
  EXPANDED: "w-[320px]",
  COLLAPSED: "w-[88px]",
  TRANSITION: "transition-[width] duration-500 ease-[cubic-bezier(0.4,0,0.2,1)]",
}

export default function CollapsibleSidebar() {
  const [isCollapsed, setIsCollapsed] = useState(false)
  const [isMounted, setIsMounted] = useState(false)

  useEffect(() => {
    setIsMounted(true)
  }, [])

  if (!isMounted) return null

  return (
    <aside
      className={`
        relative
        z-30
        hidden
        h-screen
        shrink-0
        flex-col
        border-r
        border-slate-100
        bg-white
        font-['Outfit',system-ui,sans-serif]
        lg:flex
        ${SIDEBAR_CONFIG.TRANSITION}
        ${isCollapsed ? SIDEBAR_CONFIG.COLLAPSED : SIDEBAR_CONFIG.EXPANDED}
      `}
    >
      <div
        className={`
          relative
          z-10
          flex
          shrink-0
          items-center
          px-5
          py-5
          ${isCollapsed ? "justify-center" : "justify-between"}
        `}
      >
        <AnimatePresence mode="wait">
          {!isCollapsed ? (
            <motion.div
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
              transition={{ duration: 0.2 }}
              className="min-w-0 overflow-hidden"
            >
              <Link
                href="/dashboard"
                className="
                  flex
                  items-start
                  gap-3
                  rounded-[10px]
                  outline-none
                  focus-visible:outline-2
                  focus-visible:outline-offset-2
                  focus-visible:outline-[#173B7A]
                "
              >
                <Image
                  src="/images/stampleyLogo.png"
                  alt="AIDES-T2D"
                  width={36}
                  height={36}
                  className="h-9 w-9 object-contain"
                />
                <div className="min-w-0 pt-0.5">
                  <p className="text-[17px] font-medium leading-tight text-[#173B7A]">
                    Daily Check-In
                  </p>
                  <p className="mt-1 text-[12px] leading-snug text-slate-500">
                    A few minutes for a healthier you
                  </p>
                </div>
              </Link>
            </motion.div>
          ) : null}
        </AnimatePresence>

        <button
          type="button"
          onClick={() => setIsCollapsed((prev) => !prev)}
          className="
            flex
            h-9
            w-9
            cursor-pointer
            items-center
            justify-center
            rounded-[10px]
            text-slate-400
            outline-none
            transition
            hover:bg-slate-50
            hover:text-slate-700
            focus-visible:outline-2
            focus-visible:outline-offset-2
            focus-visible:outline-[#173B7A]
          "
          aria-label={isCollapsed ? "Expand" : "Collapse"}
        >
          {isCollapsed ? <PanelLeft size={16} /> : <PanelLeftClose size={16} />}
        </button>
      </div>

      <div className="relative z-10 flex min-h-0 flex-1 flex-col overflow-hidden">
        <div className="min-h-0 flex-1 overflow-y-auto">
          <StepSidebar collapsed={isCollapsed} />
        </div>
      </div>

      {/* Hide the image when sidebar is collapsed */}
      {!isCollapsed && (
        <div className="flex justify-center py-4">
          <img
            src="/dashboard/doctor.png"
            alt="Doctor illustration"
            loading="lazy"
            draggable={false}
            width={120}
            height={120}
          />
        </div>
      )}

    </aside>
  )
}
