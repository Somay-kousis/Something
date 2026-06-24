"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuItem,
  SidebarRail,
} from "@/components/ui/sidebar"
import Image from "next/image"
import {
  LayoutDashboard,
  Zap,
  TrendingUp,
  MessageCircle,
  Layers,
  Fingerprint,
  SlidersHorizontal,
  ChevronDown,
  PenLine,
} from "lucide-react"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { cn } from "@/lib/utils"

const NAV = [
  { title: "Overview", url: "/founder", icon: LayoutDashboard },
  { title: "Ideas", url: "/founder/ideas", icon: Zap },
  { title: "Community funding", url: "/founder/funding", icon: TrendingUp },
  { title: "Chats", url: "/founder/chats", icon: MessageCircle },
  { title: "Nothing & Something", url: "/founder/mutiny", icon: Layers },
  { title: "Profile", url: "/founder/profile", icon: Fingerprint },
  { title: "Settings", url: "/founder/settings", icon: SlidersHorizontal },
]

export function AppFounderSidebar() {
  const pathname = usePathname()

  return (
    <Sidebar variant="inset" collapsible="icon" className="bg-[#0b0b0c] text-white">
      <SidebarHeader className="border-b border-white/5">
        <SidebarMenu>
          <SidebarMenuItem>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="flex w-full items-center justify-between rounded-lg p-1.5 text-sm font-medium text-white/90 hover:bg-white/5 transition-colors">
                  <div className="flex items-center gap-2.5">
                    <Image
                      src="/TheThing.png"
                      alt="Something Logo"
                      width={32}
                      height={32}
                      className="object-contain invert opacity-90 shrink-0"
                    />
                    <span className="text-[13px] font-semibold tracking-tight group-data-[collapsible=icon]:hidden">Founder of Something</span>
                  </div>
                  <ChevronDown className="h-3.5 w-3.5 opacity-40 group-data-[collapsible=icon]:hidden" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-(--radix-popper-anchor-width) bg-[#0b0b0c] border border-white/5 text-white shadow-xl rounded-xl">
                <DropdownMenuItem asChild className="hover:bg-white/10 cursor-pointer text-xs rounded-lg py-2">
                  <Link href="/investor" className="w-full flex items-center">
                    Switch to Investor
                  </Link>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      <SidebarContent className="pt-2">
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu className="gap-0.5">
              {NAV.map((item) => {
                const active = pathname === item.url || (item.url !== "/founder" && pathname?.startsWith(item.url))
                return (
                  <SidebarMenuItem key={item.title}>
                    <Link
                      href={item.url}
                      className={cn(
                        "group relative flex items-center gap-3 rounded-lg px-3 py-2 text-[13px] font-medium transition-all duration-150",
                        active
                          ? "text-white bg-white/[0.06]"
                          : "text-white/50 hover:text-white/90 hover:bg-white/[0.03]"
                      )}
                    >
                      {/* active left bar */}
                      {active && (
                        <span className="absolute left-0 top-1/2 -translate-y-1/2 h-4 w-[2px] rounded-full bg-brand-accent" />
                      )}
                      <item.icon
                        className={cn(
                          "h-[15px] w-[15px] shrink-0 transition-colors",
                          active ? "text-brand-accent" : "text-white/40 group-hover:text-white/70"
                        )}
                      />
                      <span className="group-data-[collapsible=icon]:hidden">{item.title}</span>
                    </Link>
                  </SidebarMenuItem>
                )
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup className="mt-auto pb-2">
          <SidebarGroupContent>
            <Link
              href="/founder/ideas?new=true"
              className="flex items-center justify-center gap-2 w-full h-8 rounded-lg bg-brand-accent/10 border border-brand-accent/20 text-brand-accent text-xs font-medium hover:bg-brand-accent/15 transition-colors"
            >
              <PenLine className="h-3.5 w-3.5 shrink-0" />
              <span className="group-data-[collapsible=icon]:hidden">Post new idea</span>
            </Link>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="border-t border-white/5">
        <div className="rounded-md bg-white/[0.02] px-2 py-2 text-[10px] leading-tight text-white/30">
          Ctrl/Cmd + B to toggle sidebar
        </div>
      </SidebarFooter>

      <SidebarRail />
    </Sidebar>
  )
}
