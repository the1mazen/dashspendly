"use client"

import React, { useState, useEffect, useRef, useMemo, useCallback, createContext, useContext } from "react"
import { motion, AnimatePresence } from "motion/react"
import {
  TrendingUp, ArrowDownLeft, ArrowUpRight, Plus, Landmark,
  Sparkles, CheckCircle2, ChevronRight,
  Sun, Moon, Film, VideoOff,
  Bell, Check, Trash2, Edit3, Settings, ShieldCheck, DollarSign, Wallet,
  CreditCard, ArrowLeftRight, PiggyBank, Search, BarChart3,
  LogOut, CircleDot, AlertCircle, Calendar, Receipt, ChevronDown, Clock, RefreshCw, UserCheck,
  AlertTriangle, RotateCcw, Lock, Eye, EyeOff
} from "lucide-react"
import {
  AreaChart, Area, LineChart, Line,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from "recharts"
import {
  useFinanceData,
  FinanceDataProvider,
  Transaction,
  Account,
  Category,
  HeldFund,
  HeldFundHistory,
  Bill
} from "@/lib/finance-data"
import { useUserProfile } from "@/lib/user-profile"
import { supabase, isSupabaseConfigured, resolveCurrentUserId } from "@/lib/supabase"

// ─── Design Tokens: Exact Reproduction of 2.jpeg ──────────────────

const TOKENS = {
  dark: {
    // Surface Mesh: Translucent 0.75 opacity showing video background faintly through each card
    cardGradient: "linear-gradient(135deg, rgba(45, 15, 85, 0.75) 0%, rgba(30, 94, 69, 0.65) 45%, rgba(145, 168, 38, 0.62) 100%)",
    cardGradientHover: "linear-gradient(135deg, rgba(55, 20, 100, 0.82) 0%, rgba(36, 110, 80, 0.72) 45%, rgba(160, 185, 45, 0.70) 100%)",
    
    // Wells & Translucent Cutouts
    nestedSurface: "rgba(16, 8, 36, 0.40)",
    incomeWell: "rgba(20, 50, 35, 0.50)",
    expenseWell: "rgba(55, 18, 35, 0.50)",
    savingsWell: "rgba(45, 52, 22, 0.50)",
    
    // Borders
    border: "rgba(255, 255, 255, 0.14)",
    borderNested: "rgba(255, 255, 255, 0.10)",
    borderIncome: "rgba(52, 211, 153, 0.25)",
    borderExpense: "rgba(251, 113, 133, 0.25)",
    borderSavings: "rgba(254, 240, 138, 0.25)",
    
    // Typography
    textPrimary: "#FFFFFF",
    textSecondary: "rgba(255, 255, 255, 0.75)",
    textTertiary: "rgba(255, 255, 255, 0.55)",
    
    // Status Colors
    gain: "#4ADE80", // Vibrant Neon Green
    loss: "#FB7185", // Neon Coral / Rose
    savingsRate: "#FEF08A", // Soft Chartreuse Yellow
    
    // Active Pill Gradients
    dashboardActivePill: "linear-gradient(90deg, #5EEAD4 0%, #A7F3D0 40%, #FEF08A 100%)",
    dashboardActiveText: "#120824",
    filterActivePill: "#EDE9FE",
    filterActiveText: "#1E0C38",
    
    // Progress Bar Gradient
    budgetProgressGradient: "linear-gradient(90deg, #06B6D4 0%, #22C55E 45%, #EAB308 80%, #FEF08A 100%)",
    
    // Header & Bars
    headerBg: "rgba(20, 8, 42, 0.75)",
    headerBorder: "rgba(255, 255, 255, 0.12)",
    
    // Chart
    chartStroke: "#FFFFFF",
    chartGrid: "rgba(255, 255, 255, 0.08)",
    
    cardShadow: "0 12px 40px 0 rgba(0, 0, 0, 0.45), inset 0 1px 0 0 rgba(255, 255, 255, 0.18)",
  },
  light: {
    // Exact same Deep Violet -> Emerald/Forest -> Chartreuse/Lime-Yellow gradient in subtle, low-opacity translucent glass
    cardGradient: "linear-gradient(135deg, rgba(45, 15, 85, 0.38) 0%, rgba(30, 94, 69, 0.30) 45%, rgba(145, 168, 38, 0.28) 100%)",
    cardGradientHover: "linear-gradient(135deg, rgba(55, 20, 100, 0.48) 0%, rgba(36, 110, 80, 0.38) 45%, rgba(160, 185, 45, 0.35) 100%)",
    
    // Translucent Cutouts & Wells
    nestedSurface: "rgba(20, 10, 42, 0.35)",
    incomeWell: "rgba(20, 50, 35, 0.42)",
    expenseWell: "rgba(55, 18, 35, 0.42)",
    savingsWell: "rgba(45, 52, 22, 0.42)",
    
    // Luminous Frosted Glass Borders
    border: "rgba(255, 255, 255, 0.25)",
    borderNested: "rgba(255, 255, 255, 0.14)",
    borderIncome: "rgba(52, 211, 153, 0.28)",
    borderExpense: "rgba(251, 113, 133, 0.28)",
    borderSavings: "rgba(254, 240, 138, 0.28)",
    
    // Typography
    textPrimary: "#FFFFFF",
    textSecondary: "rgba(255, 255, 255, 0.85)",
    textTertiary: "rgba(255, 255, 255, 0.65)",
    
    // Status Colors
    gain: "#4ADE80",
    loss: "#FB7185",
    savingsRate: "#FEF08A",
    
    // Active Pill Gradients
    dashboardActivePill: "linear-gradient(90deg, #5EEAD4 0%, #A7F3D0 40%, #FEF08A 100%)",
    dashboardActiveText: "#120824",
    filterActivePill: "#EDE9FE",
    filterActiveText: "#1E0C38",
    
    // Progress Bar Gradient
    budgetProgressGradient: "linear-gradient(90deg, #06B6D4 0%, #22C55E 45%, #EAB308 80%, #FEF08A 100%)",
    
    // Header & Bars
    headerBg: "rgba(28, 12, 54, 0.75)",
    headerBorder: "rgba(255, 255, 255, 0.18)",
    
    // Chart
    chartStroke: "#FFFFFF",
    chartGrid: "rgba(255, 255, 255, 0.12)",
    
    cardShadow: "0 16px 48px 0 rgba(0, 0, 0, 0.25), inset 0 1px 0 0 rgba(255, 255, 255, 0.30)",
  },
}

// ─── Theme Context ────────────────────────────────────────────────

interface DashboardThemeContextType {
  isDarkMode: boolean
  isVideoEnabled: boolean
  tokens: typeof TOKENS.dark
  toggleTheme: () => void
  toggleVideo: () => void
  setThemeMode: (mode: "dark" | "light") => void
}

const DashboardThemeContext = createContext<DashboardThemeContextType>({
  isDarkMode: true,
  isVideoEnabled: true,
  tokens: TOKENS.dark,
  toggleTheme: () => {},
  toggleVideo: () => {},
  setThemeMode: () => {},
})

const useDashboardTheme = () => useContext(DashboardThemeContext)

const EASE_OUT = [0.16, 1, 0.3, 1] as const

const cardEntrance = (delay = 0) => ({
  initial: { opacity: 0, y: 16, scale: 0.97 },
  animate: { opacity: 1, y: 0, scale: 1 },
  transition: { duration: 0.5, ease: EASE_OUT, delay },
})

// ─── Navigation Items ─────────────────────────────────────────────

const NAV_ITEMS = [
  { id: "dashboard", label: "Dashboard", icon: BarChart3 },
  { id: "bills", label: "Bills", icon: Receipt },
  { id: "accounts", label: "Accounts", icon: Landmark },
  { id: "categories", label: "Categories", icon: CircleDot },
  { id: "settings", label: "Settings", icon: Settings },
] as const

type SectionId = (typeof NAV_ITEMS)[number]["id"]

// ─── Atmospheric Background Component: Dual-Slot Cinematic Environment Transition ───

function AtmosphericBackground() {
  const { isDarkMode, isVideoEnabled } = useDashboardTheme()
  const [isDesktop, setIsDesktop] = useState(true)

  // Track viewport breakpoint
  useEffect(() => {
    const mediaQuery = window.matchMedia("(min-width: 768px)")
    setIsDesktop(mediaQuery.matches)

    const handleMediaChange = (e: MediaQueryListEvent) => {
      setIsDesktop(e.matches)
    }

    if (mediaQuery.addEventListener) {
      mediaQuery.addEventListener("change", handleMediaChange)
    } else {
      mediaQuery.addListener(handleMediaChange)
    }

    return () => {
      if (mediaQuery.removeEventListener) {
        mediaQuery.removeEventListener("change", handleMediaChange)
      } else {
        mediaQuery.removeListener(handleMediaChange)
      }
    }
  }, [])

  const device = isDesktop ? "Desktop" : "Phone"
  
  // Permanent assets for both themes (always mounted in DOM to prevent unmounting flash)
  const darkImage = `/backgrounds/${device}_Dark_Mode.png`
  const darkVideo = `/backgrounds/${device}_Dark_Mode.mp4`
  const lightImage = `/backgrounds/${device}_Light_Mode.png`
  const lightVideo = `/backgrounds/${device}_Light_Mode.mp4`

  const [darkVideoAwake, setDarkVideoAwake] = useState(false)
  const [lightVideoAwake, setLightVideoAwake] = useState(false)
  const isFirstMountRef = useRef(true)
  const timerRef = useRef<NodeJS.Timeout | null>(null)

  useEffect(() => {
    if (timerRef.current) clearTimeout(timerRef.current)

    if (isFirstMountRef.current) {
      isFirstMountRef.current = false
      if (isVideoEnabled) {
        setDarkVideoAwake(false)
        setLightVideoAwake(false)
        timerRef.current = setTimeout(() => {
          if (isDarkMode) setDarkVideoAwake(true)
          else setLightVideoAwake(true)
        }, 1000)
      }
      return
    }

    // When theme changes:
    // 1. Instantly hide video layer so the incoming PNG is held crystal clear
    setDarkVideoAwake(false)
    setLightVideoAwake(false)

    // 2. Hold incoming PNG for 1.0 second (1000ms)
    // 3. After 1.0 second, smoothly fade video in over the PNG
    if (isVideoEnabled) {
      timerRef.current = setTimeout(() => {
        if (isDarkMode) {
          setDarkVideoAwake(true)
          setLightVideoAwake(false)
        } else {
          setLightVideoAwake(true)
          setDarkVideoAwake(false)
        }
      }, 1000)
    }

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current)
    }
  }, [isDarkMode, isVideoEnabled, device])

  return (
    <div
      className="fixed inset-0 pointer-events-none z-0 overflow-hidden select-none"
      style={{
        backgroundColor: isDarkMode ? "#120824" : "#E9D5FF",
        transition: "background-color 800ms cubic-bezier(0.16, 1, 0.3, 1)",
      }}
    >
      {/* ─── SLOT 1: DARK MODE SCENE ─── */}
      <div
        className="absolute inset-0 w-full h-full will-change-transform"
        style={{
          opacity: isDarkMode ? 1 : 0,
          transform: isDarkMode ? "scale(1.0)" : "scale(1.04)",
          filter: isDarkMode ? "blur(0px)" : "blur(10px)",
          transition: "opacity 800ms cubic-bezier(0.16, 1, 0.3, 1), transform 800ms cubic-bezier(0.16, 1, 0.3, 1), filter 800ms cubic-bezier(0.16, 1, 0.3, 1)",
          zIndex: isDarkMode ? 2 : 1,
        }}
      >
        {/* Dark Mode Static PNG */}
        <img
          src={darkImage}
          alt=""
          aria-hidden="true"
          className="absolute inset-0 w-full h-full object-cover select-none pointer-events-none"
        />

        {/* Dark Mode Video (Awakens after 1s hold) */}
        {isVideoEnabled && (
          <video
            key={darkVideo}
            src={darkVideo}
            poster={darkImage}
            autoPlay
            muted
            loop
            playsInline
            disablePictureInPicture
            disableRemotePlayback
            className="absolute inset-0 w-full h-full object-cover select-none pointer-events-none"
            style={{
              opacity: darkVideoAwake ? 1 : 0,
              transition: "opacity 800ms cubic-bezier(0.4, 0, 0.2, 1)",
              pointerEvents: "none",
            }}
          />
        )}
      </div>

      {/* ─── SLOT 2: LIGHT MODE SCENE ─── */}
      <div
        className="absolute inset-0 w-full h-full will-change-transform"
        style={{
          opacity: !isDarkMode ? 1 : 0,
          transform: !isDarkMode ? "scale(1.0)" : "scale(1.04)",
          filter: !isDarkMode ? "blur(0px)" : "blur(10px)",
          transition: "opacity 800ms cubic-bezier(0.16, 1, 0.3, 1), transform 800ms cubic-bezier(0.16, 1, 0.3, 1), filter 800ms cubic-bezier(0.16, 1, 0.3, 1)",
          zIndex: !isDarkMode ? 2 : 1,
        }}
      >
        {/* Light Mode Static PNG */}
        <img
          src={lightImage}
          alt=""
          aria-hidden="true"
          className="absolute inset-0 w-full h-full object-cover select-none pointer-events-none"
        />

        {/* Light Mode Video (Awakens after 1s hold) */}
        {isVideoEnabled && (
          <video
            key={lightVideo}
            src={lightVideo}
            poster={lightImage}
            autoPlay
            muted
            loop
            playsInline
            disablePictureInPicture
            disableRemotePlayback
            className="absolute inset-0 w-full h-full object-cover select-none pointer-events-none"
            style={{
              opacity: lightVideoAwake ? 1 : 0,
              transition: "opacity 800ms cubic-bezier(0.4, 0, 0.2, 1)",
              pointerEvents: "none",
            }}
          />
        )}
      </div>

      {/* Atmospheric Glass Overlay */}
      <div className="absolute inset-0 bg-black/10 backdrop-blur-[0.5px] pointer-events-none z-10" />
    </div>
  )
}

// ─── Helpers: Visual Representation ───────────────────────────────

function getAccountVisual(type: string, name: string) {
  const lowerName = name.toLowerCase()
  if (lowerName.includes("qnb") || type === "checking") {
    return { label: "Checking Account", cycle: "30/30", fillRatio: 0.82 }
  }
  if (lowerName.includes("sdf") || type === "credit") {
    return { label: "Credit Card", cycle: "24/38", fillRatio: 0.65 }
  }
  if (lowerName.includes("cxv") || type === "savings") {
    return { label: "Checking Account", cycle: "30/30", fillRatio: 0.40 }
  }
  return { label: "Bank Account", cycle: "30/30", fillRatio: 0.70 }
}

function getCurrencySymbol(curr?: string) {
  if (!curr) return "EGP "
  const c = curr.toUpperCase()
  if (c === "EGP") return "EGP "
  if (c === "USD") return "$"
  if (c === "EUR") return "€"
  if (c === "GBP") return "£"
  if (c === "SAR") return "SAR "
  if (c === "AED") return "AED "
  return `${c} `
}

// ─── Component: Dot Matrix Indicator ──────────────────────────────

function DotMatrixIndicator({ progress, dotsCount = 8 }: { progress: number; dotsCount?: number }) {
  const activeCount = Math.round(progress * dotsCount)
  return (
    <div className="flex items-center gap-1">
      {Array.from({ length: dotsCount }).map((_, i) => (
        <span
          key={i}
          className="size-1.5 rounded-full transition-all duration-300"
          style={{
            backgroundColor: i < activeCount ? "#FEF08A" : "rgba(255, 255, 255, 0.2)",
            boxShadow: i < activeCount ? "0 0 6px rgba(254, 240, 138, 0.8)" : "none",
          }}
        />
      ))}
    </div>
  )
}

// ─── Component: Notification Panel ────────────────────────────────

interface NotificationItem {
  id: number | string
  type: "info" | "warning" | "success"
  title: string
  message: string
  time: string
  read: boolean
}

function NotificationPanel({
  isOpen,
  onClose,
  notifications,
  onMarkAsRead,
  onClearAll,
}: {
  isOpen: boolean
  onClose: () => void
  notifications: NotificationItem[]
  onMarkAsRead: (id: number | string) => void
  onClearAll: () => void
}) {
  const { tokens } = useDashboardTheme()

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-end p-4 pt-20 sm:pr-8 bg-black/40 backdrop-blur-sm">
      <div
        className="w-full max-w-sm rounded-3xl p-5 border shadow-2xl backdrop-blur-2xl transition-all"
        style={{
          background: tokens.cardGradient,
          borderColor: tokens.border,
          boxShadow: tokens.cardShadow,
        }}
      >
        <div className="flex items-center justify-between pb-3 border-b" style={{ borderColor: tokens.borderNested }}>
          <div className="flex items-center gap-2">
            <Bell className="size-4 text-white" />
            <h3 className="text-sm font-bold font-display text-white">Notifications</h3>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={onClearAll}
              className="text-[11px] font-semibold text-white/70 hover:text-white transition-colors cursor-pointer"
            >
              Clear all
            </button>
            <button
              onClick={onClose}
              className="text-xs text-white/60 hover:text-white p-1 cursor-pointer"
            >
              ✕
            </button>
          </div>
        </div>

        <div className="flex flex-col gap-2.5 mt-3 max-h-[360px] overflow-y-auto pr-1">
          {notifications.length === 0 ? (
            <p className="text-xs text-white/50 text-center py-6">No notifications</p>
          ) : (
            notifications.map((n) => (
              <div
                key={n.id}
                onClick={() => onMarkAsRead(n.id)}
                className="p-3 rounded-2xl border transition-all cursor-pointer hover:bg-white/5 relative"
                style={{
                  backgroundColor: n.read ? "rgba(16, 8, 36, 0.3)" : tokens.nestedSurface,
                  borderColor: tokens.borderNested,
                }}
              >
                {!n.read && (
                  <span className="absolute top-3 right-3 size-2 rounded-full bg-[#FEF08A] shadow-[0_0_8px_#FEF08A]" />
                )}
                <p className="text-xs font-bold text-white font-sans">{n.title}</p>
                <p className="text-[11px] text-white/70 font-sans mt-0.5">{n.message}</p>
                <p className="text-[9.5px] text-white/40 font-mono mt-1.5">{n.time}</p>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  )
}

// ─── Modal: Add Transaction (with Feature 1 Fee & InstaPay System) ────

function AddTransactionModal({
  isOpen,
  onClose,
}: {
  isOpen: boolean
  onClose: () => void
}) {
  const { accounts, categories, createTransaction } = useFinanceData()
  const { profile } = useUserProfile()
  const { tokens } = useDashboardTheme()
  const currencySymbol = getCurrencySymbol(profile.currency)

  const [newType, setNewType] = useState<"expense" | "income" | "transfer">("expense")
  const [newAmount, setNewAmount] = useState("")
  const [newAccountId, setNewAccountId] = useState("")
  const [newDestAccountId, setNewDestAccountId] = useState("")
  const [newCategoryId, setNewCategoryId] = useState("")
  const [newCustomCategory, setNewCustomCategory] = useState("")
  const [newDate, setNewDate] = useState(new Date().toISOString().split("T")[0])
  const [newNote, setNewNote] = useState("")
  
  // Feature 1: Optional Fee System & InstaPay Toggle
  const [feeMode, setFeeMode] = useState<"none" | "manual" | "instapay">("none")
  const [manualFeeType, setManualFeeType] = useState<"flat" | "percentage">("flat")
  const [manualFeeValue, setManualFeeValue] = useState("")

  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  useEffect(() => {
    if (accounts.length > 0 && !newAccountId) {
      setNewAccountId(accounts[0].id)
    }
  }, [accounts, newAccountId])

  // Live fee calculation
  const calculatedFeeAmount = useMemo(() => {
    const principal = parseFloat(newAmount) || 0
    if (principal <= 0) return 0

    if (feeMode === "instapay") {
      // Rule: 0.1% of transaction amount, minimum EGP 0.50, maximum EGP 20.00
      const rawFee = principal * 0.001
      return Math.min(20.0, Math.max(0.5, rawFee))
    }

    if (feeMode === "manual") {
      const val = parseFloat(manualFeeValue) || 0
      if (val <= 0) return 0
      if (manualFeeType === "percentage") {
        return (principal * val) / 100
      }
      return val
    }

    return 0
  }, [feeMode, manualFeeType, manualFeeValue, newAmount])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    setErrorMsg(null)

    try {
      const amt = parseFloat(newAmount)
      if (isNaN(amt) || amt <= 0) throw new Error("Please enter a valid amount.")
      if (!newAccountId) throw new Error("Please select an account.")

      await createTransaction({
        account_id: newAccountId,
        destination_account_id: newType === "transfer" ? newDestAccountId : undefined,
        category_id: newCategoryId === "custom" ? undefined : newCategoryId || undefined,
        category_name: newCategoryId === "custom" ? newCustomCategory : undefined,
        amount: amt,
        type: newType,
        note: newNote,
        date: newDate,
        fee_amount: calculatedFeeAmount > 0 ? calculatedFeeAmount : undefined,
        fee_type: feeMode === "none" ? undefined : (feeMode === "instapay" ? "instapay" : manualFeeType),
      })

      // Reset form
      setNewAmount("")
      setNewNote("")
      setNewCustomCategory("")
      setFeeMode("none")
      setManualFeeValue("")
      onClose()
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to record transaction.")
    } finally {
      setIsSubmitting(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="w-full max-w-lg rounded-3xl p-6 sm:p-7 border shadow-2xl backdrop-blur-2xl relative overflow-hidden max-h-[90vh] overflow-y-auto"
        style={{
          background: tokens.cardGradient,
          borderColor: tokens.border,
          boxShadow: tokens.cardShadow,
        }}
      >
        <div className="flex items-center justify-between pb-4 border-b" style={{ borderColor: tokens.border }}>
          <div>
            <h3 className="text-lg font-bold font-display text-white">Record Transaction</h3>
            <p className="text-xs font-sans text-white/70 mt-0.5">Post an expense, deposit, or account transfer</p>
          </div>
          <button
            onClick={onClose}
            className="size-8 rounded-full flex items-center justify-center bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer"
          >
            ✕
          </button>
        </div>

        {errorMsg && (
          <div className="mt-4 p-3 rounded-xl bg-red-500/20 border border-red-500/40 text-red-200 text-xs flex items-center gap-2">
            <AlertCircle className="size-4 shrink-0 text-red-400" />
            <span>{errorMsg}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-5 space-y-4">
          {/* Type Selector */}
          <div>
            <label className="text-[11px] font-semibold uppercase tracking-wider block mb-1.5 font-sans text-white/75">
              Type
            </label>
            <div className="grid grid-cols-3 gap-1.5 p-1 border rounded-xl" style={{ backgroundColor: tokens.nestedSurface, borderColor: tokens.borderNested }}>
              {(["expense", "income", "transfer"] as const).map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => {
                    setNewType(t)
                    if (t === "income") setFeeMode("none")
                  }}
                  className="py-2 rounded-lg text-xs font-semibold capitalize transition-all font-sans cursor-pointer"
                  style={{
                    background: newType === t ? tokens.dashboardActivePill : "transparent",
                    color: newType === t ? "#120824" : "rgba(255, 255, 255, 0.75)",
                    fontWeight: newType === t ? "bold" : "normal",
                  }}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* Amount */}
            <div>
              <label className="text-[11px] font-semibold uppercase tracking-wider block mb-1 font-sans text-white/75">
                Amount ({currencySymbol.trim()})
              </label>
              <input
                type="number"
                step="0.01"
                required
                placeholder="0.00"
                value={newAmount}
                onChange={(e) => setNewAmount(e.target.value)}
                className="w-full px-3.5 py-2.5 border rounded-xl text-sm font-mono text-white focus:outline-none transition-colors"
                style={{ backgroundColor: tokens.nestedSurface, borderColor: tokens.borderNested }}
              />
            </div>

            {/* Date */}
            <div>
              <label className="text-[11px] font-semibold uppercase tracking-wider block mb-1 font-sans text-white/75">
                Date
              </label>
              <input
                type="date"
                value={newDate}
                onChange={(e) => setNewDate(e.target.value)}
                className="w-full px-3.5 py-2.5 border rounded-xl text-sm font-sans text-white focus:outline-none transition-colors"
                style={{ backgroundColor: tokens.nestedSurface, borderColor: tokens.borderNested }}
              />
            </div>

            {/* Source Account */}
            <div>
              <label className="text-[11px] font-semibold uppercase tracking-wider block mb-1 font-sans text-white/75">
                {newType === "transfer" ? "From Account" : "Account"}
              </label>
              <select
                value={newAccountId}
                onChange={(e) => setNewAccountId(e.target.value)}
                required
                className="w-full px-3.5 py-2.5 border rounded-xl text-sm font-sans text-white focus:outline-none cursor-pointer"
                style={{ backgroundColor: tokens.nestedSurface, borderColor: tokens.borderNested }}
              >
                {accounts.map((acc) => (
                  <option key={acc.id} value={acc.id} className="bg-[#1E0C38] text-white">
                    {acc.name} ({currencySymbol}{Number(acc.balance || 0).toFixed(2)})
                  </option>
                ))}
              </select>
            </div>

            {/* Destination Account or Category */}
            {newType === "transfer" ? (
              <div>
                <label className="text-[11px] font-semibold uppercase tracking-wider block mb-1 font-sans text-white/75">
                  To Account
                </label>
                <select
                  value={newDestAccountId}
                  onChange={(e) => setNewDestAccountId(e.target.value)}
                  required
                  className="w-full px-3.5 py-2.5 border rounded-xl text-sm font-sans text-white focus:outline-none cursor-pointer"
                  style={{ backgroundColor: tokens.nestedSurface, borderColor: tokens.borderNested }}
                >
                  <option value="" className="bg-[#1E0C38] text-white">Select Destination</option>
                  {accounts.map((acc) => (
                    <option key={acc.id} value={acc.id} className="bg-[#1E0C38] text-white">
                      {acc.name} ({currencySymbol}{Number(acc.balance || 0).toFixed(2)})
                    </option>
                  ))}
                </select>
              </div>
            ) : (
              <div>
                <label className="text-[11px] font-semibold uppercase tracking-wider block mb-1 font-sans text-white/75">
                  Category
                </label>
                <select
                  value={newCategoryId}
                  onChange={(e) => setNewCategoryId(e.target.value)}
                  className="w-full px-3.5 py-2.5 border rounded-xl text-sm font-sans text-white focus:outline-none cursor-pointer"
                  style={{ backgroundColor: tokens.nestedSurface, borderColor: tokens.borderNested }}
                >
                  <option value="" className="bg-[#1E0C38] text-white">General / Uncategorized</option>
                  {categories.map((c) => (
                    <option key={c.id} value={c.id} className="bg-[#1E0C38] text-white">
                      {c.name}
                    </option>
                  ))}
                  <option value="custom" className="bg-[#1E0C38] text-[#A7F3D0]">+ Custom Category</option>
                </select>
              </div>
            )}
          </div>

          {newCategoryId === "custom" && newType !== "transfer" && (
            <div>
              <label className="text-[11px] font-semibold uppercase tracking-wider block mb-1 font-sans text-white/75">
                Custom Category Name
              </label>
              <input
                type="text"
                placeholder="e.g. Subscriptions, Groceries"
                value={newCustomCategory}
                onChange={(e) => setNewCustomCategory(e.target.value)}
                className="w-full px-3.5 py-2.5 border rounded-xl text-sm font-sans text-white focus:outline-none"
                style={{ backgroundColor: tokens.nestedSurface, borderColor: tokens.borderNested }}
              />
            </div>
          )}

          {/* Note / Description */}
          <div>
            <label className="text-[11px] font-semibold uppercase tracking-wider block mb-1 font-sans text-white/75">
              Description / Note
            </label>
            <input
              type="text"
              placeholder="e.g. Monthly cloud server, Dinner with friends"
              value={newNote}
              onChange={(e) => setNewNote(e.target.value)}
              className="w-full px-3.5 py-2.5 border rounded-xl text-sm font-sans text-white focus:outline-none"
              style={{ backgroundColor: tokens.nestedSurface, borderColor: tokens.borderNested }}
            />
          </div>

          {/* FEATURE 1: OPTIONAL FEE SYSTEM & INSTAPAY TOGGLE */}
          {(newType === "expense" || newType === "transfer") && (
            <div className="p-3.5 rounded-2xl border" style={{ backgroundColor: tokens.nestedSurface, borderColor: tokens.borderNested }}>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-white flex items-center gap-1.5">
                  <Receipt className="size-3.5 text-[#FEF08A]" />
                  Transaction Fee (Optional)
                </span>
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => setFeeMode("none")}
                    className="px-2 py-1 text-[10px] font-semibold rounded-md transition-all cursor-pointer"
                    style={{
                      backgroundColor: feeMode === "none" ? "rgba(255, 255, 255, 0.15)" : "transparent",
                      color: feeMode === "none" ? "#FFFFFF" : "rgba(255, 255, 255, 0.6)",
                    }}
                  >
                    No Fee
                  </button>
                  <button
                    type="button"
                    onClick={() => setFeeMode("manual")}
                    className="px-2 py-1 text-[10px] font-semibold rounded-md transition-all cursor-pointer"
                    style={{
                      backgroundColor: feeMode === "manual" ? "rgba(255, 255, 255, 0.15)" : "transparent",
                      color: feeMode === "manual" ? "#FFFFFF" : "rgba(255, 255, 255, 0.6)",
                    }}
                  >
                    Manual Fee
                  </button>
                  <button
                    type="button"
                    onClick={() => setFeeMode("instapay")}
                    className="px-2 py-1 text-[10px] font-semibold rounded-md transition-all cursor-pointer"
                    style={{
                      background: feeMode === "instapay" ? tokens.dashboardActivePill : "transparent",
                      color: feeMode === "instapay" ? "#120824" : "rgba(255, 255, 255, 0.6)",
                      fontWeight: feeMode === "instapay" ? "bold" : "normal",
                    }}
                  >
                    ⚡ InstaPay
                  </button>
                </div>
              </div>

              {feeMode === "manual" && (
                <div className="mt-2.5 pt-2.5 border-t border-white/10 flex flex-wrap items-center gap-2">
                  <div className="flex items-center rounded-lg border border-white/15 p-0.5 bg-black/20">
                    <button
                      type="button"
                      onClick={() => setManualFeeType("flat")}
                      className="px-2 py-1 text-[10px] font-semibold rounded-md cursor-pointer"
                      style={{
                        backgroundColor: manualFeeType === "flat" ? "rgba(255, 255, 255, 0.2)" : "transparent",
                        color: "#FFFFFF",
                      }}
                    >
                      Flat ({currencySymbol.trim()})
                    </button>
                    <button
                      type="button"
                      onClick={() => setManualFeeType("percentage")}
                      className="px-2 py-1 text-[10px] font-semibold rounded-md cursor-pointer"
                      style={{
                        backgroundColor: manualFeeType === "percentage" ? "rgba(255, 255, 255, 0.2)" : "transparent",
                        color: "#FFFFFF",
                      }}
                    >
                      % Percent
                    </button>
                  </div>

                  <input
                    type="number"
                    step="0.01"
                    placeholder={manualFeeType === "flat" ? "e.g. 5.00" : "e.g. 1.5"}
                    value={manualFeeValue}
                    onChange={(e) => setManualFeeValue(e.target.value)}
                    className="w-28 px-2.5 py-1.5 border rounded-lg text-xs font-mono text-white bg-black/20 focus:outline-none border-white/15"
                  />

                  {calculatedFeeAmount > 0 && (
                    <span className="text-xs font-mono font-bold text-[#FEF08A] ml-auto">
                      Fee: {currencySymbol}{calculatedFeeAmount.toFixed(2)}
                    </span>
                  )}
                </div>
              )}

              {feeMode === "instapay" && (
                <div className="mt-2.5 pt-2.5 border-t border-white/10 flex items-center justify-between">
                  <div>
                    <p className="text-[11px] font-semibold text-[#A7F3D0]">This is an InstaPay transaction</p>
                    <p className="text-[9.5px] text-white/60">0.1% rate • Min EGP 0.50 • Max EGP 20.00</p>
                  </div>
                  <div className="text-right">
                    <span className="text-xs font-mono font-bold text-[#FEF08A]">
                      +{currencySymbol}{calculatedFeeAmount.toFixed(2)}
                    </span>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t" style={{ borderColor: tokens.border }}>
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl text-xs font-semibold text-white/70 hover:text-white transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-6 py-2.5 rounded-xl text-xs font-bold transition-all font-sans shadow-lg cursor-pointer hover:scale-[1.02] text-[#120824] disabled:opacity-50"
              style={{ background: tokens.dashboardActivePill }}
            >
              {isSubmitting ? "Recording..." : "Save Transaction"}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  )
}

// ─── Modal: Edit Transaction (Feature 4) ──────────────────────────

function EditTransactionModal({
  transaction,
  isOpen,
  onClose,
}: {
  transaction: Transaction | null
  isOpen: boolean
  onClose: () => void
}) {
  const { accounts, categories, updateTransaction, transactions } = useFinanceData()
  const { profile } = useUserProfile()
  const { tokens } = useDashboardTheme()
  const currencySymbol = getCurrencySymbol(profile.currency)

  const [amount, setAmount] = useState("")
  const [date, setDate] = useState("")
  const [accountId, setAccountId] = useState("")
  const [categoryId, setCategoryId] = useState("")
  const [note, setNote] = useState("")
  const [type, setType] = useState<"income" | "expense">("expense")
  
  // Linked fee handling
  const [hasLinkedFee, setHasLinkedFee] = useState(false)
  const [feeAmount, setFeeAmount] = useState("")

  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  useEffect(() => {
    if (transaction) {
      setAmount(String(Math.abs(transaction.amount)))
      setDate(transaction.date || new Date().toISOString().split("T")[0])
      setAccountId(transaction.account_id)
      setCategoryId(transaction.category_id || "")
      setNote(transaction.note || transaction.description || "")
      setType(transaction.type)

      // Look for linked fee in transactions list
      if (transaction.fee_pair_id) {
        const feeRow = transactions.find(
          (t) => t.fee_pair_id === transaction.fee_pair_id && t.id !== transaction.id
        )
        if (feeRow) {
          setHasLinkedFee(true)
          setFeeAmount(String(feeRow.amount))
        } else {
          setHasLinkedFee(false)
          setFeeAmount("")
        }
      } else {
        setHasLinkedFee(false)
        setFeeAmount("")
      }
    }
  }, [transaction, transactions])

  if (!isOpen || !transaction) return null

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    setErrorMsg(null)

    try {
      const amt = parseFloat(amount)
      if (isNaN(amt) || amt <= 0) throw new Error("Please enter a valid amount.")
      if (!accountId) throw new Error("Please select an account.")

      await updateTransaction(transaction.id, {
        account_id: accountId,
        category_id: categoryId || undefined,
        amount: amt,
        type,
        note,
        date,
        linked_fee_amount: hasLinkedFee ? (parseFloat(feeAmount) || 0) : undefined,
      })

      onClose()
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to update transaction.")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="w-full max-w-lg rounded-3xl p-6 sm:p-7 border shadow-2xl backdrop-blur-2xl relative overflow-hidden"
        style={{
          background: tokens.cardGradient,
          borderColor: tokens.border,
          boxShadow: tokens.cardShadow,
        }}
      >
        <div className="flex items-center justify-between pb-4 border-b" style={{ borderColor: tokens.border }}>
          <div className="flex items-center gap-2">
            <Edit3 className="size-4.5 text-[#FEF08A]" />
            <h3 className="text-lg font-bold font-display text-white">Edit Transaction</h3>
          </div>
          <button
            onClick={onClose}
            className="size-8 rounded-full flex items-center justify-center bg-white/10 hover:bg-white/20 text-white cursor-pointer"
          >
            ✕
          </button>
        </div>

        {errorMsg && (
          <div className="mt-4 p-3 rounded-xl bg-red-500/20 border border-red-500/40 text-red-200 text-xs flex items-center gap-2">
            <AlertCircle className="size-4 shrink-0 text-red-400" />
            <span>{errorMsg}</span>
          </div>
        )}

        <form onSubmit={handleSave} className="mt-5 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-[11px] font-semibold uppercase tracking-wider block mb-1 font-sans text-white/75">
                Amount ({currencySymbol.trim()})
              </label>
              <input
                type="number"
                step="0.01"
                required
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="w-full px-3.5 py-2.5 border rounded-xl text-sm font-mono text-white focus:outline-none"
                style={{ backgroundColor: tokens.nestedSurface, borderColor: tokens.borderNested }}
              />
            </div>

            <div>
              <label className="text-[11px] font-semibold uppercase tracking-wider block mb-1 font-sans text-white/75">
                Date
              </label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full px-3.5 py-2.5 border rounded-xl text-sm font-sans text-white focus:outline-none"
                style={{ backgroundColor: tokens.nestedSurface, borderColor: tokens.borderNested }}
              />
            </div>

            <div>
              <label className="text-[11px] font-semibold uppercase tracking-wider block mb-1 font-sans text-white/75">
                Account
              </label>
              <select
                value={accountId}
                onChange={(e) => setAccountId(e.target.value)}
                className="w-full px-3.5 py-2.5 border rounded-xl text-sm font-sans text-white focus:outline-none"
                style={{ backgroundColor: tokens.nestedSurface, borderColor: tokens.borderNested }}
              >
                {accounts.map((acc) => (
                  <option key={acc.id} value={acc.id} className="bg-[#1E0C38] text-white">
                    {acc.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-[11px] font-semibold uppercase tracking-wider block mb-1 font-sans text-white/75">
                Category
              </label>
              <select
                value={categoryId}
                onChange={(e) => setCategoryId(e.target.value)}
                className="w-full px-3.5 py-2.5 border rounded-xl text-sm font-sans text-white focus:outline-none"
                style={{ backgroundColor: tokens.nestedSurface, borderColor: tokens.borderNested }}
              >
                <option value="" className="bg-[#1E0C38] text-white">General / Uncategorized</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id} className="bg-[#1E0C38] text-white">
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="text-[11px] font-semibold uppercase tracking-wider block mb-1 font-sans text-white/75">
              Description / Note
            </label>
            <input
              type="text"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              className="w-full px-3.5 py-2.5 border rounded-xl text-sm font-sans text-white focus:outline-none"
              style={{ backgroundColor: tokens.nestedSurface, borderColor: tokens.borderNested }}
            />
          </div>

          {/* Linked Fee Editor */}
          {hasLinkedFee && (
            <div className="p-3 rounded-2xl border bg-black/20" style={{ borderColor: tokens.borderNested }}>
              <label className="text-[11px] font-semibold text-[#FEF08A] block mb-1">
                Linked Fee Amount ({currencySymbol.trim()})
              </label>
              <input
                type="number"
                step="0.01"
                value={feeAmount}
                onChange={(e) => setFeeAmount(e.target.value)}
                className="w-full px-3 py-2 border rounded-xl text-sm font-mono text-white bg-black/30 border-white/15 focus:outline-none"
              />
            </div>
          )}

          <div className="flex items-center justify-end gap-3 pt-3 border-t" style={{ borderColor: tokens.border }}>
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl text-xs font-semibold text-white/70 hover:text-white cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-6 py-2.5 rounded-xl text-xs font-bold transition-all font-sans shadow-lg cursor-pointer text-[#120824]"
              style={{ background: tokens.dashboardActivePill }}
            >
              {isSubmitting ? "Saving..." : "Save Changes"}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  )
}

// ─── Modal: Delete Confirmation Dialog (Feature 4) ────────────────

function DeleteTransactionModal({
  transaction,
  isOpen,
  onClose,
}: {
  transaction: Transaction | null
  isOpen: boolean
  onClose: () => void
}) {
  const { deleteTransaction } = useFinanceData()
  const { tokens } = useDashboardTheme()
  const [isDeleting, setIsDeleting] = useState(false)

  if (!isOpen || !transaction) return null

  const handleDelete = async () => {
    setIsDeleting(true)
    try {
      await deleteTransaction(transaction.id)
      onClose()
    } catch (err) {
      console.error("Delete transaction error:", err)
    } finally {
      setIsDeleting(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-md rounded-3xl p-6 border shadow-2xl backdrop-blur-2xl text-center"
        style={{
          background: tokens.cardGradient,
          borderColor: tokens.border,
          boxShadow: tokens.cardShadow,
        }}
      >
        <div className="size-12 rounded-2xl bg-red-500/20 border border-red-500/40 text-red-400 flex items-center justify-center mx-auto mb-4">
          <Trash2 className="size-6" />
        </div>

        <h3 className="text-base font-bold text-white font-display">Delete Transaction?</h3>
        <p className="text-xs text-white/70 font-sans mt-2">
          This transaction will be permanently removed from your ledger.
          {transaction.fee_pair_id && " This will also delete the linked fee transaction."}
          {transaction.transfer_pair_id && " This will also delete both sides of the transfer."}
        </p>

        <div className="flex items-center justify-center gap-3 mt-6">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2.5 rounded-xl text-xs font-semibold text-white/75 hover:text-white bg-white/10 cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleDelete}
            disabled={isDeleting}
            className="px-6 py-2.5 rounded-xl text-xs font-bold bg-red-500 hover:bg-red-600 text-white transition-all shadow-lg cursor-pointer"
          >
            {isDeleting ? "Deleting..." : "Delete Permanently"}
          </button>
        </div>
      </motion.div>
    </div>
  )
}

// ─── Modal: Reset All User Data Confirmation ───────────────────────

function ResetDataModal({
  isOpen,
  onClose,
  onSuccess,
}: {
  isOpen: boolean
  onClose: () => void
  onSuccess?: () => void
}) {
  const { resetAllUserData } = useFinanceData()
  const { resetProfile } = useUserProfile()
  const { tokens } = useDashboardTheme()

  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [isResetting, setIsResetting] = useState(false)
  const [errorMessage, setErrorMessage] = useState("")
  const [successMessage, setSuccessMessage] = useState(false)

  if (!isOpen) return null

  const handleClose = () => {
    if (isResetting) return
    setPassword("")
    setShowPassword(false)
    setErrorMessage("")
    setSuccessMessage(false)
    onClose()
  }

  const handleConfirmReset = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!password.trim()) {
      setErrorMessage("Please enter your account password to confirm.")
      return
    }

    setIsResetting(true)
    setErrorMessage("")

    try {
      const result = await resetAllUserData(password)
      if (!result.success) {
        setErrorMessage(result.error || "Failed to reset data. Please check your password.")
        setIsResetting(false)
        return
      }

      await resetProfile()
      setSuccessMessage(true)
      setTimeout(() => {
        setIsResetting(false)
        handleClose()
        if (onSuccess) onSuccess()
      }, 1500)
    } catch (err: any) {
      setErrorMessage(err?.message || "An unexpected error occurred.")
      setIsResetting(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="w-full max-w-lg rounded-3xl p-6 sm:p-8 border shadow-2xl backdrop-blur-2xl text-left"
        style={{
          background: tokens.cardGradient,
          borderColor: "rgba(239, 68, 68, 0.4)",
          boxShadow: "0 25px 50px -12px rgba(239, 68, 68, 0.25)",
        }}
      >
        <div className="flex items-center gap-3.5 mb-5 pb-4 border-b" style={{ borderColor: tokens.borderNested }}>
          <div className="size-11 rounded-2xl bg-red-500/20 border border-red-500/40 text-red-400 flex items-center justify-center shrink-0 shadow-lg shadow-red-500/10">
            <AlertTriangle className="size-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-white font-display">Permanent Data Reset</h3>
            <p className="text-[11.5px] text-red-200/80 font-sans">This action will completely wipe your financial records</p>
          </div>
        </div>

        {successMessage ? (
          <div className="py-8 text-center space-y-3">
            <div className="size-14 rounded-full bg-emerald-500/20 border border-emerald-500/50 text-emerald-400 flex items-center justify-center mx-auto animate-pulse">
              <CheckCircle2 className="size-8" />
            </div>
            <h4 className="text-base font-bold text-white font-display">Data Reset Successfully!</h4>
            <p className="text-xs text-white/70">All your transactions, accounts, bills, and cloud data have been wiped cleanly.</p>
          </div>
        ) : (
          <form onSubmit={handleConfirmReset} className="space-y-4">
            <div className="p-3.5 rounded-2xl bg-red-950/40 border border-red-500/30 text-xs text-red-200/90 space-y-2">
              <div className="flex items-center gap-1.5 font-bold text-red-300">
                <AlertCircle className="size-4 shrink-0 text-red-400" />
                <span>The following data will be permanently deleted:</span>
              </div>
              <ul className="list-disc list-inside text-[11px] text-red-200/80 space-y-1 pl-1">
                <li>All Bank & Cash accounts, wallets, and balances</li>
                <li>All Income, Expense, Transfer & Fee transactions</li>
                <li>All Planned payments, upcoming bills, and recurring items</li>
                <li>All Held funds and deposit/withdrawal histories</li>
                <li>All Custom categories, budget targets, and profile settings</li>
              </ul>
            </div>

            {errorMessage && (
              <motion.div
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-3 rounded-xl bg-red-500/20 border border-red-500/50 text-xs text-red-200 flex items-center gap-2"
              >
                <AlertCircle className="size-4 text-red-400 shrink-0" />
                <span>{errorMessage}</span>
              </motion.div>
            )}

            <div className="space-y-1.5 pt-1">
              <label className="text-[11px] font-semibold uppercase tracking-wider block text-white/80">
                Enter your account password to confirm
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-white/40">
                  <Lock className="size-4" />
                </div>
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Account password"
                  autoFocus
                  disabled={isResetting}
                  className="w-full pl-10 pr-10 py-2.5 border rounded-xl text-sm text-white placeholder-white/40 focus:outline-none focus:ring-1 focus:ring-red-500 transition-all"
                  style={{
                    backgroundColor: tokens.nestedSurface,
                    borderColor: errorMessage ? "rgba(239, 68, 68, 0.6)" : tokens.borderNested,
                  }}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-white/50 hover:text-white transition-colors cursor-pointer"
                >
                  {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                </button>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-4 border-t" style={{ borderColor: tokens.borderNested }}>
              <button
                type="button"
                onClick={handleClose}
                disabled={isResetting}
                className="px-4 py-2.5 rounded-xl text-xs font-semibold text-white/75 hover:text-white bg-white/10 hover:bg-white/15 transition-colors cursor-pointer disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isResetting || !password.trim()}
                className="px-5 py-2.5 rounded-xl text-xs font-bold bg-red-600 hover:bg-red-700 text-white transition-all shadow-lg shadow-red-600/30 flex items-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isResetting ? (
                  <>
                    <RefreshCw className="size-3.5 animate-spin" />
                    <span>Resetting Data...</span>
                  </>
                ) : (
                  <>
                    <RotateCcw className="size-3.5" />
                    <span>Wipe & Reset Everything</span>
                  </>
                )}
              </button>
            </div>
          </form>
        )}
      </motion.div>
    </div>
  )
}

// ─── Modal: Add Account ───────────────────────────────────────────

function AddAccountModal({
  isOpen,
  onClose,
}: {
  isOpen: boolean
  onClose: () => void
}) {
  const { createAccount } = useFinanceData()
  const { profile } = useUserProfile()
  const { tokens } = useDashboardTheme()
  const currencySymbol = getCurrencySymbol(profile.currency)

  const [name, setName] = useState("")
  const [type, setType] = useState("checking")
  const [startingBalance, setStartingBalance] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)

  if (!isOpen) return null

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    try {
      await createAccount({
        name,
        type,
        starting_balance: parseFloat(startingBalance) || 0,
        currency: profile.currency || "EGP",
      })
      setName("")
      setStartingBalance("")
      onClose()
    } catch (err) {
      console.error(err)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-md rounded-3xl p-6 border shadow-2xl backdrop-blur-2xl"
        style={{
          background: tokens.cardGradient,
          borderColor: tokens.border,
          boxShadow: tokens.cardShadow,
        }}
      >
        <div className="flex items-center justify-between pb-4 border-b" style={{ borderColor: tokens.border }}>
          <h3 className="text-base font-bold font-display text-white">Create New Account</h3>
          <button onClick={onClose} className="text-white/60 hover:text-white cursor-pointer">✕</button>
        </div>

        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          <div>
            <label className="text-[11px] font-semibold uppercase tracking-wider block mb-1 text-white/75">
              Account Name
            </label>
            <input
              type="text"
              required
              placeholder="e.g. QNB Vault, CIB Credit Card"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3.5 py-2.5 border rounded-xl text-sm text-white focus:outline-none"
              style={{ backgroundColor: tokens.nestedSurface, borderColor: tokens.borderNested }}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[11px] font-semibold uppercase tracking-wider block mb-1 text-white/75">
                Type
              </label>
              <select
                value={type}
                onChange={(e) => setType(e.target.value)}
                className="w-full px-3.5 py-2.5 border rounded-xl text-sm text-white focus:outline-none"
                style={{ backgroundColor: tokens.nestedSurface, borderColor: tokens.borderNested }}
              >
                <option value="checking" className="bg-[#1E0C38] text-white">Checking</option>
                <option value="savings" className="bg-[#1E0C38] text-white">Savings</option>
                <option value="credit" className="bg-[#1E0C38] text-white">Credit Card</option>
                <option value="cash" className="bg-[#1E0C38] text-white">Cash / Wallet</option>
              </select>
            </div>

            <div>
              <label className="text-[11px] font-semibold uppercase tracking-wider block mb-1 text-white/75">
                Starting Balance ({currencySymbol.trim()})
              </label>
              <input
                type="number"
                step="0.01"
                placeholder="0.00"
                value={startingBalance}
                onChange={(e) => setStartingBalance(e.target.value)}
                className="w-full px-3.5 py-2.5 border rounded-xl text-sm font-mono text-white focus:outline-none"
                style={{ backgroundColor: tokens.nestedSurface, borderColor: tokens.borderNested }}
              />
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-3 border-t" style={{ borderColor: tokens.border }}>
            <button type="button" onClick={onClose} className="px-4 py-2 text-xs font-semibold text-white/70">
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-6 py-2.5 rounded-xl text-xs font-bold text-[#120824]"
              style={{ background: tokens.dashboardActivePill }}
            >
              {isSubmitting ? "Creating..." : "Create Account"}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  )
}

// ─── Modal: Add Held Fund (Feature 2) ──────────────────────────────

function AddHeldFundModal({
  isOpen,
  onClose,
}: {
  isOpen: boolean
  onClose: () => void
}) {
  const { accounts, createHeldFund } = useFinanceData()
  const { profile } = useUserProfile()
  const { tokens } = useDashboardTheme()
  const currencySymbol = getCurrencySymbol(profile.currency)

  const [name, setName] = useState("")
  const [type, setType] = useState<"person" | "fund">("fund")
  const [accountId, setAccountId] = useState("")
  const [initialBalance, setInitialBalance] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  useEffect(() => {
    if (accounts.length > 0 && !accountId) {
      setAccountId(accounts[0].id)
    }
  }, [accounts, accountId])

  if (!isOpen) return null

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    setErrorMsg(null)
    try {
      await createHeldFund({
        name,
        type,
        account_id: accountId,
        initial_balance: parseFloat(initialBalance) || 0,
      })
      setName("")
      setInitialBalance("")
      onClose()
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to create held fund.")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-md rounded-3xl p-6 border shadow-2xl backdrop-blur-2xl"
        style={{
          background: tokens.cardGradient,
          borderColor: tokens.border,
          boxShadow: tokens.cardShadow,
        }}
      >
        <div className="flex items-center justify-between pb-4 border-b" style={{ borderColor: tokens.border }}>
          <div>
            <h3 className="text-base font-bold font-display text-white">Create Held Fund</h3>
            <p className="text-xs text-white/70">Reserve a pot of money or track a personal balance</p>
          </div>
          <button onClick={onClose} className="text-white/60 hover:text-white cursor-pointer">✕</button>
        </div>

        {errorMsg && (
          <div className="mt-3 p-3 rounded-xl bg-red-500/20 border border-red-500/40 text-red-200 text-xs">
            {errorMsg}
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          <div>
            <label className="text-[11px] font-semibold uppercase tracking-wider block mb-1 text-white/75">
              Type
            </label>
            <div className="grid grid-cols-2 gap-2 p-1 border rounded-xl" style={{ backgroundColor: tokens.nestedSurface, borderColor: tokens.borderNested }}>
              <button
                type="button"
                onClick={() => setType("fund")}
                className="py-2 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 cursor-pointer"
                style={{
                  background: type === "fund" ? tokens.dashboardActivePill : "transparent",
                  color: type === "fund" ? "#120824" : "rgba(255, 255, 255, 0.75)",
                  fontWeight: type === "fund" ? "bold" : "normal",
                }}
              >
                <PiggyBank className="size-3.5" />
                <span>Saved Fund Pot</span>
              </button>
              <button
                type="button"
                onClick={() => setType("person")}
                className="py-2 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 cursor-pointer"
                style={{
                  background: type === "person" ? tokens.dashboardActivePill : "transparent",
                  color: type === "person" ? "#120824" : "rgba(255, 255, 255, 0.75)",
                  fontWeight: type === "person" ? "bold" : "normal",
                }}
              >
                <UserCheck className="size-3.5" />
                <span>Person</span>
              </button>
            </div>
          </div>

          <div>
            <label className="text-[11px] font-semibold uppercase tracking-wider block mb-1 text-white/75">
              Name
            </label>
            <input
              type="text"
              required
              placeholder={type === "person" ? "e.g. Omar, Ahmed" : "e.g. Vacation Pot, Emergency Buffer"}
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3.5 py-2.5 border rounded-xl text-sm text-white focus:outline-none"
              style={{ backgroundColor: tokens.nestedSurface, borderColor: tokens.borderNested }}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[11px] font-semibold uppercase tracking-wider block mb-1 text-white/75">
                Linked Account
              </label>
              <select
                value={accountId}
                onChange={(e) => setAccountId(e.target.value)}
                className="w-full px-3.5 py-2.5 border rounded-xl text-sm text-white focus:outline-none"
                style={{ backgroundColor: tokens.nestedSurface, borderColor: tokens.borderNested }}
              >
                {accounts.map((acc) => (
                  <option key={acc.id} value={acc.id} className="bg-[#1E0C38] text-white">
                    {acc.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-[11px] font-semibold uppercase tracking-wider block mb-1 text-white/75">
                Initial Allocation ({currencySymbol.trim()})
              </label>
              <input
                type="number"
                step="0.01"
                placeholder="0.00"
                value={initialBalance}
                onChange={(e) => setInitialBalance(e.target.value)}
                className="w-full px-3.5 py-2.5 border rounded-xl text-sm font-mono text-white focus:outline-none"
                style={{ backgroundColor: tokens.nestedSurface, borderColor: tokens.borderNested }}
              />
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-3 border-t" style={{ borderColor: tokens.border }}>
            <button type="button" onClick={onClose} className="px-4 py-2 text-xs font-semibold text-white/70">
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-6 py-2.5 rounded-xl text-xs font-bold text-[#120824]"
              style={{ background: tokens.dashboardActivePill }}
            >
              {isSubmitting ? "Creating..." : "Create Held Fund"}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  )
}

// ─── Modal: Deposit / Withdraw Held Fund (Feature 2) ──────────────

function DepositWithdrawHeldFundModal({
  heldFund,
  mode,
  isOpen,
  onClose,
}: {
  heldFund: HeldFund | null
  mode: "deposit" | "withdrawal"
  isOpen: boolean
  onClose: () => void
}) {
  const { depositToHeldFund, withdrawFromHeldFund } = useFinanceData()
  const { profile } = useUserProfile()
  const { tokens } = useDashboardTheme()
  const currencySymbol = getCurrencySymbol(profile.currency)

  const [amount, setAmount] = useState("")
  const [note, setNote] = useState("")
  const [date, setDate] = useState(new Date().toISOString().split("T")[0])
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  if (!isOpen || !heldFund) return null

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    setErrorMsg(null)
    try {
      const amt = parseFloat(amount)
      if (isNaN(amt) || amt <= 0) throw new Error("Please enter a valid amount.")

      if (mode === "deposit") {
        await depositToHeldFund(heldFund.id, amt, note, date)
      } else {
        await withdrawFromHeldFund(heldFund.id, amt, note, date)
      }
      setAmount("")
      setNote("")
      onClose()
    } catch (err: any) {
      setErrorMsg(err.message || `Failed to process ${mode}.`)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-md rounded-3xl p-6 border shadow-2xl backdrop-blur-2xl"
        style={{
          background: tokens.cardGradient,
          borderColor: tokens.border,
          boxShadow: tokens.cardShadow,
        }}
      >
        <div className="flex items-center justify-between pb-4 border-b" style={{ borderColor: tokens.border }}>
          <div>
            <h3 className="text-base font-bold font-display text-white">
              {mode === "deposit" ? "Deposit Into" : "Withdraw From"} {heldFund.name}
            </h3>
            <p className="text-xs text-white/70">
              {mode === "deposit"
                ? `Transfers funds from ${heldFund.account_name} into this held pot`
                : `Returns funds back to ${heldFund.account_name}`}
            </p>
          </div>
          <button onClick={onClose} className="text-white/60 hover:text-white cursor-pointer">✕</button>
        </div>

        {errorMsg && (
          <div className="mt-3 p-3 rounded-xl bg-red-500/20 border border-red-500/40 text-red-200 text-xs">
            {errorMsg}
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[11px] font-semibold uppercase tracking-wider block mb-1 text-white/75">
                Amount ({currencySymbol.trim()})
              </label>
              <input
                type="number"
                step="0.01"
                required
                placeholder="0.00"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="w-full px-3.5 py-2.5 border rounded-xl text-sm font-mono text-white focus:outline-none"
                style={{ backgroundColor: tokens.nestedSurface, borderColor: tokens.borderNested }}
              />
            </div>

            <div>
              <label className="text-[11px] font-semibold uppercase tracking-wider block mb-1 text-white/75">
                Date
              </label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full px-3.5 py-2.5 border rounded-xl text-sm font-sans text-white focus:outline-none"
                style={{ backgroundColor: tokens.nestedSurface, borderColor: tokens.borderNested }}
              />
            </div>
          </div>

          <div>
            <label className="text-[11px] font-semibold uppercase tracking-wider block mb-1 text-white/75">
              Note (Optional)
            </label>
            <input
              type="text"
              placeholder="e.g. Set aside salary bonus"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              className="w-full px-3.5 py-2.5 border rounded-xl text-sm text-white focus:outline-none"
              style={{ backgroundColor: tokens.nestedSurface, borderColor: tokens.borderNested }}
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-3 border-t" style={{ borderColor: tokens.border }}>
            <button type="button" onClick={onClose} className="px-4 py-2 text-xs font-semibold text-white/70">
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-6 py-2.5 rounded-xl text-xs font-bold text-[#120824]"
              style={{ background: tokens.dashboardActivePill }}
            >
              {isSubmitting ? "Processing..." : mode === "deposit" ? "Confirm Deposit" : "Confirm Withdrawal"}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  )
}

// ─── Modal: Add Bill (Feature 3) ──────────────────────────────────

function AddBillModal({
  isOpen,
  onClose,
}: {
  isOpen: boolean
  onClose: () => void
}) {
  const { accounts, categories, createBill } = useFinanceData()
  const { profile } = useUserProfile()
  const { tokens } = useDashboardTheme()
  const currencySymbol = getCurrencySymbol(profile.currency)

  const [name, setName] = useState("")
  const [type, setType] = useState<"expense" | "income" | "transfer">("expense")
  const [accountId, setAccountId] = useState("")
  const [destAccountId, setDestAccountId] = useState("")
  const [categoryId, setCategoryId] = useState("")
  const [amount, setAmount] = useState("")
  const [dueDate, setDueDate] = useState("")
  const [recurrence, setRecurrence] = useState<"one-off" | "daily" | "monthly" | "custom">("monthly")
  const [recurrenceDays, setRecurrenceDays] = useState("30")

  // Fee state
  const [feeMode, setFeeMode] = useState<"none" | "manual" | "instapay">("none")
  const [manualFeeType, setManualFeeType] = useState<"flat" | "percentage">("flat")
  const [manualFeeValue, setManualFeeValue] = useState("")

  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  useEffect(() => {
    if (accounts.length > 0 && !accountId) {
      setAccountId(accounts[0].id)
    }
  }, [accounts, accountId])

  const calculatedFeeAmount = useMemo(() => {
    const principal = parseFloat(amount) || 0
    if (principal <= 0) return 0
    if (feeMode === "instapay") {
      return Math.min(20.0, Math.max(0.5, principal * 0.001))
    }
    if (feeMode === "manual") {
      const val = parseFloat(manualFeeValue) || 0
      if (val <= 0) return 0
      return manualFeeType === "percentage" ? (principal * val) / 100 : val
    }
    return 0
  }, [feeMode, manualFeeType, manualFeeValue, amount])

  if (!isOpen) return null

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    setErrorMsg(null)

    try {
      const amt = parseFloat(amount)
      if (isNaN(amt) || amt <= 0) throw new Error("Please enter a valid bill amount.")
      if (!dueDate) throw new Error("Please select a due date.")

      await createBill({
        name,
        type,
        account_id: accountId,
        destination_account_id: type === "transfer" ? destAccountId : undefined,
        category_id: categoryId || undefined,
        amount: amt,
        fee_amount: calculatedFeeAmount > 0 ? calculatedFeeAmount : undefined,
        fee_type: feeMode === "none" ? undefined : (feeMode === "instapay" ? "instapay" : manualFeeType),
        due_date: dueDate,
        recurrence,
        recurrence_days: recurrence === "custom" ? (parseInt(recurrenceDays) || 30) : undefined,
      })

      setName("")
      setAmount("")
      setFeeMode("none")
      onClose()
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to create bill.")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-lg rounded-3xl p-6 sm:p-7 border shadow-2xl backdrop-blur-2xl max-h-[90vh] overflow-y-auto"
        style={{
          background: tokens.cardGradient,
          borderColor: tokens.border,
          boxShadow: tokens.cardShadow,
        }}
      >
        <div className="flex items-center justify-between pb-4 border-b" style={{ borderColor: tokens.border }}>
          <div>
            <h3 className="text-lg font-bold font-display text-white">Create New Bill</h3>
            <p className="text-xs text-white/70">Plan upcoming recurring obligations or planned incomes</p>
          </div>
          <button onClick={onClose} className="size-8 rounded-full flex items-center justify-center bg-white/10 hover:bg-white/20 text-white cursor-pointer">
            ✕
          </button>
        </div>

        {errorMsg && (
          <div className="mt-4 p-3 rounded-xl bg-red-500/20 border border-red-500/40 text-red-200 text-xs">
            {errorMsg}
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          <div>
            <label className="text-[11px] font-semibold uppercase tracking-wider block mb-1 text-white/75">
              Bill Name
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Internet & Cloud, Rent, Gym Membership"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3.5 py-2.5 border rounded-xl text-sm text-white focus:outline-none"
              style={{ backgroundColor: tokens.nestedSurface, borderColor: tokens.borderNested }}
            />
          </div>

          <div>
            <label className="text-[11px] font-semibold uppercase tracking-wider block mb-1.5 text-white/75">
              Type
            </label>
            <div className="grid grid-cols-3 gap-1.5 p-1 border rounded-xl" style={{ backgroundColor: tokens.nestedSurface, borderColor: tokens.borderNested }}>
              {(["expense", "income", "transfer"] as const).map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setType(t)}
                  className="py-2 rounded-lg text-xs font-semibold capitalize cursor-pointer"
                  style={{
                    background: type === t ? tokens.dashboardActivePill : "transparent",
                    color: type === t ? "#120824" : "rgba(255, 255, 255, 0.75)",
                    fontWeight: type === t ? "bold" : "normal",
                  }}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-[11px] font-semibold uppercase tracking-wider block mb-1 text-white/75">
                Amount ({currencySymbol.trim()})
              </label>
              <input
                type="number"
                step="0.01"
                required
                placeholder="0.00"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="w-full px-3.5 py-2.5 border rounded-xl text-sm font-mono text-white focus:outline-none"
                style={{ backgroundColor: tokens.nestedSurface, borderColor: tokens.borderNested }}
              />
            </div>

            <div>
              <label className="text-[11px] font-semibold uppercase tracking-wider block mb-1 text-white/75">
                Due Date
              </label>
              <input
                type="date"
                required
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="w-full px-3.5 py-2.5 border rounded-xl text-sm text-white focus:outline-none"
                style={{ backgroundColor: tokens.nestedSurface, borderColor: tokens.borderNested }}
              />
            </div>

            <div>
              <label className="text-[11px] font-semibold uppercase tracking-wider block mb-1 text-white/75">
                Account
              </label>
              <select
                value={accountId}
                onChange={(e) => setAccountId(e.target.value)}
                className="w-full px-3.5 py-2.5 border rounded-xl text-sm text-white focus:outline-none"
                style={{ backgroundColor: tokens.nestedSurface, borderColor: tokens.borderNested }}
              >
                {accounts.map((acc) => (
                  <option key={acc.id} value={acc.id} className="bg-[#1E0C38] text-white">
                    {acc.name}
                  </option>
                ))}
              </select>
            </div>

            {type === "transfer" ? (
              <div>
                <label className="text-[11px] font-semibold uppercase tracking-wider block mb-1 text-white/75">
                  Destination Account
                </label>
                <select
                  value={destAccountId}
                  onChange={(e) => setDestAccountId(e.target.value)}
                  className="w-full px-3.5 py-2.5 border rounded-xl text-sm text-white focus:outline-none"
                  style={{ backgroundColor: tokens.nestedSurface, borderColor: tokens.borderNested }}
                >
                  <option value="" className="bg-[#1E0C38] text-white">Select Destination</option>
                  {accounts.map((acc) => (
                    <option key={acc.id} value={acc.id} className="bg-[#1E0C38] text-white">
                      {acc.name}
                    </option>
                  ))}
                </select>
              </div>
            ) : (
              <div>
                <label className="text-[11px] font-semibold uppercase tracking-wider block mb-1 text-white/75">
                  Category
                </label>
                <select
                  value={categoryId}
                  onChange={(e) => setCategoryId(e.target.value)}
                  className="w-full px-3.5 py-2.5 border rounded-xl text-sm text-white focus:outline-none"
                  style={{ backgroundColor: tokens.nestedSurface, borderColor: tokens.borderNested }}
                >
                  <option value="" className="bg-[#1E0C38] text-white">General</option>
                  {categories.map((c) => (
                    <option key={c.id} value={c.id} className="bg-[#1E0C38] text-white">
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-[11px] font-semibold uppercase tracking-wider block mb-1 text-white/75">
                Recurrence
              </label>
              <select
                value={recurrence}
                onChange={(e) => setRecurrence(e.target.value as any)}
                className="w-full px-3.5 py-2.5 border rounded-xl text-sm text-white focus:outline-none"
                style={{ backgroundColor: tokens.nestedSurface, borderColor: tokens.borderNested }}
              >
                <option value="monthly" className="bg-[#1E0C38] text-white">Monthly</option>
                <option value="one-off" className="bg-[#1E0C38] text-white">One-off</option>
                <option value="daily" className="bg-[#1E0C38] text-white">Daily</option>
                <option value="custom" className="bg-[#1E0C38] text-white">Custom Days</option>
              </select>
            </div>

            {recurrence === "custom" && (
              <div>
                <label className="text-[11px] font-semibold uppercase tracking-wider block mb-1 text-white/75">
                  Every X Days
                </label>
                <input
                  type="number"
                  placeholder="30"
                  value={recurrenceDays}
                  onChange={(e) => setRecurrenceDays(e.target.value)}
                  className="w-full px-3.5 py-2.5 border rounded-xl text-sm font-mono text-white focus:outline-none"
                  style={{ backgroundColor: tokens.nestedSurface, borderColor: tokens.borderNested }}
                />
              </div>
            )}
          </div>

          {/* Optional Fee on Bill */}
          {(type === "expense" || type === "transfer") && (
            <div className="p-3 rounded-2xl border" style={{ backgroundColor: tokens.nestedSurface, borderColor: tokens.borderNested }}>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-white flex items-center gap-1.5">
                  <Receipt className="size-3.5 text-[#FEF08A]" />
                  Planned Fee
                </span>
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => setFeeMode("none")}
                    className="px-2 py-0.5 text-[10px] rounded cursor-pointer"
                    style={{ backgroundColor: feeMode === "none" ? "rgba(255,255,255,0.2)" : "transparent", color: "#FFF" }}
                  >
                    None
                  </button>
                  <button
                    type="button"
                    onClick={() => setFeeMode("manual")}
                    className="px-2 py-0.5 text-[10px] rounded cursor-pointer"
                    style={{ backgroundColor: feeMode === "manual" ? "rgba(255,255,255,0.2)" : "transparent", color: "#FFF" }}
                  >
                    Manual
                  </button>
                  <button
                    type="button"
                    onClick={() => setFeeMode("instapay")}
                    className="px-2 py-0.5 text-[10px] rounded cursor-pointer"
                    style={{
                      background: feeMode === "instapay" ? tokens.dashboardActivePill : "transparent",
                      color: feeMode === "instapay" ? "#120824" : "rgba(255,255,255,0.6)",
                      fontWeight: feeMode === "instapay" ? "bold" : "normal",
                    }}
                  >
                    InstaPay
                  </button>
                </div>
              </div>

              {feeMode === "manual" && (
                <div className="flex items-center gap-2 pt-2 border-t border-white/10">
                  <input
                    type="number"
                    step="0.01"
                    placeholder="Fee amount"
                    value={manualFeeValue}
                    onChange={(e) => setManualFeeValue(e.target.value)}
                    className="w-28 px-2.5 py-1.5 border rounded-lg text-xs font-mono text-white bg-black/20 focus:outline-none border-white/15"
                  />
                </div>
              )}
            </div>
          )}

          <div className="flex items-center justify-end gap-3 pt-3 border-t" style={{ borderColor: tokens.border }}>
            <button type="button" onClick={onClose} className="px-4 py-2 text-xs font-semibold text-white/70">
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-6 py-2.5 rounded-xl text-xs font-bold text-[#120824]"
              style={{ background: tokens.dashboardActivePill }}
            >
              {isSubmitting ? "Creating..." : "Save Bill"}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  )
}

// ─── Modal: Mark Bill as Paid (Feature 3) ──────────────────────────

function MarkBillPaidModal({
  bill,
  isOpen,
  onClose,
}: {
  bill: Bill | null
  isOpen: boolean
  onClose: () => void
}) {
  const { markBillAsPaid } = useFinanceData()
  const { profile } = useUserProfile()
  const { tokens } = useDashboardTheme()
  const currencySymbol = getCurrencySymbol(profile.currency)

  const [generateNext, setGenerateNext] = useState(true)
  const [isProcessing, setIsProcessing] = useState(false)

  if (!isOpen || !bill) return null

  const handleConfirm = async () => {
    setIsProcessing(true)
    try {
      await markBillAsPaid(bill.id, bill.recurrence !== "one-off" && generateNext)
      onClose()
    } catch (err) {
      console.error("Mark bill paid error:", err)
    } finally {
      setIsProcessing(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-md rounded-3xl p-6 border shadow-2xl backdrop-blur-2xl"
        style={{
          background: tokens.cardGradient,
          borderColor: tokens.border,
          boxShadow: tokens.cardShadow,
        }}
      >
        <div className="size-12 rounded-2xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 flex items-center justify-center mx-auto mb-3">
          <CheckCircle2 className="size-6" />
        </div>

        <h3 className="text-base font-bold text-white text-center font-display">Mark Bill as Paid?</h3>
        <p className="text-xs text-white/70 text-center font-sans mt-1">
          This will record a real {bill.type} transaction of <span className="font-mono font-bold text-white">{currencySymbol}{bill.amount.toFixed(2)}</span> on <span className="text-white font-semibold">{bill.account_name}</span>.
        </p>

        {bill.recurrence !== "one-off" && (
          <div className="my-4 p-3 rounded-2xl border bg-black/20 text-left" style={{ borderColor: tokens.borderNested }}>
            <label className="flex items-center gap-2.5 cursor-pointer">
              <input
                type="checkbox"
                checked={generateNext}
                onChange={(e) => setGenerateNext(e.target.checked)}
                className="size-4 rounded accent-[#A7F3D0] cursor-pointer"
              />
              <span className="text-xs font-semibold text-white font-sans">
                Generate next occurrence automatically ({bill.recurrence})
              </span>
            </label>
          </div>
        )}

        <div className="flex items-center justify-center gap-3 mt-5">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2.5 rounded-xl text-xs font-semibold text-white/75 bg-white/10 hover:bg-white/20 cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            disabled={isProcessing}
            className="px-6 py-2.5 rounded-xl text-xs font-bold text-[#120824] shadow-lg cursor-pointer"
            style={{ background: tokens.dashboardActivePill }}
          >
            {isProcessing ? "Processing..." : "Confirm Payment"}
          </button>
        </div>
      </motion.div>
    </div>
  )
}

// ─── Component: Main Net Worth & Trajectory Hero (Features 5 & 6) ──

function NetWorthHeroCard({
  netWorth,
  totalIncome,
  totalExpense,
  currencySymbol,
  onAddTransaction,
}: {
  netWorth: number
  totalIncome: number
  totalExpense: number
  currencySymbol: string
  onAddTransaction: () => void
}) {
  const { tokens } = useDashboardTheme()
  const { monthSparklineData } = useFinanceData()

  return (
    <motion.div
      {...cardEntrance(0.05)}
      className="relative overflow-hidden rounded-3xl p-6 sm:p-7 border backdrop-blur-xl hover:scale-[1.01] transition-transform duration-300 group"
      style={{
        background: tokens.cardGradient,
        borderColor: tokens.border,
        boxShadow: tokens.cardShadow,
      }}
    >
      <div className="absolute inset-0 rounded-3xl pointer-events-none border border-white/10" />

      {/* Header */}
      <div className="relative z-10 flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="size-2 rounded-full bg-[#34D399] shadow-[0_0_8px_#34D399]" />
            <p className="text-[11px] font-bold tracking-[0.14em] uppercase font-sans text-white/85">
              TOTAL NET WORTH
            </p>
          </div>
          <div className="flex items-center gap-3.5 flex-wrap">
            <h1 className="text-4xl sm:text-5xl font-bold tracking-tight font-mono text-white">
              {currencySymbol}{netWorth.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </h1>
            <div
              className="flex items-center gap-1 text-xs font-bold font-mono px-3 py-1 rounded-full border shadow-sm backdrop-blur-md"
              style={{
                backgroundColor: "rgba(139, 158, 43, 0.20)",
                borderColor: "rgba(167, 243, 208, 0.40)",
                color: "#A7F3D0",
              }}
            >
              <ArrowUpRight className="size-3 text-[#A7F3D0]" />
              <span>+{currencySymbol}0.00 this month</span>
            </div>
          </div>
        </div>

        <button
          onClick={onAddTransaction}
          className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold transition-all font-sans cursor-pointer shadow-lg bg-black/40 hover:bg-black/55 border border-white/20 hover:border-white/30 text-white hover:scale-[1.02]"
        >
          <Plus className="size-3.5" />
          <span>Add Transaction</span>
        </button>
      </div>

      {/* Feature 6: Clean Minimalist Trajectory Sparkline (1st of month to today) */}
      <div className="relative z-10 mt-6 h-32 sm:h-36 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={monthSparklineData} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
            <XAxis hide dataKey="date" />
            <YAxis hide domain={["dataMin - 100", "dataMax + 100"]} />
            <Tooltip
              content={({ active, payload }) => {
                if (!active || !payload?.length) return null
                const day = payload[0]?.payload?.date
                return (
                  <div className="rounded-xl border p-2.5 text-xs shadow-2xl backdrop-blur-md bg-[#160728]/95 border-white/20 text-white">
                    <p className="text-[10px] font-mono uppercase mb-0.5 text-white/60">Day {day}</p>
                    <p className="text-sm font-bold font-mono text-[#FEF08A]">
                      {currencySymbol}{Number(payload[0]?.value || 0).toLocaleString("en-US", { minimumFractionDigits: 2 })}
                    </p>
                  </div>
                )
              }}
            />
            <Line
              type="monotone"
              dataKey="value"
              stroke={tokens.chartStroke}
              strokeWidth={2.4}
              dot={false}
              activeDot={{ r: 4, fill: "#FFFFFF", stroke: "#5EEAD4", strokeWidth: 2 }}
              isAnimationActive={false}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Feature 5: Evenly Spaced Bottom 2 Cards (Monthly Income & Monthly Expenses - Savings Rate Removed) */}
      <div className="relative z-10 mt-4 pt-4 border-t grid grid-cols-2 gap-4" style={{ borderColor: tokens.borderNested }}>
        {/* Monthly Income (Green) */}
        <div
          className="border rounded-2xl p-4 backdrop-blur-md"
          style={{
            backgroundColor: tokens.incomeWell,
            borderColor: tokens.borderIncome,
          }}
        >
          <p className="text-[10.5px] font-semibold uppercase tracking-wider font-sans text-white/75">
            MONTHLY INCOME
          </p>
          <p className="text-base sm:text-lg font-bold font-mono mt-1" style={{ color: tokens.gain }}>
            +{currencySymbol}{totalIncome.toLocaleString("en-US", { minimumFractionDigits: 2 })}
          </p>
        </div>

        {/* Monthly Expenses (Red/Pink) */}
        <div
          className="border rounded-2xl p-4 backdrop-blur-md"
          style={{
            backgroundColor: tokens.expenseWell,
            borderColor: tokens.borderExpense,
          }}
        >
          <p className="text-[10.5px] font-semibold uppercase tracking-wider font-sans text-white/75">
            MONTHLY EXPENSES
          </p>
          <p className="text-base sm:text-lg font-bold font-mono mt-1" style={{ color: tokens.loss }}>
            -{currencySymbol}{totalExpense.toLocaleString("en-US", { minimumFractionDigits: 2 })}
          </p>
        </div>
      </div>
    </motion.div>
  )
}

// ─── Component: Recent Transactions Feed (with Feature 4 Edit/Delete) ─

function RecentTransactionsFeed({
  transactions,
  currencySymbol,
  onNavigate,
  onAddTransaction,
  onEditTransaction,
  onDeleteTransaction,
}: {
  transactions: Transaction[]
  currencySymbol: string
  onNavigate?: (section: SectionId) => void
  onAddTransaction: () => void
  onEditTransaction: (tx: Transaction) => void
  onDeleteTransaction: (tx: Transaction) => void
}) {
  const { tokens } = useDashboardTheme()
  const [filter, setFilter] = useState<"all" | "expense" | "income">("all")
  const [search, setSearch] = useState("")

  const filtered = useMemo(() => {
    return transactions.filter((t) => {
      const matchesFilter = filter === "all" || t.type === filter
      const matchesSearch =
        t.description.toLowerCase().includes(search.toLowerCase()) ||
        (t.category_name || "").toLowerCase().includes(search.toLowerCase()) ||
        (t.account_name || "").toLowerCase().includes(search.toLowerCase())
      return matchesFilter && matchesSearch
    })
  }, [transactions, filter, search])

  return (
    <motion.div
      {...cardEntrance(0.12)}
      className="rounded-3xl border p-5 lg:p-6 flex flex-col hover:scale-[1.01] transition-transform duration-300 backdrop-blur-xl"
      style={{
        background: tokens.cardGradient,
        borderColor: tokens.border,
        boxShadow: tokens.cardShadow,
      }}
    >
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-4 border-b" style={{ borderColor: tokens.border }}>
        <div>
          <h3 className="text-base font-bold font-display text-white">Recent Transactions</h3>
          <p className="text-xs font-sans mt-0.5 text-white/70">
            Real-time feed across all connected cards & accounts
          </p>
        </div>

        {/* Filter Tabs */}
        <div className="flex items-center gap-1">
          <div className="flex items-center p-1 border rounded-full" style={{ backgroundColor: "rgba(16, 8, 36, 0.45)", borderColor: tokens.borderNested }}>
            <button
              onClick={() => setFilter("all")}
              className="px-3.5 py-1 text-xs font-bold rounded-full transition-all font-sans cursor-pointer"
              style={{
                backgroundColor: filter === "all" ? tokens.filterActivePill : "transparent",
                color: filter === "all" ? tokens.filterActiveText : "rgba(255, 255, 255, 0.75)",
              }}
            >
              All
            </button>
            <button
              onClick={() => setFilter("expense")}
              className="px-3 py-1 text-xs font-semibold rounded-full transition-all font-sans cursor-pointer text-white/75 hover:text-white"
              style={{
                backgroundColor: filter === "expense" ? tokens.filterActivePill : "transparent",
                color: filter === "expense" ? tokens.filterActiveText : "rgba(255, 255, 255, 0.75)",
              }}
            >
              Expenses
            </button>
            <button
              onClick={() => setFilter("income")}
              className="px-3 py-1 text-xs font-semibold rounded-full transition-all font-sans cursor-pointer text-white/75 hover:text-white"
              style={{
                backgroundColor: filter === "income" ? tokens.filterActivePill : "transparent",
                color: filter === "income" ? tokens.filterActiveText : "rgba(255, 255, 255, 0.75)",
              }}
            >
              Income
            </button>
          </div>

          <button
            onClick={() => onNavigate?.("bills")}
            className="text-xs font-semibold px-2.5 py-1 transition-colors font-sans cursor-pointer text-white/75 hover:text-white"
          >
            View all
          </button>
        </div>
      </div>

      {/* Frosted Search Input */}
      <div className="my-3.5 relative">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-white/60" />
        <input
          type="text"
          placeholder="Filter by merchant, category, or account..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-10 pr-4 py-2.5 border rounded-2xl text-xs font-sans text-white focus:outline-none transition-colors backdrop-blur-md placeholder:text-white/40"
          style={{
            backgroundColor: tokens.nestedSurface,
            borderColor: tokens.borderNested,
          }}
        />
      </div>

      {/* Itemized Rows with Edit & Delete actions */}
      <div className="flex flex-col gap-2 mt-1 max-h-[380px] overflow-y-auto pr-1">
        {filtered.length === 0 ? (
          <div className="text-center py-10 text-white/60">
            <p className="text-sm font-sans font-medium">No transactions match your filter.</p>
            <button
              onClick={onAddTransaction}
              className="mt-3 text-xs font-bold underline cursor-pointer text-[#FEF08A]"
            >
              + Record a new transaction
            </button>
          </div>
        ) : (
          filtered.slice(0, 8).map((tx) => {
            const isIncome = tx.type === "income"
            const isFee = Boolean(tx.is_fee || tx.category_name?.toLowerCase() === "fees")

            return (
              <div
                key={tx.id}
                className="group flex items-center justify-between p-3 sm:p-3.5 rounded-2xl border transition-all duration-200 hover:bg-white/5 backdrop-blur-md relative"
                style={{
                  backgroundColor: tokens.nestedSurface,
                  borderColor: tokens.borderNested,
                }}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div
                    className="size-10 rounded-xl flex items-center justify-center shrink-0 shadow-md border"
                    style={{
                      backgroundColor: isFee
                        ? "rgba(254, 240, 138, 0.15)"
                        : isIncome
                        ? "rgba(52, 211, 153, 0.20)"
                        : "rgba(251, 113, 133, 0.20)",
                      borderColor: isFee
                        ? "rgba(254, 240, 138, 0.35)"
                        : isIncome
                        ? "rgba(52, 211, 153, 0.35)"
                        : "rgba(251, 113, 133, 0.35)",
                      color: isFee ? "#FEF08A" : isIncome ? tokens.gain : tokens.loss,
                    }}
                  >
                    {isFee ? <Receipt className="size-4.5" /> : isIncome ? <ArrowDownLeft className="size-4.5" /> : <ArrowUpRight className="size-4.5" />}
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-semibold truncate font-sans text-white">
                        {tx.description}
                      </p>
                      {tx.fee_pair_id && (
                        <span className="px-1.5 py-0.5 rounded text-[9px] font-mono bg-white/10 text-white/70 shrink-0">
                          linked
                        </span>
                      )}
                    </div>
                    <p className="text-xs font-sans text-white/60 mt-0.5">
                      {tx.category_name || "General"} • {tx.account_name || "Account"}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3 shrink-0">
                  <div className="text-right">
                    <p
                      className="text-sm sm:text-base font-bold font-mono"
                      style={{ color: isIncome ? tokens.gain : tokens.loss }}
                    >
                      {isIncome ? "+" : "-"}{currencySymbol}{Math.abs(tx.amount).toFixed(2)}
                    </p>
                    <p className="text-[10px] font-mono mt-0.5 text-white/50">
                      {tx.date}
                    </p>
                  </div>

                  {/* Feature 4: Edit & Delete Actions */}
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={() => onEditTransaction(tx)}
                      className="p-1.5 rounded-lg hover:bg-white/15 text-white/70 hover:text-white transition-colors cursor-pointer"
                      title="Edit transaction"
                    >
                      <Edit3 className="size-3.5" />
                    </button>
                    <button
                      onClick={() => onDeleteTransaction(tx)}
                      className="p-1.5 rounded-lg hover:bg-red-500/20 text-red-400 hover:text-red-300 transition-colors cursor-pointer"
                      title="Delete transaction"
                    >
                      <Trash2 className="size-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            )
          })
        )}
      </div>
    </motion.div>
  )
}

// ─── Component: Active Accounts Deck ──────────────────────────────

function ActiveAccountsDeck({
  accounts,
  currencySymbol,
  onNavigate,
  onAddAccount,
}: {
  accounts: Account[]
  currencySymbol: string
  onNavigate?: (section: SectionId) => void
  onAddAccount: () => void
}) {
  const { tokens } = useDashboardTheme()

  return (
    <motion.div
      {...cardEntrance(0.18)}
      className="rounded-3xl border p-5 lg:p-6 flex flex-col hover:scale-[1.01] transition-transform duration-300 backdrop-blur-xl"
      style={{
        background: tokens.cardGradient,
        borderColor: tokens.border,
        boxShadow: tokens.cardShadow,
      }}
    >
      <div className="flex items-center justify-between pb-3 border-b" style={{ borderColor: tokens.border }}>
        <div>
          <h3 className="text-base font-bold font-display text-white">Active Accounts</h3>
          <p className="text-xs font-sans text-white/70 mt-0.5">Track your linked Bank accounts</p>
        </div>
        <button
          onClick={onAddAccount}
          className="text-xs font-semibold px-2.5 py-1 rounded-xl transition-colors font-sans cursor-pointer text-white/80 hover:text-white flex items-center gap-1"
        >
          <Plus className="size-3.5" />
          <span>Add</span>
        </button>
      </div>

      <div className="flex flex-col gap-3 mt-4">
        {accounts.slice(0, 3).map((acc) => {
          const visual = getAccountVisual(acc.type, acc.name)

          return (
            <div
              key={acc.id}
              onClick={() => onNavigate?.("accounts")}
              className="p-4 rounded-2xl border flex flex-col justify-between transition-all duration-200 cursor-pointer hover:bg-white/5 backdrop-blur-md relative"
              style={{
                backgroundColor: tokens.nestedSurface,
                borderColor: tokens.borderNested,
              }}
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="size-9 rounded-xl flex items-center justify-center border border-white/10 bg-white/10 text-white font-mono font-bold text-xs shadow-inner">
                    <Landmark className="size-4" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold font-display text-white">{acc.name}</h4>
                    <p className="text-[11px] font-sans text-white/60">{visual.label}</p>
                  </div>
                </div>
                <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full border border-white/15 bg-white/10 text-white/80">
                  {acc.currency || "EGP"}
                </span>
              </div>

              <div className="flex items-end justify-between mt-3 pt-2 border-t border-white/5">
                <div>
                  <p className="text-[9.5px] font-semibold uppercase tracking-wider font-sans text-white/55">
                    AVAILABLE BALANCE
                  </p>
                  <p className="text-base sm:text-lg font-bold font-mono text-white mt-0.5">
                    {currencySymbol}{Number(acc.balance || 0).toLocaleString("en-US", { minimumFractionDigits: 2 })}
                  </p>
                </div>
                <div className="flex flex-col items-end">
                  <span className="text-[9.5px] font-mono text-white/60 mb-1">
                    Cycle {visual.cycle}
                  </span>
                  <DotMatrixIndicator progress={visual.fillRatio} dotsCount={7} />
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </motion.div>
  )
}

// ─── Component: Category Budget Progress Gauges ───────────────────

function CategoryBudgetGauges({
  categories,
  currencySymbol,
  onNavigate,
}: {
  categories: Category[]
  currencySymbol: string
  onNavigate?: (section: SectionId) => void
}) {
  const { tokens } = useDashboardTheme()

  // Filter only expense categories that exist in user's profile/Supabase data
  const expenseCategories = useMemo(() => {
    return categories.filter((c) => c.type === "expense")
  }, [categories])

  const displayList = useMemo(() => {
    return expenseCategories.slice(0, 4).map((c) => {
      const spent = c.total_spent || 0
      const budget = c.budget && c.budget > 0 ? c.budget : undefined
      const ratio = budget ? Math.min(1, spent / budget) : (spent > 0 ? 1 : 0)
      return {
        id: c.id,
        name: c.name,
        spent,
        budget,
        ratio,
      }
    })
  }, [expenseCategories])

  return (
    <motion.div
      {...cardEntrance(0.24)}
      className="rounded-3xl border p-5 lg:p-6 flex flex-col hover:scale-[1.01] transition-transform duration-300 backdrop-blur-xl"
      style={{
        background: tokens.cardGradient,
        borderColor: tokens.border,
        boxShadow: tokens.cardShadow,
      }}
    >
      <div className="flex items-center justify-between pb-3 border-b" style={{ borderColor: tokens.border }}>
        <div>
          <h3 className="text-base font-bold font-display text-white">Category Budgets</h3>
          <p className="text-xs font-sans text-white/70 mt-0.5">Utilization & spending guardrails</p>
        </div>
        <button
          onClick={() => onNavigate?.("categories")}
          className="text-xs font-semibold px-2.5 py-1 rounded-xl transition-colors font-sans cursor-pointer text-white/80 hover:text-white"
        >
          Manage
        </button>
      </div>

      {expenseCategories.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-6 text-center">
          <p className="text-xs text-white/60">No expense categories created yet.</p>
          <button
            onClick={() => onNavigate?.("categories")}
            className="mt-2 text-xs font-bold underline text-[#FEF08A] cursor-pointer"
          >
            + Create your first category
          </button>
        </div>
      ) : (
        <div className="flex flex-col gap-4 mt-4">
          {displayList.map((item) => {
            const pct = Math.round(item.ratio * 100)

            return (
              <div key={item.id} className="flex flex-col gap-1.5">
                <div className="flex items-center justify-between text-xs font-sans">
                  <span className="font-semibold text-white truncate max-w-[140px]">{item.name}</span>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-white/70">
                      {currencySymbol}{item.spent.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      {item.budget != null ? ` / ${currencySymbol}${item.budget.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : ""}
                    </span>
                    <span className="px-1.5 py-0.5 rounded text-[10px] font-mono font-bold border border-white/10 bg-white/10 text-white/90">
                      {item.budget != null ? `${pct}%` : "Tracked"}
                    </span>
                  </div>
                </div>

                {/* Cyan -> Green -> Yellow Progress Bar */}
                <div className="h-2 w-full rounded-full overflow-hidden bg-white/10 p-[1px]">
                  <div
                    className="h-full rounded-full transition-all duration-500 shadow-[0_0_10px_rgba(34,197,94,0.5)]"
                    style={{
                      width: `${item.budget != null ? Math.max(4, pct) : (item.spent > 0 ? 100 : 4)}%`,
                      background: tokens.budgetProgressGradient,
                    }}
                  />
                </div>
              </div>
            )
          })}
        </div>
      )}
    </motion.div>
  )
}

// ─── Section: Header Reusable ─────────────────────────────────────

function SectionHeader({
  title,
  subtitle,
  children,
}: {
  title: string
  subtitle: string
  children?: React.ReactNode
}) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-white/10">
      <div>
        <h2 className="text-xl sm:text-2xl font-bold font-display text-white">{title}</h2>
        <p className="text-xs sm:text-sm font-sans text-white/70 mt-0.5">{subtitle}</p>
      </div>
      {children && <div className="flex items-center gap-3">{children}</div>}
    </div>
  )
}

// ─── Section: Bills Management (Feature 3 Replaces Transactions) ──

function BillsSection({ onNavigate }: { onNavigate: (s: SectionId) => void }) {
  const { bills, accounts, categories, deleteBill } = useFinanceData()
  const { profile } = useUserProfile()
  const { tokens } = useDashboardTheme()
  const currencySymbol = getCurrencySymbol(profile.currency)

  const [selectedAccountId, setSelectedAccountId] = useState<string>("all")
  const [addBillOpen, setAddBillOpen] = useState(false)
  const [selectedBillToPay, setSelectedBillToPay] = useState<Bill | null>(null)

  // Filter bills by selected account
  const filteredBills = useMemo(() => {
    return bills.filter((b) => {
      if (selectedAccountId === "all") return true
      return b.account_id === selectedAccountId
    })
  }, [bills, selectedAccountId])

  // Current Month Boundaries & Date Computations
  const now = new Date()
  const todayStr = now.toISOString().split("T")[0]
  const currentYear = now.getFullYear()
  const currentMonth = now.getMonth()
  const startOfMonthStr = `${currentYear}-${String(currentMonth + 1).padStart(2, "0")}-01`
  const lastDayOfMonth = new Date(currentYear, currentMonth + 1, 0).getDate()
  const endOfMonthStr = `${currentYear}-${String(currentMonth + 1).padStart(2, "0")}-${String(lastDayOfMonth).padStart(2, "0")}`

  // 1. Overdue (past due date, not completed)
  const overdueBills = useMemo(() => {
    return filteredBills
      .filter((b) => !b.is_completed && b.due_date < todayStr)
      .sort((a, b) => a.due_date.localeCompare(b.due_date))
  }, [filteredBills, todayStr])

  // 2. This Month (due within current calendar month >= today, not completed)
  const thisMonthBills = useMemo(() => {
    return filteredBills
      .filter((b) => !b.is_completed && b.due_date >= todayStr && b.due_date <= endOfMonthStr)
      .sort((a, b) => a.due_date.localeCompare(b.due_date))
  }, [filteredBills, todayStr, endOfMonthStr])

  // 3. Later on... (due in future months, not completed)
  const laterBills = useMemo(() => {
    return filteredBills
      .filter((b) => !b.is_completed && b.due_date > endOfMonthStr)
      .sort((a, b) => a.due_date.localeCompare(b.due_date))
  }, [filteredBills, endOfMonthStr])

  const completedBills = useMemo(() => {
    return filteredBills
      .filter((b) => b.is_completed)
      .sort((a, b) => b.due_date.localeCompare(a.due_date))
  }, [filteredBills])

  // Summary Metrics: Current Calendar Month ONLY (selected account + current month)
  const totalPlannedIncome = useMemo(() => {
    return filteredBills
      .filter((b) => !b.is_completed && b.due_date >= startOfMonthStr && b.due_date <= endOfMonthStr && b.type === "income")
      .reduce((sum, b) => sum + b.amount, 0)
  }, [filteredBills, startOfMonthStr, endOfMonthStr])

  const totalPlannedExpenses = useMemo(() => {
    return filteredBills
      .filter((b) => !b.is_completed && b.due_date >= startOfMonthStr && b.due_date <= endOfMonthStr && b.type === "expense")
      .reduce((sum, b) => sum + b.amount + b.fee_amount, 0)
  }, [filteredBills, startOfMonthStr, endOfMonthStr])

  const expectedRemaining = totalPlannedIncome - totalPlannedExpenses

  // Helper for relative due text
  const getDueLabel = (dueDateStr: string) => {
    const due = new Date(dueDateStr)
    const today = new Date(todayStr)
    const diffTime = due.getTime() - today.getTime()
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))

    if (diffDays < 0) return `${Math.abs(diffDays)}d overdue`
    if (diffDays === 0) return "Due today"
    if (diffDays === 1) return "Due tomorrow"
    return `In ${diffDays} days`
  }

  // Bill Row Renderer
  const renderBillRow = (b: Bill, isMuted = false) => {
    const isIncome = b.type === "income"
    return (
      <div
        key={b.id}
        className={`p-4 rounded-2xl border flex items-center justify-between gap-3 backdrop-blur-md transition-all hover:bg-white/5 ${
          isMuted ? "opacity-75" : ""
        }`}
        style={{
          backgroundColor: tokens.nestedSurface,
          borderColor: tokens.borderNested,
        }}
      >
        <div className="flex items-center gap-3">
          <div
            className="size-10 rounded-xl flex items-center justify-center font-bold"
            style={{
              backgroundColor: isIncome ? "rgba(52, 211, 153, 0.20)" : "rgba(251, 113, 133, 0.20)",
              color: isIncome ? tokens.gain : tokens.loss,
            }}
          >
            {isIncome ? <ArrowDownLeft className="size-5" /> : <Receipt className="size-5" />}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h4 className="text-sm font-bold text-white font-sans">{b.name}</h4>
              <span className="px-2 py-0.5 rounded text-[9.5px] font-mono uppercase bg-white/10 text-white/70">
                {b.recurrence}
              </span>
            </div>
            <p className="text-xs text-white/60 mt-0.5 font-sans">
              {b.account_name} • {getDueLabel(b.due_date)} ({b.due_date})
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="text-right">
            <p
              className="text-sm sm:text-base font-bold font-mono"
              style={{ color: isIncome ? tokens.gain : tokens.loss }}
            >
              {isIncome ? "+" : "-"}{currencySymbol}{b.amount.toFixed(2)}
            </p>
            {b.fee_amount > 0 && (
              <p className="text-[10px] font-mono text-white/50">+Fee: {currencySymbol}{b.fee_amount.toFixed(2)}</p>
            )}
          </div>

          <button
            onClick={() => setSelectedBillToPay(b)}
            className="px-3.5 py-1.5 rounded-xl text-xs font-bold text-[#120824] cursor-pointer transition-all shadow-md hover:scale-[1.02]"
            style={{ background: tokens.dashboardActivePill }}
          >
            Mark as paid
          </button>
          <button
            onClick={() => deleteBill(b.id)}
            className="p-1.5 rounded-lg hover:bg-red-500/20 text-white/50 hover:text-red-400 cursor-pointer"
            title="Delete bill"
          >
            <Trash2 className="size-4" />
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-6">
      <SectionHeader title="Planned Bills & Incomes" subtitle="Scheduled obligations, recurring income, and planned transfers">
        <button
          onClick={() => setAddBillOpen(true)}
          className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition-all font-sans cursor-pointer shadow-lg hover:scale-[1.02] text-[#120824]"
          style={{ background: tokens.dashboardActivePill }}
        >
          <Plus className="size-4" />
          <span>Add Bill</span>
        </button>
      </SectionHeader>

      {/* Account Selector Filter */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1">
        <button
          onClick={() => setSelectedAccountId("all")}
          className="px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all font-sans cursor-pointer shrink-0"
          style={{
            background: selectedAccountId === "all" ? tokens.dashboardActivePill : "rgba(255, 255, 255, 0.08)",
            color: selectedAccountId === "all" ? "#120824" : "rgba(255, 255, 255, 0.8)",
          }}
        >
          All Accounts
        </button>
        {accounts.map((acc) => (
          <button
            key={acc.id}
            onClick={() => setSelectedAccountId(acc.id)}
            className="px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all font-sans cursor-pointer shrink-0"
            style={{
              background: selectedAccountId === acc.id ? tokens.dashboardActivePill : "rgba(255, 255, 255, 0.08)",
              color: selectedAccountId === acc.id ? "#120824" : "rgba(255, 255, 255, 0.8)",
            }}
          >
            {acc.name}
          </button>
        ))}
      </div>

      {/* 3 Summary Cards (Current Calendar Month Only) */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Planned Income */}
        <motion.div
          {...cardEntrance(0.05)}
          className="p-5 rounded-3xl border backdrop-blur-xl hover:scale-[1.01] transition-transform duration-300"
          style={{ background: tokens.cardGradient, borderColor: tokens.border, boxShadow: tokens.cardShadow }}
        >
          <p className="text-[11px] font-semibold uppercase tracking-wider font-sans text-white/70">
            Total Planned Income
          </p>
          <p className="text-2xl font-bold font-mono mt-1 text-[#4ADE80]">
            +{currencySymbol}{totalPlannedIncome.toLocaleString("en-US", { minimumFractionDigits: 2 })}
          </p>
        </motion.div>

        {/* Planned Expenses */}
        <motion.div
          {...cardEntrance(0.10)}
          className="p-5 rounded-3xl border backdrop-blur-xl hover:scale-[1.01] transition-transform duration-300"
          style={{ background: tokens.cardGradient, borderColor: tokens.border, boxShadow: tokens.cardShadow }}
        >
          <p className="text-[11px] font-semibold uppercase tracking-wider font-sans text-white/70">
            Total Planned Expenses
          </p>
          <p className="text-2xl font-bold font-mono mt-1 text-[#FB7185]">
            -{currencySymbol}{totalPlannedExpenses.toLocaleString("en-US", { minimumFractionDigits: 2 })}
          </p>
        </motion.div>

        {/* Expected Remaining */}
        <motion.div
          {...cardEntrance(0.15)}
          className="p-5 rounded-3xl border backdrop-blur-xl hover:scale-[1.01] transition-transform duration-300"
          style={{ background: tokens.cardGradient, borderColor: tokens.border, boxShadow: tokens.cardShadow }}
        >
          <p className="text-[11px] font-semibold uppercase tracking-wider font-sans text-white/70">
            Expected Remaining
          </p>
          <p
            className="text-2xl font-bold font-mono mt-1"
            style={{ color: expectedRemaining >= 0 ? "#FEF08A" : "#FB7185" }}
          >
            {expectedRemaining >= 0 ? "+" : "-"}{currencySymbol}{Math.abs(expectedRemaining).toLocaleString("en-US", { minimumFractionDigits: 2 })}
          </p>
        </motion.div>
      </div>

      {/* 1. Overdue Section (Red Highlight, Top) */}
      {overdueBills.length > 0 && (
        <div className="flex flex-col gap-3">
          <div className="flex items-center gap-2">
            <span className="size-2.5 rounded-full bg-red-400 animate-pulse" />
            <h3 className="text-sm font-bold uppercase tracking-wider text-red-400 font-display">
              Overdue ({overdueBills.length})
            </h3>
          </div>

          <div className="flex flex-col gap-2">
            {overdueBills.map((b) => (
              <div
                key={b.id}
                className="p-4 rounded-2xl border border-red-500/40 bg-red-500/15 backdrop-blur-md flex items-center justify-between gap-3"
              >
                <div className="flex items-center gap-3">
                  <div className="size-10 rounded-xl bg-red-500/20 text-red-300 flex items-center justify-center font-bold">
                    <AlertCircle className="size-5" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-white font-sans">{b.name}</h4>
                    <p className="text-xs text-red-200 mt-0.5 font-sans">
                      {b.account_name} • {getDueLabel(b.due_date)} ({b.due_date})
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="text-right">
                    <p className="text-sm font-mono font-bold text-white">
                      {currencySymbol}{b.amount.toFixed(2)}
                    </p>
                    {b.fee_amount > 0 && (
                      <p className="text-[10px] font-mono text-red-300">+Fee: {currencySymbol}{b.fee_amount.toFixed(2)}</p>
                    )}
                  </div>

                  <button
                    onClick={() => setSelectedBillToPay(b)}
                    className="px-3.5 py-1.5 rounded-xl text-xs font-bold bg-[#A7F3D0] hover:bg-[#5EEAD4] text-[#120824] cursor-pointer transition-all shadow-md"
                  >
                    Mark as paid
                  </button>
                  <button
                    onClick={() => deleteBill(b.id)}
                    className="p-1.5 rounded-lg hover:bg-red-500/20 text-red-300 cursor-pointer"
                    title="Delete bill"
                  >
                    <Trash2 className="size-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 2. This Month Section (Middle) */}
      <div className="flex flex-col gap-3">
        <h3 className="text-sm font-bold uppercase tracking-wider text-white/80 font-display">
          This Month ({thisMonthBills.length})
        </h3>

        {thisMonthBills.length === 0 ? (
          <div
            className="p-8 rounded-3xl border text-center backdrop-blur-xl"
            style={{ background: tokens.cardGradient, borderColor: tokens.border }}
          >
            <p className="text-sm text-white/60">No pending bills due this month for this account.</p>
            <button
              onClick={() => setAddBillOpen(true)}
              className="mt-3 text-xs font-bold underline text-[#FEF08A] cursor-pointer"
            >
              + Create a new bill
            </button>
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            {thisMonthBills.map((b) => renderBillRow(b, false))}
          </div>
        )}
      </div>

      {/* 3. Later on... Section (Muted, Bottom) */}
      {laterBills.length > 0 && (
        <div className="flex flex-col gap-3 pt-4 border-t" style={{ borderColor: tokens.borderNested }}>
          <h3 className="text-sm font-bold uppercase tracking-wider text-white/60 font-display">
            Later on... ({laterBills.length})
          </h3>

          <div className="flex flex-col gap-2">
            {laterBills.map((b) => renderBillRow(b, true))}
          </div>
        </div>
      )}

      {/* Completed History Accordion */}
      {completedBills.length > 0 && (
        <details className="mt-2 text-xs text-white/60">
          <summary className="cursor-pointer font-bold font-display uppercase tracking-wider mb-3">
            Completed Bills ({completedBills.length})
          </summary>
          <div className="flex flex-col gap-2 opacity-70">
            {completedBills.slice(0, 5).map((b) => (
              <div
                key={b.id}
                className="p-3 rounded-xl border flex items-center justify-between text-xs"
                style={{ backgroundColor: tokens.nestedSurface, borderColor: tokens.borderNested }}
              >
                <span>{b.name} ({b.account_name})</span>
                <span className="font-mono text-white font-bold">{currencySymbol}{b.amount.toFixed(2)}</span>
              </div>
            ))}
          </div>
        </details>
      )}

      {/* Modals */}
      <AddBillModal isOpen={addBillOpen} onClose={() => setAddBillOpen(false)} />
      <MarkBillPaidModal bill={selectedBillToPay} isOpen={Boolean(selectedBillToPay)} onClose={() => setSelectedBillToPay(null)} />
    </div>
  )
}

// ─── Section: Accounts Management (Feature 2 with Held Funds) ─────

function AccountsSection({ onNavigate }: { onNavigate: (s: SectionId) => void }) {
  const {
    accounts,
    deleteAccount,
    heldFunds,
    deleteHeldFund,
    fetchHeldFundHistory
  } = useFinanceData()
  const { profile } = useUserProfile()
  const { tokens } = useDashboardTheme()
  const currencySymbol = getCurrencySymbol(profile.currency)

  const [addAccOpen, setAddAccOpen] = useState(false)
  const [addHeldFundOpen, setAddHeldFundOpen] = useState(false)

  // Deposit/Withdraw modal state
  const [selectedFundForAction, setSelectedFundForAction] = useState<HeldFund | null>(null)
  const [fundActionMode, setFundActionMode] = useState<"deposit" | "withdrawal">("deposit")

  // Accordion state for expanded history
  const [expandedFundId, setExpandedFundId] = useState<string | null>(null)
  const [fundHistoryMap, setFundHistoryMap] = useState<Record<string, HeldFundHistory[]>>({})
  const [historyLoading, setHistoryLoading] = useState(false)

  const toggleExpand = async (hfId: string) => {
    if (expandedFundId === hfId) {
      setExpandedFundId(null)
      return
    }
    setExpandedFundId(hfId)
    setHistoryLoading(true)
    const history = await fetchHeldFundHistory(hfId)
    setFundHistoryMap((prev) => ({ ...prev, [hfId]: history }))
    setHistoryLoading(false)
  }

  return (
    <div className="flex flex-col gap-8">
      {/* ─── Accounts Section ─── */}
      <div className="flex flex-col gap-5">
        <SectionHeader title="Accounts & Liquidity" subtitle="All connected bank vaults, credit lines, and cash stores">
          <button
            onClick={() => setAddAccOpen(true)}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition-all font-sans cursor-pointer shadow-lg hover:scale-[1.02] text-[#120824]"
            style={{ background: tokens.dashboardActivePill }}
          >
            <Plus className="size-4" />
            <span>New Account</span>
          </button>
        </SectionHeader>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {accounts.map((acc, i) => {
            const visual = getAccountVisual(acc.type, acc.name)

            return (
              <motion.div
                key={acc.id}
                {...cardEntrance(i * 0.06)}
                className="rounded-3xl p-6 border flex flex-col justify-between relative overflow-hidden shadow-xl group hover:scale-[1.015] transition-transform duration-300 backdrop-blur-xl"
                style={{
                  background: tokens.cardGradient,
                  borderColor: tokens.border,
                  boxShadow: tokens.cardShadow,
                }}
              >
                <div className="absolute inset-0 rounded-3xl pointer-events-none border border-white/10" />

                <div className="relative z-10 flex items-start justify-between mb-6">
                  <div className="flex items-center gap-3">
                    <div className="size-11 rounded-2xl flex items-center justify-center border border-white/15 bg-white/15 text-white font-mono font-bold text-xs shadow-md">
                      <Landmark className="size-5" />
                    </div>
                    <div>
                      <h3 className="text-base font-bold font-display text-white">{acc.name}</h3>
                      <p className="text-xs font-sans text-white/70">{visual.label}</p>
                    </div>
                  </div>

                  <button
                    onClick={() => deleteAccount(acc.id)}
                    className="opacity-0 group-hover:opacity-100 p-1.5 rounded-lg transition-all cursor-pointer hover:bg-red-500/20 text-red-400"
                    title="Delete account"
                  >
                    <Trash2 className="size-4" />
                  </button>
                </div>

                <div className="relative z-10 pt-4 border-t" style={{ borderColor: tokens.borderNested }}>
                  <p className="text-[11px] font-semibold uppercase tracking-wider font-sans text-white/70">
                    Current Balance
                  </p>
                  <p className="text-2xl font-bold font-mono mt-1 text-white">
                    {currencySymbol}{Number(acc.balance || 0).toLocaleString("en-US", { minimumFractionDigits: 2 })}
                  </p>
                </div>
              </motion.div>
            )
          })}
        </div>
      </div>

      {/* ─── FEATURE 2: HELD FUNDS SYSTEM ─── */}
      <div className="flex flex-col gap-5 pt-4 border-t" style={{ borderColor: tokens.borderNested }}>
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-bold font-display text-white flex items-center gap-2">
              <PiggyBank className="size-5 text-[#FEF08A]" />
              Held Funds & Personal Balances
            </h3>
            <p className="text-xs text-white/70 font-sans mt-0.5">
              Isolated pots and external person debts set aside from your primary account balances
            </p>
          </div>

          <button
            onClick={() => setAddHeldFundOpen(true)}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all font-sans cursor-pointer shadow-lg text-[#120824]"
            style={{ background: tokens.dashboardActivePill }}
          >
            <Plus className="size-3.5" />
            <span>Add Held Fund</span>
          </button>
        </div>

        {heldFunds.length === 0 ? (
          <motion.div
            {...cardEntrance(0.2)}
            className="p-8 rounded-3xl border text-center backdrop-blur-xl hover:scale-[1.01] transition-transform duration-300"
            style={{ background: tokens.cardGradient, borderColor: tokens.border }}
          >
            <p className="text-sm text-white/60">No held funds or personal balances created yet.</p>
            <button
              onClick={() => setAddHeldFundOpen(true)}
              className="mt-2 text-xs font-bold underline text-[#FEF08A] cursor-pointer"
            >
              + Create your first held fund
            </button>
          </motion.div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {heldFunds.map((hf, i) => {
              const isPerson = hf.type === "person"
              const isExpanded = expandedFundId === hf.id
              const historyList = fundHistoryMap[hf.id] || []

              return (
                <motion.div
                  key={hf.id}
                  {...cardEntrance(0.1 + i * 0.05)}
                  className="rounded-3xl p-5 border flex flex-col justify-between transition-all backdrop-blur-xl relative hover:scale-[1.01] transition-transform duration-300"
                  style={{
                    background: tokens.cardGradient,
                    borderColor: tokens.border,
                    boxShadow: tokens.cardShadow,
                  }}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div
                        className="size-10 rounded-2xl flex items-center justify-center font-bold shadow-md"
                        style={{
                          backgroundColor: isPerson ? "rgba(167, 243, 208, 0.2)" : "rgba(254, 240, 138, 0.2)",
                          color: isPerson ? "#A7F3D0" : "#FEF08A",
                        }}
                      >
                        {isPerson ? <UserCheck className="size-5" /> : <PiggyBank className="size-5" />}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="text-base font-bold text-white font-display">{hf.name}</h4>
                          <span className="px-2 py-0.5 rounded text-[9.5px] font-mono uppercase bg-white/10 text-white/80">
                            {hf.type}
                          </span>
                        </div>
                        <p className="text-xs text-white/60 font-sans mt-0.5">Linked: {hf.account_name}</p>
                      </div>
                    </div>

                    <button
                      onClick={() => deleteHeldFund(hf.id)}
                      className="p-1.5 rounded-lg hover:bg-red-500/20 text-white/40 hover:text-red-400 cursor-pointer transition-colors"
                      title="Delete held fund"
                    >
                      <Trash2 className="size-4" />
                    </button>
                  </div>

                  <div className="mt-4 pt-3 border-t flex items-center justify-between" style={{ borderColor: tokens.borderNested }}>
                    <div>
                      <p className="text-[10px] font-semibold uppercase tracking-wider text-white/60">
                        Current Pot Balance
                      </p>
                      <p
                        className="text-xl font-bold font-mono mt-0.5"
                        style={{ color: hf.balance >= 0 ? tokens.gain : tokens.loss }}
                      >
                        {currencySymbol}{hf.balance.toLocaleString("en-US", { minimumFractionDigits: 2 })}
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => {
                          setSelectedFundForAction(hf)
                          setFundActionMode("deposit")
                        }}
                        className="px-3 py-1.5 rounded-xl text-xs font-bold bg-white/10 hover:bg-white/20 text-white transition-all cursor-pointer"
                      >
                        + Deposit
                      </button>
                      <button
                        onClick={() => {
                          setSelectedFundForAction(hf)
                          setFundActionMode("withdrawal")
                        }}
                        className="px-3 py-1.5 rounded-xl text-xs font-bold bg-white/10 hover:bg-white/20 text-white transition-all cursor-pointer"
                      >
                        - Withdraw
                      </button>
                      <button
                        onClick={() => toggleExpand(hf.id)}
                        className="p-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white cursor-pointer"
                        title="View history"
                      >
                        <ChevronDown className={`size-4 transition-transform ${isExpanded ? "rotate-180" : ""}`} />
                      </button>
                    </div>
                  </div>

                  {/* Expanded History Log */}
                  {isExpanded && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      className="mt-4 pt-3 border-t flex flex-col gap-2"
                      style={{ borderColor: tokens.borderNested }}
                    >
                      <p className="text-[10.5px] font-bold uppercase tracking-wider text-white/70">
                        Live Fund History
                      </p>

                      {historyLoading ? (
                        <p className="text-xs text-white/50 py-2">Loading logs from Supabase...</p>
                      ) : historyList.length === 0 ? (
                        <p className="text-xs text-white/50 py-2">No history recorded yet.</p>
                      ) : (
                        <div className="flex flex-col gap-1.5 max-h-48 overflow-y-auto pr-1">
                          {historyList.map((h) => {
                            const isDep = h.direction === "deposit"
                            return (
                              <div
                                key={h.id}
                                className="p-2.5 rounded-xl border flex items-center justify-between text-xs"
                                style={{ backgroundColor: tokens.nestedSurface, borderColor: tokens.borderNested }}
                              >
                                <div>
                                  <span className={`font-semibold mr-1.5 ${isDep ? "text-emerald-400" : "text-rose-400"}`}>
                                    {isDep ? "Deposit" : "Withdrawal"}
                                  </span>
                                  <span className="text-white/60">{h.note || "No note"}</span>
                                </div>
                                <div className="text-right">
                                  <span className="font-mono font-bold text-white">
                                    {isDep ? "+" : "-"}{currencySymbol}{h.amount.toFixed(2)}
                                  </span>
                                  <span className="text-[9.5px] text-white/40 block font-mono">{h.date}</span>
                                </div>
                              </div>
                            )
                          })}
                        </div>
                      )}
                    </motion.div>
                  )}
                </motion.div>
              )
            })}
          </div>
        )}
      </div>

      {/* Modals */}
      <AddAccountModal isOpen={addAccOpen} onClose={() => setAddAccOpen(false)} />
      <AddHeldFundModal isOpen={addHeldFundOpen} onClose={() => setAddHeldFundOpen(false)} />
      <DepositWithdrawHeldFundModal
        heldFund={selectedFundForAction}
        mode={fundActionMode}
        isOpen={Boolean(selectedFundForAction)}
        onClose={() => setSelectedFundForAction(null)}
      />
    </div>
  )
}

function CategoriesSection({ onNavigate }: { onNavigate: (s: SectionId) => void }) {
  const { categories, createCategory, deleteCategory } = useFinanceData()
  const { profile } = useUserProfile()
  const { tokens } = useDashboardTheme()
  const currencySymbol = getCurrencySymbol(profile.currency)

  const [newCatName, setNewCatName] = useState("")
  const [newCatType, setNewCatType] = useState<"expense" | "income">("expense")
  const [newCatBudget, setNewCatBudget] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newCatName.trim()) return
    setIsSubmitting(true)
    try {
      await createCategory({
        name: newCatName.trim(),
        type: newCatType,
        budget: parseFloat(newCatBudget) || undefined,
        currency: profile.currency || "EGP",
      })
      setNewCatName("")
      setNewCatBudget("")
    } catch (err) {
      console.error(err)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <SectionHeader title="Category Breakdown" subtitle="Manage categorization labels, budgets, and spending allowances" />

      {/* Category Creation Card */}
      <motion.div
        {...cardEntrance(0.05)}
        className="rounded-3xl p-6 border backdrop-blur-xl hover:scale-[1.01] transition-transform duration-300"
        style={{ background: tokens.cardGradient, borderColor: tokens.border, boxShadow: tokens.cardShadow }}
      >
        <h3 className="text-base font-bold font-display text-white mb-3">Add Category</h3>
        <form onSubmit={handleCreate} className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
          <input
            type="text"
            required
            placeholder="Category name (e.g. Subscriptions)"
            value={newCatName}
            onChange={(e) => setNewCatName(e.target.value)}
            className="w-full px-3.5 py-2.5 border rounded-xl text-sm text-white focus:outline-none"
            style={{ backgroundColor: tokens.nestedSurface, borderColor: tokens.borderNested }}
          />

          <select
            value={newCatType}
            onChange={(e) => setNewCatType(e.target.value as any)}
            className="w-full px-3.5 py-2.5 border rounded-xl text-sm text-white focus:outline-none"
            style={{ backgroundColor: tokens.nestedSurface, borderColor: tokens.borderNested }}
          >
            <option value="expense" className="bg-[#1E0C38] text-white">Expense Category</option>
            <option value="income" className="bg-[#1E0C38] text-white">Income Category</option>
          </select>

          <input
            type="number"
            step="0.01"
            placeholder={`Monthly Budget (${currencySymbol.trim()}) - opt`}
            value={newCatBudget}
            onChange={(e) => setNewCatBudget(e.target.value)}
            className="w-full px-3.5 py-2.5 border rounded-xl text-sm font-mono text-white focus:outline-none"
            style={{ backgroundColor: tokens.nestedSurface, borderColor: tokens.borderNested }}
          />

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full px-5 py-2.5 rounded-xl text-xs font-bold text-[#120824] shadow-lg cursor-pointer transition-all"
            style={{ background: tokens.dashboardActivePill }}
          >
            {isSubmitting ? "Saving..." : "Create Category"}
          </button>
        </form>
      </motion.div>

      {/* Categories Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {categories.length === 0 ? (
          <div className="col-span-full p-8 rounded-3xl border text-center backdrop-blur-xl" style={{ background: tokens.cardGradient, borderColor: tokens.border }}>
            <p className="text-sm text-white/60">No categories created yet. Create your first category above.</p>
          </div>
        ) : (
          categories.map((c, i) => (
            <motion.div
              key={c.id}
              {...cardEntrance(0.08 + i * 0.04)}
              className="p-5 rounded-2xl border flex items-center justify-between backdrop-blur-md hover:scale-[1.01] transition-transform duration-300 relative group"
              style={{ backgroundColor: tokens.nestedSurface, borderColor: tokens.borderNested }}
            >
              <div>
                <div className="flex items-center gap-2">
                  <h4 className="text-sm font-bold text-white font-sans">{c.name}</h4>
                  <span className="px-2 py-0.5 rounded text-[9.5px] font-mono uppercase bg-white/10 text-white/70">
                    {c.type}
                  </span>
                </div>
                <p className="text-xs text-white/60 font-mono mt-1">
                  Spent: <span className="text-white font-semibold">{currencySymbol}{(c.total_spent || 0).toLocaleString("en-US", { minimumFractionDigits: 2 })}</span>
                  {c.budget != null ? ` / Budget: ${currencySymbol}${c.budget.toLocaleString("en-US", { minimumFractionDigits: 2 })}` : ""}
                </p>
              </div>

              <button
                onClick={() => deleteCategory(c.id)}
                className="opacity-0 group-hover:opacity-100 p-1.5 rounded-lg hover:bg-red-500/20 text-white/40 hover:text-red-400 cursor-pointer transition-all"
                title="Delete category"
              >
                <Trash2 className="size-4" />
              </button>
            </motion.div>
          ))
        )}
      </div>
    </div>
  )
}

// ─── Section: Settings Management ─────────────────────────────────

function SettingsSection({ onNavigate }: { onNavigate: (s: SectionId) => void }) {
  const { profile, updateProfile } = useUserProfile()
  const { isDarkMode, isVideoEnabled, toggleTheme, toggleVideo, tokens } = useDashboardTheme()

  const [fullName, setFullName] = useState(profile.fullName)
  const [currency, setCurrency] = useState(profile.currency)
  const [savedSuccess, setSavedSuccess] = useState(false)
  const [resetModalOpen, setResetModalOpen] = useState(false)
  const [resetSuccessAlert, setResetSuccessAlert] = useState(false)

  // Sync state if profile changes (e.g. after reset)
  useEffect(() => {
    setFullName(profile.fullName)
    setCurrency(profile.currency)
  }, [profile])

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault()
    updateProfile({ fullName, currency })
    setSavedSuccess(true)
    setTimeout(() => setSavedSuccess(false), 2500)
  }

  const handleLogout = async () => {
    if (isSupabaseConfigured && supabase) {
      await supabase.auth.signOut()
    }
    if (typeof window !== "undefined") {
      localStorage.clear()
      window.location.href = "/login"
    }
  }

  return (
    <div className="flex flex-col gap-6 max-w-2xl">
      <SectionHeader title="Application Settings" subtitle="Personal preferences, currency standards, and display configuration" />

      {resetSuccessAlert && (
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-4 rounded-2xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-200 text-xs flex items-center gap-3 shadow-lg"
        >
          <CheckCircle2 className="size-5 text-emerald-400 shrink-0" />
          <div>
            <p className="font-bold text-white">Data Reset Complete</p>
            <p className="text-[11.5px] text-emerald-200/90">All your financial transactions, accounts, bills, and cloud records have been permanently cleared.</p>
          </div>
        </motion.div>
      )}

      <motion.div
        {...cardEntrance(0.05)}
        className="rounded-3xl p-6 sm:p-8 border shadow-xl backdrop-blur-xl hover:scale-[1.01] transition-transform duration-300"
        style={{
          background: tokens.cardGradient,
          borderColor: tokens.border,
          boxShadow: tokens.cardShadow,
        }}
      >
        <form onSubmit={handleSave} className="space-y-6">
          {savedSuccess && (
            <div className="p-3 rounded-2xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-200 text-xs flex items-center gap-2">
              <CheckCircle2 className="size-4 text-emerald-400" />
              <span>Preferences saved successfully!</span>
            </div>
          )}

          <div className="space-y-4">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider font-display">User Profile</h3>

            <div>
              <label className="text-[11px] font-semibold uppercase tracking-wider block mb-1 text-white/75">
                Full Name
              </label>
              <input
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="w-full px-3.5 py-2.5 border rounded-xl text-sm text-white focus:outline-none"
                style={{ backgroundColor: tokens.nestedSurface, borderColor: tokens.borderNested }}
              />
            </div>

            <div>
              <label className="text-[11px] font-semibold uppercase tracking-wider block mb-1 text-white/75">
                Default Currency
              </label>
              <select
                value={currency}
                onChange={(e) => setCurrency(e.target.value)}
                className="w-full px-3.5 py-2.5 border rounded-xl text-sm text-white focus:outline-none"
                style={{ backgroundColor: tokens.nestedSurface, borderColor: tokens.borderNested }}
              >
                <option value="EGP" className="bg-[#1E0C38] text-white">EGP (Egyptian Pound)</option>
                <option value="USD" className="bg-[#1E0C38] text-white">USD (US Dollar)</option>
                <option value="EUR" className="bg-[#1E0C38] text-white">EUR (Euro)</option>
                <option value="GBP" className="bg-[#1E0C38] text-white">GBP (British Pound)</option>
                <option value="SAR" className="bg-[#1E0C38] text-white">SAR (Saudi Riyal)</option>
                <option value="AED" className="bg-[#1E0C38] text-white">AED (UAE Dirham)</option>
              </select>
            </div>
          </div>

          <div className="pt-4 border-t space-y-4" style={{ borderColor: tokens.borderNested }}>
            <h3 className="text-sm font-bold text-white uppercase tracking-wider font-display">Display & Aesthetics</h3>

            <div className="flex items-center justify-between p-4 rounded-2xl border" style={{ backgroundColor: tokens.nestedSurface, borderColor: tokens.borderNested }}>
              <div>
                <p className="text-xs font-bold text-white font-sans">Dark / Light Mode</p>
                <p className="text-[10.5px] text-white/60">{isDarkMode ? "Dark Riviera Blue" : "Light Cyber Glass"}</p>
              </div>
              <button
                type="button"
                onClick={toggleTheme}
                className="px-3.5 py-1.5 rounded-xl text-xs font-bold text-[#120824] cursor-pointer"
                style={{ background: tokens.dashboardActivePill }}
              >
                Toggle Theme
              </button>
            </div>

            <div className="flex items-center justify-between p-4 rounded-2xl border" style={{ backgroundColor: tokens.nestedSurface, borderColor: tokens.borderNested }}>
              <div>
                <p className="text-xs font-bold text-white font-sans">Background Video Animation</p>
                <p className="text-[10.5px] text-white/60">{isVideoEnabled ? "Seamless video active" : "Static PNG active"}</p>
              </div>
              <button
                type="button"
                onClick={toggleVideo}
                className="px-3.5 py-1.5 rounded-xl text-xs font-bold text-[#120824] cursor-pointer"
                style={{ background: tokens.dashboardActivePill }}
              >
                {isVideoEnabled ? "Pause" : "Play"}
              </button>
            </div>
          </div>

          {/* Danger Zone: Full Data Reset */}
          <div className="pt-4 border-t space-y-3" style={{ borderColor: tokens.borderNested }}>
            <div className="flex items-center gap-2 text-red-400">
              <AlertTriangle className="size-4" />
              <h3 className="text-sm font-bold uppercase tracking-wider font-display text-red-400">Danger Zone</h3>
            </div>

            <div
              className="p-4 rounded-2xl border flex flex-col sm:flex-row sm:items-center justify-between gap-4"
              style={{
                backgroundColor: "rgba(220, 38, 38, 0.08)",
                borderColor: "rgba(239, 68, 68, 0.25)",
              }}
            >
              <div className="space-y-1">
                <p className="text-xs font-bold text-white font-sans">Reset All Account Data</p>
                <p className="text-[11px] text-white/60">
                  Permanently delete all accounts, transactions, bills, categories, and cloud data. Requires your password to confirm.
                </p>
              </div>

              <button
                type="button"
                onClick={() => setResetModalOpen(true)}
                className="px-4 py-2.5 rounded-xl text-xs font-bold text-red-200 bg-red-600/20 hover:bg-red-600/35 border border-red-500/40 hover:border-red-500/70 transition-all flex items-center justify-center gap-2 shrink-0 cursor-pointer shadow-lg shadow-red-950/40"
              >
                <RotateCcw className="size-3.5 text-red-400" />
                <span>Reset All Data</span>
              </button>
            </div>
          </div>

          <div className="flex items-center justify-between pt-4 border-t" style={{ borderColor: tokens.border }}>
            <button
              type="button"
              onClick={handleLogout}
              className="flex items-center gap-2 text-xs font-bold p-2 text-[#FB7185] hover:underline cursor-pointer"
            >
              <LogOut className="size-4" />
              <span>Log out of session</span>
            </button>

            <button
              type="submit"
              className="px-6 py-2.5 rounded-xl text-xs font-bold text-[#120824] shadow-lg cursor-pointer"
              style={{ background: tokens.dashboardActivePill }}
            >
              Save Preferences
            </button>
          </div>
        </form>
      </motion.div>

      {/* Reset Confirmation Modal */}
      <ResetDataModal
        isOpen={resetModalOpen}
        onClose={() => setResetModalOpen(false)}
        onSuccess={() => {
          setResetSuccessAlert(true)
          setTimeout(() => setResetSuccessAlert(false), 6000)
        }}
      />
    </div>
  )
}

// ─── Mobile Floating Bottom Navbar (Exact reference: media_1787967675165.jpg) ─────

const MOBILE_NAV_ITEMS = [
  { id: "dashboard", label: "Dashboard" },
  { id: "bills", label: "Bills" },
  { id: "accounts", label: "Accounts" },
  { id: "categories", label: "Categories" },
] as const

function MobileFloatingNavbar({
  activeSection,
  onNavigate,
}: {
  activeSection: SectionId
  onNavigate: (section: SectionId) => void
}) {
  const { isDarkMode } = useDashboardTheme()
  const [isIdle, setIsIdle] = useState(false)
  const timerRef = useRef<NodeJS.Timeout | null>(null)

  const resetIdleTimer = useCallback(() => {
    setIsIdle(false)
    if (timerRef.current) clearTimeout(timerRef.current)
    timerRef.current = setTimeout(() => {
      setIsIdle(true)
    }, 2000)
  }, [])

  useEffect(() => {
    const handleInteraction = () => resetIdleTimer()

    window.addEventListener("scroll", handleInteraction, { passive: true })
    window.addEventListener("touchstart", handleInteraction, { passive: true })
    window.addEventListener("touchmove", handleInteraction, { passive: true })
    window.addEventListener("mousemove", handleInteraction, { passive: true })

    resetIdleTimer()

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current)
      window.removeEventListener("scroll", handleInteraction)
      window.removeEventListener("touchstart", handleInteraction)
      window.removeEventListener("touchmove", handleInteraction)
      window.removeEventListener("mousemove", handleInteraction)
    }
  }, [resetIdleTimer])

  return (
    <nav
      className={`fixed inset-x-0 bottom-4 z-50 px-3 md:hidden flex justify-center transition-opacity duration-500 ease-in-out pointer-events-none ${
        isIdle ? "opacity-45" : "opacity-100"
      }`}
    >
      <div
        className="pointer-events-auto w-full max-w-[275px] rounded-2xl px-2 py-1.5 backdrop-blur-xl shadow-2xl border transition-all duration-300"
        style={{
          backgroundColor: isDarkMode ? "rgba(18, 8, 36, 0.88)" : "rgba(28, 12, 54, 0.88)",
          borderColor: "rgba(255, 255, 255, 0.15)",
          boxShadow: "0 8px 32px 0 rgba(0, 0, 0, 0.45), inset 0 1px 0 0 rgba(255, 255, 255, 0.15)",
        }}
        onTouchStart={resetIdleTimer}
        onMouseEnter={() => setIsIdle(false)}
      >
        <div className="grid grid-cols-4 items-center w-full text-center">
          {MOBILE_NAV_ITEMS.map((item) => {
            const isActive = item.id === activeSection
            return (
              <button
                key={item.id}
                onClick={() => {
                  resetIdleTimer()
                  onNavigate(item.id)
                }}
                className="flex items-center justify-center py-1 px-0.5 rounded-lg text-[9.5px] font-sans transition-all cursor-pointer whitespace-nowrap text-center tracking-tight"
                style={{
                  color: isActive ? "#FFFFFF" : "rgba(255, 255, 255, 0.65)",
                  fontWeight: isActive ? "700" : "500",
                  backgroundColor: isActive ? "rgba(255, 255, 255, 0.12)" : "transparent",
                }}
              >
                <span>{item.label}</span>
              </button>
            )
          })}
        </div>
      </div>
    </nav>
  )
}

// ─── Main Dashboard Assembly ──────────────────────────────────────

const sectionComponents: Record<SectionId, React.ComponentType<{ onNavigate: (section: SectionId) => void }>> = {
  dashboard: () => null,
  bills: BillsSection,
  accounts: AccountsSection,
  categories: CategoriesSection,
  settings: SettingsSection,
}

function FinancialAnalyticsDashboardInner({
  initialSection = "dashboard",
}: {
  initialSection?: SectionId
}) {
  const [activeSection, setActiveSection] = useState<SectionId>(initialSection)
  const { accounts, transactions, categories, bills, netWorth, totalIncome, totalExpense } = useFinanceData()
  const { profile, initials } = useUserProfile()
  const { isDarkMode, isVideoEnabled, tokens, toggleTheme, toggleVideo } = useDashboardTheme()
  const currencySymbol = getCurrencySymbol(profile.currency)

  const [addTxOpen, setAddTxOpen] = useState(false)
  const [addAccOpen, setAddAccOpen] = useState(false)
  
  // Feature 4: Edit & Delete Modal States
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null)
  const [deletingTransaction, setDeletingTransaction] = useState<Transaction | null>(null)

  // In-App Notification System
  const [notificationsOpen, setNotificationsOpen] = useState(false)
  const [notifications, setNotifications] = useState<NotificationItem[]>([])

  // Push bill reminders to notification bell (due within 3 days)
  useEffect(() => {
    const todayStr = new Date().toISOString().split("T")[0]
    const today = new Date(todayStr)
    const newNotifs: NotificationItem[] = []

    bills.forEach((b) => {
      if (!b.is_completed) {
        const due = new Date(b.due_date)
        const diffDays = Math.ceil((due.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
        if (diffDays >= 0 && diffDays <= 3) {
          newNotifs.push({
            id: `bill_${b.id}`,
            type: "warning",
            title: "Bill Reminder",
            message: `${b.name} is due in ${diffDays === 0 ? "today" : diffDays + " days"} — ${currencySymbol}${b.amount.toFixed(2)}`,
            time: `${diffDays === 0 ? "Today" : "In " + diffDays + "d"}`,
            read: false,
          })
        }
      }
    })

    if (newNotifs.length > 0) {
      setNotifications(newNotifs)
    }
  }, [bills, currencySymbol])

  const unreadNotifsCount = useMemo(() => {
    return notifications.filter((n) => !n.read).length
  }, [notifications])

  return (
    <div className="relative min-h-screen text-white font-sans overflow-x-hidden selection:bg-[#5EEAD4] selection:text-[#120824]">
      {/* Cinematic Dual-Slot Environment Background */}
      <AtmosphericBackground />

      <div className="relative z-10 flex flex-col min-h-screen">
        {/* ─── Top Floating Pill Navbar (Full Viewport Width with 16-24px Margins) ─── */}
        <header className="sticky top-2 sm:top-2.5 z-40 px-4 sm:px-6 w-full">
          <div
            className="flex items-center justify-between px-4 py-2.5 rounded-full border shadow-2xl backdrop-blur-2xl transition-colors duration-500"
            style={{
              backgroundColor: tokens.headerBg,
              borderColor: tokens.headerBorder,
              boxShadow: tokens.cardShadow,
            }}
          >
            {/* Brand Logo */}
            <div
              onClick={() => setActiveSection("dashboard")}
              className="flex items-center gap-2.5 cursor-pointer select-none"
            >
              <div className="size-8 rounded-full bg-white flex items-center justify-center text-black font-bold text-sm shadow-md">
                S
              </div>
              <span className="text-base font-bold tracking-tight font-display text-white">
                Spendly
              </span>
            </div>

            {/* Desktop Navigation Pills */}
            <nav className="hidden md:flex items-center gap-1.5">
              {NAV_ITEMS.map((item) => {
                const isActive = item.id === activeSection
                return (
                  <button
                    key={item.id}
                    onClick={() => setActiveSection(item.id)}
                    className="flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-sans transition-all duration-200 cursor-pointer"
                    style={{
                      background: isActive ? tokens.dashboardActivePill : "transparent",
                      color: isActive ? tokens.dashboardActiveText : "rgba(255, 255, 255, 0.75)",
                      fontWeight: isActive ? "700" : "500",
                    }}
                  >
                    <item.icon className="size-3.5" />
                    <span>{item.label}</span>
                  </button>
                )
              })}
            </nav>

            {/* Right Action Icons */}
            <div className="flex items-center gap-2">
              {/* Notification Bell */}
              <button
                onClick={() => setNotificationsOpen(!notificationsOpen)}
                className="size-8 rounded-full flex items-center justify-center border border-white/10 bg-white/10 hover:bg-white/20 text-white transition-colors relative cursor-pointer"
                title="Notifications"
              >
                <Bell className="size-3.5" />
                {unreadNotifsCount > 0 && (
                  <span className="absolute -top-1 -right-1 size-4 rounded-full bg-[#FEF08A] text-[#120824] text-[9.5px] font-mono font-bold flex items-center justify-center shadow-md">
                    {unreadNotifsCount}
                  </span>
                )}
              </button>

              {/* Video Toggle */}
              <button
                onClick={toggleVideo}
                className="size-8 rounded-full flex items-center justify-center border border-white/10 bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer"
                title={isVideoEnabled ? "Pause background animation" : "Enable background video"}
              >
                {isVideoEnabled ? <Film className="size-3.5 text-[#A7F3D0]" /> : <VideoOff className="size-3.5 text-white/50" />}
              </button>

              {/* Theme Mode Toggle */}
              <button
                onClick={toggleTheme}
                className="size-8 rounded-full flex items-center justify-center border border-white/10 bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer"
                title={isDarkMode ? "Switch to Light Mode" : "Switch to Dark Mode"}
              >
                {isDarkMode ? <Sun className="size-3.5 text-[#FEF08A]" /> : <Moon className="size-3.5 text-[#A7F3D0]" />}
              </button>

              {/* Settings */}
              <button
                onClick={() => setActiveSection("settings")}
                className="size-8 rounded-full flex items-center justify-center border border-white/10 bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer"
                title="Settings"
              >
                <Settings className="size-3.5" />
              </button>

              {/* User Avatar */}
              <div
                onClick={() => setActiveSection("settings")}
                className="size-8 rounded-full flex items-center justify-center text-[#120824] font-bold text-xs shadow-md cursor-pointer ml-1"
                style={{ background: tokens.dashboardActivePill }}
              >
                {initials || "ME"}
              </div>
            </div>
          </div>
        </header>

        {/* ─── Main Content Canvas ─── */}
        <main className="flex-1 px-4 sm:px-8 py-6 max-w-7xl mx-auto w-full pb-28 md:pb-12">
          {activeSection === "dashboard" ? (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 lg:gap-6">
              {/* Left Column (Hero Card + Recent Transactions) */}
              <div className="lg:col-span-7 flex flex-col gap-5 lg:gap-6">
                <NetWorthHeroCard
                  netWorth={netWorth}
                  totalIncome={totalIncome}
                  totalExpense={totalExpense}
                  currencySymbol={currencySymbol}
                  onAddTransaction={() => setAddTxOpen(true)}
                />

                <RecentTransactionsFeed
                  transactions={transactions}
                  currencySymbol={currencySymbol}
                  onNavigate={setActiveSection}
                  onAddTransaction={() => setAddTxOpen(true)}
                  onEditTransaction={(tx) => setEditingTransaction(tx)}
                  onDeleteTransaction={(tx) => setDeletingTransaction(tx)}
                />
              </div>

              {/* Right Column (Active Accounts Deck + Category Budgets) */}
              <div className="lg:col-span-5 flex flex-col gap-5 lg:gap-6">
                <ActiveAccountsDeck
                  accounts={accounts}
                  currencySymbol={currencySymbol}
                  onNavigate={setActiveSection}
                  onAddAccount={() => setAddAccOpen(true)}
                />

                <CategoryBudgetGauges
                  categories={categories}
                  currencySymbol={currencySymbol}
                  onNavigate={setActiveSection}
                />
              </div>
            </div>
          ) : (
            (() => {
              const SectionComponent = sectionComponents[activeSection]
              return <SectionComponent onNavigate={setActiveSection} />
            })()
          )}
        </main>

        {/* Mobile Floating Bottom Navbar */}
        <MobileFloatingNavbar activeSection={activeSection} onNavigate={setActiveSection} />

        {/* Modals & Dialogs */}
        <AddTransactionModal isOpen={addTxOpen} onClose={() => setAddTxOpen(false)} />
        <AddAccountModal isOpen={addAccOpen} onClose={() => setAddAccOpen(false)} />
        <EditTransactionModal
          transaction={editingTransaction}
          isOpen={Boolean(editingTransaction)}
          onClose={() => setEditingTransaction(null)}
        />
        <DeleteTransactionModal
          transaction={deletingTransaction}
          isOpen={Boolean(deletingTransaction)}
          onClose={() => setDeletingTransaction(null)}
        />
        <NotificationPanel
          isOpen={notificationsOpen}
          onClose={() => setNotificationsOpen(false)}
          notifications={notifications}
          onMarkAsRead={(id) => setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)))}
          onClearAll={() => setNotifications([])}
        />
      </div>
    </div>
  )
}

export function FinancialAnalyticsDashboard({
  initialSection = "dashboard",
}: {
  initialSection?: SectionId
}) {
  const [isDarkMode, setIsDarkMode] = useState(true)
  const [isVideoEnabled, setIsVideoEnabled] = useState(true)

  // Initialize theme & video settings from localStorage
  useEffect(() => {
    if (typeof window !== "undefined") {
      const storedTheme = localStorage.getItem("spendly_theme")
      if (storedTheme === "light") {
        setIsDarkMode(false)
      }

      const storedVideo = localStorage.getItem("spendly_bg_video_enabled")
      if (storedVideo !== null) {
        setIsVideoEnabled(storedVideo === "true")
      }
    }
  }, [])

  const toggleTheme = useCallback(() => {
    setIsDarkMode((prev) => {
      const next = !prev
      if (typeof window !== "undefined") {
        localStorage.setItem("spendly_theme", next ? "dark" : "light")
        if (next) {
          document.documentElement.classList.add("dark")
          document.documentElement.classList.remove("light")
        } else {
          document.documentElement.classList.add("light")
          document.documentElement.classList.remove("dark")
        }
      }
      return next
    })
  }, [])

  const toggleVideo = useCallback(() => {
    setIsVideoEnabled((prev) => {
      const next = !prev
      if (typeof window !== "undefined") {
        localStorage.setItem("spendly_bg_video_enabled", String(next))
      }
      return next
    })
  }, [])

  const setThemeMode = useCallback((mode: "dark" | "light") => {
    const isDark = mode === "dark"
    setIsDarkMode(isDark)
    if (typeof window !== "undefined") {
      localStorage.setItem("spendly_theme", mode)
      if (isDark) {
        document.documentElement.classList.add("dark")
        document.documentElement.classList.remove("light")
      } else {
        document.documentElement.classList.add("light")
        document.documentElement.classList.remove("dark")
      }
    }
  }, [])

  const currentTokens = isDarkMode ? TOKENS.dark : TOKENS.light

  const themeContextValue = useMemo(() => ({
    isDarkMode,
    isVideoEnabled,
    tokens: currentTokens,
    toggleTheme,
    toggleVideo,
    setThemeMode,
  }), [isDarkMode, isVideoEnabled, currentTokens, toggleTheme, toggleVideo, setThemeMode])

  return (
    <FinanceDataProvider>
      <DashboardThemeContext.Provider value={themeContextValue}>
        <FinancialAnalyticsDashboardInner initialSection={initialSection} />
      </DashboardThemeContext.Provider>
    </FinanceDataProvider>
  )
}

export default FinancialAnalyticsDashboard
