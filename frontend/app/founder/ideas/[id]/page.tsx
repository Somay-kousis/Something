"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import axios from "axios"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { ArrowLeft, MessageSquare, Heart, Loader2, AlertTriangle } from "lucide-react"

// Backend API base URL from environment variable
const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || ""

type Stage = "concept" | "prototype" | "mvp" | "launched"

interface Idea {
  id: string
  title: string
  author: string
  authorAvatar: string
  authorHeadline: string
  stage: Stage
  tags: string[]
  description: string
  lookingFor: string[]
  likes: number
  commentsCount: number
}

interface Comment {
  id: string
  author: string
  authorAvatar: string
  text: string
  timestamp: string
}

// API Service Layer
const ideaAPI = {
  async getIdeaDetails(id: string): Promise<Idea> {
    const response = await axios.get(`${API_BASE_URL}/ideas/${id}`)
    return response.data
  },

  async getIdeaComments(id: string): Promise<Comment[]> {
    const response = await axios.get(`${API_BASE_URL}/ideas/${id}/comments`)
    return response.data
  },

  async likeIdea(id: string): Promise<Idea> {
    const token = localStorage.getItem("token")
    if (!token) throw new Error("User not authenticated")
    const response = await axios.post(
      `${API_BASE_URL}/ideas/${id}/like`,
      {},
      { headers: { Authorization: `Bearer ${token}` } }
    )
    return response.data
  },
}

export default function IdeaDetailsPage() {
  const router = useRouter()
  const params = useParams()
  const id = params.id as string

  const [idea, setIdea] = useState<Idea | null>(null)
  const [comments, setComments] = useState<Comment[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isLiking, setIsLiking] = useState(false)

  useEffect(() => {
    if (!id) return

    const fetchData = async () => {
      setIsLoading(true)
      setError(null)
      try {
        const [ideaData, commentsData] = await Promise.all([
          ideaAPI.getIdeaDetails(id),
          ideaAPI.getIdeaComments(id),
        ])
        setIdea(ideaData)
        setComments(commentsData)
      } catch (err) {
        setError("Could not load the idea. It might not exist or there was a network error.")
        console.error(err)
      } finally {
        setIsLoading(false)
      }
    }

    fetchData()
  }, [id])

  const handleLike = async () => {
    if (!idea || isLiking) return
    setIsLiking(true)
    try {
      const updatedIdea = await ideaAPI.likeIdea(idea.id)
      setIdea(updatedIdea)
    } catch (err) {
      console.error("Failed to like the idea:", err)
    } finally {
      setIsLiking(false)
    }
  }

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-96">
        <Loader2 className="w-8 h-8 animate-spin text-foreground/60" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-96 text-center">
        <AlertTriangle className="w-12 h-12 text-red-400 mb-4" />
        <h2 className="text-xl font-semibold mb-2">An Error Occurred</h2>
        <p className="text-foreground/70 mb-4">{error}</p>
        <Button onClick={() => router.back()} variant="outline" className="border-border/20">
          <ArrowLeft className="mr-2 h-4 w-4" /> Go Back
        </Button>
      </div>
    )
  }

  if (!idea) return null

  const stageInfo = {
    launched: { text: "text-brand-accent", bg: "bg-brand-accent/10", border: "border-brand-accent/20" },
    mvp: { text: "text-[#F472B6]", bg: "bg-[#F472B6]/10", border: "border-[#F472B6]/20" },
    prototype: { text: "text-[#C88E72]", bg: "bg-[#C88E72]/10", border: "border-[#C88E72]/20" },
    concept: { text: "text-foreground/60", bg: "bg-foreground/5", border: "border-border/10" }
  }[idea.stage] ?? { text: "text-foreground/60", bg: "bg-foreground/5", border: "border-border/10" }

  return (
    <div className="w-full pt-6 pb-24 px-6 xl:px-10">
      <div className="max-w-5xl mx-auto space-y-8">
      {/* Back Button */}
      <div>
        <Button onClick={() => router.back()} variant="ghost" className="text-foreground/55 hover:text-foreground hover:bg-foreground/[0.03] rounded-full px-4 h-8 text-xs font-semibold cursor-pointer">
          <ArrowLeft className="mr-2 h-3.5 w-3.5" /> Back to workspace
        </Button>
      </div>

      {/* Idea Content (Clean Reading Document Style) */}
      <div className="relative overflow-hidden rounded-xl border border-border/[0.03] bg-background/10 shadow-lg">
        {/* Subtle backdrop glow */}
        <div className="absolute -top-32 -right-32 w-64 h-64 rounded-full bg-brand-accent/2 blur-3xl pointer-events-none" />
        
        <div className="p-8 sm:p-10">
          <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
            <h1 className="text-3xl sm:text-4xl font-serif font-light tracking-tight text-foreground/95">
              {idea.title}
            </h1>
            <Badge
              className={cn(
                "text-[9px] font-semibold tracking-wider uppercase px-3 py-0.5 rounded-full border",
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

          <p className="text-foreground/70 whitespace-pre-line text-sm sm:text-[14.5px] leading-relaxed font-sans font-light max-w-3xl">{idea.description}</p>
        </div>

        {/* Looking For block */}
        {idea.lookingFor && idea.lookingFor.length > 0 && (
          <div className="border-t border-border/[0.03] bg-foreground/[0.002] p-8">
            <h3 className="text-[9px] font-mono uppercase tracking-[0.2em] text-foreground/35 mb-4">Looking For</h3>
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

      {/* Author & Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="md:col-span-1 bg-background/10 border-border/[0.03] rounded-xl shadow-md hover:border-border/10 transition-all duration-300">
          <CardContent className="p-6">
            <h3 className="text-[9px] font-mono uppercase tracking-[0.2em] text-foreground/35 mb-4">Author</h3>
            <div className="flex items-center gap-3">
              <Avatar className="h-10 w-10 border border-border/10 shadow">
                <AvatarImage src={idea.authorAvatar} className="object-cover" />
                <AvatarFallback className="bg-foreground/5 text-foreground/80 font-bold">{idea.author.charAt(0)}</AvatarFallback>
              </Avatar>
              <div className="min-w-0">
                <p className="font-semibold text-xs text-foreground/90 truncate">{idea.author}</p>
                <p className="text-[10px] text-foreground/40 truncate mt-0.5">{idea.authorHeadline}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="md:col-span-2 bg-background/10 border-border/[0.03] rounded-xl shadow-md hover:border-border/10 transition-all duration-300">
          <CardContent className="p-6 flex items-center justify-between gap-4 h-full">
            <div className="flex items-center gap-3">
              <Button
                onClick={handleLike}
                variant="outline"
                className="h-9 rounded-lg border-border/10 text-foreground/70 hover:bg-foreground/5 hover:text-foreground text-xs font-semibold px-4 cursor-pointer bg-transparent"
                disabled={isLiking}
              >
                <Heart className="mr-2 h-4 w-4 text-foreground/30" /> Like ({idea.likes})
              </Button>
              <Button variant="outline" className="h-9 rounded-lg border-border/10 text-foreground/70 hover:bg-foreground/5 hover:text-foreground text-xs font-semibold px-4 cursor-pointer bg-transparent">
                <MessageSquare className="mr-2 h-4 w-4 text-foreground/30" /> Comment ({idea.commentsCount})
              </Button>
            </div>
            <Button className="h-9 rounded-full bg-foreground text-background hover:bg-brand-accent hover:text-background text-xs font-semibold px-5 transition-all duration-300 cursor-pointer">Collaborate</Button>
          </CardContent>
        </Card>
      </div>

      {/* Comments Section */}
      <div className="rounded-xl border border-border/[0.03] bg-background/10 p-6 shadow-md hover:border-border/10 transition-all duration-300">
        <h2 className="text-base font-serif font-light text-foreground mb-6">
          Comments ({comments.length})
        </h2>
        <div className="space-y-5">
          {comments.length > 0 ? (
            comments.map((comment) => (
              <div key={comment.id} className="flex items-start gap-4">
                <Avatar className="h-8 w-8 border border-border/10 shrink-0">
                  <AvatarImage src={comment.authorAvatar} className="object-cover" />
                  <AvatarFallback className="bg-foreground/5 text-foreground/70 text-xs font-semibold">{comment.author.charAt(0)}</AvatarFallback>
                </Avatar>
                <div className="w-full">
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <p className="font-semibold text-xs text-foreground/80">{comment.author}</p>
                    <p className="text-[9px] font-mono text-foreground/30 uppercase tracking-wide">{comment.timestamp}</p>
                  </div>
                  <p className="text-xs text-foreground/60 leading-relaxed font-sans font-light">{comment.text}</p>
                </div>
              </div>
            ))
          ) : (
            <p className="text-xs text-foreground/30 text-center py-6 font-mono uppercase tracking-widest">No comments yet</p>
          )}
        </div>
      </div>
      </div>
    </div>
  )
}
