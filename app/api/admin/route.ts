import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

const supabaseUrl = (process.env.NEXT_PUBLIC_SUPABASE_URL || "").trim()
const serviceRoleKey = (
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  ""
).trim()

const adminEmail = (process.env.ADMIN_EMAIL || "themazen21@gmail.com").trim().toLowerCase()

function getAdminClient() {
  return createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  })
}

async function verifyAdmin(req: NextRequest) {
  const authHeader = req.headers.get("authorization")
  const token = authHeader?.replace(/^Bearer\s+/i, "")

  if (!token) {
    return { authorized: false, error: "No authorization token provided." }
  }

  const supabase = getAdminClient()
  const { data: { user }, error } = await supabase.auth.getUser(token)

  if (error || !user || !user.email) {
    return { authorized: false, error: "Invalid user session." }
  }

  const userEmail = user.email.toLowerCase()

  // Layer 1: Check admin email
  if (userEmail !== adminEmail) {
    return { authorized: false, error: "Email unauthorized for admin access." }
  }

  // Layer 2: Check is_admin in profiles table or user metadata
  const { data: profile } = await supabase
    .from("profiles")
    .select("is_admin, is_banned")
    .eq("id", user.id)
    .maybeSingle()

  const isMetadataAdmin = Boolean(user.user_metadata?.is_admin)
  const isProfileAdmin = Boolean(profile?.is_admin)

  // If user matches ADMIN_EMAIL, we grant access and self-heal is_admin in profile
  if (!isProfileAdmin && userEmail === adminEmail) {
    await supabase.from("profiles").upsert({
      id: user.id,
      is_admin: true,
      email: userEmail,
    })
  } else if (!isProfileAdmin && !isMetadataAdmin) {
    return { authorized: false, error: "User is not marked as admin." }
  }

  return { authorized: true, user }
}

export async function GET(req: NextRequest) {
  const authCheck = await verifyAdmin(req)
  if (!authCheck.authorized) {
    return NextResponse.json({ error: authCheck.error }, { status: 403 })
  }

  const supabase = getAdminClient()

  try {
    // 1. Fetch users from auth.admin if service key available, else from profiles
    let usersList: any[] = []
    try {
      const { data: authUsers } = await supabase.auth.admin.listUsers()
      if (authUsers?.users) {
        usersList = authUsers.users.map((u) => ({
          id: u.id,
          email: u.email,
          created_at: u.created_at,
          last_sign_in_at: u.last_sign_in_at,
          raw_user_meta_data: u.user_metadata,
        }))
      }
    } catch {
      // Service role key might not have admin rights or using anon fallback
    }

    // 2. Fetch profiles, transactions, accounts, bills, held funds
    const [profilesRes, txRes, accRes, billRes, hfRes] = await Promise.all([
      supabase.from("profiles").select("*"),
      supabase.from("transactions").select("id, user_id, amount_cents, type, is_fee"),
      supabase.from("accounts").select("id, user_id, name, type, starting_balance_cents, currency"),
      supabase.from("bills").select("id, user_id, amount_cents, is_completed"),
      supabase.from("held_funds").select("id, user_id, name, balance_cents, type"),
    ])

    const profiles = profilesRes.data || []
    const transactions = txRes.data || []
    const accounts = accRes.data || []
    const bills = billRes.data || []
    const heldFunds = hfRes.data || []

    // Merge auth users with profiles
    const mergedUserMap = new Map<string, any>()

    usersList.forEach((u) => {
      mergedUserMap.set(u.id, {
        id: u.id,
        email: u.email || "No email",
        fullName: u.raw_user_meta_data?.full_name || u.raw_user_meta_data?.firstName || "User",
        username: u.raw_user_meta_data?.username || `@${(u.email || "user").split("@")[0]}`,
        created_at: u.created_at,
        is_admin: Boolean(u.raw_user_meta_data?.is_admin),
        is_banned: Boolean(u.raw_user_meta_data?.is_banned),
      })
    })

    profiles.forEach((p) => {
      const existing = mergedUserMap.get(p.id) || { id: p.id }
      mergedUserMap.set(p.id, {
        ...existing,
        id: p.id,
        email: p.email || existing.email || "No email",
        fullName: p.full_name || existing.fullName || "User",
        username: p.username ? (p.username.startsWith("@") ? p.username : `@${p.username}`) : existing.username || "@user",
        created_at: p.created_at || existing.created_at || new Date().toISOString(),
        is_admin: Boolean(p.is_admin || existing.is_admin),
        is_banned: Boolean(p.is_banned || existing.is_banned),
      })
    })

    // Also include any user IDs found in accounts/transactions
    const allUserIds = new Set([
      ...Array.from(mergedUserMap.keys()),
      ...transactions.map((t) => t.user_id),
      ...accounts.map((a) => a.user_id),
    ])

    allUserIds.forEach((uid) => {
      if (uid && !mergedUserMap.has(uid)) {
        mergedUserMap.set(uid, {
          id: uid,
          email: "Active User",
          fullName: "User",
          username: `@user_${uid.slice(0, 5)}`,
          created_at: new Date().toISOString(),
          is_admin: false,
          is_banned: false,
        })
      }
    })

    // Aggregate metrics per user
    const usersWithStats = Array.from(mergedUserMap.values()).map((user) => {
      const userTxs = transactions.filter((t) => t.user_id === user.id)
      const userAccs = accounts.filter((a) => a.user_id === user.id)
      const userBills = bills.filter((b) => b.user_id === user.id)
      const userHf = heldFunds.filter((h) => h.user_id === user.id)

      const totalIncomeCents = userTxs
        .filter((t) => t.type === "income" && !t.is_fee)
        .reduce((sum, t) => sum + (t.amount_cents || 0), 0)

      const totalExpenseCents = userTxs
        .filter((t) => t.type === "expense")
        .reduce((sum, t) => sum + (t.amount_cents || 0), 0)

      const netBalanceCents = totalIncomeCents - totalExpenseCents

      const parsedAccs = userAccs.map((a) => {
        const startCents = a.starting_balance_cents || 0
        const accTxsSum = userTxs
          .filter((t) => t.account_id === a.id)
          .reduce((sum, t) => sum + (t.type === "income" ? (t.amount_cents || 0) : -(t.amount_cents || 0)), 0)
        return {
          id: a.id,
          name: a.name,
          type: a.type,
          currency: a.currency || "EGP",
          balance: (startCents + accTxsSum) / 100,
        }
      })

      return {
        ...user,
        transactionCount: userTxs.length,
        accountCount: userAccs.length,
        billCount: userBills.length,
        heldFundCount: userHf.length,
        totalIncome: totalIncomeCents / 100,
        totalExpenses: totalExpenseCents / 100,
        netBalance: netBalanceCents / 100,
        accounts: parsedAccs,
      }
    })

    // App-wide stats
    const totalAppIncomeCents = transactions
      .filter((t) => t.type === "income" && !t.is_fee)
      .reduce((sum, t) => sum + (t.amount_cents || 0), 0)

    const totalAppExpenseCents = transactions
      .filter((t) => t.type === "expense")
      .reduce((sum, t) => sum + (t.amount_cents || 0), 0)

    const stats = {
      totalUsers: usersWithStats.length,
      totalTransactions: transactions.length,
      totalAccounts: accounts.length,
      totalBills: bills.length,
      totalIncome: totalAppIncomeCents / 100,
      totalExpenses: totalAppExpenseCents / 100,
    }

    return NextResponse.json({
      stats,
      users: usersWithStats,
    })
  } catch (err: any) {
    console.error("Admin GET error:", err)
    return NextResponse.json({ error: err?.message || "Failed to load admin data." }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  const authCheck = await verifyAdmin(req)
  if (!authCheck.authorized) {
    return NextResponse.json({ error: authCheck.error }, { status: 403 })
  }

  const supabase = getAdminClient()

  try {
    const body = await req.json()
    const { action, targetUserId, isBanned } = body

    if (!targetUserId) {
      return NextResponse.json({ error: "Target user ID is required." }, { status: 400 })
    }

    if (action === "toggle_ban") {
      const nextBanned = Boolean(isBanned)

      // 1. Update profiles table
      const { error: profErr } = await supabase
        .from("profiles")
        .update({ is_banned: nextBanned })
        .eq("id", targetUserId)

      // 2. Update auth metadata if possible
      try {
        await supabase.auth.admin.updateUserById(targetUserId, {
          user_metadata: { is_banned: nextBanned },
        })
      } catch {
        // Ignore if service role lacks auth.admin
      }

      if (profErr) {
        return NextResponse.json({ error: profErr.message }, { status: 500 })
      }

      return NextResponse.json({ success: true, is_banned: nextBanned })
    }

    if (action === "delete_user") {
      // Atomically delete all rows across all tables in foreign key order
      await supabase.from("transactions").delete().eq("user_id", targetUserId)
      await supabase.from("held_fund_history").delete().eq("user_id", targetUserId)
      await supabase.from("held_funds").delete().eq("user_id", targetUserId)
      await supabase.from("bills").delete().eq("user_id", targetUserId)
      await supabase.from("notifications").delete().eq("user_id", targetUserId)
      await supabase.from("categories").delete().eq("user_id", targetUserId)
      await supabase.from("accounts").delete().eq("user_id", targetUserId)
      await supabase.from("profiles").delete().eq("id", targetUserId)

      // Delete from auth if possible
      try {
        await supabase.auth.admin.deleteUser(targetUserId)
      } catch {
        // Ignore
      }

      return NextResponse.json({ success: true, deletedUserId: targetUserId })
    }

    return NextResponse.json({ error: "Invalid action." }, { status: 400 })
  } catch (err: any) {
    console.error("Admin POST error:", err)
    return NextResponse.json({ error: err?.message || "Failed to execute admin action." }, { status: 500 })
  }
}
