"use client"

import React, { useState, useCallback, useMemo, useRef, useEffect } from "react"
import { useRouter } from "next/navigation"
import { motion, AnimatePresence } from "motion/react"
import { useUserProfile } from "@/lib/user-profile"
import { useFinanceData } from "@/lib/finance-data"
import { supabase, isSupabaseConfigured } from "@/lib/supabase"
import {
  BarChart3, TrendingUp, Shield, ArrowLeftRight, Globe, ArrowUpRight, ArrowDownRight,
  ChevronRight, Bell, Search, Settings, Wallet, CircleDot, Eye, FileText, UserCog,
  X, Check, AlertTriangle, Info, DollarSign, Clock, Star, Plus, Download, Filter,
  Calendar, Mail, Lock, Palette, Monitor, BellRing, CreditCard, Languages, HelpCircle,
  LogOut, ChevronDown, Activity, Zap, Landmark,
} from "lucide-react"
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell, LineChart, Line,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, RadialBarChart, RadialBar,
} from "recharts"

// ─── Design tokens ─────────────────────────────────────────────

const CARD_SHADOW =
  "rgba(14, 63, 126, 0.04) 0px 0px 0px 1px, rgba(42, 51, 69, 0.04) 0px 1px 1px -0.5px, rgba(42, 51, 70, 0.04) 0px 3px 3px -1.5px, rgba(42, 51, 70, 0.04) 0px 6px 6px -3px, rgba(14, 63, 126, 0.04) 0px 12px 12px -6px, rgba(14, 63, 126, 0.04) 0px 24px 24px -12px"

const SECTION_MIN_H = "min-h-[calc(100vh-10.5rem)]"

// Colors as constants for recharts
const C = {
  teal: "#5b4dc7",
  tealMuted: "rgb(91 77 199 / 0.3)",
  azure: "oklch(0.68 0.14 245)",
  amber: "oklch(0.76 0.14 75)",
  rose: "oklch(0.62 0.22 18)",
  slate: "oklch(0.50 0.02 260)",
  gain: "oklch(0.76 0.16 162)",
  loss: "oklch(0.62 0.22 18)",
  grid: "oklch(0.24 0.01 260)",
  tick: "oklch(0.50 0.015 260)",
  surface: "oklch(0.175 0.01 260)",
}

const SPRING = { type: "spring" as const, stiffness: 400, damping: 32 }
const EASE_OUT = [0.16, 1, 0.3, 1] as const

// ─── Data ──────────────────────────────────────────────────────

const NAV_ITEMS = [
  { id: "dashboard", label: "Dashboard", icon: BarChart3 },
  { id: "transactions", label: "Transactions", icon: ArrowLeftRight },
  { id: "accounts", label: "Accounts", icon: Wallet },
  { id: "categories", label: "Categories", icon: CircleDot },
  { id: "settings", label: "Settings", icon: UserCog },
] as const

type SectionId = (typeof NAV_ITEMS)[number]["id"]

const portfolioData = [
  { month: "Jul", value: 42000 }, { month: "Aug", value: 44500 }, { month: "Sep", value: 43200 },
  { month: "Oct", value: 47800 }, { month: "Nov", value: 46100 }, { month: "Dec", value: 49300 },
  { month: "Jan", value: 51200 }, { month: "Feb", value: 53800 }, { month: "Mar", value: 52100 },
  { month: "Apr", value: 56400 }, { month: "May", value: 58900 }, { month: "Jun", value: 62450 },
]

const allocationData = [
  { name: "Equities", value: 45, color: C.teal },
  { name: "Fixed Income", value: 25, color: C.azure },
  { name: "Alternatives", value: 15, color: C.amber },
  { name: "Cash", value: 10, color: C.slate },
  { name: "Crypto", value: 5, color: C.rose },
]

const performanceMonthly = [
  { month: "Jan", return: 3.2, benchmark: 2.8 }, { month: "Feb", return: -1.1, benchmark: -0.5 },
  { month: "Mar", return: 4.5, benchmark: 3.1 }, { month: "Apr", return: 2.8, benchmark: 2.2 },
  { month: "May", return: -0.3, benchmark: -1.0 }, { month: "Jun", return: 5.1, benchmark: 4.2 },
  { month: "Jul", return: 1.9, benchmark: 1.5 }, { month: "Aug", return: 3.6, benchmark: 2.9 },
  { month: "Sep", return: -2.1, benchmark: -2.8 }, { month: "Oct", return: 4.8, benchmark: 3.5 },
  { month: "Nov", return: 2.4, benchmark: 1.8 }, { month: "Dec", return: 3.9, benchmark: 3.3 },
]

const riskMetrics = [
  { metric: "Sharpe Ratio", value: 1.84, status: "good" as const, icon: Zap },
  { metric: "Max Drawdown", value: -8.2, status: "moderate" as const, icon: ArrowDownRight },
  { metric: "Beta", value: 0.92, status: "good" as const, icon: Activity },
  { metric: "VaR (95%)", value: -2.4, status: "moderate" as const, icon: Shield },
]

const volatilityData = [
  { month: "Jan", portfolio: 12.4, market: 15.2 }, { month: "Feb", portfolio: 14.1, market: 16.8 },
  { month: "Mar", portfolio: 11.3, market: 14.5 }, { month: "Apr", portfolio: 10.8, market: 13.9 },
  { month: "May", portfolio: 13.5, market: 17.2 }, { month: "Jun", portfolio: 9.8, market: 12.3 },
  { month: "Jul", portfolio: 11.2, market: 14.8 }, { month: "Aug", portfolio: 10.5, market: 13.1 },
  { month: "Sep", portfolio: 15.2, market: 19.4 }, { month: "Oct", portfolio: 12.8, market: 16.1 },
  { month: "Nov", portfolio: 10.1, market: 12.7 }, { month: "Dec", portfolio: 9.4, market: 11.9 },
]

const sectorExposure = [
  { name: "Technology", value: 85, fill: C.teal },
  { name: "Healthcare", value: 65, fill: C.azure },
  { name: "Finance", value: 52, fill: C.amber },
  { name: "Energy", value: 38, fill: C.rose },
]

const notifications = [
  { id: 1, type: "success" as const, title: "Salary Credited", message: "$5,200.00 salary deposit received from employer", time: "2 min ago", read: false },
  { id: 2, type: "warning" as const, title: "Budget Alert", message: "Groceries spending is at 81% of your monthly limit", time: "18 min ago", read: false },
  { id: 3, type: "info" as const, title: "Recurring Bill Due", message: "Electric bill ($124.18) due in 3 days", time: "1h ago", read: false },
  { id: 4, type: "success" as const, title: "Dividend Received", message: "$342.50 quarterly dividend credited to QNB Checking", time: "3h ago", read: true },
  { id: 5, type: "warning" as const, title: "Expense Alert", message: "Card transaction of $142.60 at Amazon recorded", time: "5h ago", read: true },
  { id: 6, type: "info" as const, title: "Monthly Report", message: "Your monthly spending summary is ready to view", time: "6h ago", read: true },
  { id: 7, type: "success" as const, title: "Transfer Complete", message: "$1,250 freelance payment credited to checking", time: "1d ago", read: true },
]



// ─── Sub-Components ─────────────────────────────────────────────

function GlowOrb({ className }: { className?: string }) {
  return (
    <div className={`absolute rounded-full blur-3xl pointer-events-none ${className}`} />
  )
}

function KpiCard({
  label, value, change, prefix = "", suffix = "", delay = 0, icon: Icon, glowColor = "teal", accounts,
}: {
  label: string; value: string; change?: number; prefix?: string; suffix?: string; delay?: number; icon?: React.ElementType; glowColor?: "teal" | "blue" | "green" | "red"; accounts?: string[]
}) {
  const isPositive = (change ?? 0) >= 0
  const glowMap = {
    teal: "glow-teal-sm",
    blue: "glow-blue-sm",
    green: "glow-green-sm",
    red: "glow-red-sm",
  }
  return (
    <motion.div
      initial={{ opacity: 0, y: 16, scale: 0.97 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.5, delay, ease: EASE_OUT }}
      className={`relative overflow-hidden rounded-2xl surface-card p-4 lg:p-5 group hover:scale-[1.01] transition-transform duration-300 ${glowMap[glowColor]}`}
      style={{ boxShadow: CARD_SHADOW }}
    >
      <div className="absolute top-0 right-0 w-24 h-24 opacity-[0.03] pointer-events-none">
        {Icon && <Icon className="size-24 -translate-y-4 translate-x-4" />}
      </div>
      <div className="flex items-center justify-between mb-2.5">
        <p className="text-[11px] font-semibold tracking-[0.08em] uppercase text-muted-foreground font-sans">
          {label}
        </p>

      </div>
      <p className="text-2xl lg:text-3xl font-bold text-foreground font-mono tracking-tighter leading-none">
        {prefix}{value}{suffix}
      </p>
      {change !== undefined && (
        <div className="flex items-center gap-1.5 mt-3">
          <div className={`flex items-center gap-0.5 text-xs font-semibold font-mono px-1.5 py-0.5 rounded-md ${
            isPositive ? "bg-fin-gain/10 text-fin-gain" : "bg-fin-loss/10 text-fin-loss"
          }`}>
            {isPositive ? <ArrowUpRight className="size-3" /> : <ArrowDownRight className="size-3" />}
            {isPositive ? "+" : ""}{change}%
          </div>
          <span className="text-[10px] text-muted-foreground/70 font-sans">vs last month</span>
        </div>
      )}
    </motion.div>
  )
}

function AccountSelector({ accounts }: { accounts: string[] }) {
  const [isOpen, setIsOpen] = useState(false)
  const [selectedAccount, setSelectedAccount] = useState(accounts[0] || "")
  
  return (
  <div className="flex justify-center">
  <div className="relative">
  <button
  onClick={() => setIsOpen(!isOpen)}
  aria-expanded={isOpen}
  className="text-xs font-semibold text-primary hover:text-primary/80 transition-colors flex items-center gap-1.5 px-3 py-2 rounded-lg border border-primary/20 bg-primary/5 hover:bg-primary/10 font-sans"
  >
  {selectedAccount}
  <ChevronDown className={`size-3.5 transition-transform duration-300 ${isOpen ? "rotate-180" : ""}`} />
  </button>
  <AnimatePresence>
  {isOpen && (
  <motion.div
  initial={{ opacity: 0, y: -8, height: 0 }}
  animate={{ opacity: 1, y: 0, height: "auto" }}
  exit={{ opacity: 0, y: -8, height: 0 }}
  transition={{ duration: 0.2 }}
  className="absolute top-full left-1/2 -translate-x-1/2 mt-1 bg-accent rounded-lg border border-border/30 overflow-hidden z-50 min-w-32"
  >
  {accounts.map((account, i) => (
  <motion.button
  key={account}
  initial={{ opacity: 0, x: -10 }}
  animate={{ opacity: 1, x: 0 }}
  transition={{ delay: i * 0.05 }}
  onClick={() => {
  setSelectedAccount(account)
  setIsOpen(false)
  }}
  className={`w-full text-left px-4 py-2.5 text-xs font-medium transition-colors ${
  selectedAccount === account ? "text-primary bg-primary/10" : "text-foreground hover:text-primary hover:bg-accent/50"
  } font-sans`}
  >
  {account}
  </motion.button>
  ))}
  </motion.div>
        )}
      </AnimatePresence>
    </div>
    </div>
  )
}

function MiniSparkline({ data, color, height = 32 }: { data: number[]; color: string; height?: number }) {
  const max = Math.max(...data)
  const min = Math.min(...data)
  const range = max - min || 1
  const points = data.map((v, i) => `${(i / (data.length - 1)) * 100},${100 - ((v - min) / range) * 80 - 10}`).join(" ")
  const fillPoints = `0,100 ${points} 100,100`
  return (
    <svg viewBox="0 0 100 100" className="w-full" style={{ height }} preserveAspectRatio="none">
      <defs>
        <linearGradient id={`spark-fill-${color.replace(/[^a-z0-9]/g, '')}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity={0.2} />
          <stop offset="100%" stopColor={color} stopOpacity={0} />
        </linearGradient>
      </defs>
      <polygon points={fillPoints} fill={`url(#spark-fill-${color.replace(/[^a-z0-9]/g, '')})`} />
      <polyline points={points} fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" vectorEffect="non-scaling-stroke" />
    </svg>
  )
}

function ChartTooltipContent({ active, payload, label }: { active?: boolean; payload?: Array<{ value: number; name: string; color: string }>; label?: string }) {
  if (!active || !payload?.length) return null
  return (
    <div className="rounded-xl surface-elevated p-3 text-xs backdrop-blur-md" style={{ boxShadow: CARD_SHADOW }}>
      <p className="text-muted-foreground mb-2 font-semibold text-[11px] uppercase tracking-wider font-sans">{label}</p>
      {payload.map((entry, i) => (
        <div key={i} className="flex items-center gap-2 py-0.5">
          <div className="size-2 rounded-full" style={{ backgroundColor: entry.color }} />
          <span className="text-muted-foreground capitalize font-sans">{entry.name}:</span>
          <span className="font-mono font-bold text-foreground">{typeof entry.value === "number" ? entry.value.toLocaleString() : entry.value}</span>
        </div>
      ))}
    </div>
  )
}

function SectionPanel({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay: 0.15, ease: EASE_OUT }}
      className={`rounded-2xl surface-card p-5 lg:p-6 ${className}`}
      style={{ boxShadow: CARD_SHADOW }}
    >
      {children}
    </motion.div>
  )
}

function SectionHeader({ title, subtitle, children }: { title: string; subtitle: string; children?: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between mb-5">
      <div>
        <h3 className="text-sm font-bold text-foreground tracking-tight font-display">{title}</h3>
        <p className="text-[11px] text-muted-foreground mt-0.5 font-sans">{subtitle}</p>
      </div>
      {children}
    </div>
  )
}

function NotificationIcon({ type }: { type: "success" | "warning" | "info" }) {
  if (type === "success") return <Check className="size-3.5" />
  if (type === "warning") return <AlertTriangle className="size-3.5" />
  return <Info className="size-3.5" />
}

function NotificationPanel({ isOpen, onClose, items, onMarkRead, onMarkAllRead }: {
  isOpen: boolean; onClose: () => void; items: typeof notifications; onMarkRead: (id: number) => void; onMarkAllRead: () => void
}) {
  const panelRef = useRef<HTMLDivElement>(null)
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) onClose()
    }
    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside)
      return () => document.removeEventListener("mousedown", handleClickOutside)
    }
  }, [isOpen, onClose])

  const unreadCount = items.filter((n) => !n.read).length
  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          ref={panelRef}
          initial={{ opacity: 0, y: -12, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -12, scale: 0.95 }}
          transition={{ duration: 0.25, ease: EASE_OUT }}
          className="absolute top-full right-0 mt-3 w-[420px] max-h-[30rem] rounded-2xl surface-elevated overflow-hidden z-50 glow-teal-sm"
          style={{ boxShadow: CARD_SHADOW }}
        >
          <div className="flex items-center justify-between p-5 border-b border-border/50">
            <div className="flex items-center gap-2.5">
              <h3 className="text-sm font-bold text-foreground font-display tracking-tight">Notifications</h3>
              {unreadCount > 0 && (
                <span className="text-[10px] font-bold bg-primary text-primary-foreground px-2 py-0.5 rounded-full">{unreadCount}</span>
              )}
            </div>
            <div className="flex items-center gap-1">
              {unreadCount > 0 && (
                <button onClick={onMarkAllRead} className="text-[11px] font-semibold text-primary hover:text-primary/80 px-2 py-1 transition-colors">Mark all read</button>
              )}
              <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-accent transition-colors" aria-label="Close notifications"><X className="size-4 text-muted-foreground" /></button>
            </div>
          </div>
          <div className="overflow-y-auto max-h-[23rem]">
            {items.map((notif, i) => (
              <motion.button
                key={notif.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.25, delay: i * 0.03 }}
                onClick={() => onMarkRead(notif.id)}
                className={`w-full flex items-start gap-3.5 p-4 text-left border-b border-border/30 hover:bg-accent/30 transition-all duration-200 ${!notif.read ? "bg-primary/[0.04]" : ""}`}
              >
                <div className={`size-8 rounded-xl flex items-center justify-center shrink-0 mt-0.5 ${
                  notif.type === "success" ? "bg-fin-gain/12 text-fin-gain" : notif.type === "warning" ? "bg-chart-3/12 text-chart-3" : "bg-chart-2/12 text-chart-2"
                }`}>
                  <NotificationIcon type={notif.type} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-[13px] font-semibold text-foreground truncate font-sans">{notif.title}</p>
                    {!notif.read && <div className="size-1.5 rounded-full bg-primary shrink-0 animate-pulse-soft" />}
                  </div>
                  <p className="text-[11px] text-muted-foreground mt-0.5 line-clamp-2 leading-relaxed font-sans">{notif.message}</p>
                  <p className="text-[10px] text-muted-foreground/50 mt-1.5 flex items-center gap-1 font-mono"><Clock className="size-2.5" />{notif.time}</p>
                </div>
              </motion.button>
            ))}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

// ─── Section: Accounts ──────────────────────────────────────────

// ─── Section: Accounts ──────────────────────────────────────────

function getAccountIconAndTone(type?: string) {
  const t = type?.toLowerCase() || ""
  if (t.includes("cash")) return { icon: Wallet, tone: "green" as const, label: "Cash wallet" }
  if (t.includes("card") || t.includes("credit")) return { icon: CreditCard, tone: "red" as const, label: "Credit card" }
  if (t.includes("saving")) return { icon: Landmark, tone: "teal" as const, label: "Savings account" }
  return { icon: Landmark, tone: "blue" as const, label: "Checking account" }
}

function NetWorthCard() {
  const { netWorth, accounts } = useFinanceData()
  const { profile } = useUserProfile()
  const currencySymbol = profile.currency === "EUR" ? "€" : profile.currency === "GBP" ? "£" : profile.currency === "EGP" ? "EGP " : profile.currency === "AED" ? "AED " : "$"

  return (
    <motion.div
      initial={{ opacity: 0, y: 16, scale: 0.97 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.5, delay: 0, ease: EASE_OUT }}
      className="relative overflow-hidden rounded-2xl surface-card p-5 lg:p-6 glow-blue-sm hover:scale-[1.01] transition-transform duration-300"
      style={{ boxShadow: CARD_SHADOW }}
    >
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-[11px] font-semibold tracking-[0.08em] uppercase text-muted-foreground font-sans">Net worth</p>
          <p className="text-3xl font-bold text-foreground font-mono tracking-tighter mt-2">
            {currencySymbol}{netWorth.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </p>
          <div className="flex items-center gap-2 mt-2">
            <span className="text-[10px] font-semibold text-fin-gain bg-fin-gain/10 rounded-md px-2 py-1 font-mono">
              {accounts.length > 0 ? `${accounts.length} ${accounts.length === 1 ? "Active account" : "Active accounts"}` : "0 accounts"}
            </span>
            <span className="text-[10px] text-muted-foreground font-sans">
              across all registered assets
            </span>
          </div>
        </div>
        <div className="size-10 rounded-xl bg-accent/60 flex items-center justify-center">
          <Landmark className="size-5 text-primary" />
        </div>
      </div>
    </motion.div>
  )
}

function DashboardAccountsSection({ onNavigate }: { onNavigate?: (section: SectionId) => void }) {
  const { accounts, transactions } = useFinanceData()
  const { profile } = useUserProfile()
  const currencySymbol = profile.currency === "EUR" ? "€" : profile.currency === "GBP" ? "£" : profile.currency === "EGP" ? "EGP " : profile.currency === "AED" ? "AED " : "$"

  const recentTx = transactions.slice(0, 6)

  return (
    <div className={`flex flex-col gap-5 ${SECTION_MIN_H}`}>
      {accounts.length === 0 ? (
        <div className="rounded-2xl surface-card p-8 border border-dashed border-border/60 text-center flex flex-col items-center justify-center gap-2" style={{ boxShadow: CARD_SHADOW }}>
          <div className="size-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary mb-1">
            <Landmark className="size-6" />
          </div>
          <p className="text-sm font-bold text-foreground font-display">No accounts added yet</p>
          <p className="text-xs text-muted-foreground font-sans max-w-sm">Connect or create your bank account, cash wallet, or card to start tracking your finances.</p>
          <button
            onClick={() => onNavigate?.("accounts")}
            className="mt-3 px-4 py-2 rounded-xl bg-primary text-primary-foreground text-xs font-semibold hover:bg-primary/90 transition-colors font-sans cursor-pointer shadow-md"
          >
            + Add Account
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 lg:gap-4">
          {accounts.map((account, i) => {
            const { icon: Icon, tone, label } = getAccountIconAndTone(account.type)
            return (
              <motion.div
                key={account.id}
                initial={{ opacity: 0, y: 16, scale: 0.97 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ duration: 0.5, delay: i * 0.06, ease: EASE_OUT }}
                className={`relative overflow-hidden rounded-2xl surface-card p-4 lg:p-5 glow-${tone}-sm group hover:scale-[1.01] transition-transform duration-300`}
                style={{ boxShadow: CARD_SHADOW }}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="size-10 rounded-xl bg-accent/60 flex items-center justify-center">
                      <Icon className="size-4 text-primary" />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-foreground font-display">{account.name}</p>
                      <p className="text-[11px] text-muted-foreground mt-0.5 font-sans">{label}</p>
                    </div>
                  </div>
                  <button onClick={() => onNavigate?.("accounts")} className="text-xs font-semibold text-primary hover:underline font-sans cursor-pointer">Manage</button>
                </div>
                <div className="mt-6">
                  <p className="text-[11px] font-semibold tracking-[0.08em] uppercase text-muted-foreground font-sans">Available balance</p>
                  <p className="text-2xl font-bold text-foreground font-mono tracking-tighter mt-1">
                    {currencySymbol}{(account.balance || 0).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </p>
                </div>
              </motion.div>
            )
          })}
        </div>
      )}

      <SectionPanel className="!p-0 overflow-hidden">
        <div className="p-5 lg:p-6 border-b border-border/50 flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-foreground tracking-tight font-display">All recent transactions</h3>
            <p className="text-[11px] text-muted-foreground mt-0.5 font-sans">Your latest income and expenses</p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => onNavigate?.("transactions")}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-primary text-primary-foreground text-xs font-semibold hover:bg-primary/90 transition-colors font-sans cursor-pointer shadow-sm"
            >
              <Plus className="size-3.5" />
              <span>Add Transaction</span>
            </button>
            <button onClick={() => onNavigate?.("transactions")} className="text-xs font-semibold text-muted-foreground hover:text-foreground hover:underline font-sans cursor-pointer">View all</button>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border/50">
                <th className="text-left p-4 text-[11px] font-semibold text-muted-foreground uppercase tracking-[0.08em] font-sans">Description</th>
                <th className="text-left p-4 text-[11px] font-semibold text-muted-foreground uppercase tracking-[0.08em] font-sans">Category</th>
                <th className="text-left p-4 text-[11px] font-semibold text-muted-foreground uppercase tracking-[0.08em] font-sans">Date</th>
                <th className="text-right p-4 text-[11px] font-semibold text-muted-foreground uppercase tracking-[0.08em] font-sans">Amount</th>
              </tr>
            </thead>
            <tbody>
              {recentTx.length === 0 ? (
                <tr>
                  <td colSpan={4} className="p-8 text-center text-xs text-muted-foreground font-sans">
                    No transactions recorded yet.
                  </td>
                </tr>
              ) : (
                recentTx.map((transaction, i) => (
                  <motion.tr
                    key={transaction.id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.35, delay: 0.15 + i * 0.04 }}
                    className="border-b border-border/30 hover:bg-accent/20 transition-all duration-200"
                  >
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="size-8 rounded-lg bg-accent/40 flex items-center justify-center shrink-0">
                          <div className={`size-2 rounded-full ${transaction.type === 'income' ? 'bg-fin-gain' : 'bg-fin-loss'}`} />
                        </div>
                        <span className="text-[13px] font-semibold text-foreground font-sans">{transaction.description}</span>
                      </div>
                    </td>
                    <td className="p-4 text-xs text-muted-foreground font-sans">{transaction.category_name || "General"}</td>
                    <td className="p-4 text-xs font-mono text-muted-foreground">{transaction.date}</td>
                    <td className={`p-4 text-right font-mono font-bold ${transaction.type === 'income' ? 'text-fin-gain' : 'text-fin-loss'}`}>
                      {transaction.type === 'income' ? '+' : '-'}{currencySymbol}{Math.abs(transaction.amount).toFixed(2)}
                    </td>
                  </motion.tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </SectionPanel>
    </div>
  )
}

function AccountsSection() {
  const { accounts, transactions, createAccount, deleteAccount } = useFinanceData()
  const { profile } = useUserProfile()
  const [selectedAccountId, setSelectedAccountId] = useState<string>("")
  const [query, setQuery] = useState("")
  const [minAmount, setMinAmount] = useState("")
  const [maxAmount, setMaxAmount] = useState("")
  const [showAddModal, setShowAddModal] = useState(false)
  const [newAccName, setNewAccName] = useState("")
  const [newAccType, setNewAccType] = useState("bank")
  const [newAccBalance, setNewAccBalance] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)

  const activeAccountId = selectedAccountId || accounts[0]?.id || ""
  const selectedAccount = accounts.find((a) => a.id === activeAccountId) || accounts[0]
  const currencySymbol = profile.currency === "EUR" ? "€" : profile.currency === "GBP" ? "£" : profile.currency === "EGP" ? "EGP " : profile.currency === "AED" ? "AED " : "$"

  const filteredTransactions = useMemo(() => {
    if (!selectedAccount) return []
    return transactions.filter((t) => {
      const matchesAcc = t.account_id === selectedAccount.id || t.account_name === selectedAccount.name
      const matchesQuery = t.description.toLowerCase().includes(query.toLowerCase())
      const matchesMin = !minAmount || Math.abs(t.amount) >= Number(minAmount)
      const matchesMax = !maxAmount || Math.abs(t.amount) <= Number(maxAmount)
      return matchesAcc && matchesQuery && matchesMin && matchesMax
    })
  }, [transactions, selectedAccount, query, minAmount, maxAmount])

  const accountTrendData = useMemo(() => {
    if (!selectedAccount) return []
    const bal = selectedAccount.balance || 0
    return [
      { day: "Day 1", balance: bal },
      { day: "Day 5", balance: bal },
      { day: "Day 10", balance: bal },
      { day: "Day 15", balance: bal },
      { day: "Day 20", balance: bal },
      { day: "Day 25", balance: bal },
      { day: "Today", balance: bal },
    ]
  }, [selectedAccount])

  const handleAddAccount = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newAccName.trim()) return
    setIsSubmitting(true)

    const created = await createAccount({
      name: newAccName.trim(),
      type: newAccType,
      starting_balance: parseFloat(newAccBalance) || 0,
      currency: profile.currency || "USD",
    })

    setSelectedAccountId(created.id)
    setNewAccName("")
    setNewAccBalance("")
    setIsSubmitting(false)
    setShowAddModal(false)
  }

  const handleDeleteCurrentAccount = async () => {
    if (!selectedAccount) return
    if (confirm(`Are you sure you want to remove account "${selectedAccount.name}"?`)) {
      await deleteAccount(selectedAccount.id)
      setSelectedAccountId("")
    }
  }

  const { icon: Icon, tone, label: typeLabel } = getAccountIconAndTone(selectedAccount?.type)

  return (
    <div className={`flex flex-col gap-5 ${SECTION_MIN_H}`}>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-bold text-foreground font-display tracking-tight">Accounts</h2>
          <p className="text-xs text-muted-foreground font-sans">Manage your active accounts and balances</p>
        </div>
        <div className="flex items-center gap-2">
          {accounts.length > 0 && (
            <div className="flex items-center gap-1 rounded-xl border border-border/40 bg-card/60 p-1">
              {accounts.map((acc) => (
                <button
                  key={acc.id}
                  onClick={() => setSelectedAccountId(acc.id)}
                  className={`rounded-lg px-3.5 py-1.5 text-xs font-semibold font-sans transition-colors cursor-pointer ${
                    activeAccountId === acc.id ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {acc.name}
                </button>
              ))}
            </div>
          )}
          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-primary text-primary-foreground text-xs font-semibold hover:bg-primary/90 transition-colors font-sans cursor-pointer shadow-sm shrink-0"
          >
            <Plus className="size-3.5" />
            <span>Add Account</span>
          </button>
        </div>
      </div>

      {/* Add Account Modal */}
      <AnimatePresence>
        {showAddModal && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.25 }}
            className="overflow-hidden"
          >
            <form onSubmit={handleAddAccount} className="p-5 rounded-2xl bg-muted/30 border border-primary/30 flex flex-col gap-4 glow-teal-sm">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-bold text-foreground font-display">Add New Account</h4>
                <button type="button" onClick={() => setShowAddModal(false)} className="text-muted-foreground hover:text-foreground transition-colors p-1 cursor-pointer">
                  <X className="size-4" />
                </button>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide block mb-1 font-sans">Account Name</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Chase, QNB, Cash"
                    value={newAccName}
                    onChange={(e) => setNewAccName(e.target.value)}
                    className="w-full px-3 py-2 bg-background border border-border/60 rounded-xl text-xs text-foreground focus:outline-none focus:border-primary font-sans"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide block mb-1 font-sans">Account Type</label>
                  <select
                    value={newAccType}
                    onChange={(e) => setNewAccType(e.target.value)}
                    className="w-full px-3 py-2 bg-background border border-border/60 rounded-xl text-xs text-foreground focus:outline-none focus:border-primary font-sans appearance-none cursor-pointer"
                  >
                    <option value="bank">Bank / Checking</option>
                    <option value="cash">Cash wallet</option>
                    <option value="card">Credit card</option>
                    <option value="savings">Savings account</option>
                  </select>
                </div>
                <div>
                  <label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide block mb-1 font-sans">Starting Balance</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    placeholder="0.00"
                    value={newAccBalance}
                    onChange={(e) => setNewAccBalance(e.target.value)}
                    className="w-full px-3 py-2 bg-background border border-border/60 rounded-xl text-xs text-foreground focus:outline-none focus:border-primary font-mono"
                  />
                </div>
              </div>
              <div className="flex items-center justify-end gap-2 pt-1">
                <button type="button" onClick={() => setShowAddModal(false)} className="px-4 py-2 rounded-xl text-xs font-semibold text-muted-foreground hover:bg-accent/40 transition-colors font-sans cursor-pointer">Cancel</button>
                <button type="submit" disabled={isSubmitting} className="px-4 py-2 rounded-xl text-xs font-semibold bg-primary text-primary-foreground hover:bg-primary/90 transition-colors font-sans shadow-md cursor-pointer">
                  {isSubmitting ? "Creating..." : "Save Account"}
                </button>
              </div>
            </form>
          </motion.div>
        )}
      </AnimatePresence>

      {!selectedAccount ? (
        <div className="rounded-2xl surface-card p-10 text-center flex flex-col items-center justify-center gap-3" style={{ boxShadow: CARD_SHADOW }}>
          <Landmark className="size-10 text-muted-foreground/60" />
          <p className="text-base font-bold text-foreground font-display">No accounts configured</p>
          <p className="text-xs text-muted-foreground font-sans max-w-sm">Create an account to start logging and tracking transactions.</p>
          <button onClick={() => setShowAddModal(true)} className="px-4 py-2 rounded-xl bg-primary text-primary-foreground text-xs font-semibold font-sans cursor-pointer shadow-md">
            + Add First Account
          </button>
        </div>
      ) : (
        <>
          <motion.div
            initial={{ opacity: 0, y: 16, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.5, ease: EASE_OUT }}
            className={`relative overflow-hidden rounded-2xl surface-card p-5 lg:p-6 glow-${tone}-sm group hover:scale-[1.01] transition-transform duration-300`}
            style={{ boxShadow: CARD_SHADOW }}
          >
            <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
              <div className="flex items-start gap-3">
                <div className="size-10 rounded-xl bg-accent/60 flex items-center justify-center">
                  <Icon className="size-4 text-primary" />
                </div>
                <div>
                  <p className="text-lg font-bold text-foreground font-display">{selectedAccount.name}</p>
                  <p className="text-xs text-muted-foreground font-sans">{typeLabel} · {selectedAccount.currency || profile.currency || "USD"}</p>
                  <p className="mt-4 text-[11px] font-semibold uppercase tracking-[0.08em] text-muted-foreground font-sans">Available balance</p>
                  <p className="mt-1 text-3xl font-bold tracking-tighter text-foreground font-mono">
                    {currencySymbol}{(selectedAccount.balance || 0).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </p>
                </div>
              </div>
              <div className="h-32 w-full max-w-md">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={accountTrendData}>
                    <Line type="monotone" dataKey="balance" stroke={C.teal} strokeWidth={2.5} dot={false} animationDuration={700} />
                    <XAxis dataKey="day" hide />
                    <YAxis hide domain={["dataMin - 100", "dataMax + 100"]} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
              <div className="flex flex-row gap-3 lg:flex-col lg:items-end">
                <button onClick={handleDeleteCurrentAccount} className="text-xs font-semibold text-fin-loss/80 hover:text-fin-loss font-sans cursor-pointer">
                  Delete Account
                </button>
              </div>
            </div>
          </motion.div>

          <SectionPanel className="!p-0 overflow-hidden">
            <div className="border-b border-border/50 p-5 lg:p-6">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h3 className="text-sm font-bold text-foreground font-display">Recent transactions</h3>
                  <p className="mt-0.5 text-[11px] text-muted-foreground font-sans">Activity for {selectedAccount.name}</p>
                </div>
              </div>
              <div className="mt-4 flex flex-wrap gap-2">
                <div className="flex min-w-48 flex-1 items-center gap-2 rounded-lg border border-border/40 bg-muted/20 px-3 py-2">
                  <Search className="size-3.5 text-muted-foreground" />
                  <input
                    value={query}
                    onChange={(event) => setQuery(event.target.value)}
                    placeholder="Search description"
                    className="w-full bg-transparent text-xs text-foreground outline-none placeholder:text-muted-foreground font-sans"
                  />
                </div>
                <input
                  value={minAmount}
                  onChange={(event) => setMinAmount(event.target.value)}
                  type="number"
                  min="0"
                  placeholder="Min amount"
                  className="w-28 rounded-lg border border-border/40 bg-muted/20 px-3 py-2 text-xs text-foreground outline-none placeholder:text-muted-foreground font-mono"
                />
                <input
                  value={maxAmount}
                  onChange={(event) => setMaxAmount(event.target.value)}
                  type="number"
                  min="0"
                  placeholder="Max amount"
                  className="w-28 rounded-lg border border-border/40 bg-muted/20 px-3 py-2 text-xs text-foreground outline-none placeholder:text-muted-foreground font-mono"
                />
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border/50">
                    <th className="p-4 text-left text-[11px] font-semibold uppercase tracking-[0.08em] text-muted-foreground font-sans">Description</th>
                    <th className="p-4 text-left text-[11px] font-semibold uppercase tracking-[0.08em] text-muted-foreground font-sans">Category</th>
                    <th className="p-4 text-left text-[11px] font-semibold uppercase tracking-[0.08em] text-muted-foreground font-sans">Date</th>
                    <th className="p-4 text-right text-[11px] font-semibold uppercase tracking-[0.08em] text-muted-foreground font-sans">Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredTransactions.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="p-8 text-center text-xs text-muted-foreground font-sans">
                        No transactions recorded for {selectedAccount.name}.
                      </td>
                    </tr>
                  ) : (
                    filteredTransactions.map((transaction, i) => (
                      <motion.tr
                        key={transaction.id}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.35, delay: i * 0.04 }}
                        className="border-b border-border/30 hover:bg-accent/20 transition-all duration-200"
                      >
                        <td className="p-4 text-[13px] font-semibold text-foreground font-sans">{transaction.description}</td>
                        <td className="p-4 text-xs text-muted-foreground font-sans">{transaction.category_name || "General"}</td>
                        <td className="p-4 text-xs text-muted-foreground font-mono">{transaction.date}</td>
                        <td className={`p-4 text-right font-bold font-mono ${transaction.type === "income" ? "text-fin-gain" : "text-fin-loss"}`}>
                          {transaction.type === "income" ? "+" : "-"}{currencySymbol}{Math.abs(transaction.amount).toFixed(2)}
                        </td>
                      </motion.tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </SectionPanel>
        </>
      )}
    </div>
  )
}

// ─── Section: Transactions ──────────────────────────────────────

function TransactionsSection() {
  const { transactions, accounts, categories, createTransaction, totalIncome, totalExpense } = useFinanceData()
  const { profile } = useUserProfile()
  const [searchQuery, setSearchQuery] = useState("")
  const [typeFilter, setTypeFilter] = useState<"all" | "income" | "expense">("all")
  const [categoryFilter, setCategoryFilter] = useState<string>("all")
  const [accountFilter, setAccountFilter] = useState<string>("all")
  const [showAddModal, setShowAddModal] = useState(false)

  const [newAmount, setNewAmount] = useState("")
  const [newType, setNewType] = useState<"expense" | "income" | "transfer">("expense")
  const [newAccountId, setNewAccountId] = useState(accounts[0]?.id || "")
  const [newDestAccountId, setNewDestAccountId] = useState("")
  const [newCategoryId, setNewCategoryId] = useState("")
  const [newCustomCategory, setNewCustomCategory] = useState("")
  const [newDate, setNewDate] = useState(new Date().toISOString().split("T")[0])
  const [newNote, setNewNote] = useState("")
  const [txError, setTxError] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)

  const currencySymbol = profile.currency === "EUR" ? "€" : profile.currency === "GBP" ? "£" : profile.currency === "EGP" ? "EGP " : profile.currency === "AED" ? "AED " : "$"

  const filteredTransactions = useMemo(() => {
    return transactions.filter((tx) => {
      const matchesSearch =
        (tx.description || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
        (tx.category_name || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
        (tx.account_name || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
        (tx.note || "").toLowerCase().includes(searchQuery.toLowerCase())

      const matchesType = typeFilter === "all" || tx.type === typeFilter
      const matchesCategory = categoryFilter === "all" || tx.category_id === categoryFilter || tx.category_name?.toLowerCase() === categoryFilter.toLowerCase()
      const matchesAccount = accountFilter === "all" || tx.account_id === accountFilter || tx.account_name?.toLowerCase() === accountFilter.toLowerCase()

      return matchesSearch && matchesType && matchesCategory && matchesAccount
    })
  }, [transactions, searchQuery, typeFilter, categoryFilter, accountFilter])

  const netSavings = totalIncome - totalExpense

  const handleAddTransaction = async (e: React.FormEvent) => {
    e.preventDefault()
    setTxError("")

    const amountNum = parseFloat(newAmount)
    if (isNaN(amountNum) || amountNum <= 0) {
      setTxError("Please enter a valid amount greater than 0.")
      return
    }

    const accId = newAccountId || accounts[0]?.id
    if (!accId) {
      setTxError("Please create an account first before adding transactions.")
      return
    }

    if (newType === "transfer") {
      const destId = newDestAccountId || accounts.find((a) => a.id !== accId)?.id
      if (!destId || destId === accId) {
        setTxError("Please select two different accounts for the transfer.")
        return
      }
    }

    setIsSubmitting(true)
    try {
      const isCustomCat = newCategoryId === "custom" || (!newCategoryId && newCustomCategory.trim() !== "")
      const catId = !isCustomCat && newCategoryId ? newCategoryId : undefined
      const catName = isCustomCat && newCustomCategory.trim() ? newCustomCategory.trim() : undefined

      await createTransaction({
        account_id: accId,
        destination_account_id: newType === "transfer" ? (newDestAccountId || accounts.find((a) => a.id !== accId)?.id) : undefined,
        category_id: catId,
        category_name: catName,
        amount: amountNum,
        type: newType,
        note: newNote.trim(),
        description: newNote.trim() || (newType === "transfer" ? "Transfer" : newType === "income" ? "Income" : "Expense"),
        date: newDate || new Date().toISOString().split("T")[0],
      })

      // Reset form and close ONLY on success
      setNewAmount("")
      setNewNote("")
      setNewCustomCategory("")
      setTxError("")
      setShowAddModal(false)
    } catch (err: any) {
      setTxError(err?.message || "Failed to create transaction. Please try again.")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className={`flex flex-col gap-5 ${SECTION_MIN_H}`}>
      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-4">
        <KpiCard label="Total Income" value={totalIncome.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} prefix={currencySymbol} delay={0} icon={TrendingUp} />
        <KpiCard label="Total Expenses" value={totalExpense.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} prefix={currencySymbol} delay={0.06} icon={ArrowDownRight} />
        <KpiCard label="Net Balance" value={netSavings.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} prefix={currencySymbol} delay={0.12} icon={Wallet} />
        <KpiCard label="Total Transactions" value={String(transactions.length)} delay={0.18} icon={ArrowLeftRight} />
      </div>

      {/* Main Transactions Panel */}
      <SectionPanel className="!p-0 overflow-hidden">
        {/* Header with Search, Add Transaction, and Filter Controls */}
        <div className="p-5 lg:p-6 border-b border-border/50 flex flex-col gap-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <h3 className="text-base font-bold text-foreground tracking-tight font-display">All Transactions</h3>
              <p className="text-xs text-muted-foreground mt-0.5 font-sans">
                Showing {filteredTransactions.length} of {transactions.length} transactions
              </p>
            </div>
            <div className="flex items-center gap-2">
              <div className="flex items-center rounded-xl bg-muted/40 p-1 border border-border/30">
                {(["all", "expense", "income"] as const).map((t) => (
                  <button
                    key={t}
                    onClick={() => setTypeFilter(t)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold capitalize transition-all font-sans cursor-pointer ${
                      typeFilter === t
                        ? "bg-primary text-primary-foreground shadow-xs"
                        : "text-muted-foreground hover:text-foreground hover:bg-accent/30"
                    }`}
                  >
                    {t === "all" ? "All" : t === "expense" ? "Expenses" : "Income"}
                  </button>
                ))}
              </div>
              <button
                onClick={() => { setTxError(""); setShowAddModal(true) }}
                className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-primary text-primary-foreground text-xs font-semibold hover:bg-primary/90 transition-colors font-sans cursor-pointer shadow-sm shrink-0"
              >
                <Plus className="size-3.5" />
                <span>Add Transaction</span>
              </button>
            </div>
          </div>

          {/* Add Transaction Modal Form */}
          <AnimatePresence>
            {showAddModal && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.25 }}
                className="overflow-hidden"
              >
                <form onSubmit={handleAddTransaction} className="p-5 rounded-2xl bg-muted/30 border border-primary/30 flex flex-col gap-4 glow-teal-sm">
                  <div className="flex items-center justify-between">
                    <h4 className="text-sm font-bold text-foreground font-display">Add New Transaction</h4>
                    <button type="button" onClick={() => setShowAddModal(false)} className="text-muted-foreground hover:text-foreground transition-colors p-1 cursor-pointer">
                      <X className="size-4" />
                    </button>
                  </div>

                  {txError && (
                    <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-xs font-sans flex items-center gap-2">
                      <AlertTriangle className="size-4 shrink-0" />
                      <span>{txError}</span>
                    </div>
                  )}

                  {/* Transaction Type Segmented Control */}
                  <div>
                    <label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide block mb-1.5 font-sans">Transaction Type</label>
                    <div className="grid grid-cols-3 gap-1.5 p-1 bg-background border border-border/60 rounded-xl">
                      {(["expense", "income", "transfer"] as const).map((t) => (
                        <button
                          key={t}
                          type="button"
                          onClick={() => setNewType(t)}
                          className={`py-2 rounded-lg text-xs font-semibold capitalize transition-all font-sans cursor-pointer ${
                            newType === t
                              ? "bg-primary text-primary-foreground shadow-sm"
                              : "text-muted-foreground hover:text-foreground hover:bg-muted/40"
                          }`}
                        >
                          {t === "expense" ? "Expense" : t === "income" ? "Income" : "Transfer"}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                    {/* Amount */}
                    <div>
                      <label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide block mb-1 font-sans">Amount</label>
                      <input
                        type="number"
                        step="0.01"
                        required
                        placeholder="0.00"
                        value={newAmount}
                        onChange={(e) => setNewAmount(e.target.value)}
                        className="w-full px-3 py-2 bg-background border border-border/60 rounded-xl text-xs text-foreground focus:outline-none focus:border-primary font-mono"
                      />
                    </div>

                    {/* Source Account (or single Account) */}
                    <div>
                      <label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide block mb-1 font-sans">
                        {newType === "transfer" ? "From Account" : "Account"}
                      </label>
                      <select
                        value={newAccountId || accounts[0]?.id}
                        onChange={(e) => setNewAccountId(e.target.value)}
                        required
                        className="w-full px-3 py-2 bg-background border border-border/60 rounded-xl text-xs text-foreground focus:outline-none focus:border-primary font-sans appearance-none cursor-pointer"
                      >
                        {accounts.length === 0 ? (
                          <option value="">No accounts available</option>
                        ) : (
                          accounts.map((acc) => (
                            <option key={acc.id} value={acc.id}>{acc.name} ({currencySymbol}{acc.balance.toFixed(2)})</option>
                          ))
                        )}
                      </select>
                    </div>

                    {/* Destination Account (Only for Transfer) */}
                    {newType === "transfer" ? (
                      <div>
                        <label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide block mb-1 font-sans">To Account</label>
                        <select
                          value={newDestAccountId || accounts.find((a) => a.id !== (newAccountId || accounts[0]?.id))?.id || ""}
                          onChange={(e) => setNewDestAccountId(e.target.value)}
                          required
                          className="w-full px-3 py-2 bg-background border border-border/60 rounded-xl text-xs text-foreground focus:outline-none focus:border-primary font-sans appearance-none cursor-pointer"
                        >
                          {accounts
                            .filter((a) => a.id !== (newAccountId || accounts[0]?.id))
                            .map((acc) => (
                              <option key={acc.id} value={acc.id}>{acc.name} ({currencySymbol}{acc.balance.toFixed(2)})</option>
                            ))}
                        </select>
                      </div>
                    ) : (
                      /* Category (For Income/Expense) */
                      <div>
                        <label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide block mb-1 font-sans">Category</label>
                        <select
                          value={newCategoryId}
                          onChange={(e) => setNewCategoryId(e.target.value)}
                          className="w-full px-3 py-2 bg-background border border-border/60 rounded-xl text-xs text-foreground focus:outline-none focus:border-primary font-sans appearance-none cursor-pointer"
                        >
                          <option value="">General</option>
                          {categories.map((cat) => (
                            <option key={cat.id} value={cat.id}>{cat.name}</option>
                          ))}
                          <option value="custom">+ Add / Enter custom category...</option>
                        </select>
                      </div>
                    )}

                    {/* Custom Category Input if selected or no categories exist */}
                    {newType !== "transfer" && (newCategoryId === "custom" || categories.length === 0) && (
                      <div>
                        <label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide block mb-1 font-sans">Category Name</label>
                        <input
                          type="text"
                          placeholder="e.g. Groceries, Rent, Salary"
                          value={newCustomCategory}
                          onChange={(e) => setNewCustomCategory(e.target.value)}
                          className="w-full px-3 py-2 bg-background border border-border/60 rounded-xl text-xs text-foreground focus:outline-none focus:border-primary font-sans"
                        />
                      </div>
                    )}

                    {/* Date */}
                    <div>
                      <label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide block mb-1 font-sans">Date</label>
                      <input
                        type="date"
                        value={newDate}
                        onChange={(e) => setNewDate(e.target.value)}
                        className="w-full px-3 py-2 bg-background border border-border/60 rounded-xl text-xs text-foreground focus:outline-none focus:border-primary font-sans"
                      />
                    </div>

                    {/* Note / Description */}
                    <div className={newType === "transfer" ? "sm:col-span-2" : ""}>
                      <label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide block mb-1 font-sans">Note (Optional)</label>
                      <input
                        type="text"
                        placeholder="e.g. Coffee with friends, Monthly rent"
                        value={newNote}
                        onChange={(e) => setNewNote(e.target.value)}
                        className="w-full px-3 py-2 bg-background border border-border/60 rounded-xl text-xs text-foreground focus:outline-none focus:border-primary font-sans"
                      />
                    </div>
                  </div>

                  <div className="flex items-center justify-end gap-2 pt-2 border-t border-border/40">
                    <button type="button" onClick={() => setShowAddModal(false)} className="px-4 py-2 rounded-xl text-xs font-semibold text-muted-foreground hover:bg-accent/40 transition-colors font-sans cursor-pointer">Cancel</button>
                    <button type="submit" disabled={isSubmitting} className="px-5 py-2 rounded-xl text-xs font-semibold bg-primary text-primary-foreground hover:bg-primary/90 transition-colors font-sans shadow-md cursor-pointer disabled:opacity-50">
                      {isSubmitting ? "Saving..." : "Save Transaction"}
                    </button>
                  </div>
                </form>
              </motion.div>
            )}
          </AnimatePresence>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="relative sm:col-span-1">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search description, category, account..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-muted/30 border border-border/40 rounded-xl text-xs text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/20 transition-all font-sans"
              />
            </div>

            <div>
              <select
                aria-label="Filter by category"
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="w-full px-3 py-2 bg-muted/30 border border-border/40 rounded-xl text-xs text-foreground focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/20 transition-all font-sans appearance-none cursor-pointer"
              >
                <option value="all" className="bg-card text-foreground">All Categories</option>
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.id} className="bg-card text-foreground">{cat.name}</option>
                ))}
              </select>
            </div>

            <div>
              <select
                aria-label="Filter by account"
                value={accountFilter}
                onChange={(e) => setAccountFilter(e.target.value)}
                className="w-full px-3 py-2 bg-muted/30 border border-border/40 rounded-xl text-xs text-foreground focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/20 transition-all font-sans appearance-none cursor-pointer"
              >
                <option value="all" className="bg-card text-foreground">All Accounts</option>
                {accounts.map((acc) => (
                  <option key={acc.id} value={acc.id} className="bg-card text-foreground">{acc.name}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Transactions Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border/50">
                <th className="text-left p-4 text-[11px] font-semibold text-muted-foreground uppercase tracking-[0.08em] font-sans">Description</th>
                <th className="text-left p-4 text-[11px] font-semibold text-muted-foreground uppercase tracking-[0.08em] font-sans">Category</th>
                <th className="text-left p-4 text-[11px] font-semibold text-muted-foreground uppercase tracking-[0.08em] font-sans hidden sm:table-cell">Account</th>
                <th className="text-left p-4 text-[11px] font-semibold text-muted-foreground uppercase tracking-[0.08em] font-sans">Date</th>
                <th className="text-right p-4 text-[11px] font-semibold text-muted-foreground uppercase tracking-[0.08em] font-sans">Amount</th>
              </tr>
            </thead>
            <tbody>
              {filteredTransactions.length === 0 ? (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-xs text-muted-foreground font-sans">
                    {transactions.length === 0 ? "No transactions recorded yet. Click '+ Add Transaction' to get started." : "No transactions match your search filters."}
                  </td>
                </tr>
              ) : (
                filteredTransactions.map((tx, i) => (
                  <motion.tr
                    key={tx.id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.3, delay: Math.min(i * 0.03, 0.3) }}
                    className="border-b border-border/30 hover:bg-accent/20 transition-all duration-200"
                  >
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="size-8 rounded-lg bg-accent/40 flex items-center justify-center shrink-0">
                          <div className={`size-2 rounded-full ${tx.type === "income" ? "bg-fin-gain" : "bg-fin-loss"}`} />
                        </div>
                        <div>
                          <span className="text-[13px] font-semibold text-foreground font-sans block">{tx.description}</span>
                          <span className="text-[10px] text-muted-foreground/70 font-mono sm:hidden">{tx.account_name}</span>
                        </div>
                      </div>
                    </td>
                    <td className="p-4 text-xs text-muted-foreground font-sans">{tx.category_name || "General"}</td>
                    <td className="p-4 text-xs font-mono text-muted-foreground hidden sm:table-cell">
                      <span className="px-2 py-0.5 rounded-md bg-accent/40 text-[11px]">{tx.account_name}</span>
                    </td>
                    <td className="p-4 text-xs font-mono text-muted-foreground">
                      <span>{tx.date}</span>
                    </td>
                    <td className={`p-4 text-right font-mono font-bold ${tx.type === "income" ? "text-fin-gain" : "text-fin-loss"}`}>
                      {tx.type === "income" ? "+" : "-"}{currencySymbol}{Math.abs(tx.amount).toFixed(2)}
                    </td>
                  </motion.tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </SectionPanel>
    </div>
  )
}

// ─── Section: Categories ────────────────────────────────────────

function CategoriesSection() {
  const { categories, transactions, createCategory, totalExpense, totalIncome } = useFinanceData()
  const { profile } = useUserProfile()
  const [searchQuery, setSearchQuery] = useState("")
  const [typeFilter, setTypeFilter] = useState<"all" | "expense" | "income">("all")
  const [showAddModal, setShowAddModal] = useState(false)
  const [newCatName, setNewCatName] = useState("")
  const [newCatType, setNewCatType] = useState<"expense" | "income">("expense")
  const [isSubmitting, setIsSubmitting] = useState(false)

  const currencySymbol = profile.currency === "EUR" ? "€" : profile.currency === "GBP" ? "£" : profile.currency === "EGP" ? "EGP " : profile.currency === "AED" ? "AED " : "$"

  const filteredCategories = useMemo(() => {
    return categories.filter((cat) => {
      const matchesSearch = cat.name.toLowerCase().includes(searchQuery.toLowerCase())
      const matchesType = typeFilter === "all" || cat.type === typeFilter
      return matchesSearch && matchesType
    })
  }, [categories, searchQuery, typeFilter])

  const expenseCount = useMemo(() => categories.filter((c) => c.type === "expense").length, [categories])
  const incomeCount = useMemo(() => categories.filter((c) => c.type === "income").length, [categories])

  const handleAddCategory = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newCatName.trim()) return
    setIsSubmitting(true)

    await createCategory({
      name: newCatName.trim(),
      type: newCatType,
      currency: profile.currency || "USD",
    })

    setNewCatName("")
    setIsSubmitting(false)
    setShowAddModal(false)
  }

  return (
    <div className={`flex flex-col gap-5 ${SECTION_MIN_H}`}>
      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-4">
        <KpiCard label="Total Categories" value={String(categories.length)} delay={0} icon={CircleDot} />
        <KpiCard label="Expense Categories" value={String(expenseCount)} delay={0.06} icon={ArrowDownRight} />
        <KpiCard label="Income Categories" value={String(incomeCount)} delay={0.12} icon={TrendingUp} />
        <KpiCard label="Monthly Spent" value={totalExpense.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} prefix={currencySymbol} delay={0.18} icon={DollarSign} />
      </div>

      {/* Main Panel */}
      <SectionPanel className="flex flex-col gap-5">
        {/* Controls Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-border/50 pb-5">
          <div className="flex flex-wrap items-center gap-3">
            <div className="relative w-full sm:w-64">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search categories..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-muted/30 border border-border/40 rounded-xl text-xs text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/20 transition-all font-sans"
              />
            </div>
            <div className="flex items-center rounded-xl bg-muted/40 p-1 border border-border/30">
              {(["all", "expense", "income"] as const).map((t) => (
                <button
                  key={t}
                  onClick={() => setTypeFilter(t)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold capitalize transition-all font-sans cursor-pointer ${
                    typeFilter === t
                      ? "bg-primary text-primary-foreground shadow-xs"
                      : "text-muted-foreground hover:text-foreground hover:bg-accent/30"
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>

          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center justify-center gap-2 px-4 py-2 bg-primary hover:bg-primary/90 text-primary-foreground rounded-xl text-xs font-semibold shadow-lg shadow-primary/25 hover:shadow-primary/40 transition-all duration-200 cursor-pointer font-sans shrink-0"
          >
            <Plus className="size-4" />
            <span>Add Category</span>
          </button>
        </div>

        {/* Add Category Form Modal */}
        <AnimatePresence>
          {showAddModal && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.25 }}
              className="overflow-hidden"
            >
              <form
                onSubmit={handleAddCategory}
                className="p-5 rounded-2xl bg-muted/30 border border-primary/30 flex flex-col gap-4 glow-teal-sm"
              >
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-bold text-foreground font-display">Create New Category</h4>
                  <button
                    type="button"
                    onClick={() => setShowAddModal(false)}
                    className="text-muted-foreground hover:text-foreground transition-colors p-1 cursor-pointer"
                  >
                    <X className="size-4" />
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide block mb-1.5 font-sans">
                      Category Name
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Groceries, Subscriptions, Salary"
                      value={newCatName}
                      onChange={(e) => setNewCatName(e.target.value)}
                      className="w-full px-3 py-2 bg-background border border-border/60 rounded-xl text-xs text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:border-primary font-sans"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide block mb-1.5 font-sans">
                      Type
                    </label>
                    <select
                      value={newCatType}
                      onChange={(e) => setNewCatType(e.target.value as "expense" | "income")}
                      className="w-full px-3 py-2 bg-background border border-border/60 rounded-xl text-xs text-foreground focus:outline-none focus:border-primary font-sans appearance-none cursor-pointer"
                    >
                      <option value="expense">Expense</option>
                      <option value="income">Income</option>
                    </select>
                  </div>
                </div>

                <div className="flex items-center justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowAddModal(false)}
                    className="px-4 py-2 rounded-xl text-xs font-semibold text-muted-foreground hover:bg-accent/40 transition-colors font-sans cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="px-4 py-2 rounded-xl text-xs font-semibold bg-primary text-primary-foreground hover:bg-primary/90 transition-colors font-sans shadow-md cursor-pointer"
                  >
                    {isSubmitting ? "Saving..." : "Save Category"}
                  </button>
                </div>
              </form>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Categories Grid */}
        {filteredCategories.length === 0 ? (
          <div className="p-8 text-center text-xs text-muted-foreground font-sans">
            No categories found. Click "+ Add Category" to create one.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredCategories.map((cat, i) => {
              const isIncome = cat.type === "income"
              const totalVal = cat.total_spent ?? 0
              const maxVal = isIncome ? totalIncome : totalExpense
              const percent = maxVal > 0 ? Math.min(100, Math.round((totalVal / maxVal) * 100)) : 0
              const catColor = isIncome ? "oklch(0.76 0.16 162)" : "#5b4dc7"

              return (
                <motion.div
                  key={cat.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: i * 0.03 }}
                  className="surface-card rounded-2xl p-5 flex flex-col justify-between hover:scale-[1.01] transition-transform duration-200 group border border-border/40"
                  style={{ boxShadow: CARD_SHADOW }}
                >
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2.5">
                        <div className="size-8 rounded-lg bg-accent/50 flex items-center justify-center">
                          <CircleDot className="size-4 text-foreground" style={{ color: catColor }} />
                        </div>
                        <span className="font-bold text-sm text-foreground font-display">{cat.name}</span>
                      </div>
                      <span
                        className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md ${
                          isIncome ? "bg-fin-gain/10 text-fin-gain" : "bg-fin-loss/10 text-fin-loss"
                        }`}
                      >
                        {cat.type}
                      </span>
                    </div>

                    <div className="my-2">
                      <p className={`text-2xl font-bold font-mono tracking-tight ${isIncome ? "text-fin-gain" : "text-foreground"}`}>
                        {isIncome ? "+" : ""}{currencySymbol}{totalVal.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </p>
                      <p className="text-[11px] text-muted-foreground font-sans mt-0.5">
                        {percent}% of total {cat.type}s
                      </p>
                    </div>
                  </div>

                  <div className="mt-4 pt-3 border-t border-border/30">
                    <div className="flex items-center justify-between text-[11px] text-muted-foreground mb-1.5 font-sans">
                      <span>Monthly Share</span>
                      <span className="font-mono font-semibold text-foreground">{percent}%</span>
                    </div>
                    <div className="h-1.5 rounded-full bg-muted/60 overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${percent}%` }}
                        transition={{ duration: 0.8, delay: 0.1 + i * 0.02, ease: EASE_OUT }}
                        className="h-full rounded-full"
                        style={{ background: catColor }}
                      />
                    </div>
                  </div>
                </motion.div>
              )
            })}
          </div>
        )}
      </SectionPanel>
    </div>
  )
}

// ─── Section: Settings ──────────────────────────────────────────

function SettingsSection() {
  const [activeTab, setActiveTab] = useState("profile")
  const { profile, updateProfile, initials } = useUserProfile()
  const router = useRouter()

  const [isEditing, setIsEditing] = useState(false)
  const [fullName, setFullName] = useState(profile.fullName)
  const [username, setUsername] = useState(profile.username)
  const [email, setEmail] = useState(profile.email)
  const [currency, setCurrency] = useState(profile.currency)
  const [phone, setPhone] = useState(profile.phone || "+1 (555) 019-2834")
  const [language, setLanguage] = useState(profile.language || "English (US)")
  const [saveSuccess, setSaveSuccess] = useState(false)

  useEffect(() => {
    setFullName(profile.fullName)
    setUsername(profile.username)
    setEmail(profile.email)
    setCurrency(profile.currency)
    setPhone(profile.phone || "+1 (555) 019-2834")
    setLanguage(profile.language || "English (US)")
  }, [profile])

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault()
    updateProfile({
      fullName,
      username: username.startsWith("@") ? username : `@${username}`,
      email,
      currency,
      phone,
      language,
    })
    setIsEditing(false)
    setSaveSuccess(true)
    setTimeout(() => setSaveSuccess(false), 3000)
  }

  const tabs = [
    { id: "profile", label: "Profile", icon: UserCog },
    { id: "notifications", label: "Notifications", icon: BellRing },
    { id: "security", label: "Security", icon: Lock },
    { id: "display", label: "Display", icon: Monitor },
  ]

  return (
    <div className={`flex flex-col gap-5 ${SECTION_MIN_H}`}>
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }} className="rounded-2xl surface-card p-5 lg:p-6 relative overflow-hidden" style={{ boxShadow: CARD_SHADOW }}>
        <GlowOrb className="w-48 h-48 -top-24 -right-24 bg-primary/6" />
        <h3 className="text-lg font-bold text-foreground font-display tracking-tight">Account Settings</h3>
        <p className="text-xs text-muted-foreground mt-1 font-sans">Manage your personal profile, preferences, and security</p>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-5">
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.1 }} className="rounded-2xl surface-card p-3.5 lg:col-span-1" style={{ boxShadow: CARD_SHADOW }}>
          <nav className="flex flex-col gap-1">
            {tabs.map((tab) => {
              const Icon = tab.icon
              return (
                <button key={tab.id} onClick={() => setActiveTab(tab.id)}
                  className={`relative flex items-center gap-3 px-3.5 py-3 rounded-xl text-sm font-semibold transition-all duration-200 w-full text-left font-sans cursor-pointer ${
                    activeTab === tab.id ? "text-foreground bg-primary/8" : "text-muted-foreground hover:text-foreground hover:bg-accent/40"
                  }`}>
                  <Icon className="size-4" />{tab.label}
                  {activeTab === tab.id && <ChevronRight className="size-3.5 ml-auto text-primary" />}
                </button>
              )
            })}
            <div className="border-t border-border/50 my-2" />
            <button
              onClick={async () => {
                if (isSupabaseConfigured && supabase) {
                  try {
                    await supabase.auth.signOut()
                  } catch {
                    // Ignore
                  }
                }
                if (typeof window !== "undefined") {
                  localStorage.removeItem("spendly_auth_user_id")
                  localStorage.removeItem("spendly_accounts")
                  localStorage.removeItem("spendly_transactions")
                  localStorage.removeItem("spendly_categories")
                  localStorage.removeItem("spendly_user_profile")
                }
                router.replace("/login")
              }}
              className="flex items-center gap-3 px-3.5 py-3 rounded-xl text-sm font-semibold text-fin-loss/70 hover:text-fin-loss hover:bg-fin-loss/5 transition-all duration-200 w-full text-left font-sans cursor-pointer"
            >
              <LogOut className="size-4" />Sign Out
            </button>
          </nav>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.2 }} className="rounded-2xl surface-card p-5 lg:p-7 lg:col-span-3" style={{ boxShadow: CARD_SHADOW }}>
          <AnimatePresence mode="wait">
            <motion.div key={activeTab} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.25 }}>
              {activeTab === "profile" && (
                <div className="flex flex-col gap-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-sm font-bold text-foreground font-display">Personal Information</h4>
                      <p className="text-xs text-muted-foreground mt-0.5 font-sans">Manage your personal profile and account details</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setIsEditing(!isEditing)}
                      className="px-3.5 py-1.5 rounded-xl border border-border/50 hover:border-primary/40 text-xs font-semibold text-foreground hover:bg-accent/40 transition-colors font-sans cursor-pointer"
                    >
                      {isEditing ? "Cancel" : "Edit Details"}
                    </button>
                  </div>

                  {saveSuccess && (
                    <div className="p-3 rounded-xl bg-fin-gain/10 border border-fin-gain/20 text-fin-gain text-xs font-sans flex items-center gap-2">
                      <Check className="size-4" /> Profile details updated successfully!
                    </div>
                  )}

                  {/* Profile Header Card */}
                  <div className="flex items-center gap-4 p-4 rounded-2xl bg-muted/20 border border-border/30">
                    <div className="size-16 rounded-2xl bg-primary/15 flex items-center justify-center glow-teal-sm shrink-0">
                      <span className="text-xl font-bold text-primary font-display">{initials}</span>
                    </div>
                    <div>
                      <p className="text-base font-bold text-foreground font-display">{profile.fullName || "Spendly User"}</p>
                      <p className="text-xs text-muted-foreground font-sans mt-0.5">{profile.username || "@user"}</p>
                    </div>
                  </div>

                  {isEditing ? (
                    <form onSubmit={handleSave} className="flex flex-col gap-4">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="flex flex-col gap-1.5">
                          <label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-[0.06em] font-sans">Full Name</label>
                          <input
                            type="text"
                            value={fullName}
                            onChange={(e) => setFullName(e.target.value)}
                            required
                            className="bg-muted/30 rounded-xl px-4 py-2.5 border border-border/40 text-sm text-foreground focus:outline-none focus:border-primary/60 font-sans"
                          />
                        </div>

                        <div className="flex flex-col gap-1.5">
                          <label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-[0.06em] font-sans">Username</label>
                          <input
                            type="text"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            required
                            className="bg-muted/30 rounded-xl px-4 py-2.5 border border-border/40 text-sm text-foreground focus:outline-none focus:border-primary/60 font-sans"
                          />
                        </div>

                        <div className="flex flex-col gap-1.5">
                          <label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-[0.06em] font-sans">Email</label>
                          <input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                            className="bg-muted/30 rounded-xl px-4 py-2.5 border border-border/40 text-sm text-foreground focus:outline-none focus:border-primary/60 font-sans"
                          />
                        </div>

                        <div className="flex flex-col gap-1.5">
                          <label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-[0.06em] font-sans">Default Currency</label>
                          <select
                            value={currency}
                            onChange={(e) => setCurrency(e.target.value)}
                            className="bg-muted/30 rounded-xl px-4 py-2.5 border border-border/40 text-sm text-foreground focus:outline-none focus:border-primary/60 font-sans cursor-pointer appearance-none"
                          >
                            <option value="USD" className="bg-card text-foreground">USD ($)</option>
                            <option value="EGP" className="bg-card text-foreground">EGP (EGP)</option>
                            <option value="EUR" className="bg-card text-foreground">EUR (€)</option>
                            <option value="GBP" className="bg-card text-foreground">GBP (£)</option>
                            <option value="AED" className="bg-card text-foreground">AED (AED)</option>
                          </select>
                        </div>

                        <div className="flex flex-col gap-1.5">
                          <label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-[0.06em] font-sans">Phone</label>
                          <input
                            type="text"
                            value={phone}
                            onChange={(e) => setPhone(e.target.value)}
                            className="bg-muted/30 rounded-xl px-4 py-2.5 border border-border/40 text-sm text-foreground focus:outline-none focus:border-primary/60 font-sans"
                          />
                        </div>

                        <div className="flex flex-col gap-1.5">
                          <label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-[0.06em] font-sans">Language</label>
                          <input
                            type="text"
                            value={language}
                            onChange={(e) => setLanguage(e.target.value)}
                            className="bg-muted/30 rounded-xl px-4 py-2.5 border border-border/40 text-sm text-foreground focus:outline-none focus:border-primary/60 font-sans"
                          />
                        </div>
                      </div>

                      <div className="flex items-center justify-end gap-3 pt-2">
                        <button
                          type="button"
                          onClick={() => setIsEditing(false)}
                          className="px-4 py-2 rounded-xl text-xs font-semibold text-muted-foreground hover:bg-accent/40 font-sans cursor-pointer"
                        >
                          Cancel
                        </button>
                        <button
                          type="submit"
                          className="px-5 py-2 rounded-xl text-xs font-semibold bg-primary text-primary-foreground hover:bg-primary/90 transition-colors font-sans shadow-md cursor-pointer"
                        >
                          Save Changes
                        </button>
                      </div>
                    </form>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {[
                        { label: "Full Name", value: profile.fullName || "Spendly User", icon: UserCog },
                        { label: "Username", value: profile.username || "@user", icon: UserCog },
                        { label: "Email", value: profile.email || "user@spendly.app", icon: Mail },
                        { label: "Default Currency", value: `${profile.currency || "USD"}`, icon: DollarSign },
                        { label: "Phone", value: profile.phone || "+1 (555) 019-2834", icon: HelpCircle },
                        { label: "Language", value: profile.language || "English (US)", icon: Languages },
                      ].map((field, i) => (
                        <div key={i} className="flex flex-col gap-2">
                          <label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-[0.06em] font-sans">{field.label}</label>
                          <div className="flex items-center gap-2.5 bg-muted/30 rounded-xl px-4 py-3 border border-border/30">
                            <field.icon className="size-4 text-muted-foreground shrink-0" />
                            <span className="text-sm text-foreground font-sans font-medium">{field.value}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
              {activeTab === "notifications" && (
                <div className="flex flex-col gap-6">
                  <div><h4 className="text-sm font-bold text-foreground font-display">Notification Preferences</h4><p className="text-xs text-muted-foreground mt-0.5 font-sans">Choose how you want to be notified</p></div>
                  {[
                    { label: "Budget Alerts", desc: "Get notified when a category approaches its spending limit", enabled: true },
                    { label: "Large Transaction Alerts", desc: "Receive confirmation when transactions over $100 occur", enabled: true },
                    { label: "Bill Due Reminders", desc: "Alerts 3 days before recurring bills and rent payments", enabled: true },
                    { label: "Income & Deposits", desc: "Notifications for incoming salary and freelance payments", enabled: true },
                    { label: "Weekly Spending Summary", desc: "Weekly expense recap sent via email", enabled: false },
                    { label: "Monthly Digest", desc: "Monthly breakdown of savings rate and net worth", enabled: true },
                  ].map((item, i) => (
                    <div key={i} className="flex items-center justify-between py-1">
                      <div><p className="text-sm font-semibold text-foreground font-sans">{item.label}</p><p className="text-xs text-muted-foreground mt-0.5 font-sans">{item.desc}</p></div>
                      <div className={`w-11 h-6 rounded-full relative cursor-pointer transition-colors duration-300 ${item.enabled ? "bg-primary" : "bg-muted"}`}>
                        <div className={`absolute top-0.5 size-5 rounded-full bg-foreground transition-transform duration-300 ${item.enabled ? "translate-x-5.5" : "translate-x-0.5"}`} />
                      </div>
                    </div>
                  ))}
                </div>
              )}
              {activeTab === "security" && (
                <div className="flex flex-col gap-5">
                  <div><h4 className="text-sm font-bold text-foreground font-display">Security Settings</h4><p className="text-xs text-muted-foreground mt-0.5 font-sans">Manage your account security</p></div>
                  {[
                    { label: "Two-Factor Authentication", desc: "Add an extra layer of security to your account", status: "Enabled", statusColor: "text-fin-gain" },
                    { label: "Password", desc: "Last changed 45 days ago", status: "Update", statusColor: "text-primary" },
                    { label: "Active Sessions", desc: "1 device currently logged in", status: "Manage", statusColor: "text-primary" },
                    { label: "Data Encryption", desc: "End-to-end encrypted financial records", status: "Active", statusColor: "text-fin-gain" },
                  ].map((item, i) => (
                    <div key={i} className="flex items-center justify-between p-4 rounded-xl bg-muted/20 border border-border/30">
                      <div className="flex items-center gap-3.5">
                        <div className="size-10 rounded-xl bg-accent/50 flex items-center justify-center"><Lock className="size-4 text-muted-foreground" /></div>
                        <div><p className="text-sm font-semibold text-foreground font-sans">{item.label}</p><p className="text-xs text-muted-foreground mt-0.5 font-sans">{item.desc}</p></div>
                      </div>
                      <span className={`text-xs font-bold ${item.statusColor}`}>{item.status}</span>
                    </div>
                  ))}
                </div>
              )}
              {activeTab === "display" && (
                <div className="flex flex-col gap-5">
                  <div><h4 className="text-sm font-bold text-foreground font-display">Display Preferences</h4><p className="text-xs text-muted-foreground mt-0.5 font-sans">Customize how the dashboard looks</p></div>
                  {[
                    { label: "Theme", desc: "Choose your preferred color scheme", value: "Dark", icon: Palette },
                    { label: "Default Currency", desc: "Primary currency for accounts & analytics", value: profile.currency || "USD ($)", icon: DollarSign },
                    { label: "Date Format", desc: "How dates are displayed", value: "YYYY-MM-DD", icon: Calendar },
                    { label: "Number Format", desc: "Standard separator format", value: "1,234.56", icon: Monitor },
                  ].map((item, i) => {
                    const Icon = item.icon
                    return (
                      <div key={i} className="flex items-center justify-between p-4 rounded-xl bg-muted/20 border border-border/30">
                        <div className="flex items-center gap-3.5">
                          <Icon className="size-4 text-muted-foreground" />
                          <div><p className="text-sm font-semibold text-foreground font-sans">{item.label}</p><p className="text-xs text-muted-foreground font-sans">{item.desc}</p></div>
                        </div>
                        <span className="text-xs font-bold text-foreground bg-muted/60 px-3 py-1.5 rounded-lg font-mono">{item.value}</span>
                      </div>
                    )
                  })}
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        </motion.div>
      </div>
    </div>
  )
}

function DashboardSection({ onNavigate }: { onNavigate?: (section: SectionId) => void }) {
  return (
    <div className={`flex flex-col gap-5 ${SECTION_MIN_H}`}>
      <NetWorthCard />
      <DashboardAccountsSection onNavigate={onNavigate} />
    </div>
  )
}

const sectionComponents: Record<SectionId, React.FC<{ onNavigate?: (section: SectionId) => void }>> = {
  dashboard: DashboardSection,
  transactions: TransactionsSection,
  accounts: AccountsSection,
  categories: CategoriesSection,
  settings: SettingsSection,
}

export interface FinancialAnalyticsDashboardProps {
  initialSection?: SectionId
}

export default function FinancialAnalyticsDashboard({ initialSection = "dashboard" }: FinancialAnalyticsDashboardProps = {}) {
  const router = useRouter()
  const [activeSection, setActiveSection] = useState<SectionId>(initialSection)
  const [isTransitioning, setIsTransitioning] = useState(false)
  const [notificationsOpen, setNotificationsOpen] = useState(false)
  const [notifItems, setNotifItems] = useState(notifications)
  const [authLoading, setAuthLoading] = useState(true)
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const { initials } = useUserProfile()

  useEffect(() => {
    let isMounted = true

    const checkAuthentication = async () => {
      if (isSupabaseConfigured && supabase) {
        try {
          if (typeof window !== "undefined") {
            const url = new URL(window.location.href)
            const code = url.searchParams.get("code")
            if (code) {
              await supabase.auth.exchangeCodeForSession(code)
            }
          }

          const { data: { user } } = await supabase.auth.getUser()
          if (user) {
            if (isMounted) {
              if (typeof window !== "undefined") {
                localStorage.setItem("spendly_auth_user_id", user.id)
              }
              setIsAuthenticated(true)
              setAuthLoading(false)
            }
            return
          }

          const { data: { session } } = await supabase.auth.getSession()
          if (session?.user) {
            if (isMounted) {
              if (typeof window !== "undefined") {
                localStorage.setItem("spendly_auth_user_id", session.user.id)
              }
              setIsAuthenticated(true)
              setAuthLoading(false)
            }
            return
          }
        } catch {
          // Ignore
        }

        // If URL contains hash tokens, give Supabase client a moment to resolve before redirecting
        if (typeof window !== "undefined" && (window.location.hash.includes("access_token") || window.location.search.includes("code"))) {
          setTimeout(async () => {
            const { data } = await supabase.auth.getSession()
            if (data?.session?.user && isMounted) {
              localStorage.setItem("spendly_auth_user_id", data.session.user.id)
              setIsAuthenticated(true)
              setAuthLoading(false)
            } else if (isMounted) {
              setIsAuthenticated(false)
              setAuthLoading(false)
              router.replace("/login")
            }
          }, 800)
          return
        }

        if (isMounted) {
          setIsAuthenticated(false)
          setAuthLoading(false)
          router.replace("/login")
        }
        return
      }

      // If Supabase not configured, check local storage
      const localUid = typeof window !== "undefined" ? localStorage.getItem("spendly_auth_user_id") : null
      if (localUid) {
        if (isMounted) {
          setIsAuthenticated(true)
          setAuthLoading(false)
        }
      } else {
        if (isMounted) {
          setIsAuthenticated(false)
          setAuthLoading(false)
          router.replace("/login")
        }
      }
    }

    checkAuthentication()

    let authSub: any = null
    if (isSupabaseConfigured && supabase) {
      const { data } = supabase.auth.onAuthStateChange((event, session) => {
        if (event === "SIGNED_OUT" || !session?.user) {
          if (isMounted) {
            setIsAuthenticated(false)
            router.replace("/login")
          }
        } else if (session?.user) {
          if (isMounted) {
            setIsAuthenticated(true)
            setAuthLoading(false)
          }
        }
      })
      authSub = data?.subscription
    }

    return () => {
      isMounted = false
      authSub?.unsubscribe?.()
    }
  }, [router])

  const handleNavigation = useCallback((sectionId: SectionId) => {
    if (sectionId === activeSection) return
    setIsTransitioning(true)
    setTimeout(() => { setActiveSection(sectionId); setIsTransitioning(false) }, 180)
  }, [activeSection])

  const handleMarkRead = useCallback((id: number) => { setNotifItems((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n))) }, [])
  const handleMarkAllRead = useCallback(() => { setNotifItems((prev) => prev.map((n) => ({ ...n, read: true }))) }, [])

  const unreadCount = useMemo(() => notifItems.filter((n) => !n.read).length, [notifItems])
  const ActiveComponent = useMemo(() => sectionComponents[activeSection], [activeSection])
  const activeNav = useMemo(() => NAV_ITEMS.find((n) => n.id === activeSection), [activeSection])

  if (authLoading || !isAuthenticated) {
    return (
      <div className="w-full min-h-screen bg-background text-foreground flex items-center justify-center relative">
        <div className="fixed inset-0 pointer-events-none z-0">
          <div className="absolute top-0 left-1/4 w-[600px] h-[600px] rounded-full opacity-[0.03] blur-[120px]" style={{ background: C.teal }} />
          <div className="absolute bottom-0 right-1/4 w-[500px] h-[500px] rounded-full opacity-[0.02] blur-[100px]" style={{ background: C.azure }} />
        </div>
        <div className="relative z-10 size-8 rounded-full border-2 border-primary border-t-transparent animate-spin" />
      </div>
    )
  }

  return (
    <div className="w-full min-h-screen bg-background text-foreground flex flex-col relative" style={{ boxShadow: CARD_SHADOW }}>
      {/* Atmospheric mesh gradient background */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute top-0 left-1/4 w-[600px] h-[600px] rounded-full opacity-[0.03] blur-[120px] animate-float" style={{ background: C.teal }} />
        <div className="absolute bottom-0 right-1/4 w-[500px] h-[500px] rounded-full opacity-[0.02] blur-[100px] animate-float" style={{ background: C.azure, animationDelay: "3s" }} />
      </div>

      {/* Floating navigation */}
      <header className="sticky top-0 z-30 px-2 py-3 sm:px-4 sm:py-4">
        <div className="mx-auto w-full rounded-2xl border-2 border-border/40 bg-card/60 px-3 py-3 backdrop-blur-xl sm:px-6 sm:py-4">
          <div className="flex min-w-0 items-center justify-between gap-3">
            <button onClick={() => handleNavigation("dashboard")} className="cursor-pointer shrink-0" aria-label="Go to Dashboard">
              <span className="text-lg font-semibold tracking-tight text-foreground font-sans sm:text-xl">Spendly</span>
            </button>

            <nav aria-label="Primary navigation" className="hidden min-w-0 items-center gap-2 overflow-x-auto md:flex lg:gap-4 scrollbar-none">
              {NAV_ITEMS.map((item) => {
                const isActive = item.id === activeSection
                const Icon = item.icon
                return (
                  <button key={item.id} onClick={() => handleNavigation(item.id)}
                    className={`relative flex items-center gap-2 rounded-xl px-3 py-2 text-[13px] font-semibold whitespace-nowrap transition-all duration-250 font-sans cursor-pointer ${
                      isActive ? "text-foreground bg-accent/40" : "text-muted-foreground hover:text-foreground hover:bg-accent/30"
                    }`}
                    aria-current={isActive ? "page" : undefined}
                  >
                    <Icon className="size-4" />
                    <span>{item.label}</span>
                    {isActive && <motion.div layoutId="nav-indicator" className="absolute bottom-0 left-3 right-3 h-0.5 rounded-full bg-primary" style={{ boxShadow: `0 0 8px 2px rgb(91 77 199 / 0.3)` }} transition={SPRING} />}
                  </button>
                )
              })}
            </nav>

            <div className="flex items-center gap-1.5">
              <button className="rounded-xl p-2.5 transition-all duration-200 hover:bg-accent/50 cursor-pointer" aria-label="Search">
                <Search className="size-4 text-muted-foreground" />
              </button>
              <div className="relative">
                <button onClick={() => setNotificationsOpen((prev) => !prev)} className="relative rounded-xl p-2.5 transition-all duration-200 hover:bg-accent/50 cursor-pointer" aria-label="Notifications" aria-expanded={notificationsOpen}>
                  <Bell className="size-4 text-muted-foreground" />
                  {unreadCount > 0 && <motion.span initial={{ scale: 0 }} animate={{ scale: 1 }} transition={SPRING} className="absolute -right-0.5 -top-0.5 flex size-5 items-center justify-center rounded-full bg-primary text-[9px] font-bold text-primary-foreground font-mono">{unreadCount}</motion.span>}
                </button>
                <NotificationPanel isOpen={notificationsOpen} onClose={() => setNotificationsOpen(false)} items={notifItems} onMarkRead={handleMarkRead} onMarkAllRead={handleMarkAllRead} />
              </div>
              <button className="rounded-xl p-2.5 transition-all duration-200 hover:bg-accent/50 cursor-pointer" aria-label="Settings" onClick={() => handleNavigation("settings")}>
                <Settings className="size-4 text-muted-foreground" />
              </button>
              <div onClick={() => handleNavigation("settings")} className="ml-1.5 flex size-9 cursor-pointer items-center justify-center rounded-xl bg-primary/12 glow-teal-sm transition-colors hover:bg-primary/18">
                <span className="text-xs font-bold text-primary font-display">{initials}</span>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="w-full px-5 lg:px-10 xl:px-14 py-6 lg:py-8 flex-1 relative z-10">
        <AnimatePresence mode="wait">
          <motion.div key={activeSection}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: isTransitioning ? 0.3 : 1, y: isTransitioning ? 6 : 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.35, ease: EASE_OUT }}
          >
            <ActiveComponent onNavigate={handleNavigation} />
          </motion.div>
        </AnimatePresence>
      </main>

      {/* Footer */}
      <footer className="border-t border-border/40 mt-auto relative z-10">
        <div className="w-full px-5 lg:px-10 xl:px-14 py-4">
          <div className="flex items-center justify-between text-[11px] text-muted-foreground font-sans">
            <div className="flex items-center gap-2">
              <div className="size-2 rounded-full bg-fin-gain animate-pulse-soft" />
              <span className="font-medium">All systems operational</span>
            </div>
            <span className="font-mono text-muted-foreground/60">Last updated: Feb 20, 2026 — 14:32 UTC</span>
          </div>
        </div>
      </footer>
    </div>
  )
}
