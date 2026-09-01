"use client"

import React, { useState, useMemo, useEffect, useCallback, useRef } from "react"
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
  ChevronUp,
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
  Lock,
  RotateCcw,
  CheckSquare,
  Square,
  ArrowRight,
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
    if (!confirm(`Delete '${plan.name}'? This cannot be undone.`)) {
      return
    }
    try {
      await deleteBudgetPlan(plan.id)
      setSuccessMsg(`Plan '${plan.name}' was deleted.`)
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

// ─── Modal: Inline Add Category inside Budget Planner ─────────────────

function AddCategoryInlineModal({
  isOpen,
  onClose,
  onCategoryCreated,
}: {
  isOpen: boolean
  onClose: () => void
  onCategoryCreated: (cat: Category) => void
}) {
  const { createCategory } = useFinanceData()
  const { profile } = useUserProfile()
  const { tokens } = useDashboardTheme()
  const currencySymbol = getCurrencySymbol(profile.currency)

  const [name, setName] = useState("")
  const [type, setType] = useState<"expense" | "income">("expense")
  const [budget, setBudget] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  if (!isOpen) return null

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) return
    setIsSubmitting(true)
    setErrorMsg(null)
    try {
      const created = await createCategory({
        name: name.trim(),
        type,
        budget: parseFloat(budget) || undefined,
        currency: profile.currency || "EGP",
      })
      onCategoryCreated(created)
      onClose()
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to create category.")
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
        className="w-full max-w-md rounded-3xl p-6 border shadow-2xl backdrop-blur-2xl relative"
        style={{
          background: tokens.cardGradient,
          borderColor: tokens.border,
          boxShadow: tokens.cardShadow,
        }}
      >
        <div className="flex items-center justify-between pb-3 border-b mb-4" style={{ borderColor: tokens.border }}>
          <h3 className="text-base font-bold font-display text-white">Add New Category</h3>
          <button onClick={onClose} className="text-white/60 hover:text-white">✕</button>
        </div>

        {errorMsg && (
          <div className="mb-3 p-3 rounded-xl bg-red-500/20 border border-red-500/40 text-red-200 text-xs">
            {errorMsg}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label className="text-[11px] font-semibold uppercase tracking-wider block mb-1 text-white/75">
              Category Name
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Dining Out, Utilities"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3.5 py-2.5 border rounded-xl text-sm text-white focus:outline-none"
              style={{ backgroundColor: tokens.nestedSurface, borderColor: tokens.borderNested }}
              autoFocus
            />
          </div>

          <div>
            <label className="text-[11px] font-semibold uppercase tracking-wider block mb-1 text-white/75">
              Category Type
            </label>
            <select
              value={type}
              onChange={(e) => setType(e.target.value as any)}
              className="w-full px-3.5 py-2.5 border rounded-xl text-sm text-white focus:outline-none"
              style={{ backgroundColor: tokens.nestedSurface, borderColor: tokens.borderNested }}
            >
              <option value="expense" className="bg-[#1E0C38] text-white">Expense Category</option>
              <option value="income" className="bg-[#1E0C38] text-white">Income Category</option>
            </select>
          </div>

          <div>
            <label className="text-[11px] font-semibold uppercase tracking-wider block mb-1 text-white/75">
              Default Monthly Budget ({currencySymbol.trim()}) - Optional
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

          <div className="flex items-center justify-end gap-2 pt-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-white/70 hover:text-white"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2 rounded-xl text-xs font-bold text-[#120824] shadow-lg cursor-pointer transition-all hover:scale-[1.02]"
              style={{ background: tokens.dashboardActivePill }}
            >
              {isSubmitting ? "Creating..." : "Create Category"}
            </button>
          </div>
        </form>
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
    refreshFinanceData,
  } = useFinanceData()
  const { profile } = useUserProfile()
  const { tokens } = useDashboardTheme()
  const currencySymbol = getCurrencySymbol(profile.currency)

  // Check URL params if in browser
  const urlPlanId = useMemo(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search)
      return params.get("edit") || params.get("renew") || null
    }
    return null
  }, [])

  // Target existing plan if editing or renewing
  const existingPlan = useMemo(() => {
    const targetId = editPlanId || renewPlanId || urlPlanId
    if (!targetId) return null
    return budgetPlans.find((p) => p.id === targetId) || null
  }, [budgetPlans, editPlanId, renewPlanId, urlPlanId])

  const isEditing = Boolean(editPlanId && existingPlan)

  // Is renewal flow for an active repeating plan whose period has elapsed
  const isRenewalFlow = useMemo(() => {
    if (renewPlanId) return true
    if (existingPlan?.is_repeating) {
      const endObj = new Date(existingPlan.start_date)
      if (existingPlan.period === "weekly") endObj.setDate(endObj.getDate() + 7)
      else if (existingPlan.period === "monthly") endObj.setMonth(endObj.getMonth() + 1)
      else if (existingPlan.period === "custom") endObj.setDate(endObj.getDate() + (existingPlan.custom_days || 30))
      return new Date().getTime() >= endObj.getTime()
    }
    return false
  }, [renewPlanId, existingPlan])

  // Performance snapshot calculation for ended/renewed plan
  const lastPeriodPerformance = useMemo(() => {
    if (!existingPlan) return null
    const startStr = existingPlan.start_date
    const endObj = new Date(startStr)
    if (existingPlan.period === "weekly") endObj.setDate(endObj.getDate() + 7)
    else if (existingPlan.period === "monthly") endObj.setMonth(endObj.getMonth() + 1)
    else if (existingPlan.period === "custom") endObj.setDate(endObj.getDate() + (existingPlan.custom_days || 30))
    const endStr = endObj.toISOString().split("T")[0]

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

  // ─── Section 1 State: Plan Basics ───
  const [planName, setPlanName] = useState(existingPlan?.name || "Normal")
  const [budgetMode, setBudgetMode] = useState<"manual" | "account">(existingPlan?.account_id ? "account" : "manual")
  const [manualAmount, setManualAmount] = useState(existingPlan?.total_amount ? String(existingPlan.total_amount) : "5000")
  const [selectedAccountId, setSelectedAccountId] = useState(existingPlan?.account_id || (accounts[0]?.id || ""))
  const [period, setPeriod] = useState<"weekly" | "monthly" | "custom">(existingPlan?.period || "monthly")
  const [customDays, setCustomDays] = useState(existingPlan?.custom_days ? String(existingPlan.custom_days) : "14")
  const [startDate, setStartDate] = useState(new Date().toISOString().split("T")[0])

  // Change 1B: Collapsible sections (collapsed by default)
  const [fixedCommitmentsOpen, setFixedCommitmentsOpen] = useState(false)
  const [lookbackSettingsOpen, setLookbackSettingsOpen] = useState(false)
  const [accountRemainingOpen, setAccountRemainingOpen] = useState(false)

  // Change 1C: Advanced options toggle (collapsed by default)
  const [advancedOptionsOpen, setAdvancedOptionsOpen] = useState(false)

  // Change 4: Deselected bills state (default: all selected/checked)
  const [deselectedBillIds, setDeselectedBillIds] = useState<string[]>(existingPlan?.deselected_bill_ids || [])

  // Change 6: Selected account IDs for account remaining indicator
  const [indicatorAccountIds, setIndicatorAccountIds] = useState<string[]>(() => {
    if (existingPlan?.indicator_account_ids && existingPlan.indicator_account_ids.length > 0) {
      return existingPlan.indicator_account_ids
    }
    return accounts.map((a) => a.id)
  })

  // ─── Section 2 State: Framework & Allocations ───
  const [framework, setFramework] = useState<"50/30/20" | "suggested">(existingPlan?.framework || "50/30/20")
  const [lookbackPeriod, setLookbackPeriod] = useState<"1m" | "3m" | "6m">("3m")
  const [categorySelectionMode, setCategorySelectionMode] = useState<"app" | "user">("app")
  const [selectedCatIds, setSelectedCatIds] = useState<string[]>(() => {
    if (existingPlan?.categories && existingPlan.categories.length > 0) {
      return existingPlan.categories.map((c) => c.category_id)
    }
    return categories.filter((c) => c.type === "expense").map((c) => c.id)
  })

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

  // Inline Add Category Modal state
  const [addCategoryModalOpen, setAddCategoryModalOpen] = useState(false)

  // ─── Section 5 State: Activation & Confirmation ───
  const [activateNow, setActivateNow] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const [successMsg, setSuccessMsg] = useState<string | null>(null)

  // Change 8: Dedicated Success Screen with Countdown
  const [planSavedSuccess, setPlanSavedSuccess] = useState(false)
  const [countdown, setCountdown] = useState(3)
  const countdownIntervalRef = useRef<any>(null)

  // Current selected account for balance mode
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

  // Change 4: Compute active/selected fixed bills excluding deselected ones
  const activeFixedExpenses = useMemo(() => {
    return periodBills
      .filter((b) => b.type === "expense" && !deselectedBillIds.includes(b.id))
      .reduce((sum, b) => sum + (b.amount + (b.fee_amount || 0)), 0)
  }, [periodBills, deselectedBillIds])

  const activeFixedIncome = useMemo(() => {
    return periodBills
      .filter((b) => b.type === "income" && !deselectedBillIds.includes(b.id))
      .reduce((sum, b) => sum + b.amount, 0)
  }, [periodBills, deselectedBillIds])

  // Change 2: Available to spend = total budget - active fixed expenses + active fixed income
  const availableToSpend = useMemo(() => {
    const calc = totalBudgetAmount - activeFixedExpenses + activeFixedIncome
    return Math.round(calc * 100) / 100
  }, [totalBudgetAmount, activeFixedExpenses, activeFixedIncome])

  // Change 3: Bills exceed budget blocker condition
  const billsExceedBudget = useMemo(() => {
    return activeFixedExpenses > totalBudgetAmount || availableToSpend <= 0
  }, [activeFixedExpenses, totalBudgetAmount, availableToSpend])

  // ─── 50/30/20 Targets based on Available to spend ───
  const rule503020Targets = useMemo(() => {
    const spendable = Math.max(0, availableToSpend)
    return {
      needs: Math.round(spendable * 0.5 * 100) / 100,
      wants: Math.round(spendable * 0.3 * 100) / 100,
      savings: Math.round(spendable * 0.2 * 100) / 100,
    }
  }, [availableToSpend])

  // Expense categories list
  const expenseCategories = useMemo(() => {
    return categories.filter((c) => c.type === "expense")
  }, [categories])

  // Categories with historical spend for lookback
  const lookbackStats = useMemo(() => {
    let months = 3
    if (lookbackPeriod === "1m") months = 1
    if (lookbackPeriod === "6m") months = 6
    const cutoff = new Date()
    cutoff.setMonth(cutoff.getMonth() - months)
    const cutoffStr = cutoff.toISOString().split("T")[0]

    const lookbackTxs = transactions.filter((t) => t.type === "expense" && t.date >= cutoffStr)

    const stats: Record<string, { total: number; monthlyAvg: number; suggested: number }> = {}
    expenseCategories.forEach((cat) => {
      const catSpent = lookbackTxs
        .filter((t) => t.category_id === cat.id)
        .reduce((sum, t) => sum + Math.abs(t.amount), 0)
      const monthlyAvg = catSpent / months
      const suggested = Math.max(0, Math.round(monthlyAvg / 5) * 5)
      stats[cat.id] = {
        total: catSpent,
        monthlyAvg: Math.round(monthlyAvg * 100) / 100,
        suggested,
      }
    })
    return stats
  }, [lookbackPeriod, transactions, expenseCategories])

  // Displayed categories list
  const displayedCategories = useMemo(() => {
    if (categorySelectionMode === "app") {
      const withSpend = expenseCategories.filter((c) => (lookbackStats[c.id]?.total || 0) > 0 || selectedCatIds.includes(c.id))
      return withSpend.length > 0 ? withSpend : expenseCategories
    }
    return expenseCategories
  }, [categorySelectionMode, expenseCategories, lookbackStats, selectedCatIds])

  // Initialize allocations when framework or availableToSpend changes
  useEffect(() => {
    if (existingPlan && Object.keys(categoryAllocations).length > 0) return
    if (billsExceedBudget) return
    if (categorySelectionMode === "user") return

    const newAllocs: Record<string, { bucket: "needs" | "wants" | "savings"; amount: string }> = {}

    if (framework === "50/30/20") {
      const bucketGroups: { needs: Category[]; wants: Category[]; savings: Category[] } = {
        needs: [],
        wants: [],
        savings: [],
      }

      displayedCategories.forEach((c) => {
        const bucket = autoAssignBucket(c.name)
        bucketGroups[bucket].push(c)
      })

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
      displayedCategories.forEach((c) => {
        const suggested = lookbackStats[c.id]?.suggested || 0
        newAllocs[c.id] = {
          bucket: autoAssignBucket(c.name),
          amount: String(suggested),
        }
      })
    }

    setCategoryAllocations(newAllocs)
  }, [framework, availableToSpend, displayedCategories, lookbackStats, billsExceedBudget, categorySelectionMode])

  // Handlers for switching category selection mode
  const handleSelectUserCategories = () => {
    setCategorySelectionMode("user")
    // Reset all written budgets to 0
    setCategoryAllocations((prev) => {
      const reset: Record<string, { bucket: "needs" | "wants" | "savings"; amount: string }> = {}
      categories.forEach((cat) => {
        reset[cat.id] = {
          bucket: prev[cat.id]?.bucket || autoAssignBucket(cat.name),
          amount: "0",
        }
      })
      return reset
    })
  }

  const handleSelectAppCategories = () => {
    setCategorySelectionMode("app")
    const newAllocs: Record<string, { bucket: "needs" | "wants" | "savings"; amount: string }> = {}
    if (framework === "50/30/20") {
      const bucketGroups: { needs: Category[]; wants: Category[]; savings: Category[] } = {
        needs: [],
        wants: [],
        savings: [],
      }
      displayedCategories.forEach((c) => {
        const bucket = autoAssignBucket(c.name)
        bucketGroups[bucket].push(c)
      })
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
      displayedCategories.forEach((c) => {
        const suggested = lookbackStats[c.id]?.suggested || 0
        newAllocs[c.id] = {
          bucket: autoAssignBucket(c.name),
          amount: String(suggested),
        }
      })
    }
    setCategoryAllocations(newAllocs)
  }

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

  // Bucket Totals and Allocations
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

  // Change 5: Progress bar and label calculations for Needs/Wants/Savings
  const bucketIndicators = useMemo(() => {
    const buckets = [
      { key: "needs", label: "Needs (50%)", subtitle: "Groceries, bills, transport, giving", target: rule503020Targets.needs, allocated: bucketTotals.needs },
      { key: "wants", label: "Wants (30%)", subtitle: "Dining, cafés, shopping, games", target: rule503020Targets.wants, allocated: bucketTotals.wants },
      { key: "savings", label: "Savings (20%)", subtitle: "Emergency fund, investments", target: rule503020Targets.savings, allocated: bucketTotals.savings },
    ]

    return buckets.map((b) => {
      const fillPct = b.target > 0 ? (b.allocated / b.target) * 100 : 0
      const isOver = b.allocated > b.target
      const isExact = Math.abs(b.allocated - b.target) < 0.01 && b.allocated > 0

      let barColor = "#4ADE80" // Below 100% green
      if (isExact) barColor = "#D4A934" // Exactly 100% gold
      if (isOver) barColor = "#F87171" // Over 100% red

      return {
        ...b,
        fillPct: Math.min(100, fillPct),
        trueFillPct: fillPct,
        isOver,
        isExact,
        barColor,
      }
    })
  }, [rule503020Targets, bucketTotals])

  // Change 6: Account Remaining Calculations
  const accountRemainingStats = useMemo(() => {
    const selected = accounts.filter((a) => indicatorAccountIds.includes(a.id))
    const totalSelectedBalance = selected.reduce((sum, a) => sum + Number(a.balance || 0), 0)
    const totalRemaining = totalSelectedBalance - totalBudgetAmount

    const accountsBreakdown = selected.map((a) => {
      const bal = Number(a.balance || 0)
      const projected = bal - totalBudgetAmount
      return {
        id: a.id,
        name: a.name,
        balance: bal,
        projected,
      }
    })

    return {
      selectedCount: selected.length,
      totalSelectedBalance,
      totalRemaining,
      accountsBreakdown,
    }
  }, [accounts, indicatorAccountIds, totalBudgetAmount])

  // ─── SECTION 3: HEALTH ASSESSMENT ───
  const planHealth = useMemo(() => {
    const tips: string[] = []
    const isOverBudget = totalAllocated > availableToSpend
    const remainingToSpend = Math.round((availableToSpend - totalAllocated) * 100) / 100
    const projectedClosingBalance = Math.round((totalBudgetAmount - activeFixedExpenses + activeFixedIncome - totalAllocated) * 100) / 100

    const wantsPct = totalAllocated > 0 ? (bucketTotals.wants / totalAllocated) * 100 : 0
    const savingsPct = totalAllocated > 0 ? (bucketTotals.savings / totalAllocated) * 100 : 0

    if (wantsPct > 45) {
      tips.push(`Your plan allocates ${wantsPct.toFixed(0)}% to Wants — consider reducing Wants to stay near the 30% target.`)
    }

    if (bucketTotals.savings === 0 && totalAllocated > 0) {
      tips.push("You currently have no savings allocation — consider setting aside at least 10–20% for future buffer.")
    }

    activeAllocationsList.forEach((a) => {
      if (totalAllocated > 0 && (a.allocated_amount / totalAllocated) >= 0.25) {
        tips.push(`"${a.category_name}" takes ${( (a.allocated_amount / totalAllocated) * 100).toFixed(0)}% of your total budget.`)
      }
    })

    if (isOverBudget) {
      tips.push(`Warning: Your total category allocations exceed your available to spend by ${currencySymbol}${(totalAllocated - availableToSpend).toFixed(2)}.`)
    }

    let status: "balanced" | "warning" | "over" = "balanced"
    if (isOverBudget || billsExceedBudget) {
      status = "over"
    } else if (wantsPct > 50 || bucketTotals.savings === 0) {
      status = "warning"
    }

    return {
      status,
      tips,
      isOverBudget,
      remainingToSpend,
      projectedClosingBalance,
      wantsPct,
      savingsPct,
    }
  }, [totalAllocated, availableToSpend, totalBudgetAmount, activeFixedExpenses, activeFixedIncome, bucketTotals, activeAllocationsList, billsExceedBudget, currencySymbol])

  // Change 1 Reset plan handler
  const handleResetPlan = () => {
    if (confirm("Reset all inputs and start over?")) {
      setPlanName("Normal")
      setBudgetMode("manual")
      setManualAmount("5000")
      setSelectedAccountId(accounts[0]?.id || "")
      setPeriod("monthly")
      setCustomDays("14")
      setStartDate(new Date().toISOString().split("T")[0])
      setDeselectedBillIds([])
      setCategoryAllocations({})
      setFramework("50/30/20")
      setFixedCommitmentsOpen(false)
      setLookbackSettingsOpen(false)
      setAccountRemainingOpen(false)
      setAdvancedOptionsOpen(false)
      setErrorMsg(null)
      setSuccessMsg(null)
    }
  }

  // Change 4: Toggle Bill selection in Fixed Commitments
  const handleToggleBill = (billId: string) => {
    setDeselectedBillIds((prev) => {
      if (prev.includes(billId)) {
        return prev.filter((id) => id !== billId)
      } else {
        return [...prev, billId]
      }
    })
  }

  // Change 6: Toggle Account in Account Remaining Indicator
  const handleToggleIndicatorAccount = (accId: string) => {
    setIndicatorAccountIds((prev) => {
      if (prev.includes(accId)) {
        return prev.filter((id) => id !== accId)
      } else {
        return [...prev, accId]
      }
    })
  }

  // Change 7: New Category Created Handler
  const handleNewCategoryCreated = (newCat: Category) => {
    setSelectedCatIds((prev) => [...prev, newCat.id])
    setCategoryAllocations((prev) => ({
      ...prev,
      [newCat.id]: {
        bucket: autoAssignBucket(newCat.name),
        amount: "0",
      },
    }))
  }

  // ─── Change 8: Countdown timer effect ───
  useEffect(() => {
    if (planSavedSuccess) {
      setCountdown(3)
      countdownIntervalRef.current = setInterval(() => {
        setCountdown((prev) => {
          if (prev <= 1) {
            clearInterval(countdownIntervalRef.current)
            onNavigate("categories")
            return 0
          }
          return prev - 1
        })
      }, 1000)

      return () => {
        if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current)
      }
    }
  }, [planSavedSuccess, onNavigate])

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

    if (billsExceedBudget) {
      setErrorMsg("Your fixed bills exceed your total budget. Increase your budget or deselect bills before saving.")
      return
    }

    if (planHealth.isOverBudget) {
      if (!confirm(`Your plan exceeds your available to spend by ${currencySymbol}${(totalAllocated - availableToSpend).toFixed(2)}. Save anyway?`)) {
        return
      }
    }

    setIsSubmitting(true)
    setErrorMsg(null)

    try {
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

      const allocationsPayload: BudgetPlanCategory[] = activeAllocationsList.map((a) => ({
        category_id: a.category_id,
        bucket: a.bucket,
        allocated_amount: a.allocated_amount,
        allocated_amount_cents: Math.round(a.allocated_amount * 100),
      }))

      if (isEditing && existingPlan) {
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
            deselected_bill_ids: deselectedBillIds,
            indicator_account_ids: indicatorAccountIds,
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
            deselected_bill_ids: deselectedBillIds,
            indicator_account_ids: indicatorAccountIds,
          },
          allocationsPayload,
          activateNow
        )
      }

      // Trigger success screen
      setPlanSavedSuccess(true)
    } catch (err: any) {
      console.error("Budget plan save error:", err)
      setErrorMsg(err.message || "Failed to save budget plan. Please check your database connection.")
    } finally {
      setIsSubmitting(false)
    }
  }

  // ─── Change 8: SUCCESS SCREEN VIEW ───
  if (planSavedSuccess) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] max-w-2xl mx-auto w-full px-4 text-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.92 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, ease: EASE_OUT }}
          className="w-full rounded-3xl p-8 sm:p-10 border backdrop-blur-2xl space-y-6"
          style={{
            background: tokens.cardGradient,
            borderColor: "rgba(94, 234, 212, 0.4)",
            boxShadow: tokens.cardShadow,
          }}
        >
          <div className="size-16 rounded-full bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center mx-auto text-[#5EEAD4] shadow-[0_0_20px_rgba(94,234,212,0.3)]">
            <CheckCircle2 className="size-9 stroke-[2.5]" />
          </div>

          <div>
            <h2 className="text-2xl sm:text-3xl font-bold font-display text-white">
              {isEditing ? "Plan Updated Successfully!" : "Plan Confirmed & Activated!"}
            </h2>
            <p className="text-sm font-sans text-white/70 mt-1.5">
              Budget plan <strong className="text-white">"{planName}"</strong> is now saved to your database.
            </p>
          </div>

          {/* Plan Summary Chips */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-4 rounded-2xl border text-xs font-mono text-left" style={{ backgroundColor: tokens.nestedSurface, borderColor: tokens.borderNested }}>
            <div>
              <span className="text-white/60 block text-[10px] uppercase font-sans">Period</span>
              <span className="text-white font-bold capitalize">{period}</span>
            </div>
            <div>
              <span className="text-white/60 block text-[10px] uppercase font-sans">Total Budget</span>
              <span className="text-white font-bold">{currencySymbol}{totalBudgetAmount.toFixed(2)}</span>
            </div>
            <div>
              <span className="text-white/60 block text-[10px] uppercase font-sans">Categories</span>
              <span className="text-white font-bold">{activeAllocationsList.length} included</span>
            </div>
            <div>
              <span className="text-white/60 block text-[10px] uppercase font-sans">Framework</span>
              <span className="text-[#5EEAD4] font-bold">{framework === "50/30/20" ? "50/30/20 Rule" : "Suggested Plan"}</span>
            </div>
          </div>

          {/* Countdown timer */}
          <div className="space-y-3 pt-2">
            <p className="text-xs font-mono text-white/60">
              Redirecting to Categories in <strong className="text-[#5EEAD4] text-sm">{countdown}</strong>...
            </p>

            <button
              type="button"
              onClick={() => {
                if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current)
                onNavigate("categories")
              }}
              className="w-full sm:w-auto px-8 py-3 rounded-xl text-xs font-bold transition-all font-sans cursor-pointer shadow-xl hover:scale-[1.02] text-[#120824] inline-flex items-center justify-center gap-2"
              style={{ background: tokens.dashboardActivePill }}
            >
              <span>Go to Categories now</span>
              <ArrowRight className="size-4" />
            </button>
          </div>
        </motion.div>
      </div>
    )
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
              <span>{isEditing ? `Edit plan: ${existingPlan?.name}` : "Budget Planner"}</span>
            </h2>
            <p className="text-xs sm:text-sm font-sans text-white/70 mt-0.5">
              Build, test, and activate structured spending plans for your finances
            </p>
          </div>
        </div>

        {/* Change 1: Reset Plan Button */}
        <button
          type="button"
          onClick={handleResetPlan}
          className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold border transition-all font-sans cursor-pointer shadow-md bg-white/5 hover:bg-white/15 text-white/80 hover:scale-[1.02] self-start sm:self-auto"
          style={{ borderColor: tokens.borderNested }}
        >
          <RotateCcw className="size-3.5" />
          <span>Reset plan</span>
        </button>
      </div>

      {errorMsg && (
        <div className="p-4 rounded-2xl bg-red-500/20 border border-red-500/40 text-red-200 text-xs flex items-center gap-2.5">
          <AlertCircle className="size-4.5 shrink-0 text-red-400" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* ─── SECTION 4: PREVIOUS PERIOD PERFORMANCE (Shown on renewal) ─── */}
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
                <h3 className="text-base font-bold font-display text-white">Previous Period Performance</h3>
                <p className="text-xs text-white/60 font-sans mt-0.5">
                  Review last period spending and carry over unspent budget.
                </p>
              </div>
            </div>
            <span className="size-7 rounded-xl bg-purple-500/20 border border-purple-500/40 flex items-center justify-center font-mono font-bold text-xs text-purple-300">
              00
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
            <p className="text-xs text-white/70 font-sans mt-0.5">Name your plan, set your total budget and period.</p>
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

          {/* Period Selector — Weekly, Monthly, Custom */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
                <motion.div
                  initial={{ opacity: 0, y: -4 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mt-2 flex items-center gap-2 p-2 rounded-xl border bg-white/5"
                  style={{ borderColor: tokens.borderNested }}
                >
                  <span className="text-xs text-white/70 font-sans">Every</span>
                  <input
                    type="number"
                    min="1"
                    value={customDays}
                    onChange={(e) => setCustomDays(e.target.value)}
                    className="w-20 px-2.5 py-1 border rounded-lg text-xs font-mono text-white text-center focus:outline-none bg-black/40"
                    style={{ borderColor: tokens.borderNested }}
                  />
                  <span className="text-xs text-white/70 font-sans">days per cycle</span>
                </motion.div>
              )}
            </div>

            {/* Start Date & Active Cycle Range */}
            <div>
              <label className="text-[11px] font-semibold uppercase tracking-wider block mb-1 font-sans text-white/75">
                Start Date
              </label>
              <input
                type="date"
                required
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full px-3.5 py-2.5 border rounded-xl text-xs font-sans text-white focus:outline-none"
                style={{ backgroundColor: tokens.nestedSurface, borderColor: tokens.borderNested }}
              />
              <p className="text-[10.5px] font-mono text-white/50 mt-1">
                Period cycle: {startDate} → {periodEndDate} ({period === "custom" ? `Every ${customDays || 30} days` : period})
              </p>
            </div>
          </div>

          {/* Change 1B & Change 4: Fixed Commitments Accordion (Starts Collapsed) */}
          <div className="rounded-2xl border overflow-hidden transition-all" style={{ backgroundColor: tokens.nestedSurface, borderColor: tokens.borderNested }}>
            <button
              type="button"
              onClick={() => setFixedCommitmentsOpen(!fixedCommitmentsOpen)}
              className="w-full p-4 flex items-center justify-between text-left hover:bg-white/5 transition-colors cursor-pointer"
            >
              <div className="flex items-center gap-2">
                <Receipt className="size-4 text-[#FEF08A]" />
                <span className="text-xs font-bold text-white font-display">
                  Fixed Commitments ({periodBills.length - deselectedBillIds.length} of {periodBills.length} bills active)
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono text-rose-300 font-bold">
                  -{currencySymbol}{activeFixedExpenses.toFixed(2)}
                </span>
                {fixedCommitmentsOpen ? <ChevronUp className="size-4 text-white/60" /> : <ChevronDown className="size-4 text-white/60" />}
              </div>
            </button>

            {fixedCommitmentsOpen && (
              <div className="p-4 pt-0 border-t border-white/10 space-y-3">
                <p className="text-[11px] text-white/60 font-sans">
                  Check or uncheck bills to include/exclude them from this plan's deduction.
                </p>

                {periodBills.length === 0 ? (
                  <p className="text-xs text-white/50 font-sans italic py-2">
                    No active bills scheduled within this period ({startDate} to {periodEndDate}).
                  </p>
                ) : (
                  <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                    {periodBills.map((b) => {
                      const isSelected = !deselectedBillIds.includes(b.id)
                      return (
                        <div
                          key={b.id}
                          onClick={() => handleToggleBill(b.id)}
                          className={`flex items-center justify-between p-2.5 rounded-xl border transition-all cursor-pointer ${
                            isSelected ? "bg-white/5 border-white/10" : "bg-black/20 border-white/5 opacity-40"
                          }`}
                        >
                          <div className="flex items-center gap-2.5 min-w-0">
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={() => handleToggleBill(b.id)}
                              className="size-3.5 rounded accent-[#5EEAD4] cursor-pointer"
                              onClick={(e) => e.stopPropagation()}
                            />
                            <span className={`text-xs font-sans text-white truncate ${!isSelected ? "line-through text-white/50" : ""}`}>
                              {b.name} <span className="text-[10px] text-white/40 font-mono">({b.due_date})</span>
                            </span>
                          </div>
                          <span className={`text-xs font-mono font-bold shrink-0 ${!isSelected ? "line-through text-white/40" : b.type === "income" ? "text-emerald-400" : "text-rose-400"}`}>
                            {b.type === "income" ? "+" : "-"}{currencySymbol}{b.amount.toFixed(2)}
                          </span>
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Change 2: Available to Spend Calculation Banner */}
          <div className="p-4 rounded-2xl border grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs font-mono" style={{ backgroundColor: tokens.nestedSurface, borderColor: tokens.borderNested }}>
            <div>
              <span className="text-white/60 block text-[10.5px] uppercase font-sans">Active Fixed Expenses:</span>
              <span className="text-rose-300 font-bold">-{currencySymbol}{activeFixedExpenses.toFixed(2)}</span>
            </div>
            <div>
              <span className="text-white/60 block text-[10.5px] uppercase font-sans">Active Fixed Income:</span>
              <span className="text-emerald-300 font-bold">+{currencySymbol}{activeFixedIncome.toFixed(2)}</span>
            </div>
            <div className={`p-2.5 rounded-xl border ${billsExceedBudget ? "bg-rose-500/15 border-rose-500/30" : "bg-emerald-500/15 border-emerald-500/30"}`}>
              <span className={`block text-[10.5px] uppercase font-bold ${billsExceedBudget ? "text-rose-300" : "text-emerald-200"}`}>
                Available to Spend:
              </span>
              <span className={`text-base font-bold ${billsExceedBudget ? "text-rose-400" : "text-[#5EEAD4]"}`}>
                {currencySymbol}{availableToSpend.toFixed(2)}
              </span>
            </div>
          </div>

          {/* Change 3: Bills Exceed Budget Warning Banner */}
          {billsExceedBudget && (
            <motion.div
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              className="p-4 rounded-2xl bg-rose-500/20 border border-rose-500/50 text-rose-200 text-xs flex items-center gap-3"
            >
              <ShieldAlert className="size-5 shrink-0 text-rose-400" />
              <span>
                <strong>Warning:</strong> Your fixed bills ({currencySymbol}{activeFixedExpenses.toFixed(2)}) exceed your total budget ({currencySymbol}{totalBudgetAmount.toFixed(2)}). Increase your budget or deselect some bills before continuing.
              </span>
            </motion.div>
          )}

          {/* Change 6: Account Remaining Indicator Accordion (Starts Collapsed) */}
          <div className="rounded-2xl border overflow-hidden transition-all" style={{ backgroundColor: tokens.nestedSurface, borderColor: tokens.borderNested }}>
            <button
              type="button"
              onClick={() => setAccountRemainingOpen(!accountRemainingOpen)}
              className="w-full p-4 flex items-center justify-between text-left hover:bg-white/5 transition-colors cursor-pointer"
            >
              <div className="flex items-center gap-2">
                <Wallet className="size-4 text-[#5EEAD4]" />
                <span className="text-xs font-semibold text-white font-sans">
                  See account remaining after this plan →
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono font-bold text-white/80">
                  {currencySymbol}{accountRemainingStats.totalRemaining.toFixed(2)}
                </span>
                {accountRemainingOpen ? <ChevronUp className="size-4 text-white/60" /> : <ChevronDown className="size-4 text-white/60" />}
              </div>
            </button>

            {accountRemainingOpen && (
              <div className="p-4 pt-0 border-t border-white/10 space-y-3">
                <p className="text-[11px] text-white/60 font-sans">
                  Select accounts to simulate balance impact after deducting {currencySymbol}{totalBudgetAmount.toFixed(2)}:
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-40 overflow-y-auto pr-1">
                  {accounts.map((acc) => {
                    const isSelected = indicatorAccountIds.includes(acc.id)
                    const bal = Number(acc.balance || 0)
                    const projected = bal - totalBudgetAmount

                    return (
                      <div
                        key={acc.id}
                        onClick={() => handleToggleIndicatorAccount(acc.id)}
                        className={`p-2.5 rounded-xl border flex items-center justify-between transition-all cursor-pointer ${
                          isSelected ? "bg-white/10 border-[#5EEAD4]/40" : "bg-black/20 border-white/5 opacity-50"
                        }`}
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => handleToggleIndicatorAccount(acc.id)}
                            className="size-3.5 rounded accent-[#5EEAD4] cursor-pointer"
                            onClick={(e) => e.stopPropagation()}
                          />
                          <span className="text-xs font-sans text-white font-semibold truncate">{acc.name}</span>
                        </div>
                        <div className="text-right font-mono text-[11px]">
                          <span className="text-white/60 block">{currencySymbol}{bal.toFixed(2)}</span>
                          <span className={projected >= 0 ? "text-emerald-400 font-bold" : "text-rose-400 font-bold"}>
                            rem: {currencySymbol}{projected.toFixed(2)}
                          </span>
                        </div>
                      </div>
                    )
                  })}
                </div>

                <div className="p-3 rounded-xl bg-white/5 border border-white/10 text-xs font-mono flex items-center justify-between">
                  <span className="text-white/70 font-sans">Total remaining across selected accounts:</span>
                  <span className={`font-bold text-sm ${accountRemainingStats.totalRemaining >= 0 ? "text-emerald-400" : "text-rose-400"}`}>
                    {currencySymbol}{accountRemainingStats.totalRemaining.toFixed(2)}
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>
      </motion.div>

      {/* ─── SECTION 2: BUDGET FRAMEWORK & ALLOCATIONS ─── */}
      <motion.div
        {...cardEntrance(0.06)}
        className={`rounded-3xl p-6 sm:p-7 border backdrop-blur-xl transition-all relative ${
          billsExceedBudget ? "opacity-50 pointer-events-none select-none" : ""
        }`}
        style={{
          background: tokens.cardGradient,
          borderColor: tokens.border,
          boxShadow: tokens.cardShadow,
        }}
      >
        {/* Blocker lock overlay banner if bills exceed budget */}
        {billsExceedBudget && (
          <div className="absolute inset-0 z-20 rounded-3xl bg-black/40 backdrop-blur-[2px] flex items-center justify-center p-4">
            <div className="p-4 rounded-2xl bg-[#1E0C38]/90 border border-rose-500/50 shadow-2xl flex items-center gap-3 text-xs text-rose-200">
              <Lock className="size-5 text-rose-400 shrink-0" />
              <span>Section locked: Available to spend must be greater than zero to allocate category budgets.</span>
            </div>
          </div>
        )}

        <div className="pb-3 mb-4 border-b flex items-center justify-between" style={{ borderColor: tokens.border }}>
          <div>
            <h3 className="text-base font-bold font-display text-white">2. Budget Framework & Category Allocations</h3>
            <p className="text-xs text-white/70 font-sans mt-0.5">Choose how to distribute your budget across categories.</p>
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

          {/* Change 5: 50/30/20 Progress Indicators with Live Fill Bars & Colors */}
          {framework === "50/30/20" && (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-4 rounded-2xl border" style={{ backgroundColor: tokens.nestedSurface, borderColor: tokens.borderNested }}>
              {bucketIndicators.map((bucket) => (
                <div key={bucket.key} className="p-3.5 rounded-xl border bg-white/5 space-y-2" style={{ borderColor: tokens.borderNested }}>
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold font-display uppercase tracking-wider text-white">
                      {bucket.label}
                    </span>
                    <span className="text-xs font-bold font-mono text-white">
                      {currencySymbol}{bucket.target.toFixed(2)}
                    </span>
                  </div>

                  {/* Progress bar */}
                  <div className="w-full h-2 rounded-full bg-black/40 overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-300"
                      style={{
                        width: `${bucket.fillPct}%`,
                        backgroundColor: bucket.barColor,
                      }}
                    />
                  </div>

                  {/* Allocation label */}
                  <div className="flex items-center justify-between text-[10.5px] font-mono">
                    {bucket.isOver ? (
                      <span className="text-[#F87171] font-bold">
                        {currencySymbol}{(bucket.allocated - bucket.target).toFixed(2)} over budget
                      </span>
                    ) : (
                      <span className="text-white/70">
                        {currencySymbol}{bucket.allocated.toFixed(2)} allocated of {currencySymbol}{bucket.target.toFixed(2)}
                      </span>
                    )}
                    <span className="text-white/50">
                      {bucket.trueFillPct.toFixed(0)}%
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Change 1B: Lookback Range Collapsible for Suggested Mode */}
          {framework === "suggested" && (
            <div className="rounded-2xl border overflow-hidden transition-all" style={{ backgroundColor: tokens.nestedSurface, borderColor: tokens.borderNested }}>
              <button
                type="button"
                onClick={() => setLookbackSettingsOpen(!lookbackSettingsOpen)}
                className="w-full p-3.5 flex items-center justify-between text-left hover:bg-white/5 transition-colors cursor-pointer"
              >
                <div>
                  <span className="text-xs font-bold text-white font-display block">
                    Historical Lookback: {lookbackPeriod === "1m" ? "Last Month" : lookbackPeriod === "3m" ? "Last 3 Months" : "Last 6 Months"}
                  </span>
                  <p className="text-[10.5px] text-white/60">Averages calculated from logged transactions</p>
                </div>
                {lookbackSettingsOpen ? <ChevronUp className="size-4 text-white/60" /> : <ChevronDown className="size-4 text-white/60" />}
              </button>

              {lookbackSettingsOpen && (
                <div className="p-3.5 pt-0 border-t border-white/10 flex items-center gap-2">
                  {(["1m", "3m", "6m"] as const).map((lb) => (
                    <button
                      key={lb}
                      type="button"
                      onClick={() => setLookbackPeriod(lb)}
                      className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                        lookbackPeriod === lb ? "bg-white/20 text-white font-bold" : "text-white/60 hover:text-white"
                      }`}
                    >
                      {lb === "1m" ? "Last Month" : lb === "3m" ? "Last 3 Months" : "Last 6 Months"}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Category Filter Toggle */}
          <div className="flex items-center justify-between pt-2">
            <span className="text-xs font-bold text-white font-display">Category Allocations:</span>
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={handleSelectAppCategories}
                className={`px-2.5 py-1 text-xs rounded-lg font-semibold transition-all cursor-pointer ${
                  categorySelectionMode === "app" ? "bg-white/20 text-white font-bold" : "text-white/50 hover:text-white"
                }`}
              >
                App selects categories
              </button>
              <button
                type="button"
                onClick={handleSelectUserCategories}
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

            {/* Change 7: + Add New Category Button */}
            <button
              type="button"
              onClick={() => setAddCategoryModalOpen(true)}
              className="w-full p-3 rounded-2xl border border-dashed hover:bg-white/5 text-white/70 hover:text-white text-xs font-semibold flex items-center justify-center gap-2 transition-all cursor-pointer"
              style={{ borderColor: tokens.borderNested }}
            >
              <Plus className="size-4 text-[#5EEAD4]" />
              <span>+ Add new category</span>
            </button>
          </div>

          {/* Running Allocations Total Banner */}
          <div className="pt-3 border-t border-white/10 flex flex-wrap items-center justify-between gap-2 text-xs font-mono">
            <span className="text-white/70">
              Total Allocated: <strong className="text-white">{currencySymbol}{totalAllocated.toFixed(2)}</strong> of <strong className="text-[#5EEAD4]">{currencySymbol}{availableToSpend.toFixed(2)}</strong> available
            </span>
            <span className={`font-bold ${totalAllocated <= availableToSpend ? "text-emerald-400" : "text-rose-400"}`}>
              {totalAllocated <= availableToSpend ? (
                `✓ ${currencySymbol}${(availableToSpend - totalAllocated).toFixed(2)} unallocated`
              ) : (
                `⚠️ Exceeds by ${currencySymbol}${(totalAllocated - availableToSpend).toFixed(2)}`
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
            <p className="text-xs text-white/70 font-sans mt-0.5">Review trajectory, tips, and projected closing balance.</p>
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
                <strong>Overspend Warning:</strong> Your plan exceeds your available to spend by {currencySymbol}${(totalAllocated - availableToSpend).toFixed(2)}. Reduce category allocations before confirming.
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
            <p className="text-xs text-white/70 font-sans mt-0.5">Review summary and activate your category budgets.</p>
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
              <span className="text-white/60 block text-[10.5px] uppercase font-sans">Available to Spend</span>
              <span className="text-[#5EEAD4] font-bold">{currencySymbol}{availableToSpend.toFixed(2)}</span>
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
              disabled={isSubmitting || billsExceedBudget}
              onClick={handleConfirmPlan}
              className="px-6 py-3 rounded-xl text-xs font-bold transition-all font-sans cursor-pointer shadow-xl hover:scale-[1.02] text-[#120824] flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
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
                  <span>{isEditing ? "Save changes" : "Confirm Plan"}</span>
                </>
              )}
            </button>
          </div>
        </div>
      </motion.div>

      {/* Inline Add Category Modal */}
      <AddCategoryInlineModal
        isOpen={addCategoryModalOpen}
        onClose={() => setAddCategoryModalOpen(false)}
        onCategoryCreated={handleNewCategoryCreated}
      />
    </div>
  )
}
