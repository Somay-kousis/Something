"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  CheckCircle2,
  AlertCircle,
  Lock,
  Coins,
  Clock,
  Check,
  PlusCircle,
  ExternalLink,
  ShieldCheck,
  Send,
  Loader2,
} from "lucide-react"
import { cn } from "@/lib/utils"

import { PageHeader } from "@/components/page-header"

// Types
type MilestoneStatus = "Released" | "Pending Verification" | "Active" | "Locked"

interface Milestone {
  id: string
  title: string
  amount: string
  status: MilestoneStatus
  description: string
  submittedDate?: string
  releasedDate?: string
  proofLink?: string
  workSummary?: string
}

// Initial Mock Milestones
const INITIAL_MILESTONES: Milestone[] = [
  {
    id: "m1",
    title: "Milestone 1: Whitepaper & Architecture Specs",
    amount: "$40,000",
    status: "Released",
    description: "Publish the core decentralization design draft, API specs, and system engineering schemas.",
    releasedDate: "2026-05-15",
    proofLink: "https://github.com/something/docs/whitepaper.md",
    workSummary: "Finalized whitepaper specs and local-first architecture details with team and advisory board approval.",
  },
  {
    id: "m2",
    title: "Milestone 2: Alpha Application & Sync Engine",
    amount: "$40,000",
    status: "Pending Verification",
    description: "Launch prototype workspace featuring local-first SQLite nodes syncing peer-to-peer.",
    submittedDate: "2026-06-18",
    proofLink: "https://alpha.something.dev",
    workSummary: "Sync engine prototype is live. Tested peer synchronization with 5 concurrent active nodes.",
  },
  {
    id: "m3",
    title: "Milestone 3: Security Audit & Public Beta",
    amount: "$40,000",
    status: "Active",
    description: "Conduct smart contract security audits, launch public landing sandbox, onboard 100 beta testing founders.",
  },
  {
    id: "m4",
    title: "Milestone 4: Mainnet Launch & Public APIs",
    amount: "$80,000",
    status: "Locked",
    description: "Deploy stable production release on decentralized nodes and publish public developer documentation.",
  },
]

export default function FounderFundingPage() {
  const [milestones, setMilestones] = useState<Milestone[]>([])
  const [isOpen, setIsOpen] = useState(false)
  const [selectedMilestoneId, setSelectedMilestoneId] = useState("")
  const [proofLink, setProofLink] = useState("")
  const [workSummary, setWorkSummary] = useState("")
  const [submitting, setSubmitting] = useState(false)

  // Calculate Request Payout progress
  const isProofLinkValid = (proofLink.startsWith("http://") || proofLink.startsWith("https://")) && proofLink.includes(".")
  const progressPercent = selectedMilestoneId
    ? (40 + (isProofLinkValid ? 30 : 0) + (workSummary.trim().length >= 10 ? 30 : 0))
    : 0


  // Load from local storage or set defaults
  useEffect(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("founder_milestones")
      if (saved) {
        setMilestones(JSON.parse(saved))
      } else {
        setMilestones(INITIAL_MILESTONES)
        localStorage.setItem("founder_milestones", JSON.stringify(INITIAL_MILESTONES))
      }
    }
  }, [])

  // Save to local storage
  const saveMilestones = (updated: Milestone[]) => {
    setMilestones(updated)
    localStorage.setItem("founder_milestones", JSON.stringify(updated))
  }

  // Calculate statistics
  const totalFunding = 200000 // $200,000 total
  const releasedAmount = milestones
    .filter((m) => m.status === "Released")
    .reduce((acc, curr) => acc + parseInt(curr.amount.replace(/[^0-9]/g, "")), 0)
  const pendingAmount = milestones
    .filter((m) => m.status === "Pending Verification")
    .reduce((acc, curr) => acc + parseInt(curr.amount.replace(/[^0-9]/g, "")), 0)
  const lockedAmount = totalFunding - releasedAmount - pendingAmount

  // Find milestones that can request payout (Active status)
  const payoutEligibleMilestones = milestones.filter((m) => m.status === "Active")

  // Handle request payout submission
  const handleRequestPayout = (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedMilestoneId || !proofLink.trim() || !workSummary.trim()) {
      alert("Please fill in all fields")
      return
    }

    setSubmitting(true)

    // Simulate network submission delay
    setTimeout(() => {
      const updated = milestones.map((m) => {
        if (m.id === selectedMilestoneId) {
          return {
            ...m,
            status: "Pending Verification" as const,
            submittedDate: new Date().toISOString().split("T")[0],
            proofLink,
            workSummary,
          }
        }
        return m
      })

      saveMilestones(updated)
      setSubmitting(false)
      setIsOpen(false)
      // Reset form
      setSelectedMilestoneId("")
      setProofLink("")
      setWorkSummary("")
    }, 1200)
  }

  return (
    <div className="mx-auto max-w-4xl space-y-12 pt-4 pb-20">
      {/* Sleek inline header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2">
        <div className="flex flex-col gap-1">
          <h2 className="text-2xl font-bold tracking-tight text-white font-outfit">Funding Escrow Pool</h2>
          <p className="text-white/45 text-xs font-sans font-medium">Track secured community funding locked in escrow and request milestone payouts.</p>
        </div>
        <div className="flex items-center gap-2">
          <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
              <Button
                disabled={payoutEligibleMilestones.length === 0}
                className="rounded-xl text-xs font-semibold px-4 py-2 bg-white text-[#0a0a0c] hover:bg-brand-accent hover:text-[#0a0a0c] transition-all duration-300 disabled:opacity-40 disabled:hover:bg-white active:scale-[0.98] cursor-pointer h-9"
              >
                <PlusCircle className="mr-1.5 h-4 w-4 text-inherit" /> Request Payout
              </Button>
            </DialogTrigger>
            <DialogContent className="bg-[#0b0c0e]/95 backdrop-blur-2xl border border-white/[0.08] text-white rounded-2xl sm:max-w-3xl shadow-2xl p-0 overflow-hidden max-h-[92vh] flex flex-col">
              
              {/* Top Form Progress Bar */}
              <div className="w-full h-[3px] bg-white/[0.03]">
                <div 
                  className="h-full bg-brand-accent transition-all duration-500 ease-out"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>

              <DialogHeader className="p-6 pb-4 border-b border-white/[0.05] shrink-0">
                <DialogTitle className="text-xl font-bold tracking-tight text-white flex items-center gap-2" style={{ fontFamily: "var(--font-outfit)" }}>
                  <Coins className="h-5 w-5 text-brand-accent" />
                  Request Milestone Payout
                </DialogTitle>
                <DialogDescription className="text-white/40 text-xs mt-1">
                  Provide verifiable completion proof. Investors will review the inputs and release escrow funds.
                </DialogDescription>
              </DialogHeader>

              <form onSubmit={handleRequestPayout} className="flex-1 flex flex-col overflow-hidden">
                {/* Scrollable Form Container */}
                <div className="flex-1 overflow-y-auto p-6 pr-4 space-y-5 max-h-[60vh] [&::-webkit-scrollbar]:w-1 [&::-webkit-scrollbar-thumb]:bg-white/10 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-track]:bg-transparent">
                  
                  {/* Side-by-Side Content Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    
                    {/* Left Column: Milestone Selector */}
                    <div className="space-y-2">
                      <label className="text-[10px] text-white/50 font-semibold uppercase tracking-wider font-mono block">Select Active Milestone *</label>
                      <div className="grid gap-2.5 max-h-[300px] overflow-y-auto pr-1 [&::-webkit-scrollbar]:w-1 [&::-webkit-scrollbar-thumb]:bg-white/10 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-track]:bg-transparent">
                        {payoutEligibleMilestones.map((m) => {
                          const selected = selectedMilestoneId === m.id
                          return (
                            <button
                              type="button"
                              key={m.id}
                              onClick={() => setSelectedMilestoneId(m.id)}
                              className={cn(
                                "flex flex-col items-start p-4 rounded-xl border text-left transition-all duration-300 group cursor-pointer w-full relative overflow-hidden",
                                selected
                                  ? "bg-brand-accent/10 border-brand-accent/40"
                                  : "bg-black/30 border-white/5 hover:bg-white/[0.02] hover:border-white/10"
                              )}
                            >
                              <div className="flex items-center justify-between w-full mb-1">
                                <span className="text-[9px] text-brand-accent font-semibold tracking-wider font-mono uppercase bg-brand-accent/10 border border-brand-accent/20 px-2 py-0.5 rounded-full">
                                  {m.title.split(":")[0]}
                                </span>
                                <div className="flex items-center gap-2">
                                  <span className="text-xs font-mono font-bold text-white">{m.amount}</span>
                                  {selected && (
                                    <div className="p-0.5 rounded-full bg-brand-accent/20 border border-brand-accent/30 text-brand-accent">
                                      <Check className="h-3 w-3 animate-scale-in" />
                                    </div>
                                  )}
                                </div>
                              </div>
                              <h4 className={cn(
                                "text-xs font-bold mt-1.5 leading-snug transition-colors",
                                selected ? "text-white" : "text-white/80"
                              )}>
                                {m.title.split(":")[1]?.trim() || m.title}
                              </h4>
                              <p className="text-[10px] text-white/40 mt-1 leading-normal font-sans">
                                {m.description}
                              </p>
                            </button>
                          )
                        })}
                        {payoutEligibleMilestones.length === 0 && (
                          <div className="text-xs text-white/30 text-center py-8 border border-dashed border-white/5 rounded-xl bg-white/[0.002]">
                            No milestones eligible for verification/payout.
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Right Column: Inputs */}
                    <div className="space-y-4">
                      {/* Verifiable Proof Link with Live Validation */}
                      <div className="space-y-1.5">
                        <div className="flex justify-between items-center">
                          <label className="text-[10px] text-white/50 font-semibold uppercase tracking-wider font-mono">Verifiable Proof Link *</label>
                          {proofLink.trim() && (
                            <span className={cn(
                              "text-[9px] font-mono font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full flex items-center gap-1",
                              isProofLinkValid
                                ? "text-emerald-400 bg-emerald-500/10 border border-emerald-500/20"
                                : "text-amber-400 bg-amber-500/10 border border-amber-500/20"
                            )}>
                              {isProofLinkValid ? (
                                <>
                                  <Check className="h-2.5 w-2.5" /> Valid URL Format
                                </>
                              ) : (
                                "Incomplete URL"
                              )}
                            </span>
                          )}
                        </div>
                        <div className="relative">
                          <ExternalLink className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-white/30" />
                          <Input
                            placeholder="e.g. https://github.com/something/release or https://alpha.site"
                            value={proofLink}
                            onChange={(e) => setProofLink(e.target.value)}
                            className={cn(
                              "bg-black/40 border-white/5 text-white placeholder:text-white/20 rounded-lg text-xs h-9 pl-9 transition-all duration-300",
                              isProofLinkValid
                                ? "focus-visible:ring-emerald-500/20 focus-visible:border-emerald-500/30 border-emerald-500/10 shadow-[0_0_10px_rgba(16,185,129,0.03)]" 
                                : "focus-visible:ring-white/10 focus-visible:border-white/20"
                            )}
                            required
                          />
                        </div>
                      </div>

                      {/* Summary of Deliverables */}
                      <div className="space-y-1.5">
                        <div className="flex justify-between items-center">
                          <label className="text-[10px] text-white/50 font-semibold uppercase tracking-wider font-mono">Summary of Deliverables *</label>
                          <span className="text-[9px] font-mono text-white/30">{workSummary.length}/500</span>
                        </div>
                        <Textarea
                          maxLength={500}
                          placeholder="Detail the exact deliverables and code milestones accomplished..."
                          value={workSummary}
                          onChange={(e) => setWorkSummary(e.target.value)}
                          className={cn(
                            "min-h-[140px] bg-black/40 border-white/5 text-white placeholder:text-white/20 rounded-lg text-xs leading-relaxed transition-all duration-300",
                            workSummary.trim().length >= 10 
                              ? "focus-visible:ring-emerald-500/20 focus-visible:border-emerald-500/30 border-emerald-500/10 shadow-[0_0_10px_rgba(16,185,129,0.03)]" 
                              : "focus-visible:ring-white/10 focus-visible:border-white/20"
                          )}
                          required
                        />
                      </div>
                    </div>

                  </div>

                </div>

                {/* Fixed Actions Footer */}
                <div className="flex gap-2 justify-end p-6 border-t border-white/[0.05] bg-black/40 shrink-0">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setIsOpen(false)}
                    className="border-white/10 text-white hover:bg-white/5 text-xs font-semibold rounded-lg h-9 px-4 bg-transparent cursor-pointer"
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    disabled={submitting || !selectedMilestoneId || !proofLink.trim() || !workSummary.trim()}
                    className="bg-white text-black hover:bg-brand-accent hover:text-black text-xs font-semibold h-9 px-5 rounded-lg flex items-center gap-1.5 transition-all cursor-pointer"
                  >
                    {submitting ? (
                      <>
                        <Loader2 className="h-3.5 w-3.5 animate-spin" /> Submitting...
                      </>
                    ) : (
                      <>
                        <Send className="h-3 w-3" /> Submit Request
                      </>
                    )}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
          <Button
            variant="outline"
            onClick={() => {
              if (confirm("Reset milestones to initial demo data?")) {
                saveMilestones(INITIAL_MILESTONES)
              }
            }}
            className="border border-white/10 text-white/60 hover:bg-white/5 hover:text-white rounded-xl text-xs h-9 px-4 font-semibold bg-transparent cursor-pointer"
          >
            Reset Demo Data
          </Button>
        </div>
      </div>

      {/* Escrow Pool Balance Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-6 py-6 border-y border-white/5">
        {/* Total Pool */}
        <div className="space-y-1.5">
          <span className="text-[10px] font-mono font-semibold uppercase tracking-wider text-white/35">Total Pool Target</span>
          <div className="text-2xl sm:text-3xl font-bold tracking-tight text-white font-outfit">
            ${totalFunding.toLocaleString()}
          </div>
          <p className="text-[10px] font-mono text-white/35">100% of target</p>
        </div>

        {/* Released */}
        <div className="space-y-1.5">
          <span className="text-[10px] font-mono font-semibold uppercase tracking-wider text-white/35">Released to Date</span>
          <div className="text-2xl sm:text-3xl font-bold tracking-tight text-brand-accent font-outfit">
            ${releasedAmount.toLocaleString()}
          </div>
          <p className="text-[10px] font-mono text-white/35">
            {((releasedAmount / totalFunding) * 100).toFixed(0)}% Disbursed
          </p>
        </div>

        {/* Pending Verification */}
        <div className="space-y-1.5">
          <span className="text-[10px] font-mono font-semibold uppercase tracking-wider text-white/35">Pending Release</span>
          <div className="text-2xl sm:text-3xl font-bold tracking-tight text-[#C88E72] font-outfit">
            ${pendingAmount.toLocaleString()}
          </div>
          <p className="text-[10px] font-mono text-white/35">Awaiting committee</p>
        </div>

        {/* Locked in Escrow */}
        <div className="space-y-1.5">
          <span className="text-[10px] font-mono font-semibold uppercase tracking-wider text-white/35">Locked in Escrow</span>
          <div className="text-2xl sm:text-3xl font-bold tracking-tight text-white/70 font-outfit">
            ${lockedAmount.toLocaleString()}
          </div>
          <p className="text-[10px] font-mono text-white/35">Matures upcoming</p>
        </div>
      </div>

      {/* Escrow Pool Progress Bar */}
      <div className="py-4 space-y-3">
        <div className="flex justify-between items-center text-[10px] font-mono font-bold tracking-widest uppercase text-white/40">
          <span>Escrow Release Progress</span>
          <span className="text-white/70 text-xs font-semibold font-sans">
            ${releasedAmount.toLocaleString()} / ${totalFunding.toLocaleString()} Released
          </span>
        </div>
        <Progress value={(releasedAmount / totalFunding) * 100} className="h-2 bg-white/5" />
        <div className="flex items-center justify-between text-[9px] text-white/30 pt-0.5 font-mono tracking-wider">
          <span>START</span>
          <span className="text-brand-accent font-semibold">{((releasedAmount / totalFunding) * 100).toFixed(1)}% SECURED RELEASED</span>
          <span>GOAL</span>
        </div>
      </div>

      {/* Milestones Road Map and Timelines */}
      <div className="grid gap-8 lg:grid-cols-3">
        {/* Timeline Grid */}
        <div className="lg:col-span-2 space-y-6">
          <div className="border-b border-white/5 pb-3">
            <h3 className="text-sm font-semibold tracking-widest uppercase text-white/45 font-mono">Milestone Timeline</h3>
          </div>
          <div className="space-y-8 relative pt-2">
            {/* Center connector line */}
            <div className="absolute left-[17px] top-6 bottom-6 w-[1px] bg-white/5 pointer-events-none" />

            {milestones.map((m) => {
              const isReleased = m.status === "Released"
              const isPending = m.status === "Pending Verification"
              const isActive = m.status === "Active"
              const isLocked = m.status === "Locked"

              return (
                <div key={m.id} className="relative flex items-start gap-4 sm:gap-6 group">
                  {/* Status Indicator Bubble */}
                  <div
                    className={cn(
                      "relative z-10 size-9 rounded-full grid place-items-center border transition-all duration-300 bg-[#0a0a0c]",
                      isReleased
                        ? "border-brand-accent/40 text-brand-accent"
                        : isPending
                          ? "border-[#C88E72]/40 text-[#C88E72] animate-pulse"
                          : isActive
                            ? "border-brand-accent/40 text-brand-accent"
                            : "border-white/5 text-white/20"
                    )}
                  >
                    {isReleased ? (
                      <Check className="h-4 w-4" />
                    ) : isPending ? (
                      <Clock className="h-4 w-4" />
                    ) : isActive ? (
                      <span className="size-2 rounded-full bg-brand-accent" />
                    ) : (
                      <Lock className="h-3.5 w-3.5" />
                    )}
                  </div>

                  {/* Milestone details (cardless) */}
                  <div className="flex-1 space-y-3">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <h3
                        className={cn(
                          "font-semibold text-base leading-snug transition-colors",
                          isReleased ? "text-brand-accent" : isPending ? "text-[#C88E72]" : "text-white"
                        )}
                      >
                        {m.title}
                      </h3>
                      <div className="flex items-center gap-2 shrink-0">
                        <span className="font-mono text-xs font-semibold text-white/50">{m.amount}</span>
                        <Badge
                          className={cn(
                            "text-[8px] font-semibold tracking-wider uppercase px-2 py-0.5 rounded-full border",
                            isReleased
                              ? "bg-brand-accent/10 text-brand-accent border-brand-accent/20"
                              : isPending
                                ? "bg-[#C88E72]/10 text-[#C88E72] border-[#C88E72]/20"
                                : isActive
                                  ? "bg-white/5 text-white/70 border-white/10"
                                  : "bg-white/5 text-white/40 border-white/10"
                          )}
                        >
                          {m.status === "Pending Verification" ? "Pending" : m.status}
                        </Badge>
                      </div>
                    </div>

                    <p className="text-sm text-white/60 leading-relaxed font-sans">{m.description}</p>

                    {/* Submissions & Deliverables logs */}
                    {(isReleased || isPending) && (
                      <div className="space-y-2.5 text-xs pt-1">
                        <div className="flex flex-wrap items-center justify-between gap-1.5 text-white/40 font-mono text-[9px] tracking-wide">
                          <span>
                            {isReleased ? "APPROVED & DISBURSED" : "SUBMITTED FOR VALIDATION"}
                          </span>
                          <span>
                            DATE: {isReleased ? m.releasedDate : m.submittedDate}
                          </span>
                        </div>
                        {m.workSummary && (
                          <div className="bg-white/[0.01] border border-white/5 rounded-xl p-3 text-white/70 text-xs italic leading-relaxed">
                            &ldquo;{m.workSummary}&rdquo;
                          </div>
                        )}
                        {m.proofLink && (
                          <div className="flex items-center gap-1.5 pt-0.5">
                            <span className="text-[9px] font-mono text-white/35 uppercase tracking-widest">PROOF:</span>
                            <a
                              href={m.proofLink}
                              target="_blank"
                              rel="noreferrer"
                              className="text-brand-accent hover:underline flex items-center gap-1 font-mono text-[10px] truncate"
                            >
                              {m.proofLink} <ExternalLink className="h-3 w-3" />
                            </a>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Security & Validation details */}
        <div className="space-y-12">
          {/* Validation Committee */}
          <div className="space-y-4">
            <div className="border-b border-white/5 pb-3">
              <h3 className="text-sm font-semibold tracking-widest uppercase text-white/45 font-mono">Validation Committee</h3>
            </div>
            <div className="space-y-4 pt-2">
              <div className="flex items-center gap-3">
                <div className="size-8 rounded-full bg-brand-accent/10 border border-brand-accent/20 text-brand-accent grid place-items-center text-xs font-semibold font-mono shadow">
                  SC
                </div>
                <div className="min-w-0">
                  <div className="text-sm font-semibold text-white">Sarah Chen</div>
                  <div className="text-[9px] text-brand-accent font-semibold tracking-wider font-mono uppercase">Lead Reviewer - Horizon Capital</div>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="size-8 rounded-full bg-[#F472B6]/10 border border-[#F472B6]/20 text-[#F472B6] grid place-items-center text-xs font-semibold font-mono shadow">
                  LV
                </div>
                <div className="min-w-0">
                  <div className="text-sm font-semibold text-white">Liam Vance</div>
                  <div className="text-[9px] text-[#F472B6] font-semibold tracking-wider font-mono uppercase">Reviewer - Vance Capital</div>
                </div>
              </div>

              <div className="pt-4 flex gap-2 text-xs text-white/50 bg-white/[0.01] rounded-xl p-3.5 border border-white/5 leading-relaxed font-sans">
                <ShieldCheck className="h-4 w-4 text-brand-accent shrink-0 mt-0.5" />
                <p>
                  Validation requires approval from at least <strong>50%</strong> of active review board members. Review is typically completed within 72 hours.
                </p>
              </div>
            </div>
          </div>

          {/* Escrow Guidelines */}
          <div className="space-y-4">
            <div className="border-b border-white/5 pb-3">
              <h3 className="text-sm font-semibold tracking-widest uppercase text-white/45 font-mono">Escrow Guidelines</h3>
            </div>
            <div className="space-y-4 pt-2 text-xs text-white/50 leading-relaxed font-sans">
              <p>
                1. Escrow pool funds are secured by smart contract and can only be disbursed to the verified project treasury after committee validation.
              </p>
              <p>
                2. Submitting milestone verification requires compiling proof documents (GitHub repository tag releases, test suites, or live deployments).
              </p>
              <p>
                3. If milestone deliverables require changes, reviewers will attach a feedback log detailing code reviews or functional gaps.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}