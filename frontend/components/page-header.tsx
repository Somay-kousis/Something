"use client"

import type React from "react"
import { cn } from "@/lib/utils"

export type PageHeaderAccentColor = "emerald" | "amber" | "indigo" | "pink" | "violet" | "blue"

interface PageHeaderProps {
  category: string
  title: string
  description: string
  icon?: React.ComponentType<any>
  accentColor?: PageHeaderAccentColor
  action?: React.ReactNode
  className?: string
}

export function PageHeader({
  category,
  title,
  description,
  icon: Icon,
  accentColor = "emerald",
  action,
  className,
}: PageHeaderProps) {
  
  // Custom Premium Theme color mappings (Chalk Bone, Console Mint, Silicon Copper, Industrial Cobalt)
  const theme = {
    emerald: {
      bulletBg: "bg-[#86EFAC]",
      textAccent: "text-[#86EFAC]",
    },
    amber: {
      bulletBg: "bg-[#E59866]",
      textAccent: "text-[#E59866]",
    },
    indigo: {
      bulletBg: "bg-[#E4E4E7]",
      textAccent: "text-[#E4E4E7]",
    },
    pink: {
      bulletBg: "bg-[#94A3B8]",
      textAccent: "text-[#94A3B8]",
    },
    violet: {
      bulletBg: "bg-[#94A3B8]",
      textAccent: "text-[#94A3B8]",
    },
    blue: {
      bulletBg: "bg-[#94A3B8]",
      textAccent: "text-[#94A3B8]",
    },
  }[accentColor]

  return (
    <div 
      className={cn(
        "relative pb-6 mb-8 border-b border-white/5",
        className
      )}
    >
      {/* Content wrapper */}
      <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-1.5 flex-1">
          {/* Tag Category */}
          <div className="flex items-center gap-2">
            <span className={cn("h-1.5 w-1.5 rounded-full", theme.bulletBg)} />
            <span className={cn("text-[9px] uppercase tracking-widest font-mono font-bold", theme.textAccent)}>
              {category}
            </span>
          </div>

          {/* Title Header */}
          <div className="flex items-center gap-3">
            {Icon && (
              <div className="p-2.5 rounded-xl border border-white/5 bg-white/[0.02] text-white/90 shrink-0 hidden sm:block">
                <Icon className="h-[18px] w-[18px]" />
              </div>
            )}
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white font-outfit" style={{ fontFamily: "var(--font-outfit)" }}>
              {title}
            </h1>
          </div>

          {/* Description */}
          <p className="text-white/45 text-xs sm:text-[13px] leading-relaxed max-w-2xl font-sans pt-0.5">
            {description}
          </p>
        </div>

        {/* Action button container */}
        {action && (
          <div className="flex flex-wrap gap-2 shrink-0 md:ml-auto items-center">
            {action}
          </div>
        )}
      </div>
    </div>
  )
}
