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
  AlertTriangle, RotateCcw, Lock, Eye, EyeOff, X, Layers,
  Utensils, Coffee, ShoppingBag, Bus, Car, Gift, HeartHandshake, Gamepad2, ShoppingCart,
  Percent, ArrowRight, Compass, ShieldAlert, Calculator, SlidersHorizontal
} from "lucide-react"
import {
  AreaChart, Area, LineChart, Line, BarChart, Bar, Cell,
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
  Bill,
  BudgetPlan,
  AppNotification,
  isTransferTransaction
} from "@/lib/finance-data"
import { useUserProfile } from "@/lib/user-profile"
import { supabase, isSupabaseConfigured } from "@/lib/supabase"
import { ManagePlansModal, BudgetPlannerSection, Active503020Tracker } from "./budget-planner"
import { AuthGuard } from "@/components/auth-guard"
import { clearClientAuthSession } from "@/lib/auth-session"
import { TrialModeProvider, useTrialMode } from "@/lib/trial-mode-context"
import { SpotlightTour } from "@/components/trial/spotlight-tour"
import { TrialSetupWizard } from "@/components/trial/trial-setup-wizard"

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
    headerBg: "rgba(20, 8, 42, 0.45)",
    headerBorder: "rgba(255, 255, 255, 0.16)",
    
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
    headerBg: "rgba(28, 12, 54, 0.35)",
    headerBorder: "rgba(255, 255, 255, 0.20)",
    
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

export const DashboardThemeContext = createContext<DashboardThemeContextType>({
  isDarkMode: true,
  isVideoEnabled: true,
  tokens: TOKENS.dark,
  toggleTheme: () => {},
  toggleVideo: () => {},
  setThemeMode: () => {},
})

export const useDashboardTheme = () => useContext(DashboardThemeContext)

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

type SectionId = (typeof NAV_ITEMS)[number]["id"] | "budget_planner"

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
    return { label: "Checking Account" }
  }
  if (lowerName.includes("credit") || type === "credit") {
    return { label: "Credit Card" }
  }
  if (lowerName.includes("savings") || type === "savings") {
    return { label: "Savings Account" }
  }
  return { label: type === "checking" ? "Checking Account" : type === "credit" ? "Credit Card" : type === "savings" ? "Savings Account" : "Bank Account" }
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
  if (c === "CAD") return "C$"
  if (c === "AUD") return "A$"
  if (c === "JPY") return "¥"
  if (c === "KWD") return "KWD "
  if (c === "QAR") return "QAR "
  return `${c} `
}

// ─── Component: Notification Panel ────────────────────────────────

function NotificationPanel({
  isOpen,
  onClose,
  notifications,
  onMarkAsRead,
  onClearAll,
}: {
  isOpen: boolean
  onClose: () => void
  notifications: AppNotification[]
  onMarkAsRead: (id: string, refId?: string) => void
  onClearAll: () => void
}) {
  const { tokens } = useDashboardTheme()

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-end p-4 pt-20 sm:pr-8 bg-black/40 backdrop-blur-sm">
      <div
        className="w-full max-w-sm rounded-3xl p-5 border shadow-2xl backdrop-blur-2xl transition-all max-h-[85vh] flex flex-col"
        style={{
          background: tokens.cardGradient,
          borderColor: tokens.border,
          boxShadow: tokens.cardShadow,
        }}
      >
        <div className="flex items-center justify-between pb-3 border-b shrink-0" style={{ borderColor: tokens.borderNested }}>
          <div className="flex items-center gap-2">
            <Bell className="size-4 text-white" />
            <h3 className="text-sm font-bold font-display text-white">Notifications ({notifications.length})</h3>
          </div>
          <div className="flex items-center gap-2">
            {notifications.length > 0 && (
              <button
                onClick={onClearAll}
                className="text-[11px] font-semibold text-white/70 hover:text-white transition-colors cursor-pointer"
              >
                Clear all
              </button>
            )}
            <button
              onClick={onClose}
              className="size-7 rounded-full flex items-center justify-center bg-white/10 hover:bg-white/20 text-white cursor-pointer"
            >
              ✕
            </button>
          </div>
        </div>

        <div className="flex flex-col gap-2.5 mt-3 overflow-y-auto pr-1">
          {notifications.length === 0 ? (
            <p className="text-xs text-white/50 text-center py-8">No unread notifications</p>
          ) : (
            notifications.map((n) => (
              <div
                key={n.id}
                className="p-3 rounded-2xl border transition-all hover:bg-white/5 relative group flex items-start justify-between gap-2"
                style={{
                  backgroundColor: tokens.nestedSurface,
                  borderColor: tokens.borderNested,
                }}
              >
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="size-2 rounded-full bg-[#FEF08A] shadow-[0_0_8px_#FEF08A] shrink-0" />
                    <p className="text-xs font-bold text-white font-sans truncate">{n.title || "Bill Alert"}</p>
                  </div>
                  <p className="text-[11px] text-white/80 font-sans mt-1 leading-snug">{n.message}</p>
                  <p className="text-[9.5px] text-white/40 font-mono mt-1.5">{n.time || "Recent"}</p>
                </div>

                <button
                  onClick={() => onMarkAsRead(n.id, n.reference_id)}
                  className="opacity-60 hover:opacity-100 p-1 rounded-lg hover:bg-white/10 text-white/60 hover:text-white cursor-pointer transition-all shrink-0"
                  title="Dismiss notification"
                >
                  <X className="size-3.5" />
                </button>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  )
}

// ─── Modal: Add Transaction (with Feature 1 Fee & Feature 2 Expense Divider) ────

function AddTransactionModal({
  isOpen,
  onClose,
}: {
  isOpen: boolean
  onClose: () => void
}) {
  const { accounts, categories, createCategory, createTransaction, createSplitExpenseTransaction } = useFinanceData()
  const { profile } = useUserProfile()
  const { tokens } = useDashboardTheme()
  const { startPageTour, isTourActive, currentTour, skipCurrentTour } = useTrialMode()
  const currencySymbol = getCurrencySymbol(profile.currency)

  const [newType, setNewType] = useState<"income" | "expense" | "expense_divider" | "transfer">("expense")
  const [newAmount, setNewAmount] = useState("")
  const [newRemainingInAccount, setNewRemainingInAccount] = useState("")
  const [newAccountId, setNewAccountId] = useState("")
  const [newDestAccountId, setNewDestAccountId] = useState("")
  const [newCategoryId, setNewCategoryId] = useState("")
  const [newCustomCategory, setNewCustomCategory] = useState("")
  const [newDate, setNewDate] = useState(new Date().toISOString().split("T")[0])
  const [dateMode, setDateMode] = useState<"yesterday" | "today" | "custom">("today")
  const [newNote, setNewNote] = useState("")

  // Feature 2: High Expense Divider Splits
  const [splitRows, setSplitRows] = useState<Array<{ id: string; categoryId: string; amount: string }>>([
    { id: "split-1", categoryId: "", amount: "" },
    { id: "split-2", categoryId: "", amount: "" },
  ])
  
  // Feature 1: Optional Fee System & InstaPay Toggle
  const [feeMode, setFeeMode] = useState<"none" | "manual" | "instapay">("none")
  const [manualFeeType, setManualFeeType] = useState<"flat" | "percentage">("flat")
  const [manualFeeValue, setManualFeeValue] = useState("")

  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  useEffect(() => {
    if (isOpen) {
      if (newType === 'expense_divider') {
        startPageTour('expense_divider')
      } else {
        startPageTour('record_transaction')
      }
    }
  }, [isOpen, newType, startPageTour])

  const handleClose = () => {
    if (isTourActive && (currentTour?.pageId === 'record_transaction' || currentTour?.pageId === 'expense_divider')) {
      skipCurrentTour()
    }
    onClose()
  }

  useEffect(() => {
    if (accounts.length > 0 && !newAccountId) {
      setNewAccountId(accounts[0].id)
    }
  }, [accounts, newAccountId])

  // Selected account for balance lookups
  const selectedAccount = useMemo(() => {
    return accounts.find((a) => a.id === newAccountId) || accounts[0]
  }, [accounts, newAccountId])

  const selectedAccountBalance = useMemo(() => {
    return Number(selectedAccount?.balance || 0)
  }, [selectedAccount])

  // Expense Divider formula: (Selected Account Balance - Remaining = Result)
  const { totalPrincipal, totalAllocated, remainingToAllocate, isRemainingValid, formulaResult } = useMemo(() => {
    if (newType === "expense_divider") {
      const remainingEntered = parseFloat(newRemainingInAccount)
      const hasInput = newRemainingInAccount.trim() !== "" && !isNaN(remainingEntered)
      
      // Formula: Selected account balance - Remaining = result
      const calculatedResult = hasInput
        ? Math.round((selectedAccountBalance - remainingEntered) * 100) / 100
        : 0

      const allocated = splitRows.reduce((sum, r) => sum + (parseFloat(r.amount) || 0), 0)
      const rem = Math.round((calculatedResult - allocated) * 100) / 100

      return {
        totalPrincipal: calculatedResult,
        formulaResult: calculatedResult,
        totalAllocated: allocated,
        remainingToAllocate: rem,
        isRemainingValid: hasInput && remainingEntered >= 0 && remainingEntered <= selectedAccountBalance,
      }
    } else {
      const principal = parseFloat(newAmount) || 0
      const allocated = splitRows.reduce((sum, r) => sum + (parseFloat(r.amount) || 0), 0)
      const rem = Math.round((principal - allocated) * 100) / 100
      return {
        totalPrincipal: principal,
        formulaResult: principal,
        totalAllocated: allocated,
        remainingToAllocate: rem,
        isRemainingValid: true,
      }
    }
  }, [newType, newRemainingInAccount, selectedAccountBalance, newAmount, splitRows])

  // Live fee calculation
  const calculatedFeeAmount = useMemo(() => {
    const principal = parseFloat(newAmount) || 0
    if (principal <= 0 || newType === "expense_divider") return 0

    if (feeMode === "instapay") {
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
  }, [feeMode, manualFeeType, manualFeeValue, newAmount, newType])

  const handleAddSplitRow = () => {
    setSplitRows((prev) => [
      ...prev,
      { id: `split-${Date.now()}-${Math.random()}`, categoryId: "", amount: "" },
    ])
  }

  const handleRemoveSplitRow = (id: string) => {
    if (splitRows.length <= 1) return
    setSplitRows((prev) => prev.filter((r) => r.id !== id))
  }

  const handleUpdateSplitRow = (id: string, field: "categoryId" | "amount", value: string) => {
    setSplitRows((prev) =>
      prev.map((r) => (r.id === id ? { ...r, [field]: value } : r))
    )
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    setErrorMsg(null)

    try {
      if (!newAccountId) throw new Error("Please select an account.")

      if (newType === "expense_divider") {
        const remainingEntered = parseFloat(newRemainingInAccount)
        if (isNaN(remainingEntered) || remainingEntered < 0) {
          throw new Error("Please enter how much is remaining in the selected account.")
        }
        if (remainingEntered > selectedAccountBalance) {
          throw new Error(
            `Remaining in account (${currencySymbol}${remainingEntered.toFixed(2)}) cannot be greater than the current balance (${currencySymbol}${selectedAccountBalance.toFixed(2)}).`
          )
        }
        if (formulaResult <= 0) {
          throw new Error(
            "Calculated expense result is 0.00 or negative. Enter a remaining amount lower than the current account balance."
          )
        }
        if (Math.abs(remainingToAllocate) > 0.001) {
          throw new Error(
            `You must allocate the full calculated expense (${currencySymbol}${formulaResult.toFixed(2)}) across your categories. Remaining to allocate: ${currencySymbol}${remainingToAllocate.toFixed(2)}`
          )
        }

        const validSplits = splitRows.map((r) => ({
          categoryId: r.categoryId,
          amount: parseFloat(r.amount) || 0,
        }))

        if (validSplits.some((s) => !s.categoryId)) {
          throw new Error("Please select a category for each split row.")
        }
        if (validSplits.some((s) => s.amount <= 0)) {
          throw new Error("All split row amounts must be greater than 0.")
        }

        await createSplitExpenseTransaction({
          totalAmount: formulaResult,
          accountId: newAccountId,
          date: newDate,
          note: newNote,
          splits: validSplits,
        })
      } else {
        const amt = parseFloat(newAmount)
        if (isNaN(amt) || amt <= 0) throw new Error("Please enter a valid amount.")

        let resolvedCatId: string | undefined = newCategoryId === "custom" ? undefined : newCategoryId || undefined
        let resolvedCatName: string | undefined = undefined

        if (newCategoryId === "custom" && newType !== "transfer") {
          const trimmed = newCustomCategory.trim()
          if (!trimmed) {
            throw new Error("Please enter a name for your custom category.")
          }
          const existing = categories.find((c) => c.name.toLowerCase() === trimmed.toLowerCase())
          if (existing) {
            resolvedCatId = existing.id
            resolvedCatName = existing.name
          } else {
            const created = await createCategory({
              name: trimmed,
              type: newType === "income" ? "income" : "expense",
              currency: profile.currency || "EGP",
            })
            resolvedCatId = created?.id
            resolvedCatName = created?.name || trimmed
          }
        }

        await createTransaction({
          account_id: newAccountId,
          destination_account_id: newType === "transfer" ? newDestAccountId : undefined,
          category_id: resolvedCatId,
          category_name: resolvedCatName,
          amount: amt,
          type: newType,
          note: newNote,
          date: newDate,
          fee_amount: calculatedFeeAmount > 0 ? calculatedFeeAmount : undefined,
          fee_type: feeMode === "none" ? undefined : (feeMode === "instapay" ? "instapay" : manualFeeType),
        })
      }

      // Reset form
      setNewAmount("")
      setNewRemainingInAccount("")
      setNewNote("")
      setNewCustomCategory("")
      setFeeMode("none")
      setManualFeeValue("")
      setSplitRows([
        { id: "split-1", categoryId: "", amount: "" },
        { id: "split-2", categoryId: "", amount: "" },
      ])
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
            <p className="text-xs font-sans text-white/70 mt-0.5">Post an expense, income, split divider, or transfer</p>
          </div>
          <button
            onClick={handleClose}
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
          <div data-tour="tour-modal-tx-type">
            <label className="text-[11px] font-semibold uppercase tracking-wider block mb-1.5 font-sans text-white/75">
              Type
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5 p-1 border rounded-xl" style={{ backgroundColor: tokens.nestedSurface, borderColor: tokens.borderNested }}>
              {[
                { id: "income", label: "Income" },
                { id: "expense", label: "Expense" },
                { id: "expense_divider", label: "Expense Divider" },
                { id: "transfer", label: "Transfer" },
              ].map((t) => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => {
                    setNewType(t.id as any)
                    if (t.id === "income" || t.id === "expense_divider") setFeeMode("none")
                  }}
                  className="py-2 px-1 text-center rounded-lg text-xs font-semibold capitalize transition-all font-sans cursor-pointer truncate"
                  style={{
                    background: newType === t.id ? tokens.dashboardActivePill : "transparent",
                    color: newType === t.id ? "#120824" : "rgba(255, 255, 255, 0.75)",
                    fontWeight: newType === t.id ? "bold" : "normal",
                  }}
                >
                  {t.label}
                </button>
              ))}
            </div>
          </div>

          {/* ─── EXPENSE DIVIDER MODE ─── */}
          {newType === "expense_divider" ? (
            <div className="space-y-4">
              {/* Account & Remaining Inputs */}
              <div data-tour="tour-divider-account-remaining" className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Source Account */}
                <div>
                  <label className="text-[11px] font-semibold uppercase tracking-wider block mb-1 font-sans text-white/75">
                    Selected Account
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

                {/* Remaining in Account */}
                <div>
                  <label className="text-[11px] font-semibold uppercase tracking-wider block mb-1 font-sans text-white/75">
                    Remaining in Account ({currencySymbol.trim()})
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    placeholder={selectedAccountBalance > 0 ? `e.g. ${(selectedAccountBalance * 0.5).toFixed(2)}` : "0.00"}
                    value={newRemainingInAccount}
                    onChange={(e) => setNewRemainingInAccount(e.target.value)}
                    className="w-full px-3.5 py-2.5 border rounded-xl text-sm font-mono text-white focus:outline-none transition-colors"
                    style={{ backgroundColor: tokens.nestedSurface, borderColor: tokens.borderNested }}
                  />
                </div>
              </div>

              {/* Dynamic Formula Display Card: (Account Balance - Remaining = Result) */}
              <div
                data-tour="tour-divider-formula"
                className="p-3.5 rounded-2xl border space-y-2.5"
                style={{ backgroundColor: tokens.nestedSurface, borderColor: tokens.borderNested }}
              >
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-white/80 flex items-center gap-1.5 font-display">
                    <Layers className="size-3.5 text-[#A7F3D0]" />
                    Expense Calculation Formula
                  </span>
                  <button
                    type="button"
                    onClick={() => startPageTour('expense_divider', true)}
                    className="flex items-center gap-1 text-[10.5px] font-sans font-semibold text-[#5EEAD4] hover:text-white px-2 py-0.5 rounded-md hover:bg-white/10 transition cursor-pointer"
                  >
                    <span>(?) Guide</span>
                  </button>
                </div>

                <div className="grid grid-cols-3 gap-2 text-center">
                  <div className="p-2 rounded-xl bg-black/25 border border-white/5">
                    <span className="text-[9px] uppercase font-semibold text-white/50 block">Account Balance</span>
                    <span className="text-xs sm:text-sm font-bold font-mono text-white mt-0.5 block">
                      {currencySymbol}{selectedAccountBalance.toFixed(2)}
                    </span>
                  </div>

                  <div className="p-2 rounded-xl bg-black/25 border border-white/5">
                    <span className="text-[9px] uppercase font-semibold text-white/50 block">Remaining</span>
                    <span className="text-xs sm:text-sm font-bold font-mono text-amber-300 mt-0.5 block">
                      {newRemainingInAccount.trim() !== "" ? `${currencySymbol}${parseFloat(newRemainingInAccount || "0").toFixed(2)}` : "—"}
                    </span>
                  </div>

                  <div className="p-2 rounded-xl bg-purple-500/20 border border-purple-500/30">
                    <span className="text-[9px] uppercase font-semibold text-purple-200 block">Total Spent (Result)</span>
                    <span className="text-xs sm:text-sm font-bold font-mono text-emerald-300 mt-0.5 block">
                      {formulaResult > 0 ? `${currencySymbol}${formulaResult.toFixed(2)}` : `${currencySymbol}0.00`}
                    </span>
                  </div>
                </div>

                {parseFloat(newRemainingInAccount) > selectedAccountBalance && (
                  <p className="text-[11px] text-rose-300 font-sans">
                    ⚠️ Remaining amount cannot exceed selected account balance ({currencySymbol}{selectedAccountBalance.toFixed(2)}).
                  </p>
                )}
              </div>

              {/* Date & Note */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-semibold uppercase tracking-wider block mb-1 font-sans text-white/75">
                    Date
                  </label>
                  <div className="grid grid-cols-3 gap-1 p-1 border rounded-xl mb-1.5" style={{ backgroundColor: tokens.nestedSurface, borderColor: tokens.borderNested }}>
                    <button
                      type="button"
                      onClick={() => {
                        setDateMode("yesterday")
                        const d = new Date()
                        d.setDate(d.getDate() - 1)
                        setNewDate(d.toISOString().split("T")[0])
                      }}
                      className="py-1.5 px-1 text-center rounded-lg text-xs font-semibold transition-all font-sans cursor-pointer truncate"
                      style={{
                        background: dateMode === "yesterday" ? tokens.dashboardActivePill : "transparent",
                        color: dateMode === "yesterday" ? "#120824" : "rgba(255, 255, 255, 0.75)",
                        fontWeight: dateMode === "yesterday" ? "bold" : "normal",
                      }}
                    >
                      Yesterday
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setDateMode("today")
                        setNewDate(new Date().toISOString().split("T")[0])
                      }}
                      className="py-1.5 px-1 text-center rounded-lg text-xs font-semibold transition-all font-sans cursor-pointer truncate"
                      style={{
                        background: dateMode === "today" ? tokens.dashboardActivePill : "transparent",
                        color: dateMode === "today" ? "#120824" : "rgba(255, 255, 255, 0.75)",
                        fontWeight: dateMode === "today" ? "bold" : "normal",
                      }}
                    >
                      Today
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setDateMode("custom")
                      }}
                      className="py-1.5 px-1 text-center rounded-lg text-xs font-semibold transition-all font-sans cursor-pointer truncate flex items-center justify-center gap-1"
                      style={{
                        background: dateMode === "custom" ? tokens.dashboardActivePill : "transparent",
                        color: dateMode === "custom" ? "#120824" : "rgba(255, 255, 255, 0.75)",
                        fontWeight: dateMode === "custom" ? "bold" : "normal",
                      }}
                    >
                      <Calendar className="size-3" />
                      Custom
                    </button>
                  </div>

                  {dateMode === "custom" && (
                    <motion.div
                      initial={{ opacity: 0, y: -4 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -4 }}
                    >
                      <input
                        type="date"
                        required
                        value={newDate}
                        onChange={(e) => setNewDate(e.target.value)}
                        className="w-full px-3.5 py-2 border rounded-xl text-xs font-sans text-white focus:outline-none transition-colors"
                        style={{ backgroundColor: tokens.nestedSurface, borderColor: tokens.borderNested }}
                      />
                    </motion.div>
                  )}
                </div>

                <div>
                  <label className="text-[11px] font-semibold uppercase tracking-wider block mb-1 font-sans text-white/75">
                    Description / Note
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Weekend expenses, Weekly grocery run"
                    value={newNote}
                    onChange={(e) => setNewNote(e.target.value)}
                    className="w-full px-3.5 py-2.5 border rounded-xl text-sm font-sans text-white focus:outline-none"
                    style={{ backgroundColor: tokens.nestedSurface, borderColor: tokens.borderNested }}
                  />
                </div>
              </div>

              {/* Category Allocations for the Result Amount */}
              <div data-tour="tour-divider-splits" className="p-4 rounded-2xl border space-y-3" style={{ backgroundColor: tokens.nestedSurface, borderColor: tokens.borderNested }}>
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-xs font-bold font-display text-white flex items-center gap-1.5">
                      <Layers className="size-3.5 text-purple-300" />
                      Category Allocations
                    </span>
                    <p className="text-[10.5px] text-white/60 mt-0.5">
                      Log every transaction to distribute the {currencySymbol}{formulaResult.toFixed(2)} result
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={handleAddSplitRow}
                    className="px-2.5 py-1 rounded-lg text-xs font-bold text-[#120824] flex items-center gap-1 cursor-pointer transition-all shadow-sm"
                    style={{ background: tokens.dashboardActivePill }}
                  >
                    <Plus className="size-3" /> Add Category
                  </button>
                </div>

                {/* Dynamic split rows */}
                <div className="space-y-2 max-h-[220px] overflow-y-auto pr-1">
                  {splitRows.map((row, idx) => (
                    <div key={row.id} className="flex items-center gap-2">
                      <select
                        value={row.categoryId}
                        onChange={(e) => handleUpdateSplitRow(row.id, "categoryId", e.target.value)}
                        required
                        className="flex-1 px-3 py-2 border rounded-xl text-xs font-sans text-white focus:outline-none bg-[#1E0C38]/80"
                        style={{ borderColor: tokens.borderNested }}
                      >
                        <option value="" className="bg-[#1E0C38] text-white">Select Category</option>
                        {categories.map((c) => (
                          <option key={c.id} value={c.id} className="bg-[#1E0C38] text-white">
                            {c.name}
                          </option>
                        ))}
                      </select>

                      <div className="w-28 relative">
                        <input
                          type="number"
                          step="0.01"
                          required
                          placeholder="Amount"
                          value={row.amount}
                          onChange={(e) => handleUpdateSplitRow(row.id, "amount", e.target.value)}
                          className="w-full px-2.5 py-2 border rounded-xl text-xs font-mono text-white focus:outline-none bg-[#1E0C38]/80 text-right"
                          style={{ borderColor: tokens.borderNested }}
                        />
                      </div>

                      {splitRows.length > 1 && (
                        <button
                          type="button"
                          onClick={() => handleRemoveSplitRow(row.id)}
                          className="p-2 rounded-xl text-white/40 hover:text-red-400 hover:bg-red-500/10 cursor-pointer transition-all"
                          title="Remove row"
                        >
                          <Trash2 className="size-3.5" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>

                {/* Running Remainder Banner */}
                <div data-tour="tour-divider-allocator" className="pt-2.5 border-t border-white/10 flex flex-wrap items-center justify-between gap-2 text-xs font-mono">
                  <span className="text-white/60">Allocated: {currencySymbol}{totalAllocated.toFixed(2)} / {currencySymbol}{formulaResult.toFixed(2)}</span>
                  <span className={`font-bold ${Math.abs(remainingToAllocate) <= 0.001 && formulaResult > 0 ? "text-emerald-300" : "text-amber-300"}`}>
                    {Math.abs(remainingToAllocate) <= 0.001 && formulaResult > 0 ? (
                      "✓ Fully allocated"
                    ) : (
                      `Remaining to allocate: ${currencySymbol}${remainingToAllocate.toFixed(2)}`
                    )}
                  </span>
                </div>
              </div>
            </div>
          ) : (
            /* ─── STANDARD TRANSACTION MODES (Income, Expense, Transfer) ─── */
            <>
              <div data-tour="tour-modal-tx-amount-date" className="grid grid-cols-1 sm:grid-cols-2 gap-3">
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
                  <div className="grid grid-cols-3 gap-1 p-1 border rounded-xl mb-1.5" style={{ backgroundColor: tokens.nestedSurface, borderColor: tokens.borderNested }}>
                    <button
                      type="button"
                      onClick={() => {
                        setDateMode("yesterday")
                        const d = new Date()
                        d.setDate(d.getDate() - 1)
                        setNewDate(d.toISOString().split("T")[0])
                      }}
                      className="py-1.5 px-1 text-center rounded-lg text-xs font-semibold transition-all font-sans cursor-pointer truncate"
                      style={{
                        background: dateMode === "yesterday" ? tokens.dashboardActivePill : "transparent",
                        color: dateMode === "yesterday" ? "#120824" : "rgba(255, 255, 255, 0.75)",
                        fontWeight: dateMode === "yesterday" ? "bold" : "normal",
                      }}
                    >
                      Yesterday
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setDateMode("today")
                        setNewDate(new Date().toISOString().split("T")[0])
                      }}
                      className="py-1.5 px-1 text-center rounded-lg text-xs font-semibold transition-all font-sans cursor-pointer truncate"
                      style={{
                        background: dateMode === "today" ? tokens.dashboardActivePill : "transparent",
                        color: dateMode === "today" ? "#120824" : "rgba(255, 255, 255, 0.75)",
                        fontWeight: dateMode === "today" ? "bold" : "normal",
                      }}
                    >
                      Today
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setDateMode("custom")
                      }}
                      className="py-1.5 px-1 text-center rounded-lg text-xs font-semibold transition-all font-sans cursor-pointer truncate flex items-center justify-center gap-1"
                      style={{
                        background: dateMode === "custom" ? tokens.dashboardActivePill : "transparent",
                        color: dateMode === "custom" ? "#120824" : "rgba(255, 255, 255, 0.75)",
                        fontWeight: dateMode === "custom" ? "bold" : "normal",
                      }}
                    >
                      <Calendar className="size-3" />
                      Custom
                    </button>
                  </div>

                  {dateMode === "custom" && (
                    <motion.div
                      initial={{ opacity: 0, y: -4 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -4 }}
                    >
                      <input
                        type="date"
                        required
                        value={newDate}
                        onChange={(e) => setNewDate(e.target.value)}
                        className="w-full px-3.5 py-2 border rounded-xl text-xs font-sans text-white focus:outline-none transition-colors"
                        style={{ backgroundColor: tokens.nestedSurface, borderColor: tokens.borderNested }}
                      />
                    </motion.div>
                  )}
                </div>
              </div>

              {/* Account & Category */}
              <div data-tour="tour-modal-tx-account-category" className="grid grid-cols-1 sm:grid-cols-2 gap-3">
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
              <div data-tour="tour-modal-tx-note">
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
            </>
          )}

          {/* FEATURE 1: OPTIONAL FEE SYSTEM & INSTAPAY TOGGLE */}
          {(newType === "expense" || newType === "transfer") && (
            <div data-tour="tour-modal-tx-fee" className="p-3.5 rounded-2xl border" style={{ backgroundColor: tokens.nestedSurface, borderColor: tokens.borderNested }}>
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
              onClick={handleClose}
              className="px-4 py-2.5 rounded-xl text-xs font-semibold text-white/70 hover:text-white transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              data-tour="tour-modal-tx-submit"
              type="submit"
              disabled={isSubmitting || (newType === "expense_divider" && (Math.abs(remainingToAllocate) > 0.001 || formulaResult <= 0 || !isRemainingValid))}
              className="px-6 py-2.5 rounded-xl text-xs font-bold transition-all font-sans shadow-lg cursor-pointer hover:scale-[1.02] text-[#120824] disabled:opacity-50"
              style={{ background: tokens.dashboardActivePill }}
            >
              {isSubmitting
                ? "Recording..."
                : newType === "expense_divider"
                ? (formulaResult > 0 ? `Log Split Expenses (${currencySymbol}${formulaResult.toFixed(2)})` : "Log Split Expenses")
                : "Save Transaction"}
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
  const [dateMode, setDateMode] = useState<"yesterday" | "today" | "custom">("today")
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
      const txDate = transaction.date || new Date().toISOString().split("T")[0]
      setDate(txDate)

      const todayStr = new Date().toISOString().split("T")[0]
      const yesterdayObj = new Date()
      yesterdayObj.setDate(yesterdayObj.getDate() - 1)
      const yesterdayStr = yesterdayObj.toISOString().split("T")[0]

      if (txDate === todayStr) {
        setDateMode("today")
      } else if (txDate === yesterdayStr) {
        setDateMode("yesterday")
      } else {
        setDateMode("custom")
      }

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
              <div className="grid grid-cols-3 gap-1 p-1 border rounded-xl mb-1.5" style={{ backgroundColor: tokens.nestedSurface, borderColor: tokens.borderNested }}>
                <button
                  type="button"
                  onClick={() => {
                    setDateMode("yesterday")
                    const d = new Date()
                    d.setDate(d.getDate() - 1)
                    setDate(d.toISOString().split("T")[0])
                  }}
                  className="py-1.5 px-1 text-center rounded-lg text-xs font-semibold transition-all font-sans cursor-pointer truncate"
                  style={{
                    background: dateMode === "yesterday" ? tokens.dashboardActivePill : "transparent",
                    color: dateMode === "yesterday" ? "#120824" : "rgba(255, 255, 255, 0.75)",
                    fontWeight: dateMode === "yesterday" ? "bold" : "normal",
                  }}
                >
                  Yesterday
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setDateMode("today")
                    setDate(new Date().toISOString().split("T")[0])
                  }}
                  className="py-1.5 px-1 text-center rounded-lg text-xs font-semibold transition-all font-sans cursor-pointer truncate"
                  style={{
                    background: dateMode === "today" ? tokens.dashboardActivePill : "transparent",
                    color: dateMode === "today" ? "#120824" : "rgba(255, 255, 255, 0.75)",
                    fontWeight: dateMode === "today" ? "bold" : "normal",
                  }}
                >
                  Today
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setDateMode("custom")
                  }}
                  className="py-1.5 px-1 text-center rounded-lg text-xs font-semibold transition-all font-sans cursor-pointer truncate flex items-center justify-center gap-1"
                  style={{
                    background: dateMode === "custom" ? tokens.dashboardActivePill : "transparent",
                    color: dateMode === "custom" ? "#120824" : "rgba(255, 255, 255, 0.75)",
                    fontWeight: dateMode === "custom" ? "bold" : "normal",
                  }}
                >
                  <Calendar className="size-3" />
                  Custom
                </button>
              </div>

              {dateMode === "custom" && (
                <motion.div
                  initial={{ opacity: 0, y: -4 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -4 }}
                >
                  <input
                    type="date"
                    required
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="w-full px-3.5 py-2 border rounded-xl text-xs font-sans text-white focus:outline-none transition-colors"
                    style={{ backgroundColor: tokens.nestedSurface, borderColor: tokens.borderNested }}
                  />
                </motion.div>
              )}
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

// ─── Modal: Month Close-Out Summary (Feature 3) ──────────────────

function MonthSummaryModal({
  isOpen,
  onClose,
}: {
  isOpen: boolean
  onClose: () => void
}) {
  const { transactions, accounts } = useFinanceData()
  const { profile } = useUserProfile()
  const { tokens } = useDashboardTheme()
  const currencySymbol = getCurrencySymbol(profile.currency)

  const [selectedAccountId, setSelectedAccountId] = useState<string>("all")

  // Current calendar month boundaries
  const now = new Date()
  const currentYear = now.getFullYear()
  const currentMonth = now.getMonth()
  const monthName = now.toLocaleString("default", { month: "long" })
  
  const startCurrentMonthStr = `${currentYear}-${String(currentMonth + 1).padStart(2, "0")}-01`
  const lastDayCurrentMonth = new Date(currentYear, currentMonth + 1, 0).getDate()
  const endCurrentMonthStr = `${currentYear}-${String(currentMonth + 1).padStart(2, "0")}-${String(lastDayCurrentMonth).padStart(2, "0")}`

  // Last calendar month boundaries
  const prevDate = new Date(currentYear, currentMonth - 1, 1)
  const prevYear = prevDate.getFullYear()
  const prevMonth = prevDate.getMonth()
  const prevMonthName = prevDate.toLocaleString("default", { month: "long" })

  const startPrevMonthStr = `${prevYear}-${String(prevMonth + 1).padStart(2, "0")}-01`
  const lastDayPrevMonth = new Date(prevYear, prevMonth + 1, 0).getDate()
  const endPrevMonthStr = `${prevYear}-${String(prevMonth + 1).padStart(2, "0")}-${String(lastDayPrevMonth).padStart(2, "0")}`

  // Filter transactions by account & date
  const filteredCurrentTxs = useMemo(() => {
    return transactions.filter((t) => {
      if (selectedAccountId !== "all" && t.account_id !== selectedAccountId) return false
      return t.date >= startCurrentMonthStr && t.date <= endCurrentMonthStr
    })
  }, [transactions, selectedAccountId, startCurrentMonthStr, endCurrentMonthStr])

  const filteredPrevTxs = useMemo(() => {
    return transactions.filter((t) => {
      if (selectedAccountId !== "all" && t.account_id !== selectedAccountId) return false
      return t.date >= startPrevMonthStr && t.date <= endPrevMonthStr
    })
  }, [transactions, selectedAccountId, startPrevMonthStr, endPrevMonthStr])

  // Current month metrics
  const currentIncome = useMemo(() => {
    return filteredCurrentTxs
      .filter((t) => t.type === "income" && !t.is_fee && !isTransferTransaction(t))
      .reduce((sum, t) => sum + t.amount, 0)
  }, [filteredCurrentTxs])

  const currentExpense = useMemo(() => {
    return filteredCurrentTxs
      .filter((t) => t.type === "expense" && !isTransferTransaction(t))
      .reduce((sum, t) => sum + t.amount, 0)
  }, [filteredCurrentTxs])

  const currentNet = currentIncome - currentExpense
  const savingsRate = currentIncome > 0 ? (currentNet / currentIncome) * 100 : 0

  // Previous month metrics
  const prevIncome = useMemo(() => {
    return filteredPrevTxs
      .filter((t) => t.type === "income" && !t.is_fee && !isTransferTransaction(t))
      .reduce((sum, t) => sum + t.amount, 0)
  }, [filteredPrevTxs])

  const prevExpense = useMemo(() => {
    return filteredPrevTxs
      .filter((t) => t.type === "expense" && !isTransferTransaction(t))
      .reduce((sum, t) => sum + t.amount, 0)
  }, [filteredPrevTxs])

  const prevNet = prevIncome - prevExpense

  // Percentage changes
  const calcChangePct = (curr: number, prev: number) => {
    if (prev === 0) return curr > 0 ? "+100%" : "0%"
    const diff = ((curr - prev) / Math.abs(prev)) * 100
    const sign = diff >= 0 ? "+" : ""
    return `${sign}${diff.toFixed(1)}%`
  }

  // Biggest single transaction (excluding transfers)
  const biggestTx = useMemo(() => {
    const nonTransfers = filteredCurrentTxs.filter((t) => !isTransferTransaction(t))
    if (nonTransfers.length === 0) return null
    return [...nonTransfers].sort((a, b) => b.amount - a.amount)[0]
  }, [filteredCurrentTxs])

  // Top spending categories and chart data
  const categoryChartData = useMemo(() => {
    const map = new Map<string, number>()
    filteredCurrentTxs
      .filter((t) => t.type === "expense" && !isTransferTransaction(t))
      .forEach((t) => {
        const name = t.category_name || "General"
        map.set(name, (map.get(name) || 0) + t.amount)
      })

    return Array.from(map.entries())
      .map(([name, amount]) => ({ name, amount }))
      .sort((a, b) => b.amount - a.amount)
  }, [filteredCurrentTxs])

  if (!isOpen) return null

  const COLORS = ["#A7F3D0", "#FEF08A", "#C084FC", "#38BDF8", "#FB7185", "#F472B6", "#FBBF24"]

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="w-full max-w-2xl rounded-3xl p-6 sm:p-7 border shadow-2xl backdrop-blur-2xl relative overflow-hidden max-h-[90vh] overflow-y-auto space-y-5"
        style={{
          background: tokens.cardGradient,
          borderColor: tokens.border,
          boxShadow: tokens.cardShadow,
        }}
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b" style={{ borderColor: tokens.border }}>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-lg font-bold font-display text-white">
                {monthName} {currentYear} Summary
              </h3>
              <span className="px-2 py-0.5 rounded text-[9.5px] font-mono uppercase bg-white/10 text-white/80">
                Close-Out
              </span>
            </div>
            <p className="text-xs font-sans text-white/70 mt-0.5">
              Comprehensive month close-out metrics & performance review
            </p>
          </div>
          <button
            onClick={onClose}
            className="size-8 rounded-full flex items-center justify-center bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer"
          >
            ✕
          </button>
        </div>

        {/* Account Selector */}
        <div>
          <label className="text-[11px] font-semibold uppercase tracking-wider block mb-1.5 font-sans text-white/75">
            Scope by Account
          </label>
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
        </div>

        {/* Core KPI Metrics */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="p-3.5 rounded-2xl border" style={{ backgroundColor: tokens.nestedSurface, borderColor: tokens.borderNested }}>
            <span className="text-[10px] uppercase font-semibold text-white/60 block">Total Income</span>
            <p className="text-base font-bold font-mono text-emerald-400 mt-0.5">
              +{currencySymbol}{currentIncome.toLocaleString("en-US", { minimumFractionDigits: 2 })}
            </p>
          </div>

          <div className="p-3.5 rounded-2xl border" style={{ backgroundColor: tokens.nestedSurface, borderColor: tokens.borderNested }}>
            <span className="text-[10px] uppercase font-semibold text-white/60 block">Total Expenses</span>
            <p className="text-base font-bold font-mono text-rose-400 mt-0.5">
              -{currencySymbol}{currentExpense.toLocaleString("en-US", { minimumFractionDigits: 2 })}
            </p>
          </div>

          <div className="p-3.5 rounded-2xl border" style={{ backgroundColor: tokens.nestedSurface, borderColor: tokens.borderNested }}>
            <span className="text-[10px] uppercase font-semibold text-white/60 block">Net Balance</span>
            <p className={`text-base font-bold font-mono mt-0.5 ${currentNet >= 0 ? "text-cyan-300" : "text-amber-300"}`}>
              {currencySymbol}{currentNet.toLocaleString("en-US", { minimumFractionDigits: 2 })}
            </p>
          </div>

          <div className="p-3.5 rounded-2xl border" style={{ backgroundColor: tokens.nestedSurface, borderColor: tokens.borderNested }}>
            <span className="text-[10px] uppercase font-semibold text-white/60 block">Savings Rate</span>
            <p className="text-base font-bold font-mono text-purple-300 mt-0.5">
              {savingsRate.toFixed(1)}%
            </p>
          </div>
        </div>

        {/* Month vs Previous Month Comparison */}
        <div className="p-4 rounded-2xl border space-y-3" style={{ backgroundColor: tokens.nestedSurface, borderColor: tokens.borderNested }}>
          <h4 className="text-xs font-bold uppercase tracking-wider text-white/70">
            Comparison vs Previous Month ({prevMonthName})
          </h4>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {/* Income Comp */}
            <div className="p-3 rounded-xl bg-white/5 border border-white/10 flex items-center justify-between">
              <div>
                <span className="text-[10px] text-white/50 block uppercase">Income</span>
                <span className="text-xs font-mono font-bold text-white">
                  {currencySymbol}{currentIncome.toFixed(0)} vs {currencySymbol}{prevIncome.toFixed(0)}
                </span>
              </div>
              <span className={`text-xs font-mono font-bold px-2 py-0.5 rounded ${
                currentIncome >= prevIncome ? "bg-emerald-500/20 text-emerald-300" : "bg-rose-500/20 text-rose-300"
              }`}>
                {calcChangePct(currentIncome, prevIncome)}
              </span>
            </div>

            {/* Expense Comp */}
            <div className="p-3 rounded-xl bg-white/5 border border-white/10 flex items-center justify-between">
              <div>
                <span className="text-[10px] text-white/50 block uppercase">Expenses</span>
                <span className="text-xs font-mono font-bold text-white">
                  {currencySymbol}{currentExpense.toFixed(0)} vs {currencySymbol}{prevExpense.toFixed(0)}
                </span>
              </div>
              <span className={`text-xs font-mono font-bold px-2 py-0.5 rounded ${
                currentExpense <= prevExpense ? "bg-emerald-500/20 text-emerald-300" : "bg-rose-500/20 text-rose-300"
              }`}>
                {calcChangePct(currentExpense, prevExpense)}
              </span>
            </div>

            {/* Net Comp */}
            <div className="p-3 rounded-xl bg-white/5 border border-white/10 flex items-center justify-between">
              <div>
                <span className="text-[10px] text-white/50 block uppercase">Net Profit</span>
                <span className="text-xs font-mono font-bold text-white">
                  {currencySymbol}{currentNet.toFixed(0)} vs {currencySymbol}{prevNet.toFixed(0)}
                </span>
              </div>
              <span className={`text-xs font-mono font-bold px-2 py-0.5 rounded ${
                currentNet >= prevNet ? "bg-emerald-500/20 text-emerald-300" : "bg-amber-500/20 text-amber-300"
              }`}>
                {calcChangePct(currentNet, prevNet)}
              </span>
            </div>
          </div>
        </div>

        {/* Biggest Single Transaction */}
        {biggestTx && (
          <div className="p-4 rounded-2xl border flex items-center justify-between" style={{ backgroundColor: tokens.nestedSurface, borderColor: tokens.borderNested }}>
            <div className="flex items-center gap-3">
              <div className="size-9 rounded-xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center font-bold text-amber-300">
                <Receipt className="size-4.5" />
              </div>
              <div>
                <span className="text-[10px] uppercase font-semibold text-white/60 block">Biggest Single Transaction</span>
                <p className="text-xs font-bold text-white font-sans">{biggestTx.description}</p>
                <p className="text-[10px] text-white/50 font-mono">{biggestTx.category_name} • {biggestTx.date}</p>
              </div>
            </div>
            <span className="text-sm font-bold font-mono text-rose-300">
              -{currencySymbol}{biggestTx.amount.toFixed(2)}
            </span>
          </div>
        )}

        {/* Spending Per Category Chart */}
        <div className="p-4 rounded-2xl border space-y-3" style={{ backgroundColor: tokens.nestedSurface, borderColor: tokens.borderNested }}>
          <h4 className="text-xs font-bold uppercase tracking-wider text-white/70">
            Spending by Category ({monthName})
          </h4>
          {categoryChartData.length === 0 ? (
            <p className="text-xs text-white/50 text-center py-6">No expenses recorded for this period.</p>
          ) : (
            <div className="h-44 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={categoryChartData} margin={{ top: 10, right: 10, left: -20, bottom: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.08)" vertical={false} />
                  <XAxis
                    dataKey="name"
                    stroke="rgba(255,255,255,0.6)"
                    fontSize={10}
                    tickLine={false}
                    interval={0}
                    angle={-15}
                    textAnchor="end"
                  />
                  <YAxis stroke="rgba(255,255,255,0.6)" fontSize={10} tickLine={false} />
                  <Tooltip
                    content={({ active, payload, label }) => {
                      if (!active || !payload?.length) return null
                      const val = Number(payload[0]?.value || 0)
                      return (
                        <div className="rounded-xl border p-2.5 text-xs shadow-2xl backdrop-blur-md bg-[#160b29]/95 border-white/20 text-white min-w-[140px]">
                          <p className="text-xs font-bold text-white mb-1">{label}</p>
                          <p className="text-[11px] font-medium text-emerald-300">
                            Spent: <span className="font-bold text-white">{currencySymbol}{val.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                          </p>
                        </div>
                      )
                    }}
                  />
                  <Bar dataKey="amount" radius={[6, 6, 0, 0]}>
                    {categoryChartData.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>

        {/* Close Button */}
        <div className="flex items-center justify-end pt-3 border-t" style={{ borderColor: tokens.border }}>
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2.5 rounded-xl text-xs font-bold text-[#120824] shadow-lg cursor-pointer"
            style={{ background: tokens.dashboardActivePill }}
          >
            Done
          </button>
        </div>
      </motion.div>
    </div>
  )
}

// ─── Modal: Category Suggestions (Feature 5) ───────────────────────

const FIXED_CATEGORY_SUGGESTIONS = [
  { name: "Restaurants", icon: Utensils },
  { name: "Cafés", icon: Coffee },
  { name: "Groceries", icon: ShoppingCart },
  { name: "Subscriptions", icon: Calendar },
  { name: "Bills", icon: Receipt },
  { name: "Public Transportation", icon: Bus },
  { name: "Private Transportation", icon: Car },
  { name: "Gifts", icon: Gift },
  { name: "Giving", icon: HeartHandshake },
  { name: "Games", icon: Gamepad2 },
  { name: "Shopping", icon: ShoppingBag },
]

function CategorySuggestionsModal({
  isOpen,
  onClose,
}: {
  isOpen: boolean
  onClose: () => void
}) {
  const { categories, createCategory } = useFinanceData()
  const { profile } = useUserProfile()
  const { tokens } = useDashboardTheme()
  const currencySymbol = getCurrencySymbol(profile.currency)

  const [budgetInputs, setBudgetInputs] = useState<{ [key: string]: string }>({})
  const [addingName, setAddingName] = useState<string | null>(null)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  // Filter out suggestions already present in user's categories
  const availableSuggestions = useMemo(() => {
    const existingNames = new Set(categories.map((c) => c.name.trim().toLowerCase()))
    return FIXED_CATEGORY_SUGGESTIONS.filter((s) => !existingNames.has(s.name.toLowerCase()))
  }, [categories])

  if (!isOpen) return null

  const handleAddSuggestion = async (suggestionName: string) => {
    setAddingName(suggestionName)
    setErrorMsg(null)
    try {
      const budgetVal = budgetInputs[suggestionName]
      const parsedBudget = budgetVal ? parseFloat(budgetVal) : undefined

      await createCategory({
        name: suggestionName,
        type: "expense",
        budget: parsedBudget && parsedBudget > 0 ? parsedBudget : undefined,
        currency: profile.currency || "EGP",
      })

      // Clear input
      setBudgetInputs((prev) => {
        const next = { ...prev }
        delete next[suggestionName]
        return next
      })
    } catch (err: any) {
      setErrorMsg(err?.message || "Failed to add category suggestion.")
    } finally {
      setAddingName(null)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="w-full max-w-xl rounded-3xl p-6 sm:p-7 border shadow-2xl backdrop-blur-2xl relative overflow-hidden max-h-[90vh] overflow-y-auto space-y-4"
        style={{
          background: tokens.cardGradient,
          borderColor: tokens.border,
          boxShadow: tokens.cardShadow,
        }}
      >
        <div className="flex items-center justify-between pb-4 border-b" style={{ borderColor: tokens.border }}>
          <div>
            <h3 className="text-lg font-bold font-display text-white">Browse Category Suggestions</h3>
            <p className="text-xs font-sans text-white/70 mt-0.5">Quickly add popular spending categories with optional budgets</p>
          </div>
          <button
            onClick={onClose}
            className="size-8 rounded-full flex items-center justify-center bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer"
          >
            ✕
          </button>
        </div>

        {errorMsg && (
          <div className="p-3 rounded-xl bg-red-500/20 border border-red-500/40 text-red-200 text-xs">
            {errorMsg}
          </div>
        )}

        <div className="space-y-2.5 max-h-[400px] overflow-y-auto pr-1">
          {availableSuggestions.length === 0 ? (
            <div className="p-8 text-center text-white/60 text-xs rounded-2xl bg-white/5 border border-white/10">
              🎉 Awesome! You have already added all the suggested categories.
            </div>
          ) : (
            availableSuggestions.map((s) => {
              const IconComp = s.icon
              const isAdding = addingName === s.name

              return (
                <div
                  key={s.name}
                  className="p-3.5 rounded-2xl border flex flex-col sm:flex-row sm:items-center justify-between gap-3 backdrop-blur-md hover:bg-white/5 transition-all"
                  style={{
                    backgroundColor: tokens.nestedSurface,
                    borderColor: tokens.borderNested,
                  }}
                >
                  <div className="flex items-center gap-3">
                    <div className="size-9 rounded-xl bg-purple-500/20 border border-purple-500/30 flex items-center justify-center text-purple-300">
                      <IconComp className="size-4.5" />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-white font-sans">{s.name}</h4>
                      <span className="text-[10px] text-white/50 uppercase">Expense Category</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      step="0.01"
                      placeholder={`Budget (${currencySymbol.trim()}) - opt`}
                      value={budgetInputs[s.name] || ""}
                      onChange={(e) =>
                        setBudgetInputs((prev) => ({ ...prev, [s.name]: e.target.value }))
                      }
                      className="w-36 px-2.5 py-1.5 border rounded-xl text-xs font-mono text-white focus:outline-none bg-black/20"
                      style={{ borderColor: tokens.borderNested }}
                    />

                    <button
                      type="button"
                      disabled={isAdding}
                      onClick={() => handleAddSuggestion(s.name)}
                      className="px-3.5 py-1.5 rounded-xl text-xs font-bold text-[#120824] flex items-center gap-1 cursor-pointer transition-all shadow-md hover:scale-[1.02] disabled:opacity-50"
                      style={{ background: tokens.dashboardActivePill }}
                    >
                      <Plus className="size-3.5" />
                      <span>{isAdding ? "Adding..." : "Add"}</span>
                    </button>
                  </div>
                </div>
              )
            })
          )}
        </div>

        <div className="flex items-center justify-end pt-3 border-t" style={{ borderColor: tokens.border }}>
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2.5 rounded-xl text-xs font-semibold text-white/70 hover:text-white cursor-pointer"
          >
            Close
          </button>
        </div>
      </motion.div>
    </div>
  )
}

// ─── Modal: Edit Bill (Feature 8) ─────────────────────────────────

function EditBillModal({
  bill,
  isOpen,
  onClose,
}: {
  bill: Bill | null
  isOpen: boolean
  onClose: () => void
}) {
  const { accounts, categories, updateBill } = useFinanceData()
  const { profile } = useUserProfile()
  const { tokens } = useDashboardTheme()
  const currencySymbol = getCurrencySymbol(profile.currency)

  const [name, setName] = useState(bill?.name || "")
  const [type, setType] = useState<"income" | "expense" | "transfer">(bill?.type || "expense")
  const [amount, setAmount] = useState(bill?.amount ? String(bill.amount) : "")
  const [accountId, setAccountId] = useState(bill?.account_id || "")
  const [destAccountId, setDestAccountId] = useState(bill?.destination_account_id || "")
  const [categoryId, setCategoryId] = useState(bill?.category_id || "")
  const [dueDate, setDueDate] = useState(bill?.due_date || "")
  const [recurrence, setRecurrence] = useState<"one-off" | "daily" | "monthly" | "custom">(bill?.recurrence || "one-off")
  const [recurrenceDays, setRecurrenceDays] = useState(bill?.recurrence_days ? String(bill.recurrence_days) : "30")
  
  // Fee
  const [feeAmount, setFeeAmount] = useState(bill?.fee_amount ? String(bill.fee_amount) : "")
  const [feeType, setFeeType] = useState<"flat" | "percentage" | "instapay">(bill?.fee_type || "flat")

  // Recurring prompt state
  const [promptRecurring, setPromptRecurring] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  useEffect(() => {
    if (bill) {
      setName(bill.name)
      setType(bill.type)
      setAmount(String(bill.amount))
      setAccountId(bill.account_id)
      setDestAccountId(bill.destination_account_id || "")
      setCategoryId(bill.category_id || "")
      setDueDate(bill.due_date)
      setRecurrence(bill.recurrence)
      setRecurrenceDays(bill.recurrence_days ? String(bill.recurrence_days) : "30")
      setFeeAmount(bill.fee_amount ? String(bill.fee_amount) : "")
      setFeeType(bill.fee_type || "flat")
      setPromptRecurring(false)
      setErrorMsg(null)
    }
  }, [bill])

  if (!isOpen || !bill) return null

  const handleSave = async (applyToAllFuture: boolean) => {
    setIsSubmitting(true)
    setErrorMsg(null)
    try {
      const parsedAmount = parseFloat(amount)
      if (isNaN(parsedAmount) || parsedAmount <= 0) throw new Error("Please enter a valid amount.")
      if (!name.trim()) throw new Error("Please enter a name for the bill.")
      if (!accountId) throw new Error("Please select an account.")

      await updateBill(
        bill.id,
        {
          name: name.trim(),
          type,
          amount: parsedAmount,
          account_id: accountId,
          destination_account_id: type === "transfer" ? destAccountId : undefined,
          category_id: type !== "transfer" && categoryId ? categoryId : undefined,
          due_date: dueDate,
          recurrence,
          recurrence_days: recurrence === "custom" ? (parseInt(recurrenceDays) || 30) : undefined,
          fee_amount: parseFloat(feeAmount) || 0,
          fee_type: feeType,
        },
        applyToAllFuture
      )

      onClose()
    } catch (err: any) {
      setErrorMsg(err?.message || "Failed to update bill.")
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleInitialSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (bill.recurrence !== "one-off") {
      setPromptRecurring(true)
    } else {
      handleSave(false)
    }
  }

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
            <h3 className="text-lg font-bold font-display text-white">Edit Bill / Obligation</h3>
            <p className="text-xs font-sans text-white/70 mt-0.5">Modify due date, amount, recurrence, and accounts</p>
          </div>
          <button onClick={onClose} className="size-8 rounded-full flex items-center justify-center bg-white/10 hover:bg-white/20 text-white cursor-pointer">✕</button>
        </div>

        {errorMsg && (
          <div className="mt-4 p-3 rounded-xl bg-red-500/20 border border-red-500/40 text-red-200 text-xs">
            {errorMsg}
          </div>
        )}

        {promptRecurring ? (
          <div className="py-6 space-y-4 text-center">
            <h4 className="text-base font-bold text-white font-display">Update Recurring Bill</h4>
            <p className="text-xs text-white/80 max-w-sm mx-auto leading-relaxed">
              This is a recurring bill. Would you like to apply these changes to this occurrence only, or this and all future occurrences?
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-4">
              <button
                type="button"
                disabled={isSubmitting}
                onClick={() => handleSave(false)}
                className="w-full sm:w-auto px-4 py-2.5 rounded-xl text-xs font-semibold bg-white/10 hover:bg-white/20 text-white cursor-pointer transition-all"
              >
                This occurrence only
              </button>
              <button
                type="button"
                disabled={isSubmitting}
                onClick={() => handleSave(true)}
                className="w-full sm:w-auto px-5 py-2.5 rounded-xl text-xs font-bold text-[#120824] shadow-lg cursor-pointer transition-all"
                style={{ background: tokens.dashboardActivePill }}
              >
                {isSubmitting ? "Saving..." : "This & all future occurrences"}
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleInitialSubmit} className="mt-5 space-y-4">
            <div>
              <label className="text-[11px] font-semibold uppercase tracking-wider block mb-1 text-white/75">
                Bill Title
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-3.5 py-2.5 border rounded-xl text-sm text-white focus:outline-none"
                style={{ backgroundColor: tokens.nestedSurface, borderColor: tokens.borderNested }}
              />
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
                  Type
                </label>
                <select
                  value={type}
                  onChange={(e) => setType(e.target.value as any)}
                  className="w-full px-3.5 py-2.5 border rounded-xl text-sm text-white focus:outline-none"
                  style={{ backgroundColor: tokens.nestedSurface, borderColor: tokens.borderNested }}
                >
                  <option value="expense" className="bg-[#1E0C38] text-white">Expense</option>
                  <option value="income" className="bg-[#1E0C38] text-white">Income</option>
                  <option value="transfer" className="bg-[#1E0C38] text-white">Transfer</option>
                </select>
              </div>

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
                  <option value="one-off" className="bg-[#1E0C38] text-white">One-Off</option>
                  <option value="monthly" className="bg-[#1E0C38] text-white">Monthly</option>
                  <option value="daily" className="bg-[#1E0C38] text-white">Daily</option>
                  <option value="custom" className="bg-[#1E0C38] text-white">Custom Interval</option>
                </select>
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
                  {accounts.map((a) => (
                    <option key={a.id} value={a.id} className="bg-[#1E0C38] text-white">
                      {a.name} ({currencySymbol}{Number(a.balance || 0).toFixed(2)})
                    </option>
                  ))}
                </select>
              </div>

              {type !== "transfer" ? (
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
              ) : (
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
                    <option value="" className="bg-[#1E0C38] text-white">Select destination</option>
                    {accounts.map((a) => (
                      <option key={a.id} value={a.id} className="bg-[#1E0C38] text-white">
                        {a.name}
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>

            <div className="flex items-center justify-end gap-3 pt-4 border-t" style={{ borderColor: tokens.border }}>
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
                className="px-5 py-2.5 rounded-xl text-xs font-bold text-[#120824] shadow-lg cursor-pointer"
                style={{ background: tokens.dashboardActivePill }}
              >
                Save Changes
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
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  if (!isOpen) return null

  const handleClose = () => {
    setName("")
    setStartingBalance("")
    setErrorMessage(null)
    onClose()
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) return
    setErrorMessage(null)
    setIsSubmitting(true)
    try {
      await createAccount({
        name: name.trim(),
        type,
        starting_balance: parseFloat(startingBalance) || 0,
        currency: profile.currency || "EGP",
      })
      handleClose()
    } catch (err: any) {
      console.error("Failed to create account:", err)
      setErrorMessage(err?.message || "Failed to create account. Please try again.")
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
          <button onClick={handleClose} className="text-white/60 hover:text-white cursor-pointer">✕</button>
        </div>

        {errorMessage && (
          <div className="mt-3 p-3 rounded-xl bg-red-500/20 border border-red-500/40 text-red-200 text-xs">
            {errorMessage}
          </div>
        )}

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
            <button type="button" onClick={handleClose} className="px-4 py-2 text-xs font-semibold text-white/70 hover:text-white cursor-pointer">
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !name.trim()}
              className="px-6 py-2.5 rounded-xl text-xs font-bold text-[#120824] cursor-pointer disabled:opacity-50"
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
  mode: "deposit" | "withdrawal" | "pay"
  isOpen: boolean
  onClose: () => void
}) {
  const { depositToHeldFund, withdrawFromHeldFund, payFromHeldFund } = useFinanceData()
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
      } else if (mode === "withdrawal") {
        await withdrawFromHeldFund(heldFund.id, amt, note, date)
      } else {
        await payFromHeldFund(heldFund.id, amt, note, date)
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

  const titleText = mode === "deposit"
    ? `Deposit Into ${heldFund.name}`
    : mode === "withdrawal"
    ? `Withdraw From ${heldFund.name}`
    : `Pay from ${heldFund.name}`

  const subtitleText = mode === "deposit"
    ? `Transfers funds from ${heldFund.account_name || "linked account"} into this held pot`
    : mode === "withdrawal"
    ? `Returns funds back to ${heldFund.account_name || "linked account"}`
    : `Expense paid directly from this held fund. Does NOT touch ${heldFund.account_name || "linked account"} or main transactions.`

  const buttonText = mode === "deposit"
    ? "Confirm Deposit"
    : mode === "withdrawal"
    ? "Confirm Withdrawal"
    : "Record Payment"

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
              {titleText}
            </h3>
            <p className="text-xs text-white/70">
              {subtitleText}
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
              placeholder={mode === "pay" ? "e.g. Paid dinner, groceries" : "e.g. Set aside salary bonus"}
              value={note}
              onChange={(e) => setNote(e.target.value)}
              className="w-full px-3.5 py-2.5 border rounded-xl text-sm text-white focus:outline-none"
              style={{ backgroundColor: tokens.nestedSurface, borderColor: tokens.borderNested }}
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-3 border-t" style={{ borderColor: tokens.border }}>
            <button type="button" onClick={onClose} className="px-4 py-2 text-xs font-semibold text-white/70 cursor-pointer">
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-6 py-2.5 rounded-xl text-xs font-bold text-[#120824] shadow-lg cursor-pointer transition-opacity disabled:opacity-50"
              style={{ background: tokens.dashboardActivePill }}
            >
              {isSubmitting ? "Processing..." : buttonText}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  )
}

// ─── Modal: Edit Held Fund History Record ──────────────────────────

function EditHeldFundHistoryModal({
  historyItem,
  isOpen,
  onClose,
  onSuccess,
}: {
  historyItem: HeldFundHistory | null
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
}) {
  const { updateHeldFundHistory } = useFinanceData()
  const { profile } = useUserProfile()
  const { tokens } = useDashboardTheme()
  const currencySymbol = getCurrencySymbol(profile.currency)

  const [amount, setAmount] = useState(historyItem ? String(historyItem.amount) : "")
  const [note, setNote] = useState(historyItem ? historyItem.note || "" : "")
  const [date, setDate] = useState(historyItem ? historyItem.date : new Date().toISOString().split("T")[0])
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  useEffect(() => {
    if (historyItem) {
      setAmount(String(historyItem.amount))
      setNote(historyItem.note || "")
      setDate(historyItem.date)
      setErrorMsg(null)
    }
  }, [historyItem])

  if (!isOpen || !historyItem) return null

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    setErrorMsg(null)
    try {
      const amt = parseFloat(amount)
      if (isNaN(amt) || amt <= 0) throw new Error("Please enter a valid amount.")
      await updateHeldFundHistory(historyItem, { amount: amt, note, date })
      onSuccess()
      onClose()
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to update record.")
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
            <h3 className="text-base font-bold font-display text-white">Edit Fund Transaction</h3>
            <p className="text-xs text-white/70">Modify history entry and auto-adjust fund balance</p>
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
                required
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full px-3.5 py-2.5 border rounded-xl text-sm font-mono text-white focus:outline-none"
                style={{ backgroundColor: tokens.nestedSurface, borderColor: tokens.borderNested }}
              />
            </div>
          </div>

          <div>
            <label className="text-[11px] font-semibold uppercase tracking-wider block mb-1 text-white/75">
              Note
            </label>
            <input
              type="text"
              placeholder="e.g. Grocery payment, Rent deposit"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              className="w-full px-3.5 py-2.5 border rounded-xl text-sm text-white focus:outline-none"
              style={{ backgroundColor: tokens.nestedSurface, borderColor: tokens.borderNested }}
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t" style={{ borderColor: tokens.border }}>
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl text-xs font-semibold text-white/80 hover:text-white cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2.5 rounded-xl text-xs font-bold text-[#120824] shadow-lg cursor-pointer transition-opacity disabled:opacity-50"
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

// ─── Component: Main Net Worth & Trajectory Hero (Features 5 & 6) ──

function NetWorthHeroCard({
  accounts,
  transactions,
  currencySymbol,
  onAddTransaction,
}: {
  accounts: Account[]
  transactions: Transaction[]
  currencySymbol: string
  onAddTransaction: () => void
}) {
  const { tokens } = useDashboardTheme()

  // Account filter state for Net Worth calculation (persisted to localStorage)
  const [selectedAccountIds, setSelectedAccountIds] = useState<string[]>(() => {
    if (typeof window !== "undefined") {
      try {
        const stored = localStorage.getItem("spendly_networth_selected_accounts")
        if (stored) {
          const parsed = JSON.parse(stored)
          if (Array.isArray(parsed) && parsed.length > 0) {
            const existingIds = new Set(accounts.map((a) => a.id))
            const valid = parsed.filter((id: string) => existingIds.has(id))
            if (valid.length > 0) return valid
          }
        }
      } catch (e) {
        console.error("Failed reading saved accounts selection", e)
      }
    }
    return accounts.map((a) => a.id)
  })
  const [isAccountFilterOpen, setIsAccountFilterOpen] = useState(false)

  // Persist helper
  const updateSelectedAccounts = useCallback((newSelection: string[]) => {
    setSelectedAccountIds(newSelection)
    if (typeof window !== "undefined") {
      try {
        localStorage.setItem("spendly_networth_selected_accounts", JSON.stringify(newSelection))
      } catch (e) {
        console.error("Failed saving accounts selection", e)
      }
    }
  }, [])

  // Keep in sync if accounts change / mount, preserving localStorage choice
  useEffect(() => {
    if (accounts.length > 0) {
      if (typeof window !== "undefined") {
        try {
          const stored = localStorage.getItem("spendly_networth_selected_accounts")
          if (stored) {
            const parsed = JSON.parse(stored)
            if (Array.isArray(parsed) && parsed.length > 0) {
              const existingIds = new Set(accounts.map((a) => a.id))
              const valid = parsed.filter((id: string) => existingIds.has(id))
              if (valid.length > 0) {
                setSelectedAccountIds(valid)
                return
              }
            }
          }
        } catch (e) {
          console.error("Failed syncing stored accounts selection", e)
        }
      }
      setSelectedAccountIds((prev) => {
        if (prev.length === 0) return accounts.map((a) => a.id)
        const existingIds = new Set(accounts.map((a) => a.id))
        const valid = prev.filter((id) => existingIds.has(id))
        return valid.length > 0 ? valid : accounts.map((a) => a.id)
      })
    }
  }, [accounts])

  const selectedSet = useMemo(() => new Set(selectedAccountIds), [selectedAccountIds])

  // Dynamic Net Worth calculated for only selected accounts
  const dynamicNetWorth = useMemo(() => {
    return accounts
      .filter((a) => selectedSet.has(a.id))
      .reduce((sum, a) => sum + (Number(a.balance) || 0), 0)
  }, [accounts, selectedSet])

  const isAllAccountsSelected = useMemo(() => {
    return accounts.length > 0 && selectedAccountIds.length === accounts.length
  }, [accounts, selectedAccountIds])

  // Current month income & expenses totals (resets automatically each new calendar month)
  const { currentMonthIncome, currentMonthExpense, currentMonthNetChange } = useMemo(() => {
    const now = new Date()
    const currentYear = now.getFullYear()
    const currentMonth = String(now.getMonth() + 1).padStart(2, "0")
    const currentYearMonth = `${currentYear}-${currentMonth}`

    let inc = 0
    let exp = 0

    transactions.forEach((tx) => {
      if (tx.date && tx.date.startsWith(currentYearMonth) && !isTransferTransaction(tx)) {
        if (tx.type === "income" && !tx.is_fee) {
          inc += Math.abs(tx.amount)
        } else if (tx.type === "expense") {
          exp += Math.abs(tx.amount)
        }
      }
    })

    return {
      currentMonthIncome: inc,
      currentMonthExpense: exp,
      currentMonthNetChange: inc - exp,
    }
  }, [transactions])

  // Minimalist Trajectory Sparkline for selected accounts (1st of month to today)
  const dynamicSparklineData = useMemo(() => {
    const now = new Date()
    const currentYear = now.getFullYear()
    const currentMonth = now.getMonth()
    const currentDay = now.getDate()
    const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate()

    const selectedAccTxs = transactions.filter((t) => selectedSet.has(t.account_id))

    const totalSelectedStartingBalance = accounts
      .filter((a) => selectedSet.has(a.id))
      .reduce((sum, a) => sum + (Number(a.starting_balance_cents || 0) / 100), 0)

    const points = []
    for (let day = 1; day <= Math.min(currentDay, daysInMonth); day++) {
      const dayStr = `${currentYear}-${String(currentMonth + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`
      const txsUpToDay = selectedAccTxs.filter((t) => t.date && t.date <= dayStr)
      const txSum = txsUpToDay.reduce((sum, t) => sum + (t.type === "income" ? Math.abs(t.amount) : -Math.abs(t.amount)), 0)

      points.push({
        date: String(day),
        value: Number((totalSelectedStartingBalance + txSum).toFixed(2)),
      })
    }

    if (points.length === 0) {
      points.push({ date: "1", value: dynamicNetWorth })
    }

    return points
  }, [accounts, transactions, selectedSet, dynamicNetWorth])

  return (
    <motion.div
      data-tour="tour-net-worth"
      {...cardEntrance(0.05)}
      className="relative rounded-3xl p-6 sm:p-7 border backdrop-blur-xl hover:scale-[1.01] transition-transform duration-300 group"
      style={{
        background: tokens.cardGradient,
        borderColor: tokens.border,
        boxShadow: tokens.cardShadow,
      }}
    >
      <div className="absolute inset-0 rounded-3xl pointer-events-none border border-white/10" />

      {/* Header */}
      <div className={`relative flex flex-wrap items-start justify-between gap-4 transition-all ${isAccountFilterOpen ? "z-30" : "z-10"}`}>
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="size-2 rounded-full bg-[#34D399] shadow-[0_0_8px_#34D399]" />
            <p className="text-[11px] font-bold tracking-[0.14em] uppercase font-sans text-white/85">
              TOTAL NET WORTH
            </p>
          </div>

          <div className="flex items-center gap-3.5 flex-wrap">
            <h1 className="text-4xl sm:text-5xl font-bold tracking-tight font-mono text-white">
              {currencySymbol}{dynamicNetWorth.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </h1>

            {/* Account Selector Pill for Net Worth */}
            {accounts.length > 1 && (
              <div className="relative z-50">
                <button
                  type="button"
                  onClick={() => setIsAccountFilterOpen((prev) => !prev)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold border transition-all cursor-pointer shadow-sm hover:scale-[1.02] relative z-50"
                  style={{
                    backgroundColor: isAllAccountsSelected ? "rgba(255, 255, 255, 0.08)" : "rgba(168, 85, 247, 0.20)",
                    borderColor: isAllAccountsSelected ? tokens.borderNested : "rgba(168, 85, 247, 0.45)",
                    color: isAllAccountsSelected ? "rgba(255, 255, 255, 0.85)" : "#E9D5FF",
                  }}
                >
                  <Wallet className="size-3.5 text-purple-300" />
                  <span>
                    {isAllAccountsSelected
                      ? "All accounts selected"
                      : `${selectedAccountIds.length} of ${accounts.length} accounts`}
                  </span>
                  <ChevronDown className="size-3 text-white/60" />
                </button>

                {/* Account Selection Dropdown & Full Blocking Backdrop */}
                <AnimatePresence>
                  {isAccountFilterOpen && (
                    <>
                      {/* Full-screen blocking backdrop: blocks all underlying chart/canvas clicks & hovers */}
                      <div
                        className="fixed inset-0 z-40 bg-black/40 backdrop-blur-[1px] cursor-default"
                        onClick={(e) => {
                          e.stopPropagation()
                          setIsAccountFilterOpen(false)
                        }}
                      />

                      {/* Small, compact dropdown right under the button */}
                      <motion.div
                        initial={{ opacity: 0, y: 6, scale: 0.96 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 6, scale: 0.96 }}
                        transition={{ duration: 0.15 }}
                        onClick={(e) => e.stopPropagation()}
                        className="absolute left-0 top-full mt-2 w-64 p-3 rounded-2xl border shadow-2xl backdrop-blur-2xl z-50 space-y-2.5"
                        style={{
                          background: "linear-gradient(135deg, rgba(28, 12, 54, 0.98) 0%, rgba(18, 8, 36, 0.98) 100%)",
                          borderColor: "rgba(167, 139, 250, 0.4)",
                          boxShadow: "0 20px 40px -15px rgba(0,0,0,0.8), 0 0 20px rgba(124, 58, 237, 0.2)",
                        }}
                      >
                        <div className="flex items-center justify-between pb-2 border-b border-white/10 text-xs">
                          <span className="font-bold text-white font-display">Calculate Net Worth:</span>
                          <button
                            type="button"
                            onClick={() => {
                              if (isAllAccountsSelected) {
                                updateSelectedAccounts([accounts[0].id])
                              } else {
                                updateSelectedAccounts(accounts.map((a) => a.id))
                              }
                            }}
                            className="text-[10.5px] font-semibold text-[#A7F3D0] hover:underline cursor-pointer"
                          >
                            {isAllAccountsSelected ? "Deselect All" : "Select All"}
                          </button>
                        </div>

                        <div className="space-y-1 max-h-48 overflow-y-auto pr-1">
                          {accounts.map((acc) => {
                            const isChecked = selectedSet.has(acc.id)
                            return (
                              <div
                                key={acc.id}
                                onClick={() => {
                                  if (selectedAccountIds.includes(acc.id)) {
                                    if (selectedAccountIds.length > 1) {
                                      updateSelectedAccounts(selectedAccountIds.filter((id) => id !== acc.id))
                                    }
                                  } else {
                                    updateSelectedAccounts([...selectedAccountIds, acc.id])
                                  }
                                }}
                                className={`flex items-center justify-between p-2.5 rounded-xl border text-xs cursor-pointer transition-all duration-150 select-none ${
                                  isChecked
                                    ? "bg-purple-500/25 border-purple-400/50 text-white"
                                    : "bg-white/5 border-white/5 text-white/55 hover:bg-white/10 hover:text-white"
                                }`}
                              >
                                <div className="flex items-center gap-2 min-w-0">
                                  <div
                                    className={`size-4 rounded border flex items-center justify-center shrink-0 transition-colors ${
                                      isChecked
                                        ? "bg-purple-500 border-purple-400 text-white"
                                        : "bg-white/5 border-white/30 text-transparent"
                                    }`}
                                  >
                                    <Check className="size-2.5 stroke-[3]" />
                                  </div>
                                  <span className="font-semibold truncate">{acc.name}</span>
                                </div>
                                <span className="font-mono text-[11px] shrink-0 ml-2">
                                  {currencySymbol}{Number(acc.balance || 0).toFixed(2)}
                                </span>
                              </div>
                            )
                          })}
                        </div>

                        <div className="pt-2 border-t border-white/10 flex items-center justify-between">
                          <span className="text-[10px] font-mono text-white/50">
                            {selectedAccountIds.length}/{accounts.length} active
                          </span>
                          <button
                            type="button"
                            onClick={() => setIsAccountFilterOpen(false)}
                            className="px-3.5 py-1 text-xs font-bold rounded-lg text-[#120824] shadow-sm cursor-pointer hover:scale-[1.02] transition-all"
                            style={{ background: tokens.dashboardActivePill }}
                          >
                            Done
                          </button>
                        </div>
                      </motion.div>
                    </>
                  )}
                </AnimatePresence>
              </div>
            )}

            <div
              className="flex items-center gap-1 text-xs font-bold font-mono px-3 py-1 rounded-full border shadow-sm backdrop-blur-md"
              style={{
                backgroundColor: currentMonthNetChange >= 0 ? "rgba(52, 211, 153, 0.20)" : "rgba(251, 113, 133, 0.20)",
                borderColor: currentMonthNetChange >= 0 ? "rgba(52, 211, 153, 0.40)" : "rgba(251, 113, 133, 0.40)",
                color: currentMonthNetChange >= 0 ? tokens.gain : tokens.loss,
              }}
            >
              {currentMonthNetChange >= 0 ? <ArrowUpRight className="size-3" /> : <ArrowDownLeft className="size-3" />}
              <span>
                {currentMonthNetChange >= 0 ? "+" : "-"}{currencySymbol}{Math.abs(currentMonthNetChange).toFixed(2)} this month
              </span>
            </div>
          </div>
        </div>

        <button
          data-tour="tour-quick-actions"
          onClick={onAddTransaction}
          className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold transition-all font-sans cursor-pointer shadow-lg bg-black/40 hover:bg-black/55 border border-white/20 hover:border-white/30 text-white hover:scale-[1.02]"
        >
          <Plus className="size-3.5" />
          <span>Add Transaction</span>
        </button>
      </div>

      {/* Trajectory Sparkline (1st of month to today) */}
      <div className={`relative mt-6 h-32 sm:h-36 w-full transition-opacity duration-200 ${isAccountFilterOpen ? "z-0 pointer-events-none opacity-40 select-none" : "z-10"}`}>
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={dynamicSparklineData} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
            <XAxis hide dataKey="date" />
            <YAxis hide domain={["dataMin - 100", "dataMax + 100"]} />
            {!isAccountFilterOpen && (
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
            )}
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

      {/* Feature 5: Evenly Spaced Bottom 2 Cards (Current Month Income & Current Month Expenses) */}
      <div className="relative z-10 mt-4 pt-4 border-t grid grid-cols-2 gap-4" style={{ borderColor: tokens.borderNested }}>
        {/* Current Month Income (Green) */}
        <div
          className="border rounded-2xl p-4 backdrop-blur-md"
          style={{
            backgroundColor: tokens.incomeWell,
            borderColor: tokens.borderIncome,
          }}
        >
          <p className="text-[10.5px] font-semibold uppercase tracking-wider font-sans text-white/75">
            CURRENT MONTH INCOME
          </p>
          <p className="text-base sm:text-lg font-bold font-mono mt-1" style={{ color: tokens.gain }}>
            +{currencySymbol}{currentMonthIncome.toLocaleString("en-US", { minimumFractionDigits: 2 })}
          </p>
        </div>

        {/* Current Month Expenses (Red/Pink) */}
        <div
          className="border rounded-2xl p-4 backdrop-blur-md"
          style={{
            backgroundColor: tokens.expenseWell,
            borderColor: tokens.borderExpense,
          }}
        >
          <p className="text-[10.5px] font-semibold uppercase tracking-wider font-sans text-white/75">
            CURRENT MONTH EXPENSES
          </p>
          <p className="text-base sm:text-lg font-bold font-mono mt-1" style={{ color: tokens.loss }}>
            -{currencySymbol}{currentMonthExpense.toLocaleString("en-US", { minimumFractionDigits: 2 })}
          </p>
        </div>
      </div>
    </motion.div>
  )
}

// ─── Modal: All Transactions Full History ─────────────────────────

function AllTransactionsModal({
  isOpen,
  onClose,
  transactions,
  currencySymbol,
  onEditTransaction,
  onDeleteTransaction,
}: {
  isOpen: boolean
  onClose: () => void
  transactions: Transaction[]
  currencySymbol: string
  onEditTransaction: (tx: Transaction) => void
  onDeleteTransaction: (tx: Transaction) => void
}) {
  const { tokens } = useDashboardTheme()
  const { batchUpdateTransactionDates } = useFinanceData()
  const [filter, setFilter] = useState<"all" | "expense" | "income">("all")
  const [search, setSearch] = useState("")

  // Multi-select state
  const [selectedTxIds, setSelectedTxIds] = useState<Set<string>>(new Set())
  const [isBulkDateModalOpen, setIsBulkDateModalOpen] = useState(false)
  const [bulkDate, setBulkDate] = useState(new Date().toISOString().split("T")[0])
  const [isBulkSubmitting, setIsBulkSubmitting] = useState(false)
  const [bulkError, setBulkError] = useState<string | null>(null)
  const [bulkSuccessMsg, setBulkSuccessMsg] = useState<string | null>(null)

  const filtered = useMemo(() => {
    return transactions.filter((t) => {
      const matchesFilter = filter === "all" || t.type === filter
      const matchesSearch =
        t.description.toLowerCase().includes(search.toLowerCase()) ||
        (t.category_name || "").toLowerCase().includes(search.toLowerCase()) ||
        (t.account_name || "").toLowerCase().includes(search.toLowerCase()) ||
        (t.note || "").toLowerCase().includes(search.toLowerCase()) ||
        (t.date || "").includes(search)
      return matchesFilter && matchesSearch
    })
  }, [transactions, filter, search])

  const allSelected = useMemo(() => {
    return filtered.length > 0 && filtered.every((t) => selectedTxIds.has(t.id))
  }, [filtered, selectedTxIds])

  const handleToggleSelect = (id: string) => {
    setSelectedTxIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) {
        next.delete(id)
      } else {
        next.add(id)
      }
      return next
    })
  }

  const handleToggleSelectAll = () => {
    if (allSelected) {
      setSelectedTxIds(new Set())
    } else {
      setSelectedTxIds(new Set(filtered.map((t) => t.id)))
    }
  }

  const handleApplyBulkDate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (selectedTxIds.size === 0 || !bulkDate) return

    setIsBulkSubmitting(true)
    setBulkError(null)

    try {
      await batchUpdateTransactionDates(Array.from(selectedTxIds), bulkDate)
      setBulkSuccessMsg(`Successfully updated date for ${selectedTxIds.size} transaction${selectedTxIds.size > 1 ? "s" : ""}!`)
      setSelectedTxIds(new Set())
      setTimeout(() => {
        setIsBulkDateModalOpen(false)
        setBulkSuccessMsg(null)
      }, 1200)
    } catch (err: any) {
      setBulkError(err.message || "Failed to update transaction dates.")
    } finally {
      setIsBulkSubmitting(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/70 backdrop-blur-md">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 10 }}
        className="w-full max-w-3xl rounded-3xl p-5 sm:p-7 border shadow-2xl backdrop-blur-2xl relative overflow-hidden max-h-[90vh] flex flex-col"
        style={{
          background: tokens.cardGradient,
          borderColor: tokens.border,
          boxShadow: tokens.cardShadow,
        }}
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b shrink-0" style={{ borderColor: tokens.border }}>
          <div className="flex items-center gap-2.5">
            <div className="size-9 rounded-xl flex items-center justify-center bg-purple-500/20 border border-purple-500/40 text-purple-300">
              <Receipt className="size-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-bold font-display text-white">All Transactions</h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-white/10 text-white/80 border border-white/10">
                  {transactions.length} logged
                </span>
              </div>
              <p className="text-xs font-sans text-white/70 mt-0.5">Complete history across all accounts</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="size-8 rounded-full flex items-center justify-center bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer"
          >
            ✕
          </button>
        </div>

        {/* Filter & Search Bar */}
        <div className="py-3.5 space-y-2.5 shrink-0">
          <div className="flex flex-col sm:flex-row sm:items-center gap-2.5">
            <div className="relative flex-1">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-white/60" />
              <input
                type="text"
                placeholder="Search by merchant, note, category, account, or date (YYYY-MM-DD)..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border rounded-2xl text-xs font-sans text-white focus:outline-none transition-colors backdrop-blur-md placeholder:text-white/40"
                style={{
                  backgroundColor: tokens.nestedSurface,
                  borderColor: tokens.borderNested,
                }}
              />
            </div>

            {/* Filter Tabs */}
            <div className="flex items-center p-1 border rounded-full self-start sm:self-auto" style={{ backgroundColor: "rgba(16, 8, 36, 0.45)", borderColor: tokens.borderNested }}>
              {[
                { id: "all", label: "All" },
                { id: "expense", label: "Expenses" },
                { id: "income", label: "Income" },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setFilter(tab.id as any)}
                  className="px-3 py-1 text-xs font-semibold rounded-full transition-all font-sans cursor-pointer"
                  style={{
                    backgroundColor: filter === tab.id ? tokens.filterActivePill : "transparent",
                    color: filter === tab.id ? tokens.filterActiveText : "rgba(255, 255, 255, 0.75)",
                    fontWeight: filter === tab.id ? "bold" : "normal",
                  }}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          {/* Multi-Select Action Banner inside Modal */}
          <AnimatePresence>
            {selectedTxIds.size > 0 && (
              <motion.div
                initial={{ opacity: 0, y: -6, height: 0 }}
                animate={{ opacity: 1, y: 0, height: "auto" }}
                exit={{ opacity: 0, y: -6, height: 0 }}
                className="p-2.5 px-3.5 rounded-2xl border flex flex-wrap items-center justify-between gap-2.5 shadow-lg"
                style={{
                  background: "linear-gradient(135deg, rgba(76, 29, 149, 0.85) 0%, rgba(30, 58, 138, 0.85) 100%)",
                  borderColor: "rgba(167, 139, 250, 0.4)",
                }}
              >
                <div className="flex items-center gap-2 text-xs font-bold text-white">
                  <span className="px-2 py-0.5 rounded-md bg-white/20 font-mono text-[11px]">
                    {selectedTxIds.size}
                  </span>
                  <span>transaction{selectedTxIds.size > 1 ? "s" : ""} selected</span>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleToggleSelectAll}
                    className="px-2.5 py-1 text-[11px] font-semibold rounded-lg bg-white/10 hover:bg-white/20 text-white/90 transition-all cursor-pointer"
                  >
                    {allSelected ? "Deselect All" : "Select All"}
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setBulkDate(new Date().toISOString().split("T")[0])
                      setIsBulkDateModalOpen(true)
                    }}
                    className="px-3 py-1 text-xs font-bold rounded-lg text-[#120824] flex items-center gap-1.5 transition-all shadow-sm cursor-pointer hover:scale-[1.02]"
                    style={{ background: tokens.dashboardActivePill }}
                  >
                    <Calendar className="size-3.5" />
                    Change Date
                  </button>

                  <button
                    type="button"
                    onClick={() => setSelectedTxIds(new Set())}
                    className="p-1 rounded-lg text-white/60 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
                    title="Clear selection"
                  >
                    <X className="size-3.5" />
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Scrollable Transaction List */}
        <div className="flex-1 overflow-y-auto pr-1 space-y-2 min-h-0">
          {filtered.length === 0 ? (
            <div className="text-center py-16 text-white/60">
              <p className="text-sm font-sans font-medium">No transactions found.</p>
            </div>
          ) : (
            filtered.map((tx) => {
              const isIncome = tx.type === "income"
              const isFee = Boolean(tx.is_fee || tx.category_name?.toLowerCase() === "fees")
              const isSelected = selectedTxIds.has(tx.id)

              return (
                <div
                  key={tx.id}
                  onClick={() => handleToggleSelect(tx.id)}
                  className={`group flex items-center justify-between p-3 sm:p-3.5 rounded-2xl border transition-all duration-200 backdrop-blur-md relative cursor-pointer ${
                    isSelected ? "bg-purple-900/35 border-purple-400/50 shadow-sm" : "hover:bg-white/5"
                  }`}
                  style={{
                    backgroundColor: isSelected ? undefined : tokens.nestedSurface,
                    borderColor: isSelected ? undefined : tokens.borderNested,
                  }}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    {/* Checkbox */}
                    <div
                      onClick={(e) => {
                        e.stopPropagation()
                        handleToggleSelect(tx.id)
                      }}
                      className={`size-5 rounded-lg border flex items-center justify-center transition-all cursor-pointer shrink-0 ${
                        isSelected
                          ? "bg-purple-500 border-purple-400 text-white"
                          : "bg-white/5 border-white/20 text-transparent group-hover:border-white/50"
                      }`}
                    >
                      <Check className="size-3 stroke-[3]" />
                    </div>

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
                        {tx.group_id && (
                          <span className="px-1.5 py-0.5 rounded text-[9px] font-mono font-bold bg-purple-500/20 text-purple-300 border border-purple-500/30 shrink-0">
                            split
                          </span>
                        )}
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

                  <div className="flex items-center gap-3 shrink-0" onClick={(e) => e.stopPropagation()}>
                    <div className="text-right">
                      <p
                        className="text-sm sm:text-base font-bold font-mono"
                        style={{ color: isIncome ? tokens.gain : tokens.loss }}
                      >
                        {isIncome ? "+" : "-"}{currencySymbol}{Math.abs(tx.amount).toFixed(2)}
                      </p>
                      <p className="text-[10px] font-mono mt-0.5 text-white/60">
                        {tx.date}
                      </p>
                    </div>

                    {/* Edit & Delete Actions */}
                    <div className="flex items-center gap-1 opacity-80 sm:opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={() => onEditTransaction(tx)}
                        className="p-1.5 rounded-lg hover:bg-white/15 text-white/70 hover:text-white transition-colors cursor-pointer"
                        title="Edit transaction (including date)"
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

        {/* Modal Footer */}
        <div className="pt-3.5 mt-2 border-t flex items-center justify-between shrink-0" style={{ borderColor: tokens.border }}>
          <span className="text-xs text-white/60 font-mono">
            Showing {filtered.length} of {transactions.length} total transactions
          </span>
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl text-xs font-bold text-[#120824] shadow-md cursor-pointer hover:scale-[1.02] transition-all"
            style={{ background: tokens.dashboardActivePill }}
          >
            Done
          </button>
        </div>

        {/* Bulk Change Date Modal (Child) */}
        <AnimatePresence>
          {isBulkDateModalOpen && (
            <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md">
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="w-full max-w-md rounded-3xl p-6 border shadow-2xl backdrop-blur-2xl relative overflow-hidden"
                style={{
                  background: tokens.cardGradient,
                  borderColor: tokens.border,
                  boxShadow: tokens.cardShadow,
                }}
              >
                <div className="flex items-center justify-between pb-3.5 border-b" style={{ borderColor: tokens.border }}>
                  <div className="flex items-center gap-2">
                    <Calendar className="size-4.5 text-[#FEF08A]" />
                    <h3 className="text-base font-bold font-display text-white">Change Transaction Date</h3>
                  </div>
                  <button
                    onClick={() => setIsBulkDateModalOpen(false)}
                    className="size-7 rounded-full flex items-center justify-center bg-white/10 hover:bg-white/20 text-white cursor-pointer"
                  >
                    ✕
                  </button>
                </div>

                {bulkError && (
                  <div className="mt-3.5 p-3 rounded-xl bg-red-500/20 border border-red-500/40 text-red-200 text-xs flex items-center gap-2">
                    <AlertCircle className="size-4 shrink-0 text-red-400" />
                    <span>{bulkError}</span>
                  </div>
                )}

                {bulkSuccessMsg && (
                  <div className="mt-3.5 p-3 rounded-xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-200 text-xs flex items-center gap-2">
                    <CheckCircle2 className="size-4 shrink-0 text-emerald-400" />
                    <span>{bulkSuccessMsg}</span>
                  </div>
                )}

                <form onSubmit={handleApplyBulkDate} className="mt-4 space-y-4">
                  <div>
                    <p className="text-xs text-white/80 mb-2">
                      Updating date for <strong className="text-white">{selectedTxIds.size}</strong> selected transaction{selectedTxIds.size > 1 ? "s" : ""}.
                    </p>
                    
                    <label className="text-[11px] font-semibold uppercase tracking-wider block mb-1 font-sans text-white/75">
                      New Date
                    </label>
                    <input
                      type="date"
                      required
                      value={bulkDate}
                      onChange={(e) => setBulkDate(e.target.value)}
                      className="w-full px-3.5 py-2.5 border rounded-xl text-sm font-sans text-white focus:outline-none"
                      style={{ backgroundColor: tokens.nestedSurface, borderColor: tokens.borderNested }}
                    />
                  </div>

                  {/* Quick Date Presets */}
                  <div className="flex items-center gap-2 pt-1">
                    <span className="text-[10.5px] uppercase font-semibold text-white/50">Presets:</span>
                    <button
                      type="button"
                      onClick={() => setBulkDate(new Date().toISOString().split("T")[0])}
                      className="px-2.5 py-1 rounded-lg text-[11px] font-semibold bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer"
                    >
                      Today
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        const d = new Date()
                        d.setDate(d.getDate() - 1)
                        setBulkDate(d.toISOString().split("T")[0])
                      }}
                      className="px-2.5 py-1 rounded-lg text-[11px] font-semibold bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer"
                    >
                      Yesterday
                    </button>
                  </div>

                  <div className="flex items-center justify-end gap-2.5 pt-3 border-t" style={{ borderColor: tokens.border }}>
                    <button
                      type="button"
                      onClick={() => setIsBulkDateModalOpen(false)}
                      className="px-4 py-2 rounded-xl text-xs font-semibold text-white/70 hover:text-white cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={isBulkSubmitting || !bulkDate}
                      className="px-5 py-2 rounded-xl text-xs font-bold text-[#120824] shadow-md cursor-pointer hover:scale-[1.02] disabled:opacity-50 transition-all"
                      style={{ background: tokens.dashboardActivePill }}
                    >
                      {isBulkSubmitting ? "Updating dates..." : `Update Date (${selectedTxIds.size})`}
                    </button>
                  </div>
                </form>
              </motion.div>
            </div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
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
  const { batchUpdateTransactionDates } = useFinanceData()
  const [filter, setFilter] = useState<"all" | "expense" | "income">("all")
  const [search, setSearch] = useState("")
  const [visibleLimit, setVisibleLimit] = useState(12)

  // Full history modal state
  const [isAllTxModalOpen, setIsAllTxModalOpen] = useState(false)

  // Multi-select state
  const [selectedTxIds, setSelectedTxIds] = useState<Set<string>>(new Set())
  const [isBulkDateModalOpen, setIsBulkDateModalOpen] = useState(false)
  const [bulkDate, setBulkDate] = useState(new Date().toISOString().split("T")[0])
  const [isBulkSubmitting, setIsBulkSubmitting] = useState(false)
  const [bulkError, setBulkError] = useState<string | null>(null)
  const [bulkSuccessMsg, setBulkSuccessMsg] = useState<string | null>(null)

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

  const allVisibleSelected = useMemo(() => {
    const visibleTxs = filtered.slice(0, visibleLimit)
    return visibleTxs.length > 0 && visibleTxs.every((t) => selectedTxIds.has(t.id))
  }, [filtered, visibleLimit, selectedTxIds])

  const handleToggleSelect = (id: string) => {
    setSelectedTxIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) {
        next.delete(id)
      } else {
        next.add(id)
      }
      return next
    })
  }

  const handleToggleSelectAll = () => {
    const visibleTxs = filtered.slice(0, visibleLimit)
    if (allVisibleSelected) {
      // Deselect visible
      setSelectedTxIds((prev) => {
        const next = new Set(prev)
        visibleTxs.forEach((t) => next.delete(t.id))
        return next
      })
    } else {
      // Select all visible
      setSelectedTxIds((prev) => {
        const next = new Set(prev)
        visibleTxs.forEach((t) => next.add(t.id))
        return next
      })
    }
  }

  const handleApplyBulkDate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (selectedTxIds.size === 0 || !bulkDate) return

    setIsBulkSubmitting(true)
    setBulkError(null)

    try {
      await batchUpdateTransactionDates(Array.from(selectedTxIds), bulkDate)
      setBulkSuccessMsg(`Successfully updated date for ${selectedTxIds.size} transaction${selectedTxIds.size > 1 ? "s" : ""}!`)
      setSelectedTxIds(new Set())
      setTimeout(() => {
        setIsBulkDateModalOpen(false)
        setBulkSuccessMsg(null)
      }, 1200)
    } catch (err: any) {
      setBulkError(err.message || "Failed to update transaction dates.")
    } finally {
      setIsBulkSubmitting(false)
    }
  }

  return (
    <>
      <motion.div
        data-tour="tour-recent-activity"
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

          {/* Filter Tabs & View All Button */}
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
              onClick={() => setIsAllTxModalOpen(true)}
              className="text-xs font-semibold px-2.5 py-1 transition-colors font-sans cursor-pointer text-[#A7F3D0] hover:text-white hover:underline"
            >
              View all
            </button>
          </div>
        </div>

        {/* Frosted Search Input & Bulk Action Bar */}
        <div className="my-3.5 space-y-2.5">
          <div className="relative">
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

          {/* Multi-Select Action Banner */}
          <AnimatePresence>
            {selectedTxIds.size > 0 && (
              <motion.div
                initial={{ opacity: 0, y: -6, height: 0 }}
                animate={{ opacity: 1, y: 0, height: "auto" }}
                exit={{ opacity: 0, y: -6, height: 0 }}
                className="p-2.5 px-3.5 rounded-2xl border flex flex-wrap items-center justify-between gap-2.5 shadow-lg"
                style={{
                  background: "linear-gradient(135deg, rgba(76, 29, 149, 0.85) 0%, rgba(30, 58, 138, 0.85) 100%)",
                  borderColor: "rgba(167, 139, 250, 0.4)",
                }}
              >
                <div className="flex items-center gap-2 text-xs font-bold text-white">
                  <span className="px-2 py-0.5 rounded-md bg-white/20 font-mono text-[11px]">
                    {selectedTxIds.size}
                  </span>
                  <span>transaction{selectedTxIds.size > 1 ? "s" : ""} selected</span>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleToggleSelectAll}
                    className="px-2.5 py-1 text-[11px] font-semibold rounded-lg bg-white/10 hover:bg-white/20 text-white/90 transition-all cursor-pointer"
                  >
                    {allVisibleSelected ? "Deselect Visible" : "Select All Visible"}
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setBulkDate(new Date().toISOString().split("T")[0])
                      setIsBulkDateModalOpen(true)
                    }}
                    className="px-3 py-1 text-xs font-bold rounded-lg text-[#120824] flex items-center gap-1.5 transition-all shadow-sm cursor-pointer hover:scale-[1.02]"
                    style={{ background: tokens.dashboardActivePill }}
                  >
                    <Calendar className="size-3.5" />
                    Change Date
                  </button>

                  <button
                    type="button"
                    onClick={() => setSelectedTxIds(new Set())}
                    className="p-1 rounded-lg text-white/60 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
                    title="Clear selection"
                  >
                    <X className="size-3.5" />
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Itemized Rows with Multi-Select Checkbox, Edit & Delete actions */}
        <div className="flex flex-col gap-2 mt-1 max-h-[420px] overflow-y-auto pr-1">
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
            filtered.slice(0, visibleLimit).map((tx) => {
              const isIncome = tx.type === "income"
              const isFee = Boolean(tx.is_fee || tx.category_name?.toLowerCase() === "fees")
              const isSelected = selectedTxIds.has(tx.id)

              return (
                <div
                  key={tx.id}
                  onClick={() => handleToggleSelect(tx.id)}
                  className={`group flex items-center justify-between p-3 sm:p-3.5 rounded-2xl border transition-all duration-200 backdrop-blur-md relative cursor-pointer ${
                    isSelected ? "bg-purple-900/35 border-purple-400/50 shadow-sm" : "hover:bg-white/5"
                  }`}
                  style={{
                    backgroundColor: isSelected ? undefined : tokens.nestedSurface,
                    borderColor: isSelected ? undefined : tokens.borderNested,
                  }}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    {/* Select Checkbox */}
                    <div
                      onClick={(e) => {
                        e.stopPropagation()
                        handleToggleSelect(tx.id)
                      }}
                      className={`size-5 rounded-lg border flex items-center justify-center transition-all cursor-pointer shrink-0 ${
                        isSelected
                          ? "bg-purple-500 border-purple-400 text-white"
                          : "bg-white/5 border-white/20 text-transparent group-hover:border-white/50"
                      }`}
                    >
                      <Check className="size-3 stroke-[3]" />
                    </div>

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
                        {tx.group_id && (
                          <span className="px-1.5 py-0.5 rounded text-[9px] font-mono font-bold bg-purple-500/20 text-purple-300 border border-purple-500/30 shrink-0">
                            split
                          </span>
                        )}
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

                  <div className="flex items-center gap-3 shrink-0" onClick={(e) => e.stopPropagation()}>
                    <div className="text-right">
                      <p
                        className="text-sm sm:text-base font-bold font-mono"
                        style={{ color: isIncome ? tokens.gain : tokens.loss }}
                      >
                        {isIncome ? "+" : "-"}{currencySymbol}{Math.abs(tx.amount).toFixed(2)}
                      </p>
                      <p className="text-[10px] font-mono mt-0.5 text-white/60">
                        {tx.date}
                      </p>
                    </div>

                    {/* Feature 4: Edit & Delete Actions */}
                    <div className="flex items-center gap-1 opacity-80 sm:opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={() => onEditTransaction(tx)}
                        className="p-1.5 rounded-lg hover:bg-white/15 text-white/70 hover:text-white transition-colors cursor-pointer"
                        title="Edit transaction (including date)"
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

        {/* Show More / Show Less Toggle */}
        {filtered.length > 12 && (
          <div className="pt-3 border-t border-white/10 flex items-center justify-center">
            {visibleLimit < filtered.length ? (
              <button
                onClick={() => setVisibleLimit((prev) => prev + 15)}
                className="text-xs font-semibold text-[#A7F3D0] hover:underline cursor-pointer flex items-center gap-1"
              >
                Show more ({filtered.length - visibleLimit} remaining)
              </button>
            ) : (
              <button
                onClick={() => setVisibleLimit(12)}
                className="text-xs font-semibold text-white/60 hover:text-white cursor-pointer"
              >
                Show less
              </button>
            )}
          </div>
        )}

        {/* Bulk Change Date Modal */}
        <AnimatePresence>
          {isBulkDateModalOpen && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md">
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="w-full max-w-md rounded-3xl p-6 border shadow-2xl backdrop-blur-2xl relative overflow-hidden"
                style={{
                  background: tokens.cardGradient,
                  borderColor: tokens.border,
                  boxShadow: tokens.cardShadow,
                }}
              >
                <div className="flex items-center justify-between pb-3.5 border-b" style={{ borderColor: tokens.border }}>
                  <div className="flex items-center gap-2">
                    <Calendar className="size-4.5 text-[#FEF08A]" />
                    <h3 className="text-base font-bold font-display text-white">Change Transaction Date</h3>
                  </div>
                  <button
                    onClick={() => setIsBulkDateModalOpen(false)}
                    className="size-7 rounded-full flex items-center justify-center bg-white/10 hover:bg-white/20 text-white cursor-pointer"
                  >
                    ✕
                  </button>
                </div>

                {bulkError && (
                  <div className="mt-3.5 p-3 rounded-xl bg-red-500/20 border border-red-500/40 text-red-200 text-xs flex items-center gap-2">
                    <AlertCircle className="size-4 shrink-0 text-red-400" />
                    <span>{bulkError}</span>
                  </div>
                )}

                {bulkSuccessMsg && (
                  <div className="mt-3.5 p-3 rounded-xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-200 text-xs flex items-center gap-2">
                    <CheckCircle2 className="size-4 shrink-0 text-emerald-400" />
                    <span>{bulkSuccessMsg}</span>
                  </div>
                )}

                <form onSubmit={handleApplyBulkDate} className="mt-4 space-y-4">
                  <div>
                    <p className="text-xs text-white/80 mb-2">
                      Updating date for <strong className="text-white">{selectedTxIds.size}</strong> selected transaction{selectedTxIds.size > 1 ? "s" : ""}.
                    </p>
                    
                    <label className="text-[11px] font-semibold uppercase tracking-wider block mb-1 font-sans text-white/75">
                      New Date
                    </label>
                    <input
                      type="date"
                      required
                      value={bulkDate}
                      onChange={(e) => setBulkDate(e.target.value)}
                      className="w-full px-3.5 py-2.5 border rounded-xl text-sm font-sans text-white focus:outline-none"
                      style={{ backgroundColor: tokens.nestedSurface, borderColor: tokens.borderNested }}
                    />
                  </div>

                  {/* Quick Date Presets */}
                  <div className="flex items-center gap-2 pt-1">
                    <span className="text-[10.5px] uppercase font-semibold text-white/50">Presets:</span>
                    <button
                      type="button"
                      onClick={() => setBulkDate(new Date().toISOString().split("T")[0])}
                      className="px-2.5 py-1 rounded-lg text-[11px] font-semibold bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer"
                    >
                      Today
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        const d = new Date()
                        d.setDate(d.getDate() - 1)
                        setBulkDate(d.toISOString().split("T")[0])
                      }}
                      className="px-2.5 py-1 rounded-lg text-[11px] font-semibold bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer"
                    >
                      Yesterday
                    </button>
                  </div>

                  <div className="flex items-center justify-end gap-2.5 pt-3 border-t" style={{ borderColor: tokens.border }}>
                    <button
                      type="button"
                      onClick={() => setIsBulkDateModalOpen(false)}
                      className="px-4 py-2 rounded-xl text-xs font-semibold text-white/70 hover:text-white cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={isBulkSubmitting || !bulkDate}
                      className="px-5 py-2 rounded-xl text-xs font-bold text-[#120824] shadow-md cursor-pointer hover:scale-[1.02] disabled:opacity-50 transition-all"
                      style={{ background: tokens.dashboardActivePill }}
                    >
                      {isBulkSubmitting ? "Updating dates..." : `Update Date (${selectedTxIds.size})`}
                    </button>
                  </div>
                </form>
              </motion.div>
            </div>
          )}
        </AnimatePresence>
      </motion.div>

      {/* All Transactions Modal */}
      <AllTransactionsModal
        isOpen={isAllTxModalOpen}
        onClose={() => setIsAllTxModalOpen(false)}
        transactions={transactions}
        currencySymbol={currencySymbol}
        onEditTransaction={onEditTransaction}
        onDeleteTransaction={onDeleteTransaction}
      />
    </>
  )
}

// ─── Component: Active Accounts Deck ──────────────────────────────

function ActiveAccountsDeck({
  accounts,
  heldFunds = [],
  currencySymbol,
  onNavigate,
  onAddAccount,
}: {
  accounts: Account[]
  heldFunds?: HeldFund[]
  currencySymbol: string
  onNavigate?: (section: SectionId) => void
  onAddAccount?: () => void
}) {
  const { tokens } = useDashboardTheme()

  return (
    <motion.div
      data-tour="tour-accounts-summary"
      {...cardEntrance(0.18)}
      className="rounded-3xl border p-5 lg:p-6 flex flex-col justify-between hover:scale-[1.01] transition-transform duration-300 backdrop-blur-xl"
      style={{
        background: tokens.cardGradient,
        borderColor: tokens.border,
        boxShadow: tokens.cardShadow,
      }}
    >
      <div className="flex items-center justify-between pb-3 border-b" style={{ borderColor: tokens.border }}>
        <div>
          <h3 className="text-base font-bold font-display text-white">Active Accounts</h3>
          <p className="text-xs font-sans text-white/70 mt-0.5">Primary balances & liquidity hubs</p>
        </div>
        <button
          onClick={() => onNavigate?.("accounts")}
          className="text-xs font-semibold px-2.5 py-1 rounded-xl transition-colors font-sans cursor-pointer text-white/80 hover:text-white"
        >
          View all
        </button>
      </div>

      <div className="flex flex-col gap-3 mt-4">
        {accounts.slice(0, 3).map((acc) => {
          const visual = getAccountVisual(acc.type, acc.name)
          const linkedHeldFunds = heldFunds.filter((hf) => hf.account_id === acc.id)
          const hasLinkedHeldFunds = linkedHeldFunds.length > 0
          const heldTotal = linkedHeldFunds.reduce((sum, hf) => sum + (hf.balance || 0), 0)
          const totalWithHeld = (acc.balance || 0) + heldTotal

          return (
            <div
              key={acc.id}
              className="p-3 sm:p-3.5 rounded-2xl border transition-all duration-200 hover:bg-white/5 backdrop-blur-md"
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
                {hasLinkedHeldFunds && (
                  <div className="flex flex-col items-end text-right">
                    <p className="text-[9px] font-semibold uppercase tracking-wider font-sans text-white/50">
                      WITH HELD FUNDS
                    </p>
                    <p className="text-xs sm:text-sm font-bold font-mono text-amber-200/90 mt-0.5">
                      {currencySymbol}{Number(totalWithHeld).toLocaleString("en-US", { minimumFractionDigits: 2 })}
                    </p>
                  </div>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </motion.div>
  )
}

// ─── Component: Category Budget Progress Gauges (Feature 7 Dynamic Colors) ───

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
            // Feature 7 color thresholds: <50% green (#4ADE80), 50-80% amber (#FACC15), >80% red (#F87171)
            const gaugeFillColor = pct < 50 ? "#4ADE80" : pct <= 80 ? "#FACC15" : "#F87171"

            return (
              <div key={item.id} className="flex flex-col gap-1.5">
                <div className="flex items-center justify-between text-xs font-sans">
                  <span className="font-semibold text-white truncate max-w-[140px]">{item.name}</span>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-white/70">
                      {currencySymbol}{item.spent.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      {item.budget != null ? ` / ${currencySymbol}${item.budget.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : ""}
                    </span>
                    <span
                      className="px-1.5 py-0.5 rounded text-[10px] font-mono font-bold border border-white/10"
                      style={{
                        backgroundColor: `${gaugeFillColor}20`,
                        color: gaugeFillColor,
                        borderColor: `${gaugeFillColor}40`,
                      }}
                    >
                      {item.budget != null ? `${pct}%` : "Tracked"}
                    </span>
                  </div>
                </div>

                {/* Dynamic color fill Progress Bar */}
                <div className="h-2 w-full rounded-full overflow-hidden bg-white/10 p-[1px]">
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{
                      width: `${item.budget != null ? Math.max(4, pct) : (item.spent > 0 ? 100 : 4)}%`,
                      backgroundColor: gaugeFillColor,
                      boxShadow: `0 0 10px ${gaugeFillColor}60`,
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
  const [editingBill, setEditingBill] = useState<Bill | null>(null)
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
        className={`p-4 rounded-2xl border flex items-center justify-between gap-3 backdrop-blur-md transition-all hover:bg-white/5 group ${
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
          
          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <button
              onClick={() => setEditingBill(b)}
              className="p-1.5 rounded-lg hover:bg-white/10 text-white/60 hover:text-white cursor-pointer transition-colors"
              title="Edit bill"
            >
              <Edit3 className="size-4" />
            </button>
            <button
              onClick={() => deleteBill(b.id)}
              className="p-1.5 rounded-lg hover:bg-red-500/20 text-white/50 hover:text-red-400 cursor-pointer transition-colors"
              title="Delete bill"
            >
              <Trash2 className="size-4" />
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-6">
      <SectionHeader title="Planned Bills & Incomes" subtitle="Scheduled obligations, recurring income, and planned transfers">
        <button
          data-tour="tour-add-bill-btn"
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
      <div data-tour="tour-bills-summary" className="grid grid-cols-1 sm:grid-cols-3 gap-4">
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

      {/* 3-Tier Bills Timeline */}
      <div data-tour="tour-bills-timeline" className="flex flex-col gap-6">

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
                className="p-4 rounded-2xl border border-red-500/40 bg-red-500/15 backdrop-blur-md flex items-center justify-between gap-3 group"
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
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={() => setEditingBill(b)}
                      className="p-1.5 rounded-lg hover:bg-white/15 text-red-200 hover:text-white cursor-pointer transition-colors"
                      title="Edit bill"
                    >
                      <Edit3 className="size-4" />
                    </button>
                    <button
                      onClick={() => deleteBill(b.id)}
                      className="p-1.5 rounded-lg hover:bg-red-500/20 text-red-300 cursor-pointer transition-colors"
                      title="Delete bill"
                    >
                      <Trash2 className="size-4" />
                    </button>
                  </div>
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
      </div>

      {/* Modals */}
      <AddBillModal isOpen={addBillOpen} onClose={() => setAddBillOpen(false)} />
      <EditBillModal bill={editingBill} isOpen={Boolean(editingBill)} onClose={() => setEditingBill(null)} />
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
    renameHeldFund,
    deleteHeldFund,
    deleteHeldFundHistory,
    fetchHeldFundHistory
  } = useFinanceData()
  const { profile } = useUserProfile()
  const { tokens } = useDashboardTheme()
  const currencySymbol = getCurrencySymbol(profile.currency)

  const [addAccOpen, setAddAccOpen] = useState(false)
  const [addHeldFundOpen, setAddHeldFundOpen] = useState(false)

  // Feature 1: Rename & Delete on Held Funds
  const [renamingFundId, setRenamingFundId] = useState<string | null>(null)
  const [renamingName, setRenamingName] = useState("")
  const [deletingFund, setDeletingFund] = useState<HeldFund | null>(null)
  const [isDeletingFund, setIsDeletingFund] = useState(false)

  // Deposit/Withdraw/Pay modal state
  const [selectedFundForAction, setSelectedFundForAction] = useState<HeldFund | null>(null)
  const [fundActionMode, setFundActionMode] = useState<"deposit" | "withdrawal" | "pay">("deposit")

  // Edit history modal state
  const [editingHistoryItem, setEditingHistoryItem] = useState<HeldFundHistory | null>(null)

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

  const handleStartRename = (hf: HeldFund) => {
    setRenamingFundId(hf.id)
    setRenamingName(hf.name)
  }

  const handleSaveRename = async (hfId: string) => {
    if (!renamingName.trim()) return
    try {
      await renameHeldFund(hfId, renamingName.trim())
      setRenamingFundId(null)
    } catch (err: any) {
      alert(err?.message || "Failed to rename held fund.")
    }
  }

  const handleConfirmDeleteFund = async () => {
    if (!deletingFund) return
    setIsDeletingFund(true)
    try {
      await deleteHeldFund(deletingFund.id)
      setDeletingFund(null)
    } catch (err: any) {
      alert(err?.message || "Failed to delete held fund.")
    } finally {
      setIsDeletingFund(false)
    }
  }

  return (
    <div className="flex flex-col gap-8">
      {/* ─── Accounts Section ─── */}
      <div className="flex flex-col gap-5">
        <SectionHeader title="Accounts & Liquidity" subtitle="All connected bank vaults, credit lines, and cash stores">
          <button
            data-tour="tour-add-account-btn"
            onClick={() => setAddAccOpen(true)}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition-all font-sans cursor-pointer shadow-lg hover:scale-[1.02] text-[#120824]"
            style={{ background: tokens.dashboardActivePill }}
          >
            <Plus className="size-4" />
            <span>New Account</span>
          </button>
        </SectionHeader>

        <div data-tour="tour-accounts-grid" className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {accounts.map((acc, i) => {
            const visual = getAccountVisual(acc.type, acc.name)
            const linkedHeldFunds = heldFunds.filter((hf) => hf.account_id === acc.id)
            const hasLinkedHeldFunds = linkedHeldFunds.length > 0
            const heldTotal = linkedHeldFunds.reduce((sum, hf) => sum + (hf.balance || 0), 0)
            const totalWithHeld = (acc.balance || 0) + heldTotal

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

                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full border border-white/15 bg-white/10 text-white/80">
                      {acc.currency || profile.currency || "USD"}
                    </span>
                    <button
                      onClick={async (e) => {
                        e.stopPropagation()
                        if (window.confirm(`Are you sure you want to permanently delete "${acc.name}"? This will remove the account and all associated transactions, bills, and held funds from cloud database and local storage.`)) {
                          try {
                            await deleteAccount(acc.id)
                          } catch (err: any) {
                            alert(err?.message || "Failed to delete account.")
                          }
                        }
                      }}
                      className="opacity-0 group-hover:opacity-100 p-1.5 rounded-lg transition-all cursor-pointer hover:bg-red-500/20 text-red-400"
                      title="Delete account"
                    >
                      <Trash2 className="size-4" />
                    </button>
                  </div>
                </div>

                <div className="relative z-10 pt-4 border-t flex items-end justify-between" style={{ borderColor: tokens.borderNested }}>
                  <div>
                    <p className="text-[11px] font-semibold uppercase tracking-wider font-sans text-white/70">
                      Available Balance
                    </p>
                    <p className="text-2xl font-bold font-mono mt-1 text-white">
                      {currencySymbol}{Number(acc.balance || 0).toLocaleString("en-US", { minimumFractionDigits: 2 })}
                    </p>
                  </div>
                  {hasLinkedHeldFunds && (
                    <div className="text-right">
                      <p className="text-[10px] font-semibold uppercase tracking-wider font-sans text-white/60">
                        With held funds
                      </p>
                      <p className="text-sm sm:text-base font-bold font-mono text-amber-200/90 mt-0.5">
                        {currencySymbol}{Number(totalWithHeld).toLocaleString("en-US", { minimumFractionDigits: 2 })}
                      </p>
                    </div>
                  )}
                </div>
              </motion.div>
            )
          })}
        </div>
      </div>

      {/* ─── FEATURE 2: HELD FUNDS SYSTEM (with Rename & Delete) ─── */}
      <div data-tour="tour-held-funds-section" className="flex flex-col gap-5 pt-4 border-t" style={{ borderColor: tokens.borderNested }}>
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
              const isRenaming = renamingFundId === hf.id

              return (
                <motion.div
                  key={hf.id}
                  {...cardEntrance(0.1 + i * 0.05)}
                  className="rounded-3xl p-5 border flex flex-col justify-between transition-all backdrop-blur-xl relative hover:scale-[1.01] transition-transform duration-300 group"
                  style={{
                    background: tokens.cardGradient,
                    borderColor: tokens.border,
                    boxShadow: tokens.cardShadow,
                  }}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div
                        className="size-10 rounded-2xl flex items-center justify-center font-bold shadow-md shrink-0"
                        style={{
                          backgroundColor: isPerson ? "rgba(167, 243, 208, 0.2)" : "rgba(254, 240, 138, 0.2)",
                          color: isPerson ? "#A7F3D0" : "#FEF08A",
                        }}
                      >
                        {isPerson ? <UserCheck className="size-5" /> : <PiggyBank className="size-5" />}
                      </div>
                      <div className="min-w-0">
                        {isRenaming ? (
                          <div className="flex items-center gap-1.5 mt-0.5">
                            <input
                              type="text"
                              autoFocus
                              value={renamingName}
                              onChange={(e) => setRenamingName(e.target.value)}
                              onKeyDown={(e) => {
                                if (e.key === "Enter") handleSaveRename(hf.id)
                                if (e.key === "Escape") setRenamingFundId(null)
                              }}
                              className="px-2 py-1 rounded-lg text-xs font-bold text-white bg-black/40 border border-white/20 focus:outline-none"
                            />
                            <button
                              type="button"
                              onClick={() => handleSaveRename(hf.id)}
                              className="p-1 rounded-md bg-emerald-500/20 text-emerald-300 hover:bg-emerald-500/30 cursor-pointer"
                              title="Save name"
                            >
                              <Check className="size-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => setRenamingFundId(null)}
                              className="p-1 rounded-md bg-white/10 text-white/60 hover:text-white cursor-pointer"
                              title="Cancel"
                            >
                              <X className="size-3.5" />
                            </button>
                          </div>
                        ) : (
                          <div className="flex items-center gap-2">
                            <h4 className="text-base font-bold text-white font-display truncate">{hf.name}</h4>
                            <span className="px-2 py-0.5 rounded text-[9.5px] font-mono uppercase bg-white/10 text-white/80 shrink-0">
                              {hf.type}
                            </span>
                          </div>
                        )}
                        <p className="text-xs text-white/60 font-sans mt-0.5">Linked: {hf.account_name}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-1">
                      {!isRenaming && (
                        <button
                          onClick={() => handleStartRename(hf)}
                          className="p-1.5 rounded-lg hover:bg-white/10 text-white/40 hover:text-white cursor-pointer transition-colors"
                          title="Rename held fund"
                        >
                          <Edit3 className="size-3.5" />
                        </button>
                      )}
                      <button
                        onClick={() => setDeletingFund(hf)}
                        className="p-1.5 rounded-lg hover:bg-red-500/20 text-white/40 hover:text-red-400 cursor-pointer transition-colors"
                        title="Delete held fund"
                      >
                        <Trash2 className="size-3.5" />
                      </button>
                    </div>
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
                          setFundActionMode("pay")
                        }}
                        className="px-3 py-1.5 rounded-xl text-xs font-bold bg-amber-500/20 hover:bg-amber-500/30 text-amber-200 border border-amber-500/30 transition-all cursor-pointer shadow-sm"
                      >
                        💸 Pay
                      </button>
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
                        <div className="flex flex-col gap-1.5 max-h-56 overflow-y-auto pr-1">
                          {historyList.map((h) => {
                            const isDep = h.direction === "deposit"
                            const isPay = h.direction === "payment" || h.direction === "expense"
                            const label = isDep ? "Deposit" : isPay ? "Payment" : "Withdrawal"
                            const labelColor = isDep ? "text-emerald-400" : isPay ? "text-amber-400" : "text-rose-400"

                            return (
                              <div
                                key={h.id}
                                className="p-2.5 rounded-xl border flex items-center justify-between text-xs group/item transition-colors hover:bg-white/5"
                                style={{ backgroundColor: tokens.nestedSurface, borderColor: tokens.borderNested }}
                              >
                                <div>
                                  <span className={`font-semibold mr-1.5 ${labelColor}`}>
                                    {label}
                                  </span>
                                  <span className="text-white/60">{h.note || "No note"}</span>
                                </div>
                                <div className="flex items-center gap-2">
                                  <div className="text-right">
                                    <span className="font-mono font-bold text-white">
                                      {isDep ? "+" : "-"}{currencySymbol}{h.amount.toFixed(2)}
                                    </span>
                                    <span className="text-[9.5px] text-white/40 block font-mono">{h.date}</span>
                                  </div>
                                  <div className="flex items-center gap-1 opacity-0 group-hover/item:opacity-100 transition-opacity">
                                    <button
                                      onClick={() => setEditingHistoryItem(h)}
                                      className="p-1 rounded-md hover:bg-white/10 text-white/60 hover:text-white cursor-pointer transition-colors"
                                      title="Edit record"
                                    >
                                      <Edit3 className="size-3.5" />
                                    </button>
                                    <button
                                      onClick={async () => {
                                        if (confirm("Delete this fund transaction? The fund balance will be adjusted.")) {
                                          await deleteHeldFundHistory(h)
                                          const updated = await fetchHeldFundHistory(hf.id)
                                          setFundHistoryMap((prev) => ({ ...prev, [hf.id]: updated }))
                                        }
                                      }}
                                      className="p-1 rounded-md hover:bg-red-500/20 text-white/60 hover:text-red-400 cursor-pointer transition-colors"
                                      title="Delete record"
                                    >
                                      <Trash2 className="size-3.5" />
                                    </button>
                                  </div>
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

      {/* Feature 1: Delete Held Fund Confirmation Modal */}
      {deletingFund && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="w-full max-w-sm rounded-3xl p-6 border shadow-2xl backdrop-blur-2xl text-center space-y-4"
            style={{
              background: tokens.cardGradient,
              borderColor: tokens.border,
              boxShadow: tokens.cardShadow,
            }}
          >
            <div className="size-12 rounded-2xl bg-red-500/20 text-red-400 mx-auto flex items-center justify-center">
              <Trash2 className="size-6" />
            </div>
            <div>
              <h3 className="text-base font-bold font-display text-white">Delete {deletingFund.name}?</h3>
              <p className="text-xs text-white/70 mt-1 leading-relaxed">
                This will also delete its full transaction and audit history permanently.
              </p>
            </div>
            <div className="flex items-center justify-center gap-3 pt-2">
              <button
                type="button"
                disabled={isDeletingFund}
                onClick={() => setDeletingFund(null)}
                className="px-4 py-2 rounded-xl text-xs font-semibold bg-white/10 hover:bg-white/20 text-white cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isDeletingFund}
                onClick={handleConfirmDeleteFund}
                className="px-5 py-2 rounded-xl text-xs font-bold bg-red-600 hover:bg-red-700 text-white cursor-pointer shadow-lg shadow-red-600/30"
              >
                {isDeletingFund ? "Deleting..." : "Delete Permanently"}
              </button>
            </div>
          </motion.div>
        </div>
      )}

      {/* Modals */}
      <AddAccountModal isOpen={addAccOpen} onClose={() => setAddAccOpen(false)} />
      <AddHeldFundModal isOpen={addHeldFundOpen} onClose={() => setAddHeldFundOpen(false)} />
      <DepositWithdrawHeldFundModal
        heldFund={selectedFundForAction}
        mode={fundActionMode}
        isOpen={Boolean(selectedFundForAction)}
        onClose={() => setSelectedFundForAction(null)}
      />
      <EditHeldFundHistoryModal
        historyItem={editingHistoryItem}
        isOpen={Boolean(editingHistoryItem)}
        onClose={() => setEditingHistoryItem(null)}
        onSuccess={async () => {
          if (expandedFundId) {
            const updated = await fetchHeldFundHistory(expandedFundId)
            setFundHistoryMap((prev) => ({ ...prev, [expandedFundId]: updated }))
          }
        }}
      />
    </div>
  )
}

// ─── Modal: Edit Category ──────────────────────────────────────────

function EditCategoryModal({
  category,
  isOpen,
  onClose,
}: {
  category: Category | null
  isOpen: boolean
  onClose: () => void
}) {
  const { updateCategory } = useFinanceData()
  const { profile } = useUserProfile()
  const { tokens } = useDashboardTheme()
  const currencySymbol = getCurrencySymbol(profile.currency)

  const [name, setName] = useState(category?.name || "")
  const [type, setType] = useState<"expense" | "income">(category?.type || "expense")
  const [budget, setBudget] = useState(category?.budget !== undefined && category?.budget !== null && category?.budget > 0 ? String(category.budget) : "")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  useEffect(() => {
    if (category) {
      setName(category.name)
      setType(category.type)
      setBudget(category.budget !== undefined && category.budget !== null && category.budget > 0 ? String(category.budget) : "")
      setErrorMsg(null)
    }
  }, [category])

  if (!isOpen || !category) return null

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) return
    setIsSubmitting(true)
    setErrorMsg(null)
    try {
      const budgetNum = budget.trim() !== "" ? parseFloat(budget) : 0
      await updateCategory(category.id, {
        name: name.trim(),
        type,
        budget: isNaN(budgetNum) ? 0 : budgetNum,
      })
      onClose()
    } catch (err: any) {
      setErrorMsg(err?.message || "Failed to update category.")
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
            <h3 className="text-base font-bold font-display text-white">Edit Category</h3>
            <p className="text-xs text-white/70">Modify category details, type, and monthly budget</p>
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
              Category Name
            </label>
            <input
              type="text"
              required
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
                onChange={(e) => setType(e.target.value as "expense" | "income")}
                className="w-full px-3.5 py-2.5 border rounded-xl text-sm text-white focus:outline-none"
                style={{ backgroundColor: tokens.nestedSurface, borderColor: tokens.borderNested }}
              >
                <option value="expense" className="bg-[#1E0C38] text-white">Expense Category</option>
                <option value="income" className="bg-[#1E0C38] text-white">Income Category</option>
              </select>
            </div>

            <div>
              <label className="text-[11px] font-semibold uppercase tracking-wider block mb-1 text-white/75">
                Monthly Budget ({currencySymbol.trim()})
              </label>
              <input
                type="number"
                step="0.01"
                placeholder="0.00"
                value={budget}
                onChange={(e) => setBudget(e.target.value)}
                className="w-full px-3.5 py-2.5 border rounded-xl text-sm font-mono text-white focus:outline-none"
                style={{ backgroundColor: tokens.nestedSurface, borderColor: tokens.borderNested }}
              />
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t" style={{ borderColor: tokens.border }}>
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl text-xs font-semibold text-white/80 hover:text-white cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2.5 rounded-xl text-xs font-bold text-[#120824] shadow-lg cursor-pointer transition-opacity disabled:opacity-50"
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

function CategoriesSection({
  onNavigate,
  onEditPlan,
}: {
  onNavigate: (s: SectionId) => void
  onEditPlan?: (plan: BudgetPlan) => void
}) {
  const { categories, transactions, createCategory, deleteCategory, activeBudgetPlan, budgetPlans } = useFinanceData()
  const { profile } = useUserProfile()
  const { tokens } = useDashboardTheme()
  const currencySymbol = getCurrencySymbol(profile.currency)

  const now = new Date()
  const currentMonthStart = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-01`
  const todayStr = now.toISOString().split("T")[0]

  const categorySpentMap = useMemo(() => {
    const map = new Map<string, number>()
    transactions
      .filter((t) => t.type === "expense" && !isTransferTransaction(t) && t.date >= currentMonthStart && t.date <= todayStr)
      .forEach((t) => {
        if (t.category_id) {
          map.set(t.category_id, (map.get(t.category_id) || 0) + Math.abs(t.amount))
        }
      })
    return map
  }, [transactions, currentMonthStart, todayStr])

  const [newCatName, setNewCatName] = useState("")
  const [newCatType, setNewCatType] = useState<"expense" | "income">("expense")
  const [newCatBudget, setNewCatBudget] = useState("")
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [editingCategory, setEditingCategory] = useState<Category | null>(null)
  const [browseSuggestionsOpen, setBrowseSuggestionsOpen] = useState(false)
  const [managePlansOpen, setManagePlansOpen] = useState(false)

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newCatName.trim()) return
    setErrorMessage(null)
    setSuccessMessage(null)
    setIsSubmitting(true)
    try {
      const createdName = newCatName.trim()
      await createCategory({
        name: createdName,
        type: newCatType,
        budget: parseFloat(newCatBudget) || undefined,
        currency: profile.currency || "EGP",
      })
      setNewCatName("")
      setNewCatBudget("")
      setSuccessMessage(`Category "${createdName}" created successfully!`)
      setTimeout(() => setSuccessMessage(null), 3000)
    } catch (err: any) {
      console.error(err)
      setErrorMessage(err?.message || "Failed to create category. Please try again.")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <SectionHeader title="Category Breakdown" subtitle="Manage categorization labels, budgets, and spending allowances">
        <div className="flex items-center gap-2 flex-wrap">
          {/* Active Plan Indicator */}
          {activeBudgetPlan ? (
            <div
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold border backdrop-blur-md"
              style={{
                backgroundColor: "rgba(94, 234, 212, 0.15)",
                borderColor: "rgba(94, 234, 212, 0.35)",
                color: "#5EEAD4",
              }}
            >
              <span className="size-2 rounded-full bg-[#34D399] shadow-[0_0_6px_#34D399]" />
              <span>
                Active plan: <strong className="text-white">{activeBudgetPlan.name}</strong> — {activeBudgetPlan.period === "weekly" ? "Weekly" : activeBudgetPlan.period === "monthly" ? "Monthly" : `Every ${activeBudgetPlan.custom_days || 30} days`}
              </span>
            </div>
          ) : (
            <div
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border text-white/50"
              style={{
                backgroundColor: "rgba(255, 255, 255, 0.05)",
                borderColor: tokens.borderNested,
              }}
            >
              <span className="size-1.5 rounded-full bg-white/30" />
              <span>No active plan</span>
            </div>
          )}

          {/* Manage Plans Button */}
          <button
            data-tour="tour-category-plans-btn"
            type="button"
            onClick={() => setManagePlansOpen(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold border transition-all font-sans cursor-pointer shadow-md bg-white/10 hover:bg-white/20 text-white hover:scale-[1.02]"
            style={{ borderColor: tokens.borderNested }}
          >
            <SlidersHorizontal className="size-3.5" />
            <span>Manage Plans</span>
          </button>

          {/* Plan my budget Button */}
          <button
            type="button"
            onClick={() => onNavigate("budget_planner")}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition-all font-sans cursor-pointer shadow-lg hover:scale-[1.02] text-[#120824]"
            style={{ background: tokens.dashboardActivePill }}
          >
            <Calculator className="size-4" />
            <span>Plan my budget</span>
          </button>

          {/* Browse Suggestions Button */}
          <button
            onClick={() => setBrowseSuggestionsOpen(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold border transition-all font-sans cursor-pointer shadow-md bg-white/5 hover:bg-white/15 text-white/80 hover:scale-[1.02]"
            style={{ borderColor: tokens.borderNested }}
          >
            <Compass className="size-3.5" />
            <span>Suggestions</span>
          </button>
        </div>
      </SectionHeader>

      {/* Ongoing 50/30/20 Plan Progress Tracker */}
      <Active503020Tracker />

      {/* Category Creation Card */}
      <motion.div
        data-tour="tour-add-category-btn"
        {...cardEntrance(0.05)}
        className="rounded-3xl p-6 border backdrop-blur-xl hover:scale-[1.01] transition-transform duration-300"
        style={{ background: tokens.cardGradient, borderColor: tokens.border, boxShadow: tokens.cardShadow }}
      >
        <h3 className="text-base font-bold font-display text-white mb-3">Add Category</h3>

        {errorMessage && (
          <div className="mb-3 p-3 rounded-xl bg-red-500/20 border border-red-500/40 text-red-200 text-xs">
            {errorMessage}
          </div>
        )}

        {successMessage && (
          <div className="mb-3 p-3 rounded-xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-200 text-xs">
            {successMessage}
          </div>
        )}

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
            {isSubmitting ? "Creating..." : "Create Category"}
          </button>
        </form>
      </motion.div>

      {/* Categories Cards Grid */}
      <div data-tour="tour-categories-grid" className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
        {categories.length === 0 ? (
          <div className="col-span-full p-8 rounded-3xl border text-center backdrop-blur-xl" style={{ background: tokens.cardGradient, borderColor: tokens.border }}>
            <p className="text-sm text-white/60">No categories created yet. Create your first category above.</p>
          </div>
        ) : (
          categories.map((c, i) => {
            const spent = categorySpentMap.has(c.id) ? categorySpentMap.get(c.id)! : (c.total_spent || 0)
            return (
              <motion.div
                key={c.id}
                {...cardEntrance(0.08 + i * 0.04)}
                className="p-5 rounded-2xl border flex flex-col justify-between backdrop-blur-md hover:scale-[1.01] transition-transform duration-300 relative group"
                style={{ backgroundColor: tokens.nestedSurface, borderColor: tokens.borderNested }}
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="text-sm font-bold text-white font-sans">{c.name}</h4>
                      <span className={`px-2 py-0.5 rounded text-[9.5px] font-mono uppercase ${
                        c.type === "income" ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30" : "bg-white/10 text-white/70"
                      }`}>
                        {c.type}
                      </span>
                    </div>
                    <p className="text-xs text-white/60 font-mono mt-1">
                      Spent: <span className="text-white font-semibold">{currencySymbol}{spent.toLocaleString("en-US", { minimumFractionDigits: 2 })}</span>
                      {c.budget != null && c.budget > 0 ? ` / Budget: ${currencySymbol}${c.budget.toLocaleString("en-US", { minimumFractionDigits: 2 })}` : ""}
                    </p>
                  </div>

                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-all shrink-0">
                    <button
                      onClick={() => setEditingCategory(c)}
                      className="p-1.5 rounded-lg hover:bg-white/10 text-white/60 hover:text-white cursor-pointer transition-all"
                      title="Edit category"
                    >
                      <Edit3 className="size-4" />
                    </button>
                    <button
                      onClick={() => {
                        if (confirm(`Delete category "${c.name}"?`)) {
                          deleteCategory(c.id)
                        }
                      }}
                      className="p-1.5 rounded-lg hover:bg-red-500/20 text-white/40 hover:text-red-400 cursor-pointer transition-all"
                      title="Delete category"
                    >
                      <Trash2 className="size-4" />
                    </button>
                  </div>
                </div>

                {c.budget != null && c.budget > 0 && (
                  <div className="w-full mt-3">
                    <div className="w-full h-1.5 rounded-full bg-white/10 overflow-hidden">
                      <div
                        className="h-full rounded-full bg-white/40"
                        style={{
                          width: `${Math.min(100, Math.max(0, (spent / c.budget) * 100))}%`,
                        }}
                      />
                    </div>
                  </div>
                )}
              </motion.div>
            )
          })
        )}
      </div>

      {/* Modals */}
      <EditCategoryModal
        category={editingCategory}
        isOpen={Boolean(editingCategory)}
        onClose={() => setEditingCategory(null)}
      />
      <CategorySuggestionsModal
        isOpen={browseSuggestionsOpen}
        onClose={() => setBrowseSuggestionsOpen(false)}
      />
      <ManagePlansModal
        isOpen={managePlansOpen}
        onClose={() => setManagePlansOpen(false)}
        onEditPlan={(plan) => {
          setManagePlansOpen(false)
          if (onEditPlan) {
            onEditPlan(plan)
          } else {
            onNavigate("budget_planner")
          }
        }}
        onCreateNew={() => {
          setManagePlansOpen(false)
          onNavigate("budget_planner")
        }}
      />
    </div>
  )
}

// ─── Section: Settings Management ─────────────────────────────────

function SettingsSection({ onNavigate }: { onNavigate: (s: SectionId) => void }) {
  const { profile, updateProfile } = useUserProfile()
  const { refreshFinanceData } = useFinanceData()
  const { isDarkMode, isVideoEnabled, toggleTheme, toggleVideo, tokens } = useDashboardTheme()

  const [fullName, setFullName] = useState(profile.fullName)
  const [currency, setCurrency] = useState(profile.currency)
  const [isSaving, setIsSaving] = useState(false)
  const [savedSuccess, setSavedSuccess] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)
  const [resetModalOpen, setResetModalOpen] = useState(false)
  const [resetSuccessAlert, setResetSuccessAlert] = useState(false)

  // Sync state if profile changes (e.g. after reset or load)
  useEffect(() => {
    setFullName(profile.fullName)
    setCurrency(profile.currency)
  }, [profile.fullName, profile.currency])

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSaving(true)
    setSaveError(null)
    setSavedSuccess(false)
    try {
      await updateProfile({ fullName, currency })
      if (refreshFinanceData) {
        await refreshFinanceData()
      }
      setSavedSuccess(true)
      setTimeout(() => setSavedSuccess(false), 3000)
    } catch (err: any) {
      console.error("Save profile error:", err)
      setSaveError(err?.message || "Failed to update preferences.")
    } finally {
      setIsSaving(false)
    }
  }

  const handleLogout = async () => {
    try {
      if (isSupabaseConfigured && supabase) {
        await supabase.auth.signOut()
      }
    } catch (err) {
      console.warn("Supabase sign out error:", err)
    } finally {
      if (typeof window !== "undefined") {
        clearClientAuthSession()
        localStorage.clear()
        sessionStorage.clear()
        document.cookie.split(";").forEach((c) => {
          document.cookie = c.replace(/^ +/, "").replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/")
        })
        window.location.replace("/login")
      }
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

          {saveError && (
            <div className="p-3 rounded-2xl bg-red-500/20 border border-red-500/40 text-red-200 text-xs">
              {saveError}
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
                <option value="CAD" className="bg-[#1E0C38] text-white">CAD (Canadian Dollar)</option>
                <option value="AUD" className="bg-[#1E0C38] text-white">AUD (Australian Dollar)</option>
                <option value="JPY" className="bg-[#1E0C38] text-white">JPY (Japanese Yen)</option>
                <option value="KWD" className="bg-[#1E0C38] text-white">KWD (Kuwaiti Dinar)</option>
                <option value="QAR" className="bg-[#1E0C38] text-white">QAR (Qatari Riyal)</option>
              </select>
            </div>
          </div>

          <div className="pt-4 border-t space-y-4" style={{ borderColor: tokens.borderNested }}>
            <h3 className="text-sm font-bold text-white uppercase tracking-wider font-display">Display & Aesthetics</h3>

            <div data-tour="tour-theme-mode" className="flex items-center justify-between p-4 rounded-2xl border" style={{ backgroundColor: tokens.nestedSurface, borderColor: tokens.borderNested }}>
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

            <div data-tour="tour-video-toggle" className="flex items-center justify-between p-4 rounded-2xl border" style={{ backgroundColor: tokens.nestedSurface, borderColor: tokens.borderNested }}>
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

            {/* Admin Console Quick Link */}
            {Boolean(profile.is_admin || profile.email?.toLowerCase() === "themazen21@gmail.com") && (
              <div
                className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-2xl border transition-all"
                style={{
                  backgroundColor: "rgba(234, 179, 8, 0.08)",
                  borderColor: "rgba(234, 179, 8, 0.3)",
                }}
              >
                <div>
                  <p className="text-xs font-bold text-amber-300 font-sans flex items-center gap-1.5">
                    <ShieldAlert className="size-4" /> Root Admin Console
                  </p>
                  <p className="text-[10.5px] text-white/70 mt-0.5">Manage registered users, bans, security, and app-wide metrics</p>
                </div>
                <a
                  href="/admin"
                  className="px-4 py-2 rounded-xl text-xs font-bold text-[#120824] shadow-md cursor-pointer transition-all hover:scale-[1.02] flex items-center justify-center gap-1 shrink-0 text-center"
                  style={{ background: tokens.dashboardActivePill }}
                >
                  Open Admin Console &rarr;
                </a>
              </div>
            )}
          </div>

          {/* Danger Zone: Full Data Reset */}
          <div data-tour="tour-danger-zone" className="pt-4 border-t space-y-3" style={{ borderColor: tokens.borderNested }}>
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
              disabled={isSaving}
              className="px-6 py-2.5 rounded-xl text-xs font-bold text-[#120824] shadow-lg cursor-pointer transition-opacity disabled:opacity-50"
              style={{ background: tokens.dashboardActivePill }}
            >
              {isSaving ? "Saving..." : "Save Preferences"}
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
  budget_planner: BudgetPlannerSection,
}

function FinancialAnalyticsDashboardInner({
  initialSection = "dashboard",
}: {
  initialSection?: SectionId
}) {
  const [activeSection, setActiveSection] = useState<SectionId>(initialSection)
  const {
    accounts,
    transactions,
    categories,
    heldFunds,
    bills,
    netWorth,
    totalIncome,
    totalExpense,
    notifications,
    markNotificationAsRead,
  } = useFinanceData()
  const { profile, initials } = useUserProfile()
  const { isDarkMode, isVideoEnabled, tokens, toggleTheme, toggleVideo } = useDashboardTheme()
  const currencySymbol = getCurrencySymbol(profile.currency)

  const [addTxOpen, setAddTxOpen] = useState(false)
  const [addAccOpen, setAddAccOpen] = useState(false)
  const [addBillOpen, setAddBillOpen] = useState(false)
  const [monthSummaryOpen, setMonthSummaryOpen] = useState(false)
  const [editPlanTargetId, setEditPlanTargetId] = useState<string | null>(null)
  
  // Trial Mode Engine
  const { isTrialActive, isWizardOpen, onNavigateSection } = useTrialMode()

  useEffect(() => {
    if (isTrialActive && !isWizardOpen) {
      onNavigateSection(activeSection)
    }
  }, [activeSection, isTrialActive, isWizardOpen, onNavigateSection])
  
  // Feature 4: Edit & Delete Modal States
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null)
  const [deletingTransaction, setDeletingTransaction] = useState<Transaction | null>(null)

  // In-App Notification System
  const [notificationsOpen, setNotificationsOpen] = useState(false)

  const unreadNotifsCount = useMemo(() => {
    return notifications.filter((n) => !n.is_read).length
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
              className="flex items-center gap-2.5 cursor-pointer select-none group transition-transform duration-200 hover:scale-[1.03]"
            >
              <img
                src="/LOGO.png"
                alt="Spendly"
                className="h-8 sm:h-9 w-auto object-contain select-none drop-shadow-[0_2px_8px_rgba(0,0,0,0.3)]"
              />
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
              {/* Feature 3: Month Summary Button */}
              <button
                onClick={() => setMonthSummaryOpen(true)}
                className="hidden sm:flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-bold border border-white/15 bg-white/10 hover:bg-white/20 text-white cursor-pointer transition-all shadow-sm"
                title="Month Close-Out Summary"
              >
                <Calendar className="size-3.5 text-[#FEF08A]" />
                <span>Month Summary</span>
              </button>

              {/* Dedicated Admin Console Link (Shown for Admin) */}
              {Boolean(profile.is_admin || profile.email?.toLowerCase() === "themazen21@gmail.com") && (
                <a
                  href="/admin"
                  className="size-8 rounded-full flex items-center justify-center border border-amber-500/30 bg-amber-500/20 hover:bg-amber-500/35 text-amber-300 transition-all cursor-pointer shadow-md"
                  title="Admin Console"
                >
                  <ShieldAlert className="size-4" />
                </a>
              )}

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
                  accounts={accounts}
                  transactions={transactions}
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
                  heldFunds={heldFunds}
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
              if (activeSection === "budget_planner") {
                return (
                  <BudgetPlannerSection
                    onNavigate={(s) => {
                      setEditPlanTargetId(null)
                      setActiveSection(s)
                    }}
                    editPlanId={editPlanTargetId}
                  />
                )
              }
              if (activeSection === "categories") {
                return (
                  <CategoriesSection
                    onNavigate={setActiveSection}
                    onEditPlan={(plan) => {
                      setEditPlanTargetId(plan.id)
                      setActiveSection("budget_planner")
                    }}
                  />
                )
              }
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
        <AddBillModal isOpen={addBillOpen} onClose={() => setAddBillOpen(false)} />
        <MonthSummaryModal isOpen={monthSummaryOpen} onClose={() => setMonthSummaryOpen(false)} />
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
          onMarkAsRead={(id, refId) => markNotificationAsRead(id, refId)}
          onClearAll={async () => {
            for (const n of notifications) {
              await markNotificationAsRead(n.id, n.reference_id)
            }
          }}
        />

        {/* Trial Mode Wizard & Interactive Spotlight Tour */}
        <TrialSetupWizard
          onOpenAddAccount={() => setAddAccOpen(true)}
          onOpenAddTransaction={() => setAddTxOpen(true)}
          onOpenAddBill={() => setAddBillOpen(true)}
        />
        <SpotlightTour />
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
    <AuthGuard>
      <FinanceDataProvider>
        <DashboardThemeContext.Provider value={themeContextValue}>
          <TrialModeProvider>
            <FinancialAnalyticsDashboardInner initialSection={initialSection} />
          </TrialModeProvider>
        </DashboardThemeContext.Provider>
      </FinanceDataProvider>
    </AuthGuard>
  )
}

export default FinancialAnalyticsDashboard
