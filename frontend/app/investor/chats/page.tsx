"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import axios from "axios";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Search, Send, ChevronLeft, Clock, CheckCheck } from "lucide-react";
import { cn } from "@/lib/utils";

// --- Data Structures for Backend ---

type User = {
  id: string;
  name: string;
  avatarInitials: string;
  isOnline: boolean;
};

type Thread = {
  id: string;
  name: string;
  lastMessagePreview: string;
  unreadCount: number;
  participants: User[];
  lastActive: string;
  isOnline?: boolean;
};

type Message = {
  id: string;
  text: string;
  createdAt: string;
  sender: Pick<User, "id" | "name">;
  deliveryStatus: "sending" | "sent" | "delivered" | "seen";
};

const CURRENT_USER_ID = "user_self_01";

// --- Helpers ---
function formatTime(isoString: string): string {
  const date = new Date(isoString);
  const now = new Date();
  const diffSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (diffSeconds < 60) return "now";
  if (diffSeconds < 3600) return `${Math.floor(diffSeconds / 60)}m`;
  if (diffSeconds < 86400) return `${Math.floor(diffSeconds / 3600)}h`;
  return `${Math.floor(diffSeconds / 86400)}d`;
}

// --- Main Component ---
export default function InvestorChatsPage() {
  const [threads, setThreads] = useState<Thread[]>([]);
  const [messagesByThread, setMessagesByThread] = useState<Record<string, Message[]>>({});
  const [activeId, setActiveId] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [text, setText] = useState("");
  const [isLoadingThreads, setIsLoadingThreads] = useState(true);
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const listRef = useRef<HTMLDivElement | null>(null);
  const inputRef = useRef<HTMLTextAreaElement | null>(null);

  // --- Fetch Threads ---
  useEffect(() => {
    const fetchThreads = async () => {
      setIsLoadingThreads(true);
      setError(null);
      try {
        const response = await axios.get<Thread[]>("/api/chats"); // <-- backend endpoint
        setThreads(response.data);

        if (response.data.length > 0 && !activeId) {
          setActiveId(response.data[0].id);
        }
      } catch (err) {
        console.error("Failed to fetch threads:", err);
        setError("Could not load conversations.");
      } finally {
        setIsLoadingThreads(false);
      }
    };
    fetchThreads();
  }, [activeId]);

  // --- Fetch Messages ---
  useEffect(() => {
    if (!activeId || messagesByThread[activeId]) return;

    const fetchMessages = async () => {
      setIsLoadingMessages(true);
      try {
        const response = await axios.get<Message[]>(`/api/chats/${activeId}/messages`);
        setMessagesByThread(prev => ({ ...prev, [activeId]: response.data }));
      } catch (err) {
        console.error(`Failed to fetch messages for thread ${activeId}:`, err);
      } finally {
        setIsLoadingMessages(false);
      }
    };

    fetchMessages();
  }, [activeId, messagesByThread]);

  // --- Send Message ---
  const onSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeThread || text.trim().length === 0) return;

    const optimisticMessage: Message = {
      id: `temp_${Date.now()}`,
      text: text.trim(),
      createdAt: new Date().toISOString(),
      sender: { id: CURRENT_USER_ID, name: "You" },
      deliveryStatus: "sending",
    };

    setMessagesByThread(prev => ({
      ...prev,
      [activeThread.id]: [...(prev[activeThread.id] ?? []), optimisticMessage],
    }));
    setText("");

    try {
      const response = await axios.post<Message>(`/api/chats/${activeThread.id}/messages`, { text: optimisticMessage.text });
      const savedMessage = response.data;

      setMessagesByThread(prev => ({
        ...prev,
        [activeThread.id]: prev[activeThread.id].map(m => (m.id === optimisticMessage.id ? savedMessage : m)),
      }));
    } catch (err) {
      console.error("Failed to send message:", err);
      setMessagesByThread(prev => ({
        ...prev,
        [activeThread.id]: prev[activeThread.id].filter(m => m.id !== optimisticMessage.id),
      }));
    }
  };

  const filteredThreads = useMemo(() => {
    if (!query.trim()) return threads;
    const q = query.toLowerCase();
    return threads.filter(t => t.name.toLowerCase().includes(q) || t.lastMessagePreview.toLowerCase().includes(q));
  }, [query, threads]);

  const activeThread = filteredThreads.find(t => t.id === activeId);
  const activeMessages = activeThread ? messagesByThread[activeThread.id] ?? [] : [];

  useEffect(() => {
    if (listRef.current) {
      listRef.current.scrollTo({ top: listRef.current.scrollHeight, behavior: "smooth" });
    }
  }, [activeId, activeMessages.length]);

  const showOnlyListOnMobile = !activeThread;
  const showOnlyChatOnMobile = !!activeThread;

  return (
    <div className="mx-auto w-full max-w-[1200px]">
      <div className="grid lg:grid-cols-[320px_minmax(0,1fr)] gap-4 lg:gap-6">
        {/* Threads list */}
        <section className={cn("lg:block", showOnlyChatOnMobile ? "hidden" : "block")}>
          <div className="rounded-xl bg-background p-3 sm:p-4">
            <div className="flex items-center gap-2 mb-4">
              <div className="relative flex-1">
                <Search className="pointer-events-none absolute left-2 top-1/2 h-4 w-4 -translate-y-1/2 text-foreground/40" />
                <Input
                  placeholder="Search conversations..."
                  value={query}
                  onChange={e => setQuery(e.target.value)}
                  className="h-9 w-full pl-8 bg-accent/30 border-transparent text-white placeholder:text-foreground/40 focus:ring-1 focus:ring-white/20"
                />
              </div>
            </div>

            <div className="space-y-0.5">
              {isLoadingThreads ? (
                [...Array(3)].map((_, i) => <Skeleton key={i} className="h-[90px] w-full rounded-lg bg-accent/30" />)
              ) : error ? (
                <div className="p-4 text-center text-sm text-red-400">{error}</div>
              ) : filteredThreads.length === 0 ? (
                <div className="p-4 text-center">
                  <div className="text-sm text-muted-foreground">No conversations found</div>
                </div>
              ) : (
                filteredThreads.map(t => (
                  <button
                    key={t.id}
                    onClick={() => setActiveId(t.id)}
                    className={cn(
                      "w-full rounded-lg px-3 py-3 text-left transition-all duration-200 group",
                      t.id === activeId ? "bg-accent/50 shadow-sm" : "hover:bg-accent active:bg-accent/40",
                    )}
                  >
                    <div className="flex items-center gap-3">
                      <div className="relative">
                        <div className="grid size-10 place-items-center rounded-full text-xs font-medium bg-accent/30">
                          {t.name.split(" ").map(n => n[0]).join("").substring(0, 2)}
                        </div>
                        {t.isOnline && <div className="absolute -bottom-0.5 -right-0.5 size-3 rounded-full bg-green-400 border-2 border-[#101113]" />}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between mb-1">
                          <span className="truncate text-sm font-medium text-white/90">{t.name}</span>
                          <div className="flex items-center gap-1.5 ml-2">
                            {t.unreadCount > 0 && (
                              <span className="flex items-center justify-center min-w-[18px] h-[18px] px-1 text-[10px] font-medium bg-white/90 text-[#101113] rounded-full">{t.unreadCount}</span>
                            )}
                            <span className="text-[10px] text-foreground/50 whitespace-nowrap">{formatTime(t.lastActive)}</span>
                          </div>
                        </div>
                        <p className="truncate text-xs text-muted-foreground">{t.lastMessagePreview}</p>
                      </div>
                    </div>
                  </button>
                ))
              )}
            </div>
          </div>
        </section>

        {/* Chat view */}
        <section className={cn("lg:block", showOnlyListOnMobile ? "hidden" : "block")}>
          <div className="rounded-xl bg-background overflow-hidden flex flex-col h-[600px] lg:h-[700px]">
            {/* Header */}
            <div className="flex h-14 items-center gap-3 px-3 sm:px-4 border-b border-white/[0.06]">
              <button className="lg:hidden" onClick={() => setActiveId(null)}><ChevronLeft className="h-5 w-5" /></button>
              {activeThread ? (
                <div className="truncate text-sm font-medium leading-tight">{activeThread.name}</div>
              ) : (
                <div className="px-2 text-sm text-foreground/70">Select a conversation</div>
              )}
            </div>

            {/* Messages area */}
            <div ref={listRef} className="flex-1 overflow-y-auto px-3 py-4 sm:px-4 space-y-4">
              {isLoadingMessages ? (
                <div className="grid h-full place-items-center">
                  <div className="animate-spin size-5 border-2 border-white/20 border-t-white/60 rounded-full" />
                </div>
              ) : (
                activeMessages.map((m, i) => {
                  const isYou = m.sender.id === CURRENT_USER_ID;
                  const lastMessage = i === activeMessages.length - 1;
                  return (
                    <div key={m.id} className={cn("flex w-full", isYou ? "justify-end" : "justify-start")}>
                      <div className="max-w-[85%] sm:max-w-[78%]">
                        <div className={cn("rounded-2xl px-3 py-2.5 text-sm", isYou ? "bg-white text-[#0b0b0c] rounded-br-md" : "bg-[#1a1b1e] text-white rounded-bl-md")}>
                          <p>{m.text}</p>
                        </div>
                        <div className={cn("flex items-center gap-1 mt-1 text-[10px]", isYou ? "justify-end text-foreground/50" : "text-foreground/50")}>
                          <span>{formatTime(m.createdAt)}</span>
                          {isYou && lastMessage && (
                            m.deliveryStatus === "seen" ? <CheckCheck className="h-3 w-3 text-blue-400" /> :
                            m.deliveryStatus === "delivered" ? <CheckCheck className="h-3 w-3 text-foreground/40" /> :
                            <Clock className="h-3 w-3 text-foreground/30" />
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Input area */}
            <form onSubmit={onSend} className="flex items-end gap-2 p-3 border-t border-white/[0.06]">
              <textarea
                ref={inputRef}
                placeholder={activeThread ? "Type a message..." : "Select a conversation to start"}
                disabled={!activeThread || isLoadingMessages}
                value={text}
                onChange={e => setText(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) onSend(e); }}
                className="w-full min-h-[40px] max-h-[120px] py-2.5 px-3 rounded-2xl bg-accent/30 border-transparent text-white placeholder:text-foreground/40 focus:ring-1 focus:ring-white/20 resize-none"
                rows={1}
              />
              <Button type="submit" size="icon" disabled={!activeThread || text.trim().length === 0} className="size-10 rounded-full flex-shrink-0 bg-white text-background enabled:hover:bg-white/90 disabled:bg-white/20 disabled:text-muted-foreground">
                <Send className="h-4 w-4" />
              </Button>
            </form>
          </div>
        </section>
      </div>
    </div>
  );
}
