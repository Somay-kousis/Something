"use client"

import type React from "react"
import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { motion, AnimatePresence } from "framer-motion"
import {
  Download,
  Loader2,
  Cpu,
  Users,
  ShieldAlert,
  RefreshCw,
  ArrowRight,
  ShieldCheck,
  AlertTriangle,
  FileText,
  Paperclip,
  ArrowUp,
  BrainCircuit,
  Scale,
  FileSearch,
  Check
} from "lucide-react"
import MutinyResults from "@/components/mutiny-results"
import { queryMutiny, type MutinyResponse, type MutinyMode } from "@/lib/mock-mutiny"
import { cn } from "@/lib/utils"

interface AuditPoint {
  label: string
  text: string
}

function parseRationale(rationaleText: string) {
  if (!rationaleText) return { title: "", points: [] }
  const lines = rationaleText.split("\n")
  const title = lines[0]?.replace(/:$/, "").trim() || ""
  const points: AuditPoint[] = []

  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim()
    if (line.startsWith("•") || line.startsWith("-")) {
      const content = line.substring(1).trim()
      const colonIdx = content.indexOf(":")
      if (colonIdx !== -1) {
        const label = content.substring(0, colonIdx).trim()
        const text = content.substring(colonIdx + 1).trim()
        points.push({ label, text })
      } else {
        points.push({ label: "Analysis Point", text: content })
      }
    }
  }

  return { title, points }
}

const ACCENTS = {
  emerald: {
    name: "Console Sage",
    text: "text-[#8EA38E]",
    bg: "bg-[#8EA38E]",
    border: "border-[#8EA38E]/25",
    glow: "",
    btnBg: "bg-[#8EA38E] text-black hover:bg-[#8EA38E]/90",
    ring: "focus-within:ring-1 focus-within:ring-[#8EA38E]/20 focus-within:border-[#8EA38E]/30",
    activePill: "bg-[#8EA38E]/10 text-[#8EA38E] border-[#8EA38E]/30",
    color: "#8EA38E",
  },
  indigo: {
    name: "Tactile Chalk",
    text: "text-[#E2DFD5]",
    bg: "bg-[#E2DFD5]",
    border: "border-[#E2DFD5]/25",
    glow: "",
    btnBg: "bg-[#E2DFD5] text-black hover:bg-[#E2DFD5]/90",
    ring: "focus-within:ring-1 focus-within:ring-[#E2DFD5]/20 focus-within:border-[#E2DFD5]/30",
    activePill: "bg-[#E2DFD5]/10 text-[#E2DFD5] border-[#E2DFD5]/30",
    color: "#E2DFD5",
  },
  violet: {
    name: "Anodized Steel",
    text: "text-[#8293A4]",
    bg: "bg-[#8293A4]",
    border: "border-[#8293A4]/25",
    glow: "",
    btnBg: "bg-[#8293A4] text-black hover:bg-[#8293A4]/90",
    ring: "focus-within:ring-1 focus-within:ring-[#8293A4]/20 focus-within:border-[#8293A4]/30",
    activePill: "bg-[#8293A4]/10 text-[#8293A4] border-[#8293A4]/30",
    color: "#8293A4",
  },
  amber: {
    name: "Earthy Copper",
    text: "text-[#C88E72]",
    bg: "bg-[#C88E72]",
    border: "border-[#C88E72]/25",
    glow: "",
    btnBg: "bg-[#C88E72] text-black hover:bg-[#C88E72]/90",
    ring: "focus-within:ring-1 focus-within:ring-[#C88E72]/20 focus-within:border-[#C88E72]/30",
    activePill: "bg-[#C88E72]/10 text-[#C88E72] border-[#C88E72]/30",
    color: "#C88E72",
  },
}

interface ChatMessage {
  id: string
  role: "user" | "assistant"
  content: string
  timestamp: string
  mode?: MutinyMode
  results?: MutinyResponse | null
  isSimulating?: boolean
  scanLines?: string[]
}

export default function FounderMutinyPage() {
  const [concept, setConcept] = useState("")
  const [mode, setMode] = useState<MutinyMode>("support")
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [isSimulatingGlobal, setIsSimulatingGlobal] = useState(false)
  const [userName, setUserName] = useState("Alex Rivera")
  const [accentKey, setAccentKey] = useState<keyof typeof ACCENTS>("emerald")
  const [expandedThoughts, setExpandedThoughts] = useState<{ [key: string]: boolean }>({})

  const feedEndRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const activeAccent = ACCENTS[accentKey]

  const SIMULATION_STEPS = [
    "Initializing conviction core weights...",
    "Querying WIPO & VC cohort indexes...",
    "Assessing database replication thresholds & CRDT limits...",
    "Analyzing doubt friction coefficients...",
    "Synthesizing belief resonance profiles..."
  ]

  const PRESET_PROMPTS = [
    {
      title: "Stress-Test Sync Node",
      prompt: "A peer-to-peer sync engine using SQLite and local CRDT conflict resolution for instant startup without database latency...",
      icon: BrainCircuit,
      color: "text-amber-400 border-white/5 bg-white/[0.01] hover:border-white/10"
    },
    {
      title: "Verify Wallet Pooling",
      prompt: "A multi-sig transaction escrow system allowing developers to pool community stakes for project milestones with automated release rules...",
      icon: Scale,
      color: "text-indigo-400 border-white/5 bg-white/[0.01] hover:border-white/10"
    },
    {
      title: "Patent Registry Overlaps",
      prompt: "Audit patent claims and VC cohort registrations matching key-value storage syncing systems and distributed peer discovery protocols...",
      icon: FileSearch,
      color: "text-pink-400 border-white/5 bg-white/[0.01] hover:border-white/10"
    },
  ]

  useEffect(() => {
    if (typeof window !== "undefined") {
      const storedProfile = localStorage.getItem("founder_profile_data")
      if (storedProfile) {
        try {
          const parsed = JSON.parse(storedProfile)
          if (parsed.name) setUserName(parsed.name)
        } catch (e) {
          console.error(e)
        }
      }

      const storedAccent = localStorage.getItem("founder_settings_accent") as keyof typeof ACCENTS
      if (storedAccent && ACCENTS[storedAccent]) {
        setAccentKey(storedAccent)
      }
    }
  }, [])

  useEffect(() => {
    feedEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto"
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 180)}px`
    }
  }, [concept])

  const toggleThoughts = (id: string) => {
    setExpandedThoughts((prev) => ({ ...prev, [id]: !prev[id] }))
  }

  const handleStartSimulation = async (presetText?: string) => {
    const textToSubmit = presetText || concept
    if (!textToSubmit.trim() || isSimulatingGlobal) return

    setIsSimulatingGlobal(true)
    setConcept("")

    const timeString = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })

    const userMsg: ChatMessage = {
      id: `user-${Date.now()}`,
      role: "user",
      content: textToSubmit,
      timestamp: timeString,
    }

    const assistantId = `assistant-${Date.now()}`
    const assistantMsg: ChatMessage = {
      id: assistantId,
      role: "assistant",
      content: "",
      mode: mode,
      isSimulating: true,
      scanLines: [],
      timestamp: timeString,
    }

    setMessages((prev) => [...prev, userMsg, assistantMsg])

    for (let i = 0; i < SIMULATION_STEPS.length; i++) {
      await new Promise((resolve) => setTimeout(resolve, 200))
      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === assistantId
            ? { ...msg, scanLines: [...(msg.scanLines || []), SIMULATION_STEPS[i]] }
            : msg
        )
      )
    }

    try {
      const res = await queryMutiny(textToSubmit, mode)
      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === assistantId
            ? {
                ...msg,
                isSimulating: false,
                results: res,
              }
            : msg
        )
      )
    } catch (err) {
      console.error(err)
      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === assistantId
            ? {
                ...msg,
                isSimulating: false,
                results: { rationale: "Simulation connection error." },
              }
            : msg
        )
      )
    } finally {
      setIsSimulatingGlobal(false)
    }
  }

  const getInitials = (n: string) => {
    return n
      .split(" ")
      .map((w) => w[0])
      .join("")
      .slice(0, 2)
      .toUpperCase()
  }

  return (
    <div className="mx-auto w-full max-w-3xl space-y-6 pb-24 relative min-h-[calc(100vh-9rem)] flex flex-col justify-between select-none">
      
      {/* Mesh glows in background disabled for flat layout */}

      <div className="flex-1 space-y-6 z-10">
        
        {/* Minimal header title */}
        <div className="flex flex-col gap-1 pb-1">
          <h2 className="text-xl font-medium tracking-tight text-white font-outfit">Nothing & Something</h2>
          <p className="text-white/35 text-[11px] font-sans font-medium tracking-wide">Stress-test milestone and conviction nodes against doubt critique rulesets.</p>
        </div>

        {/* MESSAGES LOG VIEWPORT */}
        {messages.length === 0 ? (
          
          /* Centered Claude Welcome Screen */
          <div className="space-y-10 py-16 max-w-xl mx-auto text-center">
            <div className="flex flex-col items-center justify-center space-y-3">
              <div className="size-12 rounded-full border border-white/5 bg-white/[0.01] flex items-center justify-center">
                <BrainCircuit className="h-5 w-5 text-white/30" />
              </div>
              <div className="space-y-1">
                <h3 className="text-lg font-medium font-outfit text-white tracking-tight">How can I challenge your idea?</h3>
                <p className="text-white/30 text-xs max-w-sm mx-auto leading-relaxed">
                  Type a concept to audit its co-founder matches, investor alignments, or potential friction points.
                </p>
              </div>
            </div>

            {/* Premium, borderless preset cards */}
            <div className="grid gap-3 sm:grid-cols-3">
              {PRESET_PROMPTS.map((item, i) => {
                const PromptIcon = item.icon
                return (
                  <motion.button
                    key={i}
                    onClick={() => handleStartSimulation(item.prompt)}
                    whileHover={{ scale: 1.01, y: -1 }}
                    whileTap={{ scale: 0.99 }}
                    className={cn(
                      "flex flex-col items-start p-4 rounded-xl border text-left transition-all w-full cursor-pointer bg-black/20 border-white/5 hover:border-white/10 hover:bg-white/[0.01] group",
                      item.color
                    )}
                  >
                    <PromptIcon className="h-4 w-4 mb-2 opacity-50 group-hover:opacity-100 transition" />
                    <span className="text-[10px] font-bold font-mono uppercase tracking-wider text-white/80">{item.title}</span>
                    <p className="text-[9.5px] text-white/35 mt-1 leading-normal font-sans line-clamp-3">
                      {item.prompt}
                    </p>
                  </motion.button>
                )
              })}
            </div>
          </div>
        ) : (
          
          /* Conversation Thread Feed */
          <div className="space-y-8 select-text">
            <AnimatePresence initial={false}>
              {messages.map((msg) => {
                const isUser = msg.role === "user"
                const isExpanded = !!expandedThoughts[msg.id]

                return (
                  <motion.div
                    key={msg.id}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.25, ease: "easeOut" }}
                    className={cn("flex gap-4 w-full", isUser ? "justify-end" : "justify-start")}
                  >
                    {!isUser && (
                      <div className="size-7 rounded-full border border-white/5 bg-white/[0.02] flex items-center justify-center shrink-0 mt-1">
                        <BrainCircuit className="h-3.5 w-3.5 text-white/30" />
                      </div>
                    )}

                    <div className={cn("max-w-[85%] space-y-4", isUser ? "text-right" : "text-left")}>
                      
                      {isUser ? (
                        /* User Chat Bubble */
                        <div className="inline-block rounded-xl bg-white/[0.02] border border-white/5 px-4 py-2.5 text-xs text-white/80 font-sans leading-relaxed text-left">
                          {msg.content}
                        </div>
                      ) : (
                        
                        /* Assistant Dialogue Response */
                        <div className="w-full space-y-4">
                          
                          {/* Case A: Simulating Loader */}
                          {msg.isSimulating ? (
                            <div className="w-full rounded-lg border border-white/5 bg-black/20 p-4 font-mono text-[10px] space-y-3">
                              <div className="flex items-center gap-2 text-white/40">
                                <Loader2 className="h-3 w-3 animate-spin" />
                                <span className="text-[9.5px] uppercase tracking-wider font-bold">Thinking...</span>
                              </div>
                              <div className="space-y-1 pl-2 border-l border-white/5 text-white/25">
                                {msg.scanLines?.map((line, idx) => (
                                  <div key={idx} className="break-all">&gt; {line}</div>
                                ))}
                              </div>
                            </div>
                          ) : (
                            
                            /* Case B: Redesigned prose-first text outputs */
                            <div className="space-y-4 w-full">
                              
                              {/* Collapsible Thinking Process Toggle (DeepSeek style) */}
                              <div className="border-b border-white/5 pb-2.5">
                                <button
                                  onClick={() => toggleThoughts(msg.id)}
                                  className="flex items-center gap-1.5 text-[10px] font-mono text-white/35 hover:text-white/50 transition cursor-pointer select-none bg-transparent border-0 p-0"
                                >
                                  <div className={cn("size-1.5 rounded-full", isExpanded ? "bg-white/30" : "bg-emerald-500")} />
                                  <span>{isExpanded ? "Hide thinking process" : "Show thinking process"}</span>
                                </button>
                                
                                {isExpanded && msg.scanLines && (
                                  <div className="mt-2.5 p-3 bg-zinc-950/40 rounded-lg border border-white/5 font-mono text-[10px] text-white/30 space-y-1.5">
                                    {msg.scanLines.map((line, idx) => (
                                      <div key={idx} className="break-all">&gt; {line}</div>
                                    ))}
                                  </div>
                                )}
                              </div>

                              {/* Prose-based Duality response */}
                              {msg.results && (
                                <div className="text-[12.5px] sm:text-[13px] text-white/80 leading-relaxed font-sans space-y-4">
                                  {msg.mode === "critic" ? (
                                    <div className="space-y-3">
                                      <div className="text-[10px] font-bold font-mono uppercase tracking-widest text-amber-400/90 flex items-center gap-1.5">
                                        <ShieldAlert className="h-3.5 w-3.5" /> Critique Analysis (Nothing)
                                      </div>
                                      <div className="pl-3.5 border-l border-amber-500/10 space-y-3">
                                        {parseRationale(msg.results.rationale || "").points.map((pt, idx) => (
                                          <div key={idx} className="space-y-0.5">
                                            <span className="font-semibold text-white/90 text-xs">{pt.label}</span>
                                            <p className="text-white/45 font-light leading-relaxed">{pt.text}</p>
                                          </div>
                                        ))}
                                      </div>
                                    </div>
                                  ) : (
                                    <div className="space-y-3">
                                      <div className="text-[10px] font-bold font-mono uppercase tracking-widest text-emerald-400/90 flex items-center gap-1.5">
                                        <ShieldCheck className="h-3.5 w-3.5" /> Resonance Framework (Something)
                                      </div>
                                      <div className="pl-3.5 border-l border-emerald-500/10 space-y-3">
                                        {parseRationale(msg.results.rationale || "").points.map((pt, idx) => (
                                          <div key={idx} className="space-y-0.5">
                                            <span className="font-semibold text-white/90 text-xs">{pt.label}</span>
                                            <p className="text-white/45 font-light leading-relaxed">{pt.text}</p>
                                          </div>
                                        ))}
                                      </div>
                                    </div>
                                  )}
                                </div>
                              )}

                              {/* Minimal inline match tables */}
                              {msg.results && (
                                <MutinyResults data={msg.results} accentKey={accentKey} />
                              )}

                            </div>
                          )}

                        </div>
                      )}

                    </div>

                    {isUser && (
                      <div className="size-7 rounded-full border border-white/10 shrink-0 bg-white/5 flex items-center justify-center text-[10px] font-mono font-bold text-white/40 shadow mt-1">
                        {getInitials(userName)}
                      </div>
                    )}
                  </motion.div>
                )
              })}
            </AnimatePresence>
            <div ref={feedEndRef} />
          </div>
        )}

      </div>

      {/* FLOAT CHAT INPUT CAPSULE */}
      <div className="max-w-2xl w-full mx-auto pt-4 z-20">
        
        {/* Sleek, capsule-embedded text composition box */}
        <div className={cn(
          "bg-black/40 border border-white/5 rounded-xl p-2.5 flex flex-col gap-1.5 transition focus-within:border-white/10",
          activeAccent.ring
        )}>
          <Textarea
            ref={textareaRef}
            rows={1}
            value={concept}
            onChange={(e) => setConcept(e.target.value)}
            placeholder="Ask a question or test an overlap spec..."
            className="w-full bg-transparent border-0 text-white placeholder:text-white/20 text-xs sm:text-[13px] leading-relaxed resize-none p-1.5 focus:outline-none focus:ring-0 focus-visible:ring-0 focus-visible:ring-offset-0 min-h-[44px] shadow-none"
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault()
                handleStartSimulation()
              }
            }}
          />
          
          <div className="flex items-center justify-between px-1.5 pt-1.5 border-t border-white/5">
            <div className="flex items-center gap-2">
              <button
                type="button"
                className="p-1 rounded text-white/30 hover:text-white/50 transition cursor-pointer bg-transparent border-0"
                title="Attach asset file"
                onClick={() => alert("Simulated asset upload connected.")}
              >
                <Paperclip className="h-3.5 w-3.5" />
              </button>

              {/* Minimal inline model/objective drop selection */}
              <select
                value={mode}
                onChange={(e) => setMode(e.target.value as MutinyMode)}
                className="bg-black/30 border border-white/5 rounded-md text-[10px] px-2.5 py-1 text-white/50 hover:text-white/80 focus:text-white/80 focus:outline-none focus:border-white/10 font-sans tracking-wide cursor-pointer"
              >
                <option value="support">Something (Belief)</option>
                <option value="critic">Nothing (Doubt)</option>
                <option value="feature">Viability specs</option>
                <option value="match">IP overlaps</option>
              </select>
            </div>

            {/* Circular submit trigger */}
            <button
              onClick={() => handleStartSimulation()}
              disabled={!concept.trim() || isSimulatingGlobal}
              className={cn(
                "size-8 rounded-full flex items-center justify-center transition active:scale-95 cursor-pointer shadow-md",
                concept.trim().length > 0 && !isSimulatingGlobal
                  ? activeAccent.btnBg
                  : "bg-white/5 text-white/25 border border-white/5 cursor-not-allowed"
              )}
              aria-label="Submit"
            >
              {isSimulatingGlobal ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <ArrowUp className="h-4 w-4 stroke-[2.5]" />
              )}
            </button>
          </div>
        </div>
      </div>

    </div>
  )
}
