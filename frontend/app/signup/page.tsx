"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { motion, AnimatePresence } from "framer-motion"
import apiClient from "@/lib/axios"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { SomethingLogo } from "@/components/something-logo"
import { cn } from "@/lib/utils"
import { 
  ArrowLeft, 
  Mail, 
  Lock, 
  User, 
  Award, 
  Compass, 
  Briefcase, 
  Link2, 
  DollarSign, 
  Loader2, 
  UserCheck
} from "lucide-react"

const FOUNDER_EXPERTISE_OPTS = [
  "Product",
  "Engineering",
  "Design",
  "Growth/Marketing",
  "Finance",
  "Legal",
  "Operations",
  "Hardware",
  "AI/ML"
]

const INVESTOR_INTEREST_OPTS = [
  "Seed",
  "Series A",
  "Web3",
  "AI/ML",
  "Climate",
  "Health",
  "Fintech",
  "Consumer"
]

export default function SignupPage() {
  const router = useRouter()
  const [step, setStep] = useState(1) // 1: Role, 2: Credentials, 3: Profile Details

  // Form states (matching pre-existing API payload structure)
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [confirm, setConfirm] = useState("")
  const [role, setRole] = useState("founder") // "founder" | "investor"
  const [experience, setExperience] = useState("")
  const [phone] = useState("")
  const [linkedin, setLinkedin] = useState("")
  const [github, setGithub] = useState("")
  const [twitter, setTwitter] = useState("")
  const [firm, setFirm] = useState("")
  const [expertise, setExpertise] = useState<string[]>([])
  const [expertiseOther] = useState("")
  const [newExpertise, setNewExpertise] = useState("")
  const [interests, setInterests] = useState<string[]>([])
  const [interestsOther] = useState("")
  const [newInterest, setNewInterest] = useState("")
  const [age, setAge] = useState<number | "">("")
  const [occupation, setOccupation] = useState("")
  const [terms, setTerms] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Validation checks
  const emailValid = /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email.trim())
  const passwordValid = password.length >= 8
  const passwordsMatch = password === confirm
  const ageValid = age === "" || (Number(age) >= 13 && Number(age) <= 120)

  const step2Valid = name.trim().length > 0 && emailValid && passwordValid && passwordsMatch && terms
  const step3Valid = role === "founder" ? (expertise.length > 0 || expertiseOther.trim().length > 0) : true
  const formValid = step2Valid && step3Valid && ageValid

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formValid || loading) return
    setLoading(true)
    setError(null)
    try {
      const payload = {
        name: name.trim(),
        email: email.trim(),
        password,
        role,
        experience: experience || undefined,
        phone: phone || undefined,
        linkedin: linkedin || undefined,
        github: github || undefined,
        twitter: twitter || undefined,
        firm: role === "investor" && firm ? firm : undefined,
        expertise: role === "founder" ? (expertise.length ? expertise : expertiseOther ? [expertiseOther] : undefined) : undefined,
        interests: role === "investor" ? (interests.length ? interests : interestsOther ? [interestsOther] : undefined) : undefined,
        age: age === "" ? undefined : age,
        occupation: occupation || undefined,
        accepted_terms: terms,
      }

      try {
        const res = await apiClient.post("/auth/signup", payload)
        if (res?.data?.token) {
          localStorage.setItem("token", res.data.token)
          localStorage.setItem("demo_name", name.trim())
          localStorage.setItem("demo_email", email.trim())
          localStorage.setItem("demo_role", role)
          window.dispatchEvent(new Event("auth:login"))
        }
      } catch (apiErr) {
        if (process.env.NODE_ENV !== "production") {
          console.warn("Backend registration failed, using client-side mock registration", apiErr)
          localStorage.setItem("token", "mock-token-" + Math.random().toString(36).substring(2))
          localStorage.setItem("demo_name", name.trim())
          localStorage.setItem("demo_email", email.trim())
          localStorage.setItem("demo_role", role)
          window.dispatchEvent(new Event("auth:login"))
        } else {
          throw apiErr
        }
      }
      router.push(role === "investor" ? "/investor" : "/founder")
    } catch (err) {
      setError("Signup failed. Please check your data and try again.")
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const toggleExpertise = (val: string) => {
    setExpertise((prev) => (prev.includes(val) ? prev.filter((x) => x !== val) : [...prev, val]))
  }

  const toggleInterest = (val: string) => {
    setInterests((prev) => (prev.includes(val) ? prev.filter((x) => x !== val) : [...prev, val]))
  }

  const addCustomExpertise = () => {
    const v = newExpertise.trim()
    if (v && !expertise.map(x => x.toLowerCase()).includes(v.toLowerCase())) {
      setExpertise(prev => [...prev, v])
    }
    setNewExpertise("")
  }

  const addCustomInterest = () => {
    const v = newInterest.trim()
    if (v && !interests.map(x => x.toLowerCase()).includes(v.toLowerCase())) {
      setInterests(prev => [...prev, v])
    }
    setNewInterest("")
  }

  return (
    <div className="min-h-screen grid grid-cols-1 lg:grid-cols-[450px_1fr] bg-[#0a0a0c] text-white">
      {/* Left Column: Brand & Info Column */}
      <div className="relative hidden lg:flex flex-col justify-between p-12 overflow-hidden border-r border-white/5 bg-[#070709]">
        {/* Glow */}
        <div
          className="absolute top-1/3 -left-1/4 w-96 h-96 rounded-full pointer-events-none"
          style={{
            background: "radial-gradient(circle, rgba(52,211,153,0.03) 0%, transparent 70%)",
          }}
        />

        <Link href="/" className="relative z-10">
          <SomethingLogo />
        </Link>

        <div className="relative z-10 space-y-6 my-auto">
          <h2 className="text-4xl font-bold tracking-tight leading-[1.1]" style={{ fontFamily: "var(--font-outfit)" }}>
            protect the idea. <br />
            find the <span className="text-[#34D399]">conviction</span>.
          </h2>
          <div className="space-y-4 text-xs text-white/30 leading-relaxed max-w-sm">
            <p>
              <strong className="text-white/60">Mutual NDAs by default:</strong> Your project IP is hashed cryptographically on-chain before details are shared.
            </p>
            <p>
              <strong className="text-white/60">Transparent Release:</strong> Funding pools sit in secure escrow and unlock only on milestone targets verified by the community.
            </p>
          </div>
        </div>

        <div className="relative z-10 flex justify-between text-[11px] text-white/20 font-mono">
          <span>Zero Lock-in contract</span>
          <span>something.to</span>
        </div>
      </div>

      {/* Right Column: Dynamic Steps Form */}
      <div className="flex items-center justify-center p-6 sm:p-12 relative overflow-hidden">
        {/* Mobile Header */}
        <div className="absolute top-6 left-6 lg:hidden">
          <Link href="/">
            <SomethingLogo />
          </Link>
        </div>

        <div className="w-full max-w-xl p-8 sm:p-10 rounded-2xl border border-white/5 bg-white/[0.01] backdrop-blur-xl shadow-2xl space-y-8 animate-in fade-in slide-in-from-bottom-3 duration-500 relative overflow-hidden">
          {/* Subtle top border illumination */}
          <div aria-hidden className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />

          {/* Progress Header */}
          <div className="flex items-center justify-between text-xs text-white/30 border-b border-white/5 pb-4">
            <span className="font-mono">Step {step} of 2</span>
            <div className="flex gap-1.5">
              {[1, 2].map((s) => (
                <div
                  key={s}
                  className={`h-1.5 w-6 rounded-full transition-all duration-300 ${
                    s === step
                      ? role === "founder"
                        ? "bg-[#34D399] w-10"
                        : "bg-[#E3C27A] w-10"
                      : s < step
                      ? "bg-white/20"
                      : "bg-white/5"
                  }`}
                />
              ))}
            </div>
          </div>

          <AnimatePresence mode="wait">
            {step === 1 && (
              <motion.div
                key="step1"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3 }}
                className="space-y-6"
              >
                <div>
                  <h1 className="text-3xl font-bold tracking-tight" style={{ fontFamily: "var(--font-outfit)" }}>
                    Choose your role
                  </h1>
                  <p className="mt-2 text-sm text-white/40">
                    Are you building something, or backing it?
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Founder Option */}
                  <div
                    onClick={() => {
                      setRole("founder")
                      setStep(2)
                    }}
                    className={`group relative rounded-xl border p-6 cursor-pointer transition-all duration-300 flex flex-col justify-between min-h-[180px] bg-white/[0.01] hover:bg-white/[0.03] ${
                      role === "founder"
                        ? "border-[#34D399] shadow-[0_0_20px_rgba(52,211,153,0.08)]"
                        : "border-white/8 hover:border-white/15"
                    }`}
                  >
                    <div>
                      <span className="text-3xl mb-4 block group-hover:scale-110 transition-transform origin-left text-[#34D399]">◉</span>
                      <h3 className="text-lg font-semibold tracking-tight">Founder</h3>
                      <p className="text-xs text-white/45 mt-2 leading-relaxed">
                        I am building a project, have hidden ideas, and want milestone-based transparent funding.
                      </p>
                    </div>
                  </div>

                  {/* Investor Option */}
                  <div
                    onClick={() => {
                      setRole("investor")
                      setStep(2)
                    }}
                    className={`group relative rounded-xl border p-6 cursor-pointer transition-all duration-300 flex flex-col justify-between min-h-[180px] bg-white/[0.01] hover:bg-white/[0.03] ${
                      role === "investor"
                        ? "border-[#E3C27A] shadow-[0_0_20px_rgba(227,194,122,0.08)]"
                        : "border-white/8 hover:border-white/15"
                    }`}
                  >
                    <div>
                      <span className="text-3xl mb-4 block group-hover:scale-110 transition-transform origin-left text-[#E3C27A]">◈</span>
                      <h3 className="text-lg font-semibold tracking-tight">Investor</h3>
                      <p className="text-xs text-white/45 mt-2 leading-relaxed">
                        I back early conviction projects, support transparent escrow structures, and discover founders.
                      </p>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {step === 2 && (
              <motion.div
                key="step2"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3 }}
                className="space-y-6"
              >
                <div>
                  <h1 className="text-3xl font-bold tracking-tight text-white" style={{ fontFamily: "var(--font-outfit)" }}>
                    {role === "founder" ? "Create Founder Account" : "Create Investor Account"}
                  </h1>
                  <p className="mt-2 text-sm text-white/40">
                    {role === "founder"
                      ? "Bring your startup project to the network and run validation."
                      : "Back early-conviction founders and explore transparent milestones."}
                  </p>
                </div>

                <form onSubmit={onSubmit} className="space-y-6">
                  {/* Two-Column Grid layout for desktop */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Left Column: Account Credentials */}
                    <div className="space-y-4">
                      <h3 className="text-xs font-bold text-white/30 uppercase tracking-wider border-b border-white/5 pb-2">
                        Account Access
                      </h3>

                      {/* Full Name */}
                      <div className="space-y-2">
                        <label className="text-xs font-semibold text-white/50 uppercase tracking-wider">Full Name</label>
                        <div className="relative">
                          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-white/35">
                            <User className="h-4 w-4" />
                          </span>
                          <Input
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="Alex Rivera"
                            required
                            className={cn(
                              "pl-10 bg-white/[0.01] border-white/5 hover:border-white/15 text-white placeholder:text-white/20 h-11 rounded-lg transition-all",
                              role === "founder" ? "focus:border-[#34D399]/50 focus:ring-1 focus:ring-[#34D399]/15" : "focus:border-[#E3C27A]/50 focus:ring-1 focus:ring-[#E3C27A]/15"
                            )}
                            style={{ boxShadow: "inset 0 1px 2px rgba(0,0,0,0.5)" }}
                          />
                        </div>
                      </div>

                      {/* Email Address */}
                      <div className="space-y-2">
                        <label className="text-xs font-semibold text-white/50 uppercase tracking-wider">Email Address</label>
                        <div className="relative">
                          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-white/35">
                            <Mail className="h-4 w-4" />
                          </span>
                          <Input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="you@domain.com"
                            required
                            className={cn(
                              "pl-10 bg-white/[0.01] border-white/5 hover:border-white/15 text-white placeholder:text-white/20 h-11 rounded-lg transition-all",
                              role === "founder" ? "focus:border-[#34D399]/50 focus:ring-1 focus:ring-[#34D399]/15" : "focus:border-[#E3C27A]/50 focus:ring-1 focus:ring-[#E3C27A]/15"
                            )}
                            style={{ boxShadow: "inset 0 1px 2px rgba(0,0,0,0.5)" }}
                          />
                        </div>
                      </div>

                      {/* Password */}
                      <div className="space-y-2">
                        <label className="text-xs font-semibold text-white/50 uppercase tracking-wider">Password</label>
                        <div className="relative">
                          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-white/35">
                            <Lock className="h-4 w-4" />
                          </span>
                          <Input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="Min 8 characters"
                            required
                            className={cn(
                              "pl-10 bg-white/[0.01] border-white/5 hover:border-white/15 text-white placeholder:text-white/20 h-11 rounded-lg transition-all",
                              role === "founder" ? "focus:border-[#34D399]/50 focus:ring-1 focus:ring-[#34D399]/15" : "focus:border-[#E3C27A]/50 focus:ring-1 focus:ring-[#E3C27A]/15"
                            )}
                            style={{ boxShadow: "inset 0 1px 2px rgba(0,0,0,0.5)" }}
                          />
                        </div>
                      </div>

                      {/* Confirm Password */}
                      <div className="space-y-2">
                        <label className="text-xs font-semibold text-white/50 uppercase tracking-wider">Confirm Password</label>
                        <div className="relative">
                          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-white/35">
                            <Lock className="h-4 w-4" />
                          </span>
                          <Input
                            type="password"
                            value={confirm}
                            onChange={(e) => setConfirm(e.target.value)}
                            placeholder="Repeat password"
                            required
                            className={cn(
                              "pl-10 bg-white/[0.01] border-white/5 hover:border-white/15 text-white placeholder:text-white/20 h-11 rounded-lg transition-all",
                              role === "founder" ? "focus:border-[#34D399]/50 focus:ring-1 focus:ring-[#34D399]/15" : "focus:border-[#E3C27A]/50 focus:ring-1 focus:ring-[#E3C27A]/15"
                            )}
                            style={{ boxShadow: "inset 0 1px 2px rgba(0,0,0,0.5)" }}
                          />
                        </div>
                      </div>

                      {/* Terms Acceptance */}
                      <div className="flex items-start gap-2.5 py-2">
                        <Checkbox
                          id="terms"
                          checked={terms}
                          onCheckedChange={(v) => setTerms(Boolean(v))}
                          className="mt-0.5"
                        />
                        <label htmlFor="terms" className="text-xs text-white/50 leading-relaxed cursor-pointer select-none">
                          I agree to the{" "}
                          <Link href="/terms" target="_blank" className="text-white underline font-medium hover:text-white/80">
                            Terms &amp; Conditions
                          </Link>
                        </label>
                      </div>
                    </div>

                    {/* Right Column: Profile Details */}
                    <div className="space-y-4">
                      <h3 className="text-xs font-bold text-white/30 uppercase tracking-wider border-b border-white/5 pb-2">
                        Profile Details
                      </h3>

                      {role === "founder" ? (
                        // FOUNDER PROFILE FIELDS
                        <div className="space-y-4">
                          {/* Core Expertise (Pills) */}
                          <div className="space-y-2">
                            <label className="text-xs font-semibold text-white/50 uppercase tracking-wider flex items-center gap-1.5">
                              <Award className="h-3.5 w-3.5" /> Core Expertise (Select at least one)
                            </label>
                            <div className="flex flex-wrap gap-1.5 pt-1">
                              {FOUNDER_EXPERTISE_OPTS.map((opt) => {
                                const active = expertise.includes(opt)
                                return (
                                  <button
                                    type="button"
                                    key={opt}
                                    onClick={() => toggleExpertise(opt)}
                                    className={`text-[10px] rounded-full px-2.5 py-1 border transition-all duration-300 font-medium cursor-pointer ${
                                      active
                                        ? "border-[#34D399] bg-[#34D399]/10 text-[#34D399] shadow-[0_0_12px_rgba(52,211,153,0.1)]"
                                        : "border-white/5 bg-white/[0.01] text-white/40 hover:border-white/15 hover:text-white"
                                    }`}
                                  >
                                    {opt}
                                  </button>
                                )
                              })}
                            </div>
                          </div>

                          {/* Custom Expertise */}
                          <div className="flex gap-2">
                            <Input
                              placeholder="Add custom expertise tag"
                              value={newExpertise}
                              onChange={(e) => setNewExpertise(e.target.value)}
                              onKeyDown={(e) => {
                                if (e.key === "Enter") {
                                  e.preventDefault()
                                  addCustomExpertise()
                                }
                              }}
                              className={cn(
                                "h-9 bg-white/[0.01] border-white/5 hover:border-white/15 text-xs text-white rounded-lg transition-all",
                                role === "founder" ? "focus:border-[#34D399]/50 focus:ring-1 focus:ring-[#34D399]/15" : "focus:border-[#E3C27A]/50 focus:ring-1 focus:ring-[#E3C27A]/15"
                              )}
                            />
                            <button
                              type="button"
                              onClick={addCustomExpertise}
                              className="px-3 rounded-lg bg-white/10 hover:bg-white/15 text-white/90 text-xs transition-colors cursor-pointer"
                            >
                              Add
                            </button>
                          </div>

                          {/* Experience & Age */}
                          <div className="grid grid-cols-2 gap-3">
                            <div className="space-y-1">
                              <label className="text-xs font-semibold text-white/50 uppercase tracking-wider">Experience Level</label>
                              <select
                                value={experience}
                                onChange={(e) => setExperience(e.target.value)}
                                className={cn(
                                  "w-full h-10 rounded-lg bg-[#0e0f12] border border-white/5 px-3 text-xs text-white focus:outline-none transition-all cursor-pointer",
                                  role === "founder" ? "focus:border-[#34D399]/50 focus:ring-1 focus:ring-[#34D399]/15" : "focus:border-[#E3C27A]/50 focus:ring-1 focus:ring-[#E3C27A]/15"
                                )}
                              >
                                <option value="">Select...</option>
                                <option value="junior">Junior (1-2y)</option>
                                <option value="mid">Mid-level (3-5y)</option>
                                <option value="senior">Senior (6y+)</option>
                                <option value="founder">Repeat Founder</option>
                                <option value="executive">Executive</option>
                              </select>
                            </div>
                            <div className="space-y-1">
                              <label className="text-xs font-semibold text-white/50 uppercase tracking-wider">Age (Optional)</label>
                              <Input
                                type="number"
                                value={age === "" ? "" : String(age)}
                                onChange={(e) => setAge(e.target.value === "" ? "" : Number(e.target.value))}
                                placeholder="e.g. 28"
                                className={cn(
                                  "h-10 bg-white/[0.01] border-white/5 hover:border-white/15 text-white placeholder:text-white/20 rounded-lg transition-all",
                                  role === "founder" ? "focus:border-[#34D399]/50 focus:ring-1 focus:ring-[#34D399]/15" : "focus:border-[#E3C27A]/50 focus:ring-1 focus:ring-[#E3C27A]/15"
                                )}
                              />
                            </div>
                          </div>

                          {/* Occupation */}
                          <div className="space-y-1">
                            <label className="text-xs font-semibold text-white/50 uppercase tracking-wider flex items-center gap-1.5">
                              <Briefcase className="h-3.5 w-3.5" /> Current Occupation
                            </label>
                            <select
                              value={occupation}
                              onChange={(e) => setOccupation(e.target.value)}
                              className={cn(
                                "w-full h-10 rounded-lg bg-[#0e0f12] border border-white/5 px-3 text-xs text-white focus:outline-none transition-all cursor-pointer",
                                role === "founder" ? "focus:border-[#34D399]/50 focus:ring-1 focus:ring-[#34D399]/15" : "focus:border-[#E3C27A]/50 focus:ring-1 focus:ring-[#E3C27A]/15"
                              )}
                            >
                              <option value="">Select occupation...</option>
                              <option value="software_engineer">Software Engineer</option>
                              <option value="product_manager">Product Manager</option>
                              <option value="designer">Designer</option>
                              <option value="business_owner">Business Owner</option>
                              <option value="student">Student</option>
                              <option value="other">Other</option>
                            </select>
                          </div>

                          {/* Links */}
                          <div className="space-y-2 pt-2 border-t border-white/5">
                            <label className="text-xs font-semibold text-white/50 uppercase tracking-wider flex items-center gap-1.5">
                              <Link2 className="h-3.5 w-3.5" /> Social Links (Optional)
                            </label>
                            <div className="grid grid-cols-2 gap-2">
                              <Input
                                placeholder="LinkedIn URL"
                                value={linkedin}
                                onChange={(e) => setLinkedin(e.target.value)}
                                className={cn(
                                  "h-9 bg-white/[0.01] border-white/5 hover:border-white/15 text-white placeholder:text-white/20 rounded-lg transition-all text-xs",
                                  role === "founder" ? "focus:border-[#34D399]/50 focus:ring-1 focus:ring-[#34D399]/15" : "focus:border-[#E3C27A]/50 focus:ring-1 focus:ring-[#E3C27A]/15"
                                )}
                              />
                              <Input
                                placeholder="GitHub URL"
                                value={github}
                                onChange={(e) => setGithub(e.target.value)}
                                className={cn(
                                  "h-9 bg-white/[0.01] border-white/5 hover:border-white/15 text-white placeholder:text-white/20 rounded-lg transition-all text-xs",
                                  role === "founder" ? "focus:border-[#34D399]/50 focus:ring-1 focus:ring-[#34D399]/15" : "focus:border-[#E3C27A]/50 focus:ring-1 focus:ring-[#E3C27A]/15"
                                )}
                              />
                            </div>
                          </div>
                        </div>
                      ) : (
                        // INVESTOR PROFILE FIELDS
                        <div className="space-y-4">
                          {/* Firm & Check size */}
                          <div className="grid grid-cols-2 gap-3">
                            <div className="space-y-1">
                              <label className="text-xs font-semibold text-white/50 uppercase tracking-wider">Firm / Affiliation</label>
                              <Input
                                placeholder="Fund name"
                                value={firm}
                                onChange={(e) => setFirm(e.target.value)}
                                className={cn(
                                  "h-10 bg-white/[0.01] border-white/5 hover:border-white/15 text-white placeholder:text-white/20 rounded-lg transition-all text-xs",
                                  role === "founder" ? "focus:border-[#34D399]/50 focus:ring-1 focus:ring-[#34D399]/15" : "focus:border-[#E3C27A]/50 focus:ring-1 focus:ring-[#E3C27A]/15"
                                )}
                              />
                            </div>
                            <div className="space-y-1">
                              <label className="text-xs font-semibold text-white/50 uppercase tracking-wider flex items-center gap-1.5">
                                <DollarSign className="h-3.5 w-3.5" /> Target Stage
                              </label>
                              <select
                                value={experience}
                                onChange={(e) => setExperience(e.target.value)}
                                className={cn(
                                  "w-full h-10 rounded-lg bg-[#0e0f12] border border-white/5 px-3 text-xs text-white focus:outline-none transition-all cursor-pointer",
                                  role === "founder" ? "focus:border-[#34D399]/50 focus:ring-1 focus:ring-[#34D399]/15" : "focus:border-[#E3C27A]/50 focus:ring-1 focus:ring-[#E3C27A]/15"
                                )}
                              >
                                <option value="">Stage focus...</option>
                                <option value="angel">Angel Pool</option>
                                <option value="preseed">Pre-seed / Seed</option>
                                <option value="growth">Series A / B</option>
                              </select>
                            </div>
                          </div>

                          {/* Interests Pills */}
                          <div className="space-y-2">
                            <label className="text-xs font-semibold text-white/50 uppercase tracking-wider flex items-center gap-1.5">
                              <Compass className="h-3.5 w-3.5" /> Investment Interests
                            </label>
                            <div className="flex flex-wrap gap-1.5 pt-1">
                              {INVESTOR_INTEREST_OPTS.map((opt) => {
                                const active = interests.includes(opt)
                                return (
                                  <button
                                    type="button"
                                    key={opt}
                                    onClick={() => toggleInterest(opt)}
                                    className={`text-[10px] rounded-full px-2.5 py-1.5 border transition-all duration-300 font-medium cursor-pointer ${
                                      active
                                        ? "border-[#E3C27A] bg-[#E3C27A]/10 text-[#E3C27A] shadow-[0_0_12px_rgba(227,194,122,0.1)]"
                                        : "border-white/5 bg-white/[0.01] text-white/40 hover:border-white/15 hover:text-white"
                                    }`}
                                  >
                                    {opt}
                                  </button>
                                )
                              })}
                            </div>
                          </div>

                          {/* Custom Interest */}
                          <div className="flex gap-2">
                            <Input
                              placeholder="Add custom sector tag"
                              value={newInterest}
                              onChange={(e) => setNewInterest(e.target.value)}
                              onKeyDown={(e) => {
                                if (e.key === "Enter") {
                                  e.preventDefault()
                                  addCustomInterest()
                                }
                              }}
                              className={cn(
                                "h-9 bg-white/[0.01] border-white/5 hover:border-white/15 text-xs text-white rounded-lg transition-all",
                                role === "founder" ? "focus:border-[#34D399]/50 focus:ring-1 focus:ring-[#34D399]/15" : "focus:border-[#E3C27A]/50 focus:ring-1 focus:ring-[#E3C27A]/15"
                              )}
                            />
                            <button
                              type="button"
                              onClick={addCustomInterest}
                              className="px-3 rounded-lg bg-white/10 hover:bg-white/15 text-white/90 text-xs transition-colors cursor-pointer"
                            >
                              Add
                            </button>
                          </div>

                          {/* Socials & Twitter */}
                          <div className="space-y-2 pt-2 border-t border-white/5">
                            <label className="text-xs font-semibold text-white/50 uppercase tracking-wider flex items-center gap-1.5">
                              <Link2 className="h-3.5 w-3.5" /> Social Links (Optional)
                            </label>
                            <div className="grid grid-cols-2 gap-2">
                              <Input
                                placeholder="LinkedIn URL"
                                value={linkedin}
                                onChange={(e) => setLinkedin(e.target.value)}
                                className={cn(
                                  "h-9 bg-white/[0.01] border-white/5 hover:border-white/15 text-white placeholder:text-white/20 rounded-lg transition-all text-xs",
                                  role === "founder" ? "focus:border-[#34D399]/50 focus:ring-1 focus:ring-[#34D399]/15" : "focus:border-[#E3C27A]/50 focus:ring-1 focus:ring-[#E3C27A]/15"
                                )}
                              />
                              <Input
                                placeholder="Twitter (X) handle"
                                value={twitter}
                                onChange={(e) => setTwitter(e.target.value)}
                                className={cn(
                                  "h-9 bg-white/[0.01] border-white/5 hover:border-white/15 text-white placeholder:text-white/20 rounded-lg transition-all text-xs",
                                  role === "founder" ? "focus:border-[#34D399]/50 focus:ring-1 focus:ring-[#34D399]/15" : "focus:border-[#E3C27A]/50 focus:ring-1 focus:ring-[#E3C27A]/15"
                                )}
                              />
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {error && (
                    <p className="text-xs text-rose-400 font-medium bg-rose-500/5 border border-rose-500/10 rounded-lg p-3">
                      {error}
                    </p>
                  )}

                  {/* Actions footer */}
                  <div className="flex gap-3 pt-4 border-t border-white/5">
                    <Button
                      type="button"
                      variant="ghost"
                      onClick={() => setStep(1)}
                      className="flex-1 h-11 border border-white/10 hover:bg-white/5 text-white/70 cursor-pointer"
                    >
                      <ArrowLeft className="mr-2 h-4 w-4" /> Back
                    </Button>
                    <Button
                      type="submit"
                      disabled={!formValid || loading}
                      className={cn(
                        "flex-1 h-11 text-black font-semibold transition-all rounded-lg flex items-center justify-center gap-2 cursor-pointer",
                        role === "founder" ? "bg-white hover:bg-[#34D399]" : "bg-white hover:bg-[#E3C27A]"
                      )}
                    >
                      {loading ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <>
                          <UserCheck className="h-4 w-4" /> Complete
                        </>
                      )}
                    </Button>
                  </div>
                </form>
              </motion.div>
            )}
          </AnimatePresence>

          <div className="text-center text-xs text-white/40 pt-2 border-t border-white/5">
            Already have an account?{" "}
            <Link href="/login" className="text-white font-medium hover:underline">
              Sign in
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
