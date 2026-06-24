"use client"

import { useState, useEffect, useCallback } from "react"
import { useRouter } from "next/navigation"
import axios from "axios"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { Search, Plus, Filter, Eye, MessageSquare, Heart, Edit, Loader2 } from "lucide-react"
import { cn } from "@/lib/utils"
import { PostIdeaModal } from "@/components/post-idea-modal"
import { PageHeader } from "@/components/page-header"


const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || ""

type Tab = "yours" | "discover"

type Stage = "concept" | "prototype" | "mvp" | "launched"

interface Idea {
  id: string
  title: string
  author: string
  desc?: string
  tags: string[]
  stage: Stage
  funding?: string
  likes: number
  comments: number
  views: number
  isYours?: boolean
  lookingFor?: string[]
  description?: string
  isDraft?: boolean
  createdAt?: string
}

interface IdeaFormData {
  title: string
  description: string
  tags: string[]
  stage: Stage
  lookingFor: string[]
  isDraft: boolean
}

// ---------- Mock Data for Offline Fallback ----------
const MOCK_YOUR_IDEAS: Idea[] = [
  {
    id: "y1",
    title: "Edge Vision Kit",
    author: "You",
    desc: "Low‑power on‑device vision kit with local models. Shipping v0 sensors to early adopters.",
    description: "Low‑power on‑device vision kit with local models. Shipping v0 sensors to early adopters. This system enables real-time computer vision processing without cloud dependency, perfect for robotics and IoT applications.",
    tags: ["Edge AI", "Robotics", "Hardware"],
    stage: "mvp",
    funding: "$8,000 raised",
    likes: 24,
    comments: 8,
    views: 156,
    isYours: true,
    lookingFor: ["Hardware engineer", "Go-to-market lead"],
    isDraft: false,
    createdAt: "2026-06-18",
  },
  {
    id: "y2",
    title: "Local‑first Creator Analytics",
    author: "You",
    desc: "Privacy‑first analytics with CRDT sync across devices. No data leaves your control.",
    description: "Privacy‑first analytics with CRDT sync across devices. No data leaves your control. Built for creators who want to understand their audience without compromising privacy.",
    tags: ["Creator infra", "Privacy", "Local‑first"],
    stage: "prototype",
    funding: "$4,400 / $12,000",
    likes: 18,
    comments: 12,
    views: 89,
    isYours: true,
    lookingFor: ["Frontend developer", "Marketing advisor"],
    isDraft: false,
    createdAt: "2026-06-15",
  }
]

const MOCK_DISCOVER_IDEAS: Idea[] = [
  {
    id: "d1",
    title: "Neurotech IDE",
    author: "Sam K.",
    desc: "Local‑only IDE and toolchain for neural interfaces. Privacy‑first development environment.",
    description: "Local‑only IDE and toolchain for neural interfaces. Privacy‑first development environment for developers working on next-gen brain-computer interfaces.",
    tags: ["Bio tooling", "Privacy", "Dev tools"],
    stage: "prototype",
    likes: 42,
    comments: 15,
    views: 234,
    lookingFor: ["Frontend developer", "Neuroscientist"],
    createdAt: "2026-06-10",
  },
  {
    id: "d2",
    title: "DePIN Sensor Mesh",
    author: "Riley M.",
    desc: "Community-powered sensor mesh with provable data lineage and token incentives.",
    description: "Community-powered sensor mesh with provable data lineage and token incentives. Build local meshes and earn tokens for sharing high-fidelity environmental telemetry.",
    tags: ["DePIN", "Edge AI", "Crypto"],
    stage: "mvp",
    funding: "Seeking $60k",
    likes: 67,
    comments: 23,
    views: 445,
    lookingFor: ["Blockchain developer", "Hardware engineer"],
    createdAt: "2026-06-08",
  }
]

function getLocalStorageItem<T>(key: string, defaultValue: T): T {
  if (typeof window === "undefined") return defaultValue
  const saved = localStorage.getItem(key)
  return saved ? JSON.parse(saved) : defaultValue
}

function setLocalStorageItem<T>(key: string, value: T): void {
  if (typeof window !== "undefined") {
    localStorage.setItem(key, JSON.stringify(value))
  }
}

// ---------- API Service ----------
const ideasAPI = {
  async fetchYourIdeas(): Promise<Idea[]> {
    try {
      const token = localStorage.getItem("token")
      if (!token) throw new Error("User not authenticated")
      const response = await axios.get(`${API_BASE_URL}/ideas/user`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      return response.data
    } catch (error) {
      console.error("fetchYourIdeas failed, using mock data", error)
      return getLocalStorageItem<Idea[]>("founder_your_ideas", MOCK_YOUR_IDEAS)
    }
  },

  async fetchDiscoverIdeas(): Promise<Idea[]> {
    try {
      const response = await axios.get(`${API_BASE_URL}/ideas/discover`)
      return response.data
    } catch (error) {
      console.error("fetchDiscoverIdeas failed, using mock data", error)
      return getLocalStorageItem<Idea[]>("founder_discover_ideas", MOCK_DISCOVER_IDEAS)
    }
  },

  async createIdea(data: IdeaFormData): Promise<Idea> {
    try {
      const token = localStorage.getItem("token")
      if (!token) throw new Error("User not authenticated")
      const response = await axios.post(`${API_BASE_URL}/ideas`, data, {
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      })
      return response.data
    } catch (error) {
      console.warn("createIdea failed, mocking locally", error)
      const list = getLocalStorageItem<Idea[]>("founder_your_ideas", MOCK_YOUR_IDEAS)
      const newIdea: Idea = {
        id: `mock-${Date.now()}`,
        title: data.title,
        author: "You",
        desc: data.description.slice(0, 120) + (data.description.length > 120 ? "..." : ""),
        description: data.description,
        tags: data.tags,
        stage: data.stage,
        likes: 0,
        comments: 0,
        views: 1,
        isYours: true,
        lookingFor: data.lookingFor,
        isDraft: data.isDraft,
        createdAt: new Date().toISOString().split("T")[0],
      }
      setLocalStorageItem("founder_your_ideas", [newIdea, ...list])
      return newIdea
    }
  },

  async updateIdea(id: string, data: IdeaFormData): Promise<Idea> {
    try {
      const token = localStorage.getItem("token")
      if (!token) throw new Error("User not authenticated")
      const response = await axios.put(`${API_BASE_URL}/ideas/${id}`, data, {
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      })
      return response.data
    } catch (error) {
      console.warn("updateIdea failed, mocking locally", error)
      const list = getLocalStorageItem<Idea[]>("founder_your_ideas", MOCK_YOUR_IDEAS)
      let updatedIdea: Idea | null = null
      const updatedList = list.map((idea) => {
        if (idea.id === id) {
          updatedIdea = {
            ...idea,
            title: data.title,
            desc: data.description.slice(0, 120) + (data.description.length > 120 ? "..." : ""),
            description: data.description,
            tags: data.tags,
            stage: data.stage,
            lookingFor: data.lookingFor,
            isDraft: data.isDraft,
          }
          return updatedIdea
        }
        return idea
      })
      if (!updatedIdea) {
        throw new Error("Idea not found for update")
      }
      setLocalStorageItem("founder_your_ideas", updatedList)
      return updatedIdea
    }
  },

  async deleteIdea(id: string): Promise<void> {
    try {
      const token = localStorage.getItem("token")
      if (!token) throw new Error("User not authenticated")
      await axios.delete(`${API_BASE_URL}/ideas/${id}`, { headers: { Authorization: `Bearer ${token}` } })
    } catch (error) {
      console.warn("deleteIdea failed, mocking locally", error)
      const list = getLocalStorageItem<Idea[]>("founder_your_ideas", MOCK_YOUR_IDEAS)
      setLocalStorageItem("founder_your_ideas", list.filter((idea) => idea.id !== id))
    }
  },

  async likeIdea(id: string): Promise<void> {
    try {
      const token = localStorage.getItem("token")
      if (!token) throw new Error("User not authenticated")
      await axios.post(`${API_BASE_URL}/ideas/${id}/like`, {}, { headers: { Authorization: `Bearer ${token}` } })
    } catch (error) {
      console.warn("likeIdea failed, mocking locally", error)
      // Increment like in local stores
      const yourList = getLocalStorageItem<Idea[]>("founder_your_ideas", MOCK_YOUR_IDEAS)
      setLocalStorageItem(
        "founder_your_ideas",
        yourList.map((idea) => (idea.id === id ? { ...idea, likes: idea.likes + 1 } : idea))
      )
      const discoverList = getLocalStorageItem<Idea[]>("founder_discover_ideas", MOCK_DISCOVER_IDEAS)
      setLocalStorageItem(
        "founder_discover_ideas",
        discoverList.map((idea) => (idea.id === id ? { ...idea, likes: idea.likes + 1 } : idea))
      )
    }
  },

  async getIdeaById(id: string): Promise<Idea> {
    try {
      const response = await axios.get(`${API_BASE_URL}/ideas/${id}`)
      return response.data
    } catch (error) {
      console.warn("getIdeaById failed, mocking locally", error)
      const allIdeas = [
        ...getLocalStorageItem<Idea[]>("founder_your_ideas", MOCK_YOUR_IDEAS),
        ...getLocalStorageItem<Idea[]>("founder_discover_ideas", MOCK_DISCOVER_IDEAS)
      ]
      const found = allIdeas.find((idea) => idea.id === id)
      if (found) return found
      throw new Error("Idea not found")
    }
  },
}

// ---------- Component ----------
export default function FounderIdeasPage() {
  const [tab, setTab] = useState<Tab>("yours")
  const [query, setQuery] = useState("")
  const [yourIdeas, setYourIdeas] = useState<Idea[]>([])
  const [discoverIdeas, setDiscoverIdeas] = useState<Idea[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showFilters, setShowFilters] = useState(false)
  const [stageFilter, setStageFilter] = useState<"all" | Stage>("all")
  const [sortBy, setSortBy] = useState<"newest" | "likes" | "views">("newest")
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingIdea, setEditingIdea] = useState<Idea | null>(null)
  const router = useRouter()

  useEffect(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search)
      if (params.get("new") === "true") {
        setIsModalOpen(true)
        router.replace("/founder/ideas")
      }
    }
  }, [router])

  const loadIdeas = useCallback(async () => {
    setIsLoading(true)
    setError(null)
    try {
      if (tab === "yours") {
        const ideas = await ideasAPI.fetchYourIdeas()
        setYourIdeas(ideas)
      } else {
        const ideas = await ideasAPI.fetchDiscoverIdeas()
        setDiscoverIdeas(ideas)
      }
    } catch (err) {
      setError("Failed to load ideas. Please try again.")
      console.error(err)
    } finally {
      setIsLoading(false)
    }
  }, [tab])

  useEffect(() => {
    loadIdeas()
  }, [loadIdeas])

  // Sync state if localStorage updates
  useEffect(() => {
    const handleStorageChange = () => {
      loadIdeas()
    }
    window.addEventListener("storage", handleStorageChange)
    return () => {
      window.removeEventListener("storage", handleStorageChange)
    }
  }, [loadIdeas])

  const ideas = tab === "yours" ? yourIdeas : discoverIdeas
  const filtered = ideas
    .filter((idea) => {
      const matchesQuery =
        idea.title.toLowerCase().includes(query.toLowerCase()) ||
        idea.desc?.toLowerCase().includes(query.toLowerCase()) ||
        idea.description?.toLowerCase().includes(query.toLowerCase()) ||
        idea.tags.some((tag) => tag.toLowerCase().includes(query.toLowerCase())) ||
        idea.author.toLowerCase().includes(query.toLowerCase())

      const matchesStage = stageFilter === "all" || idea.stage === stageFilter

      return matchesQuery && matchesStage
    })
    .sort((a, b) => {
      if (sortBy === "likes") return b.likes - a.likes
      if (sortBy === "views") return b.views - a.views
      const dateA = a.createdAt || ""
      const dateB = b.createdAt || ""
      return dateB.localeCompare(dateA)
    })

  function handleEditClick(idea: Idea) {
    setEditingIdea(idea)
    setIsModalOpen(true)
  }

  async function handleIdeaSubmit(data: IdeaFormData) {
    try {
      const newIdea = await ideasAPI.createIdea(data)
      setYourIdeas((prev) => [newIdea, ...prev])
      setIsModalOpen(false)
    } catch (err) {
      console.error("Failed to create idea:", err)
      setError("Failed to create idea. Please try again.")
    }
  }

  async function handleIdeaUpdate(ideaData: IdeaFormData) {
    if (!editingIdea) return
    try {
      const updatedIdea = await ideasAPI.updateIdea(editingIdea.id, ideaData)
      setYourIdeas((prev) => prev.map((idea) => (idea.id === editingIdea.id ? updatedIdea : idea)))
      setEditingIdea(null)
      setIsModalOpen(false)
    } catch (err) {
      console.error("Failed to update idea:", err)
      setError("Failed to update idea. Please try again.")
    }
  }

  function handleModalSubmit(data: IdeaFormData) {
    if (editingIdea) {
      handleIdeaUpdate(data)
    } else {
      handleIdeaSubmit(data)
    }
  }

  async function handleModalDelete() {
    if (!editingIdea) return
    try {
      await ideasAPI.deleteIdea(editingIdea.id)
      setYourIdeas((prev) => prev.filter((idea) => idea.id !== editingIdea.id))
      setEditingIdea(null)
      setIsModalOpen(false)
    } catch (err) {
      console.error("Failed to delete idea:", err)
      setError("Failed to delete idea. Please try again.")
    }
  }

  function handleViewClick(idea: Idea) {
    if (!idea.isYours) router.push(`/founder/ideas/${idea.id}`)
  }

  async function handleLikeIdea(ideaId: string) {
    try {
      await ideasAPI.likeIdea(ideaId)
      const updateIdeas = (ideas: Idea[]) =>
        ideas.map((idea) =>
          idea.id === ideaId ? { ...idea, likes: idea.likes + 1 } : idea
        )
      if (tab === "yours") {
  setYourIdeas(updateIdeas)
} else {
  setDiscoverIdeas(updateIdeas)
}
    } catch (err) {
      console.error("Failed to like idea:", err)
    }
  }

  function IdeaRow({ idea }: { idea: Idea }) {
    const stageColors = {
      launched: { text: "text-brand-accent", bg: "bg-brand-accent/10", border: "border-brand-accent/20" },
      mvp: { text: "text-[#F472B6]", bg: "bg-[#F472B6]/10", border: "border-[#F472B6]/20" },
      prototype: { text: "text-[#C88E72]", bg: "bg-[#C88E72]/10", border: "border-[#C88E72]/20" },
      concept: { text: "text-white/60", bg: "bg-white/5", border: "border-white/10" }
    }[idea.stage] ?? { text: "text-white/60", bg: "bg-white/5", border: "border-white/10" }

    return (
      <div className="py-8 transition-colors group flex flex-col justify-between gap-4 first:pt-0 last:pb-0">
        <div className="space-y-3">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2 mb-1">
                <h3 className="font-semibold text-base leading-snug tracking-tight text-white group-hover:text-brand-accent transition-colors">
                  {idea.title}
                </h3>
                {idea.isDraft && (
                  <Badge className="bg-[#C88E72]/10 text-[#C88E72] border-[#C88E72]/20 text-[9px] font-semibold tracking-wider uppercase px-2 py-0.5 rounded-full border">
                    Draft
                  </Badge>
                )}
              </div>
              <p className="text-[11px] font-mono text-white/35">by {idea.author}</p>
            </div>
            <div className="flex items-center gap-1.5 shrink-0">
              <Badge
                className={cn(
                  "text-[9px] font-semibold tracking-wider uppercase px-2.5 py-0.5 rounded-full border",
                  stageColors.text, stageColors.bg, stageColors.border
                )}
              >
                {idea.stage.toUpperCase()}
              </Badge>
              {idea.isYours && (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => handleEditClick(idea)}
                  className="h-7 w-7 text-white/40 hover:text-white hover:bg-white/5 rounded-full"
                >
                  <Edit className="h-3.5 w-3.5" />
                </Button>
              )}
            </div>
          </div>

          <p className="text-sm text-white/60 leading-relaxed font-sans">{idea.desc || idea.description}</p>

          <div className="flex flex-wrap gap-2 pt-1">
            {idea.tags.map((tag) => (
              <Badge key={tag} className="bg-white/[0.02] text-white/40 border-white/5 text-[9px] font-mono rounded-md py-0.5 px-2">
                #{tag}
              </Badge>
            ))}
          </div>

          {idea.lookingFor && idea.lookingFor.length > 0 && (
            <div className="flex items-center gap-2 pt-2">
              <span className="text-[9px] text-white/30 font-semibold uppercase tracking-widest font-mono">Looking for:</span>
              <div className="flex flex-wrap gap-1.5">
                {idea.lookingFor.map((item) => (
                  <Badge
                    key={item}
                    className="bg-white/[0.01] text-white/60 border-white/5 text-[9px] rounded px-1.5 py-0.5"
                  >
                    {item}
                  </Badge>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="flex items-center justify-between pt-2">
          <div className="flex items-center gap-4 text-xs font-mono text-white/35">
            <button
              onClick={() => handleLikeIdea(idea.id)}
              className="flex items-center gap-1.5 hover:text-[#F472B6] transition-colors"
            >
              <Heart className="h-3.5 w-3.5" />
              <span>{idea.likes}</span>
            </button>
            <span className="flex items-center gap-1.5">
              <MessageSquare className="h-3.5 w-3.5" />
              <span>{idea.comments}</span>
            </span>
            <span className="flex items-center gap-1.5">
              <Eye className="h-3.5 w-3.5" />
              <span>{idea.views}</span>
            </span>
          </div>
          <Button
            variant="outline"
            onClick={() => handleViewClick(idea)}
            className="h-7 text-[10px] font-semibold rounded-full border-white/10 text-white/80 hover:bg-white/10 hover:text-white transition-all px-4"
          >
            {idea.isYours ? "Share" : "Explore"}
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-4xl space-y-12 pt-4 pb-20">
      <PageHeader
        category="Ideas Workspace"
        title="Ideas & Projects"
        description="Share your concepts, manage active drafts, and discover what other builders are working on in the cohort."
        accentColor="emerald"
        action={
          <Button onClick={() => { setEditingIdea(null); setIsModalOpen(true); }} className="rounded-full text-xs font-semibold px-6 py-2.5 bg-white text-[#0a0a0c] hover:bg-brand-accent hover:text-[#0a0a0c] transition-all duration-300 active:scale-[0.98] cursor-pointer">
            <Plus className="mr-1.5 h-3.5 w-3.5" /> Post new idea
          </Button>
        }
      />

      {/* Tabs and search */}
      <div className="py-6 border-y border-white/5">
        <div className="flex flex-col md:flex-row gap-4 items-stretch md:items-center">
          <div className="flex rounded-lg border border-white/5 bg-black/40 p-1 shrink-0">
            <button
              onClick={() => setTab("yours")}
              className={cn(
                "px-4 py-1.5 text-xs font-semibold rounded-md transition-all duration-200 cursor-pointer",
                tab === "yours" ? "bg-white text-black shadow-lg" : "text-white/50 hover:text-white"
              )}
            >
              Your ideas ({yourIdeas.length})
            </button>
            <button
              onClick={() => setTab("discover")}
              className={cn(
                "px-4 py-1.5 text-xs font-semibold rounded-md transition-all duration-200 cursor-pointer",
                tab === "discover" ? "bg-white text-black shadow-lg" : "text-white/50 hover:text-white"
              )}
            >
              Discover
            </button>
          </div>

          <div className="flex gap-2 flex-1 items-center">
            <div className="relative flex-1">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/30" />
              <Input
                placeholder="Search ideas, tags, authors…"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="pl-9 h-9 bg-black/40 border-white/5 text-white placeholder:text-white/30 rounded-lg focus-visible:ring-brand-accent focus-visible:border-brand-accent/20"
              />
            </div>
            <Button
              onClick={() => setShowFilters(!showFilters)}
              variant="outline"
              className={cn(
                "h-9 border-white/10 text-white/80 hover:bg-white/5 hover:text-white rounded-lg px-4 text-xs font-semibold bg-transparent transition-all",
                showFilters && "bg-white/10 border-white/20 text-white"
              )}
            >
              <Filter className="mr-2 h-4 w-4 text-white/40" />
              Filter
            </Button>
          </div>
        </div>

        {/* Collapsible Filter Panel */}
        {showFilters && (
          <div className="border-t border-white/5 mt-4 pt-4 space-y-4 transition-all duration-300">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Stage Filter */}
              <div className="space-y-2">
                <span className="text-[10px] uppercase tracking-wider text-white/40 font-semibold font-mono block">Project Stage</span>
                <div className="flex flex-wrap gap-1.5">
                  {["all", "concept", "prototype", "mvp", "launched"].map((stageOpt) => (
                    <button
                      key={stageOpt}
                      onClick={() => setStageFilter(stageOpt as any)}
                      className={cn(
                        "px-3 py-1 rounded-lg border text-xs font-medium transition-all capitalize",
                        stageFilter === stageOpt
                          ? "border-brand-accent/30 bg-brand-accent/10 text-brand-accent"
                          : "border-white/5 bg-transparent text-white/50 hover:bg-white/5"
                      )}
                    >
                      {stageOpt}
                    </button>
                  ))}
                </div>
              </div>

              {/* Sorting Filter */}
              <div className="space-y-2">
                <span className="text-[10px] uppercase tracking-wider text-white/40 font-semibold font-mono block">Sort Criteria</span>
                <div className="flex flex-wrap gap-1.5">
                  {[
                    { key: "newest", label: "Newest Releases" },
                    { key: "likes", label: "Most Conviction (Likes)" },
                    { key: "views", label: "Most Viewed" },
                  ].map((sortOpt) => (
                    <button
                      key={sortOpt.key}
                      onClick={() => setSortBy(sortOpt.key as any)}
                      className={cn(
                        "px-3 py-1 rounded-lg border text-xs font-medium transition-all",
                        sortBy === sortOpt.key
                          ? "border-brand-accent/30 bg-brand-accent/10 text-brand-accent"
                          : "border-white/5 bg-transparent text-white/50 hover:bg-white/5"
                      )}
                    >
                      {sortOpt.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Error message */}
      {error && (
        <div className="rounded-2xl bg-red-500/10 border border-red-500/20 p-4">
          <p className="text-red-400 text-xs font-medium">{error}</p>
        </div>
      )}

      {/* Grid rendering */}
      {isLoading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-6 w-6 animate-spin text-white/20" />
        </div>
      ) : (
        <>
          <div className="divide-y divide-white/5">
            {filtered.map((idea) => (
              <IdeaRow key={idea.id} idea={idea} />
            ))}
          </div>

          {filtered.length === 0 && (
            <div className="text-center py-20 rounded-2xl border border-dashed border-white/5 bg-white/[0.005]">
              <div className="text-white/30 text-xs">No ideas found matching your search.</div>
            </div>
          )}
        </>
      )}

      <PostIdeaModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false)
          setEditingIdea(null)
        }}
        onSubmit={handleModalSubmit}
        onDelete={editingIdea ? handleModalDelete : undefined}
        editingIdea={editingIdea}
      />
    </div>
  )
}
