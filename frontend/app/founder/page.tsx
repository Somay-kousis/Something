"use client"

import { useState, useEffect } from "react"
import axios from "axios"
import Link from "next/link"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import {
  TrendingUp, ArrowUpRight, ArrowRight,
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
      <Loader2 className="h-5 w-5 animate-spin text-foreground/20" />
    </div>
  )
  if (error || !data) return (
    <div className="flex flex-col items-center justify-center h-[60vh] gap-3">
      <AlertTriangle className="h-6 w-6 text-foreground/20" />
      <p className="text-foreground/35 text-xs">{error}</p>
    </div>
  )

  const { kpis, ideas, team, activity, escrow } = data
  const escrowPct = Math.round((escrow.raised / escrow.goal) * 100)
  const fundsRaw  = 84400

  return (
    <div className="w-full pt-6 pb-24 px-6 xl:px-10">

      <PageHeader
        category={`${greeting} — ${dateStr}`}
        title="Workspace Overview"
        description="Review milestone disbursements, coordinate cohort ideas, and track builder synchronization."
        accentColor="amber"
        action={
          <div className="flex gap-2.5">
            <Button asChild size="sm" className="h-8.5 rounded-full bg-foreground text-background hover:bg-foreground/90 hover:scale-[1.01] transition-all duration-300 font-semibold text-xs px-4.5 cursor-pointer" style={{ fontFamily: "var(--font-outfit)" }}>
              <Link href="/founder/ideas" className="flex items-center gap-1.5"><PenLine className="h-3.5 w-3.5" />New idea</Link>
            </Button>
            <Button asChild size="sm" className="h-8.5 rounded-full bg-foreground/[0.02] border border-border/10 text-foreground/70 hover:text-foreground hover:bg-foreground/5 hover:border-border/20 transition-all duration-300 font-semibold text-xs px-4.5 cursor-pointer" style={{ fontFamily: "var(--font-outfit)" }}>
              <Link href="/founder/funding" className="flex items-center gap-1.5"><TrendingUp className="h-3.5 w-3.5" />Milestones</Link>
            </Button>
          </div>
        }
      />

      {/* ── Alert banner — full width strip ── */}
      <div className="relative overflow-hidden rounded-r-xl border-l-[3px] border-[#C88E72] bg-[#C88E72]/[0.03] py-4 px-5 mb-10">
        <div className="flex flex-col sm:flex-row sm:items-center gap-4 relative z-10">
          <div className="flex items-center gap-2 shrink-0">
            <span className="relative flex h-1.5 w-1.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#C88E72] opacity-75"></span>
              <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-[#C88E72]"></span>
            </span>
            <span className="text-[9px] font-mono uppercase tracking-[0.15em] text-[#C88E72] font-semibold">Verification Alert</span>
          </div>
          <p className="flex-1 text-[12.5px] text-foreground/60 leading-relaxed font-sans">
            <span className="text-foreground font-medium">Milestone 2</span> is pending verification — submit proof to release{" "}
            <span className="text-[#C88E72] font-medium tabular-nums">$40,000</span> from escrow.
          </p>
          <Link href="/founder/funding" className="shrink-0 text-xs font-medium text-[#C88E72] hover:text-[#C88E72]/85 transition-colors flex items-center gap-1 self-start sm:self-auto group font-sans">
            Submit request <ArrowRight className="h-3.5 w-3.5 group-hover:translate-x-0.5 transition-transform" />
          </Link>
        </div>
      </div>

      {/* ── KPI Stats Row — full width command bar ── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-8 py-8 border-y border-border/[0.03] mb-12">
        <KpiStat label="Funds raised" rawValue={fundsRaw} isCurrency sub="+$4,400 this week" />
        <KpiStat label="Active ideas" rawValue={2} sub="2 in progress" />
        <KpiStat label="Team members" rawValue={3} sub="All active" />
        <KpiStat label="Unread chats" rawValue={kpis.unreadChats} sub="1 new thread" />
      </div>

      {/* ── Two-column body ── */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-10 xl:gap-14">

        {/* ── Left column (3/5): Escrow + Ideas ── */}
        <div className="lg:col-span-3 space-y-14">

          {/* Milestone Escrow Pool */}
          <div>
            <div className="flex items-baseline justify-between gap-4 border-b border-border/[0.03] pb-5 mb-8">
              <div className="space-y-1">
                <SectionLabel>Milestone Escrow Pool</SectionLabel>
                <p className="text-xs text-foreground/40">Funds held in secure multi-signature escrow.</p>
              </div>
              <div className="flex items-baseline gap-1.5 shrink-0">
                <span className="text-xs text-foreground/35">Released</span>
                <span className="text-2xl font-serif font-light text-brand-accent">{escrowPct}%</span>
              </div>
            </div>

            <div className="flex items-baseline gap-2 mb-5">
              <span className="text-3xl sm:text-4xl font-serif font-light tracking-tight text-foreground">
                ${escrow.raised.toLocaleString()}
              </span>
              <span className="text-xs font-mono text-foreground/30">/ ${escrow.goal.toLocaleString()} total</span>
            </div>

            <div className="h-px w-full bg-foreground/[0.04] overflow-hidden mb-8 relative">
              <div
                className="h-full bg-brand-accent/60 transition-all duration-1000"
                style={{ width: `${escrowPct}%` }}
              />
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {[
                { label: "Whitepaper & Specs",    amount: "$40K", done: true,  pending: false },
                { label: "Alpha & Sync Engine",   amount: "$40K", done: false, pending: true  },
                { label: "Security Audit & Beta", amount: "$40K", done: false, pending: false },
                { label: "Mainnet Launch",        amount: "$80K", done: false, pending: false },
              ].map((m, i) => (
                <div key={i} className="space-y-2 py-3.5 px-3 rounded-lg border border-border/[0.03] hover:border-border/[0.06] hover:bg-foreground/[0.01] transition-all">
                  <div className="flex items-center gap-2">
                    <div className={cn(
                      "size-4 rounded-full border grid place-items-center",
                      m.done ? "bg-brand-accent/10 border-brand-accent/30 text-brand-accent" :
                      m.pending ? "bg-[#C88E72]/10 border-[#C88E72]/30 text-[#C88E72] animate-pulse" :
                      "bg-foreground/[0.01] border-border/10 text-foreground/10"
                    )}>
                      {m.done    ? <CheckCircle2 className="h-2.5 w-2.5" />
                       : m.pending ? <Clock className="h-2.5 w-2.5" />
                       : <Lock className="h-2.5 w-2.5" />}
                    </div>
                    <span className={cn("text-[10px] font-mono font-semibold",
                      m.done ? "text-foreground/70" : m.pending ? "text-[#C88E72]" : "text-foreground/18"
                    )}>{m.amount}</span>
                  </div>
                  <div>
                    <p className={cn("text-[11px] font-medium leading-snug",
                      m.done ? "text-foreground/75" : m.pending ? "text-foreground/55" : "text-foreground/25"
                    )}>{m.label}</p>
                    <p className={cn("text-[8px] font-mono uppercase tracking-[0.12em] mt-1",
                      m.done ? "text-brand-accent/70" : m.pending ? "text-[#C88E72]/70" : "text-foreground/18"
                    )}>
                      {m.done ? "Released" : m.pending ? "Pending" : "Locked"}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Your Ideas */}
          <div className="border-t border-border/[0.03] pt-10">
            <div className="flex items-center justify-between border-b border-border/[0.03] pb-4 mb-6">
              <div className="space-y-1">
                <SectionLabel>Your ideas</SectionLabel>
                <p className="text-xs text-foreground/40">Submission status and funding tracking.</p>
              </div>
              <Link href="/founder/ideas" className="text-[10px] font-mono uppercase tracking-[0.15em] text-brand-accent hover:text-brand-accent/75 transition-colors flex items-center gap-1 font-semibold">
                All ideas <ArrowRight className="h-3 w-3" />
              </Link>
            </div>
            <div className="divide-y divide-border/[0.03]">
              {ideas.map((idea) => (
                <IdeaRow key={idea.id} idea={idea} />
              ))}
            </div>
          </div>
        </div>

        {/* ── Right column (2/5): Team + Activity ── */}
        <div className="lg:col-span-2 lg:border-l lg:border-border/[0.03] lg:pl-8 xl:pl-10 space-y-10">

          {/* Team Sync */}
          <div className="space-y-5">
            <div className="border-b border-border/[0.03] pb-3.5">
              <SectionLabel>Team synchronization</SectionLabel>
              <p className="text-[11px] text-foreground/38 mt-1 font-sans">Real-time presence and active roles.</p>
            </div>
            <div className="space-y-1">
              {team.map((m) => (
                <div key={m.id} className="flex items-center gap-3 py-2.5 px-2 rounded-lg hover:bg-foreground/[0.02] transition-all cursor-default">
                  <div className="h-7 w-7 rounded-full bg-foreground/[0.04] border border-border/10 text-foreground/60 text-[9px] font-bold grid place-items-center shrink-0 font-mono">
                    {m.initials}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-[11px] font-semibold text-foreground/85 truncate">{m.name}</div>
                    <div className="text-[9px] text-foreground/30 font-mono mt-0.5 uppercase tracking-wide truncate">{m.role}</div>
                  </div>
                  <span className="text-[9px] font-mono text-foreground/25 shrink-0 tabular-nums">{m.lastActive}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Recent Activity */}
          <div className="space-y-5 border-t border-border/[0.03] pt-8">
            <div className="border-b border-border/[0.03] pb-3.5">
              <SectionLabel>Recent activity</SectionLabel>
              <p className="text-[11px] text-foreground/38 mt-1 font-sans">System updates and interactions.</p>
            </div>
            <div className="space-y-1">
              {activity.map((item) => (
                <div key={item.id} className="flex items-start gap-3 py-2.5 px-2 rounded-lg hover:bg-foreground/[0.02] transition-all cursor-default">
                  <span className={cn(
                    "mt-[5px] h-1.5 w-1.5 rounded-full shrink-0",
                    item.important ? "bg-[#C88E72]" : "bg-foreground/12"
                  )} />
                  <div className="flex-1 min-w-0">
                    <p className={cn("text-[11px] leading-relaxed", item.important ? "text-foreground/80 font-medium" : "text-foreground/40")}>
                      {item.text}
                    </p>
                    <span className="text-[8px] font-mono text-foreground/22 uppercase tracking-wider mt-0.5 block">{item.timestamp}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>
      </div>

    </div>
  )
}

// ─── Shared ───────────────────────────────────────────────────────────────────
function SectionLabel({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <p className={cn("text-[9px] font-mono uppercase tracking-[0.2em] text-foreground/35", className)}>
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
      <div className="text-xs text-foreground/40 font-sans font-light tracking-wide">{label}</div>
      <div className="text-3xl sm:text-4xl font-serif font-light text-foreground/95 mt-1.5 tracking-tight group-hover:scale-[1.01] duration-300 origin-left transition-transform">
        {display}
      </div>
      <div className="text-[10px] text-foreground/30 font-sans font-light mt-1.5">{sub}</div>
    </div>
  )
}

function IdeaRow({ idea }: { idea: Idea }) {
  const s = {
    Funded:  { text: "text-brand-accent", bg: "bg-brand-accent/5", border: "border-brand-accent/10" },
    Seeking: { text: "text-[#C88E72]",  bg: "bg-[#C88E72]/5",  border: "border-[#C88E72]/10" },
    Draft:   { text: "text-foreground/30",  bg: "bg-foreground/[0.01]",  border: "border-border/5" },
  }[idea.status]

  return (
    <div className="group relative py-5 flex flex-col md:flex-row md:items-center justify-between gap-4 transition-all duration-200 hover:px-2 rounded-lg -mx-2 hover:bg-foreground/[0.01]">
      <div className="flex-1 space-y-1.5">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-sm font-semibold text-foreground/80 group-hover:text-brand-accent transition-colors duration-300">
            {idea.title}
          </span>
          <Badge className={cn("text-[9px] font-semibold uppercase tracking-widest px-2 py-0.5 border rounded-full shrink-0", s.text, s.bg, s.border)}>
            {idea.status}
          </Badge>
          <span className="text-[9px] font-mono text-foreground/35 uppercase tracking-widest bg-foreground/[0.03] border border-border/5 px-2 py-0.5 rounded">{idea.stage}</span>
        </div>
        
        {/* Tags */}
        <div className="flex gap-1.5 flex-wrap">
          {idea.tags.map((tag) => (
            <span key={tag} className="text-[9px] font-mono text-foreground/30 bg-foreground/[0.01] border border-border/[0.03] rounded px-1.5 py-0.5">
              #{tag}
            </span>
          ))}
        </div>
      </div>

      {/* Funding Progress */}
      <div className="w-full md:w-48 space-y-1.5 shrink-0">
        <div className="flex justify-between text-[9px] font-mono text-foreground/35">
          <span>{idea.funding}</span>
          <span className="font-semibold">{idea.fundedPct}%</span>
        </div>
        <div className="h-0.5 w-full rounded-full bg-foreground/[0.03] overflow-hidden">
          <div
            className={cn("h-full rounded-full transition-all duration-700",
              idea.fundedPct === 100 ? "bg-brand-accent" : "bg-foreground/20"
            )}
            style={{ width: `${idea.fundedPct}%` }}
          />
        </div>
      </div>

      {/* Link button */}
      <Link href={`/founder/ideas/${idea.id}`}
        className="shrink-0 text-[10px] font-semibold text-foreground/60 hover:text-foreground transition-colors flex items-center gap-1 align-middle justify-center py-1.5 px-3 border border-border/10 hover:border-border/20 rounded-lg bg-transparent">
        Explore <ArrowUpRight className="h-3 w-3 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
      </Link>
    </div>
  )
}
