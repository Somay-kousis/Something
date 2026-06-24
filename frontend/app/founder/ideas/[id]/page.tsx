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
        <Loader2 className="w-8 h-8 animate-spin text-white/60" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-96 text-center">
        <AlertTriangle className="w-12 h-12 text-red-400 mb-4" />
        <h2 className="text-xl font-semibold mb-2">An Error Occurred</h2>
        <p className="text-white/70 mb-4">{error}</p>
        <Button onClick={() => router.back()} variant="outline" className="border-white/20">
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
    concept: { text: "text-white/60", bg: "bg-white/5", border: "border-white/10" }
  }[idea.stage] ?? { text: "text-white/60", bg: "bg-white/5", border: "border-white/10" }

  return (
    <div className="max-w-5xl mx-auto space-y-8 pt-4 pb-20">
      {/* Back Button */}
      <div>
        <Button onClick={() => router.back()} variant="ghost" className="text-white/60 hover:text-white hover:bg-white/5 rounded-full px-4 h-8 text-xs font-semibold">
          <ArrowLeft className="mr-2 h-3.5 w-3.5" /> Back to workspace
        </Button>
      </div>

      {/* Idea Card */}
      <div className="relative overflow-hidden rounded-2xl border border-white/5 bg-white/[0.01] shadow-2xl">
        {/* Glow backdrop */}
        <div className="absolute -top-32 -right-32 w-64 h-64 rounded-full bg-brand-accent/3 blur-3xl pointer-events-none" />
        
        <div className="p-8">
          <div className="flex flex-wrap items-center justify-between gap-4 mb-5">
            <h1 className="text-3xl font-bold tracking-tight text-white" style={{ fontFamily: "var(--font-outfit)" }}>
              {idea.title}
            </h1>
            <Badge
              className={cn(
                "text-[10px] font-semibold tracking-widest uppercase px-3 py-1 rounded-full border",
                stageInfo.text, stageInfo.bg, stageInfo.border
              )}
            >
              {idea.stage.toUpperCase()}
            </Badge>
          </div>

          <div className="flex flex-wrap gap-2 mb-8">
            {idea.tags.map((tag) => (
              <Badge
                key={tag}
                className="bg-white/[0.02] text-white/50 border-white/5 text-[10px] font-mono rounded px-2.5 py-0.5"
              >
                #{tag}
              </Badge>
            ))}
          </div>

          <p className="text-white/70 whitespace-pre-line text-sm leading-relaxed font-sans">{idea.description}</p>
        </div>

        {/* Looking For block */}
        {idea.lookingFor && idea.lookingFor.length > 0 && (
          <div className="border-t border-white/5 bg-white/[0.005] p-8">
            <h3 className="text-[10px] font-mono uppercase tracking-widest text-white/40 mb-4">Looking For</h3>
            <div className="flex flex-wrap gap-2">
              {idea.lookingFor.map((item) => (
                <Badge key={item} className="text-xs font-medium border-white/10 text-white bg-white/[0.02] rounded px-3 py-1">
                  {item}
                </Badge>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Author & Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="md:col-span-1 bg-white/[0.01] border-white/5 rounded-2xl shadow-xl hover:border-white/10 transition-all duration-300">
          <CardContent className="p-6">
            <h3 className="text-[9px] font-mono uppercase tracking-widest text-white/40 mb-4">Author</h3>
            <div className="flex items-center gap-3">
              <Avatar className="h-10 w-10 border border-white/10 shadow">
                <AvatarImage src={idea.authorAvatar} />
                <AvatarFallback className="bg-white/5 text-white font-bold">{idea.author.charAt(0)}</AvatarFallback>
              </Avatar>
              <div className="min-w-0">
                <p className="font-semibold text-sm text-white truncate">{idea.author}</p>
                <p className="text-[10px] text-white/40 truncate mt-0.5">{idea.authorHeadline}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="md:col-span-2 bg-white/[0.01] border-white/5 rounded-2xl shadow-xl hover:border-white/10 transition-all duration-300">
          <CardContent className="p-6 flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <Button
                onClick={handleLike}
                variant="outline"
                className="h-9 rounded-lg border-white/10 text-white/80 hover:bg-white/5 hover:text-white text-xs font-semibold px-4"
                disabled={isLiking}
              >
                <Heart className="mr-2 h-4 w-4 text-white/40 group-hover:text-[#F472B6]" /> Like ({idea.likes})
              </Button>
              <Button variant="outline" className="h-9 rounded-lg border-white/10 text-white/80 hover:bg-white/5 hover:text-white text-xs font-semibold px-4">
                <MessageSquare className="mr-2 h-4 w-4 text-white/40" /> Comment ({idea.commentsCount})
              </Button>
            </div>
            <Button className="h-9 rounded-full bg-white text-[#0a0a0c] hover:bg-brand-accent hover:text-[#0a0a0c] text-xs font-semibold px-5 transition-all duration-300">Collaborate</Button>
          </CardContent>
        </Card>
      </div>

      {/* Comments Section */}
      <div className="rounded-2xl border border-white/5 bg-white/[0.01] p-6 shadow-xl hover:border-white/10 transition-all duration-300">
        <h2 className="text-base font-bold tracking-tight text-white mb-6" style={{ fontFamily: "var(--font-outfit)" }}>
          Comments ({comments.length})
        </h2>
        <div className="space-y-4">
          {comments.length > 0 ? (
            comments.map((comment) => (
              <div key={comment.id} className="flex items-start gap-3.5">
                <Avatar className="h-8 w-8 border border-white/5 shrink-0">
                  <AvatarImage src={comment.authorAvatar} />
                  <AvatarFallback className="bg-white/5 text-white/70 text-xs font-semibold">{comment.author.charAt(0)}</AvatarFallback>
                </Avatar>
                <div className="bg-black/30 border border-white/5 rounded-xl px-4 py-3 w-full">
                  <div className="flex items-center justify-between gap-2 mb-1.5">
                    <p className="font-semibold text-xs text-white/80">{comment.author}</p>
                    <p className="text-[10px] font-mono text-white/35 uppercase tracking-wide">{comment.timestamp}</p>
                  </div>
                  <p className="text-xs text-white/60 leading-relaxed font-sans">{comment.text}</p>
                </div>
              </div>
            ))
          ) : (
            <p className="text-xs text-white/30 text-center py-6 font-mono uppercase tracking-widest">No comments yet</p>
          )}
        </div>
      </div>
    </div>
  )
}
