import { createClient } from "@supabase/supabase-js"

const supabaseUrl = (process.env.NEXT_PUBLIC_SUPABASE_URL || "").trim()
const supabasePublishableKey = (
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  ""
).trim()

export const isSupabaseConfigured = Boolean(supabaseUrl && supabasePublishableKey)

export const supabase = isSupabaseConfigured
  ? createClient(supabaseUrl, supabasePublishableKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
      },
    })
  : null

export async function resolveCurrentUserId(): Promise<string | null> {
  if (isSupabaseConfigured && supabase) {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (user?.id) return user.id

      const { data: { session } } = await supabase.auth.getSession()
      if (session?.user?.id) return session.user.id
    } catch {
      // Ignore auth resolution error
    }
  }

  if (typeof window !== "undefined") {
    return localStorage.getItem("spendly_auth_user_id")
  }
  return null
}
