"use client"

import { useState, useEffect, useCallback, useMemo } from "react"
import { supabase, isSupabaseConfigured } from "./supabase"

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
  const [accounts, setAccounts] = useState<Account[]>([])
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)

  const fetchData = useCallback(async () => {
    // 1. Try fetching from Supabase if configured and user is authenticated
    if (isSupabaseConfigured && supabase) {
      try {
        const { data: { user } } = await supabase.auth.getUser()
        if (user) {
          // Fetch accounts
          const { data: dbAccounts } = await supabase
            .from("accounts")
            .select("*")
            .eq("user_id", user.id)
            .order("created_at", { ascending: true })

          // Fetch transactions
          const { data: dbTransactions } = await supabase
            .from("transactions")
            .select("*")
            .eq("user_id", user.id)
            .order("date", { ascending: false })

          // Fetch categories
          const { data: dbCategories } = await supabase
            .from("categories")
            .select("*")
            .eq("user_id", user.id)
            .order("created_at", { ascending: true })

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

          const parsedAccounts: Account[] = (dbAccounts || []).map((a: any) => {
            const startCents = a.starting_balance_cents ?? 0
            // calculate current balance based on transactions for this account
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
        const { data: { user } } = await supabase.auth.getUser()
        if (user) {
          const { data, error } = await supabase
            .from("accounts")
            .insert({
              user_id: user.id,
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
    category_id?: string
    amount: number
    type: "income" | "expense"
    description: string
    date?: string
    note?: string
  }) => {
    const amountCents = Math.round(Math.abs(txData.amount) * 100)
    const dateStr = txData.date || new Date().toISOString().split("T")[0]
    let newTx: Transaction = {
      id: "tx_" + Date.now() + "_" + Math.random().toString(36).substr(2, 4),
      account_id: txData.account_id,
      category_id: txData.category_id,
      amount_cents: amountCents,
      amount: Math.abs(txData.amount),
      type: txData.type,
      description: txData.description,
      note: txData.note,
      date: dateStr,
      created_at: new Date().toISOString(),
    }

    if (isSupabaseConfigured && supabase) {
      try {
        const { data: { user } } = await supabase.auth.getUser()
        if (user) {
          const { data, error } = await supabase
            .from("transactions")
            .insert({
              user_id: user.id,
              account_id: txData.account_id,
              category_id: txData.category_id || null,
              amount_cents: amountCents,
              type: txData.type,
              note: txData.description,
              date: dateStr,
            })
            .select()
            .single()

          if (!error && data) {
            newTx = {
              id: String(data.id),
              user_id: data.user_id,
              account_id: String(data.account_id),
              category_id: data.category_id ? String(data.category_id) : undefined,
              amount_cents: data.amount_cents,
              amount: data.amount_cents / 100,
              type: data.type === "expense" ? "expense" : "income",
              description: data.note || txData.description,
              date: data.date,
              created_at: data.created_at,
            }
          }
        }
      } catch (err) {
        console.warn("Error creating transaction in Supabase:", err)
      }
    }

    setTransactions((prev) => {
      const updated = [newTx, ...prev]
      saveLocalTransactions(updated)
      return updated
    })

    // Refresh accounts balance
    fetchData()
    return newTx
  }, [fetchData])

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
        const { data: { user } } = await supabase.auth.getUser()
        if (user) {
          const { data, error } = await supabase
            .from("categories")
            .insert({
              user_id: user.id,
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
  }, [])

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
