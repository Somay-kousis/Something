"use client"

import React, { useState, useEffect, Suspense } from "react"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { SidebarProvider, SidebarInset, SidebarTrigger } from "@/components/ui/sidebar"
import { AppFounderSidebar } from "@/components/app-founder-sidebar"
import { NotificationsDropdown } from "@/components/notifications-dropdown"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Separator } from "@/components/ui/separator"
import { Search, Plus, LogOut, UserRound, Settings, RefreshCw } from "lucide-react"
import { cn } from "@/lib/utils"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { useAuth } from "@/components/auth-provider"
import { LandingBg } from "@/components/landing-bg"

import RequireAuth from "@/components/require-auth"

export default function FounderLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const router = useRouter()
  const { logout } = useAuth()

  // Sync avatar, name, and accent from local storage
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null)
  const [userName, setUserName] = useState("Alex Rivera")
  const [accentKey, setAccentKey] = useState("emerald")

  const fetchProfileData = () => {
    if (typeof window !== "undefined") {
      const storedProfile = localStorage.getItem("founder_profile_data")
      if (storedProfile) {
        try {
          const parsed = JSON.parse(storedProfile)
          if (parsed.avatarUrl !== undefined) setAvatarUrl(parsed.avatarUrl)
          if (parsed.name !== undefined) setUserName(parsed.name)
        } catch (e) {
          console.error("Error reading profile data", e)
        }
      }

      const storedAccent = localStorage.getItem("founder_settings_accent")
      if (storedAccent) {
        setAccentKey(storedAccent)
      }
    }
  }

  useEffect(() => {
    fetchProfileData()
    // Event listener to sync settings changes in multiple tabs
    const handleStorageChange = () => fetchProfileData()
    window.addEventListener("storage", handleStorageChange)
    return () => window.removeEventListener("storage", handleStorageChange)
  }, [])

  const getInitials = (n: string) => {
    if (!n) return "A"
    return n
      .split(" ")
      .map((w) => w[0])
      .join("")
      .slice(0, 2)
      .toUpperCase()
  }

  const seg = pathname?.split("/").filter(Boolean)[1]
  const section =
    {
      ideas: "Ideas",
      funding: "Community funding",
      chats: "Chats",
      mutiny: "Nothing & Something",
      profile: "Profile",
      settings: "Settings",
    }[seg ?? ""] ?? "Overview"

  // Accent styling mappings
  const accentStyles = {
    emerald: {
      ring: "focus-visible:ring-emerald-500/20 focus-visible:border-emerald-500/40",
      avatarGlow: "shadow-[0_0_12px_rgba(52,211,153,0.12)] border-[#34D399]/40",
    },
    indigo: {
      ring: "focus-visible:ring-indigo-500/20 focus-visible:border-indigo-500/40",
      avatarGlow: "shadow-[0_0_12px_rgba(99,102,241,0.12)] border-[#6366F1]/40",
    },
    violet: {
      ring: "focus-visible:ring-violet-500/20 focus-visible:border-violet-500/40",
      avatarGlow: "shadow-[0_0_12px_rgba(139,92,246,0.12)] border-[#8B5CF6]/40",
    },
    amber: {
      ring: "focus-visible:ring-amber-500/20 focus-visible:border-amber-500/40",
      avatarGlow: "shadow-[0_0_12px_rgba(245,158,11,0.12)] border-[#F59E0B]/40",
    },
  }[accentKey as "emerald" | "indigo" | "violet" | "amber"] || {
    ring: "focus-visible:ring-emerald-500/20 focus-visible:border-emerald-500/40",
    avatarGlow: "shadow-[0_0_12px_rgba(52,211,153,0.12)] border-[#34D399]/40",
  }

  return (
    <SidebarProvider>
      <AppFounderSidebar />
      <SidebarInset className="bg-[#0b0b0c] text-white relative overflow-x-hidden">
        <LandingBg />
        <Suspense fallback={<div className="p-4">Loading...</div>}>
          <header className="flex h-16 shrink-0 items-center gap-4 border-b border-white/5 bg-black/40 px-6 backdrop-blur-md relative z-50">
            <SidebarTrigger className="-ml-1 text-white/80 hover:text-white transition-colors" />
            <Separator orientation="vertical" className="mr-2 h-5 bg-white/5" />
            
            <nav className="flex items-center gap-2 sm:gap-3">
              <Link href="/founder" className="text-sm sm:text-base font-semibold tracking-tight text-white/90 hover:text-white transition-colors" style={{ fontFamily: "var(--font-outfit)" }}>
                Founder
              </Link>
              <span className="text-white/20">/</span>
              <span className="text-white/60 text-xs sm:text-sm font-mono uppercase tracking-wider">{section}</span>
            </nav>

            <div className="ml-auto flex items-center gap-3">
              {/* Search Bar Node with keyboard shortcut badge */}
              <div className="relative hidden md:block group">
                <Search className="pointer-events-none absolute left-3 top-1/2 z-10 h-3.5 w-3.5 -translate-y-1/2 text-white/30 group-hover:text-white/50 transition-colors" />
                <Input
                  placeholder="Search ideas, investors, team…"
                  className={cn(
                    "h-8 w-[280px] pl-9 pr-10 bg-black/40 border-white/5 text-xs text-white placeholder:text-white/30 rounded-lg focus-visible:ring-offset-0 focus-visible:ring-1 transition-all",
                    accentStyles.ring
                  )}
                />
                <kbd className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 z-10 inline-flex h-4.5 select-none items-center gap-0.5 rounded border border-white/10 bg-white/5 px-1.5 font-mono text-[9px] font-medium text-white/40">
                  <span className="text-[10px]">⌘</span>K
                </kbd>
              </div>

              {/* Plus Idea trigger button */}
              <Button
                size="sm"
                onClick={() => router.push("/founder/ideas?new=true")}
                className="h-8 rounded-lg bg-white text-[#0b0b0c] hover:bg-white/90 text-xs font-semibold tracking-wide transition-all active:scale-[0.98] cursor-pointer shrink-0"
              >
                <Plus className="mr-1.5 h-3.5 w-3.5 shrink-0" />
                New idea
              </Button>

              {/* Notifications bell */}
              <NotificationsDropdown />

              {/* dynamic avatar dropdown menu */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className={cn(
                    "flex items-center rounded-full border p-0.5 transition cursor-pointer select-none relative focus:outline-none",
                    accentStyles.avatarGlow
                  )}>
                    <Avatar className="h-7 w-7 border border-white/5">
                      {avatarUrl ? (
                        avatarUrl.startsWith("linear-gradient") ? (
                          <AvatarImage src="" alt="" className="hidden" />
                        ) : (
                          <AvatarImage src={avatarUrl} alt={userName} className="object-cover" />
                        )
                      ) : null}
                      <AvatarFallback
                        className="text-white text-[9px] font-bold font-mono uppercase"
                        style={{ background: avatarUrl && avatarUrl.startsWith("linear-gradient") ? avatarUrl : "rgba(255,255,255,0.05)" }}
                      >
                        {getInitials(userName)}
                      </AvatarFallback>
                    </Avatar>
                  </button>
                </DropdownMenuTrigger>
                
                <DropdownMenuContent className="w-56 bg-[#0b0c0e]/95 border border-white/10 text-white shadow-2xl rounded-xl backdrop-blur-xl p-1.5" align="end">
                  <DropdownMenuLabel className="px-2.5 py-2">
                    <div className="flex flex-col space-y-0.5">
                      <span className="text-xs font-bold text-white font-outfit">{userName}</span>
                      <span className="text-[10px] text-white/35 font-mono leading-none">alex@edgevisionlabs.com</span>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator className="bg-white/5" />
                  
                  <DropdownMenuItem onClick={() => router.push("/founder/profile")} className="hover:bg-white/5 text-xs rounded-lg py-2 cursor-pointer flex items-center gap-2 font-mono uppercase tracking-wider text-[9px] font-semibold text-white/70 hover:text-white transition">
                    <UserRound className="h-3.5 w-3.5 opacity-60" /> Profile Workspace
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => router.push("/founder/settings")} className="hover:bg-white/5 text-xs rounded-lg py-2 cursor-pointer flex items-center gap-2 font-mono uppercase tracking-wider text-[9px] font-semibold text-white/70 hover:text-white transition">
                    <Settings className="h-3.5 w-3.5 opacity-60" /> Settings Panel
                  </DropdownMenuItem>
                  
                  <DropdownMenuSeparator className="bg-white/5" />
                  
                  <DropdownMenuItem onClick={() => router.push("/investor")} className="hover:bg-white/5 text-xs rounded-lg py-2 cursor-pointer flex items-center gap-2 font-mono uppercase tracking-wider text-[9px] font-semibold text-indigo-400 hover:text-indigo-300 transition">
                    <RefreshCw className="h-3.5 w-3.5 opacity-60" /> Switch to Investor
                  </DropdownMenuItem>
                  
                  <DropdownMenuSeparator className="bg-white/5" />
                  
                  <DropdownMenuItem onClick={() => logout()} className="hover:bg-red-500/10 text-red-400 hover:text-red-300 text-xs rounded-lg py-2 cursor-pointer flex items-center gap-2 font-mono uppercase tracking-wider text-[9px] font-semibold transition">
                    <LogOut className="h-3.5 w-3.5 opacity-60" /> Log Out Key
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>

            </div>
          </header>
        </Suspense>

        <div className="flex-1 p-4 sm:p-6">
          <RequireAuth>
            {children}
          </RequireAuth>
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}
