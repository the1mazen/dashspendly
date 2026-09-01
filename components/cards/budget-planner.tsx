"use client"

import React, { useState, useMemo, useEffect, useCallback } from "react"
import { motion, AnimatePresence } from "framer-motion"
import {
  Calculator,
  SlidersHorizontal,
  Check,
  AlertCircle,
  AlertTriangle,
  ArrowUpRight,
  ArrowDownLeft,
  ChevronDown,
  Calendar,
  DollarSign,
  Layers,
  PieChart,
  Plus,
  Trash2,
  Edit3,
  Clock,
  Sparkles,
  ShieldAlert,
  ArrowLeft,
  CheckCircle2,
  Receipt,
  Wallet,
  Info,
  TrendingUp,
  RefreshCw,
} from "lucide-react"
import {
  useFinanceData,
  BudgetPlan,
  BudgetPlanCategory,
  Category,
  Account,
  Bill,
  toCents,
  isValidUUID,
  getCurrencySymbol,
} from "@/lib/finance-data"
import { useUserProfile } from "@/lib/user-profile"
import { useDashboardTheme } from "@/components/cards/financial-analytics-dashboard"

const EASE_OUT = [0.16, 1, 0.3, 1] as const

const cardEntrance = (delay = 0) => ({
  initial: { opacity: 0, y: 16, scale: 0.97 },
  animate: { opacity: 1, y: 0, scale: 1 },
  transition: { duration: 0.5, ease: EASE_OUT, delay },
})

// Auto-assignment dictionary for 50/30/20 buckets
export function autoAssignBucket(categoryName: string): "needs" | "wants" | "savings" {
  const name = categoryName.trim().toLowerCase()

  // Savings keywords
  if (
    name.includes("saving") ||
    name.includes("emergency") ||
    name.includes("invest") ||
    name.includes("wealth") ||
    name.includes("crypto") ||
    name.includes("stock") ||
    name.includes("gold")
  ) {
    return "savings"
  }

  // Needs keywords
  if (
    name.includes("grocer") ||
    name.includes("supermarket") ||
    name.includes("bill") ||
    name.includes("utility") ||
    name.includes("utilities") ||
    name.includes("rent") ||
    name.includes("house") ||
    name.includes("home") ||
    name.includes("public transport") ||
    name.includes("metro") ||
    name.includes("bus") ||
    name.includes("subscription") ||
    name.includes("giving") ||
    name.includes("charity") ||
    name.includes("zakat") ||
    name.includes("health") ||
    name.includes("med") ||
    name.includes("doctor") ||
    name.includes("pharmacy") ||
    name.includes("educat") ||
    name.includes("school") ||
    name.includes("college") ||
    name.includes("tuition") ||
    name.includes("insurance")
  ) {
    return "needs"
  }

  // Wants keywords & default
  return "wants"
}

// ─── Modal: Manage Budget Plans ───────────────────────────────────────

export function ManagePlansModal({
  isOpen,
  onClose,
  onEditPlan,
  onCreateNew,
}: {
  isOpen: boolean
  onClose: () => void
  onEditPlan: (plan: BudgetPlan) => void
  onCreateNew: () => void
}) {
  const { budgetPlans, activeBudgetPlan, activateBudgetPlan, deleteBudgetPlan, renameBudgetPlan } = useFinanceData()
  const { profile } = useUserProfile()
  const { tokens } = useDashboardTheme()
  const currencySymbol = getCurrencySymbol(profile.currency)

  const [renamingId, setRenamingId] = useState<string | null>(null)
  const [renameValue, setRenameValue] = useState("")
  const [activatingId, setActivatingId] = useState<string | null>(null)
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const [successMsg, setSuccessMsg] = useState<string | null>(null)

  if (!isOpen) return null

  const handleActivate = async (plan: BudgetPlan) => {
    if (plan.is_active) return
    if (activeBudgetPlan && activeBudgetPlan.id !== plan.id) {
      if (!confirm(`Activating "${plan.name}" will replace your currently active category budgets with this plan's allocations. Continue?`)) {
        return
      }
    }
    setActivatingId(plan.id)
    setErrorMsg(null)
    try {
      await activateBudgetPlan(plan.id)
      setSuccessMsg(`Plan "${plan.name}" is now active!`)
      setTimeout(() => setSuccessMsg(null), 3000)
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to activate plan.")
    } finally {
      setActivatingId(null)
    }
  }

  const handleDelete = async (plan: BudgetPlan) => {
    if (!confirm(`Are you sure you want to delete the plan "${plan.name}"? ${plan.is_active ? "Since this plan is currently active, all category budgets will be reset." : ""}`)) {
      return
    }
    try {
      await deleteBudgetPlan(plan.id)
      setSuccessMsg(`Plan "${plan.name}" deleted.`)
      setTimeout(() => setSuccessMsg(null), 3000)
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to delete plan.")
    }
  }

  const handleStartRename = (plan: BudgetPlan) => {
    setRenamingId(plan.id)
    setRenameValue(plan.name)
  }

  const handleSaveRename = async (planId: string) => {
    if (!renameValue.trim()) return
    try {
      await renameBudgetPlan(planId, renameValue.trim())
      setRenamingId(null)
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to rename plan.")
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="w-full max-w-2xl rounded-3xl p-6 sm:p-7 border shadow-2xl backdrop-blur-2xl relative overflow-hidden max-h-[90vh] overflow-y-auto"
        style={{
          background: tokens.cardGradient,
          borderColor: tokens.border,
          boxShadow: tokens.cardShadow,
        }}
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b" style={{ borderColor: tokens.border }}>
          <div className="flex items-center gap-2.5">
            <div className="size-8 rounded-xl bg-purple-500/20 border border-purple-500/30 flex items-center justify-center text-purple-300">
              <SlidersHorizontal className="size-4" />
            </div>
            <div>
              <h3 className="text-lg font-bold font-display text-white">Manage Budget Plans</h3>
              <p className="text-xs font-sans text-white/70 mt-0.5">Switch active plans, edit allocations, or create new plans</p>
            </div>
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

        {successMsg && (
          <div className="mt-4 p-3 rounded-xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-200 text-xs flex items-center gap-2">
            <CheckCircle2 className="size-4 shrink-0 text-emerald-400" />
            <span>{successMsg}</span>
          </div>
        )}

        {/* Plans List */}
        <div className="mt-5 space-y-3">
          {budgetPlans.length === 0 ? (
            <div className="p-8 rounded-2xl border text-center space-y-3" style={{ backgroundColor: tokens.nestedSurface, borderColor: tokens.borderNested }}>
              <Calculator className="size-8 mx-auto text-white/40" />
              <p className="text-sm text-white/70">You don't have any saved budget plans yet.</p>
              <button
                type="button"
                onClick={() => {
                  onClose()
                  onCreateNew()
                }}
                className="px-4 py-2 rounded-xl text-xs font-bold text-[#120824] shadow-md cursor-pointer transition-all hover:scale-[1.02]"
                style={{ background: tokens.dashboardActivePill }}
              >
                Plan your first budget
              </button>
            </div>
          ) : (
            budgetPlans.map((plan) => {
              const isRenaming = renamingId === plan.id
              const isActivating = activatingId === plan.id
              const isSelectedActive = plan.is_active

              return (
                <motion.div
                  key={plan.id}
                  className={`p-4 rounded-2xl border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                    isSelectedActive ? "ring-1 ring-[#5EEAD4]/50 bg-white/5" : ""
                  }`}
                  style={{ backgroundColor: tokens.nestedSurface, borderColor: isSelectedActive ? "rgba(94, 234, 212, 0.4)" : tokens.borderNested }}
                >
                  <div className="space-y-1 min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      {isRenaming ? (
                        <div className="flex items-center gap-1.5">
                          <input
                            type="text"
                            value={renameValue}
                            onChange={(e) => setRenameValue(e.target.value)}
                            onKeyDown={(e) => e.key === "Enter" && handleSaveRename(plan.id)}
                            className="px-2.5 py-1 text-xs font-bold rounded-lg border bg-black/40 text-white focus:outline-none"
                            style={{ borderColor: tokens.borderNested }}
                            autoFocus
                          />
                          <button
                            type="button"
                            onClick={() => handleSaveRename(plan.id)}
                            className="px-2 py-1 text-[11px] font-bold rounded-lg bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
                          >
                            Save
                          </button>
                          <button
                            type="button"
                            onClick={() => setRenamingId(null)}
                            className="px-2 py-1 text-[11px] font-medium text-white/60"
                          >
                            Cancel
                          </button>
                        </div>
                      ) : (
                        <h4 className="text-sm font-bold text-white font-sans flex items-center gap-1.5">
                          <span>{plan.name}</span>
                          <button
                            type="button"
                            onClick={() => handleStartRename(plan)}
                            className="p-1 rounded text-white/40 hover:text-white hover:bg-white/10 transition-colors"
                            title="Rename plan"
                          >
                            <Edit3 className="size-3" />
                          </button>
                        </h4>
                      )}

                      {isSelectedActive ? (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold font-mono uppercase bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 flex items-center gap-1">
                          <span className="size-1.5 rounded-full bg-emerald-400 animate-pulse" />
                          Active Plan
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-mono text-white/50 bg-white/5 border border-white/10">
                          Inactive
                        </span>
                      )}
                    </div>

                    <p className="text-xs font-mono text-white/60 flex items-center gap-2 flex-wrap">
                      <span className="text-white font-bold">{currencySymbol}{plan.total_amount.toLocaleString("en-US", { minimumFractionDigits: 2 })}</span>
                      <span>•</span>
                      <span className="capitalize">{plan.period === "custom" ? `Every ${plan.custom_days || 30} days` : plan.period}</span>
                      <span>•</span>
                      <span>{plan.framework === "50/30/20" ? "50/30/20 Rule" : "Suggested Plan"}</span>
                      {plan.categories && (
                        <>
                          <span>•</span>
                          <span>{plan.categories.length} categories</span>
                        </>
                      )}
                    </p>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 shrink-0">
                    {!isSelectedActive ? (
                      <button
                        type="button"
                        disabled={isActivating}
                        onClick={() => handleActivate(plan)}
                        className="px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer shadow-md hover:scale-[1.02] text-[#120824]"
                        style={{ background: tokens.dashboardActivePill }}
                      >
                        {isActivating ? "Activating..." : "Activate"}
                      </button>
                    ) : (
                      <div className="px-3 py-1.5 text-xs font-bold text-emerald-400 flex items-center gap-1">
                        <Check className="size-3.5 stroke-[3]" /> Active
                      </div>
                    )}

                    <button
                      type="button"
                      onClick={() => {
                        onClose()
                        onEditPlan(plan)
                      }}
                      className="px-3 py-1.5 rounded-xl text-xs font-semibold border bg-white/5 hover:bg-white/15 text-white/80 transition-all cursor-pointer"
                      style={{ borderColor: tokens.borderNested }}
                    >
                      Edit
                    </button>

                    <button
                      type="button"
                      onClick={() => handleDelete(plan)}
                      className="p-2 rounded-xl text-white/40 hover:text-rose-400 hover:bg-rose-500/10 transition-all cursor-pointer"
                      title="Delete plan"
                    >
                      <Trash2 className="size-3.5" />
                    </button>
                  </div>
                </motion.div>
              )
            })
          )}
        </div>

        {/* Footer */}
        <div className="mt-6 pt-4 border-t flex items-center justify-between" style={{ borderColor: tokens.border }}>
          <button
            type="button"
            onClick={() => {
              onClose()
              onCreateNew()
            }}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold text-[#120824] shadow-md cursor-pointer transition-all hover:scale-[1.02]"
            style={{ background: tokens.dashboardActivePill }}
          >
            <Plus className="size-3.5" />
            <span>Create New Plan</span>
          </button>

          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-semibold text-white/70 hover:text-white"
          >
            Close
          </button>
        </div>
      </motion.div>
    </div>
  )
}

// ─── Main Section: Budget Planner ────────────────────────────────────

export function BudgetPlannerSection({
  onNavigate,
  editPlanId,
  renewPlanId,
}: {
  onNavigate: (s: any) => void
  editPlanId?: string | null
  renewPlanId?: string | null
}) {
  const {
    accounts,
    categories,
    transactions,
    bills,
    budgetPlans,
    createBudgetPlan,
    updateBudgetPlan,
    recordPlanHistory,
  } = useFinanceData()
  const { profile } = useUserProfile()
  const { tokens } = useDashboardTheme()
  const currencySymbol = getCurrencySymbol(profile.currency)

  // Load target plan if editing or renewing
  const existingPlan = useMemo(() => {
    const targetId = editPlanId || renewPlanId
    if (!targetId) return null
    return budgetPlans.find((p) => p.id === targetId) || null
  }, [budgetPlans, editPlanId, renewPlanId])

  // Is this a renewal flow for a repeating plan whose period ended?
  const isRenewalFlow = useMemo(() => {
    if (renewPlanId) return true
    if (existingPlan?.is_repeating) {
      const startObj = new Date(existingPlan.start_date)
      const endObj = new Date(existingPlan.start_date)
      if (existingPlan.period === "weekly") endObj.setDate(endObj.getDate() + 7)
      else if (existingPlan.period === "monthly") endObj.setMonth(endObj.getMonth() + 1)
      else if (existingPlan.period === "custom") endObj.setDate(endObj.getDate() + (existingPlan.custom_days || 30))
      return new Date().getTime() >= endObj.getTime()
    }
    return false
  }, [renewPlanId, existingPlan])

  // SECTION 4: Performance snapshot calculation for ended/renewed plan
  const lastPeriodPerformance = useMemo(() => {
    if (!existingPlan) return null
    const startStr = existingPlan.start_date
    const startObj = new Date(startStr)
    const endObj = new Date(startStr)
    if (existingPlan.period === "weekly") endObj.setDate(endObj.getDate() + 7)
    else if (existingPlan.period === "monthly") endObj.setMonth(endObj.getMonth() + 1)
    else if (existingPlan.period === "custom") endObj.setDate(endObj.getDate() + (existingPlan.custom_days || 30))
    const endStr = endObj.toISOString().split("T")[0]

    // Actual spending in this period
    const periodTxs = transactions.filter((t) => t.type === "expense" && t.date >= startStr && t.date <= endStr)

    const categoryBreakdown = (existingPlan.categories || []).map((alloc) => {
      const catObj = categories.find((c) => c.id === alloc.category_id)
      const actualSpent = periodTxs
        .filter((t) => t.category_id === alloc.category_id)
        .reduce((sum, t) => sum + Math.abs(t.amount), 0)
      const planned = alloc.allocated_amount
      const diff = planned - actualSpent

      let status: "over" | "under" | "on_track" = "on_track"
      if (actualSpent > planned) {
        status = "over"
      } else if (actualSpent < planned * 0.75 && planned > 0) {
        status = "under"
      }

      return {
        category_id: alloc.category_id,
        category_name: catObj?.name || alloc.category_name || "Category",
        bucket: alloc.bucket,
        planned,
        actual: actualSpent,
        unspent: Math.max(0, diff),
        status,
      }
    })

    const totalPlanned = existingPlan.total_amount
    const totalActual = categoryBreakdown.reduce((sum, c) => sum + c.actual, 0)
    const totalUnspent = categoryBreakdown.reduce((sum, c) => sum + c.unspent, 0)

    return {
      periodStart: startStr,
      periodEnd: endStr,
      totalPlanned,
      totalActual,
      totalUnspent,
      categoryBreakdown,
    }
  }, [existingPlan, transactions, categories])

  // Carry over toggle
  const [carryOverUnspent, setCarryOverUnspent] = useState(true)

  // ─── Section 1: Plan Basics State ───
  const [planName, setPlanName] = useState(existingPlan?.name || "Normal")
  const [budgetMode, setBudgetMode] = useState<"manual" | "account">(existingPlan?.account_id ? "account" : "manual")
  const [manualAmount, setManualAmount] = useState(existingPlan?.total_amount ? String(existingPlan.total_amount) : "5000")
  const [selectedAccountId, setSelectedAccountId] = useState(existingPlan?.account_id || (accounts[0]?.id || ""))
  const [period, setPeriod] = useState<"weekly" | "monthly" | "custom">(existingPlan?.period || "monthly")
  const [customDays, setCustomDays] = useState(existingPlan?.custom_days ? String(existingPlan.custom_days) : "14")
  const [startDate, setStartDate] = useState(new Date().toISOString().split("T")[0])

  // ─── Section 2: Budget Framework State ───
  const [framework, setFramework] = useState<"50/30/20" | "suggested">(existingPlan?.framework || "50/30/20")
  const [lookbackPeriod, setLookbackPeriod] = useState<"1m" | "3m" | "6m">("3m")
  const [categorySelectionMode, setCategorySelectionMode] = useState<"app" | "user">("app")
  const [selectedCatIds, setSelectedCatIds] = useState<string[]>(() => {
    if (existingPlan?.categories && existingPlan.categories.length > 0) {
      return existingPlan.categories.map((c) => c.category_id)
    }
    return categories.filter((c) => c.type === "expense").map((c) => c.id)
  })

  // Per-category allocations map: categoryId -> { bucket, amount }
  const [categoryAllocations, setCategoryAllocations] = useState<Record<string, { bucket: "needs" | "wants" | "savings"; amount: string }>>(() => {
    const initial: Record<string, { bucket: "needs" | "wants" | "savings"; amount: string }> = {}
    if (existingPlan?.categories && existingPlan.categories.length > 0) {
      existingPlan.categories.forEach((c) => {
        initial[c.category_id] = {
          bucket: c.bucket,
          amount: String(c.allocated_amount),
        }
      })
    }
    return initial
  })

  // ─── Section 5: Activation & Submission State ───
  const [activateNow, setActivateNow] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const [successMsg, setSuccessMsg] = useState<string | null>(null)

  // Selected account for balance mode
  const currentSelectedAccount = useMemo(() => {
    return accounts.find((a) => a.id === selectedAccountId) || accounts[0]
  }, [accounts, selectedAccountId])

  // Base budget figure before carry-over
  const baseBudgetAmount = useMemo(() => {
    if (budgetMode === "account") {
      return Number(currentSelectedAccount?.balance || 0)
    }
    return parseFloat(manualAmount) || 0
  }, [budgetMode, currentSelectedAccount, manualAmount])

  // Total budget figure including unspent carry-over if enabled
  const totalBudgetAmount = useMemo(() => {
    if (isRenewalFlow && carryOverUnspent && lastPeriodPerformance) {
      return baseBudgetAmount + lastPeriodPerformance.totalUnspent
    }
    return baseBudgetAmount
  }, [baseBudgetAmount, isRenewalFlow, carryOverUnspent, lastPeriodPerformance])

  // Compute period end date
  const periodEndDate = useMemo(() => {
    const d = new Date(startDate || new Date().toISOString().split("T")[0])
    if (period === "weekly") {
      d.setDate(d.getDate() + 7)
    } else if (period === "monthly") {
      d.setMonth(d.getMonth() + 1)
    } else if (period === "custom") {
      d.setDate(d.getDate() + (parseInt(customDays) || 30))
    }
    return d.toISOString().split("T")[0]
  }, [startDate, period, customDays])

  // Upcoming bills falling within [startDate, periodEndDate]
  const periodBills = useMemo(() => {
    return bills.filter((b) => !b.is_completed && b.due_date >= startDate && b.due_date <= periodEndDate)
  }, [bills, startDate, periodEndDate])

  const fixedExpenses = useMemo(() => {
    return periodBills
      .filter((b) => b.type === "expense")
      .reduce((sum, b) => sum + (b.amount + (b.fee_amount || 0)), 0)
  }, [periodBills])

  const fixedIncome = useMemo(() => {
    return periodBills
      .filter((b) => b.type === "income")
      .reduce((sum, b) => sum + b.amount, 0)
  }, [periodBills])

  // Free money available = total budget - fixed expenses + fixed income
  const freeMoneyAvailable = useMemo(() => {
    return Math.max(0, Math.round((totalBudgetAmount - fixedExpenses + fixedIncome) * 100) / 100)
  }, [totalBudgetAmount, fixedExpenses, fixedIncome])

  // ─── 50/30/20 Targets ───
  const rule503020Targets = useMemo(() => {
    return {
      needs: Math.round(freeMoneyAvailable * 0.5 * 100) / 100,
      wants: Math.round(freeMoneyAvailable * 0.3 * 100) / 100,
      savings: Math.round(freeMoneyAvailable * 0.2 * 100) / 100,
    }
  }, [freeMoneyAvailable])

  // Expense categories list
  const expenseCategories = useMemo(() => {
    return categories.filter((c) => c.type === "expense")
  }, [categories])

  // Categories with historical spend for lookback
  const lookbackStats = useMemo(() => {
    const now = new Date()
    const cutoff = new Date()
    let months = 3
    if (lookbackPeriod === "1m") months = 1
    if (lookbackPeriod === "6m") months = 6
    cutoff.setMonth(cutoff.getMonth() - months)
    const cutoffStr = cutoff.toISOString().split("T")[0]

    const lookbackTxs = transactions.filter((t) => t.type === "expense" && t.date >= cutoffStr)

    const stats: Record<string, { total: number; monthlyAvg: number; suggested: number }> = {}
    expenseCategories.forEach((cat) => {
      const catSpent = lookbackTxs
        .filter((t) => t.category_id === cat.id)
        .reduce((sum, t) => sum + Math.abs(t.amount), 0)
      const monthlyAvg = catSpent / months
      // Rounded to nearest 5
      const suggested = Math.max(0, Math.round(monthlyAvg / 5) * 5)
      stats[cat.id] = {
        total: catSpent,
        monthlyAvg: Math.round(monthlyAvg * 100) / 100,
        suggested,
      }
    })
    return stats
  }, [lookbackPeriod, transactions, expenseCategories])

  // Filtered categories to display based on mode
  const displayedCategories = useMemo(() => {
    if (categorySelectionMode === "app") {
      // Show categories with historical spend or currently selected
      const withSpend = expenseCategories.filter((c) => (lookbackStats[c.id]?.total || 0) > 0 || selectedCatIds.includes(c.id))
      return withSpend.length > 0 ? withSpend : expenseCategories
    }
    return expenseCategories
  }, [categorySelectionMode, expenseCategories, lookbackStats, selectedCatIds])

  // Initialize or re-distribute 50/30/20 or Suggested values when framework or free money changes
  useEffect(() => {
    if (existingPlan && Object.keys(categoryAllocations).length > 0) return

    const newAllocs: Record<string, { bucket: "needs" | "wants" | "savings"; amount: string }> = {}

    if (framework === "50/30/20") {
      // Group active categories by bucket
      const bucketGroups: { needs: Category[]; wants: Category[]; savings: Category[] } = {
        needs: [],
        wants: [],
        savings: [],
      }

      displayedCategories.forEach((c) => {
        const bucket = autoAssignBucket(c.name)
        bucketGroups[bucket].push(c)
      })

      // Distribute evenly per category in each bucket
      ;(["needs", "wants", "savings"] as const).forEach((b) => {
        const target = rule503020Targets[b]
        const group = bucketGroups[b]
        if (group.length > 0) {
          const perCat = Math.round((target / group.length) / 5) * 5
          group.forEach((cat) => {
            newAllocs[cat.id] = { bucket: b, amount: String(perCat) }
          })
        }
      })
    } else {
      // Suggested plan based on historical average
      displayedCategories.forEach((c) => {
        const suggested = lookbackStats[c.id]?.suggested || 0
        newAllocs[c.id] = {
          bucket: autoAssignBucket(c.name),
          amount: String(suggested),
        }
      })
    }

    setCategoryAllocations(newAllocs)
  }, [framework, freeMoneyAvailable, displayedCategories, lookbackStats])

  // Update allocation field
  const handleUpdateAllocation = (catId: string, field: "bucket" | "amount", value: string) => {
    setCategoryAllocations((prev) => ({
      ...prev,
      [catId]: {
        bucket: field === "bucket" ? (value as any) : prev[catId]?.bucket || autoAssignBucket(categories.find((c) => c.id === catId)?.name || ""),
        amount: field === "amount" ? value : prev[catId]?.amount || "0",
      },
    }))
  }

  // Active category allocations list
  const activeAllocationsList = useMemo(() => {
    return displayedCategories
      .filter((c) => categorySelectionMode === "app" || selectedCatIds.includes(c.id))
      .map((c) => {
        const alloc = categoryAllocations[c.id] || { bucket: autoAssignBucket(c.name), amount: "0" }
        const amt = parseFloat(alloc.amount) || 0
        return {
          category_id: c.id,
          category_name: c.name,
          bucket: alloc.bucket,
          allocated_amount: amt,
        }
      })
  }, [displayedCategories, categorySelectionMode, selectedCatIds, categoryAllocations])

  // Total allocated amount
  const totalAllocated = useMemo(() => {
    return activeAllocationsList.reduce((sum, a) => sum + a.allocated_amount, 0)
  }, [activeAllocationsList])

  // Allocations grouped by bucket
  const bucketTotals = useMemo(() => {
    let needs = 0
    let wants = 0
    let savings = 0
    activeAllocationsList.forEach((a) => {
      if (a.bucket === "needs") needs += a.allocated_amount
      else if (a.bucket === "wants") wants += a.allocated_amount
      else if (a.bucket === "savings") savings += a.allocated_amount
    })
    return { needs, wants, savings }
  }, [activeAllocationsList])

  // ─── SECTION 3: HEALTH ASSESSMENT ───
  const planHealth = useMemo(() => {
    const tips: string[] = []
    const isOverBudget = totalAllocated > freeMoneyAvailable
    const remainingFree = Math.round((freeMoneyAvailable - totalAllocated) * 100) / 100

    // Projected closing balance
    const projectedClosingBalance = Math.round((totalBudgetAmount - fixedExpenses + fixedIncome - totalAllocated) * 100) / 100

    // Bucket ratios
    const wantsPct = totalAllocated > 0 ? (bucketTotals.wants / totalAllocated) * 100 : 0
    const savingsPct = totalAllocated > 0 ? (bucketTotals.savings / totalAllocated) * 100 : 0

    if (wantsPct > 45) {
      tips.push(`Your plan allocates ${wantsPct.toFixed(0)}% to Wants — consider reducing Wants to stay near the 30% target.`)
    }

    if (bucketTotals.savings === 0 && totalAllocated > 0) {
      tips.push("You currently have no savings allocation — consider setting aside at least 10–20% for future buffer.")
    }

    // High single category check (> 25% of budget)
    activeAllocationsList.forEach((a) => {
      if (totalAllocated > 0 && (a.allocated_amount / totalAllocated) >= 0.25) {
        tips.push(`"${a.category_name}" takes ${( (a.allocated_amount / totalAllocated) * 100).toFixed(0)}% of your total budget.`)
      }
    })

    if (isOverBudget) {
      tips.push(`Warning: Your total category allocations exceed your free money by ${currencySymbol}${(totalAllocated - freeMoneyAvailable).toFixed(2)}.`)
    }

    let status: "balanced" | "warning" | "over" = "balanced"
    if (isOverBudget) {
      status = "over"
    } else if (wantsPct > 50 || bucketTotals.savings === 0) {
      status = "warning"
    }

    return {
      status,
      tips,
      isOverBudget,
      remainingFree,
      projectedClosingBalance,
      wantsPct,
      savingsPct,
    }
  }, [totalAllocated, freeMoneyAvailable, totalBudgetAmount, fixedExpenses, fixedIncome, bucketTotals, activeAllocationsList, currencySymbol])

  // ─── SECTION 5: CONFIRM PLAN HANDLER ───
  const handleConfirmPlan = async () => {
    if (!planName.trim()) {
      setErrorMsg("Please enter a name for your budget plan.")
      return
    }

    if (totalBudgetAmount <= 0) {
      setErrorMsg("Please enter or select a positive total budget amount.")
      return
    }

    if (planHealth.isOverBudget) {
      if (!confirm(`Your plan exceeds your available free money by ${currencySymbol}${(totalAllocated - freeMoneyAvailable).toFixed(2)}. Are you sure you want to save anyway?`)) {
        return
      }
    }

    setIsSubmitting(true)
    setErrorMsg(null)
    setSuccessMsg(null)

    try {
      // 1. If renewal flow, record history snapshot
      if (isRenewalFlow && lastPeriodPerformance && existingPlan) {
        await recordPlanHistory(
          existingPlan.id,
          lastPeriodPerformance.periodStart,
          lastPeriodPerformance.periodEnd,
          lastPeriodPerformance.totalPlanned,
          lastPeriodPerformance.totalActual,
          lastPeriodPerformance.categoryBreakdown.map((c) => ({
            category_id: c.category_id,
            planned_amount: c.planned,
            actual_amount: c.actual,
          }))
        )
      }

      // 2. Format category allocations
      const allocationsPayload: BudgetPlanCategory[] = activeAllocationsList.map((a) => ({
        category_id: a.category_id,
        bucket: a.bucket,
        allocated_amount: a.allocated_amount,
        allocated_amount_cents: Math.round(a.allocated_amount * 100),
      }))

      // 3. Create or update plan
      if (existingPlan && !isRenewalFlow) {
        await updateBudgetPlan(
          existingPlan.id,
          {
            name: planName.trim(),
            total_amount: totalBudgetAmount,
            account_id: budgetMode === "account" ? selectedAccountId : undefined,
            period,
            custom_days: period === "custom" ? parseInt(customDays) || 30 : undefined,
            start_date: startDate,
            framework,
            is_repeating: true,
          },
          allocationsPayload,
          activateNow
        )
      } else {
        await createBudgetPlan(
          {
            name: planName.trim(),
            total_amount: totalBudgetAmount,
            account_id: budgetMode === "account" ? selectedAccountId : undefined,
            period,
            custom_days: period === "custom" ? parseInt(customDays) || 30 : undefined,
            start_date: startDate,
            framework,
            is_repeating: true,
          },
          allocationsPayload,
          activateNow
        )
      }

      setSuccessMsg(`Budget plan "${planName.trim()}" saved successfully!`)
      setTimeout(() => {
        onNavigate("categories")
      }, 1200)
    } catch (err: any) {
      console.error("Budget plan save error:", err)
      setErrorMsg(err.message || "Failed to save budget plan. Please check your connection.")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="flex flex-col gap-6 max-w-5xl mx-auto w-full pb-16">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-white/10">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => onNavigate("categories")}
            className="p-2 rounded-xl border bg-white/5 hover:bg-white/15 text-white/80 transition-all cursor-pointer"
            style={{ borderColor: tokens.borderNested }}
            title="Back to Categories"
          >
            <ArrowLeft className="size-4" />
          </button>
          <div>
            <h2 className="text-xl sm:text-2xl font-bold font-display text-white flex items-center gap-2">
              <Calculator className="size-6 text-[#5EEAD4]" />
              <span>Budget Planner</span>
            </h2>
            <p className="text-xs sm:text-sm font-sans text-white/70 mt-0.5">
              Build, test, and activate structured spending plans for your finances
            </p>
          </div>
        </div>
      </div>

      {errorMsg && (
        <div className="p-4 rounded-2xl bg-red-500/20 border border-red-500/40 text-red-200 text-xs flex items-center gap-2.5">
          <AlertCircle className="size-4.5 shrink-0 text-red-400" />
          <span>{errorMsg}</span>
        </div>
      )}

      {successMsg && (
        <div className="p-4 rounded-2xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-200 text-xs flex items-center gap-2.5">
          <CheckCircle2 className="size-4.5 shrink-0 text-emerald-400" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* ─── SECTION 4: PERIOD PERFORMANCE (Shown when renewing an ended plan) ─── */}
      {isRenewalFlow && lastPeriodPerformance && (
        <motion.div
          {...cardEntrance(0.02)}
          className="rounded-3xl p-6 sm:p-7 border backdrop-blur-xl transition-all"
          style={{
            background: "linear-gradient(135deg, rgba(20, 10, 40, 0.85) 0%, rgba(30, 15, 60, 0.85) 100%)",
            borderColor: "rgba(168, 85, 247, 0.4)",
            boxShadow: tokens.cardShadow,
          }}
        >
          <div className="flex items-center justify-between pb-3 border-b border-white/10 mb-4">
            <div className="flex items-center gap-2">
              <Sparkles className="size-5 text-purple-300" />
              <div>
                <h3 className="text-base font-bold font-display text-white">Last Period Performance</h3>
                <p className="text-xs text-white/60 font-mono">
                  {lastPeriodPerformance.periodStart} to {lastPeriodPerformance.periodEnd}
                </p>
              </div>
            </div>
            <span className="px-2.5 py-1 rounded-full text-[10.5px] font-bold font-mono uppercase bg-purple-500/20 text-purple-300 border border-purple-500/40">
              Plan Renewal
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-4">
            <div className="p-3.5 rounded-xl border bg-white/5" style={{ borderColor: tokens.borderNested }}>
              <span className="text-[11px] uppercase tracking-wider text-white/60 font-sans block">Total Planned</span>
              <span className="text-lg font-bold font-mono text-white">
                {currencySymbol}{lastPeriodPerformance.totalPlanned.toFixed(2)}
              </span>
            </div>
            <div className="p-3.5 rounded-xl border bg-white/5" style={{ borderColor: tokens.borderNested }}>
              <span className="text-[11px] uppercase tracking-wider text-white/60 font-sans block">Total Actual Spent</span>
              <span className={`text-lg font-bold font-mono ${lastPeriodPerformance.totalActual > lastPeriodPerformance.totalPlanned ? "text-rose-400" : "text-emerald-400"}`}>
                {currencySymbol}{lastPeriodPerformance.totalActual.toFixed(2)}
              </span>
            </div>
            <div className="p-3.5 rounded-xl border bg-white/5" style={{ borderColor: tokens.borderNested }}>
              <span className="text-[11px] uppercase tracking-wider text-white/60 font-sans block">Unspent Budget</span>
              <span className="text-lg font-bold font-mono text-[#FEF08A]">
                +{currencySymbol}{lastPeriodPerformance.totalUnspent.toFixed(2)}
              </span>
            </div>
          </div>

          {/* Per-Category Performance Breakdown */}
          <div className="space-y-2 max-h-48 overflow-y-auto pr-1 mb-4">
            {lastPeriodPerformance.categoryBreakdown.map((cat) => (
              <div
                key={cat.category_id}
                className="flex items-center justify-between p-2.5 rounded-xl border bg-white/5 text-xs font-mono"
                style={{ borderColor: tokens.borderNested }}
              >
                <div className="flex items-center gap-2">
                  <span className="text-white font-sans font-semibold">{cat.category_name}</span>
                  <span className="px-1.5 py-0.5 rounded text-[9.5px] uppercase font-mono text-white/50 bg-white/5">
                    {cat.bucket}
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-white/60">
                    {currencySymbol}{cat.actual.toFixed(2)} / {currencySymbol}{cat.planned.toFixed(2)}
                  </span>
                  {cat.status === "over" && (
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-500/20 text-rose-300 border border-rose-500/40">
                      Over budget
                    </span>
                  )}
                  {cat.status === "under" && (
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40">
                      Under budget
                    </span>
                  )}
                  {cat.status === "on_track" && (
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                      On track
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Carry Over Unspent Toggle */}
          <div className="p-3.5 rounded-2xl border flex items-center justify-between gap-3 bg-purple-500/10 border-purple-400/30">
            <div>
              <span className="text-xs font-bold text-white font-display block">Carry over unspent budget?</span>
              <p className="text-[11px] text-white/70">
                Add +{currencySymbol}{lastPeriodPerformance.totalUnspent.toFixed(2)} unspent funds to this new period's budget.
              </p>
            </div>
            <div className="flex items-center gap-1 p-1 rounded-xl bg-black/40 border border-white/15 shrink-0">
              <button
                type="button"
                onClick={() => setCarryOverUnspent(true)}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  carryOverUnspent ? "bg-purple-500 text-white shadow-sm" : "text-white/60 hover:text-white"
                }`}
              >
                Yes
              </button>
              <button
                type="button"
                onClick={() => setCarryOverUnspent(false)}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  !carryOverUnspent ? "bg-white/20 text-white shadow-sm" : "text-white/60 hover:text-white"
                }`}
              >
                No
              </button>
            </div>
          </div>
        </motion.div>
      )}

      {/* ─── SECTION 1: PLAN BASICS ─── */}
      <motion.div
        {...cardEntrance(0.04)}
        className="rounded-3xl p-6 sm:p-7 border backdrop-blur-xl transition-all"
        style={{
          background: tokens.cardGradient,
          borderColor: tokens.border,
          boxShadow: tokens.cardShadow,
        }}
      >
        <div className="pb-3 mb-4 border-b flex items-center justify-between" style={{ borderColor: tokens.border }}>
          <div>
            <h3 className="text-base font-bold font-display text-white">1. Plan Basics</h3>
            <p className="text-xs text-white/70 font-sans mt-0.5">Define your plan name, total allowance, period, and start date</p>
          </div>
          <span className="size-7 rounded-xl bg-white/10 flex items-center justify-center font-mono font-bold text-xs text-[#FEF08A]">
            01
          </span>
        </div>

        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Plan Name */}
            <div>
              <label className="text-[11px] font-semibold uppercase tracking-wider block mb-1 font-sans text-white/75">
                Plan Name
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Normal, Tight Month, Vacation Saver"
                value={planName}
                onChange={(e) => setPlanName(e.target.value)}
                className="w-full px-3.5 py-2.5 border rounded-xl text-sm font-sans text-white focus:outline-none"
                style={{ backgroundColor: tokens.nestedSurface, borderColor: tokens.borderNested }}
              />
            </div>

            {/* Total Budget Amount */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-[11px] font-semibold uppercase tracking-wider font-sans text-white/75">
                  Total Budget Amount
                </label>
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => setBudgetMode("manual")}
                    className={`px-2 py-0.5 text-[10.5px] rounded-md font-semibold transition-all cursor-pointer ${
                      budgetMode === "manual" ? "bg-white/20 text-white" : "text-white/50 hover:text-white"
                    }`}
                  >
                    Manual
                  </button>
                  <button
                    type="button"
                    onClick={() => setBudgetMode("account")}
                    className={`px-2 py-0.5 text-[10.5px] rounded-md font-semibold transition-all cursor-pointer ${
                      budgetMode === "account" ? "bg-white/20 text-white" : "text-white/50 hover:text-white"
                    }`}
                  >
                    Account Balance
                  </button>
                </div>
              </div>

              {budgetMode === "manual" ? (
                <div className="relative">
                  <input
                    type="number"
                    step="0.01"
                    required
                    placeholder="0.00"
                    value={manualAmount}
                    onChange={(e) => setManualAmount(e.target.value)}
                    className="w-full px-3.5 py-2.5 border rounded-xl text-sm font-mono text-white focus:outline-none"
                    style={{ backgroundColor: tokens.nestedSurface, borderColor: tokens.borderNested }}
                  />
                  <span className="absolute right-3.5 top-2.5 text-xs font-mono text-white/50">
                    {currencySymbol.trim()}
                  </span>
                </div>
              ) : (
                <div className="space-y-1.5">
                  <select
                    value={selectedAccountId}
                    onChange={(e) => setSelectedAccountId(e.target.value)}
                    className="w-full px-3.5 py-2.5 border rounded-xl text-sm font-sans text-white focus:outline-none"
                    style={{ backgroundColor: tokens.nestedSurface, borderColor: tokens.borderNested }}
                  >
                    {accounts.map((acc) => (
                      <option key={acc.id} value={acc.id} className="bg-[#1E0C38] text-white">
                        {acc.name} ({currencySymbol}{Number(acc.balance || 0).toFixed(2)})
                      </option>
                    ))}
                  </select>
                  <p className="text-[11px] text-white/60 font-mono">
                    Selected balance: <strong className="text-white">{currencySymbol}{Number(currentSelectedAccount?.balance || 0).toFixed(2)}</strong>
                  </p>
                </div>
              )}

              {isRenewalFlow && carryOverUnspent && (lastPeriodPerformance?.totalUnspent || 0) > 0 && (
                <span className="mt-1.5 inline-flex items-center gap-1 text-[10.5px] font-mono text-purple-300 bg-purple-500/20 px-2 py-0.5 rounded-md border border-purple-500/30">
                  +{currencySymbol}{lastPeriodPerformance?.totalUnspent.toFixed(2)} unspent carry-over included
                </span>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Period Selector */}
            <div>
              <label className="text-[11px] font-semibold uppercase tracking-wider block mb-1 font-sans text-white/75">
                Period Duration
              </label>
              <div className="grid grid-cols-3 gap-1 p-1 border rounded-xl" style={{ backgroundColor: tokens.nestedSurface, borderColor: tokens.borderNested }}>
                {(["weekly", "monthly", "custom"] as const).map((p) => (
                  <button
                    key={p}
                    type="button"
                    onClick={() => setPeriod(p)}
                    className="py-1.5 px-2 text-center rounded-lg text-xs font-semibold capitalize transition-all font-sans cursor-pointer truncate"
                    style={{
                      background: period === p ? tokens.dashboardActivePill : "transparent",
                      color: period === p ? "#120824" : "rgba(255, 255, 255, 0.75)",
                      fontWeight: period === p ? "bold" : "normal",
                    }}
                  >
                    {p}
                  </button>
                ))}
              </div>

              {period === "custom" && (
                <div className="mt-2 flex items-center gap-2">
                  <span className="text-xs text-white/70 font-sans">Every</span>
                  <input
                    type="number"
                    min="1"
                    value={customDays}
                    onChange={(e) => setCustomDays(e.target.value)}
                    className="w-20 px-2.5 py-1.5 border rounded-lg text-xs font-mono text-white text-center focus:outline-none"
                    style={{ backgroundColor: tokens.nestedSurface, borderColor: tokens.borderNested }}
                  />
                  <span className="text-xs text-white/70 font-sans">days</span>
                </div>
              )}
            </div>

            {/* Start Date */}
            <div>
              <label className="text-[11px] font-semibold uppercase tracking-wider block mb-1 font-sans text-white/75">
                Start Date
              </label>
              <input
                type="date"
                required
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full px-3.5 py-2.5 border rounded-xl text-sm font-sans text-white focus:outline-none"
                style={{ backgroundColor: tokens.nestedSurface, borderColor: tokens.borderNested }}
              />
              <p className="text-[10.5px] font-mono text-white/50 mt-1">
                Period runs until {periodEndDate}
              </p>
            </div>
          </div>

          {/* Bills Deduction Preview */}
          <div className="p-4 rounded-2xl border space-y-3" style={{ backgroundColor: tokens.nestedSurface, borderColor: tokens.borderNested }}>
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-white flex items-center gap-1.5 font-display">
                <Receipt className="size-4 text-[#FEF08A]" />
                Fixed Commitments This Period ({startDate} to {periodEndDate})
              </span>
              <span className="text-[11px] font-mono text-white/60">
                {periodBills.length} scheduled bills
              </span>
            </div>

            {periodBills.length === 0 ? (
              <p className="text-xs text-white/50 font-sans italic">
                No active bills scheduled within this period.
              </p>
            ) : (
              <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1">
                {periodBills.map((b) => (
                  <div key={b.id} className="flex items-center justify-between p-2 rounded-xl bg-white/5 text-xs font-mono">
                    <span className="text-white font-sans">{b.name} ({b.due_date})</span>
                    <span className={b.type === "income" ? "text-emerald-400 font-bold" : "text-rose-400 font-bold"}>
                      {b.type === "income" ? "+" : "-"}{currencySymbol}{b.amount.toFixed(2)}
                    </span>
                  </div>
                ))}
              </div>
            )}

            {/* Calculations Banner */}
            <div className="pt-3 border-t border-white/10 grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs font-mono">
              <div>
                <span className="text-white/60 block text-[10.5px] uppercase">Fixed Expenses:</span>
                <span className="text-rose-300 font-bold">-{currencySymbol}{fixedExpenses.toFixed(2)}</span>
              </div>
              <div>
                <span className="text-white/60 block text-[10.5px] uppercase">Fixed Income:</span>
                <span className="text-emerald-300 font-bold">+{currencySymbol}{fixedIncome.toFixed(2)}</span>
              </div>
              <div className="p-2 rounded-xl bg-emerald-500/15 border border-emerald-500/30">
                <span className="text-emerald-200 block text-[10.5px] uppercase font-bold">Free Money Available:</span>
                <span className="text-base font-bold text-[#5EEAD4]">{currencySymbol}{freeMoneyAvailable.toFixed(2)}</span>
              </div>
            </div>
          </div>
        </div>
      </motion.div>

      {/* ─── SECTION 2: BUDGET FRAMEWORK & ALLOCATIONS ─── */}
      <motion.div
        {...cardEntrance(0.06)}
        className="rounded-3xl p-6 sm:p-7 border backdrop-blur-xl transition-all"
        style={{
          background: tokens.cardGradient,
          borderColor: tokens.border,
          boxShadow: tokens.cardShadow,
        }}
      >
        <div className="pb-3 mb-4 border-b flex items-center justify-between" style={{ borderColor: tokens.border }}>
          <div>
            <h3 className="text-base font-bold font-display text-white">2. Budget Framework & Category Allocations</h3>
            <p className="text-xs text-white/70 font-sans mt-0.5">Distribute your {currencySymbol}{freeMoneyAvailable.toFixed(2)} free money across categories</p>
          </div>
          <span className="size-7 rounded-xl bg-white/10 flex items-center justify-center font-mono font-bold text-xs text-[#FEF08A]">
            02
          </span>
        </div>

        {/* Framework Selector */}
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => setFramework("50/30/20")}
              className={`p-4 rounded-2xl border text-left transition-all cursor-pointer ${
                framework === "50/30/20" ? "ring-2 ring-[#5EEAD4] bg-white/10" : "bg-white/5 opacity-70 hover:opacity-100"
              }`}
              style={{ borderColor: framework === "50/30/20" ? "#5EEAD4" : tokens.borderNested }}
            >
              <div className="flex items-center justify-between mb-1">
                <span className="font-bold text-white text-sm font-display flex items-center gap-1.5">
                  <PieChart className="size-4 text-[#5EEAD4]" /> 50/30/20 Rule
                </span>
                {framework === "50/30/20" && <Check className="size-4 text-[#5EEAD4]" />}
              </div>
              <p className="text-xs text-white/70 font-sans">
                50% Needs, 30% Wants, 20% Savings. Balanced golden standard for financial peace.
              </p>
            </button>

            <button
              type="button"
              onClick={() => setFramework("suggested")}
              className={`p-4 rounded-2xl border text-left transition-all cursor-pointer ${
                framework === "suggested" ? "ring-2 ring-[#5EEAD4] bg-white/10" : "bg-white/5 opacity-70 hover:opacity-100"
              }`}
              style={{ borderColor: framework === "suggested" ? "#5EEAD4" : tokens.borderNested }}
            >
              <div className="flex items-center justify-between mb-1">
                <span className="font-bold text-white text-sm font-display flex items-center gap-1.5">
                  <TrendingUp className="size-4 text-[#FEF08A]" /> Suggested Plan
                </span>
                {framework === "suggested" && <Check className="size-4 text-[#5EEAD4]" />}
              </div>
              <p className="text-xs text-white/70 font-sans">
                Computed from your actual spending history averages, rounded to nearest 5.
              </p>
            </button>
          </div>

          {/* 50/30/20 Target Breakdown Cards */}
          {framework === "50/30/20" && (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-4 rounded-2xl border" style={{ backgroundColor: tokens.nestedSurface, borderColor: tokens.borderNested }}>
              <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30">
                <span className="text-[11px] font-bold font-display uppercase tracking-wider text-emerald-300 block">
                  Needs (50%)
                </span>
                <span className="text-lg font-bold font-mono text-white">
                  {currencySymbol}{rule503020Targets.needs.toFixed(2)}
                </span>
                <p className="text-[10px] text-white/60 font-sans mt-0.5">Groceries, bills, transport, giving</p>
              </div>

              <div className="p-3 rounded-xl bg-purple-500/10 border border-purple-500/30">
                <span className="text-[11px] font-bold font-display uppercase tracking-wider text-purple-300 block">
                  Wants (30%)
                </span>
                <span className="text-lg font-bold font-mono text-white">
                  {currencySymbol}{rule503020Targets.wants.toFixed(2)}
                </span>
                <p className="text-[10px] text-white/60 font-sans mt-0.5">Dining, cafés, shopping, games</p>
              </div>

              <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/30">
                <span className="text-[11px] font-bold font-display uppercase tracking-wider text-amber-300 block">
                  Savings (20%)
                </span>
                <span className="text-lg font-bold font-mono text-white">
                  {currencySymbol}{rule503020Targets.savings.toFixed(2)}
                </span>
                <p className="text-[10px] text-white/60 font-sans mt-0.5">Emergency fund, investments</p>
              </div>
            </div>
          )}

          {/* Suggested Plan Lookback Selector */}
          {framework === "suggested" && (
            <div className="p-4 rounded-2xl border flex flex-wrap items-center justify-between gap-3" style={{ backgroundColor: tokens.nestedSurface, borderColor: tokens.borderNested }}>
              <div>
                <span className="text-xs font-bold text-white font-display block">Lookback History Range:</span>
                <p className="text-[11px] text-white/60">Averages calculated from logged transactions</p>
              </div>
              <div className="grid grid-cols-3 gap-1 p-1 border rounded-xl bg-black/30" style={{ borderColor: tokens.borderNested }}>
                {(["1m", "3m", "6m"] as const).map((lb) => (
                  <button
                    key={lb}
                    type="button"
                    onClick={() => setLookbackPeriod(lb)}
                    className={`px-3 py-1 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                      lookbackPeriod === lb ? "bg-white/20 text-white font-bold" : "text-white/60 hover:text-white"
                    }`}
                  >
                    {lb === "1m" ? "Last Month" : lb === "3m" ? "Last 3 Mos" : "Last 6 Mos"}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Category Filter Toggle */}
          <div className="flex items-center justify-between pt-2">
            <span className="text-xs font-bold text-white font-display">Category Allocations:</span>
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => setCategorySelectionMode("app")}
                className={`px-2.5 py-1 text-xs rounded-lg font-semibold transition-all cursor-pointer ${
                  categorySelectionMode === "app" ? "bg-white/20 text-white font-bold" : "text-white/50 hover:text-white"
                }`}
              >
                App selects categories
              </button>
              <button
                type="button"
                onClick={() => setCategorySelectionMode("user")}
                className={`px-2.5 py-1 text-xs rounded-lg font-semibold transition-all cursor-pointer ${
                  categorySelectionMode === "user" ? "bg-white/20 text-white font-bold" : "text-white/50 hover:text-white"
                }`}
              >
                I select categories
              </button>
            </div>
          </div>

          {/* Category Allocations Rows */}
          <div className="space-y-2 max-h-[340px] overflow-y-auto pr-1">
            {displayedCategories.map((cat) => {
              const isIncluded = categorySelectionMode === "app" || selectedCatIds.includes(cat.id)
              const alloc = categoryAllocations[cat.id] || { bucket: autoAssignBucket(cat.name), amount: "0" }

              return (
                <div
                  key={cat.id}
                  className={`p-3 rounded-2xl border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                    !isIncluded ? "opacity-40" : ""
                  }`}
                  style={{ backgroundColor: tokens.nestedSurface, borderColor: tokens.borderNested }}
                >
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    {categorySelectionMode === "user" && (
                      <input
                        type="checkbox"
                        checked={isIncluded}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedCatIds((prev) => [...prev, cat.id])
                          } else {
                            setSelectedCatIds((prev) => prev.filter((id) => id !== cat.id))
                          }
                        }}
                        className="size-4 rounded accent-[#5EEAD4] cursor-pointer"
                      />
                    )}
                    <div className="min-w-0">
                      <h4 className="text-xs font-bold text-white font-sans truncate">{cat.name}</h4>
                      {framework === "suggested" && (
                        <p className="text-[10.5px] font-mono text-white/50">
                          Avg: {currencySymbol}{lookbackStats[cat.id]?.monthlyAvg.toFixed(2)}/mo
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    {/* Bucket Selector */}
                    <select
                      value={alloc.bucket}
                      onChange={(e) => handleUpdateAllocation(cat.id, "bucket", e.target.value)}
                      className="px-2.5 py-1.5 border rounded-xl text-xs font-sans text-white focus:outline-none bg-[#1E0C38]/90"
                      style={{ borderColor: tokens.borderNested }}
                    >
                      <option value="needs" className="bg-[#1E0C38] text-emerald-300">Needs (50%)</option>
                      <option value="wants" className="bg-[#1E0C38] text-purple-300">Wants (30%)</option>
                      <option value="savings" className="bg-[#1E0C38] text-amber-300">Savings (20%)</option>
                    </select>

                    {/* Allocated Amount */}
                    <div className="w-28 relative">
                      <input
                        type="number"
                        step="1"
                        placeholder="0"
                        value={alloc.amount}
                        onChange={(e) => handleUpdateAllocation(cat.id, "amount", e.target.value)}
                        className="w-full px-2.5 py-1.5 border rounded-xl text-xs font-mono text-white text-right focus:outline-none bg-[#1E0C38]/90"
                        style={{ borderColor: tokens.borderNested }}
                      />
                    </div>
                  </div>
                </div>
              )
            })}
          </div>

          {/* Running Allocations Total Banner */}
          <div className="pt-3 border-t border-white/10 flex flex-wrap items-center justify-between gap-2 text-xs font-mono">
            <span className="text-white/70">
              Total Allocated: <strong className="text-white">{currencySymbol}{totalAllocated.toFixed(2)}</strong> of <strong className="text-[#5EEAD4]">{currencySymbol}{freeMoneyAvailable.toFixed(2)}</strong> available
            </span>
            <span className={`font-bold ${totalAllocated <= freeMoneyAvailable ? "text-emerald-400" : "text-rose-400"}`}>
              {totalAllocated <= freeMoneyAvailable ? (
                `✓ ${currencySymbol}${(freeMoneyAvailable - totalAllocated).toFixed(2)} unallocated`
              ) : (
                `⚠️ Exceeds by ${currencySymbol}${(totalAllocated - freeMoneyAvailable).toFixed(2)}`
              )}
            </span>
          </div>
        </div>
      </motion.div>

      {/* ─── SECTION 3: PLAN HEALTH ASSESSMENT ─── */}
      <motion.div
        {...cardEntrance(0.08)}
        className="rounded-3xl p-6 sm:p-7 border backdrop-blur-xl transition-all"
        style={{
          background: tokens.cardGradient,
          borderColor: tokens.border,
          boxShadow: tokens.cardShadow,
        }}
      >
        <div className="pb-3 mb-4 border-b flex items-center justify-between" style={{ borderColor: tokens.border }}>
          <div>
            <h3 className="text-base font-bold font-display text-white">3. Plan Health Assessment</h3>
            <p className="text-xs text-white/70 font-sans mt-0.5">Live simulation of your financial trajectory</p>
          </div>
          <span className="size-7 rounded-xl bg-white/10 flex items-center justify-center font-mono font-bold text-xs text-[#FEF08A]">
            03
          </span>
        </div>

        <div className="space-y-4">
          <div className="flex items-center justify-between p-4 rounded-2xl border" style={{ backgroundColor: tokens.nestedSurface, borderColor: tokens.borderNested }}>
            <div>
              <span className="text-xs uppercase tracking-wider text-white/60 font-sans block">Overall Plan Status</span>
              <span className={`text-base font-bold font-display mt-0.5 block ${
                planHealth.status === "balanced" ? "text-emerald-400" : planHealth.status === "warning" ? "text-amber-400" : "text-rose-400"
              }`}>
                {planHealth.status === "balanced" && "Balanced ✓"}
                {planHealth.status === "warning" && "Needs Attention ⚠"}
                {planHealth.status === "over" && "Over Budget ✗"}
              </span>
            </div>

            <div className="text-right">
              <span className="text-xs uppercase tracking-wider text-white/60 font-sans block">Projected End Balance</span>
              <span className={`text-base font-bold font-mono ${planHealth.projectedClosingBalance >= 0 ? "text-emerald-400" : "text-rose-400"}`}>
                {currencySymbol}{planHealth.projectedClosingBalance.toFixed(2)}
              </span>
            </div>
          </div>

          {/* Actionable Tips List */}
          {planHealth.tips.length > 0 && (
            <div className="space-y-2">
              <span className="text-xs font-bold text-white font-display">Plan Insights & Recommendations:</span>
              {planHealth.tips.map((tip, idx) => (
                <div key={idx} className="p-3 rounded-xl bg-white/5 border border-white/10 text-xs text-white/80 flex items-start gap-2">
                  <Info className="size-4 text-purple-300 shrink-0 mt-0.5" />
                  <span>{tip}</span>
                </div>
              ))}
            </div>
          )}

          {/* Overspend Warning Banner */}
          {planHealth.isOverBudget && (
            <div className="p-4 rounded-2xl bg-rose-500/20 border border-rose-500/50 text-rose-200 text-xs flex items-center gap-3">
              <ShieldAlert className="size-5 shrink-0 text-rose-400" />
              <span>
                <strong>Overspend Warning:</strong> Your plan exceeds your available free money by {currencySymbol}${(totalAllocated - freeMoneyAvailable).toFixed(2)}. Reduce category allocations before confirming.
              </span>
            </div>
          )}
        </div>
      </motion.div>

      {/* ─── SECTION 5: CONFIRM & ACTIVATE ─── */}
      <motion.div
        {...cardEntrance(0.1)}
        className="rounded-3xl p-6 sm:p-7 border backdrop-blur-xl transition-all"
        style={{
          background: tokens.cardGradient,
          borderColor: tokens.border,
          boxShadow: tokens.cardShadow,
        }}
      >
        <div className="pb-3 mb-4 border-b flex items-center justify-between" style={{ borderColor: tokens.border }}>
          <div>
            <h3 className="text-base font-bold font-display text-white">4. Confirm & Activate Plan</h3>
            <p className="text-xs text-white/70 font-sans mt-0.5">Review summary and apply allocations to your categories</p>
          </div>
          <span className="size-7 rounded-xl bg-white/10 flex items-center justify-center font-mono font-bold text-xs text-[#FEF08A]">
            04
          </span>
        </div>

        <div className="space-y-5">
          {/* Plan Summary Card */}
          <div className="p-4 rounded-2xl border grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs font-mono" style={{ backgroundColor: tokens.nestedSurface, borderColor: tokens.borderNested }}>
            <div>
              <span className="text-white/60 block text-[10.5px] uppercase font-sans">Plan Name</span>
              <span className="text-white font-bold">{planName}</span>
            </div>
            <div>
              <span className="text-white/60 block text-[10.5px] uppercase font-sans">Period</span>
              <span className="text-white font-bold capitalize">{period}</span>
            </div>
            <div>
              <span className="text-white/60 block text-[10.5px] uppercase font-sans">Total Budget</span>
              <span className="text-white font-bold">{currencySymbol}{totalBudgetAmount.toFixed(2)}</span>
            </div>
            <div>
              <span className="text-white/60 block text-[10.5px] uppercase font-sans">Free Money</span>
              <span className="text-[#5EEAD4] font-bold">{currencySymbol}{freeMoneyAvailable.toFixed(2)}</span>
            </div>
          </div>

          {/* Activation Toggle */}
          <div className="p-4 rounded-2xl border flex flex-col sm:flex-row sm:items-center justify-between gap-3" style={{ backgroundColor: tokens.nestedSurface, borderColor: tokens.borderNested }}>
            <div>
              <span className="text-xs font-bold text-white font-display block">Plan Activation:</span>
              <p className="text-[11px] text-white/70">
                {activateNow
                  ? `Plan starts ${startDate}. Category budgets will be immediately updated to this plan's allocations.`
                  : "Save this plan as a template without modifying current active category budgets."}
              </p>
            </div>

            <div className="flex items-center gap-1 p-1 rounded-xl bg-black/40 border border-white/15 shrink-0">
              <button
                type="button"
                onClick={() => setActivateNow(true)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  activateNow ? "bg-[#5EEAD4] text-[#120824] shadow-sm" : "text-white/60 hover:text-white"
                }`}
              >
                Activate now
              </button>
              <button
                type="button"
                onClick={() => setActivateNow(false)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  !activateNow ? "bg-white/20 text-white shadow-sm" : "text-white/60 hover:text-white"
                }`}
              >
                Save for later
              </button>
            </div>
          </div>

          {/* 80% Notification Note */}
          <div className="p-3 rounded-xl bg-purple-500/10 border border-purple-500/20 text-xs text-purple-200 flex items-center gap-2">
            <span className="text-base">🔔</span>
            <span>
              <strong>80% Notification:</strong> You'll automatically receive an alert when any category reaches 80% of its budget allowance.
            </span>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-between pt-2">
            <button
              type="button"
              onClick={() => onNavigate("categories")}
              className="px-4 py-2.5 rounded-xl text-xs font-semibold text-white/70 hover:text-white cursor-pointer"
            >
              Cancel
            </button>

            <button
              type="button"
              disabled={isSubmitting}
              onClick={handleConfirmPlan}
              className="px-6 py-3 rounded-xl text-xs font-bold transition-all font-sans cursor-pointer shadow-xl hover:scale-[1.02] text-[#120824] flex items-center gap-2"
              style={{ background: tokens.dashboardActivePill }}
            >
              {isSubmitting ? (
                <>
                  <RefreshCw className="size-4 animate-spin" />
                  <span>Saving Plan to Supabase...</span>
                </>
              ) : (
                <>
                  <Check className="size-4 stroke-[3]" />
                  <span>Confirm Plan</span>
                </>
              )}
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  )
}
