"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { ArrowLeft, MessageSquare, Heart, Loader2, AlertTriangle, ArrowBigUp, ArrowBigDown, Flag, Send } from "lucide-react"
import { cn } from "@/lib/utils"

type Stage = "concept" | "prototype" | "mvp" | "launched"

interface Idea {
  id: string
  title: string
  author: string
  authorAvatar?: string
  authorHeadline?: string
  stage: Stage
  tags: string[]
  description: string
  lookingFor: string[]
  likes: number
  downvotes?: number
  commentsCount: number
  flagged?: boolean
  flagReason?: string
}

interface Comment {
  id: string
  author: string
  authorAvatar: string
  text: string
  timestamp: string
}

const FALLBACK_IDEAS: Record<string, Idea> = {
  "y1": {
    id: "y1",
    title: "Edge Vision Kit",
    author: "Ava D.",
    authorAvatar: "",
    authorHeadline: "Hardware Tech Lead",
    stage: "mvp",
    tags: ["Edge AI", "Robotics", "Hardware"],
    description: "Low‑power on‑device vision kit with local models. Shipping v0 sensors to early adopters. This system enables real-time computer vision processing without cloud dependency, perfect for robotics and IoT applications.",
    lookingFor: ["Hardware engineer", "Go-to-market lead"],
    likes: 24,
    downvotes: 1,
    commentsCount: 1
  },
  "d1": {
    id: "d1",
    title: "Neurotech IDE",
    author: "Sam K.",
    authorAvatar: "",
    authorHeadline: "Bio-interface Developer",
    stage: "prototype",
    tags: ["Bio tooling", "Privacy", "Dev tools"],
    description: "Local‑only IDE and toolchain for neural interfaces. Privacy‑first development environment for developers working on next-gen brain-computer interfaces.",
    lookingFor: ["Frontend developer", "Neuroscientist"],
    likes: 42,
    downvotes: 2,
    commentsCount: 0
  }
}

export default function IdeaDetailsPage() {
  const router = useRouter()
  const params = useParams()
  const id = params.id as string

  const [idea, setIdea] = useState<Idea | null>(null)
  const [comments, setComments] = useState<Comment[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Feedback states
  const [userName, setUserName] = useState("Alex Rivera")
  const [userAvatar, setUserAvatar] = useState("")
  const [commentInput, setCommentInput] = useState("")
  const [flagReasonText, setFlagReasonText] = useState("")
  const [isFlagModalOpen, setIsFlagModalOpen] = useState(false)

  useEffect(() => {
    if (typeof window !== "undefined") {
      const name = localStorage.getItem("demo_name")
      if (name) setUserName(name)

      const storedProfile = localStorage.getItem("founder_profile_data")
      if (storedProfile) {
        try {
          const parsed = JSON.parse(storedProfile)
          if (parsed.avatarUrl) setUserAvatar(parsed.avatarUrl)
        } catch { /* ignore */ }
      }
    }
  }, [])

  useEffect(() => {
    if (!id) return

    const fetchData = () => {
      setIsLoading(true)
      setError(null)
      try {
        // Load details from founder_your_ideas or founder_discover_ideas list
        let foundIdea: Idea | null = null
        const yourStored = localStorage.getItem("founder_your_ideas")
        const discStored = localStorage.getItem("founder_discover_ideas")

        if (yourStored) {
          const list = JSON.parse(yourStored) as Idea[]
          const matched = list.find(x => x.id === id)
          if (matched) foundIdea = matched
        }
        if (!foundIdea && discStored) {
          const list = JSON.parse(discStored) as Idea[]
          const matched = list.find(x => x.id === id)
          if (matched) foundIdea = matched
        }

        // If not found in lists, look in hardcoded fallbacks
        if (!foundIdea) {
          foundIdea = FALLBACK_IDEAS[id]
        }

        if (!foundIdea) {
          // Make up a generic model so details page never crashes
          foundIdea = {
            id,
            title: "Simulated Cohort Brief",
            author: "Cohort Builder",
            stage: "concept",
            tags: ["AI", "Web3"],
            description: "Detailed system design under evaluation by cohorts. Cryptographic validation metrics pending.",
            lookingFor: ["GTM lead"],
            likes: 12,
            downvotes: 0,
            commentsCount: 0
          }
        }

        setIdea(foundIdea)

        // Load comments list
        const commentsKey = `comments_${id}`
        const storedComments = localStorage.getItem(commentsKey)
        if (storedComments) {
          setComments(JSON.parse(storedComments))
        } else {
          const defaults = id === "y1" ? [
            {
              id: "c1",
              author: "Ian R.",
              authorAvatar: "",
              text: "Great validation metrics! Let's schedule a chat to discuss local inference optimization.",
              timestamp: "1h ago"
            }
          ] : []
          setComments(defaults)
          localStorage.setItem(commentsKey, JSON.stringify(defaults))
        }

      } catch (err) {
        setError("Could not load the idea specifications.")
        console.error(err)
      } finally {
        setIsLoading(false)
      }
    }

    fetchData()
  }, [id])

  const saveIdeaState = (updatedIdea: Idea) => {
    setIdea(updatedIdea)

    // Save back to lists
    const yourStored = localStorage.getItem("founder_your_ideas")
    const discStored = localStorage.getItem("founder_discover_ideas")

    if (yourStored) {
      const list = JSON.parse(yourStored) as Idea[]
      const idx = list.findIndex(x => x.id === updatedIdea.id)
      if (idx !== -1) {
        list[idx] = updatedIdea
        localStorage.setItem("founder_your_ideas", JSON.stringify(list))
      }
    }
    if (discStored) {
      const list = JSON.parse(discStored) as Idea[]
      const idx = list.findIndex(x => x.id === updatedIdea.id)
      if (idx !== -1) {
        list[idx] = updatedIdea
        localStorage.setItem("founder_discover_ideas", JSON.stringify(list))
      }
    }
  }

  const handleVote = (dir: "up" | "down") => {
    if (!idea) return
    const voteKey = `vote_idea_${id}`
    const prevVote = localStorage.getItem(voteKey)

    let likesDelta = 0
    let downDelta = 0

    if (dir === "up") {
      if (prevVote === "up") {
        likesDelta = -1
        localStorage.removeItem(voteKey)
      } else if (prevVote === "down") {
        likesDelta = 1
        downDelta = -1
        localStorage.setItem(voteKey, "up")
      } else {
        likesDelta = 1
        localStorage.setItem(voteKey, "up")
      }
    } else {
      const currentDown = idea.downvotes || 0
      if (prevVote === "down") {
        downDelta = -1
        localStorage.removeItem(voteKey)
      } else if (prevVote === "up") {
        downDelta = 1
        likesDelta = -1
        localStorage.setItem(voteKey, "down")
      } else {
        downDelta = 1
        localStorage.setItem(voteKey, "down")
      }
    }

    const updated: Idea = {
      ...idea,
      likes: Math.max(0, idea.likes + likesDelta),
      downvotes: Math.max(0, (idea.downvotes || 0) + downDelta)
    }
    saveIdeaState(updated)
  }

  const handleAddComment = () => {
    if (!idea || !commentInput.trim()) return

    const newComment: Comment = {
      id: `c-${Date.now()}`,
      author: userName,
      authorAvatar: userAvatar,
      text: commentInput,
      timestamp: "Just now"
    }

    const updatedComments = [...comments, newComment]
    setComments(updatedComments)
    localStorage.setItem(`comments_${id}`, JSON.stringify(updatedComments))

    const updatedIdea: Idea = {
      ...idea,
      commentsCount: updatedComments.length
    }
    saveIdeaState(updatedIdea)
    setCommentInput("")
  }

  const handleFlagIdea = () => {
    if (!idea) return
    const updated: Idea = {
      ...idea,
      flagged: true,
      flagReason: flagReasonText || "Reported for community guidelines review"
    }
    saveIdeaState(updated)
    setIsFlagModalOpen(false)
    setFlagReasonText("")
  }

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-96">
        <Loader2 className="w-8 h-8 animate-spin text-foreground/60" />
      </div>
    )
  }

  if (error || !idea) {
    return (
      <div className="flex flex-col items-center justify-center h-96 text-center">
        <AlertTriangle className="w-12 h-12 text-red-400 mb-4" />
        <h2 className="text-xl font-semibold mb-2">An Error Occurred</h2>
        <p className="text-foreground/70 mb-4">{error || "Idea not found."}</p>
        <Button onClick={() => router.back()} variant="outline" className="border-border/20">
          <ArrowLeft className="mr-2 h-4 w-4" /> Go Back
        </Button>
      </div>
    )
  }

  const stageInfo = {
    launched: { text: "text-brand-accent", bg: "bg-brand-accent/10", border: "border-brand-accent/20" },
    mvp: { text: "text-[#8293A4]", bg: "bg-[#8293A4]/10", border: "border-[#8293A4]/20" },
    prototype: { text: "text-[#C88E72]", bg: "bg-[#C88E72]/10", border: "border-[#C88E72]/20" },
    concept: { text: "text-foreground/60", bg: "bg-foreground/5", border: "border-border/10" }
  }[idea.stage] ?? { text: "text-foreground/60", bg: "bg-foreground/5", border: "border-border/10" }

  const netScore = idea.likes - (idea.downvotes || 0)

  return (
    <div className="w-full pt-6 pb-24 px-6 xl:px-10">
      <div className="max-w-5xl mx-auto space-y-8">
        
        {/* Back Button */}
        <div>
          <Button onClick={() => router.back()} variant="ghost" className="text-foreground/55 hover:text-foreground hover:bg-foreground/[0.03] rounded-full px-4 h-8 text-xs font-semibold cursor-pointer">
            <ArrowLeft className="mr-2 h-3.5 w-3.5" /> Back to workspace
          </Button>
        </div>

        {/* Idea Content */}
        <div className={cn(
          "relative overflow-hidden rounded-xl border border-border/[0.03] bg-background/10 shadow-lg",
          idea.flagged && "border-rose-500/20 bg-rose-500/[0.01]"
        )}>
          {/* Subtle backdrop glow */}
          <div className="absolute -top-32 -right-32 w-64 h-64 rounded-full bg-brand-accent/2 blur-3xl pointer-events-none" />
          
          <div className="p-8 sm:p-10">
            <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
              <div className="space-y-1">
                <h1 className="text-3xl sm:text-4xl font-serif font-light tracking-tight text-foreground/95">
                  {idea.title}
                </h1>
                {idea.flagged && (
                  <Badge className="bg-rose-500/10 text-rose-400 border border-rose-500/20 text-[11px] font-mono px-2 py-0.5 mt-1">
                    ⚠️ FLAGGED: REVIEW PENDING
                  </Badge>
                )}
              </div>
              <Badge
                className={cn(
                  "text-[11px] font-semibold tracking-wider uppercase px-3 py-0.5 rounded-full border",
                  stageInfo.text, stageInfo.bg, stageInfo.border
                )}
              >
                {idea.stage.toUpperCase()}
              </Badge>
            </div>

            <div className="flex flex-wrap gap-1.5 mb-8">
              {idea.tags.map((tag) => (
                <Badge
                  key={tag}
                  className="bg-foreground/[0.01] text-foreground/40 border-border/[0.03] text-[9.5px] font-mono rounded px-2 py-0.5"
                >
                  #{tag}
                </Badge>
              ))}
            </div>

            <p className="text-foreground/70 whitespace-pre-line text-sm sm:text-[14.5px] leading-relaxed font-sans font-light max-w-3xl">
              {idea.description}
            </p>
          </div>

          {/* Looking For block */}
          {idea.lookingFor && idea.lookingFor.length > 0 && (
            <div className="border-t border-border/[0.03] bg-foreground/[0.002] p-8">
              <h3 className="text-[11px] font-mono uppercase tracking-[0.2em] text-foreground/35 mb-4">Looking For</h3>
              <div className="flex flex-wrap gap-2">
                {idea.lookingFor.map((item) => (
                  <Badge key={item} className="text-[11px] font-medium border-border/10 text-foreground bg-foreground/[0.01] rounded px-3 py-1">
                    {item}
                  </Badge>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Author & Voting Actions */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="md:col-span-1 bg-background/10 border-border/[0.03] rounded-xl shadow-md hover:border-border/10 transition-all duration-300">
            <CardContent className="p-6">
              <h3 className="text-[11px] font-mono uppercase tracking-[0.2em] text-foreground/35 mb-4">Author</h3>
              <div className="flex items-center gap-3">
                <Avatar className="h-10 w-10 border border-border/10 shadow">
                  <AvatarImage src={idea.authorAvatar} className="object-cover" />
                  <AvatarFallback className="bg-foreground/5 text-foreground/80 font-bold">{idea.author.charAt(0)}</AvatarFallback>
                </Avatar>
                <div className="min-w-0">
                  <p className="font-semibold text-xs text-foreground/90 truncate">{idea.author}</p>
                  <p className="text-[11px] text-foreground/40 truncate mt-0.5">{idea.authorHeadline || "Cohort Founder"}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="md:col-span-2 bg-background/10 border-border/[0.03] rounded-xl shadow-md hover:border-border/10 transition-all duration-300">
            <CardContent className="p-6 flex items-center justify-between gap-4 h-full">
              
              {/* Upvote / Downvote buttons (Replaces single heart toggle) */}
              <div className="flex items-center gap-3">
                <div className="flex items-center bg-foreground/[0.02] border border-border/10 rounded-lg p-1">
                  <button
                    onClick={() => handleVote("up")}
                    className="hover:text-emerald-400 p-1.5 transition-colors cursor-pointer"
                    aria-label="Upvote"
                  >
                    <ArrowBigUp className="h-5 w-5" />
                  </button>
                  <span className="text-xs font-bold px-2 text-foreground/80 min-w-[20px] text-center">
                    {netScore}
                  </span>
                  <button
                    onClick={() => handleVote("down")}
                    className="hover:text-rose-400 p-1.5 transition-colors cursor-pointer"
                    aria-label="Downvote"
                  >
                    <ArrowBigDown className="h-5 w-5" />
                  </button>
                </div>

                <button
                  onClick={() => setIsFlagModalOpen(true)}
                  disabled={idea.flagged}
                  className={cn(
                    "h-9 px-3 rounded-lg border border-border/10 text-foreground/40 hover:text-rose-400 hover:bg-rose-500/10 flex items-center gap-1.5 text-xs font-mono transition-all cursor-pointer",
                    idea.flagged && "opacity-50 pointer-events-none"
                  )}
                  title="Report or flag this spec"
                >
                  <Flag className="h-3.5 w-3.5" />
                  <span>{idea.flagged ? "Flagged" : "Flag"}</span>
                </button>
              </div>

              <Button className="h-9 rounded-full bg-foreground text-background hover:bg-brand-accent hover:text-background text-xs font-semibold px-5 transition-all duration-300 cursor-pointer">
                Collaborate
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Comments Section (Includes comment insertion form) */}
        <div className="rounded-xl border border-border/[0.03] bg-background/10 p-6 shadow-md hover:border-border/10 transition-all duration-300 space-y-6">
          <h2 className="text-base font-serif font-light text-foreground">
            Comments ({comments.length})
          </h2>

          {/* Comment composer */}
          <div className="flex gap-3">
            <Avatar className="h-8 w-8 border border-border/10 shrink-0">
              <AvatarImage src={userAvatar} className="object-cover" />
              <AvatarFallback className="bg-accent text-xs font-bold">{userName.charAt(0)}</AvatarFallback>
            </Avatar>
            <div className="flex-1 flex gap-2">
              <Input
                placeholder="Suggest validation fixes or ask detailed specification questions..."
                value={commentInput}
                onChange={(e) => setCommentInput(e.target.value)}
                className="h-9 bg-accent/20 border-border text-xs rounded-xl flex-1 focus-visible:ring-brand-accent"
              />
              <Button
                onClick={handleAddComment}
                disabled={!commentInput.trim()}
                className="h-9 w-9 rounded-xl bg-primary text-primary-foreground hover:opacity-95 p-0 flex items-center justify-center shrink-0 cursor-pointer"
              >
                <Send className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Comments list */}
          <div className="space-y-5">
            {comments.length > 0 ? (
              comments.map((comment) => (
                <div key={comment.id} className="flex items-start gap-4">
                  <Avatar className="h-8 w-8 border border-border/10 shrink-0">
                    <AvatarImage src={comment.authorAvatar} className="object-cover" />
                    <AvatarFallback className="bg-foreground/5 text-foreground/70 text-xs font-semibold">{comment.author.charAt(0)}</AvatarFallback>
                  </Avatar>
                  <div className="w-full bg-foreground/[0.005] p-3 rounded-xl border border-border/[0.02]">
                    <div className="flex items-center justify-between gap-2 mb-1">
                      <p className="font-semibold text-xs text-foreground/80">{comment.author}</p>
                      <p className="text-[11px] font-mono text-foreground/30 uppercase tracking-wide">{comment.timestamp}</p>
                    </div>
                    <p className="text-xs text-foreground/60 leading-relaxed font-sans font-light">
                      {comment.text}
                    </p>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-xs text-foreground/30 text-center py-6 font-mono uppercase tracking-widest">No comments yet</p>
            )}
          </div>
        </div>

      </div>

      {/* Flag dialog */}
      {isFlagModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-popover border border-border p-6 rounded-xl max-w-sm w-full space-y-4 shadow-2xl">
            <div className="flex items-center gap-2 text-rose-500">
              <AlertTriangle className="h-5 w-5" />
              <h3 className="font-serif text-base font-semibold text-foreground">Complain/Flag Idea</h3>
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Help moderate cohort ideas. Surfacing plagiarism or malicious code specifications protects early validation.
            </p>
            <Input
              placeholder="Reason for flag..."
              value={flagReasonText}
              onChange={(e) => setFlagReasonText(e.target.value)}
              className="bg-accent/20 border-border text-xs"
            />
            <div className="flex justify-end gap-2 pt-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => { setIsFlagModalOpen(false); setFlagReasonText("") }}
                className="h-8 text-xs rounded-lg border-border/60"
              >
                Cancel
              </Button>
              <Button
                size="sm"
                onClick={handleFlagIdea}
                className="h-8 text-xs rounded-lg bg-rose-600 text-white hover:bg-rose-700"
              >
                Submit Flag
              </Button>
            </div>
          </div>
        </div>
      )}

    </div>
  )
}
