"use client"

import type React from "react"
import { useEffect, useMemo, useRef, useState } from "react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Search, Send, ChevronLeft, MoreHorizontal, Users, Clock, CheckCheck, Loader2 } from "lucide-react"
import { cn } from "@/lib/utils"
import axios from "axios"

import { PageHeader } from "@/components/page-header"

type Category = "all" | "co" | "requests" | "general"

type Thread = {
  id: string
  name: string
  preview: string
  unread: number
  category: Exclude<Category, "all">
  participants: string[]
  lastActive: string
  isOnline?: boolean
}

type Message = {
  id: string
  from: "you" | "them"
  text: string
  when: string
  timestamp: number
  delivered?: boolean
  seen?: boolean
}

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || ""

// ---------- Mock Initial Database ----------
const DEFAULT_THREADS: Thread[] = [
  {
    id: "th-1",
    name: "Sarah Chen • Horizon Ventures",
    preview: "Milestone 2 payout is pending review, I've asked Liam for eyes too.",
    unread: 1,
    category: "requests",
    participants: ["Sarah Chen", "You"],
    lastActive: "10m",
    isOnline: true,
  },
  {
    id: "th-2",
    name: "Liam Vance • Vance Capital",
    preview: "Checked your alpha build. Impressive work on peer-to-peer sync.",
    unread: 0,
    category: "requests",
    participants: ["Liam Vance", "You"],
    lastActive: "1h",
    isOnline: false,
  },
  {
    id: "th-3",
    name: "Alex Rivera",
    preview: "Just pushed the local-first SQLite migrations. Ready to merge?",
    unread: 0,
    category: "co",
    participants: ["Alex Rivera", "You"],
    lastActive: "2m",
    isOnline: true,
  },
  {
    id: "th-4",
    name: "Cohort Support",
    preview: "Welcome to the cohort! Let us know if you need pitch decks reviewed.",
    unread: 0,
    category: "general",
    participants: ["Support Admin", "You"],
    lastActive: "1d",
    isOnline: false,
  },
]

const DEFAULT_MESSAGES: Record<string, Message[]> = {
  "th-1": [
    {
      id: "m-1-1",
      from: "them",
      text: "Hi! I saw you submitted Milestone 2 details for the sync engine.",
      when: "1h ago",
      timestamp: Date.now() - 3600000,
      seen: true,
      delivered: true,
    },
    {
      id: "m-1-2",
      from: "you",
      text: "Yes, the prototype is live and synchronizing local nodes successfully.",
      when: "45m ago",
      timestamp: Date.now() - 2700000,
      seen: true,
      delivered: true,
    },
    {
      id: "m-1-3",
      from: "them",
      text: "Milestone 2 payout is pending review, I've asked Liam for eyes too.",
      when: "10m ago",
      timestamp: Date.now() - 600000,
      seen: false,
      delivered: true,
    },
  ],
  "th-2": [
    {
      id: "m-2-1",
      from: "them",
      text: "Do you have the link to your test suite repository?",
      when: "3h ago",
      timestamp: Date.now() - 10800000,
      seen: true,
      delivered: true,
    },
    {
      id: "m-2-2",
      from: "you",
      text: "Sure, check https://github.com/something/tests",
      when: "2h ago",
      timestamp: Date.now() - 7200000,
      seen: true,
      delivered: true,
    },
    {
      id: "m-2-3",
      from: "them",
      text: "Checked your alpha build. Impressive work on peer-to-peer sync.",
      when: "1h ago",
      timestamp: Date.now() - 3600000,
      seen: true,
      delivered: true,
    },
  ],
  "th-3": [
    {
      id: "m-3-1",
      from: "you",
      text: "Hey Alex, are we good with the CRDT merge?",
      when: "15m ago",
      timestamp: Date.now() - 900000,
      seen: true,
      delivered: true,
    },
    {
      id: "m-3-2",
      from: "them",
      text: "Just pushed the local-first SQLite migrations. Ready to merge?",
      when: "2m ago",
      timestamp: Date.now() - 120000,
      seen: true,
      delivered: true,
    },
  ],
  "th-4": [
    {
      id: "m-4-1",
      from: "them",
      text: "Welcome to the cohort! Let us know if you need pitch decks reviewed.",
      when: "1d ago",
      timestamp: Date.now() - 86400000,
      seen: true,
      delivered: true,
    },
  ],
}

function initials(label: string) {
  const words = label.replace(/•.*/g, "").trim().split(/\s+/)
  const first = words[0]?.[0] ?? "M"
  const last = words[1]?.[0] ?? ""
  return (first + last).toUpperCase()
}

function formatTime(when: string): string {
  if (when === "now") return "now"
  const match = when.match(/(\d+)([hdm])/)
  if (!match) return when

  const [, num, unit] = match
  const number = parseInt(num)

  switch (unit) {
    case "m":
      return number === 1 ? "1 min" : `${number} mins`
    case "h":
      return number === 1 ? "1 hour" : `${number} hours`
    case "d":
      return number === 1 ? "yesterday" : `${number} days ago`
    default:
      return when
  }
}

// Stored Database Helpers
function getStoredThreads(): Thread[] {
  if (typeof window === "undefined") return DEFAULT_THREADS
  const saved = localStorage.getItem("founder_chat_threads")
  return saved ? JSON.parse(saved) : DEFAULT_THREADS
}

// Stored Messages Helper
function getStoredMessages(): Record<string, Message[]> {
  if (typeof window === "undefined") return DEFAULT_MESSAGES
  const saved = localStorage.getItem("founder_chat_messages")
  return saved ? JSON.parse(saved) : DEFAULT_MESSAGES
}

function setStoredThreads(threads: Thread[]) {
  if (typeof window !== "undefined") {
    localStorage.setItem("founder_chat_threads", JSON.stringify(threads))
  }
}

function setStoredMessages(messages: Record<string, Message[]>) {
  if (typeof window !== "undefined") {
    localStorage.setItem("founder_chat_messages", JSON.stringify(messages))
  }
}

export default function FounderChatsPage() {
  const [category, setCategory] = useState<Category>("all")
  const [query, setQuery] = useState("")
  const [activeId, setActiveId] = useState<string | null>(null)
  const [text, setText] = useState("")
  const [isTyping, setIsTyping] = useState(false)
  const [threads, setThreads] = useState<Thread[]>([])
  const [messagesByThread, setMessagesByThread] = useState<Record<string, Message[]>>({})
  const [loadedThreads, setLoadedThreads] = useState<Set<string>>(new Set())
  const [isLoadingThreads, setIsLoadingThreads] = useState(true)
  const [isLoadingMessages, setIsLoadingMessages] = useState(false)

  // Fetch threads on load
  useEffect(() => {
    fetchThreads()
  }, [])

  // API Fetch Threads with Local Fallback
  const fetchThreads = async () => {
    try {
      setIsLoadingThreads(true)
      const response = await axios.get(`${API_BASE_URL}/founder/threads`, {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      })
      setThreads(response.data)
      setStoredThreads(response.data)
    } catch (error) {
      console.warn("fetchThreads failed, loading local cached threads", error)
      const cached = getStoredThreads()
      setThreads(cached)
    } finally {
      setIsLoadingThreads(false)
    }
  }

  // API Fetch Messages with Local Fallback
  const fetchMessages = async (threadId: string) => {
    try {
      setIsLoadingMessages(true)
      const response = await axios.get(`${API_BASE_URL}/founder/threads/${threadId}/messages`, {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      })
      setMessagesByThread((prev) => ({
        ...prev,
        [threadId]: response.data,
      }))
      setLoadedThreads((prev) => new Set([...prev, threadId]))
    } catch (error) {
      console.warn("fetchMessages failed, loading local cached messages for", threadId, error)
      const cachedAll = getStoredMessages()
      const cachedMsgs = cachedAll[threadId] ?? []
      setMessagesByThread((prev) => ({
        ...prev,
        [threadId]: cachedMsgs,
      }))
      setLoadedThreads((prev) => new Set([...prev, threadId]))
    } finally {
      setIsLoadingMessages(false)
    }
  }

  // API Send Message with Local Mock Simulation
  const sendMessage = async (threadId: string, messageText: string) => {
    try {
      const response = await axios.post(
        `${API_BASE_URL}/founder/threads/${threadId}/messages`,
        { text: messageText },
        { headers: { Authorization: `Bearer ${localStorage.getItem("token")}` } }
      )
      return response.data
    } catch (error) {
      console.warn("sendMessage failed, simulating locally in mock DB", error)
      const newMsg: Message = {
        id: `m-mock-${Date.now()}`,
        from: "you",
        text: messageText,
        when: "now",
        timestamp: Date.now(),
        seen: true,
        delivered: true,
      }

      // Save to local storage
      const cachedAll = getStoredMessages()
      const cachedMsgs = cachedAll[threadId] ?? []
      const updatedMsgs = [...cachedMsgs, newMsg]
      cachedAll[threadId] = updatedMsgs
      setStoredMessages(cachedAll)

      // Update thread preview
      const threadsList = getStoredThreads()
      const updatedThreads = threadsList.map((t) => {
        if (t.id === threadId) {
          return {
            ...t,
            preview: messageText,
            lastActive: "now",
          }
        }
        return t
      })
      setStoredThreads(updatedThreads)

      // Trigger mock reply response simulator after 1 second of typing
      setTimeout(() => {
        setIsTyping(true)
      }, 800)

      setTimeout(() => {
        setIsTyping(false)
        let replyText = "Got it! Let me review the spec details."
        if (threadId === "th-1") {
          replyText = "Excellent. I will review the alpha sync build and update the milestone status to 'Released' once Liam signs off."
        } else if (threadId === "th-2") {
          replyText = "Great. Let's schedule a call this Friday to walk through the escrow disbursements."
        } else if (threadId === "th-3") {
          replyText = "Awesome! Pushed migrations are merged. Let's test the UI sync integration."
        } else if (threadId === "th-4") {
          replyText = "Got it. We will forward this request to the cohort program advisors."
        }

        const replyMsg: Message = {
          id: `m-reply-${Date.now()}`,
          from: "them",
          text: replyText,
          when: "now",
          timestamp: Date.now(),
          seen: false,
          delivered: true,
        }

        const currentAll = getStoredMessages()
        currentAll[threadId] = [...(currentAll[threadId] ?? []), replyMsg]
        setStoredMessages(currentAll)

        const currentThreadsList = getStoredThreads()
        const currentUpdatedThreads = currentThreadsList.map((t) => {
          if (t.id === threadId) {
            return {
              ...t,
              preview: replyText,
              unread: t.unread + 1,
              lastActive: "now",
            }
          }
          return t
        })
        setStoredThreads(currentUpdatedThreads)

        // Sync view state
        setMessagesByThread((prev) => ({
          ...prev,
          [threadId]: currentAll[threadId],
        }))
        setThreads(currentUpdatedThreads)
      }, 2500)

      return newMsg
    }
  }

  // API Mark Messages Read with Local Mock fallback
  const markMessagesAsRead = async (threadId: string, messageIds: string[]) => {
    try {
      await axios.patch(
        `${API_BASE_URL}/founder/threads/${threadId}/messages/read`,
        { messageIds },
        { headers: { Authorization: `Bearer ${localStorage.getItem("token")}` } }
      )
    } catch (error) {
      console.warn("markMessagesAsRead failed, marking locally", error)
      const cachedAll = getStoredMessages()
      if (cachedAll[threadId]) {
        cachedAll[threadId] = cachedAll[threadId].map((m) => {
          if (messageIds.includes(m.id)) {
            return { ...m, seen: true }
          }
          return m
        })
        setStoredMessages(cachedAll)
      }

      const threadsList = getStoredThreads()
      setStoredThreads(threadsList.map((t) => (t.id === threadId ? { ...t, unread: 0 } : t)))
    }
  }

  // Computed conversations
  const filtered = useMemo(() => {
    let pool = threads
    if (category !== "all") {
      pool = threads.filter((t) => t.category === (category as Exclude<Category, "all">))
    }
    if (!query.trim()) return pool
    const q = query.toLowerCase()
    return pool.filter((t) => t.name.toLowerCase().includes(q) || t.preview.toLowerCase().includes(q))
  }, [category, query, threads])

  useEffect(() => {
    setActiveId((prev) => {
      if (prev && filtered.some((t) => t.id === prev)) return prev
      return filtered[0]?.id ?? null
    })
  }, [filtered])

  // Load messages on active selection
  useEffect(() => {
    if (activeId && !loadedThreads.has(activeId)) {
      fetchMessages(activeId)
    }
  }, [activeId, loadedThreads])

  const activeThread = useMemo(
    () => filtered.find((t) => t.id === activeId) ?? threads.find((t) => t.id === activeId) ?? null,
    [filtered, threads, activeId]
  )
  const msgs = useMemo(
    () => (activeThread ? messagesByThread[activeThread.id] ?? [] : []),
    [activeThread, messagesByThread]
  )

  const listRef = useRef<HTMLDivElement | null>(null)
  const inputRef = useRef<HTMLTextAreaElement | null>(null)

  useEffect(() => {
    if (listRef.current) {
      listRef.current.scrollTo({ top: listRef.current.scrollHeight, behavior: "smooth" })
    }
  }, [activeId, msgs.length])

  useEffect(() => {
    if (activeThread && inputRef.current) {
      inputRef.current.focus()
    }
  }, [activeThread])

  // Clear unreads
  useEffect(() => {
    if (activeThread && msgs.length > 0) {
      const unreadMessages = msgs.filter((m) => m.from === "them" && !m.seen).map((m) => m.id)

      if (unreadMessages.length > 0) {
        markMessagesAsRead(activeThread.id, unreadMessages)

        setMessagesByThread((prev) => {
          const next = { ...prev }
          const messages = next[activeThread.id] || []
          next[activeThread.id] = messages.map((msg) =>
            unreadMessages.includes(msg.id) ? { ...msg, seen: true } : msg
          )
          return next
        })

        setThreads((prev) => prev.map((t) => (t.id === activeThread.id ? { ...t, unread: 0 } : t)))
      }
    }
  }, [activeThread, msgs])

  const showOnlyListOnMobile = !activeThread
  const showOnlyChatOnMobile = !!activeThread

  async function onSend(e: React.FormEvent) {
    e.preventDefault()
    if (!activeThread || text.trim().length === 0) return

    const messageText = text.trim()
    const tempId = `temp_${Date.now()}`

    const optimisticMsg: Message = {
      id: tempId,
      from: "you",
      text: messageText,
      when: "now",
      timestamp: Date.now(),
      delivered: false,
      seen: false,
    }

    setMessagesByThread((prev) => {
      const next = { ...prev }
      next[activeThread.id] = [...(next[activeThread.id] ?? []), optimisticMsg]
      return next
    })
    setText("")

    try {
      const serverMessage = await sendMessage(activeThread.id, messageText)

      setMessagesByThread((prev) => {
        const next = { ...prev }
        const messages = next[activeThread.id] || []
        next[activeThread.id] = messages.map((msg) => (msg.id === tempId ? serverMessage : msg))
        return next
      })

      fetchThreads()
    } catch {
      setMessagesByThread((prev) => {
        const next = { ...prev }
        next[activeThread.id] = (next[activeThread.id] ?? []).filter((m) => m.id !== tempId)
        return next
      })
      console.error("Failed to send message")
    }
  }

  return (
    <div className="mx-auto w-full max-w-5xl space-y-6">
      {/* Sleek inline header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2">
        <div className="flex flex-col gap-1">
          <h2 className="text-2xl font-bold tracking-tight text-white font-outfit">Chats & Syncs</h2>
          <p className="text-white/45 text-xs font-sans font-medium">Coordinate in real-time with team co-founders, advisory boards, and review committee investors.</p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => {
              if (confirm("Reset chat history to initial cohort defaults?")) {
                localStorage.removeItem("founder_chat_threads")
                localStorage.removeItem("founder_chat_messages")
                fetchThreads()
                setActiveId(null)
                setMessagesByThread({})
                setLoadedThreads(new Set())
              }
            }}
            className="border border-white/10 text-white/80 hover:bg-white/5 rounded-xl text-xs h-9 px-4 bg-transparent cursor-pointer"
          >
            Reset Chat Data
          </Button>
        </div>
      </div>

      <div className="grid lg:grid-cols-[340px_minmax(0,1fr)] gap-4 lg:gap-6">
        {/* Left Side: Threads panel */}
        <section className={cn("lg:block", showOnlyChatOnMobile ? "hidden" : "block")}>
          <div className="rounded-xl border border-white/5 bg-black/20 p-4 flex flex-col h-[600px] lg:h-[700px]">
            <div className="flex flex-col gap-2 mb-4">
              <div className="relative">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-white/30" />
                <Input
                  placeholder="Search chats..."
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  className="h-9 w-full pl-9 bg-black/40 border-white/5 text-white placeholder:text-white/30 rounded-lg focus-visible:ring-brand-accent focus-visible:border-brand-accent/20"
                />
              </div>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as Category)}
                className="h-9 rounded-lg bg-black/40 border border-white/5 px-3 text-xs text-white focus:outline-none focus:ring-1 focus:ring-brand-accent cursor-pointer"
                aria-label="Filter conversations"
              >
                <option value="all" className="bg-[#0c0d0f]">All Conversations</option>
                <option value="co" className="bg-[#0c0d0f]">Co‑founders</option>
                <option value="requests" className="bg-[#0c0d0f]">Review Requests</option>
                <option value="general" className="bg-[#0c0d0f]">Cohort General</option>
              </select>
            </div>

            <div className="flex-1 overflow-y-auto space-y-1 pr-1" style={{ scrollbarWidth: "thin" }}>
              {isLoadingThreads && (
                <div className="p-8 text-center flex flex-col items-center justify-center gap-2">
                  <Loader2 className="h-6 w-6 animate-spin text-brand-accent" />
                  <span className="text-xs text-white/40">Loading workspace threads...</span>
                </div>
              )}
              {!isLoadingThreads && filtered.length === 0 && (
                <div className="p-8 text-center">
                  <div className="text-xs text-white/40">No conversations found</div>
                </div>
              )}
              {!isLoadingThreads &&
                filtered.map((t) => {
                  const active = t.id === activeId
                  return (
                    <button
                      key={t.id}
                      onClick={() => setActiveId(t.id)}
                      className={cn(
                        "w-full rounded-lg px-3 py-3 text-left transition-all duration-300 relative group flex gap-3 items-start border border-transparent",
                        active
                          ? "bg-white/[0.04] border-white/5"
                          : "hover:bg-white/[0.01]"
                      )}
                      aria-pressed={active}
                    >
                      {active && (
                        <div className="absolute left-0 top-3 bottom-3 w-[2px] bg-brand-accent rounded-r-full" />
                      )}
                      <div className="relative shrink-0">
                        <div
                          className={cn(
                            "grid size-10 place-items-center rounded-full text-xs font-semibold tracking-wider font-mono",
                            active
                              ? "bg-brand-accent/10 text-brand-accent"
                              : "bg-white/5 text-white/70 group-hover:bg-white/10"
                          )}
                        >
                          {initials(t.name)}
                        </div>
                        {t.isOnline && (
                          <div className="absolute -bottom-0.5 -right-0.5 size-2.5 rounded-full bg-brand-accent border border-black" />
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between mb-0.5">
                          <span className="truncate text-sm font-semibold text-white">{t.name}</span>
                          <span className="text-[10px] text-white/30 font-mono shrink-0">
                            {formatTime(t.lastActive)}
                          </span>
                        </div>
                        <div className="truncate text-xs text-white/40 mb-1 group-hover:text-white/60">
                          {t.preview}
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] text-white/35 uppercase tracking-widest font-mono">
                            #{t.category}
                          </span>
                          {t.unread > 0 && (
                            <span className="flex items-center justify-center h-4.5 min-w-[18px] px-1.5 text-[9px] font-bold bg-brand-accent text-black rounded-full">
                              {t.unread}
                            </span>
                          )}
                        </div>
                      </div>
                    </button>
                  )
                })}
            </div>
          </div>
        </section>

        {/* Right Side: Message pane */}
        <section className={cn("lg:block", showOnlyListOnMobile ? "hidden" : "block")}>
          <div className="rounded-xl border border-white/5 bg-black/20 overflow-hidden flex flex-col h-[600px] lg:h-[700px]">
            {/* Thread Header */}
            <div className="flex h-14 items-center gap-3 px-4 border-b border-white/5 bg-black/25">
              <button
                className="lg:hidden inline-flex size-8 items-center justify-center rounded-full hover:bg-white/5 transition-colors text-white/70"
                onClick={() => setActiveId(null)}
                aria-label="Back to conversations"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              {activeThread ? (
                <>
                  <div className="relative">
                    <div className="grid size-9 place-items-center rounded-full bg-white/5 text-white/70 text-xs font-semibold tracking-wider font-mono">
                      {initials(activeThread.name)}
                    </div>
                    {activeThread.isOnline && (
                      <div className="absolute -bottom-0.5 -right-0.5 size-2.5 rounded-full bg-brand-accent border border-black" />
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-base font-semibold text-white leading-tight">
                      {activeThread.name}
                    </div>
                    <div className="flex items-center gap-1.5 text-[10px] text-white/40 mt-0.5">
                      {activeThread.isOnline ? (
                        <>
                          <span className="size-1.5 rounded-full bg-brand-accent" />
                          <span>Connected</span>
                        </>
                      ) : (
                        <>
                          <Clock className="h-3 w-3" />
                          <span>Seen {formatTime(activeThread.lastActive)}</span>
                        </>
                      )}
                    </div>
                  </div>
                  <button
                    className="inline-flex size-8 items-center justify-center rounded-full hover:bg-white/5 text-white/40 hover:text-white transition-colors"
                    aria-label="More options"
                  >
                    <MoreHorizontal className="h-4 w-4" />
                  </button>
                </>
              ) : (
                <div className="text-xs text-white/40 uppercase tracking-widest font-mono">Select Thread</div>
              )}
            </div>

            {/* Message Thread Scroll view */}
            <div
              ref={listRef}
              className="flex-1 overflow-y-auto px-4 py-6 space-y-4.5 scroll-smooth bg-[#0a0a0c]/60"
              style={{ scrollbarWidth: "thin" }}
            >
              {!activeThread && (
                <div className="grid h-full place-items-center text-center">
                  <div className="space-y-2">
                    <div className="text-sm text-white/50 font-medium">Select a thread to sync</div>
                    <div className="text-xs text-white/30 max-w-xs mx-auto">
                      Choose from co-founders or reviewing investment firms to start writing messages.
                    </div>
                  </div>
                </div>
              )}
              {activeThread && isLoadingMessages && (
                <div className="grid h-full place-items-center">
                  <div className="flex flex-col items-center gap-2 text-xs text-white/40">
                    <Loader2 className="h-5 w-5 animate-spin text-violet-400" />
                    <span>Loading message log...</span>
                  </div>
                </div>
              )}
              {activeThread &&
                !isLoadingMessages &&
                msgs.map((m, i) => {
                  const isYou = m.from === "you"
                  const showDeliveryStatus = isYou && i === msgs.length - 1
                  return (
                    <div key={m.id} className={cn("flex w-full", isYou ? "justify-end" : "justify-start")}>
                      <div className="max-w-[85%] sm:max-w-[70%] space-y-1.5">
                        <div
                          className={cn(
                            "rounded-xl px-4 py-2.5 text-xs sm:text-sm leading-relaxed border",
                            isYou
                              ? "bg-brand-accent/5 text-white border-brand-accent/15 rounded-br-none"
                              : "bg-white/[0.02] text-white/80 border-white/5 rounded-bl-none"
                          )}
                        >
                          <div className="whitespace-pre-wrap break-words">{m.text}</div>
                        </div>
                        <div
                          className={cn(
                            "flex items-center gap-1.5 text-[10px] font-mono text-white/40",
                            isYou ? "justify-end" : "justify-start"
                          )}
                        >
                          <span>{formatTime(m.when)}</span>
                          {showDeliveryStatus && (
                            <span className="flex items-center">
                           {m.seen ? (
                                <CheckCheck className="h-3.5 w-3.5 text-brand-accent" />
                              ) : (
                                <CheckCheck className="h-3.5 w-3.5 text-white/30" />
                              )}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  )
                })}

              {/* Simulated typing bubble */}
              {isTyping && activeThread && (
                <div className="flex justify-start">
                  <div className="bg-zinc-900/90 border border-white/10 rounded-2xl rounded-bl-none px-4 py-3">
                    <div className="flex space-x-1.5 items-center h-3">
                      <div className="w-1.5 h-1.5 bg-violet-400 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
                      <div className="w-1.5 h-1.5 bg-violet-400 rounded-full animate-bounce [animation-delay:-0.15s]"></div>
                      <div className="w-1.5 h-1.5 bg-violet-400 rounded-full animate-bounce"></div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Input Form area */}
            <div className="p-3 border-t border-white/5 bg-black/25">
              <form onSubmit={onSend} className="flex items-end gap-2">
                <textarea
                  ref={inputRef}
                  placeholder={activeThread ? "Write message..." : "Select a thread to message"}
                  disabled={!activeThread}
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  className="w-full min-h-[42px] max-h-[120px] h-[42px] py-3 px-4 pr-4 rounded-xl bg-black/50 border border-white/10 text-white placeholder:text-white/30 focus:outline-none focus:ring-1 focus:ring-brand-accent focus:border-brand-accent/20 resize-none overflow-y-auto text-sm leading-relaxed"
                  rows={1}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault()
                      onSend(e)
                    }
                  }}
                />
                <Button
                  type="submit"
                  size="icon"
                  disabled={!activeThread || text.trim().length === 0}
                  className={cn(
                    "size-10 rounded-full transition-all flex-shrink-0 cursor-pointer",
                    text.trim().length > 0
                      ? "bg-white text-black hover:bg-brand-accent hover:text-black"
                      : "bg-white/5 text-white/35 cursor-not-allowed border border-white/5"
                  )}
                  aria-label="Send message"
                >
                  <Send className="h-4 w-4" />
                </Button>
              </form>
            </div>
          </div>
        </section>
      </div>
    </div>
  )
}