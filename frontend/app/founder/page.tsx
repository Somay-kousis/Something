"use client"

import { useState, useEffect } from "react"
import axios from "axios"
import Link from "next/link"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import {
  Zap, TrendingUp, ArrowUpRight, ArrowRight,
  Loader2, AlertTriangle, PenLine, CheckCircle2, Clock, Lock,
} from "lucide-react"

import { PageHeader } from "@/components/page-header"

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || ""


// ─── Types ────────────────────────────────────────────────────────────────────
interface KpiData { ideas: number; teamMembers: number; fundsRaised: string; unreadChats: number }
interface Idea { id: string; title: string; status: "Funded" | "Seeking" | "Draft"; funding: string; stage: string; tags: string[]; fundedPct: number }
interface TeamMember { id: string; initials: string; name: string; role: string; lastActive: string }
interface ActivityItem { id: string; text: string; timestamp: string; important?: boolean }
interface OverviewData { kpis: KpiData; ideas: Idea[]; team: TeamMember[]; activity: ActivityItem[]; escrow: { raised: number; goal: number } }

// ─── API ─────────────────────────────────────────────────────────────────────
const overviewAPI = {
  async getOverviewData(): Promise<OverviewData> {
    try {
      const r = await axios.get(`${API_BASE_URL}/founder/overview`, {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      })
      return r.data
    } catch {
      return {
        kpis: { ideas: 2, teamMembers: 3, fundsRaised: "$84,400", unreadChats: 1 },
        ideas: [
          { id: "y1", title: "Edge Vision Kit",       status: "Seeking", funding: "$8,000 / $25,000",  stage: "MVP",       tags: ["Edge AI", "Robotics"], fundedPct: 32  },
          { id: "y2", title: "Local‑first Analytics", status: "Funded",  funding: "$12,000 / $12,000", stage: "Prototype", tags: ["Privacy", "CRDT"],     fundedPct: 100 },
        ],
        team: [
          { id: "tm-1", initials: "AR", name: "Alex Rivera", role: "Co-Founder & CTO", lastActive: "Active now" },
          { id: "tm-2", initials: "JD", name: "Jane Doe",    role: "Lead Designer",    lastActive: "3h ago" },
          { id: "tm-3", initials: "MK", name: "Mark K.",     role: "GTM Lead",         lastActive: "1d ago" },
        ],
        activity: [
          { id: "a1", text: "Sarah Chen liked your Edge Vision Kit idea",      timestamp: "2h ago" },
          { id: "a2", text: "Milestone 1 payout approved — $40,000 released", timestamp: "1d ago", important: true },
          { id: "a3", text: "Alex Rivera synced Local‑first Analytics edits", timestamp: "3d ago" },
          { id: "a4", text: "Liam Vance sent you a message",                  timestamp: "4d ago" },
        ],
        escrow: { raised: 120000, goal: 200000 },
      }
    }
  },
}

// ─── Count-up ─────────────────────────────────────────────────────────────────
function useCountUp(target: number, duration = 900) {
  const [count, setCount] = useState(0)
  useEffect(() => {
    if (target === 0) { setCount(0); return }
    let cur = 0
    const inc = target / 36
    const t = setInterval(() => {
      cur += inc
      if (cur >= target) { setCount(target); clearInterval(t) }
      else setCount(Math.floor(cur))
    }, duration / 36)
    return () => clearInterval(t)
  }, [target, duration])
  return count
}

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function FounderOverviewPage() {
  const [data, setData]       = useState<OverviewData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError]     = useState<string | null>(null)
  const [greeting, setGreeting] = useState("")
  const [dateStr, setDateStr]   = useState("")

  useEffect(() => {
    const d = new Date()
    const h = d.getHours()
    setGreeting(h < 12 ? "Good morning" : h < 17 ? "Good afternoon" : "Good evening")
    setDateStr(d.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" }))
    overviewAPI.getOverviewData()
      .then(setData)
      .catch(() => setError("Could not load overview."))
      .finally(() => setLoading(false))
  }, [])

  if (loading) return (
    <div className="flex items-center justify-center h-[60vh]">
      <Loader2 className="h-5 w-5 animate-spin text-white/20" />
    </div>
  )
  if (error || !data) return (
    <div className="flex flex-col items-center justify-center h-[60vh] gap-3">
      <AlertTriangle className="h-6 w-6 text-white/20" />
      <p className="text-white/35 text-xs">{error}</p>
    </div>
  )

  const { kpis, ideas, team, activity, escrow } = data
  const escrowPct = Math.round((escrow.raised / escrow.goal) * 100)
  const fundsRaw  = 84400

  return (
    <div className="mx-auto max-w-4xl pt-6 pb-24 space-y-16 px-4">

      <PageHeader
        category={`${greeting} — ${dateStr}`}
        title="Founder Dashboard"
        description="Manage project escrow, coordinate ideas, and track builder synchronization."
        accentColor="amber"
        action={
          <div className="flex gap-2">
            <Button asChild size="sm" className="h-8 rounded-full bg-white text-[#0a0a0c] hover:bg-white/90 hover:scale-[1.02] transition-all duration-300 font-semibold text-xs px-4" style={{ fontFamily: "var(--font-outfit)" }}>
              <Link href="/founder/ideas" className="flex items-center gap-1.5"><PenLine className="h-3 w-3" />New idea</Link>
            </Button>
            <Button asChild size="sm" className="h-8 rounded-full bg-white/[0.03] border border-white/10 text-white/70 hover:text-white hover:bg-white/5 hover:border-white/20 transition-all duration-300 font-semibold text-xs px-4" style={{ fontFamily: "var(--font-outfit)" }}>
              <Link href="/founder/funding" className="flex items-center gap-1.5"><TrendingUp className="h-3 w-3" />Milestones</Link>
            </Button>
          </div>
        }
      />

      {/* ── Action notice ── */}
      <div className="relative overflow-hidden rounded-xl border border-white/5 bg-[#C88E72]/[0.02] p-4">
        <div className="flex flex-col sm:flex-row sm:items-center gap-4 relative z-10">
          <div className="flex items-center gap-2">
            <span className="relative flex h-1.5 w-1.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#C88E72] opacity-75"></span>
              <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-[#C88E72]"></span>
            </span>
            <span className="text-[10px] font-mono uppercase tracking-widest text-[#C88E72] font-semibold">Action Required</span>
          </div>
          <p className="flex-1 text-xs text-white/60 leading-relaxed font-sans">
            <span className="text-white font-medium">Milestone 2</span> is pending verification — submit proof to release{" "}
            <span className="text-[#C88E72] font-medium tabular-nums">$40,000</span> from escrow.
          </p>
          <Link href="/founder/funding" className="shrink-0 text-xs font-semibold text-[#C88E72] hover:text-[#C88E72]/80 transition-colors flex items-center gap-1 self-start sm:self-auto group font-sans">
            Request payout <ArrowRight className="h-3.5 w-3.5 group-hover:translate-x-0.5 transition-transform" />
          </Link>
        </div>
      </div>

      {/* ── KPI Stats Row ── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-8 py-8 border-y border-white/5">
        <KpiStat label="Funds raised" rawValue={fundsRaw} isCurrency sub="+$4,400 this week" />
        <KpiStat label="Active ideas" rawValue={2} sub="2 in progress" />
        <KpiStat label="Team members" rawValue={3} sub="All active" />
        <KpiStat label="Unread chats" rawValue={kpis.unreadChats} sub="1 new thread" />
      </div>

      {/* ── Milestone Escrow Pool ── */}
      <div className="border-t border-white/5 pt-12">
        <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-2 border-b border-white/5 pb-4 mb-6">
          <div className="space-y-1">
            <SectionLabel>Milestone Escrow Pool</SectionLabel>
            <p className="text-xs text-white/40">Track funds held in secure multi-signature escrow.</p>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-xs text-white/35">Released</span>
            <span className="text-2xl font-bold font-outfit text-brand-accent" style={{ fontFamily: "var(--font-outfit)" }}>
              {escrowPct}%
            </span>
          </div>
        </div>

        <div className="flex items-baseline gap-2 mb-6">
          <span className="text-3xl font-bold tracking-tight text-white font-outfit" style={{ fontFamily: "var(--font-outfit)" }}>
            ${escrow.raised.toLocaleString()}
          </span>
          <span className="text-xs font-mono text-white/30">/ ${escrow.goal.toLocaleString()} total project value</span>
        </div>

        {/* Clean Flat Progress Bar */}
        <div className="h-1.5 w-full rounded-full bg-white/[0.04] overflow-hidden mb-8 relative">
          <div
            className="h-full rounded-full bg-brand-accent transition-all duration-1000"
            style={{ width: `${escrowPct}%` }}
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-4 gap-6">
          {[
            { label: "Whitepaper & Specs",    amount: "$40K", done: true,  pending: false },
            { label: "Alpha & Sync Engine",   amount: "$40K", done: false, pending: true  },
            { label: "Security Audit & Beta", amount: "$40K", done: false, pending: false },
            { label: "Mainnet Launch",        amount: "$80K", done: false, pending: false },
          ].map((m, i) => (
            <div key={i} className="space-y-2 py-3 px-2 hover:bg-white/[0.01] transition-all rounded-lg">
              <div className="flex items-center gap-2">
                <div className={cn(
                  "size-5 rounded-full border grid place-items-center transition-all duration-300",
                  m.done ? "bg-brand-accent/10 border-brand-accent text-brand-accent" :
                  m.pending ? "bg-[#C88E72]/10 border-[#C88E72] text-[#C88E72] animate-pulse" :
                  "bg-white/[0.02] border-white/10 text-white/10"
                )}>
                  {m.done    ? <CheckCircle2 className="h-2.5 w-2.5" />
                   : m.pending ? <Clock className="h-2.5 w-2.5" />
                   : <Lock className="h-2.5 w-2.5" />}
                </div>
                <span className={cn("text-xs font-bold font-mono tracking-tight",
                  m.done ? "text-white/80" : m.pending ? "text-[#C88E72]" : "text-white/20"
                )}>{m.amount}</span>
              </div>
              <div>
                <p className={cn("text-xs font-medium leading-snug",
                  m.done ? "text-white/70" : m.pending ? "text-white/50" : "text-white/25"
                )}>{m.label}</p>
                <p className={cn("text-[9px] font-mono uppercase tracking-widest mt-1",
                  m.done ? "text-brand-accent" : m.pending ? "text-[#C88E72]" : "text-white/20"
                )}>
                  {m.done ? "Released" : m.pending ? "Pending Verification" : "Locked"}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Your Ideas ── */}
      <div className="border-t border-white/5 pt-12">
        <div className="flex items-center justify-between border-b border-white/5 pb-4 mb-6">
          <div className="space-y-1">
            <SectionLabel>Your ideas</SectionLabel>
            <p className="text-xs text-white/40">Review submission status and current funding tracking.</p>
          </div>
          <Link href="/founder/ideas" className="text-[10px] font-mono uppercase tracking-widest text-brand-accent hover:text-brand-accent/85 transition-colors flex items-center gap-1 font-semibold">
            All ideas <ArrowRight className="h-3 w-3" />
          </Link>
        </div>

        <div className="divide-y divide-white/5">
          {ideas.map((idea) => (
            <IdeaRow key={idea.id} idea={idea} />
          ))}
        </div>
      </div>

      {/* ── Team & Activity Log (Side by side) ── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-12 border-t border-white/5 pt-12">
        
        {/* Team Sync */}
        <div className="space-y-6">
          <div className="border-b border-white/5 pb-4">
            <SectionLabel>Team synchronization</SectionLabel>
            <p className="text-xs text-white/40 mt-1">Real-time presence and active roles.</p>
          </div>
          <div className="space-y-4">
            {team.map((m) => (
              <div key={m.id} className="flex items-center gap-3 py-1 hover:px-2 rounded-lg -mx-2 hover:bg-white/[0.01] transition-all">
                <div className="h-8 w-8 rounded-full bg-white/5 border border-white/10 text-white/70 text-[10px] font-bold grid place-items-center shrink-0 font-mono">
                  {m.initials}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-xs font-semibold text-white/80 truncate">{m.name}</div>
                  <div className="text-[9px] text-white/40 font-mono mt-0.5 uppercase tracking-wide truncate">{m.role}</div>
                </div>
                <span className="text-[9px] font-mono text-white/30 shrink-0 bg-white/[0.02] border border-white/5 rounded px-2 py-0.5">{m.lastActive}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Activity */}
        <div className="space-y-6">
          <div className="border-b border-white/5 pb-4">
            <SectionLabel>Recent activity log</SectionLabel>
            <p className="text-xs text-white/40 mt-1">System updates and external interactions.</p>
          </div>
          <div className="space-y-4">
            {activity.map((item) => (
              <div key={item.id} className="flex items-start gap-2.5 py-1 hover:px-2 rounded-lg -mx-2 hover:bg-white/[0.01] transition-all">
                <span className={cn(
                  "mt-2 h-1.5 w-1.5 rounded-full shrink-0", 
                  item.important ? "bg-[#E3C27A]" : "bg-white/25"
                )} />
                <div className="flex-1 min-w-0">
                  <p className={cn("text-xs leading-normal", item.important ? "text-white/85 font-medium" : "text-white/40")}>
                    {item.text}
                  </p>
                </div>
                <span className="text-[8px] font-mono text-white/35 shrink-0 mt-0.5 uppercase tracking-wider bg-white/[0.02] border border-white/5 rounded px-1.5 py-0.5">
                  {item.timestamp}
                </span>
              </div>
            ))}
          </div>
        </div>

      </div>

    </div>
  )
}

// ─── Shared ───────────────────────────────────────────────────────────────────
function SectionLabel({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <p className={cn("text-[10px] font-mono uppercase tracking-[0.2em] text-white/35", className)}>
      {children}
    </p>
  )
}

function KpiStat({ label, rawValue, isCurrency, sub }: {
  label: string; rawValue: number; isCurrency?: boolean; sub: string
}) {
  const count   = useCountUp(rawValue)
  const display = isCurrency ? `$${count.toLocaleString()}` : count.toString()
  return (
    <div className="group transition-all duration-300">
      <div className="text-[10px] font-mono text-white/35 uppercase tracking-wider">{label}</div>
      <div className="text-3xl font-bold tracking-tight text-white mt-1.5 font-outfit" style={{ fontFamily: "var(--font-outfit)" }}>
        {display}
      </div>
      <div className="text-[9px] font-mono text-white/30 mt-1 uppercase tracking-wide">{sub}</div>
    </div>
  )
}

function IdeaRow({ idea }: { idea: Idea }) {
  const s = {
    Funded:  { text: "text-brand-accent", bg: "bg-brand-accent/5", border: "border-brand-accent/10" },
    Seeking: { text: "text-[#C88E72]",  bg: "bg-[#C88E72]/5",  border: "border-[#C88E72]/10" },
    Draft:   { text: "text-white/30",  bg: "bg-white/[0.01]",  border: "border-white/5" },
  }[idea.status]

  return (
    <div className="group relative py-5 flex flex-col md:flex-row md:items-center justify-between gap-4 transition-all duration-200 hover:px-2 rounded-lg -mx-2 hover:bg-white/[0.01]">
      <div className="flex-1 space-y-1.5">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-sm font-semibold text-white/85 group-hover:text-white transition-colors duration-300">
            {idea.title}
          </span>
          <Badge className={cn("text-[9px] font-semibold uppercase tracking-widest px-2 py-0.5 border rounded-full shrink-0", s.text, s.bg, s.border)}>
            {idea.status}
          </Badge>
          <span className="text-[9px] font-mono text-white/35 uppercase tracking-widest bg-white/[0.03] border border-white/5 px-2 py-0.5 rounded">{idea.stage}</span>
        </div>
        
        {/* Tags */}
        <div className="flex gap-1.5 flex-wrap">
          {idea.tags.map((tag) => (
            <span key={tag} className="text-[9px] font-mono text-white/30 bg-white/[0.02] border border-white/[0.05] rounded px-1.5 py-0.5">
              #{tag}
            </span>
          ))}
        </div>
      </div>

      {/* Funding Progress */}
      <div className="w-full md:w-48 space-y-1.5 shrink-0">
        <div className="flex justify-between text-[9px] font-mono text-white/35">
          <span>{idea.funding}</span>
          <span className="font-semibold">{idea.fundedPct}%</span>
        </div>
        <div className="h-1 w-full rounded-full bg-white/[0.04] overflow-hidden">
          <div
            className={cn("h-full rounded-full transition-all duration-700",
              idea.fundedPct === 100 ? "bg-brand-accent" : "bg-white/20"
            )}
            style={{ width: `${idea.fundedPct}%` }}
          />
        </div>
      </div>

      {/* Link button */}
      <Link href={`/founder/ideas/${idea.id}`}
        className="shrink-0 text-[11px] font-semibold text-white/40 hover:text-white transition-colors flex items-center gap-1 align-middle justify-center py-1.5 px-3 border border-white/5 hover:border-white/10 rounded-lg bg-white/[0.01] hover:bg-white/[0.03]">
        Explore <ArrowUpRight className="h-3 w-3 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
      </Link>
    </div>
  )
}
