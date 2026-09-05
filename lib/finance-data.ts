"use client"

import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from "react"
import { supabase, isSupabaseConfigured, resolveCurrentUserId } from "./supabase"

export interface Account {
  id: string
  user_id?: string
  name: string
  type: string
  starting_balance_cents: number
  balance: number
  currency: string
  created_at?: string
}

export interface Transaction {
  id: string
  user_id?: string
  account_id: string
  category_id?: string
  amount_cents: number
  amount: number
  type: "income" | "expense"
  transfer_pair_id?: string
  fee_pair_id?: string
  group_id?: string
  is_fee?: boolean
  note?: string
  description: string
  date: string
  created_at?: string
  account_name?: string
  category_name?: string
}

export function isTransferTransaction(tx: { transfer_pair_id?: string; note?: string; description?: string }): boolean {
  if (Boolean(tx.transfer_pair_id)) return true
  const text = (tx.note || tx.description || "").toLowerCase()
  if (text.startsWith("transfer to ") || text.startsWith("transfer from ") || text.startsWith("transfer to:") || text.startsWith("transfer from:")) {
    return true
  }
  return false
}

export type CategoryGroup = "needs" | "wants" | "savings" | "bills" | "ungrouped"

export interface Category {
  id: string
  user_id?: string
  name: string
  type: "income" | "expense"
  parent_category_id?: string
  group?: CategoryGroup | null
  currency: string
  total_spent?: number
  budget?: number
  created_at?: string
}

export interface HeldFund {
  id: string
  user_id?: string
  account_id: string
  name: string
  type: "person" | "fund"
  balance_cents: number
  balance: number
  account_name?: string
  created_at?: string
}

export interface HeldFundHistory {
  id: string
  held_fund_id: string
  user_id?: string
  amount_cents: number
  amount: number
  direction: "deposit" | "withdrawal" | "payment" | "expense"
  note?: string
  date: string
  created_at?: string
}

export interface Bill {
  id: string
  user_id?: string
  name: string
  type: "income" | "expense" | "transfer"
  account_id: string
  destination_account_id?: string
  category_id?: string
  parent_bill_id?: string
  amount_cents: number
  amount: number
  fee_amount_cents: number
  fee_amount: number
  fee_type?: "flat" | "percentage" | "instapay"
  due_date: string
  recurrence: "one-off" | "daily" | "monthly" | "custom"
  recurrence_days?: number
  is_completed: boolean
  created_at?: string
  account_name?: string
  destination_account_name?: string
  category_name?: string
}

export interface BudgetPlanCategory {
  id?: string
  plan_id?: string
  user_id?: string
  category_id: string
  bucket: "bills" | "needs" | "wants" | "savings"
  allocated_amount_cents: number
  allocated_amount: number
  category_name?: string
}

export interface BudgetPlan {
  id: string
  user_id?: string
  name: string
  total_amount_cents: number
  total_amount: number
  fixed_commitments_cents?: number
  fixed_commitments?: number
  account_id?: string
  period: "weekly" | "monthly" | "custom"
  custom_days?: number
  start_date: string
  framework: "50/30/20" | "suggested"
  is_active: boolean
  is_repeating: boolean
  deselected_bill_ids?: string[]
  indicator_account_ids?: string[]
  created_at?: string
  categories?: BudgetPlanCategory[]
}

export interface BudgetPlanHistory {
  id: string
  plan_id: string
  user_id?: string
  period_start: string
  period_end: string
  total_planned_cents: number
  total_planned: number
  total_actual_cents: number
  total_actual: number
  created_at?: string
}

export interface BudgetPlanCategoryHistory {
  id: string
  plan_history_id: string
  user_id?: string
  category_id: string
  planned_amount_cents: number
  planned_amount: number
  actual_amount_cents: number
  actual_amount: number
  category_name?: string
}

export interface AppNotification {
  id: string
  user_id?: string
  type: "warning" | "info" | "success"
  reference_id?: string
  title?: string
  message: string
  time?: string
  is_read: boolean
  created_at?: string
}

// Local Storage Fallback Keys
const STORAGE_ACCOUNTS_KEY = "spendly_accounts"
const STORAGE_TRANSACTIONS_KEY = "spendly_transactions"
const STORAGE_CATEGORIES_KEY = "spendly_categories"
const STORAGE_CATEGORY_GROUPS_KEY = "spendly_category_groups_v1"
const STORAGE_HELD_FUNDS_KEY = "spendly_held_funds"
const STORAGE_HELD_HISTORY_KEY = "spendly_held_fund_history"
const STORAGE_BILLS_KEY = "spendly_bills"
const STORAGE_BUDGET_PLANS_KEY = "spendly_budget_plans"

export function getLocalCategoryGroups(): Record<string, CategoryGroup> {
  if (typeof window === "undefined") return {}
  try {
    const raw = localStorage.getItem(STORAGE_CATEGORY_GROUPS_KEY)
    if (raw) return JSON.parse(raw)
  } catch {
    // Ignore JSON errors
  }
  return {}
}

export function saveLocalCategoryGroups(map: Record<string, CategoryGroup>): Record<string, CategoryGroup> {
  if (typeof window === "undefined") return map
  try {
    localStorage.setItem(STORAGE_CATEGORY_GROUPS_KEY, JSON.stringify(map))
  } catch {
    // Ignore write errors
  }
  return map
}

export function getLocal<T>(key: string): T[] {
  if (typeof window === "undefined") return []
  try {
    const raw = localStorage.getItem(key)
    if (raw) return JSON.parse(raw)
  } catch {
    // Ignore JSON errors
  }
  return []
}

export function saveLocal<T>(key: string, data: T[]): T[] {
  if (typeof window === "undefined") return data
  try {
    localStorage.setItem(key, JSON.stringify(data))
  } catch {
    // Ignore write errors
  }
  return data
}

export function toCents(amount: number): number {
  if (isNaN(amount)) return 0
  return Math.round(amount * 100)
}

export function fromCents(cents: number): number {
  if (isNaN(cents)) return 0
  return cents / 100
}

export function getCurrencySymbol(curr?: string): string {
  switch ((curr || "").toUpperCase()) {
    case "USD":
      return "$ "
    case "EUR":
      return "€ "
    case "GBP":
      return "£ "
    case "EGP":
      return "EGP "
    case "AED":
      return "AED "
    case "SAR":
      return "SAR "
    case "CAD":
      return "C$ "
    case "AUD":
      return "A$ "
    case "JPY":
      return "¥ "
    case "KWD":
      return "KWD "
    case "QAR":
      return "QAR "
    default:
      return curr ? `${curr} ` : "EGP "
  }
}

export function saveLocalAccounts(accounts: Account[]): Account[] {
  return saveLocal(STORAGE_ACCOUNTS_KEY, accounts)
}

export function saveLocalTransactions(transactions: Transaction[]): Transaction[] {
  return saveLocal(STORAGE_TRANSACTIONS_KEY, transactions)
}

export function saveLocalCategories(categories: Category[]): Category[] {
  return saveLocal(STORAGE_CATEGORIES_KEY, categories)
}

export function clearAllLocalFinanceData(): void {
  if (typeof window === "undefined") return
  try {
    localStorage.removeItem(STORAGE_ACCOUNTS_KEY)
    localStorage.removeItem(STORAGE_TRANSACTIONS_KEY)
    localStorage.removeItem(STORAGE_CATEGORIES_KEY)
    localStorage.removeItem(STORAGE_HELD_FUNDS_KEY)
    localStorage.removeItem(STORAGE_HELD_HISTORY_KEY)
    localStorage.removeItem(STORAGE_BILLS_KEY)
  } catch {
    // Ignore error
  }
}

export function generateUUID(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID()
  }
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0
    const v = c === "x" ? r : (r & 0x3) | 0x8
    return v.toString(16)
  })
}

export function isValidUUID(str?: string | null): boolean {
  if (!str) return false
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(str)
}

// Helper: Ensure system category exists in Supabase
async function ensureSystemCategory(userId: string, categoryName: string, type: "income" | "expense" = "expense"): Promise<string | undefined> {
  if (!isSupabaseConfigured || !supabase || !userId || !categoryName) return undefined
  try {
    const { data: existing } = await supabase
      .from("categories")
      .select("id")
      .eq("user_id", userId)
      .ilike("name", categoryName.trim())
      .maybeSingle()

    if (existing?.id && isValidUUID(String(existing.id))) return String(existing.id)

    const newId = generateUUID()
    const { data: created, error } = await supabase
      .from("categories")
      .insert({
        id: newId,
        user_id: userId,
        name: categoryName.trim(),
        type,
      })
      .select("id")
      .single()

    if (!error && created?.id) return String(created.id)
    if (newId) return newId
  } catch (err) {
    console.warn(`Error ensuring category ${categoryName}:`, err)
  }
  return undefined
}

// Helper: Ensure system account exists in Supabase
async function ensureSystemAccount(userId: string, accountId: string, accounts: Account[]): Promise<string | undefined> {
  if (!isSupabaseConfigured || !supabase || !userId || !accountId) return undefined

  // 1. Check if the account ID already exists in Supabase for this user
  if (isValidUUID(accountId)) {
    try {
      const { data } = await supabase.from("accounts").select("id").eq("id", accountId).eq("user_id", userId).maybeSingle()
      if (data?.id) return String(data.id)
    } catch {
      // Ignore
    }
  }

  // 2. Find the account in client state and ensure it is created in Supabase
  const acc = accounts.find((a) => a.id === accountId)
  if (acc) {
    try {
      const { data: existing } = await supabase
        .from("accounts")
        .select("id")
        .eq("user_id", userId)
        .ilike("name", acc.name.trim())
        .maybeSingle()
      if (existing?.id && isValidUUID(String(existing.id))) return String(existing.id)

      const newId = isValidUUID(acc.id) ? acc.id : generateUUID()
      const { data: created, error } = await supabase
        .from("accounts")
        .insert({
          id: newId,
          user_id: userId,
          name: acc.name.trim(),
          type: acc.type || "checking",
          starting_balance_cents: acc.starting_balance_cents || 0,
          currency: acc.currency || "EGP",
        })
        .select("id")
        .single()
      if (!error && created?.id) return String(created.id)
      if (newId) return newId
    } catch (err) {
      console.warn("Error ensuring account:", err)
    }
  }

  // 3. Fallback: check if user has any account in Supabase or create default
  try {
    const { data: anyAcc } = await supabase.from("accounts").select("id").eq("user_id", userId).limit(1).maybeSingle()
    if (anyAcc?.id) return String(anyAcc.id)

    const defId = generateUUID()
    const { data: defCreated } = await supabase
      .from("accounts")
      .insert({
        id: defId,
        user_id: userId,
        name: "Main Account",
        type: "checking",
        starting_balance_cents: 0,
        currency: "EGP",
      })
      .select("id")
      .single()
    if (defCreated?.id) return String(defCreated.id)
  } catch (err) {
    console.warn("Error creating fallback account:", err)
  }

  return undefined
}

function useFinanceDataInternal() {
  const [accounts, setAccounts] = useState<Account[]>(() => getLocal<Account>(STORAGE_ACCOUNTS_KEY))
  const [transactions, setTransactions] = useState<Transaction[]>(() => getLocal<Transaction>(STORAGE_TRANSACTIONS_KEY))
  const [categories, setCategories] = useState<Category[]>(() => getLocal<Category>(STORAGE_CATEGORIES_KEY))
  const [heldFunds, setHeldFunds] = useState<HeldFund[]>(() => getLocal<HeldFund>(STORAGE_HELD_FUNDS_KEY))
  const [bills, setBills] = useState<Bill[]>(() => getLocal<Bill>(STORAGE_BILLS_KEY))
  const [budgetPlans, setBudgetPlans] = useState<BudgetPlan[]>(() => getLocal<BudgetPlan>(STORAGE_BUDGET_PLANS_KEY))
  const [loading, setLoading] = useState(true)

  const fetchData = useCallback(async () => {
    if (isSupabaseConfigured && supabase) {
      try {
        const userId = await resolveCurrentUserId()
        if (userId) {
          const [accRes, txRes, catRes, hfRes, billRes] = await Promise.all([
            supabase.from("accounts").select("*").eq("user_id", userId).order("created_at", { ascending: true }),
            supabase.from("transactions").select("*").eq("user_id", userId).order("date", { ascending: false }).order("created_at", { ascending: false }),
            supabase.from("categories").select("*").eq("user_id", userId).order("name", { ascending: true }),
            supabase.from("held_funds").select("*").eq("user_id", userId).order("created_at", { ascending: true }),
            supabase.from("bills").select("*").eq("user_id", userId).order("due_date", { ascending: true }),
          ])

          const dbAccounts = accRes.data || []
          const dbTransactions = txRes.data || []
          const dbCategories = catRes.data || []
          const dbHeldFunds = hfRes.data || []
          const dbBills = billRes.data || []

          // Safe query for budget_plans & budget_plan_categories
          let dbBudgetPlans: any[] = []
          let dbBudgetPlanCategories: any[] = []
          try {
            const { data: bpData } = await supabase
              .from("budget_plans")
              .select("*")
              .eq("user_id", userId)
              .order("created_at", { ascending: false })
            if (bpData) {
              dbBudgetPlans = bpData
              const { data: bpcData } = await supabase
                .from("budget_plan_categories")
                .select("*")
                .eq("user_id", userId)
              if (bpcData) dbBudgetPlanCategories = bpcData
            }
          } catch (bpErr) {
            console.warn("budget_plans query error / table not ready:", bpErr)
          }

          const parsedTransactions: Transaction[] = dbTransactions.map((t: any) => {
            const amountCents = t.amount_cents ?? 0
            const amount = amountCents / 100
            const accountObj = dbAccounts.find((a: any) => String(a.id) === String(t.account_id))
            const catObj = dbCategories.find((c: any) => String(c.id) === String(t.category_id))
            const isFee = Boolean(
              t.is_fee ||
              (t.note && (t.note.startsWith("Fee —") || t.note.startsWith("Fee -"))) ||
              catObj?.name?.toLowerCase() === "fees"
            )

            return {
              id: String(t.id),
              user_id: t.user_id,
              account_id: String(t.account_id),
              category_id: t.category_id ? String(t.category_id) : undefined,
              amount_cents: amountCents,
              amount,
              type: t.type === "expense" ? "expense" : "income",
              transfer_pair_id: t.transfer_pair_id ? String(t.transfer_pair_id) : undefined,
              fee_pair_id: t.fee_pair_id ? String(t.fee_pair_id) : undefined,
              group_id: t.group_id ? String(t.group_id) : undefined,
              is_fee: isFee,
              note: t.note,
              description: t.note || (isFee ? "Fee" : "Transaction"),
              date: t.date || (t.created_at ? new Date(t.created_at).toISOString().split("T")[0] : "Recent"),
              created_at: t.created_at,
              account_name: accountObj?.name || "Account",
              category_name: catObj?.name || (isFee ? "Fees" : "General"),
            }
          })

          parsedTransactions.sort((a, b) => {
            const dateComp = (b.date || "").localeCompare(a.date || "")
            if (dateComp !== 0) return dateComp
            const timeA = a.created_at ? new Date(a.created_at).getTime() : 0
            const timeB = b.created_at ? new Date(b.created_at).getTime() : 0
            if (timeB !== timeA) return timeB - timeA
            return (b.id || "").localeCompare(a.id || "")
          })

          const parsedAccounts: Account[] = dbAccounts.map((a: any) => {
            const startCents = a.starting_balance_cents ?? 0
            const accountTxSum = parsedTransactions
              .filter((t) => t.account_id === String(a.id))
              .reduce((sum, t) => sum + (t.type === "income" ? t.amount : -t.amount), 0)
            const currentBalance = (startCents / 100) + accountTxSum

            return {
              id: String(a.id),
              user_id: a.user_id,
              name: a.name,
              type: a.type || "checking",
              starting_balance_cents: startCents,
              balance: currentBalance,
              currency: a.currency || "EGP",
              created_at: a.created_at,
            }
          })

          const now = new Date()
          const currentMonthStart = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-01`
          const todayStr = now.toISOString().split("T")[0]

          const localGroups = getLocalCategoryGroups()

          // Build mapping of categories assigned in 50/30/20 budget plans
          // Active plan has highest priority, followed by latest created plans, then local plans
          const planCategoryGroups: Record<string, CategoryGroup> = {}

          const sortedDbPlans = [...(dbBudgetPlans || [])].sort((a: any, b: any) => {
            if (Boolean(a.is_active) && !Boolean(b.is_active)) return -1
            if (!Boolean(a.is_active) && Boolean(b.is_active)) return 1
            return 0
          })

          for (const plan of sortedDbPlans) {
            const planCats = (dbBudgetPlanCategories || []).filter((bpc: any) => String(bpc.plan_id) === String(plan.id))
            for (const pc of planCats) {
              const catId = String(pc.category_id)
              const bucket = String(pc.bucket).toLowerCase()
              if (["needs", "wants", "savings", "bills"].includes(bucket) && !planCategoryGroups[catId]) {
                planCategoryGroups[catId] = bucket as CategoryGroup
              }
            }
          }

          // Fallback check: any remaining budget plan categories
          for (const pc of (dbBudgetPlanCategories || [])) {
            const catId = String(pc.category_id)
            const bucket = String(pc.bucket).toLowerCase()
            if (["needs", "wants", "savings", "bills"].includes(bucket) && !planCategoryGroups[catId]) {
              planCategoryGroups[catId] = bucket as CategoryGroup
            }
          }

          // Fallback check: local stored budget plans
          const cachedBudgetPlans = getLocal<BudgetPlan>(STORAGE_BUDGET_PLANS_KEY) || []
          for (const bp of cachedBudgetPlans) {
            if (Array.isArray(bp.categories)) {
              for (const pc of bp.categories) {
                const catId = String(pc.category_id)
                const bucket = String(pc.bucket).toLowerCase()
                if (["needs", "wants", "savings", "bills"].includes(bucket) && !planCategoryGroups[catId]) {
                  planCategoryGroups[catId] = bucket as CategoryGroup
                }
              }
            }
          }

          const categoriesToBackfill: { id: string; group: CategoryGroup }[] = []

          const parsedCategories: Category[] = dbCategories.map((c: any) => {
            const catSpent = parsedTransactions
              .filter((t) => t.category_id === String(c.id) && t.type === "expense" && !isTransferTransaction(t) && t.date >= currentMonthStart && t.date <= todayStr)
              .reduce((sum, t) => sum + Math.abs(t.amount), 0)

            const budget = c.budget_cents != null ? c.budget_cents / 100 : (c.budget != null ? c.budget : undefined)
            const catIdStr = String(c.id)
            const planAssignedGroup = planCategoryGroups[catIdStr]
            const dbGroup = c.group || c.bucket || c.category_group || (c.group_name ? String(c.group_name).toLowerCase() : undefined)
            const rawGroup = planAssignedGroup || dbGroup || localGroups[catIdStr]
            const normalizedGroup: CategoryGroup = (rawGroup === "needs" || rawGroup === "wants" || rawGroup === "savings" || rawGroup === "bills") ? rawGroup : "ungrouped"

            if (normalizedGroup !== "ungrouped") {
              localGroups[catIdStr] = normalizedGroup
              // If not already persisted to Supabase categories.group, queue for backfill
              if (c.group !== normalizedGroup) {
                categoriesToBackfill.push({ id: catIdStr, group: normalizedGroup })
              }
            }

            return {
              id: catIdStr,
              user_id: c.user_id,
              name: c.name,
              type: c.type || "expense",
              parent_category_id: c.parent_category_id ? String(c.parent_category_id) : undefined,
              group: normalizedGroup,
              currency: c.currency || "EGP",
              total_spent: catSpent,
              budget,
              created_at: c.created_at,
            }
          })
          saveLocalCategoryGroups(localGroups)

          // Background backfill for existing users' categories to Supabase
          if (categoriesToBackfill.length > 0 && isSupabaseConfigured && supabase) {
            const sbClient = supabase
            Promise.all(
              categoriesToBackfill.map((item) =>
                sbClient.from("categories").update({ group: item.group }).eq("id", item.id).eq("user_id", userId)
              )
            ).catch((backfillErr) => {
              console.warn("Category group backfill background sync warning:", backfillErr)
            })
          }

          const parsedHeldFunds: HeldFund[] = dbHeldFunds.map((h: any) => {
            const accObj = dbAccounts.find((a: any) => String(a.id) === String(h.account_id))
            const balCents = h.balance_cents ?? 0
            return {
              id: String(h.id),
              user_id: h.user_id,
              account_id: String(h.account_id),
              name: h.name,
              type: h.type === "person" ? "person" : "fund",
              balance_cents: balCents,
              balance: balCents / 100,
              account_name: accObj?.name || "Account",
              created_at: h.created_at,
            }
          })

          const parsedBills: Bill[] = dbBills.map((b: any) => {
            const accObj = dbAccounts.find((a: any) => String(a.id) === String(b.account_id))
            const destAccObj = b.destination_account_id ? dbAccounts.find((a: any) => String(a.id) === String(b.destination_account_id)) : null
            const catObj = b.category_id ? dbCategories.find((c: any) => String(c.id) === String(b.category_id)) : null
            const amtCents = b.amount_cents ?? 0
            const feeCents = b.fee_amount_cents ?? 0

            return {
              id: String(b.id),
              user_id: b.user_id,
              name: b.name,
              type: b.type || "expense",
              account_id: String(b.account_id),
              destination_account_id: b.destination_account_id ? String(b.destination_account_id) : undefined,
              category_id: b.category_id ? String(b.category_id) : undefined,
              parent_bill_id: b.parent_bill_id ? String(b.parent_bill_id) : undefined,
              amount_cents: amtCents,
              amount: amtCents / 100,
              fee_amount_cents: feeCents,
              fee_amount: feeCents / 100,
              fee_type: b.fee_type,
              due_date: b.due_date,
              recurrence: b.recurrence || "one-off",
              recurrence_days: b.recurrence_days,
              is_completed: Boolean(b.is_completed),
              created_at: b.created_at,
              account_name: accObj?.name || "Account",
              destination_account_name: destAccObj?.name,
              category_name: catObj?.name || "General",
            }
          })

          let parsedBudgetPlans: BudgetPlan[] = []
          if (Array.isArray(dbBudgetPlans)) {
            parsedBudgetPlans = dbBudgetPlans.map((bp: any) => {
              const planCats = (dbBudgetPlanCategories || [])
                .filter((c: any) => String(c.plan_id) === String(bp.id))
                .map((c: any) => {
                  const catObj = dbCategories.find((cat: any) => String(cat.id) === String(c.category_id))
                  const allocCents = Number(c.allocated_amount_cents ?? 0)
                  return {
                    id: String(c.id),
                    plan_id: String(c.plan_id),
                    user_id: c.user_id,
                    category_id: String(c.category_id),
                    bucket: c.bucket as "bills" | "needs" | "wants" | "savings",
                    allocated_amount_cents: allocCents,
                    allocated_amount: allocCents / 100,
                    category_name: catObj?.name || "Category",
                  }
                })

              const categoriesAllocCents = planCats
                .reduce((sum: number, c: any) => sum + (c.allocated_amount_cents || 0), 0)

              const totCents = Number(bp.total_amount_cents ?? 0)
              const fixedCents = Number(bp.fixed_commitments_cents ?? 0) || (categoriesAllocCents > 0 && categoriesAllocCents < totCents ? totCents - categoriesAllocCents : 0)

              return {
                id: String(bp.id),
                user_id: bp.user_id,
                name: bp.name,
                total_amount_cents: totCents,
                total_amount: totCents / 100,
                fixed_commitments_cents: fixedCents,
                fixed_commitments: fixedCents / 100,
                account_id: bp.account_id ? String(bp.account_id) : undefined,
                period: bp.period as "weekly" | "monthly" | "custom",
                custom_days: bp.custom_days,
                start_date: bp.start_date,
                framework: bp.framework as "50/30/20" | "suggested",
                is_active: Boolean(bp.is_active),
                is_repeating: bp.is_repeating ?? true,
                deselected_bill_ids: Array.isArray(bp.deselected_bill_ids) ? bp.deselected_bill_ids : [],
                indicator_account_ids: Array.isArray(bp.indicator_account_ids) ? bp.indicator_account_ids : [],
                created_at: bp.created_at,
                categories: planCats,
              }
            })
          }

          setAccounts(parsedAccounts)
          setTransactions(parsedTransactions)
          setCategories(parsedCategories)
          setHeldFunds(parsedHeldFunds)
          setBills(parsedBills)
          setBudgetPlans(parsedBudgetPlans)

          saveLocal(STORAGE_ACCOUNTS_KEY, parsedAccounts)
          saveLocal(STORAGE_TRANSACTIONS_KEY, parsedTransactions)
          saveLocal(STORAGE_CATEGORIES_KEY, parsedCategories)
          saveLocal(STORAGE_HELD_FUNDS_KEY, parsedHeldFunds)
          saveLocal(STORAGE_BILLS_KEY, parsedBills)
          saveLocal(STORAGE_BUDGET_PLANS_KEY, parsedBudgetPlans)

          setLoading(false)
          return
        }
      } catch (err) {
        console.error("Supabase live fetch error:", err)
      }
    }

    // Local storage fallback
    setAccounts(getLocal<Account>(STORAGE_ACCOUNTS_KEY))
    setTransactions(getLocal<Transaction>(STORAGE_TRANSACTIONS_KEY))
    setCategories(getLocal<Category>(STORAGE_CATEGORIES_KEY))
    setHeldFunds(getLocal<HeldFund>(STORAGE_HELD_FUNDS_KEY))
    setBills(getLocal<Bill>(STORAGE_BILLS_KEY))
    setBudgetPlans(getLocal<BudgetPlan>(STORAGE_BUDGET_PLANS_KEY))
    setLoading(false)
  }, [])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  const refreshFinanceData = useCallback(async () => {
    await fetchData()
  }, [fetchData])

  // ─────────────────────────────────────────────────────────────────
  // ACCOUNTS CRUD
  // ─────────────────────────────────────────────────────────────────

  const createAccount = useCallback(async (accountData: { name: string; type: string; starting_balance: number; currency?: string }) => {
    const startingCents = Math.round((accountData.starting_balance || 0) * 100)
    const currency = accountData.currency || "EGP"
    const newAccId = generateUUID()

    if (isSupabaseConfigured && supabase) {
      const userId = await resolveCurrentUserId()
      if (!userId) {
        throw new Error("No active Supabase user session found. Please log in to save accounts to cloud.")
      }

      const { data, error } = await supabase
        .from("accounts")
        .insert({
          id: newAccId,
          user_id: userId,
          name: accountData.name.trim(),
          type: accountData.type || "checking",
          starting_balance_cents: startingCents,
          currency,
        })
        .select()
        .single()

      if (error) {
        console.error("Supabase account insert error:", error)
        throw new Error(`Failed to save account to Supabase: ${error.message}`)
      }

      if (data) {
        await fetchData()
        return data
      }
    }

    const newAcc: Account = {
      id: newAccId,
      name: accountData.name.trim(),
      type: accountData.type || "checking",
      starting_balance_cents: startingCents,
      balance: accountData.starting_balance || 0,
      currency,
      created_at: new Date().toISOString(),
    }
    setAccounts((prev) => {
      const updated = [...prev, newAcc]
      saveLocal(STORAGE_ACCOUNTS_KEY, updated)
      return updated
    })
    return newAcc
  }, [fetchData])

  const deleteAccount = useCallback(async (accountId: string) => {
    if (isSupabaseConfigured && supabase) {
      try {
        const userId = await resolveCurrentUserId()
        if (userId && isValidUUID(accountId)) {
          // 1. Delete held fund history for any held funds in this account
          const { data: userHeldFunds } = await supabase
            .from("held_funds")
            .select("id")
            .eq("account_id", accountId)
            .eq("user_id", userId)

          if (userHeldFunds && userHeldFunds.length > 0) {
            const hfIds = userHeldFunds.map((h) => h.id)
            await supabase
              .from("held_fund_history")
              .delete()
              .in("held_fund_id", hfIds)
              .eq("user_id", userId)

            await supabase
              .from("held_funds")
              .delete()
              .eq("account_id", accountId)
              .eq("user_id", userId)
          }

          // 2. Delete bills referencing this account
          await supabase
            .from("bills")
            .delete()
            .or(`account_id.eq.${accountId},destination_account_id.eq.${accountId}`)
            .eq("user_id", userId)

          // 3. Delete transactions referencing this account
          await supabase
            .from("transactions")
            .delete()
            .or(`account_id.eq.${accountId},destination_account_id.eq.${accountId}`)
            .eq("user_id", userId)

          // 4. Delete the account record
          const { error: accError } = await supabase
            .from("accounts")
            .delete()
            .eq("id", accountId)
            .eq("user_id", userId)

          if (accError) {
            console.error("Supabase account delete error:", accError)
            throw new Error(`Failed to delete account: ${accError.message}`)
          }
        }
        await fetchData()
      } catch (err) {
        console.error("deleteAccount error:", err)
        throw err
      }
    } else {
      setAccounts((prev) => {
        const updated = prev.filter((a) => a.id !== accountId)
        saveLocal(STORAGE_ACCOUNTS_KEY, updated)
        return updated
      })
      setTransactions((prev) => {
        const updated = prev.filter((t) => t.account_id !== accountId && (t as any).destination_account_id !== accountId)
        saveLocal(STORAGE_TRANSACTIONS_KEY, updated)
        return updated
      })
      setBills((prev) => {
        const updated = prev.filter((b) => b.account_id !== accountId && (b as any).destination_account_id !== accountId)
        saveLocal(STORAGE_BILLS_KEY, updated)
        return updated
      })
      setHeldFunds((prev) => {
        const updated = prev.filter((h) => h.account_id !== accountId)
        saveLocal(STORAGE_HELD_FUNDS_KEY, updated)
        return updated
      })
    }
  }, [fetchData])

  // ─────────────────────────────────────────────────────────────────
  // CATEGORIES CRUD
  // ─────────────────────────────────────────────────────────────────

  const createCategory = useCallback(async (catData: {
    name: string
    type: "income" | "expense"
    budget?: number
    currency?: string
    group?: CategoryGroup | null
  }) => {
    const currency = catData.currency || "EGP"
    const budgetCents = catData.budget && catData.budget > 0 ? Math.round(catData.budget * 100) : null
    const newCatId = generateUUID()
    const groupVal = (catData.group && catData.group !== "ungrouped") ? catData.group : null

    // Persist group to local groups map immediately
    if (groupVal) {
      const currentMap = getLocalCategoryGroups()
      currentMap[newCatId] = groupVal
      saveLocalCategoryGroups(currentMap)
    }

    if (isSupabaseConfigured && supabase) {
      const userId = await resolveCurrentUserId()
      if (!userId) {
        throw new Error("No active Supabase user session found. Please log in to save categories to cloud.")
      }

      const insertPayload: any = {
        id: newCatId,
        user_id: userId,
        name: catData.name.trim(),
        type: catData.type,
      }
      if (groupVal) {
        insertPayload.group = groupVal
      }
      if (budgetCents != null) {
        insertPayload.budget_cents = budgetCents
      }

      let { data, error } = await supabase
        .from("categories")
        .insert(insertPayload)
        .select()
        .single()

      if (error && (error.message?.includes("group") || error.message?.includes("budget_cents") || error.code === "PGRST204" || error.code === "42703")) {
        const fallbackPayload: any = {
          id: newCatId,
          user_id: userId,
          name: catData.name.trim(),
          type: catData.type,
        }
        if (budgetCents != null && !error.message?.includes("budget_cents")) {
          fallbackPayload.budget_cents = budgetCents
        }
        const retry = await supabase
          .from("categories")
          .insert(fallbackPayload)
          .select()
          .single()
        data = retry.data
        error = retry.error
      }

      if (error) {
        console.error("Supabase category insert error:", error)
        throw new Error(`Failed to save category to Supabase: ${error.message}`)
      }

      if (data) {
        await fetchData()
        return data
      }
    }

    const newCat: Category = {
      id: newCatId,
      name: catData.name.trim(),
      type: catData.type,
      group: (catData.group === "needs" || catData.group === "wants" || catData.group === "savings" || catData.group === "bills") ? catData.group : "ungrouped",
      currency,
      budget: catData.budget,
      total_spent: 0,
      created_at: new Date().toISOString(),
    }
    setCategories((prev) => {
      const updated = [...prev, newCat]
      saveLocal(STORAGE_CATEGORIES_KEY, updated)
      return updated
    })
    return newCat
  }, [fetchData])

  const updateCategory = useCallback(async (
    categoryId: string,
    updates: {
      name?: string
      type?: "income" | "expense"
      budget?: number
      group?: CategoryGroup | null
    }
  ) => {
    // 1. Optimistically update local React state immediately so UI changes without delay
    setCategories((prev) => {
      const updated = prev.map((c) => {
        if (c.id === categoryId) {
          return {
            ...c,
            ...(updates.name !== undefined ? { name: updates.name.trim() } : {}),
            ...(updates.type !== undefined ? { type: updates.type } : {}),
            ...(updates.budget !== undefined ? { budget: updates.budget } : {}),
            ...(updates.group !== undefined ? { group: updates.group || "ungrouped" } : {}),
          }
        }
        return c
      })
      saveLocal(STORAGE_CATEGORIES_KEY, updated)
      return updated
    })

    // 2. Persist to local category groups map
    if (updates.group !== undefined) {
      const currentMap = getLocalCategoryGroups()
      if (updates.group && updates.group !== "ungrouped") {
        currentMap[categoryId] = updates.group
      } else {
        delete currentMap[categoryId]
      }
      saveLocalCategoryGroups(currentMap)
    }

    // 3. Persist to Supabase if configured
    if (isSupabaseConfigured && supabase) {
      try {
        const userId = await resolveCurrentUserId()
        if (userId && isValidUUID(categoryId)) {
          const updatePayload: any = {}
          if (updates.name !== undefined) updatePayload.name = updates.name.trim()
          if (updates.type !== undefined) updatePayload.type = updates.type
          if (updates.budget !== undefined) {
            updatePayload.budget_cents = updates.budget && updates.budget > 0 ? Math.round(updates.budget * 100) : 0
          }
          if (updates.group !== undefined) {
            updatePayload.group = (updates.group === "ungrouped" || !updates.group) ? null : updates.group
          }

          let { error } = await supabase
            .from("categories")
            .update(updatePayload)
            .eq("id", categoryId)
            .eq("user_id", userId)

          // Fallback if group or budget_cents column is missing
          if (error && (error.message?.includes("group") || error.message?.includes("budget_cents") || error.code === "PGRST204" || error.code === "42703")) {
            const fallbackPayload = { ...updatePayload }
            if (error.message?.includes("group") || error.code === "42703") delete fallbackPayload.group
            if (error.message?.includes("budget_cents")) delete fallbackPayload.budget_cents
            if (Object.keys(fallbackPayload).length > 0) {
              await supabase
                .from("categories")
                .update(fallbackPayload)
                .eq("id", categoryId)
                .eq("user_id", userId)
            }
          }
        }
      } catch (err) {
        console.warn("Supabase category update warning:", err)
      }

      await fetchData()
    }
  }, [fetchData])

  const deleteCategory = useCallback(async (categoryId: string) => {
    // Clean up local group map
    const currentMap = getLocalCategoryGroups()
    if (currentMap[categoryId]) {
      delete currentMap[categoryId]
      saveLocalCategoryGroups(currentMap)
    }

    if (isSupabaseConfigured && supabase) {
      try {
        const userId = await resolveCurrentUserId()
        if (userId && isValidUUID(categoryId)) {
          // 1. Clear category_id on transactions and bills
          await supabase
            .from("transactions")
            .update({ category_id: null })
            .eq("category_id", categoryId)
            .eq("user_id", userId)

          await supabase
            .from("bills")
            .update({ category_id: null })
            .eq("category_id", categoryId)
            .eq("user_id", userId)

          // 2. Delete the category
          const { error: catError } = await supabase
            .from("categories")
            .delete()
            .eq("id", categoryId)
            .eq("user_id", userId)

          if (catError) {
            console.error("Supabase category delete error:", catError)
            throw new Error(`Failed to delete category: ${catError.message}`)
          }
        }
        await fetchData()
      } catch (err) {
        console.error("deleteCategory error:", err)
        throw err
      }
    } else {
      setCategories((prev) => {
        const updated = prev.filter((c) => c.id !== categoryId)
        saveLocal(STORAGE_CATEGORIES_KEY, updated)
        return updated
      })
    }
  }, [fetchData])

  // ─────────────────────────────────────────────────────────────────
  // TRANSACTIONS CRUD (Atomic Fee System & InstaPay)
  // ─────────────────────────────────────────────────────────────────

  const createTransaction = useCallback(async (txData: {
    account_id: string
    destination_account_id?: string
    category_id?: string
    category_name?: string
    amount: number
    type: "income" | "expense" | "transfer"
    description?: string
    date?: string
    note?: string
    fee_amount?: number
    fee_type?: "flat" | "percentage" | "instapay"
    fee_note?: string
  }) => {
    if (!txData.account_id) throw new Error("Please select an account.")
    if (isNaN(txData.amount) || txData.amount <= 0) throw new Error("Please enter a valid amount greater than 0.")
    if (txData.type === "transfer" && (!txData.destination_account_id || txData.destination_account_id === txData.account_id)) {
      throw new Error("Please select a different destination account for the transfer.")
    }

    const amountCents = Math.round(Math.abs(txData.amount) * 100)
    const feeAmount = txData.fee_amount && txData.fee_amount > 0 ? txData.fee_amount : 0
    const feeCents = Math.round(feeAmount * 100)
    const dateStr = txData.date || new Date().toISOString().split("T")[0]
    const noteText = txData.note?.trim() || txData.description?.trim() || ""

    const srcAcc = accounts.find((a) => a.id === txData.account_id)
    const destAcc = txData.destination_account_id ? accounts.find((a) => a.id === txData.destination_account_id) : null

    if (isSupabaseConfigured && supabase) {
      const userId = await resolveCurrentUserId()
      if (!userId) throw new Error("User session not found. Please log in again.")

      // 1. Safely resolve Category UUID (verifying existence in Supabase)
      let resolvedCategoryId: string | null = null
      if (txData.category_id && isValidUUID(txData.category_id)) {
        try {
          const { data } = await supabase.from("categories").select("id").eq("id", txData.category_id).eq("user_id", userId).maybeSingle()
          if (data?.id) {
            resolvedCategoryId = String(data.id)
          }
        } catch {
          // Ignore
        }
      }

      if (!resolvedCategoryId && txData.category_id) {
        const localCat = categories.find((c) => c.id === txData.category_id)
        const catName = localCat?.name || txData.category_name || "General"
        resolvedCategoryId = (await ensureSystemCategory(userId, catName, txData.type === "income" ? "income" : "expense")) || null
      } else if (!resolvedCategoryId && txData.category_name?.trim()) {
        resolvedCategoryId = (await ensureSystemCategory(userId, txData.category_name.trim(), txData.type === "income" ? "income" : "expense")) || null
      }

      // 2. Safely resolve Source Account UUID (guaranteeing it exists in Supabase public.accounts)
      const resolvedAccId = await ensureSystemAccount(userId, txData.account_id, accounts)
      const resolvedAccountId = resolvedAccId || txData.account_id

      // 3. Safely resolve Destination Account UUID (for transfer)
      let resolvedDestAccountId = txData.destination_account_id
      if (resolvedDestAccountId) {
        resolvedDestAccountId = (await ensureSystemAccount(userId, resolvedDestAccountId, accounts)) || resolvedDestAccountId
      }

      // Generate a fee_pair_id if fee exists so original + fee are linked
      const feePairId = feeCents > 0 ? generateUUID() : undefined

      const rowsToInsert: any[] = []

      if (txData.type === "transfer") {
        const transferPairId = generateUUID()
        const outNote = noteText ? `Transfer to ${destAcc?.name || "Account"}: ${noteText}` : `Transfer to ${destAcc?.name || "Account"}`
        const inNote = noteText ? `Transfer from ${srcAcc?.name || "Account"}: ${noteText}` : `Transfer from ${srcAcc?.name || "Account"}`

        rowsToInsert.push(
          {
            user_id: userId,
            account_id: resolvedAccountId,
            category_id: resolvedCategoryId,
            amount_cents: amountCents,
            type: "expense",
            transfer_pair_id: transferPairId,
            fee_pair_id: feePairId,
            note: outNote,
            date: dateStr,
          },
          {
            user_id: userId,
            account_id: resolvedDestAccountId,
            category_id: resolvedCategoryId,
            amount_cents: amountCents,
            type: "income",
            transfer_pair_id: transferPairId,
            note: inNote,
            date: dateStr,
          }
        )
      } else {
        const defaultDesc = noteText || (txData.type === "income" ? "Income" : "Expense")
        rowsToInsert.push({
          user_id: userId,
          account_id: resolvedAccountId,
          category_id: resolvedCategoryId,
          amount_cents: amountCents,
          type: txData.type,
          fee_pair_id: feePairId,
          note: defaultDesc,
          date: dateStr,
        })
      }

      // If fee exists, insert linked fee row under category "Fees"
      if (feeCents > 0) {
        const feeCategoryId = await ensureSystemCategory(userId, "Fees", "expense")
        const feeLabel = noteText ? `Fee — ${noteText}` : `Fee — ${txData.type === "transfer" ? "Transfer" : "Transaction"}`
        rowsToInsert.push({
          user_id: userId,
          account_id: resolvedAccountId,
          category_id: (feeCategoryId && isValidUUID(feeCategoryId)) ? feeCategoryId : null,
          amount_cents: feeCents,
          type: "expense",
          fee_pair_id: feePairId,
          note: feeLabel,
          date: dateStr,
        })
      }

      let { data, error } = await supabase.from("transactions").insert(rowsToInsert).select()

      // If error is because fee_pair_id column doesn't exist yet on Supabase schema, retry without it
      if (error && (error.message?.includes("fee_pair_id") || error.code === "PGRST204")) {
        const strippedRows = rowsToInsert.map(({ fee_pair_id, ...rest }) => rest)
        const retryRes = await supabase.from("transactions").insert(strippedRows).select()
        data = retryRes.data
        error = retryRes.error
      }

      if (error) throw new Error(error.message || "Failed to record transaction.")

      await fetchData()
      return data
    } else {
      // Local fallback
      const feePairId = feeCents > 0 ? generateUUID() : undefined
      const newTxs: Transaction[] = []

      if (txData.type === "transfer") {
        const tpId = generateUUID()
        newTxs.push(
          {
            id: generateUUID(),
            account_id: txData.account_id,
            amount_cents: amountCents,
            amount: txData.amount,
            type: "expense",
            transfer_pair_id: tpId,
            fee_pair_id: feePairId,
            note: `Transfer to ${destAcc?.name || "Account"}: ${noteText}`,
            description: `Transfer to ${destAcc?.name || "Account"}`,
            date: dateStr,
            account_name: srcAcc?.name,
          },
          {
            id: generateUUID(),
            account_id: txData.destination_account_id!,
            amount_cents: amountCents,
            amount: txData.amount,
            type: "income",
            transfer_pair_id: tpId,
            note: `Transfer from ${srcAcc?.name || "Account"}: ${noteText}`,
            description: `Transfer from ${srcAcc?.name || "Account"}`,
            date: dateStr,
            account_name: destAcc?.name,
          }
        )
      } else {
        newTxs.push({
          id: generateUUID(),
          account_id: txData.account_id,
          category_id: txData.category_id,
          amount_cents: amountCents,
          amount: txData.amount,
          type: txData.type,
          fee_pair_id: feePairId,
          note: noteText || "Transaction",
          description: noteText || "Transaction",
          date: dateStr,
          account_name: srcAcc?.name,
          category_name: txData.category_name || "General",
        })
      }

      if (feeCents > 0) {
        newTxs.push({
          id: generateUUID(),
          account_id: txData.account_id,
          amount_cents: feeCents,
          amount: feeAmount,
          type: "expense",
          fee_pair_id: feePairId,
          is_fee: true,
          note: `Fee — ${noteText || "Transaction"}`,
          description: `Fee — ${noteText || "Transaction"}`,
          date: dateStr,
          account_name: srcAcc?.name,
          category_name: "Fees",
        })
      }

      setTransactions((prev) => {
        const updated = [...newTxs, ...prev]
        saveLocal(STORAGE_TRANSACTIONS_KEY, updated)
        return updated
      })
      return newTxs[0]
    }
  }, [accounts, categories, fetchData])

  const createSplitExpenseTransaction = useCallback(async (data: {
    totalAmount: number
    accountId: string
    date: string
    note?: string
    splits: Array<{ categoryId: string; amount: number }>
  }) => {
    if (!data.accountId) throw new Error("Please select an account.")
    if (!data.splits || data.splits.length === 0) throw new Error("Please add at least one category split.")

    const totalCents = Math.round(data.totalAmount * 100)
    const sumSplitCents = data.splits.reduce((sum, s) => sum + Math.round((s.amount || 0) * 100), 0)
    if (totalCents !== sumSplitCents) {
      throw new Error(`Total amount does not match split sum. Remainder: ${((totalCents - sumSplitCents) / 100).toFixed(2)}`)
    }

    const groupId = generateUUID()
    const dateStr = data.date || new Date().toISOString().split("T")[0]
    const noteStr = data.note?.trim() || ""

    if (isSupabaseConfigured && supabase) {
      const userId = await resolveCurrentUserId()
      if (!userId) throw new Error("User authentication required.")

      let resolvedAccountId = data.accountId
      if (!isValidUUID(resolvedAccountId)) {
        resolvedAccountId = (await ensureSystemAccount(userId, data.accountId, accounts)) || data.accountId
      }

      const rows = []
      for (const split of data.splits) {
        let resolvedCatId: string | null = split.categoryId
        if (resolvedCatId && !isValidUUID(resolvedCatId)) {
          const localCat = categories.find((c) => c.id === split.categoryId)
          resolvedCatId = (await ensureSystemCategory(userId, localCat?.name || split.categoryId, "expense")) || null
        }

        rows.push({
          id: generateUUID(),
          user_id: userId,
          account_id: resolvedAccountId,
          category_id: (resolvedCatId && isValidUUID(resolvedCatId)) ? resolvedCatId : null,
          amount_cents: Math.round(split.amount * 100),
          type: "expense",
          group_id: groupId,
          note: noteStr ? `Split: ${noteStr}` : "Expense Divider",
          date: dateStr,
        })
      }

      let { error } = await supabase.from("transactions").insert(rows)
      if (error) {
        if (error.message?.includes("group_id") || error.code === "42703") {
          const fallbackRows = rows.map(({ group_id, ...rest }) => rest)
          const { error: fallbackErr } = await supabase.from("transactions").insert(fallbackRows)
          if (fallbackErr) throw new Error(fallbackErr.message || "Failed to save split transactions.")
        } else {
          throw new Error(error.message || "Failed to save split transactions.")
        }
      }

      await fetchData()
      return groupId
    } else {
      const srcAcc = accounts.find((a) => a.id === data.accountId)
      const newTxs: Transaction[] = data.splits.map((split) => {
        const cat = categories.find((c) => c.id === split.categoryId)
        return {
          id: generateUUID(),
          account_id: data.accountId,
          category_id: split.categoryId,
          amount_cents: Math.round(split.amount * 100),
          amount: split.amount,
          type: "expense",
          group_id: groupId,
          note: noteStr ? `Split: ${noteStr}` : "Expense Divider",
          description: noteStr ? `Split: ${noteStr}` : "Expense Divider",
          date: dateStr,
          created_at: new Date().toISOString(),
          account_name: srcAcc?.name,
          category_name: cat?.name || "General",
        }
      })

      setTransactions((prev) => {
        const updated = [...newTxs, ...prev]
        saveLocal(STORAGE_TRANSACTIONS_KEY, updated)
        return updated
      })
      return groupId
    }
  }, [accounts, categories, fetchData])

  const updateTransaction = useCallback(async (
    transactionId: string,
    updateData: {
      account_id: string
      category_id?: string
      amount: number
      type: "income" | "expense"
      note: string
      date: string
      linked_fee_amount?: number
    }
  ) => {
    const amountCents = Math.round(Math.abs(updateData.amount) * 100)
    const dateStr = updateData.date || new Date().toISOString().split("T")[0]

    if (isSupabaseConfigured && supabase) {
      const userId = await resolveCurrentUserId()
      if (!userId) throw new Error("User authentication required.")

      // Fetch the transaction first to check for linked fee
      const { data: currentTx } = await supabase
        .from("transactions")
        .select("*")
        .eq("id", transactionId)
        .eq("user_id", userId)
        .maybeSingle()

      let resolvedCategoryId: string | null = null
      if (updateData.category_id && isValidUUID(updateData.category_id)) {
        resolvedCategoryId = updateData.category_id
      } else if (updateData.category_id) {
        const localCat = categories.find((c) => c.id === updateData.category_id)
        if (localCat) {
          resolvedCategoryId = (await ensureSystemCategory(userId, localCat.name, updateData.type === "income" ? "income" : "expense")) || null
        }
      }

      let resolvedAccountId = updateData.account_id
      if (!isValidUUID(resolvedAccountId)) {
        resolvedAccountId = (await ensureSystemAccount(userId, updateData.account_id, accounts)) || updateData.account_id
      }

      // Update primary row
      const { error: updateErr } = await supabase
        .from("transactions")
        .update({
          account_id: resolvedAccountId,
          category_id: resolvedCategoryId,
          amount_cents: amountCents,
          type: updateData.type,
          note: updateData.note ? updateData.note.trim() : "",
          date: dateStr,
        })
        .eq("id", transactionId)
        .eq("user_id", userId)

      if (updateErr) throw new Error(updateErr.message || "Failed to update transaction.")

      // If there is a linked fee transaction and fee update was provided
      if (currentTx?.fee_pair_id && typeof updateData.linked_fee_amount === "number") {
        const newFeeCents = Math.round(Math.abs(updateData.linked_fee_amount) * 100)
        if (newFeeCents > 0) {
          await supabase
            .from("transactions")
            .update({
              account_id: updateData.account_id,
              amount_cents: newFeeCents,
              date: dateStr,
              note: `Fee — ${updateData.note.trim()}`,
            })
            .eq("fee_pair_id", currentTx.fee_pair_id)
            .neq("id", transactionId)
            .eq("user_id", userId)
        } else {
          // If fee was removed (0), delete fee row
          await supabase
            .from("transactions")
            .delete()
            .eq("fee_pair_id", currentTx.fee_pair_id)
            .neq("id", transactionId)
            .eq("user_id", userId)
        }
      } else if (currentTx?.fee_pair_id) {
        // Sync date on linked fee even if fee amount was not changed
        await supabase
          .from("transactions")
          .update({ date: dateStr })
          .eq("fee_pair_id", currentTx.fee_pair_id)
          .eq("user_id", userId)
      }

      // If it's a transfer, sync the date on the paired transfer transaction too
      if (currentTx?.transfer_pair_id) {
        await supabase
          .from("transactions")
          .update({ date: dateStr })
          .eq("transfer_pair_id", currentTx.transfer_pair_id)
          .eq("user_id", userId)
      }

      await fetchData()
    } else {
      setTransactions((prev) => {
        const updated = prev.map((t) => {
          if (t.id === transactionId) {
            return {
              ...t,
              account_id: updateData.account_id,
              category_id: updateData.category_id,
              amount: updateData.amount,
              amount_cents: amountCents,
              type: updateData.type,
              note: updateData.note,
              description: updateData.note,
              date: dateStr,
            }
          }
          return t
        })
        saveLocal(STORAGE_TRANSACTIONS_KEY, updated)
        return updated
      })
    }
  }, [accounts, categories, fetchData])

  const batchUpdateTransactionDates = useCallback(async (
    transactionIds: string[],
    newDate: string
  ) => {
    if (!transactionIds || transactionIds.length === 0) return
    const dateStr = newDate || new Date().toISOString().split("T")[0]

    if (isSupabaseConfigured && supabase) {
      const userId = await resolveCurrentUserId()
      if (!userId) throw new Error("User authentication required.")

      // 1. Update all selected transactions
      const { data: updatedRows, error } = await supabase
        .from("transactions")
        .update({ date: dateStr })
        .in("id", transactionIds)
        .eq("user_id", userId)
        .select("id, fee_pair_id, transfer_pair_id")

      if (error) throw new Error(error.message || "Failed to update transaction dates.")

      // 2. Also sync date on any linked fee_pair_id rows
      const feePairIds = Array.from(
        new Set((updatedRows || []).map((r) => r.fee_pair_id).filter(Boolean))
      )
      if (feePairIds.length > 0) {
        await supabase
          .from("transactions")
          .update({ date: dateStr })
          .in("fee_pair_id", feePairIds)
          .eq("user_id", userId)
      }

      // 3. Also sync date on any linked transfer_pair_id rows
      const transferPairIds = Array.from(
        new Set((updatedRows || []).map((r) => r.transfer_pair_id).filter(Boolean))
      )
      if (transferPairIds.length > 0) {
        await supabase
          .from("transactions")
          .update({ date: dateStr })
          .in("transfer_pair_id", transferPairIds)
          .eq("user_id", userId)
      }

      await fetchData()
    } else {
      setTransactions((prev) => {
        const idSet = new Set(transactionIds)
        const updated = prev.map((t) => (idSet.has(t.id) ? { ...t, date: dateStr } : t))
        saveLocal(STORAGE_TRANSACTIONS_KEY, updated)
        return updated
      })
    }
  }, [fetchData])

  const deleteTransaction = useCallback(async (transactionId: string) => {
    if (isSupabaseConfigured && supabase) {
      const userId = await resolveCurrentUserId()
      if (!userId) throw new Error("User authentication required.")

      // Fetch transaction first to check for linked fee_pair_id or transfer_pair_id
      const { data: tx } = await supabase
        .from("transactions")
        .select("fee_pair_id, transfer_pair_id")
        .eq("id", transactionId)
        .eq("user_id", userId)
        .single()

      if (tx?.fee_pair_id) {
        // Delete all rows in the fee pair atomically
        const { error } = await supabase
          .from("transactions")
          .delete()
          .eq("fee_pair_id", tx.fee_pair_id)
          .eq("user_id", userId)
        if (error) throw new Error(error.message || "Failed to delete linked transactions.")
      } else if (tx?.transfer_pair_id) {
        // Delete both sides of the transfer pair
        const { error } = await supabase
          .from("transactions")
          .delete()
          .eq("transfer_pair_id", tx.transfer_pair_id)
          .eq("user_id", userId)
        if (error) throw new Error(error.message || "Failed to delete transfer.")
      } else {
        const { error } = await supabase
          .from("transactions")
          .delete()
          .eq("id", transactionId)
          .eq("user_id", userId)
        if (error) throw new Error(error.message || "Failed to delete transaction.")
      }

      await fetchData()
    } else {
      setTransactions((prev) => {
        const updated = prev.filter((t) => t.id !== transactionId)
        saveLocal(STORAGE_TRANSACTIONS_KEY, updated)
        return updated
      })
    }
  }, [fetchData])

  // ─────────────────────────────────────────────────────────────────
  // HELD FUNDS SYSTEM
  // ─────────────────────────────────────────────────────────────────

  const createHeldFund = useCallback(async (data: {
    account_id: string
    name: string
    type: "person" | "fund"
    initial_balance?: number
  }) => {
    const initCents = Math.round((data.initial_balance || 0) * 100)
    if (!data.account_id) throw new Error("Please select an account for the held fund.")
    if (!data.name.trim()) throw new Error("Please enter a name for the held fund.")

    if (isSupabaseConfigured && supabase) {
      const userId = await resolveCurrentUserId()
      if (!userId) throw new Error("User authentication required.")

      let resolvedAccountId = data.account_id
      if (!isValidUUID(resolvedAccountId)) {
        resolvedAccountId = (await ensureSystemAccount(userId, data.account_id, accounts)) || data.account_id
      }

      const newHfId = generateUUID()
      const { data: newHf, error } = await supabase
        .from("held_funds")
        .insert({
          id: newHfId,
          user_id: userId,
          account_id: resolvedAccountId,
          name: data.name.trim(),
          type: data.type,
          balance_cents: initCents,
        })
        .select()
        .single()

      if (error) throw new Error(error.message || "Failed to create held fund.")

      if (initCents > 0 && newHf) {
        // Insert initial history row & expense transaction
        await supabase.from("held_fund_history").insert({
          id: generateUUID(),
          held_fund_id: newHf.id,
          user_id: userId,
          amount_cents: initCents,
          direction: "deposit",
          note: "Initial allocation",
          date: new Date().toISOString().split("T")[0],
        })

        const hfCatId = await ensureSystemCategory(userId, "Held Funds", "expense")
        await supabase.from("transactions").insert({
          id: generateUUID(),
          user_id: userId,
          account_id: resolvedAccountId,
          category_id: (hfCatId && isValidUUID(hfCatId)) ? hfCatId : null,
          amount_cents: initCents,
          type: "expense",
          note: `Held Fund Allocation — ${data.name.trim()}`,
          date: new Date().toISOString().split("T")[0],
        })
      }

      await fetchData()
      return newHf
    } else {
      const newHf: HeldFund = {
        id: generateUUID(),
        account_id: data.account_id,
        name: data.name.trim(),
        type: data.type,
        balance_cents: initCents,
        balance: (data.initial_balance || 0),
        created_at: new Date().toISOString(),
      }
      setHeldFunds((prev) => {
        const updated = [...prev, newHf]
        saveLocal(STORAGE_HELD_FUNDS_KEY, updated)
        return updated
      })
      return newHf
    }
  }, [accounts, fetchData])

  const deleteHeldFund = useCallback(async (heldFundId: string) => {
    if (isSupabaseConfigured && supabase) {
      const userId = await resolveCurrentUserId()
      if (!userId) throw new Error("User authentication required.")

      if (isValidUUID(heldFundId)) {
        await supabase.from("held_fund_history").delete().eq("held_fund_id", heldFundId).eq("user_id", userId)
        const { error } = await supabase.from("held_funds").delete().eq("id", heldFundId).eq("user_id", userId)
        if (error) throw new Error(error.message || "Failed to delete held fund.")
      }
      await fetchData()
    } else {
      setHeldFunds((prev) => {
        const updated = prev.filter((h) => h.id !== heldFundId)
        saveLocal(STORAGE_HELD_FUNDS_KEY, updated)
        return updated
      })
    }
  }, [fetchData])

  const renameHeldFund = useCallback(async (heldFundId: string, newName: string) => {
    const trimmed = newName.trim()
    if (!trimmed) throw new Error("Please enter a valid name.")
    if (isSupabaseConfigured && supabase) {
      const userId = await resolveCurrentUserId()
      if (!userId) throw new Error("User authentication required.")

      if (isValidUUID(heldFundId)) {
        const { error } = await supabase
          .from("held_funds")
          .update({ name: trimmed })
          .eq("id", heldFundId)
          .eq("user_id", userId)
        if (error) throw new Error(error.message || "Failed to rename held fund.")
      }
      await fetchData()
    } else {
      setHeldFunds((prev) => {
        const updated = prev.map((h) => (h.id === heldFundId ? { ...h, name: trimmed } : h))
        saveLocal(STORAGE_HELD_FUNDS_KEY, updated)
        return updated
      })
    }
  }, [fetchData])

  const depositToHeldFund = useCallback(async (
    heldFundId: string,
    amount: number,
    note?: string,
    date?: string
  ) => {
    if (isNaN(amount) || amount <= 0) throw new Error("Please enter a valid deposit amount.")
    const fund = heldFunds.find((h) => h.id === heldFundId)
    if (!fund) throw new Error("Held fund not found.")

    const amountCents = Math.round(amount * 100)
    const dateStr = date || new Date().toISOString().split("T")[0]
    const noteStr = note?.trim() || "Deposit into fund"

    if (isSupabaseConfigured && supabase && isValidUUID(heldFundId)) {
      const userId = await resolveCurrentUserId()
      if (!userId) throw new Error("User authentication required.")

      // 1. Insert into history
      const { error: histErr } = await supabase.from("held_fund_history").insert({
        id: generateUUID(),
        held_fund_id: heldFundId,
        user_id: userId,
        amount_cents: amountCents,
        direction: "deposit",
        note: noteStr,
        date: dateStr,
      })
      if (histErr) throw new Error(histErr.message || "Failed to record fund deposit.")

      // 2. Update balance on held fund
      const newBalCents = (fund.balance_cents || 0) + amountCents
      const { error: balErr } = await supabase
        .from("held_funds")
        .update({ balance_cents: newBalCents })
        .eq("id", heldFundId)
        .eq("user_id", userId)
      if (balErr) throw new Error(balErr.message || "Failed to update fund balance.")

      // 3. Insert real expense transaction on linked account
      let resolvedAccountId = fund.account_id
      if (!isValidUUID(resolvedAccountId)) {
        resolvedAccountId = (await ensureSystemAccount(userId, fund.account_id, accounts)) || fund.account_id
      }
      const hfCatId = await ensureSystemCategory(userId, "Held Funds", "expense")
      const { error: txErr } = await supabase.from("transactions").insert({
        id: generateUUID(),
        user_id: userId,
        account_id: resolvedAccountId,
        category_id: (hfCatId && isValidUUID(hfCatId)) ? hfCatId : null,
        amount_cents: amountCents,
        type: "expense",
        note: `Deposit to ${fund.name}: ${noteStr}`,
        date: dateStr,
      })
      if (txErr) throw new Error(txErr.message || "Failed to create account transaction.")

      await fetchData()
    } else {
      setHeldFunds((prev) => {
        const updated = prev.map((h) => {
          if (h.id === heldFundId) {
            const nextBal = (h.balance_cents || 0) + amountCents
            return { ...h, balance_cents: nextBal, balance: nextBal / 100 }
          }
          return h
        })
        saveLocal(STORAGE_HELD_FUNDS_KEY, updated)
        return updated
      })
    }
  }, [accounts, heldFunds, fetchData])

  const withdrawFromHeldFund = useCallback(async (
    heldFundId: string,
    amount: number,
    note?: string,
    date?: string
  ) => {
    if (isNaN(amount) || amount <= 0) throw new Error("Please enter a valid withdrawal amount.")
    const fund = heldFunds.find((h) => h.id === heldFundId)
    if (!fund) throw new Error("Held fund not found.")

    const amountCents = Math.round(amount * 100)
    const dateStr = date || new Date().toISOString().split("T")[0]
    const noteStr = note?.trim() || "Withdrawal from fund"

    if (isSupabaseConfigured && supabase && isValidUUID(heldFundId)) {
      const userId = await resolveCurrentUserId()
      if (!userId) throw new Error("User authentication required.")

      // 1. Insert into history
      const { error: histErr } = await supabase.from("held_fund_history").insert({
        id: generateUUID(),
        held_fund_id: heldFundId,
        user_id: userId,
        amount_cents: amountCents,
        direction: "withdrawal",
        note: noteStr,
        date: dateStr,
      })
      if (histErr) throw new Error(histErr.message || "Failed to record fund withdrawal.")

      // 2. Update balance on held fund
      const newBalCents = (fund.balance_cents || 0) - amountCents
      const { error: balErr } = await supabase
        .from("held_funds")
        .update({ balance_cents: newBalCents })
        .eq("id", heldFundId)
        .eq("user_id", userId)
      if (balErr) throw new Error(balErr.message || "Failed to update fund balance.")

      // 3. Insert real income transaction on linked account
      let resolvedAccountId = fund.account_id
      if (!isValidUUID(resolvedAccountId)) {
        resolvedAccountId = (await ensureSystemAccount(userId, fund.account_id, accounts)) || fund.account_id
      }
      const hfCatId = await ensureSystemCategory(userId, "Held Funds", "income")
      const { error: txErr } = await supabase.from("transactions").insert({
        id: generateUUID(),
        user_id: userId,
        account_id: resolvedAccountId,
        category_id: (hfCatId && isValidUUID(hfCatId)) ? hfCatId : null,
        amount_cents: amountCents,
        type: "income",
        note: `Withdrawal from ${fund.name}: ${noteStr}`,
        date: dateStr,
      })
      if (txErr) throw new Error(txErr.message || "Failed to create account transaction.")

      await fetchData()
    } else {
      setHeldFunds((prev) => {
        const updated = prev.map((h) => {
          if (h.id === heldFundId) {
            const nextBal = (h.balance_cents || 0) - amountCents
            return { ...h, balance_cents: nextBal, balance: nextBal / 100 }
          }
          return h
        })
        saveLocal(STORAGE_HELD_FUNDS_KEY, updated)
        return updated
      })
    }
  }, [accounts, heldFunds, fetchData])

  const payFromHeldFund = useCallback(async (
    heldFundId: string,
    amount: number,
    note?: string,
    date?: string
  ) => {
    if (isNaN(amount) || amount <= 0) throw new Error("Please enter a valid payment amount.")
    const fund = heldFunds.find((h) => h.id === heldFundId)
    if (!fund) throw new Error("Held fund not found.")

    const amountCents = Math.round(amount * 100)
    const dateStr = date || new Date().toISOString().split("T")[0]
    const noteStr = note?.trim() || "Payment from held fund"

    if (isSupabaseConfigured && supabase && isValidUUID(heldFundId)) {
      const userId = await resolveCurrentUserId()
      if (!userId) throw new Error("User authentication required.")

      // 1. Insert history record with direction "payment" (does NOT touch transactions or accounts)
      let { error: histErr } = await supabase.from("held_fund_history").insert({
        id: generateUUID(),
        held_fund_id: heldFundId,
        user_id: userId,
        amount_cents: amountCents,
        direction: "payment",
        note: noteStr,
        date: dateStr,
      })

      // Fallback if Postgres constraint only allows 'withdrawal'
      if (histErr && (histErr.message?.includes("direction") || histErr.code === "23514")) {
        const retry = await supabase.from("held_fund_history").insert({
          id: generateUUID(),
          held_fund_id: heldFundId,
          user_id: userId,
          amount_cents: amountCents,
          direction: "withdrawal",
          note: `Payment: ${noteStr}`,
          date: dateStr,
        })
        histErr = retry.error
      }

      if (histErr) throw new Error(histErr.message || "Failed to record payment.")

      // 2. Reduce held fund balance
      const newBalCents = (fund.balance_cents || 0) - amountCents
      const { error: balErr } = await supabase
        .from("held_funds")
        .update({ balance_cents: newBalCents })
        .eq("id", heldFundId)
        .eq("user_id", userId)
      if (balErr) throw new Error(balErr.message || "Failed to update fund balance.")

      await fetchData()
    } else {
      setHeldFunds((prev) => {
        const updated = prev.map((h) => {
          if (h.id === heldFundId) {
            const nextBal = (h.balance_cents || 0) - amountCents
            return { ...h, balance_cents: nextBal, balance: nextBal / 100 }
          }
          return h
        })
        saveLocal(STORAGE_HELD_FUNDS_KEY, updated)
        return updated
      })
    }
  }, [heldFunds, fetchData])

  const updateHeldFundHistory = useCallback(async (
    historyItem: HeldFundHistory,
    updates: {
      amount?: number
      note?: string
      date?: string
    }
  ) => {
    const fund = heldFunds.find((h) => h.id === historyItem.held_fund_id)
    const newAmount = updates.amount !== undefined ? updates.amount : historyItem.amount
    const newAmountCents = Math.round(newAmount * 100)
    const diffCents = newAmountCents - historyItem.amount_cents
    const newNote = updates.note !== undefined ? updates.note.trim() : (historyItem.note || "")
    const newDate = updates.date || historyItem.date

    if (isSupabaseConfigured && supabase && isValidUUID(historyItem.id)) {
      const userId = await resolveCurrentUserId()
      if (!userId) throw new Error("User authentication required.")

      const { error: histErr } = await supabase
        .from("held_fund_history")
        .update({
          amount_cents: newAmountCents,
          note: newNote,
          date: newDate,
        })
        .eq("id", historyItem.id)
        .eq("user_id", userId)

      if (histErr) throw new Error(histErr.message || "Failed to update history record.")

      // Adjust fund balance if amount changed
      if (fund && diffCents !== 0) {
        const isIncomeToFund = historyItem.direction === "deposit"
        const balanceAdjustment = isIncomeToFund ? diffCents : -diffCents
        const newBalCents = (fund.balance_cents || 0) + balanceAdjustment

        await supabase
          .from("held_funds")
          .update({ balance_cents: newBalCents })
          .eq("id", fund.id)
          .eq("user_id", userId)
      }

      await fetchData()
    }
  }, [heldFunds, fetchData])

  const deleteHeldFundHistory = useCallback(async (historyItem: HeldFundHistory) => {
    const fund = heldFunds.find((h) => h.id === historyItem.held_fund_id)

    if (isSupabaseConfigured && supabase && isValidUUID(historyItem.id)) {
      const userId = await resolveCurrentUserId()
      if (!userId) throw new Error("User authentication required.")

      const { error: delErr } = await supabase
        .from("held_fund_history")
        .delete()
        .eq("id", historyItem.id)
        .eq("user_id", userId)

      if (delErr) throw new Error(delErr.message || "Failed to delete history record.")

      // Revert fund balance
      if (fund) {
        const isIncomeToFund = historyItem.direction === "deposit"
        const revertAdjustment = isIncomeToFund ? -historyItem.amount_cents : historyItem.amount_cents
        const newBalCents = (fund.balance_cents || 0) + revertAdjustment

        await supabase
          .from("held_funds")
          .update({ balance_cents: newBalCents })
          .eq("id", fund.id)
          .eq("user_id", userId)
      }

      await fetchData()
    }
  }, [heldFunds, fetchData])

  const fetchHeldFundHistory = useCallback(async (heldFundId: string): Promise<HeldFundHistory[]> => {
    if (isSupabaseConfigured && supabase) {
      const userId = await resolveCurrentUserId()
      if (!userId || !isValidUUID(heldFundId)) return []
      const { data, error } = await supabase
        .from("held_fund_history")
        .select("*")
        .eq("held_fund_id", heldFundId)
        .eq("user_id", userId)
        .order("date", { ascending: false })
        .order("created_at", { ascending: false })

      if (error || !data) return []
      return data.map((h: any) => ({
        id: String(h.id),
        held_fund_id: String(h.held_fund_id),
        user_id: h.user_id,
        amount_cents: h.amount_cents ?? 0,
        amount: (h.amount_cents ?? 0) / 100,
        direction: h.direction,
        note: h.note,
        date: h.date,
        created_at: h.created_at,
      }))
    }
    return []
  }, [])

  // ─────────────────────────────────────────────────────────────────
  // BILLS SYSTEM
  // ─────────────────────────────────────────────────────────────────

  const createBill = useCallback(async (billData: {
    name: string
    type: "income" | "expense" | "transfer"
    account_id: string
    destination_account_id?: string
    category_id?: string
    amount: number
    fee_amount?: number
    fee_type?: "flat" | "percentage" | "instapay"
    due_date: string
    recurrence: "one-off" | "daily" | "monthly" | "custom"
    recurrence_days?: number
  }) => {
    if (!billData.name.trim()) throw new Error("Please enter a bill name.")
    if (!billData.account_id) throw new Error("Please select an account.")
    if (isNaN(billData.amount) || billData.amount <= 0) throw new Error("Please enter a valid bill amount.")
    if (!billData.due_date) throw new Error("Please select a due date.")

    const amountCents = Math.round(billData.amount * 100)
    const feeAmount = billData.fee_amount && billData.fee_amount > 0 ? billData.fee_amount : 0
    const feeCents = Math.round(feeAmount * 100)

    if (isSupabaseConfigured && supabase) {
      const userId = await resolveCurrentUserId()
      if (!userId) throw new Error("User authentication required.")

      let resolvedAccountId = billData.account_id
      if (!isValidUUID(resolvedAccountId)) {
        resolvedAccountId = (await ensureSystemAccount(userId, billData.account_id, accounts)) || billData.account_id
      }

      let resolvedDestAccountId = billData.destination_account_id
      if (resolvedDestAccountId && !isValidUUID(resolvedDestAccountId)) {
        resolvedDestAccountId = (await ensureSystemAccount(userId, billData.destination_account_id!, accounts)) || billData.destination_account_id
      }

      let resolvedCategoryId: string | null = null
      if (billData.category_id && isValidUUID(billData.category_id)) {
        resolvedCategoryId = billData.category_id
      } else if (billData.category_id) {
        const localCat = categories.find((c) => c.id === billData.category_id)
        if (localCat) {
          resolvedCategoryId = (await ensureSystemCategory(userId, localCat.name, billData.type === "income" ? "income" : "expense")) || null
        }
      }

      const { data, error } = await supabase
        .from("bills")
        .insert({
          id: generateUUID(),
          user_id: userId,
          name: billData.name.trim(),
          type: billData.type,
          account_id: resolvedAccountId,
          destination_account_id: billData.type === "transfer" ? resolvedDestAccountId : null,
          category_id: resolvedCategoryId,
          amount_cents: amountCents,
          fee_amount_cents: feeCents,
          fee_type: billData.fee_type || null,
          due_date: billData.due_date,
          recurrence: billData.recurrence,
          recurrence_days: billData.recurrence === "custom" ? (billData.recurrence_days || 30) : null,
          is_completed: false,
        })
        .select()
        .single()

      if (error) throw new Error(error.message || "Failed to create bill.")
      await fetchData()
      return data
    } else {
      const newB: Bill = {
        id: generateUUID(),
        name: billData.name.trim(),
        type: billData.type,
        account_id: billData.account_id,
        destination_account_id: billData.destination_account_id,
        category_id: billData.category_id,
        amount_cents: amountCents,
        amount: billData.amount,
        fee_amount_cents: feeCents,
        fee_amount: feeAmount,
        fee_type: billData.fee_type,
        due_date: billData.due_date,
        recurrence: billData.recurrence,
        recurrence_days: billData.recurrence_days,
        is_completed: false,
        created_at: new Date().toISOString(),
      }
      setBills((prev) => {
        const updated = [...prev, newB]
        saveLocal(STORAGE_BILLS_KEY, updated)
        return updated
      })
      return newB
    }
  }, [accounts, categories, fetchData])

  const deleteBill = useCallback(async (billId: string) => {
    if (isSupabaseConfigured && supabase) {
      const userId = await resolveCurrentUserId()
      if (!userId) throw new Error("User authentication required.")
      const { error } = await supabase.from("bills").delete().eq("id", billId).eq("user_id", userId)
      if (error) throw new Error(error.message || "Failed to delete bill.")
      await fetchData()
    } else {
      setBills((prev) => {
        const updated = prev.filter((b) => b.id !== billId)
        saveLocal(STORAGE_BILLS_KEY, updated)
        return updated
      })
    }
  }, [fetchData])

  const markBillAsPaid = useCallback(async (billId: string, generateNextOccurrence: boolean) => {
    const bill = bills.find((b) => b.id === billId)
    if (!bill) throw new Error("Bill not found.")

    if (isSupabaseConfigured && supabase) {
      const userId = await resolveCurrentUserId()
      if (!userId) throw new Error("User authentication required.")

      // 1. Insert real transaction(s) into transactions table
      await createTransaction({
        account_id: bill.account_id,
        destination_account_id: bill.destination_account_id,
        category_id: bill.category_id,
        amount: bill.amount,
        type: bill.type,
        note: `Bill Paid: ${bill.name}`,
        date: new Date().toISOString().split("T")[0],
        fee_amount: bill.fee_amount,
        fee_type: bill.fee_type,
      })

      // 2. Mark this bill as completed
      const { error: completeErr } = await supabase
        .from("bills")
        .update({ is_completed: true })
        .eq("id", billId)
        .eq("user_id", userId)
      if (completeErr) throw new Error(completeErr.message || "Failed to mark bill as completed.")

      // 3. If recurring and user confirmed, calculate next due date and insert new bill row
      if (generateNextOccurrence && bill.recurrence !== "one-off") {
        const currentDate = new Date(bill.due_date)
        let nextDate = new Date(currentDate)

        if (bill.recurrence === "daily") {
          nextDate.setDate(nextDate.getDate() + 1)
        } else if (bill.recurrence === "monthly") {
          nextDate.setMonth(nextDate.getMonth() + 1)
        } else if (bill.recurrence === "custom") {
          nextDate.setDate(nextDate.getDate() + (bill.recurrence_days || 30))
        }

        const nextDateStr = nextDate.toISOString().split("T")[0]

        let nextAccId = bill.account_id
        if (!isValidUUID(nextAccId)) {
          nextAccId = (await ensureSystemAccount(userId, bill.account_id, accounts)) || bill.account_id
        }

        await supabase.from("bills").insert({
          id: generateUUID(),
          user_id: userId,
          name: bill.name,
          type: bill.type,
          account_id: nextAccId,
          destination_account_id: (bill.destination_account_id && isValidUUID(bill.destination_account_id)) ? bill.destination_account_id : null,
          category_id: (bill.category_id && isValidUUID(bill.category_id)) ? bill.category_id : null,
          amount_cents: bill.amount_cents,
          fee_amount_cents: bill.fee_amount_cents,
          fee_type: bill.fee_type || null,
          due_date: nextDateStr,
          recurrence: bill.recurrence,
          recurrence_days: bill.recurrence_days || null,
          is_completed: false,
        })
      }

      await fetchData()
    } else {
      setBills((prev) => {
        const updated = prev.map((b) => (b.id === billId ? { ...b, is_completed: true } : b))
        saveLocal(STORAGE_BILLS_KEY, updated)
        return updated
      })
    }
  }, [bills, createTransaction, fetchData])

  const updateBill = useCallback(async (
    billId: string,
    updates: {
      name?: string
      type?: "income" | "expense" | "transfer"
      account_id?: string
      destination_account_id?: string
      category_id?: string
      amount?: number
      fee_amount?: number
      fee_type?: "flat" | "percentage" | "instapay"
      due_date?: string
      recurrence?: "one-off" | "daily" | "monthly" | "custom"
      recurrence_days?: number
    },
    applyToAllFuture = false
  ) => {
    const currentBill = bills.find((b) => b.id === billId)
    if (!currentBill) throw new Error("Bill not found.")

    const updatePayload: any = {}
    if (updates.name !== undefined) updatePayload.name = updates.name.trim()
    if (updates.type !== undefined) updatePayload.type = updates.type
    if (updates.account_id !== undefined) updatePayload.account_id = updates.account_id
    if (updates.destination_account_id !== undefined) updatePayload.destination_account_id = updates.destination_account_id || null
    if (updates.category_id !== undefined) updatePayload.category_id = updates.category_id || null
    if (updates.amount !== undefined) updatePayload.amount_cents = Math.round(updates.amount * 100)
    if (updates.fee_amount !== undefined) updatePayload.fee_amount_cents = Math.round(updates.fee_amount * 100)
    if (updates.fee_type !== undefined) updatePayload.fee_type = updates.fee_type || null
    if (updates.due_date !== undefined) updatePayload.due_date = updates.due_date
    if (updates.recurrence !== undefined) updatePayload.recurrence = updates.recurrence
    if (updates.recurrence_days !== undefined) updatePayload.recurrence_days = updates.recurrence_days || null

    if (isSupabaseConfigured && supabase) {
      const userId = await resolveCurrentUserId()
      if (!userId) throw new Error("User authentication required.")

      if (applyToAllFuture) {
        const parentId = currentBill.parent_bill_id || currentBill.id
        const todayStr = new Date().toISOString().split("T")[0]

        // 1. Update this bill row
        await supabase.from("bills").update(updatePayload).eq("id", billId).eq("user_id", userId)

        // 2. Update future occurrences sharing parent_bill_id
        const futurePayload = { ...updatePayload }
        delete futurePayload.due_date

        try {
          await supabase
            .from("bills")
            .update(futurePayload)
            .eq("user_id", userId)
            .eq("parent_bill_id", parentId)
            .gte("due_date", todayStr)
            .eq("is_completed", false)
        } catch (err) {
          console.warn("Error updating future bill recurrences:", err)
        }
      } else {
        const { error } = await supabase
          .from("bills")
          .update(updatePayload)
          .eq("id", billId)
          .eq("user_id", userId)
        if (error) throw new Error(error.message || "Failed to update bill.")
      }

      await fetchData()
    } else {
      setBills((prev) => {
        const updated = prev.map((b) => (b.id === billId ? {
          ...b,
          ...updates,
          amount_cents: updates.amount !== undefined ? Math.round(updates.amount * 100) : b.amount_cents,
          amount: updates.amount !== undefined ? updates.amount : b.amount,
          fee_amount_cents: updates.fee_amount !== undefined ? Math.round(updates.fee_amount * 100) : b.fee_amount_cents,
          fee_amount: updates.fee_amount !== undefined ? updates.fee_amount : b.fee_amount,
        } : b))
        saveLocal(STORAGE_BILLS_KEY, updated)
        return updated
      })
    }
  }, [bills, fetchData])

  // ─────────────────────────────────────────────────────────────────
  // PERSISTENT NOTIFICATIONS SYSTEM (Feature 6)
  // ─────────────────────────────────────────────────────────────────

  const [notifications, setNotifications] = useState<AppNotification[]>([])

  const fetchNotifications = useCallback(async () => {
    const todayStr = new Date().toISOString().split("T")[0]
    const today = new Date(todayStr)
    const dismissedLocal: string[] = typeof window !== "undefined"
      ? JSON.parse(localStorage.getItem("spendly_dismissed_notifications") || "[]")
      : []

    if (isSupabaseConfigured && supabase) {
      try {
        const userId = await resolveCurrentUserId()
        if (userId) {
          // 1. Check bills due within 3 days and sync to notifications table
          const upcomingBills = bills.filter((b) => !b.is_completed)
          for (const b of upcomingBills) {
            const due = new Date(b.due_date)
            const diffDays = Math.ceil((due.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
            if (diffDays >= 0 && diffDays <= 3) {
              if (isValidUUID(b.id)) {
                const { data: existing } = await supabase
                  .from("notifications")
                  .select("id")
                  .eq("user_id", userId)
                  .eq("reference_id", b.id)
                  .maybeSingle()

                if (!existing) {
                  await supabase.from("notifications").insert({
                    id: generateUUID(),
                    user_id: userId,
                    type: "warning",
                    reference_id: b.id,
                    message: `${b.name} is due in ${diffDays === 0 ? "today" : diffDays + " days"} — EGP ${(b.amount || 0).toFixed(2)}`,
                    is_read: false,
                  })
                }
              }
            }
          }

          // 2. Check if any active plan's period has ended (start_date + period length < today)
          const todayTime = today.getTime()
          for (const p of budgetPlans) {
            if (p.is_active && p.is_repeating && p.start_date) {
              const endObj = new Date(p.start_date)
              if (p.period === "weekly") {
                endObj.setDate(endObj.getDate() + 7)
              } else if (p.period === "monthly") {
                endObj.setMonth(endObj.getMonth() + 1)
              } else if (p.period === "custom") {
                endObj.setDate(endObj.getDate() + (p.custom_days || 30))
              }

              if (todayTime >= endObj.getTime()) {
                const notifRefId = `plan_renewal_${p.id}`
                if (!dismissedLocal.includes(notifRefId)) {
                  if (isValidUUID(p.id)) {
                    const { data: existing } = await supabase
                      .from("notifications")
                      .select("id")
                      .eq("user_id", userId)
                      .eq("reference_id", notifRefId)
                      .maybeSingle()

                    if (!existing) {
                      await supabase.from("notifications").insert({
                        id: generateUUID(),
                        user_id: userId,
                        type: "info",
                        reference_id: notifRefId,
                        message: `Your budget plan "${p.name}" has ended. Tap to review and renew.`,
                        is_read: false,
                      })
                    }
                  }
                }
              }
            }
          }

          // 3. Fetch unread notifications
          const { data: notifData } = await supabase
            .from("notifications")
            .select("*")
            .eq("user_id", userId)
            .eq("is_read", false)
            .order("created_at", { ascending: false })

          if (notifData) {
            const mapped: AppNotification[] = notifData
              .filter((n) => !dismissedLocal.includes(n.id) && !dismissedLocal.includes(n.reference_id || ""))
              .map((n) => ({
                id: n.id,
                user_id: n.user_id,
                type: n.type as any,
                reference_id: n.reference_id,
                title: n.type === "warning" ? "Bill Reminder" : "Notification",
                message: n.message,
                time: n.created_at ? new Date(n.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : "Today",
                is_read: Boolean(n.is_read),
                created_at: n.created_at,
              }))
            setNotifications(mapped)
            return
          }
        }
      } catch (err) {
        console.warn("Error fetching Supabase notifications:", err)
      }
    }

    // Fallback: derive from upcoming bills and plans
    const derived: AppNotification[] = []
    bills.forEach((b) => {
      if (!b.is_completed) {
        const due = new Date(b.due_date)
        const diffDays = Math.ceil((due.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
        const notifId = `bill_${b.id}`
        if (diffDays >= 0 && diffDays <= 3 && !dismissedLocal.includes(notifId) && !dismissedLocal.includes(b.id)) {
          derived.push({
            id: notifId,
            type: "warning",
            reference_id: b.id,
            title: "Bill Reminder",
            message: `${b.name} is due in ${diffDays === 0 ? "today" : diffDays + " days"} — EGP ${(b.amount || 0).toFixed(2)}`,
            time: diffDays === 0 ? "Today" : `In ${diffDays}d`,
            is_read: false,
          })
        }
      }
    })

    budgetPlans.forEach((p) => {
      if (p.is_active && p.is_repeating && p.start_date) {
        const endObj = new Date(p.start_date)
        if (p.period === "weekly") endObj.setDate(endObj.getDate() + 7)
        else if (p.period === "monthly") endObj.setMonth(endObj.getMonth() + 1)
        else if (p.period === "custom") endObj.setDate(endObj.getDate() + (p.custom_days || 30))

        if (today.getTime() >= endObj.getTime()) {
          const notifId = `plan_renewal_${p.id}`
          if (!dismissedLocal.includes(notifId)) {
            derived.push({
              id: notifId,
              type: "info",
              reference_id: notifId,
              title: "Budget Plan Ended",
              message: `Your budget plan "${p.name}" has ended. Tap to review and renew.`,
              time: "Today",
              is_read: false,
            })
          }
        }
      }
    })

    setNotifications(derived)
  }, [bills, budgetPlans])

  const markNotificationAsRead = useCallback(async (notifId: string, referenceId?: string) => {
    // 1. Save to localStorage dismissed array
    if (typeof window !== "undefined") {
      const dismissed: string[] = JSON.parse(localStorage.getItem("spendly_dismissed_notifications") || "[]")
      if (!dismissed.includes(notifId)) dismissed.push(notifId)
      if (referenceId && !dismissed.includes(referenceId)) dismissed.push(referenceId)
      localStorage.setItem("spendly_dismissed_notifications", JSON.stringify(dismissed))
    }

    // 2. Update Supabase if valid UUID
    if (isSupabaseConfigured && supabase) {
      try {
        const userId = await resolveCurrentUserId()
        if (userId) {
          if (isValidUUID(notifId)) {
            await supabase
              .from("notifications")
              .update({ is_read: true })
              .eq("id", notifId)
              .eq("user_id", userId)
          } else if (referenceId && isValidUUID(referenceId)) {
            await supabase
              .from("notifications")
              .update({ is_read: true })
              .eq("reference_id", referenceId)
              .eq("user_id", userId)
          }
        }
      } catch (err) {
        console.warn("Error marking notification read in Supabase:", err)
      }
    }

    // 3. Update React state
    setNotifications((prev) => prev.filter((n) => n.id !== notifId && n.reference_id !== notifId && (!referenceId || n.reference_id !== referenceId)))
  }, [])

  useEffect(() => {
    fetchNotifications()
  }, [fetchNotifications])

  // ─────────────────────────────────────────────────────────────────
  // BUDGET PLANS CRUD
  // ─────────────────────────────────────────────────────────────────

  const activeBudgetPlan = useMemo(() => {
    return budgetPlans.find((p) => p.is_active) || null
  }, [budgetPlans])

  const createBudgetPlan = useCallback(async (
    planData: {
      name: string
      total_amount: number
      fixed_commitments?: number
      account_id?: string
      period: "weekly" | "monthly" | "custom"
      custom_days?: number
      start_date: string
      framework: "50/30/20" | "suggested"
      is_repeating?: boolean
      deselected_bill_ids?: string[]
      indicator_account_ids?: string[]
    },
    categoryAllocations: Array<{
      category_id: string
      bucket: "bills" | "needs" | "wants" | "savings"
      allocated_amount: number
    }>,
    activateNow: boolean
  ): Promise<BudgetPlan> => {
    const newPlanId = generateUUID()
    const totalAmountCents = Math.round((planData.total_amount || 0) * 100)
    const fixedCommitmentsCents = Math.round((planData.fixed_commitments || 0) * 100)
    const isRepeating = planData.is_repeating ?? true

    const newPlan: BudgetPlan = {
      id: newPlanId,
      name: planData.name.trim(),
      total_amount_cents: totalAmountCents,
      total_amount: planData.total_amount,
      fixed_commitments_cents: fixedCommitmentsCents,
      fixed_commitments: planData.fixed_commitments,
      account_id: planData.account_id,
      period: planData.period,
      custom_days: planData.custom_days,
      start_date: planData.start_date,
      framework: planData.framework,
      is_active: activateNow,
      is_repeating: isRepeating,
      deselected_bill_ids: planData.deselected_bill_ids || [],
      indicator_account_ids: planData.indicator_account_ids || [],
      created_at: new Date().toISOString(),
      categories: categoryAllocations.map((c) => ({
        id: generateUUID(),
        plan_id: newPlanId,
        category_id: c.category_id,
        bucket: c.bucket,
        allocated_amount_cents: Math.round(c.allocated_amount * 100),
        allocated_amount: c.allocated_amount,
      })),
    }

    if (isSupabaseConfigured && supabase) {
      try {
        const userId = await resolveCurrentUserId()
        if (userId) {
          if (activateNow) {
            await supabase.from("budget_plans").update({ is_active: false }).eq("user_id", userId)
          }

          const validDeselected = (planData.deselected_bill_ids || []).filter(isValidUUID)
          const validIndicators = (planData.indicator_account_ids || []).filter(isValidUUID)

          const insertPayload: any = {
            id: newPlanId,
            user_id: userId,
            name: planData.name.trim(),
            total_amount_cents: totalAmountCents,
            fixed_commitments_cents: fixedCommitmentsCents,
            account_id: planData.account_id ? (isValidUUID(planData.account_id) ? planData.account_id : null) : null,
            period: planData.period,
            custom_days: planData.period === "custom" ? (planData.custom_days || 30) : null,
            start_date: planData.start_date,
            framework: planData.framework,
            is_active: activateNow,
            is_repeating: isRepeating,
            deselected_bill_ids: validDeselected,
            indicator_account_ids: validIndicators,
          }

          let { error: planError } = await supabase.from("budget_plans").insert(insertPayload)
          if (planError && (planError.code === "PGRST204" || planError.message?.includes("fixed_commitments_cents"))) {
            delete insertPayload.fixed_commitments_cents
            const retryRes = await supabase.from("budget_plans").insert(insertPayload)
            planError = retryRes.error
          }

          if (planError) {
            console.error("Supabase plan save error:", planError)
            throw new Error(`Failed to save budget plan to Supabase: ${planError.message}`)
          }

          const validCatRows = categoryAllocations
            .filter((c) => isValidUUID(c.category_id) && ["needs", "wants", "savings", "bills"].includes(c.bucket))
            .map((c) => ({
              id: generateUUID(),
              plan_id: newPlanId,
              user_id: userId,
              category_id: c.category_id,
              bucket: c.bucket,
              allocated_amount_cents: Math.round(c.allocated_amount * 100),
            }))

          if (validCatRows.length > 0) {
            const { error: catInsertError } = await supabase.from("budget_plan_categories").insert(validCatRows)
            if (catInsertError) {
              console.error("Supabase plan categories insert error:", catInsertError)
              throw new Error(`Failed to save category allocations to Supabase: ${catInsertError.message}`)
            }
          }

          // Persist category group assignments (and budget if activating) to categories table
          const localGroups = getLocalCategoryGroups()
          for (const c of categoryAllocations) {
            if (isValidUUID(c.category_id)) {
              const bucket = c.bucket as CategoryGroup
              const updatePayload: any = {}
              if (activateNow) {
                updatePayload.budget_cents = Math.round(c.allocated_amount * 100)
              }
              if (["needs", "wants", "savings", "bills"].includes(bucket)) {
                updatePayload.group = bucket
                localGroups[c.category_id] = bucket
              }
              if (Object.keys(updatePayload).length > 0) {
                try {
                  await supabase
                    .from("categories")
                    .update(updatePayload)
                    .eq("id", c.category_id)
                    .eq("user_id", userId)
                } catch (catUpErr) {
                  console.warn("Category update error in createBudgetPlan:", catUpErr)
                }
              }
            }
          }
          saveLocalCategoryGroups(localGroups)

          await fetchData()
          return newPlan
        }
      } catch (sbErr: any) {
        console.error("Supabase plan save exception:", sbErr)
        throw sbErr
      }
    }

    // Always update local state & local storage
    const localGroups = getLocalCategoryGroups()
    categoryAllocations.forEach((c) => {
      if (["needs", "wants", "savings", "bills"].includes(c.bucket)) {
        localGroups[c.category_id] = c.bucket as CategoryGroup
      }
    })
    saveLocalCategoryGroups(localGroups)

    setBudgetPlans((prev) => {
      const list = activateNow ? prev.map((p) => ({ ...p, is_active: false })) : prev
      const updated = [newPlan, ...list.filter((p) => p.id !== newPlanId)]
      saveLocal(STORAGE_BUDGET_PLANS_KEY, updated)
      return updated
    })

    setCategories((prev) => {
      const groupMap = new Map(
        categoryAllocations
          .filter((c) => ["needs", "wants", "savings", "bills"].includes(c.bucket))
          .map((c) => [c.category_id, c.bucket as CategoryGroup])
      )
      const allocMap = activateNow ? new Map(categoryAllocations.map((c) => [c.category_id, c.allocated_amount])) : null
      const updated = prev.map((cat) => {
        let nextCat = cat
        if (groupMap.has(cat.id)) {
          nextCat = { ...nextCat, group: groupMap.get(cat.id)! }
        }
        if (allocMap && allocMap.has(cat.id)) {
          nextCat = { ...nextCat, budget: allocMap.get(cat.id) }
        }
        return nextCat
      })
      saveLocal(STORAGE_CATEGORIES_KEY, updated)
      return updated
    })

    return newPlan
  }, [fetchData])

  const updateBudgetPlan = useCallback(async (
    planId: string,
    planData: Partial<BudgetPlan>,
    categoryAllocations: Array<{
      category_id: string
      bucket: "bills" | "needs" | "wants" | "savings"
      allocated_amount: number
    }>,
    activateNow: boolean
  ) => {
    const totalAmountCents = planData.total_amount !== undefined ? Math.round(planData.total_amount * 100) : undefined
    const fixedCommitmentsCents = planData.fixed_commitments !== undefined ? Math.round(planData.fixed_commitments * 100) : undefined

    if (isSupabaseConfigured && supabase) {
      try {
        const userId = await resolveCurrentUserId()
        if (userId) {
          if (activateNow) {
            await supabase.from("budget_plans").update({ is_active: false }).eq("user_id", userId)
          }

          const updatePayload: any = {}
          if (planData.name !== undefined) updatePayload.name = planData.name.trim()
          if (totalAmountCents !== undefined) updatePayload.total_amount_cents = totalAmountCents
          if (fixedCommitmentsCents !== undefined) updatePayload.fixed_commitments_cents = fixedCommitmentsCents
          if (planData.account_id !== undefined) updatePayload.account_id = planData.account_id ? (isValidUUID(planData.account_id) ? planData.account_id : null) : null
          if (planData.period !== undefined) updatePayload.period = planData.period
          if (planData.custom_days !== undefined) updatePayload.custom_days = planData.custom_days || null
          if (planData.start_date !== undefined) updatePayload.start_date = planData.start_date
          if (planData.framework !== undefined) updatePayload.framework = planData.framework
          if (planData.is_repeating !== undefined) updatePayload.is_repeating = planData.is_repeating
          if (planData.deselected_bill_ids !== undefined) updatePayload.deselected_bill_ids = (planData.deselected_bill_ids || []).filter(isValidUUID)
          if (planData.indicator_account_ids !== undefined) updatePayload.indicator_account_ids = (planData.indicator_account_ids || []).filter(isValidUUID)
          if (activateNow) updatePayload.is_active = true

          let { error: updateError } = await supabase.from("budget_plans").update(updatePayload).eq("id", planId).eq("user_id", userId)
          if (updateError && (updateError.code === "PGRST204" || updateError.message?.includes("fixed_commitments_cents"))) {
            delete updatePayload.fixed_commitments_cents
            const retryRes = await supabase.from("budget_plans").update(updatePayload).eq("id", planId).eq("user_id", userId)
            updateError = retryRes.error
          }

          if (updateError) {
            console.error("Supabase plan update error:", updateError)
            throw new Error(`Failed to update budget plan in Supabase: ${updateError.message}`)
          }

          const { error: delError } = await supabase.from("budget_plan_categories").delete().eq("plan_id", planId).eq("user_id", userId)
          if (delError) {
            console.error("Supabase plan categories delete error:", delError)
            throw new Error(`Failed to clear previous allocations in Supabase: ${delError.message}`)
          }

          const validCatRows = categoryAllocations
            .filter((c) => isValidUUID(c.category_id) && ["needs", "wants", "savings", "bills"].includes(c.bucket))
            .map((c) => ({
              id: generateUUID(),
              plan_id: planId,
              user_id: userId,
              category_id: c.category_id,
              bucket: c.bucket,
              allocated_amount_cents: Math.round(c.allocated_amount * 100),
            }))

          if (validCatRows.length > 0) {
            const { error: catInsertError } = await supabase.from("budget_plan_categories").insert(validCatRows)
            if (catInsertError) {
              console.error("Supabase plan categories insert error:", catInsertError)
              throw new Error(`Failed to save updated category allocations in Supabase: ${catInsertError.message}`)
            }
          }

          const localGroups = getLocalCategoryGroups()
          for (const c of categoryAllocations) {
            if (isValidUUID(c.category_id)) {
              const bucket = c.bucket as CategoryGroup
              const updatePayload: any = {}
              if (activateNow) {
                updatePayload.budget_cents = Math.round(c.allocated_amount * 100)
              }
              if (["needs", "wants", "savings", "bills"].includes(bucket)) {
                updatePayload.group = bucket
                localGroups[c.category_id] = bucket
              }
              if (Object.keys(updatePayload).length > 0) {
                try {
                  await supabase
                    .from("categories")
                    .update(updatePayload)
                    .eq("id", c.category_id)
                    .eq("user_id", userId)
                } catch (catUpErr) {
                  console.warn("Category update error in updateBudgetPlan:", catUpErr)
                }
              }
            }
          }
          saveLocalCategoryGroups(localGroups)

          await fetchData()
        }
      } catch (sbErr: any) {
        console.error("Supabase plan update exception:", sbErr)
        throw sbErr
      }
    }

    // Always update local fallback
    const localGroups = getLocalCategoryGroups()
    categoryAllocations.forEach((c) => {
      if (["needs", "wants", "savings", "bills"].includes(c.bucket)) {
        localGroups[c.category_id] = c.bucket as CategoryGroup
      }
    })
    saveLocalCategoryGroups(localGroups)

    setBudgetPlans((prev) => {
      const updated = prev.map((p) => {
        if (p.id === planId) {
          return {
            ...p,
            ...planData,
            total_amount_cents: totalAmountCents ?? p.total_amount_cents,
            is_active: activateNow ? true : p.is_active,
            categories: categoryAllocations.map((c) => ({
              id: generateUUID(),
              plan_id: planId,
              category_id: c.category_id,
              bucket: c.bucket,
              allocated_amount_cents: Math.round(c.allocated_amount * 100),
              allocated_amount: c.allocated_amount,
            })),
          }
        }
        return activateNow ? { ...p, is_active: false } : p
      })
      saveLocal(STORAGE_BUDGET_PLANS_KEY, updated)
      return updated
    })

    setCategories((prev) => {
      const groupMap = new Map(
        categoryAllocations
          .filter((c) => ["needs", "wants", "savings", "bills"].includes(c.bucket))
          .map((c) => [c.category_id, c.bucket as CategoryGroup])
      )
      const allocMap = activateNow ? new Map(categoryAllocations.map((c) => [c.category_id, c.allocated_amount])) : null
      const updated = prev.map((cat) => {
        let nextCat = cat
        if (groupMap.has(cat.id)) {
          nextCat = { ...nextCat, group: groupMap.get(cat.id)! }
        }
        if (allocMap && allocMap.has(cat.id)) {
          nextCat = { ...nextCat, budget: allocMap.get(cat.id) }
        }
        return nextCat
      })
      saveLocal(STORAGE_CATEGORIES_KEY, updated)
      return updated
    })
  }, [fetchData])

  const activateBudgetPlan = useCallback(async (planId: string) => {
    if (isSupabaseConfigured && supabase) {
      try {
        const userId = await resolveCurrentUserId()
        if (userId) {
          await supabase.from("budget_plans").update({ is_active: false }).eq("user_id", userId)
          await supabase.from("budget_plans").update({ is_active: true }).eq("id", planId).eq("user_id", userId)

          const { data: allocations } = await supabase
            .from("budget_plan_categories")
            .select("*")
            .eq("plan_id", planId)
            .eq("user_id", userId)

          if (allocations && allocations.length > 0) {
            const localGroups = getLocalCategoryGroups()
            for (const a of allocations) {
              if (isValidUUID(a.category_id)) {
                const bucket = String(a.bucket).toLowerCase()
                const updatePayload: any = { budget_cents: a.allocated_amount_cents }
                if (["needs", "wants", "savings", "bills"].includes(bucket)) {
                  updatePayload.group = bucket
                  localGroups[String(a.category_id)] = bucket as CategoryGroup
                }
                await supabase
                  .from("categories")
                  .update(updatePayload)
                  .eq("id", a.category_id)
                  .eq("user_id", userId)
              }
            }
            saveLocalCategoryGroups(localGroups)
          }
          await fetchData()
        }
      } catch (sbErr) {
        console.warn("Supabase plan activate exception:", sbErr)
      }
    }

    setBudgetPlans((prev) => {
      const targetPlan = prev.find((p) => p.id === planId)
      const updated = prev.map((p) => ({ ...p, is_active: p.id === planId }))
      saveLocal(STORAGE_BUDGET_PLANS_KEY, updated)

      if (targetPlan?.categories) {
        const allocMap = new Map(targetPlan.categories.map((c) => [c.category_id, c.allocated_amount]))
        const groupMap = new Map(
          targetPlan.categories
            .filter((c) => ["needs", "wants", "savings", "bills"].includes(c.bucket))
            .map((c) => [c.category_id, c.bucket as CategoryGroup])
        )
        const localGroups = getLocalCategoryGroups()
        groupMap.forEach((grp, catId) => {
          localGroups[catId] = grp
        })
        saveLocalCategoryGroups(localGroups)

        setCategories((catPrev) => {
          const updatedCats = catPrev.map((cat) => {
            let nextCat = cat
            if (groupMap.has(cat.id)) {
              nextCat = { ...nextCat, group: groupMap.get(cat.id)! }
            }
            if (allocMap.has(cat.id)) {
              nextCat = { ...nextCat, budget: allocMap.get(cat.id) }
            }
            return nextCat
          })
          saveLocal(STORAGE_CATEGORIES_KEY, updatedCats)
          return updatedCats
        })
      }

      return updated
    })
  }, [fetchData])

  const deleteBudgetPlan = useCallback(async (planId: string) => {
    const target = budgetPlans.find((p) => p.id === planId)
    const wasActive = target?.is_active

    if (isSupabaseConfigured && supabase) {
      try {
        const userId = await resolveCurrentUserId()
        if (userId && isValidUUID(planId)) {
          await supabase.from("budget_plan_categories").delete().eq("plan_id", planId).eq("user_id", userId)
          await supabase.from("budget_plans").delete().eq("id", planId).eq("user_id", userId)
          if (wasActive) {
            await supabase.from("categories").update({ budget_cents: 0 }).eq("user_id", userId)
          }
        }
        await fetchData()
      } catch (sbErr) {
        console.warn("Supabase plan delete notice:", sbErr)
      }
    }

    setBudgetPlans((prev) => {
      const updated = prev.filter((p) => p.id !== planId)
      saveLocal(STORAGE_BUDGET_PLANS_KEY, updated)
      return updated
    })

    if (wasActive) {
      setCategories((prev) => {
        const updated = prev.map((c) => ({ ...c, budget: 0 }))
        saveLocal(STORAGE_CATEGORIES_KEY, updated)
        return updated
      })
    }
  }, [budgetPlans, fetchData])

  const renameBudgetPlan = useCallback(async (planId: string, newName: string) => {
    if (!newName.trim()) return
    if (isSupabaseConfigured && supabase) {
      const userId = await resolveCurrentUserId()
      if (userId && isValidUUID(planId)) {
        await supabase
          .from("budget_plans")
          .update({ name: newName.trim() })
          .eq("id", planId)
          .eq("user_id", userId)
      }
      await fetchData()
      return
    }

    setBudgetPlans((prev) => {
      const updated = prev.map((p) => (p.id === planId ? { ...p, name: newName.trim() } : p))
      saveLocal(STORAGE_BUDGET_PLANS_KEY, updated)
      return updated
    })
  }, [fetchData])

  const recordPlanHistory = useCallback(async (
    planId: string,
    periodStart: string,
    periodEnd: string,
    totalPlanned: number,
    totalActual: number,
    categoryBreakdown: Array<{
      category_id: string
      planned_amount: number
      actual_amount: number
    }>
  ) => {
    if (isSupabaseConfigured && supabase) {
      const userId = await resolveCurrentUserId()
      if (userId && isValidUUID(planId)) {
        const historyId = generateUUID()
        const { data: hist, error: histErr } = await supabase
          .from("budget_plan_history")
          .insert({
            id: historyId,
            plan_id: planId,
            user_id: userId,
            period_start: periodStart,
            period_end: periodEnd,
            total_planned_cents: Math.round(totalPlanned * 100),
            total_actual_cents: Math.round(totalActual * 100),
          })
          .select()
          .single()

        if (!histErr && categoryBreakdown.length > 0) {
          const catHistRows = categoryBreakdown.map((c) => ({
            id: generateUUID(),
            plan_history_id: historyId,
            user_id: userId,
            category_id: c.category_id,
            planned_amount_cents: Math.round(c.planned_amount * 100),
            actual_amount_cents: Math.round(c.actual_amount * 100),
          }))

          await supabase.from("budget_plan_category_history").insert(catHistRows)
        }
      }
    }
  }, [])

  const resetAllUserData = useCallback(async (password: string): Promise<{ success: boolean; error?: string }> => {
    if (!password || !password.trim()) {
      return { success: false, error: "Password is required to confirm data reset." }
    }

    if (isSupabaseConfigured && supabase) {
      try {
        let userEmail = ""
        let userId = ""
        const { data: userData } = await supabase.auth.getUser()
        if (userData?.user) {
          userEmail = userData.user.email || ""
          userId = userData.user.id
        } else {
          const { data: sessionData } = await supabase.auth.getSession()
          if (sessionData?.session?.user) {
            userEmail = sessionData.session.user.email || ""
            userId = sessionData.session.user.id
          }
        }

        if (userEmail) {
          const { error: verifyError } = await supabase.auth.signInWithPassword({
            email: userEmail,
            password: password,
          })
          if (verifyError) {
            return { success: false, error: "Incorrect password. Data reset cancelled." }
          }
        }

        if (!userId) {
          userId = (await resolveCurrentUserId()) || ""
        }

        if (userId) {
          // Delete from all tables in foreign-key safe order
          // 1. Budget Plan Category History
          await supabase.from("budget_plan_category_history").delete().eq("user_id", userId)
          // 2. Budget Plan History
          await supabase.from("budget_plan_history").delete().eq("user_id", userId)
          // 3. Budget Plan Categories
          await supabase.from("budget_plan_categories").delete().eq("user_id", userId)
          // 4. Budget Plans
          await supabase.from("budget_plans").delete().eq("user_id", userId)
          // 5. Transactions
          await supabase.from("transactions").delete().eq("user_id", userId)
          // 6. Held fund history
          await supabase.from("held_fund_history").delete().eq("user_id", userId)
          // 7. Held funds
          await supabase.from("held_funds").delete().eq("user_id", userId)
          // 8. Bills
          await supabase.from("bills").delete().eq("user_id", userId)
          // 9. Categories
          await supabase.from("categories").delete().eq("user_id", userId)
          // 10. Accounts
          await supabase.from("accounts").delete().eq("user_id", userId)
          // 11. Profiles
          await supabase.from("profiles").delete().eq("id", userId)
        }
      } catch (err: any) {
        console.error("Error during Supabase data reset:", err)
        return { success: false, error: err?.message || "Failed to reset data in database." }
      }
    }

    // Clear local storage
    clearAllLocalFinanceData()

    // Clear React states
    setAccounts([])
    setTransactions([])
    setCategories([])
    setHeldFunds([])
    setBills([])
    setBudgetPlans([])

    return { success: true }
  }, [])

  // ─────────────────────────────────────────────────────────────────
  // DASHBOARD CALCULATIONS
  // ─────────────────────────────────────────────────────────────────

  const netWorth = useMemo(() => {
    return accounts.reduce((sum, a) => sum + (Number(a.balance) || 0), 0)
  }, [accounts])

  const totalIncome = useMemo(() => {
    return transactions
      .filter((t) => t.type === "income" && !t.is_fee && !isTransferTransaction(t))
      .reduce((sum, t) => sum + t.amount, 0)
  }, [transactions])

  const totalExpense = useMemo(() => {
    return transactions
      .filter((t) => t.type === "expense" && !isTransferTransaction(t))
      .reduce((sum, t) => sum + t.amount, 0)
  }, [transactions])

  // Feature 6: Month-to-date daily Net Worth Sparkline
  const monthSparklineData = useMemo(() => {
    const today = new Date()
    const currentYear = today.getFullYear()
    const currentMonth = today.getMonth() // 0-indexed
    const currentDay = today.getDate()

    // 1st of month to today
    const dataPoints: { date: string; value: number }[] = []

    // Calculate baseline starting net worth at beginning of current month
    const totalStarting = accounts.reduce((sum, a) => sum + (a.starting_balance_cents || 0) / 100, 0)
    
    // Transactions before 1st of this month
    const firstOfMonthStr = `${currentYear}-${String(currentMonth + 1).padStart(2, "0")}-01`
    const preMonthTxDelta = transactions
      .filter((t) => t.date < firstOfMonthStr)
      .reduce((sum, t) => sum + (t.type === "income" ? t.amount : -t.amount), 0)

    let runningNetWorth = totalStarting + preMonthTxDelta

    for (let day = 1; day <= currentDay; day++) {
      const dayStr = `${currentYear}-${String(currentMonth + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`
      const dayTxs = transactions.filter((t) => t.date === dayStr)
      const dayDelta = dayTxs.reduce((sum, t) => sum + (t.type === "income" ? t.amount : -t.amount), 0)
      runningNetWorth += dayDelta

      dataPoints.push({
        date: String(day),
        value: Number(runningNetWorth.toFixed(2)),
      })
    }

    if (dataPoints.length === 0) {
      dataPoints.push({ date: "1", value: netWorth })
    }

    return dataPoints
  }, [accounts, transactions, netWorth])

  return {
    accounts,
    transactions,
    categories,
    heldFunds,
    bills,
    budgetPlans,
    activeBudgetPlan,
    loading,
    netWorth,
    totalIncome,
    totalExpense,
    monthSparklineData,
    notifications,
    createAccount,
    deleteAccount,
    createCategory,
    updateCategory,
    deleteCategory,
    createTransaction,
    createSplitExpenseTransaction,
    updateTransaction,
    batchUpdateTransactionDates,
    deleteTransaction,
    createHeldFund,
    renameHeldFund,
    deleteHeldFund,
    depositToHeldFund,
    withdrawFromHeldFund,
    payFromHeldFund,
    updateHeldFundHistory,
    deleteHeldFundHistory,
    fetchHeldFundHistory,
    createBill,
    updateBill,
    deleteBill,
    markBillAsPaid,
    createBudgetPlan,
    updateBudgetPlan,
    activateBudgetPlan,
    deleteBudgetPlan,
    renameBudgetPlan,
    recordPlanHistory,
    markNotificationAsRead,
    refreshNotifications: fetchNotifications,
    resetAllUserData,
    refreshFinanceData: fetchData,
  }
}

export type FinanceDataContextType = ReturnType<typeof useFinanceDataInternal>

const FinanceDataContext = createContext<FinanceDataContextType | null>(null)

export function FinanceDataProvider({ children }: { children: React.ReactNode }) {
  const value = useFinanceDataInternal()
  return React.createElement(FinanceDataContext.Provider, { value }, children)
}

export function useFinanceData() {
  const context = useContext(FinanceDataContext)
  if (context) return context
  return useFinanceDataInternal()
}
