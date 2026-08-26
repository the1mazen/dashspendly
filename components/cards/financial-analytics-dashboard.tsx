"use client"

import React, { useState, useCallback, useMemo, useRef, useEffect } from "react"
import { motion, AnimatePresence } from "motion/react"
import {
  BarChart3, TrendingUp, Shield, ArrowLeftRight, Globe, ArrowUpRight, ArrowDownRight,
  ChevronRight, Bell, Search, Settings, Wallet, CircleDot, Eye, FileText, UserCog,
  X, Check, AlertTriangle, Info, DollarSign, Clock, Star, Plus, Download, Filter,
  Calendar, Mail, Lock, Palette, Monitor, BellRing, CreditCard, Languages, HelpCircle,
  LogOut, ChevronDown, Activity, Zap,
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

const transactions = [
  { id: 1, type: "buy" as const, asset: "AAPL", shares: 25, price: 189.45, total: 4736.25, date: "2026-02-18", time: "09:32" },
  { id: 2, type: "sell" as const, asset: "TSLA", shares: 10, price: 248.72, total: 2487.2, date: "2026-02-17", time: "14:15" },
  { id: 3, type: "buy" as const, asset: "NVDA", shares: 15, price: 875.3, total: 13129.5, date: "2026-02-15", time: "10:45" },
  { id: 4, type: "sell" as const, asset: "AMZN", shares: 8, price: 178.9, total: 1431.2, date: "2026-02-14", time: "15:22" },
  { id: 5, type: "buy" as const, asset: "MSFT", shares: 20, price: 415.6, total: 8312.0, date: "2026-02-13", time: "11:08" },
  { id: 6, type: "buy" as const, asset: "GOOG", shares: 12, price: 174.25, total: 2091.0, date: "2026-02-12", time: "09:55" },
  { id: 7, type: "sell" as const, asset: "META", shares: 18, price: 582.4, total: 10483.2, date: "2026-02-11", time: "13:30" },
  { id: 8, type: "buy" as const, asset: "AMD", shares: 30, price: 168.15, total: 5044.5, date: "2026-02-10", time: "10:12" },
]

const recentTransactions = [
  { id: 1, description: "Salary deposit", category: "Income", date: "Feb 20, 2026", amount: 5200, type: "income" as const },
  { id: 2, description: "Whole Foods Market", category: "Groceries", date: "Feb 19, 2026", amount: -86.42, type: "expense" as const },
  { id: 3, description: "Freelance project", category: "Income", date: "Feb 18, 2026", amount: 1250, type: "income" as const },
  { id: 4, description: "Monthly rent", category: "Housing", date: "Feb 17, 2026", amount: -1850, type: "expense" as const },
  { id: 5, description: "Metro transit pass", category: "Transport", date: "Feb 16, 2026", amount: -95, type: "expense" as const },
  { id: 6, description: "Electric bill", category: "Utilities", date: "Feb 15, 2026", amount: -124.18, type: "expense" as const },
]

const marketIndices = [
  { name: "S&P 500", value: "5,842.31", change: 1.24, data: [40, 42, 38, 45, 43, 47, 49, 48, 52, 50, 54, 56] },
  { name: "NASDAQ", value: "18,471.52", change: 1.58, data: [60, 63, 58, 67, 65, 70, 72, 69, 75, 73, 78, 82] },
  { name: "DOW Jones", value: "42,987.65", change: -0.32, data: [80, 78, 82, 79, 77, 80, 83, 81, 79, 82, 80, 78] },
  { name: "Russell 2000", value: "2,198.44", change: 0.89, data: [20, 22, 19, 24, 23, 25, 27, 26, 28, 27, 30, 31] },
]

const topMovers = [
  { ticker: "NVDA", name: "NVIDIA Corp", change: 4.82, price: 892.15 },
  { ticker: "SMCI", name: "Super Micro", change: 7.21, price: 845.3 },
  { ticker: "PLTR", name: "Palantir", change: -3.15, price: 72.4 },
  { ticker: "ARM", name: "ARM Holdings", change: 5.43, price: 168.9 },
  { ticker: "COIN", name: "Coinbase", change: -2.87, price: 215.6 },
]

const notifications = [
  { id: 1, type: "success" as const, title: "Order Executed", message: "Bought 25 shares of AAPL at $189.45", time: "2 min ago", read: false },
  { id: 2, type: "warning" as const, title: "Price Alert", message: "TSLA dropped below your $250 threshold", time: "18 min ago", read: false },
  { id: 3, type: "info" as const, title: "Portfolio Rebalance", message: "Your quarterly rebalance is scheduled for tomorrow", time: "1h ago", read: false },
  { id: 4, type: "success" as const, title: "Dividend Received", message: "$342.50 dividend from MSFT credited to your account", time: "3h ago", read: true },
  { id: 5, type: "warning" as const, title: "Risk Alert", message: "Concentration in Technology sector exceeds 45% limit", time: "5h ago", read: true },
  { id: 6, type: "info" as const, title: "Market Update", message: "Fed minutes released — markets react positively", time: "6h ago", read: true },
  { id: 7, type: "success" as const, title: "Transfer Complete", message: "$10,000 deposit successfully processed", time: "1d ago", read: true },
]

const watchlistItems = [
  { ticker: "AAPL", name: "Apple Inc.", price: 189.45, change: 2.31, volume: "48.2M", pe: 28.4, marketCap: "2.94T", data: [180, 183, 181, 185, 187, 184, 189, 188, 190, 189, 191, 189] },
  { ticker: "NVDA", name: "NVIDIA Corp", price: 892.15, change: 4.82, volume: "62.1M", pe: 65.2, marketCap: "2.20T", data: [820, 835, 845, 860, 855, 870, 880, 875, 890, 885, 895, 892] },
  { ticker: "MSFT", name: "Microsoft Corp", price: 415.60, change: 1.15, volume: "22.8M", pe: 34.1, marketCap: "3.09T", data: [400, 403, 408, 405, 410, 412, 408, 414, 416, 413, 417, 416] },
  { ticker: "AMZN", name: "Amazon.com Inc", price: 178.90, change: -0.72, volume: "38.5M", pe: 42.8, marketCap: "1.86T", data: [175, 178, 180, 179, 182, 181, 179, 180, 178, 179, 177, 179] },
  { ticker: "GOOG", name: "Alphabet Inc", price: 174.25, change: 0.98, volume: "18.9M", pe: 22.6, marketCap: "2.15T", data: [168, 170, 172, 171, 173, 172, 174, 173, 175, 174, 176, 174] },
  { ticker: "META", name: "Meta Platforms", price: 582.40, change: 3.12, volume: "15.4M", pe: 25.9, marketCap: "1.48T", data: [555, 560, 565, 570, 568, 575, 578, 572, 580, 576, 585, 582] },
  { ticker: "TSLA", name: "Tesla Inc", price: 248.72, change: -2.45, volume: "85.7M", pe: 58.3, marketCap: "792B", data: [260, 258, 255, 252, 256, 253, 250, 252, 248, 251, 247, 249] },
  { ticker: "BRK.B", name: "Berkshire Hathaway", price: 462.30, change: 0.45, volume: "3.2M", pe: 9.1, marketCap: "1.05T", data: [455, 457, 458, 460, 459, 461, 460, 462, 461, 463, 462, 462] },
]

const reportsData = [
  { id: 1, name: "Q4 2025 Performance Report", type: "Performance", date: "2026-01-15", status: "ready" as const, size: "2.4 MB" },
  { id: 2, name: "Annual Tax Summary 2025", type: "Tax", date: "2026-02-01", status: "ready" as const, size: "1.8 MB" },
  { id: 3, name: "Risk Assessment — February", type: "Risk", date: "2026-02-10", status: "ready" as const, size: "3.1 MB" },
  { id: 4, name: "Dividend Income Report", type: "Income", date: "2026-02-14", status: "ready" as const, size: "0.9 MB" },
  { id: 5, name: "Portfolio Allocation Analysis", type: "Analysis", date: "2026-02-18", status: "generating" as const, size: "—" },
  { id: 6, name: "Monthly Statement — January", type: "Statement", date: "2026-02-05", status: "ready" as const, size: "1.2 MB" },
  { id: 7, name: "Custom Benchmark Comparison", type: "Performance", date: "2026-02-12", status: "ready" as const, size: "2.7 MB" },
  { id: 8, name: "ESG Compliance Summary", type: "Compliance", date: "2026-02-08", status: "ready" as const, size: "1.5 MB" },
]

const incomeByMonth = [
  { month: "Sep", dividends: 285, interest: 120, other: 45 },
  { month: "Oct", dividends: 310, interest: 125, other: 30 },
  { month: "Nov", dividends: 420, interest: 130, other: 55 },
  { month: "Dec", dividends: 580, interest: 135, other: 40 },
  { month: "Jan", dividends: 345, interest: 128, other: 35 },
  { month: "Feb", dividends: 390, interest: 132, other: 50 },
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

// ─── Section: Personal finance dashboard ────────────────────────

function DashboardSection() {
  return (
    <div className={`flex flex-col gap-5 ${SECTION_MIN_H}`}>
      <AccountSelector accounts={["QNB", "Cash", "Card"]} />
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 lg:gap-4">
        <KpiCard label="Current Balance" value="62,450" prefix="$" change={6.03} delay={0} icon={DollarSign} glowColor="blue" />
        <KpiCard label="Current Income" value="6,450" prefix="+$" change={8.2} delay={0.06} icon={TrendingUp} glowColor="green" />
        <KpiCard label="Current Expenses" value="2,155" prefix="-$" change={3.4} delay={0.12} icon={ArrowDownRight} glowColor="red" />
      </div>

      <SectionPanel className="relative overflow-hidden">
        <GlowOrb className="w-64 h-64 -top-32 -right-32 bg-primary/10" />
        <SectionHeader title="Recent Transactions" subtitle="Your latest income and expenses">
          <button className="text-xs font-semibold text-primary hover:underline font-sans">View all</button>
        </SectionHeader>
        <div className="flex flex-col">
          <div className="hidden sm:grid grid-cols-[1.5fr_1fr_1fr_auto] gap-4 px-3 pb-3 text-[10px] font-semibold uppercase tracking-[0.08em] text-muted-foreground font-sans">
            <span>Description</span><span>Category</span><span>Date</span><span className="text-right">Amount</span>
          </div>
          {recentTransactions.map((item, i) => (
            <motion.div key={item.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }} className="grid grid-cols-[1fr_auto] sm:grid-cols-[1.5fr_1fr_1fr_auto] gap-x-4 gap-y-1 items-center px-3 py-3.5 border-t border-border/30 hover:bg-accent/20 transition-colors">
              <div className="flex items-center gap-3 min-w-0">
                <div className={`size-8 rounded-lg flex items-center justify-center shrink-0 ${item.type === "income" ? "bg-fin-gain/12 text-fin-gain" : "bg-fin-loss/12 text-fin-loss"}`}>
                  {item.type === "income" ? <ArrowDownRight className="size-4 rotate-180" /> : <ArrowUpRight className="size-4 rotate-90" />}
                </div>
                <span className="text-sm font-semibold text-foreground truncate font-sans">{item.description}</span>
              </div>
              <span className="text-xs text-muted-foreground font-sans">{item.category}</span>
              <span className="text-xs text-muted-foreground font-mono">{item.date}</span>
              <span className={`text-sm font-bold font-mono text-right ${item.type === "income" ? "text-fin-gain" : "text-fin-loss"}`}>{item.amount >= 0 ? "+" : "−"}${Math.abs(item.amount).toLocaleString("en-US", { minimumFractionDigits: 2 })}</span>
            </motion.div>
          ))}
        </div>
      </SectionPanel>
    </div>
  )
}

// ─── Section: Performance ───────────────────────────────────────

function PerformanceSection() {
  return (
    <div className={`flex flex-col gap-5 ${SECTION_MIN_H}`}>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-4">
        <KpiCard label="YTD Return" value="18.42" suffix="%" change={18.42} delay={0} icon={TrendingUp} />
        <KpiCard label="1Y Return" value="24.87" suffix="%" change={24.87} delay={0.06} icon={ArrowUpRight} />
        <KpiCard label="Alpha" value="3.61" suffix="%" delay={0.12} icon={Zap} />
        <KpiCard label="Win Rate" value="68.5" suffix="%" delay={0.18} icon={Check} />
      </div>

      <SectionPanel className="relative overflow-hidden">
        <GlowOrb className="w-48 h-48 -top-24 -left-24 bg-chart-2/8" />
        <SectionHeader title="Monthly Returns vs Benchmark" subtitle="Portfolio outperformance by month">
          <div className="flex items-center gap-5 text-[11px]">
            <div className="flex items-center gap-2"><div className="size-2.5 rounded-full bg-primary" /><span className="text-muted-foreground font-sans">Portfolio</span></div>
            <div className="flex items-center gap-2"><div className="size-2.5 rounded-full" style={{ background: C.slate }} /><span className="text-muted-foreground font-sans">Benchmark</span></div>
          </div>
        </SectionHeader>
        <div className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={performanceMonthly} margin={{ top: 5, right: 5, bottom: 0, left: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={C.grid} vertical={false} />
              <XAxis dataKey="month" tick={{ fontSize: 11, fill: C.tick }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: C.tick }} axisLine={false} tickLine={false} tickFormatter={(v: number) => `${v}%`} />
              <Tooltip content={<ChartTooltipContent />} />
              <Bar dataKey="return" name="return" fill={C.teal} radius={[6, 6, 0, 0]} animationDuration={900} />
              <Bar dataKey="benchmark" name="benchmark" fill={C.slate} radius={[6, 6, 0, 0]} animationDuration={900} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </SectionPanel>

      <SectionPanel>
        <SectionHeader title="Performance Attribution" subtitle="Contribution by sector" />
        <div className="flex flex-col gap-4">
          {[
            { sector: "Technology", contrib: 8.2, weight: 45 },
            { sector: "Healthcare", contrib: 3.1, weight: 18 },
            { sector: "Financials", contrib: 2.4, weight: 15 },
            { sector: "Consumer", contrib: 1.8, weight: 12 },
            { sector: "Energy", contrib: -0.7, weight: 10 },
          ].map((item, i) => (
            <div key={i} className="flex items-center gap-4">
              <span className="text-xs text-muted-foreground w-24 shrink-0 font-sans font-medium">{item.sector}</span>
              <div className="flex-1 h-2.5 rounded-full bg-muted/60 overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${item.weight}%` }}
                  transition={{ duration: 1, delay: 0.3 + i * 0.1, ease: EASE_OUT }}
                  className="h-full rounded-full"
                  style={{ background: item.contrib >= 0 ? C.teal : C.rose }}
                />
              </div>
              <span className={`text-xs font-mono font-bold w-14 text-right ${item.contrib >= 0 ? "text-fin-gain" : "text-fin-loss"}`}>
                {item.contrib > 0 ? "+" : ""}{item.contrib}%
              </span>
            </div>
          ))}
        </div>
      </SectionPanel>
    </div>
  )
}

// ─── Section: Risk ──────────────────────────────────────────────

function RiskSection() {
  return (
    <div className={`flex flex-col gap-5 ${SECTION_MIN_H}`}>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-4">
        {riskMetrics.map((m, i) => {
          const Icon = m.icon
          return (
            <motion.div
              key={m.metric}
              initial={{ opacity: 0, y: 16, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ duration: 0.5, delay: i * 0.06, ease: EASE_OUT }}
              className="relative overflow-hidden rounded-2xl surface-card p-4 lg:p-5 group hover:scale-[1.01] transition-transform duration-300"
              style={{ boxShadow: CARD_SHADOW }}
            >
              <div className="absolute top-0 right-0 w-20 h-20 opacity-[0.04] pointer-events-none">
                <Icon className="size-20 -translate-y-3 translate-x-3" />
              </div>
              <div className="flex items-center justify-between mb-2.5">
                <p className="text-[11px] font-semibold tracking-[0.08em] uppercase text-muted-foreground font-sans">{m.metric}</p>
                <div className={`size-2.5 rounded-full ${m.status === "good" ? "bg-fin-gain" : "bg-chart-3"} ${m.status === "good" ? "glow-teal-sm" : ""}`} />
              </div>
              <p className="text-2xl lg:text-3xl font-bold text-foreground font-mono tracking-tighter leading-none">
                {m.value > 0 ? m.value.toFixed(2) : `${m.value}%`}
              </p>
            </motion.div>
          )
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <SectionPanel className="relative overflow-hidden">
          <GlowOrb className="w-40 h-40 -bottom-20 -left-20 bg-chart-2/6" />
          <SectionHeader title="Volatility Comparison" subtitle="Portfolio vs Market (annualized)" />
          <div className="h-60">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={volatilityData} margin={{ top: 5, right: 5, bottom: 0, left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={C.grid} vertical={false} />
                <XAxis dataKey="month" tick={{ fontSize: 11, fill: C.tick }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: C.tick }} axisLine={false} tickLine={false} tickFormatter={(v: number) => `${v}%`} />
                <Tooltip content={<ChartTooltipContent />} />
                <Line type="monotone" dataKey="portfolio" name="portfolio" stroke={C.teal} strokeWidth={2.5} dot={false} animationDuration={1100} />
                <Line type="monotone" dataKey="market" name="market" stroke={C.rose} strokeWidth={2} dot={false} strokeDasharray="6 3" animationDuration={1100} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </SectionPanel>

        <SectionPanel>
          <SectionHeader title="Sector Exposure" subtitle="Concentration risk by sector" />
          <div className="h-60">
            <ResponsiveContainer width="100%" height="100%">
              <RadialBarChart cx="50%" cy="50%" innerRadius="20%" outerRadius="90%" data={sectorExposure} startAngle={180} endAngle={0}>
                <RadialBar dataKey="value" cornerRadius={8} animationDuration={1100} label={false} background={{ fill: C.surface }} />
                <Tooltip content={<ChartTooltipContent />} />
              </RadialBarChart>
            </ResponsiveContainer>
          </div>
          <div className="flex flex-wrap gap-x-5 gap-y-2 mt-3">
            {sectorExposure.map((s, i) => (
              <div key={i} className="flex items-center gap-2 text-xs">
                <div className="size-2.5 rounded-full" style={{ backgroundColor: s.fill }} />
                <span className="text-muted-foreground font-sans">{s.name}</span>
                <span className="font-mono font-bold text-foreground">{s.value}%</span>
              </div>
            ))}
          </div>
        </SectionPanel>
      </div>

      <SectionPanel>
        <SectionHeader title="Risk Score Overview" subtitle="Aggregated risk dimensions" />
        <div className="flex flex-col gap-5">
          {[
            { label: "Overall Risk", score: 42, category: "Moderate" },
            { label: "Concentration Risk", score: 58, category: "Elevated" },
            { label: "Liquidity Risk", score: 22, category: "Low" },
            { label: "Currency Risk", score: 35, category: "Moderate" },
          ].map((item, i) => (
            <div key={i} className="flex items-center gap-4">
              <span className="text-xs text-muted-foreground font-sans font-medium w-36 shrink-0">{item.label}</span>
              <div className="flex-1 h-2.5 rounded-full bg-muted/60 overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${item.score}%` }}
                  transition={{ duration: 1, delay: 0.3 + i * 0.1, ease: EASE_OUT }}
                  className="h-full rounded-full"
                  style={{ background: item.score <= 30 ? C.gain : item.score <= 50 ? C.amber : C.rose }}
                />
              </div>
              <span className="text-xs font-semibold text-foreground w-20 text-right font-sans">{item.category}</span>
            </div>
          ))}
        </div>
      </SectionPanel>
    </div>
  )
}

// ─── Section: Transactions ──────────────────────────────────────

function TransactionsSection() {
  return (
    <div className={`flex flex-col gap-5 ${SECTION_MIN_H}`}>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-4">
        <KpiCard label="Total Volume" value="47,714" prefix="$" delay={0} icon={DollarSign} />
        <KpiCard label="Transactions" value="8" delay={0.06} icon={ArrowLeftRight} />
        <KpiCard label="Avg. Size" value="5,964" prefix="$" delay={0.12} icon={BarChart3} />
        <KpiCard label="Buy/Sell Ratio" value="5:3" delay={0.18} icon={Activity} />
      </div>

      <SectionPanel className="!p-0 overflow-hidden">
        <div className="p-5 lg:p-6 border-b border-border/50">
          <SectionHeader title="Recent Transactions" subtitle="Latest activity across all accounts" />
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border/50">
                <th className="text-left p-4 text-[11px] font-semibold text-muted-foreground uppercase tracking-[0.08em] font-sans">Type</th>
                <th className="text-left p-4 text-[11px] font-semibold text-muted-foreground uppercase tracking-[0.08em] font-sans">Asset</th>
                <th className="text-right p-4 text-[11px] font-semibold text-muted-foreground uppercase tracking-[0.08em] font-sans hidden sm:table-cell">Shares</th>
                <th className="text-right p-4 text-[11px] font-semibold text-muted-foreground uppercase tracking-[0.08em] font-sans hidden md:table-cell">Price</th>
                <th className="text-right p-4 text-[11px] font-semibold text-muted-foreground uppercase tracking-[0.08em] font-sans">Total</th>
                <th className="text-right p-4 text-[11px] font-semibold text-muted-foreground uppercase tracking-[0.08em] font-sans hidden lg:table-cell">Date</th>
              </tr>
            </thead>
            <tbody>
              {transactions.map((tx, i) => (
                <motion.tr
                  key={tx.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.35, delay: 0.15 + i * 0.04 }}
                  className="border-b border-border/30 hover:bg-accent/20 transition-all duration-200"
                >
                  <td className="p-4">
                    <span className={`inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-1 rounded-lg ${tx.type === "buy" ? "bg-fin-gain/10 text-fin-gain" : "bg-fin-loss/10 text-fin-loss"}`}>
                      {tx.type === "buy" ? <ArrowDownRight className="size-3" /> : <ArrowUpRight className="size-3" />}
                      {tx.type.toUpperCase()}
                    </span>
                  </td>
                  <td className="p-4"><span className="font-bold font-mono text-foreground text-sm">{tx.asset}</span></td>
                  <td className="p-4 text-right font-mono text-muted-foreground hidden sm:table-cell">{tx.shares}</td>
                  <td className="p-4 text-right font-mono text-muted-foreground hidden md:table-cell">${tx.price.toFixed(2)}</td>
                  <td className="p-4 text-right font-mono font-bold text-foreground">${tx.total.toLocaleString("en-US", { minimumFractionDigits: 2 })}</td>
                  <td className="p-4 text-right text-xs text-muted-foreground hidden lg:table-cell font-mono">{tx.date} <span className="text-muted-foreground/50">{tx.time}</span></td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>
      </SectionPanel>
    </div>
  )
}

// ─── Section: Market ────────────────────────────────────────────

function MarketSection() {
  return (
    <div className={`flex flex-col gap-5 ${SECTION_MIN_H}`}>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-4">
        {marketIndices.map((idx, i) => (
          <motion.div
            key={idx.name}
            initial={{ opacity: 0, y: 16, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.5, delay: i * 0.06, ease: EASE_OUT }}
            className="rounded-2xl surface-card p-4 lg:p-5 hover:scale-[1.01] transition-transform duration-300"
            style={{ boxShadow: CARD_SHADOW }}
          >
            <div className="flex items-center justify-between mb-2">
              <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-[0.06em] font-sans">{idx.name}</p>
              <div className={`flex items-center gap-0.5 text-[11px] font-bold font-mono px-1.5 py-0.5 rounded-md ${idx.change >= 0 ? "text-fin-gain bg-fin-gain/8" : "text-fin-loss bg-fin-loss/8"}`}>
                {idx.change >= 0 ? <ArrowUpRight className="size-3" /> : <ArrowDownRight className="size-3" />}
                {idx.change > 0 ? "+" : ""}{idx.change}%
              </div>
            </div>
            <p className="text-xl font-bold font-mono text-foreground mb-3 tracking-tight">{idx.value}</p>
            <MiniSparkline data={idx.data} color={idx.change >= 0 ? C.gain : C.rose} height={36} />
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <SectionPanel>
          <SectionHeader title="Top Movers" subtitle="Today's biggest changes" />
          <div className="flex flex-col gap-2.5">
            {topMovers.map((stock, i) => (
              <motion.div
                key={stock.ticker}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.35, delay: 0.15 + i * 0.05 }}
                className="flex items-center justify-between p-3.5 rounded-xl bg-muted/30 hover:bg-muted/50 transition-all duration-200 group"
              >
                <div className="flex items-center gap-3.5">
                  <div className="size-9 rounded-xl bg-accent/60 flex items-center justify-center group-hover:bg-accent transition-colors">
                    <span className="text-xs font-bold text-foreground font-mono">{stock.ticker.slice(0, 2)}</span>
                  </div>
                  <div>
                    <p className="text-sm font-bold text-foreground font-mono">{stock.ticker}</p>
                    <p className="text-[11px] text-muted-foreground font-sans">{stock.name}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-mono font-bold text-foreground">${stock.price.toFixed(2)}</p>
                  <p className={`text-[11px] font-mono font-bold ${stock.change >= 0 ? "text-fin-gain" : "text-fin-loss"}`}>
                    {stock.change > 0 ? "+" : ""}{stock.change}%
                  </p>
                </div>
              </motion.div>
            ))}
          </div>
        </SectionPanel>

        <SectionPanel>
          <SectionHeader title="Market Sentiment" subtitle="Aggregated indicators" />
          <div className="flex flex-col gap-6">
            {[
              { label: "Fear & Greed Index", value: 68, display: "68 — Greed", color: C.gain },
              { label: "VIX (Volatility)", value: 35, display: "14.2", color: C.amber },
              { label: "Put/Call Ratio", value: 45, display: "0.82", color: C.azure },
              { label: "Advance/Decline", value: 72, display: "1.84", color: C.teal },
              { label: "New Highs/Lows", value: 62, display: "3.21", color: C.amber },
            ].map((item, i) => (
              <div key={i}>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs text-muted-foreground font-sans font-medium">{item.label}</span>
                  <span className="text-xs font-mono font-bold text-foreground">{item.display}</span>
                </div>
                <div className="h-2 rounded-full bg-muted/60 overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${item.value}%` }}
                    transition={{ duration: 1, delay: 0.2 + i * 0.1, ease: EASE_OUT }}
                    className="h-full rounded-full"
                    style={{ background: item.color }}
                  />
                </div>
              </div>
            ))}
          </div>
        </SectionPanel>
      </div>
    </div>
  )
}

// ─── Section: Watchlist ─────────────────────────────────────────

function WatchlistSection() {
  return (
    <div className={`flex flex-col gap-5 ${SECTION_MIN_H}`}>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-4">
        <KpiCard label="Watchlist Items" value="8" delay={0} icon={Eye} />
        <KpiCard label="Avg. Change" value="1.08" suffix="%" change={1.08} delay={0.06} icon={TrendingUp} />
        <KpiCard label="Top Gainer" value="SMCI" delay={0.12} icon={ArrowUpRight} />
        <KpiCard label="Top Loser" value="TSLA" delay={0.18} icon={ArrowDownRight} />
      </div>

      <SectionPanel className="!p-0 overflow-hidden">
        <div className="p-5 lg:p-6 border-b border-border/50 flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-foreground tracking-tight font-display">Your Watchlist</h3>
            <p className="text-[11px] text-muted-foreground mt-0.5 font-sans">Track your favorite assets</p>
          </div>
          <button className="flex items-center gap-1.5 text-xs font-bold text-primary hover:text-primary/80 transition-colors px-3.5 py-2 rounded-xl bg-primary/8 hover:bg-primary/12 font-sans">
            <Plus className="size-3.5" />Add Asset
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border/50">
                <th className="text-left p-4 text-[11px] font-semibold text-muted-foreground uppercase tracking-[0.08em] font-sans">Asset</th>
                <th className="text-right p-4 text-[11px] font-semibold text-muted-foreground uppercase tracking-[0.08em] font-sans">Price</th>
                <th className="text-right p-4 text-[11px] font-semibold text-muted-foreground uppercase tracking-[0.08em] font-sans">Change</th>
                <th className="text-right p-4 text-[11px] font-semibold text-muted-foreground uppercase tracking-[0.08em] font-sans hidden md:table-cell">Volume</th>
                <th className="text-right p-4 text-[11px] font-semibold text-muted-foreground uppercase tracking-[0.08em] font-sans hidden lg:table-cell">P/E</th>
                <th className="text-right p-4 text-[11px] font-semibold text-muted-foreground uppercase tracking-[0.08em] font-sans hidden lg:table-cell">Mkt Cap</th>
                <th className="text-center p-4 text-[11px] font-semibold text-muted-foreground uppercase tracking-[0.08em] font-sans hidden sm:table-cell w-28">Trend</th>
              </tr>
            </thead>
            <tbody>
              {watchlistItems.map((item, i) => (
                <motion.tr
                  key={item.ticker}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.35, delay: 0.15 + i * 0.04 }}
                  className="border-b border-border/30 hover:bg-accent/20 transition-all duration-200"
                >
                  <td className="p-4">
                    <div className="flex items-center gap-3.5">
                      <div className="size-9 rounded-xl bg-accent/60 flex items-center justify-center shrink-0">
                        <span className="text-xs font-bold text-foreground font-mono">{item.ticker.slice(0, 2)}</span>
                      </div>
                      <div>
                        <p className="text-sm font-bold font-mono text-foreground">{item.ticker}</p>
                        <p className="text-[11px] text-muted-foreground hidden sm:block font-sans">{item.name}</p>
                      </div>
                    </div>
                  </td>
                  <td className="p-4 text-right font-mono font-bold text-foreground">${item.price.toFixed(2)}</td>
                  <td className="p-4 text-right">
                    <span className={`inline-flex items-center gap-0.5 text-[11px] font-mono font-bold px-1.5 py-0.5 rounded-md ${item.change >= 0 ? "text-fin-gain bg-fin-gain/8" : "text-fin-loss bg-fin-loss/8"}`}>
                      {item.change >= 0 ? <ArrowUpRight className="size-3" /> : <ArrowDownRight className="size-3" />}
                      {item.change > 0 ? "+" : ""}{item.change}%
                    </span>
                  </td>
                  <td className="p-4 text-right text-xs font-mono text-muted-foreground hidden md:table-cell">{item.volume}</td>
                  <td className="p-4 text-right text-xs font-mono text-muted-foreground hidden lg:table-cell">{item.pe}</td>
                  <td className="p-4 text-right text-xs font-mono text-muted-foreground hidden lg:table-cell">{item.marketCap}</td>
                  <td className="p-4 hidden sm:table-cell w-28">
                    <MiniSparkline data={item.data} color={item.change >= 0 ? C.gain : C.rose} height={24} />
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>
      </SectionPanel>
    </div>
  )
}

// ─── Section: Reports ───────────────────────────────────────────

function ReportsSection() {
  return (
    <div className={`flex flex-col gap-5 ${SECTION_MIN_H}`}>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-4">
        <KpiCard label="Total Reports" value="8" delay={0} icon={FileText} />
        <KpiCard label="Generated This Month" value="5" delay={0.06} icon={Calendar} />
        <KpiCard label="Total Dividends" value="2,330" prefix="$" delay={0.12} icon={DollarSign} />
        <KpiCard label="Avg. Income/Mo" value="612" prefix="$" change={8.4} delay={0.18} icon={TrendingUp} />
      </div>

      <SectionPanel className="relative overflow-hidden">
        <GlowOrb className="w-48 h-48 -top-24 -right-24 bg-primary/6" />
        <SectionHeader title="Income Breakdown" subtitle="Dividends, interest, and other income sources">
          <div className="flex items-center gap-5 text-[11px]">
            <div className="flex items-center gap-2"><div className="size-2.5 rounded-full" style={{ background: C.teal }} /><span className="text-muted-foreground font-sans">Dividends</span></div>
            <div className="flex items-center gap-2"><div className="size-2.5 rounded-full" style={{ background: C.azure }} /><span className="text-muted-foreground font-sans">Interest</span></div>
            <div className="flex items-center gap-2"><div className="size-2.5 rounded-full" style={{ background: C.amber }} /><span className="text-muted-foreground font-sans">Other</span></div>
          </div>
        </SectionHeader>
        <div className="h-60">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={incomeByMonth} margin={{ top: 5, right: 5, bottom: 0, left: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={C.grid} vertical={false} />
              <XAxis dataKey="month" tick={{ fontSize: 11, fill: C.tick }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: C.tick }} axisLine={false} tickLine={false} tickFormatter={(v: number) => `$${v}`} />
              <Tooltip content={<ChartTooltipContent />} />
              <Bar dataKey="dividends" name="dividends" stackId="income" fill={C.teal} animationDuration={900} />
              <Bar dataKey="interest" name="interest" stackId="income" fill={C.azure} animationDuration={900} />
              <Bar dataKey="other" name="other" stackId="income" fill={C.amber} radius={[6, 6, 0, 0]} animationDuration={900} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </SectionPanel>

      <SectionPanel className="!p-0 overflow-hidden">
        <div className="p-5 lg:p-6 border-b border-border/50 flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-foreground tracking-tight font-display">Available Reports</h3>
            <p className="text-[11px] text-muted-foreground mt-0.5 font-sans">Download or generate new financial reports</p>
          </div>
          <div className="flex items-center gap-2">
            <button className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors px-3 py-2 rounded-xl surface-card hover:bg-accent/50 font-sans">
              <Filter className="size-3.5" />Filter
            </button>
            <button className="flex items-center gap-1.5 text-xs font-bold text-primary hover:text-primary/80 transition-colors px-3.5 py-2 rounded-xl bg-primary/8 hover:bg-primary/12 font-sans">
              <Plus className="size-3.5" />Generate
            </button>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border/50">
                <th className="text-left p-4 text-[11px] font-semibold text-muted-foreground uppercase tracking-[0.08em] font-sans">Report</th>
                <th className="text-left p-4 text-[11px] font-semibold text-muted-foreground uppercase tracking-[0.08em] font-sans hidden sm:table-cell">Type</th>
                <th className="text-left p-4 text-[11px] font-semibold text-muted-foreground uppercase tracking-[0.08em] font-sans hidden md:table-cell">Date</th>
                <th className="text-left p-4 text-[11px] font-semibold text-muted-foreground uppercase tracking-[0.08em] font-sans hidden lg:table-cell">Size</th>
                <th className="text-center p-4 text-[11px] font-semibold text-muted-foreground uppercase tracking-[0.08em] font-sans">Status</th>
                <th className="text-center p-4 text-[11px] font-semibold text-muted-foreground uppercase tracking-[0.08em] font-sans">Action</th>
              </tr>
            </thead>
            <tbody>
              {reportsData.map((report, i) => (
                <motion.tr
                  key={report.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.35, delay: 0.2 + i * 0.04 }}
                  className="border-b border-border/30 hover:bg-accent/20 transition-all duration-200"
                >
                  <td className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="size-8 rounded-lg bg-accent/40 flex items-center justify-center shrink-0"><FileText className="size-4 text-muted-foreground" /></div>
                      <span className="text-[13px] font-semibold text-foreground truncate max-w-64 font-sans">{report.name}</span>
                    </div>
                  </td>
                  <td className="p-4 hidden sm:table-cell">
                    <span className="text-[11px] text-muted-foreground bg-muted/40 px-2.5 py-1 rounded-lg font-medium font-sans">{report.type}</span>
                  </td>
                  <td className="p-4 text-xs font-mono text-muted-foreground hidden md:table-cell">{report.date}</td>
                  <td className="p-4 text-xs font-mono text-muted-foreground hidden lg:table-cell">{report.size}</td>
                  <td className="p-4 text-center">
                    {report.status === "ready" ? (
                      <span className="inline-flex items-center gap-1 text-[11px] font-bold text-fin-gain bg-fin-gain/8 px-2.5 py-1 rounded-lg"><Check className="size-3" />Ready</span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 text-[11px] font-bold text-chart-3 bg-chart-3/8 px-2.5 py-1 rounded-lg"><div className="size-2 rounded-full bg-chart-3 animate-pulse" />Generating</span>
                    )}
                  </td>
                  <td className="p-4 text-center">
                    <button disabled={report.status !== "ready"} className="p-2 rounded-lg hover:bg-accent transition-colors disabled:opacity-25 disabled:cursor-not-allowed" aria-label={`Download ${report.name}`}>
                      <Download className="size-4 text-muted-foreground" />
                    </button>
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>
      </SectionPanel>
    </div>
  )
}

// ─── Section: Settings ──────────────────────────────────────────

function SettingsSection() {
  const [activeTab, setActiveTab] = useState("profile")
  const tabs = [
    { id: "profile", label: "Profile", icon: UserCog },
    { id: "notifications", label: "Notifications", icon: BellRing },
    { id: "security", label: "Security", icon: Lock },
    { id: "display", label: "Display", icon: Monitor },
    { id: "billing", label: "Billing", icon: CreditCard },
  ]

  return (
    <div className={`flex flex-col gap-5 ${SECTION_MIN_H}`}>
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }} className="rounded-2xl surface-card p-5 lg:p-6 relative overflow-hidden" style={{ boxShadow: CARD_SHADOW }}>
        <GlowOrb className="w-48 h-48 -top-24 -right-24 bg-primary/6" />
        <h3 className="text-lg font-bold text-foreground font-display tracking-tight">Account Settings</h3>
        <p className="text-xs text-muted-foreground mt-1 font-sans">Manage your profile, preferences, and security</p>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-5">
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.1 }} className="rounded-2xl surface-card p-3.5 lg:col-span-1" style={{ boxShadow: CARD_SHADOW }}>
          <nav className="flex flex-col gap-1">
            {tabs.map((tab) => {
              const Icon = tab.icon
              return (
                <button key={tab.id} onClick={() => setActiveTab(tab.id)}
                  className={`relative flex items-center gap-3 px-3.5 py-3 rounded-xl text-sm font-semibold transition-all duration-200 w-full text-left font-sans ${
                    activeTab === tab.id ? "text-foreground bg-primary/8" : "text-muted-foreground hover:text-foreground hover:bg-accent/40"
                  }`}>
                  <Icon className="size-4" />{tab.label}
                  {activeTab === tab.id && <ChevronRight className="size-3.5 ml-auto text-primary" />}
                </button>
              )
            })}
            <div className="border-t border-border/50 my-2" />
            <button className="flex items-center gap-3 px-3.5 py-3 rounded-xl text-sm font-semibold text-fin-loss/70 hover:text-fin-loss hover:bg-fin-loss/5 transition-all duration-200 w-full text-left font-sans">
              <LogOut className="size-4" />Sign Out
            </button>
          </nav>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.2 }} className="rounded-2xl surface-card p-5 lg:p-7 lg:col-span-3" style={{ boxShadow: CARD_SHADOW }}>
          <AnimatePresence mode="wait">
            <motion.div key={activeTab} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.25 }}>
              {activeTab === "profile" && (
                <div className="flex flex-col gap-6">
                  <div><h4 className="text-sm font-bold text-foreground font-display">Personal Information</h4><p className="text-xs text-muted-foreground mt-0.5 font-sans">Update your personal details</p></div>
                  <div className="flex items-center gap-4">
                    <div className="size-16 rounded-2xl bg-primary/15 flex items-center justify-center glow-teal-sm"><span className="text-lg font-bold text-primary font-display">JD</span></div>
                    <div><p className="text-sm font-bold text-foreground font-display">John Doe</p><p className="text-xs text-muted-foreground font-sans">Premium Account</p></div>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {[
                      { label: "Full Name", value: "John Doe", icon: UserCog },
                      { label: "Email", value: "john.doe@meridian.io", icon: Mail },
                      { label: "Phone", value: "+1 (555) 123-4567", icon: HelpCircle },
                      { label: "Language", value: "English (US)", icon: Languages },
                    ].map((field, i) => (
                      <div key={i} className="flex flex-col gap-2">
                        <label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-[0.06em] font-sans">{field.label}</label>
                        <div className="flex items-center gap-2.5 bg-muted/30 rounded-xl px-4 py-3 border border-border/30">
                          <field.icon className="size-4 text-muted-foreground shrink-0" />
                          <span className="text-sm text-foreground font-sans">{field.value}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              {activeTab === "notifications" && (
                <div className="flex flex-col gap-6">
                  <div><h4 className="text-sm font-bold text-foreground font-display">Notification Preferences</h4><p className="text-xs text-muted-foreground mt-0.5 font-sans">Choose how you want to be notified</p></div>
                  {[
                    { label: "Price Alerts", desc: "Get notified when a stock hits your target price", enabled: true },
                    { label: "Trade Confirmations", desc: "Receive confirmation when orders are executed", enabled: true },
                    { label: "Portfolio Rebalance", desc: "Alerts when portfolio drifts from target allocation", enabled: true },
                    { label: "Dividend Payments", desc: "Notifications for incoming dividend payments", enabled: false },
                    { label: "Market News", desc: "Breaking news affecting your holdings", enabled: false },
                    { label: "Weekly Summary", desc: "Weekly performance recap sent via email", enabled: true },
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
                    { label: "Active Sessions", desc: "2 devices currently logged in", status: "Manage", statusColor: "text-primary" },
                    { label: "API Keys", desc: "3 active API keys", status: "View", statusColor: "text-primary" },
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
                    { label: "Currency", desc: "Default display currency", value: "USD ($)", icon: DollarSign },
                    { label: "Date Format", desc: "How dates are displayed", value: "YYYY-MM-DD", icon: Calendar },
                    { label: "Default Chart Type", desc: "Preferred chart visualization", value: "Area Chart", icon: BarChart3 },
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
              {activeTab === "billing" && (
                <div className="flex flex-col gap-6">
                  <div><h4 className="text-sm font-bold text-foreground font-display">Billing & Subscription</h4><p className="text-xs text-muted-foreground mt-0.5 font-sans">Manage your plan and payment methods</p></div>
                  <div className="rounded-xl bg-primary/6 border border-primary/15 p-5 flex items-center justify-between glow-teal-sm">
                    <div className="flex items-center gap-4">
                      <div className="size-12 rounded-xl bg-primary/12 flex items-center justify-center"><Star className="size-5 text-primary" /></div>
                      <div><p className="text-sm font-bold text-foreground font-display">Premium Plan</p><p className="text-xs text-muted-foreground font-sans">$29.99/month — Renews Mar 15, 2026</p></div>
                    </div>
                    <button className="text-xs font-bold text-primary hover:underline font-sans">Manage Plan</button>
                  </div>
                  <div className="flex flex-col gap-3">
                    <h5 className="text-[11px] font-semibold text-muted-foreground uppercase tracking-[0.08em] font-sans">Payment Method</h5>
                    <div className="flex items-center justify-between p-4 rounded-xl bg-muted/20 border border-border/30">
                      <div className="flex items-center gap-3.5">
                        <CreditCard className="size-4 text-muted-foreground" />
                        <div><p className="text-sm font-semibold text-foreground font-sans">Visa ending in 4242</p><p className="text-xs text-muted-foreground font-sans">Expires 12/2027</p></div>
                      </div>
                      <span className="text-xs font-bold text-primary">Update</span>
                    </div>
                  </div>
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        </motion.div>
      </div>
    </div>
  )
}

// ─── Main Dashboard ─────────────────────────────────────────────

const sectionComponents: Record<SectionId, React.FC> = {
  dashboard: DashboardSection,
  transactions: TransactionsSection,
  accounts: TransactionsSection,
  categories: TransactionsSection,
  settings: SettingsSection,
}

export default function FinancialAnalyticsDashboard() {
  const [activeSection, setActiveSection] = useState<SectionId>("dashboard")
  const [isTransitioning, setIsTransitioning] = useState(false)
  const [notificationsOpen, setNotificationsOpen] = useState(false)
  const [notifItems, setNotifItems] = useState(notifications)

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

  return (
    <div className="w-full min-h-screen bg-background text-foreground flex flex-col relative" style={{ boxShadow: CARD_SHADOW }}>
      {/* Atmospheric mesh gradient background */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute top-0 left-1/4 w-[600px] h-[600px] rounded-full opacity-[0.03] blur-[120px] animate-float" style={{ background: C.teal }} />
        <div className="absolute bottom-0 right-1/4 w-[500px] h-[500px] rounded-full opacity-[0.02] blur-[100px] animate-float" style={{ background: C.azure, animationDelay: "3s" }} />
      </div>

      {/* Header */}
      <header className="border-b border-border/60 bg-card/60 backdrop-blur-xl sticky top-0 z-30 relative">
        <div className="w-full px-5 lg:px-10 xl:px-14">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-4">
              <span className="text-base font-extrabold tracking-tight text-foreground font-display">Spendly</span>
            </div>
            <div className="flex items-center gap-1.5">
              <button className="p-2.5 rounded-xl hover:bg-accent/50 transition-all duration-200" aria-label="Search">
                <Search className="size-4 text-muted-foreground" />
              </button>
              <div className="relative">
                <button
                  onClick={() => setNotificationsOpen((prev) => !prev)}
                  className="p-2.5 rounded-xl hover:bg-accent/50 transition-all duration-200 relative"
                  aria-label="Notifications" aria-expanded={notificationsOpen}
                >
                  <Bell className="size-4 text-muted-foreground" />
                  {unreadCount > 0 && (
                    <motion.span initial={{ scale: 0 }} animate={{ scale: 1 }} transition={SPRING}
                      className="absolute -top-0.5 -right-0.5 size-5 rounded-full bg-primary text-primary-foreground text-[9px] font-bold flex items-center justify-center font-mono">
                      {unreadCount}
                    </motion.span>
                  )}
                </button>
                <NotificationPanel isOpen={notificationsOpen} onClose={() => setNotificationsOpen(false)} items={notifItems} onMarkRead={handleMarkRead} onMarkAllRead={handleMarkAllRead} />
              </div>
              <button className="p-2.5 rounded-xl hover:bg-accent/50 transition-all duration-200" aria-label="Settings" onClick={() => handleNavigation("settings")}>
                <Settings className="size-4 text-muted-foreground" />
              </button>
              <div className="size-9 rounded-xl bg-primary/12 flex items-center justify-center ml-1.5 glow-teal-sm cursor-pointer hover:bg-primary/18 transition-colors">
                <span className="text-xs font-bold text-primary font-display">JD</span>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Navigation */}
      <nav className="border-b border-border/40 bg-card/40 backdrop-blur-xl sticky top-16 z-20 relative">
        <div className="w-full px-5 lg:px-10 xl:px-14">
          <div className="flex items-center gap-0.5 overflow-x-auto py-1.5 -mb-px scrollbar-none">
            {NAV_ITEMS.map((item) => {
              const isActive = item.id === activeSection
              const Icon = item.icon
              return (
                <button key={item.id} onClick={() => handleNavigation(item.id)}
                  className={`relative flex items-center gap-2 px-4 py-2.5 text-[13px] font-semibold rounded-xl transition-all duration-250 whitespace-nowrap shrink-0 font-sans ${
                    isActive ? "text-foreground" : "text-muted-foreground hover:text-foreground hover:bg-accent/30"
                  }`}
                  aria-current={isActive ? "page" : undefined}
                >
                  <Icon className="size-4" />
                  <span>{item.label}</span>
                  {isActive && (
                    <motion.div layoutId="nav-indicator" className="absolute bottom-0 left-4 right-4 h-0.5 rounded-full bg-primary" style={{ boxShadow: `0 0 8px 2px rgb(91 77 199 / 0.3)` }} transition={SPRING} />
                  )}
                </button>
              )
            })}
          </div>
        </div>
      </nav>

      {/* Content */}
      <main className="w-full px-5 lg:px-10 xl:px-14 py-6 lg:py-8 flex-1 relative z-10">
        <AnimatePresence mode="wait">
          <motion.div key={activeSection}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: isTransitioning ? 0.3 : 1, y: isTransitioning ? 6 : 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.35, ease: EASE_OUT }}
          >
            <ActiveComponent />
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
