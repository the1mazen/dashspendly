"use client"

import { useState, useEffect, useCallback, useMemo } from "react"
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

const STORAGE_ACCOUNTS_KEY = "spendly_accounts"
const STORAGE_TRANSACTIONS_KEY = "spendly_transactions"
const STORAGE_CATEGORIES_KEY = "spendly_categories"
const FINANCE_UPDATED_EVENT = "spendly_finance_updated"

export function getLocalAccounts(): Account[] {
  if (typeof window === "undefined") return []
  try {
    const raw = localStorage.getItem(STORAGE_ACCOUNTS_KEY)
    if (raw) return JSON.parse(raw)
  } catch {
    // Ignore JSON errors
  }
  return []
}

export function saveLocalAccounts(accounts: Account[]): Account[] {
  if (typeof window === "undefined") return accounts
  try {
    localStorage.setItem(STORAGE_ACCOUNTS_KEY, JSON.stringify(accounts))
    window.dispatchEvent(new CustomEvent(FINANCE_UPDATED_EVENT))
  } catch {
    // Ignore write errors
  }
  return accounts
}

export function getLocalTransactions(): Transaction[] {
  if (typeof window === "undefined") return []
  try {
    const raw = localStorage.getItem(STORAGE_TRANSACTIONS_KEY)
    if (raw) return JSON.parse(raw)
  } catch {
    // Ignore JSON errors
  }
  return []
}

export function saveLocalTransactions(transactions: Transaction[]): Transaction[] {
  if (typeof window === "undefined") return transactions
  try {
    localStorage.setItem(STORAGE_TRANSACTIONS_KEY, JSON.stringify(transactions))
    window.dispatchEvent(new CustomEvent(FINANCE_UPDATED_EVENT))
  } catch {
    // Ignore write errors
  }
  return transactions
}

export function getLocalCategories(): Category[] {
  if (typeof window === "undefined") return []
  try {
    const raw = localStorage.getItem(STORAGE_CATEGORIES_KEY)
    if (raw) return JSON.parse(raw)
  } catch {
    // Ignore JSON errors
  }
  return []
}

export function saveLocalCategories(categories: Category[]): Category[] {
  if (typeof window === "undefined") return categories
  try {
    localStorage.setItem(STORAGE_CATEGORIES_KEY, JSON.stringify(categories))
    window.dispatchEvent(new CustomEvent(FINANCE_UPDATED_EVENT))
  } catch {
    // Ignore write errors
  }
  return categories
}

export function useFinanceData() {
  const [accounts, setAccounts] = useState<Account[]>(() => getLocalAccounts())
  const [transactions, setTransactions] = useState<Transaction[]>(() => getLocalTransactions())
  const [categories, setCategories] = useState<Category[]>(() => getLocalCategories())
  const [loading, setLoading] = useState(true)

  const fetchData = useCallback(async () => {
    // 1. Try fetching from Supabase if configured
    if (isSupabaseConfigured && supabase) {
      try {
        const userId = await resolveCurrentUserId()

        // Fetch accounts
        let query = supabase.from("accounts").select("*").order("created_at", { ascending: true })
        if (userId) {
          query = query.eq("user_id", userId)
        }
        const { data: dbAccounts, error: accError } = await query

        // Fetch transactions
        let txQuery = supabase.from("transactions").select("*").order("date", { ascending: false })
        if (userId) {
          txQuery = txQuery.eq("user_id", userId)
        }
        const { data: dbTransactions } = await txQuery

        // Fetch categories
        let catQuery = supabase.from("categories").select("*").order("created_at", { ascending: true })
        if (userId) {
          catQuery = catQuery.eq("user_id", userId)
        }
        const { data: dbCategories } = await catQuery

        if (!accError && dbAccounts && dbAccounts.length > 0) {
          const parsedTransactions: Transaction[] = (dbTransactions || []).map((t: any) => {
            const amountCents = t.amount_cents ?? 0
            const amount = amountCents / 100
            const accountObj = dbAccounts?.find((a: any) => a.id === t.account_id)
            const catObj = dbCategories?.find((c: any) => c.id === t.category_id)
            return {
              id: String(t.id),
              user_id: t.user_id,
              account_id: String(t.account_id),
              category_id: t.category_id ? String(t.category_id) : undefined,
              amount_cents: amountCents,
              amount,
              type: t.type === "expense" ? "expense" : "income",
              transfer_pair_id: t.transfer_pair_id ? String(t.transfer_pair_id) : undefined,
              note: t.note,
              description: t.note || t.description || "Transaction",
              date: t.date || (t.created_at ? new Date(t.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : "Recent"),
              created_at: t.created_at,
              account_name: accountObj?.name || "Account",
              category_name: catObj?.name || "General",
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
              type: a.type || "bank",
              starting_balance_cents: startCents,
              balance: currentBalance,
              currency: a.currency || "USD",
              created_at: a.created_at,
            }
          })

          const parsedCategories: Category[] = (dbCategories || []).map((c: any) => {
            const catSpent = parsedTransactions
              .filter((t) => t.category_id === String(c.id) && t.type === "expense")
              .reduce((sum, t) => sum + Math.abs(t.amount), 0)

            return {
              id: String(c.id),
              user_id: c.user_id,
              name: c.name,
              type: c.type || "expense",
              parent_category_id: c.parent_category_id ? String(c.parent_category_id) : undefined,
              currency: c.currency || "USD",
              total_spent: catSpent,
              created_at: c.created_at,
            }
          })

          setAccounts(parsedAccounts)
          setTransactions(parsedTransactions)
          setCategories(parsedCategories)

          saveLocalAccounts(parsedAccounts)
          saveLocalTransactions(parsedTransactions)
          saveLocalCategories(parsedCategories)
          setLoading(false)
          return
        }
      } catch (err) {
        console.warn("Supabase finance data fetch error:", err)
      }
    }

    // 2. Fall back to local storage
    const localAcc = getLocalAccounts()
    const localTx = getLocalTransactions()
    const localCat = getLocalCategories()
    setAccounts(localAcc)
    setTransactions(localTx)
    setCategories(localCat)
    setLoading(false)
  }, [])

  useEffect(() => {
    fetchData()

    const handleSync = () => {
      fetchData()
    }

    window.addEventListener(FINANCE_UPDATED_EVENT, handleSync)
    window.addEventListener("storage", handleSync)

    return () => {
      window.removeEventListener(FINANCE_UPDATED_EVENT, handleSync)
      window.removeEventListener("storage", handleSync)
    }
  }, [fetchData])

  const createAccount = useCallback(async (accountData: { name: string; type: string; starting_balance: number; currency?: string }) => {
    const startingCents = Math.round((accountData.starting_balance || 0) * 100)
    const currency = accountData.currency || "USD"
    let newAccount: Account = {
      id: "acc_" + Date.now() + "_" + Math.random().toString(36).substr(2, 4),
      name: accountData.name,
      type: accountData.type || "bank",
      starting_balance_cents: startingCents,
      balance: accountData.starting_balance || 0,
      currency,
      created_at: new Date().toISOString(),
    }

    if (isSupabaseConfigured && supabase) {
      try {
        const userId = await resolveCurrentUserId()
        if (userId) {
          const { data, error } = await supabase
            .from("accounts")
            .insert({
              user_id: userId,
              name: accountData.name,
              type: accountData.type || "bank",
              starting_balance_cents: startingCents,
              currency,
            })
            .select()
            .single()

          if (error) {
            console.error("Supabase createAccount error:", error)
          } else if (data) {
            newAccount = {
              id: String(data.id),
              user_id: data.user_id,
              name: data.name,
              type: data.type,
              starting_balance_cents: data.starting_balance_cents ?? startingCents,
              balance: (data.starting_balance_cents ?? startingCents) / 100,
              currency: data.currency,
              created_at: data.created_at,
            }
          }
        }
      } catch (err) {
        console.warn("Error creating account in Supabase:", err)
      }
    }

    setAccounts((prev) => {
      const updated = [...prev, newAccount]
      saveLocalAccounts(updated)
      return updated
    })
    return newAccount
  }, [])

  const deleteAccount = useCallback(async (accountId: string) => {
    if (isSupabaseConfigured && supabase) {
      try {
        await supabase.from("accounts").delete().eq("id", accountId)
      } catch (err) {
        console.warn("Error deleting account in Supabase:", err)
      }
    }

    setAccounts((prev) => {
      const updated = prev.filter((a) => a.id !== accountId)
      saveLocalAccounts(updated)
      return updated
    })
  }, [])

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
  }) => {
    if (!txData.account_id) {
      throw new Error("Please select an account.")
    }
    if (isNaN(txData.amount) || txData.amount <= 0) {
      throw new Error("Please enter a valid amount greater than 0.")
    }
    if (txData.type === "transfer" && (!txData.destination_account_id || txData.destination_account_id === txData.account_id)) {
      throw new Error("Please select a different destination account for the transfer.")
    }

    const amountCents = Math.round(Math.abs(txData.amount) * 100)
    const dateStr = txData.date || new Date().toISOString().split("T")[0]
    const noteText = txData.note?.trim() || txData.description?.trim() || ""

    const srcAcc = accounts.find((a) => a.id === txData.account_id)
    const destAcc = txData.destination_account_id ? accounts.find((a) => a.id === txData.destination_account_id) : null

    const createdTxs: Transaction[] = []

    if (isSupabaseConfigured && supabase) {
      const userId = await resolveCurrentUserId()
      if (!userId) {
        throw new Error("User session not found. Please log in again.")
      }

      // Handle free text category if provided
      let resolvedCategoryId: string | null = txData.category_id || null
      if (!resolvedCategoryId && txData.category_name?.trim()) {
        const catName = txData.category_name.trim()
        const existingCat = categories.find((c) => c.name.toLowerCase() === catName.toLowerCase())
        if (existingCat) {
          resolvedCategoryId = existingCat.id
        } else {
          try {
            const { data: newCatData } = await supabase
              .from("categories")
              .insert({
                user_id: userId,
                name: catName,
                type: txData.type === "income" ? "income" : "expense",
                currency: srcAcc?.currency || "USD",
              })
              .select()
              .single()

            if (newCatData) {
              resolvedCategoryId = String(newCatData.id)
            }
          } catch {
            // Ignore category creation failure and continue
          }
        }
      }

      if (txData.type === "transfer") {
        const transferPairId = typeof crypto !== "undefined" && crypto.randomUUID
          ? crypto.randomUUID()
          : "tp_" + Date.now() + "_" + Math.random().toString(36).substr(2, 9)

        // 1. Outgoing transfer row (source account)
        const outgoingNote = noteText ? `Transfer to ${destAcc?.name || "Account"}: ${noteText}` : `Transfer to ${destAcc?.name || "Account"}`
        const { data: outData, error: outError } = await supabase
          .from("transactions")
          .insert({
            user_id: userId,
            account_id: txData.account_id,
            category_id: resolvedCategoryId,
            amount_cents: amountCents,
            type: "expense",
            transfer_pair_id: transferPairId,
            note: outgoingNote,
            date: dateStr,
          })
          .select()
          .single()

        if (outError) {
          throw new Error(outError.message || "Failed to create outgoing transfer.")
        }

        // 2. Incoming transfer row (destination account)
        const incomingNote = noteText ? `Transfer from ${srcAcc?.name || "Account"}: ${noteText}` : `Transfer from ${srcAcc?.name || "Account"}`
        const { data: inData, error: inError } = await supabase
          .from("transactions")
          .insert({
            user_id: userId,
            account_id: txData.destination_account_id,
            category_id: resolvedCategoryId,
            amount_cents: amountCents,
            type: "income",
            transfer_pair_id: transferPairId,
            note: incomingNote,
            date: dateStr,
          })
          .select()
          .single()

        if (inError) {
          throw new Error(inError.message || "Failed to create incoming transfer.")
        }

        if (outData) {
          createdTxs.push({
            id: String(outData.id),
            user_id: outData.user_id,
            account_id: String(outData.account_id),
            category_id: outData.category_id ? String(outData.category_id) : undefined,
            amount_cents: outData.amount_cents,
            amount: outData.amount_cents / 100,
            type: "expense",
            transfer_pair_id: outData.transfer_pair_id,
            note: outData.note,
            description: outData.note,
            date: outData.date,
            created_at: outData.created_at,
            account_name: srcAcc?.name || "Source Account",
          })
        }

        if (inData) {
          createdTxs.push({
            id: String(inData.id),
            user_id: inData.user_id,
            account_id: String(inData.account_id),
            category_id: inData.category_id ? String(inData.category_id) : undefined,
            amount_cents: inData.amount_cents,
            amount: inData.amount_cents / 100,
            type: "income",
            transfer_pair_id: inData.transfer_pair_id,
            note: inData.note,
            description: inData.note,
            date: inData.date,
            created_at: inData.created_at,
            account_name: destAcc?.name || "Destination Account",
          })
        }
      } else {
        // Standard Income or Expense
        const defaultDesc = noteText || (txData.type === "income" ? "Income" : "Expense")
        const { data, error } = await supabase
          .from("transactions")
          .insert({
            user_id: userId,
            account_id: txData.account_id,
            category_id: resolvedCategoryId,
            amount_cents: amountCents,
            type: txData.type,
            note: defaultDesc,
            date: dateStr,
          })
          .select()
          .single()

        if (error) {
          throw new Error(error.message || "Failed to insert transaction.")
        }

        if (data) {
          const catObj = categories.find((c) => c.id === data.category_id)
          createdTxs.push({
            id: String(data.id),
            user_id: data.user_id,
            account_id: String(data.account_id),
            category_id: data.category_id ? String(data.category_id) : undefined,
            amount_cents: data.amount_cents,
            amount: data.amount_cents / 100,
            type: data.type === "expense" ? "expense" : "income",
            note: data.note,
            description: data.note,
            date: data.date,
            created_at: data.created_at,
            account_name: srcAcc?.name || "Account",
            category_name: catObj?.name || txData.category_name || "General",
          })
        }
      }
    } else {
      // Local fallback
      if (txData.type === "transfer") {
        const transferPairId = "tp_local_" + Date.now()
        createdTxs.push({
          id: "tx_out_" + Date.now(),
          account_id: txData.account_id,
          amount_cents: amountCents,
          amount: txData.amount,
          type: "expense",
          transfer_pair_id: transferPairId,
          note: `Transfer to ${destAcc?.name || "Account"}`,
          description: `Transfer to ${destAcc?.name || "Account"}`,
          date: dateStr,
          created_at: new Date().toISOString(),
          account_name: srcAcc?.name,
        })
        createdTxs.push({
          id: "tx_in_" + Date.now() + 1,
          account_id: txData.destination_account_id!,
          amount_cents: amountCents,
          amount: txData.amount,
          type: "income",
          transfer_pair_id: transferPairId,
          note: `Transfer from ${srcAcc?.name || "Account"}`,
          description: `Transfer from ${srcAcc?.name || "Account"}`,
          date: dateStr,
          created_at: new Date().toISOString(),
          account_name: destAcc?.name,
        })
      } else {
        createdTxs.push({
          id: "tx_local_" + Date.now(),
          account_id: txData.account_id,
          category_id: txData.category_id,
          amount_cents: amountCents,
          amount: txData.amount,
          type: txData.type,
          note: noteText || (txData.type === "income" ? "Income" : "Expense"),
          description: noteText || (txData.type === "income" ? "Income" : "Expense"),
          date: dateStr,
          created_at: new Date().toISOString(),
          account_name: srcAcc?.name,
          category_name: txData.category_name || "General",
        })
      }
    }

    if (createdTxs.length > 0) {
      setTransactions((prev) => {
        const updated = [...createdTxs, ...prev]
        saveLocalTransactions(updated)
        return updated
      })
    }

    await fetchData()
    return createdTxs[0]
  }, [accounts, categories, fetchData])

  const createCategory = useCallback(async (catData: { name: string; type: "income" | "expense"; currency?: string }) => {
    const currency = catData.currency || "USD"
    let newCat: Category = {
      id: "cat_" + Date.now() + "_" + Math.random().toString(36).substr(2, 4),
      name: catData.name,
      type: catData.type,
      currency,
      total_spent: 0,
      created_at: new Date().toISOString(),
    }

    if (isSupabaseConfigured && supabase) {
      try {
        const userId = await resolveCurrentUserId()
        if (userId) {
          const { data, error } = await supabase
            .from("categories")
            .insert({
              user_id: userId,
              name: catData.name,
              type: catData.type,
              currency,
            })
            .select()
            .single()

          if (!error && data) {
            newCat = {
              id: String(data.id),
              user_id: data.user_id,
              name: data.name,
              type: data.type,
              currency: data.currency,
              total_spent: 0,
              created_at: data.created_at,
            }
          }
        }
      } catch (err) {
        console.warn("Error creating category in Supabase:", err)
      }
    }

    setCategories((prev) => {
      const updated = [...prev, newCat]
      saveLocalCategories(updated)
      return updated
    })
    return newCat
  }, [fetchData])

  const netWorth = useMemo(() => {
    return accounts.reduce((sum, a) => sum + (Number(a.balance) || 0), 0)
  }, [accounts])

  const totalIncome = useMemo(() => {
    return transactions
      .filter((t) => t.type === "income")
      .reduce((sum, t) => sum + t.amount, 0)
  }, [transactions])

  const totalExpense = useMemo(() => {
    return transactions
      .filter((t) => t.type === "expense")
      .reduce((sum, t) => sum + t.amount, 0)
  }, [transactions])

  return {
    accounts,
    transactions,
    categories,
    loading,
    netWorth,
    totalIncome,
    totalExpense,
    createAccount,
    deleteAccount,
    createTransaction,
    createCategory,
    refreshFinanceData: fetchData,
  }
}
