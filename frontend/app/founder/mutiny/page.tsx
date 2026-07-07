"use client"

import type React from "react"
import { useState, useEffect, useRef } from "react"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
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
  RefreshCw,
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
    <div className="w-full h-[calc(100vh-8rem)] pt-6 pb-24 px-6 xl:px-12 flex flex-col min-h-0 relative overflow-hidden text-foreground">
      
      {/* Background Starfield & Gravitational Grid */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none z-0 opacity-40">
        <svg className="absolute inset-0 w-full h-full" xmlns="http://www.w3.org/2000/svg">
          <circle cx="8%" cy="12%" r="1" fill="#fff" className="animate-pulse" />
          <circle cx="18%" cy="32%" r="1.5" fill="#fff" className="animate-ping" style={{ animationDuration: "3s" }} />
          <circle cx="48%" cy="27%" r="1" fill="#fff" className="animate-pulse" style={{ animationDuration: "2s" }} />
          <circle cx="88%" cy="17%" r="1.2" fill="#fff" className="animate-pulse" style={{ animationDuration: "4s" }} />
          <circle cx="98%" cy="47%" r="1.5" fill="#fff" className="animate-ping" style={{ animationDuration: "5s" }} />
          <circle cx="38%" cy="77%" r="1" fill="#fff" className="animate-pulse" style={{ animationDuration: "2.5s" }} />
          <circle cx="78%" cy="87%" r="1.3" fill="#fff" className="animate-pulse" style={{ animationDuration: "3.5s" }} />
          <circle cx="22%" cy="92%" r="1" fill="#fff" className="animate-ping" style={{ animationDuration: "6s" }} />
          
          <circle cx="50%" cy="50%" r="220" fill="none" stroke="rgba(255,255,255,0.015)" strokeWidth="1" strokeDasharray="5,5" />
          <circle cx="50%" cy="50%" r="380" fill="none" stroke="rgba(255,255,255,0.01)" strokeWidth="1" />
          <path d="M 50% 10% L 50% 90% M 10% 50% L 90% 50%" stroke="rgba(255,255,255,0.008)" strokeWidth="1" strokeDasharray="3,6" />
        </svg>
      </div>

      {/* Decorative Blur Orbs */}
      <div className="pointer-events-none absolute top-12 left-1/4 w-[500px] h-[500px] rounded-full bg-violet-600/[0.03] blur-[120px] z-0" />
      <div className="pointer-events-none absolute bottom-12 right-1/4 w-[600px] h-[600px] rounded-full bg-blue-500/[0.03] blur-[150px] z-0" />

      {/* Elegant Header */}
      <div className="flex items-center justify-between pb-4 border-b border-border/10 shrink-0 pt-1 relative z-10">
        <div className="flex flex-col gap-1.5">
          <h2 className="text-2xl lg:text-3xl font-serif font-light tracking-tight text-foreground leading-tight">Nothing & Something</h2>
          <p className="text-foreground/75 dark:text-foreground/50 text-sm font-sans font-light leading-relaxed">
            Stress-test milestone and conviction nodes against doubt critique rulesets.
          </p>
        </div>
        {messages.length > 0 && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => setMessages([])}
            className="h-9 rounded-lg border-border hover:bg-accent text-sm font-semibold cursor-pointer text-foreground/80 hover:text-foreground transition-all shrink-0 flex items-center gap-2"
          >
            <RefreshCw className="h-4 w-4" />
            Reset Session
          </Button>
        )}
      </div>

      {/* Core Split Workspace Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-8 lg:gap-12 flex-1 min-h-0 mt-8 relative z-10">
        
        {/* Left Column: Analytics Reports (2/5) */}
        <div className="lg:col-span-2 flex flex-col min-h-0 pr-2 overflow-y-auto scrollbar-thin space-y-8 select-text">
          
          {/* Card 1: Assume Nothing Report */}
          <div className="rounded-2xl border border-[#C88E72]/30 dark:border-[#C88E72]/15 bg-[#C88E72]/[0.02] dark:bg-[#C88E72]/[0.005] p-6 lg:p-8 space-y-6 shadow-md transition-all hover:border-[#C88E72]/45">
            <div className="flex items-center justify-between border-b border-[#C88E72]/20 dark:border-[#C88E72]/10 pb-4">
              <div className="space-y-1.5">
                <span className="text-xs font-mono uppercase tracking-widest text-[#C88E72] flex items-center gap-2 font-bold">
                  <ShieldAlert className="h-4 w-4" />
                  Assume Nothing Report
                </span>
                <h4 className="text-sm font-semibold text-foreground/90 leading-tight">Assumption Failure Analytics</h4>
              </div>
              <span className="text-xs font-mono text-foreground/50 uppercase tracking-wider">Cohort 2026.06</span>
            </div>
            <p className="text-sm text-foreground/80 dark:text-muted-foreground leading-relaxed font-sans font-light">
              Anonymized failure categories flagged by the skeptic agent across 1,240 submissions this month. Study these to refine your assumptions.
            </p>
            
            <div className="space-y-5 pt-2">
              {[
                { name: "Market Formation Friction", pct: 42, color: "#C88E72", desc: "Common assumption: customers will change legacy habits immediately." },
                { name: "Unrealistic Unit Economics", pct: 28, color: "#8EA38E", desc: "Common assumption: customer acquisition cost will remain low at scale." },
                { name: "Technical Dependency Lock-in", pct: 15, color: "#8293A4", desc: "Common assumption: core third-party APIs or protocols will remain open." },
                { name: "Team Competency Dispersion", pct: 10, color: "#E2DFD5", desc: "Common assumption: prototype builders can easily scale to manage departments." }
              ].map((stat) => (
                <div key={stat.name} className="space-y-2">
                  <div className="flex justify-between items-baseline text-xs font-mono">
                    <span className="font-semibold text-foreground/90">{stat.name}</span>
                    <span className="font-bold text-foreground/80">{stat.pct}%</span>
                  </div>
                  <div className="h-2 rounded-full bg-border/40 dark:bg-border/20 overflow-hidden">
                    <div className="h-full rounded-full transition-all duration-500" style={{ width: `${stat.pct}%`, backgroundColor: stat.color }} />
                  </div>
                  <span className="text-xs text-foreground/65 dark:text-muted-foreground font-sans block leading-relaxed font-light">{stat.desc}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Card 2: Conviction Rulesets */}
          <div className="rounded-2xl border border-border/20 dark:border-border/10 bg-card/25 backdrop-blur-xl p-6 lg:p-8 space-y-6 shadow-md transition-all hover:border-border/30">
            <div className="flex items-center justify-between border-b border-border/20 dark:border-border/10 pb-4">
              <div className="space-y-1.5">
                <span className="text-xs font-mono uppercase tracking-widest text-brand-accent flex items-center gap-2 font-bold">
                  <BrainCircuit className="h-4 w-4" />
                  Conviction Rulesets
                </span>
                <h4 className="text-sm font-semibold text-foreground/90 leading-tight">Cohort Evaluation Metrics</h4>
              </div>
              <span className="text-xs font-mono text-foreground/50 uppercase tracking-wider">ACTIVE SPEC</span>
            </div>
            <p className="text-sm text-foreground/80 dark:text-muted-foreground leading-relaxed font-sans font-light">
              Skeptic AI parameters used to stress-test ideas before releasing escrow milestones:
            </p>
            
            <div className="space-y-4 pt-1">
              {[
                { name: "Conviction Resonance Threshold", value: "70%", desc: "Minimum threshold required for automated contract approval." },
                { name: "IP Overlap Sensitivity Index", value: "High", desc: "Similarity index matching cohort patent filings." },
                { name: "Unit Margin Feasibility Target", value: ">25%", desc: "Minimum target margins after CAC amortization." },
              ].map((rule) => (
                <div key={rule.name} className="space-y-1.5 border-l border-brand-accent/30 pl-4">
                  <div className="flex justify-between items-baseline text-xs font-mono">
                    <span className="font-semibold text-foreground/90">{rule.name}</span>
                    <span className="font-bold text-brand-accent">{rule.value}</span>
                  </div>
                  <span className="text-xs text-foreground/70 dark:text-muted-foreground font-sans block leading-relaxed font-light">{rule.desc}</span>
                </div>
              ))}
            </div>
          </div>

        </div>

        {/* Right Column: Chat Playground Area (3/5) */}
        <div className="lg:col-span-3 flex flex-col min-h-0 h-full relative">
          
          {/* Scrollable conversation window */}
          <div className="flex-1 overflow-y-auto pr-2 space-y-6 scrollbar-thin min-h-0 select-text">
            {messages.length === 0 ? (
              
              /* Welcome Screen inside Chat area */
              <div className="space-y-8 py-10 max-w-3xl mx-auto text-center">
                <div className="flex flex-col items-center justify-center space-y-4">
                  <div className="size-14 rounded-full border border-border/20 bg-foreground/[0.02] flex items-center justify-center shadow-md">
                    <BrainCircuit className="h-6 w-6 text-foreground/50" />
                  </div>
                  <div className="space-y-2">
                    <h3 className="text-xl sm:text-2xl font-serif font-light text-foreground tracking-tight">How can I challenge your idea?</h3>
                    <p className="text-foreground/70 dark:text-foreground/50 text-sm max-w-md mx-auto leading-relaxed font-sans font-light">
                      Type a concept below to audit its co-founder matches, investor alignments, or potential friction points.
                    </p>
                  </div>
                </div>

                {/* Preset Prompt Cards */}
                <div className="grid gap-4 sm:grid-cols-3 pt-4">
                  {PRESET_PROMPTS.map((item, i) => {
                    const PromptIcon = item.icon
                    return (
                      <motion.button
                        key={i}
                        onClick={() => handleStartSimulation(item.prompt)}
                        whileHover={{ scale: 1.02, y: -2 }}
                        whileTap={{ scale: 0.98 }}
                        className={cn(
                          "flex flex-col items-start p-4 rounded-xl border text-left transition-all w-full cursor-pointer bg-card/10 border-border/20 hover:border-border/40 hover:bg-card/25 group shadow-sm",
                          item.color
                        )}
                      >
                        <PromptIcon className="h-5 w-5 mb-3 opacity-60 group-hover:opacity-100 transition" />
                        <span className="text-xs font-bold font-mono uppercase tracking-wider text-foreground/95">{item.title}</span>
                        <p className="text-xs text-foreground/65 dark:text-foreground/45 mt-2 leading-relaxed font-sans font-light line-clamp-3">
                          {item.prompt}
                        </p>
                      </motion.button>
                    )
                  })}
                </div>

                {/* Simulation Telemetry Console */}
                <div className="mt-8 rounded-xl border border-border/20 bg-card/10 p-5 space-y-4 shadow-sm text-left">
                  <div className="flex items-center justify-between border-b border-border/20 pb-3 text-xs font-mono uppercase tracking-wider text-foreground/50 font-bold">
                    <span>Simulation Telemetry Log</span>
                    <span className="text-emerald-500 animate-pulse flex items-center gap-1.5 font-semibold text-[10px]">
                      <span className="h-2 w-2 rounded-full bg-emerald-500 inline-block"></span>
                      LIVE STREAM
                    </span>
                  </div>
                  <div className="font-mono text-xs text-foreground/75 dark:text-foreground/45 space-y-2 leading-relaxed">
                    <div className="flex justify-between">
                      <span>[19:42:01] P2P Sync Node: Resonance 78% (Passed)</span>
                      <span className="text-emerald-500 font-semibold">Resonance OK</span>
                    </div>
                    <div className="flex justify-between">
                      <span>[19:24:18] Web3 Wallet Pooling: Conviction 48% (Failed)</span>
                      <span className="text-[#C88E72] font-semibold">Doubt Triggered</span>
                    </div>
                    <div className="flex justify-between">
                      <span>[18:55:40] DePIN Sensor Mesh: Resonance 82% (Passed)</span>
                      <span className="text-emerald-500/80 font-semibold">Resonance OK</span>
                    </div>
                  </div>
                </div>

              </div>
            ) : (
              
              /* Messages Viewport */
              <div className="space-y-8 py-2">
                <AnimatePresence initial={false}>
                  {messages.map((msg) => {
                    const isUser = msg.role === "user"
                    const isExpanded = !!expandedThoughts[msg.id]

                    return (
                      <motion.div
                        key={msg.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.25, ease: "easeOut" }}
                        className={cn("flex gap-4 w-full", isUser ? "justify-end" : "justify-start")}
                      >
                        {!isUser && (
                          <div className="size-8 rounded-full border border-border/20 bg-card/20 flex items-center justify-center shrink-0 mt-1">
                            <BrainCircuit className="h-4 w-4 text-foreground/40" />
                          </div>
                        )}

                        <div className={cn("max-w-[85%] space-y-4", isUser ? "text-right" : "text-left")}>
                          
                          {isUser ? (
                            /* User Bubble */
                            <div className="inline-block rounded-2xl bg-muted/15 border border-border/25 px-5 py-3 text-sm sm:text-base text-foreground/90 font-sans font-light leading-relaxed text-left shadow-sm">
                              {msg.content}
                            </div>
                          ) : (
                            
                            /* Assistant Bubble */
                            <div className="w-full space-y-4">
                              
                              {/* Case 1: Simulation loader */}
                              {msg.isSimulating ? (
                                <div className="w-full rounded-xl border border-border/20 bg-background/20 p-5 font-mono text-xs space-y-3 shadow-inner">
                                  <div className="flex items-center gap-2.5 text-foreground/50">
                                    <Loader2 className="h-4 w-4 animate-spin text-brand-accent" />
                                    <span className="text-xs uppercase tracking-wider font-bold">Thinking...</span>
                                  </div>
                                  <div className="space-y-1 pl-3 border-l border-brand-accent/30 text-foreground/45">
                                    {msg.scanLines?.map((line, idx) => (
                                      <div key={idx} className="break-all">&gt; {line}</div>
                                    ))}
                                  </div>
                                </div>
                              ) : (
                                
                                /* Case 2: Analysis Results */
                                <div className="space-y-4 w-full">
                                  
                                  {/* DeepSeek Collapsible Thought Block */}
                                  <div className="border-b border-border/10 pb-3">
                                    <button
                                      onClick={() => toggleThoughts(msg.id)}
                                      className="flex items-center gap-2 text-xs font-mono text-foreground/50 hover:text-foreground/70 transition cursor-pointer select-none bg-transparent border-0 p-0"
                                    >
                                      <div className={cn("size-2 rounded-full", isExpanded ? "bg-foreground/40" : "bg-brand-accent")} />
                                      <span>{isExpanded ? "Hide thinking process" : "Show thinking process"}</span>
                                    </button>
                                    
                                    {isExpanded && msg.scanLines && (
                                      <div className="mt-3 p-4 bg-muted/5 rounded-xl border border-border/10 font-mono text-xs text-foreground/60 space-y-1.5">
                                        {msg.scanLines.map((line, idx) => (
                                          <div key={idx} className="break-all">&gt; {line}</div>
                                        ))}
                                      </div>
                                    )}
                                  </div>

                                  {/* Duality Prose Copy */}
                                  {msg.results && (
                                    <div className="text-sm sm:text-base text-foreground/90 leading-relaxed font-sans space-y-4 font-light">
                                      {msg.mode === "critic" ? (
                                        <div className="space-y-3">
                                          <div className="text-xs font-bold font-mono uppercase tracking-wider text-[#C88E72] flex items-center gap-2">
                                            <ShieldAlert className="h-4 w-4" /> Critique Analysis (Nothing)
                                          </div>
                                          <div className="pl-4 border-l border-[#C88E72]/30 space-y-3">
                                            {parseRationale(msg.results.rationale || "").points.map((pt, idx) => (
                                              <div key={idx} className="space-y-1">
                                                <span className="font-semibold text-foreground text-sm font-sans">{pt.label}</span>
                                                <p className="text-foreground/75 text-sm font-light leading-relaxed">{pt.text}</p>
                                              </div>
                                            ))}
                                          </div>
                                        </div>
                                      ) : (
                                        <div className="space-y-3">
                                          <div className="text-xs font-bold font-mono uppercase tracking-wider text-brand-accent flex items-center gap-2">
                                            <ShieldCheck className="h-4 w-4" /> Resonance Framework (Something)
                                          </div>
                                          <div className="pl-4 border-l border-brand-accent/30 space-y-3">
                                            {parseRationale(msg.results.rationale || "").points.map((pt, idx) => (
                                              <div key={idx} className="space-y-1">
                                                <span className="font-semibold text-foreground text-sm font-sans">{pt.label}</span>
                                                <p className="text-foreground/75 text-sm font-light leading-relaxed">{pt.text}</p>
                                              </div>
                                            ))}
                                          </div>
                                        </div>
                                      )}
                                    </div>
                                  )}

                                  {/* Results Overlaps & Lists */}
                                  {msg.results && (
                                    <MutinyResults data={msg.results} accentKey={accentKey} />
                                  )}

                                </div>
                              )}

                            </div>
                          )}

                        </div>

                        {isUser && (
                          <div className="size-8 rounded-full border border-border/20 shrink-0 bg-card/25 flex items-center justify-center text-xs font-mono font-bold text-foreground/60 shadow mt-1">
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

          {/* Floating Chat Input Capsule */}
          <div className="w-full pt-4 pb-2 shrink-0 z-20">
            <div className={cn(
              "bg-background/85 border border-border/20 rounded-xl p-3 flex flex-col gap-2 transition focus-within:border-border/40 focus-within:bg-background shadow-lg",
              activeAccent.ring
            )}>
              <Textarea
                ref={textareaRef}
                rows={1}
                value={concept}
                onChange={(e) => setConcept(e.target.value)}
                placeholder="Ask a question or test an overlap spec..."
                className="w-full bg-transparent border-0 text-foreground placeholder:text-foreground/50 text-sm sm:text-base leading-relaxed resize-none p-1 focus:outline-none focus:ring-0 focus-visible:ring-0 focus-visible:ring-offset-0 min-h-[38px] shadow-none font-sans"
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault()
                    handleStartSimulation()
                  }
                }}
              />
              
              <div className="flex items-center justify-between px-1 pt-2 border-t border-border/10">
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    className="p-1 rounded text-foreground/40 hover:text-foreground/70 transition cursor-pointer bg-transparent border-0"
                    title="Attach asset file"
                    onClick={() => alert("Simulated asset upload connected.")}
                  >
                    <Paperclip className="h-4 w-4" />
                  </button>

                  <select
                    value={mode}
                    onChange={(e) => setMode(e.target.value as MutinyMode)}
                    className="bg-background border border-border/20 rounded-md text-xs px-2.5 py-1 text-foreground/80 hover:text-foreground focus:text-foreground focus:outline-none focus:border-border/30 font-sans tracking-wide cursor-pointer"
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
                    "size-8 rounded-full flex items-center justify-center transition active:scale-95 cursor-pointer shadow-md",
                    concept.trim().length > 0 && !isSimulatingGlobal
                      ? activeAccent.btnBg
                      : "bg-foreground/5 text-foreground/35 border border-border/10 cursor-not-allowed"
                  )}
                  aria-label="Submit"
                >
                  {isSimulatingGlobal ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <ArrowUp className="h-4 w-4 stroke-[2.5]" />
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
