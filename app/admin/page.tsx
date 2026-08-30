"use client"

import React, { useState, useEffect, useCallback } from "react"
import { useRouter } from "next/navigation"
import { motion, AnimatePresence } from "framer-motion"
import {
  ShieldAlert,
  Users,
  CreditCard,
  Receipt,
  TrendingUp,
  TrendingDown,
  Search,
  Trash2,
  Ban,
  CheckCircle2,
  RefreshCw,
  ChevronDown,
  ChevronUp,
  ArrowLeft,
  DollarSign,
  AlertTriangle,
  Wallet,
} from "lucide-react"
import { useUserProfile } from "@/lib/user-profile"
import { supabase, isSupabaseConfigured } from "@/lib/supabase"
import { useDashboardTheme } from "@/components/cards/financial-analytics-dashboard"

interface AdminUser {
  id: string
  email: string
  fullName: string
  username: string
  created_at: string
  is_admin: boolean
  is_banned: boolean
  transactionCount: number
  accountCount: number
  billCount: number
  heldFundCount: number
  totalIncome: number
  totalExpenses: number
  netBalance: number
  accounts: Array<{
    id: string
    name: string
    type: string
    currency: string
    balance: number
  }>
}

interface AdminStats {
  totalUsers: number
  totalTransactions: number
  totalAccounts: number
  totalBills: number
  totalIncome: number
  totalExpenses: number
}

export default function AdminPage() {
  const router = useRouter()
  const { profile, loading: profileLoading } = useUserProfile()
  const { tokens, isDarkMode } = useDashboardTheme()

  const [loading, setLoading] = useState(true)
  const [authorized, setAuthorized] = useState(false)
  const [currentEmail, setCurrentEmail] = useState<string>("")
  const [unauthorizedReason, setUnauthorizedReason] = useState<string | null>(null)
  const [stats, setStats] = useState<AdminStats | null>(null)
  const [users, setUsers] = useState<AdminUser[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [expandedUserId, setExpandedUserId] = useState<string | null>(null)
  const [actionLoading, setActionLoading] = useState<string | null>(null)
  const [deleteConfirmUser, setDeleteConfirmUser] = useState<AdminUser | null>(null)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  const adminEmail = (process.env.ADMIN_EMAIL || "themazen21@gmail.com").trim().toLowerCase()

  const fetchAdminData = useCallback(async () => {
    setLoading(true)
    setErrorMsg(null)
    setUnauthorizedReason(null)

    try {
      if (!supabase) {
        setUnauthorizedReason("Supabase client is not configured.")
        setLoading(false)
        return
      }

      const { data: { session } } = await supabase.auth.getSession()
      const { data: { user } } = await supabase.auth.getUser()
      const email = (user?.email || profile?.email || "").trim().toLowerCase()
      setCurrentEmail(email)

      if (!session?.access_token || !user) {
        setUnauthorizedReason("You must be logged in with your administrator account to access this page.")
        setLoading(false)
        return
      }

      // Check client-side email & admin flag
      const isEmailAdmin = email === adminEmail
      const isProfileAdmin = Boolean(profile?.is_admin || user?.user_metadata?.is_admin)

      if (!isEmailAdmin && !isProfileAdmin) {
        setUnauthorizedReason(`Access restricted. Your account (${email || "Unknown"}) is not recognized as an administrator.`)
        setLoading(false)
        return
      }

      const res = await fetch("/api/admin", {
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      })

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}))
        setUnauthorizedReason(errorData.error || "Server rejected admin access token.")
        setLoading(false)
        return
      }

      const data = await res.json()
      setStats(data.stats)
      setUsers(data.users || [])
      setAuthorized(true)
    } catch (err: any) {
      console.error("Admin check error:", err)
      setUnauthorizedReason(err?.message || "Failed to verify admin permissions.")
    } finally {
      setLoading(false)
    }
  }, [adminEmail, profile])

  useEffect(() => {
    fetchAdminData()
  }, [fetchAdminData])

  const handleToggleBan = async (user: AdminUser) => {
    setActionLoading(user.id)
    try {
      if (!supabase) return
      const { data: { session } } = await supabase.auth.getSession()
      const nextBanned = !user.is_banned

      const res = await fetch("/api/admin", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session?.access_token}`,
        },
        body: JSON.stringify({
          action: "toggle_ban",
          targetUserId: user.id,
          isBanned: nextBanned,
        }),
      })

      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || "Failed to toggle ban.")
      }

      setUsers((prev) =>
        prev.map((u) => (u.id === user.id ? { ...u, is_banned: nextBanned } : u))
      )
    } catch (err: any) {
      alert(err.message || "Failed to update ban status.")
    } finally {
      setActionLoading(null)
    }
  }

  const handleDeleteUser = async (user: AdminUser) => {
    setActionLoading(user.id)
    try {
      if (!supabase) return
      const { data: { session } } = await supabase.auth.getSession()

      const res = await fetch("/api/admin", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session?.access_token}`,
        },
        body: JSON.stringify({
          action: "delete_user",
          targetUserId: user.id,
        }),
      })

      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || "Failed to delete user.")
      }

      setUsers((prev) => prev.filter((u) => u.id !== user.id))
      setDeleteConfirmUser(null)
    } catch (err: any) {
      alert(err.message || "Failed to delete user.")
    } finally {
      setActionLoading(null)
    }
  }

  const filteredUsers = users.filter((u) => {
    const q = searchQuery.toLowerCase().trim()
    if (!q) return true
    return (
      u.email.toLowerCase().includes(q) ||
      u.fullName.toLowerCase().includes(q) ||
      u.username.toLowerCase().includes(q) ||
      u.id.toLowerCase().includes(q)
    )
  })

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0d0716] text-white p-4">
        <div className="flex flex-col items-center gap-3">
          <RefreshCw className="size-8 animate-spin text-purple-400" />
          <p className="text-sm font-mono text-white/60">Verifying Administrator Permissions...</p>
        </div>
      </div>
    )
  }

  if (!authorized) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0d0716] text-white p-4">
        <div
          className="w-full max-w-md rounded-3xl p-6 sm:p-8 border shadow-2xl backdrop-blur-2xl text-center space-y-5"
          style={{
            background: "linear-gradient(135deg, rgba(45, 15, 85, 0.85) 0%, rgba(30, 94, 69, 0.75) 100%)",
            borderColor: "rgba(255, 255, 255, 0.15)",
            boxShadow: "0 20px 50px rgba(0, 0, 0, 0.5)",
          }}
        >
          <div className="size-14 rounded-2xl bg-amber-500/20 text-amber-300 border border-amber-500/30 flex items-center justify-center mx-auto shadow-lg">
            <ShieldAlert className="size-7" />
          </div>

          <div>
            <h2 className="text-xl font-bold font-display text-white">Administrator Access Restricted</h2>
            <p className="text-xs text-white/70 mt-2 leading-relaxed">
              {unauthorizedReason || "This page is strictly reserved for the system administrator."}
            </p>
          </div>

          <div className="p-3.5 rounded-2xl bg-black/30 border border-white/10 text-left space-y-1.5">
            <div className="flex items-center justify-between text-xs">
              <span className="text-white/50">Current Logged-in Account:</span>
              <span className="font-mono font-bold text-white truncate max-w-[180px]">{currentEmail || "Guest / None"}</span>
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="text-white/50">Required Admin Account:</span>
              <span className="font-mono font-bold text-[#A7F3D0]">{adminEmail}</span>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-3 pt-2">
            <button
              onClick={() => router.push("/dashboard")}
              className="w-full py-2.5 rounded-xl text-xs font-semibold bg-white/10 hover:bg-white/20 text-white cursor-pointer transition-all"
            >
              Back to Dashboard
            </button>
            <button
              onClick={() => router.push("/login?redirect=/admin")}
              className="w-full py-2.5 rounded-xl text-xs font-bold text-[#120824] shadow-lg cursor-pointer transition-all"
              style={{ background: "linear-gradient(90deg, #5EEAD4 0%, #A7F3D0 40%, #FEF08A 100%)" }}
            >
              Sign In as Admin
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div
      className="min-h-screen text-white p-4 sm:p-6 md:p-8 font-sans pb-28 md:pb-8"
      style={{
        backgroundColor: isDarkMode ? "#0d0716" : "#f5f3ff",
        color: isDarkMode ? "#ffffff" : "#1e1b4b",
      }}
    >
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <button
              onClick={() => router.push("/dashboard")}
              className="p-2 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 text-white cursor-pointer transition-all"
              title="Back to Dashboard"
            >
              <ArrowLeft className="size-5" />
            </button>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-bold font-display tracking-tight">Admin Console</h1>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono uppercase font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30 flex items-center gap-1">
                  <ShieldAlert className="size-3" /> Root Access
                </span>
              </div>
              <p className="text-xs text-white/60 mt-0.5">App-wide metrics, user administration, and security controls</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={fetchAdminData}
              className="px-3.5 py-2 rounded-xl text-xs font-semibold bg-white/10 hover:bg-white/20 border border-white/15 text-white flex items-center gap-2 cursor-pointer transition-all"
            >
              <RefreshCw className="size-3.5" /> Refresh Data
            </button>
          </div>
        </div>

        {/* Overview Stats Cards */}
        {stats && (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            <div
              className="p-4 rounded-2xl border backdrop-blur-xl"
              style={{ background: tokens.cardGradient, borderColor: tokens.border, boxShadow: tokens.cardShadow }}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-[11px] font-semibold text-white/60 uppercase">Users</span>
                <Users className="size-4 text-purple-400" />
              </div>
              <p className="text-xl font-bold font-mono text-white">{stats.totalUsers}</p>
              <span className="text-[10px] text-white/50">Registered total</span>
            </div>

            <div
              className="p-4 rounded-2xl border backdrop-blur-xl"
              style={{ background: tokens.cardGradient, borderColor: tokens.border, boxShadow: tokens.cardShadow }}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-[11px] font-semibold text-white/60 uppercase">Transactions</span>
                <TrendingUp className="size-4 text-cyan-400" />
              </div>
              <p className="text-xl font-bold font-mono text-white">{stats.totalTransactions}</p>
              <span className="text-[10px] text-white/50">Ledger entries</span>
            </div>

            <div
              className="p-4 rounded-2xl border backdrop-blur-xl"
              style={{ background: tokens.cardGradient, borderColor: tokens.border, boxShadow: tokens.cardShadow }}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-[11px] font-semibold text-white/60 uppercase">Accounts</span>
                <CreditCard className="size-4 text-indigo-400" />
              </div>
              <p className="text-xl font-bold font-mono text-white">{stats.totalAccounts}</p>
              <span className="text-[10px] text-white/50">User vaults</span>
            </div>

            <div
              className="p-4 rounded-2xl border backdrop-blur-xl"
              style={{ background: tokens.cardGradient, borderColor: tokens.border, boxShadow: tokens.cardShadow }}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-[11px] font-semibold text-white/60 uppercase">Bills</span>
                <Receipt className="size-4 text-amber-400" />
              </div>
              <p className="text-xl font-bold font-mono text-white">{stats.totalBills}</p>
              <span className="text-[10px] text-white/50">Tracked obligations</span>
            </div>

            <div
              className="p-4 rounded-2xl border backdrop-blur-xl"
              style={{ background: tokens.cardGradient, borderColor: tokens.border, boxShadow: tokens.cardShadow }}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-[11px] font-semibold text-emerald-400 uppercase">App Income</span>
                <TrendingUp className="size-4 text-emerald-400" />
              </div>
              <p className="text-lg font-bold font-mono text-emerald-300">
                EGP {stats.totalIncome.toLocaleString("en-US", { minimumFractionDigits: 0 })}
              </p>
              <span className="text-[10px] text-white/50">Cumulative in</span>
            </div>

            <div
              className="p-4 rounded-2xl border backdrop-blur-xl"
              style={{ background: tokens.cardGradient, borderColor: tokens.border, boxShadow: tokens.cardShadow }}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-[11px] font-semibold text-rose-400 uppercase">App Expense</span>
                <TrendingDown className="size-4 text-rose-400" />
              </div>
              <p className="text-lg font-bold font-mono text-rose-300">
                EGP {stats.totalExpenses.toLocaleString("en-US", { minimumFractionDigits: 0 })}
              </p>
              <span className="text-[10px] text-white/50">Cumulative out</span>
            </div>
          </div>
        )}

        {/* Users Management Section */}
        <div
          className="rounded-3xl p-5 sm:p-6 border backdrop-blur-xl space-y-4"
          style={{ background: tokens.cardGradient, borderColor: tokens.border, boxShadow: tokens.cardShadow }}
        >
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-bold font-display text-white">Registered Users ({filteredUsers.length})</h2>
              <p className="text-xs text-white/60">Inspect user accounts, balances, and manage access privileges</p>
            </div>

            {/* Search Input */}
            <div className="relative min-w-[260px]">
              <Search className="size-4 absolute left-3 top-1/2 -translate-y-1/2 text-white/40" />
              <input
                type="text"
                placeholder="Search by email, name, or ID..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3.5 py-2 border rounded-xl text-xs text-white placeholder:text-white/40 focus:outline-none"
                style={{ backgroundColor: tokens.nestedSurface, borderColor: tokens.borderNested }}
              />
            </div>
          </div>

          {/* Users Table / List */}
          <div className="space-y-3">
            {filteredUsers.length === 0 ? (
              <div className="p-8 text-center text-white/60 text-xs">No users matching search query.</div>
            ) : (
              filteredUsers.map((u) => {
                const isExpanded = expandedUserId === u.id
                return (
                  <div
                    key={u.id}
                    className="rounded-2xl border transition-all overflow-hidden"
                    style={{ backgroundColor: tokens.nestedSurface, borderColor: tokens.borderNested }}
                  >
                    {/* Row Header */}
                    <div className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div
                        onClick={() => setExpandedUserId(isExpanded ? null : u.id)}
                        className="flex items-center gap-3 cursor-pointer flex-1"
                      >
                        <div className="size-10 rounded-xl bg-purple-500/20 border border-purple-500/30 flex items-center justify-center font-bold text-sm text-purple-300">
                          {(u.fullName || u.email || "U")[0].toUpperCase()}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-bold text-white">{u.fullName}</span>
                            <span className="text-xs font-mono text-white/50">{u.username}</span>
                            {u.is_admin && (
                              <span className="px-2 py-0.5 rounded text-[9px] font-mono uppercase bg-purple-500/20 text-purple-300 border border-purple-500/30">
                                Admin
                              </span>
                            )}
                            {u.is_banned && (
                              <span className="px-2 py-0.5 rounded text-[9px] font-mono uppercase bg-red-500/20 text-red-300 border border-red-500/30">
                                Suspended
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-white/60 font-mono mt-0.5">{u.email}</p>
                        </div>
                      </div>

                      {/* Stat summary pills */}
                      <div className="flex items-center gap-2 sm:gap-4 text-xs font-mono text-white/70">
                        <div className="px-2.5 py-1 rounded-lg bg-white/5 border border-white/10 text-center">
                          <span className="block text-[10px] text-white/40 uppercase">Txns</span>
                          <span className="font-bold text-white">{u.transactionCount}</span>
                        </div>
                        <div className="px-2.5 py-1 rounded-lg bg-white/5 border border-white/10 text-center">
                          <span className="block text-[10px] text-white/40 uppercase">Accounts</span>
                          <span className="font-bold text-white">{u.accountCount}</span>
                        </div>

                        {/* Action buttons */}
                        <div className="flex items-center gap-1.5 pl-2 border-l border-white/10">
                          <button
                            onClick={() => handleToggleBan(u)}
                            disabled={actionLoading === u.id}
                            className={`p-2 rounded-xl border text-xs font-semibold cursor-pointer transition-all ${
                              u.is_banned
                                ? "bg-emerald-500/20 border-emerald-500/40 text-emerald-300 hover:bg-emerald-500/30"
                                : "bg-amber-500/20 border-amber-500/40 text-amber-300 hover:bg-amber-500/30"
                            }`}
                            title={u.is_banned ? "Lift Account Ban" : "Ban User"}
                          >
                            <Ban className="size-3.5" />
                          </button>

                          <button
                            onClick={() => setDeleteConfirmUser(u)}
                            disabled={actionLoading === u.id}
                            className="p-2 rounded-xl bg-red-500/20 border border-red-500/40 text-red-300 hover:bg-red-500/30 cursor-pointer transition-all"
                            title="Delete User Data"
                          >
                            <Trash2 className="size-3.5" />
                          </button>

                          <button
                            onClick={() => setExpandedUserId(isExpanded ? null : u.id)}
                            className="p-2 rounded-xl bg-white/5 border border-white/10 text-white/60 hover:text-white cursor-pointer transition-all"
                          >
                            {isExpanded ? <ChevronUp className="size-3.5" /> : <ChevronDown className="size-3.5" />}
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Expandable User Detail Panel */}
                    <AnimatePresence>
                      {isExpanded && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: "auto" }}
                          exit={{ opacity: 0, height: 0 }}
                          className="p-4 sm:p-5 border-t border-white/10 bg-black/20 space-y-4"
                        >
                          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                            <div className="p-3 rounded-xl bg-white/5 border border-white/10">
                              <span className="text-[10px] uppercase text-white/50 block">Total Income</span>
                              <span className="text-sm font-bold font-mono text-emerald-400">
                                EGP {u.totalIncome.toLocaleString("en-US", { minimumFractionDigits: 2 })}
                              </span>
                            </div>
                            <div className="p-3 rounded-xl bg-white/5 border border-white/10">
                              <span className="text-[10px] uppercase text-white/50 block">Total Expenses</span>
                              <span className="text-sm font-bold font-mono text-rose-400">
                                EGP {u.totalExpenses.toLocaleString("en-US", { minimumFractionDigits: 2 })}
                              </span>
                            </div>
                            <div className="p-3 rounded-xl bg-white/5 border border-white/10">
                              <span className="text-[10px] uppercase text-white/50 block">Net Balance</span>
                              <span className={`text-sm font-bold font-mono ${u.netBalance >= 0 ? "text-cyan-300" : "text-amber-300"}`}>
                                EGP {u.netBalance.toLocaleString("en-US", { minimumFractionDigits: 2 })}
                              </span>
                            </div>
                            <div className="p-3 rounded-xl bg-white/5 border border-white/10">
                              <span className="text-[10px] uppercase text-white/50 block">Obligations</span>
                              <span className="text-xs font-mono text-white/80">
                                {u.billCount} bills · {u.heldFundCount} held funds
                              </span>
                            </div>
                          </div>

                          {/* Accounts list */}
                          <div>
                            <h4 className="text-xs font-bold uppercase tracking-wider text-white/70 mb-2">User Accounts & Balances</h4>
                            {u.accounts.length === 0 ? (
                              <p className="text-xs text-white/50">No accounts created by this user.</p>
                            ) : (
                              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
                                {u.accounts.map((acc) => (
                                  <div
                                    key={acc.id}
                                    className="p-3 rounded-xl bg-white/5 border border-white/10 flex items-center justify-between"
                                  >
                                    <div className="flex items-center gap-2">
                                      <Wallet className="size-3.5 text-purple-400" />
                                      <div>
                                        <p className="text-xs font-bold text-white">{acc.name}</p>
                                        <span className="text-[10px] uppercase text-white/50">{acc.type}</span>
                                      </div>
                                    </div>
                                    <span className="text-xs font-bold font-mono text-white">
                                      {acc.currency} {acc.balance.toLocaleString("en-US", { minimumFractionDigits: 2 })}
                                    </span>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                )
              })
            )}
          </div>
        </div>
      </div>

      {/* Delete User Confirmation Modal */}
      <AnimatePresence>
        {deleteConfirmUser && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-md rounded-3xl p-6 border shadow-2xl backdrop-blur-2xl"
              style={{
                background: tokens.cardGradient,
                borderColor: tokens.border,
                boxShadow: tokens.cardShadow,
              }}
            >
              <div className="flex items-center gap-3 text-red-400 mb-3">
                <AlertTriangle className="size-6" />
                <h3 className="text-base font-bold font-display text-white">Confirm User Deletion</h3>
              </div>

              <p className="text-xs text-white/80 leading-relaxed mb-4">
                Are you sure you want to permanently delete user <strong className="text-white">{deleteConfirmUser.email}</strong>?
                This will hard-delete all their transactions, accounts, categories, bills, and held funds. This action cannot be undone.
              </p>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-white/10">
                <button
                  type="button"
                  onClick={() => setDeleteConfirmUser(null)}
                  className="px-4 py-2.5 rounded-xl text-xs font-semibold text-white/70 hover:text-white cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => handleDeleteUser(deleteConfirmUser)}
                  className="px-5 py-2.5 rounded-xl text-xs font-bold bg-red-500 hover:bg-red-600 text-white shadow-lg cursor-pointer transition-all"
                >
                  Permanently Delete
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  )
}
