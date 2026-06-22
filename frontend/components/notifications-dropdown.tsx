"use client"

import { useState, useEffect } from "react"
import axios from "axios"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Button } from "@/components/ui/button"
import { Bell, Check, Loader2 } from "lucide-react"
import { Badge } from "./ui/badge"
import { cn } from "@/lib/utils"

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || ""

interface Notification {
  id: string
  text: string
  read: boolean
  timestamp: string
}

const DEFAULT_NOTIFICATIONS: Notification[] = [
  {
    id: "n-1",
    text: "Ava Reynolds accepted your introduction request.",
    read: false,
    timestamp: "10m ago",
  },
  {
    id: "n-2",
    text: "Milestone 2 payout of $10,000 for 'Engineering M2' is pending review.",
    read: false,
    timestamp: "1h ago",
  },
  {
    id: "n-3",
    text: "Riley M. commented on your project 'Edge Vision Kit'.",
    read: true,
    timestamp: "1d ago",
  },
  {
    id: "n-4",
    text: "Your project 'Local-first Creator Analytics' matched 91% with Copper Ventures.",
    read: true,
    timestamp: "2d ago",
  },
]

// Stored Database Helpers
function getStoredNotifications(): Notification[] {
  if (typeof window === "undefined") return DEFAULT_NOTIFICATIONS
  const saved = localStorage.getItem("founder_notifications")
  return saved ? JSON.parse(saved) : DEFAULT_NOTIFICATIONS
}

function setStoredNotifications(notifications: Notification[]) {
  if (typeof window !== "undefined") {
    localStorage.setItem("founder_notifications", JSON.stringify(notifications))
  }
}

// API Service Layer
const notificationsAPI = {
  async getNotifications(): Promise<Notification[]> {
    try {
      const response = await axios.get(`${API_BASE_URL}/notifications`, {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      })
      return response.data
    } catch (error) {
      console.warn("Error fetching notifications, using local mock store:", error)
      return getStoredNotifications()
    }
  },

  async markAllAsRead(): Promise<void> {
    try {
      await axios.post(
        `${API_BASE_URL}/notifications/mark-all-read`,
        {},
        {
          headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
        },
      )
    } catch (error) {
      console.warn("Error marking notifications as read on server, updating mock database locally:", error)
      const data = getStoredNotifications()
      const updated = data.map((n) => ({ ...n, read: true }))
      setStoredNotifications(updated)
    }
  },
}

export function NotificationsDropdown() {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isOpen, setIsOpen] = useState(false)

  const fetchNotifications = async () => {
    setIsLoading(true)
    const data = await notificationsAPI.getNotifications()
    setNotifications(data)
    setIsLoading(false)
  }

  useEffect(() => {
    fetchNotifications()
  }, [])

  useEffect(() => {
    if (isOpen) {
      fetchNotifications()
    }
  }, [isOpen])

  const handleMarkAllAsRead = async () => {
    try {
      await notificationsAPI.markAllAsRead()
      const updated = notifications.map((n) => ({ ...n, read: true }))
      setNotifications(updated)
      setStoredNotifications(updated)
    } catch (error) {
      console.error(error)
    }
  }

  const unreadCount = notifications.filter((n) => !n.read).length

  return (
    <DropdownMenu onOpenChange={setIsOpen}>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          size="icon"
          className="relative border-white/10 text-white/80 hover:bg-white/5 hover:text-white rounded-full bg-transparent transition-all"
        >
          <Bell className="h-4 w-4" />
          {unreadCount > 0 && (
            <Badge
              className="absolute -top-1 -right-1 flex h-4 min-w-[16px] px-1 items-center justify-center rounded-full bg-[#34D399] text-black text-[9px] font-bold shadow-[0_0_8px_rgba(52,211,153,0.5)] border-0"
            >
              {unreadCount}
            </Badge>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80 bg-zinc-950/95 border border-white/5 text-white backdrop-blur-xl rounded-2xl shadow-2xl p-2">
        <DropdownMenuLabel className="font-semibold text-[10px] text-white/40 px-3 py-2 uppercase tracking-wider font-mono">
          Inbox Alerts
        </DropdownMenuLabel>
        <DropdownMenuSeparator className="bg-white/5 mx-2" />
        <div className="max-h-72 overflow-y-auto my-1" style={{ scrollbarWidth: "thin" }}>
          {isLoading ? (
            <div className="flex items-center justify-center p-6">
              <Loader2 className="h-5 w-5 animate-spin text-[#34D399]" />
            </div>
          ) : notifications.length > 0 ? (
            notifications.map((notification) => (
              <DropdownMenuItem
                key={notification.id}
                className="flex items-start gap-3 p-3 focus:bg-white/5 rounded-xl cursor-pointer transition-colors focus:text-white"
              >
                <div
                  className={cn(
                    "mt-1.5 h-2 w-2 flex-shrink-0 rounded-full",
                    notification.read ? "bg-transparent" : "bg-[#34D399] shadow-[0_0_6px_#34D399]"
                  )}
                />
                <div className="flex-1 space-y-1">
                  <p className="text-xs text-white/80 leading-normal font-sans font-light">
                    {notification.text}
                  </p>
                  <span className="block text-[9px] font-mono text-white/30">{notification.timestamp}</span>
                </div>
              </DropdownMenuItem>
            ))
          ) : (
            <p className="p-6 text-center text-xs text-white/40 font-mono">No alerts received.</p>
          )}
        </div>
        <DropdownMenuSeparator className="bg-white/5 mx-2" />
        <DropdownMenuItem
          onClick={handleMarkAllAsRead}
          disabled={unreadCount === 0}
          className="flex items-center justify-center gap-2 p-2.5 text-xs text-white/50 hover:text-white focus:bg-white/5 rounded-xl cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed transition-all font-semibold font-mono"
        >
          <Check className="h-3.5 w-3.5" /> Mark all as read
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}