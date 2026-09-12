"use client"

import React, { useRef, useState, useCallback, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { useRouter } from "next/navigation"
import Image from "next/image"
import {
  Phone,
  Wind,
  BookOpen,
  Loader2,
  Mail,
  Copy,
  Check,
  Activity,
  ShieldCheck,
  ArrowUp,
  ArrowRight,
  Menu,
  SquarePen,
  Trash2,
  Calendar,
} from "lucide-react"
import CheckInStepFrame from "@/components/check-in/CheckInStepFrame"
import { useCheckInStore } from "@/store/checkin-store"
import { useCheckInSubmit } from "@/components/check-in/CheckInSubmitContext"
import { useCheckInSidebarVisibility } from "@/components/check-in/CheckInSidebarVisibility"
import {
  getConversations,
  saveConversations,
  type StoredConversation,
  type StoredMessage,
  type StampleyResponseData,
} from "@/store/conversation-storage"
import {
  StampleySidebar,
  type DdsSummary,
} from "@/components/stampley/stampley-sidebar"
import {
  deriveConversationPhase,
  formatAssistantMessageForHistory,
  hasStampleyFieldText,
  type StampleyHistoryMessage,
} from "@/lib/stampley-prompt"
import {
  backupFromSessionPayload,
  backupUnsavedTranscript,
  clearUnsavedTranscript,
  resendUnsavedTranscriptIfPresent,
  saveStampleySessionWithRetry,
} from "@/lib/stampley-transcript-backup"
import {
  clearActiveChatDraft,
  fetchCheckedInToday,
  readActiveChatDraft,
  writeActiveChatDraft,
  type ActiveChatSnapshot,
} from "@/lib/stampley-active-chat-draft"
type SavedMetrics = {
  distress: number
  mood: number
  energy: number
  domain: string | null
  contextTags: string[]
  reflection: string
  copingAction: string
  weekNumber: number
  dayNumber: number
  subscale: string
}

const DUPLICATE_CHECK_IN_MESSAGE =
  "You have already completed today's check-in."

const materialSpring = {
  type: "spring" as const,
  stiffness: 300,
  damping: 30,
}

const getCurrentTime = () =>
  new Date().toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })

function ensureUniqueTitle(base: string, existing: string[]): string {
  const set = new Set(existing.map((t) => t.toLowerCase()))
  if (!set.has(base.toLowerCase())) return base
  let n = 2
  while (set.has(`${base} (${n})`.toLowerCase())) n++
  return `${base} (${n})`
}

function buildChatSessionSummary(
  snapshot: SavedMetrics,
  userCount: number,
  assistantCount: number
): string {
  const parts = [
    `Stress ${snapshot.distress}/10, mood ${snapshot.mood}/10, energy ${snapshot.energy}/10.`,
    snapshot.domain ? `Focus domain: ${snapshot.domain}.` : null,
    snapshot.reflection?.trim()
      ? `Reflection: ${snapshot.reflection.trim()}`
      : null,
    snapshot.copingAction?.trim()
      ? `Coping action: ${snapshot.copingAction.trim()}`
      : null,
    `Stampley chat: ${userCount} participant reply${userCount === 1 ? "" : "ies"}, ${assistantCount} Stampley turn${assistantCount === 1 ? "" : "s"}.`,
  ].filter(Boolean)
  return parts.join(" ")
}

function buildStampleyHistory(
  msgs: StoredMessage[]
): StampleyHistoryMessage[] {
  return msgs
    .map((m) => {
      if (m.role === "user") {
        const content = m.content?.trim()
        if (!content) return null
        return { role: "user" as const, content }
      }
      const content = formatAssistantMessageForHistory(m.data)
      if (!content) return null
      return { role: "assistant" as const, content }
    })
    .filter((m): m is StampleyHistoryMessage => m !== null)
}

function getRequiredDailyReplies() {
  return 1
}

function hasCompletedDailyReflection(userMessageCount: number) {
  return userMessageCount >= 1
}

export default function StampleySupportPage() {
  const router = useRouter()
  const store = useCheckInStore()
  const { register } = useCheckInSubmit()
  const { setHideOuterSidebar } = useCheckInSidebarVisibility()
  const submitInFlightRef = useRef(false)
  const startChatInFlightRef = useRef(false)
  const skipDraftPersistRef = useRef(true)
  const restoreDraftRanRef = useRef(false)

  const [loading, setLoading] = useState(false)
  const [completingCheckIn, setCompletingCheckIn] = useState(false)
  const [chatStarted, setChatStarted] = useState(false)
  const [error, setError] = useState("")
  const [chatSnapshot, setChatSnapshot] = useState<SavedMetrics | null>(null)

  const [inputText, setInputText] = useState("")
  const [messages, setMessages] = useState<StoredMessage[]>([])
  const [conversations, setConversations] = useState<StoredConversation[]>([])
  const [currentConvId, setCurrentConvId] = useState<string | null>(null)
  const [expandedCard, setExpandedCard] = useState<string | null>(null)
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)
  const [activeView, setActiveView] = useState<"chat" | "results">("chat")
  const [copiedId, setCopiedId] = useState<string | null>(null)
  const [ddsSummary, setDdsSummary] = useState<DdsSummary | null>(null)
  const [showExplanation, setShowExplanation] = useState(false)
  const [needsSafety, setNeedsSafety] = useState(false)
  const [showSupport, setShowSupport] = useState(false)
  const [isAlertDismissed, setIsAlertDismissed] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const isBusy = completingCheckIn || loading
  const chatReady = chatStarted

  const metrics: SavedMetrics = chatSnapshot ?? {
    distress: store.distress ?? 0,
    mood: store.mood ?? 0,
    energy: store.energy ?? 0,
    domain: store.domain,
    contextTags: store.contextTags,
    reflection: store.reflection,
    copingAction: store.copingAction,
    weekNumber: 1,
    dayNumber: 1,
    subscale: "",
  }

  const inChatSafety =
    (chatSnapshot?.distress ?? metrics.distress ?? 0) >= 9

  const weekNumber = chatSnapshot?.weekNumber ?? 1
  const dayNumber = chatSnapshot?.dayNumber ?? 1
  const subscale = chatSnapshot?.subscale ?? ""

  const userMessageCount = messages.filter((m) => m.role === "user").length
  const conversationPhase =
    userMessageCount === 0
      ? ("opening" as const)
      : userMessageCount === 1
        ? ("exploration" as const)
        : userMessageCount === 2
          ? ("coping" as const)
          : ("closure" as const)

  const requiredDailyReplies = getRequiredDailyReplies()

  const dailyReflectionComplete = hasCompletedDailyReflection(userMessageCount)

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages, loading, expandedCard, showSupport, isAlertDismissed])

  useEffect(() => {
    setConversations(getConversations())
  }, [])

  useEffect(() => {
    void (async () => {
      try {
        const res = await fetch("/api/check-in/dds-summary")
        if (!res.ok) return

        const data = await res.json()
        if (data?.ddsSummary) {
          setDdsSummary(data.ddsSummary as DdsSummary)
        }
      } catch {
        // Keep ddsSummary null if fetch fails
      }
    })()
  }, [])

  useEffect(() => {
    void resendUnsavedTranscriptIfPresent()
  }, [])

  useEffect(() => {
    if (restoreDraftRanRef.current) return
    restoreDraftRanRef.current = true

    void (async () => {
      try {
        const checkedInToday = await fetchCheckedInToday()
        if (checkedInToday === true) {
          clearActiveChatDraft()
          return
        }

        const draft = readActiveChatDraft()
        if (!draft) return

        setChatSnapshot(draft.chatSnapshot as SavedMetrics)
        setChatStarted(true)
        setMessages(draft.messages)
        setCurrentConvId(draft.currentConvId)
        setExpandedCard(draft.expandedCard)
        setActiveView(draft.activeView)
        setError("")
      } finally {
        skipDraftPersistRef.current = false
      }
    })()
  }, [])

  useEffect(() => {
    if (skipDraftPersistRef.current) return
    if (!chatStarted || !chatSnapshot) return
    if (messages.length === 0) return

    writeActiveChatDraft({
      chatStarted: true,
      chatSnapshot: chatSnapshot as ActiveChatSnapshot,
      messages,
      currentConvId,
      expandedCard,
      activeView,
      weekNumber: chatSnapshot.weekNumber,
      dayNumber: chatSnapshot.dayNumber,
      subscale: chatSnapshot.subscale,
      timestamp: new Date().toISOString(),
    })
  }, [
    chatStarted,
    chatSnapshot,
    messages,
    currentConvId,
    expandedCard,
    activeView,
  ])

  useEffect(() => {
    if (messages.length === 0) return
    const updatedAt = new Date().toISOString()
    if (currentConvId === null) {
      const firstUser = messages.find((m) => m.role === "user")
      const baseTitle =
        firstUser?.content?.slice(0, 40) ?? "Stampley session"
      const newId = Date.now().toString()
      setConversations((prev) => {
        const title = ensureUniqueTitle(
          baseTitle,
          prev.map((c) => c.title)
        )
        const newConv: StoredConversation = {
          id: newId,
          title,
          updatedAt,
          messages: [...messages],
        }
        const next = [...prev, newConv]
        saveConversations(next)
        return next
      })
      setCurrentConvId(newId)
    } else {
      setConversations((prev) => {
        const next = prev.map((c) =>
          c.id === currentConvId
            ? { ...c, messages: [...messages], updatedAt }
            : c
        )
        saveConversations(next)
        return next
      })
    }
  }, [messages, currentConvId])

  const generateStampleyResponse = useCallback(
    async (history: StampleyHistoryMessage[], m: SavedMetrics) => {
      const res = await fetch("/api/stampley/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          distress: m.distress,
          mood: m.mood,
          energy: m.energy,
          contextTags: m.contextTags,
          reflection: m.reflection,
          copingAction: m.copingAction,
          domain: m.domain,
          subscale: m.subscale,
          dayNumber: m.dayNumber,
          weekNumber: m.weekNumber,
          messageHistory: history,
          conversationPhase: deriveConversationPhase(history),
        }),
      })

      if (!res.ok) throw new Error("Stampley generation failed")

      const data = await res.json()
      if (!data.response) throw new Error("Stampley generation failed")

      return data.response as StampleyResponseData
    },
    []
  )

  const buildSnapshotFromStore = useCallback((): {
    distress: number | undefined
    mood: number | undefined
    energy: number | undefined
    domain: string | null
    contextTags: string[]
    reflection: string
    copingAction: string
  } => {
    return {
      distress: store.distress,
      mood: store.mood,
      energy: store.energy,
      domain: store.domain,
      contextTags: store.contextTags,
      reflection: store.reflection,
      copingAction: store.copingAction,
    }
  }, [store])

  const fetchStudyContext = useCallback(
    async (domain: string | null): Promise<Pick<
      SavedMetrics,
      "weekNumber" | "dayNumber" | "subscale"
    >> => {
      const res = await fetch("/api/check-in/study-context", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ domain }),
      })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(
          typeof data.error === "string"
            ? data.error
            : "Failed to load study context"
        )
      }
      const data = await res.json()
      return {
        weekNumber: Number(data.weekNumber) || 1,
        dayNumber: Number(data.dayNumber) || 1,
        subscale: typeof data.subscale === "string" ? data.subscale : "",
      }
    },
    []
  )

  const handleStartChat = useCallback(async () => {
    if (
      loading ||
      chatStarted ||
      completingCheckIn ||
      startChatInFlightRef.current
    ) {
      return
    }

    startChatInFlightRef.current = true
    setLoading(true)
    setError("")

    const snapshot = buildSnapshotFromStore()
    if (
      snapshot.distress === undefined ||
      snapshot.mood === undefined ||
      snapshot.energy === undefined
    ) {
      setError(
        "Please complete Step 1 and set stress, mood, and energy before starting Stampley."
      )
      startChatInFlightRef.current = false
      setLoading(false)
      return
    }

    if (!snapshot.domain) {
      setError(
        "Please complete Step 4 and select a focus domain before starting Stampley."
      )
      startChatInFlightRef.current = false
      setLoading(false)
      return
    }

    try {
      const studyContext = await fetchStudyContext(snapshot.domain)
      const fullSnapshot: SavedMetrics = {
        distress: snapshot.distress,
        mood: snapshot.mood,
        energy: snapshot.energy,
        domain: snapshot.domain,
        contextTags: snapshot.contextTags,
        reflection: snapshot.reflection,
        copingAction: snapshot.copingAction,
        ...studyContext,
      }
      setChatSnapshot(fullSnapshot)

      const response = await generateStampleyResponse([], fullSnapshot)

      const msgId = Date.now().toString()
      setMessages([
        {
          id: msgId,
          role: "assistant",
          data: response,
          timestamp: getCurrentTime(),
        },
      ])
      setExpandedCard(null)
      setChatStarted(true)
      setActiveView("chat")
    } catch {
      setError("Something went wrong starting Stampley. Please try again.")
      setChatSnapshot(null)
    } finally {
      setLoading(false)
      startChatInFlightRef.current = false
    }
  }, [
    loading,
    chatStarted,
    completingCheckIn,
    buildSnapshotFromStore,
    fetchStudyContext,
    generateStampleyResponse,
  ])

  const handleCompleteCheckIn = useCallback(async () => {
    if (
      completingCheckIn ||
      loading ||
      !chatStarted ||
      !chatSnapshot ||
      submitInFlightRef.current
    ) {
      return
    }

    if (!dailyReflectionComplete) {
      setError(
        "Please send at least one reply in the Stampley chat before completing today's check-in."
      )
      return
    }

    submitInFlightRef.current = true
    setCompletingCheckIn(true)
    setError("")

    try {
      const submitRes = await fetch("/api/check-in/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          distress: chatSnapshot.distress,
          mood: chatSnapshot.mood,
          energy: chatSnapshot.energy,
          contextTags: chatSnapshot.contextTags,
          reflection: chatSnapshot.reflection,
          copingAction: chatSnapshot.copingAction,
          domain: chatSnapshot.domain,
        }),
      })

      if (submitRes.status === 409) {
        setError(DUPLICATE_CHECK_IN_MESSAGE)
        return
      }

      if (!submitRes.ok) throw new Error("Failed to submit check-in")

      const submitData = await submitRes.json()
      const checkInSubmissionId =
        submitData.checkInSubmissionId ?? submitData.id

      if (!checkInSubmissionId) {
        throw new Error("Check-in saved but no submission id returned")
      }

      setNeedsSafety(Boolean(submitData.needsSafetyEscalation))

      const userMessageCount = messages.filter((m) => m.role === "user").length
      const assistantMessageCount = messages.filter(
        (m) => m.role === "assistant"
      ).length

      const summary = buildChatSessionSummary(
        chatSnapshot,
        userMessageCount,
        assistantMessageCount
      )

      const sessionPayload = {
        checkInSubmissionId,
        domain: chatSnapshot.domain,
        stressLevel: chatSnapshot.distress,
        mood: chatSnapshot.mood,
        energy: chatSnapshot.energy,
        userMessageCount,
        assistantMessageCount,
        summary,
        messages,
      }

      const sessionSave = await saveStampleySessionWithRetry(sessionPayload)

      clearActiveChatDraft()

      if (sessionSave.ok) {
        clearUnsavedTranscript()
      } else {
        backupUnsavedTranscript(
          backupFromSessionPayload(sessionPayload, {
            domain: chatSnapshot.domain,
            distress: chatSnapshot.distress,
            mood: chatSnapshot.mood,
            energy: chatSnapshot.energy,
            contextTags: chatSnapshot.contextTags,
            reflection: chatSnapshot.reflection,
            copingAction: chatSnapshot.copingAction,
            weekNumber: chatSnapshot.weekNumber,
            dayNumber: chatSnapshot.dayNumber,
            subscale: chatSnapshot.subscale,
          })
        )
      }

      store.reset()
      router.push("/dashboard")
    } catch {
      setError("Something went wrong saving your check-in. Please try again.")
    } finally {
      setCompletingCheckIn(false)
      submitInFlightRef.current = false
    }
  }, [
    completingCheckIn,
    loading,
    chatStarted,
    chatSnapshot,
    messages,
    store,
    router,
    dailyReflectionComplete,
  ])

  useEffect(() => {
    register(handleStartChat, {
      submitting: completingCheckIn,
      loading,
      checkInSaved: false,
      submitted: chatStarted,
      label: "Start Stampley Chat",
    })
    return () => register(null)
  }, [
    register,
    handleStartChat,
    completingCheckIn,
    loading,
    chatStarted,
  ])

  useEffect(() => {
    setHideOuterSidebar(chatStarted)
    return () => setHideOuterSidebar(false)
  }, [chatStarted, setHideOuterSidebar])

  async function handleSend() {
    if (!inputText.trim() || loading || !chatSnapshot) return

    const text = inputText.trim()
    setInputText("")
    const userMsg: StoredMessage = {
      id: Date.now().toString(),
      role: "user",
      content: text,
      timestamp: getCurrentTime(),
    }
    setMessages((prev) => [...prev, userMsg])
    setLoading(true)
    setExpandedCard(null)

    const history = buildStampleyHistory([...messages, userMsg])

    try {
      const response = await generateStampleyResponse(history, chatSnapshot)
      const msgId = Date.now().toString()
      setMessages((prev) => [
        ...prev,
        {
          id: msgId,
          role: "assistant",
          data: response,
          timestamp: getCurrentTime(),
        },
      ])
      setExpandedCard(null)
    } catch {
      const msgId = Date.now().toString()
      setMessages((prev) => [
        ...prev,
        {
          id: msgId,
          role: "assistant",
          data: {
            validation: "I'm having a little trouble connecting right now.",
            reflection_question: "Would you like to try again?",
            micro_skill: "Take one slow breath — in for 4, hold 4, out for 4.",
            education_chip: "Connectivity issues can happen. Your data is safe.",
          },
          timestamp: getCurrentTime(),
        },
      ])
      setExpandedCard(null)
    } finally {
      setLoading(false)
    }
  }

  function handleNewChat() {
    if (loading) return
    clearActiveChatDraft()
    setMessages([])
    setCurrentConvId(null)
    setExpandedCard(null)
    setInputText("")
    setActiveView("chat")
  }

  function handleSelectConversation(id: string) {
    const conv = conversations.find((c) => c.id === id)
    if (!conv) return
    setMessages(conv.messages)
    setCurrentConvId(conv.id)
    setExpandedCard(null)
    setActiveView("chat")
  }

  function handleCopy(msg: StoredMessage) {
    if (!msg.data) return
    const parts: string[] = []
    if (hasStampleyFieldText(msg.data.greeting)) {
      parts.push(msg.data.greeting!.trim())
    }
    if (hasStampleyFieldText(msg.data.validation)) {
      parts.push(String(msg.data.validation).trim())
    }
    if (hasStampleyFieldText(msg.data.reflection_question)) {
      parts.push(String(msg.data.reflection_question).trim())
    }
    if (hasStampleyFieldText(msg.data.micro_skill)) {
      parts.push(String(msg.data.micro_skill).trim())
    }
    if (hasStampleyFieldText(msg.data.education_chip)) {
      parts.push(String(msg.data.education_chip).trim())
    }
    if (hasStampleyFieldText(msg.data.closure)) {
      parts.push(String(msg.data.closure).trim())
    }
    navigator.clipboard.writeText(parts.join("\n\n"))
    setCopiedId(msg.id)
    setTimeout(() => setCopiedId(null), 2000)
  }

  if (!chatReady) {
    return (
      <CheckInStepFrame
        title="Stampley Support"
        description="Review your check-in metrics and start chatting with Stampley."
      >
        <div className="space-y-5">
          <section className="flex items-center gap-3 rounded-[16px] bg-white px-5 py-4 shadow-[0_10px_30px_rgba(15,45,80,0.07)]">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#EAF4FF] text-[#173B7A]">
              <Activity size={16} strokeWidth={1.6} />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#1473E6]">
                Today&apos;s metrics
              </p>
              <p className="mt-1 text-base text-[#0B2857]">
                Distress {metrics.distress} · Mood {metrics.mood} · Energy{" "}
                {metrics.energy}
                {metrics.domain ? (
                  <span className="ml-1.5 text-sm text-slate-500">
                    · {metrics.domain}
                  </span>
                ) : null}
              </p>
            </div>
          </section>

          {!isBusy && !chatStarted && (
            <section className="space-y-3">
              <div className="rounded-[18px] bg-white px-5 py-6 shadow-[0_10px_30px_rgba(15,45,80,0.07)] sm:px-6">
                <div className="mb-4 flex items-center gap-3">
                  <CardIcon />
                  <div>
                    <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#1473E6]">
                      Ready for Stampley
                    </p>
                    <h2 className="mt-1 text-xl font-medium tracking-tight text-[#0B2857]">
                      Your check-in is ready to discuss.
                    </h2>
                  </div>
                </div>
                <p className="text-sm leading-relaxed text-slate-600 sm:text-base">
                  Review your summary below, then use the button in the dock
                  to start chatting with Stampley. Your check-in will be
                  saved when you tap Complete Check-in at the end.
                </p>
              </div>

              <div className="grid gap-3">
                <ReviewRow
                  label="Context tags"
                  value={
                    store.contextTags.length > 0
                      ? `${store.contextTags.length} selected`
                      : "None"
                  }
                />
                <ReviewRow label="Domain" value={store.domain ?? "—"} />
                {store.reflection && (
                  <ReviewBlock label="Reflection" value={store.reflection} />
                )}
                {store.copingAction && (
                  <ReviewBlock
                    label="Coping action"
                    value={store.copingAction}
                  />
                )}
              </div>
            </section>
          )}

          {isBusy && !chatStarted && <LoadingCard />}

          {error && !chatStarted && <ErrorBanner message={error} />}
        </div>
      </CheckInStepFrame>
    )
  }

  return (
    <div className="relative isolate flex h-full min-h-0 w-full overflow-hidden bg-white font-['Outfit',system-ui,sans-serif]">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 -z-10 overflow-hidden"
      >
        <div className="absolute -right-[160px] -top-[80px] h-[420px] w-[420px] rounded-full bg-[#EAF4FF]/60 blur-[120px]" />
        <div className="absolute -bottom-[120px] -left-[140px] h-[380px] w-[380px] rounded-full bg-[#F1F7FF]/80 blur-[110px]" />
        <div className="absolute bottom-[40px] right-[-80px] h-[260px] w-[260px] rounded-full bg-[#F7FAFD]/90 blur-[90px]" />
      </div>

        <StampleySidebar
          isOpen={isSidebarOpen}
          setIsOpen={setIsSidebarOpen}
          setActiveView={(v) => setActiveView(v as "chat" | "results")}
          currentDomain={metrics.domain}
          distress={metrics.distress}
          mood={metrics.mood}
          energy={metrics.energy}
          chatStarted={chatStarted}
          checkInCompleted={false}
          reflection={metrics.reflection}
          copingAction={metrics.copingAction}
          userMessageCount={userMessageCount}
          conversationPhase={conversationPhase}
          highStress={inChatSafety}
          subscale={subscale}
          dayNumber={dayNumber}
          weekNumber={weekNumber}
          ddsSummary={ddsSummary}
        />

        
<main className="flex h-full min-h-0 flex-1 flex-col overflow-hidden">
            <header className="flex h-[72px] shrink-0 items-center justify-between bg-white px-4 shadow-[0_1px_0_rgba(15,45,80,0.06)]">
            <button
              type="button"
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              className="flex h-9 w-9 items-center justify-center rounded-[10px] text-slate-400 transition hover:bg-slate-50 hover:text-slate-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#173B7A] md:hidden"
              aria-label="Toggle sidebar"
            >
              <Menu size={15} strokeWidth={1.5} />
            </button>

            <motion.div className="hidden min-w-0 md:block">
              <p className="text-base font-medium text-[#0B2857]">
                {subscale
                  ? `Week ${weekNumber} · Day ${dayNumber} · ${subscale}`
                  : "Chat in progress · not saved yet"}
              </p>
              <p className="mt-0.5 text-xs text-slate-500">Stampley Support</p>
            </motion.div>

            <div className="flex items-center gap-0.5 rounded-full bg-[#F7FAFD] p-1">
              {(["chat", "results"] as const).map((view) => (
                <button
                  key={view}
                  type="button"
                  onClick={() => setActiveView(view)}
                  className={`rounded-full px-4 py-1.5 text-[11px] font-medium uppercase tracking-[0.08em] transition ${
                    activeView === view
                      ? "bg-white text-[#173B7A] shadow-[0_4px_12px_rgba(23,59,122,0.10)]"
                      : "text-slate-400"
                  }`}
                >
                  {view === "chat" ? "Chat" : "Results"}
                </button>
              ))}
            </div>

            <div className="flex items-center gap-1">
              {/* <button
                type="button"
                onClick={handleNewChat}
                disabled={loading}
                className="flex h-8 w-8 items-center justify-center rounded-[9px] transition-all duration-200 disabled:opacity-30"
                style={{ color: "rgba(10,10,5,0.35)" }}
                aria-label="Clear chat"
              >
                <Trash2 size={14} strokeWidth={1.5} />
              </button> */}
              {/* <button
                type="button"
                onClick={handleNewChat}
                disabled={loading}
                className="flex h-8 w-8 items-center justify-center rounded-[9px] transition-all duration-200 disabled:opacity-30"
                style={{ color: "rgba(10,10,5,0.35)" }}
                aria-label="New chat"
              >
                <SquarePen size={14} strokeWidth={1.5} />
              </button> */}
            <div className="relative">
              <button
                type="button"
                className="flex h-8 w-8 items-center justify-center rounded-[9px] text-slate-400 transition hover:bg-slate-50 hover:text-slate-700"
                aria-label="Show explanation"
                onClick={() => setShowExplanation((prev: boolean) => !prev)}
              >
                <BookOpen size={14} strokeWidth={1.5} />
              </button>
              {showExplanation && (
                <div className="absolute top-10 right-0 z-10 w-64 rounded-[14px] bg-white px-4 py-3 text-[13px] leading-normal text-slate-600 shadow-[0_10px_30px_rgba(15,45,80,0.12)]">
                  <span>
                    <strong className="text-[#0B2857]">What&apos;s this?</strong>
                    <br />
                    The chat is where you can interact with Stampley to reflect on your check-in. Your responses help tailor the conversation and support you receive.
                  </span>
                  <button
                    className="absolute top-1 right-2 rounded px-1 py-0.5 text-[11px] text-slate-400 hover:bg-slate-50"
                    onClick={() => setShowExplanation((prev: boolean) => !prev)}
                    aria-label="Close explanation"
                  >
                    ×
                  </button>
                </div>
              )}
            </div>
       
            </div>
          </header>

          <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
          <AnimatePresence mode="wait">
            {activeView === "chat" && (
              <motion.div
                key="chat"
                initial={{ opacity: 0, x: 16 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -16 }}
                transition={{ duration: 0.2 }}
                className="flex min-h-0 flex-1 flex-col overflow-hidden"
              >
                <div
              className="min-h-0 flex-1 overflow-y-auto"
                  style={{
                    scrollbarWidth: "thin",
                    scrollbarColor: "rgba(15,45,80,0.12) transparent",
                  }}
                >
                  <div className="mx-auto flex w-full max-w-[960px] flex-col gap-6 px-4 pb-8 pt-6 md:px-8">
                    

                    {inChatSafety && (
                      <SafetyCard
                        showSupport={showSupport}
                        setShowSupport={setShowSupport}
                        isAlertDismissed={isAlertDismissed}
                        setIsAlertDismissed={setIsAlertDismissed}
                      />
                    )}

                    {messages.map((msg) => (
                      <ChatMessage
                        key={msg.id}
                        msg={msg}
                        expandedCard={expandedCard}
                        setExpandedCard={setExpandedCard}
                        copiedId={copiedId}
                        onCopy={handleCopy}
                      />
                    ))}

                    {loading && (
                      <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="flex items-center gap-3"
                      >
                        <div className="flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-full bg-white shadow-[0_6px_16px_rgba(15,45,80,0.08)]">
                          <Image
                            src="/images/stampleyLogo.png"
                            alt="Stampley"
                            width={18}
                            height={18}
                            className="object-contain"
                          />
                        </div>
                        <div className="flex items-center gap-2 text-sm text-slate-500">
                          <span className="flex items-center gap-1" aria-hidden="true">
                            <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-[#1473E6] [animation-delay:-0.2s]" />
                            <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-[#1473E6] [animation-delay:-0.1s]" />
                            <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-[#1473E6]" />
                          </span>
                          <span>Stampley is thinking…</span>
                        </div>
                      </motion.div>
                    )}

                    <div ref={messagesEndRef} className="h-4 shrink-0" />

                    {error && (
                      <ErrorBanner message={error} />
                    )}
                  </div>
                </div>

                <ChatInputDock
                  inputText={inputText}
                  setInputText={setInputText}
                  onSend={handleSend}
                  onComplete={handleCompleteCheckIn}
                  loading={loading}
                  completingCheckIn={completingCheckIn}
                  canComplete={dailyReflectionComplete}
                  metrics={metrics}
                  requiredDailyReplies={requiredDailyReplies}
                  userMessageCount={userMessageCount}
                />
              </motion.div>
            )}

            {activeView === "results" && (
             <motion.div
             key="results"
             initial={{ opacity: 0, y: 10 }}
             animate={{ opacity: 1, y: 0 }}
             exit={{ opacity: 0, y: -10 }}
             transition={{ duration: 0.24, ease: "easeOut" }}
             className="flex min-h-0 flex-1 flex-col overflow-y-auto"
             
             >
             
               <div className="mx-auto w-full max-w-[960px] space-y-5 px-4 py-8 md:px-8">
                 <div className="space-y-2">
                   <h2 className="text-2xl font-light tracking-tight text-[#0B2857]">
                     Today&apos;s check-in
                   </h2>
             
             
               <p className="text-[15px] leading-relaxed text-slate-600">
                 Review your responses below. When you&apos;re ready, return to the
                 chat to complete today&apos;s check-in.
               </p>
             </div>
             
             <div className="space-y-3">
               {[
                 { label: "Distress", value: `${metrics.distress} / 10` },
                 { label: "Mood", value: `${metrics.mood} / 10` },
                 { label: "Energy", value: `${metrics.energy} / 10` },
                 { label: "Focus domain", value: metrics.domain ?? "—" },
                 {
                   label: "Context tags",
                   value:
                     metrics.contextTags.length > 0
                       ? `${metrics.contextTags.length} selected`
                       : "None selected",
                 },
                 {
                   label: "Reflection",
                   value: metrics.reflection || "No reflection added",
                 },
                 {
                   label: "Coping action",
                   value: metrics.copingAction || "No coping action added",
                 },
               ].map((item) => (
                 <div
                   key={item.label}
                   className="rounded-[18px] bg-white px-5 py-4 shadow-[0_10px_30px_rgba(15,45,80,0.07)]"
                 >
                   <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-[#1473E6]">
                     {item.label}
                   </p>
             
                   <p className="text-base leading-relaxed text-[#0B2857]">
                     {item.value}
                   </p>
                 </div>
               ))}
             </div>
             
             <button
               type="button"
               onClick={() => setActiveView("chat")}
               className="mt-2 flex h-12 w-full items-center justify-center rounded-[12px] bg-[#173B7A] px-5 text-sm font-normal text-white shadow-[0_8px_20px_rgba(23,59,122,0.14)] transition hover:bg-[#122E60] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#173B7A]"
             >
               Return to Chat to Complete Check-in
             </button>
             
             
               </div>
             </motion.div>
             
            )}
          </AnimatePresence>
          </div>
        </main>
      </div>
  )
}

function CardIcon() {
  return (
    <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#EAF4FF] text-[#173B7A]">
      <ShieldCheck size={16} strokeWidth={1.6} />
    </div>
  )
}

function ReviewRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between rounded-[16px] bg-white px-5 py-4 shadow-[0_10px_30px_rgba(15,45,80,0.07)]">
      <p className="text-sm text-slate-500">{label}</p>
      <p className="text-right text-sm font-medium text-[#0B2857]">{value}</p>
    </div>
  )
}

function ReviewBlock({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[16px] bg-white px-5 py-4 shadow-[0_10px_30px_rgba(15,45,80,0.07)]">
      <p className="mb-2 text-sm text-slate-500">{label}</p>
      <p className="line-clamp-4 text-sm leading-relaxed text-[#0B2857]">
        {value}
      </p>
    </div>
  )
}

function LoadingCard() {
  return (
    <motion.section
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex items-center gap-3.5 rounded-[16px] bg-white px-5 py-6 shadow-[0_10px_30px_rgba(15,45,80,0.07)]"
    >
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#F7FAFD]">
        <Image
          src="/images/stampleyLogo.png"
          alt="Stampley"
          width={22}
          height={22}
          className="object-contain opacity-50 grayscale"
        />
      </div>
      <div>
        <div className="flex items-center gap-2 text-sm text-slate-600">
          <Loader2 size={15} className="animate-spin text-[#173B7A]" />
          <span>Stampley is preparing your response…</span>
        </div>
        <p className="mt-1 text-xs text-slate-400">
          This usually takes a few seconds.
        </p>
      </div>
    </motion.section>
  )
}

function ErrorBanner({ message }: { message: string }) {
  const isDuplicate = message === DUPLICATE_CHECK_IN_MESSAGE

  return (
    <motion.section
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className={`rounded-[14px] px-4 py-3 text-sm leading-relaxed ${
        isDuplicate
          ? "bg-amber-50 text-amber-900"
          : "bg-red-50 text-red-700"
      }`}
    >
      {message}
    </motion.section>
  )
}

function MetricsBar({ metrics }: { metrics: SavedMetrics }) {
  return (
    <div className="flex flex-col gap-3 rounded-[18px] bg-white px-5 py-4 shadow-[0_10px_30px_rgba(15,45,80,0.07)] sm:flex-row sm:items-center sm:justify-between">
      <div className="flex min-w-0 items-center gap-3">
        <motion.div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#EAF4FF] text-[#173B7A]">
          <Activity size={16} strokeWidth={1.5} />
        </motion.div>
        <div className="min-w-0">
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#1473E6]">
            Today&apos;s metrics
          </p>
          <p className="mt-1 text-sm text-[#0B2857] sm:text-base">
            Distress {metrics.distress} · Mood {metrics.mood} · Energy{" "}
            {metrics.energy}
            {metrics.domain ? (
              <span className="text-slate-500"> · {metrics.domain}</span>
            ) : null}
          </p>
        </div>
      </div>
      <div className="flex shrink-0 items-center gap-2 text-sm text-slate-500">
        <Calendar size={15} strokeWidth={1.6} className="text-[#1473E6]" />
        <span>
          Week {metrics.weekNumber} · Day {metrics.dayNumber}
        </span>
      </div>
    </div>
  )
}

function ReflectionSummaryCard({
  metrics,
  userMessageCount,
}: {
  metrics: SavedMetrics
  userMessageCount: number
}) {
  const reflectionPreview = metrics.reflection?.trim()
  const copingPreview = metrics.copingAction?.trim()

  return (
    <motion.div
      className="rounded-[16px] bg-white px-3.5 py-3 shadow-[0_10px_30px_rgba(15,45,80,0.07)]"
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={materialSpring}
    >
      <p className="mb-2 font-['Poppins', sans-serif] text-[8px] uppercase tracking-[0.18em] text-black/35">
        Today&apos;s reflection summary
      </p>
      <p className="text-[12px] font-light text-black/55">
        Stress {metrics.distress}/10 · Mood {metrics.mood}/10 · Energy{" "}
        {metrics.energy}
        {metrics.domain ? (
          <span className="text-black"> · {metrics.domain}</span>
        ) : null}
      </p>
      {reflectionPreview ? (
        <p className="mt-1.5 line-clamp-2 text-[12px] font-light leading-[1.55] text-black/50">
          {reflectionPreview}
        </p>
      ) : null}
      {copingPreview ? (
        <p className="mt-1 line-clamp-1 text-[11px] font-light text-black">
          Coping: {copingPreview}
        </p>
      ) : null}
      {userMessageCount > 0 ? (
        <p className="mt-2 font-['Poppins', sans-serif] text-[8px] uppercase tracking-[0.12em] text-black/30">
          {userMessageCount} chat{" "}
          {userMessageCount === 1 ? "reply" : "replies"} with Stampley
        </p>
      ) : null}
    </motion.div>
  )
}

function ChatInputDock({
  inputText,
  setInputText,
  onSend,
  onComplete,
  loading,
  completingCheckIn,
  canComplete,
  metrics,
  userMessageCount,
  requiredDailyReplies,
}: {
  inputText: string
  setInputText: (v: string) => void
  onSend: () => void
  onComplete: () => void
  loading: boolean
  completingCheckIn: boolean
  canComplete: boolean
  metrics: SavedMetrics
  userMessageCount: number
  requiredDailyReplies: number
}) {
  const inputDisabled = loading || completingCheckIn
  const inputHintActive = !inputText.trim() && !inputDisabled

  return (
    <div className="w-full shrink-0 bg-white/95 px-4 pb-5 pt-3 md:px-8 md:pb-6">
      <div className="mx-auto w-full max-w-[760px] lg:mr-60">
        <div
          className={`min-h-[58px] rounded-full bg-white shadow-[0_10px_30px_rgba(15,45,80,0.07)] transition ${
            inputHintActive
              ? "ring-1 ring-[#1473E6]/30"
              : "focus-within:ring-1 focus-within:ring-[#173B7A]/30"
          }`}
        >
        <div className="flex min-h-[58px] items-center gap-3 px-4 py-2">
  <input
    type="text"
    value={inputText}
    onChange={(e) => setInputText(e.target.value)}
    onKeyDown={(e) => e.key === "Enter" && onSend()}
    placeholder="Reply to Stampley..."
    disabled={inputDisabled}
    aria-label="Reply to Stampley"
    className={`h-10 flex-1 bg-transparent text-base text-[#0B2857] caret-[#1473E6] outline-none transition disabled:opacity-40 ${
      inputHintActive
        ? "placeholder:animate-pulse placeholder:text-slate-400"
        : "placeholder:text-slate-400"
    }`}
  />

  <button
    type="button"
    onClick={onSend}
    disabled={!inputText.trim() || inputDisabled}
    className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full transition ${
      inputText.trim() && !inputDisabled
        ? "bg-[#1473E6] text-white hover:bg-[#1266cc] active:scale-[0.98]"
        : "cursor-not-allowed bg-[#F7FAFD] text-slate-300"
    }`}
    aria-label="Send message"
  >
    {loading ? (
      <Loader2 size={14} className="animate-spin" />
    ) : (
      <ArrowUp size={16} strokeWidth={2.4} />
    )}
  </button>
</div>
        </div>
        <p className="mt-3 text-center text-sm text-slate-500">
          {!canComplete
            ? "Reply once to unlock Complete Check-In. You can keep chatting after that."
            : "You can complete today\u2019s check-in when you\u2019re ready\u2014or keep chatting with Stampley."}
        </p>
        <button
          type="button"
          onClick={onComplete}
          disabled={inputDisabled || !canComplete}
          className={`mt-3 flex min-h-12 w-full items-center justify-center gap-2 rounded-full px-6 text-sm font-normal transition ${
            inputDisabled || !canComplete
              ? "cursor-not-allowed bg-[#F1F7FF] text-slate-400"
              : "bg-[#173B7A] text-white shadow-[0_8px_20px_rgba(23,59,122,0.14)] hover:bg-[#122E60]"
          }`}
        >
          {completingCheckIn ? (
            <>
              <Loader2 size={15} className="animate-spin" />
              Completing check-in…
            </>
          ) : (
            <>
              Complete Check-In
              {canComplete && !inputDisabled ? (
                <ArrowRight size={15} strokeWidth={1.8} />
              ) : null}
            </>
          )}
        </button>
  
     
  
        <p className="mt-4 hidden select-none text-center text-[10px] uppercase tracking-[0.16em] text-slate-400 md:block">
          Stampley may make mistakes · not a substitute for professional care
        </p>
      </div>
    </div>
  )
}

function ChatMessage({
  msg,
  expandedCard,
  setExpandedCard,
  copiedId,
  onCopy,
}: {
  msg: StoredMessage
  expandedCard: string | null
  setExpandedCard: (v: string | null) => void
  copiedId: string | null
  onCopy: (msg: StoredMessage) => void
}) {
  if (msg.role === "user") {
    return (
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={materialSpring}
        className="flex w-full justify-end"
      >
        <div className="flex max-w-[70%] flex-col items-end gap-1">
          <div className="rounded-[18px] bg-[#1473E6] px-5 py-3 text-[16px] leading-relaxed text-white shadow-[0_8px_20px_rgba(20,115,230,0.16)]">
            {msg.content}
          </div>
          <span className="px-2 text-[11px] text-slate-400">
            {msg.timestamp}
          </span>
        </div>
      </motion.div>
    )
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={materialSpring}
      className="flex w-full max-w-[760px] gap-3"
    >
      <motion.div className="mt-1 flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-full bg-white shadow-[0_6px_16px_rgba(15,45,80,0.08)]">
        <Image
          src="/images/stampleyLogo.png"
          alt="Stampley"
          width={30}
          height={30}
          className="object-contain"
        />
      </motion.div>

      <div className="min-w-0 flex-1 space-y-3">
        <div className="flex items-center gap-2">
          <span className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[#173B7A]">
            Stampley
          </span>
          <span className="text-[11px] text-slate-400">
            {msg.timestamp}
          </span>
        </div>

        {msg.data && (
          <>
            {(() => {
              const data = msg.data
              const showSkill = hasStampleyFieldText(data.micro_skill)
              const showInsight = hasStampleyFieldText(data.education_chip)
              const hasBody =
                hasStampleyFieldText(data.greeting) ||
                hasStampleyFieldText(data.validation) ||
                hasStampleyFieldText(data.reflection_question) ||
                hasStampleyFieldText(data.closure)

              return (
                <>
                  {hasBody ? (
                    <div className="space-y-3 rounded-[18px] bg-[#F4F8FD] px-5 py-4 text-[16px] leading-relaxed text-[#0B2857] sm:text-[17px]">
                      {hasStampleyFieldText(data.greeting) ? (
                        <p>{data.greeting}</p>
                      ) : null}
                      {hasStampleyFieldText(data.validation) ? (
                        <p>
                          {data.validation}
                        </p>
                      ) : null}
                      {hasStampleyFieldText(data.reflection_question) ? (
                        <p className="text-[17px] leading-relaxed text-[#173B7A] sm:text-[18px]">
                          {data.reflection_question}
                        </p>
                      ) : null}
                      {hasStampleyFieldText(data.closure) ? (
                        <p className="text-[15px] leading-relaxed text-slate-600">
                          {data.closure}
                        </p>
                      ) : null}
                    </div>
                  ) : null}

                  {(showSkill || showInsight) && (
                    <div className="flex items-center gap-1.5">
                      {showSkill ? (
                        <ChipButton
                          active={expandedCard === `${msg.id}-skill`}
                          onClick={() =>
                            setExpandedCard(
                              expandedCard === `${msg.id}-skill`
                                ? null
                                : `${msg.id}-skill`
                            )
                          }
                          icon={<Wind size={11} strokeWidth={2} />}
                          label="Skill"
                        />
                      ) : null}
                      {showInsight ? (
                        <ChipButton
                          active={expandedCard === `${msg.id}-edu`}
                          onClick={() =>
                            setExpandedCard(
                              expandedCard === `${msg.id}-edu`
                                ? null
                                : `${msg.id}-edu`
                            )
                          }
                          icon={<BookOpen size={11} strokeWidth={2} />}
                          label="Insight"
                        />
                      ) : null}
                      <div className="flex-1" />
                      <button
                        type="button"
                        onClick={() => onCopy(msg)}
                        className="rounded-full p-1.5 text-slate-400 transition hover:text-[#173B7A]"
                        aria-label="Copy response"
                      >
                        {copiedId === msg.id ? (
                          <Check
                            size={12}
                            strokeWidth={2}
                            className="text-emerald-600"
                          />
                        ) : (
                          <Copy size={12} strokeWidth={1.5} />
                        )}
                      </button>
                    </div>
                  )}

                  {!showSkill && !showInsight ? (
                    <div className="flex justify-end">
                      <button
                        type="button"
                        onClick={() => onCopy(msg)}
                        className="rounded-full p-1.5 text-slate-400 transition hover:text-[#173B7A]"
                        aria-label="Copy response"
                      >
                        {copiedId === msg.id ? (
                          <Check
                            size={12}
                            strokeWidth={2}
                            className="text-emerald-600"
                          />
                        ) : (
                          <Copy size={12} strokeWidth={1.5} />
                        )}
                      </button>
                    </div>
                  ) : null}

                  <AnimatePresence mode="wait">
                    {showSkill && expandedCard === `${msg.id}-skill` ? (
                      <ExpandableCard
                        key="skill"
                        icon={<Wind size={13} strokeWidth={1.8} />}
                        title="Micro-skill"
                        value={data.micro_skill ?? ""}
                      />
                    ) : null}
                    {showInsight && expandedCard === `${msg.id}-edu` ? (
                      <ExpandableCard
                        key="edu"
                        icon={<BookOpen size={13} strokeWidth={1.8} />}
                        title="Insight"
                        value={data.education_chip ?? ""}
                      />
                    ) : null}
                  </AnimatePresence>
                </>
              )
            })()}
          </>
        )}
      </div>
    </motion.div>
  )
}

function ChipButton({
  active,
  onClick,
  icon,
  label,
}: {
  active: boolean
  onClick: () => void
  icon: React.ReactNode
  label: string
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex cursor-pointer items-center gap-1.5 rounded-full px-3 py-1.5 text-[11px] uppercase tracking-[0.1em] transition ${
        active
          ? "bg-[#EAF4FF] font-semibold text-[#173B7A]"
          : "bg-white text-slate-500 shadow-[0_4px_12px_rgba(15,45,80,0.06)]"
      }`}
    >
      {icon}
      {label}
    </button>
  )
}

function ExpandableCard({
  icon,
  title,
  value,
}: {
  icon: React.ReactNode
  title: string
  value: string
}) {
  if (!hasStampleyFieldText(value)) return null

  return (
    <motion.div
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: "auto" }}
      exit={{ opacity: 0, height: 0 }}
      className="overflow-hidden"
    >
      <div className="mt-1 rounded-[14px] bg-white p-4 shadow-[0_8px_20px_rgba(15,45,80,0.06)]">
        <div className="mb-2 flex items-center gap-2 text-[#173B7A]">
          {icon}
          <span className="text-[11px] font-semibold uppercase tracking-[0.14em]">
            {title}
          </span>
        </div>
        <p className="text-base leading-relaxed text-[#0B2857]">
          {value}
        </p>
      </div>
    </motion.div>
  )
}

function SafetyCard({
  showSupport,
  setShowSupport,
  isAlertDismissed,
  setIsAlertDismissed,
}: {
  showSupport: boolean
  setShowSupport: (value: boolean) => void
  isAlertDismissed: boolean
  setIsAlertDismissed: (value: boolean) => void
}) {
  return (
    <AnimatePresence>
      {!isAlertDismissed && (
        <motion.section
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          exit={{ opacity: 0, height: 0 }}
          className="relative flex items-start gap-4 overflow-hidden rounded-[16px] bg-amber-50 p-5 shadow-[0_10px_30px_rgba(15,45,80,0.06)]"
        >
          <button
            type="button"
            aria-label="Dismiss"
            onClick={() => setIsAlertDismissed(true)}
            className="absolute right-3 top-3 cursor-pointer rounded-full p-1.5 text-black/30 transition-all hover:bg-black/[0.05] hover:text-black/55"
          >
            <svg width="14" height="14" viewBox="0 0 20 20" fill="none">
              <path
                d="M6 6l8 8M6 14L14 6"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
              />
            </svg>
          </button>

          <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#EAF4FF] text-[#173B7A]">
            <Phone size={16} strokeWidth={1.5} />
          </div>

          <div className="min-w-0 flex-1 pr-6">
            <h3 className="mb-1 text-lg font-medium text-[#0B2857]">
              Support is available
            </h3>
            <p className="mb-4 text-[15px] leading-relaxed text-slate-600">
              Your stress level is very high today. You don&apos;t have to carry
              this alone. If you need immediate support, resources are available
              right now.
            </p>

            <button
              type="button"
              onClick={() => setShowSupport(!showSupport)}
              className="rounded-[10px] bg-[#EAF4FF] px-4 py-2 text-xs font-medium uppercase tracking-[0.12em] text-[#173B7A] transition hover:bg-[#F1F7FF] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#173B7A]"
            >
              {showSupport ? "Hide Resources" : "View Resources"}
            </button>

            <AnimatePresence>
              {showSupport && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="mt-4 overflow-hidden"
                >
                  <motion.div className="space-y-2.5 rounded-[14px] bg-white p-4">
                    <a
                      href="sms:741741&body=HOME"
                      className="flex items-center gap-2 rounded-[10px] bg-[#EAF4FF] px-4 py-2.5 text-[12.5px] font-medium text-[#173B7A] transition hover:bg-[#F1F7FF]"
                    >
                      Crisis Text Line — Text HOME to 741741
                    </a>
                    <a
                      href="tel:18006624357"
                      className="flex items-center gap-2 rounded-[10px] bg-[#EAF4FF] px-4 py-2.5 text-[12.5px] font-medium text-[#173B7A] transition hover:bg-[#F1F7FF]"
                    >
                      <Phone size={14} strokeWidth={1.5} />
                      SAMHSA Helpline — 1-800-662-4357
                    </a>
                    <a
                      href="mailto:pcrg@umb.edu"
                      className="flex items-center gap-2 rounded-[10px] bg-[#EAF4FF] px-4 py-2.5 text-[12.5px] font-medium text-[#173B7A] transition hover:bg-[#F1F7FF]"
                    >
                      <Mail size={14} strokeWidth={1.5} />
                      pcrg@umb.edu
                    </a>
                  </motion.div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </motion.section>
      )}
    </AnimatePresence>
  )
}
