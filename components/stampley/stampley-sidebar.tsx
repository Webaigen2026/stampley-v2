"use client"

import React, { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import {
  PanelLeftClose,
  PanelLeft,
  Target,
  FileBarChart,
  CheckCircle2,
  Circle,
  CircleDot,
  ChevronRight,
  BarChart3,
  HeartPulse,
} from "lucide-react"
import Link from "next/link"
import Image from "next/image"

type DomainKey = "Emotional" | "Regimen" | "Physician" | "Interpersonal"

const DDS_FOCUS: Record<
  DomainKey,
  { label: string; description: string }
> = {
  Emotional: {
    label: "Emotional",
    description:
      "Feelings, burnout, worry, and the emotional weight of living with diabetes.",
  },
  Regimen: {
    label: "Regimen",
    description:
      "Routines, medication, food, glucose, and day-to-day self-management.",
  },
  Physician: {
    label: "Physician",
    description:
      "Your care team, appointments, and feeling heard by healthcare providers.",
  },
  Interpersonal: {
    label: "Interpersonal",
    description:
      "Family, friends, support, and feeling understood by people around you.",
  },
}

type StepStatus = "completed" | "active" | "pending"

interface SessionStep {
  label: string
  status: StepStatus
}

export type DdsSummary = {
  totalScore: number
  emotionalScore: number
  regimenScore: number
  physicianScore: number
  interpersonalScore: number
  highestDomain: string
}

function formatScore(value: number | null | undefined) {
  if (typeof value !== "number" || Number.isNaN(value)) return "—"
  return value.toFixed(2)
}

export interface StampleySidebarProps {
  isOpen: boolean
  setIsOpen: (open: boolean) => void
  setActiveView?: (view: "chat" | "results") => void
  currentDomain: string | null
  distress: number
  mood: number
  energy: number
  chatStarted: boolean
  checkInCompleted: boolean
  reflection?: string
  copingAction?: string
  userMessageCount?: number
  conversationPhase?: "opening" | "exploration" | "coping" | "closure"
  highStress?: boolean
  subscale?: string
  dayNumber?: number
  weekNumber?: number
  ddsSummary?: DdsSummary | null
}

function isDomainKey(value: string | null): value is DomainKey {
  return (
    value === "Emotional" ||
    value === "Regimen" ||
    value === "Physician" ||
    value === "Interpersonal"
  )
}

function getSessionSteps(
  chatStarted: boolean,
  checkInCompleted: boolean
): SessionStep[] {
  if (checkInCompleted) {
    return [
      { label: "Daily data collected", status: "completed" },
      { label: "Stampley chat started", status: "completed" },
      { label: "Check-in saved", status: "completed" },
      { label: "Session complete", status: "completed" },
    ]
  }

  if (chatStarted) {
    return [
      { label: "Daily data collected", status: "completed" },
      { label: "Stampley chat started", status: "completed" },
      { label: "Check-in not saved yet", status: "active" },
      { label: "Complete Check-in to finish", status: "pending" },
    ]
  }

  return [
    { label: "Daily data collected", status: "completed" },
    { label: "Stampley chat started", status: "pending" },
    { label: "Check-in not saved yet", status: "pending" },
    { label: "Complete Check-in to finish", status: "pending" },
  ]
}

function derivePhaseFromUserReplies(
  userMessageCount?: number
): "opening" | "exploration" | "coping" | "closure" {
  const count = Math.max(0, userMessageCount ?? 0)
  if (count === 0) return "opening"
  if (count === 1) return "exploration"
  if (count === 2) return "coping"
  return "closure"
}

function getSupportLevel(stress: number): {
  label: "Low" | "Moderate" | "Elevated" | "High support"
  detail: string
} {
  if (stress >= 9) {
    return {
      label: "High support",
      detail: "High stress today — shorter, steadier support.",
    }
  }
  if (stress >= 7) {
    return { label: "Elevated", detail: "More support and gentle structure." }
  }
  if (stress >= 4) {
    return { label: "Moderate", detail: "Balanced reflection + small steps." }
  }
  return { label: "Low", detail: "Light reflection and encouragement." }
}

function Chip({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center rounded-full border border-black/[0.08] bg-white px-2 py-1 text-[10px] font-medium text-black">
      {children}
    </span>
  )
}

function StepIcon({ status }: { status: StepStatus }) {
  if (status === "completed") {
    return (
      <CheckCircle2
        size={14}
        strokeWidth={1.8}
        className="shrink-0 text-black"
      />
    )
  }
  if (status === "active") {
    return (
      <CircleDot
        size={14}
        strokeWidth={1.8}
        className="shrink-0 text-black"
      />
    )
  }
  return (
    <Circle
      size={14}
      strokeWidth={1.8}
      className="shrink-0 text-black/20"
    />
  )
}

function SidebarCard({
  children,
  className = "",
}: {
  children: React.ReactNode
  className?: string
}) {
  return (
    <motion.div
      className={`rounded-[16px] bg-white p-4 shadow-[0_10px_30px_rgba(15,45,80,0.07)] ${className}`}
    >
      {children}
    </motion.div>
  )
}

function MonoLabel({
  children,
  icon,
}: {
  children: React.ReactNode
  icon?: React.ReactNode
}) {
  return (
    <p className="mb-4 flex items-center gap-2 text-[13px] font-semibold uppercase tracking-[0.14em] text-[#173B7A]">
      {icon}
      {children}
    </p>
  )
}

export function StampleySidebar({
  isOpen,
  setIsOpen,
  setActiveView,
  currentDomain,
  distress,
  mood,
  energy,
  chatStarted,
  checkInCompleted,
  reflection,
  copingAction,
  userMessageCount,
  conversationPhase,
  highStress,
  subscale,
  dayNumber,
  weekNumber,
  ddsSummary = null,
}: StampleySidebarProps) {
  const [isCollapsed, setIsCollapsed] = useState(true)

  const domainFocus = isDomainKey(currentDomain)
    ? DDS_FOCUS[currentDomain]
    : null

  const sessionSteps = getSessionSteps(chatStarted, checkInCompleted)
  const resolvedPhase =
    conversationPhase ?? derivePhaseFromUserReplies(userMessageCount)
  const supportLevel = getSupportLevel(distress)
  const isHighStress = highStress ?? distress >= 9

  return (
    <>
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-40 bg-white backdrop-blur-[2px] md:hidden"
            onClick={() => setIsOpen(false)}
          />
        )}
      </AnimatePresence>
      

      <motion.aside
        initial={false}
        animate={{ width: isCollapsed ? 68 : 272 }}
        transition={{ type: "spring", stiffness: 400, damping: 40 }}
        className="relative z-50 flex h-full min-h-0 shrink-0 select-none flex-col overflow-hidden border-r border-slate-100 bg-white font-['Outfit',system-ui,sans-serif]"
      >
        {/* Header */}
        <div
          className={`flex h-[72px] shrink-0 items-center px-3 ${
            isCollapsed ? "justify-center" : "justify-between"
          }`}
        >
          {!isCollapsed && (
            // <span className="px-1 font-[JetBrains_Mono,monospace] text-[10px] uppercase tracking-[0.22em] text-black">
            //   Session
            // </span> 
          <Link href="/dashboard" className="flex items-center gap-2 hover:scale-105 transition-all duration-300">
              <Image src="/images/stampleyLogo.png" alt="Stampley" width={30} height={30} />
     
          </Link>
          
          
          )}
          <button
            type="button"
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="flex h-8 w-8 items-center justify-center rounded-[10px] text-slate-400 transition hover:bg-slate-50 hover:text-slate-700"
            aria-label={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            {isCollapsed ? (
              <PanelLeft size={14} strokeWidth={1.5} />
            ) : (
              <PanelLeftClose size={14} strokeWidth={1.5} />
            )}
          </button>
        </div>

        {isCollapsed ? (
          <div className="flex flex-1 flex-col items-center gap-4 px-2 py-4">
            <div
              className="flex h-9 w-9 items-center justify-center rounded-[10px] bg-white text-black"
              title={`Stress ${distress}/10`}
            >
              <Target size={14} strokeWidth={1.5} />
            </div>
            {sessionSteps.map((step) => (
              <StepIcon key={step.label} status={step.status} />
            ))}
            {setActiveView && (
              <button
                type="button"
                onClick={() => setActiveView("results")}
                className="mt-auto flex h-9 w-9 items-center justify-center rounded-[10px] text-black"
                aria-label="View results"
              >
                <FileBarChart size={14} strokeWidth={1.5} />
              </button>
            )}
          </div>
        ) : (
          <div
            className="flex-1 space-y-3 overflow-y-auto px-3 py-4"
            style={{
              scrollbarWidth: "thin",
              scrollbarColor: "rgba(10,10,5,0.08) transparent",
            }}
          >

            {(dayNumber || weekNumber) && (
              <p className="px-1 text-sm font-medium text-[#0B2857]">
                {weekNumber ? `Week ${weekNumber}` : ""}
                {dayNumber ? ` · Day ${dayNumber}` : ""}
              </p>
            )}


            {/* DDS focus */}
{/* <SidebarCard className="p-4">



  
  <MonoLabel>DDS focus</MonoLabel>

  {domainFocus ? (
    <>
      <p className="mb-2 text-[16px] font-['Poppins',sans-serif] font-medium text-black">
        {domainFocus.label}
      </p>

      <p className="text-[16px] font-['Poppins',sans-serif] leading-[1.65] text-black">
        {domainFocus.description}
      </p>
    </>
  ) : (
    <p className="text-[16px] font-['Poppins',sans-serif] leading-[1.65] text-black/50">
      Your focus domain will appear here once selected.
    </p>
  )}
</SidebarCard> */}

<SidebarCard className="p-4">
  <MonoLabel icon={<BarChart3 size={14} strokeWidth={1.8} className="text-[#1473E6]" />}>
    DDS Summary
  </MonoLabel>

  {ddsSummary ? (
    <div className="space-y-3">
      {/* Total DDS */}
      {/* <div className="rounded-[12px] border border-black/[0.06] bg-black/[0.02] p-3">
        <p className="mb-1 text-[13px] font-['Poppins',sans-serif] text-black/50">
          Total DDS Score
        </p>

        <p className="text-[28px] font-['Poppins',sans-serif] font-semibold leading-none text-black">
          {formatScore(ddsSummary.totalScore)}
        </p>
      </div> */}

      {/* Domain scores */}
      <div className="space-y-2">
        <MetricRow
          label="Emotional"
          value={formatScore(ddsSummary.emotionalScore)}
        />

        <MetricRow
          label="Regimen"
          value={formatScore(ddsSummary.regimenScore)}
        />

        <MetricRow
          label="Physician"
          value={formatScore(ddsSummary.physicianScore)}
        />

        <MetricRow
          label="Interpersonal"
          value={formatScore(ddsSummary.interpersonalScore)}
        />
      </div>

      {/* Highest domain */}
      {/* <div className="rounded-[12px] border border-[#3d5a80]/12 bg-[#3d5a80]/[0.03] p-3">
        <p className="mb-1 text-[13px] font-['Poppins',sans-serif] text-black/50">
          Highest Distress Domain
        </p>

        <p className="text-[16px] font-['Poppins',sans-serif] font-medium text-black">
          {ddsSummary.highestDomain}
        </p>
      </div> */}
    </div>
  ) : (
    <div className="rounded-[12px] bg-[#F7FAFD] p-4">
      <p className="text-sm leading-relaxed text-slate-500">
        DDS results will appear here after the DDS-17 survey is completed.
      </p>
    </div>
  )}
</SidebarCard>

            {/* What you're doing */}
            {/* <SidebarCard>
              <MonoLabel>What you&apos;re doing</MonoLabel>
              <p className="font-[Fraunces,Georgia,serif] text-[15px] font-light leading-[1.55] text-black/70">
                You&apos;re using Stampley to reflect on today&apos;s check-in
                before saving it.
              </p>
            </SidebarCard> */}

            {/* Today's status */}
            <SidebarCard className="p-4">
              <MonoLabel icon={<HeartPulse size={14} strokeWidth={1.8} className="text-[#1473E6]" />}>
                Today&apos;s Status
              </MonoLabel>
              <motion.div className="space-y-3">
                <MetricRow label="Stress" value={`${distress}/10`} score={distress} />
                <MetricRow label="Mood" value={`${mood}/10`} score={mood} />
                <MetricRow label="Energy" value={`${energy}/10`} score={energy} />
                <div className="flex items-center justify-between gap-3 pt-1">
                  <span className="text-sm text-slate-500">Focus domain</span>
                  <span className="inline-flex items-center rounded-full bg-[#EAF4FF] px-2.5 py-1 text-xs font-medium text-[#173B7A]">
                    {currentDomain ?? "—"}
                  </span>
                </div>
              </motion.div>
             
            </SidebarCard>
         

            {/* Today’s questions */}
            {/* <SidebarCard className="p-4">
  <MonoLabel>Today&apos;s questions</MonoLabel>

  <div className="space-y-2">
    <p className="text-[16px] font-['Poppins',sans-serif] text-black">
      Expected:{" "}
      <span className="font-medium text-black/70">2–4</span>{" "}
      questions
    </p>

    <p className="text-[16px] font-['Poppins',sans-serif] text-black">
      High stress:{" "}
      <span className="font-medium text-black/70">1–2</span>{" "}
      shorter questions
    </p>

    <p className="mt-3 text-[16px] font-['Poppins',sans-serif] text-black/70">
      Opening → Exploration → Coping → Closure
    </p>
  </div>
</SidebarCard> */}

            {/* Why Stampley asks */}
            {/* <SidebarCard>
              <MonoLabel>Why Stampley asks</MonoLabel>
              <p className="text-[12px] font-light leading-[1.65] text-black">
                Stampley uses your daily check-in to help you reflect on
                today&apos;s stress, mood, energy, and diabetes-related focus
                area. It does not replace medical care or score DDS-17 daily.
              </p>
            </SidebarCard> */}

            {/* Today’s support level */}
            {/* <SidebarCard
              className={
                isHighStress ? "border-black/15 bg-black/[0.04]" : ""
              }
            >
              <MonoLabel>Today&apos;s support level</MonoLabel>
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="font-[Fraunces,Georgia,serif] text-[16px] font-light text-black">
                    {supportLevel.label}
                  </p>
                  <p className="mt-1 text-[12px] font-light leading-[1.55] text-black">
                    {supportLevel.detail}
                  </p>
                </div>
                <div className="shrink-0 rounded-[10px] border border-black/[0.07] bg-white px-2.5 py-2 text-center">
                  <p className="font-[JetBrains_Mono,monospace] text-[8px] uppercase tracking-[0.14em] text-black/30">
                    Stress
                  </p>
                  <p className="text-[12px] font-semibold text-black/70">
                    {distress}/10
                  </p>
                </div>
              </div>
            </SidebarCard> */}

            {/* What shapes your result */}
            {/* <SidebarCard>
              <MonoLabel>What shapes your result</MonoLabel>
              <div className="flex flex-wrap gap-1.5">
                <Chip>stress level</Chip>
                <Chip>mood</Chip>
                <Chip>energy</Chip>
                <Chip>DDS focus domain</Chip>
                <Chip>{reflection?.trim() ? "reflection" : "reflection (none)"}</Chip>
                <Chip>
                  {copingAction?.trim() ? "coping action" : "coping action (none)"}
                </Chip>
                <Chip>chat replies: {Math.max(0, userMessageCount ?? 0)}</Chip>
              </div>
            </SidebarCard> */}

            {/* Progress */}
            {/* <SidebarCard
  className="p-4 font-['Poppins', sans-serif]"
 
>
  <MonoLabel>Progress</MonoLabel>

  <div className="space-y-2">
    <MetricRow
      label="Questions answered"
      value={`${Math.max(0, userMessageCount ?? 0)}`}
    />

    <MetricRow
      label="Current phase"
      value={resolvedPhase}
      accent
    />

    <p className="text-[12px] font-light leading-[1.65] text-black">
      Complete Check-in saves today&apos;s record
    </p>
  </div>
</SidebarCard> */}
         

            {/* Session progress */}
            {/* <SidebarCard className="p-4">
              <MonoLabel>Session progress</MonoLabel>
              <ul className="space-y-2.5">
                {sessionSteps.map((step) => (
                  <li key={step.label} className="flex items-start gap-2.5">
                    <StepIcon status={step.status} />
                    <span
                      className={`text-[12px] font-light leading-[1.5] ${
                        step.status === "active"
                          ? "font-medium text-black"
                          : step.status === "completed"
                            ? "text-black"
                            : "text-black"
                      }`}
                    >
                      {step.label}
                    </span>
                  </li>
                ))}
              </ul>
            </SidebarCard> */}

            {/* Reminder */}
            {/* <SidebarCard className="border-black/15 bg-black/[0.04]">
              <MonoLabel>Reminder</MonoLabel>
              <p className="text-[12px] font-light leading-[1.65] text-black/60">
                Your check-in is saved only after you click{" "}
                <span className="font-medium text-black">
                  Complete Check-in
                </span>
                .
              </p>
            </SidebarCard> */}

            {setActiveView && (
              <button
                type="button"
                onClick={() => setActiveView("results")}
                className="flex w-full cursor-pointer items-center gap-2 rounded-[12px] bg-white px-3 py-3 text-sm text-[#173B7A] shadow-[0_8px_20px_rgba(15,45,80,0.06)] transition hover:bg-[#F7FAFD]"
              >
                <FileBarChart size={15} strokeWidth={1.6} />
                <span className="flex-1 text-left">View results summary</span>
                <ChevronRight size={15} strokeWidth={1.6} className="text-slate-400" />
              </button>
            )}
       
          </div>
        )}


        
      </motion.aside>
    </>
  )
}
function MetricRow({
  label,
  value,
  accent = false,
  score,
}: {
  label: string
  value: string
  accent?: boolean
  score?: number
}) {
  const fill = typeof score === "number" ? Math.min(Math.max(score, 0), 10) * 10 : null

  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between gap-3">
        <span className="text-sm text-slate-500">{label}</span>
        <span
          className={`text-sm ${
            accent ? "font-medium text-[#0B2857]" : "text-[#0B2857]"
          }`}
        >
          {value}
        </span>
      </div>
      {fill !== null ? (
        <div className="h-1.5 overflow-hidden rounded-full bg-[#EAF4FF]">
          <div
            className="h-full rounded-full bg-[#1473E6]"
            style={{ width: `${fill}%` }}
          />
        </div>
      ) : null}
    </div>
  )
}