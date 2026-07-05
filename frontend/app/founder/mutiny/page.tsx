"use client"

import type React from "react"
import { useState, useEffect, useRef } from "react"
import { Textarea } from "@/components/ui/textarea"
import { motion, AnimatePresence } from "framer-motion"
import {
  Loader2,
  ShieldAlert,
  ShieldCheck,
  Paperclip,
  ArrowUp,
  BrainCircuit,
  Scale,
  FileSearch,
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
    btnBg: "bg-[#8EA38E] text-background hover:bg-[#8EA38E]/90",
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
    btnBg: "bg-[#E2DFD5] text-background hover:bg-[#E2DFD5]/90",
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
    btnBg: "bg-[#8293A4] text-background hover:bg-[#8293A4]/90",
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
    btnBg: "bg-[#C88E72] text-background hover:bg-[#C88E72]/90",
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
      color: "text-amber-500 border-border/10 hover:border-border/30 dark:border-border/5 dark:bg-foreground/[0.01] dark:hover:border-border/10"
    },
    {
      title: "Verify Wallet Pooling",
      prompt: "A multi-sig transaction escrow system allowing developers to pool community stakes for project milestones with automated release rules...",
      icon: Scale,
      color: "text-indigo-500 border-border/10 hover:border-border/30 dark:border-border/5 dark:bg-foreground/[0.01] dark:hover:border-border/10"
    },
    {
      title: "Patent Overlaps",
      prompt: "Audit patent claims and VC cohort registrations matching key-value storage syncing systems and distributed peer discovery protocols...",
      icon: FileSearch,
      color: "text-pink-500 border-border/10 hover:border-border/30 dark:border-border/5 dark:bg-foreground/[0.01] dark:hover:border-border/10"
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
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 140)}px`
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
    <div className="w-full h-[calc(100vh-8rem)] flex flex-col min-h-0 select-none pb-2">
      
      {/* Minimal header title */}
      <div className="flex flex-col gap-1 pb-3 border-b border-border/[0.03] shrink-0 pt-1">
        <h2 className="text-xl font-serif font-light tracking-tight text-foreground leading-tight">Nothing & Something</h2>
        <p className="text-foreground/70 dark:text-foreground/45 text-[11px] font-sans font-light leading-relaxed">Stress-test milestone and conviction nodes against doubt critique rulesets.</p>
      </div>

      {/* Split Layout Workspace */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-8 flex-1 min-h-0 mt-6">
        
        {/* LEFT COLUMN: Reference Sidepanel with 2 distinct cards (2/5 width) */}
        <div className="lg:col-span-2 flex flex-col min-h-0 border-r border-border/10 pr-6 overflow-y-auto scrollbar-thin space-y-6">
          
          {/* Card 1: Assume Nothing Report */}
          <div className="rounded-2xl border border-[#C88E72]/30 dark:border-[#C88E72]/15 bg-[#C88E72]/[0.02] dark:bg-[#C88E72]/[0.01] p-5 space-y-4 shadow-sm shrink-0">
            <div className="flex items-center justify-between border-b border-[#C88E72]/20 dark:border-[#C88E72]/10 pb-3">
              <div className="space-y-1">
                <span className="text-[10px] font-mono uppercase tracking-[0.18em] text-[#C88E72] flex items-center gap-1.5 font-bold">
                  <ShieldAlert className="h-3.5 w-3.5" />
                  Assume Nothing Report
                </span>
                <h4 className="text-xs font-semibold text-foreground/85 leading-none">Assumption Failure Analytics</h4>
              </div>
              <span className="text-[9px] font-mono text-foreground/60 dark:text-foreground/35 uppercase tracking-wider">Cohort 2026.06</span>
            </div>
            <p className="text-[11px] text-foreground/75 dark:text-muted-foreground leading-normal font-sans">
              Anonymized failure categories flagged by the skeptic agent across 1,240 submissions this month. Study these to refine your assumptions.
            </p>
            
            <div className="space-y-4 pt-2">
              {[
                { name: "Market Formation Friction", pct: 42, color: "#C88E72", desc: "Common assumption: customers will change legacy habits immediately." },
                { name: "Unrealistic Unit Economics", pct: 28, color: "#8EA38E", desc: "Common assumption: customer acquisition cost will remain low at scale." },
                { name: "Technical Dependency Lock-in", pct: 15, color: "#8293A4", desc: "Common assumption: core third-party APIs or protocols will remain open." },
                { name: "Team Competency Dispersion", pct: 10, color: "#E2DFD5", desc: "Common assumption: prototype builders can easily scale to manage departments." }
              ].map((stat) => (
                <div key={stat.name} className="space-y-1">
                  <div className="flex justify-between items-baseline text-[10.5px] font-mono">
                    <span className="font-semibold text-foreground/90 dark:text-foreground/80">{stat.name}</span>
                    <span className="font-bold text-foreground/85 dark:text-foreground/70">{stat.pct}%</span>
                  </div>
                  <div className="h-1 rounded-full bg-border/40 dark:bg-border/20 overflow-hidden">
                    <div className="h-full rounded-full transition-all duration-500" style={{ width: `${stat.pct}%`, backgroundColor: stat.color }} />
                  </div>
                  <span className="text-[10px] text-foreground/65 dark:text-muted-foreground font-sans block leading-normal">{stat.desc}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Card 2: Conviction Rulesets */}
          <div className="rounded-2xl border border-border/30 dark:border-border/10 bg-muted/[0.04] dark:bg-foreground/[0.01] p-5 space-y-4 shadow-sm shrink-0">
            <div className="flex items-center justify-between border-b border-border/20 dark:border-border/5 pb-3">
              <div className="space-y-1">
                <span className="text-[10px] font-mono uppercase tracking-[0.18em] text-brand-accent flex items-center gap-1.5 font-bold">
                  <BrainCircuit className="h-3.5 w-3.5" />
                  Conviction Rulesets
                </span>
                <h4 className="text-xs font-semibold text-foreground/85 leading-none">Cohort Evaluation Metrics</h4>
              </div>
              <span className="text-[9px] font-mono text-foreground/60 dark:text-foreground/35 uppercase tracking-wider">ACTIVE SPEC</span>
            </div>
            <p className="text-[11px] text-foreground/75 dark:text-muted-foreground leading-normal font-sans">
              Skeptic AI parameters used to stress-test ideas before releasing escrow milestones:
            </p>
            
            <div className="space-y-3.5 pt-1">
              {[
                { name: "Conviction Resonance Threshold", value: "70%", desc: "Minimum threshold required for automated contract approval." },
                { name: "IP Overlap Sensitivity Index", value: "High", desc: "Similarity index matching cohort patent filings." },
                { name: "Unit Margin Feasibility Target", value: ">25%", desc: "Minimum target margins after CAC amortization." },
              ].map((rule) => (
                <div key={rule.name} className="space-y-1 border-l border-border/30 dark:border-l-2 dark:border-border/10 pl-3">
                  <div className="flex justify-between items-baseline text-[10.5px] font-mono">
                    <span className="font-semibold text-foreground/90 dark:text-foreground/80">{rule.name}</span>
                    <span className="font-bold text-brand-accent">{rule.value}</span>
                  </div>
                  <span className="text-[10px] text-foreground/70 dark:text-muted-foreground font-sans block leading-normal">{rule.desc}</span>
                </div>
              ))}
            </div>
          </div>

        </div>

        {/* RIGHT COLUMN: Interactive Chat Playground (3/5 width) */}
        <div className="lg:col-span-3 flex flex-col min-h-0 h-full">
          
          {/* Scrollable messages viewport */}
          <div className="flex-1 overflow-y-auto pr-1 min-h-0 space-y-6 scrollbar-thin">
            {messages.length === 0 ? (
              
              /* Centered Claude Welcome Screen inside Chat pane */
              <div className="space-y-8 py-8 max-w-xl mx-auto text-center animate-fade-in">
                <div className="flex flex-col items-center justify-center space-y-3">
                  <div className="size-11 rounded-full border border-border/10 dark:border-border/[0.04] bg-foreground/[0.01] flex items-center justify-center shadow-inner">
                    <BrainCircuit className="h-4.5 w-4.5 text-foreground/45 dark:text-foreground/35" />
                  </div>
                  <div className="space-y-1.5">
                    <h3 className="text-lg sm:text-xl font-serif font-light text-foreground tracking-tight">How can I challenge your idea?</h3>
                    <p className="text-foreground/65 dark:text-foreground/40 text-[11px] max-w-xs mx-auto leading-relaxed font-sans font-light">
                      Type a concept to audit its co-founder matches, investor alignments, or potential friction points.
                    </p>
                  </div>
                </div>

                {/* Preset cards stacked cleanly */}
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
                          "flex flex-col items-start p-3.5 rounded-xl border text-left transition-all w-full cursor-pointer bg-muted/[0.02] border-border/20 dark:border-border/[0.03] hover:border-border/40 dark:hover:border-border/[0.06] hover:bg-muted/[0.05] dark:hover:bg-foreground/[0.02] group shadow-sm",
                          item.color
                        )}
                      >
                        <PromptIcon className="h-3.5 w-3.5 mb-2 opacity-55 dark:opacity-40 group-hover:opacity-90 transition" />
                        <span className="text-[10px] font-bold font-mono uppercase tracking-wider text-foreground/95 dark:text-foreground/80">{item.title}</span>
                        <p className="text-[9px] text-foreground/60 dark:text-foreground/35 mt-1 leading-normal font-sans font-light line-clamp-3">
                          {item.prompt}
                        </p>
                      </motion.button>
                    )
                  })}
                </div>

                {/* Telemetry log block to utilize space */}
                <div className="mt-8 rounded-xl border border-border/20 dark:border-border/5 bg-muted/[0.01] dark:bg-foreground/[0.005] p-4.5 space-y-3">
                  <div className="flex items-center justify-between border-b border-border/20 dark:border-border/5 pb-2 text-[10px] font-mono uppercase tracking-wider text-foreground/60 dark:text-foreground/40 font-bold">
                    <span>Simulation Telemetry Log</span>
                    <span className="text-emerald-600 dark:text-emerald-500 animate-pulse text-[8px]">● LIVE STREAM</span>
                  </div>
                  <div className="font-mono text-[10px] text-foreground/60 dark:text-foreground/30 space-y-1.5 text-left leading-normal">
                    <div className="flex justify-between">
                      <span>[19:42:01] P2P Sync Node: Resonance 78% (Passed)</span>
                      <span className="text-emerald-600 dark:text-emerald-500/70 font-semibold">Resonance OK</span>
                    </div>
                    <div className="flex justify-between">
                      <span>[19:24:18] Web3 Wallet Pooling: Conviction 48% (Failed)</span>
                      <span className="text-[#C88E72] dark:text-[#C88E72]/70 font-semibold">Doubt Triggered</span>
                    </div>
                    <div className="flex justify-between">
                      <span>[18:55:40] DePIN Sensor Mesh: Resonance 82% (Passed)</span>
                      <span className="text-emerald-600 dark:text-emerald-500/70 font-semibold">Resonance OK</span>
                    </div>
                  </div>
                </div>

              </div>
            ) : (
              
              /* Conversation Thread Feed */
              <div className="space-y-6 select-text py-2">
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
                        className={cn("flex gap-3 w-full", isUser ? "justify-end" : "justify-start")}
                      >
                        {!isUser && (
                          <div className="size-6.5 rounded-full border border-border/10 dark:border-border/5 bg-foreground/[0.02] flex items-center justify-center shrink-0 mt-0.5">
                            <BrainCircuit className="h-3 w-3 text-foreground/30" />
                          </div>
                        )}

                        <div className={cn("max-w-[85%] space-y-3.5", isUser ? "text-right" : "text-left")}>
                          
                          {isUser ? (
                            /* User Chat Bubble */
                            <div className="inline-block rounded-xl bg-muted/15 dark:bg-foreground/[0.02] border border-border/20 dark:border-border/[0.04] px-3.5 py-2 text-xs sm:text-[12.5px] text-foreground/95 font-sans font-light leading-relaxed text-left">
                              {msg.content}
                            </div>
                          ) : (
                            
                            /* Assistant Dialogue Response */
                            <div className="w-full space-y-3.5">
                              
                              {/* Case A: Simulating Loader */}
                              {msg.isSimulating ? (
                                <div className="w-full rounded-lg border border-border/20 dark:border-border/[0.03] bg-background/10 p-3.5 font-mono text-[10px] space-y-2">
                                  <div className="flex items-center gap-2 text-foreground/45 dark:text-foreground/40">
                                    <Loader2 className="h-3 w-3 animate-spin text-brand-accent" />
                                    <span className="text-[9px] uppercase tracking-wider font-bold">Thinking...</span>
                                  </div>
                                  <div className="space-y-0.5 pl-2 border-l border-border/15 dark:border-l dark:border-border/5 text-foreground/35 dark:text-foreground/25">
                                    {msg.scanLines?.map((line, idx) => (
                                      <div key={idx} className="break-all">&gt; {line}</div>
                                    ))}
                                  </div>
                                </div>
                              ) : (
                                
                                /* Case B: Redesigned prose-first text outputs */
                                <div className="space-y-3.5 w-full">
                                  
                                  {/* Collapsible Thinking Process Toggle (DeepSeek style) */}
                                  <div className="border-b border-border/20 dark:border-border/[0.03] pb-2">
                                    <button
                                      onClick={() => toggleThoughts(msg.id)}
                                      className="flex items-center gap-1.5 text-[10px] font-mono text-foreground/60 dark:text-foreground/35 hover:text-foreground/80 transition cursor-pointer select-none bg-transparent border-0 p-0"
                                    >
                                      <div className={cn("size-1.5 rounded-full", isExpanded ? "bg-foreground/40" : "bg-brand-accent")} />
                                      <span>{isExpanded ? "Hide thinking process" : "Show thinking process"}</span>
                                    </button>
                                    
                                    {isExpanded && msg.scanLines && (
                                      <div className="mt-2 p-2.5 bg-muted/5 dark:bg-background/40 rounded-lg border border-border/10 dark:border-border/[0.03] font-mono text-[10px] text-foreground/60 dark:text-foreground/35 space-y-1">
                                        {msg.scanLines.map((line, idx) => (
                                          <div key={idx} className="break-all">&gt; {line}</div>
                                        ))}
                                      </div>
                                    )}
                                  </div>

                                  {/* Prose-based Duality response */}
                                  {msg.results && (
                                    <div className="text-[12px] sm:text-[12.5px] text-foreground/85 dark:text-foreground/80 leading-relaxed font-sans space-y-3 font-light">
                                      {msg.mode === "critic" ? (
                                        <div className="space-y-2">
                                          <div className="text-[10px] font-bold font-mono uppercase tracking-[0.15em] text-[#C88E72] flex items-center gap-1.5">
                                            <ShieldAlert className="h-3 w-3" /> Critique Analysis (Nothing)
                                          </div>
                                          <div className="pl-3.5 border-l border-[#C88E72]/30 dark:border-[#C88E72]/15 space-y-2">
                                            {parseRationale(msg.results.rationale || "").points.map((pt, idx) => (
                                              <div key={idx} className="space-y-0.5">
                                                <span className="font-semibold text-foreground/90 text-[11.5px] font-sans">{pt.label}</span>
                                                <p className="text-foreground/70 dark:text-foreground/45 font-light leading-relaxed">{pt.text}</p>
                                              </div>
                                            ))}
                                          </div>
                                        </div>
                                      ) : (
                                        <div className="space-y-2">
                                          <div className="text-[10px] font-bold font-mono uppercase tracking-[0.15em] text-brand-accent flex items-center gap-1.5">
                                            <ShieldCheck className="h-3 w-3" /> Resonance Framework (Something)
                                          </div>
                                          <div className="pl-3.5 border-l border-brand-accent/30 dark:border-l dark:border-brand-accent/20 space-y-2">
                                            {parseRationale(msg.results.rationale || "").points.map((pt, idx) => (
                                              <div key={idx} className="space-y-0.5">
                                                <span className="font-semibold text-foreground/90 text-[11.5px] font-sans">{pt.label}</span>
                                                <p className="text-foreground/70 dark:text-foreground/45 font-light leading-relaxed">{pt.text}</p>
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
                          <div className="size-6.5 rounded-full border border-border/15 dark:border-border/10 shrink-0 bg-foreground/5 flex items-center justify-center text-[10px] font-mono font-bold text-foreground/60 dark:text-foreground/40 shadow mt-0.5">
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

          {/* FLOAT CHAT INPUT CAPSULE at bottom */}
          <div className="w-full pt-3 pb-1 shrink-0 z-20">
            <div className={cn(
              "bg-background/85 dark:bg-background/35 border border-border/30 dark:border-border/10 rounded-xl p-2 flex flex-col gap-1 transition focus-within:border-border/50 dark:focus-within:border-border/20 focus-within:bg-background/95 dark:focus-within:bg-background/55 shadow-lg",
              activeAccent.ring
            )}>
              <Textarea
                ref={textareaRef}
                rows={1}
                value={concept}
                onChange={(e) => setConcept(e.target.value)}
                placeholder="Ask a question or test an overlap spec..."
                className="w-full bg-transparent border-0 text-foreground placeholder:text-foreground/50 dark:placeholder:text-foreground/25 text-xs sm:text-[12.5px] leading-relaxed resize-none p-1 focus:outline-none focus:ring-0 focus-visible:ring-0 focus-visible:ring-offset-0 min-h-[38px] shadow-none font-sans"
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault()
                    handleStartSimulation()
                  }
                }}
              />
              
              <div className="flex items-center justify-between px-1 pt-1.5 border-t border-border/[0.03]">
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    className="p-1 rounded text-foreground/35 hover:text-foreground/65 dark:text-foreground/30 dark:hover:text-foreground/55 transition cursor-pointer bg-transparent border-0"
                    title="Attach asset file"
                    onClick={() => alert("Simulated asset upload connected.")}
                  >
                    <Paperclip className="h-3.5 w-3.5" />
                  </button>

                  <select
                    value={mode}
                    onChange={(e) => setMode(e.target.value as MutinyMode)}
                    className="bg-background/80 dark:bg-background/30 border border-border/20 dark:border-border/[0.03] rounded-md text-[10px] px-2 py-0.5 text-foreground/70 dark:text-foreground/50 hover:text-foreground/90 dark:hover:text-foreground/80 focus:text-foreground/85 dark:focus:text-foreground/80 focus:outline-none focus:border-border/20 dark:focus:border-border/10 font-sans tracking-wide cursor-pointer"
                  >
                    <option value="support">Something (Belief)</option>
                    <option value="critic">Nothing (Doubt)</option>
                    <option value="feature">Viability specs</option>
                    <option value="match">IP overlaps</option>
                  </select>
                </div>

                <button
                  onClick={() => handleStartSimulation()}
                  disabled={!concept.trim() || isSimulatingGlobal}
                  className={cn(
                    "size-7 rounded-full flex items-center justify-center transition active:scale-95 cursor-pointer shadow",
                    concept.trim().length > 0 && !isSimulatingGlobal
                      ? activeAccent.btnBg
                      : "bg-foreground/5 text-foreground/35 border border-border/10 dark:text-foreground/25 dark:border-border/5 cursor-not-allowed"
                  )}
                  aria-label="Submit"
                >
                  {isSimulatingGlobal ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <ArrowUp className="h-3.5 w-3.5 stroke-[2.5]" />
                  )}
                </button>
              </div>
            </div>
          </div>

        </div>

      </div>

    </div>
  )
}
