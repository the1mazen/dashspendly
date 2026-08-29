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
  is_fee?: boolean
  note?: string
  description: string
  date: string
  created_at?: string
  account_name?: string
  category_name?: string
}

export interface Category {
  id: string
  user_id?: string
  name: string
  type: "income" | "expense"
  parent_category_id?: string
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
  direction: "deposit" | "withdrawal"
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

// Local Storage Fallback Keys
const STORAGE_ACCOUNTS_KEY = "spendly_accounts"
const STORAGE_TRANSACTIONS_KEY = "spendly_transactions"
const STORAGE_CATEGORIES_KEY = "spendly_categories"
const STORAGE_HELD_FUNDS_KEY = "spendly_held_funds"
const STORAGE_HELD_HISTORY_KEY = "spendly_held_fund_history"
const STORAGE_BILLS_KEY = "spendly_bills"

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

// Helper: Ensure system category exists in Supabase
async function ensureSystemCategory(userId: string, categoryName: string, type: "income" | "expense" = "expense"): Promise<string | undefined> {
  if (!isSupabaseConfigured || !supabase || !userId) return undefined
  try {
    const { data: existing } = await supabase
      .from("categories")
      .select("id")
      .eq("user_id", userId)
      .ilike("name", categoryName)
      .maybeSingle()

    if (existing?.id) return String(existing.id)

    const { data: created, error } = await supabase
      .from("categories")
      .insert({
        user_id: userId,
        name: categoryName,
        type,
        currency: "EGP",
      })
      .select("id")
      .single()

    if (!error && created?.id) return String(created.id)
  } catch (err) {
    console.warn(`Error ensuring category ${categoryName}:`, err)
  }
  return undefined
}

function useFinanceDataInternal() {
  const [accounts, setAccounts] = useState<Account[]>(() => getLocal<Account>(STORAGE_ACCOUNTS_KEY))
  const [transactions, setTransactions] = useState<Transaction[]>(() => getLocal<Transaction>(STORAGE_TRANSACTIONS_KEY))
  const [categories, setCategories] = useState<Category[]>(() => getLocal<Category>(STORAGE_CATEGORIES_KEY))
  const [heldFunds, setHeldFunds] = useState<HeldFund[]>(() => getLocal<HeldFund>(STORAGE_HELD_FUNDS_KEY))
  const [bills, setBills] = useState<Bill[]>(() => getLocal<Bill>(STORAGE_BILLS_KEY))
  const [loading, setLoading] = useState(true)

  const fetchData = useCallback(async () => {
    if (isSupabaseConfigured && supabase) {
      try {
        const userId = await resolveCurrentUserId()
        if (userId) {
          const [accRes, txRes, catRes, hfRes, billRes] = await Promise.all([
            supabase.from("accounts").select("*").eq("user_id", userId).order("created_at", { ascending: true }),
            supabase.from("transactions").select("*").eq("user_id", userId).order("date", { ascending: false }),
            supabase.from("categories").select("*").eq("user_id", userId).order("name", { ascending: true }),
            supabase.from("held_funds").select("*").eq("user_id", userId).order("created_at", { ascending: true }),
            supabase.from("bills").select("*").eq("user_id", userId).order("due_date", { ascending: true }),
          ])

          const dbAccounts = accRes.data || []
          const dbTransactions = txRes.data || []
          const dbCategories = catRes.data || []
          const dbHeldFunds = hfRes.data || []
          const dbBills = billRes.data || []

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
              is_fee: isFee,
              note: t.note,
              description: t.note || (isFee ? "Fee" : "Transaction"),
              date: t.date || (t.created_at ? new Date(t.created_at).toISOString().split("T")[0] : "Recent"),
              created_at: t.created_at,
              account_name: accountObj?.name || "Account",
              category_name: catObj?.name || (isFee ? "Fees" : "General"),
            }
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

          const parsedCategories: Category[] = dbCategories.map((c: any) => {
            const catSpent = parsedTransactions
              .filter((t) => t.category_id === String(c.id) && t.type === "expense")
              .reduce((sum, t) => sum + Math.abs(t.amount), 0)

            return {
              id: String(c.id),
              user_id: c.user_id,
              name: c.name,
              type: c.type || "expense",
              parent_category_id: c.parent_category_id ? String(c.parent_category_id) : undefined,
              currency: c.currency || "EGP",
              total_spent: catSpent,
              created_at: c.created_at,
            }
          })

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

          setAccounts(parsedAccounts)
          setTransactions(parsedTransactions)
          setCategories(parsedCategories)
          setHeldFunds(parsedHeldFunds)
          setBills(parsedBills)

          saveLocal(STORAGE_ACCOUNTS_KEY, parsedAccounts)
          saveLocal(STORAGE_TRANSACTIONS_KEY, parsedTransactions)
          saveLocal(STORAGE_CATEGORIES_KEY, parsedCategories)
          saveLocal(STORAGE_HELD_FUNDS_KEY, parsedHeldFunds)
          saveLocal(STORAGE_BILLS_KEY, parsedBills)

          setLoading(false)
          return
        }
      } catch (err) {
        console.warn("Supabase finance data fetch error:", err)
      }
    }

    // Local storage fallback
    setAccounts(getLocal<Account>(STORAGE_ACCOUNTS_KEY))
    setTransactions(getLocal<Transaction>(STORAGE_TRANSACTIONS_KEY))
    setCategories(getLocal<Category>(STORAGE_CATEGORIES_KEY))
    setHeldFunds(getLocal<HeldFund>(STORAGE_HELD_FUNDS_KEY))
    setBills(getLocal<Bill>(STORAGE_BILLS_KEY))
    setLoading(false)
  }, [])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  // ─────────────────────────────────────────────────────────────────
  // ACCOUNTS CRUD
  // ─────────────────────────────────────────────────────────────────

  const createAccount = useCallback(async (accountData: { name: string; type: string; starting_balance: number; currency?: string }) => {
    const startingCents = Math.round((accountData.starting_balance || 0) * 100)
    const currency = accountData.currency || "EGP"

    if (isSupabaseConfigured && supabase) {
      const userId = await resolveCurrentUserId()
      if (!userId) throw new Error("User authentication required.")

      const { data, error } = await supabase
        .from("accounts")
        .insert({
          user_id: userId,
          name: accountData.name.trim(),
          type: accountData.type || "checking",
          starting_balance_cents: startingCents,
          currency,
        })
        .select()
        .single()

      if (error) throw new Error(error.message || "Failed to create account.")
      await fetchData()
      return data
    } else {
      const newAcc: Account = {
        id: "acc_" + Date.now(),
        name: accountData.name,
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
    }
  }, [fetchData])

  const deleteAccount = useCallback(async (accountId: string) => {
    if (isSupabaseConfigured && supabase) {
      const userId = await resolveCurrentUserId()
      if (!userId) throw new Error("User authentication required.")
      const { error } = await supabase.from("accounts").delete().eq("id", accountId).eq("user_id", userId)
      if (error) throw new Error(error.message || "Failed to delete account.")
      await fetchData()
    } else {
      setAccounts((prev) => {
        const updated = prev.filter((a) => a.id !== accountId)
        saveLocal(STORAGE_ACCOUNTS_KEY, updated)
        return updated
      })
    }
  }, [fetchData])

  // ─────────────────────────────────────────────────────────────────
  // CATEGORIES CRUD
  // ─────────────────────────────────────────────────────────────────

  const createCategory = useCallback(async (catData: { name: string; type: "income" | "expense"; currency?: string }) => {
    const currency = catData.currency || "EGP"
    if (isSupabaseConfigured && supabase) {
      const userId = await resolveCurrentUserId()
      if (!userId) throw new Error("User authentication required.")
      const { data, error } = await supabase
        .from("categories")
        .insert({
          user_id: userId,
          name: catData.name.trim(),
          type: catData.type,
          currency,
        })
        .select()
        .single()
      if (error) throw new Error(error.message || "Failed to create category.")
      await fetchData()
      return data
    } else {
      const newCat: Category = {
        id: "cat_" + Date.now(),
        name: catData.name,
        type: catData.type,
        currency,
        total_spent: 0,
        created_at: new Date().toISOString(),
      }
      setCategories((prev) => {
        const updated = [...prev, newCat]
        saveLocal(STORAGE_CATEGORIES_KEY, updated)
        return updated
      })
      return newCat
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

      let resolvedCategoryId: string | null = txData.category_id || null
      if (!resolvedCategoryId && txData.category_name?.trim()) {
        resolvedCategoryId = await ensureSystemCategory(userId, txData.category_name.trim(), txData.type === "income" ? "income" : "expense") || null
      }

      // Generate a fee_pair_id if fee exists so original + fee are linked
      const feePairId = feeCents > 0 ? (typeof crypto !== "undefined" && crypto.randomUUID ? crypto.randomUUID() : "fee_" + Date.now()) : undefined

      const rowsToInsert: any[] = []

      if (txData.type === "transfer") {
        const transferPairId = typeof crypto !== "undefined" && crypto.randomUUID ? crypto.randomUUID() : "tp_" + Date.now()
        const outNote = noteText ? `Transfer to ${destAcc?.name || "Account"}: ${noteText}` : `Transfer to ${destAcc?.name || "Account"}`
        const inNote = noteText ? `Transfer from ${srcAcc?.name || "Account"}: ${noteText}` : `Transfer from ${srcAcc?.name || "Account"}`

        rowsToInsert.push(
          {
            user_id: userId,
            account_id: txData.account_id,
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
            account_id: txData.destination_account_id,
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
          account_id: txData.account_id,
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
          account_id: txData.account_id,
          category_id: feeCategoryId || null,
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
      const feePairId = feeCents > 0 ? "fee_local_" + Date.now() : undefined
      const newTxs: Transaction[] = []

      if (txData.type === "transfer") {
        const tpId = "tp_local_" + Date.now()
        newTxs.push(
          {
            id: "tx_" + Date.now(),
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
            id: "tx_" + Date.now() + 1,
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
          id: "tx_" + Date.now(),
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
          id: "tx_fee_" + Date.now() + 2,
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
      const { data: currentTx, error: fetchErr } = await supabase
        .from("transactions")
        .select("*")
        .eq("id", transactionId)
        .eq("user_id", userId)
        .single()

      if (fetchErr || !currentTx) throw new Error("Transaction not found or access denied.")

      // Update primary row
      const { error: updateErr } = await supabase
        .from("transactions")
        .update({
          account_id: updateData.account_id,
          category_id: updateData.category_id || null,
          amount_cents: amountCents,
          type: updateData.type,
          note: updateData.note.trim(),
          date: dateStr,
        })
        .eq("id", transactionId)
        .eq("user_id", userId)

      if (updateErr) throw new Error(updateErr.message || "Failed to update transaction.")

      // If there is a linked fee transaction and fee update was provided
      if (currentTx.fee_pair_id && typeof updateData.linked_fee_amount === "number") {
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

      const { data: newHf, error } = await supabase
        .from("held_funds")
        .insert({
          user_id: userId,
          account_id: data.account_id,
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
          held_fund_id: newHf.id,
          user_id: userId,
          amount_cents: initCents,
          direction: "deposit",
          note: "Initial allocation",
          date: new Date().toISOString().split("T")[0],
        })

        const hfCatId = await ensureSystemCategory(userId, "Held Funds", "expense")
        await supabase.from("transactions").insert({
          user_id: userId,
          account_id: data.account_id,
          category_id: hfCatId || null,
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
        id: "hf_" + Date.now(),
        account_id: data.account_id,
        name: data.name,
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
  }, [fetchData])

  const deleteHeldFund = useCallback(async (heldFundId: string) => {
    if (isSupabaseConfigured && supabase) {
      const userId = await resolveCurrentUserId()
      if (!userId) throw new Error("User authentication required.")

      // Delete history first then held fund
      await supabase.from("held_fund_history").delete().eq("held_fund_id", heldFundId).eq("user_id", userId)
      const { error } = await supabase.from("held_funds").delete().eq("id", heldFundId).eq("user_id", userId)
      if (error) throw new Error(error.message || "Failed to delete held fund.")
      await fetchData()
    } else {
      setHeldFunds((prev) => {
        const updated = prev.filter((h) => h.id !== heldFundId)
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

    if (isSupabaseConfigured && supabase) {
      const userId = await resolveCurrentUserId()
      if (!userId) throw new Error("User authentication required.")

      // 1. Insert into history
      const { error: histErr } = await supabase.from("held_fund_history").insert({
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
      const hfCatId = await ensureSystemCategory(userId, "Held Funds", "expense")
      const { error: txErr } = await supabase.from("transactions").insert({
        user_id: userId,
        account_id: fund.account_id,
        category_id: hfCatId || null,
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
  }, [heldFunds, fetchData])

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

    if (isSupabaseConfigured && supabase) {
      const userId = await resolveCurrentUserId()
      if (!userId) throw new Error("User authentication required.")

      // 1. Insert into history
      const { error: histErr } = await supabase.from("held_fund_history").insert({
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
      const hfCatId = await ensureSystemCategory(userId, "Held Funds", "income")
      const { error: txErr } = await supabase.from("transactions").insert({
        user_id: userId,
        account_id: fund.account_id,
        category_id: hfCatId || null,
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
  }, [heldFunds, fetchData])

  const fetchHeldFundHistory = useCallback(async (heldFundId: string): Promise<HeldFundHistory[]> => {
    if (isSupabaseConfigured && supabase) {
      const userId = await resolveCurrentUserId()
      if (!userId) return []
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

      const { data, error } = await supabase
        .from("bills")
        .insert({
          user_id: userId,
          name: billData.name.trim(),
          type: billData.type,
          account_id: billData.account_id,
          destination_account_id: billData.type === "transfer" ? billData.destination_account_id : null,
          category_id: billData.category_id || null,
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
        id: "bill_" + Date.now(),
        name: billData.name,
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
  }, [fetchData])

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

        await supabase.from("bills").insert({
          user_id: userId,
          name: bill.name,
          type: bill.type,
          account_id: bill.account_id,
          destination_account_id: bill.destination_account_id || null,
          category_id: bill.category_id || null,
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

  // ─────────────────────────────────────────────────────────────────
  // DASHBOARD CALCULATIONS
  // ─────────────────────────────────────────────────────────────────

  const netWorth = useMemo(() => {
    return accounts.reduce((sum, a) => sum + (Number(a.balance) || 0), 0)
  }, [accounts])

  const totalIncome = useMemo(() => {
    return transactions
      .filter((t) => t.type === "income" && !t.is_fee)
      .reduce((sum, t) => sum + t.amount, 0)
  }, [transactions])

  const totalExpense = useMemo(() => {
    return transactions
      .filter((t) => t.type === "expense")
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
    loading,
    netWorth,
    totalIncome,
    totalExpense,
    monthSparklineData,
    createAccount,
    deleteAccount,
    createCategory,
    createTransaction,
    updateTransaction,
    deleteTransaction,
    createHeldFund,
    deleteHeldFund,
    depositToHeldFund,
    withdrawFromHeldFund,
    fetchHeldFundHistory,
    createBill,
    deleteBill,
    markBillAsPaid,
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
