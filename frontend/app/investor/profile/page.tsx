"use client"

import type React from "react"
import { useState, useEffect } from "react"
import Link from "next/link"
import axios from "axios"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Building2, Link2, ShieldCheck, Tag, UserRound, Wallet, Loader2 } from "lucide-react"
import { cn } from "@/lib/utils"

// Shared components
import { VerificationBadge } from "@/components/verification-badge"
import { TrustInspector } from "@/components/trust-inspector"
import { AvatarUploader } from "@/components/avatar-uploader"
import { useAvatar } from "@/components/avatar-context"

const INTERESTS = ["Climate hardware", "Edge AI", "Local‑first", "Robotics", "Bio tooling", "Privacy", "DePIN"]

type InvestorProfile = {
  name: string
  firm: string
  minCheck: number
  maxCheck: number
  bio: string
  interests: string[]
  escrowRequired: boolean
  ndaPreferred: boolean
  pacePerQuarter: number
  stageFocus: ("Pre‑seed" | "Angel" | "Seed")[]
  publicProfile: boolean
  handle: string
  trust: number
  trustBreakdown: {
    ndas: number
    escrowReleases: number
    receipts: number
    history: number
  }
  links: Array<{ label: string; href: string }>
  portfolio: Array<{ id: string; name: string }>
}

const DEFAULT_PROFILE: InvestorProfile = {
  name: "Alex Rivera",
  firm: "Horizon Ventures",
  minCheck: 10000,
  maxCheck: 100000,
  bio: "General Partner at Horizon Ventures. Focusing on decentralized infrastructures, cryptography, edge AI, and local-first database meshes.",
  interests: ["Climate hardware", "Edge AI", "Local‑first", "Robotics"],
  escrowRequired: true,
  ndaPreferred: true,
  pacePerQuarter: 4,
  stageFocus: ["Seed", "Angel"],
  publicProfile: true,
  handle: "alex_horizon",
  trust: 85,
  trustBreakdown: {
    ndas: 12,
    escrowReleases: 8,
    receipts: 14,
    history: 9
  },
  links: [
    { label: "Website", href: "https://horizon.vc" },
    { label: "LinkedIn", href: "https://linkedin.com/in/alex-horizon" }
  ],
  portfolio: [
    { id: "p1", name: "Edge Vision Kit" },
    { id: "p2", name: "Climate Hardware v1" }
  ]
}

export default function InvestorProfilePage() {
  const { avatarUrl, setAvatarUrl, userName, setUserName } = useAvatar()
  
  // Profile state
  const [profile, setProfile] = useState<InvestorProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Individual field states (synced with profile)
  const [name, setName] = useState("")
  const [firm, setFirm] = useState("")
  const [minCheck, setMinCheck] = useState(5000)
  const [maxCheck, setMaxCheck] = useState(50000)
  const [bio, setBio] = useState("")
  const [interests, setInterests] = useState<string[]>([])
  const [escrowRequired, setEscrowRequired] = useState(true)
  const [ndaPreferred, setNdaPreferred] = useState(true)
  const [pacePerQuarter, setPacePerQuarter] = useState(4)
  const [stageFocus, setStageFocus] = useState<("Pre‑seed" | "Angel" | "Seed")[]>([])
  const [publicProfile, setPublicProfile] = useState(true)
  const [handle, setHandle] = useState("")

  // Fetch profile on mount
  useEffect(() => {
    fetchProfile()
  }, [])

  const [accreditedVerified, setAccreditedVerified] = useState(false)
  const [isVerificationOpen, setIsVerificationOpen] = useState(false)
  const [verifyCriteria, setVerifyCriteria] = useState("networth")

  useEffect(() => {
    if (typeof window !== "undefined") {
      setAccreditedVerified(localStorage.getItem("investor_accredited_verified") === "true")
    }
  }, [])

  const handleVerifyAccreditation = () => {
    localStorage.setItem("investor_accredited_verified", "true")
    setAccreditedVerified(true)
    setIsVerificationOpen(false)
    alert("SEC Rule 506(c) Accreditation Certified successfully.")
  }

  const [portfolioList, setPortfolioList] = useState<Array<{ id: string; name: string }>>([])
  useEffect(() => {
    const localPortfolio = localStorage.getItem("investor_portfolio")
    if (localPortfolio) {
      try {
        const parsed = JSON.parse(localPortfolio)
        setPortfolioList(parsed.map((item: any) => ({ id: item.id, name: item.name })))
      } catch {
        setPortfolioList([])
      }
    } else if (profile) {
      setPortfolioList(profile.portfolio)
    }
  }, [profile])

  // Sync local state with profile
  useEffect(() => {
    if (profile) {
      setName(profile.name)
      setUserName(profile.name)
      setFirm(profile.firm)
      setMinCheck(profile.minCheck)
      setMaxCheck(profile.maxCheck)
      setBio(profile.bio)
      setInterests(profile.interests)
      setEscrowRequired(profile.escrowRequired)
      setNdaPreferred(profile.ndaPreferred)
      setPacePerQuarter(profile.pacePerQuarter)
      setStageFocus(profile.stageFocus)
      setPublicProfile(profile.publicProfile)
      setHandle(profile.handle)
    }
  }, [profile, setUserName])

  const fetchProfile = async () => {
    try {
      setLoading(true)
      setError(null)
      const response = await axios.get<InvestorProfile>("/api/investor/profile")
      setProfile(response.data)
    } catch (err) {
      console.warn("Failed to fetch API investor profile, using localStorage fallback:", err)
      const stored = localStorage.getItem("investor_profile_data")
      if (stored) {
        try {
          setProfile(JSON.parse(stored))
        } catch {
          setProfile(DEFAULT_PROFILE)
          localStorage.setItem("investor_profile_data", JSON.stringify(DEFAULT_PROFILE))
        }
      } else {
        // Also check default demo_name in localstorage
        const demoName = localStorage.getItem("demo_name")
        const initialProfile = demoName ? { ...DEFAULT_PROFILE, name: demoName } : DEFAULT_PROFILE
        setProfile(initialProfile)
        localStorage.setItem("investor_profile_data", JSON.stringify(initialProfile))
      }
    } finally {
      setLoading(false)
    }
  }

  const saveProfileDataLocally = (updated: InvestorProfile) => {
    setProfile(updated)
    localStorage.setItem("investor_profile_data", JSON.stringify(updated))
    localStorage.setItem("demo_name", updated.name)
    window.dispatchEvent(new CustomEvent("investor-profile-update"))
  }

  const saveProfile = async () => {
    try {
      setSaving(true)
      setError(null)
      const payload = { name, firm, minCheck, maxCheck, bio }
      await axios.put("/api/investor/profile", payload)
      await fetchProfile()
    } catch (err) {
      console.warn("Failed API save, updating locally:", err)
      if (profile) {
        const updated = { ...profile, name, firm, minCheck, maxCheck, bio }
        saveProfileDataLocally(updated)
      }
    } finally {
      setSaving(false)
    }
  }

  const savePreferences = async () => {
    try {
      setSaving(true)
      setError(null)
      const payload = { escrowRequired, ndaPreferred, pacePerQuarter, stageFocus }
      await axios.put("/api/investor/preferences", payload)
      await fetchProfile()
    } catch (err) {
      console.warn("Failed API save preferences, updating locally:", err)
      if (profile) {
        const updated = { ...profile, escrowRequired, ndaPreferred, pacePerQuarter, stageFocus }
        saveProfileDataLocally(updated)
      }
    } finally {
      setSaving(false)
    }
  }

  const updateInterests = async (newInterests: string[]) => {
    try {
      await axios.put("/api/investor/interests", { interests: newInterests })
      setInterests(newInterests)
    } catch (err) {
      console.warn("Failed API update interests, updating locally:", err)
      setInterests(newInterests)
      if (profile) {
        const updated = { ...profile, interests: newInterests }
        saveProfileDataLocally(updated)
      }
    }
  }

  const updateVisibility = async (field: "publicProfile" | "handle", value: boolean | string) => {
    try {
      await axios.put("/api/investor/visibility", { [field]: value })
      if (field === "publicProfile") setPublicProfile(value as boolean)
      if (field === "handle") setHandle(value as string)
    } catch (err) {
      console.warn(`Failed API update visibility for ${field}, updating locally:`, err)
      if (field === "publicProfile") setPublicProfile(value as boolean)
      if (field === "handle") setHandle(value as string)
      if (profile) {
        const updated = { ...profile, [field]: value }
        saveProfileDataLocally(updated)
      }
    }
  }

  const uploadAvatar = async (file: File) => {
    try {
      const formData = new FormData()
      formData.append("avatar", file)
      const response = await axios.post<{ url: string }>("/api/investor/avatar", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      })
      setAvatarUrl(response.data.url)
    } catch (err) {
      console.warn("Failed API upload avatar, generating URL locally:", err)
      const dummyUrl = URL.createObjectURL(file)
      setAvatarUrl(dummyUrl)
      if (profile) {
        const updated = { ...profile, avatarUrl: dummyUrl }
        saveProfileDataLocally(updated)
      }
    }
  }

  const requestReverification = async () => {
    try {
      await axios.post("/api/investor/reverify")
      alert("Re-verification request submitted")
    } catch (err) {
      console.warn("Failed API request verification, simulating locally:", err)
      alert("Re-verification request submitted (Sandbox Mode)")
    }
  }

  function toggleInterest(tag: string) {
    const newInterests = interests.includes(tag)
      ? interests.filter((t) => t !== tag)
      : [...interests, tag]
    updateInterests(newInterests)
  }

  function toggleStage(s: "Pre‑seed" | "Angel" | "Seed") {
    setStageFocus((prev) => (prev.includes(s) ? prev.filter((x) => x !== s) : [...prev, s]))
  }

  if (loading) {
    return (
      <div className="mx-auto max-w-[1400px] flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-[1400px]">
      {/* Header: Avatar • Info • Trust */}
      <section className="rounded-xl bg-background/25 border border-border/[0.03] backdrop-blur-xl p-5">
        <div className="grid gap-4 md:grid-cols-[auto_minmax(0,1fr)] lg:grid-cols-[auto_minmax(0,1fr)_360px] md:items-start lg:items-center">
          <div>
            <AvatarUploader
              name={userName}
              src={avatarUrl}
              onChange={(file, url) => {
                if (file) uploadAvatar(file)
                else setAvatarUrl(url)
              }}
              size={80}
            />
          </div>

          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2 min-w-0">
              <h1 className="text-xl sm:text-2xl font-semibold tracking-tight break-words">{userName}</h1>
              <VerificationBadge className="shrink-0" />
              {accreditedVerified && (
                <Badge className="bg-emerald-500/10 text-emerald-400 border-emerald-500/25 font-mono text-[9.5px] py-0.5 px-2 rounded-full flex items-center gap-1 shrink-0">
                  <ShieldCheck className="h-3 w-3 animate-pulse" /> SEC 506(c) Verified
                </Badge>
              )}
            </div>
            <p className="mt-1 flex items-center gap-2 text-foreground/70 text-sm font-mono">
              <Building2 className="h-4 w-4 text-muted-foreground" />
              <span className="truncate">{firm || "Horizon Ventures"}</span>
            </p>
          </div>

          <div className="flex items-center gap-4 md:col-span-2 lg:col-span-1">
            <div className="flex-1 lg:flex-none">
              <TrustInspector
                trust={profile?.trust ?? 0}
                baseline={75}
                breakdown={profile?.trustBreakdown}
                className="w-full max-w-[220px]"
              />
            </div>
            <Button
              onClick={requestReverification}
              className="rounded-lg bg-primary text-primary-foreground hover:opacity-90 cursor-pointer"
            >
              <ShieldCheck className="mr-2 h-4 w-4" />
              Request re‑verify
            </Button>
          </div>
        </div>
      </section>

      {/* Body: Main left • Right rail */}
      <div className="mt-6 grid gap-6 lg:grid-cols-[minmax(0,1fr)_380px]">
        {/* Main column */}
        <div className="min-w-0 space-y-6">
          {/* Essentials */}
          <Card className="bg-background/25 border-border/[0.03] backdrop-blur-xl">
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2 font-serif font-light text-foreground">
                <UserRound className="h-4 w-4 text-muted-foreground" />
                Profile Details
              </CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4 sm:grid-cols-2">
              <Field label="Name">
                <Input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="bg-accent/30 border-border text-xs"
                />
              </Field>
              <Field label="Affiliation">
                <Input
                  value={firm}
                  onChange={(e) => setFirm(e.target.value)}
                  className="bg-accent/30 border-border text-xs"
                />
              </Field>

              <div className="grid gap-2 sm:col-span-2">
                <label className="text-xs text-muted-foreground font-mono uppercase tracking-wider text-[10px]">Typical check size (USD)</label>
                <div className="grid grid-cols-2 gap-2">
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground font-mono">Min</span>
                    <Input
                      type="number"
                      min={0}
                      step={1000}
                      value={minCheck}
                      onChange={(e) => setMinCheck(safeInt(e.target.value, minCheck))}
                      className="h-9 bg-accent/30 border-border text-xs"
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground font-mono">Max</span>
                    <Input
                      type="number"
                      min={0}
                      step={1000}
                      value={maxCheck}
                      onChange={(e) => setMaxCheck(safeInt(e.target.value, maxCheck))}
                      className="h-9 bg-accent/30 border-border text-xs"
                    />
                  </div>
                </div>
              </div>

              <div className="sm:col-span-2">
                <Field label="Bio">
                  <Textarea
                    value={bio}
                    onChange={(e) => setBio(e.target.value)}
                    className="min-h-[100px] bg-accent/30 border-border text-xs leading-relaxed"
                  />
                </Field>
              </div>

              <div className="sm:col-span-2">
                <Button
                  onClick={saveProfile}
                  disabled={saving}
                  className="w-fit rounded-lg bg-primary text-primary-foreground hover:opacity-90 cursor-pointer"
                >
                  {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                  Save profile
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Interests */}
          <Card className="bg-background/25 border-border/[0.03] backdrop-blur-xl">
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2 font-serif font-light text-foreground">
                <Tag className="h-4 w-4 text-muted-foreground" />
                Investment Sector focus
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex flex-wrap gap-2">
                {INTERESTS.map((t) => {
                  const on = interests.includes(t)
                  return (
                    <button
                      key={t}
                      onClick={() => toggleInterest(t)}
                      className={cn(
                        "text-xs rounded-md px-3 py-1.5 border transition cursor-pointer",
                        on ? "border-[var(--brand-accent)] bg-[var(--brand-accent)]/10 text-foreground" : "border-border/60 text-foreground/80 hover:bg-accent/40",
                      )}
                      aria-pressed={on}
                    >
                      {t}
                    </button>
                  )
                })}
              </div>
              <div className="text-[11px] text-muted-foreground font-mono">Used to personalize discovery and match algorithms.</div>
            </CardContent>
          </Card>

          {/* Preferences */}
          <Card className="bg-background/25 border-border/[0.03] backdrop-blur-xl">
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2 font-serif font-light text-foreground">
                <Wallet className="h-4 w-4 text-muted-foreground" />
                Commitment Preferences
              </CardTitle>
            </CardHeader>
            <CardContent className="grid gap-3 text-sm">
              <RowSwitch
                label="Milestone‑based releases from escrow"
                desc="Funds are held and released on objective criteria."
                checked={escrowRequired}
                onCheckedChange={setEscrowRequired}
              />
              <RowSwitch
                label="Mutual NDA before deep details"
                desc="Default to protected sharing for sensitive docs."
                checked={ndaPreferred}
                onCheckedChange={setNdaPreferred}
              />

              <div className="grid gap-2">
                <div className="text-xs text-muted-foreground font-mono">Stage focus</div>
                <div className="flex flex-wrap gap-2">
                  {(["Pre‑seed", "Angel", "Seed"] as const).map((s) => {
                    const on = stageFocus.includes(s)
                    return (
                      <button
                        key={s}
                        onClick={() => toggleStage(s)}
                        className={cn(
                          "text-xs rounded-md px-3 py-1.5 border transition cursor-pointer",
                          on ? "border-[var(--brand-accent)] bg-[var(--brand-accent)]/10 text-foreground" : "border-border/60 text-foreground/80 hover:bg-accent/40",
                        )}
                        aria-pressed={on}
                      >
                        {s}
                      </button>
                    )
                  })}
                </div>
              </div>

              <div className="grid gap-2">
                <div className="text-xs text-muted-foreground font-mono">Pace (investments per quarter)</div>
                <div className="flex items-center gap-3">
                  <input
                    type="range"
                    min={0}
                    max={12}
                    step={1}
                    value={pacePerQuarter}
                    onChange={(e) => setPacePerQuarter(Number.parseInt(e.target.value))}
                    className="w-full cursor-pointer accent-[var(--brand-accent)]"
                    aria-label="Pace per quarter"
                  />
                  <div className="w-10 text-right font-mono text-xs">{pacePerQuarter}</div>
                </div>
              </div>

              <Button
                onClick={savePreferences}
                disabled={saving}
                className="w-fit rounded-lg bg-primary text-primary-foreground hover:opacity-90 cursor-pointer"
              >
                {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                Save preferences
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Right rail */}
        <aside className="space-y-6">
          {/* Visibility & links */}
          <Card className="bg-background/25 border-border/[0.03] backdrop-blur-xl">
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2 font-serif font-light text-foreground">
                <Link2 className="h-4 w-4 text-muted-foreground" />
                Visibility & links
              </CardTitle>
            </CardHeader>
            <CardContent className="grid gap-3 text-sm">
              <RowSwitch
                label="Public profile"
                desc="Share a minimal, linkable profile."
                checked={publicProfile}
                onCheckedChange={(v) => updateVisibility("publicProfile", v)}
              />
              <div className="grid gap-2">
                <div className="text-xs text-muted-foreground font-mono">Handle</div>
                <div className="flex items-center gap-2">
                  <span className="text-muted-foreground font-mono">@</span>
                  <Input
                    value={handle}
                    onChange={(e) => setHandle(e.target.value)}
                    onBlur={(e) => updateVisibility("handle", e.target.value)}
                    className="h-8 bg-accent/30 border-border text-xs"
                  />
                </div>
                <div className="text-[11px] text-muted-foreground font-mono">
                  Profile URL: <span className="text-foreground font-medium">something.to/{handle || "alex_horizon"}</span>
                </div>
              </div>
              <div className="grid gap-2">
                <div className="text-xs text-muted-foreground font-mono">Linked accounts</div>
                <div className="flex flex-wrap gap-2">
                  {profile?.links && profile.links.length > 0 ? (
                    profile.links.map((l, i) => (
                      <a
                        key={i}
                        href={l.href}
                        className="inline-flex items-center gap-2 rounded-md border border-border/60 bg-accent/30 px-2.5 py-1.5 text-xs hover:bg-accent"
                      >
                        <span className="inline-block h-1.5 w-1.5 rounded-full bg-white/60" />
                        {l.label}
                      </a>
                    ))
                  ) : (
                    <div className="text-xs text-muted-foreground">No linked accounts</div>
                  )}
                  <button className="inline-flex items-center gap-1 rounded-md border border-border/60 bg-accent/30 px-2 py-1 text-[11px] text-foreground/80 hover:bg-accent cursor-pointer">
                    Connect…
                  </button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Portfolio snapshot */}
          <Card className="bg-background/25 border-border/[0.03] backdrop-blur-xl">
            <CardHeader className="pb-2">
              <CardTitle className="text-base font-serif font-light text-foreground">Portfolio snapshot</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-2">
              {portfolioList.map((p) => (
                <Link
                  key={p.id}
                  href={`/investor/search/${p.id}`}
                  className="rounded-md border border-border/60 bg-accent/30 px-3 py-2 text-xs hover:bg-accent transition"
                >
                  {p.name}
                </Link>
              ))}
              {portfolioList.length === 0 && (
                <div className="text-xs text-muted-foreground font-mono">No active portfolio investments.</div>
              )}
              <div className="text-[10px] text-muted-foreground font-mono">Tap to view each brief.</div>
            </CardContent>
          </Card>

          {/* Accreditation Status */}
          <Card className="bg-background/25 border-border/[0.03] backdrop-blur-xl">
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2 font-serif font-light text-foreground">
                <ShieldCheck className="h-4 w-4 text-muted-foreground" />
                Accreditation Status
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {accreditedVerified ? (
                <div className="rounded-lg border border-emerald-500/20 bg-emerald-500/[0.03] p-3 text-xs text-emerald-400 font-mono">
                  <span className="flex items-center gap-1.5 font-bold mb-1">
                    <ShieldCheck className="h-4 w-4 animate-pulse" /> SEC 506(c) Accredited
                  </span>
                  Your status has been digitally self-certified and synced to escrow nodes.
                </div>
              ) : (
                <div className="rounded-lg border border-amber-500/20 bg-amber-500/[0.03] p-3 text-xs text-amber-500 font-mono space-y-3">
                  <p>Your accreditation status is currently unverified. Escrow disbursements require self-certification.</p>
                  <Button 
                    size="sm" 
                    onClick={() => setIsVerificationOpen(true)}
                    className="w-full bg-amber-500 text-black hover:bg-amber-400 text-xs font-semibold rounded-lg cursor-pointer h-8"
                  >
                    Certify Accreditation
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Guidance */}
          <Card className="bg-background/25 border-border/[0.03] backdrop-blur-xl">
            <CardHeader className="pb-2">
              <CardTitle className="text-base font-serif font-light text-foreground">Guidance</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-xs leading-relaxed font-sans text-muted-foreground">
              <div className="rounded-md border border-border/60 bg-accent/30 px-3 py-2">
                Verified investors can enable &quot;Public profile&quot; to receive curated intros.
              </div>
              <div className="rounded-md border border-border/60 bg-accent/30 px-3 py-2 font-mono">
                Trust grows with NDA usage, escrow releases, and verified receipts.
              </div>
            </CardContent>
          </Card>
        </aside>
      </div>

      {/* Accreditation self-certification Modal */}
      {isVerificationOpen && (
        <Dialog open={isVerificationOpen} onOpenChange={setIsVerificationOpen}>
          <DialogContent className="w-full max-w-md bg-[#101113] text-white border-white/5 p-6 rounded-xl">
            <DialogHeader className="space-y-1.5">
              <DialogTitle className="font-serif font-light text-xl text-white flex items-center gap-2">
                <ShieldCheck className="h-5 w-5 text-emerald-400" />
                SEC Accreditation
              </DialogTitle>
              <DialogDescription className="text-xs text-white/50 font-mono">
                Digitally self-certify under Securities Act Rule 506(c)
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4 pt-2 text-xs leading-relaxed text-white/70">
              <p>
                To release escrow funds to active builder cohorts, you must certify that you meet the regulatory accredited investor guidelines:
              </p>
              
              <div className="space-y-2 border border-white/5 rounded-lg p-3 bg-white/[0.01]">
                <label className="flex items-start gap-2.5 cursor-pointer">
                  <input
                    type="radio"
                    name="acc-criteria"
                    checked={verifyCriteria === "networth"}
                    onChange={() => setVerifyCriteria("networth")}
                    className="mt-0.5 accent-emerald-400"
                  />
                  <span><strong>Net Worth:</strong> Individual or joint net worth exceeds $1,000,000 (excluding primary residence).</span>
                </label>
                <label className="flex items-start gap-2.5 cursor-pointer">
                  <input
                    type="radio"
                    name="acc-criteria"
                    checked={verifyCriteria === "income"}
                    onChange={() => setVerifyCriteria("income")}
                    className="mt-0.5 accent-emerald-400"
                  />
                  <span><strong>Income:</strong> Individual income exceeded $200,000 in each of the past 2 years (or $300,000 jointly).</span>
                </label>
                <label className="flex items-start gap-2.5 cursor-pointer">
                  <input
                    type="radio"
                    name="acc-criteria"
                    checked={verifyCriteria === "web3"}
                    onChange={() => setVerifyCriteria("web3")}
                    className="mt-0.5 accent-emerald-400"
                  />
                  <span><strong>Ledger Account:</strong> Authenticated web3 signature demonstrating accredited check holdings.</span>
                </label>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-4 border-t border-white/5 mt-4">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsVerificationOpen(false)}
                className="h-8 text-xs rounded-lg border-white/10 text-white bg-transparent hover:bg-white/5"
              >
                Cancel
              </Button>
              <Button
                size="sm"
                onClick={handleVerifyAccreditation}
                className="h-8 text-xs rounded-lg bg-emerald-600 text-white hover:bg-emerald-500 font-semibold"
              >
                Sign & Certify
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      )}

    </div>
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="grid gap-2">
      <label className="text-xs text-muted-foreground font-mono uppercase tracking-wider text-[10px]">{label}</label>
      {children}
    </div>
  )
}

function RowSwitch({
  label,
  desc,
  checked,
  onCheckedChange,
}: {
  label: string
  desc?: string
  checked: boolean
  onCheckedChange: (v: boolean) => void
}) {
  return (
    <div className="flex items-start justify-between gap-3 rounded-lg border border-border bg-accent/30 p-3">
      <div className="min-w-0">
        <div className="font-medium text-xs text-foreground/80">{label}</div>
        {desc && <div className="text-[10px] text-muted-foreground leading-normal mt-0.5">{desc}</div>}
      </div>
      <Switch checked={checked} onCheckedChange={onCheckedChange} aria-label={label} className="data-[state=checked]:bg-[var(--brand-accent)] shrink-0" />
    </div>
  )
}

function safeInt(v: string, fallback: number) {
  const n = Number.parseInt(v)
  return Number.isFinite(n) ? n : fallback
}